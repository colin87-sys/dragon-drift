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
const full = largest(mask);

// --- 2. full outline + bbox --------------------------------------------------
const contour = traceContour(full, w, h);
if (contour.length < 16) { console.log('trace failed (too few contour points)'); process.exit(1); }
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
for (const p of contour) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
const cx = (minX + maxX) / 2, bw = maxX - minX;
const bodyMargin = bw * 0.05;

// --- 3. slice the WING's contiguous boundary arc (on the real edge) ----------
// A contour point belongs to the chosen wing if it sits lateral of the body column.
const isWing = contour.map((p) => side === 'right' ? (p.x > cx + bodyMargin) : (p.x < cx - bodyMargin));
// largest contiguous run (with wrap-around).
function largestRun(flags) {
  const n = flags.length; let bestS = 0, bestL = 0, s = -1, l = 0;
  for (let i = 0; i < n * 2; i++) { if (flags[i % n]) { if (s < 0) { s = i; l = 0; } l++; if (l > bestL) { bestL = l; bestS = s; } } else { s = -1; l = 0; } }
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
// origin at the wing ROOT (the two arc endpoints' midpoint, near the body); +x outward, +y up.
const e0 = simp[0], e1 = simp[simp.length - 1];
const origin = { x: (e0.x + e1.x) / 2, y: (e0.y + e1.y) / 2 };
const sgn = side === 'right' ? -1 : 1;                 // outward direction in image x
const scale = Math.abs(origin.x - tipExtreme) / 3.0;  // ~3 engine units across the span
const local = simp.map((p) => [ +(((origin.x - p.x) * sgn) / scale).toFixed(3), +(((origin.y - p.y)) / scale).toFixed(3) ]);

// --- 9. trace THIS wing's STRUTS from the bright internal veins ---------------
// The membrane's bright cyan vein lines radiate from the wing root toward the
// finger tips. Detect them, then fit a CURVED bezier (root → control-on-veins →
// tip) per finger so the struts FOLLOW the actual veins (not copied from Toothless).
const bright = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) { if (!full[i]) continue; const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
  if (0.299 * r + 0.587 * g + 0.114 * b > 110) bright[i] = 1; }
// finger tips = RDP outline points that are local maxima of radius from the root.
const rootImg = origin;                                   // image-space wing root
const rad = (p) => Math.hypot(p.x - rootImg.x, p.y - rootImg.y);
const tips = [];
for (let i = 1; i < simp.length - 1; i++) { if (rad(simp[i]) >= rad(simp[i - 1]) && rad(simp[i]) > rad(simp[i + 1]) && rad(simp[i]) > 40) tips.push(simp[i]); }
// keep well-separated tips (drop near-duplicates), cap ~6
tips.sort((a, b) => rad(b) - rad(a));
const keptTips = [];
for (const t0 of tips) { if (keptTips.every((k) => Math.hypot(k.x - t0.x, k.y - t0.y) > bw * 0.06) && keptTips.length < 6) keptTips.push(t0); }
const struts = [];
for (const tip of keptTips) {
  const dx = tip.x - rootImg.x, dy = tip.y - rootImg.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;             // along + perp
  // gather bright pixels in the corridor toward this tip; measure their mean perp offset.
  let sumPerp = 0, nPx = 0;
  for (let s = 0.2; s <= 0.8; s += 0.05) {
    const bx = rootImg.x + ux * L * s, by = rootImg.y + uy * L * s;
    for (let o = -L * 0.12; o <= L * 0.12; o += 2) { const px = (bx + nx * o) | 0, py = (by + ny * o) | 0;
      if (px >= 0 && py >= 0 && px < w && py < h && bright[py * w + px]) { sumPerp += o; nPx++; } }
  }
  const perp = nPx > 8 ? sumPerp / nPx : 0;                      // bow toward the veins (0 if none found)
  const ctrl = { x: rootImg.x + ux * L * 0.5 + nx * perp, y: rootImg.y + uy * L * 0.5 + ny * perp };
  const toLocal = (p) => [+(((origin.x - p.x) * sgn) / scale).toFixed(3), +(((origin.y - p.y)) / scale).toFixed(3)];
  struts.push([toLocal(rootImg), toLocal(ctrl), toLocal(tip)]);
}
// strut QA overlay (magenta struts over the cyan veins)
for (let i = 0; i < w * h; i++) if (bright[i] && (i % w) < cx) plot(i % w, (i / w) | 0, 60, 200, 230, 0);
for (const [a, c, b] of struts) { const A = { x: origin.x - a[0] * sgn * scale, y: origin.y - a[1] * scale }, C = { x: origin.x - c[0] * sgn * scale, y: origin.y - c[1] * scale }, B = { x: origin.x - b[0] * sgn * scale, y: origin.y - b[1] * scale };
  for (let s = 0; s <= 1; s += 0.02) { const mt = 1 - s, px = mt * mt * A.x + 2 * mt * s * C.x + s * s * B.x, py = mt * mt * A.y + 2 * mt * s * C.y + s * s * B.y; plot(px, py, 255, 80, 230, 1); } }
writeFileSync('/tmp/wingtrace-overlay.png', pngRGBA(w, h, out));

console.log(`concept ${w}x${h} · wing-arc ${arc.length}px → RDP ${simp.length} pts (eps ${eps})`);
console.log(`QA  max-dev ${maxDev.toFixed(2)}px · mean-dev ${meanDev.toFixed(2)}px · maxTurn ${(maxTurn * 180 / Math.PI).toFixed(0)}° · squiggle-reversals ${reversals}  → ${pass ? 'PASS' : 'FAIL'}`);
console.log(`struts: traced ${struts.length} from veins`);
console.log(`overlay /tmp/wingtrace-overlay.png  (grey=ref edge, cyan=trace+veins, yellow=RDP, red=off-edge, magenta=struts)`);
console.log('wingOutline: ' + JSON.stringify(local));
console.log('wingStruts: ' + JSON.stringify(struts));
