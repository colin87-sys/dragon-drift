# Premium heaven horizon — fog the sea toward the BLAST, and gate the mix so other biomes stay byte-identical

**What we did.** Owner: the heaven sea/horizon "seems flat with a 2nd layer to kinda transition — cheap and
tacky. This needs to be PREMIUM!" A Fable pass diagnosed it and it's the ROCK lesson replayed on the sea.

**Diagnosis — the "cheap 2nd layer" is two flat cardboard bands with a hard value seam.** In the settled
heaven the sea is fogged by the water shader's own manual fog to the LOCKED violet (`fogFarColor 0x352b52`,
`fogFar 340`) — so the whole bottom third beyond ~340m is ONE flat violet. Directly above it, the dome's gold
galactic-plane band (`skyHorizon 0xa87838`). Gold plate / hard seam / flat violet plate = cheap. And the only
"sea answers the blast" was the thin `pow(…,240)` specular glitter stripe — nowhere near the scale of a blast
filling the sky. This is exactly *"aerial perspective toward the WRONG colour is worse than none"* (the rock
scene-integration lesson) — except the sea can't opt out of fog; it must be fogged toward the **blast's**
colour where the blast is.

**The fix — a graded blast-haze horizon + a broad reflection column + the shared heartbeat** (all in the
water fragment, one new weight `uHeavenGlow` driven from the already-computed `heavenSunK`, 0 off-heaven):
1. **Graded haze horizon** (kills the seam): compute `az = pow(clamp(dot(viewAzimuth, sunAzimuth),0,1), 3)` —
   how aligned the view is with the blast-steered sun — and re-target the FAR fog toward a warm umber
   `uHorizonCol 0x9a6242` (one tier BELOW the dome's gold) by `fogF²·uHeavenGlow`. The far sea now grades
   continuously UP into the gold band *under the blast*, cooling to the locked violet toward the edges — an
   atmospheric gradient, not two plates; the fogged plane-edge seam dissolves because its terminal colour
   finally matches what's above it. `fogF²` keeps the near/mid sea (the parry field) untouched.
2. **Reflection column as radiance, not glitter**: add a broad `pow(dot(Ns,H),18)·GAIN` gold lobe under the
   detonation — the sea-scale answer to the sky-scale light (the 07-14 sun-steer put `sunDir` on the blast;
   this gives that steer something worth reflecting). **GAIN is a FAIRNESS dial, not just taste:** the column
   sits directly in the parry corridor (the vertical strip under the blast where the sea reflects it toward
   the eye = the dodge zone). At gain 0.5 the corridor p90 probe jumped 0.382→0.656 (still ≤ 0.75, but tight,
   and `breath` oscillates the peak ±35%); pulled to **0.35** for headroom. Lesson: a reflection tied to the
   scene's key light lands *where the light is*, which in a top-down boss frame is the play field — check the
   corridor probe, not just the sky probes, whenever you brighten the sea.
3. **Shared heartbeat**: `breath = 0.85 + 0.3·sin(2π·time/4.6 − dist·0.004)` — the detonation's 4.6s expansion
   front propagated across the sea with a distance lag. Glow column + horizon swell as each front "arrives."
   Welds sky and sea into one organism for ~3 ALU.

**Two gotchas worth keeping:**
- **A special encounter's SEA must be fogged toward the encounter's LIGHT.** Same law as the rocks: a dark/
  fogged surface in a warm scene reads cheap unless its atmospheric perspective points at the scene's light.
  We already re-steered the water `sunDir` and warmed `sunColor` for the heaven; the horizon FOG COLOUR was
  the missing third derived-from-light thing (colour → direction → *horizon haze*).
- **The integration weight must gate the FOG MIX, not just the additive terms — or you regress other biomes.**
  `fogCol = mix(fogCol, heavenHaze, fogF²)` is NOT byte-identical off-heaven: for dual-fog biomes
  (`fogColor ≠ fogFarColor`) it drags the far fog toward `fogFarColor` even when `heavenHaze == fogFarColor`.
  The fix is `mix(..., fogF²·uHeavenGlow)` — multiply the weight by the integration scalar so off-heaven the
  whole term is provably a no-op. (The additive column/glitter were already ×uHeavenGlow; the fog *replacement*
  is the one that bites because it's a lerp of an existing value, not an add to zero.)
- **A backtick inside a GLSL comment closes the JS template literal.** The water shaders live in
  `` /* glsl */`…` `` template strings; writing `` `az` `` in a GLSL `//` comment terminated the string →
  "Unexpected identifier" at parse. Never use backticks in shader-string comments — plain words only.

**Budget/safety.** Opaque, zero new draws/passes/fill (~8 ALU on the water fragment, partly offset by the
heaven's 1/8-rate mirror diet). NaN-safe: `az` normalize via `inversesqrt(max(1e-6,…))`, every `dot` clamped,
no fractional pow of a possibly-negative base. New uniforms live in `sharedUniforms` (the documented trap:
anything not there vanishes on the reflective↔cheap rebuild). `?oldsea` pins `uHeavenGlow = 0`.

**Verify.** smoke + bossboot zero-error; `unmaskedarena` luminance probes green (peak fogged-sea under the
column ≈ 0.28–0.33, below sky p50 ~0.40 and outside the corridor band). auroraMix red pre-existing. **Owner
judges on the real GPU:** does the horizon read premium (gradient not seam), does the column sit under the
blast, the heartbeat feel — and 8-bit gradient BANDING on mobile is the one real risk (fold in the existing
`hash()` as a ±1/255 dither if he sees bands). Dials: `uHorizonCol`, the 0.5 column gain.
