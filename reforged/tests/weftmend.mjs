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

// (2) A ≥burnFloor (4-pip) DELIBERATE release TEARS the web → mend window opens.
const torn = await page.evaluate(async () => {
  // Wait for any residual stagger to clear so we measure the trigger cleanly.
  for (let i = 0; i < 200 && window.__dd.bossState().staggerT > 0.01; i++) await new Promise((r) => setTimeout(r, 50));
  window.__dd.bossBankLocks(4); window.__dd.bossLoose();
  await new Promise((r) => setTimeout(r, 150));
  const s = window.__dd.bossState();
  return { staggerT: s.staggerT, mendOffered: s.mendOffered, bullets: s.bullets };
});
check(`a 4-pip release TEARS the web → mend window opens (staggerT ${torn.staggerT.toFixed(2)}, mendOffered ${torn.mendOffered})`,
  torn.staggerT > 1.5 && torn.mendOffered === true);

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
