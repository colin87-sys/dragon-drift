// Headless gates for the NIGHT FURY smooth hull (LEAPFROG L32 fresh-take,
// dragonNightFury.js). "Toothless" (toothless) is a NEW creature: body+wings on the
// SMOOTH longitudinal-spline loft (sweepProfileSmooth — no "metallic rings"), the
// proven zero-gap copy-the-boundary weld, SHARED seam normals (one-surface read),
// and a finger to EVERY scallop. Head/neck/tail are OFF this increment (grown from
// the hull in I2/I3) — body+wings only, no legacy bolted parts.
//
// Gates: the organism kernel set — (1) 7-bone skeleton + rig handles are bones;
// (2) weights well-formed + no real degenerate tris; (3) rest-parity; (4) ZERO-GAP
// + (4b) MIDDLE CONNECTED; (5) connection HOLDS IN MOTION — PLUS the two L32
// upgrades: (7) NO LONGITUDINAL FACET (the smooth loft turns far more gently along z
// than the legacy faceted loft) and (8) SEAM-NORMAL CONTINUITY (paired hull/membrane
// seam verts share a normal → no shading break). (6) coexistence (obsidian2/azure
// unchanged, no nightFury mesh).
//   node tests/nightfury.mjs
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
const { sweepProfile, sweepProfileSmooth } = await import('../js/dragonSweep.js');
const { NIGHTFURY_PROFILE, nfSection } = await import('../js/dragonNightFury.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

setActiveDetail('high');
const tld = ascendedDef(DRAGONS.toothless, 3, 0);   // Eternal
assertEq(tld.parts.wings, 'nightFuryWings', 'Toothless opts into the night-fury wings');
assertEq(tld.parts.torso, 'nightFuryTorso', 'Toothless opts into the body-less night-fury torso');
assertEq(tld.parts.head, 'none', 'Toothless head is OFF this increment (grown from the hull in I2)');
assertEq(tld.parts.tail, 'none', 'Toothless tail is OFF this increment (grown from the hull in I3)');
const model = buildDragonModel(tld, { detail: 'high' });

const hull = model.group.getObjectByName('nightFuryHull');
const membrane = model.group.getObjectByName('nightFuryMembrane');
const fingers = model.group.getObjectByName('nightFuryFingers');

// no legacy parts rendered: head group is empty, tail has no coil segs.
assertEq(model.parts.tailSegs.length, 0, 'no legacy tail segments (tail OFF)');
assert(!model.group.getObjectByName('organismHull'), 'no organism mesh (this is the night-fury build)');

// --- 1. skinned meshes on ONE 7-bone skeleton + rig contract ------------------------
assert(hull && hull.isSkinnedMesh, 'the opaque hull is a SkinnedMesh');
assert(membrane && membrane.isSkinnedMesh, 'the translucent membrane is a SkinnedMesh');
assert(fingers && fingers.isSkinnedMesh, 'the finger struts are a SkinnedMesh');
assertEq(hull.frustumCulled, false, 'hull disables frustum culling');
assertEq(hull.skeleton.bones.length, 7, 'hull bound to a 7-bone skeleton');
assert(hull.skeleton === membrane.skeleton && hull.skeleton === fingers.skeleton, 'hull + membrane + fingers SHARE one skeleton');
const sk = hull.skeleton;
const rigL = model.parts.wingRigL, rigR = model.parts.wingRigR;
assert(rigL.shoulder === sk.bones[1] && rigL.elbow === sk.bones[2] && rigL.wrist === sk.bones[3], 'left rig = bones[1..3]');
assert(rigR.shoulder === sk.bones[4] && rigR.elbow === sk.bones[5] && rigR.wrist === sk.bones[6], 'right rig = bones[4..6]');
assert(model.parts.wingPivotL?.isBone && model.parts.wingTipR?.isBone, 'wingPivot/Tip handles are Bones');
assert(!!model.parts.tipMarkerL && !!model.parts.tipMarkerR, 'tip markers present (trail spawn)');
ok('one 7-bone skeleton carries hull + membrane + fingers; rig handles are the bones (contract intact)');

const { flapWing } = await import('../js/dragonWingFlap.js');
const snap = (b) => ({ b, x: b.rotation.x, y: b.rotation.y, z: b.rotation.z });
const restore = (s) => { s.b.rotation.set(s.x, s.y, s.z); };
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
    for (const v of [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)]) if (v < 0 || v > 6) badI++;
    if (!Number.isFinite(p.getX(i)) || !Number.isFinite(p.getY(i)) || !Number.isFinite(p.getZ(i))) badP++;
    if (!Number.isFinite(nr.getX(i)) || !Number.isFinite(nr.getY(i)) || !Number.isFinite(nr.getZ(i))) badN++;
  }
  assertEq(badW, 0, `${label}: every vertex skinWeight sums to 1`);
  assertEq(badI, 0, `${label}: every skinIndex in [0,6]`);
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
scanMesh(hull, 'hull');
scanMesh(membrane, 'membrane');
scanMesh(fingers, 'fingers');
ok('skin weights well-formed (sum=1, indices 0..6, finite pos/normals) + no degenerate tris');

// --- 3. rest-parity -----------------------------------------------------------------
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

// --- 4. ZERO-GAP CONNECTION ---------------------------------------------------------
const mPos = membrane.geometry.attributes.position;
const mSi = membrane.geometry.attributes.skinIndex, mSw = membrane.geometry.attributes.skinWeight;
const hPos = hull.geometry.attributes.position;
const hSi = hull.geometry.attributes.skinIndex, hSw = hull.geometry.attributes.skinWeight;
const isBodyRoot = (si, sw, i) => si.getX(i) === 0 && Math.abs(sw.getX(i) - 1) < 1e-6;

const bodyVerts = [], bodyIdx = [];
const hp = new THREE.Vector3();
for (let j = 0; j < hPos.count; j++) {
  if (!isBodyRoot(hSi, hSw, j)) continue;
  bodyVerts.push(new THREE.Vector3(hPos.getX(j), hPos.getY(j), hPos.getZ(j)));
  bodyIdx.push(j);
}
assert(bodyVerts.length > 0, 'hull carries static body-loft verts welded to bodyRoot');
let rootCount = 0, maxGap = 0;
const mv = new THREE.Vector3();
for (let i = 0; i < mPos.count; i++) {
  if (!isBodyRoot(mSi, mSw, i)) continue;
  rootCount++;
  mv.set(mPos.getX(i), mPos.getY(i), mPos.getZ(i));
  let best = Infinity;
  for (const b of bodyVerts) { const d = b.distanceTo(mv); if (d < best) best = d; }
  if (best > maxGap) maxGap = best;
}
assert(rootCount > 0, 'membrane has root-column verts welded 100% to bodyRoot');
assert(maxGap < 1e-6, `ZERO-GAP: every membrane root vert is within Δ<1e-6 of a body-loft vert (max gap ${maxGap.toExponential(1)})`);
ok(`ZERO-GAP CONNECTION: all ${rootCount} membrane root verts are EXACT COPIES of body-loft verts`);

// --- 4b. MIDDLE CONNECTED -----------------------------------------------------------
const rootVerts = [];
for (let i = 0; i < mPos.count; i++) {
  if (!isBodyRoot(mSi, mSw, i)) continue;
  rootVerts.push({ i, x: mPos.getX(i), y: mPos.getY(i), z: mPos.getZ(i) });
}
assert(rootVerts.length >= 6, `root chord has enough verts for a front/middle/back read (${rootVerts.length} ≥ 6)`);
for (const side of [1, -1]) {
  const col = rootVerts.filter((c) => Math.sign(c.x) === side).sort((a, b) => a.z - b.z);
  assert(col.length >= 3, `side ${side}: root chord has a front/middle/back (${col.length} ≥ 3)`);
  const zSpan = col[col.length - 1].z - col[0].z;
  assert(zSpan > 0.2, `side ${side}: root is a real CHORD spanning z (Δz ${zSpan.toFixed(3)} > 0.2)`);
  let midMax = 0;
  for (let q = 1; q < col.length - 1; q++) {
    const v = new THREE.Vector3(col[q].x, col[q].y, col[q].z);
    let best = Infinity;
    for (const b of bodyVerts) { const d = b.distanceTo(v); if (d < best) best = d; }
    midMax = Math.max(midMax, best);
  }
  assert(midMax < 1e-6, `side ${side}: every MIDDLE root vert is exact-vert welded (max gap ${midMax.toExponential(1)} < 1e-6)`);
  let yMin = Infinity, yMax = -Infinity;
  for (const c of col) { yMin = Math.min(yMin, c.y); yMax = Math.max(yMax, c.y); }
  assert((yMax - yMin) < zSpan + 1e-6, `side ${side}: root edge does not fan in y (Δy ${(yMax - yMin).toFixed(3)} ≤ Δz)`);
}
ok('MIDDLE CONNECTED: the whole root chord is exact-vert welded on a contiguous, non-fanning body arc');

// --- 5. CONNECTION HOLDS IN MOTION --------------------------------------------------
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
rigR.shoulder.rotation.z -= 0.5; rigR.shoulder.rotation.x -= 0.3;
const pairGap = defSeam.distanceTo(defBody);
const restGap = restSeam.distanceTo(restBody);
assert(defSeam.distanceTo(restSeam) < 1e-5, 'seam vertex stays static under the beat');
assert(Math.abs(pairGap - restGap) < 1e-5, `paired body-edge & wing-root verts stay coincident under motion (gap Δ ${Math.abs(pairGap - restGap).toExponential(1)} < 1e-5)`);
rigR.shoulder.rotation.z += 0.5;
model.group.updateMatrixWorld(true); membrane.skeleton.update();
let outboardMax = 0;
for (let i = 0; i < mPos.count; i++) {
  if (mSi.getX(i) === 0 && mSw.getX(i) > 0.99) continue;
  const v0 = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i));
  rigR.shoulder.rotation.z -= 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
  const vR = membrane.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mPos, i));
  rigR.shoulder.rotation.z += 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
  outboardMax = Math.max(outboardMax, v0.distanceTo(vR));
  if (outboardMax > 0.1) break;
}
rigR.shoulder.rotation.z -= 0.5; model.group.updateMatrixWorld(true); membrane.skeleton.update();
assert(outboardMax > 0.05, `the outboard membrane DOES flap with the beat (max Δ ${outboardMax.toFixed(3)} > 0.05)`);
ok('CONNECTION HOLDS IN MOTION: under a beat the membrane root stays welded to the body AND the wing flies');

// --- 7. NO LONGITUDINAL FACET (the "metallic rings" fix, L32) ------------------------
// The smooth loft must turn far more gently ALONG z than the legacy faceted loft.
// Walk the TOP-keel longitudinal line (cross-section column 0 = the apex of nfSection)
// and measure the max turning angle between consecutive segments of that polyline in
// the (z, y) plane. The legacy sweepProfile joins the 13 stations with flat bands →
// big turns; sweepProfileSmooth resamples to many rings → small turns.
function topLineMaxTurn(geo) {
  const lr = geo.userData.loftRings;
  const m = lr ? lr.section : nfSection(1, 1, 1).length;     // legacy has no userData
  const count = lr ? lr.count : geo.attributes.position.count / m;
  const p = geo.attributes.position;
  const pts = [];
  for (let r = 0; r < count; r++) {
    const idx = r * m + 0;                                    // apex column (i=0 → top +y)
    pts.push(new THREE.Vector2(p.getZ(idx), p.getY(idx)));
  }
  let maxA = 0;
  for (let r = 1; r < pts.length - 1; r++) {
    const d0 = pts[r].clone().sub(pts[r - 1]);
    const d1 = pts[r + 1].clone().sub(pts[r]);
    if (d0.lengthSq() < 1e-12 || d1.lengthSq() < 1e-12) continue;
    d0.normalize(); d1.normalize();
    maxA = Math.max(maxA, Math.acos(Math.min(Math.max(d0.dot(d1), -1), 1)) * 180 / Math.PI);
  }
  return maxA;
}
const prof = { ...NIGHTFURY_PROFILE, ring: nfSection };
const facetTurn = topLineMaxTurn(sweepProfile(prof));         // legacy faceted loft
const smoothTurn = topLineMaxTurn(sweepProfileSmooth(prof));  // smooth loft
const smoothGeo = sweepProfileSmooth(prof);
assert(smoothGeo.userData.loftRings.count > NIGHTFURY_PROFILE.stations.length,
  `smooth loft resamples to MORE rings than stations (${smoothGeo.userData.loftRings.count} > ${NIGHTFURY_PROFILE.stations.length})`);
assert(smoothTurn < facetTurn * 0.6,
  `smooth loft turns far more gently along z than the faceted loft (${smoothTurn.toFixed(1)}° vs ${facetTurn.toFixed(1)}°)`);
assert(smoothTurn < 12,
  `smooth loft max longitudinal turn is gentle (${smoothTurn.toFixed(1)}° < 12° → no "metallic rings")`);
ok(`NO LONGITUDINAL FACET: smooth loft top-line turn ${smoothTurn.toFixed(1)}° (faceted ${facetTurn.toFixed(1)}°) — the rings are gone`);

// --- 8. SEAM-NORMAL CONTINUITY (one-surface read) -----------------------------------
// shareSeamNormals() averages the normal at each shared seam vert and writes it into
// BOTH the hull seam vert and the membrane root vert(s) that copy it. So each membrane
// root vert's normal must EQUAL its paired (zero-gap) body vert's normal — no shading
// break across the opaque↔translucent boundary.
const hN = hull.geometry.attributes.normal, mN = membrane.geometry.attributes.normal;
let normMax = 0, checked = 0;
const mn = new THREE.Vector3(), hn = new THREE.Vector3();
for (let i = 0; i < mPos.count; i++) {
  if (!isBodyRoot(mSi, mSw, i)) continue;
  mv.set(mPos.getX(i), mPos.getY(i), mPos.getZ(i));
  // the paired body vert is the zero-gap nearest one.
  let best = Infinity, bj = -1;
  for (let k = 0; k < bodyVerts.length; k++) { const d = bodyVerts[k].distanceTo(mv); if (d < best) { best = d; bj = bodyIdx[k]; } }
  if (bj < 0) continue;
  mn.set(mN.getX(i), mN.getY(i), mN.getZ(i));
  hn.set(hN.getX(bj), hN.getY(bj), hN.getZ(bj));
  normMax = Math.max(normMax, mn.distanceTo(hn));
  checked++;
}
assert(checked > 0, 'found membrane root verts to compare normals against the hull');
assert(normMax < 1e-4, `SEAM-NORMAL CONTINUITY: paired hull/membrane seam normals match (max Δ ${normMax.toExponential(1)} < 1e-4)`);
ok(`SEAM-NORMAL CONTINUITY: all ${checked} membrane root verts share their body vert's normal (one-surface read, no crease)`);

// --- 6. coexistence: obsidian2 (organism) + azure unchanged, no nightFury mesh ------
function buildCounts(key, tier) {
  const m = buildDragonModel(ascendedDef(DRAGONS[key], tier, 0), { detail: 'high' });
  let nightFury = false, tris = 0;
  m.group.traverse((o) => {
    if (o.name === 'nightFuryHull' || o.name === 'nightFuryMembrane' || o.name === 'nightFuryFingers') nightFury = true;
    if (o.isMesh && o.geometry) { const g = o.geometry; tris += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3; }
  });
  return { nightFury, tris: Math.round(tris) };
}
const o2 = buildCounts('obsidian2', 3);
assert(!o2.nightFury, 'obsidian2 (organism) carries NO nightFury mesh (coexist)');
assertEq(o2.tris, 4122, 'obsidian2 Eternal tri count unchanged (== baseline 4122)');
const az = buildCounts('azure', 1);
assert(!az.nightFury, 'azure has NO nightFury mesh (coexist)');
assertEq(az.tris, 2602, 'azure (Kindled) tri count unchanged (== baseline 2602)');
ok('coexistence: obsidian2 and azure build no nightFury mesh, tri counts byte-identical');

setActiveDetail('high');
console.log(`\n${n} night-fury checks passed.`);
