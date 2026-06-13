// Dragon roster. Each dragon is an individual creature with distinct silhouette,
// palette, and per-tier part accretion (gacha R→SR→SSR→SSSR). Price escalates
// both stats AND visual quality. Tier 5 apex = S-tier.
//
// stats: multipliers on CONFIG flight model (speed/handling/drain/regen)
// model: base proportions fed to the builder
// stages[evoStage]: proportion curve (scale/eyeScale hatchling→adolescent→adult)
// tierKit[0..5]: parts that ACCRETE at each tier (cumulative, never removed)
// fx: trail colors, idle aura (flagship glow without needing Dragon Surge)
//
// Rarity by price: R (free) · SR (600-1200) · SSR (2200-3400) · SSSR (5000)
export const DRAGONS = {
  azure: {
    name: 'Azure Drake',
    title: 'The trusted courier',
    rarity: 'R',
    cost: 0,
    stats: { speed: 1.0, handling: 1.0, drain: 1.0, regen: 1.0 },
    model: {
      scale: 1.0, wingScale: 1.0, tailSegments: 9, neckSegments: 4,
      hornLen: 1.15, hornPairs: 1, ridgeCount: 12, flapBias: 1.0,
    },
    stages: [
      { scale: 0.84, eyeScale: 1.28, hornLen: 0.88, ridgeCount: 9, tailSegments: 7, neckSegments: 3 },
      {},
      { scale: 1.06, ridgeCount: 15 },
    ],
    // Parts that accrue at each ascension tier (index = tier 0..5)
    tierKit: [
      {},                                                        // T0 R   — bare starter drake
      { ridgeCount: 13 },                                        // T1 SR  — fuller ridge
      { dorsal: true },                                          // T2 SR+ — dorsal spine row
      { crest: 1, glowSeams: true },                            // T3 SSR — crest + faint seams
      { crest: 2 },                                              // T4 SSR+— double crest
      { sparkle: true },                                         // T5 SSSR— sparkle
    ],
    fx: { auraColor: '255,130,235', auraIdle: 0, sparkle: false },
    body: 0x2b58c8, belly: 0xffd9a8, scales: 0x9fe8ff, horn: 0xffdf8a,
    wingInner: 0xff8a3c, wingOuter: 0xd91f1f, wingEmissive: 0xff5222,
    eye: 0x55e0ff, trail: 0xffc080, boostTrail: 0x88aaff,
  },

  ember: {
    name: 'Ember Wyrm',
    title: 'Forged in cinder',
    rarity: 'SR',
    cost: 600,
    stats: { speed: 1.04, handling: 1.06, drain: 0.95, regen: 1.05 },
    model: {
      scale: 0.97, wingScale: 1.04, tailSegments: 9, neckSegments: 4,
      hornLen: 1.35, hornPairs: 1, ridgeCount: 14, flapBias: 1.08,
    },
    stages: [
      { scale: 0.83, eyeScale: 1.25, hornLen: 1.0, ridgeCount: 10, tailSegments: 7 },
      {},
      { scale: 1.02, ridgeCount: 18, hornLen: 1.62 },
    ],
    tierKit: [
      {},                                                        // T0 R
      { backSpines: true },                                      // T1 SR  — back-spines emerge
      { armorPlates: true },                                     // T2 SR+ — shoulder plates
      { glowSeams: true, crest: 1 },                            // T3 SSR — seams + horn crown
      { hornLen: 1.8 },                                          // T4 SSR+— extended horns
      { maceTail: true, sparkle: true },                         // T5 SSSR— mace tail + fire
    ],
    fx: { auraColor: '255,160,80', auraIdle: 0, sparkle: false },
    body: 0xb83820, belly: 0xffd9a8, scales: 0xffb060, horn: 0xffe8a0,
    wingInner: 0xffc23c, wingOuter: 0xb81f60, wingEmissive: 0xff8022,
    eye: 0xffd060, trail: 0xffd080, boostTrail: 0xffa060,
  },

  jade: {
    name: 'Jade Serpent',
    title: 'River-wind dancer',
    rarity: 'SR',
    cost: 1200,
    stats: { speed: 1.07, handling: 1.11, drain: 0.9, regen: 1.1 },
    model: {
      scale: 0.95, wingScale: 0.96, tailSegments: 12, neckSegments: 6,
      hornLen: 0.9, hornPairs: 1, ridgeCount: 16, flapBias: 1.15,
    },
    stages: [
      { scale: 0.82, eyeScale: 1.3, hornLen: 0.65, ridgeCount: 12, tailSegments: 9, neckSegments: 4 },
      {},
      { scale: 0.99, neckSegments: 8, ridgeCount: 20 },
    ],
    tierKit: [
      {},                                                        // T0 R
      { whiskers: true },                                        // T1 SR  — whiskers appear
      { crest: 1, tailSegments: 14 },                           // T2 SR+ — fin-crest + longer tail
      { tailTip: 'fan' },                                        // T3 SSR — fan tail
      { crest: 2, glowSeams: true },                            // T4 SSR+— double crest + seams
      { sparkle: true },                                         // T5 SSSR— jade sparkle
    ],
    fx: { auraColor: '120,255,190', auraIdle: 0, sparkle: false },
    body: 0x1f9a60, belly: 0xe8ffd0, scales: 0xa0ffd0, horn: 0xffe8a0,
    wingInner: 0x60e8a0, wingOuter: 0x106a8a, wingEmissive: 0x40e890,
    eye: 0xa0ffc0, trail: 0xa0ffd0, boostTrail: 0x50e8b0,
  },

  obsidian: {
    name: 'Obsidian Shade',
    title: 'Night given wings',
    rarity: 'SSR',
    cost: 2200,
    stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },
    model: {
      // Toothless-reference: sleek black drake, wide flat head, large almond eyes
      scale: 1.02, wingScale: 1.1, tailSegments: 11, neckSegments: 5,
      hornLen: 1.5, hornPairs: 2, ridgeCount: 14, flapBias: 1.05,
    },
    stages: [
      // Hatchling: very big eyes (almond stare), compact, minimal hardware
      { scale: 0.86, eyeScale: 1.35, hornLen: 0.9, ridgeCount: 10, tailSegments: 8, hornPairs: 1 },
      {},
      { scale: 1.08, wingScale: 1.22 },
    ],
    tierKit: [
      { eyeScale: 1.2 },                                        // T0 R   — big eyes, bare
      { earTendrils: true },                                     // T1 SR  — ear tendrils deploy
      { backSpines: true },                                      // T2 SR+ — back-spines emerge
      { glowSeams: true },                                       // T3 SSR — plasma-cyan seams
      { secondWingPair: true },                                  // T4 SSR+— small 2nd wing pair
      { tailTip: 'fan', sparkle: true },                         // T5 SSSR— twin tail-fins
    ],
    fx: { auraColor: '170,90,255', auraIdle: 0.1, sparkle: false },
    body: 0x282038, belly: 0x6a5a8a, scales: 0xb090ff, horn: 0xd0c0ff,
    wingInner: 0x8a40ff, wingOuter: 0xff2080, wingEmissive: 0xa040ff,
    // Apex palette override — plasma-cyan eyes/seams at T3+
    apexEye: 0x00ffee, apexSeam: 0x00ccff,
    eye: 0xff60c0, trail: 0xc090ff, boostTrail: 0xb060ff,
  },

  pearl: {
    name: 'Pearl Seraph',
    title: 'Dawn incarnate',
    rarity: 'SSR',
    cost: 3400,
    stats: { speed: 1.13, handling: 1.22, drain: 0.78, regen: 1.25 },
    model: {
      // Blue-Eyes reference: pale slim dragon, elegant proportions
      scale: 1.05, wingScale: 1.18, tailSegments: 10, neckSegments: 5,
      hornLen: 1.3, hornPairs: 1, ridgeCount: 12, flapBias: 0.95,
    },
    stages: [
      { scale: 0.87, eyeScale: 1.25, hornLen: 1.0, ridgeCount: 9, tailSegments: 8 },
      {},
      { scale: 1.1, wingScale: 1.26 },
    ],
    tierKit: [
      {},                                                        // T0 R
      { bladeFins: true },                                       // T1 SR  — blade-fins emerge
      { wingShape: 'feather' },                                  // T2 SR+ — feathered wings
      { crest: 1, glowSeams: true },                            // T3 SSR — blade-fan crest + seams
      { halo: true, whiskers: true },                            // T4 SSR+— halo + whiskers
      { crest: 2, sparkle: true },                               // T5 SSSR— full regalia + sparkle
    ],
    fx: { auraColor: '255,230,150', auraIdle: 0.14, sparkle: true },
    body: 0xe8e8f0, belly: 0xffe8c0, scales: 0xfff0d0, horn: 0xffd060,
    wingInner: 0xffe080, wingOuter: 0xff8040, wingEmissive: 0xffc040,
    // Apex palette: sapphire eyes, white-gold seams
    apexEye: 0x4488ff, apexSeam: 0xfffce8,
    eye: 0x80c0ff, trail: 0xffe8a0, boostTrail: 0xffd870,
  },

  solar: {
    name: 'Solar Sovereign',
    title: 'Apex of the skies',
    rarity: 'SSSR',
    cost: 5000,
    stats: { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 },
    model: {
      // Bahamut/Smaug reference: armored regal build, huge wings, layered plates
      scale: 1.1, wingScale: 1.28, tailSegments: 12, neckSegments: 6,
      hornLen: 1.7, hornPairs: 2, ridgeCount: 18, flapBias: 1.1,
    },
    stages: [
      { scale: 0.9, eyeScale: 1.2, hornLen: 1.25, ridgeCount: 14, tailSegments: 9, hornPairs: 1 },
      {},
      { scale: 1.18, wingScale: 1.36 },
    ],
    tierKit: [
      {},                                                        // T0 R   — bare gold drake
      { armorPlates: true },                                     // T1 SR  — chest + flank plates
      { glowSeams: true },                                       // T2 SR+ — under-scale seams
      { tusks: true, hornPairs: 2 },                             // T3 SSR — tusks + antler crown
      { maceTail: true, crest: 2 },                              // T4 SSR+— mace tail + crest
      { wingScale: 1.42, sparkle: true },                        // T5 SSSR— enormous wings + full regalia
    ],
    fx: { auraColor: '255,200,90', auraIdle: 0.22, sparkle: true },
    body: 0xd88a18, belly: 0xfff0c8, scales: 0xffe070, horn: 0xfff0b0,
    wingInner: 0xffd84a, wingOuter: 0xff4a18, wingEmissive: 0xffaa20,
    // Apex palette: molten cracks, cyan-gold core
    apexEye: 0xffffff, apexSeam: 0xff8800,
    eye: 0xfff0a0, trail: 0xffe060, boostTrail: 0xffb030,
  },
};

// Highest multipliers in the roster (for shop stat-bar normalisation).
export const DRAGON_STAT_CAP = { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 };

// Rarity grade → display color (card frame, tier pips, reveal flash)
export const RARITY_COLORS = {
  R:    { fg: '#a0c8a0', glow: 'rgba(120,200,120,0.4)',  label: 'R',    grade: 0 },
  SR:   { fg: '#60a8ff', glow: 'rgba(80,140,255,0.45)',  label: 'SR',   grade: 1 },
  SSR:  { fg: '#c080ff', glow: 'rgba(160,80,255,0.5)',   label: 'SSR',  grade: 2 },
  SSSR: { fg: '#ffd86a', glow: 'rgba(255,200,90,0.55)',  label: 'SSSR', grade: 3 },
};
