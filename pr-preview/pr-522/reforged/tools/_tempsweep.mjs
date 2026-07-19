// _tempsweep.mjs — Tempest Reach (BIOMES[7]) natural-cruise capture, seed as an argument (§9 Recipe B).
// A clone of tempestshot.mjs with the seed parametrised so a fixed seed + varied cruiseSeconds sweeps ONE
// layout's congregation/breath windows (the owner's follow-cam view — do NOT override the camera). ONE boot
// per frame (the tempest stall caveat: multi-shot loops / warps hang this container's software WebGL).
//   node tools/_tempsweep.mjs [outPath] [cruiseSeconds] [seed]
import { boot } from '../tests/browser.mjs';

const out = process.argv[2] || '/tmp/tempsweep.png';
const cruise = Math.max(0, parseFloat(process.argv[3] || '4')) * 1000;
const seed = process.argv[4] || '73101';

const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: 0 },
}))`;

const { page, errors, done } = await boot({
  query: `?debug&cleanshot&seed=${seed}&biome=7`,
  viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1, initScript: save,
});
await page.click('#btn-start').catch(() => {});
await page.waitForTimeout(cruise);
// Optional SINGLE dist set (5th arg) — the RAF loop is throttled headless so the dragon barely advances;
// one assignment jumps the world to a chosen window (no camera override / no setInterval → stall-safe).
const target = process.argv[5];
if (target) { await page.evaluate((d) => { if (window.__dd && window.__dd.player) window.__dd.player.dist = +d; }, target).catch(() => {}); await page.waitForTimeout(900); }
const dist = await page.evaluate(() => (window.__dd && window.__dd.player ? Math.round(window.__dd.player.dist) : -1)).catch(() => -1);
await page.screenshot({ path: out });
console.log(`wrote ${out}  seed=${seed} cruise=${cruise}ms dist=${dist} errors=${errors.length}`);
if (errors.length) console.log(errors.slice(0, 4).join('\n'));
await done();
process.exit(0);
