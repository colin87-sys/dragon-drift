# 2026-07-09 — Over-correction is a bug too, and a test that models the code loosely guards nothing

**Did / learned.** A third harsh critique of the Wyrm lance profile found that fixing the
"buried voice" had swung the pendulum the other way, and — sharper — that the very test I'd
built to guard the fix was nearly vacuous:

1. **The makeup OVER-corrected ×1.5.** The groan sums TWO makeup-compensated formant paths,
   but the unit test modeled ONE, so the real delivered level was 1.5× what the gate checked.
   Compounded with the damage/k level ramp, a routine late-fight 6th-hit voice (~0.30) ended up
   LOUDER than the fight-ending finale roar (~0.24) — a climax inversion — and drove late rolls
   hot enough to pump the master compressor harder than the classic profile ever did. I'd fixed
   a loudness-rigged A/B by re-rigging it in the opposite direction. Fix: share the EXACT
   coefficients between synth and test (`sfxLanceMath.GROAN` + `effectiveGroanLevelTwoPath`),
   normalize the two paths to ≈1× (f1 0.75 / f2 0.28), and CAP the strike voice below the finale.
2. **The "regression guard" test was a tautology.** `effectiveGroanLevel = vol·(nπ/2)·(2/nπ) ≡ vol`
   — makeup and harmonic loss cancel identically — so over its whole grid the test asserted
   `0.16 ≥ 0.05`, always true, testing nothing. And it modeled a single path the code didn't use,
   over an f0 range (112–168) that missed where the code actually runs (down to ~76 Hz where the
   makeup clamp bites). Worst: deleting the makeup call from the synth kept it green. Fixes:
   exercise the SAME two-path function the code uses; bound BOTH sides (`0.08 ≤ eff ≤ 0.30`, so
   over-correction fails too); cover the real f0 range; and add a **source tripwire** (assert
   `sfxLance2.js` actually references `groanMakeup(f0, F)`) so silently dropping the compensation
   fails CI instead of passing.
3. Craft: a single 80 dB exp decay made the finale "roar" a 120 ms bark that buried the glide,
   and the formant makeup was frozen at onset f0 while the glide halved it (an extra 6 dB of tail
   loss) → two-stage sustain env + a formant-gain ramp that tracks the diving n. The void opened
   with a click (a hard gain step on hot ringing tails) → ramp the dip over 4 ms; and 40 ms of
   submix-only dip under a running track isn't a dropout → 85 ms + a deeper world-duck. The voice
   was one parameter from dubstep (two formants gliding DOWN in parallel = a filter-swept saw) →
   glide F2 UP while F1 falls (a real /aʊ/ diphthong), growl at 28 Hz not 40.
4. Damage SATURATED (`min(1, +0.015)` flatlines after ~67 hits) → late-fight repetition returned
   exactly when the player has heard it most. Fix: an asymptotic curve (`1 − 0.5^(hits/55)`, never
   quite 1) PLUS a non-saturating per-volley wobble so variety never fully rests.

**→ Systematize.** (1) **Over-correction is a regression too — bound a level BOTH sides.** A
"make it louder" fix needs a ceiling or it just relocates the imbalance. (2) **A test must model
the code's actual signal path, and share its coefficients** — a loosely-modeled gate (single path
vs two, wrong input range, an identity that always passes) provides false confidence worse than no
test; add a source tripwire when the real synthesis can't be run in the test's environment.
(3) **An asymptote beats a clamp** for "state that accrues but must never flatline," and pair it
with a cheap non-saturating wobble so the tail of a long session still varies. (4) A gain
DISCONTINUITY on a non-zero (ringing) signal always clicks — ramp every dip, even a 4 ms ramp.

**→ Leapfrog.** Folded into the open PR #337. Classic byte-identical (harness 0 mismatches);
`wyrmlevels` now 18/18 and MEANINGFUL (two-path, bounded both sides, real f0 range, source
tripwire); `wyrmsmoke` 12/12, `lock` 100/100, `audioboot` green. What remains is genuinely the
owner's ear on the preview (does the diphthong read as a wounded creature or a wobble; the phone
A/B) — the levels and the void now at least make that a fair test.
