// tools/wingshot.mjs — render the isolated seraph wing to front + profile + 3/4 PNGs.
//   node tools/wingshot.mjs [round]
//     → reforged-captures/wing-front-<round>.png
//     → reforged-captures/wing-profile-<round>.png
//     → reforged-captures/wing-threeq-<round>.png
// Drives tools/wingstudio.html (window.wsView) headlessly through Playwright/Chromium.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const round = process.argv[2] || 'r1';
mkdirSync('reforged-captures', { recursive: true });

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/wingstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => { const e = document.getElementById('err'); return e && e.style.display === 'block' ? e.textContent : ''; });
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const written = [];
for (const view of ['front', 'profile', 'threeq']) {
  await page.evaluate((v) => window.wsView(v), view);
  const path = `reforged-captures/wing-${view}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: { x: 0, y: 0, width: 900, height: 900 } }));
  written.push(path); console.log('wrote', path);
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} wing captures written (round ${round}).`);
process.exit(0);
