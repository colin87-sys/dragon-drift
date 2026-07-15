# Revenant — `apexRoot` is the glide-pose HEIGHT dial (lower it to spread the canopy for the rear-chase)

**Context.** The wing GEOMETRY passed its gate (short arm, welded membrane, ventral dome), but the
rear-chase money shot still showed the whole wing **raised in a steep V**. That raise is NOT geometry —
it's the flap POSE. Owner asked to bring it down.

**Two different things, don't confuse them:** (1) the wing's intrinsic camber/shape (built in
`dragonRevenant.js` — the fingertips drooping below the wrist give the ventral cup), and (2) the wing
POSE — how high the whole wing is rotated by the flap rig at any moment. A correct downward-cupping
canopy can still read as an edge-on V from behind if the pose holds the wings up near vertical.

**The dial:** in `dragon.js` the shoulder pivot's roll is `-(rootF·amp) + apexRootF·amp + restLift +
baseZ`, where `apexRootF = apexRoot · apexUp(phase)` peaks at the recovery apex. So **`apexRoot` is how
high the wing lifts at the top of the beat** (and the "glide" capture shows near that apex). `restLift`
is the flat-glide dihedral (0 for the Revenant); `apexRoot` is the recovery-peak height. Both are
**per-dragon** dials — changing them touches ONLY this dragon, not the shared rig, even though the code
lives in the shared `poseWing`. That distinction matters: "it's in dragon.js" ≠ "it's roster-wide" —
check whether the lever is a per-model dial or a hard-coded constant before deciding you can't touch it.

**The change + its effect:** `apexRoot 0.26 → 0.13`. The recovery peak drops from ~12 o'clock to a
flatter ~1 o'clock broad spread, so from the rear-chase the wings read as a wide shallow **∩ canopy**
(the ventral dome finally reads from the primary camera) instead of two vertical spikes. **Tradeoff:** it
gentles the beat — less "wings towering over the back," more horizontal soaring glide. That's a motion/
feel call the OWNER judges on the preview, not something a still-image gate can score; flag it and let
them fly it.

**Process note:** don't silently retune a gated flap. The flap was motion-approved earlier; lowering the
apex changes its character. Present the lever + the tradeoff to the owner, make the modest change only on
their go, and hand them a rear-chase still + a flap-extreme silhouette so they can judge the new beat.

**Still additive:** roster byte-identical, starters 286/0, wingsym Δ0.000.
