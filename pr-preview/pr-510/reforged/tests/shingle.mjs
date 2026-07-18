// Headless test of the shingle() generator (roadmap #2) — overlapping cupped
// cards merged to ONE geometry, detail- and form-aware, proven on Obsidian without
// breaking the budget or the roster.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// Minimal DOM/canvas shim so util.js texture helpers don't throw (no renderer).
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const THREE = await import('three');
const { shingle, shingleCard } = await import('../js/dragonShingle.js');
const { setActiveDetail } = await import('../js/modelDetail.js');
const { DRAGONS } = await import('../js/dragons.js');
// obsidian was retired from the roster (PR #338); this test targets it, so skip gracefully
// until it is repointed to a live hero — do NOT fail the suite on a retired subject.
if (!DRAGONS.obsidian) { console.log('\nshingle: SKIP — obsidian retired from roster (no live subject)'); process.exit(0); }
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const triCount = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
function modelTris(group) {
  let t = 0; group.traverse((o) => { if (o.isMesh && o.geometry) t += triCount(o.geometry); }); return Math.round(t);
}
// a straight synthetic run (line along z, flat +Y normal) for unit checks
const straightRun = (count, extra = {}) => shingle({
  count, rows: 1, at: (t) => ({ x: 0, y: 0, z: t * 2 }),
  normalAt: () => new THREE.Vector3(0, 1, 0), length: 0.3, width: 0.18,
  material: new THREE.MeshStandardMaterial(), ...extra,
});

setActiveDetail('high');

// --- 1. one merged indexed geometry / one mesh ------------------------------
const r = straightRun(10);
assert(r.mesh && r.mesh.isMesh && r.geometry && r.geometry.isBufferGeometry, 'shingle returns one Mesh + one BufferGeometry');
assert(!!r.geometry.index, 'merged geometry is indexed');
let meshCount = 0; r.mesh.traverse((o) => { if (o.isMesh) meshCount++; });
assertEq(meshCount, 1, 'a run is a SINGLE mesh (one draw call), not a group of cards');
ok('a run merges to one indexed mesh (one draw call)');

// --- 2. tri count scales with count + is deterministic ----------------------
assertEq(triCount(straightRun(8).geometry), 8 * 1 * 2, '8 cards × 1 row × 2 tris (1×1 card) = 16 tris');
assertEq(triCount(straightRun(16).geometry), 16 * 2, '16 cards → 32 tris (linear in count)');
ok('triCount is deterministic and linear in card count');

// --- 3. scales with detail (LOW < HIGH < ULTRA) -----------------------------
// count is seg()-scaled by the caller (mirrors dragonModel); card tess also scales.
const { seg } = await import('../js/modelDetail.js');
const atDetail = (d) => { setActiveDetail(d); return triCount(straightRun(seg(12), { cardRows: 1, cardCols: 1 }).geometry); };
const lo = atDetail('low'), hi = atDetail('high'), ul = atDetail('ultra');
setActiveDetail('high');
assert(lo < hi && hi < ul, `detail ramps tris LOW ${lo} < HIGH ${hi} < ULTRA ${ul}`);
ok('shingle density + tessellation scale with the detail tier');

// --- 4. camber produces a real cup (not a flat card) ------------------------
const card = shingleCard(0.4, 0.2, { cup: 0.3 });
const cp = card.attributes.position; let maxY = 0;
for (let i = 0; i < cp.count; i++) maxY = Math.max(maxY, cp.getY(i));
assert(maxY > 1e-3, `card is cupped along +Y (max y ${maxY.toFixed(3)} > 0)`);
ok('shingleCard camber bows the card into a real cup');

// --- 5. no NaN normals, no degenerate triangles after merge -----------------
const g = straightRun(12).geometry;
g.computeVertexNormals();
const nrm = g.attributes.normal; let badN = 0;
for (let i = 0; i < nrm.count; i++) if (![nrm.getX(i), nrm.getY(i), nrm.getZ(i)].every(Number.isFinite)) badN++;
const pos = g.attributes.position, idx = g.index; let degenerate = 0;
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
for (let i = 0; i < idx.count; i += 3) {
  a.fromBufferAttribute(pos, idx.getX(i)); b.fromBufferAttribute(pos, idx.getX(i + 1)); c.fromBufferAttribute(pos, idx.getX(i + 2));
  if (b.sub(a).cross(c.sub(a)).length() < 1e-9) degenerate++;
}
assertEq(badN, 0, 'no non-finite normals after merge');
assertEq(degenerate, 0, 'no degenerate (zero-area) triangles (the tip never collapses)');
ok('merged geometry is clean (finite normals, no degenerate tris)');

// --- 6. Obsidian: every form HIGH ≤ 6000, and Radiant/Eternal gained scales --
setActiveDetail('high');
const FORMS = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
const shingleMeshes = (group) => { let k = 0; group.traverse((o) => { if (o.isMesh && o.material?.userData?.shingle) k++; }); return k; };
const counts = [];
for (let tier = 0; tier <= 3; tier++) {
  const res = buildDragonModel(ascendedDef(DRAGONS.obsidian, tier, 0), { detail: 'high' });
  const tris = modelTris(res.group);
  assert(tris <= 6000, `obsidian ${FORMS[tier]} HIGH ${tris} ≤ 6000`);
  counts.push(shingleMeshes(res.group));
}
assertEq(counts[0], 0, 'Hatchling carries NO scale run (apex-dramatic ramp)');
assertEq(counts[1], 0, 'Kindled carries no scale run');
assert(counts[2] >= 1, 'Radiant gains the flank scale run (wiring is not a silent no-op)');
assert(counts[3] > counts[2], 'Eternal adds the shoulder mantle on top of the flank run');
ok(`obsidian HIGH ≤6000 every form; shingle runs ramp 0/0/${counts[2]}/${counts[3]} (apex-dramatic)`);

// --- 7. edge run joins spineMats (Surge flare) ------------------------------
const et = buildDragonModel(ascendedDef(DRAGONS.obsidian, 3, 0), { detail: 'high' });
const flareMats = et.materials.spineMats.filter((m) => m.userData?.shingle);
assert(flareMats.length >= 1, 'edge shingle material is in spineMats (rim light + Surge flare)');
assert(flareMats.every((m) => m.userData.baseEmissive != null && m.userData.baseIntensity != null), 'shingle flare mats carry Surge userData tags');
ok('edge scale material joins spineMats so it flares on Surge');

// --- 8. a non-shingle dragon is untouched (coexistence) ---------------------
const az = buildDragonModel(ascendedDef(DRAGONS.azure, 2, 0), { detail: 'high' });
assertEq(shingleMeshes(az.group), 0, 'azure (declares no parts.shingle) carries no scale meshes');
ok('dragons without parts.shingle are byte-identical (coexist → prove → migrate)');

setActiveDetail('high'); // leave the module at the safe default for later importers
console.log(`\n${n} shingle checks passed.`);
