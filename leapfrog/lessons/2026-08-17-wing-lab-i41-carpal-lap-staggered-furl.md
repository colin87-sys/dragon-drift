# I4.1 — the carpal lap, the staggered furl, and two probes that were measuring the harness

**Article:** `reforged/js/dragonForgewing.js` (wing-lab test article) · **Round 6 sent back
MOTION as a LOSS with SILHOUETTE and MEMBRANE re-opened narrowly.** All of it on delivery,
none of it on substance: the fold itself measured 0.497× span against a ≤0.55 target.

## What we did

1. **Closed the carpal channel without touching the weld.** The wrist's 0.296 u gap is not
   the fold's — it is the BEAT's: §8.1's hand carries a 0.54 rad in-plane apex sweep about
   +Y (LAW 3, the depth-projection fix) and a seam whose own line runs aft cannot absorb a
   yaw. So the weld stayed the rig's truth and the READ changed: the handwing's inboard row
   is no longer welded ON the carpal line, it is a **tongue lapped inboard onto the
   plagiopatagium's own surface** and tucked under it (§5.4(1)). Zero triangles — the row
   moved, it was not added.
2. **Staggered the furl (kill #69).** Three lobes — digit IV + bay III–IV, digit V + bay
   IV–V, digit VI + bay V–VI — each turning about **its own spar's weld line**, on three
   windows that barely overlap. Trailing-first, digit III (which IS the wrist frame) over
   the stack last.
3. **Zeroed the through-skirt count** by swinging the shoulder FORWARD in the fold and
   giving the skirt back 30% of its lateral reach.
4. Four acting silhouettes (tuck · cape-drape · display · mantle) from the same array, a
   fold-arc tile row, a new channel probe, and five instrument closures.

## The gotchas — four, and three of them were the instrument

**⚠ A per-finger furl cannot be three scene nodes if the fan is two meshes.** Splitting the
fan's crust + membrane three ways costs **+4 draws per wing** — 26/pair against a ≤20
freeze, with COST already won. The answer: lobe 0 keeps the real `wingFurl` JOINT, and
lobes 1–2 are the SAME rotation about the SAME published axes **baked into the fan's own
vertex buffers**. It is free where it matters (the furl array is identically zero in every
flight pose, so the deformer never runs during the beat) and — unlike a shader-side or
skinned fold — every pure-math probe in the lab still reads the real folded article.
**Bake from REST every time, never incrementally**, and key the skip on the buffers'
`version` as well as the angles: an angle-only cache refuses to repair geometry a probe
mutated behind it, and a known-bad then leaks into three later reads.

**⚠ `axisMat(R, …)` where `R` is the function's own scratch matrix.** One aliased temporary
turned the outer lobe's transform into R², and the fold sheet showed membrane chunks
flying free above the dragon. **The renders caught it; every number passed.** Geometry
numbers beat critic pixels — except when the bug is in the numbers' own code.

**⚠ A silhouette probe measures whatever you isolated.** The channel probe was written
three times before it measured the wing:
- both wings in frame → the gap BETWEEN them scored (7/9/14 false channels on the roster);
- `wingOnly` → the hidden body detached the body-frame skirt and the carpal claw cluster,
  and the probe reported a wing with no slit in it as **three severed pieces**;
- an absolute pixel depth → a 15 px space between two carpal claws scored as the same
  defect as a 65 px channel across the wing.
  The measurement that survived: **one side WITH the body, and a hole counts only when
  ≥80% of its border is WING, it runs ≥4% of the frame, and it is ≥0.1% of the article.**
  Two of those three clauses exist purely to stop the probe measuring the harness.

**⚠ A synthetic hole must delete triangles, not move them.** Collapsing a tagged block onto
its centroid fans the neighbouring quads into the gap and covers it again — the control
never fired. Setting the block's positions to **NaN** kills every triangle touching it and
leaves a real hole. That gave a fire-and-clear pair on ONE surface, which is the strongest
form of kill #67: nothing differs between the two runs but the defect.

## Reusable patterns

- **THE READ MAY CHANGE INSTEAD OF THE RIG.** When a weld gap is the price of a motion you
  are not allowed to give up, lap the sheets instead of closing the seam — and **taper the
  lap to where the gap actually is.** The wrist rotates about its seam's CENTROID, so the
  two ends of the carpal line move in opposite directions: the leading end laps further in
  (no gap can ever open there), the trailing end swings out (all of the gap is there). A
  constant lap buys nothing at the leading edge and costs a sliver of skin behind the wrist
  bones — measured as a 28 px hole that a tapered lap (22% → 100%) removed outright.
- **MEASURE A FAN IN THE HAND'S OWN FRAME.** A "does the fan close" number taken in a world
  camera reads all three bays GROWING 2.2× through the fold, because the arm rolls the wing
  flat-on to that camera. Project into the frame the fan opened in and the arm disappears.
  And count the area each bay **uniquely owns**, not its total: a per-spar furl ends with
  the lobe flat again, stacked on its neighbour, and a plain area measure calls that
  "still there" when the outline has already lost the scallop.
- **ATTRIBUTE A BOUND, DON'T ASSERT IT.** The fold-pose vertex cloud (0.0394 ≤ 0.05) now
  ships with a per-mesh table AND a proof: rebuild with `wingSeedLock` (both wings on seed
  0, §7.4's mandatory weathering off) and the cloud must collapse to the rig's own zero.
  If it does not, the residue was never weathering.
- **MOVE THE CAMERA, NOT THE THRESHOLD.** The §5.5 tier spread read 2.47× at a raised
  glide and 4.13× at settle, on locked thresholds — the criterion's job is "the banding
  reads where the face reads". The three-way isolation (old pose + old dials 3.27× · old
  pose + new dials 3.20× · new pose + new dials 4.13×) says the R5→I4 step was **0.07× of
  build and 0.93× of pose**.

## What it unlocks

The seam-axis law now has its per-finger form, with a measurable "one scallop at a time"
(bay V–VI half-gone at f 0.25, IV–V at 0.40, III–IV at 0.50; the door-fold control leaves
all three within 0.10). Any future welded fan — a fin, a frill, a sail — can furl legibly
inside the same law at zero draw cost. And the lab has a channel probe that can be pointed
at any wing in the roster.
