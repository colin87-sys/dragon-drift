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
      flapBias: 1.0, flapAmp: 0.9, // light courier beat, smoothed toward the Phoenix feel
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
    // Three forms (starter caps at SSR / tier 2): a BARE hatchling (no horns, no
    // back ridges) → horns + back ridges sprout, wings broaden → the SSR apex
    // (broadest wings, head crest, dorsal sail, soft spine-glow). Restrained —
    // no premium glow-seams/veins/aura. Soft airy sky-blue, not too electric.
    forms: [
      // Hatchling — bare whelp: no horns, no back ridges, dull sky-grey.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 5, ridgeCount: 0,
        spineGlow: 0, crest: 0, neckSegments: 4, hornLen: 0,
        colors: { body: 0x21384f, wingInner: 0x4d7ba6, wingOuter: 0x2f5d84,
          wingEmissive: 0x42729c, scales: 0x6f93b2, horn: 0x86a0b8,
          apexSeam: 0x4a7090, eye: 0x74a8cc, coreGlow: 0x5f8fc0 } },
      // Kindled — horns + back ridges sprout, wings broaden, clearer sky-blue.
      { wingForm: 1, tailStyle: 'simple', tailSegments: 5, ridgeCount: 8,
        spineGlow: 0, crest: 0, neckSegments: 4, hornLen: 1.0,
        colors: { body: 0x1f3650, wingInner: 0x67b7ff, wingOuter: 0x2f5d84,
          wingEmissive: 0x5fa6ef, scales: 0xa6cdec, horn: 0xa8c4de,
          apexSeam: 0x67b7ff, eye: 0x8ed5ff, coreGlow: 0x67b7ff } },
      // Radiant = the SSR apex: broadest wings, finned tail, head crest, dorsal
      // sail + soft spine-glow — bright airy sky-blue, NO premium glow-seams/veins.
      { wingForm: 2, tailStyle: 'finned', tailSegments: 6, ridgeCount: 10,
        spineGlow: 0.3, crest: 1, dorsal: true,
        colors: { body: 0x1c3048, wingInner: 0x8ed5ff, wingOuter: 0x357096,
          wingEmissive: 0x8ed5ff, scales: 0xc6ecff, horn: 0xc2dcf2,
          apexSeam: 0x8ed5ff, eye: 0xc6ecff, coreGlow: 0x8ed5ff } },
    ],
    fx: { auraColor: '142,213,255', auraIdle: 0.0, sparkle: false },
    body: 0x1c3048, belly: 0xcfe6ff, scales: 0xc6ecff, horn: 0xbcd9f0,
    wingInner: 0x8ed5ff, wingOuter: 0x2f5d84, wingEmissive: 0x67b7ff,
    apexEye: 0xc6ecff, apexSeam: 0x8ed5ff, coreGlow: 0x8ed5ff, surgeHi: 0xeaf6ff,
    eye: 0x8ed5ff, trail: 0x8ed5ff, boostTrail: 0x67b7ff,
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
      flapBias: 0.95, flapAmp: 0.95, // heavy, powerful beat, smoothed toward the Phoenix feel
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
    // Three forms (starter caps at SSR / tier 2): a bare cinder whelp → horns +
    // back ridges sprout, flame wings broaden → the SSR apex (jagged flame wings,
    // blade-finned spine, crest + soft spine-glow). Restrained — no premium seams.
    forms: [
      // Hatchling — bare cinder whelp: no horns, no back ridges, dull ember.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 6, ridgeCount: 0,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 0,
        colors: { body: 0x2a1610, wingInner: 0x8a3a1e, wingOuter: 0x5c2414,
          wingEmissive: 0x9a4420, scales: 0x9a5a34, horn: 0xb08058,
          apexSeam: 0x7a3418, eye: 0xcf7a44, coreGlow: 0xc25a2a } },
      // Kindled — horns + back ridges sprout, wings broaden, warmer ember-orange.
      { wingForm: 1, tailStyle: 'simple', tailSegments: 6, ridgeCount: 10,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 1.1,
        colors: { body: 0x281410, wingInner: 0xe3561f, wingOuter: 0x7a3018,
          wingEmissive: 0xff8b2a, scales: 0xe0884a, horn: 0xe0b070,
          apexSeam: 0xff8b2a, eye: 0xffa347, coreGlow: 0xff7a30 } },
      // Radiant = the SSR apex: jagged flame wings, finned tail, back-spines,
      // crest + soft spine-glow — bright ember-orange, NO premium glow-seams.
      { wingForm: 2, tailStyle: 'finned', tailSegments: 7, ridgeCount: 13,
        spineGlow: 0.32, backSpines: true, crest: 1,
        colors: { body: 0x261208, wingInner: 0xff8b2a, wingOuter: 0x7a3018,
          wingEmissive: 0xffb347, scales: 0xffc070, horn: 0xffd28a,
          apexSeam: 0xffb347, eye: 0xffc878, coreGlow: 0xff9a3a } },
    ],
    fx: { auraColor: '255,139,42', auraIdle: 0.0, sparkle: false },
    body: 0x231108, belly: 0xffd9a8, scales: 0xffc070, horn: 0xffd28a,
    wingInner: 0xff8b2a, wingOuter: 0xe3561f, wingEmissive: 0xffb347,
    apexEye: 0xffc878, apexSeam: 0xffb347, coreGlow: 0xff9a3a, surgeHi: 0xfff0d8,
    eye: 0xffa347, trail: 0xffa347, boostTrail: 0xffc060,
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
      flapBias: 1.05, flapAmp: 0.82, // serpent wings, smoothed/fuller toward the Phoenix feel
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
    // Three forms (starter caps at SSR / tier 2): a bare river-whelp → horns +
    // back ridges sprout, body lengthens → the SSR apex (longer body + neck,
    // finned tail, whiskers, crest + soft spine-glow). Restrained — no premium seams.
    forms: [
      // Hatchling — bare river-whelp: no horns, no back ridges, no whiskers.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 8, ridgeCount: 0,
        spineGlow: 0, crest: 0, neckSegments: 6, hornLen: 0,
        colors: { body: 0x16302a, wingInner: 0x2a7a5e, wingOuter: 0x1d4c43,
          wingEmissive: 0x2f8a66, scales: 0x5e9080, horn: 0x88a890,
          apexSeam: 0x3a6a56, eye: 0x6aa88c, coreGlow: 0x3aa078 } },
      // Kindled — horns + back ridges sprout, wings broaden, clearer jade-green.
      { wingForm: 1, tailStyle: 'simple', tailSegments: 8, ridgeCount: 12,
        spineGlow: 0, crest: 0, neckSegments: 6, hornLen: 0.9,
        colors: { body: 0x143028, wingInner: 0x3bcb8e, wingOuter: 0x255d50,
          wingEmissive: 0x3bcb8e, scales: 0x8fd9bc, horn: 0xa8c4a0,
          apexSeam: 0x3bcb8e, eye: 0x79e2b7, coreGlow: 0x3bcb8e } },
      // Radiant = the SSR apex: longer body + neck, finned tail, whiskers, crest
      // + soft spine-glow — bright emerald, NO premium glow-seams/veins.
      { wingForm: 2, tailStyle: 'finned', tailSegments: 10, ridgeCount: 14,
        spineGlow: 0.3, whiskers: true, neckSegments: 7, crest: 1,
        colors: { body: 0x123026, wingInner: 0x79e2b7, wingOuter: 0x1f9e77,
          wingEmissive: 0x79e2b7, scales: 0xbdf3dc, horn: 0xcfe8c0,
          apexSeam: 0x79e2b7, eye: 0xbdf3dc, coreGlow: 0x79e2b7 } },
    ],
    fx: { auraColor: '121,226,183', auraIdle: 0.0, sparkle: false },
    body: 0x102a22, belly: 0xe8ffd0, scales: 0xbdf3dc, horn: 0xcfe8c0,
    wingInner: 0x79e2b7, wingOuter: 0x1f9e77, wingEmissive: 0x3bcb8e,
    apexEye: 0xbdf3dc, apexSeam: 0x79e2b7, coreGlow: 0x79e2b7, surgeHi: 0xeafff4,
    eye: 0x79e2b7, trail: 0x79e2b7, boostTrail: 0x3bcb8e,
  },

  obsidian: {
    name: 'Obsidian Shade',
    title: 'Night given wings',
    rarity: 'SSR',
    maxRarity: 'SSSR',
    cost: 2200,
    // House-style draconic head: the Soft Stealth archetype — rounded wedge skull,
    // short blunt snout, large intelligent catlike eyes, swept-back ear-fins, cyan
    // rear glow. Intelligent, stealthy, fast (NOT regal or spiky).
    parts: {
      head: 'draconic', wings: 'skinnedMembrane',
      surface: { shader: ['cellularScales', 'iridescence'] },
      // Apex-dramatic SCALE RELIEF (the shingle system): overlapping dark cupped
      // plates on the FLANKS (arriving at Radiant, fuller at Eternal) + a denser
      // SHOULDER MANTLE at Eternal only — so ascension visibly "armors up". Kept
      // off the dorsal crest so the smooth back + cyan chevron line stays the read;
      // each plate carries a faint cyan edge that flares on Night Surge (edge:true →
      // spineMats). Counts are per-form [H,K,R,E] and seg()-scaled per device tier.
      shingle: [
        { count: [0, 0, 10, 14], zRange: [-1.55, 1.1], len: 0.34, wid: 0.2, cup: 0.3, tilt: 0.42, yLift: 0.42, edge: true },
        { count: [0, 0, 0, 8], zRange: [-1.1, -0.4], len: 0.4, wid: 0.26, cup: 0.36, tilt: 0.52, yLift: 0.6, cardRows: 2, edge: true },
      ],
    },
    // STEALTH NIGHT-DRAKE: sleek, near-black with electric-CYAN plasma. A smooth
    // hornless head with ear-frills, a SMOOTH back lit only by a cyan chevron
    // energy line, narrow swept bat-wings (dark membrane, cyan edges — never a
    // solid glowing panel) and an evolving tail: bare dart → finlet → full fin →
    // TWIN swept stabilizers. Strictly blue-black + cyan, never purple/regal —
    // the cool opposite of Sovereign's crimson-gold dragon-lord.
    //
    // 4-FORM SILHOUETTE PROGRESSION (Radiant = 100% baseline). Every form is
    // authored from named constants so the rear read is unmistakable and the
    // apex is obviously superior (not just a wider/brighter Radiant):
    //   bodyScale     overall size (group scale, vs Radiant)
    //   bodyStretch   after-body LENGTH only (longer, not bulkier; apex)
    //   wingSpan      wing width (× bodyScale = on-screen wingspan)
    //   wingChord     wing front-to-back depth
    //   tailLength    tail length (× bodyScale)
    //   tailFinScale  tail-fin / stabilizer size      tailFinSpread  stabilizer splay
    //   dorsalGlowCount  cyan chevrons down the back   spineGlow  glow geometry ramp
    //   glowIntensity emissive multiplier (apex > 1)   particleRate trail density
    //   wingOpacity   membrane translucency            previewScale showcase framing
    //   surgeGlowMultiplier  apex Surge flare boost     wingParticleRate  wingtip wisp rate
    // Progressive drama target — Hatchling 25% · Kindled 45% · Radiant 70% ·
    // Eternal 100%.
    stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },
    model: {
      scale: 0.86, wingScale: 1.07, tailSegments: 9, neckSegments: 5,
      ridgeCount: 0, // smooth back (cyan chevrons via dorsalGlowCount, not ridges)
      // Soft Stealth draconic head — large catlike eyes, compact, cyan-lit ear-fins.
      headArchetype: 'softStealth', headScale: 1.18, eyeScale: 1.32, rearGlowIntensity: 0.4,
      flapBias: 1.08, flapAmp: 0.82, // quick, agile, low-profile beat
    },
    // Narrow, swept-back, low-arc wings (vs Solar's wide flared flame wings); the
    // span/chord grow via wingSpan/wingChord per form, not just the finger count.
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
      { tips: [[5.50, 0.22], [4.70, -0.84], [3.40, -1.34], [2.05, -1.36], [1.05, -1.14]],
        lead: [3.85, 0.52], scallop: 0.20, flame: false,
        arc: { bow: 0.92, hump: 0.82, humpAt: 0.60, hook: 0.50 } },
    ],
    forms: [
      // ── HATCHLING (T0) ── tiny smooth night dart, plasma dormant. No chevrons,
      // a tapered stem + small dark spade tip, stubby wings, dim grey-cyan. ~25%.
      { wingForm: 0, tailStyle: 'spade',
        bodyScale: 0.65, wingSpan: 0.85, wingChord: 0.92, tailLength: 0.80,
        tailFinScale: 0, tailFinSpread: 0, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0, glowIntensity: 0.25, particleRate: 0.30,
        wingOpacity: 0.93, wingPanelGlow: 0.10, previewScale: 0.75,
        eyeScale: 1.35, neckSegments: 5,
        colors: { body: 0x0a0d12, wingInner: 0x141c28, wingOuter: 0x0c1118,
          wingEmissive: 0x2a4a5a, wingMembraneEmissive: 0x10161f, scales: 0x18202c, horn: 0x2a3848,
          eye: 0x4a8a9a, apexSeam: 0x3a5560, coreGlow: 0x223540 } },
      // ── KINDLED (T1) ── electric-cyan plasma ignites: ear frills, a faint
      // chevron line continuing onto the tail, and the first SPLIT tail-fin
      // identity (two flared finlets + side-fin hints). Drama ≈ 45%.
      { wingForm: 1, tailStyle: 'splitfin', earTendrils: true,
        bodyScale: 0.82, wingSpan: 0.95, wingChord: 0.96, tailLength: 0.90,
        tailFinScale: 0.62, tailFinSpread: 0, dorsalGlowCount: 6, tailGlowSegs: 3,
        spineGlow: 0.45, glowIntensity: 0.55, particleRate: 0.55,
        wingOpacity: 0.87, wingPanelGlow: 0.12, previewScale: 0.88,
        eyeScale: 1.32,
        colors: { body: 0x0a0d12, wingInner: 0x182334, wingOuter: 0x0e1622,
          wingEmissive: 0x59d8ff, wingMembraneEmissive: 0x16202e, scales: 0x223044, horn: 0x33506a,
          eye: 0x59d8ff, apexSeam: 0x59d8ff, coreGlow: 0x4aa3ff } },
      // ── RADIANT (T2 · 100% baseline) ── full body, a proper stealth-RUDDER tail
      // (two swept layered fins + central rudder), an 8-chevron body line + 6 tail
      // segments, cyan-edged wings, plasma veins + glow seams. Looks good — but the
      // Eternal must read as obviously beyond it. Drama 70%.
      { wingForm: 2, tailStyle: 'stealthrudder', earTendrils: true,
        bodyScale: 1.00, wingSpan: 1.00, wingChord: 1.00, tailLength: 1.00,
        tailFinScale: 1.00, tailFinSpread: 1.00, dorsalGlowCount: 8, tailGlowSegs: 6,
        spineGlow: 0.75, glowIntensity: 1.00, particleRate: 1.00,
        wingOpacity: 0.82, wingPanelGlow: 0.14, previewScale: 1.00,
        wingVeins: true, glowSeams: true, wingEdgeGlow: true,
        colors: { body: 0x0a0d12, wingInner: 0x182334, wingOuter: 0x0e1828,
          wingEmissive: 0x59d8ff, wingMembraneEmissive: 0x1a2636, scales: 0x273052, horn: 0x3a5a78,
          eye: 0x8be9ff, apexSeam: 0x59d8ff, coreGlow: 0x59d8ff } },
      // ── ETERNAL (T3 · the apex) ── the dramatic rear-silhouette change: markedly
      // bigger, wider deeper wings with wingtip winglets, an 11-chevron body line
      // flowing into 10 tail segments, subtle hip fins, and the signature apex
      // stealth-tail ASSEMBLY — two large swept layered stabilizers (anhedral) +
      // micro support fins + a tall central rudder on a long stem. Drama 100%.
      { wingForm: 3, tailStyle: 'apexstealth', earTendrils: true,
        bodyScale: 1.12, bodyStretch: 1.18, wingSpan: 1.10, wingChord: 1.15, tailLength: 1.06,
        tailFinScale: 1.08, tailFinSpread: 1.2, dorsalGlowCount: 11, tailGlowSegs: 10,
        tailRootCollar: true, tailDorsalLink: true,
        spineGlow: 1.00, glowIntensity: 1.30, particleRate: 1.80,
        wingOpacity: 0.78, wingPanelGlow: 0.16, previewScale: 1.12,
        surgeGlowMultiplier: 1.3, wingParticleRate: 0.6,
        wingVeins: true, glowSeams: true, wingEdgeGlow: true,
        wingtipFins: true, hipFins: true,
        colors: { wingMembraneEmissive: 0x202b3c } },
    ],
    fx: { auraColor: '89,216,255', auraIdle: 0.0, sparkle: false },
    previewAccent: 0x59d8ff, // showcase spotlight stays CYAN despite the gold SSSR badge
    // Night Surge: a COOL plasma overdrive — the dark shell stays dark while the
    // wing edges, chevrons, seams and tail rims blaze electric CYAN (never the
    // default hot magenta, which would shatter the stealth identity). hasStyle
    // keeps its cyan trails in Surge; surgeMotes breathes cool plasma motes; the
    // screen wash is a gentle cyan, kept low so it never overexposes the frame.
    hasStyle: true, surgeMotes: true,
    feverWing: 0x6ad8ff, feverEye: 0xb0f0ff, feverWash: [0.015, 0.05, 0.085],
    body: 0x0a0d12, belly: 0x111827, scales: 0x273052, horn: 0x3a5a78,
    wingInner: 0x182334, wingOuter: 0x0e1828, wingEmissive: 0x59d8ff,
    wingMembraneEmissive: 0x1a2636, dorsalHi: 0xb7f7ff,
    apexEye: 0x8be9ff, apexSeam: 0x59d8ff, coreGlow: 0x4aa3ff, surgeHi: 0xd8f6ff,
    eye: 0x59d8ff, trail: 0x59d8ff, boostTrail: 0x8be9ff,
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
      flapBias: 0.9, flapAmp: 0.88, // graceful, lofty beat — already near the Phoenix feel
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
    parts: { surface: { shader: ['cellularScales', 'iridescence'] } },
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
      flapBias: 0.85, flapAmp: 0.72, // gliding majesty, a fuller stroke toward the Phoenix feel
    },
    forms: [
      // FORM 1 — Duskling: small, clean, dark-navy body + muted bronze, subdued
      // dark-crimson wings, a faint blue-violet core. Cleanest readability.
      { wingForm: 0, tailStyle: 'simple', tailSegments: 5, ridgeCount: 8,
        spineGlow: 0, crest: 0, hornPairs: 1, hornLen: 1.0, neckSegments: 5,
        colors: { body: 0x0d1018, wingInner: 0x6e2418, wingOuter: 0x4a160e,
          wingEmissive: 0x5a1c10, scales: 0x7a6038, horn: 0x9a7c4a,
          apexSeam: 0x5a5c8a, eye: 0xc8a868, coreGlow: 0xb784ff } },
      // FORM 2 — Eclipse Drake: deep-indigo body, dark copper→crimson wings,
      // antique-gold spine, a stronger blue-violet core.
      { wingForm: 1, tailStyle: 'finned', tailSegments: 7, ridgeCount: 12,
        spineGlow: 0.34, crest: 1, dorsal: true, hornLen: 1.25,
        colors: { body: 0x0c1322, wingInner: 0x9c2233, wingOuter: 0x7a1622,
          wingEmissive: 0x7a2414, scales: 0xa88a48, horn: 0xc09a54,
          apexSeam: 0xb784ff, eye: 0xe0bc78, coreGlow: 0xb784ff } },
      // FORM 3 — Royal Eclipse Dragon: obsidian-indigo body, antique-gold spine
      // plates, dark-crimson wings with blue-violet veins, electric core.
      { wingForm: 2, tailStyle: 'blade', tailSegments: 8, ridgeCount: 14,
        spineGlow: 0.7, wingVeins: true, glowSeams: true,
        crest: 2, hornPairs: 2, hornLen: 1.5, tusks: true, neckSegments: 6,
        colors: { body: 0x0a1020, wingInner: 0x9c2233, wingOuter: 0x7a1622,
          wingEmissive: 0x7a1622, scales: 0xd4a84f, horn: 0xd8b25a,
          apexSeam: 0xb784ff, eye: 0xecd090, coreGlow: 0xb784ff } },
      // FORM 4 — SOVEREIGN (Royal Eclipse): midnight body, antique-gold crown +
      // spine, dark burnt-crimson wings, blue-violet core/halo, pale electric-blue
      // eyes. Dark, regal, legendary — the cool counterpoint to the Phoenix.
      { wingForm: 3, tailStyle: 'comet', tailSegments: 9, ridgeCount: 16,
        spineGlow: 1.0, wingVeins: true, glowSeams: true,
        backCrest: true, auraHalo: true, crest: 3, hornLen: 1.7,
        colors: { body: 0x080b14, wingInner: 0x9c2233, wingOuter: 0x5a160e,
          wingEmissive: 0x7a1622, scales: 0xd4a84f, horn: 0xddc070,
          apexSeam: 0xb784ff, eye: 0xf4e2a8, coreGlow: 0xb784ff } },
    ],
    fx: { auraColor: '122,92,255', auraIdle: 0.0, sparkle: false },
    // Eclipse Surge: a premium COOL ARCANE transformation — the obsidian shell
    // stays dark while spine, seams, wing veins and core blaze blue-violet /
    // cyan / indigo (surgeHi lavender, never white-hot or magenta). hasStyle keeps
    // the tail boost cool; surgeMotes breathes arcane motes off the tail + body.
    hasStyle: true, surgeMotes: true,
    feverWing: 0x8a5cf0, feverEye: 0xc8a8ff, feverWash: [0.06, 0.025, 0.10],
    body: 0x080b14, belly: 0x1a1830, scales: 0xd4a84f, horn: 0xddc070,
    // Wing membrane runs dark copper at the ROOT → dark burnt-crimson at the
    // outer edge — antique bronze struts, blue-violet veins. Never bright orange.
    wingInner: 0x9c2233, wingOuter: 0x5a160e, wingEmissive: 0x7a1622,
    apexEye: 0xf4e2a8, apexSeam: 0xb784ff, coreGlow: 0xb784ff, surgeHi: 0x9a86ff,
    eye: 0xe0bc78, trail: 0xb47cf0, boostTrail: 0xc8a8ff,
  },

  phoenix: {
    name: 'Phoenix Ascendant',
    title: 'Reborn in fire',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 6000,
    // Composed from a recipe like every other dragon: an avian body, feather
    // wings, a flame-plume tail and a beaked head. `archetype` is kept only as a
    // RIG flag (warm ember motes / Rebirth Surge in dragon.js), not a model path.
    archetype: 'phoenix',
    parts: { torso: 'avian', wings: 'feather', tail: 'plume', head: 'beaked' },
    // A celestial firebird, NOT a wyvern: broad layered FEATHER wings, a flowing
    // flame-feather PLUME tail, a back-raked feather crown and a white-hot
    // heart-fire core. White-gold dominant (no magenta) — its Surge is a
    // "Rebirth", not a screen wash. Better stamina/surge utility than the
    // dragons, a sliver less raw speed (drain/regen sit at the roster cap).
    stats: { speed: 1.14, handling: 1.27, drain: 0.70, regen: 1.35 },
    hasStyle: true,        // keep its own white-gold trail colour even in Surge
    feverWing: 0xffe6a8,   // Rebirth wing ignition is white-gold, not magenta
    feverEye: 0xfff2c8,
    feverWash: [0.058, 0.043, 0.014], // Rebirth screen wash: warm gold, kept low so it never overexposes the frame
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

  // A sleek astral serpent: one continuous flowing crystal body wrapped in glowing
  // energy bands, lateral astral fin-vanes, a regal mask head + a celestial saddle,
  // that slithers HORIZONTALLY (low + readable, §0.5) and tapers into a streaming
  // comet wake. A fully NON-standard body plan — built entirely from composable
  // parts (crystalSerpent / sideFins / cometWake / celestialMask).
  astralWyrm: {
    name: 'Astral Wyrm',
    title: 'Emperor of the Star Current',
    rarity: 'SSR', maxRarity: 'SSSR', cost: 4200,
    parts: { torso: 'crystalSerpent', wings: 'sideFins', tail: 'cometWake', head: 'celestialMask' },
    stats: { speed: 1.13, handling: 1.24, drain: 0.82, regen: 1.18 },
    model: {
      scale: 1.08, wingScale: 1.12, neckSegments: 3, ridgeCount: 0,
      flapBias: 0.45, flapAmp: 0.28,             // tiny beat → the fins flex, never flap
      segmentTaper: 0.93, segmentSway: 0.26, segmentBob: 0.05, segmentLag: 0.16,
      sideFinSweep: 0.72, sideFinFlex: 0.18,
    },
    forms: [
      // Star-Larva — a short slender serpent, one fin pair, a short comet wisp, a bare mask.
      { segmentCount: 6, sideFinPairs: 1, cometWisps: 2,
        crown: 0, maskTier: 0, spineGlow: 0.08, coreIntensity: 0.15,
        bodyScale: 0.78, wingSpan: 0.62, tailLength: 0.55,
        colors: { body: 0x151a35, belly: 0x6f78aa, scales: 0x4d5ad8, horn: 0x9aa6dd,
          wingInner: 0x242a64, wingOuter: 0x0d1029, wingEmissive: 0x405cff,
          eye: 0x9eeaff, apexSeam: 0x5566ff, coreGlow: 0x405cff, surgeHi: 0xbfd7ff,
          trail: 0x5268ff, boostTrail: 0x84eaff } },
      // Comet Wyrm — a longer body, a bigger wing pair, a fuller comet wake, the first crown.
      { segmentCount: 9, sideFinPairs: 1, cometWisps: 3,
        crown: 0.35, maskTier: 1, spineGlow: 0.18, coreIntensity: 0.28,
        bodyScale: 0.92, wingSpan: 0.84, tailLength: 0.78,
        colors: { body: 0x12183a, belly: 0x8795d8, scales: 0x6172ff, horn: 0xb6c2f2,
          wingInner: 0x293177, wingOuter: 0x0b0f2a, wingEmissive: 0x5bcfff,
          eye: 0xb8f3ff, apexSeam: 0x7084ff, coreGlow: 0x5bcfff, surgeHi: 0xd8e8ff,
          trail: 0x6888ff, boostTrail: 0x91f3ff } },
      // Astral Serpent — a long body, a wide wing pair, a long comet wake, fuller crown.
      { segmentCount: 12, sideFinPairs: 1, cometWisps: 4,
        crown: 0.7, maskTier: 2, spineGlow: 0.34, coreIntensity: 0.48,
        bodyScale: 1.04, wingSpan: 1.08, tailLength: 1.0,
        colors: { body: 0x101632, belly: 0xaab8f4, scales: 0x7f8cff, horn: 0xd0dcff,
          wingInner: 0x2d378a, wingOuter: 0x090d24, wingEmissive: 0x7ee8ff,
          eye: 0xcff8ff, apexSeam: 0x8e76ff, coreGlow: 0x7ee8ff, surgeHi: 0xeaf4ff,
          trail: 0x7e9cff, boostTrail: 0x9df4ff } },
      // Galaxy Emperor — a long sweeping body, broad sweeping wings, a sweeping comet wake, emperor mask.
      { segmentCount: 15, sideFinPairs: 1, cometWisps: 6,
        crown: 1.0, maskTier: 3, spineGlow: 0.58, coreIntensity: 0.72,
        bodyScale: 1.16, wingSpan: 1.28, tailLength: 1.22,
        colors: { body: 0x090d24, belly: 0xdce6ff, scales: 0x9d7cff, horn: 0xf2f6ff,
          wingInner: 0x3440a0, wingOuter: 0x050719, wingEmissive: 0x9df4ff,
          eye: 0xffffff, apexEye: 0xffffff, apexSeam: 0xb28cff, coreGlow: 0x9df4ff,
          surgeHi: 0xf4fbff, trail: 0x9d7cff, boostTrail: 0xb8f8ff } },
    ],
    fx: { auraColor: '126,180,255', auraIdle: 0.1, sparkle: true },
    previewAccent: 0x7e9cff,
    // Cool astral Surge (lavender/cyan, never fiery).
    hasStyle: true, surgeMotes: true,
    feverWing: 0x8ea6ff, feverEye: 0xffffff, feverWash: [0.03, 0.04, 0.09],
    body: 0x101632, belly: 0xbcc9ff, scales: 0x7f8cff, horn: 0xdce6ff,
    wingInner: 0x273078, wingOuter: 0x090d24, wingEmissive: 0x7ee8ff,
    eye: 0xcff8ff, apexEye: 0xffffff, apexSeam: 0x9d7cff, coreGlow: 0x7ee8ff,
    surgeHi: 0xf4fbff, trail: 0x7e9cff, boostTrail: 0x9df4ff,
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
