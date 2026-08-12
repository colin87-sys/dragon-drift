// stormLightning.js — Tempest Reach lightning: the STRIKE + the FLASH.
//
// Device-safe by construction: bolts are THREE.LineSegments (three offset passes for
// core→bloom→halo value structure), never billboarded quads. The FLASH is a pair of scalar
// envelopes fanned out to the sky, the rain (via the hooks already shipped: setRainFlash +
// uRainVeilFlash), the sea and exposure — one event, five differently-tuned responses, which is
// what reads as a WORLD reacting instead of a brightness knob.
//
// Two bolt classes (Fable PR-4 spec):
//   HERO  — off-lane spectacle, non-lethal, time/gust-driven erratic clusters (render-only, so
//           Math.random for shape/timing is fine — it never touches gameplay determinism). Partial flash.
//   HAZARD— lethal, telegraphed, DETERMINISTIC placement (hazards.js/level.js own that); it calls
//           strike() to spawn the visible bolt + full flash. See hazards.js type 'lightning'.
//
// Palette ruling (bible): biome lightning is BANNED from storm-teal #2fd8e8 (reserved for STORMREND).
// Core #ffffff, inner bloom #cdd6ff, outer halo #8fa8ff→#a98bff. Tint the halo, never the core.
import * as THREE from 'three';
import { TEMPEST_WIND } from './biomes.js';
import { makeGlowTexture } from './util.js';

const POOL = 3;                       // ≤2 simultaneous events + 1 spare (budget)
const MAX_SEG = 128;                  // per-pass segment cap (trunk+branches, well under the 400 total budget)
const CLOUD_Y = 46, SEA_Y = 0;        // strike spans cloud-base → sea

let scene = null, enabled = false;
let flashSky = 0, flashRain = 0;      // dual-decay envelopes (sky fast, rain lingers)
const _flashDir = new THREE.Vector2(0, -1);  // xz azimuth to the last strike (directional sky flash)
let _lastX = 0, _lastZ = -60;         // WORLD xz of the last strike (flashDir recomputed vs the moving camera)
let heroTimer = 1.2;                  // seconds to next hero bolt (erratic)
const _wind = new THREE.Vector2(TEMPEST_WIND.x, TEMPEST_WIND.z).normalize();

// A pooled bolt: 3 LineSegments passes sharing a rebuilt polyline. Positions rewritten per strike.
const pool = [];

function _mkPass(color, width, opacity, blending) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2 * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2 * 3), 3));
  g.setDrawRange(0, 0);
  const m = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, depthTest: true,
    blending, opacity,
  });
  const ls = new THREE.LineSegments(g, m);
  ls.frustumCulled = false; ls.renderOrder = 4; ls.visible = false;
  return { ls, g, pos: g.attributes.position, col: g.attributes.color };
}

let _glareTex = null, _ringGeo = null;
export function initStormLightning(s) {
  scene = s;
  _glareTex = makeGlowTexture('234,240,255');                  // #eaf0ff sea-contact glow
  _ringGeo = new THREE.RingGeometry(0.72, 1.0, 28); _ringGeo.rotateX(-Math.PI / 2);  // flat splash ring
  for (let i = 0; i < POOL; i++) {
    const core = _mkPass(0xffffff, 1, 0.95, THREE.NormalBlending);
    const bloom = _mkPass(0xcdd6ff, 1, 0.5, THREE.AdditiveBlending);
    const halo = _mkPass(0x9fb0ff, 1, 0.30, THREE.AdditiveBlending);
    // Sea contact: a tall vertical glare streak (Sprite) + a flat expanding splash ring (Mesh).
    const glare = new THREE.Sprite(new THREE.SpriteMaterial({ map: _glareTex, color: 0xeaf0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glare.scale.set(3.2, 8.5, 1);
    const ring = new THREE.Mesh(_ringGeo, new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.visible = false; glare.visible = false;
    glare.renderOrder = 4; ring.renderOrder = 4;
    scene.add(halo.ls); scene.add(bloom.ls); scene.add(core.ls); scene.add(glare); scene.add(ring);  // halo behind, core on top
    pool.push({ core, bloom, halo, glare, ring, active: false, t: 0, dur: 0, bx: 0, bz: 0, restrokes: [], peak: 1 });
  }
}
export function setStormLightningEnabled(on) { enabled = !!on; if (!on) { flashSky = flashRain = 0; for (const b of pool) _hide(b); } }
export function getStormFlashSky() { return flashSky; }
export function getStormFlashRain() { return flashRain; }
export function getStormFlashDir() { return _flashDir; }

function _hide(b) { b.active = false; b.core.ls.visible = b.bloom.ls.visible = b.halo.ls.visible = false; if (b.glare) { b.glare.visible = false; b.ring.visible = false; } }

// Build a jagged cloud→sea polyline with branches into the three passes. offset drives bloom/halo width.
function _buildBolt(b, x, z, scale) {
  // Trunk: midpoint-displaced from cloud to sea, drifting downwind over its length (lives in the storm's wind).
  const N = 10;                                    // trunk joints (8–12)
  const pts = [];
  const topX = x, topZ = z, botX = x + _wind.x * (6 + Math.random() * 10), botZ = z + _wind.y * (6 + Math.random() * 10);
  b.bx = botX; b.bz = botZ;   // sea-contact point for the glare + ring
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let px = topX + (botX - topX) * t, py = CLOUD_Y + (SEA_Y - CLOUD_Y) * t, pz = topZ + (botZ - topZ) * t;
    const amp = (1 - t) * 4.5 * scale + 1.0;       // deflection decays toward the committed sea contact
    px += (Math.random() - 0.5) * amp;
    pz += (Math.random() - 0.5) * amp;
    pts.push(px, py, pz);
  }
  // Branches: 3–5, upper 2/3 only, one recursion level, no sub-branching.
  const branches = [];
  const nB = 3 + (Math.random() * 3 | 0);
  for (let k = 0; k < nB; k++) {
    const ji = 1 + (Math.random() * (N * 0.66) | 0);     // a joint in the upper 2/3
    const bx = pts[ji * 3], by = pts[ji * 3 + 1], bz = pts[ji * 3 + 2];
    const segs = 2 + (Math.random() * 3 | 0);
    const remain = (1 - ji / N);
    const len = (0.30 + Math.random() * 0.15) * remain * CLOUD_Y;
    const dir = Math.atan2(_wind.y, _wind.x) + (Math.random() - 0.5) * 1.4;
    const bp = [bx, by, bz];
    let cx = bx, cy = by, cz = bz;
    for (let s = 1; s <= segs; s++) {
      cx += Math.cos(dir) * (len / segs) + (Math.random() - 0.5) * 2;
      cy -= (len / segs) * (0.6 + Math.random() * 0.3);   // down-and-out
      cz += Math.sin(dir) * (len / segs) + (Math.random() - 0.5) * 2;
      bp.push(cx, cy, cz);
    }
    branches.push(bp);
  }
  // Emit into each pass. trunkOnly=false uses branches; core taper via vertex brightness.
  _emit(b.core, pts, branches, 0.0, [1, 1, 1], [0.92, 0.92, 0.95]);            // trunk stays hot to the water (return-stroke brightest at contact)
  _emit(b.bloom, pts, branches, 0.24, [0.80, 0.84, 1.0], [0.62, 0.66, 0.90]);  // tighter offset (0.15–0.3m) so it weaves, not tramlines
  _emit(b.halo, pts, branches, 1.5, [0.56, 0.69, 1.0], [0.66, 0.55, 0.90]);   // #8fa8ff→#a98bff violet, wider near the deck
}

// Turn a polyline (+branches) into LineSegments pairs, offset ⟂-ish for width, with a top→bottom colour ramp.
function _emit(pass, pts, branches, offset, cTop, cBot) {
  const P = pass.pos.array, Cc = pass.col.array;
  let v = 0;
  const push = (arr, useBranch) => {
    for (let i = 0; i + 3 < arr.length && v + 2 <= MAX_SEG * 2; i += 3) {
      const y0 = arr[i + 1], y1 = arr[i + 4];
      const off0 = offset * (0.35 + 0.65 * (y0 / CLOUD_Y)) * (useBranch ? 0.5 : 1); // WIDER near the deck, tapering to the sea contact; branches thinner
      const off1 = offset * (0.35 + 0.65 * (y1 / CLOUD_Y)) * (useBranch ? 0.5 : 1);
      const s0 = ((i / 3) % 2 === 0) ? 1 : -1;                                        // alternate the offset side → apparent width
      P[v * 3] = arr[i] + _wind.y * off0 * s0; P[v * 3 + 1] = y0; P[v * 3 + 2] = arr[i + 2] - _wind.x * off0 * s0;
      const t0 = 1 - y0 / CLOUD_Y; _rampCol(Cc, v, cTop, cBot, t0, useBranch);
      v++;
      P[v * 3] = arr[i + 3] + _wind.y * off1 * s0; P[v * 3 + 1] = y1; P[v * 3 + 2] = arr[i + 5] - _wind.x * off1 * s0;
      const t1 = 1 - y1 / CLOUD_Y; _rampCol(Cc, v, cTop, cBot, t1, useBranch);
      v++;
    }
  };
  push(pts, false);
  for (const br of branches) push(br, true);
  pass.pos.needsUpdate = true; pass.col.needsUpdate = true;
  pass.g.setDrawRange(0, v);
}
function _rampCol(Cc, v, cTop, cBot, t, branch) {
  const b = branch ? 0.6 : 1;             // branches dimmer than the committed trunk
  const te = branch ? t : t * 0.15;       // the TRUNK holds ≥85% to the water (only branches taper) — kills mid-air-termination
  Cc[v * 3] = (cTop[0] + (cBot[0] - cTop[0]) * te) * b;
  Cc[v * 3 + 1] = (cTop[1] + (cBot[1] - cTop[1]) * te) * b;
  Cc[v * 3 + 2] = (cTop[2] + (cBot[2] - cTop[2]) * te) * b;
}

// Fire a strike at WORLD xz. peak: full (1.0) for lethal, partial (~0.3) for far heroes.
export function strike(wx, wz, peak) {
  if (!enabled || !scene) return;
  const b = pool.find((p) => !p.active) || pool[0];
  _buildBolt(b, wx, wz, 1);
  b.active = true; b.t = 0; b.peak = peak;
  b.glare.position.set(b.bx, 4.2, b.bz); b.ring.position.set(b.bx, 0.35, b.bz); b.ring.scale.setScalar(0.5);
  // dur: leader + return + a seeded re-stroke train (anti-metronome: intervals from Math.random, render-only)
  b.restrokes = [];
  const nR = 2 + (Math.random() * 3 | 0);
  let tt = 0.075;                                     // after the first return stroke (~75ms)
  for (let i = 0; i < nR; i++) { tt += 0.04 + Math.random() * 0.04; b.restrokes.push(tt); tt += 0.03 + Math.random() * 0.02; }
  b.dur = tt + 0.12;                                  // + after-image
  _lastX = wx; _lastZ = wz;
  flashSky = Math.max(flashSky, peak);
  flashRain = Math.max(flashRain, peak * 0.9);
}

const _BOLTCAP = (typeof location !== 'undefined') && new URLSearchParams(location.search).has('boltcap'); // TEMP gate-capture aid
let _capT = 0;
export function updateStormLightning(dt, camera, env, time) {
  if (!enabled) return;
  const active = (env.rainMix || 0) > 0.02;
  if (_BOLTCAP && active) {   // keep ONE bolt spawned + PIN it lit each frame so a still always shows the channel
    _capT -= dt;
    if (_capT <= 0 || !pool.some((p) => p.active)) { strike(camera.position.x - 8, camera.position.z - 55, 1.0); _capT = 0.6; }
  }
  // Directional flash: recompute the xz azimuth from the camera to the last strike each frame.
  { const dx = _lastX - camera.position.x, dz = _lastZ - camera.position.z, dl = Math.hypot(dx, dz) || 1; _flashDir.set(dx / dl, dz / dl); }
  // Flash decay — sky fast (τ≈80ms), rain lingers (τ≈140ms). The temporal split is what sells "inside weather".
  flashSky *= Math.exp(-dt / 0.08);
  flashRain *= Math.exp(-dt / 0.14);
  if (flashSky < 0.002) flashSky = 0;
  if (flashRain < 0.003) flashRain = 0;

  // HERO bolt scheduler — erratic, denser during gusts (render-only timing).
  if (active) {
    const gust = 0.0; // heroTimer already folds gust below via env; keep simple + gust via rainMix pulse
    heroTimer -= dt * (0.7 + 1.3 * (env.rainMix || 0));
    if (heroTimer <= 0) {
      // off-lane hero: 60–160m out to the side/ahead, against the dark flanks (never the breach axis ±25°).
      let ang = (Math.random() * 2 - 1) * Math.PI;
      // avoid the down-lane breach window (±25° around -Z, the forward axis)
      if (Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)) + Math.PI / 2) < 0.44) ang += 1.2;
      const r = 70 + Math.random() * 120;
      const sx = camera.position.x + Math.cos(ang) * r;
      const sz = camera.position.z - 30 - Math.random() * 120;   // ahead-ish, in front of the camera
      const distFade = Math.max(0.18, 1 - r / 260);
      strike(sx, sz, (0.25 + Math.random() * 0.15) * distFade);
      heroTimer = 1.6 + Math.random() * 3.5;   // uneven rest
    }
  }

  // Advance active bolt events: leader → return → re-strokes (trunk re-lit) → after-image fade.
  for (const b of pool) {
    if (!b.active) continue;
    b.t += dt;
    if (b.t >= b.dur) { _hide(b); continue; }
    // Is a stroke lit right now? return stroke 0–0.075s, then each re-stroke window ±18ms.
    let lit = b.t < 0.075 ? 1 : 0;
    let kick = 0;
    for (let i = 0; i < b.restrokes.length; i++) {
      const rt = b.restrokes[i];
      if (Math.abs(b.t - rt) < 0.02) { lit = Math.max(lit, 1 - i * 0.18); kick = lit; }
    }
    // after-image: core alone, dim, last 120ms
    const after = b.t > b.dur - 0.12 ? (b.dur - b.t) / 0.12 * 0.15 : 0;
    const coreA = Math.max(lit, after);
    b.core.ls.visible = coreA > 0.01; b.core.ls.material.opacity = 0.95 * coreA;
    b.bloom.ls.visible = lit > 0.01; b.bloom.ls.material.opacity = 0.5 * lit;
    b.halo.ls.visible = lit > 0.01; b.halo.ls.material.opacity = 0.30 * lit;
    // Sea contact: the glare streak flares with the strokes; the splash ring expands 0.5→7m over ~0.42s and fades.
    b.glare.visible = coreA > 0.01; b.glare.material.opacity = 0.85 * coreA;
    const rt = Math.min(1, b.t / 0.42);
    b.ring.visible = rt < 1 && b.peak > 0.5;         // ring only on committed (near-full) strikes
    if (b.ring.visible) { b.ring.scale.setScalar(0.5 + rt * 6.5); b.ring.material.opacity = 0.5 * (1 - rt) * b.peak; }
    // Re-kick the flash on each re-stroke so the flash stutters WITH the bolt.
    if (kick > 0) { flashSky = Math.max(flashSky, b.peak * kick * 0.7); flashRain = Math.max(flashRain, b.peak * kick * 0.65); }
    // Capture aid: pin the channel fully lit so a still always shows morphology (never overrides gameplay — URL-gated).
    if (_BOLTCAP) {
      b.core.ls.visible = true; b.core.ls.material.opacity = 0.95;
      b.bloom.ls.visible = true; b.bloom.ls.material.opacity = 0.5;
      b.halo.ls.visible = true; b.halo.ls.material.opacity = 0.30;
      b.glare.visible = true; b.glare.material.opacity = 0.85;
      flashSky = Math.max(flashSky, 0.5); flashRain = Math.max(flashRain, 0.55);
    }
  }
}
