# Plan — Obsidian unified body+wing continuous skinned hull (the "one organism" build)

> Handoff for the next session. Read `LEAPFROG.md` first (esp. **L23**, and L20/L21/L22 for the
> scaffolding this supersedes). This is the **next major frontier**: stop assembling the creature
> from separate skinned meshes that seam, and **generate it as ONE continuous skinned hull**.

## Northstar + the bigger arc (added 2026-06-18 — read with ledger L24)

**The thesis (why hull BEFORE blueprint):** the hull is a **parametric GENERATOR**; the data it
consumes (`profile`, `wingSpec`, arm radius, `junctionSkin`, section, centreline, `motionProfile`)
**IS the blueprint**. Build the generator first and the AI-authoring vocabulary is just the
formalized, validated, documented set of knobs it exposes. Designing a creature schema *before* the
geometry that realizes it = formalizing a **Lego system** (the seam saga L20→L23 is the proof: the
cleanest authoring schema still yields seamed Lego if the geometry assembles separate parts). So the
arc is three sequenced phases:
1. **Hull (this doc, Increment 1)** — Obsidian body+wing as ONE continuous procedural skinned surface.
   Unblocks the *look*.
2. **Generalize the generator + the motion whip** — extend the kernel nose-to-tail (neck/tail/head) on
   ONE bendable spine; add the vertical body-whip motion (below). The per-dragon params + feel
   crystallize → the vocabulary.
3. **Blueprint layer** — registry-DERIVED grammar + loud actionable validation + the imperative
   decoration "Lego residue" (`dragonModel.js:164–334`) promoted to declarative `surfaceLayers` over
   the hull + `CREATURES.md` + roster migration so the **organism path is the DEFAULT, not opt-in**.

**Visual northstar (reference imagery):** confirms the **FLESHY ARM** — upper-arm + forearm tubes of
**body-matching radius** (gold claws at wrist+finger tips), with the **membrane spanned FROM the arm
AND along the body flank to the hip** — *not* a wire-rib + flat sheet pinned at a point. Wing roots
sit **high on the back**, rider on a central shoulder hump, and **decorations follow the surface**
(pectoral/shoulder/tail plates → Phase-3 `surfaceLayers`, not floating blocks). **The acceptance view
is the REAR / ¾-rear chase cam IN MOTION**, not a side rest pose.

**Motion northstar (the ultimate target — a rear-cam wingbeat, ~0.7s):** the whole body **porpoises
VERTICALLY as a whip**, the **tail whipping in counter-phase**, synced to and *powering* the beat
("the weight behind the wings"). Beat read: wings level (glide) → up-sweep → up-beat peak (**body
arched/compressed**) → down-sweep → power down-stroke (**body extended**). **This is only possible on
ONE continuous hull on a bendable spine** — so the hull is what *unlocks* the motion, and the motion
is *why* the hull matters beyond sealing the seam. Implement as a `driveChain` phase-lagged **vertical
spine wave** (reuse the EXISTING rig transforms as bones, L16; **zero rig-contract change**),
data-driven by a per-dragon `motionProfile` (amplitude, frequency=flap, lag body→tail, counter-phase
gain; L5/L7 — *lag sells weight*). Built in Phase 2, exposed as blueprint vocabulary in Phase 3.

## Context — why

Obsidian's creature is assembled from **separate skinned meshes that meet at seams**: the body
(a lofted tube), the wing membranes (flat skinned sheets), the tail (a skinned tube), plus a
shoulder "bridge" tube (L20) and a Pass-2 shoulder-skinned torso (L21) and a membrane root-weld
(L22). The wing (pale, flat, translucent) and body (dark, round, solid) are **two different
surfaces bolted at the wing root**, so during the flap the broad wing root swings *off* the body
(up-beat gap) and *into* it (down-beat collision). Three incremental patches did NOT fix it — and
two fought each other (Pass-2 body bulge capped 0.34 vs membrane root 1.0 on the *same* shoulder
bone). **Root cause (confirmed in code): there is no shared vertex between the body surface and the
wing surface, so nothing forces them to stay coincident.** The human's conclusion is correct and is
the studio's own L1/L14 north star: *you cannot patch two surfaces into one organism; the body and
wings must be ONE continuous skinned surface* — exactly how the wing's separate panels were earlier
unified into one skinned membrane.

**Critical constraint (the whole project's point):** the hull must stay **procedural/parametric** —
generated from the blueprint data that already varies per dragon (`profile` + `wingSpec`), NEVER
hand-sculpted. Hand-sculpting one mesh per dragon would kill AI-prompted diversity. Done right
(generated from a blueprint), the unified hull is *more* AI-promptable (describe the organism's
shape; the engine emits a fluid creature) — it is the declarative-organism vision finally realized
in geometry.

## The missing ingredient — the wing needs a FLESHY ARM, not a wire (why the tail already works)

The human's diagnostic question: the **tail** connects to the body smoothly — why not the wing? The
geometry answers it. The tail is a fleshy round **tube** (`baseR 0.27`, `dragonTail.js`) emerging from a
body rear of `~0.17–0.29` half-width — **same form, matching radius** — and its base is *locked* (only the
tip coils), so it reads as a continuation of the body. The wing has **no fleshy arm**: its only "arm" is a
**0.11→0.02-radius WIRE** rib (`dragonWings.js#buildSkinnedRibs`, the leading edge) plus a flat membrane,
hung off a shoulder of `~0.66–0.8` half-width. A thin wire + a flat sheet dangling off a fat round mass
never reads as one creature — there is no limb bridging the forms.

**Design requirement (part of Increment 1, NOT a later step):** build the wing as a **fleshy arm + a
membrane spanned from it**, not a bare sheet pinned at a point.
- Add a `skinnedTube` upper-arm/forearm whose **radius matches the shoulder mass** (taper from ~the body
  flank radius at the shoulder down toward the wrist — *not* the 0.11 wire), emerging continuously from the
  loft on the shoulder→elbow→wrist bones (the exact primitive the tail uses, `dragonSweep.js#skinnedTube`).
- Span the **membrane FROM that arm and along the body flank** (the patagium), all welded into the one hull.
- The tail "cheats" (matching round form + a non-rotating base); the wing is the hard case (form-mismatch +
  a rotating joint), so the fleshy arm is what gives the continuous-skin shoulder something organic to blend
  into. Without the arm, the body→membrane weld is still flat-sheet-onto-round-body and won't read right.

## Increment 1 — Obsidian torso+wings as ONE continuous skinned hull (coexist, reversible)

### Wiring
- New module `reforged/js/dragonUnifiedHull.js`, self-registering a **wings**-slot builder
  `registerWings('unifiedHull', (def,model,attach,giM) => buildUnifiedHull(...))` (wings already own
  the rig bones, `flapWing`, `wingMat`, `spineMats`, mounts/bind). Import it in `dragonModel.js`
  alongside the other part modules.
- `dragonTorso.js`: add a `bodyMesh:false` opt to `buildTorso` that builds fairings/neck + publishes
  `attach` (incl. `bodyMatDouble`, `wingRoot`, `keelTopAt`, `halfWidthAt`, `bodyMidY`) but **adds no
  body mesh** (the body surface now lives inside the hull). Register `unifiedHullTorso` using it.
  Export the currently-private `bladeRing`, `keelTopFor`, `halfWidthFor` (the hull samples them).
- `dragons.js`: Obsidian → `parts: { torso:'unifiedHullTorso', wings:'unifiedHull', ... }` (drop
  `sweptLoftSkinned`/`skinnedMembraneBridge`). **One reversible data switch.** `resolveRecipe` needs
  no change (explicit parts win); the rest of the roster is byte-identical.

### Topology — the wing grows out of the loft (the core generator)
1. Build the body loft via `sweepProfile(ARROW_PROFILE, stretch)` (`dragonSweep.js`). Keep it closed
   and watertight (belly/back unchanged).
2. Build each wing grid via `buildCurvedPatch(wingSpec, {... spanStart:0, spanEnd:worldMaxX,
   segU:SEG_U, segV:SEG_V})` exactly as today — a `(SEG_U+1)×(SEG_V+1)` grid whose **root column
   `i=0`** is the root chord.
3. **Re-seat the root column onto the loft flank:** for each of the `SEG_V+1` root-column vertices
   (chord param `v∈[0,1]`), compute the matching point **on the loft** by sampling `z = lerp(zRootFront,
   zRootBack, v)` (the z-window centered on `wingRoot.z`, width = the wing's `rootChord` — the *same
   datum* the membrane uses) and the flank x/y from `halfWidthFor`/`keelTopFor`/`bodyMidY`. Sample
   the loft **analytically** (resolution-free), not by snapping to loft vertices. Now the wing root
   edge lies exactly on the body surface, following its curvature.
4. **Blend the inner columns `i=1..k_blend` (≈`round(SEG_U*0.12)`)** from "on the loft flank" to "the
   natural `buildCurvedPatch` position" with a smoothstep — the membrane **emerges tangentially** from
   the flank (no crease, no bolted plane).
5. **Merge into ONE BufferGeometry** (loft verts + both wing grids), welding the wing root column to
   the loft flank-border ring as **shared/coincident vertices**, so `computeVertexNormals` smooths
   across the junction (no lighting crease). One mesh = one draw call.

Detail-aware: loft `m=seg(8)`, wing `SEG_U=seg(24)/SEG_V=seg(6)` already scale; weld along the chord
param `v` (both sides share `SEG_V+1` seam points) so it stays weldable at LOW/HIGH/ULTRA. Guard with
the `curvedpatch.mjs` degenerate-tri scan (L3).

### Skinning — ONE weight field (the bug-killer)
Bind the merged hull to a **7-bone skeleton** `[bodyRoot, shoulderL, elbowL, wristL, shoulderR,
elbowR, wristR]` (the shoulder/elbow/wrist are the existing rig `pivot/elbow/wingTip` bones; `bodyRoot`
is a static bone holding all body verts). Assemble hull + both L/R mounts at a common origin →
`updateMatrixWorld(true)` → `hull.bind(skeleton)` → then position (the proven local-bind-then-position
order, `dragonTail.js`/`dragonWings.js`). Weights:
- **Body verts** → `bodyRoot` = 1 (static).
- **Wing verts** (`i>k_blend`) → today's `spanSkin(|x|)` gradient (shoulder→elbow→wrist). **Reuse
  `spanSkin`** (export it from `dragonWings.js`).
- **Junction verts** (the shared seam + blend columns + the loft border ring) → ONE `junctionSkin(t)`
  applied to **BOTH sides of the seam** so paired verts get **identical weights**. `t=0` at the seam
  (mostly `bodyRoot`, small shoulder lead-in matching `spanSkin` at `ax→0`); `t=1` at `k_blend`
  (hands off continuously into the pure-wing gradient).
- **Why this fixes it:** the seam is ONE edge (shared verts + identical weights) → the body-edge vert
  and wing-root vert resolve to the *same* deformed position under any bone rotation. There is no
  longer a body edge and a wing edge that can separate.

Ribs/edge-glow (`buildSkinnedRibs`) stay per-side on their own `[anchor,shoulder,elbow,wrist]`
skeletons (they don't cross the midline). Rig contract unchanged: return the same `{ group, parts:{
wingPivotL/R, wingTipL/R, tipMarkerL/R, wingRigL/R, wingPivot2L/R }, wingMat, spineMats }` so
`dragonModel.js` needs no structural change. `flapWing` drives it; zero new animation.

### Material — one mesh, one material, vertex blend
Wear `attach.bodyMatDouble` (the DoubleSide body material with its fresnel-rim/cellular-scales/
iridescence patches) so the body region is pixel-identical to today. Add a per-vertex `mFrac∈[0,1]`
(0 body → 1 wing) attribute + a composable `composeSurface` patch (`dragonSurfaceShader.js`) that
lerps color toward the wing `wingInner→wingOuter` gradient and fades the membrane translucency by
`mFrac`. **De-risk fallback** (ship first if the single-program alpha slips): keep the body region
opaque (the hull) and render the **outer membrane** as a *second mesh sharing the same skeleton +
welded verts/weights* with the translucent `wingMat` — the junction (the part that gapped) is on the
opaque hull, so the bug is still fixed; fold to single-material later. Keep `mFrac`/vertex-color in the
geometry from day one so the upgrade is shader-only.

### Retire vs keep
Obsidian stops using `sweptLoftSkinned` + `skinnedMembraneBridge` (so the Pass-2 cross-hierarchy bind
in `dragonModel.js` goes dormant via its `if (attach.shoulderSkin...)` guard, and `buildShoulderBridge`
is unused for Obsidian). **Keep all of them registered + their tests** (`torsoshoulder.mjs`,
`shoulderbridge.mjs`) — that's the rollback path (revert two strings). Delete the scaffolding only in
a separate cleanup pass *after* the hull is preview-approved.

## Generalization (preserves diversity) + the reusable kernel
Factor the weld into `growSkinnedExtension(loftBoundaryLoop, patchGrid, boneChain, junctionSkin)` →
one merged skinned geometry with a continuous weight field. The wing is the first caller. It reads
only per-dragon data (`profile`: stations/keel/`wingRoot`/`rootChord`; `wingSpec`: `tips`/`lead`/
`scallop`/`arc`), so a different blueprint → a different fluid creature, no code change. New params:
`model.hullBlendSpan`, `model.wingPortYLift`. **Future increments** reuse the same kernel: the **neck**
(retire the sphere chain → a forward continuation of the loft stations skinned to a neck bone chain),
the **tail** (weld the hull's last ring to the `sweptTail` tube's first ring), the **head**. End state:
ONE skinned hull nose-to-tail, the L1/L14 ideal.

## Reuse map (import, don't reinvent)
`sweepProfile`/`skinnedTube` (`dragonSweep.js`) · `buildSweptTorsoGeometry`/`ARROW_PROFILE`/`bladeRing`/
`keelTopFor`/`halfWidthFor` (`dragonTorso.js` — export the last three) · `buildCurvedPatch`/`wingSpecFor`/
`applyWingGradient`/`archLift` (`dragonParts.js`) · `spanSkin`/`writeSpanWeights`/`buildSkinnedRibs` +
bone/rig construction (`dragonWings.js` — export/factor) · `flapWing`/`formStrength` (`dragonWingFlap.js`)
· `seg` (`modelDetail.js`) · `composeSurface`/`membraneSSSPatch`/`fresnelRimPatch` (`dragonSurfaceShader.js`)
· `registerWings`/`registerTorso`/`resolveRecipe` (`dragonRecipe.js`).

## Verification
New `reforged/tests/unifiedhull.mjs` (template off `skinnedwing.mjs` + `torsoshoulder.mjs` +
`curvedpatch.mjs`), wired into `run-all.mjs`:
1. One hull `SkinnedMesh` carrying body+wing on the 7-bone skeleton; `parts.wingRigL.shoulder ===
   skeleton.bones[1]` etc.
2. Weights well-formed (sum=1, indices ≤6, finite); midline/belly carries no shoulder weight.
3. **Rest-parity**: `applyBoneTransform` at rest byte-stable (max Δ < 1e-4); hull rest bbox ==
   today's (torso + bridge + membrane) bbox (silhouette parity).
4. **Seam-coincidence-under-deform (THE regression guard the patches failed):** rotate a shoulder;
   the paired body-edge vert and wing-root vert move to the *same* position (Δ < 1e-5). Contrast with
   the old `skinnedMembraneBridge` where they diverge.
5. No degenerate tris / non-finite normals under motion; junction bend bounded (not a tear).
6. `tricount --detail=high/low/ultra --ci`: Obsidian ≤6000 HIGH (expect net-neutral/favorable — one
   hull replaces a torso + 2 bridges + 2 fairing spheres + 2 membranes); one draw call for body+junction.
7. Coexistence: azure/etc. build no `unifiedHull` mesh, tris unchanged.
8. Rig contract: `flapWing` rotates the elbow + the hull wing region follows; `tipMarker*` present.

**Human preview (headless can't judge motion):** `tools/heroshot.mjs`/`showcaseshot.mjs`/`tiershots`
render Obsidian flapping. Watch a full beat for: no up-beat gap / no down-beat overlap at the root;
the membrane *flows out of* the shoulder (not hinging off it); the body bulges naturally; the
translucent-membrane / opaque-body read is preserved across the junction. **This is the acceptance
gate the patches kept failing.** (Render harness confirmed working this session: `node
tools/heroshot.mjs` → `/tmp/hero-live-1-default.png`; a clipped flap-cycle capture shows the junction.)

## Biggest risks (mitigations)
1. **Topology cleanliness at the weld** (highest): thin/twisted tris where the membrane root chord and
   the loft chord window disagree; T-junctions from different native resolutions. → drive the seam
   z-window from the *same* `rootChord` datum; sample the loft analytically; weld along chord param
   `v` (shared `SEG_V+1` points); reuse the `curvedpatch.mjs` degenerate scan. Fallback: two coincident
   vertex sets with *identical* pos+weights (motion guarantee still holds).
2. **Junction weight continuity** (the bug returning): one `junctionSkin(t)` for BOTH seam sides; gate 4
   tests paired-vertex coincidence directly.
3. **Single-program per-vertex alpha** (fiddliest): the 2-mesh-shared-skeleton fallback ships first if
   needed; keep `mFrac` in geometry so the upgrade is shader-only.
4. **Tri budget**: `tricount --ci`; the merge should net-remove geometry. Watch ULTRA (13000).
5. **7-bone cross-hierarchy bind**: assemble hull + both mounts at a common origin before `bind`, then
   position (the proven order); rest-parity gate catches any offset.

## Critical files
- `reforged/js/dragonUnifiedHull.js` (NEW — `buildUnifiedHull` + the `growSkinnedExtension` kernel)
- `reforged/js/dragonTorso.js` (export `bladeRing`/`keelTopFor`/`halfWidthFor`; `bodyMesh:false` opt +
  `unifiedHullTorso` registration)
- `reforged/js/dragonWings.js` (export/factor `spanSkin`/`writeSpanWeights`/`buildSkinnedRibs` + bone/rig)
- `reforged/js/dragonParts.js` (`buildCurvedPatch`/`wingSpecFor`/`applyWingGradient`/`archLift`)
- `reforged/js/dragons.js` (Obsidian opt-in — the one reversible data switch)
- `reforged/tests/unifiedhull.mjs` (NEW gates) + `tools/tricount.mjs` + `tools/heroshot.mjs`/`tiershots`
