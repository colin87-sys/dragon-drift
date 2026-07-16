import * as THREE from 'three';

// N9 — Sky 2.0: procedural clouds (GRAPHICS-OVERHAUL.md). A domain-warped 3-octave
// value-noise FBM cloud band spliced into the existing single sky-dome draw, so the
// dome (≈60% of the frame, today a 3-stop gradient) earns its space. Two-tone
// shadow→lit with sun-facing silver-lined edges; drifts + parallaxes with flight.
//
// Gate-1 decisions baked in:
//  - PROBE-INVISIBLE: clouds are NOT ported into skyProbe.js `skyColorAt` — they're
//    high-frequency appearance detail the 9-coeff SH can't represent and would only
//    make wobble (aliasing through the 64-dir reprojection). The probe stays a
//    low-frequency ambient approximation (it already omits the sun disc/stars/aurora).
//  - UNIFORM BRANCH, not the shipped `* amount` branchless idiom: the ~16 hash evals
//    must NOT run on 60% of the frame when off (esp. tier2). `if (uCloudAmount > eps)`
//    is a uniform condition — coherent across the draw, no divergence penalty.
//  - Octave count is a uniform break-loop (one program across tiers; auto-degrade
//    fires mid-run and must not recompile).
//  - Gate (0 = shipped): uCloudAmount = biome amount × enabled × (tier < 2).

// GLSL spliced into the sky fragment BEFORE main() (noise helpers + uniforms).
export const CLOUD_HEAD = /* glsl */`
  uniform float uCloudAmount;                 // 0 = no clouds (biome x toggle x tier)
  uniform vec3  uCloudLit, uCloudShadow;      // two-tone body
  uniform float uCloudDrift;                  // wrapped playerDist parallax (JS-modulo'd)
  uniform float uCloudWindCrawl;              // storm: time-based azimuth crawl along the wind (0 = shipped)
  uniform int   uCloudOctaves;                // 3 tier0 / 2 tier1
  uniform float uCloudWarp;                   // 1 tier0 / 0 tier1 (domain warp on/off)
  float _cHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float _cvNoise(vec2 x){
    vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(_cHash(i), _cHash(i+vec2(1.0,0.0)), f.x),
               mix(_cHash(i+vec2(0.0,1.0)), _cHash(i+vec2(1.0,1.0)), f.x), f.y);
  }
  float _cFbm(vec2 p){
    float a = 0.5, s = 0.0, norm = 0.0;
    for (int i = 0; i < 4; i++){
      if (i >= uCloudOctaves) break;
      s += a * _cvNoise(p); norm += a; p *= 2.03; a *= 0.5;
    }
    return s / norm;   // normalized to [0,1] so cloud cores can saturate (any octave count)
  }`;

// GLSL spliced INTO main(), after the dual-fog sink and BEFORE the sun disc (so the
// disc peeks through gaps). `d` = normalized view dir, `h` = clamp(d.y), `sunDir`,
// `sunGlow` are already in scope.
export const CLOUD_BODY = /* glsl */`
        float cCov = 0.0; // coverage over THIS pixel (0 when off) — read by the sun disc below
        if (uCloudAmount > 0.0001) {
          // Cylindrical projection of the view dir onto the cloud plane; drift with
          // time + world parallax (dome is camera-locked, so motion is authored).
          // NOTE: atan(d.z,d.x) is NOT periodic → a hard FBM seam at azimuth ±X,
          // ~90 deg off the flight axis (outside normal framing). Gate-3: wrap it.
          // uCloudWindCrawl adds a small time crawl along the azimuth so the deck KEEPS MOVING when the
          // player slows/hovers (a still storm sky is a dead tell — "nothing here ever lands"), aligned
          // to the same wind that combs the foam. 0 in every non-storm biome → byte-identical.
          vec2 cuv = vec2(atan(d.z, d.x) * 0.6, d.y * 2.1) + vec2(time * 0.006 + uCloudDrift + time * uCloudWindCrawl, 0.0);
          vec2 warp = uCloudWarp * 0.35 * vec2(_cFbm(cuv * 1.3 + 11.3), _cFbm(cuv * 1.3 + 47.7));
          float n = _cFbm(cuv * 1.7 + warp);          // [0,1] normalized density
          // Band-shape: clouds live in a mid-sky band, faded to 0 by h~0.7 so the
          // cylindrical zenith singularity never shows.
          float band = smoothstep(0.03, 0.22, h) * (1.0 - smoothstep(0.48, 0.72, h));
          // Coverage saturates: cloud CORES read solid, edges feather.
          float shape = smoothstep(0.40, 0.72, n);
          cCov = shape * band * uCloudAmount;
          // Two-tone sculpting: a second, higher-frequency read varies lit vs shadow
          // ACROSS the cloud so it reads as form, not a flat wash.
          float form = _cvNoise(cuv * 2.7 + 8.0);
          float lit = clamp(smoothstep(0.30, 0.78, n) * 0.55 + smoothstep(0.35, 0.72, form) * 0.45, 0.0, 1.0);
          vec3 cloudCol = mix(uCloudShadow, uCloudLit, lit);
          // Silver lining (the beauty): sun-facing cloud edges catch the sun glow —
          // strongest where coverage is partial (the rim), toward the sun.
          float sunEdge = pow(max(dot(d, normalize(sunDir)), 0.0), 2.2);
          float rim = shape * (1.0 - shape) * 4.0;   // peaks at cloud edges
          cloudCol += sunGlow * (sunEdge * (0.4 + 0.8 * rim));
          col = mix(col, cloudCol, cCov);
        }`;

export const cloudUniforms = {
  uCloudAmount:  { value: 0 },
  uCloudLit:     { value: new THREE.Color(0xffffff) },
  uCloudShadow:  { value: new THREE.Color(0x8a93a8) },
  uCloudDrift:   { value: 0 },
  uCloudWindCrawl: { value: 0 },
  uCloudOctaves: { value: 3 },
  uCloudWarp:    { value: 1 },
};

// World-parallax rate: how fast the cloud field slides past as the player flies.
// The clouds sit on a far, camera-locked dome, so — like real distant clouds —
// they should barely parallax with forward speed; the gentle `time * 0.006` drift
// (~one cloud-width per ~2 min) is the dominant motion. An earlier 0.02 made the
// whole field race by (~a cloud a second at cruise) — dialled 10× down here.
export const CLOUD_PARALLAX = 0.002;

let enabled = false;
let tier = 0;
export function skyCloudsEnabled() { return enabled; }
export function setSkyCloudsEnabled(on) { enabled = !!on; if (!enabled) cloudUniforms.uCloudAmount.value = 0; }
export function setSkyCloudQuality(t) {
  tier = t;
  cloudUniforms.uCloudOctaves.value = t === 0 ? 3 : 2;
  cloudUniforms.uCloudWarp.value = t === 0 ? 1 : 0;
}

// Per-frame write from the lerped biome env. Off / tier2 → amount 0 (the uniform
// branch skips the whole block; the sky is the shipped gradient).
export function applySkyClouds(env, playerDist, time) {
  // A biome may FORCE clouds on even when the global toggle is off (a storm's deck is its identity);
  // still tier-gated (clouds are expensive fill — off on tier 2 like all clouds).
  if ((!enabled && !env.cloudForce) || tier >= 2) { cloudUniforms.uCloudAmount.value = 0; return; }
  cloudUniforms.uCloudAmount.value = env.cloudAmount || 0;
  cloudUniforms.uCloudLit.value.copy(env.cloudLit);
  cloudUniforms.uCloudShadow.value.copy(env.cloudShadow);
  // Wrap the parallax in JS so it never hits float32 precision on endless runs
  // (a one-frame lattice snap every ~51 km is invisible; float shimmer is not).
  cloudUniforms.uCloudDrift.value = (playerDist * CLOUD_PARALLAX) % 1024;
  // Storm wind-crawl: the deck keeps moving when the player hovers, along the wind. ~0.010 rad/s, gated
  // by rainMix so it is Tempest-only and crossfades the seam (0 elsewhere = byte-identical).
  cloudUniforms.uCloudWindCrawl.value = 0.010 * (env.rainMix || 0);
}

// --- JS FBM port (god-ray coupling only; NOT the probe) ----------------------
// One evaluation per frame at the sun direction → cloud coverage over the sun, so
// the god-ray shafts ease down when a cloud drifts across it. Structural parity
// with the GLSL (same octaves/lacunarity/gain); exact pixel match not required —
// it modulates shaft intensity, not a rendered pixel.
function jHash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function jvNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = jHash(ix, iy), b = jHash(ix + 1, iy), c = jHash(ix, iy + 1), e = jHash(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (e - c) * fx) * fy;
}
export function jFbm(x, y, octaves) {
  let amp = 0.5, s = 0, norm = 0, px = x, py = y;
  for (let i = 0; i < octaves; i++) { s += amp * jvNoise(px, py); norm += amp; px *= 2.03; py *= 2.03; amp *= 0.5; }
  return s / norm; // normalized [0,1] — parity with the GLSL _cFbm
}
export function sunCloudCover(env, sunDir, playerDist, time) {
  if (!enabled || tier >= 2 || !(env.cloudAmount > 0)) return 0;
  const drift = (playerDist * CLOUD_PARALLAX) % 1024;
  const cx = Math.atan2(sunDir.z, sunDir.x) * 0.6 + time * 0.006 + drift;
  const cy = sunDir.y * 2.1;
  const n = jFbm(cx * 1.7, cy * 1.7, cloudUniforms.uCloudOctaves.value);
  const h = Math.max(0, Math.min(1, sunDir.y));
  const band = smoothstep01(0.03, 0.22, h) * (1 - smoothstep01(0.48, 0.72, h));
  const cov = smoothstep01(0.40, 0.72, n) * band * env.cloudAmount;
  return Math.max(0, Math.min(1, cov));
}
function smoothstep01(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
