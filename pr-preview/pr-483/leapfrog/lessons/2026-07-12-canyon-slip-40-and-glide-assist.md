# 2026-07-12 — Sky Canyon feel-v5: slip to +40%, and the co-scale absolute hiding in an INPUT path

**Did / learned.** Pushed the spine slipstream 1.25 → **1.40** (+40%). Free by the
co-scale law (speed AND steering scale together, so every `canyonflow` ratio stays valid
by construction — audit output unchanged). The previous lesson said "audit for the one
downstream consumer that reads the raw buff instead of the normalized mix." This round it
was hiding in an **input** path, not an output FX:

- **Glide assist oversteered by the slip factor.** `assistAxes` computes the intercept
  axis as `(target − pos)/time / (lateralSpeed·bonus)` — but that axis is later multiplied
  by `steer = bonus·canyonSlip` in `update()`. So the auto-fly velocity came out scaled by
  `canyonSlip` → visible wobble/overshoot inside the tunnel, worse at 1.40. Fix: divide the
  assist by `canyonSlip` too, so the intercept is exact *relative to the faster world* —
  the same co-scale that keeps manual steering fair. (One-frame `canyonSlip` lag from
  reading it before the damp is negligible — the per-frame damp step is ~3% and the
  `moveAccel` velocity damp smooths it.)

Two absolutes that were already coded as raw multipliers got **normalized** so no future
slip crank re-breaks them:
- **FOV punch**: `(slip−1)·45` → `clamp((slip−1)/(canyonSpineSlip−1), 0, 1)·13`. A raw
  coefficient re-fisheyed every time the dial climbed (45×0.40 = +18° stacking to ~110°);
  the normalized form is +13° at full slip forever, independent of the dial.
- **Exit buffer** 380 → **400**: peak boost-out ~151 m/s (up to ~174 with a speed-stat
  dragon), and the buffer must keep ~1.3–1.8s of readable open air before the first
  post-exit crystal wall. Slip decays fast (τ=0.5s) so the tail only adds ~15–20m — 400
  restores the margin the dial keeps eating.

Also guarded the `(slip−1)/(canyonSpineSlip−1)` divides with `Math.max(1e-6, …)` so a
future "slipstream off" config (`canyonSpineSlip == 1`) can't feed NaN into the camera.

**Honest ceiling: ~1.5.** The co-scale keeps steering *demand* ratio-exact, but the
player's reaction time doesn't co-scale — at 151 m/s a flow-beat ring hop is ~0.7s and
the rib strobe ~25/s. Fine (chip damage, roll-clearable, rings dead-centre, boosts on the
line) but beyond ~1.5 hop times drop under 0.65s and the strobe approaches flicker-fusion:
it stops reading as speed and starts reading as noise. Can't push further without changing
ring cadence inside spines — and rings are fixtured.

**→ Systematize.** When you scale a co-scaled buff, the ratios are safe but audit the
**absolutes on BOTH sides** — not just output FX (FOV, aberration) but INPUT paths (auto-
steer, aim-assist, any "convert desired velocity → normalized axis" that divides by a
speed which the buff also scales). Normalize every raw-buff coefficient to the 0..1 mix so
the dial is a genuinely free knob. And every free knob has a reaction-time ceiling the
ratio math can't see — state it.

**→ Leapfrog.** The slip dial is now a clean 0..1-normalized difficulty/juice knob with a
documented ceiling; the "co-scale also lives in input paths" catch is the checklist entry
for the next kinematic verb (updraft, current).
