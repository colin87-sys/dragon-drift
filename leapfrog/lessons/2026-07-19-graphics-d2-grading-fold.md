# Graphics D2 — the grading fold: tonemap + grade in ONE pass (MOBILE-GRAPHICS-DIET rung 1)

**What we did.** Landed D2 of the mobile graphics diet (`reforged/MOBILE-GRAPHICS-DIET.md`,
converges with GRAPHICS-PERF-PLAN F4): the tonemap (`OutputPass`) and the grade/vignette/
dither (`GradingShader`) were TWO full-screen passes at the tail of the composer — a
full-frame store + reload of the multisampled HalfFloat RT every frame on every device,
for zero look. They are now ONE fused `OutputGradePass` (default), with `?gradefold=0`
restoring the shipped two-pass chain as the A/B / refutation control. New
`tests/gradefold.mjs` proves structure AND pixels; `stamp-sw` rerun.

**What we learned.**
- **The fold is free in look and real in bandwidth.** Pixel A/B of the SAME frozen frame
  through both chains: maxΔ = 1/255 with ~94% of pixels byte-identical (900×640 hub) —
  the residual 1-LSB flips are the *removed* HalfFloat quantize of the old intermediate
  RT, i.e. the fused path is sub-LSB MORE precise, never different math. On the old
  chain the `OutputPass` hop wrote into a 4×-multisampled RT — so the fold deletes a
  full-frame MSAA store+resolve+reload, not just a texture read.
- **Byte-target identity across a fold needs per-tap encode.** The grading pass sampled
  the *encoded* intermediate at 3 chromatic-aberration offsets. The fused shader must
  tonemap+sRGB-encode EACH tap individually (`outputEncode()` per tap), not encode once
  after assembling the CA split — otherwise CA frames diverge from shipped.
- **Share the GLSL, don't copy it.** Both pass shapes are assembled from the same
  template strings (`GRADING_PARS/CA/MATH_GLSL`), token-identical to the shipped shader
  (verified against `git show HEAD`), so the A/B seam can never drift from the default.
- **Port the vendored define-cache verbatim — including the repo's patch.** The fused
  pass rebuilds its tonemap defines off the LIVE `renderer.toneMapping` each render
  (the vendored `OutputPass` idiom) *including the `CUSTOM_TONE_MAPPING` branch* — the
  exact N3 trap (#373) where `?tm=neutral` silently shipped untonemapped.

**The gotcha.** `tests/run-all.mjs` was dead on arrival at HEAD: `_diag-rock-caps.mjs`
(header: "DIAGNOSTIC, not a CI gate") boots the game, finds zero rock sections because
shipped config disables rock runs (`canyonTypeWeights rock: 0`), and exits 1 — killing
the whole suite at the FIRST script. run-all now skips `_`-prefixed scripts (the same
scratch convention `tools/` already uses). If your suite has been green forever, check
that it actually *runs*.

**The reusable pattern.** Folding two tail passes: (1) keep the uniform-owning object at
the same handle (`postfx.gradingPass` points at the fused pass — `setDither`,
`updatePostFX`, and the settings tests drive it unchanged); (2) prove identity with the
frozen-frame in-page A/B — stub `requestAnimationFrame`, render the same state through
both chains, `toDataURL` in-task, diff in a 2D canvas — no cross-boot determinism
needed; (3) assert the shared-GLSL structure in a source guard so the refutation control
stays honest.

**What it unlocks.** The diet ladder's next rung, D1 (deviceClass-scoped composer MSAA
desktop 4 / mobile 2, set ONCE at boot; 2→0 only via the dynRes STAGES ladder) — the fold
was ranked first because it spends zero look; everything after it spends *something* and
must be A/B'd on-device (`?debug=perf`, Tempest boss + Aurora Shallows cruise).
