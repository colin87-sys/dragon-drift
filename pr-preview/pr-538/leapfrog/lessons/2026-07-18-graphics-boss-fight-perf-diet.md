# Boss-fight perf: an ADAPTIVE atmosphere "diet" that only fires on a struggling device (Rung 1)

**Context:** Tempest boss fights dipped on the owner's phone (avg 48, p95 47ms, min 20fps) at the quality
floor (tier 0, dynres res 0.45) — GPU FILL-bound (`gpu 48ms` vs `sim/draw 2ms`). The owner wanted the dips
fixed **without compromising attack patterns or difficulty**, AND **only on devices that can't handle it —
desktop/capable phones must keep the full storm** (not be "punished"). Fable gated the plan; this is Rung 1.

## The architecture — a rung BELOW resolution, ABOVE the feature-tier drop

The frame is fill-bound and the SIM is nearly free (`sim 0-2ms`) — so every lever is draw-side and provably
invisible to gameplay. The heavy boss frame is the heaviest biome (Tempest) + boss + bullets stacked; the two
biggest DISCRETIONARY fill costs are both atmosphere, both EXTRA SCENE PASSES:
- **Lever A — water reflection:** the `Reflector` mirror re-renders the whole scene into a mirror RT (~30k-tri
  pass) every duty-cycled frame.
- **Lever B — god-ray mask:** renders scene geometry AGAIN into a mask RT (1/3 frames) then a radial march.

**The gate (the key design):** the resolution governor already exposes the exact seam — at its floor it
returns `owned:false` and hands off to the tier controller (`resGovernor.js`). The diet may only claim a frame
the governor has **already disowned at the floor**. Engage condition: `bossEncounter && dynRes at floor
(resGov.idx === last) && medFps < degradeAt`, sustained 1.0s (> RES_DWELL 0.7 so resolution always trims
first). **A capable device never trims to the floor → the diet is structurally unreachable → boss-Tempest is
byte-identical to today.** Desktop is never punished, for free, by construction — no explicit "is desktop"
check needed. (Do NOT gate on `capFps>70` "capable": a phone that briefly peaked stays capable ~16s and would
wrongly skip the diet while genuinely stuck at the floor. The floor-reached signal is the correct one.)

**One-way latch per fight:** engage once, never restore mid-fight (a mid-combat brightening pop is the worst
moment, and a device that recovered only because the diet is on would immediately dip again = an oscillator).
Release at `bossEnd`/`bossDefeated` — the FELLED full-screen wash masks the storm's full return (part of the
kill reward). Graded: Rung 1 = A + B; Rung 2 (rain/sea/halo, a follow-on) only if still slow after +1.5s.

## Rung 1 levers (this PR)
- **A (water):** a diet-only `setWaterMirrorDiet(on)` skips the mirror `onBeforeRender` (distinct from the
  god-ray's transient `_reflectSuspended`). Reuses N11 half-rate freeze semantics (stale RT + stale matrix →
  no swim). **Chosen over a reflective→analytic REBUILD deliberately:** the diet engages ~1s INTO the fight,
  where a mesh rebuild would pop mid-combat (a Fable fail condition); a frozen matte storm mirror at 0.45 res
  is imperceptible (Fable: "no readable mirror image there anyway").
- **B (god-rays):** `setGodRayDietDim(0.4)` (eased ~1s crossfade) + `setGodRayMaskDuty(6)` (1/3→1/6). The DIM
  licenses the slower duty — a full-strength shaft updated 1/6 as often would swim; a faint one hides its own
  staleness.

## Verification (headless)
- **Lever B proven numerically:** forced diet vs control, god-ray `uIntensity` `0.1283 → 0.0532` (= the 0.4×
  dim, crossfade settled). `?bossdiet=1` forces engage / `?bossdiet=0` disables — the clean A/B controls.
- **Sim untouched:** `gold-determinism` byte-identical (draw-side only; level + bullet gen unchanged).
- **Look holds:** diet-on device-exposure frame still reads unmistakably "Tempest storm" (Fable's bar), with
  quieter shafts + matte sea → *better* bullet contrast.
- **Gotcha:** `renderer.info.render.calls` reads as 1 headless because the composer's LAST sub-pass is what's
  left after the frame — it is NOT a per-frame total through a composer. Verify pass-skipping via a uniform or
  `autoReset=false`, not the raw counter.

## Reusable
- **Adaptive quality that respects capable hardware: hang the new cut off the resolution-floor `owned:false`
  handoff.** "Device reached the floor and is still slow" is the honest struggling-device signal; capable
  devices never reach it, so they're excluded for free — no device-class sniffing.
- **Latch perf cuts per-encounter, engage-masked / disengage-masked.** The engage can hide under a crossfade;
  the disengage hides under an existing full-screen event (here the FELLED wash). Never restore mid-tense-beat.
- **Fill-bound? cut the extra SCENE PASSES first** (mirror, mask) — they're fixed costs dynres can't shrink,
  and often the least-watched pixels during the exact moment you need the budget.
