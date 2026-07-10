// WEFTWITCH lance-organ COMFORT guard (§5i rung 11 → §COMFORT owner playtest): boot the REAL
// engine, force WEFTWITCH (BOSS_ORDER idx 10), and confirm her lance organs are not merely
// AIMABLE but COMFORTABLY acquirable — reachable WITHOUT flying the player against the ±13
// instant-kill wall. She is `approachFrom: 'above'`, so Y-reachability still matters (laneMaxY
// 22); but the owner-reported bug was on X: her palms sat near the wall AND fled outward as you
// chased them ("the hand locks are WAY too close to the border").
//
// THE COMFORT LAW (replaces the old X_REACH 15.6 "aimable-at-all" fiction — an organ at 15.6 is
// reachable only by a player touching the death plane at x=13-ε): an acquirable lock organ's
// world |x| must stay within  X_COMFORT = laneHalfWidth 13 − coneXY 2.6 − 2.0 slack = 10.4,
// measured at the CHASE-EQUILIBRIUM worst case. This is the SAME formula already shipped as the
// BRINEHOLM fence (tests/boss.mjs) — `worst ≤ laneHalfWidth − coneXY − 2` — generalised here.
//
// WHY THIS TEST DRIVES THE PLAYER (the load-bearing fix vs the old test): the old ruling deferred
// the gaze-chase to "a playtest judges the FEEL" and measured a NATURAL fight with NO player
// chasing — so the gaze coupling that caused the bug never fired in CI (the ENG-EW debugHold
// lesson: a gate that never exercises the load-bearing variable manufactures a green). Here we
// PIN the real player against each wall (window.__dd.player.position.x), which is the honest
// coupling input — gaze feeds off player.position.x (boss.js) — and sample ≥1 full station-sway
// period (freq 0.5 → ~12.6s) so the sway peak lines up with the saturated gaze. The NEAR palm
// (same side as the pinned player) is the worst case; the FAR palm is pushed inward (safe).
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

const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, X_COMFORT = 10.4;
const GAZE_Y = 2.3, BOB_Y = 0.8;   // headless-undriveable Y terms (gaze + station bob), added analytically
const PIN_X = 9.5;                 // pin the player near (not past) the ±13 wall — the chase worst case
const PERIOD_MS = 12600;           // station-sway period at freq 0.5
const STEP_MS = 200, N = Math.ceil((PERIOD_MS + 2600) / STEP_MS);   // ≥1 full period + settle (~76 samples ≈ 15.2s)
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);

// Sample the organs while the player is PINNED at `pinX` (re-pinned every step so gaze stays
// saturated). Returns per-organ envelopes over ≥1 sway period with the coupling firing live.
async function sweep(pinX) {
  const samples = [];
  for (let i = 0; i < N; i++) {
    samples.push(await page.evaluate((px) => {
      window.__dd.player.position.x = px;   // drive the real coupling input (gaze reads player.position.x)
      return {
        palmL: window.__dd.bossPartWorldPos('palmL'),
        palmR: window.__dd.bossPartWorldPos('palmR'),
        loom: window.__dd.bossPartWorldPos('loomHeart'),
      };
    }, pinX));
    await page.waitForTimeout(STEP_MS);
  }
  const env = (key) => {
    const ps = samples.map((s) => s[key]).filter(ok);
    if (ps.length !== samples.length) return null;
    return { maxY: Math.max(...ps.map((p) => p.y)), minY: Math.min(...ps.map((p) => p.y)), maxAbsX: Math.max(...ps.map((p) => Math.abs(p.x))), last: ps[ps.length - 1] };
  };
  return { palmL: env('palmL'), palmR: env('palmR'), loom: env('loom') };
}

// Pass A — player pinned RIGHT: palmR is the NEAR (chased) hand → its worst case.
const right = await sweep(PIN_X);
// Pass B — player pinned LEFT: palmL is the NEAR (chased) hand → its worst case.
const left = await sweep(-PIN_X);

// The NEAR palm, chased to the wall, must stay inside the comfort band (the bug was |x|→~12.6+).
check(`palmR chased to the RIGHT wall stays comfortable (|x|≤${right.palmR ? right.palmR.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`,
  right.palmR && right.palmR.maxAbsX <= X_COMFORT);
check(`palmL chased to the LEFT wall stays comfortable (|x|≤${left.palmL ? left.palmL.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`,
  left.palmL && left.palmL.maxAbsX <= X_COMFORT);

// The FAR palm (pushed inward by the full gaze reach) is trivially comfortable — assert it too so
// a regression that dropped the outward-cap and flung BOTH hands out would be caught on both sides.
check(`palmL (far, pushed inward) stays comfortable while player is RIGHT (|x|≤${right.palmL ? right.palmL.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`,
  right.palmL && right.palmL.maxAbsX <= X_COMFORT);
check(`palmR (far, pushed inward) stays comfortable while player is LEFT (|x|≤${left.palmR ? left.palmR.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`,
  left.palmR && left.palmR.maxAbsX <= X_COMFORT);

// Palms Y-safe with the analytic gaze+bob added (unchanged from the reachability guard).
for (const [key, e] of [['palmL', left.palmL], ['palmR', right.palmR]]) {
  check(`${key} Y safe incl. gaze+bob (y ${e ? `${e.minY.toFixed(1)}..${(e.maxY + GAZE_Y + BOB_Y).toFixed(1)}` : '?'} ≤ ${LANE_MAX_Y})`,
    e && e.maxY + GAZE_Y + BOB_Y <= LANE_MAX_Y && e.minY >= LANE_MIN_Y);
}

// loomHeart — the RELIABLE anchor: sways with the body but has NO gaze/cast coupling (flying at it
// does NOT push it away), so it stays deep in the comfort band on both passes.
for (const [tag, lm] of [['player RIGHT', right.loom], ['player LEFT', left.loom]]) {
  check(`loomHeart anchor comfortable + Y-safe (${tag}) (y ${lm ? `${lm.minY.toFixed(1)}..${lm.maxY.toFixed(1)}` : '?'}, |x|≤${lm ? lm.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`,
    lm && lm.maxY + GAZE_Y + BOB_Y <= LANE_MAX_Y && lm.minY >= LANE_MIN_Y && lm.maxAbsX <= X_COMFORT);
}

check('palmL is left of palmR (mirror)', ok(right.palmL?.last) && ok(right.palmR?.last) && right.palmL.last.x < right.palmR.last.x);

const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables include both palms + loomHeart (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['palmL', 'palmR', 'loomHeart'].every((p) => paintables.includes(p)));

check('no console errors through the weftwitch comfort run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nweftwitch organ-comfort verification FAILED.' : '\nweftwitch organ-comfort verification passed.');
await done();
