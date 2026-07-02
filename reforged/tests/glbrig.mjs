// Headless gates for the GLB auto-rig (dragonGlbRig.js) — the skinned path that
// lets the shipped procedural flight animation drive an AI-generated mesh.
// Proves, with numbers (the L36/L39c discipline):
//   1. weight PARTITION invariants on a synthetic dragon-shaped fixture that
//      includes a deliberately COILED WIDE-X TAIL — the thundercoil shader-path
//      bug (an |x|-only wing mask flapping the tail) must stay dead;
//   2. the L37 rigid-band law: chest verts are SINGLE-slot on the root bone;
//   3. MOTION probes on the bound SkinnedMesh: shoulder rotation moves the
//      wingtip, freezes the chest + coiled tail; L/R mirror symmetry;
//   4. the ORDER rule: weights before refine throws; refine after bind throws.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert } from './shim.mjs';

const THREE = await import('three');
const { buildGlbSkeleton, refineSkeletonFromGeometry, computeGlbWeights, rigGlbContent, BONE } =
  await import('../js/dragonGlbRig.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// ── synthetic fixture: body strip + spread wings + a COILED wide-x tail ───────
// Frame = game frame (head −Z, tail +Z, wingspan ±X). Non-indexed point cloud
// is enough — the rig only reads `position` and skinning is per-vertex.
function fixtureGeometry() {
  const verts = [];
  const push = (x, y, z) => verts.push(x, y, z);
  // body: nose (z=-2.2) → chest → hip (z=+1.2), a narrow tube |x|<=0.22
  for (let z = -2.2; z <= 1.2; z += 0.1) {
    for (const x of [-0.22, 0, 0.22]) for (const y of [0.1, 0.35]) push(x, y, z);
  }
  // wings: slabs |x| in 0.28..2.4 across chord z in [-0.5, 0.4]
  for (let x = 0.28; x <= 2.4; x += 0.08) {
    for (let z = -0.5; z <= 0.4; z += 0.15) { push(x, 0.3, z); push(-x, 0.3, z); }
  }
  // tail: runs aft z 1.2 → 2.6 and COILS sideways out to |x| ≈ 1.5 —
  // wide in x like a wing, but far outside the wing z-window.
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const z = 1.2 + t * 1.4;
    const x = Math.sin(t * Math.PI) * 1.5;      // the coil
    push(x, 0.25, z); push(x, 0.4, z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

const RIG_CFG = {
  rig: {
    shoulderX: 0.3, elbowT: 0.45, wristT: 0.7, band: 0.1,
    wingZ: [-0.55, 0.45], chestZ: [-0.6, 0.5], tailN: 4,
  },
};

// ── build + rig, exactly the way dragonGlb.js will drive it ──────────────────
const group = new THREE.Group();                 // the model group (owns bones + content)
const skel = buildGlbSkeleton(RIG_CFG, {});
group.add(skel.root);
const content = new THREE.Group();               // the "GLB scene", placement pre-applied
const mesh = new THREE.Mesh(fixtureGeometry(), new THREE.MeshStandardMaterial());
content.add(mesh);
group.add(content);

// order rule: weights before refine must throw
let threw = false;
try { computeGlbWeights(mesh.geometry, skel, null); } catch { threw = true; }
assert(threw, 'computeGlbWeights before refine throws');
ok('order rule: weights before refine throws');

const stats = rigGlbContent(content, skel, RIG_CFG);
const sm = stats.skinnedMeshes[0];
assert(sm && sm.isSkinnedMesh, 'mesh converted to SkinnedMesh');
assert(sm.skeleton.bones.length === skel.allBones.length, 'skeleton bone count matches');
assert(skel.tailSegs.length === 4 && skel.tailSegs.every((b) => b.isBone), 'tailSegs are 4 Bones');
assert(skel.spineSegs.length === 2 && skel.spineSegs[0].userData.role === 'neck'
  && skel.spineSegs[1].userData.role === 'hip', 'spineSegs roles neck/hip');
assert(skel.wingRigL.shoulder.isBone && skel.wingRigR.wrist.isBone, 'wing rig handles are Bones');
ok('rigGlbContent converts + binds with the contract shapes');

// refine after bind must throw
threw = false;
try { refineSkeletonFromGeometry(skel, [sm.geometry], RIG_CFG); } catch { threw = true; }
assert(threw, 'refine after bind throws');
ok('order rule: refine after bind throws');

// ── partition invariants ──────────────────────────────────────────────────────
const pos = sm.geometry.attributes.position;
const si = sm.geometry.attributes.skinIndex;
const sw = sm.geometry.attributes.skinWeight;
const a = skel.analysis;
const WING_BONES = new Set([BONE.SHOULDER_L, BONE.ELBOW_L, BONE.WRIST_L,
  BONE.SHOULDER_R, BONE.ELBOW_R, BONE.WRIST_R]);
let maxSumErr = 0, chestBad = 0, coilBad = 0, tipBad = 0;
let tipVert = -1, chestVert = -1, coilVert = -1, tipX = 0;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i), ax = Math.abs(x);
  const w = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
  const idx = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
  maxSumErr = Math.max(maxSumErr, Math.abs(w[0] + w[1] + w[2] + w[3] - 1));
  const isWingGate = ax > a.rootStart && z >= a.wingZ[0] && z <= a.wingZ[1];
  // chest band body verts: single slot on ROOT
  if (!isWingGate && z >= a.chestZ[0] && z <= a.chestZ[1]) {
    if (!(idx[0] === BONE.ROOT && w[0] === 1 && w[1] === 0)) chestBad++;
    if (chestVert < 0 && ax < 0.25) chestVert = i;
  }
  // coiled tail verts (aft of the wing window, wide x): ZERO wing-bone weight
  if (z > a.wingZ[1] + 0.2 && ax > 0.8) {
    for (let k = 0; k < 4; k++) if (w[k] > 0 && WING_BONES.has(idx[k])) coilBad++;
    if (coilVert < 0) coilVert = i;
  }
  // outermost wing verts: DOMINANT wrist (capsule weights blend a little
  // elbow near the band — that gradient is the point of v2)
  if (isWingGate && ax > a.wristX + a.band) {
    const W = x < 0 ? BONE.WRIST_L : BONE.WRIST_R;
    if (!(idx[0] === W && w[0] > 0.5)) tipBad++;
    if (x > tipX) { tipX = x; tipVert = i; }
  }
}
assert(maxSumErr < 1e-5, `weights sum to 1 (max err ${maxSumErr})`);
ok(`weights sum to 1 everywhere (max err ${maxSumErr.toExponential(1)})`);
assert(chestBad === 0, `chest band single-slot on root (${chestBad} bad)`);
ok('chest band verts are single-slot on the root bone (L37 law)');
assert(coilBad === 0, `coiled tail has zero wing weight (${coilBad} bad)`);
ok('coiled wide-x tail verts carry ZERO wing weight (thundercoil bug locked)');
assert(tipBad === 0, `outer wing verts dominant-wrist (${tipBad} bad)`);
ok('outer wing verts are dominated by the wrist bone');
assert(a.chestZ[0] <= a.wingRootChordZ[0] && a.chestZ[1] >= a.wingRootChordZ[1],
  'chest band contains the measured wing-root chord');
ok('chest band contains the measured wing-root chord (L37 measured, not guessed)');

// partition sanity: every class non-empty on the fixture
const p = stats.partitions[0];
assert(p.wingL > 0 && p.wingR > 0 && p.chest > 0 && p.neckHead > 0 && p.hipTail > 0,
  `all partitions populated ${JSON.stringify(p)}`);
ok(`partition: wingL ${p.wingL} / wingR ${p.wingR} / chest ${p.chest} / fore ${p.neckHead} / aft ${p.hipTail}`);

// ── motion probes (L36: prove it with a number) ───────────────────────────────
const restOf = (i) => new THREE.Vector3().fromBufferAttribute(pos, i);
const skinnedPos = (i) => sm.applyBoneTransform(i, restOf(i));
const moveOf = (i) => skinnedPos(i).distanceTo(restOf(i));

// rest pose: identity — nothing moves
group.updateMatrixWorld(true);
assert(moveOf(tipVert) < 1e-6 && moveOf(chestVert) < 1e-6, 'rest pose is identity');
ok('rest pose: skinning is identity');

// flap the left+right shoulders — the mirror beat
skel.wingRigL.shoulder.rotation.z = 0.4;
skel.wingRigR.shoulder.rotation.z = -0.4;   // mirror sign (rotation.z is −side·flap)
group.updateMatrixWorld(true);
const tipMove = moveOf(tipVert);
assert(tipMove > 0.1, `wingtip moves on shoulder flap (${tipMove.toFixed(3)})`);
assert(moveOf(chestVert) < 1e-4, 'chest vert frozen during flap');
assert(moveOf(coilVert) < 1e-4, 'coiled tail vert frozen during flap');
ok(`motion probe: tip moves ${tipMove.toFixed(3)}, chest 0, coiled tail 0`);

// L/R mirror symmetry: find the mirrored tip vert and compare
let tipVertL = -1;
for (let i = 0; i < pos.count; i++) {
  if (Math.abs(pos.getX(i) + pos.getX(tipVert)) < 1e-6
    && Math.abs(pos.getZ(i) - pos.getZ(tipVert)) < 1e-6
    && Math.abs(pos.getY(i) - pos.getY(tipVert)) < 1e-6) { tipVertL = i; break; }
}
assert(tipVertL >= 0, 'mirrored tip vert exists');
const pr = skinnedPos(tipVert), pl = skinnedPos(tipVertL);
assert(Math.abs(pr.x + pl.x) < 1e-5 && Math.abs(pr.y - pl.y) < 1e-5 && Math.abs(pr.z - pl.z) < 1e-5,
  `L/R flap mirrors (R ${pr.x.toFixed(3)},${pr.y.toFixed(3)} vs L ${pl.x.toFixed(3)},${pl.y.toFixed(3)})`);
ok('L/R mirror-sign flap produces mirrored wingtips');

// tail chain: rotation-only drive moves the tip, not the chest (the tailWhip path)
skel.wingRigL.shoulder.rotation.z = 0; skel.wingRigR.shoulder.rotation.z = 0;
for (const t of skel.tailSegs) t.rotation.y = 0.35;
group.updateMatrixWorld(true);
let tailTip = -1, tailTipZ = -Infinity;
for (let i = 0; i < pos.count; i++) if (pos.getZ(i) > tailTipZ) { tailTipZ = pos.getZ(i); tailTip = i; }
const tailMove = moveOf(tailTip);
assert(tailMove > 0.1, `tail tip moves on chain rotation (${tailMove.toFixed(3)})`);
assert(moveOf(chestVert) < 1e-4, 'chest frozen during tail whip');
ok(`tail-chain probe: tip moves ${tailMove.toFixed(3)}, chest 0`);

// ── auto-measured defaults: a bare cfg still rigs the fixture ────────────────
const group2 = new THREE.Group();
const skel2 = buildGlbSkeleton({}, {});
group2.add(skel2.root);
const content2 = new THREE.Group();
content2.add(new THREE.Mesh(fixtureGeometry(), new THREE.MeshStandardMaterial()));
group2.add(content2);
const stats2 = rigGlbContent(content2, skel2, {});
const p2 = stats2.partitions[0];
assert(p2.wingL > 0 && p2.wingR > 0 && p2.chest > 0, 'default-config rig partitions populated');
assert(skel2.analysis.chestZ[0] <= skel2.analysis.wingRootChordZ[0]
  && skel2.analysis.chestZ[1] >= skel2.analysis.wingRootChordZ[1],
  'default-config chest band contains the measured chord');
ok('auto-measured defaults rig the fixture with no config');

// ── placement bake: a rotated/scaled content ends up in the group frame ──────
const group3 = new THREE.Group();
const skel3 = buildGlbSkeleton(RIG_CFG, {});
group3.add(skel3.root);
const content3 = new THREE.Group();
const mesh3 = new THREE.Mesh(fixtureGeometry(), new THREE.MeshStandardMaterial());
content3.add(mesh3);
// pretend the native mesh stood vertical and double size (thundercoil-style)
content3.rotation.x = -Math.PI / 2;
content3.scale.setScalar(2);
// pre-rotate the fixture geometry so that after the placement it lands back in
// the game frame: apply the INVERSE placement (P = R(−π/2)·S(2) ⇒ P⁻¹ = S(½)·R(π/2)).
mesh3.geometry.applyMatrix4(new THREE.Matrix4()
  .makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5)));
group3.add(content3);
rigGlbContent(content3, skel3, RIG_CFG);
const bb = mesh3.geometry.boundingBox ?? (mesh3.geometry.computeBoundingBox(), mesh3.geometry.boundingBox);
assert(Math.abs(bb.min.z - (-2.2)) < 0.01 && Math.abs(bb.max.z - 2.6) < 0.01,
  `bake restores the game frame (z ${bb.min.z.toFixed(2)}..${bb.max.z.toFixed(2)})`);
assert(content3.scale.x === 1 && content3.rotation.x === 0, 'content transform collapsed to identity');
ok('placement bake: rotated/scaled content lands in the game frame, transforms collapsed');

// ── stretch gate: the anti-smudge metric on an INDEXED membrane fixture ──────
// v1's hard weight bands SHEARED the membrane at classification boundaries
// (the verdant smudge). Gate: pose the shoulders at a hard flap extreme and
// assert no edge stretches beyond 1.6× its rest length — smooth weights keep
// neighbours moving together BY CONSTRUCTION.
function membraneFixture() {
  const verts = [], index = [];
  const cols = 15, rows = 7;                      // per-side wing grid
  const gx = (c) => 0.24 + (c / (cols - 1)) * 2.16;   // x 0.24..2.4
  const gz = (r) => -0.5 + (r / (rows - 1)) * 0.9;    // z -0.5..0.4
  for (const side of [1, -1]) {
    const base = verts.length / 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      verts.push(side * gx(c), 0.3, gz(r));
    }
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = base + r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      index.push(a, b, d, b, e, d);
    }
  }
  // body strip along z so the chest/fore/aft chains exist
  const bodyBase = verts.length / 3;
  const bn = 30;
  for (let i = 0; i <= bn; i++) {
    const z = -2.2 + (i / bn) * 4.0;
    verts.push(-0.18, 0.25, z, 0.18, 0.25, z);
  }
  for (let i = 0; i < bn; i++) {
    const a = bodyBase + i * 2, b = a + 1, c = a + 2, d = a + 3;
    index.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(index);
  return g;
}
{
  const group4 = new THREE.Group();
  const skel4 = buildGlbSkeleton(RIG_CFG, {});
  group4.add(skel4.root);
  const content4 = new THREE.Group();
  const mesh4 = new THREE.Mesh(membraneFixture(), new THREE.MeshStandardMaterial());
  content4.add(mesh4);
  group4.add(content4);
  const stats4 = rigGlbContent(content4, skel4, RIG_CFG);
  const sm4 = stats4.skinnedMeshes[0];
  // hard flap extreme
  skel4.wingRigL.shoulder.rotation.z = 0.7; skel4.wingRigR.shoulder.rotation.z = -0.7;
  skel4.wingRigL.elbow.rotation.z = 0.3; skel4.wingRigR.elbow.rotation.z = -0.3;
  group4.updateMatrixWorld(true);
  const p4 = sm4.geometry.attributes.position;
  const posed = [];
  for (let i = 0; i < p4.count; i++) {
    posed.push(sm4.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(p4, i)));
  }
  const idx4 = sm4.geometry.index;
  let maxRatio = 0;
  const restA = new THREE.Vector3(), restB = new THREE.Vector3();
  for (let i = 0; i < idx4.count; i += 3) {
    for (const [u, v] of [[0, 1], [1, 2], [0, 2]]) {
      const a = idx4.getX(i + u), b = idx4.getX(i + v);
      restA.fromBufferAttribute(p4, a); restB.fromBufferAttribute(p4, b);
      const rest = restA.distanceTo(restB);
      if (rest < 1e-6) continue;
      const ratio = posed[a].distanceTo(posed[b]) / rest;
      if (ratio > maxRatio) maxRatio = ratio;
    }
  }
  assert(maxRatio < 1.6, `max edge stretch at flap extreme < 1.6 (got ${maxRatio.toFixed(3)})`);
  ok(`stretch gate: max membrane edge stretch ${maxRatio.toFixed(3)} at a hard flap extreme`);
  // smoothing preserved the invariants
  const sw4 = sm4.geometry.attributes.skinWeight;
  let sumErr4 = 0;
  for (let i = 0; i < p4.count; i++) {
    sumErr4 = Math.max(sumErr4, Math.abs(sw4.getX(i) + sw4.getY(i) + sw4.getZ(i) + sw4.getW(i) - 1));
  }
  assert(sumErr4 < 1e-5, 'weights still sum to 1 after smoothing');
  ok('smoothing preserves weight normalization');
}

// ── vision-marked joints override (rig.joints) ───────────────────────────────
{
  const group5 = new THREE.Group();
  const JCFG = {
    rig: {
      tailN: 4,
      joints: {
        shoulder: [0.35, 0.32, -0.1], elbow: [1.1, 0.34, -0.05], wrist: [1.7, 0.36, 0.0],
        tip: [2.4, 0.3, 0.0],
        neck: [0, 0.35, -1.1], head: [0, 0.4, -1.9],
        hip: [0, 0.3, 0.9], tailEnd: [0, 0.32, 2.5],
        chest: [0, 0.3, 0],
        wingZ: [-0.55, 0.45], chestZ: [-0.6, 0.5],
      },
    },
  };
  const skel5 = buildGlbSkeleton(JCFG, {});
  group5.add(skel5.root);
  const content5 = new THREE.Group();
  content5.add(new THREE.Mesh(fixtureGeometry(), new THREE.MeshStandardMaterial()));
  group5.add(content5);
  rigGlbContent(content5, skel5, JCFG);
  const a5 = skel5.analysis;
  assert(a5.joints === true, 'analysis records joints mode');
  assert(Math.abs(a5.shoulderX - 0.35) < 1e-6 && Math.abs(a5.elbowX - 1.1) < 1e-6
    && Math.abs(a5.wristX - 1.7) < 1e-6, 'wing joint x taken from the marks');
  assert(Math.abs(a5.neckZ - (-1.1)) < 1e-6 && Math.abs(a5.hipZ - 0.9) < 1e-6, 'spine z from the marks');
  // placed bone world position matches the mark (right shoulder)
  const shoulderWorld = new THREE.Vector3();
  group5.updateMatrixWorld(true);
  skel5.wingRigR.shoulder.getWorldPosition(shoulderWorld);
  assert(shoulderWorld.distanceTo(new THREE.Vector3(0.35, 0.32, -0.1)) < 1e-5,
    `shoulder bone sits at the mark (${shoulderWorld.x.toFixed(3)},${shoulderWorld.y.toFixed(3)},${shoulderWorld.z.toFixed(3)})`);
  // rest dihedral exported (marks put the wrist a touch above the shoulder)
  assert(typeof skel5.wingRigR.restZ === 'number' && typeof skel5.wingRigL.restZ === 'number'
    && Math.abs(skel5.wingRigR.restZ + skel5.wingRigL.restZ) < 1e-9,
    'restZ exported, mirror-signed');
  ok('rig.joints override places bones at the marks + exports restZ');
}

console.log(`\nglbrig: ${n} checks passed`);
