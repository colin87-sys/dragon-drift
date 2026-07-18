// tests/ribbonspine.mjs — RIBBON SPINE (Inc 0) regression guard.
//
// Proves the ribbon scaffold in dragonJadeSerpent.js: every vertex is decomposed into a
// (home station, offset in that station's rest T/B/Nn frame), and re-lofting the whole welded
// mesh from the REST frames reproduces the baked geometry to float precision (the identity
// proof), with no NaN and valid station indices. This is the foundation the follow-the-leader
// ribbon animation (RIBBON-ANIMATION-PLAN.md) re-lofts from each frame — if reconstruction ever
// drifts, the animated body would tear/shear, so lock it here.
//
//   node tests/ribbonspine.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
  set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } };

// re-loft a single vertex from a frame set: vertex = f.p + offT·T + offB·B + offN·Nn
function reloft(F, rib, v, out) {
  const f = F[rib.station[v]], t = rib.offT[v], b = rib.offB[v], n = rib.offN[v];
  out[0] = f.p.x + t * f.T.x + b * f.B.x + n * f.Nn.x;
  out[1] = f.p.y + t * f.T.y + b * f.B.y + n * f.Nn.y;
  out[2] = f.p.z + t * f.T.z + b * f.B.z + n * f.Nn.z;
}

const maxT = maxTierFor('jade');
for (let form = 0; form <= maxT; form++) {
  const def = ascendedDef(DRAGONS.jade, form);
  const model = buildDragonModel(def);
  const bw = model.parts.bodyWave;
  ok(!!bw && !!bw.ribbon, `jade f${form}: bodyWave.ribbon published`);
  if (!bw || !bw.ribbon) continue;
  const rib = bw.ribbon;
  const pos = bw.geo.attributes.position.array;
  const vcount = bw.geo.attributes.position.count;

  ok(rib.count === vcount, `jade f${form}: ribbon.count ${rib.count} === vertex count ${vcount}`);
  ok(rib.station.length === vcount && rib.offT.length === vcount && rib.offB.length === vcount && rib.offN.length === vcount,
    `jade f${form}: per-vertex arrays sized to vcount`);
  ok(rib.restFrames.length === rib.N && rib.liveFrames.length === rib.N, `jade f${form}: ${rib.N} rest+live frames`);

  // every station index valid, no NaN in offsets
  let badStation = 0, nanOff = 0;
  for (let v = 0; v < vcount; v++) {
    if (!(rib.station[v] >= 0 && rib.station[v] < rib.N)) badStation++;
    if (!Number.isFinite(rib.offT[v]) || !Number.isFinite(rib.offB[v]) || !Number.isFinite(rib.offN[v])) nanOff++;
  }
  ok(badStation === 0, `jade f${form}: all station indices in [0,${rib.N}) (${badStation} bad)`);
  ok(nanOff === 0, `jade f${form}: no NaN offsets (${nanOff} bad)`);

  // THE IDENTITY PROOF: re-loft from REST frames reproduces the baked positions.
  const out = [0, 0, 0]; let maxErr = 0, nan = 0;
  for (let v = 0; v < vcount; v++) {
    reloft(rib.restFrames, rib, v, out);
    for (let k = 0; k < 3; k++) {
      const e = out[k] - pos[v * 3 + k];
      if (!Number.isFinite(out[k])) nan++;
      if (Math.abs(e) > maxErr) maxErr = Math.abs(e);
    }
  }
  ok(nan === 0, `jade f${form}: re-loft produces no NaN`);
  ok(maxErr < 1e-3, `jade f${form}: rest-frame re-loft reproduces baked geometry (max err ${maxErr.toExponential(2)} < 1e-3)`);
}

// the roster stays untouched: no other dragon publishes a ribbon.
for (const key of Object.keys(DRAGONS)) {
  if (key === 'jade') continue;
  const def = ascendedDef(DRAGONS[key], 0);
  let model; try { model = buildDragonModel(def); } catch { continue; }
  const bw = model.parts && model.parts.bodyWave;
  if (bw) ok(!bw.ribbon, `${key}: no ribbon (jade-gated)`);
}

console.log(`\nRibbon spine (Inc 0): ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
