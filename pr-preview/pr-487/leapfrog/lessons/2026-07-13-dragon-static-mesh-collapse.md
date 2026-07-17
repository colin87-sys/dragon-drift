# Dragon perf — generic static-mesh collapse (Phoenix Reforged 814 → 279 draws)

**What we did.** After the final-boss perf arc, the owner found the game held ~60 with the **Solar**
dragon but dropped with **Azure** (~50) and **Phoenix Reforged** (~40). A headless census settled it:
Phoenix Reforged is **814 draws** vs Solar's 254 — **+560** — because the "Sunhawk" is a heavy
individually-meshed feather model, and every dragon draw is re-submitted in the water mirror AND the
god-ray occlusion mask (both full-scene layer-0 passes), so each draw costs 2–3×. (Azure, by contrast,
is only +16 draws — a per-pixel/shader story, handled separately.)

**The generalisation of the wing merge.** `angelWing.collapseWingByMaterial` merged the boss's static
wing feathers per material. The dragon is the same idea at model scale, but a mixed procedural model
needs four things the single-purpose wing merge didn't (new `dragonCollapse.js`, `collapseStaticSiblings(root)`):
1. **Never `clear()` the group.** Dragon groups also hold FX emitters, tip markers, the motif anchor,
   the core-glow sprite, and the animated pivots/bones — remove ONLY the merged meshes, leave every
   Object3D/Sprite/pivot in place.
2. **Don't cross an ANIMATION BOUNDARY.** The traversal skips any `isBone` node or one flagged
   `userData.animBoundary` (the wing blade pivots, the tail chain joints). Their contents animate and
   keep their own transform; the caller collapses each such sub-root separately.
3. **Normalise attributes before bucketing.** The model mixes bare `position+normal` `flatTriMesh`
   geometry with uv+indexed spikes/eyes — without `toNonIndexed()` + `deleteAttribute('uv')`,
   `mergeGeometries` returns null the instant two shapes disagree and the whole bucket is forfeited to
   the try/catch. (This is the subtle trap: the merge "works" but silently saves nothing.)
4. **Exclude the un-mergeable.** Skip meshes that are transparent-without-depth (additive), on a
   non-default layer, renderOrdered, skinned/instanced, or carrying a `name`/`userData` (referenced
   elsewhere). Bake each geometry **relative to root** (`inverse(root.matrixWorld)·mesh.matrixWorld`)
   so the merged mesh rides root's live transform.

**Which roots.** Per-def opt-in (`def.parts.collapseStatic: true` on `phoenixReforged` only → the rest
of the roster is byte-identical). At the end of `buildDragonModel`, collapse each rest-static root
separately: the **torso** (fully rigid — the neck doesn't bend, only the head group rotates), the
**head** (rotates as a unit), each **tail chain joint** (`isBone` — merge within a joint, never across),
each **wing static frame** (`oneWing` — the blade pivots inside are marked `animBoundary`), and each
**blade pivot's interior** (the pivot still rotates; its 5–6 rigid segment meshes collapse to ≤3). One
`?dragonedit` escape keeps everything unmerged for design iteration.

**Result — 814 → 279 draws** (torso/head/tail+wings did 814→294; blade interiors 294→279), **+26 over
Solar**, **triangles byte-identical** (the merge bakes vertices, changes nothing). ~535 draws saved,
each paying 2–3× across the mirror + mask.

**The headline lesson — a model-scale merge is a per-material collapse GATED BY THE ANIMATION GRAPH.**
The wing merge worked because the whole wing was rigid; a full dragon is a mix. The rule that makes it
safe and general: **treat every animated node (bone / pivot) as a boundary, collapse each rigid subtree
between boundaries independently, and merge only same-material siblings within one boundary.** Then the
animation is untouched by construction (the same pivots still write the same rotations; only their
static contents fused), dissolve/surge/flash survive (they drive the shared material INSTANCES, which
the merged meshes keep), and the world-space geometry asserts (`starters.mjs` bakes `matrixWorld`) are
invariant because tris and positions are exactly preserved.

**Corollary — normalise geometry attributes or the merge silently no-ops.** A mixed procedural model
has uv+indexed and bare non-indexed geometry in the same material bucket; `mergeGeometries` fails the
whole bucket on the first mismatch, and a try/catch fallback hides it as "0 saved." Always
`toNonIndexed()` + strip unused `uv`/`color` before bucketing.

**Verify.** Headless census 814→279 (tris exact). `starters` 286/0 (world-space geometry invariant),
`flapcheck`, `surgefx`, `blueprint`, `defs`, `modeldetail`, `smoke`, `bossboot` all green, plus a
surge-active Phoenix-Reforged run with 0 console errors (the flare/ignite material path works on the
merged meshes). The flap-ripple / tail-whip / dissolve MOTION is the owner's real-GPU preview call;
`?dragonedit` restores per-feather objects for tweaking. **Deferred:** the skinned-collapse (blade
pivots → one SkinnedMesh, further ~26 draws) — not worth the SkinnedMesh/bind-matrix risk now that the
static collapse alone reached Solar's level.

**Reusable.** `collapseStaticSiblings(root)` is a general tool: to cut draw calls on any animated hero
model, mark the animated nodes as boundaries, then collapse each rigid subtree's same-material meshes —
normalising attributes, excluding layered/named/additive meshes, and never clearing the group so FX
survive.
