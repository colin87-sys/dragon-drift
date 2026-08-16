// Throwaway (Stage 0): render Emberfall Caldera (biome 3) current side props so we
// can SEE them — static distant frames + a close moving flythrough burst.
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

async function statics(query, tag) {
  const { page, done, errors } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  const dists = [5300, 5600, 5900]; // biome 3 dominant band (block 3 => dist 4500-6000)
  for (const d of dists) {
    await page.evaluate((dd) => { window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(700);
    await page.evaluate(() => { window.__dd.game.timeScale = 0; });
    await page.waitForTimeout(120);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/caldera-${tag}-${d}.png`, buf);
    await page.evaluate(() => { window.__dd.game.timeScale = 1; });
  }
  await done();
  return errors;
}

async function fly(query, tag, startDist) {
  const { page, done, errors } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  await page.evaluate((d) => { window.__dd.player.dist = d; }, startDist);
  await page.waitForTimeout(500);
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(420);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/cclose-${tag}-${i}.png`, buf);
  }
  await done();
  return errors;
}

const e1 = await statics('?biome=3&debug', 'new');
const e2 = await fly('?biome=3&debug', 'a', 5250);
console.log('static errors:', e1.length, 'fly errors:', e2.length);
if (e1.length) console.log(e1.slice(0, 4).join('\n'));
console.log('wrote /tmp/caldera-new-*.png and /tmp/cclose-a-0..7.png');
