// ONEWING lance-organ COMFORT + REACHABILITY guard (§5i rung 12). Boot the REAL engine, force
// ONEWING (BOSS_ORDER idx 11), and confirm the INVERTED echo design's organ geometry holds:
//   - the two DWELL organs on the dead twin's fused frame (`frameGroup` upper, `frameRoot` low) sit
//     inside the 10.4 comfort band AND under the laneMaxY 22 aim ceiling, across the FULL wander;
//   - the living `onewingEye` is ABOVE the ceiling (world-Y > 22) — it can NEVER be dwell-painted,
//     which is the whole reason the echo lays a GRANTED (homed, aim-free) ghost pip on it.
// ONEWING wanders its lane autonomously (bossOnewing.js driftX — the dominant lateral term, calmed
// by def.wanderAmp), and its two drift sines beat over ~37s, so we sample ≥46s or we miss the peak
// (the WEFTWITCH-comfort lesson's "≥1 period" trap, worse here). The wander is NOT player-coupled,
// so no player-drive is needed — we measure the natural fight envelope.
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

check(`fighting onewing (got ${await page.evaluate(() => window.__dd.bossState()?.id)})`,
  (await page.evaluate(() => window.__dd.bossState()?.id)) === 'onewing');

const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, X_COMFORT = 10.4;
const STEP_MS = 200, N = 232;   // ~46.4s > the ~37s wander beat
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const samples = [];
for (let i = 0; i < N; i++) {
  samples.push(await page.evaluate(() => ({
    frame: window.__dd.bossPartWorldPos('frameGroup'),
    root: window.__dd.bossPartWorldPos('frameRoot'),
    eye: window.__dd.bossPartWorldPos('onewingEye'),
  })));
  await page.waitForTimeout(STEP_MS);
}
const env = (key) => {
  const ps = samples.map((s) => s[key]).filter(ok);
  // Tolerate a few transient unresolved frames (the model briefly rebuilds through some setpieces
  // over the 46s window); require ≥90% resolved so the envelope is still trustworthy.
  if (ps.length < samples.length * 0.9) return null;
  return { maxY: Math.max(...ps.map((p) => p.y)), minY: Math.min(...ps.map((p) => p.y)), maxAbsX: Math.max(...ps.map((p) => Math.abs(p.x))), n: ps.length };
};

// The two DWELL frame organs: comfortable in X and under the aim ceiling in Y, across the wander.
for (const [key, label] of [['frame', 'frameGroup (upper)'], ['root', 'frameRoot (low)']]) {
  const e = env(key);
  check(`${label} X comfortable across the wander (|x|≤${e ? e.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`,
    e && e.maxAbsX <= X_COMFORT);
  check(`${label} Y under the aim ceiling AND above the floor (y ${e ? `${e.minY.toFixed(1)}..${e.maxY.toFixed(1)}` : '?'} ∈ [${LANE_MIN_Y}, ${LANE_MAX_Y}])`,
    e && e.maxY <= LANE_MAX_Y && e.minY >= LANE_MIN_Y);
}

// The living eye is ABOVE the aim ceiling by design — this is WHY it's an echo (granted) target,
// never a dwell organ. If a comfort dial ever dragged it into the lane, the inverted design's
// premise would be broken (a paintable eye + a granted echo on it = double-count).
const eye = env('eye');
check(`onewingEye stays ABOVE the aim ceiling — echo TARGET only, never dwell-paintable (minY ${eye ? eye.minY.toFixed(1) : '?'} > ${LANE_MAX_Y})`,
  eye && eye.minY > LANE_MAX_Y);

check('no console errors through the onewing organ run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nonewing organ verification FAILED.' : '\nonewing organ verification passed.');
await done();
