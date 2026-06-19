// Headless gates for the FRESH FURY HULL (dragonFuryHull.js) — a clean-sheet welded
// skinned Night-Fury hull (body + bat-wings + down-swept tail with twin split fins as
// ONE continuous surface). Shares ONLY generic plumbing; no obsidian/organism/nightFury
// geometry is reused. Gates: (1) 11-bone skeleton + rig contract; (2) weights well-formed
// + no degenerate tris; (3) rest-parity; (4) ZERO-GAP welds (membrane root verts are EXACT
// copies of hull verts); (5) welds HOLD under a wing beat AND a tail beat while the outboard
// surface flies; (6) coexistence (azure/obsidian unchanged, no fury mesh).
//   node tests/furyhull.mjs
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
const { flapWing } = await import('../js/dragonWingFlap.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

setActiveDetail('high');
const fd = ascendedDef(DRAGONS.furyDrake, 3, 0);   // Eternal
assertEq(fd.parts.torso, 'furyHullTorso', 'furyDrake opts into the fresh body-less hull torso');
assertEq(fd.parts.wings, 'furyHull', 'furyDrake opts into the fresh welded hull wings');
assertEq(fd.parts.tail, 'furyHullTail', 'furyDrake tail is the no-op (hull owns the tail)');
const model = buildDragonModel(fd, { detail: 'high' });

const hull = model.group.getObjectByName('furyHull');
const membrane = model.group.getObjectByName('furyMembrane');
const struts = model.group.getObjectByName('furyStruts');

// --- 1. skinned meshes on ONE 11-bone skeleton + rig contract -----------------------
assert(hull && hull.isSkinnedMesh, 'the opaque hull is a SkinnedMesh');
assert(membrane && membrane.isSkinnedMesh, 'the translucent membrane is a SkinnedMesh');
assert(struts && struts.isSkinnedMesh, 'the struts are a SkinnedMesh');
assertEq(hull.frustumCulled, false, 'hull disables frustum culling');
assertEq(hull.skeleton.bones.length, 11, 'hull bound to an 11-bone skeleton (body + 2×3 wing + 4 tail)');
assert(hull.skeleton === membrane.skeleton && hull.skeleton === struts.skeleton, 'hull + membrane + struts SHARE one skeleton');
const sk = hull.skeleton;
const rigL = model.parts.wingRigL, rigR = model.parts.wingRigR;
assert(rigL.shoulder === sk.bones[1] && rigL.elbow === sk.bones[2] && rigL.wrist === sk.bones[3], 'left rig = bones[1..3]');
assert(rigR.shoulder === sk.bones[4] && rigR.elbow === sk.bones[5] && rigR.wrist === sk.bones[6], 'right rig = bones[4..6]');
assert(model.parts.wingPivotL?.isBone && model.parts.wingTipR?.isBone, 'wingPivot/Tip handles are Bones');
assert(!!model.parts.tipMarkerL && !!model.parts.tipMarkerR, 'tip markers present (trail spawn)');
assertEq(model.parts.tailSegs.length, 4, 'tail-whip exposes a 4-bone tail chain (tailSegs)');
assert(model.parts.tailSegs.every((b) => b.isBone), 'tail segments are Bones (skinned whip)');
ok('one skeleton carries hull + membrane + struts; rig handles + tail chain intact');

const snap = (b) => ({ b, x: b.rotation.x, y: b.rotation.y, z: b.rotation.z });
const restore = (s) => s.b.rotation.set(s.x, s.y, s.z);
const snaps = [rigL.shoulder, rigL.elbow, rigL.wrist].map(snap);
const e0 = rigL.elbow.rotation.z;
flapWing(rigL, { phase: 1.3, flapAmp: 0.52, turnBias: 0, climbBias: 0, rollFold: 0, feather: 0.3 }, 1);
assert(Math.abs(rigL.elbow.rotation.z - e0) > 1e-3, 'flapWing rotates the elbow (lagged cascade)');
snaps.forEach(restore);
ok('flap animator drives the shoulder→elbow→wrist cascade on the hull bones');

// --- 2. weights well-formed + no degenerate tris ------------------------------------
function scanMesh(mesh, label) {
  const g = mesh.geometry;
  const sw = g.attributes.skinWeight, si = g.attributes.skinIndex, p = g.attributes.position, nr = g.attributes.normal;
  let badW = 0, badI = 0, badP = 0, badN = 0;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i) - 1) > 1e-4) badW++;
    for (const v of [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)]) if (v < 0 || v > mesh.skeleton.bones.length - 1) badI++;
    if (![p.getX(i), p.getY(i), p.getZ(i)].every(Number.isFinite)) badP++;
    if (![nr.getX(i), nr.getY(i), nr.getZ(i)].every(Number.isFinite)) badN++;
  }
  assertEq(badW, 0, `${label}: every vertex skinWeight sums to 1`);
  assertEq(badI, 0, `${label}: every skinIndex in [0, bones-1]`);
  assertEq(badP, 0, `${label}: all positions finite`);
  assertEq(badN, 0, `${label}: all normals finite`);
  const idx = g.index;
  let degen = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i)); b.fromBufferAttribute(p, idx.getX(i + 1)); c.fromBufferAttribute(p, idx.getX(i + 2));
    ab.subVectors(b, a); ac.subVectors(c, a);
    if (ab.cross(ac).length() >= 1e-9) continue;
    const coincident = a.distanceTo(b) < 1e-6 || b.distanceTo(c) < 1e-6 || a.distanceTo(c) < 1e-6;
    if (!coincident) degen++;
  }
  assertEq(degen, 0, `${label}: no degenerate mid-surface (collinear) triangles`);
}
scanMesh(hull, 'hull'); scanMesh(membrane, 'membrane'); scanMesh(struts, 'struts');
ok('skin weights well-formed (sum=1, valid bone indices, finite pos/normals) + no degenerate tris');

// --- 3. rest-parity -----------------------------------------------------------------
model.group.updateMatrixWorld(true); hull.skeleton.update();
function restParity(mesh, label) {
  const p = mesh.geometry.attributes.position;
  let restMax = 0;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    restMax = Math.max(restMax, mesh.applyBoneTransform(i, v.clone()).distanceTo(v));
  }
  assert(restMax < 1e-4, `${label}: rest-parity byte-stable (max Δ ${restMax.toExponential(1)} < 1e-4)`);
}
restParity(hull, 'hull'); restParity(membrane, 'membrane'); restParity(struts, 'struts');
ok('rest-parity: applying each bone rest transform leaves all meshes byte-stable (correct bind)');

// --- 4. ZERO-GAP welds: membrane root verts are EXACT copies of hull verts ----------
const mPos = membrane.geometry.attributes.position;
const hPos = hull.geometry.attributes.position;
const mSi = membrane.geometry.attributes.skinIndex, mSw = membrane.geometry.attributes.skinWeight;
const hSi = hull.geometry.attributes.skinIndex, hSw = hull.geometry.attributes.skinWeight;
// hull verts keyed by quantised position for fast exact-match lookup.
const key = (x, y, z) => `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
const hullMap = new Map();
for (let j = 0; j < hPos.count; j++) hullMap.set(key(hPos.getX(j), hPos.getY(j), hPos.getZ(j)), j);
const pairs = [];
for (let i = 0; i < mPos.count; i++) {
  const j = hullMap.get(key(mPos.getX(i), mPos.getY(i), mPos.getZ(i)));
  if (j == null) continue;
  pairs.push([i, j]);
}
assert(pairs.length >= 12, `membrane has welded root verts that EXACTLY match hull verts (${pairs.length} ≥ 12)`);
// each welded pair must also share its bone field, so they deform identically.
let weightMatch = 0;
for (const [i, j] of pairs) {
  const same = mSi.getX(i) === hSi.getX(j) && Math.abs(mSw.getX(i) - hSw.getX(j)) < 1e-5
    && mSi.getY(i) === hSi.getY(j) && Math.abs(mSw.getY(i) - hSw.getY(j)) < 1e-5;
  if (same) weightMatch++;
}
assertEq(weightMatch, pairs.length, 'every welded root vert copies its hull vert bone field (si/sw)');
ok(`ZERO-GAP: ${pairs.length} membrane root verts are exact-vert + exact-weight welds of the hull`);

// --- 5. welds HOLD under a wing beat AND a tail beat; outboard flies -----------------
function maxPairDriftUnder(apply, undo) {
  model.group.updateMatrixWorld(true); hull.skeleton.update(); membrane.skeleton.update();
  const before = pairs.map(([i, j]) => membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i))
    .distanceTo(hull.applyBoneTransform(j, new THREE.Vector3().fromBufferAttribute(hPos, j))));
  apply();
  model.group.updateMatrixWorld(true); hull.skeleton.update(); membrane.skeleton.update();
  let drift = 0;
  pairs.forEach(([i, j], k) => {
    const g = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i))
      .distanceTo(hull.applyBoneTransform(j, new THREE.Vector3().fromBufferAttribute(hPos, j)));
    drift = Math.max(drift, Math.abs(g - before[k]));
  });
  undo();
  model.group.updateMatrixWorld(true); hull.skeleton.update(); membrane.skeleton.update();
  return drift;
}
function outboardMoveUnder(apply, undo) {
  const rest = [];
  model.group.updateMatrixWorld(true); membrane.skeleton.update();
  for (let i = 0; i < mPos.count; i++) rest.push(membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i)));
  apply();
  model.group.updateMatrixWorld(true); membrane.skeleton.update();
  let mv = 0;
  for (let i = 0; i < mPos.count; i++) mv = Math.max(mv, membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i)).distanceTo(rest[i]));
  undo();
  model.group.updateMatrixWorld(true); membrane.skeleton.update();
  return mv;
}
const wingDrift = maxPairDriftUnder(() => { rigR.shoulder.rotation.z += 0.5; rigR.shoulder.rotation.x += 0.3; }, () => { rigR.shoulder.rotation.z -= 0.5; rigR.shoulder.rotation.x -= 0.3; });
assert(wingDrift < 1e-5, `welds hold under a 0.5-rad wing beat (max pair drift ${wingDrift.toExponential(1)} < 1e-5)`);
const wingFly = outboardMoveUnder(() => { rigR.shoulder.rotation.z += 0.5; }, () => { rigR.shoulder.rotation.z -= 0.5; });
assert(wingFly > 0.05, `the outboard wing flies under the beat (max Δ ${wingFly.toFixed(3)} > 0.05)`);
const t3 = model.parts.tailSegs[3], t1 = model.parts.tailSegs[1];
const tailDrift = maxPairDriftUnder(() => { t1.rotation.x += 0.4; t3.rotation.y += 0.4; }, () => { t1.rotation.x -= 0.4; t3.rotation.y -= 0.4; });
assert(tailDrift < 1e-5, `welds hold under a tail beat (max pair drift ${tailDrift.toExponential(1)} < 1e-5)`);
const tailFly = outboardMoveUnder(() => { t1.rotation.x += 0.4; }, () => { t1.rotation.x -= 0.4; });
assert(tailFly > 0.02, `the tail-fins ride the tail whip (max Δ ${tailFly.toFixed(3)} > 0.02)`);
ok('welds HOLD in motion (wing + tail beats) while the outboard wing + tail-fins fly');

// --- 6. coexistence: azure + obsidian unchanged, no fury mesh -----------------------
function buildCounts(k, tier) {
  const m = buildDragonModel(ascendedDef(DRAGONS[k], tier, 0), { detail: 'high' });
  let fury = false, tris = 0;
  m.group.traverse((o) => {
    if (o.name === 'furyHull' || o.name === 'furyMembrane' || o.name === 'furyStruts') fury = true;
    if (o.isMesh && o.geometry) { const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3; }
  });
  return { fury, tris: Math.round(tris) };
}
const az = buildCounts('azure', 1);
assert(!az.fury, 'azure carries NO fury mesh (coexist)');
assertEq(az.tris, 2602, 'azure (Kindled) tri count unchanged (== baseline 2602)');
const ob = buildCounts('obsidian', 3);
assert(!ob.fury, 'obsidian carries NO fury mesh (coexist)');
ok('coexistence: azure + obsidian build no fury mesh; azure tris byte-identical');

setActiveDetail('high');
console.log(`\n${n} fury-hull checks passed.`);
