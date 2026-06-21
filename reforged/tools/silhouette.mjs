// SILHOUETTE MIRROR — a clean, filled rear/side/front silhouette of any dragon, rendered HEADLESSLY
// with no browser and no dependencies (~100ms), so shape can be eyeballed + diffed against a concept
// image without booting Chromium (which is slow, and whose WebGL is unavailable in CI/this sandbox).
//
// WHY: the slow part of authoring is "concept image → in-game rear shape". Screenshots need Playwright +
// a full textured render (rider, lighting, HUD) that HIDES the shape. This isolates pure SILHOUETTE —
// the union of every mesh triangle projected through the real chase camera — as a flat fill, the exact
// thing a reference sketch shows. Reuses tools/readability.mjs's projection (don't reinvent the camera).
//
//   node tools/silhouette.mjs                 # pearl, rear view, apex form
//   node tools/silhouette.mjs <key> [view] [form]
//       view = rear (default, the chase cam) | side | front
//       form = 0..3 (default = apex)
//     → /tmp/sil-<key>-<view>.png   (white fill on near-black; same framing as the rear gameplay crop)

import { register } from 'node:module';
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
register('./three-resolver.mjs', import.meta.url);

// DOM/canvas shim (same as readability.mjs — building the model touches util.js canvas helpers + save.js).
const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

const key = process.argv[2] || 'pearl';
const view = process.argv[3] || 'rear';
const W = 560, H = 440;

if (!DRAGONS[key]) { console.log(`unknown dragon: ${key}`); process.exit(1); }
const maxTier = maxTierFor(key);
const tier = process.argv[4] != null ? Number(process.argv[4]) : maxTier;

// Cameras. "rear" is the REAL chase cam (cameraController.js / readability.mjs) — the view gameplay shows.
const cam = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
const VIEWS = {
  rear:  { pos: [0, 3.6, 12.3], look: [0, 1.0, -16] },   // behind + above, looking forward (chase cam)
  side:  { pos: [15, 2.2, 0],   look: [0, 1.3, 0] },     // profile (head points -z → faces left)
  front: { pos: [0, 2.4, -14],  look: [0, 1.3, 0] },     // head-on
};
const { group } = buildDragonModel(ascendedDef(DRAGONS[key], tier, 0), {});
group.updateMatrixWorld(true);

// "rear" is the fixed chase cam (gameplay-faithful). "side"/"front" are diagnostic, so AUTO-FIT them to
// the model bounds — place the camera along the view axis at the distance that frames the whole creature.
if (view === 'rear') {
  cam.position.set(...VIEWS.rear.pos); cam.lookAt(...VIEWS.rear.look);
} else {
  const box = new THREE.Box3().setFromObject(group), ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const dir = view === 'front' ? new THREE.Vector3(0, 0.25, -1) : new THREE.Vector3(1, 0.18, 0); // -z is the head
  // Fit by the dims PERPENDICULAR to the view axis (what actually fills the frame), not the wingspan.
  const perpW = view === 'front' ? sz.x : sz.z, perpH = sz.y;
  const vfov = cam.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * (W / H));
  const fit = Math.max(perpH * 0.5 / Math.tan(vfov / 2), perpW * 0.5 / Math.tan(hfov / 2));
  cam.position.copy(ctr).addScaledVector(dir.normalize(), fit * 1.25);
  cam.lookAt(ctr);
}
cam.updateMatrixWorld(true);
cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
cam.updateProjectionMatrix();

// --- Rasterize the union of all mesh triangles into an 8-bit coverage buffer ---
const buf = new Uint8Array(W * H);   // 0 = background, 255 = silhouette
const _w = new THREE.Vector3(), _e = new THREE.Vector3(), _n = new THREE.Vector3();
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, tris = 0;

function project(i, attr, mw) {
  _w.fromBufferAttribute(attr, i).applyMatrix4(mw);
  _e.copy(_w).applyMatrix4(cam.matrixWorldInverse);          // view space → cull verts at/behind the lens
  _n.copy(_w).project(cam);
  return { ez: _e.z, x: (_n.x * 0.5 + 0.5) * W, y: (1 - (_n.y * 0.5 + 0.5)) * H };
}
function fillTri(a, b, c) {
  if (a.ez > -0.05 || b.ez > -0.05 || c.ez > -0.05) return;  // any vertex behind camera → skip triangle
  const loX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), hiX = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
  const loY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), hiY = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
  const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(d) < 1e-9) return;
  for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const w0 = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / d;
    const w1 = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / d;
    if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) {
      buf[y * W + x] = 255;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
group.traverse((o) => {
  if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
  const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
  const tri = (i0, i1, i2) => { fillTri(project(i0, pos, mw), project(i1, pos, mw), project(i2, pos, mw)); tris++; };
  if (idx) for (let i = 0; i < idx.count; i += 3) tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
  else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
});

// --- Minimal grayscale PNG encoder (zlib + hand-rolled CRC32; no external deps) ---
const crcTable = (() => { const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function pngGray(w, h, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0; // 8-bit grayscale
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w + 1)] = 0; pixels.copy ? 0 : 0; for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = pixels[y * w + x]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Lift the background off pure black so the frame is visible, keep silhouette bright.
const out = Buffer.alloc(W * H);
for (let i = 0; i < buf.length; i++) out[i] = buf[i] ? 245 : 18;
const path = `/tmp/sil-${key}-${view}.png`;
writeFileSync(path, pngGray(W, H, out));

const FORM = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
const cov = (maxX >= minX) ? (((maxX - minX) / W) * 100).toFixed(0) + '% wide · ' + (((maxY - minY) / H) * 100).toFixed(0) + '% tall' : 'EMPTY';
console.log(`${DRAGONS[key].name || key} · ${FORM[tier] || 'T' + tier} · ${view} — ${tris} tris → ${cov}`);
console.log(`wrote ${path}`);
