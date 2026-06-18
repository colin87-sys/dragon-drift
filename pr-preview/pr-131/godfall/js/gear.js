// Weapons & armor: stats, prices, and procedural mesh builders.
// Four weapon classes × 3 tiers; four armor slots × 3 sets. Every model is
// primitives + emissive accents — tier/set upgrades visibly grow the
// silhouette and add glow, so power shows on the hero at a glance.

import * as THREE from 'three';

// --- Shared materials -------------------------------------------------------

const steel = (color = 0xb9c4d6, rough = 0.32) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: rough });
const darkSteel = () =>
  new THREE.MeshStandardMaterial({ color: 0x2c3242, metalness: 0.7, roughness: 0.45 });
const gold = () =>
  new THREE.MeshStandardMaterial({ color: 0xd8a955, metalness: 0.9, roughness: 0.3, emissive: 0x402805, emissiveIntensity: 0.25 });
const grip = () =>
  new THREE.MeshStandardMaterial({ color: 0x241a18, roughness: 0.85 });
const runes = (color, intensity = 1.6) =>
  new THREE.MeshStandardMaterial({ color: 0x101522, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });

function part(geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  return m;
}

// --- Weapons -----------------------------------------------------------------
// Built blade-up along +Y with the grip at origin; the hero's hand socket
// orients them. userData.tip = blade-tip local offset for trail emission.

function buildSword(tier, color) {
  const g = new THREE.Group();
  const len = 1.25 + tier * 0.18;
  const w = 0.085 + tier * 0.012;
  g.add(part(new THREE.BoxGeometry(w, len, 0.028), steel(), { y: 0.36 + len / 2 }));
  g.add(part(new THREE.ConeGeometry(w * 0.72, 0.22, 4), steel(), { y: 0.36 + len + 0.1, ry: Math.PI / 4 }));
  // Fuller — emissive from tier 2.
  g.add(part(new THREE.BoxGeometry(w * 0.3, len * 0.82, 0.032),
    tier >= 2 ? runes(color, 1.2 + tier * 0.5) : darkSteel(), { y: 0.36 + len / 2 }));
  g.add(part(new THREE.BoxGeometry(0.34 + tier * 0.05, 0.06, 0.07), gold(), { y: 0.34 }));
  g.add(part(new THREE.CylinderGeometry(0.035, 0.04, 0.3, 6), grip(), { y: 0.16 }));
  g.add(part(new THREE.SphereGeometry(0.05, 6, 5), gold(), { y: 0 }));
  if (tier >= 3) {
    g.add(part(new THREE.OctahedronGeometry(0.05), runes(color, 2.4), { y: 0.34, z: 0.07 }));
    for (const s of [-1, 1]) {
      g.add(part(new THREE.ConeGeometry(0.035, 0.16, 4), gold(), { x: s * 0.2, y: 0.42, rz: -s * 0.5 }));
    }
  }
  g.userData.tip = new THREE.Vector3(0, 0.36 + len + 0.18, 0);
  return g;
}

function buildSpear(tier, color) {
  const g = new THREE.Group();
  const shaft = 2.3 + tier * 0.15;
  g.add(part(new THREE.CylinderGeometry(0.028, 0.034, shaft, 7), darkSteel(), { y: shaft / 2 - 0.5 }));
  // Leaf head
  const headY = shaft - 0.5;
  g.add(part(new THREE.ConeGeometry(0.09, 0.52, 4), steel(), { y: headY + 0.3, sz: 0.45 }));
  g.add(part(new THREE.CylinderGeometry(0.055, 0.07, 0.12, 6), gold(), { y: headY }));
  g.add(part(new THREE.ConeGeometry(0.04, 0.18, 4), steel(), { y: -0.62, rx: Math.PI }));
  if (tier >= 2) {
    for (const s of [-1, 1]) {
      g.add(part(new THREE.ConeGeometry(0.05, 0.3, 4), steel(), { x: s * 0.11, y: headY + 0.12, rz: -s * 0.5, sz: 0.45 }));
    }
  }
  if (tier >= 3) {
    g.add(part(new THREE.CylinderGeometry(0.012, 0.012, shaft * 0.7, 5), runes(color, 2), { y: shaft / 2 - 0.5, z: 0.036 }));
    g.add(part(new THREE.OctahedronGeometry(0.06), runes(color, 2.4), { y: headY - 0.14 }));
  }
  g.userData.tip = new THREE.Vector3(0, headY + 0.62, 0);
  return g;
}

function buildGreatsword(tier, color) {
  const g = new THREE.Group();
  const len = 1.55 + tier * 0.2;
  const w = 0.2 + tier * 0.03;
  g.add(part(new THREE.BoxGeometry(w, len, 0.045), steel(0xaab6ca, 0.38), { y: 0.42 + len / 2 }));
  g.add(part(new THREE.ConeGeometry(w * 0.74, 0.3, 4), steel(0xaab6ca, 0.38), { y: 0.42 + len + 0.14, ry: Math.PI / 4 }));
  g.add(part(new THREE.BoxGeometry(w * 0.32, len * 0.85, 0.05),
    tier >= 2 ? runes(color, 1.1 + tier * 0.45) : darkSteel(), { y: 0.42 + len / 2 }));
  g.add(part(new THREE.BoxGeometry(0.5 + tier * 0.06, 0.08, 0.1), gold(), { y: 0.4 }));
  for (const s of [-1, 1]) {
    g.add(part(new THREE.ConeGeometry(0.05, 0.2, 4), gold(), { x: s * (0.27 + tier * 0.03), y: 0.44, rz: -s * 1.2 }));
  }
  g.add(part(new THREE.CylinderGeometry(0.04, 0.046, 0.46, 6), grip(), { y: 0.14 }));
  g.add(part(new THREE.SphereGeometry(0.065, 6, 5), gold(), { y: -0.1 }));
  if (tier >= 3) {
    for (let i = 0; i < 3; i++) {
      g.add(part(new THREE.BoxGeometry(w * 1.25, 0.05, 0.05), runes(color, 2), { y: 0.7 + i * 0.42 }));
    }
  }
  g.userData.tip = new THREE.Vector3(0, 0.42 + len + 0.26, 0);
  return g;
}

function buildDagger(tier, color, mirrored = false) {
  const g = new THREE.Group();
  const len = 0.62 + tier * 0.08;
  g.add(part(new THREE.BoxGeometry(0.055, len, 0.02), steel(), { y: 0.2 + len / 2, rz: mirrored ? 0.06 : -0.06 }));
  g.add(part(new THREE.ConeGeometry(0.04, 0.14, 4), steel(), { y: 0.2 + len + 0.06 }));
  g.add(part(new THREE.BoxGeometry(0.16, 0.04, 0.05), gold(), { y: 0.18 }));
  g.add(part(new THREE.CylinderGeometry(0.026, 0.03, 0.16, 6), grip(), { y: 0.08 }));
  if (tier >= 2) g.add(part(new THREE.BoxGeometry(0.02, len * 0.7, 0.024), runes(color, 1.8), { y: 0.2 + len / 2 }));
  if (tier >= 3) g.add(part(new THREE.OctahedronGeometry(0.032), runes(color, 2.4), { y: 0.04 }));
  g.userData.tip = new THREE.Vector3(0, 0.2 + len + 0.12, 0);
  return g;
}

export const WEAPONS = {
  sword: {
    id: 'sword',
    label: 'SWORD',
    desc: 'The balanced blade. Honest speed, honest steel.',
    color: 0x57c8ff,
    speed: 1.0, staggerMult: 1.0, warpRegenMult: 1.0, dodgeCdMult: 1.0,
    reach: 3.4, comboLen: 3,
    unlockPrice: 0,
    tiers: [
      { name: "Squire's Edge", power: 10, price: 0 },
      { name: "Knight's Edge", power: 14, price: 500 },
      { name: 'Sovereign Edge', power: 19, price: 1500 },
    ],
    build: (tier) => buildSword(tier, 0x57c8ff),
  },
  spear: {
    id: 'spear',
    label: 'SPEAR',
    desc: 'Long reach, light feet. The warp gauge loves it.',
    color: 0x4dffc8,
    speed: 1.15, staggerMult: 1.0, warpRegenMult: 1.4, dodgeCdMult: 1.0,
    reach: 4.6, comboLen: 3,
    unlockPrice: 800,
    tiers: [
      { name: 'Tidepiercer', power: 8, price: 0 },
      { name: 'Stormpike', power: 11, price: 500 },
      { name: 'Heavensfall', power: 15, price: 1500 },
    ],
    build: (tier) => buildSpear(tier, 0x4dffc8),
  },
  greatsword: {
    id: 'greatsword',
    label: 'GREATSWORD',
    desc: 'Slow as a verdict. Breaks gods open.',
    color: 0xffb066,
    speed: 0.65, staggerMult: 1.8, warpRegenMult: 1.0, dodgeCdMult: 1.0,
    reach: 3.8, comboLen: 2,
    unlockPrice: 1000,
    tiers: [
      { name: 'Oathcleaver', power: 16, price: 0 },
      { name: 'Mountain Oath', power: 22, price: 500 },
      { name: 'Worldsplitter', power: 30, price: 1500 },
    ],
    build: (tier) => buildGreatsword(tier, 0xffb066),
  },
  daggers: {
    id: 'daggers',
    label: 'DAGGERS',
    desc: 'A flicker of violet. Gone before the splash.',
    color: 0xc88aff,
    speed: 1.6, staggerMult: 0.8, warpRegenMult: 1.0, dodgeCdMult: 0.7,
    reach: 2.7, comboLen: 4,
    unlockPrice: 1000,
    tiers: [
      { name: 'Twin Sparrows', power: 6, price: 0 },
      { name: 'Twin Corvids', power: 8, price: 500 },
      { name: 'Twin Phantoms', power: 11, price: 1500 },
    ],
    build: (tier) => buildDagger(tier, 0xc88aff, false),
    buildOffhand: (tier) => buildDagger(tier, 0xc88aff, true),
  },
};

export const WEAPON_ORDER = ['sword', 'spear', 'greatsword', 'daggers'];

// --- Armor -------------------------------------------------------------------
// Sets define the hero's palette; per-slot builders bolt plates onto the
// hero's pivots (called from hero.js with the pivot map).

export const ARMOR_SLOTS = ['helm', 'chest', 'gauntlets', 'greaves'];

export const ARMOR_SETS = {
  drifter: {
    id: 'drifter',
    name: 'Drifter Cloth',
    desc: 'Road-worn travelling garb.',
    piecePrice: 0,
    setBonus: null,
    palette: {
      suit: 0x3a4254, suitEmissive: 0x000000, plate: 0x565e72,
      trim: 0x8a7a5a, glow: 0x6f87a8, metal: 0.15, cape: null,
    },
  },
  bulwark: {
    id: 'bulwark',
    name: 'Bulwark Steel',
    desc: 'Forged for the breach. +10% HP with the full set.',
    piecePrice: 250,
    setBonus: { hp: 0.10, label: '+10% HP' },
    palette: {
      suit: 0x2e3648, suitEmissive: 0x0a1422, plate: 0x9aa8be,
      trim: 0xc8a050, glow: 0x57c8ff, metal: 0.75, cape: null,
    },
  },
  aegis: {
    id: 'aegis',
    name: 'Mythril Aegis',
    desc: 'Armor of the godslayer. +20% HP, +10% Armiger gain (full set).',
    piecePrice: 700,
    setBonus: { hp: 0.20, armiger: 0.10, label: '+20% HP · +10% ARMIGER' },
    palette: {
      suit: 0x232b40, suitEmissive: 0x101a30, plate: 0xd7e2f2,
      trim: 0xe8c060, glow: 0x7fe0ff, metal: 0.9, cape: 0x1c2438,
    },
  },
};

// Highest set fully equipped (for bonuses), or null.
export function fullSetId(equipped) {
  const first = equipped.helm;
  for (const slot of ARMOR_SLOTS) if (equipped[slot] !== first) return null;
  return first;
}

export function setBonuses(equipped) {
  const id = fullSetId(equipped);
  const set = id && ARMOR_SETS[id];
  return {
    hp: set && set.setBonus ? set.setBonus.hp || 0 : 0,
    armiger: set && set.setBonus ? set.setBonus.armiger || 0 : 0,
  };
}

// --- Per-slot builders. p = pivot map from hero.js, pal = slot's set palette.

function mat(pal, kind) {
  if (kind === 'plate') return new THREE.MeshStandardMaterial({ color: pal.plate, metalness: pal.metal, roughness: 0.42 });
  if (kind === 'trim') return new THREE.MeshStandardMaterial({ color: pal.trim, metalness: 0.85, roughness: 0.32, emissive: 0x2a1c05, emissiveIntensity: 0.2 });
  if (kind === 'glow') return new THREE.MeshStandardMaterial({ color: 0x0c1320, emissive: pal.glow, emissiveIntensity: 2.0, roughness: 0.3 });
  return new THREE.MeshStandardMaterial({ color: pal.suit, roughness: 0.75, metalness: 0.08, emissive: pal.suitEmissive, emissiveIntensity: 0.35 });
}

export const ARMOR_BUILDERS = {
  helm(p, setId, pal) {
    const head = p.headPivot;
    if (setId === 'drifter') {
      head.add(part(new THREE.ConeGeometry(0.21, 0.3, 7), mat(pal, 'suit'), { y: 0.16, rx: 0.16 }));
      head.add(part(new THREE.BoxGeometry(0.3, 0.05, 0.26), mat(pal, 'trim'), { y: 0.02 }));
    } else if (setId === 'bulwark') {
      head.add(part(new THREE.SphereGeometry(0.2, 9, 7), mat(pal, 'plate'), { y: 0.06, sy: 1.12 }));
      head.add(part(new THREE.BoxGeometry(0.26, 0.045, 0.1), mat(pal, 'glow'), { y: 0.03, z: -0.15 }));
      head.add(part(new THREE.ConeGeometry(0.045, 0.3, 4), mat(pal, 'trim'), { y: 0.3 }));
    } else {
      head.add(part(new THREE.SphereGeometry(0.21, 9, 7), mat(pal, 'plate'), { y: 0.06, sy: 1.15 }));
      head.add(part(new THREE.BoxGeometry(0.28, 0.05, 0.1), mat(pal, 'glow'), { y: 0.04, z: -0.16 }));
      for (const s of [-1, 1]) {
        head.add(part(new THREE.ConeGeometry(0.06, 0.34, 4), mat(pal, 'trim'),
          { x: s * 0.2, y: 0.2, rz: -s * 0.9, sz: 0.4 }));
      }
      head.add(part(new THREE.ConeGeometry(0.05, 0.36, 4), mat(pal, 'glow'), { y: 0.33 }));
    }
  },

  chest(p, setId, pal) {
    const t = p.torso;
    if (setId === 'drifter') {
      t.add(part(new THREE.CapsuleGeometry(0.21, 0.3, 4, 8), mat(pal, 'suit'), { y: 0.1 }));
      t.add(part(new THREE.BoxGeometry(0.34, 0.07, 0.24), mat(pal, 'trim'), { y: -0.18 }));
    } else if (setId === 'bulwark') {
      t.add(part(new THREE.CapsuleGeometry(0.225, 0.3, 4, 8), mat(pal, 'plate'), { y: 0.1 }));
      for (const s of [-1, 1]) {
        t.add(part(new THREE.SphereGeometry(0.13, 8, 6), mat(pal, 'plate'), { x: s * 0.24, y: 0.3, sy: 0.8 }));
      }
      t.add(part(new THREE.BoxGeometry(0.1, 0.26, 0.06), mat(pal, 'glow'), { y: 0.14, z: -0.2 }));
      t.add(part(new THREE.BoxGeometry(0.36, 0.07, 0.26), mat(pal, 'trim'), { y: -0.18 }));
    } else {
      t.add(part(new THREE.CapsuleGeometry(0.235, 0.32, 4, 8), mat(pal, 'plate'), { y: 0.1 }));
      for (const s of [-1, 1]) {
        t.add(part(new THREE.SphereGeometry(0.145, 8, 6), mat(pal, 'plate'), { x: s * 0.25, y: 0.31, sy: 0.85 }));
        t.add(part(new THREE.ConeGeometry(0.05, 0.2, 4), mat(pal, 'trim'), { x: s * 0.32, y: 0.4, rz: -s * 1.1 }));
        t.add(part(new THREE.BoxGeometry(0.045, 0.3, 0.05), mat(pal, 'glow'), { x: s * 0.13, y: 0.1, z: -0.19, rz: s * 0.18 }));
      }
      t.add(part(new THREE.OctahedronGeometry(0.06), mat(pal, 'glow'), { y: 0.26, z: -0.2 }));
      t.add(part(new THREE.BoxGeometry(0.38, 0.08, 0.27), mat(pal, 'trim'), { y: -0.2 }));
    }
  },

  gauntlets(p, setId, pal) {
    for (const side of ['armR', 'armL']) {
      const arm = p[side];
      if (setId === 'drifter') {
        arm.add(part(new THREE.CylinderGeometry(0.075, 0.085, 0.2, 7), mat(pal, 'suit'), { y: -0.42 }));
      } else if (setId === 'bulwark') {
        arm.add(part(new THREE.CylinderGeometry(0.085, 0.1, 0.24, 7), mat(pal, 'plate'), { y: -0.42 }));
        arm.add(part(new THREE.SphereGeometry(0.075, 7, 6), mat(pal, 'plate'), { y: -0.2 }));
      } else {
        arm.add(part(new THREE.CylinderGeometry(0.09, 0.11, 0.26, 7), mat(pal, 'plate'), { y: -0.42 }));
        arm.add(part(new THREE.SphereGeometry(0.08, 7, 6), mat(pal, 'plate'), { y: -0.2 }));
        arm.add(part(new THREE.BoxGeometry(0.03, 0.18, 0.06), mat(pal, 'glow'), { y: -0.42, z: -0.09 }));
        arm.add(part(new THREE.ConeGeometry(0.04, 0.14, 4), mat(pal, 'trim'), { y: -0.3, z: 0.08, rx: 2.6 }));
      }
    }
  },

  greaves(p, setId, pal) {
    for (const side of ['legR', 'legL']) {
      const leg = p[side];
      if (setId === 'drifter') {
        leg.add(part(new THREE.CylinderGeometry(0.08, 0.09, 0.24, 7), mat(pal, 'suit'), { y: -0.5 }));
      } else if (setId === 'bulwark') {
        leg.add(part(new THREE.CylinderGeometry(0.09, 0.105, 0.3, 7), mat(pal, 'plate'), { y: -0.48 }));
        leg.add(part(new THREE.SphereGeometry(0.075, 7, 6), mat(pal, 'plate'), { y: -0.3 }));
      } else {
        leg.add(part(new THREE.CylinderGeometry(0.095, 0.115, 0.32, 7), mat(pal, 'plate'), { y: -0.48 }));
        leg.add(part(new THREE.SphereGeometry(0.08, 7, 6), mat(pal, 'plate'), { y: -0.3 }));
        leg.add(part(new THREE.BoxGeometry(0.03, 0.2, 0.05), mat(pal, 'glow'), { y: -0.48, z: -0.1 }));
        leg.add(part(new THREE.ConeGeometry(0.045, 0.16, 4), mat(pal, 'trim'), { y: -0.62, z: -0.06, rx: -0.5 }));
      }
    }
  },
};
