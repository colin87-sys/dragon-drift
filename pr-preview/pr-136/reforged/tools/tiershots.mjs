// Renders each dragon at all 6 ascension tiers into a montage PNG.
//   node tools/tiershots.mjs   →   /tmp/tier-<dragon>.png
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
const page = await browser.newPage({ viewport: { width: 1900, height: 420 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
await page.goto(srv.url + '/tools/tiershots.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });

// Render one dragon if a key is given (node tiershots.mjs <key>), else the roster.
const ALL = ['azure', 'ember', 'jade', 'obsidian', 'pearl', 'solar', 'phoenix', 'astralWyrm', 'water', 'fire', 'earth'];
const dragons = process.argv[2] ? [process.argv[2]] : ALL;
for (const key of dragons) {
  await page.evaluate(k => window.renderDragon(k), key);
  await page.waitForTimeout(120);
  await (await page.$('#montage')).screenshot({ path: `/tmp/tier-${key}.png` });
  console.log(`wrote /tmp/tier-${key}.png`);
}
await browser.close();
srv.close();
