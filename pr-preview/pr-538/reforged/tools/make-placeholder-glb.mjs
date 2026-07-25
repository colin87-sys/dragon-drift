// Generate a dependency-free PLACEHOLDER GLB for the asset-backed experiment —
// the THUNDERCOIL AMPITHERE, a legless storm-serpent. Pure Node: hand-encodes a
// valid glTF 2.0 binary so the whole asset pipeline (GLTFLoader → in-game
// animated dragon → SW precache → tests/glb.mjs) is proven end-to-end WITHOUT
// spending Higgsfield credits. The real AI mesh later overwrites the .glb.
//
//   node tools/make-placeholder-glb.mjs
//
// Silhouette (legless, head forward at +Z): a long coiling body tapering to a
// thin forked tail, a lightning crest, and electric accents. WINGLESS by design
// — this stands in for the real HYBRID asset (an AI-generated storm-serpent
// BODY), and dragonGlb.js mounts its own authored membrane wings under the flap
// rig. Hierarchy is FLAT + NON-skinned so dragonGlb.js finds `head` by name and
// re-parents it under the head pivot.
//   root → body, accents(emissive), head

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(import.meta.url), '..', '..'); // reforged/
const outDir = join(root, 'assets', 'models');
const outFile = join(outDir, 'thundercoil.glb');

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
function pushTri(geo, p0, p1, p2, n) {
  const base = geo.pos.length / 3;
  for (const p of [p0, p1, p2]) { geo.pos.push(...p); geo.nrm.push(...n); }
  geo.idx.push(base, base + 1, base + 2);
}

// --- body: a legless coil, thickest at the wing root, tapering to a thin tail ---
const bodyGeo = newGeo();
const accentGeo = newGeo();                 // emissive electric bits (crest + tail fork)
const N = 12;
const zHead = 1.0, zTail = -4.2;
let tailX = 0, tailY = 0, tailZ = zTail;    // remember the tail tip for the fork
for (let i = 0; i < N; i++) {
  const t = i / (N - 1);
  const z = zHead + (zTail - zHead) * t;
  const x = Math.sin(t * Math.PI * 1.3) * 0.34 * t;   // gentle S-coil, stronger aft
  const y = Math.sin(t * Math.PI) * 0.05;
  // radius: ramp up to the chest/wing-root (i≈2), then taper to a thin tail
  const r = i <= 2 ? 0.24 + 0.09 * i : Math.max(0.05, 0.42 * (1 - (i - 2) / (N - 3)));
  const segLen = ((zHead - zTail) / (N - 1)) * 1.2;
  pushBox(bodyGeo, x, y, z, r * 2, r * 1.7, segLen);
  // lightning crest: short backward spikes along the neck (front segments)
  if (i <= 4) {
    pushTri(accentGeo,
      [x - 0.05, y + r + 0.02, z + 0.05], [x + 0.05, y + r + 0.02, z + 0.05], [x, y + r + 0.22, z - 0.18],
      [0, 0.4, -0.9]);
  }
  if (i === N - 1) { tailX = x; tailY = y; tailZ = z; }
}
// forked conductor tail tip — two small emissive prongs
pushTri(accentGeo, [tailX, tailY, tailZ], [tailX - 0.16, tailY + 0.12, tailZ - 0.34], [tailX - 0.04, tailY - 0.02, tailZ - 0.30], [-0.3, 0.3, -0.9]);
pushTri(accentGeo, [tailX, tailY, tailZ], [tailX + 0.16, tailY + 0.12, tailZ - 0.34], [tailX + 0.04, tailY - 0.02, tailZ - 0.30], [0.3, 0.3, -0.9]);

// --- head: broad, boxy, flat-topped wedge at the front ---
const headGeo = newGeo();
pushBox(headGeo, 0, 0.02, 0, 0.5, 0.34, 0.62);
pushBox(headGeo, 0, -0.05, 0.34, 0.3, 0.2, 0.32);   // snout

// (No wing meshes — wings are authored under the flap rig by dragonGlb.js.)

// --- binary packing --------------------------------------------------------
const chunks = [];
let offset = 0;
const bufferViews = [];
const accessors = [];
function pad4() { const m = offset % 4; if (m) { const p = 4 - m; chunks.push(Buffer.alloc(p)); offset += p; } }
function addView(typed, target) {
  pad4();
  const b = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: b.byteLength, target });
  chunks.push(b); offset += b.byteLength;
  return bufferViews.length - 1;
}
function addGeo(geo) {
  const pos = new Float32Array(geo.pos), nrm = new Float32Array(geo.nrm), idx = new Uint16Array(geo.idx);
  const posView = addView(pos, 34962), nrmView = addView(nrm, 34962), idxView = addView(idx, 34963);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < geo.pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = geo.pos[i + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
  const posAcc = accessors.length; accessors.push({ bufferView: posView, componentType: 5126, count: geo.pos.length / 3, type: 'VEC3', min, max });
  const nrmAcc = accessors.length; accessors.push({ bufferView: nrmView, componentType: 5126, count: geo.nrm.length / 3, type: 'VEC3' });
  const idxAcc = accessors.length; accessors.push({ bufferView: idxView, componentType: 5123, count: geo.idx.length, type: 'SCALAR' });
  return { posAcc, nrmAcc, idxAcc };
}

const bodyA = addGeo(bodyGeo), accentA = addGeo(accentGeo), headA = addGeo(headGeo);
const mkMesh = (a, name, mat) => ({ name, primitives: [{ attributes: { POSITION: a.posAcc, NORMAL: a.nrmAcc }, indices: a.idxAcc, material: mat }] });
const meshes = [
  mkMesh(bodyA, 'body', 0), mkMesh(accentA, 'accents', 1), mkMesh(headA, 'head', 0),
];
const nodes = [
  { name: 'thundercoil_root', children: [1, 2, 3] },
  { name: 'body', mesh: 0 },
  { name: 'accents', mesh: 1 },
  { name: 'head', mesh: 2, translation: [0, 0.06, 1.35] },
];

const gltf = {
  asset: { version: '2.0', generator: 'dragon-drift placeholder (thundercoil)' },
  scene: 0, scenes: [{ nodes: [0] }], nodes, meshes,
  materials: [
    { name: 'stormhide', pbrMetallicRoughness: { baseColorFactor: [0.16, 0.18, 0.24, 1], metallicFactor: 0.25, roughnessFactor: 0.6 }, doubleSided: true },
    { name: 'arc', pbrMetallicRoughness: { baseColorFactor: [0.55, 0.78, 1.0, 1], metallicFactor: 0.1, roughnessFactor: 0.35 }, emissiveFactor: [0.4, 0.7, 1.0], doubleSided: true },
  ],
  accessors, bufferViews, buffers: [{ byteLength: offset }],
};

// --- assemble the .glb ------------------------------------------------------
const bin = Buffer.concat(chunks);
let json = Buffer.from(JSON.stringify(gltf), 'utf8');
while (json.length % 4 !== 0) json = Buffer.concat([json, Buffer.from(' ')]);
let binPadded = bin;
while (binPadded.length % 4 !== 0) binPadded = Buffer.concat([binPadded, Buffer.alloc(1)]);

const head12 = Buffer.alloc(12);
const total = 12 + 8 + json.length + 8 + binPadded.length;
head12.writeUInt32LE(0x46546c67, 0); head12.writeUInt32LE(2, 4); head12.writeUInt32LE(total, 8);
const jsonHdr = Buffer.alloc(8); jsonHdr.writeUInt32LE(json.length, 0); jsonHdr.writeUInt32LE(0x4e4f534a, 4);
const binHdr = Buffer.alloc(8); binHdr.writeUInt32LE(binPadded.length, 0); binHdr.writeUInt32LE(0x004e4942, 4);

mkdirSync(outDir, { recursive: true });
if (existsSync(join(outDir, 'aether.glb'))) rmSync(join(outDir, 'aether.glb'));   // retire the old name
writeFileSync(outFile, Buffer.concat([head12, jsonHdr, json, binHdr, binPadded]));
const tris = [bodyGeo, accentGeo, headGeo].reduce((s, g) => s + g.idx.length, 0) / 3;
console.log(`wrote ${outFile}  (${total} bytes, ${tris} tris, ${meshes.length} meshes)`);
