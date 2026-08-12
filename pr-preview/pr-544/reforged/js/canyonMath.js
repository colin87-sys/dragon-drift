// Pure canyon-corridor math — NO THREE, imports only CONFIG. Both the geometry
// builder (obstacles.js) and the headless flow audit (tests/canyonflow.mjs) consume
// this SAME module, so the "safe tube" the test verifies is byte-for-byte the tube
// the game builds — no re-derivation, no drift.
//
// Coordinate convention (matches obstacles.js ribcage/stackRun): a segment's local
// z is 0 at its reward-ring plane; z < 0 is the ENTRY half (toward the previous
// ring / prevX,prevY), z > 0 is the EXIT half (toward the next ring / nextX,nextY).
import { CONFIG } from './config.js';

// Smoothstep. S(0)=0, S(1)=1, S'(0)=S'(1)=0 (no elbow at the seam or the ring
// plane), peak slope S'(0.5)=1.5 (used in the fairness budget below).
export const ease = (u) => u * u * (3 - 2 * u);

// Worst realistic approach speed anywhere in a canyon: a speed orb (orbs spawn
// inside rock runs too — level.js) at the max speed ramp. The base course audit
// (level.js auditHop) already holds itself to steering-with-boost-bonus at this
// speed, so the canyon overlay is held to the same standard.
export const CANYON_V = CONFIG.orbSpeed * CONFIG.speedRampMax;                 // 108
// Max fair centre-slope per axis = 0.85 × (available steering velocity) / V. The
// eased tube's peak slope must stay under these (verified ~0.19/0.85 of budget).
export const BUDGET_X = 0.85 * CONFIG.lateralSpeed * CONFIG.boostSteeringBonus / CANYON_V;
export const BUDGET_Y = 0.85 * CONFIG.verticalSpeed * CONFIG.boostSteeringBonus / CANYON_V;

// Ribcage corridor half-separation (the side walls sit at centre ± this). Exported
// so obstacles.js AND the flow audit share ONE value — no re-derivation, no drift.
// Matches obstacles.js `cor = (2·gapW)·0.92` since every canyon gap uses canyonGapW.
export const CORRIDOR_HALF = 2 * CONFIG.canyonGapW * 0.92;

// Per-kind section-depth multiplier (the throat is a shorter run-in). Shared by the
// geometry and the audit so the reconstructed tube matches the built one exactly.
const KIND_MULT = { throat: 0.8 };
export const kindMult = (kind) => KIND_MULT[kind] ?? 1;

// Section half-depths: backward from `span` (dist to the previous ring), forward
// from `spanFwd` (dist to the next segment). Sizing the FORWARD half by the forward
// span is load-bearing — a burst→breath seam (span 55 → spanFwd ~150) would blow the
// slope budget if the exit half were sized by the backward span. Clamped 36..80,
// which also tames spanFwd's 300–450m gauntlet-bridge outliers (the PR-0 clamp).
// Spine kinds carry the "continuous tunnel" promise, so their easing halves may grow
// PAST 96 to tile a long gate-hop (breath-beat) gap edge-to-edge — band() still caps
// the wall band at span·0.5, so the tube fills exactly to the inter-ring midpoint and
// the two sides meet with no rib-free hole. Rock kinds (split/overunder) stay capped
// at 96 (no continuity promise; sea-stacks are far heavier meshes). A bridged forward
// side (a gauntlet corridor sits in the gap) OR the terminal segment (spanFwd
// undefined → falls back to the backward span) also stays capped, so rib walls never
// extend into a gauntlet slalom or past the exit into the decompression air.
// FLOW ('flowgate') joins the fill set: its pickup ribbon is emitted per-BAND and must
// tile each half-gap edge-to-edge (band caps at span·0.5) so the carved line has no
// coverage hole — and its "geometry" is a torus + orbs (weightless), so the mesh-cost
// reason rock stays capped doesn't apply.
const SPINE_FILL = new Set(['throat', 'rib', 'straightrib', 'flowgate']);
export function halves(seg, mult = 1) {
  const fill = SPINE_FILL.has(seg.kind);
  const cl = (s, capped) => Math.max(36, Math.min(capped ? 96 : 999, s * 0.6)) * mult;
  return {
    bk: cl(seg.span || 80, !fill),
    fw: cl(seg.spanFwd ?? (seg.span || 80), !fill || seg.bridgedFwd || seg.spanFwd === undefined),
  };
}

// Wall/slice emission band: abuts the neighbour's band at the inter-ring midpoint
// plane (span*0.5 / spanFwd*0.5), so adjacent sections' colliders TILE instead of
// overlapping on offset curves (which narrowed the corridor exactly at the joint).
export function band(seg, bk, fw) {
  return {
    wb: Math.min(bk, (seg.span || 80) * 0.5),
    wf: Math.min(fw, (seg.spanFwd ?? 2 * fw) * 0.5),
  };
}

// Blend between linear (elbow, peak slope = 1× the average) and smoothstep (no
// elbow, peak slope = 1.5×). `a`=1 is full smoothstep, `a`=0 is linear.
const blend = (u, a) => (1 - a) * u + a * ease(u);

// ADAPTIVE easing: use full smoothstep where there is slope headroom (the common
// gentle case — nice rounded flow, flat at the ring), and degrade toward linear
// only where the ring line itself is near its reachability limit — so the C1
// smoothing can NEVER push a demanding-but-fair ring line over the steering budget.
// peak slope of blend over a half of displacement d and length L = (1+0.5a)·|d|/L;
// solve (1+0.5a)·|d|/L ≤ budget for the largest a in [0,1].
function alphaFor(d, L, budget) {
  const ad = Math.abs(d);
  if (ad < 1e-9 || L < 1e-9) return 1;
  return Math.max(0, Math.min(1, 2 * (budget * L / ad - 1)));
}

// Corridor-centre curve. Returns xAt(z)/yAt(z). At z=0 the value is exactly
// (gapX,gapY) — the reward ring stays dead-centre. Because the easing half (0.6·span)
// is longer than the half-distance to the seam (0.5·span), each section reaches its
// neighbour's midpoint value NEAR the seam but not exactly at it: adjacent sections
// carry a bounded offset `Δ = 2·d·(1−blend(u_seam,α))` (≤~1.33m X, ≤~1.0m Y for
// generator-reachable moves — the tolerances in canyonflow.mjs encode this), vs the
// up-to-13.5m Y teleport before Y-threading. In the SHIPPED system the adaptive
// degrade (α<1) engages only in the throat (0.8× halves); rib→rib halves have
// identical span/mult on both sides, so α is equal across every rib seam and the
// join stays full-C1. `u` is clamped to [0,1] so an out-of-range sample can't blow
// up (bridged-gauntlet gaps evaluate far outside a section's rib band).
export function centre(seg, bk, fw) {
  const px = seg.prevX !== undefined ? seg.prevX : seg.gapX;
  const nx = seg.nextX !== undefined ? seg.nextX : seg.gapX;
  const py = seg.prevY !== undefined ? seg.prevY : seg.gapY;
  const ny = seg.nextY !== undefined ? seg.nextY : seg.gapY;
  const half = (z, g, p, n, budget) => {
    if (z <= 0) {
      const e0 = (p + g) / 2, d = g - e0, u = Math.max(0, Math.min(1, 1 + z / bk));
      return e0 + blend(u, alphaFor(d, bk, budget)) * d;
    }
    const e1 = (g + n) / 2, d = e1 - g, u = Math.max(0, Math.min(1, z / fw));
    return g + blend(u, alphaFor(d, fw, budget)) * d;
  };
  return {
    xAt: (z) => half(z, seg.gapX, px, nx, BUDGET_X),
    yAt: (z) => half(z, seg.gapY, py, ny, BUDGET_Y),
  };
}

// Spine (ribcage) lateral SWEEP: a gentle S-curve the tube follows BETWEEN rings so
// the speed tunnel banks like a racing game — zero at every ring plane (the reward ring
// stays dead-centre, a perfect stays flyable), peaking at the seams, sign-flipping per
// section so consecutive sections meet C0 and the sweep reads as one long curve. Applied
// ONLY where a rib is flanked by ribs (never the skull/throat/finale — the finale stays
// straight), and the amplitude is trimmed per half by the SAME slope budget as
// everything else, so the sweep can never demand more steering than the dragon has.
export function spineSway(seg, bk, fw) {
  const gx = seg.gapX, px = seg.prevX ?? gx, nx = seg.nextX ?? gx;
  const si = (seg.swaySign || 1) * (seg.runIdx % 2 ? -1 : 1);
  const ampHalf = (d, eh, neighbourGx, active) => {
    if (!active) return 0;
    const aSlope = Math.max(0, BUDGET_X - 1.5 * Math.abs(d) / eh) * (2 * eh / Math.PI);
    const aLane = 12 - Math.max(Math.abs(gx), Math.abs(neighbourGx)); // rings stay inside the walls
    return Math.max(0, Math.min(CONFIG.canyonSpineSwayAmp, aSlope, aLane));
  };
  const entryX = (px + gx) / 2, exitX = (gx + nx) / 2;
  const ribRun = seg.kind === 'rib';
  const aEntry = ampHalf(gx - entryX, bk, px, ribRun && seg.prevKind === 'rib');
  const aExit = ampHalf(exitX - gx, fw, nx, ribRun && seg.nextKind === 'rib');
  return (z) => {
    const zn = Math.max(-1, Math.min(1, z < 0 ? z / bk : z / fw)); // 0 at ring, ±1 at seam
    return si * (z < 0 ? aEntry : aExit) * Math.sin((Math.PI / 2) * zn);
  };
}

// Flow run "CARVE": the walls-free slalom the pickup ribbon follows between rings — the
// SAME spineSway grammar (zero at every ring plane → a perfect stays flyable; peaks at the
// seams; sign-flips per section → one long C0 S-curve), but at flow's MAX amplitude on BOTH
// axes (a lateral weave + a gentle vertical corkscrew whose apexes cycle x/y for a helix).
// Flow has no walls, so the only ceiling is the steering budget + the orb-clamp lane (±11
// X, [4.5,20] Y) — the carve can never demand more steering than the dragon has, nor push a
// pickup off the collectable lane. Returns {x,y} offsets to add to the base ring line.
// Zero when the amp dials are 0 (the PR-1 straight-ribbon rollback).
export function flowWeave(seg, bk, fw) {
  const gx = seg.gapX, px = seg.prevX ?? gx, nx = seg.nextX ?? gx;
  const gy = seg.gapY, py = seg.prevY ?? gy, ny = seg.nextY ?? gy;
  const total = seg.runTotal ?? 1;
  // BOTH axes sign-flip per section — the seam (where adjacent bands abut) sits at zn≈±0.83
  // (the ease half 0.6·span is longer than the half-to-seam 0.5·span), where NEITHER basis is
  // zero, so C0 across the seam needs the per-section flip on BOTH axes (an every-other-section
  // Y flip left a ~A step at half the seams — the C0 bug the first cut shipped). The corkscrew
  // comes from the DIFFERENT BASIS, not a different sign: the X apex sits at the seam, the Y
  // apex a quarter-phase in at the mid-half, so the (x,y) apex still walks a helix.
  const siX = (seg.swaySign || 1) * (seg.runIdx % 2 ? -1 : 1);
  const siY = siX;
  // d = base ring-line move over this half; eh = easing half length; [lo,hi] = the pickup
  // lane on this axis; gv/nv = this + neighbour ring value. aSlope leaves headroom below the
  // budget for the base ease's own peak; slopeF is the phase's peak-slope→amp factor (the X
  // basis peaks at A·π/2eh, the Y basis at A·π/eh — Y gets HALF the headroom). aLane keeps
  // base±A inside the lane (two ring extremes → base±A in-lane everywhere; seam-symmetric so
  // adjacent halves match → C0). Same conservative construction as rockSlicePlan's amp trim.
  const ampHalf = (d, eh, cap, budget, gv, nv, lo, hi, slopeF) => {
    const aSlope = Math.max(0, budget - 1.5 * Math.abs(d) / eh) * slopeF;
    const aLane = Math.min(hi - Math.max(gv, nv), Math.min(gv, nv) - lo);
    return Math.max(0, Math.min(cap, aSlope, aLane));
  };
  const capX = CONFIG.canyonFlowWeaveAmp, capY = CONFIG.canyonFlowWeaveAmpY;
  const entryDx = (gx - px) / 2, exitDx = (nx - gx) / 2;
  const entryDy = (gy - py) / 2, exitDy = (ny - gy) / 2;
  const mouth = seg.runIdx === 0, finale = seg.runIdx === total - 1;
  // Boundary discipline: straight in through the mouth, straight out of the finale, and
  // straight across a gauntlet-bridged forward side (mirrors rock/spine entry/exit caps).
  const entryOn = !mouth, exitOn = !finale && !seg.bridgedFwd;
  const aXe = entryOn ? ampHalf(entryDx, bk, capX, BUDGET_X, gx, px, -11, 11, 2 * bk / Math.PI) : 0;
  const aXx = exitOn ? ampHalf(exitDx, fw, capX, BUDGET_X, gx, nx, -11, 11, 2 * fw / Math.PI) : 0;
  const aYe = entryOn ? ampHalf(entryDy, bk, capY, BUDGET_Y, gy, py, 4.5, 20, bk / Math.PI) : 0;
  const aYx = exitOn ? ampHalf(exitDy, fw, capY, BUDGET_Y, gy, ny, 4.5, 20, fw / Math.PI) : 0;
  return (z) => {
    const zn = Math.max(-1, Math.min(1, z < 0 ? z / bk : z / fw)); // 0 at ring, ±1 at seam
    const sX = Math.sin((Math.PI / 2) * zn);  // peaks at the seam (mid-gap)
    const sY = Math.sin(Math.PI * zn);         // 0 at ring AND seam → C0 across seams; peaks mid-half
    return { x: siX * (z < 0 ? aXe : aXx) * sX, y: siY * (z < 0 ? aYe : aYx) * sY };
  };
}

// Rock Run "carved slot" plan: the threaded, gently-swayed lateral channel (one
// axis — vertical is the 'overunder' beat's job) bounded by sea-stacks. Returns the
// per-slice left/right channel walls; obstacles.js builds the stacks from it and the
// flow audit verifies it — same math, no drift. The channel centre is the SAME
// eased ring-line as the ribcage plus a bounded sway that fills the leftover slope
// headroom, so the slalom can never demand more steering than the dragon has.
export function rockSlicePlan(seg) {
  const { bk, fw } = halves(seg);
  const { wb, wf } = band(seg, bk, fw);
  const { xAt } = centre(seg, bk, fw);
  const gx = seg.gapX;
  const px = seg.prevX !== undefined ? seg.prevX : gx;
  const nx = seg.nextX !== undefined ? seg.nextX : gx;
  const entryX = (px + gx) / 2, exitX = (gx + nx) / 2;
  // Sway sign flips per section so consecutive seams meet C0 (like the old cos phase).
  const si = (seg.swaySign || 1) * (seg.runIdx % 2 ? -1 : 1);
  // Per-half sway amplitude: fill the slope headroom left after the threaded centre's
  // own easing peak, then cap by the lane-edge margin. Sway peak slope = A·π/(2·eh);
  // set ≤ (BUDGET_X − easePeak) → A ≤ (BUDGET_X − easePeak)·2·eh/π (conservative: the
  // sway peak at the ring and the ease peak mid-half don't co-locate, so total < sum).
  // In-lane free-width floor the audit enforces (+0.5 safety). Keep the swayed centre
  // far enough from the fatal lane wall that the channel never pinches below it.
  // PER-HALF lane: the run INTERIOR uses the wider canyonRockLaneHalfWidth (more sway
  // headroom — aLane is the binding cap on ~81% of halves), but the first segment's
  // ENTRY half and the last segment's EXIT half stay at the global laneHalfWidth. Those
  // two halves are the only rock geometry inside the ±40m entry/exit ease bands where the
  // fatal wall is still ramping out from 13 — narrow-capping them means the wall is never
  // asked to sit further out than it has eased to (the ramp-safety contract, verified by
  // canyonflow's boundary gate). Interior seams stay seam-symmetric (both sides wide), so
  // the C0 cap agreement below is preserved.
  const total = seg.runTotal ?? 1;
  const laneEntry = seg.runIdx === 0 ? CONFIG.laneHalfWidth : CONFIG.canyonRockLaneHalfWidth;
  const laneExit = seg.runIdx === total - 1 ? CONFIG.laneHalfWidth : CONFIG.canyonRockLaneHalfWidth;
  const chanHalfAt = (t) =>
    CONFIG.canyonPinchHalf + CONFIG.canyonBreathOpen * (0.5 - 0.5 * Math.cos(Math.PI * t));
  const ampHalf = (d, eh, neighbourGx, laneHW) => {
    const LANE_MARGIN = laneHW - 7.5 - 0.5;   // free-width floor 7.5 + 0.5 safety
    const easePeak = 1.5 * Math.abs(d) / eh;
    const aSlope = Math.max(0, BUDGET_X - easePeak) * (2 * eh / Math.PI);
    // SOLVED, seam-symmetric lane cap: |xAt(z)+A·sin| ≤ LANE_MARGIN + chanHalf across
    // the WHOLE half, not just the seam — so the sway can't push the centre toward the
    // wall mid-section and pinch the in-lane channel below the floor. |xAt| is bounded
    // by max(|gx|, |neighbourGx|) (the two gaps this half spans); those two gaps are
    // shared by the abutting half of the next section, so a·exit and b·entry compute an
    // identical cap → the sway stays C0 across the seam. Scan a few t; near the ring
    // sin→0 imposes no constraint (sway is ~0 there).
    const maxG = Math.max(Math.abs(gx), Math.abs(neighbourGx));
    let aLane = CONFIG.canyonSwayAmp;
    for (const t of [0.35, 0.5, 0.65, 0.8, 0.92, 1.0]) {
      const s = Math.sin((Math.PI / 2) * t);
      aLane = Math.min(aLane, (LANE_MARGIN + chanHalfAt(t) - maxG) / s);
    }
    return Math.max(0, Math.min(CONFIG.canyonSwayAmp, aSlope, aLane));
  };
  const aEntry = ampHalf(gx - entryX, bk, px, laneEntry);
  const aExit = ampHalf(exitX - gx, fw, nx, laneExit);
  const sway = (z) => {
    // zn clamped to [±1] so an out-of-range sample (a gauntlet-bridged "seam" far
    // beyond the rib band) holds the seam value instead of running the sinusoid wild.
    const zn = Math.max(-1, Math.min(1, z < 0 ? z / bk : z / fw)); // 0 at ring, ±1 at seam
    return si * (z < 0 ? aEntry : aExit) * Math.sin((Math.PI / 2) * zn);
  };
  // Breathing channel: tightest near the ring (where the ring is the aim point),
  // opening to pinchHalf+breathOpen at the seams (constant → continuous across them).
  const chanHalf = (z) => {
    const zn = Math.abs(z < 0 ? z / bk : z / fw);
    return CONFIG.canyonPinchHalf + CONFIG.canyonBreathOpen * (0.5 - 0.5 * Math.cos(Math.PI * zn));
  };
  // Ring approach cone: keep the flight line to every ring CLEAR of stacks. Full ±7
  // pocket within 12m of the ring, then tapering to 0 out to 36m on the APPROACH side
  // (z<0 → smaller dist → the side you fly in from; ~0.33s of clear convergence at
  // canyon speed). A binary 12m pocket (0.11s) let a stack sit on the aim line the
  // player had already locked onto — "a spike in front of the ring".
  const pocket = (z) => {
    const az = Math.abs(z);
    if (az < 12) return 7;
    if (z < 0 && az < 36) return 7 * (36 - az) / 24;
    return 0;
  };
  const count = Math.max(5, Math.round((wb + wf) / 12));   // ~12m slice pitch
  const slices = [];
  for (let k = 0; k < count; k++) {
    // Staggered (centre-of-cell) sampling — NOT the band edges — so abutting sections
    // don't both build an identical sea-stack on the shared seam plane (doubled tris).
    const z = -wb + ((k + 0.5) / count) * (wb + wf);
    const xc = xAt(z) + sway(z);
    const nearRing = Math.abs(z) < 12;
    const p = pocket(z);
    let li = xc - chanHalf(z), ri = xc + chanHalf(z);
    if (p > 0) { li = Math.min(li, gx - p); ri = Math.max(ri, gx + p); }
    // The effective lane half-width for THIS slice's half (entry z<0 / exit z>0) — the
    // sea-stack fill (obstacles.js) and the flow audit's in-lane clamp both read it, so a
    // wide interior half fills to ±16 while a narrow boundary half fills to ±13.
    const laneHW = z < 0 ? laneEntry : laneExit;
    // Drop the sea-stack crests anywhere the approach cone is open (noCrest) so a lunge
    // to a high ring never clips a thin spire tip on the approach.
    slices.push({ z, xc, li, ri, nearRing, noCrest: p > 0, laneHW });
  }
  // xcAt lets the flow audit sample the channel centre continuously (the slices are
  // only ~12m apart — too coarse to catch the peak slope). laneBk/laneFw expose the
  // per-half effective lane so level.js can clamp woven orbs/embers to the right edge.
  return { bk, fw, wb, wf, slices, laneBk: laneEntry, laneFw: laneExit,
           xcAt: (z) => xAt(z) + sway(z) };
}
