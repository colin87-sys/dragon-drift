// Anti-reskin gate: the hero creatures must have DISTINCT naked-body silhouettes
// from the chase cam. Decoration (horns, extra spines) and the outline shell are
// STRIPPED before measuring, so swapping trim or recolouring can never satisfy
// the gate — two creatures with the same body shape FAIL.
//
//   node tests/silhouette-spacing.mjs
//
// Also asserts every creature renders a non-trivial silhouette and stays within
// the mobile triangle budget.

import { build, renderCoverage, iou, triCount } from '../tools/chassisRenderCore.mjs';
const { HERO_CREATURES } = await import('../js/creatureGenes.js');

const MAX_IOU = 0.62;        // two naked silhouettes may overlap at most this much
const TRI_BUDGET = 6000;     // HIGH mobile ceiling
const W = 300, H = 300;

const keys = Object.keys(HERO_CREATURES);
const covs = {}, tris = {};
let fails = 0;
const fail = (m) => { console.error(`  ✗ ${m}`); fails++; };
const ok = (m) => console.log(`  ✓ ${m}`);

for (const k of keys) {
  const r = build(HERO_CREATURES[k], { skin: false });
  covs[k] = renderCoverage(r.group, { view: 'rear', W, H, strip: true });
  tris[k] = triCount(r.group);
  const fillPx = covs[k].buf.reduce((a, v) => a + (v > 0 ? 1 : 0), 0);
  if (fillPx < W * H * 0.01) fail(`${k}: silhouette is basically empty (${fillPx}px)`);
  else ok(`${k}: silhouette ${(100 * fillPx / (W * H)).toFixed(1)}% coverage`);
  if (tris[k] > TRI_BUDGET) fail(`${k}: ${tris[k]} tris over ${TRI_BUDGET} budget`);
  else ok(`${k}: ${tris[k]} tris within budget`);
}

console.log('\n  pairwise naked-silhouette IoU (lower = more distinct):');
for (let i = 0; i < keys.length; i++)
  for (let j = i + 1; j < keys.length; j++) {
    const v = iou(covs[keys[i]], covs[keys[j]]);
    const line = `    ${keys[i]} ↔ ${keys[j]}: ${v.toFixed(3)}`;
    if (v > MAX_IOU) fail(`${line}  (too alike — reskin risk, ceiling ${MAX_IOU})`);
    else console.log(`${line}  ✓`);
  }

console.log('');
if (fails) { console.error(`silhouette-spacing: ${fails} failure(s)\n`); process.exitCode = 1; }
else console.log('silhouette-spacing: all creatures are distinct, within budget\n');
