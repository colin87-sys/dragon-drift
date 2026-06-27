// Measure the Flame Monarch apex model against a crown-height-normalised proportion
// spec. Builds through the same shared builder as the game, computes world-space
// bounding boxes of the named parts, and prints each dimension in CROWN-HEIGHT units.
//   node tools/proportions.mjs [dragonKey] [tier]
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

const key = process.argv[2] || 'flameMonarch';
const tier = Number(process.argv[3] ?? 3);
const def = ascendedDef(DRAGONS[key], tier, 0);
const { group, parts } = buildDragonModel(def);
group.updateWorldMatrix(true, true);

const box = (obj) => { const b = new THREE.Box3(); if (Array.isArray(obj)) { for (const o of obj) b.expandByObject(o); } else b.setFromObject(obj); return b; };
const size = (b) => b.getSize(new THREE.Vector3());

const head = parts.head ? box(parts.head) : null;
const wingR = parts.wingPivotR ? box(parts.wingPivotR) : null;
const wingL = parts.wingPivotL ? box(parts.wingPivotL) : null;
const tail = parts.tailSegs && parts.tailSegs.length ? box(parts.tailSegs) : null;
const whole = box(group);

// crown height = head bbox height (the unit). Fallbacks if head missing.
const crownH = head ? size(head).y : 1;
// wingspan = full tip-to-tip x of both wings.
const spanX = (wingR && wingL) ? (Math.max(wingR.max.x, wingL.max.x) - Math.min(wingR.min.x, wingL.min.x)) : (wingR ? wingR.max.x * 2 : 0);
// nose-to-tail = z extent of the whole model (wings are mostly ±x, body runs in z).
const noseTail = tail && head ? (Math.max(tail.max.z, whole.max.z) - Math.min(head.min.z, whole.min.z)) : size(whole).z;
const tailLen = tail ? size(tail).z : 0;
const wingChord = wingR ? size(wingR).z : 0;

const U = (v) => (v / crownH).toFixed(2);
const targets = {
  'Crown height': [1.0, 1.0, crownH],
  'Body length (nose→tail)': [5.8, 6.5, noseTail],
  'Tail length': [2.8, 3.3, tailLen],
  'Wingspan': [5.4, 5.8, spanX],
  'Wing chord depth': [0.9, 1.2, wingChord],
};
console.log(`\n${def.name}  (tier ${tier})  — proportions in CROWN-HEIGHT units (crown = ${crownH.toFixed(3)} world)\n`);
console.log('Dimension'.padEnd(26) + 'measured'.padStart(9) + 'target'.padStart(14) + '   verdict');
console.log('-'.repeat(64));
for (const [name, [lo, hi, raw]] of Object.entries(targets)) {
  const u = raw / crownH;
  const within = name === 'Crown height' ? true : (u >= lo && u <= hi);
  const verdict = within ? 'OK' : (u > hi ? `TOO BIG (×${(u / hi).toFixed(2)})` : `too small (×${(u / lo).toFixed(2)})`);
  console.log(name.padEnd(26) + U(raw).padStart(9) + `${lo}–${hi}`.padStart(14) + '   ' + verdict);
}
console.log('-'.repeat(64));
console.log(`raw world: head h=${crownH.toFixed(2)} | wingspan=${spanX.toFixed(2)} | noseTail=${noseTail.toFixed(2)} | tail=${tailLen.toFixed(2)}`);
console.log(`model.scale=${def.model.scale} wingScale=${def.model.wingScale}`);
// CROWN-INDEPENDENT check: parts.head can under-measure the crown, so also report the
// wingspan-to-body ratio (robust). Spec target ratio = 5.6 / 6.15 ≈ 0.91.
if (noseTail) console.log(`wingspan / body-length = ${(spanX / noseTail).toFixed(2)}  (spec target ≈ 0.91)\n`);
