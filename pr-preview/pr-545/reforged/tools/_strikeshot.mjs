// Storm-strike capture — boots the game with ?strikePin=<t01> (the pulseTimer frozen at a named
// point: 0 = standing/hum, 0.5 = strike peak) at a fixed glide wing pose, and screenshots the
// chase cam. Exercises the §5d storm tick at runtime. node tools/_strikeshot.mjs <key> <pin>
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { boot } from '../tests/browser.mjs';
const require = createRequire(import.meta.url);
const key = process.argv[2] || 'tempest';
const pin = process.argv[3] ?? '0.5';
const tier = Number(process.argv[4] ?? 3);
const VIEW = { width: 1100, height: 720 };
const CLIP = { x: 300, y: 250, width: 500, height: 360 };
const { page, done } = await boot({
  query: `?debug&wingDebug=glide&strikePin=${pin}`,
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
const tag = String(pin).replace('.', 'p');
const out = `/tmp/storm-${key}-pin${tag}.png`;
await page.screenshot({ path: out, clip: { ...CLIP } });
console.log('wrote', out);
await done();
