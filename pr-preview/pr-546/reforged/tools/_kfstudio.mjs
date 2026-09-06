// karstfang STUDIO sheet (Stage-1 FORM gate) — reuses tools/propstudio.html at the real (r,h,r) instance
// scale. A 2×3 sheet reading the three silhouette signals (top-heavy shoulder / dark marine undercut /
// green scrub crown), the tide-ladder VALUE, the worm's-eye colossal read, and the top plan (yaw-invariance).
//   node tools/_kfstudio.mjs [round] [key]  →  reforged-captures/kf-<key>-<round>.png
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
const round = process.argv[2] || 'k1';
const KEY = process.argv[3] || 'karstfang';
mkdirSync('reforged-captures', { recursive: true });
const srv = await serve();
const browser = await pw.chromium.launch();
const CELL = 560;
const page = await browser.newPage({ viewport: { width: 2 * CELL, height: 3 * CELL }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/propstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const psErr = await page.evaluate(() => document.getElementById('err').textContent);
if (psErr) { console.error('STUDIO ERROR:', psErr); await browser.close(); srv.close?.(); process.exit(1); }
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });
await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [2, 3, CELL]);
const tiles = [
  { render: true, angle: 'front',   bg: 'dusk', rig: 'sunset',  fill: 0.82, label: `${KEY} · front · golden hour (3 signals?)` },
  { angle: 'front3q', bg: 'dusk', rig: 'sunset',  fill: 0.82, label: 'front-¾ · top-heavy shoulder + undercut' },
  { angle: 'side',    bg: 'dark', rig: 'sunset',  fill: 0.84, label: 'side · VALUE (jade tide / honey crown)' },
  { angle: 'low',     bg: 'dusk', rig: 'sunset',  fill: 0.86, label: 'worm’s-eye · colossal sea-stack' },
  { angle: 'top',     bg: 'pale', rig: 'neutral', fill: 0.86, label: 'top plan · yaw-invariance + green crown' },
  { angle: 'front3q', bg: 'pale', rig: 'neutral', fill: 0.82, label: 'front-¾ · form (neutral)' },
];
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  if (i === 0) await page.evaluate((o) => window.psRender(o), { key: KEY, opts: { single: true }, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
}
const path = `reforged-captures/kf-${KEY}-${round}.png`;
writeFileSync(path, await page.screenshot({ clip: clip(2, 3, CELL) }));
console.log('wrote', path);
await browser.close(); srv.close?.();
