// Headless capture of the Celestial Storm 3D previewer (tools/celestial3D.html) at several angles, so the
// extrusion can be verified without a browser and judged against the silhouette.
//   node tools/celestial3Dshot.mjs   →   /tmp/c3d-<angle>.png
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
const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
let err = null;
page.on('pageerror', e => { err = String(e); console.error('PAGEERROR', err); });
page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(srv.url + '/tools/celestial3D.html');
await page.waitForFunction(() => window.__ready, { timeout: 20000 });

const angles = [['rear', 0, 0.22], ['rear-high', 0, 0.5], ['q34', 0.7, 0.3], ['side', 1.571, 0.12]];
const gl = await page.$('#gl');
for (const [name, yaw, pitch] of angles) {
  await page.evaluate(([y, p]) => window.__view(y * 180 / Math.PI, p, false), [yaw, pitch]);
  await page.waitForTimeout(180);
  await gl.screenshot({ path: `/tmp/c3d-${name}.png` });
  console.log(`wrote /tmp/c3d-${name}.png`);
}
// zoomed rear-body shot — judge the dorsal spine diamonds + plate alignment up close
await page.evaluate(() => window.__view(0, 0.18, false));
await page.evaluate(() => window.__zoom(0.45));
await page.waitForTimeout(180);
await gl.screenshot({ path: '/tmp/c3d-rear-zoom.png' });
console.log('wrote /tmp/c3d-rear-zoom.png');

// flap poses (wings raised / lowered) from rear-high, to verify the beat is dorsoventral (through depth)
for (const [name, a] of [['flap-up', 0.6], ['flap-down', -0.6]]) {
  await page.evaluate(([y, p]) => window.__view(y * 180 / Math.PI, p, false), [0, 0.5]);
  await page.evaluate((a) => window.__flapPose(a), a);
  await page.waitForTimeout(120);
  await gl.screenshot({ path: `/tmp/c3d-${name}.png` });
  console.log(`wrote /tmp/c3d-${name}.png`);
}
// QUARTER-PHASE sweep — side + rear-high — to verify the figure-eight tip path + stroke asymmetry
for (const [view, yaw, pitch] of [['side', 1.571, 0.12], ['rearhi', 0, 0.5]]) {
  for (const u of [0, 0.25, 0.5, 0.75]) {
    await page.evaluate(([y, p]) => window.__view(y * 180 / Math.PI, p, false), [yaw, pitch]);
    await page.evaluate((u) => window.__flapPhase(u), u);
    await page.waitForTimeout(80);
    await gl.screenshot({ path: `/tmp/c3d-flap-${view}-${Math.round(u * 100)}.png` });
  }
  console.log(`wrote /tmp/c3d-flap-${view}-{0,25,50,75}.png`);
}
console.log(err ? 'HAD PAGEERROR' : 'no pageerror');
await browser.close();
await srv.close();
process.exit(0);
