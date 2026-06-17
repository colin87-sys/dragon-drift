// Cinematic post chain: HDR render → bloom → ACES output → final grade.
// The grade is GODFALL's look: filmic S-curve, split-toned shadows/highlights,
// per-arena color cast, witch-time desaturation, finisher white-out, and a
// radial blur that fires during warp travel. Tier 2 drops the composer
// entirely (renderer ACES keeps the image consistent, just plainer).

import * as THREE from 'three';
import { EffectComposer } from '../../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../../lib/postprocessing/RenderPass.js';
import { ShaderPass } from '../../lib/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../../lib/postprocessing/OutputPass.js';
import { damp, clamp } from './util.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.07 },
    contrast: { value: 0.22 },
    vignette: { value: 0.36 },
    splitTone: { value: 0.14 },                       // teal shadows / warm highs
    tint: { value: new THREE.Color(1, 1, 1) },        // arena cast (multiply)
    desat: { value: 0 },                              // witch-time
    flash: { value: 0 },                              // finisher white-out
    radial: { value: 0 },                             // warp travel blur
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float saturation, contrast, vignette, splitTone, desat, flash, radial;
    uniform vec3 tint;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      // Radial warp blur: 3 extra taps sliding toward screen center.
      if (radial > 0.001) {
        vec3 acc = col;
        for (int i = 1; i <= 3; i++) {
          float k = radial * 0.05 * float(i);
          acc += texture2D(tDiffuse, vUv - d * k).rgb;
        }
        col = acc * 0.25;
      }
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lum), col, saturation * (1.0 - desat * 0.85));
      // Filmic S-curve
      vec3 curved = col * col * (3.0 - 2.0 * clamp(col, 0.0, 1.0));
      col = mix(col, curved, contrast);
      // Split tone: cool the shadows, warm the highlights.
      float shadow = 1.0 - smoothstep(0.0, 0.55, lum);
      float high = smoothstep(0.5, 1.0, lum);
      col += vec3(-0.04, 0.015, 0.06) * shadow * splitTone * 7.0 * (1.0 - desat);
      col += vec3(0.05, 0.02, -0.03) * high * splitTone * 7.0;
      col *= tint;
      // Witch-time: lift the blacks faintly blue so slow-mo reads instantly.
      col += vec3(0.02, 0.05, 0.09) * desat;
      col *= 1.0 - vignette * smoothstep(0.16, 0.9, r2 * 2.5);
      col = mix(col, vec3(1.0), clamp(flash, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

const fx = {
  enabled: false,
  supported: false,
  composer: null,
  bloom: null,
  grade: null,
  renderer: null,
  scene: null,
  camera: null,
  w: 1, h: 1, pr: 1,
  bloomScale: 0.5,
  desatTarget: 0,
  radialTarget: 0,
  flashValue: 0,
};

export function initPostFX(renderer, scene, camera) {
  fx.renderer = renderer;
  fx.scene = scene;
  fx.camera = camera;
  fx.w = window.innerWidth;
  fx.h = window.innerHeight;
  fx.pr = renderer.getPixelRatio();

  const gl = renderer.getContext();
  fx.supported = !!(renderer.capabilities.isWebGL2 &&
    (gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float')));
  if (!fx.supported) return;

  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  fx.composer = new EffectComposer(renderer, rt);
  fx.composer.addPass(new RenderPass(scene, camera));
  fx.bloom = new UnrealBloomPass(new THREE.Vector2(fx.w / 2, fx.h / 2), 0.55, 0.3, 0.78);
  fx.composer.addPass(fx.bloom);
  fx.composer.addPass(new OutputPass());
  fx.grade = new ShaderPass(GradeShader);
  fx.composer.addPass(fx.grade);
  fx.enabled = true;
  applySize();
}

function applySize() {
  if (!fx.composer) return;
  fx.composer.setPixelRatio(fx.pr);
  fx.composer.setSize(fx.w, fx.h);
  fx.bloom.setSize(fx.w * fx.bloomScale, fx.h * fx.bloomScale);
}

export function setPostSize(w, h) {
  fx.w = w; fx.h = h;
  applySize();
}

export function setPostPixelRatio(r) {
  fx.pr = r;
  applySize();
}

export function setPostTier(tier) {
  if (!fx.supported) { fx.enabled = false; return; }
  if (tier >= 2) { fx.enabled = false; return; }
  fx.enabled = true;
  if (tier === 0) {
    fx.bloom.strength = 0.55;
    fx.bloomScale = 0.5;
  } else {
    fx.bloom.strength = 0.42;
    fx.bloomScale = 0.25;
  }
  applySize();
}

export function setArenaTint(hex) {
  if (fx.grade) fx.grade.uniforms.tint.value.setHex(hex);
}

export function setWitchTime(on) { fx.desatTarget = on ? 1 : 0; }
export function setRadialBlur(v) { fx.radialTarget = clamp(v, 0, 1); }

// Instant white pop that decays in updatePostFX.
export function flashWhite(strength = 1) { fx.flashValue = Math.max(fx.flashValue, strength); }

export function updatePostFX(dt) {
  if (!fx.enabled) return;
  const u = fx.grade.uniforms;
  u.desat.value = damp(u.desat.value, fx.desatTarget, 9, dt);
  u.radial.value = damp(u.radial.value, fx.radialTarget, 14, dt);
  fx.flashValue = Math.max(0, fx.flashValue - dt * 2.4);
  u.flash.value = fx.flashValue;
}

export function renderPostFX() {
  if (fx.enabled) fx.composer.render();
  else fx.renderer.render(fx.scene, fx.camera);
}
