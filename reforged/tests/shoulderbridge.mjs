// shoulderBridge (Pass 1 of "make the wing grow out of the body"): the skinned
// membrane wing roots into a continuous BODY-MATERIAL deltoid tube, skinned across
// [anchor(static), shoulder(bone)], replacing the bolted metallic shoulder sphere.
// Proves: the bridge is a SkinnedMesh on a 2-bone skeleton SHARING the wing's
// shoulder bone, weights are valid, rotating the shoulder deforms the OUTBOARD end
// while the inboard stays planted on the body, it wears the (opaque, DoubleSide) body
// material (no seam), the metallic sphere is gone, and a plain skinnedMembrane build
// grows no bridge (coexist → prove → migrate).
//   node tests/shoulderbridge.mjs
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
// Obsidian (the hero) has since migrated to the UNIFIED HULL; the shoulder-bridge
// path is kept registered as the rollback. Prove it on an obsidian CLONE FORCED back
// onto the old recipe (the coexist-test discipline, LEAPFROG L173 / shoulderbridge note).
const base = ascendedDef(DRAGONS.obsidian, 3, 0);         // Eternal
const obs = { ...base, parts: { ...base.parts, torso: 'sweptLoftSkinned', wings: 'skinnedMembraneBridge' } };
assertEq(obs.parts.wings, 'skinnedMembraneBridge', 'the clone opts into the shoulder bridge');
const model = buildDragonModel(obs, { detail: 'high' });

// --- 1. both bridges build as 2-bone skinned tubes sharing the wing shoulder ----
const brL = model.group.getObjectByName('shoulderBridgeL');
const brR = model.group.getObjectByName('shoulderBridgeR');
assert(brL && brL.isSkinnedMesh && brR && brR.isSkinnedMesh, 'both shoulder bridges build as SkinnedMeshes');
assertEq(brL.skeleton.bones.length, 2, 'bridge is skinned to [anchor, shoulder] (2 bones)');
assert(brR.skeleton.bones[1] === model.parts.wingRigR.shoulder, 'right bridge shares the wing’s shoulder bone');
assert(brL.skeleton.bones[1] === model.parts.wingRigL.shoulder, 'left bridge shares the wing’s shoulder bone');
ok('shoulder bridges build as 2-bone skinned tubes sharing the wing shoulder bone');

// --- 2. skin weights valid (sum to 1, indices 0..1, finite positions) ----------
let badW = 0, badI = 0, badP = 0;
for (const br of [brL, brR]) {
  const sw = br.geometry.attributes.skinWeight, si = br.geometry.attributes.skinIndex, p = br.geometry.attributes.position;
  for (let i = 0; i < sw.count; i++) {
    if (Math.abs(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i) - 1) > 1e-3) badW++;
    if (si.getX(i) > 1 || si.getY(i) > 1) badI++;
    if (!Number.isFinite(p.getX(i)) || !Number.isFinite(p.getY(i)) || !Number.isFinite(p.getZ(i))) badP++;
  }
}
assertEq(badW, 0, 'every bridge vertex skinWeight sums to 1');
assertEq(badI, 0, 'every bridge skinIndex references one of the 2 bones');
assertEq(badP, 0, 'no non-finite bridge vertex positions');
ok('bridge skin weights well-formed (sum=1, indices 0..1, finite)');

// --- 3. rotating the shoulder deforms the OUTBOARD end; inboard stays planted ---
// (L16: scan ALL verts. The tube is N=5 stations × `rings` verts in station order,
// so station 0 [0,rings) is the inboard ring → anchor, station 4 [4r,5r) the
// outboard ring → shoulder.)
const pos = brR.geometry.attributes.position;
const rings = pos.count / 5;
const shoulder = model.parts.wingRigR.shoulder;
model.group.updateMatrixWorld(true);
brR.skeleton.update();
const rest = [];
for (let i = 0; i < pos.count; i++) rest.push(brR.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)));
shoulder.rotation.z += 0.8;
model.group.updateMatrixWorld(true);
brR.skeleton.update();
let inboardMax = 0, outboardMax = 0;
for (let i = 0; i < pos.count; i++) {
  const d = brR.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(pos, i)).distanceTo(rest[i]);
  if (i < rings) inboardMax = Math.max(inboardMax, d);          // station 0 → anchor
  if (i >= 4 * rings) outboardMax = Math.max(outboardMax, d);   // station 4 → shoulder
}
shoulder.rotation.z -= 0.8;                                     // restore rest pose
assert(outboardMax > 1e-2, `the wing end of the bridge follows the shoulder (Δ ${outboardMax.toFixed(3)})`);
assert(inboardMax < outboardMax * 0.34, `the body end stays planted (inboard Δ ${inboardMax.toFixed(3)} ≪ outboard ${outboardMax.toFixed(3)})`);
ok(`bridge stretches: outboard follows the wing (Δ ${outboardMax.toFixed(3)}), inboard planted (Δ ${inboardMax.toFixed(3)})`);

// --- 4. body material (no seam): opaque, DoubleSide, one shared instance --------
assert(brL.material === brR.material, 'both bridges share ONE body material instance');
assertEq(brL.material.side, THREE.DoubleSide, 'bridge uses the DoubleSide body material');
assert(brL.material.transparent !== true, 'bridge material is opaque (the body, not the translucent membrane)');
ok('bridge wears the body material (seam-free), not the wing membrane');

// --- 5. the metallic shoulder sphere is gone (the bridge subsumes it) -----------
// The old sphere was the lone plain Mesh parented directly to the wing pivot Bone;
// when bridging it is skipped (membrane/ribs/bridge hang off the mount, not the pivot).
let sphereOnPivot = 0;
model.parts.wingRigR.shoulder.children.forEach((c) => { if (c.isMesh && !c.isSkinnedMesh) sphereOnPivot++; });
assertEq(sphereOnPivot, 0, 'no metallic shoulder sphere remains on the pivot bone');
ok('the bolted metallic shoulder sphere is gone (replaced by the bridge)');

// --- 6. coexist: a plain skinnedMembrane build grows NO bridge ------------------
const plain = { ...obs, parts: { ...obs.parts, wings: 'skinnedMembrane' } };
const pm = buildDragonModel(plain, { detail: 'high' });
assert(!pm.group.getObjectByName('shoulderBridgeL') && !pm.group.getObjectByName('shoulderBridgeR'),
  'plain skinnedMembrane builds no shoulder bridge (opt-in only)');
ok('skinnedMembrane is untouched — the bridge is opt-in (coexist)');

// --- 7. the bridge subsumes BOTH static knobs at the joint: the 2 torso fairing
//        spheres AND the 2 metallic wing shoulder spheres (plain keeps all 4) -----
const countSpheres = (g) => { let c = 0; g.traverse((o) => { if ((o.isMesh || o.isSkinnedMesh) && o.geometry?.type === 'SphereGeometry') c++; }); return c; };
assertEq(countSpheres(pm.group) - countSpheres(model.group), 4, 'bridging drops 4 sphere knobs (2 torso fairings + 2 metallic shoulder balls)');
ok('both static knobs at the joint are gone (2 fairings + 2 shoulder balls) — the bridge fills it');

setActiveDetail('high');
console.log(`\n${n} shoulderBridge checks passed.`);
