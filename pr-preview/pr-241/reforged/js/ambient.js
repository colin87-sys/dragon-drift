import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// Atmosphere particles wrapped around the camera — snow in Frozen Reach,
// leaves in the Sanctuary, dust in the Wastes, RISING embers in the Caldera,
// spores in the Mire, star motes in the Shallows. One pool, the behaviour
// params lerp with the biome env. Plus a tiny instanced flock circling high
// ahead (re-skinned per biome: gulls, ash-wyverns, glow moths, star petrels)
// and a colossal sky whale that drifts the horizon of the Astral Shallows.

const COUNT = 1200;
const BOX = { x: 80, y: 50, z: 160 };
const feverColor = new THREE.Color(0xff9aee);
const tmpColor = new THREE.Color();

let points = null;
let positions = null;
let birds = null;
const BIRD_COUNT = 7;
const birdData = [];
let whale = null;
let whaleTail = null;
let whaleFins = [];
let flyby = null; // foreground single-bird flyby (dusk sanctuary)

// Tier gate: birds (per-frame matrix writes) drop out at the lowest tier.
export function setAmbientQuality(q) {
  if (birds) birds.visible = q > 0.4;
  if (flyby) flyby.visible = q > 0.4;
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
  birds.layers.set(1);
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

  // Foreground flyby: single gull crossing high over the lane (biome 0 only).
  flyby = new THREE.InstancedMesh(
    wing,
    new THREE.MeshBasicMaterial({ color: 0xd0c8e8, fog: true, transparent: true, opacity: 0 }),
    1
  );
  flyby.frustumCulled = false;
  flyby.layers.set(1);
  flyby.visible = false;
  scene.add(flyby);

  // Sky whale: a single colossal silhouette far beyond the course, only
  // visible in the Astral Shallows (opacity follows env.whaleMix). Cheap:
  // one fogged basic material, four meshes, slow drift.
  const whaleMat = new THREE.MeshBasicMaterial({
    color: 0x46467e, fog: true, transparent: true, opacity: 0,
  });
  whale = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(3.2, 14, 6, 10), whaleMat);
  body.rotation.y = Math.PI / 2;
  whale.add(body);
  const brow = new THREE.Mesh(new THREE.SphereGeometry(3.0, 8, 6), whaleMat);
  brow.scale.set(1.4, 0.8, 1);
  brow.position.set(7.5, 0.8, 0);
  whale.add(brow);
  whaleTail = new THREE.Mesh(new THREE.ConeGeometry(2.8, 5, 4), whaleMat);
  whaleTail.scale.set(1, 1, 0.25);
  whaleTail.rotation.z = Math.PI / 2;
  whaleTail.position.set(-10.5, 0.5, 0);
  whale.add(whaleTail);
  whaleFins = [];
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.5, 3), whaleMat);
    fin.scale.set(1, 1, 0.2);
    fin.rotation.z = s * 1.9;
    fin.position.set(2, -1.4, s * 3.2);
    whale.add(fin);
    whaleFins.push(fin);
  }
  whale.visible = false;
  scene.add(whale);
}

export function updateAmbient(dt, camera, time, playerDist, playerSpeed, feverMix, env, bossMix = 0) {
  // Lerped biome look + fever tint override.
  tmpColor.copy(env.ambColor).lerp(feverColor, feverMix);
  points.material.color.copy(tmpColor);
  // Boss-time mote budget: compose (not stomp) on top of the biome/fever look —
  // motes step back so bullets own the near-centre extremes. Zero term at
  // bossMix=0, so a normal run is byte-identical to pre-Increment-3.
  points.material.opacity = (env.ambOpacity + feverMix * 0.2) * (1 - 0.55 * bossMix);
  points.material.size = env.ambSize * (1 - 0.25 * bossMix);

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
    // Keep the band strictly ahead of the lens: a glow particle wrapping to
    // the camera plane renders as a giant screen-filling blob.
    while (z < cz - BOX.z - 6) z += BOX.z;
    while (z > cz - 6) z -= BOX.z;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  points.geometry.attributes.position.needsUpdate = true;

  // Sky whale: drifts the far horizon, fading with the biome seam.
  if (whale) {
    const mix = env.whaleMix;
    whale.visible = mix > 0.02;
    if (whale.visible) {
      whaleTail.material.opacity = mix * 0.92;
      const wt = time * 0.06;
      whale.position.set(
        Math.sin(wt) * 110,
        46 + Math.sin(time * 0.18) * 4,
        -playerDist - 330 - Math.cos(wt * 0.7) * 60
      );
      whale.rotation.y = wt + Math.PI / 2;
      whale.rotation.z = Math.sin(time * 0.22) * 0.08;
      whaleTail.rotation.y = Math.sin(time * 0.9) * 0.45;
      whaleFins[0].rotation.x = Math.sin(time * 0.7) * 0.3;
      whaleFins[1].rotation.x = -Math.sin(time * 0.7) * 0.3;
    }
  }

  // Flock: lazy circles above the course — color, size and wingbeat re-skin
  // per biome. Brought 30m closer than before so they enter the view cone.
  if (!birds.visible) return;
  birds.material.color.copy(env.faunaColor);
  for (let i = 0; i < BIRD_COUNT; i++) {
    const b = birdData[i];
    const a = time * b.speed + b.phase;
    pos.set(
      Math.cos(a) * b.radius,
      b.height + Math.sin(a * 1.7) * 2.5,
      -playerDist - 130 - Math.sin(a) * b.radius * 0.5
    );
    const flapT = time * b.flap * env.faunaFlap + i;
    eul.set(0, a + Math.PI / 2, Math.sin(flapT) * 0.35);
    quat.setFromEuler(eul);
    const flap = 0.75 + Math.abs(Math.sin(flapT)) * 0.5;
    scl.set(env.faunaScale, flap * env.faunaScale, env.faunaScale);
    m4.compose(pos, quat, scl);
    birds.setMatrixAt(i, m4);
  }
  birds.instanceMatrix.needsUpdate = true;

  // Foreground flyby: a lone gull crossing high over the lane (biome 0 dusk
  // sanctuary and transitions towards it, faunaFlyby lerped via whaleMix-like
  // key on env). Reuses the same bird material. Period ~40 s.
  if (flyby && env.flybyMix > 0.02) {
    const ft = (time * 0.025) % 1;
    const side = Math.floor(time * 0.025) % 2 === 0 ? 1 : -1;
    flyby.visible = true;
    flyby.material.opacity = Math.min(env.flybyMix,
      Math.sin(ft * Math.PI) * env.flybyMix * 1.4);
    flyby.material.color.copy(env.faunaColor);
    pos.set(
      side * (ft - 0.5) * 90,
      26 + Math.sin(ft * Math.PI) * 6,
      -playerDist - 55 - ft * 8
    );
    eul.set(0, side > 0 ? Math.PI * 0.55 : Math.PI * 1.45, Math.sin(time * 4) * 0.2);
    quat.setFromEuler(eul);
    scl.set(env.faunaScale * 1.3, env.faunaScale * 1.3, env.faunaScale * 1.3);
    m4.compose(pos, quat, scl);
    flyby.setMatrixAt(0, m4);
    flyby.instanceMatrix.needsUpdate = true;
  } else if (flyby) {
    flyby.visible = false;
  }
}
