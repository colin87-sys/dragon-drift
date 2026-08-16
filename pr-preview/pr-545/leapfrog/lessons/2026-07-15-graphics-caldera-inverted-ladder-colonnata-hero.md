# Caldera overhaul: the inverted light-from-below ladder + the colonnata hero

**What we did.** Started the Emberfall Caldera biome overhaul (biome 3) per
`BIOME-OVERHAUL-PLAYBOOK.md` + `CALDERA-BIBLE.md`. Built the Caldera material SYSTEM and
proved it on the hero prop `colonnata` (a columnar-jointed basalt palisade), flag-gated
behind `?props=v1` (default = new volcanic kit, legacy basalt/vent parked). Fable studio
gate: 3.2 → 4.0 → **4.4 PASS** over three rebuilds.

## The material system (all in `environment.js`, Caldera-OWN — passes the Part B grep)

- **The INVERTED value ladder** (`bakeCalderaLadder`): the light-from-below sibling of
  Frozen's `bakeIceLadder`. Per-face 3-stop vertex-colour bake keyed to world-**DOWN**
  (`d = -faceNormal.y`): down-faces = hot ember belly, up-faces = ash-grey crust,
  verticals = near-black basalt. Frozen keys off world-UP (sun logic); Caldera inverts the
  axis because the lava floor is the light source. **New function + new `_CAL_*` stop
  constants** — never imported Frozen's baker or hues, so the mechanical Part B grep stays
  clean by construction.
- **The self-lit floor**: extended the shared `addPropDetail(mat, ladderEmissive)` with an
  opt-in that folds `vColor` into `totalEmissiveRadiance`, so the hot belly survives the
  ember backlight (vColor alone only modulates DIFFUSE → dies backlit). Own program-cache
  bucket; every existing call is byte-identical (default false).
- **Dedicated `calderaPrimary` (vertexColors ladder, warm emissive base) + `calderaAccent`
  (magma)**, kept SEPARATE from the legacy flat primary/accent[3] so `?props=v1` is
  unchanged. `mergeCalderaParts` (non-indexed merge → ladder bake → AO) is called ONLY by
  the new archetypes; every other biome's `mergeParts` path is byte-identical. Props are
  render-only → gold-determinism byte-identical throughout.

## The reusable lessons (these transfer to the rest of the roster + future biomes)

1. **A dark-mass biome needs the per-face ladder MORE than a luminous one.** Frozen's side
   props lean on whole-body emissive ice; that is the wrong tool for Caldera (a glowing
   mass contradicts "mass is dark, light is a wound"). Without the inverted ladder, dark
   basalt renders flat-black and reads as low-poly clay — the exact r1 failure. The ladder
   is what gives a dark mass a carved, bottom-lit read at zero triangle cost.
2. **The ladder must be gated by HEIGHT as well as normal.** A widened down-threshold
   (to catch the undercut base) also catches a leaning capstone's tipped faces → a glowing
   CROWN, which the theology forbids and reads as a bake defect. Fix: ember stop fires only
   where `faceCentroid.y ≤ 0.30` of unit height AND down-facing. One line; kills the defect
   without touching the waterline seam. (Fable r3 → r4, the single biggest gate lever.)
3. **The belly-bug that hides in the taper sign.** A plinth `CylinderGeometry(rt, rb, …)`
   with `rb > rt` (wider at bottom) slopes its skirt OUTWARD-UP → normals take the ASH
   stop, so the "hot belly" has no geometry to live on. INVERT the taper (`rt > rb`,
   undercut) so the skirt faces down and carries the ember waterline seam. Always sanity-
   check which way a tapered skirt's normals point before trusting a ladder to light it.
4. **Columnar basalt only READS with many slender columns, not few fat prisms.** 4 prisms
   at ~1.7:1 = crates; 6–7 columns at ~3.5:1 = a colonnade. The 150-tri budget trick that
   pays for it: open-bottom shaft (`CylinderGeometry(r,r,h,n,1,true)` = 2n tris, bottom
   buried) + a matching `CircleGeometry(r,n)` top cap (n tris) = 3n per column vs 4n stock
   — and the pentagon caps at staggered heights give the top-down PLAN view (the flying
   game's primary read) a columnar-jointing mosaic instead of a bland mesa.
5. **Break the crest, or it's coursing.** Monotonic descending heights = a machined
   staircase = the banned "no coursing" tell AND structurally Frozen-terrace-adjacent. Use
   a non-monotonic crest with one inversion + one snapped stump; the lean/broken read must
   come from radial x/z OFFSET-stacking, never internal tilt (the `(r,h,r)` scale shears
   internal tilts flat).
6. **The Fable per-element loop is the process, and the studio lies by up to a point.**
   Cloned `propstudio` → `calstudio.{html,mjs}` with an EMBER key rig (low warm sun + hot
   lava-floor up-bounce = the light-from-below signature) + a neutral rig, multi-angle
   (front / ¾ / side-VALUE-on-black / worm's-eye / top-plan / form). Gate each rebuild
   against the specific ranked deltas; the neutral-light frame is the one that cannot lie
   about baked vertex colour (it caught the crown-glow defect). Then re-score IN-CONTEXT
   (in-game, moving, backlit) — the studio's clean even light flatters the prop.

## What it unlocks

The material system + `calstudio` + the Fable-gate loop are now proven, so the remaining
five Caldera archetypes (flowlobe / fumarole / clinker / riftwall / riftfang) reuse the
inverted ladder + `mergeCalderaParts` + the studio directly and should converge faster.
The two glow carriers (flowlobe, fumarole) additionally exercise the recessed-accent glow
address (the magma `calderaAccent` in seams/throats); the shard hazard skin will need the
per-biome material seam extension flagged in the bible (§7 — `hazardMesh` hardcodes Frozen
ice for skinned shards today).
