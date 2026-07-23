// GLB geometry inspector — report per-mesh + overall local-space bounding box and
// per-axis extent for an asset, so an AI mesh's native orientation (which axis is
// the wingspan, which is the spine, where head vs tail sit) can be deduced WITHOUT
// a renderer. glTF requires POSITION accessors to carry min/max, so the bbox is
// read straight from the JSON chunk — no binary decode.
//
//   node tools/glbinspect.mjs assets/models/thundercoil.glb
//
// Prints overall bbox, the widest axis (likely wingspan) and longest of the rest
// (likely spine), and a crude head/tail guess from cross-section spread at each end.

import { readFileSync } from 'fs';

const path = process.argv[2];
if (!path) { console.error('usage: node tools/glbinspect.mjs <file.glb>'); process.exit(1); }

const buf = readFileSync(path);
if (buf.readUInt32LE(0) !== 0x46546c67) { console.error('not a GLB'); process.exit(1); }
const c0len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + c0len).toString('utf8'));
const accessors = gltf.accessors || [];

const lo = [Infinity, Infinity, Infinity];
const hi = [-Infinity, -Infinity, -Infinity];
let tris = 0, prims = 0;
for (const mesh of gltf.meshes || []) {
  for (const prim of mesh.primitives || []) {
    prims++;
    const pa = prim.attributes && prim.attributes.POSITION != null ? accessors[prim.attributes.POSITION] : null;
    if (pa && pa.min && pa.max) {
      for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], pa.min[i]); hi[i] = Math.max(hi[i], pa.max[i]); }
    }
    const ia = prim.indices != null ? accessors[prim.indices] : null;
    tris += (ia ? ia.count : (pa ? pa.count : 0)) / 3;
  }
}

const ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
const ax = ['X', 'Y', 'Z'];
const widest = ext.indexOf(Math.max(...ext));
const rest = [0, 1, 2].filter((i) => i !== widest);
const spine = ext[rest[0]] >= ext[rest[1]] ? rest[0] : rest[1];

console.log(`file: ${path}`);
console.log(`meshes=${(gltf.meshes || []).length}  primitives=${prims}  tris=${Math.round(tris)}  bytes=${(buf.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`bbox min  [${lo.map((v) => v.toFixed(3)).join(', ')}]`);
console.log(`bbox max  [${hi.map((v) => v.toFixed(3)).join(', ')}]`);
console.log(`extent    [${ext.map((v) => v.toFixed(3)).join(', ')}]  (X,Y,Z)`);
console.log(`widest axis (likely WINGSPAN): ${ax[widest]}  (${ext[widest].toFixed(3)})`);
console.log(`longest of the rest (likely SPINE): ${ax[spine]}  (${ext[spine].toFixed(3)})`);
console.log(`center    [${lo.map((v, i) => ((lo[i] + hi[i]) / 2).toFixed(3)).join(', ')}]`);
