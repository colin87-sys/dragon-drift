import * as THREE from 'three';
import { makeGlowTexture, makeRingTexture, makeRectTexture } from './util.js';

// Celebration particle engine. One pooled set of additive glow sprites
// (tinted per spawn — no material churn) plus a small pool of shockwave
// sprites (ring / rectangle outlines that expand and fade).
//
// Per-sprite userData flags let specialized effects opt out of the default
// drag/gravity/grow behaviour:
//   gravityScale — 0 for streaks/shockwaves that shouldn't fall
//   drag         — 0 to keep streaks fast
//   stretch      — >1 elongates the sprite along its velocity (screen-space)
const POOL = 320;
const SHOCK_POOL = 8;
// Hard cap on concurrently-visible spark sprites (each sprite = 1 draw
// call). Scaled by the adaptive quality factor from main.js.
const VISIBLE_CAP = 150;

let scene = null;
const sprites = [];
const shocks = [];
let tex = null;
let cursor = 0;       // rotating allocation cursor (avoids O(n) find scans)
let visibleCount = 0;
let quality = 1;

const tmpV = new THREE.Vector3();

export function setParticleQuality(q) {
  quality = q;
}

// --- ParticleBatch backend (opt-in via ?pfx=batch) -------------------------
// Collapses the ≤150 per-sprite spark draw calls into ONE InstancedBufferGeometry
// draw. The 320 Sprite objects are kept as the STATE (every spawn/update math path
// is reused verbatim → pixel parity by construction); the instanced mesh just reads
// their transforms each frame. OFF by default: when off, the shipped sprite path is
// byte-for-byte unchanged. Only the SPARK pool is batched — the 8 shockwave sprites
// (ring/rect, ≤8 draws) stay as-is.
let useBatch = false;
let batchMesh = null;
let iPos, iScale, iRot, iColor, iOpacity;

// Call BEFORE initParticles. 'batch' selects the instanced backend.
export function setParticleBackend(mode) { useBatch = (mode === 'batch'); }

export function particleStats() {
  return { visible: visibleCount, backend: useBatch ? 'batch' : 'sprite', batched: !!batchMesh };
}

const BATCH_VERT = /* glsl */`
  attribute vec3 iPos;
  attribute vec2 iScale;
  attribute float iRot;
  attribute vec3 iColor;
  attribute float iOpacity;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vUv = uv;
    vColor = iColor;
    vOpacity = iOpacity;
    // Billboard exactly like THREE.Sprite: scale + screen-space rotate the unit
    // quad, then offset in VIEW space (camera-facing, perspective size-attenuated).
    vec2 aligned = position.xy * iScale;
    float c = cos(iRot), s = sin(iRot);
    vec2 rot = vec2(c * aligned.x - s * aligned.y, s * aligned.x + c * aligned.y);
    vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
    mv.xy += rot;
    gl_Position = projectionMatrix * mv;
  }`;

const BATCH_FRAG = /* glsl */`
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec4 t = texture2D(map, vUv);
    // Matches SpriteMaterial: rgb = color * texel.rgb, a = opacity * texel.a,
    // under AdditiveBlending (SrcAlpha, One).
    gl_FragColor = vec4(vColor * t.rgb, vOpacity * t.a);
    // CRITICAL for tier2 parity: SpriteMaterial ends with these chunks. three
    // injects the toneMapping()/linearToOutputTexel() functions + defines into a
    // (non-raw) ShaderMaterial and GATES them on the render target — so both are
    // NO-OPS at tier0/1 (sprites + batch render into the linear HDR RT) and apply
    // ACES(0.92) + sRGB at tier2 (direct-to-screen). Without them the batch sparks
    // skip tone mapping on weak devices and read ~25-35% dimmer / harder-edged.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function initBatch() {
  const plane = new THREE.PlaneGeometry(1, 1); // position.xy in [-0.5,0.5], uv [0,1]
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = plane.index;
  geo.setAttribute('position', plane.getAttribute('position'));
  geo.setAttribute('uv', plane.getAttribute('uv'));
  geo.instanceCount = POOL;
  // Rewritten every frame (writeBatch) → DynamicDrawUsage is the correct hint.
  iPos = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3).setUsage(THREE.DynamicDrawUsage);
  iScale = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 2), 2).setUsage(THREE.DynamicDrawUsage);
  iRot = new THREE.InstancedBufferAttribute(new Float32Array(POOL), 1).setUsage(THREE.DynamicDrawUsage);
  iColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3).setUsage(THREE.DynamicDrawUsage);
  iOpacity = new THREE.InstancedBufferAttribute(new Float32Array(POOL), 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPos', iPos);
  geo.setAttribute('iScale', iScale);
  geo.setAttribute('iRot', iRot);
  geo.setAttribute('iColor', iColor);
  geo.setAttribute('iOpacity', iOpacity);
  // DEVIATION from SpriteMaterial: no scene fog. SpriteMaterial has fog:true, so
  // sparks beyond the fog near-plane (85u) mix toward the fog colour. Celebration
  // bursts are near-field (rings/gates/phases/rolls fire AT the dragon, fogFactor≈0),
  // so this is imperceptible for the hero cases; only FAR bursts (e.g. a boss death
  // burst at distance) differ. Left out deliberately — ShaderMaterial fog-uniform
  // refresh over the per-frame biome fog lerp is fiddly; add it (fog:true +
  // UniformsLib.fog + the fog chunks) if/when the batch default is flipped ON.
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex } },
    vertexShader: BATCH_VERT, fragmentShader: BATCH_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  batchMesh = new THREE.Mesh(geo, mat);
  batchMesh.frustumCulled = false;
  batchMesh.layers.set(1); // excluded from the water reflection pass, like the sprites
  batchMesh.renderOrder = 5;
  scene.add(batchMesh);
}

// Sync the sprite-held state into the instance attributes (once per frame).
function writeBatch() {
  const pa = iPos.array, sa = iScale.array, ra = iRot.array, ca = iColor.array, oa = iOpacity.array;
  for (let i = 0; i < POOL; i++) {
    const sp = sprites[i];
    if (sp.visible) {
      pa[i * 3] = sp.position.x; pa[i * 3 + 1] = sp.position.y; pa[i * 3 + 2] = sp.position.z;
      sa[i * 2] = sp.scale.x; sa[i * 2 + 1] = sp.scale.y;
      ra[i] = sp.material.rotation;
      const col = sp.material.color;
      ca[i * 3] = col.r; ca[i * 3 + 1] = col.g; ca[i * 3 + 2] = col.b;
      oa[i] = sp.material.opacity;
    } else {
      oa[i] = 0; sa[i * 2] = 0; sa[i * 2 + 1] = 0; // collapsed + invisible
    }
  }
  iPos.needsUpdate = true; iScale.needsUpdate = true; iRot.needsUpdate = true;
  iColor.needsUpdate = true; iOpacity.needsUpdate = true;
}

export function initParticles(s) {
  scene = s;
  tex = makeGlowTexture('255,255,255');
  for (let i = 0; i < POOL; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.visible = false;
    sp.layers.set(1); // sprite layer: excluded from water reflection pass
    sp.userData = {
      life: 0, decay: 1, size: 1, vel: new THREE.Vector3(),
      gravityScale: 1, drag: 1, stretch: 1,
    };
    // In batch mode the spark sprites are STATE only — not scene children (the
    // instanced mesh renders them), so they never emit a per-sprite draw call.
    if (!useBatch) scene.add(sp);
    sprites.push(sp);
  }
  if (useBatch) initBatch();
  const ringTex = makeRingTexture();
  const rectTex = makeRectTexture();
  for (let i = 0; i < SHOCK_POOL; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: i % 2 ? rectTex : ringTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.visible = false;
    sp.layers.set(1); // sprite layer: excluded from water reflection pass
    sp.userData = { life: 0, decay: 1, grow: 10, isRect: !!(i % 2) };
    scene.add(sp);
    shocks.push(sp);
  }
}

function acquire() {
  if (visibleCount >= VISIBLE_CAP * quality) return null;
  for (let n = 0; n < POOL; n++) {
    const sp = sprites[cursor];
    cursor = (cursor + 1) % POOL;
    if (!sp.visible) {
      sp.visible = true;
      visibleCount++;
      return sp;
    }
  }
  return null;
}

function spawn(pos, colorHex, opts) {
  const sp = acquire();
  if (!sp) return;
  sp.position.copy(pos);
  sp.material.color.setHex(colorHex);
  sp.material.rotation = 0;
  const u = sp.userData;
  u.life = 1;
  u.decay = 1 / (opts.life || 0.7);
  u.size = (opts.size || 0.9) * (0.7 + Math.random() * 0.6);
  u.gravityScale = opts.gravityScale ?? 1;
  u.drag = opts.drag ?? 1;
  u.stretch = opts.stretch ?? 1;
  const a = Math.random() * Math.PI * 2;
  const v = (opts.speed || 10) * (0.4 + Math.random() * 0.6);
  u.vel.set(Math.cos(a) * v, Math.sin(a) * v, (Math.random() - 0.5) * v * 0.6);
  if (opts.velBias) u.vel.add(opts.velBias);
  return sp;
}

// Generic celebration burst (kept for orbs / fever / one-off flashes).
export function burst(pos, colorHex, { count = 14, speed = 10, size = 0.9, life = 0.7 } = {}) {
  const n = Math.round(count * quality) || 1;
  for (let i = 0; i < n; i++) spawn(pos, colorHex, { speed, size, life });
}

// Barrel-roll air turbulence — pale vapor streaks shed during a roll. Biased
// laterally in the roll direction and BEHIND the dragon (+z), elongated along
// their velocity, so they read as turbulent air torn off the wings (the sense of
// power being generated). Called per-frame while rolling for a continuous trail.
export function rollWake(pos, dir = 1, count = 4) {
  const n = Math.round(count * quality) || 1;
  for (let i = 0; i < n; i++) {
    tmpV.set(dir * (3 + Math.random() * 5), (Math.random() - 0.5) * 6, 5 + Math.random() * 6);
    spawn(pos, 0xcdeaff, { speed: 6, size: 1.0, life: 0.42, velBias: tmpV, drag: 1.5, gravityScale: 0, stretch: 2.4 });
  }
}

// (PR4b: the wisp sprite-mote trail was RETIRED — the wisps now tow continuous
// light-ribbons in bossBullets.js, the Panzer-Dragoon silhouette; keeping both
// over-glowed the additive budget.)

// PR-C THE GATHER: charge sparks racing INWARD to the lance launch shoulder —
// the exhale muzzle burst fires from this exact point, so the inhale visibly
// FEEDS the release. Sparks spawn on a shell around `center` with an inward
// velBias (the one motion the public burst() can't do), zero gravity, stretched
// along their velocity so they read as streaks converging; short life ≈ the
// travel time, so they arrive and wink out AT the point. Called per-frame-ish
// (throttled by the caller) while the fuse burns; count scales with pip count
// (a 6-set gathers a storm, a 3-set a trickle). Pool/quality-gated like all
// sprites; callers skip entirely below quality 0.5 (garnish law).
const gatherV = new THREE.Vector3();
export function gatherPulse(center, tint, count = 2, k01 = 1) {
  if (quality < 0.5) return;
  const n = Math.round(count * quality) || 1;
  for (let i = 0; i < n; i++) {
    // random point on a WIDER shell (biased to the camera-visible upper half).
    // Owner: "can't see much noticeable jade sparks gather" from the rear chase
    // cam — a small jade spark camouflages against the jade wing glow the inhale
    // now adds. Fix: spawn farther out + stretch harder so each spark is a long
    // INWARD STREAK (motion reads where a static dot doesn't), and make it bigger.
    const a = Math.random() * Math.PI * 2;
    const r = 2.0 + Math.random() * 1.2;
    gatherV.set(Math.cos(a) * r, Math.abs(Math.sin(a)) * r * 0.85 - 0.2, (Math.random() - 0.5) * 1.4);
    const p = gatherV.clone().add(center);
    // inward bias: fly from the shell INTO the center, faster as the fuse peaks
    gatherV.multiplyScalar(-(3.4 + 4.0 * k01));
    // every 3rd spark is white-hot — the LUMINANCE that cuts through the jade
    // wing glow (L195: the coloured layer is tinted, the anchor stays white);
    // the rest carry the jade tint so the charge still reads as the lance colour.
    const hot = (i % 3) === 0;
    spawn(p, hot ? 0xeafff6 : tint, { speed: 0.6, size: hot ? 0.62 : 0.55, life: 0.32,
      velBias: gatherV.clone(), drag: 0.4, gravityScale: 0, stretch: 3.0 });
  }
  // SWELLING white-hot convergence core at the launch shoulder — the ONE bright
  // element that reads against the jade wing glow from behind. Its size grows
  // with the fuse (k01): a small ember early, a bright bloom at cap, so the
  // charge visibly INTENSIFIES toward the release (drag pins it in place).
  spawn(center, 0xeafff6, { speed: 0.4, size: 0.34 + 0.6 * k01, life: 0.18, gravityScale: 0, drag: 2.5 });
}

// Wisp impact — accent sparks + fast white-hot pips; the small shockwave ring only
// when the caller says so (the FIRST strike of an impact drum-roll window) so a
// 6-pip Surge fork over the shield-shatter never stacks large additive volumes.
// Legibility through the shatter comes from LUMINANCE (hot pips at speed), not area.
// `tint` is the equipped dragon's wisp accent (jade by default, PR8); the white
// pips (0xeafff6) stay white — the bullet legibility anchor, unchanged by hue.
export function wispImpact(pos, ring, tint = 0x50ffaa) {
  burst(pos, tint, { count: 7, speed: 9, size: 0.6, life: 0.32 });
  burst(pos, 0xeafff6, { count: 3, speed: 15, size: 0.4, life: 0.22 });
  if (ring) shockwave(pos, tint, { grow: 10, life: 0.35 });
}

function shockwave(pos, colorHex, { rect = false, grow = 16, life = 0.5, aspect = 1 } = {}) {
  for (const sp of shocks) {
    if (sp.visible || sp.userData.isRect !== rect) continue;
    sp.visible = true;
    sp.position.copy(pos);
    sp.material.color.setHex(colorHex);
    sp.material.opacity = 1;
    const u = sp.userData;
    u.life = 1;
    u.decay = 1 / life;
    u.grow = grow;
    u.aspect = aspect;
    sp.scale.set(1, aspect, 1);
    return;
  }
}

// Ring collect: green sparks; perfect = gold supernova — sparks, radial
// streaks and a double ring shockwave (the chase-this-feeling moment).
export function ringBurst(pos, perfect) {
  if (perfect) {
    burst(pos, 0xffd86a, { count: 26, speed: 16, size: 1.1 });
    burst(pos, 0xfff2c0, { count: 12, speed: 23, size: 0.7, life: 0.5 });
    // Radial starburst streaks (no gravity, elongated along velocity)
    const n = Math.round(10 * quality) || 1;
    for (let i = 0; i < n; i++) {
      spawn(pos, i % 2 ? 0xffe9a0 : 0xffc23c, {
        speed: 30, size: 0.6, life: 0.4,
        gravityScale: 0, drag: 0.4, stretch: 3.6,
      });
    }
    shockwave(pos, 0xffd86a, { grow: 30, life: 0.62 });
    shockwave(pos, 0xfff2c0, { grow: 14, life: 0.4 });
  } else {
    burst(pos, 0x4dffa0, { count: 14, speed: 10 });
  }
}

// Surge phase: a violet crystal-shatter explosion. Perfect phases get the full
// treatment (twin shockwave rings + elongated shards); minor phases a modest puff.
export function phaseBurst(pos, perfect) {
  if (perfect) {
    burst(pos, 0xc060ff, { count: 28, speed: 18, size: 1.2 });
    burst(pos, 0xe8d0ff, { count: 12, speed: 25, size: 0.7, life: 0.5 });
    const n = Math.round(12 * quality) || 1;
    for (let i = 0; i < n; i++) {
      spawn(pos, i % 2 ? 0xd59bff : 0x9b6bff, {
        speed: 32, size: 0.62, life: 0.42,
        gravityScale: 0, drag: 0.4, stretch: 3.6,
      });
    }
    shockwave(pos, 0xc060ff, { grow: 32, life: 0.6 });
    shockwave(pos, 0xe8d0ff, { grow: 15, life: 0.4 });
  } else {
    burst(pos, 0xc060ff, { count: 14, speed: 13, size: 0.9 });
    burst(pos, 0xe8d0ff, { count: 5, speed: 18, size: 0.55, life: 0.4 });
  }
}

// Gate thread: cyan crystal sparks + rectangular shockwave shaped like the window.
export function gateThreadBurst(pos) {
  burst(pos, 0x7fe0ff, { count: 20, speed: 13, size: 1.0 });
  burst(pos, 0xeaffff, { count: 8, speed: 19, size: 0.65, life: 0.45 });
  shockwave(pos, 0x7fe0ff, { rect: true, grow: 24, life: 0.52, aspect: 0.85 });
  shockwave(pos, 0xeaffff, { rect: true, grow: 13, life: 0.35, aspect: 0.85 });
}

// Near miss: coral streaks that whip past the camera. Lateral velocity plus
// a strong +z bias; the streaks are elongated along their screen velocity.
const NEAR_BIAS = new THREE.Vector3();
export function nearMissSparks(pos) {
  const n = Math.round(6 * quality) || 1;
  for (let i = 0; i < n; i++) {
    NEAR_BIAS.set(0, 0, 28 + Math.random() * 14);
    tmpV.copy(pos);
    tmpV.z += 2 + Math.random() * 2.5;
    spawn(tmpV, i % 3 ? 0xff7449 : 0xffb13d, {
      speed: 9, size: 0.55, life: 0.45,
      gravityScale: 0, drag: 0, stretch: 3.2,
      velBias: NEAR_BIAS,
    });
  }
}

export function updateParticles(dt, camera) {
  for (const sp of sprites) {
    if (!sp.visible) continue;
    const u = sp.userData;
    u.life -= dt * u.decay;
    if (u.life <= 0) {
      sp.visible = false;
      sp.material.opacity = 0;
      visibleCount--;
      continue;
    }
    sp.position.addScaledVector(u.vel, dt);
    if (u.drag) u.vel.multiplyScalar(Math.max(0, 1 - 2.5 * u.drag * dt));
    u.vel.y -= 4 * u.gravityScale * dt;
    sp.material.opacity = u.life * 0.9;
    const s = u.size * (0.6 + (1 - u.life) * 1.4);
    if (u.stretch > 1 && camera) {
      // Orient the sprite along its screen-space velocity for a streak look
      tmpV.copy(u.vel);
      const sx = tmpV.x;
      const sy = tmpV.y;
      sp.material.rotation = Math.atan2(sy, sx);
      sp.scale.set(s * u.stretch, s * 0.45, 1);
    } else {
      sp.scale.set(s, s, 1);
    }
  }

  for (const sp of shocks) {
    if (!sp.visible) continue;
    const u = sp.userData;
    u.life -= dt * u.decay;
    if (u.life <= 0) {
      sp.visible = false;
      sp.material.opacity = 0;
      continue;
    }
    const k = 1 - u.life;
    const sc = 1 + k * u.grow;
    sp.scale.set(sc, sc * (u.aspect || 1), 1);
    sp.material.opacity = u.life * 0.85;
  }

  if (useBatch && batchMesh) writeBatch(); // push the sprite-held spark state to the instanced draw
}

export function resetParticles() {
  for (const sp of sprites) {
    sp.visible = false;
    sp.material.opacity = 0;
  }
  for (const sp of shocks) {
    sp.visible = false;
    sp.material.opacity = 0;
  }
  visibleCount = 0;
  if (useBatch && batchMesh) writeBatch(); // clear the instanced draw too
}
