import * as THREE from 'three';
import { getActiveDetail } from './modelDetail.js';

// Composable, asset-free surface-detail SHADER patches for creature materials.
//
// This is the "SurfaceShader" system of the creature framework: a small library
// of MeshStandardMaterial fragment/vertex patches (fresnel rim, cellular scales,
// iridescence, membrane subsurface) that COMPOSE — many patches on one material
// through ONE onBeforeCompile and ONE merged program-cache key. It generalises
// the single hand-rolled rim in surface.js (which overwrote onBeforeCompile and
// hard-set customProgramCacheKey, so it could never stack) into a system every
// current and future creature opts into by name via its blueprint
// (`def.parts.surface.shader = ['cellularScales','iridescence', ...]`).
//
// All patches splice at the same two seams the rim already proved safe:
//   • pars  → after `#include <common>`            (uniform + helper declarations)
//   • body  → after `#include <emissivemap_fragment>` (adds to totalEmissiveRadiance /
//             tweaks roughnessFactor; `normal` + `vViewPosition` are in view space here)
// so they tone-map with ACES and need no UVs (works on the UV-less torso loft).
//
// A patch is a plain descriptor: { key, uniforms, parsFrag, bodyFrag, parsVert?, bodyVert? }.

const toColor = (v) => (v instanceof THREE.Color ? v : new THREE.Color(v));

// --- Patches ----------------------------------------------------------------

// Grazing-angle rim light — the exact effect surface.js shipped, now a patch so
// it stacks with the others instead of being a terminal onBeforeCompile.
export function fresnelRimPatch(colorHex, opts = {}) {
  return {
    key: 'rim',
    uniforms: {
      uRimColor: toColor(colorHex),
      uRimIntensity: opts.intensity ?? 0.42,
      uRimPower: opts.power ?? 2.6,
      uRimBias: opts.bias ?? 0.04,
    },
    parsFrag: `uniform vec3 uRimColor; uniform float uRimIntensity; uniform float uRimPower; uniform float uRimBias;`,
    bodyFrag: `{
      float vDotN = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
      float fres = pow(1.0 - vDotN, uRimPower);
      totalEmissiveRadiance += uRimColor * (fres * uRimIntensity + uRimBias);
    }`,
  };
}

// Thin-film IRIDESCENCE — a cheap, view-angle hue sweep (roll-your-own; we avoid
// MeshPhysicalMaterial.iridescence which is per-pixel expensive on mobile). The
// hue cycles with the fresnel term so the creature flashes colour as it banks.
export function iridescencePatch(opts = {}) {
  return {
    key: 'irid',
    uniforms: {
      uIridStrength: opts.strength ?? 0.22,
      uIridPower: opts.power ?? 2.0,
      uIridShift: opts.shift ?? 1.3,
      uIridTint: toColor(opts.tint ?? 0xffffff),
    },
    parsFrag: `uniform float uIridStrength; uniform float uIridPower; uniform float uIridShift; uniform vec3 uIridTint;`,
    bodyFrag: `{
      float vDotN = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
      float f = pow(1.0 - vDotN, uIridPower);
      vec3 hue = 0.5 + 0.5 * cos(6.28318 * (uIridShift * f + vec3(0.0, 0.33, 0.67)));
      totalEmissiveRadiance += hue * uIridTint * (f * uIridStrength);
    }`,
  };
}

// Membrane SUBSURFACE — a two-sided edge glow that fakes light passing through a
// thin translucent surface (wing membranes, fins). Brightest where the surface
// is edge-on to the camera, tinted warm. Cheap (one fresnel, no extra pass).
export function membraneSSSPatch(opts = {}) {
  return {
    key: 'sss',
    uniforms: {
      uSSSColor: toColor(opts.color ?? 0xff9a66),
      uSSSStrength: opts.strength ?? 0.3,
      uSSSPower: opts.power ?? 1.6,
    },
    parsFrag: `uniform vec3 uSSSColor; uniform float uSSSStrength; uniform float uSSSPower;`,
    bodyFrag: `{
      float edge = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), uSSSPower);
      totalEmissiveRadiance += uSSSColor * (edge * uSSSStrength);
    }`,
  };
}

// ─── MEMBRANE TRANSMISSION (wing-lab 90-SYNTHESIS §6.2) ──────────────────────
// The physically-shaped replacement for `membraneSSSPatch` above. That one is a
// view-only Fresnel: it fires identically with the sun in the camera's face and
// behind the wing, which is the chrome-outline tell (§12 kill #32/#33) and cannot
// produce a thickness ramp. This one is Barré-Brisebois/Frostbite back-translucency
// driven by a per-vertex optical thickness, so ONE term produces the whole read:
//
//   d_eff = d_geo / max(|N·V|, 0.08)          view-slanted optical path
//   T_rgb = exp(-sigma_rgb * d_eff)           sigma ratio LOCKED (1.00, 2.68, 5.41)
//   out  += sunColor * T * (back(V,L) * scale + ambient * wrap)
//
// Three properties fall out for free and they are the whole gate:
//  1. LIGHT-DIRECTION DEPENDENT — `back` is ~0 with the sun in front, ~1 with the sun
//     behind, so the membrane:bone value polarity FLIPS on every bank.
//  2. ANTI-CHROME BY CONSTRUCTION — d_eff grows as 1/|N·V|, so transmission goes to
//     ZERO exactly where a Fresnel rim peaks. The silhouette edge is the darkest
//     part of the sheet; a continuous bright rim is not reachable from this term.
//  3. THICKNESS IS THE COLOUR RAMP — sigma's locked RGB ratio is skin's measured
//     diffuse-mean-free-path ratio (1 : 0.373 : 0.185), so exp() walks
//     #D19554 -> #AB5415 -> #711600 -> #2E0000 as d goes 0.45 -> 0.9 -> 1.8 -> 3.6.
//     Hue rotates to red and saturation RISES with thickness; the deepest cup is the
//     DARKEST backlit tier. Do not add a second tint that fights it — `uMemTint`
//     stays near white and the exponential does the colouring.
//
// The per-vertex payload is ONE vec4 attribute `aMem`:
//   .x span fraction u (0 at the body midline, 1 at the fingertip)   — the field UV
//   .y atlas chord v (per-surface band; see the wing builder's atlas)  — the field UV
//   .z d_geo, the optical thickness in [0.30, 3.60] (nominal 0.90)
//   .w free-edge mask, 1 on the hem's outer edge — the ONLY place the Fresnel survives
//
// `uMemField` is a generated R8 DataTexture (never CanvasTexture — that breaks the
// node tests) carrying the cord field + the vein doublets as a multiplier on d.
// Veins modulate THICKNESS, never emissive: backlit they are dark subtractions from
// the glow (§12 kill #34), front-lit they all but vanish.
export function membraneTransmissionPatch(opts = {}) {
  return {
    key: 'memT',
    uniforms: {
      // LOCKED ratio (A2 §2.2, skin1 DMFP 3.67/1.37/0.68 mm -> 1 : 0.373 : 0.185).
      // sigma0 = 1.0 is the tuned scalar: at nominal d = 0.90 it transmits
      // (0.407, 0.090, 0.008) linear = luminance 0.151 — the measured bat-wing 0.15.
      uMemSigma: new THREE.Vector3(1.00, 2.68, 5.41),
      uMemSigma0: opts.sigma0 ?? 1.0,
      uMemTint: toColor(opts.tint ?? 0xffffff),
      uMemScale: opts.scale ?? 1.0,
      uMemPower: opts.power ?? 3.0,
      uMemDistort: opts.distort ?? 0.20,
      uMemAmbient: opts.ambient ?? 0.03,
      uMemField: opts.field ?? null,
      uMemFieldAmt: opts.fieldAmt ?? 1.0,
      // §6.4 wrinkles: spanwise striations, amplitude is a TENSION read-out. I2 authors
      // the cruise static; I4 binds `uMemSlack` to the flap solver's slack scalar.
      uMemWrinkleAmp: opts.wrinkleAmp ?? 0.30,
      uMemWrinkleFreq: opts.wrinkleFreq ?? 20.0,
      uMemSlack: opts.slack ?? 0.55,
      // the fine cord field: 1/75 of local chord (§13's directed 20 mm-equivalent).
      uMemCord: opts.cord ?? 0.34,
      uMemCordFreq: opts.cordFreq ?? 147.0,
      // §6.3 the demoted Fresnel — hem band only, broken by a span hash, duty <= 0.60.
      uMemFringe: opts.fringe ?? 0.30,
      uMemFringeColor: toColor(opts.fringeColor ?? 0xffcf9a),
      // THE SPECULAR, authored (see bodyFragMaterial). F0 0.020 is IOR 1.33 — a wet
      // membrane — where three.js's untouched 0.04 is IOR 1.5, i.e. glass.
      uMemSpec: toColor(opts.specTint ?? 0xffd9b0),
      uMemSpecMul: opts.spec ?? 0.50,
      uMemSpecF90: opts.specF90 ?? 0.30,
    },
    parsVert: `attribute vec4 aMem; varying vec4 vMem;`,
    bodyVert: `vMem = aMem;`,
    parsFrag: `
      uniform vec3 uMemSigma; uniform float uMemSigma0; uniform vec3 uMemTint;
      uniform float uMemScale; uniform float uMemPower; uniform float uMemDistort; uniform float uMemAmbient;
      uniform sampler2D uMemField; uniform float uMemFieldAmt;
      uniform float uMemWrinkleAmp; uniform float uMemWrinkleFreq; uniform float uMemSlack;
      uniform float uMemCord; uniform float uMemCordFreq;
      uniform float uMemFringe; uniform vec3 uMemFringeColor;
      uniform vec3 uMemSpec; uniform float uMemSpecMul; uniform float uMemSpecF90;
      varying vec4 vMem;`,
    bodyFrag: `{
      vec3 _mN = normalize(normal);
      vec3 _mV = normalize(vViewPosition);
      // §6.4 cords + vein doublets: the generated field multiplies the optical path.
      // Byte 0..255 decodes to 0.55..2.75 (nominal 1.0 at byte 52).
      float _mF = mix(1.0, 0.55 + texture2D(uMemField, vMem.xy).r * 2.20, uMemFieldAmt);
      // …and the FINE cord field (1/75 of local chord) analytically, because 256 texels
      // cannot carry 75 lines per chord. fwidth() fades it to flat tint the moment a
      // period drops under a pixel, so it resolves as lines at the 4× crop and never
      // shimmers at the chase read (A2's Murray cut-off law, in one smoothstep).
      float _mCp = vMem.y * uMemCordFreq * 6.2831853;
      float _mCd = clamp((vMem.x - 0.30) / 0.35, 0.0, 1.0);          // zero inboard, full outboard
      _mF *= 1.0 + uMemCord * _mCd * (1.0 - smoothstep(0.8, 2.4, fwidth(_mCp)))
                 * pow(max(sin(_mCp), 0.0), 6.0);
      // §6.4 wrinkles — spanwise striations across the chord, fwidth-faded so a period
      // narrower than a pixel becomes TINT, never shader shimmer.
      float _mP = vMem.y * uMemWrinkleFreq * 6.2831853;
      float _mW = 1.0 + uMemWrinkleAmp * uMemSlack * sin(_mP)
                * (1.0 - smoothstep(1.1, 3.0, fwidth(_mP)));
      float _md = clamp(vMem.z * _mF * _mW, 0.30, 3.60);
      float _mNV = max(abs(dot(_mN, _mV)), 0.08);
      vec3 _mT = exp(-uMemSigma * (uMemSigma0 * _md / _mNV));
      #if NUM_DIR_LIGHTS > 0
        vec3 _mL = directionalLights[0].direction;                 // fragment -> light, view space
        vec3 _mLt = normalize(-(_mL + _mN * uMemDistort));         // Frostbite "through" vector
        float _mBack = pow(clamp(dot(_mV, _mLt), 0.0, 1.0), uMemPower);
        float _mWrap = clamp(dot(_mN, _mL) * 0.5 + 0.5, 0.0, 1.0);
        totalEmissiveRadiance += directionalLights[0].color * uMemTint * _mT
                               * (_mBack * uMemScale + uMemAmbient * _mWrap);
      #endif
      // §6.3: the Fresnel, demoted to hair-sparkle on the free hem. Broken by a
      // deterministic span hash at 55% duty so it can never close into a rim.
      float _mH = fract(sin(floor(vMem.x * 190.0) * 78.233 + 2.7) * 43758.5453);
      totalEmissiveRadiance += uMemFringeColor
        * (vMem.w * step(0.45, _mH) * pow(1.0 - _mNV, 5.0) * uMemFringe);
    }`,
    // THE MEASURED FIX FOR THE BLUE SHEEN. Round 1 logged a broad blue rim-light sheen
    // across the ventral hand; a roughness sweep on the masked pixels proved it is
    // entirely SPECULAR (worst 16px tile B−R: 0.111 at roughness 0.50, 0.016 at 1.00,
    // and unchanged by albedo, envMapIntensity or the transmission term). A dielectric's
    // specular carries the LIGHT's colour, so no amount of warm near-black albedo can
    // remove a cool key's reflection — and roughness 1.0 is the leather-tarp tell (kill
    // #22). The lever that is left is the specular response itself:
    //   • F0  → 0.020: three.js hard-codes 0.04 (IOR 1.5, glass/plastic). A wet keratin
    //     membrane is IOR ≈ 1.33, F0 = ((1.33−1)/(1.33+1))² = 0.0201. This is a
    //     CORRECTION, not a cheat, and it halves the sheen at every angle.
    //   • F90 → 0.30: the horizon fade. Single-scatter GGX assumes F90 = 1, which is
    //     exactly what turns a rough dark dielectric into chrome at grazing — the same
    //     term §12 kill #33 forbids. Damping it is the standard specular-occlusion
    //     approximation and it kills the wide-angle lobe without touching the sebum
    //     highlight the membrane is supposed to keep at roughness 0.38–0.50.
    //   • a warm tint on what remains, so the surviving gloss is the wing's own hue.
    bodyFragMaterial: `
      material.specularColor *= uMemSpec * uMemSpecMul;
      material.specularF90 = uMemSpecF90;`,
  };
}

// ─── WING FIRE (wing-lab 90-SYNTHESIS §7) ────────────────────────────────────
// The forge window + the artery members of the vein doublets + the recruited
// secondary/outer panes, all on ONE material and ONE draw per rig group. Three
// things have to be true at once and a plain emissive material can do none of them:
//
//  1. HARD BORDERS IN EVERY STATE (§7.1, kill #43). Windows APPEAR and DISAPPEAR;
//     they never fade in. So the state test is a `step()` on a per-VERTEX stage
//     threshold, and every triangle carries ONE stage on all three of its verts
//     (the geometry is non-indexed, so a border is a discontinuity, not a ramp).
//  2. RECRUITMENT, ROOT-FIRST (§7.1 / kill #44). `uFireStage` 0..3 is cold /
//     cruise / power / ignition; a vertex lights when its own threshold is reached.
//     Zone A's rim is stage 0, its core stage 1, the proximal arteries stage 1, the
//     distal arteries + mid-panel windows stage 2, the outer recruit stage 3.
//  3. THREE INCOMMENSURATE RHYTHMS (§7.2, kill #50). Window flicker 2.35 Hz (+ a
//     3.71 Hz partial), artery throb 0.43 Hz — neither a rational multiple of the
//     other or of the ~1.2 Hz flap, so the composite never visibly repeats and
//     nothing pulses in flap time. The artery throb DAMPS to steady-and-brighter
//     under load (`uFireLoad`) — the sourced counter-intuitive tell (F1 B5).
//
// The temperature ramp is a per-vertex COLOUR multiplier, so one material carries
// 1200–1300 °C window core, 900–1100 °C proximal artery and 650–800 °C artery tip.
// The authored emitter is deep ORANGE and the core is made white by ACES, never by
// authoring white (§7.1 / kill #48): with R ≫ G ≫ B in, the tone-mapper walks the
// core to (1.00, 0.70, 0.27)-class on its own and R ≥ G ≥ B survives at every value.
//
// `aFire` per vertex: .x stage threshold · .y rhythm select (0 window, 1 artery)
//                     .z phase seed · .w spare (authored value, kept for the dump)
export function wingFirePatch(opts = {}) {
  return {
    key: 'wfire',
    uniforms: {
      uFireStage: opts.stage ?? 1,
      uFireGain: opts.gain ?? 1.0,
      uFireLoad: opts.load ?? 0.0,
      uFireTime: opts.time ?? 0,
    },
    parsVert: `attribute vec4 aFire; varying vec4 vFire;`,
    bodyVert: `vFire = aFire;`,
    parsFrag: `uniform float uFireStage; uniform float uFireGain; uniform float uFireLoad;
      uniform float uFireTime; varying vec4 vFire;`,
    bodyFrag: `{
      float _fOn = step(vFire.x, uFireStage + 0.25);          // hard border — never a fade
      float _fPh = vFire.z * 6.2831853;
      float _fFlick = 1.0 + 0.17 * sin(uFireTime * 14.765 + _fPh)
                          + 0.10 * sin(uFireTime * 23.310 + _fPh * 2.7);   // 2.35 + 3.71 Hz
      float _fThrob = 1.0 + (1.0 - uFireLoad) * 0.30 * sin(uFireTime * 2.702 + _fPh)
                          + uFireLoad * 0.22;                              // 0.43 Hz, damps under load
      totalEmissiveRadiance *= vColor * (_fOn * uFireGain * mix(_fFlick, _fThrob, vFire.y));
    }`,
    // A radiator does not REFLECT. three.js gives every dielectric F0 = 0.04, which
    // paints the cool key light onto a black pane and leaves a grey ghost exactly
    // where a switched-OFF window is supposed to be invisible — and a ghost makes the
    // "emissive fraction" probe unmeasurable, because an off pane stops reading zero.
    bodyFragMaterial: `
      material.specularColor = vec3(0.0);
      material.specularF90 = 0.0;`,
  };
}

// ─── WING EMBERS (§7.5) ──────────────────────────────────────────────────────
// A GPU-resident ember shed: the whole pool is one mesh, one draw, and its life
// cycle is a function of `uEmbTime` — so it is deterministic for capture (pin the
// clock, get the same frame) and costs zero CPU per frame.
//
// Three sourced properties the shipped round-sprite ember does not have:
//  • RODS at 10–13:1 aligned to the relative wind, not billboarded dots (built as a
//    thin cross section so the rod reads from above AND from the side),
//  • TWO-TONE ALONG THE ROD — windward amber, lee deep red (`aEmb.w` is the along-rod
//    coordinate and the vertex colour carries the two ends),
//  • a NON-MONOTONIC life ramp: +25% brightness through the first 15% of life as the
//    slipstream fans the ember, and only then the decay. Every shipped ember system
//    in this repo fades monotonically from spawn (§12 kill #50).
//
// `aEmb`: .x phase seed · .y rate (1/lifetime) · .z travel distance · .w along-rod 0..1
export function wingEmberPatch(opts = {}) {
  return {
    key: 'wemb',
    uniforms: {
      uEmbTime: opts.time ?? 0,
      uEmbGain: opts.gain ?? 1.0,
      uEmbStage: opts.stage ?? 1,
      uEmbWind: opts.wind ?? new THREE.Vector3(0.05, 0.44, 1.0),
    },
    // `aEmb.x` carries BOTH the recruitment stage (integer part) and the phase seed
    // (fractional part) — the life cycle only ever reads the fraction, so a staged
    // ember costs no second attribute. Rods withheld until the power stroke let the
    // pool sit inside the 24–40 cruise budget and still reach the burst band.
    parsVert: `attribute vec4 aEmb; varying vec2 vEmb;
      uniform float uEmbTime; uniform vec3 uEmbWind;`,
    bodyVert: `
      float _eL = fract(uEmbTime * aEmb.y + aEmb.x);
      transformed += uEmbWind * (_eL * aEmb.z);
      transformed.x += sin(_eL * 8.4 + aEmb.x * 37.7) * aEmb.z * 0.09;   // slipstream wander
      vEmb = vec2(_eL, floor(aEmb.x));`,
    parsFrag: `varying vec2 vEmb; uniform float uEmbGain; uniform float uEmbStage;`,
    bodyFrag: `{
      float _eL = vEmb.x;
      float _eB = _eL < 0.15 ? mix(0.40, 1.25, _eL / 0.15)
                             : 1.25 * pow(max(0.0, 1.0 - (_eL - 0.15) / 0.85), 1.7);
      _eB *= step(vEmb.y, uEmbStage + 0.25);
      totalEmissiveRadiance *= vColor * (_eB * uEmbGain);
    }`,
    bodyFragMaterial: `
      material.specularColor = vec3(0.0);
      material.specularF90 = 0.0;`,
  };
}

// Procedural cellular SCALES — a 3D Worley pattern in OBJECT space (stable on the
// creature as it flies; per-mesh, hidden by the busy pattern) that darkens scale
// centres, brightens the inter-scale seams (sheen), and roughens the centres so
// the body stops reading as one smooth blob. v1 modulates emissive + roughness
// only (no normal perturbation) for guaranteed-stable lighting; normal-perturbed
// scales are a documented v2 on top of this same patch.
export function cellularScalesPatch(opts = {}) {
  return {
    key: 'scales',
    uniforms: {
      uScaleSize: opts.size ?? 7.0,
      uScaleSheen: opts.sheen ?? 0.10,
      uScaleRough: opts.rough ?? 0.22,
      uScaleTint: toColor(opts.tint ?? 0xffffff),
    },
    parsVert: `varying vec3 vSurfPos;`,
    bodyVert: `vSurfPos = position;`,
    parsFrag: `varying vec3 vSurfPos;
      uniform float uScaleSize; uniform float uScaleSheen; uniform float uScaleRough; uniform vec3 uScaleTint;
      vec3 _scHash(vec3 p){
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return fract(sin(p) * 43758.5453);
      }
      // nearest-feature (Worley F1) distance, ~0 at a scale centre → ~1 at a seam.
      float _scCell(vec3 x){
        vec3 i = floor(x); vec3 f = fract(x); float d = 1.0;
        for (int a = -1; a <= 1; a++)
        for (int b = -1; b <= 1; b++)
        for (int c = -1; c <= 1; c++) {
          vec3 g = vec3(float(a), float(b), float(c));
          vec3 o = _scHash(i + g);
          d = min(d, length(g + o - f));
        }
        return clamp(d, 0.0, 1.0);
      }`,
    bodyFrag: `{
      float cell = _scCell(vSurfPos * uScaleSize);
      float seam = smoothstep(0.35, 0.9, cell);          // bright inter-scale ridges
      totalEmissiveRadiance += uScaleTint * (seam * uScaleSheen);
      roughnessFactor = clamp(roughnessFactor + (0.5 - cell) * uScaleRough, 0.04, 1.0);
    }`,
  };
}

// Procedural cellular SCALES v2 — the documented normal-perturbed upgrade. Same
// object-space Worley field as v1 (emissive sheen + roughness), PLUS a derivative-
// based micro-relief that perturbs the shading `normal` with NO UVs / tangents, so
// the scales actually CATCH LIGHT and reveal form instead of only shimmering — the
// black hide stops collapsing to a flat dark mass under rim/key light. The relief
// modifies `normal` at the same seam v1 uses (after <emissivemap_fragment>, before
// <lights_fragment_begin>, where `normal` is still the live lighting normal).
// SUPERSEDES cellularScalesPatch — opt in via 'cellularScalesNormal' INSTEAD of
// 'cellularScales' (never stack both, or the shared Worley/vSurfPos declarations
// collide). Amplitude is tier-gated by the caller (low on Obsidian → stealth stays
// sleek; stronger on ULTRA / on Ember/Jade/Pearl later).
export function cellularScalesNormalPatch(opts = {}) {
  return {
    key: 'scalesN',
    uniforms: {
      uScaleSize: opts.size ?? 7.0,
      uScaleSheen: opts.sheen ?? 0.10,
      uScaleRough: opts.rough ?? 0.22,
      uScaleTint: toColor(opts.tint ?? 0xffffff),
      uScaleNrmAmp: opts.amp ?? 0.3,
    },
    parsVert: `varying vec3 vSurfPos;`,
    bodyVert: `vSurfPos = position;`,
    parsFrag: `varying vec3 vSurfPos;
      uniform float uScaleSize; uniform float uScaleSheen; uniform float uScaleRough; uniform vec3 uScaleTint;
      uniform float uScaleNrmAmp;
      vec3 _scHash(vec3 p){
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return fract(sin(p) * 43758.5453);
      }
      float _scCell(vec3 x){
        vec3 i = floor(x); vec3 f = fract(x); float d = 1.0;
        for (int a = -1; a <= 1; a++)
        for (int b = -1; b <= 1; b++)
        for (int c = -1; c <= 1; c++) {
          vec3 g = vec3(float(a), float(b), float(c));
          vec3 o = _scHash(i + g);
          d = min(d, length(g + o - f));
        }
        return clamp(d, 0.0, 1.0);
      }
      // Mikkelsen-style derivative bump: perturb the view-space normal from the
      // screen-space gradient of a procedural height field — no tangents / UVs.
      vec3 _scPerturbNormal(vec3 surfPos, vec3 N, vec2 dHdxy){
        vec3 sx = dFdx(surfPos); vec3 sy = dFdy(surfPos);
        vec3 R1 = cross(sy, N); vec3 R2 = cross(N, sx);
        float det = dot(sx, R1);
        if (abs(det) < 1e-7) return N;       // degenerate derivatives → leave normal be
        vec3 grad = sign(det) * (dHdxy.x * R1 + dHdxy.y * R2);
        return normalize(abs(det) * N - grad);
      }`,
    bodyFrag: `{
      float cell = _scCell(vSurfPos * uScaleSize);
      float seam = smoothstep(0.35, 0.9, cell);
      totalEmissiveRadiance += uScaleTint * (seam * uScaleSheen);
      roughnessFactor = clamp(roughnessFactor + (0.5 - cell) * uScaleRough, 0.04, 1.0);
      // v2 micro-relief: raised scale centres, recessed seams → real form under light.
      float _scH = 1.0 - smoothstep(0.0, 0.55, cell);
      vec2 _scdH = vec2(dFdx(_scH), dFdy(_scH)) * uScaleNrmAmp;
      normal = _scPerturbNormal(-vViewPosition, normalize(normal), _scdH);
    }`,
  };
}

// The closed set of surface-shader names a blueprint may declare in
// `parts.surface.shader`. Kept beside buildSurfacePatches (the only consumer) so
// the creature grammar/validator can't drift from what's actually buildable.
export const SURFACE_PATCH_NAMES = Object.freeze([
  'cellularScales', 'cellularScalesNormal', 'iridescence', 'subsurface', 'membraneSSS',
]);

// Map blueprint shader NAMES → patch descriptors, tinted on-brand from the def.
export function buildSurfacePatches(names, def) {
  const out = [];
  for (const n of names || []) {
    // Coarser, more present scales (lower size = bigger cells → reads at the
    // chase-cam distance) and a stronger iridescent sweep, so an opted-in hero
    // clearly shimmers without blowing out under bloom.
    if (n === 'cellularScales') out.push(cellularScalesPatch({ tint: def.scales ?? 0xffffff, size: 5.0, sheen: 0.16, rough: 0.28 }));
    // v2 normal-detail scales (real micro-relief). amp tier-gated by the active
    // detail level (LOW 0.62× → ULTRA 1.6×); per-dragon via `def.scaleRelief`
    // (default LOW so Obsidian stays sleek). Use INSTEAD of 'cellularScales'.
    else if (n === 'cellularScalesNormal') out.push(cellularScalesNormalPatch({ tint: def.scales ?? 0xffffff, size: def.scaleSize ?? 5.0, sheen: 0.16, rough: 0.28, amp: (def.scaleRelief ?? 0.3) * getActiveDetail().mul }));
    else if (n === 'iridescence') out.push(iridescencePatch({ tint: def.apexSeam ?? def.wingEmissive ?? 0xffffff, strength: 0.32, power: 1.8 }));
    else if (n === 'subsurface' || n === 'membraneSSS') out.push(membraneSSSPatch({ color: def.wingEmissive ?? def.apexSeam ?? 0xff9a66 }));
  }
  return out;
}

// --- Compose ----------------------------------------------------------------
// Apply N patches to one material through a single onBeforeCompile + a single
// merged customProgramCacheKey (so stacked variants never collide in Three's
// program cache, and an un-patched MeshStandard stays distinct).
export function composeSurface(material, patches) {
  const used = (patches || []).filter(Boolean);
  if (!used.length) return material;
  const cacheKey = 'surf:' + used.map((p) => p.key).join('+');
  // Hoist the patch uniforms into ONE shared, MUTABLE set parked on the material BEFORE
  // compile, and hand the same objects to the shader. Values are unchanged, so every
  // existing user renders byte-identically — but a caller can now drive a patch at
  // runtime (`mat.userData.surfaceUniforms.uMemSlack.value = …`). Creating them inside
  // onBeforeCompile made them unreachable: a material that has not yet been rendered has
  // no uniforms at all, so the rig (and the lab harness) had nothing to hold.
  if (!material.userData) material.userData = {};   // duck-typed callers (the headless test) have none
  const uniforms = material.userData.surfaceUniforms || (material.userData.surfaceUniforms = {});
  for (const p of used) {
    for (const [name, value] of Object.entries(p.uniforms || {})) {
      if (!uniforms[name]) uniforms[name] = { value };
    }
  }
  material.onBeforeCompile = (shader) => {
    let parsV = '', bodyV = '', parsF = '', bodyF = '', bodyM = '';
    for (const [name, u] of Object.entries(uniforms)) shader.uniforms[name] = u;
    for (const p of used) {
      if (p.parsVert) parsV += '\n' + p.parsVert;
      if (p.bodyVert) bodyV += '\n' + p.bodyVert;
      if (p.parsFrag) parsF += '\n' + p.parsFrag;
      if (p.bodyFrag) bodyF += '\n' + p.bodyFrag;
      if (p.bodyFragMaterial) bodyM += '\n' + p.bodyFragMaterial;
    }
    if (parsV) shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>' + parsV);
    if (bodyV) shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + bodyV);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + parsF)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + bodyF);
    // OPTIONAL THIRD SEAM, after <lights_physical_fragment>: the one place the struct
    // `material` exists (specularColor / specularF90 / roughness) and has not been used
    // yet. The emissive seam can only add light — it cannot author how a surface REFLECTS,
    // and on a dielectric the specular lobe carries the LIGHT's colour, so a cool key
    // paints a cyan sheen on a coal-black sheet no matter what the albedo says. Additive
    // and nullable: no existing patch declares it, so the shipped roster is byte-identical.
    if (bodyM) shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>' + bodyM);
  };
  material.customProgramCacheKey = () => cacheKey;
  material.needsUpdate = true;
  return material;
}
