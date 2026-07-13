import * as THREE from 'three';
import { setWaterReflectionSuspended } from './water.js';

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
  resizeGodRays();
}

export function setGodRaysReady(on) { _enabled = on && !!occRT; }
export function godRayTexture() { return occRT ? occRT.texture : null; }

export function resizeGodRays() {
  if (!occRT) return;
  occRT.setSize(Math.max(96, Math.floor(window.innerWidth * _maskScale)),
                Math.max(96, Math.floor(window.innerHeight * _maskScale)));
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
  _scene.background = _white;
  _camera.layers.set(0);
  setWaterReflectionSuspended(true); // sea draws black; skip its mirror render
  r.setRenderTarget(occRT);
  r.render(_scene, _camera);
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
    uDensity: { value: 0.85 },
    uDecay: { value: 0.96 },
    uWeight: { value: 1.05 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    #define MAX_SAMPLES ${GODRAY_MAX_SAMPLES}
    uniform sampler2D tDiffuse;
    uniform sampler2D tMask;
    uniform vec2 uSunUv;
    uniform float uIntensity, uSamples, uDensity, uDecay, uWeight;
    uniform vec3 uTint;
    varying vec2 vUv;
    void main() {
      vec4 scene = texture2D(tDiffuse, vUv);
      vec2 delta = (uSunUv - vUv) * (uDensity / uSamples);
      vec2 coord = vUv;
      float illum = 1.0;
      float shaft = 0.0;
      for (int i = 0; i < MAX_SAMPLES; i++) {
        if (float(i) >= uSamples) break;
        coord += delta;
        shaft += texture2D(tMask, coord).r * illum;
        illum *= uDecay;
      }
      shaft *= uWeight / uSamples;
      // Fade near the frame edges so the radial march can't smear a hard seam.
      vec2 e = smoothstep(vec2(0.0), vec2(0.14), vUv) * smoothstep(vec2(0.0), vec2(0.14), 1.0 - vUv);
      vec3 col = scene.rgb + uTint * shaft * uIntensity * (e.x * e.y);
      gl_FragColor = vec4(col, scene.a);
    }`,
};
