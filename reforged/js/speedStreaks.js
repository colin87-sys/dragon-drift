// Speed-tunnel streaks: a pool of world-space light lines that rush past the dragon
// inside the spine SPEED TUNNEL — the signature "need for speed" arcade cue. One
// THREE.LineSegments (a single draw call; LineSegments are exempt from the overdraw
// cliff, BOSS-DESIGN §2). Driven by the slipstream mix, so it's spine-only and
// degrades to invisible (opacity 0, mesh hidden) everywhere else. Visual-only —
// Math.random at recycle is fine (same license as the gate motes), never determinism.
import * as THREE from 'three';

const N = 56;
let mesh = null, geo = null, mat = null, positions = null;
const streaks = [];

function respawn(s, px, py, pz) {
  const ang = Math.random() * Math.PI * 2;
  const r = 6 + Math.random() * 6.5;               // annulus around the flight axis
  s.x = px + Math.cos(ang) * r;
  s.y = py + Math.sin(ang) * r * 0.72;
  s.z = pz - (34 + Math.random() * 52);            // ahead of the dragon (more negative z)
  s.len = 6 + Math.random() * 7;
}

export function initSpeedStreaks(scene) {
  if (mesh) return;
  geo = new THREE.BufferGeometry();
  positions = new Float32Array(N * 2 * 3);         // two endpoints per segment
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mat = new THREE.LineBasicMaterial({
    color: 0xcfeaff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  mesh = new THREE.LineSegments(geo, mat);
  mesh.frustumCulled = false;      // bounding sphere is at origin; we cull via visible
  mesh.renderOrder = 4;
  mesh.visible = false;
  scene.add(mesh);
  for (let i = 0; i < N; i++) { const s = { x: 0, y: 0, z: 0, len: 0 }; respawn(s, 0, 0, -50); streaks.push(s); }
}

// mix 0→1 = slipstream strength; player supplies the world anchor.
export function updateSpeedStreaks(player, mix) {
  if (!mesh) return;
  if (mix <= 0.01) { if (mesh.visible) { mesh.visible = false; mat.opacity = 0; } return; }
  mesh.visible = true;
  mat.opacity = Math.min(0.6, mix * 0.6);
  const px = player.position.x, py = player.position.y, pz = player.position.z;
  let p = 0;
  for (const s of streaks) {
    if (s.z > pz + 10) respawn(s, px, py, pz);      // fell behind the camera → recycle ahead
    positions[p++] = s.x; positions[p++] = s.y; positions[p++] = s.z;
    positions[p++] = s.x; positions[p++] = s.y; positions[p++] = s.z + s.len; // trails back along z
  }
  geo.attributes.position.needsUpdate = true;
}

export function resetSpeedStreaks() {
  if (mesh) { mesh.visible = false; }
  if (mat) mat.opacity = 0;
}
