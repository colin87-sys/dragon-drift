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
// SOFT MASK (Fable device R2): the binary occlusion mask gives razor shaft EDGES that the radial march
// can never soften (the march blurs ALONG a ray, not across occluder silhouettes). Blur the mask once
// into blurRT (a quarter-res 4-tap tent) before the march samples it → ~10px of penumbra on every shaft
// boundary → no more countable solid-edged bands. Runs inside the 1/3 mask duty-cycle → ~free on tier 0.
let blurRT = null, blurMat = null, blurScene = null, blurCam = null;
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
  // Blur target (no depth) + a fullscreen 4-tap tent that softens the mask edges.
  blurRT = new THREE.WebGLRenderTarget(2, 2, {
    depthBuffer: false, stencilBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  blurMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: occRT.texture }, uTexel: { value: new THREE.Vector2(1, 1) } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        vec2 o = uTexel * 1.25;              // diagonal tent; bilinear widens it for free
        float m = texture2D(tSrc, vUv + vec2( o.x,  o.y)).r
                + texture2D(tSrc, vUv + vec2(-o.x,  o.y)).r
                + texture2D(tSrc, vUv + vec2( o.x, -o.y)).r
                + texture2D(tSrc, vUv + vec2(-o.x, -o.y)).r;
        gl_FragColor = vec4(vec3(m * 0.25), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  blurScene = new THREE.Scene();
  blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat));
  blurCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  resizeGodRays();
}

export function setGodRaysReady(on) { _enabled = on && !!occRT; }
export function godRayTexture() { return blurRT ? blurRT.texture : null; }   // the march samples the SOFTENED mask

export function resizeGodRays() {
  if (!occRT) return;
  occRT.setSize(Math.max(96, Math.floor(window.innerWidth * _maskScale)),
                Math.max(96, Math.floor(window.innerHeight * _maskScale)));
  // Blur at HALF the mask scale (tier0: 0.5 mask → 0.25 blur); the 96px floor carries over.
  if (blurRT) {
    const bw = Math.max(96, Math.floor(window.innerWidth * _maskScale * 0.5));
    const bh = Math.max(96, Math.floor(window.innerHeight * _maskScale * 0.5));
    blurRT.setSize(bw, bh);
    blurMat.uniforms.uTexel.value.set(1 / bw, 1 / bh);
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
  _scene.background = _white;
  _camera.layers.set(0);
  setWaterReflectionSuspended(true); // sea draws black; skip its mirror render
  r.setRenderTarget(occRT);
  r.render(_scene, _camera);
  // Soften the mask (blur occRT → blurRT) in the SAME duty-cycle branch → the march samples soft edges.
  r.setRenderTarget(blurRT);
  r.render(blurScene, blurCam);
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
  if (blurMat) { blurMat.dispose(); blurMat = null; }
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
    uDensity: { value: 0.62 },   // PREMIUM (Fable): march reaches ~60% of the way, not the full frame (was 0.85 = edge-to-edge sunburst)
    uDecay: { value: 0.94 },     // shafts FADE by march-end (end-illum ~0.08) instead of persisting (was 0.96)
    uWeight: { value: 1.05 },
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
      shaft = shaft / (1.0 + 1.5 * shaft);   // soft knee — no shaft can blow to a neon band (all biomes)
      // Break the clean radial SUNBURST into drifting crepuscular BUNDLES, and CONFINE the light near the
      // source (real storm-light dies mid-frame, it doesn't span edge-to-edge). Two incommensurate sines on
      // the angle around the sun, drifting glacially (never strobes); confinement fades before the frame edge.
      float ang  = atan(dvec.y, dvec.x);
      float dist = length(dvec);
      // RADIAL SHEAR (Fable device R2): drift the bundle phase with distance from the source so lobe edges
      // CURVE instead of raying out as straight countable spokes — that geometric straightness is what read
      // "vector-graphic." Non-integer freqs (5.3/12.7) kill the even 4–5 beat; the higher floor (0.70, amp
      // 0.30) keeps gaps to ~0.67× (modulation, never on/off wedges) so no band is individually traceable.
      float ph = dist * 2.6;
      float bundles = 0.70 + 0.30 * sin(ang * 5.3 + ph + uTime * 0.11)
                           * sin(ang * 12.7 - ph * 0.6 - uTime * 0.05);
      shaft *= mix(1.0, bundles, uBreak);
      shaft *= smoothstep(1.05, 0.18, dist);
      // Fade near the frame edges so the radial march can't smear a hard seam.
      vec2 e = smoothstep(vec2(0.0), vec2(0.14), vUv) * smoothstep(vec2(0.0), vec2(0.14), 1.0 - vUv);
      vec3 col = scene.rgb + uTint * shaft * uIntensity * (e.x * e.y);
      gl_FragColor = vec4(col, scene.a);
    }`,
};
