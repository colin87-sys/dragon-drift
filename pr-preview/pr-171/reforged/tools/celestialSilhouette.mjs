// CELESTIAL STORM — headless rear-cam silhouette renderer.
//
// Rasterizes the 2D blueprint (js/celestialStormSilhouette.js) to a colour PNG with
// NO browser and NO WebGL (~50ms), so the rear "logo" can be eyeballed and iterated
// before any 3D work — Chromium's WebGL is unavailable in this sandbox/CI. This is the
// Phase-1 source of truth: if the shape is wrong here, the 3D version can't save it.
//
//   node tools/celestialSilhouette.mjs            → /tmp/celestial-rear.png
//   node tools/celestialSilhouette.mjs --anchors  → also draw + legend the anchor markers
//   node tools/celestialSilhouette.mjs --plain     → membrane/spine only (clean hero shot)
//
// Pure software rasterizer (scanline fill + disk-stamped strokes, src-over alpha).

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { buildRearSilhouette } from '../js/celestialStormSilhouette.js';

// Minimal RGBA → PNG encoder (inlined so this Phase-1 tool stays dependency-free and
// doesn't drag in Three.js + the roster via silhouetteCore).
const crcTable = (() => { const tb = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tb[n] = c >>> 0; }
  return tb; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
};
function pngRGBA(w, h, rgba) {
  const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const args = process.argv.slice(2);
const showAnchors = args.includes('--anchors');
const plain = args.includes('--plain');

const W = 560, H = 720;
const buf = Buffer.alloc(W * H * 4);
// background — deep night sky so the cyan glow + dark outline both read
for (let i = 0; i < W * H; i++) {
  const y = Math.floor(i / W);
  const t = y / H;
  buf[i * 4] = Math.round(10 + t * 8);
  buf[i * 4 + 1] = Math.round(12 + t * 6);
  buf[i * 4 + 2] = Math.round(26 + t * 14);
  buf[i * 4 + 3] = 255;
}

const sil = buildRearSilhouette();
const b = sil.bounds;
// fit-to-canvas with margin, preserving aspect (symmetric in X about the centre)
const margin = 48;
const spanX = Math.max(b.maxX - b.minX, 0.1), spanY = Math.max(b.maxY - b.minY, 0.1);
const scale = Math.min((W - 2 * margin) / spanX, (H - 2 * margin) / spanY);
const cx = W / 2;                                  // X = 0 maps to the centre column
const midY = (b.maxY + b.minY) / 2;                // vertically centre the creature
const cy = H / 2 + midY * scale;                   // (cy maps y = 0)
const SX = (x) => cx + x * scale;
const SY = (y) => cy - y * scale;
const S = (p) => [SX(p[0]), SY(p[1])];

// --- rasterizer -------------------------------------------------------------
function blend(x, y, c, a) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  const i = (y * W + x) * 4, ia = 1 - a;
  buf[i] = c[0] * a + buf[i] * ia;
  buf[i + 1] = c[1] * a + buf[i + 1] * ia;
  buf[i + 2] = c[2] * a + buf[i + 2] * ia;
}
function fillPoly(pts, color, alpha = 1) {
  const P = pts.map(S);
  let minY = Infinity, maxY = -Infinity;
  for (const p of P) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  minY = Math.max(0, Math.floor(minY)); maxY = Math.min(H - 1, Math.ceil(maxY));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const a = P[i], c = P[j];
      if ((a[1] > y) !== (c[1] > y)) xs.push(a[0] + (y - a[1]) / (c[1] - a[1]) * (c[0] - a[0]));
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.floor(xs[k]); x <= Math.ceil(xs[k + 1]); x++) blend(x, y, color, alpha);
    }
  }
}
function disk(px, py, r, color, alpha) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const d = Math.hypot(dx, dy);
    if (d <= r) blend(px + dx, py + dy, color, alpha * Math.min(1, (r - d) + 0.5));
  }
}
function stroke(pts, width, color, alpha = 1, screen = false) {
  const P = screen ? pts : pts.map(S);
  const r = width / 2;
  for (let i = 0; i + 1 < P.length; i++) {
    const a = P[i], c = P[i + 1];
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const steps = Math.max(1, Math.ceil(len));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      disk(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, r, color, alpha);
    }
  }
}

const ST = sil.spec.style;
const OUTLINE = ST.outlineColor;
const outlineW = Math.max(2, ST.outlineThickness * scale);

// --- draw order: dark outline shells first (toon), then fills, then glow on top ----
function drawWing(w) {
  // toon outline shell (slightly fatter, behind the fill)
  stroke([...w.membraneOutline, w.membraneOutline[0]], outlineW * 2.2, OUTLINE, 1);
  // membrane panels, alternating tone for faceted crystal read
  w.panels.forEach((panel, i) => {
    const shade = 1 - i * 0.12;
    fillPoly(panel, [ST.membraneColor[0] * shade, ST.membraneColor[1] * shade, ST.membraneColor[2] * shade], ST.membraneAlpha);
  });
  // bones (struts) — dark, with a faint inner highlight
  w.bones.forEach((bone) => {
    stroke(bone, outlineW * 1.4, [22, 16, 40], 0.95);
    stroke(bone, outlineW * 0.5, [120, 90, 170], 0.5);
  });
  // lightning veins on top
  if (!plain) w.veins.forEach((v) => {
    const col = v.color === 'secondary' ? ST.glowSecondary : ST.glowPrimary;
    stroke(v.points, outlineW * 1.6, col, 0.18);  // bloom halo
    stroke(v.points, outlineW * 0.7, col, 0.95);  // core
  });
}

// body outline shell + fill
stroke([...sil.bodyOutline, sil.bodyOutline[0]], outlineW * 2.2, OUTLINE, 1);
fillPoly(sil.bodyOutline, ST.bodyColor, 1);

// wings (draw both; symmetric)
drawWing(sil.wings.left);
drawWing(sil.wings.right);

// tail spear + fins + glowing centre strip
sil.tail.fins.forEach((f) => { stroke([...f, f[0]], outlineW * 2, OUTLINE, 1); fillPoly(f, ST.membraneColor, 0.9); });
stroke([...sil.tail.spear, sil.tail.spear[0]], outlineW * 2.2, OUTLINE, 1);
fillPoly(sil.tail.spear, [70, 80, 130], 1);
fillPoly(sil.tail.spear, ST.spineColor, 0.35);
if (!plain) { stroke(sil.tail.centerStrip, outlineW * 2, ST.spineColor, 0.15); stroke(sil.tail.centerStrip, outlineW * 0.8, ST.spineColor, 0.9); }

// dorsal spine plates (glowing diamonds) — the follow-line, drawn last so it tops the body
sil.spinePlates.forEach((pl) => {
  stroke([...pl.diamond, pl.diamond[0]], outlineW * 1.6, OUTLINE, 0.9);
  fillPoly(pl.diamond, ST.spineColor, 0.95);
  const c = S(pl.center);
  if (!plain) disk(c[0], c[1], outlineW * 1.4, ST.spineColor, 0.22);  // bloom
});

// head horns
sil.head.horns.forEach((hn) => { stroke(hn, outlineW * 2, OUTLINE, 1); stroke(hn, outlineW * 0.9, [120, 90, 170], 0.9); });

// optional anchor markers (QA)
if (showAnchors) {
  const colByGroup = { wingBone: [255, 180, 84], scallop: [255, 93, 224], body: [159, 224, 106], tail: [120, 240, 255] };
  for (const a of sil.anchors) {
    const p = S([a.x, a.y]);
    disk(p[0], p[1], 4, [10, 12, 20], 1);
    disk(p[0], p[1], 3, colByGroup[a.group] || [255, 255, 255], 1);
  }
  console.log('anchor legend: orange=wingBone  magenta=scallop  green=body  cyan=tail');
}

writeFileSync('/tmp/celestial-rear.png', pngRGBA(W, H, buf));
const widthPct = ((b.maxX - b.minX) / spanX * 100).toFixed(0);
console.log(`Celestial Storm · rear silhouette — wingspan ${ (b.maxX - b.minX).toFixed(2) } · ${sil.spinePlates.length} spine plates`);
console.log('wrote /tmp/celestial-rear.png');
