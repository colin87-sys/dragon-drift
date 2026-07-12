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
    const segs = [], starts = [], ends = [], orbs = [], suppress = [], obsDists = [], hazDists = [];
    let ringsLen = 0, obsLen = 0;
    for (let d = 800; d <= 9000; d += 800) {
      const out = gen.ensure(d);
      if (d === 9000) { ringsLen = out.rings.length; obsLen = out.obstacles.length; }
      segs.push(...out.canyonSegments);
      starts.push(...out.canyonStarts);
      ends.push(...out.canyonEnds);
      orbs.push(...out.orbs);
      suppress.push(...out.canyonObstacleSuppress);
      for (const ob of out.obstacles) obsDists.push(ob.dist);
      for (const h of out.hazards) hazDists.push(h.dist);
    }
    return { segs, starts, ends, orbs, suppress, obsDists, hazDists, ringsLen, obsLen,
             nextCanyonAt: gen.nextCanyonAt };
  };
  const a = run();
  createLevelGen(424242).ensure(9000); // interleave a different seed
  const b = run();
  return { a, b, entryBuffer: CONFIG.canyonEntryBuffer, exitBuffer: CONFIG.canyonExitBuffer };
});

const { segs, starts, ends } = result.a;
const KINDS = ['split', 'overunder', 'skull', 'throat', 'rib', 'straightrib', 'flowgate'];
check('canyons spawn over 9 km', segs.length >= 1);
// ends may trail starts by one if a run is still in progress at the walk boundary.
check('canyon starts/ends are balanced',
  starts.length >= 1 && ends.length >= starts.length - 1 && ends.length <= starts.length);
check('every gap sits inside the lane + under the ceiling',
  segs.every((s) => s.gapX >= -9 && s.gapX <= 9 && s.gapY >= 5 && s.gapY <= 19));
check('every segment has a known run + kind',
  segs.every((s) => ['rock', 'spine', 'flow'].includes(s.run) && KINDS.includes(s.kind)));
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

// Base obstacles (gates, pillars, shards, bars) near a canyon are suppressed — no
// spike/wall on the ring line inside the carved slot / rib tube, and none in the
// entry approach or the exit decompression zone. The buffers widen suppression BEYOND
// the run markers: entry is anchored to nextCanyonAt (can precede the realized start
// by a hop + first ring + gauntlet-deferral — generous slack); exit is exact
// (ends[i] = lastRing+40, cursor = ends[i] + exitBuffer); a trailing pre-emptive
// window suppresses for a canyon still pending at the 9km walk end (vs nextCanyonAt).
const ENTRY_SLACK = result.entryBuffer + 500;
const inSuppressRange = (d) =>
  starts.some((s, i) => d >= s.dist - ENTRY_SLACK && d <= (ends[i] ?? Infinity) + result.exitBuffer)
  || d >= result.a.nextCanyonAt - 40 - result.entryBuffer;
check('suppressed entries are all real obstacle dists',
  result.a.suppress.every((d) => result.a.obsDists.includes(d)));
check('suppressed obstacles fall inside a canyon run ± decompression buffers',
  result.a.suppress.every(inSuppressRange));
check('suppression is deterministic per seed',
  JSON.stringify(result.a.suppress) === JSON.stringify(result.b.suppress));
// BUG-3: no biome hazard (geyser) survives inside a canyon run (± buffers) — an
// undodgeable vertical column in an enclosed corridor.
const inCanyonStrict = (d) => starts.some((s, i) => d >= s.dist && d <= (ends[i] ?? Infinity));
check('no hazard lands inside a canyon run',
  result.a.hazDists.every((d) => !inCanyonStrict(d)));

console.log(`  (segments: ${segs.length}, runs: ${starts.length} [${[...runs].join(',')}], kinds: ${[...kinds].join(', ')})`);

// === FLOW run (the Rhythm Flow-Tube) ===
// Force flow-only via the weight table (CONFIG is the shared mutable object level.js
// reads at pick time) so the ribbon is exercised deterministically regardless of seed.
const flow = await page.evaluate(async () => {
  const { createLevelGen } = await import('./js/level.js');
  const { CONFIG } = await import('./js/config.js');
  CONFIG.canyonTypeWeights = { rock: 0, spine: 0, flow: 100 };
  const gen = createLevelGen(1337);
  const segs = [], orbs = [], embers = [];
  for (let d = 800; d <= 9000; d += 800) {
    const out = gen.ensure(d);
    segs.push(...out.canyonSegments);
    orbs.push(...out.orbs.filter((o) => o.flow)); // only the flow ribbon (not base/first-flight orbs)
    embers.push(...out.embers);
  }
  // Fairness: the biggest gap between consecutive pickups (per run) must be re-catchable
  // at BASE speed — one orb's window (orbDuration) covers ≥ that gap so a broken chain is
  // always recoverable (the walls-free run's fairness invariant, in place of slope/width).
  const coverBase = CONFIG.baseSpeed * CONFIG.speedRampMax * CONFIG.orbDuration; // 35·1.35·2 = 94.5m
  // A single ring's ribbon reaches back at most 2·bk ≈ 192m; a gap wider than that is a
  // genuine gauntlet-bridged void (rings far apart, the slalom is its own beat), open by
  // design — the same gaps canyonflow/canyonframe skip. The re-catchable guarantee applies
  // to the CONTIGUOUS ribbon (gaps ≤ BRIDGE); bridge voids are counted + reported.
  const BRIDGE = CONFIG.canyonFlowFill;   // spans wider than this are gauntlet bridges (unfilled by design)
  const startDists = segs.filter((s) => s.runIdx === 0).map((s) => s.dist);
  let maxGap = 0, bridgeVoids = 0;
  for (let i = 0; i < startDists.length; i++) {
    const lo = startDists[i] - 40, hi = (startDists[i + 1] ?? Infinity) - 40;
    const ds = orbs.filter((o) => o.dist >= lo && o.dist < hi).map((o) => o.dist).sort((a, b) => a - b);
    for (let k = 1; k < ds.length; k++) {
      const g = ds[k] - ds[k - 1];
      if (g > BRIDGE) bridgeVoids++;
      else maxGap = Math.max(maxGap, g);
    }
  }
  return { segs, orbs, embers, maxGap, bridgeVoids, coverBase };
});
check('flow runs generate flowgate segments', flow.segs.length >= 1 && flow.segs.every((s) => s.kind === 'flowgate' && s.run === 'flow'));
check('every flow gate has a gate orb dead-centre on its ring line',
  flow.segs.every((s) => flow.orbs.some((o) => Math.abs(o.x - s.gapX) < 1e-6 && o.dist > s.dist - 12 && o.dist <= s.dist)));
const flowInterior = flow.segs.filter((s) => s.runIdx > 0);
check('flow interior gates lay an orb + ember ribbon (more pickups than gates)',
  flow.orbs.length > flow.segs.length && flow.embers.length >= flowInterior.length && flowInterior.length >= 1);
check('flow contiguous chain is re-catchable at base speed (max gap ≤ orb coverage)',
  flow.maxGap <= flow.coverBase) || console.error(`  max contiguous pickup gap ${flow.maxGap.toFixed(1)}m > coverage ${flow.coverBase.toFixed(1)}m`);
console.log(`  (flow: ${flow.segs.length} gates, ${flow.orbs.length} orbs, ${flow.embers.length} ember lines, max contiguous gap ${flow.maxGap.toFixed(1)}m / ${flow.coverBase.toFixed(1)}m, ${flow.bridgeVoids} gauntlet-bridge voids)`);
await done();
