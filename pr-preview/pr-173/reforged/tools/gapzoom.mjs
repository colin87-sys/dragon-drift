// Extreme close-up of the RIGHT wing-root junction (where the V-notch gap was),
// high-DPR + clipped, so the seam fills the frame.
//   node tools/gapzoom.mjs [tier]  → /tmp/gapzoom-<tag>.png
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  for (const c of [process.env.PLAYWRIGHT_PATH, execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright', 'playwright']) {
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('playwright not found');
})();
const tier = process.argv[2] ?? '3';
const tag = process.argv[3] ?? 'after';
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 600 }, deviceScaleFactor: 3 });
// rear-3/4 from slightly below — the right wing root sits upper-right of centre.
const q = `?dragon=flameMonarch&tier=${tier}&az=0.7&pol=1.12&zoom=0.34`;
await page.goto(srv.url + '/tools/modelviewer.html' + q);
await page.waitForTimeout(1400);
// clip a box around the right wing root (px in CSS units; dpr scales internally).
await page.screenshot({ path: `/tmp/gapzoom-${tag}.png`, clip: { x: 330, y: 150, width: 340, height: 320 } });
console.log(`wrote /tmp/gapzoom-${tag}.png`);
await browser.close(); srv.close();
