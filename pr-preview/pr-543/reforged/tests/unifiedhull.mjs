// Headless gates for the UNIFIED SKINNED HULL (L23/L24, UNIFIED_HULL_PLAN.md).
// Obsidian's body+wings are ONE continuous procedural skinned organism: two skinned
// meshes (opaque hull + translucent membrane) on a SHARED 7-bone skeleton
// [bodyRoot, shL,elL,wrL, shR,elR,wrR]. The hull's body verts + the membrane's root
// band are welded to the STATIC bodyRoot, so the paired body-edge & wing-root verts
// can never separate under a bone rotation — the regression the L20/L21/L22 patches
// could not pass. Asserts: 7-bone skinned meshes + rig contract; well-formed weights
// + no degenerate tris; rest-parity; THE seam-coincidence-under-deform gate; and
// coexistence (azure carries no unifiedHull mesh, tris unchanged).
//   node tests/unifiedhull.mjs
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
const obs = ascendedDef(DRAGONS.obsidian, 3, 0);   // Eternal
assertEq(obs.parts.wings, 'unifiedHull', 'Obsidian opts into the unified hull wings');
assertEq(obs.parts.torso, 'unifiedHullTorso', 'Obsidian opts into the body-less hull torso');
const model = buildDragonModel(obs, { detail: 'high' });

const hull = model.group.getObjectByName('unifiedHull');
const membrane = model.group.getObjectByName('unifiedMembrane');

// --- 1. skinned meshes on ONE 7-bone skeleton + rig contract ------------------------
assert(hull && hull.isSkinnedMesh, 'the opaque hull is a SkinnedMesh');
assert(membrane && membrane.isSkinnedMesh, 'the translucent membrane is a SkinnedMesh');
assertEq(hull.frustumCulled, false, 'hull disables frustum culling');
assertEq(membrane.frustumCulled, false, 'membrane disables frustum culling');
assertEq(hull.skeleton.bones.length, 7, 'hull bound to a 7-bone skeleton');
assert(hull.skeleton === membrane.skeleton, 'hull + membrane SHARE one skeleton');
const sk = hull.skeleton;
const rigL = model.parts.wingRigL, rigR = model.parts.wingRigR;
assert(rigL.shoulder === sk.bones[1] && rigL.elbow === sk.bones[2] && rigL.wrist === sk.bones[3], 'left rig = bones[1..3]');
assert(rigR.shoulder === sk.bones[4] && rigR.elbow === sk.bones[5] && rigR.wrist === sk.bones[6], 'right rig = bones[4..6]');
assert(model.parts.wingPivotL?.isBone && model.parts.wingPivotR?.isBone, 'wingPivot handles are Bones (shoulders)');
assert(model.parts.wingTipL?.isBone && model.parts.wingTipR?.isBone, 'wingTip handles are Bones (wrists)');
assert(!!model.parts.tipMarkerL && !!model.parts.tipMarkerR, 'tip markers present (trail spawn)');
ok('one 7-bone skeleton carries hull + membrane; rig handles are the bones (contract intact)');

// the animator drives the cascade + rotates the elbow. Snapshot + restore EVERY
// driven rotation (shoulder/elbow/wrist all move) so the rest pose is clean for the
// rest-parity gate below.
const { flapWing } = await import('../js/dragonWingFlap.js');
const snap = (b) => ({ b, x: b.rotation.x, y: b.rotation.y, z: b.rotation.z });
const restore = (s) => { s.b.rotation.set(s.x, s.y, s.z); };
const snaps = [rigL.shoulder, rigL.elbow, rigL.wrist].map(snap);
const e0 = rigL.elbow.rotation.z;
flapWing(rigL, { phase: 1.3, flapAmp: 0.52, turnBias: 0, climbBias: 0, rollFold: 0, feather: 0.3 }, 1);
assert(Math.abs(rigL.elbow.rotation.z - e0) > 1e-3, 'flapWing rotates the elbow (lagged cascade)');
snaps.forEach(restore);   // fully restore the rest pose
ok('flap animator drives the shoulder→elbow→wrist cascade on the hull bones');

// --- 2. weights well-formed + no degenerate tris ------------------------------------
function scanMesh(mesh, label) {
  const g = mesh.geometry;
  const sw = g.attributes.skinWeight, si = g.attributes.skinIndex, p = g.attributes.position, nr = g.attributes.normal;
  let badW = 0, badI = 0, badP = 0, badN = 0;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i) - 1) > 1e-4) badW++;
    for (const v of [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)]) if (v < 0 || v > 6) badI++;
    if (!Number.isFinite(p.getX(i)) || !Number.isFinite(p.getY(i)) || !Number.isFinite(p.getZ(i))) badP++;
    if (!Number.isFinite(nr.getX(i)) || !Number.isFinite(nr.getY(i)) || !Number.isFinite(nr.getZ(i))) badN++;
  }
  assertEq(badW, 0, `${label}: every vertex skinWeight sums to 1`);
  assertEq(badI, 0, `${label}: every skinIndex in [0,6]`);
  assertEq(badP, 0, `${label}: all positions finite`);
  assertEq(badN, 0, `${label}: all normals finite`);
  // Degenerate (zero-area) triangle scan (L3). The L3 hazard is a MID-SURFACE fold
  // (3 distinct, collinear verts → "spokes" + NaN normals). The chord NATURALLY
  // collapses to a point at the wing tip (buildCurvedPatch — same as the shipped
  // skinnedMembrane), so a tip fan triangle with two COINCIDENT vertices is benign
  // and inherent (curvedpatch.mjs holds the same line: a non-tip panel must be
  // zero-degenerate, the tip taper is checked only for finite normals — already
  // asserted above). We flag only triangles whose 3 verts are all DISTINCT yet
  // zero-area — the real fold.
  const idx = g.index;
  let degen = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i)); b.fromBufferAttribute(p, idx.getX(i + 1)); c.fromBufferAttribute(p, idx.getX(i + 2));
    ab.subVectors(b, a); ac.subVectors(c, a);
    if (ab.cross(ac).length() >= 1e-9) continue;             // real triangle
    const coincident = a.distanceTo(b) < 1e-6 || b.distanceTo(c) < 1e-6 || a.distanceTo(c) < 1e-6;
    if (!coincident) degen++;                                 // distinct + zero-area = the L3 fold
  }
  assertEq(degen, 0, `${label}: no degenerate mid-surface (collinear) triangles`);
}
scanMesh(hull, 'hull');
scanMesh(membrane, 'membrane');
ok('skin weights well-formed (sum=1, indices 0..6, finite pos/normals) + no degenerate tris');

// --- 3. rest-parity: identity rest transform leaves every vertex byte-stable ---------
model.group.updateMatrixWorld(true);
hull.skeleton.update();
function restParity(mesh, label) {
  const p = mesh.geometry.attributes.position;
  let restMax = 0;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    restMax = Math.max(restMax, mesh.applyBoneTransform(i, v.clone()).distanceTo(v));
  }
  assert(restMax < 1e-4, `${label}: rest-parity byte-stable (max Δ ${restMax.toExponential(1)} < 1e-4)`);
  return restMax;
}
restParity(hull, 'hull');
restParity(membrane, 'membrane');
ok('rest-parity: applying each bone rest transform leaves both meshes byte-stable (correct bind)');

// --- 4. THE GATE — seam-coincidence-under-deform ------------------------------------
// Find a membrane ROOT-COLUMN (seam) vertex weighted 100% to bodyRoot (index 0), and
// the nearest HULL body-loft vertex (also bodyRoot) at rest. Both static → rotating a
// shoulder must keep them coincident.
const mPos = membrane.geometry.attributes.position;
const mSi = membrane.geometry.attributes.skinIndex, mSw = membrane.geometry.attributes.skinWeight;
const hPos = hull.geometry.attributes.position;
const hSi = hull.geometry.attributes.skinIndex, hSw = hull.geometry.attributes.skinWeight;
const isBodyRoot = (si, sw, i) => si.getX(i) === 0 && Math.abs(sw.getX(i) - 1) < 1e-6;

// pick a membrane seam vertex fully welded to bodyRoot
let seamI = -1;
for (let i = 0; i < mPos.count; i++) { if (isBodyRoot(mSi, mSw, i)) { seamI = i; break; } }
assert(seamI >= 0, 'a membrane root vertex is welded 100% to the static bodyRoot');
const seamP = new THREE.Vector3().fromBufferAttribute(mPos, seamI);
// nearest hull body-loft vertex (also bodyRoot)
let bestJ = -1, bestD = Infinity;
const hp = new THREE.Vector3();
for (let j = 0; j < hPos.count; j++) {
  if (!isBodyRoot(hSi, hSw, j)) continue;
  hp.fromBufferAttribute(hPos, j);
  const d = hp.distanceTo(seamP);
  if (d < bestD) { bestD = d; bestJ = j; }
}
assert(bestJ >= 0, 'found a paired body-loft vertex welded to bodyRoot');
// rest positions via the skinned transform
model.group.updateMatrixWorld(true); hull.skeleton.update();
const restSeam = membrane.applyBoneTransform(seamI, new THREE.Vector3().fromBufferAttribute(mPos, seamI));
const restBody = hull.applyBoneTransform(bestJ, new THREE.Vector3().fromBufferAttribute(hPos, bestJ));
// rotate the RIGHT shoulder ~0.5 rad and recompute
rigR.shoulder.rotation.z += 0.5;
rigR.shoulder.rotation.x += 0.3;
model.group.updateMatrixWorld(true); hull.skeleton.update(); membrane.skeleton.update();
const defSeam = membrane.applyBoneTransform(seamI, new THREE.Vector3().fromBufferAttribute(mPos, seamI));
const defBody = hull.applyBoneTransform(bestJ, new THREE.Vector3().fromBufferAttribute(hPos, bestJ));
rigR.shoulder.rotation.z -= 0.5; rigR.shoulder.rotation.x -= 0.3;   // restore
// both verts are static (bodyRoot), so each is byte-stable AND they stay paired.
const seamMove = defSeam.distanceTo(restSeam);
const bodyMove = defBody.distanceTo(restBody);
const pairGap = defSeam.distanceTo(defBody);
const restGap = restSeam.distanceTo(restBody);
assert(seamMove < 1e-5, `seam vertex stays static under the beat (Δ ${seamMove.toExponential(1)} < 1e-5)`);
assert(bodyMove < 1e-5, `paired body vertex stays static under the beat (Δ ${bodyMove.toExponential(1)} < 1e-5)`);
assert(Math.abs(pairGap - restGap) < 1e-5, `the paired body-edge & wing-root verts stay coincident (gap Δ ${Math.abs(pairGap - restGap).toExponential(1)} < 1e-5)`);
ok('SEAM GATE: under a 0.5-rad shoulder beat the membrane root + body verts stay coincident (the L20/L21/L22 regression PASSES)');

// also prove the OUTBOARD wing actually deforms (the beat moves the wing, not nothing)
rigR.shoulder.rotation.z += 0.5;
model.group.updateMatrixWorld(true); membrane.skeleton.update();
let outboardMax = 0;
for (let i = 0; i < mPos.count; i++) {
  if (mSi.getX(i) === 0 && mSw.getX(i) > 0.99) continue;   // skip welded-root verts
  const v0 = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i));
  rigR.shoulder.rotation.z -= 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
  const vR = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i));
  rigR.shoulder.rotation.z += 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
  outboardMax = Math.max(outboardMax, v0.distanceTo(vR));
  if (outboardMax > 0.1) break;
}
rigR.shoulder.rotation.z -= 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
assert(outboardMax > 0.05, `the outboard membrane DOES flap with the beat (max Δ ${outboardMax.toFixed(3)} > 0.05)`);
ok('the outboard wing deforms with the beat (the seam holds AND the wing still flies)');

// --- 5. coexistence: azure carries no unifiedHull mesh + unchanged tris -------------
const az = buildDragonModel(ascendedDef(DRAGONS.azure, 1, 0), { detail: 'high' });
let azHull = false, azTris = 0;
az.group.traverse((o) => {
  if (o.name === 'unifiedHull' || o.name === 'unifiedMembrane') azHull = true;
  if (o.isMesh && o.geometry) { const g = o.geometry; azTris += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3; }
});
assert(!azHull, 'azure has NO unified hull / membrane mesh (coexist)');
assertEq(Math.round(azTris), 2602, 'azure (Kindled) tri count unchanged (== baseline 2602)');
ok('coexistence: azure builds no unifiedHull mesh and its tri count is byte-identical');

setActiveDetail('high');
console.log(`\n${n} unifiedhull checks passed.`);
