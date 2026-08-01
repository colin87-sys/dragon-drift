// WINGREAD — does the wing READ as a wing, or as a paper dart?
//
// Written by Fable as an INDEPENDENT verifier, from scratch, because four existing gates were
// found measuring the wrong thing (wing-vs-torso for a wing-vs-wing defect; a ceiling with no
// floor that paid out for widening a gap; a probe that fails all three shipped dragons on its
// own "an arm exists" check). Nothing here reads those tools, their thresholds, or their bands.
//
// ── WHAT IT MEASURES, AND WHY THAT IS THE RIGHT QUANTITY ───────────────────────────────────────
// DRAGON-DESIGN §2 failure #1 defines the kill-on-sight defect purely as an OUTLINE fact:
//   "Straight leading edge + straight trailing edge + sine bumps. Reads as a paper dart.
//    Convex scallop lobes whose valleys never cut inward are still this failure."
// And §3.6 (silhouette economics) says the play-distance budget IS the outline. So the honest
// quantity is the wing's PLANFORM — its 2D outline in its own plane — and exactly four facts
// about it, one per clause of the failure definition:
//
//   BREADTH  widest chord ÷ span. Is there enough WING for the span it claims? Scale-free.
//            This is the owner's "restore outboard chord" in one number.
//   SOLID    mean chord ÷ widest chord. Is the planform SHAPED — swelling to a carpal and
//            falling away — or is it a constant-width STRAP? Two-sided: too low is a delta
//            that tapers to a point, too high is a plank. This is the "paper dart" clause.
//   ARCH     max forward bow of the leading edge off the straight line joining its own two
//            ends, ÷ that line. This is the "straight leading edge" clause. A bare bar reads 0.
//   CUT      how much the trailing edge cuts back INSIDE its own convex hull, ÷ planform box.
//            This is the "valleys never cut inward" clause. Convex bumps read ~0.
//
// ── WHAT IT DELIBERATELY DOES NOT MEASURE ──────────────────────────────────────────────────────
//  · Daylight, holes, gaps, armpits. A hole metric with a ceiling and no floor rewards driving
//    daylight to zero, which is the recipe for the flat plane it is supposed to prevent. Not
//    measured here at all — deliberately, so this tool can never be optimised in that direction.
//  · Anything wing-vs-body. Different question, different tool. This is the wing alone.
//  · Glow, materials, value tiers, triangle counts, the head. Form only.
//  · Left/right symmetry. Right wing only — averaging the pair hides a one-sided defect.
//
// ── WHY IT CANNOT BE GAMED THE WAY THE LAST ONE WAS ────────────────────────────────────────────
// Every number is a bounded ratio with a FLOOR AND A CEILING taken from the shipped roster, and
// BREADTH and SOLID PULL AGAINST EACH OTHER. Widen the wing uniformly to raise BREADTH and SOLID
// goes UP through its ceiling — a wide strap is still a strap. Cut the strap back to lower SOLID
// and BREADTH falls. The ONLY edit that satisfies both is chord added in the middle of the span
// and released toward the tip, which is what a carpal and a hand ARE. CUT then requires the bays
// between the fingers to actually cup inward, and it is normalised by the planform box, so a
// uniform scale-up cannot move it. Nothing here can be improved by deleting daylight, and nothing
// here rewards widening a gap.
//
// ── SUBSTRATE ──────────────────────────────────────────────────────────────────────────────────
// Triangles, not pixels — a camera, a material or a backdrop cannot flatter it. Every mesh under
// the RIGHT wing pivot (`userData.wingRole === 'pivot'`, world x > 0) is rasterised into the
// wing's OWN plane, found by PCA of those triangles, so the number is pose-robust and needs no
// per-dragon tags. The wing is, definitionally, what rotates with the wing joint.
//
// ── CALIBRATION LAW ────────────────────────────────────────────────────────────────────────────
// Any metric the reference dragon fails is wrong by definition. Bands below are the shipped
// roster's own range (tempest / vesper / revenant), widened to the nearest sensible round number.
// If a future roster dragon fails this tool, FIX THIS TOOL.
//
// ── MEASURED, at glide (and stable to ±0.02 across settle / apex / downstroke, and to ±0.01
//    across raster resolutions 160/320/640) ─────────────────────────────────────────────────────
//     key        BREADTH   SOLID   ARCH    CUT     RAG
//     tempest      0.512   0.626   0.141   0.130   0.956   premium bar
//     vesper       0.569   0.443   0.136   0.129   1.525   the wing that killed the plane read
//     revenant     0.503   0.560   0.147   0.160   1.031
//     fornax g10   0.325   0.735   0.160   0.083   2.40    BREADTH low, SOLID high — a narrow STRAP
//     fornax g11   0.600   0.670   0.162   0.096   2.644   outline fixed, edge SHREDDED (see RAG)
//
//   node reforged/tools/wingread.mjs [key|--all]         WR_POSE=settle|apex|downstroke|fold

import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);

// minimal DOM shims so the game modules import under plain Node (same set tricount uses)
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { setFlapDebugPose } = await import('../js/wingDebugPose.js');

let poseErr = null;
const POSE = process.env.WR_POSE || 'glide';   // WR_POSE=fold|downstroke|bank to prove the pose is real
const GRID = 320;            // planform raster resolution along span
const STATIONS = 20;         // chord samples reported across the span

// ── bands, from the shipped roster (see CALIBRATION LAW) ───────────────────────────────────────
const BANDS = {
  BREADTH: [0.45, 0.65],   // widest chord ÷ span   — roster 0.502 / 0.512 / 0.569
  SOLID:   [0.38, 0.68],   // mean chord ÷ widest    — roster 0.443 / 0.562 / 0.627
  ARCH:    [0.08, 0.30],   // LE bow ÷ its own line  — roster 0.136 / 0.141 / 0.147
                           // (floor 0.08, not 0.10: vesper dips to 0.103 at settle and the roster
                           //  must clear every band in every pose, not just the hero one)
  CUT:     [0.10, 0.30],   // TE concavity ÷ box     — roster 0.129 / 0.130 / 0.160
                           // (floor 0.10 = 20% under the roster's worst pose, 0.125. An earlier
                           //  draft used 0.04, which passed everything and therefore tested nothing:
                           //  a floor no one can fail is not a floor.)
  RAG:     [0.80, 2.00],   // TE path length ÷ span  — roster 0.96 / 1.03 / 1.53 at glide, and
                           // 0.96…1.70 over ALL SIX poses. Ceiling 2.00 ≈ 18% over the roster's
                           // worst; floor 0.80 ≈ 17% under its best. "Scalloped" vs "tattered".
};

function harvest(key) {
  const def = ascendedDef(DRAGONS[key], maxTierFor(DRAGONS[key]), 0);
  const built = buildDragonModel(def, { preview: true });
  const root = built.group ?? built.model ?? built;
  // pose at glide — the hero read, and the pose the studio sheets are judged in. Pure math, no
  // clock, so two runs are identical. If a dragon has no poseable path this is a no-op.
  try { setFlapDebugPose(built.parts ?? {}, def.model ?? {}, POSE); } catch (e) { poseErr = e.message; }
  root.updateMatrixWorld(true);

  let pivot = null;
  root.traverse((o) => {
    if (pivot || o.userData?.wingRole !== 'pivot') return;
    if (o.getWorldPosition(new THREE.Vector3()).x > 0) pivot = o;
  });
  if (!pivot) throw new Error('no right-side wing pivot (userData.wingRole === "pivot")');
  const SH = pivot.getWorldPosition(new THREE.Vector3());

  const tris = [];
  pivot.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index;
    const n = idx ? idx.count : pos.count;
    const v = new THREE.Vector3();
    const get = (i) => { v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld).sub(SH); return [v.x, v.y, v.z]; };
    for (let i = 0; i + 2 < n; i += 3) tris.push([get(i), get(i + 1), get(i + 2)]);
  });
  if (tris.length < 20) throw new Error(`only ${tris.length} triangles under the right pivot`);
  return { tris, key };
}

// least-variance eigenvector of the covariance of all triangle vertices = the wing's plane normal.
// Power iteration on (traceI - C) avoids pulling in a linear-algebra dependency.
function planeNormal(pts) {
  let c = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const m = [0, 0, 0];
  for (const p of pts) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; }
  m[0] /= pts.length; m[1] /= pts.length; m[2] /= pts.length;
  for (const p of pts) {
    const d = [p[0] - m[0], p[1] - m[1], p[2] - m[2]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[i][j] += d[i] * d[j];
  }
  const tr = c[0][0] + c[1][1] + c[2][2];
  const B = [[tr - c[0][0], -c[0][1], -c[0][2]], [-c[1][0], tr - c[1][1], -c[1][2]], [-c[2][0], -c[2][1], tr - c[2][2]]];
  let v = [0.31, 0.57, 0.76];
  for (let it = 0; it < 200; it++) {
    const w = [B[0][0] * v[0] + B[0][1] * v[1] + B[0][2] * v[2], B[1][0] * v[0] + B[1][1] * v[1] + B[1][2] * v[2], B[2][0] * v[0] + B[2][1] * v[1] + B[2][2] * v[2]];
    const L = Math.hypot(...w) || 1; v = [w[0] / L, w[1] / L, w[2] / L];
  }
  return v;   // largest eigenvector of B == smallest of C == the plane normal
}

function measure({ tris, key }) {
  const verts = tris.flat();
  const n = planeNormal(verts);
  // span axis: shoulder → the farthest vertex, flattened into the wing plane
  let far = verts[0], fd = -1;
  for (const p of verts) { const d = p[0] * p[0] + p[1] * p[1] + p[2] * p[2]; if (d > fd) { fd = d; far = p; } }
  const dn = far[0] * n[0] + far[1] * n[1] + far[2] * n[2];
  let u = [far[0] - dn * n[0], far[1] - dn * n[1], far[2] - dn * n[2]];
  const uL = Math.hypot(...u); u = [u[0] / uL, u[1] / uL, u[2] / uL];
  // chord axis = n × u, oriented so +chord is AFT (world +Z is behind the dragon; it flies −Z)
  let w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  if (w[2] < 0) w = [-w[0], -w[1], -w[2]];
  const proj = (p) => [p[0] * u[0] + p[1] * u[1] + p[2] * u[2], p[0] * w[0] + p[1] * w[1] + p[2] * w[2]];

  const P = tris.map((t) => t.map(proj));
  let sMax = 0, cLo = Infinity, cHi = -Infinity;
  for (const t of P) for (const [s, c] of t) { if (s > sMax) sMax = s; if (c < cLo) cLo = c; if (c > cHi) cHi = c; }
  const cell = sMax / GRID, ROWS = Math.max(8, Math.ceil((cHi - cLo) / cell));
  // per-column min/max occupied row — the outline extent, which is what the eye reads
  const lo = new Array(GRID).fill(Infinity), hi = new Array(GRID).fill(-Infinity);
  const mark = (j, r) => { if (j < 0 || j >= GRID) return; if (r < lo[j]) lo[j] = r; if (r > hi[j]) hi[j] = r; };
  for (const t of P) {
    const gx = t.map(([s]) => s / cell), gy = t.map(([, c]) => (c - cLo) / cell);
    const x0 = Math.max(0, Math.floor(Math.min(...gx))), x1 = Math.min(GRID - 1, Math.ceil(Math.max(...gx)));
    const y0 = Math.floor(Math.min(...gy)), y1 = Math.ceil(Math.max(...gy));
    const [ax, ay] = [gx[0], gy[0]], [bx, by] = [gx[1], gy[1]], [cx, cy] = [gx[2], gy[2]];
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    for (let j = x0; j <= x1; j++) for (let r = y0; r <= y1; r++) {
      const px = j + 0.5, py = r + 0.5;
      if (Math.abs(den) < 1e-12) { mark(j, r); continue; }   // degenerate sliver: still occupies
      const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den;
      const l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den;
      if (l1 >= -0.02 && l2 >= -0.02 && l1 + l2 <= 1.02) mark(j, r);
    }
  }
  // chord / LE / TE per station, in world units, over the columns that have any wing in them
  const cols = [];
  for (let j = 0; j < GRID; j++) {
    if (!Number.isFinite(lo[j])) continue;
    cols.push({ s: (j + 0.5) / GRID, chord: (hi[j] - lo[j] + 1) * cell, le: cLo + lo[j] * cell, te: cLo + (hi[j] + 1) * cell });
  }
  const at = (s) => cols.reduce((b, c) => (Math.abs(c.s - s) < Math.abs(b.s - s) ? c : b), cols[0]);
  const band = (a, b) => { const sel = cols.filter((c) => c.s >= a && c.s <= b); return sel.reduce((x, c) => x + c.chord, 0) / Math.max(1, sel.length); };

  const cMax = Math.max(...cols.map((c) => c.chord));
  const area = cols.reduce((a, c) => a + c.chord * cell, 0);
  const BREADTH = cMax / sMax;          // widest chord ÷ span — "is there enough wing"
  const SOLID = (area / sMax) / cMax;   // mean chord ÷ widest — "is the planform shaped, or a strap"
  const HOLD = band(0.62, 0.86) / cMax; // informational: outboard chord retention

  // ARCH — leading edge bow off the straight shoulder→tip line, normalised by that line's length
  const tipCol = cols[cols.length - 1];
  const A = [cols[0].s * sMax, cols[0].le], Bp = [tipCol.s * sMax, tipCol.le];
  const LL = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) || 1;
  const ex = (Bp[0] - A[0]) / LL, ez = (Bp[1] - A[1]) / LL;
  // ⚠ SIGN. +chord is AFT, so a point FORWARD of the line has the SMALLER chord coordinate and the
  // cross product comes out negative. The first draft of this line clamped forward bow to zero with
  // Math.max(0, …) and printed ARCH 0.000 for tempest, vesper AND revenant — a perfect example of
  // the failure this tool exists to catch, caught by the calibration law within one run. If the
  // reference dragon scores zero on your metric, your metric is broken.
  let ARCH = 0;
  for (const c of cols) {
    const dx = c.s * sMax - A[0], dz = c.le - A[1];
    ARCH = Math.max(ARCH, (dx * ez - dz * ex) / LL);
  }

  // CUT — area the trailing edge gives back inside its own upper convex hull, ÷ the planform box.
  // A convex TE (bumps, a delta's straight run) returns ~0 no matter how bumpy it is.
  const pts = cols.map((c) => [c.s * sMax, c.te]);
  const hull = [];
  for (const p of pts) {                                   // upper hull, monotone chain
    while (hull.length >= 2) {
      const [x1, y1] = hull[hull.length - 2], [x2, y2] = hull[hull.length - 1];
      if ((x2 - x1) * (p[1] - y1) - (y2 - y1) * (p[0] - x1) >= 0) hull.pop(); else break;
    }
    hull.push(p);
  }
  let k = 0, cutArea = 0;
  for (const p of pts) {
    while (k + 1 < hull.length && hull[k + 1][0] < p[0]) k++;
    const [x1, y1] = hull[k], [x2, y2] = hull[Math.min(k + 1, hull.length - 1)];
    const t = x2 === x1 ? 0 : (p[0] - x1) / (x2 - x1);
    cutArea += Math.max(0, (y1 + (y2 - y1) * t) - p[1]) * (sMax / cols.length);
  }
  const CUT = cutArea / (sMax * cMax);

  // RAG — the trailing edge's own path length ÷ span. Added at round 8, when CUT was found to be
  // BLIND IN ONE DIRECTION. CUT is an AREA under the hull, normalised by the whole planform box, so
  // a handful of violent narrow incisions score near zero — fornax g11 read CUT 0.096 (LOW, "needs
  // more trailing-edge shape") while its trailing edge was in fact 2.6× as jagged as the roster's
  // worst pose and its deepest single incision took 86% of the widest chord. The wing was not
  // under-scalloped, it was SHREDDED, and CUT told the builder to cut more. A tool that points the
  // fix the wrong way is worse than no tool.
  // RAG is a PERIMETER, not an area, so a narrow slot costs it as much as a wide bay: it is the one
  // number that separates "scalloped" from "tattered". Two-sided — the floor stops a bare delta
  // trading its scallops away to buy the ceiling.
  let teLen = 0;
  for (let i = 1; i < pts.length; i++) teLen += Math.abs(pts[i][1] - pts[i - 1][1]);
  const RAG = teLen / sMax;
  // informational only, deliberately NOT a band: deepest single incision ÷ widest chord. The roster
  // spans 0.308…0.747 across poses, so any ceiling that fails fornax (0.824) sits within 7% of
  // vesper at bank — too thin a margin to defend under the calibration law. Printed so the shape of
  // a RAG failure is legible (one canyon, or fifty nicks), never gated on.
  let kk = 0, DEEPEST = 0;
  for (const p of pts) {
    while (kk + 1 < hull.length && hull[kk + 1][0] < p[0]) kk++;
    const [x1, y1] = hull[kk], [x2, y2] = hull[Math.min(kk + 1, hull.length - 1)];
    const t = x2 === x1 ? 0 : (p[0] - x1) / (x2 - x1);
    DEEPEST = Math.max(DEEPEST, ((y1 + (y2 - y1) * t) - p[1]) / cMax);
  }

  const profile = [];
  for (let i = 1; i <= STATIONS; i++) { const s = i / STATIONS; profile.push([s, at(s).chord / cMax]); }
  return { key, span: sMax, cMax, BREADTH, SOLID, HOLD, ARCH, CUT, RAG, DEEPEST, profile, tris: tris.length };
}

const verdict = (v, [a, b]) => (v < a ? 'LOW ' : v > b ? 'HIGH' : ' ok ');
const keys = process.argv[2] === '--all' || !process.argv[2]
  ? ['tempest', 'vesper', 'revenant', 'fornax'] : [process.argv[2]];

console.log(`\nWINGREAD — planform outline of the RIGHT wing, from triangles, posed at ${POSE}.`);
console.log('bands are the shipped roster\'s own range, widened to round numbers (calibration law).\n');
console.log('key         span   cmax   BREADTH       SOLID         ARCH          CUT           RAG           deep   tris');
console.log('-'.repeat(112));
const rows = [];
for (const k of keys) {
  try {
    const r = measure(harvest(k));
    rows.push(r);
    console.log(`${k.padEnd(10)} ${r.span.toFixed(2).padStart(5)} ${r.cMax.toFixed(2).padStart(6)}   `
      + `${r.BREADTH.toFixed(3)} ${verdict(r.BREADTH, BANDS.BREADTH)}   `
      + `${r.SOLID.toFixed(3)} ${verdict(r.SOLID, BANDS.SOLID)}   ${r.ARCH.toFixed(3)} ${verdict(r.ARCH, BANDS.ARCH)}   `
      + `${r.CUT.toFixed(3)} ${verdict(r.CUT, BANDS.CUT)}   ${r.RAG.toFixed(3)} ${verdict(r.RAG, BANDS.RAG)}   `
      + `${r.DEEPEST.toFixed(3)}  ${String(r.tris).padStart(5)}`);
  } catch (e) { console.log(`${k.padEnd(10)} ERROR: ${e.message}`); }
}
console.log('\nchord profile, normalised to each wing\'s own widest chord (root → tip):');
for (const r of rows) console.log(`  ${r.key.padEnd(9)} ` + r.profile.filter((_, i) => i % 2 === 1).map(([s, c]) => `${(s * 100) | 0}:${c.toFixed(2)}`).join(' '));
if (poseErr) console.log(`!! setFlapDebugPose threw: ${poseErr} — numbers above are the UNPOSED build\n`);
console.log('');
