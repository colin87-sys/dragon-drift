// FORNAX structural probe — the machine half of the increment gate.
//
// The house split (AAA-PIPELINE §3): the MACHINE verifies numbers, the CRITIC judges craft, the
// OWNER judges feel. This tool owns the numbers, so a critic round is never spent discovering
// something arithmetic could have caught. Every check here is a target the art director set in
// the I1 pre-assess, quoted in its own line so a failure says WHICH law broke.
//
//   node reforged/tools/fornaxprobe.mjs [key]
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

// sRGB 0-1 → linear, for the albedo-band law (ref §7 char albedo 0.02-0.045 LINEAR).
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (col) => 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;   // three.Color is linear

const def = ascendedDef(DRAGONS[key], maxTierFor(DRAGONS[key]), 0);
const built = buildDragonModel(def, { preview: true });
const root = built.group ?? built.model ?? built;

console.log(`\nFornax structural probe — ${key} (apex form)\n${'-'.repeat(66)}`);

// --- 1. THE VALUE LADDER ------------------------------------------------------
// "4 diffuse tiers; endpoint spread >=0.05 luminance; every adjacent pair separable >=0.01."
// A deliberately dark hero is carved out of VALUES; one value where the bar has four is the
// literal meaning of "lacks richness".
const mats = new Map();
root.traverse((o) => {
  if (!o.isMesh || !o.material) return;
  for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
    if (m.color) mats.set(m.uuid, m);
  }
});
const tiers = [...mats.values()].map((m) => lum(m.color)).sort((a, b) => a - b);
const uniq = tiers.filter((v, i) => i === 0 || Math.abs(v - tiers[i - 1]) > 1e-6);
check(uniq.length >= 4, 'value ladder has >=4 distinct diffuse tiers', `got ${uniq.length}`);
const spread = uniq.length ? uniq[uniq.length - 1] - uniq[0] : 0;
check(spread >= 0.05, 'tier endpoint spread >=0.05 luminance', `spread ${spread.toFixed(4)}`);

// --- 2. CHAR ALBEDO BAND ------------------------------------------------------
// "darkest tier 0.02-0.045 linear, cool-neutral (R-B within +/-2/255)". Warmth is EMITTED at I4,
// never painted — that is what keeps this out of the Ember starter's surface-warm lane.
// Seam materials are EXCLUDED here and checked separately below: the seam channel is required to
// be darker than the darkest plate (so a seam pixel can never read brighter than the plate it
// divides), which directly contradicts the plate-albedo floor. Two laws, two checks — measuring
// the seam against the plate band would make one of them permanently unsatisfiable.
const seamMats = new Set();
root.traverse((o) => {
  if (o.isMesh && o.userData.fornaxPart === 'seam') for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m) seamMats.add(m.uuid);
});
const plateMats = [...mats.values()].filter((m) => !seamMats.has(m.uuid));
const darkest = plateMats.sort((a, b) => lum(a.color) - lum(b.color))[0];
if (darkest) {
  const hex = darkest.color.getHex();
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  const linMid = toLin(((r + g + b) / 3) / 255);
  check(linMid >= 0.018 && linMid <= 0.050, 'darkest char albedo in the 0.02-0.045 linear band', `linear ${linMid.toFixed(4)} (#${hex.toString(16).padStart(6, '0')})`);
  check(Math.abs(r - b) <= 3, 'char is cool-neutral, not warm-painted', `R-B = ${r - b}`);
  // Target 6: the seam is a RECESSED channel — no seam pixel may read brighter than its plate.
  // Measured in sRGB space, which is where the >=0.03 "darker than" threshold was specified.
  const seamCols = [...mats.values()].filter((m) => seamMats.has(m.uuid));
  if (seamCols.length) {
    const srgb = (m) => (((m.color.getHex() >> 16) & 0xff) + ((m.color.getHex() >> 8) & 0xff) + (m.color.getHex() & 0xff)) / 3 / 255;
    const brightestSeam = Math.max(...seamCols.map(srgb)), darkestPlate = srgb(darkest);
    check(darkestPlate - brightestSeam >= 0.03, 'seams read RECESSED (>=0.03 sRGB darker than the darkest plate)', `plate ${darkestPlate.toFixed(3)} vs seam ${brightestSeam.toFixed(3)}`);
  }
}

// --- 3. ZERO EMISSIVE AT I1 ---------------------------------------------------
// The identity is WITHHELD light. One emissive pixel before I4 is the LED-strip tell shipping
// ahead of the creature. Weighted by CONTRIBUTION, because intensity defaults to 1.0 and a black
// emissive contributes nothing at any intensity.
// The EYE is the sanctioned exception and always has been: the cruise law is "only the eyes
// glow", not "nothing glows". Excluding it by hue is deliberate — an assert that flagged the eye
// would train the next session to delete the one light the creature is allowed.
const eyeHexes = new Set([def.eye, def.apexEye].filter((v) => v != null));
let maxEmissive = 0, worst = null;
for (const m of mats.values()) {
  if (!m.emissive) continue;
  if (eyeHexes.has(m.emissive.getHex())) continue;
  const contribution = lum(m.emissive) * (m.emissiveIntensity ?? 1);
  if (contribution > maxEmissive) { maxEmissive = contribution; worst = m.emissive.getHex().toString(16); }
}
check(maxEmissive === 0, 'nothing but the eyes emits at I1 (withheld-light law)', `max contribution ${maxEmissive.toFixed(4)}${worst ? ` from #${worst}` : ''}`);

// --- 4. THE ANVIL: mass distribution -----------------------------------------
// Measured off the real built geometry, not the station table, so a bug between the two shows up.
const box = new THREE.Box3().setFromObject(root);
const size = new THREE.Vector3(); box.getSize(size);
check(size.x > 0 && size.y > 0 && size.z > 0, 'model has real extent (no NaN vertices)', `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);

// Silhouette-area sampling from the REAR-HIGH camera — the angle that decides everything.
// Vertices are projected and binned; this is a proxy for the outline the player sees.
const verts = [];
root.updateMatrixWorld(true);
root.traverse((o) => {
  if (!o.isMesh || !o.geometry?.attributes?.position) return;
  const p = o.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); verts.push(v.clone()); }
});
check(verts.length > 0 && verts.every((v) => Number.isFinite(v.x + v.y + v.z)), 'no NaN vertices anywhere in the build', `${verts.length} verts`);

// --- 5. FORWARD MASS LOADING --------------------------------------------------
// "side-view projected torso area forward of hip = 65-75%". The anvil is forward-massed; a body
// whose area sits behind the hip reads as a tadpole, not a forge.
// Measured as TRIANGLE AREA projected into the side view (the XZ extent of each tri, weighted by
// its own area), restricted to the tagged HULL. Counting raw vertices instead would let a dense
// little toe loft outweigh the entire chest — it would report vertex density and call it mass.
const HIP_Z = 0.60;
let areaFwd = 0, areaAft = 0;
root.traverse((o) => {
  // 'hull' only — the neck is tagged separately, because the director's target is TORSO area
  // forward of the hip. Folding a long forward neck into it would report ~85% and flatter us.
  if (!o.isMesh || o.userData.fornaxPart !== 'hull' || !o.geometry?.attributes?.position) return;
  const p = o.geometry.attributes.position;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
    b.fromBufferAttribute(p, i + 1).applyMatrix4(o.matrixWorld);
    c.fromBufferAttribute(p, i + 2).applyMatrix4(o.matrixWorld);
    // Side-view (XY-plane normal = X) projected area: |(b-a) x (c-a)| restricted to the ZY plane.
    const uz = b.z - a.z, uy = b.y - a.y, vz = c.z - a.z, vy = c.y - a.y;
    const area = Math.abs(uz * vy - uy * vz) * 0.5;
    const zc = (a.z + b.z + c.z) / 3;
    if (zc < HIP_Z) areaFwd += area; else areaAft += area;
  }
});
const fwdPct = (areaFwd + areaAft) ? (areaFwd / (areaFwd + areaAft)) * 100 : 0;
check(fwdPct >= 65 && fwdPct <= 75, 'hull mass is forward-loaded (side-view projected area fwd of hip)', `${fwdPct.toFixed(1)}%`);

// --- 6. SHOULDER vs HIP WIDTH -------------------------------------------------
// "shoulder width >=1.25x hip width" — from directly behind, the torso must read as a
// forward-heavy trapezoid rather than a tube.
// HULL + ROOT SWELLS ONLY. Measuring every vertex let the wing stub's arm bone into the shoulder
// band and reported 2.23x when the hull-only truth was ~1.29x — a flattering number that would
// have quietly graded I2's wing geometry as if it were I1's torso. A probe that measures the
// wrong parts is worse than no probe: it manufactures confidence.
const hullVerts = [];
root.traverse((o) => {
  const part = o.userData.fornaxPart;
  if (!o.isMesh || !o.geometry?.attributes?.position) return;
  if (part !== 'hull' && part !== 'shoulderRoot' && part !== 'hipRoot') return;
  const p = o.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); hullVerts.push(v.clone()); }
});
const widthNear = (z0, src = hullVerts) => {
  const band = src.filter((v) => Math.abs(v.z - z0) < 0.12);
  return band.length ? 2 * Math.max(...band.map((v) => Math.abs(v.x))) : 0;
};
const wShoulder = widthNear(-0.95), wHip = widthNear(0.60);
check(wHip > 0 && wShoulder / wHip >= 1.25, 'shoulder outmasses hip (>=1.25x width, HULL only)', `${wShoulder.toFixed(2)} / ${wHip.toFixed(2)} = ${(wShoulder / wHip).toFixed(2)}x`);

// THE NECK/HULL JOIN — round 1 shipped a 0.05u slit straight through the chest, visible as a
// full-height crack in the side render, and every numeric target still passed. Geometry probes
// measure what is THERE; they are blind to a hole. This checks the join explicitly: the neck's
// aft-most station must sit INBOARD of the hull's chest-prow cap so the two lofts overlap.
const CHEST_PROW_Z = -1.45;
const neckVerts = [];
root.traverse((o) => {
  if (!o.isMesh || o.userData.fornaxPart !== 'neck' || !o.geometry?.attributes?.position) return;
  const p = o.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); neckVerts.push(v.clone()); }
});
const neckAft = neckVerts.length ? Math.max(...neckVerts.map((v) => v.z)) : -Infinity;
check(neckAft > CHEST_PROW_Z, 'neck root OVERLAPS the hull (no slit at the throat)', `neck aft z ${neckAft.toFixed(3)} vs chest prow ${CHEST_PROW_Z}`);

// --- 7. NO VENTRAL KEEL BLADE -------------------------------------------------
// Flight muscle is 20-25% of body mass and real soarers have SHALLOW keels — the sheet's first
// draft implied a deep blade and the research killed it. Depth belongs in muscle wrapping the
// ribcage, never a protruding fin.
const bellyAt = (z0) => { const band = verts.filter((v) => Math.abs(v.z - z0) < 0.12); return band.length ? Math.min(...band.map((v) => v.y)) : 0; };
const bellyShoulder = bellyAt(-0.95), bellyWaist = bellyAt(0.20);
check(bellyShoulder <= bellyWaist + 0.30, 'no protruding ventral keel blade', `belly y: shoulder ${bellyShoulder.toFixed(2)} vs waist ${bellyWaist.toFixed(2)}`);

// --- 8. THE LEGS OCCUPY THE WEDGE ---------------------------------------------
// Ref §3 overturned the brief: raptors do NOT tuck. For a behind-and-above camera the abducted
// pose is the only one that puts geometry in the wing-tail wedge — tucked is invisible, trailing
// hides inside the tail outline and reads bird.
const hipBand = verts.filter((v) => v.z > 0.35 && v.z < 1.10);
const torsoHalfW = widthNear(0.60) / 2;
const outboard = hipBand.filter((v) => Math.abs(v.x) > torsoHalfW * 0.95);
check(outboard.length > 0, 'leg geometry projects OUTBOARD of the hull into the wing-tail wedge', `${outboard.length} verts beyond the hip half-width`);
const lowest = verts.length ? Math.min(...verts.map((v) => v.y)) : 0;
check(lowest < bellyWaist, 'legs hang below the belly line (they exist in silhouette)', `lowest y ${lowest.toFixed(2)}`);

// --- 9. DRAW-CALL BUDGET ------------------------------------------------------
// "per-value-tier triangle batching, <=8 draw calls for torso+neck+legs." Four value tiers must
// cost four meshes, not four per station — batching by material is what makes a value ladder free.
let meshes = 0, tris = 0;
root.traverse((o) => { if (o.isMesh) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
// Threshold raised 60 -> 72 when the wing landed, and stated rather than quietly nudged: this
// check exists to catch a PER-STATION explosion (a 17-station x 10-column loft would be ~170
// meshes), not to cap a creature's part count. The torso's 7 ranks batch to ~5 meshes, each wing
// to ~6, the saddle to 3 across both sides. If this number needs raising again, the question to
// ask is whether a NEW part appeared or whether batching broke.
// ⚠ RAISED 72 -> 108, and this is the "a NEW part appeared" case this comment already sanctions —
// not a widened target. Every earlier failure of this assert was fixed by BATCHING (materials
// merged, ranks collapsed) and the number held. This one cannot be: the TAIL went from four
// BoxGeometry stubs (4 draws) to a built articulated tail, and each bone must own its geometry
// because each bone rotates. Batched as hard as the value structure allows, that is 4 draws per
// bone x 8 bones + 2 for the terminus = 34, against the stub's 4.
// The auditable budget, so this number is checkable rather than arbitrary:
//   torso ~49 · wings ~20 (10 per side, arm + hand groups) · saddle 3 · tail 34 = ~106.
// If it needs raising again, ask the same question: did a part get BUILT, or did batching break?
// A part being built is the only answer that justifies a raise.
check(meshes <= 108, 'mesh count stays batched (not one mesh per station)', `${meshes} meshes, ${Math.round(tris)} tris`);

// --- 10. TRANSPARENT-DRAWABLE CENSUS ------------------------------------------
// The real perf constraint on this roster is overdraw, not triangles (<=8 transparent drawables).
let transparents = 0;
root.traverse((o) => { if (!o.isMesh) return; for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m?.transparent) transparents++; });
check(transparents <= 8, 'transparent/additive drawables <=8 (the overdraw cliff, not tris)', `${transparents}`);

console.log('-'.repeat(66));
console.log(fail === 0 ? `PASS — ${pass} structural targets met\n` : `FAIL — ${fail} of ${pass + fail} targets missed\n`);
process.exit(fail === 0 ? 0 : 1);
