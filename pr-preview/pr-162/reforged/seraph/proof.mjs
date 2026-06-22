// Standalone proof renderer for the Radiant Paladin — fresh, no dependency on the
// repo's chassis renderer. CPU rasteriser with z-buffer, 2-tone soft shading,
// EMISSIVE BLOOM (so halo / seams / comet glow), a silhouette outline, and a
// montage writer. Run: node seraph/proof.mjs [out.png]
import { register } from 'node:module';
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);     // map bare 'three' → repo lib
globalThis.window = globalThis;

const THREE = await import('three');
const { buildRadiantPaladin } = await import('./radiantPaladin.js');

// ── camera, auto-fit to the model, framed for each view ──────────────────────
function setupCamera(group, view, W, H) {
  const cam = new THREE.PerspectiveCamera(46, W / H, 0.1, 400);
  const box = new THREE.Box3();
  group.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
  const ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const vfov = cam.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * (W / H));
  let dir, pw, ph;
  if (view === 'threeq') { dir = new THREE.Vector3(0.82, 0.40, 1); pw = Math.max(sz.x, sz.z); ph = sz.y; }
  else if (view === 'side') { dir = new THREE.Vector3(1, 0.10, 0.04); pw = sz.z; ph = sz.y; }
  else { dir = new THREE.Vector3(0, 0.22, 1); pw = sz.x; ph = sz.y; }        // rear chase, slightly above
  const fit = Math.max(ph * 0.5 / Math.tan(vfov / 2), pw * 0.5 / Math.tan(hfov / 2));
  cam.position.copy(ctr).addScaledVector(dir.normalize(), fit * 1.28);
  cam.lookAt(ctr); cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert(); cam.updateProjectionMatrix();
  return cam;
}
const proj = (cam, W, H, v) => {
  const e = v.clone().applyMatrix4(cam.matrixWorldInverse), n = v.clone().project(cam);
  return { ez: e.z, x: (n.x * 0.5 + 0.5) * W, y: (1 - (n.y * 0.5 + 0.5)) * H };
};

// ── render one view → {rgba,W,H} ─────────────────────────────────────────────
function render(group, view, W = 460, H = 460) {
  const cam = setupCamera(group, view, W, H);
  const col = new Float32Array(W * H * 3);                    // linear-ish colour
  const emi = new Float32Array(W * H * 3);                    // emissive for bloom
  const depth = new Float32Array(W * H).fill(-Infinity);
  const id = new Int32Array(W * H).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {   // dawn-sky gradient
    const t = y / H, i = (y * W + x) * 3;
    col[i] = 16 * (1.4 - t * 0.7); col[i + 1] = 20 * (1.3 - t * 0.6); col[i + 2] = 32 * (1.5 - t * 0.7);
  }
  const light = new THREE.Vector3(-0.35, 0.8, 0.55).normalize();
  const fa = new THREE.Vector3(), fb = new THREE.Vector3(), fc = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();
  let mid = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const m = o.material, c = m.color, em = m.emissive || { r: 0, g: 0, b: 0 }, ei = m.emissiveIntensity || 0;
    const myId = ++mid;
    const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
    const tri = (i0, i1, i2) => {
      fa.fromBufferAttribute(pos, i0).applyMatrix4(mw); fb.fromBufferAttribute(pos, i1).applyMatrix4(mw); fc.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      e1.subVectors(fb, fa); e2.subVectors(fc, fa); nrm.crossVectors(e1, e2).normalize();
      const ndl = Math.abs(nrm.dot(light));
      const shade = 0.45 + 0.55 * (ndl > 0.6 ? 1 : ndl > 0.28 ? 0.8 : 0.62);  // soft 2-tone
      const A = proj(cam, W, H, fa), B = proj(cam, W, H, fb), C = proj(cam, W, H, fc);
      if (A.ez > -0.05 || B.ez > -0.05 || C.ez > -0.05) return;
      const loX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x))), hiX = Math.min(W - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
      const loY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y))), hiY = Math.min(H - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
      const d = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
      if (Math.abs(d) < 1e-9) return;
      const r = (c.r * shade + em.r * ei) * 255, g = (c.g * shade + em.g * ei) * 255, b = (c.b * shade + em.b * ei) * 255;
      const er = em.r * ei * 255, eg = em.g * ei * 255, eb = em.b * ei * 255;
      for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((B.y - C.y) * (px - C.x) + (C.x - B.x) * (py - C.y)) / d;
        const w1 = ((C.y - A.y) * (px - C.x) + (A.x - C.x) * (py - C.y)) / d;
        const w2 = 1 - w0 - w1; if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * A.ez + w1 * B.ez + w2 * C.ez, k = y * W + x;
        if (z <= depth[k]) continue;
        depth[k] = z; id[k] = myId;
        const i = k * 3; col[i] = r; col[i + 1] = g; col[i + 2] = b;
        emi[i] = er; emi[i + 1] = eg; emi[i + 2] = eb;
      }
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
  });
  // bloom: blur the emissive buffer and add it back additively
  const blur = (src) => {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), R = 3;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let ch = 0; ch < 3; ch++) {
      let s = 0, n = 0; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx < 0 || xx >= W) continue; s += src[(y * W + xx) * 3 + ch]; n++; }
      tmp[(y * W + x) * 3 + ch] = s / n;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let ch = 0; ch < 3; ch++) {
      let s = 0, n = 0; for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; s += tmp[(yy * W + x) * 3 + ch]; n++; }
      out[(y * W + x) * 3 + ch] = s / n;
    }
    return out;
  };
  const b1 = blur(emi), b2 = blur(b1);
  // outline + composite
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, i = k * 3, o = k * 4;
    let r = col[i] + (b1[i] + b2[i]) * 0.7, g = col[i + 1] + (b1[i + 1] + b2[i + 1]) * 0.7, b = col[i + 2] + (b1[i + 2] + b2[i + 2]) * 0.7;
    if (id[k] >= 0 && x > 0 && x < W - 1 && y > 0 && y < H - 1) {            // silhouette outline
      if (id[k - 1] < 0 || id[k + 1] < 0 || id[k - W] < 0 || id[k + W] < 0) { r = 10; g = 12; b = 18; }
    }
    rgba[o] = Math.min(255, r); rgba[o + 1] = Math.min(255, g); rgba[o + 2] = Math.min(255, b); rgba[o + 3] = 255;
  }
  return { rgba, W, H };
}

// ── montage + PNG ────────────────────────────────────────────────────────────
function strip(tiles, gap = 10, bg = [18, 22, 30]) {
  const H = Math.max(...tiles.map((t) => t.H)), W = tiles.reduce((a, t) => a + t.W, 0) + gap * (tiles.length - 1);
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { out[i * 4] = bg[0]; out[i * 4 + 1] = bg[1]; out[i * 4 + 2] = bg[2]; out[i * 4 + 3] = 255; }
  let xo = 0;
  for (const t of tiles) { for (let y = 0; y < t.H; y++) for (let x = 0; x < t.W; x++) { const s = (y * t.W + x) * 4, d = (y * W + xo + x) * 4; out[d] = t.rgba[s]; out[d + 1] = t.rgba[s + 1]; out[d + 2] = t.rgba[s + 2]; out[d + 3] = 255; } xo += t.W + gap; }
  return { rgba: out, W, H };
}
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(t, 'ascii'), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td), 0); return Buffer.concat([l, td, c]); }
function png(W, H, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function triCount(group) { let t = 0; group.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; t += g.index ? g.index.count / 3 : g.attributes.position.count / 3; } }); return Math.round(t); }

// ── go ───────────────────────────────────────────────────────────────────────
const out = process.argv[2] || '/tmp/radiant-paladin.png';
const { group } = buildRadiantPaladin();
const tris = triCount(group);
const montage = strip([render(group, 'rear'), render(group, 'threeq'), render(group, 'side')]);
writeFileSync(out, png(montage.W, montage.H, montage.rgba));
console.log(`Radiant Paladin — ${tris} tris`);
console.log(`  rear chase · 3/4 shop · side profile`);
console.log(`wrote ${out}  (${montage.W}x${montage.H})`);
