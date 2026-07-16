// rain.js — premium STORM RAIN as soft tapered streak QUADS (Tempest Reach).
//
// A single NON-INSTANCED merged-quad BufferGeometry — the same rendering path as the LineSegments
// this replaced (which rendered fine on real mobile), just quads for the soft procedural taper.
// (An earlier InstancedBufferGeometry+ShaderMaterial version rendered in the headless software GL
// but showed NOTHING on a real iPhone — instanced raw geometry is the mobile-fragile path, so we
// avoid it.) Each quad is CPU-billboarded to the camera around the world FALL vector (down, leaned
// ~14° along the shared TEMPEST_WIND — same vector the foam combs + the cloud crawls). Softness is
// procedural in-shader (feathered core + long up-tail, no texture). ±40% length variance + a rare
// long speed-line class. rainMix-gated (0 elsewhere = byte-identical), tier-thinned, render-only.
import * as THREE from 'three';

const NEAR = 140, MID = 340, COUNT = NEAR + MID;   // ~480 hero quads (density via COUNT, never alpha)
const R_FAR = 38, Y_LO = -26, Y_HI = 26;
const LEAN_K = 0.25;   // ~14° off vertical along the wind

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rain = null, mat = null, posAttr = null, drawCount = COUNT;
let off = null, len = null, wid = null, spd = null;
const _dir = new THREE.Vector3(), _view = new THREE.Vector3(), _wax = new THREE.Vector3();

export function createRain(scene) {
  const rnd = mulberry32(0x7a1f2e3d);
  const pos = new Float32Array(COUNT * 4 * 3);
  const uv = new Float32Array(COUNT * 4 * 2);
  const alpha = new Float32Array(COUNT * 4);
  const idx = new Uint16Array(COUNT * 6);
  off = new Float32Array(COUNT * 3);
  len = new Float32Array(COUNT); wid = new Float32Array(COUNT); spd = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const near = i < NEAR;
    const rad = 5 + rnd() * (R_FAR - 5), ang = rnd() * Math.PI * 2;
    off[i * 3] = Math.cos(ang) * rad;
    off[i * 3 + 1] = Y_LO + rnd() * (Y_HI - Y_LO);
    off[i * 3 + 2] = Math.sin(ang) * rad;
    const lv = 0.6 + rnd() * 0.8;                                   // ±40% length variance (kills uniformity)
    len[i] = (near && rnd() < 0.1) ? (11.0 + rnd()) : (near ? 7.0 : 3.75) * lv;   // near 5–9m (+rare 11–12m speed-line), mid 2.5–5m
    wid[i] = near ? 0.07 + rnd() * 0.04 : 0.045 + rnd() * 0.025;
    spd[i] = (near ? 30 : 22) * (0.8 + rnd() * 0.4);               // fall speed ±20%
    const a = near ? 0.30 : 0.18;
    const v = i * 4, u = i * 8;
    uv[u] = 0; uv[u + 1] = 0; uv[u + 2] = 1; uv[u + 3] = 0; uv[u + 4] = 0; uv[u + 5] = 1; uv[u + 6] = 1; uv[u + 7] = 1;
    alpha[v] = alpha[v + 1] = alpha[v + 2] = alpha[v + 3] = a;
    const t = i * 6;
    idx[t] = v; idx[t + 1] = v + 1; idx[t + 2] = v + 2; idx[t + 3] = v + 2; idx[t + 4] = v + 1; idx[t + 5] = v + 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  posAttr = geo.attributes.position;

  mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xc6d0d2) },   // overcast pale slate — NEVER white
      uRainMix: { value: 0 },
      uCamY: { value: 0 },
    },
    vertexShader: /* glsl */`
      attribute float aAlpha;
      uniform float uCamY;
      varying vec2 vUV; varying float vAlpha; varying float vScreenX; varying float vWorldY;
      void main() {
        vUV = uv; vAlpha = aAlpha; vWorldY = position.y - uCamY;
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vScreenX = clip.x / clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uRainMix;
      varying vec2 vUV; varying float vAlpha; varying float vScreenX; varying float vWorldY;
      void main() {
        // Procedural SOFT STREAK: feathered across the width, a bright core ~35–55% up the length
        // with a long up-tail feather + short tip — a rain streak, not a bar.
        float he = pow(1.0 - abs(2.0 * vUV.x - 1.0), 1.7);
        float ve = smoothstep(0.0, 0.35, vUV.y) * smoothstep(1.0, 0.55, vUV.y);
        float hf = 1.0 - smoothstep(14.0, 22.0, vWorldY);            // clean the pale horizon SLOT
        float cf = mix(0.5, 1.0, smoothstep(0.0, 0.5, abs(vScreenX))); // relieve the center (rings/telegraphs)
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

// Tier degrade: full / ~340 / ~180 quads (index draw range, no rebuild).
export function setRainTier(t) {
  drawCount = t >= 2 ? 180 : (t >= 1 ? 340 : COUNT);
  if (rain) rain.geometry.setDrawRange(0, drawCount * 6);
}

export function updateRain(dt, camera, env) {
  if (!rain) return;
  const mix = env.rainMix || 0;
  mat.uniforms.uRainMix.value = mix;
  rain.visible = mix > 0.005;
  if (!rain.visible) return;

  _dir.set((env.windX || 0) * LEAN_K, -1, (env.windZ || 0) * LEAN_K).normalize();
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  mat.uniforms.uCamY.value = cy;
  const span = Y_HI - Y_LO, box = 2 * R_FAR;
  const p = posAttr.array;
  for (let i = 0; i < drawCount; i++) {
    const s = spd[i] * dt;
    let ox = off[i * 3] + _dir.x * s, oy = off[i * 3 + 1] + _dir.y * s, oz = off[i * 3 + 2] + _dir.z * s;
    if (oy < Y_LO) oy += span;
    if (ox < -R_FAR) ox += box; else if (ox > R_FAR) ox -= box;
    if (oz < -R_FAR) oz += box; else if (oz > R_FAR) oz -= box;
    off[i * 3] = ox; off[i * 3 + 1] = oy; off[i * 3 + 2] = oz;
    const wx = cx + ox, wy = cy + oy, wz = cz + oz;
    // Billboard the quad to the camera around the fall axis.
    _view.set(-ox, -oy, -oz).normalize();          // camera → this drop (camera-relative)
    _wax.crossVectors(_dir, _view).normalize();
    const hw = wid[i] * 0.5, L = len[i];
    // up-wind trail = -fall * L
    const tx = -_dir.x * L, ty = -_dir.y * L, tz = -_dir.z * L;
    const j = i * 12;
    p[j]     = wx - _wax.x * hw; p[j + 1]  = wy - _wax.y * hw; p[j + 2]  = wz - _wax.z * hw;          // (0,0)
    p[j + 3] = wx + _wax.x * hw; p[j + 4]  = wy + _wax.y * hw; p[j + 5]  = wz + _wax.z * hw;          // (1,0)
    p[j + 6] = wx - _wax.x * hw + tx; p[j + 7]  = wy - _wax.y * hw + ty; p[j + 8]  = wz - _wax.z * hw + tz; // (0,1)
    p[j + 9] = wx + _wax.x * hw + tx; p[j + 10] = wy + _wax.y * hw + ty; p[j + 11] = wz + _wax.z * hw + tz; // (1,1)
  }
  posAttr.needsUpdate = true;
}
