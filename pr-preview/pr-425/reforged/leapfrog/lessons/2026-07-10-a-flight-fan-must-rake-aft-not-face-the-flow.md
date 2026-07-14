# A trailing fan on a FLYING creature must rake aft — a frontal-plane fan is a drag-plate

**Context.** The Dawnfire Empress's signature is a bottom-heavy pyre-train "fan." To win the
still-render gate (a wide "sunrise burst"), the fan was built radiating in the **frontal plane** —
quills fanned out ~90° to the flight axis, a flat vertical disk hanging off the hip. It scored 4.67
frozen. Then the owner flew it: *"that thing perpendicular to the torso reads as a dress… a 90-degree
flap causing aerodynamic drag… it doesn't make sense… the silhouette is a failure."* He was right.

**The trap (why the still lied).** A flat fan normal to the freestream is, aerodynamically, an
**air-brake at full angle-of-attack** — a spoiler, a drag-chute deployed mid-flight. The brain reads
"this creature is trying to STOP," which fights the forward-streaking game every frame. The STILL
camera hid it because it looks straight **down the flight axis**, exactly where a flow-normal disk
projects at maximum width and looks glorious. Motion adds side and three-quarter angles that expose
the disk's **zero streamwise depth**: from the side it's a hanging skirt; from above it vanishes.
**Lesson: a "does it read epic?" still gate is blind to aerodynamic plausibility. Any large surface
on a flier must be sanity-checked for its angle to the flight axis, in a moving/side view, before it
ships.**

**The fix — rake it aft into a cone, and size length from the projection budget.** Replace the single
frontal rotation with two angles: keep `rotation.z = φ` (roll around the flight axis), and add an
inner group that pitches each quill **aft** by `(90° − α)`, where **α = the rake angle from the flight
axis, hard-capped ≤ 60°** (the failed disk was α ≈ 90°). This turns the disk into a half-cone that
**streams behind** the creature — fletching (drag *behind* the mass, stabilizing) instead of a brake.

The move that makes it free: a raked quill's projection onto the rear camera = `length · sin α`. So
you **size lengths from the projection budget backwards**: `L(φ) = desiredProjectedWidth(φ) / sin α`.
Now the rear-chase burst is *identical width* to the flat fan (the epic still-read is a computed
guarantee, not a hope), while every quill gains `L·cos α` of aft depth — a real trailing train from
every other angle. The still-vs-motion contradiction dissolves: you get both.

**Vane orientation falls out for free.** Building the vane in its local `−Y` (down) with face `+Z`,
then applying `rake.rotation.x = −(π/2 − α)`, sends the vane's face normal to `(0, cos α, sin α)` —
**up-and-aft**, i.e. straight at the behind-and-above chase camera. No extra twist needed; the rake
that fixes the aerodynamics also aims the faces at the lens.

**Motion becomes physically honest too.** Speed now FURLS α tighter to the axis (comet-spear at
speed; blossoms open on a glide) instead of tilting a plate; a phase-lagged wave runs root→outer down
the cone (a banner in the airflow). Both read "alive AND streamlined" because the wave travels WITH
the flow, not across it.

**Guardrail (mechanical, so it can't regress).** `tests/starters.mjs` now asserts, per form: (a) every
quill's `α ≤ 60°` (the anti-drag-plate law — the literal inverse of the failure), and (b) the raked
cone's projected half-width still spans the frame (`max |L·sin α·sin φ|` above a floor) so tightening
the rake can never silently shrink the rear burst back to a tassel. This exact family failed once
before (rays "rolled around the aft axis, collapsing into a narrow tassel") precisely because lengths
weren't sized against the projection — the assert encodes the fix as a law.

**Reusable rules.**
- Big surfaces on fliers: check the **angle to the flight axis** in a **moving side view**, not just
  the axial still. ⊥-to-flow = drag-brake = wrong, no matter how good the axial still looks.
- To keep an axial still-read while gaining motion plausibility: **rake the mass toward the flow axis
  and size element length as `projectedTarget / sin(rakeAngle)`** — projection is an input you budget,
  not an output you hope for.
- The re-architecture kept 100% of the material work (gold, coal constellation, Heart of Rebirth) —
  only the *placement* of the quills changed. When a silhouette fails, re-aim the geometry before
  throwing away the good surfacing.
