# A side prop must never rhyme with a hazard skin's silhouette

**What we did.** Built `wrackstone` — the Lost Lagoon's bare no-glow dressed-rubble foil (the rest note
whose silence makes the hero's gilt earned). Fable pre-assessed it, and at the post-build checkpoint
caught a defect that was invisible from the build sheet: the first build's **tall capital-topped column**
silhouette was almost identical to the **PR-4 PILLAR hazard skin** (a slumped temple pier with a broken
capital crown). Rebalanced to a low ~2:1-wide rubble heap with a proud capital-STUMP; shipped 4.3/5.

## The reusable law

**Every biome has two stone vocabularies — harmless scenery and lethal hazards — and the player learns
to read danger by SILHOUETTE. A side prop whose silhouette rhymes with a hazard skin poisons that
read.** wrackstone spawns ~90 copies off-lane per band; if each previewed the pillar-hazard shape, the
player's "capital-topped pier = deadly" reflex would fire on ninety harmless things, and then fail to
fire on the one that kills them. The rest note must be unmistakably NOT a collider at a glance.

Concrete guards, checkable at pre-assessment and at the studio gate:

1. **Before building any side prop, list the hazard skins in the same biome and diff their silhouettes.**
   For the Lagoon the in-lane skins are drowned footbridge / drowned pier (coursed capital-topped pier) /
   severed bell. wrackstone shared the pier's tall-coursed-capital profile → collision. The fix was a
   PROPORTION move (one course not many → a stump, not a tower), not a detail move.
2. **Give scenery and hazards different silhouette FAMILIES, not just different details.** A hazard that
   is tall + vertical + repeated wants its harmless cousins low + horizontal + scattered. Here: the tall
   slot belongs to the aperture monuments (campanile); the foil owns the ground.
3. **The story can survive the silhouette change.** "A broken column" stayed — as a fallen run of drums
   plus a capital-stump in a wreckage field, instead of a standing shaft. Same fiction, different
   silhouette family, no rhyme.

This is a cross-biome law: any biome with hazard skins (all of them) needs its scenery kit silhouette-
diffed against its hazard kit. Cheapest to catch in the Fable pre-assessment; a build-time catch (like
this one) costs a full revise round.

## Supporting notes (wrackstone specifics)

- **A separate flat CircleGeometry "cap" reads as an edge-on sliver fin from grazing angles.** Capping an
  openEnded drum's break end with a stray disc left a thin paper-shard sliver in the ¾/worm's-eye tiles.
  Fix: use a CLOSED cylinder (both hex ends native, +6 tris) and occlude the unwanted end by sinking it
  into a neighbour — occlusion beats a bolted-on cap (the rotunda weld-course lesson again).
- **Lying-drum break-face read: 5-seg is boxy, 6-seg says "column slice" — but only if the round face
  addresses the camera.** Orient a fallen drum so its circular end faces front/¾; a drum seen only in
  profile is just another box. The round face + the slip to the next drum is the whole "fallen column"
  sentence.
- **Sub-waterline geometry is free in-game (the mirror occludes below y=0) but exposed in the waterless
  studio.** Keep resting masses' undersides at y≥0 anyway so the studio archive reads clean and a future
  reviewer isn't chasing a phantom shard.
- **The `?hero=` debug seam now takes a comma-list** (`?hero=rotunda,wrackstone`) so a rest-note can be
  judged in-frame beside the hero — the only way to gate "earned silence" is with the gilt in shot.
  Stays determinism-unsafe and default-off (it skips the rnd() rotY init).

## What it unlocks

wrackstone ships at 4.3/5 (118 tris); the PR-3 foundation pair (lilyraft + wrackstone) is complete, both
gated ≥4.2 in two rounds each. The silhouette-firewall law now applies to every remaining Lagoon
archetype (arcade vs the Sinking-Gates hazard; rootbastion/campanile vs the pier) and to every future
biome's scenery-vs-hazard kit. Next: `rootbastion` (reuses the lily foliage bake for its canopy).
