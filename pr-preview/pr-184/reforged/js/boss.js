import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx } from './sfx.js';
import { cameraCtl } from './cameraController.js';
import { burst } from './particles.js';
import { emit, on } from './events.js';
import { clearAhead } from './obstacles.js';
import { buildBoss } from './bossModel.js';
import { bossDefForIndex } from './bossDefs.js';
import {
  initBossBullets, updateBossBullets, spawnBossBullet, resetBossBullets,
  setBossBulletQuality, bossBulletCount,
} from './bossBullets.js';

// Boss encounter controller. A boss is an OVERLAY on the normal flight (gated by
// game.inBoss, mirroring game.inCanyon): forward motion continues, the boss holds
// a fixed player-relative distance ahead ("flies backward"), and the whole thing
// tears down cleanly back into the endless run. State machine:
//   idle → warn → approach → fight → dying → (teardown) → idle
// The rider's auto-attack is the steady chip that wins the fight if you survive;
// bullets are dodged by steering (barrel-roll i-frames negate a hit for free).

let scene = null;
let quality = 1;

const B = CONFIG.BOSS;

// Encounter scheduling (independent of the level RNG → course stays deterministic).
let debugFirstAt = null;       // ?boss override: bring the first encounter in early
let nextBossDist = B.firstAt;
let encounterIndex = 0;

// Live encounter state.
let active = false;
let phase = 'idle';            // idle | warn | approach | fight | dying
let def = null;
let model = null;
let group = null;
let hp = 0, hpMax = 0;
let phaseIdx = 0;
let warnT = 0;
let approachT = 0;
let attackTimer = 0;
let riderTimer = 0;
let dyingT = 0;
let spiralPhase = 0;
let pendingDeath = false;      // set when hp hits 0; resolved in the update loop

// Player-relative pose: rel = metres ahead of the player.
const pose = { x: 0, y: B.fightHeight, rel: B.settleGap };
const start = { x: 0, y: 7, rel: -12 };
const tmp = new THREE.Vector3();

const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

export function initBoss(sc) {
  scene = sc;
  initBossBullets(scene);
  on('bossDamage', (e) => damageBoss(e.amount, e.kind));
}

export function setBossQuality(q) {
  quality = q;
  setBossBulletQuality(q);
}

export function bossActive() { return active; }

// ---- Encounter lifecycle ----------------------------------------------------

export function startBossEncounter(player, defOverride) {
  if (active) return;
  active = true;
  def = defOverride || bossDefForIndex(encounterIndex);
  hpMax = def.hpMax;
  hp = hpMax;
  phaseIdx = 0;
  spiralPhase = 0;

  model = buildBoss(def, quality);
  group = model.group;
  scene.add(group);

  // Approach choreography: come in from behind (overtake up and over) or sweep
  // in from the side, then settle dead ahead and face the player.
  if (def.approachFrom === 'side') {
    start.rel = B.settleGap;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 22;
    start.y = B.fightHeight;
  } else {
    start.rel = -12;
    start.x = (Math.random() < 0.5 ? -1 : 1) * 4;
    start.y = 7;
  }
  pose.x = start.x; pose.y = start.y; pose.rel = start.rel;
  placeGroup(player, 0);

  // Suppress the normal course for the fight: wipe hazards already spawned ahead;
  // spawnAhead() stops laying new ones while game.inBoss is true (see main.js).
  clearAhead(player.dist + 800);
  game.inBoss = true;
  game.bossHitsTakenRun = 0;

  phase = 'warn';
  warnT = B.warnTime;
  approachT = 0;
  attackTimer = 0;
  riderTimer = B.riderShotInterval;

  ui.bossBanner?.(`⚠  ${def.name}  ⚠`, def.title);
  sfx.feverStart?.();
  cameraCtl.shake?.(1.2);
  emit('bossStart', { id: def.id });
}

function endEncounter(player) {
  if (group) { scene.remove(group); model.dispose?.(); }
  resetBossBullets();
  group = null; model = null; def = null;
  active = false;
  phase = 'idle';
  game.inBoss = false;
  encounterIndex++;
  nextBossDist = player.dist + B.interval + Math.random() * B.intervalJitter;
}

function startDeath(player) {
  phase = 'dying';
  dyingT = 0;
  resetBossBullets();
  game.bossesDefeatedRun++;
  const bonus = Math.round(B.defeatScore * game.scoreMult);
  game.score += bonus;
  ui.bossBanner?.('✦  SLAIN  ✦', `+${bonus}`);
  sfx.record?.();
  cameraCtl.shake?.(2.0);
  emit('bossDefeated', { id: def.id, bonus, noHit: game.bossHitsTakenRun === 0 });
}

// ---- Per-frame update -------------------------------------------------------

export function updateBoss(dt, player, time) {
  if (!active) {
    // Trigger a fresh encounter once the player flies past the scheduled mark
    // (never inside a canyon, never on the menu).
    if (game.state === 'playing' && !game.inCanyon && player.dist >= nextBossDist) {
      startBossEncounter(player);
    }
    return;
  }

  updateBossBullets(dt, player);
  model.tick(dt, time);

  // hp reached 0 last frame → begin the disintegration (needs the player ref).
  if (pendingDeath && phase === 'fight') {
    pendingDeath = false;
    startDeath(player);
  }

  if (phase === 'warn') {
    warnT -= dt;
    if (warnT <= 0) phase = 'approach';
  } else if (phase === 'approach') {
    approachT += dt;
    const k = Math.min(approachT / B.approachTime, 1);
    const e = easeInOut(k);
    pose.x = start.x + (0 - start.x) * e;
    pose.rel = start.rel + (B.settleGap - start.rel) * e;
    // Arc up and over the player on a behind-approach so it never clips the dragon.
    const arc = def.approachFrom === 'side' ? 0 : Math.sin(k * Math.PI) * 6;
    pose.y = start.y + (B.fightHeight - start.y) * e + arc;
    if (k >= 1) {
      phase = 'fight';
      attackTimer = rand(0.6, 1.0);
    }
  } else if (phase === 'fight') {
    // Hold station ahead and "fly backward"; gentle strafe/bob keeps it alive.
    pose.rel = B.settleGap;
    pose.x = Math.sin(time * 0.7) * 5.0;
    pose.y = B.fightHeight + Math.sin(time * 1.3) * 0.8;

    riderTimer -= dt;
    if (riderTimer <= 0) {
      riderTimer = B.riderShotInterval;
      fireRiderShot(player);
    }
    attackTimer -= dt;
    if (attackTimer <= 0) {
      const ph = def.phases[phaseIdx];
      const id = ph.attacks[(Math.random() * ph.attacks.length) | 0];
      fireAttack(id, player);
      attackTimer = rand(ph.cadence[0], ph.cadence[1]);
    }
  } else if (phase === 'dying') {
    dyingT += dt;
    model.setDissolve(dyingT / B.deathTime);
    if (Math.random() < 0.6) {
      tmp.set(pose.x + (Math.random() - 0.5) * 4, pose.y + (Math.random() - 0.5) * 4,
        -(player.dist + pose.rel));
      burst(tmp, def.glow, { count: 5, speed: 12, size: 1.0, life: 0.7 });
    }
    if (dyingT >= B.deathTime) { endEncounter(player); return; }
  }

  placeGroup(player, time);
}

function placeGroup(player, time) {
  if (!group) return;
  group.position.set(pose.x, pose.y, -(player.dist + pose.rel));
  // Face the player (local +z = front maw, world +z = toward the player) with a
  // little menacing yaw/roll wobble.
  group.rotation.set(0, Math.sin(time * 0.5) * 0.12, Math.sin(time * 0.9) * 0.08);
}

// ---- Attacks ----------------------------------------------------------------

// Solve the lateral velocity that puts a bullet on a target point as it closes.
function aimVel(targetX, targetY, closing) {
  const t = Math.max(pose.rel / closing, 0.05);
  return { vx: (targetX - pose.x) / t, vy: (targetY - pose.y) / t };
}

function fireAttack(id, player) {
  const closing = B.bulletSpeed;
  const lead = 0.25;
  const px = player.position.x + player.velocity.x * lead;
  const py = player.position.y + player.velocity.y * lead;

  if (id === 'aimed') {
    for (let i = -1; i <= 1; i++) {
      const v = aimVel(px + i * 1.2, py, closing);
      spawnBoss(v.vx, v.vy, -closing, def.accent, false);
    }
  } else if (id === 'fan') {
    const n = quality < 0.75 ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const spread = (i / (n - 1) - 0.5) * 16;   // ±8m across the lane around the player
      const v = aimVel(px + spread, py, closing);
      spawnBoss(v.vx, v.vy, -closing, def.accent, false);
    }
  } else if (id === 'spiral') {
    const n = quality < 0.75 ? 8 : 11;
    spiralPhase += 0.6;
    const slow = closing * 0.78;
    for (let i = 0; i < n; i++) {
      const a = spiralPhase + (i / n) * Math.PI * 2;
      spawnBoss(Math.cos(a) * 9, Math.sin(a) * 9, -slow, def.glow, false);
    }
  }
}

function spawnBoss(vx, vy, vrel, color, reflectable) {
  spawnBossBullet({
    owner: 'boss', x: pose.x, y: pose.y, rel: pose.rel,
    vx, vy, vrel, color, reflectable,
    dmg: B.bulletDamage, r: B.bulletRadius, life: 6,
  });
}

// Rider auto-attack: a homing chip shot fired from beside the player up at the boss.
function fireRiderShot(player) {
  const ox = player.position.x + 0.6;
  const oy = player.position.y + 0.4;
  const t = Math.max((pose.rel - 1.5) / B.bossSpeed, 0.05);
  spawnBossBullet({
    owner: 'rider', x: ox, y: oy, rel: 1.5,
    vx: (pose.x - ox) / t, vy: (pose.y - oy) / t, vrel: B.bossSpeed,
    targetRel: pose.rel, tx: pose.x, ty: pose.y,
    color: 0x8fe9ff, dmg: B.riderShotDamage, r: 0.45, life: 4,
  });
}

function damageBoss(amount, kind) {
  if (phase !== 'fight') return;
  hp = Math.max(0, hp - amount);
  model.flash(0.6);
  emit('bossHit', { hp, hpMax, frac: hp / hpMax, kind });

  // Phase advance: when hp drops into the next phase's band.
  const next = def.phases[phaseIdx + 1];
  if (next && hp / hpMax <= next.atFrac) {
    phaseIdx++;
    resetBossBullets();
    model.flash(1.0);
    cameraCtl.shake?.(1.0);
    ui.bossBanner?.(`PHASE ${phaseIdx + 1}`, def.name);
    sfx.milestone?.();
    emit('bossPhase', { phase: phaseIdx + 1 });
  }

  if (hp <= 0) pendingDeath = true;   // resolved next frame in updateBoss
}

export function resetBoss() {
  if (group && scene) { scene.remove(group); model && model.dispose && model.dispose(); }
  resetBossBullets();
  active = false;
  phase = 'idle';
  group = null; model = null; def = null;
  pendingDeath = false;
  game.inBoss = false;
  nextBossDist = debugFirstAt ?? B.firstAt;
  encounterIndex = 0;
}

// Debug/playtest: pull the first encounter in to `dist` metres (e.g. ?boss → a
// boss shortly after takeoff). Persists across runs so each restart re-triggers.
export function setBossDebugFirstAt(dist) {
  debugFirstAt = dist;
  if (!active) nextBossDist = dist;
}

// Debug hook: drop straight into a fight (wired under ?debug in main.js).
export function forceBoss(player) {
  startBossEncounter(player);
}

export function bossDebugState() {
  return { active, phase, hp, hpMax, phaseIdx, bullets: bossBulletCount(), nextBossDist };
}
