// CELESTIAL STORM — trace ACCURACY CHECKER. Overlays the emitted definition (js/celestialDef.js) on top of
// the ORIGINAL stencil ink (dim grey) at high res, so any drift (a strut not reaching the outline, a missing
// wrist/thumb branch, a horn the silhouette dropped) is immediately visible: traced lines that leave the grey
// ink are wrong. This is the "is it accurate?" tool — run it after every trace change.
//
//   node tools/traceCheck.mjs wing     → /tmp/celestial-check-wing.png
//   node tools/traceCheck.mjs body      → /tmp/celestial-check-body.png
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { lum } from './lineTrace.mjs';
import { CELESTIAL_DEF as D } from '../js/celestialDef.js';

const which = process.argv[2] || 'wing';
const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const W = D.canvas[0], H = D.canvas[1];
const stencil = which === 'body' ? 'stencil-body' : 'stencil-wings';
const { rgba } = decodePNG(readFileSync(DIR + stencil + '.png'));

// ink mask of the source (what the trace SHOULD hug)
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4; ink[i] = lum(rgba[o], rgba[o + 1], rgba[o + 2]) < 200 ? 1 : 0; }

// gather the def lines for this layer (mirror the wing so we check both vs the two-wing stencil)
const mir = (p) => [2 * D.mirror - p[0], p[1]];
let lines = [];           // { pts, col, closed }
if (which === 'body') {
  lines.push({ pts: D.body.silhouette, col: [120, 240, 160], closed: true });
  for (const pl of D.body.plates) lines.push({ pts: pl, col: [120, 180, 240], closed: true });
} else {
  for (const m of [false, true]) {
    const f = (c) => m ? c.map(mir) : c;
    lines.push({ pts: f(D.wing.silhouette), col: [120, 240, 160], closed: true });
    for (const s of D.wing.struts) lines.push({ pts: f(s), col: [255, 170, 70], closed: false });
    for (const v of D.wing.veins) lines.push({ pts: f(v), col: [255, 110, 235], closed: false });
  }
}

// crop to the ink bbox (with pad), render hi-res
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const pad = 24; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1;
const sc = Math.min(2.2, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);
const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) {
  const sx = minX + Math.floor(rx / sc), sy = minY + Math.floor(ry / sc), o = (ry * RW + rx) * 4;
  const g = ink[sy * W + sx] ? 78 : 14;
  buf[o] = g; buf[o + 1] = g + 4; buf[o + 2] = g + 12; buf[o + 3] = 255;     // ink = grey, bg = near-black
}
const SXp = (nx) => (nx * W - minX) * sc, SYp = (ny) => (ny * H - minY) * sc;
function blend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; }
function stroke(pts, col, wd, closed) { const P = pts.map(p => [SXp(p[0]), SYp(p[1])]); if (closed) P.push(P[0]); for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t; for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) blend(px + dx, py + dy, col, 1); } } }
function endpoints(pts, col) { for (const idx of [0, pts.length - 1]) { const x = SXp(pts[idx][0]) | 0, y = SYp(pts[idx][1]) | 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) blend(x + dx, y + dy, col, 1); } }
for (const L of lines) { stroke(L.pts, L.col, L.closed ? 1.1 : 1.4, L.closed); if (!L.closed) endpoints(L.pts, [255, 60, 60]); }   // red dots = stroke ends (should sit ON the outline)

// PNG
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
const path = `/tmp/celestial-check-${which}.png`;
writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(`${which}: overlaid ${lines.length} traced lines on the source ink → ${path}`);
console.log('  green = silhouette · orange = struts (red dots = ends, should touch the outline) · blue = plates · magenta = veins');
