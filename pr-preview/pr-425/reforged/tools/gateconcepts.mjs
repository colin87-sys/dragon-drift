// tools/gateconcepts.mjs — SERENE / MAGICAL full-lane barrier concepts for the
// Phase Gate (owner vibe: "serene magical"). Each fills the whole 32x24 lane so
// there's no fly-around, keeps a mandatory window, stays see-through (a glowing
// ring sits behind to prove it), and is built from soft light — lines + additive
// motes (cheap). 3 concepts × head-on + ¾.
//
//   node tools/gateconcepts.mjs  →  reforged-captures/gate-serene.png
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
const page = await browser.newPage({ viewport: { width: 1300, height: 2000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/gateconcepts.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('CONCEPT ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const CELL = 620;
const CONCEPTS = [
  ['curtain', 'LIGHT CURTAIN · parted veil of light'],
  ['swirl', 'AURORA SWIRL · slow spiral to a calm eye'],
  ['wisp', 'WISP VEIL · a field of spirits, an open eye'],
];
await page.evaluate((c) => window.gcSheetInit(c[0], c[1], c[2]), [2, 3, CELL]);
let q = 0;
for (const [kind, label] of CONCEPTS) {
  await page.evaluate((o) => window.gcRender(o), { kind, angle: 'headon', rebuild: true });
  await page.evaluate((a) => window.gcTile(a[0], a[1]), [q++, `${label} · head-on`]);
  await page.evaluate((o) => window.gcRender(o), { kind, angle: 'q34', rebuild: false });
  await page.evaluate((a) => window.gcTile(a[0], a[1]), [q++, 'same · ¾ (see route beyond)']);
}
writeFileSync('reforged-captures/gate-serene.png', await page.screenshot({ clip: { x: 0, y: 0, width: 2 * CELL, height: 3 * CELL } }));
console.log('wrote reforged-captures/gate-serene.png');
await browser.close();
srv.close?.();
process.exit(0);
