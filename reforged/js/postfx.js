import * as THREE from 'three';
import { EffectComposer } from '../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/postprocessing/RenderPass.js';
import { ShaderPass } from '../lib/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../lib/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/postprocessing/OutputPass.js';
import { GodRaysShader, initGodRays, renderGodRayMask, setGodRaysReady, godRayTexture, resizeGodRays, setGodRayMaskScale, setGodRayMaskDuty } from './godrays.js';
export { setGodRayMaskDuty };   // re-exported so main.js drives the whole god-ray control surface through postfx
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
    lift: { value: 0.0 },          // kick/flash warm-glow pulse (fever wash term retired — SUNBREAK I1)
    liftTint: { value: new THREE.Vector3(0.10, 0.03, 0.08) }, // kick hue (still drives goldenEmber/arenaFlood/the release flash)
    surgeMix: { value: 0.0 },      // SUNBREAK I1: world-suppression amount (0..1) — the world steps DOWN so the dragon reads as the light source
    surgeDark: { value: new THREE.Vector3(0.16, 0.13, 0.21) }, // the active dragon's DARK band (L≈0.14): shadows pull toward THIS hue, never neutral grey
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
    uniform float surgeMix;
    uniform vec3 surgeDark;
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
      // SUNBREAK world-suppression (I1): on Surge the WORLD steps down one value band so
      // the dragon becomes the brightest thing — the 3D gacha cut-in (world recedes,
      // subject dominates). SUBTRACTIVE-ONLY (never brightens a world pixel) and
      // SPLIT-TONED: (a) desaturate the world toward its own luminance, (b) darken it
      // (vignette-weighted so the centre lane stays readable), (c) pool the dragon's DARK
      // hue in the SHADOWS at constant luminance while HIGHLIGHTS stay near-neutral — the
      // difference between "the sun went behind the dragon" and "someone put a filter on".
      // worldW spares the dragon's near-white core/bloom; shadowW keeps the tint out of
      // the highlights. surgeMix is delayed vs the dragon's ignition (dragon leads, world follows).
      if (surgeMix > 0.0) {
        // worldW spares the BRIGHT band — the dragon's core/bloom AND the sky's horizon
        // glow / water hotspots — from desat+darken, so the sky keeps its vertical value
        // structure (a suppressed sky must still read as a SKY, not a flat filter field).
        float worldW = 1.0 - smoothstep(0.48, 0.88, lum);
        col = mix(col, vec3(lum), surgeMix * 0.40 * worldW);      // (a) desaturate ×~0.6 over the world
        float edge = mix(0.55, 1.0, smoothstep(0.0, 1.0, r2 * 2.2)); // centre/horizon gentler, corners full
        col *= (1.0 - surgeMix * 0.30 * edge * worldW);           // (b) step the world DOWN
        // (c) split-tone: pool the dragon's DARK hue in the DEEP shadows with a (1-luma)^2
        // weight, so the colour STATEMENT lives in the darks (premium) not smeared over the
        // whole frame (the flat-filter tell). Stronger mix so it reads at gameplay distance.
        float sw = 1.0 - smoothstep(0.03, 0.55, lum);
        float shadowW = pow(sw, 1.5);                            // (1-luma)^1.5 — deep darks OWN the hue, a whisper reaches the midtones (kills the "dusty" neutral mid-ground read; sat stays ≤~0.10 there)
        float ld = dot(surgeDark, vec3(0.299, 0.587, 0.114));
        vec3 darkTarget = surgeDark * (lum / max(ld, 0.001));     // surgeDark's HUE at THIS pixel's luminance → pure hue shift, no brighten
        col = mix(col, darkTarget, surgeMix * shadowW * worldW * 0.85);
      }
      // Kick/flash warm lift (goldenEmber, arenaFlood, the RELEASE flash — the fever wash
      // term is retired; this hue channel survives for the kick presets, §M.1-4).
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
  _baseBloomThreshold: 1.0,   // UnrealBloom threshold at rest; RAISED on fever so the fire body stops blooming to cream
  _aberrationOn: true,
  _feverMix: 0,
  _feverTint: [0.10, 0.03, 0.08], // kick/flash hue; setFeverTint() swaps per dragon
  _surgeDark: [0.16, 0.13, 0.21], // SUNBREAK I1: per-dragon DARK band the suppression pools in shadows; setSurgeDark() swaps
  _kickScale: 1, // tier 1 halves impulse magnitudes
};
// SUNBREAK I1 world-suppression envelope. `_surgeGrade` (0..1) is the applied grade
// amount; it LAGS the dragon's ignition (delayed onset + ~0.9s ramp) so the dragon leads
// and the world follows (§I-6), holds through sustain, and releases over ~1.5s. `_surgeT`
// is real-time elapsed since the Surge rising edge (drives the delayed-onset ramp shape).
let _surgeGrade = 0;
let _surgeT = 0;
let _surgeLostT = -1;     // s since a DAMAGE cancel (-1 = not a damage loss → natural slow lift)
let _surgeLostFrom = 0;   // grade at the damage cancel (the fast-lift starts from here)
let _surgeExpOver = 0;    // exposure BRIGHTEN overshoot on the damage lift (the "spell broken" value pop)
// Pure attack envelope: the world SNAPS down on the trigger edge (dragon leads by a ~150ms onset,
// then a fast easeOutCubic to 115% depth by ~400ms) and SETTLES to 100% by ~900ms — a felt "the
// sky just dropped" event, not a slow drift (Fable ruling). Overshoot-and-settle = felt, not late.
function _surgeAttackEnv(e) {
  if (e <= 0) return 0;
  if (e < 0.40) { const x = e / 0.40; return 1.15 * (1 - (1 - x) * (1 - x) * (1 - x)); }   // easeOutCubic → 115%
  if (e < 0.90) { const x = (e - 0.40) / 0.50; return 1.15 - 0.15 * (0.5 - 0.5 * Math.cos(Math.PI * x)); }  // easeInOutSine settle → 100%
  return 1.0;
}
// A DAMAGE hit KILLS the Surge (not a natural drain): the world lifts FAST (~300ms) and POPS a
// touch brighter than normal for one beat — a pure-value "spell broken" signature (colorblind-safe).
export function surgeLost() { _surgeLostT = 0; _surgeLostFrom = _surgeGrade; }
// The tone-mapping exposure dip is applied in main.js at the single exposure write (§M.1-4). A
// positive result DIPS (darker); the damage-lift overshoot makes it briefly NEGATIVE (brighter).
export function surgeExposureDip() { return 0.24 * _surgeGrade - _surgeExpOver; }
export function surgeGradeMix() { return _surgeGrade; }             // trace seam for the surgefx envelope asserts
export function surgeGradeEnvAt(t) { return _surgeAttackEnv(t - 0.15); }   // pure sampler (frame-clock-independent asserts)

// Fever-wash hue. RETAINED as the KICK/flash hue (goldenEmber, arenaFlood, the release
// flash) — the additive fever *wash* term is retired in SUNBREAK I1 (world-suppression
// replaces it), but liftTint stays alive for the kick presets (§M.1-4). Called on equip.
const FEVER_TINT_DEFAULT = [0.10, 0.03, 0.08];
export function setFeverTint(rgb) {
  postfx._feverTint = rgb || FEVER_TINT_DEFAULT;
}
// SUNBREAK I1: the active dragon's DARK band — the world-suppression grade pools THIS hue
// in the shadows (§C.2/§H `surgeDark`). Called on equip alongside setFeverTint. When a
// dragon supplies no explicit `surgeDark`, derive it from its wash hue crushed to a
// shadow value (L≈0.14, desaturated toward its own luminance) so the darkness still
// carries the dragon's identity rather than going neutral grey.
const SURGE_DARK_DEFAULT = [0.16, 0.13, 0.21];
export function setSurgeDark(rgb) {
  let d = rgb;
  if (!d) {
    const ft = postfx._feverTint || FEVER_TINT_DEFAULT;
    const l = 0.299 * ft[0] + 0.587 * ft[1] + 0.114 * ft[2];
    const s = l > 1e-4 ? 0.14 / l : 1;                 // scale the wash hue up to L≈0.14
    const g = 0.14;                                    // desaturate ~halfway toward that luminance
    d = [ft[0] * s * 0.55 + g * 0.45, ft[1] * s * 0.55 + g * 0.45, ft[2] * s * 0.55 + g * 0.45];
  }
  postfx._surgeDark = d;
}
// FIRSTBORN heaven: the Surge screen-wash reads in the arena's gold, not the magenta default (paired
// with the sky feverWarm in environment.js). `_arenaWarm` (0→1, driven from the arena mix in main.js)
// lerps the lift hue toward a warm ember-gold so the godhead's palette isn't punched magenta on surge.
let _arenaWarm = 0;
const _WARM_LIFT = [0.13, 0.065, 0.018];   // ember-gold wash (small additive magnitudes, like the magenta default)
export function setFeverArenaWarm(k) { _arenaWarm = k < 0 ? 0 : k > 1 ? 1 : k; }

// --- God-rays (occlusion-masked) --------------------------------------------
// Sun screen position + base intensity fed each frame from main.js. N11: the mask
// render + pass now run at TIER 0 AND TIER 1 (`_grTierOK = tier <= 1`) — tier1
// pays for it via a quarter-res mask (0.25) + fewer march samples (24) + halved
// intensity (`_grIntenScale = 0.5`), so mid-range phones keep the shafts. The pass
// disables itself when the sun is hidden so it is free off-axis. `_grAvailable` =
// the occlusion buffer is initialised.
let _grSunX = 0.5, _grSunY = 0.8, _grIntensity = 0;
let _grAvailable = false;
let _grTierOK = true;      // god-rays run at this tier (tier <= 1)
let _grIntenScale = 1;     // tier0 = 1 (byte-identical), tier1 = 0.5
let _grTier = 0;           // last tier set (so the saver can recompute uSamples without a tier flip)
let _grSaver = false;      // dynRes perf-saver: tier0 shaft march 40 → 24 taps (per-pixel fill saving)
// The adaptive-resolution governor engages this BEFORE trimming resolution: fewer march
// samples over the broad, radial-blurred columns is near-invisible but a real full-res
// fill saving. Off = shipped 40 taps at tier0. tier1 is already at its 16-tap floor.
export function setGodRaySamplesSaver(on) {
  _grSaver = !!on;
  if (postfx.godRayPass) postfx.godRayPass.uniforms.uSamples.value = _grTier === 0 ? (_grSaver ? 24 : 40) : 16;
}

export function setGodRaySun(uvX, uvY, intensity) {
  _grSunX = uvX; _grSunY = uvY; _grIntensity = intensity;
}
// Per-biome god-ray shaft tint (env-driven; shipped default = 1.0,0.9,0.72 warm-white).
// A night biome warms the residual shafts to an amber glow-haze. THREE.Color (r/g/b in 0-1).
export function setGodRayTint(c) {
  if (postfx.godRayPass) postfx.godRayPass.uniforms.uTint.value.set(c.r, c.g, c.b);
}
// Per-biome sunburst-BREAK strength (env-driven; default 0.35 = subtle bundles everywhere, Tempest 0.55).
// Higher = the radial shafts break into drifting crepuscular bundles instead of a clean geometric sunburst.
let _grBreak = 0.35;
export function setGodRayBreak(k) { _grBreak = k; }
// ARENA (PR-B): THE UNVEILED HEAVEN swells the god-rays (the #1 holy carrier — a gallery of light
// shafts). Bounded by a HARD authored cap so the boosted shafts never lift the effective bullet-
// background luminance past the fairness bar (the byte-space contrast gate can't see the shader's
// additive shafts — the fairness PROBE in unmaskedarena.mjs is the merge-blocking authority). 0 = the
// shipped intensity, byte-identical for every non-heaven frame.
let _grBoost = 0;
const GODRAY_HEAVEN_SWELL = 0.45;   // max +45% over base (O-B1 owner dial) — tempered so the unveiling reads "lit not blinding"
const GODRAY_INTEN_CAP = 1.0;       // hard ceiling on uIntensity — only a rendered frame bounds the OUTPUT (the probe)
export function setGodRayBoost(k) { _grBoost = Math.max(0, Math.min(1, k)); }
// BOSS-FIGHT PERF DIET (struggling device only): dim the shafts to license the 1/6 mask duty (a full-strength
// shaft updated 1/6 as often would visibly swim; a faint one hides its own staleness). 1 = shipped. The
// controller eases this toward ~0.4 on engage and back to 1 under the FELLED wash. Capable device never
// engages → stays 1 → byte-identical.
let _grDietDim = 1;
export function setGodRayDietDim(k) { _grDietDim = Math.max(0, Math.min(1, k)); }

// Called once after the world (and its sky) exist — wires the occlusion buffer
// to the pass. Safe no-op if post-FX is unsupported.
export function setupGodRays(scene, camera, sky) {
  if (!postfx.supported || !postfx.godRayPass) return;
  initGodRays(postfx._renderer, scene, camera, sky);
  postfx.godRayPass.uniforms.tMask.value = godRayTexture();
  _grAvailable = true;
  // Boot is tier 0 (applyQuality only runs on a tier CHANGE), so arm the mask now.
  setGodRaysReady(_grTierOK && _grAvailable);
}

// Test/debug introspection for the N11 tier truth table (read-only snapshot).
export function postTierState() {
  return { grTierOK: _grTierOK, grIntenScale: _grIntenScale,
    uSamples: postfx.godRayPass ? postfx.godRayPass.uniforms.uSamples.value : null };
}

// --- Event-driven impulse kicks ---------------------------------------
// Five channels riding on top of the continuous dynamics, each an impulse
// that exp-decays back to zero. Presets keep shader-coupled tuning next to
// the shader; CONFIG.JUICE only maps events -> preset names.
const _kick = { bloom: 0, lift: 0, sat: 0, vig: 0, ab: 0 };
const _kickKeys = Object.keys(_kick);   // hoisted: `Object.keys(_kick)` in the per-frame decay loop was allocating a fresh 5-string array 60×/s (steady GC feed)
const KICK_DECAY = { bloom: 6, lift: 5, sat: 7, vig: 6, ab: 8 };
const KICK_MAX = { bloom: 0.36, lift: 0.6, sat: 0.35, vig: 0.25, ab: 0.010 };
let _flashFrames = 0;   // hard gold flash, decremented per PRESENTED frame
// §G reduce-motion: the OS preference suppresses the 1-frame kick FLASH at every tier (the DOM
// fallback already respects it — this closes the tier-0/1 gap the independent critic caught;
// bloom/lift pulses are not photosensitivity flashes and stay).
const _reduceFlash = !!(globalThis.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let _deathOn = false;
let _deathMix = 0;
// Boss-time stage-management grade: the world mid-tones itself so bullets own
// the extremes (Cave black-label logic). Target rides boss.js's phase/shielded
// signal (0 idle, 0.6 warn/approach/fight, 1.0 shielded) — see updatePostFX.
let _bossMix = 0;

// ═══ THE HUD GRADING ARBITER (EMBERSIGHT H3, risk #9) ═══════════════════════
// ONE function owns the HUD's claim on the grade stack. HUD code (hudState's
// VIGIL) never touches uniforms — it declares a target here; updatePostFX
// eases toward it and composes it ADDITIVELY with its own channels (fever
// lift, boss mix, death grade), so the VIGIL desat can never fight the fever
// lift: they are separate terms on separate knobs, applied in one place.
const _hudGradeTarget = { desat: 0, vig: 0 };
const _hudGrade = { desat: 0, vig: 0 };
export function setHudGrade(desat = 0, vig = 0) {
  _hudGradeTarget.desat = desat;
  _hudGradeTarget.vig = vig;
}
// Test/debug introspection (read via kickState().hud).

const KICK_PRESETS = {
  goldenEmber:      { bloom: 0.30, lift: 0.35 },
  perfectMilestone: { flashFrames: 1, bloom: 0.20, lift: 0.20 },
  // The Surge IGNITION punch (I2.5): a 1-frame flash + bloom + lift pulse so the trigger reads as an
  // EVENT on EVERY dragon — the universal screen-space cue that carries the moment on silhouette
  // dragons (Vesper) whose own body barely lights. Photosafe: single frame, capped. Owner-tunable.
  surgeStart:       { flashFrames: 1, bloom: 0.34, lift: 0.32 },
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
  if (p.flashFrames && !_reduceFlash) _flashFrames = Math.max(_flashFrames, p.flashFrames);
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
  return { ..._kick, flashFrames: _flashFrames, deathMix: _deathMix, deathOn: _deathOn, bossMix: _bossMix,
    hud: { ..._hudGrade } };
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
    samples: (typeof location !== 'undefined' && new URLSearchParams(location.search).has('msaa0')) ? 0 : 4,   // ?msaa0 — perf A/B: MSAA-resolve bandwidth probe
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
  // NO applySize here: the sole caller (main.js applyQuality) sets this immediately BEFORE setPostTier,
  // whose own applySize() then does ONE resize with the new ratio — the old order (setPostTier THEN
  // setPostPixelRatio) reallocated the full-screen MSAA RT + bloom mips + god-ray RTs TWICE per flip,
  // a self-inflicted per-flip hitch. (At tier 2 the composer is disabled, so its size is moot.)
  postfx._pixelRatio = r;
}

// Toggle composer MSAA at runtime. The heaven arena drops it to 0: that scene is a soft, full-frame
// ADDITIVE fire with no hard geometry edges, so MSAA does ~nothing there but its resolve is heavy
// bandwidth — the CONFIRMED fill wall (on-device ?msaa0 = 60fps at FULL resolution, fire intact).
// Reallocs the composer's two multisample framebuffers ONCE (set .samples → dispose → the renderer
// rebuilds at the current sample count on the next render). Bloom/god-ray RTs are separate, untouched.
export function setPostMSAA(samples) {
  const c = postfx.composer;
  if (!c) return;
  for (const rt of [c.renderTarget1, c.renderTarget2]) {
    if (rt && rt.samples !== samples) { rt.samples = samples; rt.dispose(); }
  }
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
  _grTier = tier;
  _grTierOK = tier <= 1;                 // N11: god-rays at tier 0 AND tier 1
  _grIntenScale = tier === 0 ? 1 : 0.5;  // tier0 full (byte-identical), tier1 halved
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
  // N11 per-tier god-ray cost: tier0 = 40 samples @ 0.5 mask (shipped); tier1 = 24
  // samples @ 0.25 mask. uSamples is otherwise write-once (its shader default is 40),
  // so setting it here is the one live write; tier0 writes 40 → byte-identical.
  if (postfx.godRayPass) postfx.godRayPass.uniforms.uSamples.value = tier === 0 ? (_grSaver ? 24 : 40) : 16;   // tier1 24→16: broad radial columns over a quarter-res mask → 16 taps is indistinguishable; tier0 saver 40→24 (dynRes perf-saver, else 40 = byte-identical)
  setGodRayMaskScale(tier === 0 ? 0.5 : 0.25);
  // God-rays run at tier ≤ 1; force the pass off (and stop the mask render) at tier2.
  setGodRaysReady(_grTierOK && _grAvailable);
  if (postfx.godRayPass && !_grTierOK) postfx.godRayPass.enabled = false;
  postfx.bloomPass.strength = postfx._baseBloom;
  for (let i = 0; i < _kickKeys.length; i++) _kick[_kickKeys[i]] = 0; // no stale impulses across tiers
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
  for (let i = 0; i < _kickKeys.length; i++) {
    const c = _kickKeys[i];
    _kick[c] = damp(_kick[c], 0, KICK_DECAY[c], rawDt);
  }
  if (_deathOn) _deathMix = Math.min(_deathMix + rawDt / 0.45, 1);
  else if (_deathMix > 0) _deathMix = damp(_deathMix, 0, 10, rawDt);
  // Boss grade: same unconditional-decay guarantee as _deathMix (teardown/
  // death/abandon mid-fight must never strand the dim) — ease ~1s both ways,
  // the feverMix damp idiom below, but computed here (not gated on
  // postfx.enabled) so a tier flap can't strand it either.
  _bossMix = damp(_bossMix, bossTarget, 4, rawDt);
  // HUD grade (the H3 arbiter): eased UNCONDITIONALLY like _bossMix, so a
  // tier flap or teardown mid-critical never strands the VIGIL desat. The
  // claim is a playing-state grade by definition — outside 'playing' it
  // releases (death/recap own their own grades); hudState's 4Hz tick
  // re-asserts it on resume.
  if (game.state !== 'playing') { _hudGradeTarget.desat = 0; _hudGradeTarget.vig = 0; }
  _hudGrade.desat = damp(_hudGrade.desat, _hudGradeTarget.desat, 4, rawDt);
  _hudGrade.vig = damp(_hudGrade.vig, _hudGradeTarget.vig, 4, rawDt);

  // SUNBREAK world-suppression envelope (unconditional, like the grades above, so a tier flap
  // mid-Surge never strands a half-applied darkening). DRAGON LEADS, WORLD FOLLOWS: the grade
  // onset is delayed ~150ms past the edge (after the eye-flash), then SNAPS to 115% depth by
  // ~400ms and settles to 100% by ~900ms (I2.5 punch-up — a felt event, not a slow drift). Two
  // exits: a NATURAL drain lifts slowly (~1.2s, earned exhale); a DAMAGE cancel lifts fast (~300ms)
  // with a +0.10 EV brighten pop (the punished "spell broken" beat), armed by surgeLost().
  if (feverActive) {
    _surgeT += rawDt; _surgeLostT = -1; _surgeExpOver = 0;
    // Snap-with-overshoot attack (onset 150ms → dragon leads); damp fast so the snap reads.
    let target = _surgeAttackEnv(_surgeT - 0.15);
    // SUSTAIN breathe (~0.22Hz, ±5%): a RELATIVE tell that resists adaptation — a static −0.4 EV
    // drop stops carrying info ~10s in ("darker" becomes the new normal), so the suppressed world
    // gently pulses to keep the Surge STATE present on every dragon (the critic's #1 note). Photosafe.
    if (_surgeT > 1.1) target += 0.05 * Math.sin((_surgeT - 1.1) * 2 * Math.PI * 0.22);
    _surgeGrade = damp(_surgeGrade, target, 16, rawDt);
  } else if (_surgeLostT >= 0) {
    // DAMAGE cancel: the world lifts FAST (~300ms easeOutCubic) with a +0.10 EV brighten overshoot
    // peaking ~220ms (the "spell broken" pop), gone by ~500ms.
    _surgeT = 0; _surgeLostT += rawDt;
    const x = clamp(_surgeLostT / 0.30, 0, 1);
    _surgeGrade = _surgeLostFrom * (1 - x) * (1 - x);   // fast easeOut to 0
    const o = _surgeLostT;                              // brighten bump: 0 → peak ~0.22s → 0 by ~0.5s
    _surgeExpOver = o < 0.5 ? 0.07 * Math.sin(Math.PI * clamp(o / 0.5, 0, 1)) : 0;
    if (_surgeLostT > 0.5) { _surgeGrade = 0; _surgeExpOver = 0; _surgeLostT = -1; }
  } else {
    // NATURAL drain: slow, subtle lift (~1.2s) — the earned exhale, distinct from the punished pop.
    _surgeT = 0; _surgeExpOver = 0;
    _surgeGrade = damp(_surgeGrade, 0, 2.5, rawDt);
    if (_surgeGrade < 1e-3) _surgeGrade = 0;
  }

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
  // SUNBREAK I1: the additive Surge WASH term is RETIRED (it raised the world toward the
  // effect colour, killing the CORE:DARK contrast). world-suppression (u.surgeMix below)
  // replaces it. `lift` survives ONLY for the kick presets + the release flash (§M.1-4).
  u.lift.value = _kick.lift + flash * 0.26;
  // World-suppression grade: the world steps down toward the dragon's DARK band.
  u.surgeMix.value = _surgeGrade;
  const sd = postfx._surgeDark;
  u.surgeDark.value.set(sd[0], sd[1], sd[2]);
  const ft = postfx._feverTint;   // heaven lerps the kick/flash hue magenta→ember-gold (the arena palette law)
  u.liftTint.value.set(
    ft[0] + (_WARM_LIFT[0] - ft[0]) * _arenaWarm,
    ft[1] + (_WARM_LIFT[1] - ft[1]) * _arenaWarm,
    ft[2] + (_WARM_LIFT[2] - ft[2]) * _arenaWarm);
  // Boss-time stage management: the world mid-tones itself (sat/vig/bloom ease
  // toward this at mix=1) so the bullets are the most vivid thing on screen —
  // scales linearly with _bossMix, zero term at mix=0 (no boss = byte-identical).
  // Fever no longer RAISES saturation (that fed the old punchy-wash aesthetic); the
  // world-suppression grade desaturates the world in-shader (luminance-protected so the
  // dragon stays vivid). Vignette gets a +0.14 Surge squeeze (§C.2) on top of the shader's
  // edge-weighted darkening — the vignette-framed darkening is the photosensitivity-preferred shape.
  let sat = 1.18 + _kick.sat - _bossMix * 0.10 - _hudGrade.desat;
  let vig = 0.30 + _kick.vig + _bossMix * 0.05 + _hudGrade.vig + _surgeGrade * 0.14;
  // Bloom eases DOWN during Surge (clamped) so the bright scene/sky can't blow
  // out and bury the silhouette — the dragon's own emissive is far brighter and
  // still blooms, keeping the glow ON the dragon, not the whole screen.
  postfx.bloomPass.strength = Math.max(0.08,
    postfx._baseBloom + _kick.bloom + flash * 0.25 - postfx._feverMix * 0.15 - _bossMix * 0.05);
  // RAISE the bloom threshold during Surge so only the HOTTEST cores bloom — the fire body (emissive
  // ~1-1.4) then stays SATURATED ember instead of blooming into a pale cream halo (the "washed white
  // bird"). The base threshold is restored at feverMix 0. (Global, but the whole point of the fever
  // bloom easing is to stop the Rebirth washing the frame — this finishes that job.)
  postfx.bloomPass.threshold = postfx._baseBloomThreshold + postfx._feverMix * 0.85;

  // God-rays (tier ≤ 1): place the sun, ease the shafts down a touch in Surge, and
  // disable the whole thing (mask render included) when the sun isn't on-screen.
  // `_grIntenScale` halves tier1's shafts (1.0 at tier0 → byte-identical).
  if (postfx.godRayPass) {
    if (_grTierOK && _grAvailable) {
      const inten = Math.min(GODRAY_INTEN_CAP, _grIntensity * _grIntenScale * _grDietDim * (1 - postfx._feverMix * 0.45) * (1 + _grBoost * GODRAY_HEAVEN_SWELL));   // ARENA (PR-B): the heaven swell, hard-capped; _grDietDim = boss-fight diet (1 = shipped)
      const gu = postfx.godRayPass.uniforms;
      gu.uSunUv.value.set(_grSunX, _grSunY);
      gu.uIntensity.value = inten;
      gu.uBreak.value = _grBreak;
      gu.uTime.value = performance.now() * 0.001;   // glacial bundle drift (visual only)
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
  // Spine speed-tunnel: a subtle radial squeeze darkens the tube edges and focuses the
  // eye down the barrel (rides the same presence-gated mix as the streaks/aberration).
  vig += clamp(canyonSpeedMix, 0, 1) * 0.05;
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
