# Lost Lagoon v3 — PR-5b nagawall: the serpent backdrop, and the two "spine vs coil" traps

**What we did.** Built `nagawall`, the Lagoon's civilization BACKDROP — a colossal half-drowned Khmer NAGA:
the serpent body as a rhythmic run of masonry coil-humps arcing in and out of the mirror, ending in a fanned
7-head cobra HOOD reared against the sunset, the far end a broken stump. It's the kit's ONLY long horizontal
(r 60–100, h 10–16, ~5:1) — it UNDERLINES the horizon, never walls it. Stage-1: **p1 3.x FAIL → r1 4.3
PASS → +free hood polish**. 122 tris. `arrivalPark:true` + `oneSide:true` + `comp.floor 0` → a rare EVENT:
one side per congregation, fully parked in the breaths, never both horizons at once.

## TRAP 1 — a triangular sawtooth run reads "dragon spine / stegosaurus," never "masonry serpent"

p1 built the body as sharp triangular humps (the intuitive "coils"). Fable: reads as a **dragon back-plate
ridge**, wrong creature grammar. The law:
- **A masonry naga coil is a SQUAT ROUND ARCH — wider than tall — not a peak.** The fix: each hump is a
  4-point **SINE arc** `P(t) = [x, hp·sin(t·π), 0]` with the two middle control points pulled high AND close
  (`t = 0.36, 0.64`) so the crest is ROUNDED, never pointed. And the width must beat the height:
  `w 0.34 > hp ~0.36` per hump → squat. Round tube cross-section ONLY (`frustumBetween(..., 3)` = a 3-seg
  ring). Sharp = animal; round + wide = grown/hewn stone.
- **Contiguous, dipping to the waterline between coils.** The humps share endpoints at `y0` (the mirror) so
  the body arcs *in and out of the water* — that in-out rhythm is the "serpent swimming" read and the
  drowned-ruin read in one. They grow toward the head (`hp = 0.28 + 0.08·t`) so the run has a direction.

## TRAP 2 — a hood that lies flat reads "floating plate," not "reared cobra"

p1's 7-head hood was built near-HORIZONTAL (fanning in the XZ ground plane). At backdrop distance a flat fan
is a **floating plate / lily pad**, not a head. The fix (r1 → 4.3):
- **Rear the hood VERTICAL: spread SIDEWAYS in Z, rise in Y.** The scalloped rim points spread across Z
  (`u·spread`, perpendicular to the body axis) while climbing in Y to `tipY` — so from the down-lane camera
  it's a broad UPRIGHT fan, and in top-plan it's a thin sliver. A hood is defined by being perpendicular to
  the ground; build it in the vertical plane from the start.
- **Scalloped rim = 7 tips + 6 notches** (`2·heads−1` rim points, tips at even indices sit `notchDrop`
  higher than the notches between them). 7 heads is the Khmer naga signature — the scallop count IS the
  word. **Seat the base ON the tallest crest** (`B = last coil's apex`), not floating above it — a hood
  springs from the neck.
- **Double-wind the fan** (front triangles + back triangles with reversed winding) so it's visible from both
  yaws — a single-winding fan disappears edge-on/back-side.

## THE FREE-POLISH ROUND — bank a legibility margin when a gate passes with headroom

r1 passed at 4.3, but Fable noted the hood was *near* the name-test threshold at true backdrop distance.
Rather than ship at the edge, took the offered free polish: **hood +~22%** (`spread 0.46→0.56`,
`tipY +0.65→+0.80`). Both name-test signals (7-scallop count + reared-fan silhouette) now hold with margin
at 60–100m off-lane. Law: **when a backdrop prop passes but sits near a legibility threshold at its FAR
placement distance, spend the free polish to buy margin — a backdrop is judged at distance, and studio
distance flatters it.**

## Reusable / carry-forward

- **The HAZARD FIREWALL discipline.** The Lagoon's drowned-footbridge hazard is decks + piers + straight
  horizontal spans. nagawall must never read as one → **round humps ONLY, no deck, no piers, no straight
  span, far off-lane** (`|x| ≥ 60`, central third of the frame clear). A backdrop prop that shares a
  silhouette family with a biome hazard is a gameplay bug, not just an art miss — keep prop and hazard
  vocabularies disjoint by construction.
- **`arrivalPark + oneSide + comp.floor 0`** is the "rare backdrop event" recipe: parked out of the arrival
  breaths, only one horizon at a time (`oneSide` heroHash duty-cycle), never spammed. Reuse for any
  once-per-congregation landmark that would cheapen if repeated.
- **NO gilt, NO foam collar** (`FOAM_CFG.nagawall:false`) — a bright foam ring 60+ off-lane is an artifact
  (the `arcade`/`riftwall` precedent). Hood eye-sockets are a withheld Stage-2-only option (blind niches by
  default — same silhouette-economics call as the prasat Bayon faces: sub-pixel detail costs points if it
  reads as a sticker).
- **`tilt:0` EXPLICIT (PLUMB-TIDE)** — a backdrop massif must stand plumb; a NaN quaternion from a missing
  tilt drops the whole serpent.

## What it unlocks

The civilization backdrop closes the 6-prop v3 roster (karstfang, figgate, mangrovehold, prasat, lotusraft,
nagawall — all Stage-1 gated ≥4.2, four double-gated). The serpent on the horizon + the drowned temple hero
+ the giant karst class together answer the "nothing is big / horizon is empty" gap that capped the live
biome at 3.1. Remaining: the composition-density finalize, the doc mirror, and the owner sign-off montage.
