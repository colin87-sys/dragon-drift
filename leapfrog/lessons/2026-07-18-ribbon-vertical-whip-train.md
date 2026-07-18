# An edge detector on a DAMPED input fires for the whole ramp — arm on sign-reversal instead

**The bug.** After the vertical-pose fix, the owner: *"up/down improved HEAPS, but there's still this
weird ERRATIC movement."* Lateral felt good. Headless proof showed the ribbon spine was SMOOTH on
vertical (spike ratio ~1.0) — so it wasn't a pop/jitter; it was a *smooth train of oversized bumps*.

**Root cause (Fable-diagnosed, from the code).** The movement-response whip spawns on a steer EDGE:
`if (edge > 0.045) ribbonWhip(...)` with a 0.13s cooldown. But `player.velocity.y` is exponentially
damped toward its target (`moveAccel 6`), so on a full flip `dSy ≈ 0.2·e^{−6t}` stays above the 0.045
threshold for **~15 frames (0.25s)** — the "edge" is true for the ENTIRE velocity ramp, not just the
flip instant. With the 0.13s cooldown that spawns **2–3 same-sign pulses per reversal**; their
Gaussians (crests ~1.8 arc-units apart, width 3.2) overlap and sum to a **~2.2u** vertical bump, and on
a mash the body carries **4–6 alternating-sign bumps at once** = the erratic read. Lateral does the
same but reads as intentional serpentine (and was signed off); vertical stacks against the horizon/head
pitch so it reads as noise.

Second contributor: the vertical drive-swell *inverted the duck*. `verAmp = swimAmpY·duck + driveY` →
while steering vertically `(0.95×0.35 + 0.7)·gain ≈ 1.03·gain > 0.95` resting: the "idle" vertical wave
got BIGGER under input than at rest, so the whip train rode a swollen S.

**The fix (jade-scoped — did NOT touch the shared flight controller again).**
1. **Arm the vertical whip on a SIGN REVERSAL, not per ramp-frame.** Track `ribLastWhipSignY`; spawn the
   vertical pulse only when `sign(dSy) !== ribLastWhipSignY` (one clean pulse per key flip), with a
   0.30s backstop cooldown. Lateral is split out and keeps its shipped 0.13s edge behavior (byte-
   identical for pure-lateral input — a regression guard proves it). → 1 pulse/flip, not 2–3.
2. **Halve the vertical pulse factor** `pulseAmp*0.7 → *0.5` (peak 1.54u → 1.1u).
3. **Restore the duck-contrast on vertical drive** `driveY 0.7 → 0.45`: steering vertically now quiets
   the wave (`0.95×0.35 + 0.45 ≈ 0.78 < 0.95`) so the whip is the *event*, per the design intent.

Held in reserve (not applied — one revise round per AAA convergence): `swimAmpY 0.95→0.85`.

**Proof (`tests/ribbonvertical.mjs`, replicates the vertical drive + the new trigger).** One vertical
pulse per input reversal (9 for 8, was 2–3×); isolated vertical whip bump **0.89u** (was ~2.2u, measured
by diffing whip-on vs whip-off runs so the legit path-trailing Y offset is stripped out); gentle + mash
stay smooth (spike ≤1.03); gentle max jump 0.107 unchanged. Lateral suite byte-identical.

**Reusable takeaways.** (1) An **edge detector on a damped/smoothed input fires for the whole ramp**,
not the instant — so a cooldown-gated "edge" response spawns a *train*. If you want one event per
gesture, **arm on the sign reversal (or a debounced onset), not on `|Δinput| > ε`.** This bites any
edge-triggered layer (hit-reacts, whips, camera kicks). (2) When measuring an added offset's magnitude,
**isolate it by differencing an on/off run** — the raw body displacement also contains legitimate
motion (here the body trailing the flight path) that isn't the thing you're bounding. (3) A per-axis
duck/contrast design silently inverts if the input-driven term out-grows the ducked idle — check
`driven + idle·duck` vs `idle` on each axis.
