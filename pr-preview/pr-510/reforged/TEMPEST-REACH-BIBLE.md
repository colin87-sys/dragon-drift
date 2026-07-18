# TEMPEST REACH — THE BIOME BIBLE (Stage 1, Fable art direction)

> The Stage-1 synthesis for **Tempest Reach** (`BIOMES[7]`, STORMREND's home) — the AAA
> storm biome. Produced via the Playbook Part 0.4 workflow: Fable directed the research,
> Opus gathered it (6 threads: game-storm composition, supercell/green-sky color science,
> lightning morphology, storm-ocean/eye structure, stolen-light golden-hour physics,
> storm-native prop-mass geology), Fable synthesized this bible. Every build PR derives
> from this document. Read it before touching Tempest code.

**Biome:** `BIOMES[7]`, matIndex 7, anchor STORMREND. Flyable `?biome=7&debug` pre-flip;
designed for the "storm turn" slot (…Wastes → **Tempest** → Frozen…), not hard-wired — the
CYCLE insertion is a later no-op-provable PR coordinated with the in-flight Lost Lagoon arc.
**The bar:** Part 0.1 — "wow, this game is absolutely beautiful." 4.2/5 is the floor, awe is the target.

---

## 1. THEOLOGY

**THE GENERATING SENTENCE (final):**

> **"The sun is not gone — it is ABOVE the storm, and every light in this world is the storm FAILING to contain it: the leak, the breach, and the blow."**

- **The LEAK** — thin gold rims on the sun-facing arcs of cloud edges; warm points pooled in wave-worn rock sockets that face the hidden sun.
- **The BREACH** — crepuscular shafts through gaps in the deck; the eye is the largest breach, and light and color RETURN at its center.
- **The BLOW** — the lightning flash: light as violence, clipped white, instantaneous.

Mass is dark, wet, and wind-torn. **Nothing in this world is self-luminous** — every visible
light is the hidden sun escaping. (This one clause bans biolume-DNA, aurora-DNA, and
glowing-ice-DNA by construction.)

**Composition corollary (T2):** *The storm is a wheel and the eye is its axle — everything
violent circles; the only stillness is the center.* Cloud banding, veil sheets, and prop yaws
bias into curvature around the down-lane breach.

**Motion mood (T3):** *Nothing here ever lands* — rain mid-fall, crests mid-break, the strike
always about to come. Perpetual suspension, released only in the flash and in the calm cells.

**Target emotion:** **STORM-CHASER AWE** — terror metabolized into exhilaration; the NatGeo
supercell shot, kinetic and hostile, deliberately the opposite pole of awe from Frozen's
held-breath reverence. Awe grammar: a FEW colossal forms (one shelf-cloud massif, one hero
stack punctuation, one breach) over designed emptiness — never a rubble field of stormy noise.

**Time of day (SET by the research — non-negotiable for the palette):** a **hidden sun at 0–5°
elevation**, roughly down-lane behind the storm (compatible with the canonical `SUN_DIR`). The
sun disc is **never visible** — the deep gold `#ffd870` is only earned at this elevation, and
it arrives only as slivers.

---

## 2. THE COLOR SCRIPT

The progression, cool→cold→stolen-warm: **near-black storm deck → green-grey core belt → pale
silver horizon slot → dark wet mass → gold slivers → violent grey-green sea → magenta danger.**
Warm ≤10% of any frame; saturation hoarded at the light/dark terminator (the storm-color law).

**⚠ THREE DELIBERATE OVERRIDES of the BIOME-DESIGN sheet ("bruised grey-violet + storm-teal sky"):**

1. **Saturated storm-teal `#2fd8e8` is BANNED from the biome's ambient palette** (sky, fog,
   props). It collides with Mire's emissive teal horizon (`0x3fd8b0`) and Aurora's curtain.
   Teal survives in exactly two places: **in-eye water glints `#3e6e80`** (the eye quotes the
   boss) and **STORMREND's own kit** — so when the boss arrives, its teal is the most saturated
   thing the biome has ever shown. The biome makes the boss pop by starving its hue.
2. **Violet is demoted from sky-field to LIGHT-EVENT**: it lives only in the lightning halo
   (`#a98bff`) and the pre-flash bruise — the sky field is blue-grey/green-grey (the real
   meteorology), keeping distance from Astral's violet void.
3. **The far fog is PALE, not dark** — receding forms dissolve into rain-veil silver, the only
   biome in the cycle whose far field is LIGHTER than its near field (Frozen melts to gold,
   Caldera/Aurora sink to black). Free distinctness + free depth.

**The slot-by-slot palette:**

| Game slot | Hex | Role |
|---|---|---|
| `sky.top` | `#2b333d` | the storm deck overhead — near-black blue-grey (rain-core register `#2a2f34` cooled) |
| `sky.mid` | `#4d5346` | the green-grey core belt — the meteorological green cast, DESATURATED teal-olive, never emerald |
| `sky.horizon` | `#c6cdc9` | THE VALUE HOLE — pale silver slot under the deck's far edge, ~5–15% of frame, where the breach and sheet lightning live |
| `sky.sun` | `#e0b070` | the veiled-amber bruise where the hidden sun sits — a glow, never a disc |
| `cloud.amount` | 0.95 | heaviest deck in the cycle |
| `cloud.lit` | `#e9cf9e` | gold-leaning rim/lit tops (low hidden sun) |
| `cloud.shadow` | `#2e363f` | committed near-black undersides (what makes cloud read SOLID) |
| `fog.color` (near) | `#3e4a50` | wet grey-slate storm air |
| `fogFarColor` | `#a7b2b0` | rain-veil silver — the pale-far inversion |
| `light.sun` | `#ffd28a`, `sunI ≈ 1.25` | dim stolen gold — the dimmest daylight in the cycle, but DAY (`stars: 0`) |
| `light.hemiSky` | `#6b7a80` | grey-green ambient from the deck |
| `light.hemiGround` | `#2c3a3c` | dark sea-bounce underside rescue |
| `water.deep` | `#1b262c` | storm-trough near-black — KILL THE BLUE |
| `water.shallow` | `#54696b` | grey-green wave face; `waveAmp ≈ 0.95` — the roughest sea in the game (cycle max is Wastes 0.7) |
| foam/streaks | `#c4cdce` | overcast foam — never pure white; one-way wind-combed lanes |
| `ambient` (rain) | `#b8c4c6`, fall ≈ 6.5, sway ≈ 2.4, size 0.22, opacity 0.5 | few/long/thin streaks on ONE wind vector (readable rain is sparse rain) |
| **THE ONE EXPENSIVE HUE** | **`#ffd870`** | stolen gold — cloud-lip rims, the breach shaft, socket glow, the sun-patch on water. **This is STORMREND's glow hex, confirmed by the 0–3° rim research — boss and biome share one warm truth.** Budget ≤8% of frame. |
| Lightning | core `#ffffff` clipped / halo `#8fa8ff→#a98bff` | tint the halo, NEVER the core |
| Danger | `#ff2b6a` (role-locked) | telegraphs + boss danmaku |

**Warm vs cool:** one warm family (the gold), everything else cold. **Saturated vs held:**
everything held except the gold slivers, the magenta danger, and (transiently) the violet halo
— desaturating the field is what makes gameplay elements pop by exception.

**Bulletcontrast pre-check:** the pale horizon slot (`#c6cdc9`, L≈0.78) will eat the default
LIGHT bullet band exactly like Amber Wastes' bright sky did — plan the
`bullets: { light: ~0xa98392-class }` override from day one, and the flash grade must be CAPPED
(see §6) so magenta wins even mid-flash. Both re-gated by `tests/bulletcontrast.mjs` on every
palette PR.

**Dragon check (Law 8):** the Thunderhead Tempest's charcoal `#232836` sits darker than the
biome's mass slate `#4b545c` and silhouettes cleanly against the pale slot; its storm-white
`#d9deff` accents pop against the green-grey field (no hue collision — the field has no violet);
its strike-core `#f2f4ff` speaks the same lightning language as the biome's bolts. STORMREND's
home-read ("bright teal/gold mandala vs bruised cloud") is maximized by override #1.

---

## 3. COMPOSITION LAWS (Part 0.2 — all ten facets)

1. **FRAMING.** The lane is a dolly shot flying INTO the storm's axle: the eye-breach sits
   down-lane in the horizon slot; dark masses flank the corridor; the deck compresses the
   world into a slot between cloud ceiling and sea. The hero always reads on the DARK side of
   the frame's highest-contrast edge.
2. **DEPTH LAYERING.** Four planes, each lighter + less saturated with distance (the pale-far
   fog is the instrument): (P1) in-lane hazards + near props, darkest, wet-glinting; (P2)
   mid-field stacks and prows; (P3) the shelf-cloud massif + virga colonnade, mid-value,
   edge-lit; (P4) the sky slot + breach, brightest. Rain-veil sheets sit between planes as free
   depth curtains.
3. **SILHOUETTE SKYLINE.** Broad and low: stump-fields and prow wedges make a ragged low
   horizon; ONE vertical exclamation (the hero stack) at rare intervals; the colossal
   shelf-cloud wedge spans behind everything with its curling gold lip. Jagged at the
   waterline, resting in the middle, punctuated rarely.
4. **COLOR SCRIPT.** §2 verbatim. The frame's one saturated warm is gold; the frame's one
   saturated cool is the danger magenta; everything else is held.
5. **LIGHT + TIME-OF-DAY.** Hidden sun at 0–5°, down-lane. Value inversion is the law: expose
   for the sliver, crush the storm — the storm wall NEVER warms; foreground warm only inside
   shaft-patches. Gold rims hug only sun-facing arcs and fade around the limb.
6. **ATMOSPHERE.** ONE scene-wide wind vector shared by rain angle, cloud drift, particle sway,
   and foam streaks — wind as the leading line (GoT's discipline). Rain thins over the focal
   breach and bright holes. Height-fog pools low (`atmos.heightK` moderate): the air is
   thickest where the sea is angriest.
7. **WATER / REFLECTION.** The violent sea is the frame's second value rhythm: one-way combed
   foam lanes, smeared crests, near-black troughs — a high connected white fraction, not
   discrete whitecaps. No mirror anywhere EXCEPT the calm cells, where the water flattens a
   notch and — inside the eye register — turns bluer/saturated with teal glints: color
   returning at the center is the calm-in-chaos beat.
8. **FOCAL HIERARCHY.** Eye goes: (1) the breach shaft + its feathered gold sun-patch on the
   sea; (2) the shelf-cloud's gold leading lip; (3) lightning transients (deliberately brief);
   (4) foam lanes leading forward. Props never compete — they are the dark foil.
9. **NEGATIVE SPACE.** The calm lanes ARE the negative space, designed: prop density sparse
   (big gaps between stack groups), strike-free corridors legible as darkness-without-telegraphs,
   and periodic **calm cells** (~every 400–600m: rain thins, water flattens, ambient lifts,
   rims warm) — the biome breathing.
10. **THE MOTION READ.** At flight speed the composition is a rhythm: dark flanks parallax fast,
    the massif crawls, the breach holds still (the fixed point = the axle, T2). Flash events
    punctuate on the beat clock; calm cells are the exhale; the 3-second read is always "dark
    violence left/right, pale slot ahead, gold sliver in it." If a burst-capture flythrough
    doesn't show that sentence, the composition has failed regardless of hero-frame scores.

---

## 4. THE PROP ROSTER

Six unrelated outline families (A3.2 exceeded), massive-first (A3.1), all storm-carved coastal
erosion or storm-sky mass — zero ice/reef/ruin/volcano DNA. Steps are distinct primes (mutually
coprime): 13, 17, 19, 29, 43, 59.

**THE GLOW ADDRESS (one per biome, fixed):** **"wave-worn SOCKETS, low on the mass near the
waterline, lit only on the sun-facing side"** — rounded cavernous hollows (tafoni) holding
pooled stolen gold `#ffd870`. Rounded discrete POINTS in a low horizontal band. Explicitly not
Frozen's vertical mid-body crevasse slivers, not Caldera's linear low fire-cracks (round pocket
vs linear crack; stolen sunlight vs inner fire).

| Key | Family | Role | Silhouette | Mass (b:h) | Accent policy | Step |
|---|---|---|---|---|---|---|
| `stormstack` | wave-cut sea-stack | **HERO / punctuation** | lone pillar, mushroomed cap, pinched waterline undercut notch | ~1:2.2 tall — the ONE tall archetype, rarest step | 2–3 sockets at the notch, sun-side only | 43 |
| `stormprow` | tilted-strata prow | **MID workhorse + FOIL** | layered wedge, long dip-slope rising from the sea to a sharp crest, visible lean | ~2:1 broad-low | **ENTIRELY BARE** — value banding only, zero emissive (makes the sockets earned) | 17 |
| `stackgrave` | stump-cluster | **LOW REST** | scatter of stubby broken stumps over a wave-cut platform | ~3:1 very broad | bare; wet-shelf specular sheen only | 13 |
| `tafonihold` | tafoni block | **THE GLOW CARRIER** | rounded honeycombed block, cavernous seaward face | ~1.3:1 | THE address: a low band of glowing sockets, sun-facing arc only | 19 |
| `arcuswall` | shelf-cloud front | **DISTANT MASSIF** (atmospheric) | colossal horizontal wedge-wall, curling leading lip, flat ragged underside; upper y-band, `foam:false` | ~6:1 | gold rim ON the leading lip (thin accent-mat lip geometry) — the LEAK made monumental | 59 |
| `rainshaft` | virga colonnade | **BACKDROP VEIL** | tall pale column of falling rain, soft-topped | ~1:4, far-field only, `foam:false` | none — it IS light through water | 29 |

**Costing note on `rainshaft`:** zero transparency. It ships as thin OPAQUE pale slabs
(`#a7b2b0`, matching `fogFarColor`) placed far — the pale far fog makes opaque geometry read
translucent for free. If in-context captures disprove the trick, demote to a sky-shader streak
gate; never an additive volume.

Every geological archetype: waterline undercut + lean + horizontal stratification (the three
storm-carved tells), broken asymmetric crowns, offset-stacked lean (never internal rotation),
5–9 parts, ≤150 tris, parts interpenetrating ≥25%, `FOAM_CFG` collar per waterline family
(`false` for the two atmospheric ones), `place()` returns `tilt` explicitly, inner edge ≥14.5
with ρ measured by `propclearance` (widen `SCOPE_BIOME` to 7 in the first prop PR).

---

## 5. MATERIAL DIRECTION

**The Tempest value ladder — "the wind scrubs, the sea soaks."** Axis is NOT world-up sun logic
(that's Frozen's). Key off the **scour axis**: the biome's wind vector blended with up
(≈ normalized `(0.8·windX, 0.5, 0.8·windZ)`). Three stops, passed EXPLICITLY at every
`bakeIceLadder` call:

- **SCOUR** (light stop) `#8e9aa0` — salt-bleached pale grey on wind-facing faces
- **DAMP** (mid) `#4b545c` — storm-slate body, hue nudged green-grey OFF the sky so silhouettes always separate
- **SOAKED** (belly) `#232b31` — spray-wet near-black, low faces and undersides

Material history: bleach-into-the-wind / damp-in-the-lee / black-at-the-sea — orientation story
and light story both its own (Frozen: frost-from-above sun logic; Caldera: heat-from-below).

- **Self-lit floor:** fresh `vertexColors:true` material (never a `frostIce` clone) wrapped in
  `withLadderEmissive`, emissive base `#a8b4b6 @ 0.30` — lower than Frozen's 0.42 on purpose:
  mass is DARK here; the floor exists only so silhouettes survive the pale horizon backlight.
- **Per-facet glints:** primary roughness **0.34** — wet rock justifies low roughness;
  flat-shaded facets + varied `ry` = shuffled wet-sparkle. This is the biome's "richness"
  channel in place of transmission glow.
- **`primary[7]`:** `#4b545c`, rough 0.34, through `addPropDetail` as always. **`accent[7]`:**
  diffuse `#caa25a`, emissive `#ffd870 @ 0.85` — the socket gold.
- **Atmospheric massif mats** (named `tempestCloud*`, separate from the legacy arrays): body
  `#39424c` at roughness 0.85 (matte vapor — NO glints, the deliberate opposite of the rock),
  underside ladder-crushed to `#262d36`, lip accent emissive `#ffd870 @ 0.5` on a thin geometric
  lip part. Cloud reads solid via hard sculpted bright edge + committed black underside + hero
  silhouettes beneath for scale.
- **Mechanical guards** (Part B grep): every `bakeIceLadder(` passes `stops:`; zero references to
  `_FROST/_MIDICE/_BELLY/_WALL_LADDER/mats.frostIce/mats.moverIce/glacierWallMat/crevasseCore`
  or Frozen hexes.

---

## 6. HAZARD ROSTER

### (a) The signature hazard — TELEGRAPHED LIGHTNING (the boss's weapon)

**Verb:** dodge the flash, hold the calm lanes. Strike sites overlay the course on their own
XOR'd `mulberry32` stream + own output array (the `overlayCanyons`/geyser pattern); consumption
below the `inBoss`/grace returns; cursor reset in `resume()`; `gold-determinism` byte-identical.

**The strike, on the research timeline:**

1. **TELEGRAPH (~1.2s):** a soft, PULSING, channel-less magenta bruise (`#ff2b6a`, role-locked)
   glowing in the cloud above the strike point + a faint answering glow on the water below. The
   real intracloud bruise is violet — we keep the role-locked magenta but adopt the bruise's
   GRAMMAR: soft, pulsing, no filament. Readable ≥90m at max speed.
2. **LEADER (1 frame, dim):** blue-violet branched tracer.
3. **RETURN STROKE:** the bolt. **LineSegments recipe** (overdraw-exempt): trunk of 8–12
   segments, ~25° log-normal deflection per joint; 3–5 branches in the UPPER ⅔ only, pointing
   down-and-outward; lower ⅓ clean. Two line passes: core `#ffffff` + offset halo lines
   `#8fa8ff→#a98bff` (bloom carries the violet — tint the halo, never the core; identical to the
   Thunderhead dragon's strike-core convention).
4. **FLICKER (170–450ms):** 2–4 re-strokes 40–80ms apart, trunk only (branch segments hidden) —
   the real dart-leader look, and cheap.
5. **FLASH ENVELOPE (`flashMix`):** hard attack (1 frame), exponential decay ~250ms; a PARTIAL
   sky-lift + desaturation toward `#c7cfe0`, **capped so the magenta danger band still clears the
   frame at peak** (bulletcontrast is re-run against the flash state) — never a full-screen
   white-out (accessibility + the game-storm law). Water throws a brief vertical glare streak
   `#eaf0ff` at the strike point.
6. **THUNDER:** on `sfx.js getBeatClock` — strikes quantize to the beat, so biome rhythm and
   STORMREND's attack rhythm are literally one clock. **Calm cells suppress strikes** — the
   negative space is mechanical, not just visual.

**Ambient light-event (non-lethal):** sheet lightning at the horizon — soft silent pulses
`#cdd8f0` warming to `#e9b27c` low, via a branchless sky-shader `xMix` gate. Tier-free, and it
makes Tempest the cycle's only biome whose light CHANGES.

**Dropped: waterspouts, entirely — even as distant scenery** (research verdict: poaches Tidal
Reef's reserved identity). Distant weather-drama comes from rain curtains/virga and the squall
line instead.

### (b) In-lane obstacle skins — `SKIN_BUILDERS[7]` (colliders byte-identical; fiction 100% Tempest)

*"What, in this storm-sea world, is a beam / a column / a tumbling mass?"* — answered from
coastal erosion, zero shared vocabulary with calved ice:

- **bar → THE SNAPPED STRATA BEAM:** a fallen prow-lintel — horizontal layered rock slab with
  ragged snapped ends, wet-dark ladder. Naturally wider than tall (lateral-dodge law satisfied
  by the collider class itself). Coverage: the bar collider has NO x-term — the visual spans the
  full lane with no gaps; cross-sections authored in unit space + a numeric
  `barColliderCoverage`-style export, re-verified after every transform.
- **pillar → THE YOUNG SEA-STACK:** waterline-notched column + foot rubble (tower/rubble
  contract; rubble on its own uniform `(r,r,r)` scale). **Constraint from the collider:** the
  cylinder collider is `horiz < r·0.65` from the floor — so the visual notch may narrow the base
  by at most ~0.3r, keeping the silhouette containing the collider at every height (no "looks
  passable at the waterline but kills").
- **shard → THE RIP-TORN STRATA CHUNK:** tumbling layered block torn loose by the gale (the
  fiction justifies slow tumble), bounding box ≤1.25:1, ladder keyed to a FIXED per-chunk
  weathering axis (orientation-invariant — the tumbling rule, no bake flicker). Moving variant:
  identical geometry, magenta-pulse material split. **Engineering note:** this skin REQUIRES the
  `hazardMesh` seam extension — the skinned-shard branch hardcodes `mats.frostIce`/`mats.moverIce`;
  parameterize per-biome or we silently ship Frozen ice (the named Part-B leak path).

Hazard skins carry NO gold sockets (accent stays scenery-only; hazards speak magenta + biome
mass). All three get their own numeric coverage exports + `tests/hazardskin.mjs` entries, scored
at the 4.2 studio floor AND in-context dead-center in the worst light.

---

## 7. PART B — ANTI-REPLICATION CHECKLIST, PRE-RUN

- ☑ **Silhouettes vs Frozen/Aurora:** stacks/prows/stumps/tafoni carry the three storm tells
  (waterline undercut, lean, horizontal strata) absent from all faceted-ice forms. **One guarded
  risk, named:** `arcuswall` vs `glacierwall` are both long horizon walls — guarded by class
  (atmospheric vs grounded), position (upper y-band, floating on the far fog), value (mid-light
  edge-lit vs luminous ice), and profile (curling 6:1 wedge lip vs sheer face). Gate-2 must
  compare these two contact sheets side by side explicitly.
- ☑ **Outline families from ITS geology:** coastal wave erosion + storm-sky mass, not {tabular
  wall / block pile / stepped shelf / broken horn / shelf-front}.
- ☑ **Glow address:** rounded low waterline sockets vs Frozen's mid-body crevasse slivers vs
  Caldera's linear low fire-cracks — round vs linear, stolen sun vs inner fire.
- ☑ **Ladder axis/story:** wind-scour axis + wet belly ("the wind scrubs, the sea soaks") vs
  Frozen's world-up frost logic; stops passed explicitly everywhere.
- ☑ **Hazard-skin vocabulary:** snapped strata beam / notched stack / torn chunk — zero
  calved-ice nouns.
- ☑ **Atmosphere opposes every twin, blind-screenshot:** only DAY storm (`stars:0` vs three night
  biomes); only pale-far fog in the cycle; only violent sea (waveAmp 0.95 vs 0.2–0.7); only
  time-varying light (flash/sheet events); green-grey transmitted cast top-down vs Mire's
  emissive teal bottom-up; crushing low ceiling vs Astral's infinite void; saturated teal absent
  vs Aurora's curtain.
- ☑ **NAMED GUARDED PAIR — vs the MERGED amber Lumen Mire** (owner-requested check, 2026-07-16;
  re-run against PR #464 "Lumen Mire overhaul PR-1", **merged to master**, after which this branch
  was rebased onto it). The Mire overhaul flipped Mire from teal to **AMBER** — theology *"nothing
  shines from the sky; the drowned forest makes its own light."* So the shared risk moved from teal
  to **warm gold** (Tempest's one expensive hue). They resolve it oppositely, on FIVE axes:
  1. **Light logic — exact inverse.** Mire = self-emitted by organisms, no sky light (`accent[4]`
     firefly amber `0xffc23a` is the SOLE emitter @0.9). Tempest = ALL light from the hidden sky-sun,
     *nothing self-luminous* — gold only leaks/reflects.
  2. **Gold's role.** Mire: amber is the **dominant field** (roof `0x171410`, far-fog `0x2b2314`,
     motes, black-mirror water all warm) — the RULE. Tempest: gold is a **rationed ≤10% accent**
     (`0xffd870`) on a COOL field — the EXCEPTION.
  3. **Field hue.** Mire warm amber/black; Tempest cool blue-grey/green-grey/silver.
  4. **Time + sky.** Mire NIGHT (`stars:0.2`), dark canopy ROOF, no horizon composed; Tempest DAY
     (`stars:0`), pale-silver value-hole horizon, vast storm deck.
  5. **Water.** Mire black-mirror STILL (`waveAmp 0.2`) doubling the glow; Tempest VIOLENT
     (`waveAmp 0.95`) with foam streaks.
  Even the gold differs: Mire's saturated firefly amber `0xffc23a` glowing in a dark field vs
  Tempest's pale bright sunlight gold `0xffd870` as rim/shaft on a cool field. Blind-screenshot:
  "dark warm still glowing night swamp" vs "cold vast violent day storm with a pale slot + gold
  leaks" = different games. PASS. Guard to HOLD at build time: keep Tempest's warm strictly
  rationed (≤10% of frame) and the FIELD aggressively cool, so the gold always reads as the
  exception, never as a Mire-like warm wash.
- ☑ **Theology side-by-side:** Frozen — "cool light lives IN the ice; warm light only ever comes
  FROM the sun" (visible sun, transmissive mass, warm FIELD). Tempest — "the sun is above the
  storm; every light is the storm failing to contain it" (hidden sun, occlusive mass, warm SLIVER
  ≤10%). Both suns are low — the guard is that Frozen's sun is a visible second protagonist and
  its horizon is a warm field; Tempest's is never seen and its horizon stays cold silver.
- ☑ **AWE-SOURCE per beauty beat:** the eye-breach (hurricane stadium-effect + crepuscular
  physics + STORMREND's own mechanic — biome-native); the gold shelf-lip (arcus morphology +
  0–3° rim science); the flash grammar (lightning color science + the shared beat clock). No
  beat's honest description is "the shot from GoT" or "another biome retinted."
- ☑ **Mechanical grep (committed as a PR gate):** every `bakeIceLadder(` with explicit `stops:`;
  zero `_FROST/_MIDICE/_BELLY/_WALL_LADDER/frostIce/moverIce/glacierWallMat/crevasseCore` refs;
  zero Frozen hexes (`0xbfdce6`, `0x3fc8e8`, `0x357088`, `0xcfe4f0`, `0xd8f6ff`); `hazardMesh`
  shard seam parameterized before any Tempest shard ships.

**All boxes pass at design time; the arcuswall/glacierwall row is the one carrying explicit
build-time scrutiny.**

---

## 8. PHASED BUILD ORDER (PR-sized, playbook A1)

| PR | Scope | Gates |
|---|---|---|
| **PR-0 — Atmosphere substrate** | `BIOMES[7]` entry (full §2 palette, `stars:0`, pale `fogFarColor`, cloud block, rain motes on one wind vector, `waveAmp 0.95`, heightK), sheet-lightning sky `xMix` gate, `bullets:{light}` override. Flyable `?biome=7&debug`. No CYCLE flip. | bulletcontrast · biomecycle · gold-determinism · browser boot render · **Fable in-context: does the sky alone already read "unmistakable in a blind test"?** |
| **PR-1 — Materials + first rock wave** | `primary[7]`/`accent[7]`, the scour ladder + self-lit floor, `stormprow` + `stackgrave` + `tafonihold` archetypes, `FOAM_CFG`, propclearance `SCOPE_BIOME` widened to 7. | studio contact sheet (two rigs, plan view, floor 4.2) · envcount `--ci` · propclearance · NaN scan of `place()` lattice · in-context flythrough re-score |
| **PR-2 — Hero + massifs + composition** | `stormstack` hero, `arcuswall` (+ lip accent), `rainshaft` backdrop, density/negative-space tuning, calm-cell lerp channels. | studio + envcount + **the Part 0.2 COMPOSITION CHECKPOINT on moving captures** (arcuswall-vs-glacierwall side-by-side mandatory) |
| **PR-3 — Obstacle skins** | `SKIN_BUILDERS[7]` trio + `hazardMesh` per-biome material seam + coverage exports + `hazardskin` test entries. | studio w/ hitbox ghosts · coverage tests · gold-determinism · in-context in the sun corridor (worst light) |
| **PR-4 — The lightning hazard** | New strike type in `hazards.js` + level.js overlay on a fresh XOR'd stream, telegraph→bolt→flicker→flash per §6, `flashMix` grading (capped), thunder on the beat clock, calm-cell strike suppression, `resume()` reset. | **gold-determinism (the critical one)** · bulletcontrast INCLUDING peak-flash state · stress check (first new FX class → `tools/stress.html` on a real phone) · fairness flythrough |
| **PR-5 — The eye + cohesion + the bar** | Eye-breach horizon landmark (fog-exempt sky-whale slot: shaft + sun-patch + in-eye teal glints), STORMREND `warnGrade` retrofit tie-in (BOSS-DESIGN §5j), final grading bias, ambience bed hook. | full suite · **the AWE checkpoint: composition score on the flythrough vs Part 0.1** · owner preview staged with `?biome=7&debug` + what-to-look-at list |

Every PR: Fable Gate 1 pre-build / Gate 2 pre-merge, one `leapfrog/lessons/` file
(`graphics-tempest-` slugs), and **`node tools/stamp-sw.mjs` before every owner fly-test** (the
twice-bitten rule). CYCLE flip is its own later no-op-provable PR, coordinated with the Lagoon
arc. Budget one owner redirect — the gap between "all elements ≥4.2" and "absolutely beautiful"
is where the remaining art direction happens, and Fable stays resumed through all of it.

---

### Summary of where Fable beat the sheet/research rather than followed it

- Banned saturated storm-teal from the biome ambient (starving the hue so STORMREND detonates on arrival);
- demoted violet from sky-field to light-event;
- inverted the far fog to pale silver (cycle-unique + free depth);
- set the time-of-day to a hidden 0–5° sun (which made STORMREND's `#ffd870` the physically correct rim gold — the luckiest convergence of the research);
- dropped waterspouts outright to protect Tidal Reef.
