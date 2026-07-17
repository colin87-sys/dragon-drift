import * as THREE from 'three';

// N5 (GRAPHICS-OVERHAUL.md) — Procedural sky IBL, rung 1: the sky becomes the
// scene's ambient light. Every frame we project the SAME analytic sky-dome
// gradient (a JS port of environment.js's skyMat, minus the transient
// stars/aurora/surge) into a 9-coefficient spherical-harmonic LightProbe, so the
// whole world picks up the biome sky's colour and re-lights as biomes cross-fade.
// CPU cost is ~64 direction evaluations/frame — negligible. OFF by default (the
// shipped HemisphereLight carries the ambient); ON, the probe carries it and the
// hemi drops to a low fill.
//
// three's LightProbe expects the RADIANCE environment SH (the light_probe shader
// chunk applies the cosine-lobe irradiance convolution), so we project the sky
// colour directly — no pre-convolution.

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
function smoothstep(a, b, x) { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
const lerp = (a, b, t) => a + (b - a) * t;

// ~64 evenly-spread sample directions (Fibonacci sphere), precomputed once.
// The offset lattice `y = 1 − 2(i+0.5)/n` is deliberate: the naive `i/(n−1)`
// form lands a sample exactly ON each pole AND double-weights them, which leaks
// a spurious band-2 coefficient (~1.6% of DC) into a constant sky — a false
// zenith/horizon tilt every frame. The +0.5 offset kills it ~13× (verified by
// tests/skyprobe.mjs's constant-sky check).
function fibSphere(n) {
  const dirs = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    dirs.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return dirs;
}
const N = 64;
const DIRS = fibSphere(N);
const WEIGHT = (4 * Math.PI) / N; // Monte-Carlo solid-angle weight per sample

// Tunables — the human judges the balance on the PR preview. PROBE_INTENSITY is
// set for rough ENERGY PARITY with the shipped ambient (hemi 0.8): the probe's
// diffuse ≈ 0.886·DC·intensity, and a dusk DC of ~1.6 red means ~0.6 keeps ON in
// the same exposure regime as OFF (just warmer, sky-coloured) rather than a 3×
// brightness jump.
const PROBE_INTENSITY = 0.62; // probe strength when ON
const HEMI_FILL = 0.28;       // hemi intensity when the probe carries the ambient

let probe = null;
let hemiRef = null;
let hemiBaseI = 0.8;
let enabled = false;

const _sh = new THREE.SphericalHarmonics3();
const _basis = new Array(9).fill(0);
const _c = new THREE.Vector3();

export function initSkyProbe(scene, hemi) {
  hemiRef = hemi;
  hemiBaseI = hemi.intensity;
  probe = new THREE.LightProbe();
  probe.intensity = 0; // OFF = shipped (hemi carries the ambient)
  scene.add(probe);
}

export function setSkyProbeEnabled(on) {
  enabled = !!on;
  if (!probe) return;
  probe.intensity = enabled ? PROBE_INTENSITY : 0;
  if (hemiRef) hemiRef.intensity = enabled ? HEMI_FILL : hemiBaseI;
}

export function skyProbeEnabled() { return enabled; }

// JS port of the sky-dome gradient (environment.js skyMat): the 3-band vertical
// gradient + dual-fog far band + the broad sun glow. Skips the tight sun disc
// (pow 900 — negligible as irradiance) and the transient stars/aurora/surge.
// env colours are THREE.Color in LINEAR space (setHex converts), matching the
// linear radiance the probe wants. Writes into `out` (Vector3 rgb).
export function skyColorAt(d, env, sunDir, out) {
  const h = clamp01(d.y);
  const b = env.deckBias || 0;   // per-biome deck bias (mirror of the skyMat gradient; 0 = shipped)
  const t1 = smoothstep(0.0, 0.25 - 0.12 * b, h);
  const t2 = smoothstep(0.2 - 0.13 * b, 0.7 - 0.34 * b, h);
  const ff = env.fogFarMix * (1.0 - smoothstep(0.0, 0.15, h));
  const s = Math.max(d.x * sunDir.x + d.y * sunDir.y + d.z * sunDir.z, 0);
  const glow = Math.pow(s, 10.0) * 0.16;
  const H = env.skyHorizon, M = env.skyMid, T = env.skyTop, F = env.fogFarColor, G = env.sunGlow;
  out.x = lerp(lerp(lerp(H.r, M.r, t1), T.r, t2), F.r, ff) + G.r * glow;
  out.y = lerp(lerp(lerp(H.g, M.g, t1), T.g, t2), F.g, ff) + G.g * glow;
  out.z = lerp(lerp(lerp(H.b, M.b, t1), T.b, t2), F.b, ff) + G.b * glow;
  // EYE-BREACH mirror (Tempest): the ported-drift trap that bit deckBias — the low-frequency ambient
  // approximation MUST see the breach too, or the world's sky-IBL fill won't answer the eye of the gale.
  // Kept deliberately SIMPLE (the shaped almond is a fragment-only cosmetic; the SH probe only needs the
  // NET brightening toward the sun az): a warm-white lift concentrated on the sun direction. 0 when
  // env.breachMix is absent/0 → byte-identical (guards tests/skyprobe.mjs, which never sets breachMix).
  const bm = env.breachMix || 0;
  if (bm > 0) {
    const bwin = Math.pow(s, 8.0) * bm;   // s = clamped alignment to sunDir (computed above)
    out.x += 0.30 * bwin; out.y += 0.28 * bwin; out.z += 0.24 * bwin;   // warm-white ambient lift
  }
}

// Project the sky radiance into the 9 SH coefficients of `outSH` (raw radiance —
// three's LightProbe shader applies the cosine-lobe irradiance convolution). Pure
// + allocation-free; exported so tests/skyprobe.mjs can check it directly (a
// constant sky must give DC = 4π·Y00·c and ~zero higher bands).
export function projectSkySH(env, sunDir, outSH) {
  const co = outSH.coefficients;
  for (let i = 0; i < 9; i++) co[i].set(0, 0, 0);
  for (let j = 0; j < N; j++) {
    const d = DIRS[j];
    skyColorAt(d, env, sunDir, _c);
    THREE.SphericalHarmonics3.getBasisAt(d, _basis);
    for (let i = 0; i < 9; i++) {
      const b = _basis[i] * WEIGHT;
      co[i].x += _c.x * b;
      co[i].y += _c.y * b;
      co[i].z += _c.z * b;
    }
  }
  return outSH;
}

// Reproject the sky into the probe. Cheap enough to run every frame; inputs are
// the per-frame computeEnv() output so it lerps perfectly across biome seams.
export function updateSkyProbe(env, sunDir) {
  if (!enabled || !probe) return;
  projectSkySH(env, sunDir, _sh);
  probe.sh.copy(_sh);
}
