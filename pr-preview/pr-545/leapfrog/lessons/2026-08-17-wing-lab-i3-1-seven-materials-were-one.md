# 2026-08-17 — Seven materials that differed only in colour and roughness (wing-lab I3.1)

**Did / learned.** The Forgewing was spending **32 draw calls per wing pair** against an I4
freeze of ≤20, and the cause was not the fire overlays (already 2 buckets a wing) — it was the
opaque skeleton. Seven materials (char pipe, ash dust, horn claw, covert lap, vermilion band,
body fairing, §7.4 temper) were flushed per rig group, so every group paid for every material
it touched. Comparing them property by property, they differed in exactly **two** things:
colour and roughness. Colour is free per-vertex. Roughness becomes free the moment one varying
carries it — a two-instruction patch (`roughnessFactor = vCrust`) at the seam this repo's
`composeSurface` already provides.

The third property, `envMapIntensity`, differed too and turned out to be **a no-op on this
entire project**: there is no `scene.environment` and no `envMap` on any material, so three.js
never reads it. Four rounds of art direction had been arguing about a number the renderer
discards. Worth checking before you defend a value.

The authoring code did not change: it still says `M.ash` and `M.bone`, because §7.3's ash
territory is a decision about *triangles*, not about draw calls. Only `flush` changed — the
registered materials now feed one vertex-coloured `forge:crust` bucket per group. Result: pair
**32 → 16 draws**, whole form 101 → 83, **triangles identical** (3,156 / 5,477), and the pixel
effect measured by rendering the same five-tile sheet with and without the merge: 1-px
antialias seams along shared edges, nothing else — merging adjacent meshes actually *removes*
a hairline AA seam.

One consequence worth flagging: the merge is only pixel-neutral because every one of those
materials already shared `metalness 0`, `flatShading`, `DoubleSide`, no emissive and no
transparency. **Check the whole property vector before merging, not the two you remember.**

**→ Systematize.** *Semantic materials, one bucket.* Keep the authoring vocabulary (a builder
should write `M.ash` when it means ash) and collapse at flush time via a registry that maps
each semantic material to its `{colour, roughness}` pair. The pattern is a drop-in for any
procedural model in this repo that flushes per-(group, material) accumulators — which is all of
them. The prerequisite is a per-vertex roughness varying, which is now written and costs two
instructions.

Second: **verify a "neutral" refactor by rendering it both ways.** A switch that disables the
merge, two captures, one diff — the claim "no pixels changed" becomes a number instead of a
promise, and it caught that the only differences were sub-pixel edges rather than a value shift.

**→ Leapfrog.** The forgewing now enters I4 at 16 draws against a ≤20 freeze, with the headroom
spent on rig and pose rather than on fighting the budget. More usefully, the same collapse is
sitting unclaimed on the shipped roster: every hero built on the per-(group, material)
accumulator idiom is paying the same tax, and the dragon is drawn again in the water mirror and
the god-ray mask — so each draw saved pays two to three times.
