// One-off QA: superimpose the dorsal-spine stencil over OUR body, scaled so head→tail length matches.
// Confirms whether the diamond spine lines up cleanly with our traced body before we trace it into the def.
//   node tools/spineOverlay.mjs <stencil.png>   → /tmp/celestial-spine-overlay.png
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { CELESTIAL_DEF as D } from '../js/celestialDef.js';

const stencilPath = process.argv[2];
const { w: SW, h: SH, rgba } = decodePNG(readFileSync(stencilPath));
const W = D.canvas?.w || 941, H = D.canvas?.h || 1672;   // body normalized over this real-pixel canvas

// our body extent (head top → tail tip), spine axis x
const sil = D.body.silhouette;
let minX = 1, maxX = 0, minY = 1, maxY = 0;
for (const [x, y] of sil) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const axis = D.mirror;

// stencil ink bbox (dark, opaque pixels)
let sx0 = 1e9, sy0 = 1e9, sx1 = -1e9, sy1 = -1e9, sxSum = 0, sN = 0;
for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
  const o = (y * SW + x) * 4, a = rgba[o + 3], lum = rgba[o] * 0.3 + rgba[o + 1] * 0.59 + rgba[o + 2] * 0.11;
  if (a > 128 && lum < 170) { if (x < sx0) sx0 = x; if (x > sx1) sx1 = x; if (y < sy0) sy0 = y; if (y > sy1) sy1 = y; sxSum += x; sN++; }
}
const sxc = sxSum / sN;   // ink horizontal centroid → align to our spine axis

// canvas in real-pixel coords, cropped to our body with padding
const padX = 0.04, padY = 0.02;
const x0 = (minX - padX) * W, x1 = (maxX + padX) * W, y0 = (minY - padY) * H, y1 = (maxY + padY) * H;
const RH = 1200, k = RH / (y1 - y0), RW = Math.round((x1 - x0) * k);
const px = (nx) => (nx * W - x0) * k, py = (ny) => (ny * H - y0) * k;
const buf = Buffer.alloc(RW * RH * 4); for (let i = 0; i < RW * RH; i++) { buf[i * 4] = 9; buf[i * 4 + 1] = 11; buf[i * 4 + 2] = 22; buf[i * 4 + 3] = 255; }
const blend = (x, y, c, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; };
function fill(c, col, a = 1) { const P = c.map(p => [px(p[0]), py(p[1])]); let mY = 1e9, MY = -1e9; for (const p of P) { if (p[1] < mY) mY = p[1]; if (p[1] > MY) MY = p[1]; } for (let y = Math.max(0, mY | 0); y <= Math.min(RH - 1, MY | 0); y++) { const xs = []; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const A = P[i], B = P[j]; if ((A[1] > y) !== (B[1] > y)) xs.push(A[0] + (y - A[1]) / (B[1] - A[1]) * (B[0] - A[0])); } xs.sort((m, n) => m - n); for (let kk = 0; kk + 1 < xs.length; kk += 2) for (let x = xs[kk] | 0; x <= (xs[kk + 1] | 0); x++) blend(x, y, col, a); } }
function stroke(c, col, wd, a = 1, close = false) { const P = c.map(p => [px(p[0]), py(p[1])]); if (close) P.push(P[0]); for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, qx = A[0] + (B[0] - A[0]) * t, qy = A[1] + (B[1] - A[1]) * t; for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) blend(qx + dx, qy + dy, col, a); } } }

// draw OUR body + plates
fill(sil, [44, 36, 82]); stroke(sil, [120, 130, 170], 1, 0.8, true);
for (const pl of D.body.plates) stroke(pl, [110, 140, 200], 0.6, 0.6, true);

// superimpose the stencil ink: scale so head(sy0)→our head top, tail(sy1)→our tail tip; keep stencil aspect; center on axis
const headPy = py(minY), tailPy = py(maxY), axisPx = px(axis);
const sV = (tailPy - headPy) / (sy1 - sy0);
for (let y = sy0; y <= sy1; y++) for (let x = sx0; x <= sx1; x++) {
  const o = (y * SW + x) * 4, a = rgba[o + 3], lum = rgba[o] * 0.3 + rgba[o + 1] * 0.59 + rgba[o + 2] * 0.11;
  if (a > 128 && lum < 170) { const cX = axisPx + (x - sxc) * sV, cY = headPy + (y - sy0) * sV; blend(cX, cY, [255, 60, 60], 0.95); }
}
console.log(`our body: head y=${minY.toFixed(3)} tail y=${maxY.toFixed(3)} width=${((maxX - minX) * W).toFixed(0)}px · stencil ink ${(sx1 - sx0)}×${(sy1 - sy0)} → scaled ×${sV.toFixed(3)}, width=${((sx1 - sx0) * sV).toFixed(0)}px`);

// write PNG
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let kk = 0; kk < 8; kk++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-spine-overlay.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-spine-overlay.png');
