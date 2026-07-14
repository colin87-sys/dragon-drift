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
import { AURORA_HEAD, AURORA_BODY, auroraUniforms, applyAurora, setAuroraEnabled, setAuroraForced, setAuroraQuality, auroraEnabled, auroraForced, auroraMix, auroraPulse, setAuroraActOverride, setAuroraEruptOverride, setAuroraFlowExcite } from './auroraSky.js';
import { createArenaSet, updateArenaSet, resetArenaSet, setArenaSetQuality, debugArenaSet, setStarMode } from './arenaSet.js';
import { getWaterSwellOn } from './water.js';
import { makeFoamMesh, writeFoamMatrix, foamVisible, updateFoam, setWaterFoam as _setWaterFoam, setWaterFoamQuality as _setWaterFoamQuality } from './propFoam.js';

// Re-export the sky-IBL + prop-AO + atmosphere + sky-cloud controls so main.js
// drives them through environment.
export { setSkyProbeEnabled, skyProbeEnabled, setPropAO, setAtmosphereEnabled, setAtmosphereQuality, atmosphereEnabled, setSkyCloudsEnabled, setSkyCloudQuality, skyCloudsEnabled };
// Aurora Shallows: the sky-splice controls ride through environment too.
export { setAuroraEnabled, setAuroraForced, setAuroraQuality, auroraEnabled, auroraForced, auroraMix, setAuroraActOverride, setAuroraEruptOverride, setAuroraFlowExcite };
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

// Aurora ground-glow pulse targets (module consts — no per-frame allocs). The ground light
// answering the sky: quiet breath toward the curtain's green, a warm rose creep during eruptions.
const _AUR_HEMI_GREEN = new THREE.Color(0x54ff86);  // = uAurGreen (sky + ground light agree)
const _AUR_HEMI_ROSE = new THREE.Color(0xd06a8a);   // = uAurFringe (desaturated rose, NOT danger-magenta)

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
      new THREE.MeshStandardMaterial({ ...opts, color: 0xbfdce6, roughness: 0.30, metalness: 0.08, emissive: 0x357088, emissiveIntensity: 0.42 }),   // Sunset Glacier: LUMINOUS glacial ice — the emissive fakes transmission (glows from every side in backlight); weathering noise mottles it; low roughness → per-facet sun glints
      new THREE.MeshStandardMaterial({ ...opts, color: 0x352629, emissive: 0x4a1208, emissiveIntensity: 0.3 }),   // basalt w/ inner heat
      new THREE.MeshStandardMaterial({ ...opts, color: 0x1d4438, emissive: 0x0a3328, emissiveIntensity: 0.4 }),   // night moss
      new THREE.MeshStandardMaterial({ ...opts, color: 0x3a3a6a, emissive: 0x16164a, emissiveIntensity: 0.4 }),   // astral slate
      new THREE.MeshStandardMaterial({ ...opts, color: 0x26424e, roughness: 0.26, metalness: 0.12, emissive: 0x0d2a26, emissiveIntensity: 0.22 }), // 6 aurora night sea-ice — near-black silhouette, per-facet moon glints
    ],
    accent: [
      new THREE.MeshStandardMaterial({ ...opts, color: 0xc08a50, roughness: 0.5, metalness: 0.25, emissive: 0x2a1505, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xb56a40, emissive: 0x251005, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xd8f6ff, roughness: 0.22, emissive: 0x3fc8e8, emissiveIntensity: 0.85 }),   // Sunset Glacier: the CYAN CORE — the light inside the ice (Candle slivers + Sail panes only; warm is NEVER emissive)
      new THREE.MeshStandardMaterial({ ...opts, color: 0xff5a20, roughness: 0.4, emissive: 0xff3a08, emissiveIntensity: 0.9 }),  // magma seams
      new THREE.MeshStandardMaterial({ ...opts, color: 0x4dffd0, roughness: 0.35, emissive: 0x18d0a0, emissiveIntensity: 1.0 }), // biolume caps
      new THREE.MeshStandardMaterial({ ...opts, color: 0x9fb8ff, roughness: 0.3, emissive: 0x5a78ff, emissiveIntensity: 1.1 }),  // starlit crystal
      new THREE.MeshStandardMaterial({ ...opts, color: 0x78b0a0, roughness: 0.18, metalness: 0.05, emissive: 0x1c5c48, emissiveIntensity: 0.42 }), // 6 aurora-caught ice edge — paler/glassier, a LIT edge not a lamp
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

// A RECESSED crevasse core — the Frozen kit's ONE accent language (Fable studio
// gate P3 #6). The old kit stuck a bright cyan RECTANGLE flat on a face, which
// read as a sticker / LED strip (the poverty pattern DRAGON-DESIGN.md kills on
// sight). Instead this drops emissive (mat 1) slivers SET BACK at low z, broken
// into `seg` vertical segments, to be seated in a NARROW GAP between two mat-0
// blocks — the blocks are the chasm walls, so the glow reads as light escaping
// from INSIDE the ice, never painted on it. Caller sizes the flanking blocks so
// the core is proud-recessed (walls at higher z than `z`). Returns parts to spread
// into a build([...]) list. Cost = seg×12 tris. All boxes → merges indexed.
function crevasseCore({ x = 0, y = 0.45, z = 0.0, h = 0.5, w = 0.07, seg = 3, gap = 0.04 }) {
  const parts = [];
  const segH = (h - gap * (seg - 1)) / seg;
  for (let i = 0; i < seg; i++) {
    // brightest read comes from the middle segment being tallest; taper the ends
    const t = seg > 1 ? Math.abs(i - (seg - 1) / 2) / ((seg - 1) / 2) : 0; // 0 mid → 1 ends
    const sh = segH * (1 - 0.28 * t);
    const sy = y - h / 2 + segH / 2 + i * (segH + gap);
    parts.push({ mat: 1, geo: xform(new THREE.BoxGeometry(w, sh, 0.05), { x, z, y: sy }) });
  }
  return parts;
}

// A/B coexistence flag for the wall-props redesign (WALL-PROPS-REDESIGN.md §6),
// same idiom as `?skyforged=0` (powerups.js:13-15). Default (v2) = the new premium
// per-biome kits; `?props=v1` restores the legacy roster. The flip is a swap of the
// two rosters' `biomes` whitelists at module init — a registered-but-unlisted
// archetype parks every instance (writeMatrix) and the visible-gate kills its draw,
// so both rosters coexist ~free until the legacy set is deleted in the §6 A8 cleanup.
const _envParams = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search) : new URLSearchParams();
const PROPS_V1 = _envParams.get('props') === 'v1';
// Per-biome whitelist helpers: FROZEN is the A1 biome (new kit default-on, legacy
// parked). A biome not yet migrated returns its shipped whitelist unconditionally.
const frozenNew = PROPS_V1 ? [] : [2];   // Sunset Glacier (no-spike glacier ice): bergwall/serac/terrace/icetower/glacierwall/sungate(hero)
const frozenOld = PROPS_V1 ? [2] : [];   // crystal/crystalSmall (deleted in A8)

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
  // --- FROZEN REACH (A1 — WALL-PROPS-REDESIGN.md §4.2) ------------------------
  // "The ribs of something enormous, not quite done being buried." Clustered
  // blades + vertebral stacks, bone-white — the MARROWCOIL foreshadow made
  // literal. Opposes Astral: hard/near/dense/rooted vs soft/vast/sparse/floating.
  // Legacy single-cone crystals (now `frozenOld`, parked by default) stay
  // registered until the §6 A8 cleanup; `?props=v1` swaps the rosters back.
  crystal: {
    step: 13, biomes: frozenOld, matIndex: 2,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(1, 1, 5), { y: 0.42, sy: 1 }) },
    ], 2),
    place: (side, rnd) => ({ x: side * (17 + rnd() * 8), h: 18 + rnd() * 32, r: 3.5 + rnd() * 5, tilt: side * (0.06 + rnd() * 0.1) }),
  },
  crystalSmall: {
    step: 30, biomes: frozenOld, matIndex: 2,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.ConeGeometry(1, 1, 5), { y: 0.42 }) },
    ], 2),
    place: (side, rnd) => {
      const h = 2 + rnd() * 5;
      return { x: side * (13.5 + rnd() * 3), h, r: h * 0.35, tilt: side * rnd() * 0.3 };
    },
  },
  // ── THE SUNSET GLACIER (v2 — massive-first: 86% broad/chunky mass, ~14% vertical
  // punctuation; real ice reads as scale through BREADTH, not height). ──
  // THE BERG WALL — hero mass (~128 tris): a sheer tabular iceberg face, flat-topped,
  // cliff-fronted, one stepped upper stratum + a calved block at its foot. COLOSSAL
  // and BROAD (~1.2:1 wide) — the thing that makes you feel small. Its huge planar
  // facets catch the low sun as single gold sheets while the shadow side glows blue;
  // doubled in the mirror. ONE cyan crevasse seam (mat 1) recessed on the face.
  bergwall: {
    step: 70, biomes: frozenNew, matIndex: 2, comp: { floor: 0, sMin: 0.9, sMax: 1.12 }, // force-parks in breath; grows in congregation
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.52, 0.62, 0.64, 7), { y: 0.32, ry: 0.3, sx: 1.4, sz: 0.85 }) },  // main tabular mass
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.44, 0.52, 0.38, 6), { x: -0.22, z: 0.06, y: 0.74, ry: 1.1, sx: 1.3, sz: 0.85 }) }, // upper stratum → the calving OVERHANG on the left (the best glacial gesture — kept)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.62, 0.16, 0.52), { x: -0.10, y: 0.90, ry: 0.15 }) },                  // crown cap A — ONE large tabular cap (consolidated, was crown clutter)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.40, 0.16, 0.36), { x: 0.24, z: -0.06, y: 0.70, ry: 0.5 }) },          // crown cap B — SEATED on the main top (was the floating chip; now overlaps)
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.24, 0.30, 0.34, 5), { x: 0.56, z: 0.08, y: 0.17, ry: 3.1 }) },   // calved block at the foot (story beat)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.11, 0.50, 0.13), { x: 0.02, z: 0.50, y: 0.44 }) },                    // crevasse rib L (proud of the face)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.11, 0.50, 0.13), { x: 0.24, z: 0.50, y: 0.44 }) },                    // crevasse rib R (proud of the face)
      // recessed crevasse core in the cleft between the ribs (the lit chasm, kit accent language)
      ...crevasseCore({ x: 0.13, y: 0.44, z: 0.53, h: 0.42, w: 0.07, seg: 2 }),
    ], 2),
    // Gate-safety clamp (Move 2 pre-assess): bergwall's REAL footprint is ±0.95 (not
    // ±0.6 — calved foot + upper stratum), and rotY is random, so the inner edge must
    // clear the ±16 gameplay-gate veil from EITHER orientation. x = 17.5 + 0.95·r + …
    // keeps the near edge ≥ 17.5 → props never intrude on a gate (the owner's complaint).
    place: (side, rnd) => { const r = 15 + rnd() * 9; return { x: side * (17.5 + 0.95 * r + rnd() * 5), h: 22 + rnd() * 16, r, tilt: side * (rnd() * 0.03 - 0.015) }; },
  },
  // THE SERAC STACK — chunky faceted block-pile (~104 tris): three tilted icosahedral
  // blocks stacked and toppling + a capstone rhomb (the Khumbu-icefall read), ~1:1
  // chunky. flatShading gives ~90 flat facets each catching the sunset at a different
  // angle — the richest per-tri surface in the kit. ONE lit fracture plate (mat 1) in
  // a cleft. NON-INDEXED throughout (icosahedra + .toNonIndexed() boxes — the `berg` rule).
  // THE SERAC STACK — a pile of SHEARED, interpenetrating ice BLOCKS (~120 tris).
  // The Fable studio gate (2.4/5) killed the old icosahedral version as "rounded
  // BOULDERS, not seracs" (icosa read as pebbles) with a detached FLOATING block and
  // a plastic sticker accent. Real Khumbu seracs are toppling cubic blocks that lean
  // ON each other — so this is now all BOXES, each rotated to a different shear and
  // overlapping its neighbours ≥25% (nothing floats). The accent is a RECESSED
  // crevasse (kit language), not a plate stuck on the surface. All boxes → indexed.
  serac: {
    step: 26, biomes: frozenNew, matIndex: 2, comp: { floor: 0, sMin: 0.88, sMax: 1.10 }, // force-parks in breath
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.66, 0.56, 0.60), { y: 0.30, ry: 0.20, rz: 0.09 }) },            // main sheared block (deeper — a block, never a plane)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.54, 0.50, 0.52), { x: 0.30, z: -0.08, y: 0.38, ry: 0.6, rz: -0.20 }) }, // block leaning ON the main (topple)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.48, 0.46, 0.48), { x: -0.30, z: 0.12, y: 0.28, ry: 1.1, rz: 0.18 }) },  // flank block, sheared other way
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.44, 0.42, 0.42), { x: 0.06, z: 0.04, y: 0.64, ry: 0.4, rz: 0.24 }) },   // upper block seated ON the pile (grounded, was the floater)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.32, 0.32, 0.32), { x: -0.12, z: -0.06, y: 0.70, ry: 0.9, rz: -0.30 }) },// small toppled capstone, overlapping
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.38, 0.28, 0.36), { x: 0.34, z: 0.22, y: 0.14, ry: 0.5, rz: 0.10 }) },   // foot rubble, half-buried
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.15, 0.40, 0.26), { x: -0.06, z: 0.30, y: 0.40 }) },             // crevasse rib L (proud, DEEP — reads as ice, not a card)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.15, 0.40, 0.26), { x: 0.18, z: 0.30, y: 0.40 }) },              // crevasse rib R (proud, deep)
      // recessed crevasse core in the cleft between the ribs (proud of the main block face)
      ...crevasseCore({ x: 0.06, y: 0.40, z: 0.36, h: 0.34, w: 0.07, seg: 2 }),
    ], 2),
    place: (side, rnd) => ({ x: side * (16 + rnd() * 8), h: 7 + rnd() * 6, r: 7 + rnd() * 4, tilt: side * (rnd() * 0.10 - 0.03) }),
  },
  // THE ICE TERRACE — stepped shelf (~108 tris): a giant's staircase rising from the
  // mirror — wide (3–8:1). Low h-rolls read as pack ice, high rolls as full terraces
  // (one archetype, two reads). Each tread catches the gold rim, each riser holds blue
  // shadow — free banding. The horizontal REST that makes the verticals read colossal.
  terrace: {
    step: 20, biomes: frozenNew, matIndex: 2, comp: { floor: 0.22, sMin: 0.85, sMax: 1.08 }, // keeps a floor of LOW pack-ice through the breath
    // Fable studio gate (2.6/5): the plan view is good but in elevation it read as
    // "one thin pancake" — no riser height → no blue shadow bands → no depth. Rebuilt
    // with THICKER tiers (real risers that hold a shadow band) + 2 chunky serac boxes
    // as pressure-ridge rubble to break the pancake silhouette, and a slightly higher
    // floor so it reads as a low shelf with thickness, not paper.
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.62, 0.62, 0.32, 7), { y: 0.16, ry: 0.4, sx: 1.15, sz: 0.8 }) },  // base pan — STRAIGHT walls (vertical ice cliff, not a melting taper) + 30% thicker
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.46, 0.46, 0.30, 6), { x: 0.10, z: -0.06, y: 0.45, ry: 1.6, sx: 1.1 }) }, // tier 2 — straight-walled riser
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.30, 0.30, 0.26, 6), { x: -0.14, z: 0.10, y: 0.70, ry: 3.0 }) },  // tier 3 — straight-walled
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.26, 0.24, 0.24), { x: 0.26, z: 0.16, y: 0.34, ry: 0.5, rz: 0.10 }) },// pressure-ridge rubble chunk
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.22, 0.22, 0.20), { x: -0.32, z: -0.10, y: 0.30, ry: 1.2 }) },        // pressure-ridge rubble chunk
      // The accent is a RECESSED crevasse SLIT in the tread, not a flush pond decal
      // (Fable: the wide pond read as a sticker from ABOVE — the primary read in a
      // flying game). Two TALL proud mat-0 rims flank a CONTINUOUS 2-segment jagged
      // emissive crack (segments overlap at the joint so the top-down projection is one
      // unbroken high-aspect polyline, not two chips), sunk well below the rim tops so
      // from above it reads as one glowing crack framed by shaded ice, and oblique rims
      // occlude it. ~4:1 crack proportions, not a rectangle.
      // On the EXPOSED tier-2 tread (clear of the tier-3 cap, which was occluding the
      // old crack from above) and LONG — the lit floor runs the full ~0.38 polyline
      // (~40% of the tread width) at ~5:1, so from gameplay altitude it still reads as
      // a glowing crack, not a chip. Two proud rims frame it into a trench.
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.05, 0.16, 0.42), { x: 0.22, z: 0.02, y: 0.60, ry: 0.3 }) },          // crevasse rim L (proud → trench wall)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.05, 0.16, 0.42), { x: 0.39, z: 0.02, y: 0.60, ry: 0.3 }) },          // crevasse rim R
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.075, 0.06, 0.26), { x: 0.29, z: -0.08, y: 0.62, ry: 0.3 }) },        // lit crack segment 1 (full glowing floor)
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.075, 0.06, 0.16), { x: 0.33, z: 0.12, y: 0.62, ry: 0.3 }) },         // lit crack segment 2 — overlaps seg 1 → one continuous glowing crack spanning the tread
    ], 2),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 10), h: 2.5 + rnd() * 4.5, r: 8 + rnd() * 8, tilt: side * (rnd() * 0.04 - 0.02) }),
  },
  // THE ICE TOWER — a tall TABULAR ice column (~108 tris, step 130 = rare landmark).
  // Real glaciers are flat-topped and blocky, NEVER spiky (research: tabular/blocky
  // dominate; pinnacled spires are the rare exception) — so this is a STACK of offset
  // ice blocks with a FLAT stepped top, not a spire. Placed FAR from the lane
  // (|x| ≥ 24) so it never looms over or occludes a gameplay gate (clean lanes).
  icetower: {
    step: 170, biomes: frozenNew, matIndex: 2, comp: { floor: 0, sMin: 0.9, sMax: 1.0 }, // rarer + capped (Move 2: the Sun Gate is the tallest paired hero at a peak, not this)
    // The Fable studio gate (2.0/5) flagged this as the "man-made" repeat offense —
    // uniform taper + concentric coursing + aligned seams read as a water tower /
    // chimney / ziggurat. Rebuilt to BREAK the coursing: a fat tabular base, then
    // blocks of strongly VARIED heights with lateral offsets that ALTERNATE sides
    // (a zig-zag silhouette, not a smooth taper), each yawed irregularly so the
    // plan-view star symmetry dies, finished with one OVERSIZED overhanging capstone
    // and a recessed crevasse seam (it was the only unlit prop).
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.44, 0.54, 0.44, 6), { y: 0.22, ry: 0.2, sx: 1.05 }) },          // FAT tabular base (~40% height)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.48, 0.42, 0.44), { x: -0.10, z: 0.04, y: 0.52, ry: 0.5 }) },          // block — offset LEFT, tall (deep overlap into the base → fused, not perched)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.44, 0.34, 0.40), { x: 0.12, z: -0.06, y: 0.78, ry: -0.7 }) },         // block — offset RIGHT (zig-zag), overlapping heavily
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.56, 0.22, 0.50), { x: 0.04, y: 0.98, ry: 0.4, rz: 0.05 }) },          // OVERSIZED overhanging capstone (shaved a block — less totem-tall)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.11, 0.44, 0.20), { x: -0.06, z: 0.30, y: 0.60 }) },                   // crevasse rib L (proud, deep)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.11, 0.44, 0.20), { x: 0.14, z: 0.30, y: 0.60 }) },                    // crevasse rib R (proud, deep)
      ...crevasseCore({ x: 0.04, y: 0.58, z: 0.36, h: 0.38, w: 0.07, seg: 2 }),                                          // recessed crevasse (kit accent)
    ], 2),
    place: (side, rnd) => ({ x: side * (24 + rnd() * 12), h: 22 + rnd() * 14, r: 8 + rnd() * 4, tilt: side * (rnd() * 0.06 - 0.02) }),
  },
  // THE GLACIER WALL — far massif on the fog line (~64 tris): a long tabular ice-shelf
  // front, mass in the UPPER band so it FLOATS on the fog line (foam:false); peaks
  // spread in x AND z (rotation-robust). Now at TRUE scale (~4–5:1 wide, 58–85 wide)
  // — the world's edge dissolving into molten gold via the dual-fog. Fixes the far read.
  glacierwall: {
    step: 80, biomes: frozenNew, matIndex: 2,
    // Fable studio gate (3.6/5 — the kit's best): right tabular-iceberg language, but
    // the old FLAT top box read as a machined rebate/casting-mold slot, and the skyline
    // was one unbroken flat line (reads as a wall, not a massif). Rebuilt as a bulk mass
    // topped by THREE tabular slabs of descending height (left tall → centre lower →
    // right lowest calved block) so the skyline STEPS DOWN like a real massif, plus one
    // tilted wedge cap so no edge reads machined. Ice breaks in wedges and steps, never
    // in neat right-angle rebates.
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.54, 0.62, 0.56, 5), { x: 0.05, y: 0.30, ry: 0.4, sx: 1.4, sz: 0.9 }) }, // bulk mass
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.70, 0.30, 0.48), { x: -0.30, y: 0.72, ry: 0.08 }) },                  // tall tabular slab (skyline high, left)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.60, 0.22, 0.46), { x: 0.28, z: -0.04, y: 0.60, ry: -0.06 }) },        // lower slab (skyline step-down, right)
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.30, 0.38, 0.30, 5), { x: 0.62, z: 0.10, y: 0.40, ry: 1.6 }) },   // lowest calved block (far right — the last step)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.34, 0.20, 0.30), { x: -0.56, z: 0.06, y: 0.66, ry: 0.5, rz: 0.20 }) },// tilted wedge cap (breaks the flat machined line)
    ], 2),
    place: (side, rnd) => ({ x: side * (40 + rnd() * 24), h: 14 + rnd() * 8, r: 34 + rnd() * 16, tilt: 0 }),
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
  // AURORA SHALLOWS (§sky-owns-the-frame): Frozen's OPPOSITE. A flat tabular ICE FLOE —
  // a RAFTED PACK FLOE (~112 tris): an irregular heptagon pan with a flared rammed base, two
  // smaller pans rafted on top (stepped shelf silhouette — the profile that survives the r≫h flatten),
  // a leaning fracture-plate PAIR (one dark, one lit), and a flush refrozen melt-pond inlay. Cylinders,
  // NOT boxes: no 90° dihedral reads as a crate at the waterline. h 1.2–2.6 LOW, r 4–11 WIDE.
  floe: {
    step: 16, biomes: [6], matIndex: 6,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.50, 0.58, 0.36, 7), { y: 0.18, ry: 0.35, sx: 1.15, sz: 0.82 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.32, 0.40, 0.26, 6), { x: 0.14, z: -0.08, y: 0.44, ry: 1.9, rz: 0.10 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.22, 0.28, 0.20, 6), { x: -0.30, z: 0.14, y: 0.36, ry: 4.1, rz: -0.09 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.34, 0.50, 0.10), { x: 0.10, z: -0.02, y: 0.72, ry: 0.50, rz: 0.35 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.26, 0.42, 0.07), { x: 0.02, z: -0.10, y: 0.70, ry: 0.85, rz: -0.42 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.30, 0.05, 0.30), { x: 0.14, z: -0.08, y: 0.575, ry: 1.9 }) },
    ], 6),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 10), h: 1.2 + rnd() * 1.4, r: 4 + rnd() * 7, tilt: side * (rnd() * 0.05 - 0.025) }),
  },
  // A KINKED FANG CLUSTER on a grounded pan (~102 tris): the fangs grow FROM shared ice, each a
  // frustum + off-axis tip (a broken/refrozen KINK that reads in backlight), one leaning away, plus a
  // FALLEN tip lying on the pan (the "fracture" story beat + free asymmetry) and one buried lit sliver.
  // Height CAPPED 2.2–4.6 world (vs crystal 18–50): the "never a tall spire" law holds.
  iceFang: {
    step: 24, biomes: [6], matIndex: 6,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.40, 0.50, 0.18, 6), { y: 0.09, ry: 0.4 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.13, 0.30, 0.52, 5), { y: 0.42, rz: 0.10 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.14, 0.42, 5), { x: 0.07, y: 0.80, rz: -0.14, ry: 0.6 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.09, 0.22, 0.38, 5), { x: 0.30, z: -0.10, y: 0.27, rz: -0.30 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.10, 0.30, 5), { x: 0.40, z: -0.12, y: 0.52, rz: -0.45, ry: 1.3 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.12, 0.36, 5), { x: -0.28, z: 0.12, y: 0.16, rz: 1.35, ry: 0.7 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.05, 0.66, 4), { x: -0.06, z: -0.14, y: 0.40, rz: 0.06 }) },
    ], 6),
    place: (side, rnd) => ({ x: side * (13.5 + rnd() * 6), h: 2.2 + rnd() * 2.4, r: 2.2 + rnd() * 1.6, tilt: side * (rnd() * 0.16 - 0.05) }),
  },
  // Faceted GROWLER (~72 tris): squashed detail-0 icosahedra — 20 flat facets each give per-facet
  // moon-glint variance for free (flatShading). The ROUND-family silhouette (vs floe flat, fang spike)
  // so three genuinely different outlines share the mirror. One accent plate sunk into a facet seam.
  berg: {
    step: 21, biomes: [6], matIndex: 6,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.55, 0), { y: 0.34, sy: 0.62, sx: 1.05, sz: 0.85, ry: 0.3 }) },
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.32, 0), { x: 0.30, z: -0.12, y: 0.20, sy: 0.7, ry: 1.4 }) },
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.24, 0), { x: -0.06, y: 0.80, sy: 0.85, ry: 2.2 }) },
      // .toNonIndexed(): Icosahedron is non-indexed but Box is indexed — mergeGeometries throws on a
      // mix, so the accent box must match the facet parts (this whole archetype is then non-indexed).
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.30, 0.34, 0.06).toNonIndexed(), { x: -0.10, z: 0.06, y: 0.48, ry: 0.9, rz: 0.5, rx: 0.1 }) },
    ], 6),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 8), h: 1.6 + rnd() * 1.4, r: 2.6 + rnd() * 2.4, tilt: side * (rnd() * 0.12 - 0.04) }),
  },
  // Dark glacial SKERRY (~40 tris): NO accent, NO glow — bare rock. The foil that makes the ice
  // accents feel EARNED, and dark punctuation scattered across the mirror (the real-lake-photo read).
  // Flattened to a squat boulder by the r>h instance scale — the lowest thing in the game (top ≤ 1.4u).
  skerry: {
    step: 12, biomes: [6], matIndex: 6,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.55, 0), { y: 0.50, sx: 1.1, sz: 0.85, ry: 0.7 }) },
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.30, 0), { x: 0.36, z: 0.10, y: 0.28, ry: 1.9 }) },
    ], 6),
    place: (side, rnd) => ({ x: side * (12.5 + rnd() * 9), h: 0.6 + rnd() * 0.8, r: 1.4 + rnd() * 1.6, tilt: side * (rnd() * 0.2 - 0.06) }),
  },
  // Distant RIDGE massif (~52 tris): a jagged multi-peak mountain far off-lane (|x| ≥ 28) that crops
  // the aurora at the horizon and gives the frame depth + scale (Fable composition note). Peaks spread
  // in x AND z (radial) so it reads as a mountain from ANY yaw (recycle re-randomizes rotY). mat 0 only,
  // foam:false — a foam ring on a distant massif would be a bright off-lane artifact. Fog grades it to
  // near-black against fogFarColor; the sky dome draws behind it → the curtain is cropped for free.
  ridge: {
    step: 80, biomes: [6], matIndex: 6,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.50, 1.00, 5), { y: 0.50, sz: 0.62 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.42, 0.72, 5), { x: -0.34, z: 0.18, y: 0.36, sz: 0.6, ry: 0.8 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.38, 0.56, 4), { x: 0.36, z: -0.14, y: 0.28, sz: 0.6, ry: 0.4 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.30, 0.40, 4), { x: 0.05, z: 0.30, y: 0.20, sz: 0.6 }) },
    ], 6),
    place: (side, rnd) => ({ x: side * (28 + rnd() * 18), h: 5 + rnd() * 3.5, r: 20 + rnd() * 12, tilt: 0 }),
  },
  // THE SUN GATE — the hero focal landmark (~108 tris, Move 2). Paired flat-topped
  // TABULAR ice pylons (icetower/bergwall block vocabulary, NO spikes) that flank the
  // lane and frame the low sun — a doorway of light. `hero:true` phase-LOCKS it to the
  // composition congregation PEAK (frozenComp phase 0.15) via a fixed slot jitter, and
  // a per-peak hash makes it RARE (one gate on ~40% of peaks). `paired:true` seats the
  // left+right posts at the SAME distance. GATE-SAFE: at |x| 24-27 with the gap-facing
  // (+x, mirrored inward by rotY) footprint ≤ 0.58, the inner edge stays ≥ 17 — clear of
  // the ±16 gameplay-gate veil from any chase-cam pose (occlusion divergence proof). The
  // gap carves real god-ray shafts (occlusion mask) and doubles in the water mirror.
  // Registered LAST so no existing band's render-rnd stream shifts.
  // THE SUN GATE — the hero focal landmark (~144 tris, rebuilt to the Fable studio
  // gate P1). A pair of MASSIVE flat-topped ice pylons that flank the lane and frame
  // the low sun as a doorway of light. The Fable studio gate killed the prior version
  // (1.8/5) as "two skinny towers" (~6:1 obelisks, an LED stripe, no doorway). This
  // rebuild answers its six points, ALL via offset-stacking (rotation gets sheared
  // flat by the (r,h,r) instance scale — lateral OFFSET survives it):
  //   • MASS: fat tabular base slab (~40% of height) + a wide footprint → ~2.5:1, not 6:1.
  //   • LEAN toward the gap: every block's centre steps progressively toward +x (the
  //     gap-facing side, mirrored inward by rotY), so the two pylons' silhouettes
  //     CONVERGE — that convergence is what makes the sky between them read as a door.
  //   • REACHING CAP: a wide capstone cantilevered furthest of all into the gap — the
  //     implied broken lintel; the two caps nearly meet overhead.
  //   • ROOTED FEET: half-buried serac chunks skirt the base (grows from an ice apron).
  //   • CREVASSE CORE (not an LED strip): a recessed emissive chasm between two proud
  //     ribs on the front face — light escaping the ice, per the kit accent language.
  // +x = the gap-facing side (rotY = π mirrors it inward on the +x post). GATE-SAFE:
  // max +x extent is the cap at 0.54; at r ≤ 15, x ≥ 27 → inner edge ≥ 18.9, clear of
  // the ±16 gameplay-gate veil. Registered LAST so no band's render-rnd stream shifts.
  sungate: {
    step: 300, biomes: frozenNew, matIndex: 2, paired: true, hero: true,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.62, 0.72, 0.44, 6), { x: -0.14, y: 0.22, ry: 0.3 }) },     // FAT tabular base slab (~40% height — the mass), seated OUTward
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.92, 0.34, 0.86), { x: -0.04, y: 0.55, ry: 0.12 }) },            // lower block — WIDER + DEEPER (chunk, not slab); grows toward the outer side
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.80, 0.40, 0.66), { x: 0.08, y: 0.80, ry: -0.10 }) },            // mid mass — fatter; steps toward the gap (convergence)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.14, 0.48, 0.18), { x: 0.03, z: 0.30, y: 0.82 }) },              // crevasse rib L (thin + proud → a deep chasm, not fat ribs)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.14, 0.48, 0.18), { x: 0.25, z: 0.30, y: 0.82 }) },              // crevasse rib R (thin + proud)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.64, 0.32, 0.54), { x: 0.16, y: 1.05, ry: 0.20 }) },             // upper block — fatter; steps further toward the gap
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.72, 0.18, 0.58), { x: 0.22, y: 1.23, ry: 0.10, rz: 0.06 }) },   // capstone CANTILEVERED + angled DOWN into the gap — the broken lintel reaching for its twin
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.46, 0.28, 0.42), { x: 0.24, z: 0.18, y: 0.13, ry: 0.5, rz: -0.05 }) },  // rooted foot rubble (gap side) — a grounded chunk, not a flare
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.44, 0.26, 0.40), { x: -0.34, z: -0.14, y: 0.12, ry: 1.0, rz: 0.06 }) }, // rooted foot rubble (outer side)
      // recessed crevasse core — the SAME deep 2-segment chasm used on bergwall/serac (wider core, set well back so the ribs overhang it), not a thin single bar
      ...crevasseCore({ x: 0.14, y: 0.80, z: 0.34, h: 0.44, w: 0.10, seg: 2 }),
    ], 2),
    // MASSIVE + gate-safe: r 12-15 (wide footprint for mass, not a pole), h 40-49
    // (towers over the congregation), x 27-30 (inner edge ≥ 18.9). tilt is tiny — the
    // convergence is carried by the offset-stack, not a shear-prone rotation.
    place: (side, rnd) => ({ x: side * (27 + rnd() * 3), h: 38 + rnd() * 8, r: 13 + rnd() * 3, tilt: side * (-0.015 - rnd() * 0.01), rotY: side > 0 ? Math.PI : 0 }),
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
  // Sunset Glacier kit (v2) — the waterline weld between silhouette + reflection;
  // glacierwall floats on the fog line so it takes no collar.
  bergwall: { r: 0.9 }, serac: { r: 0.7 }, terrace: { r: 0.9 }, icetower: { r: 0.8 }, glacierwall: false, sungate: { r: 0.8 },
  basalt: { r: 0.62 }, vent: { r: 0.72 }, glowcap: { r: 0.34 }, glowcapSmall: { r: 0.28 },
  spirevine: { r: 0.26 }, monolith: { r: 0.4 }, arcshard: { r: 0.55 },
  floe: { r: 0.72 }, iceFang: { r: 0.62 }, berg: { r: 0.62 }, skerry: { r: 0.55 }, // aurora ice — the waterline weld between silhouette + reflection
  ridge: false, // distant massif — a foam ring 30+ off-lane would be a bright artifact
};
for (const [name, cfg] of Object.entries(FOAM_CFG)) if (ARCHETYPES[name]) ARCHETYPES[name].foam = cfg;

// --- Diagnostic export (tools/envcount.mjs) — BEHAVIOR-INERT -----------------
// Builds every archetype headlessly and reports its geometry/material/instance
// stats so the env-overdraw/geometry guard (WALL-PROPS-REDESIGN.md §8.2) can
// assert against them. NEVER imported by the running game — `ARCHETYPES`,
// `propMats` and `WALL_WINDOW` are module-private by design, and
// `createEnvironment` is too heavy to run headless (it builds the sky shader,
// arena, ambient and IBL probe), so the tool reaches the archetype geometry
// through this one narrow, side-effect-free window instead. Calling it merely
// lazily initialises the SAME `propMats` the game builds (no canvas/renderer
// needed) — it changes nothing about runtime behaviour.
// --- Studio export (tools/propstudio) — BEHAVIOR-INERT ----------------------
// Builds ONE archetype as a live THREE.Mesh (or the L+R pair for a `paired`
// hero) at a representative in-game instance scale (r,h,r), base at y=0, so a
// prop can be judged in ISOLATION in a neutral studio (the dragonstudio pattern
// applied to props). Uses a FIXED mid-range rnd so the render is reproducible.
// The nonuniform (r,h,r) scale is applied exactly as writeMatrix does — that
// shear IS part of how the prop reads in-game, so the studio must not hide it.
// Never imported by the running game; like propDiag it just lazily builds the
// SAME propMats the game builds.
export function buildArchetypeMesh(key, opts = {}) {
  if (!propMats) propMats = makeMats();
  const def = ARCHETYPES[key];
  if (!def) throw new Error('propstudio: no archetype "' + key + '"');
  const group = new THREE.Group();
  // Deterministic mid-range draw sequence (a real prop pulls 3-5 rnd()s per place()).
  const seq = opts.rnd || [0.5, 0.35, 0.62, 0.5, 0.42, 0.58, 0.5, 0.48];
  let ri = 0;
  const rnd = () => seq[(ri++) % seq.length];
  const makeOne = (side) => {
    const { geometry, materials } = def.build();
    const mesh = new THREE.Mesh(geometry, materials.length > 1 ? materials : materials[0]);
    const p = def.place(side, rnd);
    mesh.scale.set(p.r, p.h, p.r);          // world instance scale (r,h,r) — same as writeMatrix
    // Paired hero: seat L/R at real ±x (gapScale 1 = honest in-game spacing; <1
    // pulls the posts into a tighter doorway study). Single/non-paired: centre it.
    const gs = opts.gapScale != null ? opts.gapScale : 1;
    mesh.position.set(opts.single ? 0 : p.x * gs, 0, 0);
    mesh.rotation.z = p.tilt || 0;
    mesh.rotation.y = p.rotY != null ? p.rotY : 0;
    group.add(mesh);
  };
  if (def.paired && opts.single !== true) { makeOne(-1); ri = 0; makeOne(1); }
  else makeOne(1);
  return group;
}
// The keys the studio iterates (the live Frozen kit), so the driver need not
// hardcode a list that could drift from the roster.
export function frozenPropKeys() {
  return Object.entries(ARCHETYPES).filter(([, d]) => d.biomes.includes(2)).map(([k]) => k);
}

export function propDiag() {
  if (!propMats) propMats = makeMats();
  return Object.entries(ARCHETYPES).map(([name, def]) => {
    // build() THROWS here on an indexed/non-indexed mergeGeometries mix or a
    // `mat >= 2` part — i.e. this loop IS the headless boot-crash catch that a
    // live createEnvironment would otherwise only surface in the browser.
    const { geometry, materials } = def.build();
    const pos = geometry.getAttribute('position');
    const tris = Math.round((geometry.index ? geometry.index.count : pos.count) / 3);
    const mats = materials.map((m) => ({
      transparent: m.transparent === true,
      depthWriteFalse: m.depthWrite === false,
      additive: m.blending === THREE.AdditiveBlending,
    }));
    geometry.dispose();
    return {
      name,
      biomes: def.biomes.slice(),
      step: def.step,
      instances: Math.ceil(WALL_WINDOW / def.step) * 2, // makeBand: perSide × 2
      tris,
      materials: mats,
      // FOAM_CFG assigns `.foam` (possibly `false`) to every archetype it lists;
      // an archetype missing from FOAM_CFG has `.foam === undefined` → its foam
      // sibling would draw garbage. `!== undefined` is the completeness probe.
      hasFoam: def.foam !== undefined,
    };
  });
}

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
        // × (1 - uAuroraMix): the SURGE also shifts the whole sky GRADIENT toward magenta — the second
        // (bigger) half of the aurora-biome "color explosion". Suppress it too so the night sky + curtain
        // stay the spectacle during a boost (0 in every other biome → byte-identical).
        vec3 hor = mix(horizonColor, horF, feverMix * 0.8 * (1.0 - uAuroraMix));
        vec3 mid = mix(midColor, midF, feverMix * 0.7 * (1.0 - uAuroraMix));
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
        // × (1 - uAuroraMix): in Aurora Shallows the CURTAIN is the sky spectacle — the magenta SURGE wash
        // on top of it is the "color explosion" the owner kept seeing (it is NOT the aurora eruption, which
        // is why cutting the eruption never fixed it). Suppress it here like the night-surge veil below.
        col += aurora * curtain * feverMix * 0.35 * (1.0 - uAuroraMix);
        // Starfield (night biomes): hashed cells in the upper dome, gently
        // twinkling. Branchless — multiplied to zero outside night biomes.
        vec3 cell = floor(d * 110.0);
        float sh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = smoothstep(0.9965, 1.0, sh)
                   * (0.6 + 0.4 * sin(time * 2.0 + sh * 90.0))
                   * smoothstep(0.04, 0.3, h);
        // Aurora Shallows: the curtain is nearer than the stars — dim them where it burns
        // (aurLum is 0 in every other biome, so this is a branchless no-op there).
        star *= 1.0 - 0.55 * clamp(aurLum, 0.0, 1.0);
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
    ARCHETYPES[key]._salt = saltFromKey(key); // stable per-archetype salt for the composition hash (§Move 1)
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
  // Paired archetypes: left+right of a slot must land at the SAME distance (shared
  // jitter). HERO archetypes go further — a FIXED jitter that phase-locks every slot
  // to the congregation peak: dist % period === HERO_PEAK_OFFSET (frozenComp 0.15).
  // Stored on the band so reseedBand re-seats it identically (pairing survives restart).
  const slotJit = def.hero ? new Array(perSide).fill((HERO_PEAK_OFFSET + 100) / def.step)
    : def.paired ? Array.from({ length: perSide }, () => rnd()) : null;
  band.slotJit = slotJit;
  let idx = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < perSide; i++) {
      const dj = slotJit ? slotJit[i] : rnd();
      const d = { side, slot: i, dist: i * def.step + dj * def.step - 100, ...def.place(side, rnd) };
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

// --- Composition rhythm (Move 1, WALL-PROPS-REDESIGN §composition) -----------
// A deterministic macro-rhythm over BLOCK-LOCAL distance for FROZEN props only:
// CONGREGATION (dense, larger masses) → MIRROR-BREATH (near-empty: open fog-sea +
// reflections + low pack-ice) → repeat. 5 periods per 1500m block so every biome
// visit is IDENTICAL and the entry/exit beats are authored (first breath ~195m in,
// last breath against the exit seam). Applied at WRITE time (park + uniform scale)
// — a PURE function (no rnd), render-only, zero per-frame cost. Byte-identical
// outside Frozen: only the Frozen archetypes carry a `comp` block, and the whole
// term is gated on `bi === 2`. glacierwall carries NO comp → it stays the
// unmodulated fog-line backdrop (the horizon must never breathe empty).
const FROZEN_COMP_PERIODS = 5;
function frozenComp(dist) {
  const L = CONFIG.biomeLength;                              // 1500
  const local = ((dist % L) + L) % L;                       // 0..L (negative-safe)
  const seg = L / FROZEN_COMP_PERIODS;                       // 300m
  const ph = (local % seg) / seg;                           // 0..1 within the period
  // congregation weight g: 1 near ph=0.15 (dense), 0 near ph=0.65 (breath); smooth
  // raised cosine so slots fade in/out along the ramp — a spatial fade, no pops.
  return 0.5 + 0.5 * Math.cos(2 * Math.PI * (ph - 0.15));
}
// Stable per-instance keep value in [0,1) — a PURE hash of (archetype salt, side,
// slot). Includes `side` so left/right slots don't park symmetrically (mirrored gaps).
function compHash(salt, side, slot) {
  let h = (salt ^ Math.imul(slot + 1, 2246822519) ^ (side > 0 ? 0x9e3779b9 : 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function saltFromKey(key) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}
// Hero-landmark rarity (Move 2): a PURE hash of the integer congregation-PEAK index →
// [0,1). Side-agnostic so a paired hero keeps or parks BOTH posts together (no half-gate).
function heroHash(n) {
  let h = Math.imul(((n | 0) ^ 0x9e3779b9) >>> 0, 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const HERO_PEAK_OFFSET = 45;   // frozenComp phase 0.15 lands at (dist % 300) === 45 (the congregation peak)

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const posV = new THREE.Vector3();
const sclV = new THREE.Vector3();
function writeMatrix(band, i, d) {
  // Park instances whose archetype doesn't belong to the biome at their
  // distance — they re-enter when recycled into a matching stretch.
  const bi = biomeIndexAt(Math.max(d.dist, 0));
  let active = band.def.biomes.includes(bi);
  eul.set(0, d.rotY ?? (d.rotY = rnd() * Math.PI), d.tilt); // rnd order MUST stay here (determinism outside Frozen)
  quat.setFromEuler(eul);
  // Composition rhythm — FROZEN only, PURE (no rnd), evaluated AFTER the rotY init
  // so no rnd() call order changes. Parks off-beat instances and scales the rest.
  let k = 1;
  if (active && bi === 2 && band.def.comp) {
    const g = frozenComp(d.dist);
    const c = band.def.comp;
    const density = c.floor + (1 - c.floor) * g;            // fraction of this archetype's slots kept here
    if (compHash(band.def._salt, d.side, d.slot) >= density) active = false; // park (off-beat)
    else k = c.sMin + (c.sMax - c.sMin) * g;                // uniform SIZE scale (never the x POSITION)
  } else if (active && bi === 2 && band.def.hero) {
    // Hero landmark (Sun Gate): phase-locked to the congregation peak by its fixed
    // slot jitter; a per-peak hash keeps it on only ~40% of peaks so it reads as THE
    // hero. Renders at full size (k=1) or not at all — never the comp scale lottery.
    const peakIdx = Math.round((d.dist - HERO_PEAK_OFFSET) / (CONFIG.biomeLength / FROZEN_COMP_PERIODS));
    if (heroHash(peakIdx) >= 0.4) active = false;
  }
  if (active) {
    m4.compose(posV.set(d.x, -0.5, -d.dist), quat, sclV.set(d.r * k, d.h * k, d.r * k));
  } else {
    m4.compose(posV.set(d.x, -50, -d.dist), quat, sclV.set(0.0001, 0.0001, 0.0001));
  }
  band.mesh.setMatrixAt(i, m4);
  // N10c: write the foam ring at the same index — inherits the prop's active/parked
  // state (always written, so the toggle is a pure visibility flip, correct mid-run).
  writeFoamMatrix(band.foam, i, d, band.def.foam, active, k);
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
      const rjit = rnd() * Math.PI; // always draw (keep the shared stream count), but…
      // …a paired/hero prop keeps its AUTHORED rotY (mirrored gate posts, seam-inward);
      // dist += WALL_WINDOW (= 3 periods) preserves the phase-lock/pairing for free.
      Object.assign(d, fresh, { dist: d.dist + WALL_WINDOW, rotY: fresh.rotY ?? rjit });
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
    const fresh = band.def.place(d.side, rnd);
    const djit = rnd();           // always draw (keep the shared stream count), but…
    const rjit = rnd() * Math.PI; // …paired/hero bands re-seat from their stored slotJit
    // (pairing + phase-lock survive restart) and keep their authored rotY.
    Object.assign(d, fresh, {
      dist: d.slot * band.step + (band.slotJit ? band.slotJit[d.slot] : djit) * band.step - 100,
      rotY: fresh.rotY ?? rjit,
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
  // Aurora ground-glow pulse (COLOR space only — hemi.intensity is owned by the sky probe): the
  // world faintly answers the curtain. Quiet breath 10–18% toward green; eruption creeps rose in.
  // mix is 0 in every other biome → byte-identical there.
  const _ap = auroraPulse();
  if (_ap.mix > 0.001) {
    hemi.color.lerp(_AUR_HEMI_GREEN, _ap.mix * (0.10 + 0.08 * _ap.breath));
    hemi.color.lerp(_AUR_HEMI_ROSE, _ap.mix * _ap.erupt * 0.16);
  }
  hemi.groundColor.copy(env.hemiGround);
  setWaterTint({
    deep: env.waterDeep,
    shallow: env.waterShallow,
    // tier2 analytic-reflection aurora sheen (uAuroraGlow): the cheap water path has no mirror, so
    // paint a horizonward green glow into its reflection. 0 in every other biome (byte-identical);
    // the reflective tiers ignore it (they mirror the real curtain for free).
    auroraGlow: _ap.mix * (0.20 + 0.25 * _ap.act + 0.35 * _ap.erupt),
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
