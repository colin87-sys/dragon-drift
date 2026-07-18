// _vertprobe.mjs (scratch) — quantify the residual "erratic on up/down". Replicates the game's
// VERTICAL ribbon drive (head Y path + vertical whips + vertical swim/drive) and reports per-frame
// body-relative station jump + spike ratio, to tell erratic-DISCONTINUITY (a pop/jitter) from
// busy-but-smooth. Also isolates the vertical whip train.
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

function runVert(axisAt, frames) {
  const def = ascendedDef(DRAGONS.jade, 2); const rib = buildDragonModel(def).parts.bodyWave.ribbon; initRibbonSim(rib, OPTS);
  const S = rib.sim; let velY = 0, posY = 0, z = 0, prevSy = 0, whipCd = 0, steerMag = 0, driveY = 0;
  let prev = null, maxJump = 0; const series = [];
  for (let f = 0; f < frames; f++) {
    velY = damp(velY, axisAt(f) * VERT, MOVEACCEL, dt); posY += velY * dt; z -= SPEED * dt;
    const syN = velY / VERT;
    driveY = damp(driveY, Math.min(1, Math.abs(syN)) * 0.7, 3, dt);
    steerMag = damp(steerMag, Math.min(1, Math.abs(syN)), steerMag < Math.abs(syN) ? 8 : 3, dt);
    whipCd -= dt; const edge = Math.abs(syN - prevSy);
    if (whipCd <= 0 && edge > 0.045) { ribbonWhip(rib, 0, Math.sign(syN - prevSy) * Math.min(1, edge * 7) * S.pulseAmp * 0.7); whipCd = 0.13; }
    prevSy = syN;
    S.driveY = driveY; S.steerMag = steerMag; S.gain = 1.45;
    const hy = 26 + posY;
    updateRibbonSim(rib, 0, hy, z, { x: 0, y: 0, z: -1 }, dt);
    let mj = 0;
    if (prev) for (let i = 0; i < S.N; i++) { const dx = S.sx[i] - prev[i * 2], dy = (S.sy[i] - hy) - prev[i * 2 + 1]; const d = Math.hypot(dx, dy); if (d > mj) mj = d; }
    const cur = new Float32Array(S.N * 2); for (let i = 0; i < S.N; i++) { cur[i * 2] = S.sx[i]; cur[i * 2 + 1] = S.sy[i] - hy; }
    if (prev && mj > maxJump) maxJump = mj;
    prev = cur; series.push(mj);
  }
  return { maxJump, series };
}

const gentle = runVert((f) => Math.sin(f * 0.05) * 0.4, 180);
const mash = runVert((f) => (Math.floor(f / 21) % 2 === 0 ? 1 : -1), 180);
console.log(`GENTLE up/down: max body jump ${gentle.maxJump.toFixed(3)}, spike ratio ${spikeRatio(gentle.series).toFixed(2)}`);
console.log(`MASH   up/down: max body jump ${mash.maxJump.toFixed(3)}, spike ratio ${spikeRatio(mash.series).toFixed(2)}`);
console.log(`mash series (every 3rd): ${mash.series.filter((_, i) => i % 3 === 0).slice(10, 30).map((v) => v.toFixed(2)).join(' ')}`);
