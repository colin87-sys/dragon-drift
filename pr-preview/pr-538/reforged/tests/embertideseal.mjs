// EMBERTIDE — the P4→P5 SEALED-FORK guard (§CP2-D2, the bug of this rung). The flagship play is
// "bank a full set at the P4 floor, then tap": the tap → strikeSurge → breakShield (which ARMS the
// P5 Horizon Break SURVIVAL card → lockDeflected true) → surgeForkLances. Without the guard, every
// forked pip arrives VOIDED into the seal — the exact one-deflect "no lance is ever silently wasted"
// violation. The fix keeps the banked set (it resumes ashen after the survival card). We reproduce
// the sealed state by fast-forwarding to P5 (the survival card), where lockDeflected is true.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(12); window.__dd.bossSetPhase(5); window.__dd.spawnBoss(); });   // P5 jump must precede the fight
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1400);
check('fighting embertide', (await page.evaluate(() => window.__dd.bossState()?.id)) === 'embertide');

// Confirm we're actually in the SEALED survival window (the P5 Horizon Break card → lockDeflected).
const sealed = await page.evaluate(() => window.__dd.bossLanceState().deflected);
check('P5 (Horizon Break) SEALS the lance — lockDeflected true (the honest-zero window)', sealed === true);

// Bank a full set, arm a duel, then FORK into the sealed window. The pips must be KEPT (not voided),
// and the sealed fork must NOT extend the duel (no reward for a wasted release).
const res = await page.evaluate(async () => {
  window.__dd.bossBankLocks(6);
  const pipsBefore = window.__dd.bossLanceState().pips;
  window.__dd.bossArmBeamDuel(3.6);
  const duelBefore = window.__dd.bossBeamDuelT();
  window.__dd.bossStrikeSurge();                 // strikeSurge → (aimed unleash) → surgeForkLances, into the seal
  await new Promise((r) => setTimeout(r, 80));
  return { pipsBefore, pipsAfter: window.__dd.bossLanceState().pips, duelBefore, duelAfter: window.__dd.bossBeamDuelT() };
});
check(`banked a full set before the sealed fork (pips ${res.pipsBefore})`, res.pipsBefore === 6);
check(`the sealed fork KEEPS the banked set — not voided into the P5 seal (pips ${res.pipsBefore}→${res.pipsAfter})`,
  res.pipsAfter === res.pipsBefore);
// The fork bailed on the seal BEFORE the extend, so the duel must not GROW (it only decays naturally
// over the wait — a negative Δ is the duel ticking down, not the fork feeding it).
check(`the sealed fork does NOT extend the duel — no reward for a voided release (Δ ${(res.duelAfter - res.duelBefore).toFixed(2)} ≤ 0)`,
  res.duelAfter <= res.duelBefore + 0.01);

check('no console errors through the embertide seal run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nembertide sealed-fork verification FAILED.' : '\nembertide sealed-fork verification passed.');
await done();
