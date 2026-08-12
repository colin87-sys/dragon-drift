// JUNCTION SHEET — studio renders of the WING-BODY WELD through the flap cycle.
//
// WHY THIS EXISTS. `flapclearance` measures the weld in motion and returns numbers; a number cannot
// be gated by an art director. Every existing capture in this repo either renders the whole creature
// (where the weld is a few pixels of a 500px tile) or freezes it at a single pose — and the weld is
// the ONE region whose read changes through the cycle, because it is welded to a rotating bone.
// So the critic was being asked to judge a moving defect from stills that could not contain it.
//
// This drives dragonstudio.html's `junction` crop at each of the five named cycle points, in the
// studio's ACES pipeline, on the pale and dark backdrops. Deterministic: the pose comes from the
// SHARED setFlapDebugPose pin, so round K and K+1 are pixel-comparable (§9).
//
//   node tools/junctionsheet.mjs [key] [round] [tier]
//     → reforged-captures/junction-<key>-<round>.png        (5 phases + a wide reference)
//     → reforged-captures/junction-<key>-dark-<round>.png   (same, dark backdrop)
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

const key = process.argv[2] || 'fornax';
const round = process.argv[3] || 'r1';
const tierArg = process.argv[4] != null ? Number(process.argv[4]) : null;

// The five cycle points, in beat order, plus one pulled-back frame for context — a detail crop with
// no establishing shot beside it is how a reviewer ends up judging the wrong part.
const PHASES = ['glide', 'recovery', 'apex', 'downstroke', 'settle'];

mkdirSync('reforged-captures', { recursive: true });
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1080 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const tier = tierArg != null ? tierArg : await page.evaluate((k) => window.dsMaxTier(k), key);
const CELL = 460, COLS = 3, ROWS = 2;
const clip = { x: 0, y: 0, width: COLS * CELL, height: ROWS * CELL };
const written = [];

// Two viewpoints, because they answer different questions and the first draft of this tool only
// had the second. FLANK looks square at the weld — the seam itself, whether the membrane enters
// the hull cleanly or tears away from it. CHASE holds the shipped camera's own relationship to the
// joint, which is the only view whose verdict ships. From chase alone the weld is half-occluded by
// the dorsal rank, which is exactly how a junction defect survives a whole-body contact sheet.
const VIEWS = [
  { name: 'flank', dir: [0.94, 0.24, 0.24], bgs: ['pale', 'dark'] },
  { name: 'chase', dir: [0.55, 0.42, 0.86], bgs: ['pale'] },
];

for (const view of VIEWS) {
  for (const bg of view.bgs) {
    await page.evaluate((c) => window.dsSheetInit(c[0], c[1], c[2]), [COLS, ROWS, CELL]);
    for (let i = 0; i < PHASES.length; i++) {
      await page.evaluate((o) => window.dsCrop(o), { key, tier, part: 'junction', pose: PHASES[i], bg, dir: view.dir });
      await page.evaluate((a) => window.dsTile(a[0], a[1]), [i, `${PHASES[i]} · ${view.name}`]);
    }
    // the establishing frame: the same weld at cruise, pulled back onto the whole wing
    await page.evaluate((o) => window.dsCrop(o), { key, tier, part: 'wing', pose: 'glide', bg });
    await page.evaluate((a) => window.dsTile(a[0], a[1]), [5, 'glide · whole wing (context)']);
    const path = `reforged-captures/junction-${key}-${view.name}${bg === 'dark' ? '-dark' : ''}-${round}.png`;
    writeFileSync(path, await page.screenshot({ clip }));
    written.push(path); console.log('wrote', path);
  }
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} junction sheets written (round ${round}).`);
