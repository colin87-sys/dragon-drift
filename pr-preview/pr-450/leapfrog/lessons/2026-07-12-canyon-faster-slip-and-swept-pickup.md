# 2026-07-12 — Sky Canyon feel-v4: +25% slip is free by construction, but it exposes two absolutes

**Did / learned.** The spine slipstream went 1.12 → **1.25** (+25%). Because speed AND
steering co-scale by the same factor, every reachability ratio in `canyonMath` and the
whole `canyonflow` audit stay **exactly valid at any factor** — the fairness change is
zero (confirmed: spine pairs 85, worst slope 0.217 under budget, unchanged from 1.12).
That's the co-scale law from the previous lesson paying off: the buff is a free knob.

But a bigger *number* pushed on two places that were coded as **absolutes**, not ratios,
and those are where the work was:

- **An absolute FX gain that stacks.** The camera FOV punch was `+ (slip−1)·70` → +17.5°
  at 1.25, stacking on speed-active(+82) and canyon-widen(+6) into fisheye. Every *other*
  slip consumer was already normalized to `(slip−1)/(spineSlip−1)` ∈ [0,1], so they
  self-adjusted; the FOV coefficient was the lone raw multiplier. Dropped 70→45 (+11.25°,
  still a bigger punch than the old +8.4°). **Audit your FX for the one consumer that
  reads the raw buff instead of the normalized mix — it's the one that breaks when you
  scale.**

- **An absolute sampling rate that a faster world outruns.** Speed-orb pickup was a
  per-frame **sphere** test (radius 2.8m). At 135 m/s with the engine's 20fps `rawDt`
  floor that's 6.75m/frame — the nearest sample to a dead-centre orb's plane can sit
  3.4m away, *past* the sphere → the orb is stepped clean over, on exactly the weak-mobile
  devices we target (already marginal at 108: 2.7m vs 2.8). Converted to the ring idiom:
  a **swept crossing test** (`prevDist < o.dist && dist >= o.dist && hypot(dx,dy) ≤ 2.8`),
  which is frame-rate-independent. The tunnel's own boosts were the fuel it was dropping.

Plus a readability tune: exit buffer 350→380m so the ~135 m/s boost-out still meets the
first post-exit crystal wall with margin (peak decays fast at `canyonSlipEase 2.0`, so
avg over the buffer ≈ 112–115 m/s → ~3.3s to the wall).

**→ Systematize.** When you scale a global speed knob, grep for **absolutes downstream**:
(1) any FX term that multiplies the *raw* buff rather than a normalized 0..1 mix — it
won't self-scale; (2) any **per-frame point/sphere collision** on a fast-moving
object — a swept/crossing test is the only frame-rate-safe capture, and rings already
had the pattern to copy. The ratios take care of themselves; the absolutes are the bugs.

**→ Leapfrog.** The slip factor is now a genuinely free difficulty/juice dial for the
spine (and the template for updraft/current verbs), *provided* new FX read the normalized
mix and new pickups use crossing tests. Bank that as the checklist for the next kinematic
verb so nobody re-derives the two absolutes.
