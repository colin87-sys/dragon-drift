// Throwaway: render Lumen Mire (biome 4) PR-1 atmosphere substrate + an Aurora (biome 6)
// frame for the anti-Aurora blind-test line-up. node tools/_mireshot.mjs → /tmp/mire-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 640, height: 1386 };   // PORTRAIT — match the phone (1320x2868 ≈ 0.46); the
                                             // vertical FOV shows the overhead canopy the landscape crop hid
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 0]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

async function shots(query, tag, dists) {
  const { page, done, errors } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  for (const d of dists) {
    await page.evaluate((dd) => { window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(700);
    await page.evaluate(() => { window.__dd.game.timeScale = 0; });
    await page.waitForTimeout(120);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/mire-${tag}-${d}.png`, buf);
    await page.evaluate(() => { window.__dd.game.timeScale = 1; });
  }
  await done();
  return errors;
}

const eMire = await shots('?biome=4&debug', 'mire', [520, 640, 760, 880, 1120, 1360, 1620, 1780, 2240, 2420]);
const eAur = await shots('?biome=6&debug', 'aurora', [1500]);
console.log('mire console errors:', eMire.length);
if (eMire.length) console.log(eMire.slice(0, 4).join('\n'));
console.log('aurora console errors:', eAur.length);
console.log('wrote /tmp/mire-*.png');
