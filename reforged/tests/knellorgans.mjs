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

const pos = await page.evaluate(() => ({
  wound: window.__dd.bossPartWorldPos('knellWound'),
  bindL: window.__dd.bossPartWorldPos('knellBindL'),
  bindR: window.__dd.bossPartWorldPos('knellBindR'),
}));
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
// laneMaxY 22 is the player's vertical ceiling — an organ above it can never enter
// the aim cone (player y vs organ y). All three lance organs MUST sit within reach.
const LANE_MAX_Y = 22;
const reachable = (p) => ok(p) && p.y <= LANE_MAX_Y;
check(`knellWound resolves & in-lane (${JSON.stringify(pos.wound)})`, reachable(pos.wound));
check(`knellBindL resolves & in-lane (${JSON.stringify(pos.bindL)})`, reachable(pos.bindL));
check(`knellBindR resolves & in-lane (${JSON.stringify(pos.bindR)})`, reachable(pos.bindR));
check('bindL / bindR are mirrored (distinct x)', ok(pos.bindL) && ok(pos.bindR) && Math.sign(pos.bindL.x) !== Math.sign(pos.bindR.x));

const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables include wound + both binds (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['knellWound', 'knellBindL', 'knellBindR'].every((p) => paintables.includes(p)));

check('no console errors through the knellgrave boot', errors.length === 0) || console.error(errors.join('\n'));
console.log('\nknellgrave organs verification passed.');
await done();
