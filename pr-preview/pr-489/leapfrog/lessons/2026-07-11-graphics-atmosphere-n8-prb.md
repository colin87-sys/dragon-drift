# 2026-07-11 — N8 atmosphere PR B: the custom shaders join, and the clone-that-detaches trap

**Did / learned.** Extended the N8 atmosphere (a global fog-chunk system) to the frame's biggest fogged
surfaces so it reads vista-wide, not just on props. The **water** — the largest fill surface and a *custom*
ShaderMaterial the fog chunk can't reach — gains **sunward inscatter** (Frozen Reach's low sun now glows a lane
across it); the **ambient** motes/birds/whale and the **setpieces** gateway/mega arches are bound via
`bindAtmosphere`. Same ATMOSPHERE toggle, still byte-identical when off. Two Fable gates bracketed it; Gate-2
shipped it at 8.5/10 with no blocking bug — a contrast worth noting to PR A (which shipped a real bug): PR B was
mostly *mechanical binding of a proven system*, and the one genuinely tricky part (the water) got its risk
surfaced by Gate-1 **before** code, so Gate-2 found nothing new.

**Gate-1 earned its keep again by SHRINKING the scope.** The roadmap said "retire the hand-rolled dual-fog in
sky + water into these shared uniforms." Gate-1 found that literal retirement is a **regression**, not a
cleanup: (1) the water's dual-fog `mix(fogColor, fogFarColor, fogF)` has **no mix gate** — its shipped identity
comes from `fogFarColor` falling back to `fogColor` (equal colors → no-op), and it runs **even when ATMOSPHERE
is off**; swapping it to `uAtmosFarColor` (which is stale/black when the toggle is off, with no gate to
neutralize it) would break the shipped look. (2) The **sky** is already coherent (same `computeEnv` authority as
the N5 probe, same frame), adding inscatter would **double** its existing sun halo, and its fragment is
**JS-ported** in `skyProbe.js` — any change forces a matched port + test, high blast radius, zero payoff. So the
right move was **add inscatter alongside** the existing dual-fog and **leave the sky entirely** — the opposite
of "retire." **The lesson: a roadmap line written months ago is a hypothesis, not a spec. When the pre-build
gate finds the literal instruction would regress the shipped look, the deviation IS the correct execution — but
you must write it into the Gate Log so "unmet scope" doesn't read as laziness later.**

**The trap to bank: `UniformsUtils.clone` detaches shared uniform objects, and here it happens TWICE.** The live
toggle depends on materials sharing the *same* `atmosUniforms` `{value}` objects by reference, so `applyAtmosphere`
mutating `.value` reaches every material. But the water is rebuilt through **two** clones: `buildCheap`/the
`shader` descriptor do `UniformsUtils.clone(sharedUniforms)`, **and** the `Reflector` constructor does a *second*
internal `UniformsUtils.clone(shader.uniforms)`. A deep clone copies `{value}` into fresh objects — so anything
put into `sharedUniforms` or the pre-construction `shader` descriptor arrives at the render material **detached**
(frozen at clone-time values → stale, not live). The fix is to `Object.assign(water.material.uniforms,
atmosUniforms)` on the **constructed** material (post-both-clones), inside `createWater` so it re-runs on every
tier rebuild (`setWaterReflective`), and to **keep the atmos uniforms OUT of `sharedUniforms`** (or the tier-carry
loop `for (k of Object.keys(sharedUniforms))` would copy live values into a dead template). **→ Systematize:
when a material is rebuilt or cloned, "shared by reference" is a lie unless you re-establish the reference AFTER
the last clone. Test it with a reference-equality assertion across the rebuild, not just a value check** —
`tests/atmosphere.mjs` now does `createWater → setWaterReflective(!tier) → assert
water.material.uniforms.uAtmosInscatter === atmosUniforms.uAtmosInscatter`, which a value-copy would pass and a
detached clone would fail.

**Also / small ones.** (1) **Reuse, don't recompute, on the biggest fill surface.** The inscatter needs the
camera→fragment dir; the water already computes `V = normalize(cameraPosition - vWorldPos)`, so the dir is just
`-V` — Gate-2's perf nit saved a `length`+`normalize` per fragment on the frame's largest surface. On a
weak-mobile fill-bound budget that's the kind of free win worth taking. (2) **No new NaN surface:** the water's
new `dot(-V, ...)` reuses a vector the shipped shader already normalized from the same (never-degenerate) points,
so PR B added no NaN risk even though its normalize is unguarded — the guard would be redundant with the
pre-existing `V`. (3) **Homogeneous binds don't trip the cache-key alias trap** PR A's lesson flagged: every PR-B
bind is the *same* `assignAtmos` patch, so identical `onBeforeCompile.toString()` keys are *correct* sharing (same
program, same shared uniforms) — the trap only fires when a bind lands on an *already-patched* material with a
*different* patch. That's exactly why the dragon/boss shaders (which terminally assign their own
`onBeforeCompile`) stay out until PR C gives them a real `customProgramCacheKey`.

**Deviations (recorded).** Sky untouched; water keeps its own dual-fog (inscatter added alongside); dragon/boss +
`particles.js` deferred to PR C — all per Gate-1, logged in the Gate Log.

**→ Leapfrog.** The atmosphere now covers props, obstacles, water, ambient, and setpieces from one authority —
PR C brings in the last holdouts (dragon/boss) behind a real cache key, at which point *everything* in the frame
shares one fog and the toggle is a true global atmosphere switch. And the "re-attach shared uniforms after the
last clone" rule now guards any future effect that wants live uniforms on the Reflector water (wetness,
caustics, a storm tint).
