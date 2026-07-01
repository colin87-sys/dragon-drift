import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { colliders, clearAhead } from './obstacles.js';
import { cameraCtl } from './cameraController.js';
import { ui } from './ui.js';
import { sfx, setSlowMo } from './sfx.js';
import { triggerDeathBurst } from './dragon.js';
import { burst, gateThreadBurst, nearMissSparks, phaseBurst } from './particles.js';
import { comboTier } from './util.js';
import { saveData, persist } from './save.js';
import { emit } from './events.js';
import { juiceEvent } from './juice.js';

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
      // First-ever Surge wall: cue the phase teaching prompt during the dilation.
      if (c.type === 'gate' && game.feverActive && !saveData.flags.phaseTaught) {
        emit('surgeWallSlowMo');
      }
      return;
    }
  }
}

export function updateCollision(dt, player) {
  if (game.state !== 'playing') return;
  if (invuln > 0) invuln -= dt;
  // During a boss fight the course hazards are suppressed (boss.js wipes them and
  // main.js stops spawning new ones) — bullets are the only threat, handled by the
  // bullet pool via hitPlayer(). We still enforce the lane walls / floor below.
  if (!game.inBoss) checkSlowMo(dt, player);
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
  // Canyon ceiling: inside a Sky Canyon run you can't just climb over the rock to
  // skip it — the top of the lane is capped (bounce + chip, like the ground).
  if (game.inCanyon && p.y > CONFIG.canyonCeilingY) {
    p.y = CONFIG.canyonCeilingY;
    player.velocity.y = Math.min(player.velocity.y, -6);
    hit(player, 0, 0, CONFIG.canyonCeilingDamage, 'ceiling');
  }

  if (!game.inBoss) for (const c of colliders) {
    const dz = player.dist - c.dist;
    // Most colliders are thin; a ribcage section is a long tube (c.depthHalf),
    // so widen the broad-phase reject for it.
    if (Math.abs(dz) > 28 + (c.depthHalf || 0)) continue;

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
          // Surge phase-through: during Dragon Surge, a well-timed barrel roll
          // (active i-frames) + enough stamina shatters the wall instead of
          // crashing. Once shattered, this wall stays passable while we're in
          // its z-range (c.phased), so we don't re-crash on the next frame.
          if (!c.phased) {
            const canPhase = game.feverActive &&
              player.rollInvuln > 0 &&
              game.stamina >= CONFIG.phaseStaminaCost;
            if (canPhase) {
              c.phased = true;
              game.stamina -= CONFIG.phaseStaminaCost;
              phaseThroughGate(c, player);
            } else if (game.feverActive && !saveData.flags.phaseTaught) {
              // No-fail first teach: rather than ending the run on the lesson,
              // the dragon auto-rolls and phases through as a one-time demo.
              c.phased = true;
              player.tryRoll(Math.sign(c.gapX - p.x) || 1);
              phaseThroughGate(c, player, { assisted: true });
            } else {
              crash(player, 'gate');
              return;
            }
          }
        } else {
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

    } else if (c.type === 'rockGap') {
      // Sky Canyon rock gate: each rock mass is an AABB. Hitting one is health
      // damage (NON-fatal, roll-clearable via i-frames in hit()), not a crash.
      // Slipping past a rock face close = near miss. The gap itself is clear.
      let struck = false, grazed = false;
      for (const b of c.boxes) {
        // b.oz lets a ribcage wall sit at a specific rib's depth, so the swept
        // corridor's collision follows the bone instead of being one straight tube.
        if (Math.abs(dz + (b.oz || 0)) >= b.hz + R) continue;
        const mx = Math.abs(p.x - b.cx);
        const my = Math.abs(p.y - b.cy);
        // Slightly inset solid box = forgiving edge scrapes.
        if (mx < b.hw * 0.85 + R * 0.5 && my < b.hh * 0.85 + R * 0.5) { struck = true; break; }
        if (mx < b.hw + 1.6 && my < b.hh + 1.6) grazed = true;
      }
      if (struck) {
        hit(player, Math.sign(p.x - c.gapX) || 1, Math.sign(p.y - c.gapY) || 0, CONFIG.obstacleDamage, 'rock');
      } else if (grazed) {
        awardNearMiss(c, player);
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
  cameraCtl.gateKick();
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
    juiceEvent('surgeStart');
    emit('surge');
  }
}

// Surge phase-through: shatter the crystal wall instead of crashing. Tiered like a
// perfect ring — a cleanly-timed roll (lots of i-frame window left at the wall) is a
// PERFECT phase (big payoff, partial stamina refund, streak chime); a last-instant
// scrape is a minor phase. `opts.assisted` is the one-time no-fail teaching demo:
// minor tier, no score/stamina change, a coaching popup. Combo and Surge stay intact.
function phaseThroughGate(c, player, opts = {}) {
  const assisted = !!opts.assisted;
  const perfect = !assisted && player.rollInvuln >= CONFIG.phasePerfectWindow;

  if (perfect) {
    game.phaseStreak++;
    game.stamina = Math.min(CONFIG.staminaMax, game.stamina + CONFIG.phasePerfectStaminaRefund);
  } else {
    game.phaseStreak = 0;
  }

  const bonus = perfect ? CONFIG.phaseBonus + CONFIG.phasePerfectBonus : CONFIG.phaseBonus;
  const points = Math.round(bonus * game.combo * game.scoreMult);
  if (!assisted) game.score += points; // the teaching demo doesn't pad the score

  // Wall shatter (transform-only scatter, animated in obstacles.js).
  c.shatterT = CONFIG.phaseShatterDur;
  c.shatterBig = perfect;

  phaseBurst(player.position, perfect);
  cameraCtl.shake(perfect ? 1.1 : 0.5);
  juiceEvent(perfect ? 'phasePerfect' : 'phase');
  if (perfect) ui.phaseFlash();
  sfx.phase(perfect, game.phaseStreak);
  ui.phasePopup(points, perfect, game.phaseStreak, assisted);

  // First wall resolved (rolled or demoed) → the move is learned; no more no-fail net.
  if (!saveData.flags.phaseTaught) { saveData.flags.phaseTaught = true; persist(); }
  emit('phase');
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
  juiceEvent('nearMiss'); // a breath of hitstop — the close call registers
  emit('nearMiss');
}

function hit(player, pushX, pushY, damage = CONFIG.obstacleDamage, cause = 'shard') {
  if (invuln > 0) return;
  // Barrel-roll i-frames: damage is dodged, and the near-miss checks above
  // keep firing — rolling through a cluster showers bonuses instead. The lane
  // boundaries (ground / canyon ceiling) ignore i-frames so you can't roll-cheese
  // a limit.
  if (player.rollInvuln > 0 && cause !== 'ground' && cause !== 'ceiling') return;
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
  // A bullet hit ends the graze streak + any surge UNCONDITIONALLY (the combo-gated
  // reset above rarely fires in a boss, where combo sits at 1) — grazing is a
  // risk/reward line: get clipped and you lose the charge you skimmed for.
  if (cause === 'bullet') {
    game.bossHitsTakenRun++;
    game.consecutiveRings = 0;
    game.grazeCharge = 0;
    if (game.feverActive) { game.feverActive = false; game.feverTimer = 0; }
  }
  if (game.health <= 0) die(player, cause, false);
}

// Boss bullet damage — routed through hit() so it respects invuln + barrel-roll
// i-frames exactly like every other hazard (dodging a bullet by rolling is free).
export function hitPlayer(player, damage, cause = 'bullet') {
  hit(player, 0, 0, damage, cause);
}

// Grazing a bullet — skimming it inside the graze band but NOT getting hit —
// charges Dragon Surge, the "drift" identity transplanted from rings onto danmaku.
// Each bullet grazes once (at its plane-crossing frame), so no per-bullet cooldown
// is needed. Fractional charge accumulates into whole surge-meter steps
// (consecutiveRings), which the existing gem HUD shows and which auto-fires Surge
// at the usual threshold — the same path a ring or gate takes.
export function bulletGraze(player) {
  game.grazesRun++;
  const bonus = Math.round(CONFIG.BOSS.grazeScore * game.combo * game.scoreMult);
  game.score += bonus;
  nearMissSparks(player.position);
  sfx.nearMiss();
  emit('bossGraze');
  game.grazeCharge += CONFIG.BOSS.grazeGain;
  while (game.grazeCharge >= 1) {
    game.grazeCharge -= 1;
    game.consecutiveRings++;
  }
  if (!game.feverActive && game.consecutiveRings >= game.feverThreshold) {
    game.feverActive = true;
    game.feverTimer = CONFIG.feverDuration;
    game.markSurgeSeen();
    ui.feverStart();
    sfx.feverStart();
    juiceEvent('surgeStart');
    emit('surge');
  }
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
  cameraCtl.deathCam();  // slow push-in across the freeze
  juiceEvent('death');   // grade-to-gray across the freeze
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
