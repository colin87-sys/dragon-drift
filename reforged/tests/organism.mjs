// Headless gates for the CLEAN-SHEET ORGANISM HULL (LEAPFROG L25 FORK,
// dragonOrganism.js). Obsidian Shade II (obsidian2) is a NEW creature whose
// body+wings are generated TOGETHER as one continuous skinned hull on a SHARED
// 7-bone skeleton [bodyRoot, shL,elL,wrL, shR,elR,wrR]. Unlike the v1 unifiedHull
// (which welded onto Obsidian's legacy body and left a ~0.43 analytic-flank gap),
// the membrane root-column verts are EXACT COPIES of the body loft's own flank
// verts — ZERO gap by construction — and both are weighted 100% to the static
// bodyRoot, so the relationship is frozen under any motion.
//
// Gates: (1) 7-bone skeleton + rig handles are bones; (2) weights well-formed +
// no real degenerate tris; (3) rest-parity (restore ALL bone rotations first);
// (4) ZERO-GAP CONNECTION (every membrane root vert within Δ<1e-6 of a body-loft
// vert at rest); (5) CONNECTION HOLDS IN MOTION (0.5-rad shoulder beat keeps each
// membrane root vert within Δ<1e-5 of its paired body vert, AND an outboard vert
// MOVES); (6) coexistence (obsidian v1 + azure build unchanged, no organism mesh).
//   node tests/organism.mjs
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
const obs = ascendedDef(DRAGONS.obsidian2, 3, 0);   // Eternal
assertEq(obs.parts.wings, 'organismWings', 'Obsidian II opts into the clean-sheet organism wings');
assertEq(obs.parts.torso, 'organismTorso', 'Obsidian II opts into the body-less organism torso');
const model = buildDragonModel(obs, { detail: 'high' });

const hull = model.group.getObjectByName('organismHull');
const membrane = model.group.getObjectByName('organismMembrane');
const fingers = model.group.getObjectByName('organismFingers');

// --- 1. skinned meshes on ONE 7-bone skeleton + rig contract ------------------------
assert(hull && hull.isSkinnedMesh, 'the opaque hull is a SkinnedMesh');
assert(membrane && membrane.isSkinnedMesh, 'the translucent membrane is a SkinnedMesh');
assert(fingers && fingers.isSkinnedMesh, 'the finger struts are a SkinnedMesh');
assertEq(hull.frustumCulled, false, 'hull disables frustum culling');
assertEq(membrane.frustumCulled, false, 'membrane disables frustum culling');
assertEq(hull.skeleton.bones.length, 7, 'hull bound to a 7-bone skeleton');
assert(hull.skeleton === membrane.skeleton && hull.skeleton === fingers.skeleton, 'hull + membrane + fingers SHARE one skeleton');
const sk = hull.skeleton;
const rigL = model.parts.wingRigL, rigR = model.parts.wingRigR;
assert(rigL.shoulder === sk.bones[1] && rigL.elbow === sk.bones[2] && rigL.wrist === sk.bones[3], 'left rig = bones[1..3]');
assert(rigR.shoulder === sk.bones[4] && rigR.elbow === sk.bones[5] && rigR.wrist === sk.bones[6], 'right rig = bones[4..6]');
assert(model.parts.wingPivotL?.isBone && model.parts.wingPivotR?.isBone, 'wingPivot handles are Bones (shoulders)');
assert(model.parts.wingTipL?.isBone && model.parts.wingTipR?.isBone, 'wingTip handles are Bones (wrists)');
assert(!!model.parts.tipMarkerL && !!model.parts.tipMarkerR, 'tip markers present (trail spawn)');
ok('one 7-bone skeleton carries hull + membrane + fingers; rig handles are the bones (contract intact)');

// the animator drives the cascade + rotates the elbow. Snapshot + restore EVERY driven
// rotation (shoulder/elbow/wrist all move) so the rest pose is clean for rest-parity (L25).
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
  // Degenerate (zero-area) triangle scan (L3). buildCurvedPatch NATURALLY collapses
  // the chord to a point at the wing tip (same as the shipped skinnedMembrane), so a
  // tip-fan triangle with two COINCIDENT verts is benign + inherent. We flag only
  // triangles whose 3 verts are all DISTINCT yet zero-area — the real L3 fold.
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
scanMesh(fingers, 'fingers');
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
}
restParity(hull, 'hull');
restParity(membrane, 'membrane');
restParity(fingers, 'fingers');
ok('rest-parity: applying each bone rest transform leaves all meshes byte-stable (correct bind)');

// --- 4. ZERO-GAP CONNECTION: every membrane root vert IS a body-loft vert -----------
// The clean-sheet difference from v1: the membrane root column is EXACT COPIES of the
// body loft's flank verts. Collect the hull's static body-loft verts (bodyRoot=1) and
// assert every membrane root-column vert (bodyRoot=1) is within Δ<1e-6 of one.
const mPos = membrane.geometry.attributes.position;
const mSi = membrane.geometry.attributes.skinIndex, mSw = membrane.geometry.attributes.skinWeight;
const hPos = hull.geometry.attributes.position;
const hSi = hull.geometry.attributes.skinIndex, hSw = hull.geometry.attributes.skinWeight;
const isBodyRoot = (si, sw, i) => si.getX(i) === 0 && Math.abs(sw.getX(i) - 1) < 1e-6;

const bodyVerts = [];
const hp = new THREE.Vector3();
for (let j = 0; j < hPos.count; j++) {
  if (!isBodyRoot(hSi, hSw, j)) continue;
  bodyVerts.push(new THREE.Vector3(hPos.getX(j), hPos.getY(j), hPos.getZ(j)));
}
assert(bodyVerts.length > 0, 'hull carries static body-loft verts welded to bodyRoot');
let rootCount = 0, maxGap = 0;
const mv = new THREE.Vector3();
for (let i = 0; i < mPos.count; i++) {
  if (!isBodyRoot(mSi, mSw, i)) continue;           // a membrane root-column / welded vert
  rootCount++;
  mv.set(mPos.getX(i), mPos.getY(i), mPos.getZ(i));
  let best = Infinity;
  for (const b of bodyVerts) { const d = b.distanceTo(mv); if (d < best) best = d; }
  if (best > maxGap) maxGap = best;
}
assert(rootCount > 0, 'membrane has root-column verts welded 100% to bodyRoot');
assert(maxGap < 1e-6, `ZERO-GAP: every membrane root vert is within Δ<1e-6 of a body-loft vert (max gap ${maxGap.toExponential(1)})`);
ok(`ZERO-GAP CONNECTION: all ${rootCount} membrane root verts are EXACT COPIES of body-loft verts (the v1 ~0.43 gap is GONE)`);

// --- 5. CONNECTION HOLDS IN MOTION --------------------------------------------------
// Pick a membrane seam vert (bodyRoot=1) + its paired body vert; both static → a
// 0.5-rad shoulder beat keeps them coincident. AND an outboard vert must MOVE.
let seamI = -1;
for (let i = 0; i < mPos.count; i++) { if (isBodyRoot(mSi, mSw, i)) { seamI = i; break; } }
const seamP = new THREE.Vector3().fromBufferAttribute(mPos, seamI);
let bestJ = -1, bestD = Infinity;
for (let j = 0; j < hPos.count; j++) {
  if (!isBodyRoot(hSi, hSw, j)) continue;
  hp.fromBufferAttribute(hPos, j);
  const d = hp.distanceTo(seamP);
  if (d < bestD) { bestD = d; bestJ = j; }
}
assert(bestJ >= 0, 'found a paired body-loft vertex welded to bodyRoot');
model.group.updateMatrixWorld(true); hull.skeleton.update();
const restSeam = membrane.applyBoneTransform(seamI, new THREE.Vector3().fromBufferAttribute(mPos, seamI));
const restBody = hull.applyBoneTransform(bestJ, new THREE.Vector3().fromBufferAttribute(hPos, bestJ));
rigR.shoulder.rotation.z += 0.5;
rigR.shoulder.rotation.x += 0.3;
model.group.updateMatrixWorld(true); hull.skeleton.update(); membrane.skeleton.update();
const defSeam = membrane.applyBoneTransform(seamI, new THREE.Vector3().fromBufferAttribute(mPos, seamI));
const defBody = hull.applyBoneTransform(bestJ, new THREE.Vector3().fromBufferAttribute(hPos, bestJ));
rigR.shoulder.rotation.z -= 0.5; rigR.shoulder.rotation.x -= 0.3;   // restore
const seamMove = defSeam.distanceTo(restSeam);
const bodyMove = defBody.distanceTo(restBody);
const pairGap = defSeam.distanceTo(defBody);
const restGap = restSeam.distanceTo(restBody);
assert(seamMove < 1e-5, `seam vertex stays static under the beat (Δ ${seamMove.toExponential(1)} < 1e-5)`);
assert(bodyMove < 1e-5, `paired body vertex stays static under the beat (Δ ${bodyMove.toExponential(1)} < 1e-5)`);
assert(Math.abs(pairGap - restGap) < 1e-5, `paired body-edge & wing-root verts stay coincident under motion (gap Δ ${Math.abs(pairGap - restGap).toExponential(1)} < 1e-5)`);

// the outboard wing actually deforms (the beat moves the wing, not nothing).
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
ok('CONNECTION HOLDS IN MOTION: under a 0.5-rad shoulder beat the membrane root stays welded to the body AND the wing flies');

// --- 6. coexistence: obsidian (v1) + azure build unchanged, no organism mesh --------
function buildCounts(key, tier) {
  const m = buildDragonModel(ascendedDef(DRAGONS[key], tier, 0), { detail: 'high' });
  let organism = false, tris = 0;
  m.group.traverse((o) => {
    if (o.name === 'organismHull' || o.name === 'organismMembrane' || o.name === 'organismFingers') organism = true;
    if (o.isMesh && o.geometry) { const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3; }
  });
  return { organism, tris: Math.round(tris) };
}
const v1 = buildCounts('obsidian', 3);     // v1 unifiedHull Obsidian — unchanged
assert(!v1.organism, 'obsidian (v1 unifiedHull) carries NO organism mesh (coexist)');
assertEq(v1.tris, 3662, 'obsidian (v1) Eternal tri count unchanged (== baseline 3662)');
const az = buildCounts('azure', 1);
assert(!az.organism, 'azure has NO organism mesh (coexist)');
assertEq(az.tris, 2602, 'azure (Kindled) tri count unchanged (== baseline 2602)');
ok('coexistence: obsidian (v1) and azure build no organism mesh, tri counts byte-identical');

setActiveDetail('high');
console.log(`\n${n} organism checks passed.`);
