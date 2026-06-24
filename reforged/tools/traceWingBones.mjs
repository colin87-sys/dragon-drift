// CELESTIAL STORM — WING BONE diagnostic. Renders the RIGHT wing's full ink SKELETON over the stencil ink, with
// every skeleton polyline in its own colour + endpoints, so we can verify which BONES exist and whether the
// finger struts reach the scallop tips. Pure raw stencil space (no placement transform).
//   node tools/traceWingBones.mjs   → /tmp/celestial-wingbones.png
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { traceContour } from './tracerCore.mjs';
import { thin, skeletonToPolylines, lum } from './lineTrace.mjs';

const W = 941, H = 1672;
const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const { rgba } = decodePNG(readFileSync(DIR + 'stencil-wings.png'));
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4; ink[i] = lum(rgba[o], rgba[o + 1], rgba[o + 2]) < 200 ? 1 : 0; }
// right wing skeleton (restrict to right half so we see one wing cleanly)
const skel = thin(ink, W, H);
const skR = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) skR[i] = (skel[i] && (i % W) > 0.47 * W) ? 1 : 0;
const polys = skeletonToPolylines(skR, W, H, 8);
const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return s; };
polys.sort((a, b) => plen(b) - plen(a));
console.log(`right-wing skeleton: ${polys.length} polylines, lengths(px): ${polys.map(p => Math.round(plen(p))).join(', ')}`);

// crop to right-wing ink bbox
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0.47 * W | 0; x < W; x++) if (ink[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const pad = 20; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1, sc = Math.min(2.4, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);
const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) { const sx = minX + (rx / sc | 0), sy = minY + (ry / sc | 0), o = (ry * RW + rx) * 4; const g = ink[sy * W + sx] ? 80 : 14; buf[o] = g; buf[o + 1] = g + 4; buf[o + 2] = g + 14; buf[o + 3] = 255; }
const SX = (x) => (x - minX) * sc, SY = (y) => (y - minY) * sc;
const blend = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; };
const stroke = (pts, c, wd) => { for (let i = 0; i + 1 < pts.length; i++) { const A = pts[i], B = pts[i + 1]; const L = Math.hypot(B.x - A.x, B.y - A.y) * sc, st = Math.max(1, L | 0); for (let s = 0; s <= st; s++) { const t = s / st, px = SX(A.x + (B.x - A.x) * t), py = SY(A.y + (B.y - A.y) * t); for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) blend(px + dx, py + dy, c); } } };
const dot = (p, c, r) => { const x = SX(p.x) | 0, y = SY(p.y) | 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) blend(x + dx, y + dy, c); };
const PAL = [[120, 220, 255], [255, 170, 70], [120, 255, 140], [255, 110, 235], [255, 230, 90], [150, 200, 255], [255, 140, 120], [180, 255, 200], [200, 160, 255], [120, 255, 230]];
polys.forEach((p, i) => { const c = PAL[i % PAL.length]; stroke(p, c, 1.6); dot(p[0], [255, 50, 50], 3); dot(p[p.length - 1], [255, 50, 50], 3); });

const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-wingbones.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-wingbones.png (each skeleton polyline a distinct colour, red dots = endpoints)');
