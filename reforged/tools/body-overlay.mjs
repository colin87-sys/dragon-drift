// body-overlay — the RELIABLE side-silhouette check for the driftBody torso.
//
// Earlier overlays (bbox auto-fit / perspective) LIED: when a part's extent changed
// the whole fit rescaled, so adding the tail-fins or fattening the body could DROP
// the apparent score even as the shape improved. This tool removes those degrees of
// freedom: it renders the body in ORTHOGRAPHIC side projection, calibrates the LENGTH
// axis by two fixed landmarks (snout→master x=1362, fin-tip→x=44, ONE uniform scale),
// then fits ONLY a vertical offset by best-fit — so we measure SHAPE, not placement.
//
// Reports COVERAGE (fraction of body pixels that land inside the master silhouette) —
// the fair "is my body inside/on the dragon" metric — plus IoU (low by construction,
// since the master includes the whole wing the body can't cover). Writes the overlay
// PNG so the human can superimpose-and-see (the only judge that matters).
//   node tools/body-overlay.mjs            (run from reforged/)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decodePNG, pngRGBA, THREE, DRAGONS, ascendedDef } from './silhouetteCore.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { buildDragonModel } = await import(join(ROOT, 'js', 'dragonModel.js'));
const OUT = process.env.BODY_OVERLAY_OUT || '/tmp/body-overlay.png';

const ref = decodePNG(readFileSync(join(ROOT, 'refs', 'master-silhouette.png')));
const { w, h } = ref;
const isD = (x, y) => { const d = (y * w + x) * 4; return (0.3 * ref.rgba[d] + 0.59 * ref.rgba[d + 1] + 0.11 * ref.rgba[d + 2]) < 128; };
const mask = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) mask[i] = isD(i % w, (i / w) | 0) ? 1 : 0;

// build onyx, collect BODY triangles (exclude the wing subtree) in world space
const def = ascendedDef(DRAGONS.onyx, 3, 0); const built = buildDragonModel(def, {});
const skip = new Set(); for (const k of ['wingPivotL', 'wingPivotR']) if (built.parts && built.parts[k]) built.parts[k].traverse(o => skip.add(o));
built.group.updateMatrixWorld(true);
const tris = []; let minZ = 1e9, maxZ = -1e9;
const _v = new THREE.Vector3();
built.group.traverse(o => {
  if (!o.isMesh || !o.geometry || skip.has(o)) return;
  const pos = o.geometry.attributes.position, idx = o.geometry.index, mw = o.matrixWorld;
  const P = (i) => { _v.fromBufferAttribute(pos, i).applyMatrix4(mw); return [_v.z, _v.y, _v.x]; };
  const push = (a, b, c) => { const A = P(a), B = P(b), C = P(c); tris.push([A, B, C]); for (const V of [A, B, C]) { if (V[0] < minZ) minZ = V[0]; if (V[0] > maxZ) maxZ = V[0]; } };
  if (idx) for (let i = 0; i < idx.count; i += 3) push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)); else for (let i = 0; i < pos.count; i += 3) push(i, i + 1, i + 2);
});

const A_SNOUT = [1362, 872], FINX = 44;
const s = (A_SNOUT[0] - FINX) / (maxZ - minZ);
const X = (z) => A_SNOUT[0] - (z - minZ) * s;     // z=minZ(snout)->1362 ; z=maxZ(fin)->44
const Y0 = (wy) => A_SNOUT[1] - wy * s;            // provisional vertical (dy fit below)
const tmp = new Uint8Array(w * h), myPx = [];
for (const [a, b, c] of tris) {
  const ax = X(a[0]), ay = Y0(a[1]), bx = X(b[0]), by = Y0(b[1]), cx = X(c[0]), cy = Y0(c[1]);
  const loX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), hiX = Math.min(w - 1, Math.ceil(Math.max(ax, bx, cx)));
  const loY = Math.max(0, Math.floor(Math.min(ay, by, cy))), hiY = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy)));
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(d) < 1e-9) continue;
  for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) { const px = x + .5, py = y + .5; const w0 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d, w1 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d; if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) tmp[y * w + x] = 1; }
}
for (let i = 0; i < w * h; i++) if (tmp[i]) myPx.push([i % w, (i / w) | 0]);
// fit the vertical offset for best coverage (removes single-vertex anchor noise)
let bestDy = 0, bestCov = -1;
for (let dy = -400; dy <= 400; dy += 2) { let inter = 0; for (const [x, y] of myPx) { const yy = y + dy; if (yy >= 0 && yy < h && mask[yy * w + x]) inter++; } const cov = inter / myPx.length; if (cov > bestCov) { bestCov = cov; bestDy = dy; } }
const mine = new Uint8Array(w * h); for (const [x, y] of myPx) { const yy = y + bestDy; if (yy >= 0 && yy < h) mine[yy * w + x] = 1; }
let inter = 0, uni = 0; for (let i = 0; i < w * h; i++) { if (mine[i] || mask[i]) uni++; if (mine[i] && mask[i]) inter++; }
const out = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  const d = i * 4; out[d] = (ref.rgba[d] * 0.35 + 40) | 0; out[d + 1] = (ref.rgba[d + 1] * 0.35 + 45) | 0; out[d + 2] = (ref.rgba[d + 2] * 0.35 + 40) | 0; out[d + 3] = 255;
  if (mask[i]) out[d] = Math.min(255, out[d] + 28);
  if (mine[i]) { const x = i % w, y = (i / w) | 0; const e = !mine[i - 1] || !mine[i + 1] || !mine[(y - 1) * w + x] || !mine[(y + 1) * w + x]; if (e) { out[d] = 40; out[d + 1] = 255; out[d + 2] = 255; } else { out[d] = (out[d] * 0.5) | 0; out[d + 1] = (out[d + 1] * 0.5 + 110) | 0; out[d + 2] = (out[d + 2] * 0.5 + 110) | 0; } }
}
writeFileSync(OUT, pngRGBA(w, h, out));
console.log('BODY overlay  coverage(body inside master):', (bestCov * 100).toFixed(0) + '%   IoU:', (inter / uni * 100).toFixed(0) + '%   bestDy', bestDy, '  z[' + minZ.toFixed(2) + ',' + maxZ.toFixed(2) + ']  →', OUT);
