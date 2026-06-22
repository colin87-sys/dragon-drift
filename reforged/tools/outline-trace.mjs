// OUTLINE TRACE — turn a concept photo into an ordered polygon you can author from.
//
//   node tools/outline-trace.mjs <image.png> [options]
//
// The creature in a reference reads as a DARK mass on a bright sky (our two Night-Fury
// refs both do). This tool thresholds that mass, keeps ONE connected blob (the largest,
// or the one under a --seed point), walks its boundary (Moore tracing) into an ordered
// loop, simplifies it (Douglas–Peucker), and writes:
//   • /tmp/trace-<name>.png      — the source dimmed, the kept blob tinted, the traced
//                                  polygon drawn bright magenta with vertex dots (so a
//                                  human can SEE whether the trace caught the real edge).
//   • /tmp/trace-<name>.json     — the polygon in three frames: raw px, crop-box [0..1],
//                                  and a centred wing frame (x = span from root, y = up+),
//                                  ready to seed wingForms[] / a loft outline.
//
// Options:
//   --crop=x0,y0,x1,y1   restrict to a box (px) — isolate ONE part (e.g. just the wing)
//   --thresh=N           luminance cut (default 70). subject = lum < N
//   --bright             invert: subject = lum > N (pale creature on dark bg)
//   --seed=x,y           keep the blob covering this px (else: largest blob)
//   --simplify=E         Douglas–Peucker tolerance in px (default 2.5; higher = fewer pts)
//   --close-bottom       drop the crop's bottom edge from the trace (a part cut at its
//                        root — e.g. wing sheared off the shoulder — reads cleaner open)
//   --name=NAME          output basename (default: derived from the image filename)
//   --rooty=Y            wing-frame: px row treated as the root/shoulder (y=0). default = bbox bottom
//
// HEADLESS, no browser, no deps beyond the shared PNG codec in silhouetteCore.mjs.

import { writeFileSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (k, d) => { const a = args.find((s) => s.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const has = (k) => args.includes(`--${k}`);
const imgPath = args.find((a) => !a.startsWith('--'));
if (!imgPath) { console.log('usage: node tools/outline-trace.mjs <image.png> [--crop=x0,y0,x1,y1] [--thresh=N] [--bright] [--seed=x,y] [--simplify=E] [--close-bottom] [--name=NAME] [--rooty=Y]'); process.exit(1); }

const thresh = +flag('thresh', 70);
const bright = has('bright');
const eps = +flag('simplify', 2.5);
const closeBottom = has('close-bottom');
const name = flag('name', basename(imgPath).replace(/\.[^.]+$/, ''));

const { w, h, rgba } = decodePNG(readFileSync(imgPath));
const lum = (x, y) => { const d = (y * w + x) * 4; return 0.3 * rgba[d] + 0.59 * rgba[d + 1] + 0.11 * rgba[d + 2]; };

const crop = (() => {
  const c = flag('crop'); if (!c) return { x0: 0, y0: 0, x1: w, y1: h };
  const [x0, y0, x1, y1] = c.split(',').map(Number);
  return { x0: Math.max(0, x0 | 0), y0: Math.max(0, y0 | 0), x1: Math.min(w, x1 | 0), y1: Math.min(h, y1 | 0) };
})();

// ---- 1) subject mask, inside the crop ---------------------------------------
const inSubject = (x, y) => {
  if (x < crop.x0 || y < crop.y0 || x >= crop.x1 || y >= crop.y1) return false;
  const l = lum(x, y); return bright ? l > thresh : l < thresh;
};

// ---- 2) connected components → keep one -------------------------------------
// 8-connected flood fill; label every subject pixel, then choose by --seed or size.
const lab = new Int32Array(w * h).fill(0);
let nLab = 0; const sizes = [0];
const stack = [];
for (let y = crop.y0; y < crop.y1; y++) for (let x = crop.x0; x < crop.x1; x++) {
  const i = y * w + x;
  if (!inSubject(x, y) || lab[i]) continue;
  nLab++; sizes[nLab] = 0; stack.length = 0; stack.push(i); lab[i] = nLab;
  while (stack.length) {
    const p = stack.pop(); sizes[nLab]++;
    const px = p % w, py = (p / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = px + dx, ny = py + dy;
      if (!inSubject(nx, ny)) continue; const ni = ny * w + nx;
      if (lab[ni]) continue; lab[ni] = nLab; stack.push(ni);
    }
  }
}
if (nLab === 0) { console.log('no subject pixels — adjust --thresh / --bright / --crop'); process.exit(1); }

let keep;
const seed = flag('seed');
if (seed) { const [sx, sy] = seed.split(',').map(Number); keep = lab[sy * w + sx]; if (!keep) { console.log(`seed (${sx},${sy}) is not on the subject`); process.exit(1); } }
else { keep = 1; for (let k = 2; k <= nLab; k++) if (sizes[k] > sizes[keep]) keep = k; }

const isBlob = (x, y) => x >= 0 && y >= 0 && x < w && y < h && lab[y * w + x] === keep;

// blob bbox
let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
for (let y = crop.y0; y < crop.y1; y++) for (let x = crop.x0; x < crop.x1; x++)
  if (lab[y * w + x] === keep) { if (x < bMinX) bMinX = x; if (x > bMaxX) bMaxX = x; if (y < bMinY) bMinY = y; if (y > bMaxY) bMaxY = y; }

// ---- 3) Moore-neighbour boundary trace → ordered loop -----------------------
// Find the top-left blob pixel, then walk the border clockwise.
let start = -1;
outer: for (let y = bMinY; y <= bMaxY; y++) for (let x = bMinX; x <= bMaxX; x++) if (isBlob(x, y)) { start = y * w + x; break outer; }
const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]; // CW from +x
const contour = [];
{
  let cx = start % w, cy = (start / w) | 0, dir = 6; // came-from points up
  let guard = 0, maxGuard = (bMaxX - bMinX + 2) * (bMaxY - bMinY + 2) * 8 + 1000;
  do {
    contour.push([cx, cy]);
    let found = false;
    for (let k = 0; k < 8; k++) {
      const nd = (dir + 1 + k) % 8, nx = cx + N8[nd][0], ny = cy + N8[nd][1];
      if (isBlob(nx, ny)) { cx = nx; cy = ny; dir = (nd + 4) % 8; found = true; break; }
    }
    if (!found) break;
    if (++guard > maxGuard) break;
  } while (!(cx === (start % w) && cy === ((start / w) | 0)) || contour.length < 3);
}

// ---- 4) Douglas–Peucker simplify --------------------------------------------
function dp(pts, e) {
  if (pts.length < 3) return pts.slice();
  const keepFlag = new Uint8Array(pts.length); keepFlag[0] = keepFlag[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let far = -1, fd = e;
    for (let i = a + 1; i < b; i++) { const [px, py] = pts[i];
      const d = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
      if (d > fd) { fd = d; far = i; } }
    if (far !== -1) { keepFlag[far] = 1; st.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keepFlag[i]);
}
let poly = dp(contour, eps);

// optional: drop the segment riding along the crop's bottom edge (a sheared root)
if (closeBottom) {
  const yb = crop.y1 - 1;
  poly = poly.filter(([, y]) => y < yb - 2);
}

// ---- 5) coordinate frames ---------------------------------------------------
const rootY = flag('rooty') != null ? +flag('rooty') : bMaxY;          // shoulder line → y=0 in wing frame
const span = Math.max(1, bMaxX - bMinX), height = Math.max(1, bMaxY - bMinY);
const cropW = crop.x1 - crop.x0, cropH = crop.y1 - crop.y0;
const frames = poly.map(([x, y]) => ({
  px: [x, y],
  crop: [+((x - crop.x0) / cropW).toFixed(4), +((y - crop.y0) / cropH).toFixed(4)],
  // wing frame: span outward from blob's left edge (0..1), up positive from the root line
  wing: [+((x - bMinX) / span).toFixed(4), +((rootY - y) / span).toFixed(4)],
}));

// ---- 6) visualization PNG ---------------------------------------------------
const out = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {                     // dim the source to ~40%
  const d = i * 4; out[d] = (rgba[d] * 0.4) | 0; out[d + 1] = (rgba[d + 1] * 0.4) | 0; out[d + 2] = (rgba[d + 2] * 0.4) | 0; out[d + 3] = 255;
}
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (lab[y * w + x] === keep) { // tint the kept blob teal
  const d = (y * w + x) * 4; out[d] = (out[d] * 0.5) | 0; out[d + 1] = (out[d + 1] * 0.5 + 90) | 0; out[d + 2] = (out[d + 2] * 0.5 + 90) | 0;
}
const plot = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const d = (y * w + x) * 4; out[d] = r; out[d + 1] = g; out[d + 2] = b; };
const line = (x0, y0, x1, y1, r, g, b) => {           // bresenham, 2px thick
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (;;) { plot(x0, y0, r, g, b); plot(x0 + 1, y0, r, g, b); plot(x0, y0 + 1, r, g, b);
    if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
};
const drawClosed = !closeBottom;
for (let i = 0; i < poly.length - (drawClosed ? 0 : 1); i++) {
  const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
  line(x0, y0, x1, y1, 255, 40, 230);
}
for (const [x, y] of poly) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) plot(x + dx, y + dy, 255, 240, 60); // vertex dots
const pngPath = `/tmp/trace-${name}.png`;
writeFileSync(pngPath, pngRGBA(w, h, out));

// ---- 7) JSON + report -------------------------------------------------------
const jsonPath = `/tmp/trace-${name}.json`;
writeFileSync(jsonPath, JSON.stringify({
  image: imgPath, w, h, crop, thresh, bright, eps, closeBottom,
  blobBBox: { minX: bMinX, maxX: bMaxX, minY: bMinY, maxY: bMaxY }, rootY,
  spanPx: span, heightPx: height, vertices: frames.length,
  points: frames,
}, null, 2));

console.log(`image ${w}x${h} · crop ${cropW}x${cropH} · blobs ${nLab} · kept #${keep} (${sizes[keep]}px)`);
console.log(`blob bbox ${bMinX},${bMinY} → ${bMaxX},${bMaxY}  (span ${span} × height ${height})`);
console.log(`contour ${contour.length} px → ${poly.length} vertices @ eps ${eps}`);
console.log(`wrote ${pngPath}`);
console.log(`wrote ${jsonPath}`);
