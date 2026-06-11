import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// Atmosphere particles wrapped around the camera — snow in Frozen Reach,
// drifting leaves in the Sanctuary, dust motes in the Wastes. One pool, the
// behaviour params lerp with the biome env. Plus a tiny instanced bird flock
// circling high ahead for scale and life.

const COUNT = 1200;
const BOX = { x: 80, y: 50, z: 160 };
const feverColor = new THREE.Color(0xff9aee);
const tmpColor = new THREE.Color();

let points = null;
let positions = null;
let birds = null;
const BIRD_COUNT = 7;
const birdData = [];

// Tier gate: birds (per-frame matrix writes) drop out at the lowest tier.
export function setAmbientQuality(q) {
  if (birds) birds.visible = q > 0.4;
}

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();

export function createAmbient(scene) {
  positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX.x;
    positions[i * 3 + 1] = Math.random() * BOX.y;
    positions[i * 3 + 2] = -Math.random() * BOX.z + 30;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.4,
      map: makeGlowTexture('255,255,255'),
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      color: 0xffffff,
    })
  );
  points.frustumCulled = false;
  scene.add(points);

  // Birds: two flattened cones per bird, merged by instance scale animation.
  const wing = new THREE.ConeGeometry(0.5, 2.4, 3);
  wing.rotateZ(Math.PI / 2);
  wing.scale(1, 0.16, 0.55);
  birds = new THREE.InstancedMesh(
    wing,
    new THREE.MeshBasicMaterial({ color: 0x2a2438, fog: true }),
    BIRD_COUNT
  );
  birds.frustumCulled = false;
  for (let i = 0; i < BIRD_COUNT; i++) {
    birdData.push({
      radius: 18 + Math.random() * 26,
      height: 26 + Math.random() * 16,
      speed: 0.25 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      flap: 2.5 + Math.random() * 2,
    });
  }
  scene.add(birds);
}

export function updateAmbient(dt, camera, time, playerDist, playerSpeed, feverMix, env) {
  // Lerped biome look + fever tint override.
  tmpColor.copy(env.ambColor).lerp(feverColor, feverMix);
  points.material.color.copy(tmpColor);
  points.material.opacity = env.ambOpacity + feverMix * 0.2;
  points.material.size = env.ambSize;

  const speedDrift = Math.max(0, playerSpeed - 35) * 0.5 * dt;
  const cx = camera.position.x;
  const cy = camera.position.y;
  const cz = camera.position.z;
  for (let i = 0; i < COUNT; i++) {
    let x = positions[i * 3];
    let y = positions[i * 3 + 1] - (env.ambFall + (i % 5) * env.ambFall * 0.25) * dt;
    let z = positions[i * 3 + 2] + speedDrift;
    x += Math.sin(time * 1.5 + i) * env.ambSway * dt;
    // Leaves/motes also bob upward occasionally (flutter)
    y += Math.sin(time * 2.2 + i * 1.7) * env.ambSway * 0.3 * dt;

    if (y < cy - 25) y += BOX.y;
    if (y > cy + 25) y -= BOX.y;
    while (x < cx - BOX.x / 2) x += BOX.x;
    while (x > cx + BOX.x / 2) x -= BOX.x;
    while (z < cz - BOX.z + 30) z += BOX.z;
    while (z > cz + 30) z -= BOX.z;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  points.geometry.attributes.position.needsUpdate = true;

  // Bird flock: lazy circles high above the course, far ahead.
  if (!birds.visible) return;
  for (let i = 0; i < BIRD_COUNT; i++) {
    const b = birdData[i];
    const a = time * b.speed + b.phase;
    pos.set(
      Math.cos(a) * b.radius,
      b.height + Math.sin(a * 1.7) * 2.5,
      -playerDist - 160 - Math.sin(a) * b.radius * 0.5
    );
    eul.set(0, a + Math.PI / 2, Math.sin(time * b.flap + i) * 0.35);
    quat.setFromEuler(eul);
    const flap = 0.75 + Math.abs(Math.sin(time * b.flap + i)) * 0.5;
    scl.set(1, flap, 1);
    m4.compose(pos, quat, scl);
    birds.setMatrixAt(i, m4);
  }
  birds.instanceMatrix.needsUpdate = true;
}
