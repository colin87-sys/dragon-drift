# 2026-07-13 — Skyforged PR-1: the Windvault (a reusable "forged glass" marker material + a premium flow gate)

**Why.** The owner flew the flow run and rejected the Sky Gate (posts+chevron+halo+gem)
as *"tacky and cheap"* and, separately, said the rings/powerups don't read premium. A
high-effort Fable art pass produced the **"Skyforged glass"** language (markers = light
suspended in forged, faceted glass) and three redesigns (gate→Windvault, orb→Star Shard,
ring→Jade Annulus). This is PR-1: the shared material + the Windvault, replacing the Sky Gate.
It is **N17** in `reforged/GRAPHICS-OVERHAUL.md` (the owner asked it be recorded so it's not
forgotten). Gate 1 returned **ADJUST** with 6 deltas (A1–A6); all applied before code.

**Did.**
- **`js/markerSurface.js`** — one reusable factory for ALL three future markers. An OPAQUE
  emissive `MeshStandardMaterial` (blooms, sorts trivially, no overdraw cliff — the right
  call over anything additive) patched with ONE `onBeforeCompile` that adds a 3-stop axial
  emissive gradient along a per-vertex `glowT` ramp + a fresnel rim + a flow phase.
- **The Windvault** in the `obstacles.js` `flowgate` branch — a single tapered arch of forged
  glass framing the (unchanged) green reward ring; the light **climbs the arch** with the
  slipstream. One merged faceted mesh (~1 draw, down from ~4). Behind `?skyforged=0`.

**Reusable patterns banked.**
- **A reusable shader-material factory keeps the palette + drivers as UNIFORMS, never
  string-baked constants, + ONE `customProgramCacheKey`** → gate/orb/ring all compile to a
  SINGLE program. The drivers are shared value objects passed IN: `timeRef` globally shared
  (one write/frame), **`flowRef` per-ROLE and per-instance-capable** — `slipMix` only exists on
  flow runs, and the global orb/ring need their own driver (rings already clone a material per
  instance for feverGlow/collect-flash, so a shared `uFlow` would have forced a rewrite at
  PR-3). This was Gate-1's biggest catch (A2).
- **`glowT` is an ABSTRACT 0→1 ramp** — the GLSL makes no world-Y / "up" assumption, so the
  geometry decides what it means (arch: feet→crown; shard: aft→tip; annulus: outer→inner-lip).
  One program, three roles.
- **A tapered, attribute-baked swept tube must be hand-rolled** — `THREE.TubeGeometry` can't
  taper per-point nor bake a vertex attribute. Sample a centreline, build a small faceted ring
  cross-section per sample scaled by `taper(glowT)`, connect **non-indexed**, then
  `computeVertexNormals()` → per-face **FLAT** normals (the discrete facet glints ARE the
  forged-glass read; smooth normals give a plastic-tube glow). (Gate-1 A4.)
- **`mergeGeometries` returns null on an attribute-set mismatch** — so bake `glowT` onto EVERY
  merged piece, including a *constant* one (the keystone shard bakes `glowT=1`). Strip the
  keystone's `normal`/`uv` after `.toNonIndexed()` so both pieces are exactly `position+glowT`.
- **The edge-on silhouette lesson survives from the Sky Gate torus**: author a **tall horseshoe
  with near-vertical legs** (the "posts" read survives edge-on as the dragon banks in) — NOT a
  semicircle (a torus/semicircle nearly vanishes edge-on) — and **z-elongate the cross-section**
  (~1.0×1.4) so a banking approach still sees lit area. Verified in the montage's off-axis cell.
- **Weighted motion beats spin**: the light CLIMBS the arch (a bright front travelling along
  `glowT` as `uFlow` rises) — replacing the mechanical counter-rotating halo. The whole run
  breathes with the chain via two shared-uniform writes.
- **Coexist, don't delete** (Gate-1 A1, the N4 pattern): `?skyforged=0` branches BOTH the builder
  AND the `updateObstacles` motion path; the old Sky Gate stays one release for the owner's A/B,
  deleted after sign-off. Default ON so `?flowrun` shows the Windvault.
- **Determinism-free by construction**: drawn entirely from segment fields, `e.boxes` stays EMPTY
  (`flowColliderBoxes()===0` — walls-free), `gold-determinism` byte-identical. NOT
  `bindAtmosphere`'d (deliberate — a signature emissive marker shouldn't be fog-tinted, parity
  with the old flow mats / the soul-fire rationale).

**Tooling lesson (for any slip-driven still).** To light a marker whose brightness is driven by
`slipMix` for a screenshot, set `player.canyonSlip` DIRECTLY under `game.timeScale=0` — the tick
still calls `updateObstacles` at `dt=0`, which writes `markerFlow` from `canyonSlip` — so the arch
lights with **zero player advance**. Ramping the chain the natural way advances the player and
drifts a neighbouring gate into frame. Also: the forced `?canyon=flow` harness interleaves
normal-course **Phase Gates**, one of which can straddle the framed flow plane (never happens in
real flow play) — hide them by their veil `ShaderMaterial`'s `uEdge` uniform so the A/B judges the
flow marker alone. (`tools/markershot.mjs`.)

**Gotcha / the 8→9 gap (Gate 2 SHIP 8/10).** At gameplay distance the Windvault reads as a clean
glowing cyan-white arch — the **facets and the cyan→white gradient are subtle** (the "forged glass"
material story is carried by the SILHOUETTE, not the surface: bloom + ACES flatten the pentagonal
glints into a smooth tube glow at the 34m framing, and the ramp whites out when hot). Gate 2 called
the premium delta over the Sky Gate *"decisive"* and verified every risky claim, but this material
is the SPINE PR-2/PR-3 ride, so the signature should strengthen. Deltas staged for PR-2:
**D1** make the facets survive bloom — a baked per-facet ±emissive jitter attribute, or narrow the
rim (`uRimPow` ~2.4→4) so the glint concentrates on facet edges — judged at the 34m framing, not
close-up; **D2** widen the cold↔hot color story — deepen the cold root/mid cyan saturation so the
resting arch reads as *glass* and the hot state doesn't fully white out; **D3** tooling — hide the
interleaved harness Phase Gate by entry kind, not only by the veil `uEdge` uniform (one lingers in
the cold cell). Owner judges the climb-front motion + the hot white-out on the live preview.

**Leapfrog.** `markerSurface.js` is now the shared spine: **PR-2 Star Shard** (global orb; delete
the additive glow sprite — a perf win) and **PR-3 Jade Annulus** (global ring; per-instance
`flowRef`) both reuse it by remapping `glowT`. The A/B montage tool + `tests/markers.mjs` extend to
each. Verify: `tests/markers.mjs` 22/22, `gold-determinism` byte-identical,
`canyonboot`/`canyon`/`canyonflow`/`canyonframe` green.
