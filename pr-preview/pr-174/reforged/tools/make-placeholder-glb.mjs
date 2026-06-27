// Generate a tiny, dependency-free PLACEHOLDER dragon GLB for the asset-backed
// experiment (the `aether` dragon). Pure Node — hand-encodes a valid glTF 2.0
// binary so the whole asset pipeline (GLTFLoader → in-game animated dragon →
// SW precache → tests/glb.mjs) can be proven end-to-end WITHOUT spending any
// Higgsfield credits. The real AI mesh later overwrites assets/models/aether.glb.
//
//   node tools/make-placeholder-glb.mjs
//
// Hierarchy (flat, NON-skinned — drives via node rotation, the simplest rig):
//   aether_root → body, head, wing_L, wing_R
// dragonGlb.js finds wing_L/wing_R by name and re-parents them under the flap
// scaffold so the existing wingRig flap drives them (Plan A on a node rig).

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(import.meta.url), '..', '..'); // reforged/
const outDir = join(root, 'assets', 'models');
const outFile = join(outDir, 'aether.glb');

// --- geometry builders -----------------------------------------------------
const newGeo = () => ({ pos: [], nrm: [], idx: [] });

function pushBox(geo, cx, cy, cz, sx, sy, sz) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const faces = [
    { n: [0, 0, 1],  v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
    { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] },
    { n: [1, 0, 0],  v: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]] },
    { n: [-1, 0, 0], v: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]] },
    { n: [0, 1, 0],  v: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]] },
    { n: [0, -1, 0], v: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]] },
  ];
  for (const f of faces) {
    const base = geo.pos.length / 3;
    for (const vv of f.v) { geo.pos.push(cx + vv[0], cy + vv[1], cz + vv[2]); geo.nrm.push(...f.n); }
    geo.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}

function pushQuad(geo, pts, n) {
  const base = geo.pos.length / 3;
  for (const p of pts) { geo.pos.push(...p); geo.nrm.push(...n); }
  geo.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

// body: an elongated faceted hull; head: a snout box; wings: flat membranes
// whose ROOT vertex sits at the node origin (the shoulder), so rotating the
// node flaps the wing about the shoulder.
const bodyGeo = newGeo();
pushBox(bodyGeo, 0, 0, 0, 0.6, 0.5, 1.9);
pushBox(bodyGeo, 0, 0.05, 1.0, 0.42, 0.4, 0.7);   // chest taper toward the neck

const headGeo = newGeo();
pushBox(headGeo, 0, 0, 0, 0.45, 0.42, 0.55);
pushBox(headGeo, 0, -0.04, 0.34, 0.26, 0.22, 0.3); // snout

const wingLGeo = newGeo();
pushQuad(wingLGeo, [[0, 0, 0.25], [-1.6, 0.05, 0.55], [-1.45, 0.05, -0.65], [0, 0, -0.4]], [0, 1, 0]);
const wingRGeo = newGeo();
pushQuad(wingRGeo, [[0, 0, 0.25], [1.6, 0.05, 0.55], [1.45, 0.05, -0.65], [0, 0, -0.4]], [0, 1, 0]);

// --- binary packing --------------------------------------------------------
const chunks = [];
let offset = 0;
const bufferViews = [];
const accessors = [];

function pad4() { const m = offset % 4; if (m) { const p = 4 - m; chunks.push(Buffer.alloc(p)); offset += p; } }
function addView(typed, target) {
  pad4();
  const b = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  const idx = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: b.byteLength, target });
  chunks.push(b); offset += b.byteLength;
  return idx;
}

function addGeo(geo) {
  const pos = new Float32Array(geo.pos);
  const nrm = new Float32Array(geo.nrm);
  const idx = new Uint16Array(geo.idx);
  const posView = addView(pos, 34962);
  const nrmView = addView(nrm, 34962);
  const idxView = addView(idx, 34963);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < geo.pos.length; i += 3) {
    for (let k = 0; k < 3; k++) { const v = geo.pos[i + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
  }
  const posAcc = accessors.length; accessors.push({ bufferView: posView, componentType: 5126, count: geo.pos.length / 3, type: 'VEC3', min, max });
  const nrmAcc = accessors.length; accessors.push({ bufferView: nrmView, componentType: 5126, count: geo.nrm.length / 3, type: 'VEC3' });
  const idxAcc = accessors.length; accessors.push({ bufferView: idxView, componentType: 5123, count: geo.idx.length, type: 'SCALAR' });
  return { posAcc, nrmAcc, idxAcc };
}

const bodyA = addGeo(bodyGeo);
const headA = addGeo(headGeo);
const wingLA = addGeo(wingLGeo);
const wingRA = addGeo(wingRGeo);

const mkMesh = (a, name) => ({ name, primitives: [{ attributes: { POSITION: a.posAcc, NORMAL: a.nrmAcc }, indices: a.idxAcc, material: 0 }] });
const meshes = [mkMesh(bodyA, 'body'), mkMesh(headA, 'head'), mkMesh(wingLA, 'wing_L'), mkMesh(wingRA, 'wing_R')];

const nodes = [
  { name: 'aether_root', children: [1, 2, 3, 4] },
  { name: 'body', mesh: 0 },
  { name: 'head', mesh: 1, translation: [0, 0.08, 1.15] },
  { name: 'wing_L', mesh: 2, translation: [-0.26, 0.18, 0.0] },
  { name: 'wing_R', mesh: 3, translation: [0.26, 0.18, 0.0] },
];

const gltf = {
  asset: { version: '2.0', generator: 'dragon-drift placeholder' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes,
  meshes,
  materials: [{
    name: 'aether',
    pbrMetallicRoughness: { baseColorFactor: [0.16, 0.42, 0.46, 1], metallicFactor: 0.2, roughnessFactor: 0.6 },
    emissiveFactor: [0.02, 0.16, 0.18],
    doubleSided: true,
  }],
  accessors,
  bufferViews,
  buffers: [{ byteLength: offset }],
};

// --- assemble the .glb ------------------------------------------------------
const bin = Buffer.concat(chunks);                       // BIN chunk data
let json = Buffer.from(JSON.stringify(gltf), 'utf8');
while (json.length % 4 !== 0) json = Buffer.concat([json, Buffer.from(' ')]);   // pad JSON with spaces
let binPadded = bin;
while (binPadded.length % 4 !== 0) binPadded = Buffer.concat([binPadded, Buffer.alloc(1)]); // pad BIN with \0

const head12 = Buffer.alloc(12);
const total = 12 + 8 + json.length + 8 + binPadded.length;
head12.writeUInt32LE(0x46546c67, 0); // magic 'glTF'
head12.writeUInt32LE(2, 4);          // version
head12.writeUInt32LE(total, 8);      // total length

const jsonHdr = Buffer.alloc(8);
jsonHdr.writeUInt32LE(json.length, 0);
jsonHdr.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

const binHdr = Buffer.alloc(8);
binHdr.writeUInt32LE(binPadded.length, 0);
binHdr.writeUInt32LE(0x004e4942, 4);  // 'BIN\0'

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, Buffer.concat([head12, jsonHdr, json, binHdr, binPadded]));
const tris = (bodyGeo.idx.length + headGeo.idx.length + wingLGeo.idx.length + wingRGeo.idx.length) / 3;
console.log(`wrote ${outFile}  (${total} bytes, ${tris} tris, ${meshes.length} meshes)`);
