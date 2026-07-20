# Unmasked: the black wing-hub → a lit reliquary (2026-07-20)

**What we did.** Owner playtest caught the seraph's central defect: the eight wing roots
converge into a **black hub** with **straight dark bars radiating out of it** — the "wheel /
spider" anti-read, and janky/AI-slop. A Fable art director diagnosed it as ONE defect ("every
high-contrast element converges on, or radiates from, one small dark point") and returned a
six-item numeric plan, executed below and handed to a fresh Fable critic for checkpoint. Fixes
(all perf-safe — vertex colors / opaque geometry / repositioned rings, zero new additive volumes):

1. **The value-band was self-inflicting the black roots.** The ramp I'd added last pass put the
   value TROUGH at every feather root (root ×0.62). Re-anchored to root ×1.04 → trough ×0.86 @
   t0.35 → tip ×1.16 — the shadow moves to MID-feather (a shaded vane), never the convergence.
2. **A warm ROOT-LIFT** baked into the feathers by wing-local distance from the shoulder (r ×1.08,
   b ×0.86, fading by d=1.7): the roots now catch reliquary ember-light instead of dying to black.
3. **The RELIQUARY RUFF** — a feathered collar of warm covert tufts ringing the great eye, seated
   IN FRONT of every wing plane so every root cord, arm-edge, and rachis end terminates HIDDEN
   BEHIND it. The lines now radiate out from behind a lit mass, never meet at a naked point.
4. **The knot** went from void `0x1b1b24` to warm umber + dim ember floor (a lit body, luma ≪ the
   eye so the focal isn't contested).
5. **The great eye grew** (GW 0.9→1.25) + pushed forward past the ruff, with a T7-safe brighter
   gold iris — it wins the centre so the brightest thing is the EYE, not a ring.
6. **Curved the wing arm + quills** (`shape:{primBow:1.35,armBow:0.2}`) so the covert column
   edges stop reading as straight radial bars at the source; **fewer rachis shafts** (leading
   primaries only, born outboard at t0.30).
7. **Both nimbi re-seated as crown arcs** above the eye (not rings on the hub — a low ring the
   wings occlude reads as a wheel rim); **halo3 rebuilt** from a uniform RingGeometry (onion-ring
   tell #5) to the halo2 3-loop vertex-falloff; **starburst jittered** (angle + length, metronome
   kill) and born outboard behind the ruff.

**What we learned (the gotcha).** A per-feather value ramp that darkens the ROOT is lethal when
many parts CONVERGE — the individual gradient looks fine in isolation but sums to a black hole at
the shared origin. For any radial/converging assembly, the ramp must floor or LIFT the shared end,
never trough it. And the cure for "spokes meeting at a point" is not to delete the spokes but to
**put a lit occluding body at the convergence** so the lines die behind it (SotC "the body is the
arena") — this reads as feathers-in-light, not mechanical spokes, and fixes stage 2 and stage 3
with one part because both stages share the convergence.

**What it unlocks.** The `bakeValueBand` root-lift + the reliquary-ruff occluder pattern apply to
any converging-limb boss (Marrowcoil's ribcage roots, Weftwitch's radial threads). Known residual
to watch at the critic checkpoint: in S3 the smaller star-eye no longer caps the enlarged knot,
so the S3 centre reads a touch dark — a candidate one-item follow-up if the critic confirms it.
