# The anti-biplane wing is a ROOT problem, not a feather problem — bury every blade's root in the fill

**Did / learned.** Built CP2 of the Molten Phoenix: `pyreFanWings`, a broad arched shingled fan of
fire redesigned from first principles (the retired scythe wing read as a Wright-brothers biplane of
thin struts; Seraph's smooth white vault was also vetoed). First submission PASSED the harsh Fable
wing gate at **4.0** with both binary vetoes clear (not-a-plane, not-Seraph) — but the critic flagged
one repeated blocker: the outermost primaries (above all the dominant ×1.7 pinion) floated as
**detached islands in the pure silhouette** — "the last whiff of the biplane wing." The fix wasn't
more feathers or a different profile; it was WHERE the feathers are ROOTED.

**The load-bearing lesson: a feather/blade that ROOTS on the bare leading edge (beyond where the
membrane fills) will always read as a floating sliver in silhouette, no matter how good the blade
is.** The membrane filled root→t≈0.72; the primaries were based on the lead curve at their own span
station (t up to 1.0), so the outer three sprouted from a thin bare spar with sky behind them — in
black-fill they detach. The cure: **clamp every primary's ROOT span into the filled membrane
(≤0.70) and let the blade RAKE outward to its true length/position.** Now the roots are buried in the
surface and the blades fan out; the outboard SLOTS become the sky-gaps *between the fanned tips* (real
raptor language) instead of gaps at the roots (loose-slat glitch). Same silhouette veto, opposite
read — and it cost ~6 lines. Corollaries the same gate surfaced, all "separate the layer from what
it sits on":
- **A rank that shares its neighbour's tier is invisible.** The secondaries were T2 magma shingled
  over a T2 magma membrane band → orange-on-orange, no read. Dropping them one tier to T3 lava made
  rank-2 separate. A shingled rank must differ in VALUE from the surface it overlaps, or it's wasted.
- **An accent as wide as the thing it accents becomes a second tube.** The arm's sungold fissure at
  0.03 half-width read as a two-tone cylinder, not "crust with a crack." Narrowing to 0.02 restored
  the limb-with-a-fissure read. An emissive accent must be a fraction of its host's width.

**→ Systematize.** Two reusable rules for any SHINGLED / FEATHERED / bladed appendage:
1. **ROOT-IN-FILL invariant:** every discrete blade/feather/scale must root inside the filled surface
   (clamp its root parameter to the fill boundary) and extend outward — never root on a bare
   edge/spar. This is *the* mechanical cure for "spray of floating slivers / biplane struts," and it's
   checkable in the black-fill silhouette (the plane/loose-slat veto is really a root-placement test).
   Worth a helper contract: rank builders take a `fillBoundary` and clamp roots to it.
2. **RANK-VALUE-STEP invariant:** each shingled rank sits one value/tier off the surface beneath it,
   or it doesn't read. Pair it with the CP1 "field a tier below accents" rule and you have a complete
   value-layering discipline: body-field < accents, and each relief rank < its substrate.
The `creasedKite(base, dir, side, len, wid, lift, mat, barb, barbMat)` primitive (a two-value creased
blade with an optional flame-lick barb) served coverts, secondaries, primaries, the alula, AND the
tail spade — one atom, five ranks — so "author the repeatable unit once, place it along different
paths" held again.

**→ Leapfrog.** The shared exported PROFILE (`pyreLeadY/Z`, one source of truth for the geometry AND
the FX marker) plus the root-in-fill rank builder is a general **feathered-surface engine**: any
creature whose signature is a layered fan (a peacock display, a fin-sail, a mane, a cloak of scales)
is now the same three moves — a curved profile, a filled membrane to t≈0.72, and value-stepped ranks
rooted in the fill. And the silhouette black-fill is revealed as the cheapest, harshest gate we have:
the plane/biplane/Seraph vetoes all reduce to two measurable properties — connectedness (no detached
islands) and edge-character (straight = plane, smooth = Seraph, serrated-from-fill = feathered fan).
Next: fold that connectedness check into a headless silhouette assert so "no floating slivers" can't
regress.
