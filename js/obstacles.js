import * as THREE from 'three';
import { CONFIG } from './config.js';
import { biomeIndexAt } from './biomes.js';

// Hazards, spawned ahead and culled behind the dragon:
//   pillar — floor spike (health damage)
//   shard  — floating octahedron, optionally oscillating ("dynamic") (damage)
//   bar    — horizontal beam spanning the lane (damage)
//   gate   — crystal wall with a hole on the flight path (FATAL on contact)
// Each entry doubles as its own collider; `colliders` is consumed by collision.js.
// Body materials are biome-keyed (verdigris stone / sandstone / ice); warning
// and gate materials stay constant across biomes for readability.
let scene = null;
let mats = null;
const entries = [];
export const colliders = entries; // same objects, same array

export function initObstacles(s) {
  scene = s;
  const bodyOpts = { flatShading: true, roughness: 0.4, metalness: 0.1 };
  mats = {
    body: [
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x7fbf9f, emissive: 0x13302a, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0xddb273, emissive: 0x3a230a, emissiveIntensity: 0.35 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x7cc4ee, roughness: 0.3, emissive: 0x10324d, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x4a3038, emissive: 0x8a2208, emissiveIntensity: 0.5 }),  // basalt, ember-lit
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x2a6a52, emissive: 0x14b088, emissiveIntensity: 0.45 }), // biolume moss
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x5a5a9a, emissive: 0x3a3aa0, emissiveIntensity: 0.45 }), // astral slate
    ],
    // Movers are the active danger: icy body, hot coral warning glow that
    // pulses in updateObstacles (shared material — one update per frame).
    mover: new THREE.MeshStandardMaterial({
      color: 0xbcd8e8,
      flatShading: true,
      roughness: 0.25,
      emissive: 0xff5a47,
      emissiveIntensity: 0.9,
    }),
    // Gate panels lean violet so they never read as orbs or score rings.
    gate: new THREE.MeshStandardMaterial({
      color: 0x9d9aec,
      transparent: true,
      opacity: 0.68,
      roughness: 0.2,
      emissive: 0x3a2c66,
      emissiveIntensity: 0.7,
    }),
    frame: new THREE.MeshStandardMaterial({
      color: 0x55e0ff,
      emissive: 0x2299cc,
      emissiveIntensity: 1.2,
    }),
    // Coral warning frame: lethal-edge cue around the safe window.
    warnFrame: new THREE.MeshStandardMaterial({
      color: 0xff7449,
      emissive: 0xdd3322,
      emissiveIntensity: 1.1,
    }),
  };
}

export function addObstacle(o) {
  const e = { ...o, object: null };
  const body = mats.body[biomeIndexAt(o.dist)];
  if (o.type === 'pillar') {
    e.object = new THREE.Mesh(new THREE.ConeGeometry(o.r, o.h, 6), body);
    e.object.position.set(o.x, o.h / 2, -o.dist);
  } else if (o.type === 'shard') {
    e.object = new THREE.Mesh(new THREE.OctahedronGeometry(o.r), o.dynamic ? mats.mover : body);
    e.object.position.set(o.x, o.y, -o.dist);
  } else if (o.type === 'bar') {
    e.object = new THREE.Mesh(new THREE.CylinderGeometry(o.r, o.r, 30, 8), body);
    e.object.rotation.z = Math.PI / 2;
    e.object.position.set(0, o.y, -o.dist);
  } else if (o.type === 'gate') {
    e.object = buildGate(o);
  }
  scene.add(e.object);
  entries.push(e);
}

// A translucent crystal wall spanning the lane with a rectangular opening.
// The hole is outlined with a RECTANGULAR glow frame — deliberately not a
// circle, so it can't be mistaken for a score ring. The wall itself is fatal.
function buildGate(o) {
  const group = new THREE.Group();
  const T = 1.6; // wall thickness
  const X = 16; // wall half-span
  const TOP = 24;
  const left = o.gapX - o.gapW;
  const right = o.gapX + o.gapW;
  const bottom = o.gapY - o.gapH;
  const top = o.gapY + o.gapH;

  const panel = (w, h, cx, cy) => {
    if (w <= 0.1 || h <= 0.1) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), mats.gate);
    mesh.position.set(cx, cy, 0);
    group.add(mesh);
  };
  panel(left + X, TOP, (left - X) / 2, TOP / 2); // left of gap
  panel(X - right, TOP, (right + X) / 2, TOP / 2); // right of gap
  panel(right - left, TOP - top, o.gapX, (top + TOP) / 2); // above gap
  panel(right - left, bottom, o.gapX, bottom / 2); // below gap

  const edge = (w, h, cx, cy, mat = mats.frame, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.35), mat);
    mesh.position.set(cx, cy, z);
    group.add(mesh);
  };
  const W = o.gapW * 2;
  const H = o.gapH * 2;
  edge(W + 0.6, 0.42, o.gapX, top + 0.21); // top edge
  edge(W + 0.6, 0.42, o.gapX, bottom - 0.21); // bottom edge
  edge(0.42, H + 0.6, left - 0.21, o.gapY); // left edge
  edge(0.42, H + 0.6, right + 0.21, o.gapY); // right edge

  // Coral outer warning frame on the approach side: "this edge kills".
  // Sits proud of the wall (local +z, toward the incoming player).
  const M = 0.85; // outward margin from the cyan frame
  edge(W + 2 * M + 0.5, 0.36, o.gapX, top + M, mats.warnFrame, 1.2);
  edge(W + 2 * M + 0.5, 0.36, o.gapX, bottom - M, mats.warnFrame, 1.2);
  edge(0.36, H + 2 * M + 0.5, left - M, o.gapY, mats.warnFrame, 1.2);
  edge(0.36, H + 2 * M + 0.5, right + M, o.gapY, mats.warnFrame, 1.2);

  // Window pane: a faint additive fill of the OPENING so the gap is easy to
  // locate and aim for from any altitude — including when you're above the wall
  // looking down at it. Low opacity so you still see straight through it.
  const winMat = new THREE.MeshBasicMaterial({
    color: 0x6ce4ff, transparent: true, opacity: 0.15, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(W, H), winMat);
  win.position.set(o.gapX, o.gapY, 0.45);
  win.layers.set(1); // out of the water reflection, like the beacon
  group.add(win);

  // Beacon column: a tall additive light pillar above the gap — visible
  // through fog and bloom well beyond the wall.
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x55e0ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beacon = new THREE.Mesh(new THREE.PlaneGeometry(W, 60), beaconMat);
  beacon.position.set(o.gapX, top + 30, 0.5);
  beacon.layers.set(1); // hidden from water reflection
  group.add(beacon);
  group.userData.beacon = beacon;

  group.position.z = -o.dist;
  return group;
}

export function updateObstacles(dt, time, playerDist, speedNorm = 0) {
  // Warning pulse on every moving shard (shared material, one write).
  mats.mover.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.45;
  const sn = Math.max(0, Math.min(1, speedNorm));
  mats.warnFrame.emissiveIntensity = (1.1 + Math.sin(time * 4) * 0.35) * (1 + 0.8 * sn);
  mats.frame.emissiveIntensity = 1.2 * (1 + 0.5 * sn);

  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.dist < playerDist - CONFIG.cullBehind) {
      removeAt(i);
      continue;
    }
    if (e.type === 'shard') {
      e.object.rotation.y += dt * 0.8;
      e.object.rotation.x += dt * 0.3;
      if (e.dynamic) {
        // Oscillates; the collider position (e.x) moves with the mesh.
        e.x = e.baseX + Math.sin(time * e.speed + e.phase) * e.amp;
        e.object.position.x = e.x;
        e.object.position.y = e.baseY;
      } else {
        e.object.position.y = e.y + Math.sin(time * 1.4 + e.dist) * 0.4;
      }
    } else if (e.type === 'bar') {
      e.object.rotation.x += dt * 0.5; // spin around its long axis
    } else if (e.type === 'gate') {
      // Phase shatter: blow the wall apart (scale + spin) then hide it. Transform
      // only — the gate material is shared across all gates, so we never touch it.
      if (e.shatterT > 0) {
        e.shatterT -= dt;
        const k = 1 - Math.max(e.shatterT, 0) / CONFIG.phaseShatterDur;
        e.object.scale.setScalar(1 + k * (e.shatterBig ? 0.8 : 0.4));
        e.object.rotation.z += dt * (e.shatterBig ? 6 : 3);
        if (e.shatterT <= 0) e.object.visible = false;
      }
      const beacon = e.object.userData.beacon;
      if (beacon) {
        const dz = e.dist - playerDist;
        // Fade in from 250m out, full brightness 120m out, off once passed.
        const alpha = Math.min(1, Math.max(0, (dz - 120) / 130));
        const pulse = 0.85 + Math.sin(time * 3) * 0.15;
        beacon.material.opacity = alpha * 0.32 * pulse;
      }
    }
  }
}

function removeAt(i) {
  const e = entries[i];
  scene.remove(e.object);
  e.object.traverse((m) => {
    if (m.geometry) m.geometry.dispose(); // materials are shared
  });
  entries.splice(i, 1);
}

export function obstacleCount() {
  return entries.length;
}

// First unpassed gate ahead of a distance (reticle target).
export function nextGateAhead(dist) {
  let best = null;
  for (const e of entries) {
    if (e.type === 'gate' && !e.passed && e.dist > dist && (!best || e.dist < best.dist)) best = e;
  }
  return best;
}

// Revive helper: clear every hazard up to a distance so the player gets a
// clean runway back into the action.
export function clearAhead(untilDist) {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].dist <= untilDist) removeAt(i);
  }
}

export function resetObstacles() {
  while (entries.length) removeAt(entries.length - 1);
}
