// The hero: a floating warp-knight built from primitives, dressed by the
// equipped armor (mixed sets show mixed pieces), animated by keyframed pose
// clips damped onto pivot rotations — contact frames snap, recoveries flow.
// Owns the weapon socket, the offhand dagger, the Armiger ghost-weapon ring,
// the cape chain and blade trails.

import * as THREE from 'three';
import { WEAPONS, ARMOR_SETS, ARMOR_BUILDERS, ARMOR_SLOTS } from './gear.js';
import { trailDab } from './particles.js';
import { texFlare } from './util.js';
import { damp, clamp, TAU } from './util.js';

let scene = null;
let group = null;       // root (world transform; faces the boss)
let body = null;        // bob / dodge spin / warp stretch
const pivots = {};      // named rotation pivots
let weaponMesh = null;
let offhandMesh = null;
let weaponTipLocal = new THREE.Vector3(0, 1.6, 0);
let capeSegs = [];
let armigerRing = null;
let glowSprite = null;

const IDLE = {
  hips: [0.06, 0, 0],
  torso: [0.1, 0, 0],
  headPivot: [-0.06, 0, 0],
  shoulderR: [0.5, 0, -0.32],
  shoulderL: [0.55, 0, 0.4],
  legR: [0.55, 0, -0.06],
  legL: [0.4, 0, 0.1],
};

// --- Attack/react clips: sparse keyframed pivot eulers --------------------
// Each key animates only the pivots it names; everything else eases to IDLE.
const CLIPS = {
  sword_1: { dur: 0.42, hit: [0.32, 0.6], keys: [
    { t: 0,    p: { shoulderR: [-1.9, 0, -1.1], torso: [0.05, -0.55, 0] } },
    { t: 0.32, p: { shoulderR: [-1.9, 0, -1.1], torso: [0.05, -0.55, 0] } },
    { t: 0.55, p: { shoulderR: [1.3, 0, 0.9], torso: [0.22, 0.5, 0] } },
    { t: 1,    p: { shoulderR: [0.9, 0, 0.6], torso: [0.16, 0.3, 0] } },
  ] },
  sword_2: { dur: 0.4, hit: [0.3, 0.58], keys: [
    { t: 0,    p: { shoulderR: [1.2, 0, 1.0], torso: [0.2, 0.5, 0] } },
    { t: 0.3,  p: { shoulderR: [1.2, 0, 1.0], torso: [0.2, 0.5, 0] } },
    { t: 0.55, p: { shoulderR: [-1.4, 0, -0.9], torso: [0.05, -0.5, 0] } },
    { t: 1,    p: { shoulderR: [-0.6, 0, -0.5], torso: [0.1, -0.25, 0] } },
  ] },
  sword_3: { dur: 0.5, hit: [0.38, 0.62], keys: [
    { t: 0,    p: { shoulderR: [-2.6, 0, 0], torso: [-0.18, 0, 0], hips: [-0.08, 0, 0] } },
    { t: 0.38, p: { shoulderR: [-2.6, 0, 0], torso: [-0.18, 0, 0] } },
    { t: 0.6,  p: { shoulderR: [1.5, 0, 0], torso: [0.45, 0, 0], hips: [0.16, 0, 0] } },
    { t: 1,    p: { shoulderR: [1.1, 0, 0], torso: [0.3, 0, 0] } },
  ] },
  spear_1: { dur: 0.36, hit: [0.3, 0.55], keys: [
    { t: 0,    p: { shoulderR: [-1.2, 0, -0.5], torso: [0.02, -0.4, 0] } },
    { t: 0.3,  p: { shoulderR: [-1.2, 0, -0.5], torso: [0.02, -0.4, 0] } },
    { t: 0.5,  p: { shoulderR: [1.7, 0, 0.1], torso: [0.3, 0.35, 0] } },
    { t: 1,    p: { shoulderR: [1.2, 0, 0], torso: [0.2, 0.2, 0] } },
  ] },
  spear_2: { dur: 0.36, hit: [0.3, 0.55], keys: [
    { t: 0,    p: { shoulderR: [-1.0, 0, 0.4], torso: [0, 0.35, 0] } },
    { t: 0.3,  p: { shoulderR: [-1.0, 0, 0.4], torso: [0, 0.35, 0] } },
    { t: 0.5,  p: { shoulderR: [1.8, 0, -0.3], torso: [0.32, -0.3, 0] } },
    { t: 1,    p: { shoulderR: [1.2, 0, -0.1], torso: [0.2, -0.15, 0] } },
  ] },
  spear_3: { dur: 0.5, hit: [0.36, 0.66], keys: [
    { t: 0,    p: { shoulderR: [-2.2, 0, -0.8], torso: [-0.12, -0.5, 0] } },
    { t: 0.36, p: { shoulderR: [-2.2, 0, -0.8], torso: [-0.12, -0.5, 0] } },
    { t: 0.62, p: { shoulderR: [1.9, 0, 0.7], torso: [0.4, 0.55, 0], hips: [0.14, 0, 0] } },
    { t: 1,    p: { shoulderR: [1.3, 0, 0.4], torso: [0.26, 0.3, 0] } },
  ] },
  gs_1: { dur: 0.66, hit: [0.42, 0.66], keys: [
    { t: 0,    p: { shoulderR: [-2.2, 0, -1.4], shoulderL: [-1.6, 0, 1.1], torso: [0, -0.8, 0], hips: [-0.06, -0.2, 0] } },
    { t: 0.42, p: { shoulderR: [-2.2, 0, -1.4], shoulderL: [-1.6, 0, 1.1], torso: [0, -0.8, 0] } },
    { t: 0.66, p: { shoulderR: [1.4, 0, 1.1], shoulderL: [0.9, 0, -0.5], torso: [0.3, 0.85, 0], hips: [0.12, 0.2, 0] } },
    { t: 1,    p: { shoulderR: [1.0, 0, 0.8], shoulderL: [0.8, 0, -0.2], torso: [0.2, 0.5, 0] } },
  ] },
  gs_2: { dur: 0.74, hit: [0.5, 0.7], keys: [
    { t: 0,    p: { shoulderR: [-2.9, 0, -0.2], shoulderL: [-2.7, 0, 0.3], torso: [-0.3, 0, 0], hips: [-0.12, 0, 0] } },
    { t: 0.5,  p: { shoulderR: [-2.9, 0, -0.2], shoulderL: [-2.7, 0, 0.3], torso: [-0.3, 0, 0] } },
    { t: 0.72, p: { shoulderR: [1.6, 0, 0], shoulderL: [1.5, 0, 0.1], torso: [0.55, 0, 0], hips: [0.2, 0, 0] } },
    { t: 1,    p: { shoulderR: [1.2, 0, 0], shoulderL: [1.1, 0, 0.1], torso: [0.36, 0, 0] } },
  ] },
  dagger_1: { dur: 0.26, hit: [0.25, 0.55], keys: [
    { t: 0,   p: { shoulderR: [-1.3, 0, -0.6], torso: [0.05, -0.3, 0] } },
    { t: 0.4, p: { shoulderR: [1.2, 0, 0.6], torso: [0.18, 0.3, 0] } },
    { t: 1,   p: { shoulderR: [0.8, 0, 0.4], torso: [0.12, 0.18, 0] } },
  ] },
  dagger_2: { dur: 0.26, hit: [0.25, 0.55], keys: [
    { t: 0,   p: { shoulderL: [-1.3, 0, 0.6], torso: [0.05, 0.3, 0] } },
    { t: 0.4, p: { shoulderL: [1.2, 0, -0.6], torso: [0.18, -0.3, 0] } },
    { t: 1,   p: { shoulderL: [0.8, 0, -0.4], torso: [0.12, -0.18, 0] } },
  ] },
  dagger_3: { dur: 0.26, hit: [0.25, 0.55], keys: [
    { t: 0,   p: { shoulderR: [-1.8, 0, 0.2], torso: [-0.05, -0.2, 0] } },
    { t: 0.4, p: { shoulderR: [1.5, 0, -0.2], torso: [0.25, 0.2, 0] } },
    { t: 1,   p: { shoulderR: [1.0, 0, 0], torso: [0.15, 0.1, 0] } },
  ] },
  dagger_4: { dur: 0.3, hit: [0.3, 0.6], keys: [
    { t: 0,   p: { shoulderR: [-1.6, 0, -0.9], shoulderL: [-1.6, 0, 0.9], torso: [-0.1, 0, 0] } },
    { t: 0.45, p: { shoulderR: [1.4, 0, 0.8], shoulderL: [1.4, 0, -0.8], torso: [0.3, 0, 0] } },
    { t: 1,   p: { shoulderR: [1.0, 0, 0.5], shoulderL: [1.0, 0, -0.5], torso: [0.2, 0, 0] } },
  ] },
  hitReact: { dur: 0.34, keys: [
    { t: 0,   p: { torso: [-0.4, 0, 0.12], headPivot: [0.3, 0, 0], shoulderR: [-0.4, 0, -0.8], shoulderL: [-0.4, 0, 0.8] } },
    { t: 1,   p: {} },
  ] },
  warpPose: { dur: 0.3, keys: [
    { t: 0, p: { shoulderR: [2.6, 0, -0.2], shoulderL: [2.6, 0, 0.2], torso: [0.5, 0, 0], legR: [1.2, 0, 0], legL: [1.1, 0, 0] } },
    { t: 1, p: { shoulderR: [2.6, 0, -0.2], shoulderL: [2.6, 0, 0.2], torso: [0.5, 0, 0], legR: [1.2, 0, 0], legL: [1.1, 0, 0] } },
  ] },
  cast: { dur: 0.5, keys: [
    { t: 0,   p: { shoulderR: [-2.8, 0, -0.4], shoulderL: [-2.8, 0, 0.4], torso: [-0.2, 0, 0] } },
    { t: 0.5, p: { shoulderR: [-2.8, 0, -0.4], shoulderL: [-2.8, 0, 0.4], torso: [-0.2, 0, 0] } },
    { t: 1,   p: {} },
  ] },
  victory: { dur: 1.6, keys: [
    { t: 0,   p: {} },
    { t: 0.3, p: { shoulderR: [-2.9, 0, -0.3], torso: [-0.12, 0, 0], headPivot: [-0.3, 0, 0] } },
    { t: 1,   p: { shoulderR: [-2.9, 0, -0.3], torso: [-0.12, 0, 0], headPivot: [-0.3, 0, 0] } },
  ] },
};

// --- State -------------------------------------------------------------------

export const hero = {
  // shell coords (combat.js owns these)
  theta: 0, h: 8, r: 30,
  pos: new THREE.Vector3(),
  facing: new THREE.Vector3(0, 0, 1),

  clip: null,
  clipName: '',
  clipT: 0,
  clipDur: 1,
  trailOn: false,
  trailColor: 0x57c8ff,

  _dodgeSpin: 0,
  _dodgeDir: 1,
  _warpStretch: 0,
  _bank: 0,
  _bob: Math.random() * 10,

  get root() { return group; },
  get inClip() { return !!this.clip; },

  hitWindow() {
    if (!this.clip || !this.clip.hit) return null;
    const k = this.clipT / this.clipDur;
    return { active: k >= this.clip.hit[0] && k <= this.clip.hit[1], k };
  },

  play(name, durMult = 1) {
    const c = CLIPS[name];
    if (!c) return 0;
    this.clip = c;
    this.clipName = name;
    this.clipT = 0;
    this.clipDur = c.dur * durMult;
    return this.clipDur;
  },

  stopClip() {
    this.clip = null;
    this.clipName = '';
  },

  startDodgeSpin(dir) {
    this._dodgeSpin = 1;
    this._dodgeDir = dir >= 0 ? 1 : -1;
  },

  setWarpStretch(k) { this._warpStretch = clamp(k, 0, 1); },
  setBank(b) { this._bank = b; },

  setArmiger(on, intensity = 1) {
    if (armigerRing) {
      armigerRing.visible = on;
      armigerRing.userData.intensity = intensity;
    }
    if (glowSprite) glowSprite.material.opacity = on ? 0.5 : 0.22;
  },

  pulseArmigerRing(seconds = 1.2) {
    if (armigerRing) {
      armigerRing.visible = true;
      armigerRing.userData.pulse = seconds;
    }
  },

  weaponTipWorld(out) {
    if (!weaponMesh) return out.copy(this.pos);
    return weaponMesh.localToWorld(out.copy(weaponTipLocal));
  },
};

// --- Build ---------------------------------------------------------------------

function disposeGroup(g) {
  if (!g) return;
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
  if (g.parent) g.parent.remove(g);
}

export function initHero(s) {
  scene = s;
}

// equipment: { weapon: {id, tier}, armor: {helm,chest,gauntlets,greaves}, owned: [weaponIds] }
export function rebuildHero(equipment) {
  const prevPos = group ? group.position.clone() : null;
  const prevQuat = group ? group.quaternion.clone() : null;
  disposeGroup(group);
  for (const k of Object.keys(pivots)) delete pivots[k];
  capeSegs = [];
  weaponMesh = null;
  offhandMesh = null;

  group = new THREE.Group();
  body = new THREE.Group();
  group.add(body);

  const chestSet = ARMOR_SETS[equipment.armor.chest] || ARMOR_SETS.drifter;
  const pal = chestSet.palette;
  const suitMat = new THREE.MeshStandardMaterial({
    color: pal.suit, roughness: 0.7, metalness: 0.12,
    emissive: pal.suitEmissive, emissiveIntensity: 0.4,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9b59a, roughness: 0.6 });

  // Skeleton
  const hips = new THREE.Group();
  hips.position.y = 0;
  body.add(hips);
  const torso = new THREE.Group();
  torso.position.y = 0.34;
  hips.add(torso);
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.44;
  torso.add(headPivot);

  // Core body meshes
  hips.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), suitMat));
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.26, 4, 8), suitMat);
  chest.position.y = 0.12;
  torso.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 9, 7), skinMat);
  head.position.y = 0.05;
  headPivot.add(head);

  const mkArm = (sx) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.26, 0.28, 0);
    torso.add(shoulder);
    const arm = new THREE.Group();
    shoulder.add(arm);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.28, 4, 7), suitMat);
    upper.position.y = -0.17;
    arm.add(upper);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.26, 4, 7), suitMat);
    fore.position.y = -0.46;
    arm.add(fore);
    const hand = new THREE.Group();
    hand.position.y = -0.64;
    arm.add(hand);
    return { shoulder, arm, hand };
  };
  const R = mkArm(1);
  const L = mkArm(-1);

  const mkLeg = (sx) => {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.1, -0.12, 0);
    hips.add(leg);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.3, 4, 7), suitMat);
    thigh.position.y = -0.2;
    leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.3, 4, 7), suitMat);
    shin.position.y = -0.52;
    leg.add(shin);
    return leg;
  };

  pivots.hips = hips;
  pivots.torso = torso;
  pivots.headPivot = headPivot;
  pivots.shoulderR = R.shoulder;
  pivots.shoulderL = L.shoulder;
  pivots.armR = R.arm;
  pivots.armL = L.arm;
  pivots.handR = R.hand;
  pivots.handL = L.hand;
  pivots.legR = mkLeg(1);
  pivots.legL = mkLeg(-1);

  // Armor pieces per slot (each slot wears its own set's palette).
  for (const slot of ARMOR_SLOTS) {
    const setId = equipment.armor[slot] || 'drifter';
    const set = ARMOR_SETS[setId] || ARMOR_SETS.drifter;
    ARMOR_BUILDERS[slot](pivots, setId, set.palette);
  }

  // Cape (sets that have one): hanging chain of plates, swayed in update.
  if (pal.cape !== null && pal.cape !== undefined) {
    const capeMat = new THREE.MeshStandardMaterial({
      color: pal.cape, roughness: 0.8, side: THREE.DoubleSide,
      emissive: pal.glow, emissiveIntensity: 0.12,
    });
    let parent = torso;
    let py = 0.3, pz = 0.16;
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Group();
      seg.position.set(0, py, pz);
      parent.add(seg);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.4 - i * 0.04, 0.26, 0.02), capeMat);
      plate.position.y = -0.12;
      seg.add(plate);
      capeSegs.push(seg);
      parent = seg;
      py = -0.24; pz = 0.005;
    }
  }

  // Weapon + offhand
  const wDef = WEAPONS[equipment.weapon.id] || WEAPONS.sword;
  weaponMesh = wDef.build(equipment.weapon.tier);
  weaponMesh.rotation.x = 0.5; // rest angle; swings read through the arm
  R.hand.add(weaponMesh);
  weaponTipLocal = weaponMesh.userData.tip || new THREE.Vector3(0, 1.6, 0);
  hero.trailColor = wDef.color;
  if (wDef.buildOffhand) {
    offhandMesh = wDef.buildOffhand(equipment.weapon.tier);
    offhandMesh.rotation.x = 0.5;
    L.hand.add(offhandMesh);
  }

  // Idle glow (magic readiness) — brighter during Armiger.
  glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texFlare('120,200,255'), transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glowSprite.scale.set(2.4, 2.4, 1);
  glowSprite.position.y = 0.2;
  body.add(glowSprite);

  buildArmigerRing(equipment);

  if (prevPos) {
    group.position.copy(prevPos);
    group.quaternion.copy(prevQuat);
  }
  scene.add(group);
  hero.stopClip();
  applyPose(IDLE, 1); // snap to idle
  return group;
}

// Ghost copies of every OWNED weapon class orbiting the hero.
function buildArmigerRing(equipment) {
  const ghostMat = new THREE.MeshBasicMaterial({
    color: 0x9fdcff, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  armigerRing = new THREE.Group();
  armigerRing.visible = false;
  armigerRing.userData = { intensity: 1, pulse: 0 };
  const owned = equipment.owned || ['sword'];
  owned.forEach((id) => {
    const def = WEAPONS[id];
    if (!def) return;
    const tier = Math.max(1, equipment.weaponTiers ? equipment.weaponTiers[id] || 1 : 1);
    const ghost = def.build(tier);
    ghost.traverse((o) => { if (o.material) o.material = ghostMat; });
    ghost.scale.setScalar(0.85);
    armigerRing.add(ghost);
  });
  armigerRing.rotation.x = 0.35;
  body.add(armigerRing);
}

// --- Pose evaluation -------------------------------------------------------

const _eul = {};
function applyPose(pose, alpha) {
  for (const name of Object.keys(pivots)) {
    const target = pose[name] || IDLE[name] || [0, 0, 0];
    const piv = pivots[name];
    piv.rotation.x += (target[0] - piv.rotation.x) * alpha;
    piv.rotation.y += (target[1] - piv.rotation.y) * alpha;
    piv.rotation.z += (target[2] - piv.rotation.z) * alpha;
  }
}

function evalClip(clip, k, out) {
  const keys = clip.keys;
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (k >= keys[i].t && k <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
  }
  const span = Math.max(b.t - a.t, 1e-4);
  let f = clamp((k - a.t) / span, 0, 1);
  f = f * f * (3 - 2 * f); // smoothstep between keys
  const names = new Set([...Object.keys(a.p), ...Object.keys(b.p)]);
  for (const name of names) {
    const pa = a.p[name] || IDLE[name] || [0, 0, 0];
    const pb = b.p[name] || IDLE[name] || [0, 0, 0];
    out[name] = [
      pa[0] + (pb[0] - pa[0]) * f,
      pa[1] + (pb[1] - pa[1]) * f,
      pa[2] + (pb[2] - pa[2]) * f,
    ];
  }
}

const _tipPrev = new THREE.Vector3();
const _tipNow = new THREE.Vector3();
const _tipVel = new THREE.Vector3();

export function updateHero(dt, time) {
  if (!group) return;
  hero.pos.copy(group.position);

  // Clip playback
  let pose = IDLE;
  if (hero.clip) {
    hero.clipT += dt;
    const k = hero.clipT / hero.clipDur;
    if (k >= 1) {
      hero.stopClip();
    } else {
      _eulClear();
      evalClip(hero.clip, k, _eul);
      pose = _eul;
    }
  }
  // Fast-but-smooth approach; snappy enough for contact frames.
  applyPose(pose, 1 - Math.exp(-20 * dt));

  // Idle float: bob + slight sway.
  hero._bob += dt;
  body.position.y = Math.sin(hero._bob * 2.1) * 0.12;
  let roll = 0;
  // Dodge: one fast barrel roll around the facing axis. Ends at a full turn,
  // which renders identically to zero — no snap on completion.
  if (hero._dodgeSpin > 0) {
    hero._dodgeSpin = Math.max(0, hero._dodgeSpin - dt / 0.34);
    const k = 1 - hero._dodgeSpin;
    roll = hero._dodgeDir * (1 - Math.pow(1 - k, 3)) * TAU;
    body.rotation.x = Math.sin(k * Math.PI) * 0.35;
  } else {
    body.rotation.x = damp(body.rotation.x, 0, 12, dt);
  }
  body.rotation.z = hero._bank + Math.sin(hero._bob * 1.3) * 0.02 + roll;

  // Warp stretch
  const ws = hero._warpStretch;
  body.scale.set(1 - ws * 0.25, 1 - ws * 0.2, 1 + ws * 0.9);

  // Cape sway
  for (let i = 0; i < capeSegs.length; i++) {
    const seg = capeSegs[i];
    seg.rotation.x = 0.24 + Math.sin(hero._bob * 1.7 + i * 0.9) * 0.1 + ws * 0.8 + i * 0.05;
  }

  // Armiger ring orbit
  if (armigerRing && armigerRing.visible) {
    const u = armigerRing.userData;
    if (u.pulse > 0) {
      u.pulse -= dt;
      if (u.pulse <= 0 && u.intensity < 1) armigerRing.visible = false;
    }
    const n = armigerRing.children.length || 1;
    armigerRing.rotation.y += dt * 1.7;
    armigerRing.children.forEach((ghost, i) => {
      const a = (i / n) * TAU;
      ghost.position.set(Math.cos(a) * 1.45, Math.sin(time * 2 + i) * 0.22, Math.sin(a) * 1.45);
      ghost.rotation.z = a;
      ghost.rotation.x = Math.sin(time * 1.4 + i) * 0.3;
    });
  }

  // Blade trail during active frames
  if (hero.trailOn && weaponMesh) {
    weaponMesh.localToWorld(_tipNow.copy(weaponTipLocal));
    _tipVel.copy(_tipNow).sub(_tipPrev).divideScalar(Math.max(dt, 1e-3));
    trailDab(_tipNow, hero.trailColor, _tipVel);
    _tipPrev.copy(_tipNow);
  } else if (weaponMesh) {
    weaponMesh.localToWorld(_tipPrev.copy(weaponTipLocal));
  }
}

function _eulClear() {
  for (const k of Object.keys(_eul)) delete _eul[k];
}

// Combo clip names per weapon class.
export function comboClip(weaponId, step) {
  if (weaponId === 'sword') return ['sword_1', 'sword_2', 'sword_3'][step % 3];
  if (weaponId === 'spear') return ['spear_1', 'spear_2', 'spear_3'][step % 3];
  if (weaponId === 'greatsword') return ['gs_1', 'gs_2'][step % 2];
  return ['dagger_1', 'dagger_2', 'dagger_3', 'dagger_4'][step % 4];
}
