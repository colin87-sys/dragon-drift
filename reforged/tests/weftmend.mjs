// WEFTWITCH "THE VOLLEY TEARS, SHE MENDS" (rung 11 rule, PR4b) end-to-end guard: a
// DELIBERATE ≥burnFloor-pip release tears her web → a 2.5s mid-phase mend window
// (staggerT), ONCE per phase, wiping queued sub-volleys. Verifies the trigger, the
// once-per-phase guard, and that a sub-floor (2-pip) release does NOT trigger it.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(10); window.__dd.spawnBoss(); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1200);
check('fighting weftwitch', (await page.evaluate(() => window.__dd.bossState()?.id)) === 'weftwitch');

// (1) A sub-floor release (2 pips) must NOT tear the web.
const subFloor = await page.evaluate(async () => {
  const s0 = window.__dd.bossState();
  if (s0.staggerT > 0.01) return { skip: true };   // already staggered — rerun window
  window.__dd.bossBankLocks(2); window.__dd.bossLoose();
  await new Promise((r) => setTimeout(r, 150));
  return { staggerT: window.__dd.bossState().staggerT, mendOffered: window.__dd.bossState().mendOffered };
});
check(`a 2-pip release does NOT tear the web (staggerT ${subFloor.staggerT?.toFixed?.(2) ?? 'n/a'}, mendOffered ${subFloor.mendOffered})`,
  subFloor.skip || (subFloor.staggerT < 0.01 && subFloor.mendOffered === false));

// (2a) A fork (Surge) release must NOT tear the web — only a deliberate tap/cap does
// (§CP2 SF-2: widening the source guard to include fork/decay would pass every other gate).
const forked = await page.evaluate(async () => {
  for (let i = 0; i < 200 && window.__dd.bossState().staggerT > 0.01; i++) await new Promise((r) => setTimeout(r, 50));
  if (window.__dd.bossState().mendOffered) return { skip: true };
  window.__dd.bossBankLocks(4);
  window.__dd.bossStrikeSurge();   // fires surgeForkLances → lockVolley {source:'fork'}
  await new Promise((r) => setTimeout(r, 150));
  const s = window.__dd.bossState();
  return { staggerT: s.staggerT, mendOffered: s.mendOffered };
});
check(`a Surge FORK release does NOT tear the web (staggerT ${forked.staggerT?.toFixed?.(2) ?? 'n/a'}, mendOffered ${forked.mendOffered})`,
  forked.skip || (forked.staggerT < 0.01 && forked.mendOffered === false));

// (2b) A ≥burnFloor (4-pip) DELIBERATE tap release TEARS the web → mend window opens, and it
// must be the MEND, not a thread-cut: the queued `pending` is WIPED (quiet window) but live
// ambers SURVIVE (§CP2 SF-1: the two invariants that distinguish it from the thread-cut).
const torn = await page.evaluate(async () => {
  for (let i = 0; i < 200 && window.__dd.bossState().staggerT > 0.01; i++) await new Promise((r) => setTimeout(r, 50));
  // Let her fire so there are live ambers to prove they SURVIVE the mend.
  for (let i = 0; i < 120 && window.__dd.bossState().bullets < 1; i++) await new Promise((r) => setTimeout(r, 50));
  const before = window.__dd.bossState().bullets;
  window.__dd.bossBankLocks(4); window.__dd.bossLoose();
  await new Promise((r) => setTimeout(r, 120));
  const s = window.__dd.bossState();
  return { staggerT: s.staggerT, mendOffered: s.mendOffered, pendingN: s.pendingN, bulletsBefore: before, bulletsAfter: s.bullets };
});
check(`a 4-pip TAP release TEARS the web → mend window opens (staggerT ${torn.staggerT.toFixed(2)}, mendOffered ${torn.mendOffered})`,
  torn.staggerT > 1.5 && torn.mendOffered === true);
check(`the mend window is QUIET — queued sub-volleys wiped (pendingN ${torn.pendingN})`, torn.pendingN === 0);
check(`live ambers SURVIVE the mend — NOT deleted like a thread-cut (bullets ${torn.bulletsBefore}→${torn.bulletsAfter})`,
  torn.bulletsBefore === 0 || torn.bulletsAfter > 0);

// (3) ONCE per phase: a second ≥floor release in the same phase does NOT re-open it.
const second = await page.evaluate(async () => {
  for (let i = 0; i < 200 && window.__dd.bossState().staggerT > 0.01; i++) await new Promise((r) => setTimeout(r, 50));
  window.__dd.bossBankLocks(4); window.__dd.bossLoose();
  await new Promise((r) => setTimeout(r, 150));
  return { staggerT: window.__dd.bossState().staggerT };
});
check(`a 2nd tear in the same phase is a no-op — once/phase (staggerT ${second.staggerT.toFixed(2)})`, second.staggerT < 0.01);

check('no console errors through the weftwitch mend run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nweftwitch mend verification FAILED.' : '\nweftwitch mend verification passed.');
await done();
