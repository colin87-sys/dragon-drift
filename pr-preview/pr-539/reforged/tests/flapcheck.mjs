// FLAP-CYCLE CONTINUITY GATE — the "a flap reads continuous only if the elevation crosses
// horizontal at MAX velocity, with dwell ONLY at the two turnarounds" lesson, turned into a CI guard.
//
// Bull + Seraph cost many rounds to "robotic / pauses around horizontal" bugs that STATIC renders
// could never show — the failure lives in the VELOCITY profile of the beat, not a single frame. This
// samples the REAL solver (`wingFlapSolver.js`) across the cycle for every dragon that uses the yoke
// flap path (`model.flap`) and asserts the motion invariants numerically, so a future solver refactor
// that reintroduces a hold / smoothstep boundary mid-stroke FAILS here instead of on a player's screen.
//
//   node tests/flapcheck.mjs
//
// Asserts per dragon: apex reaches +1 and bottom reaches −downDepth; exactly ONE upstroke + ONE
// downstroke (velocity sign-changes === 2); BOTH horizontal crossings happen at high velocity (no flat
// spot at horizontal — the old "pause"); near-zero velocity occurs ONLY around the apex + bottom
// turnarounds (no interior hold); and the curl channel rounds to ~1 at the apex, ~0 at the bottom.

import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

// Minimal DOM/canvas shim — importing dragons.js pulls the part builders (THREE) + save.js (window).
const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { flapEnv, curlEnv } = await import('../js/wingFlapSolver.js');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');

const TAU = Math.PI * 2;
let pass = 0, fails = 0;
const check = (cond, msg) => { if (cond) { pass++; } else { fails++; console.log('  ✗ ' + msg); } };
// shortest distance between two normalized cycle positions (handles wrap at 0/1)
const near = (t, c) => { const d = (((t - c) % 1) + 1) % 1; return Math.min(d, 1 - d); };

// Sample the elevation envelope + its velocity (d/dt over normalized cycle t∈[0,1)) at N points.
function analyze(cfg) {
  const N = 1440, dd = cfg.downDepth ?? 1.0;
  const env = (i) => flapEnv(((i % N) / N) * TAU, cfg);
  const vel = (i) => (env(i + 1) - env(i - 1 + N)) / (2 / N);   // central difference, wrap-safe
  let min = Infinity, max = -Infinity, argMin = 0, argMax = 0;
  const e = [], v = [];
  for (let i = 0; i < N; i++) { const ei = env(i); e.push(ei); if (ei < min) { min = ei; argMin = i; } if (ei > max) { max = ei; argMax = i; } }
  for (let i = 0; i < N; i++) v.push(vel(i));
  const peak = Math.max(...v.map(Math.abs));
  const crossings = [];
  for (let i = 0; i < N; i++) { const a = e[i], b = e[(i + 1) % N]; if ((a <= 0 && b > 0) || (a >= 0 && b < 0)) crossings.push(Math.abs(v[i])); }
  let signChanges = 0;
  for (let i = 0; i < N; i++) { const a = v[i], b = v[(i + 1) % N]; if (a !== 0 && b !== 0 && Math.sign(a) !== Math.sign(b)) signChanges++; }
  const lowVel = [];
  for (let i = 0; i < N; i++) if (Math.abs(v[i]) < 0.06 * peak) lowVel.push(i / N);
  return { min, max, argMin: argMin / N, argMax: argMax / N, peak, crossings, signChanges, lowVel, dd };
}

const keys = Object.keys(DRAGONS).filter((k) => ascendedDef(DRAGONS[k], maxTierFor(k), 0).model.flap);
console.log(`\nFlap-cycle continuity gate — ${keys.length} yoke dragon(s): ${keys.join(', ')}\n`);

for (const k of keys) {
  const def = ascendedDef(DRAGONS[k], maxTierFor(k), 0);
  const cfg = def.model.flap;
  const a = analyze(cfg);
  const name = def.name || k;
  console.log(`${name}  (downDepth ${a.dd}, downFrac ${cfg.downFrac ?? 0.55}) — apex +${a.max.toFixed(2)}, bottom ${a.min.toFixed(2)}, peakVel ${a.peak.toFixed(1)}`);
  check(Math.abs(a.max - 1) < 0.02, `${name}: apex reaches +1 (got ${a.max.toFixed(2)})`);
  check(Math.abs(a.min + a.dd) < 0.05, `${name}: bottom reaches −downDepth (got ${a.min.toFixed(2)} vs −${a.dd})`);
  check(a.signChanges === 2, `${name}: exactly one upstroke + one downstroke (vel sign-changes === 2, got ${a.signChanges})`);
  check(a.crossings.length === 2, `${name}: exactly two horizontal crossings (got ${a.crossings.length})`);
  check(a.crossings.every((cv) => cv > 0.25 * a.peak), `${name}: BOTH horizontal crossings at high velocity — no flat spot/pause at horizontal`);
  check(a.lowVel.every((t) => near(t, a.argMax) < 0.07 || near(t, a.argMin) < 0.07),
    `${name}: near-zero velocity ONLY at the apex + bottom turnarounds — no interior hold (offenders: ${a.lowVel.filter((t) => near(t, a.argMax) >= 0.07 && near(t, a.argMin) >= 0.07).map((t) => t.toFixed(2)).join(',') || 'none'})`);
  // CURL channel (shape): rounded V at apex, straight/pressed at the bottom
  check(curlEnv(a.argMax * TAU, cfg) > 0.9, `${name}: curl ≈ 1 at apex (rounded V)`);
  check(curlEnv(a.argMin * TAU, cfg) < 0.1, `${name}: curl ≈ 0 at bottom (straight/pressed)`);
}

console.log(`\n${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
