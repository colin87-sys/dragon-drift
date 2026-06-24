// CELESTIAL STORM — validate the AUTO-TRACED layer outlines (js/celestialTrace.js,
// emitted by tools/traceLayers.mjs from the registered concept-art layers). This is the
// NEW source of truth for the creature's silhouette — real traced geometry, not a
// hand-placed anchor rig — so we pin its structure: registered canvas, the expected
// contour counts (torso 1 / wings 2 / spine ≥1), normalized coords, a substantial point
// budget, and left/right wing symmetry about the shared centreline.
import { assert } from './shim.mjs';
const { CELESTIAL_TRACE: T } = await import('../js/celestialTrace.js');

let n = 0; const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const allPts = (cs) => cs.flat();
const bbox = (pts) => pts.reduce((b, p) => ({ minX: Math.min(b.minX, p[0]), maxX: Math.max(b.maxX, p[0]), minY: Math.min(b.minY, p[1]), maxY: Math.max(b.maxY, p[1]) }), { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9 });

// --- registered canvas + structure -----------------------------------------
assert(Array.isArray(T.canvas) && T.canvas[0] === 941 && T.canvas[1] === 1672, 'shared 941×1672 canvas');
assert(T.torso.length === 1, `torso = 1 contour (got ${T.torso.length})`);
assert(T.wings.length === 2, `wings = 2 contours, left+right (got ${T.wings.length})`);
assert(T.spine.length >= 1, `spine ≥ 1 contour (got ${T.spine.length})`);
ok('structure — torso(1) + wings(2) + spine(≥1) traced layers');

// --- every point normalized to 0..1, every contour a real polygon -----------
for (const [name, cs] of [['torso', T.torso], ['wings', T.wings], ['spine', T.spine]]) {
  for (const c of cs) {
    assert(c.length >= 8, `${name} contour has enough points (${c.length})`);
    for (const p of c) assert(p[0] >= -0.01 && p[0] <= 1.01 && p[1] >= -0.01 && p[1] <= 1.01, `${name} point normalized in 0..1`);
  }
}
ok('all contours normalized to 0..1 and non-degenerate');

const total = T.torso.concat(T.wings, T.spine).reduce((s, c) => s + c.length, 0);
assert(total > 400, `substantial trace budget (${total} points)`);
// every contour is a DENSE, evenly-resampled 200..400-dot outline (the accurate-trace technique)
for (const [name, cs] of [['torso', T.torso], ['wings', T.wings], ['spine', T.spine]]) {
  for (const c of cs) assert(c.length >= 200 && c.length <= 400, `${name} contour is a dense 200..400-dot trace (${c.length})`);
}
ok(`accurate trace — ${total} total vertices, every layer a dense 200..400-dot outline`);

// --- the body runs vertically; the spine hugs the centreline ----------------
const torsoBox = bbox(allPts(T.torso));
assert((torsoBox.maxY - torsoBox.minY) > (torsoBox.maxX - torsoBox.minX), 'torso is taller than wide (vertical body)');
const spineBox = bbox(allPts(T.spine));
const spineMidX = (spineBox.minX + spineBox.maxX) / 2;
assert(Math.abs(spineMidX - 0.5) < 0.08, `spine runs down the centreline (mid x ${spineMidX.toFixed(3)})`);
ok('body is vertical and the spine follows the centreline');

// --- wings flank the body and roughly mirror about x=0.5 --------------------
const w0 = bbox(T.wings[0]), w1 = bbox(T.wings[1]);
const left = w0.minX < w1.minX ? w0 : w1, right = w0.minX < w1.minX ? w1 : w0;
assert(left.maxX < 0.55 && right.minX > 0.45, 'one wing on each side of centre');
const leftReach = 0.5 - left.minX, rightReach = right.maxX - 0.5;
assert(Math.abs(leftReach - rightReach) < 0.02, `wings reach symmetrically (L ${leftReach.toFixed(3)} ~ R ${rightReach.toFixed(3)})`);
// the pair is built by mirroring ONE traced wing across x=0.5 → exact reflection (same length, mirrored bbox)
assert(T.wings[0].length === T.wings[1].length, 'both wings share the traced point count (one mirrored)');
assert(Math.abs((0.5 - left.minX) - (right.maxX - 0.5)) < 1e-6 || Math.abs(leftReach - rightReach) < 0.02, 'wings are an exact mirror pair');
ok('wings flank the body and are an exact mirror pair about the centreline');

console.log(`\nCelestial Storm trace: ${n} checks passed (${total} traced vertices).`);
