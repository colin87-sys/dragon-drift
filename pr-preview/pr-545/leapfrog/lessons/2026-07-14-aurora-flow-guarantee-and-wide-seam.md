# 2026-07-14 — Guaranteeing a flow run IN the aurora (without a canyon desert) + one shared seam ramp

**Why.** Owner flew the live Aurora Shallows: "the flow run appears randomly without the aurora, or vice
versa" (they wanted them COUPLED — the dreamy sky + the speed-tube as one signature moment), and "sometimes
it cuts in/out abruptly." Decision: **guarantee** a flow run in every aurora stretch. A Fable design pass +
this build. Two lessons, both about a mechanism's *side effects* on the rest of the system.

## Guaranteeing a placement WITHOUT a desert — pull BACK, never push FORWARD
Canyons are scheduled ~1500-2600m apart; a flow run must land in the ~1500m aurora block. The first three
mechanisms each died on a side effect — worth recording so we don't re-derive them:

1. **A scheduling SHADOW (suppress naturals near the block) creates a canyon desert.** Sizing the shadow to
   the max run span (measured 4360m — a breath-stretched spine, far longer than the "~1800m" the sheet
   assumed) gave 100% coverage but **a third of all canyon-free stretches ballooned past 4km** — it
   sparsified canyons *game-wide*, not just at the aurora. A guarantee that quietly re-paces the whole game
   is the wrong trade. **Measure the side effect on the WHOLE course, not just the target.**
2. **Mid-loop INJECTION (force-start a canyon at the mouth) breaks granularity invariance.** It mutates
   `canyon` without updating `nextCanyonAt`, and the gate-suppression window anchors to `nextCanyonAt` — so
   whether a chunk boundary falls before or after the injection changes the suppression at the SAME
   distance. `canyonframe.mjs` (per-frame ≡ chunked) caught it. **Any placement that changes canyon state
   must go through the SAME variable the suppression reads, or it desyncs across chunk granularities.**
3. **The fix — a SNAP-BACK at `nextCanyonAt`-assignment time.** When the next natural canyon would start
   PAST an unserved aurora block's mouth, pull `nextCanyonAt` **back** to the mouth (`return natural > T ? T
   : natural`). It only ever pulls back (T < natural) → the interval SHRINKS, never grows → **no desert**
   (measured max free stretch 5214m, 0.2% of stretches > 3.5km, vs baseline 2972m). And it's applied where
   `nextCanyonAt` is set, so suppression stays a pure function of persistent state → **granularity-safe**.
   General rule banked: **to inject a scheduled event without a desert, pull the existing schedule back to
   the target — don't suppress a window (desert) and don't inject out-of-band (granularity break).**

## Guaranteeing the TYPE without homogenising the game — target the actual bleeders
A snapped/in-block canyon is forced to flow (consume the type draw, THEN override — stream stays aligned).
But a long run STARTING before the block can bleed across the seam as rock/spine. Forcing flow for *every*
canyon within a blanket pre-roll pushed the global flow share to 68% (rock/spine went rare near the aurora).
**Type-TARGETED** conversion — force flow only when the run's OWN type-span would carry it into the block
(`ring.dist + (spine ? 3400 : rock ? 1500 : 0) > bNext`) — keeps a short rock near the aurora as rock and
converts only the true bleeders, holding flow share at 60% for 100% coverage. **When you must convert a
category to guarantee an outcome, gate the conversion on whether each member actually causes the problem,
not on proximity.** (60% is still up from ~30%; the flow bias concentrates on the approach — a deliberate
"the flow builds into the dream" — and it's a one-line dial for the owner.)

**Coverage is a RUN-OVERLAP property, not a start-in-window one.** Because a bleeding flow starts *before*
the block, the test asserts a flow RUN overlaps `[B, B+L)` (start < B+L && end > B), reconstructing runs by
interleaving `canyonStarts`/`canyonEnds` in distance order (robust to count drift at the walk boundary) —
not "a flow start in a window." Verified 100% over 400 seeds × 4 cycles.

## The abrupt seam (#2) — ONE shared wide ramp, not a per-channel one
PR-4 widened only `auroraMix` (the curtain) and left sky/water/fog/stars on the 150m seam, so the BACKGROUND
snapped under the dawning curtain — and at flow/boost speed the 150m passes in ~1.5s ("sometimes abrupt" =
"when fast"). Fix: hoist the aurora-seam branch above every lerp and share ONE `ts` (600m in / 400m out) for
ALL channels (splitting per-channel just relocates the incoherence mid-seam). Sized for the worst realistic
speed (orb ~108 m/s → 600m ≈ 5.6s). Branch-gated `(a.aurora||b.aurora) && ia!==ib` → non-aurora seams
`ts===t` byte-identical, `?biome=6` (ia===ib) pins full values, and `biomeIndexAt`/props/matIndex/hazard
Law-5/boss guards are all untouched. `whaleMix` now rides the same 400m the curtain dies in — the handoff
finally happens in one window. **A boolean/narrow crossfade that only covers ONE element of a transition
reads as a snap of everything else; widen the whole seam together.**

## Determinism ledger (the sanctioned re-pins)
`gold-determinism` stays byte-identical (canyonRnd is its own stream; the overlay only reads rings). Forcing
type + snapping placement reshuffles canyon LAYOUTS → `canyonflow.mjs`'s bridged-split-pair pin moved
(8 → 9, its 3rd move — the test self-documents the re-pin) and `canyon.mjs`'s "multiple kinds" now samples
20km (a seed's first 9km can be all-flow near the aurora). `canyonframe` stays green (the snap-back is
granularity-safe). New `tests/auroraflow.mjs`; `aurora.mjs §6` updated for the 600/400 ramp + background-
rides-the-ramp + a non-aurora-seam-byte-identical guard.

**Leapfrog.** Fresh branch off master (PR #419 merged). Aurora Shallows now always delivers its flow run,
the seam dawns/dies smoothly at any speed, no desert, determinism accounted for. Owner taste-calls for the
preview: the ~60% flow share near the aurora (dial: the spine bleed span + segment count), the exit ramp
width (400 vs 450). Deferred bonus the Fable plan flagged: couple the flow chain's `slipMix` to the aurora
eruption ("hold the carve → the sky erupts over you") — render-only, a natural follow-up.
