# Vesper CP3 — publishing the rig hinges (the "stiff" fix): a wrist-fold wing + a jointed tail

**Context.** After the owner's 1.5/5 ("stiff and basic") the Fable rework plan's CP3 was MOTION —
"publish the missing rig hinges." Two independent fixes, each Fable-gated. Round 1 scored **3.0/5
REVISE**; the critic caught a runtime bug my self-review missed. Round 2 scored **4.6/5 PASS**.
The whole reason this landed is the gate: a static build + my own eyeball would have shipped the
plank. **A harsh Fable critic per checkpoint is not ceremony — it caught a shipping defect that
every headless test was blind to.**

## The headline bug — the rig was animating joints that carried no geometry

The wing build made three groups — `pivot → mid → tip` — and parented **all** wing geometry to
`mid`, leaving `tip` an empty Group. Vesper's def had no `flap` and no `wingParts`, so the rig fell
through to the generic **direct-pivot** branch, which writes `pivot` + `tip` but **never `mid`**.
Net: the only joint that moved geometry was the shoulder → **a 1-bone plank hinging at the root**,
with the "tip fold" rotating an empty group. Every objective test was green (symmetry, tri-count,
palette) because none of them measures *articulation range*. This is the exact MIRROR of the tail
lesson from the same checkpoint: the tail returned **joints with no geometry bug fixed** → here the
wing was **geometry with no joints**. Same family of defect: a hinge and the thing it should move
were in different objects.

## The reusable fixes

**1. Split a membrane wing at the wrist, fold the HAND as one rigid unit.** A bat membrane is a
CONTINUOUS sheet — you cannot split it across N independently-rotating segments without tearing it.
The tear-free articulation is the natural crease: `buildOneScallopWing` now returns `{ arm, hand, K }`
— `arm` = shoulder→carpal (arm bone + gusset + thumb), `hand` = carpal→fingertips (**every** finger
+ the **whole** connected membrane + knife-edge). The hand parents to `tip`, positioned at the carpal
`K` with `hand.position = −K`, so `tip.rotation` folds the entire hand about the wrist while the
membrane inside it never deforms. The `−anchor` offset (the same trick the tail chain uses) keeps the
assembled **rest pose byte-identical** — starters/defs stay green, tri-count unchanged (pure reparent).

**2. A bridging membrane must not reference a vertex on the other bone.** The root gusset originally
used the aftmost **finger tip** as a corner — a `hand` vertex — so it tore when the hand folded.
Re-anchor it to arm-side points only (`LE(0)`, the carpal `K`, the hip, an arm-plane aft corner).
Because `K` is the fold pivot, displacement at the shared edge is ~0; the gusset can't tear. General
rule: **any geometry that spans a joint must have all its vertices on ONE side of the joint** (or on
the pivot itself).

**3. The mirror gotcha — outer-wrapper reflection, NOT `scale.x=-1` on the posed pivot.** The shared
wing posers (`wingParts`, `yoke`) write **identical** L/R rotations and rely on the LEFT wing being a
reflection applied OUTSIDE the pivot (`lmirror.scale.x=-1` parenting the pivot → **rotate-then-flip**,
the aurumToro convention). Vesper had `pivot.scale.x=-1` ON the pivot (**flip-then-rotate**), which the
old direct-pivot branch compensated for with explicit ± sign writes. The moment we adopted the
`wingParts` poser (identical writes), that inner scale **desynced rotation.y/.z** → the wings beat in
opposite directions (`wingsymprobe` Δ jumped from 0.000 to ~3.0). Fix: wrap the left pivot in an outer
scale.x=-1 group and build both wings canonical. **Under a negative-scale parent, a rotation applied
INSIDE the scale is not the mirror of the same rotation outside it** — put the reflection outermost.

**4. Adopt the `wingParts` poser to kill the sine metronome (fixes two gaps at once).** Routing Vesper
through `wingParts` (pivot=shoulder flap, mid=forearm lagged curl, tip=wrist fold) also swaps the pure
`sin(phase)` beat for a `glidePow`-shaped waveform that HOLDS the broad glide pose and pulses through
it — a stealthy "commands the air" beat. Per-form ladder: whelp `wingParts:1` glidePow 0.9 (frantic) →
sovereign `wingParts:3` tipAmp 0.55 glidePow 2.2 (deep wrist fold, held glide). Note: for Vesper the
poser gates mid/tip on OBJECT EXISTENCE + amp, not on the `wingParts` count (that count only drives
aurumToro's segmented *geometry* builder), so the whelp's simpler beat comes from `midAmp:0/tipAmp:0`,
not from the count.

**5. Motion IS identity — don't ship a photocopy.** The tail dials were byte-identical to Phoenix
(`0.13/0.26`). A premium collectible needs a bespoke signature: Vesper is a supple predator →
`tailLagScale 0.16, tailUndulateX 0.34` (deeper/slower undulate) vs the roster's flame-whips. Cheap,
in-code, and the gate treats a copied dial block as a real defect.

## Gotchas banked

- **Green headless tests do not prove motion.** Symmetry/tri/palette all passed on the plank. Add an
  articulation-RANGE check if you want a static guard (wingsymprobe already reports per-phase Cy —
  glide 2.06 → downstroke −1.00 post-fix vs 1.19 → −0.00 on the plank; that spread IS the proof).
- **`flapstrip` intermittently captured the hub screen** on some phase boots (a swallowed best-effort
  `#btn-start` click). Hardened it to retry until the button hides. Tooling flake, not the model — but
  it can waste a gate round if you read it as the dragon.
- **The tip marker / FX emit point must ride the folding `hand`**, not `mid` — else the trail emits
  from where the wingtip *used* to be (the CP1 detach gotcha, now on the wrist joint).

**→ Unlocks.** A reusable membrane-wing kit: arm/hand split + wrist-fold via `−K` anchor + outer-mirror
wrapper + the `wingParts` glide-hold poser — any continuous-membrane wing in this engine can now
articulate without tearing. CP3 done. **Carried to CP4:** the split fan is still passive (steal the
Jade `lobeFlare` boost/bank spread for a signature fan flare), plus the ladder re-grade + the 4th
readable value tier + the holistic ≥4.5 gate.
