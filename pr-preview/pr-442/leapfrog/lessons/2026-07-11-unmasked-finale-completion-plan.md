# PLAN — completing THE UNMASKED's encounter: what the reserved-list one-liners actually cost

**What we did.** Wrote `docs/unmasked-finale-completion-plan.md` — the staged build plan for the
finale's encounter (the medley, graze medley, destructible relics, surge-chase + star pips, the
second-sun landmark, `handoff()` + the *Don't Move* entrance, the companion shard). Seven def-gated
increments, fight-side (headless-provable) before spectacle (owner-gated). No code changed.

**Findings worth keeping regardless of how the plan evolves:**

- **`grazeForm: 'medley'` is a declared string with NO boss.js branch — dead today.** Every graze
  form is a `def.grazeForm === '<literal>'` site; a "quotes the roster" form needs a per-stage
  resolver seam. The general rule: grep a def's declared strings against the controller before
  trusting a def field is live — a schema-valid def can still be inert.
- **A quoting boss can rhythmprint-collide with the boss it quotes.** The KS gate compares AGGREGATE
  gap distributions (tests/boss.mjs:171), which saves us (three envelopes blend into a distinct
  mix), but the safe discipline is: never quote an envelope at its original tempo — shift it and
  re-run the gate.
- **The medley isn't just data-swap: it re-prices the fight.** The placeholder cadences are what
  pinned the stage-3 lockdps margin (35.4s vs the 34s timer). Any real rhythm must re-clear
  lockdps + the not-a-phase-deleter invariant — the same class of trap as the rung-14 phaseSpans
  lesson, from the other side (the model was right, the tuning moves).
- **Branded-then-destructible dissolves the collection-lockout trap BY CONSTRUCTION.** For any
  "collect all N, but the N are shootable" design: gate destructibility on the claim itself
  (`reckoningBranded.has(name)` before damage routes) and the lockout becomes unrepresentable —
  no invariant test has to chase code paths that can't exist. Cheaper than either
  "destruction-counts-as-claimed" (opens a second unlock path every future session must reason
  about) or a standalone invariant.
- **The second sun is the plan's hidden iceberg.** The model-header one-liner ("the second-sun
  landmark + handoff()") expands via §5h into a run-scoped environment/save/progression system
  (ledger-driven aperture, two latched beats, retro seed-on-load) that KNELLGRAVE's Decision C1
  already deferred once for size. When a reserved item names a SYSTEM the registry has a schedule
  for, size it from the schedule, not the one-liner.
- **Existing generalized plumbing covered more than expected:** PART_SYS (ribs/panes/shackles) is a
  ready 4th-entry seam for destructible relics; the horizonSeed system is the WRONG lifetime for
  the second sun (per-encounter vs run-ambient) but the right render pattern (fog-exempt,
  sky-tier). Reuse review = check lifetime + ownership, not just capability.

**What it unlocks.** A feasibility auditor can now attack concrete claims (each increment names its
seams by file:line), and CP1/CP2 critics have per-increment GO gates + the owner-decision list
(D1–D7) to hold the build against.
