// One-off diagnostic: capture Nimbus live in the shop hero scene (real shaded
// WebGL, chase-cam framing) at its apex form. Standalone launch with software-GL
// flags so headless chromium actually rasterizes WebGL. node tools/nimbusshot.mjs
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
let pw;
for (const c of [execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright', 'playwright']) {
  try { pw = require(c); break; } catch { /* next */ }
}

const srv = await serve();
const browser = await pw.chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 460, height: 940 }, deviceScaleFactor: 3 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(`localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, stats: { runs: 9 }, flags: { seenIntro: true }, embers: 1000000,
  settings: { dev: true },
  skins: { owned: ['nimbus'], equipped: 'nimbus' },
  ascension: { tiers: [['nimbus',2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [['nimbus',2]] },
}))`);
await page.goto(srv.url + '/?debug&dev');
await page.waitForFunction(() => !!window.__dd, { timeout: 20000 });
await page.evaluate(() => window.__dd.toHub && window.__dd.toHub());
await page.evaluate(() => window.__dd.ui.showScreen('shop'));
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/nimbus-live-default.png' });
console.log('wrote default');
await page.click('.hero-forms .hero-seg[data-form="2"]').catch(() => {});
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/nimbus-live-apex.png' });
console.log('wrote apex');

// (For clean geometry reads at arbitrary angles — e.g. wing-strut camber — use
// tools/clayshot.mjs, which renders the procedural mesh flat-lit without the
// shop's blowout lighting. This tool is the LIT ground-truth of the shop scene.)
console.log('console errors:', errors.length ? errors.slice(0, 6) : 'none');
await browser.close();
srv.close();
process.exit(0);
