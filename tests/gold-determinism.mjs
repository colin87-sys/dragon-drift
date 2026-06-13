// Golden-ember RNG isolation: (a) the base course for a seed is IDENTICAL to
// the pre-update generator (old challenge links stay valid — fixture captured
// from the last release's level.js), (b) goldens are deterministic per seed,
// (c) goldens actually spawn.
import { readFileSync } from 'fs';
import { boot, check } from './browser.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/course-1337.json', import.meta.url)));

const { page, done } = await boot();
const result = await page.evaluate(async () => {
  const { createLevelGen } = await import('./js/level.js');
  const run = () => {
    const out = createLevelGen(1337).ensure(3000);
    return { rings: out.rings, obstacles: out.obstacles, golds: out.goldEmbers };
  };
  const a = run();
  createLevelGen(99999).ensure(3000); // interleave a different seed
  const b = run();
  return { a, b };
});

check('base rings identical to pre-update fixture',
  JSON.stringify(result.a.rings) === JSON.stringify(fixture.rings));
check('base obstacles identical to pre-update fixture',
  JSON.stringify(result.a.obstacles) === JSON.stringify(fixture.obstacles));
check('same seed → identical golden embers (after a different-seed run)',
  JSON.stringify(result.a.golds) === JSON.stringify(result.b.golds));
check('golden embers spawn over 3 km', result.a.golds.length >= 1);
check('goldens land inside the lane',
  result.a.golds.every((g) => g.x >= -10 && g.x <= 10 && g.y >= 5 && g.y <= 18));

console.log(`  (goldens over 3km: ${result.a.golds.length})`);
await done();
