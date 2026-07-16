# THE UNMASKED "medley" — the grazeForm DISPATCHER (Part D, PR-1 the hero): one boss QUOTES the roster's graze forms, one stage at a time, through a null-safe indirection over every graze-form read

**What we did.** THE UNMASKED (slot 14, the tier-5 Apex, 3-stage `formLifebars` multi-form) has
shipped for a while carrying a **dead label** — `grazeForm: 'medley'` matched no branch anywhere, so
its surge economy was silent. Part D wires the medley to **quote** the roster's now-working graze forms,
a different one per stage. PR-1 is the foundation + the simplest quote proved end-to-end: a single
**dispatcher** and **stage 1 = KARNVOW's stare-down (`holdFlinch`)**. Stages 2/3 come in later PRs.

This went through the **two-Fable-pass discipline** (pre-build spec → drift-check → build → post-build
adversarial verify). The drift-check earned its keep: it corrected the dispatcher to be **null-safe on
`def`** and caught that the live seam's holdFlinch reset wouldn't clear the stare residue once the medley
advances the stage into a *different* form.

**The dispatcher (the whole idea).**
```js
function grazeFormNow() {
  const f = def?.grazeForm;
  return f === 'medley' ? (def.grazeMedley?.[phaseIdx] ?? null) : f;
}
```
Every one of the **exactly 20** `def.grazeForm` / `def?.grazeForm` *code reads* in `boss.js` (not the
~20 comment mentions) now goes through this. For a static-form boss it returns `def.grazeForm` **verbatim**
— bit-identical, the whole roster is byte-unchanged. For the medley boss it returns the per-stage quote from
`def.grazeMedley` (phaseIdx-indexed), or `null` when a stage isn't wired yet (the partial-map rollout:
`grazeMedley: ['holdFlinch', null, null]` → stages 2/3 fall to `null` → no branch matches → status-quo
silence, *not* a regression).

**Two gotchas the drift-check surfaced (both real):**

1. **Null-safety is load-bearing, not cosmetic.** Three of the 20 sites tolerate a null `def` today
   (`gapThreadActive`, `discRideMode`'s guard, and `bossDebugState` — which the crop tool polls *outside*
   a fight). A naive `def.grazeForm === 'medley' ? …` throws there. `def?.grazeForm` first, then compare —
   and at `discRideMode` (`grazeFormNow() === 'shrinkDisc' && def.survivalResolve`) the helper returning
   `null` short-circuits the `&&` **before** the `def.survivalResolve` deref, so dropping the old `def &&`
   guard is safe *because* the helper is null-safe.

2. **A form-CHANGING seam must wipe EVERY graze var, not the entered form's.** The shipped live-seam reset
   (`if (grazeFormNow() === 'holdFlinch') { beamHeld=… }`) only fires when the form you're *entering* is the
   same one whose vars it clears — correct for a single-form boss (always the same form), **wrong** for a
   medley boss that leaves `holdFlinch` and enters `orbitAnnulus`. Stale `beamHeld`/`orbAcc`/`discR` from
   the previous stage would cash straight into the next stage's meter. Fix: a dedicated block keyed on the
   **raw** `def.grazeForm === 'medley'` label (which `grazeFormNow()` *never* returns), at **both** the live
   shield-break seam and the debug stage-jump seam, wiping the full graze-var set. *Reusable law: a reset
   gated on the form being entered is only correct when the form can't change across the seam; a medley
   boss breaks that assumption — clear the union of all forms' state at the crossing.*

**The honest gate (the proof it's not a dead label).** `tests/boss.mjs` gained a §5i.D block that DRIVES
a live UNMASKED at a pinned stage with the player **parked in the stare-down line** (snapped to the boss
pose each frame so the `inLine` geometry always holds) and asserts:
- **Stage 1 PAYS**: `medleyForm === 'holdFlinch'` throughout AND the parked stare banks `holdTier` ≥3× and
  fires `holdFlinch` ≥1× — the *live* branch (graze bursts + the flinch), not a label read.
- **Stages 2/3 INERT**: `medleyForm === null` throughout and the *identical* parked stare earns **zero**
  tier/flinch — the partial map doesn't leak stage 1's quote into unwired stages.
- **Static defs bit-identical**: `medleyForm === def.grazeForm` for karnvow (`holdFlinch`) and ashtalon
  (`slipstream`), and `null` for voidmaw (no grazeForm) — the swap changed nothing for the roster.
- Every drive **pins the actual `phaseIdx`** (`assertEq(s.phaseIdx, …)`) so the inert assertions can't be
  vacuously true by measuring the wrong stage (the honest-gate law: a null-result test needs a guard that
  it reached the state it claims to test).

**Proven non-vacuous the hard way.** Temporarily setting `grazeMedley: [null,null,null]` makes the stage-1
assertion FAIL (`saw [null]`); restored → 126 green. (The `debugClearShield` seam keeps the un-shielded
window open so the stare can arm; the player never damages the boss, so the multi-form never defeats/refills
— a clean single-stage window. The refill economy itself stays covered by the lifecycle gate.)

**Verify.** `tests/boss.mjs` **126** green (+1), deterministic; `bossboot` green. Zero geometry, zero new
attack ids, zero model change → `tricount`/`tiershots` unchanged by construction; every static-form boss is
byte-identical (the dispatcher is a pure passthrough for `grazeForm !== 'medley'`). `stamp-sw` in the commit.

**What this unlocks.** The medley system is proved end-to-end on the simplest quote, and the whole roster now
reads its graze form through ONE dispatcher — so PR-2 (stage 2: `orbitAnnulus` via a hosted `figureEight`
setpiece + `gapThread` flag) and PR-3 (stage 3: `shrinkDisc` via an iris→spiral attack-id swap) are pure
`grazeMedley` array edits + their setpiece/attack plumbing, with the seam-reset and null-safety already in
place. **Open decisions for those PRs** (drift-check GO-WITH-FIXES): the hosted `figureEight` needs
`recur:~12` (one 8s eight is dead 90% of a full-bar stage) and orbit `live` must gate on `stageBeatT < 0`
(beat-farm leak during the frozen crack cinematic); the iris→spiral swap must hit **both** `phases[2].attacks`
AND `rhythm.phases[2].phrase` (the phrase machine fires ids directly). The stage→form *mapping* itself
(`['holdFlinch','orbitAnnulus','shrinkDisc']`) is still the owner's call to confirm before 2/3 land.
