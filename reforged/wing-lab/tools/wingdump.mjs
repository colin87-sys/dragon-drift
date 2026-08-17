// WING LAB geometry dump — PURE MATH, no WebGL, ~4 s.
//
//   cd reforged && node wing-lab/tools/wingdump.mjs <key> [tier]
//
// Builds the dragon through the same buildDragonModel the game uses and prints the numbers
// the wing spec is written in (wing-lab/90-SYNTHESIS.md): the §3 landmark table in span
// fractions measured from the BODY MIDLINE, the elbow's included angle, the §4 spar taper
// against its two-regime table, the §5.1 area shares + aspect ratio, the finger rhythm, the
// triangle/draw budget split, and the span/body ratio.
//
// WHY it exists: "geometry numbers beat critic pixels" (§11). A render can be argued with;
// t = worldX / hs cannot. Run this BEFORE wingshot, and when a critic's pixels disagree
// with it, re-shoot on a clean stage rather than tuning to the pixels.
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
const { setFlapDebugPose } = await import('../../js/wingDebugPose.js');

const KEY = process.argv[2] || 'forgewing';
const TIER = process.argv[3] != null ? Number(process.argv[3]) : maxTierFor(KEY);
const def = ascendedDef(DRAGONS[KEY], TIER, 0);
const model = buildDragonModel(def);
const P = model.parts || {};
model.group.updateWorldMatrix(true, true);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) * 180 / Math.PI;
const f3 = (v) => (v >= 0 ? ' ' : '') + v.toFixed(3);

const dump = model.group.userData.forgewingDump || (() => {
  // walk for a builder that published one (the wing group carries it)
  let found = null;
  model.group.traverse((o) => { if (!found && o.userData && o.userData.forgewingDump) found = o.userData.forgewingDump; });
  return found;
})();

console.log(`\n═══ ${KEY} f${TIER} — WING GEOMETRY DUMP (pure math) ═══`);

// ── triangles + draws ─────────────────────────────────────────────────────────
const WING_ROOTS = ['wingPivotL', 'wingPivotR', 'wingYokeL', 'wingYokeR', 'wingRigL', 'wingRigR', 'wingPivot2L', 'wingPivot2R'];
const countTris = (root) => { let t = 0, d = 0; root.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3; d++; } }); return [t, d]; };
let wingTris = 0, wingDraws = 0;
for (const k of WING_ROOTS) { const n = P[k]; if (n && n.isObject3D) { const [t, d] = countTris(n); wingTris += t; wingDraws += d; } }
let allTris = 0, allDraws = 0; { const [t, d] = countTris(model.group); allTris = t; allDraws = d; }
// anything the wings builder parked OUTSIDE the pivots (a body-frame cowl is static through
// the flap by law, so it is not under wingPivot* — count it, or the budget lies)
const pivotSet = new Set(WING_ROOTS.map((k) => P[k]).filter(Boolean));
console.log(`\nTRIANGLES  wing pair (under wingPivot*) ${Math.round(wingTris)} in ${wingDraws} draws`);
console.log(`           whole form ${Math.round(allTris)} in ${allDraws} draws   (budget: pair ≤3000 target / 4000 ceiling · form ≤6000)`);

if (!dump) { console.log('\n(no forgewingDump on this model — the §3 landmark section is forgewing-only)\n'); process.exit(0); }

const { hs, rootX, landmarks: L, digits, tips, fan, propatagium } = dump;
const tOf = (p) => (p[0] + rootX) / hs;   // wing-local x → span fraction from the BODY MIDLINE

// ── §3 landmark table ─────────────────────────────────────────────────────────
console.log(`\n§3 LANDMARKS   (hs = ${hs.toFixed(3)} = spanScale · wingHalfSpan; t = worldX / hs from the body midline)`);
console.log('  landmark          t        spec     Δ       y/hs      z/hs');
const SPEC = [['shoulder', 0.090], ['elbow', 0.280], ['wrist', 0.500], ['mcp3', 0.680], ['pip3', 0.830], ['tip3', 1.000]];
let worstT = 0;
for (const [name, want] of SPEC) {
  const p = L[name], t = tOf(p), d = t - want;
  worstT = Math.max(worstT, Math.abs(d));
  console.log(`  ${name.padEnd(10)} ${t.toFixed(4)}   ${want.toFixed(3)}   ${f3(d)}   ${f3(p[1] / hs)}   ${f3(p[2] / hs)}`);
}
console.log(`  worst landmark error: ${worstT.toFixed(4)} span fractions  ${worstT < 0.002 ? '✓ MATCHES §3' : '✗ OFF §3'}`);

const gaps = [];
let prev = 0;
for (const [, want] of SPEC) { gaps.push(want - prev); prev = want; }
gaps.push(1.000 - 0.830);
const realGaps = [tOf(L.shoulder), tOf(L.elbow) - tOf(L.shoulder), tOf(L.wrist) - tOf(L.elbow),
  tOf(L.mcp3) - tOf(L.wrist), tOf(L.pip3) - tOf(L.mcp3), tOf(L.tip3) - tOf(L.pip3)];
console.log(`  gap rhythm root→tip: ${realGaps.map((g) => g.toFixed(3)).join(' · ')}   (§3: 0.090 · 0.190 · 0.220 · 0.180 · 0.150 · 0.170)`);
console.log(`  ph1 ${realGaps[4].toFixed(3)} vs ph2 ${realGaps[5].toFixed(3)}  →  ${realGaps[5] > realGaps[4] ? '✓ ph2 OUT-RUNS ph1 (§12 kill #3 clear)' : '✗ monotonic taper inside the finger'}`);

// ── §3/§12 the elbow must never read straight ─────────────────────────────────
const inc = ang(sub(L.shoulder, L.elbow), sub(L.wrist, L.elbow));
console.log(`\n§3 ELBOW   included angle S–E–K = ${inc.toFixed(1)}°   (spec ≈150° at full spread)  ${inc < 170 ? '✓ never straight (§12 kill #10 clear)' : '✗ reads straight'}`);

// ── the "‹" flare ─────────────────────────────────────────────────────────────
const zs = [['shoulder', L.shoulder], ['elbow', L.elbow], ['wrist', L.wrist], ['mcp3', L.mcp3], ['pip3', L.pip3], ['tip3', L.tip3]];
const fwd = Math.min(...zs.map(([, p]) => p[2])) / hs, aft = Math.max(...zs.map(([, p]) => p[2])) / hs;
const fwdAt = zs.find(([, p]) => Math.abs(p[2] / hs - fwd) < 1e-9)[0];
console.log(`§2.6 LEADING EDGE  forward-most ${fwd.toFixed(3)}·hs at ${fwdAt} · aft-most ${aft.toFixed(3)}·hs at the tip`);
console.log(`           ${fwdAt === 'wrist' && aft > 0 ? '✓ "‹" flare-forward-then-hook (§12 kill #12 clear)' : '✗ monotone aft-swept LE'}`);

// ── §4 spar taper ─────────────────────────────────────────────────────────────
console.log(`\n§4 SPAR    root diameter ${(2 * dump.r0).toFixed(3)} = ${(2 * dump.r0 / hs).toFixed(4)}·hs`);
const humL = len(sub(L.elbow, L.shoulder));
console.log(`           humerus length ${humL.toFixed(3)} → slenderness ${(humL / (2 * dump.r0)).toFixed(2)} : 1   (spec ≈4.25; §12 kill #5 fails past 6:1)`);
console.log('           t      0.09   0.28   0.50   0.77   0.92     (spec 1.00 / 0.86 / 0.62 / 0.33 / 0.15)');
console.log(`           d/d0   ${[0.09, 0.28, 0.50, 0.77, 0.92].map((t) => dump.sparF(t).toFixed(2)).join('   ')}`);

// ── §5 planform: area shares + aspect ratio ───────────────────────────────────
// Shoelace on the XZ projection of each surface's outline (the planform the top view shows).
const shoe = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[2] - q[0] * p[2]; } return Math.abs(a) / 2; };
const N = 24;
const armOutline = [];
for (let i = 0; i <= N; i++) armOutline.push(dump.armLead(i / N));
for (let i = N; i >= 0; i--) armOutline.push(dump.armTrail(i / N));
const armA = shoe(armOutline);
const handOutline = [L.wrist, ...tips, L.carpalVI];
const handA = shoe(handOutline);
const proA = (2 / 3) * (propatagium ? propatagium.depth : 0) * len(sub(L.wrist, L.shoulder));
// The BODY-FRAME SKIRT is not on the wing group, but it is part of the wing's planform READ
// (§9's flank line to the hip) — the wing sheet laps over it — so it counts toward the
// armwing share the way §5.1 means it. Reported separately so the split stays honest.
let skirtA = 0;
if (dump.skirtOuter && dump.skirtOuter.length > 1) {
  const inner = dump.skirtOuter.map((p) => [p[0] * 0.15, p[1], p[2]]);   // ≈ the flank line
  skirtA = shoe(dump.skirtOuter.concat(inner.slice().reverse()));
}
const one = armA + handA + proA + skirtA;
console.log(`\n§5.1 AREA (XZ planform, one wing)   propatagium ${(100 * proA / one).toFixed(1)}% · armwing ${(100 * (armA + skirtA) / one).toFixed(1)}% · handwing ${(100 * handA / one).toFixed(1)}%`);
console.log(`                                   (spec  ~7% · ~50% · ~43%)   armwing = wing sheet ${(100 * armA / one).toFixed(1)}% + body-frame skirt ${(100 * skirtA / one).toFixed(1)}%`);
const AR = (2 * hs) ** 2 / (2 * one);
console.log(`     aspect ratio (span² / pair area) = ${AR.toFixed(2)}   (spec ≈8 — higher = narrower/tauter)`);
let maxChord = 0, maxAt = 0;
for (let i = 0; i <= 40; i++) { const u = i / 40, c = len(sub(dump.armTrail(u), dump.armLead(u))); if (c > maxChord) { maxChord = c; maxAt = u; } }
console.log(`     max chord ${maxChord.toFixed(3)} = ${(maxChord / hs).toFixed(3)}·hs at arm-u ${maxAt.toFixed(2)} (widest INBOARD) · mean chord ${(one / hs).toFixed(3)}`);

// ── bay widths: the inboard must be ≈2× any finger bay (§12 kill #13) ─────────
const bayW = [];
for (let i = 0; i < tips.length - 1; i++) bayW.push(len(sub(tips[i + 1], tips[i])));
const inboardW = len(sub(L.bodyAnchor, L.carpalVI));
console.log(`\n§5.1 BAY WIDTHS   inboard ${inboardW.toFixed(3)} · finger bays ${bayW.map((w) => w.toFixed(3)).join(' / ')}`);
console.log(`     inboard ÷ widest finger bay = ${(inboardW / Math.max(...bayW)).toFixed(2)}×   ${inboardW / Math.max(...bayW) >= 1.8 ? '✓ ≈2× (§12 kill #13 clear)' : '✗ equal-width bays'}`);
console.log(`     finger length fractions ${fan.len.join(' / ')} · fan azimuths ${fan.az.join('° / ')}° · droop ${fan.droop.join(' / ')} rad`);

// ── the wing must OVERLAP the body-frame skirt by ≥0.15 chord (I1.1) ─────────
// Flank coverage moved to a static skirt, so the seam between the two frames is only safe
// if the wing sheet genuinely laps over it. Measured as the deepest point of the skirt's
// outer edge that lies INSIDE the wing's planform footprint, in chords.
if (dump.skirtOuter && dump.skirtOuter.length > 2) {
  const poly = armOutline.map((p) => [p[0], p[2]]);
  const inside = (x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (((poly[i][1] > z) !== (poly[j][1] > z)) && (x < (poly[j][0] - poly[i][0]) * (z - poly[i][1]) / (poly[j][1] - poly[i][1] || 1e-9) + poly[i][0])) c = !c; } return c; };
  const dEdge = (x, z) => { let m = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0], az = poly[j][1], bx = poly[i][0], bz = poly[i][1];
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    m = Math.min(m, Math.hypot(x - (ax + t * dx), z - (az + t * dz))); } return m; };
  let deepest = 0;
  for (const p of dump.skirtOuter) if (inside(p[0], p[2])) deepest = Math.max(deepest, dEdge(p[0], p[2]));
  const ov = deepest / maxChord;
  console.log(`\nSKIRT OVERLAP  wing sheet laps the body-frame skirt by ${deepest.toFixed(3)} = ${ov.toFixed(3)} chord   ${ov >= 0.15 ? '✓ ≥ 0.15 chord' : '✗ < 0.15 chord — the seam can open'}`);
}

// ── §5.2 the propatagium is a sail, not piping ────────────────────────────────
if (propatagium) console.log(`\n§5.2 PROPATAGIUM  depth ${propatagium.depth.toFixed(3)} = ${(propatagium.depth / propatagium.chordAtElbow).toFixed(3)} × chord@elbow (${propatagium.chordAtElbow.toFixed(3)})   (spec 0.20c; §12 kill #15 = 2-px piping)`);

// ── §7 THE FIRE: authored area per recruitment state ─────────────────────────
// Geometry ground truth for the budget the FIRE gate is argued on. The pixel probe
// (`wingfire.mjs`) is the binding measurement — this is the number that says whether
// the pixels can possibly be right before a browser is booted, and it is the only
// place root-first/tip-last recruitment is checkable exactly rather than by eye.
if (dump.fire) {
  const F = dump.fire;
  // §7.1's denominator is ONE WING's projected area. The body-frame skirt is not
  // wing, so the strict (smaller, harsher) denominator excludes it; both are printed
  // because the visual read of the wing does include the skirt lapping under it.
  const wingOnly = armA + handA + proA;
  const STATE = ['cold', 'cruise', 'power', 'ignition'];
  // cold: amended R4 — the core-coal is ≤0.3% of wing area (the old 0.4–2.0% band was
  // the closed-rim budget, i.e. the defect's own allowance).
  const BAND = [[0.0004, 0.0030], [0.030, 0.060], [0.060, 0.120], [0.090, 0.150]];
  console.log('\n§7.1 FIRE — authored emissive area per state (surface area, one wing)');
  console.log(`     one wing = ${wingOnly.toFixed(3)} (wing) / ${one.toFixed(3)} (with the body-frame skirt)`);
  console.log('     state       area    % wing   % +skirt   band        maxT   verdict');
  let cum = 0, prevMax = 0, order = true;
  for (let i = 0; i < 4; i++) {
    cum += F.area[i];
    const fr = cum / wingOnly, fr2 = cum / one;
    const [lo, hi] = BAND[i];
    const mx = Math.max(...F.maxT.slice(0, i + 1));
    if (mx < prevMax - 1e-6) order = false;
    prevMax = mx;
    const bd = hi < 0.02 ? `${(100 * lo).toFixed(2)}–${(100 * hi).toFixed(2)}%` : `${(100 * lo).toFixed(0)}–${(100 * hi).toFixed(0)}%`;
    console.log(`     ${STATE[i].padEnd(10)} ${cum.toFixed(3).padStart(6)}  ${(100 * fr).toFixed(2).padStart(6)}%  ${(100 * fr2).toFixed(2).padStart(7)}%   ${bd.padEnd(12)}${mx.toFixed(3)}  ${fr >= lo && fr <= hi ? '✓' : '✗ OUT OF BAND'}`);
  }
  console.log(`     recruitment root-first / tip-last: ${order ? '✓ each state reaches no further inboard than the last' : '✗ a later state lights INBOARD of an earlier one'}`);
  const beyond = F.maxT.filter((t) => t > 0).some((t) => t >= 0.60);
  console.log(`     furthest emissive vertex t = ${Math.max(...F.maxT).toFixed(3)}   ${beyond ? '✗ a zone reaches t ≥ 0.60' : '✓ every zone terminates before t = 0.60'}`);
  const Z = F.zone || {};
  const pc = (v) => `${(100 * v / wingOnly).toFixed(2)}%`;
  console.log(`     by ZONE: A window ${pc(Z.A)} (spec 2–4%) · B arteries ${pc(Z.B)} (spec 1–3%) · secondaries ${pc(Z.sec)} · outer recruit ${pc(Z.outer)} · capillaries ${pc(Z.cap)}`);
  console.log(`     vessel tree ${F.vessels} segments (orders 1–4, dark) · ${F.capillaries} ignition capillary stubs · ventral offset ${F.vent.toFixed(3)} u`);
}

// ── posed extents: span/body + the fold ratio ─────────────────────────────────
console.log('\nPOSED EXTENTS  (world space, through the shipped poser)');
const wbox = () => { const b = new THREE.Box3(); b.makeEmpty(); for (const k of WING_ROOTS) if (P[k] && P[k].isObject3D) b.expandByObject(P[k]); return b; };
const rows = [];
for (const pose of ['glide', 'apex', 'downstroke', 'fold']) {
  setFlapDebugPose(P, def.model, pose);
  model.group.updateWorldMatrix(true, true);
  const b = wbox(), s = new THREE.Vector3(); b.getSize(s);
  const mb = new THREE.Box3().setFromObject(model.group), ms = new THREE.Vector3(); mb.getSize(ms);
  rows.push({ pose, spanX: s.x, riseY: s.y, chordZ: s.z, bodyZ: ms.z });
}
for (const r of rows) console.log(`  ${r.pose.padEnd(11)} spanX ${r.spanX.toFixed(2)}  riseY ${r.riseY.toFixed(2)}  chordZ ${r.chordZ.toFixed(2)}  bodyZ ${r.bodyZ.toFixed(2)}  span/body ${(r.spanX / r.bodyZ).toFixed(2)}`);
console.log(`  fold ÷ glide span = ${(rows[3].spanX / rows[0].spanX).toFixed(3)}   (§8.3 target ≤0.55 — I4 owns the furl; I1 inherits the shipped rollFold)`);
// §3 (amended I1.1): the spec now states the MEASURED outcome, not a dial — glide span/body
// must land in 1.10–1.20, with hs free. The bar (tempest) measures 1.18.
const sb = rows[0].spanX / rows[0].bodyZ;
console.log(`  span/body at glide ${sb.toFixed(3)}   ${sb >= 1.10 && sb <= 1.20 ? '✓ INSIDE the §3 band 1.10–1.20 (bar 1.18)' : sb < 1.10 ? '✗ BELOW the §3 band 1.10–1.20' : '✗ ABOVE the §3 band 1.10–1.20'}`);

// ── ROOT PEEL ────────────────────────────────────────────────────────────────
// How far the membrane's INBOARD-AFT corner travels over the beat. A vertex that must read
// as attached to the body cannot live in a group that rotates with the limb (the Revenant
// shard lesson), so a plagiopatagium anchored far down the flank buys planform area with
// root travel. This number prices that trade so I4 can argue with it instead of guessing.
if (dump && dump.landmarks.bodyAnchor) {
  const a = dump.landmarks.bodyAnchor;
  const local = new THREE.Vector3(a[0], a[1], a[2]);
  const seen = [];
  for (const pose of ['glide', 'recovery', 'apex', 'downstroke', 'settle']) {
    setFlapDebugPose(P, def.model, pose);
    model.group.updateWorldMatrix(true, true);
    seen.push(local.clone().applyMatrix4(P.wingPivotR.matrixWorld));
  }
  let travel = 0;
  for (let i = 0; i < seen.length; i++) for (let j = i + 1; j < seen.length; j++) travel = Math.max(travel, seen[i].distanceTo(seen[j]));
  const bodyLen = rows[0].bodyZ;
  console.log(`\nROOT DRIFT  inboard-aft membrane corner travels ${travel.toFixed(3)} u over the cycle (${(100 * travel / bodyLen).toFixed(1)}% of body length)`);
  console.log(`            anchor at wing-local (${a.map((v) => v.toFixed(2)).join(', ')}), lever ${len(a).toFixed(3)} from the pivot`);
  console.log(`            ${travel <= 0.05 ? '✓ ≤ 0.05 u — the corner is ON the rotation centre; it cannot peel' : '✗ > 0.05 u — the Revenant shard trap is still live'}`);
}
console.log('');
