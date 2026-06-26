// wingtune — AUTOMATED knob optimiser against a concept image. Sweeps a dragon's
// crystalWing knobs (dihedral / span / chord / wingScale), renders the rear
// silhouette for each, scores IoU vs the concept (same masking as conceptmatch),
// and prints the best knob set. Coarse grid → refine around the winner.
//
//   node tools/wingtune.mjs <concept.png> <key> [view]
//
// Use the printed knobs in dragons.js, then verify with tools/conceptmatch.mjs.

import { readFileSync } from 'node:fs';
import { renderSilhouette, decodePNG, DRAGONS } from './silhouetteCore.mjs';

const pos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const conceptPath = pos[0], key = pos[1] || 'prism', view = pos[2] || 'rear';
if (!conceptPath || !DRAGONS[key]) { console.log('usage: node tools/wingtune.mjs <concept.png> <key> [view]'); process.exit(1); }

// --- concept subject mask (white/transparent-bg aware) + largest component ---
const { w: cw, h: ch, rgba } = decodePNG(readFileSync(conceptPath));
const corner = (x, y) => { const i = (y * cw + x) * 4; return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]; };
const corners = [corner(1, 1), corner(cw - 2, 1), corner(1, ch - 2), corner(cw - 2, ch - 2)];
const hasAlpha = corners.some((c) => c[3] < 32);
const bg = corners.reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
const subj = new Uint8Array(cw * ch);
for (let i = 0; i < cw * ch; i++) {
  const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
  if (hasAlpha) { subj[i] = a > 64 ? 1 : 0; continue; }
  const dBg = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
  subj[i] = (dBg > 60 || (Math.max(r, g, b) - Math.min(r, g, b)) > 24) ? 1 : 0;
}
function largest(mask, w, h) {
  const seen = new Uint8Array(w * h); let best = null, bestN = 0; const st = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue; st.length = 0; st.push(s); seen[s] = 1; const cell = []; let n = 0;
    while (st.length) { const p = st.pop(); cell.push(p); n++; const x = p % w, y = (p / w) | 0;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; st.push(p - 1); }
      if (x < w - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; st.push(p + 1); }
      if (y > 0 && mask[p - w] && !seen[p - w]) { seen[p - w] = 1; st.push(p - w); }
      if (y < h - 1 && mask[p + w] && !seen[p + w]) { seen[p + w] = 1; st.push(p + w); } }
    if (n > bestN) { bestN = n; best = cell; } }
  const out = new Uint8Array(w * h); if (best) for (const p of best) out[p] = 1; return out;
}
const refMask = largest(subj, cw, ch);

const TW = 300, TH = 420, MARGIN = 0.92;
function bbox(mask, w, h) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; }
  return b >= a ? { minX: a, maxX: b, minY: c, maxY: d, w: b - a + 1, h: d - c + 1 } : null; }
function normalize(mask, w, h, bb) { const out = new Uint8Array(TW * TH); if (!bb) return out;
  const s = Math.min((TW * MARGIN) / bb.w, (TH * MARGIN) / bb.h), ox = (TW - bb.w * s) / 2, oy = (TH - bb.h * s) / 2;
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) { const sx = Math.round(bb.minX + (tx - ox) / s), sy = Math.round(bb.minY + (ty - oy) / s);
    if (sx >= 0 && sx < w && sy >= 0 && sy < h && mask[sy * w + sx]) out[ty * TW + tx] = 1; } return out; }
const refN = normalize(refMask, cw, ch, bbox(refMask, cw, ch));

const RW = 560, RH = 760;
function score() {
  const { buf } = renderSilhouette({ key, view, W: RW, H: RH });
  const bm = new Uint8Array(RW * RH); for (let i = 0; i < buf.length; i++) bm[i] = buf[i] ? 1 : 0;
  const bn = normalize(bm, RW, RH, bbox(bm, RW, RH));
  let inter = 0, uni = 0; for (let i = 0; i < TW * TH; i++) { const a = refN[i], b = bn[i]; if (a || b) uni++; if (a && b) inter++; }
  return uni ? inter / uni : 0;
}

const M = DRAGONS[key].model;
function trial(d, s, c, w) { M.wingDihedral = d; M.wingSpanScale = s; M.wingChordScale = c; M.wingScale = w; return score(); }

const baseW = M.wingScale ?? 1.16;
let best = { iou: -1 }, evals = 0;
function sweep(Ds, Ss, Cs, Ws) {
  for (const d of Ds) for (const s of Ss) for (const c of Cs) for (const w of Ws) {
    const iou = trial(d, s, c, w); evals++;
    if (iou > best.iou) best = { iou, d, s, c, w };
  }
}
// coarse
sweep([0.5, 0.7, 0.9, 1.1, 1.3], [0.42, 0.52, 0.62, 0.72], [1.4, 1.7, 2.0, 2.3], [baseW]);
console.log(`coarse best ${(best.iou * 100).toFixed(1)}%  D${best.d} S${best.s} C${best.c} (${evals} evals)`);
// refine around the winner
const around = (v, step, lo, hi) => [v - step, v, v + step].filter((x) => x >= lo && x <= hi);
sweep(around(best.d, 0.1, 0.3, 1.6), around(best.s, 0.05, 0.35, 0.85), around(best.c, 0.15, 1.2, 2.6), around(baseW, 0.12, 0.7, 1.6));
console.log(`refined best IoU ${(best.iou * 100).toFixed(1)}%  (${evals} evals)`);
console.log(`  wingDihedral: ${best.d.toFixed(2)}, wingSpanScale: ${best.s.toFixed(2)}, wingChordScale: ${best.c.toFixed(2)}, wingScale: ${best.w.toFixed(2)}`);
