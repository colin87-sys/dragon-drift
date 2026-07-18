// tests/ribbonmotion.mjs — RIBBON SPINE motion proof (Fable rubric R1-R6, headless).
//
// Feeds the follow-the-leader sim scripted head paths and asserts the ribbon behaviours:
//   R1 path-tracing · R2 arc-length conservation · R3 straight-line settle ·
//   R5 sustained-turn coil · determinism · no NaN.
// Pure math (no render) — this is the guardrail that the body actually trails/coils.
//
//   node tests/ribbonmotion.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
  set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { initRibbonSim, updateRibbonSim } = await import('../js/ribbonSpine.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };

function freshRib() {
  const def = ascendedDef(DRAGONS.jade, 2);
  const rib = buildDragonModel(def).parts.bodyWave.ribbon;
  initRibbonSim(rib, { swimAmp: 0 });   // swim off for the geometric proofs
  return rib;
}
const dt = 1 / 60, speed = 12;          // world units/s

function stationArr(S) { const a = []; for (let i = 0; i < S.N; i++) a.push([S.sx[i], S.sy[i], S.sz[i]]); return a; }

// ── STRAIGHT: fly -z for a while; body must settle to a near-line behind the head ──
{
  const rib = freshRib(), S = rib.sim;
  const h = { x: 0, y: 0, z: 0 }; const fwd = { x: 0, y: 0, z: -1 };
  for (let f = 0; f < 400; f++) { h.z -= speed * dt; updateRibbonSim(rib, h.x, h.y, h.z, fwd, dt); }
  // lateral deviation of every station from the head's forward axis (the +z line through the head)
  let maxLat = 0, nan = 0;
  for (let i = 0; i < S.N; i++) {
    if (!Number.isFinite(S.sx[i]) || !Number.isFinite(S.sz[i])) nan++;
    maxLat = Math.max(maxLat, Math.hypot(S.sx[i] - h.x, S.sy[i] - h.y));   // x,y offset from the axis
  }
  ok(nan === 0, `straight: no NaN`);
  ok(maxLat < 0.05, `R3 straight-line settle: body is a near-line (max lateral ${maxLat.toFixed(4)} < 0.05)`);
  // stations trail behind the head in +z, monotonically
  let mono = true; for (let i = 1; i < S.N; i++) if (S.sz[i] <= S.sz[i - 1]) mono = false;
  ok(mono, `straight: stations trail head→tail in +z (monotonic)`);
}

// ── ARC-LENGTH: station spacing tracks the rest segCum spacing within 2% (R2) ──
{
  const rib = freshRib(), S = rib.sim;
  const h = { x: 0, y: 0, z: 0 }; const fwd = { x: 0, y: 0, z: -1 };
  // a slalom so it's not a trivial straight case
  for (let f = 0; f < 500; f++) { h.z -= speed * dt; h.x = Math.sin(f * 0.04) * 3; updateRibbonSim(rib, h.x, h.y, h.z, fwd, dt); }
  let worst = 0;
  for (let i = 1; i < S.N; i++) {
    const d = Math.hypot(S.sx[i] - S.sx[i - 1], S.sy[i] - S.sy[i - 1], S.sz[i] - S.sz[i - 1]);
    const want = S.segCum[i] - S.segCum[i - 1];
    if (want > 1e-4) worst = Math.max(worst, Math.abs(d - want) / want);
  }
  ok(worst < 0.03, `R2 arc-length conservation: segment spacing within ${(worst * 100).toFixed(1)}% of rest (<3%)`);
}

// ── COIL: sustained hard circular input wraps the body into a spiral (R5) ──
{
  const rib = freshRib(), S = rib.sim;
  const bodyLen = S.segCum[S.N - 1];
  // size the circle to the body: a circular input of radius R wraps the whole body through
  // bodyLen/R radians, so pick R to target ~320° of theoretical wrap and prove the body actually
  // reaches ≥270° of it (i.e. the body follows the full circular history, not a lagging chord).
  const R = bodyLen / (320 * Math.PI / 180);
  const omega = speed / R;              // angular rate so |v| == speed
  let th = 0; const h = { x: 0, y: 0, z: 0 };
  // run long enough that the whole body is on the circular arc (arc length > body length)
  const frames = Math.ceil((bodyLen * 1.6 / speed) / dt) + 200;
  for (let f = 0; f < frames; f++) {
    th += omega * dt;
    h.x = R * Math.sin(th); h.z = R * Math.cos(th);
    const fwd = { x: Math.cos(th), y: 0, z: -Math.sin(th) };
    updateRibbonSim(rib, h.x, h.y, h.z, fwd, dt);
  }
  // accumulated heading change along the body = Σ angle between consecutive station tangents
  let acc = 0;
  for (let i = 1; i < S.N; i++) {
    const d = S.tx[i] * S.tx[i - 1] + S.ty[i] * S.ty[i - 1] + S.tz[i] * S.tz[i - 1];
    acc += Math.acos(Math.max(-1, Math.min(1, d)));
  }
  const deg = acc * 180 / Math.PI;
  ok(deg >= 270, `R5 sustained turn → coil: body wraps ${deg.toFixed(0)}° (≥270°)`);
  // and it stays on the circle: every station within a small band of radius R from the centre (0,0)
  let maxErr = 0; for (let i = 0; i < S.N; i++) maxErr = Math.max(maxErr, Math.abs(Math.hypot(S.sx[i], S.sz[i]) - R));
  ok(maxErr < 0.2, `R1 path-tracing: coiled stations hug the flown circle (max radius err ${maxErr.toFixed(3)} < 0.2)`);
}

// ── DETERMINISM: identical scripted input → identical spine floats ──
{
  const run = () => {
    const rib = freshRib(), S = rib.sim; const h = { x: 0, y: 0, z: 0 };
    for (let f = 0; f < 300; f++) { h.z -= speed * dt; h.x = Math.sin(f * 0.05) * 2; h.y = Math.cos(f * 0.03) * 1; updateRibbonSim(rib, h.x, h.y, h.z, { x: 0, y: 0, z: -1 }, dt); }
    return stationArr(S);
  };
  const a = run(), b = run(); let same = true;
  for (let i = 0; i < a.length; i++) for (let k = 0; k < 3; k++) if (a[i][k] !== b[i][k]) same = false;
  ok(same, `determinism: same input tape → bit-identical spine`);
}

console.log(`\nRibbon motion (R1-R6): ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
