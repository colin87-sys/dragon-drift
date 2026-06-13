import * as THREE from 'three';
import { damp, makeGlowTexture } from './util.js';
import { buildDragonModel } from './dragonModel.js';

// Procedural dragon + rider. Built from a dragon def (dragons.js: palette,
// model proportions, fx) and a rider def (riders.js: outfit, hair, accessory,
// glow). disposeDragon/rebuildDragon let the shop swap either mid-session.

let sceneRef = null;
let activeDef = null;
let activeRider = null;

let group = null;
let wingPivotL = null;
let wingPivotR = null;
let wingTipL = null;  // secondary fold joint for 2-segment wing
let wingTipR = null;
let wingPivot2L = null;
let wingPivot2R = null;
let head = null;
let tailSegs = [];

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

// Rider
let riderHead = null;
let riderGroup = null;
let scarfMesh = null;
let riderGlow = null;     // glow sprite behind the rider (premium riders)
let accessoryGem = null;  // oracle's floating gem
const PONY_LEN = 0.24;
let ponySegs = 10;
let ponyPoints = [];
let ponyMeshes = [];

// Speed trail: two separate pools — body trail and boost-only trail
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

export function createDragon(scene, def, riderDef) {
  sceneRef = scene;
  activeDef = def;
  activeRider = riderDef;

  const result = buildDragonModel(def);
  group = result.group;
  ({ head, tailSegs, wingPivotL, wingPivotR, wingTipL, wingTipR,
     wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR } = result.parts);
  ({ bodyMat, wingMat, eyeMat } = result.materials);
  auraSprite = result.auraSprite;

  buildRider(riderDef);
  scene.add(group);

  // Ponytail chain (world-space follow), length varies per rider
  const hairMat = new THREE.MeshStandardMaterial({ color: riderDef.hair, roughness: 0.9 });
  ponySegs = riderDef.ponySegs;
  ponyPoints = [];
  ponyMeshes = [];
  for (let i = 0; i < ponySegs; i++) {
    ponyPoints.push(new THREE.Vector3(0, 9, i * PONY_LEN));
    const r = 0.12 * (1 - i / (ponySegs + 2));
    const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r, 0.04), 8, 6), hairMat);
    scene.add(m);
    ponyMeshes.push(m);
  }

  // Speed-trail pools
  const cyanTex = makeGlowTexture('120,220,255');
  const blueTex = makeGlowTexture('80,130,255');

  trailSprites = [];
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
  boostTrailSprites = [];
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

function buildRider(riderDef) {
  const rider = new THREE.Group();
  riderGroup = rider;
  const riderMat = new THREE.MeshStandardMaterial({
    color: riderDef.suit, roughness: 0.78 - riderDef.suitMetal * 0.4,
    metalness: riderDef.suitMetal,
    emissive: riderDef.suitEmissive, emissiveIntensity: 0.45,
  });
  const cloakMat = new THREE.MeshStandardMaterial({
    color: riderDef.cloak, emissive: riderDef.cloakEmissive, emissiveIntensity: 0.3, roughness: 0.7,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: riderDef.scarf, emissive: riderDef.scarf, emissiveIntensity: 0.18, roughness: 0.7,
  });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a1b16, roughness: 0.75 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xffb13d, emissive: 0x773100, emissiveIntensity: 0.35, roughness: 0.45 });

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
  // Scarf tail
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.82, 4), scarfMat);
  scarfMesh = scarf;
  scarf.position.set(0.05, 0.2, 0.3);
  scarf.rotation.x = -0.6;
  rider.add(scarf);

  // Accessory geometry — each rider's signature.
  accessoryGem = null;
  if (riderDef.accessory === 'banner') {
    // Back-mounted pennant: thin pole + glowing flag
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.35, 0.035), strapMat);
    pole.position.set(-0.16, 0.62, 0.22);
    pole.rotation.x = 0.22;
    rider.add(pole);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), scarfMat);
    flag.position.set(-0.16, 1.28, 0.32);
    flag.rotation.z = Math.PI / 2;
    flag.scale.set(0.4, 1, 1);
    rider.add(flag);
  } else if (riderDef.accessory === 'visor') {
    // Glowing eye band across the helmet
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.075, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x102030, emissive: riderDef.scarf, emissiveIntensity: 1.8, roughness: 0.2,
      })
    );
    visor.position.set(0, 0.55, -0.38);
    rider.add(visor);
  } else if (riderDef.accessory === 'hood') {
    // Deep hood + a gem that floats above it (animated in updateDragon)
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.52, 6), cloakMat);
    hood.position.set(0, 0.66, -0.16);
    hood.rotation.x = 0.18;
    rider.add(hood);
    accessoryGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.075, 0),
      new THREE.MeshStandardMaterial({
        color: 0x301840, emissive: riderDef.scarf, emissiveIntensity: 2.4, roughness: 0.2,
      })
    );
    accessoryGem.position.set(0, 1.05, -0.2);
    rider.add(accessoryGem);
  }

  // Soft signature glow behind the rider (premium riders only)
  riderGlow = null;
  if (riderDef.glowColor) {
    riderGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(riderDef.glowColor), transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    riderGlow.scale.set(1.6, 1.6, 1);
    riderGlow.position.set(0, 0.5, 0.05);
    riderGlow.layers.set(1);
    rider.add(riderGlow);
  }

  rider.position.set(0, 1.12, -0.6);
  group.add(rider);
}

// Remove every scene object this module owns (dragon, rider, ponytail,
// trail pools, death shards) so a new dragon/rider combo can be built.
export function disposeDragon() {
  if (!sceneRef || !group) return;
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  sceneRef.remove(group);
  for (const m of ponyMeshes) {
    m.geometry.dispose();
    sceneRef.remove(m);
  }
  for (const s of [...trailSprites, ...boostTrailSprites]) {
    s.material.dispose();
    sceneRef.remove(s);
  }
  for (const p of burstParticles) {
    p.geometry.dispose();
    p.material.dispose();
    sceneRef.remove(p);
  }
  group = null;
  wingPivot2L = null;
  wingPivot2R = null;
  ponyMeshes = [];
  trailSprites = [];
  boostTrailSprites = [];
  burstParticles = [];
  burstActive = false;
}

// Shop equip: tear down and rebuild at the player's current position.
export function rebuildDragon(def, riderDef, player) {
  disposeDragon();
  createDragon(sceneRef, def, riderDef);
  resetDragon(player);
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

  // Rider effects: glow breathes with speed; oracle gem orbits/bobs.
  if (riderGlow) {
    riderGlow.material.opacity = 0.22 + speedNorm * 0.25 + Math.sin(time * 4) * 0.06;
  }
  if (accessoryGem) {
    accessoryGem.position.y = 1.05 + Math.sin(time * 2.6) * 0.06;
    accessoryGem.rotation.y = time * 2.2;
  }

  // Wing flap: 2-segment articulation with speed/turn-driven asymmetry.
  // flapBias gives each dragon its own wingbeat character.
  const feverBoost = player.feverActive ? 1.3 : 1;
  const flapSpeed = (player.speedActive ? 11 : 6) * feverBoost * activeDef.model.flapBias;
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
  // Secondary wing pair (Obsidian T4): shadow flap at reduced amplitude.
  if (wingPivot2L) {
    wingPivot2L.rotation.z = damp(wingPivot2L.rotation.z,  rootFlap * 0.6 + turnBias, 14, dt);
    wingPivot2R.rotation.z = damp(wingPivot2R.rotation.z, -rootFlap * 0.6 + turnBias, 14, dt);
  }

  // Snake-like tail wave: each segment lags behind the previous and trails
  // opposite the dragon's steering, so sharp turns bend the whole silhouette.
  for (let i = 0; i < tailSegs.length; i++) {
    const tphase = time * 3.8 - i * 0.55;
    const amp = 0.09 * (i + 1) * (i < tailSegs.length - 1 ? 1 : 0.6);
    const trailK = (i + 1) / tailSegs.length;
    const motionTrailX = -player.velocity.x * 0.055 * trailK * trailK;
    const motionTrailY = -player.velocity.y * 0.04 * trailK * trailK;
    const speedWhip = speedNorm * Math.sin(time * 7.5 - i * 0.7) * 0.12 * trailK;
    const waveX = Math.sin(tphase) * amp + motionTrailX + speedWhip;
    const waveY = Math.cos(tphase * 0.7) * amp * 0.4 + motionTrailY;
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
  wingMat.emissive.setHex(player.feverActive ? 0xff44cc : activeDef.wingEmissive);
  bodyMat.emissiveIntensity = damp(bodyMat.emissiveIntensity, player.feverActive ? 0.35 : 0.12, 4, dt);
  eyeMat.emissive.setHex(player.feverActive ? 0xff66ee : activeDef.eye);
  // Aura: full blaze during fever; premium dragons idle with a faint halo.
  const idle = activeDef.fx.auraIdle;
  const auraTarget = player.feverActive
    ? 0.5 + Math.sin(time * 5) * 0.18
    : idle > 0 ? idle * (0.85 + Math.sin(time * 3) * 0.15) : 0;
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
        s.material.color.setHex(player.feverActive ? 0xff9ad6 : activeDef.trail);
        s.position.copy(tmpV);
      }
    }
  }

  // Ponytail: hair chain
  riderHead.getWorldPosition(tmpV);
  tmpV.y += 0.1;
  tmpV.z += 0.14;
  ponyPoints[0].copy(tmpV);
  for (let i = 1; i < ponySegs; i++) {
    const dir = tmpV2.copy(ponyPoints[i]).sub(ponyPoints[i - 1]);
    dir.y -= 2.4 * dt;
    dir.z += (player.speed / 35) * 2.8 * dt;
    if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
    dir.setLength(PONY_LEN);
    ponyPoints[i].copy(ponyPoints[i - 1]).add(dir);
    ponyMeshes[i].position.copy(ponyPoints[i]);
  }
  ponyMeshes[0].position.copy(ponyPoints[0]);

  // Speed trail (orb/fast), tinted per dragon; shifts pink during fever
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

  // Boost trail (only while boosting), per-dragon tint; pink during fever
  boostTrailTimer -= dt;
  if (player.boosting && boostTrailTimer <= 0) {
    boostTrailTimer = (player.feverActive ? 0.012 : 0.018) / quality;
    const s = boostTrailSprites.find(s => !s.visible);
    if (s) {
      s.visible = true;
      s.userData.life = player.feverActive ? 1.2 : 1;
      s.material.color.setHex(player.feverActive ? 0xff88cc : activeDef.boostTrail);
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
  group.position.set(player.position.x, player.position.y, player.position.z);
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
