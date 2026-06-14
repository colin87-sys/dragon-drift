import * as THREE from 'three';
import { damp, makeGlowTexture } from './util.js';
import { buildDragonModel } from './dragonModel.js';
import { buildRiderFigure, riderMaterials } from './riderParts.js';
import { setFeverTint } from './postfx.js';

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
let coreGlow = null;      // violet core energy sprite (pulses during Surge)
let spineMats = [];       // spine/crest/seam/plate mats → white-gold in Surge
let surgeMix = 0;         // 0..1 damped Surge transition
let prevFever = false;    // rising-edge detect for the Surge ignition flourish
let surgeAnimT = 0;       // one-shot transformation timer (s)
const _surgeBaseCol = new THREE.Color();
const _surgeHi = new THREE.Color(); // per-dragon Surge highlight (def.surgeHi)
let quality = 1;

export function setDragonQuality(q) {
  quality = q;
}

// Rider
let riderHead = null;
let riderGroup = null;
let scarfMesh = null;
let riderGlow = null;     // glow sprite behind the rider (premium riders)
let riderOrbiters = [];   // orbiting shards (Void Oracle) animated each frame
const PONY_LEN = 0.24;
let ponySegs = 10;
let ponyPoints = [];
let ponyMeshes = [];

// Speed trail: two separate pools — body trail and boost-only trail
const TRAIL_POOL = 140;
let trailSprites = [];
let boostTrailSprites = [];
let emberMotes = [];   // Phoenix-only: floating ember-feather motes
let moteTimer = 0;
let trailTimer = 0;
let boostTrailTimer = 0;
let contrailTimer = 0;
let trailPaletteIdx = 0;

// Trail color for a freshly-spawned sprite: cycles the equipped flightmark's
// trailPalette (aurora/goldleaf) when present, else the flat per-dragon color.
function pickTrailHex(fallback) {
  const pal = activeDef && activeDef.trailPalette;
  if (pal && pal.length) return pal[trailPaletteIdx++ % pal.length];
  return fallback;
}

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
  coreGlow = result.parts.coreGlow;
  spineMats = result.materials.spineMats || [];
  surgeMix = 0;
  surgeAnimT = 0;
  prevFever = false;

  // Per-dragon Surge wash hue (def.feverWash): the Phoenix Rebirth washes warm
  // gold, the Sovereign eclipse washes cool blue, the rest keep the magenta default.
  setFeverTint(def.feverWash || null);

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

  // Phoenix only: a small pool of floating ember-feather motes that shed gently
  // from the plume — the firebird's signature "rebirth" embers.
  emberMotes = [];
  if (def.archetype === 'phoenix') {
    const moteTex = makeGlowTexture('255,224,150');
    for (let i = 0; i < 28; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: moteTex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      s.visible = false; s.userData.life = 0; s.userData.vy = 0;
      s.layers.set(1);
      scene.add(s);
      emberMotes.push(s);
    }
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

  // The character (torso-up, with its signature headgear/back-gear/trail) is
  // built by the shared riderParts module so it matches the shop turntable.
  const mats = riderMaterials(riderDef);
  const fig = buildRiderFigure(riderDef, mats);
  rider.add(fig.group);
  riderHead = fig.head;
  scarfMesh = fig.trail;        // a Group now; the trail swings as one
  riderOrbiters = fig.orbiters; // empty for most riders
  riderGlow = fig.glow;
  if (riderGlow) riderGlow.layers.set(1); // bloom layer in-game

  // Saddle + cinch straps anchoring the rider to the dragon's back.
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a1b16, roughness: 0.75 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xffb13d, emissive: 0x773100, emissiveIntensity: 0.35, roughness: 0.45 });
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.5), strapMat);
  saddle.position.set(0, -0.16, -0.02);
  rider.add(saddle);
  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.08), amberMat);
    strap.position.set(sx * 0.26, 0.05, 0.03);
    rider.add(strap);
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
  for (const s of [...trailSprites, ...boostTrailSprites, ...emberMotes]) {
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
  emberMotes = [];
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
  // Trail group rests pre-oriented; speed sweeps it back and a gentle waggle
  // keeps it alive. Works for every trail style (tatters/cape/ribbon/robe).
  scarfMesh.rotation.x = damp(scarfMesh.rotation.x, -0.08 - speedNorm * 0.5, 10, dt);
  scarfMesh.rotation.z = Math.sin(time * (5 + speedNorm * 7)) * (0.1 + speedNorm * 0.16);

  // Rider effects: glow breathes with speed; oracle's shards orbit the head.
  if (riderGlow) {
    riderGlow.material.opacity = 0.2 + speedNorm * 0.22 + Math.sin(time * 4) * 0.05;
  }
  for (const o of riderOrbiters) {
    o.ang += dt * o.speed;
    o.mesh.position.x = Math.cos(o.ang) * o.radius;
    o.mesh.position.z = Math.sin(o.ang) * o.radius * o.flat;
    o.mesh.position.y = o.baseY + Math.sin(time * 1.6 + o.ang) * 0.04;
    o.mesh.rotation.y = time * 1.5;
  }

  // Wing flap: 2-segment articulation with speed/turn-driven asymmetry.
  // flapBias gives each dragon its own wingbeat character.
  const feverBoost = player.feverActive ? 1.3 : 1;
  const flapSpeed = (player.speedActive ? 11 : 6) * feverBoost * activeDef.model.flapBias;
  // flapAmp: per-dragon wingbeat size. Premium gliders (Solar) beat smaller so
  // the bowed elbow silhouette stays readable from behind instead of washing
  // out into a flat strip at the extremes of a big flap.
  const flapAmp = (player.speedActive ? 0.7 : 0.52) * (activeDef.model.flapAmp ?? 1);
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

  // Snake-like tail coil: the ROOT segment is locked to the body (lock=0) and
  // the sway ramps toward the tip (lock→1), so the whole tail coils with a
  // travelling wave while staying anchored — it never detaches into a spear.
  // Heavy segment overlap (built in dragonParts) hides the joints as it bends.
  const nTail = tailSegs.length;
  for (let i = 0; i < nTail; i++) {
    const lock = nTail > 1 ? i / (nTail - 1) : 0;
    const lock2 = lock * lock;
    const tphase = time * 4.0 - i * 0.6;
    const amp = 0.3 * lock2;
    const motionTrailX = -player.velocity.x * 0.05 * lock2;
    const motionTrailY = -player.velocity.y * 0.04 * lock2;
    const speedWhip = speedNorm * Math.sin(time * 8 - i * 0.7) * 0.12 * lock2;
    const waveX = Math.sin(tphase) * amp + motionTrailX + speedWhip;
    const waveY = Math.cos(tphase * 0.8) * amp * 0.55 + motionTrailY;
    tailSegs[i].position.x = damp(tailSegs[i].position.x, waveX, 10, dt);
    tailSegs[i].position.y = damp(tailSegs[i].position.y, waveY, 10, dt);
    // Rotation follows the wave direction so segments bank into the coil.
    tailSegs[i].rotation.z = damp(tailSegs[i].rotation.z, -waveX * 0.5, 12, dt);
    tailSegs[i].rotation.y = damp(tailSegs[i].rotation.y, waveX * 0.5, 12, dt);
  }

  // Boost/Surge glow + fever tint + eyes + aura (cheap material writes).
  const backlit = 0.22 + Math.max(0, Math.sin(phase)) * 0.18;

  // Surge TRANSFORMATION: a Surge START fires a ~0.7s ignition flourish (a
  // 0→1→0 burst) instead of a hard color swap — it flashes the core, overshoots
  // the spine, swells a glow around the wings and pulses the body, then settles
  // into the steady transformed state (surgeMix).
  if (player.feverActive && !prevFever) surgeAnimT = 0.7;
  prevFever = player.feverActive;
  if (surgeAnimT > 0) surgeAnimT = Math.max(0, surgeAnimT - dt);
  const ignite = surgeAnimT > 0 ? Math.sin((1 - surgeAnimT / 0.7) * Math.PI) : 0;
  surgeMix = damp(surgeMix, player.feverActive ? 1 : 0, 4, dt);

  // Wings: a soft emitting glow swells AROUND them during Surge (replaces the
  // old emitting ring), spiking on the ignition flourish.
  const wingGlowTarget = backlit + (player.boosting ? 0.7 : 0) + surgeMix * 0.55 + ignite * 0.8;
  wingMat.emissiveIntensity = damp(wingMat.emissiveIntensity, wingGlowTarget, 6, dt);
  // Surge wing tint is per-dragon: dragons blaze magenta, the Phoenix ignites
  // white-gold (def.feverWing) so its Rebirth reads celestial, not pink.
  wingMat.emissive.setHex(player.feverActive ? (activeDef.feverWing ?? 0xff44cc) : activeDef.wingEmissive);
  // Membrane translucency by state (bones/struts keep their own opaque mats):
  // see upcoming rings through the wing — more so while boosting / surging.
  const wingOpacity = player.feverActive ? 0.70 : player.boosting ? 0.77 : 0.82;
  wingMat.opacity = damp(wingMat.opacity, wingOpacity, 5, dt);
  // Violet core energy: pulses on boost, blazes + flashes on the Surge ignition.
  if (coreGlow) {
    const cb = coreGlow.userData.base || 0.3;
    const coreTarget = (player.feverActive ? cb * 2.4 + Math.sin(time * 9) * 0.08
      : player.boosting ? cb * 1.5 : cb) + ignite * 0.5;
    coreGlow.material.opacity = damp(coreGlow.material.opacity, coreTarget, 5, dt);
  }
  // Spine/crest/seam/tail plates flare toward the per-dragon Surge highlight,
  // overshooting on the ignition.
  if (surgeMix > 0.002 || ignite > 0.002) {
    _surgeHi.setHex(activeDef.surgeHi || 0xfff8e8); // white-gold default; cool per dragon
    for (const m of spineMats) {
      _surgeBaseCol.setHex(m.userData.baseEmissive ?? 0xffffff);
      m.emissive.copy(_surgeBaseCol).lerp(_surgeHi, Math.min(1, surgeMix * 0.85 + ignite * 0.4));
      m.emissiveIntensity = (m.userData.baseIntensity ?? 1) * (1 + surgeMix * 0.9 + ignite * 1.6);
    }
  } else {
    for (const m of spineMats) {
      m.emissive.setHex(m.userData.baseEmissive ?? 0xffffff);
      m.emissiveIntensity = m.userData.baseIntensity ?? 1;
    }
  }
  // Body "power-up" pulse on the ignition flourish (settles back to scale).
  group.scale.setScalar(activeDef.model.scale * (1 + ignite * 0.05));
  bodyMat.emissiveIntensity = damp(bodyMat.emissiveIntensity, player.feverActive ? 0.35 : 0.12, 4, dt);
  eyeMat.emissive.setHex(player.feverActive ? (activeDef.feverEye ?? 0xff66ee) : activeDef.eye);
  // Aura: full blaze during fever; premium dragons idle with a faint halo.
  const idle = activeDef.fx.auraIdle;
  const auraTarget = player.feverActive
    ? 0.5 + Math.sin(time * 5) * 0.18
    : idle > 0 ? idle * (0.85 + Math.sin(time * 3) * 0.15) : 0;
  auraSprite.material.opacity = damp(auraSprite.material.opacity, auraTarget, 5, dt);

  group.updateMatrixWorld(true);

  // Wing-tip contrails — the SECONDARY boost accent, only on the elite forms
  // (spineGlow ≥ 0.5) and only while boosting, so it stays restrained. Violet
  // wisps during Surge (the apex's amethyst energy at the wing edge).
  const wingFx = (activeDef.model.spineGlow || 0) >= 0.5;
  if (player.boosting && wingFx) {
    contrailTimer -= dt;
    if (contrailTimer <= 0) {
      contrailTimer = (player.feverActive ? 0.02 : 0.03) / quality;
      for (const marker of [tipMarkerL, tipMarkerR]) {
        const s = trailSprites.find(s => !s.visible);
        if (!s) break;
        marker.getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = player.feverActive ? 0.75 : 0.6; // shorter than body trail = crisp ribbon
        s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xc998ff : pickTrailHex(activeDef.trail));
        s.position.copy(tmpV);
      }
    }
  }

  // Ponytail: hair chain (only the loose-haired riders have one)
  if (ponySegs > 0) {
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
  }

  // Speed trail (orb/fast), tinted per dragon; shifts pink during fever
  trailTimer -= dt;
  if (player.speedActive && trailTimer <= 0) {
    trailTimer = (player.feverActive ? 0.009 : player.boosting ? 0.012 : 0.015) / quality;
    const s = trailSprites.find(s => !s.visible);
    if (s) {
      s.visible = true;
      s.userData.life = 1;
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xff9ad6 : pickTrailHex(activeDef.trail));
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

  // Boost exhaust — the TAIL is the primary boost source: emit from the tail
  // TIP, denser the more evolved the form (spineGlow proxies the tier), and a
  // white-gold core during Surge.
  boostTrailTimer -= dt;
  if (player.boosting && boostTrailTimer <= 0) {
    const fxLvl = activeDef.model.spineGlow || 0; // 0 hatchling → 1 apex
    boostTrailTimer = (player.feverActive ? 0.012 : 0.018) / (quality * (1 + fxLvl * 0.7));
    const s = boostTrailSprites.find(s => !s.visible);
    if (s && tailSegs.length) {
      tailSegs[tailSegs.length - 1].getWorldPosition(tmpV);
      s.visible = true;
      s.userData.life = player.feverActive ? 1.2 : 1;
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xfff0c0 : pickTrailHex(activeDef.boostTrail));
      s.position.set(
        tmpV.x + (Math.random() - 0.5) * 0.8,
        tmpV.y + (Math.random() - 0.5) * 0.6,
        tmpV.z + Math.random() * (player.feverActive ? 3 : 2)
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

  // Phoenix ember-feather motes: faint warm motes shed from the plume and drift
  // UP + BACK (toward the camera, away from the centre lane), denser on later
  // forms and while boosting. White-gold on boost. Controlled so it never clutters.
  if (emberMotes.length) {
    const fxLvl = activeDef.model.spineGlow || 0;
    moteTimer -= dt;
    if (moteTimer <= 0 && tailSegs.length) {
      moteTimer = Math.max(0.05, (player.boosting ? 0.08 : 0.18) - fxLvl * 0.07);
      const s = emberMotes.find(s => !s.visible);
      if (s) {
        tailSegs[Math.floor(tailSegs.length * 0.6)].getWorldPosition(tmpV);
        s.visible = true;
        s.userData.life = 1;
        s.userData.vy = 0.5 + Math.random() * 0.9;
        s.material.color.setHex(player.boosting ? 0xfff0c8 : 0xffd987);
        s.position.set(
          tmpV.x + (Math.random() - 0.5) * 1.0,
          tmpV.y + (Math.random() - 0.5) * 0.5,
          tmpV.z + Math.random() * 1.2
        );
      }
    }
    for (const s of emberMotes) {
      if (!s.visible) continue;
      s.userData.life -= dt * 0.85;
      if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; continue; }
      s.position.y += s.userData.vy * dt;   // buoyant rise
      s.position.z += dt * 1.4;             // drift back toward the camera
      s.material.opacity = s.userData.life * (0.35 + fxLvl * 0.2);
      const sz = 0.22 + (1 - s.userData.life) * 0.5;
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
  for (const s of emberMotes) { s.visible = false; s.material.opacity = 0; s.userData.life = 0; }
  for (const p of burstParticles) { p.visible = false; }
  burstActive = false;
}
