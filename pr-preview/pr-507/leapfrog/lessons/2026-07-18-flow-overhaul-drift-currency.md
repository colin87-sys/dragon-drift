# 2026-07-18 — The "it doesn't flow" fix is a DRIFT currency, not more content

**Did / learned.** Ran a Fable-directed pipeline (6 research agents — 3 code audits + 3 external
game-design studies — → Fable gameplay-director synthesis → harsh Fable critic that fact-checked
the plan against the shipped code) on the owner's "14 bosses, 2 runs, but it doesn't FLOW"
problem. Output: [`reforged/FLOW-OVERHAUL-PLAN.md`](../../reforged/FLOW-OVERHAUL-PLAN.md).
The diagnosis, code-grounded: the game already built its best flow system — the `canyonSlip`
co-scaling pump — and then **locked it inside occasional FLOW canyons**. The connective ~80% of
the run has no momentum thread because **`combo` is score-only** (never touches
`player.speed`/FOV/camera; `rings.js:183-215`, `player.js:209-218`) and **boost is a net-negative
bleed** (drain 20/s vs ~10–16/s ring income; full bar = 5.5 s; `config.js:36`). So the run is
isolated set-piece spikes separated by valleys where the game *confiscates* momentum. The cure is
one always-on currency (**DRIFT**) fed by every verb, manifested as world-speed + FOV + streaks,
that **bleeds but never zeroes**, amplified (not reset) by every set-piece.

**The critic earned its keep** — it corrected the director in ~1/3 of the plan by *reading the
files*: (a) a global speed multiplier **already ships** (High-Winds daily mod `mods.speed:1.12`,
`daily.js:20`→`player.js:213`) with zero geometry divergence, so "does variable speed break the
deterministic course?" is ~80% pre-answered — **the course is DISTANCE-indexed** (`level.js:468`,
`while(prev.dist<target)`); (b) `difficulty()` is NOT flat (distance-ramp + forever +0.25 tail,
`level.js:174`) — the plateau is the *time* speed-ramp, a different system; (c) the ribbon-orb
"contradiction" is mostly already fixed in code — what's missing is the HUD; (d) the wind-run's
"rise to bank altitude" has only **~13 usable metres** (envelope y∈2.5–22, `config.js:5-6`) so a
full dive lasts <1 s → shelve until a raised-ceiling envelope exists; (e) boost-disable-in-boss
(`player.js:127`) is a deliberate mobile UX call (frees the 2nd finger for the Surge tap), so
re-enabling it re-tunes every volley across 14 bosses → cut.

**→ Systematize.** Two reusable patterns. **(1) The verb-audit lens:** a game "doesn't flow" when
its verbs feed *disjoint* rewards across gaps — audit every verb for "what persistent currency does
this feed, and does that currency survive the gap to the next beat?" If the answer is "a score
number that resets," that's the disjoint-dodging disease. The cure is always a single bleeding
momentum currency that every verb feeds and every set-piece amplifies (Tiny Wings/Alto/OlliOlli
law). **(2) The director→critic pipeline for design plans:** a synthesis agent writes an opinionated
plan, then a *separate harsh critic agent fact-checks it against the actual code* before anything is
built. The critic caught misread line numbers, redundant "build X" items where X already ships, and
a 60fps landmine (a ~20 s mini-boss cadence = constant rig build/teardown). **Route the currency off
the existing `emit(...)` event bus** (`rings.js:229`, `main.js:1764`, `collision.js:317`) — one new
subscriber module feeds it with zero edits to any emitter — and apply it as a **second factor in the
`canyonSlip` co-scale chain** (`player.js:27-31,165-167`), never a parallel speed path, or the
reach-audit fairness-by-construction silently breaks.

**→ Leapfrog.** Unlocks the whole roadmap on rails that already exist (~200 lines): once DRIFT is the
connective thread, the "wind run" becomes updraft-pockets-that-feed-DRIFT (S, in-envelope) instead of
a new subsystem; the 6 empty biomes get hazards that must be **dodged in space, never in time** (the
geyser-law, now stated as a positive design rule); and bosses stop *confiscating* the ride and start
*amplifying* it (fly the hoop-chain = chip + DRIFT via the already-imported `spawnBossRingHoop`,
`boss.js:27`). Build DRIFT behind a `driftEnabled` flag, prove on the daily-seed hero run with
`flowmeter.mjs` + a new dual-input-profile determinism test + a collision-tunneling check at the
~139 m/s stacked-speed worst case, then migrate.
