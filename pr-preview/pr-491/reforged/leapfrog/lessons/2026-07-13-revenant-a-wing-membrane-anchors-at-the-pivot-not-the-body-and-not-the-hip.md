# Revenant — a wing membrane anchors NEAR THE PIVOT: not the far hip (shard), not a body-fixed drape (tiny wings)

**Context.** This corrects the previous lesson's fix. The wing membrane has now been through three
attachments for its inboard (body) edge, and only the third is right:

1. **Arm-parented, reaching to the far HIP (`z≈1.05`).** Anatomically a plagiopatagium, but the long
   AFT lever meant every downstroke swung the anchor through a big arc → a floating "weird triangle"
   in flight (owner caught it).
2. **Body-FIXED drape on the torso (dorsal spine).** Killed the flap artifact, but it was a SEPARATE
   sheet that didn't move with the wing — so the wing read as a finger-fan ("tiny wings") with a
   disconnected flap on the back and long BARE arm bones. Owner: "membrane connects to the fifth strut…
   looks like tiny wings and long skinny arms which should have membrane on them."
3. **Arm-parented, anchored NEAR the shoulder PIVOT (`z≈0.10`, inboard + down = upper ribcage beside the
   joint).** Correct. This is the real fix: **the membrane lives ON the wing so it flaps as one sheet,
   and its inboard/body edge sits close to the pivot so it (a) rotates WITH the wing — natural flap —
   and (b) has a SHORT lever, so it barely translates and stays glued to the shoulder instead of
   swinging into a shard.** The whole thing (propatagium over the arm + this brachial/armpit panel
   under it + chiropatagium between the fingers) is now one continuous membrane from body to fingertip,
   and the arm bones carry membrane instead of reading as bare struts.

**The load-bearing idea: for geometry that must both move with a limb AND stay attached to the body,
anchor it at the JOINT (the pivot), not out at the far body point.** A vertex at the rotation centre is
nearly stationary in world space through the whole swing, so it reads as "attached to the body" while
the rest of the sheet moves correctly with the limb. Far from the pivot, the same rotation becomes a
big translation (the shard). Body-FIXED (option 2) over-corrects: zero motion reads as "detached from
the wing." The pivot is the one place both constraints are satisfiable.

**Anatomy notes banked:**
- Bat wing = ONE continuous patagium, not a finger-fan. If you can see bare arm bone, the membrane is
  missing its brachial/armpit section. Fill LE0→elbow→wrist down to the body.
- The inboard vertex sitting slightly INSIDE the ribcage volume is good — the membrane tucks into the
  ribs and reads as "connected to the ribcage," no floating gap.
- Anchor to arm-side + root points only (never a hand/finger vertex) so the sheet doesn't tear when the
  hand folds at the wrist; the chiropatagium (hand) meets it at the wrist seam, which is a real joint.

**Verify a flap fix on the ARTICULATED extreme, not the glide.** `silhouette.mjs <key> rear --pose=
downstroke` / `--pose=recovery` freeze the flap ends headlessly (fast; the colour `flapstrip` is too slow
to fit a timeout). Both extremes must be clean symmetric bat-wing outlines with no protruding spur.

**Still additive.** Roster byte-identical, starters 286/0, wingsym Δ0.000, 1581/6000 tris.
