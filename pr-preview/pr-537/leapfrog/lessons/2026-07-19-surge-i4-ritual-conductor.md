# SUNBREAK I4 — the ultimate RITUAL: a conductor, not a cutscene (PASS 4.4/5, 3.7→4.4 in one round)

**What we did.** Rebuilt the boss-ultimate wind-up as an authored CALL→GATHER→APEX→RELEASE
ritual driven by ONE pure envelope (`surgeRitualScaleAt`) that owns `game.timeScale` with
priority over every other slow-mo channel, plus the seven revise-round fixes that took the
checkpoint critic from REVISE 3.7 to PASS 4.4: mandala anatomy, ritual HUD duck, gather-driven
dragon lift, APEX camera lift, convergence line-streaks, the post-extend impact seam, and the
pin wing lift.

## The lessons

1. **A time-dilation ritual needs a single conductor with explicit priority.** Slow-mo,
   cine-slow, lethal-save, and hitstop all write `timeScale`; if the ritual merely *asks* for
   0.25 it gets stomped mid-ceremony. The pattern: publish `game.surgeRitualScale` from a pure
   sampler, apply it in main.js AFTER all other slow-mo bookkeeping (the last writer wins), and
   clear the other channels when it engages. Everything under the conductor (sequencer, camera,
   particles) advances on **rawDt** or the floored dt stretches your own beats 4×.

2. **Screen-space carriers only get you to "visible" — the ANATOMY carries the read.**
   Three stacked additive radial blobs measure bright but the critic (and the eye) reads
   "glow smear". Real structure = painted DARKNESS (a NORMAL-blend socket ring separating the
   mandala from the chest) + legible geometry (6-wedge rosette: bright wedges, dark gaps) +
   a white core. The dark ring is the load-bearing part — additive layers can never paint the
   separator.

3. **Direction must survive a single frame.** Converging POINTS read as static dots in any
   still (and near-static in headless captures). LineSegments whose long axis aims at the
   target, head vertex ×1.3 bright / tail ×0.15 dim, read INWARD from one frame. Freeze them
   at APEX (the stop-edge), hard-cut at RELEASE (the release *consumes* the energy — a cut,
   not a fade).

4. **In rear-chase, charge the BODY, not just the muzzle.** The muzzle sits ahead of the head
   — mostly occluded or tiny. Publishing `gatherK` through game→player→dragon and lifting
   rim/wings/body floor with it makes the anatomy the player actually sees climb with the
   charge. Coexists with the I3 ultimate duck because one is *ambient fever whites stepping
   down* and the other is *directed charge glow rising* — the net read is unambiguous.

5. **The cheapest way to separate two stacked silhouettes is to move the CAMERA, not the
   actors.** A ~1.5u camera rise applied POST-lookAt (no re-aim) drops the near dragon in
   frame faster than the far boss (parallax) — the critic called the resulting value stack
   "the biggest single win". Channel pattern: self-decaying target re-asserted each ritual
   frame, so a cancelled ritual can never strand the offset. (Same pattern as the FOV/push
   channel — steal it.)

6. **Gotcha — per-frame keying eats manual toggles AND capture seams.** The HUD duck is keyed
   every frame off `game.surgeRitualScale != null`. Any test/capture that adds the class
   manually gets it removed one frame later; the beat-pin seam (`__ddSurgeForce`) never sets
   the conductor clock, so pinned captures show no duck. Fixes: verify with an in-page rAF
   latch across a LIVE ritual (poll-from-node races headless ~2fps frames and reports false
   negatives), and monkeypatch the keying method page-side in the capture script. Corollary:
   at headless swiftshader fps, "state not seen in a 500ms poll" is evidence of NOTHING.

7. **Capture seams must pin *after* the physics they claim to show.** The 'impact' beat at
   `t=0.033` pinned a beam still extending (land fires at ~0.11s) — the "impact" capture
   showed no impact and no assert caught it. Derive pin times from the same constants the
   sequencer uses (post-extend +50ms), and print the phase/t in the tool output so a wrong
   pin is visible in the log.

## The reusable pattern

Ritual/beat systems: pure samplers for every envelope (test at 1ms resolution, immune to
frame clock) + a conductor with explicit priority + rawDt for everything it governs +
teardown hygiene at EVERY strand site (`surgeSeq=null` paths, damage-cancel, fight end) for
every published channel (`surgeRitualScale`, `surgeUltInvuln`, `surgeApexPin`, `surgeGatherK`).

## What it unlocks

I5 (per-dragon accent pass + tier fallbacks) inherits a ritual whose every beat is
protect-listed: apex camera lift, sky value drop, mandala-brightest ordering, HUD duck floor,
gather-lift decay inside settle, APEX+RELEASE byte-identity on repeat casts, photosafe single
flash + reduce-fx contract.
