# 2026-07-15 — "The eruption flashes and vanishes while I hold the chain" = the coupling sat below threshold

**Why.** Owner: the aurora eruption "flashes and disappears shortly after even though I've maintained my
flow chain." The flow→eruption coupling was supposed to make holding the carve keep the sky erupting.

**Diagnosis — trace the signal end to end, not the envelope.** The eruption fires when `act > 0.72`. The
coupling floored `act = max(actRaw, flowExcite × 0.9)` where `flowExcite = slipMix × auroraMix`. Following
the numbers: the flow slipstream is chain-driven (`slipTarget = 1 + 0.015·min(chain, 20)`, max 1.30) and
normalised by `slipRef = 0.015·20 = 0.30`, so at a **mid chain (~12)** `slipMix ≈ (1.18−1)/0.30 = 0.6` →
`act = 0.6×0.9 = 0.54`, **below the 0.72 threshold**. So a *sustained mid chain produced literally zero
eruption* — the only thing that ever crossed the line was `actRaw` (the rare natural drift) doing its own
thing, which blooms then fades. The owner's "flash" was the natural eruption; the carve wasn't contributing
at all until near-MAX chain (~16-20). **When a coupled effect "doesn't respond to the input the user is
holding," compute where the input actually lands relative to the trigger — the envelope/damping is a red
herring if the target never crosses the threshold.**

**Fix — remap so a MAINTAINED (not maximal) chain crosses the threshold and HOLDS.**
`flowAct = flowExcite < 0.02 ? 0 : min(0.96, 0.63 + flowExcite·0.35)` → onset at chain ~5, near-full by a
strong chain, and it *sustains* at whatever level the held chain implies. Two guards:
- **Cap the floor at 0.96 and clamp `e` to [0,1].** Raising the map means `act` can now approach 1; the
  eruption target is `1.4·smoothstep(e)` and the cubic `e²(3−2e)` goes NEGATIVE past `e=1` — so an unclamped
  `act>1` would *invert* the eruption. Clamp when you widen a range that feeds a smoothstep.
- **`flowExcite < 0.02 → 0` keeps it byte-inert** off the carve (act = actRaw), same as before.

A hold-sim (build to slipMix 0.6, hold 8s, drop) confirms: the eruption swells to ~0.55 and **holds for the
whole sustained stretch**, then afterglows down — vs. sitting at 0 before. Intensity still scales with chain.

**The general shape banked:** a "hold X → effect Y sustains" coupling needs the *sustained* value of X to
clear Y's trigger with margin, not just the *peak*. Map the input so the steady-state a player can hold
lands comfortably in the effect's active band; reserve the top of the input range for the effect's max, not
its onset.

**Leapfrog.** Fresh branch off master; the `0.63/0.35` onset+slope and the 0.96 cap are dials. Verify:
aurora.mjs 110 (a mid-sustained-chain-holds check), determinism byte-identical (render-only).
