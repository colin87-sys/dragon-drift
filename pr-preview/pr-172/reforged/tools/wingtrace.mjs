// wingtrace — extract the LEFT-wing OUTLINE from a concept image as a polygon for
// crystalWing's `wingOutline` mode. Because crystalWing lays the membrane in the
// screen plane, rendering this traced polygon reproduces the concept's wing
// silhouette almost directly. Prints a JSON points array (wing-local: +x outward,
// +y up, origin at the wing root) to paste into the dragon's `wingOutline`.
//
//   node tools/wingtrace.mjs <concept.png> [maxPoints]

import { readFileSync } from 'node:fs';
import { decodePNG } from './silhouetteCore.mjs';
import { traceContour, simplifyToBudget } from './tracerCore.mjs';

const pos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const conceptPath = pos[0];
const maxPoints = pos[1] ? Number(pos[1]) : 20;
if (!conceptPath) { console.log('usage: node tools/wingtrace.mjs <concept.png> [maxPoints]'); process.exit(1); }

const { w: cw, h: ch, rgba } = decodePNG(readFileSync(conceptPath));
const corner = (x, y) => { const i = (y * cw + x) * 4; return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]; };
const corners = [corner(1, 1), corner(cw - 2, 1), corner(1, ch - 2), corner(cw - 2, ch - 2)];
const hasAlpha = corners.some((c) => c[3] < 32);
const bg = corners.reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
const mask = new Uint8Array(cw * ch);
for (let i = 0; i < cw * ch; i++) {
  const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
  if (hasAlpha) { mask[i] = a > 64 ? 1 : 0; continue; }
  const dBg = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
  mask[i] = (dBg > 60 || (Math.max(r, g, b) - Math.min(r, g, b)) > 24) ? 1 : 0;
}
function largest(m, w, h) {
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
const full = largest(mask, cw, ch);
// bbox
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (full[y * cw + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const cx = (minX + maxX) / 2, bw = maxX - minX, bh = maxY - minY;
// Cut a central body column so the left wing separates into its own component.
const bodyHalf = Math.max(8, bw * 0.06);
const leftWing = new Uint8Array(cw * ch);
for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (full[y * cw + x] && x < cx - bodyHalf) leftWing[y * cw + x] = 1;
const wing = largest(leftWing, cw, ch);
// trace + simplify
const contour = traceContour(wing, cw, ch);
if (!contour || !contour.length) { console.log('trace failed'); process.exit(1); }
const simp = simplifyToBudget(contour, 1.5, maxPoints);
// wing-local frame: origin at wing root (cx, rootY), +x outward (left → +), +y up.
const rootY = minY + bh * 0.10;            // wings attach near the top
const scale = (cx - minX) / 3.0;           // ~3 engine units across the wing span
const pts = simp.map((p) => [
  +(((cx - p.x) / scale)).toFixed(3),       // outward = +x
  +(((rootY - p.y) / scale)).toFixed(3),    // up = +y
]);
// wing bbox for sanity
let lxMax = -1e9, lyMin = 1e9, lyMax = -1e9;
for (const [x, y] of pts) { if (x > lxMax) lxMax = x; if (y < lyMin) lyMin = y; if (y > lyMax) lyMax = y; }
console.log(`wing px bbox ${bw}x${bh} · cut bodyHalf ${bodyHalf.toFixed(0)} · ${pts.length} pts`);
console.log(`local span ${lxMax.toFixed(2)} · vertical ${(lyMax - lyMin).toFixed(2)}`);
console.log('wingOutline: ' + JSON.stringify(pts));
