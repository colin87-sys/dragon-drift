// Close-up in-channel renders: fly THROUGH the Frozen ice and burst-capture, so we
// see the props up close (like the owner's phone shot), not frozen at the horizon.
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

async function fly(query, tag, startDist) {
  const { page, done, errors } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  await page.evaluate((d) => { window.__dd.player.dist = d; }, startDist);
  await page.waitForTimeout(500);
  // Burst-capture while the dragon flies forward through the ice field.
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(420);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/fclose-${tag}-${i}.png`, buf);
  }
  await done();
  return errors;
}

const e1 = await fly('?biome=2&debug', 'a', 2560);
const e2 = await fly('?biome=2&debug', 'b', 3460);
console.log('errors:', e1.length, e2.length);
console.log('wrote /tmp/fclose-a-0..7.png and /tmp/fclose-b-0..7.png');
