// FLAP CLEARANCE PROBE — the first gate in this repo that measures the wing IN MOTION.
//
// WHY THIS EXISTS. The owner reported, from play, that the parts joining the trailing edge to the
// body "are like spokes that collide with the body in movement". It was real — a finger raking past
// ~85° about the wrist points backward-inboard, so its bone sweeps through the torso on the
// downstroke — and NOTHING in the harness could have caught it: every other tool here renders or
// measures a SINGLE POSE, and a motion collision cannot appear in a still. `planformprobe` even had
// an assertion attempted for it and withdrawn, because measuring REST geometry cannot tell a finger
// bone from a plagiopatagium corner (see the note in that file).
//
// ── THE MEASUREMENT ─────────────────────────────────────────────────────────────────────────────
// A wing root is SUPPOSED to be buried in the hull — that burial is how the junction seals (house
// kit, DRAGON-DESIGN §4). So "is any wing vertex inside the torso" is the wrong question; it is
// true by design, on every dragon in the roster, at rest.
//
// The right question is whether burial GROWS when the wing moves. The authored (unposed) build is
// the reference: whatever sits inside the hull there is the intended attachment footprint. Then for
// each flap phase we re-measure the SAME sample points and ask what changed:
//
//   • a point that was OUTSIDE the hull at rest and is INSIDE it at some phase  → swept in. A collision.
//   • a point buried at rest that goes DEEPER than its rest burial               → the root grinding.
//
// Both are motion facts, invisible in any still, and neither depends on classifying a triangle as
// "bone" or "membrane" — which is not possible here anyway: the wing batches per MATERIAL, and
// M.scorch carries both finger bones and the taut inner membrane band, so no per-mesh tag can
// separate them. Geometry answers the question that tags cannot.
//
// The torso is approximated by its own built geometry rather than by a capsule: for each z-slice we
// take the hull's actual max |x| and y-range from the body meshes. That keeps the test honest for a
// creature whose torso is a fixed-polygon loft rather than a tube.
//
//   node reforged/tools/flapclearance.mjs [key] [tier]
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { setFlapDebugPose } = await import('../js/wingDebugPose.js');

const key = process.argv[2] || 'fornax';
const tier = process.argv[3] != null ? Number(process.argv[3]) : maxTierFor(DRAGONS[key]);
const PHASES = ['glide', 'recovery', 'apex', 'downstroke', 'settle'];

// A wing may legitimately pass close to the flank — it grows from it. What is NOT legitimate is
// burial that DEEPENS with motion. Bands are calibrated against the shipped roster (see §BANDS at
// the foot of this file), not derived from theory.
const ROOT_FRAC = 0.30;    // the sealed junction: samples within this × span of the shoulder are exempt
const SWEEP_IN = -0.06;    // a point outside the hull at rest may not end up this far inside it
const GRIND = -0.10;       // a point buried at rest may not go this much deeper than its rest depth
const REST_BURIAL = -1.0;  // × hull half-width: −1.0 IS the midline, so the root may not exit the far side

let fail = 0, pass = 0;
const check = (ok, label, detail) => {
  if (ok) { pass++; console.log(`  ✓ ${label}   ${detail ?? ''}`); }
  else { fail++; console.log(`  ✗ ${label}   ${detail ?? ''}`); }
};

const def = ascendedDef(DRAGONS[key], tier, 0);
const built = buildDragonModel(def, { preview: true });
const group = built.group;
const parts = built.parts || {};

console.log(`\nFlap clearance probe — ${key} (tier ${tier})\n${'-'.repeat(78)}`);
console.log('  wing→torso clearance THROUGH the flap cycle (the rest of the harness is single-pose)\n');

// --- Partition the meshes: wing subtrees vs everything else --------------------------------------
const WING_ROOTS = ['wingYokeL', 'wingYokeR', 'wingRigL', 'wingRigR',
  'wingPivotL', 'wingPivotR', 'wingPivot2L', 'wingPivot2R'];
const wingMeshes = new Set();
for (const k of WING_ROOTS) if (parts[k]) parts[k].traverse((o) => { if (o.isMesh || o.isSkinnedMesh) wingMeshes.add(o); });
if (!wingMeshes.size) { console.log(`  ✗ no wing meshes found (parts: ${Object.keys(parts).join(', ') || 'none'})`); process.exit(1); }

const bodyMeshes = [];
group.traverse((o) => { if ((o.isMesh || o.isSkinnedMesh) && !wingMeshes.has(o) && o.geometry?.attributes?.position) bodyMeshes.push(o); });
if (!bodyMeshes.length) { console.log('  ✗ no torso geometry found'); process.exit(1); }

// --- The torso hull, from the BUILT body, per z-slice ---------------------------------------------
// Built once: setFlapDebugPose touches wing rotations only, so the hull is constant across phases.
group.updateMatrixWorld(true);
const NZ = 30;
const bodyPts = [];
{
  const v = new THREE.Vector3();
  for (const m of bodyMeshes) {
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); bodyPts.push([v.x, v.y, v.z]); }
  }
}
let zMin = Infinity, zMax = -Infinity;
for (const p of bodyPts) { if (p[2] < zMin) zMin = p[2]; if (p[2] > zMax) zMax = p[2]; }
const halfW = new Array(NZ).fill(0), yLo = new Array(NZ).fill(Infinity), yHi = new Array(NZ).fill(-Infinity);
const slot = (z) => Math.min(NZ - 1, Math.max(0, Math.floor(((z - zMin) / (zMax - zMin || 1)) * NZ)));
for (const [x, y, z] of bodyPts) {
  const s = slot(z);
  if (Math.abs(x) > halfW[s]) halfW[s] = Math.abs(x);
  if (y < yLo[s]) yLo[s] = y;
  if (y > yHi[s]) yHi[s] = y;
}
// clearance = how far OUTSIDE the hull a point is, at its own z-slice. Negative = inside.
const clr = (x, y, z) => {
  if (z < zMin || z > zMax) return 9;
  const s = slot(z);
  if (!Number.isFinite(yLo[s])) return 9;
  if (y < yLo[s] || y > yHi[s]) return 9;          // above or below the hull entirely — clear
  return Math.abs(x) - halfW[s];
};
// The same figure as a FRACTION of the hull's half-width there. −1.0 is the body midline, so
// "burial ≥ −1.0" reads as "the root does not come out the far side". Absolute units cannot express
// that law across a roster whose torsos differ in girth by ~2×.
const clrN = (x, y, z) => {
  const c = clr(x, y, z);
  if (c >= 9) return 9;
  const w = halfW[slot(z)] || 1;
  return c / w;
};

// --- The wing sample set -------------------------------------------------------------------------
// Vertices AND edge midpoints: a spar is a prism whose long faces carry no interior vertex, so a
// vertex-only sample can straddle the flank and read clear while the quad between passes through.
// Sample identity is (mesh, triangle, k) and is stable across phases because only transforms change.
const samples = [];   // [mesh, [ax,ay,az], ...] flattened below
const meshSamples = [];
for (const m of wingMeshes) {
  const pos = m.geometry?.attributes?.position; if (!pos) continue;
  const idx = m.geometry.index;
  const nTri = (idx ? idx.count : pos.count) / 3;
  const stride = Math.max(1, Math.floor(nTri / 1200));
  const local = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < nTri; t += stride) {
    const i0 = idx ? idx.getX(t * 3) : t * 3, i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    local.push([a.x, a.y, a.z], [b.x, b.y, b.z], [c.x, c.y, c.z],
      [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2],
      [(b.x + c.x) / 2, (b.y + c.y) / 2, (b.z + c.z) / 2],
      [(c.x + a.x) / 2, (c.y + a.y) / 2, (c.z + a.z) / 2]);
  }
  meshSamples.push({ mesh: m, local });
  samples.push(...local);
}
const nSamples = samples.length;

// Shoulders (both, so a left-wing sample is measured from ITS OWN joint — the left pivot rides an
// lmirror wrapper, so its world position is genuinely on the other side).
const SHOULDERS = [];
for (const k of ['wingPivotR', 'wingPivotL', 'wingRigR', 'wingRigL', 'wingYokeR', 'wingYokeL']) {
  if (parts[k]) SHOULDERS.push(parts[k].getWorldPosition(new THREE.Vector3()));
}
if (!SHOULDERS.length) SHOULDERS.push(new THREE.Vector3());
const stationOf = (p) => SHOULDERS.reduce((m, s) => Math.min(m, s.distanceTo(p)), Infinity);

// Measure every sample point at the current pose. Returns a flat Float64Array of clearances.
const measure = () => {
  group.updateMatrixWorld(true);
  const out = new Float64Array(nSamples);
  const v = new THREE.Vector3();
  let n = 0;
  for (const { mesh, local } of meshSamples) {
    const M = mesh.matrixWorld;
    for (const p of local) { v.set(p[0], p[1], p[2]).applyMatrix4(M); out[n++] = clr(v.x, v.y, v.z); }
  }
  return out;
};
// Sample world positions at the current pose (only fetched for the worst offender, for the report).
const worldAt = (want) => {
  const v = new THREE.Vector3(); let n = 0;
  for (const { mesh, local } of meshSamples) {
    const M = mesh.matrixWorld;
    for (const p of local) { if (n++ === want) { v.set(p[0], p[1], p[2]).applyMatrix4(M); return v.clone(); } }
  }
  return v;
};

// --- REST: the authored build, before any pose is applied ------------------------------------------
const rest = measure();
let restWorst = 9, restBuried = 0;
for (const c of rest) { if (c < restWorst) restWorst = c; if (c < 0) restBuried++; }
// the same worst burial expressed against the hull's own girth (see clrN)
let restWorstN = 9;
{
  const v = new THREE.Vector3();
  for (const { mesh, local } of meshSamples) {
    const M = mesh.matrixWorld;
    for (const p of local) { const n = clrN(...v.set(p[0], p[1], p[2]).applyMatrix4(M).toArray()); if (n < restWorstN) restWorstN = n; }
  }
}

// STATION — each sample's distance from its own shoulder, measured once at rest. This is the
// anatomical coordinate the law is written in: burial near the joint is the sealed root and is
// invisible; burial far out along the wing is a limb raking the flank, which is what the owner saw.
const station = new Float64Array(nSamples);
{
  const v = new THREE.Vector3(); let n = 0;
  for (const { mesh, local } of meshSamples) {
    const M = mesh.matrixWorld;
    for (const p of local) station[n++] = stationOf(v.set(p[0], p[1], p[2]).applyMatrix4(M));
  }
}
let SPAN = 0;
for (const d of station) if (d > SPAN) SPAN = d;
const ROOT_ZONE = ROOT_FRAC * SPAN;

console.log(`  rest (authored)   worst ${restWorst.toFixed(3)}u   ${restBuried} of ${nSamples} samples inside the hull  (the attachment footprint)`);
console.log(`  wing span ${SPAN.toFixed(2)}u from the shoulder   root zone = ${ROOT_FRAC} × span = ${ROOT_ZONE.toFixed(2)}u  (burial inside it is the sealed junction)`);
console.log('');

// --- Each flap phase, against that reference -------------------------------------------------------
const BANDS = [0.25, 0.5, 0.75, 1.01];   // fractions of span, for the radial profile
const rows = [];
const profile = BANDS.map(() => 9);
for (const phase of PHASES) {
  setFlapDebugPose(parts, def.model, phase);
  const cur = measure();
  let sweptIn = 0, worstSweep = 9, worstSweepI = -1, worstGrind = 9, grindSamples = 0;
  let rootWorst = 9;
  for (let i = 0; i < nSamples; i++) {
    const c = cur[i], r = rest[i], st = station[i];
    // radial profile — every sample, regardless of zone, so the root/limb split is visible not assumed
    const bi = BANDS.findIndex((f) => st <= f * SPAN);
    if (bi >= 0 && c < profile[bi]) profile[bi] = c;
    if (st <= ROOT_ZONE) { if (c < rootWorst) rootWorst = c; continue; }   // sealed junction — exempt
    if (r >= 0) {                                     // outside at rest — may not swim in
      if (c < 0) sweptIn++;
      if (c < worstSweep) { worstSweep = c; worstSweepI = i; }
    } else {                                          // buried at rest — may not grind deeper
      grindSamples++;
      if (c - r < worstGrind) worstGrind = c - r;
    }
  }
  const wp = worstSweepI >= 0 ? worldAt(worstSweepI) : null;
  rows.push({ phase, sweptIn, worstSweep, worstGrind, rootWorst, grindSamples, at: wp && { d: station[worstSweepI] } });
  console.log(`  ${phase.padEnd(11)} swept-in ${String(sweptIn).padStart(4)}   worst-sweep ${worstSweep >= 9 ? '  clear' : worstSweep.toFixed(3) + 'u'}   worst-grind ${worstGrind >= 9 ? '  none' : worstGrind.toFixed(3) + 'u'}   root ${rootWorst >= 9 ? 'clear' : rootWorst.toFixed(3) + 'u'}` +
    (wp && worstSweep < 0 ? `   [at ${(station[worstSweepI] / SPAN).toFixed(2)}× span, xyz ${wp.x.toFixed(2)} ${wp.y.toFixed(2)} ${wp.z.toFixed(2)}, hull ±${(halfW[slot(wp.z)] || 0).toFixed(2)}]` : ''));
}

console.log('\n  worst clearance by station (all phases, all samples):');
console.log('    ' + BANDS.map((f, i) => `≤${f.toFixed(2)}×span ${profile[i] >= 9 ? ' clear' : profile[i].toFixed(3) + 'u'}`).join('   '));
console.log('');

const wsRow = rows.reduce((a, b) => (b.worstSweep < a.worstSweep ? b : a));
const wgRow = rows.reduce((a, b) => (b.worstGrind < a.worstGrind ? b : a));
check(wsRow.worstSweep >= SWEEP_IN, `C1  beyond the root zone, nothing sweeps INTO the hull  [≥${SWEEP_IN}u]`,
  `worst ${wsRow.worstSweep >= 9 ? 'clear' : wsRow.worstSweep.toFixed(3) + 'u'} at "${wsRow.phase}"` +
  (wsRow.at && wsRow.worstSweep < 0 ? `, ${(wsRow.at.d / SPAN).toFixed(2)}× span out along the wing` : ''));
// ⚠ A TRIPWIRE, and on the present roster a VACUOUS one: outside the root zone no dragon authors
// geometry already inside the hull, so this assert covers zero samples and passes for free. Printing
// the coverage is the point — a gate that passes on an empty set must SAY the set was empty, or it
// reads as evidence it never gathered. It fires the day a wing authors a buried mid-span strap.
const grindCov = Math.max(...rows.map((r) => r.grindSamples));
check(wgRow.worstGrind >= GRIND, `C2  beyond the root zone, rest-buried geometry does not deepen  [≥${GRIND}u vs rest]`,
  grindCov === 0 ? 'VACUOUS — 0 samples buried at rest outside the root zone (tripwire only)'
    : `worst ${wgRow.worstGrind.toFixed(3)}u at "${wgRow.phase}" over ${grindCov} samples`);
check(restWorstN >= REST_BURIAL, `C3  the authored root burial does not cross the midline  [≥${REST_BURIAL} × half-width]`,
  `worst ${restWorstN.toFixed(2)}× (${restWorst.toFixed(3)}u) at rest`);

console.log('-'.repeat(78));
console.log(fail === 0 ? `PASS — ${pass} clearance targets met  (${nSamples} samples × ${PHASES.length} phases)`
  : `FAIL — ${fail} of ${pass + fail} targets missed`);
process.exit(fail === 0 ? 0 : 1);

// ── §BANDS — calibrated on the shipped roster BEFORE being pointed at the subject ────────────────
// planformprobe's bands were set this way too: a band derived from theory that fails Tempest is a
// bug in the band, not a finding. Measured, 2026-07-28, tier 3:
//
//            C1 worst sweep-in        C3 rest burial      verdict
//   tempest  clear (+1.285u)          −0.91× half-width   PASS   ← the premium bar, clean at every station
//   azure    clear (+1.378u)          −0.20×              PASS
//   revenant −0.012u @ 0.30× span     −0.85×              PASS   (grazes the boundary, 0.012u ≈ 0.25px)
//   vesper   −0.176u @ 0.42× span     −0.68×              FAIL   ← see below
//   fornax   −0.480u @ 0.38× span     −0.86×              FAIL   ← the reported defect, measured
//
// ⚠ VESPER IS A KNOWN NON-CONFORMANCE, NOT A REASON TO WIDEN THE BAND. Loosening SWEEP_IN to
// −0.20u to make the roster all-green would have made the gate blind to the subject's −0.48u by
// only 0.28u, and blind to the whole class at the magnitude a player notices. The band is set at
// what the PREMIUM bar actually achieves (Tempest: clear at every station beyond the root), which
// is the standard AAA-PIPELINE asks for. Vesper's downstroke rake is a real, logged defect.
//
// The first three C1 numbers also justify ROOT_FRAC: every dragon buries geometry inside 0.25×
// span and three of five are clear beyond it, so 0.30× is a floor with margin, not a fitted value.
