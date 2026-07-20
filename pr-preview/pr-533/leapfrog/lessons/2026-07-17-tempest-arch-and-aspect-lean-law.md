# The aspect-lean law, the paired+overhead arch, and how to fly UNDER a lane-spanning span

**Context:** Owner (loving the sun-road beauty pass): props still read blocky, the lean is inconsistent
(some topple), and "I want some sort of archway to occasionally frame the composition without detracting
from the thing in the background [the breach]." Fable planned it; this records the two reusable discoveries.

## 1. THE ASPECT-LEAN LAW (the reusable one)

A `skewX(k)` baked in unit space leans by **world angle = atan(k · r/h)** after the `(r,h,r)` instance
scale. So **one shared skew across a family whose instances span a wide aspect band produces opposite bugs
at the two ends**: a squat prow (big r / small h) topples at ~50°, a tall prow (small r / big h) barely
leans at ~13°. That was BOTH of the owner's lean complaints from a single constant.

**Fix pattern:** pick k **per family, from its aspect band, targeting a natural 15–28° world lean.** When a
family needs both low and tall members (prow roofline rhythm), SPLIT it into two archetypes with narrow
aspect bands and their own k — `buildStormprow(SKEW)` shared, `stormprow` (low, k0.42) + `stormprowHero`
(tall, k1.0). A tall/thin family (stormstack, ~1:4) needs a BIG k (0.32→ only ~4–9°) for a subtle bow;
a low/wide family (stackgrave stumps) also obeys it — its old `rz/rx` tilts were being sheared WRONG by
the same non-uniform scale, so they became `skewX` too. Whenever you see "the lean looks wrong on some
instances but not others," suspect aspect-coupling first.

## 2. A PAIRED ARCH YOU FLY UNDER (`stormarch`)

The owner wanted an archway that spans the lane. The naïve fears — it blocks flight / fails clearance —
are real but solvable:

- **Reach only ABOVE the flight ceiling.** A uniformly-skewed leg that reaches lane-centre crosses the
  flight band at mid-height (collision). Instead the piers stay vertical + gate-safe at |x|~24 up to the
  `overhead.unitY`, and ONLY a cantilevered crown arm reaches inward — and it does so high enough that it
  crosses |x|=13 at world y≈36, far above the ~18 flight ceiling. Declare `overhead:{unitY, minWorldY}`;
  the crown is audited by the min-world-height assert, the piers (the trunk) by the lane inner-edge.
- **Close the arch or it reads as floating blocks.** A broken cantilever whose two arms don't meet reads
  as debris. Extend each mirrored arm to the CENTRE keystone (unit x ~1.85 at pier |x|24, r13 → world ~0)
  so the two halves meet/overlap → one connected span. Overlap the voussoirs (wide + chunky, ≥neighbour
  spacing) so it reads as masonry, not a bead chain.
- **BARE stone, ZERO gold.** The arch is the dark FRAME; the breach is the bright PICTURE — never compete.
- **Rare = event.** step 620 (~one per 2 congregations), `paired` so the two piers share a distance.
  (To iterate on a rare prop, temporarily drop its step to ~200 for the capture, then revert.)

### Tooling: `overhead` must beat `paired` in propclearance
`stormarch` is the first prop that is BOTH `paired` and `overhead`. The `facing` selector checked
`paired` first → it used `xMax` (which includes the overhead keystone at unit x 1.85) → false "invades
lane." Fix: **overhead wins over paired** — `a.gate ? apertureHalf : a.overhead ? rhoLane : a.paired ?
xMax : rho`. Pairing only governs distance-alignment; the crown's clearance is legitimately the sub-unitY
trunk (`rhoLane`). sungate is paired-without-overhead, so it's untouched.

## Verify / determinism
`stormarch` registered LAST (no band's rnd stream shifts) → gold-determinism byte-identical. Clearance
re-tuned (piers |x|24, unitY 0.90/minWorldY 21, `overhead>paired` fix); 96 tris; all green: propclearance
--ci, envcount --ci, insts/propao/propfoam/biomecycle/stormtick. Gate on the owner's device.

**Meta:** the breach lift (_elC 0.11) + the arch both ultimately want the DARK bruised-indigo deck from the
sky regrade — against the current pale calm deck a lifted hole and a dark arch both fight pale-on-pale.
The sky regrade is the multiplier that makes this whole refinement round pay off.
