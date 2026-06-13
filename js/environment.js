import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { CONFIG } from './config.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { biomeIndexAt, computeEnv } from './biomes.js';
import { setWaterTint } from './water.js';
import { createAmbient, updateAmbient } from './ambient.js';
import { damp } from './util.js';

// Sky dome, lighting, and the prop bands lining the course. Endless: prop
// instances are recycled — anything behind the player leapfrogs ahead with
// fresh jitter. Each archetype (tower, column, obelisk, crystal...) is one
// InstancedMesh; instances outside their home biome park at zero scale, so
// biomes drain in/out naturally as the window advances over the seams.
let sky = null;
let sun = null;
let hemi = null;
let sceneRef = null;
let rnd = null;
let bands = [];
let feverMix = 0;

const WALL_WINDOW = 900; // prop band: 100 behind the player to 800 ahead

// --- Shared prop materials (index = biome matIndex) -------------------------
function makeMats() {
  const opts = { flatShading: true, roughness: 0.7, metalness: 0.05 };
  return {
    // [primary, accent] per biome
    primary: [
      new THREE.MeshStandardMaterial({ ...opts, color: 0x86b39c, emissive: 0x0e2018, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xe2bd8a, emissive: 0x2a1a08, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0x6fb7e8, roughness: 0.32, metalness: 0.1, emissive: 0x123a55, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0x352629, emissive: 0x4a1208, emissiveIntensity: 0.3 }),   // basalt w/ inner heat
      new THREE.MeshStandardMaterial({ ...opts, color: 0x1d4438, emissive: 0x0a3328, emissiveIntensity: 0.4 }),   // night moss
      new THREE.MeshStandardMaterial({ ...opts, color: 0x3a3a6a, emissive: 0x16164a, emissiveIntensity: 0.4 }),   // astral slate
    ],
    accent: [
      new THREE.MeshStandardMaterial({ ...opts, color: 0xc08a50, roughness: 0.5, metalness: 0.25, emissive: 0x2a1505, emissiveIntensity: 0.25 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xb56a40, emissive: 0x251005, emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0x9fd8f0, roughness: 0.3, emissive: 0x1c4a66, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ ...opts, color: 0xff5a20, roughness: 0.4, emissive: 0xff3a08, emissiveIntensity: 0.9 }),  // magma seams
      new THREE.MeshStandardMaterial({ ...opts, color: 0x4dffd0, roughness: 0.35, emissive: 0x18d0a0, emissiveIntensity: 1.0 }), // biolume caps
      new THREE.MeshStandardMaterial({ ...opts, color: 0x9fb8ff, roughness: 0.3, emissive: 0x5a78ff, emissiveIntensity: 1.1 }),  // starlit crystal
    ],
  };
}
let propMats = null;

// --- Archetype geometry builders --------------------------------------------
// All normalized: base at y=0, top ≈ y=1, footprint within ~±0.6.
// Instance scale = (r, h, r). mat 0 = primary stone, 1 = accent (metal/trim).
function xform(geo, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  geo.scale(sx, sy, sz);
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  geo.translate(x, y, z);
  return geo;
}

function mergeParts(parts, biomeIdx) {
  const groups = [[], []];
  for (const p of parts) groups[p.mat].push(p.geo);
  const geos = [];
  const mats = [];
  for (let m = 0; m < 2; m++) {
    if (!groups[m].length) continue;
    geos.push(groups[m].length > 1 ? mergeGeometries(groups[m]) : groups[m][0]);
    mats.push(m === 0 ? propMats.primary[biomeIdx] : propMats.accent[biomeIdx]);
  }
  return { geometry: mergeGeometries(geos, true), materials: mats };
}

const ARCHETYPES = {
  // Sanctuary: verdigris watchtower with a weathered bronze dome.
  tower: {
    step: 42, biomes: [0], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.40, 0.56, 0.74, 8), { y: 0.37 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 8), { y: 0.76 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.46, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.79, sy: 0.6 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.05, 0.2, 5), { y: 1.1 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (17 + rnd() * 9), h: 13 + rnd() * 15, r: 2.4 + rnd() * 1.6, tilt: side * rnd() * 0.05 }),
  },
  // Broken classical column (Sanctuary + Wastes).
  column: {
    step: 20, biomes: [0, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.9, 0.14, 0.9), { y: 0.07 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.27, 0.34, 0.76, 7), { y: 0.52 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.32, 0.27, 0.1, 7), { y: 0.94, rz: 0.12 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 6), h: 4 + rnd() * 6, r: 2 + rnd() * 1.6, tilt: side * (rnd() * 0.14 - 0.04) }),
  },
  // Free-standing ruined arch fragment rising from the water.
  archruin: {
    step: 75, biomes: [0], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.09, 0.13, 0.58, 6), { x: -0.35, y: 0.29 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.09, 0.13, 0.58, 6), { x: 0.35, y: 0.29 }) },
      { mat: 0, geo: xform(new THREE.TorusGeometry(0.35, 0.09, 6, 10, Math.PI), { y: 0.56 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.14, 0.1, 0.16), { y: 0.94 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (19 + rnd() * 8), h: 9 + rnd() * 7, r: 8 + rnd() * 5, tilt: side * rnd() * 0.08 }),
  },
  // Ruined wall slab with a broken crown.
  slab: {
    step: 26, biomes: [0, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.8, 0.95, 0.18), { y: 0.47 }) },
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.42, 0.28, 0.2), { x: 0.22, y: 0.98, rz: 0.28 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.86, 0.07, 0.22), { y: 0.66 }) },
    ], 0),
    place: (side, rnd) => ({ x: side * (16 + rnd() * 6), h: 4 + rnd() * 5, r: 3 + rnd() * 3, tilt: side * (rnd() * 0.2 - 0.06) }),
  },
  // Wastes: weathered four-sided obelisk.
  obelisk: {
    step: 32, biomes: [1], matIndex: 1,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.16, 0.34, 0.86, 4), { y: 0.43 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.18, 0.16, 4), { y: 0.94 }) },
    ], 1),
    place: (side, rnd) => ({ x: side * (16 + rnd() * 9), h: 9 + rnd() * 13, r: 2.4 + rnd() * 1.6, tilt: side * (rnd() * 0.08 - 0.02) }),
  },
  // Great sunken dome on the skyline (Sanctuary + Wastes).
  dome: {
    step: 85, biomes: [0, 1], matIndex: 0,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { sx: 0.5, sz: 0.5 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 6), { y: 1.04 }) },
    ], 0),
    place: (side, rnd) => {
      const r = 14 + rnd() * 9;
      return { x: side * (17 + r * 0.5 + rnd() * 14), h: 4.5 + rnd() * 3.5, r, tilt: 0 };
    },
  },
  // Frozen Reach: the original big crystal spires.
  crystal: {
    step: 13, biomes: [2], matIndex: 2,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(1, 1, 5), { y: 0.42, sy: 1 }) },
    ], 2),
    place: (side, rnd) => ({ x: side * (17 + rnd() * 8), h: 18 + rnd() * 32, r: 3.5 + rnd() * 5, tilt: side * (0.06 + rnd() * 0.1) }),
  },
  crystalSmall: {
    step: 30, biomes: [2], matIndex: 2,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.ConeGeometry(1, 1, 5), { y: 0.42 }) },
    ], 2),
    place: (side, rnd) => {
      const h = 2 + rnd() * 5;
      return { x: side * (13.5 + rnd() * 3), h, r: h * 0.35, tilt: side * rnd() * 0.3 };
    },
  },
  // Emberfall Caldera: jagged basalt spire split by a glowing magma seam.
  basalt: {
    step: 18, biomes: [3], matIndex: 3,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.3, 0.52, 0.95, 5), { y: 0.48 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.17, 0.3, 0.55, 5), { x: 0.24, y: 0.6, rz: 0.2 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.45, 0.5, 0.07, 5), { y: 0.14 }) },
    ], 3),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 9), h: 11 + rnd() * 19, r: 2.2 + rnd() * 1.8, tilt: side * (rnd() * 0.12 - 0.03) }),
  },
  // Squat fumarole cone with a glowing throat.
  vent: {
    step: 42, biomes: [3], matIndex: 3,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.6, 0.85, 6), { y: 0.42 }) },
      { mat: 1, geo: xform(new THREE.CylinderGeometry(0.16, 0.24, 0.12, 6), { y: 0.86 }) },
    ], 3),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 6), h: 3 + rnd() * 3.5, r: 3 + rnd() * 2, tilt: 0 }),
  },
  // Lumen Mire: colossal bioluminescent mushroom, cap lit from within.
  glowcap: {
    step: 26, biomes: [4], matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.13, 0.22, 0.78, 7), { y: 0.39 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.52, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.76, sy: 0.55 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 8), h: 8 + rnd() * 11, r: 2.5 + rnd() * 2.5, tilt: side * (rnd() * 0.1 - 0.03) }),
  },
  glowcapSmall: {
    step: 14, biomes: [4], matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.1, 0.16, 0.6, 6), { y: 0.3 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.36, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.58, sy: 0.5 }) },
      { mat: 0, geo: xform(new THREE.CylinderGeometry(0.07, 0.12, 0.42, 6), { x: 0.3, y: 0.21, rz: -0.16 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), { x: 0.34, y: 0.4, sy: 0.5 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (13.5 + rnd() * 3.5), h: 2 + rnd() * 3.5, r: 1.6 + rnd() * 1.4, tilt: side * rnd() * 0.2 }),
  },
  // Twisting vine spire with a glowing seed-pod tip.
  spirevine: {
    step: 34, biomes: [4], matIndex: 4,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.16, 0.6, 5), { y: 0.3, rz: 0.12 }) },
      { mat: 0, geo: xform(new THREE.ConeGeometry(0.11, 0.5, 5), { x: 0.06, y: 0.72, rz: -0.18 }) },
      { mat: 1, geo: xform(new THREE.SphereGeometry(0.09, 6, 5), { x: 0.02, y: 1.0 }) },
    ], 4),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 5), h: 7 + rnd() * 9, r: 2 + rnd() * 1.5, tilt: side * (rnd() * 0.25 - 0.05) }),
  },
  // Astral Shallows: slate monolith wearing a band of starlit crystal.
  monolith: {
    step: 30, biomes: [5], matIndex: 5,
    build: () => mergeParts([
      { mat: 0, geo: xform(new THREE.BoxGeometry(0.42, 0.96, 0.26), { y: 0.48 }) },
      { mat: 1, geo: xform(new THREE.BoxGeometry(0.5, 0.07, 0.34), { y: 0.62 }) },
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.13, 0.22, 4), { y: 1.07 }) },
    ], 5),
    place: (side, rnd) => ({ x: side * (15 + rnd() * 9), h: 12 + rnd() * 18, r: 2.6 + rnd() * 1.8, tilt: side * (rnd() * 0.06 - 0.02) }),
  },
  // Leaning crystal blade catching the aurora.
  arcshard: {
    step: 22, biomes: [5], matIndex: 5,
    build: () => mergeParts([
      { mat: 1, geo: xform(new THREE.ConeGeometry(0.8, 1, 4), { y: 0.42, sx: 0.55 }) },
    ], 5),
    place: (side, rnd) => ({ x: side * (14 + rnd() * 6), h: 5 + rnd() * 9, r: 1.8 + rnd() * 2, tilt: side * (0.12 + rnd() * 0.22) }),
  },
};

export function createEnvironment(scene, seed = CONFIG.seed) {
  sceneRef = scene;
  rnd = mulberry32(seed + 99);
  propMats = makeMats();
  scene.fog = new THREE.Fog(0xf2c694, 85, 430);

  // --- Sky dome: biome-lerped gradient with a low sun ahead of the player.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x3f7ec8) },
      midColor: { value: new THREE.Color(0xe0a070) },
      horizonColor: { value: new THREE.Color(0xffe2a8) },
      sunGlow: { value: new THREE.Color(0xfff0c8) },
      sunDir: { value: new THREE.Vector3(-0.22, 0.1, -1).normalize() },
      feverMix: { value: 0 },
      starMix: { value: 0 },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 topColor, midColor, horizonColor, sunGlow, sunDir;
      uniform float feverMix, starMix, time;
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        // Dragon Surge palette shift: horizon -> magenta, mid -> violet
        vec3 hor = mix(horizonColor, vec3(1.0, 0.35, 0.85), feverMix * 0.8);
        vec3 mid = mix(midColor, vec3(0.55, 0.25, 0.9), feverMix * 0.7);
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.25, h));
        col = mix(col, topColor, smoothstep(0.2, 0.7, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        // Tighter, dimmer sun: a smaller disc + a much softer halo so it stops
        // blowing out the centre of the screen and washing out contrast.
        col += sunGlow * (pow(s, 900.0) * 0.7 + pow(s, 10.0) * 0.16);
        // Aurora bands during surge: two drifting sine curtains in the upper
        // sky, fading cyan <-> magenta. Branchless — everything * feverMix.
        float band1 = sin(d.x * 9.0 + time * 0.7 + d.y * 14.0);
        float band2 = sin(d.x * 5.0 - time * 0.45 + d.y * 9.0 + 2.1);
        float curtain = smoothstep(0.15, 0.65, h) * (0.5 + 0.5 * sin(time * 0.3));
        vec3 aurora = vec3(0.25, 0.95, 0.85) * max(band1, 0.0)
                    + vec3(0.95, 0.3, 0.95) * max(band2, 0.0);
        col += aurora * curtain * feverMix * 0.35;
        // Starfield (night biomes): hashed cells in the upper dome, gently
        // twinkling. Branchless — multiplied to zero outside night biomes.
        vec3 cell = floor(d * 110.0);
        float sh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = smoothstep(0.9965, 1.0, sh)
                   * (0.6 + 0.4 * sin(time * 2.0 + sh * 90.0))
                   * smoothstep(0.04, 0.3, h);
        col += vec3(0.85, 0.9, 1.0) * star * starMix;
        // Night biomes also get a faint, slow aurora veil of their own.
        col += aurora * smoothstep(0.2, 0.6, h) * starMix * 0.12;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  sky = new THREE.Mesh(new THREE.SphereGeometry(800, 24, 16), skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  // --- Lighting: warm sun ahead, biome-tinted bounce.
  sun = new THREE.DirectionalLight(0xffe0b0, 1.8);
  sun.position.set(-60, 45, -150);
  scene.add(sun, sun.target);
  hemi = new THREE.HemisphereLight(0xbfdcff, 0x2e5448, 0.8);
  scene.add(hemi);

  // --- Prop bands: one recycled InstancedMesh per archetype.
  bands = [];
  for (const key of Object.keys(ARCHETYPES)) {
    bands.push(makeBand(scene, ARCHETYPES[key]));
  }

  // --- Ambient particles + birds.
  createAmbient(scene);
}

function makeBand(scene, def) {
  const perSide = Math.ceil(WALL_WINDOW / def.step);
  const { geometry, materials } = def.build();
  const mesh = new THREE.InstancedMesh(geometry, materials, perSide * 2);
  mesh.frustumCulled = false;
  const band = { mesh, data: [], step: def.step, def };
  let idx = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < perSide; i++) {
      const d = { side, slot: i, dist: i * def.step + rnd() * def.step - 100, ...def.place(side, rnd) };
      band.data.push(d);
      writeMatrix(band, idx++, d);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  return band;
}

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const posV = new THREE.Vector3();
const sclV = new THREE.Vector3();
function writeMatrix(band, i, d) {
  // Park instances whose archetype doesn't belong to the biome at their
  // distance — they re-enter when recycled into a matching stretch.
  const active = band.def.biomes.includes(biomeIndexAt(Math.max(d.dist, 0)));
  eul.set(0, d.rotY ?? (d.rotY = rnd() * Math.PI), d.tilt);
  quat.setFromEuler(eul);
  if (active) {
    m4.compose(posV.set(d.x, -0.5, -d.dist), quat, sclV.set(d.r, d.h, d.r));
  } else {
    m4.compose(posV.set(d.x, -50, -d.dist), quat, sclV.set(0.0001, 0.0001, 0.0001));
  }
  band.mesh.setMatrixAt(i, m4);
}

function recycleBand(band, playerDist) {
  let changed = false;
  for (let i = 0; i < band.data.length; i++) {
    const d = band.data[i];
    if (d.dist < playerDist - 100) {
      const fresh = band.def.place(d.side, rnd);
      Object.assign(d, fresh, { dist: d.dist + WALL_WINDOW, rotY: rnd() * Math.PI });
      writeMatrix(band, i, d);
      changed = true;
    }
  }
  if (changed) band.mesh.instanceMatrix.needsUpdate = true;
}

// Re-seat a band's instances around the start line. Without this, restarting
// leaves every prop parked thousands of metres ahead.
function reseedBand(band) {
  for (let i = 0; i < band.data.length; i++) {
    const d = band.data[i];
    Object.assign(d, band.def.place(d.side, rnd), {
      dist: d.slot * band.step + rnd() * band.step - 100,
      rotY: rnd() * Math.PI,
    });
    writeMatrix(band, i, d);
  }
  band.mesh.instanceMatrix.needsUpdate = true;
}

export function resetEnvironment(seed) {
  if (seed !== undefined) rnd = mulberry32(seed + 99);
  for (const band of bands) reseedBand(band);
  feverMix = 0;
}

export function updateEnvironment(dt, camera, time, playerDist, feverActive = false, playerSpeed = 0) {
  sky.position.copy(camera.position);
  for (const band of bands) recycleBand(band, playerDist);

  // --- Biome atmosphere lerp: sky, fog, lights, water all follow the seam.
  const env = computeEnv(playerDist);
  const su = sky.material.uniforms;
  su.topColor.value.copy(env.skyTop);
  su.midColor.value.copy(env.skyMid);
  su.horizonColor.value.copy(env.skyHorizon);
  su.sunGlow.value.copy(env.sunGlow);
  sceneRef.fog.color.copy(env.fogColor);
  sceneRef.fog.near = env.fogNear;
  sceneRef.fog.far = env.fogFar;
  sun.color.copy(env.lightSun);
  sun.intensity = env.lightSunI;
  hemi.color.copy(env.hemiSky);
  hemi.groundColor.copy(env.hemiGround);
  setWaterTint({
    deep: env.waterDeep,
    shallow: env.waterShallow,
    sun: env.sunGlow,
    horizon: env.skyHorizon,
    zenith: env.skyTop,
    waveAmp: env.waveAmp,
  });

  // Dragon Surge sky tint (damped so it sweeps in/out smoothly)
  feverMix = damp(feverMix, feverActive ? 1 : 0, 2.5, dt);
  su.feverMix.value = feverMix;
  su.starMix.value = env.starMix;
  su.time.value = time;

  updateAmbient(dt, camera, time, playerDist, playerSpeed, feverMix, env);
}
