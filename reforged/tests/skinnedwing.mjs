// Headless test of the skinnedMembrane wing — the continuous-fold "organism" fix.
// Asserts the wing builds as a SkinnedMesh on a 2-bone skeleton, that the rig
// handles (wingPivot/wingTip) ARE those bones (so the existing flap/fold drives
// the skin with no rig change), that skin weights are well-formed, and that the
// legacy 'membrane' path still builds with plain Group handles (coexistence).
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

const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// --- obsidian: skinnedMembrane ----------------------------------------------
const ob = buildDragonModel(ascendedDef(DRAGONS.obsidian, 3, 0), {});
let skinnedMeshes = 0, boneCounts = new Set();
ob.group.traverse((o) => { if (o.isSkinnedMesh) { skinnedMeshes++; boneCounts.add(o.skeleton.bones.length); } });
// Each wing = 1 membrane + surface ribs (leading edge + finger veins), all
// skinned to the same skeleton → > 2 skinned meshes total. Guards the rib fix.
assert(skinnedMeshes >= 6, `obsidian has skinned membrane + rib meshes (found ${skinnedMeshes})`);
assertEq([...boneCounts].join(','), '2', 'every skinned piece shares the 2-bone skeleton (shoulder + wrist)');
ok('skinnedMembrane builds continuous membrane + surface ribs on one shared skeleton');

assert(ob.parts.wingPivotL?.isBone && ob.parts.wingPivotR?.isBone, 'wingPivot handles are Bones');
assert(ob.parts.wingTipL?.isBone && ob.parts.wingTipR?.isBone, 'wingTip handles are Bones');
assert(!!ob.parts.tipMarkerL && !!ob.parts.tipMarkerR, 'tip markers present (trails read them)');
ok('rig handles are bones — existing flap/fold rotations drive the skin, no rig change');

// skin weights: each vertex sums to 1, indices in range, positions finite
let badW = 0, badI = 0, badP = 0, checked = 0;
ob.group.traverse((o) => {
  if (!o.isSkinnedMesh) return;
  checked++;
  const sw = o.geometry.attributes.skinWeight, si = o.geometry.attributes.skinIndex, p = o.geometry.attributes.position;
  for (let i = 0; i < sw.count; i++) {
    if (Math.abs(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i) - 1) > 1e-3) badW++;
    if (si.getX(i) > 1 || si.getY(i) > 1) badI++;
    if (!Number.isFinite(p.getX(i)) || !Number.isFinite(p.getY(i)) || !Number.isFinite(p.getZ(i))) badP++;
  }
});
assert(checked >= 2, 'inspected the skinned wing meshes');
assertEq(badW, 0, 'every vertex skinWeight sums to 1');
assertEq(badI, 0, 'every skinIndex references one of the 2 bones');
assertEq(badP, 0, 'no non-finite vertex positions');
ok('skin weights well-formed (sum=1, indices in range, finite positions)');

// the fold bone actually transforms when the rig rotates it
const wt = ob.parts.wingTipL;
const before = wt.matrixWorld.elements.slice();
wt.rotation.z = 0.8; wt.updateMatrixWorld(true);
assert(before.some((v, i) => Math.abs(v - wt.matrixWorld.elements[i]) > 1e-4), 'wrist bone transforms on rotation (skin will follow on GPU)');
ok('the rig’s wrist-fold rotation drives the wrist bone');

// --- coexistence: a legacy membrane dragon keeps plain Group handles ---------
const az = buildDragonModel(ascendedDef(DRAGONS.azure, 1, 0), {});
let azSkinned = 0; az.group.traverse((o) => { if (o.isSkinnedMesh) azSkinned++; });
assertEq(azSkinned, 0, 'legacy membrane dragon (azure) has no skinned meshes');
assert(!az.parts.wingPivotL?.isBone, 'legacy wingPivot is a plain Group, not a Bone');
ok('legacy membrane wings are untouched (coexist → prove → migrate)');

console.log(`\n${n} skinnedwing checks passed.`);
