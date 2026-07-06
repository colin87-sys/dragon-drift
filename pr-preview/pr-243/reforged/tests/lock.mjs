// The LANCE (lock) layer test battery. Grows PR-by-PR alongside the combat-verb
// build (see the combat-verbs SOP §II.7). Playwright harness on the browser.mjs
// pattern; drive via window.__dd (poke __dd.input, __dd.bossForceFight()); use
// synthetic TouchEvents for gesture cases; fixed waits, never wall-clock feel.
//
// PR0 — input hygiene. A pre-existing bug routed `touchcancel` through the same
// `end` handler as `touchend`, so a SYSTEM-cancelled 2nd-finger contact (palm
// rejection, OS gesture-nav, app switch) could read as a deliberate tap and SPEND
// a ready Dragon Surge. The fix gates the tap read on `e.type === 'touchend'`.
//   T0.1  touchcancel with a ready Surge in a forced fight → surgeTap stays false,
//         Surge is never spent.
//   T0.2  touchend, same setup → the tap arms and the ready Surge fires (control).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({ query: '?debug&boss=180' });

// --- reach a live fight ------------------------------------------------------
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd && window.__dd.game.state === 'playing', { timeout: 8000 });
await page.evaluate(() => window.__dd.spawnBoss());
await page.waitForFunction(() => window.__dd.bossState().active, { timeout: 8000 });
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 8000 });

// Dispatch a "brief, still 2nd-finger tap" on the game canvas: a steering finger
// lands first (so the second is an EXTRA), then the extra ENDS via `endType`.
// Returns input.surgeTap read synchronously right after the end dispatch (before
// any rAF consumes it) — this directly isolates the input-layer contract.
async function tapExtra(endType, base) {
  return page.evaluate(({ endType, base }) => {
    const canvas = window.__dd.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const mk = (id, x, y) => new Touch({ identifier: id, target: canvas, clientX: x, clientY: y });
    const steer = mk(base, cx - 40, cy);
    const extra = mk(base + 1, cx + 40, cy);
    const ev = (type, changed, touches) => new TouchEvent(type, {
      bubbles: true, cancelable: true, changedTouches: changed, touches, targetTouches: touches,
    });
    window.__dd.input.surgeTap = false;
    canvas.dispatchEvent(ev('touchstart', [steer], [steer]));
    canvas.dispatchEvent(ev('touchstart', [extra], [steer, extra]));
    canvas.dispatchEvent(ev(endType, [extra], [steer])); // extra lifts/cancels
    const tap = window.__dd.input.surgeTap;
    canvas.dispatchEvent(ev('touchend', [steer], [])); // release steer (cleanup)
    return tap;
  }, { endType, base });
}

const makeReady = () => page.evaluate(() => {
  const g = window.__dd.game;
  g.feverActive = false;
  g.consecutiveRings = g.feverThreshold;
});

// --- T0.1 — touchcancel must NOT read as a tap or spend Surge -----------------
await makeReady();
const cancelTap = await tapExtra('touchcancel', 100);
check('T0.1 touchcancel does not arm the surge tap (surgeTap stays false)', cancelTap === false);
// Even given a ready Surge, letting the fight run must not spend it: surgeTap was
// never set, so activateSurge never fires regardless of the ring state.
await page.waitForTimeout(300);
const feverAfterCancel = await page.evaluate(() => window.__dd.game.feverActive);
check('T0.1 touchcancel did not spend the ready Surge (feverActive stays false)', feverAfterCancel === false);

// --- T0.2 — touchend arms the tap and fires the ready Surge (control) ---------
await makeReady();
const endTap = await tapExtra('touchend', 200);
check('T0.2 touchend arms the surge tap (control)', endTap === true);
// Keep the Surge ready until the fight loop consumes the tap, then confirm it fired.
let fired = false;
try {
  await page.waitForFunction(() => {
    const g = window.__dd.game;
    if (!g.feverActive) g.consecutiveRings = g.feverThreshold; // hold ready until consumed
    return g.feverActive === true;
  }, { timeout: 3000 });
  fired = true;
} catch { fired = false; }
check('T0.2 the armed tap spent the ready Surge (feverActive true)', fired === true);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
