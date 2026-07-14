# GODHEAD DETONATION — premium P1: FBM turbulence (vector-art blast → molten fire)

**What we did.** The owner (correctly) called the shipped detonation flat for a final boss: streaks were one
low-frequency sine (smooth neon ribbons), the corona was a dead radial ramp (the richest zone in the FF7
reference was the flattest here), rings were clean compass circles. P1 adds a **texture-free FBM** to the
detonation shader (`arenaSet.js` `DET_FRAG`) and rewrites all three animated branches around it:
- **Streaks** — RIDGED veins `pow(max(0, 1 − abs(2·fbm − 1)), 2.2)` at higher frequency → thin bright
  fibers with dark gaps between, scrolling outward (each wide streak reads as multiple molten strands).
- **Corona** — new `aType 3` with baked `[radial t, angle fraction]` uv; a **domain-warped** FBM (`n²`)
  → bright molten cells + dark cracks that scroll outward. The flat glow is now a churning substrate.
- **Rings** — angle baked into uv.y; `fbm²` filaments the wavefront so it's not a clean ring.
The noise: sin-free Dave-Hoskins `hash21` → value noise → ≤3 octaves, `uOct` uniform as the tier dial
(3/2 at tier 0/1). New uniforms `uOct`, `uRoil`. **0 new draws, 0 new tris** — richness is ALU, not geometry.

**The headline lesson — detail must be HIGH-CONTRAST to survive bloom; soft turbulence reads as haze.**
The first pass used low-frequency FBM with soft mid-tone output. It looked WORSE — big soft blobs that the
composer's bloom (threshold 1.0) smeared into a uniform haze, LESS defined than the original ribbons. The
fix was **higher frequency + a sharpening curve** (`n²` for cells, ridged `pow(…,2.2)` for veins) so the
darks stay DARK: only the thin filament cores exceed the bloom threshold and glow, the gaps read as
structure. **On a heavily-bloomed additive layer, contrast (dark gaps between bright cores) is what makes
detail legible — a mean-grey noise field just blooms to fog.** Bonus: the dark gaps also LOWERED the sky
band luminance (p95 0.872→0.837, p50 0.477→0.452 vs the soft pass) — crisp fire is cheaper on the fairness
gates than soft haze.

**Fairness stayed mean-preserving by construction.** The FBM multiplies the *baked* vertex colour, so the
eclipse annulus, down-hemisphere suppression, and the D1a gold→violet gradient are untouched; only the
value TEXTURE changed. Corridor p90 0.357 / p50 0.141, sky p95 0.837 / p50 0.452 — all under gate.

**NaN law honoured (the hotfix lesson).** Every `pow` base is `max(0.0, …)`-clamped (the ridge
`1−abs(2n−1)` and the ring `sin` both go epsilon-negative at edges); the hash uses only `fract`/`dot`
(no `pow`/`sin`/`sqrt`/`log`) so it cannot emit a NaN. Kept highp (no `precision mediump`).

**Verify.** `unmaskedarena` 55 green (loop alive 91.8%, gates above). Stills read only incrementally
richer — the churning/scrolling MOTION is where the fire lands, so this is an owner-**motion**-preview
judgment (the software-renderer still undersells it, and — per the hotfix lesson — a real-GPU preview is
mandatory for any shader change). Next: P2 (rim-lit molten rocks — tangible detail) + P3 (ember layer).

**Reusable.** The `hash21`/`vnoise`/`fbm` trio + the "sharpen with n² or a ridge, never ship mean-grey
noise into bloom" rule is the template for every future procedural-fire surface in this repo.
