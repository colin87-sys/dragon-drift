# 2026-07-11 — N4 ParticleBatch: 150 spark draws → 1, and the tier2 tone-map trap

**Did / learned.** Built the instanced spark-particle backend (`?pfx=batch`, default OFF): the 320 celebration
Sprites are kept as pure STATE and one `InstancedBufferGeometry` reads their transforms each frame, so every
`spawn`/`acquire`/`updateParticles` math path is reused verbatim (parity by construction) and the ≤150 per-spark
draws collapse to one. Verified against the vendored r160 `ShaderLib.sprite`: the billboard math (center 0.5,
view-space offset + project = size-attenuation, screen-space rotation sign) matches exactly, and the glow texture
is white-RGB + gradient-alpha so colorspace is a no-op. Draw calls 241→188 at tier2, ~149 saved at tier0's full
cap. Zero console errors; the sprite default path is byte-identical when the flag is off.

**The bug the Gate-2 review caught (bank this).** My first `BATCH_FRAG` set `gl_FragColor` and stopped —
claiming "matches SpriteMaterial." **False at tier2.** The vendored sprite fragment ends with
`#include <tonemapping_fragment>` + `#include <colorspace_fragment>`, and r160 **gates those on the render
target**: `toneMapping = (currentRenderTarget === null) ? renderer.toneMapping : NoToneMapping` (same for
outputColorSpace). So at **tier0/1** (sprites + batch render into the linear HDR RT) the chunks are no-ops → my
batch matched → the tier0 montage looked identical, *which is exactly why the gap hid*. At **tier2**
(`postfx.enabled=false` → `renderer.render` DIRECT to screen) SpriteMaterial applies ACES(0.92)+sRGB in-shader
before blending; my raw batch shader applied neither → batch sparks read ~25-35% dimmer / harder-edged. And
tier2 is the weak-device tier the draw-call win *exists for*, and my test ran at tier2 but only counted draws —
the verification matrix was shaped so it couldn't see the look bug. Fix: append the two chunk includes; three
injects the `toneMapping()`/`linearToOutputTexel()` functions + defines into a (non-raw) ShaderMaterial and
auto-gates them per render target, so tier0/1 stay no-op-identical and tier2 snaps to parity.

**→ Systematize.** TWO reusable rules. (1) **A custom ShaderMaterial that stands in for a built-in material must
replicate the built-in's FULL output tail** — `tonemapping_fragment` + `colorspace_fragment` (+ `fog_fragment` if
`fog:true`) — not just its color math. "Looks identical in my one screenshot" is not parity; the r160 output
chunks are render-target-gated, so a composed-path (RT) capture is BLIND to the direct-to-screen (tier2)
divergence. (2) **Match the verification tier to the risk tier:** an optimization aimed at weak devices (tier2)
must be *look*-verified at tier2, not only at tier0. `pfxshot.mjs` now shoots both tiers for exactly this reason.
Corollary banked from Phase 0's OutputPass bug: **overriding/adding a shader chunk is necessary but not
sufficient — you must confirm the pass/material actually invokes it on every render path.**

**Deviations (documented).** No scene fog on the batch (SpriteMaterial has `fog:true`): celebration bursts are
near-field (fogFactor≈0 within the 85u near-plane), only far bursts (boss death at distance) differ; left out
because ShaderMaterial fog-uniform refresh over the per-frame biome fog lerp is fiddly — add it if/when the
default flips. Also deferred: batching the 8 shockwave sprites (≤8 draws, negligible) and the procedural-glow
texture drop.

**→ Leapfrog.** The instanced billboard + per-instance-attribute + write-from-state pattern generalizes to any
sprite swarm (N13 weather fields reuse this exact shader for velocity-stretched snow/rain). And the "replicate
the full output tail + verify per render path" rule now guards every future custom material (N7 surface patches,
N8 atmosphere, N9 sky) against the same class of silent tier2 divergence.
