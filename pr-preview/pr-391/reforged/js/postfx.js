import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { GodRaysShader, initGodRays, renderGodRayMask, setGodRaysReady, godRayTexture, resizeGodRays } from './godrays.js';
import { damp, clamp } from './util.js';
import { game } from './gameState.js';

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
    uDither: { value: 1.0 },       // N1: 1 = dither ON (kill with ?dither=0), 0 = shipped
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
    uniform float uDither;
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
      // N1 — dither the last step before the 8-bit write (Jimenez interleaved
      // gradient noise, ±0.5 LSB): kills banding on the big smooth sky/fog/water
      // gradients. Cheap (~4 ALU); covers tier0/1 (the composed path). ?dither=0
      // zeroes uDither for a clean A/B.
      float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      col += (ign - 0.5) * (1.0 / 255.0) * uDither;
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

// --- God-rays (occlusion-masked) --------------------------------------------
// Sun screen position + base intensity fed each frame from main.js. The mask
// render + pass are TIER-0 ONLY (the extra half-res scene pass costs too much
// lower down), and the pass disables itself when the sun is hidden so it is free
// off-axis. `_grAvailable` = tier 0 and the occlusion buffer is initialised.
let _grSunX = 0.5, _grSunY = 0.8, _grIntensity = 0;
let _grAvailable = false;
let _grTier0 = true;

export function setGodRaySun(uvX, uvY, intensity) {
  _grSunX = uvX; _grSunY = uvY; _grIntensity = intensity;
}
// ARENA (PR-B): THE UNVEILED HEAVEN swells the god-rays (the #1 holy carrier — a gallery of light
// shafts). Bounded by a HARD authored cap so the boosted shafts never lift the effective bullet-
// background luminance past the fairness bar (the byte-space contrast gate can't see the shader's
// additive shafts — the fairness PROBE in unmaskedarena.mjs is the merge-blocking authority). 0 = the
// shipped intensity, byte-identical for every non-heaven frame.
let _grBoost = 0;
const GODRAY_HEAVEN_SWELL = 0.45;   // max +45% over base (O-B1 owner dial) — tempered so the unveiling reads "lit not blinding"
const GODRAY_INTEN_CAP = 1.0;       // hard ceiling on uIntensity — only a rendered frame bounds the OUTPUT (the probe)
export function setGodRayBoost(k) { _grBoost = Math.max(0, Math.min(1, k)); }

// Called once after the world (and its sky) exist — wires the occlusion buffer
// to the pass. Safe no-op if post-FX is unsupported.
export function setupGodRays(scene, camera, sky) {
  if (!postfx.supported || !postfx.godRayPass) return;
  initGodRays(postfx._renderer, scene, camera, sky);
  postfx.godRayPass.uniforms.tMask.value = godRayTexture();
  _grAvailable = true;
  // Boot is tier 0 (applyQuality only runs on a tier CHANGE), so arm the mask now.
  setGodRaysReady(_grTier0 && _grAvailable);
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
// Boss-time stage-management grade: the world mid-tones itself so bullets own
// the extremes (Cave black-label logic). Target rides boss.js's phase/shielded
// signal (0 idle, 0.6 warn/approach/fight, 1.0 shielded) — see updatePostFX.
let _bossMix = 0;

const KICK_PRESETS = {
  goldenEmber:      { bloom: 0.30, lift: 0.35 },
  perfectMilestone: { flashFrames: 1, bloom: 0.20, lift: 0.20 },
  surgeStart:       { bloom: 0.24 },
  // The RED of a combo break comes from the existing #vignette DOM flash —
  // the shader's vignette is colorless darkening.
  comboBreak:       { sat: -0.25, vig: 0.18 },
  // KNELLGRAVE's toll-as-world-event (§5d slot 10): the frame FLINCHES on the beat —
  // a bloom breath + a vignette squeeze that decays with the ring. The toll is the
  // loudest thing on screen precisely because the music is dead.
  bossToll:         { bloom: 0.16, vig: 0.12 },
  // PR-B: the reserved lance CLIMAX — a 1-frame jade-bright bloom+lift punch (the
  // tier-0 enhancement layered over the tier-independent DOM #jade-flash). No-op
  // at tier2/unsupported, which is why the DOM flash carries the guaranteed read.
  wispFinale:       { flashFrames: 1, bloom: 0.28, lift: 0.26 },
  // ARENA (PR-A): the S1→S2 crack FLOOD — a 1-frame overexpose punch as the tear reopens and the
  // hollow leaks through, before the palette drains into the void (caps: bloom ≤ 0.36 / lift ≤ 0.6).
  arenaFlood:       { flashFrames: 1, bloom: 0.30, lift: 0.40 },
  // ARENA (PR-B): the S2→S3 UNVEILING — a gold bloom punch as the light blooms outward from the boss
  // (within caps 0.36/0.6; tier 1 halves, tier 2 no-ops — the palette lerp carries it on weak mobile).
  arenaUnveil:      { flashFrames: 1, bloom: 0.32, lift: 0.45 },
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
  return { ..._kick, flashFrames: _flashFrames, deathMix: _deathMix, deathOn: _deathOn, bossMix: _bossMix };
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

  // God-rays: AFTER bloom (so the bloomed sky reads bright) and BEFORE OutputPass
  // (linear add → tonemapped with the rest of the frame). Off until setupGodRays
  // wires the mask and a tier-0 sun turns it on.
  const godRayPass = new ShaderPass(GodRaysShader);
  godRayPass.enabled = false;
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
  resizeGodRays();
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

// N1 — toggle the grading-pass dither (default on). ?dither=0 turns it off for a
// clean before/after A/B; the shipped look is dither ON.
export function setDither(on) {
  if (postfx.gradingPass) postfx.gradingPass.uniforms.uDither.value = on ? 1.0 : 0.0;
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
  _grTier0 = tier === 0;
  if (tier === 0) {
    postfx._baseBloom = 0.24; // trimmed so the bright sky stops bleeding
    postfx._bloomScale = 0.5;
    postfx._aberrationOn = true;
    postfx._kickScale = 1;
  } else {
    postfx._baseBloom = 0.20;
    postfx._bloomScale = 0.25;
    postfx._aberrationOn = false;
    postfx._kickScale = 0.5;
  }
  // God-rays are tier-0 only; force the pass off (and stop the mask render) below.
  setGodRaysReady(_grTier0 && _grAvailable);
  if (postfx.godRayPass && !_grTier0) postfx.godRayPass.enabled = false;
  postfx.bloomPass.strength = postfx._baseBloom;
  for (const c of Object.keys(_kick)) _kick[c] = 0; // no stale impulses across tiers
  _flashFrames = 0;
  applySize();
}

// Per-frame dynamics: speed-driven chromatic aberration, fever pulse, and
// the impulse kicks. Kicks decay with rawDt (real time) so a hitstop can't
// freeze its own flash on screen.
export function updatePostFX(dt, speedNorm, feverActive, rawDt = dt, bossTarget = 0, canyonSpeedMix = 0) {
  // State decays UNCONDITIONALLY — if the adaptive tier drops to 2 (composer
  // off) mid-decay, a frozen half-applied grade must not survive to pop back
  // when the tier restores.
  for (const c of Object.keys(_kick)) {
    _kick[c] = damp(_kick[c], 0, KICK_DECAY[c], rawDt);
  }
  if (_deathOn) _deathMix = Math.min(_deathMix + rawDt / 0.45, 1);
  else if (_deathMix > 0) _deathMix = damp(_deathMix, 0, 10, rawDt);
  // Boss grade: same unconditional-decay guarantee as _deathMix (teardown/
  // death/abandon mid-fight must never strand the dim) — ease ~1s both ways,
  // the feverMix damp idiom below, but computed here (not gated on
  // postfx.enabled) so a tier flap can't strand it either.
  _bossMix = damp(_bossMix, bossTarget, 4, rawDt);

  if (!postfx.enabled) return;
  const u = postfx.gradingPass.uniforms;
  postfx._feverMix = damp(postfx._feverMix, feverActive ? 1 : 0, 4, dt);
  const flash = _flashFrames > 0 ? 1 : 0;

  // Surge adds a stronger radial chromatic streak (mild cinematic speed-lines)
  // at the frame edges, leaving the readable centre clean.
  const targetAb = postfx._aberrationOn
    ? clamp(speedNorm, 0, 1) * 0.012 + postfx._feverMix * 0.013
      + clamp(canyonSpeedMix, 0, 1) * clamp(speedNorm, 0, 1) * 0.014 // spine speed-tunnel streak
    : 0;
  u.aberration.value = damp(u.aberration.value, targetAb, 5, dt) + _kick.ab;
  // Surge wash kept deliberately LOW so rings/hazards/centre lane stay readable —
  // the dragon itself carries the spectacle (spine/core/wing-edge), not a full
  // screen-fill wash. Trimmed ~40% again: the white-hot Phoenix Rebirth was
  // washing out the entire frame and burying the silhouette + hazards.
  u.lift.value = postfx._feverMix * (0.24 + Math.sin(performance.now() * 0.006) * 0.09)
    + _kick.lift + flash * 0.26;
  u.liftTint.value.set(postfx._feverTint[0], postfx._feverTint[1], postfx._feverTint[2]);
  // Boss-time stage management: the world mid-tones itself (sat/vig/bloom ease
  // toward this at mix=1) so the bullets are the most vivid thing on screen —
  // scales linearly with _bossMix, zero term at mix=0 (no boss = byte-identical).
  let sat = 1.18 + postfx._feverMix * 0.08 + _kick.sat - _bossMix * 0.10;
  let vig = 0.30 + _kick.vig + _bossMix * 0.05;
  // Bloom eases DOWN during Surge (clamped) so the bright scene/sky can't blow
  // out and bury the silhouette — the dragon's own emissive is far brighter and
  // still blooms, keeping the glow ON the dragon, not the whole screen.
  postfx.bloomPass.strength = Math.max(0.08,
    postfx._baseBloom + _kick.bloom + flash * 0.25 - postfx._feverMix * 0.07 - _bossMix * 0.05);

  // God-rays (tier 0): place the sun, ease the shafts down a touch in Surge, and
  // disable the whole thing (mask render included) when the sun isn't on-screen.
  if (postfx.godRayPass) {
    if (_grTier0 && _grAvailable) {
      const inten = Math.min(GODRAY_INTEN_CAP, _grIntensity * (1 - postfx._feverMix * 0.45) * (1 + _grBoost * GODRAY_HEAVEN_SWELL));   // ARENA (PR-B): the heaven swell, hard-capped
      const gu = postfx.godRayPass.uniforms;
      gu.uSunUv.value.set(_grSunX, _grSunY);
      gu.uIntensity.value = inten;
      postfx.godRayPass.enabled = inten > 0.004;
    } else {
      postfx.godRayPass.enabled = false;
    }
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
    // Build the sky/occluder mask just before compositing (cheap, tier-0, only
    // while the pass is live). SUPPRESSED while EMBERTIDE IS the sky — it replaces the
    // dome with a bright field and has no discrete sun, so god-ray shafts read as a
    // rectangular light-source artifact. Restore the pass state after compositing.
    const _grWant = postfx.godRayPass ? postfx.godRayPass.enabled : false;
    if (postfx.godRayPass && (game.embertideSky || game.bossVoidSky)) postfx.godRayPass.enabled = false;   // ARENA (PR-A): the void has no sun → no shafts
    if (postfx.godRayPass && postfx.godRayPass.enabled) renderGodRayMask();
    postfx.composer.render();
    if (postfx.godRayPass) postfx.godRayPass.enabled = _grWant;
    if (_flashFrames > 0) _flashFrames--; // "1 frame" = one PRESENTED frame
  } else {
    postfx._renderer.render(postfx._scene, postfx._camera);
  }
}
