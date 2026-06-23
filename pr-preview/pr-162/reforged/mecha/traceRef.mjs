// Trace the reference dragon PNG: segment foreground from the teal background,
// measure the whole-dragon bbox (for ratio), isolate the WING via its top-profile,
// and emit normalized wing outline anchors + an ASCII preview.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const file = process.argv[2];
const buf = readFileSync(file);
// ── minimal PNG decode (8-bit, colorType 2/6) ────────────────────────────────
let p = 8, width = 0, height = 0, ctype = 0, idat = [];
while (p < buf.length) {
  const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8);
  const data = buf.subarray(p + 8, p + 8 + len);
  if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); ctype = data[9]; }
  else if (type === 'IDAT') idat.push(data);
  else if (type === 'IEND') break;
  p += 12 + len;
}
const ch = ctype === 6 ? 4 : 3;
const raw = inflateSync(Buffer.concat(idat));
const stride = width * ch, px = Buffer.alloc(stride * height);
for (let y = 0; y < height; y++) {
  const f = raw[y * (stride + 1)];
  for (let x = 0; x < stride; x++) {
    const r = raw[y * (stride + 1) + 1 + x];
    const a = x >= ch ? px[y * stride + x - ch] : 0, b = y > 0 ? px[(y - 1) * stride + x] : 0;
    const c = (x >= ch && y > 0) ? px[(y - 1) * stride + x - ch] : 0;
    let v; switch (f) { case 1: v = r + a; break; case 2: v = r + b; break; case 3: v = r + ((a + b) >> 1); break;
      case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = r + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; } default: v = r; }
    px[y * stride + x] = v & 0xff;
  }
}
const at = (x, y) => { const i = y * stride + x * ch; return [px[i], px[i + 1], px[i + 2]]; };
// background = corner colour; foreground = far from it
const bg = at(2, 2);
const isFg = (x, y) => { const [r, g, b] = at(x, y); return Math.hypot(r - bg[0], g - bg[1], b - bg[2]) > 70; };
// raw mask, then keep only the LARGEST connected component (drop background specks)
const mask = new Uint8Array(width * height);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (isFg(x, y)) mask[y * width + x] = 1;
const lab = new Int32Array(width * height).fill(-1);
let best = -1, bestN = 0, cur = 0;
const stack = [];
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const s0 = y * width + x; if (!mask[s0] || lab[s0] >= 0) continue;
  let n = 0; stack.push(s0); lab[s0] = cur;
  while (stack.length) {
    const s = stack.pop(); n++; const sx = s % width, sy = (s / width) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = sx + dx, ny = sy + dy; if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ns = ny * width + nx; if (mask[ns] && lab[ns] < 0) { lab[ns] = cur; stack.push(ns); }
    }
  }
  if (n > bestN) { bestN = n; best = cur; } cur++;
}
const fg = (x, y) => lab[y * width + x] === best;   // dragon blob only

// foreground bbox + per-column top/bottom
let x0 = width, x1 = 0, y0 = height, y1 = 0;
const topY = new Int32Array(width).fill(-1), botY = new Int32Array(width).fill(-1);
for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) if (fg(x, y)) {
  if (topY[x] < 0) topY[x] = y; botY[x] = y;
  if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
}
const W = x1 - x0, H = y1 - y0;

// back line = MEDIAN top profile (most columns are body, so the median ≈ the back)
const tops = []; for (let x = x0; x <= x1; x++) if (topY[x] >= 0) tops.push(topY[x]);
tops.sort((a, b) => a - b); const yBack = tops[tops.length >> 1];
// wing columns = top profile well ABOVE the back line
const margin = 0.06 * H; let xWmin = -1, xWmax = -1;
for (let x = x0; x <= x1; x++) if (topY[x] >= 0 && topY[x] < yBack - margin) { if (xWmin < 0) xWmin = x; xWmax = x; }
let xA = xWmin, yA = height; for (let x = xWmin; x <= xWmax; x++) if (topY[x] >= 0 && topY[x] < yA) { yA = topY[x]; xA = x; }
// wing's LOWER boundary (trailing edge): for columns from apex→rear, the lowest
// wing pixel that is still above the back line, scanning down from topY.
const lowerY = (x) => { let y = topY[x]; while (y < yBack && fg(x, y + 1)) y++; return y; };
const sample = (xa, xb, n) => { const o = []; for (let i = 0; i <= n; i++) { const x = Math.round(xa + (xb - xa) * i / n); o.push([x, topY[x]]); } return o; };
const lead = sample(xWmin, xA, 6);                                   // front root → apex (LEADING edge)
const trailUpper = sample(xA, xWmax, 4);                             // apex → rear (upper)
const norm = ([x, y]) => [+(((x - x0) / W)).toFixed(3), +(((yBack - y) / W)).toFixed(3)];

console.log(`image ${width}x${height}  fg bbox ${W}x${H} at (${x0},${y0})`);
console.log(`backLine y=${yBack}  wing x ${xWmin}..${xWmax}  apex(${xA},${yA})`);
console.log(`\nRATIOS (head→tail body length = 1.0):`);
console.log(`  wing tip height / body len   : ${((yBack - yA) / W).toFixed(3)}`);
console.log(`  wing root (front) @ body x   : ${((xWmin - x0) / W).toFixed(3)}   (0=head, 1=tail)`);
console.log(`  wing tip @ body x            : ${((xA - x0) / W).toFixed(3)}`);
console.log(`  aft rake (tipX − rootX)/len  : ${((xA - xWmin) / W).toFixed(3)}`);
console.log(`  wing x-extent / body len     : ${((xWmax - xWmin) / W).toFixed(3)}`);
console.log(`\nLEADING edge front-root→tip  [aftFrac, upFrac]:`);
console.log('  ', JSON.stringify(lead.map(norm)));
console.log(`TRAILING upper tip→rear:`);
console.log('  ', JSON.stringify(trailUpper.map(norm)));

// ── BODY PROFILE: back (top) + belly (bottom) contours, excluding the wing
// (above the back) and the legs (narrow spurs below the belly, removed by a
// median filter). thickness = belly−back ; centreline = midpoint. ─────────────
const medianOf = (arr, x, win) => { const v = []; for (let i = -win; i <= win; i++) { const xx = x + i; if (xx >= x0 && xx <= x1 && arr[xx] >= 0) v.push(arr[xx]); } v.sort((a, b) => a - b); return v.length ? v[v.length >> 1] : -1; };
const belly = new Int32Array(width).fill(-1);
for (let x = x0; x <= x1; x++) belly[x] = medianOf(botY, x, 16);                // wide median kills narrow leg spurs
const back = new Int32Array(width).fill(-1);
for (let x = x0; x <= x1; x++) back[x] = (topY[x] >= 0 && topY[x] >= yBack - margin) ? topY[x] : -1;  // drop wing columns
let lg = -1;                                                                     // linearly fill the back under the wing
for (let x = x0; x <= x1; x++) { if (back[x] >= 0) { if (lg >= 0 && x - lg > 1) for (let xi = lg + 1; xi < x; xi++) back[xi] = Math.round(back[lg] + (back[x] - back[lg]) * (xi - lg) / (x - lg)); lg = x; } }
// per-station table (head→tail), normalised by body length W
const N = 24;
console.log(`\nBODY PROFILE  ${N} stations head→tail  [aftFrac | centreUp | thickness] (×body len):`);
const rows0 = [];
for (let i = 0; i <= N; i++) {
  const x = Math.round(x0 + (i / N) * W);
  if (back[x] < 0 || belly[x] < 0) { rows0.push(null); continue; }
  const thick = belly[x] - back[x], ctr = (belly[x] + back[x]) / 2;
  rows0.push([+(i / N).toFixed(2), +(((y1 - ctr) / W)).toFixed(3), +((thick / W)).toFixed(3)]);
}
for (const r of rows0) if (r) console.log(`  ${r[0].toFixed(2)}  up ${r[1].toFixed(3)}  thick ${r[2].toFixed(3)}`);
// crude zone split by thickness: find the peak (chest) and the tail taper
const th = rows0.map((r) => r ? r[2] : 0); const peak = th.indexOf(Math.max(...th));
console.log(`\n  thickest station @ aftFrac ${(peak / N).toFixed(2)} (chest)  ·  max thick ${Math.max(...th).toFixed(3)} body-len`);

// ASCII preview: '#'=wing  'B'=back contour  'v'=belly contour  '.'=other fg
const cols = 92, rows = 30;
let s = '\n';
for (let r = 0; r < rows; r++) {
  let line = '';
  for (let c = 0; c < cols; c++) {
    const x = Math.round(x0 + (c / cols) * W), y = Math.round(y0 + (r / rows) * H);
    const near = (v) => v >= 0 && Math.abs(y - v) <= H / rows / 2;
    line += !fg(x, y) ? ' ' : near(back[x]) ? 'B' : near(belly[x]) ? 'v' : (y < yBack - margin && x >= xWmin && x <= xWmax) ? '#' : '.';
  }
  s += line + '\n';
}
console.log(s);
