import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { damp, clamp } from './util.js';

// Post pipeline: RenderPass -> UnrealBloom -> OutputPass -> grading.
// The scene pass renders linear HDR (r160 skips tone mapping into render
// targets), bloom thresholds in linear light, OutputPass applies the
// renderer's ACES + sRGB encode, and grading runs last on display-referred
// color so the saturation/vignette lift behaves predictably.
// Tier 2 (or missing float-RT support) falls back to a raw renderer.render,
// which keeps ACES via renderer.toneMapping — tonally consistent.

const GradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.18 },
    vibrance: { value: 0.30 },
    contrast: { value: 0.16 },     // 0..1 blend toward an S-curve
    vignette: { value: 0.30 },
    aberration: { value: 0.0 },    // chromatic aberration strength
    lift: { value: 0.0 },          // fever warm-glow pulse
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float vibrance;
    uniform float contrast;
    uniform float vignette;
    uniform float aberration;
    uniform float lift;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * r2 * aberration;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      // Vibrance: pushes saturation harder on muted pixels, protects skin-of-
      // the-scene already-saturated areas from clipping into neon mush.
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float satNow = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));
      float satAmt = saturation + vibrance * (1.0 - clamp(satNow, 0.0, 1.0));
      col = mix(vec3(lum), col, satAmt);
      // Gentle S-curve contrast (smoothstep blend avoids hard clipping).
      vec3 curved = col * col * (3.0 - 2.0 * clamp(col, 0.0, 1.0));
      col = mix(col, curved, contrast);
      // Fever warm lift
      col += vec3(0.10, 0.03, 0.08) * lift * (1.0 - r2 * 1.6);
      // Vignette
      col *= 1.0 - vignette * smoothstep(0.18, 0.95, r2 * 2.4);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export const postfx = {
  enabled: false,
  supported: false,
  composer: null,
  bloomPass: null,
  gradingPass: null,
  _renderer: null,
  _scene: null,
  _camera: null,
  _w: 1,
  _h: 1,
  _pixelRatio: 1,
  _bloomScale: 0.5,
  _aberrationOn: true,
  _feverMix: 0,
};

export function initPostFX(renderer, scene, camera) {
  postfx._renderer = renderer;
  postfx._scene = scene;
  postfx._camera = camera;
  postfx._w = window.innerWidth;
  postfx._h = window.innerHeight;
  postfx._pixelRatio = renderer.getPixelRatio();

  const gl = renderer.getContext();
  postfx.supported = !!(
    renderer.capabilities.isWebGL2 &&
    (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))
  );
  if (!postfx.supported) return postfx;

  // Multisampled HalfFloat target: composer output keeps AA (canvas MSAA
  // doesn't apply to render targets) and HDR headroom for bloom.
  const rt = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(postfx._w / 2, postfx._h / 2), 0.32, 0.25, 1.0
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const gradingPass = new ShaderPass(GradingShader);
  composer.addPass(gradingPass);

  postfx.composer = composer;
  postfx.bloomPass = bloomPass;
  postfx.gradingPass = gradingPass;
  postfx.enabled = true;
  applySize();
  return postfx;
}

function applySize() {
  if (!postfx.composer) return;
  postfx.composer.setPixelRatio(postfx._pixelRatio);
  postfx.composer.setSize(postfx._w, postfx._h);
  // Bloom mip chain at a fraction of screen res (composer.setSize resets it
  // to full size, so re-apply after).
  postfx.bloomPass.setSize(postfx._w * postfx._bloomScale, postfx._h * postfx._bloomScale);
}

export function setPostSize(w, h) {
  postfx._w = w;
  postfx._h = h;
  applySize();
}

export function setPostPixelRatio(r) {
  postfx._pixelRatio = r;
  applySize();
}

// Tier 0: full bloom at half res + CA. Tier 1: lighter bloom at quarter res,
// no CA. Tier 2: composer off entirely (raw render keeps renderer ACES).
export function setPostTier(tier) {
  if (!postfx.supported) { postfx.enabled = false; return; }
  if (tier >= 2) {
    postfx.enabled = false;
    return;
  }
  postfx.enabled = true;
  if (tier === 0) {
    postfx.bloomPass.strength = 0.32;
    postfx._bloomScale = 0.5;
    postfx._aberrationOn = true;
  } else {
    postfx.bloomPass.strength = 0.26;
    postfx._bloomScale = 0.25;
    postfx._aberrationOn = false;
  }
  applySize();
}

// Per-frame dynamics: speed-driven chromatic aberration, fever pulse.
export function updatePostFX(dt, speedNorm, feverActive) {
  if (!postfx.enabled) return;
  const u = postfx.gradingPass.uniforms;
  postfx._feverMix = damp(postfx._feverMix, feverActive ? 1 : 0, 4, dt);
  const targetAb = postfx._aberrationOn
    ? clamp(speedNorm, 0, 1) * 0.012 + postfx._feverMix * 0.006
    : 0;
  u.aberration.value = damp(u.aberration.value, targetAb, 5, dt);
  u.lift.value = postfx._feverMix * (0.55 + Math.sin(performance.now() * 0.006) * 0.2);
  u.saturation.value = 1.18 + postfx._feverMix * 0.08;
}

export function renderPostFX() {
  if (postfx.enabled) postfx.composer.render();
  else postfx._renderer.render(postfx._scene, postfx._camera);
}
