import * as THREE from 'three';

// THE EMPYREAN — the inverted-sky nebula substrate (EMPYREAN-BIBLE.md §4a; research R2 consumed
// verbatim). Two colossal PASTEL nebula blooms spliced into the SAME single sky-dome draw as the
// clouds/aurora — branchless fragment math, NOT geometry and NOT additive shells (the overdraw law).
// Everything gates on uEmpyMix: 0 in every other biome → the whole splice is a dead-code no-op
// (byte-identical), so the shipped world is untouched until a biome declares `empy`.
//
// The anti-AI-slop cues that R2 says do 80% of the work, all present below:
//   • FILAMENT structure from a 4-octave DOMAIN-WARPED value-noise fBm (lacunarity 2, gain 0.5) —
//     never a smooth radial blob; 6+ octaves = dusty slop, 1 octave IS the blob.
//   • DIRECTIONAL COMBING: the noise domain is compressed along a per-bloom comb axis (~1:2.5) so
//     round cells shear into long wisps (the Pleiades combing). Isotropic fluff = the AI blob.
//   • CARVED dark lanes (a separate low-frequency field cutting thin meandering channels) with a
//     ONE-SIDED LIT RIM on the bright edge — a lane reads by SHAPE + rim, never by depth of darkness
//     (it only ever occludes to the pearl-grey 0xbfb6da floor). "Not multiply darker."
//   • SATURATION ∝ (1 − density): the brightest knots are the LEAST saturated (near white); the
//     core colours are hard-picked under S ≤ 0.30 with the core less saturated than the body.
//   • VALUE FLOOR: every bloom colour and the lane floor sit ≥ ~0.72 — even the "dark" dust is a
//     luminous pearl; contrast lives in HUE + STRUCTURE, never a dark value swing.
//   • BREATHING: each bloom's size + warp phase ride a ~90s sine, phase-offset per bloom.
//   • ZENITH GUARD: blooms fade out toward the zenith band so the zenith stop always wins the frame
//     (the Open-Dome law) and bloom cores stay a step BELOW the zenith (§3 ladder).

// GLSL spliced into the sky fragment BEFORE main() (self-contained noise + the two-bloom evaluator).
export const EMPY_HEAD = /* glsl */`
  uniform float uEmpyMix;    // 0 = off (byte-identical); >0 = the Empyrean nebula substrate
  uniform float uEmpyWarp;   // 1 = second-order domain warp (tier 0/1); 0 = first-order only (tier 2 cost drop — keeps all 4 octaves, softer wisps, same structure)
  float _eHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float _eVN(vec2 x){
    vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(_eHash(i), _eHash(i+vec2(1.0,0.0)), f.x),
               mix(_eHash(i+vec2(0.0,1.0)), _eHash(i+vec2(1.0,1.0)), f.x), f.y);
  }
  // 4-octave value-noise fBm, lacunarity 2.0 / gain 0.5, normalized to [0,1] (R2's sweet spot).
  float _eFbm(vec2 p){
    float a = 0.5, s = 0.0, n = 0.0;
    for (int i = 0; i < 4; i++){ s += a*_eVN(p); n += a; p = p*2.0 + vec2(11.7, 4.3); a *= 0.5; }
    return s / n;
  }
  // iq's nested domain warp: fbm(p + W·fbm(p + W·fbm(p))). The 2nd order is gated by uEmpyWarp so
  // tier 2 can drop to a single warp (the ORDER, never the octaves) if the taps bite on weak mobile.
  vec2 _eWarp(vec2 p, float W){
    vec2 q = vec2(_eFbm(p), _eFbm(p + vec2(5.2, 1.3)));
    vec2 base = p + W*q;                                   // first-order warp (always)
    vec2 r = vec2(_eFbm(base + vec2(1.7, 9.2)), _eFbm(base + vec2(8.3, 2.8)));
    return mix(base, base + W*r, uEmpyWarp);               // second-order only on tier 0/1
  }
  // One colossal pastel bloom. Returns (rgb, coverage). d = view dir, bc = bloom centre (unit),
  // sizeRad = angular radius (rad), combAng = comb-axis orientation, core/body = the S≤0.30 ramp,
  // ph = per-bloom phase, W = warp amplitude. Cheap-culled to its own sky cap.
  vec4 _empyBloom(vec3 d, vec3 bc, float sizeRad, float combAng, vec3 coreC, vec3 bodyC, float ph, float time, float W){
    float cosA = dot(d, bc);
    if (cosA < 0.15) return vec4(0.0);                     // the bloom only touches its own hemisphere cap
    // A stable tangent frame at the bloom centre, then gnomonic-ish tangent-plane coords (÷cosA keeps
    // the metric ~angular near the core so sizeRad reads in radians).
    vec3 up = abs(bc.y) < 0.95 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0);
    vec3 t0 = normalize(cross(up, bc));
    vec3 b0 = cross(bc, t0);
    vec2 pl = vec2(dot(d, t0), dot(d, b0)) / max(cosA, 0.3);
    float r = length(pl);                                  // angular radius from the core
    // Breathing: size + warp phase on a ~90s sine (2π/90 ≈ 0.0698 rad/s), offset per bloom.
    float breathe = sin(time*0.0698 + ph);
    float sz = sizeRad * (1.0 + 0.06*breathe);
    // Directional combing: rotate into the comb frame and COMPRESS along it → features ~2.5× longer
    // along the comb axis than across it (the 1:2.5 anisotropy that shears cells into wisps).
    float cc = cos(combAng), ss = sin(combAng);
    vec2 pr = vec2(cc*pl.x + ss*pl.y, -ss*pl.x + cc*pl.y);
    pr.x *= 0.40;
    // Domain-warped filament field. The warp phase drifts with the breath (weather, not a pulse).
    vec2 wp = _eWarp(pr*3.4 + vec2(ph*3.1 + 0.12*breathe, ph*1.7), W);
    float n = _eFbm(wp);                                   // [0,1] filamentary density
    n = smoothstep(0.28, 0.82, n);                         // sharpen into DEFINED wisps (knots + gaps) so the structure reads on the bright sky — contrast lives in hue + STRUCTURE, never a dark value swing
    // Radius PERTURBED by a low-octave read so there is no clean ring, no clean centre.
    float rp = r + (_eFbm(pr*1.2 + vec2(19.0, 7.0)) - 0.5) * sz * 0.35;
    float fall = smoothstep(sz*1.35, sz*0.10, rp);         // soft radial falloff (1 core → 0 edge)
    float dens = fall * (0.42 + 0.58*n);                   // luminous floor + strong structure weight so the wisps read as filaments, not a flat wash
    // CARVED lanes — a separate low-frequency warped field; a thin isoline band cuts meandering
    // channels. One-sided lit rim: the same field sampled a hair toward the bright side reads brighter
    // just OUTSIDE the cut → the shock-front rim that sells dust-in-front-of-light.
    vec2 lp = _eWarp(pr*0.85 + vec2(37.0, 12.0), W*0.6);
    float lane = _eFbm(lp);
    float cut = smoothstep(0.44, 0.47, lane) * (1.0 - smoothstep(0.50, 0.55, lane));   // thin channel
    float rim = smoothstep(0.50, 0.52, lane) * (1.0 - smoothstep(0.52, 0.56, lane));   // lit band on the bright edge
    // Colour: core (whiter, LESS saturated) fills the dense knots; the body/wisps carry the hue.
    vec3 bcol = mix(bodyC, coreC, smoothstep(0.34, 0.92, dens));
    bcol = mix(bcol, vec3(0.749, 0.714, 0.855), cut * 0.55 * fall);   // occlude only to the 0xbfb6da pearl-grey floor
    bcol += vec3(0.045, 0.040, 0.052) * rim * fall;                   // one-sided pearl lit rim
    float cov = dens * (1.0 - cut * 0.35);
    return vec4(bcol, clamp(cov, 0.0, 1.0));
  }`;

// GLSL spliced INTO main(), AFTER the dual-fog sink and BEFORE the clouds/sun (so the blooms sit ON
// the inverted gradient; the killed sun + the reshaped stars draw over them). `d`,`h`,`col`,`time`
// are already in scope. uEmpyMix 0 → the whole block is `mix(col, x, 0)` = byte-identical.
export const EMPY_BODY = /* glsl */`
        if (uEmpyMix > 0.0001) {
          // Rose bloom: colossal (~40°), low-central ahead. Orchid: smaller (~28°), higher-central ahead.
          // Both sit in the forward frustum so they READ at cruise (not just when the camera banks up);
          // cores stay BELOW the zenith stop (§3) and the zenith guard keeps blooms out of the bright pole.
          // Warp held ~1.0–1.1 (a heavier second-order warp scattered the dense knot until the pastel
          // washed out on the bright sky — the filaments must hold together to read).
          vec4 _eb1 = _empyBloom(d, normalize(vec3( 0.30, 0.22, -1.00)), 0.80,  0.70,
                                 vec3(0.965, 0.862, 0.910), vec3(0.950, 0.675, 0.812), 0.0, time, 1.1);   // rose  (body S≈0.29, at the cap)
          vec4 _eb2 = _empyBloom(d, normalize(vec3(-0.36, 0.52, -0.92)), 0.52, -1.10,
                                 vec3(0.790, 0.735, 0.945), vec3(0.700, 0.612, 0.912), 2.3, time, 1.0);   // orchid (body S≈0.33→ hue reads violet against the neutral sky)
          float _eZen = 1.0 - smoothstep(0.74, 0.96, h);   // no bloom contests the zenith band (the zenith always wins)
          float _eOp = 1.0 * uEmpyMix * _eZen;
          col = mix(col, _eb1.rgb, _eb1.a * _eOp);
          col = mix(col, _eb2.rgb, _eb2.a * _eOp);
        }`;

// Shared sky uniforms (spread into the sky material). uEmpyMix 0 = shipped (byte-identical).
export const empyUniforms = {
  uEmpyMix:  { value: 0 },
  uEmpyWarp: { value: 1 },   // second-order warp on (tier 0/1); setEmpyreanQuality drops it on tier 2
};

let tier = 0;
export function setEmpyreanQuality(t) {
  tier = t;
  // Drop the SECOND-ORDER warp on tier 2 (keeps all 4 octaves — never the airbrushed 1-octave blob).
  empyUniforms.uEmpyWarp.value = t >= 2 ? 0 : 1;
}
export function empyreanTier() { return tier; }

// Per-frame write from the lerped biome env (mirrors applyAurora/applySkyClouds). mix 0 → the splice
// is a no-op, so every non-Empyrean biome + all flight stays byte-identical.
export function applyEmpyrean(env) {
  empyUniforms.uEmpyMix.value = env.empyMix || 0;
}
