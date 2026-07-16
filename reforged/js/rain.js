// rain.js — driving STORM RAIN as world-space LineSegments (Tempest Reach).
//
// Approach B (Fable rain/wind pre-assess): true 3D streaks, not screen-space stickers — so they
// rotate correctly when the camera yaws / the dragon banks, and they consume the SAME per-biome
// WIND vector (env.windX/windZ) as the foam, so the whole storm leans one way (composition law #6).
// LineSegments are overdraw-exempt (the lightning precedent). Gated by env.rainMix (0 everywhere
// except Tempest → byte-identical). Render-only: no RNG on the course stream, no determinism surface.
//
// Readability guards (baked into the shader): height-fade kills rain in the pale horizon SLOT (the
// value hole is the composition hero); a center-screen relief halves rain where rings/telegraphs
// live; distance shells fade the far field so rain reads as DEPTH, not noise.
import * as THREE from 'three';

const COUNT = 700;              // segments; halved per tier via draw range
const R_MIN = 6, R_FAR = 60;   // cylinder radius around the camera
const Y_LO = -26, Y_HI = 26;   // vertical span (camera-relative)
const FALL = 34;               // m/s along the wind+down vector
const LEAN_K = 0.32;           // wind lean → ~18° off vertical

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rain = null, mat = null, posAttr = null;
let off = null, lens = null;   // camera-relative offsets + per-segment length jitter
const _dir = new THREE.Vector3();

export function createRain(scene) {
  const rnd = mulberry32(0x7a1f2e3d);
  const pos = new Float32Array(COUNT * 2 * 3);
  off = new Float32Array(COUNT * 3);
  lens = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const rad = R_MIN + rnd() * (R_FAR - R_MIN);
    const ang = rnd() * Math.PI * 2;
    off[i * 3] = Math.cos(ang) * rad;
    off[i * 3 + 1] = Y_LO + rnd() * (Y_HI - Y_LO);
    off[i * 3 + 2] = Math.sin(ang) * rad;
    lens[i] = 1.4 + (rnd() - 0.5) * 0.8;   // 1.4m ± 0.4 — jitter LENGTH, never angle (one wind)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  posAttr = geo.attributes.position;
  mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xaebcbe) },   // overcast pale slate — NEVER white (white = the star-read)
      uRainMix: { value: 0 },
      uCamY: { value: 0 },
      uOpNear: { value: 0.32 },
    },
    vertexShader: /* glsl */`
      uniform float uCamY;
      varying float vAlpha;
      varying float vScreenX;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec4 clip = projectionMatrix * mv;
        // Height fade: clean the pale horizon SLOT — rain across the value hole is vandalism.
        float hf = 1.0 - smoothstep(14.0, 22.0, position.y - uCamY);
        // Distance shell: near full, far ~0.55 → rain reads as depth planes, not a flat wall.
        float shell = mix(1.0, 0.55, smoothstep(30.0, 46.0, length(mv.xyz)));
        vAlpha = hf * shell;
        vScreenX = clip.x / clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uRainMix, uOpNear;
      varying float vAlpha; varying float vScreenX;
      void main() {
        // Center-screen relief: rings / gates / telegraphs live here — halve rain in the central third.
        float cf = mix(0.5, 1.0, smoothstep(0.0, 0.5, abs(vScreenX)));
        float a = uOpNear * vAlpha * cf * uRainMix;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  });
  rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  rain.renderOrder = 3;
  rain.visible = false;
  scene.add(rain);
}

// Tier degrade: halve the drawn segments at tier 1, quarter at tier 2 (draw range, no rebuild).
export function setRainTier(t) {
  if (!rain) return;
  const n = t >= 2 ? (COUNT >> 2) : (t >= 1 ? (COUNT >> 1) : COUNT);
  rain.geometry.setDrawRange(0, n * 2);
}

export function updateRain(dt, camera, env) {
  if (!rain) return;
  const mix = env.rainMix || 0;
  mat.uniforms.uRainMix.value = mix;
  rain.visible = mix > 0.005;
  if (!rain.visible) return;

  // One wind vector (env.windX/windZ) + down → the streaks lean ~18° into the wind, all identical.
  _dir.set((env.windX || 0) * LEAN_K, -1, (env.windZ || 0) * LEAN_K).normalize();
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  mat.uniforms.uCamY.value = cy;
  const step = FALL * dt, span = Y_HI - Y_LO, box = 2 * R_FAR;
  const p = posAttr.array;
  for (let i = 0; i < COUNT; i++) {
    let ox = off[i * 3] + _dir.x * step;
    let oy = off[i * 3 + 1] + _dir.y * step;
    let oz = off[i * 3 + 2] + _dir.z * step;
    if (oy < Y_LO) oy += span;                       // fall wrap
    if (ox < -R_FAR) ox += box; else if (ox > R_FAR) ox -= box;
    if (oz < -R_FAR) oz += box; else if (oz > R_FAR) oz -= box;
    off[i * 3] = ox; off[i * 3 + 1] = oy; off[i * 3 + 2] = oz;
    const wx = cx + ox, wy = cy + oy, wz = cz + oz, L = lens[i];
    const j = i * 6;
    p[j] = wx; p[j + 1] = wy; p[j + 2] = wz;                              // leading drop
    p[j + 3] = wx - _dir.x * L; p[j + 4] = wy - _dir.y * L; p[j + 5] = wz - _dir.z * L; // trail up-wind
  }
  posAttr.needsUpdate = true;
}
