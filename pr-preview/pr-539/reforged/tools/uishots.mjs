// tools/uishots.mjs — the UI screenshot-regression harness (UI-PREMIUM-OVERHAUL.md §C).
//
// Captures the 8 UI states × 2 orientations matrix (16 PNGs, deviceScaleFactor 2)
// the Fable Gates read, on the same headless stack as every other capture tool
// (tests/browser.mjs boot: seeded localStorage save via initScript, ?debug seams,
// exported UI hooks + clicks). Runs locally / pre-PR — CI has no WebGL.
//
//   node tools/uishots.mjs                capture → tools/uishots-out/<state>-<orient>.png
//                                         + contact.html + montage.png
//   node tools/uishots.mjs --static       determinism seam (audit respec): pins ?seed=,
//                                         hides the Math.random ember/mote layers
//                                         (.splash-embers/.hero-embers/.menu-motes),
//                                         blanks the live canvases and pauses all CSS
//                                         animation/transitions right before each shot
//                                         (removed again after, so state navigation
//                                         still animates normally)
//   node tools/uishots.mjs --bank         copy current shots → tools/uishots-baseline/
//                                         (the committed baseline)
//   node tools/uishots.mjs --diff         re-capture (implies --static) and pixel-diff
//                                         against the baseline with per-state thresholds;
//                                         exits non-zero listing states over threshold
//   --states=hub,pause --orient=portrait  optional subset filters
//
// DETERMINISM NOTE (audit addendum 2026-07-14): the live WebGL scene animates and
// swiftshader frame timing varies run-to-run, so the IN-RUN and BOSS frames are
// REVIEW-ONLY — they are captured for the montage but always skipped by --diff
// (threshold `null` below) unless the canvas region is masked out some day.
// Menu states diff fine under --static within the generous per-state thresholds.
//
// Per-state logic is tolerant: each state gets up to 3 attempts; a state that
// can't be reached emits a placeholder note into the summary + contact sheet and
// the run continues (never hangs the whole matrix).
import { mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boot } from '../tests/browser.mjs';
import { decodePNG } from './silhouetteCore.mjs';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const OUT = join(TOOLS, 'uishots-out');
const BASE = join(TOOLS, 'uishots-baseline');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || '';
const DIFF_MODE = has('--diff');
const BANK_MODE = has('--bank');
const STATIC = has('--static') || DIFF_MODE; // diffs are only meaningful frozen

const ORIENTATIONS = {
  landscape: { width: 844, height: 390 },
  portrait: { width: 390, height: 844 },
};
const STATES = ['splash', 'hub', 'shop-dragons', 'settings', 'pause', 'inrun', 'boss', 'recap'];
// --diff per-state max fraction of pixels changed (channel delta > 12).
// null = review-only (live WebGL dominates the frame — see DETERMINISM NOTE).
const DIFF_THRESHOLD = {
  splash: 0.05, hub: 0.05, 'shop-dragons': 0.08, settings: 0.03,
  pause: 0.05, recap: 0.06, inrun: null, boss: null,
};

const onlyStates = opt('states') ? opt('states').split(',') : STATES;
const onlyOrients = opt('orient') ? [opt('orient')] : Object.keys(ORIENTATIONS);

// Rich seeded save (the shopshot/heroshot pattern): owned + ascended dragons so
// shop/hub/recap show real content; hints spent so onboarding chrome is quiet.
const SEED_SAVE = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 4, embers: 12480,
  stats: { runs: 12 },
  skins: { owned: ['azure','solar','obsidian'], equipped: 'solar' },
  riders: { owned: ['drifter'], equipped: 'drifter' },
  ascension: { tiers: [['solar', 2], ['obsidian', 1]], radiance: [] },
  mastery: { flown: [['solar', 200000], ['obsidian', 80000]] },
  flags: { seenIntro: true, seenFirstSurge: true, hintsSeen: 9 },
}))`;
const QUERY = '?debug&seed=7'; // pinned run seed (the --static determinism seam)

// The freeze style is injected right BEFORE a shot and removed after, so
// entrance animations still play to completion while navigating states, then
// hold their finished pose under the pause. Canvases (the live WebGL world +
// the 2d flap previews) are BLANKED under --static: menus are camera shots of
// the live scene by law, so no CSS freeze can pin them — the deterministic
// layer, and the one this harness regresses, is the DOM/CSS chrome. Review
// montages (default mode) keep the world visible.
const FREEZE_CSS = '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}'
  + '.splash-embers,.hero-embers,.menu-motes{display:none!important}'
  + 'canvas{visibility:hidden!important}';
async function setFreeze(page, on) {
  if (!STATIC) return;
  await page.evaluate((css) => {
    let el = document.getElementById('uishots-freeze');
    if (!css) { el && el.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = 'uishots-freeze'; document.head.appendChild(el); }
    el.textContent = css;
  }, on ? FREEZE_CSS : '');
}

// Interval-polled selector wait. playwright's waitForSelector polls on rAF and
// STARVES under swiftshader load (the known "rAF-throttled flythroughs stall
// waits" gotcha — see the __dd.input seam note in main.js); waitForFunction with
// ms polling is immune, and is what recap.mjs already uses.
const waitFor = (page, selector, timeout = 15000) =>
  page.waitForFunction((sel) => !!document.querySelector(sel), selector, { timeout, polling: 120 });

const results = {}; // `${state}-${orient}` -> { file } | { note }
async function shoot(page, state, orient) {
  await setFreeze(page, true);
  const file = `${state}-${orient}.png`;
  await page.screenshot({ path: join(OUT, file) });
  await setFreeze(page, false);
  results[`${state}-${orient}`] = { file };
  console.log(`  ✓ ${file}`);
}
function placeholder(state, orient, why) {
  results[`${state}-${orient}`] = { note: String(why).split('\n')[0].slice(0, 200) };
  console.warn(`  ✗ ${state}-${orient}: ${results[`${state}-${orient}`].note}`);
}
// Up to 3 attempts per state; failures never sink the rest of the plan.
async function tryState(state, orient, fn, attempts = 3) {
  if (!onlyStates.includes(state)) return;
  let err;
  for (let i = 0; i < attempts; i++) {
    try { await fn(); return; } catch (e) { err = e; }
  }
  placeholder(state, orient, err);
}

// ── plan 1: the attract splash (fresh pilot — no seeded save) ────────────────
async function planSplash(orient, viewport) {
  const { page, done } = await boot({ splash: true, query: QUERY, viewport, deviceScaleFactor: 2 });
  try {
    await tryState('splash', orient, async () => {
      await waitFor(page, '#splash.show');
      await page.waitForTimeout(1800); // wordmark + slogan settle, scene fades up
      await shoot(page, 'splash', orient);
    });
  } finally { await done(); }
}

// ── plan 2: the meta screens (hub → shop dragons tab → settings) ─────────────
async function planMenus(orient, viewport) {
  const { page, done } = await boot({ query: QUERY, viewport, deviceScaleFactor: 2, initScript: SEED_SAVE });
  try {
    await tryState('hub', orient, async () => {
      await waitFor(page, '#btn-start');
      await page.waitForTimeout(1800); // staged entrance choreography + hero scene
      await shoot(page, 'hub', orient);
    });
    await tryState('shop-dragons', orient, async () => {
      await page.evaluate(() => window.__dd.ui.showScreen('shop'));
      await waitFor(page, '.shop-grid, .hero-select');
      await page.waitForTimeout(2600); // flapping previews into a good pose (shopshot)
      await shoot(page, 'shop-dragons', orient);
    });
    await tryState('settings', orient, async () => {
      await page.evaluate(() => window.__dd.ui.showScreen('settings'));
      await waitFor(page, '.settings-group');
      await page.waitForTimeout(900);
      await shoot(page, 'settings', orient);
    });
  } finally { await done(); }
}

// ── plan 3: the run states (in-run HUD → pause → boss → recap), seeded run ───
async function planRun(orient, viewport) {
  const { page, done } = await boot({ query: QUERY, viewport, deviceScaleFactor: 2, initScript: SEED_SAVE });
  try {
    await waitFor(page, '#btn-start', 30000);
    // evaluate-click: the CTA carries an infinite `breathe` transform animation,
    // so playwright's actionability "stable box" check can starve forever.
    await page.evaluate(() => document.getElementById('btn-start').click());
    await page.waitForFunction(() => window.__dd.game.state === 'playing', undefined, { timeout: 30000, polling: 120 });

    await tryState('inrun', orient, async () => {
      await page.waitForTimeout(3000); // cruise: HUD chrome + score/distance live
      await shoot(page, 'inrun', orient);
    }, 1);

    await tryState('pause', orient, async () => {
      if (await page.evaluate(() => window.__dd.game.state === 'playing')) await page.keyboard.press('Escape');
      await waitFor(page, '.pause-menu', 10000);
      await page.waitForTimeout(700);
      await shoot(page, 'pause', orient);
    });

    // resume for the boss leg (only if the pause leg actually paused)
    if (await page.evaluate(() => window.__dd.game.state === 'paused')) {
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => window.__dd.game.state === 'playing', undefined, { timeout: 15000, polling: 120 });
    }

    await tryState('boss', orient, async () => {
      // Shipped ?debug seams (§C): spawn the encounter, then skip the slow
      // entrance so the TITLE CARD (fires at fight start, ui.js bossTitleCard)
      // and the world-space HP bar are both up in the frame.
      await page.evaluate(() => window.__dd.spawnBoss());
      await page.waitForFunction(() => window.__dd.game.inBoss === true, undefined, { timeout: 15000, polling: 120 });
      await page.evaluate(() => window.__dd.bossForceFight());
      await waitFor(page, '#boss-title-card.btc-anim', 20000);
      await page.waitForTimeout(600); // into the card's HOLD beat before freezing
      await shoot(page, 'boss', orient);
    }, 2);

    await tryState('recap', orient, async () => {
      // The recap.mjs pattern: bank a haul, zero revives, crash into the wall.
      await page.evaluate(() => {
        const { game, save, player } = window.__dd;
        save.revives = 0;
        game.embersRun = 140;
        game.score = 4200;
        player.position.x = 99;
      });
      await page.waitForFunction(() => !!window.__dd.game.runSummary, undefined, { timeout: 45000, polling: 100 });
      await waitFor(page, '#screen .run-stats', 45000);
      await page.waitForTimeout(1800); // count-up + ledger cascade settle
      await shoot(page, 'recap', orient);
    }, 1);
  } finally { await done(); }
}

// ── montage + contact sheet ──────────────────────────────────────────────────
function writeContactSheet() {
  const cell = (state, orient) => {
    const r = results[`${state}-${orient}`];
    if (r?.file) return `<figure><img src="${r.file}" loading="lazy"><figcaption>${state} · ${orient}</figcaption></figure>`;
    return `<figure class="miss"><div>NOT CAPTURED<br><small>${r?.note || 'skipped'}</small></div><figcaption>${state} · ${orient}</figcaption></figure>`;
  };
  const rows = onlyOrients.map((o) => onlyStates.map((s) => cell(s, o)).join('\n')).join('\n');
  writeFileSync(join(OUT, 'contact.html'), `<!doctype html><meta charset="utf-8"><title>uishots contact sheet</title>
<style>body{background:#14100c;color:#fdf3e4;font:14px system-ui;margin:16px}
.grid{display:grid;grid-template-columns:repeat(${onlyStates.length},1fr);gap:10px}
figure{margin:0}img{width:100%;height:auto;border:1px solid #6b5334;border-radius:6px}
figcaption{font-size:11px;letter-spacing:1px;opacity:.75;margin-top:4px;text-transform:uppercase}
.miss div{display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:844/390;border:1px dashed #a33;border-radius:6px;color:#f88;font-size:12px;text-align:center;padding:8px}</style>
<h1>uishots — ${new Date().toISOString()}${STATIC ? ' (static)' : ''}</h1><div class="grid">${rows}</div>\n`);
  console.log(`wrote ${join(OUT, 'contact.html')}`);
}

async function writeMontage() {
  const files = Object.values(results).filter((r) => r.file).map((r) => r.file);
  if (!files.length) return;
  // Canvas-stitch inside a throwaway page of the same headless chromium stack
  // (chromium is our PNG codec — no image deps). Scaled to 25%: review-size grid.
  let session;
  try {
    session = await boot({ query: QUERY, viewport: { width: 320, height: 200 } });
    const { page } = session;
    const imgs = {};
    for (const f of files) imgs[f] = `data:image/png;base64,${readFileSync(join(OUT, f)).toString('base64')}`;
    const grid = onlyOrients.map((o) => onlyStates.map((s) => results[`${s}-${o}`]?.file || null));
    const dataURL = await page.evaluate(async ({ imgs, grid, labels }) => {
      const SC = 0.25, PAD = 8, LBL = 16;
      const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const loaded = {};
      for (const [k, v] of Object.entries(imgs)) loaded[k] = await load(v);
      const cw = Math.max(...Object.values(loaded).map((i) => i.width * SC));
      // per-ROW cell height (landscape and portrait rows differ hugely)
      const rowH = grid.map((row) => Math.max(120, ...row.filter(Boolean).map((f) => loaded[f].height * SC)));
      const cols = grid[0].length;
      const c = document.createElement('canvas');
      c.width = cols * (cw + PAD) + PAD;
      c.height = rowH.reduce((a, h) => a + h + PAD + LBL, PAD);
      const x = c.getContext('2d');
      x.fillStyle = '#14100c'; x.fillRect(0, 0, c.width, c.height);
      x.font = '11px monospace'; x.textBaseline = 'top';
      let oy = PAD;
      grid.forEach((row, r) => {
        row.forEach((f, cIdx) => {
          const ox = PAD + cIdx * (cw + PAD);
          x.fillStyle = '#c9a06a'; x.fillText(labels[r][cIdx], ox, oy);
          if (!f) { x.strokeStyle = '#a33'; x.strokeRect(ox, oy + LBL, cw, rowH[r]); return; }
          const im = loaded[f];
          x.drawImage(im, ox + (cw - im.width * SC) / 2, oy + LBL, im.width * SC, im.height * SC);
        });
        oy += rowH[r] + PAD + LBL;
      });
      return c.toDataURL('image/png');
    }, { imgs, grid, labels: onlyOrients.map((o) => onlyStates.map((s) => `${s}-${o}${results[`${s}-${o}`]?.file ? '' : ' ✗'}`)) });
    writeFileSync(join(OUT, 'montage.png'), Buffer.from(dataURL.split(',')[1], 'base64'));
    console.log(`wrote ${join(OUT, 'montage.png')}`);
  } catch (e) {
    console.warn(`montage skipped (${String(e).split('\n')[0]}) — contact.html stands in`);
  } finally { if (session) await session.done(); }
}

// ── --diff: pixel-compare against the banked baseline ────────────────────────
function runDiff() {
  const failures = [], report = [];
  for (const orient of onlyOrients) {
    for (const state of onlyStates) {
      const th = DIFF_THRESHOLD[state];
      const name = `${state}-${orient}.png`;
      if (th === null) { report.push(`  ~ ${name}: review-only (live WebGL frame)`); continue; }
      const op = join(OUT, name), bp = join(BASE, name);
      if (!existsSync(op)) { failures.push(`${name}: not captured this run`); continue; }
      if (!existsSync(bp)) { failures.push(`${name}: no banked baseline (run --bank)`); continue; }
      const A = decodePNG(readFileSync(bp)), B = decodePNG(readFileSync(op));
      if (A.w !== B.w || A.h !== B.h) { failures.push(`${name}: size ${B.w}x${B.h} vs baseline ${A.w}x${A.h}`); continue; }
      let diff = 0;
      const n = A.w * A.h;
      for (let p = 0; p < n * 4; p += 4) {
        if (Math.abs(A.rgba[p] - B.rgba[p]) > 12 || Math.abs(A.rgba[p + 1] - B.rgba[p + 1]) > 12
          || Math.abs(A.rgba[p + 2] - B.rgba[p + 2]) > 12) diff++;
      }
      const frac = diff / n;
      report.push(`  ${frac > th ? '✗' : '✓'} ${name}: ${(100 * frac).toFixed(2)}% changed (threshold ${(100 * th).toFixed(0)}%)`);
      if (frac > th) failures.push(`${name}: ${(100 * frac).toFixed(2)}% > ${(100 * th).toFixed(0)}%`);
    }
  }
  console.log(`\n--diff vs ${BASE}:\n${report.join('\n')}`);
  if (failures.length) {
    console.error(`\nDIFF FAILURES:\n  ${failures.join('\n  ')}`);
    process.exitCode = 1;
  } else console.log('\nall diffable states within threshold.');
}

// ── main ─────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
// keep capture output out of git (the BASELINE dir, by contrast, is committed)
if (!existsSync(join(OUT, '.gitignore'))) writeFileSync(join(OUT, '.gitignore'), '*\n!.gitignore\n');

for (const orient of onlyOrients) {
  const viewport = ORIENTATIONS[orient];
  if (!viewport) { console.error(`unknown orientation ${orient}`); process.exit(2); }
  console.log(`\n=== ${orient} ${viewport.width}x${viewport.height} @2x ===`);
  const wants = (states) => states.some((s) => onlyStates.includes(s));
  const fallback = (states, e) => { for (const s of states) if (onlyStates.includes(s) && !results[`${s}-${orient}`]) placeholder(s, orient, e); };
  if (wants(['splash'])) { try { await planSplash(orient, viewport); } catch (e) { fallback(['splash'], e); } }
  if (wants(['hub', 'shop-dragons', 'settings'])) { try { await planMenus(orient, viewport); } catch (e) { fallback(['hub', 'shop-dragons', 'settings'], e); } }
  if (wants(['inrun', 'pause', 'boss', 'recap'])) { try { await planRun(orient, viewport); } catch (e) { fallback(['inrun', 'pause', 'boss', 'recap'], e); } }
}

writeContactSheet();
await writeMontage();

const captured = Object.values(results).filter((r) => r.file).length;
const total = onlyStates.length * onlyOrients.length;
console.log(`\ncaptured ${captured}/${total} frames → ${OUT}`);
for (const [k, r] of Object.entries(results)) if (r.note) console.log(`  placeholder ${k}: ${r.note}`);

if (BANK_MODE) {
  mkdirSync(BASE, { recursive: true });
  for (const r of Object.values(results)) if (r.file) copyFileSync(join(OUT, r.file), join(BASE, r.file));
  console.log(`banked ${captured} shots → ${BASE}`);
}
if (DIFF_MODE) runDiff();
