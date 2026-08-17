# 2026-08-17 — Wing lab I2: the blue sheen was SPECULAR, and the probe that found it was lying

**Did / learned.** Built `90-SYNTHESIS.md` §6 in full on `forgewing`: a per-vertex optical
thickness (`aMem.z`, d ∈ [0.30, 3.60], nominal 0.90), a Frostbite back-translucency patch
(`membraneTransmissionPatch`) with the locked σ ratio (1.00, 2.68, 5.41)·σ0 at **σ0 = 1.0**,
the Fresnel demoted to a hashed hem fringe, a Murray vein tree + cord comb rasterised into one
256×256 R8 `DataTexture`, and fwidth-faded wrinkles. Two findings dominate:

1. **The "blue rim-light sheen" was not albedo, and no albedo can fix it.** A roughness sweep
   on masked pixels moved the worst 16 px tile's B−R from 0.111 (roughness 0.50) to 0.016
   (roughness 1.00), while albedo, `envMapIntensity` and the transmission term moved it by
   nothing. A dielectric's specular lobe carries the *light's* colour, so a coal-black warm
   sheet under a cool rim still returns cyan. The lever is the specular response itself:
   **F0 0.04 → 0.020** (three.js hard-codes IOR 1.5 / glass; a wet membrane is IOR 1.33) and
   **F90 1.0 → 0.06** (the horizon term single-scatter GGX assumes, and the term that turns
   every rough dark dielectric into chrome). That needed a THIRD compose seam — after
   `<lights_physical_fragment>`, the only place `material.specularColor/specularF90` exist and
   are still unused. Result: worst tile **0.0000 on all seven wing states and all six gate
   tiles**, with roughness left at §13's directed 0.38 (the granted yield to 0.50 unspent).

2. **The probe passed for four wrong reasons before it was believed.** In order: (a) the role
   mask was tone-mapped, and ACES's input matrix mixes channels — a "pure green" bone mask
   lands near (150, 230, 60), so *zero* bone pixels were classified and the polarity ratio was
   silently `—`; (b) the mask materials were `MeshBasicMaterial`, which defaults to
   **FrontSide**, so every back-facing surface of a DoubleSide dragon vanished from the mask
   and whatever was behind it got classified instead; (c) antialiased silhouette pixels resolved
   differently against a dark mask backdrop than against the lit sky one; (d) the headline
   metric was a ratio-of-ratios (backlit m:b ÷ front-lit m:b), which a membrane forced to
   **pure black** scored ×267 on, purely because its front-lit denominator was zero.
   Each was caught by one control: *a black surface cannot be blue*. That single impossible
   reading found (b).

**→ Systematize.** Three reusable pieces, all now in the repo:
- `membraneTransmissionPatch` + the optional `bodyFragMaterial` seam in `composeSurface`
  (additive, null for every existing patch, roster byte-identical) — any creature can now
  author its **specular response**, not just its albedo and roughness. Add "F90 horizon fade"
  to the cheap-tell registry beside "chrome outline": they are the same defect, and F90 is the
  dial that kills it without the leather-tarp roughness that kill #22 forbids.
- `composeSurface` now parks its uniforms on `material.userData.surfaceUniforms` **before**
  compile. Uniforms created inside `onBeforeCompile` are unreachable until the material has
  rendered, so nothing could drive them; now the rig (I4's slack scalar), the fire states (I3)
  and the harness all hold the same live objects.
- `wing-lab/tools/wingtiers.mjs` + `wlSurfaceScan`: a **masked** pixel probe (membrane / wing
  structure / skirt), an authored-tier pass that reads §5.5's tier straight out of the vertex
  colour's green channel, and four negative controls that must fire. The general rules it
  earned: **turn tone mapping OFF for any mask pass**, **DoubleSide every mask material**,
  **erode the mask by one pixel**, **render the mask on the same backdrop as the frame**, and
  **never build a verdict on a ratio whose denominator can go to zero** — the load-bearing
  quantity was the membrane's own transmission gain (backlit mean ÷ front-lit mean), which an
  opaque sheet cannot fake because it can only get darker.

**→ Leapfrog.** The thickness attribute is now authored and measured, and Kirchhoff makes
emission the same exponential: I3's forge window and artery lines are `1 − exp(−κ·d_eff)` on
the *same* `aMem.z` and the *same* Murray tree that already carries the dark vein doublets —
the artery centreline is already drawn, it just has to be handed to `heatMask` instead of only
to the optical path. And because the sheet's value is now light-direction dependent, the fire
read and the sunlight read cannot fight: where the membrane is thick it emits and blocks, where
it is thin it transmits and stays cold. The same patch, unchanged, is what any future
translucent surface in this repo (fins, sails, ear webs, boss membranes) should use instead of
`membraneSSSPatch`, which is a view-only Fresnel and is the tell it was written to fake.
