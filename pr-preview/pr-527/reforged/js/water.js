import * as THREE from 'three';
import { Reflector } from '../lib/objects/Reflector.js';
import { SUN_DIR, TEMPEST_WIND } from './biomes.js';
import { atmosUniforms } from './atmosphere.js';

// Endless water plane that replaces the snow floor. One GLSL source, two
// variants: USE_REFLECTION samples a Reflector render target (tier 0); the
// cheap variant fakes a sky reflection analytically (mobile / lower tiers).
// Waves are 3 directional sine octaves with analytic-derivative normals in
// WORLD-space xz — the plane slides with the player on z, so world coords
// keep the waves stationary instead of swimming along.

// HEAVEN sun steer: the biome SUN_DIR points LEFT (x −0.22), but the arena's light is the CENTERED
// detonation (world x 0, crest y≈100, ~13° up). The "sea answers the blast" gold specular column keys off
// sunDir, so off-heaven it sat left of the blast. Steer sunDir to centre+blast-elevation as the heaven
// engages (mix 1→2), restored off-heaven (byte-identical when the lerp weight is 0).
const HEAVEN_SUN_DIR = new THREE.Vector3(0.0, 0.2, -1).normalize();
const OLD_SEA = typeof location !== 'undefined' && new URLSearchParams(location.search).has('oldsea');   // ?oldsea — A/B: the pre-fix heaven sea (flat two-bands horizon, thin glitter only)

let water = null;          // current mesh (Reflector or plain Mesh)
let sceneRef = null;
let reflective = false;
let swellOn = false;        // N10a: whether the surface geometry is subdivided + displaced
let geomTier = 0;           // N10a: subdivision LOD (0 densest, 2 flat)
let depthOn = false;        // N10b: whether the Beer–Lambert depth mix is active
// N11 — the mirror is no longer tier-0-only. tier0 keeps the crisp full-rate 768²
// hero mirror; tier1 gets a cheaper 384² mirror rendered every OTHER frame (specular
// changes slowly) so mid-range phones keep a reflection; tier2 stays the cheap
// analytic quad. `halfRate` + `_parity` (bumped once per presented frame in
// updateWater, NOT per draw) gate the skip. The far-plane clamp (below) trims the
// mirror frustum to the fog wall on both reflective tiers.
let mirrorRes = 768;        // N11: 768 (tier0) / 384 (tier1)
let halfRate = false;       // N11: tier1 renders the mirror on even parity only
let _perfSaver = false;     // dynRes perf-saver: cruise mirror ½ → ¼ rate under load (near-invisible)
let _parity = 0;            // per-presented-frame counter (updateWater)
// The adaptive-resolution governor engages this BEFORE trimming resolution: a heavier
// cruise duty-cycle on the mirror (a full extra scene render) is a low-visibility fill
// saving, spent before the more-visible pixel trim. Off = shipped ½-rate cruise mirror.
export function setWaterPerfSaver(on) { _perfSaver = !!on; }
let reflFar = true;         // N11: mirror far-plane clamp (kill via ?reflfar=0 for A/B)
function applyReflTier(tier) {
  reflective = tier <= 1;
  mirrorRes = tier === 0 ? 768 : 384;
  halfRate = tier === 1;    // (on,res) uniquely determines this: (T,768)=t0 (T,384)=t1 (F,384)=t2
}

const SIZE_W = 520;
const SIZE_L = 1700;

const sharedUniforms = {
  time: { value: 0 },
  waveAmp: { value: 1.0 },
  uSwellAmp: { value: 0 }, // N10a: 0 = flat plane (shipped); 1 = swell displacement on
  // N10b fake Beer–Lambert depth: uAbsorbOn 0 = shipped height-driven mix; 1 = the
  // view-angle transmittance mix. uAbsorbK = extinction × virtual-bottom depth (one
  // folded uniform), derived per biome in setWaterTint. Both MUST live here or they
  // vanish on the reflective↔cheap/swell rebuild (rebuildWater carries sharedUniforms).
  uAbsorbOn: { value: 0 },
  uAbsorbK: { value: 0.45 },
  // Aurora Shallows: the tier2 ANALYTIC reflection has no mirror (both horizon/zenith are near-black
  // there), so paint a horizonward aurora-green glow into it. 0 in every other biome (byte-identical);
  // reflective tiers ignore it. MUST live here or it vanishes on the reflective↔cheap rebuild.
  uAuroraGlow: { value: 0 },
  // STORMSEA gate (Tempest): 0 = shipped calm sea (byte-identical). 1 = violent storm sea
  // (2nd swell + fragment trough-darkening + wind-combed foam streaks). MUST live here or
  // it vanishes on the reflective↔cheap/swell tier rebuild.
  uStormSea: { value: 0 },
  // Rain LAYER B — splash rings where the rain hits the sea (welds sky to sea). 0 = off
  // (byte-identical). MUST live here or it vanishes on the tier rebuild.
  uRainRipple: { value: 0 },
  // EYE-BREACH foot (Tempest): the becalmed gold-lit patch of sea under the eye of the gale. 0 = off
  // (byte-identical). >0 attenuates the storm violence + adds a feathered gold sun-pool on the sun
  // azimuth near the horizon. MUST live here or it vanishes on the reflective↔cheap/swell tier rebuild.
  uBreachMix: { value: 0 },
  // Fix C — PREMIUM HEAVEN HORIZON: weight (0 off-heaven ⇒ byte-identical) driving a graded blast-haze
  // horizon + a broad reflection column + the shared heartbeat, so the sea ANSWERS the detonation instead
  // of being two flat cardboard bands (gold sky / flat violet fogged sea) with a hard seam. MUST live here
  // or it vanishes on the reflective↔cheap rebuild.
  uHeavenGlow: { value: 0 },
  uHorizonCol: { value: new THREE.Color(0x9a6242) },   // warm umber — one tier BELOW the dome's skyHorizon 0xa87838, so the far sea grades UP into the gold band under the blast
  // HERO POOL (Fable 75): the player's PointLight answered on the mirror — the custom water
  // ShaderMaterial has `lights` off, so a scene light can never pool here; it's fed positionally
  // (world XZ) as an anisotropic reflection STREAK. uHeroPool 0 = byte-identical shipped water.
  // MUST live in sharedUniforms or it vanishes on the reflective↔cheap/swell tier rebuild.
  uHeroPos: { value: new THREE.Vector3() },
  uHeroCol: { value: new THREE.Color(0) },
  uHeroPool: { value: 0 },
  // REFLECTION CRAFT (Fable 85): three default-0 per-biome levers that turn the black mirror from a
  // uniform brown smear into the biome's signature — anisotropic streak-stretch + luma-keyed 3-tap
  // streak under glow sources, sparse drifting amber glints, and a hue-keyed pull that tames the green
  // catch-ring's mirror-blob (the RING itself is never touched — it's a game-wide gameplay signal). All
  // 0 elsewhere → the other 6 biomes byte-identical. MUST live here or they vanish on the tier rebuild.
  uReflStretch: { value: 0 },
  uReflGlint: { value: 0 },
  uReflGreenPull: { value: 0 },
  // THE EMPYREAN — NACRE (EMPYREAN-BIBLE.md §4b): mother-of-pearl water, not a mirror. 0 = shipped
  // (byte-identical). >0 KILLS the pow-240 sun-glitter lane + the cheap sparkle flakes (the second engine
  // sun — R1's named failure mode) and replaces them with a broad fresnel SATIN sheen (luster, not gloss)
  // + a constrained thin-film IRIDESCENCE band (rose↔lilac↔periwinkle, off green+gold) firing on crest
  // faces at grazing angles. MUST live here or it vanishes on the reflective↔cheap/swell tier rebuild.
  uNacreMix: { value: 0 },
  uWakeMix: { value: 0 },   // THE EMPYREAN uplift PR-1 — player-coupled wake rings (0 = shipped byte-identical)
  uStructMix: { value: 0 }, // THE EMPYREAN uplift PR-A — value tiering + pulse-ring + mirror-smudge (0 = shipped)
  uPulseFoot: { value: 0 }, // PR-A r3: the pulse-ring's WORLD-LOCKED birth z — latched CPU-side once per 8s pulse (shader state can't persist; a quantized foot re-anchored mid-pulse = the player-centric read)
  // GLOW-SPILL water pools (Fable 96-B): the Mire's hero glow clusters answered on the black mirror —
  // amber pools under the arch gates + spire beacon, the mirror doubles them back. uHeroPool pattern.
  // uMirePoolK 0 = byte-identical shipped water. MUST live here (survives the reflective↔cheap tier rebuild).
  uMirePoolK: { value: 0 },
  uMirePools: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, // xz world center, invR, strength
  uMirePoolCol: { value: new THREE.Color(0xff9a33) },
  deepColor: { value: new THREE.Color(0x0d3a5c) },
  shallowColor: { value: new THREE.Color(0x2e8aa8) },
  sunDir: { value: SUN_DIR.clone() },
  sunColor: { value: new THREE.Color(0xffb070) },
  horizonColor: { value: new THREE.Color(0xff9a55) },
  zenithColor: { value: new THREE.Color(0x1c2e5e) },
  fogColor: { value: new THREE.Color(0xd99a7a) },
  // Dual-fog far COLOR (BIOME-DESIGN.md §5.2) — distinct from fogFar (a
  // DISTANCE, below). Initialised equal to fogColor = today's single-color fog;
  // biomes without a fogFarColor keep them equal, which makes the far-mix in
  // the fragment shader an exact no-op. MUST live in sharedUniforms or it
  // vanishes on the reflective↔cheap tier rebuild.
  fogFarColor: { value: new THREE.Color(0xd99a7a) },
  fogNear: { value: 70 },
  fogFar: { value: 380 },
};

// N10a — the long ROLLING SWELL that physically displaces the surface geometry
// (the "living horizon"). ONE definition drives the vertex GLSL AND the JS port
// (waterSurfaceHeight) so they can never drift — the contact shadow rides the exact
// height the GPU draws. Deviation from the roadmap's "same wave() octaves": only the
// long swell (λ≈105m) is displaced; the 3 short shading octaves (λ 3.7–12.6m) are
// below the vertex-grid Nyquist and would crawl, so they stay fragment-only (normals).
// NOTE: these are template-interpolated into GLSL (here + propFoam.js). Keep every
// value FRACTIONAL — an integral value (e.g. amp:1) would emit `... * 1 * sin(...)`,
// a GLSL ES int/float type error. All current values have a decimal point.
export const SWELL = { dirx: 0.723, dirz: 0.691, freq: 0.06, amp: 0.6, speed: 0.28 };

// STORMSEA (Tempest Reach): ONE wind vector drives the storm sea — a 2nd wind-aligned
// swell (garnish; only displaces when uSwellAmp is on) PLUS the fragment terms (trough
// darkening + wind-combed foam streaks) that carry the violence with the swell OFF / on
// tier 2. Gated by uStormSea (0 everywhere else = byte-identical). λ≈55m (shorter/steeper
// than the global 105m swell). All values FRACTIONAL (the GLSL int/float trap).
// TEMPEST_WIND now lives in biomes.js (the single wind source, imported above) so foam + rain +
// cloud-crawl can't diverge. STORM_SWELL reuses the same axis (kept as literals for the GLSL template).
export const STORM_SWELL = { dirx: 0.851, dirz: 0.525, freq: 0.115, amp: 1.45, speed: 0.55 };

// A/B pin: ?stormsea=0 forces the shipped calm sea, ?stormsea=1 forces the storm sea (any biome),
// so the owner can flip the fix live in one flight. null = per-biome env value (normal play).
const _stormSeaForce = (() => {
  try { const v = new URLSearchParams(location.search).get('stormsea'); return v == null ? null : (v === '0' ? 0 : 1); }
  catch { return null; }
})();

const vertexShader = /* glsl */`
  uniform float time, waveAmp, uSwellAmp, uStormSea;
  varying vec3 vWorldPos;
  #ifdef USE_REFLECTION
    uniform mat4 textureMatrix;
    varying vec4 vUvProj;
  #endif
  float _swellH(vec2 p) {
    float base = waveAmp * ${SWELL.amp} * sin(dot(p, vec2(${SWELL.dirx}, ${SWELL.dirz})) * ${SWELL.freq} + time * ${SWELL.speed});
    // STORMSEA garnish: a shorter, steeper 2nd swell along the wind (uStormSea 0 = base only).
    float storm = uStormSea * waveAmp * ${STORM_SWELL.amp} * sin(dot(p, vec2(${STORM_SWELL.dirx}, ${STORM_SWELL.dirz})) * ${STORM_SWELL.freq} + time * ${STORM_SWELL.speed});
    return base + storm;
  }
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    float h = uSwellAmp * _swellH(wp.xz);   // 0 exactly when off → shipped flat plane
    wp.y += h;
    vWorldPos = wp.xyz;                       // AFTER displacement (fresnel/V/fog use the true point)
    #ifdef USE_REFLECTION
      // A3: sample the reflection at the DISPLACED surface point, else reflections
      // swim against the swell. Plane is rotated -PI/2 (pure rotation): feeding h as
      // the local-z of the projection sample maps to the same world +y as wp.y += h.
      vUvProj = textureMatrix * vec4(position.xy, h, 1.0);
    #endif
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const fragmentShader = /* glsl */`
  varying vec3 vWorldPos;
  uniform float time, waveAmp;
  uniform vec3 deepColor, shallowColor, sunDir, sunColor, horizonColor, zenithColor, fogColor, fogFarColor;
  uniform float fogNear, fogFar;
  // N8 PR B: shared atmosphere uniforms (0 = shipped). The water is the largest
  // fogged surface — it joins the sunward inscatter. World-space sun dir so it is
  // correct in the mirror; identity when uAtmosInscatter is 0.
  uniform vec3 uAtmosSunDir, uAtmosSunTint;
  uniform float uAtmosInscatter;
  uniform float uAbsorbOn, uAbsorbK; // N10b depth (0 = shipped height-driven mix)
  uniform float uAuroraGlow; // Aurora Shallows tier2 analytic-reflection sheen (0 = shipped)
  uniform float uStormSea;   // STORMSEA violence (0 = shipped calm sea)
  uniform float uRainRipple; // rain LAYER B — splash rings (0 = off)
  uniform float uBreachMix;  // EYE-BREACH calm/gold patch at the eye's foot (0 = shipped)
  uniform float uHeavenGlow; uniform vec3 uHorizonCol; // Fix C: heaven blast-horizon integration (0 = shipped)
  uniform vec3 uHeroPos, uHeroCol; uniform float uHeroPool; // Fable 75: player light-pool on the mirror (0 = shipped)
  uniform float uReflStretch, uReflGlint, uReflGreenPull;    // Fable 85: reflection craft (0 = shipped)
  uniform float uNacreMix;   // THE EMPYREAN nacre (§4b): 0 = shipped; >0 kills the sun-glitter + adds satin sheen + iridescence
  uniform float uWakeMix;    // THE EMPYREAN uplift PR-1: player-coupled wake rings (0 = shipped)
  uniform float uStructMix;  // THE EMPYREAN uplift PR-A: value tiering + pulse + smudge (0 = shipped)
  uniform float uPulseFoot;  // PR-A r3: world-locked ring-foot z for the current pulse
  uniform float uMirePoolK; uniform vec4 uMirePools[4]; uniform vec3 uMirePoolCol;  // Fable 96-B glow pools (0 = shipped)
  const vec3 LUMA = vec3(0.299, 0.587, 0.114);               // Rec.601 luma for the reflection-craft keys
  #ifdef USE_REFLECTION
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    varying vec4 vUvProj;
  #endif

  // One directional sine octave; accumulates height + analytic gradient.
  void wave(vec2 p, vec2 dir, float freq, float amp, float speed,
            inout float h, inout vec2 grad) {
    float ph = dot(p, dir) * freq + time * speed;
    h += amp * sin(ph);
    grad += amp * freq * cos(ph) * dir;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Rain LAYER B splash ring: one expanding ring per live hashed cell — radius 0→0.45m over ~0.4s
  // at a random per-cell phase; ~1/3 of cells live. The ring FRONT lifts brightness (rain landing).
  float _rainRing(vec2 pw, float cell, float salt, float t) {
    vec2 gi = floor(pw / cell);
    if (hash(gi + vec2(salt, salt * 1.7)) > 0.34) return 0.0;
    float ph = hash(gi + vec2(salt + 7.3, salt + 2.1));
    float tt = fract(t * 2.5 + ph);
    vec2 c = (gi + 0.5) * cell;
    float r = tt * 0.45;
    return smoothstep(0.06, 0.0, abs(length(pw - c) - r)) * (1.0 - tt);
  }

  void main() {
    vec2 p = vWorldPos.xz;
    float h = 0.0;
    vec2 grad = vec2(0.0);
    wave(p, normalize(vec2( 0.8,  0.6)), 0.50, 0.16 * waveAmp, 1.10, h, grad);
    wave(p, normalize(vec2(-0.6,  0.8)), 0.90, 0.08 * waveAmp, 1.70, h, grad);
    wave(p, normalize(vec2( 0.2, -1.0)), 1.70, 0.045 * waveAmp, 2.40, h, grad);
    // STORMSEA — two wind-aligned CHOP octaves that SHATTER the mirror (0 = shipped, byte-identical).
    // The shipped normal field tops out ~0.2 slope; these add ~0.6 so fresnel + the reflection angle
    // vary per-pixel and the clean sky-double breaks into storm chop (the owner's real-device tell).
    wave(p, normalize(vec2(0.851, 0.525)), 1.30, 0.22 * waveAmp * uStormSea, 2.10, h, grad);
    wave(p, normalize(vec2(0.60, -0.80)), 2.90, 0.11 * waveAmp * uStormSea, 3.30, h, grad);
    vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));

    vec3 V = normalize(cameraPosition - vWorldPos);
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 5.0);

    float dist = length(cameraPosition - vWorldPos);
    // HEAVEN horizon terms (all no-op when uHeavenGlow is 0): az = how aligned the view azimuth is with
    // the blast-steered sun (the "under the detonation" band); breath = the blast's 4.6s expansion front
    // propagated across the sea with a distance lag — the sea and sky share one heartbeat.
    vec2 vxz = -V.xz, sxz = normalize(sunDir.xz + vec2(1e-5, 0.0));
    float az = pow(clamp(dot(vxz * inversesqrt(max(1e-6, dot(vxz, vxz))), sxz), 0.0, 1.0), 3.0);
    float breath = 0.85 + 0.3 * sin(6.2831853 * time / 4.6 - dist * 0.004);

    // EYE-BREACH FOOT (uBreachMix 0 = shipped, byte-identical): the becalmed gold-lit patch of sea
    // directly under the eye of the gale — an elliptical pool on the SUN AZIMUTH out near the horizon
    // (NOT a glitter lane running to the camera: gated to a far band × a tight azimuth cone). _azB = how
    // aligned the view azimuth is with the sun az; _farB = a band near the fog wall (dissolves into fog).
    float _azB = clamp(dot(vxz * inversesqrt(max(1e-6, dot(vxz, vxz))), sxz), 0.0, 1.0);
    float _farB = smoothstep(fogFar * 0.34, fogFar * 0.60, dist) * (1.0 - smoothstep(fogFar * 0.82, fogFar, dist));
    float _calmPatch = pow(_azB, 4.0) * _farB * uBreachMix;    // broad calm-attenuation region
    float _goldPool  = pow(_azB, 11.0) * _farB * uBreachMix;   // tighter feathered gold sun-pool (~2–4% of frame)
    float _stormCalm = 1.0 - 0.75 * _calmPatch;                // storm violence → ~0.25 inside the patch

    // Base water body: shallows pick up light at glancing wave faces (shipped mix).
    float tH = clamp(0.5 + h * 1.4, 0.0, 1.0) * 0.55;
    // N10b fake Beer-Lambert: trans = fraction of virtual-bottom light that survives
    // the slant view-path (depth / V.y). Look-down -> short path -> bright shallows;
    // glancing -> long path -> dark deeps. Gated in the mix-FACTOR domain so
    // uAbsorbOn=0 is byte-identical to the shipped height mix.
    float trans = exp(-uAbsorbK / max(V.y, 0.05));
    vec3 base = mix(deepColor, shallowColor, mix(tH, trans, uAbsorbOn));

    vec3 refl;
    #ifdef USE_REFLECTION
      // Fable 85 §1a — ANISOTROPIC distort: crisp side-to-side, long down-lane (a real black-water
      // mirror is not an isotropic blob). At uReflStretch 0 → dAniso vec2(1.0) → identical to shipped.
      float dBase = 0.42 + 1.1 * uStormSea;
      vec2 dAniso = mix(vec2(1.0), vec2(0.35, 2.6), uReflStretch);   // x=lateral, y=N.z=down-lane
      vec2 distort = N.xz * dBase * dAniso;   // STORMSEA: scatter the mirror sample → the clean reflection lane shatters into broken speckle
      vec4 proj = vUvProj;
      proj.xy += distort * proj.w;
      refl = texture2DProj(tDiffuse, proj).rgb;
      // Fable 85 §1b — luma-keyed 3-tap down-lane streak: ONLY bright glow sources smear into a vertical
      // streak (dark trunks stay crisp). 2 extra taps, inside the branch → the other 6 biomes pay zero.
      if (uReflStretch > 0.001) {
        vec4 sOff = vec4(0.0, 0.018 * proj.w, 0.0, 0.0);   // down-lane in proj space
        vec3 s1 = texture2DProj(tDiffuse, proj + sOff).rgb;
        vec3 s2 = texture2DProj(tDiffuse, proj + sOff * 2.333).rgb;
        refl += uReflStretch * (s1 * smoothstep(0.35, 0.90, dot(s1, LUMA)) * 0.55
                              + s2 * smoothstep(0.45, 1.00, dot(s2, LUMA)) * 0.30);
        refl /= 1.0 + uReflStretch * 0.45;   // renormalize — streak, don't brighten
      }
      // Fable 85 §3 — green mirror-blob fix, MIRROR side only: hue-keyed pull on the SAMPLED colour so
      // the saturated green catch-ring reflection reads as glow-on-water, not a glitch. Cyan flow decals
      // (b≈g) and the amber scene (r>g) key to 0. The ring mesh/HUD colour is never touched.
      if (uReflGreenPull > 0.001) {
        float rLuma = dot(refl, LUMA);
        float greenExcess = refl.g - max(refl.r, refl.b);   // >0 only for green-dominant pixels
        float gpk = uReflGreenPull * smoothstep(0.04, 0.25, greenExcess);
        refl = mix(refl, rLuma * vec3(1.08, 0.90, 0.62), gpk);   // toward amber-tinted luma
      }
    #else
      // Analytic sky reflection + cheap sparkle glints.
      vec3 R = reflect(-V, N);
      refl = mix(horizonColor, zenithColor, pow(clamp(R.y, 0.0, 1.0), 0.55));
      float sk = hash(floor(p * 2.6) + floor(time * 3.0));
      refl += sunColor * step(0.985, sk) * 2.2 * pow(1.0 - NdotV, 2.0) * (1.0 - uNacreMix);   // nacre: the cheap sparkle flakes ARE the plastic-pearlescent tell — killed on the nacre water (§4b)
      // Aurora sheen (tier2 has no mirror): a horizonward green glow so weak devices keep the
      // biome's money shot. uAuroraGlow is 0 in every other biome → byte-identical.
      refl += vec3(0.33, 1.0, 0.52) * 0.4 * pow(1.0 - clamp(R.y, 0.0, 1.0), 3.0) * uAuroraGlow;
    #endif

    // STORMSEA — READABILITY: no reflection may be brighter than its source. A COMPRESSIVE luminance
    // cap (~0.85, hue preserved) so bloom-hot objects (rings/gates/pickups) can't STROBE when the
    // broken chop decorrelates their reflection frame-to-frame — they become glints, not flicker.
    float _rl = dot(refl, vec3(0.2126, 0.7152, 0.0722));
    refl *= mix(1.0, 0.85 / max(0.85, _rl), uStormSea);   // cap only under storm; byte-identical elsewhere
    // MATTE IT DOWN: an overcast storm sea is dull, not chrome — dim the reflected sample + cap the
    // mirror at ~55% even at grazing angles so the dark water body always owns ≥45%.
    refl *= mix(1.0, 0.55, uStormSea);
    // Fable 85 §2 — sparse drifting amber glints: ~8–12 lozenge sparkles on the black mirror, hash-
    // varied twinkle (no metronome), never white/green (gameplay hues stay exclusive). 0 → skipped.
    if (uReflGlint > 0.001) {
      vec2 gp = vWorldPos.xz * vec2(2.2, 0.9);          // cells compressed in x → lozenge glints
      gp.y -= time * 0.55;                              // drift down-lane, matches the water flow
      float gk = hash(floor(gp));
      float tw = 0.5 + 0.5 * sin(time * (1.8 + 4.5 * gk) + gk * 6.2831);   // per-glint twinkle
      float g = step(0.985, gk) * tw * tw;             // tw² = sharp on-pulse, long dark gap
      refl += uReflGlint * g * vec3(1.0, 0.80, 0.50) * 1.4 * (0.3 + 0.7 * fresnel);
    }
    vec3 col = mix(base, refl, clamp(fresnel * 1.35, 0.0, 1.0) * (1.0 - 0.45 * uStormSea));

    // THE EMPYREAN — NACRE (§4b, uNacreMix 0 = shipped byte-identical; R1 consumed). Mother-of-pearl, not
    // a mirror: luster, not gloss. TWO cheap fragment terms, both view-driven (NO sun direction → no source):
    //  (1) a broad fresnel-weighted SATIN sheen — a wide soft grazing lift (the anti-glitter lobe), and
    //  (2) a constrained thin-film IRIDESCENCE band whose gamut is rose↔lilac↔periwinkle ONLY (the cosine
    //      stops can't reach green or gold), firing on CREST faces at GRAZING angles and dying in troughs
    //      (that's where real nacre fires). Banded + angular + soft — never the oil-slick rainbow or the
    //      plastic car-paint sheen. The pow-240 sun-glitter + the cheap sparkle flakes are killed below.
    if (uNacreMix > 0.0001) {
      float _graze = pow(1.0 - NdotV, 1.7);                 // grazing-view weight — broadened so the mid-field fires too, not only the far horizon
      float _crest = mix(0.34, 1.0, smoothstep(-0.06, 0.14, h));   // a base luster everywhere, STRONGER on crest faces (still recedes in the deep troughs) — the calm swell has little crest, so a floor keeps the read
      // Interference bands: t from fresnel + wave height → a repeating rose→lilac→periwinkle sweep (the real
      // nacre band ORDER). Higher frequency → more, tighter bands (the interference read); the two mixes keep
      // the gamut off green + off gold. fract() gives the repeat.
      float _it = fract(fresnel * 3.4 + h * 2.6);
      vec3 _irid = _it < 0.5 ? mix(vec3(0.949, 0.769, 0.863), vec3(0.863, 0.824, 0.941), _it * 2.0)
                             : mix(vec3(0.863, 0.824, 0.941), vec3(0.769, 0.804, 0.957), (_it - 0.5) * 2.0);
      col = mix(col, _irid, uNacreMix * _graze * _crest * 0.62);   // luster read — banded + angular + soft, never an oil slick
      // SECOND interference order (Fable-model gate: the water read as one-hue "violet satin"; nacre needs a
      // second interference hue to become true mother-of-pearl). A BROAD low-frequency sweep keyed to WORLD
      // position (not view), so at a glance the surface crosses between periwinkle-violet and a soft ROSE
      // across its expanse — along-surface zones that read as FORM, not a painted stripe. ΔH only, S≈0.15
      // (≤0.30 cap), sourceless, still off green + gold. Softer/broader than the primary band.
      float _it2 = fract(dot(vWorldPos.xz, vec2(0.011, 0.008)) + h * 0.4 + fresnel * 0.5 + time * 0.013 * uStructMix);   // PR-A: slow interference-phase drift (hue motion; 0 elsewhere = shipped)
      vec3 _irid2 = mix(vec3(0.786, 0.772, 0.918), vec3(0.949, 0.792, 0.872), smoothstep(0.18, 0.82, _it2));   // periwinkle-violet ↔ soft rose
      col = mix(col, _irid2, uNacreMix * _graze * _crest * 0.34);
      // Broad SATIN sheen: a wide soft grazing lift, no sun dir — the luster read that replaces the glint.
      col += vec3(0.94, 0.90, 0.96) * pow(1.0 - NdotV, 3.0) * 0.22 * uNacreMix * (1.0 - 0.6 * smoothstep(10.0, 40.0, abs(vWorldPos.x)) * uStructMix);   // r6: the grazing sheen was rebuilding the waterline highlight on the FLANKS (gate r5: y274 L0.783 erased the drop) - damp it off-corridor
    }

    // THE EMPYREAN uplift PR-1 — the player-coupled WAKE (uWakeMix 0 = shipped byte-identical).
    // Expanding ripple rings radiate from the dragon's position (uHeroPos, fed every frame by
    // dragon.js's hero-pool call): value-DARK motion — troughs dip toward the deep colour, never a
    // bright glint (theology: dark-accent motion is the only motion that survives the bright field).
    // This is the one element that makes the water answer the player instead of looping.
    if (uWakeMix > 0.0001) {
      float _wkr = length(vWorldPos.xz - uHeroPos.xz);
      // pow-sharpened crests → 2-3 DISCRETE expanding rings, not a continuous smudge (Fable gate:
      // "reads as a vignette, not a wake"); still value-dark only.
      float _wk = pow(max(sin(_wkr * 1.6 - time * 4.6), 0.0), 3.0) * exp(-_wkr * 0.085) * smoothstep(36.0, 7.0, _wkr);
      col = mix(col, deepColor, _wk * 0.30 * uWakeMix);
    }

    // THE EMPYREAN uplift PR-A (uStructMix 0 = shipped byte-identical) — the water's half of the
    // 3-tier value scheme + the disc's WORLD-ANCHORED pulse-ring + its mirror-smudge (all value-DARK,
    // floors well above the Mote's black; owner-approved theology amendment).
    float _pwG = 0.0;   // r6: the ring band, hoisted for the POST-fog rose pass below
    if (uStructMix > 0.0001) {
      float _fl = smoothstep(10.0, 40.0, abs(vWorldPos.x));                 // r6: full flank depth by the quarter-frame, not the frame edge
      col = mix(col, deepColor * vec3(0.92, 0.90, 1.05), _fl * 0.68 * uStructMix);   // r6c: margin above the 15% bar (probe straddled 13.8-15.7 with capture noise)
      // the ring is born at a QUANTIZED world point ahead (disc-born, not a wake cousin) and expands
      // past the player at 34 m/s, one pulse every ~8s
      float _pr = length(vWorldPos.xz - vec2(0.0, uPulseFoot));
      float _pR = mod(time, 8.0) * 34.0;
      float _pw = smoothstep(_pR - 13.0, _pR, _pr) * (1.0 - smoothstep(_pR, _pR + 13.0, _pr)) * (1.0 - smoothstep(200.0, 300.0, _pr));
      col = mix(col, deepColor, _pw * 0.30 * uStructMix);   // depth only here — the ROSE is applied POST-fog below (r5/r4 lesson: at 100-300m the fog mix replaces 50-77% of any pre-fog tint, re-bluing it)
      _pwG = _pw * uStructMix;
      // the disc's dark MIRROR-SMUDGE: the 2nd-darkest thing in frame (~L55, above the L50 floor) —
      // a slim centerline streak far ahead, so the disc stains its own reflection
      float _sm = (1.0 - smoothstep(2.5, 13.0, abs(vWorldPos.x))) * smoothstep(90.0, 250.0, uHeroPos.z - vWorldPos.z);
      col = mix(col, deepColor * 0.58, _sm * 0.55 * uStructMix);
    }

    // Golden sun streak: compress the normal's x so the highlight stretches
    // toward the camera (classic low-sun water glitter lane).
    // STORMSEA: the sun is HIDDEN behind the deck — there is no coherent specular PATH to the viewer.
    // Relax the toward-camera stretch (rounder/shorter lobe) so the glitter confines to a DISTANT
    // horizon band instead of a calm "moonlit lane" running to the foreground; and dim the gain.
    vec3 Ns = normalize(vec3(N.x * mix(0.30, 0.70, uStormSea), N.y, N.z));
    vec3 H = normalize(normalize(sunDir) + V);
    float spec = pow(max(dot(Ns, H), 0.0), 240.0);
    // THE EMPYREAN sun #2 kill (§4b): the classic low-sun pow-240 glitter LANE is a mirror-sharp
    // directional glint keyed on sunDir — a sun by any other name. × (1 - uNacreMix) → gone on the nacre
    // water; the broad view-driven satin sheen above carries the luster instead. 0 elsewhere → byte-identical.
    col += sunColor * spec * 2.6 * (1.0 - 0.45 * uStormSea) * (1.0 - uNacreMix);
    // HEAVEN reflection COLUMN: a broad soft gold lobe under the detonation — the sea-scale answer to the
    // sky-scale blast (the thin pow-240 glitter alone was nowhere near the scale of the fire). Breathes.
    col += sunColor * pow(max(dot(Ns, H), 0.0), 18.0) * 0.35 * uHeavenGlow * breath;   // 0.35 (not 0.5): the column sits in the parry corridor — keep fairness headroom under the p90 cap

    // Crest foam: a broken band where the swell peaks. Hashed in world cells
    // (and time-stepped) so it tears apart instead of reading as a flat cap, and
    // gated to real peaks so calm biomes (frozen/astral) stay glassy.
    float crest = smoothstep(0.13 * waveAmp + 0.03, 0.26 * waveAmp + 0.05, h);
    float foamN = hash(floor(p * 3.0) + floor(time * 1.6));
    float foam = crest * smoothstep(0.55, 1.0, foamN);
    col += vec3(0.82, 0.92, 1.0) * foam * 0.4 * (1.0 - 0.7 * uStormSea); // storm replaces this blue-white foam with its own overcast streaks below

    // --- STORMSEA (uStormSea 0 = shipped calm sea). Computed in-fragment from world xz so the
    // violence reads with the vertex swell OFF / on tier2. Built to the Fable STORMSEA gate order. ---
    if (uStormSea > 0.001) {
      vec2 wind = vec2(${TEMPEST_WIND.x}, ${TEMPEST_WIND.z});
      vec2 windP = vec2(-wind.y, wind.x);
      vec2 wf = vec2(dot(p, wind), dot(p, windP));   // wind space: x = along-wind, y = across
      float sStorm = sin(dot(p, wind) * ${STORM_SWELL.freq} + time * ${STORM_SWELL.speed});

      // (a) Trough darkening — EASED (×0.73) with a HARD FLOOR #182026 so the Thunderhead's
      // charcoal (0x232836) never melts into the sea (Law 8). Violence = white-on-dark CONTRAST,
      // kept by limiting the WHITE fraction, not by crushing the black.
      // PRESENCE FIELD (~180m smooth value noise): windrow FIELDS come and go — clusters of lanes,
      // then open dark water (the sea-level negative-space rhythm; Fable substrate-gate order #2).
      vec2 pc = wf * 0.0055;
      vec2 pci = floor(pc), pcf = fract(pc);
      vec2 pw = pcf * pcf * (3.0 - 2.0 * pcf);
      float pres = mix(mix(hash(pci), hash(pci + vec2(1.0, 0.0)), pw.x),
                       mix(hash(pci + vec2(0.0, 1.0)), hash(pci + vec2(1.0, 1.0)), pw.x), pw.y);
      pres = 0.5 + 0.5 * smoothstep(0.30, 0.72, pres);   // foam always half-present; windrow FIELDS go full, never fully bare

      // (a) Trough darkening — eased average, #182026 FLOOR held (dragon guard). Open water (low
      // presence) goes a touch DEEPER — the dark is half the drama.
      float trough = 1.0 - smoothstep(-0.7, 0.15, sStorm);
      vec3 dk = max(col * mix(1.0, mix(0.62, 0.70, pres), trough), vec3(0.094, 0.125, 0.149));
      col = mix(col, dk, uStormSea * _stormCalm);   // EYE-BREACH: the eye's foot is becalmed (trough darkening eased)

      // (b) PRIMARY combed lanes — CONTINUOUS along the wind (~55m modulation, LOW threshold so a
      // lane stays continuous 30m+), thin across (~2.5m of a 10m band), lanes ~10m apart. Each lane's
      // along-pattern is keyed to its OWN id so the lane reads as one line, not a grid of dashes.
      float laneId = floor(wf.y * 0.10);
      float alongA = wf.x * 0.018 + time * 0.5;
      float lnoise = mix(hash(vec2(floor(alongA), laneId)), hash(vec2(floor(alongA) + 1.0, laneId)),
                         smoothstep(0.0, 1.0, fract(alongA)));
      float lane = smoothstep(0.46, 0.9, lnoise);
      float fAc = fract(wf.y * 0.10);
      lane *= smoothstep(0.26, 0.45, fAc) * smoothstep(0.68, 0.45, fAc);   // ~2.5–3m lane centered in the 10m band
      lane *= smoothstep(-0.05, 0.55, sStorm) * (0.6 + 0.4 * smoothstep(0.1, 0.5, h + 0.2)); // crest-biased + torn by ripple
      // SECONDARY flecks — spray torn OFF lanes: ELONGATED along the wind (≈7:1 smears, not chips),
      // SOFT-edged (no rectilinear border), masked to the lane neighborhood, near-field contrast damped.
      float fleckN = hash(floor(vec2(wf.x * 0.22, wf.y * 1.7) + 31.0));   // ~4.5m along × ~0.6m across
      float fleck = smoothstep(0.72, 1.0, fleckN) * 0.12;                 // wide soft edge → smear, not tile
      fleck *= smoothstep(0.40, 0.62, lnoise);                           // only near a primary lane — never free sprinkle
      fleck *= mix(0.5, 1.0, smoothstep(0.0, 35.0, dist));               // damp fleck CONTRAST directly under the camera (primary lanes stay full)
      float foamS = (lane + fleck) * pres;        // clustered by the presence field
      foamS *= mix(0.6, 1.0, smoothstep(30.0, 150.0, dist));            // ease the near field (gameplay lives here)
      foamS *= 1.0 - smoothstep(fogFar * 0.7, fogFar, dist);           // dissolve clean into the pale far fog (bible law)
      // #c4cdce overcast foam; peak lifted now that the matte/broken field is ~⅓ darker.
      col = mix(col, vec3(0.77, 0.80, 0.80), clamp(foamS * uStormSea * _stormCalm, 0.0, 0.48));   // EYE-BREACH: wind-combed foam eased inside the calm patch
    }

    // EYE-BREACH calm/gold composite (uBreachMix 0 = shipped): a calmer, slightly-bluer body + a
    // feathered GOLD sun-pool (#ffd870) — the becalmed sea catching the leaked sun. Applied AFTER the
    // storm terms so it visibly settles the violence it just attenuated. Both terms × the mask → 0 off.
    col = mix(col, col * vec3(0.90, 0.98, 1.10) + vec3(0.03, 0.05, 0.07), _calmPatch * 0.6);   // toward a calm silver-blue
    col += vec3(1.0, 0.847, 0.439) * _goldPool * 0.5;                                          // gold sun-pool at the eye's foot

    // THE SUN-ROAD (Fable beauty pass — the single highest-awe move): the breach's reflection laid on the
    // sea as a BROKEN gold glitter path running from the eye at the horizon down the lane toward the player.
    // Unlike the far calm POOL above (deliberately NOT a glitter lane, per the old restraint), the beauty
    // pass now WANTS the lane: a tight azimuth cone that SPANS distance (near→far), brightest at the horizon
    // source, fading toward camera, shattered into shimmering glints so it reads as sun-on-water not a painted
    // stripe. Gold #ffd06b matching the breach lip. Gated by uBreachMix → only burns when the eye is open.
    float _roadAz = pow(_azB, 8.0);                                                   // TIGHT lane cone along the sun/breach azimuth (a path, not a broad wash)
    float _roadFar = smoothstep(fogFar * 0.04, fogFar * 0.52, dist);                  // 0 at camera → 1 toward the horizon source
    float _roadBase = _roadAz * mix(0.32, 1.0, _roadFar) * uBreachMix;               // soft continuous gold sheen down the lane
    float _roadSpark = hash(floor(p * 3.3) + floor(time * 2.5));                      // hashed breakup → shimmering, not solid
    col += vec3(1.0, 0.816, 0.42) * _roadBase * 0.42;                                 // the road glow (kept moderate so the teal-slate sea reads THROUGH it — a path, not a gold sea)
    col += vec3(1.0, 0.90, 0.60) * _roadBase * step(0.78, _roadSpark) * 1.0;          // shattered gold glints riding the road (the shimmer carries the read, not a flat wash)

    // HERO POOL (Fable 75): the player light answered on the mirror. 0 = shipped. The vec2(2.4, 0.9)
    // anisotropy stretches the pool DOWN-lane into a vertical reflection streak (~2.7:1 on screen) —
    // what a real light on real water does, never another disc. World XZ = the rain-ring hash space.
    vec2 _hd = (vWorldPos.xz - uHeroPos.xz) * vec2(2.4, 0.5);   // Fable 77: z 0.9→0.5 (world ~4.8:1 down-lane) — perspective foreshortens the z-axis, so 0.9 compressed to a ~1:1 disc on screen; 0.5 lands a true ~2:1 vertical reflection streak
    float _hp = exp(-dot(_hd, _hd) / 70.0);   // ~8.4m 1/e half-width
    col += uHeroCol * (_hp * uHeroPool * 0.38);
    // GLOW-SPILL POOLS (Fable 96-B): the Mire's hero glow clusters answered on the mirror. Same z-anisotropy
    // as the hero pool (perspective foreshortens z → a vertical streak, never a disc). Empty slot strength 0 =
    // +0; uMirePoolK 0 in the other 6 biomes ⇒ the whole loop is exactly +0 ⇒ byte-identical shipped water.
    if (uMirePoolK > 0.001) {
      for (int i = 0; i < 4; i++) {
        vec2 _md = (vWorldPos.xz - uMirePools[i].xy) * vec2(2.0, 0.55) * uMirePools[i].z;
        col += uMirePoolCol * (exp(-dot(_md, _md)) * uMirePools[i].w * uMirePoolK);
      }
    }

    // Rain LAYER B — SPLASH RINGS: the rain LANDS. Two offset hashed grids (~1.1m, ~1.7m cells, no
    // regularity) of expanding rings, faded out beyond ~55m (sub-pixel = shimmer). Welds sky to sea.
    if (uRainRipple > 0.001) {
      float ring = _rainRing(p, 1.1, 0.0, time) + _rainRing(p, 1.7, 5.0, time);
      ring *= smoothstep(58.0, 24.0, dist) * uRainRipple;
      col += vec3(0.80, 0.82, 0.82) * ring * 0.16;
    }

    // Fine sun-glitter on the wave faces toward the camera — a sparse, slow
    // twinkle gated to glancing angles (both water variants; the reflective path
    // otherwise has no micro-sparkle of its own). Kept rare so it reads as
    // catch-lights, not noise.
    float glit = hash(floor(p * 4.0) + floor(time * 3.0));
    col += sunColor * step(0.9965 - 0.002 * uHeavenGlow * az, glit) * pow(1.0 - NdotV, 1.6) * 1.5 * (1.0 - 0.5 * uStormSea);   // a few more catch-lights inside the blast column; halved under storm (overcast, and foam must not stack to over-bright white)

    // Manual fog (matches scene linear fog) — dual-color (§5.2): the fog
    // itself grades from the NEAR color into the FAR color with the same
    // factor. Where fogFarColor == fogColor (every biome without one) this is
    // exactly the old single-color fog.
    float fogF = smoothstep(fogNear, fogFar, dist);
    vec3 fogCol = mix(fogColor, fogFarColor, fogF);
    // HEAVEN graded haze horizon (kills the flat-two-bands seam): re-target the FAR fog toward a warm umber
    // under the blast — the far sea grades continuously UP into the dome's gold band where it aligns with the
    // detonation (az→1), cooling back to the locked violet toward the frame edges. fogF² keeps the near/mid
    // sea (the parry-corridor field) untouched.
    vec3 heavenHaze = mix(fogFarColor, uHorizonCol, uHeavenGlow * (0.30 + 0.70 * az));
    fogCol = mix(fogCol, heavenHaze, fogF * fogF * uHeavenGlow);   // ×uHeavenGlow gate ⇒ 0 off-heaven = byte-identical (won't disturb dual-fog biomes)
    // N8 PR B sunward inscatter: brighten the fog toward the sun (matches the
    // prop chunk's pow(...,6.0)). +0 exactly when uAtmosInscatter is 0 → shipped.
    // -V is the camera->fragment dir (V = normalize(cameraPosition - vWorldPos)
    // above) — reuse it to save a normalize on the frame's largest fill surface.
    float atmSun = pow(clamp(dot(-V, uAtmosSunDir), 0.0, 1.0), 6.0);
    fogCol += uAtmosSunTint * (atmSun * uAtmosInscatter * fogF);
    // THE EMPYREAN uplift PR-A r4: the flank deepening must survive INTO the fog — the bright opal fog
    // repainted the far water rows and rebuilt the fog stripe at the sky-water line (gate r3: flank L
    // jumped 182→200 crossing the line). Darken the fog COLOUR itself off-corridor toward dusty violet
    // (the heavenHaze gating pattern); ×uStructMix ⇒ 0 in every other biome = byte-identical.
    float _fgFl = smoothstep(14.0, 55.0, abs(vWorldPos.x)) * uStructMix;
    fogCol = mix(fogCol, fogCol * vec3(0.72, 0.69, 0.88), _fgFl);   // r5: deeper flank fog (the continuity mechanism is proven; only amplitude was short)
    col = mix(col, fogCol, fogF);
    // r6: the pulse-ring's ROSE applied AFTER the fog mix — the only place a hue survives to the
    // framebuffer at ring distance (two gate rounds proved pre-fog tints re-blue). R up, G/B down.
    col = mix(col, col * vec3(1.34, 0.66, 0.80), _pwG * 0.70);   // r6b: probe read 364 moving-rose px vs the ~400 bar - one notch up

    gl_FragColor = vec4(col, 1.0);
    // These chunks are render-target aware in r160: the renderer forces
    // NoToneMapping + linear output when drawing into the composer's HDR target
    // (so they no-op there and OutputPass owns ACES+sRGB), and apply ACES+sRGB
    // on the tier-2 direct-to-screen path. One shader, both paths, no double grade.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// N10a: one geometry factory. Flat single quad (today's exact geometry) when swell
// is off or on tier2 → byte-identical shipped surface; subdivided when swell is on
// (uniform grid: tier0 96×160 ≈ 30k tris one draw, tier1 48×80). frustumCulled is
// disabled on the mesh, so the flat bounding sphere is fine for the displaced grid.
function makeWaterGeometry() {
  if (!swellOn || geomTier >= 2) return new THREE.PlaneGeometry(SIZE_W, SIZE_L);
  const [xs, zs] = geomTier === 0 ? [96, 160] : [48, 80];
  return new THREE.PlaneGeometry(SIZE_W, SIZE_L, xs, zs);
}

function buildReflective() {
  const shader = {
    name: 'DragonWaterReflective',
    uniforms: {
      ...THREE.UniformsUtils.clone(sharedUniforms),
      color: { value: new THREE.Color(0xffffff) },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
    },
    vertexShader,
    fragmentShader,
  };
  // N11: tier0 = 768² (crisp hero mirror), tier1 = 384² (cheaper, the quarter-area
  // RT + half-rate roughly quarter the mirror's per-frame cost). textureWidth is a
  // construction-time Reflector option, so the resolution swap rides the rebuild seam.
  const mesh = new Reflector(makeWaterGeometry(), {
    shader,
    textureWidth: mirrorRes,
    textureHeight: mirrorRes,
    clipBias: 0.02,
    multisample: 0,
  });
  mesh.material.defines = { USE_REFLECTION: '' };
  mesh.material.needsUpdate = true;
  // Mirror pass renders gameplay layer 0 only — sprite clutter (trails,
  // particles, aura) lives on layer 1 and is excluded from the reflection.
  mesh.camera.layers.set(0);
  const origOBR = mesh.onBeforeRender;
  mesh.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    // Callers (the god-ray occlusion mask) suspend the mirror when the water is drawn
    // purely as a black occluder.
    if (_reflectSuspended || _dietMirrorOff) return;
    // N11 half-rate (tier1): skip the mirror render on odd frames — the water keeps
    // last frame's RT. Skipping the whole origOBR also freezes the textureMatrix,
    // which is CORRECT: a stale texture with its matching stale matrix. (Updating the
    // matrix on skip frames would make the reflection swim.)
    // HEAVEN DIET: in the settled arena the mirror reflects only a dim haze-deck dropped
    // 30u — the detonation/embers/debris are layer-1-EXCLUDED, props are hidden, and the
    // "sea answers the blast" gold column is the ANALYTIC sunColor specular, not the mirror.
    // So the reflection is nearly static and barely-read → cut the refresh HARD (tier0
    // half-rate, tier1 quarter-rate). This reclaims ~135–270 draw calls/frame in the arena
    // — the biggest single perf line item — at ~0 visible cost. Off-heaven = shipped N11 rate.
    const inHeaven = _arenaMix > 1.0 || arenaDropK > 0.5;   // the whole heaven UNVEILING (mix>1), incl. the heavy transition frames, not just the settled deck
    const settledHeaven = arenaDropK > 0.9;                 // the sea is a dim deck dropped 30u — the reflection is all but invisible (the "sea answers the blast" gold column is analytic sunColor specular, NOT the mirror)
    // The mirror is a FULL extra scene render (~169 draws). Duty-cycle it: NEAR-FREEZE in the settled
    // heaven (1/8 — the dropped deck barely reads), quarter-rate elsewhere in the heaven, half-rate in
    // normal play (was full-rate off-heaven at tier 0). Renders on EVEN _parity (the god-ray mask is
    // staggered onto other frames so the two full-scene passes don't stack → the worst frame flattens).
    // Off-heaven (cruise) the mirror is ½-rate; the dynRes perf-saver drops it to ¼ under
    // load (near-invisible — the reflection moves slowly), spent before any resolution trim.
    // Heaven rates are untouched (identity when the saver is off).
    const skipMask = settledHeaven ? 7 : (inHeaven ? (halfRate ? 3 : 1) : (_perfSaver ? 3 : 1));
    if (_parity & skipMask) return;
    // N11 far-plane clamp: trim the mirror frustum to the fog wall (fogFar+50 —
    // everything beyond is 100% fogged, so it's visually identical but a much smaller
    // frustum to cull/draw against). The Reflector copies the MAIN camera's projection
    // (not the mirror camera's), so clamp the incoming camera and restore it
    // unconditionally. Read the LIVE per-material fogFar (sharedUniforms is stale
    // between rebuilds; updateWater writes the material clone).
    let savedFar = 0, clamped = false;
    if (reflFar) {
      savedFar = camera.far;
      const ffU = this.material.uniforms.fogFar;
      const nf = Math.min(savedFar, (ffU ? ffU.value : savedFar) + 50);
      if (nf < savedFar) { camera.far = nf; camera.updateProjectionMatrix(); clamped = true; }
    }
    origOBR.call(this, renderer, scene, camera, geometry, material, group);
    if (clamped) { camera.far = savedFar; camera.updateProjectionMatrix(); }
  };
  return mesh;
}

// When TRUE, the reflective water skips its mirror render — used during the
// god-ray occlusion pass, where the water only needs to draw a black silhouette.
let _reflectSuspended = false;
export function setWaterReflectionSuspended(on) { _reflectSuspended = on; }
// BOSS-FIGHT PERF DIET (struggling device only) — lever A: freeze the mirror for the whole fight so the
// FULL extra scene render (~30k-tri mirror pass) is skipped every frame. Distinct from the god-ray's
// transient _reflectSuspended (which toggles per mask-render). Uses the SAME freeze semantics as N11 half-
// rate: the water keeps last frame's RT with its matching stale textureMatrix, so the reflection doesn't
// swim. Chosen over a reflective→analytic REBUILD deliberately — the diet engages ~1s INTO the fight (after
// resolution is spent), where a mesh rebuild would pop mid-combat (a Fable fail condition); a frozen matte
// storm mirror at 0.45 res is imperceptible (there is no readable mirror image there anyway). Capable device
// never engages → false → byte-identical.
let _dietMirrorOff = false;
export function setWaterMirrorDiet(on) { _dietMirrorOff = !!on; }

function buildCheap() {
  const mat = new THREE.ShaderMaterial({
    name: 'DragonWaterCheap',
    uniforms: THREE.UniformsUtils.clone(sharedUniforms),
    vertexShader,
    fragmentShader,
  });
  return new THREE.Mesh(makeWaterGeometry(), mat);
}

function spawnWater() {
  water = reflective ? buildReflective() : buildCheap();
  // N8 PR B: attach the SHARED atmosphere uniform objects by reference on the
  // CONSTRUCTED material — after buildCheap's clone AND the Reflector's own second
  // internal UniformsUtils.clone. Deliberately NOT in sharedUniforms (that gets cloned).
  Object.assign(water.material.uniforms, atmosUniforms);
  water.material.uniforms.uSwellAmp.value = swellOn ? 1 : 0; // 0 keeps the flat plane exact
  water.material.uniforms.uAbsorbOn.value = depthOn ? 1 : 0; // N10b: 0 keeps the shipped height mix
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.frustumCulled = false;
  sceneRef.add(water);
}

// One rebuild seam (A5) keyed on the current {reflective, swellOn, geomTier} state,
// carrying the live tint/fog through sharedUniforms. Called on first create and on
// every reflective / swell / LOD boundary crossing (all rare — quality hysteresis).
function rebuildWater() {
  if (!sceneRef) return;
  const old = water;
  if (old) {
    const u = old.material.uniforms;
    for (const k of Object.keys(sharedUniforms)) {
      const sv = sharedUniforms[k].value;
      if (sv && sv.copy) sv.copy(u[k].value);
      else sharedUniforms[k].value = u[k].value;
    }
    sceneRef.remove(old);
    if (old.dispose) old.dispose();
    else old.material.dispose();
    old.geometry.dispose();
  }
  _parity = 0; // N11: render the fresh mirror on the next frame (never present its black initial RT)
  spawnWater();
}

// N11: the second arg is now a quality TIER (0/1/2), not a boolean — it selects
// reflective-on + mirror resolution + half-rate together.
export function createWater(scene, tier) {
  sceneRef = scene;
  applyReflTier(tier);
  rebuildWater();
}

// Tier crossing (rare; quality hysteresis prevents thrashing). Rebuilds only when the
// reflective state OR the mirror resolution actually changes — a tier0↔tier1 swap is
// both reflective, so keying on `reflective` alone would leave the mirror at the wrong
// resolution; the `mirrorRes` half of the key catches it.
export function setWaterReflective(tier) {
  const wasOn = reflective, wasRes = mirrorRes;
  applyReflTier(tier);
  if (!sceneRef || (reflective === wasOn && mirrorRes === wasRes)) return;
  rebuildWater();
}

// N11: mirror far-plane clamp kill-switch (?reflfar=0) for the A/B — live, no rebuild.
export function setWaterReflFar(on) { reflFar = !!on; }
// N11 test/debug introspection for the tier truth table (read-only snapshot).
export function waterReflState() {
  return { reflective, mirrorRes, halfRate, parity: _parity, reflFar,
    isReflector: !!(water && water.isReflector) };
}

// N10a: the SWELL toggle (Settings / ?swell). Rebuilds to the subdivided (on) or
// flat (off) geometry; off is byte-identical to the shipped water (1×1 + uSwellAmp=0).
export function setWaterSwell(on) {
  on = !!on;
  if (on === swellOn) return;
  swellOn = on;
  rebuildWater();
}

// N10a: subdivision LOD from applyQuality. Rebuilds only when the geometry would
// actually change (swell on, and a real tier boundary — not flat↔flat at tier2).
export function setWaterSwellQuality(tier) {
  if (tier === geomTier) return;
  const wasFlat = geomTier >= 2, nowFlat = tier >= 2;
  geomTier = tier;
  if (swellOn && !(wasFlat && nowFlat)) rebuildWater();
}

// N10b: the WATER DEPTH toggle (Settings / ?depth). A live uniform flip — no rebuild
// (uAbsorbOn=0 is byte-identical to the shipped height mix; runs on every tier incl.
// the flat tier2 quad).
export function setWaterDepth(on) {
  depthOn = !!on;
  if (water) water.material.uniforms.uAbsorbOn.value = depthOn ? 1 : 0;
}

// ARENA (PR-K, THE FIRSTBORN SKY): the S3 heaven drops the sea ~30u into a dim cosmic HAZE-DECK far
// below the seraph's wings (owner: lowered deck, mirror KEPT — the Reflector derives its mirror plane
// from the mesh world transform per render, so the drop needs no reflector work). Driven by the EXACT
// heaven window the arenaSet uses (smoothstep 1.45→1.85 on the stateless bossArenaMix, × the exhale
// fade) — threaded through main.js's per-frame call (water.js must not import boss.js: boss.js →
// environment.js → water.js would cycle). k=0 ⇒ y=0 byte-identical; self-healing at mix 0; exhale-
// continuous (the deck rises back as the sky dissolves). contactShadow.js reads getArenaDropK() to
// fade the player shadow with the same window (a shadow on vacuum is nonsense).
const ARENA_DROP = 30;
const DROP_LO = 1.45, DROP_HI = 1.85;   // = arenaSet.js RISE_LO/RISE_HI (the one heaven window)
let arenaDropK = 0;
let _arenaMix = 0;   // 0 biome · 1 void · 2 heaven — the mirror diet triggers the moment the heaven UNVEILING starts (mix>1), not just once the sea has fully dropped, so the heavy transition frames get it too
export function getArenaDropK() { return arenaDropK; }
export function debugWaterY() { return water ? water.position.y : 0; }

export function updateWater(dt, playerDist, time, fog, arenaMix = 0, arenaFade = 1) {
  if (!water) return;
  _parity++; // N11: one bump per PRESENTED frame drives the half-rate mirror parity
  _arenaMix = arenaMix;
  water.position.z = -playerDist - 250;
  const s = Math.max(0, Math.min(1, (arenaMix - DROP_LO) / (DROP_HI - DROP_LO)));
  arenaDropK = s * s * (3 - 2 * s) * Math.max(0, Math.min(1, arenaFade));
  water.position.y = -ARENA_DROP * arenaDropK;   // 0 exactly off-heaven → shipped plane
  const u = water.material.uniforms;
  u.time.value = time;
  u.uSwellAmp.value = swellOn ? 1 : 0; // belt-and-braces after any rebuild
  u.uAbsorbOn.value = depthOn ? 1 : 0; // N10b live toggle (no rebuild needed)
  // HEAVEN sun steer: move the gold specular column UNDER the centered detonation (was left, on the biome
  // sun). Weight ramps with the heaven unveiling (mix 1→2) × fade; 0 off-heaven ⇒ sunDir === SUN_DIR.
  const heavenSunK = Math.max(0, Math.min(1, arenaMix - 1)) * Math.max(0, Math.min(1, arenaFade));
  u.sunDir.value.copy(SUN_DIR).lerp(HEAVEN_SUN_DIR, heavenSunK).normalize();
  u.uHeavenGlow.value = OLD_SEA ? 0 : heavenSunK;   // Fix C: the premium blast-horizon integration rides the SAME heaven weight (0 off-heaven → byte-identical); ?oldsea pins it off
  if (fog) {
    u.fogColor.value.copy(fog.color);
    u.fogNear.value = fog.near;
    u.fogFar.value = fog.far;
  }
}

// N10a — the JS port of the vertex swell (the SAME SWELL constant), evaluated at a
// world (x,z) with the material's live time + waveAmp. The contact-shadow plane
// rides this so it sits ON the crests instead of clipping through them. Returns 0
// when swell is off or water absent → the shadow stays at its shipped height.
// N10c: the foam collars ride the same swell — expose its on/off state so the foam
// shader displaces in lockstep (waterSurfaceHeight is a per-point probe, not a flag).
export function getWaterSwellOn() { return swellOn; }
export function getWaterDepthOn() { return depthOn; } // perf-HUD gfx readout

export function waterSurfaceHeight(x, z) {
  if (!swellOn || !water) return 0;
  const u = water.material.uniforms;
  const base = u.waveAmp.value * SWELL.amp *
    Math.sin((x * SWELL.dirx + z * SWELL.dirz) * SWELL.freq + u.time.value * SWELL.speed);
  // STORMSEA 2nd swell — mirror of the vertex _swellH so the contact shadow + foam collars
  // ride the true storm surface (0 when uStormSea is off → shipped).
  const storm = (u.uStormSea?.value || 0) * u.waveAmp.value * STORM_SWELL.amp *
    Math.sin((x * STORM_SWELL.dirx + z * STORM_SWELL.dirz) * STORM_SWELL.freq + u.time.value * STORM_SWELL.speed);
  return base + storm;
}

// Biome hook (Phase 3): lerp water palette along with sky/fog.
export function setWaterTint({ deep, shallow, sun, horizon, zenith, waveAmp, fogFarColor, auroraGlow, stormSea, rainRipple, breach, reflStretch, reflGlint, reflGreenPull, nacreMix, wakeMix, structMix }) {
  if (!water) return;
  const u = water.material.uniforms;
  u.uNacreMix.value = nacreMix || 0;   // THE EMPYREAN nacre (§4b); 0 in every other biome → byte-identical water
  u.uWakeMix.value = wakeMix || 0;     // THE EMPYREAN uplift PR-1 wake; 0 elsewhere → byte-identical
  u.uStructMix.value = structMix || 0; // THE EMPYREAN uplift PR-A; 0 elsewhere → byte-identical
  u.uStormSea.value = _stormSeaForce != null ? _stormSeaForce : (stormSea || 0); // 0 elsewhere → byte-identical calm sea; ?stormsea=0|1 forces the A/B
  u.uRainRipple.value = _stormSeaForce != null ? _stormSeaForce : (rainRipple || 0); // splash rings ride the same A/B pin
  u.uBreachMix.value = breach || 0;   // EYE-BREACH calm/gold patch; 0 in every biome that doesn't pass it → byte-identical
  u.uReflStretch.value = reflStretch || 0;   // Fable 85 reflection craft; 0 elsewhere → byte-identical mirror
  u.uReflGlint.value = reflGlint || 0;
  u.uReflGreenPull.value = reflGreenPull || 0;
  if (deep) u.deepColor.value.copy(deep);
  if (shallow) u.shallowColor.value.copy(shallow);
  if (sun) u.sunColor.value.copy(sun);
  if (horizon) u.horizonColor.value.copy(horizon);
  if (zenith) u.zenithColor.value.copy(zenith);
  if (waveAmp !== undefined) u.waveAmp.value = waveAmp;
  if (fogFarColor) u.fogFarColor.value.copy(fogFarColor);
  u.uAuroraGlow.value = auroraGlow || 0; // 0 in every biome that doesn't pass it → byte-identical
  // N10b: derive the extinction×depth per biome from the (lerped) deep/shallow
  // colours — the darker the deeps read relative to the shallows, the murkier the
  // water absorbs. No new biome fields; free biome-seam smoothness.
  if (deep && shallow) u.uAbsorbK.value = absorbKFromColors(deep, shallow);
}

// HERO POOL (Fable 75): feed the player light to the mirror each frame. Written through the LIVE
// material's uniforms (NOT the sharedUniforms template — that gets UniformsUtils.clone'd per material,
// so writing the template would never reach the drawn water; the atmosphere.js clone-trap lesson).
// pos = dragon world position; col = the hero light's (warm-neutralised) colour; k = 0.55 idle → 1.0
// fever. k=0 ⇒ the fragment add is exactly +0 (byte-identical), so any water-identity test still walks.
let _lastPulseIdx = -1;
export function setWaterHeroPool(pos, col, k) {
  if (!water) return;
  const u = water.material.uniforms;
  if (pos) u.uHeroPos.value.copy(pos);
  // PR-A r3: latch the pulse-ring's birth point ONCE per 8s pulse — world-locked for the whole pulse,
  // so the ring is born ahead and expands PAST the (moving or frozen) player. CPU state, shader-free.
  const _pIdx = Math.floor(u.time.value / 8);
  if (_pIdx !== _lastPulseIdx && pos) { _lastPulseIdx = _pIdx; u.uPulseFoot.value = pos.z - 290; }
  if (col) u.uHeroCol.value.copy(col);
  u.uHeroPool.value = k || 0;
}

// GLOW-SPILL POOLS (Fable 96-B): feed the Mire's hero glow-cluster pools to the mirror each frame. `pools`
// is an array of up to 4 {x, z, invR, strength}; `k` is the master (0 = shipped water, seam-ramped). Written
// through the LIVE material uniforms (the clone-trap). Empty/short arrays leave the rest at strength 0 = +0.
export function setMireWaterPools(pools, k) {
  if (!water) return;
  const u = water.material.uniforms;
  const arr = u.uMirePools.value;
  for (let i = 0; i < 4; i++) {
    const p = pools && pools[i];
    if (p) arr[i].set(p.x, p.z, p.invR, p.strength);
    else arr[i].set(0, 0, 1, 0);   // strength 0 → contributes exactly +0
  }
  u.uMirePoolK.value = k || 0;
}

// Rec.709 relative luminance heuristic → a murkier (darker-deep) biome absorbs faster.
const _lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
function absorbKFromColors(deep, shallow) {
  const murk = Math.max(0, Math.min(1, 1 - _lum(deep) / Math.max(_lum(shallow), 0.02)));
  return 0.35 + 0.5 * murk;
}
