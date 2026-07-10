// Full-frame gameplay capture WITH the course visible — to judge whether the dragon's
// signature OCCLUDES the forward play view in the real chase cam. NOT cleanshot (rings stay).
//   node tools/framecap.mjs <dragonKey> [spectacle] [waitMs]
import { boot } from '../tests/browser.mjs';
const key = process.argv[2] || 'solar';
const spectacle = process.argv[3] || '';
const waitMs = parseInt(process.argv[4] || '3500', 10);
const VIEW = { width: 1280, height: 720 };
const save = (owned) => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 999999,
  skins: { owned: ['${owned}'], equipped: '${owned}' },
  ascension: { tiers: [['${owned}', 4]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true },
  stats: { runs: 5 },
  settings: { reticle: false },
}))`;
const q = spectacle ? `?debug&spectacle=${spectacle}` : '?debug';
const { page, errors, done } = await boot({ query: q, viewport: VIEW, deviceScaleFactor: 1, initScript: save(key) });
await page.click('#btn-start').catch(() => {});
await page.waitForTimeout(waitMs);
const out = `/tmp/frame-${key}${spectacle ? '-' + spectacle : ''}.png`;
await page.screenshot({ path: out });
console.log(`wrote ${out}  (errors: ${errors.length})`);
if (errors.length) console.log(errors.slice(0, 3).join('\n'));
await done();
