// Throwaway dev capture: fly a Frozen canyon run and screenshot the approach at several dists,
// with game.health pinned (so brushing an obstacle collider never triggers a death → no context
// churn) and small increments so the scheduler never allocates a huge stretch at once.
//   node tools/archshot.mjs [overunder|split|rib|...] [tag]
// e.g. node tools/archshot.mjs overunder arch  → /tmp/.../scratchpad/arch-d<dist>.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const KIND = process.argv[2] || 'overunder';
const TAG = process.argv[3] || KIND;
const OUT = '/tmp/claude-0/-home-user-dragon-drift/1455ceb4-2900-5616-86a9-206d089a41d6/scratchpad';
const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 0]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

const { page, done, errors } = await boot({ query: `?biome=2&canyon=${KIND}&debug`, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
await page.evaluate(() => { try { window.__dd.input.surgeTap = true; } catch (e) {} }).catch(() => {});
await page.waitForTimeout(800);
await page.evaluate(() => { window.__dd.player.dist = 130; window.__dd.game.health = 99; }).catch(() => {});
await page.waitForFunction(() => window.__dd.obstacleCount() > 0, { timeout: 10000 }).catch(() => {});

const dists = (process.argv[4] ? process.argv[4].split(',').map(Number) : [160, 195, 230, 265, 300, 335]);
for (const d of dists) {
  await page.evaluate((dd) => { window.__dd.player.dist = dd; window.__dd.game.health = 99; }, d).catch(() => {});
  for (let k = 0; k < 4; k++) { await page.waitForTimeout(140).catch(() => {}); await page.evaluate(() => { window.__dd.game.health = 99; }).catch(() => {}); }
  await page.evaluate(() => { window.__dd.game.timeScale = 0; }).catch(() => {});
  await page.waitForTimeout(120).catch(() => {});
  const info = await page.evaluate(() => ({ dist: Math.round(window.__dd.player.dist) })).catch(() => ({ dist: d }));
  const buf = await page.screenshot().catch(() => null);
  if (buf) writeFileSync(`${OUT}/${TAG}-d${info.dist}.png`, buf);
  await page.evaluate(() => { window.__dd.game.timeScale = 1; }).catch(() => {});
}
await done();
console.log('console errors:', errors.length);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
console.log(`wrote ${OUT}/${TAG}-*.png`);
