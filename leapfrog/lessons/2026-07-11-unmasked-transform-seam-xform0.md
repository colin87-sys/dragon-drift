# THE UNMASKED transformation rework — §0 the SHARED SEAM: a transformation is a BEAT MAP, not an ease — per-transition durations + a model beat table the harness reads for camera/audio, landing the reveal PUNCH on the eye-snap instead of the fade tail

**What we did.** The owner's review: boss 14's stage transitions "aren't cinematic — I thought S1→S2
the eye cracks and the 2nd-stage boss comes out, but I don't see any of that." A prior session captured
two Fable assessments into a full build plan (`reforged/boss-context/UNMASKED-TRANSFORMATION-REWORK.md`,
PR #378) that diagnosed the root cause: both transitions are real and wired, but they're **2.0s
crossfades with no phrasing** — all the good machinery (fire-free hold, deferred name card, the all-eyes
snap, slow-mo punch) fires at the END of a morph nobody can read. This is **step 1 of 5**: the shared
seam every later choreography step depends on. Built under the two-Fable-pass discipline (the plan is the
pre-build spec from two assessments; a drift-check verified it against the current tree → GO-WITH-FIXES;
this is the build).

**The thesis (the reusable pattern): a transformation is a BEAT MAP, not an ease.** Instead of one
duration + an eased crossfade, the model exposes a per-transition **spec** — `dur`, `revealAt` (the frame
the reveal PUNCH lands, near the *end*, ON the eye-snap), `throwAt`, and a **beat table** (times → camera
shake / slow-mo / a one-shot sfx). The MODEL owns the visual morph; the HARNESS owns camera + audio (the
shipped contract split). The seam this increment builds:

- **Per-kind durations** (`bossUnmasked.js`): `TRANS_DUR = 2.0` → `TRANS_DURS = { crack: 6.0, unveil: 4.8 }`;
  the tick advances `transT += dt / TRANS_DURS[transKind]`. `stageTransitionDur` stays a **legacy alias**
  (= the crack) because **7 reads in boss.js gate on its truthiness** — breaking that alias would silently
  disable the fire-hold for the whole transition system.
- **`stageTransitionSpec(n)`** (new export): the beat map, a pure data function (zero build-time RNG).
- **The harness beat dispatcher** (`boss.js`): `beginStageBeat(skippable, n)` reads the spec; a monotone
  cursor over the time-sorted beat list fires each `{shake, slowMo, sfx}` as `stageBeatT` crosses its `t`
  (one cursor → no double-fire; both clocks advance by the same dt → no drift under slow-mo). The reveal
  punch moved from `stageBeatDur` (the fade tail) to `revealAt` (5.6s of the 6s crack — ON the snap).
- **The real card name on the snap**: `def.cards[phaseIdx]?.name` (phaseIdx is post-increment at reveal
  time) instead of `def.phases[phaseIdx]?.name` (which is undefined → showed the generic boss name).
- **Freeze the capture deadline during the beat**: the new stage's card arms at `breakShield` and its
  countdown would bleed ~7.6s during the fire-free crack — gate the decrement on `stageBeatT < 0`.

**Three fixes the drift-check caught that the plan's own §3 missed:**
1. **A hidden duration-coupled test.** `tests/boss.mjs` had hard-coded `for (i<30) tick(0.1)` = 3.0s loops
   commented "run past TRANS_DUR." With the crack now 6.0s, 3.1s leaves the morph half-done → the
   `!stage1.visible` assert fails. *Reusable: a test that hard-codes a tick-count to "run past" a duration
   is silently coupled to that duration — grep for loop counts near any constant you change.* Bumped to
   run past 6.0s / 4.8s.
2. **`beginStageBeat` had to thread `n` AND keep `skippable`** — two call sites (mid-fight `phaseIdx+1`
   pre-increment; intro `target` = `debugStagePin−1`), and the `stageTransitionDur` truthy alias + the
   `!dur` early-out keep every other boss inert.
3. **The lance-reticle suppression is cross-file** (it renders from `lockHudState()` in `lockLayer.js`, not
   boss.js; the boss.js `reticle*` vars are the unrelated Surge focus ring). Deferred to §1 to keep §0
   self-contained to `boss.js` + `bossUnmasked.js` — flipping `fightRunning` would trigger `clearLocks`.

**Interaction with the recently-merged §5i.D medley code (verified clean).** My PR-2 added
`stageBeatT`-gated code (the figureEight setpiece-clock freeze, the orbit-band darken). Those reads are
**duration-agnostic** (`stageBeatT < 0`), so lengthening the crack to ~7.6s only *extends the already-
intended* station-hold + band-disable — which is exactly what the crack cinematic wants (the boss holds
its breath, doesn't fly its eight during the mask-crack). No starvation: the freeze *delays* the setpiece
clock, doesn't consume it.

**Endpoint contract preserved by construction.** §0 touches no `setStageMorph(k)`/`setStage3(k)` geometry
— only the *speed* of the morph and the harness beats — so the `k ∈ {0,1}` byte-identity contract holds
trivially for this increment. The visual choreography the beats sync to (the sclera fissure, the shatter
debris, the wing throw, the eyes-shut→eyes-open) lands in steps 2–5.

**Verify.** `tests/boss.mjs` **126** green, deterministic; `bossboot` green. New assertions on the beat-map
contract (per-kind durations, revealAt < dur, the beat table is non-empty + time-sorted, the legacy alias
holds). The unmasked organ/reckoning model tests are orthogonal (0 references to any transition machinery).
Every edit is `stageTransitionDur`/`stageBeatT`-gated → byte-identical for the rest of the roster; zero
geometry → `tricount`/`tiershots` unchanged. `stamp-sw` in the commit.

**Preview-judged — and a real caveat.** §0 stretches the crack to 6s with only the harness punctuation
(a first-crack tick, a shatter shake+slow-mo, a wing-throw) against *today's* flat crossfade — the visual
beats those punctuations sync to don't exist yet. So the owner should judge: does the longer, punctuated
transition read as *deliberate* or *draggy*? The beat map makes compression trivial if it drags (shrink
the middle beats, never the stilling or the hold). This is the foundation; steps 2–5 fill the 6s with the
crack / shatter / unfurl / all-eyes-open the owner actually asked to see.

**What this unlocks.** Every later transformation step is now a matter of authoring `setStageMorph`/
`setStage3` as piecewise-over-k choreography + adding beat entries — the durations, the dispatcher, the
reveal timing, and the card/timer plumbing are all in place. The pattern generalizes: any multi-stage
boss that wants a *read* transformation exposes a `stageTransitionSpec` beat map rather than a single ease.
