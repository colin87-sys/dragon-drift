// _jumpprobe.mjs — quantify the "stop-motion jump on aggressive snap" bug. Measures per-frame max
// station displacement of the ribbon during (a) a SMOOTH weave and (b) a HARD SNAP, isolating whether
// a discontinuity (a single-frame pop) appears on the snap. Also isolates a bare whip spawn.
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

const dt = 1 / 60, LAT = 24, VERT = 18, MOVEACCEL = 6, SPEED = 45;
const OPTS = { swimAmp: 1.2, swimAmpY: 0.95, swimFreq: 0.9, swimSpeed: 2.7, swimPhaseY: 1.5, swimGrow: 0.4, headFade: 3, curlAmp: 3.6 };
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));

function newRib() { const def = ascendedDef(DRAGONS.jade, 2); const rib = buildDragonModel(def).parts.bodyWave.ribbon; initRibbonSim(rib, OPTS); return rib; }

// Full game-drive replica. `axisAt(f)` returns the input axis [-1,1] each frame.
function run(axisAt, frames) {
  const rib = newRib(), S = rib.sim;
  let velX = 0, posX = 0, z = 0, prevSx = 0, whipCd = 0, curl = 0, steerMag = 0, driveX = 0;
  let prev = null, maxJump = 0, jumpFrame = -1; const series = [];
  for (let f = 0; f < frames; f++) {
    const axis = axisAt(f);
    velX = damp(velX, axis * LAT, MOVEACCEL, dt); posX += velX * dt; z -= SPEED * dt;
    const sxN = velX / LAT;
    driveX = damp(driveX, Math.min(1, Math.abs(sxN)) * 0.9, 3, dt);
    const steerT = Math.min(1, Math.abs(sxN));
    steerMag = damp(steerMag, steerT, steerMag < steerT ? 8 : 3, dt);
    curl = damp(curl, sxN, 1.1, dt);
    whipCd -= dt; const edge = Math.abs(sxN - prevSx);
    if (whipCd <= 0 && edge > 0.045) { ribbonWhip(rib, Math.sign(sxN - prevSx) * Math.min(1, edge * 7) * S.pulseAmp, 0); whipCd = 0.13; }
    prevSx = sxN;
    S.driveX = driveX; S.steerMag = steerMag; S.curl = curl; S.gain = 1 + 0.45;
    updateRibbonSim(rib, posX, 26, z, { x: 0, y: 0, z: -1 }, dt);
    // per-frame max station displacement PERPENDICULAR to travel (x,y) minus the head's own move,
    // so pure forward progress doesn't count — we want body-relative jumps.
    let mj = 0;
    if (prev) for (let i = 0; i < S.N; i++) {
      const dx = (S.sx[i] - posX) - prev[i * 2], dy = (S.sy[i] - 26) - prev[i * 2 + 1];
      const d = Math.hypot(dx, dy); if (d > mj) mj = d;
    }
    const cur = new Float32Array(S.N * 2); for (let i = 0; i < S.N; i++) { cur[i * 2] = S.sx[i] - posX; cur[i * 2 + 1] = S.sy[i] - 26; }
    if (prev && mj > maxJump) { maxJump = mj; jumpFrame = f; }
    prev = cur; series.push(mj);
  }
  return { maxJump, jumpFrame, series };
}

// SMOOTH: gentle sine weave (soft movement — "follows well").
const smooth = run((f) => Math.sin(f * 0.06) * 0.5, 180);
// HARD SNAP: instant full-left then full-right steps (aggressive snap — "jumps/skips").
const snap = run((f) => (f < 40 ? 0 : f < 80 ? 1 : f < 120 ? -1 : 1), 180);

console.log(`SMOOTH weave : max per-frame body jump ${smooth.maxJump.toFixed(3)}  (frame ${smooth.jumpFrame})`);
console.log(`HARD SNAP    : max per-frame body jump ${snap.maxJump.toFixed(3)}  (frame ${snap.jumpFrame})`);
console.log(`ratio snap/smooth = ${(snap.maxJump / smooth.maxJump).toFixed(2)}×`);
// show the snap series around the spike
const jf = snap.jumpFrame;
console.log('snap jumps near spike:', snap.series.slice(Math.max(0, jf - 3), jf + 3).map((v) => v.toFixed(2)).join(' '));

// ISOLATE a bare whip: straight flight, one whip at frame 40, measure the pop.
{
  const rib = newRib(), S = rib.sim; let z = 0, prev = null, popAt = -1, pop = 0;
  for (let f = 0; f < 90; f++) {
    z -= SPEED * dt;
    if (f === 40) ribbonWhip(rib, S.pulseAmp, 0);
    S.gain = 1;
    updateRibbonSim(rib, 0, 26, z, { x: 0, y: 0, z: -1 }, dt);
    let mj = 0; if (prev) for (let i = 0; i < S.N; i++) { const d = Math.hypot((S.sx[i]) - prev[i * 2], (S.sy[i] - 26) - prev[i * 2 + 1]); if (d > mj) mj = d; }
    const cur = new Float32Array(S.N * 2); for (let i = 0; i < S.N; i++) { cur[i * 2] = S.sx[i]; cur[i * 2 + 1] = S.sy[i] - 26; }
    if (prev && f >= 40 && f <= 44 && mj > pop) { pop = mj; popAt = f; }
    prev = cur;
  }
  console.log(`BARE WHIP    : single-frame pop at spawn = ${pop.toFixed(3)} (frame ${popAt}) — this is the born-at-full-amplitude jump`);
}
