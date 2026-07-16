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

// HERO CANDIDATE GALLERY — all four candidates at the GAMEPLAY angle in ONE compact 2×2
// square (so it never truncates on display) so the owner can see + choose the hero shape.
// Each candidate is ALSO written to its own file (grabbed straight off the gl canvas, so the
// sheet overlay can't clobber it — the old bug that made every file the archway).
const CANDS = [
  { key: 'glowarch',   label: 'A) FLY-THROUGH ARCHWAY (hero)' },
  { key: 'glowtree',   label: 'B) GLOWING WORLD-TREE' },
  { key: 'glowshroom', label: 'C) GLOWING MUSHROOM' },
  { key: 'glowbloom',  label: 'D) GLOWING SWAMP-BLOOMS' },
];
const CELL = 640, COLS = 2, ROWS = 2;
await page.evaluate(({ COLS, ROWS, CELL }) => window.psSheetInit(COLS, ROWS, CELL), { COLS, ROWS, CELL });
for (let i = 0; i < CANDS.length; i++) {
  const c = CANDS[i];
  await page.evaluate((o) => window.psRender(o), { key: c.key, angle: 'gameplay', bg: 'dark', rig: 'mire', opts: { single: true }, fill: 0.74 });
  // per-candidate file straight off the gl canvas (correct — not clipped from cell 0)
  const durl = await page.evaluate(() => window.psGrab());
  writeFileSync(`/tmp/mire-cand-${c.key}.png`, Buffer.from(durl.split(',')[1], 'base64'));
  await page.evaluate(({ i, label }) => window.psTile(i, label), { i, label: c.label });
}
const sheet = await page.screenshot({ clip: { x: 0, y: 0, width: COLS * CELL, height: ROWS * CELL } });
writeFileSync('/tmp/mire-hero-gallery.png', sheet);

// FAR-BAND capture (Fable 60-ruling §3): glowtree is a FAR beacon — judge it at its ~150m in-game read
// with the biome fog on (r/h ≈ place mid-values). This is the gate that predicts the in-game beacon read.
await page.evaluate((o) => window.psRender(o), { key: 'glowtree', angle: 'gameplay', bg: 'dark', rig: 'mire', opts: { single: true }, far: { r: 46, h: 47, dist: 155 } });
const farBuf = await page.evaluate(() => window.psGrab());
writeFileSync('/tmp/mire-glowtree-far155.png', Buffer.from(farBuf.split(',')[1], 'base64'));

await browser.close(); srv.close?.();
console.log('wrote /tmp/mire-hero-gallery.png + per-candidate /tmp/mire-cand-*.png');
