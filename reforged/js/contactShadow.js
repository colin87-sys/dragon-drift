import * as THREE from 'three';
import { SUN_DIR } from './biomes.js';
import { getDragonGroup } from './dragon.js';

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

// --- N6 hero shadow (opt-in): the dragon's REAL silhouette, not a radial blob.
// A tiny top-down orthographic pass renders the dragon alone (on layer 2, black
// override → white silhouette on black) into a small RT; the ground plane samples
// it 1:1 (the plane exactly covers the ortho footprint, so plane.uv == the shadow
// camera's view). Wingbeats show in the shadow. Reuses the god-ray "render a tiny
// aux pass" pattern. OFF by default → the blob above is the shipped fallback.
const SHADOW_LAYER = 2;
const FIT = 9.0;         // ortho half-extent (world units) — covers the wingspan
const RT_SIZE = 128;
let silRT = null, shadowCam = null, whiteMat = null, blobMat = null, silMat = null;
let silhouette = false;
const _tmpMask = { v: 0 };

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

// Silhouette-sampling fragment: reads the top-down dragon mask from the RT with a
// 4-tap soften (radius grows with altitude), fades near the UV border to hide the
// ortho-frustum edge, and grounds it as a dark shadow.
const silFragmentShader = /* glsl */`
  uniform sampler2D uSil;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSoft;      // tap radius in UV — rises with altitude
  varying vec2 vUv;
  void main() {
    float s = texture2D(uSil, vUv + vec2( uSoft,  uSoft)).r
            + texture2D(uSil, vUv + vec2(-uSoft,  uSoft)).r
            + texture2D(uSil, vUv + vec2( uSoft, -uSoft)).r
            + texture2D(uSil, vUv + vec2(-uSoft, -uSoft)).r;
    s *= 0.25;
    vec2 e = smoothstep(0.0, 0.10, vUv) * smoothstep(0.0, 0.10, 1.0 - vUv);
    gl_FragColor = vec4(uColor, s * uOpacity * e.x * e.y);
  }`;

export function initContactShadow(scene) {
  blobMat = new THREE.ShaderMaterial({
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
  mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), blobMat);
  mesh.rotation.x = -Math.PI / 2;       // lay flat on the water
  mesh.position.y = 0.06;               // just above the surface (z-fight guard)
  mesh.frustumCulled = false;
  mesh.layers.set(1);                   // excluded from the water reflection
  scene.add(mesh);

  // N6 silhouette rig (dormant until enabled): a 128² mask + a top-down ortho cam
  // + a white override + the sampling material.
  silRT = new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
    depthBuffer: true, stencilBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  shadowCam = new THREE.OrthographicCamera(-FIT, FIT, FIT, -FIT, 0.1, 120);
  shadowCam.up.set(0, 0, -1);           // aligns the RT's uv with the ground plane's uv (1:1)
  shadowCam.layers.set(SHADOW_LAYER);   // renders ONLY the dragon (enabled onto layer 2)
  whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  silMat = new THREE.ShaderMaterial({
    uniforms: {
      uSil: { value: silRT.texture },
      uColor: { value: new THREE.Color(0x05101a) },
      uOpacity: { value: 0 },
      uSoft: { value: 0.004 },
    },
    vertexShader,
    fragmentShader: silFragmentShader,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
}

// Toggle the silhouette shadow. ON swaps the plane to the RT-sampling material;
// OFF restores the shipped radial blob.
export function setContactShadowSilhouette(on) {
  silhouette = !!on && !!silRT;
  if (mesh) {
    mesh.material = silhouette ? silMat : blobMat;
    mesh.material.uniforms.uOpacity.value = 0; // avoid a pop on swap
  }
}

// Render the dragon-only top-down silhouette into the RT. Call once per frame,
// before the composer, only while the silhouette shadow is active (like the
// god-ray mask). Cheap: one small pass, ~a few thousand tris, black/white.
export function renderHeroShadow(renderer) {
  if (!silhouette || !silRT) return;
  const dragon = getDragonGroup();
  if (!dragon) return;
  dragon.traverse((o) => o.layers.enable(SHADOW_LAYER)); // idempotent; survives rebuilds
  // Frame the cam straight down over the dragon's ground point.
  const gx = dragon.position.x, gz = dragon.position.z;
  shadowCam.position.set(gx, 60, gz);
  shadowCam.lookAt(gx, 0, gz);
  shadowCam.updateMatrixWorld();
  const pTarget = renderer.getRenderTarget();
  const pOverride = sceneOf(dragon).overrideMaterial;
  const pBg = sceneOf(dragon).background;
  const scene = sceneOf(dragon);
  scene.overrideMaterial = whiteMat;
  scene.background = _black;
  renderer.setRenderTarget(silRT);
  renderer.render(scene, shadowCam);
  renderer.setRenderTarget(pTarget);
  scene.overrideMaterial = pOverride;
  scene.background = pBg;
}

const _black = new THREE.Color(0x000000);
function sceneOf(obj) { let o = obj; while (o.parent) o = o.parent; return o; }

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
  const qFade = THREE.MathUtils.clamp((quality - 0.2) / 0.4, 0, 1); // tier2 dims out
  const u = mesh.material.uniforms.uOpacity;

  if (silhouette) {
    // Silhouette: the plane exactly covers the ortho footprint (2·FIT), centred
    // under the dragon, so uv samples the mask 1:1. Altitude → fainter + softer.
    mesh.position.x = player.position.x;
    mesh.position.z = player.position.z;
    mesh.scale.set(FIT * 2, FIT * 2, 1);
    mesh.material.uniforms.uSoft.value = 0.004 + hi * 0.02; // blur out as it lifts
    const target = (0.5 * (1.0 - hi * 0.55)) * qFade;
    u.value += (target - u.value) * Math.min(dt * 8, 1);
    return;
  }

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
  const target = (0.42 * (1.0 - hi * 0.62)) * qFade;
  u.value += (target - u.value) * Math.min(dt * 8, 1);
}

// Test/debug: fraction of the silhouette RT covered by the dragon (white). >0
// confirms the top-down dragon pass actually rendered into the mask; ~[0.02,0.5]
// is a sane wingspan. Returns -1 if the silhouette rig isn't built.
export function heroShadowCoverage(renderer) {
  if (!silRT) return -1;
  const n = RT_SIZE * RT_SIZE;
  const buf = new Uint8Array(n * 4);
  renderer.readRenderTargetPixels(silRT, 0, 0, RT_SIZE, RT_SIZE, buf);
  let white = 0;
  for (let i = 0; i < n; i++) if (buf[i * 4] > 128) white++;
  return white / n;
}

export function contactShadowSilhouette() { return silhouette; }

// Debug: the silhouette RT as a PNG data URL (GL is bottom-up, so flip). Lets a
// tool show the actual dragon-shaped mask.
export function heroShadowMaskURL(renderer) {
  if (!silRT) return null;
  const buf = new Uint8Array(RT_SIZE * RT_SIZE * 4);
  renderer.readRenderTargetPixels(silRT, 0, 0, RT_SIZE, RT_SIZE, buf);
  const cv = document.createElement('canvas');
  cv.width = RT_SIZE; cv.height = RT_SIZE;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(RT_SIZE, RT_SIZE);
  for (let y = 0; y < RT_SIZE; y++) for (let x = 0; x < RT_SIZE; x++) {
    const s = ((RT_SIZE - 1 - y) * RT_SIZE + x) * 4, d = (y * RT_SIZE + x) * 4;
    img.data[d] = buf[s]; img.data[d + 1] = buf[s + 1]; img.data[d + 2] = buf[s + 2]; img.data[d + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}

export function resetContactShadow() {
  if (mesh) mesh.material.uniforms.uOpacity.value = 0;
}
