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
    accentHue: 0xd9b36a,   // §5d law-9 carrier: DIFFUSE gold tip-paint only, zero wing emissive
    // AZURE Drake — the falcon-winged sky courier (§5d slot A). A compact avian
    // glider (deep-keel arrow read) whose HERO is a swept blade-feather comb: 5
    // stiff falcon primaries marching a swept leading arm, true gaps + z-stagger,
    // painted value tiers + gold diffuse tips. Draconic head with a brow-crest
    // motif; a clean tail forking into a swallow-banner at the apex.
    stats: { speed: 1.0, handling: 1.0, drain: 1.0, regen: 1.0 },
    parts: { torso: 'sweptLoft', wings: 'bladeFeatherWings', head: 'draconic', tail: 'clean' },
    model: {
      scale: 1.0, wingScale: 1.0, tailSegments: 6, neckSegments: 5,
      headArchetype: 'softStealth',   // round friendly base, tuned keen per form via eyeShape/brow
      headScale: 1.0, snoutScale: 0.86, browIntensity: 1.15,
      // Azure's ONLY head accent is its brow-crest motif (gate r1 dir 7): no ear-fin
      // horns, no rear-crest, no rear glow — the sunburst nape corona is deleted.
      hornType: 'noHorn', rearCrestType: 'noRearCrest', rearGlowIntensity: 0,
      snoutType: 'taperedPredatorSnout', crestBase: 0x7fa3c8, keenEye: true,
      neckBlend: 1.15,  // SLIM falcon neck: a fat neck (2.1) swallowed the small proud head — slimmer than the head so it sits proud (§5d avian)
      // blade-feather comb shared dials (per-form span/count/etc. accrete below)
      bladeCount: 5, bladeSweep: 0.34, bladeStagger: 0.28,   // slightly less back-sweep so the wing is more LATERAL → smaller side-view footprint (gate r9 dir 2); deep z-stagger keeps the planform slits
      bladeCamber: 0.16, bladeDihedral: 0.26, bladeChord: 0.133,   // dihedral 15° gull; slimmer chord (side-facing area, NOT span) shrinks the side-view footprint toward body 55-65% (gate r10 dir 3)
      hornPairs: 1, hornLen: 0.9, ridgeCount: 10, ridgeSeat: -0.02, ridgeStyle: 'scute', ridgeColor: 0x264460,   // dorsal scutes: low leaf-scutes tinted to the body value so the back reads as one sleek mass (gate r8 dir 9), not pale beads
      wingRootOffset: { z: -0.4 },   // shoulder forward toward the nose (−z) so the comb roots on the shoulder, not the mid-back (was reading too far aft)
      flapBias: 1.0, flapAmp: 0.9,    // light courier beat
    },
    // Three visible forms (starter caps at SSR / tier 2): a round-chested fluffball
    // glider with a stub comb + crest nub + forked tail-hint → adolescent, blades
    // lengthen + crest fans → the 2.8–3.2× apex with a full high-aspect comb, a
    // 3-blade crest, and a gold-tipped swallow-banner tail. Restraint IS the read —
    // spineGlow ≤0.3, gold stays DIFFUSE.
    forms: [
      // Hatchling (form 0) — round fluffball: curled posture, round low eyes, big
      // head, stub gapped comb, crest nub, forked tail-tip hint. Lighter sky value.
      { wingScale: 0.72, bladeSpan: 3.0, bladeCount: 5, bladeDetail: 0.6, bladeChord: 0.28, bladeStagger: 0.14, bladeRake: 0.015,   // FALCON-COMPACT (owner CP3): whole span ladder rescaled ×0.56 (5.4→3.0) to hold the growth arc while the apex lands at Phoenix parity. CP2 dir 3: BABY wings — a near-parallel low rake (0.015) + low stagger + wide chord welds the 5 blades into ONE solid MITTEN paddle so the trailing edge stops reading as a Christmas-tree sawtooth (fable gate). The apex re-pins the fanned formula (bladeRake:-1) for its hero planform slits. — 5 blades (§3 comb identity holds) but SHORTER + a WIDE chord (0.28 so the roots overlap the arm spar into one connected wing, gate r2 dir 5) → soft welded paddles. NOTE: forms merge CUMULATIVELY (ascension.js) so any dial set here leaks to f1/f2 unless re-declared — the apex re-pins the leaked ones below
        spineCurl: -0.8, eyeShape: 0.0, headScale: 1.3, eyeScale: 1.25, snoutScale: 0.5,   // CP2 dir 1: SHORT button muzzle; headScale 1.3 keeps the BIG cute head; eyeScale 1.25 opens a nose-bridge GAP between the eyes (1.45 merged them into a figure-8) — still the ladder's biggest eyes (> f1's 1.02) and in the [0.3,0.45] band
        keenEye: false, cuteEye: true,   // CP2: the hatchling wears the ROUND sphere eye with a big dark forward pupil + glint (not the keen falcon almond+brow-slab, which is apex-only). eyeShape 0 + eyeScale 1.7 → a big low round cute eye
        crestBlades: 1, crestScale: 0.7, crestGoldAmount: 0.1,   // CP2 dir 2: a single SOFT NUB (browCrest rounds the n=1 case), body-hued (no gold on the baby), not a wire feeler
        wingTipGold: 0xd9b36a, wingTipGoldAmount: 0.12,   // CP2 dir 5: only a faint amber hint at the baby — the full gold banner is an earned adult signature
        tailStyle: 'simple', tailTipFork: true, tailSegments: 5, neckSegments: 4, tailPlates: false,   // smooth baby tail — the dorsal-cone row read as a drill-bit from rear-chase (fable gate)
        ridgeCount: 0, spineGlow: 0,
        colors: { body: 0x6f8fb2, belly: 0xe2f0fb, wingInner: 0xc8ddee, wingOuter: 0x86a3c0,   // CP2 dir 4: PALE powder-blue baby (was dark navy 0x2a4058, as dark as the teen) — value now clearly lightens toward the hatchling
          wingEmissive: 0x6f8ca6, scales: 0xbcd2e4, horn: 0xc2d6e6,
          apexSeam: 0x9cbcd6, eye: 0x8ec6ee, coreGlow: 0x9cc0dc } },
      // Adolescent (form 1) — straightening posture, keener eyes, blades lengthen,
      // crest begins its 3-blade fan, span 2.0–2.3×. Mid sky value.
      { wingScale: 0.9, bladeSpan: 4.1, bladeCount: 5, bladeDetail: 0.92, bladeBarring: 0.5,   // FALCON-COMPACT (owner CP3): 7.3→4.1 (ladder ×0.56); bladeBarring 0.5 = the barring begins (gated: none at f0 → half at f1 → full at apex)
        spineCurl: 0.0, eyeShape: 0.55, headScale: 0.84, eyeScale: 1.02, snoutScale: 0.62,   // CP2 dir 6: trim the muzzle ~28% so it sits BETWEEN f0's button and f2's short beak; headScale 0.84 keeps eye:head in band after the cut (still a clear step down from f0's 1.3)
        keenEye: false, cuteEye: true,   // CP2: the adolescent bridges — a big ROUND-ALERT pupil eye (eyeShape 0.55 half-almonds it), NOT yet the apex keen falcon decal. The keen almond arrives only at the Radiant apex
        crestBlades: 2, crestScale: 0.74, crestGoldAmount: 0.15, crestSeat: 0.13,   // CP2 r3 dir 3: mute crest gold to body-hue + seat the sprouts into the crown (0.13 = as deep as the §7 motif-invariance drift cap allows) so they root rather than hover
        wingTipGold: 0xd9b36a, wingTipGoldAmount: 0.5,   // CP2 dir 5: PARTIAL gold at the adolescent
        tailStyle: 'simple', tailTipFork: true, tailSegments: 5, neckSegments: 5,
        ridgeCount: 8, spineGlow: 0,
        colors: { body: 0x496d99, belly: 0xd4e9ff, wingInner: 0xc6dff0, wingOuter: 0x6f90b4,   // CP2 r2 dir 4: a true MID value (was 0x33517a, near-apex-deep) — the ramp now reads pale f0 → mid f1 → deep f2
          wingEmissive: 0x5f7f9c, scales: 0xb2cee6, horn: 0xb6cfe4,
          apexSeam: 0x9cc0dc, eye: 0xbfe2fb, coreGlow: 0x86bce4 } },
      // Radiant apex (form 2) — proud upright S, keen almond eyes, high-aspect
      // comb, 3-blade crest fan, dorsal sail, gold-tipped swallow
      // banner tail. Deepest sky value, gold at its richest (still DIFFUSE).
      { wingScale: 1.0, bladeSpan: 6.5, bladeCount: 5, bladeDetail: 1.0, bladeBarring: 1.0, neckBlend: 1.45,   // OPTIMIZE+PIZZAZZ (owner): bladeDetail 1.45→1.0 reclaims ~1024 tris (the compacted blades were over-tessellated for their new size, ~sub-8px), and bladeBarring 1.0 paints FREE falcon cross-bars on the primaries (the headline identity gain). FALCON-COMPACT (owner CP3 r2): span reined 11.6 → 6.5 (a 9.4 first pass still read "way too long" in-flight vs Phoenix). Apex chase-cam width now ≈ Phoenix parity (1.06×, a hair of falcon margin); world-span 16.3→~8.8, span:body ~1.16. This drops below the old §5d falcon floor (1.6) — an OWNER-DIRECTED override of that doctrine guess; the swept blade-comb identity is kept, just at falcon-stoop reach. Blade length adds no tris; denser neck fuses the segment grooves
        spineCurl: 0.95, eyeShape: 1.0, headScale: 0.52, eyeScale: 0.88,   // eyeScale 0.88 (was 0.52→0.85): the gate read the apex "blind head-on"; the readability comes mostly from the forward+up anchor + forward pupil disc — the size stays the ladder's smallest (§7 eye:head monotonic holds)
        // APEX PIN (CP2): forms merge cumulatively, so re-declare every dial the younger forms
        // changed — otherwise f1's muted-gold/wide-chord leak forward and silently corrupt
        // the approved apex. These pin the exact approved apex values.
        keenEye: false, cuteEye: true,   // the apex joins the UNIFIED socketed-eye system — eyeShape 1.0 hoods it into a keen slanted almond. (The old keenEye decal was dark-on-dark: it read as NO eyes at gameplay value — the unresolved wall since CP1)
        bladeChord: 0.133, bladeStagger: 0.28, bladeRake: -1,   // approved apex chord + deep stagger + the FANNED per-blade rake formula (sentinel -1) for the hero planform slits (f0 welded them at 0.28/0.14/0.015)
        crestGoldAmount: 1, crestSeat: 0,   // full gold crest at its approved height (f1 muted+sank it)
        wingTipGoldAmount: 1,            // full gold swallow-banner tips (f0/f1 restrained them)
        crestBlades: 3, crestScale: 1.6, skullType: 'smoothWedgeSkull', snoutScale: 0.68,   // bespoke ONE-shell falcon wedge (no ellipsoid plate-stack); shorter muzzle seats head:body/eye:head in band + kills the needle beak; crest breaks the outline
        tailStyle: 'finned', tailBannerFork: true, tailLength: 0.62, tailSegments: 6, neckSegments: 5,   // shorter tail so the wings visually dominate (gate r7 dir 7) — raises the reconciled visual span:body
        bannerSpread: 0.74, bannerLength: 2.15, bannerNotch: 0.85, bannerCoverts: true, tailTerminus: true, tailSeam: true, tailPlates: false,   // REAR-CHASE SPECTACLE (owner S3 + critic addition): amplify the gold swallow-banner ~25% + a gold fork-root covert pair; carry the dorsal ice seam over the TAIL-CONE ridge (tailSeam — the strip that dominates the chase frame; replaces the drill-bit cones tailPlates drew) and cap it with a cyan TERMINUS STUD at the fork — the night read becomes "cyan spine → cyan tail-light → gold swallow". Apex-only
        ridgeCount: 7, spineGlow: 0.2, dorsal: true, scuteSeam: true, facetShoulders: true,   // REAR-CHASE SPECTACLE (owner S2+S6): one continuous ice seam down the keel (replaces the sub-8px cone zipper) — the apex's earned "spine of light", dead-centre of the play view; + faceted gold-tipped scapular coverts replacing the smooth shoulder balls at the wing roots. Apex-only (f0/f1 stay dark/round)
        colors: { body: 0x27435f, belly: 0xcfe6ff, wingInner: 0xb0cbe6, wingOuter: 0x466685,   // body lifted 0x1c3048→0x27435f (fable gate: the apex crushed to a black silhouette in dark skies); still clearly the deepest of the ladder
          wingEmissive: 0x466685, scales: 0x9db8d4, horn: 0xbcd9f0,
          apexSeam: 0x8ed5ff, eye: 0xcfe8ff, coreGlow: 0x8ed5ff } },
    ],
    fx: { auraColor: '142,213,255', auraIdle: 0.0, sparkle: false },
    // Matte navy hide (gate r1 dir 10) — not a gloss boat hull.
    bodyRoughness: 0.62, bodyMetalness: 0.05, bodyEnvIntensity: 0.5,
    body: 0x1c3048, belly: 0xcfe6ff, scales: 0x9db8d4, horn: 0xbcd9f0,
    wingInner: 0xa8c6e2, wingOuter: 0x3d5a78, wingEmissive: 0x3d5a78,
    apexEye: 0xcfe8ff, apexSeam: 0x8ed5ff, coreGlow: 0x8ed5ff, surgeHi: 0xeaf6ff,
    eye: 0x8ed5ff, trail: 0x8ed5ff, boostTrail: 0x67b7ff,
  },

  ember: {
    name: 'Ember Wyrm',
    title: 'Forged in cinder',
    rarity: 'SR',
    maxRarity: 'SSR',   // starter: evolution caps at SSR, never SSSR
    cost: 600,
    accentHue: 0xff8b2a,   // lava accent (~27°) — carried on a BOLD warm flame body (iconic-flame direction, human-directed override of the old near-black coal sheet)
    // EMBER Wyrm — an ICONIC FLAME dragon (human art-direction: "think Charizard").
    // Bold warm-orange body + a light cream belly; the gapped-finger membrane wings
    // read as fire (glowing rays through a warm membrane); glowing lava-crack seams; a
    // FLAMING tail; feralPredator draconic head; the forge-collar corona as a bloom.
    // NOTE: this reverses the §5d near-black/emissive-only palette + the "no tail glow"
    // rule and now overlaps `fire` (Cinderwing) — flagged for the doc + roster (see PR).
    stats: { speed: 1.04, handling: 1.06, drain: 0.95, regen: 1.05 },
    parts: { torso: 'arrow', wings: 'emberMembraneWings', head: 'draconic', tail: 'clean' },
    model: {
      scale: 1.08, wingScale: 1.0, tailSegments: 6, neckSegments: 4,
      headArchetype: 'feralPredator',   // heavy brow, small deep-set hot eyes, angular jaw ('horned' is OUT — ignores headScale/snout)
      headScale: 1.0, snoutScale: 0.7, browIntensity: 1.35,
      hotEye: true,                     // small PROUD emissive eye clears the long predator muzzle → reads as the brightest facial point (§4)
      bellyPaint: true,                 // cream two-tone underside (the Charizard belly) vertex-painted on the ventral torso
      tailIron: true,                   // matte-warm iron tail that now GLOWS via spineGlow (a lit flame tail, no cool sheen)
      squareShoulders: true,            // beveled BLOCK scapula plates → the anvil shoulder read (not round balls)
      shoulderWidthScale: 1.4,          // ANVIL shoulders (tier-0 key: ≥1.25× azure's hatchling)
      hornType: 'bladeRearHorns', rearGlowIntensity: 0,
      neckBlend: 1.85,                  // overlapping forge neck — fuses the segment beads into a smooth throat (gate cp2 r2 dir 4: the bead chain shingled under the chin)
      // ember gapped-finger membrane shared dials (per-form span/collar accrete below)
      rayCount: 4, raySweep: 0.62, rayDihedral: 0.26, membraneCamber: 0.34, scallop: 0.28,
      rayScale: 0.82, rayDetail: 1.0, rayEmissiveIntensity: 1.2,
      membraneBase: 0x6a2410,           // WARM dark-red membrane (fire wings) — held below 0x8a3316 (§7) but clearly warm, not black
      sparColor: 0xc0763c,              // warm ember leading spar (lit)
      flapBias: 0.95, flapAmp: 0.95,    // heavy, powerful beat
    },
    // Three visible forms (starter caps at SSR / tier 2): a round pot-bellied forge
    // pup (coal pair, stub gapped wings) → shoulders square up, rays lengthen, horns
    // bud, collar arc → the anvil apex (broad gapped wings, backSpines, blazing
    // collar corona). Forms differ in PROPORTION + FEATURES, never same-dragon-bigger.
    // Value ramps DOWN across forms on a held warm hue (law 9); emissive stays on the
    // ray tubes + collar only (≤1.2 — no premium glow-seams, law 12).
    forms: [
      // Hatchling (form 0) — round pot-bellied forge pup: curled chest-down posture,
      // BIG round low-set eyes, near-flat snout, squared shoulders, two dull coals,
      // stub gapped wings. Value-LIGHTEST body.
      { wingScale: 0.86, raySpan: 5.5, rayDetail: 0.55, collarStage: 0,
        spineCurl: -0.7, eyeShape: 0.0, headScale: 1.35, eyeScale: 1.6, snoutScale: 0.5,
        shoulderWidthScale: 1.35, hornType: 'noHorn', browIntensity: 0.95,
        tailStyle: 'simple', tailLength: 0.5, tailPlates: false, tailSegments: 5, neckSegments: 4, backSpines: false, ridgeCount: 0, spineGlow: 0.12,
        colors: { body: 0xf2a24e, belly: 0xf7dca6, wingInner: 0x7a2c12, wingOuter: 0x4a1a0a,
          wingEmissive: 0xff8b2a, scales: 0xe8b878, horn: 0xe8c89a,
          apexSeam: 0xff8a3a, eye: 0xff8b2a, coreGlow: 0xff7a30 } },
      // Adolescent (form 1) — shoulders square up further, rays lengthen, horns bud,
      // eyes narrow, snout projects, collar becomes a glowing arc. MID value.
      { wingScale: 0.88, raySpan: 8.4, rayDetail: 0.95, collarStage: 1,
        spineCurl: 0.62, eyeShape: 0.5, headScale: 0.9, eyeScale: 1.15, snoutScale: 0.64,   // stronger line-of-action S (gate cp2 dir 6)
        shoulderWidthScale: 1.48, hornType: 'bladeRearHorns', hornScale: 0.55, browIntensity: 1.1,
        tailStyle: 'simple', tailLength: 0.56, tailPlates: false, tailSegments: 6, neckSegments: 5, backSpines: false, ridgeCount: 0, spineGlow: 0.22, glowSeams: true,
        colors: { body: 0xe8792e, belly: 0xf2ce92, wingInner: 0x6e2410, wingOuter: 0x441606,
          wingEmissive: 0xff8b2a, scales: 0xe0a85e, horn: 0xdcb884,
          apexSeam: 0xff7a2a, eye: 0xff8b2a, coreGlow: 0xff7a30 } },
      // Radiant apex (form 2) — the ANVIL: proud upright posture, keen almond hot
      // eyes, full broad gapped wings, backSpines, 2 horn pairs, a short thick tail
      // with a DARK IRON blade tip, and the blazing forge-collar corona (the ONE
      // bloom). DEEPEST value; emissive at its richest (still ≤1.2, no glow-seams).
      { wingScale: 1.0, raySpan: 10.5, rayDetail: 1.55, collarStage: 2,
        spineCurl: 0.6, eyeShape: 1.0, headScale: 0.6, eyeScale: 0.83, snoutScale: 0.6,   // line-of-action S; head kept level enough (like f1) for the face to READ head-on (gate cp2 dir 6)   // proud reared neck + tail counter-arc → a clear side-profile inflection (gate cp2 dir 6)
        snoutTone: 0xd54f16, browTone: 0xa23e10,   // apex head value tiers (gate cp2 dir 2): a darker muzzle + a shaded brow shelf so the head is not ONE flat sticker
        shoulderWidthScale: 1.78, hornType: 'bladeRearHorns', hornScale: 1.5, hornPairs: 2, browIntensity: 1.05,
        // ASH-SCUTE dorsal tier (law 11 / gate dir 8): low warm leaf-scutes tinted ash,
        // ×0.8 falloff toward the tail, seated into the back — the sculpted top value tier
        // the sun shades. 'scute' style (not the debug-arrow cones); ridgeColor forces a
        // MATTE ash material (avoids the shared scalesMat's cyan emissive).
        tailStyle: 'blade', tailLength: 0.55, tailSegments: 6, neckSegments: 4, backSpines: true, glowSeams: true,
        // warm ash-scute dorsal tier + a GLOWING flaming tail/spine (spineGlow lights the
        // blade tail + dorsal line) — the iconic-flame read.
        ridgeCount: 12, ridgeStyle: 'scute', ridgeColor: 0xf0c888, ridgeSeat: 0.0, spineGlow: 0.4,   // cream scutes (gate cp2 dir 5)
        colors: { body: 0xdd5a1c, belly: 0xf0c888, wingInner: 0x6a2410, wingOuter: 0x3e1406,
          wingEmissive: 0xff8b2a, scales: 0xe8c888, horn: 0xf0c888,   // cream horns (gate cp2 dir 5) — separate from the dark membrane behind
          apexSeam: 0xff7a26, eye: 0xffb84a, coreGlow: 0xff9a3a } },
    ],
    fx: { auraColor: '255,139,42', auraIdle: 0.0, sparkle: false },
    // ICONIC FLAME hide — a bold warm-orange body (was near-black coal), light cream belly.
    bodyRoughness: 0.6, bodyMetalness: 0.03, bodyEnvIntensity: 0.5,
    body: 0xdd5a1c, belly: 0xf0c888, scales: 0xd89858, horn: 0xd4a870,
    wingInner: 0x6a2410, wingOuter: 0x3e1406, wingEmissive: 0xff8b2a,
    apexEye: 0xff7a2a, apexSeam: 0xff6a1a, coreGlow: 0xff9a3a, surgeHi: 0xffe0b0,
    eye: 0xff8a44, trail: 0xffa347, boostTrail: 0xffc060,
  },

  jade: {
    name: 'Jade Serpent',
    title: 'River-wind dancer',
    rarity: 'SR',
    maxRarity: 'SSR',   // starter: evolution caps at SSR, never SSSR
    cost: 1200,
    accentHue: 0xd6ffe9,   // mint-pearl accent (~148°) — the ICONIC GREEN rim/pearl carrier (human art-direction, DRAGON-DESIGN §5d)
    // JADE Serpent — an ICONIC GREEN river-dragon (human art-direction). A long
    // sinuous EASTERN koi/serpent: the BODY is the hero silhouette (S line of
    // action), the SILK-FIN sails carry the beauty. A stranger's one-word read of
    // every frame is GREEN — a VIVID mid-value jade body (NOT near-black moss), a
    // pale mint belly, green-family fin gradients (deep-emerald ray → pale jade
    // tip), and a MINT-pearl chin-pearl bloom whose lockstep rim carrier lights the
    // rear fin tips. Restrained — NO premium glow-seams/veins (law 12); the pearl
    // is the ONE bloom.
    stats: { speed: 1.07, handling: 1.11, drain: 0.9, regen: 1.1 },
    parts: { torso: 'koiSerpent', wings: 'silkFinWings', head: 'draconic', tail: 'none' },
    model: {
      scale: 1.0, wingScale: 1.0, tailSegments: 12, neckSegments: 8,
      // ── UNDULATING KOI BODY (koiSerpent) ──────────────────────────────────────
      // The body is ONE smooth swept tube bent every frame by a travelling-wave vertex
      // shader (dragon.js parts.bodyWave) — a real swimming S, NOT the bead-chain of
      // stacked spheres that read as an "astral worm." The tail is the tapering rear of
      // this same tube (parts.tail:'none'), continuous by construction.
      bodyGirth: 0.6, bodyLength: 1.0, bodyRadial: 13, bodyGlow: 0.10, bodyRim: 0.32, bodyShadowColor: 0x0d5c3a,
      bodyOvalW: 1.14, bodyOvalH: 0.9,   // koi cross-section (wider than tall)
      bodyWaveAmp: 0.8,                   // lateral swim amplitude (0 at the head → full at the tail); CPU-flexed each frame
      bodyWaveFreq: 1.0,                  // ~1.3 wavelengths along the body → a graceful single-S, not a wriggle
      bodyWaveSpeed: 3.2,                 // cruise wave rate (dragon.js eases it up with speed)
      bodyArcY: 0.14,                     // resting vertical S (line-of-action)
      // silk-fin fans beat SYMMETRICALLY in flight (dragon.js): the N lobes fire L_i↔R_i
      // together with a small inboard→outboard lag (a living koi-fin beat, both fans in sync).
      lobeBeatAmp: 0.3, lobeBeatLag: 0.5,
      // FACE — the original lofted KOI head (human note: "show me the original koi face
      // again"): a slim, browed, tapered-snout eastern-serpent shell with the living cuteEye.
      headArchetype: 'softStealth',
      headScale: 0.6, snoutScale: 0.72, eyeScale: 0.82, eyeShape: 1.0,
      skullType: 'koiSkull',             // the lofted koi/eastern-serpent head shell (slim, browed, tapered snout)
      cuteEye: true,                     // living eye — jade-green iris + dark forward pupil + catchlight
      whiskerFins: true,                 // trailing whisker fins (jade signature) — cradle the chin pearl
      neckBlend: 1.4,                    // slim river-serpent neck so the head sits proud on the smooth tube
      // silk-fin shared dials (per-form lobe count / span / carrier accrete below)
      lobeCount: 4, lobeSpan: 3.5, lobeRake: 0.62, lobeTilt: 0.82, lobeCamber: 0.26,
      lobeNotch: 0.52, lobeScale: 0.8, lobeDetail: 1.3, rimCarrier: 1.0, streamerLen: 4.5, pearlStage: 2,
      finGlow: 0.6,                      // GREEN emissive floor on the fins so the shadowed wing holds jade (doesn't drift teal in cool fill light) — the persistent L/R read (gate)
      finRimColor: 0xbdf5d0,             // GREENER mint-pearl rim (the 0xd6ffe9 pearl read cyan-teal at grazing angles) — still green-leaning, in the ~149° band
      spineGlow: 0.3,
      flapBias: 1.05, flapAmp: 0.7,      // slow, sinuous river-wind beat
    },
    // Three visible forms (starter caps at SSR / tier 2): a chubby LONG river-pup
    // (3 fin-bud lobes, pearl bead, big calm round eyes) → body lengthens, lobes
    // unfurl, whiskers + ear-fins bud, pearl held → the S-ribbon apex (4 lobes +
    // trailing streamers, veil tail, radiant mint-pearl). Forms differ in
    // PROPORTION + FEATURES, never same-dragon-bigger. Value ramps DOWN + saturation
    // UP across forms on a held jade hue (law 9); the mint-pearl is the ONE bloom.
    forms: [
      // Hatchling (form 0) — chubby LONG river-pup: big round low-set calm eyes,
      // near-flat snout, 3 fin-bud lobes (≥2 visible — the tier-0 key), pearl bead,
      // no whiskers, no ridges. Value-LIGHTEST, softest-saturation body.
      { headScale: 1.32, snoutScale: 0.55, eyeScale: 1.35, eyeShape: 0.0,
        neckSegments: 5, tailSegments: 6, whiskerFins: false, hornType: 'noHorn',
        bodyGirth: 0.66, bodyLength: 1.7,   // chubby river-pup: still a long koi, but its BIG head makes it read short (head:body ~3)
        spineCurl: -0.35, spineYaw: 0.3,   // curled river-whelp: chest-down + a gentle lateral wiggle (S line of action)
        tailArc: 0.14, tailYaw: 0.12, neckBlend: 1.6, tailGirth: 1.15,   // slim, barely-curled whelp tail (no edge-on wire hook; the veil BLOOMS later — gate CP2 dir 3/4)
        lobeCount: 3, lobeSpan: 2.6, lobeTilt: 0.72, lobeDetail: 0.55, rimCarrier: 0.3, streamerLen: 0, pearlStage: 0,
        moonTail: 0.15,                    // GLOW-UP ladder: the tiniest veiltail NUB on the pup, so the tail grows pup-nub → bud → full veiltail across the three forms (same dragon growing, not a leap)
        tailStyle: 'simple', ridgeCount: 0, crest: 0, spineGlow: 0,
        colors: { body: 0x3cb883, belly: 0xdaf7e6, wingInner: 0x3aa578, wingOuter: 0x157a4e,
          wingEmissive: 0x9ff0c8, scales: 0x9fe6c4, horn: 0xcfe8c0,
          apexSeam: 0xbdf3dc, eye: 0x8ff0c2, coreGlow: 0x6ad0a0 } },
      // Adolescent (form 1) — body lengthens, lobes unfurl, whiskers + ear-fins bud,
      // eyes narrow, snout projects, the pearl is HELD (glowing). MID value.
      { headScale: 0.85, snoutScale: 0.68, eyeScale: 0.98, eyeShape: 0.5,
        neckSegments: 7, tailSegments: 10, whiskerFins: true,
        bodyGirth: 0.58, bodyLength: 1.35,   // lengthening river-serpent
        spineCurl: 0.45, spineYaw: 0.42,   // straightening into the proud S
        tailArc: 0.38, tailYaw: 0.22, neckBlend: 1.5,
        lobeCount: 3, lobeSpan: 4.6, lobeTilt: 0.78, lobeDetail: 1.0, rimCarrier: 0.6, streamerLen: 0, pearlStage: 1,
        moonTail: 0.55,                    // GLOW-UP ladder: the veiltail clearly BUDS (bigger than the pup nub), midway to the apex bloom
        rayRelief: 0.5,                    // GLOW-UP ladder: the silk STARTS to ray at Kindled ("lobes unfurl") — a partial pre-echo of the apex's full koi-fin rays, so f1 reads as the adolescent stage of the SAME rayed silk, not a plain smaller dragon. (Dew gems stay apex-exclusive — the coronation reward.)
        tailStyle: 'simple', ridgeCount: 10, ridgeStyle: 'scute', ridgeColor: 0x1f8a5c, crest: 0, spineGlow: 0.16,
        colors: { body: 0x28a06b, belly: 0xd2f2df, wingInner: 0x2f9e77, wingOuter: 0x136b45,
          wingEmissive: 0x8ff0c2, scales: 0x8fe0be, horn: 0xc7ebcf,
          apexSeam: 0x9ff0c8, eye: 0x8ff0c2, coreGlow: 0x4fc191 } },
      // Radiant apex (form 2) — the S-ribbon: proud upright S posture, keen long
      // almond eyes, 4 lobes + trailing streamers, veil (finned) tail, whiskers
      // cradling the luminous river-pearl (the ONE bloom). DEEPEST value, richest
      // saturation — still NO glow-seams (law 12); spineGlow ≤0.32.
      { headScale: 0.42, snoutScale: 0.98, eyeScale: 0.66, eyeShape: 0.78,
        neckSegments: 8, tailSegments: 12, whiskerFins: true, crest: 1,
        bodyGirth: 0.52, bodyLength: 1.2,   // LONG, slim S-ribbon apex (the koi at full length)
        spineCurl: 1.05, spineYaw: 0.72,  // full proud S-ribbon (neck arcs up HARD, mid dips, tail counter-arcs; strong lateral recurve)
        lobeCount: 4, lobeSpan: 6.0, lobeTilt: 0.74, lobeDetail: 1.3, rimCarrier: 1.0, streamerLen: 9.5, pearlStage: 2,
        rayRelief: 1.0,                    // CP3 apex-only: the silk-fin sails become LITERAL rayed koi veil-fins (3 fluted rays/blade). The lower forms keep smooth blades so ascension visibly confers the rays.
        moonTail: 1.0,                     // GLOW-UP apex: the "Koi Lyre" — twin canted veiltail crescents answer the fan-V below, splaying into the rear silhouette + whipping with the wave.
        tipGems: 1,                        // GLOW-UP apex: pearl-light hierarchy — fin-tip dew gems (bloom-safe opaque mint emissive; the pearl stays the hero bloom).
        lobeFlareBoost: 1.25, bodyWaveAmp: 0.9, waveBreath: 0.12,   // GLOW-UP motion: fan blooms harder on boost, a deeper swim, a slow breathing meander.
        streamerCount: 3,                  // GLOW-UP: a third staggered streamer pair reads as continuous river-current
        tailStyle: 'simple', ridgeCount: 0, spineGlow: 0.3,   // NO dorsal ridge row (it read as a white sawtooth zipper — gate rework r3 dir 5); smooth koi back
        colors: { body: 0x178a54, belly: 0xa6e2c2, wingInner: 0x2f9e77, wingOuter: 0x116b45,
          wingEmissive: 0x9ff0c8, scales: 0x8fe0be, horn: 0xc7ebcf,
          apexSeam: 0x9ff0c8, eye: 0x8ff0c2, coreGlow: 0x3aa078 } },
    ],
    fx: { auraColor: '121,226,183', auraIdle: 0.0, sparkle: false },
    // ICONIC GREEN hide — a VIVID mid-value jade body (was near-black moss), pale mint belly.
    bodyRoughness: 0.5, bodyMetalness: 0.02, bodyEnvIntensity: 0.55,
    scaleEmissive: 0x0d6b45, scaleEmissiveI: 0.22,   // GREEN scale glow (scutes/whiskers/ridges) — never the shared cyan (L164) on a green dragon
    eyeEmissiveI: 1.5,                      // calm painterly eye — not blown to a white googly blob under ACES
    bellyEmissive: 0x1f8a5c, bellyEmissiveI: 0.5,    // anchor the pale mint belly/jaw GREEN so it never drifts slate-blue in shadow (gate r1 dir 8)
    eyeSclera: 0xbfe6cf, eyeIris: 0x8ff0c2, eyeIrisKeen: 0xbdf3dc, eyeBallEmissive: 0x3fb87e, eyeBallEmissiveI: 1.4,   // calm luminous GREEN almond (top-level def — the head reads c.def.*, NOT model.*); bright iris + glow so the EYE is the brightest facial point at turntable distance (§4 charisma; CP2 polish)
    body: 0x178a54, belly: 0xa6e2c2, scales: 0x8fe0be, horn: 0xc7ebcf,
    wingInner: 0x2f9e77, wingOuter: 0x116b45, wingEmissive: 0x9ff0c8,
    apexEye: 0x8ff0c2, apexSeam: 0x9ff0c8, coreGlow: 0x3aa078, surgeHi: 0xd6ffe9,
    eye: 0x8ff0c2, trail: 0x3fc48f, boostTrail: 0x9ff0c8,
  },


  // ── OBSIDIAN SHADE II — the CLEAN-SHEET one-skin organism ─────────────────
  // A full CLONE of `obsidian` (same stats/forms/colours/shaders/shingle), but on
  // the clean-sheet organism architecture: body+wings (and later neck/head/tail)
  // generated TOGETHER as ONE continuous skinned hull whose membrane root verts
  // ARE the body loft's own flank verts (zero gap by construction). This supersedes
  // the v1 unifiedHull weld (which retrofitted onto Obsidian's legacy body). It ADDS
  // a creature; it does not touch `obsidian`. Head/tail are reused at anchors for now
  // (Increment 2b/2c will grow them from the hull).

  // ── TOOTHLESS — Night Fury collab skin ──────────────────────────────────────
  // The FRESH-take hull (LEAPFROG L32): a sleek matte-black Night Fury on the
  // SMOOTH longitudinal-spline loft (no "metallic rings") + the one-surface
  // body↔wing weld + a finger to every scallop. INCREMENT 1 = body + wings only;
  // the neck/head/tail (head:'none', tail:'none') are switched OFF and arrive in
  // I2/I3 as hull-grown continuous extensions — no legacy bolted parts are shown.
  // Anatomy (body profile in dragonNightFury.js; wing outline below) is authored to
  // the Toothless reference imagery, to be verified on the chase-cam preview.

  pearl: {
    name: 'Pearl Seraph',
    lanceTint: 0x7ec8ff, lanceRune: 'seraphWing',   // Eternal wisp: seraphic sky-blue (PR8)
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
    lanceTint: 0xc27bff, lanceRune: 'solarCrown',   // Eternal wisp: royal violet (PR8)
    title: 'Apex of the skies',
    rarity: 'SSSR',
    maxRarity: 'SSSR',
    cost: 5000,
    accentHue: 0xb784ff,   // §9 law-9 carrier: eclipse-violet, emissive-only on the 10%
    // ECLIPSE DRAGON-KING (Bahamut) redesign — a FRESH, low-poly, HORIZONTAL king-dragon
    // (see SOLAR-ECLIPSE-BUILDSHEET.md): lance-vault wings + eclipse-sigil motif (brow
    // star-gem + rear corona mantle) + cuirass keel-ridge + scepter tail. All geometry
    // authored fresh (no shipped builder look reused). iridescence dropped (matte "arcane
    // light in darkness"); cellularScales kept. Palette held (already Bahamut-aligned).
    parts: { torso: 'regnalKeelTorso', wings: 'lanceVaultWings', head: 'eclipseCrownHead', tail: 'scepterWhipTail', surface: { shader: [] } },
    stats: { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 },
    // Base model holds APEX reference dials; each form dials the per-stage silhouette
    // (cumulative — later forms override earlier keys). Sovereign dials: vaultFingers,
    // pikeCount, dihedral, spanScale, keelShields, coronaValleys, crownHorns, starGemBloom,
    // crescentBloom, tailFins, glowLevel, tuskScale, eyeScale, headScale.
    model: {
      scale: 1.2, tailSegments: 9, neckSegments: 6, flapBias: 0.85, flapAmp: 0.72,
      tailLagScale: 0.055,   // GENTLE idle tail coil (azure-style, subtle) — a soft trailing drift, not a snake

      vaultFingers: 5, pikeCount: 3, dihedral: 20, spanScale: 1.06, keelShields: 5,
      coronaValleys: 5, crownHorns: 4, starGemBloom: 1.0, crescentBloom: 1.0, tailFins: 4,
      glowLevel: 1.0, tuskScale: 0.9, eyeScale: 0.65, headScale: 1.0, hornLen: 2.1, tailLength: 1.3,
      // CP2 spectacle ladder (apex reference; forms dial each rung — see forms[] below):
      igniteStage: 3, archRise: 1.0, carpalLance: 2.6, pinionSlots: 2, tailRise: 1.0,
      napeStar: 1, coronaRing: 1, sparTipHeat: 1,
      // CP3 "Coronation Spend" ladder (spectacle headroom; apex reference):
      spireTier: 2, coronaGrand: 1, cuirassPlate: 1, rearCirclet: 1, orderStar: 1, pauldrons: 1,
      buttress: 2, vaultSculpt: 1, scepterOrb: 1,
      spireStabilize: 0.85,   // CP3.3: counter-rotate the carpal spires against the flap so they don't scissor the forward view (0 = fully ride the flap)
    },
    forms: [
      // HATCHLING (0) — round princeling, LINEAR glide (no arch), no mantle/gem/corona: a bare
      // whelp so the coronation ladder has somewhere to climb FROM. igniteStage 0 (all emissives dark).
      { vaultFingers: 3, pikeCount: 1, dihedral: 10, spanScale: 0.68, keelShields: 2,
        coronaValleys: 0, crownHorns: 0, starGemBloom: 0, crescentBloom: 0.1, tailFins: 1,
        glowLevel: 0.25, tuskScale: 0, eyeScale: 1.4, headScale: 1.3, hornLen: 0.9, tailSegments: 5,
        igniteStage: 0, archRise: 0, carpalLance: 0, pinionSlots: 0, tailRise: 0, napeStar: 0,
        coronaRing: 0, sparTipHeat: 0,
        spireTier: 0, coronaGrand: 0, cuirassPlate: 0, rearCirclet: 0, orderStar: 0, pauldrons: 0, buttress: 0, vaultSculpt: 0, scepterOrb: 0,
        colors: { body: 0x0d1018, wingInner: 0x6e2418, wingOuter: 0x4a160e,
          wingEmissive: 0x5a1c10, scales: 0x7a6038, horn: 0x9a7c4a,
          apexSeam: 0x8a6fb0, eye: 0xc8a868, coreGlow: 0xb784ff } },
      // KINDLED (1) — squire-drake: neck lengthens, horns sweep, first pikes, the wing begins to ARCH
      // (archRise 0.35), the brow gem KINDLES (bloom 0.5, igniteStage 1). No mantle/corona/nape yet.
      { vaultFingers: 4, pikeCount: 2, dihedral: 14, spanScale: 0.82, keelShields: 3,
        coronaValleys: 0, crownHorns: 2, starGemBloom: 0.5, crescentBloom: 0.4, tailFins: 2,
        glowLevel: 0.5, tuskScale: 0, eyeScale: 1.1, headScale: 1.15, hornLen: 1.25, tailSegments: 7,
        igniteStage: 1, archRise: 0.35, carpalLance: 0.8, pinionSlots: 0, tailRise: 0.4, napeStar: 0,
        coronaRing: 0, sparTipHeat: 0,
        spireTier: 0, coronaGrand: 0, cuirassPlate: 0, rearCirclet: 0, orderStar: 0, pauldrons: 0, buttress: 0, vaultSculpt: 1, scepterOrb: 0,
        colors: { body: 0x0c1322, wingInner: 0x9c2233, wingOuter: 0x7a1622,
          wingEmissive: 0x7a2414, scales: 0xa88a48, horn: 0xc09a54,
          apexSeam: 0xb784ff, eye: 0xe0bc78, coreGlow: 0xb784ff } },
      // RADIANT (2) — crowned king-apparent: tusks, coronet-into-crown, the MANTLE collar arrives
      // (valleys 4) with its nape-star, wing veins + membrane embers light (igniteStage 2), the arch
      // deepens (0.7) with a fuller carpal lance + first pinion slot. No corona ring / spar heat yet.
      { vaultFingers: 4, pikeCount: 2, dihedral: 18, spanScale: 0.92, keelShields: 4,
        coronaValleys: 4, crownHorns: 3, starGemBloom: 0.75, crescentBloom: 0.6, tailFins: 3,
        glowLevel: 0.75, tuskScale: 0.7, eyeScale: 0.85, headScale: 1.05, hornLen: 1.5, tailSegments: 8,
        igniteStage: 2, archRise: 0.7, carpalLance: 1.8, pinionSlots: 1, tailRise: 0.7, napeStar: 0.6,
        coronaRing: 0, sparTipHeat: 0,
        spireTier: 1, coronaGrand: 0, cuirassPlate: 1, rearCirclet: 1, orderStar: 1, pauldrons: 1, buttress: 1, vaultSculpt: 1, scepterOrb: 0,
        colors: { body: 0x0a1020, wingInner: 0x9c2233, wingOuter: 0x7a1622,
          wingEmissive: 0x7a1622, scales: 0xd4a84f, horn: 0xd8b25a,
          apexSeam: 0xb784ff, eye: 0xecd090, coreGlow: 0xb784ff } },
      // ETERNAL (3) — the Eclipse Dragon-King: full CATHEDRAL ARCH (twin blazing carpal spires over
      // the crowned head), fingered pinion tips, rising banner tail, eclipse-corona ring, white-hot
      // spar tips. Every emissive at full ignition (stage 3). The headline apex — worth the grind.
      { vaultFingers: 5, pikeCount: 3, dihedral: 20, spanScale: 1.06, keelShields: 5,
        coronaValleys: 5, crownHorns: 4, starGemBloom: 1.0, crescentBloom: 1.0, tailFins: 4,
        glowLevel: 1.0, tuskScale: 0.9, eyeScale: 0.65, headScale: 1.0, hornLen: 2.1, tailSegments: 9,
        tailLength: 1.3, igniteStage: 3, archRise: 1.0, carpalLance: 2.6, pinionSlots: 2, tailRise: 1.0,
        napeStar: 1, coronaRing: 1, sparTipHeat: 1,
        spireTier: 2, coronaGrand: 1, cuirassPlate: 1, rearCirclet: 1, orderStar: 1, pauldrons: 2, buttress: 2, vaultSculpt: 1, scepterOrb: 1,
        colors: { body: 0x080b14, wingInner: 0x9c2233, wingOuter: 0x5a160e,
          wingEmissive: 0x7a1622, scales: 0xd4a84f, horn: 0xddc070,
          apexSeam: 0xb784ff, eye: 0xf4e2a8, coreGlow: 0xb784ff } },
    ],
    fx: { auraColor: '122,92,255', auraIdle: 0.03, sparkle: false },
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

  // NIGHTGLASS VESPER — a FRESH premium matte-black night drake, authored as
  // deliberate FLAT FACETS (knapped night-glass), NOT the retired smooth-hull
  // organism family (see VESPER-NIGHTGLASS-BUILDSHEET.md §Anti-pattern). Fully
  // additive: nothing shipped changes. Cruise-black law — the only cruise emissive
  // is the acid-green eyes; the ion-blue Starlit Seam is withheld until the Night
  // Surge (wired from I4). Body value DARKENS up the ladder (apex = darkest object).
  vesper: {
    name: 'Nightglass Vesper · Rich',
    title: 'Knapped from the dark',
    rarity: 'SSR',
    maxRarity: 'SSSR',
    cost: 2200,
    accentHue: 0x2050e8,   // §9 law-9 carrier: ion-blue, emissive-only, Surge-only
    parts: { torso: 'knappedTorso', wings: 'scallopCrescentWings', head: 'vesperCatHead', tail: 'splitFanTail', surface: { shader: [] } },
    stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },
    // Apex reference dials; each form dials the per-stage silhouette (cumulative).
    // Vesper dials (all nullable / default-off in dragonVesper.js): chine,
    // glassStreak, spanScale, glowLevel, eyeScale, headScale, igniteStage.
    model: {
      scale: 1.15, tailSegments: 7, neckSegments: 4, flapBias: 0.85, flapAmp: 0.7,
      chine: 1, glassStreak: 1, spanScale: 1.0, glowLevel: 1.0,
      eyeScale: 0.7, headScale: 1.0, tailLength: 1.0, igniteStage: 3,
      // Wing (scallopCrescentWings) apex reference dials; forms dial each rung.
      // scallopLobes = finger-BONE count (fingered bat wing); archRise = carpal arch;
      // wingCup = inward membrane cup depth; wingGusset/thumbClaw = anti-plank extras.
      scallopLobes: 5, archRise: 0.4, wingCup: 0.35, wingGusset: 1, thumbClaw: 1,
      wristT: 0.21,   // MEDIAL carpal → very short arm, long-fingered hand (owner: more medial; span preserved by F0=LE(1))
      edgeBand: 1, constellations: 8, cowlPlates: 1,
      // Head (vesperCatHead) + tail (splitFanTail) apex reference dials.
      earFinPairs: 4, eyeAlmond: 1.0, crestBlade: 1, crestWeb: 1,   // CP5: crown (4-tri ears + dominant occipital peak + nape frill)
      splitFan: 2, tailFinSpread: 1.2, tailStretch: 1.15, tailRudder: 1,
      tailPetals: 4,                 // E4: split fan-fins (twin crescent)
      // CP2 body/tail richness: dorsal nub row, hip flakes, tail nubs, mid-tail fins.
      dorsalNubs: 9, haunchFlakes: 1, tailNubs: 5, tailMidFins: 1,
      // FINISHED-BLADE spectacle (CP-E): a struck knap-plate field on the hull + a layered wing
      // covert row + smoother membrane arcs. The single biggest density lever (parity with Solar/
      // Phoenix). All matte/cold — geometry, not glow — so the night-drake identity survives.
      knapPlates: 18, covertRow: 12, wingNSEG: 8, legHint: 1,   // CP6: hind legs (silhouette mass) + smoother membrane
      // The Starlit Seam (Surge-only, ion-blue). surgeGlowMultiplier lifts the seam's
      // near-zero cruise base to a blaze ONLY on the Night Surge (eyes stay out of the
      // surge arrays). seamRun/finRims/rootSpark ladder the carved circuit.
      seamRun: 1.0, seamFinRims: 1, seamRootSpark: 1, surgeGlowMultiplier: 22,
      // WING MOTION (CP3) — the fingered wing is a 3-segment HINGE on the wingParts poser, NOT
      // the old 1-bone plank (the runtime bug the Fable gate caught): pivot = shoulder flap,
      // mid = forearm lagged curl, tip = the HAND folding at the wrist (the bat read — the whole
      // membrane rides the hand as one sheet, so the fold never tears it). glidePow > 1 HOLDS
      // the broad glide pose and pulses through it (a stealthy "commands the air" beat, not the
      // old sine metronome); a gentle apex V-lift. Per-form ladder in forms[].
      wingParts: 3, rootAmp: 0.62, midAmp: 0.34, tipAmp: 0.55, midLag: 0.45, tipLag: 1.0,
      glidePow: 2.2, restLift: 0.05, apexMid: 0.10, apexTip: 0.22,
      // TAIL MOTION (CP3) — the splitFanTail is a 4-joint NESTED isBone chain (see dragonVesper.js).
      // The rig walks it with a travelling lateral COIL + a phase-lagged VERTICAL wave (the axis
      // the rear-chase lens reads — the "stiff" fix). A BESPOKE supple-predator signature (deeper,
      // slower undulate than the roster's flame-whips — NOT a copy). tailRudderScale trims the
      // compounding per-joint turn-curl on the chain to a graceful arc, not a J-hook.
      tailWhip: true, tailLagScale: 0.16, tailUndulateX: 0.34, tailRudderScale: 0.5,
    },
    // I1 ladder (torso-chine increment): body value DECREASES up the rungs; the
    // wing/head/tail dials are placeholders until I2/I3. The full knapping ladder
    // (scallop lobes, seamRun, ear-fin pairs, split-fan spread) lands in I5.
    forms: [
      { spanScale: 0.70, glowLevel: 0.25, eyeScale: 1.30, headScale: 1.25, igniteStage: 0,
        scallopLobes: 2, glideRake: 0, constellations: 0, wingCreases: 0, cowlPlates: 1, edgeBand: 1,
        wingParts: 1, midAmp: 0, tipAmp: 0, glidePow: 0.9,   // whelp: a simple frantic flapper (no wrist fold yet)
        knapPlates: 0, covertRow: 0, wingNSEG: 4, crestBlade: 0, tailPetals: 4,   // bare pebble
        earFinPairs: 1, eyeAlmond: 0, splitFan: 0, tailFinSpread: 0, tailStretch: 1.0, tailRudder: 0,
        seamRun: 0, seamFinRims: 0, seamRootSpark: 0, dorsalNubs: 0, haunchFlakes: 0, tailNubs: 0, tailMidFins: 0,
        colors: { body: 0x111522, belly: 0x1f2942, wingOuter: 0x111522, eye: 0x54c81e } },
      { spanScale: 0.82, glowLevel: 0.50, eyeScale: 1.05, headScale: 1.12, igniteStage: 1,
        scallopLobes: 3, glideRake: 0, constellations: 0, wingCreases: 0, cowlPlates: 1, edgeBand: 1,
        wingParts: 2, midAmp: 0.24, tipAmp: 0.30, glidePow: 1.2,   // kindled: the wrist fold arrives
        knapPlates: 4, covertRow: 0, wingNSEG: 4, crestBlade: 0, tailPetals: 4,   // first struck plates + shoulder mass
        earFinPairs: 2, eyeAlmond: 0.4, splitFan: 1, tailFinSpread: 0, tailStretch: 1.0, tailRudder: 0,
        seamRun: 0.4, seamFinRims: 0, seamRootSpark: 0, dorsalNubs: 4, haunchFlakes: 0, tailNubs: 0, tailMidFins: 0,
        colors: { body: 0x0d111b, belly: 0x1c2338, wingOuter: 0x0d111b, eye: 0x5cd41e } },
      { spanScale: 0.92, glowLevel: 0.75, eyeScale: 0.90, headScale: 1.05, igniteStage: 2,
        scallopLobes: 4, glideRake: 0.5, constellations: 5, wingCreases: 0, cowlPlates: 1, edgeBand: 1,
        wingParts: 3, midAmp: 0.32, tipAmp: 0.46, glidePow: 1.7,   // radiant: full cascade, calmer beat
        knapPlates: 10, covertRow: 6, wingNSEG: 6, crestBlade: 0, crestWeb: 1, tailPetals: 4, legHint: 1,   // split fan + covert row + crest + legs
        earFinPairs: 3, eyeAlmond: 0.7, splitFan: 2, tailFinSpread: 1.0, tailStretch: 1.0, tailRudder: 0,
        seamRun: 1.0, seamFinRims: 0, seamRootSpark: 0, dorsalNubs: 7, haunchFlakes: 1, tailNubs: 3, tailMidFins: 0,
        colors: { body: 0x0a0e17, belly: 0x1a2234, wingOuter: 0x0a0e17, eye: 0x62dc22 } },
      { spanScale: 1.05, glowLevel: 1.00, eyeScale: 0.86, headScale: 1.00, igniteStage: 3,
        scallopLobes: 5, glideRake: 1.0, constellations: 8, wingCreases: 1, cowlPlates: 1, edgeBand: 1,
        wingParts: 3, midAmp: 0.34, tipAmp: 0.65, glidePow: 2.2,   // sovereign: deep wrist fold (longer hand reads it), held-glide beat
        knapPlates: 18, covertRow: 12, wingNSEG: 8, crestBlade: 1, crestWeb: 1, tailPetals: 4, legHint: 1,   // the finished blade
        earFinPairs: 4, eyeAlmond: 1.0, splitFan: 2, tailFinSpread: 1.2, tailStretch: 1.15, tailRudder: 1,
        seamRun: 1.0, seamFinRims: 1, seamRootSpark: 1, dorsalNubs: 9, haunchFlakes: 1, tailNubs: 5, tailMidFins: 1,
        colors: { body: 0x070a11, belly: 0x1a2234, wingOuter: 0x070a11, eye: 0x6ae62a } },
    ],
    fx: { auraColor: '40,72,150', auraIdle: 0.03, sparkle: false },
    hasStyle: true,   // keep the cold ion-blue trail in Surge (never warmed to white)
    // Night Surge palette (COOL — the rig defaults to magenta; override every hook):
    // wings stay BLACK on Surge (emissive black → the scallop silhouette owns the frame;
    // only the Starlit Seam + eyes light), a low ion-blue screen wash, acid-green eyes,
    // and cool arcane motes (Sovereign-style, Surge-only).
    feverWing: 0x000000, feverEye: 0x9af03a, feverWash: [0.02, 0.045, 0.11], surgeMotes: true,
    hideRiderGlow: true,   // kill the round rider bloom on Surge — the drake owns the frame by its own cold accents
    // Cruise membrane emissive is EXPLICITLY black (the wing owns the frame by silhouette, never
    // glow). Set so the rig's per-frame `wingMat.emissive.setHex(... ?? wingEmissive)` gets a real
    // 0x000000 instead of coercing setHex(undefined)→black by luck.
    wingEmissive: 0x000000,
    body: 0x070a11, belly: 0x1a2234,
    wingInner: 0x0a0e17, wingOuter: 0x070a11,
    eye: 0x54c81e,
    apexEye: 0x6ae62a, apexSeam: 0x2050e8, coreGlow: 0x2050e8, surgeHi: 0x4d86ff,
    trail: 0x24427a, boostTrail: 0x3d63c8,
  },

  // GRAVELIGHT REVENANT — "Nothing stays buried" (WRAITH-GRAVELIGHT-BUILDSHEET.md §B).
  // A chalk-ivory bone-lattice drake: the roster's ONLY holes-in-the-black-fill
  // SKELETON. Ghost-fire (the Grave Heart) is seen only THROUGH bone apertures —
  // "a lantern, not a lamp". Body value RISES up the ladder (BLEACHING — the mirror
  // of Vesper's darkening). Zero warm hues / zero gold (the Pearl firewall). Fully
  // additive: nothing shipped changes. BUILD STATE: I0 STUB — the four builders in
  // dragonRevenant.js are contract-satisfying chalk-ivory placeholders; the real
  // bone (hollow rib cage, phalanx-shroud wings, skull + wisp tail, the Haunting FX,
  // the 4-form HOLLOWING ladder) lands increment by increment per §4.6.
  revenant: {
    name: 'Gravelight Revenant',
    title: 'Nothing stays buried',
    rarity: 'SSR',
    maxRarity: 'SSSR',
    cost: 2400,
    accentHue: 0x54f04e,   // §9 law-9 carrier: grave-green, emissive-only (the grave-light family)
    lanceTint: 0x54f04e, lanceRune: 'gravelight',   // Eternal wisp: grave-green (distinct from the warm SSSR tints)
    parts: { torso: 'ossuaryTorso', wings: 'phalanxShroudWings', head: 'revenantSkullHead', tail: 'vertebraeWhipTail', surface: { shader: [] } },
    stats: { speed: 1.09, handling: 1.12, drain: 0.78, regen: 1.24 },
    // Apex reference dials (all nullable / default-off in dragonRevenant.js). The real
    // HOLLOWING ladder (rib windows, coreBlaze, socket vents, wisp, crescents) lands in I5.
    model: {
      scale: 1.22, tailSegments: 13, neckSegments: 4, flapBias: 0.9, flapAmp: 0.85,
      spanScale: 1.0, glowLevel: 1.0, headScale: 1.0, tailLength: 1.0, tailStretch: 1.0,
      fingers: 4, wristT: 0.24,
      // WING MOTION — SHOULDER-LED beat to the Fable motion target (owner: read as ONE joint
      // with a little lag, not a stiff elbow/wrist double-bend). The SHOULDER owns ~80% of the
      // ~150° arc: rootAmp swings it, apexRoot lifts the recovery peak up-and-back to ~12 o'clock
      // (asymmetric — only the up half), the downstroke bottoms at ~5 o'clock (never 6). The
      // forearm (midAmp, ~12%) and wrist (tipAmp, ~7%) only TRAIL — same rotational direction,
      // never counter-bending — lagged 12%/18% of the beat so the wing reads alive, not detached.
      // Shoulder-led BUT spread BROAD (owner: wings read tiny/vertical like fairy wings — the beat
      // was swinging them past vertical over the back). Gentler shoulder swing around a WIDE, more
      // horizontal neutral so the big span reads spread, not foreshortened; still shoulder-dominant
      // with a small trailing forearm/wrist lag. Recovery peaks ~1 o'clock (not straight up), the
      // downstroke reaches ~4:30 — a broad, majestic beat rather than a vertical clap.
      wingParts: 3, rootAmp: 0.72, apexRoot: 0.26, midAmp: 0.14, tipAmp: 0.09, midLag: 0.7, tipLag: 1.1,
      glidePow: 1.15, restLift: 0.0, apexMid: 0.04, apexTip: 0.04,
      // TAIL MOTION — the vertebra whip is a 4-joint NESTED isBone chain (see dragonRevenant.js).
      tailWhip: true, tailLagScale: 0.16, tailUndulateX: 0.34, tailRudderScale: 0.5,
    },
    // The HOLLOWING ladder (§4.5). BODY VALUE RISES up the rungs (BLEACH — the mirror
    // of Vesper's darkening). Wing/skull/tail dials are placeholders until I2/I3; the
    // full aperture + light ladder lands in I5.
    // The HOLLOWING ladder (§4.5): ribWindows {0,2,4,6}, coreBlaze {.15,.4,.7,1}, and
    // the vertebra file grows (neck 3→5). BODY VALUE RISES up the rungs (BLEACH).
    forms: [
      { spanScale: 0.70, glowLevel: 0.25, headScale: 1.44, hornLen: 0.5, fingers: 2, tailStretch: 1.0,
        ribWindows: 0, coreBlaze: 0.15, neckVerts: 4, dorsalVerts: 9, shroudPanels: 1, crescentDepth: 0.3,
        colors: { body: 0xc9c9c1, belly: 0xafafa6, wingOuter: 0xc9c9c1, eye: 0x54e01e } },   // Grave Whelp (sealed cage)
      { spanScale: 0.82, glowLevel: 0.50, headScale: 1.34, hornLen: 0.55, fingers: 3, tailStretch: 1.0,
        ribWindows: 2, coreBlaze: 0.40, neckVerts: 5, dorsalVerts: 9, shroudPanels: 1, crescentDepth: 0.6,
        colors: { body: 0xd5d5cc, belly: 0xbbbbb1, wingOuter: 0xd5d5cc, eye: 0x5ce828 } },   // First Waking
      { spanScale: 0.92, glowLevel: 0.75, headScale: 1.26, hornLen: 0.6, fingers: 4, tailStretch: 1.0,
        ribWindows: 4, coreBlaze: 0.70, neckVerts: 6, dorsalVerts: 9, shroudPanels: 2, crescentDepth: 0.8,
        colors: { body: 0xdfded5, belly: 0xc6c5bb, wingOuter: 0xdfded5, eye: 0x66f038 } },   // Open Cage
      { spanScale: 1.0, glowLevel: 1.00, headScale: 1.2, hornLen: 0.65, fingers: 4, tailStretch: 1.0,
        ribWindows: 6, coreBlaze: 1.00, neckVerts: 7, dorsalVerts: 9, shroudPanels: 2, crescentDepth: 1.0,
        colors: { body: 0xe4e3dc, belly: 0xcac8bf, wingOuter: 0xe4e3dc, eye: 0x76ff68 } },   // Gravelight Revenant
    ],
    fx: { auraColor: '84,240,78', auraIdle: 0.03, sparkle: false },
    hasStyle: true,   // keep the cold grave-green trail in Surge (never warmed)
    // Grave Surge palette (COOL green — the rig defaults to magenta; override every hook
    // per §4.4). Wings stay BLACK on Surge (silhouette owns the frame; the heart + gaps
    // carry the light), a low grave-green screen wash, grave-green pinpoint eyes.
    feverWing: 0x000000, feverEye: 0x9af08a, feverWash: [0.03, 0.10, 0.03], surgeMotes: true,
    hideRiderGlow: true,
    wingEmissive: 0x000000,   // cruise membrane emissive EXPLICITLY black (light is the heart, never the wing)
    body: 0xcfc9b8, belly: 0xaaa392,
    wingInner: 0xbdb6a4, wingOuter: 0xcfc9b8,
    // Bone tones for the shared horn/scales mats (dragonModel builds them for every
    // def; the Revenant's parts don't attach them, so these just keep the mats off the
    // white default — a chalk-ivory drake has no warm horn/steel scute anywhere).
    horn: 0xbdb6a4, scales: 0xcfc9b8,
    eye: 0x76f068,
    apexEye: 0x9af08a, apexSeam: 0x54f04e, coreGlow: 0x54f04e, surgeHi: 0x8af07e,
    trail: 0x2e8a3a, boostTrail: 0x54f04e,
  },

  phoenix: {
    name: 'Phoenix Ascendant',
    lanceTint: 0xff7a1a, lanceRune: 'phoenixFlame',   // Eternal wisp: blazing orange (PR8)
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

  // ── MOLTEN PHOENIX — "a phoenix of living magma" (PHOENIX-MOLTEN-BUILDSHEET.md).
  // A FRESH premium apex built on the CALDERA system (dragonPhoenixMolten.js):
  // glowing T2-magma body under a dark T4-crust plate FIELD, a T1-sungold spine
  // fissure, and the MOLTEN HEART caldera on the breast (T1 glow-pool + T0
  // whiteheart core). Coexists with the shipped `phoenix` (byte-identical) so the
  // owner can compare old-vs-new. NOT the retired coal empress — every form is
  // re-derived from the molten identity (crust holds the line, fire holds the
  // night). `archetype: 'phoenix'` is kept only as a RIG flag (warm ember motes +
  // constant Rebirth-Surge wingtip fire), not a model path (explicit parts win).
  // Wings are the ride-along `feather` at CP1; `pyreFanWings` land at CP2.
  phoenixMolten: {
    name: 'Molten Phoenix',
    lanceTint: 0xff5410, lanceRune: 'moltenCore',   // Eternal wisp: molten-core orange (distinct from phoenix 0xff7a1a)
    title: 'She is the fire',
    rarity: 'SSSR', maxRarity: 'SSSR', cost: 6000,
    accentHue: 0xff6a14,   // §9 law-9 carrier: magma orange
    archetype: 'phoenix',  // RIG flag only (warm surge motes + Rebirth fire-trails); explicit parts override the recipe
    parts: { torso: 'moltenPhoenixTorso', wings: 'pyreFanWings', head: 'calderaCrestHead', tail: 'emberWhipTail', surface: { shader: [] } },
    stats: { speed: 1.14, handling: 1.27, drain: 0.70, regen: 1.35 },
    hasStyle: true,        // keep its own molten trail colour even in Surge
    feverWing: 0xffd9a0, feverEye: 0xffe8c0,
    feverWash: [0.058, 0.038, 0.012],   // Rebirth screen wash: warm magma-gold, kept low so it never overexposes the frame
    // Base model holds APEX reference dials; each form dials the ladder (cumulative).
    model: {
      scale: 1.18, tailSegments: 7, flapBias: 0.9, flapAmp: 0.92,
      // CALDERA body ladder (apex reference — see forms[] for the per-rung schedule):
      igniteStage: 3, glowLevel: 1.0, heartScale: 1.0, crustCoverage: 0.7,
      crestFan: 5, crestLen: 1.0, headScale: 1.0, eyeScale: 0.7, torsoScale: 1.0, spineGlow: 1.0,
      tailFins: 4, tailLength: 1.0,
      // PYRE-FAN wing ladder: span/chord/upturn grow, the primary rank + dominant
      // pinion + slots + hem-fire arrive rung by rung (each form ADDS wing hardware).
      spanScale: 1.0, chordScale: 1.0, upturn: 1.0, hemFire: 1.0,
      primaries: 7, pinionSlots: 3, pinionDom: 1, secondaries: 10, alula: 1,
    },
    forms: [
      // f0 DORMANT HATCHLING — crusted-over magma, unbroken; faint RED cracks the
      // only tell. Wings a short bare crust fan (no fire-primaries, no hem-fire).
      { igniteStage: 0, glowLevel: 0.25, heartScale: 0, crustCoverage: 1.0,
        crestFan: 0, crestLen: 0.5, headScale: 1.3, eyeScale: 1.3, torsoScale: 0.82, spineGlow: 0,
        spanScale: 0.72, chordScale: 0.75, upturn: 0, hemFire: 0, primaries: 0, pinionSlots: 0, pinionDom: 0, secondaries: 6, alula: 0, tailFins: 1,
        colors: { body: 0x1c0d0a, magma: 0x5e2410, sungold: 0xe0480e, lavaDeep: 0x3a1408,
          coreGlow: 0xff8030, apexSeam: 0xe0480e, eye: 0xc85a1e } },
      // f1 FRACTURING — the crust cracks; fissures glow SUNGOLD, the heart rim forms,
      // first 3 fire-primaries + hem-fire kindle, the wing begins to arch (upturn 0.3).
      { igniteStage: 1, glowLevel: 0.5, heartScale: 0.5, crustCoverage: 0.92,
        crestFan: 2, crestLen: 0.7, headScale: 1.15, eyeScale: 1.05, torsoScale: 0.9, spineGlow: 0.35,
        spanScale: 0.85, chordScale: 0.85, upturn: 0.3, hemFire: 0.35, primaries: 3, pinionSlots: 0, pinionDom: 0, secondaries: 8, alula: 1, tailFins: 2,
        colors: { body: 0x22100c, magma: 0x7a2e10, sungold: 0xffab34, lavaDeep: 0x4e1808,
          coreGlow: 0xffa040, apexSeam: 0xffab34, eye: 0xffb84a } },
      // f2 MOLTEN DANCER — half the plates run molten, the MOLTEN HEART OPENS, the
      // eruption crest arrives, 5 primaries with the outboard slots opening.
      { igniteStage: 2, glowLevel: 0.75, heartScale: 0.85, crustCoverage: 0.8,
        crestFan: 3, crestLen: 0.85, headScale: 1.05, eyeScale: 0.85, torsoScale: 0.95, spineGlow: 0.7,
        spanScale: 0.93, chordScale: 0.93, upturn: 0.6, hemFire: 0.7, primaries: 5, pinionSlots: 2, pinionDom: 0, secondaries: 10, alula: 1, tailFins: 3,
        colors: { body: 0x261210, magma: 0x8f3410, sungold: 0xffb32a, lavaDeep: 0x5e1c0c,
          coreGlow: 0xffb060, apexSeam: 0xffb32a, eye: 0xffc85a } },
      // f3 THE MOLTEN EMPRESS — living magma: full crust-crack field, the whiteheart
      // core ignites, the full 7-blade pyre-fan with the DOMINANT PINION + T0 stroke.
      { igniteStage: 3, glowLevel: 1.0, heartScale: 1.0, crustCoverage: 0.7,
        crestFan: 5, crestLen: 1.0, headScale: 1.0, eyeScale: 0.7, torsoScale: 1.0, spineGlow: 1.0,
        spanScale: 1.0, chordScale: 1.0, upturn: 1.0, hemFire: 1.0, primaries: 7, pinionSlots: 3, pinionDom: 1, secondaries: 10, alula: 1, tailFins: 4,
        colors: { body: 0x261210, magma: 0x9a3a12, sungold: 0xffb84a, lavaDeep: 0x5e1c0c,
          coreGlow: 0xffc46a, apexSeam: 0xffb84a, eye: 0xffd98a } },
    ],
    fx: { auraColor: '255,140,60', auraIdle: 0.0, sparkle: false },
    // Top-level fallbacks (≈ the apex Molten Empress, for any raw render).
    body: 0x261210, belly: 0x3a1408, magma: 0x9a3a12, sungold: 0xffb84a, lavaDeep: 0x5e1c0c,
    scales: 0xffb84a, horn: 0x8f3410,
    featherIn: 0xff7a1a, featherOut: 0x9a3a12, featherEdge: 0xffb84a, featherHi: 0xffe8c0,
    wingInner: 0xff7a1a, wingOuter: 0x9a3a12, wingEmissive: 0xff6a14,
    apexEye: 0xffe8c0, apexSeam: 0xffb84a, coreGlow: 0xffc46a, surgeHi: 0xffe8c0,
    aura: 0xffb060, eye: 0xffd98a, trail: 0xff6a14, boostTrail: 0xffc46a,
  },

  // ── PHOENIX ASCENDANT — REFORGED ("The Ascending Sunhawk") — the MASSIVE glow-up of the
  // shipped `phoenix` (PHOENIX-ASCENDANT-REFORGED-BUILDSHEET.md). A bespoke WHITE-GOLD
  // divine firebird on the solar-ivory system: a LOFTED KEELED body (proud breast-prow,
  // arched S-neck, sculpted haunch — NOT the shipped sphere-chain), deep-chord organized-
  // rank feather wings (emarginated eagle fingers, NO curl), a swept-aft sun-pennant tail,
  // and a radial sun-gorget collar as the withheld coronation regalia. Coexists with the
  // shipped `phoenix` (byte-identical) so old-vs-new compare on the preview; migrate only on
  // owner approval. `archetype: 'phoenix'` is a RIG flag only (warm motes + Rebirth surge).
  // NOTE: CP1 wings/tail ride along as the shipped `feather`/`plume` (regression only) — the
  // bespoke `sunfeather`/`sunpennant` land at CP2/CP3.
  phoenixReforged: {
    name: 'Phoenix Ascendant (Reforged)',   // distinct from the shipped `phoenix` so the shop/inspect UI lets the owner pick old-vs-reforged by label
    lanceTint: 0xffcf6a, lanceRune: 'sunhawk',   // Eternal wisp: solar gold (distinct from phoenix 0xff7a1a / molten 0xff5410)
    title: 'Reborn in fire',
    rarity: 'SSSR', maxRarity: 'SSSR', cost: 6000,
    accentHue: 0xffcf6a,   // §9 law-9 carrier: solar gold
    archetype: 'phoenix',  // RIG flag only (warm ember motes + Rebirth fire-trails); explicit parts override the recipe
    parts: { torso: 'sunhawk', wings: 'sunfeather', tail: 'sunfireTrail', head: 'sunhawkCrown', surface: { shader: [] } },
    stats: { speed: 1.14, handling: 1.27, drain: 0.70, regen: 1.35 },
    hasStyle: true,        // keep its own white-gold trail colour even in Surge
    feverWing: 0xff8428, feverEye: 0xffcf6a,
    // Surge highlight = a HOT GOLD (not the near-white 0xfff8e8 default) so the wing/body fire flares
    // toward INCANDESCENT GOLD-FIRE, not a washed white slab — consistent with this dragon's warm-gold
    // feverWing/feverWash Rebirth identity, and it lets the wings glow bright while staying fire-hued.
    surgeHi: 0xff5a0c,
    fireTrails: true,   // warm the additive speed/boost-trail textures (else they're cool blue/cyan → gray+white cloud on Surge)
    feverAura: 0xff7a22, feverAuraScale: 0.3,   // Surge aura = a modest ember corona
    feverWash: [0.034, 0.017, 0.004],   // Rebirth screen wash: EMBER-orange (half the green/blue) + low, so the wash reads fire and never pushes the frame toward cream/white
    // Base model holds APEX reference dials; each form dials the ladder (cumulative).
    model: {
      scale: 1.18, wingScale: 1.3, flapBias: 0.9, flapAmp: 0.92,
      // SUNHAWK sculpt ladder (apex reference — see forms[] for the per-rung schedule):
      igniteStage: 3, glowLevel: 1.0, keelDepth: 1.0, neckArch: 1.0, coreScale: 1.0,
      headScale: 1.0, eyeScale: 0.7, torsoScale: 1.0, crownFan: 5, crownLen: 1.0, spineGlow: 1.0,
      // FEATHER-WING ranks (the hero) + the emargination/rim + regalia dials, apex reference:
      covertRank: 7, secondaryRank: 6, primaryFingers: 5, fingerSplit: 1.0, roseGoldEdge: 1.0,
      collarFan: 1.0, pennantLift: 1.0, pennantRibbons: 5,
      // The tail hangs off a 4-joint chain; tailWhip makes the rig COIL it at cruise (a travelling
      // S-wave down the joints) + RUDDER it into banks. tailLagScale sets the cruise coil amplitude
      // (0.13 → a clearly-visible travelling lateral tip wave). tailUndulateX drives a genuine
      // phase-lagged VERTICAL travelling wave (the axis the rear-chase camera reads — the key fluidity
      // dial); tailRudderScale trims the compounding turn-curl on the chain to a graceful arc (not a
      // J-hook).
      tailWhip: true, tailLagScale: 0.13, tailUndulateX: 0.26, tailRudderScale: 0.5,
      // This dragon is ALREADY emissive fire at rest, so a full-strength Surge intensity flare just feeds
      // the bloom until the whole bird whites out and the form vanishes. Damp the global Surge intensity
      // HARD (core blaze, spine flare, wing glow all scale by this) so the Surge reads as the fire getting
      // HOTTER + GOLDER (form stays readable), not a white detonation. The hue shift (flareColorWeight,
      // not sgm-scaled) still carries the "it's glowing" read.
      surgeGlowMultiplier: 0.45,
    },
    forms: [
      // f0 EMBER HATCHLING — a warm charcoal chick: proud STUB keel, big head, ember crest,
      // dim heart, NO collar. Hints the apex (level keel, blunt wing) but wears no regalia.
      { igniteStage: 0, glowLevel: 0.25, keelDepth: 0.7, neckArch: 0.3, coreScale: 0.5,
        headScale: 1.3, eyeScale: 1.3, torsoScale: 0.82, crownFan: 2, crownLen: 0.6, spineGlow: 0,
        collarFan: 0, roseGoldEdge: 0, fingerSplit: 0, pennantLift: 0.2, pennantRibbons: 1, wingScale: 1.0,
        covertRank: 3, secondaryRank: 2, primaryFingers: 2,
        colors: { body: 0x2a1208, belly: 0x2a0e06, goldfire: 0x9a5410, flame: 0xc23a0e, crimson: 0x8f2a0c, horn: 0xd8a24a, featherEdge: 0xff8a5a, wingEmissive: 0xff8030,
          featherIn: 0xff8a2a, featherOut: 0xffc85a, featherHi: 0xfff2c8, scales: 0xd8a24a,
          coreGlow: 0xfff2c8, apexSeam: 0xffb05a, eye: 0xffc85a, trail: 0xff973c, boostTrail: 0xffc45c } },
      // f1 KINDLED — the firebird: the neck arches, first secondaries, the ember collar-RUFF
      // buds, the heart lights.
      { igniteStage: 1, glowLevel: 0.5, keelDepth: 0.85, neckArch: 0.6, coreScale: 0.7,
        headScale: 1.15, eyeScale: 1.05, torsoScale: 0.9, crownFan: 3, crownLen: 0.75, spineGlow: 0.35,
        collarFan: 0.3, roseGoldEdge: 0.3, fingerSplit: 0.3, pennantLift: 0.5, pennantRibbons: 3, wingScale: 1.1,
        covertRank: 4, secondaryRank: 4, primaryFingers: 3,
        colors: { body: 0x5e2410, belly: 0x3a1408, goldfire: 0xd98a30, flame: 0xd9541a, crimson: 0xba360e, horn: 0xe6b850, featherEdge: 0xff9a7a, wingEmissive: 0xff7a1a,
          featherIn: 0xff6a1a, featherOut: 0xffd166, featherHi: 0xfff0b8, scales: 0xe6b850,
          coreGlow: 0xfff0b8, apexSeam: 0xffb030, eye: 0xffd166, trail: 0xff8c2e, boostTrail: 0xffd36b } },
      // f2 SOLAR — white-gold begins: full ranks, the collar half-fans + gilds, rose-gold
      // edges arrive, the heart becomes a glow-pool.
      { igniteStage: 2, glowLevel: 0.75, keelDepth: 0.95, neckArch: 0.85, coreScale: 0.85,
        headScale: 1.05, eyeScale: 0.85, torsoScale: 0.95, crownFan: 4, crownLen: 0.9, spineGlow: 0.7,
        collarFan: 0.6, roseGoldEdge: 0.7, fingerSplit: 0.6, pennantLift: 0.8, pennantRibbons: 4, wingScale: 1.2,
        covertRank: 6, secondaryRank: 5, primaryFingers: 4,
        colors: { body: 0x7a3a12, belly: 0x3a1408, goldfire: 0xe69b1f, flame: 0xd9541a, crimson: 0xcf440c, horn: 0xf0c860, featherEdge: 0xff9c7a, wingEmissive: 0xff7a1a,
          featherIn: 0xffb24a, featherOut: 0xffe8b0, featherHi: 0xfff8e0, scales: 0xf0c860,
          coreGlow: 0xfff8e0, apexSeam: 0xffe6a0, eye: 0xffe6a0, trail: 0xff942e, boostTrail: 0xffe082 } },
      // f3 CELESTIAL REBIRTH — the WHITE-GOLD DIVINE firebird: the blazing sun-gorget, the
      // white-hot heart, full emarginated primaries, the full swept sky-pennant, the halo.
      { igniteStage: 3, glowLevel: 1.0, keelDepth: 1.0, neckArch: 1.0, coreScale: 1.0,
        headScale: 1.0, eyeScale: 0.7, torsoScale: 1.0, crownFan: 5, crownLen: 1.0, spineGlow: 1.0,
        collarFan: 1.0, roseGoldEdge: 1.0, fingerSplit: 1.0, pennantLift: 1.0, pennantRibbons: 5, wingScale: 1.3,
        covertRank: 7, secondaryRank: 6, primaryFingers: 5,
        colors: { body: 0x8a5514, belly: 0x3a1208, goldfire: 0xe69b1f, flame: 0xd9541a, crimson: 0xd8500e, horn: 0xf4c860, featherEdge: 0xff9a5a, wingEmissive: 0xff7a1a,
          featherIn: 0xffb24a, featherOut: 0xffd166, featherHi: 0xfff2c8, scales: 0xf4c860,
          coreGlow: 0xffc46a, apexSeam: 0xffb84a, aura: 0xffc888, eye: 0xffe0a0, trail: 0xff9a2e, boostTrail: 0xffc46a } },
    ],
    fx: { auraColor: '255,236,190', auraIdle: 0.0, sparkle: false },
    // Top-level fallbacks (≈ the apex Eternal fire-body, for any raw render).
    body: 0x8a5514, belly: 0x3a1208, goldfire: 0xe69b1f, flame: 0xd9541a, crimson: 0xd8500e,
    scales: 0xf4c860, horn: 0xf4c860,
    featherIn: 0xe69b1f, featherOut: 0xd9541a, featherEdge: 0xff9a5a, featherHi: 0xfff2c8,
    wingInner: 0xe69b1f, wingOuter: 0xd9541a, wingEmissive: 0xff7a1a,
    apexEye: 0xffe0a0, apexSeam: 0xffb84a, coreGlow: 0xffc46a, surgeHi: 0xfff2c8,
    aura: 0xffc888, eye: 0xffe0a0, trail: 0xff9a2e, boostTrail: 0xffc46a,
  },



  // A sleek astral serpent: one continuous flowing crystal body wrapped in glowing
  // energy bands, lateral astral fin-vanes, a regal mask head + a celestial saddle,
  // that slithers HORIZONTALLY (low + readable, §0.5) and tapers into a streaming
  // comet wake. A fully NON-standard body plan — built entirely from composable
  // parts (crystalSerpent / sideFins / cometWake / celestialMask).

  // ── STARTER: FIRE — "Cinderwing", the flame-tailed raptor ─────────────────
  // Hull dragon (data-driven Night-Fury kernel). Lean ARCHED body + clean swept
  // DELTA wings (scallop≈0, flame:false → NOT Ember's jagged flame wing) + a long
  // whip tail tipped with a glowing FLAME BULB (the Charizard read). 3 forms, SSR
  // cap. Radiant restrained (glow ≤1.0, no glowSeams) so it stays below Eternals.

  // ── STARTER: WATER — "Tidewing", the manta ────────────────────────────────
  // Hull dragon. FLAT + WIDE manta body, huge TRIANGULAR pectoral fin-wings
  // (scallop≈0, flat plane — not a bat elbow), a thin whip tail ending in a flat
  // HORIZONTAL fluke. Soft teal bio-luminescence: rounded dorsal fin-bumps, a
  // translucent glowing membrane edge (wingSSS), teal spine-line. Enriched so its
  // Radiant is not plain, but kept SOFT + low-saturation (below future Eternals).

  // ── STARTER: EARTH — "Cragmaw", the plated cragback ───────────────────────
  // Hull dragon. HEAVY broad tank body with a tall plated back (stone shingle run),
  // short broad leathery wings, and a stone CLUB tail (grown from the loft — the
  // rear stations swell back up). Opaque rough rock, warm amber crack-glow at
  // Radiant. Grounded mineral read; nothing else on the roster is a heavy club-tail.

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
    lanceTint: 0xff3b2f, lanceRune: 'bullHorns',   // Eternal wisp: molten charge-red (PR8)
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
    lanceTint: 0xffa11a, lanceRune: 'bullHornsRing',   // Eternal wisp: molten gold-orange (PR8)
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

  // ── ASSET-BACKED EXPERIMENT (not procedural) ──────────────────────────────
  // THUNDERCOIL AMPITHERE — a legless storm-serpent whose BODY mesh is a committed
  // GLB (assets/models/thundercoil.glb), loaded by dragonGlb.js instead of
  // buildDragonModel's procedural builders. It coexists with the procedural
  // roster (which is untouched) to prove the AI-asset pipeline. `assetBacked`
  // caps it at one form (no ascension morph) and bypasses the procedural
  // creature-grammar validation.
  //   HYBRID rig: the GLB supplies only the wingless body+head; dragonGlb.js
  //   mounts authored storm-membrane WINGS under the flap rig, so the shipped
  //   gameplay-reactive wingbeat animates the AI mesh (thin membranes also
  //   reconstruct poorly from image-to-3D, so the body is the only AI part).
  //   The GLB is the REAL Higgsfield body now: a textured, wingless storm-serpent
  //   from image_to_3D (job c608693e, ~31k tris, single mesh, no rig). Retune the
  //   glb.{scale,rotY,shoulder} placement on the PR preview — no code change.

  // ── VERDANT PRISMWING — the first FULL GLB-auto-rig hero (LEAPFROG L108) ───
  // Mesh: Higgsfield multi_image_to_3d job 92f1ae55 from the human-approved
  // cel-shaded concept (090d9d2c: teal-green scales, golden chest, crystalline
  // ice-blue crest) + generated side (1d3a0413) / top (1663563a) views.
  // MEASURED (glbinspect): 12,340 tris, 7.80 MB, one mesh; native bbox
  // x ±0.956 (wingspan), y ±0.595, z ±0.566; standing pose, Y-up, symmetric.
  // rigMode:'skinned' = dragonGlbRig auto-rig: the mesh is skinned to a 14-bone
  // skeleton at load and the SHIPPED flapWing/spine-whip/tail drive animates it
  // (no baked clips, no shader hinge). rig knobs are measured defaults —
  // override here only if the preview shows a mask/placement miss.
};

// ── A/B PREVIEW: "Nightglass Vesper · Lean" ──────────────────────────────────
// The owner's A/B request: the 7/10-era BODY + the WING FIX (medial wrist + fingered
// outline) + all the motion — but WITHOUT the Finished-Blade surface RICHNESS (the
// knapped plate field, the wing covert row, the crest crown expansion, and the hind
// legs). A near-clone of `vesper` (same builders/palette/motion/shoulder-fix/twin-
// crescent tail) with those richness dials forced OFF in the base model AND every form,
// so the two entries sit side-by-side in the shop for the owner to compare + play.
DRAGONS.vesperLean = {
  ...DRAGONS.vesper,
  name: 'Nightglass Vesper · Lean',
  title: 'Knapped clean',
  model: { ...DRAGONS.vesper.model, knapPlates: 0, covertRow: 0, legHint: 0, crestBlade: 0, crestWeb: 0, earFinPairs: 3 },
  forms: DRAGONS.vesper.forms.map((f) => ({ ...f, knapPlates: 0, covertRow: 0, legHint: 0, crestBlade: 0, crestWeb: 0, earFinPairs: Math.min(3, f.earFinPairs ?? 3) })),
};

// Highest multipliers in the roster (for shop stat-bar normalisation).
export const DRAGON_STAT_CAP = { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 };

// The default (jade) wisp accent — the shipped lock-layer role colour. A dragon's
// personal `lanceTint`/`lanceRune` only apply at the ETERNAL form (formLevel>=3,
// the paid ascension tier); every other form and every dragon without one flies
// the shared jade wisp. Display-only — see setWispTint/setLanceTint (damage is a
// separate arg, so a tint can never change behaviour).
export const WISP_JADE = 0x50ffaa;
export function wispTintFor(def, formLevel) {
  return (formLevel >= 3 && def && def.lanceTint != null) ? def.lanceTint : WISP_JADE;
}
export function lanceRuneFor(def, formLevel) {
  return (formLevel >= 3 && def && def.lanceRune) ? def.lanceRune : null;
}

// Rarity grade → display color (card frame, tier pips, reveal flash)
export const RARITY_COLORS = {
  R:    { fg: '#a0c8a0', glow: 'rgba(120,200,120,0.4)',  label: 'R',    grade: 0 },
  SR:   { fg: '#60a8ff', glow: 'rgba(80,140,255,0.45)',  label: 'SR',   grade: 1 },
  SSR:  { fg: '#c080ff', glow: 'rgba(160,80,255,0.5)',   label: 'SSR',  grade: 2 },
  SSSR: { fg: '#ffd86a', glow: 'rgba(255,200,90,0.55)',  label: 'SSSR', grade: 3 },
};
