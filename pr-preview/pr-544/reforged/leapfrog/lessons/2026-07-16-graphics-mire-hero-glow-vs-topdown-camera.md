# Lumen Mire PR-3: a down-facing "under-brim" glow is invisible to a top-down flying camera — the hero needs a camera-facing exception

**What we did.** Built the Lumen Mire hero `glowcolossus` (a colossal giant-mushroom monument) +
the `bi===4` composition engine (arrival-park, congregation weight, hero apex-lock, THRUMSWARM
easement). The geometry, placement, and composition are headless-verified (148 tris, determinism
byte-identical, propclearance clears via the overhead amendment). But the hero's GLOW took THREE
Fable rounds and is the hard lesson.

## The reusable lesson (this will bite every glow-from-below biome)

1. **"Glow lives under the brim, earned by angle" works for the AMBIENT layer and DIES on a HERO
   landmark — because this game's camera only ever looks DOWN.** The chase cam sits at
   `player.y+4.6` and looks at `player.y+0.5` (~8° down); the player rides ABOVE the cap rim. So the
   view ray at any tall prop is effectively horizontal-to-downward. A recessed down-facing gill dish
   (v40) and even a 33°-down "gill-margin fold" (v41) are BOTH occluded by the cap's own overhang
   from every gameplay ray — proven twice in isolated captures (`heroISO-640`: a dark mound, no glow).
   The under-brim address is beautiful for the mist/water/motes/shelf-fungi, but a colossal LANDMARK
   whose whole job is to be SEEN from across the swamp must put emissive where a downward ray
   terminates: **the TOP of the form, or the water.** Everything else is theology the camera can't
   photograph.

2. **Emissive materials have NO normals — only line-of-sight occlusion matters.** The v41 fold's
   `cos(35°)` facing math was Lambertian thinking applied to a `MeshStandardMaterial` emissive, which
   renders flat from every angle. The fold didn't fail because it faced wrong; it failed because the
   dome stood between it and the camera. When debugging why an emitter doesn't read, check OCCLUSION,
   not facing angle.

3. **The resolution: a hero-only camera-facing exception (Fable v42, "the crown colony").** Seven
   arc-clustered bioluminescent spore-growths on the cap's upper SHOULDER (camera-facing up/out
   convex bumps the top-down ray terminates on), riding a hero-only brighter `mireHeroLiving`
   material (emissive intensity 2.3 vs the standard 1.6). The purity law "cap is dark matter, all
   color under the brim" is amended for the ONE landmark: *"the cap stays dark; life colonizes it"*
   (arc-clustered + size-varied + apex-dark, so it's moss-on-a-standing-stone, never amanita
   polka-dots). The gill fold stays for the below/reflection read. **The deeper law was always "life
   glows; matter drinks"; "all color under the brim" was an implementation detail that met a camera
   it couldn't serve.** Function over purity for the one landmark.

4. **The 2-material cap is per-archetype, so a hero-only escalator instance is free.** `mergeParts`
   caps at 2 groups; the hero swaps its mat-1 (`accent[4]`) for a brighter `mireHeroLiving` after
   the merge (`merged.materials[1] = propMats.mireHeroLiving`) — the hierarchy gap (hero 2.3 vs shelf
   1.6) widens exactly where the value ladder wants it, at zero extra material-group cost.

## The gotcha / what remains UNVERIFIED

**Visual confirmation of the crown-colony reveal is still open.** The build is headless-valid, but
the hero at its clearance-safe placement (|x| 33–40, ~250m at the arrival reveal) renders as a small,
distant, off-flank shape in every capture — and the debug capture tooling can't cleanly isolate a
biome-4 hero (`?hero=` only strips biome 0; set-pieces spawn over it; the stash/park hack is fragile).
**A proper isolated hero-studio render tool (clone `propstudio`/`calstudio`, parameterized for the
Mire key + the real chase-cam pose at controlled distances) is the missing verification harness** —
build it before the next hero-glow iteration instead of fighting in-context captures. Open questions
the owner's fly-test / that tool must answer: does the colony cluster read as a glowing landmark at
60–250m, or does the hero need to be bigger / more central / the colonies larger+brighter?

## What it unlocks

The camera-facing-glow principle + the `mireHeroLiving` escalator + the whole composition engine are
in place; once the hero read is confirmed/tuned, `shelfbole` (the mid glow-carrier, under-brim is
fine for it — it's small and the reflection carries it) and the light-lanes finish PR-3. Full rulings
in scratchpad files 40/41/42; the studio-vs-real-camera gap is the headline transferable lesson.
