# Backlog mop-up — the RECUR RIDERS: EITHERWING's figure-eight + KARNVOW's flank cut-in now re-offer within a phase (the shipped recur primitive, finally applied to the two deferred setpieces)

**What we did.** A clean backlog mop-up. The `recur` primitive (a setpiece def field — "seconds of quiet
between re-arms of a moving setpiece") shipped on ASHTALON's stoop (`recur:9`) and later the UNMASKED's
figure-eight (`recur:12`). Two signature setpieces were deferred as owner-preview-gated when the primitive
landed: EITHERWING's `figureEight` and KARNVOW's `flankCutIn`. Without `recur` they play **once** at phase
entry and go dead for the rest of the phase — the wheel-graze and the duelist's repositioning both stop.
This applies the primitive to both, so they re-offer ~twice per phase:
- EITHERWING `figureEight`: P2 `recur:10` (dur 8 → ~18s cycle), P3 dread `recur:8` (dur 7 → ~15s cycle).
- KARNVOW `flankCutIn`: P2 `recur:9` (dur 6 → ~15s cycle).

Three def lines, zero engine change — the re-arm machinery (the station-keeping else-arm ticks
`setpieceRecurCd` while idle + unshielded, re-arms via `armSetpieceForPhase`) is **generic** and already
shipped; `armSetpieceForPhase` re-primes id-keyed accumulators (`if (sp.id === 'figureEight') orbAcc = 0`),
so a re-armed EITHERWING eight is a fresh orbit-lap counter — no double-paid lap.

**The honest gate (the reusable pattern for a recurrence dial).** `tests/boss.mjs` gained a §RECUR-RIDERS
block that mirrors the shipped Ashtalon-recur test: force the boss at the setpiece's phase, drive 48s, and
count `setpiece` **false→true edges** (a fresh re-arm) — asserting ≥2 for each rider. The load-bearing
honesty details:
- **Count edges, not presence.** The initial arm is already true at frame 0, so seed `prev` from the
  frame-0 state and count only *subsequent* rising edges — otherwise the one-shot initial arm reads as a
  "re-arm."
- **The coexist proof must prove the setpiece ARMED.** A no-recur boss (MARROWCOIL's `ribThread`) must show
  **0 re-arms** — but "0 re-arms" is vacuous if the setpiece never armed at all. So the helper also returns
  `everArmed`, and the coexist asserts `everArmed === true && arms === 0` ("played once, never re-armed").
  *Reusable law: a "does NOT happen" assertion needs a companion guard that the precondition DID happen, or
  it passes for the wrong reason.*
- Proven non-vacuous by mutation: stripping the three `recur` fields drops the re-arm counts to 0 and the
  asserts fail.

**Coexist / cost.** `recur` is a setpiece-timing field, not an attack id or geometry — so rhythmprint,
amberdiet, `tricount`/`tiershots` are all untouched by construction. Only the 3 def entries changed; every
other boss's setpieces are byte-identical (MARROWCOIL coexist proves a no-recur setpiece still never
re-arms). No stage-beat interaction (EITHERWING/KARNVOW have no `stageTransitionDur`, so the medley's
`stageBeatT < 0` orbit guard is permanently true for EITHERWING — identity).

**Verify.** `tests/boss.mjs` **127** green (+1), deterministic; `bossboot` green. `stamp-sw` in the commit.

**Preview-judged (the reason these were deferred).** `recur` adds *frequency*, and more frequency can read
as *busier* rather than *better* — which is exactly why the owner gates it on the preview. The dials are one
line each: EITHERWING P2 `recur:10` / P3 `recur:8`, KARNVOW `recur:9`. If either boss feels too busy, raise
the quiet (bigger recur) — never below the setpiece's own duration, or a re-arm would try to fire while the
last one is still running (the else-arm gate prevents an actual double-arm, but the cadence would feel off).

**What this unlocks.** Every moving setpiece on the roster that should sustain across a phase now can, with
a one-line dial. Remaining boss backlog is the two Knellgrave toll quirks (F2 early-parry fragility, the
Last-Toll bronze overlap) — both preview-gated and more involved than a data field.
