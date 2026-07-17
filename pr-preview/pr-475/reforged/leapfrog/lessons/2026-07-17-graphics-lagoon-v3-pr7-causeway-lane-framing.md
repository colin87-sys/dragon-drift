# Lost Lagoon v3 — PR-7 causeway: the lane-framing near-rail (the owner's coverage fix), + the tri-band-on-a-box trap

**What we did.** After the 6-prop v3 roster shipped, the OWNER flew it and reported the real gap: *"it needs big
expansive props (like old ruins) to frame it… you have a lot of just vertical objects, so you don't have enough
COVERAGE and the lane can look empty — terrible for gameplay, they fly into the outer barrier and die without
realizing. Look at the code and rhythm of FROZEN."* Built `causeway`, a long, LOW, horizontal drowned Angkor
gallery that runs PARALLEL to the lane. Stage-1: **2.6 FAIL → 3.7 FAIL → 4.3 PASS** (two revise rounds). 142 tris.

## THE HEADLINE — the Lagoon had no horizontal REST mass, and that's a COVERAGE/gameplay bug, not just an art gap

The coverage engine (writeMatrix): `density = floor + (1−floor)·g`, g = congregation weight (1 at a cluster
peak, →0 in a "breath"). **`floor` = the fraction of an archetype's slots that survive the empty breaths.**
Frozen keeps its corridor readable with TWO continuous horizontal rails — `terrace` (low/wide, `step 20`,
`floor 0.22`, hugs the edge, "the horizontal REST that makes the verticals read colossal") and `glacierwall`
(NO comp block → never parks → a far wall on both horizons). Caldera mirrors it (`flowlobe` floor 0.50,
`riftwall` floor 0.25). **The Lagoon v3 kit had NEITHER** — all six props were vertical points (karstfang/
figgate/prasat towers, mangrovehold small, nagawall far+rare) with low floors (0.08–0.15), AND `lagoonComp`
is the only comp that's SQUARED (`raised²`) → the widest, emptiest breaths in the game. So the near-water
stretches read as empty mirror with an occasional spike, and nothing framed the ±13 fatal lane. `causeway`
(`step 20`, `floor 0.30` — the highest in the kit) is the terrace analog: a near-continuous low wall hugging
the lane edge through the breaths. Lagoon coverage jumped **264 → 354 instances**. **Law: a biome needs at
least one HIGH-floor, LOW, WIDE horizontal rail or the flight corridor reads empty and unframed — that is a
gameplay-safety requirement (boundary legibility), not a nicety.**

## THE TRAP — the temple bake's per-TRIANGLE banding paints a diagonal "tarp" on any tall BOX face

Attempt 1 (2.6) built the deck as one tall box and let `bakeTempleLadder` band it. That bake keys color by
per-TRIANGLE centroid Y — fine on a karst LATHE (many small segments) but on a BOX each face is ONE quad = 2
triangles split along the quad DIAGONAL, so a face spanning the waterline got its two half-quads painted
different bands → a huge **diagonal green "tarp" wedge** slicing corner-to-corner (Fable: "water does not sit
on a slope"). **Fix (the kill): build the drowned foot as THREE stacked HORIZONTAL SLABS**, each sitting
ENTIRELY inside one band so it takes one clean color → a strictly horizontal waterline:
- laterite foot box `y −0.10→0.00` (all centroids <0 → laterite),
- a PROUD (wider) jade tide-stain box `y 0.00→0.10` (centroids ∈[0,0.22] → moss/jade, a stain ridge),
- the amber body box `y 0.10→0.52` — a TALL box whose two side-tris have centroids 0.24 & 0.38, BOTH >0.22,
  so the whole face (incl. the 0.10–0.22 span) renders clean amber.
**Reusable law: never let a single tall box face straddle a per-triangle-centroid bake boundary — stack
band-height slabs, or the quad diagonal becomes a fake diagonal stain.** (Transfers to every future boxy
temple prop: rampart, any wall/terrace.)

## THE SECOND + THIRD FIXES — identity by silhouette, and the cheap-tell that mirrors the one you just killed

- **Colonnade (2.6→3.7):** square flat-top stubs read as CRENELLATION → "bunker". Slim TAPERED open-topped
  pentagonal shafts (snapped-off tops) + varied heights + a post–GAP–post rhythm + a FALLEN LINTEL toppled
  across the open bay = "ruined gallery". The lintel was Fable's "single best storytelling element" — a
  collapse beat sells a ruin faster than any intact geometry. **Open cylinders (10 tris) are also CHEAPER
  than boxes (12) AND rounder AND read as broken columns — a strict win over box posts for ruin verticals.**
- **Moss (3.7→4.3): octahedra are a trap.** I cut icosahedra→octahedra (8 vs 20 tris) for budget and Fable
  killed it — flattened octahedra render as **flat faceted green DIAMOND "kites", the SAME clean-geometric-
  plane tell as the jade wedge I'd just killed.** The correct low-poly moss is a ROUNDED deformed icosahedron
  (non-uniform-scaled squashed lump), CLUSTERED, ~15% coverage, with one blob SAGGING over the lip to break
  the crown line. **Law: organic matter is rounded-irregular; any big clean flat facet (wedge, diamond, plate)
  reads as tarp/tape/kite no matter the palette. Don't trade icosa→octa to save tris — find the budget
  elsewhere.** (Add a ry/rx rotation too, or the icosa top-plan silhouette resolves as a clean hexagon.)

## Placement / clearance gotchas

- A wall that must run DOWN-LANE (long in object Z) but hug the edge: `place()` can pin `rotY` (shipped props
  do — line 2782 `eul.set(0, d.rotY ?? rnd()*π, tilt)`), so return `rotY = (rnd()<0.5?0:π) ± jitter` to keep
  the long face lane-PARALLEL (never yawed across the lane). Clearance uses `ρ = max(hypot(x,z))` (symmetric),
  so couple `x = 14.6 + 1.14·r` to the measured ρ (1.00) → inner edge 14.9 ≥ the 14.5 fairness floor (a LOW
  near-rail may sit inside the ±16 gate veil — the terrace/flowlobe precedent; it never looms over a ring).
- **NO `sizeClass` on a long-ρ prop:** the ×1.42 mother-island bucket (writeMatrix 2859) multiplies k and is
  NOT in the x-coupling → a long-ρ prop with sizeClass invades the fatal lane. Get variety from r-range +
  rotY flip + broken ends instead.
- Studio harness: `propstudio.html` fits the UNIT geometry, so a long-low prop reads too tall — added an
  `inst:[r,h]` scale hook + `tools/_cwstudio.mjs` (wall angles: gallery face / full-length / worm's-eye WALL
  read / down-the-length / top-plan) so horizontal props gate at their true proportion.

## What it unlocks

The Lagoon finally has its horizontal rest-rail — the corridor reads as a framed avenue, not empty mirror, and
the vertical heroes read colossal against it. Remaining: `rampart` (the continuous FAR massif — the
glacierwall/riftwall analog, both horizons, so the mid-horizon isn't empty sky either), then the in-context
Stage-2 gate for both + the owner montage. Stage-2 watch items for causeway (Fable free polish, non-gating):
warm the columns if they read cool grey over jade water, waver the jade band's ruler-straight top edge.
