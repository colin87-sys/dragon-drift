import * as THREE from 'three';
import { SWELL } from './water.js';

// N10c — prop foam collars (GRAPHICS-OVERHAUL.md). A ring of broken, pulsing foam
// at each prop's waterline, so towers/crystals/ruins read as WELDED into the sea
// instead of pasted onto it. One shared ring geometry + one shared ShaderMaterial
// across every band; each band gets a SIBLING InstancedMesh (same count, same index
// as its props, written in the same writeMatrix call) so recycling, biome parking,
// and the arena gate are inherited for free. Rides the N10a swell in the VERTEX
// shader (shared SWELL constant) so it stays welded as the sea heaves. Layer 1, so
// it skips the god-ray occlusion mask + the reflector pass. Default OFF (mesh
// hidden) → byte-identical shipped frame.

export const foamUniforms = {
  time:      { value: 0 },
  waveAmp:   { value: 1 },
  uFoamSwell: { value: 0 }, // 0 = flat collars (swell off) → matches waterSurfaceHeight=0
  fogNear:   { value: 70 },
  fogFar:    { value: 380 },
};

// Flat annulus at the waterline. rotateX(-π/2): the ring's local radius reads off
// length(position.xz) in [INNER, 1.0].
const INNER = 0.62;
const ringGeometry = new THREE.RingGeometry(INNER, 1.0, 28).rotateX(-Math.PI / 2);

const foamMaterial = new THREE.ShaderMaterial({
  name: 'PropFoam',
  uniforms: foamUniforms,
  transparent: true,
  depthWrite: false,
  depthTest: true,
  fog: false, // manual fog fade below (the global fog chunk isn't wanted on a decal)
  vertexShader: /* glsl */`
    uniform float time, waveAmp, uFoamSwell;
    varying float vRadius;
    varying vec3 vWPos;
    varying float vFogDepth;
    void main() {
      vRadius = length(position.xz);                       // INNER..1.0 across the ring
      vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
      // Ride the swell (shared SWELL constant — same field the water surface uses),
      // then a tiny constant lift so the decal never z-fights the water. 0 when off.
      wp.y += uFoamSwell * waveAmp * ${SWELL.amp} * sin(dot(wp.xz, vec2(${SWELL.dirx}, ${SWELL.dirz})) * ${SWELL.freq} + time * ${SWELL.speed});
      wp.y += 0.05;
      vWPos = wp.xyz;
      vFogDepth = length(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform float time, fogNear, fogFar;
    varying float vRadius;
    varying vec3 vWPos;
    varying float vFogDepth;
    float _fhash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      // Radial band: broad, peaking just inside the outer edge, feathering both ways.
      float band = smoothstep(${INNER.toFixed(2)}, 0.80, vRadius) * (1.0 - smoothstep(0.90, 1.0, vRadius));
      // Broken, time-pulsed edge in WORLD cells (props are absolute world-z) — the
      // same hash idiom the water's crest foam uses, so they read as one system. Two
      // scales of break so the ring tears at both coarse + fine cells (reads as churn).
      float brkC = _fhash(floor(vWPos.xz * 3.0) + floor(time * 1.6));
      float brkF = _fhash(floor(vWPos.xz * 7.0) + floor(time * 1.6) * 1.7);
      // Always-visible churn: a solid ring at half strength (a diagnostic solid ring
      // confirmed the size + placement land perfectly — only intensity failed against
      // the busy water) + a broken, pulsing top half so it still tears like foam
      // rather than reading as a plastic band.
      float brk = 0.5 + 0.5 * smoothstep(0.2, 0.85, brkC) * (0.6 + 0.4 * brkF);
      float foam = band * brk;
      float fog = 1.0 - smoothstep(fogNear, fogFar, vFogDepth); // die into the haze
      gl_FragColor = vec4(vec3(0.95, 0.98, 1.0), foam * fog);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});

// One sibling InstancedMesh per prop band (same count as its props). Hidden by
// default (identity-off) — the renderer never binds/draws it.
export function makeFoamMesh(count) {
  const m = new THREE.InstancedMesh(ringGeometry, foamMaterial, count);
  m.layers.set(1);          // skip the god-ray occlusion mask + the reflector pass
  m.frustumCulled = false;  // matches the prop bands
  m.visible = false;        // default OFF
  return m;
}

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _off = new THREE.Vector3();
const PARK = new THREE.Vector3(0.0001, 0.0001, 0.0001);

// Write the foam ring for prop instance `i`. `foamCfg` = the archetype's `foam`
// config ({ r } radius multiplier) or false (archetype opts out → always parked).
// `active` is the prop's biome-active state (computed in the caller's writeMatrix),
// so foam parks in lockstep with the prop. Flat ring (rotY only, no tilt — a tilted
// ring would exit the water); the tilt only shifts the WATERLINE PIERCE point.
export function writeFoamMatrix(mesh, i, d, foamCfg, active) {
  if (foamCfg && active) {
    const fr = d.r * foamCfg.r;
    // Pierce offset: the prop origin is at y=-0.5 and tilts by d.tilt; the point
    // where its axis crosses the waterline (+0.5 above the base) shifts in xz.
    _e.set(0, d.rotY ?? 0, d.tilt || 0);
    _q.setFromEuler(_e);
    _off.set(0, 0.5 / Math.cos(d.tilt || 0), 0).applyQuaternion(_q);
    _e.set(0, d.rotY ?? 0, 0); // the ring itself stays flat (no tilt)
    _q.setFromEuler(_e);
    _m4.compose(_p.set(d.x + _off.x, 0, -d.dist + _off.z), _q, _s.set(fr, 1, fr));
  } else {
    _m4.compose(_p.set(d.x, -50, -d.dist), _q.identity(), PARK);
  }
  mesh.setMatrixAt(i, _m4);
}

let foamOn = false;
let tier = 0;
export function waterFoamOn() { return foamOn; }
export function setWaterFoam(on) { foamOn = !!on; }
export function setWaterFoamQuality(t) { tier = t; }
// Whether foam meshes should draw this frame, given a band's prop visibility.
// tier2 drops foam (roadmap: foam at tier0/1 only).
export function foamVisible(bandMeshVisible) { return bandMeshVisible && foamOn && tier <= 1; }

// Per-frame uniform tick from updateEnvironment: time + the water's live swell state
// (so the collar rides the exact same heave the surface draws) + the biome fog band.
export function updateFoam(time, waveAmp, swellOn, fogNear, fogFar) {
  foamUniforms.time.value = time;
  foamUniforms.waveAmp.value = waveAmp;
  foamUniforms.uFoamSwell.value = swellOn ? 1 : 0;
  foamUniforms.fogNear.value = fogNear;
  foamUniforms.fogFar.value = fogFar;
}
