// Per-frame regression: real play generates ~one waypoint per ensure() call, so
// canyon segment neighbour data (prevX/nextX/span) must come from PERSISTENT
// generator state, not chunk-local vars. Walks ensure() in 2m steps like play and
// proves the emitted segment stream is IDENTICAL to a coarse 900m-chunk walk —
// the strongest guard that neighbour smoothing no longer depends on ensure() step
// size (it did, before delayed emission: nextX was only set when two canyon rings
// shared a chunk).
import { boot, check } from './browser.mjs';

const { page, done } = await boot();
const result = await page.evaluate(async () => {
  const { createLevelGen } = await import('./js/level.js');
  const walk = (step) => {
    const gen = createLevelGen(1337);
    const segs = [], starts = [], ends = [];
    for (let d = step; d <= 9000; d += step) {
      if (gen.generatedUntil >= d) continue;   // mirror main.js spawnAhead guard
      const out = gen.ensure(d);
      segs.push(...out.canyonSegments);
      starts.push(...out.canyonStarts);
      ends.push(...out.canyonEnds);
    }
    return { segs, starts, ends };
  };
  return { frame: walk(2), chunky: walk(900) }; // both end EXACTLY at 9000
});

const { segs } = result.frame;
check('canyons emit under per-frame generation', segs.length >= 8);
// Every non-final segment knows its REAL next neighbour (runIdx is 0..runTotal-1).
check('every non-final segment has nextX',
  segs.every((s) => s.runIdx === s.runTotal - 1 || s.nextX !== undefined));

// Seam continuity: consecutive emitted segments in the same run chain exactly — the
// held segment's nextX/nextY/spanFwd are backfilled from the following segment by
// construction. (Note: a canyon can bridge a gauntlet corridor, so consecutive
// SEGMENTS aren't always consecutive RINGS — spanFwd spans that gap, while the
// backward `span` measures to the nearest ring by design. So we assert the forward
// chain, not backward `span`.)
let chained = true, spans = true;
for (let i = 1; i < segs.length; i++) {
  const a = segs[i - 1], b = segs[i];
  if (b.runIdx !== a.runIdx + 1) continue;   // a run boundary, not a seam
  chained = chained && a.nextX === b.gapX && b.prevX === a.gapX;
  spans = spans && Math.abs(a.spanFwd - (b.dist - a.dist)) < 1e-9;
}
check('seam-to-seam corridor centres chain exactly', chained);
check('spanFwd matches the real distance to the next segment', spans);
check('segment stream is identical at per-frame and chunked granularity',
  JSON.stringify(result.frame.segs) === JSON.stringify(result.chunky.segs));

console.log(`  (per-frame segments: ${segs.length}, runs: ${result.frame.starts.length})`);
await done();
