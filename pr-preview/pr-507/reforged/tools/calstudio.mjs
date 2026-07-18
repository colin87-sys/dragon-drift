// tools/calstudio.mjs — STUDIO CONTACT-SHEET driver for the Emberfall Caldera kit,
// mirroring tools/propstudio.mjs but rigged for the biome's EMBER shipping light.
//
//   node tools/calstudio.mjs [round]        (default r1)
//     → reforged-captures/cal-<key>-<round>.png   (2×3: multi-angle, ember + neutral + value)
//
// Each live Caldera archetype ISOLATED on a neutral studio stage through the game's
// ACES pipeline, under the ember key rig (light-from-below) + a flat neutral rig, so
// the design is judged WITHOUT in-game distraction (boss, fog, sun bloom, motion blur).
// The mesh is the SAME geometry the game instances (buildArchetypeMesh) at a
// representative (r,h,r) instance scale — what Fable grades is what ships.
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
const page = await browser.newPage({ viewport: { width: 1720, height: 1680 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/calstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const psErr = await page.evaluate(() => document.getElementById('err').textContent);
if (psErr) { console.error('STUDIO ERROR:', psErr); await browser.close(); srv.close?.(); process.exit(1); }

const keys = await page.evaluate(() => window.psKeys());
const written = [];
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });
const CELL = 520;

// ── per prop: one 2×3 sheet — the ember context read + the value/silhouette reads ──
// 0 front  · ember  · ember-bg  (hero context — silhouette vs the lit horizon band)
// 1 front¾ · ember  · ember-bg  (the columnar rib + descending crest)
// 2 side   · ember  · dark-bg   (VALUE read — hot belly / dark crown, self-lit)
// 3 low    · ember  · ember-bg  (worm's-eye "feel colossal")
// 4 top    · neutral· pale-bg   (footprint plan — the flying game's primary view)
// 5 front¾ · neutral· pale-bg   (proportion / form without the ember drama)
async function propSheet(key) {
  await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [2, 3, CELL]);
  const tiles = [
    { render: true, angle: 'front',   bg: 'ember', rig: 'ember',   fill: 0.80, label: `${key} · front · ember` },
    { angle: 'front3q', bg: 'ember', rig: 'ember',   fill: 0.80, label: 'front-¾ · ember' },
    { angle: 'side',    bg: 'dark',  rig: 'ember',   fill: 0.82, label: 'side · VALUE' },
    { angle: 'low',     bg: 'ember', rig: 'ember',   fill: 0.84, label: 'worm’s-eye' },
    { angle: 'top',     bg: 'pale',  rig: 'neutral', fill: 0.84, label: 'top plan' },
    { angle: 'front3q', bg: 'pale',  rig: 'neutral', fill: 0.80, label: 'front-¾ · form' },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (i === 0) await page.evaluate((o) => window.psRender(o), { key, opts: { single: true }, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/cal-${key}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(2, 3, CELL) }));
  written.push(path); console.log('wrote', path);
}

for (const key of keys) await propSheet(key);

await browser.close();
srv.close?.();
console.log(`\n${written.length} captures written to reforged-captures/ (round ${round}).`);
process.exit(0);
