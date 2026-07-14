// tools/veilstudio.mjs — STUDIO contact sheets for the Phase Gate veil ("crystal
// wall"), the propstudio pattern applied to the gate. Renders one gate per biome in
// ISOLATION against a sky gradient (the veil is transparent → judged against a sky;
// the bright sunset backdrop is the legibility stress test), from head-on (the
// gameplay read) · ¾ · grazing-side (fresnel edges + facet flash) · a membrane
// detail crop. No boss/fog/spawn fight — reproducible, close, controllable.
//
//   node tools/veilstudio.mjs [round]
//     → reforged-captures/veil-<biome>-<round>.png   (2×2 per biome)
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
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/veilstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const BIOMES = [[0, 'sanctuary'], [2, 'frozen'], [3, 'caldera'], [5, 'astral']];
const CELL = 560;
const written = [];
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });

for (const [bi, name] of BIOMES) {
  await page.evaluate((c) => window.vsSheetInit(c[0], c[1], c[2]), [2, 2, CELL]);
  const tiles = [
    { angle: 'headon', bg: 'sunset', rebuild: true, label: `${name} · head-on (bright sky)` },
    { angle: 'q34',    bg: 'sunset', label: 'front-¾' },
    { angle: 'side',   bg: 'dusk',   label: 'grazing side' },
    { angle: 'detail', bg: 'dark',   label: 'membrane detail' },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    await page.evaluate((o) => window.vsRender(o), { bi, angle: t.angle, bg: t.bg, rebuild: !!t.rebuild, t: 1.2 });
    await page.evaluate((a) => window.vsTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/veil-${name}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(2, 2, CELL) }));
  written.push(path); console.log('wrote', path);
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} veil sheets written (round ${round}).`);
process.exit(0);
