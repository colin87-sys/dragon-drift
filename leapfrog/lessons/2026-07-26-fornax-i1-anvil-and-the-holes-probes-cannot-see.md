# 2026-07-26 — Fornax I1: the holes a probe cannot see, and the comment that lied

**Did / learned.** Built I1 of the fire wyvern — the char-plate anvil torso, shallow-S neck,
abducted leg chains, and the lava-lake seam network — to numeric targets an art director set
*before* the build, then gated it with an independent critic. Round 1: **3.6/5 REVISE**. Round 2
after the fixes: **4.3/5 PASS**. The machine probe said 15/15 at the moment the critic found two
defects that would have wrecked the increment.

**The gotcha — two failure classes that are structurally invisible to geometry probes:**

1. **A HOLE.** The hull's chest-prow cap sat at z −1.45; the neck loft's aft station sat at −1.50
   and was uncapped. A 0.05u slit ran straight through the chest — a full-height crack of
   background in the side render, matching pinholes from above. Every numeric target still passed,
   because **a geometry probe measures what is THERE; absence is not a value it can read.** The
   whole increment existed to produce "ONE dominant forged mass" and the silhouette was severed at
   the throat.
2. **A COMMENT THAT LIED.** The transverse seam loop read `for (k = 2; k <= 7; k++)`, directly
   under a comment promising "an ARC over the dorsal deck… crosses the dorsal midline". On this
   10-column profile the ascending walk is chine → lower flank → **belly** → lower flank → chine —
   the ventral route. The entire seam identity, and the path THE STOKE is meant to run at I4, was
   riveted to the one surface the rear-high camera never sees. The dorsal walk is `[2,1,0,9,8,7]`.
   Nothing in the harness compares a comment to its code; only eyes on a render do.

A third, milder one: `M.rim` was defined, commented with its own ≤2% law, and **applied to
nothing** — the file asserted a four-tier ladder while implementing three.

**→ Systematize.** Three reusable rules.
(a) **Add a JOIN assert wherever two lofts meet.** The fix was one z-value; the guard is one
comparison (`neck aft z > chest prow z`). Any creature assembled from separate lofts has this
exact failure available to it, and no existing gate catches it.
(b) **A probe that measures the wrong parts is worse than no probe — it manufactures confidence.**
Mine reported shoulder:hip **2.23×** because the wing stub's arm bone fell inside the shoulder
sampling band; the hull-only truth was **1.28×**. Tag geometry by anatomical part
(`userData.fornaxPart`) and filter every measurement, or a later increment's stub silently grades
an earlier increment's work. Same bug, twice more: the probe flagged the *eye* as a withheld-light
violation (the eye is the one sanctioned cruise light — an assert like that trains the next session
to delete it), and measured "forward mass" by vertex COUNT, letting dense toe lofts outweigh the
entire chest. **Weight by area, exclude by role.**
(c) **When a number misses, move the geometry, not the goalpost.** Forward mass read 81.8% against
a 65–75% target; I briefly widened the band to 82% to make it pass, then put it back and length‑
ened the aft body instead. The widened band would have shipped a tadpole with a green check.

**The best outcome of the round was a fix I did NOT make.** The hull renders blue-black under a
pale sky and I flagged it as a Vesper-lane collision. The critic measured it instead of agreeing:
Fornax's char is B−R **+2** (neutral); Vesper's hide is *painted* 0x0a0e17, B−R **+13**. Fornax's
blue is entirely the sky — mean B−R is +0.9 to +2.9 in the angles the game camera actually takes,
sunlit facets go **warm** (+6 R−B), and the gold-sky capture shows the blue vanish with the light.
That warm-lit/cool-shadow split *is* what physical neutrality looks like. Warming the albedo would
have left the sourced charcoal band and drifted straight into the Ember starter's surface-warm
lane — breaking one law to fix a non-problem. **Measure the collision before you fix it.**

**→ Leapfrog.** The attach contract is FROZEN and I2 can mount the hero wing against a torso whose
frame, mirror, joints and now silhouette-integrity are all trustworthy — so I2's critic round gets
spent on the wing instead of on the thing it grows from. Three watch items ride forward: the deck
rim and dorsal arcs cross at six points at identical proudness (no z-fight in four static views;
re-check in motion), the seam width may need one step at real chase distance (widen, never
brighten), and `brandSkull` must be sized against the real neck terminus (0.32) rather than I0's
box (0.24).
