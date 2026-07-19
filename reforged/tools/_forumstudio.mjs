// FORUM STUDIO sheet (Stage-1 FORM gate) — clone of _cwstudio tuned for the ARENA (a curved bowl): the
// broadside-¾ that reads the plan-curve + arch rank, a low ¾ into the flooded interior, the worm's-eye mass
// read, the down-lane receding read, and — critically for the amphitheater name-test — the TOP PLAN (does the
// footprint read as a curved elliptical arc, not a straight aqueduct chunk?). Builds via buildArchetypeMesh (no
// gating/scrolling). node tools/_forumstudio.mjs [round] [key] [rx] [hy] [ry]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';
const require = createRequire(import.meta.url);
const pw = (() => { const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright'); for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found'); })();
const round = process.argv[2] || 'r1';
const KEY = process.argv[3] || 'arena';
const RX = parseFloat(process.argv[4] || '44');
const HY = parseFloat(process.argv[5] || '40');
const RY = parseFloat(process.argv[6] || '0');
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
const inst = [RX, HY];
const tiles = [
  { render: true, angle: 'front3q', bg: 'dusk', rig: 'sunset', fill: 0.82, label: `${KEY} · front-¾ · curved arch rank + bowl (NAME it: amphitheater?)` },
  { angle: 'low',     bg: 'dusk', rig: 'sunset', fill: 0.82, label: 'low ¾ · INTO the flooded bowl · gold through the ground bays?' },
  { angle: 'side',    bg: 'dark', rig: 'sunset', fill: 0.86, label: 'side · the quarter-arc profile + tier stepping + tide VALUE' },
  { angle: 'front',   bg: 'dusk', rig: 'sunset', fill: 0.80, label: 'down-lane · receding curved rank (the in-lane read)' },
  { angle: 'top',     bg: 'pale', rig: 'neutral', fill: 0.86, label: 'TOP PLAN · curved ELLIPSE arc (not a straight chunk) — the name-test' },
  { angle: 'front3q', bg: 'pale', rig: 'neutral', fill: 0.82, label: 'front-¾ · form (neutral)' },
];
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  if (i === 0) await page.evaluate((o) => window.psRender(o), { key: KEY, opts: { single: true }, inst, ry: RY, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
}
const path = `reforged-captures/forum-${KEY}-${round}.png`;
writeFileSync(path, await page.screenshot({ clip: clip(2, 3, CELL) }));
console.log('wrote', path);
await browser.close(); srv.close?.();
