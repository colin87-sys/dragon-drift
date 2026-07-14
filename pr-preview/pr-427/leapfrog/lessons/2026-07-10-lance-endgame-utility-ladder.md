# 2026-07-10 — The lance endgame: reachability first, then let the brands burn

**Did.** Wrote `docs/lance-progression-redesign.md` — the plan that supersedes the
2026-07-08 lance curriculum doc. The old doc fixed the TEACHING order but accepted a
lance-free endgame ("fine if the gimmick owns the fight"); the owner rejected that: the
lance dies at boss 10 and is useless by the finale. The new plan gives all five endgame
bosses (KNELLGRAVE / WEFTWITCH / ONEWING / EMBERTIDE / THE UNMASKED) real paint anatomy
grounded in their shipped models' named nodes, one lance rule each that RIDES the
fight's one puzzle read (toll-resonant release / mend-interrupt volley / echo-pip pairs
/ fork-feeds-the-beam-duel / the relic-ledger showcase), and a band-gated economy
escalation (SCAR-BURN).

**Learned (the synthesis insights).**
1. **The deficit was REACHABILITY, not numbers.** `capByTier` already promises 6 pips
   at Tier 4/5 — the game's highest — but no Tier-4/5 boss has one paintable organ, so
   the ladder was paper. Give the endgame organs and the shipped economy already pays
   ~10%/volley there. Diagnose "weapon feels dead late" as a target-supply problem
   before touching damage laws.
2. **Escalate ON TOP of a clamp-LAW, never through it.** SCAR-BURN (full-cap releases
   at tier ≥4 add `0.5 × volley` as a 3s burn) leaves `volleyRoiFrac` 0.10 and both
   lockdps invariants untouched — tiers 1–3 are byte-identical, and the new invariant
   is one line (`burn ≤ frac × volley`). Additive band-gated channels beat retuning a
   LAW: nothing shipped moves.
3. **`formLifebars` makes the finale clamp-free by construction** — `currentPhaseHp()`
   returns the full 240 form bar, so the ROI ceiling (24) exceeds any raw volley. The
   quirk IS the crescendo: the Apex is where raw pip math finally pays in full.
4. **Gotcha:** `tests/lockdps.mjs` is RED on master — it still asserts KARNVOW is
   lance-inert, but KARNVOW gained trophy lockParts at CP2. A roster-shape assertion
   baked into a band gate goes stale the moment a def evolves; re-green it (PR0) before
   any economy change, or every later diff is noise. (Also stale: the `bossDefs.js`
   comment still promising `lockMuted` for slot 13 — the plan formally retires it.)

**Reusable pattern.** "REACHABILITY LAW": every tier ≥4 boss must reach its full tier
cap in ≥1 phase (`peakCap === tierCap`) — added to the plan as a ratchet test so the
cap ladder can never silently regress into paper again. Organ additions stay byte-
neutral via named empty Object3Ds (the EITHERWING marker precedent).

**Unlocks.** PR0 (re-green lockdps) → PR2 hero KNELLGRAVE proves "an endgame boss
gains lance utility while its gimmick is amplified" → SCAR-BURN → the remaining
World-Enders → the UNMASKED relic-ledger (which the def's own CP2 note already asks
for). Full order + gates in the doc §6.
