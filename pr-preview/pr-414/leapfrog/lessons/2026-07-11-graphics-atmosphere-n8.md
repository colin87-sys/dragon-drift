# 2026-07-11 — N8 atmosphere: the fog chunk as a global authority, and the row-vs-column transpose bug

**Did / learned.** Turned fog from "linear toward one color" into a small aerial-perspective **system**: a
one-time override of the four fog `ShaderChunk`s (`fog_pars_vertex` / `fog_vertex` / `fog_pars_fragment` /
`fog_fragment`) so **every** fogged material shares one atmosphere — height fog (denser near the water), sunward
inscatter (brighter looking toward the sun), dual near→far color. All behind zero-default uniforms: at 0 the
overridden `fog_fragment` is byte-identical to stock `mix(gl_FragColor.rgb, fogColor, smoothstep(...))`, so the
shipped look is exact and the effect is a live Settings toggle (ATMOSPHERE, default OFF). Props + the solid
obstacle bodies (rock gates — the big geometry you fly through) are bound into it; biome `atmos:{heightK,
inscatter}` channels drive it (Emberfall height fog, Frozen Reach inscatter). Two Fable gates bracketed it.

**Gate-1 (pre-build) earned its keep — three compile hazards caught before a line was written.** The spec's
GLSL referenced `vViewPosition` (duplicate-**declared** on lit materials, **absent** on sprites/points/basic →
compile error either way) and derived world position from `transformed`/`instanceMatrix` (the sprite vertex
shader has **no** `transformed` → breaks every fogged Sprite, of which the game has dozens). Fix: introduce
**own** namespaced varyings (`vAtmosWorldY`, `vAtmosWorldDir`) declared in both stages of the chunk, and
reconstruct world position from `mvPosition` alone (which every material — sprites included — has in scope at
`<fog_vertex>`). Plus: a **world-space** sun dir (constant `SUN_DIR`), not view-space, so inscatter is correct
in the water Reflector's mirrored camera. **The lesson: a global chunk override must compile against the FULL
material population, not the one material you're picturing — enumerate basic/sprite/points/line/lit and check
every varying it reads is declared for each.**

**Gate-2 (pre-merge) caught a real math bug I shipped and Gate-1 missed — bank this one.** To inverse-rotate the
view-space fragment vector into world space I wrote it "without `transpose()` for WebGL1" as three row-dots:
`vec3(dot(vec3(V[0].x,V[1].x,V[2].x), mv), …)`. That is **`mat3(viewMatrix) * mv`** (the FORWARD rotation), not
the intended **`transpose(mat3(viewMatrix)) * mv`**. `V[c].x` is element (row 0, col c), so stacking `V[0].x,
V[1].x, V[2].x` builds **row 0** and dotting it gives `(M·mv).x`. The inverse needs **columns**: `dot(V[i].xyz,
mv)`. It passed every test and looked fine in the montage **because the chase camera is near axis-aligned and
pure yaw preserves Y** — but under pitch/roll it swings the height-fog altitude and the inscatter lobe by ~2×
the camera rotation, in the wrong sense, and is badly wrong in the mirrored Reflector camera (defeating the very
world-space-sun fix it was paired with). Numerically verified against a `Matrix4` ground truth: for cam rot
(0.35,0.7,0.22) and fragment (10,4,−50), the code gave worldRel ≈ (37,−17,−31) where truth is (−25,18,−41). Fix
is a strict simplification to three's own idiom: **`vec3 _atmRel = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;`**
(`inverseTransformDirection` — a row-vector×matrix product **is** `transpose(M)·v`, WebGL1-safe, fewer ops).

**→ Systematize. Test the VERTEX stage, not just the fragment.** My original `tests/atmosphere.mjs` proved the
fragment identity to the bit and still shipped a broken vertex reconstruction — because there was **no** JS-port
test of the vertex math. The bug lived exactly in the stage with no ground-truth check. The fix added one: build
a **rotated + rolled** camera's `viewMatrix` with three's `Matrix4`, port the exact GLSL (`vec4(mv,0)*viewMatrix`
= column-dots), assert it matches `extractRotation().transpose()·mv`, **and** assert the buggy row-dot form is
measurably wrong (so the test discriminates fix from bug). Same failure family as N5's constant-sky and N6's
pitched-sprite: **the bug hides in the configuration the one obvious check doesn't exercise — here, any camera
that isn't axis-aligned.** For a matrix-reconstruction shader, "axis-aligned looks right" is not verification;
rotate the camera in the test.

**Also banked.** (1) **Coherence gap, made explicit:** binding props + obstacles but leaving other fogged
families (ambient motes, creatures, bosses) unbound means that with the toggle ON, in Emberfall (`fogFarMix=1`,
near-black far color) a bound rock gate sinks dark while an unbound mote at the same depth holds ember-red. It's
byte-identical when OFF, so it's a documented PR-B scope item, not a regression — but "some materials joined the
system, some didn't" is a coherence debt you must **write down**, or the next session reads the half-bound state
as intentional. (2) **`chainBeforeCompile` cache-key trap (latent):** it returns an identical closure *source*
for any `(prev, fn)` pair, so three's default `customProgramCacheKey = onBeforeCompile.toString()` is identical
for two materials chained with **different** patches → they could alias one GL program and leak each other's
uniforms. Harmless while every bound material shares the *same* patch (assignAtmos); **PR B must give a real
`customProgramCacheKey` before it chains the dragon/boss shaders (heterogeneous patches).**

**Deviations (recorded).** Sky + water keep their hand-rolled dual-fog for now (custom ShaderMaterials the chunk
can't reach — PR B, and the water path has a `UniformsUtils.clone` that detaches shared uniform objects on every
tier rebuild). The extra varying pair + ~10 fragment ALU is paid on all fogged materials **even when OFF** (the
price of a recompile-free live toggle) — a perf-watch line, not a regression.

**→ Leapfrog.** The fog chunk is now the **one authority** all opaque fog flows through — PR B retires sky/water
into it and binds the remaining families, and the `vAtmosWorldY`/`vAtmosWorldDir` varyings are a free
world-space hook any future surface effect (wetness by altitude, biome ground-tint, boss aura falloff) can read
without recomputing. And `(vec4(v,0)*matrix).xyz` is the reusable inverse-rotate-direction idiom for every
"world-space thing from a view-space varying" going forward.
