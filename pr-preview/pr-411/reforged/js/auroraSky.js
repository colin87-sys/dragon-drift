import * as THREE from 'three';
import { damp } from './util.js';

// AURORA SHALLOWS sky (BIOME plan §1). An AUTHENTIC aurora-borealis drapery spliced into the
// single sky-dome draw (like N9 clouds), so it costs ZERO overdraw — it is ADDED into the dome's
// opaque gradient color, never a transparent shell (the overdraw cliff is about extra surfaces).
//
// The authenticity thesis (the ONE thing): real curtains are BOTTOM-ANCHORED — a crisp, bright,
// undulating LOWER BORDER (557.7nm oxygen green, the saturated peak) with rays streaming UP from
// it, an exponentially-fading diffuse top going faintly crimson, a thin rose skirt below, all at
// a slow crawl-and-breathe pace. Generic game auroras are vertically-symmetric rainbow ribbons
// scrolling too fast — the border term is what makes this read as northern lights.
//
// Design decisions (mirroring N9's hard-won lessons):
//  - UNIFORM BRANCH `if (uAuroraMix > 0.0001)` — never burn hash evals on 60% of the frame in the
//    other biomes; identity (byte-for-byte) when off.
//  - SEAM-FREE: all noise samples on `normalize(d.xz)` (the unit-circle point), periodic by
//    construction — fixes at the root the azimuth `atan` seam N9 still carries.
//  - PROBE-INVISIBLE (N5): NOT ported to skyProbe.js (high-frequency; the SH would alias it into
//    wobble). The world glows green via the biome PALETTE cast instead (free).
//  - Motion is TIME-driven, world-parallax ≈ 0 (a racing aurora is the classic fake tell — the
//    N9 0.02→0.002 lesson, 10× more sensitive at "100 km").

// Spliced into the sky fragment before main() (uniforms + self-contained noise).
export const AURORA_HEAD = /* glsl */`
  uniform float uAuroraMix;                 // 0 = shipped sky (biome x toggle x tier gate)
  uniform float uAurNight;                  // PREVIEW-only (?aurora=1): sink day sky→night so the
                                            // curtain reads (auroras need a dark sky). 0 in real play.
  uniform float uAurPhase, uAurBreath, uAurAct;  // JS slow phases: crawl / breathe / activity
  uniform int   uAurLayers;                 // 2 tier0 / 1 tier1+2
  uniform float uAurRay;                    // 1 tier0/1 rays on / 0 tier2 (smooth quiet arc)
  uniform vec2  uAurFwd, uAurFwd2;          // damped TRAVEL azimuth (the "stage") + the rotated secondary axis
  uniform vec3  uAurGreen, uAurGreenHot, uAurRed, uAurFringe;  // column green / hot border green / 630nm red top / N2+ rose skirt
  float _aHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float _aNoise(vec2 x){
    vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(_aHash(i), _aHash(i+vec2(1.0,0.0)), f.x),
               mix(_aHash(i+vec2(0.0,1.0)), _aHash(i+vec2(1.0,1.0)), f.x), f.y);
  }`;

// Spliced INTO main() after the dual-fog sink and BEFORE the clouds (clouds at ~10km correctly
// occlude the aurora at ~100km via the existing cloud `mix`). Writes `aurLum` (read later to
// attenuate the stars behind the curtain). `d`/`h`/`col`/`time` are already in scope.
export const AURORA_BODY = /* glsl */`
        float aurLum = 0.0;
        if (uAuroraMix > 0.0001) {
          vec2 az = normalize(d.xz + vec2(1e-5));   // unit-circle azimuth basis — SEAM-FREE noise
          float hy = d.y;                            // raw elevation (can be < 0 near the horizon)
          // envC = how "on stage" this azimuth is (1 dead-ahead → 0 at the flanks). Drives the base
          // drop (arc ends dive to the horizon) + the airglow concentration. az⋅uAurFwd, the travel dir.
          float envC = clamp(dot(az, uAurFwd), 0.0, 1.0);
          vec2 across = vec2(-uAurFwd.y, uAurFwd.x);  // perp of travel — the cross-stage axis (spans L↔R)
          // layer-0 broad fold, HOISTED (shared by the base tilt + the horizon airglow) — no extra fetch.
          float fold0 = _aNoise(az * 2.3 + vec2(uAurPhase * 0.13, 0.0));
          for (int L = 0; L < 2; L++) {
            if (L >= uAurLayers) break;
            // DRAPERY FOLDS: a broad crawling swell + a finer second octave (one octave alone is a
            // single ruler-straight swell; the octave gives per-fold hairpins).
            float fold = (L == 0) ? fold0 : _aNoise(az * 3.2 + vec2(uAurPhase * 0.13 + 7.1, 0.0));
            fold += 0.5 * (_aNoise(az * 6.4 - vec2(uAurPhase * 0.11, 3.7)) - 0.5);
            // THE LOWER BORDER: drops to the horizon at the arc FLANKS (envC→0 → base 0.04, plunges
            // below the sea-line at fold minima so the ends dive behind the world), clears the gate
            // rings at centre (envC→1 → ~0.09). Undulates per fold with a real amplitude.
            float h0 = 0.04 + 0.05 * envC + 0.11 * (fold - 0.5) + 0.02 * float(L);
            float u, sheet;
            if (L == 0) {
              // MAIN ARC (all tiers — the layer tier1/2 keeps): spans the forward hemisphere THROUGH
              // dead centre. u parameterises rays/warp only; a smoothstep envelope (not a gaussian)
              // gates the intensity, so the arc is ~130° wide with fold-driven bright knots.
              u = dot(az, across) * 4.0 + (fold - 0.5) * 3.5;
              u += (hy - h0) * 1.5 * (fold - 0.5);                       // height shear → 3D drape
              sheet = smoothstep(-0.35, 0.45, dot(az, uAurFwd)) * (0.30 + 0.70 * smoothstep(0.35, 0.75, fold));
            } else {
              // SECONDARY RIBBON (tier0 only): a detached off-axis pillar behind the arc → depth.
              vec2 axis = vec2(-uAurFwd2.y, uAurFwd2.x);
              u = dot(az, axis) * 5.0 + (fold - 0.5) * 3.5;
              u += (hy - h0) * 1.5 * (fold - 0.5);
              sheet = exp(-u * u * 6.0);                                 // narrow gaussian pillar
            }
            // RAYS: high-frequency vertical striation streaming UP from the border (noise SQUARED).
            float rn = _aNoise(vec2(u * 20.0, uAurPhase * 0.7));
            float ray = mix(1.0, 0.30 + 0.70 * rn * rn, uAurRay);
            // THE BORDER: a crisp ONSET above it, a luminous ROSE SKIRT below it — never a hard zero,
            // so there is no floating "invisible line"; the border stands ON light instead of on black.
            float body  = smoothstep(h0 - 0.02, h0 + 0.01, hy);         // crisp bottom onset (unchanged)
            float skirt = exp(min(hy - h0, 0.0) * 9.0);                 // soft luminous falloff BELOW
            float below = max(body, 0.30 * skirt);
            float tall = exp(-max(hy - h0, 0.0) * (5.5 - 2.0 * uAurAct));
            float breath = 0.8 + 0.2 * uAurBreath;
            float I = sheet * ray * below * tall * breath;
            // THE HOT-LINE: a real border is 2–3× brighter than the diffuse column above it.
            float hot = exp(-max(hy - h0, 0.0) * 28.0);
            I *= 1.0 + 1.7 * hot * below;
            // THE PHYSICS RAMP: 557.7nm green OWNS the border; the rose fringe now renders as the
            // descending SKIRT it was designed for (the old cut was deleting it); hot-line → yellower
            // green; faint crimson tops only when active.
            vec3 aCol = mix(uAurFringe, uAurGreen, smoothstep(h0 - 0.02, h0 + 0.005, hy));
            aCol = mix(aCol, uAurGreenHot, hot * below);
            float v = clamp((hy - h0) * 3.0, 0.0, 1.0);
            aCol = mix(aCol, uAurRed, smoothstep(0.45, 1.0, v) * (0.35 * uAurAct));
            col += aCol * I * uAuroraMix * 0.7;    // 0.7 ceiling: only the thin hot-line crosses bloom
            aurLum += I;
          }
          // THE HORIZON AIRGLOW: the perspective-compressed distant oval the curtains RISE OUT OF.
          // Brightest AT the sea-line (abs(hy) → the last sliver above the silhouette is hottest, and
          // it meets its own mirror reflection at the seam), on-stage (envC), fold-broken. No new fetch.
          float hg = exp(-abs(hy) * 7.0) * (0.55 + 0.45 * fold0) * (0.35 + 0.65 * envC);
          col += mix(uAurFringe, uAurGreen, 0.65) * hg * (0.10 + 0.10 * uAurAct) * uAuroraMix;
          aurLum += hg * 0.3;
        }`;

export const auroraUniforms = {
  uAuroraMix: { value: 0 },
  uAurNight:  { value: 0 },
  uAurPhase:  { value: 0 },
  uAurBreath: { value: 0.5 },
  uAurAct:    { value: 0.5 },
  uAurLayers: { value: 2 },
  uAurRay:    { value: 1 },
  uAurFwd:    { value: new THREE.Vector2(0, -1) },      // travel azimuth (forward = -Z); damped in JS
  uAurFwd2:   { value: new THREE.Vector2(0.64, -0.77) },// secondary axis ≈ 40° off forward
  uAurGreen:  { value: new THREE.Color(0x54ff86) },  // 557.7 nm atomic-oxygen green — the diffuse column
  uAurGreenHot: { value: new THREE.Color(0x86ff5c) },  // hotter yellow-green for the bright border line

  uAurRed:    { value: new THREE.Color(0xb0303c) },  // 630 nm oxygen red — faint crimson tops
  uAurFringe: { value: new THREE.Color(0xd06a8a) },  // N2+ rose skirt — DESATURATED, not danger-magenta
};

let enabled = true;   // the biome channel gates it (env.auroraMix is 0 until a biome declares aurora)
let forced = false;   // ?aurora=1 — the PR-1 hero read, before the biome exists
let tier = 0;
export function auroraEnabled() { return enabled; }
export function auroraForced() { return forced; }   // ?aurora=1 preview — gate the day-biome sun/god-rays off
export function setAuroraEnabled(on) { enabled = !!on; if (!enabled) auroraUniforms.uAuroraMix.value = 0; }
export function setAuroraForced(on) { forced = !!on; }
export function setAuroraQuality(t) {
  tier = t;
  auroraUniforms.uAurLayers.value = t === 0 ? 2 : 1;    // fewer curtain layers on weaker tiers
  auroraUniforms.uAurRay.value = t >= 2 ? 0 : 1;        // tier2 = a smooth quiet arc (still an authentic form)
}

// Damped travel azimuth (module-local so it survives frames). Starts pointing forward (-Z).
const _fwd = new THREE.Vector3();
let fwdX = 0, fwdZ = -1;

// Per-frame write from the lerped biome env. Off / no aurora in this biome → mix 0 (the uniform
// branch skips the whole block; the sky is the shipped gradient). Phases wrapped in JS so they
// never hit float32 precision on endless runs (the uCloudDrift lesson).
export function applyAurora(env, playerDist, time, camera, dt) {
  const mix = forced ? 1 : (enabled ? (env.auroraMix || 0) : 0);
  auroraUniforms.uAuroraMix.value = mix;
  // PREVIEW ONLY: `?aurora=1` over a day biome would wash the curtain out (auroras need a dark sky).
  // Force a night wash so the preview reads as the shipping NIGHT biome will. The real biome supplies
  // its own dark palette, so this stays 0 in all actual gameplay → byte-identical.
  auroraUniforms.uAurNight.value = forced ? 1 : 0;
  if (mix < 0.0001) return;
  auroraUniforms.uAurPhase.value = time % 4096;
  // breathing: two incommensurate sines → never reads as a loop
  auroraUniforms.uAurBreath.value = 0.5 + 0.5 * (0.55 * Math.sin(time * 0.9) + 0.45 * Math.sin(time * 0.27 + 1.3));
  // activity: a very slow envelope so a run sees the aurora change form (quiet arc <-> drapery)
  auroraUniforms.uAurAct.value = 0.5 + 0.5 * Math.sin(time * 0.05);
  // COMPOSITION — the arc holds CENTRE-STAGE. Key it to travel, HEAVILY damped (λ=0.35 → recentres
  // over ~6–8s): during a fast weave/yaw the aurora stays world-anchored and counter-slides across
  // frame (reads as a thing at infinity), but it can never be lost off-frame for long.
  if (camera) {
    camera.getWorldDirection(_fwd);
    const dtc = dt || 0.016;
    fwdX = damp(fwdX, _fwd.x, 0.35, dtc);
    fwdZ = damp(fwdZ, _fwd.z, 0.35, dtc);
  }
  // a slow world wander (±11° over ~6 min) so it never feels servo-locked to the crosshair
  const a = 0.20 * Math.sin(time * 0.017), ca = Math.cos(a), sa = Math.sin(a);
  let wx = fwdX * ca - fwdZ * sa, wz = fwdX * sa + fwdZ * ca;
  const inv = 1 / (Math.hypot(wx, wz) || 1); wx *= inv; wz *= inv;
  auroraUniforms.uAurFwd.value.set(wx, wz);
  // secondary ribbon axis: forward rotated ~40°±14°, drifting side to side over minutes
  const b = 0.7 + 0.25 * Math.sin(time * 0.021), cb = Math.cos(b), sb = Math.sin(b);
  auroraUniforms.uAurFwd2.value.set(wx * cb - wz * sb, wx * sb + wz * cb);
}
