# Revenant wing — the leading edge FLARES FORWARD then hooks back (a "‹" in plan, not a backswept "\")

**Context (post-merge follow-up).** #408 shipped, but flying it the owner saw the wings "fold back
toward the tail" and the finger curvature read wrong. A Fable ANATOMY pre-assessment (owner-directed:
"summon a fable anatomy expert to get the shape right") diagnosed it in one line and handed back a
buildable spec.

**The bug: the whole leading edge raked AFT from the root.** `armZ(t)` was `0.08 + sweep·t^1.06 − …` —
monotonically increasing +Z (toward the tail) from t=0. So the wrist sat *behind* the shoulder and every
finger fanned off a backswept arm → the fan collapsed toward the tail. The reference wing is the
opposite topology: **the arm + wrist throw FORWARD (−Z) of the shoulder, then the leading finger sweeps
back to the tip — a "‹" kink in plan view.** The aft-rake of the finger fan was never the problem; the
*missing forward flare of the arm* was.

**The fix, as a leading-edge profile (waypoints `[t, Δz, Δy]` in half-span units, Δz<0 = forward):**
`[0,0,0] [0.15,−0.10,0.14] [0.25,−0.14,0.24] [0.40,−0.18,0.34] [0.55,−0.12,0.42] [0.75,−0.03,0.48]
[1.0,+0.10,0.50]`. The wrist (t≈0.40) is the forwardmost AND near-highest point — a ~50° direction break
(24° forward shoulder→wrist, 25° aft wrist→tip). Replacing a monotonic sweep function with an
interpolated waypoint table is the cleanest way to author a profile that has to reverse direction — you
place the kink exactly, instead of fighting a formula.

**Wrist fraction is arm-vs-finger proportion, and the reference wants ~40%, not a stub.** We'd earlier
medialised the wrist to t=0.10 ("short arm") — but that's "a bat with no arm" (Fable). The reference arm
is ~40% of the leading run, finger ~60%. Lesson: "short arm" was the right instinct against a *long
backswept* arm, but the real target is the reference's proportion; don't over-correct a direction bug
with a length change.

**Finger curvature lives in the PLAN (XZ), not in Y.** The fingers had a downward Y-sag; the reference
fingers are single-curve **concave-aft** (convex leading edge), curving in the horizontal plane with the
tip hooking back — no droop. Fix: offset each spar's mid control point along the *forward-outboard*
perpendicular of its chord (convex leading side), knuckle biased ~58% toward the tip so curvature
tightens outward (30% inner / 70% outer). Finger 0 gets a tiny up-flick at the very tip (the reference's
leading-spar claw). **When a curve reads "wrong" but the length/direction are right, check the AXIS the
curvature is in** — sag vs in-plane sweep are completely different reads.

**Non-linear length falloff makes the outer bay.** Fingers 0 and 1 nearly equal (1.00 / 0.90), then
dropping fast (0.72 / 0.52 / 0.38) — that near-equal outer pair is what opens the big signature outer
membrane bay. A linear falloff gives an even comb; the reference is front-loaded.

**Scallops deepest OUTboard.** Bay depth (× tip-to-tip) 0.35 / 0.30 / 0.25 / 0.18 outer→inner, cusp
pulled toward the wrist — a tattered skeletal shroud, not a taut glider.

**Process (owner-directed, held): pre-assess with a domain expert → build to the numeric spec → gate
against the reference.** A Fable *anatomy* spawn (not just a critic) turned "the wings look weird" into
angles, waypoints, and length ratios I could type straight into the rig. Still additive: roster
byte-identical, starters 286/0, wingsym Δ0.000, 1581/6000 tris.
