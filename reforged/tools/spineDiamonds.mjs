// Extract the INDIVIDUAL diamond plate shapes from the dorsal-spine stencil (don't draw our own).
// Flood the exterior, label the enclosed cells, trace + smooth each cell's contour, keep the centred
// diamond column. Writes normalized, origin-centred diamond contours + an overlay to verify the trace.
//   node tools/spineDiamonds.mjs <stencil.png>
//     → refs/celestial/spine-diamonds.json   (array of {cx,cy,w,h, loop:[[x,y]...]} normalized 0..1)
//     → /tmp/celestial-diamonds.png           (stencil + traced contours, to eyeball solidity/smoothness)
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { traceContour } from './tracerCore.mjs';
import { dilate, smoothRing, resampleClosed } from './lineTrace.mjs';

const stencilPath = process.argv[2] || new URL('./refs/celestial/stencil-spine.png', import.meta.url).pathname;
const { w: W, h: H, rgba } = decodePNG(readFileSync(stencilPath));
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4, a = rgba[o + 3], lum = rgba[o] * 0.3 + rgba[o + 1] * 0.59 + rgba[o + 2] * 0.11; ink[i] = (a > 128 && lum < 170) ? 1 : 0; }

// exterior = flood !ink from the border; interior cells = !ink & !exterior
const ext = new Uint8Array(W * H), stack = [];
for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
while (stack.length) { const i = stack.pop(); if (ext[i] || ink[i]) continue; ext[i] = 1; const x = i % W, y = (i / W) | 0; if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1); if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W); }

// label connected components of interior cells (4-conn)
const lab = new Int32Array(W * H).fill(0); let nLab = 0; const cells = [];
for (let i = 0; i < W * H; i++) {
  if (ink[i] || ext[i] || lab[i]) continue;
  nLab++; const q = [i]; lab[i] = nLab; const px = [];
  while (q.length) { const j = q.pop(); px.push(j); const x = j % W, y = (j / W) | 0; for (const k of [j - 1, j + 1, j - W, j + W]) { if (k < 0 || k >= W * H) continue; const kx = k % W; if (Math.abs(kx - x) > 1) continue; if (!ink[k] && !ext[k] && !lab[k]) { lab[k] = nLab; q.push(k); } } }
  cells.push(px);
}

// build each cell → grow by 2 to reach the stroke midline → trace → smooth → normalize
const diamonds = [];
for (const px of cells) {
  if (px.length < 60) continue;                          // drop specks
  let mnx = W, mxx = 0, mny = H, mxy = 0;
  for (const j of px) { const x = j % W, y = (j / W) | 0; if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
  const m = new Uint8Array(W * H); for (const j of px) m[j] = 1;
  let ring = traceContour(dilate(m, W, H, 2), W, H);
  if (ring.length < 8) continue;
  ring = resampleClosed(ring, 96); for (let k = 0; k < 5; k++) ring = smoothRing(ring, 2); ring = resampleClosed(ring, 48);
  let cx = 0, cy = 0; for (const p of ring) { cx += p.x; cy += p.y; } cx /= ring.length; cy /= ring.length;
  diamonds.push({ cx: cx / W, cy: cy / H, w: (mxx - mnx) / W, h: (mxy - mny) / H, loop: ring.map(p => [+(p.x / W).toFixed(4), +(p.y / H).toFixed(4)]) });
}

// stencil ink horizontal centre → keep ONLY the centred spinal column (no side segments), and drop the tiny
// scale-overlap slivers between the real plates. A real dorsal diamond is centred, of decent size, ~diamond aspect.
let sxSum = 0, sN = 0; for (let i = 0; i < W * H; i++) if (ink[i]) { sxSum += i % W; sN++; }
const axis = sxSum / sN / W;
let central = diamonds.filter(d => Math.abs(d.cx - axis) < 0.02 && d.w > 0.014 && d.h > 0.014 && (d.h / d.w) >= 0.7 && (d.h / d.w) <= 2.8).sort((a, b) => a.cy - b.cy);
// merge near-duplicate cells at the same cy (keep the larger)
const merged = []; for (const d of central) { const p = merged[merged.length - 1]; if (p && Math.abs(d.cy - p.cy) < 0.012) { if (d.w * d.h > p.w * p.h) merged[merged.length - 1] = d; } else merged.push(d); } central = merged;
// PNG writer helpers (shared by canonical preview + grid + overlay)
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let kk = 0; kk < 8; kk++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
// CANONICAL diamond: pick the cleanest mid-body leaf (aspect 1.4–2.0, largest area), make it left/right
// symmetric (polar radius averaged across the vertical axis = cleaning the traced edge, not inventing a shape),
// and normalize to unit half-extents so it can be stamped + scaled onto each segment.
const cand = central.filter(d => { const a = d.h / d.w; return a >= 1.6 && a <= 2.0 && d.cy > 0.33 && d.cy < 0.50; }).sort((a, b) => b.w * b.h - a.w * a.h)[0] || central[Math.floor(central.length / 2)];
function canonicalize(d) {
  const N = 72, pts = d.loop.map(p => ({ x: p[0] - d.cx, y: p[1] - d.cy }));
  // polar samples (these plates are convex from centroid)
  const ang = pts.map(p => ({ t: Math.atan2(p.y, p.x), r: Math.hypot(p.x, p.y) })).sort((a, b) => a.t - b.t);
  const rAt = (t) => { while (t < -Math.PI) t += 2 * Math.PI; while (t > Math.PI) t -= 2 * Math.PI; let lo = ang[ang.length - 1], hi = ang[0]; for (let i = 0; i < ang.length; i++) { if (ang[i].t >= t) { hi = ang[i]; lo = ang[(i - 1 + ang.length) % ang.length]; break; } } let dt = hi.t - lo.t; if (dt <= 0) dt += 2 * Math.PI; let f = (t - lo.t); while (f < 0) f += 2 * Math.PI; f = dt ? f / dt : 0; return lo.r + (hi.r - lo.r) * f; };
  const loop = [];
  for (let i = 0; i < N; i++) { const t = -Math.PI + (2 * Math.PI) * i / N; const r = (rAt(t) + rAt(Math.PI - t)) / 2; loop.push([Math.cos(t) * r, Math.sin(t) * r]); }
  let mx = 0, my = 0; for (const [x, y] of loop) { mx = Math.max(mx, Math.abs(x)); my = Math.max(my, Math.abs(y)); }
  return loop.map(([x, y]) => [+(x / mx).toFixed(4), +(y / my).toFixed(4)]);   // unit half-extents
}
const canonical = canonicalize(cand);
writeFileSync(new URL('./refs/celestial/spine-diamonds.json', import.meta.url).pathname, JSON.stringify({ axis, canonical, diamonds: central }));
// emit an importable module for the 3D previewer — the canonical diamond outline (unit half-extents, origin-centred)
writeFileSync(new URL('../js/celestialSpine.js', import.meta.url).pathname,
  `// AUTO-GENERATED by tools/spineDiamonds.mjs — the dorsal-spine diamond TRACED from the stencil\n` +
  `// (cleanest central plate cy=${cand.cy.toFixed(3)}, left/right symmetrized, normalized to unit half-extents).\n` +
  `// Stamp it per armour row in tools/celestial3D.html, scaled to that row's cell. Do NOT hand-edit.\n` +
  `export const SPINE_DIAMOND = ${JSON.stringify(canonical)};\n`);
console.log('wrote ../js/celestialSpine.js');
console.log(`cells found: ${cells.length} · diamonds traced: ${diamonds.length} · central column kept: ${central.length} (axis x=${axis.toFixed(3)})`);
console.log(`canonical from cy=${cand.cy.toFixed(3)} (aspect ${(cand.h / cand.w).toFixed(2)}), ${canonical.length} pts`);
console.log('cys:', central.map(d => d.cy.toFixed(3)).join(' '));

// preview the canonical diamond alone (big) → confirm it's a clean solid smooth diamond
{
  const S = 240, gb = Buffer.alloc(S * S * 4); for (let i = 0; i < S * S; i++) { gb[i * 4] = 14; gb[i * 4 + 1] = 16; gb[i * 4 + 2] = 28; gb[i * 4 + 3] = 255; }
  const gbl = (x, y, c, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= S || y >= S) return; const i = (y * S + x) * 4, ia = 1 - a; gb[i] = c[0] * a + gb[i] * ia; gb[i + 1] = c[1] * a + gb[i + 1] * ia; gb[i + 2] = c[2] * a + gb[i + 2] * ia; };
  const P = canonical.map(p => [S / 2 + p[0] * S * 0.4, S / 2 + p[1] * S * 0.4]);
  for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length]; const st = Math.max(1, Math.hypot(B[0] - A[0], B[1] - A[1]) | 0); for (let s = 0; s <= st; s++) { const t = s / st; for (let o = 0; o < 2; o++) gbl(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + o, [90, 220, 255], 1); } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(S, 0); ih.writeUInt32BE(S, 4); ih[8] = 8; ih[9] = 6;
  const rawc = Buffer.alloc((S * 4 + 1) * S); for (let y = 0; y < S; y++) { rawc[y * (S * 4 + 1)] = 0; gb.copy(rawc, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4); }
  writeFileSync('/tmp/celestial-diamond-canonical.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(rawc)), chunk('IEND', Buffer.alloc(0))]));
  console.log('wrote /tmp/celestial-diamond-canonical.png');
}

// ── grid: each kept diamond normalized to its own box → judge shape solidity/smoothness ──
{
  const cols = 6, rows = Math.ceil(central.length / cols), cell = 90, GW = cols * cell, GH = rows * cell;
  const gb = Buffer.alloc(GW * GH * 4); for (let i = 0; i < GW * GH; i++) { gb[i * 4] = 14; gb[i * 4 + 1] = 16; gb[i * 4 + 2] = 28; gb[i * 4 + 3] = 255; }
  const gbl = (x, y, c, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= GW || y >= GH) return; const i = (y * GW + x) * 4, ia = 1 - a; gb[i] = c[0] * a + gb[i] * ia; gb[i + 1] = c[1] * a + gb[i + 1] * ia; gb[i + 2] = c[2] * a + gb[i + 2] * ia; };
  central.forEach((d, idx) => {
    const ox = (idx % cols) * cell + cell / 2, oy = ((idx / cols) | 0) * cell + cell / 2, sc = cell * 0.4;
    const P = d.loop.map(p => [ox + (p[0] - d.cx) / Math.max(d.w, d.h) * sc * 2, oy + (p[1] - d.cy) / Math.max(d.w, d.h) * sc * 2]);
    for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length]; const st = Math.max(1, Math.hypot(B[0] - A[0], B[1] - A[1]) | 0); for (let s = 0; s <= st; s++) { const t = s / st; gbl(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, [90, 220, 255], 1); } }
  });
  const ih = Buffer.alloc(13); ih.writeUInt32BE(GW, 0); ih.writeUInt32BE(GH, 4); ih[8] = 8; ih[9] = 6;
  const rawg = Buffer.alloc((GW * 4 + 1) * GH); for (let y = 0; y < GH; y++) { rawg[y * (GW * 4 + 1)] = 0; gb.copy(rawg, y * (GW * 4 + 1) + 1, y * GW * 4, (y + 1) * GW * 4); }
  writeFileSync('/tmp/celestial-diamonds-grid.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(rawg)), chunk('IEND', Buffer.alloc(0))]));
  console.log('wrote /tmp/celestial-diamonds-grid.png');
}

// ── overlay: stencil (grey) + traced diamond contours (cyan) + centroids (red) ──
const RW = Math.min(W, 480), k = RW / W, RH = Math.round(H * k);
const buf = Buffer.alloc(RW * RH * 4); for (let i = 0; i < RW * RH; i++) { buf[i * 4] = 12; buf[i * 4 + 1] = 14; buf[i * 4 + 2] = 24; buf[i * 4 + 3] = 255; }
const blend = (x, y, c, a) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink[y * W + x]) blend(x * k, y * k, [90, 100, 120], 0.7);
for (const d of central) { const P = d.loop.map(p => [p[0] * W * k, p[1] * H * k]); for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length]; const st = Math.max(1, Math.hypot(B[0] - A[0], B[1] - A[1]) | 0); for (let s = 0; s <= st; s++) { const t = s / st; blend(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, [80, 220, 255], 0.95); } } const c = [d.cx * W * k, d.cy * H * k]; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) blend(c[0] + dx, c[1] + dy, [255, 70, 70], 1); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-diamonds.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-diamonds.png');
