// In-engine auto-rig for asset-backed (GLB) dragons — converts a loaded STATIC
// mesh into a SkinnedMesh bound to a procedurally-placed skeleton, so the SHIPPED
// procedural flight animation (dragonWingFlap's shoulder→elbow→wrist cascade +
// dragon.js's spine whip / tailWhip rudder / head-look) drives an AI-generated
// mesh with zero new animation code. This replaces the rigid shader-hinge flap
// (dragonGlb.js attachBodyDeform) for dragons that opt in via
// `def.glb.rigMode: 'skinned'`.
//
// THE FRAME RULE (everything hangs on it): the caller bakes the placement
// transform (def.glb scale/rot/offset, already applied to `content` by
// applyGlbTransform) INTO the geometry once, so the mesh lives in the exact
// frame every procedural dragon uses — head −Z, tail +Z, up +Y, wingspan ±X,
// game units. Bones then rest with IDENTITY rotations, which is what gives
// flapWing's rotation.z/x/y writes the same meaning they have on procedural
// rigs (bones "created with identity orientation, only translated" — the
// mirror-sign law of dragonWingFlap depends on it).
//
// THE ORDER RULE: skeleton topology is built synchronously (dragon.js captures
// parts.* ONCE at createDragon and never re-reads — the stable-references
// invariant), then bone POSITIONS are refined from the measured geometry when
// the GLB resolves, then weights are computed, then meshes are bound. Rotations
// are never pre-posed; positions are never written after bind.
//
// Weighting reuses the two proven recipes:
//  - wings: the skinnedMembrane spanSkin bands (dragonWings.js) — a welded
//    root band (body anchor → shoulder) then smooth-stepped shoulder/elbow/
//    wrist spans, so the wing GROWS from the body instead of pivoting off it.
//  - body: the L36/L37 z-band chain — a rigid single-slot chest band that must
//    CONTAIN the wing-root chord (measured, then enforced), blending fore into
//    neck→head and aft into hip→tail bones.
// Wing verts are gated by BOTH |x| and a spine-z window: a coiled tail also
// swings wide in x, and an |x|-only mask flaps it (the thundercoil shader-path
// bug, locked by tests/glbrig.mjs).

import * as THREE from 'three';

// Bone index map — the skinIndex space. Wing chains first (mirrors the 7-bone
// organism convention), then the fore/aft spine chains appended L36-style.
export const BONE = {
  ROOT: 0,
  SHOULDER_L: 1, ELBOW_L: 2, WRIST_L: 3,
  SHOULDER_R: 4, ELBOW_R: 5, WRIST_R: 6,
  NECK: 7, HEAD: 8, HIP: 9,
  TAIL0: 10,           // tail bones run TAIL0..TAIL0+tailN-1
};

export const DEFAULT_RIG = {
  // All in GAME units (post-bake frame). Every field optional: unset fields
  // are derived from the measured mesh in refineSkeletonFromGeometry.
  shoulderX: null,       // wing-root |x| (also the wing-gate threshold); default 0.18·halfSpan
  elbowT: 0.45,          // elbow position as a fraction of measured half-span
  wristT: 0.70,          // wrist position as a fraction of measured half-span
  band: 0.12,            // smoothstep blend half-width, fraction of half-span
  wingZ: null,           // [zMin,zMax] spine-window that contains the wings; default from bbox
  chestZ: null,          // rigid anchor band; default = measured wing-root chord + margin
  neckZ: null, headZ: null, hipZ: null,   // spine control z's; defaults from bbox
  tailN: 4,              // tail chain length
  flapProfile: null,     // per-creature flap character (falls through to model.flapProfile)
};

const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

// Measured default for the wing z-window (see refineSkeletonFromGeometry):
// cluster the z's of wide-|x| verts, keep the cluster holding the widest vert.
function measureWingWindow(geoms, halfSpanRaw, length) {
  const wideAx = halfSpanRaw * 0.45;
  const zs = [];
  let widestAx = 0, widestZ = 0;
  for (const g of geoms) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(p.getX(i));
      if (ax <= wideAx) continue;
      const z = p.getZ(i);
      zs.push(z);
      if (ax > widestAx) { widestAx = ax; widestZ = z; }
    }
  }
  if (!zs.length) return [-length * 0.25, length * 0.25];   // no wings — inert window
  zs.sort((a, b) => a - b);
  const gap = Math.max(length * 0.08, 1e-3);
  let lo = zs[0], hi = zs[0], bestLo = zs[0], bestHi = zs[0];
  for (let i = 1; i <= zs.length; i++) {
    if (i < zs.length && zs[i] - zs[i - 1] <= gap) { hi = zs[i]; continue; }
    if (widestZ >= lo - 1e-9 && widestZ <= hi + 1e-9) { bestLo = lo; bestHi = hi; }
    if (i < zs.length) { lo = zs[i]; hi = zs[i]; }
  }
  const margin = length * 0.02;
  return [bestLo - margin, bestHi + margin];
}

function bone(name, x, y, z) {
  const b = new THREE.Bone();
  b.name = name;
  b.position.set(x, y, z);
  return b;
}

// Build the full bone graph synchronously from config. Topology is fixed
// forever after; positions are placeholders until refineSkeletonFromGeometry.
// Returns the frozen-contract shapes dragon.js/preview capture at build time.
export function buildGlbSkeleton(cfg = {}, model = {}) {
  const rig = { ...DEFAULT_RIG, ...(cfg.rig || {}) };
  const sx = rig.shoulderX ?? 0.3;
  const profile = rig.flapProfile ?? model.flapProfile ?? null;

  const root = bone('glbChest', 0, 0, 0);
  const mkWing = (side, tag) => {
    const shoulder = bone(`glbShoulder${tag}`, side * sx, 0, 0);
    const elbow = bone(`glbElbow${tag}`, side * sx, 0, 0);
    const wrist = bone(`glbWrist${tag}`, side * sx * 0.6, 0, 0);
    root.add(shoulder); shoulder.add(elbow); elbow.add(wrist);
    return { shoulder, elbow, wrist, side, profile };
  };
  const wingRigL = mkWing(-1, 'L');
  const wingRigR = mkWing(1, 'R');

  const neck = bone('glbNeck', 0, 0, -0.8);
  const headBone = bone('glbHead', 0, 0, -0.5);
  neck.userData.role = 'neck';
  root.add(neck); neck.add(headBone);
  // NO role:'head' bone in spineSegs — parts.head is rotated unconditionally by
  // dragon.js (head-look); a second writer on the same bone would damp-fight it.

  const hip = bone('glbHip', 0, 0, 0.6);
  hip.userData.role = 'hip';
  root.add(hip);
  const tailSegs = [];
  let parent = hip;
  const tailN = Math.max(1, rig.tailN | 0);
  for (let i = 0; i < tailN; i++) {
    const t = bone(`glbTail${i}`, 0, 0, 0.4);
    parent.add(t); tailSegs.push(t); parent = t;
  }

  const allBones = [
    root,
    wingRigL.shoulder, wingRigL.elbow, wingRigL.wrist,
    wingRigR.shoulder, wingRigR.elbow, wingRigR.wrist,
    neck, headBone, hip, ...tailSegs,
  ];
  return {
    root, wingRigL, wingRigR,
    spineSegs: [neck, hip],
    tailSegs, headBone, allBones,
    rig,                    // effective config (pre-measurement)
    analysis: null,         // set by refineSkeletonFromGeometry
    bound: false,
  };
}

// Measure the BAKED geometry (game frame) and refine bone rest POSITIONS —
// never rotations, never after bind. Fills skel.analysis with the numbers the
// weight pass + the headless gates read. `geoms` = BufferGeometry[].
export function refineSkeletonFromGeometry(skel, geoms, cfg = {}) {
  if (skel.bound) throw new Error('dragonGlbRig: refine after bind');
  const rig = skel.rig;

  // ── pass 1: overall extents ────────────────────────────────────────────────
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity,
    minZ = Infinity, maxZ = -Infinity, total = 0;
  for (const g of geoms) {
    const p = g.attributes.position;
    total += p.count;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  if (!total) throw new Error('dragonGlbRig: no vertices to rig');
  const halfSpanRaw = Math.max(Math.abs(minX), Math.abs(maxX));

  // ── effective gates (config wins; measurement fills the gaps) ─────────────
  // Default wing z-window: find where the WIDE verts actually live. Wide-x
  // verts are either wings or a coiled tail; the two form separate z-clusters
  // (that separation is the whole reason the window exists), so gap-split the
  // sorted z list and keep the cluster containing the globally widest vert —
  // that one is the wing band by definition (a tail never out-spans the wings).
  const wingZ = rig.wingZ ?? measureWingWindow(geoms, halfSpanRaw, maxZ - minZ);
  const shoulderX = rig.shoulderX ?? halfSpanRaw * 0.18;
  const rootStart = shoulderX * 0.55;                 // welded root band start

  // ── pass 2: wing stats inside the gate ────────────────────────────────────
  // The wing-root chord (→ the rigid chest band) is measured from verts JUST
  // OUTBOARD of the shoulder — unambiguously wing — then taken as their z
  // 5th–95th percentile. Near-root verts are useless for this on a thick-bodied
  // mesh: the body FLANK sits at similar |x| along the whole length, so a
  // near-root chord smears nose-to-hip and the chest band swallows the neck
  // (measured on thundercoil — the neckHead partition collapsed to zero).
  let halfSpan = 0;
  const chordZs = [];
  const chordBandLo = shoulderX * 1.3;
  const chordBandHi = chordBandLo + halfSpanRaw * 0.15;
  for (const g of geoms) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i);
      if (z < wingZ[0] || z > wingZ[1]) continue;
      const ax = Math.abs(p.getX(i));
      if (ax <= rootStart) continue;
      if (ax > halfSpan) halfSpan = ax;
      if (ax >= chordBandLo && ax <= chordBandHi) chordZs.push(z);
    }
  }
  if (!(halfSpan > 0)) halfSpan = halfSpanRaw;
  let chordLo, chordHi;
  if (chordZs.length) {
    chordZs.sort((a, b) => a - b);
    chordLo = chordZs[Math.floor(chordZs.length * 0.05)];
    chordHi = chordZs[Math.min(chordZs.length - 1, Math.floor(chordZs.length * 0.95))];
  } else { chordLo = wingZ[0]; chordHi = wingZ[1]; }

  // ── chest band: MUST contain the measured wing-root chord (L37) ───────────
  const margin = (maxZ - minZ) * 0.04;
  let chestZ = rig.chestZ ? [...rig.chestZ] : [chordLo - margin, chordHi + margin];
  let chestExpanded = false;
  if (chestZ[0] > chordLo - 1e-6) { chestZ[0] = chordLo - margin; chestExpanded = true; }
  if (chestZ[1] < chordHi + 1e-6) { chestZ[1] = chordHi + margin; chestExpanded = true; }
  if (chestExpanded && rig.chestZ) {
    console.warn('[dragonGlbRig] chestZ expanded to contain the measured wing-root chord',
      { given: rig.chestZ, chord: [chordLo, chordHi], used: chestZ });
  }

  // ── spine control z's ──────────────────────────────────────────────────────
  const neckZ = rig.neckZ ?? chestZ[0] + (minZ - chestZ[0]) * 0.45;
  const headZ = rig.headZ ?? chestZ[0] + (minZ - chestZ[0]) * 0.8;
  const hipZ = rig.hipZ ?? chestZ[1] + (maxZ - chestZ[1]) * 0.3;
  const tailEndZ = chestZ[1] + (maxZ - chestZ[1]) * 0.95;

  // ── sampled anchors: mean y (and z for wing joints) near each control ─────
  const bandW = Math.max(rig.band * halfSpan, halfSpan * 0.08);
  const meanNear = (predicate) => {
    let sy = 0, sz = 0, n = 0;
    for (const g of geoms) {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        if (!predicate(x, y, z)) continue;
        sy += y; sz += z; n++;
      }
    }
    return n ? { y: sy / n, z: sz / n, n } : null;
  };
  const chest = meanNear((x, y, z) => Math.abs(x) < shoulderX && z >= chestZ[0] && z <= chestZ[1]);
  const chestY = chest ? chest.y : (minY + maxY) / 2;
  const wingAt = (tx) => meanNear((x, y, z) =>
    z >= wingZ[0] && z <= wingZ[1] && Math.abs(Math.abs(x) - tx) <= bandW)
    ?? { y: chestY, z: (wingZ[0] + wingZ[1]) / 2 };
  const spineAt = (tz) => {
    const w = (maxZ - minZ) * 0.06;
    const s = meanNear((x, y, z) => Math.abs(x) < shoulderX && Math.abs(z - tz) <= w);
    return s ? s.y : chestY;
  };

  const elbowX = rig.elbowT * halfSpan;
  const wristX = rig.wristT * halfSpan;
  const sSample = wingAt(shoulderX), eSample = wingAt(elbowX), wSample = wingAt(wristX);

  // ── write bone rest POSITIONS (local = worldTarget − parentWorldTarget) ───
  const rootP = new THREE.Vector3(0, chestY, (chestZ[0] + chestZ[1]) / 2);
  skel.root.position.copy(rootP);
  const place = (b, wx, wy, wz, parentP) => {
    b.position.set(wx - parentP.x, wy - parentP.y, wz - parentP.z);
    return new THREE.Vector3(wx, wy, wz);
  };
  for (const side of [-1, 1]) {
    const wr = side < 0 ? skel.wingRigL : skel.wingRigR;
    let p = place(wr.shoulder, side * shoulderX, sSample.y, sSample.z, rootP);
    p = place(wr.elbow, side * elbowX, eSample.y, eSample.z, p);
    place(wr.wrist, side * wristX, wSample.y, wSample.z, p);
  }
  let p = place(skel.spineSegs[0], 0, spineAt(neckZ), neckZ, rootP);        // neck
  place(skel.headBone, 0, spineAt(headZ), headZ, p);
  p = place(skel.spineSegs[1], 0, spineAt(hipZ), hipZ, rootP);               // hip
  const tailN = skel.tailSegs.length;
  for (let i = 0; i < tailN; i++) {
    const tz = hipZ + ((i + 1) / tailN) * (tailEndZ - hipZ);
    p = place(skel.tailSegs[i], 0, spineAt(tz), tz, p);
  }

  skel.analysis = {
    halfSpan, shoulderX, rootStart, elbowX, wristX, band: bandW,
    wingZ, chestZ, chestExpanded, wingRootChordZ: [chordLo, chordHi],
    neckZ, headZ, hipZ, tailEndZ, chestY,
    spineMinZ: minZ, spineMaxZ: maxZ, vertCount: total,
  };
  return skel.analysis;
}

// One-time weight pass over a baked geometry. Writes skinIndex/skinWeight
// (4-wide, two active slots) and returns partition stats for the gates.
export function computeGlbWeights(geo, skel, analysis = skel.analysis) {
  if (!analysis) throw new Error('dragonGlbRig: computeGlbWeights before refineSkeletonFromGeometry');
  const { shoulderX, rootStart, elbowX, wristX, band, wingZ, chestZ,
    neckZ, headZ, hipZ, tailEndZ } = analysis;
  const pos = geo.attributes.position;
  const si = new Uint16Array(pos.count * 4);
  const sw = new Float32Array(pos.count * 4);
  const stats = { wingL: 0, wingR: 0, chest: 0, neckHead: 0, hipTail: 0, total: pos.count };

  const tailN = skel.tailSegs.length;
  // Aft control chain: [z, boneIndex] ascending in z. Fore chain descends.
  const aft = [[chestZ[1], BONE.ROOT], [hipZ, BONE.HIP]];
  for (let i = 0; i < tailN; i++) {
    aft.push([hipZ + ((i + 1) / tailN) * (tailEndZ - hipZ), BONE.TAIL0 + i]);
  }
  // fore chain: the coordinate DESCENDS toward the head, so walk it on −z.
  const fore = [[-chestZ[0], BONE.ROOT], [-neckZ, BONE.NECK], [-headZ, BONE.HEAD]];

  const write = (i, a, b, t) => {
    // Two active slots — collapse to single-slot when both controls are the
    // same bone (the L37 gotcha: a [1−t, t] pair on one bone index breaks the
    // "slot-weight === 1" rigid-band invariant even though it sums to 1).
    const o = i * 4;
    if (a === b || t <= 0) { si[o] = a; sw[o] = 1; }
    else if (t >= 1) { si[o] = b; sw[o] = 1; }
    else { si[o] = a; si[o + 1] = b; sw[o] = 1 - t; sw[o + 1] = t; }
  };
  // Walk a control chain [coord ascending] and blend between the bracket pair.
  const chainWeight = (i, controls, c) => {
    if (c <= controls[0][0]) { write(i, controls[0][1], controls[0][1], 0); return; }
    for (let k = 0; k < controls.length - 1; k++) {
      const [c0, b0] = controls[k], [c1, b1] = controls[k + 1];
      if (c <= c1) { write(i, b0, b1, sstep((c - c0) / (c1 - c0))); return; }
    }
    const last = controls[controls.length - 1][1];
    write(i, last, last, 0);
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const ax = Math.abs(x);
    const isWing = ax > rootStart && z >= wingZ[0] && z <= wingZ[1];
    if (isWing) {
      const [S, E, W] = x < 0
        ? [BONE.SHOULDER_L, BONE.ELBOW_L, BONE.WRIST_L]
        : [BONE.SHOULDER_R, BONE.ELBOW_R, BONE.WRIST_R];
      if (x < 0) stats.wingL++; else stats.wingR++;
      const b = band;
      if (ax < shoulderX) write(i, BONE.ROOT, S, sstep((ax - rootStart) / (shoulderX - rootStart)));
      else if (ax <= elbowX - b) write(i, S, S, 0);
      else if (ax < elbowX + b) write(i, S, E, sstep((ax - (elbowX - b)) / (2 * b)));
      else if (ax <= wristX - b) write(i, E, E, 0);
      else if (ax < wristX + b) write(i, E, W, sstep((ax - (wristX - b)) / (2 * b)));
      else write(i, W, W, 0);
    } else if (z >= chestZ[0] && z <= chestZ[1]) {
      stats.chest++;
      write(i, BONE.ROOT, BONE.ROOT, 0);       // rigid anchor band, single slot
    } else if (z < chestZ[0]) {
      stats.neckHead++;
      chainWeight(i, fore, -z);
    } else {
      stats.hipTail++;
      chainWeight(i, aft, z);
    }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return stats;
}

// Mesh → SkinnedMesh in place: same geometry + material, same parent slot.
// Binding happens later (rigGlbContent) once the whole subtree shares a frame.
export function skinGlbMesh(mesh) {
  const sm = new THREE.SkinnedMesh(mesh.geometry, mesh.material);
  sm.name = mesh.name;
  sm.frustumCulled = false;              // bones move verts; the static bounds lie
  sm.castShadow = mesh.castShadow; sm.receiveShadow = mesh.receiveShadow;
  const parent = mesh.parent;
  if (parent) {
    const idx = parent.children.indexOf(mesh);
    parent.children[idx] = sm;
    sm.parent = parent;
    mesh.parent = null;
  }
  return sm;
}

// Orchestrator. `content` must ALREADY carry the placement transform
// (applyGlbTransform) and already be parented under the same ancestor as
// skel.root (the model group), so bind-time world matrices agree.
// bake placement → refine skeleton → weights → convert+bind. Returns stats.
export function rigGlbContent(content, skel, cfg = {}) {
  // ── bake: geometry into the model-group frame; node transforms to identity ─
  // Refresh from the PARENT (the model group): it may carry model.scale and a
  // stale matrixWorld while the dragon is still detached from the scene.
  (content.parent || content).updateMatrixWorld(true);
  const meshes = [];
  content.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); });
  if (!meshes.length) throw new Error('dragonGlbRig: no meshes in GLB content');
  // Express each mesh's verts in the frame of content's PARENT (the model group,
  // which also owns skel.root). With no parent yet, matrixWorld is already
  // group-relative (it will be added at identity).
  const groupInv = content.parent
    ? new THREE.Matrix4().copy(content.parent.matrixWorld).invert()
    : new THREE.Matrix4();
  const bakeM = new THREE.Matrix4();
  for (const m of meshes) {
    // gltf.scene.clone(true) SHARES geometry with the cached gltf (and with any
    // other clone) — baking in place would corrupt the cache. Clone first.
    m.geometry = m.geometry.clone();
    bakeM.multiplyMatrices(groupInv, m.matrixWorld);
    m.geometry.applyMatrix4(bakeM);
    m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
  }
  // collapse intermediate node transforms too (verts are already baked)
  content.traverse((o) => {
    if (o !== content && !o.isMesh && !o.isBone) { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); }
  });
  content.position.set(0, 0, 0); content.rotation.set(0, 0, 0); content.scale.set(1, 1, 1);

  // ── refine skeleton positions from the baked geometry ─────────────────────
  const geoms = meshes.map((m) => m.geometry);
  const analysis = refineSkeletonFromGeometry(skel, geoms, cfg);

  // ── weights + convert + bind ───────────────────────────────────────────────
  const skeleton = new THREE.Skeleton(skel.allBones);   // inverses from CURRENT rest pose
  const stats = { meshes: meshes.length, analysis, partitions: [] };
  const ancestor = skel.root.parent || skel.root;
  ancestor.updateMatrixWorld(true);
  const skinnedMeshes = [];
  for (const m of meshes) {
    stats.partitions.push(computeGlbWeights(m.geometry, skel, analysis));
    const sm = skinGlbMesh(m);
    sm.updateMatrixWorld(true);
    sm.bind(skeleton);                                   // bindMatrix = current matrixWorld
    skinnedMeshes.push(sm);
  }
  skel.bound = true;
  stats.skinnedMeshes = skinnedMeshes;
  return stats;
}

