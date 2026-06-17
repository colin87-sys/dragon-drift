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
