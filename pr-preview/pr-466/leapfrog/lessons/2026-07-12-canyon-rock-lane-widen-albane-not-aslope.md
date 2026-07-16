# 2026-07-12 — Sky Canyon rock widen: the binder was aLane (lane width), not aSlope

**Did.** Widened the ROCK-RUN corridor so the lateral weave is bigger/sharper while staying
provably fair. New `CONFIG.canyonRockLaneHalfWidth: 16` widens ONLY the rock run; global
`laneHalfWidth: 13` is untouched (base course, boss arenas, spine tube byte-identical).
Result (measured on `tests/canyonflow.mjs`): rock **mean centre-swing 5.6m → 8.1m (+45%)**,
must-steer 17% → 22%, with slope still ≤ `BUDGET_X` (0.217) and min in-lane width still
≥ 7.5m. All gates green; `gold-determinism` byte-identical; `canyonframe` orbs (incl. the
woven boosts) identical per-frame vs chunked across 12 seeds.

**The correction (this overturns `2026-07-12-canyon-rock-adrenaline-and-fair-ceiling.md`).**
That lesson concluded "rock banking is at its fairness ceiling" and blamed the SLOPE budget
(`aSlope`). It was right that the amp CAP (`canyonSwayAmp`) is inert (raising 5.5→6.5 did
nothing — the cap binds 0% of halves), but WRONG about which constraint actually binds.
The per-half sway amp is `min(cap, aSlope, aLane)`; a fresh measurement
(`tests/_diag-rock-caps.mjs`, 6 seeds / 216 halves) shows:

```
laneHW | cap / aSlope / aLane binder | mean amp
  13   | 0%  / 19%   / 81%           | 2.28m   ← aLane (LANE WIDTH) binds, not aSlope
  16   | 0%  / 28%   / 72%           | 4.41m
  18   | 0%  / 55%   / 45%           | 5.21m   ← only here does aSlope finally take over
```

So the true ceiling on typical sections was the **lane margin** (`LANE_MARGIN =
laneHalfWidth − 8`), a WIDTH constraint — not the speed-derived slope budget. Widening the
lane raises `aLane` and nearly doubles the mean weave; `aSlope` (the real fairness ceiling)
only reasserts near 18. Sweet spot 15–16; shipped 16 (owner-approved), where `LANE_MARGIN`
lands exactly on the 7.5m free-width floor.

**The reusable pattern — a canyon-local lane widen, pinned to the interior.**
`laneHalfWidth` is global (fatal wall, boss arenas, base spacing, spine tube), so the widen
is a NEW rock-only value threaded through four kept-consistent touch-points (the three-touch
rule, extended): (1) pure math — `rockSlicePlan` uses a PER-HALF lane, wide in the interior
but pinned to `laneHalfWidth` on the first-seg entry-half and last-seg exit-half; (2)
geometry — sea-stacks fill to `s.laneHW`, the overunder lump spans the wide lane; (3)
collision — the fatal wall reads an EASED `game.canyonLaneHW` (13→16→13 smoothstep over the
run's ±40m entry/exit bands, the `arenaHW` boss-arena grammar) and CLAMPS+chips instead of
killing (owner: rock run is a pressure beat, not a run-ender; and a fatal wall sweeping
inward during the ease-out would be an unearned death); (4) audit — `canyonflow` clamps to
`sl.laneHW` and a NEW gate pins the ramp-safety contract (a wide slice may exist ONLY
strictly inside the boundary rings, so the eased wall is always ≥ the built channel).

**Gotchas.**
- **Interior seam symmetry is the fairness lynchpin.** The sway cap's C0 argument needs an
  IDENTICAL `LANE_MARGIN` on both sides of every interior seam. The narrow-boundary rule
  keeps this intact for every run length ≥2: a 2-seg run pairs seg0-exit(wide)/seg1-entry
  (wide); the only narrow halves are the two run ENDS, which have no rock neighbour to be
  continuous with. Enumerate runTotal 1/2/3 before trusting it.
- **Ramp anchor:** the ±40m markers (`canyonStarts = ring.dist−40`, `canyonEnds =
  lastRing.dist+40`) bound exactly the region where the boundary halves' geometry lives, so
  narrow-capping those two halves + easing the wall over the same 40m makes the wall ≥ the
  channel everywhere, by construction. The audit's ramp gate makes this permanent.
- **Content on the carve line moves with the lane:** the woven bank-apex orb + carve-line
  embers (`level.js`) clamp x to `±(plan.laneBk−2)`, not the old ±11, or the pickup gets
  pulled off the now-wider swayed centre (possibly into a stack). Pure function of segment
  fields → granularity-invariant (canyonframe holds).

**Checkpoint review caught (fold into any local-lane / eased-boundary work — headless
tests can't see these; they live in the state plumbing, outside the pure-math audit).**
- **A soft boundary keyed on the nullable eased width re-arms the fatal branch mid-run.**
  First cut gated the clamp on `game.canyonLaneHW != null`, but the width collapses to null
  in the ±40m ease bands — so a player riding the shrinking exit wall met the `crash` branch
  the instant it nulled while still >13: the exact unearned death the design forbids. Fix: a
  separate `canyonRockSoft` flag true for the WHOLE run drives the soft-vs-fatal choice;
  the eased width only sets the clamp DISTANCE. Decouple "is it soft" from "how wide".
- **A clamp's knockback can double-sign against itself.** The chip did `velocity.x = -sign*6`
  (inward) then `hit(player, sign, …)` — and `hit` adds `+sign*10` (outward), net +4·sign
  INTO the wall it just clamped out of. The ground/ceiling grammar passes `(0,0)` to `hit`
  and kicks manually for exactly this reason. Copy the grammar completely, not partially.
- **A new lane-boundary chip is roll-cheesable unless added to the i-frame exemption.**
  `hit` exempts only `ground`/`ceiling` from roll i-frames; a new `'wall'` cause skipped all
  damage under a barrel roll. Any boundary-limit chip must join that exemption list.
- **Canyon markers cross boss fights.** The start/end markers are consumed every 'playing'
  frame (bosses stay 'playing'), while `spawnAhead` early-returns during `inBoss` and drops
  the run's END marker — so a canyon scheduled within the ~500m lead half-arms across a
  fight and leaves `inCanyon` stuck for km afterward. Flush pending canyon markers + reset
  the canyon state on `bossStart` (the run's geometry is `clearAhead`'d anyway), and guard
  the feature block with `!game.inBoss`. Pre-existing latent seam; the widen weaponized it.
- **Gate a live behavior on the SAME flag as its geometry.** The eased wall gated only on
  `canyonRockLaneHalfWidth > laneHalfWidth`, but the carved-slot geometry gates on
  `canyonRockV2` — so the documented v1 rollback (`canyonRockV2:false`) would run a soft 16
  wall over ±13-assuming v1 geometry. A runtime behavior and the geometry it assumes must
  share one enable flag.

**Leapfrog.** "Widen the lane" is now the proven answer for "more rock banking" (up to ~16,
then aSlope caps it). And the standing law: **when a 'make it more intense' lever is inert,
MEASURE which of the competing caps actually binds before concluding it's the fairness
ceiling** — the last lesson mistook an inert CAP for a binding SLOPE budget when a WIDTH
constraint was the real wall. `tests/_diag-rock-caps.mjs` is kept as the binder diagnostic.
