# Detonation embers — coherence means sharing the field's SIGN + PHASE, not just its amplitude

**What we did.** Owner on the final-boss detonation: "something's not quite right about the squiggly comet
embers that radiate from the core — they don't blend or belong." A Fable art-director pass found the exact
defect and it completes (corrects) the 2026-07-12 "one substance via a shared swirl field" lesson.

**The bug — a half-applied cohesion law.** The 2026-07-12 work made the ember trails AND the streak fan both
sample the SAME `swirlField` so they'd "braid as one substance." But the two consumers used the field in
fundamentally different ways:
- **Streak fan:** `bendAmp = 0.42 * swirlField(a0)` — the field SIGNED, used DIRECTLY as displacement. Where
  the field is negative the streak arcs one way, positive the other; a single gentle sub-cycle arc.
- **Embers:** `swAmp = 0.30 + 0.50*(0.5 + 0.5*sf)` — the field's magnitude mapped to an UNSIGNED oscillation
  amplitude, then wiggled with a per-ember RANDOM phase, RANDOM frequency, plus a 2.3× harmonic.

So two neighbouring embers shared how *much* they wiggled but not *which way*, *when*, or *how fast* — they
could not braid. And the `0.5+0.5*sf` mapping tied amplitude to the field's *sign*, so exactly where the
streaks bent hardest, the embers went straight. The field's visual signature was structurally invisible in the
ember layer. Add ±1.2 rad excursion (3–6× the streaks) at a multi-inflection S-frequency, ~5× the local
corona brightness, and short fat heads — and you get a SECOND system of bright wiggling worms sitting ON the
blast, not the blast's substance.

**The headline lesson — a shared field only produces emergence if consumers share its SIGN, PHASE, and
FREQUENCY, not merely its amplitude.** "Sample the same field" is necessary but not sufficient. Coherent
motion (braiding, flow, curl) is a shared *derivative*: neighbours must move the same DIRECTION at the same
RATE at the same TIME. Mapping a shared field to an unsigned magnitude and then re-randomising phase/frequency
throws away everything that reads as one flow — you keep the correlation the eye can't see (amplitude) and
discard the ones it can (direction, timing). When "they sample the same field but still look like two systems,"
this is why: check that the field enters SIGNED and drives the actual path, not a random oscillator's envelope.

**The fix (one contained pass in `buildEmbers()`, `?oldembers` A/B seam):**
- **Re-cohere (load-bearing):** ember path angle becomes the streak spine's formula —
  `theta = dir + sw*(sin(swf*life+swp) - sin(swp))` with `sw = 0.42 * sf * crossExempt * (0.85+0.3·r)`
  (SIGNED, streak-matched 0.42, the SAME cross-axis exemption the streaks use) and `swf = 1.2+0.6·r`
  (sub-cycle → ONE arc). Dropped the 2.3× harmonic entirely; anchored the arc at the core (`- sin(swp)`) like
  the streak spine. Now an ember launched beside a streak arcs the same way at the same rate — the braid
  exists. A sub-cycle sine is indistinguishable from a generic arc, so the "clean sinusoid regularity" problem
  evaporates with no shader noise needed.
- **Dissolve into the mass:** brightness compensator `0.9→0.6` (heads ~5×→~2× local corona), young-hot boost
  `0.3→0.15`, eclipse gate `smoothstep(150,210)→(150,260)` (fade UP through the corona, no snap-on), longer
  finer trails (`trailDt 0.014+.010r → 0.022+.014r`, `size max 3.4→2.2u`), parallax `zoff ±90→±40u`.
- Kept `EMBER_N 1152`, the comet-ribbon architecture, and the cross-migration term — the geometry was never
  the problem; the curve *language* was.

**Fill/perf: neutral by construction.** No new large additive volume (count stays 2), same 18 verts/ember,
length×width ≈ 1.0×, brightness DOWN — additive cost is fill-bound not value-bound, so fill-neutral +
value-negative. The `?oldembers` branch is build-time string selection (zero runtime cost). NaN-safe (new terms
are sin/cos; the `inversesqrt(max(1e-6,…))` + `max(1e-4,…)` clamps survive verbatim).

**Verify.** smoke + bossboot zero-error; `unmaskedarena` `emberN 1152` unchanged; the dimmer embers + softer
gate move sky p50 / corridor probes DOWN (the safe direction under the ≤0.55 cap). The auroraMix red is
pre-existing. **Owner judges the braid/belonging on the real GPU** (motion coherence is invisible headless);
the one taste dial is the `0.6` compensator (0.5–0.7 band) — the coherence math is not a dial.
