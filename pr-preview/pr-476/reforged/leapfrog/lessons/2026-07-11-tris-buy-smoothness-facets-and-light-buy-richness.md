# Triangles buy smoothness; FACETS and LIGHT buy richness (and vertex paint is free)

**The question.** Azure Drake's apex sat at 5940/6000 tris while Solar's apex — visibly richer (corona,
gem, lit spires) — costs 3317. Why, and where's the headroom for pizzazz?

**The diagnosis (per-part tri breakdown, HIGH detail).** Perceived detail tracks EDGES, VALUE TIERS, and
LIGHTS — not vertex count. The two dragons spend their triangles on opposite things:
- **Azure (a pre-doctrine build) spends tris on CURVATURE INTERPOLATION.** Wings 2320 (39%): 5 *cambered
  blade SURFACES* per wing, each a `nX×nZ` grid = `round(7·bladeDetail)×round(4·bladeDetail)` — at
  `bladeDetail 1.45` that's 10×6 = 120 tris/blade × ~16 surfaces ≈ 1920, all spent making a gentle
  0.16-camber billow *smooth*. Body: one 864-tri Catmull-Rom `sweptLoft` boat-hull. Joints/eyes: dense
  14×12 spheres (252 each). Smoothness is the ONE thing the player can't see at the 250px chase distance.
- **Solar (post-doctrine) spends tris on DISTINCT ELEMENTS + gets light for free.** ~117 non-wing pieces
  average 36–144 tris because they're flat-shaded `flatTriMesh` facets — every triangle is a visible edge
  and value break, i.e. every tri IS detail. Wings = ~114 thin cylinder bones (a vault of silhouette
  elements, not a subdivided membrane). And the *richness the eye reports* — corona, gem-studs, lit
  edges — is **opaque emissive on flat facets (§3b), which costs ZERO triangles.**

So "5940 vs 3317" is not "Azure has more stuff." Azure has LESS stuff at HIGHER vertex density; Solar has
MORE stuff at LOWER density plus free light.

**The compaction made it worse — and that's the reclaim.** Azure's blades had just been compacted (span
−44%) but `bladeDetail` was never re-tuned, so a third of the wing budget became sub-8px tessellation.
Measured lever: `bladeDetail 1.45→1.0` reclaims **1024 tris** (10×6 grid → 7×4, right-sized for the
smaller blades) with zero visible loss. **Whenever you shrink a part, re-tune its tessellation dial — a
detail level tuned for the old size is pure waste at the new one.**

**The free pizzazz — vertex paint.** The single highest-leverage upgrade cost ZERO tris: **falcon
barring** — dark navy diffuse cross-bars on the primaries, painted in `bladeGeo`'s existing per-vertex
color loop (the same loop that already does the tier/trail/gold lerps). Gotchas that made it read:
- **Contrast or it vanishes.** A bar hue only a hair below the body (`0x223950`) washed into the existing
  two-tone gradient — invisible. A clear value step down (`0x101f30`) at ~0.85 strength read as bold
  plumage. On a dragon that already has an in-surface gradient, decorative paint must jump a real value gap.
- **Few + large, gated.** 2 wide chevron bands (not 10 stripes = micro-mud), placed in the outer-mid span
  clear of the root coverts and the gold tip, and ladder-gated (none f0 → half f1 → full apex) so the
  apex earns it.
- **It reads where the wing SURFACE faces the cam** — top-planform, rear-¾, and every bank — but is
  edge-on (hidden) from dead-astern. That's fine: play is full of banking. Don't judge blade-surface paint
  from the pure rear-chase tile.

**Reusable rules.**
- **To add "richness" cheaply, add EDGES, VALUE TIERS, or opaque EMISSIVE — not vertices.** Flat facets +
  saturated emissive (§3b) read as detail; smooth subdivision does not, below ~8px.
- **A near-maxed tri budget on a low-poly dragon is a smell, not a badge** — check whether the tris are
  buying visible edges/light or invisible smoothness. Azure's "5940" was mostly the latter.
- **Re-tune tessellation dials whenever a part is resized.** Compaction/scaling silently strands detail.
- **Free identity wins live in the vertex-color loop** — barring, banding, tier steps cost nothing and are
  law-9/no-washout safe because they're DIFFUSE. Reach for paint before geometry.
