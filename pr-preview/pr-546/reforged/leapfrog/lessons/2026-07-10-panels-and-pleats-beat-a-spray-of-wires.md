# A radial spray of thin equal elements reads as a feather-duster — web it into a drape

**Context.** After re-architecting the Empress's train from a flat drag-plate into an aft-raked
half-cone (correct — it now trails with the airflow), the owner flew it: *"you're on the right track
but it's too BUSHY… it reads kinda like a FEATHER DUSTER. It looks good when rolling right and left."*
The aero was right; the SHAPE was wrong.

**Diagnosis — three facts that make a bottle-brush.**
1. **Thin elements + mandated gaps.** 9 quills across 150° with a starter assert *requiring* a gap ≥ one
   quill-width between them (the old "not-a-ring / mandatory negative space" law). Separated near-equal
   spokes radiating from a point **is the definition of a feather-duster.** The very assert meant to
   prevent a solid ring was now *enforcing* the duster.
2. **The bright detail became the silhouette.** Each quill carried a full-length gold shaft + a bead
   gem tip; the dark vane vanished against the dark sky. What survived at chase distance was 15 gold
   wires with knobs — a whisk. **If your accent material out-reads your form material, the accent
   becomes the shape — and thin bright accents make a bristle-spray.**
3. **Two-axis symmetric scatter, no dominant edge.** Elements spread in azimuth *and* elevation with a
   symmetric length profile → the tips formed a 2-D pom-pom with no single edge for the eye to follow.

**Why a BANK fixed it (the clue that named the cure).** Rolling made the camera look obliquely along
the cone axis: near-side elements **foreshortened and stacked**, vanes **overlapped into one dark mass**
with a single scalloped edge, the gold wires demoted to interior detail, and the mass swept to one side
(directional flow + negative space on the other). The bank supplied, for free, the three things the
straight view lacked: **overlap/connective mass, a single dominant edge, and directional asymmetry.**
The fix = bake those into the default.

**The fix — "Gathered Court-Train."**
- **Fewer, broader, OVERLAPPING panels.** 15 wires → **5 wide panels**; delete the under-rank entirely.
- **Connective PLEATED MEMBRANE.** Fill each bay with two half-gores; **each gore is rigid to exactly
  one panel's animation group** and the two overlap ~12% at the mid-seam like gathered cloth. Now the
  black-fill is ONE shaped drape. Crucial: a shared/free membrane would *tear* under per-element
  animation — parenting each half to one element + an overlap ≥ 2× the max ripple makes tearing
  geometrically impossible (pleats can only slide over each other).
- **Relocate the negative space to the HEM.** Panels fuse via membrane up to ~60% of length, then
  separate into free fingers. Gaps between *fingertips* (where real feathers part) read as intentional;
  gaps between *roots* read as a bristle-spray.
- **Break the symmetry with a hierarchy, not with L/R asymmetry** (she banks both ways, so left/right
  must stay mirror-balanced). Invert the depth ladder: **deep center element (longest, the comet point)
  + short wide edges (the hem)** → head-on it gathers into a pointed down-swept train. Top-to-bottom
  asymmetry gives directional flow while `Σcant=0` and L/R mirror stay intact.
- **Demote the accent off the silhouette.** One continuous burning hem stroke instead of N per-element
  rims; thin dark interior shafts, gold only on the hero (center + hem) elements. The form is the dark
  drape; the gold is jewelry *on* it, not the outline.

**Reusable rules.**
- **N separated near-equal elements radiating from a point = a feather-duster/bottle-brush**, no matter
  how well-rendered each element is. Cohesion comes from *fewer + broader + overlapping/webbed*, not
  from better individual spokes.
- **Whatever material reads brightest against the background IS the silhouette.** Keep the accent
  (bright/metal) as interior detail; let the *form* material carry the outline — or the accent's shape
  (thin wires → bristles) becomes the read.
- **Symmetric length profiles read as pom-poms; a strong size hierarchy reads as a directed form.** For
  a creature that banks both ways, break symmetry along the *vertical* (depth/length), never L/R.
- **When "it looks good only in a bank," study the bank:** it's foreshortening-into-overlap. Bake that
  overlap (a connective membrane / broader elements) into the un-banked default.
- **A regression assert can enforce the very failure it was written to prevent.** The "mandatory
  negative space" gap-assert (anti-ring) had to be *replaced* by a `fillRatio ≥ 0.95` cohesion assert
  once the doctrine flipped from "must have gaps" to "must be webbed." Re-read old guardrails when the
  design intent inverts.
