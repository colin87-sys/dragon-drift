// CELESTIAL STORM — REGISTRATION check. Overlays the traced body + both wings (from celestialDef.js) on the
// FULL COLOUR reference (the correctly-assembled dragon), so we can see whether the separate body-stencil and
// wings-stencil layers actually share the same coordinate frame — i.e. whether the wings sit where the body's
// shoulders are. If the cyan wings don't land on the reference's wings, the layers are NOT registered and the
// wing needs a placement transform.
//   node tools/traceAlign.mjs   → /tmp/celestial-align.png
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { CELESTIAL_DEF as D } from '../js/celestialDef.js';

const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const W = D.canvas[0], H = D.canvas[1];
const full = decodePNG(readFileSync(DIR + 'full.png')).rgba;

// subject mask of the full reference (not near-white) → crop
const subj = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4, r = full[o], g = full[o + 1], b = full[o + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); subj[i] = (mx - mn > 22 || mx < 230) ? 1 : 0; }
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (subj[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const pad = 30; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1;
const sc = Math.min(2.0, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);

const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) {
  const sx = minX + Math.floor(rx / sc), sy = minY + Math.floor(ry / sc), si = (sy * W + sx) * 4, o = (ry * RW + rx) * 4;
  // dim the colour reference so overlays read on top
  buf[o] = full[si] * 0.55 + 8; buf[o + 1] = full[si + 1] * 0.55 + 9; buf[o + 2] = full[si + 2] * 0.55 + 16; buf[o + 3] = 255;
}
const SXp = (nx) => (nx * W - minX) * sc, SYp = (ny) => (ny * H - minY) * sc;
function blend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; }
function stroke(pts, col, wd, closed) { const P = pts.map(p => [SXp(p[0]), SYp(p[1])]); if (closed) P.push(P[0]); for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t; for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) blend(px + dx, py + dy, col, 1); } } }

const mir = (p) => [2 * D.mirror - p[0], p[1]];
// body silhouette (lime) + wing silhouettes both sides (cyan) + struts (orange)
stroke(D.body.silhouette, [120, 255, 120], 2.2, true);
for (const m of [false, true]) { const f = (c) => m ? c.map(mir) : c; stroke(f(D.wing.silhouette), [90, 220, 255], 2.2, true); for (const s of D.wing.struts) stroke(f(s), [255, 170, 70], 1.2, false); }

const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-align.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-align.png — lime=body, cyan=wings, orange=struts, over the full colour reference');
