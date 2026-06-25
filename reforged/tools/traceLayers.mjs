// CELESTIAL STORM — auto-trace the layer-separated concept art into accurate vector
// outlines, exactly the way the interactive tracer (tools/tracer.html) does, but
// headless and over the REGISTERED layer exports (wings / torso / spine all share the
// 941×1672 canvas, so their traces composite without manual alignment).
//
// Pipeline per layer = the tracer's:  subjectMask → largestComponent(s) → traceContour
//   → simplifyToBudget(~N points).  The output is the dragon's REAL silhouette, not a
// hand-guessed anchor rig.
//
//   node tools/traceLayers.mjs            → /tmp/celestial-trace.png  (filled vector composite)
//   node tools/traceLayers.mjs --points   → also draw the ~N trace vertices
//   node tools/traceLayers.mjs --emit      → write js/celestialTrace.js (normalized outline data)

import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { traceContour, simplifyToBudget } from './tracerCore.mjs';

const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const FILES = { full: 'full', wings: 'wings', torso: 'torso', spine: 'spine' };
const args = process.argv.slice(2);
const showPoints = args.includes('--points');
const emit = args.includes('--emit');

// subject = saturated OR dark (i.e. NOT the near-white flattened background).
function subjectMask(rgba, w, h) {
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4, r = rgba[o], g = rgba[o + 1], b = rgba[o + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    m[i] = (mx - mn > 22 || mx < 230) ? 1 : 0;
  }
  return m;
}

// Label 4-connected components; return the biggest `keep` of them (each its own mask),
// largest first. (Wings = two blobs; torso/spine = one.)
function topComponents(mask, w, h, keep = 1, minFrac = 0.004) {
  const lab = new Int32Array(w * h); const sizes = [0];
  let cur = 0;
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || lab[s]) continue;
    cur++; let size = 0; const stack = [s]; lab[s] = cur;
    while (stack.length) {
      const p = stack.pop(); size++; const x = p % w, y = (p / w) | 0;
      const tp = (nx, ny) => { if (nx < 0 || ny < 0 || nx >= w || ny >= h) return; const q = ny * w + nx; if (mask[q] && !lab[q]) { lab[q] = cur; stack.push(q); } };
      tp(x - 1, y); tp(x + 1, y); tp(x, y - 1); tp(x, y + 1);
    }
    sizes[cur] = size;
  }
  const order = sizes.map((sz, id) => ({ sz, id })).slice(1).filter(o => o.sz > minFrac * w * h).sort((a, b) => b.sz - a.sz).slice(0, keep);
  return order.map(({ id }) => { const out = new Uint8Array(w * h); for (let i = 0; i < out.length; i++) out[i] = lab[i] === id ? 1 : 0; return out; });
}

// average subject colour of a layer (for the flat vector fill)
function avgColor(rgba, mask, w, h) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < w * h; i++) if (mask[i]) { const o = i * 4; r += rgba[o]; g += rgba[o + 1]; b += rgba[o + 2]; n++; }
  return n ? [r / n | 0, g / n | 0, b / n | 0] : [128, 128, 128];
}

// Trace one layer → { contours:[[{x,y}..] normalized 0..1], color }
function traceLayer(name, keep, budget, eps) {
  const { w, h, rgba } = decodePNG(readFileSync(DIR + FILES[name] + '.png'));
  const full = subjectMask(rgba, w, h);
  const comps = topComponents(full, w, h, keep);
  const contours = comps.map((m) => {
    const ring = traceContour(m, w, h);
    const simp = simplifyToBudget(ring, eps, budget);
    return simp.map((p) => ({ x: p.x / w, y: p.y / h }));
  });
  return { name, w, h, rgba, contours, color: avgColor(rgba, full, w, h) };
}

const layers = {
  torso: traceLayer('torso', 1, 240, 0.6),
  wings: traceLayer('wings', 2, 220, 0.4),   // left + right, fine eps for the scallops
  spine: traceLayer('spine', 1, 260, 0.5),
};
const W = layers.torso.w, H = layers.torso.h;
const totalPts = Object.values(layers).reduce((s, l) => s + l.contours.reduce((a, c) => a + c.length, 0), 0);
for (const l of Object.values(layers)) console.log(`${l.name.padEnd(6)} ${l.contours.length} contour(s), ${l.contours.map(c => c.length).join('+')} pts, color rgb(${l.color})`);
console.log(`total ${totalPts} trace points`);

// ── render the traced vectors to a PNG (downscaled) ─────────────────────────
const SCALE = 0.42;
const RW = Math.round(W * SCALE), RH = Math.round(H * SCALE);
const buf = Buffer.alloc(RW * RH * 4);
for (let i = 0; i < RW * RH; i++) { const o = i * 4; buf[o] = 10; buf[o + 1] = 12; buf[o + 2] = 24; buf[o + 3] = 255; }
const SX = (nx) => nx * RW, SY = (ny) => ny * RH;
function blend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH || a <= 0) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; }
function fill(contour, c, a = 1) {
  const P = contour.map((p) => [SX(p.x), SY(p.y)]);
  let minY = Infinity, maxY = -Infinity; for (const p of P) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  for (let y = Math.max(0, minY | 0); y <= Math.min(RH - 1, maxY | 0); y++) {
    const xs = []; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a2 = P[i], b = P[j]; if ((a2[1] > y) !== (b[1] > y)) xs.push(a2[0] + (y - a2[1]) / (b[1] - a2[1]) * (b[0] - a2[0])); }
    xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = xs[k] | 0; x <= (xs[k + 1] | 0); x++) blend(x, y, c, a);
  }
}
function stroke(contour, c, wdt, a = 1, close = true) {
  const P = contour.map((p) => [SX(p.x), SY(p.y)]); if (close) P.push(P[0]);
  for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t; for (let dy = -wdt; dy <= wdt; dy++) for (let dx = -wdt; dx <= wdt; dx++) if (dx * dx + dy * dy <= wdt * wdt) blend(px + dx, py + dy, c, a); } }
}

const artMode = args.includes('--art');

// --art: fill each traced contour by SAMPLING the real source art (point-in-polygon),
// proving the vector boundary hugs the real pixels. Default: flat cel-shaded fills.
function fillArt(contour, layer, glow) {
  const { rgba, w, h } = layer;
  const P = contour.map((p) => [SX(p.x), SY(p.y)]);
  let minY = Infinity, maxY = -Infinity; for (const p of P) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  for (let y = Math.max(0, minY | 0); y <= Math.min(RH - 1, maxY | 0); y++) {
    const xs = []; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = xs[k] | 0; x <= (xs[k + 1] | 0); x++) {
      const sx = Math.min(w - 1, x / RW * w | 0), sy = Math.min(h - 1, y / RH * h | 0), o = (sy * w + sx) * 4;
      let r = rgba[o], g = rgba[o + 1], b = rgba[o + 2];
      if (r > 232 && g > 232 && b > 232) continue;        // skip bled-in background
      blend(x, y, [r, g, b], 1);
    }
  }
}

const OUT = [10, 12, 20];
if (artMode) {
  fillArt(layers.torso.contours[0], layers.torso);
  for (const c of layers.wings.contours) fillArt(c, layers.wings);
  for (const c of layers.spine.contours) fillArt(c, layers.spine);
} else {
  // flat cel-shaded vector fills + dark toon outline + cyan spine glow
  fill(layers.torso.contours[0], [46, 38, 86]); stroke(layers.torso.contours[0], OUT, 1.6, 1);
  for (const c of layers.wings.contours) { fill(c, [70, 34, 116]); stroke(c, OUT, 1.6, 1); }
  for (const c of layers.spine.contours) { stroke(c, [120, 226, 255], 3, 0.18); fill(c, [120, 226, 255]); stroke(c, [200, 245, 255], 1, 0.9); }
}

if (showPoints) {
  const dot = (contour, col) => contour.forEach((p) => { const x = SX(p.x) | 0, y = SY(p.y) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) blend(x + dx, y + dy, col, 1); });
  layers.torso.contours.forEach((c) => dot(c, [159, 224, 106]));
  layers.wings.contours.forEach((c) => dot(c, [255, 180, 84]));
  layers.spine.contours.forEach((c) => dot(c, [255, 93, 224]));
}

// minimal PNG encode
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
writeFileSync('/tmp/celestial-trace.png', png);
console.log('wrote /tmp/celestial-trace.png');

if (emit) {
  const round = (c) => c.map((p) => [+p.x.toFixed(4), +p.y.toFixed(4)]);
  const data = { canvas: [W, H], torso: layers.torso.contours.map(round), wings: layers.wings.contours.map(round), spine: layers.spine.contours.map(round) };
  writeFileSync(new URL('../js/celestialTrace.js', import.meta.url), `// AUTO-GENERATED by tools/traceLayers.mjs — accurate vector outlines traced from the\n// layer-separated Celestial Storm concept art (normalized 0..1, shared ${W}×${H} canvas).\nexport const CELESTIAL_TRACE = ${JSON.stringify(data)};\n`);
  console.log('wrote js/celestialTrace.js');
}
