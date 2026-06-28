// Procedural SKINNED RIG for a fused asset-backed dragon.
//
// The mesh ships as one un-skinned blob, so the legacy "flap" was a planar vertex-shear
// (dragonGlb.js attachBodyDeform) that can't pivot a wing from the shoulder or move a body
// part at all. Instead we build a real skeleton from MEASURED native regions (tools/
// glbsegment.mjs + glborient.mjs) and skin the mesh to it, then drive the bones reactively
// in dragon.js. This pass rigs WINGS (3-bone folding chain), TORSO (chest heave) and TAIL
// (2-bone whip) — the high-priority parts. Legs / dedicated neck+head bones come next; for
// now the head+neck ride the chest (so they heave) and the legs ride the root (rigid tuck).
//
// Native frame: +Z snout, -Z back, +Y dorsal/up, -Y feet, ±X wingspan.
//
// Bone indices (MUST match SPEC order below and tests/rig.mjs):
export const B = { ROOT: 0, CHEST: 1, SHL: 2, ELL: 3, WRL: 4, SHR: 5, ELR: 6, WRR: 7, TAILA: 8, TAILB: 9 };

// Skeleton: name → parent + native-space pivot (absolute). Local offset = pivot − parentPivot.
export const SPEC = [
  { name: 'root',  parent: null,    pos: [0.00, -0.10, -0.15] },   // pelvis
  { name: 'chest', parent: 'root',  pos: [0.00,  0.15,  0.00] },   // torso heave; carries wings + neck/head
  { name: 'shL',   parent: 'chest', pos: [-0.30, 0.35, -0.10] },   // left wing: shoulder → elbow → wrist
  { name: 'elL',   parent: 'shL',   pos: [-0.55, 0.55, -0.15] },
  { name: 'wrL',   parent: 'elL',   pos: [-0.78, 0.68, -0.20] },
  { name: 'shR',   parent: 'chest', pos: [0.30,  0.35, -0.10] },   // right wing
  { name: 'elR',   parent: 'shR',   pos: [0.55,  0.55, -0.15] },
  { name: 'wrR',   parent: 'elR',   pos: [0.78,  0.68, -0.20] },
  { name: 'tailA', parent: 'root',  pos: [0.00, -0.45, -0.30] },   // tail chain
  { name: 'tailB', parent: 'tailA', pos: [0.03, -0.62, -0.42] },
];

const HX = 0.30, MINY = 0.12;   // wing gate (wide in X, above the shoulder in Y)

// PURE skin-weight assignment (no THREE / no WebGL) so tests/rig.mjs can lock the math.
// positions: flat Float32Array [x,y,z,...]. Returns skinIndex/skinWeight (4 per vertex,
// normalized). A wing vert spreads across its shoulder→elbow→wrist chain by span (|x|) with
// a smooth blend, the inboard root bleeding into the chest so the membrane never tears; a
// tail vert spreads across tailA→tailB by z, bleeding into root at the base; upper/mid body
// rides the chest (fading to root toward the belly/hips); everything else binds to root.
export function computeRigSkin(positions) {
  const n = positions.length / 3;
  const skinIndex = new Uint16Array(n * 4);
  const skinWeight = new Float32Array(n * 4);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const ax = Math.abs(x);
    const inf = [];                                   // [boneIndex, weight] pairs
    const push = (idx, w) => { if (w > 1e-5) inf.push([idx, w]); };

    if (ax > HX && y > MINY) {                         // WING chain
      const chain = x > 0 ? [B.SHR, B.ELR, B.WRR] : [B.SHL, B.ELL, B.WRL];
      const centers = [0.41, 0.63, 0.85], sp = 0.22;   // span position of shoulder/elbow/wrist
      let tot = 0; const tw = centers.map((c) => { const w = Math.max(0, 1 - Math.abs(ax - c) / sp); tot += w; return w; });
      const seam = clamp01((0.44 - ax) / 0.14) * 0.6;  // inboard root → bleeds into chest
      push(B.CHEST, seam);
      for (let k = 0; k < 3; k++) push(chain[k], (tot > 0 ? tw[k] / tot : 0) * (1 - seam));
    } else if (z < -0.30 && ax < 0.18) {              // TAIL chain (narrow midline back)
      const centers = [-0.40, -0.55], sp = 0.16;
      let tot = 0; const tw = centers.map((c) => { const w = Math.max(0, 1 - Math.abs(z - c) / sp); tot += w; return w; });
      const seam = clamp01((z + 0.36) / 0.06) * 0.6;   // base (z→-0.30) bleeds into root
      push(B.ROOT, seam);
      push(B.TAILA, (tot > 0 ? tw[0] / tot : 0) * (1 - seam));
      push(B.TAILB, (tot > 0 ? tw[1] / tot : 0) * (1 - seam));
    } else if (y > -0.10 && ax < 0.40 && z > -0.30) { // upper/mid body + neck + head ride chest
      const w = clamp01((y + 0.10) / 0.30);            // fade chest→root toward the belly
      push(B.CHEST, w); push(B.ROOT, 1 - w);
    } else {
      push(B.ROOT, 1);                                 // legs / lower body / belly (rigid for now)
    }

    inf.sort((a, b) => b[1] - a[1]);
    const top = inf.slice(0, 4);
    let s = 0; for (const p of top) s += p[1];
    if (s <= 0) { top.length = 0; top.push([B.ROOT, 1]); s = 1; }
    for (let k = 0; k < top.length; k++) { skinIndex[i * 4 + k] = top[k][0]; skinWeight[i * 4 + k] = top[k][1] / s; }
  }
  return { skinIndex, skinWeight };
}

// Build the skeleton from SPEC and bind the mesh as a SkinnedMesh. Returns
// { skinned, bones } (bones keyed by name) or null if the mesh can't be skinned. THREE is
// passed by the browser-only caller (headless tests use computeRigSkin directly).
export function buildRig(THREE, mesh) {
  const geom = mesh.geometry;
  if (!geom || !geom.attributes || !geom.attributes.position) return null;
  const I = new THREE.Matrix4();
  mesh.updateMatrix();
  const baked = !mesh.matrix.equals(I);
  if (baked) geom.applyMatrix4(mesh.matrix);          // bake node transform → bone coords in native space

  const { skinIndex, skinWeight } = computeRigSkin(geom.attributes.position.array);
  geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));

  const byName = {};
  const bones = SPEC.map((s) => { const b = new THREE.Bone(); b.name = s.name; byName[s.name] = b; return b; });
  SPEC.forEach((s, i) => {
    const parentPos = s.parent ? SPEC.find((x) => x.name === s.parent).pos : [0, 0, 0];
    bones[i].position.set(s.pos[0] - parentPos[0], s.pos[1] - parentPos[1], s.pos[2] - parentPos[2]);
    if (s.parent) byName[s.parent].add(bones[i]);
  });

  const skinned = new THREE.SkinnedMesh(geom, mesh.material);
  skinned.name = mesh.name || 'pyrelordRig';
  skinned.add(byName.root);
  skinned.updateMatrixWorld(true);
  skinned.bind(new THREE.Skeleton(bones));
  skinned.position.copy(mesh.position); skinned.quaternion.copy(mesh.quaternion); skinned.scale.copy(mesh.scale);
  if (baked) { skinned.position.set(0, 0, 0); skinned.quaternion.identity(); skinned.scale.set(1, 1, 1); }
  return { skinned, bones: byName };
}
