# Occlusion that only happens mid-ANIMATION; decouple a landmark from its parent's motion; and audit WHICH layer actually blocks before re-dialing the one you already touched

**What we did.** Round 3 of Solar's rear-chase visibility. After two rounds fixed the REST pose, the owner
said the twin wing spires still block "when the wing flaps," and the corona ring is "still hard to see
through." A high-effort Fable pass (with one sign I had to correct) produced the plan; we built it and it
held across a 5-phase flap capture.

**Reusable idea 1 — some occlusion only exists DURING the animation, and a static capture reports it as
ZERO.** The spires are rigid children of the wing pivot, which rotates by `−rootFlap` every frame. At rest
the tips sit at ~16° azimuth (clear); at peak upstroke they swing to ~9° — into the ±10° forward corridor,
both sides converging like a scissor once per beat, worst on boost when reaction time is shortest. Every
`gameshots` frame we'd shot caught only the rest phase, so the tool cheerfully reported no problem for two
whole rounds. **If a landmark is bolted to something that moves, you must verify across the MOTION, not at
one frame.** The honest tool here was `flapstrip` (the 5-phase glide/recovery/apex/downstroke/settle strip
from the real chase cam) — apex and recovery are the money frames a single shot always misses. Add to the
occluder triage: "does it move, or is it bolted to something that moves?" → capture the whole cycle.

**Reusable idea 2 — DECOUPLE a landmark from its parent's motion: the mast doesn't sway with the sail.**
You can't just re-parent the spire to the torso (it would float when the wing folds). The feasible form:
wrap it in its own group whose ORIGIN is at the mount point, let the base keep travelling with the wing,
but COUNTER-ROTATE the group against the parent's animated rotation so its orientation stays ~stable. Tip
travel is dominated by orientation × length, so cancelling ~85% of the parent's rotation kills ~80% of the
sweep while the wing membrane keeps its full beat. The counter cancels ONLY the oscillating term
(`sin(phase)·flapAmp`), never the posture biases (turn-lean, inhale-raise) — those SHOULD still carry the
landmark. Residual ~15% reads as heavy inertia (a massive monument resisting the beat), which looks MORE
regal than either full coupling or a dead-rigid gyro. Pattern: `landmarkGroup.rotation.z =
stab·(parent's oscillation)`, gated on a nullable dial so the roster is untouched.

**Gotcha — a counter under a mirrored subtree needs OPPOSITE L/R signs, not the same.** Fable's plan said
"same value both sides; the `scale.x=−1` mirror flips the sense, so wingsym stays Δ0.000." That's wrong: the
pivots already use opposite local signs (`−rootFlap` R / `+rootFlap` L) precisely BECAUSE the mirror flips
z-rotation sense — so to cancel each pivot's LOCAL beat the counter must also be opposite-signed (`+stab` R
/ `−stab` L). The same-sign form cancels the right spire and AMPLIFIES the left. The frame-local way to see
it (and avoid the mirror headache entirely): *a child cancels its parent's LOCAL rotation regardless of any
outer scale* — so match the parent's local sign convention. `wingsymprobe` Δ0.000 is the guard that catches
the wrong sign instantly; run it before rendering. (This is the second time verifying a Fable plan caught a
concrete error — plans are load-bearing, not gospel.)

**Reusable idea 3 — before re-dialing a knob you already touched, AUDIT which layer actually blocks.**
Round 2 ghosted the corona's dark umbra BAND to 0.74 and the owner still couldn't see through. The instinct
is "lower it more." The audit said otherwise: the ring's OPAQUE emissive RIM annulus (a different, outer
layer) is ~2.5× the band's occlusion, PLUS a bloom halo that glare-masks dim obstacles beside it. Round 2
had ghosted the *smaller* contributor. The fix was a "rim diet" — thin the opaque rim (`Rm 1.06→1.10`, which
also auto-widens the ghosted band to fill the freed radius) and cut its emissive intensity to tighten the
halo — plus a modest deepen of the band (0.74→0.60). **When a fix underdelivers, don't just push the same
slider harder; measure the occlusion budget of EACH layer and fix the dominant one.** A bright emitter's
levers are width and intensity, not alpha (20% background under 80% glow is perceptually nothing) — so the
rim gets thinned, never ghosted; the shadow band gets ghosted, never thinned. Same split as ghost-vs-reshape:
match the tool to the physical thing.

**Process that held:** all changes uniform shop+gameplay (no preview split); the flap-swept spire is
silhouette-neutral at rest (starters 242/0 + byte-identical rest pose) so only the MOTION rides the owner's
preview judgment; debug-poser parity (`wingDebugPose.js`) so the acceptance strip reflects the shipped
counter and isn't a false negative; radial/opacity/intensity for anything on the spinning corona (angular is
void — prior lesson). Nullable dial (`spireStabilize`) keeps the whole mechanism off for every other dragon.

**What it unlocks.** Triage now has three axes: (1) is the horizon in frame (camera); (2) does a landmark
block AT REST (reshape/ghost per material) — verify one frame; (3) does a landmark block only DURING its
animation (decouple via counter-rotated group) — verify the whole cycle with `flapstrip`. And a standing
rule for underdelivering fixes: audit per-layer occlusion budget before re-dialing.
