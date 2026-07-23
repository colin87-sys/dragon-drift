// animeMode.js — ANIME / CEL-SHADED render prototype, gated behind `?anime=1`.
//
// A style A/B for the whole game: the SAME world, dragons, FX and post pipeline,
// re-rendered as premium clean-cel ("anime game") instead of the shipped
// painterly-PBR look. Without the flag every function here is a no-op and the
// shipped frame is byte-identical (the toneMap.js coexistence pattern).
//
// v2 — CLEAN CEL (owner rejected v1's ink-heavy pass: screen-space 1px edge
// lines shimmer in motion, hatch the dragon up close, and the frame lost the
// golden-hour glow — "looks really bad"). The premium anime-game lineage
// (Genshin / BotW / Sky) is the opposite recipe, and v2 follows it:
//   1. BANDED CEL LIGHTING — boot-time override of the physical-lighting chunk:
//      every direct light's dotNL steps into lit/mid/shadow bands with a soft
//      terminator; the shadow band is BRIGHT and chromatically cool (a color
//      statement, not a darkness); specular is luma-gated (fresnel wing-sheen
//      dies, the water's golden sun-path keeps full strength); a banded rim
//      pops the subject; bands blend back to smooth shading with distance
//      (cel subject over painterly background — the anime-film split).
//   2. INVERTED-HULL OUTLINE, DRAGON ONLY — the Genshin technique: a slightly
//      inflated backface shell around the hero's meshes gives one thick,
//      geometry-stable contour that cannot shimmer. The ENVIRONMENT gets no
//      lines at all (BotW/Genshin worlds carry their style in color + light,
//      not ink) — v1's screen-space edge pass is deleted.
//   3. VIBRANCY PASS — a tiny composer pass after OutputPass: saturation push +
//      dyed-black lift. The sky/water stay untouched and luminous (an anime
//      frame must read BRIGHTER than realism, never duller); optional sky luma
//      bands survive only as an experiment dial, default OFF.
//
// Tier behaviour: banded lighting + hull are tier-independent (no extra passes,
// no RTs); the vibrancy pass rides the composer (tier 0/1).
import * as THREE from 'three';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';
import { postfx } from './postfx.js';

const _q = typeof location !== 'undefined'
  ? new URLSearchParams(location.search) : new Map();
const _qget = (k, d) => {
  const v = _q.get ? _q.get(k) : null;
  return v === null || v === undefined ? d : parseFloat(v);
};

// The master flag. `?anime=1` turns the whole mode on; everything else is dials.
export const animeOn = !!(_q.get && _q.get('anime') === '1');

// --- Tuning dials (URL-overridable so look iteration = reload, not rebuild) ---
const CEL = {
  // Terminators sized for the game's grazing dusk sun (a high shadow edge dumps
  // the whole midground into the dark band — the v1 grey-horizon lesson).
  edge1: _qget('aedge1', 0.15),   // shadow→mid terminator (dotNL)
  edge2: _qget('aedge2', 0.55),   // mid→lit terminator
  soft:  _qget('asoft', 0.06),    // terminator half-width
  // BRIGHT bands (v2): the shadow step is a hue statement, not a darkness —
  // v1's 0.2-0.26 shadow floor muted the whole frame below the shipped look.
  shadow: _qget('ashadow', 0.38),
  mid:   _qget('amid', 0.68),
  lit:   _qget('alit', 0.95),
  spec:  _qget('aspec', 0.30),    // spec damp floor; luma-gated below so hot sun-paths keep full strength
  rim:   _qget('arim', 0.40),     // banded rim strength (0 = off)
  rimEdge: 0.72,                  // 1-dot(N,V) threshold for the rim band
  // Painterly-background blend: cel bands near, smooth shading far.
  farStart: 120.0, farEnd: 380.0,
  // Chromatic cool shadow tint (multipliers at full shadow) — saturated blue,
  // not grey: cel shadows carry color.
  tintR: 0.78, tintG: 0.86, tintB: 1.20,
};
const HULL = {
  width: _qget('ahull', 0.055),   // outline shell thickness, world units (0 = off)
  minPart: 0.14,                  // skip parts smaller than this bounding radius (rivets would blob)
  widthCap: 0.16,                 // per-part cap: width ≤ radius × this (thin struts keep their read)
  r: 0.07, g: 0.05, b: 0.10,      // contour color — deep warm plum, not black
};
const SKY = {
  bands: _qget('abands', 7.0),    // sky luma bands — EXPERIMENT dial only
  mix: _qget('askymix', 0.0),     // default OFF (v2): the luminous sky is the game's best asset
};
const GRADE = {
  sat: _qget('asat', 1.12),       // vibrancy push (on top of the shipped grade)
  lift: _qget('alift', 0.025),    // dyed-black lift (cel blacks are dyed, not void)
};

// --- 1. Banded cel lighting (boot-time chunk override) -----------------------
// Splices the quantizer into RE_Direct_Physical so EVERY direct light (sun,
// mire spill points, the dragon hero light) bands consistently. Installed
// before any material compiles; hand-rolled shaders (sky/water/FX) untouched.
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
    `\tfloat animeB1 = smoothstep( ${f(CEL.edge1 - CEL.soft)}, ${f(CEL.edge1 + CEL.soft)}, dotNL );\n` +
    `\tfloat animeB2 = smoothstep( ${f(CEL.edge2 - CEL.soft)}, ${f(CEL.edge2 + CEL.soft)}, dotNL );\n` +
    `\tfloat animeCel = ${f(CEL.shadow)} + animeB1 * ${f(CEL.mid - CEL.shadow)} + animeB2 * ${f(CEL.lit - CEL.mid)};\n` +
    // geometryPosition is view-space → its length is eye distance; blend the
    // cel band back to smooth Lambert with distance (painterly background).
    `\tfloat animeFar = smoothstep( ${f(CEL.farStart)}, ${f(CEL.farEnd)}, length( geometryPosition ) );\n` +
    // POINT-LIGHT EXEMPTION: the cel band applies to the SUN only. Banding a
    // point light floor-lights every surface in range (shipped dotNL tapers
    // back-faces to zero) — the dragon's own intensity-12 hero light then
    // stacks ×3-4 over shipped and bloom blows the hero into a white orb (a
    // magnitude-based guard still leaked in its partial zone; the exemption is
    // by light TYPE, tagged at the call sites in lights_fragment_begin).
    '\tfloat animeSmooth = max( animeFar, animeIsPoint );\n' +
    '\tanimeCel = mix( animeCel, dotNL, animeSmooth );\n' +
    // Warm-light/cool-shadow: the shadow band multiplies a saturated cool tint
    // that fades out by the lit band.
    `\tvec3 animeTint = mix( vec3( ${f(CEL.tintR)}, ${f(CEL.tintG)}, ${f(CEL.tintB)} ), vec3( 1.0 ), max( animeB2, animeSmooth ) );\n` +
    '\tvec3 irradiance = animeCel * animeTint * directLight.color;\n' +
    // Banded rim (subject zone, sun-scale lights only — the hot-light guard
    // keeps the hero point light from painting rim over the whole body).
    `\tfloat animeRim = step( ${f(CEL.rimEdge)}, 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ) ) * ${f(CEL.rim)} * ( 1.0 - animeSmooth );\n` +
    '\treflectedLight.directDiffuse += animeRim * animeB1 * min( directLight.color, vec3( 1.0 ) ) * material.diffuseColor;\n' +
    '\t#ifdef USE_CLEARCOAT';
  let patched = chunk.replace(sig, celGlsl);
  // Luma-GATED specular damp: with banded irradiance no longer tapering by
  // dotNL, full-strength GGX fresnel sheens grazing wings to white — but a flat
  // damp also killed the water's golden sun-path (the game's signature light).
  // Damp only dim/mid speculars; hot cores keep full strength.
  const specSig = '\treflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );';
  if (patched.includes(specSig)) {
    patched = patched.replace(specSig,
      '\tvec3 animeSpec = irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );\n' +
      `\treflectedLight.directSpecular += animeSpec * mix( ${f(CEL.spec)}, 1.0, smoothstep( 0.45, 1.1, dot( animeSpec, vec3( 0.299, 0.587, 0.114 ) ) ) );`);
  }
  // The cross-chunk flag RE_Direct reads (global, default 0 = banded).
  THREE.ShaderChunk.lights_physical_pars_fragment = 'float animeIsPoint = 0.0;\n' + patched;

  // Tag light TYPE at each RE_Direct call site: point + spot lights (the hero
  // light, mire spill) shade smooth like shipped; only sun-class directionals
  // (and rect areas, which don't route through RE_Direct_Physical's dotNL) band.
  let lfb = THREE.ShaderChunk.lights_fragment_begin;
  const tags = [
    ['getPointLightInfo( pointLight, geometryPosition, directLight );', 'animeIsPoint = 1.0;'],
    ['getSpotLightInfo( spotLight, geometryPosition, directLight );', 'animeIsPoint = 1.0;'],
    ['getDirectionalLightInfo( directionalLight, directLight );', 'animeIsPoint = 0.0;'],
  ];
  let tagged = 0;
  for (const [site, tag] of tags) {
    if (lfb.includes(site)) { lfb = lfb.replace(site, site + '\n\t\t' + tag); tagged++; }
  }
  if (tagged < 3) console.warn('[anime] light-type tagging incomplete (' + tagged + '/3) — vendored chunk drift.');
  THREE.ShaderChunk.lights_fragment_begin = lfb;
  _lightingInstalled = true;
}

// --- 2. Inverted-hull contour, DRAGON ONLY -----------------------------------
// The stable anime-game outline: for each solid mesh of the hero, add a
// backface shell inflated along the (pre-skin) normal. Geometry is SHARED with
// the source mesh (zero extra memory beyond the draw), the shell inherits the
// skeleton on skinned parts, and the whole thing dies with the dragon group on
// rebuild/dispose. One shared material per hull width bucket.
const _hullMats = new Map();
function hullMaterial(width) {
  const key = width.toFixed(3);
  if (_hullMats.has(key)) return _hullMats.get(key);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(HULL.r, HULL.g, HULL.b),
    side: THREE.BackSide,
  });
  mat.onBeforeCompile = (shader) => {
    // NOTE: the raw `normal` ATTRIBUTE, not objectNormal — MeshBasicMaterial's
    // vertex shader has no beginnormal_vertex chunk, so objectNormal doesn't
    // exist there (v2 round-1 compile error). Offsetting the bind-pose normal
    // before the skinning chunk is the standard inverted-hull approximation.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n\ttransformed += normal * ${width.toFixed(4)};`);
  };
  mat.customProgramCacheKey = () => 'animeHull' + key;
  _hullMats.set(key, mat);
  return mat;
}
function _isSolidMesh(o) {
  if (!o.isMesh || o.userData.isAnimeHull) return false;
  const m = o.material;
  if (!m || Array.isArray(m)) return false;
  if (m.transparent === true || m.depthWrite === false) return false;
  if (m.blending !== undefined && m.blending !== THREE.NormalBlending) return false;
  return true;
}
// Called from dragon.js right after the model group is built (and again on any
// rebuild — createDragon is the single build path). No-op without the flag.
export function applyAnimeHull(root) {
  if (!animeOn || HULL.width <= 0 || !root) return;
  const targets = [];
  root.traverse((o) => { if (_isSolidMesh(o)) targets.push(o); });
  for (const o of targets) {
    const geo = o.geometry;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    const r = geo.boundingSphere ? geo.boundingSphere.radius : 0;
    if (r < HULL.minPart) continue;                       // rivets/gems would blob
    const w = Math.min(HULL.width, r * HULL.widthCap);    // thin struts keep their read
    const mat = hullMaterial(w);
    let hull;
    if (o.isSkinnedMesh) {
      hull = new THREE.SkinnedMesh(geo, mat);
      hull.bindMode = o.bindMode;
      hull.bind(o.skeleton, o.bindMatrix);
    } else {
      hull = new THREE.Mesh(geo, mat);
    }
    hull.userData.isAnimeHull = true;
    hull.frustumCulled = o.frustumCulled;
    hull.layers.mask = o.layers.mask;
    o.add(hull);   // identity local transform → tracks the part exactly
  }
}

// --- 3. Vibrancy pass (composer, display-referred) ---------------------------
const AnimeShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },        // set only when sky bands are enabled
    uSkyBands: { value: SKY.bands },
    uSkyMix: { value: SKY.mix },
    uInk: { value: new THREE.Vector3(HULL.r, HULL.g, HULL.b) },
    uSat: { value: GRADE.sat },
    uLift: { value: GRADE.lift },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uSkyBands, uSkyMix, uSat, uLift;
    uniform vec3 uInk;
    varying vec2 vUv;
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      // Optional sky-ish luma bands (experiment dial, default OFF): applied by
      // brightness region only — no depth buffer in v2, so it grabs the bright
      // smooth field (sky) and protects the peak glow.
      if (uSkyMix > 0.001) {
        float bandT = smoothstep(0.25, 0.75, fract(lum * uSkyBands));
        float qSoft = mix(floor(lum * uSkyBands) / uSkyBands,
                          (floor(lum * uSkyBands) + 1.0) / uSkyBands, bandT);
        float peakProtect = 1.0 - smoothstep(0.60, 0.80, lum);
        col = mix(col, col * (qSoft / max(lum, 1e-4)), uSkyMix * peakProtect);
      }
      // Dyed blacks + vibrancy: cel shadows are colored, never void; the anime
      // frame must read at least as luminous as the shipped one.
      col = col + uInk * uLift * (1.0 - smoothstep(0.0, 0.35, lum));
      float l2 = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(l2), col, uSat);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

let _installed = false;
// Inserts the vibrancy pass after OutputPass (before the grade, so vignette +
// dither still run last). Call once after initPostFX. No-op off-flag.
export function initAnime() {
  if (!animeOn || _installed || !postfx.composer) return;
  const pass = new ShaderPass(AnimeShader);
  const gradeIdx = postfx.composer.passes.indexOf(postfx.gradingPass);
  postfx.composer.insertPass(pass, gradeIdx < 0 ? postfx.composer.passes.length : gradeIdx);
  // BLOOM RESTRAINT: the cel shadow-lift raises large surfaces in linear HDR
  // just past the 1.0 bloom threshold, and UnrealBloom integrates the whole
  // area into a white orb swallowing the hero. Anime bloom belongs to true
  // emissives only — raising the base threshold keeps the cel fills crisp.
  // (_baseBloomThreshold is read every frame by updatePostFX and survives tier
  // flips; setPostTier never resets it.)
  postfx._baseBloomThreshold = _qget('abloomth', 1.22);
  _installed = true;
}
