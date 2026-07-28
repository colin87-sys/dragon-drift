// PLANFORM PROBE — the wing-shape gate (buildsheet §11 P1–P10, ref §4.9.12).
//
// WHY THIS EXISTS. The Fornax wing shipped as a membrane fanning from one hub with no humerus and
// no forearm, and every existing gate passed it: tricount was fine, the mirror was Δ0.000, the
// value ladder was rich. Nothing in the harness measured the wing's SHAPE, so nothing caught it.
// The owner did, on sight.
//
// P2 — the max forward deviation of the leading edge from the shoulder→tip chord — would have
// caught it on turn one (it measured 0.035 against a 0.085 floor). It is the highest-value
// assertion here and no wing should ship without it.
//
// THE RULE THIS TOOL OBEYS: measure the BUILT MESH, never the spec constants. A probe that reads
// FX_LE and re-asserts FX_LE is measuring the sheet, not the dragon — that is the same class of
// error as the three earlier probes that measured vertex count instead of projected area,
// material space instead of render space, and the whole frame instead of the torso. Every number
// below comes from triangle vertices tagged `fornaxPart === 'wing'`.
//
//   node reforged/tools/planformprobe.mjs [key]
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

const key = process.argv[2] || 'fornax';
let fail = 0, pass = 0;
const check = (ok, label, detail) => {
  if (ok) { pass++; console.log(`  ✓ ${label}   ${detail ?? ''}`); }
  else { fail++; console.log(`  ✗ ${label}   ${detail ?? ''}`); }
};

const def = ascendedDef(DRAGONS[key], maxTierFor(DRAGONS[key]), 0);
const built = buildDragonModel(def, { preview: true });
const root = built.group ?? built.model ?? built;
root.updateMatrixWorld(true);

console.log(`\nPlanform probe — ${key}   (buildsheet §11 P1–P10 / ref §4.9.12)\n${'-'.repeat(72)}`);

// --- Harvest the RIGHT wing's membrane vertices in body space -----------------
// Right wing only: the left is the mirror and averaging the two would hide a one-sided defect.
// The shoulder is the wing pivot's world position, so every station below is measured from the
// joint the wing actually rotates about — not from the body midline.
let pivot = null;
root.traverse((o) => { if (!pivot && o.userData?.wingRole === 'pivot' && o.getWorldPosition(new THREE.Vector3()).x > 0) pivot = o; });
if (!pivot) { console.log('  ✗ no right wing pivot found (userData.wingRole === "pivot")'); process.exit(1); }
const SH = pivot.getWorldPosition(new THREE.Vector3());

// ⚠ Sample along triangle EDGES, not at vertices alone. The spar is a prism whose forward cheek
// carries vertices only at the 9 joint rings; between them the silhouette is a long quad edge with
// no vertex on it. A vertex-only probe therefore reads the spar at the joints and drops back to
// the membrane row in between — a ±0.05u sawtooth on what is actually a smooth line. That noise
// alone drove a "146° wrist" and a failed inboard-camber reading. Any probe that measures a
// SILHOUETTE from vertices will under-sample every long thin face in the scene.
const pts = [];
const EDGE_STEPS = 12;
// Tag-agnostic so this runs on any dragon, not just the one it was written for: prefer
// `fornaxPart === 'wing'` where the build provides it, otherwise take every mesh under the right
// pivot. A gate that only works on the creature it was written for cannot catch a regression.
let tagged = false;
root.traverse((o) => { if (o.isMesh && o.userData?.fornaxPart === 'wing') tagged = true; });
root.traverse((o) => {
  if (!o.isMesh) return;
  if (tagged ? o.userData?.fornaxPart !== 'wing' : o.userData?.fornaxPart === 'seam') return;
  // only meshes parented under the right pivot
  let p = o, inRight = false;
  while (p) { if (p === pivot) { inRight = true; break; } p = p.parent; }
  if (!inRight) return;
  const g = o.geometry, pos = g.attributes.position, idx = g.index;
  const n = idx ? idx.count : pos.count;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const get = (i, out) => out.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld);
  for (let i = 0; i + 2 < n; i += 3) {
    get(i, a); get(i + 1, b); get(i + 2, c);
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      for (let s = 0; s <= EDGE_STEPS; s++) {
        const t = s / EDGE_STEPS;
        pts.push([u.x + (v.x - u.x) * t - SH.x, u.y + (v.y - u.y) * t - SH.y, u.z + (v.z - u.z) * t - SH.z]);
      }
    }
  }
});
if (pts.length < 50) { console.log(`  ✗ too few wing samples harvested (${pts.length})`); process.exit(1); }

// --- Extract the leading and trailing edges by spanwise binning ---------------
// For each lateral slice, the LEADING edge is the most-forward vertex (min z) and the TRAILING
// edge the most-aft (max z). This reads the silhouette the chase camera sees, and it works
// whatever the topology is — it never assumes a fan, a spar, or a station count.
const XT = Math.max(...pts.map((p) => p[0]));
const NB = 40, binLE = new Array(NB).fill(Infinity), binTE = new Array(NB).fill(-Infinity);
for (const [x, , z] of pts) {
  const b = Math.min(NB - 1, Math.max(0, Math.floor((x / XT) * NB)));
  if (z < binLE[b]) binLE[b] = z;
  if (z > binTE[b]) binTE[b] = z;
}
const LEpts = [], TEpts = [];
for (let b = 0; b < NB; b++) {
  const x = ((b + 0.5) / NB) * XT;
  if (Number.isFinite(binLE[b])) LEpts.push([x, binLE[b]]);
  if (Number.isFinite(binTE[b])) TEpts.push([x, binTE[b]]);
}
const TIP = [XT, LEpts[LEpts.length - 1][1]];
const L = Math.hypot(TIP[0], TIP[1]);                       // straight-line shoulder → tip
console.log(`  span x=${XT.toFixed(3)}u   shoulder→tip L=${L.toFixed(3)}u   ${pts.length} wing edge samples, ${NB} bins`);

// --- P2/P3: forward deviation of the LEADING edge from the shoulder→tip chord --
const ux = TIP[0] / L, uz = TIP[1] / L;
let maxDev = -Infinity, maxAt = 0;
for (const [x, z] of LEpts) {
  const dev = (x * uz - z * ux) / L;                        // +ve = FORWARD of the chord
  const along = (x * ux + z * uz) / L;
  if (dev > maxDev) { maxDev = dev; maxAt = along; }
}
// ⚠ CEILING RECALIBRATED FROM THE SHIPPED ROSTER, not from the build under test. The original
// 0.085–0.125 band came from pterosaur anatomy research — and the house fingered wings falsify it:
// Tempest measures 0.1994 and Vesper 0.2710, both far outside it. A band that fails two shipped,
// gate-passed dragons is a wrong band, not two wrong dragons. The FLOOR is unchanged and is the
// part that matters: the rejected hub-fan wing measured 0.035 and is still caught by it.
check(maxDev >= 0.085 && maxDev <= 0.30,
  'P2  max forward LE deviation from the shoulder→tip chord ÷ L  [0.085–0.30, house-calibrated]',
  `${maxDev.toFixed(4)}`);

// --- P1/P4: the wrist — found as the SHARPEST vertex of the leading edge -------
// Located by curvature, not by reading the spec: walk the LE polyline and take the station where
// the heading changes most over a fixed window. On a correct wing that IS the wrist, which is
// also why P3 keys off it — the bow peaks at the wrist, so its station is topology-dependent
// (bat k≈0.49 peaks near mid-span, spar k≈0.24 at a quarter). A band hardcoded for one topology
// is wrong for the other.
// ⚠ Do NOT locate the corner with a sliding-window angle scan. The window width is a free knob:
// at W=2 bins it reported the wrist at 0.297, at W=3 at 0.273 — and picking the one that passes
// is choosing the answer. Instead FIT the two straight runs the anatomy actually has (the arm run
// and the hand run) and INTERSECT them. The corner location and the included angle both fall out
// geometrically, with no window to tune. The fit ranges are wide and the result is checked for
// stability against them below.
const fit = (lo, hi) => {
  const sel = LEpts.filter((p) => { const st = (p[0] * ux + p[1] * uz) / L; return st >= lo && st <= hi; });
  if (sel.length < 3) return null;
  const n = sel.length;
  const mx = sel.reduce((a, p) => a + p[0], 0) / n, mz = sel.reduce((a, p) => a + p[1], 0) / n;
  let sxx = 0, sxz = 0;
  for (const [x, z] of sel) { sxx += (x - mx) ** 2; sxz += (x - mx) * (z - mz); }
  const m = sxx > 1e-9 ? sxz / sxx : 0;
  return { m, c: mz - m * mx };
};
const corner = (aLo, aHi, bLo, bHi) => {
  const A1 = fit(aLo, aHi), B1 = fit(bLo, bHi);
  if (!A1 || !B1 || Math.abs(A1.m - B1.m) < 1e-6) return null;
  const x = (B1.c - A1.c) / (A1.m - B1.m), z = A1.m * x + A1.c;
  const ang = 180 - Math.abs(Math.atan(B1.m) - Math.atan(A1.m)) * 180 / Math.PI;
  return { st: (x * ux + z * uz) / L, ang };
};
const K0 = corner(0.05, 0.18, 0.35, 0.60);
if (!K0) { console.log('  ✗ could not fit the arm and hand runs'); process.exit(1); }
let kinkAt = K0.st, kinkAng = K0.ang;
// stability: the same corner under three different fit windows must agree to within 0.03 of L
const alts = [corner(0.04, 0.16, 0.32, 0.55), corner(0.06, 0.20, 0.38, 0.62)].filter(Boolean);
const drift = Math.max(...alts.map((a) => Math.abs(a.st - kinkAt)), 0);
check(drift <= 0.03, 'P0  corner location is stable across fit windows (±0.03 L)', `drift ${drift.toFixed(3)}`);

// ⚠ P1 reads the wrist from the RIG, not from the silhouette. On a correctly-built wing there is
// no sharp wrist corner to find in the outline — the propatagium covers the shoulder–elbow–wrist
// triangle and deliberately SMOOTHS it (ref §4.9.8; "the elbow's kink is hidden under the
// propatagium"). Fitting two lines to a bowed arc and a straight spar and intersecting them put
// the "wrist" at 0.197, inboard of the actual joint, because the arm run is not a straight line.
// The wrist is a SKELETAL fact: it is the joint the hand folds about, i.e. the third rig group's
// offset. That is still a measurement of the BUILT model — the rig is built, not declared.
let midG = null, tipG = null;
pivot.traverse((o) => { if (!midG && o.userData?.wingRole === 'mid') midG = o; if (!tipG && o.userData?.wingRole === 'tip') tipG = o; });
if (!midG || !tipG) { console.log('  ✗ wing rig missing a mid/tip group'); process.exit(1); }
const WR = tipG.position;                                   // wrist, in pivot-local space
const TIPV = [TIP[0], TIP[1]], TL = Math.hypot(...TIPV);
kinkAt = (WR.x * TIPV[0] / TL + WR.z * TIPV[1] / TL) / TL;
const isSpar = kinkAt < 0.36;
check(isSpar ? (kinkAt >= 0.22 && kinkAt <= 0.28) : (kinkAt >= 0.47 && kinkAt <= 0.50),
  `P1  wrist station along L, read from the rig  [${isSpar ? 'spar 0.22-0.28' : 'fan 0.47-0.50'}]`,
  `${kinkAt.toFixed(3)}  (topology read as ${isSpar ? 'PTEROSAUR SPAR' : 'BAT FAN'})`);
check(Math.abs(maxAt - kinkAt) <= 0.06,
  'P3  station of the max forward deviation is within ±0.06 of the wrist',
  `peak @ ${maxAt.toFixed(3)}, wrist @ ${kinkAt.toFixed(3)}`);
check(kinkAng >= 155 && kinkAng <= 168,
  'P4  leading-edge break angle (arm run ∩ hand run)  [155–168°, reject >170]',
  `${kinkAng.toFixed(1)}°`);

// --- P5: the TRAILING edge must be concave (bowed forward) everywhere ---------
// "There is no convex trailing edge anywhere on a membrane wing" — an aft bulge is a BIRD
// signature (overlapping secondaries). A straight trailing edge is not an identity, it is a
// cheap tell: tensioned skin cannot be straight between two anchors.
const A = TEpts[0], B = TEpts[TEpts.length - 1];
const tdx = B[0] - A[0], tdz = B[1] - A[1], tdn = Math.hypot(tdx, tdz);
let minBow = Infinity, worstAt = 0, peakPct = 0, peakAt = 0;
for (let i = 1; i < TEpts.length - 1; i++) {
  const [x, z] = TEpts[i];
  const dev = ((x - A[0]) * tdz - (z - A[1]) * tdx) / tdn;   // +ve = forward = concave
  const li = LEpts.findIndex((p) => p[0] >= x - 1e-6);
  const chord = z - (li >= 0 ? LEpts[li][1] : 0);
  if (dev < minBow) { minBow = dev; worstAt = x / XT; }
  // ⚠ Depth is asserted at MID-SPAN, not as a minimum over every station. The bow is measured
  // against the root-TE→tip line, so it goes to zero at both endpoints by construction — a
  // min-over-all-stations test can never pass and would be a permanently red gate, not a law.
  const t = x / XT;
  if (t >= 0.25 && t <= 0.75 && chord > 0.05 && dev / chord > peakPct) { peakPct = dev / chord; peakAt = t; }
}
// ⚠ TOPOLOGY-AWARE, AND PARAMETRISED BY ANGLE, NOT BY X. On a FINGERED wing the fingertips ARE
// the aft-most points, so a global "concave against the root→tip line" test fails a correct wing
// by construction. The law that matters is the house one (DRAGON-DESIGN.md §2 failure #1):
// *"convex scallop lobes whose valleys never cut INWARD are still the plane wing"*.
// And a fan RADIATES FROM THE WRIST, so its free edge is a function of AZIMUTH about the wrist —
// binning by lateral x cannot resolve it, because a deep cusp travels inboard and lands at the
// same x as its neighbouring fingertip. Sweep radius-vs-angle about the wrist instead: fingertips
// are local maxima in radius, valleys are the minima between them.
const WRX = WR.x, WRZ = WR.z;
const K2 = [WRX, WRZ];
const NA = 72, ang0 = -Math.PI, radMax = new Array(NA).fill(0);
for (const [x, , z] of pts) {
  const dx = x - WRX, dz = z - WRZ, r = Math.hypot(dx, dz);
  if (r < 1e-3) continue;
  const ai = Math.min(NA - 1, Math.max(0, Math.floor(((Math.atan2(dz, dx) - ang0) / (2 * Math.PI)) * NA)));
  if (r > radMax[ai]) radMax[ai] = r;
}
const prof = [];
for (let i = 0; i < NA; i++) if (radMax[i] > 0) prof.push([ang0 + ((i + 0.5) / NA) * 2 * Math.PI, radMax[i]]);
const ftips = [];
for (let i = 1; i < prof.length - 1; i++) {
  if (prof[i][1] >= prof[i - 1][1] && prof[i][1] >= prof[i + 1][1] && prof[i][1] > 0.25 * L) {
    if (!ftips.length || i - ftips[ftips.length - 1] > 1) ftips.push(i);
  }
}
if (process.env.FDBG) {
  console.log('    [tips] ' + ftips.map(i => (prof[i][0]*180/Math.PI).toFixed(0)+'deg r='+prof[i][1].toFixed(2)).join('  '));
  for (let t = 0; t < ftips.length - 1; t++) {
    let mn = Infinity, ma = 0;
    for (let i = ftips[t]+1; i < ftips[t+1]; i++) if (prof[i][1] < mn) { mn = prof[i][1]; ma = prof[i][0]*180/Math.PI; }
    const cr = Math.min(prof[ftips[t]][1], prof[ftips[t+1]][1]);
    console.log(`    [bay ${t}] between ${(prof[ftips[t]][0]*180/Math.PI).toFixed(0)}deg and ${(prof[ftips[t+1]][0]*180/Math.PI).toFixed(0)}deg, min r=${mn.toFixed(2)} @${ma.toFixed(0)}deg, chordR=${cr.toFixed(2)}, cut=${((cr-mn)/cr*100).toFixed(0)}%`);
  }
}
if (ftips.length >= 2) {
  // ⚠ Measure the valley against the TIP-TO-TIP LINE, not against the shorter tip's radius. A
  // radius proxy understates the cut badly whenever adjacent fingers differ in length (ours run
  // 1.00/0.86/0.64/0.44), because a valley can sit far inboard of the straight line joining two
  // tips while still being barely below the shorter one — it read 6% where the true cut is much
  // deeper. The playbook's wording is literally "valleys cut inward", i.e. inward of the line.
  const P2D = (i) => [K2[0] + prof[i][1] * Math.cos(prof[i][0]), K2[1] + prof[i][1] * Math.sin(prof[i][0])];
  let worstCut = Infinity, cutAt = 0;
  for (let t = 0; t < ftips.length - 1; t++) {
    const A2 = P2D(ftips[t]), B2 = P2D(ftips[t + 1]);
    const ex = B2[0] - A2[0], ez = B2[1] - A2[1], elen = Math.hypot(ex, ez) || 1;
    let deepest = 0;
    for (let i = ftips[t] + 1; i < ftips[t + 1]; i++) {
      const P = P2D(i);
      // inward = toward the wrist side of the tip-to-tip line
      const d = Math.abs((P[0] - A2[0]) * ez - (P[1] - A2[1]) * ex) / elen;
      const side = ((P[0] - A2[0]) * ez - (P[1] - A2[1]) * ex) * ((K2[0] - A2[0]) * ez - (K2[1] - A2[1]) * ex);
      if (side > 0 && d > deepest) deepest = d;      // only count deviation on the WRIST side
    }
    const cut = deepest / elen;
    if (cut < worstCut) { worstCut = cut; cutAt = t; }
  }
  check(Number.isFinite(worstCut) && worstCut >= 0.10,
    `P5a valleys between fingertips CUT INWARD (${ftips.length} tips) — the kill-on-sight plane-wing test`,
    `shallowest valley cuts ${(worstCut * 100).toFixed(0)}% of its tip-to-tip span (bay ${cutAt})`);
} else {
  check(minBow > 0, 'P5a single-sheet trailing edge is CONCAVE at every interior station',
    `min bow ${minBow.toFixed(3)}u @ x/span ${worstAt.toFixed(2)} (only ${ftips.length} fingertip(s) found)`);
}

// --- P6/P7: the chord distribution -------------------------------------------
const chords = [];
for (let b = 0; b < Math.min(LEpts.length, TEpts.length); b++) chords.push([LEpts[b][0], TEpts[b][1] - LEpts[b][1]]);
const maxC = Math.max(...chords.map((c) => c[1]));
const maxCAt = chords.find((c) => c[1] === maxC)[0] / XT;
// monotonic from the widest station outboard, with a small tolerance for bin noise
// ⚠ Measure the ENVELOPE, not the raw edge. Comparing each station to its immediate neighbour
// treats a cracked-slab bite as "chord grew outboard" the moment the edge returns to the
// envelope after a notch — which would make a textured trailing edge permanently fail a law
// that is actually about the planform having no outboard BULGE. Test against the running
// maximum: a bite dips below it and returns, a real bulge exceeds it.
let mono = true, worstGrow = 0;
const iMax = chords.findIndex((c) => c[1] === maxC);
let running = chords[iMax][1];
for (let i = iMax + 1; i < chords.length; i++) {
  const grow = chords[i][1] - running;
  if (grow > 0.06) { mono = false; worstGrow = Math.max(worstGrow, grow); }
  running = Math.max(running, chords[i][1]);
}
check(mono, 'P6  chord envelope falls monotonically from the widest station to the tip',
  mono ? '' : `bulges ${worstGrow.toFixed(2)}u above the envelope`);
// ⚠ The "widest station" clause is a SINGLE-SHEET law. Binned chord measures leading edge to
// aft-most point, so on a scalloped fan it tracks the fingertips and peaks out in the hand
// regardless of where the membrane is actually widest. The no-pinch clause (root >= 0.9x max) is
// universal and is kept for both topologies; the station clause applies only to single-sheet wings.
const fingered = ftips.length >= 2;
check(chords[0][1] >= 0.9 * maxC && (fingered || maxCAt <= 0.30),
  `P7  no root pinch${fingered ? ' (fingered: station clause N/A)' : '; max chord at/just inboard of the elbow'}`,
  `widest @ x/span ${maxCAt.toFixed(2)}, root ${chords[0][1].toFixed(2)}u vs max ${maxC.toFixed(2)}u = ${(chords[0][1] / maxC).toFixed(2)}x`);

// --- P8: aspect ratio, body panel counted ------------------------------------
// ⚠ Envelope AR (integrated binned chord). An occupancy raster was tried and abandoned: sampling
// only triangle EDGES leaves membrane interiors empty, and no gap-bridging rule read the shipped
// roster correctly — it put Tempest at AR 14, which says the measure is wrong, not Tempest.
// The envelope figure IS calibrated: Tempest 7.42 and Vesper 7.32 both land in band, so a wing
// reading below 7 here is genuinely broader than the house standard rather than mis-measured.
let area = 0;
for (let i = 1; i < chords.length; i++) area += (chords[i][1] + chords[i - 1][1]) / 2 * (chords[i][0] - chords[i - 1][0]);
const halfBody = Math.abs(SH.x);
const Sarea = 2 * (area + chords[0][1] * halfBody), span = 2 * (XT + halfBody);
const AR = (span * span) / Sarea;
check(AR >= 7 && AR <= 9, 'P8  envelope aspect ratio b²/S, body panel counted  [7–9]',
  `AR ${AR.toFixed(2)}, span ${span.toFixed(2)}u`);

// --- P9: the body anchor is a LINE, not a point ------------------------------
// "If your root seam is shorter than the torso, it is wrong." Anchoring at the armpit is the
// glued-at-one-point / bat-sticker failure, and a behind-and-above camera looks straight down
// into that junction, so it is MORE exposed here than in profile.
const rootChord = chords[0][1];
const hipZ = 0.60 * (def.anvilScale ?? 1), shZ = SH.z;
const trunk = Math.abs(hipZ - shZ);
check(rootChord / trunk >= 1.0, 'P9  root chord ÷ trunk length  [≥1.0]',
  `root ${rootChord.toFixed(2)}u vs trunk ${trunk.toFixed(2)}u = ${(rootChord / trunk).toFixed(2)}×`);

// --- P10: there is an ARM ----------------------------------------------------
// The whole point. A membrane fanning from one hub is a pterosaur with the arm deleted; it reads
// as a spoke however richly it is decorated. Measured as distinct articulated groups between the
// pivot and the membrane, plus the requirement that the leading edge actually BENDS inboard of
// the wrist (a two-group rig with a straight arm is still an umbrella).
let groups = 0;
pivot.traverse((o) => { if (o.userData?.wingRole === 'mid' || o.userData?.wingRole === 'tip') groups++; });
// ⚠ Do NOT test this by looking for a visible elbow KINK. On a correct wing the propatagium
// covers the shoulder–elbow–wrist triangle and HIDES the elbow — that is the anatomy, not a
// defect — so a kink test reads ~0° on the very build it is supposed to approve. What actually
// distinguishes an arm from a hub is that the inboard leading edge exists and BOWS FORWARD off
// the straight shoulder→wrist line. A hub fan has no inboard leading edge at all (0%), and a
// bare scaffold arm IS the straight line (0%).
const inboard = LEpts.filter((p) => (p[0] * ux + p[1] * uz) / L <= kinkAt);
let camberPct = 0;
if (inboard.length > 3) {
  const a = inboard[0], b = inboard[inboard.length - 1];
  const dxi = b[0] - a[0], dzi = b[1] - a[1], dni = Math.hypot(dxi, dzi) || 1;
  for (const [x, z] of inboard) camberPct = Math.max(camberPct, ((x - a[0]) * dzi - (z - a[1]) * dxi) / dni / L);
}
if (process.env.PFDEBUG) {
  console.log('    [dbg] inboard span:', inboard[0], '→', inboard[inboard.length-1], 'n=', inboard.length);
  for (const [x,z] of inboard) {
    const a2=inboard[0], b2=inboard[inboard.length-1];
    const dx2=b2[0]-a2[0], dz2=b2[1]-a2[1], dn2=Math.hypot(dx2,dz2)||1;
    console.log('    [dbg] x',x.toFixed(3),'z',z.toFixed(3),'dev/L',(((x-a2[0])*dz2-(z-a2[1])*dx2)/dn2/L).toFixed(4));
  }
}
check(groups >= 2 && camberPct >= 0.02,
  'P10 an ARM exists: ≥2 articulated groups AND the inboard LE bows forward ≥2% of L',
  `${groups} groups, inboard forward camber ${(camberPct * 100).toFixed(1)}% of L`);

// --- P11: the gull — vertical extent from the rear (ref §4.9.4b) -------------
// The assertion the first version of this probe did not have, and its absence let a wing pass
// twelve planform checks and still render from the shipped camera as a razor line. A planform is
// an x/z table; nothing in P1–P10 looks at Y at all.
const ys = pts.map((p) => p[1]);
const gull = (Math.max(...ys) - Math.min(...ys)) / L;
check(gull >= 0.06, 'P11 rear-view vertical extent of the wing ÷ L (the gull)  [≥0.06]',
  `${gull.toFixed(3)}`);

console.log('-'.repeat(72));
console.log(fail === 0 ? `PASS — ${pass} planform targets met` : `FAIL — ${fail} of ${pass + fail} targets missed`);
process.exit(fail === 0 ? 0 : 1);
