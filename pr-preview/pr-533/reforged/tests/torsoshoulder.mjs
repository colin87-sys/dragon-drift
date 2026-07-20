// torsoShoulder (Pass 2): Obsidian's torso is a SkinnedMesh whose shoulder-zone verts
// are weighted (capped, side-gated) to the WING shoulder bones, so the BODY surface
// bulges with the wingbeat instead of the wing hinging against a frozen body. Proves:
// the torso binds to a 3-bone skeleton [root, shoulderL, shoulderR] sharing the wing
// bones, the cross-hierarchy WORLD bind preserves the rest pose, weights are valid +
// capped + midline-gated, rotating a shoulder bulges THAT side's body (bounded = a bulge
// not a tear) while the other flank stays put, and other dragons keep a plain Mesh torso.
//   node tests/torsoshoulder.mjs
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

setActiveDetail('high');
// Obsidian (the hero) has since migrated to the UNIFIED HULL; the sweptLoftSkinned
// Pass-2 body-skin path is kept registered as the rollback. Prove it on an obsidian
// CLONE forced back onto the old recipe (the coexist-test discipline, LEAPFROG L173).
// Obsidian left the shipped roster in the roster prune — no host def, proof skips.
if (!DRAGONS.obsidian) {
  console.log('  (obsidian not in the shipped roster — Pass-2 body-skin rollback proof vacuous, skipped)');
  process.exit(0);
}
const base = ascendedDef(DRAGONS.obsidian, 3, 0);
const obs = { ...base, parts: { ...base.parts, torso: 'sweptLoftSkinned', wings: 'skinnedMembraneBridge' } };
assertEq(obs.parts.torso, 'sweptLoftSkinned', 'the clone opts into the skinned-shoulder torso');
const model = buildDragonModel(obs, { detail: 'high' });
const torso = model.group.getObjectByName('torsoShoulderSkin');

// --- 1. SkinnedMesh on [root, shoulderL, shoulderR], sharing the wing shoulder bones -
assert(torso && torso.isSkinnedMesh, 'torso builds as a SkinnedMesh');
assertEq(torso.frustumCulled, false, 'the skinned torso disables frustum culling');
assertEq(torso.skeleton.bones.length, 3, 'torso bound to [root, shoulderL, shoulderR]');
assert(torso.skeleton.bones[1] === model.parts.wingRigL.shoulder, 'index 1 = the LEFT wing shoulder bone');
assert(torso.skeleton.bones[2] === model.parts.wingRigR.shoulder, 'index 2 = the RIGHT wing shoulder bone');
ok('torso is a SkinnedMesh sharing the wing shoulder bones (3-bone skeleton)');

// --- 2. weights: sum to 1, indices 0..2, capped, midline-gated ----------------------
const pos = torso.geometry.attributes.position;
const sw = torso.geometry.attributes.skinWeight, si = torso.geometry.attributes.skinIndex;
let badW = 0, badI = 0, maxShoulderW = 0, midlineMax = 0;
for (let i = 0; i < pos.count; i++) {
  if (Math.abs(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i) - 1) > 1e-3) badW++;
  if (si.getX(i) > 2 || si.getY(i) > 2) badI++;
  maxShoulderW = Math.max(maxShoulderW, sw.getY(i));                 // the shoulder slot
  if (Math.abs(pos.getX(i)) < 0.04) midlineMax = Math.max(midlineMax, sw.getY(i));
}
assertEq(badW, 0, 'every torso vertex weight sums to 1');
assertEq(badI, 0, 'every torso skinIndex is one of the 3 bones');
assert(maxShoulderW <= 0.36, `shoulder influence is capped (max ${maxShoulderW.toFixed(2)} ≤ 0.36 — a bulge, not a tear)`);
assert(midlineMax < 0.02, `the belly/midline isn't dragged (midline shoulder weight ${midlineMax.toFixed(3)} ≈ 0)`);
ok('torso weights well-formed: sum=1, indices 0..2, capped, midline-gated');

// --- 3. rest-parity: the cross-hierarchy world bind preserves the rest pose ----------
model.group.updateMatrixWorld(true);
torso.skeleton.update();
let restMax = 0;
for (let i = 0; i < pos.count; i++) {
  const v = new THREE.Vector3().fromBufferAttribute(pos, i);
  restMax = Math.max(restMax, torso.applyBoneTransform(i, v.clone()).distanceTo(v));
}
assert(restMax < 1e-4, `at rest the skinned torso is byte-stable (max Δ ${restMax.toExponential(1)} ≈ 0) — the bind is correct`);
ok('the world-rest cross-hierarchy bind preserves the torso rest pose');

// --- 4. a shoulder beat BULGES its own flank; the other stays put (side isolation) ---
const rest = [];
for (let i = 0; i < pos.count; i++) rest.push(torso.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)));
model.parts.wingRigL.shoulder.rotation.z += 0.6;                    // beat the LEFT shoulder
model.group.updateMatrixWorld(true); torso.skeleton.update();
let leftMax = 0, rightMax = 0;
for (let i = 0; i < pos.count; i++) {
  const d = torso.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)).distanceTo(rest[i]);
  if (pos.getX(i) < -0.1) leftMax = Math.max(leftMax, d);
  if (pos.getX(i) > 0.1) rightMax = Math.max(rightMax, d);
}
model.parts.wingRigL.shoulder.rotation.z -= 0.6;                    // restore rest
assert(leftMax > 5e-3, `the LEFT shoulder beat bulges the left body (Δ ${leftMax.toFixed(3)})`);
assert(leftMax < 0.4, `the bulge is bounded — not a tear (Δ ${leftMax.toFixed(3)} < 0.4)`);
assert(rightMax < leftMax * 0.25, `the right flank stays put (Δ ${rightMax.toFixed(3)} ≪ left ${leftMax.toFixed(3)}) — side isolation`);
ok(`a shoulder beat bulges its own flank (left Δ ${leftMax.toFixed(3)}), the other stays put (right Δ ${rightMax.toFixed(3)})`);

// --- 5. coexist: a non-opted dragon keeps a plain static torso ----------------------
const az = buildDragonModel(ascendedDef(DRAGONS.azure, 1, 0), {});
let azSkinnedTorso = false; az.group.traverse((o) => { if (o.name === 'torsoShoulderSkin') azSkinnedTorso = true; });
assert(!azSkinnedTorso, 'azure keeps a plain (non-skinned) torso — opt-in only');
ok('other dragons keep a plain static torso (coexist)');

setActiveDetail('high');
console.log(`\n${n} torsoShoulder checks passed.`);
