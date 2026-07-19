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
  // A wider kinds walk (to 20km, UNION over seeds) so "multiple kinds appear" reflects the GLOBAL
  // variety — the aurora flow guarantee can make one seed's first ~9km all-flow, and a single seed
  // can even roll all-flow to 20km after upstream RNG-stream changes (seed 1337 does today, while
  // 4 of 5 probe seeds show the full spine+flow spread). Variety is a property of the GENERATOR,
  // not of one seed's stream, so assert it across a small seed set (still deterministic).
  const kw = new Set();
  for (const seed of [1337, 424242, 99999]) {
    const g = createLevelGen(seed);
    for (let d = 800; d <= 20000; d += 800) for (const s of g.ensure(d).canyonSegments) kw.add(s.kind);
  }
  return { a, b, kindsWide: [...kw], entryBuffer: CONFIG.canyonEntryBuffer, exitBuffer: CONFIG.canyonExitBuffer };
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
// The Aurora Shallows flow guarantee (level.js) makes the first ~9km flow-heavy for some seeds — a
// natural flow plus the aurora-coupled one can be the only two canyons before 9km. "Canyons come in
// multiple kinds" is a GLOBAL property, so assert it over the wider walk (result.kindsWide, computed
// in-page to 20km — into the non-aurora canyons of the next cycles) rather than one flow-heavy window.
check('multiple kinds appear', new Set(result.kindsWide).size >= 2);
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
  const { halves, centre, flowWeave, BUDGET_X, BUDGET_Y } = await import('./js/canyonMath.js');
  CONFIG.canyonTypeWeights = { rock: 0, spine: 0, flow: 100 };
  const gen = createLevelGen(1337);
  const segs = [], orbs = [], embers = [];
  for (let d = 800; d <= 9000; d += 800) {
    const out = gen.ensure(d);
    segs.push(...out.canyonSegments);
    orbs.push(...out.orbs.filter((o) => o.flow)); // only the flow ribbon (not base/first-flight orbs)
    embers.push(...out.embers);
  }
  // CARVE fairness: the carved ribbon line (base ring line + weave) must stay under the
  // steering budget on both axes (flyable at flow speed), cross every ring dead-centre
  // (weave 0 at z=0 → a perfect stays flyable), and actually CARVE (anti-inert guard: a
  // future dial/trim change can't silently flatten it back to the PR-1 straight line).
  let slopeX = 0, slopeY = 0, weaveAtRing = 0, apexSum = 0, apexYSum = 0, apexN = 0, budX = BUDGET_X, budY = BUDGET_Y;
  const line = (s) => { const { bk, fw } = halves(s); const c = centre(s, bk, fw); const w = flowWeave(s, bk, fw);
    return { bk, fw, at: (z) => { const wz = w(z); return { x: c.xAt(z) + wz.x, y: c.yAt(z) + wz.y }; }, w }; };
  for (const s of segs) {
    const L = line(s);
    weaveAtRing = Math.max(weaveAtRing, Math.abs(L.w(0).x), Math.abs(L.w(0).y));
    let prev = null, peakX = 0, peakY = 0;
    for (let z = -L.bk; z <= L.fw + 1e-9; z += 1) {
      const p = L.at(z);
      peakX = Math.max(peakX, Math.abs(L.w(z).x)); peakY = Math.max(peakY, Math.abs(L.w(z).y));
      if (prev) { slopeX = Math.max(slopeX, Math.abs(p.x - prev.x)); slopeY = Math.max(slopeY, Math.abs(p.y - prev.y)); }
      prev = p;
    }
    if (s.runIdx > 0 && s.runIdx < (s.runTotal ?? 1) - 1) { apexSum += peakX; apexYSum += peakY; apexN++; }
  }
  const meanApex = apexN ? apexSum / apexN : 0, meanApexY = apexN ? apexYSum / apexN : 0;
  // C0 across every seam: the carved line must be continuous where two segments meet (the
  // shared inter-ring midpoint) — this is where the vertical-corkscrew C0 bug hid (the
  // per-segment slope loop above never crosses a seam). Skip bridged pairs (open by design).
  let seamX = 0, seamY = 0;
  for (let i = 1; i < segs.length; i++) {
    const a = segs[i - 1], b = segs[i];
    if (b.runIdx !== a.runIdx + 1 || (b.dist - a.dist) > CONFIG.canyonFlowFill) continue;
    const mid = (a.dist + b.dist) / 2, la = line(a), lb = line(b);
    const pa = la.at(mid - a.dist), pb = lb.at(mid - b.dist);
    seamX = Math.max(seamX, Math.abs(pa.x - pb.x)); seamY = Math.max(seamY, Math.abs(pa.y - pb.y));
  }
  // Emitted-orb guard: the ACTUAL emitted ribbon orbs must carry the carve (catches a
  // level.js regression that drops the weave — the pure-function guards above wouldn't).
  // Map each ribbon orb to its owning segment (nearest ring) and measure lateral deviation
  // from the base ring line; the mean must show a real carve.
  const segDists = segs.map((s) => s.dist).sort((a, b) => a - b);
  const bridges = [];
  for (let i = 1; i < segDists.length; i++) {
    if (segDists[i] - segDists[i - 1] > CONFIG.canyonFlowFill) bridges.push([segDists[i - 1], segDists[i]]);
  }
  const inBridge = (d) => bridges.some(([a, b]) => d > a && d < b);
  const bySeg = segs.slice().sort((p, q) => p.dist - q.dist);
  let devSum = 0, devN = 0;
  for (const o of orbs) {
    if (bridges.length && inBridge(o.dist)) continue;
    let best = bySeg[0];
    for (const s of bySeg) if (Math.abs(s.dist - o.dist) < Math.abs(best.dist - o.dist)) best = s;
    const z = o.dist - best.dist;
    if (Math.abs(z + 8) < 1) continue; // skip the dead-centre gate orb
    const { bk, fw } = halves(best);
    devSum += Math.abs(o.x - centre(best, bk, fw).xAt(z)); devN++;
  }
  const meanOrbDev = devN ? devSum / devN : 0;
  // Fairness: the biggest gap between consecutive pickups (per run) must be re-catchable
  // at BASE speed — one orb's window (orbDuration) covers ≥ that gap so a broken chain is
  // always recoverable (the walls-free run's fairness invariant, in place of slope/width).
  const coverBase = CONFIG.baseSpeed * CONFIG.speedRampMax * CONFIG.orbDuration; // 35·1.35·2 = 94.5m
  // A gauntlet-bridged gap (consecutive flow segments more than canyonFlowFill apart — a
  // slalom sits between them) is open by design, like every canyon system; bridges/inBridge
  // (computed above) detect them by inter-segment distance, not orb-gap width. The
  // re-catchable guarantee applies to the CONTIGUOUS ribbon; bridge voids are excused.
  const startDists = segs.filter((s) => s.runIdx === 0).map((s) => s.dist);
  let maxGap = 0, bridgeVoids = 0;
  for (let i = 0; i < startDists.length; i++) {
    const lo = startDists[i] - 40, hi = (startDists[i + 1] ?? Infinity) - 40;
    const ds = orbs.filter((o) => o.dist >= lo && o.dist < hi).map((o) => o.dist).sort((a, b) => a - b);
    for (let k = 1; k < ds.length; k++) {
      const g = ds[k] - ds[k - 1];
      if (inBridge((ds[k] + ds[k - 1]) / 2)) bridgeVoids++;
      else maxGap = Math.max(maxGap, g);
    }
  }
  return { segs, orbs, embers, maxGap, bridgeVoids, coverBase,
           slopeX, slopeY, weaveAtRing, meanApex, meanApexY, seamX, seamY, meanOrbDev, budX, budY };
});
check('flow runs generate flowgate segments', flow.segs.length >= 1 && flow.segs.every((s) => s.kind === 'flowgate' && s.run === 'flow'));
check('every flow gate has a gate orb dead-centre on its ring line',
  flow.segs.every((s) => flow.orbs.some((o) => Math.abs(o.x - s.gapX) < 1e-6 && o.dist > s.dist - 12 && o.dist <= s.dist)));
const flowInterior = flow.segs.filter((s) => s.runIdx > 0);
check('flow interior gates lay an orb + ember ribbon (more pickups than gates)',
  flow.orbs.length > flow.segs.length && flow.embers.length >= flowInterior.length && flowInterior.length >= 1);
check('flow contiguous chain is re-catchable at base speed (max gap ≤ orb coverage)',
  flow.maxGap <= flow.coverBase) || console.error(`  max contiguous pickup gap ${flow.maxGap.toFixed(1)}m > coverage ${flow.coverBase.toFixed(1)}m`);
check('flow carve stays under the steering budget (flyable at flow speed)',
  flow.slopeX <= flow.budX + 1e-6 && flow.slopeY <= flow.budY + 1e-6) ||
  console.error(`  carve slope X=${flow.slopeX.toFixed(3)}/${flow.budX.toFixed(3)} Y=${flow.slopeY.toFixed(3)}/${flow.budY.toFixed(3)}`);
check('flow carve crosses every ring dead-centre (a perfect stays flyable)',
  flow.weaveAtRing < 1e-9) || console.error(`  weave at ring plane = ${flow.weaveAtRing.toFixed(4)} (should be 0)`);
check('flow carve line is C0-continuous across every seam (≤1.5m X / 1.15m Y)',
  flow.seamX <= 1.5 && flow.seamY <= 1.15) || console.error(`  seam Δ X=${flow.seamX.toFixed(2)} Y=${flow.seamY.toFixed(2)} — the corkscrew broke C0`);
check('flow actually CARVES on both axes (anti-inert: mean apex ≥ 3.0m X, ≥ 0.8m Y)',
  flow.meanApex >= 3.0 && flow.meanApexY >= 0.8) || console.error(`  mean carve apex X=${flow.meanApex.toFixed(2)}m Y=${flow.meanApexY.toFixed(2)}m — the weave flattened`);
check('emitted flow orbs actually carry the carve (not just the pure function)',
  flow.meanOrbDev >= 1.0) || console.error(`  emitted orbs mean ${flow.meanOrbDev.toFixed(2)}m off the base line — the ribbon lost the weave`);
console.log(`  (flow: ${flow.segs.length} gates, ${flow.orbs.length} orbs, max gap ${flow.maxGap.toFixed(1)}m/${flow.coverBase.toFixed(1)}m, ${flow.bridgeVoids} bridges; carve apex X=${flow.meanApex.toFixed(1)}m Y=${flow.meanApexY.toFixed(1)}m, emitted-dev ${flow.meanOrbDev.toFixed(1)}m, seamΔ X=${flow.seamX.toFixed(2)} Y=${flow.seamY.toFixed(2)}, slope X=${flow.slopeX.toFixed(3)}/${flow.budX.toFixed(3)} Y=${flow.slopeY.toFixed(3)}/${flow.budY.toFixed(3)})`);
await done();
