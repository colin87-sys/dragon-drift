// LEVIATHAN — Tide-Sovereign of the Maelstrom.
// A god-sized sea serpent wound around the arena's heart: lower coils breach
// the maelstrom, the neck climbs the spiral, and the crowned head hunts the
// hero around the shell. Phase 3 raises the sea itself.

import * as THREE from 'three';
import { bMat, bPart, segmentChain, fin } from '../bossParts.js';
import { shell } from '../shell.js';
import { TAU } from '../util.js';

const ACCENT = 0x46d4ff;
const HEAVY = 0xff7a4d;

function build(scene) {
  const root = new THREE.Group();
  const nodes = {};

  const scaleMat = bMat(0x14495e, { rough: 0.55, emissive: 0x06222e, glow: 0.4 });
  const bellyMat = bMat(0x8fd8cc, { rough: 0.5, emissive: 0x1d4a44, glow: 0.3 });
  const finMat = bMat(0x1d7a96, { rough: 0.4, emissive: 0x2bbde0, glow: 0.85 });
  const hornMat = bMat(0xd8e8e2, { rough: 0.35, metal: 0.2 });
  const eyeMat = bMat(0x301505, { emissive: 0xffb13d, glow: 3.2, rough: 0.3 });
  const mawMat = bMat(0x5e1d30, { emissive: 0xff4d6a, glow: 1.4 });

  // --- Lower coils: a helix breaching around the center -----------------
  const coilGroup = new THREE.Group();
  root.add(coilGroup);
  const helix = (t, out) => {
    const a = t * TAU * 1.55 + 0.6;
    const r = 14 - t * 2.5; // stays near the shell the whole climb
    return out.set(Math.sin(a) * r, -2.5 + t * 12.5, Math.cos(a) * r);
  };
  const coilSegs = segmentChain(coilGroup, {
    count: 16,
    path: helix,
    radius: (t) => 2.7 - t * 0.9,
    mat: scaleMat,
  });
  // Belly plates + dorsal fins along the coil
  coilSegs.forEach((seg, i) => {
    if (i % 2 === 0) {
      bPart(seg, new THREE.SphereGeometry(seg.userData.baseR * 0.82, 8, 6), bellyMat, { y: -seg.userData.baseR * 0.3, sz: 1.05 });
    }
    if (i % 2 === 1) {
      fin(seg, { len: 2.6, width: 1.0, mat: finMat, y: seg.userData.baseR * 0.9, rx: -0.25 });
    }
  });
  // Tail tip flourish
  const tail = new THREE.Group();
  helix(0, tail.position);
  tail.position.y -= 1;
  fin(tail, { len: 4.2, width: 2.0, mat: finMat, rx: 1.2 });
  coilGroup.add(tail);

  // Named coil nodes (hurt zones / weak heart)
  const coilNode = (name, t) => {
    const g = new THREE.Group();
    helix(t, g.position);
    coilGroup.add(g);
    nodes[name] = g;
  };
  coilNode('tail', 0.04);
  coilNode('coil1', 0.2);
  coilNode('coil2', 0.4);
  coilNode('coil3', 0.58);
  coilNode('coil4', 0.78);
  coilNode('coil5', 0.95);
  // The heart: an emissive scar on coil3, visible from phase 3.
  const heart = new THREE.Group();
  nodes.coil3.add(heart);
  heart.position.set(0, 0.6, 0);
  bPart(heart, new THREE.OctahedronGeometry(0.9), bMat(0x2a0a14, { emissive: 0xff3d5e, glow: 2.6 }), {});
  nodes.heart = heart;

  // --- Neck: rises from the helix top toward the crown ------------------
  const neckGroup = new THREE.Group();
  root.add(neckGroup);
  const neckPath = (t, out) => {
    const a = 0.6 + TAU * 1.55 + t * 1.5;
    const r = 11.5 - t * 5.5;
    return out.set(Math.sin(a) * r, 10 + t * 7.5, Math.cos(a) * r);
  };
  const neckSegs = segmentChain(neckGroup, {
    count: 7,
    path: neckPath,
    radius: (t) => 1.9 - t * 0.55,
    mat: scaleMat,
  });
  neckSegs.forEach((seg, i) => {
    if (i % 2 === 0) fin(seg, { len: 1.8, width: 0.7, mat: finMat, y: 1.2, rx: -0.3 });
  });
  const neckMid = new THREE.Group();
  neckPath(0.5, neckMid.position);
  neckGroup.add(neckMid);
  nodes.neck = neckMid;

  // --- Head ---------------------------------------------------------------
  const headBase = new THREE.Vector3();
  neckPath(1, headBase);
  const head = new THREE.Group();
  head.position.copy(headBase).add(new THREE.Vector3(0, 1.2, 0));
  root.add(head);
  nodes.head = head;

  bPart(head, new THREE.SphereGeometry(2.3, 12, 9), scaleMat, { sx: 1.05, sy: 0.92, sz: 1.25 });
  bPart(head, new THREE.ConeGeometry(1.35, 3.4, 8), scaleMat, { z: 2.8, rx: Math.PI / 2, sy: 0.8 });
  bPart(head, new THREE.ConeGeometry(1.1, 2.6, 7), bellyMat, { z: 2.5, y: -0.55, rx: Math.PI / 2, sy: 0.55 });
  for (const s of [-1, 1]) {
    bPart(head, new THREE.SphereGeometry(0.34, 8, 6), eyeMat, { x: s * 1.15, y: 0.55, z: 1.45 });
    bPart(head, new THREE.ConeGeometry(0.4, 2.6, 5), hornMat, { x: s * 1.5, y: 1.0, z: -1.2, rx: -0.9, rz: -s * 0.3 });
    fin(head, { len: 2.4, width: 1.0, mat: finMat, x: s * 2.0, y: -0.2, z: 0.4, rz: -s * 1.35 });
  }
  // Crown crest — the always-on weak sigil rides this fin.
  const crest = new THREE.Group();
  crest.position.set(0, 2.4, -0.4);
  head.add(crest);
  fin(crest, { len: 3.4, width: 1.5, mat: finMat, rx: -0.45 });
  nodes.crest = crest;

  // Jaw — swings open for bites; the maw weak point hides inside.
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.75, 1.3);
  head.add(jaw);
  bPart(jaw, new THREE.ConeGeometry(1.0, 3.0, 7), scaleMat, { z: 1.5, rx: Math.PI / 2.15, sy: 0.5 });
  bPart(jaw, new THREE.ConeGeometry(0.85, 2.4, 7), mawMat, { z: 1.35, y: 0.16, rx: Math.PI / 2.15, sy: 0.4 });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      bPart(jaw, new THREE.ConeGeometry(0.13, 0.5, 4), hornMat, { x: s * (0.45 - i * 0.1), y: 0.3, z: 0.8 + i * 0.75, rx: Math.PI });
    }
  }
  nodes.jaw = jaw;
  const maw = new THREE.Group();
  maw.position.set(0, -0.4, 2.2);
  head.add(maw);
  nodes.maw = maw;

  scene.add(root);

  // --- Animation -----------------------------------------------------------
  const _to = new THREE.Vector3();
  const baseRootY = 0;

  function animate(dt, time, st) {
    // Sink during the dive/traversal beat; rise back after.
    const sink = st.traversalK * 30 + st.dying * 6;
    root.position.y += ((baseRootY - sink) - root.position.y) * Math.min(1, dt * 2.5);

    // Coil undulation: radial breathing + vertical wave along the body.
    const speed = st.staggered ? 0.4 : 1 + (1 - st.hpFrac) * 0.5;
    for (const seg of coilSegs) {
      const t = seg.userData.baseT;
      const b = seg.userData.basePos;
      const w = Math.sin(time * 1.15 * speed + t * 9.5);
      seg.position.set(b.x * (1 + w * 0.045), b.y + w * 0.65, b.z * (1 + w * 0.045));
    }
    for (const seg of neckSegs) {
      const t = seg.userData.baseT;
      const b = seg.userData.basePos;
      const w = Math.sin(time * 1.5 * speed + t * 5);
      seg.position.set(b.x + w * 0.4 * t, b.y + w * 0.5, b.z + w * 0.4 * t);
    }

    // Head: hunt the hero (drop low and droop when staggered, writhe when dying).
    let targetY = headBase.y + 1.2 + Math.sin(time * 1.4) * 0.7;
    let track = 2.2;
    if (st.staggered) { targetY = shell.hMin + 2.5; track = 1; }
    if (st.dying) { targetY = headBase.y - 2 + Math.sin(time * 5) * 1.4; }
    const anim = st.anim;
    const k = st.animT;
    if (anim === 'rear') targetY += Math.min(k * 6, 2.6);
    if (anim === 'bite' || anim === 'bite2') {
      // Coil back then strike toward the hero — visual echo of the volume.
      const lungePhase = Math.min(k / 0.95, 1);
      const lunge = lungePhase < 0.75 ? -lungePhase * 3 : (lungePhase - 0.75) * 26;
      if (st.heroPos) {
        _to.copy(st.heroPos).sub(head.position).normalize();
        head.position.addScaledVector(_to, lunge * dt * 4);
      }
    }
    if (anim === 'dive') targetY = shell.hMin + 1 + Math.sin(time * 7) * 0.4;
    head.position.y += (targetY - head.position.y) * Math.min(1, dt * 3);

    if (st.heroPos) {
      _to.copy(st.heroPos);
      _to.y = Math.max(_to.y, head.position.y - 4);
      const q0 = head.quaternion.clone();
      head.lookAt(_to);
      head.quaternion.slerp(q0, Math.max(0, 1 - dt * track));
    }

    // Jaw: open for bites, gape when staggered, slack when dying.
    let jawOpen = 0.12 + Math.sin(time * 2.2) * 0.04;
    if (anim === 'rear' || anim === 'bite' || anim === 'bite2') jawOpen = 0.75;
    if (st.staggered) jawOpen = 0.95;
    if (st.dying) jawOpen = 0.6;
    jaw.rotation.x += (jawOpen - jaw.rotation.x) * Math.min(1, dt * 6);

    // Whirlpool: the whole serpent slowly turns with the spiral.
    const spin = anim === 'spiral' ? 0.55 : st.staggered ? 0.02 : 0.07;
    root.rotation.y += spin * dt;
  }

  function reset() {
    root.position.y = baseRootY;
    root.rotation.y = 0;
    head.position.copy(headBase).add(new THREE.Vector3(0, 1.2, 0));
  }

  // Every body segment is meleeable — the serpent IS the arena wall.
  const zones = [
    ...coilSegs.map((seg) => ({ obj: seg, r: seg.userData.baseR + 0.7, node: 'coil' })),
    ...neckSegs.map((seg) => ({ obj: seg, r: seg.userData.baseR + 0.6, node: 'neck' })),
    { obj: head, r: 3.6, node: 'head' },
    { obj: jaw, r: 2.6, node: 'jaw' },
  ];

  return { root, nodes, animate, reset, zones };
}

// --- Attack table ---------------------------------------------------------------

function bolt(ctx, i, total, spreadTheta, spreadH, dmg) {
  const head = ctx.node('head');
  const heroPos = shell.worldPos(ctx.heroTheta, ctx.heroH, shell.radius, new THREE.Vector3());
  const dist = head.distanceTo(heroPos);
  const off = total > 1 ? (i / (total - 1) - 0.5) * 2 : 0;
  // Alternate direct and intercepting shots — strafing dodges the first
  // kind, stutter-stepping dodges the second. You have to read which.
  const lead = i % 2 === 1 ? 0.85 : 0;
  const reticle = {
    kind: 'point', followHero: true, lead, thetaOffset: off * spreadTheta, hOffset: Math.abs(off) * spreadH,
    delay: i * 0.16, warn: 0.8, active: 0.2, dmg: 0, radius: 2.3,
    color: ACCENT, warnSfx: i === 0 ? 'warnLight' : undefined,
  };
  const projectile = {
    kind: 'projectile', followHero: true, lead, thetaOffset: off * spreadTheta, hOffset: Math.abs(off) * spreadH,
    delay: i * 0.16, warn: 0, active: 99, dmg, radius: 1.15,
    speed: Math.min(46, Math.max(24, dist / 0.8)),
    from: head.clone(), color: ACCENT, weight: 'light',
  };
  return [reticle, projectile];
}

export const LEVIATHAN = {
  id: 'leviathan',
  name: 'LEVIATHAN',
  title: 'Tide-Sovereign of the Maelstrom',
  arena: 'maelstrom',
  theme: 'leviathan',
  accentColor: ACCENT,
  heavyColor: HEAVY,
  hp: 4800,
  shell: { radius: 18, hMin: 3, hMax: 20, aimNode: 'head' },
  phaseThresholds: [0.65, 0.3],
  stagger: { threshold: 420, duration: 8, decayDelay: 4, decayRate: 6, dmgMult: 1.6 },
  build,

  hurtZones: [
    { node: 'head', r: 3.4 },
    { node: 'neck', r: 2.6 },
    { node: 'coil1', r: 2.9 },
    { node: 'coil2', r: 2.9 },
    { node: 'coil4', r: 2.9 },
    { node: 'coil5', r: 2.7 },
    { node: 'tail', r: 2.4 },
  ],
  weakPoints: [
    { id: 'crest', node: 'crest', r: 1.8, always: true, dmgMult: 1.5, staggerGain: 26 },
    { id: 'maw', node: 'maw', r: 2.1, dur: 3.5, dmgMult: 2.0, staggerGain: 42 },
    { id: 'heart', node: 'heart', r: 1.9, always: true, phaseMin: 3, dmgMult: 1.75, staggerGain: 32 },
  ],

  phases: [
    { cooldown: [2.3, 3.3], attacks: ['waterBolts', 'biteLunge', 'coilSweep'] },
    { cooldown: [1.8, 2.7], attacks: ['waterBoltsFan', 'biteLunge', 'coilSweep', 'whirlpool'] },
    {
      cooldown: [1.5, 2.3],
      attacks: ['waterBoltsFan', 'biteFeint', 'coilSweepDouble', 'whirlpool', 'tidalWave'],
      shell: { hMin: 6.5 }, // the sea rises
    },
  ],
  traversal: { atPhase: 2, beacons: 5, spreadTheta: 3.8, timeout: 9 },

  attacks: {
    waterBolts: {
      weight: 3, anim: 'rear', recovery: 0.7,
      vols: (ctx) => [0, 1, 2].flatMap((i) => bolt(ctx, i, 3, 0.32, -1.5, 8)),
    },
    waterBoltsFan: {
      weight: 3, anim: 'rear', recovery: 0.8,
      vols: (ctx) => [0, 1, 2, 3, 4].flatMap((i) => bolt(ctx, i, 5, 0.55, -2, 9)),
    },
    biteLunge: {
      weight: 2, anim: 'bite', exposes: 'maw', recovery: 1.6,
      vols: () => [{
        kind: 'point', followHero: true, lead: 0.85, warn: 0.95, active: 0.22,
        dmg: 18, knockback: 14, weight: 'heavy', radius: 4.4,
        color: HEAVY, warnSfx: 'warnHeavy',
      }],
    },
    biteFeint: {
      weight: 2, anim: 'bite2', exposes: 'maw', recovery: 1.6,
      vols: () => [
        {
          kind: 'point', followHero: true, lead: 0.85, warn: 0.95, active: 0.2,
          dmg: 18, knockback: 12, weight: 'heavy', radius: 4.2,
          color: HEAVY, warnSfx: 'warnHeavy',
        },
        {
          kind: 'point', followHero: true, lead: 0.75, delay: 0.8, warn: 0.85, active: 0.2,
          dmg: 20, knockback: 14, weight: 'heavy', radius: 4.2,
          color: HEAVY, warnSfx: 'warnHeavy',
        },
      ],
    },
    coilSweep: {
      weight: 2, anim: 'sweep', recovery: 1.0,
      vols: (ctx) => {
        // The band is anchored on YOU — climb out of it or dodge through.
        const upward = ctx.rng() < 0.5;
        const h = ctx.heroH;
        return [{
          kind: 'arc', followHero: true, thetaSpan: Math.PI * 0.95,
          hBand: upward ? [h - 9, h + 3] : [h - 3, h + 9],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.15, active: 0.42, dmg: 14, knockback: 10,
          color: ACCENT, warnSfx: 'warnLight',
        }];
      },
    },
    coilSweepDouble: {
      weight: 2, anim: 'sweep', recovery: 1.1,
      vols: (ctx) => [
        {
          kind: 'arc', followHero: true, thetaSpan: Math.PI * 1.05,
          hBand: [ctx.heroH - 3, ctx.heroH + 9],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.1, active: 0.4, dmg: 15, knockback: 10,
          color: ACCENT, warnSfx: 'warnLight',
        },
        {
          kind: 'arc', followHero: true, delay: 0.75, thetaSpan: Math.PI * 1.05,
          hBand: [ctx.heroH - 9, ctx.heroH + 3],
          rBand: [shell.radius - 7, shell.radius + 7],
          warn: 1.1, active: 0.4, dmg: 15, knockback: 10,
          color: ACCENT, warnSfx: 'warnLight',
        },
      ],
    },
    whirlpool: {
      weight: 1, anim: 'spiral', recovery: 0.6,
      vols: () => [{
        kind: 'zone', thetaCenter: 0, thetaSpan: TAU,
        hBand: [shell.hMin - 2, shell.hMin + 4.5],
        rBand: [0, shell.radius + 9],
        warn: 1.2, active: 4.0, tick: 0.55, dmg: 4, knockback: 5,
        color: ACCENT, warnSfx: 'warnLight',
      }],
    },
    tidalWave: {
      weight: 1, anim: 'dive', spectacle: true, recovery: 2.4,
      banner: 'TIDAL WAVE — GET ABOVE IT',
      fx: 'tidalWall',
      vols: () => [{
        kind: 'zone', thetaCenter: 0, thetaSpan: TAU,
        hBand: [shell.hMin - 2, shell.hMax - 4],
        rBand: [0, shell.radius + 9],
        warn: 2.6, active: 0.95, dmg: 30, knockback: 16, weight: 'spectacle',
        color: 0x66e8ff,
      }],
    },
  },

  cine: {
    phaseBanners: ['THE TIDE RISES', 'MAELSTROM UNBOUND'],
    finisher: { nodes: ['coil5', 'coil3', 'neck', 'crest', 'head'], color: ACCENT },
  },
};
