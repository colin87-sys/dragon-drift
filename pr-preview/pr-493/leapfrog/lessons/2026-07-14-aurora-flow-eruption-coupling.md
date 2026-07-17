# 2026-07-14 — Coupling the flow carve to the aurora eruption ("the sky dances with you")

**Why.** With the flow run now guaranteed IN the aurora, the owner okayed the Fable plan's bonus: make the
sky ERUPT as you hold the flow carve — the run's momentum and the sky's dance become one signal.

**How — couple two heartbeats that already read the same signal at different ends.** The flow gates already
brighten with `slipMix` (the normalized chain slipstream), and the aurora already has an activity envelope
whose eruption blooms above `act 0.72`. So the coupling is tiny: `main.js` feeds `slipMix × auroraMix()` to
`setAuroraFlowExcite(k)`, and `applyAurora` floors the activity on it — `act = actOverride ?? Math.max(actRaw,
flowExcite × 0.9)` — with `flowExcite` **damped** (λ=2) so the eruption swells and settles with the carve
rather than snapping. Hold the carve to the chain cap → `act ≈ 0.9` → the full violet/pink eruption breathes
over you; release → it eases back to the natural drift.

**Two things that make it free and safe:**
- **Gate the coupling on `auroraMix()`** — it's 0 in every other biome, so `flowExcite` is 0 there and
  `act = actRaw` exactly → **byte-inert** everywhere but the aurora carve. Render-only (a uniform), zero
  determinism/perf cost; `gold-determinism` untouched. The same optional-channel discipline the whole aurora
  uses: multiply the new behaviour by a channel that's 0 in the shipped world.
- **Floor, don't replace.** `Math.max(actRaw, …)` means the natural activity drift still runs underneath;
  the carve only ever LIFTS it, and `?auract` (the debug pin) still wins via the `actOverride` branch.

**Gotcha banked (test-side, not code-side): match the function ARITY in the test.** `applyAurora(env,
playerDist, time, camera, dt)` — I first called it `applyAurora({auroraMix:1}, 3.0, 0.1)`, which silently
put `3.0` into `playerDist` and `0.1` into `time`, leaving `dt` undefined → `dtc` fell back to 0.016 and the
damped `flowExcite` crawled instead of converging, so the "carve lifts activity" assert failed for a reason
that had nothing to do with the code. When a functional test of a DAMPED value doesn't converge, check the
`dt` you're actually passing before touching the mechanism. (Also: a value damped over 60 steps lands at
~0.999994, not 1 — leave the assertion tolerance a hair loose, `> 0.88`, not `>= 0.9 - 1e-6`.)

**Leapfrog.** On PR #424 (the aurora-flow branch). The Aurora Shallows now: always delivers its flow run,
crossfades smoothly at any speed, and the sky erupts as you carve the flow. Owner judges the coupling
intensity (the 0.9 floor) on the preview — one-number dial.
