// Per-frame regression: real play generates ~one waypoint per ensure() call, so
// canyon segment neighbour data (prevX/nextX/span) AND gate suppression must come
// from PERSISTENT generator state, not chunk-local vars. We prove the emitted
// stream is IDENTICAL between a 2m-step (per-frame) walk and a coarse 900m-chunk
// walk — the strongest guard that the overlay no longer depends on ensure() step
// size (it did, before: segment nextX was only set when two canyon rings shared a
// chunk; gate suppression scanned only the current chunk).
//
// Swept across MANY seeds on purpose: the window-anchoring asymmetry that this
// guards is seed-dependent (a gate only leaks when a canyon's realized start ring
// overshoots its scheduled mouth AND a gate sits in that overshoot gap). Seed 1337
// alone happens to be clean — a single-seed test gave false confidence.
import { boot, check } from './browser.mjs';

const SEEDS = [1337, 8, 9, 14, 15, 52, 99999, 424242, 271828, 31415, 161803, 2718];

const result = await boot().then(async ({ page, done }) => {
  const r = await page.evaluate(async (seeds) => {
    const { createLevelGen } = await import('./js/level.js');
    const walk = (seed, step) => {
      const gen = createLevelGen(seed);
      const segs = [], starts = [], ends = [], suppress = [], hazards = [], orbs = [];
      for (let d = step; d <= 9000; d += step) {
        if (gen.generatedUntil >= d) continue;   // mirror main.js spawnAhead guard
        const out = gen.ensure(d);
        segs.push(...out.canyonSegments);
        starts.push(...out.canyonStarts);
        ends.push(...out.canyonEnds);
        suppress.push(...out.canyonObstacleSuppress);
        hazards.push(...out.hazards.map((h) => h.dist));
        orbs.push(...out.orbs.map((o) => `${o.dist.toFixed(3)}:${o.x.toFixed(3)}:${o.y.toFixed(3)}`));
      }
      return { segs, starts, ends, suppress, hazards, orbs };
    };
    const sortNum = (xs) => [...xs].sort((p, q) => p - q);
    const perSeed = seeds.map((seed) => {
      const frame = walk(seed, 2), chunky = walk(seed, 900);
      return {
        seed,
        segsEqual: JSON.stringify(frame.segs) === JSON.stringify(chunky.segs),
        suppressEqual:
          JSON.stringify(sortNum(frame.suppress)) === JSON.stringify(sortNum(chunky.suppress)),
        hazardsEqual:
          JSON.stringify(sortNum(frame.hazards)) === JSON.stringify(sortNum(chunky.hazards)),
        orbsEqual:
          JSON.stringify([...frame.orbs].sort()) === JSON.stringify([...chunky.orbs].sort()),
        frame,
      };
    });
    return { perSeed };
  }, SEEDS);
  await done();
  return r;
});

// Structural checks on the representative seed (1337).
const rep = result.perSeed.find((s) => s.seed === 1337).frame;
const { segs } = rep;
check('canyons emit under per-frame generation', segs.length >= 8);
// Every non-final segment knows its REAL next neighbour (runIdx is 0..runTotal-1).
check('every non-final segment has nextX',
  segs.every((s) => s.runIdx === s.runTotal - 1 || s.nextX !== undefined));
// Seam continuity: consecutive emitted segments in the same run chain exactly — the
// held segment's nextX/nextY/spanFwd are backfilled from the following segment by
// construction. (A canyon can bridge a gauntlet corridor, so consecutive SEGMENTS
// aren't always consecutive RINGS — spanFwd spans that gap; the backward `span`
// measures to the nearest ring by design. So we assert the forward chain.)
let chained = true, spans = true;
for (let i = 1; i < segs.length; i++) {
  const a = segs[i - 1], b = segs[i];
  if (b.runIdx !== a.runIdx + 1) continue;   // a run boundary, not a seam
  chained = chained && a.nextX === b.gapX && b.prevX === a.gapX;
  spans = spans && Math.abs(a.spanFwd - (b.dist - a.dist)) < 1e-9;
}
check('seam-to-seam corridor centres chain exactly', chained);
check('spanFwd matches the real distance to the next segment', spans);
check('gate suppression actually fires under per-frame generation',
  rep.suppress.length >= 1);

// The granularity-invariance guard, across every swept seed.
const segMiss = result.perSeed.filter((s) => !s.segsEqual).map((s) => s.seed);
const supMiss = result.perSeed.filter((s) => !s.suppressEqual).map((s) => s.seed);
const hazMiss = result.perSeed.filter((s) => !s.hazardsEqual).map((s) => s.seed);
const orbMiss = result.perSeed.filter((s) => !s.orbsEqual).map((s) => s.seed);
check(`segment stream identical per-frame vs chunked (${SEEDS.length} seeds)`,
  segMiss.length === 0) || console.error('  segment mismatch seeds:', segMiss);
check(`obstacle suppression identical per-frame vs chunked (${SEEDS.length} seeds)`,
  supMiss.length === 0) || console.error('  suppression mismatch seeds:', supMiss);
check(`hazard set (post canyon-suppression) identical per-frame vs chunked (${SEEDS.length} seeds)`,
  hazMiss.length === 0) || console.error('  hazard mismatch seeds:', hazMiss);
check(`orb set (incl. woven rock boosts) identical per-frame vs chunked (${SEEDS.length} seeds)`,
  orbMiss.length === 0) || console.error('  orb mismatch seeds:', orbMiss);

console.log(`  (rep seed 1337: ${segs.length} segments, ${rep.suppress.length} suppressed gates; swept ${SEEDS.length} seeds)`);
