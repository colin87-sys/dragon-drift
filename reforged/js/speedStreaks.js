// Speed-tunnel streaks: a pool of world-space light DARTS that rush past the dragon
// inside the spine SPEED TUNNEL — the signature "need for speed" arcade cue. Still ONE
// THREE.LineSegments (a single draw call; LineSegments are exempt from the overdraw
// cliff, BOSS-DESIGN §2), but each streak is now a 3-segment polyline whose per-vertex
// colour tapers bright-head → transparent-tail (under AdditiveBlending vertex RGB *is*
// brightness), with per-streak length / temperature / brightness variation and a
// motion-aligned direction so the darts LEAN into the bank instead of reading as a flat
// uniform cyan grid ("basic and tacky", feel-v4). Driven by the presence-gated slip mix
// (fxMix), so it's spine-only, fades in rib-free gaps, and idles invisible everywhere
// else. Visual-only — Math.random at recycle is fine (same license as the gate motes).
import * as THREE from 'three';

const N = 48;                 // streaks
const SEGS = 3;              // sub-segments per streak → 4 points → 6 verts (SEGS*2)
const VPS = SEGS * 2;       // vertices per streak
let mesh = null, geo = null, mat = null, positions = null, colors = null;
const streaks = [];

// Cool→warm palette (0..1). 85% cool (lerp of the two blues), 15% warm ember accent.
const COOL_A = [0.624, 0.847, 1.0];   // 0x9fd8ff
const COOL_B = [0.910, 0.965, 1.0];   // 0xe8f6ff
const WARM   = [1.0, 0.851, 0.659];   // 0xffd9a8

function respawn(s, px, py, pz, vx, vy, speed) {
  const ang = Math.random() * Math.PI * 2;
  const r = 5 + Math.random() * 9;                 // wider annulus (5..14) around the flight axis
  s.x = px + Math.cos(ang) * r;
  s.y = py + Math.sin(ang) * r * 0.72;
  s.z = pz - (34 + Math.random() * 52);            // ahead of the dragon (more negative z)
  const hero = Math.random() < 0.1;                // a few long/bright "hero" darts give hierarchy
  s.len = hero ? 26 + Math.random() * 10 : 8 + r * 1.1 + Math.random() * 6; // outer = longer (parallax)
  // Direction: trail OPPOSITE the flight vector (lateral velocity + forward speed), so a
  // dart leans exactly when the tube sways — motion-following with three lines of math and
  // no tube sampling. Unit vector, +z = trailing behind the camera.
  const inv = 1 / Math.max(1, Math.hypot(vx, vy * 0.7, speed));
  s.dx = -vx * inv; s.dy = -vy * 0.7 * inv; s.dz = speed * inv;
  // Baked head colour = temperature × brightness (hero darts hottest, >1 for a bloom core).
  const bright = hero ? 1.5 : 0.7 + Math.random() * 0.65;
  if (Math.random() < 0.15) {
    s.cr = WARM[0] * bright; s.cg = WARM[1] * bright; s.cb = WARM[2] * bright;
  } else {
    const t = Math.random();
    s.cr = (COOL_A[0] + (COOL_B[0] - COOL_A[0]) * t) * bright;
    s.cg = (COOL_A[1] + (COOL_B[1] - COOL_A[1]) * t) * bright;
    s.cb = (COOL_A[2] + (COOL_B[2] - COOL_A[2]) * t) * bright;
  }
}

// Write the taper into the colour buffer: head (t=0) full, tail (t=1) black, quadratic
// (1-t)² fade so the dart dissolves into a wisp instead of ending on a hard edge.
function bakeColor(i, s) {
  let c = i * VPS * 3;
  for (let seg = 0; seg < SEGS; seg++) {
    for (let end = 0; end < 2; end++) {
      const t = (seg + end) / SEGS;
      const k = (1 - t) * (1 - t);
      colors[c++] = s.cr * k; colors[c++] = s.cg * k; colors[c++] = s.cb * k;
    }
  }
}

export function initSpeedStreaks(scene) {
  if (mesh) return;
  geo = new THREE.BufferGeometry();
  positions = new Float32Array(N * VPS * 3);
  colors = new Float32Array(N * VPS * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  mat = new THREE.LineBasicMaterial({
    color: 0xffffff, vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  mesh = new THREE.LineSegments(geo, mat);
  mesh.frustumCulled = false;      // bounding sphere is at origin; we cull via visible
  mesh.renderOrder = 4;
  mesh.visible = false;
  scene.add(mesh);
  for (let i = 0; i < N; i++) {
    const s = { x: 0, y: 0, z: 0, len: 0, dx: 0, dy: 0, dz: 1, cr: 0, cg: 0, cb: 0 };
    respawn(s, 0, 0, -50, 0, 0, 100);
    streaks.push(s);
    bakeColor(i, s);
  }
}

// mix 0→1 = presence-gated slipstream strength; player supplies the world anchor.
export function updateSpeedStreaks(player, mix) {
  if (!mesh) return;
  if (mix <= 0.01) { if (mesh.visible) { mesh.visible = false; mat.opacity = 0; } return; }
  mesh.visible = true;
  mat.opacity = 0.75 * mix * mix;                  // quadratic ignition — gentle at seam, full in the pocket
  const px = player.position.x, py = player.position.y, pz = player.position.z;
  const vx = player.velocity.x, vy = player.velocity.y, spd = player.speed;
  let recolored = false;
  for (let i = 0; i < N; i++) {
    const s = streaks[i];
    if (s.z > pz + 10) { respawn(s, px, py, pz, vx, vy, spd); bakeColor(i, s); recolored = true; }
    const ex = s.dx * s.len, ey = s.dy * s.len, ez = s.dz * s.len; // head→tail delta
    let p = i * VPS * 3;
    for (let seg = 0; seg < SEGS; seg++) {
      for (let end = 0; end < 2; end++) {
        const t = (seg + end) / SEGS;
        positions[p++] = s.x + ex * t;
        positions[p++] = s.y + ey * t;
        positions[p++] = s.z + ez * t;
      }
    }
  }
  geo.attributes.position.needsUpdate = true;
  if (recolored) geo.attributes.color.needsUpdate = true;
}

export function resetSpeedStreaks() {
  if (mesh) { mesh.visible = false; }
  if (mat) mat.opacity = 0;
}
