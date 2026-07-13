# 2026-07-13 — Aurora Gate-5: eruption RESTRAINT + more LINES, and elevating "cheap" ice props

**Why.** Owner flew the shipped biome on mobile: the full-color eruption read as "too intense" (a solid
magenta ceiling), they wanted "more of those lines" (the fine ray striations), and separately the ice
props "looked cheap." Two Fable art-director passes.

**Aurora — "reservation & rays" (the two asks are ONE fix).** Real peak auroras are *fine colored rays
over dark starry sky* — color carried BY the line structure, never a sheet behind it. So:
- **Gut the diffuse eruption WASH, make its color ride the rays.** The heavy ceiling was a broad
  `ecrown` glow (gain 0.6, decay-3.0 across a huge elevation band, only 2:1 fold-broken) painting ~0.45
  of pink across the whole upper sky — AND its `aurLum` was erasing the very stars that make it read
  translucent. Fix: capture the main arc's ray structure (`rayCore = clamp((ray-0.35)*1.3,0,1)*tall`),
  multiply the crown tint by `(0.30 + 0.70*rayCore)`, cut gains 0.6→0.20 / 0.34→0.10, steepen decay
  3.0→4.5, cut the star-dimming 0.12→0.05. Between rays it's a whisper over dark sky; the color lives
  on the lines. **Restraint is also temporal:** cap the eruption envelope peak at 0.8, not 1.0 — even
  the biggest display keeps a fifth in reserve.
- **"More lines" = finer + a sparse hairline interleave.** Ray freq 20→26, ray profile `rn²→rn⁴`
  (hairline cores + a 0.16 floor = deep dark gaps where stars live — and the mean column dims ~40%, so
  "less intense" comes free), stagger the ray heights harder, and add ONE tier0-only second frequency
  (`u*47`, sparse `smoothstep(0.60,0.92)`) threaded between the primaries so it reads as *more* fine
  lines, never a comb. Net +1 noise eval tier0 (6→7), tier1/2 unchanged.
- **The magic is three cheap cues:** per-ray color *stagger* (`v += (rn-0.5)*0.3`) so green→cyan→pink
  blends ALONG each ray (not a horizontal band); stars burning *through* (attenuation 0.65→0.55 + the
  wash cut) — the #1 "glowing gas not a decal" tell, extended to the eruption that was drowning it; and
  a corona-convergence breath (`u *= 1 - 0.25*erupt*hy`) so eruption rays fan from a high point.
- **The reusable law:** when an effect reads "too intense," the fix is usually not "turn it down"
  uniformly but *restructure the energy onto the detail* — color on the lines, brightness in the cores,
  dark between. Restraint + structure reads richer than a dimmer wash.

**Props — "cheap is geometry, not palette."** The floe/iceFang read cheap because: boxes = a crate
silhouette (backlit, silhouette is ALL there is); the `(r,h,r)` instance scale *shears internal tilts
flat*, so angular character in the recipe never reaches the frame; accents were uniformly-emissive tabs
*hovering* off the surface (the LED-strip poverty tell); cones = traffic-cones (no kink/fracture); only
2 archetypes + a near-symmetric plan → visible tiling, doubled by the mirror. Fixes:
- **Variety must live in the PLAN OUTLINE + top-edge STEPS** on wide-flat props, because nonuniform
  scale flattens internal tilts. Cylinders (irregular polygons) not boxes; rafted stepped pans; kinked
  frustum+offset-tip fangs with a *fallen* tip (fracture story beat + free asymmetry).
- **Three shape FAMILIES** (flat floe / spike fang / round faceted `berg`) + staggered coprime-ish
  steps so neighbors rarely match — the biggest anti-tiling lever. Plus a `skerry` (bare non-glowing
  rock) as the FOIL that makes the ice accents feel *earned*, and a distant `ridge` massif that crops
  the aurora for depth/scale.
- **Faceted `IcosahedronGeometry(r,0)` + flatShading = free per-facet moon glints** — the "glassy ice"
  read a smooth box can't give. GOTCHA: Icosahedron/Polyhedron geometries are **non-indexed** while
  Box/Cone/Cylinder are **indexed** — `mergeGeometries` THROWS on a mix (and it's in `createEnvironment`,
  so it crashes EVERY biome's boot, not just biome 6). Fix: `.toNonIndexed()` the indexed part so a
  mixed archetype is uniformly non-indexed. (Don't weld with `mergeVertices` — that smooths the facets
  you wanted.) A boot montage — not the source tests — is what catches this; gold-determinism/markers
  timing out at boot was the tell.
- **rotY is re-randomized on recycle** (environment.js recycle paths force `rotY: rnd()*π`), so a prop
  that needs a fixed orientation (a linear ridge band) can't rely on a `place`-supplied rotY past the
  first cycle. Design rotation-ROBUST instead: spread the ridge peaks radially (x AND z) so any yaw
  still reads as a jagged massif.
- **De-lamp accents GEOMETRICALLY:** shrink accent area to thin buried plates / one flush inlay / a
  single sliver — an edge catching the aurora, never a glowing volume. Materials only nudged (glossier
  primary for facet glints, paler/quieter accent).

**Leapfrog.** This is a POST-MERGE refinement on a fresh branch (PR #411 already merged). It's the last
polish before **PR-4 THE FLIP** (`CYCLE=[0,1,2,3,4,6,5]`) puts Aurora Shallows in the live rotation —
an owner decision. The biome now has a restrained-yet-alive aurora and rich, varied, LOW ice props +
a horizon massif. Plan: `reforged/AURORA-SHALLOWS-PLAN.md`.
