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

const C = (hex) => new THREE.Color(hex);

export const BIOMES = [
  {
    // Hero biome: golden-hour water flight through verdigris ruins
    // (the Panzer Dragoon look).
    name: 'SUNKEN SANCTUARY',
    keyShift: 0,
    stars: 0,
    sky: { top: C(0x3f7ec8), mid: C(0xe0a070), horizon: C(0xffe2a8), sun: C(0xfff0c8) },
    fog: { color: C(0xf2c694), near: 85, far: 430 },
    light: { sun: C(0xffe0b0), sunI: 1.8, hemiSky: C(0xbfdcff), hemiGround: C(0x2e5448) },
    water: { deep: C(0x0c4a66), shallow: C(0x2fa39a), waveAmp: 1.0 },
    ambient: { color: C(0xc8ec96), fall: 1.2, sway: 2.6, size: 0.34, opacity: 0.8 },
    fauna: { color: C(0x2a2438), scale: 1.0, flap: 1.0 },
    props: ['tower', 'column', 'archruin', 'slab', 'dome'],
    matIndex: 0, // verdigris stone
  },
  {
    // Desert ruins drowned in amber haze.
    name: 'AMBER WASTES',
    keyShift: 2,
    stars: 0,
    sky: { top: C(0x8a5a72), mid: C(0xe09a62), horizon: C(0xffcf96), sun: C(0xffd9a0) },
    fog: { color: C(0xeaaf80), near: 60, far: 330 },
    light: { sun: C(0xffc88a), sunI: 1.7, hemiSky: C(0xe8c8a8), hemiGround: C(0x6a4a30) },
    water: { deep: C(0x3a3214), shallow: C(0x9a7a3a), waveAmp: 0.7 },
    ambient: { color: C(0xffd9a0), fall: 0.4, sway: 1.6, size: 0.3, opacity: 0.6 },
    fauna: { color: C(0x3a2418), scale: 1.15, flap: 0.8 },
    props: ['obelisk', 'column', 'slab', 'dome'],
    matIndex: 1, // sandstone
  },
  {
    // The original neon-ice canyon, now over glassy melt-water.
    name: 'FROZEN REACH',
    keyShift: -3,
    stars: 0,
    sky: { top: C(0x1c2e5e), mid: C(0x9a5a8e), horizon: C(0xff9a55), sun: C(0xffd9b0) },
    fog: { color: C(0xd99a7a), near: 70, far: 380 },
    light: { sun: C(0xffb070), sunI: 1.6, hemiSky: C(0x9ab8ff), hemiGround: C(0x32435e) },
    water: { deep: C(0x122a4a), shallow: C(0x3a6a9a), waveAmp: 0.3 },
    ambient: { color: C(0xffffff), fall: 3.5, sway: 0.6, size: 0.4, opacity: 0.75 },
    fauna: { color: C(0xdce8f4), scale: 0.9, flap: 1.1 },
    props: ['crystal', 'crystalSmall'],
    matIndex: 2, // ice
  },
  {
    // Black basalt spires over a sea of cooling magma; embers RISE through
    // the air and ash-wyverns wheel against the glow.
    name: 'EMBERFALL CALDERA',
    keyShift: -2,
    stars: 0,
    sky: { top: C(0x261016), mid: C(0x7a2a1a), horizon: C(0xff7a30), sun: C(0xffb060) },
    fog: { color: C(0x57221a), near: 65, far: 340 },
    light: { sun: C(0xff9a50), sunI: 1.6, hemiSky: C(0x8a5040), hemiGround: C(0x301010) },
    water: { deep: C(0x2a0a08), shallow: C(0xc84818), waveAmp: 0.55 },
    ambient: { color: C(0xff9a40), fall: -2.2, sway: 1.4, size: 0.36, opacity: 0.9 },
    fauna: { color: C(0x4a1410), scale: 1.25, flap: 0.9 },
    props: ['basalt', 'vent'],
    matIndex: 3, // basalt + ember veins
  },
  {
    // Bioluminescent night marsh: colossal glowcap mushrooms, drifting
    // spores, fireflies — everything lit from within.
    name: 'LUMEN MIRE',
    keyShift: -4,
    stars: 0.6,
    sky: { top: C(0x0c1430), mid: C(0x1d2a55), horizon: C(0x3fd8b0), sun: C(0x9fffe0) },
    fog: { color: C(0x123a3a), near: 55, far: 300 },
    light: { sun: C(0x70e8c0), sunI: 1.15, hemiSky: C(0x2a5a6a), hemiGround: C(0x0c2a1a) },
    water: { deep: C(0x041820), shallow: C(0x0f6a5a), waveAmp: 0.6 },
    ambient: { color: C(0xaaffc0), fall: 0.15, sway: 3.4, size: 0.42, opacity: 0.9 },
    fauna: { color: C(0x6affd8), scale: 0.7, flap: 1.5 },
    props: ['glowcap', 'glowcapSmall', 'spirevine'],
    matIndex: 4, // mossy biolume
  },
  {
    // Star-flooded night sea beneath a violet aurora; crystal monoliths
    // hum on the banks and a sky whale drifts the far horizon.
    name: 'ASTRAL SHALLOWS',
    keyShift: 3,
    stars: 1,
    whale: 1,
    sky: { top: C(0x05081e), mid: C(0x1a1450), horizon: C(0x6a3ab0), sun: C(0xcfe8ff) },
    fog: { color: C(0x241a4a), near: 80, far: 420 },
    light: { sun: C(0xbfd8ff), sunI: 1.3, hemiSky: C(0x4a4a8a), hemiGround: C(0x101030) },
    water: { deep: C(0x060a24), shallow: C(0x2a3a8a), waveAmp: 0.4 },
    ambient: { color: C(0xcfe0ff), fall: 0.1, sway: 0.8, size: 0.3, opacity: 0.9 },
    fauna: { color: C(0xb8c8f0), scale: 0.95, flap: 0.7 },
    props: ['monolith', 'arcshard'],
    matIndex: 5, // astral slate
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
  lightSun: new THREE.Color(), lightSunI: 1.6,
  hemiSky: new THREE.Color(), hemiGround: new THREE.Color(),
  waterDeep: new THREE.Color(), waterShallow: new THREE.Color(), waveAmp: 1,
  ambColor: new THREE.Color(), ambFall: 1, ambSway: 1, ambSize: 0.4, ambOpacity: 0.75,
  faunaColor: new THREE.Color(), faunaScale: 1, faunaFlap: 1,
  starMix: 0, whaleMix: 0,
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
  return env;
}
