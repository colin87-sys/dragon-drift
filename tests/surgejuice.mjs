// SUNBREAK I4 juice battery (plan §L / pre-assess table): the ritual conductor's timeScale
// envelope + edge-sharpness guards + repeat-cast compression diff via the PURE samplers
// (frame-clock-independent), then the LIVE ritual (rawDt = wall-clock, so it advances in real
// time even at headless ~5fps): i-frames, conductor engagement, pose-pin, release snap-back,
// and the §G reduce-fx toggle behavior on the postfx flash channel.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
await page.evaluate(() => { window.__dd.save.settings.qualityOverride = 0; });
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

// ── The conductor envelope (pure sampler) ──────────────────────────────────────
const env = await page.evaluate(() => {
  const at = (t, r) => window.__dd.surgeRitualScaleAt(t, r);
  const beats = window.__dd.surgeRitualBeats(false);
  // APEX plateau: flat at the floor across the window
  let mn = 9, mx = -9;
  for (let t = beats.apexStart + 0.005; t < beats.releaseAt - 0.005; t += 0.002) { const v = at(t, false); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  // snap slope across the release edge
  const slope = (at(beats.releaseAt + 0.045, false) - at(beats.releaseAt + 0.005, false)) / 0.04;
  // overshoot + settle
  let peak = 0; for (let t = beats.releaseAt; t < beats.releaseAt + 0.4; t += 0.002) peak = Math.max(peak, at(t, false));
  const settled = at(beats.releaseAt + 0.30, false);
  // monotone descent through CALL+GATHER
  let mono = true, prev = at(0, false);
  for (let t = 0.01; t < beats.apexStart; t += 0.01) { const v = at(t, false); if (v > prev + 1e-6) mono = false; prev = v; }
  return { beats, floorMin: mn, floorMax: mx, apexLen: beats.releaseAt - beats.apexStart, slope, peak, settled, mono, start: at(0, false) };
});
check(`APEX floor in 0.33–0.37 and FLAT (min ${env.floorMin.toFixed(3)} / max ${env.floorMax.toFixed(3)}, var ≤0.01)`,
  env.floorMin >= 0.33 && env.floorMax <= 0.37 && (env.floorMax - env.floorMin) <= 0.01);
check(`APEX window 130–170ms (${Math.round(env.apexLen * 1000)}ms)`, env.apexLen >= 0.13 && env.apexLen <= 0.17);
check(`RELEASE snap slope ≥12/s (edge-sharpness guard; ${env.slope.toFixed(1)}/s)`, env.slope >= 12);
check(`overshoot ≤1.06 (peak ${env.peak.toFixed(3)})`, env.peak >= 1.01 && env.peak <= 1.06);
check(`settles to 1.00±0.02 by +300ms (${env.settled.toFixed(3)})`, Math.abs(env.settled - 1) <= 0.02);
check(`CALL+GATHER descent monotone from 1.0 (start ${env.start})`, env.mono && env.start === 1);

// ── GATHER stepped escalation: ≥3 slope maxima first cast, 2 on repeat (never linear) ──
const swells = await page.evaluate(() => {
  const count = (rep) => {
    const at = (t) => window.__dd.surgeGatherKAt(t, rep);
    const beats = window.__dd.surgeRitualBeats(rep);
    let n = 0, dPrev = 0, rising = false;
    for (let t = beats.callEnd; t < beats.apexStart; t += 0.004) {
      const d = (at(t + 0.004) - at(t)) / 0.004;
      if (d > dPrev + 1e-4) rising = true;
      else if (rising && d < dPrev - 1e-4) { n++; rising = false; }
      dPrev = d;
    }
    return n;
  };
  return { first: count(false), repeat: count(true) };
});
check(`GATHER stepped: ≥3 slope maxima first cast (${swells.first}), ≥2 repeat (${swells.repeat})`,
  swells.first >= 3 && swells.repeat >= 2);

// ── Repeat compression: the APPROACH compresses, APEX+RELEASE byte-identical (P4) ──
const rep = await page.evaluate(() => {
  const bf = window.__dd.surgeRitualBeats(false), br = window.__dd.surgeRitualBeats(true);
  let maxDiff = 0;
  for (let x = 0; x <= 0.6; x += 0.005) {
    const d = Math.abs(window.__dd.surgeRitualScaleAt(bf.apexStart + x, false) - window.__dd.surgeRitualScaleAt(br.apexStart + x, true));
    if (d > maxDiff) maxDiff = d;
  }
  return { bf, br, maxDiff };
});
check(`repeat compresses the approach (apex at ${rep.br.apexStart.toFixed(2)}s vs ${rep.bf.apexStart.toFixed(2)}s; total ~${(rep.br.releaseAt + 0.35).toFixed(2)}s in 2.1–2.3)`,
  rep.br.apexStart < rep.bf.apexStart && rep.br.releaseAt + 0.35 >= 2.0 - 1.05 && rep.br.releaseAt <= 1.05);
check(`APEX+RELEASE segments byte-identical across casts (maxΔ ${rep.maxDiff.toExponential(1)})`, rep.maxDiff < 1e-9);

// ── §G reduce-fx toggle: flash killed, CA/vig halved; OFF restores ──────────────
await page.evaluate(() => window.__dd.postfx.setPostTier(0));
const flashOn = await page.evaluate(() => { window.__dd.save.settings.reduceFx = false; window.__dd.postfx.kick('surgeRelease'); return window.__dd.postfx.kickState().flashFrames; });
check(`surgeRelease fires ONE flash normally (${flashOn})`, flashOn === 1);
await page.waitForTimeout(400);
const flashOff = await page.evaluate(() => { window.__dd.save.settings.reduceFx = true; window.__dd.postfx.kick('surgeRelease'); return window.__dd.postfx.kickState().flashFrames; });
check(`reduce-fx toggle kills the flash (${flashOff})`, flashOff === 0);
await page.evaluate(() => { window.__dd.save.settings.reduceFx = false; });

// ── LIVE ritual (rawDt = wall-clock — it advances in real time headless) ────────
await page.evaluate(() => { window.__dd.spawnBoss(); window.__dd.bossForceFight(); });
let inFight = false;
for (let i = 0; i < 48 && !inFight; i++) { inFight = await page.evaluate(() => window.__dd.bossState?.()?.phase === 'fight'); if (!inFight) await page.waitForTimeout(250); }
check('boss fight reached', inFight);
await page.evaluate(() => { window.__dd.game.health = 100; window.__dd.player.speed = 0; window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeCast(); });
await page.waitForTimeout(350);
const mid = await page.evaluate(() => ({
  phase: window.__dd.surgeState().phase, invuln: window.__dd.game.surgeUltInvuln,
  ts: window.__dd.game.timeScale, cond: window.__dd.game.surgeRitualScale,
}));
check(`ritual engaged: conductor owns timeScale (phase=${mid.phase}, ts=${mid.ts?.toFixed(2)} === cond=${mid.cond?.toFixed(2)})`,
  mid.phase === 'ritual' && mid.cond != null && Math.abs(mid.ts - mid.cond) < 0.02);
check('i-frames live during the ritual', mid.invuln === true);
// pose-pin ramps near the apex (~1.3s in), then the release snaps back + clears everything
let pinSeen = 0, released = null;
for (let i = 0; i < 30; i++) {
  const s = await page.evaluate(() => ({ pin: window.__dd.game.surgeApexPin, phase: window.__dd.surgeState().phase, ts: window.__dd.game.timeScale, invuln: window.__dd.game.surgeUltInvuln, cond: window.__dd.game.surgeRitualScale, state: window.__dd.game.state }));
  await page.evaluate(() => { window.__dd.game.health = 100; window.__dd.game.state = 'playing'; });
  pinSeen = Math.max(pinSeen, s.pin || 0);
  if (s.phase === 'beam' || s.phase === null) { released = s; break; }
  await page.waitForTimeout(200);
}
check(`pose-pin engaged on approach to APEX (peak ${pinSeen.toFixed(2)} ≥ 0.5)`, pinSeen >= 0.5);
check(`RELEASE reached: ritual → beam (phase=${released?.phase})`, released !== null);
// after the spring settles: conductor released, i-frames cleared, timeScale ~1
let post = null;
for (let i = 0; i < 20; i++) {
  post = await page.evaluate(() => ({ cond: window.__dd.game.surgeRitualScale, invuln: window.__dd.game.surgeUltInvuln, ts: window.__dd.game.timeScale, state: window.__dd.game.state }));
  await page.evaluate(() => { window.__dd.game.health = 100; window.__dd.game.state = 'playing'; });
  if (post.cond == null && post.ts > 0.9) break;
  await page.waitForTimeout(300);
}
check(`conductor releases + timeScale restored (cond=${post.cond}, ts=${post.ts?.toFixed(2)})`, post.cond == null && post.ts > 0.9);
check('i-frames cleared after the ritual', post.invuln === false);
// ambient isolation: cruise fever alone never engages the conductor
const amb = await page.evaluate(() => ({ cond: window.__dd.game.surgeRitualScale, fever: window.__dd.game.feverActive }));
check(`ambient fever never engages the conductor (cond=${amb.cond})`, amb.cond == null);

check('no console errors', errors.length === 0) || console.error(errors.slice(0, 4).join('\n'));
await done();
