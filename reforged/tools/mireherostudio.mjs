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

// HERO CANDIDATE COMPARISON — each candidate at the GAMEPLAY angle + a worm's-eye, so the
// owner can choose the hero shape. 4 candidates × 2 angles = a 4×2 sheet (one row per candidate).
const CANDS = [
  { key: 'candArch',  label: 'A) GLOWING ARCHWAY (fly through it)' },
  { key: 'candTree',  label: 'B) GLOWING WORLD-TREE' },
  { key: 'candCap',   label: 'C) GLOWING MUSHROOM (done right)' },
  { key: 'candBloom', label: 'D) GLOWING SWAMP-FLOWERS' },
];
const CELL = 620, COLS = 2, ROWS = CANDS.length;
await page.evaluate(({ COLS, ROWS, CELL }) => window.psSheetInit(COLS, ROWS, CELL), { COLS, ROWS, CELL });
for (let r = 0; r < CANDS.length; r++) {
  const c = CANDS[r];
  // col 0: gameplay (how you see it flying), col 1: worm's-eye (colossal read)
  await page.evaluate((o) => window.psRender(o), { key: c.key, angle: 'gameplay', bg: 'dark', rig: 'mire', opts: { single: true }, fill: 0.72 });
  await page.evaluate(({ i, label }) => window.psTile(i, label), { i: r * COLS + 0, label: c.label });
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: CELL, height: CELL } });
  writeFileSync(`/tmp/mire-cand-${c.key}.png`, buf);
  await page.evaluate((o) => window.psReframe(o), { angle: 'worm', fill: 0.72 });
  await page.evaluate(({ i }) => window.psTile(i, ''), { i: r * COLS + 1 });
}
const sheet = await page.screenshot({ clip: { x: 0, y: 0, width: COLS * CELL, height: ROWS * CELL } });
writeFileSync('/tmp/mire-hero-candidates.png', sheet);
await browser.close(); srv.close?.();
console.log('wrote /tmp/mire-hero-candidates.png + per-candidate /tmp/mire-cand-*.png');
