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

// --- N18 CREATURE SHADING (the shared live gate) -----------------------------
// Every patch in this file ADDS light (`totalEmissiveRadiance +=`) or tweaks
// roughness.
// None of them can make anything DARKER, and detail is mostly darkness: what
// reads as scales on a real animal is the thin dark line in every crevice, and
// what reads as a solid body is the belly being dimmer than the back. Without a
// subtractive term a creature can only ever get shinier, never more solid — the
// "LED-strip glow over flat plastic" failure DRAGON-DESIGN.md names but the
// shader seam made unavoidable.
//
// N18 adds the missing half: terms that multiply `diffuseColor.rgb` DOWN. This
// is the N15 prop-AO idea (which shipped for the world) finally applied to the
// creature. One shared uniform gates the lot — 0 = every multiply is `* 1.0`,
// IEEE-exact identity, so the shipped roster is byte-identical with it off.
//
// It also gates the CLONE FIX (see cloneComposed) — one Settings switch, one
// uniform, both halves of "the dragon can be dark".
export const creatureShadingUniform = { value: 0 };
// Patch stack per composed material, so cloneComposed can rebuild it. A WeakMap
// and NOT `material.userData`: r160's Material.copy JSON-round-trips userData,
// which would silently turn the patch descriptors into inert plain objects (the
// same class of trap as the clone itself). Declared here — above composeSurface
// — so a call at module-evaluation time can never hit the TDZ.
const COMPOSED = new WeakMap();
export function setCreatureShading(on) { creatureShadingUniform.value = on ? 1 : 0; }
export function creatureShadingEnabled() { return creatureShadingUniform.value > 0; }

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

// N18 — BELLY AO: the creature's own occlusion, the cheap stand-in for a real
// self-shadow. A dragon in the sky is lit by a bright dome above and a dark sea
// below, so every down-facing surface — belly, under-jaw, under-wing, the
// underside of every tail segment — is genuinely the darkest part of the animal
// before any shadow map is involved. Painting that in costs one dot product and
// buys the single biggest "solid body, not a lit toy" cue available to us.
//
// The normal is read in OBJECT space (`objectNormal`, which r160 has already run
// through <skinnormal_vertex> by our <begin_vertex> seam — verified against the
// vendored STANDARD vertex shader), so the belly stays the belly as the tail
// coils and the wings beat. A view-space normal would slide the shading around
// the body as the camera swings; an object-space one is welded to the anatomy.
//
// Deliberately NOT the N15 prop heuristic: props are grounded (base y=0, darken
// by height²), a flying creature has no base — height means nothing on it. The
// down-facing term is the only one of N15's two that transfers.
//
// Multiplies `diffuseColor.rgb`, which the <emissivemap_fragment> seam still has
// live (<lights_physical_fragment> consumes it after us), so the darkening flows
// through real lighting instead of being painted on top of it.
export function bellyAOPatch(opts = {}) {
  return {
    key: 'bao',
    uniforms: {
      uBellyAOAmt: opts.amount ?? 0.34,   // max darkening on a straight-down face
      uBellyAOPow: opts.power ?? 1.35,    // >1 keeps the flanks clean, concentrates it underneath
    },
    // Live shared gate — assigned BY REFERENCE (see composeSurface), so one
    // Settings switch drives every creature material already on the GPU.
    sharedUniforms: { uCreatureAO: creatureShadingUniform },
    parsVert: `varying vec3 vObjNrm;`,
    bodyVert: `vObjNrm = objectNormal;`,
    parsFrag: `varying vec3 vObjNrm;
      uniform float uBellyAOAmt; uniform float uBellyAOPow; uniform float uCreatureAO;`,
    bodyFrag: `{
      float _baDown = clamp(-normalize(vObjNrm).y, 0.0, 1.0);
      float _baAO = 1.0 - uBellyAOAmt * pow(_baDown, uBellyAOPow);
      diffuseColor.rgb *= mix(1.0, _baAO, uCreatureAO);   // uCreatureAO 0 → *1.0, exact identity
    }`,
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
      // N18 cavity: how dark the recessed seam between scales goes.
      uScaleCavity: opts.cavity ?? 0.45,
    },
    sharedUniforms: { uCreatureAO: creatureShadingUniform },
    parsVert: `varying vec3 vSurfPos;`,
    bodyVert: `vSurfPos = position;`,
    parsFrag: `varying vec3 vSurfPos;
      uniform float uScaleSize; uniform float uScaleSheen; uniform float uScaleRough; uniform vec3 uScaleTint;
      uniform float uScaleNrmAmp; uniform float uScaleCavity; uniform float uCreatureAO;
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
      // N18 CAVITY — the other half of relief. The perturbed normal alone only
      // says "this facet tilts"; a bumpy surface still reads flat until the
      // recesses are actually DARKER than the ridges. _scH is 1 at a raised
      // scale centre and 0 in the seam, so (1-_scH) is the crevice mask.
      // Ambient light reaches a crevice floor less than a ridge crest, and the
      // shading normal cannot express that — only occlusion can.
      diffuseColor.rgb *= mix(1.0, 1.0 - uScaleCavity * (1.0 - _scH), uCreatureAO);
    }`,
  };
}

// The closed set of surface-shader names a blueprint may declare in
// `parts.surface.shader`. Kept beside buildSurfacePatches (the only consumer) so
// the creature grammar/validator can't drift from what's actually buildable.
export const SURFACE_PATCH_NAMES = Object.freeze([
  'cellularScales', 'cellularScalesNormal', 'iridescence', 'subsurface', 'membraneSSS',
  'bellyAO',
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
    // N18 belly AO — per-dragon depth via `def.bellyAO` (a slim courier wants
    // less than a heavy armoured hull). Inert until CREATURE SHADING is on.
    else if (n === 'bellyAO') out.push(bellyAOPatch({ amount: def.bellyAO ?? 0.34 }));
  }
  return out;
}

// --- Compose ----------------------------------------------------------------
// Apply N patches to one material through a single onBeforeCompile + a single
// merged customProgramCacheKey (so stacked variants never collide in Three's
// program cache, and an un-patched MeshStandard stays distinct).
// `opts.gate` — a shared uniform object that fades the WHOLE spliced block in.
// Used by cloneComposed so a re-composed clone can ship inert (gate 0 = exactly
// the un-patched material it is today) and light up live on one Settings switch,
// with no rebuild and no second program path to keep honest.
export function composeSurface(material, patches, opts = {}) {
  const used = (patches || []).filter(Boolean);
  if (!used.length) return material;
  const gate = opts.gate || null;
  const cacheKey = 'surf:' + used.map((p) => p.key).join('+') + (gate ? '+gated' : '');
  material.onBeforeCompile = (shader) => {
    let parsV = '', bodyV = '', parsF = '', bodyF = '';
    for (const p of used) {
      for (const [name, value] of Object.entries(p.uniforms || {})) {
        shader.uniforms[name] = { value };
      }
      // Shared uniforms are assigned BY REFERENCE (not re-wrapped in a fresh
      // `{ value }` like the per-patch ones), so one JS object drives every
      // compiled material at once. Re-wrapping would snapshot the value at
      // compile time and the live toggle would silently do nothing.
      for (const [name, uniform] of Object.entries(p.sharedUniforms || {})) {
        shader.uniforms[name] = uniform;
      }
      if (p.parsVert) parsV += '\n' + p.parsVert;
      if (p.bodyVert) bodyV += '\n' + p.bodyVert;
      if (p.parsFrag) parsF += '\n' + p.parsFrag;
      if (p.bodyFrag) bodyF += '\n' + p.bodyFrag;
    }
    if (gate) {
      shader.uniforms.uSurfGate = gate;
      parsF += '\nuniform float uSurfGate;';
      // Snapshot every value the patches are allowed to touch, then lerp back.
      // At uSurfGate 0 `mix(a,b,0)` is `a*1.0 + b*0.0` — exactly `a` — so the
      // gated material is IEEE-identical to the plain clone it replaces.
      bodyF = `
      vec3 _sgE0 = totalEmissiveRadiance; float _sgR0 = roughnessFactor;
      vec3 _sgN0 = normal; vec3 _sgD0 = diffuseColor.rgb;${bodyF}
      totalEmissiveRadiance = mix(_sgE0, totalEmissiveRadiance, uSurfGate);
      roughnessFactor       = mix(_sgR0, roughnessFactor,       uSurfGate);
      normal                = mix(_sgN0, normal,                uSurfGate);
      diffuseColor.rgb      = mix(_sgD0, diffuseColor.rgb,      uSurfGate);`;
    }
    if (parsV) shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>' + parsV);
    if (bodyV) shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + bodyV);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + parsF)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + bodyF);
  };
  material.customProgramCacheKey = () => cacheKey;
  material.needsUpdate = true;
  COMPOSED.set(material, used);
  return material;
}

// --- N18 THE CLONE FIX ------------------------------------------------------
// r160's `Material.copy` does NOT carry `onBeforeCompile` or
// `customProgramCacheKey` (verified against the vendored source: neither appears
// in its copy list). So `bodyMat.clone()` silently returns a material whose
// onBeforeCompile has fallen back to `Material.prototype`'s empty no-op — every
// surface patch, INCLUDING the fresnel rim that exists specifically to stop the
// body reading as a flat mass, is dropped on the floor. No error, no warning:
// the clone just renders as plain MeshStandard.
//
// That is why the torso — the largest surface on most of the roster — has never
// had the rim its blueprint asked for. And because whether a mesh kept the rim
// came down to whether its call site happened to clone, the damage is PATCHY,
// which reads worse than uniform: the skull (dragonDraconicHead.js:68) and the
// root mesh (dragonTorso.js:274) use bodyMat directly and are rimmed, while the
// torso loft, the head shells (:195/:259) and the keen snout (:305) are not — one
// creature, shaded inconsistently across itself. The same r160 trap the Skyforged
// markers hit from the uniform side (GRAPHICS-OVERHAUL N17/PR-3: "NO
// material.clone()"); creatures never got the memo.
//
// Only dragonTorso.js is converted here (hero-first — coexist → prove → migrate);
// the other call sites are listed in GRAPHICS-OVERHAUL N18 as the migration list.
//
// cloneComposed clones and then re-applies the recorded patch stack (see the
// COMPOSED WeakMap at the top of this file), gated so the restored patches are
// inert until CREATURE SHADING is switched on.
export function cloneComposed(material) {
  const clone = material.clone();
  const patches = COMPOSED.get(material);
  if (patches && patches.length) composeSurface(clone, patches, { gate: creatureShadingUniform });
  return clone;
}
