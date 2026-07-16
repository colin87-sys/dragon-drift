# Mire ensemble Stage 1: the fly-through arch hero + a centered-gate clearance model

**Context:** Owner chose to build ALL FOUR obvious-glow candidates as an ensemble ("variance"),
and had Fable (art director) compose them into a scene (roles/depth/tiers, scratchpad 51). Stage 1
is the hero: `glowarch`, a colossal glowing root-arch you fly THROUGH. `glowcolossus` (the retired
under-brim mushroom) is parked; glowtree/glowshroom/glowbloom renamed + parked for their stages.

## Reusable wins

### 1. A per-vertex GLOW ladder (`bakeMireLadder`)
The Caldera/Lagoon ladders carve a DARK mass (diffuse, normal- or height-keyed, non-indexed
per-face). The Mire needed the opposite: a vertical value gradient on the GLOW so a luminous hero
reads core→bloom→dark instead of flat blown-amber tape (AAA-PIPELINE cheap-tells #1/#3/#6). Built
`bakeMireLadder` = **per-vertex** (indexed-safe, no toNonIndexed needed) smooth gradient by unit
height (apex white → mid gold `0xd8a860` → base dark `0x604c28`), baked on the whole merged
geometry; the mat-1 group reads it via a new `mireHeroLadder` material (vertexColors + ladderEmissive,
intensity 2.3), the dark mat-0 group uses a vertexColors-off material and ignores the attribute
(the glowcolossus/lagoon shared-geometry precedent — so the dark crown/roots/knuckles stay dark even
where the ladder is bright). Reusable for every ensemble hero.

### 2. A CENTERED-GATE clearance model in propclearance (the gotcha)
propclearance's inner-edge model is `|placeX| − facingReach·r` — it assumes a prop OFFSET to one
side. A fly-through arch is placed at **x:0**, straddling the lane, so that formula gives
`0 − reach = −33` = a false "invades lane" FAIL. The arch is the repo's first centered gate. Fix: a
`gate:true` flag + `apertureHalf` in `propClearanceData` (min |x| of the sub-apex leg geometry = how
close the legs approach the centerline), and propclearance measures `inner = apertureHalf·r·sMax` for
gates. Composes with the existing `overhead:{}` amendment (the over-lane crown is exempted from the
inner-edge audit and asserted above `minWorldY`). Arch clears at 17.0m ≥ 14.5 floor + ≥16 gate-veil.
**Rule:** any future centered straddling prop needs `gate:true`, not the offset model.

### 3. `heroSolo` — one gate, not a mirrored twin
An on-lane hero (place x:0) exists on BOTH the +side and −side slot streams → two arches z-fight at
x0. `heroSolo:true` parks the −side twin in the `bi===4` hero branch. One clean gate per kept peak.

## The verification gotcha that ate the most time
The arch was verified present (probe: one centered instance, scale 43, y≈0, material bright emI 2.3,
visible, not culled) but **invisible in normal in-game frames**. Cause was NOT the arch — it was
(a) the debug-mode game camera OVERRIDES manual `camera.position`/`lookAt` every RAF even at
`timeScale:0` (so scripted teleport/freeze/manual-camera framing all silently snap back to the chase
cam — don't trust them), and (b) the dense PR-2 dark canopy occludes the hero at read distance. The
decisive test: hide every InstancedMesh except the arch band, then shoot — the arch rendered
beautifully and its black-mirror reflection twinned it into the intended lozenge/eye money shot. So:
**to prove an in-game hero renders, isolate it by hiding other instanced meshes; don't fight the
debug camera.** The occlusion itself is a real composition finding (the gate-clear rule must extend
to the PR-2 trees near a kept arch peak) — handed to Fable's Stage-1 checkpoint to rule on.

## Gates (all green)
gold-determinism byte-identical · envcount all budgets green (glowarch 132 tris) · propclearance all
clear (arch aperture 17.0) · biomecycle 11/11 · bulletcontrast clean · insts 22/22 · 0 console errors.

## What it unlocks
The hero + the ladder + the aperture model are the substrate for Stages 2–4 (world-tree beacon,
mushroom carrier, bloom scatter). Next: Fable's occlusion ruling, then Stage 2.
