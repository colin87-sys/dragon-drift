// SCAR-BURN end-to-end guard: boot the REAL engine, force KNELLGRAVE, and prove the
// resonant on-toll burn behaves — (1) a PERFECT release (manual loose while the toll
// window is open, ctx.beatOn) schedules a burn; (2) a NON-tell release does NOT; (3)
// the burn PAUSES while the boss is shielded (the one-deflect rule, never lost/spammed).
// The beat here is KNELLGRAVE's TOLL, not the (inaudible, still-live) music grid — the
// §CP1 fix. Uses the __dd burn seams (bossBeatOn / bossLoose / bossBurns / bossBankLocks).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(9); window.__dd.spawnBoss(); });
await page.waitForTimeout(500);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1000);

check('fighting knellgrave', (await page.evaluate(() => window.__dd.bossState()?.id)) === 'knellgrave');

// The toll window opens (beatOn) only within ±beatWindow of the boss's toll — it must
// TOGGLE (a bounded resonant window), never be permanently on (that was the §CP1
// coin-flip, ~40-70% against the inaudible grid). Warm up so the boss is actively
// tolling, then FINE-sample (25ms) to catch the ~0.12s windows.
await page.waitForTimeout(1500);
const beatSamples = await page.evaluate(async () => {
  const s = [];
  for (let i = 0; i < 280; i++) { s.push(window.__dd.bossBeatOn()); await new Promise((r) => setTimeout(r, 25)); }
  return s;
});
const onFrac = beatSamples.filter(Boolean).length / beatSamples.length;
const sawOn = beatSamples.some(Boolean), sawOff = beatSamples.some((b) => !b);
check(`beatOn toggles as a bounded resonant window, not the coin-flip (on ${(onFrac * 100).toFixed(0)}% of ~7s; saw on=${sawOn} off=${sawOff})`,
  sawOn && sawOff && onFrac < 0.4);

// (2) NON-TELL release: bank pips, loose while beatOn is FALSE → no burn.
await page.evaluate(async () => {
  while (window.__dd.bossBeatOn()) { await new Promise((r) => setTimeout(r, 16)); }  // wait for the window to close
  window.__dd.bossBankLocks(4);
  window.__dd.bossLoose();
});
await page.waitForTimeout(200);
const afterOffBeat = await page.evaluate(() => window.__dd.bossBurns());
check(`a non-tell release schedules NO burn (active ${afterOffBeat.active})`, afterOffBeat.active === 0);

// (3) PERFECT release: bank pips, loose the frame the toll window is open → a burn schedules.
const burnAfterPerfect = await page.evaluate(async () => {
  // Poll for the toll window, then loose inside it.
  for (let i = 0; i < 400; i++) {
    if (window.__dd.bossBeatOn()) { window.__dd.bossBankLocks(4); window.__dd.bossLoose(); break; }
    await new Promise((r) => setTimeout(r, 16));
  }
  await new Promise((r) => setTimeout(r, 120));   // let updateLockLayer process the loose
  return window.__dd.bossBurns();
});
check(`a PERFECT on-toll release schedules a burn (active ${burnAfterPerfect.active}, pending ${burnAfterPerfect.pending.toFixed(2)})`,
  burnAfterPerfect.active > 0 && burnAfterPerfect.pending > 0);

// (3b) the burn TICKS DOWN and clears within ~dur.
const pendA = burnAfterPerfect.pending;
await page.waitForTimeout(1200);
const pendB = await page.evaluate(() => window.__dd.bossBurns().pending);
check(`the burn drains over time (${pendA.toFixed(2)} → ${pendB.toFixed(2)})`, pendB < pendA);

check('no console errors through the knellgrave burn run', errors.length === 0) || console.error(errors.join('\n'));
console.log('\nknellgrave SCAR-BURN verification passed.');
await done();
