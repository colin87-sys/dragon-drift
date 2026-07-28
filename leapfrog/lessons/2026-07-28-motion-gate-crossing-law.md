# The whole harness measured one pose, so nothing could see a collision

**What we did.** Built `reforged/tools/flapclearance.mjs`, the first gate in this repo that poses
the rig and measures it *through* the flap cycle instead of rendering a still. It immediately
reproduced, as a number, a defect the owner had reported from play weeks of tool-work earlier —
and that every existing gate had passed.

---

## The blind spot was structural, not an oversight

Every tool here renders or measures a **single pose**: tricount, tiershots, silhouettes,
planformprobe, the structural probe. A wing that clears the body at rest and sweeps through it on
the downstroke passes all of them, unanimously, forever. `planformprobe` even had an assertion
attempted for this class and **withdrawn**, because rest geometry cannot distinguish a finger bone
from a plagiopatagium corner.

> **A harness made entirely of single-pose tools has a whole failure class it is structurally
> incapable of seeing.** Not "hasn't caught yet" — cannot. Count the *kinds* of measurement in a
> harness, not the number of tools; ten tools that all sample one frame are one tool.

## Law 1 — the defect is a CROSSING, not a depth

The first revision asserted on burial *depth* and on burial *growing*. Both are the wrong quantity,
and the roster proved it: **every** dragon buries wing geometry inside the torso at rest, deeply,
because that burial is how the junction seals.

What the eye catches is geometry **changing side**. Buried geometry is occluded by the torso at any
depth and is invisible; geometry outside the hull is just the wing. But a surface that is outside at
one phase and inside at another drags a **moving intersection line** across the flank — which is
precisely the "tattered, see-through" wing-body join in the owner's screenshot.

> Two asserts, one law, opposite signs: nothing outside at rest may **submerge**; nothing buried at
> rest may **surface**. Depth is not a defect. Crossing is.

## Law 2 — under near-pure roll, the radius from the axis is the whole story

The flap turned out to be almost pure roll: across the five cycle phases the wing pivot's **z**
rotation swings 0.40 → −0.63 rad while **x** moves 0.009 and **y** not at all.

So a vertex welded to that bone travels an arc of radius `hypot(x, y)` about the roll axis — **z does
not enter it**. The torso surface sits ~0.27u from that axis outboard. Therefore:

> **Any rigidly-attached point with `hypot(x, y) > ~0.27` MUST cross the hull surface somewhere in
> the cycle.** No amount of moving it along z changes that, and burying it deeper makes it worse,
> because burying raises the radius.

That last clause is the trap. "Drive it deep and let the torso occlude the excess" is written in this
very file as the fix for a *static* gap, and it is correct for one — but applied to geometry on a
rotating bone it is actively counterproductive. **A fix that is right in a still can be wrong in
motion, and the same sheet needs both checks.**

## Law 3 — an aft membrane anchor is incompatible with a single rolling bone

The plagiopatagium anchors 2.15u aft (the owner asked for the trailing edge to reach toward the
tail). That anchor sits at r ≈ 0.62. A **48-point sweep** of (anchor x, anchor y, sink depth), with
the probe as the oracle, found **no position clearing both asserts** — the search was exhaustive
enough to make the conclusion structural rather than a tuning failure.

And the roster says the same thing independently: the surfacing assert is **vacuous on all four
other dragons**, because none of them authors membrane inside the hull beyond 0.30× span. Nobody
does this. That is not a coincidence, it is the constraint.

> When a parameter sweep finds no feasible point AND the shipped roster has silently avoided the
> whole region, stop tuning. **The geometry is telling you the architecture is wrong**, and the fix
> is a different part (here: a static body-side web so the crossing happens under body geometry),
> not a better number.

## Process notes worth as much as the laws

**Calibrate on the shipped roster before pointing a new gate at the subject.** Same discipline
`planformprobe` needed. The first band set here failed *Tempest*, the premium bar — that is a bug in
the band, not a finding about Tempest.

**But do not let the roster set the floor by majority.** Vesper fails C1 at −0.176u. Loosening the
band to make the roster all-green would have left the gate blind to the subject's −0.48u by a margin
of 0.28u — blind to the class at the magnitude a player notices. The band is set at what the
**premium bar actually achieves**, and Vesper is recorded as a known non-conformance.

**A gate that passes on an empty sample set must say the set was empty.** C2 covers zero samples on
four of five dragons. Printing `VACUOUS — 0 samples` is the difference between a tripwire and a
green tick that reads as evidence it never gathered.

**Watch for sentinels leaking into magnitudes.** "No hull at this station" was encoded as `9`, and
feeding it into a violation figure printed a `−9.000u` defect on a creature 4u across. A number that
cannot physically exist is the cheapest bug signal you will ever get — and it only showed because the
report prints magnitudes rather than just pass/fail.

**An unverified tool is worse than no tool.** The first version of this probe booted the browser,
walked the live scene, printed its header, and found nothing — five phases, zero measurements, exit
code 0 on the wrapper. It looked exactly like a gate that had run. Rebuilding it in node against
`buildDragonModel` + the shared `setFlapDebugPose` (the pattern `planformprobe` and `silhouetteCore`
already used) made it deterministic and ~1s per dragon. **Reach for the in-process path before the
browser path; the browser is for pixels, not for geometry.**

## What it unlocks

Motion is now measurable. Any future rig change — a new flap dial set, a fold pose, a bank — can be
checked for interpenetration in about a second per dragon, and the same probe generalises to any
part welded to any moving bone (tail chain, head, legs). The wing's reported collision is closed;
its mirror is open, characterised, and specified.
