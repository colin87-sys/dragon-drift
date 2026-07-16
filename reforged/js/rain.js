// rain.js — premium STORM RAIN as soft, tapered, instanced STREAK QUADS (Tempest Reach).
//
// Rebuilt from LineSegments (owner: "cheap, not AAA") per Fable's premium-rain ruling, Layer A:
// axis-billboarded quads whose LONG axis is locked to the world rain-fall vector (down, leaned
// ~14° along the shared TEMPEST_WIND — the same vector the foam combs and the cloud crawls), the
// quad rotating only about that axis to face the camera. Softness is PROCEDURAL in-shader (no
// texture — the repo is 100% procedural): a feathered core with a long up-tail. ±40% length
// variance kills the debug-uniformity tell. Two depth layers (near hero / mid). Normal alpha
// blend, depth-tested so streaks occlude behind props ("real weather"). rainMix-gated (0 elsewhere
// = byte-identical), tier-thinned. Render-only: no course RNG, no determinism surface.
//
// Deferred to their own work-order steps: Layer B splash-rings on the sea (water shader), Layer C
// distant rain-sheet in the sky-dome shader. This file is the primitive swap only.
import * as THREE from 'three';

const NEAR = 140, MID = 340, COUNT = NEAR + MID;   // hero density bumped to ~480 (Fable: driving, not steady) — via COUNT, never alpha
const R_FAR = 38, Y_LO = -26, Y_HI = 26;   // tighter volume → the hero streaks read DENSE near the camera (Layer C adds far density)
const LEAN_K = 0.25;   // ~14° off vertical along the wind

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rain = null, mat = null, iPosAttr = null;
let off = null, speed = null;
const _dir = new THREE.Vector3();

export function createRain(scene) {
  const rnd = mulberry32(0x7a1f2e3d);
  // Base quad: position.xy = (u,v) in [0,1]; two tris. Instanced COUNT times.
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 2, 1, 3]);

  const iPos = new Float32Array(COUNT * 3);
  const iLen = new Float32Array(COUNT);
  const iWidth = new Float32Array(COUNT);
  const iAlpha = new Float32Array(COUNT);
  off = new Float32Array(COUNT * 3);
  speed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const near = i < NEAR;
    const rad = 5 + rnd() * (R_FAR - 5);
    const ang = rnd() * Math.PI * 2;
    off[i * 3] = Math.cos(ang) * rad;
    off[i * 3 + 1] = Y_LO + rnd() * (Y_HI - Y_LO);
    off[i * 3 + 2] = Math.sin(ang) * rad;
    // ±40% length variance is mandatory (uniformity is the debug tell) + a rare extra-long
    // speed-line class (~10% of heroes at 11–12m) that sells the wind harder than uniform lengths.
    const lv = 0.6 + rnd() * 0.8;
    iLen[i] = (near && rnd() < 0.1) ? (11.0 + rnd()) : (near ? 7.0 : 3.75) * lv;   // near 5–9m (+long class), mid 2.5–5m
    iWidth[i] = near ? 0.07 + rnd() * 0.04 : 0.045 + rnd() * 0.025;
    iAlpha[i] = near ? 0.30 : 0.18;
    speed[i] = (near ? 30 : 22) * (0.8 + rnd() * 0.4);      // ±20%
  }
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
  geo.setAttribute('iLen', new THREE.InstancedBufferAttribute(iLen, 1));
  geo.setAttribute('iWidth', new THREE.InstancedBufferAttribute(iWidth, 1));
  geo.setAttribute('iAlpha', new THREE.InstancedBufferAttribute(iAlpha, 1));
  geo.instanceCount = COUNT;
  iPosAttr = geo.getAttribute('iPos');

  mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xc6d0d2) },   // overcast pale slate — NEVER white
      uRainMix: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uFall: { value: new THREE.Vector3(0, -1, 0) },
    },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute float iLen; attribute float iWidth; attribute float iAlpha;
      uniform vec3 uCamPos, uFall;
      varying vec2 vUV; varying float vAlpha; varying float vScreenX; varying float vWorldY;
      void main() {
        vUV = position.xy; vAlpha = iAlpha; vWorldY = iPos.y;
        // Axis-billboard: long axis = the fall vector; width axis faces the camera around it.
        vec3 view = normalize(uCamPos - iPos);
        vec3 wAxis = normalize(cross(uFall, view));
        // v=0 at the leading (bottom) drop, v=1 at the trailing (up-wind) tail.
        vec3 world = iPos - uFall * (position.y * iLen) + wAxis * ((position.x - 0.5) * iWidth);
        vec4 clip = projectionMatrix * viewMatrix * vec4(world, 1.0);
        vScreenX = clip.x / clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uRainMix; uniform vec3 uCamPos;
      varying vec2 vUV; varying float vAlpha; varying float vScreenX; varying float vWorldY;
      void main() {
        // Procedural SOFT STREAK: feathered across the width, a bright core band ~35–55% up the
        // length with a long up-tail feather and a short tip feather — a rain streak, not a bar.
        float he = pow(1.0 - abs(2.0 * vUV.x - 1.0), 1.7);
        float ve = smoothstep(0.0, 0.35, vUV.y) * smoothstep(1.0, 0.55, vUV.y);
        // Readability: clean the pale horizon SLOT + relieve the center third (rings/telegraphs).
        float hf = 1.0 - smoothstep(14.0, 22.0, vWorldY - uCamPos.y);
        float cf = mix(0.5, 1.0, smoothstep(0.0, 0.5, abs(vScreenX)));
        float a = vAlpha * he * ve * hf * cf * uRainMix;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
  rain = new THREE.Mesh(geo, mat);
  rain.frustumCulled = false;
  rain.renderOrder = 3;
  rain.visible = false;
  scene.add(rain);
}

// Tier degrade: full / ~170 / ~90 quads (instanceCount, no rebuild).
export function setRainTier(t) {
  if (!rain) return;
  rain.geometry.instanceCount = t >= 2 ? 90 : (t >= 1 ? 170 : COUNT);
}

export function updateRain(dt, camera, env) {
  if (!rain) return;
  const mix = env.rainMix || 0;
  mat.uniforms.uRainMix.value = mix;
  rain.visible = mix > 0.005;
  if (!rain.visible) return;

  _dir.set((env.windX || 0) * LEAN_K, -1, (env.windZ || 0) * LEAN_K).normalize();
  mat.uniforms.uFall.value.copy(_dir);
  mat.uniforms.uCamPos.value.copy(camera.position);
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  const span = Y_HI - Y_LO, box = 2 * R_FAR;
  const p = iPosAttr.array;
  for (let i = 0; i < COUNT; i++) {
    const s = speed[i] * dt;
    let ox = off[i * 3] + _dir.x * s;
    let oy = off[i * 3 + 1] + _dir.y * s;
    let oz = off[i * 3 + 2] + _dir.z * s;
    if (oy < Y_LO) oy += span;
    if (ox < -R_FAR) ox += box; else if (ox > R_FAR) ox -= box;
    if (oz < -R_FAR) oz += box; else if (oz > R_FAR) oz -= box;
    off[i * 3] = ox; off[i * 3 + 1] = oy; off[i * 3 + 2] = oz;
    p[i * 3] = cx + ox; p[i * 3 + 1] = cy + oy; p[i * 3 + 2] = cz + oz;
  }
  iPosAttr.needsUpdate = true;
}
