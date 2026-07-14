// tools/gateconcepts.mjs — throwaway concept mockups for the Phase Gate, now as
// FULL-LANE BARRIERS (the corrected mechanic: the wall fills the whole lane and
// forces you through one window — no fly-around). A glowing ring sits BEHIND each
// barrier to prove the route beyond stays visible through it. 4 concepts, head-on
// (the gameplay read) + a ¾, into one sheet so the owner can pick a direction.
//
//   node tools/gateconcepts.mjs  →  reforged-captures/gate-barriers.png
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

mkdirSync('reforged-captures', { recursive: true });
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 2500 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/gateconcepts.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('CONCEPT ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const CELL = 600;
const CONCEPTS = [
  ['fang', 'FANG PORTCULLIS · faceted fangs'],
  ['rain', 'PARTED RAIN · strand curtain'],
  ['shatter', 'HELD SHATTER · frozen explosion'],
  ['maelstrom', 'MAELSTROM IRIS · spiral streaks'],
];
await page.evaluate((c) => window.gcSheetInit(c[0], c[1], c[2]), [2, 4, CELL]);
let q = 0;
for (const [kind, label] of CONCEPTS) {
  await page.evaluate((o) => window.gcRender(o), { kind, angle: 'headon', rebuild: true });
  await page.evaluate((a) => window.gcTile(a[0], a[1]), [q++, `${label} · head-on`]);
  await page.evaluate((o) => window.gcRender(o), { kind, angle: 'q34', rebuild: false });
  await page.evaluate((a) => window.gcTile(a[0], a[1]), [q++, 'same · ¾ (see route beyond)']);
}
writeFileSync('reforged-captures/gate-barriers.png', await page.screenshot({ clip: { x: 0, y: 0, width: 2 * CELL, height: 4 * CELL } }));
console.log('wrote reforged-captures/gate-barriers.png');
await browser.close();
srv.close?.();
process.exit(0);
