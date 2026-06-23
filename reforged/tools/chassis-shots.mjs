// Render the hero body-plan creatures to a single montage PNG so the silhouettes
// can be judged from the chase cam — the point where the design stops being a doc.
//
//   node tools/chassis-shots.mjs [out.png]
//
// Top rows: each creature cel-shaded from the rear chase cam + a rear-¾ view.
// Bottom row: the DECORATION-STRIPPED naked silhouettes the anti-reskin gate
// compares (so you can see the bodies really differ, not just the trim).

import { writeFileSync } from 'node:fs';
import { build, renderToon, renderCoverage, coverageTile, strip, stack, pngRGBA, triCount } from './chassisRenderCore.mjs';
const { HERO_CREATURES } = await import('../js/creatureGenes.js');

const out = process.argv[2] || '/tmp/chassis-heroes.png';
const keys = Object.keys(HERO_CREATURES);
const fills = [[255, 170, 120], [130, 200, 240], [150, 235, 180]];

const rearRow = [], threeqRow = [], siloRow = [];
console.log('\nBody-plan hero set — triangle counts (HIGH):\n');
keys.forEach((k, i) => {
  const genes = HERO_CREATURES[k];
  const shaded = build(genes, { skin: true });
  rearRow.push(renderToon(shaded.group, { view: 'rear', W: 420, H: 420 }));
  threeqRow.push(renderToon(shaded.group, { view: 'threeq', W: 420, H: 420 }));
  // naked silhouette from a fresh (unskinned) build so outline shells don't bloat it
  const bare = build(genes, { skin: false });
  siloRow.push(coverageTile(renderCoverage(bare.group, { view: 'rear', W: 420, H: 420, strip: true }), fills[i % 3]));
  console.log(`  ${genes.name.padEnd(13)} (${genes.plan.padEnd(8)})  ${triCount(shaded.group)} tris`);
});

const montage = stack([strip(rearRow), strip(threeqRow), strip(siloRow)]);
writeFileSync(out, pngRGBA(montage.W, montage.H, montage.rgba));
console.log(`\nwrote ${out}  (${montage.W}x${montage.H})\n`);
