# 2026-07-11 — Sky Canyon: the overlay must be per-frame granularity-invariant

**Did / learned.** The Sky Canyon overlay (`level.js overlayCanyons`) smoothed rib
seams using a **call-local** `prevSeg`/`prevRing`. That only works in the 800m-chunk
tests: real play runs `ensure(player.dist + lead)` every frame, so a chunk holds **at
most one ring** (zero when the waypoint became a gate). Consequences, all invisible to
the chunked tests and the `?canyon` teleport harness:
- segment `nextX` was **never set** in real play → every rib section exited straight at
  its own centre while the next entered at a midpoint → the tube *teleported* laterally
  up to ~11m at each seam (the owner's "abrupt/narrow transition that forces a collision");
- `makeRockGap`'s `span` was **always the 80 fallback** → ribcages were sized for one
  fixed spacing regardless of the actual ring rhythm;
- `pickKind`'s `dy` was **always 0** → rock runs were **100% `split`** in real play
  (`overunder` shelves only ever appeared in chunked tests);
- `inGauntlet` read the **current chunk's** `out.gauntletStarts` → the "never overlay a
  canyon on a gauntlet corridor" exclusion silently failed in real play, stacking two
  forced-line systems.

Fix: **build each segment at ring time (keeping `canyonRnd` draw order byte-identical)
but EMIT it one ring later** via `canyon.held`, so `prevX/nextX/prevY/nextY` + a real
forward span are true values; force-flush the final segment at run end. Move every
piece of cross-ring state (`lastRingSeen`, persistent `gauntletRanges`) onto the
**closure**, not a call-local.

**→ Systematize.** The generalizable law: **anything the canyon/hazard/gauntlet overlays
carry across rings MUST live on the closure or the run object, never on a per-call local
— because a "chunk" is one frame's worth of course (~1 ring), not a batch.** The durable
guard is a test that walks `ensure()` in 2m steps (mirroring `main.js`'s `generatedUntil`
gate) and asserts the emitted stream is **byte-identical to a coarse chunked walk**
(`tests/canyonframe.mjs`). That granularity-equality assertion is strictly stronger than
the old per-seed determinism check: it catches every latent "call-local state that leaks
chunk boundaries" bug at once (it flushed out the `nextX`, `span`, `pickKind`, AND
`inGauntlet` bugs together, and re-run against the pre-fix code it fails 4/5). Any future
overlay pass (PR-2 rock retune, PR-8/9 new-biome hazards) should add its output to that
frame≡chunk comparison.

**→ Leapfrog.** With `nextX/nextY/spanFwd` now real per-frame, **PR-2 (ribcage Y-threading
+ smoothstep seam easing) and PR-3 (rock run "carved slot") have a correct substrate** —
they were no-ops on the old call-local data. It also means the "delay emission by one
unit to learn your forward neighbour" pattern is reusable for any set-piece that needs
look-ahead (e.g. telegraphing the next hazard site, or a boss entrance that reads the
biome ahead). Watch item for PR-2: `spanFwd` can be ~300-450m when a canyon bridges a
gauntlet, so its consumer must clamp (the backward `span` is implicitly clamped by
`dhFor`'s `min(80,…)`; `spanFwd` has no data-level guard).
