// tests/jadeladder.mjs — CP5 MONOTONIC-LADDER guard for the Jade Serpent premium features.
//
// The premium look (ribbed fan-crown · body mass · withheld river-gleam · koi-mask head) is conferred
// PROGRESSIVELY by ascension: each tier must carry AT LEAST as much of every premium dial as the tier
// below it (a whelp never out-blooms the apex), and the triangle count must be non-decreasing. This
// locks the "same dragon growing, coronation-rewarded at apex" contract so a future form edit can't
// silently invert the ladder (e.g. a brighter gleam on the pup than the apex).
//
//   node tests/jadeladder.mjs
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
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } };

const maxT = maxTierFor('jade');
const models = [];
for (let t = 0; t <= maxT; t++) models.push(ascendedDef(DRAGONS.jade, t));

// per-tier resolved premium dials (0 / false → the floor for a monotonic compare)
const dial = (m, k) => Number(m.model[k] ?? 0);
const flag = (m, k) => (m.model[k] ? 1 : 0);

// count welded body triangles (the premium geometry lives in the torso mesh)
function triCount(def) {
  const model = buildDragonModel(def);
  let n = 0;
  model.group.traverse((o) => { if (o.isMesh && o.geometry?.index) n += o.geometry.index.count / 3; });
  return Math.round(n);
}

const MONO = [
  ['fanRays', dial],          // ribbed fan-crown pleats: 0 → 5 → 7
  ['girthFull', dial],        // body mass floor: 1.25 → 1.5 → 1.7
  ['gleamBase', dial],        // withheld river-gleam floor: 0 → 0.45 → 0.85
  ['koiMask', dial],          // head chisel amount: 0 → 0.6 → 1.0
  ['strakeLadder', flag],     // dorsal→belly value ladder: off → on → on
];

for (let t = 1; t <= maxT; t++) {
  for (const [key, get] of MONO) {
    const lo = get(models[t - 1], key), hi = get(models[t], key);
    ok(hi >= lo - 1e-9, `jade ${key}: tier ${t} (${hi}) >= tier ${t - 1} (${lo}) — the ladder must not invert`);
  }
}

// the APEX must actually carry the full premium set (guards against a form edit dropping a hero dial)
const apex = models[maxT];
ok(dial(apex, 'fanRays') >= 7, `jade apex fanRays >= 7 (got ${dial(apex, 'fanRays')})`);
ok(flag(apex, 'riverGleam') === 1, 'jade apex riverGleam on');
ok(flag(apex, 'tailRegalia') === 1, 'jade apex tailRegalia on (the coronation tail)');
ok(flag(apex, 'scuteBand') === 1, 'jade apex scuteBand on');
ok(dial(apex, 'koiMask') >= 1, `jade apex koiMask >= 1 (got ${dial(apex, 'koiMask')})`);

// tri count monotonic non-decreasing + every tier under the 6000/form ceiling
let prevTri = -1;
for (let t = 0; t <= maxT; t++) {
  const tri = triCount(models[t]);
  ok(tri >= prevTri, `jade tri: tier ${t} (${tri}) >= tier ${t - 1} (${prevTri < 0 ? 'n/a' : prevTri})`);
  ok(tri <= 6000, `jade tier ${t} under the 6000-tri ceiling (${tri})`);
  prevTri = tri;
}

console.log(`\nJade premium ladder (CP5): ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
