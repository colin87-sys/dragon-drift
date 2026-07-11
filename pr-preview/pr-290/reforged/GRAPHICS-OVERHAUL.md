# Dragon Drift — Graphics Overhaul

**Target: push the look from a strong ~7/10 to a state-of-the-art 9–10/10** stylized-flight game,
inside the hard constraints — **vanilla Three.js r160, no build step, 100% procedural (zero asset files),
60fps on weak mobile.** Reference bar: Alto's Odyssey / Sky: Children of the Light, in a browser.

> **This is the single source of truth for the graphics overhaul.** Read it before any graphics/rendering PR.
> Graphics **lessons follow THE RULE** — one NEW FILE per lesson in [`leapfrog/lessons/`](../leapfrog/lessons/)
> with a **`graphics-` slug** (e.g. `2026-07-11-graphics-dither-kills-sky-banding.md`), never a single append-only
> ledger (the repo's one-file-per-lesson convention is already conflict-free by construction). The **Gate Log**
> lives at the bottom of this doc.

---

## How to use this doc

- Stay **surgical**: one initiative per PR, coexist behind a flag, prove on the hero (**Azure Drake**), migrate,
  never break the shipped roster or look.
- **Every PR passes a Fable Quality Gate before merge** (see below). After each merge, add a lesson as a new
  `leapfrog/lessons/graphics-…` file and add a Gate Log row (bottom of this doc).
- All work lands on the **graphics integration branch** and merges to `master` only at phase boundaries — see
  *Branching & conflict isolation*.

The hero is **Azure Drake** (`js/dragons.js:18`) — the most complete dragon and the one the owner is happy with.
Azure is the falcon-winged avian courier (`sweptLoft` torso + `bladeFeatherWings` + `draconic` head) and
currently carries **no `surface:{shader}` patches**. That's fine: Azure is the hero for the creature-agnostic
majority of initiatives (tone mapping, IBL, shadow, atmosphere, sky, water, grade). The one nuance is **N7**
(surface v3): its sun-backlit *membrane* transmission is membrane-specific, so on Azure we validate the
light-aware iridescence + `scene.environment` specular pickup, and secondarily sanity-check membrane
transmission on a membrane-winged dragon (ember/obsidian) before any roster migration.

---

## Fable Quality-Gate Protocol *(the governance layer that keeps this at 9–10)*

Quality is enforced by a **4-gate ladder, and every gate is an actual spawn of a high-effort Fable-model agent**
— `Agent(subagent_type: plan or review, model: "fable")`, instructed for **maximum thoroughness / high effort**
(not a passive checklist a human ticks). Because there is no WebGL in CI, visual assessment is done from the
**screenshot/montage artifacts** each initiative's tools emit (`bandshot` / `tonemapshots` / `skyshot` /
`gameshots` / `tiershots`) — Fable reads the PNGs; the **human still judges *motion* on the live PR preview.**

- **Gate 0 — Kickoff (ONCE, before any code is written).** Spawn a high-effort Fable agent to review that the
  branch is synced with `master`, the roadmap + prototype ordering are sound, and the first initiative's approach
  is right. It returns **`GREENLIGHT`** or a **blocking list**. **No initiative starts until it greenlights.**
  Re-run Gate 0 if the plan is materially revised.
- **Gate 1 — Pre-build design check (before EACH initiative's code). MANDATORY.** Spawn a high-effort Fable
  agent; it confirms the concrete approach matches this doc and the initiative is correctly scoped / flagged /
  tiered **before** code, catching technique drift early → **`APPROVED`** / **`ADJUST(<changes>)`**. Only a purely
  mechanical PR (e.g. an N2 one-liner) may downgrade this to a note in the PR body, and only if Gate 2 still runs.
- **Gate 2 — Pre-merge quality gate (after building, BLOCKING).** Spawn a high-effort Fable agent with this doc,
  the initiative's spec, the PR diff, and the verification artifacts → a structured verdict:
  - **Plan-adherence checklist — ALL must pass:**
    - [ ] Scope matches the initiative (no creep into another initiative).
    - [ ] Technique matches this doc, **or** a documented, justified deviation is recorded.
    - [ ] Coexistence flag present — the shipped look is **byte-identical when the flag is off**.
    - [ ] Zero-default identity proven where claimed (uniform-zero ⇒ shipped frame).
    - [ ] Tier degradation wired into `main.js applyQuality` (every full-screen add has a tier off-switch).
    - [ ] Headless verification present and green (new test/tool + existing suite).
    - [ ] Lesson added as a new `leapfrog/lessons/graphics-…` file.
  - **Quality score /10** toward the 9–10 bar, judged from the artifacts; sub-target scores get **specific,
    actionable deltas** (not vibes).
  - **Regression check:** shipped roster/look unbroken (off-path visual diff; `bulletcontrast.mjs` when the
    change touches color/fog/tone).
  - **Verdict: `SHIP` / `REVISE(<fixes>)` / `RETHINK(<the technique isn't reaching the bar>)`.**
  - **Merge rule:** a PR merges only on **`SHIP`** with **score ≥ 8** and a fully-passed adherence checklist.
- **Gate 3 — Phase-boundary review (after each phase, before the next).** Spawn a high-effort Fable phase-review
  to judge the *compound* result (the 6-biome `gameshots` montage + the Azure hero shot) against the **9–10** bar
  before the next phase — and before the graphics→`master` phase merge.

**Gate Log:** every Gate 2/3 verdict (score + checklist + deltas) is recorded in the PR body and summarized in
the Gate Log table at the bottom of this doc, so future sessions see the quality history at a glance.

---

## Branching & conflict isolation

The owner runs a heavy boss/creature PR stream to `master`. To keep graphics from conflicting with it:

**Same repo, isolated integration branch — NOT a fork/clone.** (A fork drifts from `master` on every boss merge
and concentrates all conflict pain into one huge terminal re-integration, and forks the Pages deploy / `sw.js`
versioning / tests / tooling.)

Conflict sources and their fixes:
1. **Ledger appends — already solved by the repo.** The repo uses a **one-file-per-lesson** convention
   (`leapfrog/lessons/<date>-<slug>.md`, assembled by `tools/build-ledger.mjs`); two chats never touch the same
   file, so lessons never conflict. Graphics just uses a **`graphics-` slug prefix** to stay grouped/discoverable.
   (No separate ledger file — that would reintroduce the append-collision the convention exists to prevent.)
2. **`main.js`** (renderer construction, `applyQuality`, the `renderPostFX` call in `tick`) — boss work edits
   `tick` too. Land all graphics `main.js` edits **early (Phase 0)** in tight, separated regions; later
   initiatives add code in NEW files and only *reference* `main.js` hooks.
3. **`biomes.js`** (N5/N8/N9/N12 add per-biome channels) → additive channels appended to each palette object;
   keep diffs small; rebase at phase start.
4. **`dragons.js` / `CLAUDE.md`** — low boss-stream frequency, low risk.

Workflow:
- `claude/procgen-graphics-optimization-qfbk7o` is the **long-lived graphics integration branch.** All
  initiative PRs target it (or short sub-branches merged into it), **not `master`**.
- **Pull `master` → graphics branch at the START of each phase** (4 controlled syncs).
- **Merge graphics branch → `master` at each PHASE BOUNDARY** as a batched, Fable-phase-reviewed integration
  (4 merges total). The streams meet only at these 4 controlled moments.
- **New systems = new files** (`skyProbe.js`, `atmosphere.js`, `particleBatch.js`, `weather.js`, `toneMap.js`) —
  new files never conflict. A deliberate constraint on every initiative.

---

## Executive read

**Strengths not to regress:** the adaptive 3-tier quality spine (`main.js:955-1008`); the composable
SurfaceShader system (one `onBeforeCompile` + one merged `customProgramCacheKey`, `dragonSurfaceShader.js`);
the `computeEnv()` palette engine + shared canonical `SUN_DIR` (`biomes.js`); the correct
linear-HDR → bloom → god-rays → OutputPass → display-grade order (`postfx.js`).

**Top-4 weaknesses:** (1) **flat analytic lighting** — one directional + one hemisphere light, no image-based
ambient, so surfaces never "sit in" the sky; (2) **banding** — huge smooth sky/fog/water gradients quantized to
8-bit sRGB with no dither; (3) **grounding** — the radial-gradient contact blob never reads as *the dragon's*
shadow; (4) the **sky** is a 3-stop gradient and it's 60% of every frame.

**Biggest wow:** (1)+(4) compounded — *a sky that is a real light source*: procedural cloud/haze whose colors
project back onto the world via an analytic SH light probe. The Sky:CotL trick, well-suited here because all
lighting inputs already flow through one `computeEnv()`.

**Verdict:** currently a strong **7/10** — top-decile discipline, mid-pack image quality. Reaching 9/10 needs
~10 surgical initiatives that all ride the existing tier system — **not** new architecture and **not** WebGPU.

---

## Initiative backlog *(ranked by impact-to-cost; hero = Azure)*

Impact = visual wow (1–5). Cost = engineering effort + 60fps-mobile risk (1–5).

### N1 — Gradient dithering + grain — Impact 4 / Cost 1
**Goal:** kill sky/fog/water banding everywhere in one frame's work — the cheapest visible-quality jump here.
**Technique:** interleaved gradient noise (Jimenez), ±0.5 LSB, in *display-referred* space — the last line of
`GradingShader` (`postfx.js`):
```glsl
float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
col += (ign - 0.5) * (1.0 / 255.0) * uDither;   // uDither: 1.0
```
Tier2 skips the composer, so the two full-screen gradient owners get their own copy: the sky dome fragment
(`environment.js`) and the water fragment (`water.js`), at 0.5 LSB (double-dither at these amplitudes is
invisible — do not build plumbing to prevent it). Optionally expose `uDither` as a **grain** channel (2–4 LSB,
luma-scaled) for the death grade / Emberfall — grain and banding-fix are the same code path.
**Coexist / hero:** land behind `?dither=0` for A/B. **Verify:** new `tools/bandshot.mjs` counts distinct 8-bit
values along a vertical scanline through the smoothest gradient (assert step count rises) — the permanent
banding-regression gate; extend `tests/composer.mjs` to assert the dither term is present.
**Human judges:** dusk Sanctuary + Astral Shallows on an OLED phone. **Tiers:** all (≈4 ALU ops).

### N2 — Renderer contract — Impact 2 / Cost 1
**Goal:** stop leaving free performance/correctness on the table at renderer construction (`main.js:74-78`).
**Technique:** `new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance', stencil:false })`;
`renderer.outputColorSpace = THREE.SRGBColorSpace` (explicit — it's the r160 default, but it's the documentation
seam every future colorspace change starts from). **AA matrix decision (make it explicit, then stop):** tier0/1
= 4×MSAA on the composer's HalfFloat RT (keep — cheap on tile-based mobile GPUs); tier2 = FXAA (folded into N12,
only when `pixelRatio===1`). Explicitly **reject TAA** (no motion vectors; ghosting on the fast chase cam) and
**SMAA** (LUT-heavy for marginal gain over 4×MSAA). Surface `renderer.info.render.calls` in the `?debug=perf`
HUD so the <100 draw-call budget (after N4) is a watched number.
**Verify:** constructor-arg assertion (string grep, repo test style); `bandshot`/gameshots byte-diff = no
regression. **Tiers:** global.

### N3 — Tone mapping → Khronos PBR Neutral — Impact 4 / Cost 2
**Goal:** stop ACES from stealing the game's gold. A saturated vibrant-fantasy game is exactly the content ACES
punishes (bright gold → white, aurora cyan/magenta → pastel). Cost is aesthetic, not perf — tone mapping is free.
**r160 reality:** the vendored build has `AGXToneMapping` and `CustomToneMapping` but **not** `NeutralToneMapping`
(that landed r162). Swapping three versions violates the no-build/r160 law, so implement Khronos PBR Neutral
(~15 lines of published GLSL) by overriding the chunk in a new `js/toneMap.js`, run **before any material
compiles**:
```js
THREE.ShaderChunk.tonemapping_pars_fragment =
  THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    /* glsl */`vec3 CustomToneMapping( vec3 color ) {   // Khronos PBR Neutral
      color *= toneMappingExposure;
      const float startCompression = 0.8 - 0.04, desaturation = 0.15;
      float x = min(color.r, min(color.g, color.b));
      float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
      color -= offset;
      float peak = max(color.r, max(color.g, color.b));
      if (peak < startCompression) return color;
      float d = 1.0 - startCompression;
      float newPeak = 1.0 - d * d / (peak + d - startCompression);
      color *= newPeak / peak;
      float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
      return mix(color, newPeak * vec3(1.0), g);
    }`);
```
Because `OutputPass` compiles this chunk and keys off `renderer.toneMapping`, and the tier2 raw-render path uses
the same chunk (water already includes it), **one override covers both paths.** A/B via `?tm=aces|agx|neutral`.
Expect to re-tune on switch: exposure 0.92 → ~1.0; `GradingShader` saturation 1.18 → ~1.05–1.10 (Neutral hands
back the saturation the grade was compensating for). Bloom feed is unaffected (threshold 1.0 is pre-tonemap in
linear light) but rendered brights hold color — Surge and the water sun-streak get dramatically more golden.
**Opinion:** Neutral wins; AgX desaturates saturated brights even harder (its virtue is photoreal hue-skew).
**Coexist / hero:** ACES stays the shipped default until the human approves side-by-sides; the A/B montage is the
proof. Ships in **its own PR** with nothing else. **Verify:** `tools/tonemapshots.mjs` (same seeded frame under
all three modes → one montage); `tests/tonemap.mjs` asserts the override + `?tm` plumbing; **re-run
`bulletcontrast.mjs`** (bullet-band contrast is certified against ACES today). **Tiers:** all (chunk-level).

### N4 — ParticleBatch (150 draw calls → 1) — Impact 3 / Cost 2
**Goal:** collapse up to 150 per-`THREE.Sprite` draw calls (`particles.js`) into one `InstancedBufferGeometry`
draw, and fund the frame budget for N5/N9/N10.
**Technique:** one unit-quad `InstancedBufferGeometry` + per-instance attrs
`iPos(3), iSize(1), iColor(3), iAlpha(1), iStretchDir(3), iStretch(1)`; a ShaderMaterial does camera-facing
billboard + velocity-stretch in the vertex shader (the current CPU stretch math moves to GLSL). CPU sim is
untouched — `updateParticles` writes into the instanced attribute arrays, `needsUpdate` once/frame.
`AdditiveBlending`, `depthWrite:false`, `layers.set(1)`, `frustumCulled=false` all preserved. Compute the soft
glow procedurally (`smoothstep` on quad-UV radius) — drops `makeGlowTexture`. Shockwave ring/rect pool joins as
a second instanced mesh.
**Coexist / hero:** build `particleBatch.js` beside `particles.js`; `?pfx=batch` flips the backend; prove on the
ring-collect + death bursts; keep the old module one release, then delete. **Verify:** `tests/particlebatch.mjs`
pool-math parity (spawn N → identical visibleCount/caps for a seeded script); `?debug=perf` draw-call assertion.
**Tiers:** caps ride `setParticleQuality` unchanged; after soak, raise tier0 `VISIBLE_CAP` 150 → 400 (now ~free).

### N5 — Procedural IBL: the sky becomes the ambient light — Impact 5 / Cost 3 *(centerpiece)*
**Goal:** replace the constant hemisphere approximation with a real SH irradiance environment derived from the
*same analytic sky*, continuously biome-lerped — the biggest single lighting-quality jump available.
**Rung 1 (the system, all tiers): analytic SH9 LightProbe, CPU-side, per frame.** The sky is a closed-form
function of direction; port that gradient math to JS once (~30 lines), evaluate it at ~50 fixed directions,
project to 9 SH coefficients, write into a `THREE.LightProbe` beside `sun`/`hemi`. r160's lit shaders support it
natively (`USE_LIGHT_PROBES`). Cost: ~50×9 MADs/frame on CPU — nothing. Because inputs are `computeEnv()`
outputs, the probe lerps perfectly across biome seams. Keep `hemi` at ~0.25 as fill during migration; the probe
carries the character (Emberfall red floor-bounce, Lumen teal horizon, Astral violet zenith).
```js
// js/skyProbe.js
const DIRS = fibonacciSphere(50);              // precomputed once
export function updateSkyProbe(env) {          // env = computeEnv() output
  sh.zero();
  for (const d of DIRS) {
    skyColorAt(d, env, _c);                     // JS port of the dome gradient (no stars/aurora)
    THREE.SphericalHarmonics3.getBasisAt(d, _basis);
    for (let i = 0; i < 9; i++) sh.coefficients[i].addScaledVector(_cV, _basis[i] * (4*Math.PI/DIRS.length));
  }
  probe.sh.copy(sh);
}
```
**Rung 2 (tier0 + shop): specular PMREM.** `PMREMGenerator.fromScene` with only the sky dome visible, 64–128px,
→ `scene.environment` — every MeshStandardMaterial gets roughness-filtered sky reflections. Bake policy: shop/
menu always (paused, free — the shop is the hero showroom); in-run tier0 only at biome seams (3 staged bakes
across the crossfade, each on a menu-grade idle slice), hard-gated behind `?env=pmrem` until measured on a real
phone. If mid-run bakes hitch, ship rung 2 shop-only + run-start-only — still a big win.
**Coexist / hero:** probe intensity 0 = shipped look; prove on Azure in the shop, then Sanctuary props.
**Verify:** `tests/skyprobe.mjs` — pure math (SH of constant sky == that constant; monotonic lerp across a seam;
JS `skyColorAt` matches the GLSL gradient at N directions to 1e-3). **Tiers:** tier0 = probe + PMREM;
tier1 = probe only (hemi off); tier2 = probe only (CPU-side + free — a rare effect weak devices get in full).

### N6 — Real projected hero shadow — Impact 4 / Cost 2
**Goal:** replace the radial blob (`contactShadow.js`) with the dragon's actual animated silhouette on the water
— wings beating in the shadow is a disproportionate "alive" signal. **Not** three.js shadow maps (the water is a
hand-rolled ShaderMaterial with no `receiveShadow` path, and shadow-mapping the instanced prop world is the
classic mobile frame-killer). It's the god-rays trick reapplied.
**Technique:** a 128² RT (tier0); an `OrthographicCamera` along `SUN_DIR` (already canonical, `biomes.js`),
frustum-fit to the dragon's ~12m bounds, tracking the player; render **only the dragon** (dedicated layer 2)
with `overrideMaterial = blackMat` — ~1 draw call. The contact plane keeps all its altitude scale/opacity/offset
logic but samples the RT with a 4-tap soften whose radius rises with altitude, and an `edgeFade(vUv)` to kill
frustum-clip pops. Water reflection never sees it (plane on layer 1).
**Coexist / hero:** `silhouette:true` opt-in; blob is the fallback + the tier2 path; hero = Azure. **Verify:**
`tests/heroshadow.mjs` (RT wiring, layer mask math, save/restore discipline modeled on the god-rays pattern);
local `tools/shadowshot.mjs` for blob-vs-silhouette. **Human judges:** wingbeat visible while skimming; no
flicker leaving the frustum. **Tiers:** tier0 128²/frame; tier1 96² every other frame; tier2 shipped blob.

### N7 — Dragon surface v3: the sun participates — Impact 4 / Cost 2
**Goal:** the SurfaceShader patches are all view-dependent (fresnel family); none know where the sun is. Add
light-awareness for the two signature moments: wings glowing when banking across the sun, and iridescence that
sweeps with sun angle.
**Technique — two new patches in the existing `composeSurface` system (this is what it was built for):**
1. `membraneTransmissionPatch` — real backlight transmission, superseding the view-only `membraneSSSPatch` on
   membranes: `trans = pow(clamp(dot(V,-uSunDirView),0,1), 3.0) * (0.35 + 0.65*edgeThinness)`, added to
   `totalEmissiveRadiance * uSunColor`. One shared view-space sun `Vector3` uniform, written once per frame.
2. `iridescencePatch` v2 — modulate the hue sweep by `dot(N, uSunDirView)` and tint by `uSunColor`, so the film
   hue shifts as the dragon pitches and runs hot in Emberfall / cool in Astral.
3. Free rider: once N5 rung 2 lands, the dragon's MeshStandard picks up sky specular from `scene.environment` —
   audit roughness (smooth membranes at ~0.7 want ~0.5 to catch it).
**Azure caveat:** Azure is feather-winged, so on Azure we validate #2 (light-aware iridescence) + the env
specular pickup; #1 (membrane transmission) is verified secondarily on a membrane dragon before roster-wide
migration. **Coexist / hero:** new names in the patch registry, opt-in per blueprint, Azure first; never stacked
with `membraneSSS` (the supersede rule). **Verify:** extend `tests/surfaceshader.mjs` (single onBeforeCompile,
each uniform once, merged cache key); local `tiershots` compile gate under skinning. **Tiers:** all.

### N8 — Atmosphere: height fog + sunward inscatter (aerial perspective) — Impact 5 / Cost 3
**Goal:** replace "linear fog toward one color" with a tiny physically-flavored atmosphere — denser near the
water, brighter looking *toward* the sun, colored near→far. Today the dual-fog blend exists only where
hand-rolled (sky, water) while every prop/boss/creature uses stock linear `fog_fragment`. This makes it a system.
**Technique:** override `THREE.ShaderChunk.fog_pars_fragment`/`fog_fragment` once at boot (new `js/atmosphere.js`)
with **zero-default uniforms** so unpatched materials are byte-identical:
```glsl
uniform vec3  uAtmosFarColor;   uniform float uAtmosFarMix;    // 0 = shipped linear fog
uniform vec3  uAtmosSunDirView; uniform vec3  uAtmosSunTint;   uniform float uAtmosInscatter; // 0 = off
uniform float uAtmosHeightK;    // 0 = height-uniform fog
// fog_fragment core:
float f = smoothstep(fogNear, fogFar, vFogDepth);
f *= mix(1.0, exp(-max(vWorldY,0.0)*uAtmosHeightK), step(0.0001,uAtmosHeightK));
vec3 fogCol = mix(fogColor, uAtmosFarColor, f * uAtmosFarMix);
float sun = pow(clamp(dot(normalize(-vViewPosition), uAtmosSunDirView),0.0,1.0), 6.0);
fogCol += uAtmosSunTint * (sun * uAtmosInscatter * f);
gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol, f);
```
Uniform *values* are shared objects in `atmosphere.js`; a `bindAtmosphere(material)` helper assigns them —
**careful:** props already use `onBeforeCompile`, so provide a `chainBeforeCompile(mat, fn)` utility (wrap, don't
overwrite — the L4 lesson) and route `addPropDetail` through it. Then retire the hand-rolled dual-fog in sky +
water into these shared uniforms (three touch points → one authority). Biomes gain optional
`atmos:{ heightK, inscatter }`, lerped in `computeEnv()` (Emberfall high heightK, Frozen Reach high inscatter,
Astral ~0). **Verify:** `tests/atmosphere.mjs` (chunk applied; zero-uniform identity evaluated in JS; binding
wrap preserves the prop-noise injection); re-run `bulletcontrast.mjs` per biome. **Tiers:** tier0/1 full; tier2
gets heightK/inscatter = 0 via the shared write in `applyQuality` (degenerates to today's linear fog, no
variants).

### N9 — Sky 2.0: procedural clouds + layered horizon — Impact 4 / Cost 3
**Goal:** the dome earns its 60% of the frame — a domain-warped FBM cloud band + per-biome cloudiness + horizon
haze, inside the existing single sky draw.
**Technique:** in the dome fragment, sample a 2D cloud field on the direction's cylindrical projection; 3-octave
value-noise FBM + one domain-warp; drift with `time` and `playerDist*0.02` for parallax (the dome is
camera-locked, so world-motion must be authored). Band-shape it, two-tone
`mix(cloudShadow, cloudLit, litness)` with sun-facing silver-lining edges (this term is most of the beauty).
Draw the sun disc *after* clouds so it peeks through gaps, and **feed cloud coverage near the sun into god-ray
intensity**. Biomes gain `sky.cloud:{ amount, lit, shadow }` lerped in `computeEnv()`. Reuse the existing
hash-noise helpers. **Cost control:** ~16 hash evals/sky-pixel at tier0; tier1 drops the warp + 1 octave via a
uniform-driven loop (the god-rays break-loop trick); tier2 `amount=0` (reverts to the gradient, and renders at
pixelRatio 1 anyway). Also draw the sky **last among opaques** (`renderOrder` + depth at far) so occluded sky
pixels early-out — often a free 1–2ms that pays for the clouds. **Verify:** shader-compile gate (tiershots/canyon
boot); re-run `bandshot` (clouds + dither interplay); a `skyshot` 6-biome montage. **Human judges:** motion —
drift/parallax must not swim against flight speed. **Tiers:** tier0 full / tier1 reduced / tier2 off.

### N10 — Water 2.0 — Impact 4 / Cost 4 *(a/b/c independently shippable)*
The floor is the second-largest surface; give it silhouette, volume, and world interaction.
- **(a) Vertex swell displacement.** Today's plane is a **single quad** — waves live only in shading, the horizon
  is dead flat. Subdivide (tier0 ~96×160 ≈ 30k tris, one draw, trivially vertex-bound), evaluate the same
  `wave()` octaves in the vertex shader for `wp.y` + a fourth long-wavelength swell octave (freq ~0.06, amp ~0.6)
  for a living horizon; fragment normals stay as-is (consistent). Densify verts near the camera (precompute in
  geometry). Gameplay y=0 stays safe (min altitude ~2m clears max swell ~0.8m); the contact-shadow plane rides
  the swell height via a shared JS wave port.
- **(b) Fake Beer–Lambert volume.** No terrain under the water, but the *view-ray path length to a virtual
  bottom* sells volume: `absorb = exp(-uAbsorbCoeff * uBottomDepth/max(V.y,0.05));
  base = shallow*absorb + deep*(1-absorb)` replacing the height-driven mix — glancing views go deep/dark,
  look-down goes shallow/bright (~6 ALU). `uAbsorbCoeff` derived per biome from existing `water.deep/shallow`.
- **(c) Prop foam collars.** `environment.js` knows every prop base; one `InstancedMesh` of ~48 annulus foam
  decals (hashed broken edge, `time`-pulsed) written during `recycleBand`/`writeMatrix`, parked at zero scale
  otherwise (the existing parking idiom). One draw call, zero passes; visually welds towers/crystals into the sea.
- **Reflection cost (with N11):** clamp the mirror camera far to `fogFar+50`, and render the 768² mirror every
  other frame (specular changes slowly) — typically halves the biggest tier0 GPU line-item.
**Coexist / hero:** each sub-feature flag/uniform-gated; hero = Sanctuary dusk (reflective) + Frozen Reach
(glassiest). **Verify:** `tests/water.mjs` (JS/GLSL wave parity; both `USE_REFLECTION` variants compile; foam
instancing math); `?debug=perf` before/after. **Human judges:** horizon swell; foam pulse; reflection half-rate
judder on a fast strafe. **Tiers:** tier0 all + half-rate reflection; tier1 48×80 displacement + absorption +
foam + analytic reflection; tier2 flat quad + absorption only.

### N11 — Pass-budget: let tier1 keep the wow — Impact 3 / Cost 2
**Goal:** the two heaviest costs (768² planar mirror; half-res god-ray mask scene re-render) are why tier1 loses
god-rays + reflection. Cheapen them so tier1 — most mid-range phones, i.e. most players — keeps the signature
look. **Technique:** god-ray mask → **quarter-res** (`godrays.js SCALE=0.25`; indistinguishable after the blur)
→ enable god-rays at tier1 with `uSamples=24` + halved intensity (`_grTier0` → `_grTierOK = tier<=1`,
`postfx.js:262-276`). Reflection: far-plane clamp + half-rate (N10); offer tier1 a 384² mirror behind a
tier-parameterized `setWaterReflective(tier)`. Audit tier1 bloom mip depth. **Verify:** extend
`tests/composer.mjs` for the new tier truth table; on-device perf HUD is the real gate; auto-degrade unchanged.
**Human judges:** pin tier1 via `saveData.settings.qualityOverride`, confirm god-rays present at 60fps.

### N12 — Grade v2 + AA close + shop DOF — Impact 3 / Cost 2
**Goal:** finish the post story without expensive passes. **Technique:** **split-toning** in `GradingShader`
(`col += shadowTint*(1-lum)^2*amt + highlightTint*lum^2*amt`, per-biome, lerped via `computeEnv()`) — "LUT feel"
with zero LUT (a runtime 3D LUT is deliberately rejected: the grade is already parametric/procedural). **FXAA for
tier2** (vendored ~100-line MIT shader into `lib/shaders/`, run as the only pass when `pixelRatio===1`) — closes
the AA matrix. **Shop-only DOF** (2-pass bokeh, fixed focus on the dragon; the shop is the paused hero showroom
with a static camera → zero gameplay cost; never in-run — DOF ~doubles frame time and the chase cam wants
clarity). Death grade + Emberfall pick up the N1 grain channel. **Verify:** kick-state tests extended;
per-biome split-tone montage (`gameshots`). **Tiers:** split-tone tier0/1; FXAA tier2 only; DOF shop only.

### N13 — Biome weather fields — Impact 3 / Cost 3
**Goal:** each biome gets a signature atmospheric particle field (Frozen snow streaks, Emberfall ember rain,
Sanctuary pollen shafts through god-rays, Astral star-motes) at zero draw-call growth. **Technique:** generalize
the ambient `THREE.Points` (already one draw) into a **stateless GPU field** — position = `hash(id)` domain
wrapped in a camera-following box, animated entirely in the vertex shader from `time` + per-biome fall/sway
uniforms (already lerped in `computeEnv()`). Stateless wrap removes CPU update and lets COUNT rise 1200 → 4000
(tier0). Velocity-stretched quads (via the N4 batch shader) for rain/snow anisotropy. **Not** transform feedback
(no inter-particle forces / 100k counts needed — a vertex-shader field hits the same look for a tenth the code).
New `weather.js`, per-biome opt-in, Frozen Reach hero. **Tiers:** 4000 / 1600 / 600.

---

## Sequenced roadmap

- **Gate 0 — Kickoff (before Phase 0):** high-effort Fable greenlight on the synced branch + approach; no
  initiative starts until it passes.
- **Phase 0 — Foundations & free wins (do first):** N2 → N1 → N3 scaffolding → N3 decision → N4. Nothing changes
  the shipped look without a flag. Exit: banding gate green, <100 draw calls, tone-map montage approved.
- **Phase 1 — Hero look (Azure):** N5 rung 1 → N6 → N7 → N5 rung 2. Hero-first, judged on Azure in the shop
  scene + chase cam. Exit: the "bank across the sun" shot approved.
- **Phase 2 — World & atmosphere:** N8 → N9 (Sanctuary hero biome) → N10 (a/b/c separate PRs) → N11 last (needs
  N10's reflection perf wins). Exit: 6-biome montage vs current, side by side; tier1 pinned-device 60fps check.
- **Phase 3 — Polish & identity:** N12 → N13 → deferred candy (boss shadow via N6, boss atmosphere binding,
  per-boss split-tone). Each phase ends with a Fable phase-review against the 9–10 bar.

**PR estimate:** ~18–24 PRs, target ~20 (Phase 0: 5 · Phase 1: 4–5 · Phase 2: 6 · Phase 3: 3–5), plus ~20 per-PR
Fable gates and 4 phase-reviews (gates/reviews are not PRs).

---

## The WebGPU / TSL question

**Do not migrate. Schedule a 2–3 day read-only scout in ~2 quarters; nothing here depends on it.** It violates
"r160 / no build step," would simultaneously invalidate `postfx.js` + `Reflector` + `UnrealBloomPass` + every
`onBeforeCompile` patch (the "break the roster" move), and its headline wins don't map — N4 already takes us
<100 draw calls and N13 needs ~4k stateless particles. Scout = a standalone branch rendering sky+water+one hull
under `three/webgpu`, measuring weak-phone frame-time headroom + the WebGL2 fallback + the TSL cost of one
SurfaceShader patch. **Decision rule: reopen only if the prototype shows ≥25% frame-time headroom on the
weak-mobile floor, or a design need for true compute appears (e.g. 100k-particle murmurations).**

---

## Risks + the 3 prototypes to build first

**Risks:** N3 tone-map retune blast radius (isolated PR + `bulletcontrast` gate); PMREM bake hitch on weak
mobile (shop-only fallback ships regardless); global chunk patches must run before any material compiles (proven
zero-default identity); reflection half-rate judder (a feel call); tier2 *shaders* don't auto-retier (every
full-screen add carries a uniform-zero off-switch wired into `applyQuality`); CI has no WebGL (screenshot gates
run local/on-demand; only math + plumbing tests gate CI).

**Prototype first (each de-risks the biggest bets):**
1. **SH-probe parity spike** (`?probe=1`, hemi dimmed) — de-risks N5, the centerpiece. Confirms ~0 CPU cost and
   that a full biome cycle re-lights props on the preview.
2. **CustomToneMapping chunk-override spike** (`?tm=`) — de-risks N3 *and* the patch-vendored-chunk technique N8
   reuses; produces the ACES/AgX/Neutral montage for the one taste decision.
3. **Sun-silhouette shadow RT** — de-risks N6 and prices "what a tiny aux pass actually costs" for the whole
   roadmap (informs N9's mask change + N10's reflection work).

---

## Gate Log

One row per Gate 2 (per-PR) / Gate 3 (phase) verdict from its high-effort Fable review. Append as work lands.

| PR / Phase | Initiative | Fable score | Verdict | Notes |
|------------|-----------|-------------|---------|-------|
| — | (rows appended as PRs/phases clear their gate) | — | — | — |
