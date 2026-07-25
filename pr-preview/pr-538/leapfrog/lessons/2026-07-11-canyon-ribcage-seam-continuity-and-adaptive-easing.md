# 2026-07-11 — Sky Canyon PR-2: ribcage seam continuity + the adaptive-easing fairness law

**Did / learned.** Made the leviathan ribcage — the owner's favourite canyon — flow
smoothly at its seams. The tube's vertical centre was a constant per section
(`cYc = gy + 1.5`) while ring Y wanders [5.5,19], so the corridor **teleported up to
~10m vertically at every seam** (the owner's "abrupt/narrow transition that forces a
collision"). Now the centre threads BOTH axes (X and Y) through the neighbour gaps that
PR-0 made real (`prevY/nextY`), the wall colliders tile at the inter-ring midpoint
(`band()`) instead of overlapping on offset curves, and big-bend joints drop the outer
sliver of side-wall colliders (hoops stay, so it still reads as one spine).

**The load-bearing discovery: a C1 smoothstep can make a demanding-but-fair ring line
UNFAIR.** The base course audits its ring-to-ring lateral moves right up to the
reachability limit (~27 m/s vs ~27.6 available at boost-steering). Smoothstep's peak
slope is **1.5× the linear average**, so easing a near-limit ring line through smoothstep
pushed the peak demand to ~34 m/s — over budget (found empirically by the new
`canyonflow.mjs` audit on seed 1337: `prevX=9, gapX=-7.5`, a 16.5m move). The spec's
arithmetic had assumed the ring line sat well under budget; it doesn't, always.

Fix: **adaptive easing.** Blend linear↔smoothstep with a per-half α chosen so the peak
slope never exceeds the steering budget: full smoothstep (rounded, flat-at-the-ring feel)
wherever there's slope headroom, degrading toward linear (fair, peak = ring slope) only
at the rare near-limit seam. Result: worst measured slope lands *exactly* at budget
(0.217) — the fair maximum, never over.

**→ Systematize.** Two reusable laws. **(1) Any smoothing applied to a reach-audited path
must be slope-budgeted, because C1-with-flat-ends costs ≥1.5× peak slope over linear** —
you cannot both zero the endpoint slope AND stay under a path already near its limit, so
make the smoothing *adaptive to the local slope headroom* rather than uniform. **(2) Put
the geometry math in a pure shared module and let the test import the SAME functions** —
`js/canyonMath.js` (ease/halves/band/centre + the `BUDGET_X/Y` constants derived from
config) is consumed by both `obstacles.js` and `tests/canyonflow.mjs`, so the audit
verifies the literal tube the game builds, and the fairness budget lives in exactly one
place. The audit itself is the durable system: it reconstructs every corridor centre and
asserts (a) C0 seam continuity, (b) slope ≤ 0.85×steering at the worst canyon speed,
(c) no joint pinch — so no future canyon tuning can silently ship an unfair tube. Also:
clamp an easing parameter to [0,1] before the polynomial (`ease(u)` of a large-negative
`u` explodes) — a bridged-gauntlet "seam" 200m away was evaluating the curve wildly
out of range.

**→ Leapfrog.** `centre()/halves()/band()` are the exact substrate PR-3 (rock-run
"carved slot") reuses to thread the sea-stack channel the same way — the rock run
converges onto the ribcage's proven one-readable-tube behaviour instead of teleporting.
The adaptive-easing law generalises to any future kinematic verb (updraft columns,
geyser launch) whose forces must lerp in without exceeding what the dragon can answer.
