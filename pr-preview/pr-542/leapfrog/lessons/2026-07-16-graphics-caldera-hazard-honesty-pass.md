# Caldera hazard AAA pass: box→lumps, painted-panel→crack-network, LED→wound

**What we did.** Took the three Emberfall Caldera in-lane hazard skins (`SKIN_BUILDERS[3]`
— BEAM/COLUMN/SHARD) from a first-pass Fable FAIL through to a shipped **3/3 gate pass**
(COLUMN 4.3, SHARD 4.3, BEAM 4.2) against a hard 4.2 floor and the owner's "premium/AAA or
it's a fail" bar. Colliders stayed byte-identical the whole way (gold-determinism proves the
skin is pure fiction); all three ≤150 tris.

## The three failure modes we killed (each a reusable pattern)

1. **COLUMN — "reads as a box."** Axis-aligned `BoxGeometry` segments read as a machined
   box no matter the yaw. Fix: build the vertical hazard from overlapping **jittered
   icosahedron LUMPS** (chamfered faceted balls) — on-axis CORE lumps with `Rx=Rz` carry
   the collider (the collider circle stays inside the inscribed ellipsoid regardless of
   yaw, so coverage stays a sound concentric-radius test: `_ICO_INR·Rc·√(1−(dy/(_ICO_INR·Rv))²) ≥ R`),
   off-axis octa lumps + a sheared crown break the silhouette. The box read dies instantly.

2. **SHARD — "painted panel" → "glowing ball" → "D20 with trim" → cooling bomb.** The honest
   low-poly crack network without CSG is the **breadcrust**: one dark plate per core FACE,
   shrunk toward its centroid and pushed proud of an ember CORE, so the ember shows ONLY in
   the channels the shrink leaves along every edge. Two hard-won refinements:
   - **Dark must DOMINATE.** A full-size ember core with sparse dark scabs reads as a molten
     ball; invert it — the dark plates are ~80% of each face, ember only in the seams.
   - **A uniform edge-trace reads as a wireframe D20.** Give the network HIERARCHY from a
     SMOOTH spatial field (low-freq sines of the face centroid, so neighbouring faces agree):
     ~¼ faces HOT (bright core + WIDE channel) CLUSTER into one connected branching crack
     PATH; ~half SILENT (plate shrink ≈0.99 → touches its neighbour, seam dies completely,
     crust-on-crust with no line); the rest tight rust hairlines. Then jitter vertices HARD
     so the silhouette stops being platonic. Random per-face selection scatters; a smooth
     field is what makes the hot faces form a *path* instead of confetti.

3. **BEAM — "aluminium boom with LED ticks."** Two independent fixes:
   - **Distinct fallen drums, not a machined tube:** CAPPED hex drums (the hex cross-section
     IS the columnar-basalt identity) of mixed length, rolled to ~±30° (an EDGE up — never a
     face flat to the key light, which was lighting a bright "sticker" facet), STAGGERED in
     height so the top silhouette zigzags with a notch at each junction.
   - **Fire as a wound, not a decal:** a gradient LENS fissure (spine verts white-hot, tips
     near-black, jagged/skewed) via a **vertex-emissive-fold material** (`withLadderEmissive`
     × per-vertex colour = hot-core→dark-rim falloff on a flat-fill budget), nestled in a dark
     SOCKET and overhung by a BROW LIP whose underside is tinted faint-warm. That warm spill
     — the glow *illuminating its surroundings* — is the pixel-level difference between a
     wound and an LED, and it survived three rounds of "still an LED" until we added it.

## The load-bearing constraint the critic can't override

Fable kept asking the BEAM's breaks to be "a real V-gap, a wedge of missing mass" that
changes the outline. **A visible gap in a SOLID horizontal hazard is the fairness failure
the whole coverage system exists to prevent** ("looks passable but kills"). The reconciliation:
put the silhouette event ABOVE the collider band (height-staggered drum tops → notch in the
TOP profile) while the solid collision mass stays continuous. State the invariant back to the
critic; a good critic accepts it (it did) and the delta reframes to material honesty.

## Reusable specifics

- **Vertex-emissive gradient on a budget:** `withLadderEmissive(mat)` multiplies
  `totalEmissiveRadiance *= vColor.rgb`. A 4-tri `PlaneGeometry(w,h,1,2)` with white-hot spine
  verts and near-black tip verts gives a real fissure gradient for ~nothing.
- **Outward-only facet jitter is coverage-safe.** To add crust value-noise to a
  collider-bearing drum without a fairness re-derivation, jitter radially OUTWARD only
  (`x *= 1+|n|`) + free axial nudge — the mesh only ever grows past the analytic coverage
  test, never shrinks below it.
- **Vertical hazards keep the ember belly; horizontal ones must not.** The world-DOWN ladder
  floods a horizontal underside → raise `frostT` (~0.74 on the COLUMN) so ember only rim-lights
  the strongest overhang + the molten root, and use the DARK stop set on the BEAM.
- **Global albedo:** the "mass is DARK basalt" theology dies if the crust stop is a light
  purplish grey — dropped `_CALH_CRUST` 0.20→0.115 warm charcoal (R>G>B, no blue bias) and the
  whole set stopped reading mauve/lilac in one edit.

## Process

Fable-art-director-per-checkpoint, judged in the shipping ember-dark light on 4-panel sheets
(¾ / head-on / side / collider-ghost), one SendMessage-resumed agent so each re-gate remembers
its prior critique and scores the *delta*. It scored the pixels, not the changelist — every
round it caught what the geometry actually did, not what the message claimed. Trust that: when
it says "still an LED," the emissive really is sitting on the surface.

## What it unlocks

The next biome's hazards have a proven per-failure-mode recipe: box→faceted-lumps (coverage via
inscribed ellipsoid), painted-panel→breadcrust-plates-with-smooth-field-hierarchy, LED→gradient-
lens-fissure-with-warm-brow-spill, plus the "silhouette event above the collider band" trick for
any solid hazard a critic wants to visually break.
