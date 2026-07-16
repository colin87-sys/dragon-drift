// tools/mireherostudio.mjs — a close-up STUDIO of the Lumen Mire hero (glowcolossus),
// isolated on a dark stage under the Mire's amber shipping light, so the giant mushroom
// + its crown-colony glow can actually be SEEN (in-game captures bury it).
//   node tools/mireherostudio.mjs   →  /tmp/mire-hero-sheet.png (2×3) + /tmp/mire-hero-<angle>.png
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 1120 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/mireherostudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const KEY = 'glowcolossus';
// 2×3 sheet — the angles that answer "does the hero read as a glowing landmark?"
const TILES = [
  { angle: 'gameplay', label: 'GAMEPLAY (how you see it flying)' },
  { angle: 'hero3q',   label: '3/4 hero' },
  { angle: 'worm',     label: "worm's-eye (colossal)" },
  { angle: 'top',      label: 'TOP-DOWN (flying-cam plan)' },
  { angle: 'front',    label: 'front' },
  { angle: 'side',     label: 'side' },
];
const CELL = 560, COLS = 3, ROWS = 2;
await page.evaluate(({ COLS, ROWS, CELL }) => window.psSheetInit(COLS, ROWS, CELL), { COLS, ROWS, CELL });
for (let i = 0; i < TILES.length; i++) {
  const t = TILES[i];
  await page.evaluate((o) => window.psRender(o), { key: KEY, angle: t.angle, bg: 'dark', rig: 'mire', opts: { single: true } });
  await page.evaluate(({ i, label }) => window.psTile(i, label), { i, label: t.label });
  // also grab the full-res individual for the two money angles
  if (t.angle === 'gameplay' || t.angle === 'top') {
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: CELL, height: CELL } });
    writeFileSync(`/tmp/mire-hero-${t.angle}.png`, buf);
  }
}
const sheet = await page.screenshot({ clip: { x: 0, y: 0, width: COLS * CELL, height: ROWS * CELL } });
writeFileSync('/tmp/mire-hero-sheet.png', sheet);
await browser.close(); srv.close?.();
console.log('wrote /tmp/mire-hero-sheet.png + /tmp/mire-hero-gameplay.png + /tmp/mire-hero-top.png');
