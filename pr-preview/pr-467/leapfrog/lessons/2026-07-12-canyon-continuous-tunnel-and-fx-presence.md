# 2026-07-12 — Sky Canyon feel-v4: a continuous tunnel, and honest FX in the gaps

**Did / learned.** The spine "speed tunnel" had long featureless breaks with the speed
FX still blazing — the user thought it was a glitch. It wasn't: each rib section only
tiled `[-wb, wf]` around its ring, and `halves()` clamped each easing half to **96m**,
so a long "breath-beat" ring hop (rings can sit >192m apart at speed, and a *suppressed
in-canyon gate* makes a ring gap TWO hops → up to ~300m) left a rib-free dead zone in
the middle — while `player.canyonSlip` (and every FX gated on it) stayed flat across the
whole run. Two systems with different notions of "inside the tunnel."

Two-part fix, and the split is the lesson:

- **Fill what you honestly can.** Spine kinds (`throat/rib/straightrib`) now *uncap* the
  easing half (min→999) so ribs tile a long **non-bridged** gap edge-to-edge (`band()`
  still caps the wall band at the inter-ring midpoint, so the two sides meet with no
  hole and no overlap). Rock kinds, a **bridged** forward side, and the terminal segment
  stay capped at 96 — because an uncapped bridged side would build rib walls *into a
  gauntlet slalom* (a different forced-line system) or *past the exit* into the
  decompression air. A new `bridgedFwd` flag (pure run-state: set when a gauntlet ring
  is skipped mid-run, stamped at backfill) distinguishes an honest long hop from a
  gauntlet bridge. **Uncapping only lengthens the easing L → shallower slopes**, so the
  `canyonflow` audit stays valid by construction (it consumes the same `halves`); the
  only visible effect is more seams *enter* the audit (spine pairs 68→85) and they pass.

- **Gate the FX on what's actually there, not on the buff scalar.** Gauntlet gaps *must*
  stay open (determinism: rings are fixtured, can't move; the corridor can't be filled).
  So `spineWallPresenceAt(dist)` — a pure spatial taper over the built rib bands — now
  multiplies the slip mix into an `fxMix` that drives the streaks, CSS lines, aberration,
  vignette, and the rib-flutter *depth*. In a rib-free gap the "walls whipping past" cues
  fade to zero, while **slip, FOV, and the wind loop stay on the raw mix** (you ARE still
  moving faster there — collapsing those would read as a phantom slowdown). Short breaks
  now read as an intentional breath, which is exactly what the user said they'd accept.

**→ Systematize.** Two reusable laws. (1) **A "continuous" promise is a coverage
contract between two generators** — here rib geometry vs the fixtured ring stream. When
one can't be moved, fill the geometry to it and *measure the residual*, don't assume
continuity. (2) **Drive presentation FX off the built world, not off the abstract state
that requested them.** `player.canyonSlip` says "a buff is active"; `spineWallPresenceAt`
says "there is a wall here to whip past." Gating the *look* on the latter and the
*physics* on the former is what makes a break feel deliberate instead of broken. Any
future "here be dragons" FX (boss-proximity grime, biome-hazard tint) should sample the
thing it depicts, not the flag that turned it on.

**→ Leapfrog.** `spineWallPresenceAt` is a general "is there built geometry near dist?"
query on the entries array — reusable for any distance-gated overlay FX. And the
kind/bridge-aware `halves` is the template for any "tile a procedural corridor to a
fixed anchor stream, but not across a foreign forced-line system" problem the other
biomes will hit when their hazards land next to gauntlets.
