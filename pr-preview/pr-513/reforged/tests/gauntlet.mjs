// EMBERSIGHT H3 — THE GAUNTLET (HUD-REDESIGN §B.1–B.3, §B.10, §F).
//   1. LIFE pips: one per heart, .full tracks game.health, ♥ glyphs dead
//   2. damage direction: the struck quadrant's arc flashes + weighted vignette
//   3. critical: body.hud-critical + VIGIL + the postfx grade via the arbiter
//   4. fever: the surge cells drain off the fever clock
//   5. multiplier slug appears only when a combo is building
//   6. boost denial shakes the arc
//   7. IMMERSIVE HUD body class (safety floor is CSS, eyeballed on preview)
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, hintsSeen: 16383, seenFirstSurge: true } }))`,
});
await page.evaluate(() => document.getElementById('btn-start').click());
await page.waitForFunction(() => window.__dd.game.state === 'playing', undefined, { timeout: 30000, polling: 120 });
await page.waitForTimeout(400);

// ---- 1. LIFE pips -----------------------------------------------------------
const pips = await page.evaluate(() => ({
  n: document.querySelectorAll('#health-hearts span').length,
  full: document.querySelectorAll('#health-hearts span.full').length,
  svg: document.querySelectorAll('#health-hearts .pip-o').length,
  glyph: document.querySelector('#health-hearts span')?.textContent.trim(),
}));
check(`4 lozenge pips, all full at start (${pips.full}/${pips.n})`, pips.n === 4 && pips.full === 4 && pips.svg === 4);
check('pips are SVG lozenges, not text glyphs', pips.glyph === '');

const after = await page.evaluate(async () => {
  window.__dd.game.health = 50;
  await new Promise((r) => setTimeout(r, 250));
  return document.querySelectorAll('#health-hearts span.full').length;
});
check(`health 50 lights 2 pips (got ${after})`, after === 2);

// ---- 2. damage direction ----------------------------------------------------
const dmg = await page.evaluate(() => {
  window.__dd.ui.damageFlash(false, { x: 1, y: 0, severity: 1 });
  return {
    seg: document.getElementById('gd-right').classList.contains('gd-hit'),
    big: document.getElementById('gd-right').classList.contains('gd-big'),
    dir: document.getElementById('vignette-dir').dataset.dir,
    others: document.getElementById('gd-left').classList.contains('gd-hit'),
  };
});
check('an impact from the right flashes the right arc segment', dmg.seg && !dmg.others);
check('severity ≥1 doubles the stroke (gd-big)', dmg.big);
check('the damage vignette weights the struck quadrant', dmg.dir === 'right');
const dmgAll = await page.evaluate(() => {
  window.__dd.ui.damageFlash(false, null);   // no side data → the specced fallback
  return ['up', 'right', 'down', 'left'].every((k) =>
    document.getElementById(`gd-${k}`).classList.contains('gd-hit'));
});
check('no side data falls back to the all-quadrant pulse', dmgAll);

// ---- 3. critical: VIGIL + the grading arbiter -------------------------------
await page.evaluate(() => { window.__dd.game.health = 25; });
await page.waitForFunction(() => document.body.classList.contains('hud-critical'),
  undefined, { timeout: 4000, polling: 120 });
check('last heart flips body.hud-critical (VIGIL + pip pin ride the class)', true);
await page.waitForFunction(() => window.__dd.postfx.kickState().hud.desat > 0.06,
  undefined, { timeout: 8000, polling: 120 });
const hud = await page.evaluate(() => window.__dd.postfx.kickState().hud);
check(`the ONE arbiter eases the critical grade in (desat ${hud.desat.toFixed(3)}, vig ${hud.vig.toFixed(3)})`,
  hud.desat > 0.06 && hud.vig > 0.05);
// healing back releases the claim
await page.evaluate(() => { window.__dd.game.health = 100; });
await page.waitForFunction(() => !document.body.classList.contains('hud-critical') &&
  window.__dd.postfx.kickState().hud.desat < 0.04, undefined, { timeout: 8000, polling: 120 });
check('leaving critical releases the grade through the same arbiter', true);

// ---- 4. fever drain timer ---------------------------------------------------
const drain = await page.evaluate(async () => {
  const dd = window.__dd;
  dd.game.feverActive = true;
  dd.game.feverTimer = 60;   // clamped visually to feverDuration → full row
  await new Promise((r) => setTimeout(r, 250));
  const fullRow = document.querySelectorAll('#surge-gems i.lit').length;
  return { fullRow, threshold: dd.game.feverThreshold };
});
const half = await page.evaluate(async () => {
  const dd = window.__dd;
  const { CONFIG } = await import(new URL('./js/config.js', document.baseURI).href);
  // pin the clock at half repeatedly — the live loop keeps decrementing it
  for (let i = 0; i < 4; i++) {
    dd.game.feverActive = true;
    dd.game.feverTimer = CONFIG.feverDuration / 2;
    await new Promise((r) => setTimeout(r, 80));
  }
  return document.querySelectorAll('#surge-gems i.lit').length;
});
check(`fever full clock lights the row (${drain.fullRow}/${drain.threshold})`, drain.fullRow === drain.threshold);
check(`half the fever clock drains the cells left→right (${half}/${drain.threshold})`,
  half > 0 && half <= Math.ceil(drain.threshold / 2));
await page.evaluate(() => { window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; window.__dd.game.consecutiveRings = 0; });

// ---- 5. multiplier slug -----------------------------------------------------
const combo = await page.evaluate(async () => {
  window.__dd.game.combo = 2.4;
  await new Promise((r) => setTimeout(r, 150));
  return {
    cls: document.getElementById('stamina-arc').classList.contains('combo'),
    text: document.getElementById('surge-x').textContent,
  };
});
check(`combo > 1 shows the multiplier slug (${combo.text})`, combo.cls && combo.text === '×2.40');

// ---- 6. boost denial shake --------------------------------------------------
const deny = await page.evaluate(async () => {
  const dd = window.__dd;
  dd.game.stamina = 0;
  dd.player.orbTimer = 0;
  dd.input.boost = true;
  await new Promise((r) => setTimeout(r, 300));
  const shaken = document.getElementById('g-arc').classList.contains('g-deny');
  dd.input.boost = false;
  dd.game.stamina = 110;
  return shaken;
});
check('boost attempted on an empty tank shakes the arc', deny);

// ---- 7. IMMERSIVE HUD -------------------------------------------------------
await page.evaluate(() => { window.__dd.save.settings.immersiveHud = true; });
await page.waitForFunction(() => document.body.classList.contains('hud-immersive'),
  undefined, { timeout: 4000, polling: 120 });
check('IMMERSIVE toggle flips body.hud-immersive (CSS hides all but the floor)', true);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
