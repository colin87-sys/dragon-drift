# God-rays: stop softening a binary mask — CARVE the light field with the cloud deck (negative of the clouds)

**Context:** After three god-ray rounds (premium bundles → mask-blur → device-calibrated erode+flatten) the
owner, on device, STILL read the Tempest shafts as "too thick and solid… countable bands." He named the fix
himself: *"do what Ember boss's face did — negative edge / negative space. Stage-3 boss 14's cross was too
solid so we blended it as the negative of the swirling explosion. Why don't you do the negative of the
clouds?"* He was exactly right, and it's the **emergent-cross law** again (Godhead): an emergent feature must
be gated by the SAME field as the substance it emerges from, or it reads as a decal laid over the scene.

The three prior rounds were all attacking the SYMPTOM (soft the edges, flatten the sine bundle). The real
problem was TOPOLOGY: the shaft structure came from an artificial `0.86 + 0.14·sin(ang·5.3 + …)` bundle
function — straight-ish lobes through the sun point that no amount of blur stops reading as "vector graphic."

## The fix — carve the MASK, not the march (Fable's Option A)

The occlusion-masked god-ray march streams "light reached" from wherever the mask is bright. Today the mask
background is a flat white field (sky = 1). **Instead, paint the mask background as the cloud NEGATIVE —
`gap = 1 − uCarve·cloudCoverage(viewDir)`** — before the black occluders draw on top. The existing radial
march then does everything for free: shafts pour through cloud GAPS and die under cloud BODIES. The deck IS
the modulation, so the shafts are curved, organic, and uncountable — and they move with the clouds because
they ARE the clouds' shadow. Killed the artificial `sin` bundle entirely (Tempest `godrayBreak 0.32 → 0`).

### The three edits (all byte-identical off Tempest)
1. **skyClouds.js** — factor the cCov math into a shared `_cloudCov(vec3 d, float h, float time)` in
   `CLOUD_HEAD`, VERBATIM from `CLOUD_BODY`. The sky does NOT call it (CLOUD_BODY stays inline, untouched) →
   the sky render is byte-identical; the function is dead-code-eliminated everywhere it's unused. Added a
   shared `uCloudTime` uniform (mirrored in `applySkyClouds`) so the carve drifts in lockstep with the deck.
2. **godrays.js** — a `gapMat` fullscreen quad whose fragment `= CLOUD_HEAD + main()`, reconstructing the
   world view dir from a camera basis (`uCamRight/uCamUp/uCamFwd`, pre-folding `tan(fov/2)·aspect`) and
   emitting `1 − uCarve·_cloudCov`. Shares the cloud uniform OBJECTS by reference. In `renderGodRayMask`,
   a **two-render** path when `uCloudAmount > 0`: (a) draw the gap-field via the ortho quad, (b) draw the
   scene occluders black ON TOP with `autoClearColor = false` (depth still auto-clears so occluders self-sort).
   Every other biome keeps the single white-background render → byte-identical. Escape hatch `?carve=0`.
3. **biomes.js** — Tempest `godrayBreak → 0` (the deck is the modulation now), `godrayMul 0.19 → 0.22` (the
   carve breaks the shafts up, so a hair more base keeps the crepuscular pour readable).

## The gotchas
- **A backtick inside a template-literal comment terminates the string.** My `_cloudCov` doc-comment wrote
  `` `time` is a param `` INSIDE the `CLOUD_HEAD` GLSL template — the backticks closed the literal and the boot
  died with `SyntaxError: Unexpected identifier 'time'`. Never put backticks in a comment that lives inside a
  template literal (GLSL blocks are template literals). Boot-check every shader edit.
- **The camera-ray reconstruction must match the sky dome's own view dir.** The dome is camera-locked with
  identity rotation and shades on `normalize(position)` (object == world dir), so the standard
  `normalize(uCamFwd + ndc.x·uCamRight + ndc.y·uCamUp)` registers pixel-for-pixel. If the dome were rotated
  this would drift out of register with the visible clouds.
- **Verify the deployed ARTIFACT, judge at DEVICE exposure.** Same gate as the prior round: the A/B (carve
  ON vs `?carve=0`) is only honest on a 0.5×-darkened copy. At that exposure carve-OFF = straight radial
  spokes; carve-ON = broad cloud-shaped sweeps, zero countable wedges.

## Follow-up: the carve gives STRUCTURE, but you still owe it EDGE softness

First carve shipped and the owner (device): *"still quite sharp and well defined."* The carve fixed the
TOPOLOGY (cloud-shaped bands, not straight spokes) but the band EDGES were still crisp — the gap-field
inherited the deck's own `smoothstep(0.40, 0.72, n)` cloud-core ramp, which is deliberately crisp for
RENDERING clouds but wrong for a LIGHT field. A hard cloud edge → a hard shaft edge (the 16px mask blur
barely touches a band that's hundreds of px wide). Three light-field-only softeners (sky untouched):
- **A wider shape ramp for the gap field than for the sky.** `_cloudCov` took `lo/hi` params; the gap-field
  passes `(0.30, 0.86)` where the sky keeps `(0.40, 0.72)`. Same registration (noise/drift/band identical),
  feathered light edges. The sky doesn't call `_cloudCov`, so this costs the sky nothing.
- **A 5-tap screen-space feather in the gap quad** (`uSoft` ~0.055 ndc) — spreads each cloud edge into a
  penumbra directly, which an n-space threshold widening alone can't do where the noise gradient is steep.
- **Gentler carve depth** (`uCarve 0.85 → 0.72`) — lower band-to-gap contrast reads softer.
Lesson: **the mask-blur chain is tuned for thin GEOMETRY occluders (~16px); it is nowhere near enough to
feather a broad cloud band.** Soften the cloud contribution AT THE PAINT STEP (wide ramp + multi-tap),
never by widening the shared blur (that leaks shafts through thin geometry like wingtips/ring-rims).

## Reusable
- **When "soften it" fails three times, the problem is TOPOLOGY, not edges.** A soft edge on a straight lobe
  still reads as a line. Give the emergent feature REAL structure by gating it on the substance it emerges
  from (clouds → shafts, molten FBM → cross, explosion → boss face). This is the emergent-cross law, third
  application. The negative-space trick generalizes: carve the CHEAP thing (a mask, a background) with the
  field you already have, and let the existing pass turn it into the expensive-looking thing.
- Cost: one extra ortho-quad draw inside the existing 1/3-frame mask duty-cycle — effectively free; the
  march, erode, and tent chain are unchanged.
