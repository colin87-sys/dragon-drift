// RAMUH — Sentence of the Sky.
// A robed elder god adrift above the cloud floor, staff crowned with a storm
// core. Lightning columns stalk the hero, chain orbs drift and deny space,
// and the staff beam saws across the shell. Judgment spares only the low road.

import * as THREE from 'three';
import { bMat, bPart, fin } from '../bossParts.js';
import { shell } from '../shell.js';
import { TAU } from '../util.js';

const ACCENT = 0xb48aff;
const HEAVY = 0xffe066;

function build(scene) {
  const root = new THREE.Group();
  root.scale.setScalar(1.3);
  const nodes = {};

  const robeMat = bMat(0x2e2a4e, { rough: 0.7, emissive: 0x14102e, glow: 0.5 });
  const robeTrim = bMat(0x4a4380, { rough: 0.5, emissive: 0x6a5acc, glow: 0.7 });
  const skinMat = bMat(0x8a7c9c, { rough: 0.6 });
  const beardMat = bMat(0xd8d2e8, { rough: 0.8 });
  const boltMat = bMat(0x1c1430, { emissive: 0xffe680, glow: 2.6 });
  const eyeMat = bMat(0x201005, { emissive: 0xffe680, glow: 3.2 });

  // Floating body: a great robe tapering into stormcloud wisps.
  const body = new THREE.Group();
  body.position.y = 13;
  root.add(body);
  bPart(body, new THREE.ConeGeometry(5.4, 13, 9), robeMat, { y: -2.5, rx: Math.PI });
  bPart(body, new THREE.ConeGeometry(4.2, 4, 9), robeTrim, { y: -7.5, rx: Math.PI, sy: 0.6 });
  bPart(body, new THREE.SphereGeometry(3.3, 10, 8), robeMat, { y: 3.4, sy: 1.1 });
  for (const s of [-1, 1]) {
    bPart(body, new THREE.SphereGeometry(1.5, 8, 6), robeTrim, { x: s * 3.4, y: 5.2 });
  }
  nodes.body = body;

  // Head: long beard, heavy brow, antler crown.
  const head = new THREE.Group();
  head.position.y = 7.6;
  body.add(head);
  bPart(head, new THREE.SphereGeometry(1.5, 10, 8), skinMat, { sy: 1.1 });
  bPart(head, new THREE.ConeGeometry(1.0, 4.4, 7), beardMat, { y: -2.6, sz: 0.7 });
  bPart(head, new THREE.ConeGeometry(0.5, 1.6, 5), beardMat, { y: 0.9, z: -0.5, rx: -0.5 });
  for (const s of [-1, 1]) {
    bPart(head, new THREE.SphereGeometry(0.22, 6, 5), eyeMat, { x: s * 0.55, y: 0.25, z: 1.2 });
    bPart(head, new THREE.ConeGeometry(0.22, 2.4, 4), boltMat, { x: s * 1.1, y: 1.7, rz: -s * 0.7 });
    bPart(head, new THREE.ConeGeometry(0.16, 1.5, 4), boltMat, { x: s * 1.6, y: 1.2, rz: -s * 1.2 });
  }
  nodes.head = head;

  // Staff arm (right): held out, crowned with the storm orb.
  const armR = new THREE.Group();
  armR.position.set(4.4, 4.6, 1.2);
  body.add(armR);
  bPart(armR, new THREE.CylinderGeometry(0.55, 0.7, 4.5, 7), robeMat, { y: -2, rz: 0.5 });
  const staff = new THREE.Group();
  staff.position.set(1.6, -3.6, 0.6);
  armR.add(staff);
  bPart(staff, new THREE.CylinderGeometry(0.18, 0.22, 11, 7), robeTrim, { y: 2 });
  const orb = new THREE.Group();
  orb.position.set(0, 8.2, 0);
  staff.add(orb);
  bPart(orb, new THREE.OctahedronGeometry(1.1, 1), boltMat, {});
  bPart(orb, new THREE.TorusGeometry(1.6, 0.14, 6, 12), robeTrim, { rx: 0.6 });
  nodes.orb = orb;
  nodes.staff = staff;

  // Left hand: open palm for chain orbs; chest sigil weak point from p2.
  const handL = new THREE.Group();
  handL.position.set(-4.6, 3.4, 1.6);
  body.add(handL);
  bPart(handL, new THREE.SphereGeometry(0.9, 8, 6), skinMat, {});
  nodes.handL = handL;

  const robeHem = new THREE.Group();
  robeHem.position.set(0, -6.5, 0);
  body.add(robeHem);
  nodes.robeHem = robeHem;

  const sigil = new THREE.Group();
  sigil.position.set(0, 3.4, 3.2);
  body.add(sigil);
  bPart(sigil, new THREE.OctahedronGeometry(0.85), bMat(0x241c40, { emissive: 0xb48aff, glow: 2.4 }), {});
  nodes.sigil = sigil;

  scene.add(root);

  const _to = new THREE.Vector3();

  function animate(dt, time, st) {
    // Serene drift; judgment needs no hurry.
    const sink = st.dying * 10;
    body.position.y = 13 - sink + Math.sin(time * 0.9) * 0.8;
    body.rotation.z = Math.sin(time * 0.6) * 0.04;

    if (st.heroPos) {
      const target = Math.atan2(st.heroPos.x, st.heroPos.z);
      let d = target - root.rotation.y;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      root.rotation.y += d * Math.min(1, dt * (st.staggered ? 0.1 : 1.1));
    }

    // Staff raised for casts; orb spins always.
    orb.rotation.y += dt * 2;
    orb.rotation.x = Math.sin(time * 1.4) * 0.4;
    let staffPitch = 0;
    if (st.anim === 'callBolts' || st.anim === 'judgment') staffPitch = -1.0;
    if (st.anim === 'beam') staffPitch = -0.45;
    armR.rotation.x += (staffPitch - armR.rotation.x) * Math.min(1, dt * 4);

    if (st.anim === 'orbs') {
      handL.position.z = 1.6 + Math.sin(Math.min(st.animT * 2, Math.PI)) * 1.4;
    }

    if (st.staggered) {
      body.rotation.x += (0.55 - body.rotation.x) * Math.min(1, dt * 2);
      head.rotation.x = 0.5;
    } else {
      body.rotation.x += (0 - body.rotation.x) * Math.min(1, dt * 2);
      head.rotation.x += (0 - head.rotation.x) * Math.min(1, dt * 2);
    }
    if (st.dying) {
      root.rotation.y += dt * 0.4;
      body.rotation.x += (0.8 - body.rotation.x) * Math.min(1, dt);
    }

    if (st.heroPos && !st.staggered) {
      _to.copy(st.heroPos);
      const q0 = head.quaternion.clone();
      head.lookAt(_to);
      head.quaternion.slerp(q0, Math.max(0, 1 - dt * 2.4));
    }
  }

  function reset() {
    root.rotation.set(0, 0, 0);
    body.position.y = 13;
    body.rotation.set(0, 0, 0);
  }

  return { root, nodes, animate, reset };
}

export const RAMUH = {
  id: 'ramuh',
  name: 'RAMUH',
  title: 'Sentence of the Sky',
  arena: 'sanctum',
  theme: 'ramuh',
  accentColor: ACCENT,
  heavyColor: HEAVY,
  hp: 7400,
  shell: { radius: 12, hMin: 4, hMax: 26, aimNode: 'head' },
  phaseThresholds: [0.65, 0.3],
  stagger: { threshold: 520, duration: 8, decayDelay: 4, decayRate: 7, dmgMult: 1.6 },
  build,

  hurtZones: [
    { node: 'head', r: 3.6 },
    { node: 'body', r: 6.6 },
    { node: 'robeHem', r: 7.2 },
    { node: 'handL', r: 2.9 },
    { node: 'orb', r: 3.1 },
  ],
  weakPoints: [
    { id: 'orb', node: 'orb', r: 2.6, always: true, dmgMult: 1.5, staggerGain: 26 },
    { id: 'sigil', node: 'sigil', r: 2.3, always: true, phaseMin: 2, dmgMult: 1.8, staggerGain: 34 },
    { id: 'head', node: 'head', r: 2.6, dur: 4, dmgMult: 2.0, staggerGain: 40 },
  ],

  phases: [
    { cooldown: [2.2, 3.1], attacks: ['boltStrikes', 'chainOrbs', 'staffSweep'] },
    { cooldown: [1.7, 2.5], attacks: ['boltStrikes', 'chainOrbs', 'staffSweep', 'boltRing'] },
    {
      cooldown: [1.4, 2.1],
      attacks: ['boltBarrage', 'chainOrbs', 'staffSweep', 'boltRing', 'judgmentBolt'],
      shell: { radius: 11 }, // the storm closes in
    },
  ],
  traversal: null,

  attacks: {
    // Lightning stalks your footsteps — three columns, each locked late.
    boltStrikes: {
      weight: 3, anim: 'callBolts', exposes: 'head', recovery: 0.8,
      vols: () => [0, 1, 2].map((i) => ({
        kind: 'point', followHero: true, column: true, lead: i === 2 ? 0.75 : 0, delay: i * 0.55,
        warn: 0.8, active: 0.25, dmg: 12, knockback: 8, radius: 2.6,
        color: HEAVY, warnSfx: 'warnLight',
        onActive: null, // thunder handled by arena flash listener
      })),
    },
    boltBarrage: {
      weight: 3, anim: 'callBolts', recovery: 0.9,
      vols: () => [0, 1, 2, 3, 4].map((i) => ({
        kind: 'point', followHero: true, column: true, lead: i % 2 ? 0.7 : 0,
        thetaOffset: (i % 2 === 0 ? 0 : (i - 2) * 0.22), delay: i * 0.4,
        warn: 0.75, active: 0.25, dmg: 13, knockback: 8, radius: 2.6,
        color: HEAVY, warnSfx: i === 0 ? 'warnLight' : undefined,
      })),
    },
    // Slow drifting orbs — space denial you weave through.
    chainOrbs: {
      weight: 2, anim: 'orbs', recovery: 1.0,
      vols: (ctx) => {
        const hand = ctx.node('handL');
        return [0, 1, 2].map((i) => ({
          kind: 'projectile', followHero: true, thetaOffset: (i - 1) * 0.45,
          delay: 0.5 + i * 0.25, warn: 0, active: 99,
          dmg: 10, knockback: 7, radius: 1.6, speed: 13,
          from: hand.clone(), color: ACCENT,
          warnSfx: i === 0 ? 'warnLight' : undefined,
        }));
      },
    },
    // The orb saws a beam across the shell at your height — change floors.
    staffSweep: {
      weight: 2, anim: 'beam', recovery: 1.2,
      vols: (ctx) => {
        const startTheta = ctx.heroTheta - Math.PI * 0.55;
        const endTheta = ctx.heroTheta + Math.PI * 0.55;
        const h = ctx.heroH;
        return [{
          kind: 'beam', warn: 1.0, active: 1.3, dmg: 16, knockback: 10,
          radius: 1.7, color: HEAVY, warnSfx: 'warnHeavy', weight: 'heavy',
          getFrom: (out) => out.copy(ctx.node('orb')),
          getTo: (out, k) => shell.worldPos(startTheta + (endTheta - startTheta) * k, h, shell.radius + 4, out),
        }];
      },
    },
    // Static thirds light up in sequence — read the order, take the dark one.
    boltRing: {
      weight: 2, anim: 'callBolts', recovery: 1.0,
      vols: (ctx) => {
        const base = ctx.rng() * TAU;
        return [0, 1, 2].map((i) => ({
          kind: 'arc', thetaCenter: base + i * (TAU / 3), thetaSpan: TAU / 3 - 0.25,
          hBand: [shell.hMin - 1, shell.hMax + 1],
          rBand: [shell.radius - 7, shell.radius + 7],
          delay: i * 0.5, warn: 1.0, active: 0.3, dmg: 15, knockback: 9,
          color: ACCENT, warnSfx: i === 0 ? 'warnLight' : undefined,
        }));
      },
    },
    judgmentBolt: {
      weight: 1, anim: 'judgment', spectacle: true, recovery: 2.6,
      banner: 'JUDGMENT BOLT — DIVE LOW',
      fx: 'judgment',
      vols: () => [{
        kind: 'zone', thetaCenter: 0, thetaSpan: TAU,
        hBand: [shell.hMin + 4.5, shell.hMax + 3],
        rBand: [0, shell.radius + 9],
        warn: 2.7, active: 1.0, dmg: 34, knockback: 18, weight: 'spectacle',
        color: 0xfff0a8,
      }],
    },
  },

  cine: {
    phaseBanners: ['THE VERDICT FORMS', 'THE SKY PASSES SENTENCE'],
    finisher: { nodes: ['handL', 'orb', 'sigil', 'head'], color: ACCENT },
  },
};
