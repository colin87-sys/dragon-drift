// WEFTWITCH lance-organ reachability guard (§5i rung 11): boot the REAL engine, force
// WEFTWITCH (BOSS_ORDER idx 10), and confirm her lance organs resolve via partWorldPos
// and sit INSIDE the flight lane across her weave/gaze/bob animation. She is an
// `approachFrom: 'above'` boss, so the PR2a reachability trap is live: an organ whose
// world Y exceeds laneMaxY (22) is UNAIMABLE and the static economy model can't see it.
// The pre-audit predicted palms pass (world y ~11-19) + loomHeart passes (~17), and that
// weftScar would FAIL (~24) — which is why it is NOT a lock organ.
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

check(`fighting weftwitch (got ${await page.evaluate(() => window.__dd.bossState()?.id)})`,
  (await page.evaluate(() => window.__dd.bossState()?.id)) === 'weftwitch');

// laneMaxY 22 is the hard aim ceiling; laneHalfWidth 13 + the acquire cone (2.6) = the
// widest X an organ can sit at and still be reachable from the lane edge (X_REACH 15.6).
// ⚠ DO NOT pin charge here (§CP2 B1): bossPinCharge zeroes pose.x, DELETING the ±5.0
// station sway — the dominant X term. Measure the NATURAL fight (sway + weave live) and
// assert honestly, adding the headless-undriveable terms analytically.
// THE RULING (§CP2 B1): the palms are MOVING organs. Y is safe by a wide margin. On X, the
// SWAY-INCLUSIVE base position must stay in reach (asserted), but the gaze-chase (up to
// +3.9 world — flying at a palm PUSHES it away) and the thread-cut recoil (+~3.4) push ONE
// palm TRANSIENTLY beyond X_REACH. That is DESIGNED intermittent reach (the Colossi+
// moving-organ grammar): loomHeart (x≈0, the guaranteed anchor) + the mirror palm stay in
// reach, and freshenLocks banks the set over the ~9s sway cycle. The full-worst-case bound
// (sway+gaze+cut) exceeds X_REACH by construction — a preview/playtest judges the FEEL of
// banking the set; this test guards the floor (base+sway reachable, Y safe, anchor solid).
const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, X_REACH = 15.6;
const GAZE_Y = 2.3, BOB_Y = 0.8;   // headless-undriveable Y terms (gaze + station bob), added analytically
const samples = [];
for (let i = 0; i < 52; i++) {   // 52 × 200ms ≈ 10.4s > the ~9s station-sway period
  samples.push(await page.evaluate(() => ({
    palmL: window.__dd.bossPartWorldPos('palmL'),
    palmR: window.__dd.bossPartWorldPos('palmR'),
    loom: window.__dd.bossPartWorldPos('loomHeart'),
  })));
  await page.waitForTimeout(200);
}
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const env = (key) => {
  const ps = samples.map((s) => s[key]).filter(ok);
  if (ps.length !== samples.length) return null;
  return { maxY: Math.max(...ps.map((p) => p.y)), minY: Math.min(...ps.map((p) => p.y)), maxAbsX: Math.max(...ps.map((p) => Math.abs(p.x))) };
};
// loomHeart — the RELIABLE anchor: it rides the station sway like everything else (it is a
// group child, so it is NOT pinned at x≈0), BUT it has NO gaze/cast coupling, so flying at
// it does NOT push it away (the palms' carrot). Reachable throughout: |x| = sway only
// (~±6.5 analytic; measured 4.7) « X_REACH, and Y low.
const lm = env('loom');
check(`loomHeart is the reliable anchor — swaying but always in reach (y ${lm ? `${lm.minY.toFixed(1)}..${lm.maxY.toFixed(1)}` : '?'}, |x|≤${lm ? lm.maxAbsX.toFixed(1) : '?'} ≤ ${X_REACH})`,
  lm && lm.maxY + GAZE_Y + BOB_Y <= LANE_MAX_Y && lm.minY >= LANE_MIN_Y && lm.maxAbsX + 2.0 <= X_REACH);
// Palms — Y safe with the analytic gaze+bob added; X base+sway within reach (the floor).
for (const key of ['palmL', 'palmR']) {
  const e = env(key);
  check(`${key} Y safe incl. gaze+bob (y ${e ? `${e.minY.toFixed(1)}..${(e.maxY + GAZE_Y + BOB_Y).toFixed(1)}` : '?'} ≤ ${LANE_MAX_Y})`,
    e && e.maxY + GAZE_Y + BOB_Y <= LANE_MAX_Y && e.minY >= LANE_MIN_Y);
  check(`${key} base+sway X within reach (|x|≤${e ? e.maxAbsX.toFixed(1) : '?'} ≤ ${X_REACH}; gaze/cut add transient excursions — see ruling)`,
    e && e.maxAbsX <= X_REACH);
}
const last = samples[samples.length - 1];
check('palmL is left of palmR (mirror)', ok(last.palmL) && ok(last.palmR) && last.palmL.x < last.palmR.x);

const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables include both palms + loomHeart (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['palmL', 'palmR', 'loomHeart'].every((p) => paintables.includes(p)));

check('no console errors through the weftwitch boot', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nweftwitch organs verification FAILED.' : '\nweftwitch organs verification passed.');
await done();
