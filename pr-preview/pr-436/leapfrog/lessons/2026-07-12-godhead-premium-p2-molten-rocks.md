# GODHEAD DETONATION — premium P2: rim-lit molten rocks (onBeforeCompile, not a custom shader)

**What we did.** The owner called out the debris specifically ("more detail out of the rocks"). They
were flat dark `MeshStandardMaterial` blobs — the scene sun rakes the boss's back, so the camera-facing
rock faces got near-zero key light → unlit silhouettes. P2 injects, via `onBeforeCompile` on the same
material (`arenaSet.js buildDebris`): (1) an **incandescent FRESNEL RIM** — `pow(1−abs(dot(normal,
viewDir)), 2.2)` tinted hot gold `0xffe2b0` → the blast backlighting the silhouette edge (the reference's
dark-core / hot-edge read, and dark-body-law compliant); (2) **MOLTEN CRACK veins** — thresholded 3D
value noise in object space, gold-rose `0xd98a64`, hotter on the rim; (3) a faint S2-**violet cool rim**
`0x6a5ca8` (rim²). Per-instance `aHeat` (InstancedBufferAttribute) makes the 2 hero chunks run visibly
molten. Still opaque → fairness-positive. +0 draws.

**The headline gotcha — inject emissive at `<opaque_fragment>`, not `<lights_fragment_end>`.** First try
added to `outgoingLight` at `#include <lights_fragment_end>` — but `outgoingLight` isn't DEFINED yet there
(it's assembled on the literal line right before `#include <opaque_fragment>`). The safe injection is
`.replace('#include <opaque_fragment>', '<my code that reads outgoingLight/normal/vViewPosition> \n
#include <opaque_fragment>')` — this runs AFTER `outgoingLight` exists and BEFORE `<opaque_fragment>`
turns it into `gl_FragColor`, with the flat `normal` + `vViewPosition` still in scope. **Know the
r160 chunk order: `normal_fragment_begin` → lights → `outgoingLight = …` (literal) → `opaque_fragment`
(assigns gl_FragColor). Emissive add-ons go just before `opaque_fragment`.**

**onBeforeCompile beats a custom ShaderMaterial here** — it keeps instancing (`USE_INSTANCING` +
`instanceMatrix`, which THREE DOES auto-declare for a ShaderMaterial on an InstancedMesh, but the
onBeforeCompile path also keeps flat-shading's derivative normals + fog + the InstancedBufferAttribute
plumbing for free). A from-scratch shader would have re-implemented all of that and risked the
flatShading-via-derivatives path.

**NaN law honoured.** The rim `pow` base is `max(0.0, …)`-clamped; the 3D hash is `fract`-only.

**Verify.** `unmaskedarena` 55 green — debris layout min|x| 28.7, corridor p90 0.360 / p50 0.125, sky p95
0.822 / p50 0.453 (opaque rocks are still net fairness-neutral/positive; the small gold rims are inside
the palette). No console errors (the injection compiled). Real-GPU owner preview still required.

**What it unlocks.** Rocks now read as lit, cracked, tumbling molten chunks instead of flat cutouts.
Next: P3 embers (fine particulate). Deferred richness: a second InstancedMesh of elongated shards for
true silhouette variety (Fable's P2b) — held so this stays one testable increment.
