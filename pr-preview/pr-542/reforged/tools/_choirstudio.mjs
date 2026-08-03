// _choirstudio.mjs — PR-5 isolated FORM gate for the choirstones court (and the sentinel beside it
// for scale/grammar comparison). Renders the SAME geometry the game instances, on the studio's bright
// flat 'neutral' rig + 'pale' backdrop (the closest studio analogue to the Empyrean's shadowless pearl
// field), so the SILHOUETTE + congregation read can be judged deterministically without the 60s in-game
// boot. Color/theology is judged on the in-biome scan; this sheet judges FORM (per the sentinel lesson:
// silhouette first). One 3×2 sheet per prop.
//   node tools/_choirstudio.mjs [round]   → reforged-captures/empyprop-<key>-<round>.png
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
const page = await browser.newPage({ viewport: { width: 1720, height: 1120 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/propstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const CELL = 520;
const clip = (cols, rows) => ({ x: 0, y: 0, width: cols * CELL, height: rows * CELL });

async function sheet(key) {
  await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [3, 2, CELL]);
  const tiles = [
    { angle: 'front',   bg: 'pale', rig: 'neutral', fill: 0.80, label: `${key} · front` },
    { angle: 'front3q', bg: 'pale', rig: 'neutral', fill: 0.80, label: 'front-¾' },
    { angle: 'side',    bg: 'pale', rig: 'neutral', fill: 0.82, label: 'side' },
    { angle: 'low',     bg: 'slate', rig: 'neutral', fill: 0.86, label: 'worm’s-eye' },
    { angle: 'front3q', bg: 'dark', rig: 'neutral', fill: 0.80, label: 'value (rose read)' },
    { angle: 'top',     bg: 'pale', rig: 'neutral', fill: 0.84, label: 'top plan' },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (i === 0) await page.evaluate((o) => window.psRender(o), { key, opts: { single: true }, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/empyprop-${key}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(3, 2) }));
  console.log('wrote', path);
}

const KEYS = process.argv[3] ? process.argv[3].split(',') : ['choirstones', 'sentinel'];
for (const key of KEYS) await sheet(key);
await browser.close(); srv.close?.();
console.log('done.');
