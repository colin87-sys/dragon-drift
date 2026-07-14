# Cant dorsal fins off the sagittal plane so they catch a REAR-CHASE cam

**What we did.** Solar CP2 shipped; the owner then flagged the tail as reading weaker than the
wings/corona from the rear-chase cam. A Fable diagnosis rebuilt `scepterWhipTail` with ember sails +
a violet gem spine + a jeweled scepter-crown (PASS 4.27), but its residual note was sharp: the
*ember fins* — the flashiest part of the fix in side/rear-¾ — were **still lost in the pure dead-rear
view**. This polish pass fixed that and two smaller rung items.

**The reusable trick: a broad face aligned to the body's long axis is EDGE-ON to a tail-trailing
chase cam, so it foreshortens to a sliver.** A dorsal fin is a vertical sheet in the YZ plane (its
normal points sideways, ±X). The dragon flies away from the chase cam, so the tail trails toward the
lens down the Z axis — and a ±X-facing sheet presents only its thickness. The fins looked great in
side profile (where the cam sees the face) and vanished in rear-chase (where the cam sees the edge).

Fix: **cant each fin ~±13° about the VERTICAL axis through its root**, alternating left/right down
the row (`yaw = (k%2 ? -1 : 1) * 0.23`, rotate the sail's points about `(bx,by,bz)` in the XZ plane).
That swings each fin's normal from ±X toward ±Z — so its bright ember tip now catches the rear cam —
while the alternation keeps the tail balanced and reads as a herringbone fan from the top planform.
Zero tri cost (repositioning existing verts). The materials are already `DoubleSide`, so the canted
face lights from either side. General rule: **on a primary-view camera, a flat decorative sheet must
present its FACE, not its edge — rotate the sheet's normal toward the camera, and if symmetry forbids
a single tilt, alternate the tilt down the row.** (Same family as the CP2 corona lesson: the bright
band must face the camera, not sit edge-on to it.)

**The other two rung items.** (2) Wider tip swing — bumped `curveX` 0.30→0.38 so the raised
scepter-crown clears the torso outline decisively in the rear silhouette instead of reading as a
small right-side spur. (3) f0→f1 legibility — laddered the crown prong length `plen` 0.4+0.6·bloom →
0.15+0.85·bloom, so the Hatchling's tail terminal shrinks to a tiny nub (it was pre-spending the
crown reveal) and the full jeweled trident now reads as a genuine f1+ coronation step. f3 length is
unchanged (both formulas hit 1.0 at bloom 1).

**Verify.** tricount 968/1336/1736/2184 (identical to pre-polish — repositioning only) · wingsymprobe
PASS · starters 201 + blueprint + smoke green · dragonstudio top-planform shows the herringbone ember
fan; Fable re-grade.

**Process note.** The merged PR (#324) is finished — this follow-up restarted the same branch name
from the latest master (`git checkout -B <branch> origin/master`) and opened a NEW draft PR. Never
stack follow-up commits on already-merged history as if the old PR were still live.
