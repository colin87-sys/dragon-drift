import * as THREE from 'three';
import { Reflector } from '../lib/objects/Reflector.js';
import { SUN_DIR } from './biomes.js';

// Endless water plane that replaces the snow floor. One GLSL source, two
// variants: USE_REFLECTION samples a Reflector render target (tier 0); the
// cheap variant fakes a sky reflection analytically (mobile / lower tiers).
// Waves are 3 directional sine octaves with analytic-derivative normals in
// WORLD-space xz — the plane slides with the player on z, so world coords
// keep the waves stationary instead of swimming along.

let water = null;          // current mesh (Reflector or plain Mesh)
let sceneRef = null;
let reflective = false;

const SIZE_W = 520;
const SIZE_L = 1700;

const sharedUniforms = {
  time: { value: 0 },
  waveAmp: { value: 1.0 },
  deepColor: { value: new THREE.Color(0x0d3a5c) },
  shallowColor: { value: new THREE.Color(0x2e8aa8) },
  sunDir: { value: SUN_DIR.clone() },
  sunColor: { value: new THREE.Color(0xffb070) },
  horizonColor: { value: new THREE.Color(0xff9a55) },
  zenithColor: { value: new THREE.Color(0x1c2e5e) },
  fogColor: { value: new THREE.Color(0xd99a7a) },
  fogNear: { value: 70 },
  fogFar: { value: 380 },
};

const vertexShader = /* glsl */`
  varying vec3 vWorldPos;
  #ifdef USE_REFLECTION
    uniform mat4 textureMatrix;
    varying vec4 vUvProj;
  #endif
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    #ifdef USE_REFLECTION
      vUvProj = textureMatrix * vec4(position, 1.0);
    #endif
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const fragmentShader = /* glsl */`
  varying vec3 vWorldPos;
  uniform float time, waveAmp;
  uniform vec3 deepColor, shallowColor, sunDir, sunColor, horizonColor, zenithColor, fogColor;
  uniform float fogNear, fogFar;
  #ifdef USE_REFLECTION
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    varying vec4 vUvProj;
  #endif

  // One directional sine octave; accumulates height + analytic gradient.
  void wave(vec2 p, vec2 dir, float freq, float amp, float speed,
            inout float h, inout vec2 grad) {
    float ph = dot(p, dir) * freq + time * speed;
    h += amp * sin(ph);
    grad += amp * freq * cos(ph) * dir;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 p = vWorldPos.xz;
    float h = 0.0;
    vec2 grad = vec2(0.0);
    wave(p, normalize(vec2( 0.8,  0.6)), 0.50, 0.16 * waveAmp, 1.10, h, grad);
    wave(p, normalize(vec2(-0.6,  0.8)), 0.90, 0.08 * waveAmp, 1.70, h, grad);
    wave(p, normalize(vec2( 0.2, -1.0)), 1.70, 0.045 * waveAmp, 2.40, h, grad);
    vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));

    vec3 V = normalize(cameraPosition - vWorldPos);
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 5.0);

    // Base water body: shallows pick up light at glancing wave faces.
    vec3 base = mix(deepColor, shallowColor, clamp(0.5 + h * 1.4, 0.0, 1.0) * 0.55);

    vec3 refl;
    #ifdef USE_REFLECTION
      vec2 distort = N.xz * 0.42;
      vec4 proj = vUvProj;
      proj.xy += distort * proj.w;
      refl = texture2DProj(tDiffuse, proj).rgb;
    #else
      // Analytic sky reflection + cheap sparkle glints.
      vec3 R = reflect(-V, N);
      refl = mix(horizonColor, zenithColor, pow(clamp(R.y, 0.0, 1.0), 0.55));
      float sk = hash(floor(p * 2.6) + floor(time * 3.0));
      refl += sunColor * step(0.985, sk) * 2.2 * pow(1.0 - NdotV, 2.0);
    #endif

    vec3 col = mix(base, refl, clamp(fresnel * 1.35, 0.0, 1.0));

    // Golden sun streak: compress the normal's x so the highlight stretches
    // toward the camera (classic low-sun water glitter lane).
    vec3 Ns = normalize(vec3(N.x * 0.30, N.y, N.z));
    vec3 H = normalize(normalize(sunDir) + V);
    float spec = pow(max(dot(Ns, H), 0.0), 240.0);
    col += sunColor * spec * 2.6;

    // Crest foam: a broken band where the swell peaks. Hashed in world cells
    // (and time-stepped) so it tears apart instead of reading as a flat cap, and
    // gated to real peaks so calm biomes (frozen/astral) stay glassy.
    float crest = smoothstep(0.13 * waveAmp + 0.03, 0.26 * waveAmp + 0.05, h);
    float foamN = hash(floor(p * 3.0) + floor(time * 1.6));
    float foam = crest * smoothstep(0.55, 1.0, foamN);
    col += vec3(0.82, 0.92, 1.0) * foam * 0.4;

    // Fine sun-glitter on the wave faces toward the camera — a sparse, slow
    // twinkle gated to glancing angles (both water variants; the reflective path
    // otherwise has no micro-sparkle of its own). Kept rare so it reads as
    // catch-lights, not noise.
    float glit = hash(floor(p * 4.0) + floor(time * 3.0));
    col += sunColor * step(0.9965, glit) * pow(1.0 - NdotV, 1.6) * 1.5;

    // Manual fog (matches scene linear fog).
    float dist = length(vWorldPos - cameraPosition);
    col = mix(col, fogColor, smoothstep(fogNear, fogFar, dist));

    gl_FragColor = vec4(col, 1.0);
    // These chunks are render-target aware in r160: the renderer forces
    // NoToneMapping + linear output when drawing into the composer's HDR target
    // (so they no-op there and OutputPass owns ACES+sRGB), and apply ACES+sRGB
    // on the tier-2 direct-to-screen path. One shader, both paths, no double grade.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function buildReflective() {
  const shader = {
    name: 'DragonWaterReflective',
    uniforms: {
      ...THREE.UniformsUtils.clone(sharedUniforms),
      color: { value: new THREE.Color(0xffffff) },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
    },
    vertexShader,
    fragmentShader,
  };
  // Tier 0 is the only reflective tier, so the hero mirror can afford a sharper
  // render target — 768² keeps reflected props/dragon crisp instead of mushy.
  const mesh = new Reflector(new THREE.PlaneGeometry(SIZE_W, SIZE_L), {
    shader,
    textureWidth: 768,
    textureHeight: 768,
    clipBias: 0.02,
    multisample: 0,
  });
  mesh.material.defines = { USE_REFLECTION: '' };
  mesh.material.needsUpdate = true;
  // Mirror pass renders gameplay layer 0 only — sprite clutter (trails,
  // particles, aura) lives on layer 1 and is excluded from the reflection.
  mesh.camera.layers.set(0);
  return mesh;
}

function buildCheap() {
  const mat = new THREE.ShaderMaterial({
    name: 'DragonWaterCheap',
    uniforms: THREE.UniformsUtils.clone(sharedUniforms),
    vertexShader,
    fragmentShader,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(SIZE_W, SIZE_L), mat);
}

export function createWater(scene, useReflection) {
  sceneRef = scene;
  reflective = useReflection;
  water = useReflection ? buildReflective() : buildCheap();
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0;
  water.frustumCulled = false;
  scene.add(water);
}

// Rebuild on tier boundary crossings (rare; hysteresis in the quality system
// keeps this from thrashing).
export function setWaterReflective(useReflection) {
  if (!sceneRef || useReflection === reflective) return;
  const old = water;
  // Carry current tint into the rebuild.
  const u = old.material.uniforms;
  for (const k of Object.keys(sharedUniforms)) {
    const sv = sharedUniforms[k].value;
    if (sv && sv.copy) sv.copy(u[k].value);
    else sharedUniforms[k].value = u[k].value;
  }
  sceneRef.remove(old);
  if (old.dispose) old.dispose();
  else old.material.dispose();
  old.geometry.dispose();
  createWater(sceneRef, useReflection);
}

export function updateWater(dt, playerDist, time, fog) {
  if (!water) return;
  water.position.z = -playerDist - 250;
  const u = water.material.uniforms;
  u.time.value = time;
  if (fog) {
    u.fogColor.value.copy(fog.color);
    u.fogNear.value = fog.near;
    u.fogFar.value = fog.far;
  }
}

// Biome hook (Phase 3): lerp water palette along with sky/fog.
export function setWaterTint({ deep, shallow, sun, horizon, zenith, waveAmp }) {
  if (!water) return;
  const u = water.material.uniforms;
  if (deep) u.deepColor.value.copy(deep);
  if (shallow) u.shallowColor.value.copy(shallow);
  if (sun) u.sunColor.value.copy(sun);
  if (horizon) u.horizonColor.value.copy(horizon);
  if (zenith) u.zenithColor.value.copy(zenith);
  if (waveAmp !== undefined) u.waveAmp.value = waveAmp;
}
