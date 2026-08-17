# R1 — IN-REPO WING HARVEST (what this engine can already build)

**Stream:** R1. **Scope:** ONE WING. **Sources:** this repository only — no web research.
For this stream `[S]` = a file path + line number in this repo (retrievable, checkable).
`[D]` = measured/derived (a render, a triangle count, a run of the harness).
`unknown` = I looked in the repo and could not find it.

> Status: WRITTEN INCREMENTALLY. Sections appear in order; a section present is finished.

---

## Headline

**H1. There is no parametric "wing kit" with dials. There is a shared RIG and 20+ bespoke
builders.** [S] `js/dragonRecipe.js:34-36`, `js/dragonModel.js:318`. What is genuinely shared is
(a) a 4-arg build signature `(def, model, attach, giM)`, (b) the torso ATTACH contract
(`attach.wingRoot(side)`), (c) a 3-segment `pivot→mid→tip` rig contract driven by ONE shared poser,
and (d) a triangle toolbox (`flatTriMesh` + `dragonParts.js` helpers). Everything about a wing's
SHAPE is hand-written per dragon in ~150–450 lines. The 109 KB `js/dragonWings.js` "membrane kit"
with its ~20 `model.wing*` dials is **used by zero shipped dragons** — every one of the 13 declares
an explicit bespoke `parts.wings` builder. Designing "against the dials" is therefore the wrong
mental model: a new hero wing is a NEW BUILDER, and the API you design against is the rig contract
plus the ~40 primitives the three heroes each re-derive from scratch.

**H2. The budget is not the constraint — legibility is, by a factor of ~5.** [D] `tricount` per-form
ceiling is 6000 tris; Vesper's ENTIRE apex dragon is **1052** and its two wings are **450** (43%).
Revenant 2050/252 (12%). Tempest 2913/744 (26%). The heaviest wings on the roster are ember's 1824
and azure's 1828. A new hero wing could spend **~2,500–3,000 tris per pair** and still leave a
whole-dragon total under 6000. **Nothing in the repo is triangle-limited. Every shipped wing is
1.5–10× under budget.**

**H3. In the money camera the wing is edge-on for ~40% of the beat.** [D] the `-cycle.png` sheets.
At `glide` and `recovery` all three heroes hold the wing near-vertical and present almost no
membrane area to the rear-chase lens — the wing is two dark blades. Only `apex`, `downstroke` and
`settle` show planform. Any craft that lives on the membrane FACE is invisible half the time; craft
on the LEADING EDGE and the trailing polyline is visible always.

**H4. The three heroes are three different answers to "what wins the wing read", and only one of
them is richness.** Revenant wins by VALUE CONTRAST (pale bone over black shroud — legible on pale,
dark and sky backdrops) at the cost of being exactly two flat values. Tempest wins by VALUE BANDING
(a 4–5 step charcoal field per bay, the P2 de-plane work) but its white coverts read as confetti.
Vesper wins by SILHOUETTE alone and is a black shape at every backdrop except a 4× pale crop. [D]
the `-detail.png` sheets.

**H5. The rigging traps are already solved and are non-negotiable.** The `−anchor` wrist
(`tip.position=+K`, `hand.position=−K`) and the outer `scale.x=−1` LEFT wrapper are copied
verbatim in all three heroes [S] `dragonVesper.js:630-641`, `dragonRevenant.js:500-511`,
`dragonTempest.js:846-857`. Deviating from either is a known-cost bug (mirror desync
`wingsymprobe` Δ0.000 → ~3.0; a per-side sign + a mirror double-flips).

---

## Tables

### T0 — Which wing builder each shipped dragon actually uses `[S] js/dragons.js`

| key | `parts.wings` | builder file:line | family |
|---|---|---|---|
| azure | `falconCombWings` | `dragonAzure.js:420` | blade-feather comb |
| ember | `emberMembraneWings` | `dragonWings.js:1032` (reg 1441) | membrane (ray + camber) |
| jade | `none` | `dragonWings.js:556` (reg 596) | no wing module (body web-fans) |
| pearl | `seraphWing` | `dragonSeraph.js:213` | yoke 4-segment |
| solar | `lanceVaultWings` | `dragonSovereign.js:632` | lance/vault spar |
| **vesper** | `scallopCrescentWings` | `dragonVesper.js:564` (reg 665) | **fingered bat membrane** |
| **revenant** | `phalanxShroudWings` | `dragonRevenant.js:480` (reg 520) | **phalanx bone + shroud** |
| **tempest** | `stormforkWings` | `dragonTempest.js:818` (reg 868) | **bolt-frame bat membrane** |
| phoenix | `feather` | `dragonWings.js:605` (reg 743) | flat feather ranks |
| phoenixMolten | `pyreFanWings` | `dragonPhoenixMolten.js:611` | pyre fan |
| phoenixReforged | `sunfeather` | `dragonPhoenixReforged.js:913` | shingled feather |
| aurumToro | `svjBladeWing` | `dragonFaceted.js:841` | faceted blade |
| aurumToroMk2 | `svjJetWing` | `dragonFaceted.js:2030` | faceted jet |

Registered but **used by no dragon** (reachable only from tests): `membrane`, `curvedMembrane`,
`skinnedMembrane`, `skinnedMembraneBridge` (`dragonWings.js:587/590/592/595`), `bladeFeatherWings`
(1011), `silkFinWings` (1839), `hexMembrane`, `svjFanWing`, `bladeWing` (`dragonFaceted.js`),
`hullWings`, `organismWings`, `unifiedHull`, `nightFuryWings`, `sideFins`. **14 dead wing builders.**

### T1 — The wing-BUILD contract (the real API a new hero wing must satisfy)

`getWingsBuilder(recipe.wings)(def, model, attach, giM)` [S] `dragonModel.js:318`.

**In:**

| arg | type | what it carries |
|---|---|---|
| `def` | object | palette + identity: `wingEmissive`, `wingMembraneEmissive`, `wingInner/wingOuter`, `apexSeam`, `accentHue`, `horn`, `body`, `eye`, `wingForms` |
| `model` | object | the RESOLVED per-form dial bag (apex `model` merged with `forms[tier]` by `ascendedDef`) |
| `attach` | object | `wingRoot(side)→{x,y,z}` · `headBase` · `tailAnchor` · `keelTopAt(z)` · `halfWidthAt(z)` · `bodyMatDouble` · `bodyMidY` · `riderSocket` [S] `dragonTorso.js:342-356`, contract doc `dragonTorso.js:16-25` |
| `giM` | number | global-illumination multiplier (scales emissive intensities) |

**Out** — `{ group, parts, wingMat, spineMats, … }` [S] destructured at `dragonModel.js:340-345`:

| key | required | meaning |
|---|---|---|
| `group` | ✔ | the Object3D added to the model |
| `parts.wingPivotL/R` | ✔ | SHOULDER joints — the poser always writes these |
| `parts.wingMidL/R` | for 3-seg | FOREARM joints (`model.wingParts:3` path only) |
| `parts.wingTipL/R` | ✔ | HAND / wrist joints |
| `parts.tipMarkerL/R` | ✔ | FX emit point — **must be parented to the folding `hand`** |
| `parts.wingElements` | ✔ | `[{root,tip,length,tipObj}]` for trails |
| `wingMat` | ✔ | the ONE material the runtime drives (opacity/emissive) |
| `spineMats` | ✔ | mats that flare on Surge AND take the warm cruise rim |
| `flareMats` | opt | Surge-flare WITHOUT the warm rim (withheld families) |
| `stormArcMats` | opt | driven only by the guarded storm tick (Tempest) |
| `parts.wingYokeL/R` | opt | 4-segment yoke path (pearl) |
| `parts.wingRigL/R` | opt | skinned-cascade path (`flapWing`) |
| `parts.wingBladePivotsL/R`, `wingLobePivotsL/R` | opt | per-blade / per-lobe furl arrays |

### T2 — The shared geometry toolbox (all a new builder actually gets)

| primitive | file:line | what it does | used by |
|---|---|---|---|
| `flatTriMesh(tris, mat)` | `mechaKit.js:31` | explicit-triangle non-indexed mesh → per-FACE normals. **The atom of all three heroes.** | vesper/revenant/tempest |
| `seg(n)` | `modelDetail.js` | LOD-scaled segment count | all |
| `DEFAULT_WING` / `WING_FORMS` | `dragonParts.js:55` / `:1` | legacy planform spec `{tips[], lead, scallop, flame, arc}` | legacy membrane only |
| `wingSpecFor(def, model)` | `dragonParts.js:64` | per-form planform lookup (`def.wingForms[model.wingForm]`) | legacy + ember |
| `buildWingShape(spec)` | `dragonParts.js:70` | THREE.Shape from tips/lead/scallop (+`spec.rootChord`) | legacy |
| `archProfile/archLift/archWing` | `dragonParts.js:99/104/109` | bow a flat membrane along `{bow,hump,humpAt,hook}` | legacy |
| `buildCurvedPatch(spec, opts)` | `dragonParts.js:375` | double-curved membrane grid (smooth normals) | curvedMembrane |
| `wingStrut(x,z,r0,r1,mat,endY)` | `dragonParts.js:123` | tapered cylinder wrist→fingertip | legacy |
| `bone(ax..bz,r0,r1,mat)` | `dragonParts.js:349` | tapered cylinder between two points | legacy |
| `edgedFin(halfW,len,memMat,edgeMat,rim)` | `dragonParts.js:228` | membrane + bright rim fin | legacy/hipFins |
| `applyWingGradient` / `webGradient` / `featherGradient` | `dragonParts.js:147/321/305` | vertex-colour ramps | legacy/feather |
| `featherGeo(len,wid)` / `buildFeatherWingShape()` | `dragonParts.js:293/132` | one feather / a feather planform | feather |
| `skinnedTube` (`dragonSweep.js`) | — | 2-bone skinned membrane | skinnedMembrane only |
| `composeSurface` + `membraneSSSPatch` | `dragonSurfaceShader.js` | backlit-membrane subsurface term | opt-in only |
| `mergeGeometries` | `lib/utils/BufferGeometryUtils.js` | draw-call merge | perf |

**Not in the toolbox** (each hero re-implements it privately): the leading-edge profile function,
the finger fan, the bézier `quad`/`bez` helper, the `ridge()` tent-wedge bone, the membrane bay
loft, the knife-edge strip, the covert row, the per-bay value tier. Vesper's `ridge` is
`dragonVesper.js:400`, Revenant's is `dragonRevenant.js:384`, Tempest's is `stormSpike` at
`dragonTempest.js:610`. **Three
independent copies of the same four ideas.**

### T3 — The legacy `buildMembraneWings` dial reference `[S] js/dragonWings.js:37-554`

**Status: roster-DEAD.** Every dial below is reachable only by writing `parts.wings: 'membrane'`
(or `curvedMembrane` / `skinnedMembrane` / `skinnedMembraneBridge`). "Shipped range" is what
`js/dragons.js` actually sets — **most say `none (0 dragons)`**, which is the honest answer.

| dial | type | line | default | shipped range | visual effect |
|---|---|---|---|---|---|
| `model.wingScale` (`ws`) | float | 76 | **required** (undefined ⇒ NaN) | 0.72–1.34 (azure blades, phoenix 1.34) | master span+chord multiplier; every X is `1.34·ws` |
| `model.wingChord` | float | 144,157,216 | 1 | none (0 dragons) | Z (fore-aft) stretch of the membrane panel |
| `model.wingShape` | `'feather'`\|— | 77 | — | none (0) | swaps the planform for the flat-feather cut-out |
| `model.wingForm` | int index | via `wingSpecFor` `dragonParts.js:64` | → `DEFAULT_WING` | 0–3 (ember only, `wingForms` at `dragons.js:429`) | picks the per-form planform `{tips, lead, scallop, flame, arc}` |
| `spec.rootChord` | float | `dragonParts.js:73` | 0.28 | none | lengthens the ROOT attach chord (kills the pinched bolted-on root) |
| `spec.arc {bow,hump,humpAt,hook}` | 4 floats | `dragonParts.js:100` | all 0 (flat) | ember forms | the gull-arch lift profile along span |
| `spec.scallop` | float | `dragonParts.js:83` | 0.50 | 0.22–0.50 | trailing-edge festoon depth between finger tips |
| `spec.flame` | bool | `dragonParts.js:79` | false | ember f3 | V-notches the OUTER 2 webs only |
| `model.wingBillow` | float | 56 | 0.12 | none (0) | chordwise panel billow (curved path) |
| `model.wingOpacity` | float | 63 | 0.82 | none (0) | membrane alpha |
| `model.wingPanelGlow` | float | 66 | 0.28 | none (0) | membrane emissiveIntensity |
| `model.wingSSS` | bool | 72 | off | 1 mention (comment only) | backlit-membrane subsurface term, colour `def.wingMembraneSSS` (0x2a3a52) |
| `model.wingVeins` | bool | 85 | off | solar f3 (`dragons.js:460`) | glowing vein struts wrist→fingertip |
| `model.wingRootScale` | float | 357 | 1 | none (0) | shoulder-ball radius |
| `model.wingEdgeGlow` | bool | 305,430 | off | none (0) | cyan trailing-edge rim ribs |
| `model.wingtipFins` | bool | 448 | off | none (0) | winglet at each tip |
| `model.hipFins` | bool | 529 | off | none (0) | rear stabiliser fins at the hips |
| `model.secondWingPair` | bool | 506 | off | none (0) | mini second wing pair at 0.48× near the tail base |
| `model.flapProfile` | object | 59 | `DEFAULTS` at `dragonWingFlap.js:17` | none (0) | per-creature flap character for the SKINNED path only |
| `def.wingEmissive` / `wingMembraneEmissive` | hex | 66 | — | 0x000000 on all 3 heroes | membrane glow colour (heroes explicitly BLACK) |
| `def.wingInner` / `wingOuter` | hex | `applyWingGradient` | — | per-form | inboard→outboard vertex ramp |
| `opts.curved` / `.skinned` / `.bridge` | bool | 44/49/53 | off | none | recipe-level: curved patch / 2-bone skin / body deltoid bridge |

**Ember is the only living user of any of this** (`emberMembraneWings`, `dragonWings.js:1032`), and
it reads its own private set: `membraneCamber` (1041, def 0.34), `scallop` (1042, clamped 0.22–0.30),
`wingChordScale` (1043, def 1), `membraneBase` (1066, 0x2a160b), `sparColor` (1069, 0x5a4038),
`rayCount/raySweep/rayDihedral/raySpan/rayScale/rayRelief/rayDetail/raySweepBack` (`dragons.js:169`).

### T4 — Vesper · Revenant · Tempest: the actual GEOMETRY dials, side by side

Values are the apex (f3) `model` from `js/dragons.js` and the builder's defaults.

| | **Vesper** `scallopCrescentWings` | **Revenant** `phalanxShroudWings` | **Tempest** `stormforkWings` |
|---|---|---|---|
| builder | `dragonVesper.js:564` | `dragonRevenant.js:480` | `dragonTempest.js:818` |
| one-wing fn | `buildOneScallopWing:365` | `buildOnePhalanxWing:377` | `buildOneStormforkWing:642` |
| **halfSpan** | `spanScale · 3.4` = **3.40** | `spanScale · 4.1` = **4.10** | `spanScale · 4.1` = **4.10** |
| span ladder (`spanScale`) | 0.70 / 0.82 / 0.92 / 1.05 | 0.70 / 0.82 / 0.92 / 1.00 | 0.68 / 0.80 / 0.90 / 1.00 |
| finger/strut count | `scallopLobes` **5** (2/3/4/5) | `fingers` **4** (2/3/4/4) | `rays`→`struts` **5** at f3 (2/3/4/5) |
| **`wristT`** (arm fraction) | **0.21** (very medial) | **0.24** def → builder default 0.40 | **0.24** def → dials pass **0.40** |
| leading edge | `vesperArmY:346` gull arch (peak at `wristT`, decay 0.14) + `vesperArmZ:354` raptor ogee `−0.10+0.44·hs·t^1.12 − 0.15·hs·sin(πt)` | straight short stub; `K=[wristT·hs, 0.06·hs, −0.04·hs]` | swan-neck OGEE: `ROOT→E→Am→K`, `K=[wristT·hs, 0.06·hs, −0.115·hs]` = forward-most apex |
| finger fan law | `lenFrac [1,.86,.70,.52,.33,.23]`, `spanAft 1.22` rad | fan/droop table in `:400+` | `FAN [[26°,1.0],[42°,.92],[60°,.74],[76°,.55],[88°,.40]]`, `DROOP [.06,.14,.22,.30,.38]`, ±3.5° azimuth jitter |
| bone form | 2-segment BOWED tent-ridge, `sag = 0.11·L·(0.7+0.5·i/n)`, width `0.075·hs·(1−0.08i)` | flat tent-ridge, `wB 0.075→0.045·hs` | `stormSpike`: wide dim **bloom skirt** + narrow **recessed white core** + silver rim |
| membrane build | per-bay concave bézier, ctrl pulled to K by `cup = wingCup 0.35 ·(0.72+0.16i)`, `NSEG = wingNSEG` **8** | quad strips welded to per-finger **SPAR SAMPLES** (5 nodes/finger) | quad strips on kinked spar samples, `NS 4`, `crescentDepth = 0.7+0.5·glow` |
| membrane values | `memTiers` 4 mats, `lerp(wingOuter→MEMBLUE 0x2c384a)` at `[0.60,0.40,0.22,0.06]`, opacity 0.82 | **ONE** mat `0x1d1f23`, opacity 0.92, rough 1.0, env 0.05 | `boltTiers` `[0.58…0.05]` → `0x808ea8`, banded per-bay by billow depth |
| knife edge | `edgeBand` 1 → one connected strip, `lerp(wingOuter→0x3b4a5e,0.8)`, opacity 0.68, NON-emissive | — (tattered notch cut only) | `edgeMat` 0xc9d0e8 emissive 0xd9deff @ `humFloor·0.6`, opacity 0.55 |
| anti-plank extras | `wingGusset` 1, `thumbClaw` 1, `covertRow` **12**, `constellations` **8**, `cowlPlates` 1, `seamRootSpark` 1 | propatagium + brachial panel anchored NEAR the pivot | `coverts = round(4+5·glow)` = **9**, `sparks = round(6·glow)` = **6**, carved housings (`stormWeld`) |
| withheld glow | `memGlow` underside layer (0x2050e8 @ **0.05** base, `surgeGlowMultiplier` 22) | none on the wing (light is the caged heart) | `stormArcMats` on the FRAME (hum → strike → Surge) |
| extra ladder dials | `archRise` 0.4, `edgeBand`, `wingCreases`, `glideRake` | `crescentDepth` 0.3/0.6/0.8/1.0, `shroudPanels` 1/1/2/2 | `kinkKnuckles` 1/2/3/3, `forkN` {0,0,1,2}, `spur` f3, `arcRun`, `arcDuty` |

### T5 — The FLAP dials (the ONE shared rig) — `[S] js/wingDebugPose.js:100-150` + `js/dragon.js` poseWing

| dial | Vesper | Revenant | Tempest | axis / effect |
|---|---|---|---|---|
| `wingParts` | 3 (ladder 1/2/3/3) | 3 | 3 | number of driven segments |
| `rootAmp` | 0.62 | 0.72 | **0.80** | shoulder z — arc size / downstroke depth |
| `apexRoot` | — (0) | 0.17 | **0.30** | shoulder z — recovery height toward 12 o'clock |
| `midAmp` | 0.34 | 0.14 | 0.32 | forearm z |
| `tipAmp` | 0.55 (ladder 0/.30/.46/.65) | 0.09 | **0.80** | hand z — the fold magnitude |
| `midLag` | 0.45 | 0.70 | 1.05 | rad |
| `tipLag` | 1.0 | 1.1 | **2.1** (≈33% of cycle) | rad |
| `glidePow` | **2.2** (ladder .9/1.2/1.7/2.2) | 1.15 | 1.1 | glide-hold ↔ continuous |
| `restLift` | 0.05 | 0.0 | 0.03 | constant dihedral |
| `apexMid` / `apexTip` | 0.10 / 0.22 | 0.04 / 0.04 | 0.08 / 0.12 | distal apex V-lift |
| `tipApexSweep` | — | — | **0.26** | **hand rotation.y** — the depth-projection fix |
| `apexPitch` | — | — | — | fore-aft x; **exists (`wingDebugPose.js:120`) and NO dragon uses it** |
| `flapBias` / `flapAmp` | 0.85 / 0.70 | 0.9 / 0.85 | 0.9 / 0.90 | rig-level beat speed / amplitude |

Also unused by the whole roster: `model.flap` (the 4-segment YOKE solver config —
`wingFlapSolver.js:60`, only pearl's `seraphWing` publishes yokes), `model.spireStabilize`,
`model.combShoulderFold` (azure only), `model.flapProfile` (skinned path only).

### T6 — Triangle-budget reality `[D] node tools/tricount.mjs` (run 2026-08-16, exit 0)

Per-form ceiling **6000**; 53 models; roster total **158 773**; **0 over budget**.

| dragon (apex) | whole model | **both wings** | wing share | headroom to 6000 |
|---|---|---|---|---|
| **vesper** f3 | 1052 | **450** | 43% | **+4948** |
| **revenant** f3 | 2050 | **252** | 12% | **+3950** |
| **tempest** f3 | 2913 | **744** | 26% | **+3087** |
| solar f3 | 3309 | 1530 | 46% | +2691 |
| phoenix f3 | 2860 | 692 | 24% | +3140 |
| pearl f3 | 4498 | 1356 | 30% | +1502 |
| azure f2 | 5110 | 1828 | 36% | +890 |
| ember f2 | 5682 | 1824 | 32% | +318 |
| aurumToroMk2 f3 | 5940 | 888 | 15% | +60 |
| jade f2 | 4384 | **0** *(see note)* | — | +1616 |

*Wing tri counts are `[D]` — measured by summing indexed/non-indexed geometry under
`wingYoke*/wingRig*/wingPivot*/wingPivot2*` at the apex form, the same walk `wingshot.mjs`
uses. Jade reads 0 because its fan lobes hang off `wingLobePivots*` under a `none` wings
module — the standard roots are empty; its fan geometry lives in the torso build.*

**Headroom for a NEW hero wing.** If the new dragon's body/head/tail come in around the
Revenant's (≈1800 non-wing tris), a wing pair may spend **~4000 tris and still pass**. Even
matched to the heaviest existing body (ember, 3858 non-wing) a pair may spend **~2100** —
still **4.7× Vesper's** and **2.8× Tempest's**. `tricount --ci` is the gate (exit 1 over budget).

Two counter-facts the budget table hides:
- **Draw calls, not triangles, are the real cost.** Tempest batches the whole wing into a
  handful of `flatTriMesh` calls via per-material accumulators (`dragonTempest.js:654-657`);
  Vesper's constellations were explicitly re-batched from one draw per fleck into one mesh
  (`dragonVesper.js:532`). A 3000-tri wing in 8 draws is cheap; a 600-tri wing in 60 draws is not.
- **`[S] reforged/leapfrog/lessons/2026-07-11-tris-buy-smoothness-facets-and-light-buy-richness.md`
  — triangles buy SMOOTHNESS; facets, value tiers and lights buy RICHNESS.** Azure spends 2320
  wing tris on curvature interpolation and reads poorer than Solar's flat-shaded facets. Do not
  convert the headroom into a smoother grid.

### T7 — The render / verify harness: tested recipes

All run from `/home/user/dragon-drift/reforged`. Playwright resolves from the global npm root
(`/opt/node22/lib/node_modules/playwright`) — no `PLAYWRIGHT_PATH` needed in this container.

| tool | command (verified) | writes | status |
|---|---|---|---|
| **wing-lab capture** | `node wing-lab/tools/wingshot.mjs [key…] [--tier=N] [--compare]` | `wing-lab/refs/wing-<key>-<tag>-{poses,planform,cycle,detail}.png` + `wing-COMPARE-<keys>.png`, **and a world-space measurement table on stdout** | ✅ **re-ran `… wingshot.mjs vesper`, 4 sheets, ~2 min** |
| budget | `node tools/tricount.mjs` · `--ci` · `--max=N` | stdout only | ✅ exit 0 |
| symmetry | `node tools/wingsymprobe.mjs <key>` | stdout | ✅ vesper **Δ0.000 PASS**, tempest **Δ0.000 PASS** |
| ladder / shop | `node tools/tiershots.mjs <key>` | `/tmp/tier-<key>.png` | ✅ per-key (vesper, tempest). ⚠ **`node tools/tiershots.mjs` with NO ARG CRASHES** |
| flap strip | `node tools/flapstrip.mjs <key> [tier]` | `/tmp/flap-<key>-<phase>.png`, `/tmp/flap-<key>-strip.png` | ⚠ not re-run — its own header warns the **5-boot loop crashes the shared browser on the 3rd boot** in this env (~3 min/boot); run ONE phase per process, detached |
| studio sheets | `node tools/dragonstudio.mjs <key> [round]` | `reforged-captures/dragon-<key>-…png` | not re-run; the wing-lab stage is copied verbatim from its HTML |
| full gameplay frame | `node tools/fullshot.mjs [key] [tier] [fever]` | `/tmp/full-<key>-t<tier>[-fever].png` | not re-run (boots the real game) |
| live shop hero | `node tools/heroshot.mjs` | `/tmp/hero-live-{1..N}-*.png` | ⚠ **its `initScript` hard-codes `owned:['azure','ember','solar']`** — it cannot show a new dragon without an edit |
| showcase modal | `node tools/inspectshot.mjs [key]` | `/tmp/inspect-<key>.png` | not re-run (boots the real game) |
| wing gate crop | `node tools/wingcrop.mjs <roundTag> [front\|threequarter]` | `reforged-captures/angelwing-<tag>-<view>.png` | targets `winglab.html` (the ANGEL wing), not the dragon wings |

**⚠ BREAKAGE FOUND — `tools/tiershots.mjs:25`.** The roster list is stale:
`['azure','ember','jade','obsidian','pearl','solar','phoenix','astralWyrm','water','fire','earth','aurumToro']`.
`obsidian`, `astralWyrm`, `water`, `fire`, `earth` no longer exist in `js/dragons.js`, so
`ascendedDef(undefined,…)` throws `SyntaxError: "undefined" is not valid JSON` at
`js/ascension.js:118` after the 3rd dragon. **Always pass a key.** (One-line fix if wanted:
drive it from `Object.keys(DRAGONS)`.)

**The wing-lab harness in full** — `wing-lab/tools/wingshot.mjs` + `wingshot.html`:

- Stage is **copied verbatim from `tools/dragonstudio.html`** (ACES, sRGB, hemi + 3 directionals)
  so a wing-lab frame is directly comparable to a shipped studio gate frame.
- It exposes **all seven** `WING_DEBUG_STATES` (`glide, recovery, apex, downstroke, settle, fold,
  bank`); the shipped `dragonstudio` maps only glide/fold/bank and **silently falls back to glide**
  for the cycle states. This is why the lab has its own driver.
- Angles (`wingshot.html:48-60`): `rear` `rear3q` `side` `top` `front` and the wing crops
  `wing` (rear-above from the off side), `wingtop` (planform), `wingfront` (head-on, dihedral +
  camber), `wingside` (**edge-on — the plank test**), `wingrear` (one wing from the chase cam).
- Backgrounds: `dark 0x14121a` · `pale 0xcfd6e4` · `gold 0xd9a24a` · `sky 0x8fb8dd`.
- Two fitting gotchas already solved and worth not re-learning: (a) `Box3.setFromObject` includes
  the idle-aura **SPRITE** (9.1u on Vesper) and shrinks every dragon to ~40% of frame — the driver
  uses a **mesh-only** box; (b) a naive perspective corner-fit **blows out on the rear-chase view**
  because the tail tip is near the lens — it solves a **perpendicular-screen-extent** fit instead.
- `framePose` freezes the camera on ANOTHER pose's box so a 5-frame cycle strip shares ONE camera
  (a per-pose refit hides the very amplitude the strip exists to show).
- In-page API for ad-hoc probing: `wlStates()` `wlKeys()` `wlMaxTier(key)` `wlRender(o)`
  `wlMeasure({key,tier,pose})` `wlSheetInit(cols,rows,cell)` `wlTile(i,label)`.

**A tested one-liner for geometry ground truth without a browser** (no WebGL, ~5 s) — build the
model, `setFlapDebugPose`, read world boxes. The pattern is `tools/wingsymprobe.mjs:1-25` (the
node DOM shim + `three-resolver.mjs`). Measured span/rise/chord/fold-ratio this way:

| apex dragon | glide spanX | riseY | chordZ | body Z | span/body | **fold ÷ glide span** |
|---|---|---|---|---|---|---|
| vesper | 6.35 | 3.45 | 3.04 | 10.43 | 0.61 | **0.838** |
| revenant | 8.50 | 4.73 | 3.54 | 10.51 | 0.81 | **0.932** |
| tempest | 9.70 | 4.53 | 3.51 | 8.21 | **1.18** | **0.986** |
| solar | 12.65 | 5.25 | 3.18 | 10.81 | 1.17 | 0.795 |
| azure | 8.83 | 4.20 | 2.90 | 8.16 | 1.08 | **0.475** |
| ember | 17.69 | 5.08 | 8.40 | 11.43 | 1.55 | **0.429** |
| pearl | 10.07 | 2.04 | 3.41 | 7.50 | 1.34 | 1.016 |
| phoenix | 10.97 | 3.92 | 2.87 | 7.38 | 1.49 | 0.878 |

**The fold column is the finding.** `DRAGON-DESIGN §7` asserts a fold must contract span past
**0.7×**. Only azure (0.475), ember (0.429) and solar (0.795) do. **All three premium heroes fail
it** — Tempest's "fold" contracts its span by 1.4%. The `fold` state on a `wingParts` rig is just
`rollFold 0.55` on the shoulder plus a dive-damped amplitude (`wingDebugPose.js:37-45, 127`); the
real furls live in the `poseBladePivots` / `poseLobePivots` branches (`:231` / `:196`), which only
fire for rigs that publish those arrays.

### T8 — The wing lessons already paid for (do not re-derive)

Each row: the lesson file, and the law in one line. All `[S]` — retrievable in this repo.
Prefix `L/` = `leapfrog/lessons/`, `R/` = `reforged/leapfrog/lessons/`.

**Rigging traps**

| lesson | the law |
|---|---|
| `L/2026-07-12-vesper-cp3-motion-wing-fold-tail-chain.md` | **The −anchor.** `tip.position=+K`, `hand.position=−K` → the assembled rest pose is byte-identical, so you can add a joint to a shipped-looking wing with zero visual regression. |
| `L/2026-07-12-vesper-cp3-motion-wing-fold-tail-chain.md` | **The mirror.** Build BOTH wings canonical (+X); mirror the LEFT with an **outer** `scale.x=−1` wrapper that PARENTS the pivot. `pivot.scale.x=−1` desyncs rotation.y/.z (`wingsymprobe` Δ0.000 → ~3.0). A mirror AND a per-side sign both flip — use exactly one. |
| `L/2026-07-12-vesper-cp3-motion-wing-fold-tail-chain.md` | **Geometry with no joints (THE plank bug).** Vesper shipped a 1-bone plank with every headless probe green because the rig rotated an EMPTY `tip` group. Check both directions: joints with no geometry, geometry with no joints. |
| `R/2026-07-13-revenant-a-body-membrane-belongs-on-the-body-not-the-flap-arm.md` | **A vertex that must stay put on the BODY cannot live in a group that ROTATES with the limb.** A body-anchored plagiopatagium on the flap arm peels into a floating shard mid-flight. |
| `R/2026-07-13-revenant-a-wing-membrane-anchors-at-the-pivot-not-the-body-and-not-the-hip.md` | **…but a body-FIXED drape reads as "tiny wings + bare arms".** The membrane lives ON the wing; its inboard edge sits **near the pivot** (short lever) so it rotates with the wing and barely translates. |
| `L/2026-07-12-vesper-cp3-…` §wrist | **Any geometry that spans a joint must keep all its vertices on ONE side of it.** Vesper's root gusset tore until re-anchored to arm-side points only. |
| `L/2026-07-12-vesper-cp1-fingered-batwing-rework.md` | **FX handles ride the moving part, and the profile is a shared FUNCTION.** Two copies of the leading-edge formula = the trail-detach bug; the tip marker parents to `hand`. |

**Motion traps**

| lesson | the law |
|---|---|
| `L/2026-07-14-tempest-flap-the-depth-projection-trap-and-the-false-asymmetry.md` | **THE DEPTH-PROJECTION TRAP.** A wrist fold about the flap axis is *invisible at the top of the upstroke* — there the axis points at the chase camera and the articulation projects into DEPTH. Cranking amplitude never fixes it. Change the AXIS at that pose (`tipApexSweep`, rotation.y). |
| same | **THE META-LAW.** When a critic's pixel measurement contradicts exact posed geometry, the geometry wins — then remove the confound (re-shoot on a clean stage), don't argue. |
| `L/2026-07-14-tempest-flap-animation-matched-to-revenant.md` | **"It flaps like one plank" is a WAVEFORM problem.** `glidePow ≥1.9` with no `apexRoot` HOLDS one pose and tilts. |
| `R/2026-07-13-revenant-wingbeat-distal-amplitude-must-be-less-than-the-shoulder.md` | **Distal ≥ proximal IS the broken-linkage tell.** Shoulder owns 75–85% of the swept arc, forearm 10–15%, wrist 5–10%; each strictly less than the shoulder. |
| `R/2026-07-13-revenant-apexroot-is-the-glide-pose-height-dial.md` | **`apexRoot` is the glide-pose HEIGHT dial** — a correct ventral-cupped canopy still reads as an edge-on V from behind if the pose holds the wings near vertical. Camber ≠ pose. |
| `FLAP-DESIGN.md §4 LAW 5` | **Banking is POSE BIAS ONLY, never an L/R phase delay.** |
| `R/2026-07-11-fluid-tail-chain-and-wing-blade-flutter.md` | **"Stiff" is a rig-DOF problem, never a geometry problem** — give a welded element hinges and let the existing nullable rig loops ripple them. |

**Geometry / silhouette traps**

| lesson | the law |
|---|---|
| `L/2026-07-12-vesper-cp1-fingered-batwing-rework.md` | **THE PLANE WING.** Three straight lines with a sine on one of them. Kill it with: a knuckled arched leading edge (a function), radiating finger BONES (not creases — 0.014u is invisible), and a membrane that cups **INWARD** toward the knuckle. |
| same | **Sample every membrane arc at ≥4 segments** — 2 segments polyline into scissor-cut sawtooth V teeth. "The single highest-value fix in the whole rework." |
| same / `DRAGON-DESIGN §2.4` | **Dominant + decay, never a picket fence.** `lenFrac [1,.86,.70,.52,.33]` beats N equal fingers. Jitter azimuth/width (Tempest ±3.5°) so the rank reads organic. |
| `R/2026-07-13-revenant-the-wing-leading-edge-flares-forward-then-hooks-back.md` | **The leading edge is a "‹" in plan, not a backswept "\".** Arm + wrist throw FORWARD (−Z) of the shoulder; the dominant finger sweeps back to the tip. A monotonic aft sweep collapses the fan toward the tail. |
| `R/2026-07-13-revenant-weld-the-membrane-to-spar-samples-and-cup-it-ventrally.md` | **Loft the skin onto per-finger SPAR SAMPLES, not finger TIPS.** A tip-referenced membrane detaches the moment the spars curve — and a torn skin reads as "lower material quality" even though nothing about the material changed. Camber is **VENTRAL** (cup down); a dorsal flick is an anti-glide shape. |
| `L/2026-07-10-molten-phoenix-cp2-pyre-fan-wing.md` | **The anti-biplane wing is a ROOT problem, not a feather problem** — bury every blade's root in the fill or the outer primaries float as detached islands. |
| `R/2026-07-11-wingspan-is-two-levers-span-and-projection.md` | **"Too wide" is TWO levers: geometric span AND projection (dihedral).** Measure on the FIXED chase cam (`tools/silhouette.mjs <key> rear <form>`), never the auto-fitting turntable. |
| `DRAGON-DESIGN §4.4` | **Span is pinned by the tip vertex** `F0 = LE(1)` — so pulling `wristT` inboard GROWS the finger fan without shrinking the wing. |
| `DRAGON-DESIGN §3.6` | **Silhouette economics.** Surface plates and coverts are invisible at play distance. Spend the play budget on the OUTLINE; spend surface richness on the shop/close read. |

**Shading / value traps**

| lesson | the law |
|---|---|
| `L/2026-07-15-graphics-glowup-p1-filament-bones-flatblack.md` | **FLAT-TAPE BONES.** Constant-width near-white quads standing PROUD on a dark membrane at even pitch = white tape on black cardstock. A bone is a **filament in a channel**: a wide dim penumbra skirt at the floor + a narrow tapered core **recessed below the wall tops**. |
| same | **FLAT-BLACK POVERTY / the value-structure law.** Every hero element needs core → bloom → dark. One value next to a glowing bolt = a silhouette. |
| `L/2026-07-15-graphics-glowup-p2-deplane-membrane.md` | **A membrane bay is not one flat tier — value-band it by billow depth.** Taut root = lighter tier, deep ventral cup = darker; plus outboard gradient + index-hash jitter (measured ~4× luminance spread inside ONE bay row). |
| same | **Value-banding only reads if the palette has range.** `boltTiers [0.42…0.05]` toward a dim steel read as nothing; `[0.58…0.05]` toward a lit steel-blue read. Same as Vesper's four tiers spanning 0.02 luma → re-aimed at `MEMBLUE 0x2c384a` to span 0.05→0.14. |
| `R/2026-07-13-revenant-a-dark-shroud-must-stay-dark-under-the-game-light.md` | **Measure the membrane UNDER THE GAME LIGHT, not in the swatch.** A `0x2c2d31` albedo measured **52% pale** at the money cam. Rendered value = albedo × lighting. |
| `R/2026-07-14-tempest-i2-stormfork-wing-the-frame-is-the-light.md` | **A lit EDGE is not a lit GARMENT** — and **glow width must not track tent width**, or the frame reads as a chrome outline. |
| `DRAGON-DESIGN §2.9` | **LED-STRIP GLOW.** A painted emissive stripe along a surface (or one round bloom blob) was rejected twice. Glow as COMPONENTS: discrete nubs, rims, the membrane UNDERSIDE. |
| `dragonTempest.js:5-27` | **ONION-RING GLOWS.** Stacked additive octahedra each have a hard silhouette edge → concentric rings. Use a **sprite with a radial-gradient ALPHA** in a `DataTexture` (DOM-free so node geometry tests still build). |
| `L/2026-07-13-godhead-perf-wing-feather-merge.md` | **Draw calls, not tris.** 8 seraph wings = 104 draws, re-submitted in the water-mirror and god-ray passes; merged to 24 by material bucket. |
| `R/2026-07-11-tris-buy-smoothness-facets-and-light-buy-richness.md` | **Triangles buy smoothness; facets, value tiers and lights buy richness.** |

**Process traps**

| lesson | the law |
|---|---|
| `R/2026-07-14-tempest-wing-rebuilt-on-the-shipped-roster-anatomy.md` | **"Passes my gate" is not the bar — the SHIPPED ROSTER is.** The Tempest's first Stormfork passed its own Fable gate at `halfSpan = spanScale·2.3` and the owner called it embarrassing: **56% of the shipped premium size.** Transplant a proven anatomy; don't iterate a novel one. |
| `R/2026-07-10-a-flight-fan-must-rake-aft-not-face-the-flow.md` | **A frontal-plane fan is a drag-plate.** It scores 4.67 on a still shot down the flight axis and reads as a dress in motion. |
| `DRAGON-DESIGN §2.13` | **Photocopied motion is a defect.** Dial blocks byte-identical to another dragon's fail the gate — motion IS identity. |

### T9 — What the engine CANNOT currently do (and roughly what it costs to add)

Honest list of things a director might ask for that have **no path** in this repo today.

| # | The ask | Why it can't | Cost to add |
|---|---|---|---|
| 1 | **A membrane that stretches / slackens across the beat** (taut on the downstroke, billowing on recovery) | Every hero membrane is RIGID geometry inside `hand`; the only deformation is rigid-body rotation of `arm`/`hand`. There is no per-frame vertex write anywhere in the wing path. | Medium. A `wingMat` vertex shader with a `uFold` uniform (the `composeSurface` patch system at `dragonSurfaceShader.js` already exists) — ~1 day, and it must be driven from BOTH `dragon.js` and `wingDebugPose.js` in lockstep. |
| 2 | **Trailing-edge flutter / ripple** | Same: no per-vertex animation. `poseBladePivots`/`poseLobePivots` give per-BLADE rigid pivots only — and `FLAP-DESIGN §2` explicitly bans per-strut pivots on a WELDED membrane (they tear it). | Medium–high. Either a vertex-shader ripple, or split the trailing band into its own non-welded strip with its own lag pivots. |
| 3 | **More than 3 driven wing segments** on the `wingParts` path | `poseWing` writes exactly `pivot/mid/tip` (`wingDebugPose.js:123-131`). The 4-segment YOKE path exists (`wingFlapSolver.js:60` → yoke/inner/mid/tip) but is a **different branch** and only pearl uses it. | Low–medium: extend `poseWing` + `dragon.js` in lockstep, or adopt the yoke path (which brings a rowing sweep + curl channel for free). |
| 4 | **A real fold that furls the span past 0.7×** on a fingered membrane | The generic `fold` state only adds `rollFold 0.55` at the shoulder. All three heroes contract ≤16%. Only the blade/lobe branches have bespoke furls. | Low: a per-dragon fold clause in `wingDebugPose.js` + `dragon.js` (the azure/jade precedents at `:238` / `:198` are ~10 lines each). Must be added to BOTH files. |
| 5 | **Shadow-casting wings / self-shadowing membrane** | No mesh in the wing path sets `castShadow`; the studio stage has no shadow map at all. | Unknown-to-high — a real-time shadow pass is a renderer-wide decision (`GRAPHICS-OVERHAUL.md` territory), not a wing change. |
| 6 | **A texture / normal map on the membrane** | The whole game is **100% procedural, no asset files** (CLAUDE.md). Textures exist only as `DataTexture`/`CanvasTexture` generated in code (`makeGlowTexture`, `glowTexture()`), and `tricount`'s node shim gives canvas a *stubbed* 2D context — a `CanvasTexture` in the build path **throws in the node tests**. | Medium: procedural `DataTexture` only, and it must be DOM-free. |
| 7 | **Per-vertex skinning driven by the flap** | Exists (`skinnedMembrane` / `skinnedTube` / `flapWing` cascade) but is **used by no shipped dragon** and is a different rig branch (`parts.wingRigL` short-circuits `setFlapDebugPose` at `:61`). None of the three heroes' craft (spar-sample welds, per-bay tiers) has ever been built on it. | Medium: real, but unproven at premium quality — you would be the first. |
| 8 | **Two-sided membrane with a different ventral surface** | Every membrane is a `side: THREE.DoubleSide` single sheet — the underside is the same material, lit from behind. Vesper fakes a ventral layer by duplicating the bay geometry 0.05 below it in a second material (`dragonVesper.js:458-464`). | Low: duplicate-and-offset is the shipped pattern; ~2× the membrane tris. |
| 9 | **Aerodynamically responsive pose** (wing loading, gust response) | The poser is a pure function of `phase` + a few scalar bias inputs. There is no physics; `wingDebugPose` is deliberately **clock-free and deterministic** (a deliverable — see `wingDebugPose.js:32`). | High, and it would break determinism-of-capture, which the whole gate process depends on. |
| 10 | **A wing whose planform changes with tier by more than dial values** | `ascendedDef` merges `forms[t]` cumulatively into `model`; there is no per-form BUILDER swap. | Low: branch inside your own builder on `model.formLevel` / `glowLevel` (Tempest already does: `struts`, `forkN`, `spur` all key off `glow ≥ 0.95`). |
| 11 | **Membrane transparency that reads through to the far wing** | `transparent:true` with no explicit `depthWrite`/render-order management — sorting artifacts between the two wings and the body are not solved anywhere. | Low–medium and fiddly; the shipped answer is to keep opacity ≥0.82 and let it read opaque. |
| 12 | **Anything driven by `model.flapProfile`** | Read at `dragonWings.js:59` but only consumed on the SKINNED path; no dragon sets it. | It works — it is just unused. Free if you adopt the skinned rig. |

---

## Build implications

1. **Design a BUILDER, not a dial set.** The director should hand the engineer a
   *leading-edge profile function*, a *finger-length table*, a *bay-cup rule*, a *value-tier
   ladder* and a *joint split point* — because that is literally the shape of the three
   shipped premium wings. Asking "what's the dial for X" will usually get "there isn't one,
   write it." The only dials that are genuinely shared and pre-wired are the FLAP dials (T5).

2. **Budget ~2,500 tris for the wing pair and spend them on EDGES, not smoothness.** That is
   5.5× Vesper, 3.4× Tempest, and still inside the 6000 ceiling with the heaviest plausible
   body. Convert them into: more membrane bay segments (Vesper's `wingNSEG` is only 8), a real
   ventral surface, a thicker multi-face bone wedge, and one more organized rank. Do **not**
   convert them into a finer grid — `[S] R/2026-07-11-tris-buy-smoothness…`.

3. **Anything that must read during the beat belongs on the LEADING EDGE or the trailing
   polyline.** At `glide` and `recovery` — the two poses the chase camera sees most in cruise —
   the membrane face is edge-on `[D]` (`wing-*-cycle.png`). The Revenant's read survives because
   its craft is the pale bone RANK along the leading edge; Vesper's does not because its craft
   is on the membrane face and in a 4× crop.

4. **Take the Tempest's value-banded bay and the Revenant's bone-vs-membrane contrast; take
   neither's execution of the other.** The measured gap: Revenant's membrane is ONE material
   (`0x1d1f23`), Tempest's is a 4–5 step field but its coverts are unorganized white confetti.
   The target is Tempest's banding UNDER Revenant's contrast ratio, with the coverts laid as a
   rank that runs to its terminus.

5. **A dark membrane must be authored against the game light, in the brightest biome.** The
   Revenant's `0x2c2d31` shroud measured 52% pale at the money cam and had to be dropped to
   `0x1d1f23` with `roughness 1.0` and `envMapIntensity 0.05`. Author the membrane material
   *with those three numbers together*, then verify with a `bg:'sky'` render — the wing-lab
   `detail` sheet's 4th tile exists for exactly this.

6. **Use the −anchor + outer-mirror boilerplate verbatim.** It is 8 lines
   (`dragonTempest.js:846-857`) and it is the difference between `wingsymprobe` Δ0.000 and a
   gate-blocking desync. Copy, don't reinvent.

7. **Publish the fold.** If the design wants a real furl (and the §7 law says 0.7×), it must be
   authored as a per-dragon clause in BOTH `wingDebugPose.js` and `dragon.js` — no hero has one,
   so this is net-new work, ~20 lines, and it is the cheapest available "growth verb" beat.

8. **Verify by failure class, in this order:** `tricount` (budget) → `wingsymprobe <key>`
   (Δ0.000) → the pure-math per-segment angle dump (does the hand sign FLIP between top and
   bottom?) → `wingshot.mjs <key>` for the 4 sheets → `tiershots.mjs <key>` for the ladder.
   Only then bring a critic pixels — and bring the numbers with them.

## What this rules out

- **A wing designed as a set of numbers to plug into `dragonWings.js`.** There is no live
  membrane kit to plug into; that file's dials are dead on the roster.
- **A membrane that ripples, luffs, or stretches during the beat.** Nothing in the engine
  writes wing vertices per frame. Any spec that says "the skin catches the air and billows on
  the downstroke" is unbuildable today without a new shader path.
- **A wing whose fingers each flex independently over a welded skin.** `FLAP-DESIGN §2` — per-strut
  pivots on a welded membrane TEAR it. The whole hand folds as one rigid unit or not at all.
- **A wing whose interest lives on the membrane FACE only.** It is edge-on for two of the five
  cycle poses and a black shape at play distance (`[D]` the detail + cycle sheets).
- **Constant-width bright strips along the bones.** Named, rejected twice: "white tape on black
  cardstock." The shipped answer is a recessed narrow core inside a dim wide penumbra.
- **Convex "scallop lobes" whose valleys never cut inward.** That is still the plane wing
  (`DRAGON-DESIGN §2.1`); the cup control must be pulled toward the knuckle.
- **A wing tuned to look right in a still.** The frontal-plane fan scored 4.67 frozen and was
  vetoed in motion; the Tempest's correct −9° wrist reversal read as a plank from the chase cam.
- **A finger rank at even pitch and even length.** Picket fence / firework
  (`DRAGON-DESIGN §2.4`).
- **Blaming triangles.** Every shipped wing is 1.5–10× under budget; the constraint is legibility.

## Still unknown

- **The real draw-call count per wing.** `tricount` counts triangles only and says so explicitly
  (`tools/tricount.mjs:13-15`). I found no tool that reports draws per part. The Seraph lesson
  (104→24) had to census it by hand. `unknown` — searched `tools/` for `drawcall|draws|renderer.info`.
- **Whether the wings cast into the water-mirror / god-ray aux passes**, and therefore what a
  wing's real per-frame cost multiplier is. The Seraph lesson says the aux passes re-submit
  everything, but I did not trace `composer.js` to confirm it holds for wings. `unknown`.
- **The measured luminance of each hero's membrane at the chase cam** — the Revenant lesson gives
  its number (52% pale before the fix) but no tool in `tools/` reports it generically;
  `tools/readability.mjs` and `tools/silhouette.mjs` exist and may serve, untested here. `unknown`.
- **What the four Vesper `memTiers` actually measure at.** The lesson claims 0.05→0.14 luma after
  the `MEMBLUE` re-aim; I did not re-measure. In the 2.2× pale render only ~3 read. `[no-assert]`.
- **Whether `flapstrip.mjs` still works in this container.** Its own header documents a
  3rd-boot browser crash; I did not spend a ~15 min budget confirming it. `unknown`.
- **Actual fps on a weak mobile device** for any wing configuration. No profiling tool in the
  repo measures device fps; `tools/framecap.mjs` and `tools/perfprobe.mjs`/`_perfprobe.mjs` exist
  and were not run. `unknown`.

---

## Appendix — where the pixels are

The thirteen in-engine renders in `../refs/` are now indexed in `../refs/INDEX.md`:
**§B** gives every file a row (what it is, which dragon and dial set, the exact regenerating
command, what it is evidence OF) and **§C is the honest per-wing read** — one line per wing per
sheet describing what is actually on screen today. §C is the companion to this file: this document
is what the engine CAN do, §C is what it currently DOES.

Two findings recorded there that belong here too:

- **No hero has a working fold.** vesper 0.838 · revenant 0.932 · tempest 0.986 span-contraction
  vs. the §7 law's 0.7×. Only azure (0.475) and ember (0.429) pass, both through bespoke furl
  branches (`poseBladePivots` / `poseLobePivots`) that no premium hero publishes.
- **`tools/wingplate.mjs` does not exist in the repo**, so `refs/plate-camber.png` is currently
  un-regenerable. Flagged in `refs/INDEX.md §A`.
