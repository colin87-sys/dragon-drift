// Vision-tagger renders for the GLB auto-rig: flat-lit clay ORTHOGRAPHIC top +
// side views of an asset-backed dragon (placement from its def.glb), with a
// labeled world-coordinate grid — so Claude can mark the skeleton joints
// (def.glb.rig.joints) by READING the images, replacing both the manual
// glbtagger interface and the brittle window heuristics.
//
//   node tools/rigshots.mjs <dragonKey>     → /tmp/rigshot-<key>-top.png
//                                             /tmp/rigshot-<key>-side.png
//                                             prints the view rects (world coords)
//
// TOP view:  screen up = −z (head at top), screen right = +x.
// SIDE view: screen up = +y, screen right = −z (head at the RIGHT).
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

const key = process.argv[2] || 'verdant';
const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_EXE || undefined,
});
const page = await browser.newPage({ viewport: { width: 940, height: 1880 } });
page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
await page.goto(`${srv.url}/tools/rigshots.html?key=${encodeURIComponent(key)}`);
await page.waitForFunction(() => window.__ready, { timeout: 30000 });

await (await page.$('#top')).screenshot({ path: `/tmp/rigshot-${key}-top.png` });
await (await page.$('#side')).screenshot({ path: `/tmp/rigshot-${key}-side.png` });
const rects = await page.evaluate(() => window.__rects);
console.log(`wrote /tmp/rigshot-${key}-top.png + -side.png`);
console.log('rects:', JSON.stringify(rects));

await browser.close();
srv.close();
