// In-context captures of the reskinned Frozen HAZARDS: fly the ?hazlab showcase in
// the real Frozen biome (so the hazards are judged NEXT TO the premium side props,
// not against a blank studio sky — the owner's exact critique). Parks the camera just
// short of each showcase hazard and bursts frames as the dragon flies through it.
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

// showcase hazards live at dist 130/180/235/295/355 — park just short of each.
const STOPS = [
  ['pillar', 108], ['shard', 158], ['shardDyn', 212], ['barHigh', 272], ['barLow', 332],
];

async function run() {
  const { page, done, errors } = await boot({ query: '?biome=2&hazlab&debug', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  for (const [tag, d] of STOPS) {
    await page.evaluate((dd) => { window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(500);
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(360);
      writeFileSync(`/tmp/haz-${tag}-${i}.png`, await page.screenshot());
    }
  }
  await done();
  return errors;
}

const e = await run();
console.log('errors:', e.length);
console.log('wrote /tmp/haz-{pillar,shard,shardDyn,barHigh,barLow}-0..3.png');
