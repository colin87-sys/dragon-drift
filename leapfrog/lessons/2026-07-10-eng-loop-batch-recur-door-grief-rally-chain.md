# The engagement-loop batch — five deferred mechanics (Ashtalon `recur`, Hollowgate "the door opens", Onewing grief-transference, Karnvow rally, Knellgrave rhythm-parry chain), each with a two-Fable-pass (pre-build spec-drift-check + post-build adversarial verify)

**What we did.** Shipped the five focused mechanics the ENGAGEMENT-LOOP + BOSS-FEEL audits deferred (the
owner picked scope up-front: all five, no Unmasked; Hollowgate weak-point ONLY; build the Knellgrave
chain rather than delete the doc claim; audit-default difficulty). Every mechanic went through the
load-bearing discipline **twice**: a high-effort Fable **PRE-BUILD** drift-check (verify the audit's plan
against current HEAD, correct the line-anchor drift, produce an exact build spec) → build + gate → a
high-effort Fable **POST-BUILD** adversarial verify (read the actual implementation, hunt the "green that
hides a bug" class) — the owner's explicit ask: *"not just a fable pre-audit spawn but also at each
critical checkpoint to double-check your work."*

**The single most valuable pre-build save (a probe turned an unshippable spec into a shippable one).**
KNELLGRAVE's rhythm-parry chain — the World-Ender parry DEBUT the registry has advertised for weeks with
no consumer — was about to be built as the audit described it: "parry the 4-amber chain within a beat
window of the toll." The Fable pre-build agent **ran a headless probe against the real engine** and
measured that **0 of 11 chain-amber arrivals land within the beat window of any toll, and the 4th amber
has no toll at all** (the burst is the phrase's tail, so its last stroke never rings). A naive
nearest-toll window is *structurally impossible to complete* — building it as specced would have
re-created the exact paper mechanic the fix set out to kill. The save: a **GHOST-BEAT** predicate —
on-beat = within a window of the nearest *multiple* of the live toll period (`|since −
round(since/gap)·gap|`), so the metronome extrapolates the un-rung 4th stroke. *Reusable: when a mechanic
keys off a rhythm, MEASURE the real arrival-vs-beat offsets before you pick the window; a plausible spec
can be arithmetically unreachable, and only a probe (not reasoning) catches it.*

**The pre-build drift-checks caught two more blocking defects the audit couldn't see (HEAD had moved).**
- **HOLLOWGATE**: `debugCrackPane` (the headless seam) bypasses `applyPartBreak`, so placing the breach
  trigger only in the production path would make the prescribed gate *fail* — the breach could never arm
  via the debug seam. Fix: a shared `armBreach()` called from BOTH paths. (Also caught a ceremony
  double-fire — the 8th pane's own break already plays `shieldShatter`+shake in the same frame — and
  swapped to the state-flip vocabulary.)
- **KNELLGRAVE C.2**: the sweep un-gate needs BOTH gates patched — the arm gate AND the per-frame
  keep-alive `live` gate — with the `pendulumSweep` disjunct INSIDE the `discCd` conjunct (top-level
  would bypass the cooldown). Patching one arms a pocket the other kills next frame.

**The build surfaced bugs the pre-build spec didn't predict — this is why the POST-build pass exists.**
- **The `player`-in-`damageBoss` throw (KARNVOW).** The rally-flinch ceremony copied `bulletGraze(player)`
  from the holdFlinch code — but the flinch fires inside `damageBoss(amount, kind, e)`, which has **no
  `player` param**. `bulletGraze(undefined)` threw at runtime. Fix: `lastPlayer` (the module-stored
  player), guarded. *Reusable: a reward ceremony lifted from the fight-update loop into `damageBoss` loses
  `player` — grep every `player.` in a damageBoss-side branch.*
- **The `rollParried` latch in the test harness (KNELLGRAVE).** The chain banked exactly ONE parry then
  stopped: the consumer sits inside the `if (!rollParried)` latch, and a headless parry helper that does a
  single `updateBoss` never clears the latch — so the 2nd..Nth parries were silently skipped. Fix: the
  helper must tick a second, non-rolling frame (the shipped eitherwing/onewing helpers already do). *This
  is a TEST bug that would have shipped the gate asserting "1 bank works" while claiming to prove 4.*
- **Shielded completion (KNELLGRAVE).** The chain's chunk `damageBoss` is absorbed by the frozen test
  shield, so hp doesn't drop — asserting an hp chip was WRONG. The honest completion proof is the bell
  **stagger** (`staggerT > 0`) + the event, not the chip (the chunk raises the floor under the shield —
  the ENG-LT law). *Reusable: when a headless gate freezes the clock with a shield, the reward's DAMAGE is
  absorbed; assert the STATE change (stagger/window), not the hp delta.*

**A flaky test, root-caused and killed instead of re-run.** The `karnvow footwork` assert (a known
"green on re-run" flake) started failing under this diff. Root cause (from the test's own admission): the
karnvow model is BUILT with real `Math.random`, and the seeded LCG in the footwork block only covers the
tick loop, not the build — so the dart-spread drifts with whatever RNG the upstream tests (now perturbed
by the new code paths) left on the stream. Fix: **seed the model build** (`buildBoss(karnvow)`)
deterministically, killing the flake at its source. *Reusable: a "seeded" test that still flakes is seeding
the wrong stage — find the un-seeded `Math.random` consumer (often procedural model construction) and seed
THAT; a deterministic build can't flake.*

**The honest-gate law, applied five times.** Each gate drives the LIVE mechanism, never a pinned fiction
(the ENG-EW anti-pattern): Ashtalon's recur re-arms over a 48s sim with the DPS-gate shield force-cleared
(a new `debugClearShield` seam — the shield is orthogonal to recur; a live player Surge-breaks it);
Hollowgate breaches on the real last-pane path AND the debug seam, with rib/shackle coexist asserts;
Onewing solves the bullet's aim target back from `x + vx·rel/closing` to prove MIRROR-aim vs LIVE-aim
(not a trivial pass); Karnvow drives the full 3-exchange rally to the flinch with the re-reflect landing
injected (headless physics don't auto-route it — the shipped karnvow drive injects the same way);
Knellgrave banks on hand-computed ghost beats and asserts off-beat RESETS + weftwitch-inert coexist.

**Verify.** `tests/boss.mjs` **123** green (was 121; +2 fence blocks + the sweep twin-split rewrite +
the footwork-flake seed), deterministic across repeated runs; `bossboot` green. Only
`boss.js`/`bossDefs.js`/`tests` move; every engine edit is def-gated (recur/breached/ghostHalf/
reflectRiposte/rhythmParry/pendulumSweep all key off existing or new def keys); `stamp-sw` in the commit.
`riders` (Eitherwing/Karnvow `figureEight`/`flankCutIn` recur) deferred as owner-preview-gated — the
hero (`stoopingStrike`) ships first.

**Preview-judged.** All five are feel/tuning-live: Ashtalon stoop cadence (`recur:9`), the Hollowgate
door-opens read at 30m (banner+shake+the already-absent radials, no model beat — the accepted floor for a
weak-point-only PR), Onewing's post-break mirror-dodge difficulty (dial = enrage 0.7→0.8, NEVER the
mirror), Karnvow's rally return-speed ladder, Knellgrave's `RHYTHM_PARRY_WINDOW` 0.25 + P4 pocket density.
Each target is the audit's; each is one line back.

**What this unlocks.** The whole ENGAGEMENT-LOOP + BOSS-FEEL backlog is now cleared EXCEPT the capstone:
**UNMASKED Part D** (the Apex medley), which lands last on purpose — its exam can only quote loops that
work, and now they do. The `recur` primitive is a reusable recurrence dial for any moving setpiece; the
ghost-beat predicate is the template for any future rhythm-parry mechanic; the two-Fable-pass (pre-drift +
post-adversarial) is the discipline that caught a probe-only unshippable spec, a runtime throw, a
test-harness latch bug, and a mis-seeded flake — none of which a single pass would have.
