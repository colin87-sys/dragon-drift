// Boss definitions — data, not code. A boss is hp + a procedural model recipe +
// an ordered list of phases, each with its own attack set and fire cadence. The
// controller (boss.js) resolves attack ids to bullet patterns, so adding a boss
// is (mostly) authoring a new entry here. Tuning numbers default from CONFIG.BOSS.
//
// Phase `atFrac` is the hp fraction at which that phase BEGINS (1.0 = full hp).
// `attacks` are pattern ids understood by boss.js: 'aimed' | 'fan' | 'spiral'.
// `reflectable` patterns can be swatted back with a barrel roll (increment 3).

export const BOSSES = {
  voidmaw: {
    id: 'voidmaw',
    name: 'VOIDMAW',
    title: 'the Sky Tyrant',
    hpMax: 130,
    accent: 0xff4488,
    glow: 0xff9ad0,
    approachFrom: 'behind',   // 'behind' (overtakes you) | 'side' (sweeps in)
    phases: [
      { atFrac: 1.00, cadence: [1.4, 2.0], attacks: ['aimed', 'fan'] },
      { atFrac: 0.66, cadence: [1.1, 1.6], attacks: ['aimed', 'fan', 'spiral'] },
      { atFrac: 0.33, cadence: [0.8, 1.2], attacks: ['fan', 'spiral', 'aimed'] },
    ],
  },
};

export const BOSS_ORDER = ['voidmaw'];

// Which boss to use for the Nth encounter of a run (cycles once the list is
// exhausted — more bosses just extend the list).
export function bossDefForIndex(i) {
  const key = BOSS_ORDER[i % BOSS_ORDER.length];
  return BOSSES[key];
}
