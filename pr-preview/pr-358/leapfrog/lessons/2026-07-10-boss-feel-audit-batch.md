# BOSS-FEEL batch — an owner-playtest + roster engagement-loop audit, and the eight low-risk fixes it produced (incl. two silent bugs and a headline mechanic that shipped un-triggerable)

**What we did.** Ran two Fable design audits — one on four specific owner playtest complaints
(`reforged/boss-context/BOSS-FEEL-AUDIT.md`) and one roster-wide against the owner's bar
*"a consistent engagement loop, not one moment, unique per boss"*
(`reforged/boss-context/ENGAGEMENT-LOOP-AUDIT.md`) — then shipped the **eight lowest-risk,
highest-value fixes** as one batch (owner asked for one PR). Bigger new-mechanic builds
(Hollowgate "Door Opens", Ashtalon `recur`, Onewing grief-transference, Karnvow rally,
Knellgrave rhythm-parry chain, Unmasked Part D) are deferred to focused PRs — you don't
blind-batch new mechanics the owner can't feel-check.

**The single most important lesson (a gate that pins the thing that breaks live proves nothing).**
The engagement audit found that **EITHERWING's holder-stagger — the headline of a rework merged
this week — could never trigger in live play**: it needs 3 perfect parries inside ONE possession,
but the baton flips every 2.4–3.6s and the count *wiped* on every flip, so you bank 1–2 then reset.
The ENG-EW gate passed **only because it pinned `debugHold`** — freezing the baton, i.e. disabling
the exact mechanism that makes the payoff unreachable. *A headless gate that pins the load-bearing
live variable is worse than no gate: it manufactures a green that hides the feel bug.* The new
fence drives the **live** baton (no pin) and asserts the drop fires — the test the rework should
have had. Fix: possession `2.4+rnd*1.2 → 5.0+rnd*1.6` + the baton-pass **decays** the bank by one
instead of wiping it (both were named as dials in the ENG-EW spec's own risk section — shipped
strict, and strict was unreachable). *Reusable: when a mechanic's reachability depends on a timing
variable, the gate MUST exercise that variable live; if your test pins it to pass, you've tested a
fiction.*

**The audits caught two silent BUGS a feel-pass wouldn't.**
- **HOLLOWGATE** `spiralStream` emitted **zero bullets with all panes broken** — its pane branch
  lacked `spiral`'s empty-pane fallthrough, so P4's dread lead was three silent volleys. A
  correctness bug hiding as "the fight gets boring late". Two-line guard (`&& model.livePanes()
  .length`), gated: crack all 8 panes → assert bullets > 0.
- **BRINEHOLM** — a prior fix (July-7) pulled the side shackles in "for ~6m margin" but computed
  it at `pose.x = 0`; the boss has no `holdSway` override so the default ±5.0 station sway swings
  the outer post to **1.25m from the instant-kill wall**, and the fly-based lock forces you into
  it. The commit's own test asserted static `|x| < 8` — **the assert omitted the sway term**, so
  CI stayed green while the feel regressed. Fix: `holdSway { amp:1.6 }` + `reflectTargets` (remote
  parry reach). *Reusable: a margin assert for a swaying organ MUST include the sway amplitude, or
  it green-lights the trap — the durable fence is `organWorldX + swayAmp ≤ wall − coneXY − slack`.*

**The recurring find-shape: the def looks right, the truth hides in the interaction of two
constants.** MARROWCOIL's `cadence` rows looked in-band, but its `rhythm` phrase data out-fired
BOTH neighbours (~160 vol/min P3 vs the slot-5 PEAK's ~103 — the sawtooth inverted). THRUMSWARM's
whole condense/scatter puzzle read was inert because one constant (`condHold 1.1s`) outlasted every
authored rest (≤0.85s), so the swarm never scattered. Both are one-number fixes; both got a fence
(Marrowcoil: P3 rest floor ≥ the slot-5 peak's + a band-order intent; the durable win the audit
named). *Reusable: aggression/identity live in the phrase×rest interaction, not the headline
cadence — audit the emergent number (volleys/min, duty-cycle), not the field.*

**The batch (all def-gated, coexist-safe, shipped machinery reused).**
1. **Marrowcoil** — P2/P3 rest floors +0.4s; the P3 wall burst 3→2 + gaps 0.14/0.16→0.22. Def data.
2. **Brineholm** — `holdSway {amp:1.6,freq:0.5}` + `reflectTargets [shacklePost0/1/2, eyeRig]`. Two def lines.
3. **Eitherwing** — the possession/decay reachability fix (above). Two model dials + wipe→decay.
4. **Thrumswarm** — `condHold 1.1 → 0.4` (thrumswarm-scoped by the `driveSwarm` early-return).
5. **Stormrend** — dropped the `card:` gate on `gapAnchor` so the "fly into the eye" read runs the
   WHOLE fight, not just the final card (the ungated eitherwing `threadMid` precedent). The ENG-B
   card-off test **twin-split** (the ENG-LT law): the stormrend leg now asserts the un-gated lock,
   the coexist leg re-targets a no-gapAnchor def (voidmaw).
6. **Embertide** — the beam duel can no longer arm during the survival card (its forced drift +
   hold-centre fought the horizonbreak shadow-ride's ±8 pocket). One-line `&& !(activeCard.survival)`.
7. **Hollowgate** — the silent-volley guard (above).
8. **Knellgrave** — `spiral` restored to P4 (attacks + one phrase measure) so the toll-wall loop
   doesn't go dark for a whole phase.

**Verify.** `tests/boss.mjs` **121** green (+1 fence block covering fixes 1/2/3/7/8; the ENG-B and
ENG-EW blocks updated in place for the un-gate and the decay). `bossboot` green. **rhythmprint stays
min KS 0.26** despite three bosses' rhythm data moving (Marrowcoil, Stormrend un-gate is
position-only, Knellgrave P4) — the multi-boss rhythm-batch's one integration risk, watched and
clear. amberdiet / def-schema / lifecycle / per-boss geometry+worst-frame all green untouched. Only
`bossEitherwing.js` touched a model file (a timer number — zero geometry, `tricount` unchanged by
construction). Every engine edit is def-gated (Thrumswarm/Embertide/Hollowgate/Eitherwing all key
off their existing flags; Stormrend/Marrowcoil/Brineholm/Knellgrave are def-data). `stamp-sw` in the
commit. Two ungated one-liners flagged honestly: Thrumswarm `condHold` and Embertide's duel gate
carry no new sim-fence (both single-line, low-risk; their focused-PR successors can add the
duty-cycle / no-arm sims the audit sketched).

**Preview-judged (headless proves function; the owner judges feel on the combined preview).** These
are tuning/reachability changes with real feel deltas, all reversible one-liners: Marrowcoil's dread
with 2 walls vs 3; Eitherwing's slower baton tempo; Thrumswarm's scatter blink legibility; Stormrend
P2 with a stable-ish eye anchor; Knellgrave P4's added toll density. Target numbers are the audit's;
each is one line back if a preview reads wrong.

**What this unlocks / the standing backlog.** The two audit docs are the shared pre-build checkpoint
for the whole boss backlog. Deferred to focused PRs, in the audit's build order: Hollowgate "THE
DOOR OPENS" (breach state + hub weak-point), Ashtalon stoop `recur` (a setpiece-recurrence primitive
that then serves Eitherwing's figureEight + Karnvow's flankCutIn for free), Onewing grief-
transference (the mirror survives its own parry job), Karnvow rally v2, Knellgrave's WE rhythm-parry
chain (or delete the doc claim), and finally UNMASKED Part D — the Apex medley, which can only quote
loops that work, so it lands last. The meta-lesson stands over all of it: *a mechanic isn't shipped
until a gate exercises it the way a player does — live, not pinned.*
