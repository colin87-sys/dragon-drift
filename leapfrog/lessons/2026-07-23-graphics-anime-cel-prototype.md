# 2026-07-23 — graphics: anime / cel-shaded render prototype (`?anime=1`)

**Did / learned.** Built a full anime/cel-shaded style A/B for the whole game behind
`?anime=1` (owner request: judge the art direction from a HIGH-quality prototype, not a
barebones skeleton). One new file (`reforged/js/animeMode.js`) + one-line seams in
`main.js` (boot) and `dragon.js` (hull).

**THE BIG LESSON — v1 (ink-everywhere) was rejected by the owner on the live preview
("1000% not what I had in mind"), after ~8 critique rounds had polished it on stills.**
Two distinct failures:
- **Screen-space edge ink is a still-frame illusion.** 1-texel screen-space edges are
  temporally unstable: they shimmer/crawl in motion against the MSAA'd frame, and on a
  procedural low-poly world they hatch a close-up hero into pencil scratch. Headless
  stills and a critic reading stills CANNOT catch a motion defect — the owner-on-preview
  judge is not optional (the repo already knew this; relearned it expensively).
- **The premium anime-game lineage is the OPPOSITE recipe.** Genshin/BotW/Sky worlds
  carry style in COLOR + LIGHT, with essentially no environment line-art, and are MORE
  luminous than realism. v1 subtracted luminosity and added lines — a style tax, not a
  style.
**v2 = clean cel:** banded cel lighting (bright bands — shadow 0.45 as a saturated cool
HUE statement, luma-gated spec, banded rim, painterly-far blend), an **inverted-hull
contour on the dragon only** (backface shell inflated along pre-skin normals, geometry
shared, skeleton-bound on skinned parts, per-part width cap so struts don't blob —
thick, geometry-stable, cannot shimmer), and a small vibrancy pass (saturation + dyed
blacks; sky/water untouched and luminous). The whole v1 normal+depth pre-pass and edge
shader were DELETED, not tuned — when the approach is wrong, change technique, not
parameters (the one-revise-round law applied at prototype scale).

Gotchas that cost rounds during v1 (each is a law now, kept even though the pre-pass is
deleted — the next extra-scene-pass consumer will hit them):
- **Anything overrideMaterial renders, the mirror re-renders.** The water Reflector's
  `onBeforeRender` fired DURING the pre-pass, so the real frame reflected a black-sky
  normal buffer (a dead dark sea). Same class as the god-ray mask's water suspend —
  ANY extra scene pass must suspend the mirror.
- **Additive/transparent FX must be hidden from an override pass** or every ember mote
  becomes an opaque quad with its own ink square ("confetti").
- **Ink accumulates into a false fog.** Perspective-compressed far geometry turns
  thousands of half-faded lines into a solid dark horizon band.
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
  git-stash A/B against HEAD). A runs-0 save adds the gesture-tutorial DOM overlay on
  slow headless runs (the "grey rectangle"). Capture with a veteran save + pinned
  ?seed+?challenge course at a pinned `player.dist` with `game.state === 'playing'`
  asserted, and validate machine gates against frames from the SAME capture run, never
  stale ones.

**→ Systematize.** The chunk-override + `?flag` + zero-default coexistence pattern now
has a third instance (toneMap → atmosphere → animeMode): boot-time global restyles are
cheap, byte-identical off, and stack. `applyAnimeHull` is a general **inverted-hull
outline kit** (solid-mesh filter + per-part width cap + skinned bind) that any future
stylization can reuse per-creature. `animeshots.mjs`'s veteran-save, seed-pinned,
distance-pinned, alive-asserted capture is the right template for EVERY future in-run
capture tool. All look dials are URL params (`aedge1/ashadow/ahull/asat/…`) so owner
iteration is reload-speed. Process law: still-frame critics (machine or Fable) gate
CRAFT, but only the owner-on-preview gates MOTION — never spend >2 rounds polishing on
stills before a live look.

**→ Leapfrog.** The cel chunk proves per-light banding can coexist with the whole
shipped FX stack, which opens per-BIOME stylization (a biome could dial its own band
levels — "storybook" zones). The hull kit opens per-dragon contour identity (width/hue
per skin, e.g. a gold contour on the Sovereign). If the owner greenlights the clean-cel
direction, next steps in order: per-dragon band/hull tuning on the hero ladder, crisp
stylized cloud shapes, a Settings toggle + tier gating, and a Fable Gate-2 pass on the
integration PR.

**Verify.** `tools/animeshots.mjs` (pairs + dist-pinned states), mean-luma A/B (anime ≥
shipped − 5%), `tricount --detail=high --max=6000 --ci` (0 over), `tests/smoke.mjs`
green, no-flag path byte-identical (chunk override, hull, and pass insertion all gated
on `?anime=1`).
