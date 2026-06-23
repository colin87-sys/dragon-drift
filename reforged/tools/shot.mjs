// Autonomous dragon screenshotter: renders any roster dragon through the REAL
// WebGL pipeline (tools/shot.html) in headless Chromium and writes PNGs + reports
// its world dimensions (height/width/length) — so the agent can judge proportions
// and chase-cam readability without a human.
//
//   node tools/shot.mjs <dragonKey> [tier] [outDir] [views]
//   e.g. node tools/shot.mjs svjMecha 3 /tmp/shots rear,threeq,side
import { serve } from '../tests/serve.mjs';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright')); }
catch { ({ chromium } = require('playwright')); }

const key = process.argv[2] || 'azure';
const tier = process.argv[3] ?? '3';
const outDir = process.argv[4] || '/tmp/claude-0/-home-user-dragon-drift/cd760551-875c-5e57-b004-41dad2f0ba77/scratchpad';
const views = (process.argv[5] || 'rear,threeq,side').split(',');
mkdirSync(outDir, { recursive: true });

const srv = await serve();
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
let meta = null;
for (const view of views) {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`${srv.url}/tools/shot.html?dragon=${key}&tier=${tier}&view=${view}`, { waitUntil: 'load' });
  try { await page.waitForFunction(() => window.__shotReady === true, { timeout: 20000 }); }
  catch { console.log(`  ! ${view}: render did not signal ready`); }
  await page.waitForTimeout(300);
  meta = await page.evaluate(() => window.__shotMeta);
  const path = `${outDir}/shot-${key}-${view}.png`;
  await page.screenshot({ path });
  console.log(`  ✓ ${view} → ${path}`);
  if (errs.length) console.log(`    errors: ${errs.slice(0, 3).join(' | ')}`);
  await page.close();
}
if (meta) {
  console.log(`\n  ${key} (tier ${tier}) world size:  height ${meta.height}  ·  width ${meta.width}  ·  length ${meta.length}  ·  bounding R ${meta.radius}`);
  console.log(`  aspect: height/length ${(meta.height / meta.length).toFixed(2)}  ·  height/width ${(meta.height / meta.width).toFixed(2)}`);
}
await browser.close(); await srv.close?.();
