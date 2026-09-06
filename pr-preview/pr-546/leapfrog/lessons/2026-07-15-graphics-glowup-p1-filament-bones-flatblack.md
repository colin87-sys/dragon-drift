# Tempest glow-up P1 — flat-white-tape bones → recessed forked filaments, and killing flat-black

**What we did.** After the Arc Crown lightning shipped at 4.3/5, the owner said the lightning was now "the
most premium AAA thing about this dragon" and asked for a full glow-up of the CREATURE to match — starting
from "the lightning bones on its wings read too in-your-face and flat and regular, like strips." A Fable
art-director assessment diagnosed the real gap and returned a 6-item ranked plan; Phase 1 paired its two
highest-impact items (checkpoint 4.0→REVISE→**4.4/5 APPROVED after one tight rim round**).

**THE DIAGNOSIS — a "value-structure gap."** The lightning reads premium because it has three organized
value zones (white-hot core → blue bloom → dark sky) plus organic forking. The creature had ONE value:
coal-black. Two failures fed it: (1) the wing "bones" were constant-width near-white flat quads standing
PROUD on flat membrane at even pitch — white tape on black cardstock, no falloff; (2) flat-black poverty —
the whole body one value, so next to a glowing bolt she was a silhouette.

**FIX #1 — a bone is not a strip, it's a filament in a channel.** The shared `stormSpike` primitive (one
bone → wings, dorsal vanes, head crown, tail — DRY) built ONE wide flat glow cap standing proud. Reforged
it to build the bolt's core→bloom→dark structure with two stacked caps:
- a **WIDE, DIM storm-blue penumbra** skirt at the channel floor (new `arcBloom` mat), plus
- a **NARROW, TAPERED white core** filament sitting BELOW the charcoal wall-tops (recessed, not proud) —
  so the side walls throw shadow that flanks a bright thread. A discharge, not tape.
Fork irregularity killed the comb: jitter the fan azimuths (±3.5°) and per-strut widths, and give EVERY
inner strut its own short off-axis prong at a jittered position/angle. Because all storm bones share the
primitive, the whole creature now speaks the Arc Crown's language in one edit.

**The accent-law gotcha — a colored bloom on a MeshStandard emissive is capped, unlike an FX corona.** The
Arc Crown corona is a saturated `0x5182ff` (a NormalBlending FX layer, not subject to the material tests).
The wing bloom is a real MeshStandard emissive, and a roster ACCENT LAW (tests/starters.mjs) caps every
storm-arc emissive at HSV-sat ≤0.16 (the near-white lane, §9). A saturated blue bloom fails it. Resolution:
hold the bloom to the lane (`0xd8e2ff`, the bluest in-lane storm-white) and carry the core→bloom→dark
FALLOFF with VALUE (dim + wide skirt vs bright + narrow core), not saturation. The structure — recess,
taper, falloff, forks — is what kills the "tape" read; the hue is secondary. (If a future owner wants the
bones as saturated as the corona, that's a deliberate law evolution, not a silent test edit.)

**FIX #2 — kill flat-black with a COLD rim + a steel VALUE ladder (not by turning the circuit on).** The
owner wants the circuit "off with hints" in cruise, so the anti-silhouette can't come from emissive. Two
diffuse/lighting levers instead:
- **Per-dragon cruise rim.** The shipped Fresnel rim (rimLight.js) used ONE warm cream hue (`0xfff0d8`) for
  every dragon — wrong for a storm dragon, and it read generic. Made the cruise rim hue + base strength
  per-dragon; the Tempest gets a COLD storm-steel edge (`0x8bb4ff`).
- **Steel value ladder.** The dorsal shell was ~one near-coal value. Re-aimed spine/dorsal/flank at a lit
  steel-slate 3-step ladder (`0x161d2c → 0x434f66 → 0x76869f`) so the body carves into distinct values.

**THE RIM GOTCHA that took a second round (P1b) — a Fresnel rim's EDGE brightness is STRENGTH, its WIDTH is
POWER, and a broad soft rim gets averaged away by backlight.** First pass (base 0.78) still read as a
silhouette: over bright water her edge peaked at L82 while the water sat L100-130 — the edge never cleared
the background. Key insight: at the silhouette edge the Fresnel term `pow(rimF, power)` ≈ 1 regardless of
`power` (rimF≈1 at grazing), so **only STRENGTH lifts the edge; POWER only tightens the falloff into a
thinner line.** A wide-soft rim spreads the same energy over many low-value pixels that the bright
background swallows. Fix: raise strength (base 0.78→1.25) AND tighten the exponent (a per-dragon
`rimPowerMul` 1.5) so it concentrates into a thin HOT edge. Result: edge L 229-242, clears the L≥130 target
and the water by a wide margin. **Verify a rim against the WORST-CASE background (bright backlit water),
measuring the silhouette-edge L, not a studio pale bg where any rim "reads".**

**Reusable takeaways.**
- A glowing "bone/vein/strut" reads premium as a NARROW bright core RECESSED in a channel with a WIDER DIM
  skirt (core→glow→dark), never a wide flat cap standing proud (that's tape). Recess = walls above the cap.
- Break a rank's "comb" read with jittered azimuth + width + a per-element off-axis prong — cheap, deterministic (index-hash jitter, never Math.random).
- Roster accent/color LAWS apply to MeshStandard emissives but not to separate FX blend layers — carry a
  colored falloff with VALUE when the hue is capped.
- Kill flat-black on a deliberately-dark hero with a COLD rim + a diffuse VALUE ladder, not by turning its
  emissive on. Make the rim hue per-dragon (a storm edge is cold, a solar edge is warm).
- Fresnel rim: STRENGTH = edge brightness, POWER = edge width. To clear a bright background, raise strength
  and tighten power; verify the edge L against backlit water, the worst case.
