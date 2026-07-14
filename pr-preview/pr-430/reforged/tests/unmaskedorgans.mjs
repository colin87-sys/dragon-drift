// THE UNMASKED lance-organ COMFORT guard (§5i rung 14, the finale). Force the APEX (BOSS_ORDER idx
// 13) and confirm every paint organ across the THREE stages sits in the comfort lane at scale 2.4
// (|x| ≤ 10.4, y ∈ [2.5, 22]) across the full station sway + yaw-wobble.
//
// THE §lance CP1 FINDING this test locks in: the eight VISIBLE wing eyes sit at the wing ELBOWS,
// which at scale 2.4 land OUT of lane (upper pair world-Y ~28; lower/middle |x| > 10.4) — the ONEWING
// out-of-lane trap across a whole organ family. The fix was AUTHORING six NEW inner-covert eyes
// (wingEye0..5) at comfort-legal seeds. This test proves those six + the crack seams + the relics +
// the wing-roots are all in-lane in the REAL post-enterFight fight — a studio-pose test would green on
// a lance that strands the player at the kill wall / above the aim ceiling.
//
// NOT skyReplace (approachFrom 'ahead'): the organs live on `group`, resolve via partWorldPos with no
// reparent. The positive proof the LIVE path ran (placeGroup placed the boss, not the studio origin)
// is focalEye resolving at the fight height y≈13, NOT y 0. Each stage is measured in its OWN fresh
// forceFight boot (~15s), so the ~55s player-death of an idle fight can never null a late stage — and
// the group transform that DETERMINES comfort is identical across boots. Stages 2/3 pin the visible
// rig at spawn (bossSetStage → the sub-rig scales to 1.0, so its organs sit at their real positions).
import { boot, check } from './browser.mjs';

const LANE_MAX_Y = 22, LANE_MIN_Y = 2.5, X_COMFORT = 10.4;
const STEP_MS = 220, N = 68;   // ~15s > BOTH the station-sway period (~9s) and the yaw-wobble period (~12.6s)
const okp = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);

// One fresh boot per stage — force the fight, pin the stage, sample the organ world positions.
async function measureStage(stage, names) {
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
  });
  await page.waitForTimeout(800);
  await page.click('#btn-start');
  await page.waitForTimeout(600);
  // Pin the starting stage BEFORE spawn (sets the initial visible rig + the form's phase), then spawn
  // + force the fight (the real enterFight placement).
  await page.evaluate((s) => { window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(s); window.__dd.spawnBoss(); }, stage);
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForTimeout(600);
  await page.evaluate((s) => window.__dd.bossSetStage(s), stage);   // re-pin live (spawn pin + live pin — belt and braces)
  await page.waitForTimeout(400);
  const id = await page.evaluate(() => window.__dd.bossState()?.id);
  const acc = {}; for (const n of names) acc[n] = [];
  for (let i = 0; i < N; i++) {
    const snap = await page.evaluate((ns) => { const o = {}; for (const n of ns) o[n] = window.__dd.bossPartWorldPos(n); return o; }, names);
    for (const n of names) if (okp(snap[n])) acc[n].push(snap[n]);
    await page.waitForTimeout(STEP_MS);
  }
  const paintables = await page.evaluate(() => window.__dd.bossPaintables());
  const env = {};
  for (const n of names) {
    const ps = acc[n];
    env[n] = ps.length >= N * 0.9
      ? { maxAbsX: Math.max(...ps.map((p) => Math.abs(p.x))), minY: Math.min(...ps.map((p) => p.y)), maxY: Math.max(...ps.map((p) => p.y)), n: ps.length }
      : null;
  }
  await done();
  return { id, env, paintables, errors };
}
const comfort = (label, e) => {
  check(`${label} X comfortable (|x|≤${e ? e.maxAbsX.toFixed(1) : '?'} ≤ ${X_COMFORT})`, e && e.maxAbsX <= X_COMFORT);
  check(`${label} Y in the lane (y ${e ? `${e.minY.toFixed(1)}..${e.maxY.toFixed(1)}` : '?'} ∈ [${LANE_MIN_Y}, ${LANE_MAX_Y}])`,
    e && e.maxY <= LANE_MAX_Y && e.minY >= LANE_MIN_Y);
};
let allErrors = [];

// ── STAGE 1 — the eclipse: the two crack-seam wounds + the focal eye (V1). ──
const S1 = await measureStage(1, ['crackSeamL', 'crackSeamR', 'focalEye']);
allErrors = allErrors.concat(S1.errors);
check(`fighting the unmasked at stage 1 (got ${S1.id})`, S1.id === 'unmasked');
comfort('S1 crackSeamL', S1.env.crackSeamL);
comfort('S1 crackSeamR', S1.env.crackSeamR);
comfort('S1 focalEye (V1 aim)', S1.env.focalEye);
// POSITIVE LIVE-PATH PROOF: placeGroup placed the boss at the fight height, not the studio origin —
// focalEye sits at y≈13, never y≈0. A studio-pose test greens on a dead placement; this proves the
// real post-enterFight transform ran.
check(`S1 focalEye resolves at the fight height (live placeGroup ran, not the studio origin) — minY ${S1.env.focalEye ? S1.env.focalEye.minY.toFixed(1) : '?'} > 8`,
  S1.env.focalEye && S1.env.focalEye.minY > 8);
check(`S1 paintables are the two crack seams + the V1 eye (${JSON.stringify(S1.paintables)})`,
  Array.isArray(S1.paintables) && ['crackSeamL', 'crackSeamR', 'focalEye'].every((p) => S1.paintables.includes(p))
  && !S1.paintables.includes('wingEye0'));

// ── STAGE 2 — the seraph: the SIX AUTHORED inner eyes + the FIVE relics (THE RECKONING targets). ──
const s2names = ['wingEye0', 'wingEye1', 'wingEye2', 'wingEye3', 'wingEye4', 'wingEye5',
  'relicHorn', 'relicBlade', 'relicLink', 'relicSpool', 'relicShard'];
const S2 = await measureStage(2, s2names);
allErrors = allErrors.concat(S2.errors);
for (const n of s2names) comfort(`S2 ${n}`, S2.env[n]);
// The whole reason the design AUTHORED new eyes: the elbow eyes would be Y-OUT/X-OUT. Assert the six
// authored eyes clear the ceiling with real margin (the upper pair is tightest — under 22 at ~19.5).
const upperMaxY = Math.max(S2.env.wingEye0?.maxY ?? 99, S2.env.wingEye1?.maxY ?? 99);
check(`the authored inner eyes clear the aim ceiling with margin (upper pair maxY ${upperMaxY.toFixed(1)} < 22, NOT the elbow eyes' ~28) — the CP1 authoring fix holds`,
  upperMaxY < 22 && upperMaxY > 15);
// Stage 2 reaches the tier-5 cap: the eyes + relics + virtual are all paintable (phase-gated [1]).
check(`S2 paintables include all six eyes + all five relics + the virtual eye (${S2.paintables?.length} targets)`,
  Array.isArray(S2.paintables)
  && ['wingEye0', 'wingEye1', 'wingEye2', 'wingEye3', 'wingEye4', 'wingEye5', 'relicHorn', 'relicBlade', 'relicLink', 'relicSpool', 'relicShard', 'focalEye'].every((p) => S2.paintables.includes(p))
  && !S2.paintables.includes('crackSeamL'));

// ── STAGE 3 — the unveiling: the two wing-roots + the focal core. ──
const S3 = await measureStage(3, ['wingRootL', 'wingRootR', 'focalEye', 'starEye']);
allErrors = allErrors.concat(S3.errors);
comfort('S3 wingRootL', S3.env.wingRootL);
comfort('S3 wingRootR', S3.env.wingRootR);
comfort('S3 focalEye (V1 core)', S3.env.focalEye);
// THE COLLAPSE PIN (§CP1 finding 7): in stage 3 the stage-1 focalEye collapses to the rig centre,
// coincident with the visible star-eye — so the virtual aim anchor lands ON the core the player sees.
// starEye is NOT a lockPart (painting it would double a target on one pixel); this pins WHY.
const coincident = S3.env.focalEye && S3.env.starEye
  && Math.abs(S3.env.focalEye.maxAbsX - S3.env.starEye.maxAbsX) < 1.5
  && Math.abs(S3.env.focalEye.maxY - S3.env.starEye.maxY) < 1.5;
check(`S3 focalEye (V1) and the visible starEye are coincident at the core — the aim anchor lands on the unveiled eye (starEye kept OUT of lockParts to avoid a one-pixel double target)`,
  coincident);
check(`S3 paintables are the two wing-roots + the V1 core, NOT starEye/halo (${JSON.stringify(S3.paintables)})`,
  Array.isArray(S3.paintables) && ['wingRootL', 'wingRootR', 'focalEye'].every((p) => S3.paintables.includes(p))
  && !S3.paintables.includes('starEye') && !S3.paintables.includes('halo'));

check('no console errors through the unmasked organ runs', allErrors.length === 0) || console.error(allErrors.slice(0, 5).join('\n'));
console.log(process.exitCode ? '\nunmasked organ verification FAILED.' : '\nunmasked organ verification passed.');
