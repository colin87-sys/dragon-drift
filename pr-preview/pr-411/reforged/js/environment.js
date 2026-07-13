import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { CONFIG } from './config.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { biomeIndexAt, computeEnv } from './biomes.js';
import { applyArenaSkin } from './arenaSkin.js';
import { setWaterTint } from './water.js';
import { createAmbient, updateAmbient } from './ambient.js';
import { damp } from './util.js';
import { initSkyProbe, updateSkyProbe, setSkyProbeEnabled, skyProbeEnabled } from './skyProbe.js';
import { bakeAO, aoUniform, setPropAO } from './propAO.js';
import { installAtmosphere, assignAtmos, applyAtmosphere, setAtmosphereEnabled, setAtmosphereQuality, atmosphereEnabled } from './atmosphere.js';
import { CLOUD_HEAD, CLOUD_BODY, cloudUniforms, applySkyClouds, sunCloudCover, setSkyCloudsEnabled, setSkyCloudQuality, skyCloudsEnabled } from './skyClouds.js';
import { AURORA_HEAD, AURORA_BODY, auroraUniforms, applyAurora, setAuroraEnabled, setAuroraForced, setAuroraQuality, auroraEnabled, auroraForced, auroraMix, setAuroraActOverride } from './auroraSky.js';
import { createArenaSet, updateArenaSet, resetArenaSet, setArenaSetQuality, debugArenaSet, setStarMode } from './arenaSet.js';
import { getWaterSwellOn } from './water.js';
import { makeFoamMesh, writeFoamMatrix, foamVisible, updateFoam, setWaterFoam as _setWaterFoam, setWaterFoamQuality as _setWaterFoamQuality } from './propFoam.js';

// Re-export the sky-IBL + prop-AO + atmosphere + sky-cloud controls so main.js
// drives them through environment.
export { setSkyProbeEnabled, skyProbeEnabled, setPropAO, setAtmosphereEnabled, setAtmosphereQuality, atmosphereEnabled, setSkyCloudsEnabled, setSkyCloudQuality, skyCloudsEnabled };
// Aurora Shallows: the sky-splice controls ride through environment too.
export { setAuroraEnabled, setAuroraForced, setAuroraQuality, auroraEnabled, auroraForced, auroraMix, setAuroraActOverride };
// ARENA (PR-K): the FIRSTBORN SKY's Godhead Star — tier switch + test seam + the owner A/B mode ride through here too.
export { setArenaSetQuality, debugArenaSet, setStarMode };

// N10c foam toggle/LOD: wrap the raw setters so a Settings flip / tier change
// re-evaluates every band's foam visibility THIS frame (updateBandVisibility
// otherwise only re-runs on a recycle, so the toggle would lag until a prop cycles).
function refreshFoamVisibility() { for (const b of bands) updateBandVisibility(b); }
export function setWaterFoam(on) { _setWaterFoam(on); refreshFoamVisibility(); }
export function setWaterFoamQuality(t) { _setWaterFoamQuality(t); refreshFoamVisibility(); }

// N8: the fog-chunk override MUST run before any material compiles. Installing at
// module load (before createEnvironment builds the prop materials) guarantees it;
// idempotent, so main.js's explicit boot call is a harmless belt-and-braces.
installAtmosphere();

// Sky dome, lighting, and the prop bands lining the course. Endless: prop
// instances are recycled — anything behind the player leapfrogs ahead with
// fresh jitter. Each archetype (tower, column, obelisk, crystal...) is one
// InstancedMesh; instances outside their home biome park at zero scale, so
// biomes drain in/out naturally as the window advances over the seams.
let sky = null;
let sun = null;
let hemi = null;
let feverWarmMix = 0, feverWarmTarget = 0;   // eased fiery-vs-magenta Surge palette (set by the equipped dragon)
export function setFeverWarm(on) { feverWarmTarget = on ? 1 : 0; }
let sceneRef = null;
let rnd = null;
let bands = [];
let feverMix = 0;
let bossMix = 0; // eased boss-grade signal (see updateEnvironment), local copy — same pattern as feverMix
let skyDim = 0;  // EMBERTIDE sky-replacement: 0 = the real dome; 1 = fully faded out (EMBERTIDE IS the sky)
// ARENA (PR-A): while THE UNMASKED's void owns the sky, the biome PROP bands (monoliths etc.) must go
// dark — they bypass `env` (static emissive materials recycled every frame), so without this gate the
// void ships with fully-lit biome props marching through it (audit F1). Value-space visibility only,
// self-healed on teardown by the stateless bossArenaMix source (arenaMix → 0 → this flips back next frame).
let arenaPropsGate = false;
export function debugArenaProps() { return arenaPropsGate; }
export function debugSkyDim() { return skyDim; }   // proves the EMBERTIDE sky channel stayed 0 under the arena (disjointness)
let cloudSunCover = 0; // N9: damped cloud coverage over the sun → eases god-ray intensity
// N9: main.js reads this each frame to fade god-ray shafts as clouds cross the sun.
export function getCloudSunCover() { return cloudSunCover; }
// setSkyFade(k): the sky-replacement crossfade hook ("one sky, never two"). boss.js ramps this to 1 while
// a `def.skyReplace` boss (EMBERTIDE) owns the sky, back to 0 otherwise. Dims the dome shader toward black
// and hides the mesh entirely at k≈1 (draw replaced, not stacked → overdraw flat). Inert (0) otherwise.
export function setSkyFade(k) { skyDim = Math.max(0, Math.min(1, k)); }

const WALL_WINDOW = 900; // prop band: 100 behind the player to 800 ahead

// Subtle procedural surface detail for the prop materials: a world-space value
// noise that breaks up the flat emissive/diffuse so the big stone/crystal/basalt
// silhouettes read as weathered rather than plastic — without a single texture.
// Injected via onBeforeCompile (works with the InstancedMesh bands; instanceMatrix
// is applied in <project_vertex>, so world position is derived right after it).
const PROP_NOISE_HEAD = /* glsl */`
  varying vec3 vPropWPos;
  uniform float uAO; varying float vAO;
  float _hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  float _vnoise(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
    float n000=_hash13(i), n100=_hash13(i+vec3(1,0,0)), n010=_hash13(i+vec3(0,1,0)), n110=_hash13(i+vec3(1,1,0));
    float n001=_hash13(i+vec3(0,0,1)), n101=_hash13(i+vec3(1,0,1)), n011=_hash13(i+vec3(0,1,1)), n111=_hash13(i+vec3(1,1,1));
    return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
               mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
  }
  void main() {`;

function addPropDetail(mat) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uAO = aoUniform; // N15 shared AO gate (0 = shipped)
    assignAtmos(shader);             // N8 shared atmosphere uniforms (0 = shipped fog)
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying vec3 vPropWPos;\nattribute float aoBake;\nvarying float vAO;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vAO = aoBake;
        #ifdef USE_INSTANCING
          vPropWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vPropWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', PROP_NOISE_HEAD)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float _pn = _vnoise(vPropWPos * 0.5) * 0.6 + _vnoise(vPropWPos * 1.7) * 0.4;
        // Weathering noise × baked AO, FLOORED. Both are multiplicative darkeners; on a
        // hemi-only-lit face (Frozen Reach ice-cone undersides get no sun + only the dark
        // ground term) a dark noise cell (0.86) times the AO floor (0.58) crushes to ~0.50
        // → near-black SPOTS (owner report). The floor caps the combined darkening so the
        // dark/bright cell contrast collapses in that zone (spots dissolve) while sunlit
        // faces keep the full weathered look. Identity-off is exact: at uAO=0 the AO term
        // is 1.0 and 0.86+0.26*_pn ≥ 0.86 > 0.62, so the floor never engages.
        diffuseColor.rgb *= max((0.86 + 0.26 * _pn) * mix(1.0, vAO, uAO), 0.62);   // N15 AO + weathering (floored)`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance *= 0.78 + 0.44 * _pn;`);
  };
  // Own cache bucket so these never share a program with plain standard mats.
  mat.customProgramCacheKey = () => 'propDetail';
  return mat;
}

// --- Shared prop materials (index = biome matIndex) -------------------------
function makeMats() {
  const opts = { flatShading: true, roughness: 0.7, metalness: 0.05 };
  const mats = {
    // [primary, accent] per biome
    primary: [
      new THREE.MeshStandardMaterial({ ...opts, color: 0x86b39c, emissive: 0x0e2018, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xe2bd8a, emissive: 0x2a1a08, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0x6fb7e8, roughness: 0.32, metalness: 0.1, emissive: 0x123a55, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0x352629, emissive: 0x4a1208, emissiveIntensity: 0.3 }),   // basalt w/ inner heat
      new THREE.MeshStandardMaterial({ ...opts, color: 0x1d4438, emissive: 0x0a3328, emissiveIntensity: 0.4 }),   // night moss
      new THREE.MeshStandardMaterial({ ...opts, color: 0x3a3a6a, emissive: 0x16164a, emissiveIntensity: 0.4 }),   // astral slate
    ],
    accent: [
      new THREE.MeshStandardMaterial({ ...opts, color: 0xc08a50, roughness: 0.5, metalness: 0.25, emissive: 0x2a1505, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xb56a40, emissive: 0x251005, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0x9fd8f0, roughness: 0.3, emissive: 0x1c4a66, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xff5a20, roughness: 0.4, emissive: 0xff3a08, emissiveIntensity: 0.9 }),  // magma seams
      new THREE.MeshStandardMaterial({ ...opts, color: 0x4dffd0, roughness: 0.35, emissive: 0x18d0a0, emissiveIntensity: 1.0 }), // biolume caps
      new THREE.MeshStandardMaterial({ ...opts, color: 0x9fb8ff, roughness: 0.3, emissive: 0x5a78ff, emissiveIntensity: 1.1 }),  // starlit crystal
    ],
  };
  for (const m of mats.primary) addPropDetail(m);
  for (const m of mats.accent) addPropDetail(m);
  return mats;
}
let propMats = null;

// --- Archetype geometry builders --------------------------------------------
// All normalized: base at y=0, top ≈ y=1, footprint within ~±0.6.
// Instance scale = (r, h, r). mat 0 = primary stone, 1 = accent (metal/trim).
function xform(geo, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  geo.scale(sx, sy, sz);
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  geo.translate(x, y, z);
  return geo;
}

function mergeParts(parts, biomeIdx) {
  const groups = [[], []];
  for (const p of parts) groups[p.mat].push(p.geo);
  const geos = [];
  const mats = [];
  for (let m = 0; m < 2; m++) {
    if (!groups[m].length) continue;
    geos.push(groups[m].length > 1 ? mergeGeometries(groups[m]) : groups[m][0]);
    mats.push(m === 0 ? propMats.primary[biomeIdx] : propMats.accent[biomeIdx]);
  }
  const geometry = mergeGeometries(geos, true);
  bakeAO(geometry); // N15: per-vertex AO attribute (gated by uAO at render)
  return { geometry, materials: mats };
}

const ARCHETYPES = {
  // Sanctuary: verdigris watchtower with a weathered bronze dome.
  tower: {
    step: 42, biomes: [0], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.40, 0.56, 0.74, 8), { y: 0.37 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 8), { y: 0.76 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.46, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.79, sy: 0.6 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.05, 0.2, 5), { y: 1.1 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (17 + rnd() * 9), h: 13 + rnd() * 15, r: 2.4 + rnd() * 1.6, tilt: side * rnd() * 0.05 }),
  },
  // Broken classical column (Sanctuary + Wastes).
  column: {
    step: 20, biomes: [0, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.9, 0.14, 0.9), { y: 0.07 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.27, 0.34, 0.76, 7), { y: 0.52 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.32, 0.27, 0.1, 7), { y: 0.94, rz: 0.12 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 6), h: 4 + rnd() * 6, r: 2 + rnd() * 1.6, tilt: side * (rnd() * 0.14 - 0.04) }),
  },
  // Free-standing ruined arch fragment rising from the water.
  archruin: {
    step: 75, biomes: [0], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.09, 0.13, 0.58, 6), { x: -0.35, y: 0.29 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.09, 0.13, 0.58, 6), { x: 0.35, y: 0.29 }) },
      { mat: 0, geo: xform(new THREE.TorusGeometry(0.35, 0.09, 6, 10, Math.PI), { y: 0.56 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.14, 0.1, 0.16), { y: 0.94 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (19 + rnd() * 8), h: 9 + rnd() * 7, r: 8 + rnd() * 5, tilt: side * rnd() * 0.08 }),
  },
  // Ruined wall slab with a broken crown.
  slab: {
    step: 26, biomes: [0, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.8, 0.95, 0.18), { y: 0.47 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.42, 0.28, 0.2), { x: 0.22, y: 0.98, rz: 0.28 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.86, 0.07, 0.22), { y: 0.66 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (16 + rnd() * 6), h: 4 + rnd() * 5, r: 3 + rnd() * 3, tilt: side * (rnd() * 0.2 - 0.06) }),
  },
  // Wastes: weathered four-sided obelisk.
  obelisk: {
    step: 32, biomes: [1], matIndex: 1,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.16, 0.34, 0.86, 4), { y: 0.43 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.18, 0.16, 4), { y: 0.94 }) },
    ], 1),
    place: (side, rnd) => ({ x: side * (16 + rnd() * 9), h: 9 + rnd() * 13, r: 2.4 + rnd() * 1.6, tilt: side * (rnd() * 0.08 - 0.02) }),
  },
  // Great sunken dome on the skyline (Sanctuary + Wastes).
  dome: {
    step: 85, biomes: [0, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { sx: 0.5, sz: 0.5 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 6), { y: 1.04 }) },
    ], 0),
    place: (side, rnd) => {
      const r = 14 + rnd() * 9;
      return { x: side * (17 + r * 0.5 + rnd() * 14), h: 4.5 + rnd() * 3.5, r, tilt: 0 };
    },
  },
  // Frozen Reach: the original big crystal spires.
  crystal: {
    step: 13, biomes: [2], matIndex: 2,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(1, 1, 5), { y: 0.42, sy: 1 }) },
    ], 2),
    place: (side, rnd) => ({ x: side * (17 + rnd() * 8), h: 18 + rnd() * 32, r: 3.5 + rnd() * 5, tilt: side * (0.06 + rnd() * 0.1) }),
  },
  crystalSmall: {
    step: 30, biomes: [2], matIndex: 2,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.ConeGeometry(1, 1, 5), { y: 0.42 }) },
    ], 2),
    place: (side, rnd) => {
      const h = 2 + rnd() * 5;
      return { x: side * (13.5 + rnd() * 3), h, r: h * 0.35, tilt: side * rnd() * 0.3 };
    },
  },
  // Emberfall Caldera: jagged basalt spire split by a glowing magma seam.
  basalt: {
    step: 18, biomes: [3], matIndex: 3,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.3, 0.52, 0.95, 5), { y: 0.48 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.17, 0.3, 0.55, 5), { x: 0.24, y: 0.6, rz: 0.2 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.45, 0.5, 0.07, 5), { y: 0.14 }) },
    ], 3),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 9), h: 11 + rnd() * 19, r: 2.2 + rnd() * 1.8, tilt: side * (rnd() * 0.12 - 0.03) }),
  },
  // Squat fumarole cone with a glowing throat.
  vent: {
    step: 42, biomes: [3], matIndex: 3,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.6, 0.85, 6), { y: 0.42 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.16, 0.24, 0.12, 6), { y: 0.86 }) },
    ], 3),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 6), h: 3 + rnd() * 3.5, r: 3 + rnd() * 2, tilt: 0 }),
  },
  // Lumen Mire: colossal bioluminescent mushroom, cap lit from within.
  glowcap: {
    step: 26, biomes: [4], matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.13, 0.22, 0.78, 7), { y: 0.39 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.52, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.76, sy: 0.55 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 8), h: 8 + rnd() * 11, r: 2.5 + rnd() * 2.5, tilt: side * (rnd() * 0.1 - 0.03) }),
  },
  glowcapSmall: {
    step: 14, biomes: [4], matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.1, 0.16, 0.6, 6), { y: 0.3 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.36, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.58, sy: 0.5 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.07, 0.12, 0.42, 6), { x: 0.3, y: 0.21, rz: -0.16 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), { x: 0.34, y: 0.4, sy: 0.5 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (13.5 + rnd() * 3.5), h: 2 + rnd() * 3.5, r: 1.6 + rnd() * 1.4, tilt: side * rnd() * 0.2 }),
  },
  // Twisting vine spire with a glowing seed-pod tip.
  spirevine: {
    step: 34, biomes: [4], matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.16, 0.6, 5), { y: 0.3, rz: 0.12 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.11, 0.5, 5), { x: 0.06, y: 0.72, rz: -0.18 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.09, 6, 5), { x: 0.02, y: 1.0 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 5), h: 7 + rnd() * 9, r: 2 + rnd() * 1.5, tilt: side * (rnd() * 0.25 - 0.05) }),
  },
  // Astral Shallows: slate monolith wearing a band of starlit crystal.
  monolith: {
    step: 30, biomes: [5], matIndex: 5,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.42, 0.96, 0.26), { y: 0.48 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.5, 0.07, 0.34), { y: 0.62 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.13, 0.22, 4), { y: 1.07 }) },
    ], 5),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 9), h: 12 + rnd() * 18, r: 2.6 + rnd() * 1.8, tilt: side * (rnd() * 0.06 - 0.02) }),
  },
  // Leaning crystal blade catching the aurora.
  arcshard: {
    step: 22, biomes: [5], matIndex: 5,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.8, 1, 4), { y: 0.42, sx: 0.55 }) },
    ], 5),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 6), h: 5 + rnd() * 9, r: 1.8 + rnd() * 2, tilt: side * (0.12 + rnd() * 0.22) }),
  },
};

// N10c foam-collar config per archetype: `r` = ring radius as a multiple of the
// prop's `d.r` (≈ the base geometry's XZ footprint radius + a small margin, so the
// ring hugs where the prop meets the water). Thin/non-circular footprints — the
// archruin's two legs, the slab's wall — get an ELLIPTICAL collar ({ rx, rz }) that
// wraps the footprint instead of a round ring that would float on open water.
const FOAM_CFG = {
  tower: { r: 0.7 }, column: { r: 0.6 }, archruin: { rx: 0.52, rz: 0.18 }, slab: { rx: 0.48, rz: 0.16 },
  obelisk: { r: 0.44 }, dome: { r: 0.58 }, crystal: { r: 1.1 }, crystalSmall: { r: 1.1 },
  basalt: { r: 0.62 }, vent: { r: 0.72 }, glowcap: { r: 0.34 }, glowcapSmall: { r: 0.28 },
  spirevine: { r: 0.26 }, monolith: { r: 0.4 }, arcshard: { r: 0.55 },
};
for (const [name, cfg] of Object.entries(FOAM_CFG)) if (ARCHETYPES[name]) ARCHETYPES[name].foam = cfg;

export function createEnvironment(scene, seed = CONFIG.seed) {
  sceneRef = scene;
  rnd = mulberry32(seed + 99);
  propMats = makeMats();
  scene.fog = new THREE.Fog(0xf2c694, 85, 430);

  // --- Sky dome: biome-lerped gradient with a low sun ahead of the player.
  // ⚠ This gradient is ported to JS in skyProbe.js `skyColorAt` (the N5 sky-IBL
  // probe samples it for ambient light). If you change the band math / sun glow
  // below, update skyColorAt AND tests/skyprobe.mjs together or the ambient drifts.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x3f7ec8) },
      midColor: { value: new THREE.Color(0xe0a070) },
      horizonColor: { value: new THREE.Color(0xffe2a8) },
      sunGlow: { value: new THREE.Color(0xfff0c8) },
      sunDir: { value: new THREE.Vector3(-0.22, 0.1, -1).normalize() },
      feverMix: { value: 0 },
      feverWarm: { value: 0 },   // 0 = magenta Surge palette; 1 = FIERY (fire dragons) → the rebirth sky/aurora go warm ember instead of magenta
      dimMix: { value: 0 },
      starMix: { value: 0 },
      // Dual-fog (BIOME-DESIGN.md §5.2): the far-field fog COLOR + its 0→1
      // gate. fogFarMix is 0 wherever no biome declares fogFarColor, so the
      // blend below is a branchless no-op there (the starMix pattern).
      fogFarColor: { value: new THREE.Color(0x57221a) },
      fogFarMix: { value: 0 },
      time: { value: 0 },
      ...cloudUniforms, // N9: shared sky-cloud uniforms (uCloudAmount 0 = shipped)
      ...auroraUniforms, // Aurora Shallows: uAuroraMix 0 = shipped (biome x toggle gate)
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 topColor, midColor, horizonColor, sunGlow, sunDir, fogFarColor;
      uniform float feverMix, feverWarm, starMix, fogFarMix, time, dimMix;
      ${CLOUD_HEAD}
      ${AURORA_HEAD}
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        // Dragon Surge palette shift: magenta by default, or FIERY ember for fire dragons (feverWarm)
        vec3 horF = mix(vec3(1.0, 0.35, 0.85), vec3(1.0, 0.52, 0.20), feverWarm);
        vec3 midF = mix(vec3(0.55, 0.25, 0.9), vec3(0.92, 0.40, 0.14), feverWarm);
        vec3 hor = mix(horizonColor, horF, feverMix * 0.8);
        vec3 mid = mix(midColor, midF, feverMix * 0.7);
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.25, h));
        col = mix(col, topColor, smoothstep(0.2, 0.7, h));
        // Dual-fog far color (§5.2): the sky's lowest band IS the far field —
        // sink it toward fogFarColor. Branchless: fogFarMix is 0 in biomes
        // without a fogFarColor, leaving the gradient byte-identical.
        col = mix(col, fogFarColor, fogFarMix * (1.0 - smoothstep(0.0, 0.15, h)));
        // Aurora PREVIEW night wash (?aurora=1 only): sink the day sky to a near-black indigo BEFORE the
        // curtain adds on top, so the forced preview reads like the shipping NIGHT biome (an aurora over a
        // sunlit sky is a physics lie). uAurNight is 0 in all real gameplay → byte-identical.
        col = mix(col, vec3(0.020, 0.030, 0.075), uAurNight);
        ${AURORA_BODY}
        ${CLOUD_BODY}
        float s = max(dot(d, normalize(sunDir)), 0.0);
        // Tighter, dimmer sun: a smaller disc + a much softer halo so it stops
        // blowing out the centre of the screen and washing out contrast.
        // N9: a cloud covering this pixel occludes the disc (cCov=0 when clouds off
        // → shipped). The halo stays so clouds still glow near the sun.
        // (× (1 - uAurNight): the aurora preview kills the sun — a night sky has none. And under a real
        // aurora biome (uAuroraMix up), dim the moon disc + kill most of its broad halo so it doesn't grey
        // the sky the curtain owns — a faint moon dot remains. uAuroraMix 0 elsewhere → byte-identical.)
        col += sunGlow * (pow(s, 900.0) * 0.7 * (1.0 - cCov * 0.85) * (1.0 - 0.5 * uAuroraMix)
                        + pow(s, 10.0) * 0.16 * (1.0 - 0.85 * uAuroraMix)) * (1.0 - uAurNight);
        // Aurora bands during surge: two drifting sine curtains in the upper
        // sky, fading cyan <-> magenta. Branchless — everything * feverMix.
        float band1 = sin(d.x * 9.0 + time * 0.7 + d.y * 14.0);
        float band2 = sin(d.x * 5.0 - time * 0.45 + d.y * 9.0 + 2.1);
        float curtain = smoothstep(0.15, 0.65, h) * (0.5 + 0.5 * sin(time * 0.3));
        vec3 aurora = mix(vec3(0.25, 0.95, 0.85), vec3(1.0, 0.6, 0.22), feverWarm) * max(band1, 0.0)
                    + mix(vec3(0.95, 0.3, 0.95), vec3(1.0, 0.42, 0.12), feverWarm) * max(band2, 0.0);
        col += aurora * curtain * feverMix * 0.35;
        // Starfield (night biomes): hashed cells in the upper dome, gently
        // twinkling. Branchless — multiplied to zero outside night biomes.
        vec3 cell = floor(d * 110.0);
        float sh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = smoothstep(0.9965, 1.0, sh)
                   * (0.6 + 0.4 * sin(time * 2.0 + sh * 90.0))
                   * smoothstep(0.04, 0.3, h);
        // Aurora Shallows: the curtain is nearer than the stars — dim them where it burns
        // (aurLum is 0 in every other biome, so this is a branchless no-op there).
        star *= 1.0 - 0.65 * clamp(aurLum, 0.0, 1.0);
        // starMix in real night biomes; the aurora preview also lights the stars (max) so its night sky
        // isn't an empty void behind the curtain.
        col += vec3(0.85, 0.9, 1.0) * star * max(starMix, uAurNight * 0.9);
        // Night biomes also get a faint, slow surge aurora veil of their own — but NOT
        // over the authentic aurora (two auroras stacked read as noise), so × (1 - mix).
        col += aurora * smoothstep(0.2, 0.6, h) * starMix * 0.12 * (1.0 - uAuroraMix);
        // Aurora Shallows tier2 banding guard: a per-pixel ±0.5/255 dither breaks the
        // smooth green ramp's Mach bands on 8-bit panels (only where the curtain is lit).
        col += (_aHash(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0) * uAuroraMix;
        // EMBERTIDE sky-replacement crossfade ("one sky, never two"): as EMBERTIDE's dome
        // fades IN, dim the real dome toward black (and it's hidden entirely at dimMix≈1,
        // so its draw is replaced, not stacked — overdraw stays flat).
        gl_FragColor = vec4(col * (1.0 - dimMix), 1.0);
      }`,
  });
  sky = new THREE.Mesh(new THREE.SphereGeometry(800, 24, 16), skyMat);
  sky.frustumCulled = false;
  // N9 (ADJUST-3): the camera-locked dome sorts to z~0 and would draw FIRST, so
  // every sky pixel shades then gets overdrawn. renderOrder=1 draws it after the
  // opaque world → early-z rejects occluded sky pixels (depthWrite already false,
  // depthTest true). This is the perf offset that pays for the cloud FBM.
  sky.renderOrder = 1;
  scene.add(sky);

  // --- Lighting: warm sun ahead, biome-tinted bounce.
  sun = new THREE.DirectionalLight(0xffe0b0, 1.8);
  sun.position.set(-60, 45, -150);
  scene.add(sun, sun.target);
  hemi = new THREE.HemisphereLight(0xbfdcff, 0x2e5448, 0.8);
  scene.add(hemi);
  initSkyProbe(scene, hemi); // N5 sky-IBL probe (dormant until enabled)

  // --- Prop bands: one recycled InstancedMesh per archetype.
  bands = [];
  for (const key of Object.keys(ARCHETYPES)) {
    bands.push(makeBand(scene, ARCHETYPES[key]));
  }

  // --- ARENA (PR-H1/H2): THE UNVEILED HEAVEN's holy architecture (colonnade + rose-window).
  // Built once, hidden; driven off the stateless arena mix inside updateEnvironment below.
  createArenaSet(scene);

  // --- Ambient particles + birds.
  createAmbient(scene);
}

function makeBand(scene, def) {
  const perSide = Math.ceil(WALL_WINDOW / def.step);
  const { geometry, materials } = def.build();
  // N15 guard: prop materials sample `aoBake`; a build path that skips mergeParts()
  // (or geometry with no normals) would leave it undefined → 0 → BLACK props when the
  // toggle is on. Unreachable today (all builds route through mergeParts), but cheap
  // insurance against a future prop path.
  if (!geometry.getAttribute('aoBake')) console.warn('[env] prop geometry missing aoBake — props will darken to black under PROP SHADING');
  const mesh = new THREE.InstancedMesh(geometry, materials, perSide * 2);
  mesh.frustumCulled = false;
  // N10c: sibling foam mesh, same instance count — written at the same index in
  // writeMatrix so it recycles + parks in lockstep with the props.
  const foam = makeFoamMesh(perSide * 2);
  const band = { mesh, foam, data: [], step: def.step, def };
  let idx = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < perSide; i++) {
      const d = { side, slot: i, dist: i * def.step + rnd() * def.step - 100, ...def.place(side, rnd) };
      band.data.push(d);
      writeMatrix(band, idx++, d);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  foam.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  updateBandVisibility(band);
  scene.add(mesh);
  scene.add(foam);
  return band;
}

// --- Per-biome instance tint for SHARED archetypes (BIOME-DESIGN.md §5.4) ----
// The verdigris paint-bug fix: column/slab/dome hardcode mergeParts([...], 0)
// (Sanctuary verdigris), so they rendered verdigris even in the Amber Wastes.
// instanceColor MULTIPLIES the material's base color, so entries are per-channel
// RATIOS (target ÷ base): biome 0 is identity WHITE (writing the verdigris hex
// would SQUARE the color and darken Sanctuary), biome 1 is sandstone ÷ verdigris
// (0xe2bd8a ÷ 0x86b39c — components > 1 are legal). One instance color spans
// BOTH material groups of a merged archetype; the ratio is derived from the
// primary pair and the accent shift is accepted as approximate. Zero new draws.
const TINT_WHITE = new THREE.Color(0xffffff);
const BIOME_TINTS = [
  TINT_WHITE,                                          // 0 Sanctuary — identity (the base paint)
  new THREE.Color(0xe2 / 0x86, 0xbd / 0xb3, 0x8a / 0x9c), // 1 Wastes — sandstone ratio
  TINT_WHITE, TINT_WHITE, TINT_WHITE, TINT_WHITE,      // 2–5 — no shared archetypes today
];

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const posV = new THREE.Vector3();
const sclV = new THREE.Vector3();
function writeMatrix(band, i, d) {
  // Park instances whose archetype doesn't belong to the biome at their
  // distance — they re-enter when recycled into a matching stretch.
  const bi = biomeIndexAt(Math.max(d.dist, 0));
  const active = band.def.biomes.includes(bi);
  eul.set(0, d.rotY ?? (d.rotY = rnd() * Math.PI), d.tilt);
  quat.setFromEuler(eul);
  if (active) {
    m4.compose(posV.set(d.x, -0.5, -d.dist), quat, sclV.set(d.r, d.h, d.r));
  } else {
    m4.compose(posV.set(d.x, -50, -d.dist), quat, sclV.set(0.0001, 0.0001, 0.0001));
  }
  band.mesh.setMatrixAt(i, m4);
  // N10c: write the foam ring at the same index — inherits the prop's active/parked
  // state (always written, so the toggle is a pure visibility flip, correct mid-run).
  writeFoamMatrix(band.foam, i, d, band.def.foam, active);
  // Shared archetypes (whitelisted in >1 biome) tint per dominant biome so the
  // same mesh reads verdigris in Sanctuary and sandstone in the Wastes.
  // Single-biome archetypes never allocate instanceColor — untouched.
  if (band.def.biomes.length > 1) {
    band.mesh.setColorAt(i, BIOME_TINTS[bi] ?? TINT_WHITE);
  }
}

// A band with EVERY instance parked draws nothing useful — gate the whole mesh
// off (§5.4: mesh.visible is the correct kill switch; frustum culling is
// deliberately disabled). WALL_WINDOW (900) < biomeLength (1500) means at most
// 2 biomes are in-window, so per-frame prop draws collapse to the live biomes'
// archetypes no matter how many exclusives the roster grows.
function updateBandVisibility(band) {
  band.mesh.visible = !arenaPropsGate && band.data.some(
    (d) => band.def.biomes.includes(biomeIndexAt(Math.max(d.dist, 0))));
  // N10c: foam draws only where props draw, foam is on, tier ≤ 1, and the archetype
  // opts in (archruin/slab foam is always parked — don't issue the degenerate draw).
  band.foam.visible = foamVisible(band.mesh.visible) && band.def.foam !== false;
}

function recycleBand(band, playerDist) {
  let changed = false;
  for (let i = 0; i < band.data.length; i++) {
    const d = band.data[i];
    if (d.dist < playerDist - 100) {
      const fresh = band.def.place(d.side, rnd);
      Object.assign(d, fresh, { dist: d.dist + WALL_WINDOW, rotY: rnd() * Math.PI });
      writeMatrix(band, i, d);
      changed = true;
    }
  }
  if (changed) {
    band.mesh.instanceMatrix.needsUpdate = true;
    band.foam.instanceMatrix.needsUpdate = true; // N10c: foam recycles in lockstep
    if (band.mesh.instanceColor) band.mesh.instanceColor.needsUpdate = true;
    // Active/parked state is baked into each instance at write time, so the
    // band's visibility can only change when instances were rewritten.
    updateBandVisibility(band);
  }
}

// Re-seat a band's instances around the start line. Without this, restarting
// leaves every prop parked thousands of metres ahead.
function reseedBand(band) {
  for (let i = 0; i < band.data.length; i++) {
    const d = band.data[i];
    Object.assign(d, band.def.place(d.side, rnd), {
      dist: d.slot * band.step + rnd() * band.step - 100,
      rotY: rnd() * Math.PI,
    });
    writeMatrix(band, i, d);
  }
  band.mesh.instanceMatrix.needsUpdate = true;
  band.foam.instanceMatrix.needsUpdate = true; // N10c
  if (band.mesh.instanceColor) band.mesh.instanceColor.needsUpdate = true;
  updateBandVisibility(band);   // the restart path must re-evaluate the gate too
}

export function resetEnvironment(seed) {
  if (seed !== undefined) rnd = mulberry32(seed + 99);
  arenaPropsGate = false;   // ARENA (PR-A): a new-run reseed from a paused void frame reseats the bands VISIBLE (belt-and-braces to the self-healing per-frame restore)
  resetArenaSet();          // ARENA (PR-H1/H2): same belt-and-braces for the heaven furniture
  for (const band of bands) reseedBand(band);
  feverMix = 0;
  bossMix = 0;
  cloudSunCover = 0; // N9: don't carry a cloud's sun-occlusion across a restart
}

// The sky-dome mesh — the god-ray occlusion mask hides it to paint the open-sky
// light field while every solid occluder draws black.
export function getSkyMesh() { return sky; }

export function updateEnvironment(dt, camera, time, playerDist, feverActive = false, playerSpeed = 0, bossTarget = 0, arenaMix = 0, arenaFade = 1) {
  sky.position.copy(camera.position);
  // ARENA (PR-A/B) prop gate: hide the biome prop bands once the arena owns the sky (the flood peak
  // ~0.45 masks the pop). Re-evaluate ALL bands on the edge BEFORE the recycle loop, so this frame's
  // recycles already respect the gate. Restore is self-healing: any teardown → arenaMix 0 → gate false →
  // next frame reseats. The props RETURN only at the tail of the exhale (fade < 0.15, sky already ≈ biome)
  // — the death burst is long over by fade 0.5, so an earlier return would pop props into a half-heaven
  // sky (CP2 finding-5).
  const hideProps = arenaMix >= 0.45 && arenaFade >= 0.15;
  if (hideProps !== arenaPropsGate) {
    arenaPropsGate = hideProps;
    for (const band of bands) updateBandVisibility(band);
  }
  for (const band of bands) recycleBand(band, playerDist);

  // ARENA (PR-H1/H2): the heaven's holy architecture rides the SAME stateless mix/fade the skin
  // reads — visible only in the heaven window, dissolved by the exhale, self-healing on teardown.
  updateArenaSet(time, playerDist, arenaMix, arenaFade);

  // --- Biome atmosphere lerp: sky, fog, lights, water all follow the seam.
  const env = computeEnv(playerDist);
  // ARENA (PR-A) — THE injection: blend the live env scratch toward the void palette (arenaSkin.js) BEFORE
  // the fan-out below, so sky uniforms, scene.fog, sun/hemi, setWaterTint AND updateAmbient all read the
  // overridden scratch. mix 0 ⇒ zero writes ⇒ byte-identical for every other boss + all flight.
  applyArenaSkin(env, arenaMix, arenaFade);
  const su = sky.material.uniforms;
  su.topColor.value.copy(env.skyTop);
  su.midColor.value.copy(env.skyMid);
  su.horizonColor.value.copy(env.skyHorizon);
  su.sunGlow.value.copy(env.sunGlow);
  sceneRef.fog.color.copy(env.fogColor);   // scene fog keeps the NEAR color (§5.2)
  sceneRef.fog.near = env.fogNear;
  sceneRef.fog.far = env.fogFar;
  su.fogFarColor.value.copy(env.fogFarColor);
  su.fogFarMix.value = env.fogFarMix;
  applyAtmosphere(env); // N8: drive the shared fog-chunk uniforms from the biome (identity when off)
  applySkyClouds(env, playerDist, time); // N9: drive the sky-cloud uniforms (amount 0 = shipped)
  applyAurora(env, playerDist, time, camera, dt); // Aurora Shallows: drive the curtain uniforms (mix 0 = shipped)
  // N9 god-ray coupling: damp the cloud coverage over the sun so shafts EASE down
  // as a cloud drifts across it (rather than strobe). main.js reads getCloudSunCover().
  cloudSunCover = damp(cloudSunCover, sunCloudCover(env, su.sunDir.value, playerDist, time), 3, dt);
  updateSkyProbe(env, su.sunDir.value); // N5: reproject the (lerped) sky into the probe
  sun.color.copy(env.lightSun);
  sun.intensity = env.lightSunI;
  hemi.color.copy(env.hemiSky);
  hemi.groundColor.copy(env.hemiGround);
  setWaterTint({
    deep: env.waterDeep,
    shallow: env.waterShallow,
    sun: env.sunGlow,
    horizon: env.skyHorizon,
    zenith: env.skyTop,
    waveAmp: env.waveAmp,
    // Dual-fog (§5.2 three-touch rule): the water's far-fog color rides the
    // same tint call. A COLOR — the water's fogFar uniform is a DISTANCE.
    fogFarColor: env.fogFarColor,
  });
  // N10c: foam collars ride the same swell + fade into the same fog band.
  updateFoam(time, env.waveAmp, getWaterSwellOn(), env.fogNear, env.fogFar);

  // Dragon Surge sky tint (damped so it sweeps in/out smoothly)
  feverMix = damp(feverMix, feverActive ? 1 : 0, 2.5, dt);
  su.feverMix.value = feverMix;
  // In the FIRSTBORN heaven the Surge reads in the arena's OWN gold, not the default magenta — the
  // godhead's palette law extends to the player's surge (a magenta wash punched a hole in the gold
  // sky, the owner's "background changes randomly"). Force the existing FIERY feverWarm variant while
  // in the heaven (arenaMix 1→2), overriding the per-dragon target. feverWarm is a no-op until surge
  // fires (it's × feverMix in the shader), so this only shows when the player actually surges.
  const heavenWarm = Math.max(0, Math.min(1, arenaMix - 1));   // 0 in biome/void → 1 as the heaven settles
  feverWarmMix = damp(feverWarmMix, Math.max(feverWarmTarget, heavenWarm), 2.5, dt);   // FIERY (fire dragons / the heaven) vs magenta
  su.feverWarm.value = feverWarmMix;
  su.dimMix.value = skyDim;          // EMBERTIDE sky-replacement crossfade
  sky.visible = skyDim < 0.985;      // hide the real dome once EMBERTIDE fully covers (draw replaced, not added)
  su.starMix.value = env.starMix;
  su.time.value = time;

  // Boss-time mote budget: own eased copy of the same signal postfx grades
  // with (same ~1s damp idiom as feverMix above) — decays unconditionally so
  // a boss teardown mid-fight can't strand the ambient dim either.
  bossMix = damp(bossMix, bossTarget, 4, dt);

  updateAmbient(dt, camera, time, playerDist, playerSpeed, feverMix, env, bossMix);
}
