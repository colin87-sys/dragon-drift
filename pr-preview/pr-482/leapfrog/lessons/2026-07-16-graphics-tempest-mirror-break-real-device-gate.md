# graphics: a storm sea is killed by the MIRROR, not saved by foam — and headless can't see it

**What we did.** After the STORMSEA foam pass Fable-passed at 4.3 on headless captures, the owner
flew it on a real iPhone and said "sea looks calm with a bit of natural currents and foam." He was
right. Diagnosed + fixed the real cause and, more importantly, fixed the GATING that let a
calm-reading sea pass.

**The core lesson — foam on a mirror still reads CALM.** The STORMSEA foam-streak grammar (combed
lanes, dark troughs, presence rhythm) was all correct, but the underlying water surface was still a
near-perfect **glassy mirror** — it cleanly doubled the sky into one long unbroken reflection lane,
and a smooth unbroken reflection is the universal signal for "calm." A tall swell wouldn't have
fixed it either (from a flight-altitude camera a swell reads as almost nothing). **The enemy was
the chrome, not the wave height.** The fix was four levers, all gated on `uStormSea` (0 elsewhere =
byte-identical):
1. **BREAK THE MIRROR** — two wind-aligned chop octaves added to the `wave()` normal accumulation
   (the shipped field tops out ~0.2 slope; these add ~0.6) + a mirror-sample distortion
   (`N.xz * (0.42 + 1.1·storm)`) so the clean reflection lane shatters into broken speckle.
2. **MATTE IT DOWN** — dim the reflected sample (`refl *= mix(1, 0.55, storm)`) and cap the fresnel
   mix (`× (1 − 0.45·storm)`) so the dark water body always owns ≥45% of the pixel. Grey sea
   remembering the sky, not chrome doubling it.
3. **HEAVE** — bumped the storm swell amp so the horizon undulates instead of ruling a dead-flat line.
4. **FOAM** — lifted the foam peak once the field went ~⅓ darker (contrast, not coverage).

**THE GATING LESSON (the one that matters for every future biome).** Headless software-WebGL
**under-renders the reflective water** — it drew a matte, dark, textured sea that does not exist on
a real GPU, so Fable's 4.3 was scored on a frame the player never sees. The codebase's own law ("no
WebGL in CI; the human judges on the preview") now applies to the Fable checkpoints too:
- **Headless captures are DIRECTIONAL-ONLY for any surface whose read depends on
  specular/reflection/bloom** (water above all). They still gate geometry, placement, palette
  relationships, coverage — the GPU-independent truths.
- **The gate of record for reflective surfaces is a real-device frame** (the owner's phone on the
  preview). A Fable score on a reflective surface from a headless frame carries a `REAL-DEVICE
  PENDING` tag and cannot SHIP a PR alone.
- **Ship an A/B pin** (`?stormsea=0|1`, the `?oldsea` idiom) so the owner flips the fix live in one
  flight and compares — this is how the real-device gate is actually run.

**Two artifacts the mirror-break introduced (both real-device-caught, both fixed):**
- **Bright gameplay FX STROBE in the chop.** Once the water reflects objects with broken normals,
  a bloom-hot object (a green ring) shatters into flickering zigzags frame-to-frame. Fix + new
  standing law: **no reflection may be brighter than its source object** — a compressive luminance
  cap on the reflection sample (`refl *= 0.85 / max(0.85, luma(refl))`) turns strobe into glints
  while preserving hue (so STORMREND's teal rings + future gold sockets still shatter nicely — the
  premium beat is kept, only the bloom-hot flicker is capped).
- **A long coherent "moonlit" glitter lane** running to the foreground — a theology violation
  (this biome's sun is HIDDEN behind the deck, so there is no line of sight for a coherent specular
  PATH). Fix: relax the toward-camera specular stretch under storm (`Ns.x 0.30 → mix(0.30, 0.70,
  storm)`) so the lobe rounds/shortens into a **distant horizon sparkle band** + dim the gain. The
  surviving distant band is the down-payment for PR-5's eye-breach sun-shaft — confine the glitter,
  don't kill it.

**Result.** Storm sea Fable-4.4 + owner-confirmed on device: matte, wind-scoured, shattered
reflections, foam streaks, dark troughs, no strobe, no moonpath. `uStormSea` + `TEMPEST_WIND` +
the reflection-cap + the storm-specular-confine are standing levers for any weather/reflective
biome (Tidal Reef).

**Reusable takeaways.**
- To make water read violent from above: **break the mirror + matte it down**; foam is the garnish,
  the surface STATE (reflection coherence) is the read. Wave height is irrelevant at flight altitude.
- **Headless renders can't judge reflective/specular/bloom surfaces** — score them DIRECTIONAL-only
  and make the real-device preview the gate of record, with an A/B pin so the owner runs it.
- **No reflection brighter than its source** — a compressive luma cap prevents bloom-hot objects
  from strobing in any rough reflective surface. Bank it as a standing readability law.
