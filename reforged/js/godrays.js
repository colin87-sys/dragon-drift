import * as THREE from 'three';
import { setWaterReflectionSuspended } from './water.js';
import { CLOUD_HEAD, cloudUniforms } from './skyClouds.js';

// Occlusion-masked god-rays (the "done right" version).
//
// The old pass radial-blurred the whole lit frame, so the always-centred white
// rings + dragon emissive smeared into a bloom halo. This one instead renders a
// cheap half-res OCCLUSION MASK each frame — sky = white (light source), every
// solid gameplay object = black (occluder) — and radial-blurs THAT toward the
// sun. Shafts therefore stream only from open sky and are cleanly *blocked* by
// silhouettes (dragon, rings, props), exactly like real crepuscular rays. Bright
// foreground objects can never produce a halo because they are black in the mask.
//
// Cost: one extra half-res scene pass with a trivial black material, plus the
// radial-blur ShaderPass. Tier-0 only; disables itself when the sun is off-axis.

export const GODRAY_MAX_SAMPLES = 48;

let occRT = null, blackMat = null;
// SOFT MASK (Fable device R3): the binary occlusion mask gives razor shaft EDGES the radial march can never
// soften (the march blurs ALONG a ray, not across occluder silhouettes). A THREE-pass chain runs inside the
// 1/3 mask duty-cycle (~free on tier 0), ping-ponging between two half-of-mask-res targets:
//   (0) ERODE — 5-tap MIN dilates the dark occluder and CLOSES sub-texel bright gaps (arch crowns / stack
//       tips leaking a thin bright line). A blur SPREADS a bright gap; only an erode closes it.
//   (1) TENT 1.5  → (2) TENT 3.25  — two Kawase iterations → ~16 full-res texels of penumbra so no residual
//       shaft edge survives as a countable line, judged at the owner's 1-stop-darker exposure.
let blurRT = null, blur2RT = null, erodeMat = null, tentMat = null, blurScene = null, blurCam = null, blurMesh = null;
// NEGATIVE-OF-THE-CLOUDS (owner direction): instead of softening a binary mask forever, CARVE the light
// field itself with the cloud coverage. gapMat paints the mask BACKGROUND as `1 - uCarve*cloudCov(viewDir)`
// — the sky's own gap-field — BEFORE the black occluders draw on top. The existing radial march then streams
// shafts through the cloud GAPS and blocks them under cloud BODIES, so the shafts are curved, organic, and
// uncountable (the deck is the modulation, not a sine). Same principle as the Godhead emergent-cross /
// Embertide negative-relief: an emergent feature must be gated by the SAME field as the substance it emerges
// from. Only active where clouds are visible (uCloudAmount>0); every other biome keeps the byte-identical
// white-background path. Escape hatch: ?carve=0.
let gapMat = null;
let _carve = true;
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('carve') === '0') _carve = false;
export function setGodRayCarve(on) { _carve = !!on; }
const _cr = new THREE.Vector3(), _cu = new THREE.Vector3(), _cf = new THREE.Vector3();
let _renderer = null, _scene = null, _camera = null, _sky = null;
let _enabled = false;
// N11 — mask render scale, now per-tier: tier0 keeps 0.5 (half-res, shipped), tier1
// drops to 0.25 (quarter-res — the radial blur hides it) so mid-range phones can
// afford god-rays. A hard 96-px/axis floor guards the small-viewport hazard: the
// occRT is sized in CSS pixels (no pixelRatio), so on a ~390-CSS-px phone quarter-res
// would be ~98 px — any lower and thin occluders (ring rims, wingtips) drop out and
// shafts bleed through them. The floor is a no-op at tier0 for any viewport ≥ 192 px.
let _maskScale = 0.5;
export function setGodRayMaskScale(s) { _maskScale = s; resizeGodRays(); }
export function godRayMaskScale() { return _maskScale; }
const _white = new THREE.Color(0xffffff);

export function initGodRays(renderer, scene, camera, sky) {
  _renderer = renderer; _scene = scene; _camera = camera; _sky = sky;
  blackMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
  occRT = new THREE.WebGLRenderTarget(2, 2, {
    depthBuffer: true, stencilBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  // Two ping-pong blur targets (no depth) for the erode→tent→tent chain.
  const rtOpts = { depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  blurRT = new THREE.WebGLRenderTarget(2, 2, rtOpts);
  blur2RT = new THREE.WebGLRenderTarget(2, 2, rtOpts);
  const _vs = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  // ERODE — dilate the dark occluder (min of 5 taps) to CLOSE thin bright leak-lines.
  erodeMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) } },
    vertexShader: _vs,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        vec2 o = uTexel;
        float m = texture2D(tSrc, vUv).r;
        m = min(m, texture2D(tSrc, vUv + vec2( o.x,  o.y)).r);
        m = min(m, texture2D(tSrc, vUv + vec2(-o.x,  o.y)).r);
        m = min(m, texture2D(tSrc, vUv + vec2( o.x, -o.y)).r);
        m = min(m, texture2D(tSrc, vUv + vec2(-o.x, -o.y)).r);
        gl_FragColor = vec4(vec3(m), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  // TENT — 4-tap diagonal average with a per-pass offset (bilinear widens each tap for free).
  tentMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) }, uOff: { value: 1.5 } },
    vertexShader: _vs,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uOff; varying vec2 vUv;
      void main() {
        vec2 o = uTexel * uOff;
        float m = texture2D(tSrc, vUv + vec2( o.x,  o.y)).r
                + texture2D(tSrc, vUv + vec2(-o.x,  o.y)).r
                + texture2D(tSrc, vUv + vec2( o.x, -o.y)).r
                + texture2D(tSrc, vUv + vec2(-o.x, -o.y)).r;
        gl_FragColor = vec4(vec3(m * 0.25), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  // GAP-FIELD — paints the light field as `1 - uCarve*cloudCov(viewDir)`. Reconstructs the world view dir
  // per pixel from the camera basis (uCamRight/uCamUp/uCamFwd already fold tan(fov/2)·aspect), matching the
  // sky dome's own `normalize(position)` dir so the carve registers with the visible clouds. Shares the cloud
  // uniform OBJECTS by reference so amount/drift/warp/octaves/time stay in lockstep with the deck.
  gapMat = new THREE.ShaderMaterial({
    uniforms: {
      uCloudAmount: cloudUniforms.uCloudAmount,
      uCloudDrift: cloudUniforms.uCloudDrift,
      uCloudWindCrawl: cloudUniforms.uCloudWindCrawl,
      uCloudOctaves: cloudUniforms.uCloudOctaves,
      uCloudWarp: cloudUniforms.uCloudWarp,
      uCloudTime: cloudUniforms.uCloudTime,
      uCarve: { value: 0.85 },   // how deeply cloud bodies bite into the light field (1 = fully dark under core)
      uCamRight: { value: new THREE.Vector3() },
      uCamUp: { value: new THREE.Vector3() },
      uCamFwd: { value: new THREE.Vector3() },
    },
    vertexShader: _vs,
    fragmentShader: /* glsl */`
      ${CLOUD_HEAD}
      uniform vec3 uCamRight, uCamUp, uCamFwd;
      uniform float uCloudTime, uCarve;
      varying vec2 vUv;
      void main() {
        vec2 ndc = vUv * 2.0 - 1.0;
        vec3 d = normalize(uCamFwd + ndc.x * uCamRight + ndc.y * uCamUp);
        float h = clamp(d.y, 0.0, 1.0);
        float cov = _cloudCov(d, h, uCloudTime);
        gl_FragColor = vec4(vec3(1.0 - uCarve * cov), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  blurScene = new THREE.Scene();
  blurMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), erodeMat);
  blurScene.add(blurMesh);
  blurCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  resizeGodRays();
}

export function setGodRaysReady(on) { _enabled = on && !!occRT; }
export function godRayTexture() { return blur2RT ? blur2RT.texture : null; }   // the march samples the fully-softened mask (final chain output)

export function resizeGodRays() {
  if (!occRT) return;
  occRT.setSize(Math.max(96, Math.floor(window.innerWidth * _maskScale)),
                Math.max(96, Math.floor(window.innerHeight * _maskScale)));
  // Blur chain at HALF the mask scale (tier0: 0.5 mask → 0.25 blur); the 96px floor carries over.
  if (blurRT) {
    const bw = Math.max(96, Math.floor(window.innerWidth * _maskScale * 0.5));
    const bh = Math.max(96, Math.floor(window.innerHeight * _maskScale * 0.5));
    blurRT.setSize(bw, bh);
    blur2RT.setSize(bw, bh);
    erodeMat.uniforms.uTexel.value.set(1 / bw, 1 / bh);
    tentMat.uniforms.uTexel.value.set(1 / bw, 1 / bh);
  }
}

// Render the sky=white / geometry=black mask. Called once per frame, right
// before the composer, only while god-rays are active.
let _maskParity = 0, _maskEver = false;
export function renderGodRayMask() {
  if (!_enabled || !occRT || !_renderer) return;
  // DUTY-CYCLE + STAGGER: the mask is a FULL extra scene render (~169 draw calls — every layer-0 mesh
  // with a black override). The occluder silhouette + camera move slowly and the shafts are broad,
  // radial-blurred columns, so a few-frame-stale mask is imperceptible; the shaft shader still runs every
  // frame against the kept occRT. Render ~1/3 of frames (20Hz), on a parity STAGGERED off the water
  // mirror (EVEN _parity) so the two full-scene passes don't stack. Always render the FIRST call so occRT
  // is never a black mask. (The clean structural win — deriving the mask from the depth buffer to drop
  // this pass entirely — is deferred pending real-GPU MSAA-depth verification.)
  const p = _maskParity++;
  if (_maskEver && (p % 3) !== 1) return;
  _maskEver = true;
  const r = _renderer;
  const pTarget = r.getRenderTarget();
  const pOverride = _scene.overrideMaterial;
  const pBg = _scene.background;
  const pSkyVis = _sky ? _sky.visible : true;
  const pMask = _camera.layers.mask;
  // Sky hidden + background white = the light field; black override paints every
  // solid occluder. Layer 0 only, so additive sprites (trails/particles) on
  // layer 1 don't punch flickery holes in the mask.
  if (_sky) _sky.visible = false;
  _scene.overrideMaterial = blackMat;
  _camera.layers.set(0);
  setWaterReflectionSuspended(true); // sea draws black; skip its mirror render
  r.setRenderTarget(occRT);
  const carving = _carve && gapMat && cloudUniforms.uCloudAmount.value > 0.0001;
  if (carving) {
    // TWO-RENDER carve: (1) paint the cloud gap-field as the light background via the ortho quad, then
    // (2) draw the black occluders ON TOP without clearing color. The sky region is thus the cloud
    // negative (bright gaps, dark cloud bodies) and geometry silhouettes still punch black.
    const e = _camera.matrixWorld.elements;
    const th = Math.tan((_camera.fov * 0.5) * Math.PI / 180.0);
    _cr.set(e[0], e[1], e[2]).multiplyScalar(th * _camera.aspect);   // camera right · tan(fov/2)·aspect
    _cu.set(e[4], e[5], e[6]).multiplyScalar(th);                    // camera up · tan(fov/2)
    _cf.set(-e[8], -e[9], -e[10]);                                   // camera forward (−Z world axis)
    gapMat.uniforms.uCamRight.value.copy(_cr);
    gapMat.uniforms.uCamUp.value.copy(_cu);
    gapMat.uniforms.uCamFwd.value.copy(_cf);
    _scene.background = null;
    blurMesh.material = gapMat;
    r.render(blurScene, blurCam);        // fill occRT with the gap-field (no depth interaction)
    const pAutoClearColor = r.autoClearColor;
    r.autoClearColor = false;            // keep the gap-field; occluders overwrite black where drawn
    r.render(_scene, _camera);           // depth still auto-clears → occluders self-sort correctly
    r.autoClearColor = pAutoClearColor;
  } else {
    _scene.background = _white;
    r.render(_scene, _camera);
  }
  // SOFTEN the mask in-branch: erode (close leaks) → tent 1.5 → tent 3.25, ping-ponging blurRT/blur2RT.
  erodeMat.uniforms.tSrc.value = occRT.texture;   // (0) erode occRT → blur2RT
  blurMesh.material = erodeMat;
  r.setRenderTarget(blur2RT); r.render(blurScene, blurCam);
  blurMesh.material = tentMat;
  tentMat.uniforms.tSrc.value = blur2RT.texture; tentMat.uniforms.uOff.value = 1.5;   // (1) tent blur2RT → blurRT
  r.setRenderTarget(blurRT); r.render(blurScene, blurCam);
  tentMat.uniforms.tSrc.value = blurRT.texture; tentMat.uniforms.uOff.value = 3.25;   // (2) tent blurRT → blur2RT (final)
  r.setRenderTarget(blur2RT); r.render(blurScene, blurCam);
  // restore everything the main render relies on
  setWaterReflectionSuspended(false);
  r.setRenderTarget(pTarget);
  _scene.overrideMaterial = pOverride;
  _scene.background = pBg;
  if (_sky) _sky.visible = pSkyVis;
  _camera.layers.mask = pMask;
}

export function disposeGodRays() {
  if (occRT) { occRT.dispose(); occRT = null; }
  if (blurRT) { blurRT.dispose(); blurRT = null; }
  if (blur2RT) { blur2RT.dispose(); blur2RT = null; }
  if (erodeMat) { erodeMat.dispose(); erodeMat = null; }
  if (tentMat) { tentMat.dispose(); tentMat = null; }
  if (gapMat) { gapMat.dispose(); gapMat = null; }
  if (blackMat) { blackMat.dispose(); blackMat = null; }
  _enabled = false;
}

// Radial light-scatter pass: marches each pixel toward the sun through the mask,
// accumulating "light reached" with a decaying weight. Added in LINEAR space
// before OutputPass so it tonemaps with the rest of the frame.
export const GodRaysShader = {
  uniforms: {
    tDiffuse: { value: null },   // composited scene (set by the composer)
    tMask: { value: null },      // occlusion mask (sky=1, geometry=0)
    uSunUv: { value: new THREE.Vector2(0.5, 0.8) },
    uIntensity: { value: 0.0 },
    uTint: { value: new THREE.Vector3(1.0, 0.9, 0.72) },
    uSamples: { value: 40.0 },
    uDensity: { value: 0.55 },   // Fable R3: shorten the march further — less straight-line travel = less "ray" readability
    uDecay: { value: 0.90 },     // faster decay → shafts die sooner, shortening the readable streak
    uWeight: { value: 0.80 },    // lower peak (was 1.05) — the "solid" read is peak luminance
    uTime: { value: 0.0 },       // slow drift for the crepuscular bundles (visual only)
    uBreak: { value: 0.35 },     // per-biome sunburst-break strength (0 = clean radial; higher = broken into bundles)
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    #define MAX_SAMPLES ${GODRAY_MAX_SAMPLES}
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform vec2 uSunUv;
    uniform float uIntensity, uSamples, uDensity, uDecay, uWeight, uTime, uBreak;
    uniform vec3 uTint;
    varying vec2 vUv;
    // Interleaved gradient noise — cheap, well-distributed per-pixel dither (kills the march banding
    // that reads as clean geometric wedges = the "vaporwave sunburst" cheap tell).
    float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
    void main() {
      vec4 scene = texture2D(tDiffuse, vUv);
      vec2 dvec  = uSunUv - vUv;
      vec2 delta = dvec * (uDensity / uSamples);
      vec2 coord = vUv + delta * ign(gl_FragCoord.xy);   // DITHERED start (full one-step jitter) → the noise averages over the taps into smooth gradients, not razor bands
      float illum = 1.0;
      float shaft = 0.0;
      for (int i = 0; i < MAX_SAMPLES; i++) {
        if (float(i) >= uSamples) break;
        coord += delta;
        shaft += texture2D(tMask, coord).r * illum;
        illum *= uDecay;
      }
      shaft *= uWeight / uSamples;
      shaft = shaft / (1.0 + 2.4 * shaft);   // Fable R3: HARDER knee (was 1.5) — crushes peak luminance, the "solid" read
      // A single SLOW radial drift, not discrete lobes (Fable R3 device call): on a dark screen countability
      // comes from the GAPS between lobes, so a near-flat floor with one low-freq sine cannot be counted. The
      // radial shear (phase drifts with distance) keeps what little modulation remains curved, not spoked.
      float ang  = atan(dvec.y, dvec.x);
      float dist = length(dvec);
      float ph = dist * 2.6;
      float bundles = 0.86 + 0.14 * sin(ang * 5.3 + ph + uTime * 0.11);   // floor 0.86, amp 0.14 → gaps barely modulate; dropped the high-freq (12.7) term that made discrete stripes
      shaft *= mix(1.0, bundles, uBreak);
      shaft *= smoothstep(1.05, 0.18, dist);
      // Fade near the frame edges so the radial march can't smear a hard seam.
      vec2 e = smoothstep(vec2(0.0), vec2(0.14), vUv) * smoothstep(vec2(0.0), vec2(0.14), 1.0 - vUv);
      vec3 col = scene.rgb + uTint * shaft * uIntensity * (e.x * e.y);
      gl_FragColor = vec4(col, scene.a);
    }`,
};
