// SUNBREAK I3 beam battery (plan §L / pre-assess T-table): beam LIFE via the pure samplers
// (frame-clock-independent — the I2 lesson), wobble incommensurability via a JS DFT, muzzle/
// impact ensemble state via introspection, DC delta + particle budget + prewarm live.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
await page.evaluate(() => { window.__dd.save.settings.qualityOverride = 0; });
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

// ── T11 prewarm: the ribbon shaders compiled at boot, never on first cast ──
check('ribbon shaders prewarmed at boot', await page.evaluate(() => window.__dd.surgeState().prewarmed === true));

// ── T3 birth extension (pure sampler) ──
const ext = await page.evaluate(() => {
  const at = (t) => window.__dd.surgeBeamExtendAt(t);
  let peakT = -1, peak = 0;
  for (let t = 0; t <= 0.4; t += 0.001) {
    const e = at(t);
    if (e[2] > peak) { peak = e[2]; peakT = t; }
  }
  return { peakT, peak, bloomAt60: at(0.06)[1], coreAt60: at(0.06)[2], outerAt150: at(0.15)[0], coreAt0: at(0)[2] };
});
check(`core tip full-extension peak in 90–130ms (${Math.round(ext.peakT * 1000)}ms)`, ext.peakT >= 0.09 && ext.peakT <= 0.13);
check(`tip overshoot ~5% (peak ${ext.peak.toFixed(3)} in 1.03–1.06)`, ext.peak >= 1.03 && ext.peak <= 1.06);
check(`bloom lags core at t=60ms (${ext.bloomAt60.toFixed(2)} < ${ext.coreAt60.toFixed(2)})`, ext.bloomAt60 < ext.coreAt60);
check(`outer wrap full by ~150ms (${ext.outerAt150.toFixed(2)} ≥ 0.99)`, ext.outerAt150 >= 0.99);
check('never instant-full-length (t=0 → 0)', ext.coreAt0 === 0);

// ── T6 core-LAST collapse (pure sampler): strict order outer < bloom < core, ≤300ms total ──
const colp = await page.evaluate(() => {
  const at = (p) => window.__dd.surgeBeamCollapseAt(p);
  const half = [-1, -1, -1];   // 50%-fade times for [outer, bloom, coreA]
  let dead = -1;
  for (let t = 0; t <= 0.4; t += 0.001) {
    const c = at(t);
    for (let i = 0; i < 3; i++) if (half[i] < 0 && c[i] <= 0.5) half[i] = t;
    if (dead < 0 && c[0] <= 0.01 && c[1] <= 0.01 && c[2] <= 0.01) dead = t;
  }
  return { half, dead };
});
check(`collapse order outer<bloom<core (50%@ ${colp.half.map((t) => Math.round(t * 1000)).join('/')}ms)`,
  colp.half[0] < colp.half[1] && colp.half[1] < colp.half[2]);
check(`collapse total ≤300ms (dead by ${Math.round(colp.dead * 1000)}ms)`, colp.dead > 0 && colp.dead <= 0.30);

// ── T4 wobble: ≥2 spectral peaks per layer, no single-tone dominance, non-integer ratios ──
const wob = await page.evaluate(() => {
  const N = 512, FS = 120;   // ~4.3s at 120Hz
  const out = [];
  for (let layer = 0; layer < 3; layer++) {
    const xs = [];
    for (let n = 0; n < N; n++) xs.push(window.__dd.surgeBeamWobbleAt(n / FS, layer) - 1);
    // Goertzel-style DFT magnitude over 0.5–20 Hz
    const mags = [];
    for (let f = 0.5; f <= 20; f += 0.25) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { const w = 2 * Math.PI * f * n / FS; re += xs[n] * Math.cos(w); im -= xs[n] * Math.sin(w); }
      mags.push({ f, m: Math.hypot(re, im) });
    }
    mags.sort((a, b) => b.m - a.m);
    const total = mags.reduce((s, x) => s + x.m, 0);
    // top two distinct peaks (≥1Hz apart)
    const p1 = mags[0];
    const p2 = mags.find((x) => Math.abs(x.f - p1.f) >= 0.5);   // layer-0's real pair is only 0.68Hz apart
    out.push({ f1: p1.f, f2: p2.f, dom: p1.m / total, ratio: Math.max(p1.f, p2.f) / Math.min(p1.f, p2.f), p2rel: p2.m / p1.m });
  }
  return out;
});
for (let i = 0; i < 3; i++) {
  const w = wob[i], frac = w.ratio % 1;
  check(`layer ${i} wobble: 2 real peaks (${w.f1}/${w.f2}Hz, p2 ${Math.round(w.p2rel * 100)}%), no single-tone dominance (${(w.dom * 100).toFixed(0)}% ≤ 45%), ratio non-integer (${w.ratio.toFixed(2)})`,
    w.p2rel >= 0.3 && w.dom <= 0.45 && frac >= 0.15 && frac <= 0.85);
}

// ── T5 surge-pulse: period 0.35–0.45s, traverse 0.25–0.4s ──
const pulse = await page.evaluate(() => {
  const at = (t) => window.__dd.surgeBeamPulseAt(t);
  const starts = [];
  let prev = at(0);
  for (let t = 0.001; t <= 2.0; t += 0.001) { const p = at(t); if (prev < 0 && p >= 0) starts.push(t); prev = p; }
  const period = starts.length >= 2 ? starts[1] - starts[0] : -1;
  // traverse: from a start, time until it switches back off
  let travT = -1;
  for (let t = starts[0]; t <= starts[0] + 0.5; t += 0.001) if (at(t) < 0) { travT = t - starts[0]; break; }
  return { period, travT };
});
check(`surge-pulse period 0.35–0.45s (${pulse.period.toFixed(2)})`, pulse.period >= 0.35 && pulse.period <= 0.45);
check(`surge-pulse traverse 0.25–0.4s (${pulse.travT.toFixed(2)})`, pulse.travT >= 0.25 && pulse.travT <= 0.4);

// ── Live fight: DC delta, muzzle band, land choreography, particle budget ──
await page.evaluate(() => { window.__dd.spawnBoss(); window.__dd.bossForceFight(); });
let inFight = false;
for (let i = 0; i < 48 && !inFight; i++) {
  inFight = await page.evaluate(() => window.__dd.bossState?.()?.phase === 'fight');
  if (!inFight) await page.waitForTimeout(250);
}
check('boss fight reached', inFight);
// renderer.info auto-resets on every internal render() pass, so a naive read sees only the
// composer's LAST pass (always 1). Disable autoReset for one full frame to get the true total.
const frameCalls = () => page.evaluate(() => new Promise((res) => {
  const info = window.__dd.renderer.info;
  requestAnimationFrame(() => {           // sync to a frame boundary
    info.reset(); info.autoReset = false; // accumulate across ALL passes of the next frame
    requestAnimationFrame(() => {
      const calls = info.render.calls;
      info.autoReset = true; info.reset();
      res(calls);
    });
  });
}));
const dcOff = await frameCalls();
await page.evaluate(() => { window.__dd.player.speed = 0; window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeSeam('beam'); });
await page.waitForTimeout(400);
const dcOn = await frameCalls();
const st = await page.evaluate(() => window.__dd.surgeState());
check(`beam adds ≤8 draw calls (${dcOff} → ${dcOn}, Δ${dcOn - dcOff})`, dcOn - dcOff <= 8);
check(`muzzle stack live in the T7 band (socket ${st.muzzle.scale[0]} in 3.3–4.4)`, st.muzzle.vis && st.muzzle.scale[0] >= 3.3 && st.muzzle.scale[0] <= 4.4);
check(`impact landed + sparks flying (land=${st.landFired}, sparks=${st.sparks} in 20–44)`, st.landFired >= 1 && st.sparks >= 20 && st.sparks <= 44);
const pfx = await page.evaluate(() => window.__dd.pfx.stats());
check(`particle budget ≤150 visible with the beam live (${pfx.visible ?? pfx.count ?? 0})`, (pfx.visible ?? pfx.count ?? 0) <= 150);
await page.evaluate(() => window.__dd.surgeSeam(null));

check('no console errors', errors.length === 0) || console.error(errors.slice(0, 4).join('\n'));
await done();
