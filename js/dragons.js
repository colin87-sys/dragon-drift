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
    maxRarity: 'SSR',   // starter: evolution caps at SSR, never SSSR
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
      // Restrained starter apex: clean finned tail (not the premium comet) and a
      // softer glow so it reads SSR, well below the eternal premiums.
      { wingForm: 3, tailStyle: 'finned', tailSegments: 8, ridgeCount: 12,
        spineGlow: 0.6, wingVeins: true, crest: 1,
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
    maxRarity: 'SSR',   // starter: evolution caps at SSR, never SSSR
    cost: 600,
    // A brutish CINDER-WYRM: broad, JAGGED flame-edged wings, a spiked back and
    // lava-crack seams — stockier and more aggressive than Solar's elegant
    // flame. Dark-cinder → bright lava.
    stats: { speed: 1.04, handling: 1.06, drain: 0.95, regen: 1.05 },
    model: {
      scale: 1.08, wingScale: 1.15, tailSegments: 8, neckSegments: 4,
      hornLen: 1.4, hornPairs: 2, ridgeCount: 14,
      flapBias: 1.0, flapAmp: 0.95, // heavy, powerful wingbeat
    },
    // Broad wings with deep, JAGGED flame notches (aggressive cinder edges).
    wingForms: [
      { tips: [[4.30, 0.34], [3.50, -0.46], [2.30, -0.80]],
        lead: [2.90, 0.50], scallop: 0.34, flame: false,
        arc: { bow: 0.55, hump: 0.30, humpAt: 0.55, hook: 0.20 } },
      { tips: [[4.85, 0.38], [4.00, -0.50], [2.70, -0.95], [1.50, -1.00]],
        lead: [3.30, 0.58], scallop: 0.50, flame: true,
        arc: { bow: 0.60, hump: 0.70, humpAt: 0.55, hook: 0.35 } },
      { tips: [[5.20, 0.42], [4.35, -0.52], [3.00, -1.05], [1.65, -1.10]],
        lead: [3.60, 0.64], scallop: 0.60, flame: true,
        arc: { bow: 0.70, hump: 1.10, humpAt: 0.57, hook: 0.55 } },
      { tips: [[5.45, 0.46], [4.60, -0.52], [3.25, -1.10], [1.90, -1.15], [1.00, -0.95]],
        lead: [3.80, 0.70], scallop: 0.60, flame: true,
        arc: { bow: 0.80, hump: 1.50, humpAt: 0.58, hook: 0.85 } },
    ],
    forms: [
      { wingForm: 0, tailStyle: 'simple', tailSegments: 6, ridgeCount: 10,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 1.1,
        colors: { body: 0x231410, wingInner: 0xa83820, wingOuter: 0x6e1e16,
          wingEmissive: 0x7a2410, scales: 0x8a4828, horn: 0xb87848,
          apexSeam: 0x7a3418, eye: 0xd07040, coreGlow: 0xe05828 } },
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 13,
        spineGlow: 0.32, backSpines: true, crest: 1,
        colors: { body: 0x2a1510, wingInner: 0xe85628, wingOuter: 0xb81f20,
          wingEmissive: 0xff5a20, scales: 0xffa050, horn: 0xffc878,
          apexSeam: 0xff6a28, eye: 0xff9040, coreGlow: 0xff6030 } },
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 14,
        spineGlow: 0.7, backSpines: true, wingVeins: true, glowSeams: true,
        crest: 2, hornPairs: 2, hornLen: 1.6,
        colors: { body: 0x241310, wingInner: 0xff6a28, wingOuter: 0xd02418,
          wingEmissive: 0xff6a22, scales: 0xffb850, horn: 0xffd878,
          apexSeam: 0xff7a2a, eye: 0xffb050, coreGlow: 0xff7838 } },
      // Apex stays a notch BELOW the premium tier (no back-crest / no aura halo)
      // so the SSR+ dragons read as more awe-inspiring — Ember is brawn, not regalia.
      // Restrained SSR apex — softer glow, no premium seams.
      { wingForm: 3, tailStyle: 'blade', tailSegments: 9, ridgeCount: 15,
        spineGlow: 0.62, backSpines: true, wingVeins: true,
        hornPairs: 2, hornLen: 1.8, crest: 2,
        colors: { body: 0x1f1108, wingInner: 0xff7a2a, wingOuter: 0xff3a14,
          wingEmissive: 0xff6a1e, scales: 0xffcf60, horn: 0xffe690,
          apexSeam: 0xff8a2e, eye: 0xffd060, coreGlow: 0xff8a40 } },
    ],
    fx: { auraColor: '255,110,40', auraIdle: 0.0, sparkle: false },
    body: 0x1f1108, belly: 0xffd9a8, scales: 0xffcf60, horn: 0xffe690,
    wingInner: 0xff7a2a, wingOuter: 0xff3a14, wingEmissive: 0xff6a1e,
    apexEye: 0xffd060, apexSeam: 0xff8a2e, coreGlow: 0xff8a40, surgeHi: 0xfff0d8,
    eye: 0xff9040, trail: 0xffa040, boostTrail: 0xffc060,
  },

  jade: {
    name: 'Jade Serpent',
    title: 'River-wind dancer',
    rarity: 'SR',
    maxRarity: 'SSR',   // starter: evolution caps at SSR, never SSSR
    cost: 1200,
    // A serpentine EASTERN river-dragon: the SMALLEST wings of the roster on a
    // long sinuous body — long neck, long flowing tail, trailing whiskers. Its
    // silhouette is read by the body, not the wings. Jade → bright emerald.
    stats: { speed: 1.07, handling: 1.11, drain: 0.9, regen: 1.1 },
    model: {
      scale: 1.0, wingScale: 0.82, tailSegments: 11, neckSegments: 7,
      hornLen: 0.9, hornPairs: 1, ridgeCount: 14,
      flapBias: 1.25, flapAmp: 0.7, // small, quick serpent wings
    },
    // Small, narrow wings — secondary to the long serpentine body.
    wingForms: [
      { tips: [[3.40, 0.24], [2.60, -0.36], [1.60, -0.58]],
        lead: [2.10, 0.36], scallop: 0.16, flame: false,
        arc: { bow: 0.45, hump: 0.0, humpAt: 0.6, hook: 0.10 } },
      { tips: [[3.80, 0.28], [3.00, -0.40], [1.95, -0.70], [1.10, -0.74]],
        lead: [2.50, 0.44], scallop: 0.26, flame: false,
        arc: { bow: 0.50, hump: 0.35, humpAt: 0.55, hook: 0.16 } },
      { tips: [[4.10, 0.30], [3.30, -0.44], [2.20, -0.82], [1.25, -0.88]],
        lead: [2.75, 0.50], scallop: 0.36, flame: false,
        arc: { bow: 0.55, hump: 0.60, humpAt: 0.57, hook: 0.26 } },
      { tips: [[4.35, 0.34], [3.55, -0.46], [2.45, -0.88], [1.40, -0.92], [0.80, -0.78]],
        lead: [2.95, 0.56], scallop: 0.38, flame: false,
        arc: { bow: 0.60, hump: 0.85, humpAt: 0.58, hook: 0.40 } },
    ],
    forms: [
      { wingForm: 0, tailStyle: 'simple', tailSegments: 8, ridgeCount: 12,
        spineGlow: 0, crest: 0, neckSegments: 6,
        colors: { body: 0x14281c, wingInner: 0x2a6a48, wingOuter: 0x184438,
          wingEmissive: 0x2a7a5a, scales: 0x5a8a6a, horn: 0x8aa078,
          apexSeam: 0x3a6a52, eye: 0x6aa080, coreGlow: 0x3ac888 } },
      { wingForm: 1, tailStyle: 'finned', tailSegments: 10, ridgeCount: 14,
        spineGlow: 0.3, whiskers: true, neckSegments: 7, crest: 1,
        colors: { body: 0x123420, wingInner: 0x40c888, wingOuter: 0x107060,
          wingEmissive: 0x40e890, scales: 0xa0ffd0, horn: 0xffe8a0,
          apexSeam: 0x40d8a0, eye: 0xa0ffc0, coreGlow: 0x50e8b0 } },
      { wingForm: 2, tailStyle: 'finned', tailSegments: 11, ridgeCount: 15,
        spineGlow: 0.6, whiskers: true, wingVeins: true, glowSeams: true,
        crest: 2, neckSegments: 7,
        colors: { body: 0x103020, wingInner: 0x50e0a0, wingOuter: 0x108878,
          wingEmissive: 0x40f0a0, scales: 0xb0ffe0, horn: 0xffe8a0,
          apexSeam: 0x50f0c0, eye: 0xb0ffd0, coreGlow: 0x60f0c0 } },
      // SR apex: graceful, but no premium back-crest/halo (kept below the SSR+ tier).
      // Restrained SSR apex — clean finned tail, softer glow, no premium seams.
      { wingForm: 3, tailStyle: 'finned', tailSegments: 11, ridgeCount: 16,
        spineGlow: 0.62, whiskers: true, wingVeins: true,
        crest: 2, neckSegments: 8,
        colors: { body: 0x0e2c1e, wingInner: 0x60f0b0, wingOuter: 0x18a088,
          wingEmissive: 0x50ffb0, scales: 0xc8ffe8, horn: 0xfff0b0,
          apexSeam: 0x60ffd0, eye: 0xc8ffe0, coreGlow: 0x70ffd0 } },
    ],
    fx: { auraColor: '90,255,190', auraIdle: 0.0, sparkle: false },
    body: 0x0e2c1e, belly: 0xe8ffd0, scales: 0xc8ffe8, horn: 0xfff0b0,
    wingInner: 0x60f0b0, wingOuter: 0x18a088, wingEmissive: 0x50ffb0,
    apexEye: 0xc8ffe0, apexSeam: 0x60ffd0, coreGlow: 0x70ffd0, surgeHi: 0xeafff4,
    eye: 0xa0ffc0, trail: 0x70ffc0, boostTrail: 0x50e8b0,
  },

  obsidian: {
    name: 'Obsidian Shade',
    title: 'Night given wings',
    rarity: 'SSR',
    maxRarity: 'SSSR',
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
      // Obsidian crystal-shard tail — its own severe, shattered identity.
      { wingForm: 3, tailStyle: 'shard', tailSegments: 9, ridgeCount: 10,
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
    maxRarity: 'SSSR',
    cost: 3400,
    // A celestial SERAPH: broad, SMOOTH, high-raised angelic wings (no flame
    // notches), a luminous white-gold body, a head halo and blade-fins. Holy
    // white, set apart from Phoenix's flame-feather gold.
    stats: { speed: 1.13, handling: 1.22, drain: 0.78, regen: 1.25 },
    model: {
      scale: 1.12, wingScale: 1.2, tailSegments: 9, neckSegments: 5,
      hornLen: 1.3, hornPairs: 1, ridgeCount: 12,
      flapBias: 0.9, flapAmp: 0.82, // slow, graceful, lofty wingbeat
    },
    // Broad, smooth, strongly UP-RAISED wings (an angel spreading) — clean
    // edges, no flame.
    wingForms: [
      { tips: [[4.40, 0.42], [3.60, -0.10], [2.50, -0.50], [1.40, -0.72]],
        lead: [2.90, 0.62], scallop: 0.22, flame: false,
        arc: { bow: 0.75, hump: 0.70, humpAt: 0.50, hook: 0.30 } },
      { tips: [[4.95, 0.48], [4.10, -0.08], [2.90, -0.56], [1.60, -0.80]],
        lead: [3.30, 0.72], scallop: 0.30, flame: false,
        arc: { bow: 0.85, hump: 1.00, humpAt: 0.52, hook: 0.40 } },
      { tips: [[5.30, 0.54], [4.45, -0.02], [3.20, -0.62], [1.80, -0.88]],
        lead: [3.60, 0.80], scallop: 0.34, flame: false,
        arc: { bow: 0.95, hump: 1.40, humpAt: 0.55, hook: 0.60 } },
      { tips: [[5.55, 0.60], [4.70, 0.04], [3.45, -0.62], [2.05, -0.92], [1.05, -0.85]],
        lead: [3.85, 0.88], scallop: 0.34, flame: false,
        arc: { bow: 1.05, hump: 1.85, humpAt: 0.58, hook: 0.95 } },
    ],
    forms: [
      { wingForm: 0, tailStyle: 'simple', tailSegments: 6, ridgeCount: 10,
        spineGlow: 0, crest: 0,
        colors: { body: 0xb8c0d0, wingInner: 0xc8d4e8, wingOuter: 0x8a9ec0,
          wingEmissive: 0x90a8d0, scales: 0xc0cce0, horn: 0xd8b878,
          apexSeam: 0xa0b0d0, eye: 0x7a9ed0, coreGlow: 0xb0c8ff } },
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 12,
        spineGlow: 0.3, bladeFins: true, crest: 1,
        colors: { body: 0xdde6f5, wingInner: 0xeaf4ff, wingOuter: 0x6a9ae8,
          wingEmissive: 0x88b8ff, scales: 0xdce8ff, horn: 0xffd86a,
          apexSeam: 0xb8d8ff, eye: 0x6aa8ff, coreGlow: 0xbcd8ff } },
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 13,
        spineGlow: 0.65, bladeFins: true, glowSeams: true, halo: true, crest: 2,
        colors: { body: 0xe8eefc, wingInner: 0xf2f8ff, wingOuter: 0x5a8ae8,
          wingEmissive: 0xa0c8ff, scales: 0xe8f2ff, horn: 0xffe08a,
          apexSeam: 0xccddff, eye: 0x88c0ff, coreGlow: 0xccddff } },
      { wingForm: 3, tailStyle: 'comet', tailSegments: 9, ridgeCount: 14,
        spineGlow: 1.0, bladeFins: true, wingVeins: true, glowSeams: true,
        halo: true, backCrest: true, crest: 2,
        colors: { body: 0xf2f6ff, wingInner: 0xffffff, wingOuter: 0x6aa0f0,
          wingEmissive: 0xc0e0ff, scales: 0xf4faff, horn: 0xfff0b0,
          apexSeam: 0xe0ecff, eye: 0xaad8ff, coreGlow: 0xe8f2ff } },
    ],
    fx: { auraColor: '180,210,255', auraIdle: 0.08, sparkle: true },
    body: 0xf2f6ff, belly: 0xfff4d8, scales: 0xf4faff, horn: 0xfff0b0,
    wingInner: 0xffffff, wingOuter: 0x6aa0f0, wingEmissive: 0xc0e0ff,
    apexEye: 0xaad8ff, apexSeam: 0xe0ecff, coreGlow: 0xe8f2ff, surgeHi: 0xffffff,
    eye: 0x6aa8ff, trail: 0xcfe4ff, boostTrail: 0x9fd0ff,
  },

  solar: {
    name: 'Solar Sovereign',
    title: 'Apex of the skies',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 5000,
    // A regal ECLIPSE dragon — the dark, cool-toned counterpoint to the Phoenix's
    // white-gold solar fire: a midnight-indigo body, antique-gold crown + spine,
    // dark burnt-crimson wings and blue-violet/cyan eclipse energy. Predatory and
    // royal, NOT a bright flame-wyvern. Each form is a distinct rear-view
    // silhouette (see the per-form wingForm / tailStyle / spineGlow ramp below).
    stats: { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 },
    // Base model holds the APEX reference proportions; each form dials the
    // per-stage silhouette. Cumulative: later forms override earlier keys.
    model: {
      scale: 1.22, wingScale: 1.3, tailSegments: 9, neckSegments: 6,
      hornLen: 1.7, hornPairs: 2, ridgeCount: 16,
      flapBias: 0.8, flapAmp: 0.6, // slow, gliding, majestic wingbeat
    },
    forms: [
      // FORM 1 — Duskling: small, clean, dark-navy body + muted bronze, subdued
      // dark-crimson wings, a faint blue-violet core. Cleanest readability.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 5, ridgeCount: 8,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 1.0, neckSegments: 5,
        colors: { body: 0x0d1018, wingInner: 0x6e2418, wingOuter: 0x4a160e,
          wingEmissive: 0x5a1c10, scales: 0x7a6038, horn: 0x9a7c4a,
          apexSeam: 0x5a5c8a, eye: 0x8f9cd0, coreGlow: 0x6f7dff } },
      // FORM 2 — Eclipse Drake: deep-indigo body, dark copper→crimson wings,
      // antique-gold spine, a stronger blue-violet core.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 12,
        spineGlow: 0.34, crest: 1, dorsal: true, hornLen: 1.25,
        colors: { body: 0x0c1322, wingInner: 0x8a2e18, wingOuter: 0x6e1f14,
          wingEmissive: 0x7a2414, scales: 0xa88a48, horn: 0xc09a54,
          apexSeam: 0x6f7dff, eye: 0x9fb0ff, coreGlow: 0x6f7dff } },
      // FORM 3 — Royal Eclipse Dragon: obsidian-indigo body, antique-gold spine
      // plates, dark-crimson wings with blue-violet veins, electric core.
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 14,
        spineGlow: 0.7, wingVeins: true, glowSeams: true,
        crest: 2, hornPairs: 2, hornLen: 1.5, tusks: true, neckSegments: 6,
        colors: { body: 0x0a1020, wingInner: 0x8a2e18, wingOuter: 0x6e1f14,
          wingEmissive: 0x6e1f14, scales: 0xc8a24a, horn: 0xd8b25a,
          apexSeam: 0x6f7dff, eye: 0xbcd0ff, coreGlow: 0x6f7dff } },
      // FORM 4 — SOVEREIGN (Royal Eclipse): midnight body, antique-gold crown +
      // spine, dark burnt-crimson wings, blue-violet core/halo, pale electric-blue
      // eyes. Dark, regal, legendary — the cool counterpoint to the Phoenix.
      { wingForm: 3, tailStyle: 'comet', tailSegments: 9, ridgeCount: 16,
        spineGlow: 1.0, wingVeins: true, glowSeams: true,
        backCrest: true, auraHalo: true, crest: 3, hornLen: 1.7,
        colors: { body: 0x080b14, wingInner: 0x8a2e18, wingOuter: 0x5a160e,
          wingEmissive: 0x6e1f14, scales: 0xc8a24a, horn: 0xddc070,
          apexSeam: 0x6f7dff, eye: 0xddebff, coreGlow: 0x6f7dff } },
    ],
    fx: { auraColor: '122,92,255', auraIdle: 0.0, sparkle: false },
    // Eclipse Surge: a premium COOL ARCANE transformation — the obsidian shell
    // stays dark while spine, seams, wing veins and core blaze blue-violet /
    // cyan / indigo (surgeHi lavender, never white-hot or magenta). hasStyle keeps
    // the tail boost cool; surgeMotes breathes arcane motes off the tail + body.
    hasStyle: true, surgeMotes: true,
    feverWing: 0x5a64e0, feverEye: 0xb8a8ff, feverWash: [0.03, 0.03, 0.11],
    body: 0x080b14, belly: 0x1a1830, scales: 0xc8a24a, horn: 0xddc070,
    // Wing membrane runs dark copper at the ROOT → dark burnt-crimson at the
    // outer edge — antique bronze struts, blue-violet veins. Never bright orange.
    wingInner: 0x8a2e18, wingOuter: 0x5a160e, wingEmissive: 0x6e1f14,
    apexEye: 0xddebff, apexSeam: 0x6f7dff, coreGlow: 0x6f7dff, surgeHi: 0x9a86ff,
    eye: 0x9fb0ff, trail: 0x8090ff, boostTrail: 0x9a90ff,
  },

  phoenix: {
    name: 'Phoenix Ascendant',
    title: 'Reborn in fire',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 6000,
    archetype: 'phoenix', // separate firebird model — see phoenixModel.js
    // A celestial firebird, NOT a wyvern: broad layered FEATHER wings, a flowing
    // flame-feather PLUME tail, a back-raked feather crown and a white-hot
    // heart-fire core. White-gold dominant (no magenta) — its Surge is a
    // "Rebirth", not a screen wash. Better stamina/surge utility than the
    // dragons, a sliver less raw speed (drain/regen sit at the roster cap).
    stats: { speed: 1.14, handling: 1.27, drain: 0.70, regen: 1.35 },
    hasStyle: true,        // keep its own white-gold trail colour even in Surge
    feverWing: 0xffe6a8,   // Rebirth wing ignition is white-gold, not magenta
    feverEye: 0xfff2c8,
    feverWash: [0.095, 0.07, 0.022], // Rebirth screen wash: warm gold, not pink
    model: {
      scale: 1.18, wingScale: 1.34,
      flapBias: 0.9, flapAmp: 0.92, // broad, powerful, majestic bird wingbeat
    },
    // Four forms of one growing firebird. spineGlow ramps the glow + boost-
    // particle density; the palettes carry the charcoal-ember → white-gold arc.
    forms: [
      // FORM 1 — Ember Hatchling: a small charcoal bird, tiny crest, ember plume.
      { spineGlow: 0,
        colors: { body: 0x2a1712, featherIn: 0xff8a2a, featherOut: 0xffc85a,
          featherEdge: 0xff8a2a, featherHi: 0xfff2c8, wingEmissive: 0x8a3a12,
          coreGlow: 0xfff2c8, apexSeam: 0xffb05a, horn: 0xffc85a, scales: 0xffd98a,
          eye: 0xffc85a, trail: 0xff973c, boostTrail: 0xffc45c } },
      // FORM 2 — Flamewing Phoenix: brighter feathers, crimson tips, 3 plume ribbons.
      { spineGlow: 0.35,
        colors: { body: 0x32150f, featherIn: 0xff6a1a, featherOut: 0xffd166,
          featherEdge: 0xd93618, featherHi: 0xfff0b8, wingEmissive: 0xc24014,
          coreGlow: 0xfff0b8, apexSeam: 0xffb030, horn: 0xffd166, scales: 0xffdf90,
          eye: 0xffd166, trail: 0xff8c2e, boostTrail: 0xffd36b } },
      // FORM 3 — Solar Phoenix: white-gold begins to dominate, gold feathers with
      // ivory tips, rose-gold edges, the body warms brighter. Orange now support.
      { spineGlow: 0.7,
        colors: { body: 0x2c1d12, featherIn: 0xffb24a, featherOut: 0xffe8b0,
          featherEdge: 0xff9c7a, featherHi: 0xfff8e0, wingEmissive: 0xff8a2a,
          coreGlow: 0xfff8e0, apexSeam: 0xffe6a0, horn: 0xffeec4, scales: 0xfff2d4,
          eye: 0xffe6a0, trail: 0xff942e, boostTrail: 0xffe082 } },
      // FORM 4 — CELESTIAL REBIRTH: a WHITE-GOLD divine firebird. Wings read gold
      // → solar ivory → white-hot, orange only as the emissive flame support,
      // rose-gold on the feather edges. Solar halo + blazing heart-fire core.
      { spineGlow: 1.0,
        colors: { body: 0xeee2c6, featherIn: 0xffd166, featherOut: 0xfff0c8,
          featherEdge: 0xff8fa3, featherHi: 0xfff8e8, wingEmissive: 0xff8a2a,
          coreGlow: 0xfff8e8, apexSeam: 0xffe07a, horn: 0xfff4d8, scales: 0xfff4d8,
          eye: 0xfff0c0, aura: 0xfff0a8, trail: 0xffd76a, boostTrail: 0xfff0c8 } },
    ],
    fx: { auraColor: '255,236,190', auraIdle: 0.0, sparkle: false },
    // Top-level fallbacks (≈ the final white-gold form, for any raw render).
    body: 0xeee2c6, belly: 0x3a2a16, scales: 0xfff4d8, horn: 0xfff4d8,
    featherIn: 0xffd166, featherOut: 0xfff0c8, featherEdge: 0xff8fa3, featherHi: 0xfff8e8,
    wingInner: 0xffd166, wingOuter: 0xfff0c8, wingEmissive: 0xff8a2a,
    apexEye: 0xfff0c0, apexSeam: 0xffe07a, coreGlow: 0xfff8e8, surgeHi: 0xfff8e8,
    aura: 0xfff0a8, eye: 0xfff0c0, trail: 0xffd76a, boostTrail: 0xfff0c8,
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
