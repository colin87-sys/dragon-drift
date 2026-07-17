// tools/obstaclestudio.mjs — STUDIO contact sheets for the in-lane HAZARDS
// (bar / pillar / shard) so they can be reskinned per biome and Fable-gated. Each
// hazard is built in ISOLATION at its REAL collider scale via buildObstacleMesh
// (the propstudio/veilstudio pattern), rendered with and without its collision-
// envelope ghost so a reskin can be proven "visual ≥ hitbox, never less". Renders
// the CURRENT (Frozen-biome) build, so the same sheet is a clean before/after
// plate across PR-3.
//
//   node tools/obstaclestudio.mjs [round]  →  reforged-captures/obstacle-<type>-<round>.png (one 2×2 per hazard)
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
await page.goto(`${srv.url}/tools/obstaclestudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

// Frozen (biome 2) is the reskin target. Each hazard: a hero ¾ read, a head-on
// read (the gameplay approach), a side read, and a ¾ read WITH the collider ghost
// (the fairness proof). The dynamic shard variant gets its own tile.
const BI = 3;   // Emberfall Caldera
const CELL = 560;
const SHEETS = [
  { type: 'bar', name: 'BAR — horizontal log', tiles: [
    { angle: 'q34',    label: 'BAR · Caldera · ¾' },
    { angle: 'headon', label: 'head-on (approach)' },
    { angle: 'side',   label: 'side' },
    { angle: 'q34', hitbox: true, label: '¾ + collider ghost' },
  ] },
  { type: 'pillar', name: 'PILLAR — floor spike', tiles: [
    { angle: 'q34',    label: 'PILLAR · Caldera · ¾' },
    { angle: 'headon', label: 'head-on (approach)' },
    { angle: 'side',   label: 'side' },
    { angle: 'q34', hitbox: true, label: '¾ + collider ghost' },
  ] },
  { type: 'shard', name: 'SHARD — floating octahedron', tiles: [
    { angle: 'q34',    label: 'SHARD · Caldera · ¾' },
    { angle: 'headon', label: 'head-on (approach)' },
    { angle: 'q34', dynamic: true, label: 'dynamic (hot warning glow)' },
    { angle: 'q34', hitbox: true, label: '¾ + collider ghost' },
  ] },
];
const written = [];
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });

for (const sh of SHEETS) {
  await page.evaluate((c) => window.osSheetInit(c[0], c[1], c[2]), [2, 2, CELL]);
  for (let i = 0; i < sh.tiles.length; i++) {
    const t = sh.tiles[i];
    await page.evaluate((o) => window.osRender(o), {
      type: sh.type, bi: BI, angle: t.angle, bg: 'dark',
      hitbox: !!t.hitbox, dynamic: !!t.dynamic, rebuild: true,
    });
    await page.evaluate((a) => window.osTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/calhaz-${sh.type}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(2, 2, CELL) }));
  written.push(path); console.log('wrote', path);
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} obstacle sheets written (round ${round}).`);
process.exit(0);
