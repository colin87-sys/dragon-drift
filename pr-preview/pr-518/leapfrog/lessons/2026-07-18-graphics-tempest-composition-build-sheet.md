# Tempest Reach composition assessed (3/5) → the `scarpwall` build sheet written

**What we did.** Fable-assessed six in-flight biome-7 sweep frames against the codified composition
rubric (the one derived on the Drowned Forum), scored Tempest 3/5 — "a premium sky over an unfinished
stage" — and wrote the full correction plan as `reforged/TEMPEST-COMPOSITION-BUILD-SHEET.md`
(self-contained, line-referenced, for a fresh chat; modeled on `DROWNED-FORUM-BUILD-SHEET.md`).

**The diagnosis in one line:** the atmosphere (breach focal, god-rays, aerial perspective, stormarch
framing) is won; the STAGE lacks a mid-ground MASS — every mid/far Tempest archetype is a thin
vertical, so congregations read as picket fences and composition is a dice roll on whether the camera
sits beside the low near rail.

**THE NEW LAW — the register histogram that matters is SCREEN AREA, not height.** Tempest's height
ladder spans 7→56 and still failed rubric #3: ten tall THIN pillars (stormstack r4–9, stormprowHero
r8–11, stormprowFar r12–22) are unimodal on area = all sticks. A rescale can't fix an area hole; only
a mass (height × LENGTH) can. Check area, not height, when auditing a roster's registers.

**The prescription (3 PRs):** PR-A `scarpwall` — a wave-cut headland massif (world 70–100 long ×
26–34 tall ≈ 2.6–3× the near rail), basilica-pattern lane-parallel build (nominal-normalized world
units, deep back plane, end caps/step returns from I1), dark-and-widened scour bake (face ≤0.38 near,
crest ≥0.50), NO gold, appended at END of ARCHETYPES with a new pure `massif` phase-lock in the
`bi===7` branch: EVERY tempestComp peak gets exactly one massif, side = the heavier bank of the 0.42
per-side sway (alternating Lorrain flanks for free). PR-B density-follows-framing: stackgrave floor
0.20→0.05, stormprowFar 0.22→0.10 (the breath sprinkle is floor leakage), verticals parked on the
massif flank via a shared `massifSide(peakIdx)`. PR-C convergence: lumprobe numerics + no-hero mixed
sweep + broadside cardboard check; pass condition = the current best frame becomes the average and
the thumb test holds both directions.

**Gotcha logged for the implementer:** `tempestComp` is PER-SIDE (0.42 phase sway) — any per-peak
logic (hero locks, oneSide ports from Lagoon) must first decide which bank a peak belongs to; the
Lagoon `oneSide` block can't be copied verbatim. Also `tools/tempestshot.mjs`'s stall caveat governs
all biome-7 capture: one boot per frame, no player.dist warp sweeps in this container.

**What it unlocks.** Tempest gets the same skeleton-before-density path the Forum's basilica proved,
with the flatness/repoussoir/aspect-lean laws budgeted up front — the sheet targets one-revise-round
convergence per gate instead of the Forum's discovered-the-hard-way rounds.
