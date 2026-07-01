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
  setBossBulletQuality, bossBulletCount, reflectBossBullets,
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
let rollParried = false;       // this roll already landed a parry (announce once per roll)
let reticle = null;            // faint graze/hit zone rings drawn around the dragon
let hpRevealT = 0;             // health-bar fill-up animation timer (0→full on settle)
const HP_REVEAL = 0.8;
let bulletColor = 0xff3010;    // fiery red = danger (set per-boss from the def)
let chargeT = 0;               // telegraph wind-up remaining before the held attack fires
let chargeDur = 0;
let curAttack = null;          // the attack being telegraphed
const pending = [];            // streamed sub-volleys: { t, fire } (tunnel / spiralStream)
const SUSTAINED = new Set(['tunnel', 'spiralStream']);
const REFLECT_COLOR = 0xffc23c;   // amber = "you can parry this" (aimed/fan precision shots)

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

  // Graze/hit reticle: a faint OUTER ring at the graze radius (green) and INNER
  // ring at the hit radius (red) around the dragon, so during a fight the player
  // has a spatial reference for "close enough to graze" vs "about to be hit".
  const grazeR = CONFIG.BOSS.bulletRadius + CONFIG.playerRadius * CONFIG.BOSS.grazeScale;
  const hitR = CONFIG.BOSS.bulletRadius + CONFIG.playerRadius * CONFIG.BOSS.bulletHitScale;
  reticle = new THREE.Group();
  const mkRing = (r, color, op) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.09, r + 0.06, 44),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    return m;
  };
  reticle.add(mkRing(grazeR, 0x9dffea, 0.28));
  reticle.add(mkRing(hitR, 0xff5566, 0.4));
  reticle.visible = false;
  scene.add(reticle);
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
  bulletColor = def.bulletColor ?? 0xff3010;
  pending.length = 0;
  chargeT = 0;
  curAttack = null;

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

  // Dramatic incoming warning during the approach: names the boss AND marks WHERE
  // it enters from with a stripe/glow overlay so the player can clear that space.
  // 'side' → enters from the left/right edge; 'behind' → rises from a bottom corner.
  const sideL = start.x < 0;
  const dir = def.approachFrom === 'side'
    ? (sideL ? 'left' : 'right')
    : (sideL ? 'bottomLeft' : 'bottomRight');
  ui.bossWarning?.(def.name, def.title, dir, B.warnTime + B.approachTime);
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
  emit('bossEnd', { dist: player.dist });   // main.js resumes level generation ahead
}

function startDeath(player) {
  phase = 'dying';
  dyingT = 0;
  resetBossBullets();
  game.bossesDefeatedRun++;
  const bonus = Math.round(B.defeatScore * game.scoreMult);
  const embers = B.defeatEmbers;
  game.score += bonus;
  game.embersRun += embers;       // banked at run end like any ember haul
  ui.bossBanner?.('✦  SLAIN  ✦', `+${bonus}   ◆${embers}`);
  sfx.bossDefeat?.();
  cameraCtl.shake?.(2.0);
  tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
  burst(tmp, 0xffc050, { count: 30, speed: 18, size: 1.2, life: 0.9 });
  emit('bossDefeated', { id: def.id, bonus, embers, noHit: game.bossHitsTakenRun === 0 });
}

// ---- Per-frame update -------------------------------------------------------

export function updateBoss(dt, player, time) {
  if (!active) {
    if (reticle) reticle.visible = false;
    // Trigger a fresh encounter once the player flies past the scheduled mark
    // (never inside a canyon, never on the menu).
    if (game.state === 'playing' && !game.inCanyon && player.dist >= nextBossDist) {
      startBossEncounter(player);
    }
    return;
  }

  // Keep the reticle on the dragon once the fight is engaged (not the warn beat).
  if (reticle) {
    reticle.visible = phase === 'fight' || phase === 'approach';
    reticle.position.set(player.position.x, player.position.y, -player.dist);
  }

  updateBossBullets(dt, player);
  model.tick(dt, time);

  // Graze streak lapses if you stop skimming (drives the graze chime pitch).
  if (game.grazeStreakTimer > 0) {
    game.grazeStreakTimer -= dt;
    if (game.grazeStreakTimer <= 0) game.grazeStreak = 0;
  }

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
      attackTimer = rand(0.9, 1.3);
      // Materialise the health bar now that it's settled in front, and animate it
      // filling 0→full before the rider opens fire (no janky bar during the fly-in).
      model.setHealthBarVisible(true);
      model.setHealth(0);
      hpRevealT = HP_REVEAL;
      riderTimer = HP_REVEAL;
    }
  } else if (phase === 'fight') {
    // Hold station ahead and "fly backward"; gentle strafe/bob keeps it alive.
    pose.rel = B.settleGap;
    pose.x = Math.sin(time * 0.7) * 5.0;
    pose.y = B.fightHeight + Math.sin(time * 1.3) * 0.8;

    // Health-bar fill-up flourish on settle (0 → current hp fraction).
    if (hpRevealT > 0) {
      hpRevealT -= dt;
      model.setHealth((1 - Math.max(hpRevealT, 0) / HP_REVEAL) * (hp / hpMax));
    }

    // Streamed sub-volleys (tunnel / spiral stream) fire on their own clock.
    for (let i = pending.length - 1; i >= 0; i--) {
      pending[i].t -= dt;
      if (pending[i].t <= 0) { pending[i].fire(); pending.splice(i, 1); }
    }

    riderTimer -= dt;
    if (riderTimer <= 0) {
      riderTimer = B.riderShotInterval;
      fireRiderShot(player);
    }

    // Reflect: a barrel roll's i-frames swat nearby reflectable (amber) bullets
    // back at the boss. A bullet swatted right on top of you is a PERFECT parry
    // (more damage). Announce + ring the parry chime once per roll (streak climbs).
    if (player.rollInvuln > 0) {
      const r = reflectBossBullets(player, B.reflectWindow, B.settleGap, pose.x, pose.y);
      if (r.total > 0) {
        tmp.set(player.position.x, player.position.y, -player.dist);
        burst(tmp, r.perfect > 0 ? 0xaef0ff : 0x66ddff, { count: 7, speed: 16, size: 0.85, life: 0.4 });
        cameraCtl.shake?.(r.perfect > 0 ? 0.5 : 0.3);
        if (!rollParried) {
          rollParried = true;
          const perfect = r.perfect > 0;
          if (perfect) game.parryPerfectStreak++; else game.parryPerfectStreak = 0;
          game.parryStreak++;
          const streak = perfect ? game.parryPerfectStreak : game.parryStreak;
          const pts = Math.round(CONFIG.BOSS.parryScore * (perfect ? 1.7 : 1) * game.scoreMult);
          game.score += pts;
          ui.parryPopup?.(pts, perfect, streak);
          sfx.parry?.(perfect, streak);
          emit('bossReflect', { perfect, streak });
        }
      }
    } else {
      rollParried = false;
    }

    if (chargeT > 0) {
      // Telegraph wind-up: the boss charges (maw flares red), THEN releases.
      chargeT -= dt;
      model.setCharge(1 - Math.max(chargeT, 0) / chargeDur);
      if (chargeT <= 0) {
        model.setCharge(0);
        model.flash(0.9);
        tmp.set(pose.x, pose.y, -(player.dist + pose.rel));
        burst(tmp, bulletColor, { count: 6, speed: 11, size: 0.9, life: 0.4 });
        executeAttack(curAttack, player);
        const ph = def.phases[phaseIdx];
        attackTimer = rand(ph.cadence[0], ph.cadence[1]);
      }
    } else if (pending.length === 0) {
      // Idle between attacks → count down, then begin telegraphing the next one.
      attackTimer -= dt;
      if (attackTimer <= 0) {
        const ph = def.phases[phaseIdx];
        curAttack = ph.attacks[(Math.random() * ph.attacks.length) | 0];
        chargeDur = SUSTAINED.has(curAttack) ? B.telegraphSustained : B.telegraphInstant;
        chargeT = chargeDur;
        sfx.boostStart?.();   // a short charge whoosh as the wind-up begins
      }
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

// Resolve an attack id to bullets. Instant patterns fire one volley now; sustained
// patterns push timed sub-volleys onto `pending` so they stream over ~1.5–2s.
function executeAttack(id, player) {
  const closing = B.bulletSpeed;
  // Very light lead only — a strongly-predictive aim makes the shot feel like it
  // homes (you can't dodge by moving). Keep it near where the player IS.
  const lead = 0.08;
  const px = player.position.x + player.velocity.x * lead;
  const py = player.position.y + player.velocity.y * lead;
  // Area patterns (tunnel / spiral) follow the player's side of the lane so you
  // can't just park at the edge and skip them; aimed/fan already track you.
  const anchorX = Math.max(-8, Math.min(8, player.position.x * 0.7));

  if (id === 'aimed') {
    // Three distinct bullets to dodge around, not one dense overlapping wall.
    // Aimed/fan are REFLECTABLE (amber) — the precision shots reward a parry.
    for (let i = -1; i <= 1; i++) {
      const v = aimVel(px + i * 1.6, py, closing);
      emitBoss(pose.x, pose.y, v.vx, v.vy, -closing, true);
    }
  } else if (id === 'fan') {
    const n = quality < 0.75 ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const spread = (i / (n - 1) - 0.5) * 16;   // ±8m across the lane around the player
      const v = aimVel(px + spread, py, closing);
      emitBoss(pose.x, pose.y, v.vx, v.vy, -closing, true);
    }
  } else if (id === 'spiral') {
    // Instant radial burst: bullets fly OUTWARD from the boss as they close.
    const n = quality < 0.75 ? 8 : 11;
    spiralPhase += 0.6;
    const slow = closing * 0.78;
    for (let i = 0; i < n; i++) {
      const a = spiralPhase + (i / n) * Math.PI * 2;
      emitBoss(anchorX, B.fightHeight, Math.cos(a) * 9, Math.sin(a) * 9, -slow);
    }
  } else if (id === 'tunnel') {
    // A succession of bullet-RINGS rushing at you — a glowing tube to fly down,
    // its centre weaving side to side so you follow the safe lane (rib-run feel).
    const rings = quality < 0.75 ? 5 : 6;
    const m = quality < 0.75 ? 12 : 16;
    const slow = closing * 0.85;
    // Small rings (radius < grazeR) so flying the centre still SKIMS the whole
    // ring → constant grazing; a big ring let you sit in a dead-safe hole.
    for (let k = 0; k < rings; k++) {
      const cx = anchorX + Math.sin(k * 0.8) * 5;   // centred on you, then weaves → you follow
      pending.push({ t: k * 0.38, fire: () => fireRing(cx, B.fightHeight, 3.7, m, slow) });
    }
  } else if (id === 'spiralStream') {
    // A rotating emitter: arms of bullets sweep around over time — read the spin.
    const steps = quality < 0.75 ? 10 : 14;
    const slow = closing * 0.8;
    for (let k = 0; k < steps; k++) {
      const a = spiralPhase + k * 0.45;
      pending.push({ t: k * 0.12, fire: () => {
        for (let arm = 0; arm < 2; arm++) {
          const ang = a + arm * Math.PI;
          emitBoss(anchorX, B.fightHeight, Math.cos(ang) * 8, Math.sin(ang) * 8, -slow);
        }
      } });
    }
    spiralPhase += steps * 0.45;
  }
}

// A ring (circle outline) of bullets centred on (cx, cy) that closes straight in.
function fireRing(cx, cy, radius, m, vrel) {
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2;
    emitBoss(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 0, 0, -vrel);
  }
}

// Low-level boss-bullet spawn: starts at (x, y) on the boss's plane (rel=settleGap)
// with the given velocity, always the fiery danger colour.
function emitBoss(x, y, vx, vy, vrel, reflectable = false) {
  spawnBossBullet({
    owner: 'boss', x, y, rel: pose.rel,
    vx, vy, vrel, color: reflectable ? REFLECT_COLOR : bulletColor, reflectable,
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
  if (hpRevealT <= 0) model.setHealth(hp / hpMax);   // don't fight the fill-up flourish
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
  rollParried = false;
  if (reticle) reticle.visible = false;
  pending.length = 0;
  chargeT = 0;
  curAttack = null;
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
