// Renders the wing-lab anatomy plates from reforged/wing-lab/refs/wing-spec.json.
//   node tools/wingplate.mjs            → all plates
//   node tools/wingplate.mjs skeleton   → one
// Output: reforged/wing-lab/refs/plate-<name>.png  (shared by every agent in the lab)
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
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
await page.goto(srv.url + '/tools/wingplate.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });

const ALL = ['skeleton', 'camber', 'heat'];
for (const name of (process.argv[2] ? [process.argv[2]] : ALL)) {
  await page.evaluate(n => window.drawPlate(n), name);
  await page.waitForTimeout(80);
  const out = `reforged/wing-lab/refs/plate-${name}.png`;
  await (await page.$('#plate')).screenshot({ path: out });
  console.log('wrote ' + out);
}
await browser.close();
srv.close();
