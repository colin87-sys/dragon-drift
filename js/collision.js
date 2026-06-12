import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { colliders, clearAhead } from './obstacles.js';
import { cameraCtl } from './cameraController.js';
import { ui } from './ui.js';
import { sfx, setSlowMo } from './sfx.js';
import { triggerDeathBurst } from './dragon.js';
import { burst, gateThreadBurst, nearMissSparks } from './particles.js';
import { comboTier } from './util.js';
import { saveData, persist } from './save.js';
import { emit } from './events.js';

// Near-miss cooldown: track per-collider so same obstacle can't spam
const nearMissCooldowns = new WeakMap();

let invuln = 0;
let slowMoCooldown = 0;

export function resetCollision() {
  invuln = 0;
  slowMoCooldown = 0;
}

// Near-death slow-mo: when the next hit would end the run and something on
// the current trajectory is about to connect, time dilates for a beat —
// one last chance to dodge (or barrel-roll through it). Can be switched off
// in settings for a permanent score bonus.
function checkSlowMo(dt, player) {
  slowMoCooldown -= dt;
  if (!saveData.settings.slowMo) return;
  if (slowMoCooldown > 0 || game.slowMoTimer > 0) return;
  const lethalHealth = game.health <= CONFIG.obstacleDamage;
  const p = player.position;
  for (const c of colliders) {
    const dz = c.dist - player.dist;
    const horizon = c.type === 'gate' ? player.speed * 0.32 : player.speed * 0.55;
    if (dz < 4 || dz > horizon) continue;
    const t = dz / Math.max(player.speed, 1);
    const fx = p.x + player.velocity.x * t;
    const fy = p.y + player.velocity.y * t;
    let danger = false;
    if (c.type === 'gate') {
      // Gates kill at any health
      danger = Math.abs(fx - c.gapX) > c.gapW - 0.6 || Math.abs(fy - c.gapY) > c.gapH - 0.6;
    } else if (lethalHealth) {
      if (c.type === 'pillar') danger = Math.abs(fx - c.x) < c.r * 0.9 && fy < c.h;
      else if (c.type === 'shard') danger = Math.hypot(fx - c.x, fy - (c.dynamic ? c.baseY : c.y)) < c.r * 1.2;
      else if (c.type === 'bar') danger = Math.abs(fy - c.y) < c.r + 0.8;
    }
    if (danger) {
      slowMoCooldown = 6;
      game.slowMoTimer = 0.6;
      setSlowMo(true);
      return;
    }
  }
}

export function updateCollision(dt, player) {
  if (game.state !== 'playing') return;
  if (invuln > 0) invuln -= dt;
  checkSlowMo(dt, player);
  const p = player.position;
  const R = CONFIG.playerRadius;

  // Tick down near-miss cooldowns
  for (const c of colliders) {
    const cd = nearMissCooldowns.get(c);
    if (cd !== undefined && cd > 0) nearMissCooldowns.set(c, cd - dt);
  }

  // Canyon walls: fatal
  if (p.x > CONFIG.laneHalfWidth || p.x < -CONFIG.laneHalfWidth) {
    crash(player, 'wall');
    return;
  }
  // Ground: bounce + chip
  if (p.y < CONFIG.laneMinY) {
    p.y = CONFIG.laneMinY;
    player.velocity.y = Math.max(player.velocity.y, 6);
    hit(player, 0, 0, CONFIG.groundDamage, 'ground');
  }

  for (const c of colliders) {
    const dz = player.dist - c.dist;
    if (Math.abs(dz) > 28) continue;

    if (c.type === 'pillar') {
      // Reduced hitbox (0.65 instead of 0.8) = more forgiving side scrapes
      const horiz = Math.hypot(p.x - c.x, dz);
      const hitR   = c.r * 0.65 + R;
      const nearR  = c.r * 1.5 + R;
      if (horiz < hitR && p.y < c.h) {
        hit(player, Math.sign(p.x - c.x) || 1, 0, CONFIG.obstacleDamage, 'pillar');
      } else if (horiz < nearR && horiz >= hitR && p.y < c.h) {
        awardNearMiss(c, player);
      }

    } else if (c.type === 'shard') {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const dist3 = Math.sqrt(dx * dx + dy * dy + dz * dz);
      // Reduced effective radius by ~30%: shard looks bigger than its hitbox
      const hitR  = c.r * 0.70 + R;
      const nearR = c.r * 1.8 + R;
      if (dist3 < hitR) {
        hit(player, Math.sign(dx) || 1, 0, CONFIG.obstacleDamage, 'shard');
      } else if (dist3 < nearR) {
        awardNearMiss(c, player);
      }

    } else if (c.type === 'bar') {
      if (Math.abs(dz) < c.r + R && Math.abs(p.y - c.y) < c.r * 0.75 + R) {
        hit(player, 0, p.y > c.y ? 1 : -1, CONFIG.obstacleDamage, 'bar');
      } else if (Math.abs(dz) < c.r * 2 + R && Math.abs(p.y - c.y) < c.r * 1.6 + R) {
        awardNearMiss(c, player);
      }

    } else if (c.type === 'gate') {
      if (Math.abs(dz) < c.thick + R) {
        const inGap =
          Math.abs(p.x - c.gapX) < c.gapW - 0.5 &&
          Math.abs(p.y - c.gapY) < c.gapH - 0.5;
        if (!inGap) {
          crash(player, 'gate');
          return;
        }
        if (!c.passed) {
          c.passed = true;
          threadGate(player);
        }
        // Threading through gate close to the edge = near miss
        const marginX = c.gapW - Math.abs(p.x - c.gapX);
        const marginY = c.gapH - Math.abs(p.y - c.gapY);
        if (Math.min(marginX, marginY) < 1.2) {
          awardNearMiss(c, player);
        }
      }
    }
    if (game.state !== 'playing') return;
  }
}

// Threading a window pays like a ring: score, combo, stamina, fever progress.
function threadGate(player) {
  const feverBonus = game.feverActive ? CONFIG.feverMultiplier : 1;
  const points = Math.round(CONFIG.gateScore * game.combo * feverBonus * game.scoreMult);
  game.score += points;
  const tierBefore = comboTier(game.combo);
  game.combo = Math.min(CONFIG.comboMax, game.combo + CONFIG.comboStep);
  game.maxCombo = Math.max(game.maxCombo, game.combo);
  game.consecutiveRings++;
  game.stamina = Math.min(CONFIG.staminaMax, game.stamina + CONFIG.gateStamina);
  if (game.feverActive) {
    game.feverTimer = Math.min(game.feverTimer + 1.2, CONFIG.feverDuration);
  }
  ui.gatePopup(points);
  sfx.gate();
  gateThreadBurst(player.position);
  emit('gate');
  const tierAfter = comboTier(game.combo);
  if (tierAfter > tierBefore) sfx.comboUp(tierAfter);
  if (!game.feverActive && game.consecutiveRings >= game.feverThreshold) {
    game.feverActive = true;
    game.feverTimer = CONFIG.feverDuration;
    game.markSurgeSeen();
    ui.feverStart();
    sfx.feverStart();
    burst(player.position, 0xff88ff, { count: 30, speed: 16, size: 1.3 });
    emit('surge');
  }
}

function awardNearMiss(collider, player) {
  const cd = nearMissCooldowns.get(collider) || 0;
  if (cd > 0) return;
  nearMissCooldowns.set(collider, CONFIG.nearMissCooldown);
  game.nearMisses++;
  const bonus = Math.round(CONFIG.nearMissBonus * game.combo * game.scoreMult);
  game.score += bonus;
  ui.nearMissPopup(bonus);
  sfx.nearMiss();
  nearMissSparks(player.position);
  emit('nearMiss');
}

function hit(player, pushX, pushY, damage = CONFIG.obstacleDamage, cause = 'shard') {
  if (invuln > 0) return;
  // Barrel-roll i-frames: damage is dodged, and the near-miss checks above
  // keep firing — rolling through a cluster showers bonuses instead.
  if (player.rollInvuln > 0 && cause !== 'ground') return;
  invuln = CONFIG.invulnTime;
  game.health = Math.max(0, game.health - damage);
  if (pushX) player.velocity.x += pushX * 10;
  if (pushY) player.velocity.y += pushY * 8;
  cameraCtl.shake(0.8);
  ui.damageFlash();
  sfx.damage();
  // Breaking a combo on damage
  if (game.combo > 1) {
    game.consecutiveRings = 0;
    if (game.feverActive) { game.feverActive = false; game.feverTimer = 0; }
  }
  emit('damage', { m: player.dist });
  if (game.health <= 0) die(player, cause, false);
}

function crash(player, cause) {
  game.health = 0;
  cameraCtl.shake(2.8);
  die(player, cause, true);
}

function die(player, cause, lethal) {
  // Revive offer: if a token is banked and unused this run, freeze on the
  // brink instead of ending the run.
  if (saveData.revives > 0 && !game.reviveUsed) {
    game.state = 'dying';
    game.pendingDeath = { cause, lethal };
    sfx.damage();
    ui.damageFlash(lethal);
    ui.showReviveOffer();
    return;
  }
  finishDeath(player, cause, lethal);
}

// Real death — either no token, or the offer was declined / timed out.
export function finishDeath(player, cause, lethal) {
  game.state = 'gameover';
  game.deathCause = cause;
  game.deathFreezeTimer = CONFIG.deathFreezeDuration;
  triggerDeathBurst(player.position.clone(), lethal);
  sfx.crash();
  ui.damageFlash(lethal);
}

// Burn a revive token: restored to the sky with a cleared path ahead.
export function acceptRevive(player) {
  saveData.revives--;
  persist();
  game.reviveUsed = true;
  game.pendingDeath = null;
  game.health = 60;
  game.stamina = CONFIG.staminaMax;
  invuln = 2.5;
  // Lift out of wall/water contact so the same frame can't re-kill.
  player.position.x = Math.max(-CONFIG.laneHalfWidth + 2, Math.min(CONFIG.laneHalfWidth - 2, player.position.x));
  player.position.y = Math.max(player.position.y, CONFIG.laneMinY + 3);
  player.velocity.set(0, 0);
  clearAhead(player.dist + 120);
  game.state = 'playing';
}
