# "Beauty in basic props": the Frozen principles, the SKEW that kills the Minecraft read, and a breaker-line fairness fix

**Context:** Owner on device: *"The side props look really low quality and cheap — like Minecraft built
things. Frozen/Caldera/Aurora look good even though they're basic. Look at Frozen and distill what makes it
beautiful into PRINCIPLES."* Plus two specifics: (1) "both banks lean the SAME diagonal — flip one so it's
symmetric and harmonious"; (2) "there are moments with no props where you drift laterally into open sea and
die — need small artistic things (like traffic cones) framing the lane." Fable studied Frozen's code and
confirmed all of it.

## The Frozen principles (transferable — Frozen's props are boxes too)

**F1 — Beauty is a COLOR RELATIONSHIP, not prop detail.** Frozen reads premium because cool luminous ice
transacts with a warm sunset (complementary temperature story). Props can't be beautiful in a vacuum; they
must transact with the sky. A storm has no sunset — its version is **ink-dark shapes against a warm pale
horizon slot with ONE burning gold accent** (Tsushima's storm grammar). The slot already existed; the props
just weren't dark enough or warm enough to play against it.

**F2 — Luminosity has a HUE.** Frozen's ice emissive is a saturated cool teal (fakes transmission = "this is
ice"). A **neutral-grey emissive is fog painted on the object**, not material. Tempest's stone emissive was
`#a8b4b6@0.30` — neutral grey — which milked the whole value ladder toward one flat mid-grey (also why a near
landmark read *paler* than the fog). Fix: `#5a6a78@0.12` (dark cool slate, low floor) + widen the ladder
stops (`#8e9aa0→#aab6bc` scour, `#4b545c→#39424c` damp). Near rock instantly reads ink-dark + carved.

**F3 — Wealth = normals variance, not triangles.** Every Frozen serac box carries its own `ry`/`rz` shear +
random per-instance `rotY`; flat-shading turns that into ~90 facets catching light at different angles. Same
tri budget, ten times the light play.

**F4 — DIAGONALS in silhouette.** No Frozen mass presents a purely horizontal/vertical edge set. *Axis-aligned
silhouettes ARE the Minecraft read, by definition.* Tempest's stormprow was offset-stacked axis-aligned boxes
= a staircase = Minecraft.

**F5 — full value range inside ONE prop** (near-black contact → bright crest → recessed accent).
**F6 — no two neighbours share a silhouette** (random rotY + size/height classes).

## The techniques that transferred them

**1. The SKEW is the real Minecraft fix.** A step-offset "lean" (each stratum at a bigger centerX) is a
staircase — axis-aligned jags (F4 violated). Replace it with a vertex SKEW: `x += k·(y − yRef)` applied AFTER
positioning, about the base (y=0), so a whole stack shears COHERENTLY — the windward edges align into ONE
continuous diagonal of parallelogram faces. Crucially a skew is AFFINE → lines map to lines even after the
`(r,h,r)` instance scale (the world lean just becomes `r·k/h`, varying naturally with aspect) — UNLIKE
`rx`/`rz` rotations, which the non-uniform scale shears wrong (the reason the strata could only ever carry a
tiny `ry` twist before). `skewX(geo, k)` is now a reusable helper. This is the single highest-leverage move
against "blocky/cheap".

**2. Mirror the lean per bank.** Both banks shared `rotY: 0` (a "wind-alignment" choice), so one bank leaned
toward the lane and the other away — the corridor read tilted/off-balance. `rotY: side > 0 ? Math.PI : 0`
mirrors the geometry so both banks lean the same way relative to the lane → a balanced V/gateway. **Wind
realism loses to bilateral composition** — Tsushima composes storms symmetrically. Add ±0.15 rotY jitter on
top (now that the lean isn't fighting a pinned axis) for F6.

**3. Make the accent the biome's ONE burning hue.** In a monochrome storm the lone warm hue must actually
burn: `accent[7]` emissive `0.85 → 1.5`. Grey rock, pale slot, rare burning gold = the whole color story.

## The fairness reef — a boundary LAYER separate from the composition layer

The congregation "breaths" (great for rhythm) re-exposed a lateral-death fairness bug: in an open stretch the
player drifts sideways and dies with no wall. The fix is NOT to fill the breaths with composition (that kills
the rhythm) — it's a **separate boundary layer**: a new `wrackline` micro-family of half-drowned BREAKERS
pinned at inner ~13.5, **step 11, NO comp + NO arrivalPark so it NEVER parks**, and LOW enough (world top <
`laneMinY` 2.5 → propclearance-EXEMPT) to hug the death wall without intruding on the flight band. Its whole
job is a **bright foam collar** — a continuous ribbon of surf that reads "don't fly into the surf" with zero
UI. Composition breathes; the boundary is always drawn. ~24 tris, always-on at step 11 → ~4k band tris.

## Result / determinism
Owner's three complaints addressed in one pass (skewed diagonals + dark carved stone + mirrored V + burning
gold + breaker reef). `skewX`, the mirror, and the material are all PURE / render-only; `wrackline` appended
LAST → `gold-determinism` byte-identical. All green: propclearance (`wrackline` exempt), envcount (band 43.5k),
insts/propao/propfoam/proprun/biomecycle/stormtick.

## Not yet done (Fable backlog)
Skew stormstack/stackgrave (cylinders — less urgent); the water "confetti" foam wants to cluster on the
congregation signal + reef, not sprinkle evenly; consider two authored stormprow variants (F6 at the family
level); watch that warm-sunlit prop tops stay in the stone value family, not a tan hue break.
