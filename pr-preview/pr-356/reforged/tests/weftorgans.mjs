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

// laneMaxY 22 is the hard aim ceiling; laneHalfWidth 13 + the acquire cone (2.6) is the
// widest X an organ can sit at and still be reachable from the lane edge (~15.6). Sample
// the full weave/bob animation and test the extremes. Drive charge to exercise any
// amplitude coupling.
const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, X_REACH = 15.0;
await page.evaluate(() => window.__dd.bossPinCharge(1));
const samples = [];
for (let i = 0; i < 36; i++) {
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
for (const key of ['palmL', 'palmR', 'loom']) {
  const e = env(key);
  check(`${key} stays reachable across the weave (y ${e ? `${e.minY.toFixed(1)}..${e.maxY.toFixed(1)}` : 'UNRESOLVED'}, |x|≤${e ? e.maxAbsX.toFixed(1) : '?'})`,
    e && e.maxY <= LANE_MAX_Y && e.minY >= LANE_MIN_Y && e.maxAbsX <= X_REACH);
}
const last = samples[samples.length - 1];
check('palmL is left of palmR (mirror)', ok(last.palmL) && ok(last.palmR) && last.palmL.x < last.palmR.x);

const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables include both palms + loomHeart (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['palmL', 'palmR', 'loomHeart'].every((p) => paintables.includes(p)));

check('no console errors through the weftwitch boot', errors.length === 0) || console.error(errors.join('\n'));
console.log('\nweftwitch organs verification passed.');
await done();
