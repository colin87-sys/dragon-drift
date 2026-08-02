// DIAGNOSTIC (reference, not a CI gate): for every rock 'split' section HALF, report
// which of the three sway-amplitude caps binds — cap (canyonSwayAmp), aSlope (the
// speed-derived slope budget), or aLane (the lane-margin cap that a wider corridor
// raises) — and model widening laneHalfWidth. This is the measured basis for the
// rock-run corridor widen (canyonRockLaneHalfWidth): at the global lane 13 the binder
// is aLane on ~81% of halves (NOT aSlope), so widening the rock lane is the real
// "more banking" lever. Corrects 2026-07-12-canyon-rock-adrenaline-and-fair-ceiling.md.
//   Note: this models every half at the given lane (it does NOT apply the interior-only
//   narrow-boundary rule rockSlicePlan uses), so the amp figures are an upper bound on
//   the shipped effect — the real per-run mean is a touch lower (boundary halves stay 13).
import { boot, check } from './browser.mjs';

const result = await boot().then(async ({ page, done }) => {
  const r = await page.evaluate(async () => {
    const { createLevelGen } = await import('./js/level.js');
    const { CONFIG } = await import('./js/config.js');
    const { halves, BUDGET_X } = await import('./js/canyonMath.js');

    const collect = (seed) => {
      const gen = createLevelGen(seed);
      const segs = [];
      for (let d = 800; d <= 20000; d += 800) segs.push(...gen.ensure(d).canyonSegments);
      return segs;
    };
    const seeds = [1337, 424242, 271828, 205907, 99999, 7];

    const chanHalfAt = (t) =>
      CONFIG.canyonPinchHalf + CONFIG.canyonBreathOpen * (0.5 - 0.5 * Math.cos(Math.PI * t));
    const ampHalf = (d, eh, gx, neighbourGx, laneHW) => {
      const LANE_MARGIN = laneHW - 7.5 - 0.5;
      const easePeak = 1.5 * Math.abs(d) / eh;
      const aSlope = Math.max(0, BUDGET_X - easePeak) * (2 * eh / Math.PI);
      const maxG = Math.max(Math.abs(gx), Math.abs(neighbourGx));
      let aLane = CONFIG.canyonSwayAmp;
      for (const t of [0.35, 0.5, 0.65, 0.8, 0.92, 1.0]) {
        const s = Math.sin((Math.PI / 2) * t);
        aLane = Math.min(aLane, (LANE_MARGIN + chanHalfAt(t) - maxG) / s);
      }
      const cap = CONFIG.canyonSwayAmp;
      const amp = Math.max(0, Math.min(cap, aSlope, aLane));
      let binder = 'cap';
      if (aSlope <= aLane && aSlope <= cap) binder = 'aSlope';
      else if (aLane <= aSlope && aLane <= cap) binder = 'aLane';
      return { amp, cap, aSlope, aLane, binder };
    };

    const halvesOf = (s) => {
      const { bk, fw } = halves(s);
      const gx = s.gapX;
      const px = s.prevX !== undefined ? s.prevX : gx;
      const nx = s.nextX !== undefined ? s.nextX : gx;
      const entryX = (px + gx) / 2, exitX = (gx + nx) / 2;
      return [
        { d: gx - entryX, eh: bk, gx, neighbourGx: px },
        { d: exitX - gx, eh: fw, gx, neighbourGx: nx },
      ];
    };

    const lanes = [13, 15, 16, 18];
    const out = { total: 0, budgetX: BUDGET_X, byLane: {} };
    for (const L of lanes) out.byLane[L] = { binder: { cap: 0, aSlope: 0, aLane: 0 }, ampSum: 0, ampMax: 0 };
    let gained = 0, gainSum = 0, maxGain = 0;

    for (const seed of seeds) {
      for (const s of collect(seed)) {
        if (s.kind !== 'split') continue;
        for (const h of halvesOf(s)) {
          out.total++;
          const base = ampHalf(h.d, h.eh, h.gx, h.neighbourGx, 13);
          for (const L of lanes) {
            const a = ampHalf(h.d, h.eh, h.gx, h.neighbourGx, L);
            const b = out.byLane[L];
            b.binder[a.binder]++;
            b.ampSum += a.amp; b.ampMax = Math.max(b.ampMax, a.amp);
          }
          const wide = ampHalf(h.d, h.eh, h.gx, h.neighbourGx, 16);
          const g = wide.amp - base.amp;
          if (g > 0.05) { gained++; gainSum += g; maxGain = Math.max(maxGain, g); }
        }
      }
    }
    out.gained = gained; out.gainMeanAmongGainers = gained ? gainSum / gained : 0; out.maxGain = maxGain;
    return out;
  });
  await done();
  return r;
});

console.log(`BUDGET_X = ${result.budgetX.toFixed(4)}  (slope ceiling per 1m z)`);
console.log(`total rock section-halves sampled: ${result.total}\n`);
console.log('laneHW | binder distribution (cap / aSlope / aLane) | mean amp | max amp');
for (const L of Object.keys(result.byLane)) {
  const b = result.byLane[L];
  const pct = (n) => `${n} (${Math.round(100 * n / result.total)}%)`;
  console.log(`  ${L}   | cap=${pct(b.binder.cap)}  aSlope=${pct(b.binder.aSlope)}  aLane=${pct(b.binder.aLane)} | ${(b.ampSum / result.total).toFixed(2)}m | ${b.ampMax.toFixed(2)}m`);
}
console.log(`\nWiden 13→16: halves that GAIN amp (>0.05m): ${result.gained} (${Math.round(100 * result.gained / result.total)}%), mean gain among gainers ${result.gainMeanAmongGainers.toFixed(2)}m, max gain ${result.maxGain.toFixed(2)}m`);
check('diagnostic ran', result.total > 0);
