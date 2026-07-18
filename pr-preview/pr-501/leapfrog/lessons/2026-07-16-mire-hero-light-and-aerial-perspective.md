# Mire: a real hero point-light + a per-biome aerial-perspective lever (kill the flat-black frame)

**What we did.** Owner sent a live phone shot of the Lumen Mire; Fable rated it a harsh **2/5** vs the
north star (NatGeo × Ghost of Tsushima × BotW) and named the two loudest cheap-tells: a flat additive
**onion-ring halo** dead-centre on the drake, and **flat pure-black cutout** canopy props at every depth.
Owner greenlit both and reframed the perf budget: *"I'm on Apple's flagship with adaptive resolution —
you can't hide behind weak mobile; plan and optimize better."* Fable wrote an exact numeric spec (scratchpad
75); we implemented it verbatim across 7 files + a new gate. Both levers verified in-game (frames read
dramatically better than the 2/5) with every existing gate green.

**Lever 1 — the halo was never the sprite's SIZE, it was its FALLOFF + the ascension RAMP.**
- The screen-disc was `auraSprite` (a 9×9 additive `THREE.Sprite`) whose texture held 0.8 alpha out to
  r=0.3 then ramped to 0 — that broad *shoulder* is the visible ring. New `makeAuraTexture` (util.js) is
  core-hot and **dead by r=0.6**: the 9×9 quad is unchanged (so the `contactShadow` mask + `heroshadow`
  test are byte-untouched — the mask reads the quad footprint, not the visible glow) but the *visible*
  glow shrank ~9u→~5.5u with zero circular edge. **Taming a sprite = falloff + opacity, never scale**
  when scale is entangled with a shadow/test.
- Azure Drake authors `auraIdle: 0.0`, so the tier-1 disc in the shot was **pure ascension ramp**
  (`ascension.js`). The ramp cap 0.6→0.30 (step 0.09→0.05, radiance 0.012→0.008) was the real fix — chasing
  the sprite alone would have missed it. **When a per-skin FX looks wrong on one skin, check the shared
  RAMP that synthesizes it, not just the skin's authored value.**
- The premium answer is a **real light**: one global `THREE.PointLight` (per-skin HUE pulled 45% toward
  warm-neutral so no skin dyes the water acid; Azure → #C1DBDF), 12/34/decay-2, parented to the dragon
  `group` so its under-chest offset rides pitch/roll. **Cost gotcha:** a point light's real cost is the
  `NUM_POINT_LIGHTS 0→1` **shader recompile**, not the per-fragment loop — so make it a **persistent
  singleton created once and RE-PARENTED on rebuild** (never re-created / `.visible`-toggled), so the
  scene always holds exactly 1 light and lit shaders never recompile mid-flight.
- **The custom water shader has `lights:false` — a scene light can NEVER pool on it.** Fable caught this
  in the spec ("the engineer must not discover it after wiring the light"). The mirror is fed the light
  **positionally** (world XZ, the rain-ring hash space) as an anisotropic gaussian → a
  vertical reflection **streak**, not another disc. Precedent: the EYE-BREACH `_goldPool`. **Reusable
  law: any hand-rolled `ShaderMaterial` with lights off needs an explicit positional term for every light
  you want it to answer — a `PointLight` is invisible to it.**
  - **Foreshortening gotcha (Fable re-gate 77, halo 4.0→pass):** a WORLD-space anisotropy of
    `vec2(2.4,0.9)` (2.7:1 down-lane) foreshortened to ~1:1 ON SCREEN — the pool came back as a chalky
    oval, the exact disc the lever exists to kill. Perspective compresses the view-depth (z) axis hard, so
    a screen-space streak needs a world aspect that **over**-stretches down-lane: `vec2(2.4,0.5)` (~4.8:1
    world → ~2:1 on screen) is the streak. **When you want an N:1 read on-screen along the depth axis,
    author well past N:1 in world space.**

**Lever 2 — aerial perspective is RUNTIME depth, not a vertex bake (Fable corrected her own spec).**
Her first instinct ("vertex-baked, zero runtime") conflated two effects. A prop can't know its camera
distance at bake time, so true depth-lightening MUST be runtime. Final recipe = **(a) primary + (b) second
pass**:
- **(a) `uPropAerial`** — a per-biome shader lever on the shared `addPropDetail` (the `moteDepthFade`
  pattern: shared uniform objects driven per-frame from the lerped env, **0 for every biome that doesn't
  set it → the other 6 render byte-identical**). `smoothstep(55,230,vFogDepth)² × 0.85` blends the fragment
  toward an ember `0x9c5a22` (≈2.1× the luma of the Mire's dark `fogFarColor 0x4a2c0e`, so distance
  finally **lightens** instead of fogging darker). **The emissive ADD (×0.40) is the term that shows** —
  these props are near-black diffuse under a 0.2-sun, so a diffuse mix alone dies backlit (same reason the
  Caldera ladder folds vColor into emissive). `vFogDepth` comes free from the atmosphere fog-chunk on every
  fogged material; `#ifdef USE_FOG` guards the fogless preview compiles.
- **(b) `mireVeil`** — a dedicated within-prop value ladder (canopy-light→trunk-dark) on
  canopywall/boleveil/drape via the existing `bakeMireLadder` + the `merged.materials[0] = …` swap (the
  hero-ladder precedent). **Don't flip `vertexColors` on the shared `primary[4]`** — the hero-colossus dark
  groups carry no `color` attribute and would break; make a NEW material. reedveil **skipped** (thin near
  verticals would read as glow-sticks; the near screen must stay pure black — the value floor).
- **(c) fogFarColor tune REJECTED** — it's load-bearing (water dual-fog, sky sink, atmosphere far-mix, the
  anti-Aurora gates), so brightening it to fix four props would lift the whole far field incl. the black
  mirror. **Reject the global knob when a surgical default-0 lever exists.**

**Scoping law reaffirmed.** The player halo/light is intentionally **global** (the player is in every
biome; the bad halo was global) — "byte-identical elsewhere" applies to the BIOME lever (Lever 2), which
stays Mire-only by the default-0 env channel. Don't conflate "player-facing global upgrade" with "must not
touch other biomes."

**Gotcha (test).** `new THREE.Color(0x9c5a22)` in r160 converts sRGB→linear on construction (ColorManagement
on), so a determinism/plumbing test must compare against a **same-constructed** `THREE.Color`, never the raw
`0x9c/255` sRGB channel. The new `tests/propaerial.mjs` ports the GLSL (identity at lever 0; live+monotonic
when on; near field stays black) AND greps the shader source so the port can't drift from what compiles.

**Verify harness.** In-game capture needs `boot({ query: '?debug' })` (the `?debug` seam exposes
`window.__dd`; a bare `cleanshot` query hangs on the `!!window.__dd` wait — and `cleanshot` also strips the
DRAGON, so use it for pure-environment aerial reads but NOT for judging the halo/water-pool).

**What it unlocks.** A reusable **per-biome aerial-perspective channel** (any biome can set `propAerial` +
`propAerialColor` to depth-lift its silhouettes toward its horizon) and a reusable **hero point-light +
positional water-pool** kit (any future "the player is a light source" work — boost flares, surge). Next
lever (Fable's critique #4, out of this scope): the baked warm **hero-rim on the drake** so the player is
the best-lit object in frame.
