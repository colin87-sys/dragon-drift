// Three hero dragons authored BY GENES ONLY — one per body plan — to prove the
// inversion: same "dragon" class, three genuinely different chase-cam
// silhouettes (not three reskins of one body). See CREATURE-CHASSIS-REDESIGN.md.

export const HERO_CREATURES = {
  // Heavy galleon-winged western drake: broad, deep-bellied, short stout neck,
  // broad low-aspect wings, a heavy clubbed tail.
  emberKnight: {
    name: 'Ember Knight', plan: 'western',
    mass: 1.55, neckLen: 0.8, neckArch: 0.35, tailLen: 1.0, tailTaper: 0.75,
    bellyDepth: 1.25, limbBulk: 1.4, wingAspect: 1.5, wingSpan: 1.25, posturePitch: -0.05,
    tailTip: 'spade', hornStyle: 'ram', dorsalSpines: 9,
    palette: { base: 0x7a2b1c, accent: 0x3a140c, membrane: 0xd06636, glow: 0xffb23a, eye: 0xffe08a },
  },

  // Lean soaring wyvern: tall narrow body, very long neck, tall high-aspect
  // arm-wings, a long whip tail. Reads as a totally different animal.
  galeLancer: {
    name: 'Gale Lancer', plan: 'wyvern',
    mass: 0.85, neckLen: 1.9, neckArch: 0.95, tailLen: 1.8, tailTaper: 0.25,
    bellyDepth: 0.55, limbBulk: 0.9, wingAspect: 3.3, wingSpan: 1.5, posturePitch: 0.3,
    tailTip: 'fin', hornStyle: 'swept', dorsalSpines: 5,
    palette: { base: 0x244a5e, accent: 0x10222e, membrane: 0x7fcfe6, glow: 0x66e0ff, eye: 0xeaffff },
  },

  // Long serpentine eastern river-dragon: a flowing tube with a mane, whiskers,
  // tiny limbs and no big wings. Maximum silhouette distance from the other two.
  riverSage: {
    name: 'River Sage', plan: 'eastern',
    mass: 1.0, neckLen: 1.5, neckArch: 0.7, tailLen: 1.6, tailTaper: 0.4,
    bellyDepth: 0.6, limbBulk: 0.6, wingSpan: 1.0, wingAspect: 2.0, posturePitch: 0.0,
    tailTip: 'frond', hornStyle: 'crown', dorsalSpines: 0,
    palette: { base: 0x1f6b4a, accent: 0x0c3325, membrane: 0x8fe6b8, glow: 0xc8ff7a, eye: 0xfff0a0 },
  },
};
