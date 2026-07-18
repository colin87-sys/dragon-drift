# Unit-space proportions LIE under the (r,h,r) instance scale — design opening-aspect at world scale

**What we did.** Built `arcade` — the Lost Lagoon's backdrop massif: a long low drowned colonnade wall
punched by a rank of narrow lancets. Fable pre-assessed it (the NO-LONE-ARCH firewall vs the Sinking
Gates hazard), and at the first gate caught a defect whose root cause is a general trap every future
prop with a proportion-critical feature will hit. Fixed in one revise; shipped **4.3/5**. Four of six
PR-3 roster archetypes now through the gate (lilyraft 4.3, wrackstone 4.3, rootbastion 4.2, arcade 4.3).

## The reusable law

**Props are placed with an ANISOTROPIC instance scale `(r, h, r)` — X and Z by `r`, Y by `h`,
independently. So a feature's UNIT aspect ratio is NOT its world aspect ratio.** The arcade's lancet
openings were 0.10 wide × 0.68 tall in unit space (1:6.8 — "gothic" on paper), but the instance placed
them at `r≈120, h≈20`, giving a WORLD opening ~12 m wide × ~13.6 m tall = **1:1.2, squat** — a near-round
aqueduct read, and (worse) drifting toward the hazard gate's broad-portal proportion, eroding the
silhouette firewall. The bug is invisible in unit space and invisible in the fit-to-bbox studio if the
studio doesn't apply the real `(r,h,r)`.

**The method: design the feature at WORLD aspect, then divide back into unit space.**
1. Pick the target WORLD aspect at a representative draw (arcade: opening w:h = 1:2 at `r=120, h=20`).
2. Opening height world = `unitHeight · h`; solve for the needed opening width world; divide by `r` to
   get the unit width. (Arcade: height 0.72·20 ≈ 14.4 → width 7.2 → **unit width ≈ 0.06**, half the naïve
   value.)
3. Get sharpness from the geometry too, not just the ratio — drop the arch spring low (0.42→0.32) so the
   tapering pointed section is the majority of the opening and the apex angle sharpens automatically.

**Corollary — the studio can't judge world aspect.** A fit-to-bbox studio shows the UNIT proportions
(the arcade's lancets look extra-tall there). Any feature whose read depends on an opening's aspect must
be gated in the IN-CONTEXT frame (real `(r,h,r)`), not the studio. Say so when you send the checkpoint.

## Where this bites next (flagged by Fable for the campanile pre-assess)

- **The campanile belfry through-arches** hit this harder — a tower's `r:h` anisotropy is even more
  extreme than the arcade's, so belfry openings designed at unit aspect will squash more.
- Any prop with a proportion-critical HOLE, SLOT, or SILHOUETTE feature that must read a certain shape
  (aperture, lancet, portal, eye-socket) — compute its unit dims from the world target, every time.

## Supporting notes (arcade specifics)

- **A hand-built wall needs a TOP-CAP course or it vanishes in the top-down (shipping) camera** — a
  front-sheet + back-sheet with no top is a hollow ribbon (two hairlines in plan; edge-scratch artifacts
  at grazing). The rotunda's plinth-cap D1 lesson generalizes: cap every up-facing edge of a hand-built
  mass. (+2 tris per pier/lintel; budget the ≤150 reserve for it.)
- **The dashed-jade waterline**: on a wall pierced water-to-peak, only the PIERS reach the tide band, so
  the jade ladder stop paints a *dashed* rhythm (pier feet), not a continuous line — the edge loop at
  y=0.22 keeps every dash dead-level, and the mirror doubles the rhythm. A distinctness win over
  solid-banded walls (riftwall/glacierwall) for free.
- **The NO-LONE-ARCH firewall** (arch scenery vs an arch hazard): intact arches only in contiguous runs
  ≥2 (shared piers); collapse only END spans, to stumps BELOW the spring line (posts, never frames). A
  single free-standing complete arch anywhere = the hazard's silhouette = fail. Count + continuity are
  the fastest silhouette discriminators the player has.

## What it unlocks

The world-aspect method is now law for every proportion-critical feature (the campanile belfry next).
The arcade completes the kit's "coins of gold sky" backdrop — gold pouring through a serial rank of
lancets, doubled in the mirror. Remaining roster: `campanile` (first gilt carrier since the hero) and
`sentinel`, then the composition pass (carry the water-speckle-at-grazing note there, with twinning /
lilyraft density / rotunda pairing).
