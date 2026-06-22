import * as THREE from 'three';
import { registerWings } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { TRACED_WING } from './tracedWingData.js';

// ── TRACED WING ──────────────────────────────────────────────────────────────
// A clean-sheet membrane wing whose ANATOMY is traced from a green-screen reference
// photo (refs/wing-green.png) — see refs/wing-anatomy.json + LEAPFROG L89/L90. It is
// NOT a fork of nightFuryWings: the silhouette, the curved finger struts, the
// continuous tapered leading frame and the soft parachute-billow membrane are all
// rebuilt from the trace, on a fresh isotropic membrane mesh.
//
// Build outline:
//   1. project the traced px anatomy into the wing plane (x = span out, z = chord, y = up)
//   2. mesh the membrane PROPERLY — densified boundary + interior grid + Delaunay — so
//      the surface is smooth (the boundary-only ear-clip gave straight wrinkle facets)
//   3. displace: one soft EDGE billow (parachute dome) + subtle tendon ridges that
//      follow the curved finger struts (raised like tendons under skin)
//   4. lay the tapered leading-frame bone along the smoothed leading edge (root→tip)
//
// Mounts via attach.wingRoot(side) like every wing; returns the standard rig handles.
// Animation is deliberately left to a FRESH flap (not the Night-Fury cascade).

// --- minimal Bowyer–Watson Delaunay (build-time only; ~440 pts) ---------------
function delaunay(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); }
  const dmax = Math.max(maxX - minX, maxY - minY) * 10, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
  const P = pts.slice(); const n = P.length;
  P.push([mx - 2 * dmax, my - dmax], [mx, my + 2 * dmax], [mx + 2 * dmax, my - dmax]);
  let tris = [[n, n + 1, n + 2]];
  const inCirc = (a, b, c, p) => {
    const ax = a[0] - p[0], ay = a[1] - p[1], bx = b[0] - p[0], by = b[1] - p[1], cx = c[0] - p[0], cy = c[1] - p[1];
    const d = (ax * ax + ay * ay) * (bx * cy - cx * by) - (bx * bx + by * by) * (ax * cy - cx * ay) + (cx * cx + cy * cy) * (ax * by - bx * ay);
    const o = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return o > 0 ? d > 0 : d < 0;
  };
  for (let i = 0; i < n; i++) {
    const p = P[i]; const bad = [];
    for (let t = 0; t < tris.length; t++) { const [a, b, c] = tris[t]; if (inCirc(P[a], P[b], P[c], p)) bad.push(t); }
    const edges = []; for (const t of bad) { const [a, b, c] = tris[t]; edges.push([a, b], [b, c], [c, a]); }
    const be = [];
    for (let e = 0; e < edges.length; e++) {
      let shared = false;
      for (let g = 0; g < edges.length; g++) { if (e === g) continue; const A = edges[e], B = edges[g]; if ((A[0] === B[1] && A[1] === B[0]) || (A[0] === B[0] && A[1] === B[1])) { shared = true; break; } }
      if (!shared) be.push(edges[e]);
    }
    const set = new Set(bad);
    tris = tris.filter((_, t) => !set.has(t));
    for (const [a, b] of be) tris.push([a, b, i]);
  }
  return tris.filter(([a, b, c]) => a < n && b < n && c < n);
}

const smoothLine = (p, passes) => {
  let a = p.map((q) => q.slice());
  for (let k = 0; k < passes; k++) { const b = a.map((q) => q.slice()); for (let i = 1; i < a.length - 1; i++) b[i] = [(a[i - 1][0] + 2 * a[i][0] + a[i + 1][0]) / 4, (a[i - 1][1] + 2 * a[i][1] + a[i + 1][1]) / 4]; a = b; }
  return a;
};
const distSeg = (p, a, b) => {
  const vx = b[0] - a[0], vy = b[1] - a[1], wx = p[0] - a[0], wy = p[1] - a[1];
  const c1 = vx * wx + vy * wy; if (c1 <= 0) return Math.hypot(wx, wy);
  const c2 = vx * vx + vy * vy; if (c2 <= c1) return Math.hypot(p[0] - b[0], p[1] - b[1]);
  const t = c1 / c2; return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
};
const distPoly = (p, poly) => { let m = Infinity; for (let i = 0; i < poly.length - 1; i++) m = Math.min(m, distSeg(p, poly[i], poly[i + 1])); return m; };
const pip = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) c = !c; } return c; };

// Build the local geometry ONCE (side-independent): membrane + leading-frame spar in
// the wing plane (x = span from root, z = chord [+lead], y = up). Cached across forms.
let _cache = null;
function buildLocalWing() {
  if (_cache) return _cache;
  const A = TRACED_WING;
  const S = A.imageRef, T = A.tipRef;
  const sdx = T[0] - S[0], sdy = T[1] - S[1], sL = Math.hypot(sdx, sdy);
  const su = [sdx / sL, sdy / sL], cu = [-su[1], su[0]];
  const f = 4.65 / ((T[0] - S[0]) * su[0] + (T[1] - S[1]) * su[1]);
  const P = (px) => [((px[0] - S[0]) * su[0] + (px[1] - S[1]) * su[1]) * f, ((px[0] - S[0]) * cu[0] + (px[1] - S[1]) * cu[1]) * f];

  const leadPx = smoothLine([A.root, ...A.outline.slice(0, 26).slice().reverse(), T], 6);
  const trailPx = A.outline.slice(33, 78).slice().reverse();
  const loop2 = [...leadPx, ...trailPx].map(P);
  const lead2 = leadPx.map(P), trail2 = trailPx.map(P);
  const fingers2D = A.struts.slice(1).map((s) => smoothLine(s, 2).map(P));

  // mesh: densified boundary + interior hex grid
  const h = 0.13;
  const bnd = [];
  for (let i = 0; i < loop2.length; i++) { const a = loop2[i], b = loop2[(i + 1) % loop2.length]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(d / h)); for (let k = 0; k < n; k++) bnd.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of loop2) { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); }
  const distLoop = (p) => distPoly(p, [...loop2, loop2[0]]);
  const interior = [];
  let r = 0;
  for (let y = minY; y <= maxY; y += h * 0.87, r++) for (let x = minX; x <= maxX; x += h) { const jx = x + (r % 2) * h * 0.5; const p = [jx, y]; if (pip(p, loop2) && distLoop(p) > h * 0.55) interior.push(p); }
  const verts2 = [...bnd, ...interior];
  const tris = delaunay(verts2).filter(([a, b, c]) => pip([(verts2[a][0] + verts2[b][0] + verts2[c][0]) / 3, (verts2[a][1] + verts2[b][1] + verts2[c][1]) / 3], loop2));

  // displacement: parachute billow off the edge + subtle tendon ridges on the struts
  const DOME = 0.14, DR = 0.62, BULGE = 0.05, BW = 0.085;
  const yAt = (p) => {
    let de = Math.min(distPoly(p, lead2), distPoly(p, trail2));
    const billow = DOME * Math.sin(Math.min(de / DR, 1) * Math.PI / 2);
    let dt = Infinity; for (const F of fingers2D) dt = Math.min(dt, distPoly(p, F));
    return billow + BULGE * Math.exp(-(dt / BW) * (dt / BW));
  };

  return (_cache = { P, lead2, leadPx, fingers2D, verts2, tris, yAt });
}

// One wing Group (mesh + bones) for a side, scaled by ws.
function makeWing(side, ws, membraneMat, boneMat) {
  const L = buildLocalWing();
  const SC = 1.28 * ws;                         // span scale toward the roster wing size
  const toLocal = (p2, y) => new THREE.Vector3(p2[0] * SC * side, y * SC, -p2[1] * SC); // x=span(side), z=-chord(lead +z→front via -), y=up

  // membrane mesh
  const V3 = L.verts2.map((p) => toLocal(p, L.yAt(p)));
  const pos = new Float32Array(L.tris.length * 9);
  for (let t = 0; t < L.tris.length; t++) {
    const [a, b, c] = L.tris[t]; const va = V3[a], vb = V3[b], vc = V3[c]; const o = t * 9;
    // wind so normals face +y (consistent), flip for the mirrored side
    const A2 = side < 0 ? [va, vc, vb] : [va, vb, vc];
    pos[o] = A2[0].x; pos[o + 1] = A2[0].y; pos[o + 2] = A2[0].z;
    pos[o + 3] = A2[1].x; pos[o + 4] = A2[1].y; pos[o + 5] = A2[1].z;
    pos[o + 6] = A2[2].x; pos[o + 7] = A2[2].y; pos[o + 8] = A2[2].z;
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  mg.computeVertexNormals();
  const membrane = new THREE.Mesh(mg, membraneMat);
  membrane.frustumCulled = false;

  // leading-frame spar: tapered tube along the smoothed leading edge (root thick → tip thin)
  const lp = L.lead2; let tot = 0; const sg = [0];
  for (let i = 1; i < lp.length; i++) { tot += Math.hypot(lp[i][0] - lp[i - 1][0], lp[i][1] - lp[i - 1][1]); sg.push(tot); }
  const curve = [], radii = [];
  const rRoot = 0.10, rTip = 0.012;
  for (let i = 0; i < lp.length; i++) { const t = sg[i] / tot; const rr = (rRoot + (rTip - rRoot) * t) * SC; curve.push(toLocal(lp[i], L.yAt(lp[i]) + (rr / SC) * 0.5)); radii.push(rr); }
  const spar = tube(curve, radii, boneMat, seg(8));
  spar.frustumCulled = false;

  const g = new THREE.Group();
  g.add(membrane); g.add(spar);
  return g;
}

// tapered tube along a centreline
function tube(cl, radii, mat, radial = 8) {
  const verts = [], idx = []; const up = new THREE.Vector3(0, 1, 0);
  const tan = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3();
  for (let i = 0; i < cl.length; i++) {
    if (i < cl.length - 1) tan.subVectors(cl[i + 1], cl[i]); else tan.subVectors(cl[i], cl[i - 1]); tan.normalize();
    nrm.crossVectors(up, tan); if (nrm.lengthSq() < 1e-6) nrm.set(1, 0, 0); nrm.normalize();
    bin.crossVectors(tan, nrm).normalize();
    for (let j = 0; j < radial; j++) { const a = j / radial * Math.PI * 2; verts.push(cl[i].x + (nrm.x * Math.cos(a) + bin.x * Math.sin(a)) * radii[i], cl[i].y + (nrm.y * Math.cos(a) + bin.y * Math.sin(a)) * radii[i], cl[i].z + (nrm.z * Math.cos(a) + bin.z * Math.sin(a)) * radii[i]); }
  }
  for (let i = 0; i < cl.length - 1; i++) for (let j = 0; j < radial; j++) { const a = i * radial + j, b = i * radial + (j + 1) % radial, c = (i + 1) * radial + (j + 1) % radial, d = (i + 1) * radial + j; idx.push(a, c, b, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function buildTracedWings(def, model, attach) {
  const group = new THREE.Group();
  const ws = model.wingScale ?? 1;
  const membraneMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? def.body ?? 0x14202e, vertexColors: false,
    roughness: 0.62, metalness: 0.0, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.95,
    emissive: def.wingMembraneEmissive ?? def.wingEmissive ?? 0x0d1219, emissiveIntensity: model.wingPanelGlow ?? 0.12,
  });
  const boneMat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x0a0f1c, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });

  function side(s) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(s);
    pivot.position.set(wr.x, wr.y, wr.z);
    // BROAD ROOT: the wing's root chord (arm root → innermost-finger corner) must run
    // FORE-AFT along the body flank so the whole chord meets the body (not a point). Two
    // rotations: (1) align the local root-edge direction with the body's back line; (2)
    // dihedral the membrane UP about that aligned root edge. The whole chord stays on the
    // back; the membrane raises like the reference.
    const wing = makeWing(s, ws, membraneMat, boneMat);
    const L = buildLocalWing(); const SC = 1.28 * ws;
    const tr = L.P(TRACED_WING.outline[33]);            // trailing root corner (bottom-left)
    const T3 = new THREE.Vector3(tr[0] * SC * s, L.yAt(tr) * SC, -tr[1] * SC);
    const backDir = new THREE.Vector3(0, -(model.wingRootSlope ?? 0.15), 1).normalize(); // aft + slight down
    const q1 = new THREE.Quaternion().setFromUnitVectors(T3.clone().normalize(), backDir);
    const q2 = new THREE.Quaternion().setFromAxisAngle(backDir, s * (model.wingDihedral ?? 0.95));
    wing.quaternion.copy(q2).multiply(q1);
    pivot.add(wing);
    // wingTip handle at the wrist (carries the trail marker); folding is left to a fresh flap.
    const wingTip = new THREE.Group();
    const wp = L.P(TRACED_WING.wrist);
    wingTip.position.set(wp[0] * SC * s, L.yAt(wp) * SC, -wp[1] * SC);
    const marker = new THREE.Object3D();
    const tp = L.P(TRACED_WING.tipRef);
    marker.position.set(tp[0] * SC * s - wingTip.position.x, L.yAt(tp) * SC - wingTip.position.y, -tp[1] * SC - wingTip.position.z);
    wingTip.add(marker);
    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker };
  }
  const R = side(1), Lw = side(-1);
  return {
    group,
    parts: {
      wingPivotL: Lw.pivot, wingPivotR: R.pivot,
      wingTipL: Lw.wingTip, wingTipR: R.wingTip,
      tipMarkerL: Lw.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null, wingRigL: null, wingRigR: null,
    },
    wingMat: membraneMat,
    spineMats: [],
  };
}

registerWings('tracedWing', buildTracedWings);

export { buildTracedWings };
