# Lost Lagoon PR-2: the rotunda hero — two geometry laws for tide-ladder ruins

**What we did.** Built the Lost Lagoon's hero — **the rotunda**: a battered, tide-stained pierced
dome with a quarter collapsed, an interior-only gilt oculus, a flooded jade floor, and a pointed-arch
window. Fable-gated per-checkpoint (harsh critic, hard 4.2 floor); it took **eight studio rounds**
(r3 was a levitating dome on crates → r8 a coherent drowned rotunda) plus an in-context render. Landed
**4.3/5**. 148 tris, gold-determinism byte-identical (props are render-only). The hero establishes the
laws the rest of the Lagoon roster (arcade, piers, campanile, sentinel) inherits. Two reusable laws
this hero minted, both mechanical, both will recur on every tall-walled tide-ladder archetype:

## Reusable laws

1. **The position-keyed ladder needs a horizontal EDGE LOOP at every band boundary, or the waterline
   quantizes to a diagonal sawtooth.** `bakeTideLadder` colours per-FACE by triangle-centroid height.
   A wall quad that spans the band boundary (e.g. y 0→0.6 across a jade/bleach line at 0.22) splits
   into one jade triangle and one bleach triangle *along its diagonal* — the "level" tide line reads as
   a row of painted-bunting teeth. Fix costs zero net tris: build the wall in stacked COURSES with a
   ring of vertices AT the band height (y0→0.22 course = all-jade centroids, y0.22→0.6 course =
   all-bleach), so every triangle sits inside one stop. The dead-level jade line IS the biome
   signature; a per-face ladder can only deliver it where the mesh has an edge loop there. (Any
   Caldera/Frozen-style per-face-normal ladder is immune to this; only the POSITION-keyed one hits it,
   and only on faces tall enough to straddle a boundary — walls, piers, towers.)

2. **Removing a weld course silently un-welds every interface it was carrying.** The dome sat on a
   full-circumference cornice course that welded it to the drum. When we broke the cornice into
   asymmetric stubs for ruin storytelling (correct call), the cornice-FREE sectors lost their weld —
   the dome rim now floated 0.02 above the drum top around most of the circumference, reading as a
   hovering dome over a background slit. It survived THREE rounds because a camera yaw only ever showed
   half of it and we kept mis-attributing it to the wound overhang. The law: **when you break a course
   for storytelling, re-weld the interfaces it was carrying.** Here the fix was to drop the whole dome
   assembly 0.04 so its rim sinks BELOW the drum top at every sector — the drum edge occludes the
   junction. Occlusion is a sturdier weld than tangency: it survives any camera, where a
   touching-but-coplanar seam does not.

## Supporting technique + process notes

- **Reverse-winding inner lining** kills the see-through paper edge at a collapse for ~cheap: a
  concentric shell at 0.93 scale over the same partial-sphere arc, with its index triangles reversed
  (`for i: swap idx[i+1],idx[i+2]; computeVertexNormals()`) so it faces inward. Looking into the wound
  shows a solid stone bowl + a rim lip at every broken edge, from any yaw. mergeLagoonParts'
  `toNonIndexed()` preserves the flipped winding.
- **Pointed arch = spandrel fills, not a lintel.** To read a lancet void, fill the two TOP CORNERS of
  the opening and leave a central void that peaks UP to the wall top. Putting a downward apex on the
  opening's underside makes a valley (and, if the peak pokes above the parapet line, a fin) — the peak
  must point INTO the mass. +2 tris.
- **Aim the wound at the judging cameras.** All propstudio cameras sit at +x/+z; a wound aimed at
  (x−,z−) is invisible in front/¾/side/worm's-eye and only shows in plan. Compute the phiStart so the
  dome's missing quarter and the drum's open sectors both face ~+z (the studio front + the in-game
  down-lane approach are the same axis).
- **Withheld gilt reads from the worm's-eye through the wound.** The interior-only oculus gold is seen
  as the player approaches below and looks up THROUGH the collapse; extend the gilt frustum DOWN into
  the interior so the low-oblique catches it. Never an exterior face.
- **A default-off `?hero=<archetype>` debug seam** (pin yaw down-lane + strip biome 0 of other
  archetypes) is how you shoot the bar-setting in-context render when the hero is a sparse,
  random-yaw prop lost in legacy placeholder clutter. Determinism-unsafe by construction (it skips the
  rnd() rotY init), so it must be absent-by-default; the shipping path stays byte-identical.

## What it unlocks

The Lagoon now has a proven hero and a frozen law-set: the tide-ladder edge-loop rule, the
weld-course rule, the reverse-lining, the spandrel arch, the wound-aim, and the hero-pose render seam.
PR-3 (the roster) builds on all six. The one item riding into PR-3 is the biome-0 COMPOSITION —
biome 0 still has no arrival-park / congregation rhythm (the `arrivalPark` gate at env ~1638 is inside
the Caldera-only block), and the legacy placeholder kit (`biomes:[0]`/`[0,1]`, never migrated to a
`lagoonOld` flag) still populates it. Wiring the Lagoon composition + migrating the legacy kit is the
next increment; the hero geometry is done.
