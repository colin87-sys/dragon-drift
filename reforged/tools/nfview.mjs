// Clean single-dragon multi-angle render for the Night-Fury convergence loop.
// Renders one dragon (default toothless, Eternal) on a neutral lit stage at several
// yaw angles — FRONT(180), ¾-front(135), side(90), ¾-rear(45), rear(0) — large, so
// the silhouette can be compared against the Toothless reference imagery.
//   node tools/nfview.mjs [key] [tier]   →   /tmp/nfv-<key>-<angle>.png
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

const key = process.argv[2] || 'toothless';
const tier = Number(process.argv[3] ?? 3);
const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 840, height: 840 }, deviceScaleFactor: 2 });
let err = null;
page.on('pageerror', e => { err = String(e); console.error('PAGEERROR', err); });
page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(srv.url + '/tools/nfview.html');
await page.waitForFunction(() => window.__ready, { timeout: 20000 });

const angles = [['front', 180], ['q34', 135], ['side', 90], ['q34rear', 45], ['rear', 0]];
const gl = await page.$('#gl');
for (const [name, yaw] of angles) {
  await page.evaluate(([k, t, y]) => window.renderAngle(k, t, y), [key, tier, yaw]);
  await page.waitForTimeout(120);
  await gl.screenshot({ path: `/tmp/nfv-${key}-${name}.png` });
  console.log(`wrote /tmp/nfv-${key}-${name}.png`);
}
console.log(err ? 'HAD PAGEERROR' : 'no pageerror');
await browser.close();
await srv.close();
process.exit(0);
