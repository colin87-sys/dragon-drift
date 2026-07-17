// Throwaway: render Frozen Reach (biome 2) side props so we can SEE them.
// New kit (default) and legacy cones (?props=v1), a few dists each.
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 1120, height: 700 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 0]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

async function shots(query, tag) {
  const { page, done, errors } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  const dists = [700, 1500, 2600];
  for (const d of dists) {
    await page.evaluate((dd) => { window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(700);       // let bands recycle + camera settle
    await page.evaluate(() => { window.__dd.game.timeScale = 0; });
    await page.waitForTimeout(120);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/frozen-${tag}-${d}.png`, buf);
    await page.evaluate(() => { window.__dd.game.timeScale = 1; });
  }
  await done();
  return errors;
}

const eNew = await shots('?biome=2&debug', 'new');
const eOld = await shots('?biome=2&props=v1&debug', 'old');
console.log('new-kit console errors:', eNew.length, eOld.length ? '' : '');
console.log('old-kit console errors:', eOld.length);
if (eNew.length) console.log(eNew.slice(0, 4).join('\n'));
console.log('wrote /tmp/frozen-new-*.png and /tmp/frozen-old-*.png');
