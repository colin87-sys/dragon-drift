// CELESTIAL STORM — rear-cam silhouette rule gate.
//
// The new anchor-driven creature lives or dies by its rear-cam READ. This test pins
// the `silhouetteRules` invariants from the spec so a future numeric tune can't
// silently break the read (wings stop dominating, tail stops ending in a spear, the
// thing stops being symmetric, etc.). It also guards determinism (seeded veins) and
// the mirror-by-construction symmetry. Pure modules → no three, no DOM, no browser.
import { assert } from './shim.mjs';
const { CELESTIAL_STORM_DRAGON_REAR_SPEC: SPEC, resolveSpec, mirrorWing } = await import('../js/celestialStormSpec.js');
const { buildRearSilhouette } = await import('../js/celestialStormSilhouette.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

const sil = buildRearSilhouette();
const b = sil.bounds;
const rules = SPEC.silhouetteRules;

// --- mirror-by-construction symmetry ---------------------------------------
const mirrored = mirrorWing(SPEC.wingLeft);
for (const k in SPEC.wingLeft) {
  assert(Math.abs(mirrored[k][0] + SPEC.wingLeft[k][0]) < 1e-9, `right wing mirrors left at ${k} (x negated)`);
  assert(Math.abs(mirrored[k][1] - SPEC.wingLeft[k][1]) < 1e-9, `right wing keeps left Y at ${k}`);
}
const rs = resolveSpec();
assert(rs.wingRight.tip[0] === -SPEC.wingLeft.tip[0], 'resolved wingRight is the mirror');
ok('mustBeSymmetric — right wing is the left wing mirrored across X=0 (authored once)');

// silhouette bounds symmetric about X=0
assert(Math.abs(b.maxX + b.minX) < 1e-6, `silhouette is X-symmetric (minX ${b.minX.toFixed(3)} / maxX ${b.maxX.toFixed(3)})`);
ok('silhouette bounding box is symmetric about the centreline');

// --- wings dominate ---------------------------------------------------------
const wingspan = b.maxX - b.minX;
const tipL = SPEC.wingLeft.tip, root = SPEC.wingLeft.root;
const bodyMaxHalf = SPEC.body.shoulderWidth * 0.5;
assert(rules.wingsMustDominate && wingspan > 2.0, `wingspan ${wingspan.toFixed(2)} is the dominant dimension`);
assert(wingspan > (b.maxY - b.minY), 'wingspan exceeds total height (wide shallow V read)');
ok(`wingsMustDominate — wingspan ${wingspan.toFixed(2)} > height ${(b.maxY - b.minY).toFixed(2)}`);

assert(rules.bodyMustStayNarrow && bodyMaxHalf < Math.abs(tipL[0]) * 0.25, 'body half-width is a small fraction of wing reach');
ok(`bodyMustStayNarrow — body half-width ${bodyMaxHalf.toFixed(3)} ≪ wing reach ${Math.abs(tipL[0]).toFixed(2)}`);

// --- outer wing tips are the sharp, highest, outermost points ----------------
const lead = [SPEC.wingLeft.root, SPEC.wingLeft.elbow, SPEC.wingLeft.wrist, SPEC.wingLeft.tip];
for (let i = 1; i < lead.length; i++) {
  assert(Math.abs(lead[i][0]) > Math.abs(lead[i - 1][0]), `leading edge sweeps outward at point ${i}`);
  assert(lead[i][1] > lead[i - 1][1], `leading edge rises toward the tip at point ${i}`);
}
assert(rules.outerWingTipsMustBeSharp && Math.abs(tipL[0]) >= Math.abs(b.minX) - 1e-9, 'tip is the outermost point');
ok('outerWingTipsMustBeSharp — leading edge sweeps monotonically out + up to a high sharp tip');

// --- scalloped trailing edge ------------------------------------------------
// the builder bows each trailing bay outward → more vertices than the 6 raw anchors
const te = sil.wings.left.trailingEdge;
assert(rules.trailingEdgeMustBeScalloped && te.length > 6, `trailing edge is scalloped (${te.length} pts > 6 anchors)`);
// each bay midpoint dips below the chord between its anchors (real concave sag)
let bays = 0;
for (let i = 1; i + 1 < te.length; i += 2) {
  const a = te[i - 1], m = te[i], c = te[i + 1];
  const chordY = (a[1] + c[1]) / 2;
  if (m[1] < chordY + 1e-6) bays++;
}
assert(bays >= 3, `at least 3 trailing bays sag below their chord (got ${bays})`);
ok(`trailingEdgeMustBeScalloped — ${bays} sagging membrane bays`);

// --- membrane panels are real (non-degenerate) ------------------------------
const area = (poly) => { let s = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]; return Math.abs(s) / 2; };
assert(sil.wings.left.panels.length === 3, 'left wing has 3 membrane panels');
for (const p of sil.wings.left.panels) assert(area(p) > 1e-4, 'membrane panel has real area (not a sliver)');
ok('3 membrane panels per wing, all non-degenerate');

// --- glowing central spine --------------------------------------------------
assert(rules.centralSpineMustGlow && sil.spinePlates.length >= 5, `dorsal spine has ${sil.spinePlates.length} glowing plates`);
let lastSize = Infinity;
for (const pl of sil.spinePlates) {
  assert(Math.abs(pl.center[0]) < 1e-9, 'spine plate sits on the centreline');
  const size = pl.diamond[0][1] - pl.center[1];
  assert(size <= lastSize + 1e-9, 'spine plates taper (largest up top)'); lastSize = size;
}
ok(`centralSpineMustGlow — ${sil.spinePlates.length} centred plates tapering down the back`);

// --- tail ends in a spear ----------------------------------------------------
const spearTip = SPEC.tail.bladeTip;
assert(rules.tailMustEndInSpear && Math.abs(spearTip[0]) < 1e-9, 'spear tip is on the centreline');
assert(Math.abs(b.minY - spearTip[1]) < 1e-9, 'spear tip is the lowest point of the whole silhouette');
ok('tailMustEndInSpear — tail tapers to a centred spear at the very bottom');

// --- determinism (seeded veins → byte-stable renders) -----------------------
const a1 = JSON.stringify(buildRearSilhouette().wings.left.veins);
const a2 = JSON.stringify(buildRearSilhouette().wings.left.veins);
assert(a1 === a2, 'vein generation is deterministic across builds');
ok('deterministic — seeded lightning veins reproduce exactly');

console.log(`\nCelestial Storm rear-silhouette rules: ${n} checks passed.`);
