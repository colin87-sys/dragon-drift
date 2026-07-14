import { saveData } from './save.js';

// Rider roster. Each rider is a distinct CHARACTER, not a colour swap: the
// gameplay camera sits above-and-behind the dragon, so a rider is read by its
// back silhouette — headgear crest, shoulder line, the gear mounted on its
// back and whatever trails in the slipstream. Those four traits are named here
// and built procedurally in riderParts.js (shared by the in-game model and the
// shop turntable).
//
// emberBonus: every ember banked at run end pays out (1 + bonus) — pricier
// riders are better earners, scaling gently so embers stay meaningful.
export const RIDERS = {
  // The free nomad: loose hair, a slung courier pack, a frayed split scarf.
  // Earthy and asymmetric — the only rider with no glow and flowing hair.
  drifter: {
    name: 'Sky Drifter',
    title: 'The original wanderer',
    cost: 0,
    emberBonus: 0,
    suit: 0x2a1d2e, suitMetal: 0.0, suitEmissive: 0x000000,
    cloak: 0xc83a24, cloakEmissive: 0x3a0c00,
    hair: 0x1a1020, ponySegs: 9,
    scarf: 0xd8492c,
    trimMetal: 0x7a5a3a, trimEmissive: 0x1a0c00,
    build: 'wanderer',
    headgear: 'bandana',
    shoulders: 'cloth',
    back: 'satchel',
    trail: 'tatters',
    glowColor: null, // no glow effect
  },
  // Dawn-court knight: broad pauldrons, a plumed helm crest, a tall back
  // banner and a heavy split cape. The widest, most armoured silhouette.
  lancer: {
    name: 'Gilded Lancer',
    title: 'Knight of the dawn court',
    cost: 900,
    emberBonus: 0.03,
    suit: 0xc8982a, suitMetal: 0.7, suitEmissive: 0x3a2400,
    cloak: 0x2440a0, cloakEmissive: 0x101c50,
    hair: 0xf0e8d8, ponySegs: 0, // full helm — no loose hair
    scarf: 0x3a60d8,
    trimMetal: 0xf0c860, trimEmissive: 0x5a3a00,
    build: 'knight',
    headgear: 'plumeHelm',
    shoulders: 'pauldrons',
    back: 'banner',
    trail: 'splitCape',
    glowColor: '255,210,110',
  },
  // Thunder aviator: a sleek aero-helm with swept antennae, twin glowing back
  // vanes and a forked energy ribbon. Lean and electric — the speed rider.
  storm: {
    name: 'Storm Caller',
    title: 'Speaks in thunder',
    cost: 1800,
    emberBonus: 0.07,
    suit: 0x243240, suitMetal: 0.35, suitEmissive: 0x07202e,
    cloak: 0x10708a, cloakEmissive: 0x05384a,
    hair: 0xe8f4ff, ponySegs: 0, // aero-helm
    scarf: 0x48e6ff,
    trimMetal: 0x60d0e8, trimEmissive: 0x0a90b0,
    accentGlow: '90,220,255',
    build: 'aviator',
    headgear: 'aeroHelm',
    shoulders: 'slim',
    back: 'vanes',
    trail: 'ribbon',
    glowColor: '90,220,255',
  },
  // Void mystic: a deep hood over a wide draped mantle, a constellation of
  // shards orbiting the head and a long trailing robe. Tall and voluminous.
  oracle: {
    name: 'Void Oracle',
    title: 'Sees every timeline',
    cost: 3000,
    emberBonus: 0.12,
    suit: 0x1c1030, suitMetal: 0.15, suitEmissive: 0x140730,
    cloak: 0x2c1648, cloakEmissive: 0x5a0c96,
    hair: 0x8a40d0, ponySegs: 0, // hooded
    scarf: 0xc060ff,
    trimMetal: 0x9a60d0, trimEmissive: 0x3a0c66,
    accentGlow: '220,120,255',
    build: 'mystic',
    headgear: 'hood',
    shoulders: 'mantle',
    back: 'shards',
    trail: 'robe',
    glowColor: '220,120,255',
  },
};

// Ember payout multiplier bonus of the currently equipped rider.
export function riderEmberBonus() {
  const r = RIDERS[saveData.riders.equipped];
  return r ? r.emberBonus : 0;
}
