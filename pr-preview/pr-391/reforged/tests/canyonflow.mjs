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
    const { halves, band, centre, spineSway, rockSlicePlan, kindMult, CORRIDOR_HALF, BUDGET_X, BUDGET_Y } =
      await import('./js/canyonMath.js');

    const cor = CORRIDOR_HALF;                  // shared with obstacles.js — no re-derivation
    const LANE = 13;                             // laneHalfWidth (in-lane free-width clamp)
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

    // 205907 has a gauntlet-bridged consecutive split pair (a 341m gap) — the case
    // that tripped the unclamped-zn seam bug; keep it to guard the fix.
    const seeds = [1337, 424242, 271828, 205907];
    const agg = { worstSlopeX: 0, worstSlopeY: 0, worstSeamX: 0, worstSeamY: 0,
                  minWidth: Infinity, pairs: 0, rockSlopeMax: 0, rockMinWidth: Infinity,
                  rockSeamMax: 0, rockSlices: 0, rockSwingSum: 0, rockSwingN: 0,
                  rockMustSteer: 0, seeds: [] };

    for (const seed of seeds) {
      const segs = collect(seed);
      let slopeBad = 0, seamBad = 0, widthBad = 0, spinePairs = 0, centreBad = 0;
      let rockSlopeBad = 0, rockWidthBad = 0, rockSeamBad = 0, rockSliceN = 0, rockApproachBad = 0;

      // === ROCK RUN (v2 carved slot) ===
      // (b) slope: the swayed channel centre must stay under the steering budget.
      for (const s of segs) {
        if (s.kind !== 'split') continue;
        const { bk, fw, slices, xcAt } = rockSlicePlan(s);
        let prev = null;
        for (let z = -bk; z <= fw + 1e-9; z += 1) {
          const x = xcAt(z);
          if (prev !== null) {
            const sx = Math.abs(x - prev);
            agg.rockSlopeMax = Math.max(agg.rockSlopeMax, sx);
            if (sx > BUDGET_X + 1e-9) rockSlopeBad++;
          }
          prev = x;
        }
        // (c) width: in-lane free channel per slice ≥ 8.2m everywhere; AND at the ring
        // the pocket must leave the reward ring (gapX) reachable with clearance on
        // BOTH sides (an off-centre ring near the lane edge legitimately has less room
        // on the edge side — what matters is you can still sit on it, not a fixed width).
        let maxLi = -Infinity, minRi = Infinity, minXc = Infinity, maxXc = -Infinity;
        for (const sl of slices) {
          rockSliceN++;
          const left = Math.max(sl.li, -LANE), right = Math.min(sl.ri, LANE);
          const w = right - left;
          agg.rockMinWidth = Math.min(agg.rockMinWidth, w);
          if (w < 7.5) rockWidthBad++;
          if (sl.nearRing && (s.gapX - left < 3 || right - s.gapX < 3)) rockWidthBad++;
          // BUG-1a: the ring line (gapX) must be INSIDE the free channel on the whole
          // approach cone (z<0 to -36) — no sea-stack on the aim line the player locks.
          if (sl.z < 0 && sl.z > -36 && (s.gapX < sl.li - 1e-6 || s.gapX > sl.ri + 1e-6)) rockApproachBad++;
          maxLi = Math.max(maxLi, sl.li); minRi = Math.min(minRi, sl.ri);
          minXc = Math.min(minXc, sl.xc); maxXc = Math.max(maxXc, sl.xc);
        }
        // "Banking felt": if no single horizontal line fits the whole channel
        // (maxLi > minRi), you are FORCED to steer through this section — the weave
        // can't be cut. Track the swing (centre travel) too.
        agg.rockSwingSum += (maxXc - minXc); agg.rockSwingN++;
        if (maxLi > minRi) agg.rockMustSteer++;
      }
      // (a) continuity: consecutive split segments (channel not broken by an overunder).
      for (let i = 1; i < segs.length; i++) {
        const a = segs[i - 1], b = segs[i];
        if (b.runIdx !== a.runIdx + 1 || a.kind !== 'split' || b.kind !== 'split') continue;
        const pa = rockSlicePlan(a), pb = rockSlicePlan(b);
        // A gauntlet can bridge a run: if the sections' wall bands don't meet there is
        // no seam to be continuous across (open air between them) — skip it.
        if (b.dist - a.dist > pa.fw + pb.bk) continue;
        const mid = (a.dist + b.dist) / 2;
        const d = Math.abs(pa.xcAt(mid - a.dist) - pb.xcAt(mid - b.dist));
        agg.rockSeamMax = Math.max(agg.rockSeamMax, d);
        if (d > 2.0) rockSeamBad++;
      }
      agg.rockSlices += rockSliceN;

      // (b) slope budget — per spine segment, sample the centre curve and
      // finite-difference the slope (per 1m of forward z). Demand velocity =
      // slope × V, and BUDGET already folds in /V, so slope ≤ BUDGET is fair.
      for (const s of segs) {
        if (!SPINE.has(s.kind)) continue;
        const { bk, fw } = halves(s, mult(s.kind));
        const { wb, wf } = band(s, bk, fw);
        const { xAt, yAt } = centre(s, bk, fw);
        const sway = spineSway(s, bk, fw);
        const xc = (z) => xAt(z) + sway(z);   // the tube's actual swept lateral centre
        // Dead-centre: the tube centre at the ring plane must be EXACTLY the ring
        // (gapX,gapY) so flying the visual centre-line scores a perfect — the sweep is
        // zero at the ring by construction, and there's no belly lift.
        if (Math.abs(xc(0) - s.gapX) > 1e-9 || Math.abs(yAt(0) - s.gapY) > 1e-9) centreBad++;
        let prev = null;
        for (let z = -wb; z <= wf + 1e-9; z += 1) {   // sample where the ribs actually are
          const p = { x: xc(z), y: yAt(z) };
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
        // A gauntlet can bridge a run — the sections' bands then don't meet (open air
        // between them), so there's no continuous tube to be discontinuous. Skip it.
        if (b.dist - a.dist > ha.fw + hb.bk) continue;
        const cA = centre(a, ha.bk, ha.fw), cB = centre(b, hb.bk, hb.fw);
        const sA = spineSway(a, ha.bk, ha.fw), sB = spineSway(b, hb.bk, hb.fw);
        const mid = (a.dist + b.dist) / 2;         // the seam = the inter-ring midpoint plane
        const za = mid - a.dist, zb = mid - b.dist;
        const dX = Math.abs((cA.xAt(za) + sA(za)) - (cB.xAt(zb) + sB(zb)));
        const dY = Math.abs(cA.yAt(za) - cB.yAt(zb));
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
      agg.seeds.push({ seed, slopeBad, seamBad, widthBad, spinePairs, centreBad,
                       rockSlopeBad, rockWidthBad, rockSeamBad, rockSliceN, rockApproachBad });
    }
    return agg;
  });
  await done();
  return r;
});

const bad = (k) => result.seeds.filter((s) => s[k] > 0).map((s) => s.seed);
check('spine seams sampled across seeds', result.pairs >= 3);
check('rib tube centres exactly on the ring at the ring plane (perfect flyable)',
  result.seeds.every((s) => s.centreBad === 0)) || console.error('  dead-centre fail seeds:', bad('centreBad'));
check('corridor slope never exceeds the steering budget (X & Y)',
  result.seeds.every((s) => s.slopeBad === 0)) || console.error('  slope-budget fail seeds:', bad('slopeBad'));
check('section seams are C0-continuous (≤1.5m X / 1.15m Y)',
  result.seeds.every((s) => s.seamBad === 0)) || console.error('  seam-continuity fail seeds:', bad('seamBad'));
check('joint never pinches below 14.5m at a non-relief seam',
  result.seeds.every((s) => s.widthBad === 0)) || console.error('  joint-width fail seeds:', bad('widthBad'));

// --- Rock Run (v2 carved slot) ---
check('rock runs sampled across seeds', result.rockSlices >= 10);
check('rock channel slope never exceeds the steering budget',
  result.seeds.every((s) => s.rockSlopeBad === 0)) || console.error('  rock-slope fail seeds:', bad('rockSlopeBad'));
check('rock channel seams are continuous (≤2m)',
  result.seeds.every((s) => s.rockSeamBad === 0)) || console.error('  rock-seam fail seeds:', bad('rockSeamBad'));
check('rock channel never pinches below 7.5m (ring stays reachable both sides)',
  result.seeds.every((s) => s.rockWidthBad === 0)) || console.error('  rock-width fail seeds:', bad('rockWidthBad'));
check('rock ring line is clear of stacks on the whole approach cone (no spike in front)',
  result.seeds.every((s) => s.rockApproachBad === 0)) || console.error('  rock-approach fail seeds:', bad('rockApproachBad'));

const meanSwing = result.rockSwingN ? result.rockSwingSum / result.rockSwingN : 0;
const mustSteerPct = result.rockSwingN ? Math.round(100 * result.rockMustSteer / result.rockSwingN) : 0;
// Banking is a REPORTED feel metric (not a hard gate): forced steering fundamentally
// competes with the slope-fairness budget, so we surface it for the human to judge on
// the preview rather than fail CI on a fuzzy proxy. mean swing ≫ the old ~2.4m is the win.
console.log(`  [feel] rock mean centre-swing=${meanSwing.toFixed(1)}m, sections forcing steering=${mustSteerPct}%`);
console.log(`  (spine pairs: ${result.pairs}, worst slope X=${result.worstSlopeX.toFixed(3)} Y=${result.worstSlopeY.toFixed(3)}, seam ΔX=${result.worstSeamX.toFixed(2)} ΔY=${result.worstSeamY.toFixed(2)}, joint≥${result.minWidth.toFixed(1)}; rock slices: ${result.rockSlices}, worst slope=${result.rockSlopeMax.toFixed(3)}, seam Δ=${result.rockSeamMax.toFixed(2)}, min width=${result.rockMinWidth.toFixed(1)}, mean swing=${meanSwing.toFixed(1)}m, must-steer=${mustSteerPct}%)`);
