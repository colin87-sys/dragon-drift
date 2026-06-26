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
import { FIRE_PROFILE, WATER_PROFILE, EARTH_PROFILE } from './dragonHullProfiles.js';

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
      // UNIFIED SKINNED HULL — body+wings as ONE continuous procedural skin (L23/L24).
      // Rollback: torso:'sweptLoftSkinned', wings:'skinnedMembraneBridge' (both kept
      // registered + tested for a two-string revert).
      torso: 'unifiedHullTorso', head: 'draconic', wings: 'unifiedHull', tail: 'sweptTail',
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
    // NIGHT FURY: matte jet-black, sleek and cat-like (a Toothless-class night drake).
    // A smooth hornless head with ear-frills + acid-GREEN eyes, a SMOOTH unlit back,
    // matte bat-wings, and a slim continuous swept tail ending in TWIN splayed fan-fins.
    // Plasma blue is held back for the Night-Surge moment ONLY — in cruise it reads
    // pure black (no cyan chevron lines, no glowing wing seams), never a lit panel.
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
      wingRootScale: 1.5, wingSSS: true, // thick Night-Fury wing root + backlit-membrane subsurface
      shoulderWidthScale: 1.2, wingRootOffset: { y: 0.06, z: -0.1 }, // broader shoulders + wing root raised/forward
      riderSocket: { x: 0, y: 0.92, z: -0.45 }, // nestle the rider low between the shoulders, behind the head
      // Soft Stealth draconic head — large catlike eyes, compact, cyan-lit ear-fins.
      headArchetype: 'softStealth', headScale: 1.18, eyeScale: 1.32, rearGlowIntensity: 0.4,
      flapBias: 1.08, flapAmp: 0.82, // quick, agile, low-profile beat
    },
    // Narrow, swept-back, low-arc wings (vs Solar's wide flared flame wings); the
    // span/chord grow via wingSpan/wingChord per form, not just the finger count.
    // Night Fury wings: BROAD rounded bat-paddles with a deeply-scalloped, fanned
    // trailing edge (pronounced finger-points) and a softened elbow — not the old
    // narrow swept blade. scallop = the fanned webs; tips = the trailing fingers.
    wingForms: [
      { tips: [[4.20, 0.10], [3.35, -0.78], [2.10, -1.06]],
        lead: [2.85, 0.40], scallop: 0.22, rootChord: 0.50, flame: false,
        arc: { bow: 0.55, hump: 0.0, humpAt: 0.6, hook: 0.08 } },
      { tips: [[4.70, 0.12], [3.85, -0.86], [2.55, -1.24], [1.45, -1.18]],
        lead: [3.20, 0.46], scallop: 0.28, rootChord: 0.62, flame: false,
        arc: { bow: 0.65, hump: 0.24, humpAt: 0.56, hook: 0.12 } },
      { tips: [[5.05, 0.16], [4.20, -0.92], [3.05, -1.34], [1.95, -1.34], [1.05, -1.18]],
        lead: [3.50, 0.54], scallop: 0.34, rootChord: 0.74, flame: false,
        arc: { bow: 0.75, hump: 0.38, humpAt: 0.58, hook: 0.18 } },
      { tips: [[5.50, 0.22], [4.70, -0.92], [3.55, -1.42], [2.45, -1.48], [1.45, -1.40], [0.80, -1.18]],
        lead: [3.85, 0.64], scallop: 0.40, rootChord: 0.85, flame: false,
        arc: { bow: 0.92, hump: 0.52, humpAt: 0.60, hook: 0.30 } },
    ],
    forms: [
      // ── HATCHLING (T0) ── tiny smooth night dart, plasma dormant. No chevrons,
      // a tapered stem + small dark spade tip, stubby wings, dim grey-cyan. ~25%.
      { wingForm: 0, tailStyle: 'nightfury',
        bodyScale: 0.65, wingSpan: 0.85, wingChord: 1.40, tailLength: 0.80,
        tailFinScale: 0.5, tailFinSpread: 0, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0, glowIntensity: 0.25, particleRate: 0.30,
        wingOpacity: 0.93, wingPanelGlow: 0.10, previewScale: 0.75,
        eyeScale: 1.35, neckSegments: 5,
        colors: { body: 0x0a0d12, wingInner: 0x141c28, wingOuter: 0x0c1118,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x10161f, scales: 0x18202c, horn: 0x2a3848,
          eye: 0x6f9a28, apexSeam: 0x161e28, coreGlow: 0x1a2c3c } },
      // ── KINDLED (T1) ── electric-cyan plasma ignites: ear frills, a faint
      // chevron line continuing onto the tail, and the first SPLIT tail-fin
      // identity (two flared finlets + side-fin hints). Drama ≈ 45%.
      { wingForm: 1, tailStyle: 'nightfury', earTendrils: true,
        bodyScale: 0.82, wingSpan: 0.95, wingChord: 1.55, tailLength: 0.90,
        tailFinScale: 0.62, tailFinSpread: 0, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0.45, glowIntensity: 0.55, particleRate: 0.55,
        wingOpacity: 0.92, wingPanelGlow: 0.12, previewScale: 0.88,
        eyeScale: 1.32,
        colors: { body: 0x0a0d12, wingInner: 0x182334, wingOuter: 0x0e1622,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x16202e, scales: 0x223044, horn: 0x33506a,
          eye: 0x96d62a, apexSeam: 0x161e28, coreGlow: 0x1d3548 } },
      // ── RADIANT (T2 · 100% baseline) ── full body, a proper stealth-RUDDER tail
      // (two swept layered fins + central rudder), an 8-chevron body line + 6 tail
      // segments, cyan-edged wings, plasma veins + glow seams. Looks good — but the
      // Eternal must read as obviously beyond it. Drama 70%.
      { wingForm: 2, tailStyle: 'nightfury', earTendrils: true, hipFins: true,
        bodyScale: 1.00, wingSpan: 1.00, wingChord: 1.70, tailLength: 1.00,
        tailFinScale: 1.00, tailFinSpread: 1.00, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0.75, glowIntensity: 1.00, particleRate: 1.00,
        wingOpacity: 0.90, wingPanelGlow: 0.14, previewScale: 1.00,
        wingVeins: false, glowSeams: false, wingEdgeGlow: false,
        colors: { body: 0x0a0d12, wingInner: 0x182334, wingOuter: 0x0e1828,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x1a2636, scales: 0x273052, horn: 0x3a5a78,
          eye: 0x96d62a, apexSeam: 0x161e28, coreGlow: 0x1d3548 } },
      // ── ETERNAL (T3 · the apex) ── the dramatic rear-silhouette change: markedly
      // bigger, wider deeper wings with wingtip winglets, an 11-chevron body line
      // flowing into 10 tail segments, subtle hip fins, and the signature apex
      // stealth-tail ASSEMBLY — two large swept layered stabilizers (anhedral) +
      // micro support fins + a tall central rudder on a long stem. Drama 100%.
      { wingForm: 3, tailStyle: 'nightfury', earTendrils: true,
        bodyScale: 1.12, bodyStretch: 1.18, wingSpan: 1.10, wingChord: 1.90, tailLength: 1.06,
        tailFinScale: 1.08, tailFinSpread: 1.2, dorsalGlowCount: 0, tailGlowSegs: 0,
        tailRootCollar: true, tailDorsalLink: false,
        spineGlow: 1.00, glowIntensity: 1.30, particleRate: 1.80,
        wingOpacity: 0.90, wingPanelGlow: 0.16, previewScale: 1.12,
        surgeGlowMultiplier: 1.3, wingParticleRate: 0.6,
        wingVeins: false, glowSeams: false, wingEdgeGlow: false,
        hipFins: true,
        colors: { wingMembraneEmissive: 0x202b3c } },
    ],
    fx: { auraColor: '50,110,140', auraIdle: 0.0, sparkle: false },
    previewAccent: 0x2e5a6a, // dim plasma-teal showcase spotlight (matte Night Fury reads black)
    // Night Surge: a COOL plasma overdrive — the dark shell stays dark while the
    // wing edges, chevrons, seams and tail rims blaze electric CYAN (never the
    // default hot magenta, which would shatter the stealth identity). hasStyle
    // keeps its cyan trails in Surge; surgeMotes breathes cool plasma motes; the
    // screen wash is a gentle cyan, kept low so it never overexposes the frame.
    hasStyle: true, surgeMotes: true,
    feverWing: 0x6ad8ff, feverEye: 0xb0f0ff, feverWash: [0.015, 0.05, 0.085],
    body: 0x0a0d12, belly: 0x111827, scales: 0x273052, horn: 0x3a5a78,
    wingInner: 0x182334, wingOuter: 0x0e1828, wingEmissive: 0x0d1219,
    wingMembraneEmissive: 0x1a2636, dorsalHi: 0x2c3a44,
    apexEye: 0xb6e85a, apexSeam: 0x161e28, coreGlow: 0x1d3548, surgeHi: 0x9fd8ff,
    eye: 0x96d62a, trail: 0x2a5a78, boostTrail: 0x4a90c0,
  },

  // ── OBSIDIAN SHADE II — the CLEAN-SHEET one-skin organism ─────────────────
  // A full CLONE of `obsidian` (same stats/forms/colours/shaders/shingle), but on
  // the clean-sheet organism architecture: body+wings (and later neck/head/tail)
  // generated TOGETHER as ONE continuous skinned hull whose membrane root verts
  // ARE the body loft's own flank verts (zero gap by construction). This supersedes
  // the v1 unifiedHull weld (which retrofitted onto Obsidian's legacy body). It ADDS
  // a creature; it does not touch `obsidian`. Head/tail are reused at anchors for now
  // (Increment 2b/2c will grow them from the hull).
  obsidian2: {
    name: 'Obsidian Shade II',
    title: 'one skin, nose to tail',
    // Body FINISH (obsidian2-only): matte organic hide. Kill the polished-metal read:
    // metalness 0, very rough, and LOW envMapIntensity (the smooth dark body was
    // mirroring the bright sky). Bigger scales (scaleSize) + strong relief so the
    // micro-relief resolves at chase-cam distance, not just up close. additive/
    // nullable → roster-safe.
    bodyMetalness: 0.0, bodyRoughness: 0.82, bodyEnvIntensity: 0.18, scaleSize: 3.0, scaleRelief: 0.9,
    rarity: 'SSR',
    maxRarity: 'SSSR',
    cost: 2200,
    parts: {
      // CLEAN-SHEET ORGANISM HULL — body+wings as ONE continuous procedural skin,
      // generated from the creature's OWN profile (decoupled from the roster).
      torso: 'organismTorso', head: 'draconic', wings: 'organismWings', tail: 'sweptTail',
      // v2 normal-detail scales only — the relief reads as living hide. Iridescence
      // dropped: its oily view-angle hue-sweep read as pearlescent/metallic on the
      // dark stealth body (kept on the other dragons).
      // NIGHT FURY (L31): NO shingle — the chunky cupped flank plates read as the
      // metallic bolt-on attachments the human wants gone; the scale now comes from
      // the WHOLE-creature shader (cellularScalesNormal) reaching body/neck/head/
      // arms AND the tail (model.scaleTail). Removing them also DROPS tris.
      surface: { shader: ['cellularScalesNormal'] },
    },
    stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },
    model: {
      // B3 (L31): wingScale 1.07→0.9 so the wingspan reads ~2-2.5× body length, not
      // a huge sail (the Eternal per-form tips are tightened below to match).
      scale: 0.86, wingScale: 0.9, tailSegments: 9, neckSegments: 5,
      ridgeCount: 0,
      wingRootScale: 1.5, wingSSS: true,
      shoulderWidthScale: 1.2, wingRootOffset: { y: 0.06, z: -0.1 },
      riderSocket: { x: 0, y: 0.92, z: -0.45 },
      headArchetype: 'softStealth', headScale: 1.18, eyeScale: 1.32, rearGlowIntensity: 0.4,
      flapBias: 1.08, flapAmp: 0.82,
      // WHOLE-CREATURE SHADER SCALE (L31): the swept tail's stemMat is a SEPARATE
      // matte material with no surface shader → the pebbly relief stopped at the
      // hips. scaleTail opts the tail tube into the SAME cellularScalesNormal relief
      // + matte finish as the body, so the scale reads nose-to-tail. obsidian v1 does
      // NOT set this → its tail is byte-identical/untouched.
      scaleTail: true,
    },
    // B3 (L31): the wing OUTLINE tips, tightened so the wingspan reads ~2-2.5× body
    // length, not a huge sail — most aggressively on the apex (Eternal, was span 5.50
    // → 4.55). Paired with model.wingScale 1.07→0.9. scallop tips (the pointy
    // trailing-edge points the finger spars now fan to) kept so the fanned web read
    // survives.
    wingForms: [
      { tips: [[3.70, 0.10], [2.95, -0.78], [1.90, -1.06]],
        lead: [2.55, 0.40], scallop: 0.22, rootChord: 0.50, flame: false,
        arc: { bow: 0.55, hump: 0.0, humpAt: 0.6, hook: 0.08 } },
      { tips: [[4.05, 0.12], [3.35, -0.86], [2.25, -1.24], [1.30, -1.18]],
        lead: [2.80, 0.46], scallop: 0.28, rootChord: 0.62, flame: false,
        arc: { bow: 0.65, hump: 0.24, humpAt: 0.56, hook: 0.12 } },
      { tips: [[4.30, 0.16], [3.60, -0.92], [2.60, -1.34], [1.70, -1.34], [0.95, -1.18]],
        lead: [3.00, 0.54], scallop: 0.34, rootChord: 0.74, flame: false,
        arc: { bow: 0.75, hump: 0.38, humpAt: 0.58, hook: 0.18 } },
      { tips: [[4.55, 0.22], [3.85, -0.92], [2.95, -1.42], [2.05, -1.48], [1.25, -1.40], [0.70, -1.18]],
        lead: [3.20, 0.64], scallop: 0.40, rootChord: 0.85, flame: false,
        arc: { bow: 0.92, hump: 0.52, humpAt: 0.60, hook: 0.30 } },
    ],
    forms: [
      // L31 — SLEEK MATTE NIGHT FURY: all idle glows OFF (spineGlow:0 every form →
      // no dorsal glow cones; coreGlow dropped → no idle core sprite; the cyan is
      // held back for Night Surge via feverWing/feverEye only). Palette re-hued to a
      // desaturated dark MIDNIGHT BLUE-BLACK (body/belly/scales/horn in 0x0a0f1c–
      // 0x16223c) so horns + finger struts read as subtle dark structure, not lighter
      // attachments. Eyes stay acid-GREEN; wing-membrane colours unchanged.
      { wingForm: 0, tailStyle: 'nightfury',
        bodyScale: 0.65, wingSpan: 0.85, wingChord: 1.40, tailLength: 0.80,
        tailFinScale: 0.5, tailFinSpread: 0, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0, glowIntensity: 0.25, particleRate: 0.30,
        wingOpacity: 0.93, wingPanelGlow: 0.10, previewScale: 0.75,
        eyeScale: 1.35, neckSegments: 5,
        colors: { body: 0x0a0f1c, wingInner: 0x141c28, wingOuter: 0x0c1118,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x10161f, scales: 0x121a2e, horn: 0x101a2c,
          eye: 0x6f9a28, apexSeam: 0x131a2c } },
      { wingForm: 1, tailStyle: 'nightfury', earTendrils: true,
        bodyScale: 0.82, wingSpan: 0.95, wingChord: 1.55, tailLength: 0.90,
        tailFinScale: 0.62, tailFinSpread: 0, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0, glowIntensity: 0.55, particleRate: 0.55,
        wingOpacity: 0.92, wingPanelGlow: 0.12, previewScale: 0.88,
        eyeScale: 1.32,
        colors: { body: 0x0b1020, wingInner: 0x182334, wingOuter: 0x0e1622,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x16202e, scales: 0x141e36, horn: 0x121c32,
          eye: 0x96d62a, apexSeam: 0x131a2c } },
      { wingForm: 2, tailStyle: 'nightfury', earTendrils: true, hipFins: true,
        bodyScale: 1.00, wingSpan: 1.00, wingChord: 1.70, tailLength: 1.00,
        tailFinScale: 1.00, tailFinSpread: 1.00, dorsalGlowCount: 0, tailGlowSegs: 0,
        spineGlow: 0, glowIntensity: 1.00, particleRate: 1.00,
        wingOpacity: 0.90, wingPanelGlow: 0.14, previewScale: 1.00,
        wingVeins: false, glowSeams: false, wingEdgeGlow: false,
        colors: { body: 0x0c1222, wingInner: 0x182334, wingOuter: 0x0e1828,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x1a2636, scales: 0x16223c, horn: 0x141d30,
          eye: 0x96d62a, apexSeam: 0x131a2c } },
      { wingForm: 3, tailStyle: 'nightfury', earTendrils: true,
        bodyScale: 1.12, bodyStretch: 1.18, wingSpan: 1.10, wingChord: 1.90, tailLength: 1.06,
        tailFinScale: 1.08, tailFinSpread: 1.2, dorsalGlowCount: 0, tailGlowSegs: 0,
        tailRootCollar: true, tailDorsalLink: false,
        spineGlow: 0, glowIntensity: 1.30, particleRate: 1.80,
        wingOpacity: 0.90, wingPanelGlow: 0.16, previewScale: 1.12,
        surgeGlowMultiplier: 1.3, wingParticleRate: 0.6,
        wingVeins: false, glowSeams: false, wingEdgeGlow: false,
        hipFins: true,
        colors: { wingMembraneEmissive: 0x202b3c } },
    ],
    fx: { auraColor: '50,110,140', auraIdle: 0.0, sparkle: false },
    previewAccent: 0x2e5a6a,
    hasStyle: true, surgeMotes: true,
    feverWing: 0x6ad8ff, feverEye: 0xb0f0ff, feverWash: [0.015, 0.05, 0.085],
    // L31 dark MIDNIGHT BLUE-BLACK base palette (desaturated, matte). body/belly/
    // scales/horn live in 0x0a0f1c–0x16223c so the whole creature reads sleek black-
    // blue, horns + finger struts subtle dark structure. coreGlow DROPPED (no idle
    // core sprite — `if (!coreGlow && def.coreGlow)` in dragonModel.js is now false);
    // the cyan is held for Night Surge via feverWing/feverEye. Eyes stay acid-GREEN.
    body: 0x0a0f1c, belly: 0x0e1424, scales: 0x16223c, horn: 0x141d30,
    wingInner: 0x182334, wingOuter: 0x0e1828, wingEmissive: 0x0d1219,
    wingMembraneEmissive: 0x1a2636, dorsalHi: 0x1a2636,
    apexEye: 0xb6e85a, apexSeam: 0x131a2c, surgeHi: 0x9fd8ff,
    eye: 0x96d62a, trail: 0x2a5a78, boostTrail: 0x4a90c0,
  },

  // ── TOOTHLESS — Night Fury collab skin ──────────────────────────────────────
  // The FRESH-take hull (LEAPFROG L32): a sleek matte-black Night Fury on the
  // SMOOTH longitudinal-spline loft (no "metallic rings") + the one-surface
  // body↔wing weld + a finger to every scallop. INCREMENT 1 = body + wings only;
  // the neck/head/tail (head:'none', tail:'none') are switched OFF and arrive in
  // I2/I3 as hull-grown continuous extensions — no legacy bolted parts are shown.
  // Anatomy (body profile in dragonNightFury.js; wing outline below) is authored to
  // the Toothless reference imagery, to be verified on the chase-cam preview.
  toothless: {
    name: 'Toothless',
    title: 'Night Fury',
    // Matte organic hide (the L29/L30 finish kit): metalness 0, very rough, LOW
    // envMapIntensity (a smooth dark body mirrors the bright sky → reads metal).
    // Bigger scales + strong relief so the micro-relief resolves at chase-cam
    // distance. Additive/nullable → roster-safe.
    bodyMetalness: 0.0, bodyRoughness: 0.88, bodyEnvIntensity: 0.05, scaleSize: 3.0, scaleRelief: 0.9,
    // matte BLACK hide: the white wash on the dorsal was the bright SKY reflecting (env) +
    // the warm fresnel rim. Env dropped 0.16→0.05 and the body rim fully OFF (0). Wings/spine
    // keep their rim so the membrane still reads against the sky.
    rimBodyMul: 0.0,
    rarity: 'SSR',
    maxRarity: 'SSSR',
    cost: 2600,
    parts: {
      // SMOOTH HULL — body+wings as ONE continuous procedural skin on the
      // longitudinal-spline loft. head/tail OFF this increment (grown from the hull
      // in I2/I3). One v2 normal-detail shader carries the living-hide scale.
      torso: 'nightFuryTorso', head: 'none', wings: 'nightFuryWings', tail: 'none',
      surface: { shader: ['cellularScalesNormal'] },
    },
    stats: { speed: 1.12, handling: 1.18, drain: 0.82, regen: 1.2 },
    model: {
      scale: 0.86, wingScale: 0.9, tailSegments: 9, neckSegments: 5,
      ridgeCount: 0,
      wingRootScale: 1.4, wingSSS: true,
      shoulderWidthScale: 1.2, wingRootOffset: { y: 0.06, z: -0.1 },
      riderSocket: { x: 0, y: 0.92, z: -0.45 },
      flapBias: 1.08, flapAmp: 0.82,
      // Night-Fury wing anatomy (dragonNightFury knobs): the wrist auto-aligns to the
      // INNERMOST scallop tip (no wingWristSpan override) so the 5 fingers fan from the
      // first scallop out to the wing edge; the arm sweeps FORWARD to the leading edge
      // (wingArmLeadChord); the spokes CURVE outward as they fan (wingFingerSplay) with a
      // small chord bow (wingFingerCurve); struts bulge as raised top-view ridges.
      // wrist pulled medial OF the innermost scallop (wingWristMedial) → fingers fan harder.
      // Frame hierarchy: arm(0.115) > forearm(0.10) > leading frame spar(0.085) > struts(0.058).
      wingArmLeadChord: 0.38, wingWristMedial: 0.84,
      // arm(0.115) > forearm/wrist(0.09) > leading finger tapers wrist→tip to ≈ strut(0.058)→thin.
      wingArmRadius: 0.115, wingForearmRadius: 0.09, wingFrameTipRadius: 0.013,
      wingFingerCurve: 0.14, wingFingerSplay: 0.18, wingFingerBulge: 0.06, wingFingerRadius: 0.058,
      // tail-whip + body-whip: the WHOLE body undulates VERTICALLY with the wingbeat and
      // the tail trails in a vertical wave; the tail curves sideways only when banking
      // (rudder). Bone chains reweight the loft; gated + nullable (roster byte-identical).
      tailSteer: true, tailWhip: true, bodyWhip: true,
    },
    // TOOTHLESS WING OUTLINE — a broad bat wing with FIVE finger struts (a finger to
    // every tip via dragonNightFury#buildFingers). tips: [x span, y chord], far tip
    // first; the trailing edge scallops between consecutive tips. The outermost finger
    // (tips[0]) rides the wing's outer/leading edge; the inner four fan back across the
    // chord to the scalloped trailing edge. Authored to the reference (5 spokes, wrist
    // forward); tune the sweep on the preview.
    // GULL-WING glide arc: a small elbow rise (hump) with NEGATIVE bow so the wingtips DROOP
    // below the shoulders — the graceful gliding-dragon read, and it stops the chase cam from
    // seeing the wing's top/under surface (reads edge-on). Chord depth kept (not a ribbon).
    wingForms: [
      { tips: [[3.70, 0.30], [3.20, -0.40], [2.55, -0.78], [1.85, -0.98], [1.10, -0.92]],
        lead: [2.55, 0.46], scallop: 0.20, rootChord: 0.50, flame: false,
        arc: { bow: -0.10, hump: 0.06, humpAt: 0.55, hook: 0.0 } },
      { tips: [[4.05, 0.34], [3.50, -0.52], [2.80, -1.00], [2.00, -1.22], [1.15, -1.12]],
        lead: [2.80, 0.52], scallop: 0.24, rootChord: 0.62, flame: false,
        arc: { bow: -0.12, hump: 0.14, humpAt: 0.52, hook: 0.0 } },
      { tips: [[4.35, 0.38], [3.78, -0.58], [3.02, -1.12], [2.15, -1.36], [1.25, -1.26]],
        lead: [3.00, 0.58], scallop: 0.28, rootChord: 0.74, flame: false,
        arc: { bow: -0.14, hump: 0.20, humpAt: 0.52, hook: 0.0 } },
      { tips: [[4.65, 0.42], [4.05, -0.62], [3.25, -1.20], [2.32, -1.46], [1.35, -1.36]],
        lead: [3.20, 0.66], scallop: 0.32, rootChord: 0.85, flame: false,
        arc: { bow: -0.16, hump: 0.26, humpAt: 0.54, hook: 0.0 } },
    ],
    forms: [
      // Sleek matte Night Fury: all idle glows OFF (spineGlow 0; no coreGlow). Dark
      // midnight blue-black palette, acid-GREEN eyes; the cyan is held for Surge.
      { wingForm: 0, bodyScale: 0.70, wingSpan: 0.85, wingChord: 1.35,
        spineGlow: 0, glowIntensity: 0.25, particleRate: 0.30,
        wingOpacity: 0.93, wingPanelGlow: 0.10, previewScale: 0.78, eyeScale: 1.35,
        colors: { body: 0x0a0f1c, wingInner: 0x141c28, wingOuter: 0x0c1118,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x10161f, scales: 0x121a2e, horn: 0x101a2c,
          eye: 0x6f9a28, apexSeam: 0x131a2c } },
      { wingForm: 1, bodyScale: 0.85, wingSpan: 0.95, wingChord: 1.50,
        spineGlow: 0, glowIntensity: 0.55, particleRate: 0.55,
        wingOpacity: 0.92, wingPanelGlow: 0.12, previewScale: 0.9, eyeScale: 1.32,
        colors: { body: 0x0b1020, wingInner: 0x182334, wingOuter: 0x0e1622,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x16202e, scales: 0x141e36, horn: 0x121c32,
          eye: 0x96d62a, apexSeam: 0x131a2c } },
      { wingForm: 2, bodyScale: 1.00, wingSpan: 1.00, wingChord: 1.65,
        spineGlow: 0, glowIntensity: 1.00, particleRate: 1.00,
        wingOpacity: 0.90, wingPanelGlow: 0.14, previewScale: 1.00,
        colors: { body: 0x0c1222, wingInner: 0x182334, wingOuter: 0x0e1828,
          wingEmissive: 0x0d1219, wingMembraneEmissive: 0x1a2636, scales: 0x16223c, horn: 0x141d30,
          eye: 0x96d62a, apexSeam: 0x131a2c } },
      { wingForm: 3, bodyScale: 1.10, bodyStretch: 1.15, wingSpan: 1.08, wingChord: 1.80,
        spineGlow: 0, glowIntensity: 1.30, particleRate: 1.80,
        wingOpacity: 0.90, wingPanelGlow: 0.16, previewScale: 1.12,
        colors: { wingMembraneEmissive: 0x202b3c } },
    ],
    fx: { auraColor: '50,110,140', auraIdle: 0.0, sparkle: false },
    previewAccent: 0x2e5a6a,
    hasStyle: true, surgeMotes: true,
    feverWing: 0x6ad8ff, feverEye: 0xb0f0ff, feverWash: [0.015, 0.05, 0.085],
    body: 0x0a0f1c, belly: 0x0e1424, scales: 0x16223c, horn: 0x141d30,
    wingInner: 0x182334, wingOuter: 0x0e1828, wingEmissive: 0x0d1219,
    wingMembraneEmissive: 0x1a2636, dorsalHi: 0x1a2636,
    apexEye: 0xb6e85a, apexSeam: 0x131a2c, surgeHi: 0x9fd8ff,
    eye: 0x96d62a, trail: 0x2a5a78, boostTrail: 0x4a90c0,
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
    // MULTI-MODULE upgrade (Radiant Paladin): feather-scale wings on the shared 3-hinge
    // rig + cascade animator + a comet/banner TAIL (chase-cam rear hero). Hull/Head
    // still inferred until seraphHull/Head land.
    parts: { torso: 'seraphHull', wings: 'seraphWing', head: 'seraphCrownHead', tail: 'seraphTail' },
    model: {
      scale: 1.12, wingScale: 0.9, tailSegments: 9, neckSegments: 5,  // wingScale trimmed 1.2→0.9 so the span no longer dwarfs the body
      hornLen: 1.3, hornPairs: 1, ridgeCount: 12,
      flapBias: 0.9, flapAmp: 0.88, // slow, heavy, eternal beat — a touch more loft than the Bull
      // Feather-scale wing: 3-segment hinge cascade, GRACEFUL/lofty (amps in radians;
      // L/R flap together, lag is internal root→mid→tip). Dihedral = chase-cam knob.
      wingParts: 3, wingDihedralDeg: 14,
      // Deeper feathered fan (front-to-back) to read "lush", WITHOUT widening span (wingScale stays 0.9
      // per the earlier "wingspan too big vs body" trim) — tri-neutral; see buildSeraphWing.chordAt.
      wingChordScale: 1.4,
      // flapBias×flapFreqScale = 0.9×0.85 = 0.765 → ~10% slower than now, just above the Bull's heavy 0.70 (more POWER).
      flapFreqScale: 0.85, midLag: 0.5, tipLag: 1.0,
      glidePow: 2.2, bodyBobScale: 0.30, headWobbleScale: 0, tailLagScale: 0.10,
      // ANGELIC CATHEDRAL flap (two-channel YOKE solver). Taller + rounder + smoother than Bull.
      // Channel 1 = yoke whole-wing elevation (high at apex, pressing on the downstroke). Channel 2
      // = inner/mid/tip CURL (straight at glide+downstroke, rounded V at apex), lagged → dome on the
      // upstroke then a rounded cathedral V. Gentler rowing/sweep than Bull (graceful, not mechanical).
      flap: {
        downFrac: 0.56, downDepth: 1.9,                 // smooth beat; heavier downstroke; bottom ≈ −46°
        lag: { inner: 0.04, mid: 0.07, tip: 0.20 },     // tip trails most → dome + follow-through
        yokeElevDeg: 24, curlDeg: { inner: 16, mid: 20, tip: 12 },
        sweepDeg: { mid: 6, tip: 14 }, rowDeg: 9,
        tipTrailDeg: 18, twistDeg: 4, loadBowDeg: 0,    // strong tip trail → domed upstroke
        body: { liftAmt: 0.06, tailDropDeg: 5, tailLag: 0.08 },
      },
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
        colors: { body: 0xeae6dc, wingInner: 0xf0ede4, wingOuter: 0x9cbce4,
          wingEmissive: 0x84d6ff, wingGild: 0xd9b04c, scales: 0xe8f2ff, horn: 0xffe08a,
          apexSeam: 0xccddff, eye: 0x88c0ff, coreGlow: 0xccddff } },
      { wingForm: 3, tailStyle: 'comet', tailSegments: 9, ridgeCount: 14,
        spineGlow: 1.0, bladeFins: true, wingVeins: true, glowSeams: true,
        halo: true, backCrest: true, crest: 2,
        colors: { body: 0xf2f0ea, wingInner: 0xf4f1ea, wingOuter: 0xa9c6e8,
          wingEmissive: 0x88dfff, wingGild: 0xe0b94f, scales: 0xf4faff, horn: 0xfff0b0,
          apexSeam: 0xe0ecff, eye: 0xaad8ff, coreGlow: 0xe8f2ff } },
    ],
    fx: { auraColor: '180,210,255', auraIdle: 0.08, sparkle: true },
    body: 0xf2f6ff, belly: 0xfff4d8, scales: 0xf4faff, horn: 0xfff0b0,
    wingInner: 0xf4f1ea, wingOuter: 0x6aa0f0, wingEmissive: 0x88dfff, wingGild: 0xd6af4a,
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

  // FLAME MONARCH — a classic European fire dragon evolved into a racing monarch.
  // Brand-new everything (the "Phoenix technique"): its OWN torso / wings / head /
  // tail builders (monarchHull / monarchWing / monarchCrown / monarchTail), so the
  // silhouette is genuinely new — a four-legged western drake with a broad chest,
  // pinched waist, long balancing tail, wide-but-narrow bat wings that throw a rear
  // V, swept-back crown horns, and an unmistakable molten dorsal spine. Dark
  // charcoal/obsidian hide, burnt-bronze belly, molten orange-red in the spine
  // gaps / throat / wing-vein struts / tail-tip fins. Its Surge is a "magma
  // overload" — the spine, struts and fins pulse hot pink-orange (def.surgeHi);
  // def.boostSpine brightens the same accents on boost.
  flameMonarch: {
    name: 'Flame Monarch',
    title: 'Crowned in molten fire',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 6400,
    parts: {
      torso: 'monarchHull', wings: 'monarchWing', head: 'monarchCrown', tail: 'monarchTail',
      // The torso builds its OWN molten dorsal spine, so suppress the spine-line layer
      // the engine would otherwise INFER from model.spineGlow (that inference was drawing
      // a SECOND row of dorsal glow over the hand-built one — the "2 rows" jank).
      surfaceLayers: [],
      // (Armor plating removed — the shingle flank-scales collided with the wing roots
      //  and read as scattered scales; a new armor approach is being designed.)
    },
    stats: { speed: 1.16, handling: 1.20, drain: 0.74, regen: 1.22 },
    boostSpine: true,   // brighten the molten spine + wing struts + tail fins on boost
    // Magma-overload Surge: hot pink-orange flare + a warm low screen wash.
    hasStyle: true, surgeMotes: true,
    feverWing: 0xff6a78, feverEye: 0xffd2c0, feverWash: [0.06, 0.022, 0.03],
    model: {
      scale: 1.12, wingScale: 1.18,
      bodyRoughness: 0.62, bodyMetalness: 0.12, rimBodyMul: 1.1,
      flapBias: 0.92, flapAmp: 0.88,   // broad, powerful, regal western-dragon beat
      flapFreqScale: 0.7,              // −30% flap speed (slower, readable regal beat)
      // 3-segment ARTICULATED wing (shoulder→elbow→wrist): per-segment amplitude +
      // LAG make a travelling fold, not one rigid hinge; a glide-hold beat (glidePow)
      // with rare heavy pulses; a held apex V (restLift = rest dihedral, apex* lift
      // the tips highest at the top of the stroke).
      wingParts: true, glidePow: 1.25,
      rootAmp: 0.55, midAmp: 0.44, tipAmp: 0.36, midLag: 0.6, tipLag: 1.15,
      restLift: 0.5, apexRoot: 0.16, apexMid: 0.3, apexTip: 0.46, apexPitch: 0.12,
      bodyBobScale: 1.25,   // a touch more neck bob/breathe so the body reads alive
    },
    // Four forms of one growing monarch — charcoal ember whelp → molten-crowned
    // king. bodyScale/wingSpan author an explicit growth curve (Radiant = 1.0);
    // spineGlow ramps the molten light; hornLen/tailLength grow the crown + tail.
    forms: [
      // FORM 1 — Ember Whelp: a small dark drake, faint molten spine, stubby horns.
      { bodyScale: 0.60, wingSpan: 0.82, spineGlow: 0.15, hornLen: 0.7, tailLength: 0.82,
        colors: { body: 0x1a1512, belly: 0x5a3015, scales: 0x33271f, horn: 0x2a221c,
          coreGlow: 0xff7a2e, wingEmissive: 0xff6a22, wingMembraneEmissive: 0x3a1408,
          wingInner: 0x231a16, apexSeam: 0xff7a2e, eye: 0xffb43c,
          trail: 0xff7a2e, boostTrail: 0xffa850 } },
      // FORM 2 — Cinder Drake: bigger, the spine brightens, the crown horns lengthen.
      { bodyScale: 0.80, wingSpan: 0.92, spineGlow: 0.42, hornLen: 0.92, tailLength: 0.92,
        colors: { body: 0x191310, belly: 0x6a3818, scales: 0x382a20, horn: 0x2c231d,
          coreGlow: 0xff6a24, wingEmissive: 0xff5a1c, wingMembraneEmissive: 0x44160a,
          wingInner: 0x251b17, apexSeam: 0xff6e26, eye: 0xffa432,
          trail: 0xff6a26, boostTrail: 0xff9a48 } },
      // FORM 3 — Ember Sovereign (Radiant = 1.0): full molten dorsal spine + throat.
      { bodyScale: 1.00, wingSpan: 1.00, spineGlow: 0.72, hornLen: 1.1, tailLength: 1.0,
        colors: { body: 0x171210, belly: 0x7a4420, scales: 0x3c2c20, horn: 0x2e241e,
          coreGlow: 0xff5e1e, wingEmissive: 0xff5418, wingMembraneEmissive: 0x4e180a,
          wingInner: 0x261c18, apexSeam: 0xff6a22, eye: 0xff9a2c,
          trail: 0xff6222, boostTrail: 0xff9440 } },
      // FORM 4 — FLAME MONARCH (apex): the obsidian king, molten spine/struts/fins
      // blazing, the crown at full reach. Surge flares this hardest.
      { bodyScale: 1.12, wingSpan: 1.12, spineGlow: 1.0, hornLen: 1.25, tailLength: 1.08,
        surgeGlowMultiplier: 1.3,
        colors: { body: 0x161210, belly: 0x844a22, scales: 0x40301f, horn: 0x322620,
          coreGlow: 0xff5a1e, wingEmissive: 0xff5014, wingMembraneEmissive: 0x58200c,
          wingInner: 0x281e18, apexSeam: 0xff6a20, eye: 0xff8f28, aura: 0xff7a3a,
          trail: 0xff5e1e, boostTrail: 0xff9038 } },
    ],
    fx: { auraColor: '255,120,60', auraIdle: 0.05, sparkle: false },
    previewAccent: 0xff6a2a,
    surgeHi: 0xff5a78,   // hot pink-orange magma flare for the Surge pulse
    // Top-level fallbacks (≈ the apex form, for any raw render).
    body: 0x161210, belly: 0x844a22, scales: 0x40301f, horn: 0x322620,
    wingInner: 0x281e18, wingOuter: 0x140e0c, wingEmissive: 0xff5014,
    wingMembraneEmissive: 0x58200c, coreGlow: 0xff5a1e, apexSeam: 0xff6a20,
    surgeHi2: 0xff8f6a, eye: 0xff8f28, aura: 0xff7a3a,
    trail: 0xff5e1e, boostTrail: 0xff9038,
  },

  // THUNDERCOIL AMPHITHERE — a legless storm-serpent (brand-new family, the Phoenix
  // technique). A long coiling body undulating like a ribbon (the segmented bodySegs
  // travelling-wave rig — no legs, custom motion), thick at the chest/wing-root and
  // tapering to a thin forked-conductor tail. Large SHARP triangular wings mounted on
  // the front third, a broad boxy wedge head with a flat crown, and a backward
  // lightning crest (skull→neck) fading to low dorsal nodes. Storm-grey/navy hide,
  // pale-silver belly, electric blue-white accents. Its Surge is a "storm overload":
  // accents flare electric-white (surgeHi), arcs jump between the wing struts + tail
  // fork, and a shock ring snaps out behind it (def.stormFx, driven in dragon.js);
  // boost runs a current head→tail (def.boostSpine + the storm current).
  thundercoil: {
    name: 'Thundercoil Amphithere',
    title: 'The storm given a spine',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 6600,
    parts: { torso: 'ampithereTorso', wings: 'ampithereWing', head: 'ampithereHead', tail: 'none' },
    stats: { speed: 1.18, handling: 1.30, drain: 0.72, regen: 1.20 },
    boostSpine: true,   // accents brighten on boost (the storm current adds the head→tail run)
    stormFx: true,      // lightning arcs + shock ring (driven in dragon.js, boost/Surge only)
    hasStyle: true, surgeMotes: true,
    feverWing: 0x9ee6ff, feverEye: 0xeafbff, feverWash: [0.02, 0.05, 0.08],
    model: {
      scale: 1.04, wingScale: 1.14,
      bodyRoughness: 0.5, bodyMetalness: 0.28, rimBodyMul: 1.0,
      // Ribbon undulation — a gentle lead-first slither (front calm, tail whips).
      segmentSway: 0.2, segmentBob: 0.06, segmentLag: 0.16,
      flapBias: 1.0, flapAmp: 0.9, flapFreqScale: 0.7,   // −30% flap speed (assessment)
      // SHARP triangular wing on the 3-segment articulated chain.
      wingParts: true, glidePow: 1.15,
      rootAmp: 0.52, midAmp: 0.42, tipAmp: 0.36, midLag: 0.55, tipLag: 1.05,
      restLift: 0.46, apexRoot: 0.14, apexMid: 0.28, apexTip: 0.44, apexPitch: 0.12,
    },
    // Four forms of one growing storm-serpent — the body lengthens (segmentCount),
    // the wings widen, and the electric charge ramps from dim spark to full storm.
    forms: [
      // FORM 1 — Spark Eel: a short dim serpent, few segments, faint crest.
      { segmentCount: 9, bodyScale: 0.7, wingSpan: 0.82, spineGlow: 0.15, glowIntensity: 0.5,
        colors: { body: 0x222833, belly: 0x9aa6b8, coreGlow: 0x5ab0e0, wingEmissive: 0x5ab0e0,
          wingMembraneEmissive: 0x121a28, wingInner: 0x182230, apexSeam: 0x6ec4f0, eye: 0x9fe4ff,
          trail: 0x5ab0e0, boostTrail: 0x8fd4ff } },
      // FORM 2 — Storm Coil: longer body, brighter crest, the fork sharpens.
      { segmentCount: 11, bodyScale: 0.86, wingSpan: 0.92, spineGlow: 0.42, glowIntensity: 0.7,
        colors: { body: 0x1e2530, belly: 0xaeb8c8, coreGlow: 0x66c4ff, wingEmissive: 0x66c4ff,
          wingMembraneEmissive: 0x142030, wingInner: 0x192536, apexSeam: 0x86d6ff, eye: 0xc4f0ff,
          trail: 0x66c4ff, boostTrail: 0x9fe0ff } },
      // FORM 3 — Tempest Serpent (Radiant = 1.0): full body, vivid electric crest.
      { segmentCount: 13, bodyScale: 1.0, wingSpan: 1.0, spineGlow: 0.72, glowIntensity: 1.0,
        colors: { body: 0x1a212c, belly: 0xc2ccdc, coreGlow: 0x7ad2ff, wingEmissive: 0x7ad2ff,
          wingMembraneEmissive: 0x18263a, wingInner: 0x1b2940, apexSeam: 0x9ee6ff, eye: 0xd8f6ff,
          trail: 0x7ad2ff, boostTrail: 0xb6ecff } },
      // FORM 4 — THUNDERCOIL (apex): the longest, charged white-blue, fork ablaze.
      { segmentCount: 14, bodyScale: 1.1, wingSpan: 1.12, spineGlow: 1.0, glowIntensity: 1.3,
        surgeGlowMultiplier: 1.3,
        colors: { body: 0x171e29, belly: 0xd6e0ee, coreGlow: 0x8fdcff, wingEmissive: 0x8fdcff,
          wingMembraneEmissive: 0x1d2c44, wingInner: 0x1d2c46, apexSeam: 0xb6ecff, eye: 0xeafbff,
          aura: 0x9ee6ff, trail: 0x8fdcff, boostTrail: 0xcaf2ff } },
    ],
    fx: { auraColor: '120,200,255', auraIdle: 0.05, sparkle: true },
    previewAccent: 0x7ad2ff,
    surgeHi: 0xcfeaff,   // electric white-blue flare for the storm Surge
    // Top-level fallbacks (≈ the apex form, for any raw render).
    body: 0x171e29, belly: 0xd6e0ee, scales: 0x2a3340,
    wingInner: 0x1d2c46, wingOuter: 0x10161f, wingEmissive: 0x8fdcff,
    wingMembraneEmissive: 0x1d2c44, coreGlow: 0x8fdcff, apexSeam: 0xb6ecff,
    eye: 0xeafbff, aura: 0x9ee6ff, horn: 0x2a3340,
    trail: 0x8fdcff, boostTrail: 0xcaf2ff,
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

  // ── STARTER: FIRE — "Cinderwing", the flame-tailed raptor ─────────────────
  // Hull dragon (data-driven Night-Fury kernel). Lean ARCHED body + clean swept
  // DELTA wings (scallop≈0, flame:false → NOT Ember's jagged flame wing) + a long
  // whip tail tipped with a glowing FLAME BULB (the Charizard read). 3 forms, SSR
  // cap. Radiant restrained (glow ≤1.0, no glowSeams) so it stays below Eternals.
  fire: {
    name: 'Cinderwing',
    title: 'The Flame-Tailed Raptor',
    bodyMetalness: 0.0, bodyRoughness: 0.82, bodyEnvIntensity: 0.06, scaleSize: 3.2, scaleRelief: 0.7,
    rimBodyMul: 0.6,
    rarity: 'SR', maxRarity: 'SSR', cost: 800,
    parts: {
      torso: 'hullTorso', head: 'none', wings: 'hullWings', tail: 'none',
      surface: { shader: ['cellularScalesNormal'] },
    },
    hull: {
      profile: FIRE_PROFILE, section: { ex: 2.0 }, sectionN: 20,
      knobs: { eyes: true, eyeZ: -2.42, eyeX: 0.24, dorsalZRange: [-2.6, 4.0], chestBand: [-1.30, 0.90], seamDorsal: 0.87 },
      tailBulb: { r: 0.16, z: 4.2, color: 0xff6a1e, innerColor: 0xffd24a, emissiveIntensity: 1.2, yLift: 0.02 },
    },
    stats: { speed: 1.05, handling: 1.04, drain: 1.0, regen: 1.0 },
    // Base wing knobs: anatomical taper arm > forearm > finger (L39). The GRACE levers
    // (wristMedial / fingerSplay / fingerCurve) are authored PER FORM below — loose stubby
    // baby fan → tight elegant adult fan (improving on Toothless: more medial, more splay).
    model: {
      scale: 0.94, wingScale: 0.86, tailSegments: 0, neckSegments: 0, ridgeCount: 0,
      wingRootScale: 1.15, shoulderWidthScale: 1.1, wingRootOffset: { y: 0.04, z: -0.08 },
      riderSocket: { x: 0, y: 0.8, z: -0.4 },
      flapBias: 1.05, flapAmp: 0.95,
      wingArmLeadChord: 0.40,
      wingArmRadius: 0.105, wingForearmRadius: 0.072, wingFrameTipRadius: 0.011, wingFingerRadius: 0.05,
      tailWhip: true, bodyWhip: true, tailSteer: true,
      spineFwdZ: [-1.5, -2.4], spineHipZ: 1.10,
      tailBoneZ: [1.55, 2.45, 3.30, 4.05],
    },
    // BROAD FANNED dragon wing (not a thin delta): moderate SPAN (narrower than Toothless)
    // but DEEP chord + 5 fanned fingers with real scalloped webs, a strong elbow (arc.hump)
    // and a fire-raked hook. Fuller + more elegant than Toothless, not wider. The trailing
    // finger carries the back edge; the medial wrist (per form) fans the fingers convex.
    wingForms: [
      // GULL-WING glide arc: small elbow rise + NEGATIVE bow → wingtips DROOP (graceful glide,
      // reads edge-on from the chase cam, no top/under-surface flash). Deep chord kept.
      // F0 hatchling — small but ROUNDED baby wing (4 short fingers, soft trailing fan).
      { tips: [[2.40, 0.26], [1.90, -0.50], [1.25, -0.70], [0.70, -0.60]],
        lead: [1.70, 0.42], scallop: 0.14, rootChord: 0.40, flame: false,
        arc: { bow: -0.08, hump: 0.06, humpAt: 0.56, hook: 0.0 } },
      // F1 kindled — a real fanned wing emerges, elbow appears, 5 fingers.
      { tips: [[3.40, 0.34], [2.85, -0.55], [2.10, -1.00], [1.30, -1.15], [0.70, -0.95]],
        lead: [2.40, 0.56], scallop: 0.20, rootChord: 0.56, flame: false,
        arc: { bow: -0.12, hump: 0.16, humpAt: 0.54, hook: 0.0 } },
      // F2 radiant — full broad fanned wing: deep chord, gull-wing droop, modest elbow.
      { tips: [[4.00, 0.42], [3.40, -0.55], [2.60, -1.05], [1.75, -1.30], [0.95, -1.12]],
        lead: [2.90, 0.66], scallop: 0.26, rootChord: 0.70, flame: false,
        arc: { bow: -0.15, hump: 0.22, humpAt: 0.55, hook: 0.0 } },
    ],
    forms: [
      // F0 HATCHLING — chibi: big round head-DOME (headBulge) + chubby round body (hullSection
      // ex high) + stubby wings + big low eyes + pupil. tiny, low-arched. ember nub, no flame.
      { wingForm: 0, bodyScale: 0.60, wingSpan: 0.74, wingChord: 1.20,
        hullSection: { ex: 2.7, flatTop: 1.05 }, headBulge: 1.30, spineArch: 0.70,
        eyeScale: 1.55, eyeYOffset: -0.05, eyePupil: true,
        wingWristMedial: 0.78, wingFingerSplay: 0.12, wingFingerCurve: 0.08, wingFingerBulge: 0.03,
        spineGlow: 0, glowIntensity: 0.3, particleRate: 0.22,
        wingOpacity: 0.92, wingPanelGlow: 0.08, previewScale: 0.78,
        hullDorsalNubs: false, tailBulbGlow: 0.12, tailBulbScale: 0.50,
        colors: { body: 0x2a1410, belly: 0x3a201a, scales: 0x4a241a, horn: 0x3a1f16,
          wingInner: 0x4a2014, wingOuter: 0x281008, wingEmissive: 0x5a2410,
          wingMembraneEmissive: 0x331810, eye: 0xffc878, apexSeam: 0x6a2c14 } },
      // F1 KINDLED — slimming, the wing fans more, a small elbow, first warmth.
      { wingForm: 1, bodyScale: 0.82, wingSpan: 0.92, wingChord: 1.40,
        hullSection: { ex: 2.2 }, headBulge: 1.12, spineArch: 0.92,
        eyeScale: 1.25, eyeYOffset: -0.02, eyePupil: true,
        wingWristMedial: 0.66, wingFingerSplay: 0.24, wingFingerCurve: 0.17, wingFingerBulge: 0.05,
        spineGlow: 0.14, glowIntensity: 0.55, particleRate: 0.55,
        wingOpacity: 0.9, wingPanelGlow: 0.12, previewScale: 0.92,
        hullDorsalNubs: false, tailBulbGlow: 0.6, tailBulbScale: 0.82,
        colors: { body: 0x331212, belly: 0x4a1c18, scales: 0x6a2a1c, horn: 0x4a2018,
          wingInner: 0x702a16, wingOuter: 0x30120a, wingEmissive: 0xa8421a,
          wingMembraneEmissive: 0x4e1f10, eye: 0xffc860, apexSeam: 0x9a3818 } },
      // F2 RADIANT — SHORT ARM / very MEDIAL wrist (0.56) so the fingers + leading frame FLARE
      // OUT in a big convex curve (the human's ideal). Deep chord, posed S-curve (spineArch 1.15).
      { wingForm: 2, bodyScale: 1.0, wingSpan: 1.0, wingChord: 1.55,
        hullSection: { ex: 1.9, flatTop: 0.95 }, headBulge: 1.0, spineArch: 1.15,
        eyeScale: 1.0, eyeYOffset: 0.0, eyePupil: true,
        wingWristMedial: 0.56, wingFingerSplay: 0.32, wingFingerCurve: 0.24, wingFingerBulge: 0.06,
        spineGlow: 0.30, glowIntensity: 0.95, particleRate: 0.9,
        wingOpacity: 0.9, wingPanelGlow: 0.16, previewScale: 1.0,
        hullDorsalNubs: false, tailBulbGlow: 1.15, tailBulbScale: 1.0,
        colors: { body: 0x3e1414, belly: 0x5a201a, scales: 0x8e3420, horn: 0x5a2418,
          wingInner: 0x9c3618, wingOuter: 0x3a120c, wingEmissive: 0xff6a22,
          wingMembraneEmissive: 0x6e2812, eye: 0xffd060, apexSeam: 0xd6521e } },
    ],
    fx: { auraColor: '200,90,40', auraIdle: 0.0, sparkle: false },
    previewAccent: 0xff6a20,
    body: 0x3a1216, belly: 0x5a201a, scales: 0x8a3420, horn: 0x5a2418,
    wingInner: 0x9a3618, wingOuter: 0x3e140c, wingEmissive: 0xff6a20,
    wingMembraneEmissive: 0x7a2a12, apexSeam: 0xd6521e,
    eye: 0xffd05a, trail: 0xff6a20, boostTrail: 0xffb24a,
  },

  // ── STARTER: WATER — "Tidewing", the manta ────────────────────────────────
  // Hull dragon. FLAT + WIDE manta body, huge TRIANGULAR pectoral fin-wings
  // (scallop≈0, flat plane — not a bat elbow), a thin whip tail ending in a flat
  // HORIZONTAL fluke. Soft teal bio-luminescence: rounded dorsal fin-bumps, a
  // translucent glowing membrane edge (wingSSS), teal spine-line. Enriched so its
  // Radiant is not plain, but kept SOFT + low-saturation (below future Eternals).
  water: {
    name: 'Tidewing',
    title: 'The Deepwater Manta',
    bodyMetalness: 0.0, bodyRoughness: 0.74, bodyEnvIntensity: 0.08, scaleSize: 3.4, scaleRelief: 0.55,
    rimBodyMul: 0.5,
    rarity: 'R', maxRarity: 'SSR', cost: 0,
    parts: {
      torso: 'hullTorso', head: 'none', wings: 'hullWings', tail: 'none',
      surface: { shader: ['cellularScalesNormal'] },
    },
    hull: {
      profile: WATER_PROFILE, section: { ex: 1.6, flatTop: 0.55, flatBot: 0.6 }, sectionN: 20,
      knobs: { eyes: true, eyeZ: -3.2, chestBand: [-1.30, 0.80], seamHalf: 0.7,
        dorsalRound: 1, dorsalZRange: [-2.6, 3.0] },
      tailFluke: { z: 4.0, scale: 1.0, yLift: 0.02 },
    },
    stats: { speed: 1.0, handling: 1.06, drain: 1.0, regen: 1.06 },
    model: {
      scale: 0.96, wingScale: 1.12, tailSegments: 0, neckSegments: 0, ridgeCount: 0,
      wingRootScale: 1.3, shoulderWidthScale: 1.15, wingRootOffset: { y: 0.0, z: -0.05 },
      riderSocket: { x: 0, y: 0.66, z: -0.35 },
      flapBias: 0.78, flapAmp: 1.05,
      wingArmLeadChord: 0.18, wingWristMedial: 1.0,
      wingArmRadius: 0.10, wingForearmRadius: 0.08, wingFrameTipRadius: 0.012,
      wingFingerCurve: 0.0, wingFingerSplay: 0.05, wingFingerBulge: 0.02, wingFingerRadius: 0.04,
      wingSSS: true, wingBillow: 0.16,
      tailWhip: true, bodyWhip: true, tailSteer: true,
      tailBoneZ: [1.45, 2.30, 3.10, 3.85],
    },
    wingForms: [
      { tips: [[3.80, 0.34], [2.55, -0.74], [1.30, -0.86]],
        lead: [2.50, 0.48], scallop: 0.02, rootChord: 0.55, flame: false,
        arc: { bow: 0.32, hump: 0.0, humpAt: 0.6, hook: 0.0 } },
      { tips: [[4.90, 0.40], [3.30, -0.92], [1.65, -1.05]],
        lead: [3.20, 0.56], scallop: 0.02, rootChord: 0.66, flame: false,
        arc: { bow: 0.38, hump: 0.0, humpAt: 0.6, hook: 0.0 } },
      { tips: [[5.70, 0.46], [3.85, -1.06], [1.95, -1.22]],
        lead: [3.70, 0.62], scallop: 0.02, rootChord: 0.76, flame: false,
        arc: { bow: 0.42, hump: 0.0, humpAt: 0.6, hook: 0.0 } },
    ],
    forms: [
      { wingForm: 0, bodyScale: 0.74, wingSpan: 0.9, wingChord: 1.15,
        spineGlow: 0, glowIntensity: 0.35, particleRate: 0.3,
        wingOpacity: 0.9, wingPanelGlow: 0.1, previewScale: 0.82, eyeScale: 1.3,
        hullDorsalNubs: false,
        colors: { body: 0x10303a, belly: 0x163e46, scales: 0x174450, horn: 0x123440,
          wingInner: 0x1d5566, wingOuter: 0x0e2630, wingEmissive: 0x16424f,
          wingMembraneEmissive: 0x103040, eye: 0x6fd8d0, apexSeam: 0x1a4a55 } },
      { wingForm: 1, bodyScale: 0.9, wingSpan: 0.96, wingChord: 1.2,
        spineGlow: 0.12, glowIntensity: 0.6, particleRate: 0.6,
        wingOpacity: 0.9, wingPanelGlow: 0.14, previewScale: 0.94, eyeScale: 1.25,
        hullDorsalNubs: true,
        colors: { body: 0x113844, belly: 0x184650, scales: 0x1a5160, horn: 0x143c4a,
          wingInner: 0x256476, wingOuter: 0x102b36, wingEmissive: 0x1f5e6e,
          wingMembraneEmissive: 0x165060, eye: 0x86e6dd, apexSeam: 0x2a6878 } },
      { wingForm: 2, bodyScale: 1.0, wingSpan: 1.0, wingChord: 1.25,
        spineGlow: 0.25, glowIntensity: 1.0, particleRate: 1.0,
        wingOpacity: 0.88, wingPanelGlow: 0.2, previewScale: 1.0,
        hullDorsalNubs: true, wingMembraneSSS: 0x2a8a92,
        colors: { body: 0x123e4c, belly: 0x1b505c, scales: 0x1d5e70, horn: 0x16424f,
          wingInner: 0x2c7488, wingOuter: 0x113040, wingEmissive: 0x2f8a98,
          wingMembraneEmissive: 0x1d6a78, eye: 0x9ff0e6, apexSeam: 0x34809a } },
    ],
    fx: { auraColor: '79,232,223', auraIdle: 0.0, sparkle: false },
    previewAccent: 0x2f8a98,
    body: 0x123e4c, belly: 0x1b505c, scales: 0x1d5e70, horn: 0x16424f,
    wingInner: 0x2c7488, wingOuter: 0x113040, wingEmissive: 0x2f8a98,
    wingMembraneEmissive: 0x1d6a78, apexSeam: 0x34809a, wingMembraneSSS: 0x2a8a92,
    eye: 0x9ff0e6, trail: 0x2f8a98, boostTrail: 0x7fe8df,
  },

  // ── STARTER: EARTH — "Cragmaw", the plated cragback ───────────────────────
  // Hull dragon. HEAVY broad tank body with a tall plated back (stone shingle run),
  // short broad leathery wings, and a stone CLUB tail (grown from the loft — the
  // rear stations swell back up). Opaque rough rock, warm amber crack-glow at
  // Radiant. Grounded mineral read; nothing else on the roster is a heavy club-tail.
  earth: {
    name: 'Cragmaw',
    title: 'The Plated Cragback',
    bodyMetalness: 0.0, bodyRoughness: 0.95, bodyEnvIntensity: 0.04, scaleSize: 2.6, scaleRelief: 1.0,
    rimBodyMul: 0.4,
    rarity: 'SR', maxRarity: 'SSR', cost: 1200,
    parts: {
      torso: 'hullTorso', head: 'none', wings: 'hullWings', tail: 'none',
      surface: { shader: ['cellularScalesNormal'] },
      shingle: [
        { count: [0, 4, 9], zRange: [-1.7, 1.5], len: 0.42, wid: 0.3, cup: 0.34, tilt: 0.4, yLift: 0.5, edge: true },
      ],
    },
    hull: {
      profile: EARTH_PROFILE, section: { ex: 2.6, flatTop: 1.0 }, sectionN: 20,
      knobs: { eyes: true, eyeZ: -3.25, chestBand: [-1.35, 0.85] },
    },
    stats: { speed: 1.0, handling: 1.0, drain: 1.04, regen: 1.02 },
    model: {
      scale: 1.02, wingScale: 0.82, tailSegments: 0, neckSegments: 0, ridgeCount: 0,
      wingRootScale: 1.3, shoulderWidthScale: 1.2, wingRootOffset: { y: 0.05, z: -0.06 },
      riderSocket: { x: 0, y: 0.92, z: -0.4 },
      flapBias: 1.1, flapAmp: 0.78,
      wingArmLeadChord: 0.3, wingWristMedial: 0.95,
      wingArmRadius: 0.13, wingForearmRadius: 0.1, wingFrameTipRadius: 0.018,
      wingFingerCurve: 0.08, wingFingerSplay: 0.12, wingFingerBulge: 0.07, wingFingerRadius: 0.07,
      tailWhip: true, bodyWhip: true, tailSteer: true,
      tailBoneZ: [1.40, 2.20, 3.00, 3.70],
    },
    wingForms: [
      { tips: [[3.10, 0.32], [2.35, -0.46], [1.55, -0.64], [0.85, -0.6]],
        lead: [2.05, 0.5], scallop: 0.14, rootChord: 0.5, flame: false,
        arc: { bow: 0.4, hump: 0.0, humpAt: 0.6, hook: 0.05 } },
      { tips: [[3.70, 0.36], [2.85, -0.54], [1.9, -0.78], [1.0, -0.74]],
        lead: [2.45, 0.56], scallop: 0.16, rootChord: 0.58, flame: false,
        arc: { bow: 0.45, hump: 0.15, humpAt: 0.55, hook: 0.08 } },
      { tips: [[4.20, 0.4], [3.25, -0.6], [2.2, -0.9], [1.15, -0.86]],
        lead: [2.75, 0.62], scallop: 0.18, rootChord: 0.66, flame: false,
        arc: { bow: 0.5, hump: 0.3, humpAt: 0.56, hook: 0.12 } },
    ],
    forms: [
      { wingForm: 0, bodyScale: 0.76, wingSpan: 0.85, wingChord: 1.0,
        spineGlow: 0, glowIntensity: 0.3, particleRate: 0.25,
        wingOpacity: 0.96, wingPanelGlow: 0.04, previewScale: 0.84, eyeScale: 1.2,
        colors: { body: 0x2c2820, belly: 0x353024, scales: 0x423a2a, horn: 0x4a4030,
          wingInner: 0x3a3326, wingOuter: 0x231f18, wingEmissive: 0x2a2418,
          wingMembraneEmissive: 0x241f16, eye: 0xc8a850, apexSeam: 0x6e5a2a } },
      { wingForm: 1, bodyScale: 0.9, wingSpan: 0.93, wingChord: 1.05,
        spineGlow: 0.12, glowIntensity: 0.55, particleRate: 0.5,
        wingOpacity: 0.96, wingPanelGlow: 0.06, previewScale: 0.95, eyeScale: 1.15,
        colors: { body: 0x322c22, belly: 0x3e3628, scales: 0x4e4430, horn: 0x564a36,
          wingInner: 0x443a2a, wingOuter: 0x29241b, wingEmissive: 0x6e4a1e,
          wingMembraneEmissive: 0x2c2519, eye: 0xd8b058, apexSeam: 0xc8861e } },
      { wingForm: 2, bodyScale: 1.0, wingSpan: 1.0, wingChord: 1.1,
        spineGlow: 0.26, glowIntensity: 0.95, particleRate: 0.9,
        wingOpacity: 0.96, wingPanelGlow: 0.08, previewScale: 1.0,
        colors: { body: 0x383024, belly: 0x463c2c, scales: 0x5a4e36, horn: 0x60543e,
          wingInner: 0x4e4230, wingOuter: 0x2c261c, wingEmissive: 0xc8861e,
          wingMembraneEmissive: 0x302819, eye: 0xe6c068, apexSeam: 0xe09a26 } },
    ],
    fx: { auraColor: '200,150,60', auraIdle: 0.0, sparkle: false },
    previewAccent: 0xc8861e,
    body: 0x383024, belly: 0x463c2c, scales: 0x5a4e36, horn: 0x60543e,
    wingInner: 0x4e4230, wingOuter: 0x2c261c, wingEmissive: 0xc8861e,
    wingMembraneEmissive: 0x302819, apexSeam: 0xe09a26,
    eye: 0xe6c068, trail: 0xc8861e, boostTrail: 0xe6c068,
  },

  // AURUM TORO — a Lamborghini-Aventador-as-dragon, and the HERO that proves the
  // new FACETED ("hard-edge / automotive") part family (dragonFaceted.js): a
  // COMPACT, thick, muscular bull-barrel body on a BOXY mecha cross-section, with
  // sharp framed swept-delta wings, forward-swept bull horns, and the SVJ REAR as a
  // RIGID spoiler tail (svjRear) — a boxy transom with the wraparound tail-light bar,
  // central exhausts, a vertical-finned diffuser, and two articulating stabilizer
  // flaps that pitch like aircraft elevators; plus a fixed rear wing on uprights,
  // scissor hinges, a front splitter and flank vents. The deliberate opposite of the matte-organic
  // roster default — it opts BACK INTO mirror gloss (the per-dragon bodyRoughness/
  // bodyMetalness/bodyEnvIntensity finish override) for a giallo clearcoat. Faithful accents: xenon-
  // blue eyes + amber/red tail-light seams. Quick-look prototype — the PARTS are
  // the deliverable, so the 4 forms share one palette/silhouette and only ramp the
  // gloss + light (carbon "primer" → full giallo clearcoat, exhaust ablaze).
  aurumToro: {
    name: 'Aurum Toro',
    title: 'The raging bull',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 5000,
    parts: {
      torso: 'svjHull', wings: 'svjBladeWing', head: 'svjWedgeHead', tail: 'svjArmorTail',
      surface: { shader: ['cellularScalesNormal'] },  // subtle carbon-hex micro-relief on the gold hull
      surfaceLayers: ['svjScaleArmor', 'engineBay', 'ventSlashes', 'twinThrusters',
        'rearDiffuser', 'svjDorsalSpine', 'scissorHinge'],
    },
    // Mecha hex-scale: low relief (crisp armor, not squishy organic), medium cell size.
    scaleSize: 4.5, scaleRelief: 0.28,
    // Fast, sharp-handling, thirsty — a supercar (drain>1 = burns boost fast).
    stats: { speed: 1.16, handling: 1.22, drain: 1.04, regen: 0.95 },
    model: {
      // SVJ mecha rebuild — built BIG (huge cropped wings, long armored tail) so the
      // silhouette is easy to judge; shrink via `scale` later once the read is right.
      // Broad GLIDE wings (low flapAmp keeps them wide), short neck, bulky engine block.
      scale: 1.0, wingScale: 1.0, tailSegments: 9, neckSegments: 3,
      shoulderWidthScale: 1.25,
      hornLen: 0.9, hornPairs: 1, ridgeCount: 0, eyeScale: 1.15,
      flapBias: 0.85, flapAmp: 0.7,
    },
    // Giallo clearcoat: glossy + reflective in the shop hero scene (no env in-game).
    bodyRoughness: 0.18, bodyMetalness: 0.55, bodyEnvIntensity: 0.8,
    forms: [
      // Primer — matte carbon, lights stowed.
      { spineGlow: 0,
        colors: { bodyRoughness: 0.6, bodyMetalness: 0.28,
          body: 0x6b5a16, wingInner: 0x6b5a16, wingEmissive: 0x7a3412,
          apexSeam: 0x7a3412, eye: 0x2a90c0, coreGlow: 0x7a3412 } },
      // Primed gold, lights warming.
      { spineGlow: 0,
        colors: { bodyRoughness: 0.34, bodyMetalness: 0.45,
          body: 0xc79a0c, wingInner: 0xc79a0c, wingEmissive: 0xd06a18,
          apexSeam: 0xd0431f, eye: 0x3fb8f0, coreGlow: 0xd06a18 } },
      // Giallo gloss, full tail-lights (xenon eyes switch in at this tier).
      { spineGlow: 0.3, glowIntensity: 1.05,
        colors: { bodyRoughness: 0.2, bodyMetalness: 0.55,
          body: 0xf2c20e, wingInner: 0xf2c20e, wingEmissive: 0xff8a1f,
          apexSeam: 0xff3b2f, eye: 0x3fc6ff, coreGlow: 0xff8a1f } },
      // Apex — brightest clearcoat, exhaust ablaze.
      { spineGlow: 0.5, glowIntensity: 1.2,
        colors: { bodyRoughness: 0.15, bodyMetalness: 0.6,
          body: 0xffd21a, wingInner: 0xffd21a, wingEmissive: 0xffa52a,
          apexSeam: 0xff3b2f, eye: 0x6fd6ff, coreGlow: 0xffa52a } },
    ],
    fx: { auraColor: '255,138,31', auraIdle: 0.06, sparkle: false },
    body: 0xf2c20e, belly: 0x0e0e12, scales: 0x141418, horn: 0x0e0e12,
    wingInner: 0xf2c20e, wingOuter: 0x6e5408, wingEmissive: 0xff8a1f,
    apexEye: 0x3fc6ff, apexSeam: 0xff3b2f, coreGlow: 0xff8a1f, surgeHi: 0xfff3d0,
    eye: 0x3fc6ff, trail: 0xff8a1f, boostTrail: 0xff3b2f,
  },

  // Aurum Toro Mk II — a NEW selectable dragon: the current SVJ body (svjHull + scales
  // + spine + thrusters) wearing a BRAND-NEW layered SVJ jet-blade WING (svjJetWing)
  // and an aero-trident stabilizer TAIL (svjAeroTridentTail), both authored to the
  // player's hard-surface spec. Distinct wings + tail vs the current 'aurumToro'.
  aurumToroMk2: {
    name: 'Aurum Toro Mk II',
    title: 'The raging bull',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 5000,
    parts: {
      torso: 'svjHull', wings: 'svjJetWing', head: 'svjWedgeHead', tail: 'svjAeroTridentTail',
      surface: { shader: ['cellularScalesNormal'] },
      // Identity pass: shoulder nacelles (wings plug into the engine bay) + armored
      // spine "vertebrae" caps INSTEAD of the thin dorsal spikes.
      surfaceLayers: ['svjScaleArmor', 'engineBay', 'ventSlashes', 'svjShoulderNacelles',
        'twinThrusters', 'rearDiffuser', 'svjSpineArmorCaps', 'scissorHinge'],
    },
    scaleSize: 4.5, scaleRelief: 0.28,
    stats: { speed: 1.16, handling: 1.22, drain: 1.04, regen: 0.95 },
    model: {
      scale: 1.0, wingScale: 1.0, tailSegments: 9, neckSegments: 3,
      shoulderWidthScale: 1.25,
      // Mk II massing (shared builders read these; default-1 keeps the sibling Aurum
      // Toro byte-identical). WIDE but LOW: keep shoulders + rear engine-bay broad,
      // but DROP the global height inflation and COMPRESS the central belly so it reads
      // as a low SVJ engine bay, not a round/pear abdomen. Longer/lower wedge skull.
      torsoWidthScale: 1.18, torsoHeightScale: 1.0, rearBulkScale: 1.28, bellyFlatten: 0.86,
      headLenScale: 1.22, headHeightScale: 0.8,
      hornLen: 0.9, hornPairs: 1, ridgeCount: 0, eyeScale: 1.15,
      flapBias: 0.85, flapAmp: 0.7,
      // HEAVY MECHANICAL OVERLORD flap (two-channel YOKE solver, on the BASE model so all tiers
      // share it). Channel 1 = yoke whole-wing elevation (UP at apex, deep DOWN/pressing on the
      // power stroke). Channel 2 = inner/mid/tip CURL (0 at glide+downstroke = straight, 1 at apex
      // = rounded V), lagged so the upstroke domes (tip flat) and the apex rounds (tip catches up).
      // + fore-aft ROWING sweep (reach forward on downstroke, back at apex) + tip trail at extension.
      flap: {
        downFrac: 0.56, downDepth: 2.2,                 // smooth beat; heavier downstroke; bottom ≈ −44°
        lag: { inner: 0.05, mid: 0.07, tip: 0.20 },     // tip trails most → dome + follow-through
        yokeElevDeg: 20, curlDeg: { inner: 14, mid: 18, tip: 10 },
        sweepDeg: { mid: 6, tip: 12 }, rowDeg: 11,
        tipTrailDeg: 16, twistDeg: 5, loadBowDeg: 0,    // strong tip trail → domed upstroke
        body: { liftAmt: 0.05, tailDropDeg: 4, tailLag: 0.08 },
      },
    },
    // Dominant twin thrusters with layered contrast (black housing → yellow frame →
    // saturated-red turbine ring → bright orange hot core → warm-white hotspot). The
    // cores are the brightest red-orange elements on the dragon (bloom-lit), reading
    // before the dimmer wing chevrons. Diameters → radii (outer 0.52 ⇒ rOuter 0.26).
    thruster: {
      rOuter: 0.26, rCore: 0.17, spread: 0.4, frame: true,
      intensity: 2.6,                 // saturated-red turbine ring
      ringColor: 0xff2a18, coreColor: 0xff7a1a, coreIntensity: 4.2,
      hotColor: 0xfff0b8, hotIntensity: 3.6,
    },
    bodyRoughness: 0.18, bodyMetalness: 0.55, bodyEnvIntensity: 0.8,
    forms: [
      // ── HATCHLING (baby): tiny weak 1-segment wings, oversized soft head, no
      //    thrusters/nacelles/trident/horns, short simple tail. Frantic flapper. ──
      { spineGlow: 0,
        bodyScale: 0.46, wingSpan: 0.42, wingParts: 1,
        torsoWidthScale: 0.85, bellyFlatten: 1.0, rearBulkScale: 1.0,
        headScale: 1.3, headLenScale: 0.9, headHeightScale: 1.05, eyeScale: 1.45, hornLevel: 0,
        thrusterLevel: 0, nacelleLevel: 0, spineCapLevel: 0, tailTip: 0, tailSegments: 5,
        flapFreqScale: 2.15, rootAmp: 0.52, midAmp: 0, tipAmp: 0, midLag: 0, tipLag: 0,
        glidePow: 0.8, bodyBobScale: 1.18, headWobbleScale: 0.18, tailLagScale: 0.2,
        colors: { bodyRoughness: 0.6, bodyMetalness: 0.28,
          body: 0x6b5a16, wingInner: 0x6b5a16, wingEmissive: 0x7a3412,
          apexSeam: 0x7a3412, eye: 0x2a90c0, coreGlow: 0x7a3412 } },
      // ── KINDLED (teen): 2-segment wings, early angular traits, proto vent-cores,
      //    light nacelles, fork tail. Energetic, a bit awkward. ──
      { spineGlow: 0,
        bodyScale: 0.68, wingSpan: 0.66, wingParts: 2,
        torsoWidthScale: 0.98, bellyFlatten: 0.95, rearBulkScale: 1.1,
        headScale: 1.08, headLenScale: 1.05, headHeightScale: 0.95, eyeScale: 1.25, hornLevel: 1,
        thrusterLevel: 1, nacelleLevel: 1, spineCapLevel: 1, tailTip: 1, tailSegments: 7,
        flapFreqScale: 1.7, rootAmp: 0.38, midAmp: 0.26, tipAmp: 0, midLag: 0.5, tipLag: 0,
        glidePow: 1.1, bodyBobScale: 1.0, headWobbleScale: 0.08, tailLagScale: 0.16,
        colors: { bodyRoughness: 0.34, bodyMetalness: 0.45,
          body: 0xc79a0c, wingInner: 0xc79a0c, wingEmissive: 0xd06a18,
          apexSeam: 0xd0431f, eye: 0x3fb8f0, coreGlow: 0xd06a18 } },
      // ── RADIANT (adult): full 3-segment wing, adult engine-bay, full nacelles,
      //    adult dual thrusters, light trident. Controlled, premium. ──
      { spineGlow: 0.3, glowIntensity: 1.05,
        bodyScale: 0.85, wingSpan: 0.85, wingParts: 3,
        torsoWidthScale: 1.08, bellyFlatten: 0.9, rearBulkScale: 1.2,
        headScale: 0.98, headLenScale: 1.15, headHeightScale: 0.85, eyeScale: 1.18, hornLevel: 2,
        thrusterLevel: 2, nacelleLevel: 2, spineCapLevel: 2, tailTip: 2, tailSegments: 8,
        flapFreqScale: 1.35, rootAmp: 0.26, midAmp: 0.3, tipAmp: 0.4, midLag: 0.5, tipLag: 1.0,
        glidePow: 1.6, bodyBobScale: 0.78, headWobbleScale: 0.03, tailLagScale: 0.12,
        colors: { bodyRoughness: 0.2, bodyMetalness: 0.55,
          body: 0xf2c20e, wingInner: 0xf2c20e, wingEmissive: 0xff8a1f,
          apexSeam: 0xff3b2f, eye: 0x3fc6ff, coreGlow: 0xff8a1f } },
      // ── ETERNAL (overlord): the current finished design — biggest, fullest layered
      //    wings, dominant thrusters, full aero-trident, severe wedge + crown. ──
      { spineGlow: 0.5, glowIntensity: 1.2,
        bodyScale: 1.0, wingSpan: 1.0, wingParts: 3,
        torsoWidthScale: 1.18, bellyFlatten: 0.86, rearBulkScale: 1.28,
        headScale: 0.94, headLenScale: 1.22, headHeightScale: 0.8, eyeScale: 1.15, hornLevel: 3,
        thrusterLevel: 3, nacelleLevel: 3, spineCapLevel: 3, tailTip: 3, tailSegments: 9,
        flapFreqScale: 0.82, midLag: 0.5, tipLag: 1.0,
        glidePow: 2.6, bodyBobScale: 0.35, headWobbleScale: 0.0, tailLagScale: 0.07,
        // (flap config lives on the BASE model so all tiers share the yoke solver.)
        colors: { bodyRoughness: 0.15, bodyMetalness: 0.6,
          body: 0xffd21a, wingInner: 0xffd21a, wingEmissive: 0xffa52a,
          apexSeam: 0xff3b2f, eye: 0x6fd6ff, coreGlow: 0xffa52a } },
    ],
    fx: { auraColor: '255,138,31', auraIdle: 0.06, sparkle: false },
    body: 0xf2c20e, belly: 0x0e0e12, scales: 0x141418, horn: 0x0e0e12,
    wingInner: 0xf2c20e, wingOuter: 0x6e5408, wingEmissive: 0xff8a1f,
    apexEye: 0x3fc6ff, apexSeam: 0xff3b2f, coreGlow: 0xff8a1f, surgeHi: 0xfff3d0,
    eye: 0x3fc6ff, trail: 0xff8a1f, boostTrail: 0xff3b2f,
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
