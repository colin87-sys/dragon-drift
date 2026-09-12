# THE EMPYREAN — Biome Bible **(v2 — post-audit revisions)**

> **v2 note (2026-07-17, Fable):** revised per my own pre-build audit (`G1-fable-audit.md`,
> verdict REVISE-FIRST, 12-item list — all applied):
> **(1)** §3 kills the three engine suns the v1 spec missed — `sky.sun` canon stop, the
> `empyMix` sun-disc/glow kill in the sky shader, `godrayMul: 0`, plus `bright: true` for the
> HUD; all in PR-1 scope. **(2)** §4b now specs the water's pow-240 sun-glitter kill
> (`nacreMix` attenuation, `sunColor` fallback, R1 satin lobe replaces it). **(3)** §4a adds
> the skyProbe FOURTH-touch paragraph + probe-ON/OFF judging in the PR-1 gate. **(4)** The
> Breach is re-authored against the real 400m `AUR_RAMP_OUT` seam; arrival-park extended to
> ≥450m; Empyrean→Lagoon stays a normal 150m seam. **(5)** PR-1 interim treatment decided:
> pale retint of `mats.body[5]` + legacy archetypes; gate wording aligned. **(6)** §4a blooms
> rewritten to consume R2 verbatim — 4 octaves, warp ≈2, radial anisotropy 1:2–1:3, carved
> lanes with one-sided lit rims (the "multiply darker" wording is dead), sat ∝ (1−density);
> tier-2 drops warp ORDER, not octaves. **(7)** §4a stars now carry R7's absolute numbers
> (20–60 total, ≤1px gauss cores, +15–30% max, × (1−local sky luma)). **(8)** §8 Mote: limb
> partial/one-sided at r/20–r/40; size mechanism resolved to scripted slow growth; the
> hole-vs-object occlusion + hard-edge lines added. **(9)** §5 gains a RESEARCH OVERRIDES
> block (R4 warm-SSS rim and R6 L25–40 faces are VOID here). **(10)** `empyStone` dropped to
> `0xc2bcd6` to satisfy R3's ≥10-L-point read rule at 120m; the numeric mid-field target is
> now a §2 capture gate; pearlshoal gets a cadence floor; the bloom-below-zenith clause added.
> **(11)** PR-5's main line item is a NEW instanced vertex-shader `inkShoal` flock (R5's
> parameter card), not a fauna retune. **(12)** Hygiene: "Drowned Forum" → THE LOST LAGOON
> everywhere; R7≡R2-Element-B mapping note; `?props` flag direction fixed (new kit default,
> `?props=v1` restores legacy, `?props=v2` for preview); line-number citations refreshed
> (`sharedUniforms` water.js:50, `hazardMesh` obstacles.js:1368 / `SKIN_BUILDERS` :1352).
> Everything the audit PASSED is preserved unchanged.

**Fable-authored build sheet (Stage-1 art direction), engine-grounded.** Biome **5**
(`BIOMES[5]`, today "Astral Shallows" — renamed; the entry keeps its index, `CYCLE` position
final-before-loop: … Mire `4` → Aurora `6` → **EMPYREAN `5`** → THE LOST LAGOON `0`). Realizes
owner-locked **Vision B** from `E1-fable-astral-visions.md` per the brief
`F0-fable-empyrean-bible-brief.md`. Bar: the Lumen Mire bible (premium standard). Art director:
**Fable**. This file is the single source of Empyrean truth: the build sessions and the
reference-research agents both work from HERE.

**Owner vision:** the cosmos finale that BREAKS the dark run — after Mire's biolume night and
Aurora's aurora night, you breach the ceiling of the night into a **bright, luminous
pearl-violet void**: a depthless heaven of soft nebula blooms and nacre water, no sun, no gold,
no horizon — and the only dark thing in all that light is one small black point, waiting.
"It needs to look legit and beautiful, not like fake AI slop that people would laugh at."

**Identity triple (BIOME-DESIGN §3 Law 1):** Identity — "the luminous void": the biome that
isn't a night; brightness without warmth. Hazard — **gravity-wells** (child voids: black cores,
danger-magenta accretion rings; dodge-only; pull is the flagship deferred verb, §10 backlog).
Verb — **thread the halos, shun the dark** (fly the ring-arcs; the only dark things are the
things that kill you). Anchor — **THE UNMASKED** (T5, slot 14) as **OPTIONAL atmosphere, not a
dependency** (owner decoupling on record): the biome ships as a **BREATHER** (Aurora precedent,
the sanctioned Law-1 exception), landmark standing in for the lid. Sensory signature —
shadowless pearl light from everywhere, pastel nebula blooms breathing overhead, nacre water,
rising light-motes, ink-black koi, one black point on the horizon-that-isn't.

---

## 1. NAME + THEOLOGY

**THE EMPYREAN.** The medieval name for the highest heaven — the sphere of pure light beyond
the stars. One word; no "Shallows" (E1 Ruling 1 executed — the Astral-Shallows/Aurora-Shallows
collision dies here); no leading A. The `BIOMES[5].name` string change lands in PR-1.

**THE THEOLOGY — THE INVERSION LAW:**

> **"Here the sky itself is the light — sourceless, shadowless, brightest at the zenith — and
> in a world made entirely of light, darkness is the only thing that can hurt you."**

| Biome | Subject | Light source | Value ramp | Verb |
|---|---|---|---|---|
| THE LOST LAGOON (0) | drowned temples in a jade lagoon at golden hour | the low warm sun through apertures | dark frame, warm key | passes-through |
| Lumen Mire (4) | a living drowned forest | the ORGANISMS (metabolic) | dark frame, amber cores | makes-its-own |
| Aurora (6) | a dark still mirror | the sky-curtain (solar wind) | dark frame, green band | reflects |
| **EMPYREAN (5)** | **the void itself, luminous** | **NONE — the sky IS the light** | **INVERTED: brightest at zenith; dark = threat** | **surfaces / releases** |

Corollaries every element answers to (audit each asset against all four):

- **No source, no shadow.** There is no sun disc, no god-ray, no cast shadow, no specular
  hot-spot pretending to be a sun. Light is omnidirectional skylight. Any element that implies
  a directional source is cut. (This is also the warm-gold firewall: gold IS a source color.)
  **The engine draws suns by DEFAULT in three places, and each must be explicitly killed —
  the sky shader's sun disc, the water's sun-glitter specular, and the god-ray fan. §3 and
  §4b carry the exact kills; PR-1/PR-2 gates scan the sun azimuth for all three.**
- **The value ramp is inverted.** Every other biome is a dark field with bright accents; the
  Empyrean is a bright field with NO dark accents — except threat. Brightest pixels live at
  the zenith and in bloom cores; the structural mid-tones live in wave troughs and prop
  bodies; **the darkest pixels in any frame are role-locked to danger** (the Mote, well cores,
  koi at punctuation scale — §6 sizes the exemption).
- **The horizon does not exist.** Fog, far water, and low sky converge on one opal value —
  you cannot tell where water ends and sky begins (the horizon-dissolve, §4). No far massif,
  no canopy wall, no skyline: the Empyrean's "far mountain" is pure light. (The exact
  anti-Mire: Mire has a roof and no sky; the Empyrean has ALL sky and no walls.)
- **Everything drifts up.** The emotional beat is SURFACING — release, light after darkness,
  a diver breaking into open sky. Motes rise, koi school upward through frame, blooms breathe
  outward. Nothing here presses down (the anti-Tempest) and nothing hangs (the anti-Mire).

## 2. EMOTION + THE MONEY SHOTS (composition is half the grade)

**Target emotion: SURFACING — "I came out the other side of the night."** (Mire =
living-wonder hush; Aurora = held breath under the curtain; **Empyrean = the exhale into
light** — relief with a single held note of dread: the black point.)

**THE OPEN-DOME LAW (the structural anti-Mire/anti-Aurora lever, binary-auditable):**
> **No frame's top edge is ever occluded. ≥60% of every cruise frame is luminous sky/fog
> field; the zenith band (top 20% of frame) contains the frame's brightest pixels; no prop,
> drape, or ceiling element may cross the top edge.** Mire has a roof; the Empyrean has had
> its roof removed — including the night.

**Compositional grammar — THE LUMINOUS FIELD + THE ONE DARK POINT.** The eye reads an
almost-empty bright field, structured by three quiet devices: (1) the wave-trough lattice on
the nacre water (the only continuous mid-value texture — the "floor" read), (2) pale prop
silhouettes sitting one value-step BELOW the sky (edge-lit cutouts of light-on-light), and
(3) **exactly one true dark accent per frame maximum** — usually the Mote, sometimes a koi
shoal, in-hazard a well core. Depth without darkness (the high-key three-layer stack, and the
hardest craft problem in this biome — research item R3): near = rising motes + nacre
iridescence detail → mid = pale prop silhouettes at descending contrast → far = the opal
dissolve. Contrast decays with distance TOWARD light, never toward murk.

- **Money shot 1 — "THE BREACH" (the seam — the transition IS a wow moment, and it's free).**
  Exiting Aurora's near-black mirror dome: **this seam is aurora-adjacent, so `computeEnv`
  widens every channel — the crossfade runs the full 400m `AUR_RAMP_OUT` window
  (biomes.js:494-513, `AUR_RAMP_IN 600` / `AUR_RAMP_OUT 400`), NOT the standard 150m.**
  Author to the 400m and embrace it: a slower dawn — the fog THICKENING and BRIGHTENING
  (Aurora indigo-black → opal) across 400m, the water tint lifting, the aurora curtain's green
  dying to zero — the world overexposes into pearl over a long held breath. `whaleMix` (→ the
  Mote after the landmark generalization, §8) rides the same 400m window, so the Mote fades in
  as the light does. An **arrival-park** keeps the first **~450–500m** of biome 5 EMPTY (no
  props, no koi, no hazard — bare nacre water + luminous fog + the sky ramp): **the park must
  outlast the seam** so that when the crossfade completes, the first read is nothing but
  light. Then the fog relaxes and the first Halo arc resolves ahead. Flyable by construction:
  it happens along the flight line at cruise, camera untouched. (Grade the seam BOTH
  directions; **Empyrean → THE LOST LAGOON at the loop seam is a NORMAL 150m seam** — no
  aurora widening — and its warm terracotta golden-hour is the loop's chord change — cool
  pearl falling into warm gold — judged on the preview too, against `LOST-LAGOON-BIBLE.md`.)
- **Money shot 2 — "THE MOTE" (the postcard / the hero composition).** Cruising beneath a
  colossal rose nebula bloom, its light moving on the nacre crests, through a corridor of
  **broken Halo ring-arcs whose implied circles all concentre on one point ahead** — and at
  that point, in all that brightness, hangs a small, perfectly round, **perfectly black
  disc**. It doesn't glow. It doesn't move. It gets bigger — a slow scripted growth across
  the biome (§8). Threading each arc re-centers the Mote in the arc's void (the Mire
  arch-corridor pattern: the leading line and the flight line are the same object). It is the
  most legible landmark in the game because it is the only dark pixel in the frame.
- **Money shot 3 — "THE CHOIR" (negative-space hush).** The field opens: bare nacre water, a
  single Choir court (one great Sentinel ringed by 5–7 lesser stelae) standing in the
  dissolve, rose rim-light on their windward edges, a slow shoal of ink koi threading between
  them, motes rising. No arcs, no Mote in frame. The NatGeo "found, not designed" frame —
  proof the biome holds beauty with zero spectacle. **RESERVED EASEMENT (boss-stage law): a
  permanent ~30° azimuth arc centered on the Mote's bearing is kept prop-free at all
  distances** — the Mote must always be approachable through clean light (and it is THE
  UNMASKED's stage when the coupling lands). No dressing pass may plant anything in it.

**Numeric composition targets at cruise (judge on captures pinned `?biome=5&debug`):**
top-edge occlusion = 0 every frame; ≥60% of frame ≥ value 0.75 (sRGB); brightest pixels in
the zenith band (**bloom cores stay a step below the zenith stop — the zenith always wins,
§3**); ≤1 true-dark accent per frame (koi exemption per §6 size cap); wave-trough lattice
visible to ≥120m (the depth floor); **the mid-field READS: the nearest Choir court (or any
must-read prop) sits ≥10 L-points off its backdrop at 120m — R3's numeric floor, measured on
the capture, not vibes**; every prop shows the two-tone edge read (body one step below sky +
bright rim); **no cruise frame with zero non-water elements below the horizon line** (the
pearlshoal cadence floor, §5, is what makes this passable); the 30° easement clean; **and the
danger band still wins — `bulletcontrast` green on the high-key field (§3, a real gate, not a
formality).**

## 3. MATERIAL IDENTITY — palette, value structure, water, fog, light

**Value ladder — "LIGHT IS THE FIELD; DARK IS THE EVENT" (the Mire ladder, inverted).**
Grade every shot top-down:

1. **Zenith** `0xf4efff` — the frame's brightest pixels, always. **Bloom cores `0xf6ddea`
   sit a step BELOW the zenith stop (rose core ≈L89 < zenith ≈L92.5) — the zenith always
   wins.** A builder "pushing the bloom" must never contest the Open-Dome gate; the ordering
   is the constraint that makes the §2 numbers work.
2. **Sky field + far dissolve** `0xefeaff → 0xdcd7f4 → 0xcdd3f5` (zenith→mid→horizon: an
   INVERTED ramp, value increasing upward — the anti-everything).
3. **Nacre crests + rim-lights** `0xece2f2` crest glints, `0xf2b8d8` rose rims.
4. **Prop bodies** `0xc2bcd6` — pale cutouts a clear step below the sky (light-on-light),
   **L≈73–76: low enough to survive R3's ≥10-L-point read rule at 120m in shipping fog,
   still pale against the L92 zenith.**
5. **Wave troughs — the structural mid** `0x6a6490` — the darkest DECORATIVE value in the
   biome. Nothing decorative may go below this.
6. **ROLE-LOCKED DARKS (threat + punctuation only):** koi ink `0x1a1424` (small, moving,
   size-capped); well cores + the Mote `0x050308` (true black, the danger read).

**Full labeled palette (canon build-sheet hexes):**

| Role | Hex | Law |
|---|---|---|
| Sky — zenith | `0xefeaff` | luminous lavender-white; the frame's bright pole |
| Sky — mid | `0xdcd7f4` | pearl lavender |
| Sky — horizon | `0xcdd3f5` | pale periwinkle; still HIGH-key (this is the ramp's darkest stop and it is light) |
| **Sky — `sun` (canon stop)** | `0xdcd7f4` | **= sky-mid. The slot must be authored: the shipped Astral `0xcfe8ff` is a cool bright sun that survives any retune that skips this row. The `empyMix` shader kill (below) zeroes the disc; this stop exists so the SEAM-lerp never drags a hot neighbor sun across the crossfade** |
| Nebula bloom — rose | `0xf6ddea` core → `0xf2b8d8` body | pastel, low-sat; NEVER hot rose (boss's supernova); core stays below the zenith stop |
| Nebula bloom — orchid | `0xcabcf0` body → `0xb9a4e8` fringe | pastel violet; sat cap S≤0.30 in HSV — the anti-Hollow firewall |
| Nebula dark-lane floor | `0xbfb6da` | the darkest a lane may occlude to — pearl-grey, never dark; lanes are CARVED channels with a one-sided lit rim, not "multiplied darker" (§4a) |
| Star pinpricks | `0xffffff` @ 20–60 total, ≤1px cores | texture IN the light, not points in darkness (R7); visibility × (1 − local sky luma) — §4a |
| Fog — near (story) | `0xd8d4ee` | opal; bright fog is the biome's air |
| `fogFarColor` (FAR) | `0xe6e1f6` | **distance dissolves TOWARD light** (inverted aerial perspective; the horizon-dissolve, §4) |
| Water — nacre crest | `0xe8def0` | catches bloom rose on crest faces |
| Water — nacre mid | `0xc6bede` | the body tone |
| Water — trough | `0x6a6490` | violet-grey; THE structural mid; darkest decorative value |
| Water — sub-surface | `0x9c92c2` | the depth tint under the shallows term |
| Iridescence band (crest shimmer) | `0xf2c4dc` ↔ `0xc4cdf4` ↔ `0xdcd2f0` | rose↔periwinkle↔lilac ONLY — the thin-film ramp is constrained OFF green and OFF gold (R1) |
| Water — `sunColor` fallback | pale sky tone (≈`0xdcd7f4`) | **feeds the legacy specular path at seams only; inside the biome `nacreMix` kills the glitter term outright (§4b)** |
| Key light (ambient/hemi sky) | `0xf2eeff` | shadowless white-violet skylight |
| hemiGround bounce | `0xbfb2d8` | pale violet up-bounce off the nacre (undersides stay LIGHT — no dark bellies) |
| Prop body — `empyStone` | `0xc2bcd6` | bone-nacre matte, L≈73–76; a clear step below sky AND R3-legal (≥10 L-points off the dissolve at 120m — the v1 `0xd0cadf` ghosted out at ~2–3 points; dead) |
| Prop rim — `empyRim` | `0xf2b8d8` @ emissive ~0.35 | rose edge-light; edges only, never a full outline (§5) |
| Koi ink | `0x1a1424` | violet-black, NOT pure black — punctuation, never threat-read (§6) |
| **THE BLACK — Mote + well cores** | `0x050308` | the biome's signature accent; role-locked to threat/landmark; appears NOWHERE decoratively |
| **DANGER MAGENTA** | `0xff2b6a` | engine role-locked hex; accretion rings + telegraphs ONLY |

**Emissive-energy statement:** ~0% of the frame is dark stock — the inversion means the
Empyrean has no "glow budget"; it has a **DARK budget: ≤1 true-dark accent per frame**, plus
the koi exemption. **FORBIDDEN: any green in any register (Mire-forbidden + Aurora owns 557nm);
any warm gold/amber (THE LOST LAGOON + Frozen own it, and gold implies a source); any saturated
indigo below value ~0.45 or any gold-rose above sat ~0.45 (THE UNMASKED's arena — the boss's
S2 Hollow is bruise-violet dark void `0x0a0616–0x2a1a4a` and S3 is indigo vault + molten-gold
galactic band + hot rose-violet supernova; the Empyrean is the MASK the boss tears away, so
the biome must never preview the reveal: pale, pastel, high-key, always).** Mechanical grep
for the kit diffs: no `0x0a0616`/`0x2a1a4a`/gold hexes (`0xffc***`,`0xf7a***`,`0xffd***`
families)/`0x9de39a`/`0x5fc8e8` or any hue 90–180°; every emissive ≤ sat 0.35 except
`0xff2b6a`.

**Re-pass `bulletcontrast` — a REAL gate (brief constraint 5, called out as ordered):** a
high-key field is a NEW contrast regime — every shipped `bullets:{light,mid,dark}` band was
tuned against dark biomes. Expect biome 5 to flip to its DARK band as primary (dark bullets
on a bright field) with magenta cores; retune `BIOMES[5].bullets` until the gate is green in
PR-1, again after the nacre water (PR-2), and after every palette touch. Danger in the
Empyrean = **dark + magenta**; wonder = pale + pastel. The two reads must never share a pixel.

**Water (the one NOVEL SYSTEM — flagged per Vision B feasibility; full spec §4b):** nacre —
`setWaterTint` gets the ramp above; `waveAmp ~0.4` (visible sculpted swell — NOT the Mire/
Aurora mirror; nacre scatters, it does not reflect). New uniforms in `sharedUniforms` ONLY.
**The legacy sun-glitter specular dies under `nacreMix` (§4b — the second engine sun).**

**Fog:** near `0xd8d4ee` (near ~60, far ~340 — the Empyrean is OPEN; farther planes than
Mire's enclosure; **tuning latitude: fogNear may push to ~80 during the §4c triple session if
the 120m R3 read needs more air — `empyStone`'s drop to `0xc2bcd6` is the primary fix, fogNear
is the trim knob**), `fogFarColor 0xe6e1f6`, `heightK ~0.02` (thin, even — no ground-mist
pooling; the air is uniform light). The horizon-dissolve is fog + sky + water far-field
CONVERGING on one opal value (§4c) — the three must be retuned together (the §5.2 dual-fog
divergence gotcha applies doubly here).

**Light — the NO-SOURCE spec, implemented against the actual engine (three suns to kill,
all in PR-1/PR-2 scope):**

- **Directional light:** `sunI` → ~0 contribution. High ambient + hemiSky `0xf2eeff` /
  hemiGround `0xbfb2d8` — undersides stay luminous (shadowless omnidirectional skylight; a
  dark underside is a broken asset in this biome).
- **Sun #1 — the sky shader's sun disc (environment.js:2933-2934):** the skyMat adds a tight
  pow-900 disc + a broad pow-10 glow from `BIOMES[].sky.sun` — additive, so even `sky.sun` =
  sky color leaves a +70% hotspot at the sun azimuth. **PR-1 adds an `empyMix` kill factor
  multiplying BOTH sun terms toward zero** (the aurora already does exactly this —
  `(1.0 - 0.85*uAuroraMix)` — one-line precedent), **AND** the canon `sky.sun` stop
  `0xdcd7f4` lands in the palette (table above) so the seam-lerp never drags a hot neighbor
  sun across the 400m crossfade while `empyMix` is still mid-ramp.
- **Sun #2 — the water's sun-glitter lane:** killed by `nacreMix` in PR-2; full spec §4b.
- **Sun #3 — the god-ray fan:** `env.godrayMul` defaults **1** with a warm-white
  `godrayTint` (biomes.js:474-477) — biome 5 inherits both today. **PR-1 sets
  `godrayMul: 0`** — a sourceless sky has no shafts; go to true zero (the Mire metered its
  rays at 0.075 for its glow-halos; the Empyrean has none to preserve). Note the main.js
  god-ray gate when wiring.
- **HUD:** **PR-1 sets `bright: true`** (the EMBERSIGHT H6 skyLuma flag Amber Wastes and
  Frozen carry) — the Empyrean will be the brightest field in the game and the HUD keylines
  must swap to the ember-core variant. HUD legibility joins the PR-1 gate.
- **Stars:** via the existing `starMix` gate retuned to the bright-field treatment (§4a).

The shipped Astral dark-void sky is REPLACED wholesale by the PR-1 substrate — blind-test it
reads as a NEW biome before any prop.

## 4. SKY-PHYSICS + WATER (the two substrate systems)

### 4a. The sky — nebula blooms, stars, and the inverted ramp

What replaces Aurora's curtain and Mire's roof: **the sky itself is the hero** — a luminous
inverted gradient carrying two to three colossal pastel nebula blooms.

- **The ramp:** three-stop vertical gradient (horizon `0xcdd3f5` → mid `0xdcd7f4` → zenith
  `0xefeaff`), value INCREASING upward. Lives in the existing sky-dome shader (`fog:false`,
  `depthWrite:false`, base pass — **tier-free by construction**).
- **The blooms (count: 2 at cruise, 3rd rare) — the R2 build, consumed verbatim:** one
  colossal ROSE bloom (`0xf6ddea` core → `0xf2b8d8` body, ~35° of sky, low on one flank) +
  one ORCHID bloom (`0xcabcf0→0xb9a4e8`, ~20°, high opposite flank) + an occasional small
  third. **Implementation is branchless fragment math, NOT geometry and NOT additive shells**
  (the overdraw law). Per bloom:
  - **Density field:** domain-warped fBm **value noise, 4 octaves** (lacunarity 2.0,
    gain 0.5 — R2's sweet spot; 6+ octaves = dusty noise slop, 1 octave IS the blob), using
    iq's nested warp `fbm(p + WARP·fbm(p + WARP·fbm(p)))` with **WARP ≈ 1.5–2.5 (~2)** — the
    single "storminess" dial; heavy warp (4.0) is the turbulent Hubble curl and belongs to
    the boss arena, not here.
  - **Anisotropic combing (R2's single most important non-slop cue):** before warping, squash
    the noise domain in a frame oriented radially from the bloom core — **radial : tangential
    ≈ 1:2 to 1:3** — so round cells shear into long directional wisps (the Pleiades combing).
    Isotropic fluff = the AI blob.
  - **Falloff, kept subordinate:** a soft radial falloff whose **radius is itself perturbed
    by low-octave noise** (no clean ring, no clean center), with a density floor
    (`0.45 + 0.55·base`-shaped) so the field stays luminous everywhere and the gradient never
    shows through bare.
  - **Dark lanes — CARVED, not multiplied:** lanes are a **separate low-frequency warped
    field**; a thin isoline band cuts one or two coherent meandering channels across the
    filaments, occluding at most to the `0xbfb6da` floor (~0.5–0.7 multiply max — the darkest
    dust is still pearl-grey), **with a one-sided LIT RIM on the bright edge** — the
    shock-front cue that sells dust-in-front-of-light. In a bright field a lane reads by
    SHAPE + rim, not by depth of darkness. (The v1 "dark lanes multiply toward `0xbfb6da`"
    wording is dead — R2's header is literally "not 'multiply darker'".)
  - **Saturation tracks density INVERSELY:** hard-clamp S ≤ 0.30, and make the brightest
    knots the LEAST saturated (near white, S≈0.12), saturation rising only in mid-density
    wisps. Hue stays in the rose→orchid→periwinkle arc (~300°→255°). **Value floor ~0.72** —
    even the "dark" nebula is a luminous pearl; contrast lives in hue + structure, never in
    a dark value swing. Bloom cores stay below the zenith stop (§3 ladder).
  - **Breathing:** each bloom's radius and warp phase ride a ~90s sine, phase-offset per
    bloom — slow enough to feel like weather, never a pulse.

  All of it gated by **`empyMix`** (a new `xMix`, default 0 — byte-identical off, crossfades
  at seams by construction; the three-touch rule: field in `BIOMES[]`, lerp in `computeEnv`,
  consumer in `updateEnvironment` → sky uniforms). `empyMix` also carries the sun-disc kill
  (§3).
- **The FOURTH touch — skyProbe (the ported-drift trap; it has bitten twice already):**
  `js/skyProbe.js` re-implements the skyMat gradient in JS (`skyColorAt`) and projects it to
  the SH LightProbe — `deckBias` and `breachMix` both had to be mirrored there after the fact
  (the file's own comments document it), and `tests/skyprobe.mjs` guards the mirror. For the
  Empyrean: the inverted RAMP flows through automatically (it's `env.skyTop/Mid/Horizon`
  data), but the **nebula blooms are fragment-shader-only and a ~35° rose bloom is
  steady-state radiance, not a transient** — so PR-1 **mirrors a cheap bloom lift into
  `skyColorAt`** (the `breachMix` pattern: a couple of lines, gated on `empyMix`; at 0 it is
  byte-identical so `skyprobe.mjs` stays green) — or, if measurement shows the SH
  contribution is negligible, states the number in the PR and rules it out explicitly.
  **Probe-ON exposure regime warning:** `PROBE_INTENSITY 0.62` is tuned for "dusk DC ~1.6";
  an all-bright sky has a DC several times that — probe-ON may blow the pale props to white
  and erase the one-step-below-sky read. **The PR-1 gate judges the biome probe-ON AND
  probe-OFF** (added to §10).
- **Stars — texture in the light, not points in darkness (R7's absolute numbers, consumed
  verbatim):** retune the existing `starMix` layer for a BRIGHT field:
  - **Count: ~20–60 visible stars TOTAL** (civil-twilight physics: only mag ≤1–2 survives a
    bright sky — dozens, not thousands; ~1 star per 30,000–100,000 px at 1080p). The v1
    "≈15% of night density" relative spec is dead — 15% of a dense field is still hundreds.
  - **Size:** cores **≤1px** of full intensity, analytic soft-gauss profile (sigma
    ~0.6–0.9px), soft falloff to ~1.5–2.5px, sub-pixel jittered placement — never `step()`,
    never a resolved disc. The brightest 3–4 may carry a very faint wide halo; diffraction
    spikes default OFF (at most a subtle short cross on 1–2 "Venus" anchors).
  - **Contrast:** brightest stars only **+15–30% above LOCAL sky value**; the faint majority
    +5–10%; below ~5% they dissolve (good — that IS "sparkle suspended in light"). A hard
    white dot at full contrast on a pale sky reads as a dead pixel.
  - **Visibility tracks local sky luminance: intensity × (1 − local sky luma)** — stars fade
    to ~nothing where the field is brightest (the dissolve, the bloom cores) and survive
    where it is locally dimmest. Uniform-density stars over a varying bright field is the
    "pasted starfield" tell in miniature; this modulation is both the authenticity cue and
    the anti-slop signal.
- **Tier degradation:** the sky shader is identical at every tier (base pass, no postfx
  dependency). Bloom math is a handful of noise taps — measured on `stress.html` in PR-1;
  if the warp cost bites on weak mobile, **tier 2 drops the warp ORDER (second-order → 
  first-order nesting), keeping all 4 octaves** — softer wisps, same structure. Never drop
  to 1 octave: a 1-octave field IS the airbrushed blob (R2). Motes thin per tier as standard.

### 4b. The water — NACRE (the one novel shader system; budget one PR + white-room test)

Mother-of-pearl, not a mirror: the water scatters light back as banded iridescence riding
the swell. This is the biome's biggest craft risk and its signature floor.

- **The ramp:** crest `0xe8def0` / mid `0xc6bede` / trough `0x6a6490` / sub-surface
  `0x9c92c2`, delivered through `setWaterTint`'s existing slots where they map
  (deep/shallow/horizon/zenith) — the trough tone is what gives the whole biome its only
  continuous structural mid-value (the "floor" the eye stands on).
- **KILL THE SUN-GLITTER LANE (the second engine sun — R1's named failure mode):**
  `water.js:334-336` draws the classic low-sun tight glitter path —
  `spec = pow(max(dot(Ns,H),0.0), 240.0); col += sunColor * spec * 2.6` — a mirror-sharp
  directional glint keyed on `sunDir`/`sunColor`. R1: "never a mirror-sharp sun glint;
  luster, not gloss." **`nacreMix` attenuates the pow-240 term to ~0** (the
  `uStormSea * 0.45` relaxation at `:336` is the one-line precedent) **and replaces it with
  R1's broad fresnel-weighted SATIN lobe** — a wide soft sheen riding the iridescence weight
  (the luster read), no tight dot, no glitter flakes. **`sunColor` gets the pale sky-tone
  fallback (≈`0xdcd7f4`, §3 table)** so the residual term during seam crossfades (while
  `nacreMix` is mid-ramp) is a pale shimmer, never a gold-ish lane.
- **Iridescence (the novel term):** a cheap thin-film fake — ONE new color-ramp term:
  `hue = f(fresnel(view,normal) + waveHeight*k)` indexed into a **constrained cosine
  palette whose gamut is rose `0xf2c4dc` ↔ lilac `0xdcd2f0` ↔ periwinkle `0xc4cdf4` and
  nothing else** (coefficients chosen so the curve cannot pass through green or gold — R1
  returns the real interference-band ordering so the sequence reads as nacre, not oil
  slick). Strength peaks on crest faces at grazing view angles (that's where real nacre
  fires) and fades in troughs. Crests additionally pick up the ROSE bloom tint from the
  sky term (the "bloom light moving on the water" read in Money Shot 2 — sky color term
  modulated by the crest mask, no reflection pass needed).
- **New uniforms (`nacreMix` gate default 0, ramp colors, band strength) MUST live in
  `sharedUniforms` (`water.js:50`)** or they vanish on tier rebuilds — the named trap.
  The cheap-variant water gets the same ramp with the iridescence term at reduced strength
  (one mix, no extra taps) so tier flips shift richness, never identity.
- **`waveAmp ~0.4`** — sculpted swell (the trough lattice needs relief to exist). NOT the
  Mire/Aurora black mirror: no emissive-reflection doubling; nacre is the anti-mirror.
- **What it is NOT:** no player-wake, no well-dent (per-biome water BEHAVIOR is rated HARD,
  §10 backlog — the well "dent" ships as a local darkened radial tint if ever, not a
  displacement). No plastic pearlescent car-paint sheen (R1's failure mode): banded, angular,
  soft. No sun glint — ever (the kill above is load-bearing theology, not a tuning choice).

### 4c. The horizon-dissolve (the "no horizon" claim, made of three knobs)

Sky-horizon stop (`0xcdd3f5`), `fogFarColor` (`0xe6e1f6`), and the water's far-field fog mix
must CONVERGE within ~one value step, so the water's last visible trough detail dissolves
into the same opal the sky descends to. One tuning session on the preview with all three on
sliders; they are thereafter locked as a triple (change one = re-tune all three + re-run
`bulletcontrast` **+ re-check the §2 120m ≥10-L-point read** — the convergence value and the
prop-body value are one system). Degradation: the dissolve is fog math — identical at every
tier.

## 5. PROP ROSTER — the exclusive silhouettes (all `biomes:[5]`, exclusive)

Constraints (as Mire): ≤150 tris, ≤2 material groups (**`empyStone`** pale matte body +
**`empyRim`** rose edge-emissive), parts interpenetrate ≥25%, explicit `tilt`, prime
pairwise-coprime steps, FOAM_CFG rows (foam tuned to a faint pearl waterline shimmer, not
white surf), inner edge ≥14.5, `props:` mirror in `BIOMES[5]` updated, envcount +
propclearance per PR. Everything seats at y=0 (`writeMatrix` — NO per-instance altitude):
all props RISE FROM the water; nothing floats. The new kit ships as the DEFAULT for biome 5;
legacy Astral props park behind **`?props=v1`** (repo precedent — v1 always means "restore
legacy").

**RESEARCH OVERRIDES (the bible outranks its own research where research contradicts the
theology — builders consuming R4/R6 verbatim, read this first):**

- **R4 §4's warm-SSS rim is VOID here.** R4 prescribes "pale warm ivory core… thin warm SSS
  rim" on backlit pale stone — warm ivory/amber is inside this biome's gold firewall. The
  Empyrean rim is **rose `0xf2b8d8` / pearl ONLY**; no warm tint at any thinness.
- **R6 Half-B's shaded-face values are VOID here.** R6 prescribes faces at "low-mid cool
  grey, L25–40" — that is BELOW the trough (`0x6a6490` ≈ L41), this biome's hard floor for
  decorative darks; a stone built to R6's numbers breaks the Inversion Law outright. **Prop
  faces floor at `empyStone` (`0xc2bcd6`); nothing decorative below the trough.** (R6's
  numbers are generic contre-jour, authored for dark-capable scenes.)
- **What STANDS unchanged from R4/R6:** every rim PLACEMENT / BREAK / THICKNESS rule —
  rims on thin light-facing chamfers only, thickness varies, 30–60% perimeter coverage in
  arcs with hard stops, breaks at occlusion and on down/lee edges, brightness peaks at the
  tangent. Same for R4's proportion/lean/taper/erosion/clustering language. Only the two
  VALUE/HUE prescriptions above are overridden.

**The edge-lit read (the composition no other biome can do):** every prop body sits ONE value
step below the bright sky (`0xc2bcd6` vs `0xdcd7f4`) — a pale cutout, light-on-light — and
its silhouette EDGES carry the rose rim (`empyRim` on chamfered edge strips, emissive ~0.35).
Law: **the rim lives only on edges — strongest on crowns and windward verticals, faded to
nothing on faces; NEVER a uniform outline** (the "chrome outline" cheap-tell from the
AAA-PIPELINE registry — R6 returns where real contre-jour rims actually live on pale stone).

| # | Archetype | Role | Silhouette | Rim |
|---|---|---|---|---|
| A | **`sentinel` — THE HERO (build first)** | the vertical exclaim; the biome's one-look teacher | a colossal thin bone-nacre monolith: asymmetric taper, subtle 2–5° lean, softly faceted like weathered marble, base widening into the swell; proportion/erosion language from real megaliths (R4) | crown + one long windward edge; brightest rim in the biome |
| B | **`haloarc` — THE FRAMING DEVICE** | fly-THROUGH punctuation (the rootgate slot); the Mote corridor's bones | a broken ring-arc: a 40–120° segment of a colossal circle standing in the water, ends eroded to points; occasional paired arcs implying one full halo | inner-rim edge only (the arc reads as a thin bright curve from afar) |
| C | **`choirstones` — THE MID MASS** | the recurring court; Money-Shot-3's subject | one greater stele ringed by 5–7 lesser stelae (irregular spacing, varied lean/height — a congregation, not a picket fence) | crowns only, staggered heights |
| D | **`pearlshoal` — THE LOW REST** | horizontal counterpoint; keeps open water from reading empty | low rounded nacre humps breaking the surface like surfacing backs, 2–5 per cluster, wet-gloss, strongest iridescence pickup | waterline shimmer (FOAM_CFG carries it), no hard rim |
| — | **NO far-massif archetype — deliberately.** | The Empyrean's "far mountain" is the dissolve (§4c). Any horizon-line prop violates the theology. Depth comes from descending-contrast prop layering, not walls. | | |

**Placement rhythm:** sparse and breathing — the Empyrean is OPEN (prop density ≈ 50–60% of
Mire's), **but emptiness gets a FLOOR, not a hope: a low `pearlshoal` cluster every ~80–140m
along otherwise-open water** (the LOW REST archetype's whole job — its cadence is now
specified, and it is what makes the §2 "no cruise frame with zero non-water elements below
the horizon line" check passable between courts). Composition engine: clone the Caldera/Mire
pattern — a `bi === 5` branch in `writeMatrix` with **`empyComp`** (congregation weight
gathering stelae into courts separated by long open water), **`arrivalPark`** (**~450–500m
clean at the Aurora seam — must outlast the 400m `AUR_RAMP_OUT` crossfade; The Breach, §2**),
the **30° Mote easement** (azimuth-bracketed, nothing composes into it), and **`arcAlign`**
(haloarc instances inside the corridor band yaw-biased so their openings face the Mote
bearing — the concentric-corridor read, pure function of dist/rotY, no `rnd`). PURE,
evaluated after rotY init → gold-determinism byte-identical.

**In-lane obstacle skins — `SKIN_BUILDERS[5]` (DEFERRED to PR-6; sketches on record):**
BEAM → "FALLEN HALO" (a haloarc segment collapsed across the lane, rim-lit underside carries
the kill-height); PILLAR → "THE SENTINEL" (lane-blocking monolith, magenta strike-band);
SHARD → "PEARL-KNOT" (a tumbling fist of fused nacre shards, iridescent facets flickering as
it rotates; dynamic variant: core pulses magenta through the seams). Zero shared vocabulary
with Frozen/Caldera/Mire skins; colliders byte-identical, fiction only; the `hazardMesh`
shard branch needs a `bi===5` material route (the Mire-found hardcode — `hazardMesh`
`obstacles.js:1368`, `SKIN_BUILDERS` `:1352`).

## 6. FAUNA + MOTES

- **THE INK KOI — `inkShoal`, a NEW instanced vertex-shader flock (PR-5's main line item;
  R5's parameter card is the spec):** the star-koi become **dark koi** — ink-violet
  `0x1a1424` shoals swimming through the AIR low over the swell, schooling gently UPWARD
  through frame (the surfacing read). **This is NOT a `fauna:{color,scale,flap}` retune of
  the existing 7-bird flock** — the reskinned-bird path is the "fake variety" system
  BIOME-DESIGN §1 names, and it cannot deliver R5's read. The `inkShoal` is a bespoke
  instanced flock (no boids, no neighbor queries — fake the statistics):
  - **30–60 fish** on a breathing ellipsoid cloud (semi-axes ~(6,3,4)×BL, ±15% radius
    breathe ~18s), mean NND 1.3–2 BL jittered ±0.5 BL — never a lattice, never constant
    spacing.
  - **The three lines that do 80% of the anti-slop work (R5):** (1) per-instance body-wave
    phase `hash(id)×2π` (+ ±15% frequency spread — kills the lockstep tell), (2) the
    front-to-back **turn-wave phase gradient** (a bank that SWEEPS the cloud in ~150–350ms,
    fired stochastically every 4–10s, 15–30° roll), (3) **mixed size classes**
    (0.7×/1.0×/1.4× BL at 25/60/15%) + the NND jitter.
  - **Body-wave:** subcarangiform — amplitude ∝ pow(u,1.8) head→tail, λ/L ≈ 1, tail-beat
    1.5–3 Hz; caudal fin lags a beat behind the peduncle.
  - **Upward drift:** travel pitched up +5–15°, slow porpoising bob (~30s, ease-out),
    per-fish rise stagger — the school peels upward; nose-up pitch ∝ vertical velocity.
  - **The looseness/size firewall (the threat-read law):** hard **size cap — no koi body
    subtends >0.5° at cruise**; projected inter-fish gap ≥ ~1 fish-width; silhouette fill of
    the shoal's footprint <40%; per-fish ±8% value jitter + a hair of translucency so
    overlaps never stack into a black mass. A shoal must always read as **punctuation — a
    scatter of dark commas with sky between them — never a disc** that could contest the
    Mote or a well. Violet-black, never pure black (the true black `0x050308` stays
    role-locked).
- **THE LIGHT-MOTES (`ambient` retune):** pale pearl motes `0xf2ecff`, **slow RISE**
  (`fall ~ -0.15` — a fraction of Caldera's -2.2 hot climb; this is dust drifting up a
  sunbeam, not embers), `sway ~1.2`, size ~0.4, opacity ~0.5, fog-attenuated far (the Mire
  PR-2 variance lesson applied from day one: size/opacity jitter, no confetti uniformity).
  The rising motes are the theology made ambient — everything in the Empyrean drifts up.
- **Audio (later, flagged):** a weightless bed — airy shimmer-pad + sub-harmonic hush,
  ~-18 LUFS under the radio; `keyShift` review at the Aurora seam so the chord change lands.

## 7. HAZARD / VERB — ruling: SHIP AS BREATHER, wells land post-look

**Ruling (my call per the brief):** the Empyrean ships its look arc as a **BREATHER**
(hazard deferred — the Aurora-sanctioned Law-1 exception; the boss link is optional
atmosphere, so nothing blocks). **GRAVITY-WELLS** are fully spec'd here and land as PR-6,
after the look holds:

- **Presentation — the CHILD VOIDS:** small true-black cores `0x050308` (the only other
  place THE BLACK appears) ringed by a thin, hot, pulsing **danger-magenta accretion ring
  `0xff2b6a`** (the magenta-core mandate honored as the RING — on a bright field the black
  does the seeing-at-distance work and the magenta does the "this is THREAT not landmark"
  disambiguation). Placed BESIDE the lane (dodge-only; the punished path clips them).
- **Read hierarchy law:** Mote = black, far, unringed, stationary at fixed bearing. Well =
  black, near, MAGENTA-RINGED, in the playfield. The ring is the entire difference between
  dread and danger — it never dims, and nothing else wears it.
- **Loop:** the proven `overlayBiomeHazards` pattern verbatim — own XOR'd `mulberry32`
  stream (new constant, distinct from gold/canyon/spore), own `out.hazards` array,
  consumption below `inBoss`/grace returns in `main.js`, cursor reset in `resume()`,
  spawn only past the crossfade band, off tight ring lines, gold-determinism
  byte-identical. `hazard:{ type:'well', every:[180,320], warn:0 (always-visible, no
  burst phase — a well IS its own telegraph), radius:~3.0 }`.
- **Overdraw:** the ring is a thin additive annulus (small, counts against the ~2-volume
  cap — budget says 2–3 wells visible max, enforced by `every` spacing); the core is
  OPAQUE black (free — negative space is the whole point).
- **Verb:** dodge-only now; **well-pull is the flagship deferred verb** (§10 backlog:
  `gravityMul` + lateral bias through `mech.*`, forces lerp via `computeEnv`, suspended
  in-boss). The water "dent" toward wells: deferred with per-biome water behavior; if ever,
  a local radial darkening in the tint term, never displacement.

## 8. THE LANDMARK — THE MOTE (the black focal point)

The fog-exempt landmark slot: **generalize the sky-whale machinery** (`whale:1` →
`landmark:'mote'` declaration per BIOME-DESIGN §4-biome-5's own instruction) so biome 5
declares the Mote instead of the whale. (Note: the landmark mix rides `whaleMix`, which
widens to the 400m window at the Aurora seam — the Mote fades in as the light does; §2.)

- **What it is (when NOT the boss): a dead star in eclipse** — a perfectly round, perfectly
  black `0x050308` disc hanging just above the dissolve at a fixed azimuth (inside the
  reserved 30° easement), fog-exempt so it never pales.
- **Size — a slow scripted growth (the dread beat; mechanism resolved):** the Mote enters at
  **~1.5° apparent diameter** at the seam and **grows slowly and monotonically across the
  biome's run to ~2.5–3° near the loop seam** — the whale-slot's distance parameter driven
  by biome progress, cheap and deterministic. It never lunges, never pulses; the growth is
  below conscious notice frame-to-frame and unmistakable court-to-court. (A fixed-azimuth
  landmark is never approached, so "it gets bigger because you approach" was a
  contradiction — dead. The growth is authored.) It does not glow, pulse, rotate, or drift.
- **The limb — partial, hairline (R6 consumed verbatim):** around PART of its limb, the
  FAINTEST pearl limb-brightening — a whisper-thin lightening of the sky field itself
  hugging the edge (light bending around a mass — eclipse optics), **strictly non-gold,
  non-corona, non-flare**: at most +1 value step over the local sky, thickness
  **r/20–r/40** (1–3px on a few-hundred-px disc — R6: a real chromosphere ring is ~1–2% of
  disc radius; the v1 r/8 allowance was 2.5–5× too thick and is dead), **biased to ONE arc**
  (the side where the ambient field is strongest), **fading to nothing on the opposite
  limb** — a complete even ring reads as annular-eclipse / lens artifact. Hard inner
  boundary against the black; outer falloff within the same 1–3px. Baily's-beads pips:
  default OFF (reserved for a scripted beat, if ever).
- **Hole vs object (the bug-read firewall, R6):** a black circle reads as a rendering bug or
  a hole punched in the sky unless it visibly OCCLUDES — and the 30° easement removes all
  prop occlusion by design. The cheap substitute: **the disc term zeroes the star and mote
  layers inside its radius (drawn over/after them)** — stars and rising motes visibly wink
  out behind it, which a hole in the skybox can never do. **Edge: hard at ≤1px** (coverage
  blend only, never a gradient ramp — the disc's edge should be the sharpest thing in the
  frame); **a mathematically perfect, stable circle; dead still** (no jitter, no z-fight —
  flawless serenity is what reads as intent).
- **How it reads:** it is the only true-dark object in a luminous world — the INVERSION LAW
  makes it the most legible landmark in the game for free (zero overdraw: it's an opaque
  black disc). The dread is that it costs nothing and explains nothing.
- **Render:** a single opaque disc mesh (or a sky-shader term — disc + limb + the
  star/mote occlusion are a few lines of math) riding the landmark slot's distance/azimuth
  logic; tier-free.
- **Boss-optional by contract:** when THE UNMASKED's coupling lands (with its Tier-5 build,
  not before), the Mote IS the lid — the unmasking tears the bright sky to the boss's dark
  Hollow behind it, and the biome's arc becomes "the boss steals the light you earned"
  (world-state beat, boss-side work). Nothing in this bible depends on it; the Mote stands
  alone as a mystery. The easement is its stage either way.

## 9. ANTI-REPLICATION + CLASH SELF-AUDIT (checklist run)

- ☑ **The three-nights problem:** solved structurally — the Empyrean is not a night.
  Bright vs Mire/Aurora dark: unmistakable at thumbnail size.
- ☑ **vs THE LOST LAGOON / Frozen (the warm biomes):** zero gold, no sun disc, no golden
  mirror; cool pearl omnidirectional light vs warm directional sunset. Brightness without
  warmth vs warmth at low brightness.
- ☑ **vs Tempest:** whole dome luminous + no ceiling vs one pale horizon slot under a
  crushing grey lid; steady pastel violet field vs violet-as-flash.
- ☑ **vs THE UNMASKED's arenas (the critical one — brief constraint 4):** the Empyrean
  never enters the boss's register: sky value floor ≥ ~0.75 vs the Hollow's near-black
  void; nebula sat cap 0.30 + pastel rose/orchid vs the boss's saturated violet-magenta +
  molten-gold band + hot supernova; no gold anywhere; the biome's black is one small disc
  vs the boss's black is the whole world. The synergy is the CONTRAST: bright mask, dark
  reveal. Mechanical grep on every diff (§3 forbidden-hex list).
- ☑ **Silhouette:** thin leaning monolith / broken ring-arc / stele court / low pearl hump —
  no family maps to any shipped biome (Wastes' buried monoliths are HORIZONTAL/half-sunk/
  sandstone; the Sentinel is vertical/thin/nacre — opposition on the shared "standing
  stone" axis). Ring-arcs are the only circular architecture in the lineup.
- ☑ **Light address:** THE EDGE (rim-light on silhouette edges against a brighter sky) —
  ownable because every other biome rim-lights against dark. Under-brim (Mire), clefts
  (Frozen), cracks (Caldera), apertures (Lagoon) all untouched.
- ☑ **Ladder axis:** the inverted ramp — the only biome whose value structure points UP
  and whose accent color is BLACK.
- ☑ **Danger protocol:** magenta `0xff2b6a` on threat only; THE BLACK role-locked;
  koi size-capped off the threat read; `bulletcontrast` re-passed on every palette touch
  (the new high-key regime is called out as a real gate in §3).
- ☑ **Blind screenshot:** pearl field + black point vs any other frame in the game — the
  cheapest one-frame test we have ever shipped. Named residual risk: the BRIGHT frame has
  nowhere to hide weak art (Vision B's honest risk) — mitigated by the R-manifest grounding,
  the white-room pass on props/water, and the Fable-checkpoint on the Sentinel before the
  roster (Mire risk-8 pattern).

## 10. PR-SIZED ROLLOUT (coexist → prove on the hero → migrate; one PR each)

Every PR ends with a screenshot gate (value-ramp audit: brightest-at-zenith + ≤1 dark accent;
blind line-up vs Aurora/Tempest/the-boss-arena stills; mobile-brightness check — a HIGH-key
biome must also be judged in a DARK room, the inverse of Mire's bright-room test; **sun-azimuth
scan on every capture: no disc ghost, no glitter lane, no shaft — probe-ON and probe-OFF, all
tiers** — the three killed suns are regressions that can silently return with any sky/water
refactor) + the full headless suite (gold-determinism byte-identical, `bulletcontrast`,
`tricount`, `envcount --ci`, `propclearance --ci` widened to biome 5, NaN `place()` scan,
`skyprobe.mjs`), SW re-stamp before fly-test, biome-pinned preview `?biome=5&debug` with a
what-to-look-at list, and one `leapfrog/lessons/<date>-graphics-empyrean-*.md` lesson. Do not
start the next PR on a failed gate. The owner outranks every gate.

- **PR-1 — ATMOSPHERE SUBSTRATE** (pure `biomes.js` retune + sky shader): rename to THE
  EMPYREAN; inverted sky ramp + the two nebula blooms behind `empyMix` (three-touch wired
  **+ the skyProbe FOURTH touch — bloom lift mirrored into `skyColorAt`, `breachMix`
  pattern, or explicitly ruled negligible with a measured number; `skyprobe.mjs` green via
  empyMix=0 default**); **the sun kills: `empyMix` multiplies the sky shader's pow-900 disc
  + pow-10 glow terms to zero (aurora-precedent), canon `sky.sun 0xdcd7f4` stop landed,
  `godrayMul: 0`, `bright: true`**; star retune (R7 absolute numbers, §4a); opal fog +
  `fogFarColor`; shadowless light rig; rising pearl motes; palette landed. **Interim prop
  treatment (decided): PR-1 retints `mats.body[5]` + the legacy Astral archetypes toward
  pale bone-nacre (the `0xc2bcd6` family)** — the shipped astral-slate props were tuned for
  a near-black sky and would stand as three PRs of giant dark cutouts under the inverted
  sky, failing the dark-budget gate by construction; the retint keeps the world dressed and
  in the right value band until PR-4/5 replace them. **Gate wording, aligned: the ≤1-dark-
  accent / value-ramp audit is judged WITH the retinted legacy props standing** (they are
  placeholders in the correct band, not the final kit). Transforms 100% of pixels;
  **blind-test it reads as a NEW biome before any prop.**
  Gate adds: `bulletcontrast` on the high-key field (expect a `bullets` retune — budgeted,
  not incidental); `stress.html` on a real phone for the bloom noise cost; **judge probe-ON
  AND probe-OFF (the PROBE_INTENSITY 0.62 dusk tuning may blow pale props to white under an
  all-bright sky — §4a); HUD legibility under `bright: true`; sun-azimuth scan.**
  *Coexistence: `empyMix` defaults 0 everywhere else; absent fields = byte-identical.*
- **PR-2 — THE NACRE WATER** (the novel system, alone in its PR): the ramp + the constrained
  iridescence term + `nacreMix`, all uniforms in `sharedUniforms` (`water.js:50`);
  **the pow-240 sun-glitter kill + satin-lobe replacement + `sunColor` pale-sky fallback
  (§4b)**; cheap-variant parity; waveAmp 0.4; horizon-dissolve triple tuned (§4c) and
  LOCKED. Gate adds: tier-flip check (identity survives tier 2), white-room lighting test
  on the shader, `bulletcontrast` re-pass over water, **sun-azimuth scan over water (no
  glitter lane at any view angle)**.
  *Coexistence: `nacreMix` 0 off-biome; `setWaterTint` path unchanged for others.*
- **PR-3 — THE MOTE + THE BREACH:** generalize the landmark slot (whale → declared
  landmark), land the Mote (disc + one-sided r/20–r/40 limb + star/mote occlusion + scripted
  growth + easement bearing — §8); arrival-park **~450–500m (outlasting the 400m
  `AUR_RAMP_OUT` seam)**; both seams graded on the preview (Aurora→Empyrean 400m
  overexposure beat; Empyrean→Lagoon 150m chord change, against `LOST-LAGOON-BIBLE.md`).
  *Coexistence: landmark declaration defaults to existing whale for biome 5 until flipped;
  other biomes untouched.*
- **PR-4 — THE HERO `sentinel` + composition engine** (`empyComp` + `arrivalPark` +
  easement + `arcAlign` scaffolding, `bi===5` branch). **Flag direction (repo precedent —
  Lagoon/Caldera/Mire): the new kit is the DEFAULT; `?props=v1` restores legacy.** If the
  Fable gate wants the Sentinel hidden until it passes, preview it behind **`?props=v2`** —
  never overload v1. Proves the edge-lit theology on one object (body-below-sky + rose rim +
  megalith proportion, §5 overrides in force). Fable-critic checkpoint on the silhouette
  BEFORE the roster (floor 4.2/5 in shipping light, **judged at 40/80/120m in shipping fog
  against the §2 ≥10-L-point rule, not in the white room**; the bright-frame-hides-nothing
  risk lives here).
- **PR-5 — THE ROSTER + FAUNA (grows to carry the shoal — accepted):** `haloarc` (+ the
  Mote corridor via `arcAlign`) → `choirstones` → `pearlshoal` (with its ~80–140m cadence
  floor); **the `inkShoal` — a NEW instanced vertex-shader flock system per §6 / R5's
  parameter card — is this PR's MAIN LINE ITEM, budgeted as a system, not a retune** (the
  existing 7-bird fauna path cannot deliver R5 and would ship the screensaver read Money
  Shot 3 stars); size cap + looseness firewall enforced on captures. Money Shots 2 + 3
  become achievable; legacy Astral props retired (`envcount` grandfathers deleted on
  retirement). Final montage + blind line-up hardest here. **If the shoal system needs its
  own PR, split it as PR-5b and strike the shoal from MS-3's first gate — never discover a
  system-sized job mid-PR.**
- **PR-6 — GRAVITY-WELLS + IN-LANE SKINS (owner-gated; the breather designation lifts
  here):** `hazard:{type:'well'}` per §7 (own RNG stream, `resume()` cursor, in-boss
  suppression) + `SKIN_BUILDERS[5]` (Fallen Halo / Sentinel / Pearl-Knot) + the
  `hazardMesh` `bi===5` material route (`obstacles.js:1368`) + coverage exports +
  `hazardskin.mjs` entries, scored in the worst light. **Dark-budget audit on every PR-5/6
  capture: the moment two black shapes contest a frame (shoal vs Mote, well cores beside
  the Mote's bearing), the Empyrean is just another night biome with the lights on.**
  Well-pull stays in the §10 verb backlog.

---

## THE RESEARCH MANIFEST (hand-off to the reference-research agents)

The owner's mandate: "legit and beautiful, not fake AI slop." Every hero element below gets
a reference pass BEFORE its build PR. For each: the real phenomenon to nail, the slop tell
to avoid, and what the agent must return (real structure/optics + the cheap in-shader fake).

**File-mapping note (the passes live in `EMPYREAN-RESEARCH.md`):** the research file's
header says "Six passes" because R2 and R7 share one section — **R2 ≡ "R2–R7" §Element A
(nebula structure) and R7 ≡ "R2–R7" §Element B (stars in a bright sky)**; there is no
standalone `# R7` header. R1, R3, R4, R5, R6 have their own sections. Don't grep for
"# R7" and conclude it's missing.

1. **R1 — NACRE (mother-of-pearl)** *(feeds PR-2)*. Real thing: thin-film interference on
   stacked aragonite platelets — hue shifts with VIEW ANGLE in ordered bands (a repeating
   rose→lilac→blue-silver sequence, strongest at grazing angles, riding the shell's growth
   contours), over a soft milky diffuse base; luster, not gloss. Slop tell: the oil-slick
   full-rainbow swirl, or pearlescent car-paint plastic sheen (uniform sparkle, no banding,
   no angular behavior). Return: the actual interference-band hue ORDER and angular falloff
   from real nacre/abalone photography; which 3 hues carry the read; a cosine-palette /
   ramp-texture recipe constrained off green+gold; where on a wave the bands should fire
   (grazing crest faces) and where they must die (troughs, normal incidence).

2. **R2 — NEBULA STRUCTURE, HIGH-KEY** *(feeds PR-1)*. Real thing: reflection nebulae and
   star-forming regions are FILAMENTARY — wisps, shock-front edges, embedded brightness
   knots, and dark-lane occlusion; brightness has structure at every scale, never a smooth
   radial gradient. Ours must read pastel-in-a-bright-field (the rare regime — closer to
   cirrus lit from everywhere than to Hubble darks). Slop tell: the symmetric airbrushed
   purple blob; equally bad, importing Hubble's dramatic dark-and-saturated look (that's
   the BOSS's arena — forbidden here). Return: filament/lane statistics from real reflection
   nebulae (M45's wisps, Iris Nebula) + how to translate them into domain-warp value noise
   on a radial falloff; how dark-lanes read when the field is bright (answer shape, not
   just "multiply darker"); the saturation ceiling that keeps pastel legible. **(Returned;
   consumed verbatim in §4a — 4 octaves, warp ≈2, 1:2–1:3 radial anisotropy, carved lanes +
   one-sided rims, sat ∝ (1−density).)**

3. **R3 — LUMINOUS FOG / DEPTH WITHOUT DARKNESS** *(feeds PR-1 + every composition)*. Real
   thing: aerial perspective in bright scattering media (sea fog at noon, polar whiteout,
   the diver's upward view near the surface): with distance, CONTRAST collapses and value
   converges toward the light; silhouettes go pale, not dark; hue drifts subtly cool; depth
   is read from contrast decay + overlap, not value darkening. Slop tell: a uniform white
   alpha wash that flattens everything equally (no depth), or cheating depth back in by
   darkening the far field (breaks the theology). Return: measured/observed contrast-vs-
   distance behavior in bright fog; the three-layer high-key depth recipe (what separates
   near/mid/far when everything is light); how the fog/sky/water convergence value should
   sit relative to prop-body value so pale silhouettes still resolve at 120m. **(Returned;
   consumed — the ≥10-L-point floor at 120m and the L73–78 body band drove `empyStone` to
   `0xc2bcd6`; the rule is now a §2 capture gate.)**

4. **R4 — PALE MEGALITH LANGUAGE** *(feeds PR-4/5)*. Real thing: real standing stones
   (Callanish, Avebury, Ring of Brodgar, Carnac) have proportion and erosion grammar —
   height:width ratios, asymmetric taper, a subtle lean, wind-facet planes, edge-rounding
   where weather works, base thickening; weathered marble adds soft translucent edge-glow in
   backlight. Slop tell: the extruded capsule / perfect rectangular slab, symmetric taper,
   identical clones in a neat circle (picket-fence courts). Return: proportion + lean +
   taper ranges from surveyed megaliths; how erosion distributes (crown vs base, windward vs
   lee); how a stone circle actually clusters (spacing irregularity); how pale stone edges
   catch light in contre-jour (feeds the `empyRim` placement law) — all as parameter ranges
   a ≤150-tri generator can consume. **(Returned; consumed with the §5 RESEARCH OVERRIDES —
   the warm-SSS rim note is VOID here.)**

5. **R5 — INK-SHOAL MOTION (the koi)** *(feeds PR-5)*. Real thing: real shoaling — nearest-
   neighbor spacing, alignment waves, the whip-turn that propagates through the school, koi
   body-wave swimming (head-stable, tail-driven); shoals are LOOSE clouds that breathe, not
   lattices. Slop tell: uniform boids on rails — identical fish, constant spacing, no
   turn-waves, the screensaver read. Return: shoal kinematic parameters (spacing/alignment/
   turn-propagation rates) reducible to a vertex-shader flock with per-instance phase; koi
   silhouette variation (2–3 body sizes, fin read at small scale); how a shoal reads at
   0.3–0.5° apparent size so it stays punctuation, never mass. **(Returned; its parameter
   card is implementation-ready and is now the `inkShoal` spec — a NEW system, PR-5's main
   line item, §6.)**

6. **R6 — THE BLACK DISC (eclipse optics) + THE EDGE-LIT RIM** *(feeds PR-3/4)*. Real
   thing, two halves: (a) totality — a truly black disc against bright sky reads FLAT and
   HARD-EDGED (the eye finds no detail in it; the drama is the edge), with any limb
   brightening whisper-thin; (b) contre-jour rim-light on pale objects — the rim lives only
   where the surface turns tangent to the light, varies in thickness, and breaks; it is
   never a uniform outline. Slop tell: (a) a dark-grey disc with a soft gradient edge +
   lens-flare corona (or ANY gold corona — the boss owns gold); (b) the chrome-outline
   cheap-tell from the AAA registry. Return: how black-against-bright actually reads
   (edge hardness, the no-detail law, minimum size to read as an object not a dead pixel);
   a non-gold limb treatment (returned: r/20–r/40, one-sided); rim-light placement/
   thickness/break rules for pale stone that a 2-mat chamfer-strip build can honor.
   **(Returned; consumed in §8 — with §5's override on its L25–40 face values.)**

7. **R7 — STARS IN A BRIGHT SKY** *(feeds PR-1; lives in the research file as "R2–R7"
   §Element B — see the mapping note above)*. Real thing: Venus and the brightest stars
   in civil twilight — points of light visible IN brightness are sparse, tiny, soft-edged,
   and only barely above the local sky luminance; the read is "sparkle suspended in light."
   Slop tell: a night-density starfield pasted onto a bright gradient (instant fake — the
   single fastest way this biome would read as AI slop). Return: density/size/contrast
   thresholds at which points read as stars rather than noise or dust on the lens; how
   brightness scales near the dissolve vs the zenith; whether a faint cross/soft-gauss PSF
   helps or cheapens at our resolution. **(Returned; consumed verbatim in §4a — 20–60
   total, ≤1px gauss cores, +15–30% max over local sky, × (1−local sky luma).)**

*— Fable. The Empyrean is the exhale. Keep it bright, keep it pale, kill the three suns the
engine draws by default, and let the one black point do all the talking.*
