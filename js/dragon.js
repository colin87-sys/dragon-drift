import * as THREE from 'three';
import { damp, makeGlowTexture } from './util.js';

let group = null;
let wingPivotL = null;
let wingPivotR = null;
let wingTipL = null;  // secondary fold joint for 2-segment wing
let wingTipR = null;
let head = null;
let tailSegs = [];
const TAIL_COUNT = 9; // more segments = snakier coil

// Materials animated at runtime (boost glow / fever tint)
let bodyMat = null;
let wingMat = null;
let eyeMat = null;
// Wing-tip contrail markers + fever aura
let tipMarkerL = null;
let tipMarkerR = null;
let auraSprite = null;
let quality = 1;

export function setDragonQuality(q) {
  quality = q;
}

// Rider ponytail
let riderHead = null;
let riderGroup = null;
let scarfMesh = null;
const PONY_SEGS = 10;
const PONY_LEN = 0.24;
let ponyPoints = [];
let ponyMeshes = [];

// Speed trail: two separate pools — cyan (orb/boost) and blue (boost only)
const TRAIL_POOL = 140;
let trailSprites = [];
let boostTrailSprites = [];
let trailTimer = 0;
let boostTrailTimer = 0;
let contrailTimer = 0;

// Ice-burst death particles
const BURST_COUNT = 60;
let burstParticles = [];
let burstActive = false;
let burstTimer = 0;

const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
let bankZ = 0; // banking component of rotation.z (roll spin stacks on top)

// --- Body/wing geometry helpers ---
function buildWingShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.8, 0.5, 2.2, 1.0, 3.0, 0.7);   // leading edge sweep
  shape.lineTo(4.8, 0.2);
  shape.lineTo(5.2, -0.5);
  shape.bezierCurveTo(4.0, -1.0, 2.4, -1.4, 1.2, -1.2); // trailing membrane
  shape.lineTo(0, -0.4);
  return shape;
}

// Paint a root→tip membrane gradient into a wing geometry's vertex colors.
// tStart/tEnd let the tip fins continue where the root membrane left off.
const innerC = new THREE.Color();
const outerC = new THREE.Color();
function applyWingGradient(geo, palette, tStart = 0, tEnd = 1) {
  innerC.setHex(palette.wingInner);
  outerC.setHex(palette.wingOuter);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const spanX = Math.max(bb.max.x - bb.min.x, 1e-5);
  for (let i = 0; i < pos.count; i++) {
    const kx = Math.abs(pos.getX(i) - (Math.abs(bb.min.x) > Math.abs(bb.max.x) ? bb.max.x : bb.min.x)) / spanX;
    const t = tStart + (tEnd - tStart) * kx;
    c.lerpColors(innerC, outerC, Math.min(t, 1));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// Live material registry so the shop can re-tint an equipped skin in place.
let matRefs = null;
let wingGeos = null; // [{geo, tStart, tEnd}]
let activePalette = null;

export function setDragonPalette(palette) {
  activePalette = palette;
  matRefs.body.color.setHex(palette.body);
  matRefs.belly.color.setHex(palette.belly);
  matRefs.scales.color.setHex(palette.scales);
  matRefs.horn.color.setHex(palette.horn);
  matRefs.cloak.color.setHex(palette.cloak);
  wingMat.emissive.setHex(palette.wingEmissive);
  eyeMat.emissive.setHex(palette.eye);
  for (const w of wingGeos) applyWingGradient(w.geo, palette, w.tStart, w.tEnd);
}

export function createDragon(scene, palette) {
  group = new THREE.Group();
  activePalette = palette;

  bodyMat = new THREE.MeshStandardMaterial({
    color: palette.body, roughness: 0.38, metalness: 0.12,
    emissive: palette.body, emissiveIntensity: 0.12,
  });
  const hornMat  = new THREE.MeshStandardMaterial({ color: palette.horn, emissive: 0x6b3400, emissiveIntensity: 0.22, roughness: 0.24 });
  // Membrane wings: vertex-color orange→red gradient, warm backlit emissive.
  wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: 0.94,
    emissive: palette.wingEmissive, emissiveIntensity: 0.28,
  });
  const riderMat = new THREE.MeshStandardMaterial({ color: 0x231624, roughness: 0.78 });
  const cloakMat = new THREE.MeshStandardMaterial({ color: palette.cloak, emissive: 0x441000, emissiveIntensity: 0.25, roughness: 0.7 });
  const scalesMat = new THREE.MeshStandardMaterial({ color: palette.scales, emissive: 0x0b79aa, emissiveIntensity: 0.42, roughness: 0.28, metalness: 0.22 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: palette.belly, roughness: 0.5 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a1b16, roughness: 0.75 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xffb13d, emissive: 0x773100, emissiveIntensity: 0.35, roughness: 0.45 });
  matRefs = { body: bodyMat, belly: bellyMat, scales: scalesMat, horn: hornMat, cloak: cloakMat };

  // Main body
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.9, 8, 14), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.72, 0.62, 1);
  group.add(body);

  // Overlapping armored body plates replace the old barrel read with a
  // sleeker serpentine silhouette.
  const bodyProfile = [
    [-1.75, 0.82, 0.68, 1.0],
    [-1.22, 1.02, 0.8, 1.08],
    [-0.68, 0.86, 0.66, 1.0],
    [-0.12, 0.66, 0.52, 0.9],
    [0.44, 0.48, 0.42, 0.78],
    [0.95, 0.35, 0.34, 0.66],
  ];
  for (let i = 0; i < bodyProfile.length; i++) {
    const [zPos, sx, sy, sz] = bodyProfile[i];
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.82, 12, 9), i < 2 ? bodyMat : bellyMat);
    seg.scale.set(sx, sy, sz);
    seg.position.set(Math.sin(i * 0.72) * 0.08, 0.03 + Math.cos(i * 0.6) * 0.05, zPos);
    group.add(seg);
  }

  const chest = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), bodyMat);
  chest.scale.set(1.16, 0.82, 0.98);
  chest.position.set(0, 0.16, -1.55);
  group.add(chest);
  const waist = new THREE.Mesh(new THREE.SphereGeometry(0.58, 10, 8), bellyMat);
  waist.scale.set(0.78, 0.64, 1.25);
  waist.position.set(0, -0.05, 0.75);
  group.add(waist);

  // Scale ridge along back
  for (let i = 0; i < 12; i++) {
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.11 + Math.max(0, 5 - Math.abs(i - 4)) * 0.018, 0.44, 5), scalesMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, 0.88 - Math.max(0, i - 5) * 0.03, -2.55 + i * 0.43);
    group.add(ridge);
  }
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.48 - i * 0.045, 5), scalesMat);
      fin.position.set(sx * (0.42 - i * 0.03), 0.34 - i * 0.035, -1.55 + i * 0.44);
      fin.rotation.z = sx * -1.05;
      fin.rotation.x = -0.35;
      group.add(fin);
    }
  }

  // Head
  head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.76, 14, 12), bodyMat);
  skull.scale.set(1.32, 0.84, 0.95);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.55, 8), bodyMat);
  snout.rotation.x = -Math.PI / 2;
  snout.scale.set(0.86, 1, 1.18);
  snout.position.set(0, -0.08, -1.08);
  head.add(skull, snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.62), bellyMat);
  jaw.position.set(0, -0.34, -0.74);
  head.add(jaw);
  // Nostril gems
  for (const s of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), hornMat);
    nostril.position.set(0.14 * s, -0.1, -1.3);
    head.add(nostril);
  }
  // Horns
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.15, 6), hornMat);
    horn.position.set(0.42 * s, 0.54, 0.28);
    horn.rotation.x = 0.65;
    horn.rotation.z = s * -0.2;
    head.add(horn);
    const cheekFin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 5), scalesMat);
    cheekFin.position.set(0.58 * s, 0.02, -0.12);
    cheekFin.rotation.z = s * -1.2;
    cheekFin.rotation.x = 0.25;
    head.add(cheekFin);
  }
  // Brow ridges
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), scalesMat);
    brow.position.set(0.28 * s, 0.44, -0.1);
    brow.rotation.x = 0.9;
    head.add(brow);
  }
  // Glowing eyes (cyan; shift magenta during Dragon Surge)
  eyeMat = new THREE.MeshStandardMaterial({
    color: 0x223344, emissive: 0x55e0ff, emissiveIntensity: 2.2,
  });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), eyeMat);
    eye.position.set(0.3 * s, 0.22, -0.42);
    head.add(eye);
  }
  head.position.set(0, 0.5, -3.08);
  group.add(head);

  // Segmented neck gives the silhouette a longer S-curve from body to head.
  for (let i = 0; i < 4; i++) {
    const neck = new THREE.Mesh(new THREE.SphereGeometry(0.52 - i * 0.055, 9, 7), bodyMat);
    neck.scale.set(0.82, 0.62, 1.35);
    neck.position.set(Math.sin(i * 0.8) * 0.1, 0.28 + i * 0.09, -1.95 - i * 0.36);
    group.add(neck);
  }

  // Tail: tapering segments with varying cone orientation for snake-like coil
  let radius = 0.58;
  let z = 2.4;
  for (let i = 0; i < TAIL_COUNT; i++) {
    const seg = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.2, 7), bodyMat);
    seg.rotation.x = Math.PI / 2;
    seg.position.set(0, 0, z);
    group.add(seg);
    tailSegs.push(seg);
    z += 0.9;
    radius *= 0.76;
  }
  // Spiky tail tip
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, 5), scalesMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.set(0, 0, z);
  group.add(tip);
  tailSegs.push(tip);

  // Wings: 2-segment (root + tip fold) for more organic flap
  const wingGeo = new THREE.ShapeGeometry(buildWingShape());
  wingGeo.rotateX(-Math.PI / 2);
  wingGeo.scale(1.34, 1.28, 1);
  applyWingGradient(wingGeo, palette, 0, 0.78);
  const tipGeoR = new THREE.ShapeGeometry(buildWingShape());
  const tipGeoL = new THREE.ShapeGeometry(buildWingShape());
  applyWingGradient(tipGeoR, palette, 0.72, 1);
  applyWingGradient(tipGeoL, palette, 0.72, 1);
  wingGeos = [
    { geo: wingGeo, tStart: 0, tEnd: 0.78 },
    { geo: tipGeoR, tStart: 0.72, tEnd: 1 },
    { geo: tipGeoL, tStart: 0.72, tEnd: 1 },
  ];
  const wingBoneGeo = new THREE.BoxGeometry(3.7, 0.055, 0.055);

  // Right wing root
  wingPivotR = new THREE.Group();
  wingPivotR.position.set(0.55, 0.4, -0.2);
  const wRRoot = new THREE.Mesh(wingGeo, wingMat);
  for (const [z, rot] of [[-0.12, -0.18], [0.18, 0.02], [0.48, 0.2]]) {
    const bone = new THREE.Mesh(wingBoneGeo, hornMat);
    bone.position.set(2.0, 0.03, z);
    bone.rotation.y = rot;
    wingPivotR.add(bone);
  }
  // Right tip pivot at the outer edge
  wingTipR = new THREE.Group();
  wingTipR.position.set(3.5, 0, 0);
  const wRTip = new THREE.Mesh(tipGeoR, wingMat);
  wRTip.scale.set(0.42, 0.42, 1);
  wingTipR.add(wRTip);
  tipMarkerR = new THREE.Object3D();
  tipMarkerR.position.set(2.0, 0, -0.2); // true wing tip for contrails
  wingTipR.add(tipMarkerR);
  wingPivotR.add(wRRoot, wingTipR);
  group.add(wingPivotR);

  // Left wing (mirrored)
  wingPivotL = new THREE.Group();
  wingPivotL.position.set(-0.55, 0.4, -0.2);
  const wLRoot = new THREE.Mesh(wingGeo, wingMat);
  wLRoot.scale.x = -1;
  for (const [z, rot] of [[-0.12, 0.18], [0.18, -0.02], [0.48, -0.2]]) {
    const bone = new THREE.Mesh(wingBoneGeo, hornMat);
    bone.position.set(-2.0, 0.03, z);
    bone.rotation.y = rot;
    wingPivotL.add(bone);
  }
  wingTipL = new THREE.Group();
  wingTipL.position.set(-3.5, 0, 0);
  const wLTip = new THREE.Mesh(tipGeoL, wingMat);
  wLTip.scale.set(-0.42, 0.42, 1);
  wingTipL.add(wLTip);
  tipMarkerL = new THREE.Object3D();
  tipMarkerL.position.set(-2.0, 0, -0.2);
  wingTipL.add(tipMarkerL);
  wingPivotL.add(wLRoot, wingTipL);
  group.add(wingPivotL);

  // Rider
  const rider = new THREE.Group();
  riderGroup = rider;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.52, 4, 8), riderMat);
  torso.rotation.x = -0.4;
  rider.add(torso);
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.82, 5), cloakMat);
  cloak.position.set(0, 0.18, 0.28);
  cloak.rotation.x = -0.78;
  rider.add(cloak);
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.5), strapMat);
  saddle.position.set(0, -0.16, -0.02);
  rider.add(saddle);
  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.08), amberMat);
    strap.position.set(sx * 0.26, 0.05, 0.03);
    rider.add(strap);
  }
  riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), riderMat);
  riderHead.position.set(0, 0.52, -0.2);
  rider.add(riderHead);
  // Scarf tail (static decorative)
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.82, 4), cloakMat);
  scarfMesh = scarf;
  scarf.position.set(0.05, 0.2, 0.3);
  scarf.rotation.x = -0.6;
  rider.add(scarf);
  rider.position.set(0, 1.12, -0.6);
  group.add(rider);

  // Fever aura: pulsing magenta glow enveloping the dragon during surge
  auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,130,235'), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1); // sprite layer: excluded from water reflection
  group.add(auraSprite);

  scene.add(group);

  // Ponytail chain (world-space follow)
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1020, roughness: 0.9 });
  ponyPoints = [];
  ponyMeshes = [];
  for (let i = 0; i < PONY_SEGS; i++) {
    ponyPoints.push(new THREE.Vector3(0, 9, i * PONY_LEN));
    const r = 0.12 * (1 - i / (PONY_SEGS + 2));
    const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r, 0.04), 8, 6), hairMat);
    scene.add(m);
    ponyMeshes.push(m);
  }

  // Speed-trail pools
  const cyanTex = makeGlowTexture('120,220,255');
  const blueTex = makeGlowTexture('80,130,255');

  for (let i = 0; i < TRAIL_POOL; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cyanTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.visible = false; s.userData.life = 0;
    s.layers.set(1);
    scene.add(s);
    trailSprites.push(s);
  }
  for (let i = 0; i < TRAIL_POOL; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: blueTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.visible = false; s.userData.life = 0;
    s.layers.set(1);
    scene.add(s);
    boostTrailSprites.push(s);
  }

  // Death-burst crystal shards
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff, emissive: 0x44aaff, emissiveIntensity: 2.5,
    transparent: true, opacity: 1,
  });
  burstParticles = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.22 + Math.random() * 0.28, 0), shardMat.clone());
    shard.visible = false;
    shard.userData.vel = new THREE.Vector3();
    scene.add(shard);
    burstParticles.push(shard);
  }

  return group;
}

// Lethal crashes (wall/gate) explode hot coral-red; health deaths stay icy.
export function triggerDeathBurst(position, lethal = false) {
  burstActive = true;
  burstTimer = 1.0;
  const spread = lethal ? 30 : 22;
  for (const p of burstParticles) {
    p.visible = true;
    p.position.copy(position);
    if (lethal) {
      p.material.color.setHex(0xffb09a);
      p.material.emissive.setHex(0xff3322);
    } else {
      p.material.color.setHex(0xaaddff);
      p.material.emissive.setHex(0x44aaff);
    }
    p.userData.vel.set(
      (Math.random() - 0.5) * spread,
      (Math.random()) * 18 + 4,
      (Math.random() - 0.5) * 18
    );
    p.userData.spin = (Math.random() - 0.5) * 8;
    p.scale.setScalar(1);
    p.material.opacity = 1;
  }
}

export function updateDragon(dt, player, time) {
  // Follow flight position with hover bob
  group.position.set(
    player.position.x,
    player.position.y + Math.sin(time * 2.1) * 0.16,
    player.position.z
  );

  // Banking and pitch — banking deepens with speed for drama.
  // Bank is tracked separately so the barrel-roll spin can stack on top
  // without fighting the damper.
  const speedNorm = Math.min(Math.max((player.speed - 35) / 45, 0), 1);
  const bankFactor = 0.035 + speedNorm * 0.015;
  bankZ = damp(bankZ, -player.velocity.x * bankFactor, 9, dt);
  let rollSpin = 0;
  let rollFold = 0;
  if (player.roll) {
    const k = Math.min(player.roll.t / player.roll.dur, 1);
    const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    rollSpin = -player.roll.dir * Math.PI * 2 * ease; // matches bank direction
    rollFold = Math.sin(Math.PI * k) * 0.55;
  }
  group.rotation.z = bankZ + rollSpin;
  group.rotation.x = damp(group.rotation.x, player.velocity.y * 0.022, 9, dt);
  // Slight yaw toward lateral movement
  group.rotation.y = damp(group.rotation.y, player.velocity.x * 0.008, 6, dt);
  head.rotation.y = damp(head.rotation.y, -player.velocity.x * 0.014, 8, dt);
  head.rotation.x = damp(head.rotation.x, -player.velocity.y * 0.008, 8, dt);
  riderGroup.rotation.z = damp(riderGroup.rotation.z, -player.velocity.x * 0.035, 8, dt);
  riderGroup.rotation.x = damp(riderGroup.rotation.x, -0.08 - speedNorm * 0.16 + player.velocity.y * 0.008, 8, dt);
  scarfMesh.rotation.x = damp(scarfMesh.rotation.x, -0.65 - speedNorm * 0.75, 10, dt);
  scarfMesh.rotation.z = Math.sin(time * (6 + speedNorm * 8)) * (0.12 + speedNorm * 0.18);

  // Wing flap: 2-segment articulation with speed/turn-driven asymmetry.
  const feverBoost = player.feverActive ? 1.3 : 1;
  const flapSpeed = (player.speedActive ? 11 : 6) * feverBoost;
  const flapAmp   = player.speedActive ? 0.7 : 0.52;
  const turnBias = Math.max(-0.28, Math.min(0.28, player.velocity.x * 0.018));
  const climbBias = Math.max(-0.18, Math.min(0.18, player.velocity.y * 0.015));
  const phase = time * flapSpeed;
  const rootFlap = Math.sin(phase) * flapAmp + 0.1;
  const feather = Math.sin(phase + Math.PI * 0.55);
  const tipLag = Math.sin(phase + 0.95);
  wingPivotR.rotation.z = damp(wingPivotR.rotation.z, -rootFlap + turnBias + rollFold, 14, dt);
  wingPivotL.rotation.z = damp(wingPivotL.rotation.z,  rootFlap + turnBias - rollFold, 14, dt);
  wingPivotR.rotation.x = damp(wingPivotR.rotation.x, 0.14 + feather * 0.18 + climbBias, 10, dt);
  wingPivotL.rotation.x = damp(wingPivotL.rotation.x, 0.14 - feather * 0.18 + climbBias, 10, dt);
  wingPivotR.rotation.y = damp(wingPivotR.rotation.y, -0.18 + turnBias * 0.8, 9, dt);
  wingPivotL.rotation.y = damp(wingPivotL.rotation.y,  0.18 + turnBias * 0.8, 9, dt);
  // Tip fold: folds on up-stroke, extends on down-stroke, with a small delay
  // between wings so the silhouette feels less mechanical.
  wingTipR.rotation.z = damp(wingTipR.rotation.z, tipLag * 0.42 + turnBias * 0.45, 12, dt);
  wingTipL.rotation.z = damp(wingTipL.rotation.z, -Math.sin(phase + 1.18) * 0.42 + turnBias * 0.45, 12, dt);
  wingTipR.rotation.x = damp(wingTipR.rotation.x, -0.12 + feather * 0.16, 10, dt);
  wingTipL.rotation.x = damp(wingTipL.rotation.x, -0.12 - feather * 0.16, 10, dt);

  // Snake-like tail wave: each segment lags behind the previous and trails
  // opposite the dragon's steering, so sharp turns bend the whole silhouette.
  for (let i = 0; i < tailSegs.length; i++) {
    const phase = time * 3.8 - i * 0.55;
    const amp = 0.09 * (i + 1) * (i < TAIL_COUNT ? 1 : 0.6);
    const trailK = (i + 1) / tailSegs.length;
    const motionTrailX = -player.velocity.x * 0.055 * trailK * trailK;
    const motionTrailY = -player.velocity.y * 0.04 * trailK * trailK;
    const speedWhip = speedNorm * Math.sin(time * 7.5 - i * 0.7) * 0.12 * trailK;
    const waveX = Math.sin(phase) * amp + motionTrailX + speedWhip;
    const waveY = Math.cos(phase * 0.7) * amp * 0.4 + motionTrailY;
    tailSegs[i].position.x = damp(tailSegs[i].position.x, waveX, 9 + i * 0.45, dt);
    tailSegs[i].position.y = damp(tailSegs[i].position.y, waveY, 9 + i * 0.45, dt);
    // Rotation follows the wave direction for organic feel
    tailSegs[i].rotation.z = damp(tailSegs[i].rotation.z, -waveX * 0.6, 14, dt);
    tailSegs[i].rotation.y = damp(tailSegs[i].rotation.y, waveX * 0.4, 14, dt);
  }

  // Boost wing glow + fever tint + eyes + aura (cheap material writes).
  // The membrane reads "backlit" — emissive swells on the downstroke as the
  // sun shines through, and surges while boosting.
  const backlit = 0.22 + Math.max(0, Math.sin(phase)) * 0.18;
  const wingGlowTarget = backlit + (player.boosting ? 0.7 : 0);
  wingMat.emissiveIntensity = damp(wingMat.emissiveIntensity, wingGlowTarget, 6, dt);
  wingMat.emissive.setHex(player.feverActive ? 0xff44cc : activePalette.wingEmissive);
  bodyMat.emissiveIntensity = damp(bodyMat.emissiveIntensity, player.feverActive ? 0.35 : 0.12, 4, dt);
  eyeMat.emissive.setHex(player.feverActive ? 0xff66ee : activePalette.eye);
  const auraTarget = player.feverActive ? 0.5 + Math.sin(time * 5) * 0.18 : 0;
  auraSprite.material.opacity = damp(auraSprite.material.opacity, auraTarget, 5, dt);

  group.updateMatrixWorld(true);

  // Wing-tip contrails while boosting: small sprites pinned to the true
  // wing tips, sampled after the matrix update so they track the flap.
  if (player.boosting) {
    contrailTimer -= dt;
    if (contrailTimer <= 0) {
      contrailTimer = (player.feverActive ? 0.018 : 0.026) / quality;
      for (const marker of [tipMarkerL, tipMarkerR]) {
        const s = trailSprites.find(s => !s.visible);
        if (!s) break;
        marker.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = player.feverActive ? 0.75 : 0.6; // shorter than body trail = crisp ribbon
        s.material.color.setHex(player.feverActive ? 0xff9ad6 : activePalette.trail);
        s.position.copy(tmpV);
      }
    }
  }

  // Ponytail: hair chain
  riderHead.getWorldPosition(tmpV);
  tmpV.y += 0.1;
  tmpV.z += 0.14;
  ponyPoints[0].copy(tmpV);
  for (let i = 1; i < PONY_SEGS; i++) {
    const dir = tmpV2.copy(ponyPoints[i]).sub(ponyPoints[i - 1]);
    dir.y -= 2.4 * dt;
    dir.z += (player.speed / 35) * 2.8 * dt;
    if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
    dir.setLength(PONY_LEN);
    ponyPoints[i].copy(ponyPoints[i - 1]).add(dir);
    ponyMeshes[i].position.copy(ponyPoints[i]);
  }
  ponyMeshes[0].position.copy(ponyPoints[0]);

  // Cyan speed trail (orb/fast); shifts pink during fever
  trailTimer -= dt;
  if (player.speedActive && trailTimer <= 0) {
    trailTimer = (player.feverActive ? 0.009 : player.boosting ? 0.012 : 0.015) / quality;
    const s = trailSprites.find(s => !s.visible);
    if (s) {
      s.visible = true;
      s.userData.life = 1;
      s.material.color.setHex(player.feverActive ? 0xff9ad6 : 0xffffff);
      s.position.set(
        group.position.x + (Math.random() - 0.5) * 1.6,
        group.position.y + (Math.random() - 0.5) * 1.2,
        group.position.z + 3 + Math.random() * 2.5
      );
    }
  }
  for (const s of trailSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.5;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * 0.65;
      const sz = 0.8 + (1 - s.userData.life) * 2.2;
      s.scale.set(sz, sz, 1);
    }
  }

  // Blue boost trail (only while boosting); shifts pink during fever
  boostTrailTimer -= dt;
  if (player.boosting && boostTrailTimer <= 0) {
    boostTrailTimer = (player.feverActive ? 0.012 : 0.018) / quality;
    const s = boostTrailSprites.find(s => !s.visible);
    if (s) {
      s.visible = true;
      s.userData.life = player.feverActive ? 1.2 : 1;
      s.material.color.setHex(player.feverActive ? 0xff88cc : 0xffffff);
      s.position.set(
        group.position.x + (Math.random() - 0.5) * (player.feverActive ? 1.5 : 1.0),
        group.position.y + (Math.random() - 0.5) * (player.feverActive ? 1.3 : 0.9),
        group.position.z + 2 + Math.random() * (player.feverActive ? 6 : 4)
      );
    }
  }
  for (const s of boostTrailSprites) {
    if (!s.visible) continue;
    s.userData.life -= dt * 2.0;
    if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; }
    else {
      s.material.opacity = s.userData.life * 0.8;
      const sz = 1.2 + (1 - s.userData.life) * 3.5;
      s.scale.set(sz, sz, 1);
    }
  }

  // Death burst update
  if (burstActive) {
    burstTimer -= dt;
    const alive = burstTimer > 0;
    for (const p of burstParticles) {
      if (!p.visible) continue;
      p.position.x += p.userData.vel.x * dt;
      p.position.y += p.userData.vel.y * dt;
      p.position.z += p.userData.vel.z * dt;
      p.userData.vel.y -= 18 * dt; // gravity
      p.rotation.x += p.userData.spin * dt;
      p.rotation.z += p.userData.spin * 0.7 * dt;
      const life = Math.max(burstTimer, 0);
      p.material.opacity = life;
      p.scale.setScalar(life * 1.5 + 0.1);
      if (!alive) p.visible = false;
    }
    if (!alive) burstActive = false;
  }
}

export function resetDragon(player) {
  group.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  bankZ = 0;
  wingMat.emissiveIntensity = 0;
  bodyMat.emissiveIntensity = 0;
  auraSprite.material.opacity = 0;
  for (const p of ponyPoints) p.set(player.position.x, player.position.y + 1.5, player.position.z);
  for (const s of trailSprites) { s.visible = false; s.userData.life = 0; }
  for (const s of boostTrailSprites) { s.visible = false; s.userData.life = 0; }
  for (const p of burstParticles) { p.visible = false; }
  burstActive = false;
}
