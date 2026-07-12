# 2026-07-12 — Sky Canyon flow-tube PR-1: a walls-free third run type

**Did.** Added `'flow'` — a THIRD Sky Canyon run type (joining rock + spine): the "Rhythm
Flow-Tube," a walls-free speed showcase. The rings become light-gates (an emissive torus +
viewfinder brackets dressed onto the ring FROM the segment — `rings.js` untouched), and a
dense orb + ember RIBBON is strung between them on the eased ring line. PR-1 is the flyable
naked run; the graze-combo chain scoring is PR-3, the visual pylons/mote-sleeve are PR-2, and
the Aurora biome that themes it is a separate arc. Two-stage Fable process drove it: a
detailed-plan agent (flow run + Aurora biome) then a feasibility agent that verified every
seam and caught the missed sea/ground health seam before a line was written.

**The build, seam by seam (all determinism-safe — fixtured streams untouched):**
- **Picker:** `CONFIG.canyonTypeWeights {rock35,spine35,flow30}`, mapped through ONE
  `canyonRnd()` draw so the stream stays aligned; `flow:0` renormalizes to rock/spine 50/50
  = byte-identical rollback. `canyonFlowSegments [12,16]`. `?flowrun`/`?canyon=flow` force
  routes; `?canyon=all` now cycles three via a counter.
- **Generation:** one `flowgate` kind (`pickKind`); `emitSegment` flow branch emits a gate
  orb + a dense ribbon on `centre()`'s eased line — all pure functions of segment fields
  (zero RNG), so `gold-determinism` is byte-identical and `canyonframe` (12 seeds) holds.
- **Builder:** a `flowgate` branch in `buildRockGap` with `e.boxes` left EMPTY (walls-free
  by construction) — a `flowColliderBoxes()` accessor pins it in a `?canyon=flow` WebGL boot.
- **"Nothing can hurt you":** three health seams closed in `collision.js` keyed on
  `game.canyonRun === 'flow'` — the lane wall CLAMPS with no damage (boss-arena grammar, not
  the rock chip), the sea keeps its bounce but skips the damage, the canyon ceiling is exempt.
  No new gameState flag needed (canyonRun is already set at marker crossing).

**Gotchas (the ones the tests forced me to find):**
- **`out.orbs` is a shared bus.** It carries first-flight scripted orbs (`level.js:396`) and
  periodic base-course orbs (`:492`), NOT just canyon content. A fairness audit that scans
  "all orbs in the run's dist-range" wrongly counts those. Fix: TAG flow orbs (`flow:1`, a
  non-fixtured marker that doesn't change the canyonframe dist:x:y key) and filter to them.
  General law: when auditing a set-piece's own content, filter to content it OWNS — never
  assume a shared output array is single-source.
- **Ribbon density vs the gauntlet bridge.** A single mid-gap orb left a 823m void on a
  gauntlet-bridged ring gap (rings far apart, the slalom is its own beat). The fix has two
  parts: (1) fill the ribbon over the WHOLE span at ≤46m pitch, but only up to
  `canyonFlowFill` (260m) — a wider gap is a genuine bridge, left open like every canyon
  system (`canyonflow`/`canyonframe` skip bridged seams the same way); (2) the fairness gate
  measures the CONTIGUOUS chain (gaps ≤ fill) and reports bridge voids separately, instead of
  failing on an intentionally-open beat. Bimodal-by-construction gap distribution (≤55m
  ribbon OR >260m bridge) makes the audit clean.
- **`bk` caps the reach.** Deriving the ribbon reach from `2·bk` (halves caps bk at 96 for
  non-fill kinds) under-filled long-but-not-bridge spans (a 288m span left a 143m hole).
  Compute the fill span DIRECTLY (`min(span, canyonFlowFill)`), not from the eased-halves.
- **Collision runs before the marker crossing** that sets/clears `game.canyonRun` (1-frame
  lag) — harmless at flow entry/exit because the player is inside ±13 at both boundaries (the
  same reasoning as the rock-widen soft wall).

**Checkpoint review caught (Fable, folded in).**
- **BLOCKER — the fatal-wall re-arm class again.** The flow clamp set `velocity.x = 0`
  (copying the boss-arena grammar), so a player riding the edge rested at EXACTLY ±13; the
  frame the run ends and `canyonRun` clears, held-outward input pushes to 13.0001 and
  `crash('wall')` fires — an instant full-health death at the boundary the run spent ~14s
  teaching is safe. Fix: use the ROCK grammar's INWARD kick (`velocity.x = -sign*6`), never
  `vx=0` — a pressed player always carries inward velocity across the end marker and can't
  rest on the fatal line. (The boss-arena `vx=0` is safe only because the arena persists
  until teardown; a canyon run ends *under* you.) Standing rule: a soft boundary that a
  fatal boundary re-arms behind must leave the player strictly INSIDE the fatal line at
  release — clamp-to-edge + zero-velocity is a trap.
- **SHOULD-FIX — a regression guard can silently evaporate.** `canyonflow` pinned seed
  205907 for its 341m gauntlet-bridged split pair (guarding the unclamped-zn seam fix). The
  new `canyonTypeWeights` reassign run types on the same `canyonRnd` draw → that seed no
  longer contains the bridged pair, so the guard passed while testing nothing. Fix: re-pin
  (seed 8, ~557m gap) AND add a HARD assertion that a >300m bridged pair EXISTS, so a future
  weight/layout change fails loudly. Law: a guard that depends on a generated configuration
  must ASSERT that configuration is present, or it rots invisibly.
- **Deferred to PR-2 (visual pass), noted:** (a) on spans >~115m the ribbon orbs freeze at
  the entry MIDPOINT (centre() clamps `u` beyond `-bk`) while the true line is still easing
  from the previous gate — up to ~5.3m off, a visible dogleg on ~half of filled gates;
  catchable (not a PR-1 fairness break) but the ribbon IS the identity, so PR-2 samples the
  previous gate's exit half for the far portion (pure/deterministic). (b) the flowgate builds
  9 unmerged meshes/gate — merge before PR-2 piles on pylons + the mote sleeve.

**Leapfrog.** The flow run is the coexist→prove template for a run type that's *fair by
construction* (nothing to clip; the only "failure" is dropping the score chain, which lands
in PR-3). The `canyonFlowFill` bridge threshold + tagged-orb audit is the reusable pattern
for any ribbon-on-the-ring-line content. Next: PR-2 (light pylons + mote sleeve), PR-3 (the
graze-combo chain + `game.flowChain`), then the Aurora Shallows biome (`BIOMES[6]`, its own
slotting spec banked) with the authentic aurora-borealis drapery sky.
