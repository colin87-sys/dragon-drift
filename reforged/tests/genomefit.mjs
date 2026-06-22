// Headless gate for the SILHOUETTE AUTO-FIT (tools/genomeFit.mjs) — the mechanism
// that answers "how is this different from the Night Fury hull, where I could never
// get the silhouette right no matter how I prompted or drew references?"
//
// OLD WORKFLOW: the outline was a passive picture a human eyeballed while guessing
// which of ~40 dials to turn; the cross-sections that ARE the outline were locked
// in builder code. The loop never closed.
//
// NEW WORKFLOW (this test): the outline is the OBJECTIVE FUNCTION. We start from a
// genome whose silhouette is plainly WRONG (a featureless fat tube) and let the
// optimizer drive its cross-sections until its silhouette matches a TARGET outline
// — no human in the loop. We assert the match measurably converges.
//
//   node tests/genomefit.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert } from './shim.mjs';

const { SAMPLE_WYVERN } = await import('../js/creatureGenome.js');
const { genomeMask, fitGenome, rasterize, iou } = await import('../tools/genomeFit.mjs');
const { setActiveDetail } = await import('../js/modelDetail.js');
const { sweepProfileSmooth } = await import('../js/dragonSweep.js');
const { genomeToProfile } = await import('../js/creatureGenome.js');

const W = 100, H = 64;

// TARGET = the wyvern's real silhouette (stand-in for "the outline you drew").
const target = genomeMask(SAMPLE_WYVERN, W, H);

// START = the SAME creature flattened to a featureless tube — every cross-section
// the wrong height. This is the "no matter how I prompt, the shape is off" state.
const start = JSON.parse(JSON.stringify(SAMPLE_WYVERN));
for (const j of start.spine) j.h = 0.34;

// baseline match before fitting.
setActiveDetail('high');
const startMask = rasterize(sweepProfileSmooth(genomeToProfile(start), 1), W, H);
const iou0 = iou(startMask, target);

// FIT — the optimizer drives the outline onto the target.
const fit = fitGenome(target, start, { W, H, iters: 14 });

console.log(`  IoU before fit: ${iou0.toFixed(3)}`);
console.log(`  IoU after fit:  ${fit.iou.toFixed(3)}`);
console.log(`  history: ${fit.history.map((x) => x.toFixed(2)).join(' → ')}`);

// GATES:
// 1. the start really is a poor match (proves we didn't start near the answer).
assert(iou0 < 0.85, `start silhouette is genuinely wrong (IoU ${iou0.toFixed(3)} < 0.85)`);
// 2. the fit converges to a strong silhouette match WITHOUT a human.
assert(fit.iou > 0.92, `auto-fit reaches the target outline (IoU ${fit.iou.toFixed(3)} > 0.92)`);
// 3. it MOVED the needle a lot (the loop actually closed).
assert(fit.iou - iou0 > 0.1, `auto-fit improved the match by >0.10 (Δ ${(fit.iou - iou0).toFixed(3)})`);
// 4. monotonic-ish: the optimizer never made it worse (greedy accept).
for (let i = 1; i < fit.history.length; i++) {
  assert(fit.history[i] >= fit.history[i - 1] - 1e-9, 'fit never regresses (greedy accept)');
}
// 5. the recovered heights actually approached the target proportions (chest tall,
//    tail thin) — the SHAPE converged, not just the pixel count.
const chest = fit.genome.spine.find((j) => j.id === 'chest').h;
const tail = fit.genome.spine.find((j) => j.id === 'tail').h;
assert(chest > tail, `recovered proportions are right (chest ${chest.toFixed(2)} > tail ${tail.toFixed(2)})`);

console.log('genome auto-fit: all gates passed — the OUTLINE drove the shape, no human dial-tuning.');
