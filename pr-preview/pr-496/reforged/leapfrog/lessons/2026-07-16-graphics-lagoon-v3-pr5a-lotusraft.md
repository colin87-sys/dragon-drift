# Lost Lagoon v3 — PR-5a lotusraft: the flat near-water void filler, and the toadstool trap

**What we did.** Built `lotusraft`, the Lagoon's lowest rest-commons — a scatter of paper-thin lily pads
flush on the mirror with a few lotus blooms rising off them. It fills the flat near-water void the live-biome
review flagged (the water plane read as empty between the tall props). Stage-1: **p1 4.0 FAIL → r1 4.3 PASS**
(one revise). ~100 tris. `step:19` (a low-frequency prime so it scatters, not clumps), `comp.floor 0.14`
(near-empty in the breaths — a rest-beat prop, not a wall).

## THE HEADLINE TRAP — a downward cone over a stem reads "mushroom," never "flower"

p1 built the blooms as downward-flaring parasols (cone apex-up, skirt-down) — the intuitive "flower on a
stalk" shape. Fable: **"toadstools, not lotus. 4.0."** The diagnosis is a solid-geometry law, not a tuning
miss:
- **A lotus bloom is the OPPOSITE solid from a mushroom.** A mushroom is widest at the BOTTOM of its cap
  (skirt flares down, gills under). A lotus is widest at the TOP RIM — petals flare UP and OUT around an
  open center. Same stem, inverted cup → the whole word flips.
- **The fix (r1 → 4.3): an OPEN upward cup.** `CylinderGeometry(r, r*0.32, r*1.5, 6, 1, true)` — top radius
  wide, bottom radius narrow, **open-ended** (the `true` — an open center is the lotus signature; a capped
  cylinder reads as a barrel). Widest-at-rim + open-top = "lotus" in one read.

## Reusable

- **Variety within one prop kills the "stamped" read cheaply.** Three bloom *kinds* off the shared `bloom()`
  helper — an open `cup`, a closed pointed `bud` (`ConeGeometry` apex-up = a teardrop, the un-opened lotus),
  and a flat `pod` (a wide-flat inverted cone = the seed head) — make a 4-bloom cluster read as a living
  patch at different life stages, not four copies. One helper, a `kind` switch, ~0 extra tris.
- **Fix a clump by MOVING an element to a sibling, not by re-spacing the main.** p1's blooms all sat on the
  main pad = a bouquet. r1 pushed the bud onto the right sibling pad (`x:0.42`) and the pod to the front
  edge — the cluster spreads across the whole pad group, the airgaps between pads become part of the
  composition. Cheaper and more organic than nudging four x/z values on one disc.
- **A water-conforming raft takes `tilt:0` EXPLICIT.** A raft conforms to the mirror; a tilted raft is an ice
  floe (wrong biome). And a *missing* tilt is a NaN quaternion (undefined → the prop vanishes or throws). The
  pad discs are `rx:-π/2` flat, seated `y:0.02` just above the mirror so they don't z-fight the water plane.
- **The main pad earns ONE detail: a radial notch.** `CircleGeometry(0.36, 10, 0.55, 2π−1.0)` — a wedge cut
  out of the disc = the Victoria-amazonica aerial-pad signature. One pad gets it (the read); the siblings
  stay plain discs (budget + the notch reads as "the big one is special," not "all pads are broken").
- **NO foam collar** (`FOAM_CFG.lotusraft:false`). The pads ARE the waterline event; a bright foam ring on a
  2m flat pad reads as an artifact (the `lilyraft` precedent — any near-flush near-water prop wants no ring).

## Stage-2 watch / carry-forward

- **The rose blush reads PALE on the warm studio backdrop** — deferred to the in-context montage, where the
  blooms sit over JADE water (the complementary cool ground the blush needs to pop). This is the general
  rule for `bake:'bloom'` props: a warm accent on a warm studio card under-reads; judge blush saturation only
  in-context against the cool water, never on the flat sheet.
- **The bloom cups are the smallest hero elements in the kit** — verify at cruise they don't drop below the
  pad silhouette (if the water plane occludes them at grazing follow-cam pitch, lift the stems ~0.05).

## What it unlocks

The near-water void the live-review flagged now has its rest-beat filler; the mirror plane reads as a living
patch, not empty glass. With `nagawall` (the serpent backdrop) that completes the 6-prop v3 roster — the
finalize (composition density in the follow-cam, the doc mirror, the owner montage) is all that remains.
