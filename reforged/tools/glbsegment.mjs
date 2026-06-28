// Segment a fused dragon GLB into animatable PARTS by native-space region, so the mesh
// can be rigged (a bone per part + skin weights). Pyrelord native frame (measured with
// glborient.mjs): +Z snout/front, -Z back, +Y dorsal/up, -Y feet, +-X wingspan.
// Reports per-part vertex count + bbox, and (optionally) the classification thresholds,
// so we can confirm the parts are cleanly separable before building the skeleton.
//
//   node tools/glbsegment.mjs assets/models/pyrelord.glb
import { readFileSync } from 'fs';

const path = process.argv[2] || 'assets/models/pyrelord.glb';
const buf = readFileSync(path);
const c0len = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + c0len).toString('utf8'));
let off = 20 + c0len;
const binLen = buf.readUInt32LE(off);
const bin = buf.slice(off + 8, off + 8 + binLen);
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

// Classification (priority order). Thresholds from glbaxes bins; wings dominate the
// wide-X upper-back, the head is the front-upper snout, the tail is the low/narrow back,
// legs are the low-Y limbs, neck bridges head->torso, torso is the central remainder.
function classify([x, y, z]) {
  const ax = Math.abs(x);
  if (ax > 0.30 && y > 0.12) return x > 0 ? 'wingR' : 'wingL';   // wide + upper = membrane
  if (z > 0.42 && ax < 0.40 && y > -0.05) return 'head';          // front-upper snout/skull
  if (z < -0.30 && ax < 0.16) return 'tail';                      // narrow midline back appendage
  if (y < -0.22 && ax < 0.45) return 'legs';                      // low limbs/feet
  if (z > 0.05 && ax < 0.35 && y > 0.0) return 'neck';            // bridges head->torso
  return 'torso';                                                  // central bulk
}

const PARTS = ['head', 'neck', 'torso', 'tail', 'wingL', 'wingR', 'legs'];
const stat = {};
for (const k of PARTS) stat[k] = { n: 0, lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity], sum: [0, 0, 0] };
for (const p of P) {
  const k = classify(p);
  const s = stat[k]; s.n++;
  for (let i = 0; i < 3; i++) { s.lo[i] = Math.min(s.lo[i], p[i]); s.hi[i] = Math.max(s.hi[i], p[i]); s.sum[i] += p[i]; }
}
const f = (a) => '[' + a.map((n) => (n === Infinity || n === -Infinity ? '  -  ' : n.toFixed(2).padStart(5))).join(',') + ']';
console.log(`segment: ${path}   verts=${P.length}\n`);
console.log('part     verts   %     native bbox min            max                centroid');
for (const k of PARTS) {
  const s = stat[k];
  const pct = ((s.n / P.length) * 100).toFixed(1).padStart(4);
  const c = s.n ? s.sum.map((v) => v / s.n) : [0, 0, 0];
  console.log(`${k.padEnd(7)} ${String(s.n).padStart(6)}  ${pct}  ${f(s.lo)}  ${f(s.hi)}  ${f(c)}`);
}
console.log('\nProposed skeleton (bone -> parent), pivots at each part\'s native root:');
console.log('  root(pelvis) -> spine(torso) -> neck -> head;  spine -> tailA -> tailB -> tailC;');
console.log('  spine -> shoulderL -> wingL;  spine -> shoulderR -> wingR;  root -> legFL/FR/BL/BR');
