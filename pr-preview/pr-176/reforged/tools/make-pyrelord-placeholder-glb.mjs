// Generate a dependency-free PLACEHOLDER GLB for the PYRELORD SOVEREIGN — a regal
// four-legged western fire dragon. Pure Node: hand-encodes a valid glTF 2.0 binary
// so the whole asset pipeline (GLTFLoader → in-game animated dragon → SW precache →
// tests/glb.mjs / glbcontract.mjs) is proven end-to-end WITHOUT spending Higgsfield
// credits. The real AI mesh (Higgsfield multi_image_to_3d from the three concept
// views) later OVERWRITES this .glb — placement is then retuned on the PR preview.
//
//   node tools/make-pyrelord-placeholder-glb.mjs
//
// NATIVE AXES match the asset-backed contract dragonGlb.js expects for a fused
// winged mesh (same as thundercoil): spine along +Y (head +Y → tail −Y), wingspan
// ±X, DORSAL −Z / BELLY +Z. The roster entry's glb.rotX = −π/2 lays it level and
// rotY = π rolls the dorsal up; the shader wing-flap then swings the wing verts
// (|localX| > hingeX AND localY > minS) about a fore-aft hinge — so the wings beat
// and the four legs + tail (low Y, or narrow in X) stay put.
//   root → body, belly, accents(emissive), wings, head
//
// FLAT + NON-skinned so dragonGlb.js finds `head` by name and re-parents it.

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(import.meta.url), '..', '..'); // reforged/
const outDir = join(root, 'assets', 'models');
const outFile = join(outDir, 'pyrelord.glb');

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
function pushQuad(geo, p0, p1, p2, p3, n) {
  const base = geo.pos.length / 3;
  for (const p of [p0, p1, p2, p3]) { geo.pos.push(...p); geo.nrm.push(...n); }
  geo.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
function pushTri(geo, p0, p1, p2, n) {
  const base = geo.pos.length / 3;
  for (const p of [p0, p1, p2]) { geo.pos.push(...p); geo.nrm.push(...n); }
  geo.idx.push(base, base + 1, base + 2);
}

const bodyGeo = newGeo();    // charcoal/obsidian torso, neck, legs, tail
const bellyGeo = newGeo();   // burnt-bronze underbelly plates
const accentGeo = newGeo();  // emissive molten dorsal spines + tail fins + horns
const wingGeo = newGeo();    // dark membrane wings (flapped by the shader deform)

// --- torso + neck: muscular column along +Y, broad chest tapering to a slim waist ---
const NB = 9;
const yChest = 0.70, yHip = -0.55;
for (let i = 0; i < NB; i++) {
  const t = i / (NB - 1);
  const y = yChest + (yHip - yChest) * t;
  // broad chest/shoulders (t small) → slimmer waist (t large)
  const w = 0.62 - 0.26 * t;          // X width
  const d = 0.58 - 0.20 * t;          // Z depth
  const segLen = ((yChest - yHip) / (NB - 1)) * 1.15;
  pushBox(bodyGeo, 0, y, 0, w, segLen, d);
  // burnt-bronze belly plate on the +Z (belly) face
  pushBox(bellyGeo, 0, y, d * 0.5 + 0.01, w * 0.6, segLen * 0.95, 0.06);
  // molten dorsal spine on the −Z (back) face: big at the shoulders, tapering aft
  const spineH = 0.30 * (1 - t * 0.6);
  pushTri(accentGeo,
    [-0.05, y + segLen * 0.3, -d * 0.5], [0.05, y + segLen * 0.3, -d * 0.5],
    [0, y, -d * 0.5 - spineH], [0, 0.2, -0.98]);
}

// --- neck + crowned head (head is its own named node, placed by dragonGlb) ---
pushBox(bodyGeo, 0, 0.95, 0.10, 0.34, 0.46, 0.34);   // S-neck, leaning forward (+Z)
pushBox(bodyGeo, 0, 1.18, 0.18, 0.28, 0.22, 0.30);   // nape

const headGeo = newGeo();
pushBox(headGeo, 0, 0, 0, 0.40, 0.34, 0.40);          // angular skull
pushBox(headGeo, 0, -0.06, 0.30, 0.26, 0.20, 0.30);   // forward muzzle
// swept-back crown horns: point back (−Y) and up over the back (−Z)
pushTri(headGeo, [-0.14, 0.14, -0.10], [-0.06, 0.16, -0.10], [-0.20, 0.42, -0.40], [-0.4, 0.5, -0.7]);
pushTri(headGeo, [0.14, 0.14, -0.10], [0.06, 0.16, -0.10], [0.20, 0.42, -0.40], [0.4, 0.5, -0.7]);
// two cheek horn ridges
pushTri(headGeo, [-0.20, -0.02, 0.04], [-0.18, 0.06, 0.04], [-0.30, 0.10, -0.16], [-0.7, 0.2, -0.5]);
pushTri(headGeo, [0.20, -0.02, 0.04], [0.18, 0.06, 0.04], [0.30, 0.10, -0.16], [0.7, 0.2, -0.5]);

// --- tail: thick at the base, tapering aft (−Y), with molten ember fins at the tip ---
const NT = 7;
const yTailTop = -0.55, yTailTip = -1.85;
let tipY = yTailTip, tipZ = 0;
for (let i = 0; i < NT; i++) {
  const t = i / (NT - 1);
  const y = yTailTop + (yTailTip - yTailTop) * t;
  const z = 0.10 * t;                 // gentle aft droop toward the belly side
  const r = Math.max(0.05, 0.30 * (1 - t));
  const segLen = ((yTailTop - yTailTip) / (NT - 1)) * 1.15;
  pushBox(bodyGeo, 0, y, z, r * 1.6, segLen, r * 1.4);
  // small molten dorsal fins near the tip only
  if (t > 0.55) {
    pushTri(accentGeo, [-0.03, y, z - r * 0.7], [0.03, y, z - r * 0.7], [0, y - 0.04, z - r * 0.7 - 0.18], [0, 0.1, -0.99]);
  }
  if (i === NT - 1) { tipY = y; tipZ = z; }
}
// ember tail-tip fan (emissive)
pushTri(accentGeo, [0, tipY, tipZ], [-0.16, tipY - 0.16, tipZ - 0.06], [-0.04, tipY - 0.22, tipZ], [-0.3, -0.4, -0.85]);
pushTri(accentGeo, [0, tipY, tipZ], [0.16, tipY - 0.16, tipZ - 0.06], [0.04, tipY - 0.22, tipZ], [0.3, -0.4, -0.85]);

// --- four legs: hang toward the belly side (+Z, → world-down after the transform) ---
// kept NARROW in X (|x| < wing hingeX) so the wing-flap mask never grabs them.
function leg(x, y) {
  pushBox(bodyGeo, x, y - 0.18, 0.30, 0.16, 0.40, 0.18);   // upper limb
  pushBox(bodyGeo, x, y - 0.42, 0.34, 0.13, 0.22, 0.16);   // lower limb
  pushBox(bodyGeo, x, y - 0.52, 0.42, 0.16, 0.10, 0.22);   // clawed foot
}
leg(-0.26, 0.40); leg(0.26, 0.40);     // forelegs (under the shoulders)
leg(-0.24, -0.40); leg(0.24, -0.40);   // hindlegs (under the hips)

// --- wings: broad bat membranes that form a rear V; wide in X, in the shoulder band ---
// Each is a fanned two-panel membrane from the shoulder root out to a scalloped tip.
// All verts have localY > minS so the flap mask selects them (tail/legs excluded).
function wing(s) {                       // s = ±1 (right/left)
  const root = [s * 0.24, 0.46, -0.06];  // shoulder root (high on the back)
  const wrist = [s * 0.95, 0.30, -0.30]; // mid (leading-edge elbow), swept up+back
  const tip = [s * 1.65, 0.20, -0.40];   // outer tip
  const aft = [s * 1.05, -0.05, 0.10];   // trailing inner corner (toward the body/belly)
  const n = [0, 0.2, -0.95];
  pushQuad(wingGeo, root, wrist, tip, [s * 1.25, 0.05, -0.10], n);   // leading panel
  pushQuad(wingGeo, root, [s * 1.25, 0.05, -0.10], aft, [s * 0.5, 0.10, 0.06], n); // trailing panel
  // a few molten finger-strut accents along the membrane
  pushTri(accentGeo, root, wrist, [s * 0.9, 0.20, -0.18], [0, 0.3, -0.9]);
}
wing(1); wing(-1);

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

const bodyA = addGeo(bodyGeo), bellyA = addGeo(bellyGeo), accentA = addGeo(accentGeo), wingA = addGeo(wingGeo), headA = addGeo(headGeo);
const mkMesh = (a, name, mat) => ({ name, primitives: [{ attributes: { POSITION: a.posAcc, NORMAL: a.nrmAcc }, indices: a.idxAcc, material: mat }] });
const meshes = [
  mkMesh(bodyA, 'body', 0), mkMesh(bellyA, 'belly', 1), mkMesh(accentA, 'accents', 2),
  mkMesh(wingA, 'wings', 3), mkMesh(headA, 'head', 0),
];
const nodes = [
  { name: 'pyrelord_root', children: [1, 2, 3, 4, 5] },
  { name: 'body', mesh: 0 },
  { name: 'belly', mesh: 1 },
  { name: 'accents', mesh: 2 },
  { name: 'wings', mesh: 3 },
  { name: 'head', mesh: 4, translation: [0, 1.32, 0.22] },
];

const gltf = {
  asset: { version: '2.0', generator: 'dragon-drift placeholder (pyrelord)' },
  scene: 0, scenes: [{ nodes: [0] }], nodes, meshes,
  materials: [
    { name: 'obsidian', pbrMetallicRoughness: { baseColorFactor: [0.14, 0.12, 0.11, 1], metallicFactor: 0.25, roughnessFactor: 0.62 }, doubleSided: true },
    { name: 'bronze', pbrMetallicRoughness: { baseColorFactor: [0.54, 0.35, 0.17, 1], metallicFactor: 0.4, roughnessFactor: 0.5 } },
    { name: 'molten', pbrMetallicRoughness: { baseColorFactor: [1.0, 0.42, 0.1, 1], metallicFactor: 0.1, roughnessFactor: 0.35 }, emissiveFactor: [1.0, 0.42, 0.08], doubleSided: true },
    { name: 'membrane', pbrMetallicRoughness: { baseColorFactor: [0.22, 0.16, 0.13, 1], metallicFactor: 0.1, roughnessFactor: 0.7 }, doubleSided: true },
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
writeFileSync(outFile, Buffer.concat([head12, jsonHdr, json, binHdr, binPadded]));
const tris = [bodyGeo, bellyGeo, accentGeo, wingGeo, headGeo].reduce((s, g) => s + g.idx.length, 0) / 3;
console.log(`wrote ${outFile}  (${total} bytes, ${tris} tris, ${meshes.length} meshes)`);
