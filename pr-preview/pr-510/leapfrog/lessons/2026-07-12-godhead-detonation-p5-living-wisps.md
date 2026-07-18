# THE GODHEAD DETONATION — P5: the living wisps (the apotheosis completes)

**What we did.** Added the LIVING WISPS to `bossUnmasked.js` — ~14 small tapered flame-tongues licking
off the crown + upper-wing perimeter (owner §1.3, the last-sequenced but non-cuttable carrier). ONE
merged additive draw IN FRONT of the silhouette plane, vertex-faded to black at every edge/tip, gated
on `igniteK` (rises with the wreath, mutually exclusive with the void). A tiny `ShaderMaterial`:
`prof` (emerges from the wing, dies to black at the tip) × `edge` (soft sides) × `flow` (tendril
scrolls outward, `sin(t·12 − uTime·3)`) × `flick` (a SLOW `sin(uTime·0.8)` per-wisp flicker — living
flame, never a strobe), gold-rose → S2 violet tip. Layer 1 (additive in the heaven — out of the ray
mask + water mirror), placed on the UPPER arc only (5°→175°, crown + wingtips), never the down/corridor
column. Rides + reverts on the same ignite branch as the mandorla → the P3 asserts extended mechanically.

**The reuse win — P2's shader spine is now a 3rd-instance template.** The wisp material is the SAME
`prof·edge·flow` additive-tongue shader as the detonation streaks (P2) and the roiling mandorla (P3),
re-parameterized: streaks are huge/eclipse-baked/behind the boss; wisps are tiny/wing-anchored/in front.
Three uses, one pattern (merged additive geometry + a `uTime`/`uOpacity` uniform pair + vertex-faded-to-
black edges). **When a spectacle needs "the same substance at three scales," author the shader once and
vary the geometry + the uniforms — not three bespoke materials.** The `flick` term is the only new idea:
a slow (< 1 Hz) brightness sine reads as "alive" without the strobe a fast one would cause (danmaku law).

**Sparse-by-construction keeps the sky p95 gate.** Thin tapered tongues (width DISC_R·0.085, 3 segs,
faded to black on 3 sides) cover almost no bright area, so at `WISP_MAX 0.85` they add "alive" motion on
the crown without moving the sky-band p95 (0.849, gate 0.90 — the earlier 0.866 reading was live-fight
noise, not the wisps). The additive fill-rate tax (the void-legibility lesson) is paid in AREA, and thin
tongues have almost none — the same reason the P2 streaks were affordable.

**Verify.** `unmaskedarena` 55 (the heaven ignite + S2-pin asserts extended with `wispVis`): wisps true
in the heaven / false off it; corridor p90 0.376 / p50 0.130, sky p95 0.849 / p50 0.465, loop 90.9% —
all under gate. `boss` 126 (wisps hidden off-heaven → the unmasked archetype's 18 visible draws are
unchanged at rest; the wisps + aura only draw in the settled heaven). `unmaskedorgans` green (the wisps
are a rig visual, not an organ anchor — wing angles frozen, wingEyes unmoved). Owner preview: fine
gold-violet tongues flickering off the crown/wingtips of the dark, aura-wreathed seraph at the heart of
the perpetual blast.

**What it unlocks — the apotheosis is complete.** All five carriers ship on one coexisting, exhaling,
tier-degrading spine: P1 ignited palette · P2 perpetual detonation · P3 ignited seraph · P4 debris
conveyor · P5 living wisps. Every phase is mix-0 byte-identical, exhales with the natural-kill fade, and
hides at tier 2 (the palette + firmament carry the identity on weak mobile). The remaining work is pure
owner taste-tuning on the PR preview — the fairness floor holds at every dial (RIM/GLOW/WISP maxima,
loop vigor `uFlow`/`uRing`, debris density are all one-line levers). The FF7 Safer-Sephiroth STYLE now
lives fully in our indigo+gold+S2-violet identity, under our fairness rules.
