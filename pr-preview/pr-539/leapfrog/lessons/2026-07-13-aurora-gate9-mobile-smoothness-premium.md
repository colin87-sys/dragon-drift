# 2026-07-13 — Aurora Gate-9: getting the richness to MOBILE, killing the pop, premium lines

**Why.** Owner flew the shipped biome on MOBILE and gave three specific notes + a "make the whole run
dreamier" ask: (1) the irregular thick-band VARIATION doesn't read in the MIDDLE on mobile; (2) as you
fly, lines "occasionally disappear or are erratic" — transitions must be smooth/gradual; (3) the lines
"don't quite read as premium." A Fable art-composition pass produced the spec; this is the build.

## The core discovery: the richness was TIER0-ONLY, so mobile never saw it
Every parallel-breaking / irregularity term the earlier gates added was gated `if (uAurLayers == 2)`
(tier0). On tier1/tier2 (weak mobile) the bands fell back to azimuth-only knots and NO height-warp — i.e.
exactly the evenly-spaced parallel stripes the owner had already rejected on desktop, now shipped to the
phones. **A quality tier that strips the very feature the design is ABOUT isn't a graceful degrade — it's
shipping the rejected version to the majority of players.** The fix wasn't "spend more evals on mobile";
it was to re-derive the same SHAPE from noises mobile already computes for free.

### Reusable techniques (all +0 evals — the eval table stayed 8/3/3 across tier0/1/2):
- **Found money: audit for DEAD work at the low tiers.** tier2 computed a full ray-noise eval that was
  then multiplied by `uAurRay = 0` everywhere — 100% dead, ×2 for the mirror. Gating `rn` on
  `uAurRay > 0.5 && (L==0 || uAurLayers==2)` reclaimed it and funded tier2's REAL 2D height-warp fork
  noise. **Before adding cost to a tier, grep it for a term whose result is masked to zero — you often
  already own the budget.**
- **A noise warp can be replaced by an ANALYTIC one with the same STRUCTURAL property.** The Gate-7 law is
  "the domain warp must vary with ELEVATION to break parallelism" — it never had to be *noise*. tier1 gets
  `warpF = (fold0-0.5) * sin(hy*4.5 + (foldOct-0.5)*5.0 + phase*0.02)`: azimuth-varying amplitude + phase
  make each ribbon bend differently, and where `sin`'s slope beats the base band slope the field folds =
  a real fork. ~4 ALU, 0 evals, from noises already in hand. **When you can't afford a noise eval, ask
  what analytic function shares the one property that matters.**
- **Derive along-band variation from the field COORDINATE, not a fresh sample.** tier1/2 knots became
  `bn = 0.25 + 0.75*(0.5+0.5*sin(bp*2.5 + foldOct*7.0 + fold0*3.0))` — a smooth function of the band
  parameter `bp` itself, so adjacent ribbons decorrelate (period ≈ 0.74 bands) and the knot slides ALONG
  each band, all free. Floor 0.25 so a faded band never hits zero (feeds smoothness).
- **Give mobile the second thick band ray-LESS.** Split the "richness" flag (`uAurLayers`, still tier0)
  from the "band count" (`uAurBands` = 2 tier0/tier1, 1 tier2) so the loop runs twice on tier1 but the
  secondary band's rays are gated off (`rOn = uAurRay * (L==0 || uAurLayers==2 ? 1 : 0)`), and its fold is
  a free anti-correlated remix of the shared folds → a deliberately CROSSING curtain, ~0 evals.

## Smoothness: "lines disappear / erratic" was THREE separable temporal bugs
- **The `fract` seam was a moving cliff.** `bprof = smoothstep(0,0.08,fp)*exp(-fp*k)` ended each period at
  `exp(-k)` ≈ 0.05–0.25, then HARD-dropped to 0 at the wrap. As `bp` drifted with phase/fold/warp that
  residual cliff swept across the sky as a hard edge — and near fork points the field gradient → 0 so the
  level-set VELOCITY → huge and it *jumped*. Fix: `* smoothstep(1.0, 0.82, fp)` fades the tail to zero
  BEFORE the seam (both sides 0, crisp bottom kept). **A `fract()`-based pattern that's static in stills
  can still pop in motion — any discontinuity in a drifting field is a moving artifact. Feather both ends.**
- **Warp/knot drift was too fast at pinch points.** Halved both phase rates (0.045→0.02, 0.04→0.02) so a
  fork evolves over ~50s — static within any glance.
- **Rays STROBED during yaw.** A fast turn slews the ray coordinate `u` through ~16 noise cells/sec and the
  `sin(phase*2.6 + rn*50)` shimmer turned that into full-depth flicker. Two fixes: de-strobe the shimmer
  (`rn*50 → rn*9`, `phase*2.6 → phase*1.7`, boil `0.7 → 0.35`), and a JS **turn-calm** envelope —
  measure the stage's angular slew and ease `uAurRayMix` 1→0.35 (a FLOOR, never 0) while turning, so rays
  SOFTEN into the smooth sheet instead of strobing, and ease back when settled. Rays brighten-into-band,
  nothing vanishes. **When motion makes fine detail flicker, don't just lower its frequency — fade the
  detail toward its own low-frequency envelope while the motion is fast.**
- **A runtime tier flip would restructure on-screen.** The perf governor dropping `uAurLayers 2→1`
  mid-run deletes bands/rays in one frame — a literal "lines disappear." `qualFade` (JS) dips the whole
  curtain to 0 on a tier change and damps back over ~1.2s, so the restructure happens while faded down
  (the godhead tier-hysteresis lesson, applied to the aurora). `damp(qualFade,1)` = 1 when unchanged →
  byte-identical in non-aurora biomes.

## Premium & dreamy (cheap, additive-luminance where the eye ranks it)
- **Two-scale border glow**: `1 + (1.8*hot + 0.45*exp(-8*bt))*below` — a tight 28-decay core UNDER a soft
  8-decay feather reads as bloom off the hot line with no post-FX.
- **Ray core/halo profile**: `(0.24 + 0.42*rn + 0.50*rr)` — a wide linear lobe under a squared core =
  luminous falloff, not a bar; deeper gaps read cores brighter for free.
- **Knot bloom**: extend the split-gain threshold to the thickest along-band knots
  (`max(hot*below, clamp(bprof*bn²*1.6-0.45,0,0.8))`) → jewel points along every ribbon (the Gate-8 law:
  additive luminance is what the eye ranks; a `mix` alone never reads "premium").
- **Activity-keyed crawl** (JS): accumulate phase at `dt*(0.7+0.6*act)` instead of `time%4096` — quiet
  drifts stately, an eruption visibly quickens, so MOTION tells the activity story. Uses RAW `dt` (0 when
  the montage freezes via `timeScale=0`) so frozen captures stay pinned — the phase accumulator was the one
  place a real-`dt` default (`dt||0.016`) would have leaked motion into a "frozen" shot; kept `dtc` for the
  damping terms, raw `dt` for the accumulator.
- **Breathing horizon airglow**: the sea-line oval (+ its mirror) inhales with `uAurBreath` (mean
  unchanged) — sky and sea swell together.

## Verify (the harness must drive the states the player flies in)
Two new tools: `tools/aurotier.mjs` (per-TIER montage — proves forks/knots read centre-stage at tier1 AND
tier2, and the shader compiles at every tier branch) and `tools/aurmotion.mjs` (tier1 LIVE-motion filmstrip
with a forced mid-strip yaw — proves bands stay continuous frame-to-frame, no wink/pop/strobe). The
frozen-montage blind-spot lesson generalizes: a smoothness bug is invisible to any tool that captures one
frozen frame, so the smoothness test had to capture live motion. aurora source tests 82→92 (10 Gate-9
checks incl. the tier truth table now asserting `uAurBands`); gold-determinism / biomecycle / markers green.

**Leapfrog.** On PR #413 (post-#411-merge). Aurora Shallows now reads rich + irregular + smooth + premium
on the WEAK-mobile tiers, not just tier0. Remaining: **PR-4 THE FLIP** (`CYCLE=[0,1,2,3,4,6,5]`) into the
live rotation — the last step, an owner decision. Plan: `reforged/AURORA-SHALLOWS-PLAN.md`.
