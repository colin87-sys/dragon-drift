# 2026-07-13 — Skyforged PR-2: the Star Shard orb (+ the shared-material D1/D2 tuning)

**Why.** PR-1 (Windvault) SHIP'd at Gate-2 8/10; the 8→9 gap was surface-material subtlety on
the shared `markerSurface` spine. PR-2 does the **global orb** (the second of N17's three
redesigns) AND folds the Windvault's Gate-2 deltas (D1/D2) into the shared material — so the
orb and the arch level up together. Gate 1 returned **ADJUST** with 7 deltas (A1–A7); all applied.

**Did.** Replaced the orb's `SphereGeometry` + emissive core + **additive glow Sprite** with a
faceted directional **Star Shard** (an asymmetric bipyramid) on the shared `markerSurface`, behind
the same `?skyforged=0` A/B (the old sphere+sprite is the fallback). D1: per-facet emissive jitter
+ a narrower rim so the glints survive bloom. D2: deeper cold cyan + an icy-not-white hot core + a
tunable `uHotLift` so hot doesn't fully white out. D3: tag Phase-Gate groups for the shot tools.

**Reusable patterns banked.**
- **Deleting a per-instance additive Sprite for an opaque emissive mesh is a straight overdraw
  win** — and the collect FLASH must reroute: an opaque material can't fade opacity, so the sprite's
  opacity-fade becomes a **small, capped scale-POP** (≤~1.6×, ~0.15s, then `visible=false`); the
  already-batched `burst()` (N4) carries the spark. Don't grow the mesh big at the near plane (it
  smears a hot slab across the frame at the moment of collect, which happens ~on the camera).
- **A shared material's per-FACET jitter attribute must be baked per-FACET, not per-triangle.**
  Quad facets (the Windvault's pentagonal tube) are tri PAIRS — a per-triangle bake splits one facet
  into two brightnesses and reads as a *triangulation bug*, not forged glass. Bake per-QUAD on the
  tube (one `facetHash(i*K+k)` shared by both tris), per-tri on the octahedron/bipyramid shard
  (there a triangle IS a facet), and a CONSTANT on the keystone (merge parity — `mergeGeometries`
  still returns null on an attribute-set mismatch). Centered formula `lift *= 0.9 + 0.2*facetJ`, so a
  missing attribute defaults 0 → 0.9, **never black** (the safe-default discipline from PR-1's glowT).
- **Geometry-builder randomness MUST come from a pure index HASH, never a seeded gameplay rng
  stream.** Drawing extra values from the level's `rng`/`j` inside a builder shifts every downstream
  consumer — a determinism break, not just a `Math.random` one. `facetHash(faceId)` keeps
  `gold-determinism` byte-identical by construction (verified).
- **Head-on read for a directional collectible you fly INTO:** a z-elongated spindle has its
  SMALLEST silhouette at exactly the gameplay framing, so (a) give it radial girth ≥ the old core
  sphere (head-on lit area + bloom footprint), (b) point the **bright ice-white tip AT the
  approaching player (+z)**, cold cyan trailing along travel — the hot beacon lands in the only frame
  that matters and it reads as a comet streaking toward you, and (c) make the slow **axial spin
  mandatory** — it's the only surface motion visible head-on and it makes the facet glints shimmer.
- **Per-role `flowRef`, now exercised:** the global orb gets its OWN heat driver — ribbon heat from
  the flow chain, global heat from an active speed boost — written once/frame in `updatePowerups`.
  Never the gate's slip-only `markerFlow` (PR-1's biggest Gate-1 catch, now proven necessary).
- **Coexist: the flag branches BOTH builder AND update path.** The idle sprite pulse + the flash
  opacity-fade dereference `o.glow`; in Skyforged mode `o.glow` is null, so guard on it (the PR-1
  motion-path lesson). Keep the `makeGlowTexture` import while the fallback lives.
- **Tooling:** tag interleaved obstacles (`group.userData.phaseGate`) so shot tools hide them by
  kind, not by a fragile material match.

**Gotcha.** The forced `?canyon=flow` harness scene is genuinely cluttered — it interleaves
normal-course gates AND **setpiece gateways** (large lane-spanning frames, a SEPARATE system from
`buildGate`, so the phaseGate tag can't hide them) — which makes a CLEAN single-marker montage hard;
they don't overlap the markers in real flow play. Owner judges the final feel on the live preview.
If a future PR needs pristine marker shots, build an isolated "marker showroom" scene rather than
fighting the live harness.

**Leapfrog.** `markerSurface` now drives two of three markers. **PR-3 Jade Annulus** reuses it with
a **per-INSTANCE `flowRef`** (rings already clone a material per instance for feverGlow/collect-flash)
and `glowT` remapped outer→inner-lip; the D1/D2 tuning already benefits it. Verify: `tests/markers.mjs`
38/38 (incl. a live WebGL Star Shard check — glowT+facetJ mesh, no Sprite child),
`gold-determinism` byte-identical, `canyonboot`/`canyonflow`/`canyonframe` green.
