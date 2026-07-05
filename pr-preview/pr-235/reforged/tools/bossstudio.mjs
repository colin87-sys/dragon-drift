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
  // idle/notice seeded at MAX orbital separation (orbitPhase≈π/2 at t≈2.85, rate 0.55)
  // so the twins are spread ~1.5 body-lengths apart with the eye clear of both bodies —
  // never the figure-eight CROSSING moment where they overlap into one blob (CP1 r4 dir 1+3).
  { name: 'idle',     o: { t: 2.85 } },
  { name: 'notice',   o: { noticeAt: 2.4, t: 2.85 } },
  { name: 'charge',   o: { charge: 1, t: 2.0 } },
  { name: 'shielded', o: { shield: true, t: 1.5 } },   // per-state auto-fit frames the bubble + the outside seeker (CP1 r6)
  // dread setpiece — eitherwing's dread card is the figure-eight ("Both Halves at Once").
  // dread seeded at the MAX-separation orbit phase (t≈1.6 → orbitPhase≈π/2 at the
  // dread rate 1.04) so the 3/4 view shows TWO separated bodies + the split light at
  // both sockets, never the figure-eight CROSSING blob (CP1 r8 dir 5).
  { name: 'dread',    o: { charge: 1, sp: 0.8, spmode: 'figureEight', dread: true, t: 1.6 } },
  { name: 'dissolve', o: { death: 0.32, t: 1.4 } },   // mid-dissolve: BOTH halves present (the fallen still large), the survivor circling
];
// EITHERWING extras: the eye-handoff (eye mid-thread) + the survivor flee pose.
const EXTRAS = [
  { name: 'handoff', o: { handoff: 0.5, t: 2.85 } },   // setDebugHandoff(0.5): eye mid-thread; t2.85 = max twin separation (orbitPhase≈π/2) so the 3/4 view has clear air on both sides of the eye, not an eclipse blob (CP1 r8 dir 5)
  { name: 'flee',    o: { death: 0.72, t: 2.6 } },   // the LONE survivor + its hollow "eclipse socket"; per-state auto-fit frames it at spec (short snapped thread), no chip-motes
];
// HOLLOWGATE extras: the §5j Vigil-Lights ignition frame (panes mid-ignition,
// pooled toward a steered side) + the gaze/pupil frame (the lit pane migrated).
const HG_EXTRAS = [
  { name: 'ignite', o: { entrance: 0.55, steer: -1, t: 3.0 } },
  { name: 'gaze',   o: { gx: 0.9, gy: -0.3, t: 6.0 } },
];
const states = bossId === 'eitherwing' ? [...STATES, ...EXTRAS]
  : bossId === 'hollowgate' ? [...STATES, ...HG_EXTRAS] : STATES;

const BGS = ['dark', 'pale', 'sunset'];   // §7c L140: + warm sunset-gold (warm accents vanish on warm skies)
// The fight-distance frames (§7c L140): ONE front-on shot per key state at the REAL
// encounter geometry (FOV 72, boss at rel 30, NO auto-framing) — judged for PRESENCE.
// idle = the formation at full spread; handoff = the interlocked-crossing "money frame".
const FIGHT_STATES = bossId === 'eitherwing'
  ? [{ name: 'idle', o: { t: 2.85 } }, { name: 'handoff', o: { handoff: 0.5, t: 2.85 } }]
  : bossId === 'hollowgate'
    ? [{ name: 'idle', o: { t: 2.85 } }, { name: 'dread', o: { charge: 1, sp: 0.9, dread: true, t: 2.0 } }]
    : [{ name: 'idle', o: { t: 2.85 } }];
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

// FIGHT-DISTANCE FRAMES — single front-on shots at the real encounter geometry. Composited
// through the same GL→2D sheet path as the contact sheets (a 1×1 tile) for capture parity.
for (const st of FIGHT_STATES) {
  for (const bgName of BGS) {
    await page.evaluate(() => window.studioSheetInit(1, 1, 1000));
    await page.evaluate((o) => window.renderState(o), { boss: bossId, seed: SEED, bg: bgName, fight: true, ...st.o });
    await page.evaluate((label) => window.studioTile(0, label), `fight · rel30 · ${st.name}`);
    const path = `reforged-captures/${bossId}-fight-${st.name}-${bgName}-${round}.png`;
    writeFileSync(path, await page.screenshot({ clip: SHEET_CLIP }));
    written.push(path);
    console.log('wrote', path);
  }
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} images written (contact sheets + fight-distance frames).`);
process.exit(0);
