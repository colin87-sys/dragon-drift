// EMBERTIDE lance-organ COMFORT + REPARENT guard (§5i rung 13). The CP1 found the plan's face
// organs FATALLY unbuildable: EMBERTIDE is `skyReplace`, so enterFight reparents the whole `rig`
// (dome + face + the eyeHollow/mouthNotch reliefs) OUT of `group` onto the scene — after which
// partWorldPos('eyeHollow0') resolves to NULL (cached), and even resolved the face sits at world-Y
// 150+/|x| 90-420. So the AIM organs are STATION-SPACE proxies on `group` (eyeMarkL/R, mouthMark) +
// crestPivot; the brand renders on the sky-face. THIS TEST MUST RUN THE POST-REPARENT LIVE FIGHT
// (bossForceFight → enterFight → scene.add(rig)) — a studio/pre-reparent test would GREEN on a dead
// lance (the reparent only happens in the live fight).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
await page.evaluate(() => { window.__dd.bossSetDefIdx(12); window.__dd.spawnBoss(); });
await page.waitForTimeout(600);
await page.evaluate(() => window.__dd.bossForceFight());   // ← the reparent happens HERE
await page.waitForTimeout(1200);

check(`fighting embertide (got ${await page.evaluate(() => window.__dd.bossState()?.id)})`,
  (await page.evaluate(() => window.__dd.bossState()?.id)) === 'embertide');

const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, X_COMFORT = 10.4;
const STEP_MS = 200, N = 58;   // ~11.6s > the default station-sway period (~9s at freq 0.7)
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const samples = [];
for (let i = 0; i < N; i++) {
  samples.push(await page.evaluate(() => ({
    eyeL: window.__dd.bossPartWorldPos('eyeMarkL'),
    eyeR: window.__dd.bossPartWorldPos('eyeMarkR'),
    mouth: window.__dd.bossPartWorldPos('mouthMark'),
    crest: window.__dd.bossPartWorldPos('crestPivot'),
  })));
  await page.waitForTimeout(STEP_MS);
}
const env = (key) => {
  const ps = samples.map((s) => s[key]).filter(ok);
  if (ps.length < samples.length * 0.9) return null;
  return { maxY: Math.max(...ps.map((p) => p.y)), minY: Math.min(...ps.map((p) => p.y)), maxAbsX: Math.max(...ps.map((p) => Math.abs(p.x))) };
};

// The three PROXY organs + the crest anchor survive the reparent (they're on `group`) and sit inside
// the comfort band across the full station sway.
for (const [key, label] of [['eyeL', 'eyeMarkL'], ['eyeR', 'eyeMarkR'], ['mouth', 'mouthMark'], ['crest', 'crestPivot (V1 anchor)']]) {
  const e = env(key);
  check(`${label} X comfortable across the sway (|x|≤${e ? e.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`, e && e.maxAbsX <= X_COMFORT);
  check(`${label} Y in the lane (y ${e ? `${e.minY.toFixed(1)}..${e.maxY.toFixed(1)}` : '?'} ∈ [${LANE_MIN_Y}, ${LANE_MAX_Y}])`,
    e && e.maxY <= LANE_MAX_Y && e.minY >= LANE_MIN_Y);
}

// THE REPARENT TRAP, asserted directly: the real face node is NO LONGER reachable from `group` after
// enterFight — partWorldPos returns null (or, if resolved, sits far outside the lane). This is WHY the
// aim targets are proxies. If this ever starts resolving in-lane, the design premise changed.
const face = await page.evaluate(() => window.__dd.bossPartWorldPos('eyeHollow0'));
check(`the sky-face eyeHollow0 is NOT an in-lane aim target post-reparent (${face ? `world x${face.x.toFixed(0)}/y${face.y.toFixed(0)}` : 'null — reparented off group'})`,
  !face || Math.abs(face.x) > X_COMFORT || face.y > LANE_MAX_Y);

// The lance is LIVE post-reparent: the three proxies are the paintable set (the crest is V1-virtual).
const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables are the three proxies, live post-reparent (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['eyeMarkL', 'eyeMarkR', 'mouthMark'].every((p) => paintables.includes(p)));

check('no console errors through the embertide organ run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nembertide organ verification FAILED.' : '\nembertide organ verification passed.');
await done();
