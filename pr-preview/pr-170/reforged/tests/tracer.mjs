// Headless test of the silhouette TRACER core (tools/tracerCore.mjs) — the pure mask→contour→simplify→
// loft-rings pipeline that powers tools/tracer.html. No DOM/canvas: we synthesize a tiny RGBA buffer
// (a filled ellipse on a flat background) and assert each stage behaves, then that the derived loft ring
// list maps onto the engine's {z, rx, ry} format (MODEL-CREATION.md §6a).
import { assert, assertEq } from './shim.mjs';
import { floodMask, backgroundMask, alphaMask, largestComponent, traceContour,
         simplify, simplifyToBudget, deriveProfile, toLoftRings, deriveWingForm, cutAt } from '../tools/tracerCore.mjs';

let n = 0; const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// --- synthesize a 80×60 image: dark bg (#101418, opaque) + a bright opaque ellipse subject ----
const W = 80, H = 60, data = new Uint8Array(W * H * 4);
const cx = 40, cy = 30, rx = 24, ry = 14;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4;
  const inside = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  if (inside) { data[i] = 230; data[i + 1] = 220; data[i + 2] = 90; data[i + 3] = 255; }   // subject
  else { data[i] = 16; data[i + 1] = 20; data[i + 2] = 24; data[i + 3] = 255; }            // background (opaque)
}
// a couple of stray speckles so largestComponent has something to drop
const speck = (x, y) => { const i = (y * W + x) * 4; data[i] = 230; data[i + 1] = 220; data[i + 2] = 90; data[i + 3] = 255; };
speck(3, 3); speck(4, 3); speck(76, 56);

// --- floodMask (click the subject centre) -----------------------------------
const fm = floodMask(data, W, H, cx, cy, 40);
let fmCount = 0; for (let i = 0; i < fm.length; i++) fmCount += fm[i];
assert(fmCount > 600 && fmCount < 1300, `flood fills the ellipse interior (~${fmCount}px of ~${Math.round(Math.PI*rx*ry)})`);
assertEq(fm[3 * W + 76], 0, 'flood from the subject does NOT leak into the far speckle');
ok('floodMask fills the clicked subject region only');

// --- backgroundMask (corners → invert) gives the subject back ---------------
const bm = backgroundMask(data, W, H, 40);
assertEq(bm[cy * W + cx], 1, 'background-invert marks the ellipse centre as subject');
assertEq(bm[0], 0, 'the corner itself is background (0)');
ok('backgroundMask flood-from-corners then inverts to the subject');

// --- alphaMask: make a cut-out variant (bg alpha 0) -------------------------
const cut = data.slice();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const inside = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  if (!inside) cut[(y * W + x) * 4 + 3] = 0;
}
const am = alphaMask(cut, W, H, 16);
assertEq(am[cy * W + cx], 1, 'alphaMask keeps opaque subject');
assertEq(am[0], 0, 'alphaMask drops transparent background');
ok('alphaMask reads a cut-out PNG by transparency');

// --- largestComponent drops the speckles ------------------------------------
const big = largestComponent(fm, W, H);
assertEq(big[3 * W + 3], 0, 'largestComponent removes the top-left speckle');
assertEq(big[cy * W + cx], 1, 'largestComponent keeps the main blob');
ok('largestComponent isolates the single biggest blob');

// --- traceContour returns one closed-ish ring around the blob ---------------
const contour = traceContour(big, W, H);
assert(contour.length > 30, `contour has a healthy ring of points (${contour.length})`);
// every contour point must be a foreground pixel
assert(contour.every(p => big[p.y * W + p.x] === 1), 'every contour vertex lies on the mask');
// bounds of the contour should hug the ellipse extents
const xs = contour.map(p => p.x), ys = contour.map(p => p.y);
assert(Math.min(...xs) <= cx - rx + 2 && Math.max(...xs) >= cx + rx - 2, 'contour spans the ellipse width');
assert(Math.min(...ys) <= cy - ry + 2 && Math.max(...ys) >= cy + ry - 2, 'contour spans the ellipse height');
ok('traceContour walks the blob outline');

// --- simplify cuts the count but keeps the shape ----------------------------
const simp = simplify(contour, 1.0);
assert(simp.length < contour.length && simp.length >= 8, `simplify thins ${contour.length}→${simp.length} points`);
const budgeted = simplifyToBudget(contour, 0.5, 20);
assert(budgeted.length <= 20 && budgeted.length >= 6, `simplifyToBudget honours the cap (${budgeted.length} ≤ 20)`);
ok('Douglas–Peucker simplify + budget cap behave');

// --- deriveProfile: half-extent should bulge at the middle, pinch at the ends
const norm = contour.map(p => ({ x: p.x / W, y: p.y / H }));
const prof = deriveProfile(norm, { axis: 'x', headEnd: 'min', stations: 9, aspect: W / H });
assertEq(prof.stations.length, 9, 'deriveProfile returns the requested station count');
assert(prof.stations[0].t === 0 && Math.abs(prof.stations[8].t - 1) < 1e-9, 't runs 0→1 head→tail');
const mid = prof.stations[4].half, end = prof.stations[0].half;
assert(mid > end, `mid-body is wider than the nose (${mid.toFixed(3)} > ${end.toFixed(3)})`);
// the ellipse half-height/length ratio ≈ ry/(2rx); deriveProfile reports half in body-LENGTH units
assert(Math.abs(mid - ry / (2 * rx)) < 0.06, `mid half-extent ≈ ry/(2·rx) (${mid.toFixed(3)} vs ${(ry/(2*rx)).toFixed(3)})`);
ok('deriveProfile samples a sane cross-section profile');

// --- toLoftRings: side+top → {z, rx, ry} in engine units --------------------
const rings = toLoftRings(prof, prof, 7);
assertEq(rings.length, 7, 'toLoftRings emits the requested ring count');
assertEq(rings[0].z, -1, 'first ring sits at z = −1 (head)');
assertEq(rings[6].z, 1, 'last ring sits at z = +1 (tail)');
assert(rings.every(r => typeof r.rx === 'number' && typeof r.ry === 'number'), 'every ring has numeric rx & ry');
assert(rings[3].ry > rings[0].ry, 'the mid ring is taller than the cap (a real body taper)');
ok('toLoftRings produces an engine-ready loftEllipse list');

// --- headEnd flip mirrors t -------------------------------------------------
const flipped = deriveProfile(norm, { axis: 'x', headEnd: 'max', stations: 9, aspect: W / H });
assert(Math.abs(flipped.stations[0].half - prof.stations[8].half) < 1e-9, 'headEnd=max mirrors the profile (head↔tail swap)');
ok('headEnd flips which end is the nose');

// --- deriveWingForm: a traced wing rig → engine wingForms planform -----------
// Rig in normalised coords: root near the body, outer tip far to the right, two inner
// fingers, a lead point above the span line. Square image (aspect 1) for clean math.
const rig = {
  root: [0.20, 0.50],
  wrist: [0.40, 0.46],
  lead: [0.55, 0.36],                  // above the span line → +y (leading edge)
  tips: [[0.85, 0.50], [0.70, 0.62], [0.50, 0.66]],   // outer→inner, fingers fan downward
};
const wf = deriveWingForm(rig, { aspect: 1, targetSpan: 5.5 });
assert(wf && wf.tips.length === 3, 'deriveWingForm returns a tip per finger');
assert(Math.abs(wf.tips[0][0] - 5.5) < 0.01, `outer tip lands at targetSpan x≈5.5 (got ${wf.tips[0][0]})`);
assert(Math.abs(wf.tips[0][1]) < 0.4, 'outer tip sits ~on the span line (small chord)');
assert(wf.tips[0][0] > wf.tips[1][0] && wf.tips[1][0] > wf.tips[2][0], 'tip x descends outer→inner (engine order)');
assert(wf.lead[1] > 0, 'lead is on the +y leading-edge side');
assert(wf.tips[2][1] < wf.lead[1], 'inner trailing finger sits below the leading edge');
ok('deriveWingForm maps a traced wing rig onto engine wingForms (tips + lead)');

// chord sign must follow the lead even if the wing is drawn mirrored (root on the right)
const mirror = { root: [0.85, 0.50], lead: [0.50, 0.36], tips: [[0.20, 0.50], [0.35, 0.62]] };
const wfm = deriveWingForm(mirror, { aspect: 1 });
assert(wfm.lead[1] > 0, 'mirrored wing still puts the lead on +y (sign follows the lead, not screen x)');
ok('deriveWingForm orients chord from the lead/wrist, not screen direction');

// --- cutAt: sample a cut polyline's threshold along the body axis -------------
const cutLine = [[0.5, 0.1], [0.6, 0.5], [0.5, 0.9]];   // a gently bowed near-vertical cut (x≈0.5–0.6)
assert(Math.abs(cutAt(cutLine, 0.5, 'x') - 0.6) < 1e-9, 'cutAt interpolates the threshold x at mid-height');
assert(Math.abs(cutAt(cutLine, 0.3, 'x') - 0.55) < 1e-9, 'cutAt linearly interpolates between vertices');
assertEq(cutAt(cutLine, -1, 'x'), 0.5, 'cutAt clamps below the first vertex');
assertEq(cutAt(cutLine, 2, 'x'), 0.5, 'cutAt clamps above the last vertex');
const cutY = [[0.1, 0.5], [0.5, 0.6], [0.9, 0.5]];  // axis 'y' → parametrise by x
assert(Math.abs(cutAt(cutY, 0.5, 'y') - 0.6) < 1e-9, 'cutAt handles the y-axis orientation');
ok('cutAt samples a cut threshold for axis-perpendicular partitioning');

console.log(`\ntracer core: ${n} checks passed.`);
