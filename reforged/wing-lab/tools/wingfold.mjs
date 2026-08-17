// WING LAB — I4 MOTION probe. PURE MATH, no WebGL, ~5 s.
//
//   cd reforged && node wing-lab/tools/wingfold.mjs [key ...]
//
// The numbers the MOTION gate is argued on (90-SYNTHESIS §8), each with a NEGATIVE CONTROL
// beside it, because kill #67 is law here: in this lab a quad probe read a tail fin as a
// wing rectangle, a tier probe scored a black membrane at ×267, a closed-contour probe
// cleared the very ring that lost a gate, and a clipped-white control sat inside its own
// threshold for two rounds. A probe that has not been shown to FAIL proves nothing.
//
//   §8.1 the beat   per-segment relative angles at the five freeze phases; the hand's sign
//                   must FLIP against the forearm between top and bottom; the projected
//                   recovery dogleg (FLAP-DESIGN §8's ≥12° test) from the chase camera.
//   §8.2 the surface  the slack scalar through the beat, and the wrinkle/ripple amplitude
//                   it drives — R3's teeth: amplitude must visibly DIFFER between the
//                   bottom of the downstroke and the top of the upstroke.
//   §8.3 the fold   the span ratio over the whole fold ARC (not just the endpoint), the
//                   order of collapse (span must shorten BEFORE the planform thins), where
//                   the tip lands against the hip/knee, the skirt overlap and flank cover
//                   at every point of the arc, and — the number that makes the rest honest
//                   — the WELD OPENING at each of the three seams.
//
// THE SEAM OPENING is this article's own invention and its own risk. Every joint is a
// rotation about a line fitted to its weld, so the shared edge should be a FIXED SET. This
// measures it the only way that can fail: transform the weld's vertices by the PARENT
// frame's world matrix and by the CHILD frame's world matrix, and take the worst distance
// between the two. A fold ratio bought by tearing the skin is not a fold.
import { register } from 'node:module';
register('../../tools/three-resolver.mjs', import.meta.url);

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
const { DRAGONS } = await import('../../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../../js/ascension.js');
const { buildDragonModel } = await import('../../js/dragonModel.js');
const { setFlapDebugPose, resolveWingDebug, poseWingSeams, FOLD } = await import('../../js/wingDebugPose.js');

const KEYS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const MAIN = KEYS[0] || 'forgewing';
const ok = (b) => (b ? '✓' : '✗');
const f2 = (v) => (v >= 0 ? ' ' : '') + v.toFixed(2);

// ── build ────────────────────────────────────────────────────────────────────
function build(key) {
  const def = ascendedDef(DRAGONS[key], maxTierFor(key), 0);
  const model = buildDragonModel(def);
  const P = model.parts || {};
  const frames = {};
  for (const s of ['R', 'L']) {
    const root = P['wingPivot' + s];
    if (!root) continue;
    frames[s] = {};
    root.traverse((o) => { const r = o.userData && o.userData.wingRole;
      if (r && r.endsWith('Frame')) frames[s][r.replace('Frame', '')] = o; });
  }
  return { def, model, P, frames };
}

// span/extent of the wing pair, measured EXACTLY (every vertex through its own world
// matrix) rather than from axis-aligned box corners: a folded wing is rotated ~120°, and
// an AABB-of-AABB over-reports a rotated part by up to √3. Both numbers are printed so the
// shipped `wingdump` figure and this one can be compared instead of confused.
function wingExtent(P) {
  const WING_ROOTS = ['wingPivotL', 'wingPivotR', 'wingYokeL', 'wingYokeR', 'wingRigL', 'wingRigR', 'wingPivot2L', 'wingPivot2R'];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  const v = new THREE.Vector3();
  for (const k of WING_ROOTS) {
    const n = P[k]; if (!n || !n.isObject3D) continue;
    n.updateWorldMatrix(true, true);
    n.traverse((o) => {
      if (!o.isMesh || !o.geometry || (o.userData && o.userData.wlFX)) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        for (let a = 0; a < 3; a++) { const c = v.getComponent(a); if (c < lo[a]) lo[a] = c; if (c > hi[a]) hi[a] = c; }
      }
    });
  }
  return { spanX: hi[0] - lo[0], riseY: hi[1] - lo[1], chordZ: hi[2] - lo[2], lo, hi };
}

// the worst distance a weld vertex travels between the two frames that share it
// Split into the two components that mean different things. A displacement ALONG the seam
// is a SHEAR: the two edges still lie on the same line and still touch, they just end at
// slightly different places, so it costs a notch at one end, not a slit down the length. A
// displacement PERPENDICULAR to the seam is the real thing — a hole in the skin. `gap` is
// the perpendicular part and is the number the law is written against.
function seamOpen(seam, frames, name) {
  const ax = seam[name]; if (!ax || !ax.pts) return { gap: 0, shear: 0 };
  const [pa, pb] = ax.frames;
  let gap = 0, shear = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
  for (const s of ['R', 'L']) {
    const F = frames[s]; if (!F || !F[pa] || !F[pb]) continue;
    F[pa].updateWorldMatrix(true, false); F[pb].updateWorldMatrix(true, false);
    // the seam direction lives in wing-local space; carry it into the parent's world frame
    const dir = new THREE.Vector3(ax.dir[0], ax.dir[1], ax.dir[2]).transformDirection(F[pa].matrixWorld).normalize();
    for (const p of ax.pts) {
      a.set(p[0], p[1], p[2]).applyMatrix4(F[pa].matrixWorld);
      b.set(p[0], p[1], p[2]).applyMatrix4(F[pb].matrixWorld);
      d.subVectors(b, a);
      const along = d.dot(dir);
      shear = Math.max(shear, Math.abs(along));
      gap = Math.max(gap, d.addScaledVector(dir, -along).length());
    }
  }
  return { gap, shear };
}

// pose at an arbitrary fold amount (the harness state only exposes 0 and 1)
// ONE call — re-posing on top of an already-posed rig would apply the seam rotations twice
// (the poser reads the flap angle off rotation.z, which the first pass has already consumed).
function poseAt(P, def, fold) { setFlapDebugPose(P, def.model, fold > 0 ? 'fold' : 'glide', fold); }

// ═══ 1 · THE FOLD ═══════════════════════════════════════════════════════════
function foldReport(key, { def, model, P, frames }) {
  const seam = P.wingSeamAxes;
  console.log(`\n═══ ${key} — §8.3 THE FOLD ═══`);
  setFlapDebugPose(P, def.model, 'glide');
  model.group.updateWorldMatrix(true, true);
  const g = wingExtent(P);
  const body = new THREE.Vector3(); new THREE.Box3().setFromObject(model.group).getSize(body);
  console.log(`  glide  spanX ${g.spanX.toFixed(2)} (exact)  chordZ ${g.chordZ.toFixed(2)}  bodyZ ${body.z.toFixed(2)}  span/body ${(g.spanX / body.z).toFixed(3)}`);
  if (!seam) { console.log('  (no seam rig on this wing — the fold is whatever the shipped rollFold gives)'); }

  console.log('\n  fold arc        span     ratio   chordZ   Δspan%   Δchord%   elbow    wrist    fan     worst weld');
  const arc = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1.0];
  const rows = [];
  for (const f of arc) {
    poseAt(P, def, f);
    model.group.updateWorldMatrix(true, true);
    const e = wingExtent(P);
    const so = seam ? { e: seamOpen(seam, frames, 'elbow').gap, w: seamOpen(seam, frames, 'wrist').gap, f: seamOpen(seam, frames, 'fan').gap,
      sh: Math.max(seamOpen(seam, frames, 'elbow').shear, seamOpen(seam, frames, 'wrist').shear, seamOpen(seam, frames, 'fan').shear) } : null;
    rows.push({ f, ...e, so });
  }
  const g0 = rows[0];
  for (const r of rows) {
    const dS = 100 * (1 - r.spanX / g0.spanX), dC = 100 * (1 - r.chordZ / g0.chordZ);
    const w = r.so ? Math.max(r.so.e, r.so.w, r.so.f) : NaN;
    console.log(`  f=${r.f.toFixed(2)}        ${r.spanX.toFixed(2).padStart(5)}   ${(r.spanX / g0.spanX).toFixed(3)}   ${r.chordZ.toFixed(2).padStart(5)}   ${dS.toFixed(1).padStart(5)}%   ${dC.toFixed(1).padStart(6)}%   ` +
      (r.so ? `${r.so.e.toFixed(3)}  ${r.so.w.toFixed(3)}  ${r.so.f.toFixed(3)}   ${w.toFixed(3)} u` : ''));
  }
  const fin = rows[rows.length - 1];
  const ratio = fin.spanX / g0.spanX;
  console.log(`\n  FOLD RATIO (exact vertices) ${ratio.toFixed(3)}   ${ok(ratio <= 0.55)} §8.3 target ≤ 0.55   (house law 0.70 · shipped: vesper 0.838 · revenant 0.932 · tempest 0.986)`);
  // §8.3 step 1: "span visibly SHORTENS first; a fold that thins before it shortens is
  // ruled out". Compared at the FIRST loaded sample of the arc.
  let ordOK = true, ordWorst = '';
  for (const r of rows.slice(1, 5)) {
    const dS = 1 - r.spanX / g0.spanX, dC = 1 - r.chordZ / g0.chordZ;
    if (dC > dS + 0.02) { ordOK = false; ordWorst = `f=${r.f.toFixed(2)} span −${(100 * dS).toFixed(1)}% but planform −${(100 * dC).toFixed(1)}%`; }
  }
  console.log(`  ORDER OF COLLAPSE through the loaded half of the arc: ${ok(ordOK)} span shortens before the planform thins (§8.3 step 1)${ordOK ? '' : '  ← ' + ordWorst}`);
  if (seam) {
    const wm = Math.max(...rows.map((r) => Math.max(r.so.e, r.so.w, r.so.f)));
    const w0 = Math.max(g0.so.e, g0.so.w, g0.so.f);
    const shm = Math.max(...rows.map((r) => r.so.sh));
    console.log(`  WELD GAP (perpendicular — the slit)  flight pose ${w0.toFixed(3)} u · worst over the whole fold arc ${wm.toFixed(3)} u   →  the FOLD adds ${(wm - w0).toFixed(3)} u`);
    console.log(`     ${ok(wm - w0 < 0.10)} the fold itself opens < 0.10 u   ${ok(wm < 0.45)} worst gap < 0.45 u = ${(100 * wm / g0.spanX).toFixed(1)}% of glide span`);
    console.log(`     worst SHEAR along a seam ${shm.toFixed(3)} u (edges stay on their own line — a notch at one end, not a slit)`);
    console.log(`     axis residuals (max weld vertex ↔ its fitted axis): elbow ${seam.elbow.residual.toFixed(3)} (${seam.elbow.n} pts) · wrist ${seam.wrist.residual.toFixed(3)} (${seam.wrist.n}) · fan ${seam.fan.residual.toFixed(3)} (${seam.fan.n})`);
    console.log('     the flight-pose figure is INHERITED, not added: the wrist\'s two frames carried the same');
    console.log('     relative Euler at I3 (armwing on `arm`, handwing on `hand`); I4 moved that rotation\'s z');
    console.log('     component onto the carpal axis, which can only REDUCE it.');
  }
  // where the tip lands — §8.3 step 4 wants it at/behind the hip, low near the knee line
  poseAt(P, def, 1);
  model.group.updateWorldMatrix(true, true);
  const tipM = P.tipMarkerR;
  if (tipM) {
    const t = tipM.getWorldPosition(new THREE.Vector3());
    const hipZ = (model.parts.spinePoints && model.parts.spinePoints.length)
      ? model.parts.spinePoints[Math.min(model.parts.spinePoints.length - 1, Math.round(model.parts.spinePoints.length * 0.62))].z : null;
    const root = P.wingPivotR.getWorldPosition(new THREE.Vector3());
    console.log(`  TIP LANDS at (${f2(t.x)}, ${f2(t.y)}, ${f2(t.z)})   shoulder (${f2(root.x)}, ${f2(root.y)}, ${f2(root.z)})` +
      (hipZ != null ? `  hip z ≈ ${hipZ.toFixed(2)}` : ''));
    console.log(`     ${ok(t.z > root.z)} behind the shoulder (Δz ${(t.z - root.z).toFixed(2)})   ${ok(t.y < root.y)} below the shoulder line (Δy ${(t.y - root.y).toFixed(2)})   ${ok(Math.abs(t.x) < Math.abs(root.x) + 1.2)} drawn in against the flank`);
  }
  // L/R symmetry IN THE FOLD. `wingsymprobe` only walks the five CYCLE states, so no
  // posture pin on any dragon in this repo has ever been symmetry-checked. Compared per
  // mesh by mirrored CENTROID + mirrored AABB, never by vertex index: the fire overlay and
  // the cord-end tooth train are SEEDED (§7.4 makes L≠R weathering mandatory), so vertex i
  // on the left is not the mirror of vertex i on the right — an index-paired probe reports
  // a 1.06 u "asymmetry" on a rig that is exactly symmetric, which is precisely the
  // kill-#67 failure mode this file exists to refuse.
  if (seam) {
    const stat = (o) => { const p = o.geometry.attributes.position, c = new THREE.Vector3(), v2 = new THREE.Vector3();
      const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (let i = 0; i < p.count; i++) { v2.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); c.add(v2);
        for (let a = 0; a < 3; a++) { const q = v2.getComponent(a); if (q < lo[a]) lo[a] = q; if (q > hi[a]) hi[a] = q; } }
      c.divideScalar(p.count); return { c: [c.x, c.y, c.z], lo, hi }; };
    const meshes = (s) => { const out = []; P['wingPivot' + s].traverse((o) => { if (o.isMesh && o.geometry) out.push(o); }); return out; };
    const foldSym = (label) => {
      const R = meshes('R'), L = meshes('L');
      let worst = 0;
      for (let m = 0; m < Math.min(R.length, L.length); m++) {
        const a = stat(R[m]), b = stat(L[m]);
        worst = Math.max(worst, Math.abs(a.c[0] + b.c[0]), Math.abs(a.c[1] - b.c[1]), Math.abs(a.c[2] - b.c[2]),
          Math.abs(a.lo[0] + b.hi[0]), Math.abs(a.hi[0] + b.lo[0]), Math.abs(a.lo[1] - b.lo[1]), Math.abs(a.lo[2] - b.lo[2]));
      }
      // R6: "no probe may carry a tolerance looser than the spec's own number." §8.1's
      // fold-pose bound is 0.05; this used to read 0.06.
      console.log(`  ${label.padEnd(52)} ${worst.toFixed(4)} u   ${ok(worst < 0.05)}`);
      return worst;
    };
    // …and the ATTRIBUTION the R6 ruling makes a condition of the bound: which seeded
    // system each unit of the cloud comes from. Reported per MESH (one per system per
    // frame), and then proved by rebuilding the same wing with the weathering asymmetry
    // switched OFF — if the residue is the seed, seed-locking must take it to the rig's
    // own zero, and if it does not, the number was never weathering.
    const foldSymTable = () => {
      const R = meshes('R'), L = meshes('L');
      const rows = [];
      for (let m = 0; m < Math.min(R.length, L.length); m++) {
        const a = stat(R[m]), b = stat(L[m]);
        const w = Math.max(Math.abs(a.c[0] + b.c[0]), Math.abs(a.c[1] - b.c[1]), Math.abs(a.c[2] - b.c[2]),
          Math.abs(a.lo[0] + b.hi[0]), Math.abs(a.hi[0] + b.lo[0]), Math.abs(a.lo[1] - b.lo[1]), Math.abs(a.lo[2] - b.lo[2]));
        let chain = []; let x = R[m];
        while (x) { if (x.userData && x.userData.wingRole) chain.unshift(x.userData.wingRole); x = x.parent; }
        rows.push({ sys: `${(R[m].material.name || '?').replace('forge:', '')} on ${chain[chain.length - 1] || 'wing'}`, w,
          seeded: SEEDED[(R[m].material.name || '')] || '—' });
      }
      rows.sort((a, b) => b.w - a.w);
      console.log('     per-system attribution (§8.1 R6: the bound is only valid with this table)');
      console.log('       system                          worst L↔R   seeded by');
      for (const r of rows) console.log(`       ${r.sys.padEnd(30)} ${r.w.toFixed(4)} u   ${r.seeded}`);
    };
    const SEEDED = {
      'forge:crust': '§7.4 temper band edges + ash break-up (seedSide 97 / 0.4·1.1 phases)',
      'forge:mem': '§6.4 cord-end tooth train — pitch/height/drop (seedSide 211 / 307 / 401)',
      'forge:fire': '§7.1 secondary-slot variety (seedSide-phased)',
      'forge:ember': '§7.5 rod seed, rate, travel and axis (seedSide 137 / 211 / 53 / 83 / 179)',
    };
    poseAt(P, def, 1); model.group.updateWorldMatrix(true, true);
    // the RIG number first — joint nodes only, decoration-free, the way `wingsymprobe`
    // reports it. This one must be EXACTLY zero; the cloud number below it legitimately
    // carries the §7.4 seeded weathering the spec makes mandatory.
    let jw = 0;
    for (const k of ['wingPivot', 'wingMid', 'wingTip', 'wingFurl']) {
      const r = P[k + 'R'], l = P[k + 'L']; if (!r || !l) continue;
      const a = r.getWorldPosition(new THREE.Vector3()), b = l.getWorldPosition(new THREE.Vector3());
      jw = Math.max(jw, Math.hypot(a.x + b.x, a.y - b.y, a.z - b.z));
    }
    console.log(`  FOLD SYMMETRY  rig (joint nodes, decoration-free) ${jw.toFixed(4)} u   ${ok(jw < 0.001)} the posture mirrors exactly`);
    foldSym('   cloud (mirrored centroid + AABB, seeded weathering in)');
    foldSymTable();
    // …and its negative control: a per-side sign on ONE joint is the classic way a fold
    // desyncs (§8.1: a mirror AND a per-side sign both flip — use exactly one).
    if (P.wingFurlR) {
      P.wingFurlR.rotation.z += 0.25; model.group.updateWorldMatrix(true, true);
      foldSym('   control — +0.25 rad on the RIGHT furl only');
      P.wingFurlR.rotation.z -= 0.25; model.group.updateWorldMatrix(true, true);
    }
  }
  // §5.4 mitigation (3), made probe-assertable exactly as the spec asks: "in every flight
  // pose the furl array is identically zero, so the spread wing is ONE continuous skin to
  // the eye". A fan that creeps open during the beat is the Tempest shard-plate read.
  if (seam && P.wingFurlR) {
    let worst = 0;
    for (const st of ['glide', 'recovery', 'apex', 'downstroke', 'settle', 'bank']) {
      setFlapDebugPose(P, def.model, st);
      for (const n of [P.wingFurlR, P.wingFurlL]) if (n) worst = Math.max(worst, 2 * Math.acos(Math.min(1, Math.abs(n.quaternion.w))));
    }
    console.log(`  FURL AT REST  worst furl angle across all six flight poses ${worst.toFixed(5)} rad   ${ok(worst < 1e-6)} §5.4(3) the spread wing is one continuous skin`);
  }
  // §8.3 step 1 in the spec's own units: the elbow's included angle and where the wrist
  // ends up in span fractions ("the wrist pulls inboard to t ≈ 0.38").
  if (seam && P.wingMidR && P.wingTipR) {
    let dump = null; model.group.traverse((o) => { if (!dump && o.userData && o.userData.forgewingDump) dump = o.userData.forgewingDump; });
    if (!dump) return { ratio, glide: g0 };
    const at = (f) => { poseAt(P, def, f); model.group.updateWorldMatrix(true, true);
      const sP = new THREE.Vector3(...dump.landmarks.shoulder).applyMatrix4(frames.R.arm.matrixWorld);
      const eP = new THREE.Vector3(...dump.landmarks.elbow).applyMatrix4(frames.R.arm.matrixWorld);
      const kP = new THREE.Vector3(...dump.landmarks.wrist).applyMatrix4(frames.R.fore.matrixWorld);
      const a = sP.clone().sub(eP), b = kP.clone().sub(eP);
      return { inc: a.angleTo(b) * 180 / Math.PI, tK: (kP.x) / dump.hs }; };
    const o = at(0), c = at(1);
    console.log(`  ELBOW  included angle ${o.inc.toFixed(1)}° spread → ${c.inc.toFixed(1)}° folded   (§8.3 asks ~55°; §13 lists the folded set as DIRECTED)`);
    console.log(`  WRIST  pulls from t ${o.tK.toFixed(3)} → ${c.tK.toFixed(3)}   ${ok(c.tK < 0.42)} §8.3 step 1 target t ≈ 0.38`);
  }
  return { ratio, glide: g0 };
}

// ═══ 1b · THE SCALLOPS, ONE AT A TIME (kill #69) ════════════════════════════
// §8.3 step 3 and §2.5: the fan was CHOSEN over a single spar because a fan folds
// legibly — "the outline losing one scallop at a time, trailing-first, digit III over the
// stack last". Round 6 measured the opposite (one shared hinge, every scallop leaving in
// the same instant) and codified it as kill #69. This is that read, as a number.
//
// MEASURED ON GEOMETRY, not on pixels: each lobe's own vertices are tagged in the buffer
// (`wlLobe`), so the probe can take each bay's PROJECTED extent in the money camera's
// plane at every point of the arc and ask when it crosses half of its spread value. One
// scallop at a time means those crossings are ORDERED and SEPARATED — trailing lobe
// first. The negative control is the R6 build itself: drive the same three lobes off one
// shared window (`FOLD.doorWin`) and the crossings collapse onto each other.
function scallopReport(key, { def, model, P }) {
  if (!P.wingFurlLobes) return;
  console.log(`\n═══ ${key} — §8.3 step 3 THE FAN CLOSES AS A FAN (kill #69) ═══`);
  // Measured in the HAND's own frame, projected onto the spread fan's own plane (local
  // XZ). That removes the shoulder, elbow and wrist entirely — a fan that closes must
  // lose area against the plane it opened in, whatever the arm is doing. Measured in a
  // world camera instead, all three bays GROW 2.2× through the fold, because the arm rolls
  // the whole wing flat-on to that camera; that is the arm's motion, not the fan's.
  const handR = (() => { let h = null; P.wingPivotR.traverse((o) => { if (!h && o.userData && o.userData.wingRole === 'handFrame') h = o; }); return h; })();
  if (!handR) return;
  const lobeMeshes = [];
  P.wingPivotR.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.userData.wlLobe) lobeMeshes.push(o); });
  // The lobe's SILHOUETTE area in the camera plane, rasterised — not its bounding box.
  // A bounding box GROWS when a flat lobe rotates out of plane (√2 at 45°), so an
  // AABB-based "scallop" reads a closing fan as an opening one; the first version of this
  // check reported 1.85× at full fold on a bay that had visibly gone.
  const GN = 192;
  let gLo = null, gSc = 1;
  const _inv = new THREE.Matrix4(), _rel = new THREE.Matrix4();
  const relOf = (o) => { _inv.copy(handR.matrixWorld).invert(); return _rel.multiplyMatrices(_inv, o.matrixWorld); };
  const project = (v) => [v.x, v.z];
  const rasterise = () => {
    const cov = [new Uint8Array(GN * GN), new Uint8Array(GN * GN), new Uint8Array(GN * GN)];
    const v = new THREE.Vector3();
    for (const o of lobeMeshes) {
      const pa = o.geometry.attributes.position, lb = o.geometry.userData.wlLobe;
      const rel = relOf(o).clone();
      for (let t = 0; t + 2 < pa.count; t += 3) {
        const L = lb[t]; const P2 = [];
        for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pa, t + k).applyMatrix4(rel);
          const q = project(v); P2.push([(q[0] - gLo[0]) * gSc, (q[1] - gLo[1]) * gSc]); }
        const x0 = Math.max(0, Math.floor(Math.min(P2[0][0], P2[1][0], P2[2][0])));
        const x1 = Math.min(GN - 1, Math.ceil(Math.max(P2[0][0], P2[1][0], P2[2][0])));
        const y0 = Math.max(0, Math.floor(Math.min(P2[0][1], P2[1][1], P2[2][1])));
        const y1 = Math.min(GN - 1, Math.ceil(Math.max(P2[0][1], P2[1][1], P2[2][1])));
        const d = (P2[1][1] - P2[2][1]) * (P2[0][0] - P2[2][0]) + (P2[2][0] - P2[1][0]) * (P2[0][1] - P2[2][1]);
        if (!isFinite(d) || Math.abs(d) < 1e-9) continue;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const px = x + 0.5, py = y + 0.5;
          const l0 = ((P2[1][1] - P2[2][1]) * (px - P2[2][0]) + (P2[2][0] - P2[1][0]) * (py - P2[2][1])) / d;
          const l1 = ((P2[2][1] - P2[0][1]) * (px - P2[2][0]) + (P2[0][0] - P2[2][0]) * (py - P2[2][1])) / d;
          if (l0 >= -1e-6 && l1 >= -1e-6 && l0 + l1 <= 1 + 1e-6) cov[L][y * GN + x] = 1;
        }
      }
    }
    // …and what each bay UNIQUELY owns. A scallop leaves the outline when its bay slides
    // UNDER its neighbour (§2.5's "overlapping lobes"), not when the bay turns edge-on —
    // at the end of a per-spar furl each lobe is flat again, stacked on the one inboard of
    // it, and a plain area measure reads that as "still there". What the outline actually
    // shows is the area no other lobe covers, so that is what is counted.
    return [0, 1, 2].map((L) => { let n2 = 0;
      for (let i = 0; i < cov[L].length; i++) if (cov[L][i] && !cov[(L + 1) % 3][i] && !cov[(L + 2) % 3][i]) n2++;
      return n2; });
  };
  const fitGrid = () => {
    let lo = [1e9, 1e9], hi = [-1e9, -1e9];
    const v = new THREE.Vector3();
    for (const o of lobeMeshes) { const pa = o.geometry.attributes.position; const rel = relOf(o).clone();
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(rel);
        const q = project(v);
        if (q[0] < lo[0]) lo[0] = q[0]; if (q[0] > hi[0]) hi[0] = q[0];
        if (q[1] < lo[1]) lo[1] = q[1]; if (q[1] > hi[1]) hi[1] = q[1]; } }
    const w = Math.max(hi[0] - lo[0], hi[1] - lo[1]) * 1.35 || 1;
    gLo = [(lo[0] + hi[0]) / 2 - w / 2, (lo[1] + hi[1]) / 2 - w / 2];
    gSc = GN / w;
  };
  const extent = () => rasterise();
  const run = (win, label) => {
    const ARC = [];
    for (let f = 0; f <= 1.0001; f += 0.05) ARC.push(+f.toFixed(2));
    const A0 = (() => { setFlapDebugPose(P, def.model, 'glide', 0, win); model.group.updateWorldMatrix(true, true);
      fitGrid(); return extent(); })();
    const half = [null, null, null];
    const rows = [];
    for (const f of ARC) {
      setFlapDebugPose(P, def.model, 'fold', f, win);
      model.group.updateWorldMatrix(true, true);
      const e = extent();
      const r = e.map((x, i) => x / (A0[i] || 1));
      rows.push({ f, r });
      for (let L = 0; L < 3; L++) if (half[L] == null && r[L] <= 0.5) half[L] = f;
    }
    console.log(`  ${label}`);
    console.log('    f       bay III–IV   bay IV–V   bay V–VI      (outline area the bay alone owns ÷ its spread value)');
    for (const row of rows) if (Math.round(row.f * 100) % 10 === 0)
      console.log(`    ${row.f.toFixed(2)}      ${row.r.map((x) => x.toFixed(2).padStart(8)).join('   ')}`);
    const h = half.map((x) => (x == null ? 'never' : x.toFixed(2)));
    console.log(`    half-gone at   bay V–VI ${h[2]}  ·  bay IV–V ${h[1]}  ·  bay III–IV ${h[0]}`);
    const ordered = half[2] != null && half[1] != null && half[0] != null
      && half[2] < half[1] - 1e-9 && half[1] < half[0] - 1e-9;
    const sep = ordered ? Math.min(half[1] - half[2], half[0] - half[1]) : 0;
    console.log(`    ${ok(ordered && sep >= 0.099)} trailing-first, one at a time (they must leave ≥ 0.10 of the arc apart)` +
      (ordered ? ` — smallest gap ${sep.toFixed(2)}` : ' — the scallops do NOT leave in order'));
    return { ordered, sep, half };
  };
  const live = run(null, 'THE SHIPPED FURL — three lobes, three windows, three axes:');
  const door = run(FOLD.doorWin, 'CONTROL — the ROUND-6 build: the same three lobes on ONE shared window (kill #69):');
  console.log(`  ${ok(!(door.ordered && door.sep >= 0.099))} the door-fold control FIRES` +
    ` (its three scallops leave within ${door.half[0] != null && door.half[2] != null ? (door.half[0] - door.half[2]).toFixed(2) : '—'} of the arc,` +
    ` against ${live.half[0] != null && live.half[2] != null ? (live.half[0] - live.half[2]).toFixed(2) : '—'} shipped)`);
  setFlapDebugPose(P, def.model, 'glide');
}

// ═══ 1c · THE FOUR ACTING SILHOUETTES (§8.3) ════════════════════════════════
// "Acting silhouettes reachable from the same array with zero new mechanics: tuck,
// cape-drape, display spread, mantle — plus ground contact through the CARPAL CLUSTER
// (the membrane never touches the ground)." All four are the fold's own six numbers at a
// different point of the same space, so the assertion is (a) each is a distinct
// silhouette, not a relabelled fold, and (b) in any pose that reaches the ground, the
// lowest point on the wing is BONE on the hand frame, never membrane.
function actingReport(key, { def, model, P }) {
  if (!P.wingSeamAxes) return;
  console.log(`\n═══ ${key} — §8.3 THE FOUR ACTING SILHOUETTES ═══`);
  const roleOf = (o) => { const c = []; let x = o; while (x) { if (x.userData && x.userData.wingRole) c.unshift(x.userData.wingRole); x = x.parent; } return c.join('/'); };
  const v = new THREE.Vector3();
  const stats = () => {
    model.group.updateWorldMatrix(true, true);
    let lo = 1e9, hi = -1e9, ylo = 1e9, yhi = -1e9, zlo = 1e9, zhi = -1e9, memLow = 1e9, boneLow = 1e9;
    for (const k of ['wingPivotL', 'wingPivotR']) { const n = P[k]; if (!n) continue;
      n.traverse((o) => { if (!o.isMesh || !o.geometry || (o.userData && o.userData.wlFX)) return;
        const pa = o.geometry.attributes.position;
        const mem = o.userData.wlSurface === 'membrane', hand = roleOf(o).includes('handFrame');
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
          if (v.x < lo) lo = v.x; if (v.x > hi) hi = v.x;
          if (v.y < ylo) ylo = v.y; if (v.y > yhi) yhi = v.y;
          if (v.z < zlo) zlo = v.z; if (v.z > zhi) zhi = v.z;
          if (mem && v.y < memLow) memLow = v.y;
          if (!mem && hand && v.y < boneLow) boneLow = v.y; } }); }
    return { span: hi - lo, rise: yhi - ylo, chord: zhi - zlo, memLow, boneLow };
  };
  setFlapDebugPose(P, def.model, 'glide'); const g = stats();
  console.log('  state      span÷glide   rise    chord    lowest MEMBRANE   lowest HAND BONE   ground contact');
  const seen = [];
  for (const st of ['fold', 'tuck', 'drape', 'display', 'mantle']) {
    setFlapDebugPose(P, def.model, st);
    const s = stats();
    const carpal = s.boneLow <= s.memLow + 1e-6;
    const grounded = st === 'mantle' || st === 'drape';
    console.log(`  ${st.padEnd(10)} ${(s.span / g.span).toFixed(3).padStart(8)} ${s.rise.toFixed(2).padStart(7)} ${s.chord.toFixed(2).padStart(8)}` +
      `        ${s.memLow.toFixed(2).padStart(7)}            ${s.boneLow.toFixed(2).padStart(7)}      ${grounded ? (carpal ? '✓ carpal cluster' : '✗ MEMBRANE ON THE GROUND') : '—'}`);
    seen.push({ st, k: `${(s.span / g.span).toFixed(2)}/${s.rise.toFixed(1)}/${s.chord.toFixed(1)}` });
  }
  // …and the POSTURE symmetry bound (§8.1 R6: postures get ≤0.05 *with attribution*, which
  // is why `wingsymprobe` is scoped to straight flight — the acting poses are checked HERE
  // or nowhere).
  const ms = (sd) => { const out = []; P['wingPivot' + sd].traverse((o) => { if (o.isMesh && o.geometry) out.push(o); }); return out; };
  const stt = (o) => { const p = o.geometry.attributes.position, c = new THREE.Vector3(), v2 = new THREE.Vector3();
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = 0; i < p.count; i++) { v2.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); c.add(v2);
      for (let a = 0; a < 3; a++) { const q = v2.getComponent(a); if (q < lo[a]) lo[a] = q; if (q > hi[a]) hi[a] = q; } }
    c.divideScalar(p.count); return { c: [c.x, c.y, c.z], lo, hi }; };
  for (const st of ['tuck', 'drape', 'display', 'mantle']) {
    setFlapDebugPose(P, def.model, st);
    model.group.updateWorldMatrix(true, true);
    let jw2 = 0;
    for (const k of ['wingPivot', 'wingMid', 'wingTip', 'wingFurl']) {
      const r = P[k + 'R'], l = P[k + 'L']; if (!r || !l) continue;
      const a = r.getWorldPosition(new THREE.Vector3()), b = l.getWorldPosition(new THREE.Vector3());
      jw2 = Math.max(jw2, Math.hypot(a.x + b.x, a.y - b.y, a.z - b.z));
    }
    const Rm = ms('R'), Lm = ms('L');
    let cw = 0;
    for (let m = 0; m < Math.min(Rm.length, Lm.length); m++) { const a = stt(Rm[m]), b = stt(Lm[m]);
      cw = Math.max(cw, Math.abs(a.c[0] + b.c[0]), Math.abs(a.c[1] - b.c[1]), Math.abs(a.c[2] - b.c[2]),
        Math.abs(a.lo[0] + b.hi[0]), Math.abs(a.hi[0] + b.lo[0]), Math.abs(a.lo[1] - b.lo[1]), Math.abs(a.lo[2] - b.lo[2])); }
    console.log(`  SYMMETRY ${st.padEnd(9)} rig ${jw2.toFixed(4)} u ${ok(jw2 < 0.001)}   ·   cloud ${cw.toFixed(4)} u ${ok(cw < 0.05)}   (posture bound ≤0.05, §8.1 R6)`);
  }
  const uniq = new Set(seen.map((x) => x.k));
  console.log(`  ${ok(uniq.size === seen.length)} all ${seen.length} are DISTINCT silhouettes (span/rise/chord triples, 2 s.f.) — not one fold relabelled`);
  setFlapDebugPose(P, def.model, 'glide');
}

// ═══ 2 · THE SKIRT, THROUGH THE ARC ═════════════════════════════════════════
// §5.1 (amended R2) made I4's obligations explicit: the folded wing drapes OVER the
// body-frame skirt, the ≥0.15 c overlap holds in the folded pose, zero interpenetration,
// and no bald flank at any point of the fold arc.
function skirtReport(key, { def, model, P, frames }) {
  let dump = null; model.group.traverse((o) => { if (!dump && o.userData && o.userData.forgewingDump) dump = o.userData.forgewingDump; });
  if (!dump || !dump.skirtOuter) return;
  console.log(`\n═══ ${key} — §5.1 THE CLOAK OVER THE SKIRT (through the whole arc) ═══`);
  // the skirt lives in the BODY frame; sample it once in world space
  let skirtMesh = null;
  model.group.traverse((o) => { if (o.isMesh && o.userData && o.userData.wlSurface === 'skirt' && !skirtMesh) skirtMesh = o; });
  if (!skirtMesh) { console.log('  (no skirt mesh found)'); return; }
  model.group.updateWorldMatrix(true, true);
  const sp = skirtMesh.geometry.attributes.position, v = new THREE.Vector3();
  const skirt = [];
  for (let i = 0; i < sp.count; i++) { v.fromBufferAttribute(sp, i).applyMatrix4(skirtMesh.matrixWorld); if (v.x > 0) skirt.push(v.clone()); }
  const shoulder = P.wingPivotR.getWorldPosition(new THREE.Vector3());
  const wingMem = [];
  P.wingPivotR.traverse((o) => { if (o.isMesh && o.userData && o.userData.wlSurface === 'membrane') wingMem.push(o); });
  console.log('  fold    skirt COVERED (wing membrane outboard of it, lateral view)   deepest lap   membrane THROUGH the skirt');
  const maxChord = 1.807 * (dump.hs / 6.2);
  for (const f of [0, 0.25, 0.5, 0.75, 1.0]) {
    poseAt(P, def, f);
    model.group.updateWorldMatrix(true, true);
    const pts = [];
    for (const o of wingMem) { const pa = o.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); pts.push([v.y, v.z, v.x]); } }
    // COVERED: the skirt point has wing membrane within one bay's reach in the lateral
    // (YZ) view AND that membrane is further OUT in x — draped over, not through.
    let covered = 0, deepest = 0;
    for (const sPt of skirt) {
      let hit = false, near = Infinity;
      for (const q of pts) { const d = (q[0] - sPt.y) ** 2 + (q[1] - sPt.z) ** 2;
        if (d < 0.1225) { near = Math.min(near, Math.sqrt(d)); if (q[2] >= sPt.x - 0.02) hit = true; } }
      if (hit) { covered++; deepest = Math.max(deepest, 0.35 - near); }
    }
    // THROUGH: membrane that sits INBOARD of the skirt it overlaps — interpenetration.
    // The ROOT GUSSET is excluded and must be: §9 anchors the sheet's inboard cusp ON the
    // pivot, which is inside the torso silhouette by construction and buried in the muscular
    // fairing. Counting it would score the design's own anchoring law as a defect.
    let through = 0, counted = 0;
    for (const q of pts) {
      if ((q[0] - shoulder.y) ** 2 + (q[1] - shoulder.z) ** 2 + (q[2] - shoulder.x) ** 2 < 0.81) continue;
      counted++;
      let bx = null, bd = Infinity;
      for (const sPt of skirt) { const d = (q[0] - sPt.y) ** 2 + (q[1] - sPt.z) ** 2; if (d < bd) { bd = d; bx = sPt.x; } }
      if (bd < 0.1225 && q[2] < bx - 0.05) through++;
    }
    console.log(`  f=${f.toFixed(2)}    ${String(covered).padStart(4)} / ${skirt.length}` +
      `                                        ${(deepest / maxChord).toFixed(3)} c` +
      `        ${(100 * through / counted).toFixed(2)}%  ${100 * through / counted < 0.5 ? '✓' : '✗'}`);
  }
  console.log('  (the SKIRT is body-frame and never rotates, so flank coverage is unconditional —');
  console.log('   these rows say whether the wing drapes OVER it rather than through it)');
}

// ═══ 3 · THE BEAT ═══════════════════════════════════════════════════════════
function beatReport(key, { def, model, P }) {
  console.log(`\n═══ ${key} — §8.1 THE BEAT (pure-math segment dump) ═══`);
  const m = def.model;
  const glidePow = m.glidePow ?? 1;
  const shape = (ph) => { const s = Math.sin(ph); return Math.sign(s) * Math.pow(Math.abs(s), glidePow); };
  const apexUp = (ph) => Math.pow(Math.max(0, -Math.sin(ph)), 0.7);
  const STATES = ['glide', 'recovery', 'apex', 'downstroke', 'settle'];
  console.log(`  dials  rootAmp ${m.rootAmp} · apexRoot ${m.apexRoot} · midAmp ${m.midAmp} · tipAmp ${m.tipAmp} · midLag ${m.midLag} · tipLag ${m.tipLag} · glidePow ${m.glidePow} · tipApexSweep ${m.tipApexSweep} · apexPitch ${m.apexPitch}`);
  console.log('  state        phase    shoulder     forearm      hand    |  hand−forearm   sweep');
  const rec = [];
  for (const st of STATES) {
    const ph = resolveWingDebug(st, m.flap).phase;
    const rootF = -(shape(ph) * (m.rootAmp ?? 0)) + (m.apexRoot ?? 0) * apexUp(ph) + (m.restLift ?? 0);
    const midF = -(shape(ph - (m.midLag ?? 0)) * (m.midAmp ?? 0)) + (m.apexMid ?? 0) * apexUp(ph - (m.midLag ?? 0));
    const tipF = -(shape(ph - (m.tipLag ?? 0)) * (m.tipAmp ?? 0)) + (m.apexTip ?? 0) * apexUp(ph - (m.tipLag ?? 0));
    const sweep = (m.tipApexSweep ?? 0) * apexUp(ph);
    rec.push({ st, ph, rootF, midF, tipF, sweep });
    console.log(`  ${st.padEnd(11)} ${ph.toFixed(2)}    ${f2(rootF)}       ${f2(midF)}      ${f2(tipF)}   |   ${f2(tipF - midF)}       ${sweep.toFixed(2)}`);
  }
  // LAW 2 is written about the SHOULDER's own reversal points — "at the 12 o'clock apex …
  // and at the 5 o'clock bottom" — not about the named freeze states, whose phases are
  // capture poses (the `apex` pin is the apex-V silhouette, which is not where the
  // shoulder reverses). Find the reversals numerically and read the hand there; the five
  // named states are printed above so a critic can see the whole curve either way.
  let hiP = 0, loP = 0, hi = -1e9, lo = 1e9;
  for (let i = 0; i < 720; i++) { const ph = i * Math.PI / 360;
    const v2 = -(shape(ph) * (m.rootAmp ?? 0)) + (m.apexRoot ?? 0) * apexUp(ph) + (m.restLift ?? 0);
    if (v2 > hi) { hi = v2; hiP = ph; } if (v2 < lo) { lo = v2; loP = ph; } }
  const dAt = (ph) => (-(shape(ph - (m.tipLag ?? 0)) * (m.tipAmp ?? 0)) + (m.apexTip ?? 0) * apexUp(ph - (m.tipLag ?? 0)))
    - (-(shape(ph - (m.midLag ?? 0)) * (m.midAmp ?? 0)) + (m.apexMid ?? 0) * apexUp(ph - (m.midLag ?? 0)));
  const dTop = dAt(hiP), dBot = dAt(loP);
  const flip = Math.sign(dTop) !== Math.sign(dBot);
  console.log(`  shoulder reverses at phase ${hiP.toFixed(2)} (top, ${hi.toFixed(2)}) and ${loP.toFixed(2)} (bottom, ${lo.toFixed(2)})`);
  console.log(`  ${ok(flip)} LAW 2 — the hand's sign FLIPS against the forearm between top (${f2(dTop)}) and bottom (${f2(dBot)}): the wing CURLS, it does not tilt`);
  const distal = Math.abs(m.tipAmp ?? 0) < Math.abs(m.rootAmp ?? 0);
  const arc = (m.rootAmp ?? 0) + (m.apexRoot ?? 0);
  const share = arc / (arc + Math.abs(m.midAmp ?? 0) + Math.abs(m.tipAmp ?? 0));
  console.log(`  shoulder owns ${(100 * share).toFixed(0)}% of the summed segment amplitude  ${ok(distal)} distal never out-runs the shoulder's own arc (§8.1)`);
  console.log(`  ${ok((m.tipApexSweep ?? 0) >= 0.26)} LAW 3 — in-plane apex sweep ${(m.tipApexSweep ?? 0).toFixed(2)} rad at recovery (the depth-projection fix; the fold must live in the silhouette the chase camera sees)`);
  return rec;
}

// ═══ 4 · THE SURFACE ════════════════════════════════════════════════════════
function surfaceReport(key, { def, model, P }) {
  console.log(`\n═══ ${key} — §8.2 THE SURFACE THROUGH THE BEAT ═══`);
  let mem = null;
  model.group.traverse((o) => { if (!mem && o.isMesh && o.userData && o.userData.wlSurface === 'membrane') mem = o.material; });
  if (!mem || !mem.userData.surfaceUniforms || !mem.userData.surfaceUniforms.uMemSlack) { console.log('  (no slack-driven membrane on this wing)'); return; }
  const U = mem.userData.surfaceUniforms;
  console.log('  state         phase    slack    wrinkle amp    ripple amp    roughness');
  const seen = [];
  for (const st of ['glide', 'recovery', 'apex', 'downstroke', 'settle']) {
    setFlapDebugPose(P, def.model, st);
    const ph = resolveWingDebug(st, def.model.flap).phase;
    const sl = U.uMemSlack.value, wr = U.uMemWrinkleAmp.value * sl, rp = U.uMemRipple ? U.uMemRipple.value : 0;
    const rough = mem.roughness * (1 - (U.uMemSlackRough ? U.uMemSlackRough.value : 0) * (0.5 - sl));
    seen.push({ st, sl, wr, rp });
    console.log(`  ${st.padEnd(12)} ${ph.toFixed(2)}    ${sl.toFixed(3)}     ${wr.toFixed(4)}        ${rp.toFixed(4)}        ${rough.toFixed(3)}`);
  }
  const top = seen.find((s) => s.st === 'apex'), bot = seen.find((s) => s.st === 'downstroke');
  const ratio = (top.wr + 1e-6) / (bot.wr + 1e-6);
  console.log(`  wrinkle amplitude  top-of-upstroke ${top.wr.toFixed(4)} vs bottom-of-downstroke ${bot.wr.toFixed(4)}  →  ${ratio.toFixed(2)}×`);
  console.log(`  ${ok(ratio >= 2 || ratio <= 0.5)} R3's teeth — the surface is NOT the same at both stroke extremes (kill #29)`);
  const rp = seen.map((s) => s.rp);
  console.log(`  ${ok(Math.max(...rp) - Math.min(...rp) > 0.05)} ripple varies through the beat (kill #56: a beat-constant ripple is shader shimmer)`);
}

// ═══ 5 · NEGATIVE CONTROLS (kill #67) ═══════════════════════════════════════
// Every probe above is re-run in a configuration where it MUST fail. A checker that has
// only ever passed is not a checker.
async function controls(main) {
  console.log('\n═══ NEGATIVE CONTROLS — every probe fired on a known-bad (kill #67) ═══');
  // (a) the fold-ratio probe against the three shipped heroes. If it reports our number for
  //     everything it is measuring the harness, not the wing. Published: 0.838 / 0.932 / 0.986.
  console.log('\n  (a) FOLD-RATIO probe vs the shipped roster — it must reproduce the known non-folds:');
  for (const k of ['vesper', 'revenant', 'tempest']) {
    const B = build(k);
    setFlapDebugPose(B.P, B.def.model, 'glide');
    B.model.group.updateWorldMatrix(true, true);
    const g = wingExtent(B.P);
    setFlapDebugPose(B.P, B.def.model, 'fold');
    B.model.group.updateWorldMatrix(true, true);
    const f = wingExtent(B.P);
    const r = f.spanX / g.spanX;
    console.log(`      ${k.padEnd(10)} fold ÷ glide = ${r.toFixed(3)}   ${ok(r > 0.55)} FIRES (this wing does not fold — as published)`);
  }
  // (b) the seam-opening probe with a deliberately WRONG axis. The wrist is re-posed about
  //     pure +Y (an "in-plane" fold, which is what §8.3's prose literally asks for and what
  //     the weld cannot survive) instead of about the carpal line.
  console.log('\n  (b) SEAM-OPENING probe with the wrist driven about +Y instead of its own weld line:');
  {
    const B = build(main);
    const seam = B.P.wingSeamAxes;
    if (seam) {
      const good = (() => { poseAt(B.P, B.def, 1); B.model.group.updateWorldMatrix(true, true); return seamOpen(seam, B.frames, 'wrist').gap; })();
      const saved = seam.wrist.dir.slice();
      seam.wrist.dir = [0, 1, 0];
      poseAt(B.P, B.def, 1); B.model.group.updateWorldMatrix(true, true);
      const bad = seamOpen(seam, B.frames, 'wrist').gap;
      seam.wrist.dir = saved;
      console.log(`      seam axis = the carpal weld  → gap ${good.toFixed(3)} u   ${ok(good < 0.45)} CLEARS`);
      console.log(`      seam axis = +Y (in-plane)    → gap ${bad.toFixed(3)} u   ${ok(bad > 0.5)} FIRES  (${(bad / Math.max(good, 1e-3)).toFixed(1)}× worse — this is the tear the seam law removes)`);
    }
  }
  // (c) the sign-flip probe with the lag removed. tipLag 0 = three segments arriving at the
  //     reversal together = FLAP-DESIGN's rigid blade. The probe must stop passing.
  // The known-bad has to be a RIGID outer wing, not merely an unlagged one: with zero lag
  // but different amplitudes the hand and forearm still move by different amounts, so their
  // difference still changes sign and the test passes on a plank. The wing that genuinely
  // cannot curl is the one whose hand carries the forearm's own angle — equal amplitude,
  // equal lag — and there the difference is identically zero. (First version of this control
  // used lag = 0 alone and did NOT fire; the metric, not the wing, was flipping.)
  console.log('\n  (c) SIGN-FLIP probe with the hand welded to the forearm (equal amp, equal lag — the plank):');
  {
    const B = build(main);
    const m = { ...B.def.model, tipLag: B.def.model.midLag, midLag: B.def.model.midLag,
      tipAmp: B.def.model.midAmp, apexTip: B.def.model.apexMid };
    const glidePow = m.glidePow ?? 1;
    const shape = (ph) => { const s = Math.sin(ph); return Math.sign(s) * Math.pow(Math.abs(s), glidePow); };
    const apexUp = (ph) => Math.pow(Math.max(0, -Math.sin(ph)), 0.7);
    const dAt = (ph) => (-(shape(ph - m.tipLag) * m.tipAmp) + m.apexTip * apexUp(ph - m.tipLag))
      - (-(shape(ph - m.midLag) * m.midAmp) + m.apexMid * apexUp(ph - m.midLag));
    let hiP = 0, loP = 0, hi = -1e9, lo = 1e9;
    for (let i = 0; i < 720; i++) { const ph = i * Math.PI / 360;
      const v2 = -(shape(ph) * m.rootAmp) + (m.apexRoot ?? 0) * apexUp(ph) + (m.restLift ?? 0);
      if (v2 > hi) { hi = v2; hiP = ph; } if (v2 < lo) { lo = v2; loP = ph; } }
    const flip = Math.sign(dAt(hiP)) !== Math.sign(dAt(loP));
    console.log(`      hand−forearm: top ${f2(dAt(hiP))} · bottom ${f2(dAt(loP))}   ${ok(!flip)} FIRES (no flip — a blade that tilts)`);
  }
  // (c2) THE FOLD-POSE CLOUD, ATTRIBUTED. The R6 ruling: the ≤0.05 fold bound is valid
  //      only with a per-system attribution. The table prints beside the number above;
  //      this is its proof — rebuild the identical rig with `wingSeedLock` (both wings on
  //      seed 0, i.e. §7.4's mandatory weathering asymmetry switched off) and the cloud
  //      must collapse to the rig's own zero. If it does not, the residue was never
  //      weathering and the bound is covering a real asymmetry.
  console.log('\n  (c2) FOLD-POSE CLOUD attribution — the same wing rebuilt with the seeded weathering OFF:');
  {
    const D2 = ascendedDef(DRAGONS[main], maxTierFor(main), 0);
    D2.model = { ...D2.model, wingSeedLock: true };
    const M2 = buildDragonModel(D2);
    const P2 = M2.parts;
    setFlapDebugPose(P2, D2.model, 'fold');
    M2.group.updateWorldMatrix(true, true);
    const st2 = (o) => { const p = o.geometry.attributes.position, c = new THREE.Vector3(), v2 = new THREE.Vector3();
      const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (let i = 0; i < p.count; i++) { v2.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); c.add(v2);
        for (let a = 0; a < 3; a++) { const q = v2.getComponent(a); if (q < lo[a]) lo[a] = q; if (q > hi[a]) hi[a] = q; } }
      c.divideScalar(p.count); return { c: [c.x, c.y, c.z], lo, hi }; };
    const ms = (sd) => { const out = []; P2['wingPivot' + sd].traverse((o) => { if (o.isMesh && o.geometry) out.push(o); }); return out; };
    const Rm = ms('R'), Lm = ms('L');
    let worst = 0;
    for (let m = 0; m < Math.min(Rm.length, Lm.length); m++) { const a = st2(Rm[m]), b = st2(Lm[m]);
      worst = Math.max(worst, Math.abs(a.c[0] + b.c[0]), Math.abs(a.c[1] - b.c[1]), Math.abs(a.c[2] - b.c[2]),
        Math.abs(a.lo[0] + b.hi[0]), Math.abs(a.hi[0] + b.lo[0]), Math.abs(a.lo[1] - b.lo[1]), Math.abs(a.lo[2] - b.lo[2])); }
    console.log(`      seed-locked fold cloud ${worst.toFixed(4)} u   ${ok(worst < 0.001)} the whole residue IS the §7.4 weathering (the rig's own number is zero)`);
  }
  // (d) the slack probe with the binding cut. This is the exact defect R3 held open (#29's
  //     binding half): identical wrinkles at both extremes.
  console.log('\n  (d) SLACK probe with the §8.2 binding cut (uMemSlack pinned, as it shipped at I2/I3):');
  {
    const B = build(main);
    let mem = null;
    B.model.group.traverse((o) => { if (!mem && o.isMesh && o.userData && o.userData.wlSurface === 'membrane') mem = o.material; });
    const U = mem && mem.userData.surfaceUniforms;
    if (U && U.uMemSlack) {
      const drive = B.P.wingSurface;
      B.P.wingSurface = null;                      // cut the binding
      U.uMemSlack.value = 0.55;
      const rd = [];
      for (const st of ['apex', 'downstroke']) { setFlapDebugPose(B.P, B.def.model, st); rd.push(U.uMemSlack.value); }
      B.P.wingSurface = drive;
      console.log(`      slack at top ${rd[0].toFixed(3)} · at bottom ${rd[1].toFixed(3)}  →  ${(rd[0] / rd[1]).toFixed(2)}×   ${ok(Math.abs(rd[0] / rd[1] - 1) < 0.02)} FIRES (a printed decal: the same surface at both extremes)`);
    }
  }
}

// ── run ──────────────────────────────────────────────────────────────────────
const B = build(MAIN);
foldReport(MAIN, B);
scallopReport(MAIN, B);
actingReport(MAIN, B);
skirtReport(MAIN, B);
beatReport(MAIN, B);
surfaceReport(MAIN, B);
await controls(MAIN);
console.log('');
