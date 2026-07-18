# Revenant wing — weld the membrane to SPAR SAMPLES, and cup it VENTRALLY (a glide surface, not a dorsal flip)

**Context.** Owner flew the forward-flare build and found three real faults: (1) the membrane was
DETACHED — it floated with a visible gap off the bones; (2) the camber was INVERTED — the fingers
flicked dorsally (up), an anti-glide shape; (3) the arm had gotten long (my t≈0.40) and they wanted it
short again. A Fable anatomy expert planned the fix; this is what held.

**1. A membrane that references only finger TIPS will always detach when the spars curve.** The old
chiropatagium was a separate fan built from the finger *tips* + the wrist K. The moment the finger spars
bowed, the bone bent away from the straight tip-to-K membrane and a gap opened. **Fix: loft the skin onto
per-finger SPAR SAMPLES.** Sample each finger's curved spar at s=0…1 (5 nodes), store the nodes AFTER
curvature/droop are baked in, and build each membrane bay as quad strips between finger i's node ring and
finger i+1's. Every membrane edge vertex *is* a bone node (shared), so the skin is welded by construction
and follows the bone no matter how it bends — the detachment cannot recur. This also fixed a phantom
"lower quality" complaint: nothing about the material changed (verified: 0 diff to the mat lines); the
skin just looked cheap because it was torn off the frame and stretched. Welding it restored the quality.

**2. "Dome to trap air" = VENTRAL concavity (cup DOWN), and it lives in two places.** A glide surface is
convex on top, concave underneath. Two curvatures, both toward −Y at the edges: (a) **spanwise** — the
fingertips droop progressively below the wrist line (elev +15° leading → −20° trailing) so the fan reads
as a downward umbrella; (b) **chordwise** — each membrane bay's interior sags below the plane of its two
bounding spars (a mid-line pushed −Y, deepest toward the trailing edge). Together the ventral surface is
concave in both axes → it catches air. The bug was the opposite: I'd added a dorsal up-flick and an up
bow. **When an owner says "it wouldn't glide," check the sign of the camber — dorsal-convex-only doesn't
trap air; you need the ventral concavity.** Kill any up-flick.

**3. Short arm ⇒ finger 0 becomes the leading edge.** With the wrist medial again (wristT≈0.12) the arm
is a 2-bone stub that can't carry the wing's shape — so every leading-edge directive (the reference "‹"
forward-flare kink) moves onto **finger 0's base + knuckle**: it leaves the wrist forward (a strong −Z
knuckle throw, bow 0.30×chord vs 0.18 for the others), then sweeps back to a tall tip. Don't fight the
short-arm call by lengthening the arm; relocate the geometry the arm used to carry onto the leading
finger.

**Process (owner-directed): domain-expert PLAN → build → HARSH-CRITIC gate.** The anatomy expert gave a
build order (weld the membrane FIRST — it's the change that unblocks the ventral sag) and numeric targets;
a separate adversarial Fable critic gates the result. Still additive: roster byte-identical, starters
286/0, wingsym Δ0.000, 1633/6000 tris.
