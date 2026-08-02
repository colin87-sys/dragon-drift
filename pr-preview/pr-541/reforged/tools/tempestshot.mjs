// tempestshot.mjs — headless Tempest Reach (BIOMES[7]) capture for the Fable gate.
// ?biome=7 pins the whole course to Tempest, so a short natural cruise renders it.
// Kept deliberately MINIMAL — one boot, one screenshot, no warp, no freeze — because
// this container's software WebGL stalls its readback under anything heavier (warping
// via player.dist, multi-shot loops, and large framebuffers all hang here; the same
// flakiness affects the shipped atmos/sky/watershot tools). If a run stalls, re-invoke.
//   node tools/tempestshot.mjs [outPath] [cruiseSeconds]
//     → outPath (default /tmp/tempest.png)
import { boot } from '../tests/browser.mjs';

const out = process.argv[2] || '/tmp/tempest.png';
const cruise = Math.max(0, parseFloat(process.argv[3] || '4')) * 1000;

const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: 0 },
}))`;

const { page, errors, done } = await boot({
  query: '?debug&cleanshot&seed=73101&biome=7',
  viewport: { width: 720, height: 900 }, deviceScaleFactor: 1, initScript: save,
});
await page.click('#btn-start').catch(() => {});
await page.waitForTimeout(cruise);   // fly out into steady biome-7 cruise
await page.screenshot({ path: out });
console.log(`wrote ${out}  errors=${errors.length}`);
if (errors.length) console.log(errors.slice(0, 4).join('\n'));
await done();
process.exit(0);
