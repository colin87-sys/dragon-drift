// Headless weld gates for the GENERIC data-driven hull (dragonHull.js) — the
// proven Night-Fury kernel factored so the body SHAPE is pure data. The three new
// starters (water/fire/earth) each supply their own profile + section + wingForms
// but share the kernel: zero-gap copy-the-boundary membrane weld, 7-bone arm rig,
// shared seam normals (one-surface read), tail/body-whip chains. This guards that a
// new profile never tears the wing — it asserts, per dragon, the same invariants
// nightfury.mjs asserts for Toothless. Toothless stays on its own module + test.
//   node tests/hull.mjs
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

const HULL_DRAGONS = ['water', 'fire', 'earth'];

function scanMesh(mesh, label) {
  const g = mesh.geometry;
  const sw = g.attributes.skinWeight, si = g.attributes.skinIndex, p = g.attributes.position, nr = g.attributes.normal;
  let badW = 0, badI = 0, badP = 0, badN = 0;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i) - 1) > 1e-4) badW++;
    for (const v of [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)]) if (v < 0 || v > mesh.skeleton.bones.length - 1) badI++;
    if (!Number.isFinite(p.getX(i)) || !Number.isFinite(p.getY(i)) || !Number.isFinite(p.getZ(i))) badP++;
    if (!Number.isFinite(nr.getX(i)) || !Number.isFinite(nr.getY(i)) || !Number.isFinite(nr.getZ(i))) badN++;
  }
  assertEq(badW, 0, `${label}: skinWeights sum to 1`);
  assertEq(badI, 0, `${label}: skinIndex in range`);
  assertEq(badP, 0, `${label}: positions finite`);
  assertEq(badN, 0, `${label}: normals finite`);
}

const isBodyRoot = (si, sw, i) => si.getX(i) === 0 && Math.abs(sw.getX(i) - 1) < 1e-6;

for (const key of HULL_DRAGONS) {
  const def = ascendedDef(DRAGONS[key], 2, 0);   // Radiant (SSR cap = tier 2)
  assertEq(def.parts.torso, 'hullTorso', `${key}: uses hullTorso`);
  assertEq(def.parts.wings, 'hullWings', `${key}: uses hullWings`);
  const model = buildDragonModel(def, { detail: 'high' });
  const hull = model.group.getObjectByName('hullBody');
  const membrane = model.group.getObjectByName('hullMembrane');
  assert(hull && hull.isSkinnedMesh, `${key}: opaque hull is a SkinnedMesh`);
  assert(membrane && membrane.isSkinnedMesh, `${key}: membrane is a SkinnedMesh`);
  assert(hull.skeleton === membrane.skeleton, `${key}: hull + membrane SHARE one skeleton`);

  // rig contract: bones[0..6] are body + 2 arms (the frozen 7-bone handles).
  const sk = hull.skeleton;
  const rigL = model.parts.wingRigL, rigR = model.parts.wingRigR;
  assert(rigL.shoulder === sk.bones[1] && rigL.elbow === sk.bones[2] && rigL.wrist === sk.bones[3], `${key}: left rig = bones[1..3]`);
  assert(rigR.shoulder === sk.bones[4] && rigR.elbow === sk.bones[5] && rigR.wrist === sk.bones[6], `${key}: right rig = bones[4..6]`);

  scanMesh(hull, `${key} hull`);
  scanMesh(membrane, `${key} membrane`);

  // rest-parity: bind is correct (applying rest transform is a no-op).
  model.group.updateMatrixWorld(true); hull.skeleton.update();
  let restMax = 0;
  const hp = membrane.geometry.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(hp, i);
    restMax = Math.max(restMax, membrane.applyBoneTransform(i, v.clone()).distanceTo(v));
  }
  assert(restMax < 1e-4, `${key}: membrane rest-parity byte-stable (max Δ ${restMax.toExponential(1)})`);

  // ZERO-GAP weld: every membrane bodyRoot vert is an EXACT copy of a hull body vert.
  const mPos = membrane.geometry.attributes.position, mSi = membrane.geometry.attributes.skinIndex, mSw = membrane.geometry.attributes.skinWeight;
  const hPos = hull.geometry.attributes.position, hSi = hull.geometry.attributes.skinIndex, hSw = hull.geometry.attributes.skinWeight;
  const hN = hull.geometry.attributes.normal, mN = membrane.geometry.attributes.normal;
  const bodyVerts = [], bodyIdx = [];
  for (let j = 0; j < hPos.count; j++) {
    if (!isBodyRoot(hSi, hSw, j)) continue;
    bodyVerts.push(new THREE.Vector3(hPos.getX(j), hPos.getY(j), hPos.getZ(j)));
    bodyIdx.push(j);
  }
  assert(bodyVerts.length > 0, `${key}: hull carries static body-loft verts`);
  let rootCount = 0, maxGap = 0, normMax = 0;
  const mv = new THREE.Vector3(), mnv = new THREE.Vector3(), hnv = new THREE.Vector3();
  for (let i = 0; i < mPos.count; i++) {
    if (!isBodyRoot(mSi, mSw, i)) continue;
    rootCount++;
    mv.set(mPos.getX(i), mPos.getY(i), mPos.getZ(i));
    let best = Infinity, bj = -1;
    for (let k = 0; k < bodyVerts.length; k++) { const d = bodyVerts[k].distanceTo(mv); if (d < best) { best = d; bj = bodyIdx[k]; } }
    if (best > maxGap) maxGap = best;
    mnv.set(mN.getX(i), mN.getY(i), mN.getZ(i));
    hnv.set(hN.getX(bj), hN.getY(bj), hN.getZ(bj));
    normMax = Math.max(normMax, mnv.distanceTo(hnv));
  }
  assert(rootCount >= 6, `${key}: membrane root chord welded to bodyRoot (${rootCount} verts ≥ 6)`);
  assert(maxGap < 1e-6, `${key}: ZERO-GAP weld (max gap ${maxGap.toExponential(1)} < 1e-6)`);
  assert(normMax < 1e-4, `${key}: SEAM-NORMAL continuity (max Δ ${normMax.toExponential(1)} < 1e-4)`);

  // CONNECTION HOLDS IN MOTION: under a shoulder beat the seam stays welded but the
  // outboard membrane flies.
  let seamI = -1;
  for (let i = 0; i < mPos.count; i++) { if (isBodyRoot(mSi, mSw, i)) { seamI = i; break; } }
  const seamP = new THREE.Vector3().fromBufferAttribute(mPos, seamI);
  let bestJ = -1, bestD = Infinity; const hpp = new THREE.Vector3();
  for (let j = 0; j < hPos.count; j++) {
    if (!isBodyRoot(hSi, hSw, j)) continue;
    hpp.fromBufferAttribute(hPos, j);
    const d = hpp.distanceTo(seamP);
    if (d < bestD) { bestD = d; bestJ = j; }
  }
  model.group.updateMatrixWorld(true); hull.skeleton.update();
  const restSeam = membrane.applyBoneTransform(seamI, new THREE.Vector3().fromBufferAttribute(mPos, seamI));
  const restBody = hull.applyBoneTransform(bestJ, new THREE.Vector3().fromBufferAttribute(hPos, bestJ));
  rigR.shoulder.rotation.z += 0.5; rigR.shoulder.rotation.x += 0.3;
  model.group.updateMatrixWorld(true); hull.skeleton.update(); membrane.skeleton.update();
  const defSeam = membrane.applyBoneTransform(seamI, new THREE.Vector3().fromBufferAttribute(mPos, seamI));
  const defBody = hull.applyBoneTransform(bestJ, new THREE.Vector3().fromBufferAttribute(hPos, bestJ));
  const pairGap = defSeam.distanceTo(defBody), restGap = restSeam.distanceTo(restBody);
  assert(defSeam.distanceTo(restSeam) < 1e-5, `${key}: seam vertex stays static under the beat`);
  assert(Math.abs(pairGap - restGap) < 1e-5, `${key}: paired seam verts coincident under motion (Δ ${Math.abs(pairGap - restGap).toExponential(1)} < 1e-5)`);
  // outboard flies
  let outboardMax = 0;
  for (let i = 0; i < mPos.count; i++) {
    if (mSi.getX(i) === 0 && mSw.getX(i) > 0.99) continue;
    const vD = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i));
    rigR.shoulder.rotation.z -= 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
    const vR = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i));
    rigR.shoulder.rotation.z += 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
    outboardMax = Math.max(outboardMax, vD.distanceTo(vR));
    if (outboardMax > 0.1) break;
  }
  rigR.shoulder.rotation.z -= 0.5; rigR.shoulder.rotation.x -= 0.3;
  assert(outboardMax > 0.05, `${key}: outboard membrane flaps with the beat (max Δ ${outboardMax.toFixed(3)} > 0.05)`);

  ok(`${key}: hull welds zero-gap, holds in motion, shares seam normals, weights well-formed`);
}

// coexistence: a non-hull dragon builds NO hull mesh (the generic builder is opt-in).
const az = buildDragonModel(ascendedDef(DRAGONS.azure, 1, 0), { detail: 'high' });
assert(!az.group.getObjectByName('hullBody'), 'azure builds no hull mesh (hull builder is opt-in via parts)');
ok('coexistence: a non-hull dragon (azure) builds no hull mesh');

console.log(`\n${n} hull checks passed.`);
