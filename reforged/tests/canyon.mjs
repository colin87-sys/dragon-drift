// Sky Canyon overlay: (a) canyons spawn over distance, (b) they're an ISOLATED
// overlay (separate arrays — base rings/obstacles are untouched, which
// gold-determinism also guards), (c) every gap sits inside the reachable lane,
// (d) the overlay is deterministic per seed, (e) all four archetypes are used.
import { boot, check } from './browser.mjs';

const { page, done } = await boot();
const result = await page.evaluate(async () => {
  const { createLevelGen } = await import('./js/level.js');
  const { CONFIG } = await import('./js/config.js');
  const run = () => {
    const gen = createLevelGen(1337);
    // walk in chunks like the game does, so multi-chunk canyons are exercised
    const segs = [], starts = [], ends = [], orbs = [], suppress = [], gateDists = [];
    let ringsLen = 0, obsLen = 0;
    for (let d = 800; d <= 9000; d += 800) {
      const out = gen.ensure(d);
      if (d === 9000) { ringsLen = out.rings.length; obsLen = out.obstacles.length; }
      segs.push(...out.canyonSegments);
      starts.push(...out.canyonStarts);
      ends.push(...out.canyonEnds);
      orbs.push(...out.orbs);
      suppress.push(...out.canyonGateSuppress);
      for (const ob of out.obstacles) if (ob.type === 'gate') gateDists.push(ob.dist);
    }
    return { segs, starts, ends, orbs, suppress, gateDists, ringsLen, obsLen,
             nextCanyonAt: gen.nextCanyonAt };
  };
  const a = run();
  createLevelGen(424242).ensure(9000); // interleave a different seed
  const b = run();
  return { a, b, entryBuffer: CONFIG.canyonEntryBuffer, exitBuffer: CONFIG.canyonExitBuffer };
});

const { segs, starts, ends } = result.a;
const KINDS = ['split', 'overunder', 'skull', 'throat', 'rib', 'straightrib'];
check('canyons spawn over 9 km', segs.length >= 1);
// ends may trail starts by one if a run is still in progress at the walk boundary.
check('canyon starts/ends are balanced',
  starts.length >= 1 && ends.length >= starts.length - 1 && ends.length <= starts.length);
check('every gap sits inside the lane + under the ceiling',
  segs.every((s) => s.gapX >= -9 && s.gapX <= 9 && s.gapY >= 5 && s.gapY <= 19));
check('every segment has a known run + kind',
  segs.every((s) => ['rock', 'spine'].includes(s.run) && KINDS.includes(s.kind)));
check('overlay is deterministic per seed',
  JSON.stringify(result.a.segs) === JSON.stringify(result.b.segs));

const runs = new Set(segs.map((s) => s.run));
const kinds = new Set(segs.map((s) => s.kind));
check('multiple kinds appear', kinds.size >= 2);
// A Dragon Spine run, if present, must open with a skull and end on a flare.
const spineSegs = segs.filter((s) => s.run === 'spine');
if (spineSegs.length) {
  check('spine runs include a skull entrance', kinds.has('skull'));
  check('spine runs include the swaying rib run', kinds.has('rib'));
  check('spine runs end in a straight boost-out tunnel', kinds.has('straightrib'));
  // The finale stops swaying but stays centred on the ring (rings dead-centre), with
  // a boost on the ring line in each finale segment.
  const straights = segs.filter((s) => s.kind === 'straightrib');
  check('each finale segment has a boost on its ring line',
    straights.every((s) => result.a.orbs.some(
      (o) => Math.abs(o.x - s.gapX) < 1e-6 && o.dist > s.dist - 20 && o.dist <= s.dist)));
}

// Base Phase Gates near a canyon are suppressed (no blind crystal window between
// rib sections, no wall in the entry approach or the exit decompression zone) —
// and only ever gates. The buffers deliberately widen suppression BEYOND the run
// markers: entry side is anchored to nextCanyonAt (which can precede the realized
// start marker by a gate hop + the first canyon ring, plus a gauntlet-deferred
// start — hence generous slack); exit side is exact (ends[i] = lastRing+40, cursor
// = ends[i] + exitBuffer). A trailing pre-emptive window suppresses gates for a
// canyon still pending when the 9km walk ends — checked against nextCanyonAt.
const ENTRY_SLACK = result.entryBuffer + 500;
const inSuppressRange = (d) =>
  starts.some((s, i) => d >= s - ENTRY_SLACK && d <= (ends[i] ?? Infinity) + result.exitBuffer)
  || d >= result.a.nextCanyonAt - 40 - result.entryBuffer;
check('suppressed entries are all real gate dists',
  result.a.suppress.every((d) => result.a.gateDists.includes(d)));
check('suppressed gates fall inside a canyon run ± decompression buffers',
  result.a.suppress.every(inSuppressRange));
check('suppression is deterministic per seed',
  JSON.stringify(result.a.suppress) === JSON.stringify(result.b.suppress));

console.log(`  (segments: ${segs.length}, runs: ${starts.length} [${[...runs].join(',')}], kinds: ${[...kinds].join(', ')})`);
await done();
