import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// DRAGON STATIC-MESH COLLAPSE — the dragon-model analogue of angelWing's `collapseWingByMaterial`,
// generalised for a mixed procedural model. Collapses the STATIC same-material sibling meshes under a
// RIGID `root` into one merged mesh per material. The dragon model is drawn again in the water mirror
// AND (as a black occluder) the god-ray mask, so each saved draw pays 2–3×.
//
// It differs from the wing merge in four load-bearing ways (learned from the model's structure):
//   1. NEVER clears the group — the model's groups also hold FX emitters, tip markers, motif anchors,
//      the core-glow sprite, and the animated pivots/bones. Only the MERGED meshes are removed.
//   2. Does NOT descend across an ANIMATION BOUNDARY — an `isBone` node or one flagged
//      `userData.animBoundary` (the wing blade pivots, the tail chain joints). Their contents animate
//      and must keep their own transform. (Callers collapse each such sub-root separately.)
//   3. NORMALISES attributes before bucketing — the model mixes bare position+normal `flatTriMesh`
//      geometry with uv+indexed spikes/eyes; without `toNonIndexed()` + `deleteAttribute('uv')`,
//      `mergeGeometries` returns null the moment two shapes disagree and the whole bucket is forfeited.
//   4. EXCLUDES non-mergeable meshes — anything transparent-without-depth (additive), on a non-default
//      layer, with a non-zero renderOrder, skinned/instanced, or carrying a name/userData (addressed
//      elsewhere). Baking is relative to `root` so the merged meshes ride root's live transform.
// try/catch per bucket → any failure leaves that bucket unmerged (correctness over the saving).
export function collapseStaticSiblings(root) {
  if (!root) return;
  root.updateMatrixWorld(true);
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const _m = new THREE.Matrix4();
  const buckets = new Map();   // material instance → { geos:[], meshes:[] }

  const isBoundary = (o) => o.isBone === true || (o.userData && o.userData.animBoundary === true);
  const mergeable = (o) => {
    if (!o.isMesh || !o.geometry) return false;
    if (o.isSkinnedMesh || o.isInstancedMesh) return false;
    if (o.name) return false;                                  // named → referenced elsewhere
    if (o.userData && Object.keys(o.userData).length > 0) return false;
    if (o.renderOrder !== 0) return false;
    if (o.layers.mask !== 1) return false;                     // layer-1 FX etc.
    const mat = o.material;
    if (!mat || Array.isArray(mat)) return false;              // multi-material carries geometry groups
    if (mat.transparent && mat.depthWrite === false) return false;   // additive / soft
    return true;
  };

  const visit = (node) => {
    for (const c of node.children) {
      if (isBoundary(c)) continue;                             // don't cross into an animated subtree
      if (mergeable(c)) {
        let g = c.geometry.clone();
        _m.copy(rootInv).multiply(c.matrixWorld);
        g.applyMatrix4(_m);                                    // bake transform (position + normal) relative to root
        if (g.index) g = g.toNonIndexed();
        if (g.getAttribute('uv')) g.deleteAttribute('uv');
        if (g.getAttribute('color')) g.deleteAttribute('color');
        if (!buckets.has(c.material)) buckets.set(c.material, { geos: [], meshes: [] });
        const b = buckets.get(c.material); b.geos.push(g); b.meshes.push(c);
      }
      visit(c);                                                // descend through non-mergeable groups (but never boundaries)
    }
  };
  visit(root);

  let saved = 0;
  for (const [mat, b] of buckets) {
    if (b.geos.length < 2) continue;                           // one mesh → no saving
    try {
      const merged = mergeGeometries(b.geos, false);
      if (!merged) throw new Error('mergeGeometries null (incompatible attributes)');
      const mesh = new THREE.Mesh(merged, mat);
      mesh.frustumCulled = false;                              // one mesh now spans the whole root; the dragon is on-screen
      for (const om of b.meshes) if (om.parent) om.parent.remove(om);
      root.add(mesh);
      saved += b.meshes.length - 1;
    } catch (e) { /* leave this bucket unmerged — the meshes still render */ }
  }
  return saved;
}

// Collapse a list of rigid roots (torso, head, each wing's static frame, each tail chain joint). The
// animated sub-nodes (blade pivots, tail joints) are either passed as their OWN roots or protected by
// the isBone/animBoundary rule above.
export function collapseDragonStatics(roots) {
  let saved = 0;
  for (const r of roots) saved += collapseStaticSiblings(r) || 0;
  return saved;
}
