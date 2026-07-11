// EMBERTIDE — THE FORK IS A WEAPON (§5i rung 13) end-to-end: pips forked into a Surge WHILE THE
// BEAM DUEL IS ARMED each extend the duel window (+beamDuelExtendPerPip/pip). The lance FEEDS the
// signature Surge mechanic (ED-8: never replaces it) — the fork still does its clamped damage AND
// buys duel time; and forking with NO duel armed must NOT extend (the def-gated boundary).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(12); window.__dd.spawnBoss(); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1200);
check('fighting embertide', (await page.evaluate(() => window.__dd.bossState()?.id)) === 'embertide');

const perPip = await page.evaluate(() => window.__dd.bossState() && 0.35);   // mirror the def dial for the expected math
const EXT_PER_PIP = 0.35;

// (1) Fork with NO duel armed: the lances fire but the duel window must stay 0 (def-gated boundary).
const noDuel = await page.evaluate(async () => {
  window.__dd.bossBankLocks(3);
  window.__dd.bossStrikeSurge();
  await new Promise((r) => setTimeout(r, 60));
  return window.__dd.bossBeamDuelT();
});
check(`forking with NO duel armed does NOT open a duel (beamDuelT ${noDuel.toFixed(2)})`, noDuel <= 0.01);

// (2) Fork WHILE the duel is armed: each pip extends the window by EXT_PER_PIP. Arm a fresh 3.6s
// duel, bank 3 pips, fork — the window must grow by ~3 × 0.35 = ~1.05s (over the ~60ms that elapse).
const armed = await page.evaluate(async (per) => {
  window.__dd.bossArmBeamDuel(3.6);
  window.__dd.bossBankLocks(3);
  const before = window.__dd.bossBeamDuelT();
  window.__dd.bossStrikeSurge();
  const after = window.__dd.bossBeamDuelT();
  return { before, after, expect: 3 * per };
}, EXT_PER_PIP);
check(`the duel window is live before the fork (beamDuelT ${armed.before.toFixed(2)} > 0)`, armed.before > 3.0);
check(`forking 3 pips into the armed duel EXTENDS it by ~3×0.35=1.05s (Δ ${(armed.after - armed.before).toFixed(2)} ≈ ${armed.expect.toFixed(2)})`,
  Math.abs((armed.after - armed.before) - armed.expect) < 0.06);

// (3) The extend scales with pip count: a 6-pip fork extends ~twice a 3-pip fork.
const six = await page.evaluate(async () => {
  window.__dd.bossArmBeamDuel(3.6);
  window.__dd.bossBankLocks(6);
  const before = window.__dd.bossBeamDuelT();
  window.__dd.bossStrikeSurge();
  return window.__dd.bossBeamDuelT() - before;
});
check(`a 6-pip fork extends ~2× a 3-pip fork (Δ ${six.toFixed(2)} ≈ ${(6 * EXT_PER_PIP).toFixed(2)})`,
  Math.abs(six - 6 * EXT_PER_PIP) < 0.08);

check('no console errors through the embertide fork run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nembertide fork-is-a-weapon verification FAILED.' : '\nembertide fork-is-a-weapon verification passed.');
await done();
