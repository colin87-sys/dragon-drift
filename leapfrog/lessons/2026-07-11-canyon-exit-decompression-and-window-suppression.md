# 2026-07-11 — Sky Canyon: exit decompression + granularity-invariant gate suppression

**Did / learned.** The sharpest unfairness in the canyon was the **burst-out**: the rib
finale is engineered to eject the player at max boost (speed-orb chain, ~108-125 m/s), and
gate suppression ended **exactly at the canyon end** (`suppressCanyonGates(from, lastRing+40)`)
— so a base Phase Gate (crystal wall) sitting just past the exit, off the flight line and
occluded by the tunnel until burst-out, forced a phase-through (needs Surge + stamina + a
timed roll) or a crash. Worse, suppression was **granularity-dependent** (same disease as
the seam bug): it scanned only the current chunk's `out.obstacles` against a `gateTo` =
last-rib-seen, so in per-frame play a gate generated in its own later chunk was **never**
suppressed → blind crystal walls also spawned *inside* rib runs (per-frame emitted 0
suppressed gates; chunked emitted 6).

Fix: two `CONFIG` buffers (`canyonEntryBuffer: 120`, `canyonExitBuffer: 350`) and a single
end-of-call suppression pass over **three windows computed from persistent generator state**,
so a gate is suppressed the same way in whatever chunk generates it, at any `ensure()` step
size: (a) active run → `[gateFrom, +∞)` where `gateFrom = start - 40 - entryBuffer` (closes
the mid-run hole); (b) idle → `[nextCanyonAt - 40 - entryBuffer, +∞)` — the **only** way to
catch gates generated *before* `startCanyon` runs, since `nextCanyonAt` is known ahead;
(c) exit → `[0, cursorAtEntry]` (a persistent `suppressGatesUntil` captured at chunk start)
plus this chunk's completed-run windows. Also reseat `nextCanyonAt` in `resume()` so a
canyon scheduled inside a boss can't start decapitated in the post-boss grace band.

**→ Systematize.** Two reusable rules. **(1) A set-piece owns its EXIT, not just its body.**
Any high-speed release beat (finale boost-out, geyser launch, updraft) must reserve a
"decompression" run of open, readable air before the next hard demand — sized from *carry
distance at exit speed + telegraph lead* (here: ~195m orb carry + ~90m readability + margin
→ 350m). The chip-damage-only promise of a set-piece is broken if its exit hands you a fatal
wall. **(2) Suppression/injection windows must be a pure function of persistent state, never
of the current chunk's local arrays** — then they're automatically correct at any
granularity, and the frame≡chunk test (`canyonframe.mjs` now compares `canyonGateSuppress`
too) proves it. The subtlety that makes (c) granularity-exact: use the *entry* cursor for the
blanket `[0, …]` window and a separate per-call `runWindows` list for runs that complete
inside the chunk — using the end-of-call cursor for the whole chunk would over-suppress a
chunk that both starts and ends a run.

**→ Leapfrog.** The window-suppression machinery generalizes directly to **biome hazards**
(§5.3): the same three-window pattern can keep vents/spouts/strikes out of a canyon or a
boss approach without a `main.js` change (entries land in the same chunk as their obstacle).
And with the exit protected, the bolder canyon reworks (PR-3 carved slot, the `'flow'`
third run type) can lean *harder* into speed at the finale — the exhilaration is now safe to
cash, because nothing fatal is waiting where the player is told they're clear.
