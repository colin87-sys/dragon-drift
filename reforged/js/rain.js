// rain.js — premium STORM RAIN (Tempest Reach). Device-safe primitives only.
//
// A previous "premium" rain built from camera-facing billboarded QUADS (custom ShaderMaterial,
// manual clip.x/clip.w varying, DoubleSide) blanked the whole frame on real GPUs — behind-camera
// quads straddling the near plane rasterized screen-wide (headless software GL clipped them, hiding
// it). So EVERYTHING here uses primitives that clip cleanly: THREE.LineSegments (streaks) and
// THREE.Points (mist). No custom shader, no billboard math, no double-sided geometry.
//
// Layers (Fable's spec):
//   N — near-body: closest streaks get a bright core + two dim flanking lines → real thickness
//       (GL lines are 1px, so parallel lines are the ONLY way to read "thick / close"). Per-streak
//       angle jitter kills the comb.
//   V — value flip: each streak is coloured by its elevation — PALE against the dark deck, DARK
//       against the pale horizon slot, pale-dim against the sea; a warm backlit whisper in the sun
//       quadrant (the LEAK). Recomputed only on recycle (near-free).
//   G — gust clock (rainGustAt, a pure function of time, shared with the sky veil + sea rings) drives
//       lean, fall speed, near alpha, speed-line length; the gust front SWEEPS along the wind.
//   P — near mist: suspended spray points between the streaks (procedural radial sprite, no asset).
//   X — flash reveal: setRainFlash(v) lifts opacity + cools the colour when the lightning fires
//       (0 until the hazard lands → inert).
// rainMix-gated (0 elsewhere = byte-identical), tier-thinned, render-only.
import * as THREE from 'three';
import { SUN_DIR } from './biomes.js';

const NEAR = 140, MID = 340, COUNT = NEAR + MID;   // ~480 streaks
const NEAR_THICK = 72;                              // the closest streaks get flanking lines (real thickness)
const MIST = 150;                                   // suspended spray points (layer P)
const R_FAR = 38, Y_LO = -26, Y_HI = 26;
const LEAN_K = 0.25;                                // ~14° base lean; gusts push it to ~24°

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Layer G: the GUST CLOCK ------------------------------------------------
// One erratic wind envelope in [0,1], a PURE function of time so the veil (sky shader), the streaks,
// the mist and the sea splash-rings all read the SAME gust — wind coherence by construction. Long
// calms, short bursts, uneven rests (never a sine). Render-only + deterministic-in-time (no
// Math.random), so it never touches gameplay determinism.
function _gvHash(n) { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
function _gvN(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return _gvHash(i) * (1 - u) + _gvHash(i + 1) * u; }
export function rainGustAt(t) {
  const slow = _gvN(t * 0.11), fast = _gvN(t * 0.41 + 13.1);
  let g = (slow * 0.68 + fast * 0.32 - 0.52) / 0.33;   // bias so calm dominates; only the top becomes a gust
  g = Math.max(0, Math.min(1, g));
  g = g * g * (3 - 2 * g);                              // smooth the burst shoulders
  g *= 0.70 + 0.30 * _gvN(t * 2.1 + 4.7);              // stutter inside a burst (not a clean swell)
  return g;
}

// ---- palette (layer V) ------------------------------------------------------
const C_DECK = new THREE.Color(0xc6d0d2);   // pale slate — streak against the dark storm deck (light over dark)
const C_SLOT = new THREE.Color(0x77828a);   // dark slate — streak against the pale horizon slot (dark over light)
const C_SEA  = new THREE.Color(0xa9b3b5);   // pale-dim — streak against the mid-dark sea
const C_LEAK = new THREE.Color(0xe6cfa2);   // warm — backlit rain in the sun quadrant (the LEAK)

let rain = null, mat = null, posAttr = null, colAttr = null, drawSegs = COUNT + NEAR_THICK * 2;
let mist = null, mmat = null, mistPos = null, moff = null;
let off = null, len = null, spd = null, jitx = null, jitz = null, tier = 0;
let flashV = 0;
const _dir = new THREE.Vector3(), _perp = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const _sunAz = Math.atan2(SUN_DIR.z, SUN_DIR.x);

function _streakColor(ox, oy, oz, near) {
  const hyp = Math.hypot(ox, oz) + 1e-4;
  const elev = Math.atan2(oy, hyp);                 // elevation of this drop from the camera
  let c;
  if (elev > 0.14) c = C_DECK;                       // high → against the deck: pale (light/dark)
  else if (elev < -0.12) c = C_SEA;                  // low → against the sea: pale-dim
  else c = C_SLOT;                                   // horizon band → dark slate (dark/light — the flip)
  let r = c.r, g = c.g, b = c.b;
  // The LEAK: streaks low in the sun quadrant catch a warm backlit tint (the storm failing to hold the sun).
  const az = Math.atan2(oz, ox);
  let dAz = Math.abs(az - _sunAz); if (dAz > Math.PI) dAz = 2 * Math.PI - dAz;
  if (dAz < 0.55 && elev < 0.12) {
    const w = (1 - dAz / 0.55) * (near ? 0.45 : 0.28);
    r += (C_LEAK.r - r) * w; g += (C_LEAK.g - g) * w; b += (C_LEAK.b - b) * w;
  }
  return [r, g, b];
}

export function createRain(scene) {
  const rnd = mulberry32(0x7a1f2e3d);
  // Vertex layout: [0 .. COUNT*2) main segments (streak i → 2i head, 2i+1 tail);
  //                [COUNT*2 ..) flanks for the closest NEAR_THICK streaks (k → 4 verts: L head/tail, R head/tail).
  const vMain = COUNT * 2, vFlank = NEAR_THICK * 4, vTot = vMain + vFlank;
  const pos = new Float32Array(vTot * 3);
  const col = new Float32Array(vTot * 4);
  off = new Float32Array(COUNT * 3);
  len = new Float32Array(COUNT); spd = new Float32Array(COUNT);
  jitx = new Float32Array(COUNT); jitz = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const near = i < NEAR, thick = i < NEAR_THICK;
    // Tier the radius so the field reads in 3 depth planes: thick(closest) → near → mid.
    const rad = thick ? (3 + rnd() * 6) : (near ? (9 + rnd() * 14) : (13 + rnd() * (R_FAR - 13)));
    const ang = rnd() * Math.PI * 2;
    off[i * 3] = Math.cos(ang) * rad;
    off[i * 3 + 1] = Y_LO + rnd() * (Y_HI - Y_LO);
    off[i * 3 + 2] = Math.sin(ang) * rad;
    const lv = 0.6 + rnd() * 0.8;
    len[i] = (near && rnd() < 0.1) ? (11.0 + rnd()) : (near ? 7.0 : 3.75) * lv;
    spd[i] = (near ? 30 : 22) * (0.8 + rnd() * 0.4);
    jitx[i] = (rnd() - 0.5) * 0.09;                  // per-streak angle jitter (~±2.6°) — kills the comb
    jitz[i] = (rnd() - 0.5) * 0.09;
    // Head alpha per plane; tail fades to 0 (per-vertex). Colour = value flip.
    const aHead = thick ? 0.44 : (near ? 0.34 : 0.18);
    const rgb = _streakColor(off[i * 3], off[i * 3 + 1], off[i * 3 + 2], near);
    const h = i * 8;                                  // 2 verts × 4 comps
    col[h] = rgb[0]; col[h + 1] = rgb[1]; col[h + 2] = rgb[2]; col[h + 3] = aHead;       // head
    col[h + 4] = rgb[0]; col[h + 5] = rgb[1]; col[h + 6] = rgb[2]; col[h + 7] = 0.0;     // tail
    if (thick) {
      const fb = (vMain + i * 4) * 4;                 // flank colour base — 1/3 alpha, same hue
      for (let f = 0; f < 4; f++) {                   // L head, L tail, R head, R tail
        const fa = (f % 2 === 0) ? aHead * 0.34 : 0.0;
        col[fb + f * 4] = rgb[0]; col[fb + f * 4 + 1] = rgb[1]; col[fb + f * 4 + 2] = rgb[2]; col[fb + f * 4 + 3] = fa;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));   // itemSize 4 → per-vertex alpha
  posAttr = geo.attributes.position; colAttr = geo.attributes.color;
  mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.NormalBlending, opacity: 0,
  });
  rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false; rain.renderOrder = 3; rain.visible = false;
  scene.add(rain);

  // ---- Layer P: near MIST (Points) ----
  const mp = new Float32Array(MIST * 3);
  moff = new Float32Array(MIST * 3);
  for (let i = 0; i < MIST; i++) {
    const rad = 2 + rnd() * 10, ang = rnd() * Math.PI * 2, yy = -6 + rnd() * 12;
    moff[i * 3] = Math.cos(ang) * rad; moff[i * 3 + 1] = yy; moff[i * 3 + 2] = Math.sin(ang) * rad;
  }
  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  mistPos = mgeo.attributes.position;
  mmat = new THREE.PointsMaterial({
    size: 0.10, sizeAttenuation: true, map: _radialSprite(), color: new THREE.Color(0xc2ccce),
    transparent: true, depthWrite: false, blending: THREE.NormalBlending, opacity: 0,
  });
  mist = new THREE.Points(mgeo, mmat);
  mist.frustumCulled = false; mist.renderOrder = 3; mist.visible = false;
  scene.add(mist);
}

// A tiny runtime radial-falloff sprite (no asset file) so mist points are soft dots, not squares.
function _radialSprite() {
  const N = 16, data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (x + 0.5) / N - 0.5, dy = (y + 0.5) / N - 0.5;
    const d = Math.min(1, Math.hypot(dx, dy) * 2);
    const a = Math.max(0, 1 - d); const v = a * a * 255;
    const o = (y * N + x) * 4; data[o] = data[o + 1] = data[o + 2] = 255; data[o + 3] = v;
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.needsUpdate = true; return tex;
}

// Tier degrade: full / near+mid / thinner. Flanks + mist die first.
export function setRainTier(t) {
  tier = t;
  drawSegs = t >= 2 ? 180 : (t >= 1 ? (340 + NEAR_THICK) : (COUNT + NEAR_THICK * 2));
  if (rain) rain.geometry.setDrawRange(0, drawSegs * 2);
}

// Layer X: the lightning flash reveals the rain volume (0 = inert, until the hazard lands).
export function setRainFlash(v) { flashV = v || 0; }

export function updateRain(dt, camera, env, time = 0) {
  if (!rain) return;
  const mix = env.rainMix || 0;
  rain.visible = mix > 0.005; mist.visible = rain.visible && tier < 2;
  if (!rain.visible) { mat.opacity = 0; return; }
  const gust = rainGustAt(time);
  // Flash lifts opacity + cools the colour (layer X); base opacity = rainMix.
  mat.opacity = Math.min(1, mix * (1 + 0.5 * flashV));
  mat.color.setRGB(1, 1, 1).lerp(new THREE.Color(0xdfe7f2), flashV);
  mmat.opacity = mix * (0.5 + 0.5 * gust) * (1 - 0.5 * flashV * 0);
  mmat.color.setHex(0xc2ccce);

  // Gust-driven fall vector: lean 14°→~24°, fall speed ×up to 1.3.
  const lean = LEAN_K * (1 + 0.8 * gust);
  const spdMul = 1 + 0.3 * gust;
  _dir.set((env.windX || 0) * lean, -1, (env.windZ || 0) * lean).normalize();
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  const span = Y_HI - Y_LO, box = 2 * R_FAR;
  const windX = env.windX || 0, windZ = env.windZ || 0;
  const p = posAttr.array, c = colAttr.array, vMain = COUNT * 2;
  let colDirty = false;
  for (let i = 0; i < COUNT; i++) {
    const near = i < NEAR, thick = i < NEAR_THICK;
    // SHEETING: the gust front traverses along the wind — phase each streak's extra speed by its
    // position projected on the wind, over a ~40m wavelength, so a sheet SWEEPS through (not unison).
    const phase = (off[i * 3] * windX + off[i * 3 + 2] * windZ) / 40;
    const sheet = 0.5 + 0.5 * Math.sin(phase * 6.283 - time * 1.6);
    const s = spd[i] * dt * spdMul * (1 + 0.25 * gust * sheet);
    let ox = off[i * 3] + (_dir.x + jitx[i]) * s, oy = off[i * 3 + 1] + _dir.y * s, oz = off[i * 3 + 2] + (_dir.z + jitz[i]) * s;
    let recycled = false;
    if (oy < Y_LO) { oy += span; recycled = true; }
    if (ox < -R_FAR) { ox += box; recycled = true; } else if (ox > R_FAR) { ox -= box; recycled = true; }
    if (oz < -R_FAR) { oz += box; recycled = true; } else if (oz > R_FAR) { oz -= box; recycled = true; }
    off[i * 3] = ox; off[i * 3 + 1] = oy; off[i * 3 + 2] = oz;
    const wx = cx + ox, wy = cy + oy, wz = cz + oz;
    // gusts lengthen the speed-lines
    const L = len[i] * (1 + 0.2 * gust * (near ? 1 : 0.4));
    const tx = -(_dir.x + jitx[i]) * L, ty = -_dir.y * L, tz = -(_dir.z + jitz[i]) * L;
    const j = i * 6;
    p[j] = wx; p[j + 1] = wy; p[j + 2] = wz;
    p[j + 3] = wx + tx; p[j + 4] = wy + ty; p[j + 5] = wz + tz;
    // Value flip recompute on recycle (near-free — colour is stable between recycles).
    if (recycled) {
      const rgb = _streakColor(ox, oy, oz, near);
      const aHead = thick ? 0.44 : (near ? 0.34 : 0.18);
      const h = i * 8;
      c[h] = rgb[0]; c[h + 1] = rgb[1]; c[h + 2] = rgb[2]; c[h + 3] = aHead;
      c[h + 4] = rgb[0]; c[h + 5] = rgb[1]; c[h + 6] = rgb[2];
      if (thick) {
        const fb = (vMain + i * 4) * 4;
        for (let f = 0; f < 4; f++) { c[fb + f * 4] = rgb[0]; c[fb + f * 4 + 1] = rgb[1]; c[fb + f * 4 + 2] = rgb[2]; }
      }
      colDirty = true;
    }
    // Flank lines for the closest streaks (layer N — the thickness). Offset ⟂ to the fall, in the
    // horizontal plane, ±~0.04m; two parallel dim lines flanking the bright core → 3 value zones.
    if (thick) {
      _perp.set(_dir.z, 0, -_dir.x); const pl = _perp.length(); if (pl > 1e-4) _perp.multiplyScalar(1 / pl); else _perp.set(1, 0, 0);
      const wo = 0.045;
      const fb = (vMain + i * 4) * 3;
      // L segment
      p[fb] = wx - _perp.x * wo; p[fb + 1] = wy; p[fb + 2] = wz - _perp.z * wo;
      p[fb + 3] = wx - _perp.x * wo + tx; p[fb + 4] = wy + ty; p[fb + 5] = wz - _perp.z * wo + tz;
      // R segment
      p[fb + 6] = wx + _perp.x * wo; p[fb + 7] = wy; p[fb + 8] = wz + _perp.z * wo;
      p[fb + 9] = wx + _perp.x * wo + tx; p[fb + 10] = wy + ty; p[fb + 11] = wz + _perp.z * wo + tz;
    }
  }
  posAttr.needsUpdate = true;
  if (colDirty) colAttr.needsUpdate = true;

  // ---- mist drift (layer P): suspended spray on the wind, not falling ----
  if (mist.visible) {
    const mp = mistPos.array, mdrift = dt * (0.8 + 1.4 * gust);
    for (let i = 0; i < MIST; i++) {
      let ox = moff[i * 3] + windX * mdrift, oy = moff[i * 3 + 1] - 0.15 * dt, oz = moff[i * 3 + 2] + windZ * mdrift;
      if (oy < -6) oy += 12;
      const r2 = ox * ox + oz * oz; if (r2 > 144) { ox *= 0.3; oz *= 0.3; }   // keep it a near cloud
      moff[i * 3] = ox; moff[i * 3 + 1] = oy; moff[i * 3 + 2] = oz;
      mp[i * 3] = cx + ox; mp[i * 3 + 1] = cy + oy; mp[i * 3 + 2] = cz + oz;
    }
    mistPos.needsUpdate = true;
  }
}
