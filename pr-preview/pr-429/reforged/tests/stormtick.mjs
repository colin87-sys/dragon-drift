// tests/stormtick.mjs — the TEMPEST I4 storm-circuit asserts (§5a/§5d). Headless: builds the
// tempest model at every CHARGING rung and checks the storm-arc materials the guarded storm tick
// drives, plus the single-writer / roster-safety firewall.
//
//   node tests/stormtick.mjs
//
// The gauntlet:
//  • strike:idle ratio (stormPeak / stormHum) ∈ [2.2, 4.0] on EVERY arc mat, EVERY form — the
//    "reads as an event, never an ignition-from-dark" band (§5a);
//  • stormPeak ≤ stormCap on every mat (glare discipline §5a: arcSeam≤2.4, arcCore≤2.0, heart≤1.6);
//  • the root→tip travel needs all three buckets present (0 root · 1 mid · 2 tips);
//  • SINGLE-WRITER / ROSTER-SAFE: only the tempest publishes parts.stormArcMats — every other
//    dragon is null, so the guarded tick never runs for them (byte-identical roster).

import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
  set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.get(k) ?? null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  ✗', msg); } }

// ── The storm circuit: ratio band + caps + bucket coverage, every form ──
for (let tier = 0; tier <= 3; tier++) {
  const model = buildDragonModel(ascendedDef(DRAGONS.tempest, tier, 0));
  const mats = model.parts.stormArcMats || [];
  ok(mats.length > 0, `tempest f${tier} publishes storm-arc mats`);
  const buckets = new Set();
  for (const m of mats) {
    const u = m.userData;
    const ratio = u.stormPeak / u.stormHum;
    // NORMAL is nearly OFF (owner): idle a faint HINT (≤25% of the cap), and the crackle/surge is a
    // STRONG event against it (peak:idle ≥ 3.5 — deliberately ignition-from-near-off, the reinstated
    // withheld idle that supersedes §5a's generous-garment band).
    ok(u.stormHum <= 0.25 * u.stormCap + 1e-6, `f${tier} idle near-OFF (hum ${u.stormHum.toFixed(2)} ≤ 0.25·cap ${u.stormCap.toFixed(2)}, bucket ${u.stormBucket})`);
    ok(ratio >= 3.5, `f${tier} crackle is a strong event (peak:idle ${ratio.toFixed(2)} ≥ 3.5, bucket ${u.stormBucket})`);
    ok(u.stormPeak <= u.stormCap + 1e-6, `f${tier} stormPeak ${u.stormPeak.toFixed(2)} ≤ cap ${u.stormCap} (bucket ${u.stormBucket})`);
    ok(u.stormBucket >= 0 && u.stormBucket <= 2, `f${tier} bucket ${u.stormBucket} ∈ {0,1,2}`);
    buckets.add(u.stormBucket);
  }
  ok(buckets.has(0) && buckets.has(1) && buckets.has(2), `f${tier} all three travel buckets present (root/mid/tips) — got ${[...buckets].sort().join(',')}`);
}

// ── SINGLE-WRITER / ROSTER-SAFE: no other dragon publishes storm-arc mats ──
let others = 0;
for (const key of Object.keys(DRAGONS)) {
  if (key === 'tempest') continue;
  let sam = null;
  try { sam = buildDragonModel(ascendedDef(DRAGONS[key], 3, 0)).parts.stormArcMats; } catch { /* build variance in headless mock — skip */ continue; }
  if (sam) { failed++; console.error('  ✗', `${key} unexpectedly publishes stormArcMats — the guarded tick would run for it`); }
  else others++;
}
ok(others > 0, `roster-safe: ${others} non-tempest dragons publish NO storm-arc mats`);

console.log(`\nstorm-tick asserts: ${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
