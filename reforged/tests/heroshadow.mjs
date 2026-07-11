// N6 hero shadow (GRAPHICS-OVERHAUL.md): the ?shadow / DRAGON SHADOW silhouette
// pass must render the dragon alone into its RT (coverage in a sane wingspan
// range), the plane must sample it, and OFF must fall back to the shipped blob —
// all with no console errors.
//   node tests/heroshadow.mjs
import { boot, check } from './browser.mjs';

const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 0 },
}))`;

async function run(shadow) {
  const query = `?debug&cleanshot&seed=73101${shadow ? '&shadow' : ''}`;
  const { page, errors, done } = await boot({ query, viewport: { width: 900, height: 600 }, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 25, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => ({ on: window.__dd.shadow.on(), coverage: window.__dd.shadow.coverage() }));
  await done();
  return { ...r, errors: errors.length };
}

const on = await run(true);
const off = await run(false);

check('?shadow: silhouette mode active', on.on === true);
check(`?shadow: dragon renders into the RT (coverage ${on.coverage.toFixed(4)} in [0.01, 0.6])`, on.coverage > 0.01 && on.coverage < 0.6);
check('?shadow: no console errors', on.errors === 0);
check('default: silhouette OFF (shipped blob fallback)', off.on === false);
check('default: RT not rendered (coverage ~0)', off.coverage <= 0.001);
check('default: no console errors', off.errors === 0);
