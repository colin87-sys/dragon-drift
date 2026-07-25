// Renders the HERO character-select mockup (tools/heromock.html) to high-res PNGs
// for design sign-off — several states so the navigation reads clearly.
//   node tools/heromock.mjs   →   /tmp/hero-<state>.png
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
// deviceScaleFactor 3 → 1380×2820 backing store (crisp high-res screenshots).
const page = await browser.newPage({ viewport: { width: 460, height: 940 }, deviceScaleFactor: 3 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(srv.url + '/tools/heromock.html');
await page.waitForFunction(() => window.__ready, { timeout: 20000 });

const shots = [
  ['obsidian-eternal', 'obsidian', 3, 'equipped'],
  ['solar-eternal', 'solar', 3, 'owned'],
  ['obsidian-hatchling', 'obsidian', 0, 'owned'],
  ['jade-locked', 'jade', 2, 'locked'],
];
for (const [name, key, tier, state] of shots) {
  await page.evaluate(([k, t, s]) => window.renderHero(k, t, s), [key, tier, state]);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `/tmp/hero-${name}.png` });
  console.log(`wrote /tmp/hero-${name}.png`);
}
await browser.close();
srv.close();
