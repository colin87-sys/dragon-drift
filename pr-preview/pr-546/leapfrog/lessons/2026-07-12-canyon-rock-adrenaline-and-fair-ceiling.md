# 2026-07-12 — Sky Canyon feel-v5: rock adrenaline is content, not sharper turns

**Did / learned.** The rock run was "much more fair" but had "too many long stretches
where you do nothing — no rings, no boosts, you just lose stamina and chug and lose
momentum." Precise diagnosis (not a geometry hole): rock has **no slipstream and no
boosts** (both are spine-only — `addFinaleOrb` gates on spine kinds, slip on
`canyonRun==='spine'`), so on a long breath-beat ring hop (~150m) you coast at base speed
draining 20/s stamina against ring refills that never pay for a held boost. The carved
slot itself already tiles edge-to-edge on every honest hop (the wall `band` caps at
`span·0.5`, and `bk ≥ span/2` for any span ≤ 192) — so the dead stretch was a **content /
momentum** hole, not missing walls.

The fix is content, all determinism-safe on the non-fixtured `out.orbs` / `out.embers`
(rings are fixtured — can't move or add):
- **Woven boosts on the bank apex.** Every other `split` segment gets a speed orb at
  `dist = seg.dist − span/2` (mid-gap, the sway apex), x/y from the shared pure
  `rockSlicePlan.xcAt`/`centre.yAt` — so grabbing it *is* the carve, it fills the exact
  dead metres, and `orbStamina` + 2s of orb-speed kills the chug. The audit's worst-case
  speed `CANYON_V` already assumes orbs inside rock runs, so no budget change.
- **Carve-line embers** on the swayed centre through the boost-less gaps — a banked line
  to chase + score dopamine. Zero RNG draws (the fixtured `rnd` stream is untouched;
  embers aren't in the gold fixture).
- **Longer runs** (`canyonSegments [8,11]→[9,13]`) so the cadence sustains.

**The instructive miss: "more banking" is at its fair ceiling.** Raising `canyonSwayAmp`
5.5→6.5 was **inert** — the per-half sway amp is `min(cap, aSlope, aLane)` and the SLOPE
budget (`aSlope`), not the amp cap, binds on typical sections. The checkpoint reviewer
suggested the real lever: lengthen the rock easing halves (`0.6·span → 0.7`) to raise
`aSlope`. **Measured it in `canyonflow` — it went the WRONG way**: a longer easing is a
*gentler* curve, so must-steer dropped 17%→12% and seam Δ climbed 0.60→1.55 (toward the 2m
limit). Reverted. The honest conclusion: **rock banking demand is already at its fairness
ceiling** — the slope budget IS the "don't make it the unfair thing the user first
complained about" guarantee. More adrenaline there is *content density* (boosts, embers,
longer runs), not *sharper turns*. (Kept `canyonSwayAmp 6.5`: harmless, and it adds a
little banking only on the long-span low-displacement sections where real headroom exists
— the right kind of "more.")

**→ Systematize.** Two laws. (1) **When a set-piece feels "empty," check whether the hole
is geometry or content before adding geometry** — here the walls were fine; the miss was
no reward/momentum. Measure coverage (band vs span) before assuming. (2) **A fairness cap
is a design ceiling, not a bug to tune around.** When a "make it more intense" lever is
inert because a *fairness* budget binds, that budget is doing its job — deliver the
intensity through a different axis (density, length, reward) rather than eroding the
budget. Always MEASURE the lever (the easing change looked right on paper and regressed in
the audit) instead of trusting the analysis.

**→ Leapfrog.** Rock now has its own boost/ember economy on the non-fixtured streams —
the template for giving any biome run a reward cadence without touching the fixtured ring
course. And "banking is slope-budget-ceilinged; add content not sharpness" is the standing
answer for future rock-feel asks. The extended `canyonframe` orb check pins the woven
boosts' granularity invariance forever.
