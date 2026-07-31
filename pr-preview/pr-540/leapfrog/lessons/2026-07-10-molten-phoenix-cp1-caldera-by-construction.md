# Molten fire is a CONSTRUCTION problem, not a palette one — "caldera by construction" + the heat-map crust field

**Did / learned.** Built CP1 of the Molten Phoenix (`phoenixMolten`) — a fresh Eternal-tier
dragon on the CALDERA system: a glowing magma body under a dark cooled-crust plate field, a
sungold spine fissure, a molten-heart caldera, and a cooled-obsidian head. First submission FAILED
the harsh Fable gate at **2.88** ("flat gold paint with black chips glued on; brick-grid crust; no
legible heart"); the reworked build PASSED at **4.04**. The load-bearing lesson: **an inverted-value
"molten" look (glow inside, dark crust on the edges) is won or lost in GEOMETRY + the intensity
LADDER, not in the tier hexes** — I had the sheet's exact tier colours from line one and still read
as a gilded bird. Three construction facts flipped it:

1. **The body field must be pitched a TIER BELOW the accents, or bloom flattens everything to one
   gold.** A magma emissive at "bright-first" full intensity (2.6) blooms up to flat yellow-gold
   under ACES, erasing the T1/T2/T3 separation. Dropping the body field to ~1.5 while keeping the
   fissure/heart at 2.6 restored the value gap that makes the three fire hues read as *separate
   structures* (the dual-sky contract). "Build bright-first" still holds — but the FIELD's ceiling
   is lower than the ACCENT's, or the whole thing is one smear.
2. **Crust DENSITY is the heat gradient.** Instead of tinting a loft, I seat irregular dark crust
   SHARDS on the actual body surface with a coverage HEAT MAP: open (few shards) at the hot breast,
   dense at the cooler extremities. The crust density itself draws "hottest at the heart, cooling
   outboard" — no per-vertex heat tinting, and it satisfies the pale/gold-sky anchor for free (the
   dark shards on the ventral silhouette stop the belly dissolving into a bright sky).
3. **A "cracked crust" reads only if the crust is the FIELD and the glow is the SEAM** — and only if
   the plates are IRREGULAR + two-valued. Regular rectangular plates in rows read as a checkerboard /
   corn-cob (a named failure). Irregular 5–6-gon shards (≥2× size variance, seeded jitter, seated to
   follow body flow) with a lit top + a dark bevel skirt read as igneous crust.

**Gotcha (re-learned the hard way):** `flatTriMesh` indexes `a[0]/a[1]/a[2]` — passing a
`THREE.Vector3` (whose `[0]` is `undefined`) silently NaNs every vertex. tricount still counts them,
starters-style asserts still pass, the flight tick doesn't throw — only the render is empty/blown.
Helpers that build tris must return PLAIN ARRAYS. (This is the same NaN-vertex class the ledger
already warned about; it bit again through a different door.)

**→ Systematize.** Two reusable primitives fell out that generalize past this dragon:
- **`crustShard(seat, up, tan, r, seed, topMat, sideMat, lift)`** — an irregular polygonal plate
  proud of a surface, two-valued by construction. Any "cracked/plated/scaled hide where the gaps
  glow" (lava, cooling metal, charred bark, cracked ice over water) is this primitive over a
  glowing underbody. The recipe "glowing loft + shards seated on its interpolated surface, coverage
  driven by a scalar field" is a general way to paint a gradient with GEOMETRY on a flat-shaded
  low-poly body — cheaper and more bloom-robust than emissive tinting, and it survives the tone-map.
- **The intensity-ladder rule as a material-factory invariant:** in any stage-aware factory, the
  BODY-FIELD emissive ceiling must sit at least one step below the ACCENT ceiling, or the accents
  don't separate under bloom. Worth encoding as a comment/assert in every future `*Mats` factory.

**→ Leapfrog.** The heat-map-driven shard field is really a *scalar-field-to-relief* engine: feed it
ANY per-surface scalar (heat, wetness, damage, age) and it lays organized relief that reads the
field. That points at damage/erosion states, biome-weathering variants, and "the same body at
different life stages" — all as one coverage function, not new geometry. And the "field a tier below
accents" rule is the general fix for the recurring "premium reads as flat bright paint" failure: it's
almost always a missing VALUE GAP, not a wrong hue. Next: prove the shard engine migrates to a second
creature (a lava biome hazard or a charred boss) from the same two functions.
