// Dedicated rotunda verification sheet the fit-to-bbox 6-tile studio can't frame — uses the studio's
// PROVEN sheet compositor (psSheetInit/psRender/psReframe/psTile centre reliably) with two custom angles:
//   winclose — square on the (+x,+z) window {0} face: rule the pointed-arch LANCET (apex up, no fin/hole).
//   back     — the intact −z hemisphere: exterior gilt MUST be zero (no gold leaked onto an outer face).
//   node tools/_lagoonarch.mjs [round]  →  reforged-captures/lag-archcheck-<round>.png (2×2)
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
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
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/propstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const CELL = 560;
await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [2, 2, CELL]);
const tiles = [
  { render: true, angle: 'winclose', bg: 'dusk', rig: 'sunset',  fill: 0.92, label: 'window {0} · pointed arch (golden)' },
  { angle: 'winclose', bg: 'pale', rig: 'neutral', fill: 0.92, label: 'window {0} · form (apex up, no fin?)' },
  { angle: 'back',     bg: 'dusk', rig: 'sunset',  fill: 0.86, label: 'intact −z back · exterior gilt = 0?' },
  { angle: 'back',     bg: 'dark', rig: 'sunset',  fill: 0.86, label: 'back · VALUE (any gold leak reads)' },
];
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  if (i === 0) await page.evaluate((o) => window.psRender(o), { key: 'rotunda', opts: { single: true }, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
}
const path = `reforged-captures/lag-archcheck-${round}.png`;
writeFileSync(path, await page.screenshot({ clip: { x: 0, y: 0, width: 2 * CELL, height: 2 * CELL } }));
console.log('wrote', path);
await browser.close(); srv.close?.();
