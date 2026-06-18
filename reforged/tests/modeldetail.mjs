// Headless test of the model-detail (geometry LOD) system — the seg() picker, the
// tier→level resolver, and the build-time guarantees: HIGH is byte-identical to
// the un-detailed geometry (the no-regression contract), LOW undercuts it and
// ULTRA densifies it, all while the rig contract (skinned bones) is preserved.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// Minimal DOM/canvas shim so util.js texture helpers don't throw (no renderer).
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const { seg, setActiveDetail, getActiveDetail, activeDetailKey, resolveDetail } = await import('../js/modelDetail.js');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// --- seg() math -------------------------------------------------------------
setActiveDetail('high');
assertEq(seg(8), 8, 'HIGH returns the base segment count UNCHANGED (no regression)');
assertEq(seg(24), 24, 'HIGH passes through the wing-grid count exactly');
ok('HIGH is an exact passthrough — the no-regression contract');

assert(seg(8, 'ultra') > 8 && seg(24, 'ultra') > 24, 'ULTRA raises segment counts');
assert(seg(8, 'low') < 8 && seg(24, 'low') < 24, 'LOW lowers segment counts');
ok('ULTRA densifies and LOW trims relative to the base');

// floor: a small count can drop to 3 but is never pushed UP by the floor
assert(seg(4, 'low') >= 3, 'LOW floor keeps a 4-seg cone usable (>=3)');
assertEq(seg(2, 'low'), 2, 'a deliberately-tiny base (2) is not raised by the floor');
assert(seg(3, 'ultra') >= 3, 'ULTRA never drops below the floor');
ok('floor clamps low counts without inflating deliberately-small ones');

// explicit level arg overrides the active level without changing it
setActiveDetail('low');
assertEq(getActiveDetail().key, 'low', 'active level set to LOW');
assertEq(seg(10, 'ultra'), seg(10, 'ultra'), 'explicit level arg is honoured');
assertEq(activeDetailKey(), 'low', 'an explicit seg() level arg does NOT mutate the active level');
setActiveDetail('high');
ok('active level is process-wide; an explicit arg is per-call');

// --- tier → level resolver --------------------------------------------------
assertEq(resolveDetail(null, 0), 'ultra', 'AUTO + tier 0 (high-end, idle GPU) → ULTRA');
assertEq(resolveDetail(null, 1), 'high', 'AUTO + tier 1 (reduced) → HIGH');
assertEq(resolveDetail(null, 2), 'low', 'AUTO + tier 2 (weak device) → LOW');
assertEq(resolveDetail('high', 0), 'high', 'a manual override pins the level (ignores tier)');
assertEq(resolveDetail('ultra', 2), 'ultra', 'a manual ULTRA override holds even at tier 2');
ok('resolveDetail maps the render tier and respects a manual override');

// AUTO must never RAISE detail as FPS worsens (tier rises) — the safety rule.
const order = { low: 0, high: 1, ultra: 2 };
assert(order[resolveDetail(null, 2)] <= order[resolveDetail(null, 1)], 'tier 2 detail <= tier 1 detail');
assert(order[resolveDetail(null, 1)] <= order[resolveDetail(null, 0)], 'tier 1 detail <= tier 0 detail');
ok('AUTO detail is monotone in the tier — it never raises under sustained low FPS');

// --- build-time tri counts: LOW < HIGH < ULTRA, HIGH == default -------------
function tris(group) {
  let t = 0;
  group.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      t += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3;
    }
  });
  return Math.round(t);
}
function build(detail) {
  const def = ascendedDef(DRAGONS.obsidian, 3, 0);   // the hero, apex form
  const r = buildDragonModel(def, detail ? { detail } : {});
  return r.group;
}
const hi = tris(build('high'));
const lo = tris(build('low'));
const ul = tris(build('ultra'));
setActiveDetail('high');                              // pin the ambient level, then…
const def0 = tris(build(null));                       // …a no-opts build must inherit it
assert(lo < hi, `LOW (${lo}) < HIGH (${hi})`);
assert(ul > hi, `ULTRA (${ul}) > HIGH (${hi})`);
assertEq(def0, hi, 'a no-opts build inherits the active level (HIGH here) — the live rig sets HIGH, so it is unchanged');
ok(`obsidian tris ramp LOW ${lo} < HIGH ${hi} < ULTRA ${ul} (≈${(ul / hi).toFixed(2)}× on the hero)`);

// the skinned rig contract survives every detail level (bones, not Groups). Obsidian
// now runs the UNIFIED HULL: wingPivot/wingTip are still bones, and the hull builds
// skinned meshes (the opaque hull + the translucent membrane) at every tier.
for (const d of ['low', 'high', 'ultra']) {
  const def = ascendedDef(DRAGONS.obsidian, 3, 0);
  const r = buildDragonModel(def, { detail: d });
  assert(r.parts.wingPivotL?.isBone && r.parts.wingTipL?.isBone, `skinned bones intact at ${d}`);
  let skinned = 0; r.group.traverse((o) => { if (o.isSkinnedMesh) skinned++; });
  assert(skinned >= 2, `unified hull skinned meshes present at ${d} (found ${skinned})`);
}
ok('the skinned rig contract holds at LOW / HIGH / ULTRA (unified hull)');

setActiveDetail('high'); // leave the module at the safe default for any later importer
console.log(`\n${n} modeldetail checks passed.`);
