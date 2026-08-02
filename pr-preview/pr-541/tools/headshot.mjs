// Head-design QA: renders a dragon's HEAD close-up from four angles (front / 3-4 /
// side / rear) into a montage, so the draconic head house-style can be judged.
//   node tools/headshot.mjs [key] [tier]   →   /tmp/head-<key>.png
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
const page = await browser.newPage({ viewport: { width: 1300, height: 380 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
await page.goto(srv.url + '/tools/headshot.html');
await page.waitForFunction(() => window.__ready, { timeout: 15000 });

const tier = Number(process.argv[3] ?? 3);
const ALL = ['azure', 'ember', 'jade', 'obsidian', 'pearl', 'solar'];
const dragons = process.argv[2] ? [process.argv[2]] : ALL;
for (const key of dragons) {
  await page.evaluate(([k, t]) => window.renderHead(k, t), [key, tier]);
  await page.waitForTimeout(150);
  await (await page.$('#montage')).screenshot({ path: `/tmp/head-${key}.png` });
  console.log(`wrote /tmp/head-${key}.png`);
}
await browser.close();
srv.close();
