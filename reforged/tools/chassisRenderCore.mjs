// Headless render core for the body-plan creatures — no browser, no deps.
//
// Builds a creature from genes, then offers two renders that BOTH agree with the
// in-browser look:
//   • renderCoverage()  → flat silhouette coverage buffer (for the anti-reskin
//                         spacing gate; can STRIP decoration so trim can't cheat),
//   • renderToon()      → a z-buffered, 3-band cel-shaded RGBA image with a
//                         screen-space outline (the chase-cam preview).
//
// Camera matches the game's rear chase framing; views auto-fit the model bounds
// so a long serpent and a compact wyvern are compared at the same screen size.

import { register } from 'node:module';
import { deflateSync } from 'node:zlib';
register('./three-resolver.mjs', import.meta.url);
globalThis.window = globalThis;                       // three is DOM-free for geometry, but be safe

export const THREE = await import('three');
const { buildCreature } = await import('../js/buildFromBodyPlan.js');
const { skinPass } = await import('../js/skinPass.js');

// Mesh roles excluded from the NAKED-body silhouette (the anti-reskin gate):
// outline shells + capped decoration (horns, extra spines). Everything
// structural — body/neck/tail/wings/limbs/head/mane — stays.
const STRIP_ROLES = new Set(['outline', 'horn', 'spine']);
const isStripped = (o) => o.userData.outline || o.userData.decoration || STRIP_ROLES.has(o.userData.role);

export function build(genes, { skin = false } = {}) {
  const r = buildCreature(genes, {});
  if (skin) skinPass(r.group, r.genes.palette);
  r.group.updateMatrixWorld(true);
  return r;
}

// Resolve a camera + its matrices for a view, auto-fit to the group's bounds.
function setupCamera(group, view, W, H) {
  const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
  const box = new THREE.Box3();
  group.traverse((o) => { if (o.isMesh && !o.userData.outline) box.expandByObject(o); });
  const ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const vfov = cam.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * (W / H));
  // dir = where the camera sits relative to the centre; perpW/perpH fill the frame.
  let dir, perpW, perpH;
  if (view === 'threeq') { dir = new THREE.Vector3(0.8, 0.42, 1); perpW = Math.max(sz.x, sz.z); perpH = sz.y; }
  else if (view === 'side') { dir = new THREE.Vector3(1, 0.12, 0.02); perpW = sz.z; perpH = sz.y; }
  else { dir = new THREE.Vector3(0, 0.2, 1); perpW = sz.x; perpH = sz.y; }   // rear chase, slightly above
  const fit = Math.max(perpH * 0.5 / Math.tan(vfov / 2), perpW * 0.5 / Math.tan(hfov / 2));
  cam.position.copy(ctr).addScaledVector(dir.normalize(), fit * 1.3);
  cam.lookAt(ctr);
  cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  cam.updateProjectionMatrix();
  return cam;
}

function project(cam, W, H, v) {
  const e = v.clone().applyMatrix4(cam.matrixWorldInverse);
  const n = v.clone().project(cam);
  return { ez: e.z, x: (n.x * 0.5 + 0.5) * W, y: (1 - (n.y * 0.5 + 0.5)) * H };
}

// Flat coverage raster (1 byte/px). strip=true removes decoration + outline.
export function renderCoverage(group, { view = 'rear', W = 360, H = 360, strip = true } = {}) {
  const cam = setupCamera(group, view, W, H);
  const buf = new Uint8Array(W * H);
  const fill = (a, b, c) => {
    if (a.ez > -0.05 || b.ez > -0.05 || c.ez > -0.05) return;
    const loX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), hiX = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
    const loY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), hiY = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
    const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(d) < 1e-9) return;
    for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / d;
      const w1 = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / d;
      if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) buf[y * W + x] = 255;
    }
  };
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || (strip && isStripped(o))) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    const p = (i) => project(cam, W, H, new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mw));
    if (idx) for (let i = 0; i < idx.count; i += 3) fill(p(idx.getX(i)), p(idx.getX(i + 1)), p(idx.getX(i + 2)));
    else for (let i = 0; i < pos.count; i += 3) fill(p(i), p(i + 1), p(i + 2));
  });
  return { buf, W, H };
}

// Cel-shaded RGBA render with a z-buffer + screen-space outline.
export function renderToon(group, { view = 'rear', W = 420, H = 420, bg = [14, 18, 26] } = {}) {
  const cam = setupCamera(group, view, W, H);
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {            // vertical gradient sky
    const t = y / H, i = (y * W + x) * 4;
    rgba[i] = bg[0] * (1.3 - t * 0.6); rgba[i + 1] = bg[1] * (1.3 - t * 0.6); rgba[i + 2] = bg[2] * (1.5 - t * 0.8); rgba[i + 3] = 255;
  }
  const depth = new Float32Array(W * H).fill(-Infinity);   // nearest = greatest (least-negative) camera-space z
  const id = new Int32Array(W * H).fill(-1);
  const light = new THREE.Vector3(-0.4, 0.85, 0.5).normalize();
  let meshId = 0;
  const fa = new THREE.Vector3(), fb = new THREE.Vector3(), fc = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || o.userData.outline) return;
    const col = (o.material && o.material.color) ? o.material.color : { r: 0.6, g: 0.6, b: 0.6 };
    const emi = (o.material && o.material.emissiveIntensity) ? o.material.emissiveIntensity : 0;
    const mid = ++meshId;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    const tri = (i0, i1, i2) => {
      fa.fromBufferAttribute(pos, i0).applyMatrix4(mw); fb.fromBufferAttribute(pos, i1).applyMatrix4(mw); fc.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      e1.subVectors(fb, fa); e2.subVectors(fc, fa); nrm.crossVectors(e1, e2).normalize();
      const ndl = Math.abs(nrm.dot(light));                            // two-sided (winding-agnostic)
      const band = emi > 0.2 ? 1.0 : (ndl > 0.62 ? 1.0 : ndl > 0.30 ? 0.74 : 0.5);  // 3-band cel ramp
      const A = project(cam, W, H, fa), B = project(cam, W, H, fb), C = project(cam, W, H, fc);
      if (A.ez > -0.05 || B.ez > -0.05 || C.ez > -0.05) return;
      const loX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x))), hiX = Math.min(W - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
      const loY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y))), hiY = Math.min(H - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
      const d = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
      if (Math.abs(d) < 1e-9) return;
      const r = Math.min(255, col.r * 255 * band + emi * 90), gg = Math.min(255, col.g * 255 * band + emi * 90), b = Math.min(255, col.b * 255 * band + emi * 110);
      for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((B.y - C.y) * (px - C.x) + (C.x - B.x) * (py - C.y)) / d;
        const w1 = ((C.y - A.y) * (px - C.x) + (A.x - C.x) * (py - C.y)) / d;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * A.ez + w1 * B.ez + w2 * C.ez;                   // camera-space z (less negative = nearer)
        const k = y * W + x;
        if (z <= depth[k]) continue;                                   // keep the nearest
        depth[k] = z; id[k] = mid;
        const i = k * 4; rgba[i] = r; rgba[i + 1] = gg; rgba[i + 2] = b; rgba[i + 3] = 255;
      }
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
  });
  // screen-space outline: dark any pixel whose neighbour is a different mesh / background
  const out = Buffer.from(rgba);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const k = y * W + x, me = id[k];
    if (me < 0) continue;
    if (id[k - 1] !== me || id[k + 1] !== me || id[k - W] !== me || id[k + W] !== me) {
      const i = k * 4; out[i] = 8; out[i + 1] = 10; out[i + 2] = 14;
    }
  }
  return { rgba: out, W, H };
}

// ── PNG encode (RGBA / gray) ────────────────────────────────────────────────
const crcTable = (() => { const tb = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tb[n] = c >>> 0; } return tb; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0); return Buffer.concat([len, td, crc]); }
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export function pngRGBA(w, h, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Composite tiles (each {rgba,W,H}) into a horizontal strip, gap px between.
export function strip(tiles, gap = 8, bg = [20, 24, 32]) {
  const H = Math.max(...tiles.map((t) => t.H)), W = tiles.reduce((a, t) => a + t.W, 0) + gap * (tiles.length - 1);
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { out[i * 4] = bg[0]; out[i * 4 + 1] = bg[1]; out[i * 4 + 2] = bg[2]; out[i * 4 + 3] = 255; }
  let xoff = 0;
  for (const t of tiles) {
    for (let y = 0; y < t.H; y++) for (let x = 0; x < t.W; x++) {
      const s = (y * t.W + x) * 4, d = (y * W + (xoff + x)) * 4;
      out[d] = t.rgba[s]; out[d + 1] = t.rgba[s + 1]; out[d + 2] = t.rgba[s + 2]; out[d + 3] = 255;
    }
    xoff += t.W + gap;
  }
  return { rgba: out, W, H };
}

// Stack strips vertically.
export function stack(rows, gap = 8, bg = [20, 24, 32]) {
  const W = Math.max(...rows.map((r) => r.W)), H = rows.reduce((a, r) => a + r.H, 0) + gap * (rows.length - 1);
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { out[i * 4] = bg[0]; out[i * 4 + 1] = bg[1]; out[i * 4 + 2] = bg[2]; out[i * 4 + 3] = 255; }
  let yoff = 0;
  for (const r of rows) {
    for (let y = 0; y < r.H; y++) for (let x = 0; x < r.W; x++) {
      const s = (y * r.W + x) * 4, d = ((yoff + y) * W + x) * 4;
      out[d] = r.rgba[s]; out[d + 1] = r.rgba[s + 1]; out[d + 2] = r.rgba[s + 2]; out[d + 3] = 255;
    }
    yoff += r.H + gap;
  }
  return { rgba: out, W, H };
}

// Coverage buffer → RGBA tile (flat fill colour on dark) for montages.
export function coverageTile({ buf, W, H }, fill = [150, 210, 255]) {
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const on = buf[i] > 0; const d = i * 4;
    rgba[d] = on ? fill[0] : 22; rgba[d + 1] = on ? fill[1] : 26; rgba[d + 2] = on ? fill[2] : 34; rgba[d + 3] = 255;
  }
  return { rgba, W, H };
}

// IoU of two coverage buffers (same dims) — the anti-reskin distance metric.
export function iou(a, b) {
  let inter = 0, uni = 0;
  for (let i = 0; i < a.buf.length; i++) { const x = a.buf[i] > 0, y = b.buf[i] > 0; if (x || y) uni++; if (x && y) inter++; }
  return uni === 0 ? 0 : inter / uni;
}

export function triCount(group) {
  let t = 0;
  group.traverse((o) => { if (o.isMesh && o.geometry && !o.userData.outline) { const g = o.geometry; t += g.index ? g.index.count / 3 : g.attributes.position.count / 3; } });
  return Math.round(t);
}
