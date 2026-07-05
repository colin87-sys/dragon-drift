// BAHAMUT — The Apocalypse Choir.
// The final trial: an armored dragon-god hanging in the void on six blade
// wings. Blade fans, sawing beams, crossing arcs, blink strikes — and
// MEGAFLARE, which burns everything except the gaps you were told to find.

import * as THREE from 'three';
import { bMat, bPart } from '../bossParts.js';
import { shell } from '../shell.js';
import { TAU } from '../util.js';

const ACCENT = 0x7fd4ff;
const HEAVY = 0xff5ab8;

function build(scene) {
  const root = new THREE.Group();
  root.scale.setScalar(1.5);
  const nodes = {};

  const armorMat = bMat(0x1e2438, { rough: 0.4, metal: 0.7, emissive: 0x0a1020, glow: 0.5 });
  const armorTrim = bMat(0x4a5878, { rough: 0.35, metal: 0.8 });
  const bladeMat = bMat(0x2a3450, { rough: 0.3, metal: 0.85, emissive: 0x3a78c8, glow: 0.7 });
  const coreMat = bMat(0x200a2e, { emissive: 0xff5ab8, glow: 2.8 });
  const glowMat = bMat(0x102030, { emissive: 0x7fd4ff, glow: 2.2 });
  const eyeMat = bMat(0x200a10, { emissive: 0xff3d7a, glow: 3.4 });

  // Body hangs high in the void.
  const body = new THREE.Group();
  body.position.y = 13.5;
  root.add(body);
  bPart(body, new THREE.CapsuleGeometry(2.8, 4.5, 6, 10), armorMat, { sy: 1.05 });
  bPart(body, new THREE.SphereGeometry(2.6, 10, 8), armorTrim, { y: 2.2, sy: 0.7 });
  // Skirt of armor plates
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    bPart(body, new THREE.ConeGeometry(0.9, 3.4, 4), armorMat,
      { x: Math.sin(a) * 1.9, y: -3.6, z: Math.cos(a) * 1.9, rx: Math.PI, ry: a });
  }
  nodes.body = body;

  const skirtHem = new THREE.Group();
  skirtHem.position.set(0, -4.4, 0);
  body.add(skirtHem);
  nodes.skirtHem = skirtHem;

  // Chest core — the godheart, always exposed: the final boss is honest.
  const core = new THREE.Group();
  core.position.set(0, 0.9, 2.5);
  body.add(core);
  bPart(core, new THREE.OctahedronGeometry(1.0, 1), coreMat, {});
  bPart(core, new THREE.TorusGeometry(1.45, 0.16, 6, 12), armorTrim, {});
  nodes.core = core;

  // Helmed draconic head.
  const head = new THREE.Group();
  head.position.y = 4.6;
  body.add(head);
  bPart(head, new THREE.SphereGeometry(1.5, 10, 8), armorMat, { sz: 1.25 });
  bPart(head, new THREE.ConeGeometry(0.85, 2.4, 6), armorTrim, { z: 1.8, rx: Math.PI / 2, sy: 0.6 });
  for (const s of [-1, 1]) {
    bPart(head, new THREE.SphereGeometry(0.24, 6, 5), eyeMat, { x: s * 0.6, y: 0.25, z: 1.1 });
    bPart(head, new THREE.ConeGeometry(0.3, 3.2, 4), armorTrim, { x: s * 1.2, y: 1.4, z: -0.8, rx: -1.1, rz: -s * 0.35 });
    bPart(head, new THREE.ConeGeometry(0.2, 2.0, 4), bladeMat, { x: s * 1.7, y: 0.8, z: -0.9, rx: -1.3, rz: -s * 0.7 });
  }
  nodes.head = head;

  // Six blade wings in a fan — the silhouette.
  const wingRoot = new THREE.Group();
  wingRoot.position.set(0, 2.2, -1.6);
  body.add(wingRoot);
  const wings = [];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? 1 : -1;
    const rank = i % 3;
    const w = new THREE.Group();
    w.rotation.z = side * (0.5 + rank * 0.42);
    wingRoot.add(w);
    bPart(w, new THREE.BoxGeometry(0.5, 9.5 + rank * 1.4, 0.16), bladeMat, { y: 5.2 + rank * 0.7, rz: side * 0.06 });
    bPart(w, new THREE.BoxGeometry(0.2, 8.6 + rank * 1.4, 0.2), glowMat, { y: 5.2 + rank * 0.7 });
    wings.push(w);
    if (rank === 1) nodes[side > 0 ? 'wingR' : 'wingL'] = w;
  }
  nodes.wings = wingRoot;

  // Fists for blink strikes.
  for (const s of [-1, 1]) {
    const fist = new THREE.Group();
    fist.position.set(s * 3.4, 0.4, 0.8);
    body.add(fist);
    bPart(fist, new THREE.SphereGeometry(0.95, 8, 6), armorTrim, {});
    bPart(fist, new THREE.ConeGeometry(0.3, 1.3, 4), bladeMat, { y: -1.0, rx: Math.PI });
    nodes[s > 0 ? 'fistR' : 'fistL'] = fist;
  }

  scene.add(root);

  const _to = new THREE.Vector3();
  let blinkScale = 1;

  function animate(dt, time, st) {
    const sink = st.dying * 8;
    body.position.y = 13.5 - sink + Math.sin(time * 1.1) * 0.9;

    if (st.heroPos) {
      const target = Math.atan2(st.heroPos.x, st.heroPos.z);
      let d = target - root.rotation.y;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      root.rotation.y += d * Math.min(1, dt * (st.staggered ? 0.1 : 1.6));
    }

    // Wing fan: breathes wide on casts, folds when staggered.
    let fan = 1 + Math.sin(time * 1.3) * 0.06;
    if (st.anim === 'megaflare') fan = 1.55;
    if (st.anim === 'fan' || st.anim === 'beam') fan = 1.25;
    if (st.staggered) fan = 0.45;
    wings.forEach((w, i) => {
      const side = i < 3 ? 1 : -1;
      const rank = i % 3;
      const target = side * (0.5 + rank * 0.42) * fan;
      w.rotation.z += (target - w.rotation.z) * Math.min(1, dt * 5);
    });

    core.rotation.y += dt * 2.4;

    // Blink: collapse to a point, reappear — handled as a scale pulse.
    const wantBlink = st.anim === 'blink' && st.animT < 0.55;
    blinkScale += ((wantBlink ? 0.02 : 1) - blinkScale) * Math.min(1, dt * 12);
    root.scale.setScalar(Math.max(blinkScale, 0.02));

    if (st.staggered) {
      body.rotation.x += (0.6 - body.rotation.x) * Math.min(1, dt * 2);
    } else {
      body.rotation.x += ((st.anim === 'megaflare' ? -0.35 : 0) - body.rotation.x) * Math.min(1, dt * 2);
    }
    if (st.dying) root.rotation.z += dt * 0.15;

    if (st.heroPos && !st.staggered) {
      _to.copy(st.heroPos);
      const q0 = head.quaternion.clone();
      head.lookAt(_to);
      head.quaternion.slerp(q0, Math.max(0, 1 - dt * 3));
    }
  }

  function reset() {
    root.rotation.set(0, 0, 0);
    root.scale.setScalar(1);
    blinkScale = 1;
    body.rotation.set(0, 0, 0);
  }

  return { root, nodes, animate, reset };
}

export const BAHAMUT = {
  id: 'bahamut',
  name: 'BAHAMUT',
  title: 'The Apocalypse Choir',
  arena: 'void',
  theme: 'bahamut',
  accentColor: ACCENT,
  heavyColor: HEAVY,
  hp: 9000,
  shell: { radius: 11, hMin: 4, hMax: 27, aimNode: 'head' },
  phaseThresholds: [0.65, 0.3],
  stagger: { threshold: 560, duration: 8, decayDelay: 4, decayRate: 8, dmgMult: 1.6 },
  build,

  hurtZones: [
    { node: 'head', r: 3.9 },
    { node: 'body', r: 6.9 },
    { node: 'skirtHem', r: 5.4 },
    { node: 'wingR', r: 3.9 },
    { node: 'wingL', r: 3.9 },
    { node: 'fistR', r: 3.0 },
    { node: 'fistL', r: 3.0 },
  ],
  weakPoints: [
    { id: 'core', node: 'core', r: 2.7, always: true, dmgMult: 1.5, staggerGain: 24 },
    { id: 'wingR', node: 'wingR', r: 3.3, dur: 4, dmgMult: 1.8, staggerGain: 34 },
    { id: 'head', node: 'head', r: 3.0, always: true, phaseMin: 3, dmgMult: 2.0, staggerGain: 34 },
  ],

  phases: [
    { cooldown: [2.1, 3.0], attacks: ['bladeFan', 'beamSweep', 'crossArcs'] },
    { cooldown: [1.7, 2.4], attacks: ['bladeFan', 'beamSweep', 'crossArcs', 'blinkStrike'] },
    {
      cooldown: [1.3, 2.0],
      attacks: ['bladeStorm', 'beamSweep', 'crossArcs', 'blinkStrike', 'megaflare'],
    },
  ],
  traversal: { atPhase: 3, beacons: 4, spreadTheta: 3.4, timeout: 8 },

  attacks: {
    bladeFan: {
      weight: 3, anim: 'fan', exposes: 'wingR', recovery: 0.9,
      vols: (ctx) => {
        const from = ctx.node('wings');
        return [0, 1, 2, 3, 4].map((i) => ({
          kind: 'projectile', followHero: true, lead: i % 2 ? 0.7 : 0, thetaOffset: (i - 2) * 0.26,
          delay: 0.45 + i * 0.07, warn: 0, active: 99,
          dmg: 9, knockback: 7, radius: 1.05, speed: 31,
          from: from.clone(), color: ACCENT,
          warnSfx: i === 0 ? 'warnLight' : undefined,
        }));
      },
    },
    bladeStorm: {
      weight: 3, anim: 'fan', recovery: 1.0,
      vols: (ctx) => {
        const from = ctx.node('wings');
        return [0, 1, 2, 3, 4, 5, 6].map((i) => ({
          kind: 'projectile', followHero: true, lead: i % 2 ? 0.7 : 0,
          thetaOffset: (i - 3) * 0.24, hOffset: (i % 2) * 5 - 2.5,
          delay: 0.4 + i * 0.09, warn: 0, active: 99,
          dmg: 10, knockback: 7, radius: 1.05, speed: 33,
          from: from.clone(), color: ACCENT,
          warnSfx: i === 0 ? 'warnLight' : undefined,
        }));
      },
    },
    beamSweep: {
      weight: 2, anim: 'beam', recovery: 1.2,
      vols: (ctx) => {
        const dir = ctx.rng() < 0.5 ? 1 : -1;
        const start = ctx.heroTheta - dir * Math.PI * 0.6;
        const end = ctx.heroTheta + dir * Math.PI * 0.6;
        const h = ctx.heroH;
        return [{
          kind: 'beam', warn: 0.9, active: 1.1, dmg: 18, knockback: 11,
          radius: 1.8, color: HEAVY, warnSfx: 'warnHeavy', weight: 'heavy',
          getFrom: (out) => out.copy(ctx.node('core')),
          getTo: (out, k) => shell.worldPos(start + (end - start) * k, h, shell.radius + 4, out),
        }];
      },
    },
    crossArcs: {
      weight: 2, anim: 'fan', recovery: 1.0,
      vols: (ctx) => [
        {
          kind: 'arc', followHero: true, thetaSpan: Math.PI * 0.85,
          hBand: [ctx.heroH - 8, ctx.heroH + 2.5],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.0, active: 0.35, dmg: 15, knockback: 10,
          color: ACCENT, warnSfx: 'warnLight',
        },
        {
          kind: 'arc', followHero: true, delay: 0.55, thetaOffset: Math.PI * 0.5, thetaSpan: Math.PI * 0.85,
          hBand: [ctx.heroH - 2.5, ctx.heroH + 8],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.0, active: 0.35, dmg: 15, knockback: 10,
          color: ACCENT,
        },
      ],
    },
    blinkStrike: {
      weight: 2, anim: 'blink', exposes: 'wingR', recovery: 1.3,
      vols: () => [{
        kind: 'point', followHero: true, lead: 0.7, delay: 0.4, warn: 0.75, active: 0.22,
        dmg: 20, knockback: 15, weight: 'heavy', radius: 4.2,
        color: HEAVY, warnSfx: 'warnHeavy',
      }],
    },
    megaflare: {
      weight: 1, anim: 'megaflare', spectacle: true, recovery: 2.8,
      banner: 'MEGAFLARE — FIND THE GAP',
      fx: 'megaflare',
      vols: (ctx) => {
        // Everything burns except two opposite slivers.
        const gap = ctx.rng() * TAU;
        const span = Math.PI - 0.75;
        return [0, 1].map((i) => ({
          kind: 'zone', thetaCenter: gap + Math.PI / 2 + i * Math.PI, thetaSpan: span,
          hBand: [shell.hMin - 2, shell.hMax + 3],
          rBand: [0, shell.radius + 9],
          warn: 3.0, active: 1.1, dmg: 36, knockback: 20, weight: 'spectacle',
          color: 0xff8ad0,
        }));
      },
    },
  },

  cine: {
    phaseBanners: ['THE CHOIR ASSEMBLES', 'APOCALYPSE'],
    finisher: { nodes: ['wingL', 'fistR', 'core', 'head'], color: ACCENT },
  },
};
