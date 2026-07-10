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

// The bell SWINGS (pendulum), so an organ's world Y oscillates — sample the whole
// swing and test the EXTREMES, not one lucky frame (a single sample masked a
// lip-height anchor that grazed the ceiling at the swing peak; Codex P2). laneMaxY
// 22 is the player's aim ceiling; laneMinY 2.5 the floor. Require a headroom margin
// so the organ is reliably (not marginally) aimable at every swing phase.
const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, HEADROOM = 1.0;
const samples = [];
for (let i = 0; i < 14; i++) {
  samples.push(await page.evaluate(() => ({
    wound: window.__dd.bossPartWorldPos('knellWound'),
    bindL: window.__dd.bossPartWorldPos('knellBindL'),
    bindR: window.__dd.bossPartWorldPos('knellBindR'),
  })));
  await page.waitForTimeout(220);   // ~3s total spans a full swing
}
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const span = (key) => {
  const ys = samples.map((s) => s[key]).filter(ok).map((p) => p.y);
  return ys.length === samples.length ? { min: Math.min(...ys), max: Math.max(...ys) } : null;
};
const inLane = (s) => s && s.max <= LANE_MAX_Y - HEADROOM && s.min >= LANE_MIN_Y;
for (const key of ['wound', 'bindL', 'bindR']) {
  const s = span(key);
  check(`${key} stays in-lane across the swing (y ${s ? `${s.min.toFixed(1)}..${s.max.toFixed(1)}` : 'UNRESOLVED'}, need ≤ ${LANE_MAX_Y - HEADROOM})`, inLane(s));
}
const pos = samples[samples.length - 1];
check('bindL / bindR are mirrored (distinct x)', ok(pos.bindL) && ok(pos.bindR) && Math.sign(pos.bindL.x) !== Math.sign(pos.bindR.x));

const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables include wound + both binds (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['knellWound', 'knellBindL', 'knellBindR'].every((p) => paintables.includes(p)));

check('no console errors through the knellgrave boot', errors.length === 0) || console.error(errors.join('\n'));
console.log('\nknellgrave organs verification passed.');
await done();
