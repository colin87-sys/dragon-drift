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
// WEIGHTING (v2 — the anti-smudge rework): hard axis-window bands tore the
// membrane (adjacent verts on different bones with no gradient shear during the
// flap — the verdant v1 smudge). v2 weights every vertex by DISTANCE TO BONE
// CAPSULES (each bone owns the segment from its joint to the next joint), keeps
// the top-2, then runs LAPLACIAN SMOOTHING of the weights over the mesh
// adjacency graph so there is no hard seam anywhere BY CONSTRUCTION. Two
// survivors from v1: the wing z-window (now only a MASK keeping tail/leg verts
// off wing capsules — the thundercoil coiled-tail lesson) and the rigid
// single-slot chest band (L37; PINNED through smoothing so the saddle/weld zone
// never softens).
//
// JOINT PLACEMENT: `rig.joints` (explicit 3D positions — normally marked by
// Claude's vision on tools/rigshots.mjs renders) overrides every measurement
// heuristic; without it the L108 measured defaults (wide-|x| z-clustering,
// outboard percentile chord) still apply. The baked wing DIHEDRAL is measured
// from the placed shoulder→wrist vector and exported as wingRig.restZ so
// flapWing oscillates around the mesh's own rest pose (scaled by
// rig.flapCenter: 0 = beat around the baked pose, 1 = around horizontal).

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
  joints: null,          // explicit 3D joint positions (vision-marked) — see refine
  flapCenter: 0.5,       // 0 = flap around the baked dihedral, 1 = around horizontal
  smoothIters: 10,       // Laplacian weight-smoothing passes (0 disables)
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

  // ── effective gates (vision marks win, then config, then measurement) ─────
  // Default wing z-window: find where the WIDE verts actually live. Wide-x
  // verts are either wings or a coiled tail; the two form separate z-clusters
  // (that separation is the whole reason the window exists), so gap-split the
  // sorted z list and keep the cluster containing the globally widest vert —
  // that one is the wing band by definition (a tail never out-spans the wings).
  // `rig.joints` = explicit joint positions marked by vision on the rigshots
  // renders: RIGHT-side wing joints as [x,y,z] (x>0; the left is mirrored),
  // spine joints as [x,y,z] with x ignored. Every field optional.
  const J = rig.joints || null;
  const wingZ = (J && J.wingZ) ?? rig.wingZ ?? measureWingWindow(geoms, halfSpanRaw, maxZ - minZ);
  const shoulderX = (J && J.shoulder) ? Math.abs(J.shoulder[0])
    : (rig.shoulderX ?? halfSpanRaw * 0.18);
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
  if (J && J.tip) halfSpan = Math.max(halfSpan, Math.abs(J.tip[0]));
  let chordLo, chordHi;
  if (chordZs.length) {
    chordZs.sort((a, b) => a - b);
    chordLo = chordZs[Math.floor(chordZs.length * 0.05)];
    chordHi = chordZs[Math.min(chordZs.length - 1, Math.floor(chordZs.length * 0.95))];
  } else { chordLo = wingZ[0]; chordHi = wingZ[1]; }

  // ── chest band ─────────────────────────────────────────────────────────────
  // Heuristic path: MUST contain the measured wing-root chord (L37 — the band
  // anchors the wing↔body junction). Vision-marked path: TRUST the mark — on a
  // swept wing the z-chord spans most of the body and expansion swallows the
  // neck; capsule competition already classifies the root correctly.
  const margin = (maxZ - minZ) * 0.04;
  const chestGiven = (J && J.chestZ) ?? rig.chestZ;
  let chestZ = chestGiven ? [...chestGiven] : [chordLo - margin, chordHi + margin];
  let chestExpanded = false;
  if (!(J && J.chestZ)) {
    if (chestZ[0] > chordLo - 1e-6) { chestZ[0] = chordLo - margin; chestExpanded = true; }
    if (chestZ[1] < chordHi + 1e-6) { chestZ[1] = chordHi + margin; chestExpanded = true; }
    if (chestExpanded && chestGiven) {
      console.warn('[dragonGlbRig] chestZ expanded to contain the measured wing-root chord',
        { given: chestGiven, chord: [chordLo, chordHi], used: chestZ });
    }
  }

  // ── spine control z's ──────────────────────────────────────────────────────
  const neckZ = (J && J.neck) ? J.neck[2] : (rig.neckZ ?? chestZ[0] + (minZ - chestZ[0]) * 0.45);
  const headZ = (J && J.head) ? J.head[2] : (rig.headZ ?? chestZ[0] + (minZ - chestZ[0]) * 0.8);
  const hipZ = (J && J.hip) ? J.hip[2] : (rig.hipZ ?? chestZ[1] + (maxZ - chestZ[1]) * 0.3);
  const tailEndZ = (J && J.tailEnd) ? J.tailEnd[2] : chestZ[1] + (maxZ - chestZ[1]) * 0.95;

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

  const elbowX = (J && J.elbow) ? Math.abs(J.elbow[0]) : rig.elbowT * halfSpan;
  const wristX = (J && J.wrist) ? Math.abs(J.wrist[0]) : rig.wristT * halfSpan;
  const sSample = (J && J.shoulder) ? { y: J.shoulder[1], z: J.shoulder[2] } : wingAt(shoulderX);
  const eSample = (J && J.elbow) ? { y: J.elbow[1], z: J.elbow[2] } : wingAt(elbowX);
  const wSample = (J && J.wrist) ? { y: J.wrist[1], z: J.wrist[2] } : wingAt(wristX);
  const spineYAt = (mark, tz) => (J && mark ? mark[1] : spineAt(tz));

  // ── write bone rest POSITIONS (local = worldTarget − parentWorldTarget) ───
  const rootY = (J && J.chest) ? J.chest[1] : chestY;
  const rootP = new THREE.Vector3(0, rootY, (chestZ[0] + chestZ[1]) / 2);
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
  let p = place(skel.spineSegs[0], 0, spineYAt(J && J.neck, neckZ), neckZ, rootP);   // neck
  place(skel.headBone, 0, spineYAt(J && J.head, headZ), headZ, p);
  p = place(skel.spineSegs[1], 0, spineYAt(J && J.hip, hipZ), hipZ, rootP);          // hip
  const tailN = skel.tailSegs.length;
  const tailEndY = (J && J.tailEnd) ? J.tailEnd[1] : spineAt(tailEndZ);
  const hipY = (J && J.hip) ? J.hip[1] : spineAt(hipZ);
  // J.tail: the tail as a marked POLYLINE (one [x,y,z] per tail bone) — a tail
  // that CURLS sideways must have bones (and capsules) that follow the curl,
  // or the far coil sits closer to the wing capsules than to a straight-line
  // tail axis and steals flap weight (the thundercoil bug, soft edition —
  // measured 0.198 wrist weight on the verdant curled tail tip).
  const tailMarks = (J && Array.isArray(J.tail) && J.tail.length === tailN) ? J.tail : null;
  for (let i = 0; i < tailN; i++) {
    if (tailMarks) {
      const m = tailMarks[i];
      p = place(skel.tailSegs[i], m[0], m[1], m[2], p);
    } else {
      const t = (i + 1) / tailN;
      const tz = hipZ + t * (tailEndZ - hipZ);
      const ty = J ? hipY + t * (tailEndY - hipY) : spineAt(tz);
      p = place(skel.tailSegs[i], 0, ty, tz, p);
    }
  }

  // ── flap rest-center: the baked wing DIHEDRAL, exported per side so
  // flapWing oscillates around the mesh's own rest pose (rig.flapCenter:
  // 0 = beat around the baked pose, 1 = around horizontal). Additive +
  // nullable in flapWing → procedural rigs unchanged.
  const dihedral = Math.atan2(wSample.y - sSample.y, Math.max(1e-4, wristX - shoulderX));
  const center = rig.flapCenter ?? 0.5;
  skel.wingRigR.restZ = -dihedral * center;
  skel.wingRigL.restZ = dihedral * center;

  skel.analysis = {
    halfSpan, shoulderX, rootStart, elbowX, wristX, band: bandW,
    wingZ, chestZ, chestExpanded, wingRootChordZ: [chordLo, chordHi],
    neckZ, headZ, hipZ, tailEndZ, chestY: rootY, dihedral,
    joints: !!J, tipJoint: (J && J.tip) || null, fingerJoints: (J && J.fingers) || null,
    spineMinZ: minZ, spineMaxZ: maxZ, vertCount: total,
  };
  return skel.analysis;
}

// Squared distance from point p to segment a→b (a capsule axis).
function segDistSq(px, py, pz, a, b) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const apx = px - a[0], apy = py - a[1], apz = pz - a[2];
  const len2 = abx * abx + aby * aby + abz * abz;
  let t = len2 > 0 ? (apx * abx + apy * aby + apz * abz) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
  return dx * dx + dy * dy + dz * dz;
}

// Rest world position of a bone in the group frame (rest = pure translations,
// so accumulating local positions up to and including the root IS that frame —
// the same frame the baked geometry lives in).
function jointPos(skel, bone) {
  const v = new THREE.Vector3();
  let b = bone;
  while (b && b !== skel.root) { v.add(b.position); b = b.parent; }
  v.add(skel.root.position);
  return [v.x, v.y, v.z];
}

// Bone capsules: each bone owns the segment from ITS joint to the next joint
// out the chain (rotating a bone swings exactly that segment). `wing` = ±1
// side mask for wing capsules; body capsules are unmasked.
function buildCapsules(skel, analysis) {
  const caps = [];
  const P = (b) => jointPos(skel, b);
  for (const side of [-1, 1]) {
    const wr = side < 0 ? skel.wingRigL : skel.wingRigR;
    const [S, E, W] = side < 0
      ? [BONE.SHOULDER_L, BONE.ELBOW_L, BONE.WRIST_L]
      : [BONE.SHOULDER_R, BONE.ELBOW_R, BONE.WRIST_R];
    const s = P(wr.shoulder), e = P(wr.elbow), w = P(wr.wrist);
    // wrist capsule runs to the wingtip: the vision MARK when given (a bat arm
    // bends at the carpal — the fingers do NOT continue the forearm direction),
    // else extrapolate along the forearm out to the measured half-span.
    let tip;
    if (analysis.tipJoint) {
      const t = analysis.tipJoint;
      tip = [side * Math.abs(t[0]), t[1], t[2]];
    } else {
      const span = Math.max(1e-4, Math.abs(w[0]) - Math.abs(e[0]));
      const ext = Math.max(0, analysis.halfSpan - Math.abs(w[0])) / span;
      tip = [w[0] + (w[0] - e[0]) * ext, w[1] + (w[1] - e[1]) * ext, w[2] + (w[2] - e[2]) * ext];
    }
    caps.push({ a: s, b: e, bone: S, wing: side });
    caps.push({ a: e, b: w, bone: E, wing: side });
    caps.push({ a: w, b: tip, bone: W, wing: side });
    // FINGER capsules (vision marks): in a bat wing the fingers carry the
    // membrane CHORD — without them the trailing membrane is closer to the
    // chest capsule than to the leading-edge arm and tears off the wing
    // (measured 10× stretch at the verdant trailing edge). Fingers ride the
    // wrist bone, exactly like the procedural wing's strut fan.
    for (const f of analysis.fingerJoints || []) {
      caps.push({ a: w, b: [side * Math.abs(f[0]), f[1], f[2]], bone: W, wing: side });
    }
  }
  const r = P(skel.root);
  const { chestZ, spineMinZ, spineMaxZ } = analysis;
  caps.push({ a: [0, r[1], chestZ[0]], b: [0, r[1], chestZ[1]], bone: BONE.ROOT, wing: 0 });
  const n = P(skel.spineSegs[0]), h = P(skel.headBone);
  caps.push({ a: n, b: h, bone: BONE.NECK, wing: 0 });
  caps.push({ a: h, b: [0, h[1], spineMinZ], bone: BONE.HEAD, wing: 0 });
  const hip = P(skel.spineSegs[1]);
  let prev = hip, prev2 = hip, prevBone = BONE.HIP;
  for (let i = 0; i < skel.tailSegs.length; i++) {
    const t = P(skel.tailSegs[i]);
    caps.push({ a: prev, b: t, bone: prevBone, wing: 0 });
    prev2 = prev; prev = t; prevBone = BONE.TAIL0 + i;
  }
  // final capsule continues along the LAST segment's direction (a curled tail
  // does not end pointing down +z), half a segment further to cover the tip
  caps.push({
    a: prev,
    b: [prev[0] + (prev[0] - prev2[0]) * 0.5, prev[1] + (prev[1] - prev2[1]) * 0.5, prev[2] + (prev[2] - prev2[2]) * 0.5],
    bone: prevBone, wing: 0,
  });
  return caps;
}

// Vertex adjacency from an indexed geometry (flat neighbor lists). Null for
// non-indexed geometry — smoothing then no-ops (fixtures, point clouds).
function buildAdjacency(geo) {
  const idx = geo.index;
  if (!idx) return null;
  const n = geo.attributes.position.count;
  const deg = new Uint16Array(n);
  const pushPair = (cb) => {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      cb(a, b); cb(b, a); cb(b, c); cb(c, b); cb(a, c); cb(c, a);
    }
  };
  pushPair((a) => deg[a]++);
  const off = new Uint32Array(n + 1);
  for (let i = 0; i < n; i++) off[i + 1] = off[i] + deg[i];
  const nbr = new Uint32Array(off[n]);
  const cursor = Uint32Array.from(off.subarray(0, n));
  pushPair((a, b) => { nbr[cursor[a]++] = b; });
  return { off, nbr };
}

// One-time weight pass over a baked geometry (v2 — capsules + smoothing).
// Every vertex is weighted by inverse squared distance to the bone capsules
// (wing capsules masked by side + the wing z-window; the rigid chest band is
// PINNED single-slot on the root), then the weights are Laplacian-smoothed
// over the mesh adjacency so no hard seam survives — the anti-smudge fix.
// Writes skinIndex/skinWeight (4-wide, two active slots) and returns partition
// stats (by DOMINANT bone) for the gates.
export function computeGlbWeights(geo, skel, analysis = skel.analysis) {
  if (!analysis) throw new Error('dragonGlbRig: computeGlbWeights before refineSkeletonFromGeometry');
  const { rootStart, chestZ } = analysis;
  const caps = buildCapsules(skel, analysis);
  const wingCaps = caps.filter((c) => c.wing !== 0);
  const bodyCaps = caps.filter((c) => c.wing === 0);
  const NB = skel.allBones.length;
  const pos = geo.attributes.position;
  const n = pos.count;

  // Dense per-vertex weight rows — smoothing needs random access. 14 bones ×
  // ~13k verts ≈ 730 KB transient; freed after the top-2 write.
  let W = new Float32Array(n * NB);
  const pinned = new Uint8Array(n);
  const eps2 = Math.pow(analysis.halfSpan * 0.05, 2);   // softening → smooth gradients

  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ax = Math.abs(x);
    const o = i * NB;
    // Wing eligibility by SOFT CAPSULE COMPETITION, not a z-window: wing
    // capsules count in proportion to how much CLOSER the vert is to the wing
    // than to the body. A z-window cannot segment a SWEPT wing (the verdant
    // leading edge lives forward of any window that spares the neck — measured
    // 70× edge stretch); a HARD closer-than test fixes that but leaves a 0→1
    // cliff along the equidistance line that no smoothing bridges (measured
    // 13× at the wing–neck junction). The soft margin gate g ramps over a real
    // spatial band, and still hits EXACTLY zero where the body is decisively
    // closer — a coiled tail (tail capsule through the coil) stays wing-free.
    let dBody = Infinity;
    for (const c of bodyCaps) {
      const d = segDistSq(x, y, z, c.a, c.b);
      if (d < dBody) dBody = d;
    }
    let dWing = Infinity;
    if (ax > rootStart) {
      for (const c of wingCaps) {
        if ((c.wing < 0) !== (x < 0)) continue;
        const d = segDistSq(x, y, z, c.a, c.b);
        if (d < dWing) dWing = d;
      }
    }
    let gate = 0;
    if (dWing < Infinity) {
      const dB = Math.sqrt(dBody), dW = Math.sqrt(dWing);
      const m = (dB - dW) / Math.max(1e-6, dB + dW);   // −1 (deep body) … +1 (deep wing)
      gate = sstep((m + 0.25) / 0.5);                   // 0 at m≤−0.25, 1 at m≥+0.25
    }
    if (gate < 0.05 && z >= chestZ[0] && z <= chestZ[1]) {
      W[o + BONE.ROOT] = 1; pinned[i] = 1;      // rigid anchor band (L37), pinned
      continue;
    }
    // Welded root ramp (the L1/L22 law: the wing GROWS from the body): wing
    // influence fades to ZERO toward the root edge, so junction verts move
    // with the torso like their body neighbours — the membrane stretches
    // instead of tearing where the leading edge climbs the neck (measured:
    // the tear at the wing–neck junction survives any amount of smoothing
    // without this ramp).
    const rootRamp = sstep((ax - rootStart) / Math.max(1e-4, analysis.shoulderX * 1.4 - rootStart));
    const wingScale = gate * rootRamp;
    let sum = 0;
    for (const c of caps) {
      let w;
      // SHARP falloff (1/(d²+ε)²): keeps ≤4 significant bones per vert so the
      // 4-slot write is lossless — a soft falloff left 5-bone junctions whose
      // truncated smallest weight re-tore the smoothed field (measured 10× at
      // the crowded wing-root/neck region). Smoothing then re-spreads the
      // sharp field ALONG THE MESH, which is the spread we actually want.
      const d = segDistSq(x, y, z, c.a, c.b) + eps2;
      if (c.wing !== 0) {
        if (wingScale <= 0 || (c.wing < 0) !== (x < 0)) continue;
        w = wingScale / (d * d);
      } else {
        w = 1 / (d * d);
      }
      W[o + c.bone] += w; sum += w;
    }
    if (sum > 0) for (let b = 0; b < NB; b++) W[o + b] /= sum;
    else W[o + BONE.ROOT] = 1;
  }

  // Laplacian smoothing over the mesh graph — the seam killer. Pinned rows
  // (chest band) pass through unchanged so the anchor never softens.
  const iters = skel.rig.smoothIters ?? 10;
  const adj = iters > 0 ? buildAdjacency(geo) : null;
  if (adj) {
    let W2 = new Float32Array(n * NB);
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < n; i++) {
        const o = i * NB;
        if (pinned[i]) { W2.set(W.subarray(o, o + NB), o); continue; }
        const s0 = adj.off[i], s1 = adj.off[i + 1];
        const k = s1 - s0;
        if (!k) { W2.set(W.subarray(o, o + NB), o); continue; }
        for (let b = 0; b < NB; b++) {
          let acc = 0;
          for (let s = s0; s < s1; s++) acc += W[adj.nbr[s] * NB + b];
          W2[o + b] = 0.5 * W[o + b] + 0.5 * (acc / k);
        }
      }
      const tmp = W; W = W2; W2 = tmp;
    }
  }

  // Top-4 per vertex → attributes; stats by the dominant bone. FOUR slots, not
  // two: at 3-bone junctions (shoulder/neck/head around the wing root) a top-2
  // cut DROPS the small bridging weight smoothing just built and re-sharpens
  // the seam (measured: the same 13× tear survived any smoothing until the
  // truncated third weight was kept). GPU skinning is 4-wide anyway.
  const si = new Uint16Array(n * 4);
  const sw = new Float32Array(n * 4);
  const stats = { wingL: 0, wingR: 0, chest: 0, neckHead: 0, hipTail: 0, total: n };
  for (let i = 0; i < n; i++) {
    const o = i * NB;
    const top = [[-1, 0], [-1, 0], [-1, 0], [-1, 0]];   // [bone, w] descending
    for (let b = 0; b < NB; b++) {
      const w = W[o + b];
      if (w <= 1e-6) continue;
      for (let k = 0; k < 4; k++) {
        if (w > top[k][1]) { top.splice(k, 0, [b, w]); top.length = 4; break; }
      }
    }
    const q = i * 4;
    let s = 0;
    for (let k = 0; k < 4; k++) if (top[k][0] >= 0) s += top[k][1];
    if (s <= 0) { si[q] = BONE.ROOT; sw[q] = 1; stats.chest++; continue; }
    for (let k = 0; k < 4; k++) {
      if (top[k][0] < 0) break;
      si[q + k] = top[k][0]; sw[q + k] = top[k][1] / s;
    }
    const b0 = top[0][0];
    if (b0 >= BONE.SHOULDER_L && b0 <= BONE.WRIST_L) stats.wingL++;
    else if (b0 >= BONE.SHOULDER_R && b0 <= BONE.WRIST_R) stats.wingR++;
    else if (b0 === BONE.ROOT) stats.chest++;
    else if (b0 === BONE.NECK || b0 === BONE.HEAD) stats.neckHead++;
    else stats.hipTail++;
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

