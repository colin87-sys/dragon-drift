# Lance endgame plan: feasibility + verification pass (docs only)

**What we did.** Pressure-tested `docs/lance-progression-redesign.md` against the
live code and the real `lockdps` numbers; wrote
`docs/lance-progression-feasibility.md` (per-mechanic seam ratings, the balance
arithmetic, a concrete invariant/test strategy, reviewer guardrails, and a
gated rollout). No game code changed.

**What we learned (the gotchas worth keeping):**

- **Run the tool before trusting the plan's prose.** The plan's §1c.5/PR0
  ("tests/lockdps.mjs is RED") was already fixed on master (`36b754d`); and the
  plan's §3 rung-10 math ("+50% burn ⇒ ~15%") is stale against its own §4b ramp
  (0.25 ⇒ 12.5%). Plans rot in days here — the economy table is the truth.
- **Model names beat plan names.** EMBERTIDE's "new empties eyeHollowL/R"
  already exist as `eyeHollow0`/`eyeHollow1`; WEFTWITCH's "new empties
  handL/handR" have existing homes (`palmL/R`); ONEWING's three organs are all
  already named. Grep the model before budgeting new geometry.
- **`paintFromParry` is the wrong grant seam for echo-pips**: it sets
  `paintCd` (throttles the player's next paint), refreshes instead of stacking,
  and forces a `paintHop`. A granted pip needs its own tiny export
  (`grantPip`) with none of those side effects.
- **Multiply FOCUS into any cadence claim.** `focusDwellMult 0.5` is a shipped
  LAW; ONEWING echo-on-stack + focus collapses the full-cap cycle to ~2.6 s and
  ideal perfect-lance then clears a phase INSIDE its card timer — the one place
  the plan could ship a phase-deleter. Fix: echo on first paint only, enforced
  by a new NOT-A-PHASE-DELETER invariant
  (`toClearPerfect × cadence ≥ card timer`, per phase).
- **A perfect-gate that keys off `beatOn` is determinism-free by construction**
  (headless clock is null → no burn), but it is also UNREACHABLE on KNELLGRAVE
  (musicDies kills `getBeatClock`) — the toll→beatOn seam is required hero-PR
  plumbing, not polish.
- **Freeze-fixture pattern:** pin the shipped six bosses' exact
  volleys-to-clear (51/57/42/97/56/45) in `tests/lockdps.mjs` so "tiers 1–3
  byte-identical" is an assertion, not a review promise.

**What it unlocks.** The endgame-lance PRs (plan §6) can now land against a
pre-written gate: extend `invariantBreaches` with the burn/reachability/
phase-deleter predicates in the same PR as each mechanic, and the balance tool
can never silently under-report the endgame again.
