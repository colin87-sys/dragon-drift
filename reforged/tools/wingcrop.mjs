// tools/wingcrop.mjs — capture the Wing Lab (winglab.html) for the design gate.
//   node tools/wingcrop.mjs <roundTag> [views...]     views ∈ front, threequarter
// Writes reforged-captures/angelwing-<roundTag>-<view>.png (900x1200 portrait).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'node:fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_PATH];
  try { candidates.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch { /* no npm */ }
  candidates.push('playwright');
  for (const c of candidates) { if (!c) continue; try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not found — set PLAYWRIGHT_PATH');
}

const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const roundTag = process.argv[2] || 'r1';
const views = process.argv.slice(3).length ? process.argv.slice(3) : ['front', 'threequarter'];

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('pageerror:', String(e)); process.exitCode = 3; });
page.on('console', (m) => { if (m.type() === 'error') { console.error('console:', m.text()); process.exitCode = 3; } });

try {
  for (const view of views) {
    await page.goto(`${srv.url}/winglab.html?view=${view}`);
    await page.waitForFunction(() => window.__wing && window.__wing.ready, { timeout: 15000 });
    await page.waitForTimeout(300);
    const path = `${OUT}angelwing-${roundTag}-${view}.png`;
    await page.screenshot({ path });
    console.log(`wrote ${path}`);
  }
} finally {
  await browser.close();
  srv.close();
}
console.log('wingcrop done.');
