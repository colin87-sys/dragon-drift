// ONEWING rung 12 — the couplings the CP2 critic flagged as untested (§CP2 D1/D3/D4): the Surge
// FORK must halve ghost pips like the honest release (D1); the fake death must SEAL painting (D3);
// and breaking the fused frame must drop BOTH frame organs' pips + the eye's echo anchor AND delist
// them from the aim candidates + paint set — the honest sacrifice (D4). Drives the real code paths
// via debug seams (bossBreakFrame/bossFelledLie share one body with the production parry path).
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

// (D1) THE SURGE FORK halves ghosts. Bank 2 real frame pips + 2 granted ghosts, then fire the fork.
// A pre-fix fork priced all 4 at full (7.56 = roiCeil); the honest total is 3×dmgEach (2 real + 2
// half-ghost). Assert the fork event carries paintedCount 2 and volleyTotal ≈ 3×dmgEach, not 4×.
const fork = await page.evaluate(async () => {
  window.__forkV = null;
  window.__dd.on('lockVolley', (p) => { if (p.source === 'fork') window.__forkV = p; });
  window.__dd.bossBankLocks(2);
  window.__dd.emit('lockPaint', { part: 'frameGroup' });
  window.__dd.emit('lockPaint', { part: 'frameRoot' });
  await new Promise((r) => setTimeout(r, 40));
  window.__dd.bossStrikeSurge();
  await new Promise((r) => setTimeout(r, 140));
  return window.__forkV;
});
check(`the Surge FORK sees 4 pips (2 real + 2 ghost) (count ${fork?.count})`, fork && fork.count === 4);
check(`the fork's paintedCount is the REAL pips only (${fork?.paintedCount})`, fork && fork.paintedCount === 2);
const forkRatio = fork ? fork.volleyTotal / fork.dmgEach : 0;
check(`the fork HALVES ghosts — volleyTotal ≈ 3×dmgEach, not 4× (ratio ${forkRatio.toFixed(2)})`,
  fork && Math.abs(forkRatio - 3) < 0.05);

// (D3) THE FAKE DEATH seals painting. Force the felled lie; the lance layer must read deflected so
// pips freeze (ashen, never wasted) instead of lancing a boss playing dead (the one-deflect rule).
const felled = await page.evaluate(async () => {
  const before = window.__dd.bossLanceState().deflected;
  window.__dd.bossFelledLie();
  await new Promise((r) => setTimeout(r, 60));
  const during = window.__dd.bossLanceState().deflected;
  return { before, during };
});
check(`before the lie the lance is NOT deflected (${felled.before})`, felled.before === false);
check(`the fake death SEALS the lance (deflected ${felled.during})`, felled.during === true);
await page.waitForTimeout(1600);   // let the lie resolve before the terminal break test

// (D4) THE HONEST SACRIFICE. Bank frame pips + ghosts, break the frame, and assert: the banked pips
// (frame + echo anchor) are DROPPED, and both frame organs leave the aim candidates AND the paint
// set — the reticle can no longer lead to the fallen frame, and the lance is near-zero.
const brk = await page.evaluate(async () => {
  window.__dd.bossBankLocks(2);
  window.__dd.emit('lockPaint', { part: 'frameGroup' });
  window.__dd.emit('lockPaint', { part: 'frameRoot' });
  const pre = window.__dd.bossLanceState();
  window.__dd.bossBreakFrame();
  await new Promise((r) => setTimeout(r, 80));
  const post = window.__dd.bossLanceState();
  return { pre, post };
});
check(`pre-break the set held 4 pips + both frame organs paintable (pips ${brk.pre.pips}, paintables ${JSON.stringify(brk.pre.paintables)})`,
  brk.pre.pips === 4 && brk.pre.paintables.includes('frameGroup') && brk.pre.paintables.includes('frameRoot'));
check(`the break DROPS every banked pip — frame organs + echo anchor (post pips ${brk.post.pips})`, brk.post.pips === 0);
check(`the break delists both frame organs from the AIM candidates (${JSON.stringify(brk.post.candidates)})`,
  !brk.post.candidates.includes('frameGroup') && !brk.post.candidates.includes('frameRoot'));
check(`the break delists both frame organs from the PAINT set (${JSON.stringify(brk.post.paintables)})`,
  !(brk.post.paintables || []).includes('frameGroup') && !(brk.post.paintables || []).includes('frameRoot'));

check('no console errors through the onewing break/felled run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nonewing break/felled verification FAILED.' : '\nonewing break/felled verification passed.');
await done();
