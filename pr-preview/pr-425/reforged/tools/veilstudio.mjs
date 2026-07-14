// tools/veilstudio.mjs — STUDIO contact sheets for the Phase Gate SERENE VEIL
// STYLES (swirl / wisp / curtain — the crystal-wall redesign). Renders each style
// in isolation against a sky gradient, across two biomes and two angles, so each can
// be Fable-gated to the premium bar. The gate is the REAL in-game build
// (buildStudioGate → buildGate with setVeilStyle), so what's judged is what ships.
//
//   node tools/veilstudio.mjs [round]  →  reforged-captures/veil-<style>-<round>.png (one 2×2 per style)
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

const STYLES = [['swirl', 'AURORA SWIRL'], ['wisp', 'WISP VEIL'], ['curtain', 'LIGHT CURTAIN']];
const CELL = 560;
const written = [];
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });

for (const [style, name] of STYLES) {
  await page.evaluate((c) => window.vsSheetInit(c[0], c[1], c[2]), [2, 2, CELL]);
  const tiles = [
    { bi: 0, angle: 'headon', bg: 'dusk', rebuild: true, label: `${name} · Sanctuary · head-on` },
    { bi: 0, angle: 'q34', bg: 'dusk', label: 'Sanctuary · ¾' },
    { bi: 2, angle: 'headon', bg: 'sunset', rebuild: true, label: 'Frozen · head-on (bright sky)' },
    { bi: 5, angle: 'headon', bg: 'dark', rebuild: true, label: 'Astral · head-on (dark)' },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    await page.evaluate((o) => window.vsRender(o), { style, bi: t.bi, angle: t.angle, bg: t.bg, rebuild: !!t.rebuild, t: 2.0, spin: 0.5 });
    await page.evaluate((a) => window.vsTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/veil-${style}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(2, 2, CELL) }));
  written.push(path); console.log('wrote', path);
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} veil-style sheets written (round ${round}).`);
process.exit(0);
