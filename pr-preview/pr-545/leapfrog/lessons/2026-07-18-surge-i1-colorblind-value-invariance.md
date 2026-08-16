# 2026-07-18 — SUNBREAK I1: colorblind-safe Surge = value-first, roster-invariant depth

**Did / learned.** The owner is COLORBLIND and can't judge the hue/temperature dials the
world-suppression grade exposes — so we spawned a harsh Fable critic as the owner's COLOR-EYE
PROXY (judge the colour taste the owner delegated + verify a hue-blind accessibility property).
It rendered all three surge captures to true greyscale and confirmed the transformation is
VALUE-FIRST: subject-vs-surround luminance ratio jumps **1.28× (cruise) → 2.23× (surge)**, sky
drops to 0.43×, and two hue-free cues (the **starfield revealing** in the darkened sky, the
vignette) survive greyscale. The violet/amber shadow-pooling is decoration ON a legible value
structure — nothing *depends* on hue. That's the right architecture and it's what makes the
CORE→BLOOM→DARK value law an accessibility win, not just an aesthetic one.

**The must-fix it caught (a real defect, not taste).** Suppression DEPTH varied by dragon
identity: the fire dragon's warm sky-shift kept its Surge sky bright (~0.92× baseline) while the
eclipse hero's dropped to 0.43×. **Surge is a gameplay STATE — its value-read must be
roster-invariant**, or a colorblind player mains a dragon whose power-moment reads measurably
weaker. Root cause: the warm ember sky-shift's target colour was BRIGHT ([1.0,0.52,0.20]), so it
*lifted* the sky's value while trying to warm its hue. Fix: **identity lives in HUE, not in how
much the world darkens** — darkened the ember target ([0.46,0.22,0.07]) so the warm sky steps
DOWN in value like the eclipse's, hue preserved. Result: phoenix sky-drop 0.92× → **0.582×**,
now matching solar's 0.43× (both ≤0.6× target), warm identity intact (shadows R>G>B, sky R−B
+46). Added a `TSKY` sky-drop metric to `surgemeasure.mjs` to lock the invariant.

**Gotcha (measurement).** Single-frame world-median metrics (T4) are NOISY — the flight scrolls
the biome between captures, so the flank-median lands over water vs. structures depending on
position (solar 0.556 vs phoenix 0.895 in one pair, both fine). The STABLE roster-invariance
metric is the **sky-drop ratio** (the sky is always the sky) and the **subject/surround value
ratio** (the critic's 2.2× both). Judge invariance on stable regions, not scroll-dependent ones.

**→ Systematize.** Two reusable rules: (1) **For a colorblind-inclusive game, any gameplay-state
FX must carry its read on VALUE + SHAPE + POSITION, with hue as decoration** — verify by
greyscale-rendering the capture and asking "does the state still land?" A Fable color-eye-proxy
spawn is the way to make hue-taste calls (and this accessibility check) when the owner can't.
(2) **A gameplay state's intensity must be identity-INVARIANT on its legible channel** — put
per-dragon identity in the hue/decoration axis, never in the depth/strength axis that signals the
state. The `TSKY` gate (world ≤0.77×, sky ≤0.6× for EVERY dragon) enforces it.

**→ Leapfrog.** This makes the whole SUNBREAK roster pass safe by construction: every dragon's
`surgeDark` supplies a hue, but the suppression DEPTH is one shared, value-invariant grade — so
I5's per-dragon accent pass only varies hue/flourish, never the power-read. And it means I2's
ignition cascade should likewise carry its "the dragon is now the light source" read on VALUE
(emissive luminance climbing) first, hue second — so it lands for this owner in greyscale too.
