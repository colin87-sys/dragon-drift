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
const STEP_MS = 200, N = 72;   // ~14.4s > BOTH the station-sway period (~9s) and the yaw-wobble period (~12.6s)
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

// THE REPARENT TRAP, asserted STRICTLY (§CP2-D5): after the reparent the real face node resolves to
// NULL from `group` (getObjectByName miss, cached). We assert === null, not "null-or-far", so a name
// typo (which would ALSO fail loosely) can't pass — and the proxies resolving above (comfort checks)
// proves it's the reparent, not a broken test. If eyeHollow0 ever resolves again, the premise changed.
const face = await page.evaluate(() => window.__dd.bossPartWorldPos('eyeHollow0'));
check(`the sky-face eyeHollow0 resolves to NULL post-reparent — the exact skyReplace trap (proxies survive, it doesn't) (${face ? `x${face.x.toFixed(0)}/y${face.y.toFixed(0)}` : 'null'})`,
  face == null);

// The lance is LIVE post-reparent: the three proxies are the paintable set (the crest is V1-virtual).
const paintables = await page.evaluate(() => window.__dd.bossPaintables());
check(`paintables are the three proxies, live post-reparent (${JSON.stringify(paintables)})`,
  Array.isArray(paintables) && ['eyeMarkL', 'eyeMarkR', 'mouthMark'].every((p) => paintables.includes(p)));

// §CP2-D1 — THE CRUSH SEAL: the boss's own sky-crush clamps the player to bossArenaHY ~13.4 for
// ~10s/phase, out of reach of the HIGH organs (eyes ~y19, crest ~y19). While the crush holds they
// must LEAVE the aim/paint set (else the reticle strands the player against the invisible ceiling on
// dwell that never accrues); the LOW mouth stays the anchor; all return on the ebb.
const crush = await page.evaluate(async () => {
  window.__dd.bossCrush(true);
  await new Promise((r) => setTimeout(r, 60));
  const on = { crushOn: window.__dd.bossCrushOn(), paint: window.__dd.bossPaintables(), cands: window.__dd.bossLockCandidates?.() };
  window.__dd.bossCrush(false);
  await new Promise((r) => setTimeout(r, 60));
  const off = window.__dd.bossPaintables();
  return { on, off };
});
check(`during the sky-crush the HIGH organs are SEALED — only the low mouth remains (paintables ${JSON.stringify(crush.on.paint)})`,
  crush.on.crushOn && Array.isArray(crush.on.paint)
  && crush.on.paint.includes('mouthMark')
  && !crush.on.paint.includes('eyeMarkL') && !crush.on.paint.includes('eyeMarkR') && !crush.on.paint.includes('crestPivot'));
check(`the high organs REJOIN on the ebb (${JSON.stringify(crush.off)})`,
  Array.isArray(crush.off) && ['eyeMarkL', 'eyeMarkR', 'mouthMark', 'crestPivot'].every((p) => crush.off.includes(p)));

check('no console errors through the embertide organ run', errors.length === 0) || console.error(errors.join('\n'));
console.log(process.exitCode ? '\nembertide organ verification FAILED.' : '\nembertide organ verification passed.');
await done();
