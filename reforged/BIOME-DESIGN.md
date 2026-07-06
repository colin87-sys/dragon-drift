# BIOME-DESIGN.md — the biome playbook

**Audience: the next session working on biomes/environments.** This file is the distilled
output of the biome research + design arc (July 2026): the diagnosis, the laws, the final
8-biome lineup, the identity-system architecture, the boss↔biome coupling, and the
PR-sized rollout. Read THIS instead of re-deriving it — and read
[`BOSS-DESIGN.md`](./BOSS-DESIGN.md) §1–§2 for the camera/budget context that biomes share.

Written for implementation by any session: every seam is named by file + function, every
gotcha is spelled out, and each increment states its coexistence guarantee and its
verification step. Line numbers cited were verified 2026-07-05; if they drift, search the
named identifier.

---

## 0. OWNER DECISIONS (2026-07-05 — locked; do not relitigate)

1. **Scope: 8 biomes.** Retool the existing 6 AND add two new ones — **Tempest Reach**
   (STORMREND's home) and **Tidal Reef** (BRINEHOLM's home). New biomes land LAST, each
   gated on its anchor boss being ready (never ship an orphan biome).
2. **Mechanics: hazards-first, kinematics later.** Biome hazards are DODGE-ONLY at first
   (they can kill you, they never move you). The data schema carries the flight-feel
   scalars from day one (defaulted neutral = byte-identical), so turning on a kinematic
   verb later is a value change, not an architecture change. §10 has the verb backlog.
3. **Audio: ambience layers over the radio.** Per-biome ambient beds (rumble, thunder,
   tidal drone) layer OVER the player's chosen radio station — never replace it. The
   Dragon Radio station-choice pillar is inviolable. The existing per-biome `keyShift`
   stays as-is.

---

## 1. THE DIAGNOSIS (why the biomes feel like a mess)

Verified against the code, 2026-07:

- **Six palettes ride one identical flight model.** Not one field in `BIOMES[]`
  (`js/biomes.js:29-131`) touches force, speed, handling, spawn logic, or hazards. Every
  field is a color or a scalar consumed by rendering. Distinctness is ~100% visual, 0%
  mechanical.
- **The level generator is deliberately biome-blind.** Obstacle type and canyon-run type
  in `js/level.js` are pure RNG, never biome-gated. Only material TINT is biome-driven
  (`obstacles.js` `mats.body[biomeIndexAt(o.dist)]`).
- **Boss selection ignores biomes entirely.** `bossDefForIndex(i)` is
  `BOSS_ORDER[i % BOSS_ORDER.length]` (`js/bossDefs.js:452-455`) — which boss you meet
  depends on how many you've killed, not where you are. The only biome↔boss touch is
  render-only bullet-band contrast (`js/boss.js:383 resolveBand`, called at `:638`).
- **Three biome pairs are near-duplicates.** Sanctuary/Wastes share three prop archetypes
  (`column`/`slab`/`dome` are `biomes: [0, 1]` — `js/environment.js:133,154,173`);
  Frozen/Astral are both sparse cold blue-violet; Mire/Caldera are both night +
  high-emissive accents.
- **The fauna variety is fake.** "Petrel pair", "star-koi shoal", "fire-moths",
  "glow-jellies" are all the SAME 7-bird flock geometry in `js/ambient.js`, reskinned by
  `fauna:{color,scale,flap}`. The comments oversell what the code delivers.
- **A real paint bug compounds the Sanctuary/Wastes overlap:** the shared archetypes
  hardcode their material to Sanctuary verdigris — `build()` calls `mergeParts([...], 0)`
  (`js/environment.js:138,159,177`) — so columns/slabs/domes render verdigris even while
  standing in the Amber Wastes. (The archetype `matIndex` field is dead metadata for ALL
  archetypes — it is never read; every `build()` hardcodes the index it passes to
  `mergeParts`. Don't assume it drives anything.)
- Only **three truly bespoke features** exist: Caldera's rising embers
  (`ambient.fall: -2.2`, `js/biomes.js:92`), Astral's sky-whale (`whale: 1`,
  `js/biomes.js:120`), Sanctuary's gull flyby (`faunaFlyby: true`, `js/biomes.js:44`).

**The two industry rules this plan is built on** (from the research pass):
- **The Alto's Odyssey rule:** every biome must own a MECHANIC, not just a look ("each
  area designed to feel distinct to PLAY, not a purely visual change").
- **The SotC / Monster Hunter rule:** the biome's signature hazard IS its boss's weapon;
  minions/ambience are "children" of the boss so the zone reads as one ecosystem.

`BOSS-DESIGN.md §5h` already specs the pairing (Home-biome column, foreshadow artifacts)
— it was deferred on the assumption it needed the ladder controller. **It doesn't** (§6).

## 2. THE FIXED CONTEXT EVERY BIOME DESIGNS AGAINST (engine facts)

- **`js/biomes.js` is the single source of truth.** Flat `BIOMES[]` config;
  `computeEnv(dist)` (`:167`) lerps ~20 color/scalar fields between the two adjacent
  biomes into ONE reused scratch `env` object (`:153` — callers consume, never retain).
  `biomeAt(dist)` (`:134`): `block = floor(dist/1500)`, index `= block % BIOMES.length`,
  crossfade `t` over the last 150m (`config.js:145-146` `biomeLength`/`biomeTransition`).
  `biomeIndexAt(dist)` (`:146`) returns the DOMINANT biome (`t<0.5 ? ia : ib`) for
  discrete per-instance decisions. **Atmosphere blends; instances never do.**
- **The `xMix` pattern is how bespoke features stay safe.** `starMix`/`whaleMix`/
  `flybyMix` (`js/biomes.js:162,193-195`) are lerped 0→1 gates consumed as branchless
  multiply-by-zero terms. Every new per-biome feature gets an `xMix` defaulting to 0 —
  free where zero, crossfades at seams by construction.
- **The prop recycler** (`js/environment.js`): one `InstancedMesh` per archetype;
  `ARCHETYPES[key] = {step, biomes:[indices], matIndex, build(), place()}` (`:119`);
  `WALL_WINDOW = 900` (`:24`); instances outside their archetype's `biomes` whitelist
  are PARKED — scaled to ~0.0001 at y=-50 in `writeMatrix` (`:378`) but still submitted;
  `recycleBand` (`:392`) leapfrogs instances >100m behind to +900 ahead. `mergeParts`
  (`:106`) merges an archetype to **at most 2 material groups** (a part with `mat >= 2`
  THROWS at build time — the cap is hard, not lossy). `frustumCulled=false` is
  deliberate (bounding sphere at origin) — the correct
  per-band kill switch is `mesh.visible`, never frustum culling.
- **There is no terrain.** The floor is the endless water plane (`js/water.js`), one
  shader in two variants (reflective / cheap), tinted per-frame via `setWaterTint`
  (deep/shallow/sun/horizon/zenith colors + the single scalar `waveAmp`). New water
  uniforms MUST be added to `sharedUniforms` (`water.js:19`) or they won't survive the
  tier rebuild (`:206-209`).
- **The determinism contract is narrow and exactly specified.**
  `tests/gold-determinism.mjs:15` fixtures ONLY `out.rings`, `out.obstacles`,
  `out.goldEmbers` (JSON-stringify compared). Player kinematics are never fixtured; there
  is no replay/ghost system. Two rules follow: (1) never add calls to the main `rnd`
  stream (`level.js:36`); (2) never add fields to ring/obstacle/gold elements. New
  content goes in NEW output arrays on INDEPENDENT RNG streams — the proven precedents
  are `goldRnd = mulberry32((seed ^ 0x6b79d8a1) >>> 0)` (`level.js:44`),
  `canyonRnd = mulberry32((seed ^ 0x2f9b4e17) >>> 0)` (`level.js:49`), and the
  `overlayCanyons(out)` post-pass (`level.js:488`, called at `:475`) whose header comment
  states the invariant: it never reads/writes `rnd`, rings, obstacles or golds.
- **The sky dome shader** (`js/environment.js` skyMat) already has branchless
  multiply-by-zero feature gates (`feverMix` aurora, `starMix` starfield). It has
  `fog: false` and `depthWrite: false` — pure background, renders in the base pass, so
  sky effects survive ALL postfx tiers unchanged.
- **Postfx grading is global and biome-blind** (`js/postfx.js`): `updatePostFX`
  recomputes sat/vig/lift each frame from base constants + fever + kicks + `_bossMix`.
  Tier 0 = full composer; tier 2 = composer OFF and `updatePostFX` early-returns —
  **any biome grading bias silently vanishes on tier 2.**
- **Audio: a full procedural engine EXISTS** (`js/sfx.js`, ~1900 lines): Web Audio bus
  graph, worklet limiter, 35 radio stations (`js/tracks.js`), beat clock + harmony
  oracle, offline render CI (`sfxRender.js`, `tools/loudshots.mjs`). Biome→music wiring
  exists TODAY as `keyShift` per biome (`biomes.js:36,55,72,86,102,118`) applied at
  `main.js:1062` on biome transition, quantized to the loop boundary. Per-biome ambience
  is NEW CONTENT on EXISTING infra, not a new subsystem.
- **Budget truth (measured — see `BOSS-DESIGN.md §2`, do not re-derive):** draw calls are
  NOT a budget axis (415 animated draws ≈ 58fps on a real phone); triangles effectively
  free at our scales; **OVERDRAW IS THE CLIFF** (2 large stacked additive/fresnel shells
  = +50% frame time; fresnel worst case 32fps). `LineSegments` are exempt from the cliff.
  Instancing: fine for the prop recycler (matrices written only on recycle), but NEVER
  animate `instanceMatrix` per-frame (janked a real phone — L124/L126 lineage).
  The authority for "can we afford X" is `tools/stress.html` on a real phone;
  `tools/stress.mjs` gives relative curves headless. `tools/tricount.mjs` covers
  DRAGONS ONLY — there is no env-geometry guard yet (§8 specs one).
- **Danger color is role-locked magenta `0xff2b6a`** across all biomes. Per-biome
  `bullets:{light,mid,dark}` overrides exist for legibility (`biomes.js:15-19`) and are
  gated by `tests/bulletcontrast.mjs`. Every fog/palette/grade change re-runs that gate.
- **No WebGL in CI.** Headless proves determinism/placement/counts; the human judges
  look/motion/feel on the PR preview. Never claim a visual result — stage it for review.

## 3. THE BIOME DESIGN LAWS

1. **One biome = one identity triple: HAZARD + VERB + ANCHOR BOSS.** The hazard is the
   lethal thing native to this biome; the verb is what the player does about it (dodge-
   only for now — owner decision #2); the anchor boss is the creature whose weapon the
   hazard is. A biome missing a leg of the triple must justify it (breather biomes may
   defer the hazard; roaming bosses justify a tenant-not-anchor).
2. **Screenshot-readable.** Each biome must be identifiable from a single frame by
   silhouette + palette alone. If two biomes could swap screenshots, one of them changes.
3. **One exclusive prop silhouette per biome, minimum.** Exclusive beats shared-recolored.
   Shared archetypes are allowed only when tinted per-biome via `instanceColor` (§5.4).
4. **Overlaps resolve by OPPOSITION, not deletion.** Push a twin pair to opposite ends of
   one shared axis: Sanctuary vertical/wet/verdigris vs Wastes horizontal/dry/bleached;
   Frozen hard/near/fog-line vs Astral soft/vast/void; Mire lateral/cool/hanging vs
   Caldera vertical/hot/rising.
5. **Mechanics lerp, they never snap.** Any continuous feel value crossfades through
   `computeEnv` over the 150m seam exactly like color (the L150 law generalized: a value
   that turns on at a boundary must ease from the boundary state). Discrete things
   (hazard spawning, props, materials) hard-switch on `biomeIndexAt` — and a hazard only
   BEGINS past the crossfade band; already-spawned instances play out.
6. **Hazards are magenta; ambience is palette.** Anything lethal telegraphs in role-locked
   magenta and passes `bulletcontrast.mjs`. Anything decorative uses the biome palette.
7. **Determinism is non-negotiable.** Biome visuals key off `biomeIndexAt(dist)`; new
   spawned content rides an independent RNG stream into a new output array; the
   gold-determinism fixture stays byte-identical forever.
8. **The dragon pops in every palette** (Ori rule). If a biome's palette swallows the
   roster's dragons, the biome changes, not the dragons.
9. **Never break the shipped roster.** Every increment coexists behind default-off data;
   absent field = byte-identical behavior. Coexist → prove on the hero → migrate.
10. **Additions must degrade by tier.** Sky effects are tier-free (base pass); grading
    bias dies on tier 2 (acceptable — never load-bearing); particles thin per tier;
    nothing new may add a large additive volume near the ~2-on-screen cap.

## 4. THE FINAL LINEUP — 8 BIOMES

Target cycle order (an emotional arc, not a flat ring — Journey's color-script rule;
final order is human-judgeable on the preview):

**Sanctuary (dusk arrival) → Wastes (noon blaze) → Tidal Reef (bright wet) →
Tempest Reach (the storm turn) → Frozen Reach (cold loneliness) → Emberfall Caldera
(inferno climax) → Lumen Mire (night, biolume hope) → Astral Shallows (cosmos release)
→ loop.**

The loop seam lands darkest→dusk (relief, not repetition). Note: the twin pairs are
de-duplicated by OPPOSITION (Law 4), not by reordering — Sanctuary–Wastes and
Caldera–Mire remain adjacent BY DESIGN (distinctness comes from the retools, not the
order); do not "fix" the cycle to separate them. New biomes slot via the `CYCLE[]`
layer (§5.6) so existing `biomes:[index]` whitelists never renumber.

| # | Biome | Status | Identity (one sentence) | Signature hazard | Verb (deferred kinematics in §10) | Anchor boss | Sensory signature |
|---|---|---|---|---|---|---|---|
| 0 | **Sunken Sanctuary** | RETOOL | Drowned cathedral at dusk | Descending arch-gates | Thread-the-arch | **HOLLOWGATE** (T3, slot 6) | Verdigris ruins, dusk-teal→gold dual-fog, choir pad, temple-swift flyby |
| 1 | **Amber Wastes** | RETOOL | Bleached erosion flats at high noon | Sand-shear sheets sloughing off dunes | Climb the heat (thermal ride, later) | KARNVOW tenant (roams — see §6) | Leaning half-buried monoliths, pale→bleached-white mirage fog, dry wind hiss |
| 2 | **Frozen Reach** | RETOOL | Bone-white spires above a hard fog line | Icicle-fall; icing drag (later) | Dive below the fog line | **MARROWCOIL** (T2, slot 4 — approach `below` IS the fog line) | Sharp faceted spires, altitude fog-band, glassy chimes, hard sleet |
| 3 | **Emberfall Caldera** | KEEP · **HERO** | Basalt rift where everything rises | Geyser bursts from vents | Read the vent rhythm, weave the columns | **ASHTALON** (T2, slot 3 — shipped; its ember-wake IS the biome) | Rising embers, magma-seam glow, predator rumble, fire-moths |
| 4 | **Lumen Mire** | RETOOL | Bioluminescent night canopy | Spore-bursts (vision vignette) | Slalom the light-lanes | THRUMSWARM (T3, slot 7) | Glowcap lanes, overhead spirevine canopy, teal biolume fog, wet ambience |
| 5 | **Astral Shallows** | KEEP · finale | The cosmos shallows | Gravity-wells (magenta cores; pull is a later verb) | Drift the void | **THE UNMASKED** (T5, slot 14 — second-sun landmark seeds here) | Max starfield, sky-whale→lidded-sun landmark, deep drone, star-koi |
| 6 | **Tempest Reach** | **NEW** (with STORMREND retrofit) | The storm that never lands | Telegraphed lightning strikes on a beat | Dodge the flash, hold the calm lanes | **STORMREND** (T1, slot 2 — shipped; constrict P3 = "the storm closes in") | Storm-teal sky, LineSegments lightning, hard rain motes, thunder-on-beat |
| 7 | **Tidal Reef** | **NEW** (with BRINEHOLM) | The breathing shallows | Waterspouts + rogue swell crests | Skim the lee of the swells | **BRINEHOLM** (T3, slot 8 — the environment-wakes archetype gets its stage) | Kelp-black/abalone water tint, reef-stack props, tidal drone, skimmer-rays |

### Per-biome design sheets

**0 · SUNKEN SANCTUARY → HOLLOWGATE.** Keep the verdigris ruins vocabulary (`tower`,
`archruin` are already exclusive) — they are proto-cathedral. De-duplicate from Wastes by
(a) the `instanceColor` tint fix (§5.4), (b) eventually pruning shared archetypes so
Sanctuary's skyline is tower+arch dominated. Retool the gull flyby into the biome's
foreshadow channel (§6). Fog: warm verdigris near → deep teal-indigo far. HOLLOWGATE's
horizon-arch presence (a fog-exempt landmark, the sky-whale pattern) arrives with its
Tier-3 build, not before. KNELLGRAVE (slot 10) is a lore tenant (bell toll = audio
foreshadow precedent), not the anchor.

**1 · AMBER WASTES.** The near-duplicate earns its keep by opposition: HORIZONTAL where
Sanctuary is vertical. Exclusive prop: retool `obelisk` placement + add a leaning
half-buried monolith-field archetype (`biomes:[1]` only). Drop `column`/`slab`/`dome`
from Wastes' whitelists once its exclusive props land (interim: instanceColor sandstone
tint). Fog: pale amber near → bleached white far (mirage). It is the cycle's BRIGHT
BREATHER — preserve `sunI` as the brightest sky; do not darken it. Hazard (later
increment): magenta shear-sheets sloughing across the lane. No anchor boss: KARNVOW
(slot 9) is explicitly anti-biome (a duelist wearing other bosses' trophies) and roams —
a designed exception under Law 1, and the Wastes is his most common hunting ground.

**2 · FROZEN REACH → MARROWCOIL.** The de-Astral move: Frozen owns the FOG LINE as a
playable surface — a hard horizontal fog band the player dives under; MARROWCOIL's
`approachFrom: 'below'` (`bossDefs.js:275` — rises through the fog line) makes the
biome's defining feature the boss's entrance. Retint ice spires toward bone-white (they read as half-buried ribs —
foreshadowing the skeleton). Cold ice-blue pinlight glints under the fog in the biome
before its encounter. Ambient snow stays (hardest `fall`).

**3 · EMBERFALL CALDERA → ASHTALON (THE HERO BIOME).** Everything here already rises
(`ambient.fall: -2.2`); the biome is half-built for its boss. Geyser hazard: vents
(archetype `vent` already exists) get timed magenta-cored ember-column bursts —
dodge-only. ASHTALON's stoop/dive setpieces read as the apex predator of the ember
updrafts; its ember-wake and the biome's rising embers are one system. Fauna (later):
fire-moths stay; add ash-crows riding thermals (boss's "children"). Weather (deferred,
§10): eruption events grade the sky hotter — which is also EMBERTIDE's foreshadow
channel.

**4 · LUMEN MIRE → THRUMSWARM.** The de-Caldera move: Mire owns LATERAL, COOL, HANGING
(vs Caldera's vertical hot rising). Push `spirevine` into an overhead canopy the lane
passes under (foreground occlusion = free depth). Glowcap caps mark safe light-lanes
(Ori lineage). Ambient glow-motes begin to CLUMP and pulse in the biome before a
THRUMSWARM encounter (proto-murmuration foreshadow). Faint violet dust ties to Voidmaw
lore. Deliberately the breather biome — hazard (spore-burst vignette) is mild.

**5 · ASTRAL SHALLOWS → THE UNMASKED.** Keep as the cycle's payoff. The fog-exempt
horizon-landmark machinery (sky-whale, `ambient.js`) is EXACTLY the pattern the Apex's
persistent second-sun needs — generalize the slot so a biome can declare its landmark
(whale today; the lidded sun joins from mid-game per `BOSS-DESIGN.md §5b` slot 14).
Gravity-wells appear first as visual set-dressing with magenta cores (dodge-only);
their pull is the flagship deferred verb (§10). WEFTWITCH (slot 11) is a tenant (her
mended sky-tear lives here).

**6 · TEMPEST REACH → STORMREND (NEW — ships with the STORMREND retrofit).** The biome
the roster has demanded since slot 2 shipped: `BOSS-DESIGN.md §5j` staged retrofit
already specs storm-teal grade + sheet-lightning pulses + thunder on `bossStart`. The
biome generalizes that moment: lightning strikes on a telegraphed rhythm (magenta
pre-flash glow → white `LineSegments` bolt — exempt from the overdraw cliff), rain-streak
motes (`fall` very high), storm-teal sky via a `flashMix`-style gate. Thunder rides the
beat clock (`sfx.js getBeatClock`) so the biome's ambient rhythm and its boss's attack
rhythm share one source — hazard-is-the-boss's-weapon, literally. THUNDERGRAVE (reserve)
and EMBERTIDE (slot 13, the sunset that shifts the sky a biome early) both stage from
here. Palette: bruised grey-violet + storm-teal, gold cloud-rims (STORMREND's teal/gold).

**7 · TIDAL REEF → BRINEHOLM (NEW — ships with BRINEHOLM).** The cheapest new biome in
the game: the floor is ALREADY an endless ocean — no biome uses it as SUBJECT yet.
`setWaterTint` kelp-black/abalone, `waveAmp` high, reef-stack + kelp-spire archetypes
(`biomes:[7]`), spume motes drifting sideways (`sway` high, `fall≈0`). Waterspout
hazards: magenta-collared spouts, dodge-only. A kelp-black ridge paces the horizon
before the encounter — then BRINEHOLM wakes it (the §5b environment-wakes beat: the
biome IS the boss asleep). Fauna (later): skimmer-rays that break the surface.

## 5. THE IDENTITY SYSTEM (architecture — how a biome expresses its identity as data)

Everything below is data + one pure lookup + reuse of proven seams. No new subsystems.

### 5.1 The `BIOMES[]` schema extension (`js/biomes.js`)

Add OPTIONAL blocks to biome entries. **Absent block = today's behavior, byte-identical**
— that is the coexistence mechanism for the whole arc.

```js
// ILLUSTRATIVE — the FULL schema shown on one entry. A real PR adds ONLY the
// field(s) its §7 increment ships (tags below). Do not add fields ahead of
// their increment.
{
  name: 'EMBERFALL CALDERA',
  // ... existing fields unchanged ...
  anchor: 'ashtalon',            // INC 1 · §6 — Home-biome column. null/absent = no anchor.
  fogFarColor: C(0x1c0a08),      // INC 2 · §5.2 dual-fog FAR COLOR, a THREE.Color via C()
                                 //   like every other biome color. Absent → fog.color.
                                 //   ⚠ NAME TRAP: `env.fogFar` already exists and is a
                                 //   DISTANCE (lerped from fog.far, biomes.js:156/177;
                                 //   also a water uniform, water.js:30). Never abbreviate
                                 //   this field to `fogFar`.
  grade: { sat: 0, vig: 0, lift: 0 }, // INC 2 · §5.5 additive grading bias. Absent → zeros.
  hazard: {                      // INC 3 · §5.3
    type: 'geyser',
    every: [140, 260],           //   [min,max] METRES between vent sites along the course
    warn: 1.1,                   //   SECONDS of magenta telegraph before a burst
    radius: 3.2,                 //   collision radius, world units
  },
  foreshadow: { kind: 'glint' }, // INC 4 · §6 — the ONE artifact this biome's boss owns:
                                 //   'glint' | 'audio' | 'skyGrade' | 'landmark'
  bed: 'caldera',                // INC 5 · §5.7 ambience-bed key. Absent → no bed.
  mech: { gravityMul: 1, dragMul: 1, handlingMul: 1, ambientLift: 0 }, // DEFERRED · §10 —
                                 //   SCHEMA ONLY; ship neutral values (1/1/1/0).
}
```

Wiring rule (THE universal gotcha): every new continuous field needs THREE touches or it
silently does nothing — (1) the field in `BIOMES[]`, (2) a lerp line in `computeEnv`
(`biomes.js:167`, writing into the scratch `env` at `:153` — extend the scratch object
literal too), (3) a consumer copy in `updateEnvironment` (`environment.js`, the block
that fans `env.*` out to uniforms/fog/lights). Forgetting (2) or (3) leaves a stale
uniform and NO error. Follow the `starMix`/`whaleMix`/`flybyMix` lines as the template.

Continuous fields (colors, scalars, `mech.*`) LERP. Discrete fields (`anchor`, `hazard`
spec, `bed`, prop whitelists) switch on `biomeIndexAt`. That split is Law 5.

### 5.2 Dual-color fog (verdict: feasible-with-care)

`THREE.Fog` is single-color (created `environment.js:273`, driven `:442-444`), and the
water shader re-implements the same fog manually (`water.js:125-127`) fed from scene fog
(`:223-227`). Full scene-wide dual fog would require patching `<fog_fragment>` in every
material — DON'T start there. The 90% version:

1. Add `fogFarColor` per biome (a `C()` color — see the §5.1 name-trap note);
   `computeEnv` lerps `env.fogFarColor` with fallback `fogFarColor ?? fog.color`
   (absent = identical to today).
2. Sky dome: blend its horizon band toward `env.fogFarColor` (it's the far-field
   backdrop — this is where "far fog color" actually lives visually).
3. Water: add a `fogFarColor` uniform to `sharedUniforms` (`water.js:19` — MUST be in
   `sharedUniforms` to survive tier rebuilds) + one extra `mix` on the existing
   `smoothstep(fogNear, fogFar, dist)`, AND pass the value through at the
   `setWaterTint`/fog call site in `updateEnvironment` (`environment.js:449-456`) —
   the §5.1 three-touch rule applies to water uniforms too.
4. Scene `THREE.Fog` keeps the NEAR color. Near props fade to near-color, the backdrop
   carries the far color — reads as a gradient at a fraction of the cost.

Gotcha: scene fog and water fog must be updated together or they visibly diverge. And
repeat the name trap once more, because it WILL bite: `fogFarColor` is a COLOR;
`env.fogFar` / the water `fogFar` uniform are DISTANCES. Never mix the two.

### 5.3 RNG-safe hazard injection (verdict: feasible; the pattern is proven)

Copy `overlayCanyons` exactly (`level.js:488`, invoked at `:475`):

```js
// level.js — beside goldRnd (:44) and canyonRnd (:49):
const hazardRnd = mulberry32((seed ^ 0x3d81c94b) >>> 0); // any NEW constant,
                                                          // distinct from 0x6b79d8a1 / 0x2f9b4e17
// in ensure()'s out literal: add  hazards: [],
// at the end of ensure(), after overlayCanyons(out):
overlayBiomeHazards(out);   // reads out.rings for placement context if needed;
                            // NEVER reads/writes rnd, rings, obstacles, goldEmbers.
```

`overlayBiomeHazards` walks the newly generated distance range; for each candidate
station it calls `biomeIndexAt(dist)` and consults that biome's `hazard` block; rolls
placement from `hazardRnd` only; pushes `{dist, x, y, type, phase, ...}` into
`out.hazards` (`phase` rolled from `hazardRnd` at placement — see the burst model).

**Runtime home: a NEW `js/hazards.js` module** owns the hazard meshes, the per-vent
timing loop, the telegraph FX, and the collision test (follow `obstacles.js`'s
collision pattern). `main.js` consumes `out.hazards` inside its `spawnAhead` flow the
way it consumes canyon segments/orbs (see `addCanyonSegment` dispatch and
`pendingCanyonStarts`/`pendingCanyonEnds` at `main.js:153-154` for the
crossing-trigger pattern) — and CRUCIALLY, below the existing
`if (game.inBoss) return` (`main.js:165`) and the grace-band early-return
(`main.js:170-175`). That placement IS the boss/grace suppression rule: generation in
`level.js` stays game-state-pure (it runs ahead of time and must never read game
state); suppression is purely a consumption-side concern.

**The burst model (geyser):** each placed vent runs a fixed loop on game time —
`warn` seconds of magenta-cored telegraph → ~0.8s lethal burst → idle — phase-offset
per vent by its placement `phase` so vents don't fire in lockstep. Fairness: a
telegraph must be readable ≥90m out at max approach speed. Telegraph FX are hazards.js's
own small particle burst — do NOT reuse `addEmberLine` (those are collectibles) or the
ambient biome motes (`ambient.js` — those are scenery).

Hard rules (each one has bitten before):
- A hazard only BEGINS where `biomeIndexAt(dist)` matches AND `local > biomeTransition`
  (no hazard born inside the 150m crossfade); spawned instances play out (Law 5).
- **`resume(target)` (`level.js:632-639`) must reset any hazard cursor state** — it
  already reseats `nextGoldAt`/`untilGauntlet`/canyon state after a boss; a forgotten
  `nextHazardAt` misaligns everything post-fight.
- Suppression during `game.inBoss` (clean-arena law) and the post-boss grace band
  lives in `main.js`'s consumption (see "Runtime home" above) — NEVER in `level.js`
  generation, which must stay game-state-pure.
- Dodge-only for now (owner decision #2): hazards intersect the player like obstacles;
  they never apply force. (When verbs unlock — §10 — forces go in `player.update`,
  which is determinism-safe because the fixture never covers kinematics.)
- Respect the reachability audit: hazards must never make a ring/gate uncatchable —
  keep them off the tight late-game lines or sanity-check with `?debug=reach`.
- Determinism proof for every hazard PR: `tests/gold-determinism.mjs` stays green,
  byte-identical.

### 5.4 The recycler: exclusive props, the visible-gate, and the instanceColor fix

Three changes, ordered by leverage:

1. **The verdigris bug fix + per-instance tint.** Give shared archetypes
   (`column`/`slab`/`dome`) an `instanceColor`: in `writeMatrix` (`environment.js:378`),
   set the instance's color from a per-biome tint table keyed on
   `biomeIndexAt(d.dist)`; flag `instanceColor.needsUpdate` everywhere
   `instanceMatrix.needsUpdate` is flagged (band build, `recycleBand`, `reseedBand`).
   The prop-detail shader already multiplies `diffuseColor.rgb`
   (`environment.js:56-57`), so the tint composites for free. Zero new draw calls.
   This kills "verdigris columns in the amber desert" immediately.
   **Tint semantics (get this right or ship a silent regression):** `instanceColor`
   MULTIPLIES the material's base color. The biome-0 table entry is therefore identity
   WHITE `0xffffff` — writing the verdigris hex would SQUARE the color and darken
   Sanctuary while every test stays green. Other entries are per-channel ratios,
   target ÷ base (e.g. sandstone `0xe2bd8a` ÷ verdigris `0x86b39c`; components > 1 are
   legal). Call `setColorAt` once per instance at band build — `mesh.instanceColor` is
   null until the first call allocates it. Caveat: one instance color spans BOTH
   material groups of a merged archetype; derive the ratio from the primary pair and
   accept the accent shift as approximate.
2. **The band visible-gate.** Recompute activity over ALL of `band.data` per
   `recycleBand` call (`recycleBand` alone only visits instances that fell behind —
   a counter or full scan is needed), and set `band.mesh.visible` accordingly. Also
   evaluate the gate in `makeBand` and `reseedBand` (the restart path,
   `environment.js:408`) or a band can start invisible / go stale after
   `resetEnvironment`. Since `WALL_WINDOW` (900) < `biomeLength`
   (1500), at most 2 biomes are ever in-window → per-frame prop draws collapse to the
   2 live biomes' archetypes regardless of the global archetype count. This decouples
   "how many exclusive silhouettes exist" from per-frame cost — the unlock for Law 3.
   (Draw calls aren't the cliff — `BOSS-DESIGN.md §2` — but free is free, and it keeps
   the prop system scalable to 8 biomes × exclusives.)
3. **Exclusive archetypes per biome.** New `ARCHETYPES` entries with `biomes:[n]`,
   `build()` + `place()`, ≤2 materials (the `mergeParts` cap). New biome mats extend
   `makeMats` primary/accent arrays (indices 6, 7). Registration is pure-additive and
   determinism-free (props are render-only).

### 5.5 Per-biome sky effects & grading bias

- **Sky effects (verdict: CHEAP — the best lever).** Ride the `feverMix`/`starMix`
  pattern: per-biome field → `computeEnv` lerp → uniform → one branchless
  multiply-by-zero term in the sky fragment shader. `time` is already a uniform, so
  animated effects (lightning flash impulses, heat shimmer) are free. Tier-independent.
- **Grading bias (verdict: feasible-with-care).** `updatePostFX` REBUILDS sat/vig/lift
  from constants every frame — a bias must be injected as an additive term inside those
  expressions (the `_bossMix * 0.10` idiom), NEVER written to the uniform directly
  (overwritten next frame). Neutral bias (zeros) must be byte-identical. Compute the
  bias unconditionally, apply it only inside the `postfx.enabled` block (tier-flap
  discipline). **It dies on tier 2** — acceptable, never load-bearing (Law 10).

### 5.6 The `CYCLE[]` layer (how 8 biomes slot in WITHOUT renumbering anything)

The blocker for adding biomes is not `BIOMES.length` (course gen never reads it) — it's
that every `biomes:[index]` whitelist, `matIndex`, `PHASE_SKINS[i]`, `mats.body[i]`, and
setpiece `PALETTES[i]` is keyed by ARRAY INDEX. Reordering `BIOMES[]` would renumber the
world. So: **never reorder — append + add an order layer.**

```js
// biomes.js — BIOMES[] becomes append-only (indices are IDs, stable forever).
// New: the play order, decoupled from array order:
const CYCLE = [0, 1, 7, 6, 2, 3, 4, 5];  // sanctuary, wastes, reef, tempest,
                                          // frozen, caldera, mire, astral
                                          // (yes, 7 before 6 — Reef precedes Tempest
                                          //  in the arc; do not "correct" the order)
// biomeAt(dist): block = floor(dist/L); ia = CYCLE[block % CYCLE.length];
//                ib = CYCLE[(block+1) % CYCLE.length];  (t unchanged)
```

`computeEnv`/`biomeIndexAt` are downstream of `biomeAt` and need no other change. Props,
skins, mats, bullets all keep their indices. Ship the `CYCLE` layer as a pure refactor
FIRST (with `CYCLE = [0,1,2,3,4,5]` — provably identical output), THEN append biome 6/7
entries when their bosses are ready. Headless-diff `computeEnv` samples across a full
old cycle to prove the refactor is a no-op before flipping anything.

This is also where the deferred weather×time-of-day multiplier lives later (§10):
`CYCLE` entries can become `{biome, weather, tod}` descriptors with an `applyWeather`/
`applyTOD` modifier pass after the lerp — same fields, nudged. Do NOT build that now:
**increment 6 ships plain integers**, no future-proofing objects.

### 5.7 Per-biome ambience beds (owner decision #3)

Layer, never replace. The design:
- A `bed` key per biome (§5.1) mapping to a small procedural ambience generator in
  `sfx.js` (noise-shaped wind, filtered rumble, thunder one-shots on the beat clock,
  tidal swell LFO — all synthesized, no samples, consistent with the engine).
- Routed to a NEW quiet ambience gain node feeding the existing music bus chain —
  UNDER the radio in the mix (beds sit ~-18 LUFS relative; the station always wins).
- Crossfade beds over the biome seam (~2s), triggered from the same place `keyShift`
  fires (`main.js:1062`) — but beds may fade immediately (ambience isn't pitched;
  loop-boundary quantization is only needed for musical material).
- Hard contracts inherited from the audio overhaul (L151/L152): degrade to null when
  muted/backgrounded/headless (gameplay must never depend on audio); anything musical
  routes through `compileTrack` paths so loudness CI (`tools/loudshots.mjs`) still
  measures truthfully; seed any randomness (`mulberry32`), never `Math.random()`.

## 6. BOSS↔BIOME COUPLING (implementing the deferred §5h — the cheap way)

**The discovery that unlocks this arc:** `BIOMES[]` and `biomeIndexAt` are pure
render-side functions of distance, fully decoupled from `level.js`'s RNG. The pairing
everyone assumed needed the lifetime-ladder controller needs only a pure lookup:

```js
// js/biomeBoss.js (NEW, ~30 lines)
import { BIOMES, biomeIndexAt } from './biomes.js';
import { CONFIG } from './config.js';

export function bossForBiome(bi) { return BIOMES[bi]?.anchor ?? null; }   // INC 1

// INC 4 (not increment 1 — don't build it early). Until §5.6's CYCLE layer
// lands, the body is literally biomeIndexAt(dist + CONFIG.biomeLength);
// swap to the CYCLE-aware form in increment 6.
export function nextBiomeBoss(dist) {
  const next = biomeIndexAt(dist + CONFIG.biomeLength);
  return { key: bossForBiome(next), biome: next };
}
```

**The exact seam (increment 1).** The selection ternary at `boss.js:627-629` is
`defOverride || (rushMode ? … : (debugDefIdx != null ? … : bossDefForIndex(encounterIndex)))`.
The biome preference replaces ONLY the final `bossDefForIndex(encounterIndex)` arm
(normal encounters) — `defOverride`, `rushMode`, and `debugDefIdx` paths are untouched,
and so is the second `bossDefForIndex` call at `boss.js:1752` (debug start).

**The algorithm, pinned** (write it as a pure function
`pickBossKey(moduloKey, biomeIndex, lastBossKey)` so `BOSS-DESIGN.md §5h`'s eventual
slot-6 ladder controller can call it unchanged with a different `moduloKey` source):

1. `preferred = bossForBiome(biomeIndex)`; use it iff it is non-null, is in
   `BOSS_ORDER` (coded), and `!== lastBossKey`.
2. Else `moduloKey` (= `BOSS_ORDER[encounterIndex % BOSS_ORDER.length]`) — and if
   THAT `=== lastBossKey` (a biome pick earlier can make the modulo land on the same
   boss next), step once: `BOSS_ORDER[(encounterIndex + 1) % BOSS_ORDER.length]`.
3. A biome pick does NOT advance `encounterIndex` (it keeps counting defeats only —
   `boss.js:761`).
4. `lastBossKey` is a module-level variable set in `startBossEncounter` on EVERY path
   (normal/rush/debug), reset alongside `encounterIndex` (`boss.js:1712-1713`).

Rules:

- **Null-safe fallback is the coexistence guarantee**: with only Caldera carrying an
  `anchor`, every run outside Caldera is byte-for-byte the shipped experience.
- Selection stays OFF the level RNG stream (boss.js already runs its own timing:
  `nextBossDist = player.dist + interval + Math.random()*jitter` — biome preference
  reads state, it does not add RNG calls to the course generator).
- Do NOT build the lifetime-ladder controller (`BOSS-DESIGN.md §5h` decision 1) in this
  arc. The biome boundary IS the foreshadow schedule; band progression stays modulo.
- Bullet legibility per biome is already handled (`resolveBand`, `boss.js:383,638`).
- Verifying "meet ASHTALON in Caldera" does NOT mean flying 4.5km per attempt: use the
  debug seams (`debugDefIdx`, the debug start at `boss.js:1752`) plus a temporary
  dist warp, then confirm once end-to-end on the preview.

**The Home-biome column** (value/temperature complements verified against §5b palettes):

| Anchor | Home | Read check |
|---|---|---|
| HOLLOWGATE (ivory near-white) | 0 Sanctuary (dusk dark) | sanctioned VALUE inversion — pale boss over dark sky |
| — (KARNVOW roams) | 1 Wastes | dark duelist over the cycle's brightest sky when he appears |
| MARROWCOIL (bone-white, ice pinlights) | 2 Frozen (cold dark) | pale-over-dark; `below` approach = the fog line |
| ASHTALON (charcoal + molten slit) | 3 Caldera (lit ember sky) | dark silhouette against glow |
| THRUMSWARM (void-black + star-points) | 4 Mire (biolume night) | glow-shape (points) carries it |
| THE UNMASKED (black disc + corona) | 5 Astral (darkest) | corona-ring on starfield |
| STORMREND (teal/gold mandala) | 6 Tempest (storm dark) | bright rings vs bruised cloud |
| BRINEHOLM (kelp-black + abalone) | 7 Reef (abalone water) | iridescent sheen vs matte swell |

Unanchored by design: VOIDMAW (tutorial — teaches the duel before the game teaches
place), EITHERWING/ONEWING (the formation is the arena; ONEWING's placeless jump-scare
is the point), WEFTWITCH (Astral tenant), EMBERTIDE (a world-state EVENT that grades any
biome's sky — anchoring it would shrink it), KNELLGRAVE (Sanctuary lore-tenant).

**Foreshadowing** (each anchor owns exactly ONE artifact — §5h lists glint/audio/
sky-grade; `landmark` is this doc's addition, the sky-whale slot generalized): because
`biomeIndexAt(dist + biomeLength)` is deterministic, the CURRENT biome can stage the
NEXT biome's anchor via `nextBiomeBoss(dist)`, wired to existing channels only —
`glint` → a SECOND flyby profile in `ambient.js` with its own foreshadowMix gate
computed from `nextBiomeBoss` (do NOT retint the biome-0 gull or touch `faunaFlyby`);
`audio` → a distance-triggered cue through `sfx.js` (KNELLGRAVE's toll pattern);
`skyGrade` → the `bossGradeTarget` postfx channel (EMBERTIDE's pattern); `landmark` →
the fog-exempt horizon slot (sky-whale pattern, `material.fog = false`). No new
draw-call categories. **The glint is atmosphere, not a promise:** encounters are
interval-scheduled (`nextBossDist`), so a glint may precede a stretch whose encounter
doesn't land in the home biome — that is ACCEPTED; do not add a `nextBossDist` range
check.

## 7. THE ROLLOUT — PR-sized increments (coexist → prove on the hero → migrate)

**Hero: Emberfall Caldera + ASHTALON.** Highest existing affinity (rising embers, vents,
a shipped boss with the right identity), cheapest tier to prove the coupling, and the
hazard-is-the-boss's-weapon payoff lands with zero new boss work.

Each increment = one PR + one ledger lesson. Verification legend: **D** = determinism
(`tests/gold-determinism.mjs` byte-identical), **C** = `tests/bulletcontrast.mjs`,
**T** = `tools/tricount.mjs --ci` (dragons unaffected — should be trivially green),
**H** = human judges on the PR preview (mandatory for any visual/feel claim),
**A** = full headless suite (`tests/run-all` or repo equivalent).

| # | Increment | Files | Coexistence guarantee | Verify |
|---|---|---|---|---|
| 1 ✅ | **Bind ASHTALON→Caldera** (shipped 2026-07-06, L179 — note: the §5h ladder had landed by build time, so the ladder's proposal is now the `moduloKey` source, and `peekNextDef` mirrors the pick). `anchor:'ashtalon'` on Caldera only; new `biomeBoss.js`; spawn-site prefer-with-fallback + anti-repeat | `biomes.js`, `biomeBoss.js` (new), `boss.js` | all other biomes `anchor` absent → ladder fallback; outside Caldera byte-identical | D, A, H (meet ASHTALON in Caldera; pacing feels right) |
| 2 ✅ | **Caldera visual kit + recycler upgrades** (shipped 2026-07-06, L180 — one PR; note: the SKY blend needs a lerped `fogFarMix` gate on top of the `?? fog.color` fallback, or fallback biomes' horizons would shift toward fog.color). `fogFarColor` on Caldera (+ fallback plumbing — mind the §5.1 name trap); `instanceColor` tint fix for `column`/`slab`/`dome` (§5.4 tint semantics: biome 0 = identity white); band visible-gate | `biomes.js`, `environment.js`, `water.js` | `fogFarColor ?? fog.color` fallback; biome-0 tint is `0xffffff` so Sanctuary is byte-identical (only biome 1 changes — that's the bug fix); visible-gate is render-only | C, A, H (dual-fog depth; sandstone props in Wastes; no prop pop-in) |
| 3 ✅ | **Geyser hazards (dodge-only) in Caldera** (shipped 2026-07-06, L184). `hazard` block on Caldera; `hazardRnd` (`^0x3d81c94b`) + `out.hazards` + `overlayBiomeHazards` (cursor walk, third independent stream) in level.js; NEW `hazards.js` owns meshes/timing-loop/telegraph/collision (§5.3 "Runtime home" + burst model, damage via `collision.hitPlayer` = zero knockback); `main.js` consumes below the inBoss/grace returns; `resume()` + bossStart reset | `biomes.js`, `level.js`, `hazards.js` (new), `main.js`, `config.js` | hazards only spawn where `biomeIndexAt===3`; other biomes have no `hazard` block; fixture byte-identical | **D (the critical one)**, C, A, H (fair telegraphs, dodgeable, fun) |
| 4 | **Foreshadow ASHTALON a biome early.** `foreshadow:{kind:'glint'}`; `nextBiomeBoss()` (placeholder body until inc 6 — see §6 code note); a charcoal wing-silhouette + molten-slit glint as a SECOND flyby profile with its own gate (§6 — do not touch the gull/`faunaFlyby`) | `biomeBoss.js`, `biomes.js`, `ambient.js` | glint only fires when next biome's anchor is coded; new gate defaults to 0 everywhere | A, H ("what is THAT?" reads at a glance) |
| 5 | **Caldera ambience bed.** `bed:'caldera'` (filtered rumble + ember crackle) routed into a new quiet gain feeding `musicBus` (built in `buildBusGraph`, `sfx.js:51,141-205`), seam crossfade, null-safe when muted/headless; add a loudshots baseline entry so the −18-LUFS-relative claim is measured, not asserted | `biomes.js`, `sfx.js`, `main.js` | bed key absent on other biomes; radio pillar untouched; degrades to null | A + `tools/loudshots.mjs`, H (mix sits under the station) |
| 6 | **`CYCLE[]` refactor (no-op).** Order layer with `CYCLE=[0..5]`; headless env-diff proves identical output | `biomes.js` | provably identical `computeEnv` output across a full cycle | A + a one-off env-diff script, D |
| 7 | **Migrate the visual kit biome-by-biome.** Per-biome `fogFarColor`; one exclusive archetype each (Wastes monolith-field first — then prune its shared props); Frozen bone-white retint; Mire canopy pass; grading-bias fields; kill the fake-fauna reskin by introducing 1–2 real flock profiles per PR | `biomes.js`, `environment.js`, `ambient.js`, `postfx.js` | one biome per PR; absent fields = unchanged; **build `tools/envcount.mjs` (§8) in the FIRST of these PRs** | C, A, envcount, H per biome (side-by-side tiershots for the old twin pairs) |
| 8 | **Tempest Reach** (append `BIOMES[6]`; CYCLE becomes `[0,1,6,2,3,4,5]` — the interim order until Reef lands) — WITH the STORMREND `warnGrade` retrofit (`BOSS-DESIGN.md §5j`); lightning hazard = increment-3 machinery with a `strike` type; `anchor:'stormrend'` | `biomes.js`, `environment.js`, `level.js`, `hazards.js`, `sfx.js`, `bossDefs.js` | new biome ships only with its anchor; CYCLE insert leaves indices stable | D, C, A, H |
| 9 | **Tidal Reef** (append `BIOMES[7]`; CYCLE becomes the final `[0,1,7,6,2,3,4,5]`) — ships WITH BRINEHOLM (slot 8, its own boss-session per `BOSS-DESIGN.md §5d`); waterspout hazard type; `setWaterTint` showcase | `biomes.js`, `environment.js`, `water.js`, `level.js`, `hazards.js` + the BRINEHOLM build | same gate: no orphan biomes | D, C, A, H |
| 10+ | Deferred backlog (§10): kinematic verbs (Caldera geyser-launch first), weather×TOD via `CYCLE` descriptors, per-biome water behavior, remaining anchors as their bosses ship | — | each behind default-off data | per-item |

Sequencing rules: 1→2→3 in order (each proves the next's substrate); 4/5/6 may
parallelize after 3; 7 is N small PRs, not one big one; 8 waits for 6 (needs `CYCLE`);
9 waits for the BRINEHOLM boss build. If an increment's preview verdict is "doesn't
feel right", stop the train and fix — do not migrate a pattern the hero hasn't proven
(that is THE RULE's whole point).

## 8. PERF & DETERMINISM GUARDRAILS

- **Overdraw is the only cliff** (`BOSS-DESIGN.md §2`, measured). Biome FX rules:
  lightning = `LineSegments` (exempt); geyser columns = slim opaque-core + rim-lit
  particles, never an enclosing additive shell; hard cap ~2 large additive volumes on
  screen INCLUDING boss kit — a biome may not spend what the boss fight needs.
- **Draws/tris are not the axis** — but keep the recycler honest: `mergeParts` ≤2 mats,
  the visible-gate keeps off-biome bands free, and never animate `instanceMatrix`
  per-frame (flocks animate in the vertex shader with per-instance phase).
- **`tools/envcount.mjs` (build in increment 7, first PR):** mirror `tricount.mjs`'s
  headless harness (DOM/canvas shims + `three-resolver.mjs`); import the environment
  builders; assert per-biome (a) archetype instance counts, (b) tris per archetype,
  (c) **count/flag additive `depthWrite:false` surfaces — the number that actually
  matters**; `--ci` exits 1 on overage. Note `stress.html` deliberately avoids importing
  `environment.js` (heavy construction deps) — expect to add shims.
- **Determinism (the non-negotiables):** never call the main `rnd`; never add fields to
  ring/obstacle/gold elements; new content = new array + new XOR'd `mulberry32` stream;
  reset cursors in `resume()`; suppress during `inBoss` + grace band;
  `gold-determinism.mjs` green on every PR that touches `level.js`.
- **Tier degradation:** sky effects tier-free; grading bias dies on tier 2 by design;
  particle densities scale down with tier; new water uniforms live in `sharedUniforms`
  or they vanish on tier flips.
- **Every palette/fog/grade change re-runs `bulletcontrast.mjs`.** The danger band must
  win in all 8 biomes, all weather states, forever.

## 9. VERIFICATION WORKFLOW (all from `reforged/`)

1. `node tests/gold-determinism.mjs` — byte-identical course for the golden seed.
2. `node tests/bulletcontrast.mjs` — danger/bullet legibility per biome.
3. `node tools/tricount.mjs --ci` — dragon budgets untouched.
4. `node tools/envcount.mjs --ci` — (from increment 7) env geometry + overdraw guard.
5. Full headless suite (run-all) — no regressions.
6. `tools/stress.html` on a real phone via the PR preview — ONLY when adding a new FX
   class (first lightning, first waterspout); add an axis if unsure (§2 of BOSS-DESIGN).
7. **The human on the PR preview** — every visual/feel claim. Post what to look at:
   the biome to fly, the seam to cross, the hazard to dodge, the twin pair to compare.

## 10. DEFERRED BACKLOG (designed, not scheduled — do not build early)

- **Kinematic verbs (owner decision #2's phase 2).** Verified determinism-safe: the
  fixture never covers player kinematics, and `player.js` already applies conditional
  forces (boss wall clamp, `laneMaxY`). Order of adoption when the owner green-lights:
  Caldera geyser-LAUNCH (impulse, the `tryRoll` velocity-kick pattern) → Tempest
  updraft columns (sustained `+vy`) → Astral low-grav + well-pull (`gravityMul`,
  lateral bias) → Frozen icing drag (`handlingMul` decay, shed below the fog line) →
  Reef wave-skim boost (speed bonus near the surface) → Wastes thermal ride. Laws:
  forces lerp via `mech.*` through `computeEnv` (Law 5); modest magnitudes biased along
  the flight line (reachability); suspended in `inBoss` + grace band.
- **Weather × time-of-day multiplier.** `CYCLE` entries become `{biome, weather, tod}`;
  `applyWeather`/`applyTOD` nudge existing `env` fields post-lerp. Each biome's sheet
  (§4) names its variant (haboob, whiteout, eruption, eye-of-storm, bloom-tide,
  eclipse). Every state must re-pass bulletcontrast — it's a QA matrix multiplier;
  that's why it waits.
- **Per-biome water BEHAVIOR** (lava scroll / ice sheen / biolume wake): verdict HARD —
  new shader terms + (for wake) player-position plumbing water doesn't have. Ice sheen
  (one spec scalar) is the cheap first if ever needed. Tint + `waveAmp` until then.
- **Real per-biome fauna rollout** beyond the first profiles (skimmer-rays, ash-crows,
  storm-petrels, frost-moths, lantern-minnows) — vertex-shader flocks, 2 species/biome max.
- **Full-scene dual fog** (patch `<fog_fragment>` across materials) — only if the sky+
  water version (§5.2) proves insufficient on the preview.
- **The lifetime-ladder controller** (`BOSS-DESIGN.md §5h` decision 1) — a boss-arc
  task, not a biome task. The biome seam (§6) is forward-compatible with it.
- **EMBERTIDE/THE UNMASKED world-state beats** — land with their boss builds (Tier 4/5);
  the biome system's landmark + skyGrade channels are their substrate.

## 11. RELATED DOCS & LEDGER

- [`BOSS-DESIGN.md`](./BOSS-DESIGN.md) — §1 canvas, §2 budgets (the measured truth),
  §5b roster registry, §5h production defaults (the Home-biome column this implements),
  §5j entrances (STORMREND's storm retrofit).
- `LEAPFROG.md` ledger lessons that matter here: **L150** (boundary values must ease —
  the seam law's ancestor), **L151/L152** (audio engine contracts: render==live,
  seeded randomness, null-safe degradation), **L166** (this design arc — the
  render-only-`BIOMES[]` discovery), plus the increment lessons from L167 onward.
- After every increment: append the lesson (what/why/gotcha/reusable pattern). This doc
  gets a one-line update per shipped increment (mark the table row ✅) — keep it the
  single source of biome truth the way BOSS-DESIGN.md is for bosses.
