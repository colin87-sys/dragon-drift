// EMBERSIGHT H1 — the HUD state machine + relevance system + THE BELL
// (HUD-REDESIGN.md §A Law 4 / §B.11 / §D H1 gate).
//
//   1. body classes hud-cruise/hud-combat flip with activity (≤4Hz ticker)
//   2. relevance ghosts: hearts hide at full health after 3s; the score ghosts
//      after 4s without an earn; both RETURN on the event paths
//   3. THE BELL: queue depth 3, same-key coalescing (`+50 ×3`), min display,
//      sticky hints dismissed by hideHint()
//
// The ghost states can't be seen in stills (uishots), so this test asserts the
// classes directly (the H1 gate's "verify via page.evaluate class assertions").
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
await page.evaluate(() => document.getElementById('btn-start').click());
await page.waitForFunction(() => window.__dd.game.state === 'playing', undefined, { timeout: 30000, polling: 120 });

// ---- 1. the state machine -------------------------------------------------
await page.waitForFunction(() =>
  document.body.classList.contains('hud-cruise') ||
  document.body.classList.contains('hud-combat'), undefined, { timeout: 10000, polling: 120 });
check('state machine classifies (cruise or combat) once flying', true);

await page.evaluate(() => window.__dd.emit('ring', { perfect: false }));
await page.waitForFunction(() => document.body.classList.contains('hud-combat'),
  undefined, { timeout: 3000, polling: 120 });
check('a scoring event flips the body to hud-combat', true);

// ---- 2. relevance ghosts + returns ----------------------------------------
// Hearts: full health → .rest (hidden for layout) after ~3s of quiet.
await page.waitForFunction(() =>
  document.getElementById('health-hearts').classList.contains('rest'),
  undefined, { timeout: 15000, polling: 120 });
check('hearts rest-ghost at full health after the 3s clock', true);

// Damage returns them immediately (the ≤150ms path is event-driven).
await page.evaluate(() => window.__dd.emit('damage', { m: 100 }));
await page.waitForFunction(() =>
  !document.getElementById('health-hearts').classList.contains('rest'),
  undefined, { timeout: 8000, polling: 60 });
check('damage returns the hearts (rest dropped, event-driven)', true);
check('the return carries the hud-flash pulse',
  await page.$eval('#health-hearts', (el) => el.classList.contains('hud-flash')));

// Score: ghosts after 4s without an earn, returns on the next earn event.
await page.waitForFunction(() =>
  document.getElementById('score').classList.contains('rest'),
  undefined, { timeout: 15000, polling: 120 });
check('score rest-ghosts after 4s without an earn', true);
await page.evaluate(() => window.__dd.emit('gate'));
await page.waitForFunction(() =>
  !document.getElementById('score').classList.contains('rest'),
  undefined, { timeout: 8000, polling: 60 });
check('an earn event returns the score', true);

// ---- 3. THE BELL ------------------------------------------------------------
// Same-key coalescing: three rings of one key = one slug with ×3.
const co = await page.evaluate(() => {
  const ui = window.__dd.ui;
  ui.bellClear();
  ui.bell('+50', 'gold', { key: 'earn:ring' });
  ui.bell('+50', 'gold', { key: 'earn:ring' });
  ui.bell('+50', 'gold', { key: 'earn:ring' });
  return {
    shown: document.getElementById('bell-slug').classList.contains('show'),
    text: document.getElementById('bell-text').textContent,
    x: document.getElementById('bell-x').textContent,
    role: document.getElementById('bell-slug').dataset.role,
  };
});
check(`Bell coalesces same-key messages (got "${co.text} ${co.x}")`,
  co.shown && co.text === '+50' && co.x === '×3' && co.role === 'gold');

// Queue depth 3: six distinct messages → the current + at most 3 queued.
const depth = await page.evaluate(() => {
  const ui = window.__dd.ui;
  ui.bellClear();
  for (let i = 0; i < 6; i++) ui.bell(`MSG ${i}`, 'cyan', { key: `k${i}` });
  return ui._bellQ.length;
});
check(`Bell queue depth capped at 3 (got ${depth})`, depth <= 3);

// Min display: the current message survives at least ~900ms.
const held = await page.evaluate(async () => {
  const ui = window.__dd.ui;
  ui.bellClear();
  ui.bell('HOLD ME', 'gold', { key: 'hold' });
  await new Promise((r) => setTimeout(r, 500));
  return document.getElementById('bell-slug').classList.contains('show') &&
    document.getElementById('bell-text').textContent === 'HOLD ME';
});
check('Bell honors the 900ms min display (still up at 500ms)', held);

// Sticky hint: held until hideHint() dismisses it.
const hint = await page.evaluate(async () => {
  const ui = window.__dd.ui;
  ui.bellClear();
  await new Promise((r) => setTimeout(r, 400));   // let the previous exit pump
  ui.showHint('DRAG anywhere to steer');
  await new Promise((r) => setTimeout(r, 1400));  // past any non-sticky dur
  const up = document.getElementById('bell-slug').classList.contains('show') &&
    document.getElementById('bell-slug').dataset.role === 'hint';
  ui.hideHint();
  await new Promise((r) => setTimeout(r, 300));
  const down = !document.getElementById('bell-slug').classList.contains('show');
  return { up, down };
});
check('sticky hint holds past 1.4s', hint.up);
check('hideHint() dismisses the sticky hint', hint.down);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
