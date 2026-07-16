# Lumen Mire PR-2: the depth + canopy substrate + the overhead-band clearance amendment

**What we did.** Built the Lumen Mire (biome 4) depth/roof substrate behind the `?props=v1` flip
(`mireNew`/`mireOld` idiom; legacy glowcap/spirevine parked). Four near-black mat-0 archetypes —
`canopywall` (distant scalloped-lobe massif), `reedveil` (near feathered-reed comb), `boleveil` (mid
drowned-bole thicket), and `drape` (the overhead "weeping-titan" ceiling) — plus a new opt-in
`overhead:{}` amendment to `propclearance`. Fable-directed (pre-assessment file 30). Owner brightness
lock held: PR-2 adds DARKNESS (mass, roof, depth), near-zero new emissive. All headless green.

## Reusable lessons

1. **The Canopy Law ("the sky is never composed") is deliverable WITHOUT per-instance altitude — by
   geometry + projection, not placement.** The engine seats every prop at y=0; there is no altitude
   field. The roof is a `drape` archetype built TALL (h 43–51) whose crown+fringe sit entirely above
   unit y 0.66 → world y ≥ 28, above the flyable ceiling (laneMaxY 22) and the worst-case chase cam
   (~26). Perspective does the "over the lane" work placement can't: at cruise a crown at world 28–34
   enters the top-of-frame band across a ~z window, so at a dense enough step (19) the top corners are
   ALWAYS fringed while a center gap breathes (stars/motes) — the law is ≥25% occlusion, not a solid
   ceiling. Keep the roof as LOW as legal (world ~28, smaller h) so it enters frame at a nearer z → a
   denser, more reliable top-band window. A too-high crown (large h) only clips in at far z and reads
   sparse.

2. **The overhead-band `propclearance` amendment is the enabling tool change.** `propclearance` was
   2-D (ρ = max XZ radius over ALL vertices, height-blind), so a crown of ρ≈1 would fail the 14.5 lane
   floor instantly even though it's 28m up. The amendment: an archetype declares
   `overhead:{unitY,minWorldY}`; the tool measures lane ρ from vertices **below unitY only** (the
   slender trunk, ρ≤0.10 → passes easily), caps the lean term at `laneMaxY` (the crown's lean above
   the flyable band is irrelevant), and separately asserts `unitY·h ≥ minWorldY` across the place()
   lattice. Opt-in — every non-overhead archetype is byte-identical. **The build-time trap:** EVERY
   crown/fringe vertex must stay above unitY or it silently re-enters the lane ρ. A squashed dome lobe
   of half-height `s·sy` centered at y_c has its bottom at `y_c − s·sy`; that must be ≥ unitY. Check
   the taper/half-height math before trusting the amendment (a widened crown dipped a lobe below 0.66
   and blew clearance until the centers were raised).

3. **Depth planes are radial thickets, not billboards.** A flat plane is invisible edge-on under the
   recycler's random rotY. Each depth layer (`reedveil`/`boleveil`) is a wide, thin-in-silhouette
   cluster of parts spread radially in x AND z so it stamps a flora cutout from every yaw. Three
   distance bands (near reedveil |x|22–34, mid boleveil |x|36–58, far canopywall |x|60–96) sample
   three points of the fog curve, so aerial perspective (dark→amber-hazed) is FREE — never per-layer
   tint. A dark-on-dark roof/thicket against the warm-dark sky reads as occlusion by contrast, and is
   exactly the "contrast over brightness" night the owner locked.

4. **Backdrop massifs float on the ground-mist by NECKING the geometry, not by a base slab.** The
   `canopywall` lobes occupy unit y 0.45–1.0 over a narrow root-stem (≤0.16 unit radius) that the PR-1
   height-fog severs — a crown-line on fog reads as canopy; a full-width base reads as a cliff (the
   Frozen/ridge lesson). `foam:false` on every fog-line/overhead family (a surf collar off-lane is a
   bright artifact).

## The gotcha

The `?biome=4` polarity: the NEW kit is default-ON (`mireNew = PROPS_V1 ? [] : [4]`), so the new
canopy/depth shows at plain `?biome=4&debug`; `?props=v1` restores the LEGACY glowcap/spirevine. (Fable's
pre-assessment doc wrote the audit URL as `&props=v1` — that's the legacy set; the new kit is the
no-query default.) And register all four archetypes LAST in `ARCHETYPES` so no existing band's
render-rnd draw order shifts (the sungate precedent) — props are render-only, gold-determinism
byte-identical throughout.

## What it unlocks / what remains

The mire now reads deep, enclosed, and alive with near-zero emissive props — the dark stage the PR-3
hero (the Glow-Cap Colossus) lights up. **Carried into a follow-up before the PR-2 gate closes** (both
from the PR-1 gate file 23): mote variance (size/opacity jitter + firefly pulse + fog-attenuate far
motes + down-lane drift-current) and the cool upper-corner-streak clamp (the residual aurora
curtain/beam layer additively catching light over the near-black zenith in biome 4 — zero/clamp it).
Full plan in `reforged/LUMEN-MIRE-BIBLE.md`; PR-2 direction in scratchpad file 30.
