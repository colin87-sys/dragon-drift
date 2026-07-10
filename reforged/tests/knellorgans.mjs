// KNELLGRAVE lance-organ regression guard: boot the REAL engine, force
// KNELLGRAVE (BOSS_ORDER idx 9), and confirm the new LANCE organs resolve via
// partWorldPos, sit INSIDE the flight lane (laneMaxY 22 — an overhead boss can
// place organs above the player's aim ceiling; that shipped once as an unreachable
// slit), and register as paintable — the end-to-end proof that the model empties +
// def lockParts actually make the boss lance-capable in-game (§5i rung 10).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);

// Force KNELLGRAVE (idx 9 in BOSS_ORDER) and drop straight into the fight.
await page.evaluate(() => { window.__dd.bossSetDefIdx(9); window.__dd.spawnBoss(); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());
await page.waitForTimeout(1200);

const id = await page.evaluate(() => window.__dd.bossState()?.id);
check(`fighting knellgrave (got ${id})`, id === 'knellgrave');

// The bell SWINGS (pendulum, primary period ~7.4s) AND the swing amplitude GROWS with
// charge/dread (ampTarget = 0.10 + charge·0.16 + sweepK·0.30) — so an organ's world Y
// oscillates and the extreme lives in the DREAD state, not the opening idle. Sample a
// FULL period with charge DRIVEN, and test the real MAX, not one lucky frame (§CP2: a
// short opening-idle sample missed the P4-sweep peak). laneMaxY 22 is the hard aim
// ceiling; laneMinY 2.5 the floor. Keep a safety margin under 22 for the sweepK
// component this headless drive can't fully force.
const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, WOUND_CEIL = 21.5;
await page.evaluate(() => window.__dd.bossPinCharge(1));   // force the high-amplitude (dread) swing
const samples = [];
for (let i = 0; i < 40; i++) {   // 40 × 220ms ≈ 8.8s > one 7.4s swing period
  samples.push(await page.evaluate(() => ({
    wound: window.__dd.bossPartWorldPos('knellWound'),
    bindL: window.__dd.bossPartWorldPos('knellBindL'),
    bindR: window.__dd.bossPartWorldPos('knellBindR'),
    head: window.__dd.bossPartWorldPos('clapperHead'),
  })));
  await page.waitForTimeout(220);
}
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const span = (key) => {
  const ys = samples.map((s) => s[key]).filter(ok).map((p) => p.y);
  return ys.length === samples.length ? { min: Math.min(...ys), max: Math.max(...ys) } : null;
};
const wS = span('wound');
check(`wound stays aimable across the DREAD swing (y ${wS ? `${wS.min.toFixed(1)}..${wS.max.toFixed(1)}` : 'UNRESOLVED'}, need ≤ ${WOUND_CEIL})`,
  wS && wS.max <= WOUND_CEIL && wS.min >= LANE_MIN_Y);
for (const key of ['bindL', 'bindR']) {
  const s = span(key);
  check(`${key} stays in-lane across the swing (y ${s ? `${s.min.toFixed(1)}..${s.max.toFixed(1)}` : 'UNRESOLVED'})`,
    s && s.max <= LANE_MAX_Y && s.min >= LANE_MIN_Y);
}
// §CP2 BLOCKER 2: the wound must NEVER read as branding the bound prisoner's face —
// it must clear the clapperHead by a real margin at EVERY swing phase.
const headClear = samples.every((s) => ok(s.wound) && ok(s.head) && Math.hypot(s.wound.x - s.head.x, s.wound.y - s.head.y, s.wound.z - s.head.z) >= 2.5);
const minHeadGap = Math.min(...samples.filter((s) => ok(s.wound) && ok(s.head)).map((s) => Math.hypot(s.wound.x - s.head.x, s.wound.y - s.head.y, s.wound.z - s.head.z)));
check(`wound clears the bound prisoner's head at every swing phase (min gap ${minHeadGap.toFixed(1)} ≥ 2.5)`, headClear);
// Mirror invariant: the LEFT cuff stays left of the RIGHT cuff at every swing phase
// (checking opposite x-SIGNS is wrong — a hard dread swing shifts the whole clapper to
// one side of world-x=0, so both can share a sign while still being mirrored).
const mirrored = samples.every((s) => ok(s.bindL) && ok(s.bindR) && s.bindL.x < s.bindR.x);
check('bindL stays left of bindR across the swing (mirror preserved)', mirrored);

const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables include wound + both binds (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['knellWound', 'knellBindL', 'knellBindR'].every((p) => paintables.includes(p)));

check('no console errors through the knellgrave boot', errors.length === 0) || console.error(errors.join('\n'));
console.log('\nknellgrave organs verification passed.');
await done();
