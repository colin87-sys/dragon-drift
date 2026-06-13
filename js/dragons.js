// Dragon roster. Each dragon is an individual creature with a distinct
// silhouette and palette, evolving across 4 forms (base + 3 paid upgrades),
// gacha-style R → SR → SSR → SSSR. Price escalates stats AND visual drama.
//
// stats : multipliers on the CONFIG flight model (speed/handling/drain/regen)
// model : base proportions fed to the builder (this is also the FINAL size;
//         SIZE_RAMP in ascension.js shrinks the earlier forms)
// forms[0..3]: parts that ACCRETE at each form (cumulative — never removed).
//         Every upgrade bolts on something obvious from the chase camera; the
//         final form is the earned, glowing, fully-decked apex.
// fx    : trail colors + idle aura (premium dragons glow without Dragon Surge)
// apexEye/apexSeam: premium palette that switches in from form 2
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
      scale: 1.05, wingScale: 1.0, tailSegments: 8, neckSegments: 4,
      hornLen: 1.1, hornPairs: 1, ridgeCount: 10, flapBias: 1.0,
    },
    // Humble starter: stays the simplest even maxed, so the premiums feel rare.
    forms: [
      {},                                                        // base — bare drake
      { ridgeCount: 13, dorsal: true, crest: 1 },                // +back sail + small crest
      { crest: 2, hornLen: 1.35, glowSeams: true },              // +bigger crest/horns + seams
      { tailTip: 'fan', sparkle: true },                         // apex — fan tail + sparkle
    ],
    fx: { auraColor: '120,200,255', auraIdle: 0, sparkle: false },
    body: 0x2b58c8, belly: 0xffd9a8, scales: 0x9fe8ff, horn: 0xffdf8a,
    wingInner: 0x6aa8ff, wingOuter: 0x1f3fb0, wingEmissive: 0x4a90ff,
    eye: 0x55e0ff, trail: 0x88c0ff, boostTrail: 0x88aaff,
  },

  ember: {
    name: 'Ember Wyrm',
    title: 'Forged in cinder',
    rarity: 'SR',
    cost: 600,
    stats: { speed: 1.04, handling: 1.06, drain: 0.95, regen: 1.05 },
    model: {
      scale: 1.04, wingScale: 1.05, tailSegments: 8, neckSegments: 4,
      hornLen: 1.35, hornPairs: 1, ridgeCount: 12, flapBias: 1.08,
    },
    forms: [
      {},                                                        // base
      { backSpines: true, crest: 1, ridgeCount: 14 },            // +back-spines + crest
      { armorPlates: true, crest: 2, hornLen: 1.7 },             // +shoulder armor + horn crown
      { maceTail: true, glowSeams: true, secondWingPair: true, hornPairs: 2, sparkle: true }, // apex
    ],
    fx: { auraColor: '255,150,70', auraIdle: 0, sparkle: false },
    body: 0xb83820, belly: 0xffd9a8, scales: 0xffb060, horn: 0xffe8a0,
    wingInner: 0xffc23c, wingOuter: 0xb81f30, wingEmissive: 0xff7022,
    eye: 0xffd060, trail: 0xffa040, boostTrail: 0xffc060,
  },

  jade: {
    name: 'Jade Serpent',
    title: 'River-wind dancer',
    rarity: 'SR',
    cost: 1200,
    stats: { speed: 1.07, handling: 1.11, drain: 0.9, regen: 1.1 },
    model: {
      scale: 1.02, wingScale: 0.98, tailSegments: 9, neckSegments: 6,
      hornLen: 0.9, hornPairs: 1, ridgeCount: 14, flapBias: 1.15,
    },
    forms: [
      {},                                                        // base
      { whiskers: true, neckSegments: 7, tailSegments: 11 },     // +whiskers + longer serpent
      { crest: 2, tailTip: 'fan', glowSeams: true },             // +fin-crest + fan tail + seams
      { secondWingPair: true, neckSegments: 8, sparkle: true },  // apex
    ],
    fx: { auraColor: '120,255,190', auraIdle: 0, sparkle: false },
    body: 0x1f9a60, belly: 0xe8ffd0, scales: 0xa0ffd0, horn: 0xffe8a0,
    wingInner: 0x60e8a0, wingOuter: 0x106a8a, wingEmissive: 0x40e890,
    eye: 0xa0ffc0, trail: 0x70ffc0, boostTrail: 0x50e8b0,
  },

  obsidian: {
    name: 'Obsidian Shade',
    title: 'Night given wings',
    rarity: 'SSR',
    cost: 2200,
    // Night-fury interceptor: a sleek near-black drake with NARROW SWEPT wings
    // (a falcon, not Solar's broad flame-wyvern), big almond eyes, twin tail
    // fins and a plasma-cyan glow. Its own silhouette — see wingForms below.
    stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },
    model: {
      scale: 1.12, wingScale: 1.12, tailSegments: 9, neckSegments: 5,
      hornLen: 1.1, hornPairs: 1, ridgeCount: 10, eyeScale: 1.25,
      flapBias: 1.2, flapAmp: 0.78, // quick, agile wingbeat — not Solar's glide
    },
    // Narrow, swept-back, low-arc wings (vs Solar's wide flared flame wings).
    wingForms: [
      { tips: [[4.20, 0.10], [3.35, -0.72], [2.10, -1.02]],
        lead: [2.85, 0.32], scallop: 0.12, flame: false,
        arc: { bow: 0.55, hump: 0.0, humpAt: 0.6, hook: 0.1 } },
      { tips: [[4.70, 0.12], [3.85, -0.80], [2.55, -1.18], [1.45, -1.12]],
        lead: [3.20, 0.36], scallop: 0.16, flame: false,
        arc: { bow: 0.65, hump: 0.35, humpAt: 0.56, hook: 0.16 } },
      { tips: [[5.05, 0.16], [4.20, -0.86], [2.90, -1.28], [1.60, -1.22]],
        lead: [3.50, 0.42], scallop: 0.18, flame: false,
        arc: { bow: 0.75, hump: 0.55, humpAt: 0.58, hook: 0.28 } },
      { tips: [[5.40, 0.20], [4.55, -0.88], [3.25, -1.34], [1.95, -1.32], [1.00, -1.10]],
        lead: [3.75, 0.50], scallop: 0.18, flame: false,
        arc: { bow: 0.85, hump: 0.70, humpAt: 0.60, hook: 0.42 } },
    ],
    forms: [
      // T0 — Shadeling: small, plain near-black drake, big eyes, plasma dormant.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 6, ridgeCount: 7,
        spineGlow: 0, crest: 0, eyeScale: 1.3, neckSegments: 5,
        colors: { wingInner: 0x1c1b24, wingOuter: 0x121118, wingEmissive: 0x36424c,
          scales: 0x37343f, horn: 0x4a4658, eye: 0x5a8a98, apexSeam: 0x49555f, body: 0x161620 } },
      // T1 — Nightwing: plasma ignites, ear frills, wider swept wings, finned tail.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 9,
        spineGlow: 0.3, earTendrils: true, eyeScale: 1.3,
        colors: { wingInner: 0x26233a, wingOuter: 0x141a26, wingEmissive: 0x00ccff,
          scales: 0x4a3f70, horn: 0x6a5fa0, eye: 0x33e0ff, apexSeam: 0x00e5ff, body: 0x14131c } },
      // T2 — Plasma Shade: plasma seams + glowing spine + wing veins, blade tail.
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 9,
        spineGlow: 0.7, wingVeins: true, glowSeams: true, earTendrils: true, crest: 1 },
      // T3 — Night Sovereign: widest swept wings, TWIN TAIL FINS, full plasma.
      { wingForm: 3, tailStyle: 'twinfin', tailSegments: 9, ridgeCount: 10,
        spineGlow: 1.0, wingVeins: true, glowSeams: true, earTendrils: true,
        crest: 1, sparkle: true },
    ],
    fx: { auraColor: '0,225,255', auraIdle: 0.0, sparkle: false },
    body: 0x14131c, belly: 0x2c2740, scales: 0x4a3f70, horn: 0x6a5fa0,
    wingInner: 0x26233a, wingOuter: 0x141a26, wingEmissive: 0x00ccff,
    apexEye: 0x00ffee, apexSeam: 0x00e5ff,
    eye: 0x33e0ff, trail: 0x00d8ff, boostTrail: 0x40f0ff,
  },

  pearl: {
    name: 'Pearl Seraph',
    title: 'Dawn incarnate',
    rarity: 'SSR',
    cost: 3400,
    // Blue-Eyes / celestial seraph: luminous white, sapphire eyes, gold accents.
    stats: { speed: 1.13, handling: 1.22, drain: 0.78, regen: 1.25 },
    model: {
      scale: 1.12, wingScale: 1.18, tailSegments: 9, neckSegments: 5,
      hornLen: 1.3, hornPairs: 1, ridgeCount: 12, flapBias: 0.95,
    },
    forms: [
      {},                                                        // base
      { bladeFins: true, wingShape: 'feather' },                // +blade-fins + feathered wings
      { crest: 2, glowSeams: true, halo: true },                // +crest + halo + seams
      { secondWingPair: true, whiskers: true, sparkle: true },  // apex
    ],
    fx: { auraColor: '150,200,255', auraIdle: 0.16, sparkle: true },
    body: 0xeef2ff, belly: 0xfff4d8, scales: 0xdce8ff, horn: 0xffd86a,
    wingInner: 0xeaf4ff, wingOuter: 0x3a7bff, wingEmissive: 0x88b8ff,
    apexEye: 0x2a6bff, apexSeam: 0xfff2c0,
    eye: 0x6aa8ff, trail: 0xcfe4ff, boostTrail: 0x9fd0ff,
  },

  solar: {
    name: 'Solar Sovereign',
    title: 'Apex of the skies',
    rarity: 'SSSR',
    cost: 5000,
    // A legendary solar/fire wyvern-racing mount: obsidian-black body, molten
    // core glow, gold highlights, crimson flame-wings. The benchmark redesign —
    // each form is a distinct rear-view silhouette, not the same shape rescaled
    // (see the per-form wingForm / tailStyle / spineGlow ramp below).
    stats: { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 },
    // Base model holds the APEX reference proportions; each form dials the
    // per-stage silhouette. Cumulative: later forms override earlier keys.
    model: {
      scale: 1.22, wingScale: 1.3, tailSegments: 9, neckSegments: 6,
      hornLen: 1.7, hornPairs: 2, ridgeCount: 16,
      flapBias: 0.8, flapAmp: 0.6, // slow, gliding, majestic wingbeat
    },
    forms: [
      // T0 — Solar Whelp: a genuinely small baby. Stubby straight glider wings,
      // short clean tail, no spine glow, no aura, and a DULL muted-bronze palette
      // so the vivid T1 "ignition" is worth chasing.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 5, ridgeCount: 8,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 1.0, neckSegments: 5,
        colors: { wingInner: 0x5a2a18, wingOuter: 0x9c6334, wingEmissive: 0x6e3712,
          scales: 0xb6975c, horn: 0xc7a774, eye: 0xc2a558, body: 0x231a12 } },
      // T1 — Kindled Drake: it ignites. Vivid palette returns, wider wings with a
      // small wrist elbow, a dorsal ridge + sail, a longer finned tail.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 12,
        spineGlow: 0.34, crest: 1, dorsal: true, hornLen: 1.25,
        colors: { wingInner: 0x9a2310, wingOuter: 0xffb43a, wingEmissive: 0xff5a14,
          scales: 0xffc24a, horn: 0xffe08a, eye: 0xffd86a, body: 0x18110b } },
      // T2 — Radiant Wyvern: elite. Swept wings with a strong elbow + hooked tip,
      // glowing veins, a bright keel spine, a clean blade tail. Fast, premium.
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 14,
        spineGlow: 0.7, wingVeins: true, glowSeams: true,
        crest: 2, hornPairs: 2, hornLen: 1.5, tusks: true, neckSegments: 6 },
      // T3 — Solar Sovereign: apex. Widest framing wings, pronounced elbow +
      // flared flame tips, blazing solar spine, heroic back-crest, forked comet
      // tail, a subtle backlight. Legendary — and the centre lane stays open.
      { wingForm: 3, tailStyle: 'comet', tailSegments: 9, ridgeCount: 16,
        spineGlow: 1.0, wingVeins: true, glowSeams: true,
        backCrest: true, auraHalo: true, crest: 3, hornLen: 1.7 },
    ],
    fx: { auraColor: '255,150,40', auraIdle: 0.0, sparkle: false },
    body: 0x18110b, belly: 0x3a2a16, scales: 0xffc24a, horn: 0xffe08a,
    // Gradient runs crimson at the root → bright gold at the TIP, so the bowed
    // outer wing glows against the sky (drama at the edges, dark near centre).
    wingInner: 0x9a2310, wingOuter: 0xffb43a, wingEmissive: 0xff5a14,
    apexEye: 0xfff0a0, apexSeam: 0xff7a18,
    eye: 0xffd86a, trail: 0xffb030, boostTrail: 0xff6a20,
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
