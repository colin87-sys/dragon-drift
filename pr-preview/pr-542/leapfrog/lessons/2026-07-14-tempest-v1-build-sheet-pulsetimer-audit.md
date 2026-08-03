# Tempest v1 build sheet — the feasibility audit that found the churn hook and killed three phantom dials

**What we did.** Authored the THUNDERHEAD TEMPEST v1 build-ready sheet
(`reforged/TEMPEST-THUNDERHEAD-BUILDSHEET.md` §B — build-order #2, the Revenant §B format), folded
in the shipped-storm research DNA (Dvalin triple wing + rim glow, Zekrom Overdrive dynamo + lit
mane tip, Kushala silver plating + churn), specced the shared `js/pulseTimer.js` (deterministic
seeded burst-cluster strike scheduler; Tocsin reuses it), and audited every element against the
real rig at current line numbers. Updated `FRESH-DRAGONS-SYNTHESIS.md` §4.

**What we learned (the reusable finds).**
1. **`parts.wingBladePivotsL/R` (dragon.js:852–859) is a shipped per-blade lag walker** — additive,
   nullable, lag deepening outward + a static per-index splay. It IS the per-deck churn hook the
   v0 sheet invented a `deckLag` dial for, and its splay delivers the +6°/deck dihedral stagger
   free. Before inventing a motion dial, inventory the nullable parts-hooks the rig already walks.
2. **The spineFlareMats loop is a hostile co-writer for any custom-timed emissive.** Its else
   branch RESETS every member's emissiveIntensity to base each non-surge frame (dragon.js:1174–
   1177), and spineMats add the warm rim (1183/222). A strike/pulse motif must be SINGLE-WRITER:
   keep its mats out of BOTH arrays and own cruise/boost/Surge in one guarded tick placed after
   the loop (jade pearl-mat precedent, dragon.js:1008–1017).
3. **Audit a sheet's numbers against its own laws.** v0's apex hex `0x232836` (HSL-L 0.175) broke
   its own L≥0.20 charcoal floor, and its "~1 strike in 7 s" prose contradicted its 0.06–0.18 duty
   ladder by ~6×. Both survived two prior gate passes because nobody computed them. The v1 fixes:
   re-pinned ramp `0x3a3f4a→0x333947→0x2e3543→0x293040`, and a burst-cluster schedule that makes
   duty AND cadence simultaneously true and testable.

**The gotcha.** Deterministic timed spectacle needs its pin flag to land BEFORE the spectacle
(I0, with the scheduler) — a strike you can't pin makes every gate round non-comparable (the
MARROWCOIL failure, extended to time).

**The pattern.** Scheduler as a PURE module (bossRhythm.js architecture: deterministic given a
seed, no DOM/THREE, dt-integration only, safety caps IN the module) + one guarded per-dragon tick
+ `?strikePin` via the `?wingDebug` parse pattern + a clock-free dragonstudio state.

**What it unlocks.** Tempest I0 can cut immediately; Tocsin's ring clock is pre-specced; any
future timed-spectacle dragon (pulse, drip, chime) inherits the scheduler + pin + single-writer
tick recipe instead of rediscovering the flare-loop trap.
