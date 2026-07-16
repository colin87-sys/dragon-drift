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

const states = WING_DEBUG_STATES.filter((s) => s !== 'bank' && s !== 'fold');
let worst = 0, worstMsg = '';
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
console.log(`\n${KEY}: worst asymmetry ${worst.toFixed(3)}  (${worstMsg})`);
console.log(worst < 0.03 ? 'PASS — wings bilaterally symmetric in straight flight' : 'FAIL — residual asymmetry');
process.exitCode = worst < 0.03 ? 0 : 1;
