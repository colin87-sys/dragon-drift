# 2026-08-17 — A border around nothing is an outline (wing-lab I3.1)

**Did / learned.** The Basalt Forgewing's FIRE gate lost Round 4 on exactly one tile. Every
other read beat the bar, but the *cold* state shipped a closed bright amber "O" — the forge
window's outer ring lit, its interior dark — and one exhibited kill-list item loses a blind
regardless of the rest. The defect traced to a research clause ("dim rim only, core dark")
that the spec had adopted verbatim. It is wrong, and wrong in a way worth naming: **a border
is the edge between a lit field and a dark one, so when the interior goes dark the border
stops existing. Drawing it anyway is an outline made of light** — the same chrome tell as a
rim-lit silhouette, at window scale (now kill #68). A radiator that banks its fire dims to a
*shrinking core*, not to a luminous frame around nothing.

The fix was one authoring change and it cost zero triangles: the pane's cell grid, its
temperature field and every pixel of cruise / power / ignition are byte-identical, and the
only edit is *which cell carries stage 0* — the outer ring became ONE interior cell (chosen by
seed from two candidates whose indices cannot touch a pane border, which makes "no pixel may
trace the window border" an index range instead of a hope). The state's master gain fell
0.62 → 0.039, because cold now lights nothing but that cell and the gain is therefore a
property of the coal alone: it turns a white-hot door into the last coal in a banked furnace.
Authored 0.14% of wing area, measured 0.22%, against a 0.30/0.50% cap.

Two second-order findings, both worth more than the fix:

- **The probe that should have caught it could not see it, and neither could the one I wrote
  first.** A closed-contour test is topological — flood-fill the unlit pixels from the frame
  border, and anything unreachable is enclosed by light. Run naively it reported *zero* holes
  on the exact frame that lost the gate: the ring converges to the pane's tip cusp, where the
  two lit strips pinch across a 2–3 px gap that the eye reads as closed and a 4-connectivity
  fill walks straight through. A morphological CLOSE at radius 2 before the fill seals the
  cusp and still leaves the artery doublets separate. **The radius was found by firing the
  probe at the known-bad, not by choosing a nice number.**
- **A negative control had been silently broken for two increments.** The clipped-white
  control ("×6 gain must blow past the 1% ceiling") landed on 0.96% against 1.00% and had been
  printing "CLEARED — PROBE IS BROKEN" since I3 with nobody reading the line. The metric was
  live (×6 moves it 0.05% → 0.96%, a 19× response); the control was simply too weak to cross
  its own gate. This is kill #67's failure mode one level up: it is not enough for a control
  to exist, it has to *land outside the gate with margin*, and somebody has to read the line.

**→ Systematize.** Three reusable pieces:

1. **The rule.** *Windows are filled panes or they are dark.* Any state whose light traces a
   shape's border — at any scale, in any medium — is an outline. Applies to hull vents, boss
   weak-points, UI glows, biome hazards: if you find yourself lighting the perimeter of
   something because "the whole thing is too much", the answer is a smaller filled patch, not
   a thinner ring.
2. **Own the defect you shipped.** `flushFire` now parks the old ring's stage tags on the fire
   geometry as `wlKnownBadStage`, and the harness can swap them back in with one flag. Kill
   #67 says a probe verdict needs a known-bad; the cheapest known-bad you will ever have is
   **your own last delivery**, and it costs ~1 KB to keep it addressable forever. Generalise:
   when a gate is lost on a defect, keep the defect switchable before you fix it.
3. **A control must clear its gate by a margin, and margins must be printed.** Every threshold
   in this lab should carry its control's measured value next to the gate value, so "0.96 vs
   1.00" is visibly a broken control rather than a passing test.

**→ Leapfrog.** The contour probe is shape-agnostic — it asks "does light enclose dark?" of
any masked pixel set. Point it at the roster's existing emissive work (the Tempest's bolt
frame, boss weak-point rings, every hull seam that "reads as a glow") and it will tell you,
without argument, which of them are outlines. That is the first mechanical test this repo has
for the single most common cheap-glow tell, and it can run in CI over every hero at once.
