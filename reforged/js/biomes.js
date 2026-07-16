import * as THREE from 'three';
import { CONFIG } from './config.js';

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

// Canonical sun direction — a low sun ahead of the player. Shared by the sky
// shader, the water shader and the god-ray pass so the light shafts streak from
// exactly where the visible sun disc sits. (Previously duplicated as a literal
// in water.js + environment.js.)
export const SUN_DIR = new THREE.Vector3(-0.22, 0.1, -1).normalize();

export const BIOMES = [
  {
    // Dusk sanctuary: deep teal-indigo sky, warm gold compressed to a narrow
    // horizon band — gameplay elements (rings/orbs/gates/dragon) pop against
    // the cool ground. Biome 1 becomes the designated bright world.
    // Light-dark rhythm across the 6-biome cycle: dusk→blaze→cold→inferno→night→cosmos.
    name: 'SUNKEN SANCTUARY',
    keyShift: 0,
    stars: 0.15,
    sky: { top: C(0x0d1f3c), mid: C(0x1e4060), horizon: C(0xe8a040), sun: C(0xffd080),
      // N9 clouds: warm dusk cumulus — sunlit tops, cool blue-grey undersides.
      cloud: { amount: 0.85, lit: C(0xffe4b8), shadow: C(0x1e2c46) } },
    fog: { color: C(0x1a3050), near: 75, far: 400 },
    light: { sun: C(0xff9a40), sunI: 1.5, hemiSky: C(0x7ab0d8), hemiGround: C(0x1a3828) },
    water: { deep: C(0x061828), shallow: C(0x1a5a6a), waveAmp: 1.0 },
    ambient: { color: C(0xc8ec96), fall: 1.2, sway: 2.6, size: 0.34, opacity: 0.75 },
    fauna: { color: C(0xd0c8e8), scale: 1.0, flap: 1.0 },
    faunaFlyby: true, // foreground gull flyby pass visible over the lane
    props: ['tower', 'column', 'archruin', 'slab', 'dome'],
    matIndex: 0, // verdigris stone
    // Contrast gate: the dark/deep band (L≈0.16) reads too close to this
    // biome's dark teal fog (L≈0.18) — lifted toward a lighter deep-rose.
    bullets: { dark: 0xaf4f73 },
  },
  {
    // Amber Wastes: high-noon desert — the designated bright world in the cycle,
    // contrasting with the surrounding dusk/cold biomes.
    name: 'AMBER WASTES',
    keyShift: 2,
    stars: 0,
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
    props: ['colonnata', 'flowlobe', 'clinker'],
    matIndex: 3, // basalt + ember veins
    // Contrast gate: dark band vs this biome's near-black fog (L≈0.18) — lifted.
    bullets: { dark: 0xa84167 },
  },
  {
    // Night garden — slow-bobbing translucent glow-jellies (additive blend)
    name: 'LUMEN MIRE',
    keyShift: -4,
    stars: 0.6,
    sky: { top: C(0x0c1430), mid: C(0x1d2a55), horizon: C(0x3fd8b0), sun: C(0x9fffe0) },
    fog: { color: C(0x123a3a), near: 55, far: 300 },
    light: { sun: C(0x70e8c0), sunI: 1.15, hemiSky: C(0x2a5a6a), hemiGround: C(0x0c2a1a) },
    water: { deep: C(0x041820), shallow: C(0x0f6a5a), waveAmp: 0.6 },
    ambient: { color: C(0xaaffc0), fall: 0.15, sway: 3.4, size: 0.42, opacity: 0.9 },
    fauna: { color: C(0x80ffc8), scale: 1.1, flap: 0.3 }, // glow-jellies: large, slow bob
    props: ['glowcap', 'glowcapSmall', 'spirevine'],
    matIndex: 4, // mossy biolume
    // Contrast gate: dark band vs this biome's near-black fog (L≈0.19) — lifted.
    bullets: { dark: 0xaf4f73 },
  },
  {
    // Cosmos — star-koi shoal + existing whale; star-koi share whale drift pattern
    name: 'ASTRAL SHALLOWS',
    keyShift: 3,
    stars: 1,
    whale: 1,
    sky: { top: C(0x05081e), mid: C(0x1a1450), horizon: C(0x6a3ab0), sun: C(0xcfe8ff) },
    fog: { color: C(0x241a4a), near: 80, far: 420 },
    light: { sun: C(0xbfd8ff), sunI: 1.3, hemiSky: C(0x4a4a8a), hemiGround: C(0x101030) },
    water: { deep: C(0x060a24), shallow: C(0x2a3a8a), waveAmp: 0.4 },
    ambient: { color: C(0xcfe0ff), fall: 0.1, sway: 0.8, size: 0.3, opacity: 0.9 },
    fauna: { color: C(0xa8d8ff), scale: 0.7, flap: 0.5 }, // star-koi: small, gentle drift
    props: ['monolith', 'arcshard'],
    matIndex: 5, // astral slate
    // Contrast gate: dark band vs this biome's near-black fog (L≈0.12) — lifted.
    bullets: { dark: 0xa84167 },
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
];

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
  // Aurora Shallows (BIOME plan): 0 in every current biome (optional-channel
  // pattern) → the aurora sky-splice is a byte-identical no-op until a biome
  // declares `aurora`. Consumed by auroraSky.js via applyAurora(env).
  auroraMix: 0,
  // N8 atmosphere channels (OPTIONAL per biome; 0 everywhere by default so the
  // fog is byte-identical). heightK = thin fog with altitude; inscatter = sunward
  // brightening. Consumed by atmosphere.js via applyAtmosphere(env).
  atmosHeightK: 0, atmosInscatter: 0,
  // N9 sky clouds (OPTIONAL per biome; amount 0 = no clouds → shipped gradient).
  // Consumed by skyClouds.js via applySkyClouds(env).
  cloudAmount: 0, cloudLit: new THREE.Color(), cloudShadow: new THREE.Color(),
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
  // whaleMix now rides the SAME 400m window the curtain dies in → the "curtain hands off to the whale"
  // handoff PR-4 described finally happens in one window (was 150m while the curtain took 300m).
  env.whaleMix = lerp(a.whale || 0, b.whale || 0, ts);
  env.flybyMix = lerp(a.faunaFlyby ? 1 : 0, b.faunaFlyby ? 1 : 0, ts);
  // N8 atmosphere (optional-channel pattern): 0 unless the biome declares atmos.
  env.atmosHeightK = lerp(a.atmos?.heightK || 0, b.atmos?.heightK || 0, ts);
  env.atmosInscatter = lerp(a.atmos?.inscatter || 0, b.atmos?.inscatter || 0, ts);
  // N9 sky clouds (optional-channel): amount gates them out (0 = shipped); colours
  // fall back to the biome's sky mid/top so a cloudy↔clear seam lerps sane hues.
  env.cloudAmount = lerp(a.sky.cloud?.amount || 0, b.sky.cloud?.amount || 0, ts);
  env.cloudLit.lerpColors(a.sky.cloud?.lit ?? a.sky.top, b.sky.cloud?.lit ?? b.sky.top, ts);
  env.cloudShadow.lerpColors(a.sky.cloud?.shadow ?? a.sky.mid, b.sky.cloud?.shadow ?? b.sky.mid, ts);
  return env;
}
