// tests/ribbonvertical.mjs — VERTICAL whip regression guard (the "erratic on up/down" fix).
//
// The whip edge-detector fires for the whole exponentially-damped velocity RAMP (~15 frames), so the
// vertical whip was spawning a 2-3 pulse TRAIN per reversal → 4-6 alternating vertical bumps on the
// body = erratic. Fix: arm the vertical whip on a SIGN REVERSAL (one pulse per key flip), at 0.5×
// amplitude, with a 0.30s backstop. This test replicates the game's vertical drive with the NEW
// trigger and asserts: one vertical pulse per input reversal, a bounded whip bump, and smoothness.
//   node tests/ribbonvertical.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { initRibbonSim, updateRibbonSim, ribbonWhip } = await import('../js/ribbonSpine.js');

const dt = 1 / 60, VERT = 18, MOVEACCEL = 6, SPEED = 45;
const OPTS = { swimAmp: 1.2, swimAmpY: 0.95, swimFreq: 0.9, swimSpeed: 2.7, swimPhaseY: 1.5, swimGrow: 0.4, headFade: 3, curlAmp: 3.6 };
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
const spikeRatio = (s) => { let r = 0; for (let f = 1; f < s.length - 1; f++) { const n = Math.max(s[f - 1], s[f + 1], 0.03); if (s[f] / n > r) r = s[f] / n; } return r; };

// Replicates the NEW vertical drive from dragon.js: driveY 0.45, vertical whip armed on SIGN
// REVERSAL only (0.5× amp, 0.30s backstop). `swim=false` isolates the whip bump. Returns the
// smoothness series + spawned-vertical-pulse count + peak vertical whip offset (swim off).
function runVert(axisAt, frames, swim, spawnWhip = true) {
  const def = ascendedDef(DRAGONS.jade, 2); const rib = buildDragonModel(def).parts.bodyWave.ribbon;
  initRibbonSim(rib, swim ? OPTS : { ...OPTS, swimAmp: 0, swimAmpY: 0 });
  const S = rib.sim; let velY = 0, posY = 0, z = 0, prevSy = 0, whipCdY = 0, lastSignY = 0, steerMag = 0, driveY = 0;
  let prev = null, maxJump = 0, whips = 0; const series = [], syRel = [];
  for (let f = 0; f < frames; f++) {
    velY = damp(velY, axisAt(f) * VERT, MOVEACCEL, dt); posY += velY * dt; z -= SPEED * dt;
    const syN = velY / VERT;
    driveY = damp(driveY, Math.min(1, Math.abs(syN)) * 0.45, 3, dt);
    steerMag = damp(steerMag, Math.min(1, Math.abs(syN)), steerMag < Math.abs(syN) ? 8 : 3, dt);
    whipCdY -= dt; const dSy = syN - prevSy, sgnY = Math.sign(dSy);
    if (spawnWhip && whipCdY <= 0 && Math.abs(dSy) > 0.05 && sgnY !== 0 && sgnY !== lastSignY) {
      ribbonWhip(rib, 0, sgnY * Math.min(1, Math.abs(dSy) * 7) * S.pulseAmp * 0.5); lastSignY = sgnY; whipCdY = 0.30; whips++;
    }
    prevSy = syN;
    S.driveY = driveY; S.steerMag = steerMag; S.gain = 1.45;
    const hy = 26 + posY;
    updateRibbonSim(rib, 0, hy, z, { x: 0, y: 0, z: -1 }, dt);
    const rowY = new Float32Array(S.N); for (let i = 0; i < S.N; i++) rowY[i] = S.sy[i] - hy; syRel.push(rowY);
    let mj = 0;
    if (prev) for (let i = 0; i < S.N; i++) { const dx = S.sx[i] - prev[i * 2], dy = (S.sy[i] - hy) - prev[i * 2 + 1]; const d = Math.hypot(dx, dy); if (d > mj) mj = d; }
    const cur = new Float32Array(S.N * 2); for (let i = 0; i < S.N; i++) { cur[i * 2] = S.sx[i]; cur[i * 2 + 1] = S.sy[i] - hy; }
    if (prev && mj > maxJump) maxJump = mj;
    prev = cur; series.push(mj);
  }
  return { maxJump, series, whips, syRel };
}

// number of input sign reversals in the mash script (flip every 21 frames over 180)
const flip = (f) => (Math.floor(f / 21) % 2 === 0 ? 1 : -1);
let reversals = 0; { let ps = 0; for (let f = 0; f < 180; f++) { const s = Math.sign(flip(f)); if (s && s !== ps) { if (ps !== 0) reversals++; ps = s; } } }

const gentle = runVert((f) => Math.sin(f * 0.05) * 0.4, 180, true);
const mash = runVert(flip, 180, true);
// isolate the whip: same drive, swim off, with vs WITHOUT spawning whips → the diff IS the whip bump
// (strips out the body legitimately trailing the Y-zigzag path, which is NOT the whip).
const wOn = runVert(flip, 180, false, true), wOff = runVert(flip, 180, false, false);
let whipBump = 0; for (let f = 0; f < wOn.syRel.length; f++) for (let i = 0; i < wOn.syRel[f].length; i++) whipBump = Math.max(whipBump, Math.abs(wOn.syRel[f][i] - wOff.syRel[f][i]));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

ok(wOn.whips <= reversals + 1, `one vertical whip per key flip (${wOn.whips} pulses for ${reversals} reversals — no train)`);
ok(whipBump <= 1.2, `vertical whip bump bounded (isolated peak ${whipBump.toFixed(2)}u ≤ 1.2)`);
ok(spikeRatio(gentle.series) <= 1.1, `gentle up/down smooth (spike ${spikeRatio(gentle.series).toFixed(2)} ≤ 1.1)`);
ok(spikeRatio(mash.series) <= 1.1, `mash up/down smooth, no pop (spike ${spikeRatio(mash.series).toFixed(2)} ≤ 1.1)`);
ok(gentle.maxJump < 0.15, `gentle up/down stays calm (max jump ${gentle.maxJump.toFixed(3)} < 0.15)`);

console.log(`\nRibbon vertical (whip de-stack): ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
