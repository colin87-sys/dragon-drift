import * as THREE from 'three';
import { SUN_DIR } from './biomes.js';

// Soft contact shadow that grounds the dragon on the water. A single flat plane
// (~1 draw call) with a procedural radial-falloff shader — no texture, no shadow
// map, no extra scene pass. Size + opacity track the dragon's ALTITUDE: low and
// skimming → tight and dark; high → wide and faint, which doubles as a readable
// height cue. Offset slightly away from the sun along the ground for plausibility.
//
// Lives on layer 1, so the planar water reflection pass (which renders layer 0
// only) never mirrors the shadow back at its own caster.

let mesh = null;
let quality = 1;
const _pos = new THREE.Vector3();

// Ground projection of the sun direction (where the shadow is pushed): opposite
// the sun's horizontal bearing, normalized in xz.
const _sunGround = new THREE.Vector2(-SUN_DIR.x, -SUN_DIR.z).normalize();

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const fragmentShader = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 d = vUv - 0.5;
    float r = length(d) * 2.0;            // 0 at centre, 1 at the rim
    float a = smoothstep(1.0, 0.0, r);    // soft falloff
    a = pow(a, 1.7) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }`;

export function initContactShadow(scene) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x05101a) },
      uOpacity: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;       // lay flat on the water
  mesh.position.y = 0.06;               // just above the surface (z-fight guard)
  mesh.frustumCulled = false;
  mesh.layers.set(1);                   // excluded from the water reflection
  scene.add(mesh);
}

export function setContactShadowQuality(q) {
  quality = q;
}

// Track under the player each frame. alt drives both spread (higher = wider) and
// opacity (higher = fainter). The lowest quality tier dims it toward off.
export function updateContactShadow(dt, player) {
  if (!mesh) return;
  const alt = Math.max(player.position.y, 0);
  // Altitude 0..~22 → 0..1. Strong+tight near the deck, wide+faint up high.
  const hi = THREE.MathUtils.clamp((alt - 2.0) / 20.0, 0, 1);
  const radius = 4.2 + hi * 7.0;
  // Push the blob away from the sun along the ground, scaled by altitude.
  const off = alt * 0.18;
  _pos.set(
    player.position.x + _sunGround.x * off,
    0.06,
    player.position.z + _sunGround.y * off
  );
  mesh.position.x = _pos.x;
  mesh.position.z = _pos.z;
  // Squash a touch along the travel axis so it reads like a cast shadow, not a disc.
  mesh.scale.set(radius * 1.15, radius, 1);
  const qFade = THREE.MathUtils.clamp((quality - 0.2) / 0.4, 0, 1); // tier2 dims out
  const target = (0.42 * (1.0 - hi * 0.62)) * qFade;
  const u = mesh.material.uniforms.uOpacity;
  u.value += (target - u.value) * Math.min(dt * 8, 1);
}

export function resetContactShadow() {
  if (mesh) mesh.material.uniforms.uOpacity.value = 0;
}
