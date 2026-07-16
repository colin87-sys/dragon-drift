// rain.js — storm rain as LINE-SEGMENT streaks (Tempest Reach).
//
// REWRITTEN to the simplest robust primitive after a custom billboarded-quad
// ShaderMaterial blanked the WHOLE frame on real GPUs (both PC + iPhone) while the
// headless software GL rendered it fine. Root cause of that black: raindrops sit all
// around the camera — many BEHIND it — so quads straddled the camera plane (clip.w ≤ 0);
// feeding clip.x/clip.w into a varying on a DoubleSide quad let those triangles rasterize
// screen-wide on conformant GPUs (SwiftShader clipped them, hiding the bug in every test).
//
// This version uses plain THREE.LineSegments + LineBasicMaterial with a per-vertex RGBA
// taper (bright head → faded up-wind tail). No custom shader, no billboard math, no manual
// perspective divide, no double-sided geometry → nothing that can produce screen-covering
// triangles. Lines clip cleanly at the near plane. rainMix-gated (0 elsewhere = byte-
// identical), tier-thinned via draw-range, render-only. (Look is deliberately simple-but-
// safe; premium density/depth is a follow-up once this is confirmed on real hardware.)
import * as THREE from 'three';

const NEAR = 140, MID = 340, COUNT = NEAR + MID;   // ~480 streaks (density via COUNT, never alpha)
const R_FAR = 38, Y_LO = -26, Y_HI = 26;
const LEAN_K = 0.25;   // ~14° off vertical along the wind

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rain = null, mat = null, posAttr = null, drawCount = COUNT;
let off = null, len = null, spd = null;
const _dir = new THREE.Vector3();

export function createRain(scene) {
  const rnd = mulberry32(0x7a1f2e3d);
  const pos = new Float32Array(COUNT * 2 * 3);   // 2 verts per streak (head, tail)
  const col = new Float32Array(COUNT * 2 * 4);   // RGBA per vert → itemSize 4 = USE_COLOR_ALPHA taper
  off = new Float32Array(COUNT * 3);
  len = new Float32Array(COUNT); spd = new Float32Array(COUNT);
  const base = new THREE.Color(0xc6d0d2);        // overcast pale slate — NEVER white
  for (let i = 0; i < COUNT; i++) {
    const near = i < NEAR;
    const rad = 5 + rnd() * (R_FAR - 5), ang = rnd() * Math.PI * 2;
    off[i * 3] = Math.cos(ang) * rad;
    off[i * 3 + 1] = Y_LO + rnd() * (Y_HI - Y_LO);
    off[i * 3 + 2] = Math.sin(ang) * rad;
    const lv = 0.6 + rnd() * 0.8;                                   // ±40% length variance (kills uniformity)
    len[i] = (near && rnd() < 0.1) ? (11.0 + rnd()) : (near ? 7.0 : 3.75) * lv;   // near 5–9m (+rare speed-line), mid 2.5–5m
    spd[i] = (near ? 30 : 22) * (0.8 + rnd() * 0.4);               // fall speed ±20%
    const aHead = near ? 0.36 : 0.20;                              // leading end brighter; tail fades to 0
    const c = i * 8;
    col[c] = base.r; col[c + 1] = base.g; col[c + 2] = base.b; col[c + 3] = aHead; // vert 0 = head
    col[c + 4] = base.r; col[c + 5] = base.g; col[c + 6] = base.b; col[c + 7] = 0.0; // vert 1 = tail (transparent)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); // itemSize 4 → per-vertex alpha taper
  posAttr = geo.attributes.position;

  mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.NormalBlending, opacity: 0,   // opacity = rainMix gate (0 = fully off)
  });
  rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  rain.renderOrder = 3;
  rain.visible = false;
  scene.add(rain);
}

// Tier degrade: full / ~340 / ~180 streaks (index-less draw range over 2 verts each).
export function setRainTier(t) {
  drawCount = t >= 2 ? 180 : (t >= 1 ? 340 : COUNT);
  if (rain) rain.geometry.setDrawRange(0, drawCount * 2);
}

export function updateRain(dt, camera, env) {
  if (!rain) return;
  const mix = env.rainMix || 0;
  mat.opacity = mix;
  rain.visible = mix > 0.005;
  if (!rain.visible) return;

  _dir.set((env.windX || 0) * LEAN_K, -1, (env.windZ || 0) * LEAN_K).normalize();
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  const span = Y_HI - Y_LO, box = 2 * R_FAR;
  const p = posAttr.array;
  for (let i = 0; i < drawCount; i++) {
    const s = spd[i] * dt;
    let ox = off[i * 3] + _dir.x * s, oy = off[i * 3 + 1] + _dir.y * s, oz = off[i * 3 + 2] + _dir.z * s;
    if (oy < Y_LO) oy += span;
    if (ox < -R_FAR) ox += box; else if (ox > R_FAR) ox -= box;
    if (oz < -R_FAR) oz += box; else if (oz > R_FAR) oz -= box;
    off[i * 3] = ox; off[i * 3 + 1] = oy; off[i * 3 + 2] = oz;
    const wx = cx + ox, wy = cy + oy, wz = cz + oz;
    const L = len[i];
    const j = i * 6;
    // Head (leading, along the fall vector) → tail (up-wind = −fall·L). No billboarding:
    // a line has no width to orient, so there is no degenerate cross product to guard.
    p[j]     = wx;                p[j + 1] = wy;                p[j + 2] = wz;
    p[j + 3] = wx - _dir.x * L;   p[j + 4] = wy - _dir.y * L;   p[j + 5] = wz - _dir.z * L;
  }
  posAttr.needsUpdate = true;
}
