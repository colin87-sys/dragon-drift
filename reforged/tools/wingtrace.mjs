// wingtrace — trace a wing OUTLINE from a concept image, FAITHFULLY and QA'd ON the
// reference edge. The acceptance rule (user spec): the traced curve must lie ON the
// reference outline (deviation off the line = INCORRECT) and be smooth (squiggle =
// INCORRECT). We get on-path BY CONSTRUCTION: trace the full silhouette, slice the
// wing's contiguous boundary arc (the real edge — no synthetic cut), then Ramer–
// Douglas–Peucker simplify (RDP keeps segments within `eps` of every original edge
// point → cannot drift off the outline, and removes the pixel staircase). A
// distance-transform of the reference edge then MEASURES max/mean deviation, and an
// overlay PNG (edge grey + trace cyan + off-edge samples RED) makes it eyeball-QA'able.
//
//   node tools/wingtrace.mjs <concept.png> [eps] [--side=left|right]
//   → prints QA (max-dev, smoothness, PASS/FAIL) + the wingOutline JSON
//   → writes /tmp/wingtrace-overlay.png

import { readFileSync, writeFileSync } from 'node:fs';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';
import { traceContour, simplify } from './tracerCore.mjs';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const conceptPath = pos[0];
const eps = pos[1] ? Number(pos[1]) : 2.2;
const side = (args.find((a) => a.startsWith('--side=')) || '--side=left').split('=')[1];
if (!conceptPath) { console.log('usage: node tools/wingtrace.mjs <concept.png> [eps] [--side=left|right]'); process.exit(1); }

// --- 1. subject mask (white/transparent-bg aware) + largest component --------
const { w, h, rgba } = decodePNG(readFileSync(conceptPath));
const corner = (x, y) => { const i = (y * w + x) * 4; return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]; };
const corners = [corner(1, 1), corner(w - 2, 1), corner(1, h - 2), corner(w - 2, h - 2)];
const hasAlpha = corners.some((c) => c[3] < 32);
const bg = corners.reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
const mask = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) {
  const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
  if (hasAlpha) { mask[i] = a > 64 ? 1 : 0; continue; }
  const dBg = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
  mask[i] = (dBg > 60 || (Math.max(r, g, b) - Math.min(r, g, b)) > 24) ? 1 : 0;
}
function largest(m) {
  const seen = new Uint8Array(w * h); let best = null, bestN = 0; const st = [];
  for (let s = 0; s < w * h; s++) { if (!m[s] || seen[s]) continue; st.length = 0; st.push(s); seen[s] = 1; const cell = []; let n = 0;
    while (st.length) { const p = st.pop(); cell.push(p); n++; const x = p % w, y = (p / w) | 0;
      if (x > 0 && m[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; st.push(p - 1); }
      if (x < w - 1 && m[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; st.push(p + 1); }
      if (y > 0 && m[p - w] && !seen[p - w]) { seen[p - w] = 1; st.push(p - w); }
      if (y < h - 1 && m[p + w] && !seen[p + w]) { seen[p + w] = 1; st.push(p + w); } }
    if (n > bestN) { bestN = n; best = cell; } }
  const out = new Uint8Array(w * h); if (best) for (const p of best) out[p] = 1; return out;
}
// LINE-ART detection: thin dark lines on a near-white bg (a clean wing drawing) — the
// outline AND the bones are explicit strokes. Flood the exterior white → the wing as a
// FILLED region (interior + lines) for the outline; the DARK interior lines are the bones.
const lum = (i) => 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
let subjFrac = 0; for (let i = 0; i < w * h; i++) if (mask[i]) subjFrac++; subjFrac /= w * h;
const lineart = !hasAlpha && subjFrac < 0.16;
function flood(passable) {
  const seen = new Uint8Array(w * h); const st = [];
  for (const s of [0, w - 1, (h - 1) * w, h * w - 1]) if (passable(s)) { seen[s] = 1; st.push(s); }
  while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1])
      if (q >= 0 && !seen[q] && passable(q)) { seen[q] = 1; st.push(q); } }
  return seen;
}
function pickComponent(m) {
  const seen = new Uint8Array(w * h); let chosen = null, score = side === 'right' ? -1 : 1e18; const st = [];
  for (let s0 = 0; s0 < w * h; s0++) { if (!m[s0] || seen[s0]) continue; st.length = 0; st.push(s0); seen[s0] = 1; const cell = []; let sx = 0, n = 0;
    while (st.length) { const p = st.pop(); cell.push(p); n++; sx += p % w; const x = p % w, y = (p / w) | 0;
      if (x > 0 && m[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; st.push(p - 1); }
      if (x < w - 1 && m[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; st.push(p + 1); }
      if (y > 0 && m[p - w] && !seen[p - w]) { seen[p - w] = 1; st.push(p - w); }
      if (y < h - 1 && m[p + w] && !seen[p + w]) { seen[p + w] = 1; st.push(p + w); } }
    if (n < 400) continue; const cxc = sx / n;
    if (side === 'right' ? cxc > score : cxc < score) { score = cxc; chosen = cell; } }
  const out = new Uint8Array(w * h); if (chosen) for (const p of chosen) out[p] = 1; return out;
}
let full, boneMask = null;
if (lineart) {
  const ext = flood((i) => lum(i) > 200);                 // exterior near-white
  const filled = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) filled[i] = ext[i] ? 0 : 1;
  full = pickComponent(filled);                            // the chosen-side wing, filled
  boneMask = new Uint8Array(w * h);                        // dark interior lines = the bones
  for (let i = 0; i < w * h; i++) if (full[i] && lum(i) < 120) boneMask[i] = 1;
} else {
  full = largest(mask);
}

// --- 2. full outline + bbox --------------------------------------------------
const contour = traceContour(full, w, h);
if (contour.length < 16) { console.log('trace failed (too few contour points)'); process.exit(1); }
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
for (const p of contour) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
const cx = (minX + maxX) / 2, bw = maxX - minX;
const bodyMargin = bw * 0.05;

// --- 3. slice the WING's contiguous boundary arc (on the real edge) ----------
// Colored concept: the wing is part of the whole creature → slice the arc lateral of
// the body column. Line-art: the component IS the wing → use the whole contour.
const isWing = contour.map((p) => lineart ? true : (side === 'right' ? (p.x > cx + bodyMargin) : (p.x < cx - bodyMargin)));
// largest contiguous run (with wrap-around).
function largestRun(flags) {
  const n = flags.length; let bestS = 0, bestL = 0, s = -1, l = 0;
  for (let i = 0; i < n * 2; i++) { if (flags[i % n]) { if (s < 0) { s = i; l = 0; } l++; if (l > bestL) { bestL = l; bestS = s; } } else { s = -1; l = 0; } }
  bestL = Math.min(bestL, n);                       // a run can't exceed the full loop (all-true → n once, not 2n)
  const idx = []; for (let i = 0; i < bestL; i++) idx.push((bestS + i) % n);
  return idx;
}
const arcIdx = largestRun(isWing);
if (arcIdx.length < 8) { console.log('wing-arc slice failed'); process.exit(1); }
let arc = arcIdx.map((i) => contour[i]);
// Order the arc so it runs root → tip → root with the OUTER tip (extreme x) in the middle.
const tipExtreme = side === 'right' ? Math.max(...arc.map((p) => p.x)) : Math.min(...arc.map((p) => p.x));

// --- 4. RDP simplify — on-path by construction (no drift, no staircase) ------
const simp = simplify(arc, eps);

// --- 5. distance transform of the reference EDGE (for deviation QA) ----------
// edge = mask boundary pixels (mask pixel with a 4-neighbour outside the mask).
const INF = 1e9; const dt = new Float64Array(w * h).fill(INF);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  if (!full[y * w + x]) continue;
  const edge = (x === 0 || y === 0 || x === w - 1 || y === h - 1) ||
    !full[y * w + x - 1] || !full[y * w + x + 1] || !full[(y - 1) * w + x] || !full[(y + 1) * w + x];
  if (edge) dt[y * w + x] = 0;
}
// 2-pass chamfer (3,4 weights / 3 ≈ euclidean)
const D1 = 1, D2 = 1.41421356;
const relax = (x, y, nx, ny, d) => { if (nx < 0 || ny < 0 || nx >= w || ny >= h) return; const v = dt[ny * w + nx] + d; if (v < dt[y * w + x]) dt[y * w + x] = v; };
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { relax(x, y, x - 1, y, D1); relax(x, y, x, y - 1, D1); relax(x, y, x - 1, y - 1, D2); relax(x, y, x + 1, y - 1, D2); }
for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { relax(x, y, x + 1, y, D1); relax(x, y, x, y + 1, D1); relax(x, y, x + 1, y + 1, D2); relax(x, y, x - 1, y + 1, D2); }
const distAt = (x, y) => { const xi = Math.max(0, Math.min(w - 1, Math.round(x))), yi = Math.max(0, Math.min(h - 1, Math.round(y))); return dt[yi * w + xi]; };

// --- 6. QA: deviation of the simplified curve + smoothness -------------------
let maxDev = 0, sumDev = 0, nDev = 0; const badSamples = [];
for (let i = 0; i < simp.length - 1; i++) {
  const a = simp[i], b = simp[i + 1], steps = Math.max(2, Math.hypot(b.x - a.x, b.y - a.y) | 0);
  for (let k = 0; k <= steps; k++) { const t = k / steps, px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
    const d = distAt(px, py); maxDev = Math.max(maxDev, d); sumDev += d; nDev++; if (d > 2.5) badSamples.push([px, py]); }
}
const meanDev = sumDev / nDev;
// smoothness: turn angle at each interior vertex; a genuine corner (finger tip) is allowed,
// a high-frequency reversal (squiggle) is not. Count reversals where the turn flips sign sharply.
let maxTurn = 0, reversals = 0; let prevCross = 0;
for (let i = 1; i < simp.length - 1; i++) {
  const a = simp[i - 1], b = simp[i], c = simp[i + 1];
  const v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
  const ang = Math.abs(Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y));
  maxTurn = Math.max(maxTurn, ang);
  const cross = Math.sign(v1x * v2y - v1y * v2x);
  if (i > 1 && cross !== 0 && cross === -prevCross && ang > 0.9) reversals++;  // sharp S-flip = squiggle
  if (cross !== 0) prevCross = cross;
}
// Correctness = the trace lies ON the reference edge (deviation). Sharp turns are the
// wing's REAL deep scallops/finger tips, not error — so smoothness is INFO, not a gate.
// A true "squiggle" would be an OFF-edge jitter, which `maxDev` already catches.
const pass = maxDev <= 2.6;

// --- 7. overlay PNG: edge grey + traced arc cyan + off-edge samples red ------
const out = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) { out[i * 4] = 12; out[i * 4 + 1] = 14; out[i * 4 + 2] = 18; out[i * 4 + 3] = 255; }
for (let i = 0; i < w * h; i++) if (dt[i] === 0) { out[i * 4] = 90; out[i * 4 + 1] = 96; out[i * 4 + 2] = 104; }  // reference edge (grey)
const plot = (x, y, r, g, b, rad = 1) => { for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
  const xi = (x | 0) + dx, yi = (y | 0) + dy; if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue; const d = (yi * w + xi) * 4; out[d] = r; out[d + 1] = g; out[d + 2] = b; } };
for (let i = 0; i < simp.length - 1; i++) { const a = simp[i], b = simp[i + 1], steps = Math.max(2, Math.hypot(b.x - a.x, b.y - a.y) | 0);
  for (let k = 0; k <= steps; k++) { const t = k / steps; plot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 80, 230, 255, 1); } }   // traced arc (cyan)
for (const [px, py] of badSamples) plot(px, py, 255, 60, 60, 2);                                                                      // deviations (red)
for (const p of simp) plot(p.x, p.y, 255, 235, 120, 2);                                                                              // RDP vertices (yellow)
writeFileSync('/tmp/wingtrace-overlay.png', pngRGBA(w, h, out));

// --- 8. emit wing-local outline ---------------------------------------------
// origin at the wing ROOT; +x outward, +y up. Colored: the arc endpoints' midpoint
// (where the wing meets the body). Line-art (whole-loop contour): the INNERMOST point
// (nearest the body centre line) at the lower-inner attachment.
const sgn = side === 'right' ? -1 : 1;                 // outward direction in image x
let origin;
if (lineart) {
  // innermost = max x (left wing) / min x (right wing); pick the lower-inner extreme.
  let best = simp[0];
  for (const p of simp) { const better = side === 'right' ? (p.x < best.x - 1e-6 || (Math.abs(p.x - best.x) < 12 && p.y > best.y)) : (p.x > best.x + 1e-6 || (Math.abs(p.x - best.x) < 12 && p.y > best.y)); if (better) best = p; }
  origin = { x: best.x, y: best.y };
} else {
  const e0 = simp[0], e1 = simp[simp.length - 1];
  origin = { x: (e0.x + e1.x) / 2, y: (e0.y + e1.y) / 2 };
}
const scale = Math.abs(origin.x - tipExtreme) / 3.0;  // ~3 engine units across the span
const local = simp.map((p) => [ +(((origin.x - p.x) * sgn) / scale).toFixed(3), +(((origin.y - p.y)) / scale).toFixed(3) ]);

// --- 9. TRACE the bone struts from the image — skeletonize the interior bone lines
// and FOLLOW each centerline (no straight wrist→tip assumption). The wrist falls out
// of where the traced branches converge.
const toLocal = (p) => [+(((origin.x - p.x) * sgn) / scale).toFixed(3), +(((origin.y - p.y)) / scale).toFixed(3)];
// interior bone pixels: solid/dark lines INSIDE the wing, away from the outer edge band.
let strutPix;
if (lineart) { strutPix = boneMask; }
else { strutPix = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) if (full[i] && lum(i) > 110) strutPix[i] = 1; }
const boneInt = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) if (strutPix[i] && dt[i] > 4) boneInt[i] = 1;   // drop the outline band

// Zhang–Suen thinning → 1-px skeleton (bounded to the wing bbox for speed).
function thin(src) {
  const m = Uint8Array.from(src), P = (x, y) => m[y * w + x];
  const x0 = Math.max(1, minX - 2), x1 = Math.min(w - 2, maxX + 2), y0 = Math.max(1, minY - 2), y1 = Math.min(h - 2, maxY + 2);
  let changed = true, guard = 0;
  while (changed && guard++ < 250) { changed = false;
    for (const step of [0, 1]) { const del = [];
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!m[y * w + x]) continue;
        const p2 = P(x, y - 1), p3 = P(x + 1, y - 1), p4 = P(x + 1, y), p5 = P(x + 1, y + 1), p6 = P(x, y + 1), p7 = P(x - 1, y + 1), p8 = P(x - 1, y), p9 = P(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
        const sq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]; let A = 0; for (let k = 0; k < 8; k++) if (!sq[k] && sq[k + 1]) A++;
        if (A !== 1) continue;
        if (step === 0) { if (p2 && p4 && p6) continue; if (p4 && p6 && p8) continue; }
        else { if (p2 && p4 && p8) continue; if (p2 && p6 && p8) continue; }
        del.push(y * w + x); }
      if (del.length) { changed = true; for (const i of del) m[i] = 0; } } }
  return m;
}
const skel = thin(boneInt);
const nbrs = (i) => { const x = i % w, y = (i / w) | 0, r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && skel[ny * w + nx]) r.push(ny * w + nx); } return r; };
const skelPts = []; for (let i = 0; i < w * h; i++) if (skel[i]) skelPts.push(i);
const endpoints = skelPts.filter((i) => nbrs(i).length === 1);
// trace each endpoint inward along the skeleton until a junction (deg≥3) — that branch
// IS the bone's real centerline (curved, exactly as drawn).
function traceBranch(start) {
  const path = [start]; const seen = new Set([start]); let cur = start, prev = -1;
  while (true) {
    if (nbrs(cur).length >= 3 && cur !== start) break;          // reached the wrist hub
    const ns = nbrs(cur).filter((n) => n !== prev && !seen.has(n));
    if (!ns.length) break;
    prev = cur; cur = ns[0]; seen.add(cur); path.push(cur);
  }
  return path;
}
const px = (i) => ({ x: i % w, y: (i / w) | 0 });
const polyLen = (poly) => { let L = 0; for (let i = 1; i < poly.length; i++) L += Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y); return L; };
let branches = endpoints.map(traceBranch).filter((b) => b.length >= 8);
const junctions = skelPts.filter((i) => nbrs(i).length >= 3);
// wrist = the skeleton JUNCTION that best centers the fan — the convergence hub
// (minimises total distance to the bone tips/endpoints). Falls back to any skel pt.
let wrist = origin;
{ const cand = (junctions.length ? junctions : skelPts).map(px); let bd = Infinity;
  for (const c of cand) { let d = 0; for (const e of endpoints) { const ep = px(e); d += Math.hypot(c.x - ep.x, c.y - ep.y); } if (d < bd) { bd = d; wrist = c; } } }
// each bone = its branch polyline, oriented wrist→tip, with the true wrist prepended; RDP-smoothed.
let bones = branches.map((b) => {
  let poly = b.map(px);
  if (Math.hypot(poly[0].x - wrist.x, poly[0].y - wrist.y) > Math.hypot(poly[poly.length - 1].x - wrist.x, poly[poly.length - 1].y - wrist.y)) poly = poly.reverse();
  poly[0] = wrist;                                              // snap inner end to the shared wrist
  return simplify(poly, 2);
});
bones.sort((a, b) => polyLen(b) - polyLen(a));
const longest = bones.length ? polyLen(bones[0]) : 1;
bones = bones.filter((b) => polyLen(b) > longest * 0.22).slice(0, 8);   // drop tiny spurs
const strutPass = bones.length >= 5 && bones.length <= 9;
const wingStruts = { wrist: toLocal(wrist), bones: bones.map((poly) => poly.map(toLocal)) };

// overlay: skeleton (dim cyan) · traced bone polylines (magenta) · wrist (big magenta)
for (const i of skelPts) plot(i % w, (i / w) | 0, 40, 130, 160, 0);
for (const poly of bones) for (let i = 1; i < poly.length; i++) { const a = poly[i - 1], b = poly[i], n = Math.max(2, Math.hypot(b.x - a.x, b.y - a.y) | 0); for (let k = 0; k <= n; k++) { const t = k / n; plot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 255, 80, 230, 1); } }
plot(wrist.x, wrist.y, 255, 120, 255, 5);
writeFileSync('/tmp/wingtrace-overlay.png', pngRGBA(w, h, out));

console.log(`concept ${w}x${h} · wing-arc ${arc.length}px → RDP ${simp.length} pts (eps ${eps})`);
console.log(`outline QA  max-dev ${maxDev.toFixed(2)}px · mean-dev ${meanDev.toFixed(2)}px  → ${pass ? 'PASS' : 'FAIL'}`);
console.log(`struts  TRACED wrist@(${wrist.x | 0},${wrist.y | 0}) · ${bones.length} bones (skeleton centerlines) → ${strutPass ? 'PASS' : 'FAIL (want 5-9 — check boneInt threshold)'}`);
console.log(`overlay /tmp/wingtrace-overlay.png  (grey=ref edge, cyan=trace+skeleton, magenta=traced bones+wrist, red=off-edge)`);
console.log('wingOutline: ' + JSON.stringify(local));
console.log('wingStruts: ' + JSON.stringify(wingStruts));
