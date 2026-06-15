// Dragon Surge screenshot: boots with ?debug=fever (forces Surge), seeds a
// dragon/tier, and screenshots the live canvas so the Surge dressing (spine
// white-gold, ripple, trimmed wash, core blaze) can be judged from gameplay.
//   node tools/surgeshot.mjs [dragonKey] [tier]   → /tmp/surge-<key>-t<tier>.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const tier = Number(process.argv[3] ?? 3);
const { page, done } = await boot({
  query: '?debug=fever',
  viewport: { width: 1100, height: 720 },
  deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 50,
    skins: { owned: ['${key}'], equipped: '${key}' },
    ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9 },
    settings: { reticle: false, slowMo: true, qualityOverride: null },
  }))`,
});
await page.click('#btn-start').catch(() => {});
await page.waitForTimeout(2400);
const out = `/tmp/surge-${key}-t${tier}.png`;
await page.screenshot({ path: out, clip: { x: 300, y: 250, width: 500, height: 360 } });
console.log(`wrote ${out}`);
await done();
