# Revenant I2 — a rear-chase hole must FACE the cam, not just exist

**What we did.** Built `phalanxShroudWings` for real — the hero part. A bone arm (humerus + radius,
elbow bent ≥20° off the chord) → 4 metacarpal FINGER bones fanning aft (dominant + decay `lenFrac
[1,.80,.62,.46]`) → shroud panels on the OUTER bays only, the INNER bays left OPEN → a single connected
translucent HEM band closing the trailing edge, cut into crescent bites. It folds at the wrist so the
gaps vanish. The `--holes` metric drove it, and it exposed the real trap of the whole dragon.

**The trap — an enclosed hole is necessary but NOT sufficient; it has to face the camera.** My first
wing was geometrically correct: the open inner bay was a true enclosed hole (framed by two finger bones
+ the hem, exactly the I1 continuous-frame lesson). The top-planform view proved it — a clean 150px
window per wing. But the **rear-chase** read — the ONE angle that sells this dragon — was nearly empty:
in the glide pose the wing sat almost horizontal (16% tall, edge-on), so the bay foreshortened to a 9px
sliver, below the ~8px/250px floor. **A hole in the wing plane is invisible from any camera that looks
along that plane.** The rear-chase cam is above-and-behind, looking nearly horizontally forward, so a
flat spread wing shows it only the thin trailing edge — bay and all.

**The fix is ATTITUDE, not more holes.** Three geometry levers rotated the bay to face the rear cam,
with zero change to its enclosure:
- **Sweep 0.42→0.52** — the finger fan rakes further aft, so the bay's plane turns to face rearward.
- **Dihedral 0.20→0.30** — the wing lifts, presenting its upper surface to the above-behind cam.
- **Fan spread 1.05→1.22 rad** — wider bays, bigger target.

Result across poses (rear, wings-only, scale 2, floor ~16px): glide 9→**25px**, bank **93px**, apex
**103px**. Same hole, now aimed at the lens. **When a through-hole measures big from the top but tiny
from the rear, don't cut a bigger hole — rotate the surface it's in toward the camera (sweep + dihedral).**

**The pose that matters is the pose the game holds.** The bay reads strongest in *bank* and *apex* — and
the dragon banks constantly in play — while *downstroke* naturally compresses it (7px) because the wing
is mid-beat. So judge the wing-bay read across the STATE set (glide/bank/apex), not one frozen glide
tile; a hole that's only edge-on for one transient pose is fine, one that's edge-on at cruise is not.

**"Not a re-skinned Vesper" is a measurable claim, and the metric settles it.** Same rear bank pose,
wings-only: **Revenant largest bay 93px vs Vesper 4px.** Vesper's bays are FILLED cupped membranes (0
enclosed holes by construction — I0 measured that); the Revenant's are OPEN and hem-framed. The distinction
isn't a vibe — it's an order of magnitude in enclosed-hole area. Wire the `--holes` trio into the gate and
the "must not read as re-skinned Vesper" clause becomes a number, not an argument.

**The hem is the wing's dorsal rail (the I1 law generalises).** An open bay is only an enclosed hole if a
continuous frame closes its trailing edge — for the rib cage that was the dorsal rail; for the wing it's
the ONE connected hem band riding just inboard of the whole trailing polyline. Cut the hem and every bay
opens to the rim and the holes evaporate (that's literally what Vesper's cupped-but-unframed bays are).
The finger bones are the spokes; the hem is the rim; K is the hub. Frame first, then omit the skin.

**The −anchor fold contract carried over untouched — so did Δ0.** The whole hand (fingers + panels + hem)
lives in one group hung at `-K` off the wrist `tip`, so it folds as a rigid sheet: glide width 15% →
fold width 9% = **0.60** (meets the ≤0.60 transformation bound), and the gaps compress 25→12px on the
fold. Because I only swapped GEOMETRY inside `buildOnePhalanxWing` and kept the pivot/mid/tip + outer
`lmirror` wiring verbatim, `wingsymprobe` stayed **Δ0.000** first try. One gotcha paid forward: don't
anchor a root gusset across the wrist (shoulder point on the folding hand → it tears); put the inboard
web (propatagium) on the ARM group instead, where the fold displacement is zero.

**Budget + byte-identity held.** Wing tris are modest (fingers/hem/panels accumulate into a few
`flatTriMesh`); full model 872→ still 0 over budget, existing roster byte-identical (comm-diff 0 changed
rows), creaturestress peak unchanged (revenant adds a couple translucent layers — hem + panels + heart —
still far under the phoenix cliff).

**What it unlocks.** With torso windows (side/rear-¾) + wing bays (rear-chase) both reading as enclosed
holes, the SKELETON identity is carried on every angle the game shows. I3 (`revenantSkullHead` +
`vertebraeWhipTail`) adds the third rear carrier — the lit tail-vertebra gaps — and the face's socket
ladder; I4 lights the dorsal spine-gap leak that the §4.2 read names as the animated rear-chase carrier.
