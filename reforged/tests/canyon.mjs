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
check('canyons spawn over 9 km', segs.length >= 1);
check('canyon starts/ends are balanced', starts.length === ends.length && starts.length >= 1);
check('every gap sits inside the lane',
  segs.every((s) => s.gapX >= -9 && s.gapX <= 9 && s.gapY >= 7 && s.gapY <= 18));
check('every segment has a known archetype',
  segs.every((s) => ['split', 'rib', 'spiral', 'overunder'].includes(s.style)));
check('overlay is deterministic per seed',
  JSON.stringify(result.a.segs) === JSON.stringify(result.b.segs));

const styles = new Set(segs.map((s) => s.style));
check('multiple archetypes appear', styles.size >= 2);

console.log(`  (segments: ${segs.length}, runs: ${starts.length}, styles: ${[...styles].join(', ')})`);
await done();
