# THE UNMASKED medley — PR-2: stage 2 QUOTES two forms at once (EITHERWING's orbit wheel + MARROWCOIL's gap-thread), a HOSTED setpiece with `recur`, and a beat-farm guard that stops the frozen crack cinematic from becoming a graze farm

**What we did.** With the dispatcher proved on stage 1 (PR-1), stage 2 (the "Ophanim — Wheels
Within Wheels") now quotes **two** shipped graze forms simultaneously: EITHERWING's `orbitAnnulus`
(fly the figure-eight band, a full lap pays the jackpot) and MARROWCOIL's `gapThread` (cleanly
cross a moving wall's gap to score). Zero new attack ids, zero new geometry — pure def data plus
one boss.js gate. The owner confirmed the default stage→form mapping ("go with the recc").

**The three moving parts (all def-gated, all shipped machinery re-quoted):**

1. **`grazeMedley[1] = 'orbitAnnulus'`** — the dispatcher now returns the wheel form in stage 2.
2. **A HOSTED setpiece the boss doesn't own geometrically.** `orbitAnnulus` is inert without a
   `figureEight` setpiece to arm on (the band derives its centre from the live pose *during* the
   eight). We host it: `setpieces: [{ id:'figureEight', atPhase:1, dur:8.0, moving:true, recur:12 }]`.
   The drift-check's load-bearing catch: **`recur` is not optional here.** Eitherwing's eight entries
   serve ⅓-bar phases with **no recur** — fine there. The Apex's stage 2 is a **full 240-hp bar**;
   one 8s eight would be dead ~90% of the stage. `recur:12` re-arms it through the whole bar. The
   recurrence machinery (`setpieceRecurCd`, the station-keeping else-arm) is **generic** — it re-arms
   any def entry carrying `recur` at the current phase via the same `armSetpieceForPhase` path a live
   entry takes (Ashtalon's `recur:9` stoop is the precedent), and `armSetpieceForPhase` re-primes the
   orbit accumulator id-keyed (`if (sp.id === 'figureEight') orbAcc=0…`), so each re-armed eight is a
   fresh lap counter. Stage-scoped for free: `setpieceForPhase(2)` returns null → no eight in stage 3.
3. **`gapThread: true` is a def-level flag but STAGE-SCOPED by construction.** `gapThreadActive()`
   is phase-independent (true for *all* unmasked stages), yet rows only ever register through a **wall
   attack** (`movingGap`/`curtain`/`crestfall`/`geyser` — the 4 `noteGapThreadRow` sites), and only
   stage 2's attack list carries one (`movingGap`). Stages 1/3 have no wall attack → no rows → the flag
   is inert there without any per-stage gating. *Reusable: a def-level flag can be stage-scoped by the
   DATA (which stage's attack list can trigger it) rather than by a runtime phase check — but you must
   PROVE the data scoping in the gate, because the flag itself lies about being global.*

**The gotcha PR-2 existed to fix — the beat-farm leak (drift-check design flaw (a)).** A multi-form
boss freezes its hosted setpiece at k=0 during the **fire-free stage-transition cinematic** (the mask
cracks, ~2.7s of no bullets). But the orbit `live` gate was `setpieceT >= 0 && id==='figureEight'` —
**true during the freeze.** The band would draw, and a player circling the *parked, harmless* boss
would bank ticks and a free lap with zero threat: a graze farm handed out during a cutscene. Fix: one
conjunct, `&& stageBeatT < 0`. It is **identity for eitherwing** (no `model.stageTransitionDur` →
`stageBeatT` is permanently −1), so the shipped wheel boss is byte-unchanged; it only bites the medley
Apex, whose transition beat is real. *Reusable law: any continuous-graze band that arms on a setpiece
must also gate on "not mid-transition-beat" for a multi-form boss — a frozen setpiece is still
`setpieceT >= 0`, and a cinematic with no threat is exactly where a farm hides.*

**The honest gate (three new non-vacuous proofs).** Exposed `stageBeat: stageBeatT >= 0` as a test
seam, then:
- **Stage 2 orbit PAYS when flown**: run the hosted eight, co-rotate in the band → `orbGraze` ticks +
  a lap jackpot. And **parked dead-centre earns zero** (the anti-farm floor — you must fly it).
- **No stare-leak**: the parked stage-2 stare pays zero holdTier/holdFlinch (the stage-1 quote does
  not bleed through — `grazeFormNow()` returns `orbitAnnulus`, so the holdFlinch branch never enters).
- **Beat-farm guard**: force the transition beat (`setBossDebugPhase(2)+setBossDebugStage(2)` arms it),
  circle the band, and assert the band stays **dark** and banks **zero** ticks *for every frame the
  beat is active*. Boundary handling: a tick is attributed to the beat only if `stageBeat` is true both
  **before and after** the update — the frame the beat ends mid-update, orbit legitimately goes live,
  and that post-beat tick is not a farm. Proven non-vacuous: removing `&& stageBeatT < 0` leaks **7**
  ticks; commenting `gapThread: true` drops the row count to **0**.

**Verify.** `tests/boss.mjs` **126** green, deterministic across repeated runs; `bossboot` green. The
unmasked lifecycle test now exercises the setpiece legs (a def gaining `setpieces` flips off the
`!sawSetpiece` fence; `moving:true` triggers the fires-while-travelling assert — both pass).
Eitherwing/marrowcoil byte-identical (every edit is `stageBeatT`-gated identity or def-data on the
unmasked key only); amberdiet/rhythmprint stable (no attack-id or carrier change). `stamp-sw` in the
commit.

**Preview-judged.** The owner feels: does the wheel read at the Apex's sky-scale (`scale 2.4`) — is
the band legible about the huge disc? Is the `recur:12` cadence right (one eight per ~20s of stage —
too sparse? too busy?)? Does the gap-thread wall fire cleanly inside the seraph's crossfire without
reading as noise? Each is a one-line dial.

**What this unlocks.** Two of three medley stages are live and proved. PR-3 is the last quote: stage 3
→ `shrinkDisc` (Knellgrave's converging toll-wall) via an **iris→spiral attack-id swap** — which the
drift-check flagged must hit **both** `phases[2].attacks` AND `rhythm.phases[2].phrase` (the phrase
machine fires ids directly; swapping only the attacks list leaves iris firing and the disc never
arming). The spiral's toll-wall arms off the player-lane `anchorX` fallback — no bell/organ needed.
