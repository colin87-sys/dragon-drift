// FLOW "Keystone Crest" meter (the persistent flow-run multiplier HUD).
// Part A (CI-safe, no browser): source asserts on the markup / API / event wiring / CSS +
// the pure fill-fraction & heat math. Part B (WebGL/DOM): boots a flow run, drives the meter
// via the __dd.ui.flowMeter seam, and reads back the live DOM state.
//   node tests/flowmeter.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(DIR, '..', p), 'utf8');
let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

const ui = read('js/ui.js'), mainjs = read('js/main.js'), css = read('css/style.css');

// --- markup: a mini-Windvault arch (two legs + keystone + aperture number), Skyforged ramp ---
check('crest markup present (flow-crest + two fills + keystone + aperture ×N.N)',
  /id="flow-crest"/.test(ui) && /id="fc-fill-l"/.test(ui) && /id="fc-fill-r"/.test(ui)
  && /class="fc-keystone"/.test(ui) && /id="fc-x"/.test(ui));
check('uses the Skyforged 3-stop cyan ramp (0c63c8 → 3fc8ff → bfeeff), NOT a new hue',
  /flow-grad[\s\S]*#0c63c8[\s\S]*#3fc8ff[\s\S]*#bfeeff/.test(ui));
// The dashoffset fill math (100 - frac*100) ONLY maps to fractions if the paths declare
// pathLength=100 — otherwise the true leg length (~68.7u) saturates the fill early (Gate-2 bug).
check('fill + ghost paths declare pathLength="100" (the fill math depends on it)',
  (ui.match(/id="fc-(fill|ghost)-[lr]"[^>]*pathLength="100"/g) || []).length === 4);

// --- API: the flowMeter object with set/drop/show; dashoffset fill; heat; capped; best-notch ---
check('ui exposes flowMeter with set / drop / show', /flowMeter:\s*\{/.test(ui) && /set\(chain, mult, best, cap\)/.test(ui) && /drop\(chain, mult, cap\)/.test(ui) && /show\(on\)/.test(ui));
check('fill is dashoffset-driven (100 empty → 0 closed), the stamina-arc technique',
  /strokeDashoffset = off/.test(ui) && /100 - frac \* 100/.test(ui));
check('heat steps floor(chain/5) capped at 4; capped class at chain>=cap',
  /Math\.min\(4, Math\.floor\(chain \/ 5\)\)/.test(ui) && /classList\.toggle\('capped', cap > 0 && chain >= cap\)/.test(ui));
check('drop distinguishes the soft KNOCK from the miss SHATTER (chain===0)',
  /chain === 0 \? 'fc-shatter' : 'fc-knock'/.test(ui));
check('best-of-run notch positioned via a Bézier point on the left leg', /best > chain && best > 0/.test(ui) && /fcBest\.setAttribute/.test(ui));

// --- event wiring in main.js: drive the meter; demote the popup to one cyan cap-announce ---
check('flowChain → flowMeter.set(chain, mult, best, cap)',
  /on\('flowChain'[\s\S]{0,520}ui\.flowMeter\.set\(chain, mult, game\.flowChainBest, CONFIG\.FLOW\.chainCap\)/.test(mainjs));
check('flowChainDrop → flowMeter.drop(chain, mult, cap)',
  /on\('flowChainDrop'[\s\S]{0,220}ui\.flowMeter\.drop\(chain,/.test(mainjs));
check('cap announce is CYAN (flow), not gold (gold = perfects); popup demoted to the cap only',
  /MAX FLOW[\s\S]{0,50}'cyan'/.test(mainjs) && !/chain >= CONFIG\.FLOW\.chainCap \? 'gold'/.test(mainjs));

// --- CSS: centre-bottom + safe-area; cold-glass idle; keystone ignite; reduced-motion; mobile ---
check('centre-bottom placement above the surge gems, safe-area aware',
  /\.flow-crest\s*\{[\s\S]*left:\s*50%[\s\S]*env\(safe-area-inset-bottom/.test(css));
check('only shown during a flow run (display:none until .on) → other runs byte-identical HUD',
  /\.flow-crest\s*\{[\s\S]*display:\s*none/.test(css) && /\.flow-crest\.on\s*\{[\s\S]*display:\s*block/.test(css));
check('fill climbs via a dashoffset TRANSITION (compositor-cheap, no per-frame JS)',
  /\.fc-fill\s*\{[\s\S]*transition:\s*stroke-dashoffset/.test(css));
check('keystone ignites only when .capped (earned ornament, spring in + breathe)',
  /\.flow-crest\.capped\s*\.fc-keystone[\s\S]*fc-keystone-in[\s\S]*fc-keystone-breathe/.test(css));
check('reduced-motion drops all crest animation but keeps state',
  /prefers-reduced-motion[\s\S]*\.flow-crest\.fc-shatter[\s\S]*animation:\s*none/.test(css));
check('mobile + short-landscape resize the crest', /max-width: 700px[\s\S]*\.flow-crest\s*\{/.test(css) && /max-height: 430px[\s\S]*\.flow-crest/.test(css));

// --- pure math: the fill fraction & heat, replicated from the API contract ---
const off = (chain, cap) => 100 - (cap > 0 ? Math.max(0, Math.min(1, chain / cap)) : 0) * 100;
check('fill fraction: empty at 0, half at cap/2, closed at cap; clamped past cap',
  off(0, 20) === 100 && off(10, 20) === 50 && off(20, 20) === 0 && off(40, 20) === 0);
const heat = (c) => Math.min(4, Math.floor(c / 5));
check('heat: 0→0, 4→0, 5→1, 19→3, 20→4 (capped at 4)', heat(0) === 0 && heat(4) === 0 && heat(5) === 1 && heat(19) === 3 && heat(20) === 4);

// ============================ Part B: WebGL/DOM boot ============================
let boot = null;
try { ({ boot } = await import('./browser.mjs')); } catch { boot = null; }
let flow = null;
if (boot) {
  try {
    flow = await boot({ query: '?debug&canyon=flow', initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))` });
  } catch (e) { if (!/playwright/i.test(String(e))) throw e; flow = null; }
}
if (flow) {
  await flow.page.click('#btn-start');
  await flow.page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
  await flow.page.evaluate(() => { window.__dd.player.dist = 300; });
  await flow.page.waitForFunction(() => window.__dd.game.canyonRun === 'flow', { timeout: 15000 });
  await flow.page.waitForTimeout(300);
  const st = await flow.page.evaluate(() => {
    const m = window.__dd.ui.flowMeter, crest = document.getElementById('flow-crest'), fill = document.getElementById('fc-fill-l'), x = document.getElementById('fc-x');
    m.show(true);
    m.set(0, 1.0, 0, 20); const off0 = fill.style.strokeDashoffset, heat0 = crest.dataset.heat;
    m.set(10, 2.0, 0, 20); const off10 = fill.style.strokeDashoffset, x10 = x.textContent;
    m.set(20, 3.0, 20, 20); const capped = crest.classList.contains('capped'), heat20 = crest.dataset.heat;
    m.drop(0, 1.0, 20); const afterMiss = crest.classList.contains('capped');
    const shown = getComputedStyle(crest).display;
    return { shown, off0: +off0, off10: +off10, x10, capped, heat0, heat20, afterMiss };
  });
  check('crest is shown during a flow run (display:block)', st.shown === 'block');
  check('fill climbs as chain builds (dashoffset 100 empty → 50 at half)', st.off0 === 100 && st.off10 === 50);
  check('the ×N.N reads the multiplier (×2.0 at chain 10)', st.x10 === '×2.0');
  check('keystone ignites at the cap (.capped) with heat 4; clears after a miss', st.capped && st.heat20 === '4' && !st.afterMiss);
  check('zero console errors driving the FLOW crest', flow.errors.length === 0) || console.error(flow.errors.join('\n'));
  await flow.done();
} else {
  console.log('  (Part B skipped — playwright unavailable; Part A covered the CI-safe checks)');
}

console.log(`\nflowmeter: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
