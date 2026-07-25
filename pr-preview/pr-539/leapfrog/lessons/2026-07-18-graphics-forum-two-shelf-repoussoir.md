# Drowned Forum — the Lorrain TWO-SHELF corridor: pierce the arcade + dark-repoussoir bake (Fable 2.5 → 4.3 PASS)

**What we did.** After the basilica framing wall shipped, the owner asked to "thin the clutter + promote the
aqueduct to a nearer register." The thin (drumfall/pinisle floors → ~0.05) passed instantly. The "promote"
half unravelled into a full COMPOSITION overhaul that took a Fable pre-assess + a direction AUDIT + three gate
rounds (2.5 → 3.9 → 4.3) and ended as: a genuine **two-shelf Lorrain corridor** — one flank a solid DARK
repoussoir wall (basilica), the opposite flank a PIERCED ARCADE with the sunset glowing through the bays
(aqueduct), the breaths opening to the fog line between congregations.

**THE ENGINE LIMIT THAT KILLED THE OBVIOUS PLAN: size-scale never moves position.** `writeMatrix`
composes `pos=(d.x,-0.5,-d.dist)` and `scale=(d.r·k, d.h·k, d.r·k)`. The composition `k` (sizeClass/sMax)
scales GEOMETRY ONLY — it never touches `d.x`. So `sizeClass` cannot "promote to a nearer register": a smaller
instance sits at the SAME far x and reads FARTHER, not nearer. A true near-class needs a `place()`-level variant
(smaller r AND nearer x). Verify the matrix before you trust a size knob to change distance.

**THE WELDED-SHUT BAYS — object z is scaled by r, so a "thin" jamb becomes a deep tunnel.** The aqueduct's
`zf/zb = ±0.05` looked thin in object space, but z is multiplied by r (90-125) → a **9-12.5-world DEEP** jamb.
From any off-normal lane angle the jamb laterally OCCLUDES the whole bay → the sky was geometrically SHUT, and
no bake/ΔL-target/backer can open a closed hole. This is why two gates found "no sky-through arcade anywhere."
Fix: `±0.05 → ±0.020` (≈4-world masonry, still reads thick) → bays ~78% open. **When a prop's z-offsets are in
object space but the placement scales z by r, every depth reads r× bigger than it looks in the build.**

**THE APERTURE SIGN-FLIP is the two-shelf read — one bake, two masses, opposite statements.** `bakeForumDark`
(a repoussoir sibling of the tide-ladder bake) put a DARK face (L≈0.22 albedo) + a LIT up-facing cap rim (L≈0.55)
+ dark soffit on BOTH big masses. The basilica's dark reveals then fade to a mute whisper (dark holes in a dark
wall, ΔL≈−6); the aqueduct's OPEN bays read bright sky against a dark frame (ΔL≈+56 measured). Same bake, but the
apertures make OPPOSITE-signed value statements — that sign flip, at two depths, IS the Lorrain two-shelf. Don't
bake the two faces different values "so they differ": bake both dark and let AERIAL PERSPECTIVE stratify them
(near basilica L≈0.12, far aqueduct fog-lifts to ~0.50) — fog does Lorrain's job for free.

**DARKENING FIGHTS ADDITIVE FOG — a face-value gate must be measured NEAR, not at distance.** forumStone folds
vColor into emissive (×0.28), so a side-lit dark face LIFTS well above its backlit value: at crown 0.30 the lit
basilica rendered 0.47 (over the ≤0.40 repoussoir gate). Dropping the crown 0.30→0.22 only moved the FAR wall
0.48→0.41 — because at distance FOG INSCATTER (additive) dominates and darkening the albedo barely touches it.
That's not a failure, it's aerial perspective: the NEAR wall reads dark (0.12 = repoussoir), the far one lifts
(the depth cue). Gate the face value on a NEAR/isolated capture; accept the far lift as the fog doing its job.

**PER-VERTEX BAKES CANNOT ADD SUB-QUAD DETAIL — stop trying on a low-poly wall.** Both a per-vertex mottle
hash AND position-keyed "coursing" (cos in y) FAIL to add within-face texture on a big flat quad: the 4 corner
values just interpolate (a hash → a per-quad average/tilt; a cos → a corner gradient). Real sub-quad detail needs
a FRAGMENT shader or tessellation. Fable ruled this NON-GATING at gameplay distance/speed (the pier/window/
parapet structure + the shader weathering carry the face; it only reads flat in a parked isolated crop). Log it
as a future whole-biome shader-weathering initiative, not a per-structure fix — and don't burn your last 4 tris
on it.

**PROCESS: audit the DIRECTION before building on approved work.** The owner asked for a Fable "does this
direction achieve the look" audit BEFORE I darkened the just-passed (4.4) basilica. That audit caught the
welded-shut-bays geometry blocker that all my value-tuning would have missed — "you're tuning the paint on a door
that is welded shut." One audit spawn saved ~2 failed gate rounds. When a plan touches already-shipped work AND
rests on an assumption you haven't verified, audit the direction first.

**Numeric pre-gate (`tools/_lumprobe.mjs`, NEW — pure-node PNG luminance sampler).** Verify with numbers before
the critic round: basilica face ≤0.38 near, cap ≥0.50, aqueduct bay−frame ≥+0.22. All passed (0.12 / 0.55 / +0.56).

**What it unlocks.** The repoussoir bake + the aperture sign-flip + the jamb-depth-scaling gotcha + the
size-scale-can't-move-x limit are reusable for every big wall/massif (the coming colossus/arena walls). PARKED
non-gating polish (Fable): warm bounce in the near-wall shadow faces (void-black → rich-dark); warm-shift the
gate's cyan bracket UI; a warm rim on the floating hazard diamond; the whole-biome fragment weathering pass.

**Verify:** `HERO=aqueduct/basilica node tools/_forumfar.mjs|_forumclose.mjs`; `_forumscene.mjs` flythrough;
`tools/_lumprobe.mjs <png> <rect:label>…`; gold-determinism byte-identical, biomecycle 12/0, 146/150 tris.
