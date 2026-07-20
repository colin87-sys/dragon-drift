# Revenant — a body-anchored membrane belongs on the BODY, not on the flapping arm

**Context (owner, watching it fly).** Two complaints from in-game footage: (1) the wing read "long arm +
long elbow, short finger struts" — backwards for a bat wing; (2) "weird triangular bits when it flies."
Both trace to the wing rig, and the second is a class of bug that STILL renders showed but that only a
FLAP animation makes obvious.

**1. The "weird triangle in flight" was a body-anchored membrane parented to a moving joint.** The
plagiopatagium (the membrane that joins the wing to the body) was built as a triangle on the `arm`
group, reaching to a FIXED body point `G` in the arm's local space. In a static glide it looked fine.
But the flap rig rotates `pivot→mid→arm`, so every downstroke swung that "fixed body point" through a
big arc — the triangle peeled away from the body into a floating shard. **A vertex that must stay put on
the BODY cannot live in a group that ROTATES with the limb.** The fix: move the whole plagiopatagium
onto the TORSO (body-fixed) as a shroud web from each wing root to the dorsal spine. It now (a) reads as
"the membrane comes from the spine/ribcage" — which is what it anatomically is — and (b) never deforms
with the flap, because it isn't in the flap hierarchy at all. Cost: a small gap can open between the
body web and the wing membrane at the extreme of a big upstroke; acceptable, and far better than a
swinging shard. **Rule for any procedural flyer: skeleton/limb geometry rides the animated joints;
body-to-limb connective tissue that must stay anchored to the body is built on the body.**

**2. Seat a body-fixed drape ABOVE the rib belly or it clips the cage.** The Revenant's ribcage is a
wide flared barrel (half-width ~1.15 at the widest). A plagiopatagium draped down the flank from the
wing root to the hip would pass straight through the bulging ribs. Seating the web HIGH on the dorsal
ridge (y above the rib springs, near the spine) keeps it clear of the belly and still reads as "attached
to the ribcage/spine." Know your silhouette's widest section before you drape anything across it.

**3. Bat-wing proportion is a PARAMETER, and "medial wrist" is the lever.** The arm read too long because
the wrist (`wristT`, the arm's fraction of the span) was 0.16. Dropping it to 0.10 does two things at
once: the humerus+forearm shrink to a stub, AND the fingers get longer — the finger length is computed
`hypot(tip − wrist)`, so a more medial wrist lengthens every finger automatically. Then keep the AFT
fingers long too (`lenFrac` 0.84/0.68/0.54 → 0.93/0.85/0.77) so the fan is a spread of long struts, not
a short decaying comb. Short arm + long fingers is the whole bat-wing read, and it's two dials.

**4. A flap bug is invisible in a turntable still — render the articulated pose.** dragonstudio's `fold`
and `bank` captures (wing articulated, not the neutral glide) are what surfaced the swinging shard; the
neutral `glide` money grid hid it. When the complaint is "in flight," grade an articulated/flap pose, not
the rest pose.

**Still additive.** Roster byte-identical, starters 286/0, wingsym Δ0.000 (the drape is on the torso, so
it doesn't touch wing symmetry), 1579/6000 tris.
