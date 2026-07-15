// Aurora × Flow guarantee (level.js snapBackToAurora + type-targeted bleed). The Aurora Shallows block
// must ALWAYS be covered by a FLOW run — the dreamy sky + the speed-tube as one signature moment. Proof
// by construction: walk the level gen for many seeds across several cycles and assert that a flow RUN
// overlaps every aurora block (the flow may START before the block — a spine bleeding across the seam is
// converted to flow — so we check run OVERLAP, not a start inside a window). Placement is a snap-back that
// only pulls the schedule BACK (no desert); coverage is verified, and the source guards are regex-pinned.
//   node tests/auroraflow.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
globalThis.window = globalThis;
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
await import('three');
const { createLevelGen } = await import('../js/level.js');
const { CONFIG } = await import('../js/config.js');
const { BIOMES, CYCLE } = await import('../js/biomes.js');
const { readFileSync } = await import('node:fs');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

const L = CONFIG.biomeLength;
const auroraBlock = (k) => !!BIOMES[CYCLE[k % CYCLE.length]]?.aurora;

// Collect canyon RUNS (start, end, type) up to maxDist at a given chunk granularity. Runs never overlap,
// so a start is closed by the next end after it (robust to any count drift at the walk boundary).
function collectRuns(seed, step, maxDist) {
  const gen = createLevelGen(seed);
  const starts = [], ends = [];
  for (let d = step; d <= maxDist; d += step) {
    const out = gen.ensure(d);
    if (out.canyonStarts) starts.push(...out.canyonStarts);
    if (out.canyonEnds) ends.push(...out.canyonEnds);
  }
  const runs = [];
  let ei = 0;
  for (let si = 0; si < starts.length; si++) {
    const s = starts[si].dist + 40;                  // canyonStarts.dist = mouth ring − 40
    while (ei < ends.length && ends[ei] < s) ei++;
    runs.push({ start: s, end: ei < ends.length ? ends[ei] : s + 1200, run: starts[si].run });
    ei++;
  }
  return runs;
}

const seeds = [1337, 8, 99999, 424242, 271828, 31415, 2, 77];
const MAX = 42000;   // ~4 cycles

let blocksChecked = 0, uncovered = 0, maxFree = 0;
for (const seed of seeds) {
  const runs = collectRuns(seed, 900, MAX);
  // Desert guard: the snap-back only pulls the schedule BACK, so canyon-free stretches stay ~baseline.
  let prevEnd = 0;
  for (const r of runs) { if (r.start - prevEnd > maxFree) maxFree = r.start - prevEnd; prevEnd = Math.max(prevEnd, r.end); }
  for (let k = 0; (k + 1) * L <= MAX; k++) {
    if (!auroraBlock(k)) continue;
    const B = k * L;
    blocksChecked++;
    // A FLOW run must overlap the block [B, B+L): start < B+L and end > B.
    if (!runs.some((r) => r.run === 'flow' && r.start < B + L && r.end > B)) uncovered++;
  }
}
check(`every aurora block is covered by a flow run (checked ${blocksChecked} blocks × ${seeds.length} seeds)`, blocksChecked >= 24 && uncovered === 0);
check(`no canyon DESERT — max free stretch ${maxFree.toFixed(0)}m stays near baseline (< 6000m; the snap-back only pulls back)`, maxFree < 6000);

// GRANULARITY: the guarantee is persistent closure state, so a fine walk and a coarse walk produce the
// SAME runs through the first aurora block (canyonframe guards this generally; pinned here for the flow).
const key = (r) => `${r.start.toFixed(1)}:${r.run}`;
const fine = collectRuns(8, 100, 9000).filter((r) => r.start < 9000).map(key);
const coarse = collectRuns(8, 900, 9000).filter((r) => r.start < 9000).map(key);
check('canyon runs are granularity-invariant through the first aurora block (per-frame ≡ chunked)',
  fine.length === coarse.length && fine.every((v, i) => v === coarse[i]));

// SOURCE GUARDS (the placement/type mechanism no unit walk can see directly).
const src = readFileSync(new URL('../js/level.js', import.meta.url), 'utf8');
check('the aurora block keys on the WORLD CYCLE, never biomeIndexAt (biome-blind course gen)',
  /auroraBlock\s*=\s*\(k\)\s*=>\s*!!BIOMES\[CYCLE\[k % CYCLE\.length\]\]\?\.aurora/.test(src) && !/snapBackToAurora[\s\S]{0,400}biomeIndexAt/.test(src));
check('snap-back only pulls the mouth BACK (never pushes forward → no desert)',
  /return natural > T \? T : natural/.test(src));
check('snap-back applied at every nextCanyonAt assignment (init, reseat, boss resume)',
  (src.match(/snapBackToAurora\(/g) || []).length >= 4);   // def + 3 call sites
check('the type is forced AFTER the draw is consumed (canyonRnd stream stays aligned)',
  /const r = canyonRnd\(\);[\s\S]{0,220}if \(forced\) type = 'flow'/.test(src));
check('type-targeted bleed: a run whose span reaches the aurora is converted to flow',
  /span\s*=\s*type === 'spine' \? CONFIG\.canyonAuroraFlowShadow[\s\S]{0,120}if \(ring\.dist \+ span > bNext\) type = 'flow'/.test(src));

console.log(`\nauroraflow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
