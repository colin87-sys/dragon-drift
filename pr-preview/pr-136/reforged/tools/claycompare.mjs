// Renders ONE dragon at Eternal in a flat CLAY material from three angles, so the
// silhouette/curves can be compared directly against a reference clay sculpt.
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tools/claycompare.mjs furyDrake [tier]
//   → /tmp/clay-<dragon>.png
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const { chromium } = loadPlaywright();
const key = process.argv[2] || 'furyDrake';
const tier = process.argv[3] ? Number(process.argv[3]) : 3;
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 540 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(srv.url + '/tools/claycompare.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });
await page.evaluate(([k, t]) => window.renderClay(k, t), [key, tier]);
await page.waitForTimeout(150);
await (await page.$('#montage')).screenshot({ path: `/tmp/clay-${key}.png` });
console.log(`wrote /tmp/clay-${key}.png`);
await browser.close();
srv.close();
