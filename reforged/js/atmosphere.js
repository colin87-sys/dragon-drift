import * as THREE from 'three';
import { SUN_DIR } from './biomes.js';

// N8 — Atmosphere: height fog + sunward inscatter (aerial perspective), as a
// GLOBAL fog-chunk system (GRAPHICS-OVERHAUL.md). Today only the sky + water
// hand-roll a dual-color fog; every prop / boss / creature uses stock linear
// `fog_fragment`. This overrides the four fog ShaderChunks ONCE at boot so all of
// them share one physically-flavoured fog: denser near the water (height fog),
// brighter looking toward the sun (inscatter), colored near→far (dual-fog).
//
// ZERO-DEFAULT IDENTITY: every atmosphere term is gated by a uniform that is 0 in
// the shipped look, and each collapses to stock linear fog at 0 (walked in
// tests/atmosphere.mjs). Unbound materials keep their GL-default-0 uniforms; bound
// materials share these objects. Programs are partitioned by `onBeforeCompile`
// (via bindAtmosphere / the props' own cache key) so a bound material can never
// upload nonzero uniforms into a program an unbound material also uses.
//
// Gate-1 adjustments baked in: (1) own namespaced varyings — NOT `vViewPosition`
// (duplicate-declared on lit materials, absent on sprites); (2) world-Y + world
// view-dir reconstructed from `mvPosition` alone (sprites have no `transformed`),
// row-dot inverse-rotation so it also compiles on WebGL1; (3) a WORLD-space sun
// dir (constant SUN_DIR) so inscatter is correct in the water Reflector's mirror.
//
// SCOPE (PR A): props + generic env meshes join the atmosphere; biome `atmos:{}`
// channels drive it. OUT OF SCOPE: retiring the sky/water hand-rolled dual-fog
// into these uniforms (PR B — has the water UniformsUtils.clone identity trap),
// and the dragon/boss surface shaders (rimLight.js / dragonGlb.js /
// dragonSurfaceShader.js terminally assign onBeforeCompile — they pick up the
// chunk at identity now, but must route through chainBeforeCompile before the
// dragon is meant to sit IN the atmosphere).

export const atmosUniforms = {
  uAtmosFarColor:  { value: new THREE.Color(0, 0, 0) }, // far-field fog color
  uAtmosFarMix:    { value: 0 },                        // 0 = single-color linear fog
  uAtmosSunDir:    { value: SUN_DIR.clone() },          // WORLD space (constant)
  uAtmosSunTint:   { value: new THREE.Color(0, 0, 0) }, // inscatter color
  uAtmosInscatter: { value: 0 },                        // 0 = no sunward brightening
  uAtmosHeightK:   { value: 0 },                        // 0 = height-uniform fog
};

let enabled = false;
let tier = 0;
let installed = false;

export function atmosphereEnabled() { return enabled; }
export function setAtmosphereQuality(t) { tier = t; } // applyAtmosphere re-reads each frame

function zeroLiveTerms() {
  atmosUniforms.uAtmosFarMix.value = 0;
  atmosUniforms.uAtmosInscatter.value = 0;
  atmosUniforms.uAtmosHeightK.value = 0;
}

export function setAtmosphereEnabled(on) {
  enabled = !!on;
  if (!enabled) zeroLiveTerms(); // snap back to the shipped fog immediately
}

// Per-frame write from the lerped biome env (called in updateEnvironment). Off →
// hold the shipped identity. At tier2 drop heightK/inscatter (keeps the far-color
// mix, which the sky/water already run at tier2 — the props just join them).
export function applyAtmosphere(env) {
  if (!enabled) { zeroLiveTerms(); return; }
  atmosUniforms.uAtmosFarColor.value.copy(env.fogFarColor);
  atmosUniforms.uAtmosFarMix.value = env.fogFarMix;
  atmosUniforms.uAtmosSunTint.value.copy(env.sunGlow);
  const t2 = tier >= 2;
  atmosUniforms.uAtmosHeightK.value   = t2 ? 0 : (env.atmosHeightK || 0);
  atmosUniforms.uAtmosInscatter.value = t2 ? 0 : (env.atmosInscatter || 0);
}

// Assign the shared uniform OBJECTS into a compiled shader (identity-slot, no
// string surgery). Idempotent; safe to call from any onBeforeCompile.
export function assignAtmos(shader) { Object.assign(shader.uniforms, atmosUniforms); }

// Wrap (never overwrite) an existing onBeforeCompile — the L4 lesson. Preserves
// the prior patch's string replaces and uniform assigns.
export function chainBeforeCompile(mat, fn) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    if (prev) prev(shader, renderer);
    fn(shader, renderer);
  };
  return mat;
}

// Bind a plain material into the atmosphere (routes through onBeforeCompile so the
// program cache partitions bound from unbound — Gate-1 §3).
export function bindAtmosphere(mat) { return chainBeforeCompile(mat, assignAtmos); }

// Override the four fog ShaderChunks. MUST run before any material compiles.
export function installAtmosphere() {
  if (installed) return;
  installed = true;
  const C = THREE.ShaderChunk;

  // --- vertex pars: keep vFogDepth, add own namespaced varyings ---------------
  C.fog_pars_vertex = /* glsl */`#ifdef USE_FOG
  varying float vFogDepth;
  varying float vAtmosWorldY;
  varying vec3  vAtmosWorldDir;
#endif`;

  // --- vertex: vFogDepth verbatim; reconstruct world-Y + world view-dir from
  //     mvPosition (works for sprites — no `transformed` needed). The three
  //     row-dots are transpose(mat3(viewMatrix)) * mvPosition.xyz (inverse of a
  //     pure rotation) written without transpose() for WebGL1. ------------------
  C.fog_vertex = /* glsl */`#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vec3 _atmRel = vec3(
    dot(vec3(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x), mvPosition.xyz),
    dot(vec3(viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y), mvPosition.xyz),
    dot(vec3(viewMatrix[0].z, viewMatrix[1].z, viewMatrix[2].z), mvPosition.xyz));
  vAtmosWorldDir = _atmRel;                  // camera -> fragment, world space
  vAtmosWorldY   = cameraPosition.y + _atmRel.y;
#endif`;

  // --- fragment pars: fogColor + varyings + the zero-default atmosphere uniforms.
  //     Keep the stock FOG_EXP2 / linear uniform split verbatim. -----------------
  C.fog_pars_fragment = /* glsl */`#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying float vAtmosWorldY;
  varying vec3  vAtmosWorldDir;
  uniform vec3  uAtmosFarColor;  uniform float uAtmosFarMix;
  uniform vec3  uAtmosSunDir;    uniform vec3  uAtmosSunTint;   uniform float uAtmosInscatter;
  uniform float uAtmosHeightK;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;

  // --- fragment: stock fogFactor (both branches verbatim) then the atmosphere.
  //     At all-zero uniforms: _atmF == fogFactor, _atmCol == fogColor, so the
  //     final mix is byte-identical to stock. -----------------------------------
  C.fog_fragment = /* glsl */`#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  // Height fog: thin the fog with altitude (denser near the water). heightK=0 ->
  // step()=0 -> mix()=1.0 -> fogFactor unchanged.
  float _atmF = fogFactor * mix(1.0, exp(-max(vAtmosWorldY, 0.0) * uAtmosHeightK), step(0.0001, uAtmosHeightK));
  // Dual-fog near->far color. farMix=0 -> fogColor exactly.
  vec3 _atmCol = mix(fogColor, uAtmosFarColor, _atmF * uAtmosFarMix);
  // Sunward inscatter (aerial perspective): brighten fog looking toward the sun.
  // Guarded normalize so a degenerate dir can't NaN-poison the *0 identity.
  vec3 _wd = vAtmosWorldDir;
  float _wl = length(_wd);
  _wd = _wl > 1e-6 ? _wd * (1.0 / _wl) : vec3(0.0);
  float _atmSun = pow(clamp(dot(_wd, uAtmosSunDir), 0.0, 1.0), 6.0);
  _atmCol += uAtmosSunTint * (_atmSun * uAtmosInscatter * _atmF);
  gl_FragColor.rgb = mix( gl_FragColor.rgb, _atmCol, _atmF );
#endif`;
}
