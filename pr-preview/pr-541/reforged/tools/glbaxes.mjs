// GLB axis decoder — decode the POSITION buffer and, for each candidate spine axis,
// slice the mesh into bins along it and report each bin's cross-section: vertex count,
// spread on the other two axes, and whether it SPLITS into two clusters (a fork). This
// identifies head (solid wedge, one dense cluster) vs tail (thin / forked = two clusters)
// vs the wingspan axis (very wide), so the native orientation is read from DATA, not a guess.
//
//   node tools/glbaxes.mjs assets/models/thundercoil.glb [axis=y]
import { readFileSync } from 'fs';

const path = process.argv[2] || 'assets/models/thundercoil.glb';
const buf = readFileSync(path);
const c0len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + c0len).toString('utf8'));
// binary chunk starts after JSON chunk (8-byte aligned)
let off = 20 + c0len;
const binHeaderLen = buf.readUInt32LE(off); const binType = buf.readUInt32LE(off + 4);
const binStart = off + 8;
const bin = buf.slice(binStart, binStart + binHeaderLen);

const accessors = gltf.accessors, views = gltf.bufferViews;
function readPositions() {
  const out = [];
  for (const mesh of gltf.meshes) for (const prim of mesh.primitives) {
    const a = accessors[prim.attributes.POSITION];
    const v = views[a.bufferView];
    const base = (v.byteOffset || 0) + (a.byteOffset || 0);
    const stride = v.byteStride || 12;
    for (let i = 0; i < a.count; i++) {
      const o = base + i * stride;
      out.push([bin.readFloatLE(o), bin.readFloatLE(o + 4), bin.readFloatLE(o + 8)]);
    }
  }
  return out;
}
const P = readPositions();
const AX = ['X', 'Y', 'Z'];
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (const p of P) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
console.log(`verts=${P.length}  bbox X[${lo[0].toFixed(2)},${hi[0].toFixed(2)}] Y[${lo[1].toFixed(2)},${hi[1].toFixed(2)}] Z[${lo[2].toFixed(2)},${hi[2].toFixed(2)}]`);

const spineAxis = { x: 0, y: 1, z: 2 }[(process.argv[3] || 'y').toLowerCase()];
const o1 = [0, 1, 2].filter((i) => i !== spineAxis)[0];
const o2 = [0, 1, 2].filter((i) => i !== spineAxis)[1];
const NB = 12;
const min = lo[spineAxis], max = hi[spineAxis], span = max - min;
console.log(`\nSlicing along ${AX[spineAxis]} (low→high), ${NB} bins. Cross-section on ${AX[o1]}/${AX[o2]}:`);
console.log(`bin  ${AX[spineAxis]}-range        n     ${AX[o1]}-spread ${AX[o2]}-spread  forked?`);
for (let b = 0; b < NB; b++) {
  const a0 = min + (b / NB) * span, a1 = min + ((b + 1) / NB) * span;
  const pts = P.filter((p) => p[spineAxis] >= a0 && p[spineAxis] < a1);
  if (!pts.length) { console.log(`${String(b).padStart(2)}  [${a0.toFixed(2)},${a1.toFixed(2)}]  empty`); continue; }
  let l1 = Infinity, h1 = -Infinity, l2 = Infinity, h2 = -Infinity;
  for (const p of pts) { l1 = Math.min(l1, p[o1]); h1 = Math.max(h1, p[o1]); l2 = Math.min(l2, p[o2]); h2 = Math.max(h2, p[o2]); }
  // fork detection on o1: histogram, look for a populated-empty-populated pattern.
  const H = 20, hist = new Array(H).fill(0);
  for (const p of pts) { const k = Math.min(H - 1, Math.max(0, Math.floor(((p[o1] - l1) / Math.max(1e-6, h1 - l1)) * H))); hist[k]++; }
  const thresh = pts.length / H * 0.25;
  let runs = 0, inRun = false;
  for (const c of hist) { if (c > thresh && !inRun) { runs++; inRun = true; } else if (c <= thresh) inRun = false; }
  console.log(`${String(b).padStart(2)}  [${a0.toFixed(2)},${a1.toFixed(2)}]  ${String(pts.length).padStart(5)}   ${(h1 - l1).toFixed(2).padStart(6)}   ${(h2 - l2).toFixed(2).padStart(6)}    ${runs >= 2 ? 'FORK(' + runs + ')' : ''}`);
}
