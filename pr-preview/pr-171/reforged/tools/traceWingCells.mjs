// CELESTIAL STORM — WING STRUTS via membrane COMPARTMENTS (the human's insight). The drawn struts partition
// the wing into cells; auto-fill every interior cell (non-ink region enclosed by ink), then the lines BETWEEN
// two cells (ink with two different cell-labels within a small radius) ARE the finger struts. Overlays the
// result on the stencil to verify the struts sit on the drawn lines.
//   node tools/traceWingCells.mjs   → /tmp/celestial-wingcells.png  (+ prints strut count)
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { thin, skeletonToPolylines, lum } from './lineTrace.mjs';

const W = 941, H = 1672;
const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const { rgba } = decodePNG(readFileSync(DIR + 'stencil-wings.png'));
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4; ink[i] = lum(rgba[o], rgba[o + 1], rgba[o + 2]) < 200 ? 1 : 0; }

// label every non-ink 4-connected region; a region touching the image border = exterior background.
const labels = new Int32Array(W * H); let id = 0; const cells = [];
for (let s = 0; s < W * H; s++) {
  if (ink[s] || labels[s]) continue;
  id++; const st = [s]; labels[s] = id; let n = 0, border = false, sx = 0, sy = 0;
  while (st.length) { const p = st.pop(); n++; const x = p % W, y = (p / W) | 0; sx += x; sy += y; if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true; const t = (q, ok) => { if (ok && !ink[q] && !labels[q]) { labels[q] = id; st.push(q); } }; if (x) t(p - 1, 1); if (x < W - 1) t(p + 1, 1); if (y) t(p - W, 1); if (y < H - 1) t(p + W, 1); }
  cells.push({ id, n, border, cx: sx / n / W, cy: sy / n / H });
}
// interior compartments = enclosed cells (not border, big enough), on the RIGHT wing (cx > 0.5)
const comp = cells.filter(c => !c.border && c.n > 250 && c.cx > 0.5).sort((a, b) => b.n - a.n);
const keep = new Set(comp.map(c => c.id));
console.log(`interior compartments (right wing): ${comp.length}  [sizes ${comp.slice(0, 12).map(c => c.n).join(', ')}]`);

// BONES = ALL the drawn lines bounding the membrane (the human's rule: uncolored = bone). Take the ink within
// a padded bbox of the kept cells (so we include the wingtip spikes + outer frame, not just inter-cell lines),
// then skeletonize it → every bone line. R = how far a strut pixel can be from a cell (to drop stray ink).
let cMinX = W, cMinY = H, cMaxX = 0, cMaxY = 0;
for (let i = 0; i < W * H; i++) if (keep.has(labels[i])) { const x = i % W, y = (i / W) | 0; if (x < cMinX) cMinX = x; if (x > cMaxX) cMaxX = x; if (y < cMinY) cMinY = y; if (y > cMaxY) cMaxY = y; }
const PAD = 26;
const wingInk = new Uint8Array(W * H);
for (let y = Math.max(0, cMinY - PAD); y <= Math.min(H - 1, cMaxY + PAD); y++) for (let x = Math.max(0, cMinX - PAD); x <= Math.min(W - 1, cMaxX + PAD); x++) { const i = y * W + x; if (ink[i] && x > 0.45 * W) wingInk[i] = 1; }
const strut = thin(wingInk, W, H);
const struts = skeletonToPolylines(strut, W, H, 10);
console.log(`bone polylines (full wing skeleton): ${struts.length}`);

// ── render: stencil ink (grey) + compartments (hued) + struts (orange) ──
let minX = W, minY = H, maxX = 0, maxY = 0;
for (const c of comp) for (let i = 0; i < W * H; i++) if (labels[i] === c.id) { const x = i % W, y = (i / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const pad = 24; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1, sc = Math.min(2.6, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);
const hue = (k) => { const h = (k * 47) % 360 / 360, q = 0.62, p = 0.3, f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; };
const cellColor = new Map(comp.map((c, k) => [c.id, hue(k)]));
const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) {
  const sx = minX + (rx / sc | 0), sy = minY + (ry / sc | 0), si = sy * W + sx, o = (ry * RW + rx) * 4;
  let r = ink[si] ? 70 : 14, g = ink[si] ? 74 : 18, b = ink[si] ? 84 : 28;
  const cc = cellColor.get(labels[si]); if (cc) { r = r * 0.4 + cc[0] * 0.6; g = g * 0.4 + cc[1] * 0.6; b = b * 0.4 + cc[2] * 0.6; }
  if (strut[si]) { r = 255; g = 150; b = 40; }
  buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
}
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-wingcells.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-wingcells.png');
