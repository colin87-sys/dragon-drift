# 2026-07-12 — Sky Canyon feel-v3 bugs: the z-mirror, unsuppressed obstacles, approach cone

**Did / learned.** The owner flew feel-v2 and hit three bugs; a checkpoint review + an
assess/plan pass (plus a built-collider probe) found FOUR independent causes — a reminder
that one symptom ("a spike in front of the ring") can have several roots.

1. **The z-mirror (the big one).** `canyonMath`'s local `z>0` is the exit half (toward
   `nextX`), but the world maps local `+z` to a SMALLER dist (`world dist = o.dist − z`,
   the *approach* side). `ribcage`/`stackRunV2` placed meshes+colliders at the math `z`
   **unnegated**, so every section's forward-eased half landed on the BACKWARD side.
   Invisible per-section (symmetric halves), it broke at rhythm/direction changes into
   doubled ghost ribs and a near-closed rock slot. **The entire green flow audit was
   blind to it because the audit reconstructs from the same `canyonMath` — a shared-math
   check cannot catch a math↔world FRAME mismatch.** Fix: place at `-z`. Proof needs a
   built-collider probe (physical dist = `o.dist − oz`): spine worst centre-jump
   9.10m→0.91m, slot 6.29m→14.48m, now matching the audit.
2. **Base obstacles never suppressed in canyons.** Only gates were filtered; pillars,
   shards and bars (literal spikes) spawned *inside* the carved slot / rib tube on the
   ring line. Generalized the 3-window suppression to ALL obstacle types
   (`canyonObstacleSuppress`).
3. **Geysers never suppressed in canyons.** `overlayBiomeHazards` had zero canyon
   awareness. Shared the same windows (it runs right after `overlayCanyons`) and filtered
   `out.hazards` — an undodgeable vertical column in an enclosed corridor is gone.
4. **The ring pocket was a 12m binary window (~0.11s at 108 m/s)** while the approach at
   canyon speed is ~40m — a stack sat on the aim line the player had locked. Replaced it
   with a **tapered approach cone** (full ±7 within 12m, easing to 0 out to 36m on the
   approach side) + crest-drop over the whole cone. Plus a rib-free reward window (skip
   the visible hoop within 5m of the ring so a rib never clips the ring disc — collider
   walls stay).

**→ Systematize.** THE lesson: **a "no re-derivation" audit that shares the geometry MATH
is still blind to a MATH↔WORLD frame error (sign/units).** The guard for that class is a
built-artifact probe in the REAL frame — read the actual colliders and assert the
physical-frame invariant, not just the math. (Added `rockApproachBad` and kept the
built-collider scan as the tool that would have caught the mirror.) Second law:
**every additive overlay must ask "does the base course also place something here?"** —
gates, obstacles AND hazards all needed the same canyon suppression; a new overlay
inherits the whole suppression set, not a subset. Third: **size a "clear approach"
window from reaction TIME at the worst speed, not a fixed distance** — 12m was 0.11s;
the fair cone is ~0.33s (36m at 108 m/s).

**→ Leapfrog.** With the tube physically correct and the ring line + tube guaranteed
clear, the speed-tunnel enhancements (more boosts, a co-scaled slipstream speed-up that
keeps the fairness audit valid at any factor, speed-lines/FOV/aberration, a rib-flutter
speed sound) can layer on safely — they're all determinism-free (kinematics/camera/audio
aren't fixtured). The built-collider probe should graduate into a permanent
`canyonreality.mjs` so no future geometry change can silently re-mirror the world.
