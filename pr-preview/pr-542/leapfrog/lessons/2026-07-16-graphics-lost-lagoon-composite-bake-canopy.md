# Lost Lagoon composite prop: the per-part bake system + the parasol-not-mushroom canopy

**What we did.** Built `rootbastion` — the Lost Lagoon's mid mass: a slumped masonry chunk being
swallowed by a strangler fig (the theology's second claiming, enacted). It's the first prop that mixes
material vocabularies — tide-laddered stone AND olive foliage in one archetype — so Fable pre-assessed
the material system before geometry, then gated the canopy hard (rb3 3.7 → **rb7 4.2/5 PASS**). Three
roster archetypes now shipped (lilyraft 4.3, wrackstone 4.3, rootbastion 4.2). Several reusable wins.

## Reusable systems + laws

1. **The per-part bake TAG — how to hold two bakes in one material/draw group.** A single prop needed a
   tide-laddered stone mass (jade waterline / bleached crown) AND olive foliage. The wrong answers:
   a normal/height *heuristic* (misclassifies — paints stone crowns mossy and high roots bone-bleached);
   a *dedicated foliage material* (burns the mat-1 gilt accent slot, adds a draw group, and the bible
   says foliage rides the SAME `lagoonStone` material). The right answer is a per-part TAG resolved at
   merge: a part carries `{ mat:0, geo, bake:'lily'|'root' }`; `mergeLagoonParts` splits the mat-0 group
   into subsets by tag, **bakes each subset separately, THEN merges** (per-vertex colours survive the
   merge). One material, one draw call, gilt slot free, author-declared (deterministic). The general
   law: **when one object needs two surface treatments, sub-merge by an authored tag and bake before the
   final merge — never classify after.** `opts.bake:'lily'` is just sugar for "all parts tagged" so
   lilyraft is unchanged.

2. **`bakeLilyFoliage(geo, upThresh)` — one bake, two reads via a threshold.** Leaves want broad olive
   tops (`upThresh 0.35`); roots/branches want to read DARK (shadow-green, olive only on true top-curves
   → `upThresh 0.75`) so they strangle the pale stone (the Ta Prohm contrast — dark roots on bone stone).
   A parameter, not a new bake — the `bake:'root'` tag maps to the high threshold. Adding a *read* to a
   baking system is often a threshold, not new code.

3. **The parasol-not-mushroom canopy language (5 reusable moves).** A flat foliage canopy on a prop
   defaults to reading as a mushroom cap / hovering table / — worst — a building-sized lilyraft twin from
   the shipping top-down (an in-family silhouette collision). The fixes, reusable for every canopy in the
   biome (rootbastion now, sentinel moss / campanile fig-crown later):
   - **SHRINK + OFFSET** the canopy off the trunk axis (down-lane) so the plan shows STONE beside green,
     never a full green disc. Concentric + full-footprint = the lilyraft twin.
   - **DRAPE one pad onto the stone** (its edge sinks into the crown — occlusion weld). One contact point
     is what turns "tree beside ruin" into "fig ON ruin." Kills the hover.
   - **BREAK THE SLAB**: ≥2 pads with Δheight ≥0.10, distinct tilts, elliptical `sx≠sz` — two masses in
     silhouette, and the value split (one pad's sunlit top vs the other's shadow underside) reads layered.
   - **SQUASHED CLOSED CONE, not a circle-sandwich**: a ~10% apex rise kills the dead-flat table and gives
     the rim taper thickness, with NO grazing slit (the two-circle sandwich shows background through its
     gap at grazing angles — the lilyraft-lesson slit, again).
   - **WIND-FLAG the shear consistently** (all pads offset/tilted the same way, matching the biome's
     down-lane aim) so it reads blown, not decorative.

## Supporting notes

- **`frustumBetween(p0,p1,r0,r1,seg)`**: a tapered frustum oriented along an arbitrary segment (quaternion
  from `setFromUnitVectors(Y, dir)`), for arcing organic ribs that `xform`'s axis-aligned rotations can't
  place. Chain several for a curved root over a stone face. The GRIP law: a rib must touch the stone along
  its run (small standoff), start inside the trunk, taper down, and FLARE at a foot entering the water —
  else it's a tentacle (arcs free) / pipe (constant width) / LED-conduit (ends mid-air).
- **THE PLUMB-TIDE LAW (mintable):** any tide-laddered archetype stands PLUMB — `tilt:0` explicit. The
  jade band is a level water stain; an instance tilt rotates the baked band into a physically-impossible
  diagonal. All slump lives in the geometry ABOVE the waterline course, never in the instance tilt. (This
  is the deeper reason the rotunda ships `tilt:0`.)
- **`ConeGeometry(_,_,n)` costs 3·n tris** (side = n quads even with a point top = 2n, + base fan n), NOT
  the flat-cost a circle-sandwich implies. Price cones at 3n in build sheets; pay for a round canopy by
  dropping thin sub-parts' segment counts (root frusta 4→3-seg is imperceptible at root thickness).
- **The `?hero=` seam is a comma-list** (`?hero=a,b,c`) so a mid-mass can be judged in company —
  bridging the scale gap rest-note → mid → hero is only verifiable with all three in frame.

## What it unlocks

The composite-bake system + the canopy language carry the rest of the vegetated roster and any future
organic-on-stone prop in any biome. Next: `arcade` — and the firewall lesson is at FULL strength there:
the arcade is an arch vocabulary and so is the SINKING GATES hazard, the riskiest silhouette rhyme in the
whole kit; silhouette-diff them at pre-assessment before a line of geometry.
