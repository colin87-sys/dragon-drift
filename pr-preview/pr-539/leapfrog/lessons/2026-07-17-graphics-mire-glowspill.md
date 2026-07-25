# Mire glow-spill: make emissive glow actually LIGHT the dead matter (3 mechanisms + the emissive-over-multiply flip)

**What we did.** Owner's felt complaint (Fable ruling 94): the Mire reads "stickers on black" — a glowcap
blazes but the trunk one metre from it is as black as one fifty metres away, because the glows are
EMISSIVE-ONLY (they render themselves, transfer nothing). Fable's biggest illumination win: make the
organisms' light LAND on the dead matter + pool on the mirror. Shipped A+B+C (Fable spec 96 → gate 98 FAIL
3.5 → revise → re-gate 99 PASS 4.4). Every mechanism default-0 → other 6 biomes byte-identical.

- **A — 2 real spill PointLights** at the nearest kept arch gate + spire beacon. Boot-created singletons (a
  FIXED pool → `NUM_POINT_LIGHTS` compiles once, never mid-run), parked y−50 intensity 0 outside the Mire
  (pixel-identical: 0 radiance). Analytic per-frame selection from along-track dist using the SAME kept-peak
  hashes the gate/clearing/beacon already agree on → zero scene queries, zero alloc.
- **B — 4 mirror pools** on the `uHeroPool` water pattern (`uMirePoolK` default 0 → byte-identical water),
  amber pools under the gates + spire that the black mirror doubles back.
- **C — per-instance near-glow lift** on the dark veil families, weight computed PURELY at placement
  (heroHash/mireComp, no rnd → gold-determinism byte-identical).
- One shared per-cluster **breath clock** so a cluster's cap, its spill light, and its pool pulse as ONE
  organism (two clocks on one cluster = the animatronic tell).

**THE core lesson — a multiply can't rescue a near-black base; flip to emissive.** C started as an
`instanceColor` MULTIPLY (`diffuse *= lift`). It gated 3.5 FAIL: the veil base albedo is so close to black
that ×2.8 (even ×4.0) lands at "slightly less black," and then the 0.2-intensity sun multiplies it back down.
**Multiplication cannot brighten a near-zero base under dim light.** The fix (Fable predicted it): drive
EMISSIVE from the same per-instance weight — `totalEmissiveRadiance += vec3(0.227,0.200,0.141) * w`, which is
light-independent and lands EXACTLY at the value-ladder step-4 target `0x3a3324` at w=1. Same principle as the
aerial lever and the caldera belly: **when a dark surface must read lit against dim light or backlight, add to
emissive, don't multiply diffuse.**

**Gotchas (all reusable):**
- **Zero-fill buffer → black props.** The first `setColorAt`/instanced-attribute write allocates a
  ZERO-filled buffer; any instance not subsequently written renders BLACK. Fix: write EVERY instance
  (identity/0 when parked) — `writeMatrix` runs for all at build/recycle/reseed, so an unconditional write per
  band covers it.
- **Shared-program alias.** The emissive-drink patch is chained onto `mireVeil` (a Mire-only material) via a
  new `aGlowLift` instanced attribute. `mireVeil` shared a `customProgramCacheKey` ('propDetailLadder') with
  every other ladder material — so without a UNIQUE key the patched program would be handed to meshes that
  lack `aGlowLift` (missing-attribute). Fix: give the patched material its own cache key ('mireVeilDrink').
  **Any per-instance-attribute shader patch on a material that shares a program cache key needs its own key.**
- **Emissive anchor order.** Anchor the drink `+=` on `#include <opaque_fragment>` (after ALL of
  addPropDetail's emissive modulation), NOT `emissivemap_fragment` — the latter puts it before the `*= vColor`
  ladder multiply, and a dark-trunk ladder value would kill it.
- **BIOME_TINTS blocks reusing instanceColor→emissive in the SHARED shader:** `BIOME_TINTS[1]` (sandstone) has
  components >1, so a `max(instanceColor-1,0)` emissive term in the shared `addPropDetail` would spuriously
  glow the Wastes. A dedicated Mire-only material + attribute is the clean scope.
- **Capture harness:** the debug camera overrides manual poses even at timeScale 0, and per-boot physics-settle
  drift makes a fixed-camera A/B impossible — judge the ON frames perceptually (near vs far mass), meter where
  you can. `?spill=0` parks A+B only (C is baked), so it isn't a full A/B.

**Deferred (hooks built):** will-o'-wisp light-carriers (pool slot 3 reserved; borrow light A1 when no spire
is near) — a MOTION feature deserving its own gate. Optional owner-taste knob left at default: chorus lift
weight 0.30 (Fable would accept 0.36 for a touch more mid-field warmth).

**What it unlocks.** A reusable "organism light lands on matter" kit — real budgeted spill lights that track
analytic hero seats, positional water pools, and a per-instance emissive drink — the premium answer to any
emissive-only "stickers on black" biome.
