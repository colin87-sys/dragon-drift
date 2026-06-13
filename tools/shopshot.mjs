// Shop screenshot harness: boots the game, seeds a few owned/ascended dragons,
// opens the DRAGONS tab and screenshots it after the flapping previews spin up.
//   node tools/shopshot.mjs   →   /tmp/shop-dragons.png
import { boot } from '../tests/browser.mjs';

const { page, done } = await boot({
  query: process.argv.includes('dev') ? '?debug&dev' : '?debug',
  viewport: { width: 900, height: 1000 },
  deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 9000,
    skins: { owned: ['azure','solar','obsidian'], equipped: 'solar' },
    riders: { owned: ['drifter'], equipped: 'drifter' },
    ascension: { tiers: [['solar', 2], ['obsidian', 1]], radiance: [] },
    mastery: { flown: [['solar', 200000], ['obsidian', 80000]] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9 },
    settings: { reticle: false, slowMo: true, qualityOverride: null },
  }))`,
});
await page.click('#btn-shop');
await page.waitForSelector('.shop-grid');
await page.waitForTimeout(2600); // let the flapping previews animate into a good pose
const shotEl = async () => (await page.$('#screen-shop')) || (await page.$('.shop-grid')) || page;
await (await shotEl()).screenshot({ path: '/tmp/shop-dragons.png' });
console.log('wrote /tmp/shop-dragons.png');
await page.click('.seg-btn[data-shoptab="riders"]');
await page.waitForTimeout(1800);
await (await shotEl()).screenshot({ path: '/tmp/shop-riders.png' });
console.log('wrote /tmp/shop-riders.png');
await done();
