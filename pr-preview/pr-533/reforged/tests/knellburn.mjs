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
const perfect = await page.evaluate(async () => {
  for (let i = 0; i < 400; i++) {
    if (window.__dd.bossBeatOn()) { window.__dd.bossBankLocks(4); window.__dd.bossLoose(); break; }
    await new Promise((r) => setTimeout(r, 16));
  }
  await new Promise((r) => setTimeout(r, 120));   // let updateLockLayer process the loose
  return { burns: window.__dd.bossBurns(), hp: window.__dd.bossState().hp };
});
check(`a PERFECT on-toll release schedules a burn (active ${perfect.burns.active}, pending ${perfect.burns.pending.toFixed(2)})`,
  perfect.burns.active > 0 && perfect.burns.pending > 0);

// (3b) the burn actually DAMAGES the boss (hp falls) as it ticks — not just a counter
// that decrements (§CP2 SHOULD-FIX-3: `pending` draining alone would stay green even if
// damageBoss('lockburn') were a no-op).
const pendA = perfect.burns.pending, hpA = perfect.hp;
// Burn ticks fire every tickInterval (0.3s) of GAME time; headless software-GL caps
// dt and runs at a few fps, so a fixed 1.4s wall window can elapse LESS than one tick
// interval of game-time (the burn then reads unchanged — not a no-op, just un-ticked).
// POLL until at least one tick lands (pending drops) — it always does given real time.
let afterDrain = { pending: pendA, hp: hpA };
for (let i = 0; i < 40 && afterDrain.pending >= pendA; i++) {   // up to ~10s of real time
  await page.waitForTimeout(250);
  afterDrain = await page.evaluate(() => ({ pending: window.__dd.bossBurns().pending, hp: window.__dd.bossState().hp }));
}
check(`the burn drains its counter over time (${pendA.toFixed(2)} → ${afterDrain.pending.toFixed(2)})`, afterDrain.pending < pendA);
check(`the burn actually reduces boss hp (${hpA.toFixed(1)} → ${afterDrain.hp.toFixed(1)})`, afterDrain.hp < hpA);

// (4) DEFLECT-PAUSE: a fresh burn frozen under a raised shield — no ticks, no loss (the
// one-deflect rule). Schedule a burn, raise the shield, and confirm `pending` holds.
const paused = await page.evaluate(async () => {
  for (let i = 0; i < 400; i++) {
    if (window.__dd.bossBeatOn()) { window.__dd.bossBankLocks(4); window.__dd.bossLoose(); break; }
    await new Promise((r) => setTimeout(r, 16));
  }
  await new Promise((r) => setTimeout(r, 120));
  window.__dd.bossRaiseShield();
  const p0 = window.__dd.bossBurns().pending;
  await new Promise((r) => setTimeout(r, 700));   // >2 tick intervals
  return { p0, p1: window.__dd.bossBurns().pending };
});
check(`the burn PAUSES while shielded (pending held ${paused.p0.toFixed(2)} → ${paused.p1.toFixed(2)})`,
  paused.p0 > 0 && Math.abs(paused.p1 - paused.p0) < 1e-6);

check('no console errors through the knellgrave burn run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nknellgrave SCAR-BURN verification FAILED.' : '\nknellgrave SCAR-BURN verification passed.');
await done();
