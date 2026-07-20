// EMBERSIGHT H2 — the TAPE + TALLY + SCOREKEEPER (HUD-REDESIGN §B.4/§B.6/§F).
//   1. the distance numeral is thin-space grouped tabular (`1 403 m`)
//   2. the PB caret rides the tape within ±500m and pins center once passed,
//      ringing NEW BEST DISTANCE through the Bell
//   3. the chain underline fills in cells of 5; a chain ≥5 ending fires the
//      TALLY RITUAL through the Bell
//   4. SCOREKEEPER flips the body class that defeats the score ghost
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 3, best: { score: 900, dist: 500 },
    stats: { runs: 5 }, flags: { seenIntro: true, hintsSeen: 16383, seenFirstSurge: true },
  }))`,
});
await page.evaluate(() => document.getElementById('btn-start').click());
await page.waitForFunction(() => window.__dd.game.state === 'playing', undefined, { timeout: 30000, polling: 120 });
// log Bell messages (the lane holds each ~1.1s — logging beats racing it)
await page.evaluate(() => {
  const ui = window.__dd.ui;
  const orig = ui.bell.bind(ui);
  window.__bellLog = [];
  ui.bell = (t, r, o) => { window.__bellLog.push(t); return orig(t, r, o); };
});

// ---- 1+2. the tape: numeral format + PB caret approach/pass ----------------
await page.evaluate(() => { window.__dd.player.dist = 1403; });
await page.waitForFunction(() => document.getElementById('dist').textContent.includes('m') &&
  document.getElementById('dist').textContent.length > 5, undefined, { timeout: 5000, polling: 120 });
const distText = await page.textContent('#dist');
check(`distance numeral is thin-space grouped tabular ("${distText}")`,
  /^\d{1,3}(\u2009\d{3})+[\u2009 ]m$/.test(distText));

// PB is at 500 and we are past it → the caret must be pinned center + passed.
await page.waitForFunction(() =>
  document.getElementById('tape-pb').classList.contains('passed'), undefined, { timeout: 5000, polling: 120 });
check('PB caret pins center once the record is passed',
  await page.$eval('#tape-pb', (el) => el.style.transform === 'translateX(0px)'));
check('NEW BEST DISTANCE rang the Bell',
  await page.evaluate(() => window.__bellLog.includes('NEW BEST DISTANCE')));
check('tick strip is transform-scrolled (translateX only)',
  await page.$eval('#tape-ticks', (el) => /translateX/.test(el.style.transform)));

// ---- 3. chain cells + THE TALLY RITUAL --------------------------------------
const cells = await page.evaluate(async () => {
  const dd = window.__dd;
  dd.game.consecutiveRings = 7;
  await new Promise((r) => setTimeout(r, 300));
  return Array.from(document.querySelectorAll('#chain-cells i')).map((i) => i.classList.contains('f'));
});
check(`chain 7 fills 2 cells of the second block (got ${cells.filter(Boolean).length})`,
  cells.filter(Boolean).length === 2);
const ritual = await page.evaluate(async () => {
  window.__dd.game.consecutiveRings = 0;   // the chain (≥5) ends
  await new Promise((r) => setTimeout(r, 400));
  return window.__bellLog.find((t) => t.includes('CHAIN')) || '';
});
check(`chain ≥5 ending rings THE TALLY RITUAL ("${ritual}")`, /\+.*·.*×.*CHAIN/.test(ritual));

// ---- 4. SCOREKEEPER ---------------------------------------------------------
await page.evaluate(() => { window.__dd.save.settings.scorekeeper = true; });
await page.waitForFunction(() => document.body.classList.contains('hud-scorekeeper'),
  undefined, { timeout: 4000, polling: 120 });
check('SCOREKEEPER flips the body class that pins the Tally', true);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
