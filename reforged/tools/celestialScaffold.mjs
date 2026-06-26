// celestialScaffold — convert the HARVESTED celestial-storm wing scaffold into the wing-local
// convention crystalWing consumes (origin = wing root, +x outward, +y up, span≈3).
//
//   node reforged/tools/celestialScaffold.mjs
//
// The OUTLINE comes from the canvas trace (wing-outline-R.json, 0..1, +y down) — the silhouette
// the human approved. The BONE STRUTS come from the celestial-storm branch's FINAL bones
// (wing-def-R.json → CELESTIAL_DEF.wing.bones), which live in the def's own rotated/scaled frame.
// We register that frame onto the canvas frame via an affine fit between the two silhouette
// traces (same shape, opposite winding) so the final struts land correctly UNDER the approved
// outline. Geometry is portable; the old branch's design is not — we reuse only outline + bones.

import { readFileSync, writeFileSync } from 'node:fs';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';

const REF = new URL('./refs/celestial/', import.meta.url);
const OUT_SCRATCH = '/tmp/claude-0/-home-user-dragon-drift/e6eba243-b2cd-5cbf-aeba-4011843f385d/scratchpad';

const outlineSrc = JSON.parse(readFileSync(new URL('wing-outline-R.json', REF))).outline;          // canvas 0..1, +y down
const def = JSON.parse(readFileSync(new URL('wing-def-R.json', REF)));                              // def-frame silhouette + FINAL bones
const defSil = def.silhouette;
const defBones = def.bones.map((b) => b.pts);
const defBoneShapes = def.boneShapes;                                                               // the human-tagged FILLED bone shapes (what the branch renders)

// ---- helpers ----
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polyLen = (p) => p.reduce((a, q, i) => (i ? a + dist(q, p[i - 1]) : 0), 0);
function rdp(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  const d = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy; if (!l2) return dist(p, a);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)); };
  while (st.length) { const [lo, hi] = st.pop(); let md = -1, idx = -1; for (let i = lo + 1; i < hi; i++) { const dd = d(pts[i], pts[lo], pts[hi]); if (dd > md) { md = dd; idx = i; } } if (md > eps && idx > 0) { keep[idx] = 1; st.push([lo, idx], [idx, hi]); } }
  const o = []; for (let i = 0; i < pts.length; i++) if (keep[i]) o.push(pts[i]); return o;
}
const centroid = (ps) => [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length];
const round = (p) => [+p[0].toFixed(3), +p[1].toFixed(3)];

// ---- register def frame → canvas frame (affine, searching winding/offset) ----
function fitAffine(corr) {
  let Sxx = 0, Sxy = 0, Sx = 0, Syy = 0, Sy = 0; const n = corr.length, bx = [0, 0, 0], by = [0, 0, 0];
  for (const [d, a] of corr) { const dx = d[0], dy = d[1]; Sxx += dx * dx; Sxy += dx * dy; Sx += dx; Syy += dy * dy; Sy += dy;
    bx[0] += dx * a[0]; bx[1] += dy * a[0]; bx[2] += a[0]; by[0] += dx * a[1]; by[1] += dy * a[1]; by[2] += a[1]; }
  const M = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]];
  const solve = (M, b) => { const m = M.map((r, i) => [...r, b[i]]); for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r; [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < 3; r++) { if (r === c) continue; const f = m[r][c] / m[c][c]; for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k]; } } return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]]; };
  return { x: solve(M, bx), y: solve(M, by) };
}
const N = outlineSrc.length;
let best = { r: 1e9 };
for (const dir of [1, -1]) for (let off = 0; off < N; off++) {
  const corr = []; for (let i = 0; i < N; i++) { const di = dir === 1 ? (i + off) % N : ((off - i) % N + N) % N; corr.push([defSil[di], outlineSrc[i]]); }
  const aff = fitAffine(corr); let s = 0; for (const [d, a] of corr) { const q = [aff.x[0] * d[0] + aff.x[1] * d[1] + aff.x[2], aff.y[0] * d[0] + aff.y[1] * d[1] + aff.y[2]]; s += Math.hypot(q[0] - a[0], q[1] - a[1]); }
  if (s / N < best.r) best = { r: s / N, dir, off, aff };
}
const def2canvas = (p) => [best.aff.x[0] * p[0] + best.aff.x[1] * p[1] + best.aff.x[2], best.aff.y[0] * p[0] + best.aff.y[1] * p[1] + best.aff.y[2]];

// ---- canvas → wing-local (origin=root, +x out, +y up, span≈3) — SAME transform for outline & bones ----
let R = outlineSrc[0], T = outlineSrc[0];
for (const p of outlineSrc) { if (p[0] < R[0]) R = p; if (p[0] > T[0]) T = p; }
const s = 3 / (T[0] - R[0]);
const toLocal = (p) => [(p[0] - R[0]) * s, -(p[1] - R[1]) * s];

// outline (approved silhouette) → simplify
const outlineLocalFull = outlineSrc.map(toLocal);
let eps = 0.05, outlineLocal = rdp(outlineLocalFull, eps);
while (outlineLocal.length > 70 && eps < 0.2) { eps += 0.01; outlineLocal = rdp(outlineLocalFull, eps); }
while (outlineLocal.length < 45 && eps > 0.01) { eps -= 0.005; outlineLocal = rdp(outlineLocalFull, eps); }
const wingOutline = outlineLocal.map(round);

// FINAL bones: def-frame → canvas → local
const bonesLocal = defBones.map((p) => p.map((q) => toLocal(def2canvas(q))));
// wrist = convergence of the bone inner endpoints (in local frame)
let W = centroid(bonesLocal.flatMap((p) => [p[0], p[p.length - 1]]));
for (let it = 0; it < 3; it++) { const inners = bonesLocal.map((p) => (dist(p[0], W) <= dist(p[p.length - 1], W) ? p[0] : p[p.length - 1])); W = centroid(inners); }
const wristLocal = round(W);
const bones = bonesLocal.map((p) => {
  const inner = dist(p[0], W) <= dist(p[p.length - 1], W);
  let loc = (inner ? p.slice() : p.slice().reverse());
  if (dist(loc[0], W) < 0.12) loc[0] = W; else loc.unshift(W);
  return rdp(loc, 0.02).map(round);
}).filter((b) => polyLen(b) > 0.15).sort((a, b) => polyLen(b) - polyLen(a));
// FINAL bone SHAPES (human-tagged filled outlines = what the celestial branch renders): def→canvas→local,
// closed polygons, lightly simplified to keep the sharp tips.
const boneShapes = defBoneShapes.map((poly) => {
  const loc = poly.map((q) => toLocal(def2canvas(q)));
  return rdp(loc, 0.012).map(round);
});
const wingStruts = { wrist: wristLocal, boneShapes, bones };

// ---- emit ----
const fmt = (a) => JSON.stringify(a);
console.log(`// registration: dir ${best.dir} off ${best.off} residual ${(best.r * 941).toFixed(1)}px (def→canvas)`);
console.log(`// outline ${outlineSrc.length}→${wingOutline.length} pts (eps ${eps.toFixed(3)}); FINAL struts ${bones.length}; wrist ${fmt(wristLocal)}`);
console.log(`// strut local lengths: ${bones.map((b) => polyLen(b).toFixed(2)).join(', ')}`);
console.log('\nwingOutline: ' + fmt(wingOutline) + ',');
console.log('\nwingStruts: ' + fmt(wingStruts) + ',');
writeFileSync(`${OUT_SCRATCH}/celestial-scaffold.json`, JSON.stringify({ wingOutline, wingStruts }, null, 0));

// ---- QA overlay on the stencil: source outline (green) + FINAL bones mapped back to canvas (magenta) + wrist (cyan)
const { w: cw, h: ch, rgba } = decodePNG(readFileSync(new URL('stencil-wings.png', REF)));
const img = new Uint8Array(cw * ch * 4);
for (let i = 0; i < cw * ch; i++) { const v = rgba[i * 4] * 0.35 + 28; img[i * 4] = v; img[i * 4 + 1] = v; img[i * 4 + 2] = v + 6; img[i * 4 + 3] = 255; }
const plotPx = (x, y, col, r = 1) => { const px = Math.round(x * cw), py = Math.round(y * ch); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = px + dx, Y = py + dy; if (X >= 0 && Y >= 0 && X < cw && Y < ch) { const i = (Y * cw + X) * 4; img[i] = col[0]; img[i + 1] = col[1]; img[i + 2] = col[2]; } } };
const drawPoly = (pts, col, r = 1) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.ceil(dist(a, b) * Math.max(cw, ch)); for (let k = 0; k <= n; k++) { const t = k / n; plotPx(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, col, r); } } };
drawPoly([...outlineSrc, outlineSrc[0]], [80, 240, 140], 1);                          // approved membrane outline
for (const bs of defBoneShapes) drawPoly([...bs, bs[0]].map(def2canvas), [255, 80, 210], 1);   // FINAL human-tagged bone shapes
const Wc = def2canvas(centroid(defBones.flatMap((p) => [p[0], p[p.length - 1]])));
plotPx(Wc[0], Wc[1], [120, 200, 255], 5);
writeFileSync(`${OUT_SCRATCH}/celestial-scaffold-overlay.png`, pngRGBA(cw, ch, Buffer.from(img)));

// ---- wing-local plot (what crystalWing renders)
const LW = 760, LH = 760, limg = new Uint8Array(LW * LH * 4);
for (let i = 0; i < LW * LH; i++) { limg[i * 4] = 16; limg[i * 4 + 1] = 18; limg[i * 4 + 2] = 26; limg[i * 4 + 3] = 255; }
const allL = [...wingOutline, ...bones.flat(), wristLocal];
let lx0 = 1e9, lx1 = -1e9, ly0 = 1e9, ly1 = -1e9; for (const p of allL) { lx0 = Math.min(lx0, p[0]); lx1 = Math.max(lx1, p[0]); ly0 = Math.min(ly0, p[1]); ly1 = Math.max(ly1, p[1]); }
const sc = 0.86 * Math.min(LW / (lx1 - lx0), LH / (ly1 - ly0)); const ox = (LW - (lx1 - lx0) * sc) / 2, oy = (LH - (ly1 - ly0) * sc) / 2;
const L2P = (p) => [(p[0] - lx0) * sc + ox, LH - ((p[1] - ly0) * sc + oy)];
const lplot = (P, col, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(P[0]) + dx, Y = Math.round(P[1]) + dy; if (X >= 0 && Y >= 0 && X < LW && Y < LH) { const i = (Y * LW + X) * 4; limg[i] = col[0]; limg[i + 1] = col[1]; limg[i + 2] = col[2]; } } };
const lpoly = (pts, col, r) => { for (let i = 1; i < pts.length; i++) { const a = L2P(pts[i - 1]), b = L2P(pts[i]), n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let k = 0; k <= n; k++) { const t = k / n; lplot([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], col, r); } } };
lpoly([...wingOutline, wingOutline[0]], [120, 220, 255], 1);
for (const b of boneShapes) lpoly([...b, b[0]], [255, 90, 210], 1);   // filled bone shapes (the human-tagged finals)
lplot(L2P(wristLocal), [255, 255, 120], 4); lplot(L2P([0, 0]), [120, 255, 160], 4);
writeFileSync(`${OUT_SCRATCH}/celestial-scaffold-local.png`, pngRGBA(LW, LH, Buffer.from(limg)));
console.log('\nwrote celestial-scaffold.json + overlay.png (on stencil) + local.png (wing-local)');
