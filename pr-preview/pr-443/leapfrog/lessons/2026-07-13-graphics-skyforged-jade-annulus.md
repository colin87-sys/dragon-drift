# 2026-07-13 — Skyforged PR-3: the Jade Annulus ring (+ the shared specular glint)

**Why.** The last of N17's three marker redesigns: the reward RING → a gem-cut faceted **Jade
Annulus** on the shared `markerSurface`, plus the owner-approved **specular glint** (the 8.5→9
lever both prior Gate-2s asked for) added to the shared material so all three markers sparkle.
Gate 1 returned **ADJUST** with 8 deltas (A1–A8), each verified against the vendored r160 source;
all applied.

**Did.** Replaced the smooth `TorusGeometry` + per-instance `MeshStandardMaterial` with a
hand-rolled gem-cut annulus (a 6-point bevel cross-section swept around the ring circle: a hot
mint-white **inner lip** outlining the aperture, deep jade **outer girdle**, broad +z crown),
keeping the circular GREEN catch identity. z-roll is now the readable motion + a capped precession
garnish; the `transparent:true`-from-spawn wart is fixed (opaque gem, scale-pop collect). Added the
glint to the shared factory (default OFF) and opted all three markers in.

**Reusable patterns banked (several are r160-specific traps).**
- **NEVER `material.clone()` a material that carries uniform refs in `userData`.** Verified in the
  vendored r160 `Material.copy`: it does `userData = JSON.parse(JSON.stringify(source.userData))` —
  which turns every `THREE.Color` / `{value}` ref into a DEAD plain object, while the cloned
  `onBeforeCompile` still closes over the SOURCE material's uniforms. Every "per-instance" object
  would silently share one uniform set (the first perfect-gold tint paints every ring gold). Call
  the **factory fresh per instance** instead — `customProgramCacheKey` still collapses them to ONE
  program. Per-instance uniforms carry only what DIFFERS (palette / gold / flash); shared drivers
  (`ringFlow`/`ringTime`) are passed by reference (one write/frame).
- **Do not toggle `material.transparent` at runtime.** It's a **program-cache-key parameter**
  (`parameters.opaque` gates `#define OPAQUE`, which forces `diffuseColor.a = 1.0`) and it is NOT in
  `setProgram`'s automatic `needsProgramChange` checks — so flipping it at collect is either a silent
  no-op (opacity fade never happens) or, with `needsUpdate`, a **mid-run shader-compile hitch** on
  the weak-mobile target. Opaque markers reroute the collect to a **scale-pop** (cap it *tighter*
  than the shard for a ring — it surrounds the near plane at collect); a flag-gated beefed `burst()`
  carries the dissolve.
- **Premium motion must respect the gameplay read.** The catch test is a planar (x,y) crossing, so a
  tilted annulus *lies* about the aperture and the perfect-center bullseye — **cap precession ≤0.08
  rad**. Bonus: the shipped `rotation.z = time*0.6` was a visual NO-OP (a smooth torus is rotationally
  symmetric); facets make **z-roll** read for free, roll is aperture-safe, and roll is exactly what
  sweeps flat-facet normals through the fixed glint key. So roll = the motion, precession = garnish.
- **Family coherence comes from the VALUE grammar, not the hue.** Keep the ring GREEN (the catch
  identity players know) inside a cyan system — coherence is the shared near-black body + deep→mid→
  icy-hot ramp + fresnel + facetJ + glint, not a shared colour. The fever-mint (`0x80ffcc`) literally
  bridges green→cyan, and the hue split is functional colour-coding (green = catch, cyan = flow/speed).
- **Route dynamics through the DESIGNED hot path, don't double-drive.** Porting the old absolute
  `emissiveIntensity = 4.5` fever write ON TOP of a fever-driven `uFlow` lift would white out (the D2
  failure mode). Instead fever/combo/chain feed the shared `ringFlow` (lift + climb-front); fever also
  shifts the per-instance palette toward mint; `uEmisScale` stays ≈ base. Perfect-gold writes the
  per-instance palette ONCE at collect — the update loop skips collected rings, so it persists.
- **The specular glint (the facet-read lever).** A tight per-flat-facet highlight
  `pow(clamp(dot(N, uGlintDir),0,1), sharp)` against a FIXED view-space key. Flat facets make it
  **piecewise-constant per facet** → no intra-facet firefly even without shading-AA (a better-behaved
  lever than more jitter amplitude, as Gate-2 predicted). `uGlint=0` default → the term is exactly 0 →
  factory identity until a call site opts in. Cap the energy (bloom doubles it), per-ROLE sharpness
  (big ring facets ~40, small shard facets ~28). It's a MOTION effect — facets sweep past the key as
  the marker rolls / the camera approaches — so stills under-sell it; the human judges it live.
- **Geometry = the hand-rolled sweep** (the Windvault builder), NOT a low-seg torus ("faceted donut",
  symmetric normals under-serve the glint) NOR `LatheGeometry` (the facetJ-remap-onto-internal-ordering
  path that caused the per-tri-split "triangulation bug"). Preserve the aperture affordance: inner lip
  ≈ Rc−tube ≈ 3.2, outer ≈ Rc+tube ≈ 4.0 (the shipped torus span) so `ringCatchRadius` still reads.

**Gotcha.** The glint uses view space, and the water Reflector renders in its OWN view space → the
glints differ in the reflection. Cosmetic; noted, not fixed. Also: don't touch `config.js` radii —
`reticle.js` and the gate arcs read `ringRadius`/`ringCatchRadius`.

**Leapfrog.** All THREE Skyforged markers (Windvault gate, Star Shard orb, Jade Annulus ring) now
ship on ONE shared `markerSurface` spine and ONE program, each A/B-gated by `?skyforged=0`
(byte-identical off) and determinism byte-identical. The marker system is complete; **PR-4** (Phase
Gate frame polish to match the language) is the optional remainder. Verify: `tests/markers.mjs`
51/51 (incl. the live-WebGL green opaque gem + glint check), `gold-determinism` byte-identical,
`canyonboot`/`canyonflow`/`canyonframe` green.
