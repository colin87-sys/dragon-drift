// TITAN — The Weight of the World.
// A mountain that grew arms: half-buried in the canyon floor, hammering the
// shell with slams whose shockwaves must be jumped, hurling boulders, and
// finally bringing the whole cliffside down.

import * as THREE from 'three';
import { bMat, bPart, spikeRing } from '../bossParts.js';
import { shell } from '../shell.js';
import { TAU } from '../util.js';

const ACCENT = 0xffb066;
const HEAVY = 0xff6a3d;

function build(scene) {
  const root = new THREE.Group();
  root.scale.setScalar(1.4);
  const nodes = {};

  const rockMat = bMat(0x4d4138, { rough: 0.85, emissive: 0x1c0f08, glow: 0.25 });
  const rockDark = bMat(0x332a24, { rough: 0.9 });
  const magmaMat = bMat(0x361408, { emissive: 0xff5a20, glow: 1.5 });
  const eyeMat = bMat(0x201005, { emissive: 0xffc860, glow: 3.0 });

  // Buried hips / base scree
  bPart(root, new THREE.ConeGeometry(11, 8, 9), rockDark, { y: 1.5, sy: 0.6 });

  // Torso — a cliff with a molten heart.
  const torso = new THREE.Group();
  torso.position.y = 7;
  root.add(torso);
  bPart(torso, new THREE.CylinderGeometry(4.6, 7.2, 9, 9), rockMat, { y: 1 });
  bPart(torso, new THREE.SphereGeometry(4.4, 10, 8), rockMat, { y: 6, sy: 0.85 });
  spikeRing(torso, { count: 7, radius: 4.2, size: 1.1, len: 3.2, y: 7.5, tilt: 1.0, mat: rockDark });
  nodes.torso = torso;

  // Molten core — the always-on weak point, framed by cracked plates.
  const core = new THREE.Group();
  core.position.set(0, 5.2, 5.1);
  torso.add(core);
  bPart(core, new THREE.OctahedronGeometry(1.3), magmaMat, {});
  bPart(core, new THREE.TorusGeometry(1.7, 0.3, 6, 9), rockDark, {});
  nodes.core = core;

  // Head — horned crag.
  const head = new THREE.Group();
  head.position.y = 14.5;
  root.add(head);
  bPart(head, new THREE.SphereGeometry(2.2, 9, 7), rockMat, { sy: 0.9 });
  bPart(head, new THREE.ConeGeometry(1.2, 2.2, 5), rockDark, { y: -0.8, z: 1.4, rx: 1.2 });
  for (const s of [-1, 1]) {
    bPart(head, new THREE.ConeGeometry(0.6, 3.4, 5), rockDark, { x: s * 1.9, y: 1.2, rz: -s * 1.0 });
    bPart(head, new THREE.SphereGeometry(0.34, 7, 5), eyeMat, { x: s * 0.85, y: 0.25, z: 1.7 });
  }
  nodes.head = head;

  // Arms — shoulder boulders, forearm pillars, slab fists.
  const mkArm = (sx) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 6.4, 12.5, 0);
    root.add(shoulder);
    bPart(shoulder, new THREE.SphereGeometry(2.6, 9, 7), rockMat, {});
    spikeRing(shoulder, { count: 5, radius: 2.0, size: 0.7, len: 1.8, y: 1.2, tilt: 0.9, mat: rockDark });
    const arm = new THREE.Group();
    shoulder.add(arm);
    bPart(arm, new THREE.CylinderGeometry(1.5, 1.9, 7.5, 8), rockMat, { y: -4, rz: sx * 0.12 });
    const fist = new THREE.Group();
    fist.position.set(sx * 0.8, -8.2, 0);
    arm.add(fist);
    bPart(fist, new THREE.BoxGeometry(3.4, 3.0, 3.4), rockDark, {});
    bPart(fist, new THREE.BoxGeometry(2.4, 1.4, 2.4), magmaMat, { y: -0.4, sx: 1.05 });
    return { shoulder, arm, fist };
  };
  const armR = mkArm(1);
  const armL = mkArm(-1);
  nodes.shoulderR = armR.shoulder;
  nodes.shoulderL = armL.shoulder;
  nodes.fistR = armR.fist;
  nodes.fistL = armL.fist;

  scene.add(root);

  const _to = new THREE.Vector3();

  function animate(dt, time, st) {
    const sink = st.dying * 9;
    root.position.y += ((0 - sink) - root.position.y) * Math.min(1, dt * 2);

    // Breathing mountain.
    const breathe = Math.sin(time * 0.8) * 0.05;
    torso.scale.set(1 + breathe * 0.4, 1 + breathe, 1 + breathe * 0.4);

    // Track the hero slowly (a mountain turns like one).
    if (st.heroPos) {
      const target = Math.atan2(st.heroPos.x, st.heroPos.z);
      let d = target - root.rotation.y;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      const speed = st.staggered ? 0.05 : 0.5;
      root.rotation.y += d * Math.min(1, dt * speed);
    }

    // Arm slams: wind up high, hammer down.
    const slamK = (anim, arm) => {
      if (st.anim !== anim) {
        arm.arm.rotation.x += (0 - arm.arm.rotation.x) * Math.min(1, dt * 3);
        return;
      }
      const k = st.animT;
      const wind = Math.min(k / 0.7, 1);
      const target = k < 0.7 ? -1.4 * wind : 1.1;
      arm.arm.rotation.x += (target - arm.arm.rotation.x) * Math.min(1, dt * (k < 0.7 ? 4 : 18));
    };
    slamK('slamR', armR);
    slamK('slamL', armL);
    if (st.anim === 'throw') {
      const k = Math.min(st.animT / 0.9, 1);
      armR.arm.rotation.x = -2.2 * Math.sin(k * Math.PI);
    }
    if (st.anim === 'wrath') {
      // Both arms raised, shaking the world.
      const k = Math.min(st.animT / 2.6, 1);
      armR.arm.rotation.x += (-2.6 * k - armR.arm.rotation.x) * Math.min(1, dt * 5);
      armL.arm.rotation.x += (-2.6 * k - armL.arm.rotation.x) * Math.min(1, dt * 5);
      root.position.y += Math.sin(time * 30) * 0.04 * k;
    }

    if (st.staggered) {
      torso.rotation.x += (0.5 - torso.rotation.x) * Math.min(1, dt * 2);
      head.position.y += (12.8 - head.position.y) * Math.min(1, dt * 2);
    } else {
      torso.rotation.x += (0 - torso.rotation.x) * Math.min(1, dt * 2);
      head.position.y += (14.5 - head.position.y) * Math.min(1, dt * 2);
    }
    if (st.dying) {
      root.rotation.z += (0.18 - root.rotation.z) * Math.min(1, dt);
    }
    // Head menace bob
    if (st.heroPos) {
      _to.copy(st.heroPos);
      _to.y = Math.max(_to.y, 10);
      const q0 = head.quaternion.clone();
      head.lookAt(_to);
      head.quaternion.slerp(q0, Math.max(0, 1 - dt * 2));
    }
  }

  function reset() {
    root.position.y = 0;
    root.rotation.set(0, 0, 0);
    torso.rotation.x = 0;
  }

  return { root, nodes, animate, reset };
}

export const TITAN = {
  id: 'titan',
  name: 'TITAN',
  title: 'The Weight of the World',
  arena: 'canyon',
  theme: 'titan',
  accentColor: ACCENT,
  heavyColor: HEAVY,
  hp: 6200,
  shell: { radius: 14, hMin: 2.5, hMax: 23, aimNode: 'head' },
  phaseThresholds: [0.65, 0.3],
  stagger: { threshold: 480, duration: 8, decayDelay: 4, decayRate: 7, dmgMult: 1.6 },
  build,

  hurtZones: [
    { node: 'head', r: 4.8 },
    { node: 'shoulderR', r: 4.5 },
    { node: 'shoulderL', r: 4.5 },
    { node: 'fistR', r: 3.6 },
    { node: 'fistL', r: 3.6 },
    { node: 'torso', r: 9.5 },
  ],
  weakPoints: [
    { id: 'core', node: 'core', r: 2.8, always: true, dmgMult: 1.6, staggerGain: 28 },
    { id: 'fistR', node: 'fistR', r: 3.1, dur: 4, dmgMult: 1.8, staggerGain: 36 },
    { id: 'head', node: 'head', r: 3.1, always: true, phaseMin: 3, dmgMult: 1.75, staggerGain: 30 },
  ],

  phases: [
    { cooldown: [2.4, 3.4], attacks: ['armSlam', 'boulderThrow', 'quakeRow'] },
    { cooldown: [1.9, 2.8], attacks: ['armSlam', 'boulderThrow', 'quakeRow', 'doubleSlam'] },
    {
      cooldown: [1.6, 2.4],
      attacks: ['armSlam', 'boulderVolley', 'doubleSlam', 'quakeRow', 'gaiasWrath'],
    },
  ],
  traversal: null,

  attacks: {
    // Fist hammers your spot; the impact ring then floods the floor band — jump it.
    armSlam: {
      weight: 3, anim: 'slamR', exposes: 'fistR', recovery: 1.4,
      vols: () => [
        {
          kind: 'point', followHero: true, lead: 0.8, warn: 0.85, active: 0.22,
          dmg: 16, knockback: 12, weight: 'heavy', radius: 4.0,
          color: HEAVY, warnSfx: 'warnHeavy',
        },
        {
          kind: 'zone', thetaCenter: 0, thetaSpan: TAU, delay: 1.0,
          hBand: [shell.hMin - 2, shell.hMin + 3.5],
          rBand: [0, shell.radius + 9],
          warn: 0.45, active: 0.35, dmg: 12, knockback: 9,
          color: ACCENT,
        },
      ],
    },
    doubleSlam: {
      weight: 2, anim: 'slamL', recovery: 1.5,
      vols: () => [
        {
          kind: 'point', followHero: true, warn: 0.8, active: 0.2,
          dmg: 15, knockback: 11, weight: 'heavy', radius: 3.8, color: HEAVY, warnSfx: 'warnHeavy',
        },
        {
          kind: 'point', followHero: true, lead: 0.75, delay: 0.65, warn: 0.8, active: 0.2,
          dmg: 17, knockback: 13, weight: 'heavy', radius: 3.8, color: HEAVY, warnSfx: 'warnHeavy',
        },
        {
          kind: 'zone', thetaCenter: 0, thetaSpan: TAU, delay: 1.6,
          hBand: [shell.hMin - 2, shell.hMin + 4],
          rBand: [0, shell.radius + 9],
          warn: 0.45, active: 0.4, dmg: 13, knockback: 10, color: ACCENT,
        },
      ],
    },
    boulderThrow: {
      weight: 3, anim: 'throw', recovery: 0.9,
      vols: (ctx) => {
        const fist = ctx.node('fistR');
        return [0, 1, 2].flatMap((i) => [
          {
            kind: 'point', followHero: true, lead: i % 2 ? 0.85 : 0, thetaOffset: (i - 1) * 0.3, delay: i * 0.22,
            warn: 0.95, active: 0.2, dmg: 0, radius: 2.6, color: ACCENT,
            warnSfx: i === 0 ? 'warnLight' : undefined,
          },
          {
            kind: 'projectile', followHero: true, lead: i % 2 ? 0.85 : 0, thetaOffset: (i - 1) * 0.3, delay: i * 0.22,
            warn: 0, active: 99, dmg: 14, radius: 1.9, speed: 26,
            from: fist.clone(), color: ACCENT, weight: 'heavy',
          },
        ]);
      },
    },
    boulderVolley: {
      weight: 2, anim: 'throw', recovery: 1.0,
      vols: (ctx) => {
        const fist = ctx.node('fistR');
        return [0, 1, 2, 3, 4].flatMap((i) => [
          {
            kind: 'point', followHero: true, lead: i % 2 ? 0.8 : 0, thetaOffset: (i - 2) * 0.34, hOffset: (i % 2) * 4 - 2,
            delay: i * 0.18, warn: 0.9, active: 0.2, dmg: 0, radius: 2.4, color: ACCENT,
            warnSfx: i === 0 ? 'warnLight' : undefined,
          },
          {
            kind: 'projectile', followHero: true, lead: i % 2 ? 0.8 : 0, thetaOffset: (i - 2) * 0.34, hOffset: (i % 2) * 4 - 2,
            delay: i * 0.18, warn: 0, active: 99, dmg: 15, radius: 1.8, speed: 28,
            from: fist.clone(), color: ACCENT, weight: 'heavy',
          },
        ]);
      },
    },
    // Strata wave: a low band then a mid band ripple around the whole arena.
    quakeRow: {
      weight: 2, anim: 'slamL', recovery: 1.0,
      vols: (ctx) => [
        {
          kind: 'arc', followHero: true, thetaSpan: Math.PI * 1.3,
          hBand: [ctx.heroH - 8, ctx.heroH + 2.5],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.1, active: 0.4, dmg: 14, knockback: 10, color: ACCENT, warnSfx: 'warnLight',
        },
        {
          kind: 'arc', followHero: true, delay: 0.7, thetaSpan: Math.PI * 1.3,
          hBand: [ctx.heroH - 2.5, ctx.heroH + 8],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.0, active: 0.4, dmg: 14, knockback: 10, color: ACCENT,
        },
      ],
    },
    gaiasWrath: {
      weight: 1, anim: 'wrath', spectacle: true, recovery: 2.6,
      banner: "GAIA'S WRATH — FIND THE CALM",
      fx: 'rockfall',
      vols: (ctx) => {
        // The sky falls everywhere except one slice of calm.
        const gap = ctx.rng() * TAU;
        return [{
          kind: 'zone', thetaCenter: gap + Math.PI, thetaSpan: TAU - 1.0,
          hBand: [shell.hMin - 2, shell.hMax + 2],
          rBand: [0, shell.radius + 9],
          warn: 2.8, active: 1.0, dmg: 32, knockback: 18, weight: 'spectacle',
          color: 0xffc878,
        }];
      },
    },
  },

  cine: {
    phaseBanners: ['THE MOUNTAIN WAKES', 'THE WORLD GROWS HEAVY'],
    finisher: { nodes: ['fistL', 'shoulderR', 'core', 'head'], color: ACCENT },
  },
};
