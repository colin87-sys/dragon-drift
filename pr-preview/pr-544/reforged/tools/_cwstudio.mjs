// causeway/rampart STUDIO sheet (Stage-1 FORM gate) — like _kfstudio but renders the prop at its real
// (r,h,r) INSTANCE scale (o.inst) so a long-LOW horizontal near-rail reads at its true proportion, not as a
// unit cube, and with angles that read a WALL: the long gallery face, the length + broken ends, the worm's-
// eye lane-framing read, the down-the-length receding read, and the top plan (lane-parallel, thin).
//   node tools/_cwstudio.mjs [round] [key] [rx] [hy]  →  reforged-captures/cw-<key>-<round>.png
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
const round = process.argv[2] || 'c1';
const KEY = process.argv[3] || 'causeway';
const RX = parseFloat(process.argv[4] || '9');   // representative world r (XZ)
const HY = parseFloat(process.argv[5] || '6.5'); // representative world h (Y)
const RY = parseFloat(process.argv[6] || '0');   // prop yaw so a specific face (e.g. the lane-face) turns toward the camera
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
  { render: true, angle: 'front3q', bg: 'dusk', rig: 'sunset',  fill: 0.80, label: `${KEY} · front-¾ · gallery face + broken end + moss (NAME it)` },
  { angle: 'side',    bg: 'dark', rig: 'sunset',  fill: 0.86, label: 'side · full LENGTH · colonnade rhythm + jagged ends + tide VALUE' },
  { angle: 'low',     bg: 'dusk', rig: 'sunset',  fill: 0.82, label: 'worm’s-eye · does it WALL the lane? (the boundary read)' },
  { angle: 'front',   bg: 'dusk', rig: 'sunset',  fill: 0.78, label: 'down-the-length · receding wall (the in-lane framing read)' },
  { angle: 'top',     bg: 'pale', rig: 'neutral', fill: 0.86, label: 'top plan · long + THIN + lane-parallel (not a blob)' },
  { angle: 'front3q', bg: 'pale', rig: 'neutral', fill: 0.80, label: 'front-¾ · form (neutral)' },
];
for (let i = 0; i < tiles.length; i++) {
  const t = tiles[i];
  if (i === 0) await page.evaluate((o) => window.psRender(o), { key: KEY, opts: { single: true }, inst, ry: RY, angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  else await page.evaluate((o) => window.psReframe(o), { angle: t.angle, bg: t.bg, rig: t.rig, fill: t.fill });
  await page.evaluate((a) => window.psTile(a[0], a[1]), [i, t.label]);
}
const path = `reforged-captures/cw-${KEY}-${round}.png`;
writeFileSync(path, await page.screenshot({ clip: clip(2, 3, CELL) }));
console.log('wrote', path);
await browser.close(); srv.close?.();
