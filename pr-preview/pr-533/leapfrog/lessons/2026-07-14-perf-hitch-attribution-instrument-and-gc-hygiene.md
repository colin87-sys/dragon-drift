# Perf — a hitch is not a throughput problem: attribute sim vs draw vs GPU before cutting

**Why.** With the adaptive-resolution governor live, the owner's on-device HUD (Aurora Shallows,
flow run) read **`avg 55–57, tier 0, res 0.60 sv`** — the governor had spent the perf-saver AND
trimmed resolution to the floor while *holding every feature* (working as designed) — **but
`min 20fps @286c/103k`, `p95 28ms`.** The steady state was fine; the *hitches* were the felt
problem, and **a hitch is a stall, not sustained slowness — no resolution/quality lever fixes
it** (the median-signal lesson's corollary: "the fix for a hitch is to remove the hitch"). So
the governor, however well-tuned, was the wrong tool for what the owner was now seeing.

**The tell was already in the HUD, and it refuted my first guess.** I assumed the periodic
spike was the water mirror (a scene-doubling pass). But the worst frame's signature —
**`286 calls / 103k tris` vs the steady `166c / 51k`** — is geometry *roughly doubled on one
frame*. A mirror re-render would double tris too, but a targeted audit found the real source:
**canyon segment geometry built SYNCHRONOUSLY during play.** `spawnAhead → addCanyonSegment →
buildRockGap` constructs dozens of `IcosahedronGeometry`/`ConeGeometry` + per-vertex jitter +
`computeVertexNormals`/`mergeGeometries` on a single frame, and a flow run *is* a stream of
canyon segments — so the build fires repeatedly through the carve. That's both a CPU stall
(the ~50ms frame) and a young-gen allocation spike (the next GC). The `103k tris` is the newly
built segment now in-scene; the `20fps` is the frame that built it.

**What we did — build the instrument that PROVES which of the three it is, then ship the safe
wins; defer the risky cut.**
1. **Hitch attribution in the HUD (`perfStats.js` + `main.js`).** Wall-time the frame's two
   halves — the world-update phase (`sim`) and the render-submit phase (`draw`) — and snapshot
   both **at the worst frame** alongside the existing worst calls/tris. The HUD gains a line:
   `hitch 50ms  sim 41 draw 3 gpu 6`. The reading localizes the stall with zero ambiguity:
   **high `sim` = a JS/GC stall** (remove the alloc / warm the compile — quality can't help);
   **high `draw` = an extra render pass** (mirror/mask — duty-cycle it); **the remainder `gpu`
   = fill** (where the resolution governor helps). This is the temporal analogue of the
   fill-vs-CPU pixelRatio probe: a single-axis, pre-interpretable on-device read. Zero cost
   when the HUD is off (`perfEl` null → no `performance.now()` reads).
2. **The two zero-risk per-frame GC fixes** the audit surfaced (steady-baseline, lower the p95
   floor everywhere): `Object.keys(_kick)` in the per-frame post-FX decay loop allocated a fresh
   5-string array 60×/s → hoisted to a module `_kickKeys`; `emit('distance', { m })` allocated a
   fresh payload object every frame → reuse one module object (verified all three listeners read
   `.m` synchronously and never retain it).

**Deliberately deferred (the actual big fix, RANK 1): amortizing the synchronous canyon build.**
It's a gameplay-adjacent change (the generator; pop-in / collision-gap risk if a segment spawns
late) and it **must be validated by the instrument on-device first** — the repo's hardest-won
law is *localize before you cut, and don't cut the thing you only suspect.* Shipping the
instrument + safe hygiene now lets the owner confirm the remaining spike reads `sim`-dominated
(the build), after which the fix — time-slice the segment spawn across frames on a per-frame
budget while keeping the generation itself byte-identical (spawning is consumption-side and
already state-pure) — lands as its own flagged PR with the `sim` number as the before/after proof.

**The headline lesson — instrument the frame's PHASES before you attribute a hitch, because your
first guess will be the flashy subsystem, not the real one.** I was ready to scale the mirror; the
data said the mirror was innocent and a synchronous asset build was the culprit. A `sim/draw/gpu`
split is cheap, and it converts "it feels janky in this biome" into "the worst frame is 41ms of
JS" — which points at generation/GC/compile, not at anything a quality tier can touch. Corollary:
**separate the steady-state metric from the hitch metric.** `avg 55` and `min 20` are different
problems with different cures (trim fill vs. remove a stall); a controller that reacts to the
average will never fix the stall, and vice versa.

**Verify.** `perfStats.js` gains `worstSimMs`/`worstRenderMs`, snapshotted at the min-fps frame;
`tests/perfhud.mjs` 15/15 (asserts the split is captured at the worst frame). `composer` (36) /
`resgovernor` (30) / `passbudget` (19) green; a headless `?debug=perf` boot **+ 2s flight**
renders the `hitch … sim … draw … gpu` line with zero console errors. The GC fixes are
inspection-verified (fixed-key iteration; a reused, never-retained payload). On-device, the owner
reads the new `hitch` line in a flow run: expect **`sim` to dominate** — the confirmation that the
next PR (amortize the canyon build) is aimed correctly.

**Reusable.** (1) A hitch ≠ throughput; instrument `sim` (JS/GC) vs `draw` (submit) vs `gpu`
(fill remainder = frame − sim − draw) and snapshot them at the worst frame — the temporal analogue
of the fill-vs-CPU pixelRatio probe. (2) Attribute before cutting: the flashy suspect (a mirror, a
post pass) is often innocent; a synchronous asset build / per-frame allocation is often the real
one. (3) Per-frame `Object.keys`, object/array literals, `.clone()`, and template strings in the
hot path are steady GC feed — hoist/reuse them (verify no listener retains a reused payload). (4)
Synchronous procedural geometry generation during play is a periodic CPU+GC spike; time-slice it
across frames (consumption-side, determinism-safe) — but ship the instrument and confirm on-device
first.
