// tools/wallstudio.mjs — contact sheet for the Calved Canyon wall mass (Frozen), so the
// reskin can be Fable-checkpointed BEFORE wiring into the canyon. Renders a stretch of
// tiled wall against a BACKLIT sunset (where the old spike run went black) + a frost sky.
//   node tools/wallstudio.mjs [round]  → reforged-captures/wall-<round>.png
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => { const c=[process.env.PLAYWRIGHT_PATH]; try{c.push(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim()+'/playwright');}catch{} c.push('playwright'); for(const x of c){if(!x)continue;try{return require(x);}catch{}} throw new Error('no playwright'); })();

const round = process.argv[2] || 'r1';
mkdirSync('reforged-captures', { recursive: true });
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/wallstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const CELL = 600;
const tiles = [
  { angle: 'q34', bg: 'sunset', hw: 6, rebuild: true, label: 'Calved Canyon · in-channel · BACKLIT sunset' },
  { angle: 'low', bg: 'sunset', hw: 6, rebuild: true, label: 'low approach (flight line) · backlit' },
  { angle: 'side', bg: 'frost', hw: 6, rebuild: true, label: 'side · frost sky (profile read)' },
  { angle: 'q34', bg: 'frost', hw: 9, rebuild: true, label: 'wide masses · frost sky' },
];
await page.evaluate((c) => window.wsSheetInit(c[0], c[1], c[2]), [2, 2, CELL]);
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  await page.evaluate((o) => window.wsRender(o), { ...t });
  await page.evaluate((a) => window.wsTile(a[0], a[1]), [i, t.label]);
}
const clip = { x: 0, y: 0, width: 2 * CELL, height: 2 * CELL };
const path = `reforged-captures/wall-${round}.png`;
writeFileSync(path, await page.screenshot({ clip }));
console.log('wrote', path);
await browser.close();
srv.close?.();
process.exit(0);
