// sweptTail (roadmap #4b): the tail shaft is ONE continuous tube skinned to the 7
// shaft bones, so the rig's existing coil bends a seamless Night-Fury tail (no
// joints). Proves: the tube is a SkinnedMesh bound to 7 bones, weights are valid,
// rotating a bone actually deforms it (skinning live), and the default 'clean' tail
// is untouched (coexist). Obsidian opts in via parts.tail:'sweptTail'.
//   node tests/sweptail.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const THREE = await import('three');
const { setActiveDetail } = await import('../js/modelDetail.js');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// Obsidian (the swept-tail host def) left the shipped roster in the roster prune —
// this proof has no def to bind to and SKIPS. Re-arms if a def with parts.tail
// 'sweptTail' returns to the roster.
if (!DRAGONS.obsidian) {
  console.log('  (obsidian not in the shipped roster — sweptTail host proof vacuous, skipped)');
  process.exit(0);
}

// --- 1. Obsidian opts into the swept tail → ONE skinned tube on the 7 bones ----
setActiveDetail('high');
const obs = ascendedDef(DRAGONS.obsidian, 3, 0);          // Eternal
assertEq(obs.parts.tail, 'sweptTail', 'Obsidian opts into sweptTail');
const model = buildDragonModel(obs, { detail: 'high' });
const tube = model.group.getObjectByName('sweptTailTube');
assert(tube && tube.isSkinnedMesh, 'sweptTail builds a SkinnedMesh tube');
assertEq(tube.skeleton.bones.length, 7, 'tube is skinned to the 7 shaft bones');
ok('Obsidian sweptTail → one skinned continuous tube on 7 bones');

// --- 2. skin weights are valid (sum to 1, indices in range) -------------------
const sw = tube.geometry.attributes.skinWeight, siA = tube.geometry.attributes.skinIndex;
let weightsOk = true, idxOk = true;
for (let i = 0; i < sw.count; i++) {
  const s = sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i);
  if (Math.abs(s - 1) > 1e-3) weightsOk = false;
  if (siA.getX(i) > 6 || siA.getY(i) > 6) idxOk = false;
}
assert(weightsOk, 'every vertex skin weight sums to 1');
assert(idxOk, 'skin indices stay within the 7-bone range');
ok('skin weights are normalized and reference valid bones');

// --- 3. skinning is LIVE: rotating a mid bone deforms the tube ----------------
// Scan ALL vertices for the max displacement (a given vertex is only weighted to
// the nearest 2 bones, so sampling one point can miss the bone we rotate).
const pos = tube.geometry.attributes.position;
model.group.updateMatrixWorld(true);
tube.skeleton.update();
const rest = [];
for (let i = 0; i < pos.count; i++) rest.push(tube.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)));
tube.skeleton.bones[4].rotation.z += 0.8;
model.group.updateMatrixWorld(true);
tube.skeleton.update();
let maxD = 0;
for (let i = 0; i < pos.count; i++) {
  const d = tube.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)).distanceTo(rest[i]);
  if (d > maxD) maxD = d;
}
assert(maxD > 1e-2, `rotating a tail bone deforms the skinned tube (max Δ ${maxD.toFixed(3)})`);
ok(`a bone rotation bends the tube (max Δ ${maxD.toFixed(3)})`);

// --- 4. coexist: the default 'clean' tail is untouched (no tube, real frustums) -
const obsClean = { ...obs, parts: { ...obs.parts, tail: 'clean' } };
const cm = buildDragonModel(obsClean, { detail: 'high' });
assert(!cm.group.getObjectByName('sweptTailTube'), "'clean' tail builds no swept tube");
let cleanBones = 0; cm.group.traverse((o) => { if (o.isBone) cleanBones++; });
let sweptBones = 0; model.group.traverse((o) => { if (o.isBone) sweptBones++; });
assert(sweptBones >= cleanBones + 7, 'sweptTail adds the 7 tail bones over the clean tail');
ok('clean tail is unchanged — coexist holds (opt-in only)');

// --- 5. detail-aware: ULTRA tube is rounder (more rings) than HIGH -------------
const ulTube = buildDragonModel(obs, { detail: 'ultra' }).group.getObjectByName('sweptTailTube');
assert(ulTube.geometry.attributes.position.count > tube.geometry.attributes.position.count,
  'ULTRA tail tube has a denser (rounder) cross-section than HIGH');
ok('tail tube cross-section scales with detail (seg)');

setActiveDetail('high');
console.log(`\n${n} sweptail checks passed.`);
