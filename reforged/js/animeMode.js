// animeMode.js — ANIME / CEL-SHADED render prototype, gated behind `?anime=1`.
//
// A style A/B for the whole game: the SAME world, dragons, FX and post pipeline,
// re-rendered as stylized cel/toon ("anime") instead of the shipped painterly-PBR
// look. Without the flag every function here is a no-op and the shipped frame is
// byte-identical (the toneMap.js coexistence pattern).
//
// Three coordinated systems make the look (each alone reads as a cheap filter;
// together they read as an art direction):
//   1. BANDED CEL LIGHTING — a boot-time override of the physical-lighting shader
//      chunk (the installNeutralToneMap pattern) quantizes every direct light's
//      dotNL into 3 hard-stepped bands with a narrow soft terminator, and tints
//      the shadow band cool (warm light / cool shadow — the classic anime shadow
//      color). Ambient (hemi/probe) stays smooth so shadows keep atmospheric
//      color instead of collapsing to flat poster ink. Because irradiance feeds
//      BOTH diffuse and specular, the specular highlight quantizes for free.
//   2. INK OUTLINES — a per-frame normal+depth pre-pass (the god-ray mask
//      discipline: overrideMaterial + layer 0 + sky hidden + mirror suspended)
//      feeds a screen-space edge pass that draws crisp dark line-art on depth
//      silhouettes and normal creases, weighted down with distance so the far
//      field stays painterly instead of dissolving into noise.
//   3. THE ANIME PASS — a composer pass inserted after OutputPass (display-
//      referred, like the grade) that composites the ink, soft-posterizes the
//      SKY ONLY (the Ghibli banded-gradient sky; world pixels keep their full
//      ramp — posterizing everything is the "cheap filter" tell), and applies a
//      small cel grade bias (lifted shadow floor + saturation).
//
// Tier behaviour: tier 0/1 get the full look; tier 2 (composer off) keeps the
// banded lighting only — outlines and sky bands are composer passes. The
// pre-pass resizes itself to the drawing buffer every frame, so dynRes and
// pixel-ratio changes need no extra plumbing.
import * as THREE from 'three';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';
import { postfx, setAnimePrePass } from './postfx.js';
import { setWaterReflectionSuspended } from './water.js';

const _q = typeof location !== 'undefined'
  ? new URLSearchParams(location.search) : new Map();
const _qget = (k, d) => {
  const v = _q.get ? _q.get(k) : null;
  return v === null || v === undefined ? d : parseFloat(v);
};

// The master flag. `?anime=1` turns the whole mode on; everything else is dials.
export const animeOn = !!(_q.get && _q.get('anime') === '1');

// --- Tuning dials (URL-overridable so look iteration = reload, not rebuild) ---
// Cel ramp: 3 bands (shadow / mid / lit) + soft terminator width. The band
// LEVELS keep a real value ladder (the AAA value-structure law: never flatten
// the body to one value — quantize a ladder, don't erase it).
const CEL = {
  // Low shadow terminator: at dusk the sun grazes, so almost EVERY vertical
  // surface has dotNL < 0.16 — a higher edge1 dumped the whole midground into
  // the dark band (round-6 grey horizon mass). Only true back-faces go dark.
  edge1: _qget('aedge1', 0.08),   // shadow→mid terminator (dotNL)
  edge2: _qget('aedge2', 0.62),   // mid→lit terminator (high — only sun-facing planes get FULL light, or the frame washes)
  soft:  _qget('asoft', 0.045),   // terminator half-width (0 = razor)
  shadow: _qget('ashadow', 0.26), // shadow band level
  mid:   _qget('amid', 0.50),     // mid band level
  lit:   _qget('alit', 0.85),     // lit band level — NOT 1.0: a flat-1.0 lit band overshoots what smooth dotNL averaged and washes sun-facing planes (round-3 pale wings)
  spec:  _qget('aspec', 0.30),    // direct-specular damp — cel gloss is a dot, not a fresnel sheen (round-2 white-wing wash)
  // Painterly-background blend: cel bands on the SUBJECT zone, smooth shading
  // returning with distance (the anime-film split: cel character, painted BG).
  // Also kills the round-3 muddy horizon (far walls stuck in the shadow band).
  farStart: 120.0, farEnd: 380.0,
  // cool shadow tint (r,g,b multipliers at full shadow; 1,1,1 = neutral)
  tintR: 0.80, tintG: 0.88, tintB: 1.14,
};
const INK = {
  strength: _qget('aink', 0.78),      // max line opacity
  width: _qget('awidth', 1.0),        // sample offset in texels (line weight)
  // Crease thresholds: high, so only REAL creases (~≥45°) ink — the round-1
  // values hatched every feather facet into a pencil sketch.
  normalT0: 0.50, normalT1: 0.85,     // 1-dot(n1,n2) crease thresholds
  depthT0: 0.010, depthT1: 0.028,     // relative depth-step thresholds
  // Line-art belongs to the SUBJECT zone only: at the old 420-unit fade the
  // perspective-compressed far ruins accumulated thousands of half-faded lines
  // into a solid dark "ink wash" band across the horizon (round-4/5 bug).
  fadeNear: 70.0, fadeFar: 220.0,     // world-units: line fade over distance
  r: 0.10, g: 0.07, b: 0.14,          // ink color — deep warm plum, not black
};
const SKY = {
  bands: _qget('abands', 10.0),       // sky luma quantization levels
  mix: _qget('askymix', 0.42),        // 0 = untouched sky, 1 = full bands
};
const GRADE = {
  sat: _qget('asat', 1.10),           // extra saturation inside the anime pass
  lift: _qget('alift', 0.035),        // shadow-floor lift (cel blacks are dyed, not void)
};

// --- 1. Banded cel lighting (boot-time chunk override) -----------------------
// Splices a 3-band quantizer into RE_Direct_Physical so EVERY direct light
// (sun, mire spill points, the dragon hero light) bands consistently. Installed
// before any material compiles; the water/sky/FX shaders are hand-rolled and
// untouched (they don't include this chunk).
let _lightingInstalled = false;
export function installAnimeLighting() {
  if (!animeOn || _lightingInstalled) return;
  const sig = '\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n' +
              '\tvec3 irradiance = dotNL * directLight.color;\n' +
              '\t#ifdef USE_CLEARCOAT';
  const chunk = THREE.ShaderChunk.lights_physical_pars_fragment;
  if (!chunk.includes(sig)) {
    // Vendored three changed the RE_Direct_Physical wording — fail loud, don't guess.
    console.warn('[anime] RE_Direct_Physical signature not found; cel lighting not installed.');
    return;
  }
  const f = (x) => x.toFixed(4);
  const celGlsl =
    '\tfloat dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n' +
    // 3-band cel quantize with a narrow smoothstep terminator. b1 lifts
    // shadow→mid, b2 lifts mid→lit; the sum walks the value ladder.
    `\tfloat animeB1 = smoothstep( ${f(CEL.edge1 - CEL.soft)}, ${f(CEL.edge1 + CEL.soft)}, dotNL );\n` +
    `\tfloat animeB2 = smoothstep( ${f(CEL.edge2 - CEL.soft)}, ${f(CEL.edge2 + CEL.soft)}, dotNL );\n` +
    `\tfloat animeCel = ${f(CEL.shadow)} + animeB1 * ${f(CEL.mid - CEL.shadow)} + animeB2 * ${f(CEL.lit - CEL.mid)};\n` +
    // geometryPosition is view-space → its length is eye distance; blend the
    // cel band back to smooth Lambert with distance (painterly background).
    `\tfloat animeFar = smoothstep( ${f(CEL.farStart)}, ${f(CEL.farEnd)}, length( geometryPosition ) );\n` +
    '\tanimeCel = mix( animeCel, dotNL, animeFar );\n' +
    // Warm-light/cool-shadow: the shadow band multiplies a cool tint that
    // fades out by the lit band (per-channel, luminance-preserving-ish).
    `\tvec3 animeTint = mix( vec3( ${f(CEL.tintR)}, ${f(CEL.tintG)}, ${f(CEL.tintB)} ), vec3( 1.0 ), max( animeB2, animeFar ) );\n` +
    '\tvec3 irradiance = animeCel * animeTint * directLight.color;\n' +
    '\t#ifdef USE_CLEARCOAT';
  let patched = chunk.replace(sig, celGlsl);
  // Damp direct specular: with the banded irradiance no longer tapering by
  // dotNL, full-strength GGX + fresnel sheens grazing surfaces (wings) to
  // white. Cel gloss is a restrained accent.
  const specSig = '\treflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );';
  if (patched.includes(specSig)) {
    patched = patched.replace(specSig,
      `\treflectedLight.directSpecular += ${f(CEL.spec)} * irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );`);
  }
  THREE.ShaderChunk.lights_physical_pars_fragment = patched;
  _lightingInstalled = true;
}

// --- 2 + 3. Ink pre-pass + the anime composer pass ---------------------------
const AnimeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tNormal: { value: null },
    tDepth: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
    uNear: { value: 0.1 },
    uFar: { value: 1600.0 },
    uInk: { value: new THREE.Vector3(INK.r, INK.g, INK.b) },
    uInkStrength: { value: INK.strength },
    uWidth: { value: INK.width },
    uSkyBands: { value: SKY.bands },
    uSkyMix: { value: SKY.mix },
    uSat: { value: GRADE.sat },
    uLift: { value: GRADE.lift },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform sampler2D tNormal;
    uniform sampler2D tDepth;
    uniform vec2 uTexel;
    uniform float uNear, uFar;
    uniform vec3 uInk;
    uniform float uInkStrength, uWidth, uSkyBands, uSkyMix, uSat, uLift;
    varying vec2 vUv;
    float linDepth(float d) {
      // perspective depth → world-units eye depth
      return uNear * uFar / (uFar - d * (uFar - uNear));
    }
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec2 o = uTexel * uWidth;
      float dRawC = texture2D(tDepth, vUv).x;
      float isSky = step(0.99995, dRawC);

      // ── INK LINES (world pixels only) ──
      // Depth silhouettes: Roberts-cross on linearized depth, thresholded
      // RELATIVE to eye depth so far geometry needs a proportionally bigger
      // step (kills perspective-slope false lines).
      float dC = linDepth(dRawC);
      float dL = linDepth(texture2D(tDepth, vUv - vec2(o.x, 0.0)).x);
      float dR = linDepth(texture2D(tDepth, vUv + vec2(o.x, 0.0)).x);
      float dU = linDepth(texture2D(tDepth, vUv + vec2(0.0, o.y)).x);
      float dD = linDepth(texture2D(tDepth, vUv - vec2(0.0, o.y)).x);
      float dStep = (abs(dL - dR) + abs(dU - dD)) / max(dC, 1.0);
      float edgeD = smoothstep(${INK.depthT0.toFixed(4)}, ${INK.depthT1.toFixed(4)}, dStep);
      // Normal creases: max angular break against 4 neighbors.
      vec3 nC = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
      vec3 nL = texture2D(tNormal, vUv - vec2(o.x, 0.0)).xyz * 2.0 - 1.0;
      vec3 nR = texture2D(tNormal, vUv + vec2(o.x, 0.0)).xyz * 2.0 - 1.0;
      vec3 nU = texture2D(tNormal, vUv + vec2(0.0, o.y)).xyz * 2.0 - 1.0;
      vec3 nD = texture2D(tNormal, vUv - vec2(0.0, o.y)).xyz * 2.0 - 1.0;
      float nBreak = max(max(1.0 - dot(nC, nL), 1.0 - dot(nC, nR)),
                         max(1.0 - dot(nC, nU), 1.0 - dot(nC, nD)));
      float edgeN = smoothstep(${INK.normalT0.toFixed(4)}, ${INK.normalT1.toFixed(4)}, nBreak);
      float edge = max(edgeD, edgeN * 0.6);
      // Distance fade: near lines full ink, far field painterly (no noise soup).
      edge *= 1.0 - smoothstep(${INK.fadeNear.toFixed(1)}, ${INK.fadeFar.toFixed(1)}, dC);
      edge *= (1.0 - isSky);
      // NormalBlending-style composite: ink PULLS the pixel toward a dark dyed
      // plum (never additive — additive can only brighten, the washed-fringe law).
      col = mix(col, uInk * (0.4 + 0.6 * col), edge * uInkStrength);

      // ── SKY BANDS (sky pixels only) ──
      // Soft-posterize the sky's luma while keeping its hue: the Ghibli banded
      // gradient. Soft band edges + the grade dither downstream keep it silky.
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float bandT = smoothstep(0.25, 0.75, fract(lum * uSkyBands));
      float qSoft = mix(floor(lum * uSkyBands) / uSkyBands,
                        (floor(lum * uSkyBands) + 1.0) / uSkyBands, bandT);
      vec3 skyCol = col * (qSoft / max(lum, 1e-4));
      // Protect the bright peak — the sun's halo must keep its smooth golden
      // swell (round 1 quantized it away and the hour lost its light source).
      float peakProtect = 1.0 - smoothstep(0.70, 0.86, lum);
      col = mix(col, skyCol, isSky * uSkyMix * peakProtect);

      // ── CEL GRADE BIAS ──
      // Dyed blacks (lift the floor toward the ink hue) + a touch of saturation.
      col = col + uInk * uLift * (1.0 - smoothstep(0.0, 0.35, dot(col, vec3(0.333))));
      float l2 = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l2), col, uSat);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

let _renderer = null, _scene = null, _camera = null, _sky = null;
let _normRT = null, _normMat = null, _animePass = null;
let _installed = false;

// Renders view-space normals + depth for the ink pass. Same save/restore
// discipline as renderGodRayMask: layer 0 only (additive sprites/trails live on
// layer 1), sky hidden (sky pixels = far depth = the sky mask), mirror suspended.
// FX EXCLUSION: overrideMaterial turns every additive/transparent glow quad into
// an opaque normal-writing card — each ember mote then gets its own square ink
// outline (the round-1 "confetti" bug). So the pre-pass hides everything that
// isn't a solid surface (transparent, additive, non-depth-writing, Sprite/
// Points) for the duration of the one render, then restores visibility.
const _hidden = [];
function _isFxObject(o) {
  if (o.isSprite || o.isPoints || o.isLine) return true;
  const m = o.material;
  if (!m || Array.isArray(m)) return false;
  return m.transparent === true || m.depthWrite === false ||
    (m.blending !== undefined && m.blending !== THREE.NormalBlending);
}
function renderAnimePrePass() {
  if (!_normRT || !_renderer || !postfx.enabled) return;
  const r = _renderer;
  const size = r.getDrawingBufferSize(_tmpSize);
  if (_normRT.width !== size.x || _normRT.height !== size.y) {
    _normRT.setSize(size.x, size.y);
    _animePass.uniforms.uTexel.value.set(1 / size.x, 1 / size.y);
  }
  const pTarget = r.getRenderTarget();
  const pOverride = _scene.overrideMaterial;
  const pBg = _scene.background;
  const pFog = _scene.fog;
  const pSkyVis = _sky ? _sky.visible : true;
  const pMask = _camera.layers.mask;
  _hidden.length = 0;
  _scene.traverse((o) => {
    if (o.visible && (o.isMesh || o.isSprite || o.isPoints || o.isLine) && _isFxObject(o)) {
      o.visible = false;
      _hidden.push(o);
    }
  });
  if (_sky) _sky.visible = false;
  _scene.overrideMaterial = _normMat;
  _scene.background = null;
  _scene.fog = null;
  _camera.layers.set(0);
  // The god-rays lesson, relearned the hard way: without this the water's
  // Reflector re-renders its mirror DURING the override pass and the real frame
  // then reflects a black-sky normal-buffer (a dark dead sea to the horizon).
  setWaterReflectionSuspended(true);
  r.setRenderTarget(_normRT);
  r.clear();
  r.render(_scene, _camera);
  setWaterReflectionSuspended(false);
  r.setRenderTarget(pTarget);
  _scene.overrideMaterial = pOverride;
  _scene.background = pBg;
  _scene.fog = pFog;
  for (let i = 0; i < _hidden.length; i++) _hidden[i].visible = true;
  _hidden.length = 0;
  if (_sky) _sky.visible = pSkyVis;
  _camera.layers.mask = pMask;
}
const _tmpSize = new THREE.Vector2();

// Wires the ink pre-pass + inserts the anime pass into the composer, directly
// after OutputPass (display-referred, before the grade so vignette/dither still
// run last). Call once after initPostFX + createEnvironment. No-op off-flag.
export function initAnime(renderer, scene, camera, sky) {
  if (!animeOn || _installed || !postfx.composer) return;
  _renderer = renderer; _scene = scene; _camera = camera; _sky = sky;
  _normMat = new THREE.MeshNormalMaterial();   // smooth attribute normals — facet noise stays sub-threshold
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const depthTex = new THREE.DepthTexture(size.x, size.y);
  depthTex.type = THREE.UnsignedIntType;
  _normRT = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    depthBuffer: true, stencilBuffer: false, depthTexture: depthTex,
  });
  _animePass = new ShaderPass(AnimeShader);
  _animePass.uniforms.tNormal.value = _normRT.texture;
  _animePass.uniforms.tDepth.value = depthTex;
  _animePass.uniforms.uTexel.value.set(1 / size.x, 1 / size.y);
  _animePass.uniforms.uNear.value = camera.near;
  _animePass.uniforms.uFar.value = camera.far;
  const gradeIdx = postfx.composer.passes.indexOf(postfx.gradingPass);
  postfx.composer.insertPass(_animePass, gradeIdx < 0 ? postfx.composer.passes.length : gradeIdx);
  setAnimePrePass(renderAnimePrePass);
  _installed = true;
}
