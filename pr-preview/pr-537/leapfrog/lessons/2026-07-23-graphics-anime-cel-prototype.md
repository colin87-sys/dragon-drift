# 2026-07-23 — graphics: anime / cel-shaded render prototype (`?anime=1`)

**Did / learned.** Built a full anime/cel-shaded style A/B for the whole game behind
`?anime=1` (owner request: judge the art direction from a HIGH-quality prototype, not a
barebones skeleton). One new file (`reforged/js/animeMode.js`) + two one-line seams
(`postfx.js setAnimePrePass`, `main.js` boot calls). Three coordinated systems — any one
alone reads as "a filter"; together they read as an art direction:
1. **Banded cel lighting** — boot-time override of `lights_physical_pars_fragment`
   (the `toneMap.js` chunk-override pattern) quantizing every direct light's `dotNL`
   into 3 bands (shadow/mid/lit ≈ 0.36/0.50/0.85) with a soft terminator, cool shadow
   tint, luma-gated specular damp, a banded rim, and a **distance blend back to smooth
   Lambert** (the anime-film split: cel subject over painterly background).
2. **Ink outlines** — a per-frame normal+depth pre-pass (god-ray-mask discipline:
   overrideMaterial + layer 0 + sky hidden + `setWaterReflectionSuspended`) feeding a
   screen-space edge pass with a two-weight line hierarchy (fat depth-silhouettes that
   thicken near the camera; thin faint normal-creases) and a hard subject-zone distance
   fade (70→220 units).
3. **Anime composer pass** — after OutputPass: ink composite (NormalBlending-style mix
   toward a warm-plum ink, never additive), sky-only soft luma bands with a bright-peak
   protect, dyed-black lift + saturation bias.
Verified with `tools/animeshots.mjs` (labelled SHIPPED/ANIME pairs at pinned course
distances) + a mean-luma A/B gate (target ±5%); iterated ~8 rounds against real
SwiftShader-rendered frames + a harsh Fable critic (3.40 REVISE → deltas applied).

Gotchas that cost rounds (each is a law now):
- **Anything overrideMaterial renders, the mirror re-renders.** The water Reflector's
  `onBeforeRender` fired DURING the pre-pass, so the real frame reflected a black-sky
  normal buffer (a dead dark sea). Same class as the god-ray mask's water suspend —
  ANY extra scene pass must suspend the mirror.
- **Additive/transparent FX must be hidden from an override pass** or every ember mote
  becomes an opaque quad with its own ink square ("confetti").
- **Ink accumulates into a false fog.** Perspective-compressed far geometry turns
  thousands of half-faded lines into a solid dark horizon band. Line-art belongs to the
  subject zone; the background must return to painterly.
- **A banded ramp re-meters the whole exposure.** Flat lit band 1.0 washes sun-facing
  planes; a shadow terminator above the dusk sun's grazing dotNL dumps the entire
  midground into the dark band. Band LEVELS and EDGES are exposure decisions, not style
  decisions — verify with a mean-luma A/B against the shipped frame.
- **A cel ramp deletes what smooth shading was carrying.** The specular sun-path and the
  rim light both died silently; each needed an explicit replacement (luma-gated spec,
  banded rim) — restyle the light, don't subtract it.
- **Headless timed waits are not states.** SwiftShader's low fps means wall-clock waits
  land on different course positions — and a blind-flown dragon eventually crashes, so a
  late timed screenshot captures the DEATH GRADE veil + recap backdrop, which reads
  exactly like "the prototype went dark" (burned a false-alarm bisect round, including a
  git-stash A/B against HEAD). Capture at a pinned `player.dist` with
  `game.state === 'playing'` asserted, and validate machine gates against frames from
  the SAME capture run, never stale ones.

**→ Systematize.** The chunk-override + `?flag` + zero-default coexistence pattern now
has a third instance (toneMap → atmosphere → animeMode): boot-time global restyles are
cheap, byte-identical off, and stack. The pre-pass discipline (save/restore + FX-hide +
mirror suspend) should be extracted into a shared `scenePass()` helper the day a third
consumer appears (god-rays mask, anime normal pass — two today). `animeshots.mjs`'s
distance-pinned alive-asserted capture is the right template for EVERY future in-run
capture tool. All look dials are URL params (`aedge1/ashadow/aink/abands/…`) so owner
iteration is reload-speed.

**→ Leapfrog.** The normal+depth buffer now exists behind a flag — it unlocks cheap
screen-space effects the backlog wants anyway (SSAO-lite, depth-aware outlines for boss
telegraphs, contact-hardening fog). The cel chunk proves per-light banding can coexist
with the whole shipped FX stack, which opens per-BIOME stylization (a biome could dial
its own band levels — "storybook" zones). If the owner greenlights the direction, next
steps in order: per-dragon ink/band tuning on the hero ladder, crisp cloud shapes for
the banded sky, a Settings toggle + tier gating (pre-pass at half-res on tier 1, off on
tier 2), and a Fable Gate-2 pass on the integration PR.

**Verify.** `tools/animeshots.mjs` (pairs + dist-pinned states), mean-luma A/B ±5%,
`tricount --detail=high --max=6000 --ci` (0 over), `tests/smoke.mjs` green, no-flag path
byte-identical (chunk override + pass insertion + pre-pass all gated on `?anime=1`).
