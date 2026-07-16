import * as THREE from 'three';
import { Reflector } from '../lib/objects/Reflector.js';
import { SUN_DIR } from './biomes.js';
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
  // Fix C — PREMIUM HEAVEN HORIZON: weight (0 off-heaven ⇒ byte-identical) driving a graded blast-haze
  // horizon + a broad reflection column + the shared heartbeat, so the sea ANSWERS the detonation instead
  // of being two flat cardboard bands (gold sky / flat violet fogged sea) with a hard seam. MUST live here
  // or it vanishes on the reflective↔cheap rebuild.
  uHeavenGlow: { value: 0 },
  uHorizonCol: { value: new THREE.Color(0x9a6242) },   // warm umber — one tier BELOW the dome's skyHorizon 0xa87838, so the far sea grades UP into the gold band under the blast
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
export const TEMPEST_WIND = { x: 0.851, z: 0.525 };   // oblique to the lane → diagonal foam grain
export const STORM_SWELL = { dirx: 0.851, dirz: 0.525, freq: 0.115, amp: 0.95, speed: 0.55 };

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
  uniform float uHeavenGlow; uniform vec3 uHorizonCol; // Fix C: heaven blast-horizon integration (0 = shipped)
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

  void main() {
    vec2 p = vWorldPos.xz;
    float h = 0.0;
    vec2 grad = vec2(0.0);
    wave(p, normalize(vec2( 0.8,  0.6)), 0.50, 0.16 * waveAmp, 1.10, h, grad);
    wave(p, normalize(vec2(-0.6,  0.8)), 0.90, 0.08 * waveAmp, 1.70, h, grad);
    wave(p, normalize(vec2( 0.2, -1.0)), 1.70, 0.045 * waveAmp, 2.40, h, grad);
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
      vec2 distort = N.xz * 0.42;
      vec4 proj = vUvProj;
      proj.xy += distort * proj.w;
      refl = texture2DProj(tDiffuse, proj).rgb;
    #else
      // Analytic sky reflection + cheap sparkle glints.
      vec3 R = reflect(-V, N);
      refl = mix(horizonColor, zenithColor, pow(clamp(R.y, 0.0, 1.0), 0.55));
      float sk = hash(floor(p * 2.6) + floor(time * 3.0));
      refl += sunColor * step(0.985, sk) * 2.2 * pow(1.0 - NdotV, 2.0);
      // Aurora sheen (tier2 has no mirror): a horizonward green glow so weak devices keep the
      // biome's money shot. uAuroraGlow is 0 in every other biome → byte-identical.
      refl += vec3(0.33, 1.0, 0.52) * 0.4 * pow(1.0 - clamp(R.y, 0.0, 1.0), 3.0) * uAuroraGlow;
    #endif

    vec3 col = mix(base, refl, clamp(fresnel * 1.35, 0.0, 1.0));

    // Golden sun streak: compress the normal's x so the highlight stretches
    // toward the camera (classic low-sun water glitter lane).
    vec3 Ns = normalize(vec3(N.x * 0.30, N.y, N.z));
    vec3 H = normalize(normalize(sunDir) + V);
    float spec = pow(max(dot(Ns, H), 0.0), 240.0);
    col += sunColor * spec * 2.6;
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
      float trough = 1.0 - smoothstep(-0.7, 0.15, sStorm);
      vec3 dk = max(col * mix(1.0, 0.73, trough), vec3(0.094, 0.125, 0.149));
      col = mix(col, dk, uStormSea);

      // (b) Wind-combed foam LANES — SMOOTH value-noise along the wind (NO floor() blocks — those
      // read as banned pack-ice), feathered across, true ~50m×~2.5m anisotropy, lanes ~10m apart.
      float along  = wf.x * 0.02 + time * 0.5;           // 50m cells, slow downwind drift
      float acrossI = floor(wf.y * 0.10);                // ~10m lane spacing
      float l0 = hash(vec2(floor(along), acrossI));
      float l1 = hash(vec2(floor(along) + 1.0, acrossI));
      float lane = smoothstep(0.70, 1.0, mix(l0, l1, smoothstep(0.0, 1.0, fract(along)))); // fades over ~50m
      float fAc = fract(wf.y * 0.10);                    // feathered cross-profile → no hard edge
      lane *= smoothstep(0.06, 0.42, fAc) * smoothstep(0.94, 0.58, fAc);
      float fleck = smoothstep(0.90, 1.0, hash(floor(vec2(wf.x * 0.3, wf.y * 0.9) + 31.0))) * 0.15;
      float foamS = lane + fleck;
      foamS *= smoothstep(-0.05, 0.55, sStorm) * (0.6 + 0.4 * smoothstep(0.1, 0.5, h + 0.2)); // crest-biased + torn by ripple
      foamS *= mix(0.6, 1.0, smoothstep(30.0, 150.0, dist));            // ease the near field (gameplay lives here)
      foamS *= 1.0 - smoothstep(fogFar * 0.7, fogFar, dist);           // dissolve clean into the pale far fog (bible law)
      // #c4cdce overcast foam; capped so peak luminance ~ the horizon slot (white fraction ≤~18%).
      col = mix(col, vec3(0.71, 0.74, 0.75), clamp(foamS * uStormSea, 0.0, 0.34));
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
    col = mix(col, fogCol, fogF);

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
    if (_reflectSuspended) return;
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
export function setWaterTint({ deep, shallow, sun, horizon, zenith, waveAmp, fogFarColor, auroraGlow, stormSea }) {
  if (!water) return;
  const u = water.material.uniforms;
  u.uStormSea.value = stormSea || 0; // 0 in every biome that doesn't pass it → byte-identical calm sea
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

// Rec.709 relative luminance heuristic → a murkier (darker-deep) biome absorbs faster.
const _lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
function absorbKFromColors(deep, shallow) {
  const murk = Math.max(0, Math.min(1, 1 - _lum(deep) / Math.max(_lum(shallow), 0.02)));
  return 0.35 + 0.5 * murk;
}
