import * as THREE from 'three';
import { CONFIG } from './config.js';
import { hitPlayer } from './collision.js';
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

let mesh = null;
let visibleCap = POOL;
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
  const mat = new THREE.MeshBasicMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  mesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), mat, POOL);
  mesh.frustumCulled = false;
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  for (let i = 0; i < POOL; i++) {
    slots.push(makeSlot());
    mesh.setMatrixAt(i, HIDDEN);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
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
}

export function updateBossBullets(dt, player) {
  if (!mesh) return;
  const px = player.position.x;
  const py = player.position.y;
  const hitR = CONFIG.BOSS.bulletRadius + R * CONFIG.BOSS.bulletHitScale;
  const bossR = CONFIG.BOSS.bossHitRadius;

  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active) continue;

    const prevRel = s.rel;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rel += s.vrel * dt;
    s.life -= dt;

    // Render in the player-relative frame (world z follows the player forward).
    eul.set(s.x * 0.3, s.rel * 0.3, 0);
    quat.setFromEuler(eul);
    m4.compose(posV.set(s.x, s.y, -(player.dist + s.rel)), quat, sclV.setScalar(s.r));
    mesh.setMatrixAt(i, m4);
    colV.setHex(s.color);
    mesh.setColorAt(i, colV);

    if (s.owner === 'boss') {
      // Crossed the player's plane this frame → resolve the dodge.
      if (prevRel > 0 && s.rel <= 0) {
        const dx = s.x - px, dy = s.y - py;
        if (dx * dx + dy * dy < hitR * hitR) {
          hitPlayer(player, s.dmg, 'bullet');
        }
        deactivate(i);
      } else if (s.rel < -2 || s.life <= 0 ||
                 Math.abs(s.x) > CONFIG.laneHalfWidth + 6 || s.y < -2 || s.y > 30) {
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
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

// Find the nearest reflectable boss bullet inside a small window ahead of the
// player — used by boss.js when a barrel roll fires (reflect, increment 3).
export function reflectBossBullets(player, windowRel, settleGap, bossX, bossY) {
  let n = 0;
  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active || s.owner !== 'boss' || !s.reflectable) continue;
    if (s.rel < 0 || s.rel > windowRel) continue;
    const dx = s.x - player.position.x, dy = s.y - player.position.y;
    if (dx * dx + dy * dy > 9) continue;            // must be near the player to swat
    // Flip it back at the boss.
    s.owner = 'player';
    s.targetRel = settleGap;
    s.tx = bossX; s.ty = bossY;
    s.vrel = CONFIG.BOSS.bossSpeed;
    const t = Math.max((settleGap - s.rel) / CONFIG.BOSS.bossSpeed, 0.05);
    s.vx = (bossX - s.x) / t;
    s.vy = (bossY - s.y) / t;
    s.color = 0x66ddff;
    s.dmg = s.dmg > 0 ? s.dmg * 2 : 10;
    s.life = 4;
    n++;
  }
  return n;
}

export function bossBulletCount() { return activeCount(); }

export function resetBossBullets() {
  for (let i = 0; i < POOL; i++) {
    if (slots[i]) slots[i].active = false;
    if (mesh) mesh.setMatrixAt(i, HIDDEN);
  }
  cursor = 0;
  if (mesh) mesh.instanceMatrix.needsUpdate = true;
}
