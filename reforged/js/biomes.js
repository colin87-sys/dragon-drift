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
      cloud: { amount: 0.55, lit: C(0xffdca8), shadow: C(0x24344f) } },
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
      cloud: { amount: 0.6, lit: C(0xfff2da), shadow: C(0xc79a68) } },
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
    sky: { top: C(0x1c2e5e), mid: C(0x9a5a8e), horizon: C(0xff9a55), sun: C(0xffd9b0) },
    fog: { color: C(0xd99a7a), near: 70, far: 380 },
    light: { sun: C(0xffb070), sunI: 1.6, hemiSky: C(0x9ab8ff), hemiGround: C(0x32435e) },
    water: { deep: C(0x122a4a), shallow: C(0x3a6a9a), waveAmp: 0.3 },
    ambient: { color: C(0xffffff), fall: 3.5, sway: 0.6, size: 0.4, opacity: 0.75 },
    fauna: { color: C(0xe8f4ff), scale: 0.85, flap: 1.3 }, // petrel pair: tight, fast flap
    // N8 atmosphere: the low cold sun sits right on the horizon — strong sunward
    // inscatter so the haze glows toward it (OPTIONAL; 0 on every other biome).
    atmos: { inscatter: 0.7 },
    props: ['crystal', 'crystalSmall'],
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
    props: ['basalt', 'vent'],
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
];

export function biomeAt(dist) {
  const L = CONFIG.biomeLength;
  const block = Math.max(0, Math.floor(dist / L));
  const ia = block % BIOMES.length;
  const ib = (ia + 1) % BIOMES.length;
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
  // N8 atmosphere channels (OPTIONAL per biome; 0 everywhere by default so the
  // fog is byte-identical). heightK = thin fog with altitude; inscatter = sunward
  // brightening. Consumed by atmosphere.js via applyAtmosphere(env).
  atmosHeightK: 0, atmosInscatter: 0,
  // N9 sky clouds (OPTIONAL per biome; amount 0 = no clouds → shipped gradient).
  // Consumed by skyClouds.js via applySkyClouds(env).
  cloudAmount: 0, cloudLit: new THREE.Color(), cloudShadow: new THREE.Color(),
};

const lerp = THREE.MathUtils.lerp;

export function computeEnv(dist) {
  const { ia, ib, t } = biomeAt(dist);
  const a = BIOMES[ia];
  const b = BIOMES[ib];
  env.skyTop.lerpColors(a.sky.top, b.sky.top, t);
  env.skyMid.lerpColors(a.sky.mid, b.sky.mid, t);
  env.skyHorizon.lerpColors(a.sky.horizon, b.sky.horizon, t);
  env.sunGlow.lerpColors(a.sky.sun, b.sky.sun, t);
  env.fogColor.lerpColors(a.fog.color, b.fog.color, t);
  env.fogNear = lerp(a.fog.near, b.fog.near, t);
  env.fogFar = lerp(a.fog.far, b.fog.far, t);
  env.fogFarColor.lerpColors(a.fogFarColor ?? a.fog.color, b.fogFarColor ?? b.fog.color, t);
  env.fogFarMix = lerp(a.fogFarColor ? 1 : 0, b.fogFarColor ? 1 : 0, t);
  env.lightSun.lerpColors(a.light.sun, b.light.sun, t);
  env.lightSunI = lerp(a.light.sunI, b.light.sunI, t);
  env.hemiSky.lerpColors(a.light.hemiSky, b.light.hemiSky, t);
  env.hemiGround.lerpColors(a.light.hemiGround, b.light.hemiGround, t);
  env.waterDeep.lerpColors(a.water.deep, b.water.deep, t);
  env.waterShallow.lerpColors(a.water.shallow, b.water.shallow, t);
  env.waveAmp = lerp(a.water.waveAmp, b.water.waveAmp, t);
  env.ambColor.lerpColors(a.ambient.color, b.ambient.color, t);
  env.ambFall = lerp(a.ambient.fall, b.ambient.fall, t);
  env.ambSway = lerp(a.ambient.sway, b.ambient.sway, t);
  env.ambSize = lerp(a.ambient.size, b.ambient.size, t);
  env.ambOpacity = lerp(a.ambient.opacity, b.ambient.opacity, t);
  env.faunaColor.lerpColors(a.fauna.color, b.fauna.color, t);
  env.faunaScale = lerp(a.fauna.scale, b.fauna.scale, t);
  env.faunaFlap = lerp(a.fauna.flap, b.fauna.flap, t);
  env.starMix = lerp(a.stars || 0, b.stars || 0, t);
  env.whaleMix = lerp(a.whale || 0, b.whale || 0, t);
  env.flybyMix = lerp(a.faunaFlyby ? 1 : 0, b.faunaFlyby ? 1 : 0, t);
  // N8 atmosphere (optional-channel pattern): 0 unless the biome declares atmos.
  env.atmosHeightK = lerp(a.atmos?.heightK || 0, b.atmos?.heightK || 0, t);
  env.atmosInscatter = lerp(a.atmos?.inscatter || 0, b.atmos?.inscatter || 0, t);
  // N9 sky clouds (optional-channel): amount gates them out (0 = shipped); colours
  // fall back to the biome's sky mid/top so a cloudy↔clear seam lerps sane hues.
  env.cloudAmount = lerp(a.sky.cloud?.amount || 0, b.sky.cloud?.amount || 0, t);
  env.cloudLit.lerpColors(a.sky.cloud?.lit ?? a.sky.top, b.sky.cloud?.lit ?? b.sky.top, t);
  env.cloudShadow.lerpColors(a.sky.cloud?.shadow ?? a.sky.mid, b.sky.cloud?.shadow ?? b.sky.mid, t);
  return env;
}
