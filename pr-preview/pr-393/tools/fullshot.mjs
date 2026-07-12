// Full-frame gameplay screenshot (whole screen, not cropped) to judge how much
// of the path ahead is visible. Add 'fever' to force Dragon Surge.
//   node tools/fullshot.mjs [key] [tier] [fever?]  → /tmp/full-<key>-t<tier>[-fever].png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const tier = Number(process.argv[3] ?? 3);
const fever = process.argv[4] === 'fever';
const { page, done } = await boot({
  query: fever ? '?debug=fever' : '?debug',
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
const out = `/tmp/full-${key}-t${tier}${fever ? '-fever' : ''}.png`;
await page.screenshot({ path: out });
console.log(`wrote ${out}`);
await done();
