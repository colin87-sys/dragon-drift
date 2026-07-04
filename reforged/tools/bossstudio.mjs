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
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';

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
// every run). Angles are added per-render below.
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
  { name: 'flee',    o: { death: 0.7, t: 2.0 } },     // the survivor circling/fleeing pose
];
const states = bossId === 'eitherwing' ? [...STATES, ...EXTRAS] : STATES;

const BGS = ['dark', 'pale'];
// Grid order: front TL, 3/4 TR, profile BL, top-down BR.
const ANGLES = ['front', 'threequarter', 'profile', 'topdown'];
const ANGLE_LABEL = { front: 'front', threequarter: '3/4', profile: 'profile', topdown: 'top-down' };

// Box-average 2x downsample of an RGBA frame ({w,h,rgba} → {w/2,h/2,rgba}).
function downsample2(src) {
  const { w, h, rgba } = src;
  const ow = w >> 1, oh = h >> 1;
  const out = Buffer.alloc(ow * oh * 4);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const sx = x * 2, sy = y * 2;
    for (let c = 0; c < 4; c++) {
      const a = rgba[((sy) * w + sx) * 4 + c], b = rgba[((sy) * w + sx + 1) * 4 + c];
      const d = rgba[((sy + 1) * w + sx) * 4 + c], e = rgba[((sy + 1) * w + sx + 1) * 4 + c];
      out[(y * ow + x) * 4 + c] = (a + b + d + e) >> 2;
    }
  }
  return { w: ow, h: oh, rgba: out };
}

// Composite four equally-sized tiles into a 2x2 sheet (TL,TR,BL,BR order).
function contactSheet(tiles) {
  const tw = tiles[0].w, th = tiles[0].h, SW = tw * 2, SH = th * 2;
  const sheet = Buffer.alloc(SW * SH * 4);
  const place = (tile, ox, oy) => {
    for (let y = 0; y < th; y++)
      tile.rgba.copy(sheet, ((oy + y) * SW + ox) * 4, y * tw * 4, (y + 1) * tw * 4);
  };
  place(tiles[0], 0, 0); place(tiles[1], tw, 0); place(tiles[2], 0, th); place(tiles[3], tw, th);
  return pngRGBA(SW, SH, sheet);
}

mkdirSync('reforged-captures', { recursive: true });

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/bossstudio.html?boss=${bossId}&seed=${SEED}&bg=dark`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

// Hide the interactive chrome — captures are the canvas + the angle label only.
await page.evaluate(() => { for (const id of ['hud', 'panel', 'bosses']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; } });

const written = [];
for (const st of states) {
  for (const bgName of BGS) {
    const tiles = [];
    for (const angle of ANGLES) {
      await page.evaluate((o) => window.renderState(o), { boss: bossId, seed: SEED, bg: bgName, angle, ...st.o });
      // Angle label (DOM overlay, captured in the screenshot).
      await page.evaluate((txt) => { const l = document.getElementById('studiolabel'); l.textContent = txt; l.style.display = 'block'; }, ANGLE_LABEL[angle]);
      const png = await page.screenshot();
      tiles.push(downsample2(decodePNG(png)));
    }
    const path = `reforged-captures/${bossId}-studio-${st.name}-${bgName}-${round}.png`;
    writeFileSync(path, contactSheet(tiles));
    written.push(path);
    console.log('wrote', path);
  }
}

await browser.close();
srv.close?.();
console.log(`\n${written.length} contact sheets written.`);
process.exit(0);
