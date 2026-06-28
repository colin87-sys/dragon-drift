// One-off orientation diagnostic: apply a candidate {scale,rotX,rotY,rotZ} to a GLB
// (exact Three.js Euler 'XYZ' matrix) and report where the mesh's NATIVE landmark
// directions land in WORLD space, plus the world bbox. Compares against the
// procedural roster's anchor: head -Z (forward), tail +Z, dorsal +Y, feet -Y.
import { readFileSync } from 'fs';

const path = process.argv[2] || 'assets/models/pyrelord.glb';
const rx = parseFloat(process.argv[3] ?? '0');
const ry = parseFloat(process.argv[4] ?? '0');
const rz = parseFloat(process.argv[5] ?? '0');
const scale = parseFloat(process.argv[6] ?? '1');

const buf = readFileSync(path);
const c0len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + c0len).toString('utf8'));
let off = 20 + c0len;
const binLen = buf.readUInt32LE(off);
const binStart = off + 8;
const bin = buf.slice(binStart, binStart + binLen);
const accessors = gltf.accessors, views = gltf.bufferViews;
const P = [];
for (const mesh of gltf.meshes) for (const prim of mesh.primitives) {
  const a = accessors[prim.attributes.POSITION];
  const v = views[a.bufferView];
  const base = (v.byteOffset || 0) + (a.byteOffset || 0);
  const stride = v.byteStride || 12;
  for (let i = 0; i < a.count; i++) {
    const o = base + i * stride;
    P.push([bin.readFloatLE(o), bin.readFloatLE(o + 4), bin.readFloatLE(o + 8)]);
  }
}

// Three.js Matrix4.makeRotationFromEuler, order 'XYZ' (column-major te -> row form here)
function eulerXYZ(x, y, z) {
  const a = Math.cos(x), b = Math.sin(x);
  const c = Math.cos(y), d = Math.sin(y);
  const e = Math.cos(z), f = Math.sin(z);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  // returns m[row][col]
  return [
    [c * e,           -c * f,          d    ],
    [af + be * d,      ae - bf * d,   -b * c ],
    [bf - ae * d,      be + af * d,    a * c ],
  ];
}
const M = eulerXYZ(rx, ry, rz);
const ap = (v) => [
  scale * (M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2]),
  scale * (M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2]),
  scale * (M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]),
];
const f3 = (a) => '[' + a.map((n) => n.toFixed(2).padStart(6)).join(', ') + ']';

console.log(`transform: scale=${scale} rotX=${rx.toFixed(4)} rotY=${ry.toFixed(4)} rotZ=${rz.toFixed(4)}`);
console.log('\nNATIVE landmark dir -> WORLD dir (unit):');
for (const [name, vec] of [
  ['+Z snout/front', [0, 0, 1]], ['-Z back/wings/tail', [0, 0, -1]],
  ['+Y crown/dorsal', [0, 1, 0]], ['-Y feet', [0, -1, 0]],
  ['+X right wing', [1, 0, 0]],
]) {
  const w = ap(vec).map((n) => n / scale);
  console.log(`  ${name.padEnd(20)} -> ${f3(w)}`);
}

// World bbox + landmark vert world positions
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
let snout = null, backTail = null, feet = null, crown = null, wTipR = null;
for (const v of P) {
  const w = ap(v);
  for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], w[i]); hi[i] = Math.max(hi[i], w[i]); }
  if (!snout || v[2] > snout.n[2]) snout = { n: v, w };          // native +Z extreme
  if (!backTail || v[2] < backTail.n[2]) backTail = { n: v, w }; // native -Z extreme
  if (!feet || v[1] < feet.n[1]) feet = { n: v, w };             // native -Y extreme
  if (!crown || v[1] > crown.n[1]) crown = { n: v, w };          // native +Y extreme
  if (!wTipR || v[0] > wTipR.n[0]) wTipR = { n: v, w };          // native +X extreme
}
console.log('\nWORLD bbox  min', f3(lo), ' max', f3(hi));
console.log('landmark VERTS (native extreme -> world pos):');
console.log('  snout(+Z)  ', f3(snout.w));
console.log('  back(-Z)   ', f3(backTail.w));
console.log('  feet(-Y)   ', f3(feet.w));
console.log('  crown(+Y)  ', f3(crown.w));
console.log('  wingtipR(+X)', f3(wTipR.w));
console.log('\nTARGET (procedural azure): head ~[0,+0.3,-1.9]  tail ~[0,+0.2,+2.1]  dorsal +Y  feet -Y');
