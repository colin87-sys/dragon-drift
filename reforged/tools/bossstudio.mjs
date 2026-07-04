// tools/bossstudio.mjs — the §7c STUDIO CONTACT-SHEET driver.
//
//   node tools/bossstudio.mjs <bossId> [round]     (default eitherwing r1)
//     → reforged-captures/<bossId>-studio-<state>-<bg>-<round>.png
//
// Drives tools/bossstudio.html (the isolated, seeded, fixed-timestep boss stage
// WITH the game's bloom/ACES pipeline) through window.renderState. For each
// canonical STATE and each of the two §7c backdrops (dark / pale) it renders the
// four fixed angles (front · 3/4 · profile · top-down) at identical framing and
// composites them into ONE 2x2 contact-sheet PNG. Every frame is a pure function
// of (seed, t, dials, angle): round K and round K+1 are pixel-comparable, so
// design review always judges the SAME look (§7c, the bossview precedent).
//
// The 2x2 grid is composited IN-PAGE (studioSheetInit/studioTile draw the live
// GL canvas into a 2D sheet), so each sheet is ONE re-sim + three cheap camera
// reframes (studioAngle) + ONE element screenshot — no per-angle PNG decode.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const bossId = process.argv[2] || 'eitherwing';
const round = process.argv[3] || 'r1';
const SEED = 1;

// The §7c standard states + the two eitherwing extras. Each `o` is a
// renderState dial bag at a DETERMINISTIC animation phase t (identical framing
// every run).
const STATES = [
  { name: 'idle',     o: { t: 1.5 } },
  { name: 'notice',   o: { noticeAt: 0.5, t: 1.2 } },
  { name: 'charge',   o: { charge: 1, t: 2.0 } },
  { name: 'shielded', o: { shield: true, t: 1.5 } },
  // dread setpiece — eitherwing's dread card is the figure-eight ("Both Halves at Once").
  { name: 'dread',    o: { charge: 1, sp: 0.8, spmode: 'figureEight', t: 2.4 } },
  { name: 'dissolve', o: { death: 0.5, t: 1.5 } },
];
// EITHERWING extras: the eye-handoff (eye mid-thread) + the survivor flee pose.
const EXTRAS = [
  { name: 'handoff', o: { handoff: 0.5, t: 2.0 } },   // setDebugHandoff(0.5): eye mid-thread between the twins
  { name: 'flee',    o: { death: 0.52, t: 1.5 } },    // the MOURNFUL circling beat (before the off-frame flight): survivor centred, both twins visible, socket-ring glow + scattered beads
];
const states = bossId === 'eitherwing' ? [...STATES, ...EXTRAS] : STATES;

const BGS = ['dark', 'pale'];
// Grid order: front TL, 3/4 TR, profile BL, top-down BR.
const ANGLES = [
  { name: 'front',        label: 'front' },
  { name: 'threequarter', label: '3/4' },
  { name: 'profile',      label: 'profile' },
  { name: 'topdown',      label: 'top-down' },
];

mkdirSync('reforged-captures', { recursive: true });

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/bossstudio.html?boss=${bossId}&seed=${SEED}&bg=dark`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

// Hide the interactive chrome — the sheet element is captured on its own.
await page.evaluate(() => { for (const id of ['hud', 'panel', 'bosses', 'studiolabel']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; } });
// Pause the RAF loop so the page is static during capture (else page.screenshot
// stalls on the compositor stability wait — ~30s/shot with a live loop).
await page.evaluate(() => window.studioPauseLoop());

const SHEET_CLIP = { x: 0, y: 0, width: 1000, height: 1000 };   // sheet = 2 cols × 500px cells
const written = [];
for (const st of states) {
  for (const bgName of BGS) {
    await page.evaluate(() => window.studioSheetInit(2, 2, 500));
    for (let i = 0; i < ANGLES.length; i++) {
      const a = ANGLES[i];
      if (i === 0) await page.evaluate((o) => window.renderState(o), { boss: bossId, seed: SEED, bg: bgName, angle: a.name, ...st.o });
      else await page.evaluate((name) => window.studioAngle(name), a.name);
      await page.evaluate(([quad, label]) => window.studioTile(quad, label), [i, a.label]);
    }
    const path = `reforged-captures/${bossId}-studio-${st.name}-${bgName}-${round}.png`;
    writeFileSync(path, await page.screenshot({ clip: SHEET_CLIP }));
    written.push(path);
    console.log('wrote', path);
  }
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} contact sheets written.`);
process.exit(0);
