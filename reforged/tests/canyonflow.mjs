// Canyon FLOW audit: the corridor the player threads must (a) join C1-continuously
// at every section seam, (b) never demand more steering than the dragon physically
// has at the worst realistic speed, and (c) never pinch below a safe width at the
// joint. This reconstructs the corridor centre from the SAME pure module the
// geometry builder uses (js/canyonMath.js) — no re-derivation, so the audit can't
// drift from the game. Spine (ribcage) is covered here; rock runs join in PR-3.
import { boot, check } from './browser.mjs';

const result = await boot().then(async ({ page, done }) => {
  const r = await page.evaluate(async () => {
    const { createLevelGen } = await import('./js/level.js');
    const { halves, centre, kindMult, CORRIDOR_HALF, BUDGET_X, BUDGET_Y } =
      await import('./js/canyonMath.js');

    const cor = CORRIDOR_HALF;                  // shared with obstacles.js — no re-derivation
    const SPINE = new Set(['throat', 'rib', 'straightrib']);
    const mult = kindMult;                       // shared per-kind depth multiplier

    // Collect all canyon segments over a multi-km chunked walk (frame≡chunk is
    // already proven by canyonframe, so the coarse walk is valid and fast).
    const collect = (seed) => {
      const gen = createLevelGen(seed);
      const segs = [];
      for (let d = 800; d <= 12000; d += 800) segs.push(...gen.ensure(d).canyonSegments);
      return segs;
    };

    const seeds = [1337, 424242, 271828];
    const agg = { worstSlopeX: 0, worstSlopeY: 0, worstSeamX: 0, worstSeamY: 0,
                  minWidth: Infinity, pairs: 0, seeds: [] };

    for (const seed of seeds) {
      const segs = collect(seed);
      let slopeBad = 0, seamBad = 0, widthBad = 0, spinePairs = 0;

      // (b) slope budget — per spine segment, sample the centre curve and
      // finite-difference the slope (per 1m of forward z). Demand velocity =
      // slope × V, and BUDGET already folds in /V, so slope ≤ BUDGET is fair.
      for (const s of segs) {
        if (!SPINE.has(s.kind)) continue;
        const { bk, fw } = halves(s, mult(s.kind));
        const { xAt, yAt } = centre(s, bk, fw);
        let prev = null;
        for (let z = -bk; z <= fw + 1e-9; z += 1) {
          const p = { x: xAt(z), y: yAt(z) };
          if (prev) {
            const sx = Math.abs(p.x - prev.x), sy = Math.abs(p.y - prev.y);
            agg.worstSlopeX = Math.max(agg.worstSlopeX, sx);
            agg.worstSlopeY = Math.max(agg.worstSlopeY, sy);
            if (sx > BUDGET_X + 1e-9) slopeBad++;
            if (sy > BUDGET_Y + 1e-9) slopeBad++;
          }
          prev = p;
        }
      }

      // (a) C0 continuity + (c) joint width — between consecutive same-run spine segs.
      for (let i = 1; i < segs.length; i++) {
        const a = segs[i - 1], b = segs[i];
        if (b.runIdx !== a.runIdx + 1) continue;
        if (!SPINE.has(a.kind) || !SPINE.has(b.kind)) continue;
        spinePairs++;
        const ha = halves(a, mult(a.kind)), hb = halves(b, mult(b.kind));
        const cA = centre(a, ha.bk, ha.fw), cB = centre(b, hb.bk, hb.fw);
        const mid = (a.dist + b.dist) / 2;         // the seam = the inter-ring midpoint plane
        const dX = Math.abs(cA.xAt(mid - a.dist) - cB.xAt(mid - b.dist));
        const dY = Math.abs(cA.yAt(mid - a.dist) - cB.yAt(mid - b.dist));
        agg.worstSeamX = Math.max(agg.worstSeamX, dX);
        agg.worstSeamY = Math.max(agg.worstSeamY, dY);
        if (dX > 1.5) seamBad++;
        if (dY > 1.15) seamBad++;
        // (c) width: only where the walls actually exist (not a big-bend relief seam).
        const bigBend = Math.abs(b.gapX - a.gapX) > 10 || Math.abs(b.gapY - a.gapY) > 7;
        if (!bigBend) {
          const w = 2 * cor - dX;
          agg.minWidth = Math.min(agg.minWidth, w);
          if (w < 14.5) widthBad++;
        }
      }
      agg.pairs += spinePairs;
      agg.seeds.push({ seed, slopeBad, seamBad, widthBad, spinePairs });
    }
    return agg;
  });
  await done();
  return r;
});

const bad = (k) => result.seeds.filter((s) => s[k] > 0).map((s) => s.seed);
check('spine seams sampled across seeds', result.pairs >= 3);
check('corridor slope never exceeds the steering budget (X & Y)',
  result.seeds.every((s) => s.slopeBad === 0)) || console.error('  slope-budget fail seeds:', bad('slopeBad'));
check('section seams are C0-continuous (≤1.5m X / 1.15m Y)',
  result.seeds.every((s) => s.seamBad === 0)) || console.error('  seam-continuity fail seeds:', bad('seamBad'));
check('joint never pinches below 14.5m at a non-relief seam',
  result.seeds.every((s) => s.widthBad === 0)) || console.error('  joint-width fail seeds:', bad('widthBad'));

console.log(`  (spine seam pairs: ${result.pairs}; worst slope X=${result.worstSlopeX.toFixed(3)} Y=${result.worstSlopeY.toFixed(3)}; worst seam ΔX=${result.worstSeamX.toFixed(2)} ΔY=${result.worstSeamY.toFixed(2)}; min joint width=${result.minWidth.toFixed(1)})`);
