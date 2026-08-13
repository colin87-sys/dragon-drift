# The whole-game audit: synthesize from many agents, then audit the synthesis against HEAD

**Date:** 2026-07-20 · **Session:** game-design-research-audit · **PR:** #531

## What we did

Built `reforged/GAME-DESIGN-AUDIT.md` — the first whole-game teardown + leverage plan
(T0–T8) — from a 9-report multi-agent research pass (systems inventory, initiative
status board, harsh design teardown, FTUE/audio evidence sweeps, genre research across
~19 runners/flyers/shmups, ledger mining incl. an owner-taste profile, doc-vs-code
cross-checks), then ran a **three-auditor adversarial round on the plan itself**
(grounding / feasibility / conflicts+taste) before calling it final.

## What we learned

- **A synthesized plan inherits its sources' timestamp skew and must be audited against
  HEAD before it is build-safe.** The draft's single most build-directing sentence
  ("DRIFT drives the score mult; retire flowChain") contradicted the owner's §7 R1-FLAT
  ruling merged ONE DAY earlier in #528 — and three specced deliverables (Ember Keel
  HUD, unified flow mult, radio-through-death) were already merged. Research agents read
  docs; docs lag code in BOTH directions here (stale "NOT YET BUILT" headers on built
  work; "to-build" specs for shipped work).
- The audit round paid for itself in one finding each: grounding killed a false premise
  (~93% claims held; "radio dies on crash" didn't — no teardown exists); feasibility
  killed a wrong mechanism (bare `mods.speed` for a late-game speed tier is byte-safe
  but fairness-unsafe — speed must co-scale the steering chain, and the run-all fix
  already sits in unmerged #522); conflicts killed a re-litigated ruling (above) plus a
  resurrected CUT item (Aurora hazard).
- The repo's gates measure visuals rigorously (Fable ≥4.2, tricount) but nothing gates
  "is minute 6 fun" — the plan's core diagnosis (challenge arc spent at ~90s; verb
  scarcity under five multipliers; the lance layer untaught and unpaid; bosses unseen
  then under-rewarded) lived in config for months without a gate to catch it.

## The gotcha

**Do not hand a multi-agent synthesis to build sessions un-audited.** Every research
report was individually excellent and the merged plan still contained: one overturned
owner ruling, two already-shipped deliverables, one impossible mechanism (open-flight
graze feeding boss grazeGain — the collider loop is skipped in-boss), and one vacuous
verification gate (economy.mjs's band models a 1.2km run and can't see boss pay).
Synthesis error ≠ source error; it needs its own verification stage.

## The reusable pattern

For any plan-scale doc: **grounding / feasibility / conflicts three-auditor split**,
run AFTER synthesis, BEFORE the status flips to FINAL — grounding verifies file:line
claims against code, feasibility attacks each mechanism with direct reads (and checks
open PRs so you *harvest* instead of redo — #522 carried a session-plus of test repairs
we nearly re-speced), conflicts greps the newest rulings/lessons/PRs for anything the
plan re-litigates. Fold findings into a §9 audit log so the next session sees what was
corrected and why.

## What it unlocks

A hand-off-safe master frame: 9 leverage-ranked tracks with corrected mechanisms and
honest efforts, a §8 owner-decision queue (DRIFT flip, boss-school, archetype ruling,
lance embers, gacha-vs-Gambit, §4a melt, Thundercoil), and binding anti-scope (§7).
Parallel sessions can pick tracks without colliding; the in-flight PRs (#522/#523/
#527/#529/#530) are mapped so nobody double-builds.
