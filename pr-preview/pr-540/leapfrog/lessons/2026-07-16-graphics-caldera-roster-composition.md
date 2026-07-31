# Caldera overhaul: the full 6-archetype roster + the composition engine

**What we did.** Completed the Emberfall Caldera (biome 3) prop roster and its composition
placement, on top of the inverted-ladder material system (see the sibling hero lesson).
All six archetypes cleared the Fable per-element studio gate (4.2–4.4); the in-context
composition gate scored the frame at 3.8 and drove a reserved-stage + fairness fix.

## The roster (six roles, six unrelated volcanic outline families)

| archetype | role | studio | glow |
|---|---|---|---|
| `colonnata` | HERO — columnar-basalt palisade | 4.4 / 4.3 in-ctx | none (dark mass thesis) |
| `flowlobe` | LOW REST — pahoehoe tongue | 4.4 | fire carrier 1 |
| `clinker` | FOIL — aa rubble | 4.3 | none |
| `fumarole` | MID — cinder-cone cluster | 4.4 | fire carrier 2 |
| `riftwall` | MASSIF — caldera rim | 4.2 | none |
| `riftfang` | TALL PUNCTUATION — volcanic neck | 4.3 | none |

## Reusable lessons (transfer to the next biome overhaul)

1. **The glow carriers must put fire BETWEEN the crusts, not ON them.** flowlobe's first
   pass drew magma strokes on the crust top → they read as a RUNE / LED strip (a clean
   crossing pattern the eye names). The fix that scored 4.4: a glowing magma CORE plate
   UNDER dark foil crust islands with gaps at their joints — the fire shows only through
   the seams + a thin molten rim (organic, recessed, walled by construction, yaw-proof).
   Same trick for fumarole's throat: an OPEN-TOPPED cone (openEnded) over a recessed magma
   pool — a closed cap hides the throat; open, it's a hot pool from above, rim-occluded
   from the side (the withheld-glow reveal).
2. **A dark FOIL material (no ladder, no glow) is a first-class kit member.** clinker (the
   foil) and flowlobe/fumarole's crust use `mergeCalderaParts(parts, {foil:true})` — it
   skips the ladder bake and uses a flat dark warm-basalt material. Without it the inverted
   ladder auto-glows every down-face, so a rubble pile or a cinder cone lights up where it
   must stay dark. The ration (glow on exactly 2 of 6 floor-hugging forms) is the identity.
3. **Backdrop-class props read WIDE via place(), not geometry.** riftwall built tall+narrow
   in unit space rendered as a totem; the glacierwall pattern (LARGE r + SMALL h) stretches
   the same stacked courses WIDE and squashes them LOW into a horizontal-banded wall. And
   interpenetrate every course ≥20% or the (r,h,r) squash opens see-through daylight gaps
   in the massif. (Add a squashed-preview frame to the studio for backdrop props — the
   colonnata proportion lesson in reverse.)
4. **The tall landmark must BRACKET the reserved boss band, not tower into it.** riftfang at
   top ~65u stood in the central-third horizon band (where ASHTALON's silhouette lands) in
   5/5 cruise frames even placed at |x|≥56 — because a far tall object projects to the
   vanishing point. Fix: trim its height (top ~30–43) AND push it further out (|x|≥62) so it
   frames the band's edges. The reserved-stage rule (§3.7) is a HEIGHT + AZIMUTH constraint,
   not azimuth alone.
5. **The composition is a render-only, determinism-safe engine.** `calderaComp` (a
   raised-cosine congregation weight, 4 periods/biome) + per-archetype `comp.floor` parks
   off-beat instances into archipelagos separated by open mirror (negative space = the awe
   grammar), and the `arrivalPark` flag + a SEAM-RELATIVE predicate keep the tall/mid
   families off the first ~220m so the biome cut reads as burning water + a first-chord
   colossus. All PURE (no rnd, evaluated after the rotY init) → gold-determinism byte-
   identical. The seam predicate MUST fold the incoming-crossfade tail (biomeIndexAt flips
   to the next biome ~biomeTransition/2 before the block boundary) as a negative seamDelta.
6. **propclearance must be widened per overhaul biome, and comp `sMax` eats lane margin.**
   Adding a composition size-scale (sMax up to 1.12) scales props UP at render, shrinking
   the inner-edge clearance — so `place()` must couple x to (measured ρ · sMax), not ρ
   alone. Widen `SCOPE_BIOME` to the new biome and re-tune every coupling from the tool's
   measured ρ, not a hand estimate (fumarole/flowlobe/clinker all invaded the ±14.5 lane
   on the first pass).

## What it unlocks / what remains

The prop layer of the Caldera overhaul is complete and verified (envcount, propclearance,
gold-determinism, biomecycle, bulletcontrast all green). The in-context composition gate
(3.8) named the remaining levers as SHARED-SYSTEM atmosphere polish — meter the over-poured
god-ray fan (same fan every frame greys out the spires and flattens depth), deepen the seam
fog transition, restore stronger left/right flank alternation — plus the obstacle-skin
(`SKIN_BUILDERS[3]`) and geyser-presentation hazard layers. Those are the next phase; the
light grammar ("the best in the game") is already there, so it's about putting the script
fully under it.
