# 2026-07-11 — N15 prop AO: baked vertex occlusion, and the missing-attribute→black trap

**Did / learned.** Grounded the floating course props (pillars/ruins/arches) with **boot-baked per-vertex
ambient occlusion** — zero per-frame cost, no pass, no CPU sim. `propAO.js bakeAO(geo)` walks the merged prop
geometry and writes an `aoBake` attribute: `w = min(0.7·base² + 0.55·under, 1)`, `ao = 1 - w·0.6`, where
`base = 1 - clamp(y/maxY,0,1)` (concentrates darkening at the ground, height² so it falls off fast) and
`under = clamp(-normal.y,0,1)` (undersides/eaves/bellies — flat-shaded low-poly props face-split those verts, so
the break is crisp, not smeared). The prop surface shader multiplies `diffuseColor.rgb *= mix(1.0, vAO, uAO)`,
a **shared `uAO` uniform** (0 = shipped) gating it live — Settings "PROP SHADING", default OFF. Compounds with
the N5 sky probe (occlusion where the sky ambient can't reach). Gate-2: **SHIP 8/10, no blocking bug.**

**The trap to bank (a GLSL footgun, caught by looking for it — not by a failure).** A per-vertex `attribute`
that the shader reads but the geometry doesn't provide **reads as 0 in GLSL, silently**. Here `vAO=0` at
`uAO=1` ⇒ `diffuseColor *= 0` ⇒ the prop renders **pure black** — no error, no warning, just a black slab. So
the correctness question for any baked-attribute feature isn't "does it look right" but **"is the attribute
present on _every_ geometry these materials ever bind?"** For N15 the answer is yes-and-provably: `propMats` is
module-local to `environment.js`, applied only to the 12 materials `mergeParts` uses, and all 15 archetype
`build()`s route through `mergeParts` which calls `bakeAO` **after** the final `mergeGeometries` (so the attr
lands on the exact merged vertex set) — the override-material mask paths (god-rays, N6 shadow) bypass material
shaders entirely, so they can't hit it either. The risk is a **future** prop path that reuses `propMats` but
skips `mergeParts`. Insurance: a one-line dev guard in `makeBand` (`if (!geometry.getAttribute('aoBake'))
console.warn(...)`) that turns the silent-black into a visible warning the moment someone adds such a path.

**Also / the gate found a pre-existing red, not mine.** `graphicsfoundation.mjs` sat at 22/23 on the branch:
its `?tm=` assertion still matched `urlParams.has('tm')`, but #376's Settings work had (correctly) moved the
read to `urlParams.get('tm') || gfxPref.toneMap` — you need the *mode value*, not mere presence. A feature PR
inherited a red foundation gate it didn't cause. **Rule: a red gate on the integration branch gets diagnosed
and fixed (as its own commit) the moment you notice it — never normalized as "not mine, skip it,"** or it masks
the next real regression. One-line fix, separate commit.

**Technique deviation (recorded).** The doc sketched N15 as a `color` BufferAttribute + `vertexColors:true`.
Shipped instead as a custom `aoBake` attribute + gated shader multiply. Strictly better: (1) a **live** uniform
toggle with byte-identical off (`vertexColors` would bake the darkening into the material state, no free gate);
(2) keeps AO off the `instanceColor` channel the props already use for per-biome tint (they'd multiply and
fight). Same identity guarantee, better ergonomics — the kind of deviation the gate is meant to wave through
*with a recorded reason*, not the kind it blocks.

**→ Systematize.** **Baked > per-frame when the data is static.** Prop geometry never changes at runtime, so
its occlusion is a build-time constant — pay it once at boot, not every frame. This is the same "compute the
invariant once" move as N5's SH projection, and it's why N15 needs **no `applyQuality` tier entry**: there's no
per-frame cost to degrade. The reusable pattern for any "cheap grounding/shading of static procedural geometry"
is: bake a scalar into a vertex attribute at merge time → gate it with a shared uniform → toggle in Settings →
prove identity-when-off in a pure-math test (no WebGL needed). And the black-attribute trap generalizes:
**every geometry-attribute a shader samples must be guaranteed present on every draw, or defend the gap with a
guard** — a missing attribute doesn't crash, it multiplies your surface by zero.

**→ Leapfrog.** The same `bakeAO` primitive extends to any static procedural mesh that reads as "floating":
biome ground clutter, boss-arena set-dressing, shop pedestals. And it's the cheap first rung under the props
the owner flagged as "basic and badly done" — grounding buys time until they get real silhouette/geometry work
(N16 prop-art pass). Next taste call before any default-ON flip: the Lumen Mire **night** montage (glowcap
stems), where baked occlusion reads strongest against emissive fill — the montage should be frame-locked first
(the current `aoshot` A/B froze at slightly different sim moments).
