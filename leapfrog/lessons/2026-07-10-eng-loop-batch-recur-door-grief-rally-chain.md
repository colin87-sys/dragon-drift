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

**The POST-build pass earned its keep — one adversarial Fable verifier per mechanic caught what the
green gates didn't.** This is the owner's *"double-check at each critical checkpoint"* discipline, and it
found bugs a passing suite hid:
- **KARNVOW — a HIGH, repro'd:** a rally can legitimately outlive the 7s `riposteCd` (3 exchanges with
  late answers ≈ 8s); once the cd expires mid-rally, a stray `kind:'player'` landing (a co-parried stock
  amber arriving a frame late) enters the *fresh*-riposte branch and **wipes `rallyN`** — "RALLY ×3 — BREAK
  IT" then the flinch silently never comes. The compressed gate (3 exchanges in <1s) can't reach it. Fix:
  re-arm `riposteCd` in the continuation branch so the cd stays hot through a live rally (the fresh branch
  is then unreachable mid-rally *by construction* — stronger than a test).
- **HOLLOWGATE — the ENG-EW lesson INVERTED:** the DOOR-OPENS gate armed the breach only through
  `debugCrackPane` (the debug mirror) — no test broke a pane through the shipped `bossDamage →
  routePartDamage → applyPartBreak` route. A green gate over an *untested production line*: rename the row
  key or reorder `left` above the crack and the shipped arm dies silently. Fix: break the 8th pane by
  gunfire routing (`emit('bossDamage', {part:7})`) and assert the breach. *Reusable: a gate that only
  exercises the debug seam proves the seam, not the mechanic — always drive at least one assert through
  the production path.*
- **KNELLGRAVE — a gate coverage hole:** both chain sub-tests stopped at the FIRST toll, whose gap-update
  is skipped by the `-10` sentinel — so the whole "live metronome" half (`lastTollGap` clamp band, jitter
  response) ran on the 1.2 *default* and was never asserted. Fix: drive to the SECOND toll and assert the
  measured gap ≠ 1.2 and in `[0.5,2.4]`. Plus two LOW fixes it found: `staggerT` leaked across
  `breakShield` (a completion that raised the phase-floor shield froze free scheduling-silence into the
  next phase — now zeroed at the seam), and a test `beat()` that could step `updateBoss` time backwards
  (`round`→`ceil`).
- **A live-play fragility, deferred honestly (KNELLGRAVE F2):** at a burst head `lastTollGap` holds the
  stale transition gap, so the 1st chain amber banks only if parried *after* its toll rings — an early
  parry silently no-banks and caps the burst at 3/4. Arguably by-design ("on the bell's beat" = after it
  tolls), but flagged in a code comment + to the owner as preview-judged; the fix (accept against the
  imminent release via `chargeT`) is a mechanic change that wants a feel-check, not a blind patch.
- **ONEWING / ASHTALON — clean** (Onewing byte-identity proven by an A/B dump across all 14 bosses; Ashtalon
  recur live-reachable, `debugClearShield` confirmed inert-not-cover-up). Onewing gained one hardening: the
  gate now asserts the post-break bullet's magenta color + `part:null`, not just `!reflectable` (a visual-lie
  amber regression would otherwise pass).

*The meta-lesson: the pre-build pass catches unshippable specs and drift; the POST-build pass catches
implementation bugs the author's own green gate manufactures. Neither alone is enough — the Karnvow wipe,
the Hollowgate wrong-path gate, and the Knellgrave 1.2-default coverage hole were all GREEN before the
second pass read the code adversarially.*

**What this unlocks.** The whole ENGAGEMENT-LOOP + BOSS-FEEL backlog is now cleared EXCEPT the capstone:
**UNMASKED Part D** (the Apex medley), which lands last on purpose — its exam can only quote loops that
work, and now they do. The `recur` primitive is a reusable recurrence dial for any moving setpiece; the
ghost-beat predicate is the template for any future rhythm-parry mechanic; the two-Fable-pass (pre-drift +
post-adversarial) is the discipline that caught a probe-only unshippable spec, a runtime throw, a
test-harness latch bug, and a mis-seeded flake — none of which a single pass would have.
