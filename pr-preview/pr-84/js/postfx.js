import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { GodRaysShader, GODRAY_TIERS } from './godrays.js';
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
    contrast: { value: 0.24 },     // 0..1 blend toward an S-curve (more punch)
    vignette: { value: 0.30 },
    aberration: { value: 0.0 },    // chromatic aberration strength
    lift: { value: 0.0 },          // fever warm-glow pulse
    liftTint: { value: new THREE.Vector3(0.10, 0.03, 0.08) }, // wash hue (magenta default)
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
    uniform vec3 liftTint;
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
      // Fever warm lift (hue per equipped dragon — magenta dragons, gold Phoenix)
      col += liftTint * lift * (1.0 - r2 * 1.6);
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
  godRayPass: null,
  gradingPass: null,
  _renderer: null,
  _scene: null,
  _camera: null,
  _w: 1,
  _h: 1,
  _pixelRatio: 1,
  _bloomScale: 0.5,
  _baseBloom: 0.24,
  _aberrationOn: true,
  _feverMix: 0,
  _feverTint: [0.10, 0.03, 0.08], // fever wash hue; setFeverTint() swaps per dragon
  _kickScale: 1, // tier 1 halves impulse magnitudes
};

// Fever-wash hue. Dragons wash magenta (the default); the Phoenix washes warm
// gold and a touch dimmer so its Rebirth reads celestial, never like Dragon
// Surge. Called on dragon equip; applied every frame in updatePostFX.
const FEVER_TINT_DEFAULT = [0.10, 0.03, 0.08];
export function setFeverTint(rgb) {
  postfx._feverTint = rgb || FEVER_TINT_DEFAULT;
}

// --- God-rays ---------------------------------------------------------------
// Sun screen position + base intensity are fed each frame from main.js (which
// owns the camera + sun projection). The tier sets the sample budget/scale; the
// per-frame update folds in a Surge ease-down and toggles the pass off when the
// sun is hidden so it costs nothing when you can't see it.
let _grSunX = 0.5, _grSunY = 0.85, _grIntensity = 0;
let _grTierScale = 1;

export function setGodRaySun(uvX, uvY, intensity) {
  _grSunX = uvX;
  _grSunY = uvY;
  _grIntensity = intensity;
}

function applyGodRayTier(tier) {
  if (!postfx.godRayPass) return;
  const g = GODRAY_TIERS[tier] || GODRAY_TIERS[GODRAY_TIERS.length - 1];
  const u = postfx.godRayPass.uniforms;
  u.uSamples.value = g.samples;
  u.uWeight.value = g.weight;
  _grTierScale = g.scale;
}

// --- Event-driven impulse kicks ---------------------------------------
// Five channels riding on top of the continuous dynamics, each an impulse
// that exp-decays back to zero. Presets keep shader-coupled tuning next to
// the shader; CONFIG.JUICE only maps events -> preset names.
const _kick = { bloom: 0, lift: 0, sat: 0, vig: 0, ab: 0 };
const KICK_DECAY = { bloom: 6, lift: 5, sat: 7, vig: 6, ab: 8 };
const KICK_MAX = { bloom: 0.36, lift: 0.6, sat: 0.35, vig: 0.25, ab: 0.010 };
let _flashFrames = 0;   // hard gold flash, decremented per PRESENTED frame
let _deathOn = false;
let _deathMix = 0;

const KICK_PRESETS = {
  goldenEmber:      { bloom: 0.30, lift: 0.35 },
  perfectMilestone: { flashFrames: 1, bloom: 0.20, lift: 0.20 },
  surgeStart:       { bloom: 0.24 },
  // The RED of a combo break comes from the existing #vignette DOM flash —
  // the shader's vignette is colorless darkening.
  comboBreak:       { sat: -0.25, vig: 0.18 },
};

export function kick(name) {
  if (!postfx.enabled) return; // tier 2 / unsupported: true no-op
  const p = KICK_PRESETS[name];
  if (!p) return;
  const s = postfx._kickScale;
  for (const c of Object.keys(_kick)) {
    if (p[c]) {
      _kick[c] = clamp(_kick[c] + p[c] * s, -KICK_MAX[c], KICK_MAX[c]);
    }
  }
  if (p.flashFrames) _flashFrames = Math.max(_flashFrames, p.flashFrames);
}

// Sustained death grade: desaturate + crush the edges across the crash
// freeze, released when the recap shows (fast decay) or on restart (instant).
// Unguarded by tier: this is STATE — a tier flap mid-death must not strand
// it (the uniform write is what tier-gates, in updatePostFX).
export function kickDeath() {
  _deathOn = true;
}

export function clearDeath(instant = false) {
  _deathOn = false;
  if (instant) _deathMix = 0;
}

// Test/debug introspection (read-only snapshot).
export function kickState() {
  return { ..._kick, flashFrames: _flashFrames, deathMix: _deathMix, deathOn: _deathOn };
}

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

  // God-rays sit AFTER bloom (so the bright bloomed sky feeds the shafts) and
  // BEFORE OutputPass (linear space → tonemapped consistently with the frame).
  const godRayPass = new ShaderPass(GodRaysShader);
  godRayPass.enabled = false; // off until the sun is on-screen / a tier turns it on
  composer.addPass(godRayPass);

  composer.addPass(new OutputPass());

  const gradingPass = new ShaderPass(GradingShader);
  composer.addPass(gradingPass);

  postfx.composer = composer;
  postfx.bloomPass = bloomPass;
  postfx.godRayPass = godRayPass;
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
    postfx._baseBloom = 0.24; // trimmed so the bright sky stops bleeding
    postfx._bloomScale = 0.5;
    postfx._aberrationOn = true;
    postfx._kickScale = 1;
    applyGodRayTier(0);
  } else {
    postfx._baseBloom = 0.20;
    postfx._bloomScale = 0.25;
    postfx._aberrationOn = false;
    postfx._kickScale = 0.5;
    applyGodRayTier(1);
  }
  postfx.bloomPass.strength = postfx._baseBloom;
  for (const c of Object.keys(_kick)) _kick[c] = 0; // no stale impulses across tiers
  _flashFrames = 0;
  applySize();
}

// Per-frame dynamics: speed-driven chromatic aberration, fever pulse, and
// the impulse kicks. Kicks decay with rawDt (real time) so a hitstop can't
// freeze its own flash on screen.
export function updatePostFX(dt, speedNorm, feverActive, rawDt = dt) {
  // State decays UNCONDITIONALLY — if the adaptive tier drops to 2 (composer
  // off) mid-decay, a frozen half-applied grade must not survive to pop back
  // when the tier restores.
  for (const c of Object.keys(_kick)) {
    _kick[c] = damp(_kick[c], 0, KICK_DECAY[c], rawDt);
  }
  if (_deathOn) _deathMix = Math.min(_deathMix + rawDt / 0.45, 1);
  else if (_deathMix > 0) _deathMix = damp(_deathMix, 0, 10, rawDt);

  if (!postfx.enabled) return;
  const u = postfx.gradingPass.uniforms;
  postfx._feverMix = damp(postfx._feverMix, feverActive ? 1 : 0, 4, dt);
  const flash = _flashFrames > 0 ? 1 : 0;

  // Surge adds a stronger radial chromatic streak (mild cinematic speed-lines)
  // at the frame edges, leaving the readable centre clean.
  const targetAb = postfx._aberrationOn
    ? clamp(speedNorm, 0, 1) * 0.012 + postfx._feverMix * 0.013
    : 0;
  u.aberration.value = damp(u.aberration.value, targetAb, 5, dt) + _kick.ab;
  // Surge wash kept deliberately LOW so rings/hazards/centre lane stay readable —
  // the dragon itself carries the spectacle (spine/core/wing-edge), not a full
  // screen-fill wash. Trimmed ~40% again: the white-hot Phoenix Rebirth was
  // washing out the entire frame and burying the silhouette + hazards.
  u.lift.value = postfx._feverMix * (0.24 + Math.sin(performance.now() * 0.006) * 0.09)
    + _kick.lift + flash * 0.26;
  u.liftTint.value.set(postfx._feverTint[0], postfx._feverTint[1], postfx._feverTint[2]);
  let sat = 1.18 + postfx._feverMix * 0.08 + _kick.sat;
  let vig = 0.30 + _kick.vig;
  // Bloom eases DOWN during Surge (clamped) so the bright scene/sky can't blow
  // out and bury the silhouette — the dragon's own emissive is far brighter and
  // still blooms, keeping the glow ON the dragon, not the whole screen.
  postfx.bloomPass.strength = Math.max(0.08,
    postfx._baseBloom + _kick.bloom + flash * 0.25 - postfx._feverMix * 0.07);

  // God-rays: ease down during Surge (the wash already lifts the frame) and
  // disable the whole pass when the sun is hidden so it costs nothing off-axis.
  if (postfx.godRayPass) {
    const inten = _grIntensity * _grTierScale * (1 - postfx._feverMix * 0.5);
    const gu = postfx.godRayPass.uniforms;
    gu.uSunUv.value.set(_grSunX, _grSunY);
    gu.uIntensity.value = inten;
    postfx.godRayPass.enabled = inten > 0.003;
  }

  // Death grade overrides last (state itself ramps/decays above).
  if (_deathMix > 0.001) {
    sat = sat + (0.25 - sat) * _deathMix;
    vig = vig + (0.62 - vig) * _deathMix;
  }
  u.saturation.value = sat;
  u.vignette.value = vig;
}

export function renderPostFX() {
  if (postfx.enabled) {
    postfx.composer.render();
    if (_flashFrames > 0) _flashFrames--; // "1 frame" = one PRESENTED frame
  } else {
    postfx._renderer.render(postfx._scene, postfx._camera);
  }
}
