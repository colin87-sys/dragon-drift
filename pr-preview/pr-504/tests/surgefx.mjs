// SUNBREAK surge state-machine baseline (I0). Locks the capture-seam CONTRACT the
// later increments build on: the seams are dormant with `__ddSurgeForce` undefined
// (roster byte-identity), the introspection API is stable, the pin toggles cleanly
// and leaves no residue, and no unleash cinematic leaks into off frames. The cascade
// order / beam value-band / juice asserts arrive in I2–I4 as those systems land.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
// Pin tier 0 so headless software-GL never drops tiers mid-test.
await page.evaluate(() => { window.__dd.save.settings.qualityOverride = 0; });
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

// 1. The capture seam is DORMANT by default — the byte-identity contract.
check('__ddSurgeForce undefined in play',
  await page.evaluate(() => typeof window.__ddSurgeForce === 'undefined'));
const st0 = await page.evaluate(() => window.__dd.surgeState());
check('surge cinematic inactive by default', st0.active === false && st0.forced === false);
check('beam hidden by default', st0.beamVisible === false);

// 2. The introspection API is stable (the shape I2–I4 read).
check('surgeState exposes the beat fields',
  ['active', 'phase', 't', 'beamVisible', 'forced', 'drawCalls'].every((k) => k in st0));
check('drawCalls is a live number', typeof st0.drawCalls === 'number' && st0.drawCalls > 0);

// 3. The pin toggles cleanly and leaves NO residue when cleared.
await page.evaluate(() => window.__dd.surgeSeam('beam'));
check('surgeSeam arms the force flag',
  await page.evaluate(() => window.__dd.surgeState().forced === true &&
    typeof window.__ddSurgeForce === 'object'));
await page.evaluate(() => window.__dd.surgeSeam('apex'));
check('surgeSeam re-targets the beat',
  await page.evaluate(() => window.__ddSurgeForce.beat === 'apex'));
await page.evaluate(() => window.__dd.surgeSeam(null));
check('surgeSeam(null) clears the force flag → back to dormant',
  await page.evaluate(() => window.__dd.surgeState().forced === false &&
    typeof window.__ddSurgeForce === 'undefined'));

// 4. Off frames stay clean: with no cast and no pin, no cinematic ever appears and
//    the slow-mo/timeScale channel is untouched (the "Surge-off frames byte-identical"
//    proxy — the beam can only show via an explicit cast or pin).
await page.waitForTimeout(500);
const off = await page.evaluate(() => {
  const s = window.__dd.surgeState();
  return { active: s.active, beam: s.beamVisible, ts: window.__dd.game.timeScale };
});
check('no cinematic leaks into off frames', off.active === false && off.beam === false);
check('timeScale untouched with Surge idle', off.ts === 1);

// ── I1: world-suppression grade envelope (trace-based per §M.1-10) ──────────────
// Byte-identity: with Surge idle the exposure write is untouched and the grade is 0.
const idle = await page.evaluate(() => window.__dd.surgeState());
check('grade 0 + exposure == base when Surge idle (off-frame byte-identity)',
  idle.gradeMix === 0 && Math.abs(idle.exposure - idle.exposureBase) < 1e-6);

// Rising edge → DRAGON LEADS: the grade onset is delayed, so the first frames after the
// edge are still ~0 (the world waits a beat while the dragon ignites).
await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; });
await page.waitForTimeout(60);
const onset = await page.evaluate(() => window.__dd.surgeState().gradeMix);
check(`world grade lags ignition onset (${onset.toFixed(3)} ≤ 0.15 just after the edge)`, onset <= 0.15);

// Sustained → the grade ramps to full and the exposure dips ~−0.4 EV (≤ base×0.80).
let full = 0;
for (let i = 0; i < 40; i++) {
  full = await page.evaluate(() => window.__dd.surgeState().gradeMix);
  if (full >= 0.9) break;
  await page.waitForTimeout(400);
}
check(`grade ramps to full under sustained Surge (${full.toFixed(3)} ≥ 0.9)`, full >= 0.9);
const dip = await page.evaluate(() => window.__dd.surgeState());
check(`exposure dips ≈ −0.4 EV at full grade (${(dip.exposure / dip.exposureBase).toFixed(3)}× ≤ 0.80)`,
  dip.exposure <= dip.exposureBase * 0.80 && dip.exposure >= dip.exposureBase * 0.70);

// Falling edge → the grade releases (and the exposure lifts back toward base).
await page.evaluate(() => { window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; });
let rel = full;
for (let i = 0; i < 20; i++) {
  rel = await page.evaluate(() => window.__dd.surgeState().gradeMix);
  if (rel < 0.3) break;
  await page.waitForTimeout(300);
}
check(`grade releases after the Surge ends (${rel.toFixed(3)} < 0.3)`, rel < 0.3);

// ── I2: anatomical ignition cascade (pure-sampler traces, frame-clock-independent) ──────
const un = (a, b) => Math.abs(a - b) / Math.min(a, b);

// Forward cascade: order eyes<spine<wings<rim, onset gaps ≥120ms and pairwise UNEVEN ≥15%.
const casOn = await page.evaluate(() => {
  const th = 0.05, on = [-1, -1, -1, -1];
  for (let t = 0; t <= 1.0; t += 0.002) { const L = window.__dd.surgeCascadeAt(t); for (let i = 0; i < 4; i++) if (on[i] < 0 && L[i] >= th) on[i] = t; }
  return on;
});
const cg = [casOn[1] - casOn[0], casOn[2] - casOn[1], casOn[3] - casOn[2]];
check(`cascade order eyes<spine<wings<rim (onsets ${casOn.map((o) => Math.round(o * 1000)).join('/')}ms)`,
  casOn[0] < casOn[1] && casOn[1] < casOn[2] && casOn[2] < casOn[3]);
check(`station gaps ≥120ms (${cg.map((g) => Math.round(g * 1000)).join('/')})`, cg.every((g) => g >= 0.118));
check('station gaps pairwise UNEVEN ≥15% (no metronome)',
  un(cg[0], cg[1]) >= 0.15 && un(cg[1], cg[2]) >= 0.15 && un(cg[0], cg[2]) >= 0.15);

// Per-station attack sharp enough to read as an EVENT (eye ≤60ms, others ≤120ms; 10→70%).
const atk = await page.evaluate(() => {
  const out = []; for (let i = 0; i < 4; i++) { let a = -1, b = -1; for (let t = 0; t <= 1; t += 0.001) { const L = window.__dd.surgeCascadeAt(t)[i]; if (a < 0 && L >= 0.1) a = t; if (b < 0 && L >= 0.7) { b = t; break; } } out.push(b - a); } return out;
});
check(`per-station attack (10→70%) eye ≤60ms (${Math.round(atk[0] * 1000)}), rest ≤120ms (${atk.slice(1).map((x) => Math.round(x * 1000)).join('/')})`,
  atk[0] <= 0.062 && atk.slice(1).every((x) => x <= 0.122));

// DECAY reverse order: rim dims FIRST → wings → spine → EYE holds LAST (50%-decay progress).
const dOn = await page.evaluate(() => {
  const half = [-1, -1, -1, -1];
  for (let p = 0; p <= 1.0; p += 0.002) { const R = window.__dd.surgeDecayAt(p); for (let i = 0; i < 4; i++) if (half[i] < 0 && R[i] <= 0.5) half[i] = p; }
  return half;   // [eye,spine,wing,rim] progress at 50% decayed
});
check(`decay reverse order rim<wings<spine<eye (eye holds last; 50%@ ${dOn.map((p) => p.toFixed(2)).join('/')})`,
  dOn[3] < dOn[2] && dOn[2] < dOn[1] && dOn[1] < dOn[0]);
const eyeHold = await page.evaluate(() => window.__dd.surgeDecayAt(0.55)[0]);
check(`eye still ≥60% lit at 55% through decay (holds last) (${eyeHold.toFixed(2)})`, eyeHold >= 0.6);

// SUSTAIN flares: trigger a fresh surge, read the seeded centres — count 3–4, gaps uneven,
// travelling ripple (rim crest lags eye crest 250–450ms), deterministic (no Math.random).
await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; });
await page.waitForTimeout(50);
const cas = await page.evaluate(() => window.__dd.surgeCascade());
const fg = [cas.flares[1] - cas.flares[0], cas.flares[2] - cas.flares[1], cas.flares[3] - cas.flares[2]];
check(`sustain flares: 3–4 seeded centres (${cas.flares.length})`, cas.flares.length >= 3 && cas.flares.length <= 4);
check(`flare gaps non-metronome, pairwise ≥12% (${fg.map((g) => g.toFixed(2)).join('/')}s)`,
  un(fg[0], fg[1]) >= 0.12 && un(fg[1], fg[2]) >= 0.12);
// travel: at the first flare's eye-crest, the rim crest arrives later (250–450ms lag).
const travel = await page.evaluate((c0) => {
  let eyePk = -1, rimPk = -1, eBest = 0, rBest = 0;
  for (let t = c0 - 0.3; t <= c0 + 0.8; t += 0.005) {
    const e = window.__dd.surgeFlareAt(t, 0), r = window.__dd.surgeFlareAt(t, 3);
    if (e > eBest) { eBest = e; eyePk = t; } if (r > rBest) { rBest = r; rimPk = t; }
  }
  return rimPk - eyePk;
}, cas.flares[0]);
check(`flare travels eye→rim (rim crest lags ${Math.round(travel * 1000)}ms, in 250–450)`, travel >= 0.25 && travel <= 0.45);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
