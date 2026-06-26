// celestialScaffold — convert the HARVESTED celestial-storm wing scaffold (membrane outline +
// bone spines, traced in the celestial-storm branch) from image-canvas coords into the
// wing-local convention crystalWing consumes (origin = wing root, +x outward, +y up, span≈3).
// Emits `wingOutline` + `wingStruts` ready to paste into dragons.js, and writes QA overlays.
//
//   node reforged/tools/celestialScaffold.mjs
//
// Inputs (committed in reforged/tools/refs/celestial/):
//   wing-outline-R.json      { canvas, outline:[[x,y]..] }   (320-pt right-wing membrane, 0..1, +y down)
//   wing-bones-merged-R.json { boneSpines:[{pts,radii}..] }  (7 clean centerlines, 0..1, +y down)
//   stencil-wings.png        (QA backdrop)

import { readFileSync, writeFileSync } from 'node:fs';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';

const REF = new URL('./refs/celestial/', import.meta.url);
const OUT_SCRATCH = '/tmp/claude-0/-home-user-dragon-drift/e6eba243-b2cd-5cbf-aeba-4011843f385d/scratchpad';

const outlineSrc = JSON.parse(readFileSync(new URL('wing-outline-R.json', REF))).outline;          // [[x,y]..] 0..1
const merged = JSON.parse(readFileSync(new URL('wing-bones-merged-R.json', REF)));
const spinesSrc = merged.boneSpines.map((s) => s.pts);                                              // [[ [x,y].. ]..]

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

// ---- root / tip / wrist in canvas space ----
let R = outlineSrc[0], T = outlineSrc[0];
for (const p of outlineSrc) { if (p[0] < R[0]) R = p; if (p[0] > T[0]) T = p; }   // root = body-side (min x), tip = far (max x)
// wrist = convergence of the bone spines (iterative: inner-endpoint centroid)
let W = centroid(spinesSrc.flatMap((p) => [p[0], p[p.length - 1]]));
for (let it = 0; it < 3; it++) {
  const inners = spinesSrc.map((p) => (dist(p[0], W) <= dist(p[p.length - 1], W) ? p[0] : p[p.length - 1]));
  W = centroid(inners);
}

// ---- transform canvas → wing-local (origin=root, +x out, +y up, span≈3) ----
const s = 3 / (T[0] - R[0]);
const toLocal = (p) => [(p[0] - R[0]) * s, -(p[1] - R[1]) * s];
const wristLocal = round(toLocal(W));

// outline (simplify; keep ~50-70 pts)
const outlineLocalFull = outlineSrc.map(toLocal);
let eps = 0.05, outlineLocal = rdp(outlineLocalFull, eps);
while (outlineLocal.length > 70 && eps < 0.2) { eps += 0.01; outlineLocal = rdp(outlineLocalFull, eps); }
while (outlineLocal.length < 45 && eps > 0.01) { eps -= 0.005; outlineLocal = rdp(outlineLocalFull, eps); }
const wingOutline = outlineLocal.map(round);

// struts: orient each spine inner(→wrist)→outer(tip), force-start at the wrist (a clean fan), RDP
const bones = spinesSrc.map((p) => {
  const inner = dist(p[0], W) <= dist(p[p.length - 1], W);
  const ordered = inner ? p.slice() : p.slice().reverse();      // index0 nearest wrist
  let local = ordered.map(toLocal);
  if (dist(local[0], toLocal(W)) < 0.12) local[0] = toLocal(W); else local.unshift(toLocal(W));
  return rdp(local, 0.02).map(round);
}).filter((b) => polyLen(b) > 0.15).sort((a, b) => polyLen(b) - polyLen(a));

const wingStruts = { wrist: wristLocal, bones };

// ---- emit ----
const fmt = (arr) => JSON.stringify(arr);
console.log('// root(canvas)=', round(R), ' tip(canvas)=', round(T), ' wrist(canvas)=', round(W), ' scale=', +s.toFixed(3));
console.log(`// outline pts: ${outlineSrc.length} → ${wingOutline.length} (eps ${eps.toFixed(3)}); struts: ${bones.length}`);
console.log(`// strut local lengths: ${bones.map((b) => polyLen(b).toFixed(2)).join(', ')}`);
console.log('\nwingOutline: ' + fmt(wingOutline) + ',');
console.log('\nwingStruts: ' + fmt(wingStruts) + ',');
writeFileSync(`${OUT_SCRATCH}/celestial-scaffold.json`, JSON.stringify({ wingOutline, wingStruts }, null, 0));

// ---- QA overlay on the stencil (canvas space): grey stencil + source outline (green) + spines (yellow) + wrist (pink)
const { w: cw, h: ch, rgba } = decodePNG(readFileSync(new URL('stencil-wings.png', REF)));
const img = new Uint8Array(cw * ch * 4);
for (let i = 0; i < cw * ch; i++) { const v = rgba[i * 4] * 0.35 + 30; img[i * 4] = v; img[i * 4 + 1] = v; img[i * 4 + 2] = v + 6; img[i * 4 + 3] = 255; }
const plotPx = (x, y, col, r = 1) => { const px = Math.round(x * cw), py = Math.round(y * ch);
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = px + dx, Y = py + dy; if (X >= 0 && Y >= 0 && X < cw && Y < ch) { const i = (Y * cw + X) * 4; img[i] = col[0]; img[i + 1] = col[1]; img[i + 2] = col[2]; } } };
const drawPoly = (pts, col, r = 1) => { for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.ceil(dist(a, b) * Math.max(cw, ch)); for (let k = 0; k <= n; k++) { const t = k / n; plotPx(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, col, r); } } };
drawPoly([...outlineSrc, outlineSrc[0]], [80, 240, 140], 1);     // source membrane outline (green)
for (const sp of spinesSrc) drawPoly(sp, [255, 80, 210], 2);     // bone spines (magenta)
plotPx(W[0], W[1], [120, 200, 255], 5);                          // wrist (cyan)
plotPx(R[0], R[1], [255, 220, 90], 5);                           // root (yellow)
plotPx(T[0], T[1], [255, 120, 60], 5);                           // tip (orange)
writeFileSync(`${OUT_SCRATCH}/celestial-scaffold-overlay.png`, pngRGBA(cw, ch, Buffer.from(img)));

// ---- local-space plot (what crystalWing will render): outline (cyan) + struts (magenta) + wrist
const LW = 700, LH = 700, limg = new Uint8Array(LW * LH * 4);
for (let i = 0; i < LW * LH; i++) { limg[i * 4] = 18; limg[i * 4 + 1] = 20; limg[i * 4 + 2] = 28; limg[i * 4 + 3] = 255; }
// fit local coords (x 0..3, y range) into the canvas with margin
const allL = [...wingOutline, ...bones.flat(), wristLocal];
let lx0 = 1e9, lx1 = -1e9, ly0 = 1e9, ly1 = -1e9; for (const p of allL) { lx0 = Math.min(lx0, p[0]); lx1 = Math.max(lx1, p[0]); ly0 = Math.min(ly0, p[1]); ly1 = Math.max(ly1, p[1]); }
const sc = 0.86 * Math.min(LW / (lx1 - lx0), LH / (ly1 - ly0)); const ox = (LW - (lx1 - lx0) * sc) / 2, oy = (LH - (ly1 - ly0) * sc) / 2;
const L2P = (p) => [(p[0] - lx0) * sc + ox, LH - ((p[1] - ly0) * sc + oy)];   // flip for screen (y up)
const lplot = (P, col, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(P[0]) + dx, Y = Math.round(P[1]) + dy; if (X >= 0 && Y >= 0 && X < LW && Y < LH) { const i = (Y * LW + X) * 4; limg[i] = col[0]; limg[i + 1] = col[1]; limg[i + 2] = col[2]; } } };
const lpoly = (pts, col, r) => { for (let i = 1; i < pts.length; i++) { const a = L2P(pts[i - 1]), b = L2P(pts[i]), n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let k = 0; k <= n; k++) { const t = k / n; lplot([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], col, r); } } };
lpoly([...wingOutline, wingOutline[0]], [120, 220, 255], 1);
for (const b of bones) lpoly(b, [255, 90, 210], 2);
lplot(L2P(wristLocal), [255, 255, 120], 4);
lplot(L2P([0, 0]), [120, 255, 160], 4);   // root origin
writeFileSync(`${OUT_SCRATCH}/celestial-scaffold-local.png`, pngRGBA(LW, LH, Buffer.from(limg)));
console.log('\nwrote celestial-scaffold.json + overlay.png (on stencil) + local.png (wing-local)');
