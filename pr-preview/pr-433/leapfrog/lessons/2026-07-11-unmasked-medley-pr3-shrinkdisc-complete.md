# THE UNMASKED medley — PR-3 (COMPLETE): stage 3 quotes KNELLGRAVE's shrinkDisc via an iris→spiral swap that MUST hit two def locations, and the medley capstone lands — one Apex boss now quotes three shipped graze forms, one per stage, with zero new attack ids and zero new geometry

**What we did.** The final quote. Stage 3 (the "Unveiling — What Wore the Sky") now quotes KNELLGRAVE's
`shrinkDisc` (the growing toll-wall you ride the rim of). No new mechanic — the shrinkDisc engine is
shipped; stage 3 just needed its `spiral` attack (the toll radiator) and the `grazeMedley` map entry.
With this, **THE UNMASKED medley is complete**: `grazeMedley: ['holdFlinch', 'orbitAnnulus', 'shrinkDisc']`
— KARNVOW's stare-down → EITHERWING's wheel + MARROWCOIL's gap-thread → KNELLGRAVE's toll-wall, a
literal greatest-hits medley across the three stages, dispatched by the PR-1 `grazeFormNow()` helper.
Owner-confirmed mapping ("go with the recc").

**The load-bearing gotcha — an attack-id swap has TWO def locations, and only one of them shows up in a
naive test.** The shrinkDisc toll-wall arms when the boss fires `spiral`; stage 3 shipped with `iris`
(the placeholder). The swap is `iris → spiral` — but it must hit **both**:
1. `phases[2].attacks` — the attack pool the cadence machine draws from.
2. `rhythm.phases[2].phrase` — the **phrase machine fires phrase ids DIRECTLY.** Swapping only the
   attacks list leaves the phrase emitting `iris` in live play, so the disc **never arms** and stage 3
   silently keeps the old placeholder behavior. The drift-check flagged this precisely; without it the
   swap looks done (attacks list reads `spiral`) but the fight still fires iris.
Left **stage 2's iris untouched** (it's double-gated inert there: the disc arm is in the spiral branch,
and `grazeFormNow()` is `orbitAnnulus` in stage 2, not `shrinkDisc`).

**The test-honesty lesson this produced (a real gap I caught mid-build).** My first stage-3 gate fired
the toll with `debugEmitAttack('spiral')` and rode the rim — a fine proof the *mechanic* pays, but it
**bypasses the phrase machine entirely**, so it would pass even if I'd forgotten the phrase swap and the
live boss fired iris. A debug-seam attack test can't prove a live-cadence wiring. Fix: a **static
assertion** on the def data itself — `phases[2].attacks` and `rhythm.phases[2].phrase` both contain
`spiral` and not `iris`, and `phases[1].attacks` still contains `iris`. Proven non-vacuous by mutation:
reverting *only* the rhythm phrase (leaving attacks as spiral) fails the static assert; nulling
`grazeMedley[2]` fails the form + payout asserts. *Reusable law: when a mechanic is wired through def
DATA (an attack-id swap, a cadence entry), a debug-seam "fire it directly" test proves the mechanic but
NOT the wiring — add a static assertion on the data that would fire in live play, or drive the live
cadence. The two failure modes (mechanic broken / wiring broken) need two different tests.*

**Why the swap is coexist-clean.** `iris` and `spiral` are **both non-amber-carriers**
(`AMBER_CARRIERS = aimed/fan/crossfire/stream`) and both emit non-reflectable bullets — so the swap
changes zero parry fuel: amberdiet stays green and the rhythmprint fingerprint is byte-stable (ids only
matter to the fingerprint via carrier membership, identical for iris/spiral). The disc arms off the
**player-lane `anchorX` fallback** (`scx=anchorX, scy=B.fightHeight, srel=pose.rel`) because the
unmasked declares **no `emitOrigins`** — no bell/organ needed; KNELLGRAVE's organ path (`bellMouth` +
`survivalResolve` ride mode) is untouched (unmasked has neither, so `discRideMode()` is false and it
takes the normal grow-and-die pocket). The Apex's station `pose.rel ≈ settleGap` gives a healthy
`dur = srel/slow`, so the pocket has a real lifetime — the degenerate-overhead case that forced
KNELLGRAVE's ride mode is organ-specific and doesn't apply here.

**Verify.** `tests/boss.mjs` **126** green, deterministic; `bossboot` green. The §5i.D gate now proves
all three stages end-to-end: stage 1 pays holdFlinch (parked stare → flinch), stage 2 pays orbitAnnulus
(flown, not parked) + gapThread + the beat-farm/station-freeze guard, stage 3 pays shrinkDisc (a spiral
toll opens the pocket off anchorX, riding the rim banks discGraze), **no cross-stage leak** in any
direction (each stage's parked/idle player earns nothing from the other two forms), and the dispatcher
is bit-identical for every static-form boss. knellgrave (ENG-H toll-wall + ENG-LT last-toll) and
eitherwing/marrowcoil all still green — every edit is def-data on the unmasked key. `stamp-sw` committed.

**Preview-judged.** The owner feels the whole medley arc now: does each stage READ as its quoted boss
(the stare-down tension → the wheel spectacle → the closing toll-walls), and does the shrinkDisc's
`anchorX`-seeded pocket land legibly at the Apex's sky-scale? The `discCd = 1.6` breather between
pockets and the stage-3 spiral cadence are one-line dials.

**What this unlocks.** THE UNMASKED — the tier-5 capstone, slot 14 — now has a live, honest surge
economy across all three forms, closing the last dead `grazeForm` label on the roster. The medley
DISPATCHER pattern (`grazeForm: 'medley'` + `grazeMedley[phaseIdx]` → `grazeFormNow()`) is the reusable
primitive for any future multi-form boss that should quote the roster rather than invent a new form.
Remaining boss backlog is now just the preview-gated riders (recur tuning, the Knellgrave F2 early-parry
fragility, the Last-Toll bronze overlap) — the Apex itself is feature-complete.
