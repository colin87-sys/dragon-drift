// Dragon roster. No longer reskins: each dragon has its own stats, model
// proportions and particle FX, scaling with price — the most expensive is
// the best-performing AND the best-looking.
//
// stats are multipliers on the CONFIG flight model:
//   speed    — base/boost/orb speed
//   handling — lateral + vertical steering speed
//   drain    — stamina drain while boosting (lower = better)
//   regen    — stamina regen rate
// Handling always scales at least as fast as speed so the generated course
// (tuned around CONFIG reach math) only ever gets EASIER to thread on a
// faster dragon, never tighter.
//
// model tweaks the procedural build in dragon.js; fx drives trail colors and
// the idle aura (flagship dragons glow without needing Dragon Surge).
export const DRAGONS = {
  azure: {
    name: 'Azure Drake',
    title: 'The trusted courier',
    cost: 0,
    stats: { speed: 1.0, handling: 1.0, drain: 1.0, regen: 1.0 },
    model: {
      scale: 1.0, wingScale: 1.0, tailSegments: 9, neckSegments: 4,
      hornLen: 1.15, hornPairs: 1, ridgeCount: 12, flapBias: 1.0,
    },
    stages: [
      // hatchling (tier 0): smaller, rounder, large eyes
      { scale: 0.84, eyeScale: 1.28, hornLen: 0.88, ridgeCount: 9, tailSegments: 7, neckSegments: 3 },
      // adolescent (tier 1–2): current model
      {},
      // apex (tier 3–5): distinguished silhouette
      { scale: 1.06, ridgeCount: 15, crest: 2, dorsal: true, glowSeams: true },
    ],
    fx: { auraColor: '255,130,235', auraIdle: 0, sparkle: false },
    body: 0x2b58c8, belly: 0xffd9a8, scales: 0x9fe8ff, horn: 0xffdf8a,
    wingInner: 0xff8a3c, wingOuter: 0xd91f1f, wingEmissive: 0xff5222,
    eye: 0x55e0ff, trail: 0xffc080, boostTrail: 0x88aaff,
  },
  ember: {
    name: 'Ember Wyrm',
    title: 'Forged in cinder',
    cost: 600,
    stats: { speed: 1.04, handling: 1.06, drain: 0.95, regen: 1.05 },
    model: {
      scale: 0.97, wingScale: 1.04, tailSegments: 9, neckSegments: 4,
      hornLen: 1.35, hornPairs: 1, ridgeCount: 14, flapBias: 1.08,
    },
    stages: [
      { scale: 0.83, eyeScale: 1.25, hornLen: 1.0, ridgeCount: 10, tailSegments: 7 },
      {},
      { scale: 1.02, armorPlates: true, glowSeams: true, ridgeCount: 18, hornLen: 1.62 },
    ],
    fx: { auraColor: '255,160,80', auraIdle: 0, sparkle: false },
    body: 0xb83820, belly: 0xffd9a8, scales: 0xffb060, horn: 0xffe8a0,
    wingInner: 0xffc23c, wingOuter: 0xb81f60, wingEmissive: 0xff8022,
    eye: 0xffd060, trail: 0xffd080, boostTrail: 0xffa060,
  },
  jade: {
    name: 'Jade Serpent',
    title: 'River-wind dancer',
    cost: 1200,
    stats: { speed: 1.07, handling: 1.11, drain: 0.9, regen: 1.1 },
    model: {
      scale: 0.95, wingScale: 0.96, tailSegments: 12, neckSegments: 6,
      hornLen: 0.9, hornPairs: 1, ridgeCount: 16, flapBias: 1.15,
    },
    stages: [
      { scale: 0.82, eyeScale: 1.3, hornLen: 0.65, ridgeCount: 12, tailSegments: 9, neckSegments: 4 },
      {},
      { scale: 0.99, whiskers: true, tailTip: 'fan', neckSegments: 8, ridgeCount: 20 },
    ],
    fx: { auraColor: '120,255,190', auraIdle: 0, sparkle: false },
    body: 0x1f9a60, belly: 0xe8ffd0, scales: 0xa0ffd0, horn: 0xffe8a0,
    wingInner: 0x60e8a0, wingOuter: 0x106a8a, wingEmissive: 0x40e890,
    eye: 0xa0ffc0, trail: 0xa0ffd0, boostTrail: 0x50e8b0,
  },
  obsidian: {
    name: 'Obsidian Shade',
    title: 'Night given wings',
    cost: 2200,
    stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },
    model: {
      scale: 1.02, wingScale: 1.1, tailSegments: 11, neckSegments: 5,
      hornLen: 1.5, hornPairs: 2, ridgeCount: 14, flapBias: 1.05,
    },
    stages: [
      { scale: 0.86, eyeScale: 1.2, hornLen: 1.1, ridgeCount: 10, tailSegments: 8, hornPairs: 1 },
      {},
      { scale: 1.08, crest: 3, glowSeams: true, wingScale: 1.22 },
    ],
    fx: { auraColor: '170,90,255', auraIdle: 0.1, sparkle: false },
    body: 0x282038, belly: 0x6a5a8a, scales: 0xb090ff, horn: 0xd0c0ff,
    wingInner: 0x8a40ff, wingOuter: 0xff2080, wingEmissive: 0xa040ff,
    eye: 0xff60c0, trail: 0xc090ff, boostTrail: 0xb060ff,
  },
  pearl: {
    name: 'Pearl Seraph',
    title: 'Dawn incarnate',
    cost: 3400,
    stats: { speed: 1.13, handling: 1.22, drain: 0.78, regen: 1.25 },
    model: {
      scale: 1.05, wingScale: 1.18, tailSegments: 10, neckSegments: 5,
      hornLen: 1.3, hornPairs: 1, ridgeCount: 12, flapBias: 0.95,
    },
    stages: [
      { scale: 0.87, eyeScale: 1.25, hornLen: 1.0, ridgeCount: 9, tailSegments: 8 },
      {},
      { scale: 1.1, wingShape: 'feather', crest: 2, whiskers: true, wingScale: 1.26 },
    ],
    fx: { auraColor: '255,230,150', auraIdle: 0.14, sparkle: true },
    body: 0xe8e8f0, belly: 0xffe8c0, scales: 0xfff0d0, horn: 0xffd060,
    wingInner: 0xffe080, wingOuter: 0xff8040, wingEmissive: 0xffc040,
    eye: 0x80c0ff, trail: 0xffe8a0, boostTrail: 0xffd870,
  },
  solar: {
    name: 'Solar Sovereign',
    title: 'Apex of the skies',
    cost: 5000,
    stats: { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 },
    model: {
      scale: 1.1, wingScale: 1.28, tailSegments: 12, neckSegments: 6,
      hornLen: 1.7, hornPairs: 2, ridgeCount: 18, flapBias: 1.1,
    },
    stages: [
      { scale: 0.9, eyeScale: 1.2, hornLen: 1.25, ridgeCount: 14, tailSegments: 9, hornPairs: 1 },
      {},
      { scale: 1.18, armorPlates: true, crest: 3, glowSeams: true, wingScale: 1.36 },
    ],
    fx: { auraColor: '255,200,90', auraIdle: 0.22, sparkle: true },
    body: 0xd88a18, belly: 0xfff0c8, scales: 0xffe070, horn: 0xfff0b0,
    wingInner: 0xffd84a, wingOuter: 0xff4a18, wingEmissive: 0xffaa20,
    eye: 0xfff0a0, trail: 0xffe060, boostTrail: 0xffb030,
  },
};

// Highest multipliers in the roster (for shop stat-bar normalisation).
export const DRAGON_STAT_CAP = { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 };
