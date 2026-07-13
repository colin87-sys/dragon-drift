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
  uniform float uAurErupt;                  // 0 quiet (green/teal + rose) → 1 full-color eruption (rare "wow")
  uniform vec3  uAurGreen, uAurGreenHot, uAurTeal, uAurRed, uAurPink, uAurViolet, uAurFringe;
  // column 557.7nm green / hot border green / high-alt teal / 630nm red crown / pink overlap / N2+ violet base / rose skirt
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
          float sAcross = dot(az, across);            // hoisted (reused by base tilt + the band field)
          // layer-0 broad fold, HOISTED (shared by base tilt + airglow + veil). The 6.4 octave is also
          // hoisted (its args never depended on L — it was a duplicated eval per layer). fine0 (12.8) is a
          // tier0-only fractal detail octave, funded by that de-duplication → net eval count unchanged.
          float fold0   = _aNoise(az * 2.3 + vec2(uAurPhase * 0.13, 0.0));
          float foldOct = _aNoise(az * 6.4 - vec2(uAurPhase * 0.11, 3.7));
          float fine0 = 0.0;
          if (uAurLayers == 2) fine0 = _aNoise(az * 12.8 + vec2(-uAurPhase * 0.19, 1.7));
          // GATE-7 band-warp field: 2D noise in (cross-stage, ELEVATION). The HEIGHT axis is the point —
          // a pure-azimuth warp shifts every ribbon identically (still parallel); a height-varying warp
          // bends each ribbon differently → S-curves, pinches, and (at extremes) forks. tier0 only.
          float bandWarp = 0.0;
          if (uAurLayers == 2) bandWarp = _aNoise(vec2(sAcross * 2.2 + 5.0, hy * 3.0 - uAurPhase * 0.045)) - 0.5;
          float rayCore = 1.0;   // main-arc ray structure, exported so the eruption color rides the LINES
          for (int L = 0; L < 2; L++) {
            if (L >= uAurLayers) break;
            // DRAPERY FOLDS: a broad crawling swell + a mid octave + fine fractal detail (single
            // frequency = smooth ruler edges; the octaves give hairpin folds + ragged filament edges).
            float fold = (L == 0) ? fold0 : _aNoise(az * 3.2 + vec2(uAurPhase * 0.13 + 7.1, 0.0));
            fold += 0.5 * (foldOct - 0.5) + 0.25 * (fine0 - 0.5);
            // THE LOWER BORDER: drops to the horizon at the arc FLANKS (envC→0 → base 0.04, plunges
            // below the sea-line at fold minima so the ends dive behind the world), clears the gate
            // rings at centre (envC→1 → ~0.09). Undulates per fold with a real amplitude.
            // + float(L)*(0.10 + 0.09*dot(az,across)): the secondary band's border rises DIAGONALLY (higher
            // on one flank) → a rising diagonal ribbon behind the arc, not a parallel copy.
            float h0 = 0.04 + 0.05 * envC + 0.11 * (fold - 0.5) + float(L) * (0.10 + 0.09 * sAcross);
            float u, sheet;
            if (L == 0) {
              // MAIN ARC (all tiers — the layer tier1/2 keeps): spans the forward hemisphere THROUGH
              // dead centre. u parameterises rays/warp only; a smoothstep envelope (not a gaussian)
              // gates the intensity, so the arc is ~130° wide with fold-driven bright knots.
              u = sAcross * 4.0 + (fold - 0.5) * 3.5;
              u += (hy - h0) * 1.5 * (fold - 0.5);                       // height shear → 3D drape
              // VALUE MODEL: a LOW 0.06 floor (keeps the Gate-3 continuous arc) with a steep pow curve —
              // fold minima drop ~5× darker → real dark-sky gaps BETWEEN curtains, not a flat mid wash.
              sheet = smoothstep(-0.35, 0.45, dot(az, uAurFwd)) * (0.06 + 0.94 * pow(smoothstep(0.30, 0.85, fold), 1.6));
            } else {
              // SECONDARY BAND (tier0 only): a BROAD diagonal ribbon crossing the arc obliquely (was a
              // thin pillar) — the sky's second thick parent band the rays descend from.
              vec2 axis = vec2(-uAurFwd2.y, uAurFwd2.x);
              u = dot(az, axis) * 3.0 + (fold - 0.5) * 3.5;
              u += (hy - h0) * 1.5 * (fold - 0.5);
              sheet = 0.85 * exp(-u * u * 2.0);                          // ~3× broader than the old pillar
            }
            // RAYS: fine vertical lines streaming UP from the bands (they are CHILDREN of the ribbons
            // below). Corona convergence — during an eruption the spacing dilates with altitude.
            u *= 1.0 - 0.25 * uAurErupt * max(hy, 0.0);
            float rn = _aNoise(vec2(u * 20.0 + fold * 4.0, uAurPhase * 0.7));   // calm spacing (rn², not hairline)
            float rr = rn * rn;                                                 // rn² — soft cores, not needles
            float rayShim = (0.30 + 0.85 * rr) * (0.88 + 0.12 * sin(uAurPhase * 2.6 + rn * 50.0));
            float ray = mix(1.0, rayShim, uAurRay);
            // THE BORDER: a crisp ONSET above it, a luminous ROSE SKIRT below it — never a hard zero.
            float body  = smoothstep(h0 - 0.02, h0 + 0.01, hy);
            float skirt = exp(min(hy - h0, 0.0) * 9.0);
            float below = max(body, 0.30 * skirt);
            // STAGGERED RAY HEIGHTS: bright rays climb higher, dim ones die sooner → individual lines.
            float tall = exp(-max(hy - h0, 0.0) * (5.5 - 2.0 * uAurAct));
            float rayTall = exp(-max(hy - h0, 0.0) * (2.0 + 6.5 * (1.0 - rn * rn)));
            tall = mix(tall, rayTall, 0.65 * uAurRay);
            float breath = 0.8 + 0.2 * uAurBreath;
            float I = sheet * ray * below * tall * breath;
            // IRREGULAR THICK RIBBONS: the bands the rays hang FROM, as level-sets of a WARPED field (NOT a
            // straight sawtooth — the owner: "too parallel"). Non-uniform SPACING (fold0 fans the period),
            // azimuth-varying TILT (foldOct curves each band along its length → S-curves), a height-varying
            // WARP (bandWarp) that bends ribbons apart and, at extremes, FORKS/merges them, and along-band
            // KNOTS (bn) that let a ribbon fade out mid-sky. Each ribbon keeps the crisp-bottom/soft-top edge.
            float bt = hy - h0;
            float warpL = bandWarp * ((L == 0) ? 1.0 : -0.8);       // opposite-sign per layer → bands cross at varied angles
            float bp = bt * (3.4 + 1.6 * (fold0 - 0.5))             // NON-UNIFORM spacing (period fans/crowds)
                     - (0.25 + 0.65 * foldOct) * sAcross            // AZIMUTH-VARYING tilt → arcs, not parallel
                     - 0.8 * (fold - 0.5)                           // the Gate-6 drape
                     + 1.0 * warpL                                  // THE PARALLEL-BREAKER (folds → forks/merges)
                     + 0.37 * float(L);                             // decorrelate the two layers' band phases
            float fp = fract(bp);
            float bn = 0.4 + 0.6 * foldOct;                         // tier1/2 fallback: free along-band variation
            if (uAurLayers == 2 && L == 0) bn = _aNoise(vec2(sAcross * 3.0 - uAurPhase * 0.04, bp * 0.8 + 11.0)); // knots ALONG the band
            float bprof = smoothstep(0.0, 0.08, fp) * exp(-fp * (2.9 - 1.5 * bn));   // knots are THICKER (slower top decay)
            float bands = 0.30 + 0.95 * bprof * (0.30 + 1.05 * bn * bn);             // bn² → a band FADES OUT along its length
            I *= mix(1.0, bands, smoothstep(0.04, 0.12, bt));                  // protect the hot border (bt < 0.04)
            // Export the MAIN-ARC structure → the eruption color rides the LINES + bands, not a flat wash.
            if (L == 0) rayCore = clamp((ray - 0.35) * 1.3, 0.0, 1.0) * tall;
            // THE HOT-LINE: a real border is 2–3× brighter than the diffuse column above it.
            float hot = exp(-max(hy - h0, 0.0) * 28.0);
            I *= 1.0 + 2.2 * hot * below;
            // THE ALTITUDE PHYSICS RAMP — FULL STRUCTURE (Gate-8): quiet = green + teal (unchanged). An
            // eruption adds THREE hybrid bands — violet-blue N2+ base, PINK overlap, 630nm crimson crown —
            // each a MIX (hue authority, saturates at erupt=1) + a small ADDITIVE (luminance parity so no
            // single hue monopolises — the old all-additive red did), windowed in v with soft OVERLAPS so
            // bottom→top reads violet→green→pink→crimson blended, not two colors. (per-ray v-stagger kept.)
            vec3 aCol = mix(uAurFringe, uAurGreen, smoothstep(h0 - 0.02, h0 + 0.005, hy));
            float v = clamp((hy - h0) * (2.6 - 1.0 * uAurAct) + (rn - 0.5) * 0.3 * uAurRay, 0.0, 1.0);
            aCol = mix(aCol, uAurTeal, 0.55 * smoothstep(0.15, 0.55, v));      // altitude cooling (always) — UNCHANGED
            float em = min(uAurErupt, 1.0);     // hue weight (mix) — saturates so hues never overshoot
            float ea = uAurErupt;               // glow weight (additive) — rides the dial past 1.0
            // VIOLET-BLUE BASE: the low column ABOVE the border (v < ~0.34), plus the old sub-border skirt.
            float baseB = max((1.0 - smoothstep(0.12, 0.34, v)) * body, 1.0 - body);
            aCol = mix(aCol, uAurViolet, 0.55 * baseB * em);
            aCol += uAurViolet * baseB * 0.18 * ea;
            // PINK OVERLAP: a PLATEAU band where green hands off to red (the old crown·(1-crown) capped at 0.25).
            float pinkB = smoothstep(0.30, 0.50, v) * (1.0 - smoothstep(0.55, 0.75, v));
            aCol = mix(aCol, uAurPink, 0.85 * pinkB * em);
            aCol += uAurPink * pinkB * 0.16 * ea;
            // CRIMSON CROWN: hue by MIX now (reads crimson, not just "the brightest thing") + a small glow.
            float crown = smoothstep(0.48, 0.92, v);
            aCol = mix(aCol, uAurRed, 0.75 * crown * em);
            aCol += uAurRed * crown * crown * 0.20 * ea;
            aCol = mix(aCol, uAurGreenHot, hot * below);                        // green border stays last (Gate-2)
            I *= 1.0 + 0.25 * crown * uAurErupt;                               // ray-top flare — unchanged
            // SPLIT GAIN: the diffuse column is capped LOW (0.55, never blooms) while the thin hot border
            // + crown reach 1.0 and cross the bloom threshold — the glow lives only in the concentrated cores.
            col += aCol * I * uAuroraMix * (0.55 + 0.45 * hot * below);
            // TRANSLUCENCY: stars are dimmed by local CORE brightness, not total column — optically-thin
            // gas, stars burn through the faint column + only vanish at the border/knots (the env.js splice
            // reads aurLum unchanged; only its MEANING changes here).
            aurLum += I * (0.25 + 0.75 * hot * below);
          }
          // BACK VEIL: a third, very faint, tall, ray-less curtain (reuses fold0 — free) → layered depth.
          // Contributes ~0 to aurLum so stars burn straight through it (doubles as the translucency showcase).
          float veil = smoothstep(0.55, 0.9, fold0) * exp(-max(hy - 0.20, 0.0) * 3.0)
                     * smoothstep(0.02, 0.25, hy) * (0.35 + 0.65 * envC);
          col += mix(uAurTeal, uAurRed, 0.3 * uAurErupt) * veil * 0.05 * uAuroraMix;
          // THE HORIZON AIRGLOW: the perspective-compressed distant oval the curtains RISE OUT OF.
          // Brightest AT the sea-line (abs(hy) → the last sliver above the silhouette is hottest, and
          // it meets its own mirror reflection at the seam), on-stage (envC), fold-broken. No new fetch.
          float hg = exp(-abs(hy) * 7.0) * (0.55 + 0.45 * fold0) * (0.35 + 0.65 * envC);
          // hue DRIFTS green↔rose per fold (a flat-green horizon band, doubled by the mirror sea, was the
          // monochrome-frame cause); lower gain so the doubled seam doesn't blow out; barely dims stars.
          col += mix(uAurGreen, uAurFringe, 0.5 - 0.5 * fold0) * hg * (0.06 + 0.05 * uAurAct) * uAuroraMix;
          aurLum += hg * 0.1;
          // ERUPTION COLOR TINT (rare "wow", with RESERVATION): a strong display breathes color into the
          // upper sky — but it RIDES THE RAYS (× rayCore) so it reads as colored LINES over dark starry sky,
          // NOT a solid magenta ceiling (the owner: "beauty in reservation"). Between the rays it's a whisper;
          // the steep decay stops it at mid-sky; stars burn through (the aurLum contribution is tiny).
          if (uAurErupt > 0.001) {
            float ebase  = exp(-abs(hy - 0.05) * 11.0) * envC * (0.35 + 0.65 * fold0);
            float ecrown = smoothstep(0.10, 0.30, hy) * exp(-max(hy - 0.32, 0.0) * 4.5) * envC * (0.5 + 0.5 * fold0);
            float ecR = ecrown * (0.10 + 0.90 * rayCore);   // the crown tint lives almost entirely ON the ray cores
            col += uAurViolet * ebase * uAurErupt * 0.04 * uAuroraMix;                                  // violet under-glow (cut 0.10→0.04)
            col += mix(uAurPink, uAurRed, smoothstep(0.20, 0.55, hy)) * ecR * uAurErupt * 0.08 * uAuroraMix; // ray-carried crown (cut 0.20→0.08)
            aurLum += (ebase + ecR) * uAurErupt * 0.03;                                                 // stars survive the peak (0.05→0.03)
          }
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
  uAurErupt:  { value: 0 },                          // eruption envelope (driven in JS from activity)
  uAurGreen:  { value: new THREE.Color(0x54ff86) },  // 557.7 nm atomic-oxygen green — the diffuse column
  uAurGreenHot: { value: new THREE.Color(0x86ff5c) },// hotter yellow-green for the bright border line
  uAurTeal:   { value: new THREE.Color(0x3ce6b8) },  // high-altitude cooling — quiet-mode second hue (always on)
  uAurRed:    { value: new THREE.Color(0xff4652) },  // 630 nm oxygen RED crown — brighter than green (additive)
  uAurPink:   { value: new THREE.Color(0xff7fae) },  // green×red overlap band — hotter/magenta so it reads at 50–85% mix over teal-green
  uAurViolet: { value: new THREE.Color(0x7a6bff) },  // N2+ violet-blue base — bluer/more saturated so it survives the green underneath
  uAurFringe: { value: new THREE.Color(0xd06a8a) },  // N2+ rose skirt — DESATURATED, not danger-magenta
};

let enabled = true;   // the biome channel gates it (env.auroraMix is 0 until a biome declares aurora)
let forced = false;   // ?aurora=1 — the PR-1 hero read, before the biome exists
let tier = 0;
let actOverride = null;   // ?auract=<0..1> debug: pin activity/eruption (for the quiet-vs-eruption montage)
export function setAuroraActOverride(v) { actOverride = (v == null || Number.isNaN(v)) ? null : v; }
let eruptOverride = null; // debug: pin uAurErupt DIRECTLY (bypasses the 0.45 peak cap) to compare eruption strengths
export function setAuroraEruptOverride(v) { eruptOverride = (v == null || Number.isNaN(v)) ? null : v; }
export function auroraEnabled() { return enabled; }
export function auroraForced() { return forced; }   // ?aurora=1 preview — gate the day-biome sun/god-rays off
export function auroraMix() { return auroraUniforms.uAuroraMix.value; }   // live curtain strength (real biome god-ray gate)
// Live envelopes for the ground-glow pulse + the tier2 water aurora sheen (no per-frame allocs).
export function auroraPulse() {
  return { mix: auroraUniforms.uAuroraMix.value, breath: auroraUniforms.uAurBreath.value,
           act: auroraUniforms.uAurAct.value, erupt: auroraUniforms.uAurErupt.value };
}
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
  // ACTIVITY + ERUPTION: two incommensurate sines drift the activity; above 0.72 an eruption blooms
  // (smoothstep-shaped) — full-color violet/pink/red for ~20–40s every few minutes at irregular intervals,
  // so quiet green/teal stretches make the rare eruption feel EARNED (the "wow"). `?auract=` overrides both.
  const actRaw = 0.5 + 0.5 * (0.62 * Math.sin(time * 0.05) + 0.38 * Math.sin(time * 0.0177 + 2.4));
  const act = actOverride == null ? actRaw : actOverride;
  auroraUniforms.uAurAct.value = act;
  const e = Math.max(0, (act - 0.72) / 0.28);
  // Peak 1.4 (owner pick) — a natural eruption shows the FULL altitude structure (violet→green→pink→
  // crimson, Gate-8); restraint comes from AREA + rarity (color rides the bands/rays, majority dark
  // between, ~30s every few min), NOT from deleting the hues. The single strength dial is this 1.4.
  auroraUniforms.uAurErupt.value = 1.4 * (e * e * (3.0 - 2.0 * e));
  if (eruptOverride != null) auroraUniforms.uAurErupt.value = eruptOverride;  // debug: pin the eruption strength
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
  // secondary BAND axis: forward rotated ~52°±20°, drifting — crosses the arc more obliquely (a diagonal band)
  const b = 0.90 + 0.35 * Math.sin(time * 0.021), cb = Math.cos(b), sb = Math.sin(b);
  auroraUniforms.uAurFwd2.value.set(wx * cb - wz * sb, wx * sb + wz * cb);
}
