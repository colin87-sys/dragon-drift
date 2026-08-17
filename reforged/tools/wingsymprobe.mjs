// Numerical wing-symmetry probe (headless, no WebGL). Builds solar's rig via the same
// buildDragonModel the game uses, poses it through setFlapDebugPose at every wing state,
// and checks the world-space wingTipL/R (and pivots) are true MIRROR images across x=0:
//   L.x ≈ -R.x,  L.y ≈ R.y,  L.z ≈ R.z.
// Any residual asymmetry in the shared direct-pivot poser shows up as a nonzero mismatch.
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);

const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
  set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.get(k) ?? null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { setFlapDebugPose, WING_DEBUG_STATES } = await import('../js/wingDebugPose.js');

const KEY = process.argv[2] || 'solar';
const def = ascendedDef(DRAGONS[KEY], 3, 0);   // apex form
const model = buildDragonModel(def);
const P = model.parts || {};
const root = model.group || model;
root.updateWorldMatrix(true, true);

// RIG-AGNOSTIC test: gather every ACTUAL world-space vertex under the L / R wing pivots, and
// compare the left vertex cloud to the MIRROR of the right (reflect across the sagittal plane
// x = bodyCx). We compare aggregate stats invariant to vertex ordering: centroid, and the
// world-Y band (min/max) of each cloud. A symmetric beat ⇒ centroid_L = reflect(centroid_R)
// and identical Y-bands; a tilted/off-beat wing shifts the centroid Y or splits the bands.
function cloudStats(pivot) {
  const c = new THREE.Vector3(); let n = 0, ymin = Infinity, ymax = -Infinity, xmin = Infinity, xmax = -Infinity;
  const v = new THREE.Vector3();
  pivot.updateWorldMatrix(true, true);
  pivot.traverse((o) => {
    const g = o.geometry; if (!g || !g.attributes || !g.attributes.position) return;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      c.add(v); n++;
      ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y);
      xmin = Math.min(xmin, v.x); xmax = Math.max(xmax, v.x);
    }
  });
  if (n) c.multiplyScalar(1 / n);
  return { c, n, ymin, ymax, xmin, xmax };
}

// STRAIGHT FLIGHT only — which is what the ≤0.03 bound below is calibrated on, and what
// this probe's own verdict line claims. `bank` and `fold` were always excluded as
// POSTURES; wing-lab I4.1 adds four more (tuck / drape / display / mantle) and they are
// postures by the same argument — a fold-class pose stacks the §7.4 seeded weathering and
// legitimately measures larger, which is why 90-SYNTHESIS §8.1 (R6) gives postures their
// own ≤0.05 bound *with a per-system attribution table*. That bound is enforced, with its
// table, in `wing-lab/tools/wingfold.mjs`; applying the flight number here instead would
// be a probe carrying a tolerance the spec does not have (the reverse of the R6 finding).
const POSTURES = new Set(['bank', 'fold', 'tuck', 'drape', 'display', 'mantle']);
const states = WING_DEBUG_STATES.filter((s) => !POSTURES.has(s));
let worst = 0, worstMsg = '';
// ── THE RIG, MEASURED APART FROM THE DECORATION (added at wing-lab I3.1) ──────
// The vertex-cloud test below cannot tell a POSER that is off-beat from a MESH that is
// seeded — and one of those is a bug while the other is mandatory (the forgewing's §7.4
// makes weathering asymmetry law: temper rings, ash break-up, the cord-tooth train and the
// fire-slot row all differ L from R by design, and a wing whose two halves are stamped
// copies is the tell that law exists to kill). The named JOINT NODES carry no decoration,
// so their world positions isolate exactly the claim the probe was written to make: the
// shared direct-pivot poser applies no L/R phase offset (§12 kill #55). This must read
// 0.000 on every article, seeded or not — and if it ever does not, the cloud number below
// is measuring a real rig break rather than a seed.
const JOINTS = ['wingPivot', 'wingMid', 'wingTip', 'tipMarker', 'wingYoke', 'wingRig', 'wingPivot2'];
let rigWorst = 0, rigMsg = 'no joint pairs on this rig';
const _w = new THREE.Vector3(), _w2 = new THREE.Vector3();
for (const st of states) {
  setFlapDebugPose(P, def.model, st);
  root.updateWorldMatrix(true, true);
  for (const j of JOINTS) {
    const R = P[j + 'R'], L = P[j + 'L'];
    if (!R || !L || !R.isObject3D || !L.isObject3D) continue;
    R.getWorldPosition(_w); L.getWorldPosition(_w2);
    const e = Math.max(Math.abs(_w.x + _w2.x), Math.abs(_w.y - _w2.y), Math.abs(_w.z - _w2.z));
    if (e > rigWorst) { rigWorst = e; rigMsg = `${st} · ${j}`; }
    else if (rigMsg === 'no joint pairs on this rig') rigMsg = `${st} · ${j}`;
  }
}
// sagittal plane: midpoint of the two pivot roots' X (the body centreline)
for (const st of states) {
  setFlapDebugPose(P, def.model, st);
  root.updateWorldMatrix(true, true);
  const Rs = cloudStats(P.wingPivotR), Ls = cloudStats(P.wingPivotL);
  if (!Rs.n || !Ls.n) { console.log(`  ? ${st}: no wing verts (R${Rs.n} L${Ls.n})`); continue; }
  const bodyCx = (Rs.c.x + Ls.c.x) / 2;   // assume centroids straddle the centreline
  // reflect R centroid across x=bodyCx: (2*bodyCx - x, y, z)
  const dCx = Math.abs((2 * bodyCx - Rs.c.x) - Ls.c.x);   // ~0 by construction; sanity
  const dCy = Math.abs(Rs.c.y - Ls.c.y);                   // centroid HEIGHT must match
  const dCz = Math.abs(Rs.c.z - Ls.c.z);                   // centroid DEPTH must match
  const dYmin = Math.abs(Rs.ymin - Ls.ymin), dYmax = Math.abs(Rs.ymax - Ls.ymax);  // tip/root Y band
  const err = Math.max(dCy, dCz, dYmin, dYmax);
  if (err > worst) { worst = err; worstMsg = `${st}: dCy${dCy.toFixed(3)} dCz${dCz.toFixed(3)} dYmin${dYmin.toFixed(3)} dYmax${dYmax.toFixed(3)}`; }
  const tag = err < 0.03 ? '✓' : '✗';
  console.log(`  ${tag} ${st.padEnd(10)} Rc(${Rs.c.x.toFixed(2)},${Rs.c.y.toFixed(2)},${Rs.c.z.toFixed(2)}) Lc(${Ls.c.x.toFixed(2)},${Ls.c.y.toFixed(2)},${Ls.c.z.toFixed(2)})  Yband R[${Rs.ymin.toFixed(2)},${Rs.ymax.toFixed(2)}] L[${Ls.ymin.toFixed(2)},${Ls.ymax.toFixed(2)}]  Δ${err.toFixed(3)}`);
}
console.log(`\n${KEY}: RIG (joint nodes, decoration-free) worst mirror error ${rigWorst.toFixed(3)}  (${rigMsg})`);
console.log(`${KEY}: worst asymmetry ${worst.toFixed(3)}  (${worstMsg})   — vertex clouds; includes any SEEDED weathering`);
console.log(worst < 0.03 ? 'PASS — wings bilaterally symmetric in straight flight' : 'FAIL — residual asymmetry');
process.exitCode = worst < 0.03 ? 0 : 1;
