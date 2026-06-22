import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { buildTorso } from './dragonTorso.js';
import { sweepProfileSmooth } from './dragonSweep.js';
import { DRIFT_STATIONS, DRIFT_KEEL } from './driftBodyStations.js';
import { TAIL_FIN } from './driftFinData.js';

// ── DRIFT BODY ───────────────────────────────────────────────────────────────
// A self-bodied, sleek Night-Fury torso authored to the green-screen reference
// (refs/dragon-body-green.png → refs/body-anatomy.json). It builds its OWN body
// mesh (unlike nightFuryTorso, which is body-less and grows the body from the
// wings), so the clean-sheet tracedWing can attach to a real shoulder. Smooth
// longitudinal loft (sweepProfileSmooth) for a no-facet skin.
//
// Stations: [z, halfWidth, keelTop, belly, cy]  (head at −z, tail at +z)
//   cy = centreline lift (head rides up the neck, tail droops then tips up), so the
//   SIDE profile reads as the posed reference, not a flat plank.

const SECTION_N = 20;
function driftSection(w, top, bot) {
  const pts = [];
  const ex = 2.5;                                   // >2 = fuller rounded flanks (chunky, not oval)
  const shape = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
  for (let i = 0; i < SECTION_N; i++) {
    const a = (i / SECTION_N) * Math.PI * 2 + Math.PI / 2;   // i=0 → top (+y), CCW
    const sx = shape(Math.cos(a)), sy = shape(Math.sin(a));
    pts.push([sx * w, sy * (sy >= 0 ? top : bot)]);
  }
  return pts;
}

const DRIFT_PROFILE = {
  zHold: 0,
  longSamples: 56,
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.26,
  tailAnchorZ: 1.18,
  ring: driftSection,
  stations: DRIFT_STATIONS,            // traced torso back/belly (driftBodyStations.js)
  keel: DRIFT_KEEL,
  wingRoot: { x: 0.45, y: 0.56, z: -0.55 },          // high on the back over the chest (the broad shoulder)
  fairing: { r: 0.28, scale: [0.86, 0.78, 1.2], pos: [0.44, 0.55, -0.5] },
  neck: {
    rBase: 0.40, rStep: 0.045, rMin: 0.18, scale: [0.8, 0.66, 1.3],
    y0: 0.30, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.08, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5, z: -2.4 }),
};

// ── TAIL FINS ────────────────────────────────────────────────────────────────
// The iconic twin bat-membrane tail fan, traced from the master (driftFinData.js).
// Built as a flat ear-clipped membrane in the y-z plane at the tail tip, mirrored
// into a shallow V so the SIDE silhouette = the traced fan.
function earClip(poly) {
  const idx = poly.map((_, i) => i), out = [];
  const area = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; s += a[0] * b[1] - b[0] * a[1]; }
  if (s < 0) idx.reverse();
  const inT = (p, a, b, c) => { const d1 = area(p, a, b), d2 = area(p, b, c), d3 = area(p, c, a); return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0))); };
  let g = 0;
  while (idx.length > 3 && g++ < 9000) { let clip = false;
    for (let i = 0; i < idx.length; i++) { const ip = idx[(i - 1 + idx.length) % idx.length], ic = idx[i], inx = idx[(i + 1) % idx.length]; const a = poly[ip], b = poly[ic], c = poly[inx];
      if (area(a, b, c) <= 0) continue; let ear = true; for (const j of idx) { if (j === ip || j === ic || j === inx) continue; if (inT(poly[j], a, b, c)) { ear = false; break; } }
      if (ear) { out.push([ip, ic, inx]); idx.splice(i, 1); clip = true; break; } } if (!clip) break; }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}
function buildTailFins(attach, finMat) {
  const last = DRIFT_STATIONS[DRIFT_STATIONS.length - 1];
  const z0 = last[0], y0 = attach.bodyMidY + last[4];          // tail-tip centreline
  const tris = earClip(TAIL_FIN);
  const g = new THREE.Group();
  for (const yaw of [0.32, -0.32]) {                          // twin fins splay into a V
    const pos = new Float32Array(tris.length * 9);
    for (let t = 0; t < tris.length; t++) { const o = t * 9;
      for (let k = 0; k < 3; k++) { const p = TAIL_FIN[tris[t][k]]; pos[o + k * 3] = 0; pos[o + k * 3 + 1] = y0 + p[1]; pos[o + k * 3 + 2] = z0 + p[0]; } }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.computeVertexNormals();
    const fin = new THREE.Mesh(fg, finMat); fin.frustumCulled = false;
    // splay about the tail (z) axis through the tip
    fin.position.set(0, y0, z0); fin.rotation.z = yaw; fin.geometry.translate(0, -y0, -z0);
    g.add(fin);
  }
  return g;
}

registerTorso('driftBody', (def, model, bodyMat) => {
  // neck:false — the traced stations already carry the head/neck bulk all the way
  // to the snout, so we suppress the generic sphere-chain neck (which climbs in Y
  // on a pose of its own and fights the traced side silhouette).
  const res = buildTorso(DRIFT_PROFILE, def, model, bodyMat,
    (profile, stretch) => sweepProfileSmooth({ ...profile, ring: profile.ring || driftSection }, stretch),
    { neck: false });
  const finMat = (res.attach.bodyMatDouble || bodyMat).clone(); finMat.side = THREE.DoubleSide;
  res.group.add(buildTailFins(res.attach, finMat));
  return res;
});

export { DRIFT_PROFILE, driftSection };
