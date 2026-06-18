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
    else if (n === 'cellularScalesNormal') out.push(cellularScalesNormalPatch({ tint: def.scales ?? 0xffffff, size: 5.0, sheen: 0.16, rough: 0.28, amp: (def.scaleRelief ?? 0.3) * getActiveDetail().mul }));
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
  material.onBeforeCompile = (shader) => {
    let parsV = '', bodyV = '', parsF = '', bodyF = '';
    for (const p of used) {
      for (const [name, value] of Object.entries(p.uniforms || {})) {
        shader.uniforms[name] = { value };
      }
      if (p.parsVert) parsV += '\n' + p.parsVert;
      if (p.bodyVert) bodyV += '\n' + p.bodyVert;
      if (p.parsFrag) parsF += '\n' + p.parsFrag;
      if (p.bodyFrag) bodyF += '\n' + p.bodyFrag;
    }
    if (parsV) shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>' + parsV);
    if (bodyV) shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + bodyV);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>' + parsF)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + bodyF);
  };
  material.customProgramCacheKey = () => cacheKey;
  material.needsUpdate = true;
  return material;
}
