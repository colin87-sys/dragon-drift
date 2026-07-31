// ONEWING SPECTRAL ECHO end-to-end (§5i rung 12): a fresh mark on each fused-frame organ grants a
// GRANTED half-strength GHOST pip on the living eye ("pips arrive in pairs"), and a release strikes
// the ghosts at echoDmgMult — the volley carries paintedCount (REAL pips, for the burn floor) and a
// volleyTotal that reflects the half-ghosts. Verifies the grant, the cap fill, and the half-damage.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(11); window.__dd.spawnBoss(); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1200);
check('fighting onewing', (await page.evaluate(() => window.__dd.bossState()?.id)) === 'onewing');

// Bank two REAL frame pips (frameGroup + frameRoot are the lockCandidates), then fire the paint
// event for each so the echo grants a ghost on the eye. __testBank does NOT emit lockPaint (so no
// auto-echo), which lets us drive real + granted pips deterministically.
const res = await page.evaluate(async () => {
  window.__lastVolley = null;
  window.__dd.on('lockVolley', (p) => { window.__lastVolley = p; });
  const realPips = window.__dd.bossBankLocks(2);            // frameGroup + frameRoot (2 real)
  window.__dd.emit('lockPaint', { part: 'frameGroup' });     // → 1 ghost on the eye
  window.__dd.emit('lockPaint', { part: 'frameRoot' });      // → 2nd ghost (pips arrive in pairs)
  window.__dd.emit('lockPaint', { part: 'frameGroup' });     // a 3rd frame mark must NOT over-echo (echoMax 2)
  await new Promise((r) => setTimeout(r, 60));
  window.__dd.bossLoose();
  await new Promise((r) => setTimeout(r, 160));
  return { realPips, v: window.__lastVolley };
});

check(`banked 2 real frame pips (got ${res.realPips})`, res.realPips === 2);
check(`the echo filled the volley to 4 pips — 2 real + 2 ghost, "pips arrive in pairs" (count ${res.v?.count})`,
  res.v && res.v.count === 4);
check(`echoMax caps the ghosts at 2 — the 3rd frame mark did NOT add a 3rd ghost`, res.v && res.v.count === 4);
check(`paintedCount is the REAL pips only (${res.v?.paintedCount}) — ghosts never feed the burn floor`,
  res.v && res.v.paintedCount === 2);
// volleyTotal = 2·dmgEach (real) + 2·0.5·dmgEach (ghost) = 3·dmgEach — the SPECTRAL half. A naive
// (no-echo) accounting would read 4·dmgEach; assert it's the halved figure, not the full one.
const ratio = res.v ? res.v.volleyTotal / res.v.dmgEach : 0;
check(`ghosts strike at HALF — volleyTotal ≈ 3×dmgEach, not 4× (ratio ${ratio.toFixed(2)})`,
  res.v && Math.abs(ratio - 3) < 0.05);

check('no console errors through the onewing echo run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nonewing echo verification FAILED.' : '\nonewing echo verification passed.');
await done();
