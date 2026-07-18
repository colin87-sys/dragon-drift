// tools/propstudio.mjs — the STUDIO CONTACT-SHEET driver for the Frozen (Sunset
// Glacier) wall props, mirroring tools/dragonstudio.mjs but for environment props.
//
//   node tools/propstudio.mjs [round]        (default r1)
//     → reforged-captures/prop-<key>-<round>.png    (2×2: context + silhouette + plan, per prop)
//     → reforged-captures/prop-sungate-gate-<round>.png  (the paired GATE, multi-view)
//
// Renders each live Frozen archetype ISOLATED on a neutral studio stage (the game's
// ACES pipeline, a low-sun "sunset" rig that raking-lights the ice + a flat neutral
// rig), so the prop design can be judged WITHOUT in-game distractions (boss, fog,
// sun bloom, motion). Every frame is a pure function of (key, opts, angle, bg, rig)
// — no clock, no seed churn — so rounds are pixel-comparable.
//
// The prop mesh is the SAME geometry the game instances (environment.buildArchetypeMesh),
// at a representative in-game (r,h,r) instance scale, so what Fable grades is what ships.
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
const psErr = await page.evaluate(() => document.getElementById('err').textContent);
if (psErr) { console.error('STUDIO ERROR:', psErr); await browser.close(); srv.close?.(); process.exit(1); }

const keys = await page.evaluate(() => window.psKeys());
const written = [];
const clip = (cols, rows, cell) => ({ x: 0, y: 0, width: cols * cell, height: rows * cell });
const CELL = 520;

// ── per prop: one 2×2 sheet — context (sunset/dusk) + silhouette (pale) + plan (top) ──
// TL front·dusk·sunset (hero context) · TR ¾·dusk·sunset · BL side·pale·sunset (form)
// · BR top·pale·neutral (footprint plan).
async function propSheet(key) {
  await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [2, 2, CELL]);
  const tiles = [
    { render: true, angle: 'front',   bg: 'dusk', rig: 'sunset',  fill: 0.80, label: `${key} · front` },
    { angle: 'front3q', bg: 'dusk', rig: 'sunset',  fill: 0.80, label: 'front-¾' },
    { angle: 'side',    bg: 'pale', rig: 'sunset',  fill: 0.82, label: 'side' },
    { angle: 'top',     bg: 'pale', rig: 'neutral', fill: 0.84, label: 'top plan' },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (i === 0) await page.evaluate((o) => window.psRender(o), { key, opts: { single: true }, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
    await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
  }
  const path = `reforged-captures/prop-${key}-${round}.png`;
  writeFileSync(path, await page.screenshot({ clip: clip(2, 2, CELL) }));
  written.push(path); console.log('wrote', path);
}

for (const key of keys) await propSheet(key);

// ── the SUN GATE — dedicated 3×2 gate sheet (the paired hero read) ────────────
// 0 gate front · real ±x spacing (honest in-game doorway) · dusk
// 1 gate front · tight (gapScale .4 — the intended doorway composition) · dusk
// 2 gate LOW worm's-eye · tight · dusk (the "feel small" hero read)
// 3 single post · front-¾ · pale (pylon silhouette detail)
// 4 single post · side · pale (pylon profile / banding)
// 5 single post · front-¾ · dusk·sunset (material read — gold rim vs cyan seam)
if (keys.includes('sungate')) {
  await page.evaluate((c) => window.psSheetInit(c[0], c[1], c[2]), [3, 2, CELL]);
  const gate = [
    { opts: { gapScale: 1 },   angle: 'front', bg: 'dusk', rig: 'sunset', fill: 0.90, label: 'gate · real spacing' },
    { opts: { gapScale: 0.4 }, angle: 'front', bg: 'dusk', rig: 'sunset', fill: 0.86, label: 'gate · tight' },
    { opts: { gapScale: 0.4 }, angle: 'low',   bg: 'dusk', rig: 'sunset', fill: 0.82, label: 'gate · worm’s-eye' },
    { opts: { single: true },  angle: 'front3q', bg: 'pale', rig: 'sunset', fill: 0.80, label: 'post · ¾' },
    { opts: { single: true },  angle: 'side',  bg: 'pale', rig: 'sunset', fill: 0.82, label: 'post · side' },
    { opts: { single: true },  angle: 'front3q', bg: 'dusk', rig: 'sunset', fill: 0.80, label: 'post · material' },
  ];
  for (let i = 0; i < gate.length; i++) {
    const g = gate[i];
    await page.evaluate((o) => window.psRender(o), { key: 'sungate', opts: g.opts, angle: g.angle, bg: g.bg, rig: g.rig, fill: g.fill });
    await page.evaluate((a) => window.psTile(a[0], a[1]), [i, g.label]);
  }
  const gpath = `reforged-captures/prop-sungate-gate-${round}.png`;
  writeFileSync(gpath, await page.screenshot({ clip: clip(3, 2, CELL) }));
  written.push(gpath); console.log('wrote', gpath);
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} captures written to reforged-captures/ (round ${round}).`);
process.exit(0);
