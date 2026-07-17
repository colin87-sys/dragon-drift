import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { CONFIG } from './config.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { biomeIndexAt, computeEnv, TEMPEST_WIND } from './biomes.js';
import { applyArenaSkin } from './arenaSkin.js';
import { setWaterTint } from './water.js';
import { createAmbient, updateAmbient } from './ambient.js';
import { createRain, updateRain, setRainTier, rainGustAt, setRainFlash } from './rain.js';
import { initStormLightning, updateStormLightning, setStormLightningEnabled, getStormFlashSky, getStormFlashRain, getStormFlashDir } from './stormLightning.js';
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
// Per-biome god-ray fan scale (seam-lerped in computeEnv; 1 = shipped/byte-identical).
// A night biome meters the shared sun-shaft fan down (Lumen Mire). Read by main.js.
let _godrayMul = 1;
export function godrayMul() { return _godrayMul; }
// Per-biome god-ray shaft tint (seam-lerped; shipped warm-white = byte-identical). Read by main.js.
const _godrayTint = new THREE.Color(1.0, 0.9, 0.72);
export function godrayTint() { return _godrayTint; }
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
  uniform float uPropAerial; uniform vec3 uPropAerialCol;   // Fable 75: per-biome aerial-perspective lever (0 = shipped)
  float _hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  float _vnoise(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
    float n000=_hash13(i), n100=_hash13(i+vec3(1,0,0)), n010=_hash13(i+vec3(0,1,0)), n110=_hash13(i+vec3(1,1,0));
    float n001=_hash13(i+vec3(0,0,1)), n101=_hash13(i+vec3(1,0,1)), n011=_hash13(i+vec3(0,1,1)), n111=_hash13(i+vec3(1,1,1));
    return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
               mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
  }
  void main() {`;

// AERIAL PERSPECTIVE (Fable 75) — a per-biome depth-ember lever on the shared prop shader:
// distant props LIGHTEN + hue-shift toward the horizon ember (the painterly cue the flat-black
// Mire silhouettes lacked). moteDepthFade pattern: shared uniform objects, driven per-frame from
// the lerped env (0 for every biome that doesn't set propAerial → byte-identical). The Mire's dark
// fogFarColor can only pull props toward a DARKER amber; this is the only mechanism that makes
// distance lighten them. `vFogDepth` (the fog chunk's view-space depth) is the free depth signal.
const propAerialUniform = { value: 0 };                        // 0 = byte-identical (the other 6 biomes)
const propAerialColor   = { value: new THREE.Color(0x000000) };

// Fable 79 HERO BACKLIT-RIM lever — a per-biome optional channel (0 everywhere but the Mire) that
// dragon.js reads each frame to backlight the drake's silhouette in the biome's horizon colour. Not a
// shader uniform (the rim GLSL is untouched); a plain JS signal on the same optional-channel pattern.
let heroRimK = 0;
const heroRimCol = new THREE.Color();
const _heroRim = { k: 0, color: heroRimCol };
export function getHeroRim() { _heroRim.k = heroRimK; return _heroRim; }

function addPropDetail(mat, ladderEmissive = false) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uAO = aoUniform; // N15 shared AO gate (0 = shipped)
    shader.uniforms.uPropAerial = propAerialUniform;    // Fable 75 aerial lever (0 = shipped)
    shader.uniforms.uPropAerialCol = propAerialColor;
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
        diffuseColor.rgb *= max((0.86 + 0.26 * _pn) * mix(1.0, vAO, uAO), 0.62);   // N15 AO + weathering (floored)
        #ifdef USE_FOG
        // AERIAL PERSPECTIVE (Fable 75): depth-blend the albedo toward the ember haze. <55m stays
        // the untouched pure-black near-trunk anchor; ≥230m full. Quadratic ease → no quantized bands
        // (hard bands pop as props approach). uPropAerial 0 ⇒ mix factor 0 ⇒ byte-identical.
        float _aer = smoothstep(55.0, 230.0, vFogDepth); _aer *= _aer * uPropAerial;
        diffuseColor.rgb = mix(diffuseColor.rgb, uPropAerialCol, _aer * 0.50);
        #endif`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance *= 0.78 + 0.44 * _pn;${ladderEmissive ? `
        // CALDERA self-lit floor: fold the baked value-ladder (vColor) into emissive so
        // the hot ember belly stays lit when a dark basalt mass silhouettes against the
        // bright ember horizon (vColor alone only modulates DIFFUSE → dies backlit).
        totalEmissiveRadiance *= vColor.rgb;` : ''}
        #ifdef USE_FOG
        // AERIAL PERSPECTIVE (Fable 75) — the term that ACTUALLY shows: these props are near-black
        // diffuse under a 0.2-intensity sun, so a diffuse mix alone dies backlit. ADD the ember haze
        // to emissive (air is not modulated by surface weathering → after the ladder line, not before).
        totalEmissiveRadiance += uPropAerialCol * (_aer * 0.40);
        #endif`);
  };
  // Own cache bucket so these never share a program with plain standard mats (the
  // ladder variant gets its own bucket — it references vColor / compiles differently).
  mat.customProgramCacheKey = () => (ladderEmissive ? 'propDetailLadder' : 'propDetail');
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
      new THREE.MeshStandardMaterial({ ...opts, color: 0x0d1410, emissive: 0x0a1508, emissiveIntensity: 0.1 }),   // 4 LUMEN MIRE dead/wet matter — near-black warm-neutral bark/root/mud; "matter drinks" (light-absorbing); the low emissive is only a crush floor, never a light source
      new THREE.MeshStandardMaterial({ ...opts, color: 0x3a3a6a, emissive: 0x16164a, emissiveIntensity: 0.4 }),   // astral slate
      new THREE.MeshStandardMaterial({ ...opts, color: 0x26424e, roughness: 0.26, metalness: 0.12, emissive: 0x0d2a26, emissiveIntensity: 0.22 }), // 6 aurora night sea-ice — near-black silhouette, per-facet moon glints
      new THREE.MeshStandardMaterial({ ...opts, color: 0x4b545c, roughness: 0.34, metalness: 0.06, emissive: 0x1a2228, emissiveIntensity: 0.18 }), // 7 tempest storm slate — wet dark rock (PR-1 replaces with the wind-scour vertex-colour ladder mats)
    ],
    accent: [
      new THREE.MeshStandardMaterial({ ...opts, color: 0xc08a50, roughness: 0.5, metalness: 0.25, emissive: 0x2a1505, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xb56a40, emissive: 0x251005, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xd8f6ff, roughness: 0.22, emissive: 0x3fc8e8, emissiveIntensity: 0.85 }),   // Sunset Glacier: the CYAN CORE — the light inside the ice (Candle slivers + Sail panes only; warm is NEVER emissive)
      new THREE.MeshStandardMaterial({ ...opts, color: 0xff5a20, roughness: 0.4, emissive: 0xff3a08, emissiveIntensity: 0.9 }),  // magma seams
      new THREE.MeshStandardMaterial({ ...opts, color: 0xffc23a, roughness: 0.35, emissive: 0xf79a2e, emissiveIntensity: 1.6 }), // 4 LUMEN MIRE living amber glow — firefly-gold gills/motes/lanterns; "life glows" (the ONLY emitter); off-teal by construction (~562nm warm, never 490–510nm). Fable v33: emissive ×~1.8 so existing glow pulls weight until PR-3
      new THREE.MeshStandardMaterial({ ...opts, color: 0x9fb8ff, roughness: 0.3, emissive: 0x5a78ff, emissiveIntensity: 1.1 }),  // starlit crystal
      new THREE.MeshStandardMaterial({ ...opts, color: 0x78b0a0, roughness: 0.18, metalness: 0.05, emissive: 0x1c5c48, emissiveIntensity: 0.42 }), // 6 aurora-caught ice edge — paler/glassier, a LIT edge not a lamp
      new THREE.MeshStandardMaterial({ ...opts, color: 0xcaa25a, roughness: 0.4, metalness: 0.05, emissive: 0xffd870, emissiveIntensity: 1.5 }), // 7 tempest STOLEN GOLD — THE one burning hue in a monochrome storm (Fable: ink-dark rock + warm pale slot + rare burning gold = Tsushima storm grammar). @0.85 was invisible against grey; @1.5 makes the socket the biome's single warm accent
    ],
  };
  for (const m of mats.primary) addPropDetail(m);
  for (const m of mats.accent) addPropDetail(m);
  // EMBERFALL CALDERA new-kit materials (CALDERA-BIBLE.md §5) — kept SEPARATE from the
  // legacy primary/accent[3] (which stay flat for ?props=v1). The primary is a DARK
  // basalt whose carved read comes entirely from the inverted value ladder: color white
  // so the baked vColor stops (hot ember belly / ash-grey crust / near-black vertical)
  // show through, run through addPropDetail(ladderEmissive) so the belly stays lit
  // backlit. A warm emissive BASE biases the folded emissive toward ember (belly glows,
  // crown reads dark) — the theology's "mass is dark; light is a wound" made material.
  mats.calderaPrimary = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffffff, vertexColors: true, roughness: 0.42, metalness: 0.06,
    emissive: 0xff5a20, emissiveIntensity: 0.5,
  }), true);
  // The magma accent — hot orange-red, graded white-hot only inside recessed throats
  // (per-archetype). vertexColors OFF so it ignores the ladder bake on shared geometry.
  mats.calderaAccent = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xff6a24, roughness: 0.4, metalness: 0.05, emissive: 0xff3808, emissiveIntensity: 1.0,
  }));
  // The FOIL material (CALDERA-BIBLE.md §4.4) — desaturated warm-dark basalt, NO ladder and
  // NO glow: the bare dark mass whose whole job is to make the lit archetypes feel earned.
  // flatShading facets + weathering noise carry the form; a low emissive floor keeps it from
  // crushing to pure void without ever reading as a light source. (Used by clinker.)
  mats.calderaFoil = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0x2b1d18, roughness: 0.72, metalness: 0.04, emissive: 0x160a06, emissiveIntensity: 0.14,
  }));
  // THE LUMEN MIRE hero escalator (Fable v42) — a hero-ONLY brighter living-amber instance
  // (intensity 2.3 vs the standard accent[4]'s 1.6) for the glowcolossus's crown colonies +
  // gill fold, so the landmark's glow reads from the game's top-down camera (the under-brim
  // address is invisible to a down-looking cam; the crown colonies are the granted exception).
  // Same firefly-amber family (off the 490–510nm teal band). ONLY glowcolossus uses this.
  mats.mireHeroLiving = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffc23a, roughness: 0.35, emissive: 0xf79a2e, emissiveIntensity: 2.3,
  }));
  // THE MIRE GLOW-LADDER hero material (Fable ensemble plan §3) — the living-amber emitter but
  // vertexColors ON + ladderEmissive, so the baked bakeMireLadder gradient (apex-bright →
  // root-dark) folds into BOTH diffuse and emissive: the glow itself is value-structured
  // (core→bloom→dark), killing the flat blown-amber tape read. Same firefly family (off teal).
  // Used by the ensemble heroes (glowarch, glowtree) whose mat-1 group is swapped to this.
  mats.mireHeroLadder = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffc23a, vertexColors: true, roughness: 0.35, emissive: 0xf79a2e, emissiveIntensity: 2.3,
  }), true);
  // THE MIRE FAR-BEACON material (Fable ensemble §3 tier 2) — the world-tree's DEEPER GOLD glow at a
  // LOWER intensity (1.15 vs the hero arch's 2.3): distance desaturates toward gold, so the far beacon
  // is pre-hazed by design and never competes with the near arch as a second bright white. Also
  // ladder-reading (vertexColors + ladderEmissive) so the tree's crown reads core→bloom→dark.
  // @1.8 (Fable 60-ruling): the Mire is self-lit (sun 0.2) and the beacon is judged at ~150m where
  // linear fog eats ~50% of even emissive output — @1.15 vanished in-game. 1.8 sits between the arch's
  // 2.3 (tier 1) and the cap's 1.6 (tier 3); after the fog haircut the tree's perceived crown is ~0.9,
  // so the eye still reads arch(near) > tree(far). HARD CAP OF RECORD: never exceed 1.9 (dial the ladder/
  // clearing past this, never the constant).
  mats.mireFarLiving = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xf7b048, vertexColors: true, roughness: 0.4, emissive: 0xf08c28, emissiveIntensity: 1.8,
  }), true);
  // THE MIRE CARRIER-LADDER material (Fable 65-gate R1) — tier-3 stock mireLiving values (0xffc23a /
  // 0xf79a2e @1.6, UNCHANGED intensity so the carrier stays a carrier) but vertexColors + ladderEmissive,
  // so the glowshroom cap reads core (crown boss → white) → bloom (dome → gold) → dark (rim) instead of a
  // flat blown dome. NOT mireHeroLadder (2.3) / mireFarLiving (1.8) — reusing those would promote the tier.
  mats.mireCarrierLadder = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffc23a, vertexColors: true, roughness: 0.35, emissive: 0xf79a2e, emissiveIntensity: 1.6,
  }), true);
  // THE MIRE EMBER material (Fable ensemble §3 tier 4) — the glowbloom near-scatter breadcrumbs: the
  // PALE afterglow hue, dimmest tier (the lane written in embers, never lanterns competing with the hero).
  // Blooms are NEAR (low fog tax) so @0.85 still reads. Own material so the pale hue never touches a hero.
  mats.mireEmberLiving = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffd98a, roughness: 0.4, emissive: 0xffc86a, emissiveIntensity: 0.85,
  }));
  // THE MIRE DEPTH-VEIL material (Fable 75 lever 2b) — the aerial lever (2a) makes distance
  // LIGHTEN; this breaks the SECOND flatness: a near/mid mass reading as one flat black shape
  // internally. A baked canopy-light→trunk-dark value ladder (vertexColors + ladderEmissive) so
  // every veil mass carries a top-lit crown → drowned-black waterline gradient. NOT the shared
  // primary[4] (flipping vertexColors there would break the hero-colossus dark groups, which
  // carry no color attribute). Own dark warm-neutral base; a faint moss-amber emissive keeps the
  // crown's warm read when the mass silhouettes against the ember horizon. canopywall/boleveil/
  // drape only (reedveil skipped — thin near verticals would read as glow-sticks).
  mats.mireVeil = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0x241b10, vertexColors: true, roughness: 0.7, metalness: 0.05,
    emissive: 0x2a1c0e, emissiveIntensity: 0.5,
  }), true);
  // THE LOST LAGOON new-kit materials (LOST-LAGOON-BIBLE.md §3) — its OWN palette, distinct from
  // Frozen ice and Caldera basalt. The stone reads via the position-keyed TIDE ladder (color white so
  // the baked vColor stops show through: bleached bone-amber crown / jade life-band at the waterline /
  // drowned slate below). Warm-neutral emissive base so the jade band survives backlight (ladderEmissive
  // fold) WITHOUT the stone ever reading as a light source — "stone is a record, not a light."
  mats.lagoonStone = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffffff, vertexColors: true, roughness: 0.62, metalness: 0.04,
    emissive: 0xc7cbae, emissiveIntensity: 0.26,   // lower + cooler base so the diffuse jade tide-band survives (not washed to cream)
  }), true);
  // GILT accent — ancient temple gold, seen ONLY inside recessed aperture reveals (arch intrados,
  // oculus rim, belfry). vertexColors OFF so it ignores the tide bake on shared geometry.
  mats.gilt = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffd28a, roughness: 0.4, metalness: 0.08, emissive: 0xffb040, emissiveIntensity: 0.65,
  }));
  // FOIL — the bare no-glow masonry (wrackstone), NO ladder, NO gilt: the silence that earns the gilt.
  mats.lagoonFoil = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0x6f7a68, roughness: 0.74, metalness: 0.03, emissive: 0x1a241f, emissiveIntensity: 0.12,
  }));
  // TEMPEST REACH new-kit material (TEMPEST-REACH-BIBLE.md) — a FOURTH ladder, the WIND-SCOUR
  // ladder: cool-dominant storm slate whose carved read comes entirely from the baked vColor
  // stops keyed to the scour axis (wind-facing = pale SCOUR / body = DAMP / waterline belly =
  // SOAKED). color white so the ladder shows through; a DARK cool emissive base so the ladder
  // survives backlight against the pale storm horizon (ladderEmissive fold) WITHOUT the wet
  // rock ever reading as a light source — ENTIRELY BARE (no accent/gold anywhere). roughness
  // 0.34 = a wet storm-scoured sheen. storm-teal is BANNED — this stays value-structured slate.
  mats.tempestStone = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xffffff, vertexColors: true, roughness: 0.34, metalness: 0.05,
    emissive: 0x5a6a78, emissiveIntensity: 0.12,   // Fable device critique: the old NEUTRAL grey @0.30 milked
    // the whole ladder toward one flat mid-grey (F2 — grey emissive is fog, not material). Now a DARK COOL-SLATE
    // lift at a low floor: silhouettes still separate from the pale slot, but near rock reads ink-dark + carved
    // and the near→far value ramp finally spans (the ladder vColor folds INTO this via ladderEmissive).
  }), true);
  // (The atmospheric CLOUD-WALL `arcuswall` and its tempestCloud/lip materials are DEFERRED to a future
  //  sky-shader pass — see the archetype note — so no cloud materials are built here.)
  // The virga VEIL — rainshaft ships as thin OPAQUE pale slabs the colour of the far fog (#a7b2b0), so
  // the pale distance makes opaque geometry read as translucent falling rain for free. No accent — it IS
  // light-through-water; a faint emissive keeps it from going muddy in the haze.
  mats.tempestVirga = addPropDetail(new THREE.MeshStandardMaterial({
    ...opts, color: 0xa7b2b0, roughness: 0.95, metalness: 0.0, emissive: 0x8f9a9a, emissiveIntensity: 0.30,
  }));
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

// SHEAR a geometry in x by k·(y − yRef) (Fable device critique P1 — kill the Minecraft staircase). Applied
// AFTER positioning (about the world y=0 base) so a whole stack of strata shears COHERENTLY: their windward
// edges align into ONE continuous diagonal with parallelogram faces, instead of the axis-aligned step-offset
// that reads as stacked boxes. A skew is affine → lines map to lines even after the (r,h,r) instance scale
// (the world lean angle just becomes r·k/h — varies naturally with aspect), UNLIKE rx/rz rotations which the
// non-uniform scale shears wrong. This is the transferable fix for "axis-aligned silhouette = Minecraft".
function skewX(geo, k, yRef = 0) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + k * (pos.getY(i) - yRef));
  pos.needsUpdate = true;
  return geo;
}

// An open-ended tapered frustum spanning two arbitrary 3D points (radius r0 at p0 → r1 at p1), oriented
// along the segment — for arcing organic ribs (fig roots) that xform's axis-aligned rotations can't
// place. `seg`·2 tris. Points are [x,y,z]; chain several to trace a curved root over a stone face.
function frustumBetween(p0, p1, r0, r1, seg = 4) {
  const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const len = d.length() || 1e-4;
  const geo = new THREE.CylinderGeometry(r1, r0, len, seg, 1, true); // r1 = top (toward p1), r0 = bottom (toward p0)
  geo.translate(0, len / 2, 0);                                       // base at origin, extends +Y
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  geo.translate(p0[0], p0[1], p0[2]);
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

// EMBERFALL CALDERA value ladder (CALDERA-BIBLE.md §5) — the INVERTED, light-from-below
// sibling of the Frozen ice ladder. Bakes a per-face 3-stop vertex-colour ladder onto a
// merged, NON-INDEXED, flat-shaded prop geometry from each triangle's geometric normal,
// keyed to world-DOWN (the lava floor is the light source): DOWN-faces = hot ember belly,
// UP-faces = ash-grey cooled crust (hue nudged cool-off the ember sky so crowns separate
// in silhouette), the verticals = near-black smouldering basalt. Zero triangle cost;
// turns flat dark basalt into carved, bottom-lit mass. Caldera's OWN stops — never the
// Frozen ice hues (the Part B leak the mechanical grep guards).
const _CAL_BELLY = [0.98, 0.30, 0.06];   // HOT saturated ember catch-light (down-faces) — THE BELLY GLOWS
const _CAL_CRUST = [0.36, 0.31, 0.33];   // ash grey-mauve cooled crust (up-faces), off-orange — the crown,
                                         // distinct from the near-black verticals so tops read as cooled crust.
const _CAL_BASALT = [0.085, 0.06, 0.055]; // NEAR-BLACK warm basalt (verticals) — the dark mass; the wide
                                          // value range from black flank to hot belly is what carries a
                                          // dark-mass hero against the ember sky (Fable r1: verticals too light).
function bakeCalderaLadder(geo) {
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    e1.subVectors(b, a); e2.subVectors(c, a); nr.crossVectors(e1, e2).normalize();
    const d = -nr.y;                                             // world-DOWN axis: down-faces (nr.y<0) → d>0 → hot
    const yc = (a.y + b.y + c.y) / 3;                            // face-centroid height (unit space, pre-scale)
    // The ember belly fires ONLY where the fire lives: LOW (yc ≤ 0.30 of unit height) AND
    // down-facing (d > 0.28, to catch the undercut plinth skirt). A HIGH down-face — a
    // capstone/overhang underside near the crown — is NOT belly: the crown stays dark
    // (theology). Up-faces are ash crust; everything else near-black basalt. (Fable r3 D1:
    // the wide threshold was glowing the leaning capstone's tipped faces — a crown-glow defect.)
    const s = (yc <= 0.30 && d > 0.28) ? _CAL_BELLY : d < -0.30 ? _CAL_CRUST : _CAL_BASALT;
    for (let k = 0; k < 3; k++) { const o = (i + k) * 3; col[o] = s[0]; col[o + 1] = s[1]; col[o + 2] = s[2]; }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// Merge a Caldera new-kit archetype: force NON-INDEXED parts → ≤2 material groups → bake
// the inverted value ladder → bake AO. Primary group = the ladder material (reads vColor);
// accent group = magma (vertexColors off, ignores the bake on the shared geometry).
// Coexistence: ONLY the new Caldera archetypes call this; every other biome's mergeParts
// path is byte-identical (props are render-only, so determinism is untouched regardless).
function mergeCalderaParts(parts, opts = {}) {
  const groups = [[], []];
  for (const p of parts) groups[p.mat].push(p.geo.index ? p.geo.toNonIndexed() : p.geo);
  const geos = [];
  const mats = [];
  for (let m = 0; m < 2; m++) {
    if (!groups[m].length) continue;
    geos.push(groups[m].length > 1 ? mergeGeometries(groups[m]) : groups[m][0]);
    // opts.foil → the dark no-glow foil material for the mass (clinker); else the ladder primary.
    mats.push(m === 0 ? (opts.foil ? propMats.calderaFoil : propMats.calderaPrimary) : propMats.calderaAccent);
  }
  const geometry = mergeGeometries(geos, true);
  if (!opts.foil) bakeCalderaLadder(geometry);   // the foil carries NO ladder (stays uniformly dark)
  bakeAO(geometry);
  return { geometry, materials: mats };
}

// TEMPEST REACH wind-scour value ladder (TEMPEST-REACH-BIBLE.md) — a FOURTH ladder, sibling of
// the Caldera ember one but keyed to the STORM'S OWN AXIS instead of world-DOWN. The scour axis
// leans down-wind (0.8·windX, 0.5, 0.8·windZ from TEMPEST_WIND) — the direction the gale bites
// the rock. Per-triangle geometric normal · scourAxis paints the storm history: faces the wind
// bites (high dot) scour PALE; the low waterline belly stays SOAKED near-black; everything else
// is DAMP body. Three storm-tells fall out of the bake: the pale wind-facing scour, the dark
// soaked waterline undercut, and the horizontal stratification (each stratum's up/down faces
// alternate scour/damp). Cool-dominant stops — NO storm-teal (banned). Zero triangle cost.
const _TMP_AXIS = (() => {
  const v = new THREE.Vector3(0.8 * TEMPEST_WIND.x, 0.5, 0.8 * TEMPEST_WIND.z);
  return v.normalize();
})();
const _TMP_SCOUR = [0.667, 0.714, 0.737];   // #aab6bc wind-facing scour (high dot) — pale wind-bitten crest (Fable: widen the ladder, F5 full value range)
const _TMP_DAMP = [0.224, 0.259, 0.298];    // #39424c body — dark cool storm-slate (dropped from #4b545c so the rock reads carved, not milky)
const _TMP_WETCORE = [0.055, 0.072, 0.090]; // #0e121a drowned contact — the near-black WET METER where rock meets sea
const _tmpWet = [0, 0, 0];
function bakeTempestLadder(geo) {
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    e1.subVectors(b, a); e2.subVectors(c, a); nr.crossVectors(e1, e2).normalize();
    const dot = nr.dot(_TMP_AXIS);                          // scour axis: high dot = wind-facing (bitten) face
    const yc = (a.y + b.y + c.y) / 3;                        // face-centroid height (unit space, pre-scale)
    // WATERLINE ANCHORING (Fable gate R2 #4): the base was a flat SOAKED plateau (hard cutoff) that read
    // as a prow sitting ON the water like a toy on glass. Replace it with a WET-CONTACT GRADIENT — darkest
    // (near-black drowned rock) right at the waterline, easing UP into the damp body over the bottom ~0.24
    // of the prow. The value drop is what makes the stone read as rising OUT of the sea, wet, not placed.
    // Above the wet band the wind decides: faces into the down-wind scour axis (dot > 0.32) go pale SCOUR,
    // the lee/body stays DAMP.
    let s;
    if (yc <= 0.24) {
      const t = Math.min(1, yc / 0.24);                     // 0 at the sea contact → 1 at the top of the wet meter
      _tmpWet[0] = _TMP_WETCORE[0] + (_TMP_DAMP[0] - _TMP_WETCORE[0]) * t;
      _tmpWet[1] = _TMP_WETCORE[1] + (_TMP_DAMP[1] - _TMP_WETCORE[1]) * t;
      _tmpWet[2] = _TMP_WETCORE[2] + (_TMP_DAMP[2] - _TMP_WETCORE[2]) * t;
      s = _tmpWet;
    } else {
      s = dot > 0.32 ? _TMP_SCOUR : _TMP_DAMP;
    }
    for (let k = 0; k < 3; k++) { const o = (i + k) * 3; col[o] = s[0]; col[o + 1] = s[1]; col[o + 2] = s[2]; }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// Merge a Tempest new-kit archetype: force NON-INDEXED parts → ≤2 material groups → bake the
// wind-scour value ladder → bake AO. Primary group (mat 0) = the ladder material (reads vColor);
// accent group (mat 1) = accent[7] (vertexColors off). stormprow uses ONLY mat 0, but the
// 2-group support is kept for the next family. Render-only — determinism is untouched.
function mergeTempestParts(parts) {
  const groups = [[], []];
  for (const p of parts) groups[p.mat].push(p.geo.index ? p.geo.toNonIndexed() : p.geo);
  const geos = [];
  const mats = [];
  for (let m = 0; m < 2; m++) {
    if (!groups[m].length) continue;
    geos.push(groups[m].length > 1 ? mergeGeometries(groups[m]) : groups[m][0]);
    mats.push(m === 0 ? propMats.tempestStone : propMats.accent[7]);
  }
  const geometry = mergeGeometries(geos, true);
  bakeTempestLadder(geometry);
  bakeAO(geometry);
  return { geometry, materials: mats };
}

// THE GOLD SOCKET (bible §4 glow address) as POOLED LIGHT, not a decal (Fable gate: the first pass read
// as "lemon slices decaled on boulders"). VALUE STRUCTURE + a tri budget: a 5-sided OPEN CONE scoop bored
// into the face (mat 0, ~5 tris — bakeAO shades the concavity into a dark rim) with a faceted gold POOL
// (mat 1 = accent[7] octahedron, 8 tris) set BACK inside it. ~13 tris/socket (vs ~120 for a torus rim).
// The warm BLOOM/spill onto the surrounding rock is added by bakeSocketSpill (0 tris). Socket centres are
// pushed to `centers` for that pass. Varied sizes double as the honeycombed tafoni. Face = +z (seaward).
function addGoldSocket(parts, centers, x, y, z, s) {
  parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(s * 1.25, s * 1.1, 5, 1, true), { x, y, z: z - s * 0.5, rx: -Math.PI / 2 }) });
  // The pool is a FLAT wide lozenge sunk in the scoop (sy 0.4 / sz 0.55), NOT a point-up octahedron —
  // that squash reads as pooled liquid AND kills the silhouette collision with the point-up collectible
  // gold GEMS in the lane (Fable: "gold diamond = collect me"). Still 8 tris.
  parts.push({ mat: 1, geo: xform(new THREE.OctahedronGeometry(s * 0.9, 0), { x, y, z: z - s * 0.3, sy: 0.4, sz: 0.55, sx: 1.15 }) });
  centers.push([x, y, z]);
}

// THE BLOOM layer (Fable gate #1): after the scour ladder is baked, bleed warm #ffd870 into the mat-0
// rock vertices immediately AROUND each socket centre (radial falloff), so the pooled gold reads as LIGHT
// SPILLING onto the rim rock — hot core → bloom → dark surround — instead of a wax seal. Zero triangles.
const _SOCK_GOLD = [1.0, 0.847, 0.44];   // #ffd870
function bakeSocketSpill(geo, centers, spillR = 0.24) {
  const pos = geo.attributes.position, col = geo.attributes.color;
  if (!col || !centers.length) return geo;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    let best = 0;
    for (const c of centers) {
      const dx = px - c[0], dy = py - c[1], dz = pz - c[2];
      const w = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy + dz * dz) / spillR);
      if (w > best) best = w;
    }
    if (best <= 0) continue;
    const t = best * best * 0.55;   // ease + cap the spill so it's a warm bleed, not a repaint
    col.setX(i, col.getX(i) + (_SOCK_GOLD[0] - col.getX(i)) * t);
    col.setY(i, col.getY(i) + (_SOCK_GOLD[1] - col.getY(i)) * t);
    col.setZ(i, col.getZ(i) + (_SOCK_GOLD[2] - col.getZ(i)) * t);
  }
  col.needsUpdate = true;
  return geo;
}

// Merge the virga VEIL (rainshaft): ONE pale opaque material, no ladder, no accent.
function mergeTempestVirga(parts) {
  const geos = parts.map(p => (p.geo.index ? p.geo.toNonIndexed() : p.geo));
  const geometry = mergeGeometries(geos, false);
  bakeAO(geometry);
  return { geometry, materials: [propMats.tempestVirga] };
}

// THE LOST LAGOON value ladder (LOST-LAGOON-BIBLE.md §3) — a THIRD ladder, distinct from both the
// Frozen ice ladder (normal-keyed, sun) and the Caldera ember ladder (normal-keyed, world-DOWN fire).
// The tide ladder is POSITION-keyed: per-face centroid HEIGHT paints material history the tide left,
// a horizontal shoreline stain crossing every face (readable in side elevation, unlike Caldera's
// underside-only belly). BLEACHED bone-amber crown above the old tide / JADE life-band AT the
// waterline (the saturated hero stop) / DROWNED slate below. Zero triangle cost. Lagoon's OWN stops —
// never the Caldera _CAL_ or Frozen _FROST hues (the Part B leak the symmetric mechanical grep guards).
const _LAG_BLEACH = [0.902, 0.827, 0.659]; // 0xe6d3a8 sun-bleached bone-amber (above the old tide)
const _LAG_JADE = [0.208, 0.537, 0.416];   // 0x35896a jade life-band at the waterline (the hero stop)
const _LAG_DROWN = [0.086, 0.227, 0.251];  // 0x163a40 drowned slate-teal (below the waterline)
function bakeTideLadder(geo, waterY = 0.0, bandH = 0.22) {
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const s = [0, 0, 0];
  for (let i = 0; i < n; i += 3) {
    const yc = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;   // face-centroid height (unit space, pre-scale)
    if (yc > waterY + bandH) {
      // BLEACH crown — VALUE STRUCTURE (Fable r1 / AAA-PIPELINE core→bloom→dark): brighten toward the
      // top so a ruin reads dark-waterline → bright sunlit crown instead of one flat pale value. Unit-Y
      // maps to world height (rotY is about Y, tilt tiny), so the gradient stays vertical under instancing.
      const t = Math.min(1, (yc - (waterY + bandH)) / 0.7);   // 0 just above the tide → 1 at a tall crown
      s[0] = _LAG_BLEACH[0] * (1 + 0.10 * t); s[1] = _LAG_BLEACH[1] * (1 + 0.09 * t); s[2] = _LAG_BLEACH[2] * (1 + 0.06 * t);
    } else if (yc < waterY) {
      const t = Math.min(1, (waterY - yc) / 0.4);             // darken into the wet shadow core at the base
      const f = 1 - 0.30 * t;
      s[0] = _LAG_DROWN[0] * f; s[1] = _LAG_DROWN[1] * f; s[2] = _LAG_DROWN[2] * f;
    } else {
      s[0] = _LAG_JADE[0]; s[1] = _LAG_JADE[1]; s[2] = _LAG_JADE[2];
    }
    for (let k = 0; k < 3; k++) { const o = (i + k) * 3; col[o] = s[0]; col[o + 1] = s[1]; col[o + 2] = s[2]; }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// THE FOLIAGE bake (LOST-LAGOON-BIBLE.md §3) — the Lagoon's LIVING green stops, distinct from the
// masonry tide ladder: the only vegetated biome in the cycle. Keyed to the geometric face NORMAL (not
// height): up-facing leaf faces catch the low sun (sunlit olive-gold), everything else is shadow-green.
// Used by lilyraft (pads + reeds) and rootbastion's canopy pads — a SYSTEM, not a one-off. Running this
// INSTEAD of the tide ladder is what stops the default bake painting leaves bleached-ivory (ice-floe leak).
const _LAG_OLIVE = [0.561, 0.659, 0.290];  // 0x8fa84a sunlit olive-gold (up-facing leaf)
const _LAG_SHADOW = [0.184, 0.353, 0.220]; // 0x2f5a38 shadow-green (rims, undersides, blades)
// `upThresh` sets how flat-up a face must be to catch sun: 0.35 = leaf/pad (broad olive tops), 0.75 =
// ROOT/branch (only true top-curves catch; leaning flanks stay shadow-green → dark roots strangling pale
// stone, the Ta Prohm contrast — Fable rootbastion). A threshold parameter, still ONE bake system.
function bakeLilyFoliage(geo, upThresh = 0.35) {
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const ax = new THREE.Vector3(), bx = new THREE.Vector3(), cx = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    ax.fromBufferAttribute(pos, i); bx.fromBufferAttribute(pos, i + 1); cx.fromBufferAttribute(pos, i + 2);
    e1.subVectors(bx, ax); e2.subVectors(cx, ax); nr.crossVectors(e1, e2).normalize();   // geometric face normal
    const s = nr.y > upThresh ? _LAG_OLIVE : _LAG_SHADOW;
    for (let k = 0; k < 3; k++) { const o = (i + k) * 3; col[o] = s[0]; col[o + 1] = s[1]; col[o + 2] = s[2]; }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// Merge a Lost Lagoon new-kit archetype: NON-INDEXED parts → ≤2 material groups → bake the tide
// ladder → bake AO. Primary group = lagoonStone (reads vColor); accent group = gilt (vertexColors
// off, ignores the bake on the shared geometry). opts.foil → the no-ladder no-glow lagoonFoil mass
// (wrackstone). Mirrors mergeCalderaParts; render-only, so determinism is untouched. (Lagoon code
// greps clean of _CAL_/caldera/frost; the symmetric grep keeps both kits leak-free.)
function mergeLagoonParts(parts, opts = {}) {
  // mat 0 = the stone group (lagoonStone, reads vColor) or the no-bake foil mass; mat 1 = gilt accent
  // (vertexColors off). COMPOSITE bake system (Fable rootbastion pre-assess): a mat-0 part may carry
  // `bake:'lily'` to tag it FOLIAGE; untagged mat-0 parts get the tide ladder. Each subset is baked
  // BEFORE the final merge (colours are per-vertex → survive it), so one archetype can hold BOTH a
  // tide-laddered stone mass AND olive foliage in the SAME material/draw group. opts.bake:'lily' = all
  // mat-0 parts foliage (lilyraft sugar); opts.foil = the bare no-bake mass (wrackstone).
  const accent = [], ladder = [], foliage = [], root = [];
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
    if (p.mat === 1) accent.push(g);
    else if (opts.foil) ladder.push(g);                                  // foil: one no-bake subset
    else if (p.bake === 'root') root.push(g);                            // tagged → dark foliage (roots/branches)
    else if (opts.bake === 'lily' || p.bake === 'lily') foliage.push(g); // tagged → leaf foliage
    else ladder.push(g);                                                 // untagged → tide ladder
  }
  const stone = [];
  if (ladder.length) { const g = ladder.length > 1 ? mergeGeometries(ladder) : ladder[0]; if (!opts.foil) bakeTideLadder(g); stone.push(g); }
  if (foliage.length) { const g = foliage.length > 1 ? mergeGeometries(foliage) : foliage[0]; bakeLilyFoliage(g); stone.push(g); }
  if (root.length) { const g = root.length > 1 ? mergeGeometries(root) : root[0]; bakeLilyFoliage(g, 0.75); stone.push(g); }
  const geos = [], mats = [];
  if (stone.length) { geos.push(stone.length > 1 ? mergeGeometries(stone) : stone[0]); mats.push(opts.foil ? propMats.lagoonFoil : propMats.lagoonStone); }
  if (accent.length) {
    const ag = accent.length > 1 ? mergeGeometries(accent) : accent[0];
    // the stone group carries a per-vertex `color` from the bake; pad the accent group with a matching
    // (unused — gilt has vertexColors off) color attr so the final merge's attribute sets align.
    if (stone.length && !ag.getAttribute('color')) ag.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(ag.attributes.position.count * 3), 3));
    geos.push(ag); mats.push(propMats.gilt);
  }
  const geometry = mergeGeometries(geos, true);
  bakeAO(geometry);
  return { geometry, materials: mats };
}

// THE LUMEN MIRE glow ladder (Fable ensemble plan §3/§7) — unlike the Caldera/Lagoon
// ladders (which carve a DARK mass via diffuse), this bakes a vertical value gradient onto
// the GLOW so a luminous hero reads core→bloom→dark instead of flat blown-amber tape
// (AAA-PIPELINE cheap-tells #1/#3/#6): bright apex (the core) → warm gold mid (the bloom) →
// dark warm base (the root drinks the light back at the waterline). PER-VERTEX (indexed-safe)
// smooth gradient keyed to unit height; folded into EMISSIVE by addPropDetail(ladder) so the
// gradient survives in the dark. Baked on the whole merged geometry; the mat-1 (accent) group
// reads it via `mireHeroLadder` (vertexColors on), the dark mat-0 group uses a vertexColors-off
// material and ignores the attribute (the glowcolossus/lagoon shared-geometry precedent) — so
// the dark crown binding / roots / knuckle collars stay dark even where the ladder is bright.
const _MIRE_APEX = [1.0, 1.0, 1.0];        // 0xffffff core — the brightest pixels, up where the down-cam looks
const _MIRE_MID = [0.847, 0.659, 0.376];   // 0xd8a860 warm gold bloom (mid height)
const _MIRE_BASE = [0.376, 0.298, 0.157];  // 0x604c28 dark warm root (waterline — the light is drunk back)
// Fable 75 lever-2b DEPTH-VEIL stops (the DARK screen props, not a glowing hero) — a much
// tighter range than the glow ladder: cool moss-black root → warm-lit crown. Modulates the
// veil's own near-black diffuse (0x241b10) so the crown catches top-light and the waterline
// drowns; folded to emissive keeps the crown's warm read backlit.
const _MIRE_VEIL_BASE = [0.16, 0.18, 0.16]; // cool moss-black (waterline root — the mist severs the base)
const _MIRE_VEIL_MID = [0.45, 0.36, 0.22];  // warm umber mid
const _MIRE_VEIL_APEX = [1.0, 0.80, 0.52];  // warm top-lit crown (the canopy catching the ember horizon)
function bakeMireLadder(geo, { apex = _MIRE_APEX, mid = _MIRE_MID, base = _MIRE_BASE, baseY = 0.0, apexY = 1.1 } = {}) {
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const span = Math.max(1e-4, apexY - baseY);
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, Math.max(0, (pos.getY(i) - baseY) / span));
    const lo = t < 0.5 ? base : mid, hi = t < 0.5 ? mid : apex, f = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const o = i * 3;
    col[o] = lo[0] + (hi[0] - lo[0]) * f;
    col[o + 1] = lo[1] + (hi[1] - lo[1]) * f;
    col[o + 2] = lo[2] + (hi[2] - lo[2]) * f;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
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
// DEBUG-ONLY (default off): `?hero=<archetype>` pins that archetype's yaw so its designed
// front faces down-lane for the in-context bar-setting render. Skips the rnd() rotY init, so it is
// determinism-UNSAFE and must never be set in shipping — the gate is that the param is absent by default.
const HERO_POSE = _envParams.get('hero');
const HERO_SET = new Set((HERO_POSE || '').split(',').map((s) => s.trim()).filter(Boolean));   // ?hero=a,b keeps several archetypes in biome 0 (e.g. the hero + a rest-note, to judge one beside the other)
// Per-biome whitelist helpers: FROZEN is the A1 biome (new kit default-on, legacy
// parked). A biome not yet migrated returns its shipped whitelist unconditionally.
const frozenNew = PROPS_V1 ? [] : [2];   // Sunset Glacier (no-spike glacier ice): bergwall/serac/terrace/icetower/glacierwall/sungate(hero)
const frozenOld = PROPS_V1 ? [2] : [];   // crystal/crystalSmall (deleted in A8)
// EMBERFALL CALDERA overhaul (CALDERA-BIBLE.md) — same flip idiom. Default (v2) = the
// new volcanic kit (colonnata hero + roster as it lands, light-from-below ladder);
// `?props=v1` restores the legacy basalt/vent cones. Kit is built up over PRs; while
// it grows the biome is intentionally sparser than the legacy roster (restraint > clutter).
const calderaNew = PROPS_V1 ? [] : [3];  // colonnata (+ flowlobe/fumarole/clinker/riftwall/riftfang to come)
const calderaOld = PROPS_V1 ? [3] : [];  // legacy basalt/vent (retired once the kit completes)
// THE LUMEN MIRE overhaul (LUMEN-MIRE-BIBLE.md) — same flip idiom. Default = the new
// bioluminescent-swamp kit (canopy/depth/roof first, hero + glow carriers over later PRs,
// under-brim glow ladder); `?props=v1` restores the legacy glowcap/spirevine cones. Kit is
// built up over PRs; while it grows the biome is intentionally sparse (depth/roof, near-zero
// emissive) — the darkness is the investment the PR-3 hero pays off (owner brightness lock).
const mireNew = PROPS_V1 ? [] : [4];     // canopywall/reedveil/boleveil/drape (+ hero/roster/skins to come)
const mireOld = PROPS_V1 ? [4] : [];     // legacy glowcap/glowcapSmall/spirevine (retired once the kit completes)
// THE LOST LAGOON overhaul (LOST-LAGOON-BIBLE.md) — consolidates biomes 0+1. Default (v2) = the
// new drowned-ruins kit (rotunda hero + roster as it lands, position-keyed tide ladder); `?props=v1`
// restores the legacy Sanctuary/Wastes roster. Legacy props stay whitelisted while the kit grows
// (they coexist in-field; the full legacy retirement + Wastes retire-from-CYCLE is the final PR).
const lagoonNew = PROPS_V1 ? [] : [0];   // rotunda (+ arcade/rootbastion/lilyraft/wrackstone/campanile/sentinel to come)
const lagoonOld = PROPS_V1 ? [0] : [];   // legacy verdigris ruins (retired once the kit completes)
// TEMPEST REACH overhaul (TEMPEST-REACH-BIBLE.md) — same flip idiom. Default (v2) = the new
// storm-carved kit (stormprow hero + stackgrave/tafonihold/stormstack/arcuswall/rainshaft to
// come, wind-scour value ladder); `?props=v1` restores the empty legacy roster. The archetype's
// `biomes: tempestNew` whitelist is the ONLY spawn gate. Kit is built up over PRs.
const tempestNew = PROPS_V1 ? [] : [7];  // stormprow (+ storm roster to come)
const tempestOld = PROPS_V1 ? [7] : [];  // legacy (empty — biome 7 shipped propless)

const ARCHETYPES = {
  // Sanctuary: verdigris watchtower with a weathered bronze dome.
  tower: {
    step: 42, biomes: lagoonOld, matIndex: 0,
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
    step: 20, biomes: [...lagoonOld, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.9, 0.14, 0.9), { y: 0.07 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.27, 0.34, 0.76, 7), { y: 0.52 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.32, 0.27, 0.1, 7), { y: 0.94, rz: 0.12 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 6), h: 4 + rnd() * 6, r: 2 + rnd() * 1.6, tilt: side * (rnd() * 0.14 - 0.04) }),
  },
  // Free-standing ruined arch fragment rising from the water.
  archruin: {
    step: 75, biomes: lagoonOld, matIndex: 0,
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
    step: 26, biomes: [...lagoonOld, 1], matIndex: 0,
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
    step: 85, biomes: [...lagoonOld, 1], matIndex: 0,
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
    // LANE-CLEARANCE (PR-1): inner edge = x − ρ·r·sMax must clear the ±13 fatal lane
    // + the ±16 gate veil. serac ρ=0.712, sMax 1.10 → 0.79; floor 15.5 (MID class).
    // Draw r FIRST then couple x to it (the shipped bergwall pattern) — same 4 draws.
    place: (side, rnd) => { const r = 7 + rnd() * 4; return { x: side * (15.5 + 0.79 * r + rnd() * 6), h: 7 + rnd() * 6, r, tilt: side * (rnd() * 0.10 - 0.03) }; },
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
    // LANE-CLEARANCE (PR-1): terrace ρ=0.704, sMax 1.08 → 0.76; floor 14.5 (LOW class,
    // top ≤7 so it may hug the route but its widest pans now sit outside the ±13 wall).
    place: (side, rnd) => { const r = 8 + rnd() * 8; return { x: side * (14.8 + 0.76 * r + rnd() * 6), h: 2.5 + rnd() * 4.5, r, tilt: side * (rnd() * 0.04 - 0.02) }; },
  },
  // THE ICE TOWER — a tall TABULAR ice column (~108 tris, step 130 = rare landmark).
  // Real glaciers are flat-topped and blocky, NEVER spiky (research: tabular/blocky
  // dominate; pinnacled spires are the rare exception) — so this is a STACK of offset
  // ice blocks with a FLAT stepped top, not a spire. Placed FAR from the lane
  // (|x| ≥ 24) so it never looms over or occludes a gameplay gate (clean lanes).
  icetower: {
    step: 170, biomes: frozenNew, matIndex: 2, comp: { floor: 0, sMin: 0.9, sMax: 1.0 }, // rarer + capped (Move 2: the Sun Gate is the tallest paired hero at a peak, not this)
    deckSkim: 'park', // narrow vertical — reads as a tower even height-squashed; parks in strait2 run windows
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
    // LANE-CLEARANCE (PR-1): icetower ρ=0.56; floor 17.5 (TALL class) AND cap the inward
    // lean so the top stays ≥ 16.5 (never leans over the ±16 gate veil). Same 4 draws.
    place: (side, rnd) => { const r = 8 + rnd() * 4, h = 22 + rnd() * 14; return { x: side * (17.5 + 0.56 * r + rnd() * 12), h, r, tilt: side * Math.min(rnd() * 0.06 - 0.02, 1.0 / h) }; },
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
    // LANE-CLEARANCE (PR-1): glacierwall ρ=1.004 was the smoking gun — the "far massif"
    // routinely sprawled across half the ±13 lane at flight height. Couple x to r (1.01)
    // so inner edge ≥ 26 (BACKDROP class) — it stays the honest fog-line massif. 3 draws.
    place: (side, rnd) => { const r = 34 + rnd() * 16; return { x: side * (26 + 1.01 * r + rnd() * 22), h: 14 + rnd() * 8, r, tilt: 0 }; },
  },
  // Emberfall Caldera: jagged basalt spire split by a glowing magma seam.
  basalt: {
    step: 18, biomes: calderaOld, matIndex: 3,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.3, 0.52, 0.95, 5), { y: 0.48 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.17, 0.3, 0.55, 5), { x: 0.24, y: 0.6, rz: 0.2 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.45, 0.5, 0.07, 5), { y: 0.14 }) },
    ], 3),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 9), h: 11 + rnd() * 19, r: 2.2 + rnd() * 1.8, tilt: side * (rnd() * 0.12 - 0.03) }),
  },
  // Squat fumarole cone with a glowing throat.
  vent: {
    step: 42, biomes: calderaOld, matIndex: 3,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.6, 0.85, 6), { y: 0.42 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.16, 0.24, 0.12, 6), { y: 0.86 }) },
    ], 3),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 6), h: 3 + rnd() * 3.5, r: 3 + rnd() * 2, tilt: 0 }),
  },
  // EMBERFALL CALDERA — THE HERO (CALDERA-BIBLE.md §4.1/§9): a columnar-basalt palisade
  // (Giant's Causeway / Svartifoss) — a broad terrace from which fused hex column RANKS
  // rise at DESCENDING heights (organ-pipe crest broken mid-song), one column snapped, one
  // toppled where it fell, an overhanging capstone against the descent. 7 offset-stacked
  // interpenetrating parts, ~140 tris, ONE material (bare dark mass — the biome's thesis;
  // its "fire" is only the inverted ladder's hot belly + its reflection). The lean/broken
  // read is built by radial x+z OFFSET-stacking, NEVER internal rotation — the (r,h,r)
  // instance scale shears internal tilts flat. rotY re-randomises on recycle, so features
  // spread in x AND z → broad from every yaw. flatShading hex facets give the vertical rib.
  colonnata: {
    step: 53, biomes: calderaNew, matIndex: 3, arrivalPark: true, comp: { floor: 0.12, sMin: 0.90, sMax: 1.12 }, // hero: clusters hard → one colossus per archipelago, off open mirror at the seam
    // A PACKED PALISADE of SLENDER pentagonal basalt columns (Giant's Causeway) at a
    // BROKEN, non-monotonic crest — organ pipes snapped mid-song, one toppled where it
    // fell, an overhanging capstone. Columns are open-bottomed (buried in the plinth) +
    // a matching pentagon top-cap (15 tris each) so 7 fit in budget → the vertical rib
    // + the polygonal top-mosaic (the flying game's plan view) both read. The broken read
    // is pure radial x/z OFFSET-stacking — never internal tilt (the (r,h,r) scale shears
    // it flat). flatShading on the penta facets gives the fluting; the inverted-taper
    // plinth undercut + the overhangs carry the hot ember belly at the waterline. (Fable
    // r1 3.2→ deltas D1–D5: more/slimmer columns, break the staircase, fix the belly + plan.)
    build: () => {
      // [x, z, height, radius, yaw] — 7 slender columns, ~3.5:1, packed ≥35%, staggered
      // front/back, crest NON-monotonic (1.05, 0.80, 0.92, 0.62, 0.28-stump, 0.50, 0.72).
      const cols = [
        [-0.44,  0.05, 1.05, 0.125, 0.20],
        [-0.27, -0.15, 0.80, 0.130, 0.95],
        [-0.11,  0.12, 0.92, 0.120, 1.65],
        [ 0.08, -0.10, 0.62, 0.130, 0.50],
        [-0.02,  0.30, 0.28, 0.110, 2.20],   // the SNAPPED STUMP — the broken beat
        [ 0.26,  0.10, 0.50, 0.125, 1.15],
        [ 0.45, -0.06, 0.72, 0.115, 0.35],
      ];
      const parts = [];
      for (const [x, z, h, r, ry] of cols) {
        // open-ended penta shaft (10 tris) — sides are vertical → near-black basalt flank
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(r, r, h, 5, 1, true), { x, z, y: h / 2, ry }) });
        // matching penta top cap (5 tris), faces UP → ash crust; forms the plan-view mosaic
        parts.push({ mat: 0, geo: xform(new THREE.CircleGeometry(r, 5), { x, z, y: h, rx: -Math.PI / 2, ry }) });
      }
      // Plinth — LOW subordinate cooled terrace, open-ended (10 tris; top hidden by the
      // column pack, bottom at the waterline) with an INVERTED taper (rt>rb) so its
      // overhanging undercut skirt faces DOWN → the hot ember waterline seam (Fable D4).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.52, 0.40, 0.14, 5, 1, true), { y: 0.07, ry: 0.30, sx: 1.28, sz: 1.02 }) });
      // Toppled column — a fallen shaft abutting the stump, lying full 90° (survives the
      // (r,h,r) shear), capped both ends so the pentagon cross-section is the payoff. Slimmed
      // ~10% (Fable r3 D5 — front-on it verged on shipping-container).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.10, 0.10, 0.44, 5), { x: -0.06, z: 0.34, y: 0.10, rz: Math.PI / 2, ry: 0.40 }) });
      // Capstone — a broken slab sliding OFF the tall column to one side (asymmetric, well
      // tilted — not a centred "T"/hammer); overhangs the right flank, its underside a small
      // physically-motivated ember patch (belly, not accent — keep the crown dark).
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.30, 0.11, 0.25), { x: -0.27, z: 0.01, y: 1.05, ry: 0.35, rz: -0.34 }) });
      return mergeCalderaParts(parts);
    },
    // Fairness AND composition (§9): draw r FIRST, couple x to it (ρ≈0.67, plinth-driven;
    // widen propclearance SCOPE_BIOME to 3 and re-tune). Inner edge = |x|−ρ·r ≥ 14.5.
    // World ratio 2·ρ·r / h ≈ 1.34·r/h → h 11–17 vs r 24–36 keeps it ≥1.8:1 wider-than-tall
    // (Fable r3 D3). Heroes stand PLUMB (tilt 0 explicit — a missing tilt is a NaN quaternion);
    // the lean lives in the geometry.
    place: (side, rnd) => { const r = 24 + rnd() * 12; return { x: side * (16 + 0.78 * r + rnd() * 6), h: 11 + rnd() * 6, r, tilt: 0 }; },  // propclearance: ρ 0.654·sMax 1.12 → inner ≥16 (clears the ±16 gate veil; tall hero)
  },
  // EMBERFALL CALDERA — THE LOW REST + glow carrier 1 (CALDERA-BIBLE.md §4.2): a pahoehoe
  // lava-flow tongue — a low, WIDE, ropey crust of offset-stacked plates with rounded lobed
  // fronts, an ember-crack network glowing recessed in the plate seams. The horizontal that
  // makes the verticals read colossal (terrace's role, worn as a lobed tongue not a stepped
  // shelf). Primary read is TOP-DOWN: a dark tongue veined with fire. Lowest form → carries
  // the most fire (the glow-altitude rule). ~5:1 wide. Glow = magma accent recessed BELOW
  // the plate tops (the LOW-in-cracks address), not a strip on a face.
  flowlobe: {
    step: 23, biomes: calderaNew, matIndex: 3, comp: { floor: 0.50, sMin: 0.92, sMax: 1.06 }, // low rest: breathes mildly (stays the floor baseline, incl. at the seam)
    build: () => mergeCalderaParts([
      // THE MAGMA CORE (mat 1) — a wide low glowing interior plate, stretched along the flow
      // axis (z). The dark crust islands above cover most of it; it shows ONLY through the
      // joints and around the plate edges → an organic joint-following lava-vein network,
      // recessed and walled by construction (Fable r9 D1: fire lives BETWEEN the crusts, not
      // drawn ON them — that killed the rune/LED read).
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.54, 0.58, 0.15, 6), { y: 0.075, ry: 0.20, sx: 1.12, sz: 1.5 }) },
      // DARK CRUST ISLANDS (mat 0 = foil, so the tongue is the biome's BLACK BASELINE — Fable
      // D2) seated ON the core, each proud (top ~0.185) so its edges WALL the magma veins; set
      // with gaps between them and short of the core rim → magma shows as seams + a molten edge.
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.36, 0.40, 0.17, 6), { x: -0.26, z: -0.20, y: 0.10, ry: 0.5, sx: 1.25, sz: 1.5 }) },   // rear-left crust (nudged out → opens ONE interior seam across the plan, Fable r11 free delta)
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.34, 0.38, 0.17, 6), { x: 0.28, z: -0.05, y: 0.10, ry: 1.2, sx: 1.18, sz: 1.45 }) },   // right crust (central seam between L/R)
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.30, 0.33, 0.15, 6), { x: -0.03, z: 0.35, y: 0.09, ry: 0.8, sx: 1.25, sz: 1.15 }) },   // mid-front crust (cross seams)
      // two staggered front lobe NOSES (foil) — the advancing tongue with molten between them
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.24, 0.27, 0.12, 5), { x: -0.28, z: 0.60, y: 0.065, ry: 0.5, sx: 1.1 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.20, 0.23, 0.11, 5), { x: 0.29, z: 0.57, y: 0.06, ry: 1.2 }) },
    ], { foil: true }),
    // LOW horizontal REST: normalized yMax ~0.28 → world height h·0.28. r 10–20 WIDE, h 8–14
    // small → world ~18–34 wide × ~2.5–4.5 tall ≈ 5:1. ρ≈0.9 (wide plates); inner edge
    // |x|−ρ·r ≥ 14.5 → couple x = 14.5 + 0.92·r. Explicit tilt (hugs the route, slight roll).
    place: (side, rnd) => { const r = 10 + rnd() * 10; return { x: side * (15 + 1.05 * r + rnd() * 5), h: 8 + rnd() * 6, r, tilt: side * (rnd() * 0.06 - 0.02) }; },  // propclearance: ρ 0.944·sMax 1.06 → inner ≥14.5 (low rest)
  },
  // EMBERFALL CALDERA — THE BARE FOIL (CALDERA-BIBLE.md §4.4): an aa-clinker / breadcrust
  // rubble mound — chaotic angular jumble, NO glow, one material. The silence that makes
  // flowlobe's veins and fumarole's throat feel earned; dark punctuation across the lava.
  // Icosahedra read as angular crust chunks (not the smooth boulders the Frozen serac gate
  // rejected — here the chaotic pile IS the identity). ~1.6:1.
  clinker: {
    step: 29, biomes: calderaNew, matIndex: 3, comp: { floor: 0.55, sMin: 0.90, sMax: 1.08 }, // foil: mild breathing dark punctuation (stays at the seam)
    build: () => mergeCalderaParts([
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.42, 0), { y: 0.30, sx: 1.5, sy: 0.85, sz: 1.2, ry: 0.4 }) },       // main mound
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.34, 0), { x: 0.36, z: 0.10, y: 0.22, sx: 1.2, sy: 0.8, ry: 1.1 }) }, // flank chunk
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.30, 0), { x: -0.32, z: -0.12, y: 0.20, sy: 0.9, ry: 2.0 }) },       // other flank
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.26, 0), { x: 0.08, z: 0.28, y: 0.42, sx: 1.3, sy: 0.7, ry: 0.7 }) }, // upper overhang chunk (off-centre high point)
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.22, 0), { x: -0.10, z: 0.30, y: 0.14, ry: 1.6 }) },                 // foot rubble, half-buried
    ], { foil: true }),
    // FOIL rubble mound: broad, ~1.6:1. ρ≈0.75. r 5–11, h 5–9 → wider than tall.
    place: (side, rnd) => { const r = 5 + rnd() * 6; return { x: side * (15.2 + 0.82 * r + rnd() * 6), h: 5 + rnd() * 4, r, tilt: side * (rnd() * 0.10 - 0.04) }; },  // propclearance: ρ 0.689·sMax 1.08 → inner ≥14.5 (foil; tilt trimmed for lean margin)
  },
  // EMBERFALL CALDERA — MID MASS + glow carrier 2 (CALDERA-BIBLE.md §4.3): a fused cinder /
  // spatter-cone cluster (2–3 squat cones, breached crater rims) with ONE sunken glowing
  // THROAT recessed inside the largest crater — invisible from the side, a hot pool from
  // above and on approach (the purest expression of the LOW-in-cracks/throats glow address).
  // Kin to the geyser vent sites — the world explains its own hazard. ~2:1 wide.
  fumarole: {
    step: 47, biomes: calderaNew, matIndex: 3, arrivalPark: true, comp: { floor: 0.15, sMin: 0.90, sMax: 1.10 }, // mid: clusters into the archipelagos, off the seam
    build: () => mergeCalderaParts([
      // main cinder cone — an OPEN-TOPPED frustum (openEnded → you see DOWN into the crater to
      // the glowing throat; a closed cap would hide it), never a traffic-cone point
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.30, 0.54, 0.74, 7, 1, true), { y: 0.37, ry: 0.2 }) },
      // second fused cone, offset + lower (breaks the main rim asymmetrically)
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.20, 0.40, 0.52, 6), { x: 0.36, z: 0.10, y: 0.26, ry: 0.7 }) },
      // third spatter mound, other side
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.14, 0.30, 0.36, 6), { x: -0.32, z: 0.14, y: 0.18, ry: 1.3 }) },
      // rim-breach wedges — asymmetric broken lip on the main crater AND the second cone
      // (no neat machined rings anywhere; Fable r13 D3).
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.20, 0.22, 0.16), { x: -0.20, z: -0.18, y: 0.66, rz: 0.4, ry: 0.3 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.15, 0.16, 0.13), { x: 0.16, z: 0.16, y: 0.70, rz: -0.5 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.14, 0.16, 0.12), { x: 0.44, z: 0.02, y: 0.50, rz: 0.6, ry: 0.4 }) },   // breach the SECOND cone's rim
      // the SUNKEN THROAT — a magma pool (mat 1) recessed DEEP in the crater (rim ~0.74, pool
      // top ~0.62), only ~⅓ of the footprint (Fable r13 D2 — the MID form must UNDER-fire the
      // floor flowlobe). Occluded in side elevation by the open cone's near wall; a hot pool
      // only from above / on oblique approach (the withheld-glow reveal on climb/bank).
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.20, 0.15, 0.10, 7), { y: 0.57 }) },
    ], { foil: true }),   // foil-dark cones (Fable D1) so the throat is the ONLY bright event
    // MID mass, ~2:1. ρ≈0.62 (cluster spread). r 7–13, h 6–11. Explicit tilt.
    place: (side, rnd) => { const r = 7 + rnd() * 6; return { x: side * (15.5 + 0.88 * r + rnd() * 6), h: 6 + rnd() * 5, r, tilt: side * (rnd() * 0.05 - 0.02) }; },  // propclearance: ρ 0.754·sMax 1.10 → inner ≥15.5 (mid)
  },
  // EMBERFALL CALDERA — THE DISTANT MASSIF (CALDERA-BIBLE.md §4.5): the caldera RIM — a long,
  // dark, flat-topped escarpment banded with HORIZONTAL strata (distinguished from the hero's
  // VERTICAL ribs by axis), sinking into the scorched-dark far fog. No glow (the rim is the
  // oldest, coldest crust). The amphitheatre wall that makes the caldera a PLACE. 5–7:1 wide.
  riftwall: {
    step: 89, biomes: calderaNew, matIndex: 3, arrivalPark: true, comp: { floor: 0.25, sMin: 0.95, sMax: 1.05 }, // massif: mostly-continuous enclosure, thins at the breaths + seam
    build: () => mergeCalderaParts([
      // stacked HORIZONTAL strata — each course sinks ≥20% into the one below (NO daylight
      // through the massif, Fable r13 D1), varied lengths + broken end-steps so the wall
      // terminates jagged not sawn; a wide 5-sided base stratum so not every edge is 90°.
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.56, 0.62, 0.42, 5), { y: 0.18, ry: 1.62, sx: 1.05, sz: 0.62, rz: 0.03 }) },  // base plinth stratum (5-sided)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.90, 0.34, 0.40), { x: -0.08, z: -0.03, y: 0.42, ry: -0.05, rz: -0.04 }) },        // course 2 (bottom 0.25 sinks into base top 0.39)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.66, 0.30, 0.36), { x: 0.16, z: 0.03, y: 0.64, ry: 0.07, rz: 0.05 }) },            // course 3 (sinks into course 2)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.38, 0.30, 0.34), { x: -0.28, z: 0.05, y: 0.82, ry: 0.12, rz: -0.10 }) },          // proud OVERHANGING shoulder (asymmetric crown)
      // broken END-steps — offset chunks that jog the wall's ends (no sawn 90° termination)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.24, 0.26, 0.30), { x: 0.52, z: -0.02, y: 0.36, ry: 0.20, rz: 0.09 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.20, 0.22, 0.28), { x: -0.54, z: 0.02, y: 0.30, ry: -0.16 }) },
      // a stepped colonnade band partway up the face (short vertical notches — the columnar echo)
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.08, 0.28, 0.10), { x: 0.18, z: 0.20, y: 0.40 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.08, 0.28, 0.10), { x: 0.31, z: 0.20, y: 0.40 }) },
    ]),
    // BACKDROP massif (the glacierwall pattern): LARGE r + SMALL h so the stacked courses
    // stretch WIDE and squash LOW → a long horizontal-banded rim wall, not a totem. ρ≈0.7,
    // couple x = 26 + 1.0·r (inner edge ≥ 26, far off-lane); foam:false (fog-line). r 30–50 →
    // world width ~42–70; h 13–20 → world height ~13–20 ≈ 3.5–5:1. Rides the height-fog.
    place: (side, rnd) => { const r = 30 + rnd() * 20; return { x: side * (26 + 1.0 * r + rnd() * 10), h: 13 + rnd() * 7, r, tilt: side * (rnd() * 0.03 - 0.015) }; },
  },
  // EMBERFALL CALDERA — THE RARE TALL PUNCTUATION (CALDERA-BIBLE.md §4.6): a volcanic NECK —
  // the eroded throat of a dead vent, a single leaning tapered monolith on a BROAD skirt with
  // a broken asymmetric multi-jag crown. The ONE tall form (landmark). No glow (tallest =
  // darkest). Lean built by OFFSET-stacking, never internal tilt (the (r,h,r) shear rule).
  riftfang: {
    step: 149, biomes: calderaNew, matIndex: 3, arrivalPark: true, comp: { floor: 0.06, sMin: 0.95, sMax: 1.05 }, // rare tall punctuation: at most one per frame, off the seam
    build: () => mergeCalderaParts([
      // A CHUNKY volcanic PLUG (~2.5–3:1, not a needle — Fable r13 rebuild): a broad FLARED
      // skirt (the mountain eroded away from around the neck) + a half-sunk collar chunk, then
      // gently-tapering segments that LEAN hard via progressive x/z OFFSETS (never internal
      // tilt — the (r,h,r) shear rule), capped by a real asymmetric two-jag broken crown.
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.60, 0.86, 0.40, 6), { y: 0.20, ry: 0.2 }) },                 // broad flared skirt
      { mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.30, 0), { x: -0.44, z: 0.10, y: 0.14, sy: 0.7, ry: 0.6 }) }, // half-sunk collar chunk (eroded debris)
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.48, 0.60, 0.48, 6), { x: 0.06, z: 0.02, y: 0.56, ry: 0.5 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.38, 0.50, 0.44, 6), { x: 0.20, z: 0.07, y: 0.96, ry: 1.0 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.29, 0.41, 0.38, 6), { x: 0.40, z: 0.13, y: 1.30, ry: 1.6 }) },  // hard lean out
      // asymmetric TWO-JAG crown at opposing offsets, ≥0.15 height differential, both off-axis
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.24, 0.42, 5), { x: 0.56, z: 0.10, y: 1.60, rz: -0.34 }) },        // tall jag (far)
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.17, 0.26, 5), { x: 0.34, z: 0.22, y: 1.48, rz: 0.40 }) },         // short jag (near, off-axis)
    ]),
    // RARE tall PUNCTUATION: the sanctioned tall exception, now ~2.5–3:1 (a plug, not a pin).
    // ρ≈0.75. Placed at the band EDGES (|x| ≥ 60 via the coupling) so it brackets ASHTALON's
    // stage. Explicit tilt (stands plumb; the lean is in the geometry).
    // Height trimmed (top ~30–43 not ~65) + pushed further out (|x| ≥ 62) so the tall spire
    // BRACKETS the reserved lit horizon band from its EDGES instead of towering into the
    // central third where ASHTALON's silhouette lands (Fable composition gate §3.7).
    place: (side, rnd) => { const r = 9 + rnd() * 6; return { x: side * (62 + 0.6 * r + rnd() * 12), h: 16 + rnd() * 8, r, tilt: 0 }; },
  },
  // Lumen Mire: colossal bioluminescent mushroom, cap lit from within.
  glowcap: {
    step: 26, biomes: mireOld, matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.13, 0.22, 0.78, 7), { y: 0.39 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.52, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.76, sy: 0.55 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 8), h: 8 + rnd() * 11, r: 2.5 + rnd() * 2.5, tilt: side * (rnd() * 0.1 - 0.03) }),
  },
  glowcapSmall: {
    step: 14, biomes: mireOld, matIndex: 4,
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
    step: 34, biomes: mireOld, matIndex: 4,
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
    deckSkim: 'park', // tall paired pylons — a squashed doorway reads broken; parks in strait2 run windows
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
  // THE LOST LAGOON — THE HERO (LOST-LAGOON-BIBLE.md §4.1): a drowned ROTUNDA — a broken
  // hemispherical dome on a PIERCED drum, the roster's only curved crown. The theology's form-move
  // is the THROUGH-HOLE: the drum is a ring of piers leaving ARCHED WINDOW gaps, the dome apex is an
  // OCULUS — all REAL holes (the occlusion-masked god-rays carve shafts through them). One dome flank
  // collapsed (break faces sky → asymmetric). The tide ladder paints a jade waterline ring on the
  // piers, bleached crown on the dome. Gilt lives ONLY inside the oculus reveal (the aperture address,
  // recessed) — never on an outer face, never at the waterline. Guard (Fable pre-assess): ≥3 asymmetric
  // apertures + oculus in the DOME, so it reads as pierced masonry, NOT Frozen's sun-gate pylon pair.
  rotunda: {
    step: 59, biomes: lagoonNew, matIndex: 0, arrivalPark: true, comp: { floor: 0.08, sMin: 0.94, sMax: 1.16 }, // hero: clusters → one colossus per archipelago, off the open-mirror seam (grows large at the peak for focal hierarchy)
    build: () => {
      const parts = [];
      const nSeg = 11, dth = (Math.PI * 2) / nSeg;
      const open = new Set([0, 2, 3]);        // window {0} (+x) + the wide collapse {2,3} (adjacent, ~+z); asymmetric keyhole
      const arched = new Set([0]);            // the intact window gets a pointed-arch lintel (the biome's arch vocabulary)
      const domePhi = 2.22;                    // dome's missing quarter centred on the drum collapse ({2,3}, ~+z) → one coherent wound facing the studio cameras
      // BASE PLINTH — a battered skirt at the waterline with a CLOSED TOP (Fable D1): the flying game's
      // top-down is a shipping camera, so a hollow ribbon shows sky through it. Truncated-cone side wall
      // + an up-facing top disc → a solid jade annulus in plan; the never-seen underside is skipped.
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.60, 0.70, 0.16, 8, 1, true), { y: 0.08 }) });
      parts.push({ mat: 0, geo: xform(new THREE.CircleGeometry(0.60, 8), { y: 0.16, rx: -Math.PI / 2 }) });
      // PIERCED DRUM WALL — HORIZONTAL EDGE LOOP at the tide-band height (y=0.22): every triangle sits
      // inside ONE ladder stop, so the jade waterline is a DEAD-LEVEL line, not a per-quad sawtooth
      // (the position-keyed-ladder tall-face trap: colour is per-face, so any quad straddling the band
      // splits into a jade tri + a bleach tri along its diagonal). Base r0.63 sinks into the plinth top.
      // 8 piers × 2 courses; the intact window {0} gets a 2-tri inverted-V lintel → a pointed-arch read.
      {
        const rings = [ { y: 0.0, r: 0.63 }, { y: 0.22, r: 0.575 }, { y: 0.60, r: 0.50 } ];
        const P = (ring, a) => [Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r];
        const v = [];
        for (let s = 0; s < nSeg; s++) {
          if (open.has(s)) {
            if (arched.has(s)) {   // POINTED-ARCH window: two spandrel fills in the top corners leave a
              // central void that PEAKS UP to the wall top (a lancet), not a downward apex (Fable r7 —
              // the peak must point into the mass, never stick up as a fin above the parapet). rArc≈wall.
              const a0 = s * dth, a1 = (s + 1) * dth, am = (a0 + a1) / 2, rArc = 0.52, yS = 0.40, yTop = 0.60;
              const SL = [Math.cos(a0) * rArc, yS, Math.sin(a0) * rArc], SR = [Math.cos(a1) * rArc, yS, Math.sin(a1) * rArc];
              const TLc = [Math.cos(a0) * rArc, yTop, Math.sin(a0) * rArc], TRc = [Math.cos(a1) * rArc, yTop, Math.sin(a1) * rArc];
              const Ap = [Math.cos(am) * rArc, yTop, Math.sin(am) * rArc];   // apex at the wall top centre
              v.push(...SL, ...TLc, ...Ap, ...SR, ...Ap, ...TRc);   // outward spandrels; void below peaks up to Ap
            }
            continue;
          }
          const a0 = s * dth, a1 = (s + 1) * dth;
          for (let c = 0; c < 2; c++) {
            const lo = rings[c], hi = rings[c + 1];
            const p0b = P(lo, a0), p1b = P(lo, a1), p0t = P(hi, a0), p1t = P(hi, a1);
            v.push(...p0b, ...p1t, ...p1b, ...p0b, ...p0t, ...p1t);   // outward-facing winding
          }
        }
        // JAMB CAPS (Fable r6) — the two collapse cut-ends {2,3} get a return face inset toward centre
        // so the drum wall shows DEPTH at the wound, not a paper card. Left jamb opens +angle, right −angle.
        for (const { a, sign } of [{ a: 2 * dth, sign: 1 }, { a: 4 * dth, sign: -1 }]) {
          const OB = [Math.cos(a) * 0.63, 0.0, Math.sin(a) * 0.63], OT = [Math.cos(a) * 0.50, 0.60, Math.sin(a) * 0.50];
          const IB = [Math.cos(a) * 0.53, 0.0, Math.sin(a) * 0.53], IT = [Math.cos(a) * 0.40, 0.60, Math.sin(a) * 0.40];
          if (sign > 0) v.push(...OB, ...OT, ...IT, ...OB, ...IT, ...IB);
          else v.push(...OB, ...IT, ...OT, ...OB, ...IB, ...IT);
        }
        const drum = new THREE.BufferGeometry();
        drum.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        drum.computeVertexNormals();
        drum.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((v.length / 3) * 2), 2)); // match the primitive parts' attribute set for the merge
        parts.push({ mat: 0, geo: drum });
      }
      // CORNICE — short ASYMMETRIC stubs flanking the collapse (a 2-sector run {4,5} + a 1-sector {1}),
      // the rest fallen (Fable r5: broken entablature reads as accident when asymmetric, not design).
      {
        const present = [1, 4, 5];
        const yb = 0.55, yt = 0.64, rC = 0.52;
        const v = [];
        for (const s of present) {
          const a0 = s * dth, a1 = (s + 1) * dth;
          const p0b = [Math.cos(a0) * rC, yb, Math.sin(a0) * rC], p1b = [Math.cos(a1) * rC, yb, Math.sin(a1) * rC];
          const p0t = [Math.cos(a0) * rC, yt, Math.sin(a0) * rC], p1t = [Math.cos(a1) * rC, yt, Math.sin(a1) * rC];
          v.push(...p0b, ...p1t, ...p1b, ...p0b, ...p0t, ...p1t);
        }
        const corn = new THREE.BufferGeometry();
        corn.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        corn.computeVertexNormals();
        corn.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((v.length / 3) * 2), 2));
        parts.push({ mat: 0, geo: corn });
      }
      // DOME — a broad hemisphere with a TRUE quarter collapsed toward the drum gap (both wounds ~+z →
      // the collapse reads coherently at elevation). Seated at domeY=0.56 so the rim (y0.56, r0.46) sinks
      // 0.04 BELOW the drum top (y0.60, r0.50) at EVERY sector — the drum edge occludes the junction, so
      // there's no full-width air-gap slit where the cornice is absent (Fable r7 root cause). OCULUS at apex.
      const domeY = 0.56;
      parts.push({ mat: 0, geo: xform(new THREE.SphereGeometry(0.46, 7, 2, domePhi, 1.5 * Math.PI, 0.30, Math.PI / 2 - 0.30), { y: domeY }) });
      // INNER LINING (Fable D3) — a concentric shell at 0.43 with REVERSED winding (faces inward) over
      // the same arc: looking into the collapse shows a solid stone bowl + a 0.03 rim LIP at every
      // broken edge → no zero-thickness paper arc from any yaw. The gate condition.
      {
        const inner = new THREE.SphereGeometry(0.43, 4, 2, domePhi, 1.5 * Math.PI, 0.30, Math.PI / 2 - 0.30);
        const idx = inner.index.array;
        for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
        inner.index.needsUpdate = true;
        inner.computeVertexNormals();
        parts.push({ mat: 0, geo: xform(inner, { y: domeY }) });
      }
      // BROKEN PIER STUMP (Fable r6) — the surviving dome quarter overhangs the gap; at side elevation
      // that read as a HOVERING dome over a void. A broken pier stump stands UNDER the overhanging rim
      // at the +angle jamb, reaching toward the dome rim (y≈0.6) — ruins persist where something held,
      // and the eye accepts the overhang the instant one support touches it.
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.12, 0.54, 0.12), { x: Math.cos(2 * Math.PI / 11) * 0.48, z: Math.sin(2 * Math.PI / 11) * 0.48, y: 0.27, ry: 0.5, rz: 0.06 }) });
      // + one fallen block on the flooded floor at the collapse foot (the tide stains its feet jade).
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.14, 0.12, 0.13), { x: -0.05, z: 0.42, y: 0.20, ry: 1.1, rz: -0.22 }) });
      // OCULUS gilt reveal — an INWARD-facing frustum recessed at the apex, extended DOWN into the interior
      // (Fable D2) so the withheld gold catches from the worm's-eye low-oblique through the collapse. Never
      // an exterior face — the gold is only sunset trapped inside the hole (r0.12 < oculus rim 0.136).
      parts.push({ mat: 1, geo: xform(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 6, 1, true), { y: domeY + 0.35 }) });   // rides down with the dome (apex now ≈domeY+0.44) so the gilt stays recessed below the lip
      return mergeLagoonParts(parts);
    },
    // Fairness + composition (§9): draw r FIRST, couple x to it. Inner edge |x|−ρ·r ≥ 14.5. Wider than
    // tall (dome). Heroes stand PLUMB (tilt 0 explicit — a missing tilt is a NaN quaternion).
    place: (side, rnd) => {
      const r = 17 + rnd() * 9;
      // ρ 0.70·sMax 1.10 → 0.77; couple x at 0.80·r so the inner edge = 16 + 0.03·r ≥ 16 clears the ±16
      // gate veil at every size (colonnata precedent), not just the 14.5 fairness floor.
      const p = { x: side * (16 + 0.80 * r + rnd() * 6), h: 8 + rnd() * 4, r, tilt: 0 };
      if (HERO_SET.has('rotunda')) p.rotY = 0;   // debug: wound (local +z) faces down-lane toward the camera
      return p;
    },
  },
  // THE LOST LAGOON — THE LOW REST / COMMONS (LOST-LAGOON-BIBLE.md §4.4): living Victoria-amazonica
  // lily-pad rafts flush with the mirror — the ONLY living green in the whole biome cycle, and the scale
  // witness (a 2m pad beside a 40m dome). Cuts the gold reflection lane into green ellipses in the
  // foreground. Paper-thin water-conforming discs with an upturned rim + a radial notch (NOT a thick
  // tilted ice floe) + hair-thin reed blades. FOLIAGE bake (olive-gold up / shadow-green else) — NEVER
  // the tide ladder (that would bleach the pads ivory = ice-floe leak). No glow (commons carry no gilt).
  lilyraft: {
    step: 19, biomes: lagoonNew, matIndex: 0, comp: { floor: 0.12, sMin: 0.90, sMax: 1.06 }, // low rest commons: clusters of a few around the island heroes, near-empty in the open-water breaths (Fable r1)
    build: () => {
      const parts = [];
      // HERO PAD — a near-vertical upturned rim (partial cone) around a plate RECESSED to the rim base.
      // Fable l2 D2: the recess makes the rim's inner wall (near-horizontal normals → shadow-green) show
      // as a dark crescent inside the olive plate = the bowl read (no painted ring — the shadow is
      // geometric). D1: the notch is cut through BOTH rim AND plate (aligned theta) so it reads in PLAN
      // as a real dark-water wedge — the Victoria pad's primary aerial signature.
      const rimTh = 5.0, ry = 0.6;   // ~73° notch gap; plate theta is mirrored by the rx flip → 2π−rimTh
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.32, 0.30, 0.09, 7, 1, true, 0, rimTh), { y: 0.045, ry }) });                 // 14
      parts.push({ mat: 0, geo: xform(new THREE.CircleGeometry(0.29, 7, 2 * Math.PI - rimTh, rimTh), { y: 0.02, rx: -Math.PI / 2, ry }) });      // 7 (plate in the bowl, notch aligned)
      // NOTCH CUT FACES — close the two radial ends so the split shows THICKNESS, not a paper edge (Fable
      // build-sheet #3). At each notch-end world angle, a quad from plate-centre → plate-edge → rim crest.
      {
        const v = [];
        for (const a of [ry, rimTh + ry]) {   // the two notch-end angles in world (rim present arc = [ry, rimTh+ry])
          const C = [0, 0.02, 0], PE = [0.29 * Math.cos(a), 0.02, 0.29 * Math.sin(a)];
          const RB = [0.30 * Math.cos(a), 0.0, 0.30 * Math.sin(a)], RC = [0.32 * Math.cos(a), 0.09, 0.32 * Math.sin(a)];
          v.push(...C, ...PE, ...RC, ...C, ...RC, ...RB);
        }
        const cut = new THREE.BufferGeometry();
        cut.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        cut.computeVertexNormals();
        cut.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((v.length / 3) * 2), 2));
        parts.push({ mat: 0, geo: cut }); // 4
      }
      // SECOND PAD — a smaller sibling, full rim, no notch (three distinct radii; no radial symmetry).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.24, 0.20, 0.08, 6, 1, true), { x: 0.38, z: -0.10, y: 0.04 }) }); // 12
      parts.push({ mat: 0, geo: xform(new THREE.CircleGeometry(0.20, 6), { x: 0.38, z: -0.10, y: 0.02, rx: -Math.PI / 2 }) });       // 6 (recessed to rim base)
      // YOUNG PAD — a flat juvenile, no rim, a breath of tilt (breaks the "product line" read).
      parts.push({ mat: 0, geo: xform(new THREE.CircleGeometry(0.13, 6), { x: -0.30, z: 0.28, y: 0.03, rx: -Math.PI / 2, rz: 0.05 }) }); // 6
      // REED SPEARS — 3 hair-thin tapering blades rising from the raft's near edge, all within ~0.28 rad
      // of vertical (Fable l2 D4: a reed is a spear, never a stick adrift — no near-horizontal sliver).
      {
        const v = [];
        const blades = [ // [bx, bz, h, leanX, leanZ, yaw] — leans kept small so none reads horizontal
          [-0.12, -0.20, 1.00, 0.06, 0.05, 0.4],
          [-0.05, -0.24, 0.84, 0.10, 0.02, 1.5],
          [-0.18, -0.18, 0.70, 0.04, 0.07, 2.6],
        ];
        for (const [bx, bz, h, lx, lz, yaw] of blades) {
          const px = -Math.sin(yaw), pz = Math.cos(yaw), wb = 0.030, wt = 0.008;
          const BL = [bx - px * wb, 0, bz - pz * wb], BR = [bx + px * wb, 0, bz + pz * wb];
          const tx = bx + lx, tz = bz + lz;
          const TL = [tx - px * wt, h, tz - pz * wt], TR = [tx + px * wt, h, tz + pz * wt];
          v.push(...BL, ...BR, ...TR, ...BL, ...TR, ...TL);
        }
        const reeds = new THREE.BufferGeometry();
        reeds.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        reeds.computeVertexNormals();
        reeds.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((v.length / 3) * 2), 2));
        parts.push({ mat: 0, geo: reeds }); // 8
      }
      return mergeLagoonParts(parts, { bake: 'lily' });
    },
    // LOW hugger: top ≤ 1.2·sMax ≈ 1.27 world < 1.5. tilt 0 EXPLICIT (a raft conforms to water — a tilted
    // pad is a floe; and a missing tilt is a NaN quaternion). Draw r first, couple x (ρ≈0.68 footprint).
    place: (side, rnd) => { const r = 3.5 + rnd() * 4; return { x: side * (14.5 + 0.74 * r + rnd() * 5), h: 0.9 + rnd() * 0.3, r, tilt: 0 }; },
  },
  // THE LOST LAGOON — THE BARE FOIL (LOST-LAGOON-BIBLE.md §4.5): a slumped heap of recognizably DRESSED
  // temple stones — a coursed standing stub with its capital still proud, a fallen column broken into
  // drums, tumbled blocks. NO ladder, NO gilt, NO light at all: the rest note whose silence makes the
  // gilt elsewhere earned. Legible RUIN (not a rock pile) is what makes the darkness read reverent, not
  // unfinished. lagoonFoil mass (foil path skips the tide bake); mat-1 EMPTY (grep-enforced).
  wrackstone: {
    step: 31, biomes: lagoonNew, matIndex: 0, comp: { floor: 0.12, sMin: 0.90, sMax: 1.08 }, // foil rest note: clusters with the commons, near-empty in the breaths (Fable r1)
    build: () => {
      const parts = [];
      // SURVIVING STUB — ONE course (Fable w1: a 2-course shaft previews the PR-4 pillar HAZARD skin;
      // a rest note must never rhyme with a collider). A low proud STUMP, not a monument — the capital
      // rides its crest as the unit-top; the tall slot belongs to campanile.
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.32, 0.44, 0.28), { x: -0.24, z: -0.06, y: 0.22, ry: 0.25 }) });            // 12
      // CAPITAL (locked as-built, just lowered onto the stump) — a flared frustum + an abacus slab.
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.15, 0.10, 0.10, 5, 1, true), { x: -0.24, z: -0.06, y: 0.49, rz: 0.05 }) }); // 10
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.22, 0.06, 0.22), { x: -0.24, z: -0.06, y: 0.565, ry: 0.25, rz: 0.05 }) });       // 12 (crest ~0.60 = unit-top)
      // FALLEN DRESSED BLOCKS — 3 tumbled cubes forming a CLOSED chain from the stump to the drums (Fable
      // w1: no water gap in plan). Orderly breakage: dressed stone keeps flat faces; each overlaps a
      // neighbour in plan, varied ry, resting on the ground / each other.
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.26, 0.22, 0.24), { x: -0.02, z: 0.02, y: 0.11, ry: 0.5, rz: 0.05 }) });   // 12 (bridges stump→centre)
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.22, 0.18, 0.20), { x: 0.18, z: 0.14, y: 0.09, ry: 1.1 }) });             // 12
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.18, 0.15, 0.17), { x: 0.14, z: -0.14, y: 0.075, ry: 0.3, rz: -0.05 }) }); // 12
      // COLUMN DRUMS — the architecture SENTENCE. 6-seg (rounder break face reads "column slice", not a
      // box — Fable w1) lying along z (rx π/2) so the front drum's circular BREAK FACE addresses the
      // front/¾ camera; a slipped half-drum behind almost re-assembles toward it (the column that stood).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 6), { x: 0.30, z: 0.16, y: 0.13, rx: Math.PI / 2, ry: 0.15 }) }); // 24 (closed; +z break face to camera; underside at y0)
      // Half-drum CLOSED (both hex ends capped): the +z end sinks into the full drum (occluded), the −z
      // end is a clean break face. No separate CircleGeometry cap → no edge-on sliver fin (Fable w2).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.13, 0.13, 0.26, 6), { x: 0.34, z: -0.10, y: 0.13, rx: Math.PI / 2, ry: 0.35 }) }); // 24
      return mergeLagoonParts(parts);   // tide-laddered dressed stone (Fable r1: the dark foil read as floating garbage at gameplay distance — pale bleached crowns + jade waterline convert it to ruin; distinctness is the tumbled silhouette, not the value)
    },
    // MID foil scatter, ~2:1 WIDE (Fable w1): normalized crest ~0.60, so h 3.5–5 world → the capital-
    // stump reads proud over a low wide rubble field, never a tower. Draw r first, couple x → inner ≥16
    // (clears the ±16 gate veil). tilt a breath (a heap may lean).
    place: (side, rnd) => { const r = 4.5 + rnd() * 3; return { x: side * (16 + 0.72 * r + rnd() * 4), h: 3.5 + rnd() * 1.5, r, tilt: side * (rnd() * 0.08 - 0.03) }; },
  },
  // THE LOST LAGOON — THE MID MASS (LOST-LAGOON-BIBLE.md §4.3): a slumped masonry chunk being swallowed
  // by a strangler fig — 2–3 arcing root ribs gripping the stone, holding up one broad wind-sheared
  // parasol. The theology's second claiming ENACTED mid-action (the garden winning, on camera). The one
  // COMPOSITE: tide-laddered stone (plumb) + tagged olive foliage (roots + canopy) in ONE material group.
  rootbastion: {
    step: 43, biomes: lagoonNew, matIndex: 0, arrivalPark: true, sizeClass: true, comp: { floor: 0.10, sMin: 0.90, sMax: 1.12 }, // mid mass: clusters into archipelagos, off the seam + empty in the breaths; 3 size classes for island hierarchy (Fable r1/r1b)
    build: () => {
      const parts = [];
      // STONE (untagged → tide ladder). PLUMB (Fable PLUMB-TIDE law: the jade waterline is a level water
      // stain; an instance tilt would rotate the baked band diagonal). All slump lives ABOVE the band.
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.44, 0.22, 0.38), { y: 0.11 }) });                              // 12 — waterline course; top edge AT y0.22 = the band boundary (dead-level jade)
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.40, 0.33, 0.34), { y: 0.385, ry: 0.18, rz: 0.10 }) });         // 12 — slumped upper mass (entirely in the bleach stop → free to shear)
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.18, 0.18, 0.18), { x: 0.12, z: 0.30, y: 0.09, ry: 0.5 }) });    // 12 — satellite chunk (the next stone the fig reaches for)
      // FIG. A SHORT trunk from the stone crown holding the canopy; roots + trunk are `bake:'root'`
      // (DARK — shadow-green flanks, olive only on top-curves) so they read strangling the PALE stone.
      parts.push({ mat: 0, bake: 'root', geo: xform(new THREE.CylinderGeometry(0.10, 0.16, 0.18, 5, 1, true), { y: 0.61 }) }); // 10 — trunk (crown y0.52 → top y0.70)
      // 3 ROOT RIBS — chains of tapering frusta that GRIP the stone (small standoff), start inside the
      // trunk, taper down, FLARE at a foot entering the water (Fable GRIP law: not tentacle/pipe/LED).
      const rib = (pts, radii) => { for (let i = 0; i < pts.length - 1; i++) parts.push({ mat: 0, bake: 'root', geo: frustumBetween(pts[i], pts[i + 1], radii[i], radii[i + 1], 3) }); }; // 3-seg: thin roots, imperceptible facets, saves tris for round cones
      rib([[0.00, 0.62, 0.05], [0.05, 0.48, 0.16], [0.07, 0.24, 0.19], [0.09, 0.01, 0.25]], [0.055, 0.045, 0.040, 0.075]); // A: down the +z face → foot flares (24)
      rib([[0.02, 0.60, -0.02], [0.20, 0.46, 0.02], [0.29, 0.20, 0.05], [0.33, 0.01, 0.09]], [0.050, 0.038, 0.032, 0.062]); // B: down the +x face, thinner (24)
      rib([[0.04, 0.52, 0.14], [0.09, 0.28, 0.24], [0.12, 0.09, 0.30]], [0.042, 0.036, 0.055]);                              // C: short — grips the satellite chunk (16)
      // PARASOL CANOPY — 2 SQUASHED CLOSED CONES (Fable rb3: closed cone not a circle-sandwich → no
      // grazing slit; a 10% apex rise kills the flat-table read but stays parasol, not broccoli). SHRUNK
      // + OFFSET +z so the plan shows STONE on the −z side (no full-disc lilyraft twinning); pad B DRAPES
      // low onto the crown (occlusion weld → no hover); Δy + distinct tilts break the slab; pad A wind-torn.
      parts.push({ mat: 0, bake: 'lily', geo: xform(new THREE.ConeGeometry(0.36, 0.05, 7), { x: 0.02, z: 0.30, y: 0.74, sx: 1.14, sz: 0.80, rz: 0.12, ry: 0.5 }) });  // pad A — aloft, offset down-lane (stone −z exposed in plan) (21)
      parts.push({ mat: 0, bake: 'lily', geo: xform(new THREE.ConeGeometry(0.27, 0.045, 6), { x: 0.06, z: 0.36, y: 0.56, sx: 1.05, sz: 0.80, rz: 0.22, rx: 0.16 }) });  // pad B — −z edge sinks into the crown (y0.56≈crown top → occlusion weld, no hover) (18)
      return mergeLagoonParts(parts);
    },
    // MID mass, ~1.6–1.9:1 wide (the broad canopy drapes wider than the mass is tall): r 8–11, h 6–8.5
    // → world ≈ 1.6:1 wide. tilt 0 EXPLICIT (PLUMB-TIDE law — the slump is in the geometry, never an
    // instance tilt). Draw r first, couple x → inner edge ≥15.5.
    place: (side, rnd) => { const r = 8 + rnd() * 3; return { x: side * (15.5 + 0.66 * r + rnd() * 4), h: 6 + rnd() * 2.5, r, tilt: 0 }; },
  },
  // THE LOST LAGOON — THE MASSIF / backdrop (LOST-LAGOON-BIBLE.md §4.2): a long, low, drowned COLONNADE
  // wall punched by a rank of narrow lancets, each running water-to-peak so its reflection completes it
  // into a coin of gold sky. The only repeated-negative-space family — the nested-threshold grammar made
  // serial. THE NO-LONE-ARCH LAW (Fable, the Sinking-Gates firewall): intact arches come in a CONTIGUOUS
  // run (≥2, shared piers); only the END spans collapse, to STUMPS below the spring line — structurally
  // incapable of the hazard's single free-standing frame. Tide-laddered stone, plumb, mat-1 EMPTY.
  arcade: {
    step: 97, biomes: lagoonNew, matIndex: 0, arrivalPark: true, oneSide: true, comp: { floor: 0.0, sMin: 0.95, sMax: 1.08 }, // backdrop massif: an EVENT — ONE side per congregation, fully parked in the breaths, never a both-horizon wall (Fable r1)
    build: () => {
      const zf = 0.04, zb = -0.04, yBand = 0.22, spring = 0.32, peak = 0.72; // edge loop at the tide band; arch spring → peak (lintel bottom)
      // WORLD-ASPECT DESIGN (Fable a1): the (r,h,r) scale multiplies unit-X by r and unit-Y by h
      // INDEPENDENTLY, so unit proportions lie. Target world opening w:h ≈ 1:2 at r≈120,h≈20: height
      // world = 0.72·20 ≈ 14.4 → width world ≈ 7.2 → unit bay width ≈ 0.06 (and a low spring → the tall
      // pointed section is the majority of the opening → a sharp gothic lancet, un-flyable, ≠ hazard portal).
      const nP = 8, wp = 0.065, wb = 0.06;                                   // 8 piers / 7 bays; tall-narrow lancets in world
      const W = nP * wp + (nP - 1) * wb;
      const pierTops = [0.24, 0.31, 0.86, 0.80, 0.92, 0.78, 0.88, 0.83];     // piers 0–1 STUMPS (below the 0.32 spring, varied); 2–7 full, varied (no level course)
      const intact = new Set([2, 3, 4, 5, 6]);                               // a contiguous rank of 5 intact bays; bays 0,1 collapsed at one end
      const pierL = [], pierR = [];
      let x = -W / 2;
      for (let i = 0; i < nP; i++) { pierL[i] = x; x += wp; pierR[i] = x; if (i < nP - 1) x += wb; }
      const v = [];
      const q = (a, b, c, d) => v.push(...a, ...b, ...c, ...a, ...c, ...d);
      const t = (a, b, c) => v.push(...a, ...b, ...c);
      // PIERS — front (+z) + back (−z), split at the tide band so the jade line is dead-level (PLUMB-TIDE
      // + edge-loop law). Openings run water-to-peak, so ONLY the piers carry jade → a DASHED jade rhythm.
      // Each pier gets an up-facing TOP CAP (Fable a1: without it the hollow ribbon vanishes in plan).
      for (let i = 0; i < nP; i++) {
        const xL = pierL[i], xR = pierR[i], top = pierTops[i];
        const full = intact.has(i) || intact.has(i - 1);   // a pier that carries an arch → 2 courses (jade/bleach split); a stump → 1 course (all-jade post)
        const y1 = full ? Math.min(yBand, top) : top;
        q([xL, 0, zf], [xR, 0, zf], [xR, y1, zf], [xL, y1, zf]);
        q([xR, 0, zb], [xL, 0, zb], [xL, y1, zb], [xR, y1, zb]);
        if (full && top > yBand) { q([xL, yBand, zf], [xR, yBand, zf], [xR, top, zf], [xL, top, zf]); q([xR, yBand, zb], [xL, yBand, zb], [xL, top, zb], [xR, top, zb]); }
        q([xL, top, zb], [xR, top, zb], [xR, top, zf], [xL, top, zf]);   // TOP CAP (faces up)
      }
      // INTACT BAYS — pointed-arch spandrels (void peaks UP into the mass, rotunda r7 lesson) + a lintel
      // course above (peak→bayTop) with a TOP CAP + jamb returns (wall THICKNESS at every hole; a hole
      // with no return is paper). Lancet world w:h ≈ 1:2, 15% tighter than the rotunda hero (serial rank).
      for (let j = 0; j < nP - 1; j++) {
        if (!intact.has(j)) continue;
        const xL = pierR[j], xR = pierL[j + 1], xm = (xL + xR) / 2, bayTop = Math.min(pierTops[j], pierTops[j + 1]);
        t([xL, spring, zf], [xL, peak, zf], [xm, peak, zf]); t([xR, spring, zf], [xm, peak, zf], [xR, peak, zf]); // front spandrels
        q([xL, peak, zf], [xR, peak, zf], [xR, bayTop, zf], [xL, bayTop, zf]);                                   // front lintel
        t([xL, peak, zb], [xL, spring, zb], [xm, peak, zb]); t([xm, peak, zb], [xR, spring, zb], [xR, peak, zb]); // back spandrels
        q([xR, peak, zb], [xL, peak, zb], [xL, bayTop, zb], [xR, bayTop, zb]);                                   // back lintel
        q([xL, bayTop, zb], [xR, bayTop, zb], [xR, bayTop, zf], [xL, bayTop, zf]);                               // lintel TOP CAP (closes the plan ribbon)
        q([xL, 0, zf], [xL, spring, zf], [xL, spring, zb], [xL, 0, zb]);   // left jamb return
        q([xR, 0, zb], [xR, spring, zb], [xR, spring, zf], [xR, 0, zf]);   // right jamb return
      }
      // WALL END CAPS — close the run's two ends (front-to-back at pier 0 left + pier 7 right).
      q([pierL[0], 0, zb], [pierL[0], 0, zf], [pierL[0], pierTops[0], zf], [pierL[0], pierTops[0], zb]);
      q([pierR[nP - 1], 0, zf], [pierR[nP - 1], 0, zb], [pierR[nP - 1], pierTops[nP - 1], zb], [pierR[nP - 1], pierTops[nP - 1], zf]);
      const wall = new THREE.BufferGeometry();
      wall.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      wall.computeVertexNormals();
      wall.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((v.length / 3) * 2), 2));
      return mergeLagoonParts([{ mat: 0, geo: wall }]);
    },
    // BACKDROP massif, ~5–8:1 WIDE: r 92–132 (w = 0.94·r ≈ 86–124), h 16–24. tilt 0 EXPLICIT (PLUMB-TIDE).
    // FAR off-lane scenery: couple x = ρ·sMax·r (0.47·1.05≈0.49) + ~80 so the inner edge lands ~80 world
    // (Fable: the massif recedes on the horizon, never near the lane). No foam (a collar 75+ off-lane).
    place: (side, rnd) => { const r = 92 + rnd() * 40; return { x: side * (80 + 0.50 * r + rnd() * 12), h: 16 + rnd() * 8, r, tilt: 0 }; },
  },

  // ===== THE LUMEN MIRE — PR-2 depth + canopy substrate (LUMEN-MIRE-BIBLE.md §4) =====
  // Registered LAST so no existing band's render-rnd draw order shifts. All near-black
  // mat-0 dark foil (the "matter drinks" side of the ladder); the only emissive is
  // canopywall's 2 pinprick distant beacons. Owner brightness lock: PR-2 adds DARKNESS
  // (mass, roof, depth) — glow arrives with the PR-3 hero, never a brighter night.

  // canopywall — the distant MASSIF ("the swamp's far mountain"). A cumulus-line of drowned
  // tree crowns: 6 squashed dome-lobes (sy ≤ 0.7·sx — scalloped LOBES, never peaks) at
  // staggered azimuth+radius (rotY-proof), necking to a narrow root-stem the ground-mist
  // severs so it floats on fog. Mass in the upper y-band; crops the horizon under the amber
  // haze. 2 pinprick beacons recessed under lobe overhangs (the under-brim address at a mile).
  canopywall: {
    step: 83, biomes: mireNew, matIndex: 4,
    build: () => {
      const parts = [];
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.10, 0.16, 0.5, 5).toNonIndexed(), { y: 0.25 }) });
      const lobes = [
        { x: 0.00, z: 0.00, y: 0.74, s: 0.62, sy: 0.55, sz: 0.9, ry: 0.3 },
        { x: 0.44, z: 0.10, y: 0.60, s: 0.50, sy: 0.50, sz: 1.2, ry: 1.1 },
        { x: -0.42, z: 0.16, y: 0.64, s: 0.54, sy: 0.52, sz: 0.8, ry: 2.0 },
        { x: 0.18, z: -0.32, y: 0.56, s: 0.46, sy: 0.48, sz: 1.1, ry: 3.0 },
        { x: -0.24, z: -0.26, y: 0.58, s: 0.44, sy: 0.46, sz: 0.9, ry: 4.0 },
        { x: 0.30, z: 0.36, y: 0.50, s: 0.42, sy: 0.50, sz: 1.3, ry: 5.2 },
      ];
      for (const l of lobes) parts.push({ mat: 0, geo: xform(new THREE.IcosahedronGeometry(l.s, 0), { x: l.x, z: l.z, y: l.y, sy: l.sy, sz: l.sz, ry: l.ry }) });
      parts.push({ mat: 1, geo: xform(new THREE.CircleGeometry(0.009, 4).toNonIndexed(), { x: 0.30, z: 0.05, y: 0.52, rx: -Math.PI / 2 }) });
      parts.push({ mat: 1, geo: xform(new THREE.CircleGeometry(0.008, 4).toNonIndexed(), { x: -0.28, z: 0.10, y: 0.50, rx: -Math.PI / 2 }) });
      const merged = mergeParts(parts, 4);
      // Fable 75 lever-2b: bake the veil ladder (lobes light, root-stem stays black — the mist severs it)
      // + swap mat-0 to mireVeil (mat-1 glow pinpricks keep accent[4], vertexColors off → ignore the bake).
      bakeMireLadder(merged.geometry, { baseY: 0.25, apexY: 0.95, base: _MIRE_VEIL_BASE, mid: _MIRE_VEIL_MID, apex: _MIRE_VEIL_APEX });
      merged.materials[0] = propMats.mireVeil;
      return merged;
    },
    place: (side, rnd) => { const r = 30 + rnd() * 18; return { x: side * (30 + 1.0 * r + rnd() * 24), h: 26 + rnd() * 12, r, tilt: 0 }; },
  },

  // reedveil — NEAR depth screen. A comb of 5 feathered reed tufts (each = 2 thin splayed
  // cones — the sanctioned "sparse feathered reeds" exception to no-sharp-verticals) at
  // varied heights + 1 leaning bare snag. Sweeps past fast; sells speed. All near-black.
  reedveil: {
    step: 23, biomes: mireNew, matIndex: 4, gateClear: 34, treeClear: 34,   // park ALL (x 22–34) in a gate corridor (both flanks) or a tree corridor (parity flank) — reeds+reflections break the mirror
    build: () => {
      const parts = [];
      const tufts = [
        { x: 0.00, z: 0.00, h: 1.00, r: 0.05 },
        { x: 0.30, z: 0.12, h: 0.72, r: 0.045 },
        { x: -0.26, z: 0.18, h: 0.86, r: 0.05 },
        { x: 0.14, z: -0.24, h: 0.60, r: 0.04 },
        { x: -0.20, z: -0.20, h: 0.92, r: 0.05 },
      ];
      for (const t of tufts) {
        parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(t.r, t.h, 3), { x: t.x, z: t.z, y: t.h / 2, rz: 0.05 }) });
        parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(t.r * 0.7, t.h * 0.7, 3), { x: t.x + 0.05, z: t.z, y: t.h * 0.4, rz: -0.18 }) });
      }
      parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(0.06, 1.1, 4), { x: 0.34, z: -0.10, y: 0.5, rz: 0.5 }) });
      return mergeParts(parts, 4);
    },
    place: (side, rnd) => ({ x: side * (22 + rnd() * 12), h: 6 + rnd() * 4, r: 3 + rnd() * 3, tilt: side * (rnd() * 0.06 - 0.02) }),
  },

  // boleveil — MID depth screen. 3 bare drowned boles (offset-stacked BOWED segments,
  // knuckled — never straight cylinders) sharing one blobby crown mass at the top third.
  // The mid-ground black shape the drape fringe + future glow-carriers read AGAINST.
  boleveil: {
    step: 41, biomes: mireNew, matIndex: 4, gateClear: 48, treeClear: 58,   // gate corridor: park inner half (x<48, both flanks, outer stay as framing). tree corridor: park ALL on the parity flank (x<58 — the tree stands inside the bole band, no outer half to keep)
    build: () => {
      const parts = [];
      const boles = [
        { x: 0.00, z: 0.00, lean: 0.06 },
        { x: 0.34, z: 0.12, lean: -0.10 },
        { x: -0.30, z: 0.16, lean: 0.12 },
      ];
      for (const b of boles) {
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.06, 0.10, 0.5, 4).toNonIndexed(), { x: b.x, z: b.z, y: 0.25, rz: b.lean }) });
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.045, 0.07, 0.42, 4).toNonIndexed(), { x: b.x + b.lean * 0.4, z: b.z, y: 0.62, rz: -b.lean * 1.4 }) });
      }
      parts.push({ mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.34, 0), { x: 0.02, z: 0.06, y: 0.82, sy: 0.6, sx: 1.2 }) });
      parts.push({ mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.22, 0), { x: 0.28, z: -0.04, y: 0.74, sy: 0.55 }) });
      const merged = mergeParts(parts, 4);
      // Fable 75 lever-2b: crown mass at 0.74–0.82 catches the apex; the drowned boles stay dark.
      bakeMireLadder(merged.geometry, { baseY: 0.00, apexY: 0.95, base: _MIRE_VEIL_BASE, mid: _MIRE_VEIL_MID, apex: _MIRE_VEIL_APEX });
      merged.materials[0] = propMats.mireVeil;
      return merged;
    },
    place: (side, rnd) => ({ x: side * (36 + rnd() * 22), h: 16 + rnd() * 10, r: 8 + rnd() * 6, tilt: side * (rnd() * 0.05 - 0.02) }),
  },

  // drape — THE OVERHEAD CEILING (the Canopy Law mechanism). A "weeping titan": a slender
  // bowed trunk (unit y 0..0.66, ρ ≤ 0.09 — scaffolding, mostly out of frame) carrying a
  // radially-overhanging crown of 3 squashed dome-lobes + a ragged hem of 8 short hanging
  // fronds, ALL above unit y 0.66. The `overhead` declaration (read by propclearance) audits
  // clearance from the sub-0.66 trunk ONLY and asserts the crown sits at world y ≥ 28 (above
  // laneMaxY 22 + camera) — so the roof paints the top of frame without ever blocking the lane.
  // Dark foil (moss DARK); the glowing air is the PR-1 mote system drifting under the fringe.
  drape: {
    step: 19, biomes: mireNew, matIndex: 4,
    overhead: { unitY: 0.66, minWorldY: 28 },
    build: () => {
      const parts = [];
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.05, 0.09, 0.66, 4).toNonIndexed(), { y: 0.33, rz: 0.04 }) });
      // Radial crown of squashed dome-lobes, ALL fully above unit y 0.66 (bottom ≥ 0.67 so
      // no crown vertex counts against lane clearance) and overhanging in every yaw (rotY-proof).
      const lobes = [
        { x: 0.00, z: 0.00, y: 0.92, s: 0.54, sy: 0.44 },   // bottom ≈ 0.92 − 0.24 = 0.68
        { x: 0.46, z: 0.16, y: 0.86, s: 0.44, sy: 0.42 },   // bottom ≈ 0.86 − 0.18 = 0.68
        { x: -0.42, z: -0.12, y: 0.88, s: 0.46, sy: 0.42 }, // bottom ≈ 0.88 − 0.19 = 0.69
      ];
      for (const l of lobes) parts.push({ mat: 0, geo: xform(new THREE.IcosahedronGeometry(l.s, 0), { x: l.x, z: l.z, y: l.y, sy: l.sy }) });
      // ragged hem: 8 short fronds pointing DOWN (rx PI), tips kept ≥ unit 0.66 (above the
      // flyable ceiling — so they never count against lane clearance and never read as a wall).
      const fr = [
        { x: 0.48, z: 0.12, len: 0.13 }, { x: 0.28, z: 0.36, len: 0.10 },
        { x: -0.42, z: 0.08, len: 0.12 }, { x: -0.20, z: -0.34, len: 0.10 },
        { x: 0.12, z: -0.40, len: 0.13 }, { x: 0.44, z: -0.18, len: 0.11 },
        { x: -0.48, z: -0.16, len: 0.11 }, { x: 0.02, z: 0.46, len: 0.10 },
      ];
      for (const f of fr) parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(0.03, f.len, 3).toNonIndexed(), { x: f.x, z: f.z, y: 0.79 - f.len / 2, rx: Math.PI }) });
      const merged = mergeParts(parts, 4);
      // Fable 75 lever-2b: lobes + frond hem warm; the sub-0.66 trunk stays black (mostly out of frame anyway).
      bakeMireLadder(merged.geometry, { baseY: 0.55, apexY: 1.00, base: _MIRE_VEIL_BASE, mid: _MIRE_VEIL_MID, apex: _MIRE_VEIL_APEX });
      merged.materials[0] = propMats.mireVeil;
      return merged;
    },
    // h kept LOW (43–51) so the crown hangs at world y ≈ 28–34 — the closest legal roof, which
    // enters the top of frame at a nearer z (a denser top-band window → the Canopy Law holds
    // every frame). tilt small (crown reach is offset-built, not tilted).
    place: (side, rnd) => ({ x: side * (19 + rnd() * 9), h: 43 + rnd() * 8, r: 11 + rnd() * 5, tilt: side * (0.02 + rnd() * 0.04) }),
  },

  // glowcolossus — THE HERO (LUMEN-MIRE-BIBLE §4 / Fable PR-3 §1). A colossal ancient
  // weather-torn giant mushroom — a NatGeo MONUMENT, not a toadstool: a squashed sagged
  // dome (h:w ≤ 0.45) offset off a fat off-center tapering stalk, one collapsed sag-lobe +
  // a torn rim, a broken fairy-ring court (one toppled dead). The ONLY emitter is the
  // recessed down-facing GILL DISH (mat 1 living-amber, recessed ~20% inside the rim, tilted
  // up toward the stalk so it's dark from overhead, a warm underlit shelf from the ¾ vantage —
  // the "under the brim" address). Cap/stalk/court are dark foil (mat 0). Everything indexed
  // (sphere/cone/cyl) → no toNonIndexed. Registered LAST. ~131 tris.
  // RETIRED (Fable ensemble plan §1): the under-brim/crown-colony theology lost to the owner's
  // obvious-glow reset, and a fifth glow family is soup. Parked (biomes:[]) — code + hero
  // machinery kept (glowarch inherits the pattern); its step 61 is freed for glowarch.
  glowcolossus: {
    step: 61, biomes: [], matIndex: 4, hero: true,
    build: () => {
      const parts = [];
      // main dome — squashed asymmetric sagged umbrella, offset off the stalk axis
      parts.push({ mat: 0, geo: xform(new THREE.SphereGeometry(0.56, 7, 2, 0, Math.PI * 2, 0, Math.PI * 0.5), { x: 0.05, y: 0.5, sy: 0.62, sz: 0.88 }) });
      // collapsed sag-lobe on one flank (asymmetry + the "torn" beat), interpenetrating ≥25%
      parts.push({ mat: 0, geo: xform(new THREE.SphereGeometry(0.36, 5, 2, 0, Math.PI * 2, 0, Math.PI * 0.5), { x: 0.30, z: 0.05, y: 0.44, sy: 0.5, sz: 0.8 }) });
      // GILL DISH root (Fable v41) — the below/reflection read: shallow down-facing cone, apex up.
      // The BLACK MIRROR is the ¾-from-below vantage inverted, so the reflection twin views this.
      parts.push({ mat: 1, geo: xform(new THREE.ConeGeometry(0.44, 0.12, 6, 1, true), { x: 0.05, y: 0.45 }) });
      // THE GILL-MARGIN FOLD (Fable v41) — the CHASE-CAM read. A frustum folding DOWN-AND-OUT
      // (rTop 0.44 high → rBottom 0.52 low ≈ 33° below horizontal, normal outward) so the game's
      // near-horizontal camera ray catches a warm underline. Stays INSIDE the dome silhouette
      // (rim ~0.56 → a dark lip always crowns it: on-contour glow = flush LED, banned) and dips
      // just below the skirt so the horizontal ray reaches it. Same mireLiving material.
      parts.push({ mat: 1, geo: xform(new THREE.CylinderGeometry(0.44, 0.52, 0.09, 6, 1, true), { x: 0.05, y: 0.41 }) });
      // fat tapering stalk (wider at the waterline), off-center under the dome
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.14, 0.22, 0.52, 7, 1, true), { y: 0.26 }) });
      // one bulging buttress swelling interpenetrating the stalk base
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.09, 0.14, 0.34, 4, 1, true), { x: 0.14, z: -0.04, y: 0.17, rz: 0.12 }) });
      // fairy-ring court — 3 DARK members (the court died, the colossus endures — a better broken
      // beat than its old under-glow the camera never saw, Fable v42): ex-glow cap + mini + toppled
      parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(0.15, 0.12, 4, 1, true), { x: 0.42, z: 0.2, y: 0.07 }) });
      parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(0.13, 0.11, 4, 1, true), { x: -0.38, z: -0.26, y: 0.06 }) });
      parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(0.12, 0.36, 4, 1, true), { x: -0.44, z: 0.3, y: 0.06, rz: 1.35, ry: 0.5 }) });
      // THE CROWN COLONY (Fable v42) — 7 bioluminescent spore-growths in one broken arc across the
      // cap's lane-facing (+z) shoulder, spilling over the torn rim + onto the sag-lobe wound. These
      // are the CAMERA-FACING glow the top-down chase-cam can actually see (the granted exception:
      // "the cap stays dark matter; life colonizes it"). Up-facing open cones (no pitch — shear law),
      // seated ~0.02 below the dome surface (interpenetration). Apex stays dark (nearest ≥0.36R from top).
      const colony = [
        { x: 0.18, z: 0.38, y: 0.70, r: 0.11, h: 0.045 },
        { x: 0.32, z: 0.28, y: 0.66, r: 0.07, h: 0.035 },
        { x: 0.05, z: 0.46, y: 0.62, r: 0.08, h: 0.050 },
        { x: -0.12, z: 0.34, y: 0.70, r: 0.055, h: 0.030 },
        { x: 0.44, z: 0.12, y: 0.58, r: 0.09, h: 0.040 },
        { x: 0.52, z: -0.02, y: 0.52, r: 0.05, h: 0.045 },
        { x: -0.30, z: 0.10, y: 0.72, r: 0.045, h: 0.025 },
      ];
      for (const c of colony) parts.push({ mat: 1, geo: xform(new THREE.ConeGeometry(c.r, c.h, 3, 1, true), { x: c.x, z: c.z, y: c.y }) });
      // Route the hero's mat-1 glow through the brighter hero-only escalator (intensity 2.3) so the
      // crown colonies + gill fold read from the top-down camera. Only glowcolossus does this.
      const merged = mergeParts(parts, 4);
      merged.materials[merged.materials.length - 1] = propMats.mireHeroLiving;
      return merged;
    },
    // Colossal: r 26–36, h 18–24 → cap diameter ~35–50m vs a ~3m dragon. Pulled ~8–11m closer
    // (Fable v42 D-lever) so the camera looks more level at it; rim y 9–12 = the camera band.
    // AUTHORED rotY (heroes keep it) so the +z colony shoulder greets the approaching camera up-lane.
    // Heroes stand PLUMB (tilt 0 explicit — a missing tilt is a NaN quaternion); lean is offset geometry.
    place: (side, rnd) => { const r = 26 + rnd() * 10; return { x: side * (14.5 + 0.72 * r + rnd() * 4), h: 18 + rnd() * 6, r, tilt: 0, rotY: Math.PI }; },
  },

  // ===== THE FOUR-FORM ENSEMBLE (Fable ensemble plan, scratchpad 51) — OBVIOUS GLOW. Each owns a
  // different distance band, altitude, scale octave + glow tier so four luminous forms compose into
  // ONE scene instead of glow-soup. glowarch is live (Stage 1 hero); glowtree/glowshroom/glowbloom
  // are renamed + parked (biomes:[]) until their stages activate them. mat 1 = glow, mat 0 = dark. =====

  // glowarch — THE HERO (Fable §1/§4): a colossal glowing ROOT-ARCH you fly THROUGH. Straddles the
  // lane (place x:0); legs at unit ±0.58 with ρ ≤0.10 keep the inner edge ≥16m (clears the 14.5
  // fairness floor + the ±16 gate veil), a ≈34m door under a ~48m crown. Value-structured by the
  // Mire glow-ladder (apex white core → gold legs → dark roots), knuckle collars break the ribbon
  // into segmented living root (not an LED strip), a DARK crown binding is the apex-notch signature.
  glowarch: {
    step: 61, biomes: mireNew, matIndex: 4, hero: true, heroSolo: true, gate: true,
    overhead: { unitY: 0.72, minWorldY: 28 },
    build: () => {
      const parts = [];
      for (const s of [-1, 1]) {
        parts.push({ mat: 1, geo: xform(new THREE.CylinderGeometry(0.08, 0.10, 0.92, 5, 1, true), { x: s * 0.58, y: 0.46, rz: -s * 0.05 }) }); // glowing leg (leans in slightly), open
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.12, 0.15, 0.20, 5), { x: s * 0.59, y: 0.10 }) });                        // dark flared root base
        parts.push({ mat: 1, geo: xform(new THREE.CylinderGeometry(0.075, 0.08, 0.55, 5, 1, true), { x: s * 0.28, y: 1.00, rz: s * 1.05 }) }); // glowing top segment sweeping to the peak
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.125, 0.125, 0.05, 4, 1, true), { x: s * 0.575, y: 0.30, rz: -s * 0.05 }) }); // dark knuckle collar (low)
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.115, 0.115, 0.05, 4, 1, true), { x: s * 0.565, y: 0.60, rz: -s * 0.05 }) }); // dark knuckle collar (high)
      }
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 5), { y: 1.06 }) }); // dark crown binding — the apex notch (silhouette signature at distance)
      const merged = mergeParts(parts, 4);
      bakeMireLadder(merged.geometry, { apexY: 1.14, mid: [0.62, 0.45, 0.24] }); // core→bloom→dark; deeper mid (Fable 68 §4) so the apex-white core survives at gameplay distance (legs don't wash to uniform gold)
      merged.materials[merged.materials.length - 1] = propMats.mireHeroLadder; // mat-1 group reads the ladder + hero glow
      return merged;
    },
    // Cathedral gate: r 38–44, h 40–46 → apex world y ~46–52, gap ~34m. Straddles x:0 (rotY:0 faces
    // down-lane, the Λ square to the camera). heroSolo parks one side (else two arches z-fight at x0).
    place: (side, rnd) => ({ x: 0, h: 40 + rnd() * 6, r: 38 + rnd() * 6, tilt: 0, rotY: 0 }),
  },

  // glowspire — THE LANTERN SPIRE far-beacon (Fable 62-redesign). The owner killed the world-tree:
  // a trunk+crown can never be the hero of a swamp whose whole dark substrate IS trunks+crowns. The
  // beacon is reborn as a shape the Mire does NOT contain — a colossal drowned ancestor-spar the
  // swamp's life colonized into a lighthouse: a thin dark mast carrying FIVE staggered glowing
  // shelf-conks up to a white-hot lantern bud, a splintered dark tip above it. Vertical (aspect ~1:4),
  // tiered, brightest at the top — the ONLY vertical/tiered/tallest silhouette in the biome. Towers
  // 1.8–2.3× over the canopywall massif. mireFarLiving @1.8 (proven), value-laddered up the mast.
  glowspire: {
    step: 67, biomes: mireNew, matIndex: 4, hero: true, heroShift: 150, heroParity: true, heroRare: 0.4,
    build: () => {
      const parts = [];
      const ni = (g) => g.toNonIndexed(); // match the non-indexed icosa bud so mergeParts stays consistent
      parts.push({ mat: 0, geo: xform(ni(new THREE.CylinderGeometry(0.10, 0.145, 0.55, 5, 1, true)), { y: 0.275, rz: 0.05 }) });  // dead spar, lower
      parts.push({ mat: 0, geo: xform(ni(new THREE.CylinderGeometry(0.065, 0.10, 0.48, 5, 1, true)), { x: 0.03, y: 0.76, rz: -0.07 }) }); // spar, upper (offset-stacked/bowed — boleveil idiom)
      parts.push({ mat: 0, geo: xform(ni(new THREE.ConeGeometry(0.045, 0.12, 3)), { x: 0.045, y: 0.99 }) });                       // splintered dark TIP (interrupt above the bud)
      // five glowing shelf-conks bracketing UP the mast, alternating flanks + shrinking; each of the
      // lower three seats on a wider DARK under-saucer (the dark cup/lip beyond the glow rim).
      const shelves = [
        { R: 0.34, y: 0.30, x: 0.20, rz: 0.06, h: 0.055, saucer: true },
        { R: 0.29, y: 0.45, x: -0.17, rz: -0.06, h: 0.055, saucer: true },
        { R: 0.25, y: 0.59, x: 0.15, rz: 0.05, h: 0.055, saucer: true },
        { R: 0.20, y: 0.72, x: -0.12, rz: -0.05, h: 0.05, saucer: false },
        { R: 0.15, y: 0.84, x: 0.09, rz: 0.04, h: 0.05, saucer: false },
      ];
      for (const s of shelves) {
        if (s.saucer) parts.push({ mat: 0, geo: xform(ni(new THREE.ConeGeometry(s.R + 0.045, 0.06, 4, 1, true)), { x: s.x, y: s.y - 0.045, rz: s.rz }) }); // dark under-saucer (wider dark lip)
        parts.push({ mat: 1, geo: xform(ni(new THREE.ConeGeometry(s.R, s.h, 5)), { x: s.x, y: s.y, rz: s.rz }) }); // glowing shelf-conk (flat base = the reflection glow disc)
      }
      parts.push({ mat: 1, geo: xform(new THREE.OctahedronGeometry(0.10, 0), { x: 0.045, y: 0.945 }) });                       // lantern BUD (the white core; non-indexed, cheap)
      for (const s of [-1, 1]) parts.push({ mat: 1, geo: xform(ni(new THREE.ConeGeometry(0.07, 0.26, 3, 1, true)), { x: s * 0.16, y: 0.08, rz: -s * 0.4 }) }); // glowing root flares (waterline weld; ladder dims them to ember)
      const merged = mergeParts(parts, 4);
      bakeMireLadder(merged.geometry, { baseY: 0.12, apexY: 1.00, mid: [0.83, 0.60, 0.31], base: [0.42, 0.32, 0.16] }); // S1 dim-gold → S5 hot → bud near-white core (vertical ladder up the mast)
      merged.materials[merged.materials.length - 1] = propMats.mireFarLiving; // @1.8 far beacon (hard cap 1.9)
      return merged;
    },
    // Towers over canopywall (r 30–48 / h 26–38): tip at world y ~65–76 = 1.8–2.3× the massif. Thin
    // footprint (r 26–34, ρ≤0.59) wins on HEIGHT + tier-rhythm, not bulk. Coupling 0.66 clears the ±16 veil.
    place: (side, rnd) => { const r = 26 + rnd() * 8; return { x: side * (17 + 0.66 * r + rnd() * 8), h: 62 + rnd() * 10, r, tilt: 0, rotY: 0 }; },
  },

  // glowshroom — THE MID CARRIER (Fable §1, Stage 3; named glowshroom to avoid the legacy `glowcap`):
  // the CAP itself glows on top (obvious to the down-cam) + a bright crown boss; dark rim + stalk.
  // Parked until Stage 3 (its §7-C mottle revision + gate-clear engine line land then).
  glowshroom: {
    step: 45, biomes: mireNew, matIndex: 4, arrivalPark: true, comp: { floor: 0.10, sMin: 0.72, sMax: 1.25, glow: true }, // sMax 1.25 (Fable 68): peak survivors SWELL into a thicket-event instead of the grove reading flat
    build: () => {
      const parts = [];
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.06, 0.13, 0.7, 6), { y: 0.35 }) }); // tall dark stalk
      parts.push({ mat: 1, geo: xform(new THREE.SphereGeometry(0.42, 7, 3, 0, Math.PI * 2, 0, Math.PI * 0.5), { y: 0.7, sy: 0.62 }) }); // GLOWING cap dome (obvious from above)
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.44, 0.42, 0.06, 9, 1, true), { y: 0.7 }) }); // dark rim band for definition
      // 3 DARK MOTTLE patches (Fable 65-gate R2): re-seated ON the dome shell (y from the shell equation
      // y=0.70+0.62·√(0.42²−d²), minus 0.02) + enlarged + tilted to hug the shoulder normal (~0.5 rad
      // outward) so the whole patch lies on the dome — the old y0.80/0.82/0.83 buried them under the shell.
      parts.push({ mat: 0, geo: xform(new THREE.SphereGeometry(0.15, 5, 2), { x: 0.241, z: 0.097, y: 0.885, sy: 0.4, rz: -0.463, rx: 0.187 }) });
      parts.push({ mat: 0, geo: xform(new THREE.SphereGeometry(0.13, 5, 2), { x: -0.191, z: 0.161, y: 0.89, sy: 0.4, rz: 0.383, rx: 0.321 }) });
      parts.push({ mat: 0, geo: xform(new THREE.SphereGeometry(0.12, 5, 2), { x: -0.028, z: -0.269, y: 0.875, sy: 0.4, rz: 0.052, rx: -0.498 }) });
      parts.push({ mat: 1, geo: xform(new THREE.SphereGeometry(0.15, 5, 2), { y: 0.98 }) }); // crown boss = the bright CORE (ladder makes it near-white)
      const merged = mergeParts(parts, 4);
      // R1: bake the cap ladder (0 tris) keyed to the CAP span → dome-edge dark → dome gold → crown white,
      // so the carrier gets a real core→bloom→dark without a flat blown dome (mat-0 stalk/rim/mottles ignore it).
      bakeMireLadder(merged.geometry, { baseY: 0.66, apexY: 1.10, base: [0.42, 0.32, 0.16], mid: [0.847, 0.659, 0.376] });
      merged.materials[merged.materials.length - 1] = propMats.mireCarrierLadder; // tier-3 @1.6, vertexColors
      return merged;
    },
    // MID carrier (Fable §2): r 12–18 / h 14–20, congregates into flank thickets off the lane.
    place: (side, rnd) => { const r = 12 + rnd() * 6; return { x: side * (26 + 0.6 * r + rnd() * 12), h: 14 + rnd() * 6, r, tilt: 0, rotY: 0 }; },
  },

  // glowbloom — THE NEAR SCATTER (Fable §1, Stage 4): a cluster of GLOWING pods on dark stalks at
  // staggered heights — the breadcrumb lanterns that write the safe lane (the dimmest tier-4 pale glow).
  glowbloom: {
    step: 37, biomes: mireNew, matIndex: 4, arrivalPark: true, comp: { floor: 0.45, sMin: 0.80, sMax: 1.05, glow: true }, // step 37 prime (Fable 68): coprime with shroom 45 + all Mire steps, kills the gcd-9 lattice co-beat
    build: () => {
      const parts = [];
      const ni = (g) => g.toNonIndexed(); // match the non-indexed octahedron bulbs
      // Wide height stagger (Fable §7-D: 0.50–0.95 so it doesn't read as one row from the chase cam) + jittered XZ.
      const pods = [{ x: 0.02, z: 0.0, h: 0.95, s: 0.17 }, { x: 0.31, z: 0.13, h: 0.72, s: 0.13 }, { x: -0.27, z: 0.19, h: 0.58, s: 0.14 }, { x: 0.13, z: -0.31, h: 0.50, s: 0.12 }];
      for (const p of pods) {
        parts.push({ mat: 0, geo: xform(ni(new THREE.CylinderGeometry(0.028, 0.045, p.h, 3)), { x: p.x, z: p.z, y: p.h / 2, rz: p.x * 0.3 }) }); // dark stalk (3-seg, Fable §7-D)
        parts.push({ mat: 0, geo: xform(ni(new THREE.ConeGeometry(p.s + 0.03, p.s * 0.55, 4, 1, true)), { x: p.x, z: p.z, y: p.h - p.s * 0.5 }) }); // dark CALYX cup — the bulb sits in a dark husk
        parts.push({ mat: 1, geo: xform(new THREE.OctahedronGeometry(p.s, 0), { x: p.x, z: p.z, y: p.h }) }); // glowing bulb (faceted lantern-gem)
      }
      const merged = mergeParts(parts, 4);
      merged.materials[merged.materials.length - 1] = propMats.mireEmberLiving; // pale afterglow tier-4 @0.85
      return merged;
    },
    // NEAR scatter (Fable §2): small + low, r 6–10 / h 10–14, near the lane (the breadcrumb lantern line).
    place: (side, rnd) => { const r = 6 + rnd() * 4; return { x: side * (20 + rnd() * 10), h: 10 + rnd() * 4, r, tilt: 0, rotY: 0 }; },
  },

  // TEMPEST REACH — HERO #1 (TEMPEST-REACH-BIBLE.md): stormprow, a storm-carved SHEARED WEDGE.
  // A layered wedge whose long dip-slope steps up out of the sea to ONE sharp crest, the whole
  // mass leaning visibly DOWN-WIND — a dark diagonal against the pale horizon slot. THE DIAGONAL
  // IS THE IDENTITY. Built as offset-stacked box strata: the lean is carried entirely by lateral
  // OFFSET in build() (never internal rotation — the (r,h,r) instance scale shears internal tilts
  // FLAT). Each stratum steps shorter on the WINDWARD (−x) side → the stepped dip-slope; each
  // rides further LEEWARD (+x) as it rises → the leaning overhang crest. The waterline stratum is
  // narrower + recessed → the UNDERCUT storm-tell. Strata interpenetrate ≥25%. The three mandatory
  // storm-tells all read: waterline undercut + visible lean + horizontal stratification. ENTIRELY
  // BARE — ONE material group (mat 0 = tempestStone), zero emissive/accent/gold. The carved read
  // is the baked wind-scour value ladder (pale wind-bitten scour / damp body / soaked belly). rotY
  // pinned so the local scour axis stays wind-aligned and every prow leans the SAME down-wind way.
  stormprow: {
    step: 17, biomes: tempestNew, matIndex: 7, arrivalPark: true, comp: { floor: 0.04, sMin: 0.90, sMax: 1.12 },
    build: () => {
      const parts = [];
      // SKEWED SHEARED WEDGE (Fable device critique P1 — the real Minecraft fix). The lean is no longer
      // a step-offset staircase (axis-aligned jags = the Minecraft read); it's a vertex SKEW applied about
      // the base after positioning, so the windward face is ONE CONTINUOUS DIAGONAL of parallelogram faces
      // catching light at the slope angle. Strata now stack ~vertically (small centerX progression) + taper
      // to a small crest; skewX(SKEW) shears the whole stack downwind coherently. A small per-stratum ry
      // twist keeps neighbours non-parallel (F6). [centerX, y, w, h, d, ry].
      const SKEW = 0.62;
      const strata = [
        [-0.02, 0.09, 0.44, 0.20, 0.60,  0.05],   // 0 WATERLINE belly — narrow + recessed → undercut
        [ 0.00, 0.28, 0.52, 0.20, 0.56, -0.07],   // 1 overhangs the belly (the storm undercut)
        [ 0.02, 0.47, 0.44, 0.20, 0.48,  0.05],   // 2
        [ 0.04, 0.65, 0.32, 0.19, 0.40, -0.06],   // 3
        [ 0.06, 0.82, 0.16, 0.16, 0.28,  0.04],   // 4 CREST — sharp, small, far downwind (via the skew)
      ];
      for (const [x, y, w, h, d, ry] of strata) {
        parts.push({ mat: 0, geo: skewX(xform(new THREE.BoxGeometry(w, h, d), { x, y, ry }), SKEW) });
      }
      // Protruding ledge slabs riding the windward DIAGONAL — thin, wider in z → the stratification tell,
      // now proud of a continuous slope rather than a staircase. Skewed with the strata so they stay welded
      // to the dip-slope; a crest splinter sharpens the peak.
      const ledges = [
        [-0.16, 0.20, 0.22, 0.05, 0.50,  0.10],
        [-0.10, 0.40, 0.20, 0.05, 0.44, -0.12],
        [-0.02, 0.60, 0.16, 0.045, 0.36,  0.09],
        [ 0.06, 0.80, 0.10, 0.08, 0.26,  0.06],   // crest splinter
      ];
      for (const [x, y, w, h, d, ry] of ledges) {
        parts.push({ mat: 0, geo: skewX(xform(new THREE.BoxGeometry(w, h, d), { x, y, ry }), SKEW) });
      }
      return mergeTempestParts(parts);
    },
    // Fairness + composition: draw r FIRST, couple x to the footprint ρ (~0.68, measured from the
    // geometry) so the inner edge = |x| − ρ·r·sMax − lean HUGS the fatal side wall. The base course
    // kills laterally at |x| > laneHalfWidth (13), so the prows must SIT at that boundary to read as
    // real sidewalls — floated out at |x|~26 (the old mid-field placement) they framed nothing and the
    // player died in open water with no wall in sight. Base pulled 28→17 so the inner edge lands
    // ~15–17, just outside the 14.5 fairness floor: a tight walled corridor that MARKS the death line.
    // tilt leans AWAY from the lane (side*negative, sungate idiom); ALWAYS numeric (a missing tilt
    // → NaN quaternion → invisible). rotY pinned 0 so the wedge diagonal reads broadside down-lane
    // and the baked wind-scour stays aligned. ROOFLINE RHYTHM (Fable gate R1 fix #1): a ruler-flat
    // wall of same-height wedges reads as a harbor breakwater — nothing in Tsushima/BotW gives an
    // unbroken horizontal. `sel` picks ~1-in-4 as a HERO prow towering to h 20–32 (2–3× the low
    // body h 7–13), so the crest-line breaks into a low-low-HIGH silhouette. Height is independent
    // of x, so clearance is unaffected. CONSTANT 4 rnd() draws (r, x-jitter, sel, hv).
    place: (side, rnd) => { const r = 8 + rnd() * 6; const x = side * (18 + 0.72 * r + rnd() * 3); const sel = rnd(); const hv = rnd(); const h = sel > 0.76 ? 20 + hv * 12 : 7 + hv * 6; const j = rnd(); return { x, h, r, tilt: side * -0.06, rotY: (side > 0 ? Math.PI : 0) + (j - 0.5) * 0.3 }; },  // MIRROR the wedge per bank (Fable: the corridor becomes a balanced V, not one-way-tilted) + ±0.15 jitter so no two share a silhouette. inner edge still hugs |x|=13
  },

  // TEMPEST REACH — DEPTH BACK-RANK (Fable gate R1 fix #2). Pulling the near prow wall in to hug the
  // |x|=13 death line (the fairness fix) emptied the mid-field to bare ocean — the scene collapsed
  // from a layered vista to ONE depth plane, "a corridor in a void." This restores the second plane:
  // sparse, TALLER wedges far off-lane (|x| ~32–48) that the storm fog fades to pale ghost sea-stacks
  // on the horizon — the NatGeo / monumental read the mid-field placement used to carry. PURE SCENERY:
  // far beyond the fatal wall it can never touch the player, so there is no clearance concern, and a
  // foam collar 30+ off-lane would be a bright artifact (riftwall/ridge/arcade precedent → foam:false).
  // Reuses the near wall's exact wind-carved geology (shared builder — same strata, same baked scour)
  // so the two ranks read as one coherent coastline; only the scale (taller aspect) + fog separate
  // them. step 29 is coprime with the near wall's 17 → no lattice co-beat between the ranks. rotY
  // pinned 0 = every prow leans the SAME down-wind way as the near rank. CONSTANT 3 rnd() draws.
  stormprowFar: {
    step: 36, biomes: tempestNew, matIndex: 7, arrivalPark: true, comp: { floor: 0.22, sMin: 0.95, sMax: 1.20 },
    build: () => ARCHETYPES.stormprow.build(),
    place: (side, rnd) => { const r = 12 + rnd() * 10; const j = rnd(); return { x: side * (34 + 0.90 * r + rnd() * 10), h: 24 + rnd() * 22, r, tilt: side * -0.05, rotY: (side > 0 ? Math.PI : 0) + (j - 0.5) * 0.3 }; },  // MIRROR per bank (matches the near wall's V) + jitter. x coupled so the far rank sits BEHIND the near wall
  },

  // TEMPEST REACH — THE GLOW CARRIER (bible §4 `tafonihold`): a rounded, honeycombed tafoni block whose
  // cavernous seaward face cradles THE GLOW ADDRESS — a low horizontal band of wave-worn SOCKETS pooled
  // with stolen gold (#ffd870), lit only on the sea-facing (+z, toward the approaching camera) arc. This
  // is the ONE family that carries warmth; the bare stormprow foil is what earns it. Mass ~1.3:1 (broad,
  // weather-rounded — icosahedral lumps, not stacked boxes, so it reads DIFFERENT from the angular prows).
  // The three storm-tells still read: recessed waterline belly (undercut), a scour ledge (stratification),
  // slight lean. mat 0 = tempestStone (wind-scour ladder), mat 1 = accent[7] gold pools. rotY 0 so the
  // socket face always turns toward the camera on approach.
  tafonihold: {
    step: 60, biomes: tempestNew, matIndex: 7, arrivalPark: true, comp: { floor: 0.0, sMin: 0.88, sMax: 1.20, glow: true },
    build: () => {
      const parts = [], centers = [];
      // Rounded core mass — two interpenetrating icosahedral lumps (weather-rounded boulder, top ~1.05),
      // one broad + one shouldered so the silhouette is irregular without a third lump's tri cost.
      parts.push({ mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.54, 0), { y: 0.56, sy: 0.95, sx: 1.12 }) });
      parts.push({ mat: 0, geo: xform(new THREE.IcosahedronGeometry(0.38, 0), { x: -0.32, y: 0.40, z: 0.10, sy: 0.90 }) });
      // Recessed waterline belly (undercut storm-tell) — a narrow dark base the rounded mass overhangs.
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.72, 0.18, 0.62), { y: 0.09 }) });
      // THE GLOW ADDRESS — a low band of gold sockets pooled in wave-worn hollows on the seaward (+z)
      // face. VARIED sizes + IRREGULAR clustering (not an even row) so no boulder reads as a stamped
      // pattern; the recessed scoops double as the honeycombed tafoni weathering. [x, y, z, radius].
      const sockets = [[-0.30, 0.36, 0.47, 0.14], [-0.13, 0.30, 0.52, 0.18], [0.05, 0.41, 0.50, 0.11], [0.28, 0.34, 0.47, 0.15], [0.44, 0.29, 0.37, 0.10]];
      for (const [sx, sy, sz, ss] of sockets) addGoldSocket(parts, centers, sx, sy, sz, ss);
      const m = mergeTempestParts(parts);
      bakeSocketSpill(m.geometry, centers, 0.34);   // warm gold bloom bleeds onto the rim rock — wider spill (Fable: concentrate the gold into POOLS), 0 tris
      return m;
    },
    // NEAR glow carrier — broad+low so the socket band sits at eye height on approach. r 8–12, h 9–12
    // world. x coupled to the ~0.6 footprint (·sMax 1.12) so the inner edge clears the 14.5 floor.
    place: (side, rnd) => { const r = 8 + rnd() * 4; return { x: side * (16 + 0.84 * r + rnd() * 4), h: 9 + rnd() * 3, r, tilt: side * -0.04, rotY: 0 }; },
  },

  // TEMPEST REACH — THE HERO / PUNCTUATION (bible §4 `stormstack`): a lone wave-cut sea-stack, the ONE
  // TALL archetype (~1:2.2), rarest step. A pinched waterline NOTCH (the undercut, where the sea gnawed
  // the waist), a scoured shaft stepping up in offset bands (stratification + lean), crowned by a wider
  // weather-hardened MUSHROOM CAP (the wave-cut signature). 2–3 gold sockets pooled AT the notch, sun-side.
  // `hero: true` phase-locks it to the congregation peak so it lands as deliberate punctuation, not scatter.
  stormstack: {
    step: 95, biomes: tempestNew, matIndex: 7, arrivalPark: true, comp: { floor: 0.0, sMin: 0.90, sMax: 1.15, glow: true },
    build: () => {
      const parts = [], centers = [];
      // Wave-cut foot (below the notch) — the broad platform the stack rises from.
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.32, 0.46, 0.18, 5), { y: 0.09 }) });
      // THE PINCH — a DEEP narrow notched waist just above the waterline. This is the wave-cut signature;
      // it has to survive to silhouette (Fable: "if the notch doesn't read, it doesn't exist"), so the
      // waist is much thinner than the foot AND the cap it carries — a real hourglass undercut.
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.15, 0.24, 0.20, 5), { y: 0.27 }) });
      // The shaft — one tall tapering band, slightly offset (a downwind lean).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.21, 0.24, 0.52, 5), { y: 0.60, x: 0.04 }) });
      // THE MUSHROOM CAP — a WIDE hardened overhang (~1.5× the shaft), flared shadowed underside (the
      // down-facing lip AO-darkens into the wave-cut hollow) so it reads as a real overhang. Pushed OFF-AXIS
      // and made slightly ELLIPTICAL (sx 1.18) so it isn't a rotationally-clean "water tower" (Fable r2).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.34, 0.56, 0.06, 5), { y: 0.855, x: 0.10, sx: 1.18 }) }); // flared shadowed underside
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.56, 0.40, 0.14, 5), { y: 0.94, x: 0.10, sx: 1.18 }) });  // cap crown
      // A broken crown CHIP knocked off one side of the rim — breaks the tidy cap silhouette (sea stacks
      // are shattered on top), and its underside AO-darkens for a shadowed fracture.
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.22, 0.16, 0.20), { x: -0.34, y: 0.99, z: 0.06, rz: 0.5, ry: 0.4 }) });
      // Gold sockets pooled AT the notch (low, sea-facing), varied sizes — the stolen-gold address.
      const sockets = [[0.02, 0.27, 0.20, 0.075], [0.15, 0.30, 0.12, 0.055]];
      for (const [sx, sy, sz, ss] of sockets) addGoldSocket(parts, centers, sx, sy, sz, ss);
      const m = mergeTempestParts(parts);
      bakeSocketSpill(m.geometry, centers);
      return m;
    },
    // TALL rare punctuation, ZONED OUT to the skyline (Fable device critique #1+#4). rareness = big step
    // 95 + comp floor 0 (present ONLY on the swaying headland peaks, alternating banks via the per-side
    // phase); a LANDMARK height tier makes ~1-in-3 tower to h 42–56 (clearly dominant over the wall + the
    // hero prows) instead of a uniform mid-height picket. Pushed to inner ~28 (base 30) so the tall stacks
    // stand BEHIND the near death-wall as a distant rank — tall=far builds the rising amphitheatre, and
    // they stop looming at even height over the lane. x coupled to the ~0.75 cap footprint (·sMax 1.15).
    place: (side, rnd) => { const r = 4 + rnd() * 5; const x = side * (30 + 0.68 * r + rnd() * 6); const big = rnd(); const hv = rnd(); const h = big > 0.67 ? 42 + hv * 14 : 22 + hv * 14; return { x, h, r, tilt: side * (rnd() * 0.05 - 0.02), rotY: (rnd() - 0.5) * 0.3 }; },
  },

  // TEMPEST REACH — THE LOW REST (bible §4 `stackgrave`): a scatter of stubby BROKEN stumps over a
  // wave-cut platform — the ~3:1 broad, low family that writes the negative space between the tall
  // punctuation. BARE (no gold): the silence that makes the glow carriers count. Snapped stump crowns
  // (tilted caps) read as storm-shattered. step 13 (densest) so it fills the rest-beats along the wall.
  stackgrave: {
    step: 32, biomes: tempestNew, matIndex: 7, arrivalPark: true, comp: { floor: 0.20, sMin: 0.90, sMax: 1.08 },
    build: () => {
      const parts = [];
      // Wave-cut platform + an offset shelf slab — the broad low base (undercut reads at the platform lip).
      parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(0.60, 0.68, 0.14, 6), { y: 0.07 }) });
      parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(0.50, 0.07, 0.95), { y: 0.11, z: 0.08 }) });
      // Broken stumps — short tapered cylinders that LEAN at varied angles (storm-snapped, not tidy
      // pillars); the tilt + varied height + AO shading reads as a shattered field. 5-sided, cap-less.
      const stumps = [[-0.32, 0.62, 0.10, 0.17, 0.22], [0.06, 1.00, -0.16, 0.20, -0.14], [0.36, 0.50, 0.22, 0.15, 0.26], [-0.12, 0.42, -0.30, 0.13, -0.28], [0.24, 0.74, -0.06, 0.16, 0.16]];
      for (const [sx, top, sz, rad, lean] of stumps) {
        const h = top - 0.12;
        parts.push({ mat: 0, geo: xform(new THREE.CylinderGeometry(rad * 0.78, rad, h, 5), { x: sx, y: 0.12 + h / 2, z: sz, rz: lean, rx: lean * 0.5 }) });
      }
      return mergeTempestParts(parts);
    },
    // BROAD + LOW rest — r 9–13, h 3–5 world. x coupled to the ~0.66 platform footprint (·sMax 1.08).
    place: (side, rnd) => { const r = 9 + rnd() * 4; return { x: side * (15 + 0.74 * r + rnd() * 5), h: 3 + rnd() * 2, r, tilt: 0, rotY: 0 }; },
  },

  // TEMPEST REACH — THE DISTANT MASSIF (bible §4 `arcuswall`): DEFERRED to a future sky-shader pass.
  // Built + tried as a floating `overhead` prop (a shelf-cloud reaching over the lane); it fought the
  // engine on every axis — the gold "leading lip" scaled into a flat yellow caution-tape plank, and the
  // hard-faceted silhouette read as floating obsidian slabs, not billowing thunderhead (Fable: a block-on
  // cheap-tell). It was also the worst triangle-budget offender. The bible itself flagged this risk ("if
  // the prop trick fails, demote to a sky-shader streak") — a soft billow + curling gold lip is a job for
  // the dome fragment shader (GRAPHICS-OVERHAUL), not instanced geometry. Left OUT of the roster for now.

  // TEMPEST REACH — THE BACKDROP VEIL (bible §4 `rainshaft`): a tall pale VIRGA column — a shaft of
  // falling rain caught as light, far off in the storm. Thin overlapping vertical slabs with soft tapered
  // tops so it reads as a rain-smudge, not a pillar. Ships as OPAQUE pale geometry the colour of the far
  // fog (#a7b2b0) so the distance makes it read translucent for FREE (zero transparency cost). No accent,
  // no ladder — it IS light through water. Far-field only; narrow footprint clears the lane trivially.
  rainshaft: {
    step: 29, biomes: tempestNew, matIndex: 7, arrivalPark: true, comp: { floor: 0.50, sMin: 0.95, sMax: 1.05 },
    build: () => {
      const parts = [];
      // FIVE overlapping columns spread WIDE (Fable: the old narrow single plank read as a render bug) —
      // a broad soft rain-smudge, never a solo pillar. Varied heights + soft tapered tops.
      const cols = [[0.0, 1.0, 0.17], [0.32, 0.84, 0.13], [-0.36, 0.90, 0.14], [0.17, 0.70, 0.10], [-0.17, 0.64, 0.10]];
      for (const [cx, top, w] of cols) {
        parts.push({ mat: 0, geo: xform(new THREE.BoxGeometry(w, top, w * 0.7), { x: cx, y: top / 2, z: cx * 0.3 }) });
        parts.push({ mat: 0, geo: xform(new THREE.ConeGeometry(w * 0.5, top * 0.3, 4), { x: cx, y: top * 1.12, z: cx * 0.3 }) }); // soft tapered top
      }
      return mergeTempestVirga(parts);
    },
    // FAR backdrop veil, WIDE + tall — r 10–16, pushed to |x| 55+ so it hangs in the deep fog behind the
    // rock rank and fills the open breaths with atmosphere (high comp floor 0.50 = a fairly constant far
    // veil). Narrow-ish footprint at that distance still clears. foam:false. rotY jitter to vary facing.
    place: (side, rnd) => { const r = 10 + rnd() * 6; return { x: side * (55 + rnd() * 24), h: 30 + rnd() * 18, r, tilt: 0, rotY: (rnd() - 0.5) * 0.5 }; },
  },

  // TEMPEST REACH — THE FAIRNESS REEF (Fable device critique P4 / owner's "artistic traffic cones"): a
  // continuous line of half-drowned BREAKERS pinned just outside the |x|=13 lateral-death wall. The
  // congregation breaths (good for composition) had re-exposed the old fairness bug — in an open stretch
  // the player drifts sideways into empty water and dies with no warning. This reef is the boundary LAYER,
  // separate from the composition layer: NO comp + NO arrivalPark → it NEVER parks, so a bright ribbon of
  // surf ALWAYS marks the death line even where the big props thin out. Reading "don't fly into the surf"
  // needs zero UI. Low (world top < laneMinY 2.5 → clearance-EXEMPT, so it can hug the wall without
  // intruding on the flight band) and cheap (~24 tris). The bright FOAM collar is the whole point.
  wrackline: {
    step: 11, biomes: tempestNew, matIndex: 7,
    build: () => {
      const parts = [];
      // A half-drowned wave-cut ledge + a broken chunk, skewed low over the waterline.
      parts.push({ mat: 0, geo: skewX(xform(new THREE.BoxGeometry(0.8, 0.6, 0.5), { x: 0, y: 0.30, ry: 0.2 }), 0.4) });
      parts.push({ mat: 0, geo: skewX(xform(new THREE.BoxGeometry(0.4, 0.5, 0.34), { x: 0.5, y: 0.25, ry: -0.5 }), 0.4) });
      return mergeTempestParts(parts);
    },
    // Pinned just outside the death wall (inner ~13.5–14; low → exempt from the ≥14.5 rule). step 11 =
    // a near-continuous ribbon; rotY random for variety. h 1.2–2.0 world (top well under laneMinY).
    place: (side, rnd) => { const r = 2.4 + rnd() * 1.6; return { x: side * (14.6 + rnd() * 1.2), h: 1.2 + rnd() * 0.8, r, tilt: 0, rotY: rnd() * Math.PI }; },
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
  colonnata: { r: 0.86 },   // Caldera hero — broad plinth waterline weld; reads as glowing lava shoreline
  flowlobe: { rx: 0.52, rz: 0.72 },   // low tongue — elliptical collar wraps the elongated footprint
  clinker: { r: 0.6 },                // foil rubble mound — round glowing-shoreline collar
  fumarole: { r: 0.6 },               // cinder-cone cluster — round waterline collar
  riftwall: false,                    // distant rim massif on the fog line — no collar (bright ring 30+ off-lane = artifact)
  riftfang: { r: 0.5 },               // volcanic neck — thin collar at the base
  rotunda: { r: 0.8 },   // Lost Lagoon hero — the drum waterline weld: the jade tide-band doubled in the mirror
  lilyraft: false,       // Lost Lagoon commons — NO collar: the pads ARE the waterline event; a foam ring on a 2m pad reads as an artifact (Fable pre-authorized)
  wrackstone: { r: 0.6 },// Lost Lagoon foil rubble — a pale tide collar where the heap meets the mirror (clinker precedent)
  rootbastion: { r: 0.7 },// Lost Lagoon mid mass — waterline weld under the slumped stone (roots enter here)
  arcade: false,          // Lost Lagoon backdrop massif — no collar (a bright ring 75+ off-lane is an artifact)
  spirevine: { r: 0.26 }, monolith: { r: 0.4 }, arcshard: { r: 0.55 },
  floe: { r: 0.72 }, iceFang: { r: 0.62 }, berg: { r: 0.62 }, skerry: { r: 0.55 }, // aurora ice — the waterline weld between silhouette + reflection
  ridge: false, // distant massif — a foam ring 30+ off-lane would be a bright artifact
  // Lumen Mire PR-2 depth/canopy: reedveil gets a faint warm waterline collar; the mid/far
  // and overhead families get no ring (a collar under a fog-line massif or a floating canopy
  // would be a bright off-lane artifact — the ridge lesson).
  reedveil: { r: 0.5 }, boleveil: false, canopywall: false, drape: false,
  glowcolossus: { r: 0.42 }, // retired hero (parked) — foam row kept inert
  // ensemble (Fable §2): glowarch = two legs → ELLIPTICAL waterline collar (archruin precedent);
  // parked forms carry inert rows until their stage activates + tunes them.
  glowarch: { rx: 0.66, rz: 0.16 }, glowspire: { r: 0.2 }, // arch elliptical collar; spire spar-only collar
  glowshroom: { r: 0.46 }, glowbloom: false, // shroom = a warm waterline collar on the fat cap footprint; bloom stalks too thin for a ring
  // Tempest Reach kit — stormprow: an ELLIPTICAL collar wrapping the sheared wedge's footprint
  // (wider in x along the dip-slope than in z), so the wet storm-shoreline weld hugs the base.
  stormprow: { rx: 0.86, rz: 0.44 },   // R2 #4: widened the wet-weld skirt so the base reads WELDED into the heaving sea, not placed on it
  stormprowFar: false,   // distant back-rank on the fog line — a collar 30+ off-lane is a bright artifact
  tafonihold: { r: 0.62 },   // broad rounded boulder — round collar hugs the footprint
  stormstack: { r: 0.40 },   // thin pillar — narrow collar at the pinched foot
  stackgrave: { rx: 0.66, rz: 0.56 },   // broad low platform — wide near-round collar
  rainshaft: false,   // distant rain-smudge — a collar under it would be a bright artifact
  wrackline: { r: 1.35 },   // THE breakers — a wide bright foam ring IS this prop's job (marks the death line)
};
for (const [name, cfg] of Object.entries(FOAM_CFG)) if (ARCHETYPES[name]) ARCHETYPES[name].foam = cfg;
// DEBUG-ONLY (default off): with `?hero=<archetype>`, strip biome 0 from every OTHER archetype so the
// posed hero stands alone in the real biome for the bar-setting render (legacy placeholder clutter off).
if (HERO_POSE) for (const [name, d] of Object.entries(ARCHETYPES)) { if (!HERO_SET.has(name) && Array.isArray(d.biomes)) d.biomes = d.biomes.filter((b) => b !== 0); }

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
// Emberfall Caldera studio keys (the live volcanic kit — colonnata + roster as it lands;
// `?props=v1` swaps in the legacy basalt/vent). Same drift-proof filter as Frozen.
export function calderaPropKeys() {
  return Object.entries(ARCHETYPES).filter(([, d]) => d.biomes.includes(3)).map(([k]) => k);
}
// The Lost Lagoon studio keys (the live drowned-ruins kit — rotunda + roster as it lands;
// `?props=v1` swaps in the legacy Sanctuary/Wastes props). Same drift-proof filter.
export function lagoonPropKeys() {
  return Object.entries(ARCHETYPES).filter(([, d]) => d.biomes.includes(0) && d.biomes === lagoonNew).map(([k]) => k);
}

// --- Lane-clearance audit seam (tools/propclearance.mjs) — BEHAVIOR-INERT ------
// For every archetype: the object-space max XZ radial extent ρ (the true reach
// toward the lane, since instances get a random rotY), the geometry's yMax (top),
// the comp sMax growth, and a brute-force sample of place() over a 4-draw rnd
// lattice. The tool asserts each prop's worst-case inner edge (|x| − ρ·r·sMax −
// lean) clears the ±13 fatal lane + the ±16 gate veil. Never imported by the game.
export function propClearanceData() {
  if (!propMats) propMats = makeMats();
  const grid = [0.001, 0.25, 0.5, 0.75, 0.999];
  return Object.entries(ARCHETYPES).map(([name, def]) => {
    const { geometry } = def.build();
    const p = geometry.getAttribute('position');
    let rho = 0, yMax = 0, xMax = 0, rhoLane = 0;
    // OVERHEAD amendment (LUMEN-MIRE-BIBLE.md drape / Fable PR-2 §2c): an archetype may
    // declare `overhead:{unitY,minWorldY}` — a roof whose crown reaches over the lane at a
    // height the flight band never touches. Its LANE clearance is measured from the sub-unitY
    // band (the trunk) ONLY; the crown is audited by a separate min-world-height assert.
    const ov = def.overhead || null;
    // GATE amendment (Fable ensemble §4): a CENTERED fly-through gate (glowarch, place x≈0) straddles
    // the lane — its clearance is the APERTURE half-width (how close the sub-apex legs approach x0),
    // NOT |placeX|−reach (which is 0−reach = false "invades lane"). Measure min|x| of the sub-unitY
    // leg/root geometry; the over-lane crown is exempted by the overhead crown-height assert.
    let apMin = Infinity;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), rad = Math.hypot(x, z);
      rho = Math.max(rho, rad); yMax = Math.max(yMax, y); xMax = Math.max(xMax, x);
      if (ov && y < ov.unitY) rhoLane = Math.max(rhoLane, rad);
      if (def.gate && (!ov || y < ov.unitY)) apMin = Math.min(apMin, Math.abs(x));
    }
    geometry.dispose();
    const apertureHalf = isFinite(apMin) ? apMin : 0;
    const samples = [];
    for (const a of grid) for (const b of grid) for (const c of grid) for (const d of grid) {
      const seq = [a, b, c, d]; let i = 0; const rnd = () => seq[(i++) % 4];
      samples.push(def.place(1, rnd));
    }
    return { name, biomes: def.biomes.slice(), rho, xMax, yMax, rhoLane, apertureHalf, overhead: ov, sMax: def.comp ? def.comp.sMax : 1, paired: !!def.paired, gate: !!def.gate, samples };
  });
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

// --- Runtime prop-instance factory (rock-run props-in-lane, Move 1) ----------
// The ONE shared geometry source for both consumers of an archetype: the
// decorative horizon bands (makeBand, below — untouched) and the in-lane
// `buildPropRun` in obstacles.js. Returns the same `{geometry, materials}` a
// band gets — materials are the SHARED `propMats.primary/accent[biomeIdx]`
// singletons, so an in-lane instance is tonally indistinguishable from the
// horizon by construction. Runtime callers run after createEnvironment (which
// sets propMats); the lazy makeMats() init exists only so headless tools/tests
// can call this without booting the whole environment (same idiom as
// buildArchetypeMesh/propDiag). Additive-only: nothing else reads these.
// `matIndex` (optional) re-skins the build to another biome's shared material
// pair — build() bakes the archetype's HOME biome (e.g. berg/floe/skerry bake
// aurora idx 6), but a RUN_KIT may borrow them into another biome's lane
// (RUN_KIT.frozen wants idx 2 glacial ice). Remap is by material identity, so
// it stays correct regardless of which of primary/accent a build emits.
export function buildPropArchetype(id, matIndex = null) {
  const def = ARCHETYPES[id];
  if (!def) return null;
  if (!propMats) propMats = makeMats();
  const out = def.build(); // fresh geometry each call; caller owns disposal
  if (matIndex != null) {
    out.materials = out.materials.map((m) => {
      if (propMats.primary.includes(m)) return propMats.primary[matIndex];
      if (propMats.accent.includes(m)) return propMats.accent[matIndex];
      return m;
    });
  }
  return out;
}
// Per-consumer clone of a shared prop material (in-lane props need a per-section
// fade clone). Material.clone() does NOT carry onBeforeCompile/customProgramCacheKey
// (they're own-property assignments Material.copy skips), so the weathering detail
// must be re-applied or the clone silently loses the noise/AO/atmos injection and
// reads plastic next to the bands it must match.
export function clonePropMaterial(m) {
  return addPropDetail(m.clone());
}
// Placement metadata for the same archetype, so RUN_KIT/buildPropRun can reason
// about it without reaching into the private table.
export function propArchetypeMeta(id) {
  const def = ARCHETYPES[id];
  if (!def) return null;
  return {
    matIndex: def.matIndex,
    step: def.step,
    biomes: def.biomes.slice(),
    comp: def.comp ? { ...def.comp } : null,
    foam: def.foam !== undefined ? def.foam : null,
    paired: !!def.paired,
  };
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
      // Per-biome DECK BIAS (Tempest): 0 = shipped gradient (byte-identical). >0 pulls the
      // mid→top transition DOWN so the dark storm ceiling owns most of the sky and the belt
      // compresses to a thin band above the horizon slot. Mirrored in skyProbe.js skyColorAt.
      uDeckBias: { value: 0 },
      // Dual-fog (BIOME-DESIGN.md §5.2): the far-field fog COLOR + its 0→1
      // gate. fogFarMix is 0 wherever no biome declares fogFarColor, so the
      // blend below is a branchless no-op there (the starMix pattern).
      fogFarColor: { value: new THREE.Color(0x57221a) },
      fogFarMix: { value: 0 },
      time: { value: 0 },
      // Rain FAR VEIL (Tempest, layer F): soft rain-veil curtains hanging from the deck
      // underside into the horizon slot. 0 = off (byte-identical). Scroll is a JS-wrapped
      // wind drift; Flash rides the lightning (0 until the lightning hazard lands).
      uRainVeil: { value: 0 },
      uRainVeilScroll: { value: 0 },
      uRainVeilFlash: { value: 0 },
      // Storm LIGHTNING FLASH (0 = off): a global desaturated lift, directional toward the strike,
      // held OFF the cloud undersides so the deck silhouettes against the flash. 0 outside Tempest.
      uStormFlash: { value: 0 },
      uStormFlashDir: { value: new THREE.Vector2(0, -1) },
      // EYE-BREACH (Tempest): the eye-of-the-gale window gate. 0 = off (byte-identical). >0 punches a
      // raked almond hole in the storm deck on the sun azimuth — bright calm interior + gold lower lip
      // + a deepened dark deck framing it. Mirrored (as a simple ambient lift) in skyProbe.js skyColorAt.
      uBreachMix: { value: 0 },
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
      uniform float feverMix, feverWarm, starMix, fogFarMix, time, dimMix, uDeckBias;
      uniform float uRainVeil, uRainVeilScroll, uRainVeilFlash, uStormFlash, uBreachMix;
      uniform vec2 uStormFlashDir;
      ${CLOUD_HEAD}
      ${AURORA_HEAD}
      // Rain-veil 1D value noise (layer F) — pure ALU, no texture.
      float _rvHash(float n) { return fract(sin(n) * 43758.5453); }
      float _rvN(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(_rvHash(i), _rvHash(i + 1.0), f); }
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
        // uDeckBias pulls the belt + deck transitions DOWN (0 = shipped): the storm ceiling owns
        // the sky, the belt compresses to a thin strip. Edges stay ordered for all bias in [0,1].
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.25 - 0.12 * uDeckBias, h));
        col = mix(col, topColor, smoothstep(0.2 - 0.13 * uDeckBias, 0.7 - 0.34 * uDeckBias, h));
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
        // EYE-BREACH (Tempest, uBreachMix 0 = off → byte-identical): a raked almond HOLE in the storm
        // deck on the SUN AZIMUTH — the eye of the gale, where the sun (hidden ABOVE the storm) leaks
        // through. Runs AFTER the cloud body so the window OVERWRITES the deck (a real hole, not a tint).
        // Order: (1) deepen the deck in a ring around the rim — the darkest sky frames the brightest hole,
        // THAT contrast is the landmark; (2) blend the interior gradient (warm-white low, silver-blue high)
        // + a thin gold lower lip. The sun DISC is never drawn — the core is a centerless brightness.
        if (uBreachMix > 0.001) {
          float _bAz = atan(d.z, d.x);                                            // fragment azimuth
          float _bSunAz = atan(sunDir.z, sunDir.x);                               // the world-locked breach azimuth
          float _dAz = atan(sin(_bAz - _bSunAz), cos(_bAz - _bSunAz));            // wrapped Δaz (−π..π)
          float _elC = 0.035;                                                     // KISS THE SLOT: the lip meets the horizon band (a mid-deck hole reads as a moon)
          // Raked almond (~4:1 wide:tall) — a SUBTLE eye low on the horizon. az half-width 0.20rad,
          // el half-width 0.042 (crisper 4:1); _rr is the elliptical radius so both the hole and its
          // frame are ALMOND, never a disc.
          float _nx = _dAz / 0.20;
          float _ny = (d.y - _elC - 0.14 * _dAz) / 0.042;                         // −0.14·Δaz = the rake
          float _rr = sqrt(_nx * _nx + _ny * _ny);
          // (1) THE HOLE FIRST — interior gradient, tight feather (fully faded by _rr 1.0).
          float _win = (1.0 - smoothstep(0.74, 1.0, _rr)) * uBreachMix;
          float _bT = clamp((d.y - (_elC - 0.042)) / 0.084, 0.0, 1.0);            // 0 at the bottom lip → 1 at the top
          vec3 _bLow = vec3(0.83, 0.80, 0.72);                                    // warm-white #f2e8d0-class, L≈0.80 (the brightest thing the biome shows)
          vec3 _bHigh = vec3(0.74, 0.77, 0.81);                                   // desaturated silver-blue high (keep it silver — never a saturated portal-blue)
          vec3 _interior = mix(_bLow, _bHigh, _bT);
          float _lip = smoothstep(0.16, 0.02, _bT);                              // thin GOLD lower lip (#ffd870), sun-facing, peaks at the bottom
          _interior = mix(_interior, vec3(1.0, 0.847, 0.439), _lip * 0.60);
          col = mix(col, _interior, _win);
          // (2) THE DARK MOVE, OVER the bloom (Fable r1: the ring must WIN): a tight ALMOND ring hugging
          // the rim (sharp onset at 1.0R, back to deck value by ~1.6R) → the darkest sky FRAMES the hole
          // (core→bloom→DARK). This is what makes it a breach in a wall, not a moon in the clouds.
          float _bDark = smoothstep(0.98, 1.12, _rr) * (1.0 - smoothstep(1.35, 1.65, _rr)) * uBreachMix;
          // Arc-bias (Fable r2 de-donut insurance): weak at the gold lip (bottom ~0.15×), strong at the
          // top (1.0×) so the dark frame CONNECTS UPWARD into the deck — a socket in the storm's wall, not
          // a floating dark ring/eclipse. _ny/_rr = sine of the ring arc angle (−1 bottom → +1 top).
          float _arcW = mix(0.15, 1.0, smoothstep(-1.0, 1.0, _ny / max(_rr, 0.001)));
          col = mix(col, vec3(0.137, 0.165, 0.200), _bDark * 0.92 * _arcW);
        }
        // RAIN FAR VEIL (layer F, uRainVeil 0 = off → byte-identical): soft vertical curtains of
        // rain-veil silver hanging from the deck underside down into the belt, scrolled along the
        // wind azimuth. Discrete shafts (gapped), faint vertical interior grain, THINNED toward the
        // sun/breach azimuth (composition law 6 — the focal hole stays clear). Pinned to fogFarColor
        // so the curtains and the pale far fog are one substance; brightens with the lightning flash.
        if (uRainVeil > 0.001) {
          float _az = atan(d.z, d.x);
          float _sc = _az * 2.3 + uRainVeilScroll;
          float _curt = _rvN(_sc) * 0.62 + _rvN(_sc * 2.7 + 5.1) * 0.38;
          _curt = smoothstep(0.48, 0.72, _curt);                                  // tighter gap → discrete curtains, not a wash (Fable r1)
          float _grain = 0.58 + 0.42 * _rvN(_sc * 9.0 + d.y * 2.5);               // vertical interior grain ×1.5
          float _band = smoothstep(0.05, 0.15, h) * smoothstep(0.42, 0.20, h);    // deck underside → belt (fades before the horizon slot)
          float _sunAz = atan(sunDir.z, sunDir.x);
          float _dAz = abs(atan(sin(_az - _sunAz), cos(_az - _sunAz)));           // wrapped angular distance to the breach azimuth
          float _breachClear = mix(0.4, 1.0, smoothstep(0.32, 0.9, _dAz));        // <=40% within ~18deg of the breach
          float _veil = clamp(_curt * _grain * _band * _breachClear * uRainVeil, 0.0, 1.0);
          vec3 _veilCol = fogFarColor * (1.0 + 1.6 * uRainVeilFlash);             // the lightning flash lights the far curtains → veil reads as stacked sheets in depth
          col = mix(col, _veilCol, _veil * 0.34);                                 // push to a 6-9% squint-read (Fable r1 — software-GL eats a third)
          col *= 1.0 - _veil * 0.09;                                              // a dense shaft reads darker than the haze
        }
        // STORM LIGHTNING FLASH: a desaturated global lift, DIRECTIONAL toward the strike (something over
        // THERE detonated, not a brightness knob), strongest in the upper sky, HELD DOWN where clouds cover
        // (cCov) so the deck silhouettes against the flash. Hard white-out cap. 0 outside Tempest.
        if (uStormFlash > 0.001) {
          vec2 _faz = normalize(d.xz + vec2(1e-4));
          float _fdw = 0.4 + 0.6 * max(0.0, dot(_faz, uStormFlashDir));           // 40/60 dark/bright hemisphere
          float _fband = 0.32 + 0.36 * smoothstep(0.0, 0.32, h) - 0.42 * smoothstep(0.08, 0.40, h); // strongest near the horizon; the deck/upper sky lifts LEAST (stays a ceiling)
          float _fl = uStormFlash * _fdw * _fband * (1.0 - 0.9 * cCov);           // clouds stay dark (harder hold)
          col = mix(col, vec3(0.76, 0.79, 0.86), clamp(_fl, 0.0, 0.38));          // desaturated #c7cfe0, gentler peak
          // Cap by VIEW HEIGHT, not cloud coverage (Fable r2: partial cCov relaxed the cap to ~0.60). The
          // storm ceiling owns the upper sky, so cap the whole upper band at L≈0.46 so it silhouettes
          // against the flash; the pale horizon SLOT (low h) keeps the white-out cap 0.82 and stays bright.
          col = min(col, vec3(mix(0.82, 0.46, smoothstep(0.02, 0.12, h))));
        }
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
  createRain(scene);   // storm rain-streak layer (rainMix-gated; Tempest only)
  initStormLightning(scene); setStormLightningEnabled(true);   // storm lightning + flash (rainMix-gated; 0 elsewhere = byte-identical)
}

function makeBand(scene, def) {
  const perSide = Math.ceil(WALL_WINDOW / def.step);
  const { geometry, materials } = def.build();
  // Object-space top of this archetype (world top = h·yMax), cached for the
  // deck-skim height clamp — measured from the real geometry so it can't drift.
  if (def._yMax === undefined) {
    const p = geometry.getAttribute('position');
    let yMax = 0;
    for (let i = 0; i < p.count; i++) yMax = Math.max(yMax, p.getY(i));
    def._yMax = yMax || 1;
  }
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
// EMBERFALL CALDERA composition rhythm (CALDERA-BIBLE.md §3.5) — the negative-space engine.
// A raised-cosine congregation weight over 4 periods/biome (~375m): props gather into loose
// archipelagos near ph≈0.2 and clear to open mirror near ph≈0.7, so a few colossal forms read
// against unbroken burning water (the awe grammar) instead of an even picket field. PURE (no
// rnd), so gold-determinism is untouched.
const CALDERA_COMP_PERIODS = 4;
function calderaComp(dist) {
  const L = CONFIG.biomeLength;
  const local = ((dist % L) + L) % L;
  const seg = L / CALDERA_COMP_PERIODS;                       // 375m
  const ph = (local % seg) / seg;
  return 0.5 + 0.5 * Math.cos(2 * Math.PI * (ph - 0.20));
}
// LOST LAGOON composition rhythm (BIOME-DESIGN §composition) — the same negative-space engine as
// Caldera, but tuned for a WIDER breath: a "hidden watery paradise" wants MORE open golden mirror
// between the drowned-ruin archipelagos than the burning caldera does. 3 periods/biome (500m) so
// each congregation is a distinct island group, and the raised cosine is RAISED TO A POWER so the
// congregation weight collapses fast off the peak → the breaths are genuinely empty water, not a
// thinned picket. g=1 at ph≈0.18 (island group), g→0 across most of the period (open mirror).
// PURE (no rnd), evaluated after the rotY init → gold-determinism call-order untouched.
const LAGOON_COMP_PERIODS = 3;
function lagoonComp(dist) {
  const L = CONFIG.biomeLength;
  const local = ((dist % L) + L) % L;
  const seg = L / LAGOON_COMP_PERIODS;                        // 500m
  const ph = (local % seg) / seg;
  const raised = 0.5 + 0.5 * Math.cos(2 * Math.PI * (ph - 0.18));
  return raised * raised;                                     // sharpen: wide open-water breaths
}
// THE LUMEN MIRE composition rhythm (LUMEN-MIRE-BIBLE §2 / Fable PR-3 §4) — the living-thicket
// engine. 5 periods/biome (300m — a close, enclosed swamp; a longer breath reads too open),
// peak at ph 0.15 so the congregation peak lands at (dist % 300) === 45 = HERO_PEAK_OFFSET (the
// hero phase-lock reuses the shipped offset). Props gather into thickets near the peak and clear
// to open black mirror near ph≈0.65 (the ≥45%-unbroken-mirror target). PURE (no rnd).
const MIRE_COMP_PERIODS = 5;
function mireComp(dist) {
  const L = CONFIG.biomeLength;
  const local = ((dist % L) + L) % L;
  const seg = L / MIRE_COMP_PERIODS;                          // 300m
  const ph = (local % seg) / seg;
  return 0.5 + 0.5 * Math.cos(2 * Math.PI * (ph - 0.15));
}
// TEMPEST REACH composition rhythm (Fable device critique — the storm-strait engine). The Tempest
// props had NO congregation branch, so every slot rendered on both banks = a continuous picket fence.
// This gathers props into rocky HEADLANDS and clears WIDE open storm-water breaths between them. Two
// design laws Fable called for: (1) genuinely empty breaths — a raised cosine RAISED TO A POWER so the
// weight collapses fast off the peak (like Lagoon), giving ~150m of open water that survives ~2s at
// flight speed; (2) the banks must SWAY, not beat together — a per-SIDE phase offset (0.42 of a period)
// so a left-heavy headland is followed by a right-heavy one, forcing the eye across the lane (the
// Tsushima trick). 4 periods/biome (375m). PURE (no rnd) → gold-determinism call-order untouched.
const TEMPEST_COMP_PERIODS = 4;
function tempestComp(dist, side) {
  const L = CONFIG.biomeLength;
  const local = ((dist % L) + L) % L;
  const seg = L / TEMPEST_COMP_PERIODS;                       // 375m
  const sideShift = side > 0 ? 0.42 : 0.0;                    // de-mirror: right bank lags the left by 0.42 period
  const ph = ((((local % seg) / seg) - sideShift) % 1 + 1) % 1;
  const raised = 0.5 + 0.5 * Math.cos(2 * Math.PI * (ph - 0.18));
  return raised * raised;                                     // sharpen → wide, genuinely empty breaths
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

// THE HERO-CLEARING CORRIDOR resolver (Fable Stage-1 §2 / 60-ruling §2) — around each KEPT Mire hero peak
// the swamp OPENS so the landmark reads: the PR-2 dark screens (reedveil/boleveil) park inside a corridor.
// Generalized over (shift, rare) so BOTH heroes reuse it: the glowARCH corridor calls (dist,0,0.5) around
// its peaks (local 45/345/…); the glowTREE corridor calls (dist,150,0.4) around its trough beacons (local
// 195/495/…). Returns the kept peak INDEX `pk` covering `dist` (park iff finite), or NaN. PURE (no rnd):
// recomputes the hero's OWN keep from the peak index via the SAME hashes/easement, so clearing + beacon
// can never disagree. Window `dist − P ∈ [−170, +40]`; on paired peaks the arch + tree corridors overlap
// into one continuous open sightline (viewer → gate → beacon). Caller applies parity (one-sided tree clear).
function mireHeroClearPeak(dist, shift, rare) {
  const period = CONFIG.biomeLength / MIRE_COMP_PERIODS;              // 300
  const pk0 = Math.round((dist - HERO_PEAK_OFFSET - shift) / period);
  for (let pk = pk0 - 1; pk <= pk0 + 1; pk++) {
    const Pd = pk * period + HERO_PEAK_OFFSET + shift;
    const rel = dist - Pd;
    if (rel < -170 || rel > 40) continue;                            // outside the corridor window
    const localPeak = ((pk % MIRE_COMP_PERIODS) + MIRE_COMP_PERIODS) % MIRE_COMP_PERIODS;
    const pLocal = ((Pd % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
    const peakEase = pLocal >= 1050 && pLocal <= 1350;               // easement at the PEAK (self-consistent)
    if (localPeak !== 0 && !peakEase && (localPeak === 1 || heroHash(pk) < rare)) return pk; // = the hero's keep test
  }
  return NaN;
}

// GLOW-CARRIER arch-gate clear (Fable 51 §5 rule 2): the cap/bloom glow families are the arch's
// supporting CHORUS on approach, but park in the immediate ±40m of a kept arch peak so the gate stands
// ALONE in its own glow-water (a tighter window than the dark-screen corridor). PURE — the SAME arch
// keep test as mireHeroClearPeak(dist,0,0.5), so chorus + gate + clearing all agree.
function nearArchGate(dist) {
  const period = CONFIG.biomeLength / MIRE_COMP_PERIODS;
  const pk = Math.round((dist - HERO_PEAK_OFFSET) / period);
  const Pd = pk * period + HERO_PEAK_OFFSET;
  if (Math.abs(dist - Pd) > 40) return false;
  const localPeak = ((pk % MIRE_COMP_PERIODS) + MIRE_COMP_PERIODS) % MIRE_COMP_PERIODS;
  const pLocal = ((Pd % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
  const peakEase = pLocal >= 1050 && pLocal <= 1350;
  return localPeak !== 0 && !peakEase && (localPeak === 1 || heroHash(pk) < 0.5);
}

// --- Deck-skim sightline windows (props-in-lane rock run, strait2) -----------
// Inside a strait2 rock run the camera deck-skims (rings clamped y5–7) and the
// composition law is WIDE+LOW: nothing may run off the top of the frame. The
// in-lane props are capped by RUN_KIT.heightCapY, but the biome's own decorative
// BANDS (bergwall h up to ~38 at x≈32+) would still read as canyon walls at that
// camera height — the "tall narrow claustrophobic" failure. So obstacles.js
// registers each strait2 section's dist window here, and writeMatrix clamps band
// prop WORLD HEIGHT (height axis only — radius keeps its size, so a tall berg
// squashes into wide tabular pack ice, the north-star composition) inside them.
// Render-only and pure (no rnd; rotY is cached on first write), so refreshing is
// always safe. Never touched outside Frozen; empty list = byte-identical output.
let deckSkimWindows = [];
const DECK_SKIM_CAP_Y = 8.5;  // world-Y ceiling for band prop tops inside a window
                              // (≈ RUN_KIT.frozen.heightCapY — bands never top the lane props)
export function addDeckSkimWindow(a, b) {
  deckSkimWindows.push([a, b]);
  if (deckSkimWindows.length > 48) deckSkimWindows.splice(0, deckSkimWindows.length - 48);
  // Re-write every live band matrix so instances already recycled into the new
  // window pick up the cap immediately (pure — safe to run at any time).
  for (const band of bands) {
    for (let i = 0; i < band.data.length; i++) writeMatrix(band, i, band.data[i]);
    band.mesh.instanceMatrix.needsUpdate = true;
    band.foam.instanceMatrix.needsUpdate = true;
    if (band.mesh.instanceColor) band.mesh.instanceColor.needsUpdate = true;
  }
}
export function resetDeckSkimWindows() { deckSkimWindows = []; }
function inDeckSkim(dist) {
  for (const w of deckSkimWindows) if (dist >= w[0] && dist <= w[1]) return true;
  return false;
}

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
  } else if (active && bi === 3) {
    // EMBERFALL CALDERA composition (CALDERA-BIBLE.md §3). PURE (no rnd) — evaluated after the
    // rotY init so no rnd() call order changes; props are render-only so the fixture is untouched.
    // (a) The ARRIVAL open-mirror beat (§3.2): tall/mid families stay OFF the first ~220m of the
    // biome so the Frozen→Caldera seam reads as burning water + a single first-chord colossus.
    // SEAM-RELATIVE (Codex review): biomeIndexAt flips to Caldera at the crossfade midpoint,
    // ~biomeTransition/2 BEFORE the block boundary, so the naive `local < 220` misses the incoming
    // tail — fold that tail in as a negative seamDelta. Low forms (flowlobe/clinker) stay: the seam
    // keeps a black floor baseline on the mirror.
    if (band.def.arrivalPark) {
      const local = ((d.dist % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
      const seamDelta = local >= CONFIG.biomeLength - CONFIG.biomeTransition ? local - CONFIG.biomeLength : local;
      if (seamDelta < 220) active = false;
    }
    // (b) The negative-space rhythm (§3.5): a raised-cosine congregation weight parks off-beat
    // instances into archipelagos + open mirror and scales the survivors (bigger in congregations).
    if (active && band.def.comp) {
      const g = calderaComp(d.dist);
      const c = band.def.comp;
      const density = c.floor + (1 - c.floor) * g;
      if (compHash(band.def._salt, d.side, d.slot) >= density) active = false;
      else k = c.sMin + (c.sMax - c.sMin) * g;
    }
  } else if (active && bi === 0) {
    // LOST LAGOON composition (BIOME-DESIGN §composition) — the negative-space engine, mirroring
    // Caldera: an arrival open-mirror beat + a raised-cosine congregation rhythm (lagoonComp, sharpened
    // for WIDE golden-water breaths) that parks off-beat instances into drowned-ruin archipelagos and
    // clears open sun-lit mirror between them. PURE (no rnd) → gold-determinism call-order untouched.
    if (band.def.arrivalPark) {
      const local = ((d.dist % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
      const seamDelta = local >= CONFIG.biomeLength - CONFIG.biomeTransition ? local - CONFIG.biomeLength : local;
      if (seamDelta < 220) active = false;
    }
    // Backdrop massif (arcade) is an EVENT, not wallpaper (Fable r1b): a DUTY CYCLE keeps a drowned
    // colonnade in only ~1 of 3 congregations (a per-peak hash), and when present it is on ONE side
    // only (a second per-peak hash picks it) — so most stretches have NO arcade anywhere, and it never
    // walls both horizons. A single rare instance shows its own broken START and END instead of an
    // edge-to-edge conveyor of overlapping walls.
    if (active && band.def.oneSide) {
      const peakIdx = Math.round(d.dist / (CONFIG.biomeLength / LAGOON_COMP_PERIODS));
      if (heroHash(peakIdx) >= 0.38) active = false;                     // present at ~1 in 3 congregations
      else {
        const pickRight = heroHash(peakIdx * 2 + 1) < 0.5;
        if ((pickRight && d.side < 0) || (!pickRight && d.side > 0)) active = false;
      }
    }
    if (active && band.def.comp) {
      const g = lagoonComp(d.dist);
      const c = band.def.comp;
      const density = c.floor + (1 - c.floor) * g;
      if (compHash(band.def._salt, d.side, d.slot) >= density) active = false;
      else k = c.sMin + (c.sMax - c.sMin) * g;
    }
    // Island SIZE HIERARCHY (Fable r1b): break the "even subdivision of equal mounds" by scaling each
    // mid-mass instance into one of three size classes via a PURE per-instance hash — mostly small/mid
    // children with an occasional large mother-island, so a congregation reads as ONE layered landform
    // rather than a picket of clones. Render scale only (no rnd, no new tris) → determinism-safe.
    if (active && band.def.sizeClass) {
      const hc = compHash(band.def._salt ^ 0x5bd1e995, d.side, d.slot);
      k *= hc < 0.5 ? 0.62 : hc < 0.82 ? 1.0 : 1.42;
    }
  } else if (active && bi === 4) {
    // THE LUMEN MIRE composition (LUMEN-MIRE-BIBLE §2 / Fable PR-3 §4). PURE (no rnd), after the
    // rotY init, render-only → gold-determinism byte-identical.
    const local = ((d.dist % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
    // (a) Arrival open-mirror beat: mid/glow families off the first ~200m so the seam reads as
    // black mirror under the drape roof, then the First Lantern resolves. Seam-relative fold
    // (biomeIndexAt flips at the crossfade midpoint — the Caldera Codex-review gotcha).
    const seamDelta = local >= CONFIG.biomeLength - CONFIG.biomeTransition ? local - CONFIG.biomeLength : local;
    if (band.def.arrivalPark && seamDelta < 200) active = false;
    // (b) The reserved 30° THRUMSWARM easement (bible §2): local [1050,1350] stays clear of the
    // hero + glow families (PR-6 builds the Held-Breath hush proper; PR-3 just never seats one there).
    const inEasement = local >= 1050 && local <= 1350;
    // Gate-clearing corridor (Fable Stage-1 §2): PR-2 dark screens with a `gateClear` half-width park in
    // the corridor around a KEPT glowARCH peak (both flanks) so the gate reads + its lozenge survives.
    if (active && band.def.gateClear && Math.abs(d.x) < band.def.gateClear && !Number.isNaN(mireHeroClearPeak(d.dist, 0, 0.5))) active = false;
    // Beacon-clearing corridor (Fable 60-ruling §2 / 62-redesign): ONE-SIDED — screens with a `treeClear`
    // half-width park ONLY on the glowSPIRE's parity flank around a kept trough beacon (shift 150, rare 0.4),
    // so the lone lantern spire stands in its own opened water (+ reflection twin) while the far flank keeps its wall.
    if (active && band.def.treeClear && Math.abs(d.x) < band.def.treeClear) {
      const pk = mireHeroClearPeak(d.dist, 150, 0.4);
      if (!Number.isNaN(pk) && d.side === (((pk % 2) + 2) % 2 === 1 ? 1 : -1)) active = false;
    }
    if (active && band.def.hero) {
      // heroSolo (Fable ensemble §2): an ON-LANE hero (glowarch, place x:0) exists on BOTH sides'
      // slot streams — park the -side twin so a single gate straddles x0 (else two arches z-fight).
      if (band.def.heroSolo && d.side < 0) active = false;
      // Hero — renders at full size (k=1) or not at all, exactly ONE per kept peak. `nearest` keeps only
      // the single step-instance closest to the lock target (else the dense step clusters 4–5 heroes).
      // Generalized (Fable ensemble §2): `heroShift` offsets the lock target — glowARCH shift 0 → the
      // congregation PEAKS (local 45/345/645/945/1245); glowTREE shift +150 → the ph≈0.65 TROUGHS (local
      // 195/495/…), the lone lantern in the breath, 150m past each gate (the MS-1 framed pair). Both:
      // park localPeak 0 (arrival) + the easement peak; FORCE-KEEP localPeak 1 EVERY arrival = the money
      // shot; interior peaks keep on `heroRare` (~50% arch / ~40% tree). `heroParity` keeps ONE per peak
      // on ALTERNATING flanks (the tree — "one hero-class mass per flank, alternating"); the arch uses
      // heroSolo instead. PURE (same hashes as mireGateClearPeak, so gate + clearing + beacon agree).
      const period = CONFIG.biomeLength / MIRE_COMP_PERIODS;   // 300
      const shift = band.def.heroShift || 0;
      const rare = band.def.heroRare || 0.5;
      const peakIdx = Math.round((d.dist - HERO_PEAK_OFFSET - shift) / period);
      const peakDist = peakIdx * period + HERO_PEAK_OFFSET + shift;
      const localPeak = ((peakIdx % MIRE_COMP_PERIODS) + MIRE_COMP_PERIODS) % MIRE_COMP_PERIODS;
      const nearest = Math.abs(d.dist - peakDist) < band.def.step / 2;
      const pLocal = ((peakDist % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
      const peakEase = pLocal >= 1050 && pLocal <= 1350;      // easement at the PEAK's own local (shifted-safe)
      const keepPeak = !peakEase && localPeak !== 0 && (localPeak === 1 || heroHash(peakIdx) < rare);
      const parityOk = !band.def.heroParity || d.side === (((peakIdx % 2) + 2) % 2 === 1 ? 1 : -1);
      if (!(nearest && keepPeak && parityOk)) active = false;
    } else if (active && band.def.comp) {
      // glow carriers (glowshroom/glowbloom) clear the easement AND the immediate arch-gate water (§5 rule 2)
      // so the gate stands alone — they're the arch's chorus on approach, never inside its glow-water.
      if (band.def.comp.glow && (inEasement || nearArchGate(d.dist))) active = false;
      else {
        const g = mireComp(d.dist);
        const c = band.def.comp;
        const density = c.floor + (1 - c.floor) * g;
        if (compHash(band.def._salt, d.side, d.slot) >= density) active = false;
        else k = c.sMin + (c.sMax - c.sMin) * g;
      }
    }
  } else if (active && bi === 7) {
    // TEMPEST REACH composition (Fable device critique) — the storm-strait rhythm. Previously ABSENT
    // (no bi===7 branch) so every slot rendered on both banks = a continuous picket fence. The swaying
    // congregation (per-side phase-offset tempestComp) now gathers props into rocky HEADLANDS and clears
    // WIDE open storm-water breaths between them; stormstack's big step + floor-0 make it the RARE tall
    // punctuation that lands on the headland peaks, alternating banks via the per-side phase. An arrival
    // beat opens the seam to empty water. PURE (no rnd), after the rotY init → gold-determinism untouched.
    if (band.def.arrivalPark) {
      const local = ((d.dist % CONFIG.biomeLength) + CONFIG.biomeLength) % CONFIG.biomeLength;
      const seamDelta = local >= CONFIG.biomeLength - CONFIG.biomeTransition ? local - CONFIG.biomeLength : local;
      if (seamDelta < 200) active = false;
    }
    if (active && band.def.comp) {
      const g = tempestComp(d.dist, d.side);
      const c = band.def.comp;
      const density = c.floor + (1 - c.floor) * g;            // fraction of this archetype's slots kept here
      if (compHash(band.def._salt, d.side, d.slot) >= density) active = false; // park (off-beat → open breath)
      else k = c.sMin + (c.sMax - c.sMin) * g;                // survivors SWELL into the headland congregation
    }
  }
  // Deck-skim rule (see the window block above), inside a strait2 run window:
  // WIDE archetypes clamp world HEIGHT to the sightline (top = d.h·k·yMax − 0.5 ≤
  // DECK_SKIM_CAP_Y — they squash into pack ice); NARROW verticals (icetower, the
  // sungate pylons) can't be squashed out of reading as towers, so they PARK
  // (`deckSkim:'park'`) — the same include/exclude rule the lane roster follows.
  let hK = 1;
  if (active && bi === 2 && deckSkimWindows.length && inDeckSkim(d.dist)) {
    if (band.def.deckSkim === 'park') {
      active = false;
    } else {
      const capH = (DECK_SKIM_CAP_Y + 0.5) / (band.def._yMax || 1);
      if (d.h * k > capH) hK = capH / (d.h * k);
    }
  }
  if (active) {
    m4.compose(posV.set(d.x, -0.5, -d.dist), quat, sclV.set(d.r * k, d.h * k * hK, d.r * k));
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
  deckSkimWindows = [];     // strait2 run windows die with the run (re-registered on spawn)
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
  _godrayMul = env.godrayMul ?? 1;   // exposed for main.js's god-ray gate (seam-lerped)
  if (env.godrayTint) _godrayTint.copy(env.godrayTint);   // per-biome shaft tint (seam-lerped)
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
  // Fable 75 aerial perspective: drive the shared prop-shader ember lever from the lerped env
  // (0 for every biome that doesn't set propAerial → byte-identical; the Mire runs 0.85).
  propAerialUniform.value = env.propAerial ?? 0;
  propAerialColor.value.copy(env.propAerialColor);
  // Fable 79 hero backlit-rim lever: mirror the lerped env for dragon.js to consume via getHeroRim()
  // (0 everywhere but the Mire → the rim boost is a byte-identical no-op elsewhere).
  heroRimK = env.heroRim ?? 0;
  heroRimCol.copy(env.heroRimColor);
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
    stormSea: env.stormSea, // STORMSEA (Tempest): violent sea terms; 0 elsewhere = byte-identical
    rainRipple: (env.rainMix || 0) * (0.6 + 0.8 * ((env.rainMix || 0) > 0.005 ? rainGustAt(time) : 0)), // splash rings SWELL with the shared gust — sea + air prove one storm (layer G)
    breach: env.breachMix || 0, // EYE-BREACH: the becalmed gold-lit patch of sea under the eye of the gale; 0 elsewhere = byte-identical
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
  su.uDeckBias.value = env.deckBias || 0;
  su.time.value = time;
  // RAIN FAR VEIL (layer F): density + wind-scroll ride the shared gust clock (layer G), so the
  // curtains thicken and sweep with the same gust that bends the streaks and swells the sea rings.
  // 0 outside Tempest (rainMix 0) → byte-identical. Flash stays 0 until the lightning hazard lands.
  const _veilMix = env.rainMix || 0;
  const _veilGust = _veilMix > 0.005 ? rainGustAt(time) : 0;
  su.uRainVeil.value = _veilMix * (0.82 + 0.4 * _veilGust);
  su.uRainVeilScroll.value = (time * (0.020 + 0.030 * _veilGust)) % 1024;
  su.uRainVeilFlash.value = getStormFlashRain();     // the flash brightens the far curtains → veil reads as stacked sheets
  su.uStormFlash.value = getStormFlashSky();
  su.uStormFlashDir.value.copy(getStormFlashDir());
  // EYE-BREACH (the still axle): world-locked to the sun azimuth, no scroll/gust. 0 outside Tempest
  // (breachMix 0) → byte-identical. v1 = a fixed prominent state (the progress-arc growth is a follow-on).
  su.uBreachMix.value = env.breachMix || 0;

  // Boss-time mote budget: own eased copy of the same signal postfx grades
  // with (same ~1s damp idiom as feverMix above) — decays unconditionally so
  // a boss teardown mid-fight can't strand the ambient dim either.
  bossMix = damp(bossMix, bossTarget, 4, dt);

  updateAmbient(dt, camera, time, playerDist, playerSpeed, feverMix, env, bossMix);
  updateStormLightning(dt, camera, env, time);   // lightning bolts + the flash envelopes (rainMix-gated)
  setRainFlash(getStormFlashRain());              // Layer X: the flash reveals the rain volume (rain lingers longer than the sky)
  updateRain(dt, camera, env, time);   // storm rain streaks — reads env.rainMix + the shared wind vector + gust clock
}
