// Throwaway: Caldera COMPOSITION capture — freeze fast at arrival + cruise distances
// (warp → brief settle → timeScale 0 immediately, so the dragon never flies into a gate
// and motion blur stays low). Biome 3 block = dist 4500–6000; arrival seam ≈ 4500.
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 0]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

const DISTS = {
  'arrival-seam': 4500,
  'arrival-open': 4600,
  'arrival-chord': 4760,
  'cruise-a': 5080,
  'cruise-b': 5420,
  'cruise-c': 5760,
};

const { page, done, errors } = await boot({ query: '?biome=3&debug', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
for (const [tag, d] of Object.entries(DISTS)) {
  await page.evaluate((dd) => {
    window.__dd.player.dist = dd;
    // damp any speed-driven radial blur so the composition reads clean
    if (window.__dd.player.speed != null) window.__dd.player.speed = 0;
    if (window.__dd.player.vel) { window.__dd.player.vel.x = 0; window.__dd.player.vel.y = 0; }
  }, d);
  await page.waitForTimeout(280);              // let bands recycle to this dist
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(140);              // settle a couple frames frozen (blur decays)
  writeFileSync(`/tmp/calcomp-${tag}.png`, await page.screenshot());
  await page.evaluate(() => { window.__dd.game.timeScale = 1; });
}
await done();
console.log('errors:', errors.length);
if (errors.length) console.log(errors.slice(0, 4).join('\n'));
console.log('wrote /tmp/calcomp-*.png:', Object.keys(DISTS).join(', '));
