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

**Owner follow-up (same day) — four design resolutions (feasibility doc §8):**

- **SCAR-BURN redesigned to an on-tell PARTIAL release.** The owner caught that
  "perfect full-cap release" gives only the ~1s capFuse window to hit the beat,
  and the beat-aligned cap auto-release is already on-beat for free. The fix
  reuses the EXISTING `onBeat = source==='tap' && ctx.beatOn` path in
  `releaseVolley` and drops the full-cap requirement: burn on a deliberate manual
  on-tell loose at ≥ `burnFloor` (3) PAINTED pips; cap auto-release never burns
  (safe fallback). Wide, player-owned window; the boss's tell drives timing.
- **The frictionless ideal cadence is the WRONG phase-deleter yardstick** — it
  condemns even the shipped game (a 0.57s/pip manual-tap player "deletes"
  KNELLGRAVE P3 with no burn). Reform the invariant around a REALISTIC per-pip
  constant (1.35s, a labeled modeling const in `lockdpsCore`, NOT game config),
  calibrated so shipped phases clear lance-only in ≥1.4× their timer.
- **Partial-release + echo is a double-throughput trap.** A free ghost pip per
  dwell lets you paint-fire-repeat on ONEWING's small late phases. The single
  load-bearing brake: **granted (echo) pips are spectral — 0.5× damage, no burn,
  don't count toward the floor.** With that ONEWING keeps frac 0.35 (a
  full-damage ghost is a phase-deleter at even frac 0.15). Thematically clean.
- **Finale is frac 0.20, not 1.0.** On the 240-HP form bar (clamp never bites),
  lance realistic DPS = 2.5(1+frac)/1.35; 0.20 → ~31.5% of the 240/34 pace
  (~1/3, owner's ask); 1.0 was ~52%. RECKONING now UNLOCKS the burn.
- **Elemental / per-dragon lance: enrich, don't replace; ship as Phase-2.**
  `lanceTint`/`lanceRune` are already per-dragon but cosmetic-only and gated to
  Eternal form (`formLevel≥3`) — a `lanceEffect` field slots in at the same gate.
  Element = what the volley DOES (roost build choice); per-boss organs+timing =
  how well you land it (in-fight skill). The one anti-pay-to-win/grind-wall rule:
  **iso-budget sidegrades** — every element ≤ Standard's on-tell budget, and the
  free Azure Drake on Standard must clear the whole game.

**What it unlocks.** The endgame-lance PRs (plan §6) can now land against a
pre-written gate: extend `invariantBreaches` with the burn/reachability/
phase-deleter predicates in the same PR as each mechanic, and the balance tool
can never silently under-report the endgame again. The elemental axis (PR9)
rides on a Standard baseline the invariant already proves safe.
