# A hero needs a distinct SILHOUETTE + SCALE, not just glow (Mire beacon: tree → Lantern Spire)

**Context:** Stage 2's far-beacon shipped as a glowing world-tree (`glowtree`) — passed the studio
gate, got brightened + cleared so it read in-game. The owner still rejected it: *"the tree just looks
like all the other trees in the canopy but glowing. Doesn't read 'hero' at all, especially cause it's
the same size."* Dead right, and structural.

## The law
**Glow is a paint job, not a category.** A hero landmark cannot share its silhouette family OR its
scale octave with the background — no amount of brightness rescues it. The Mire's entire dark
substrate is trunks-plus-crowns (canopywall, boleveil, drape). A glowing trunk-plus-crown, at the
same r/h band, is just "a lit tree among trees." The arch works as a hero precisely because a
fly-through Λ gate exists nowhere else in the biome.

## The fix — a shape the biome does NOT contain, in a scale octave nothing else occupies
Fable killed the tree and reborn the beacon as **THE LANTERN SPIRE** (`glowspire`): a drowned
ancestor-spar the swamp colonized into a lighthouse — a thin dark vertical mast carrying FIVE
staggered glowing shelf-conks up to a white lantern bud, a dark splintered tip above it.
- **Distinct silhouette:** the swamp has round lobes (canopy), thin cones (reeds), diagonal ribbons+hole
  (arch) — but NO horizontal tiers and NO extreme-vertical mass. Stacked brackets are the one family it
  lacks, and fungal = the Mire's own theology (one octave from the Stage-3 mushroom: 5 brackets on a
  4×-taller mast vs a single dome — repetition vs singleton, never siblings).
- **Distinct scale:** h 62–72 → tip at world y 65–76 = **1.8–2.3× the canopywall massif** (the tallest
  thing after the arch), on a deliberately THIN footprint (r 26–34, below the canopy's r-band). It stops
  competing on bulk (it lost that) and wins on height + tier-rhythm + a ladder of five lights.
- **Reads through fog:** five discrete brightness steps converging to a white point survive the ~50%
  150m fog tax where a single hazed blob just dims into the canopy. Vertical `bakeMireLadder`
  (S1 dim-gold → S5 hot → bud near-white), `mireFarLiving` @1.8 reused unchanged.

## Gotcha (tris): a ConeGeometry side is `radialSeg × 2` triangles, not `radialSeg`
Fable's build-sheet tri estimate (138) assumed cone sides = radialSeg tris; they're radialSeg×2 (it's a
Cylinder with radiusTop 0 — the degenerate top row still counts), so the first build was 196. Trimmed to
148 by dropping shelf cones to 5-seg, saucers to 4-seg, splinter to 3-seg, and the bud from an
Icosahedron (20 tris) to an **Octahedron (8 tris)**. Rule: budget cones at `radialSeg×2 (+ radialSeg for
a closed base)`, and Octahedron(r,0) is the cheapest round-ish glow nub at 8 tris.

## Also: mergeParts needs consistent indexing
IcosahedronGeometry/OctahedronGeometry are NON-indexed (PolyhedronGeometry); Cone/Cylinder are indexed.
Mixing them in one mat group fails `mergeGeometries`. Fix: `.toNonIndexed()` the cones/cylinders to match
the polyhedron nub (a local `ni = g => g.toNonIndexed()` helper). tris unchanged.

## Status
Placement engine UNCHANGED (heroShift 150 / heroParity / heroRare 0.4 / treeClear corridors are
form-agnostic — they read flags, not names). Coupling adjusted 0.58→0.66 for the thinner ρ≤0.59 (inner
18.9 ≥ 16 veil). All machine gates green; determinism byte-identical. Studio render reads as an
unmistakable vertical lighthouse. Next: owner's read → in-game framed-pair money shot.
