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
    // The humble free starter: the smallest, NARROWEST, cleanest wings in the
    // roster (a nimble messenger), so the premiums feel rare. Sky-blue + gold.
    stats: { speed: 1.0, handling: 1.0, drain: 1.0, regen: 1.0 },
    model: {
      scale: 1.0, wingScale: 0.95, tailSegments: 8, neckSegments: 4,
      hornLen: 1.0, hornPairs: 1, ridgeCount: 12,
      flapBias: 1.18, flapAmp: 0.85, // quick, light courier wingbeat
    },
    // Narrow, short, clean wings — the most compact silhouette of the roster.
    wingForms: [
      { tips: [[3.90, 0.28], [3.00, -0.40], [1.90, -0.66]],
        lead: [2.50, 0.42], scallop: 0.16, flame: false,
        arc: { bow: 0.50, hump: 0.0, humpAt: 0.6, hook: 0.10 } },
      { tips: [[4.40, 0.30], [3.50, -0.44], [2.30, -0.82], [1.30, -0.85]],
        lead: [2.90, 0.50], scallop: 0.28, flame: false,
        arc: { bow: 0.55, hump: 0.40, humpAt: 0.55, hook: 0.18 } },
      { tips: [[4.70, 0.34], [3.85, -0.48], [2.60, -0.95], [1.45, -1.00]],
        lead: [3.15, 0.56], scallop: 0.40, flame: false,
        arc: { bow: 0.60, hump: 0.70, humpAt: 0.57, hook: 0.30 } },
      { tips: [[4.95, 0.38], [4.10, -0.50], [2.85, -1.00], [1.60, -1.05]],
        lead: [3.35, 0.62], scallop: 0.45, flame: false,
        arc: { bow: 0.65, hump: 1.00, humpAt: 0.58, hook: 0.45 } },
    ],
    forms: [
      { wingForm: 0, tailStyle: 'simple', tailSegments: 5, ridgeCount: 8,
        spineGlow: 0, crest: 0, neckSegments: 4,
        colors: { body: 0x1c2230, wingInner: 0x3a5a8a, wingOuter: 0x223f5e,
          wingEmissive: 0x3a6a9a, scales: 0x5a7890, horn: 0x7a90a8,
          apexSeam: 0x4a6080, eye: 0x6aa0c0, coreGlow: 0x6a90c0 } },
      { wingForm: 1, tailStyle: 'finned', tailSegments: 6, ridgeCount: 10,
        spineGlow: 0.28, crest: 1, dorsal: true,
        colors: { body: 0x1a2a44, wingInner: 0x4a8ad8, wingOuter: 0x2a5aa8,
          wingEmissive: 0x4a90ff, scales: 0x9fe8ff, horn: 0xffdf8a,
          apexSeam: 0x5aa8e0, eye: 0x88c8ff, coreGlow: 0x80b0ff } },
      { wingForm: 2, tailStyle: 'blade', tailSegments: 7, ridgeCount: 11,
        spineGlow: 0.55, wingVeins: true, glowSeams: true, crest: 1, hornLen: 1.3,
        colors: { body: 0x16243c, wingInner: 0x60a8ff, wingOuter: 0x2a6ad0,
          wingEmissive: 0x5aa0ff, scales: 0xbfe8ff, horn: 0xffe8a0,
          apexSeam: 0x7ac0ff, eye: 0xa0d8ff, coreGlow: 0x90c8ff } },
      { wingForm: 3, tailStyle: 'comet', tailSegments: 8, ridgeCount: 12,
        spineGlow: 0.82, wingVeins: true, glowSeams: true, crest: 2,
        colors: { body: 0x121f34, wingInner: 0x7ab8ff, wingOuter: 0x3a7ae0,
          wingEmissive: 0x6ab0ff, scales: 0xdcf0ff, horn: 0xffe8a0,
          apexSeam: 0x88d0ff, eye: 0xcaeaff, coreGlow: 0xaad8ff } },
    ],
    fx: { auraColor: '120,200,255', auraIdle: 0.0, sparkle: false },
    body: 0x121f34, belly: 0xffd9a8, scales: 0xdcf0ff, horn: 0xffe8a0,
    wingInner: 0x7ab8ff, wingOuter: 0x3a7ae0, wingEmissive: 0x6ab0ff,
    apexEye: 0xcaeaff, apexSeam: 0x88d0ff, coreGlow: 0xaad8ff, surgeHi: 0xeaf6ff,
    eye: 0x88c8ff, trail: 0x88c0ff, boostTrail: 0x88aaff,
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
          scales: 0x37343f, horn: 0x4a4658, eye: 0x5a8a98, apexSeam: 0x49555f,
          coreGlow: 0x2a5560, body: 0x161620 } },
      // T1 — Nightwing: plasma ignites, ear frills, wider swept wings, finned tail.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 9,
        spineGlow: 0.3, earTendrils: true, eyeScale: 1.3,
        colors: { wingInner: 0x26233a, wingOuter: 0x141a26, wingEmissive: 0x00ccff,
          scales: 0x4a3f70, horn: 0x6a5fa0, eye: 0x33e0ff, apexSeam: 0x00e5ff,
          coreGlow: 0x00c0e0, body: 0x14131c } },
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
    apexEye: 0x00ffee, apexSeam: 0x00e5ff, coreGlow: 0x00e5ff, surgeHi: 0xe8fcff,
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
      // FORM 1 — Ember Hatchling: small, clean, charcoal body + muted bronze,
      // subdued ember wings, a faint violet core. Cleanest readability.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 5, ridgeCount: 8,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 1.0, neckSegments: 5,
        colors: { body: 0x1b1a1f, wingInner: 0xc85c28, wingOuter: 0x8a3a1c,
          wingEmissive: 0x7a3514, scales: 0x6f4a2c, horn: 0x8a6a48,
          apexSeam: 0x6f4a2c, eye: 0xb08850, coreGlow: 0x9b7bff } },
      // FORM 2 — Sunflare Drake: brighter orange-red wings with deep-red edges,
      // blackened-bronze body, stronger violet core, a subtle spine.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 12,
        spineGlow: 0.34, crest: 1, dorsal: true, hornLen: 1.25,
        colors: { body: 0x221a18, wingInner: 0xe96a1c, wingOuter: 0xc93a18,
          wingEmissive: 0xe9541c, scales: 0xa8682f, horn: 0xc08a50,
          apexSeam: 0xa8682f, eye: 0xffcf6a, coreGlow: 0xa270ff } },
      // FORM 3 — Royal Dusk Dragon: obsidian body, luminous-gold spine plates,
      // ember wings with scarlet structure, amethyst core. Mature + elegant.
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 14,
        spineGlow: 0.7, wingVeins: true, glowSeams: true,
        crest: 2, hornPairs: 2, hornLen: 1.5, tusks: true, neckSegments: 6,
        colors: { body: 0x18151d, wingInner: 0xff6d1f, wingOuter: 0xd93a1e,
          wingEmissive: 0xff5a14, scales: 0xf2c35b, horn: 0xffe090,
          apexSeam: 0xf2c35b, eye: 0xffe49a, coreGlow: 0xb27bff } },
      // FORM 4 — SOVEREIGN: deep-obsidian body, imperial-gold spine + crown,
      // ember-orange wing roots gradient to a premium rose-magenta outer edge,
      // amethyst-violet core/halo. Regal, legendary — still readable.
      { wingForm: 3, tailStyle: 'comet', tailSegments: 9, ridgeCount: 16,
        spineGlow: 1.0, wingVeins: true, glowSeams: true,
        backCrest: true, auraHalo: true, crest: 3, hornLen: 1.7,
        colors: { body: 0x120f18, wingInner: 0xff7a1a, wingOuter: 0xff5fa8,
          wingEmissive: 0xff5a1e, scales: 0xffd166, horn: 0xfff0a8,
          apexSeam: 0xffd166, eye: 0xfff0a8, coreGlow: 0xb784ff } },
    ],
    fx: { auraColor: '255,150,40', auraIdle: 0.0, sparkle: false },
    body: 0x120f18, belly: 0x3a2a16, scales: 0xffd166, horn: 0xfff0a8,
    // Membrane gradient runs ember-orange at the ROOT → rose-magenta at the
    // outer edge (apex), a premium accent — never a solid-pink wing.
    wingInner: 0xff7a1a, wingOuter: 0xff5fa8, wingEmissive: 0xff5a1e,
    apexEye: 0xfff0a8, apexSeam: 0xffd166, coreGlow: 0xb784ff, surgeHi: 0xfff8e8,
    eye: 0xffd86a, trail: 0xffb030, boostTrail: 0xff6a20,
  },

  phoenix: {
    name: 'Phoenix Ascendant',
    title: 'Reborn in fire',
    rarity: 'SSSR',
    cost: 6000,
    // The new apex unlockable — a molten fire-BIRD, not a wyvern: broad upswept
    // feathered flame wings, a flowing fire-fan tail, a white-gold heart-fire
    // core. Pure fire (gold/white-hot, no magenta) sets it apart from Solar.
    stats: { speed: 1.16, handling: 1.26, drain: 0.72, regen: 1.34 },
    model: {
      scale: 1.2, wingScale: 1.32, tailSegments: 9, neckSegments: 5,
      hornLen: 1.4, hornPairs: 1, ridgeCount: 15,
      flapBias: 0.95, flapAmp: 0.88, // broad, powerful, majestic wingbeat
    },
    // Broad, UPSWEPT, shallow-chord wings (a spreading bird) with flame-feather
    // edges — vs Solar's swept-back deep membrane.
    wingForms: [
      { tips: [[4.30, 0.50], [3.50, -0.10], [2.40, -0.52], [1.30, -0.70]],
        lead: [2.85, 0.70], scallop: 0.30, flame: false,
        arc: { bow: 0.70, hump: 0.60, humpAt: 0.50, hook: 0.30 } },
      { tips: [[4.90, 0.55], [4.00, -0.05], [2.80, -0.56], [1.50, -0.78]],
        lead: [3.20, 0.78], scallop: 0.40, flame: false,
        arc: { bow: 0.80, hump: 0.95, humpAt: 0.52, hook: 0.42 } },
      { tips: [[5.30, 0.60], [4.40, 0.00], [3.10, -0.60], [1.70, -0.86]],
        lead: [3.50, 0.86], scallop: 0.50, flame: true,
        arc: { bow: 0.90, hump: 1.35, humpAt: 0.55, hook: 0.65 } },
      { tips: [[5.60, 0.66], [4.70, 0.06], [3.40, -0.60], [2.00, -0.90], [1.00, -0.82]],
        lead: [3.80, 0.94], scallop: 0.50, flame: true,
        arc: { bow: 1.00, hump: 1.85, humpAt: 0.58, hook: 1.05 } },
    ],
    forms: [
      // FORM 1 — Ember Chick: small, dull charcoal + muted ember, a tiny crest.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 6, ridgeCount: 8,
        spineGlow: 0, crest: 1, hornPairs: 1, hornLen: 1.0, neckSegments: 5,
        colors: { body: 0x1a1410, wingInner: 0xc8541c, wingOuter: 0x8a3a14,
          wingEmissive: 0x6e2e10, scales: 0x8a6038, horn: 0xa07a4a,
          apexSeam: 0x6e4a28, eye: 0xc89050, coreGlow: 0xd88840 } },
      // FORM 2 — Flame Fledgling: brighter ember, a dorsal ridge, finned tail.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 11,
        spineGlow: 0.3, crest: 2, dorsal: true,
        colors: { body: 0x201712, wingInner: 0xff6a1c, wingOuter: 0xd9381a,
          wingEmissive: 0xff5a14, scales: 0xd99040, horn: 0xf0b060,
          apexSeam: 0xe09038, eye: 0xffc060, coreGlow: 0xffb050 } },
      // FORM 3 — Blaze Phoenix: vivid fire, glowing spine + veins, the fire-fan
      // tail emerges. Fast, radiant.
      { wingForm: 2, tailStyle: 'firefan', tailSegments: 8, ridgeCount: 13,
        spineGlow: 0.65, wingVeins: true, glowSeams: true, crest: 2, hornLen: 1.3,
        colors: { body: 0x18130f, wingInner: 0xff7a1a, wingOuter: 0xff4a14,
          wingEmissive: 0xff6a1e, scales: 0xffc24a, horn: 0xffe090,
          apexSeam: 0xffb030, eye: 0xffe090, coreGlow: 0xffd060 } },
      // FORM 4 — PHOENIX ASCENDANT: widest upswept wings → GOLD tips (pure fire,
      // no magenta), blazing white-gold spine + heart-fire core, full fire-fan
      // tail, crown crest. Legendary rebirth.
      { wingForm: 3, tailStyle: 'firefan', tailSegments: 9, ridgeCount: 15,
        spineGlow: 1.0, wingVeins: true, glowSeams: true,
        backCrest: true, auraHalo: true, crest: 3, hornLen: 1.4,
        colors: { body: 0x140f0c, wingInner: 0xff8a20, wingOuter: 0xffd060,
          wingEmissive: 0xff7a1e, scales: 0xffe49a, horn: 0xfff0c0,
          apexSeam: 0xffe07a, eye: 0xfff0c0, coreGlow: 0xffe88a } },
    ],
    fx: { auraColor: '255,140,40', auraIdle: 0.0, sparkle: false },
    body: 0x140f0c, belly: 0x3a2a16, scales: 0xffe49a, horn: 0xfff0c0,
    wingInner: 0xff8a20, wingOuter: 0xffd060, wingEmissive: 0xff7a1e,
    apexEye: 0xfff0c0, apexSeam: 0xffe07a, coreGlow: 0xffe88a, surgeHi: 0xfff8e8,
    eye: 0xffd86a, trail: 0xff8030, boostTrail: 0xffb050,
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
