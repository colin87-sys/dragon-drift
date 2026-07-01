import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { hitPlayer, bulletGraze } from './collision.js';
import { burst } from './particles.js';
import { emit } from './events.js';

// Boss bullet pool — one InstancedMesh, recycled by the same windowed-cursor
// pattern as embers.js (one draw call regardless of count; cheap on mobile).
//
// Everything lives in the PLAYER-RELATIVE frame so it's correct no matter how
// fast forward flight is: a bullet's `rel` is how many metres AHEAD of the player
// it is. The boss holds at rel = settleGap and "flies backward" by staying there.
//   - owner 'boss'          → rel decreases toward 0 (the player's plane); a hit
//                             is the frame rel crosses 0 while x/y are close.
//   - owner 'rider'/'player'→ rel increases toward targetRel (the boss); arrival
//                             near the boss centre emits 'bossDamage'.
// Boss-bullet damage routes through collision.hitPlayer so it respects the same
// invuln + barrel-roll i-frames as every other hazard — dodging is free.

const POOL = CONFIG.BOSS.bulletPool;
const R = CONFIG.playerRadius;

let mesh = null;       // colour body (soft round disc, per-bullet tint)
let coreMesh = null;   // white centre (colour-blind-safe read — everyone sees the dot)
let shadowMesh = null; // soft dark dot on the floor under each bullet (depth anchor)
let visibleCap = POOL;
let clock = 0;         // accumulates dt for the parry-window pulse

const GROUND_Y = 0.4;  // floor level the bullet shadows sit on
const WHITE = new THREE.Color(0xffffff);
const IDENTITY = new THREE.Quaternion();   // bullets are round → camera-facing quads, no spin
const SHADOW_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const shadowScl = new THREE.Vector3();

// Procedural round-bullet texture: a soft radial disc (white core → soft edge →
// transparent). Grayscale so instanceColor tints the BODY while the white CORE
// layer stays white on top — the danmaku "white-centre coloured-rim" look.
function makeBulletTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.42, 'rgba(255,255,255,0.98)');
  gr.addColorStop(0.72, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const slots = [];   // see makeSlot
let cursor = 0;

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const posV = new THREE.Vector3();
const sclV = new THREE.Vector3();
const colV = new THREE.Color();
const HIDDEN = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);

function makeSlot() {
  return {
    active: false,
    owner: 'boss',     // 'boss' | 'rider' | 'player'
    x: 0, y: 0, rel: 0,
    vx: 0, vy: 0, vrel: 0,
    r: CONFIG.BOSS.bulletRadius,
    dmg: 0,
    reflectable: false,
    targetRel: 0, tx: 0, ty: 0,   // arrival target for boss-ward bullets
    color: 0xffffff,
    life: 0,
  };
}

export function initBossBullets(scene) {
  if (mesh) return;
  const tex = makeBulletTex();
  const quad = new THREE.PlaneGeometry(1, 1);   // round via the soft radial texture
  // Body: the soft round COLOUR disc, per-bullet tint, NORMAL blend (no additive
  // washout), soft-edged. Camera-facing (a +z quad ≈ faces the chase cam).
  const bodyMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, depthTest: false,
  });
  mesh = new THREE.InstancedMesh(quad, bodyMat, POOL);
  mesh.frustumCulled = false;
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  // Core: a smaller WHITE centre drawn on top — colour-blind-safe (everyone sees
  // the white dot), keeps bullets countable no matter the body hue.
  const coreMat = new THREE.MeshBasicMaterial({
    map: tex, color: 0xffffff, transparent: true, depthWrite: false, depthTest: false,
  });
  coreMesh = new THREE.InstancedMesh(quad, coreMat, POOL);
  coreMesh.frustumCulled = false;
  // Ground shadow: a soft dark disc on the floor under each bullet. Two rings that
  // overlap in view sit at different floor distances, so their shadows separate —
  // the floor grid becomes an absolute depth reference (a shadow under the dragon
  // = that bullet is at your plane).
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false, depthTest: false,
  });
  shadowMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 14), shadowMat, POOL);
  shadowMesh.frustumCulled = false;
  shadowMesh.renderOrder = -1;   // under the bullets
  for (let i = 0; i < POOL; i++) {
    slots.push(makeSlot());
    mesh.setMatrixAt(i, HIDDEN);
    coreMesh.setMatrixAt(i, HIDDEN);
    shadowMesh.setMatrixAt(i, HIDDEN);
  }
  mesh.instanceMatrix.needsUpdate = true;
  coreMesh.instanceMatrix.needsUpdate = true;
  shadowMesh.instanceMatrix.needsUpdate = true;
  scene.add(shadowMesh);
  scene.add(mesh);
  scene.add(coreMesh);   // added after the halo → drawn on top
}

// Quality scales the concurrent-bullet ceiling (mobile draws fewer).
export function setBossBulletQuality(q) {
  visibleCap = Math.max(60, Math.round(POOL * q));
}

function activeCount() {
  let n = 0;
  for (let i = 0; i < POOL; i++) if (slots[i].active) n++;
  return n;
}

// Spawn one bullet. `opts` carries the player-relative kinematics already solved
// by the caller (boss.js patterns / rider auto-attack).
export function spawnBossBullet(opts) {
  if (activeCount() >= visibleCap) return null;
  // Find a free slot from the rotating cursor.
  let s = null;
  for (let i = 0; i < POOL; i++) {
    const idx = (cursor + i) % POOL;
    if (!slots[idx].active) { s = slots[idx]; cursor = (idx + 1) % POOL; break; }
  }
  if (!s) return null;
  s.active = true;
  s.owner = opts.owner || 'boss';
  s.x = opts.x || 0;
  s.y = opts.y || 0;
  s.rel = opts.rel || 0;
  s.vx = opts.vx || 0;
  s.vy = opts.vy || 0;
  s.vrel = opts.vrel || 0;
  s.r = opts.r || CONFIG.BOSS.bulletRadius;
  s.dmg = opts.dmg || 0;
  s.reflectable = !!opts.reflectable;
  s.targetRel = opts.targetRel || 0;
  s.tx = opts.tx || 0;
  s.ty = opts.ty || 0;
  s.color = opts.color || 0xff4488;
  s.life = opts.life || 6;
  return s;
}

function deactivate(i) {
  slots[i].active = false;
  mesh.setMatrixAt(i, HIDDEN);
  if (coreMesh) coreMesh.setMatrixAt(i, HIDDEN);
  if (shadowMesh) shadowMesh.setMatrixAt(i, HIDDEN);
}

export function updateBossBullets(dt, player) {
  if (!mesh) return;
  clock += dt;
  const px = player.position.x;
  const py = player.position.y;
  const bossR = CONFIG.BOSS.bossHitRadius;

  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active) continue;

    const prevRel = s.rel;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rel += s.vrel * dt;
    s.life -= dt;

    // Time-to-impact FLARE (the depth cue, replacing the confusing loom): a boss
    // bullet warms toward white-hot in its last ~0.3 s, so the one that reaches
    // you FIRST flares first — "which hits me" is a colour read. A reflectable
    // bullet flares bright the instant it enters the parry window (the parry cue).
    let flare = 0;
    if (s.owner === 'boss' && s.rel > 0) {
      const tti = s.rel / Math.max(Math.abs(s.vrel), 1);
      if (tti < 0.3) flare = 1 - tti / 0.3;
      // In Surge every bullet is parryable, so every bullet flares in the window.
      const parryable = s.reflectable || game.feverActive;
      if (parryable && s.rel <= CONFIG.BOSS.reflectWindow) {
        flare = Math.max(flare, 0.55 + Math.sin(clock * 22) * 0.35);
      }
    }

    // Round camera-facing bullet: a soft colour BODY with a WHITE CENTRE on top,
    // plus a ground shadow (all off one slot). No spin — the disc is radial.
    posV.set(s.x, s.y, -(player.dist + s.rel));
    m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 2.7));   // body disc
    mesh.setMatrixAt(i, m4);
    colV.setHex(s.color).lerp(WHITE, flare);                 // warm to white near impact
    mesh.setColorAt(i, colV);
    m4.compose(posV, IDENTITY, sclV.setScalar(s.r * 1.35));  // white centre (smaller)
    coreMesh.setMatrixAt(i, m4);
    // Shadow on the floor directly beneath the bullet.
    m4.compose(posV.set(s.x, GROUND_Y, -(player.dist + s.rel)), SHADOW_QUAT, shadowScl.setScalar(s.r * 1.5));
    shadowMesh.setMatrixAt(i, m4);

    if (s.owner === 'boss') {
      // Resolve the dodge on the frame the bullet crosses the player's plane: a
      // dead-on pass HITS (and is consumed here); a near-clean pass GRAZES. Either
      // way a NON-hit keeps flying PAST the player and whooshes by the camera, so a
      // bullet never appears to vanish just short of you.
      if (prevRel > 0 && s.rel <= 0) {
        const dx = s.x - px, dy = s.y - py;
        const d2 = dx * dx + dy * dy;
        // Per-bullet radius so the hitbox matches the banded VISUAL size (fair).
        const hitRi = s.r + R * CONFIG.BOSS.bulletHitScale;
        const grazeRi = s.r + R * CONFIG.BOSS.grazeScale;
        if (d2 < hitRi * hitRi) { hitPlayer(player, s.dmg, 'bullet'); deactivate(i); continue; }
        if (d2 < grazeRi * grazeRi) bulletGraze(player);
      }
      if (s.rel < -12 || s.life <= 0 ||
          Math.abs(s.x) > CONFIG.laneHalfWidth + 10 || s.y < -4 || s.y > 34) {
        deactivate(i);
      }
    } else {
      // Rider / reflected bullet flying toward the boss.
      if (s.rel >= s.targetRel) {
        const dx = s.x - s.tx, dy = s.y - s.ty;
        if (dx * dx + dy * dy < bossR * bossR) {
          emit('bossDamage', { amount: s.dmg, kind: s.owner, x: s.tx, y: s.ty });
        }
        deactivate(i);
      } else if (s.life <= 0) {
        deactivate(i);
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  coreMesh.instanceMatrix.needsUpdate = true;
  shadowMesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

// Swat reflectable boss bullets near a rolling player back at the boss. `all`
// (Surge hyper, increment 3) makes EVERY boss bullet reflectable, not just the
// amber ones. A bullet swatted within `perfectParryRel` is a PERFECT parry (more
// damage). Returns { total, perfect } counts for the FX/announcement.
export function reflectBossBullets(player, windowRel, settleGap, bossX, bossY, all = false) {
  let total = 0, perfect = 0;
  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active || s.owner !== 'boss') continue;
    if (!all && !s.reflectable) continue;
    if (s.rel < 0 || s.rel > windowRel) continue;
    const dx = s.x - player.position.x, dy = s.y - player.position.y;
    if (dx * dx + dy * dy > 9) continue;            // must be near the player to swat
    const isPerfect = s.rel <= CONFIG.BOSS.perfectParryRel;
    // Flip it back at the boss.
    s.owner = 'player';
    s.targetRel = settleGap;
    s.tx = bossX; s.ty = bossY;
    s.vrel = CONFIG.BOSS.bossSpeed;
    const t = Math.max((settleGap - s.rel) / CONFIG.BOSS.bossSpeed, 0.05);
    s.vx = (bossX - s.x) / t;
    s.vy = (bossY - s.y) / t;
    s.color = isPerfect ? 0xaef0ff : 0x66ddff;      // perfect = brighter
    const mult = isPerfect ? CONFIG.BOSS.reflectPerfectMult : CONFIG.BOSS.reflectDamageMult;
    s.dmg = (s.dmg > 0 ? s.dmg : 5) * mult;
    s.life = 4;
    total++;
    if (isPerfect) perfect++;
  }
  return { total, perfect };
}

export function bossBulletCount() { return activeCount(); }

export function resetBossBullets() {
  for (let i = 0; i < POOL; i++) {
    if (slots[i]) slots[i].active = false;
    if (mesh) mesh.setMatrixAt(i, HIDDEN);
    if (coreMesh) coreMesh.setMatrixAt(i, HIDDEN);
    if (shadowMesh) shadowMesh.setMatrixAt(i, HIDDEN);
  }
  cursor = 0;
  if (mesh) mesh.instanceMatrix.needsUpdate = true;
  if (coreMesh) coreMesh.instanceMatrix.needsUpdate = true;
  if (shadowMesh) shadowMesh.instanceMatrix.needsUpdate = true;
}
