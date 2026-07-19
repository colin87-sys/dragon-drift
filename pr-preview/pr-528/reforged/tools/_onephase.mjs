// One-phase flap capture — a single browser boot per node process (the 5-boot flapstrip
// crashes the shared browser on the 3rd boot in this env). Same freeze/clip as flapstrip.
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { boot } from '../tests/browser.mjs';
const require = createRequire(import.meta.url);
const key = process.argv[2] || 'tempest';
const phase = process.argv[3] || 'apex';
const tier = Number(process.argv[4] ?? 3);
const VIEW = { width: 1100, height: 720 };
const CLIP = { x: 300, y: 250, width: 500, height: 360 };
const { page, done } = await boot({
  query: `?debug&wingDebug=${phase}`,
  viewport: VIEW,
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
for (let a = 0; a < 6; a++) {
  await page.click('#btn-start').catch(() => {});
  if (await page.waitForSelector('#btn-start', { state: 'hidden', timeout: 1500 }).then(() => true, () => false)) break;
}
await page.waitForTimeout(2200);
const out = `/tmp/flap-${key}-${phase}.png`;
await page.screenshot({ path: out, clip: { ...CLIP } });
console.log(`wrote ${out}`);
await done();
