# Tempest richness — "passes the gate" ≠ "grind-worthy": organized RANKS + carved DEPTH

**What happened.** The Tempest body cleared a Fable gate against the owner reference on
silhouette+color — and the owner still bounced it: *"look how gorgeous and detailed the Revenant is
vs its reference. Now look at your work."* He was right. A silhouette+value PASS is the FLOOR; the
Revenant reads premium because it has ~9 organized geometric detail systems on the body alone
(vertebrae, ribs, keel, scapulars, pelvis, raptor legs+talons, orbit rims+sockets, teeth, gap-drums)
and CARVED depth everywhere. My body had **zero** geometric ranks — every "detail" (the chevron
seam, bolt glyphs, value bands) was MATERIAL ASSIGNMENT painted on one smooth 654-tri loft. Paint
reads once then dies; there's no shadow line, no occlusion, no silhouette event.

**THE LOAD-BEARING RULE (re-confirmed from `2026-07-10-premium-richness-organized-ranks.md`):
perceived craftsmanship = NUMBER OF ORGANIZED DETAIL RANKS, not triangle count.** A rank = ONE
authored repeating unit laid at a fixed pitch along a path. The fix that took the Tempest body from
"smooth toy" to "crafted drake" was adding 7 ranks (654 → ~1080 tris), each a cheap repeated unit:
1. **Dorsal scute + crest ridge** — the single biggest win. A rank of peaked scutes + crest blades
   down the spine turns the bare-tube dorsal (which is ~100% of the rear-chase view) into a SERRATED
   silhouette rank. Detail where the money camera looks beats detail on the belly (which faces away).
2. **Structured belly** — the identity glow converted from PAINT to CARVING: raised armor plates
   over a dark recess base, recessed gutter walls around each plate, the bolt as a dark recessed
   channel, the seam a physical step. "Each identity feature must have a geometric edge/step/gap, not
   just a material boundary" is the audit that separates craft from a decal.
3. **Carved storm-heart socket** — rim ring at the surface + a floor sunk inward + a lit outward lip
   (the Revenant orbit pattern), ember at the mouth behind the lip. The brightest point stopped being
   a floating gem and became a lantern in a housing.
4–7. Lapped shoulder/haunch armor plates (standoff gap = shadow), flank scale-shingle rows, real legs
   (teardrop thigh + knee + ankle + 4-tri pyramid talons + hip cowl — killed the stick-limb/single-tri-
   claw failure), throat gorget bands.

**CARVED DEPTH is the single biggest "crafted vs smooth" lever, and it is GEOMETRY not light.** Every
rank carries a dark-floor-plus-lit-rim recess: the scute under-strip gap, the belly gutter walls, the
socket floor, the plate standoff gap. Depth comes from a piece of geometry occluding another (a rim
in front of a dark wall), never from a value painted on a continuous surface. This is what my smooth
loft fundamentally lacked and the Revenant has on every element.

**The batching discipline that keeps it cheap:** ONE shared per-material accumulator (`push(mat,
...tris)` into a `Map`), every rank pushes into it, then one `flatTriMesh` per material instance at
the end → all 7 ranks add only a handful of draws (≤~12 for the whole torso). Concatenating triangle
arrays IS the merge — no `mergeGeometries`. Keep the flare/pulse material instances
(`bellyCore/Mid/Edge`, `crest`, `heartCore`) unmerged with anything else — the flare system lives on
the material instance, so merging across instances would kill it.

**Two build guards banked:** (1) vertex JITTER is noise, not craft — 0.10 amplitude read as a melted
balloon; cut to 0.04 and let the authored ranks + flat-shading carry the facet read. Organized
irregularity comes from units at fixed pitch, never from noise. (2) Detail frequency should vary with
anatomy (dense scutes at the shoulder, sparse aft) — a uniform grid reads as no rhythm.

**Process — Fable as a costed DIAGNOSTIC, not a grader.** The brief was "diagnose exactly why this
reads simple and prescribe a prioritized BUILDABLE plan with per-item tri costs and read-in-rear-chase
notes," comparing my body to BOTH the owner reference AND the shipped Revenant (the craft benchmark).
It returned 7 ranked ranks with tri budgets, paths, and an acceptance bar (≥6 nameable ranks, ≥3
carved recesses, serrated-dorsal silhouette test, a paint-audit) — implementable directly. Point a
high-effort aesthetic agent at "what's missing and how would you build it," never just "rate this."

**What it unlocks.** Every future premium body: budget ~5–7 organized ranks from turn one (a
`shingleRow`-style repeated unit makes them cheap), put the relief where the rear-chase looks, carve a
dark-floor/lit-rim recess into every element, batch per-material, and hold the craft bar against the
shipped roster's best — not just "matches the reference outline." "Passes the gate" is the floor;
organized density + carved depth is the ceiling the owner actually buys. The wing (I2) and head (I3)
get the same treatment: ranks + recesses, gated against the Revenant craft bar, not just the concept.
