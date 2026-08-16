# Mire: reflection craft — the black mirror from uniform blur to the biome's signature

**What we did.** Fable's doc-73 lever 5: the Mire's black-mirror water — the biome's *signature* — read as
*"a brown smear of vertically-blurred blobs: no crisp doubled silhouette."* Fixed it with three default-0
per-biome water uniforms (the `uHeroPool`/`uBreachMix` pattern): anisotropic streak-stretch, sparse drifting
glints, and a mirror-side green-blob pull. Fable-spec 85, implemented verbatim; all 6 other biomes stay
byte-identical.

**The mechanism the blur came from.** The reflective water samples the mirror RT with an ISOTROPIC wobble:
`distort = N.xz * 0.42; proj.xy += distort * proj.w`. Equal jitter in both screen axes = every reflection is
the same soft round blob. A real black-water mirror is **anisotropic** — crisp side-to-side, long down-lane.

**Three levers, all default-0 (`uReflStretch`/`uReflGlint`/`uReflGreenPull`, Mire 0.85/0.7/0.8):**
- **Anisotropic distort** (free, no extra taps): `dAniso = mix(vec2(1.0), vec2(0.35, 2.6), uReflStretch)` — at
  0 it's `vec2(1.0)` = byte-identical; at the Mire it compresses lateral wobble ×0.45 (crisp doubled edges)
  and stretches down-lane ×2.36. **The identity-off is the `mix(vec2(1.0), …, lever)` — lever 0 → the shipped
  scalar exactly.**
- **Luma-keyed 3-tap streak** (2 extra taps, inside a `uReflStretch>0.001` uniform branch → other biomes pay
  zero): two extra down-lane samples added ONLY where the sampled luma is high (`smoothstep(0.35,0.90,luma)`),
  so bright glow sources streak while dark trunks stay crisp — then renormalized (`refl /= 1+lever*0.45`) so it
  *streaks, doesn't brighten*. **A uniform-valued `if` branch is coherent across the warp → cheap; a
  per-fragment branch would not be.**
- **Green mirror-blob fix, MIRROR side only.** The green catch-ring is a **layer-0 gameplay mesh → its
  `0x3dff8f` lands in the mirror RT** (that's the "green blob"). But that green is a GAME-WIDE gameplay signal
  (green=catch / cyan=flow) — you must NOT recolor the ring. The fix rewrites the *sampled* water fragment,
  hue-keyed: `greenExcess = refl.g - max(refl.r, refl.b)` is >0 ONLY for green-dominant pixels, so cyan
  (`b≈g`) and amber (`r>g`) key to 0 and survive; only the saturated green blob gets pulled toward
  amber-tinted luma. **Reusable: to tame a reflected gameplay color without touching the gameplay object, key
  the fix on the reflected pixel's hue-excess, not on the object.**

**Gotchas.**
- The water fragment's time uniform is **`time`, not `uTime`** — the spec wrote `uTime`; adapt at the call
  site or you get an undeclared-identifier compile fail (caught by the appshell no-console-errors boot test).
- Define the luma vector ONCE (`const vec3 LUMA = vec3(0.299,0.587,0.114)` in the fragment) — the shipped code
  already uses a Rec.709 `dot(refl, vec3(0.2126,…))` for the storm cap; don't collide names.
- **Verify on the REFLECTIVE tier.** Headless chromium runs tier-0 (the crisp 768² mirror) here, so an
  in-Mire low-altitude capture shows the streak; but if a machine ever falls to tier-2 (analytic, no mirror),
  the §1 streak + §3 green-pull are inside `#ifdef USE_REFLECTION` and won't show — only the §2 glints (added
  after `#endif`) do. Frame the gate on a tier-0 run.

**What it unlocks.** A reusable **per-biome reflection-craft channel** — any biome can now dial its water's
mirror anisotropy, glints, and a hue-keyed reflected-color pull without touching another biome. Same
optional-channel spine as the aerial/hero-rim levers.
