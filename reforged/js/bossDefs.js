// Boss definitions — data, not code. A boss is hp + a procedural model recipe +
// an ordered list of phases, each with its own attack set and fire cadence. The
// controller (boss.js) resolves attack ids to bullet patterns, so adding a boss
// is (mostly) authoring a new entry here. Tuning numbers default from CONFIG.BOSS.
//
// Phase `atFrac` is the hp fraction at which that phase BEGINS (1.0 = full hp).
// `attacks` are pattern ids understood by boss.js:
//   aimed  — three bullets near your position (precision sidestep)
//   fan    — a wide spread across the lane (find the gap)
//   spiral — an instant radial burst that flies outward
//   tunnel — a succession of bullet-rings rushing at you; weave the moving centre
//   spiralStream — a rotating emitter, arms sweeping around (read the spin)
// Difficulty escalates by unlocking the streamed patterns in later phases.
// `accent`/`glow` colour the boss BODY; `bulletColor` is the fiery danger colour.

export const BOSSES = {
  voidmaw: {
    id: 'voidmaw',
    name: 'VOIDMAW',
    title: 'the Sky Tyrant',
    hpMax: 180,
    accent: 0xa040ff,         // body reads violet so the red bullets pop as danger
    glow: 0xc89aff,
    bulletColor: 0xff3010,    // fiery red = "this will hurt"
    approachFrom: 'behind',   // 'behind' (overtakes you) | 'side' (sweeps in)
    phases: [
      { atFrac: 1.00, cadence: [1.5, 2.1], attacks: ['aimed', 'fan'] },
      { atFrac: 0.66, cadence: [1.2, 1.7], attacks: ['aimed', 'fan', 'tunnel'] },
      { atFrac: 0.33, cadence: [1.0, 1.5], attacks: ['fan', 'spiral', 'tunnel', 'spiralStream'] },
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
