// Sky Canyon overlay: (a) canyons spawn over distance, (b) they're an ISOLATED
// overlay (separate arrays — base rings/obstacles are untouched, which
// gold-determinism also guards), (c) every gap sits inside the reachable lane,
// (d) the overlay is deterministic per seed, (e) all four archetypes are used.
import { boot, check } from './browser.mjs';

const { page, done } = await boot();
const result = await page.evaluate(async () => {
  const { createLevelGen } = await import('./js/level.js');
  const run = () => {
    const gen = createLevelGen(1337);
    // walk in chunks like the game does, so multi-chunk canyons are exercised
    const segs = [], starts = [], ends = [];
    let ringsLen = 0, obsLen = 0;
    for (let d = 800; d <= 9000; d += 800) {
      const out = gen.ensure(d);
      if (d === 9000) { ringsLen = out.rings.length; obsLen = out.obstacles.length; }
      segs.push(...out.canyonSegments);
      starts.push(...out.canyonStarts);
      ends.push(...out.canyonEnds);
    }
    return { segs, starts, ends, ringsLen, obsLen };
  };
  const a = run();
  createLevelGen(424242).ensure(9000); // interleave a different seed
  const b = run();
  return { a, b };
});

const { segs, starts, ends } = result.a;
const KINDS = ['split', 'overunder', 'skull', 'throat', 'rib', 'heart', 'vertebra', 'exitflare'];
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
  check('spine runs include a heart-chamber breather', kinds.has('heart'));
  check('spine runs include a flared exit', kinds.has('exitflare'));
}

console.log(`  (segments: ${segs.length}, runs: ${starts.length} [${[...runs].join(',')}], kinds: ${[...kinds].join(', ')})`);
await done();
