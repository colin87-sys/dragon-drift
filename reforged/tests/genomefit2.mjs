// Headless gate for MULTI-VIEW silhouette auto-fit (tools/genomeFit.mjs).
//
// Honest account of what each view buys, proven:
//   • SIDE  fixes the HEIGHT profile but is blind to width.
//   • + REAR fixes the WIDTH THE CHASE CAM SEES (the rear silhouette is an
//            envelope — it's exactly what the player views from behind).
//   • + TOP  pins PER-STATION width along the body (what the envelope can't
//            disambiguate) → the full orthographic triple recovers the shape.
//
//   node tests/genomefit2.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert } from './shim.mjs';

const { SAMPLE_WYVERN } = await import('../js/creatureGenome.js');
const { genomeMask, fitMultiView, iou } = await import('../tools/genomeFit.mjs');

const W = 100, H = 64;
const targetSide = genomeMask(SAMPLE_WYVERN, 'side', W, H);
const targetRear = genomeMask(SAMPLE_WYVERN, 'rear', W, H);
const targetTop = genomeMask(SAMPLE_WYVERN, 'top', W, H);
const tChest = SAMPLE_WYVERN.spine.find((j) => j.id === 'chest').w;

// rear-silhouette IoU of a fitted genome vs the target (what the chase cam reads).
const rearMatch = (g) => iou(genomeMask(g, 'rear', W, H), targetRear);

// START = featureless tube: every cross-section the wrong width AND height.
const start = JSON.parse(JSON.stringify(SAMPLE_WYVERN));
for (const j of start.spine) { j.w = 0.34; j.h = 0.34; }

// ── A) SIDE-ONLY: height matches, but the REAR silhouette stays wrong ─────────
const sideOnly = fitMultiView({ side: targetSide }, start, { W, H, params: ['h'], iters: 14 });
const rA = rearMatch(sideOnly.genome);
assert(rA < 0.72, `side-only does NOT match the rear silhouette (rear IoU ${rA.toFixed(3)} — blind to width)`);

// ── B) SIDE + REAR: the rear silhouette (what the chase cam sees) now matches ─
const sideRear = fitMultiView({ side: targetSide, rear: targetRear }, start, { W, H, params: ['w', 'h'], iters: 16 });
const rB = rearMatch(sideRear.genome);
assert(rB > 0.85, `adding REAR makes the chase-cam silhouette match (rear IoU ${rB.toFixed(3)} > 0.85)`);
assert(rB > rA + 0.15, `rear view measurably fixes the width the cam sees (${rB.toFixed(3)} ≫ ${rA.toFixed(3)})`);

// ── C) SIDE + REAR + TOP: per-station width recovered (the full triple) ───────
const triple = fitMultiView({ side: targetSide, rear: targetRear, top: targetTop }, start,
  { W, H, params: ['w', 'h'], iters: 18 });
const fChest = triple.genome.spine.find((j) => j.id === 'chest').w;
const wErr = Math.abs(fChest - tChest);

console.log(`  A side-only   rear IoU: ${rA.toFixed(3)}  (blind to width)`);
console.log(`  B side+rear   rear IoU: ${rB.toFixed(3)}  mean IoU ${sideRear.iou.toFixed(3)}`);
console.log(`  C side+rear+top  chest width err: ${wErr.toFixed(3)}  mean IoU ${triple.iou.toFixed(3)}`);

assert(wErr < 0.10, `triple recovers PER-STATION width (chest err ${wErr.toFixed(3)} < 0.10)`);
assert(triple.iou > 0.9, `triple reaches a strong overall match (mean IoU ${triple.iou.toFixed(3)} > 0.90)`);

console.log('multi-view auto-fit: all gates passed — adding views constrains width, exactly where the math says they should.');
