import * as THREE from 'three';
import { game } from './gameState.js';
import { saveData, persist } from './save.js';
import { riderEmberBonus } from './riders.js';
import { burst } from './particles.js';
import { sfx } from './sfx.js';
import { emit } from './events.js';

// Embers: the meta currency, laid in arcing lines along the flight path
// (Subway Surfers coin trails). One InstancedMesh, instances recycled by the
// same windowed pattern as everything else. Collected embers bank into the
// save at run end; a pitch-rising blip rewards consecutive pickups.

const POOL = 192;
const PICKUP_R = 1.8;
const PICKUP_R2 = PICKUP_R * PICKUP_R;

let mesh = null;
const slots = []; // { dist, x, y, active }
let cursor = 0;
let streak = 0;
let streakTimer = 0;

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const posV = new THREE.Vector3();
const sclV = new THREE.Vector3();
const HIDDEN = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);

export function initEmbers(scene) {
  mesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.3, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffb030, emissive: 0xff9010, emissiveIntensity: 1.7,
      roughness: 0.3, metalness: 0.2,
    }),
    POOL
  );
  mesh.frustumCulled = false;
  for (let i = 0; i < POOL; i++) {
    slots.push({ dist: 0, x: 0, y: 0, active: false });
    mesh.setMatrixAt(i, HIDDEN);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

// Spawned by level generation: an arc of embers between two waypoints.
export function addEmberLine(line) {
  for (const p of line.points) {
    const s = slots[cursor];
    cursor = (cursor + 1) % POOL;
    s.dist = p.dist;
    s.x = p.x;
    s.y = p.y;
    s.active = true;
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export function updateEmbers(dt, player, time) {
  const p = player.position;
  streakTimer -= dt;
  if (streakTimer <= 0) streak = 0;

  for (let i = 0; i < POOL; i++) {
    const s = slots[i];
    if (!s.active) {
      continue;
    }
    if (s.dist < player.dist - 30) {
      s.active = false;
      mesh.setMatrixAt(i, HIDDEN);
      continue;
    }
    // Spin + bob, written every frame (cheap: 192 matrix composes max)
    eul.set(0, time * 2.5 + i, 0.5);
    quat.setFromEuler(eul);
    const bob = Math.sin(time * 2 + s.dist) * 0.25;
    m4.compose(posV.set(s.x, s.y + bob, -s.dist), quat, sclV.set(1, 1, 1));
    mesh.setMatrixAt(i, m4);

    // Pickup test
    const dx = p.x - s.x;
    const dy = p.y - (s.y + bob);
    const dz = player.dist - s.dist;
    if (dx * dx + dy * dy + dz * dz < PICKUP_R2) {
      s.active = false;
      mesh.setMatrixAt(i, HIDDEN);
      game.embersRun++;
      streak = Math.min(streak + 1, 24);
      streakTimer = 1.2;
      sfx.ember(streak);
      burst(posV, 0xffc050, { count: 4, speed: 6, size: 0.5, life: 0.4 });
      emit('ember');
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
}

// Bank the run's embers into the save (called once at run end). The equipped
// rider's emberBonus pays extra on top — shown on the crash screen.
export function bankEmbers() {
  if (game.embersRun <= 0) return;
  game.emberBonusEarned = Math.round(game.embersRun * riderEmberBonus());
  const total = game.embersRun + game.emberBonusEarned;
  saveData.embers += total;
  saveData.stats.totalEmbers += total;
  persist();
}

export function resetEmbers() {
  for (let i = 0; i < POOL; i++) {
    slots[i].active = false;
    mesh.setMatrixAt(i, HIDDEN);
  }
  mesh.instanceMatrix.needsUpdate = true;
  streak = 0;
  cursor = 0;
}
