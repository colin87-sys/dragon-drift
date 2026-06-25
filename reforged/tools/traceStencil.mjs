// CELESTIAL STORM — STENCIL tracer (line-art → accurate filled silhouette → high-density vector outline).
//
// The earlier traceLayers.mjs traced COLOUR cut-outs; these new inputs are line-art STENCILS — thin dark
// outlines (with internal facet detail) on white, all on the shared 941×1672 canvas. Tracing the ink
// directly would follow every internal line, so we recover the SOLID silhouette first:
//
//   inkMask(L<thr) → CLOSE gaps (dilate R) → flood the OUTSIDE from the border through background → invert
//   (everything the outside can't reach = the filled shape; internal facet lines are now interior) → erode R
//   (undo the dilation fattening) → largestComponent(s) → traceContour → simplifyToBudget(eps, 200..400 pts).
//
// Wings: trace ONE wing and MIRROR it across the canvas centreline for a perfectly symmetric pair.
//
//   node tools/traceStencil.mjs           → /tmp/celestial-stencil.png  (filled silhouette + trace overlay)
//   node tools/traceStencil.mjs --points   → also draw the trace vertices
//   node tools/traceStencil.mjs --emit      → write js/celestialTrace.js (replaces the colour-layer trace)

import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { traceContour, simplifyToBudget } from './tracerCore.mjs';

const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const FILES = { body: 'stencil-body', wings: 'stencil-wings', spine: 'stencil-spine' };
const args = process.argv.slice(2);
const showPoints = args.includes('--points');
const emit = args.includes('--emit');

const INK = 200;           // luminance threshold: < INK = a drawn line
const SEAL = 2;            // morphology radius (iters) to close small stroke gaps

// ── masks + morphology ──────────────────────────────────────────────────────
function inkMask(rgba, w, h) {
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { const o = i * 4; const L = rgba[o] * 0.3 + rgba[o + 1] * 0.59 + rgba[o + 2] * 0.11; m[i] = L < INK ? 1 : 0; }
  return m;
}
function dilate(mask, w, h, iters) {
  let cur = mask;
  for (let it = 0; it < iters; it++) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && cur[ny * w + nx]) { v = 1; break; } }
      out[y * w + x] = v;
    }
    cur = out;
  }
  return cur;
}
function erode(mask, w, h, iters) {
  let cur = mask;
  for (let it = 0; it < iters; it++) {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let v = 1;
      for (let dy = -1; dy <= 1 && v; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || !cur[ny * w + nx]) { v = 0; break; } }
      out[y * w + x] = v;
    }
    cur = out;
  }
  return cur;
}
// Solid silhouette from a sealed ink mask: flood the background inward from every border pixel; whatever the
// outside can't reach (interior + the ink itself) is the filled shape.
function fillInside(sealed, w, h) {
  const out = new Uint8Array(w * h);    // 1 = outside background
  const stack = [];
  for (let x = 0; x < w; x++) { for (const y of [0, h - 1]) { const q = y * w + x; if (!sealed[q] && !out[q]) { out[q] = 1; stack.push(q); } } }
  for (let y = 0; y < h; y++) { for (const x of [0, w - 1]) { const q = y * w + x; if (!sealed[q] && !out[q]) { out[q] = 1; stack.push(q); } } }
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p / w) | 0;
    const tp = (nx, ny) => { if (nx < 0 || ny < 0 || nx >= w || ny >= h) return; const q = ny * w + nx; if (!sealed[q] && !out[q]) { out[q] = 1; stack.push(q); } };
    tp(x - 1, y); tp(x + 1, y); tp(x, y - 1); tp(x, y + 1);
  }
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = out[i] ? 0 : 1;
  return solid;
}
function topComponents(mask, w, h, keep = 1, minFrac = 0.003) {
  const lab = new Int32Array(w * h); const sizes = [0]; let cur = 0;
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || lab[s]) continue;
    cur++; let size = 0; const stack = [s]; lab[s] = cur;
    while (stack.length) { const p = stack.pop(); size++; const x = p % w, y = (p / w) | 0; const tp = (nx, ny) => { if (nx < 0 || ny < 0 || nx >= w || ny >= h) return; const q = ny * w + nx; if (mask[q] && !lab[q]) { lab[q] = cur; stack.push(q); } }; tp(x - 1, y); tp(x + 1, y); tp(x, y - 1); tp(x, y + 1); }
    sizes[cur] = size;
  }
  return sizes.map((sz, id) => ({ sz, id })).slice(1).filter(o => o.sz > minFrac * w * h).sort((a, b) => b.sz - a.sz).slice(0, keep)
    .map(({ id }) => { const out = new Uint8Array(w * h); for (let i = 0; i < out.length; i++) out[i] = lab[i] === id ? 1 : 0; return out; });
}

// ── trace a stencil layer → normalized contours + solid coverage % ──────────
function solidOf(name) {
  const { w, h, rgba } = decodePNG(readFileSync(DIR + FILES[name] + '.png'));
  const sealed = dilate(inkMask(rgba, w, h), w, h, SEAL);
  const solid = erode(fillInside(sealed, w, h), w, h, SEAL);
  let cov = 0; for (let i = 0; i < w * h; i++) cov += solid[i];
  return { w, h, solid, cov: cov / (w * h) };
}
// Smooth the staircased pixel ring (moving average) to recover the true sub-pixel edge, then resample to
// EXACTLY n evenly-spaced points by arc length → a dense, uniform 200..400-dot outline that hugs the art.
function smoothRing(pts, win = 3) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    let sx = 0, sy = 0, c = 0;
    for (let k = -win; k <= win; k++) { const p = pts[(i + k + n) % n]; sx += p.x; sy += p.y; c++; }
    out.push({ x: sx / c, y: sy / c });
  }
  return out;
}
function resampleClosed(pts, n) {
  const m = pts.length; let per = 0; const seg = [];
  for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % m]; const d = Math.hypot(b.x - a.x, b.y - a.y); seg.push(d); per += d; }
  const step = per / n, out = []; let i = 0, acc = 0, target = 0;
  for (let o = 0; o < n; o++) {
    while (acc + seg[i] < target && i < m - 1) { acc += seg[i]; i++; }
    const a = pts[i], b = pts[(i + 1) % m], t = seg[i] > 1e-9 ? (target - acc) / seg[i] : 0;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    target += step;
  }
  return out;
}
function traceComp(mask, w, h, n) {
  const ring = traceContour(mask, w, h);
  const dense = resampleClosed(smoothRing(smoothRing(ring, 4), 3), n);
  return dense.map((p) => ({ x: p.x / w, y: p.y / h }));
}

const W = 941, H = 1672;
const body = solidOf('body');
const spine = solidOf('spine');
const wings = solidOf('wings');

const bodyC = traceComp(topComponents(body.solid, W, H, 1)[0], W, H, 360);
const spineC = traceComp(topComponents(spine.solid, W, H, 1)[0], W, H, 320);
// wings: trace the larger single wing, then MIRROR across x=0.5 for the pair
const wingComps = topComponents(wings.solid, W, H, 2);
const oneWing = traceComp(wingComps[0], W, H, 320);
const mirrorX = (c) => c.map((p) => ({ x: 1 - p.x, y: p.y }));
const wingPair = [oneWing, mirrorX(oneWing)];

const layers = { torso: [bodyC], wings: wingPair, spine: [spineC] };
console.log(`body  solid cov ${(body.cov * 100).toFixed(1)}% → ${bodyC.length} pts`);
console.log(`wings solid cov ${(wings.cov * 100).toFixed(1)}% → ${oneWing.length} pts (traced once, mirrored)`);
console.log(`spine solid cov ${(spine.cov * 100).toFixed(1)}% → ${spineC.length} pts`);
console.log(`total ${bodyC.length + oneWing.length * 2 + spineC.length} vertices`);

// ── render: original stencils (faint) + traced silhouettes (colour) ─────────
const SCALE = 0.42, RW = Math.round(W * SCALE), RH = Math.round(H * SCALE);
const buf = Buffer.alloc(RW * RH * 4);
for (let i = 0; i < RW * RH; i++) { const o = i * 4; buf[o] = 10; buf[o + 1] = 12; buf[o + 2] = 24; buf[o + 3] = 255; }
const SXp = (nx) => nx * RW, SYp = (ny) => ny * RH;
function blend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH || a <= 0) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; }
function fill(c, col, a = 1) { const P = c.map((p) => [SXp(p.x), SYp(p.y)]); let mnY = 1e9, mxY = -1e9; for (const p of P) { if (p[1] < mnY) mnY = p[1]; if (p[1] > mxY) mxY = p[1]; } for (let y = Math.max(0, mnY | 0); y <= Math.min(RH - 1, mxY | 0); y++) { const xs = []; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a2 = P[i], b = P[j]; if ((a2[1] > y) !== (b[1] > y)) xs.push(a2[0] + (y - a2[1]) / (b[1] - a2[1]) * (b[0] - a2[0])); } xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = xs[k] | 0; x <= (xs[k + 1] | 0); x++) blend(x, y, col, a); } }
function stroke(c, col, wd, a = 1) { const P = c.map((p) => [SXp(p.x), SYp(p.y)]); P.push(P[0]); for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t; for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) blend(px + dx, py + dy, col, a); } } }

const OUT = [10, 12, 20];
fill(layers.torso[0], [46, 38, 86]); stroke(layers.torso[0], OUT, 1.4);
for (const c of layers.wings) { fill(c, [70, 34, 116]); stroke(c, OUT, 1.4); }
for (const c of layers.spine) { stroke(c, [120, 226, 255], 3, 0.18); fill(c, [120, 226, 255]); stroke(c, [200, 245, 255], 1, 0.9); }
if (showPoints) { const dot = (c, col) => c.forEach((p) => { const x = SXp(p.x) | 0, y = SYp(p.y) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blend(x + dx, y + dy, col, 1); }); dot(layers.torso[0], [159, 224, 106]); layers.wings.forEach((c) => dot(c, [255, 180, 84])); dot(layers.spine[0], [255, 93, 224]); }

// PNG encode
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-stencil.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-stencil.png');

if (emit) {
  const round = (c) => c.map((p) => [+p.x.toFixed(4), +p.y.toFixed(4)]);
  const data = { canvas: [W, H], source: 'stencil', torso: [round(bodyC)], wings: wingPair.map(round), spine: [round(spineC)] };
  writeFileSync(new URL('../js/celestialTrace.js', import.meta.url), `// AUTO-GENERATED by tools/traceStencil.mjs — high-density vector outlines traced from the\n// line-art STENCILS (body / wings / spine), normalized 0..1 on the shared ${W}×${H} canvas.\n// Wing traced once and mirrored across x=0.5 for a symmetric pair.\nexport const CELESTIAL_TRACE = ${JSON.stringify(data)};\n`);
  console.log('wrote js/celestialTrace.js');
}
