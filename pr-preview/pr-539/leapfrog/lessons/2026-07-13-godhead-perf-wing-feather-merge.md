# GODHEAD perf V — merge the seraph's wing feathers (104 → 24 draws), the throughput win

**What we did.** PR IV latched the tier so the background stopped changing, but the 17 Pro Max still
sat at ~50fps because the scene is genuinely **draw-call bound** — and Fable's census found the single
biggest offender: **the seraph's 8 wings are 104 separate draws** (13 static meshes/wing × 8), and each
one is re-submitted in EVERY full-scene aux pass (the water mirror + the god-ray occlusion mask), so
104 draws cost 2-3× on the heavy frames. This PR collapses them to **24** (3 material buckets/wing).

**The merge (in `angelWing.js`, opt-in):**
- New `collapseWingByMaterial(group)`: after the wing is built, `updateMatrixWorld(true)` (the group is
  at identity during build → each mesh's `matrixWorld` IS its group-local transform), clone each mesh's
  geometry and `applyMatrix4(matrixWorld)` to **bake** the transform (position AND normal) into it,
  bucket by `material` reference, and `mergeGeometries` per bucket → one mesh per material. With the
  seraph's supplied `material`/`rimMaterial`/`rimMaterialB` that's exactly **3 meshes/wing**. Wrapped in
  try/catch → any merge failure leaves the wing unmerged (correctness over the win).
- Gated by a new `merge` option (default **false**) so the winglab hero / design path is byte-identical;
  the seraph passes `merge: WING_MERGE`. `?wingedit` forces it OFF (every feather a separate object) for
  design iteration.

**Why it's safe — the three invariants that let static geometry merge (verified before touching it):**
1. **No per-feather animation.** Only the wing *group* breathes/unfurls as a unit (`bossUnmasked.js`
   `shoulders` pivots); feather transforms are baked at build. Merging children doesn't change how the
   group transforms.
2. **Dissolve rides the SHARED material** (`bossKit.setDissolve` iterates tracked *materials*, not
   meshes), and the merged meshes keep those exact materials → dissolve still fades them.
3. **The eyes are a separate material family** (emissive sclera/iris/pupil), never in the feather
   buckets → merging feathers leaves eye placement 100% untouched (the owner's explicit concern —
   tweaking eye positions is unaffected, and `?wingedit` restores per-feather objects for iterating).

**The headline lesson — the win from instancing/merging is MULTIPLIED by how many passes redraw the
object.** 104 wing draws looked like "just the boss model," but the mirror and the god-ray mask each
re-render layer 0, so those 104 draws were really ~300/frame on the heavy parity. When ranking
draw-call cuts, weight each candidate by `draws × passes-that-redraw-it` — the scene-doubling passes
promote the boss's static geometry to the top of the list, above things that only draw once.

**Corollary — merge STATIC sub-geometry by material, but prove the three invariants first.** A group is
mergeable when (a) its parts don't animate independently, (b) any per-part effect (dissolve/flash) is
driven through the shared material or a uniform, not per-mesh, and (c) parts you still need addressable
(here the eyes) live in a different bucket you don't merge. Bake `matrixWorld` into cloned geometry
(transforms normals correctly), keep the tracked materials, gate behind a flag so the editable path
stays byte-identical.

**Verify.** Headless census (merged vs `?wingedit`): **80 fewer scene meshes** (429→349 — the 8 wings
collapse 104→24) with **triangles byte-identical** (45110 both) → same pixels, ~80 fewer draws in the
main pass AND ~80 fewer in the god-ray mask. `unmaskedarena` 57/57 (wing-clearance + wing-root checks
still resolve — the merge preserves geometry + world positions), `bossboot` + `smoke` clean, a settled-
heaven still shows the wings + eyes unchanged. The fps lift is a real-GPU / owner-motion judgment (the
merged wing must still breathe/unfurl/dissolve identically — that's the owner's preview call).

**Reusable.** To cut draw calls on an animated hero model: find the STATIC sub-geometry (parts that
only move with a parent), merge it per material behind an edit-mode flag, and prioritise the parts that
get redrawn by extra full-scene passes (mirror/shadow/occlusion) — the multiplier is where the frames
are. Never merge parts you animate or address individually; keep those (and separate-material accents
like eyes) out of the buckets.
