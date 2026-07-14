# 2026-07-11 — N10a water swell: a living horizon, and "displace only what the grid can sample"

**Did / learned.** The ocean was a single flat quad — every "wave" was a shading trick on a dead-flat surface, so
the horizon was a straight lifeless line. N10a subdivides the surface (tier0 96×160 ≈ 30k tris, one draw,
vertex-bound) and **physically displaces it in the vertex shader** with a long rolling swell, so the horizon
undulates and heaves like real water. Behind an OCEAN SWELL toggle, default OFF, byte-identical off (the exact
shipped 1×1 quad + `uSwellAmp=0`). Both Fable gates ran; Gate-2 SHIP 8.5/10 with no code-logic changes — a clean
one because Gate-1's six pre-build directives caught the traps *before* code.

**The core lesson (bank this): displace only wavelengths the vertex grid can sample — Nyquist is a hard wall.**
The obvious plan ("evaluate the same `wave()` octaves in the vertex shader") is *wrong*: the water's 3 shading
octaves have wavelengths 3.7–12.6m, but a 96×160 grid over 520×1700 gives cells of 5.4×10.6m — the short octaves
are **at or below grid Nyquist**, so vertex-displacing them produces **temporal crawl** (aliasing that shimmers
with time), not waves. The fix is to displace **only the long swell** (λ≈105m, ~10–19 samples/cell — comfortably
resolved) and leave the short octaves **fragment-only** (they still drive the normals/shading, where per-pixel
sampling has no Nyquist limit). So the surface *moves* on the wavelength the grid can represent and *shimmers* on
the wavelengths it can't — each in the stage that can afford it. **→ Systematize: before displacing geometry from
a noise/wave field, compute samples-per-wavelength for your tessellation; anything under ~4–5/λ belongs in the
fragment (normals), not the vertex (position).**

**The parity trap, and the pattern that kills it.** A displaced surface now has its height computed in THREE
places that must agree exactly or things detach: the **vertex GLSL** (what's drawn), the **JS port** (what the
contact shadow rides), and any collision/gameplay reader. Three hand-written copies **will** drift. The pattern:
**one exported constant** (`export const SWELL = {...}`) that (a) **template-generates the GLSL**
(`` `...sin(dot(p, vec2(${SWELL.dirx}, ${SWELL.dirz})) * ${SWELL.freq} ...)` ``) and (b) drives the JS port
(`waterSurfaceHeight`) — so there is literally one source of the numbers. The test then asserts numeric parity
(<1e-9) **and** greps the source to confirm the GLSL is interpolated from the constant (not a hardcoded copy that
passes today and drifts tomorrow). This is what makes "the shadow rides the exact height the GPU draws" a
guarantee, not a hope.

**The three couplings a displaced water surface touches — all handled, none obvious.** (1) **Reflections
(`vUvProj`):** the reflection projection must sample the **displaced** point or reflections swim vertically
against the swell — `vec4(position.xy, h, 1.0)` (the plane is rotated −π/2, so feeding `h` as local-z maps to the
same world +y as `wp.y += h`; Gate-2 walked the rotation to confirm). (2) **The Reflector mirror itself** stays
**untouched** and keeps mirroring about the flat mean plane — safe because a 0.6m/105m swell is a ~2° slope, and
the ≤1.2m contact-point error is swamped by the shader's existing `N.xz*0.42` projective distortion. **You don't
have to make the reflection physically perfect; you have to make its error smaller than an error already
present.** (3) **The contact shadow** rides the swell via the JS port in *both* its blob and silhouette branches,
returning 0 when off → shipped `y=0.06` exactly.

**Gameplay safety is a budget, and the budget must be a test.** Max crest = `waveAmp·SWELL.amp` = 0.6m at the
biome max waveAmp 1.0; `laneMinY=2.5` is a pure y-constant clamp and **nothing reads the displaced surface for
collision** (the only consumer is the shadow). So the dragon can't clip a wave. A `tests/water.mjs` assertion
(`max displacement < 1.0m at waveAmp=1`) makes that a regression guard, not a comment — the moment someone bumps
`SWELL.amp`, the test fails before a player floats through a crest.

**Also / recorded.** A5 refactor: one `makeWaterGeometry` + `rebuildWater` seam keyed on
`{reflective, swellOn, geomTier}` (N11's tier-parameterized water needs it too) — it carries tint/fog through
`sharedUniforms` and re-attaches the N8 atmosphere uniforms by reference after the clone (the PR-B invariant).
Gate-2 nits folded/deferred: an inaccurate boot-order comment (fixed); a wasted boot-time Reflector alloc when
`?swell` (createWater builds flat, then rebuilds subdivided — cosmetic, one-time); a dead `0.06` in the blob
`_pos.set` (removed); the double-rebuild on a tier0↔1 crossing (rare under fps hysteresis — fold into N11). The
watershot **motion-proxy** frame (+1.5s) is fragile: an input-less auto-run can end during the wait and capture
the menu — the living horizon is a **motion** judgment for the human on the live preview anyway.

**→ Leapfrog.** `waterSurfaceHeight(x,z)` is now the reusable "where is the sea surface here" hook — N10c foam
collars weld props to the moving waterline with it, boss floor-eruptions can spawn relative to it, and any
future skimming VFX (spray, wake) reads it. And the "displace long, shade short" split + the one-constant/
two-domains parity pattern generalize to any future tessellated-and-displaced surface (lava, cloth, terrain).
