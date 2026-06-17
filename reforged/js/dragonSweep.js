import * as THREE from 'three';
import { seg } from './modelDetail.js';

// SWEEP — generalises the torso loft (roadmap #4). A body is a 2D cross-section
// (a closed ring of control points) swept along a longitudinal run of stations.
// The shipped loft (dragonTorso.js#buildTorsoGeometry) connects 8 ring points with
// FLAT quads, so the body reads as a hard OCTAGON — belly/flank faceting that no
// number of extra stations can smooth, because the facets are AROUND the section,
// not along it.
//
// sweepProfile() rounds it the way L11 deferred: treat each cross-section as a
// CLOSED Catmull-Rom curve and RESAMPLE it at a detail-driven count — a resample
// of the smooth curve, NOT a linear subdivide of the polygon. Identity-default
// (the L11/L14 discipline): at HIGH the sample count === the control count, so the
// control points come back UNCHANGED → byte-identical to the legacy loft. LOW
// coarsens (octagon → pentagon); ULTRA rounds (octagon → ~13-gon) on the idle GPU.
//
// The longitudinal centreline is still the straight z-axis here; the spline-swept
// BENDING that animates necks / tails / horns by bending a curve is the next
// increment and drops into this same primitive (a centreline curve + Frenet frames
// replacing the per-station z).

// Resample a CLOSED control polygon (array of [x, y]) to `m` points along its
// centripetal Catmull-Rom curve. Passthrough when m === the control count, so the
// shipped tier (HIGH) is a literal no-op — the no-regression gate from L11.
function resampleRing(ctrl, m) {
  if (m === ctrl.length) return ctrl;
  const curve = new THREE.CatmullRomCurve3(
    ctrl.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  const out = [];
  for (let i = 0; i < m; i++) {
    const p = curve.getPoint(i / m);   // closed: i/m over [0,1) never repeats the seam
    out.push([p.x, p.y]);
  }
  return out;
}

// Loft a profile — { stations: [z, halfWidth, keelTop, belly][], zHold,
// ring(w, top, bot) -> [[x, y], ...] } — into ONE closed BufferGeometry. The
// cross-section density follows seg() (identity at HIGH). `stretch` lengthens only
// the after-body (stations past zHold), exactly matching the legacy builder.
export function sweepProfile(profile, stretch = 1) {
  const { stations, zHold, ring } = profile;
  const zAt = (z) => (z > zHold ? zHold + (z - zHold) * stretch : z);
  const rings = stations.map(([z, w, top, bot]) => ({ z: zAt(z), ctrl: ring(w, top, bot) }));
  const m = seg(rings[0].ctrl.length);

  const verts = [];
  for (const r of rings) {
    for (const [x, y] of resampleRing(r.ctrl, m)) verts.push(x, y, r.z);
  }
  const idx = [];
  for (let s = 0; s < rings.length - 1; s++) {
    const a0 = s * m, b0 = (s + 1) * m;
    for (let k = 0; k < m; k++) {
      const n = (k + 1) % m;
      idx.push(a0 + k, b0 + k, a0 + n, a0 + n, b0 + k, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A continuous tapered tube swept along a centreline and SKINNED to a bone chain,
// so a rig that bends the bones bends ONE smooth surface (no segment joints) — the
// "organism, not puppet" upgrade (L1), generalising the wing's internal skinnedTube.
// The caller supplies the centreline points, a radius per station, the ring count,
// and a skinAt(station) -> { si:[4], sw:[4] } weight function (e.g. a 2-bone
// z-proximity blend for a tail). Returns a SkinnedMesh — bind the skeleton in LOCAL
// space (assemble at origin → updateMatrixWorld → bind → then position), per L2.
// Cross-section rings follow the caller's count; pass seg() for detail-awareness.
export function skinnedTube(centreline, radii, rings, skinAt, mat) {
  const N = centreline.length;
  const verts = [], idx = [], si = [], sw = [];
  const tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  for (let s = 0; s < N; s++) {
    const c = centreline[s], r = radii[s];
    const a = centreline[Math.max(s - 1, 0)], b = centreline[Math.min(s + 1, N - 1)];
    tan.set(b.x - a.x, b.y - a.y, b.z - a.z).normalize();
    side.crossVectors(UP, tan);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0); else side.normalize();
    up.crossVectors(tan, side).normalize();
    const k = skinAt(s);
    for (let j = 0; j < rings; j++) {
      const ang = (j / rings) * Math.PI * 2, cos = Math.cos(ang), sin = Math.sin(ang);
      verts.push(
        c.x + (side.x * cos + up.x * sin) * r,
        c.y + (side.y * cos + up.y * sin) * r,
        c.z + (side.z * cos + up.z * sin) * r);
      si.push(k.si[0], k.si[1], k.si[2] || 0, k.si[3] || 0);
      sw.push(k.sw[0], k.sw[1], k.sw[2] || 0, k.sw[3] || 0);
    }
  }
  for (let s = 0; s < N - 1; s++) for (let j = 0; j < rings; j++) {
    const a = s * rings + j, b = s * rings + (j + 1) % rings;
    const c = (s + 1) * rings + j, d = (s + 1) * rings + (j + 1) % rings;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(si), 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.computeVertexNormals();
  const m = new THREE.SkinnedMesh(g, mat);
  m.frustumCulled = false;   // skinning deforms outside the bind bbox (L2)
  return m;
}
