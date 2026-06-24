// CELESTIAL STORM — merge the human's tagged wing bones (refs/celestial/wing-bones-R.json) with the stencil:
// each FILLED bone region is GROWN outward into its surrounding ink stroke so the bone hugs the actual drawn
// line and seals; bone LINES (thin single-stroke struts) are kept as-is. Renders an overlay on the stencil so
// we can verify coverage, and writes the merged result.
//   node tools/traceWingMerge.mjs   → /tmp/celestial-wingmerge.png  (+ writes refs/celestial/wing-bones-merged-R.json)
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { traceContour } from './tracerCore.mjs';
import { thin, skeletonToPolylines, lum } from './lineTrace.mjs';

const W = 941, H = 1672;
const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const J = JSON.parse(readFileSync(DIR + 'wing-bones-R.json', 'utf8'));
const { rgba } = decodePNG(readFileSync(DIR + 'stencil-wings.png'));
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4; ink[i] = lum(rgba[o], rgba[o + 1], rgba[o + 2]) < 200 ? 1 : 0; }
// apply the human's gap-bridges into the ink
const rasterLine = (a, b, m) => { const n = Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]) * 1 | 0); for (let s = 0; s <= n; s++) { const px = Math.round((a[0] + (b[0] - a[0]) * s / n) * W), py = Math.round((a[1] + (b[1] - a[1]) * s / n) * H); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px + dx, y = py + dy; if (x >= 0 && y >= 0 && x < W && y < H) m[y * W + x] = 1; } } };
for (const [a, b] of (J.bridges || [])) rasterLine(a, b, ink);

const morph = (m, n, grow) => { let cur = m; for (let it = 0; it < n; it++) { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = grow ? 0 : 1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, s = (nx >= 0 && ny >= 0 && nx < W && ny < H) ? cur[ny * W + nx] : 0; if (grow) { if (s) v = 1; } else if (!s) v = 0; } o[y * W + x] = v; } cur = o; } return cur; };
const dilate = (m, n) => morph(m, n, true);
// rasterize a normalized closed contour to a filled mask (scanline)
function fillPoly(poly) {
  const P = poly.map(p => [p[0] * W, p[1] * H]); const m = new Uint8Array(W * H);
  let mnY = H, mxY = 0; for (const p of P) { if (p[1] < mnY) mnY = p[1]; if (p[1] > mxY) mxY = p[1]; }
  for (let y = Math.max(0, mnY | 0); y <= Math.min(H - 1, mxY | 0); y++) { const xs = []; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((p, q) => p - q); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, xs[k] | 0); x <= Math.min(W - 1, xs[k + 1] | 0); x++) m[y * W + x] = 1; }
  return m;
}
// GROW a fill into its surrounding stroke: fill ∪ (dilate(fill,4) ∩ ink) → hugs the outer edge of the drawn line
// (The arm is NOT auto-built here — auto-picking its edges grabbed the leading-edge membrane by mistake. Tag
//  the arm in the editor: bridge its open origin, then fill bone — so its real edges are chosen, not guessed.)
const shapes = (J.boneShapes || []).slice();
// skeleton endpoints (degree-1) = the SHARP tips of the drawn bones; we spear each grown bone out to its tip.
const skel = thin(ink, W, H), endpoints = [];
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (!skel[y * W + x]) continue; let dN = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!(dx === 0 && dy === 0) && skel[(y + dy) * W + (x + dx)]) dN++; if (dN === 1) endpoints.push({ x, y }); }
const lineInk = (a, b) => { const n = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) | 0); let hit = 0; for (let s = 0; s <= n; s++) { const x = Math.round(a.x + (b.x - a.x) * s / n), y = Math.round(a.y + (b.y - a.y) * s / n); let ok = false; for (let dy = -2; dy <= 2 && !ok; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && ink[yy * W + xx]) { ok = true; break; } } if (ok) hit++; } return hit / (n + 1) > 0.7; };
const rasterInto = (a, b, m) => { const n = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) | 0); for (let s = 0; s <= n; s++) { const px = Math.round(a.x + (b.x - a.x) * s / n), py = Math.round(a.y + (b.y - a.y) * s / n); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px + dx, y = py + dy; if (x >= 0 && y >= 0 && x < W && y < H) m[y * W + x] = 1; } } };
const grownShapes = [];
for (const shape of shapes) {
  const fill = fillPoly(shape); const ringInk = dilate(fill, 4);
  const grown = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) grown[i] = (fill[i] || (ringInk[i] && ink[i])) ? 1 : 0;
  // spear the bone out to each sharp skeleton endpoint that lies just beyond it along the ink (longer + sharper tips)
  for (const e of endpoints) {
    if (grown[e.y * W + e.x]) continue;
    let best = null, bd = 46 * 46 + 1;
    for (let dy = -46; dy <= 46; dy++) for (let dx = -46; dx <= 46; dx++) { const x = e.x + dx, y = e.y + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue; if (grown[y * W + x]) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { x, y }; } } }
    if (best && lineInk(best, e)) rasterInto(best, e, grown);
  }
  const c = traceContour(dilate(grown, 1), W, H).map(p => [+(p.x / W).toFixed(4), +(p.y / H).toFixed(4)]);
  if (c.length > 3) grownShapes.push({ mask: grown, contour: c });
}
console.log(`grew ${grownShapes.length} bone shapes to hug the stencil; ${(J.bones || []).length} bone lines kept`);

// merged output
writeFileSync(DIR + 'wing-bones-merged-R.json', JSON.stringify({ canvas: [W, H], side: 'R', boneShapes: grownShapes.map(g => g.contour), bones: J.bones || [], veins: J.veins || [], bridges: J.bridges || [] }));

// ── overlay render (full right-wing crop) ──
let mnX = W, mnY = H, mxX = 0, mxY = 0;
const argv = process.argv.slice(2).map(Number);
if (argv.length === 4) { mnX = argv[0] * W | 0; mnY = argv[1] * H | 0; mxX = argv[2] * W | 0; mxY = argv[3] * H | 0; }   // optional normalized crop for zooming a tip
else { const allPts = [...grownShapes.flatMap(g => g.contour), ...(J.bones || []).flat()]; for (const p of allPts) { const x = p[0] * W, y = p[1] * H; if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (y < mnY) mnY = y; if (y > mxY) mxY = y; } const pad = 30; mnX = Math.max(0, mnX - pad) | 0; mnY = Math.max(0, mnY - pad) | 0; mxX = Math.min(W - 1, mxX + pad) | 0; mxY = Math.min(H - 1, mxY + pad) | 0; }
const cw = mxX - mnX + 1, ch = mxY - mnY + 1, sc = Math.min(2.4, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);
// full skeleton (faint) to reveal EVERY drawn line — reuse `skel` computed above
const boneU = new Uint8Array(W * H); for (const g of grownShapes) for (let i = 0; i < W * H; i++) if (g.mask[i]) boneU[i] = 1;
const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) { const sx = mnX + (rx / sc | 0), sy = mnY + (ry / sc | 0), si = sy * W + sx, o = (ry * RW + rx) * 4; let r = ink[si] ? 70 : 16, g = ink[si] ? 74 : 20, b = ink[si] ? 84 : 30; if (skel[si]) { r = 235; g = 150; b = 60; } if (boneU[si]) { r = 90; g = 200; b = 255; } buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255; }
const blend = (x, y, c, wd) => { for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) { const px = (x | 0) + dx, py = (y | 0) + dy; if (px < 0 || py < 0 || px >= RW || py >= RH) continue; const i = (py * RW + px) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; } };
const SX = (nx) => (nx * W - mnX) * sc, SY = (ny) => (ny * H - mnY) * sc;
for (const g of grownShapes) { const c = g.contour; for (let i = 0; i < c.length; i++) { const a = c[i], b = c[(i + 1) % c.length]; const L = Math.hypot((b[0] - a[0]) * W, (b[1] - a[1]) * H) * sc, st = Math.max(1, L | 0); for (let s = 0; s <= st; s++) blend(SX(a[0] + (b[0] - a[0]) * s / st), SY(a[1] + (b[1] - a[1]) * s / st), [200, 255, 255], 1); } }
for (const ln of (J.bones || [])) for (let i = 0; i + 1 < ln.length; i++) { const a = ln[i], b = ln[i + 1]; const L = Math.hypot((b[0] - a[0]) * W, (b[1] - a[1]) * H) * sc, st = Math.max(1, L | 0); for (let s = 0; s <= st; s++) blend(SX(a[0] + (b[0] - a[0]) * s / st), SY(a[1] + (b[1] - a[1]) * s / st), [120, 120, 255], 1); }

const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-wingmerge.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-wingmerge.png  (grey=ink, ORANGE=all drawn lines (skeleton), CYAN=your bone shapes grown to the stroke, BLUE=bone lines)');
