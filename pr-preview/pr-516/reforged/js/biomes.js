import * as THREE from 'three';
import { CONFIG } from './config.js';

// The shipped god-ray shaft tint (godrays.js uTint = 1.0,0.9,0.72). Default for
// every biome so god-rays stay byte-identical unless a biome overrides godrayTint.
const GODRAY_TINT_DEF = new THREE.Color(1.0, 0.9, 0.72);

// Six cycling biomes, ~1500m each with a 150m crossfade at the seam.
// Everything visual (sky, fog, lights, water, ambient particles, fauna)
// lerps between biome palettes; props/obstacle materials switch per instance
// by dominant biome at their spawn distance.
//
// Per-biome extras:
//   keyShift — semitones applied to the music at the next loop boundary
//   stars    — starfield strength in the sky shader (night biomes)
//   ambient.fall < 0 — particles RISE (volcanic embers)
//   fauna    — the background flock's look (color/size/wingbeat)
//   whale    — a colossal sky whale drifts the horizon (astral only)
//   hazard   — OPTIONAL dodge-only hazard spec (BIOME-DESIGN.md §5.3):
//              { type, every:[minM,maxM], warn:sec, radius }. Absent → no
//              hazards spawn in this biome (byte-identical). Consumed by
//              level.js#overlayBiomeHazards (independent RNG stream) + hazards.js.
//   fogFarColor — OPTIONAL far-field fog COLOR (dual-fog, BIOME-DESIGN.md §5.2):
//              scene THREE.Fog keeps the NEAR color; the sky-dome horizon band
//              and the water shader's fog term blend toward this at distance.
//              Absent → falls back to fog.color (byte-identical). ⚠ NAME TRAP:
//              env.fogFar is a DISTANCE — never abbreviate this field.
//   bullets  — OPTIONAL hex overrides { light, mid, dark } for the boss danmaku
//              BAND (see boss.js). Present ONLY where the contrast gate
//              (tests/bulletcontrast.mjs) fails against this biome's fog/horizon —
//              most biomes read fine on the default BAND. Render-only; never
//              touches hitboxes/kinematics.

const C = (hex) => new THREE.Color(hex);

// THE DROWNED FORUM seam (DROWNED-FORUM-BUILD-SHEET.md §5 PR-1): `?props=forum` swaps Biome 0's
// ATMOSPHERE to the sunken-Pompeii palette (§2D) at the same time environment.js swaps its props —
// so the gold-on-water sky and the Roman kit always travel together. Default (flag absent, and always
// in headless where there is no window) = THE LOST LAGOON, byte-identical, until the PR-8 flip. The
// palette itself is exported as FORUM_BIOME0 and validated unconditionally by tests/bulletcontrast.mjs
// (the danger-magenta hue-safety gate the sheet mandates after every palette change).
const _biomeParams = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search) : new URLSearchParams();
const PROPS_FORUM = _biomeParams.get('props') === 'forum';

// Canonical sun direction — a low sun ahead of the player. Shared by the sky
// shader, the water shader and the god-ray pass so the light shafts streak from
// exactly where the visible sun disc sits. (Previously duplicated as a literal
// in water.js + environment.js.)
export const SUN_DIR = new THREE.Vector3(-0.22, 0.1, -1).normalize();

// The SINGLE source of truth for a biome's WIND direction (xz, normalized-ish). Foam (water.js),
// the rain-streak layer (rain.js), and the cloud wind-crawl (skyClouds) all READ this — nobody
// re-declares it, so the storm can't show two winds (composition law #6). Oblique to the lane so
// the grain reads diagonal. The vector NEVER lerps across a seam (a rotating wind = a spinning
// compass); only intensity (rainMix / foam strength) crossfades.
export const TEMPEST_WIND = { x: 0.851, z: 0.525 };

export const BIOMES = [
  {
    // THE LOST LAGOON (LOST-LAGOON-BIBLE.md): a lost, hidden watery paradise of drowned
    // holy ruins reclaimed by a garden at golden hour. Theology — "the light claims nothing;
    // it only passes THROUGH, window by window, down to the water." Its own identity, distinct
    // from Frozen (blue ice) and Caldera (black fire): jade lagoon mirror + rose-apricot humid
    // horizon + the only GREEN/vegetation in the cycle. PR-1 = the atmosphere/materials substrate.
    name: 'THE LOST LAGOON',
    keyShift: 0,
    stars: 0,   // Fable in-game review: at golden hour the star-speckle read as noise in the empty upper sky — a clear warm tropical sky, no stars
    sky: { top: C(0x0d1f3c), mid: C(0x235058), horizon: C(0xffb060), sun: C(0xffd080),
      // N9 clouds: warm dusk cumulus — sunlit tops, cool blue undersides.
      cloud: { amount: 0.85, lit: C(0xffe4b8), shadow: C(0x1e2c46) } },
    // Dual-fog: NEAR = dusk warm-teal (the lagoon reads humid/cool); FAR melts to rose-apricot —
    // one step rosier + softer than Frozen's molten gold, so the horizon reads humid, not molten.
    fog: { color: C(0x2a5a62), near: 70, far: 400 },   // humid dusk-teal; L≈0.31 sits in the layered-read window so the magenta danger bullet (role-locked) + band-dark clear it (bulletcontrast)
    fogFarColor: C(0xffb877),
    atmos: { heightK: 0.03 },   // evening mist pooling on the water; dive = into the hush, climb = clear gold
    // Low sun dead ahead, but the STORY is transmission. hemiGround = JADE LAGOON BOUNCE (undersides
    // pick up cool water-green — the inverse of Caldera's ember bounce, unlike Frozen's rose fog-sea).
    light: { sun: C(0xffb060), sunI: 1.55, hemiSky: C(0x86b4d0), hemiGround: C(0x1e4438) },
    water: { deep: C(0x07262e), shallow: C(0x2f8578), waveAmp: 0.42 }, // PR-0 (§7.2): jade-turquoise El Nido shallow — greener-biased (deepen the jade, never the gold); calmed so the ruins double in the mirror (a lagoon breathes — not Frozen's 0.22 dead-calm)
    // PETAL WIND (the Tsushima signature): warm blossom-gold petals with the strongest LATERAL drift
    // in the cycle — wind as a composition device. Nothing rises (Caldera), nothing hangs (Frozen).
    ambient: { color: C(0xffcf9a), fall: 0.5, sway: 3.0, size: 0.32, opacity: 0.7 },
    // EGRETS: slow pale waders skimming the mirror down-lane (the NatGeo frame; HOLLOWGATE's pale
    // "children" over dark water — the boss's value inversion rehearsed by the wildlife).
    fauna: { color: C(0xf6ead8), scale: 1.25, flap: 0.55 },
    faunaFlyby: true, // foreground egret flyby pass visible over the lane
    // JUNGLE DROWNED TEMPLE kit (v3, biomes:lagoonV3 — DEFAULT): karstfang (giant sea-stack) + figgate
    // (strangler-fig gateway) + mangrovehold (stilt-root islet) + prasat (drowned Angkor temple HERO) +
    // lotusraft (lily pads + blooms) + nagawall (reared naga backdrop). All Fable-gated ≥4.2 (form + in
    // context). The retired v2 drowned-Greco ruins (rotunda/lilyraft/wrackstone/rootbastion/arcade) are
    // opt-in via ?props=v2; the legacy verdigris props (tower/column/archruin/slab/dome) via ?props=v1.
    // (This array is documentation only — spawning is gated by each archetype's `biomes` whitelist in
    // environment.js.)
    props: ['karstfang', 'figgate', 'mangrovehold', 'prasat', 'lotusraft', 'nagawall', 'causeway', 'rampart'],
    matIndex: 0, // lagoonStone (vertex-color bakes: honey limestone / jade tide / jungle greens / temple sandstone / gilt)
    // Contrast gate: the dark/deep band vs this biome's teal fog — lifted toward a lighter
    // deep-rose (re-run bulletcontrast after the jade-water retune).
    bullets: { dark: 0xaf4f73 },
  },
  {
    // Amber Wastes: high-noon desert — the designated bright world in the cycle,
    // contrasting with the surrounding dusk/cold biomes.
    name: 'AMBER WASTES',
    keyShift: 2,
    stars: 0,
    bright: true,   // EMBERSIGHT H6 skyLuma (§0/§B): brightest sky in the cycle → HUD keylines swap to the ember-core variant

    sky: { top: C(0x6a3820), mid: C(0xd08040), horizon: C(0xffcf96), sun: C(0xfff0c0),
      // N9 clouds: bright high-noon desert cumulus — the brightest sky in the cycle.
      cloud: { amount: 0.9, lit: C(0xfff6e2), shadow: C(0xbe8f5e) } },
    fog: { color: C(0xeaaf80), near: 60, far: 330 },
    light: { sun: C(0xffc88a), sunI: 2.0, hemiSky: C(0xe8c8a8), hemiGround: C(0x6a4a30) },
    water: { deep: C(0x3a3214), shallow: C(0x9a7a3a), waveAmp: 0.7 },
    ambient: { color: C(0xffd9a0), fall: 0.4, sway: 1.6, size: 0.3, opacity: 0.6 },
    fauna: { color: C(0xc8a060), scale: 1.3, flap: 0.5 }, // slow wide sand-kite gliders
    props: ['obelisk', 'column', 'slab', 'dome'],
    matIndex: 1, // sandstone
    // Contrast gate: this is the brightest sky in the whole cycle (horizon
    // L≈0.84) — the pale light band (L≈0.83) nearly vanishes into it. Deepened.
    bullets: { light: 0xa98392 },
  },
  {
    // Cold sunset canyon — petrel pair + aurora wisps
    name: 'FROZEN REACH',
    keyShift: -3,
    stars: 0,
    bright: true,   // EMBERSIGHT H6 skyLuma: molten-gold horizon (a bright veil) → ember-core keylines

    // THE SUNSET GLACIER: the last 10 min of a polar sunset — a frozen cathedral at
    // vespers. Cool light lives IN the ice; warm light only ever comes FROM the sun.
    sky: { top: C(0x1c2e5e), mid: C(0x9a5a8e), horizon: C(0xff9a55), sun: C(0xffd2a0) }, // sun a touch hotter for the water glitter lane
    // Dual-fog (§5.2): NEAR = cool rose-quartz (the ice reads icy); FAR melts into
    // the sunset so every receding monument dissolves into molten gold.
    fog: { color: C(0xbfa9c0), near: 78, far: 400 },
    fogFarColor: C(0xffa268),
    // Hotter sun rim (the gold is the second protagonist); warm fog-sea bounce
    // (hemiGround) lifts the black undersides the low dead-ahead sun leaves.
    light: { sun: C(0xffa860), sunI: 1.75, hemiSky: C(0x9ab8ff), hemiGround: C(0x6b5a66) },
    water: { deep: C(0x0e2440), shallow: C(0x4a7290), waveAmp: 0.22 }, // near-mirror over twilight deeps — doubles the spires + sunset
    // DIAMOND DUST: near-suspended gilded ice crystals catching the low sun — the
    // air itself becomes the beauty. Stillness (low fall) = the held breath.
    ambient: { color: C(0xffe9cf), fall: 0.35, sway: 0.5, size: 0.27, opacity: 0.85 },
    fauna: { color: C(0xffdfc2), scale: 1.15, flap: 0.4 }, // high gilded soarers: near-motionless, sun-caught
    // Sunward inscatter burns a little harder; heightK = the fog-SEA (dense at the
    // waterline, thinning with altitude) the monuments rise from — and the surface
    // MARROWCOIL rises through (the dive verb, felt before it is ever used).
    atmos: { inscatter: 0.85, heightK: 0.05 },
    props: ['bergwall', 'serac', 'terrace', 'icetower', 'glacierwall', 'sungate'], // Sunset Glacier — no-spike glacier ice + the Sun Gate hero (Move 2)
    matIndex: 2, // ice
  },
  {
    // Inferno — erratic fire-moth glow points rise with the embers
    name: 'EMBERFALL CALDERA',
    keyShift: -2,
    stars: 0,
    sky: { top: C(0x261016), mid: C(0x7a2a1a), horizon: C(0xff7a30), sun: C(0xffb060) },
    fog: { color: C(0x57221a), near: 65, far: 340 },
    // Dual-fog far color (§5.2): near props hold the ember-red fog while the
    // far field sinks toward near-black scorched dark — the caldera reads DEEP.
    fogFarColor: C(0x1c0a08),
    // N8 atmosphere: dense ember fog pools near the lava and thins with altitude
    // (height fog) — climbing out of the caldera clears the air (OPTIONAL).
    atmos: { heightK: 0.045 },
    light: { sun: C(0xff9a50), sunI: 1.6, hemiSky: C(0x8a5040), hemiGround: C(0x301010) },
    water: { deep: C(0x2a0a08), shallow: C(0xc84818), waveAmp: 0.55 },
    ambient: { color: C(0xff9a40), fall: -2.2, sway: 1.4, size: 0.36, opacity: 0.9 },
    fauna: { color: C(0xff6a20), scale: 0.6, flap: 3.5 }, // fire-moths: tiny, erratic
    // Anchor boss (BIOME-DESIGN.md §6): an encounter landing in this biome
    // prefers this BOSS_ORDER key (biomeBoss.js). OPTIONAL — absent on every
    // other biome, so their selection is byte-identical to the shipped game.
    anchor: 'ashtalon',
    // Geyser hazard (§5.3 / §4): timed magenta-cored ember columns burst from
    // vents in the lane — the biome's signature "read the vent rhythm, weave the
    // columns" verb. Dodge-only. OPTIONAL — absent everywhere else.
    hazard: { type: 'geyser', every: [150, 280], warn: 1.3, radius: 3.2 },
    // Overhaul kit (CALDERA-BIBLE.md) — the volcanic roster as it lands; `?props=v1`
    // restores the legacy basalt/vent cones. Mirror grows with each PR (colonnata first).
    props: ['colonnata', 'flowlobe', 'fumarole', 'clinker', 'riftwall', 'riftfang'],
    matIndex: 3, // basalt + ember veins
    // Contrast gate: dark band vs this biome's near-black fog (L≈0.18) — lifted.
    bullets: { dark: 0xa84167 },
  },
  {
    // THE LUMEN MIRE (LUMEN-MIRE-BIBLE.md) — a nocturnal bioluminescent wetland.
    // THEOLOGY: "Nothing here shines from the sky — the drowned forest makes its own
    // light, every glow is a living thing." PR-1 substrate: the AMBER MIRE atmosphere
    // + biome-4 material retune. Firefly-GOLD dominant (the research "forbidden teal
    // band" ~490–510nm escape) so it can NEVER be confused with the teal-green Aurora
    // night. The sky is a dark warm-neutral ROOF (Canopy Law — no sky is composed),
    // stars barely glimpsed; the STORY is under-brim glow + the black mirror + amber motes.
    name: 'LUMEN MIRE',
    keyShift: -4,
    stars: 0.2,
    // Warm-neutral dark ROOF: top nudged off blue, mid off green (Fable PR-1 gate —
    // no cool sky stop may survive from the shipped teal night), horizon amber haze.
    // Fable v33: light comes from BELOW (mist/water/ground-up), never a lit sky. Sky stays
    // night-dark with the amber biolume band compressed to the bottom ~25% (behind the trunks —
    // light rising from the land); top third ≤8% luma (kills dusk-drift; anti-Aurora sky-ceiling).
    sky: { top: C(0x060309), mid: C(0x1a0e06), horizon: C(0x7a4818), sun: C(0x5a3010) },
    // Near-fog is the GLOWING GROUND-MIST — a self-luminous amber-olive haze (color above the
    // scene mean = fog that EMITS, not obscures); far pulled in so sight-lines end in glow, not void.
    fog: { color: C(0x473217), near: 48, far: 255 },
    // Dual-fog far color (§5.2): the near air is dark humid warm-green swamp; distance
    // desaturates TOWARD amber haze (dark-scene aerial perspective fades to the dominant
    // GLOW hue, not blue-grey) — the cheapest identity move + the anti-Aurora firewall.
    fogFarColor: C(0x4a2c0e),
    // The GLOWING GROUND-MIST is the hero of the luminance pass — a visible waist-deep luminous
    // layer over the water (Fable v33: "the sky of the Mire is the waist-high mist").
    atmos: { heightK: 0.12 },
    // INVERTED HEMISPHERE (Fable v33): ground brighter+warmer than sky = light rising from the
    // land (the bioluminescence signature AND the built-in anti-Aurora tell). The sun is only a
    // faint marsh-glow RIM at very low intensity — the luminance comes from mist/water/ground-up,
    // never a bright key. (The dragon's belly under-fill is the meter; raise hemiGround if it crushes.)
    light: { sun: C(0xff9a3c), sunI: 0.2, hemiSky: C(0x12101a), hemiGround: C(0x4c3818) },
    // Luminous WARM water — the biggest single win (half the portrait frame): warm shallow so wave
    // crests catch amber ACROSS the mirror (not one column); deep = a green-black LIVING dark (never
    // pure #000); +20% wave so reflections spread into a broad shimmering field. NO teal (Aurora quarantine).
    water: { deep: C(0x0d1410), shallow: C(0x9a7228), waveAmp: 0.26 },
    // Theology firewall: "nothing shines from the sky." A night swamp has no sun-shafts —
    // meter the shared god-ray fan WAY down (default 1 = byte-identical elsewhere; ~0 like
    // Aurora would kill the faint glow-halos, so keep a dim residue) AND warm the shaft tint
    // to the amber glow-haze family so any residual reads as organism-lit mist, not a sun
    // (Fable PR-1 gate: grey-white point-source fan = a theology breach). See main.js god-ray gate.
    godrayMul: 0.075,
    godrayTint: C(0xff9d45),
    moteDepthFade: 0.85, // Fable 70: far motes DIM as they shrink (quadratic 20→110m) — kills the depth-flat "screen confetti" that ate the black mirror. Near firefly halos untouched.
    // Fable 75 AERIAL PERSPECTIVE: distant silhouette props LIGHTEN + hue-shift toward the horizon
    // ember (55→230m). 0x9c5a22 sits between the horizon haze (0x7a4818) and the mote amber (0xffb75c),
    // ≈2.1× the luma of fogFarColor 0x4a2c0e — so after the scene fog folds on top, distance still reads
    // LIGHTER (the flat-black canopy was the frame's deepest flatness). Never brighter than the glowcap
    // accents → the glow hierarchy holds. Other biomes leave propAerial unset → byte-identical.
    propAerial: 0.85, propAerialColor: C(0x9c5a22),
    // Fable 85 REFLECTION CRAFT: the black mirror is the biome's signature — turn the uniform brown
    // smear into anisotropic down-lane streaks under the glow sources (0.85), a few drifting amber
    // glints (0.7), and a mirror-side pull that tames the green catch-ring's reflection (0.8, the ring
    // itself untouched). Consumed by water.js via setWaterTint. 0 elsewhere → other biomes byte-identical.
    reflStretch: 0.85, reflGlint: 0.7, reflGreenPull: 0.8,
    // Fable 94: the Mire reserves MAGENTA for danger telegraphs, so a full-sky magenta Surge wash makes the
    // danger colour decorative — during boss fights, no less. Force the Surge sky EMBER instead (skin-agnostic)
    // + zero the magenta sky-curtain (Canopy Law). "The mire's organisms surge WITH you." 0 elsewhere.
    surgeWarm: 1,
    // Fable A1 ROOF-FROM-ABOVE: at the top of the lane the drape roof exits frame → a dark amber VOID.
    // A camera-following canopy-shelf shader quad (altitude-gated) turns it into the inverted money shot —
    // the mire's canopy seen from above, amber welling up through the gaps. 0 elsewhere → byte-identical.
    canopyRoof: 1,
    // Fable 90 HORIZON SHAFT: one sourceless warm glow-column off the ember horizon (light that TRAVELS,
    // not light that is placed). Metabolic, off-center, breathes — never a sun. Consumed by the sky shader
    // (su.uShaft). 0/absent elsewhere → byte-identical sky in every other biome.
    horizonShaft: 1.0,
    // Fable 79 HERO BACKLIT-RIM: the drake reads too small at cruise against the bright ember horizon.
    // Backlight its silhouette edge in the Mire's own identity amber (the mote/lantern hue) so it reads
    // as a NatGeo backlit animal — the edge takes the sky's colour, not its own. Body cruise = 0.5+0.55
    // = 1.05 (under the Tempest's proven 1.25); wings take it damped. Other biomes leave heroRim unset
    // → byte-identical rim, all skins.
    heroRim: 0.55, heroRimColor: C(0xffb75c),
    // Amber MOTES (the identity air / THRUMSWARM's proto-form): near-hovering with a slight
    // rise, a down-lane sway bias (the drift-current leading line, GoT Guiding-Wind).
    ambient: { color: C(0xffb75c), fall: 0.05, sway: 1.1, size: 0.72, opacity: 0.70 }, // fireflies — big near halos KEPT; hot-cored, calmer sway (was metronome), depth-faded far (moteDepthFade)
    fauna: { color: C(0xffd24a), scale: 0.9, flap: 0.4 }, // drifting lantern-motes (amber)
    // Overhaul kit (LUMEN-MIRE-BIBLE.md) — the depth/canopy substrate as it lands; `?props=v1`
    // restores the legacy glowcap/spirevine. Mirror grows with each PR (hero + roster to come).
    props: ['canopywall', 'reedveil', 'boleveil', 'drape'],
    matIndex: 4, // Mire: dead wet matter + living amber glow
    // Contrast gate: danger magenta vs this biome's dark humid fog — re-verified by
    // bulletcontrast on the new palette.
    bullets: { dark: 0xaf4f73 },
  },
  {
    // THE EMPYREAN (EMPYREAN-BIBLE.md) — the cosmos FINALE that BREAKS the dark run: after Mire's
    // biolume night and Aurora's aurora night, you breach the ceiling of the night into a BRIGHT
    // luminous pearl-violet void — no sun, no gold, no horizon; soft pastel nebula blooms, nacre water,
    // rising pearl motes, ink-black koi, and the only dark thing in all that light is one small black
    // point (the Mote, PR-3). THE INVERSION LAW: "light is the field; darkness is the only threat" —
    // the value ramp points UP (brightest at the zenith) and the accent colour is BLACK. PR-1 substrate:
    // the inverted sky ramp + two nebula blooms (empyMix), R7 bright-field stars, opal fog, the three
    // engine suns killed (sky disc via empyMix, godrayMul:0; the water glitter is a pale shimmer via the
    // canon sky.sun stop until the PR-2 nacreMix kill), a shadowless light rig, rising pearl motes, and a
    // pale-retinted legacy prop kit (mats.body[5]) holding the value band until the PR-4/5 roster.
    name: 'THE EMPYREAN',
    keyShift: 3,
    stars: 1,     // R7 bright-field treatment (§4a): the empyMix branch reshapes this to 20–60 sparse, luma-faded stars
    // THE LANDMARK slot, generalized (§8, PR-3): the sky-whale machinery now declares WHICH landmark it
    // draws. `whale: 1` drives the landmark MIX (it rides whaleMix → fades in over the 400m Aurora seam so
    // the Mote arrives as the light does), and `landmark: 'mote'` selects the black MOTE instead of the
    // gold whale mesh (the whale is suppressed for mote biomes in ambient.js; the Mote is a sky-shader term).
    whale: 1,
    landmark: 'mote',
    empy: 1.0,    // EMPYREAN gate (a new xMix): the inverted-sky nebula blooms + the sky-disc sun kill. 0 in every other biome → byte-identical (the three-touch rule; skyProbe is the 4th touch).
    bright: true, // EMBERSIGHT H6 skyLuma: the brightest field in the game → HUD keylines swap to the ember-core variant
    // INVERTED ramp (§3/§4a): value INCREASES upward — horizon → mid → ZENITH is the frame's bright pole.
    // sky.sun is the CANON pale stop (= sky-mid): the empyMix shader kill zeroes the disc, but authoring the
    // slot stops the seam-lerp dragging a hot neighbour sun across the crossfade (the shipped 0xcfe8ff was a
    // cool bright sun that survived any retune skipping this row). §3 sun #1.
    sky: { top: C(0xe3d8ff), mid: C(0xcabff0), horizon: C(0xc9c9f2), sun: C(0xdcd7f4) },   // pearl-VIOLET, not overcast grey (Fable-model gate: base rendered S was ~0.03 → "concrete"; stops pushed to S~0.15-0.20 @ ~255° so the rendered void reads violet). Keep the V64→92 upward inversion + the bright horizon dissolve. Probe (skyColorAt) reads these same stops → ambient stays in sync.
    // Opal fog — the Empyrean's air is bright (fog COLOUR above the scene mean = fog that glows, not
    // obscures); OPEN (far planes than the night biomes). fogFarColor lifts the far field TOWARD light
    // (inverted aerial perspective — the horizon-dissolve, §4c). heightK thin+even (no ground pooling).
    fog: { color: C(0xd8d4ee), near: 60, far: 340 },
    fogFarColor: C(0xe6e1f6),
    atmos: { heightK: 0.02 },
    // The NO-SOURCE light rig (§3): sunI → ~0 (shadowless omnidirectional skylight); high pale ambient via
    // hemiSky white-violet, hemiGround pale-violet up-bounce off the nacre so undersides stay LIGHT (a dark
    // belly is a broken asset here). Directional shadows read as a source → killed.
    light: { sun: C(0xf2eeff), sunI: 0.05, hemiSky: C(0xf2eeff), hemiGround: C(0xbfb2d8) },
    // Sun #3 — the god-ray fan: a sourceless sky has NO shafts. True zero (the Mire metered its rays to
    // 0.075 for its glow-halos; the Empyrean has none to preserve). §3 sun #3.
    godrayMul: 0,
    // NACRE water gate (§4b, PR-2): mother-of-pearl, not a mirror. Kills sun #2 (the pow-240 glitter lane +
    // the cheap sparkle flakes) and adds a broad satin sheen + constrained rose↔lilac↔periwinkle iridescence.
    // 0 in every other biome → byte-identical water (the xMix pattern; consumed by water.js via setWaterTint).
    nacre: 1.0,
    // NACRE water — PALETTE LANDED in PR-1 (deep = the trough structural-mid; shallow = the nacre body).
    // The NOVEL nacre SHADER (iridescence band term + the pow-240 sun-glitter kill + horizon-dissolve
    // triple-lock, all in sharedUniforms) is PR-2 (§4b); here the tint just pulls the water out of the old
    // near-black astral blue so the biome blind-tests bright. waveAmp 0.4 (visible sculpted swell — nacre
    // scatters, it does not mirror).
    water: { deep: C(0x6a6490), shallow: C(0xc6bede), waveAmp: 0.4 },
    // RISING pearl motes (§6): everything in the Empyrean drifts UP — fall < 0 = RISE (a fraction of
    // Caldera's -2.2 ember climb: dust up a sunbeam, not embers). Size/opacity jitter is standard.
    ambient: { color: C(0xf2ecff), fall: -0.15, sway: 1.2, size: 0.4, opacity: 0.5 },
    // INK KOI colour (§6): the star-koi become ink-violet koi (0x1a1424, NOT pure black — punctuation, the
    // true black 0x050308 stays role-locked to the Mote/wells). The bespoke inkShoal flock is PR-5; PR-1
    // lands only the colour on the interim flock.
    fauna: { color: C(0x1a1424), scale: 0.7, flap: 0.5 },
    props: ['monolith', 'arcshard'],  // interim legacy Astral kit, pale-retinted via mats.body[5] (PR-4/5 replaces it)
    matIndex: 5, // empyStone bone-nacre (pale-retinted from astral slate)
    // Contrast gate (§3, a REAL gate): a HIGH-KEY field is a NEW contrast regime — every shipped
    // bullets band was tuned on a DARK biome. On the pale ≥0.75 field the layered read (dark outline +
    // white core) can't cover a bright band, so the band FLIPS DARK: the default light 0xffc6dc (L≈0.83)
    // vanished into the sky and is dropped to a dusty dark-rose (L≈0.57) that clears both fog (L≈0.84) and
    // horizon (L≈0.83) directly by ≥0.15; mid/dark already clear (danger magenta is the core). The two
    // FIXED reflect role-colours (amber/cyan — no per-biome lever) can't clear a ≥0.75 field and are the
    // Amber-Wastes-class accepted exception in bulletcontrast.mjs (the Empyrean ships a BREATHER, so boss
    // reflect bullets render against THE UNMASKED's DARK arena skin, not this bright sky). Re-run on every
    // palette touch (again after the PR-2 nacre water).
    bullets: { light: 0xd47ba0, dark: 0xa84167 },
  },
  {
    // Aurora Shallows: a moonlit NIGHT biome — the dark, still MIRROR canvas the aurora
    // curtain rises against. Near-black indigo sky (ALL the saturation comes from the
    // curtain), stillest water in the game, a faint aurora-green world wash. Appended as
    // BIOMES[6] but NOT yet in CYCLE — reachable only via ?biome=6 until the flip (PR-4).
    // Slots between Mire and Astral (night crescendo: biolume → aurora → cosmos).
    name: 'AURORA SHALLOWS',
    keyShift: -1,
    stars: 0.85,
    // The aurora channel (auroraSky.js): the biome that finally lights the dormant
    // env.auroraMix. computeEnv lerps it across the 150m seam for free.
    aurora: 1.0,
    // horizon = the dim aurora airglow shelf the curtain rises from — darkened to 0x183a36 (L≈0.20)
    // so the fixed magenta DANGER bullet (L≈0.36) clears it (bulletcontrast gate); darker = aurora pops more.
    sky: { top: C(0x050a14), mid: C(0x0e1a34), horizon: C(0x183a36), sun: C(0xa8c8e8) },
    fog: { color: C(0x101a2e), near: 95, far: 460 },
    // Dual-fog (§5.2): sink the far field to near-black indigo so the horizon aurora band
    // is the brightest thing in the frame.
    fogFarColor: C(0x070c18),
    light: { sun: C(0xbfd4f0), sunI: 0.9, hemiSky: C(0x2f5c55), hemiGround: C(0x0a1414) },
    water: { deep: C(0x030814), shallow: C(0x0f3c46), waveAmp: 0.2 }, // shallow half-step green so the wave-face harmonizes with the reflected aurora
    ambient: { color: C(0xd8f4ff), fall: 0.05, sway: 0.5, size: 0.26, opacity: 0.7 },
    fauna: { color: C(0xc0d8e0), scale: 0.6, flap: 0.35 },
    props: ['floe', 'iceFang', 'berg', 'skerry', 'ridge'], // LOW ice across 3 shape families + rock + distant massif (sky owns the frame)
    matIndex: 6, // ice (doc only; obstacles tint via biomeIndexAt → mats.body[6])
    // Contrast gate: darker fog than Astral (L≈0.10) → the default deep bullet band vanishes.
    bullets: { dark: 0xaf4f73 },
  },
  {
    // TEMPEST REACH (TEMPEST-REACH-BIBLE.md): the AAA storm biome, STORMREND's home — "the storm
    // that never lands." Theology — "the sun is ABOVE the storm; every light is the storm FAILING
    // to contain it: the leak, the breach, and the blow." Mass is dark, wet, wind-torn; nothing is
    // self-luminous. The cycle's ONLY dim-DAYLIGHT biome (stars:0), the only VIOLENT sea
    // (waveAmp 0.95), the only far fog that goes PALE (rain-veil silver), the only light that CHANGES
    // over time (lightning, PR-4). Distinct from every cool/dark biome by construction: its green is a
    // DESATURATED grey-olive TRANSMITTED through cloud, and saturated storm-teal 0x2fd8e8 is BANNED
    // from the ambient palette (reserved for STORMREND's kit + momentary in-eye water glints — the
    // biome makes the boss pop by starving its hue). vs the amber Lumen Mire (BIOMES[4], merged
    // #464): the shared hue is now warm GOLD, resolved oppositely — Mire is a WARM-dominant NIGHT
    // swamp whose light is SELF-emitted by organisms + a still black-mirror; Tempest is a COOL-
    // dominant DAY storm whose gold is a rationed ≤10% STOLEN-sunlight accent (never self-lit) over
    // a VIOLENT sea. Field cool + warm rationed = the guard. Appended as
    // BIOMES[7], NOT yet in CYCLE — reachable only via ?biome=7&debug until the CYCLE flip (a later
    // no-op PR coordinated with the Lost Lagoon arc). PR-0 = the atmosphere substrate; the storm-carved
    // prop roster, obstacle skins, and the lightning hazard follow in their own PRs.
    name: 'TEMPEST REACH',
    keyShift: -3,
    stars: 0,
    deckBias: 1.15,   // the storm ceiling owns the sky: pull the mid→top gradient stops DOWN so the dark deck dominates and the green belt compresses to a thin strip above the pale horizon slot
    sky: {
      // BEAUTY PASS sky re-grade (Fable, "bruised storm"): the violet lives in the DARKS (deck, cloud
      // shadow, near fog), the olive stays in the mid belt as the bruise's sickly complement, all warmth is
      // rationed to the slot/breach/rays/gold. Converts NEUTRAL (grey/depressing) → moody-ALIVE; stays a
      // menacing DAY storm (mids lit, slot brightest), not a purple night (that's the surge state).
      top: C(0x2a2540),      // BRUISED indigo-violet deck (was near-black blue-grey 0x1f242c) — L≈0.15, same silhouette floor, now with HUE. The strategic pixel.
      mid: C(0x545c46),      // the olive belt KEPT (+sat, +half-stop) — violet deck over olive belt IS the bruise (severe-storm "green sky"); NOT violet (all-violet = surge/monochrome)
      horizon: C(0xc2b399),  // THE VALUE HOLE, now warm PAPER-GOLD (was silver 0xaab1ad) — the slot is where the stolen sun leaks (conscious theology override; field light stays cool). L≈0.70 authored (~0.87 bloomed), still the brightest hole.
      sun: C(0x9c8f76),      // the hidden sun warmed to agree with the slot; still NO disc
      // N9 clouds: the heaviest deck in the cycle — the SHADOW is committed dark VIOLET (deck family; the
      // dark underside makes the cloud read as SOLID storm mass), lit tops held BELOW the slot's value.
      cloud: { amount: 0.80, lit: C(0x9a99a6), shadow: C(0x1d1a2e), force: true }, // Fable gate R2: lit was 0xb5ab98 (warm) × amount 0.80 = warm painted across the LARGEST sky surface → the whole cloud field fused with the slot into one warm mass (the rationing inverted). Cooled to violet-grey (same L≈0.60) → lit cloud reads as storm-cloud in weak COOL daylight; warmth snaps back to ONLY slot/breach/rays/road/gold. shadow = deck violet. force: the storm deck is the biome identity
    },
    fog: { color: C(0x494c60), near: 55, far: 360 },  // INDIGO-slate near haze (was grey-slate 0x44505a) — violet/teal is the bruise pairing over the teal sea; L≈0.30 unchanged so danger/bullets still clear it
    // Dual-fog (§5.2) INVERTED: the far field goes PALE rain-veil silver — the only biome whose far
    // field is LIGHTER than its near (Frozen melts to gold, Caldera/Aurora sink to black). Receding
    // forms dissolve into the veil: free depth + cycle-unique distinctness.
    fogFarColor: C(0xb3ac9c),   // far field still goes LIGHTER (cycle identity) but now agrees with the warm slot instead of fighting it (was cool silver 0xa7b2b0)
    // N8 height-fog: the wet storm air pools LOW, thickest where the sea is angriest.
    atmos: { heightK: 0.03 },
    // AERIAL PERSPECTIVE (Fable 75 lever, migrated from the Mire; Fable pre-assess: current prop-depth 2/5).
    // The dual-fog pales the far SKY into the rain-veil, but the dark-slate props (0x4b545c) don't
    // participate — the mid-field arch spires (~100–260m, the money composition) sit at the SAME near-black
    // value as the 30m foreground, and because Tempest's far field goes LIGHTER, prop-vs-sky contrast GROWS
    // with distance (the inverse of nature = the "sticker" flatness). This fades distant props toward a haze
    // hue so they recede. Strength 0.55 (NOT the Mire's 0.85: this haze is ~2.3× the luminance of the Mire's
    // dark ember, so equal strength would over-lift and dissolve the silhouettes; the quadratic 55→230m ease
    // keeps the 90–200m drama zone at only 0.05–0.25 effective). HUE 0x98948d = the rain-veil (fogFarColor
    // 0xb3ac9c) cooled ONE value step toward the near-fog indigo (0x494c60): aerial haze is AIR not surface
    // light, so it inherits the veil's already-legal warmth (the theology firewall bans a warm KEY LIGHT, not
    // warm far air) WITHOUT reading as a warm field light; kept 1 step below the veil so props recede into it
    // rather than fuse, and chroma below the gold sockets so the rationed burn is untouched. 0 elsewhere =
    // byte-identical; the <55m floor keeps the near hero props byte-untouched.
    propAerial: 0.65, propAerialColor: C(0x98948d),   // owner device call: 0.55 read a touch subtle → bumped to 0.65 (top of Fable's authorized 0.45–0.65 scalar band; hue/ramp unchanged) for a clearer recede while still holding the silhouette drama
    // THEOLOGY FIREWALL (the fix): "the sun is HIDDEN above the storm." An overcast storm's key light
    // is DIM + COOL-NEUTRAL, not a warm gold sun. sun was 0xffd28a @1.25 (a sunny-day key that washed
    // the whole scene warm); now a flat cool storm-grey at low intensity. Warmth survives ONLY as the
    // rationed cloud-rim/socket gold, never as the field light.
    // Light rig (Fable regrade): sun stays COOL + dominant (day-storm; theology holds — no warm field
    // light). hemiSky carries the deck's indigo onto prop shadow planes; hemiGround carries the sea's teal
    // up into bellies → rock and sky agree. Warmth enters only via emissive (gold, slot-lit scour) + the sky.
    light: { sun: C(0xb0b4c6), sunI: 0.82, hemiSky: C(0x5c5f78), hemiGround: C(0x2c3a42) },
    // EYE-BREACH godray meter (TEMPEST-REACH-BIBLE.md — the eye of the gale): the biome's ONE sun-shaft
    // event. The storm has no field-wide shafts, but where the deck BREAKS on the sun azimuth the light
    // pours through — so ramp the shared fan UP (0.05 → 0.42) and the bright almond interior (below)
    // auto-becomes the occlusion-mask source. v1 = a fixed prominent value (the progress-arc growth is a
    // follow-on). Byte-identical elsewhere (godrayMul only lerps at biome 7's seams).
    godrayMul: 0.22,   // Fable R3 (device): the rays are ATMOSPHERE not statement. NEGATIVE-OF-CLOUDS: the carve breaks the shafts up (less continuous light), so a hair more base intensity keeps the crepuscular pour readable
    godrayBreak: 0.0,   // NEGATIVE-OF-CLOUDS: the CLOUD DECK is now the shaft modulation (occlusion-mask carve), so kill the artificial sine bundles entirely — no double-modulation, no countable lobes
    godrayTint: C(0xffe6bd),   // paler, grey-broken storm-filtered sunlight (was saccharine amber 0xffd28a which pushed the wedges violet); the GOLD statement belongs to the sockets, not the sky
    // EYE-BREACH gate (the still axle): a fixed prominent 1.0 in Tempest, 0 elsewhere = byte-identical.
    // Drives env.breachMix → the sky-shader almond window + the water calm/gold patch. World-locked to
    // the sun azimuth (atan2(sunDir.z, sunDir.x)); the sun DISC is never shown (a centerless brightness).
    breach: 1.0,
    // KILL THE BLUE: charcoal storm-trough deep + grey-green wave face; waveAmp 0.95 = the roughest
    // sea in the game (the previous cycle max was Amber Wastes at 0.7).
    // BEAUTY PASS (Fable, sea half of the regrade): the pale grey-slate sea (deep 0x1b262c / shallow
    // 0x54696b) read as neutral MUD — "gold on grey is mud; gold on teal-slate is fire." Deepened toward
    // a darker teal-slate (the ROCK teal-ban doesn't apply to water) so the sun-road can actually burn and
    // the sea stops reading depressing-neutral. Sky regrade (indigo deck) held for the full pass.
    water: { deep: C(0x0c1a22), shallow: C(0x3c5a62), waveAmp: 0.95, swellForce: true }, // force the rolling swell geometry ON (like cloudForce) so the sea ROLLS for every capable device, not only where the player toggled water-swell; weak tier-2 devices auto-stay flat

    wind: TEMPEST_WIND,   // one wind vector: foam + rain streaks + cloud-crawl all lean this way
    rain: 1.0,            // the rain.js LineSegments streak layer (rainMix-gated)
    stormSea: 1.0,   // STORMSEA: violent storm sea — near-black troughs + one-way wind-combed foam streaks (js/water.js). waveAmp alone only makes ripples; this is what makes the sea RAGE.
    // The signature hazard: a telegraphed lethal lightning strike (hazards.js type 'lightning' →
    // a two-stage magenta telegraph, then a white/violet bolt from stormLightning.js + the full flash).
    // Dodge-only (cylinder radius 3.2, lethal ≤0.35s). Rarer than geysers; determinism via hazardRnd.
    hazard: { type: 'lightning', every: [240, 460], warn: 1.2, radius: 3.2 },
    // Driving rain motes on ONE wind vector — DIMMED + de-starred (Fable gate: bright white specks on a
    // dark sky read as a STARFIELD → night collision). Darker/dimmer now; velocity-stretched streak
    // These Points are now near-water SPUME (torn spray), NOT the rain — the rain is the rain.js
    // LineSegments streak layer (rainMix-gated). Small, dim, low-falling froth over the sea.
    ambient: { color: C(0x9fb0b4), fall: 1.5, sway: 2.0, size: 0.18, opacity: 0.35 },
    fauna: { color: C(0x9fb0b8), scale: 0.7, flap: 0.6 }, // storm-petrels: small, fast, wind-tossed
    props: ['stormprow', 'scarpwall'], // the storm-carved roster (scarpwall = the mid-ground headland massif). NOTE: doc-only — the archetype's `biomes: tempestNew` whitelist is the actual spawn gate
    matIndex: 7, // storm slate
    // No bullets override needed: with the fog held at L≈0.31 and the horizon under the 0.75 read
    // ceiling, all six role colours (danger + band + reflects) clear both fog and horizon on the
    // default band (bulletcontrast, zero new exceptions). The PR-4 lightning FLASH lifts the whole
    // frame transiently — its grade is CAPPED there so the magenta danger still clears at peak.
  },
];

// ── THE DROWNED FORUM — Biome 0 atmosphere substrate (DROWNED-FORUM-BUILD-SHEET §2D) ──────────────
// "The light still keeps its appointments" — a straight gold sun-lane down a drowned Roman axis, over
// a wine-dark bay, under a Mediterranean dusk. The green purge: no jade water, no jungle horizon; the
// warmth reads rich ONLY because of THREE cool anchors (the anti-"orange-soup" law, §2C) — wine-dark
// DEEP water, violet-slate ZENITH, and the slate-teal hemisphere bounce (the drowned bases live on the
// props, PR-2+). Built as a spread over the shipped LOST LAGOON entry so every field the sheet doesn't
// re-spec (keyShift, stars, matIndex, faunaFlyby…) inherits unchanged; only the §2D fields move.
export const FORUM_BIOME0 = {
  ...BIOMES[0],
  name: 'THE DROWNED FORUM',
  // Mediterranean dusk: violet-slate zenith (a COOL ANCHOR) → rose mid → apricot horizon → warm sun.
  // The horizon is authored at L≈0.74 — deliberately UNDER the 0.75 layered-read ceiling (the same
  // discipline the Tempest horizon documents) so the fixed magenta danger bullet + the amber/cyan swat
  // roles all clear it via the outline/white-core read (bulletcontrast). Bloom + the god-ray swell lift
  // it on screen to a brilliant apricot sun-slot; readable in authoring space, gorgeous when lit.
  sky: { top: C(0x3a3f66), mid: C(0xe8907a), horizon: C(0xf7b276), sun: C(0xffd891),
    // Warm Mediterranean dusk cumulus — apricot-lit tops over cool violet-slate undersides.
    cloud: { amount: 0.8, lit: C(0xffe0b4), shadow: C(0x2a2c44) } },
  // Warm gold-umber fog pushed hard into distance (§2D) — the binder that melts the ranks of arches
  // into the sun. NEAR = gold-umber (L≈0.73, under the read ceiling so the danger band clears it);
  // FAR melts one step brighter toward the sun-lane so the city dissolves into gold, not grey.
  fog: { color: C(0xe8b27e), near: 74, far: 440 },
  fogFarColor: C(0xf0c48c),
  atmos: { heightK: 0.025 },   // evening bay-mist pooling on the water; dive into the hush, climb into clear gold
  // Low warm sun; hemiSky is the COOL violet-slate sky-fill and hemiGround the drowned SLATE-TEAL water
  // bounce — the two cool anchors that keep the gold from going to soup (§2C). sunI a hair under the
  // lagoon so the mirror stays the composition's spine, not a glare.
  light: { sun: C(0xffc98a), sunI: 1.5, hemiSky: C(0x9aa0c0), hemiGround: C(0x2e5850) },
  // Wine-dark deep (the third cool anchor) + Baiae glass-turquoise shallow, sunset-warmed. Calm waveAmp:
  // a BAY, not a sea — ≥45% of the visible water must stay an unbroken mirror (the awe is in the silence).
  water: { deep: C(0x0d2b36), shallow: C(0x54a090), waveAmp: 0.3 },
  // Gold-dust motes drifting on the bay air (replaces the lagoon's blossom-petal wind) — fine, warm, slow.
  ambient: { color: C(0xf2d9a8), fall: 0.35, sway: 2.0, size: 0.3, opacity: 0.6 },
  // Pale gulls down the sun-lane — the deliberate SCALE ANCHORS (§11.8) that make a 40m arch feel 40m.
  fauna: { color: C(0xf2e6ce), scale: 1.15, flap: 0.6 },
  // No per-biome bullet override needed: the bright gold-umber fog + apricot horizon push the DEFAULT
  // danger/band/swat colours clear of both backgrounds (verified in bulletcontrast) — drop the lagoon's
  // dark-band lift, which existed only for the lagoon's DARK teal fog.
  bullets: undefined,
};

// The forum atmosphere rides the SAME `?props=forum` flag as its props (environment.js). Default and
// headless (no window) → BIOMES[0] stays THE LOST LAGOON, so gold-determinism / biomecycle are
// byte-identical. A const array's ELEMENT may be reassigned (const only pins the binding).
if (PROPS_FORUM) BIOMES[0] = FORUM_BIOME0;

// The biome CYCLE — the ORDER biomes appear along the course, independent of the BIOMES
// array order. This indirection lets a new biome be APPENDED to BIOMES (with its mats/skins/
// palettes) while the shipped world stays byte-identical until its index is added to CYCLE —
// the coexistence seam for slotting Aurora Shallows (BIOMES[6]) between Mire and Astral, etc.
// Any code that cycles biomes by distance MUST index through CYCLE, never `block % BIOMES.length`.
// PR-4 THE FLIP: Aurora Shallows (6) slotted between Lumen Mire (4) and Astral Shallows (5) — the
// night crescendo biolume → AURORA → cosmos. Mire→Aurora is the softest seam in the roster (both
// night, Mire's teal horizon 0x3fd8b0 is the aurora's own hue family); Aurora→Astral hands the dying
// curtain off to the sky-whale (auroraMix 1→0 as whaleMix 0→1). Cycle is now 7 long; every consumer
// indexes through CYCLE.length so that is safe. Blocks 0-4 reproduce the shipped order byte-for-byte.
export const CYCLE = [0, 1, 2, 3, 4, 6, 5];

// Debug seam: ?biome=<i> pins the whole course to one biome (no seam crossfade) so an
// appended-but-not-yet-cycled biome (Aurora Shallows = 6) is flyable before the CYCLE flip.
// null in all real play → biomeAt is byte-identical (gold-determinism untouched; course gen
// is biome-blind regardless).
let forcedBiome = null;
export function setForcedBiome(i) { forcedBiome = (i == null || Number.isNaN(i)) ? null : i; }

export function biomeAt(dist) {
  if (forcedBiome != null) return { ia: forcedBiome, ib: forcedBiome, t: 0 };
  const L = CONFIG.biomeLength;
  const block = Math.max(0, Math.floor(dist / L));
  const ci = block % CYCLE.length;
  const ia = CYCLE[ci];
  const ib = CYCLE[(ci + 1) % CYCLE.length];
  const local = dist - block * L;
  const t = THREE.MathUtils.smoothstep(local, L - CONFIG.biomeTransition, L);
  return { ia, ib, t };
}

// Dominant biome index at a distance (used for per-instance prop/material
// decisions — instances never blend, the atmosphere does).
export function biomeIndexAt(dist) {
  const { ia, ib, t } = biomeAt(dist);
  return t < 0.5 ? ia : ib;
}

// Shared scratch env: every color lerped between the two biomes at the seam.
// One object reused per frame — callers must consume, not retain.
const env = {
  skyTop: new THREE.Color(), skyMid: new THREE.Color(), skyHorizon: new THREE.Color(),
  sunGlow: new THREE.Color(),
  fogColor: new THREE.Color(), fogNear: 70, fogFar: 380,
  // Dual-fog (§5.2): fogFarColor is a COLOR (fogFar above is a DISTANCE).
  // fogFarMix gates the sky-horizon blend — 0 where no biome declares a
  // fogFarColor, so the sky is byte-identical there (the xMix pattern).
  fogFarColor: new THREE.Color(), fogFarMix: 0,
  lightSun: new THREE.Color(), lightSunI: 1.6,
  hemiSky: new THREE.Color(), hemiGround: new THREE.Color(),
  waterDeep: new THREE.Color(), waterShallow: new THREE.Color(), waveAmp: 1,
  ambColor: new THREE.Color(), ambFall: 1, ambSway: 1, ambSize: 0.4, ambOpacity: 0.75,
  faunaColor: new THREE.Color(), faunaScale: 1, faunaFlap: 1,
  starMix: 0, whaleMix: 0, flybyMix: 0,
  // THE MOTE landmark mix (§8): 0 in every non-mote biome → byte-identical (whale mesh path unchanged).
  moteMix: 0,
  // Aurora Shallows (BIOME plan): 0 in every current biome (optional-channel
  // pattern) → the aurora sky-splice is a byte-identical no-op until a biome
  // declares `aurora`. Consumed by auroraSky.js via applyAurora(env).
  auroraMix: 0,
  // THE EMPYREAN (EMPYREAN-BIBLE.md): 0 in every other biome (optional-channel pattern) → the inverted-sky
  // nebula blooms + the sky-shader sun-disc kill are a byte-identical no-op until a biome declares `empy`.
  // Consumed by empyreanSky.js via applyEmpyrean(env) (the sky uniforms) AND mirrored into skyProbe.js's
  // skyColorAt (the 4th touch — a cheap bloom lift for the SH ambient). Crossfades the seam for free.
  empyMix: 0,
  // NACRE water gate (PR-2, §4b): 0 in every other biome → byte-identical water. Consumed by water.js via
  // setWaterTint — kills the sun-glitter + adds satin sheen + iridescence.
  nacreMix: 0,
  // N8 atmosphere channels (OPTIONAL per biome; 0 everywhere by default so the
  // fog is byte-identical). heightK = thin fog with altitude; inscatter = sunward
  // brightening. Consumed by atmosphere.js via applyAtmosphere(env).
  atmosHeightK: 0, atmosInscatter: 0,
  // Mote depth-fade (OPTIONAL; 0 everywhere by default → byte-identical motes). A biome may fade
  // its far motes' alpha by camera distance so the field recedes instead of reading as a flat
  // screen overlay. Consumed by ambient.js. (Fable 70.)
  moteDepthFade: 0,
  // Aerial perspective (OPTIONAL; 0 everywhere by default → byte-identical props). A biome may
  // lighten + hue-shift its far silhouette props toward an ember horizon by view depth. Consumed
  // by environment.js's addPropDetail (uPropAerial/uPropAerialCol). (Fable 75.)
  propAerial: 0, propAerialColor: new THREE.Color(),
  // Reflection craft (OPTIONAL; 0 everywhere by default → byte-identical mirror). A biome may give its
  // water anisotropic reflection streaks + drifting glints + a mirror-side green-blob pull. Consumed by
  // water.js via setWaterTint. (Fable 85.)
  reflStretch: 0, reflGlint: 0, reflGreenPull: 0,
  // Per-biome ember-Surge override (OPTIONAL; 0 = the shipped magenta Surge sky). A biome that reserves
  // magenta for another meaning may flare its Surge horizon ember + drop the magenta curtain. (Fable 94.)
  surgeWarm: 0,
  // Canopy-roof-from-above (OPTIONAL; 0 = no altitude canopy shelf → byte-identical). A biome may grow a
  // from-above canopy shelf when the camera climbs to the top of the lane. Consumed by environment.js's roof
  // quad + ambient.js's high-altitude mote treatment. (Fable A1.)
  canopyRoof: 0,
  // Horizon shaft (OPTIONAL; 0 everywhere by default → byte-identical sky). A biome may raise one
  // sourceless warm glow-column off its horizon. Consumed by the sky shader (su.uShaft). (Fable 90.)
  horizonShaft: 0,
  // Hero backlit-rim lever (OPTIONAL; 0 everywhere by default → byte-identical rim, all skins).
  // A biome with a bright horizon may backlight the dragon's silhouette edge in the horizon's own
  // colour. Consumed by dragon.js's rim block via environment.js getHeroRim(). (Fable 79.)
  heroRim: 0, heroRimColor: new THREE.Color(),
  // God-ray fan scale (OPTIONAL; 1 everywhere by default → byte-identical shafts).
  // A night biome (Lumen Mire) meters it down; consumed by main.js's god-ray gate.
  godrayMul: 1,
  // God-ray shaft tint (OPTIONAL; the shipped warm-white default → byte-identical).
  // A biome may warm/cool the residual shafts. Consumed by main.js's god-ray gate.
  godrayTint: new THREE.Color(1.0, 0.9, 0.72),
  // God-ray sunburst-break strength (OPTIONAL; 0.35 default = subtle crepuscular bundles everywhere,
  // a shared premium upgrade). A storm biome ramps it up so shafts read as broken bundles, not a fan.
  godrayBreak: 0.35,
  // N9 sky clouds (OPTIONAL per biome; amount 0 = no clouds → shipped gradient).
  // Consumed by skyClouds.js via applySkyClouds(env).
  cloudAmount: 0, cloudLit: new THREE.Color(), cloudShadow: new THREE.Color(), cloudForce: 0, deckBias: 0, stormSea: 0, windX: 0, windZ: 0, rainMix: 0,
  // EYE-BREACH (Tempest): the eye-of-the-gale breach gate. 0 in every biome that doesn't declare
  // `breach` (optional-channel pattern) → the sky-shader almond window + water calm/gold patch are a
  // byte-identical no-op. Consumed by environment.js (su.uBreachMix) + skyProbe.js (ambient mirror).
  breachMix: 0,
};

const lerp = THREE.MathUtils.lerp;
// Aurora-seam crossfade widths (see computeEnv): the WHOLE world (curtain + sky + water + fog + stars)
// crossfades over these — the curtain dawns over the entry biome's last 600m and the seam hands off to
// the cosmos over the aurora's last 400m. Asymmetric so the "dawn" is slower than the "handoff to the
// whale." Sized for the worst realistic crossing speed (orb ~108 m/s → 600m ≈ 5.6s still reads as a
// dawn); the exit is naturally fast (the guaranteed flow run ends ~B+1200 with slip decaying) so 400m
// keeps the finale under a bright curtain. Only aurora-adjacent seams use these; all others keep 150m.
const AUR_RAMP_IN = 600, AUR_RAMP_OUT = 400;

export function computeEnv(dist) {
  const { ia, ib, t } = biomeAt(dist);
  const a = BIOMES[ia];
  const b = BIOMES[ib];
  // SHARED aurora-seam ramp (PR-4b, issue #2 fix): PR-4 widened only the curtain (auroraMix), leaving
  // sky/water/fog/stars on the 150m seam — so the background SNAPPED under the dawning curtain, and at
  // flow-run / boost speed the 150m whips by in ~1.5s ("sometimes abrupt" = "when fast"). Give EVERY
  // channel one shared wide window at an aurora-adjacent seam (splitting per-channel just relocates the
  // incoherence mid-seam). Branch-gated: non-aurora seams → ts === t → byte-identical; ?biome=6
  // (ia===ib, t=0) → branch false, t=0 → full values pinned; biomeAt/biomeIndexAt untouched (props,
  // matIndex switch, hazard Law-5's CONFIG.biomeTransition, and the boss guards all stay byte-identical).
  let ts = t;
  if ((a.aurora || b.aurora) && ia !== ib) {
    const L = CONFIG.biomeLength;
    const local = dist - Math.max(0, Math.floor(dist / L)) * L;
    const W = b.aurora ? AUR_RAMP_IN : AUR_RAMP_OUT;
    ts = THREE.MathUtils.smoothstep(local, L - W, L);
  }
  env.skyTop.lerpColors(a.sky.top, b.sky.top, ts);
  env.skyMid.lerpColors(a.sky.mid, b.sky.mid, ts);
  env.skyHorizon.lerpColors(a.sky.horizon, b.sky.horizon, ts);
  env.sunGlow.lerpColors(a.sky.sun, b.sky.sun, ts);
  env.fogColor.lerpColors(a.fog.color, b.fog.color, ts);
  env.fogNear = lerp(a.fog.near, b.fog.near, ts);
  env.fogFar = lerp(a.fog.far, b.fog.far, ts);
  env.fogFarColor.lerpColors(a.fogFarColor ?? a.fog.color, b.fogFarColor ?? b.fog.color, ts);
  env.fogFarMix = lerp(a.fogFarColor ? 1 : 0, b.fogFarColor ? 1 : 0, ts);
  env.lightSun.lerpColors(a.light.sun, b.light.sun, ts);
  env.lightSunI = lerp(a.light.sunI, b.light.sunI, ts);
  env.hemiSky.lerpColors(a.light.hemiSky, b.light.hemiSky, ts);
  env.hemiGround.lerpColors(a.light.hemiGround, b.light.hemiGround, ts);
  env.waterDeep.lerpColors(a.water.deep, b.water.deep, ts);
  env.waterShallow.lerpColors(a.water.shallow, b.water.shallow, ts);
  env.waveAmp = lerp(a.water.waveAmp, b.water.waveAmp, ts);
  env.ambColor.lerpColors(a.ambient.color, b.ambient.color, ts);
  env.ambFall = lerp(a.ambient.fall, b.ambient.fall, ts);
  env.ambSway = lerp(a.ambient.sway, b.ambient.sway, ts);
  env.ambSize = lerp(a.ambient.size, b.ambient.size, ts);
  env.ambOpacity = lerp(a.ambient.opacity, b.ambient.opacity, ts);
  env.faunaColor.lerpColors(a.fauna.color, b.fauna.color, ts);
  env.faunaScale = lerp(a.fauna.scale, b.fauna.scale, ts);
  env.faunaFlap = lerp(a.fauna.flap, b.fauna.flap, ts);
  env.starMix = lerp(a.stars || 0, b.stars || 0, ts);
  env.auroraMix = lerp(a.aurora || 0, b.aurora || 0, ts);
  // THE EMPYREAN gate (optional-channel): 0 elsewhere = byte-identical; crossfades the aurora-adjacent seam
  // over the SAME wide window as the rest of the world (ts) so the nebula blooms dawn as the light does.
  env.empyMix = lerp(a.empy || 0, b.empy || 0, ts);
  // NACRE water gate (PR-2, §4b): rides the same seam ramp; 0 elsewhere = byte-identical water.
  env.nacreMix = lerp(a.nacre || 0, b.nacre || 0, ts);
  // whaleMix now rides the SAME 400m window the curtain dies in → the "curtain hands off to the whale"
  // handoff PR-4 described finally happens in one window (was 150m while the curtain took 300m).
  env.whaleMix = lerp(a.whale || 0, b.whale || 0, ts);
  // THE MOTE (§8, PR-3): the portion of the landmark mix that belongs to a 'mote' landmark biome — drives
  // the sky-shader Mote term. The whale MESH (ambient.js) shows only the NON-mote remainder (whaleMix −
  // moteMix), so a mote biome renders the Mote, not the whale. 0 elsewhere → byte-identical.
  const _lm = (x) => (x.landmark === 'mote' ? (x.whale || 0) : 0);
  env.moteMix = lerp(_lm(a), _lm(b), ts);
  env.flybyMix = lerp(a.faunaFlyby ? 1 : 0, b.faunaFlyby ? 1 : 0, ts);
  // N8 atmosphere (optional-channel pattern): 0 unless the biome declares atmos.
  env.atmosHeightK = lerp(a.atmos?.heightK || 0, b.atmos?.heightK || 0, ts);
  env.atmosInscatter = lerp(a.atmos?.inscatter || 0, b.atmos?.inscatter || 0, ts);
  env.moteDepthFade = lerp(a.moteDepthFade ?? 0, b.moteDepthFade ?? 0, ts);
  env.propAerial = lerp(a.propAerial ?? 0, b.propAerial ?? 0, ts);
  env.horizonShaft = lerp(a.horizonShaft ?? 0, b.horizonShaft ?? 0, ts);
  env.surgeWarm = lerp(a.surgeWarm ?? 0, b.surgeWarm ?? 0, ts);
  env.canopyRoof = lerp(a.canopyRoof ?? 0, b.canopyRoof ?? 0, ts);
  env.reflStretch = lerp(a.reflStretch ?? 0, b.reflStretch ?? 0, ts);
  env.reflGlint = lerp(a.reflGlint ?? 0, b.reflGlint ?? 0, ts);
  env.reflGreenPull = lerp(a.reflGreenPull ?? 0, b.reflGreenPull ?? 0, ts);
  env.propAerialColor.lerpColors(a.propAerialColor ?? a.fogFarColor ?? a.fog.color, b.propAerialColor ?? b.fogFarColor ?? b.fog.color, ts);
  env.heroRim = lerp(a.heroRim ?? 0, b.heroRim ?? 0, ts);
  env.heroRimColor.lerpColors(a.heroRimColor ?? a.fogFarColor ?? a.fog.color, b.heroRimColor ?? b.fogFarColor ?? b.fog.color, ts);
  env.godrayMul = lerp(a.godrayMul ?? 1, b.godrayMul ?? 1, ts);
  env.godrayBreak = lerp(a.godrayBreak ?? 0.35, b.godrayBreak ?? 0.35, ts);
  env.godrayTint.lerpColors(a.godrayTint ?? GODRAY_TINT_DEF, b.godrayTint ?? GODRAY_TINT_DEF, ts);
  // N9 sky clouds (optional-channel): amount gates them out (0 = shipped); colours
  // fall back to the biome's sky mid/top so a cloudy↔clear seam lerps sane hues.
  env.cloudAmount = lerp(a.sky.cloud?.amount || 0, b.sky.cloud?.amount || 0, ts);
  env.cloudLit.lerpColors(a.sky.cloud?.lit ?? a.sky.top, b.sky.cloud?.lit ?? b.sky.top, ts);
  env.cloudShadow.lerpColors(a.sky.cloud?.shadow ?? a.sky.mid, b.sky.cloud?.shadow ?? b.sky.mid, ts);
  // Cloud FORCE (Tempest): a storm's deck is its identity, not an opt-in — a biome with cloud.force
  // renders clouds even when the global sky-cloud toggle is off (still tier-gated for perf, like all
  // clouds). Lerped 0→1 so every non-forcing biome stays byte-identical (opt-in as before).
  env.cloudForce = lerp(a.sky.cloud?.force ? 1 : 0, b.sky.cloud?.force ? 1 : 0, ts);
  // Per-biome DECK BIAS (Tempest): pulls the sky gradient stops down so the storm ceiling owns
  // the sky (0 elsewhere = byte-identical). Mirrored in skyProbe.js skyColorAt.
  env.deckBias = lerp(a.deckBias || 0, b.deckBias || 0, ts);
  // STORMSEA (Tempest): the violent-sea gate; 0 elsewhere = byte-identical calm water.
  env.stormSea = lerp(a.stormSea || 0, b.stormSea || 0, ts);
  // Wind DIRECTION never lerps (a spinning vector reads as a compass); pick whichever adjacent biome
  // declares one. rainMix (intensity) DOES crossfade the seam for free (the xMix pattern).
  const _w = a.wind || b.wind; env.windX = _w ? _w.x : 0; env.windZ = _w ? _w.z : 0;
  env.rainMix = lerp(a.rain || 0, b.rain || 0, ts);
  // EYE-BREACH (Tempest): the eye-of-the-gale gate. 0 elsewhere = byte-identical; crossfades the
  // seam for free (the xMix pattern). Consumed by environment.js + skyProbe.js.
  env.breachMix = lerp(a.breach || 0, b.breach || 0, ts);
  return env;
}
