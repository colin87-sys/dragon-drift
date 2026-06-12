import { saveData } from './save.js';

// Rider roster: each rider has a unique outfit, hair, accessory geometry and
// a glow effect, built procedurally in dragon.js alongside the dragon.
// emberBonus: every ember banked at run end pays out (1 + bonus) — pricier
// riders are better earners, scaling gently so embers stay meaningful.
export const RIDERS = {
  drifter: {
    name: 'Sky Drifter',
    title: 'The original wanderer',
    cost: 0,
    emberBonus: 0,
    suit: 0x231624, suitMetal: 0.0, suitEmissive: 0x000000,
    cloak: 0xc83a24, cloakEmissive: 0x441000,
    hair: 0x1a1020, ponySegs: 10,
    scarf: 0xc83a24,
    accessory: 'none',
    glowColor: null, // no glow effect
  },
  lancer: {
    name: 'Gilded Lancer',
    title: 'Knight of the dawn court',
    cost: 900,
    emberBonus: 0.03,
    suit: 0xc8982a, suitMetal: 0.65, suitEmissive: 0x553300,
    cloak: 0x2440a0, cloakEmissive: 0x101c50,
    hair: 0xf0e8d8, ponySegs: 7,
    scarf: 0x3a60d8,
    accessory: 'banner', // back-mounted pennant
    glowColor: '255,210,110',
  },
  storm: {
    name: 'Storm Caller',
    title: 'Speaks in thunder',
    cost: 1800,
    emberBonus: 0.07,
    suit: 0x2a3a4a, suitMetal: 0.3, suitEmissive: 0x0a2030,
    cloak: 0x18c0d8, cloakEmissive: 0x086070,
    hair: 0xe8f4ff, ponySegs: 12,
    scarf: 0x40e0ff,
    accessory: 'visor', // glowing eye band
    glowColor: '90,220,255',
  },
  oracle: {
    name: 'Void Oracle',
    title: 'Sees every timeline',
    cost: 3000,
    emberBonus: 0.12,
    suit: 0x201030, suitMetal: 0.15, suitEmissive: 0x180838,
    cloak: 0x30184a, cloakEmissive: 0x6a10aa,
    hair: 0x8a40d0, ponySegs: 14,
    scarf: 0xc060ff,
    accessory: 'hood', // hood + floating gem
    glowColor: '220,120,255',
  },
};

// Ember payout multiplier bonus of the currently equipped rider.
export function riderEmberBonus() {
  const r = RIDERS[saveData.riders.equipped];
  return r ? r.emberBonus : 0;
}
