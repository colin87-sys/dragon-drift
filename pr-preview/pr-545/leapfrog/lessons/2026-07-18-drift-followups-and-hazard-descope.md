# 2026-07-18 — DRIFT follow-ups + hazard de-scope: the adversary audit earns its keep again

**Did / learned.** Ran the three FLOW-OVERHAUL follow-on threads (DRIFT systems/timing/boss,
the DRIFT HUD meter, the biome hazard pass) through the parent plan's design→adversary-audit
pipeline and wrote up the reconciled results (`reforged/DRIFT-BUILD-PLAN.md`,
`reforged/HAZARD-OVERHAUL-PLAN.md`). The pattern held for the third time running: **the
critic pass caught ~⅓ of each draft** — and, better, surfaced **two bugs that ship TODAY
with no DRIFT at all**: (1) the fatal gate is the game's only unswept lethal test
(`collision.js:171` per-frame overlap, 5.4 m window, vs the plane-swept rings at
`rings.js:145`) — at the already-reachable 121 m/s a 20 fps frame out-jumps the window and
the gate becomes an ~11% skip lottery; (2) boss entry wipes obstacles with a CONSTANT
`clearAhead(player.dist + 800)` (`boss.js:1869`) against a SPEED-SCALED spawner lead
(`speed × 7`, `main.js:281`) — crossover 114.3 m/s, so fast entries leave decorative
crystal walls standing inside the "clean arena" (the owner's reported bug; fix is
`clearAhead(Infinity)`). Also learned "6 empty biomes" was really **3**: Aurora is
hazard-suppressed by its guaranteed flow run, Mire is the ratified breather, Lagoon has no
hazardFirstAt floor, and Tempest isn't even in CYCLE (`biomes.js:328,475`) — half the
proposed content had no player to meet it.

**→ Systematize.** Four generalizable classes:
1. **The unswept-gate class:** ANY per-frame overlap test on a lethal object is a latent
   speed bug — audit every `Math.abs(dz) < r`-style lethal check whenever a speed ceiling
   moves, and a swept fix must resolve ALL outcomes (thread/phase/crash), never just the
   kill.
2. **Constant-vs-scaled pairs:** grep for constants that race a speed-scaled counterpart
   (the 800 vs `speed×7` pattern). Any `clearAhead(dist + K)` facing a `max(K2, speed×T)`
   lead is a crossover bug waiting for a faster game.
3. **The determinism-stream landmine:** a "deterministic" RNG stream that only consumes
   draws conditionally (`level.js:602-617`) reshuffles all downstream placement when a new
   consumer appears upstream — and a fixture that doesn't cover the output array
   (`out.hazards` is non-fixtured, `level.js:622`) can't catch it. Rule: per-block streams
   (`mulberry32(seed ^ CONST ^ blockIndex)`) + fixture every output array you claim is
   deterministic.
4. **Audit before authoring:** the design→adversary-audit pattern (director proposes,
   code-grounded critic fact-checks, the RECONCILED verdict is what gets written down) has
   now paid ~⅓ corrections on four plans. It's the process, not a luxury — and the write-up
   must record the post-audit verdict, never the pre-audit proposal.

**→ Leapfrog.** The swept-gate fix + the governor make the ×1.15 DRIFT cap safe to build,
which unlocks the whole parent shortlist; the per-block hazard streams make *every* future
biome hazard a no-reshuffle drop-in (the 5-PR lineup, then Drowning Veils/Sporelung when
their gates exist); and the accidental boss-crystal survivors pointed at a real authored
beat — the flag-gated Surge-shatter crystal-veil boss card — that we'd never have designed
without first killing the accident.
