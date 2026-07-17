// THE LOST LAGOON prop studio — reuses tools/propstudio.html (which already carries a low-warm
// 'sunset' rig + 'neutral' form rig) to judge each lagoon archetype in ISOLATION at its real
// (r,h,r) instance scale. One 2×3 sheet per prop: the golden-hour context reads (apertures against
// the gold), the VALUE read (the tide ladder: jade waterline band / bleached crown), and the plan.
//   node tools/lagoonstudio.mjs [round]  →  reforged-captures/lag-<key>-<round>.png
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
const KEYS = (process.argv[3] ? process.argv[3].split(',') : ['rotunda']);
mkdirSync('reforged-captures', { recursive: true });
const srv = await serve();
const browser = await pw.chromium.launch();
// Viewport MUST be at least as tall as the composited sheet (rows·CELL) — the #sheet canvas is
// position:fixed, so any rows below the viewport fold are silently clipped from the screenshot (the
// bug that ate the 7th arch-verification tile: a 4-row×520 sheet is 2080 CSS tall, > a 1680 viewport).
const page = await browser.newPage({ viewport: { width: 1120, height: 2200 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/propstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const psErr = await page.evaluate(() => document.getElementById('err').textContent);
if (psErr) { console.error('STUDIO ERROR:', psErr); await browser.close(); srv.close?.(); process.exit(1); }
const CELL = 520;
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });
async function propSheet(key) {
  await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [2, 4, CELL]);
  const tiles = [
    { render: true, angle: 'front',   bg: 'dusk', rig: 'sunset',  fill: 0.80, label: `${key} · front · golden hour` },
    { angle: 'front3q', bg: 'dusk', rig: 'sunset',  fill: 0.80, label: 'front-¾ · apertures vs gold' },
    { angle: 'side',    bg: 'dark', rig: 'sunset',  fill: 0.82, label: 'side · VALUE (tide ladder)' },
    { angle: 'low',     bg: 'dusk', rig: 'sunset',  fill: 0.84, label: 'worm’s-eye · colossal' },
    { angle: 'top',     bg: 'pale', rig: 'neutral', fill: 0.84, label: 'top plan · oculus + windows' },
    { angle: 'front3q', bg: 'pale', rig: 'neutral', fill: 0.80, label: 'front-¾ · form' },
    { angle: 'side',    bg: 'dark', rig: 'sunset',  fill: 0.80, label: 'window {0} · pointed arch (+x)' },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (i === 0) await page.evaluate((o) => window.psRender(o), { key, opts: { single: true }, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/lag-${key}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(2, 4, CELL) }));
  console.log('wrote', path);
}
for (const key of KEYS) await propSheet(key);
await browser.close(); srv.close?.();
