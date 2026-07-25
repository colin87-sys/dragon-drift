// N5 sky-IBL math gate (GRAPHICS-OVERHAUL.md). Pure math, CI-safe (no WebGL):
//   1. a CONSTANT sky projects to DC = 4π·Y00·c and ~zero higher bands (this is
//      what catches a pole-doubled / mis-weighted sample lattice);
//   2. the SH projection is LINEAR in the sky colours, so it lerps perfectly
//      across biome seams (computeEnv only lerps colours);
//   3. skyColorAt faithfully computes the skyMat gradient (guards port drift).
//   node tests/skyprobe.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const { skyColorAt, projectSkySH } = await import('../js/skyProbe.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

const constEnv = (c) => ({ skyHorizon: { r: c, g: c, b: c }, skyMid: { r: c, g: c, b: c }, skyTop: { r: c, g: c, b: c }, fogFarColor: { r: c, g: c, b: c }, fogFarMix: 0.5, sunGlow: { r: 0, g: 0, b: 0 } });
const SUN = new THREE.Vector3(-0.22, 0.1, -1).normalize();
const sh = () => new THREE.SphericalHarmonics3();

// 1. Constant sky → DC = 4π·Y00·c ≈ 3.5449·c; higher bands ≈ 0.
const Y00_4PI = 4 * Math.PI * 0.2820947917738781;
{
  const c = 0.8;
  const co = projectSkySH(constEnv(c), SUN, sh()).coefficients;
  check(`constant sky DC = 4π·Y00·c (${co[0].x.toFixed(4)} ≈ ${(Y00_4PI * c).toFixed(4)})`, Math.abs(co[0].x - Y00_4PI * c) < 1e-3 && Math.abs(co[0].y - Y00_4PI * c) < 1e-3);
  let maxBand = 0;
  for (let i = 1; i < 9; i++) maxBand = Math.max(maxBand, Math.abs(co[i].x), Math.abs(co[i].y), Math.abs(co[i].z));
  // With the pole-doubled lattice this residual is ~0.057 (1.6% of DC); the fixed
  // lattice drops it ~13×. Tolerance 0.02 passes only with the fix.
  check(`constant sky higher bands ≈ 0 (max ${maxBand.toFixed(4)} < 0.02 — lattice unbiased)`, maxBand < 0.02);
}

// 2. Projection is linear in colour → lerps perfectly across seams.
{
  const A = projectSkySH(constEnv(0.4), SUN, sh()).coefficients;
  const B = projectSkySH(constEnv(1.2), SUN, sh()).coefficients;
  const M = projectSkySH(constEnv(0.8), SUN, sh()).coefficients; // 0.8 = midpoint of 0.4,1.2
  let ok = true;
  for (let i = 0; i < 9; i++) ok = ok && Math.abs(M[i].x - 0.5 * (A[i].x + B[i].x)) < 1e-4;
  check('SH projection is linear in sky colour (seam-lerp safe)', ok);
}

// 3. Determinism.
{
  const a = projectSkySH(constEnv(0.7), SUN, sh()).coefficients[0].x;
  const b = projectSkySH(constEnv(0.7), SUN, sh()).coefficients[0].x;
  check('projection is deterministic', a === b);
}

// 4. skyColorAt matches an independent transliteration of the skyMat gradient.
{
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  // A varied env (distinct per-band colours) so the gradient actually exercises.
  const env = { skyHorizon: { r: 1.0, g: 0.85, b: 0.5 }, skyMid: { r: 0.8, g: 0.45, b: 0.25 }, skyTop: { r: 0.16, g: 0.32, b: 0.7 }, fogFarColor: { r: 0.3, g: 0.12, b: 0.1 }, fogFarMix: 0.6, sunGlow: { r: 1.0, g: 0.94, b: 0.78 } };
  const ref = (d, out) => {
    const h = clamp01(d.y), t1 = ss(0, 0.25, h), t2 = ss(0.2, 0.7, h);
    const ff = env.fogFarMix * (1 - ss(0, 0.15, h));
    const s = Math.max(d.x * SUN.x + d.y * SUN.y + d.z * SUN.z, 0), glow = Math.pow(s, 10) * 0.16;
    for (const [k, H, M, T, F, G] of [['x', env.skyHorizon.r, env.skyMid.r, env.skyTop.r, env.fogFarColor.r, env.sunGlow.r], ['y', env.skyHorizon.g, env.skyMid.g, env.skyTop.g, env.fogFarColor.g, env.sunGlow.g], ['z', env.skyHorizon.b, env.skyMid.b, env.skyTop.b, env.fogFarColor.b, env.sunGlow.b]])
      out[k] = mix(mix(mix(H, M, t1), T, t2), F, ff) + G * glow;
  };
  const dirs = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.1, -1).normalize(), new THREE.Vector3(1, 0.02, 0), new THREE.Vector3(-0.22, 0.1, -1).normalize(), new THREE.Vector3(0.3, -0.4, 0.5).normalize()];
  let worst = 0; const a = new THREE.Vector3(), b = { x: 0, y: 0, z: 0 };
  for (const d of dirs) { skyColorAt(d, env, SUN, a); ref(d, b); worst = Math.max(worst, Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z)); }
  check(`skyColorAt matches skyMat reference (max Δ ${worst.toExponential(1)} < 1e-3)`, worst < 1e-3);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
