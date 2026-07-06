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
      { wingScale: 0.72, bladeSpan: 5.4, bladeCount: 5, bladeDetail: 0.6, bladeChord: 0.28, bladeStagger: 0.14, bladeRake: 0.015,   // CP2 dir 3: BABY wings — a near-parallel low rake (0.015) + low stagger + wide chord welds the 5 blades into ONE solid MITTEN paddle so the trailing edge stops reading as a Christmas-tree sawtooth (fable gate). The apex re-pins the fanned formula (bladeRake:-1) for its hero planform slits. — 5 blades (§3 comb identity holds) but SHORTER + a WIDE chord (0.28 so the roots overlap the arm spar into one connected wing, gate r2 dir 5) → soft welded paddles. NOTE: forms merge CUMULATIVELY (ascension.js) so any dial set here leaks to f1/f2 unless re-declared — the apex re-pins the leaked ones below
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
      { wingScale: 0.9, bladeSpan: 7.3, bladeCount: 5, bladeDetail: 0.92,
        spineCurl: 0.0, eyeShape: 0.55, headScale: 0.84, eyeScale: 1.02, snoutScale: 0.62,   // CP2 dir 6: trim the muzzle ~28% so it sits BETWEEN f0's button and f2's short beak; headScale 0.84 keeps eye:head in band after the cut (still a clear step down from f0's 1.3)
        keenEye: false, cuteEye: true,   // CP2: the adolescent bridges — a big ROUND-ALERT pupil eye (eyeShape 0.55 half-almonds it), NOT yet the apex keen falcon decal. The keen almond arrives only at the Radiant apex
        crestBlades: 2, crestScale: 0.74, crestGoldAmount: 0.15, crestSeat: 0.13,   // CP2 r3 dir 3: mute crest gold to body-hue + seat the sprouts into the crown (0.13 = as deep as the §7 motif-invariance drift cap allows) so they root rather than hover
        wingTipGold: 0xd9b36a, wingTipGoldAmount: 0.5,   // CP2 dir 5: PARTIAL gold at the adolescent
        tailStyle: 'simple', tailTipFork: true, tailSegments: 5, neckSegments: 5,
        ridgeCount: 8, spineGlow: 0,
        colors: { body: 0x496d99, belly: 0xd4e9ff, wingInner: 0xc6dff0, wingOuter: 0x6f90b4,   // CP2 r2 dir 4: a true MID value (was 0x33517a, near-apex-deep) — the ramp now reads pale f0 → mid f1 → deep f2
          wingEmissive: 0x5f7f9c, scales: 0xb2cee6, horn: 0xb6cfe4,
          apexSeam: 0x9cc0dc, eye: 0xbfe2fb, coreGlow: 0x86bce4 } },
      // Radiant apex (form 2) — proud upright S, keen almond eyes, full high-aspect
      // comb (span 2.8–3.2×), 3-blade crest fan, dorsal sail, gold-tipped swallow
      // banner tail. Deepest sky value, gold at its richest (still DIFFUSE).
      { wingScale: 1.0, bladeSpan: 11.6, bladeCount: 5, bladeDetail: 1.45, neckBlend: 1.45,   // longer wing (blade length adds no tris) → top-planform span:body into the 2.8–3.2 band (gate r8 dir 2); denser neck fuses the segment grooves
        spineCurl: 0.95, eyeShape: 1.0, headScale: 0.52, eyeScale: 0.88,   // eyeScale 0.88 (was 0.52→0.85): the gate read the apex "blind head-on"; the readability comes mostly from the forward+up anchor + forward pupil disc — the size stays the ladder's smallest (§7 eye:head monotonic holds)
        // APEX PIN (CP2): forms merge cumulatively, so re-declare every dial the younger forms
        // changed — otherwise f1's muted-gold/wide-chord leak forward and silently corrupt
        // the approved apex. These pin the exact approved apex values.
        keenEye: false, cuteEye: true,   // the apex joins the UNIFIED socketed-eye system — eyeShape 1.0 hoods it into a keen slanted almond. (The old keenEye decal was dark-on-dark: it read as NO eyes at gameplay value — the unresolved wall since CP1)
        bladeChord: 0.133, bladeStagger: 0.28, bladeRake: -1,   // approved apex chord + deep stagger + the FANNED per-blade rake formula (sentinel -1) for the hero planform slits (f0 welded them at 0.28/0.14/0.015)
        crestGoldAmount: 1, crestSeat: 0,   // full gold crest at its approved height (f1 muted+sank it)
        wingTipGoldAmount: 1,            // full gold swallow-banner tips (f0/f1 restrained them)
        tailPlates: true,               // apex keeps its dorsal tail ridge (f0 turned it off)
        crestBlades: 3, crestScale: 1.6, skullType: 'smoothWedgeSkull', snoutScale: 0.68,   // bespoke ONE-shell falcon wedge (no ellipsoid plate-stack); shorter muzzle seats head:body/eye:head in band + kills the needle beak; crest breaks the outline
        tailStyle: 'finned', tailBannerFork: true, tailLength: 0.62, tailSegments: 6, neckSegments: 5,   // shorter tail so the wings visually dominate (gate r7 dir 7) — raises the reconciled visual span:body
        ridgeCount: 7, spineGlow: 0.2, dorsal: true,
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
    parts: { torso: 'serpent', wings: 'silkFinWings', head: 'draconic', tail: 'clean' },
    model: {
      scale: 1.0, wingScale: 1.0, tailSegments: 12, neckSegments: 8,
      headArchetype: 'softStealth',      // rounded wedge skull + large soft calm eyes + swept ear-fins — the river-dragon read
      headScale: 0.6, snoutScale: 0.72, eyeScale: 0.82, eyeShape: 1.0,
      bellyPaint: true,                  // pale mint underside vertex-painted on the ventral serpent torso (ICONIC GREEN belly)
      whiskerFins: true,                 // trailing whisker fins (jade signature) — cradle the chin pearl
      // silk-fin shared dials (per-form lobe count / span / carrier accrete below)
      lobeCount: 4, lobeSpan: 3.5, lobeRake: 0.62, lobeTilt: 0.82, lobeCamber: 0.26,
      lobeNotch: 0.36, lobeScale: 0.8, lobeDetail: 1.3, rimCarrier: 1.0, streamerLen: 3.0, pearlStage: 2,
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
      { headScale: 1.15, snoutScale: 0.55, eyeScale: 1.5, eyeShape: 0.0,
        neckSegments: 5, tailSegments: 6, whiskerFins: false, hornType: 'noHorn',
        lobeCount: 3, lobeSpan: 1.9, lobeTilt: 0.72, lobeDetail: 0.55, rimCarrier: 0.3, streamerLen: 0, pearlStage: 0,
        tailStyle: 'simple', ridgeCount: 0, crest: 0, spineGlow: 0,
        colors: { body: 0x3cb883, belly: 0xdaf7e6, wingInner: 0x3aa578, wingOuter: 0x157a4e,
          wingEmissive: 0x9ff0c8, scales: 0x9fe6c4, horn: 0xcfe8c0,
          apexSeam: 0xbdf3dc, eye: 0x8ff0c2, coreGlow: 0x6ad0a0 } },
      // Adolescent (form 1) — body lengthens, lobes unfurl, whiskers + ear-fins bud,
      // eyes narrow, snout projects, the pearl is HELD (glowing). MID value.
      { headScale: 0.85, snoutScale: 0.68, eyeScale: 1.05, eyeShape: 0.5,
        neckSegments: 7, tailSegments: 10, whiskerFins: true,
        lobeCount: 3, lobeSpan: 3.0, lobeTilt: 0.78, lobeDetail: 1.0, rimCarrier: 0.6, streamerLen: 0, pearlStage: 1,
        tailStyle: 'simple', ridgeCount: 10, crest: 0, spineGlow: 0.16,
        colors: { body: 0x28a06b, belly: 0xd2f2df, wingInner: 0x2f9e77, wingOuter: 0x136b45,
          wingEmissive: 0x8ff0c2, scales: 0x8fe0be, horn: 0xc7ebcf,
          apexSeam: 0x9ff0c8, eye: 0x8ff0c2, coreGlow: 0x4fc191 } },
      // Radiant apex (form 2) — the S-ribbon: proud upright S posture, keen long
      // almond eyes, 4 lobes + trailing streamers, veil (finned) tail, whiskers
      // cradling the luminous river-pearl (the ONE bloom). DEEPEST value, richest
      // saturation — still NO glow-seams (law 12); spineGlow ≤0.32.
      { headScale: 0.6, snoutScale: 0.72, eyeScale: 0.82, eyeShape: 1.0,
        neckSegments: 8, tailSegments: 12, whiskerFins: true, crest: 1,
        lobeCount: 4, lobeSpan: 4.0, lobeTilt: 0.95, lobeDetail: 1.3, rimCarrier: 1.0, streamerLen: 3.0, pearlStage: 2,
        tailStyle: 'finned', ridgeCount: 14, spineGlow: 0.3,
        colors: { body: 0x178a54, belly: 0xcaf0d8, wingInner: 0x2f9e77, wingOuter: 0x116b45,
          wingEmissive: 0x9ff0c8, scales: 0x8fe0be, horn: 0xc7ebcf,
          apexSeam: 0x9ff0c8, eye: 0x8ff0c2, coreGlow: 0x3aa078 } },
    ],
    fx: { auraColor: '121,226,183', auraIdle: 0.0, sparkle: false },
    // ICONIC GREEN hide — a VIVID mid-value jade body (was near-black moss), pale mint belly.
    bodyRoughness: 0.5, bodyMetalness: 0.02, bodyEnvIntensity: 0.55,
    body: 0x178a54, belly: 0xcaf0d8, scales: 0x8fe0be, horn: 0xc7ebcf,
    wingInner: 0x2f9e77, wingOuter: 0x116b45, wingEmissive: 0x9ff0c8,
    apexEye: 0x8ff0c2, apexSeam: 0x9ff0c8, coreGlow: 0x3aa078, surgeHi: 0xd6ffe9,
    eye: 0x8ff0c2, trail: 0x3fc48f, boostTrail: 0x9ff0c8,
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
  thundercoil: {
    name: 'Thundercoil Ampithere',
    title: 'A storm given a spine',
    rarity: 'SSR',
    maxRarity: 'SSR',
    cost: 0,                 // free so the experiment is one tap to equip + test
    assetBacked: true,
    meshUrl: './assets/models/thundercoil.glb',
    // UNIFIED WINGED MESH: one fused GLB (body + head + wings) from the cel-shaded
    // hero concept (Higgsfield job d01ab50b). Native pose stands vertical — spine
    // along +Y (head +Y → tail −Y), wingspan ±X, and dorsal −Z / belly +Z. Facing is
    // MEASURED, not guessed: rotX = −π/2 lays native +Y/−Y level (head −Z, tail +Z at
    // equal height) to match the procedural roster (azure: head [0,+0.31,−1.91] /
    // tail [0,+0.2,+2.11]); rotY = π then rolls 180° about the spine so the DORSAL
    // faces up — the bare −π/2 left the belly up. `fusedWings` retires the authored/
    // separate wings (the mesh carries its own) and turns on the shader wing-flap
    // deform; `rim` defaults add a fresnel edge + fill so the PBR mesh isn't a black
    // silhouette when backlit. Retune on the PR preview.
    glb: { scale: 3.9, rotY: Math.PI, rotX: -1.5708, rotZ: 0, shoulder: [0.3, 0.2, -0.4], riderAt: [0, 0.9, 0.2],
      fusedWings: true,
      // Procedural body slither: traveling lateral spine wave (local units; amp ramps head→tail).
      slither: { amp: 0.10, freq: 8.0, speed: 4.0 },
      // Shader wing-flap: verts wide in X (|localX|>hingeX) AND in the front/shoulder band
      // (native spine Y > minS) rotate about a fore-aft hinge by amp·sin(phase), symmetric.
      // minS keeps the coiled TAIL (low Y, but it swings wide in X) out of the wingbeat.
      wing: { hingeX: 0.28, minS: -0.15, amp: 0.55 } },
    stats: { speed: 1.10, handling: 1.06, drain: 0.97, regen: 1.0 },   // fast + electric
    model: {
      scale: 1.0, bodyScale: 1.0, wingSpan: 1.0,
      flapBias: 1.05, flapAmp: 1.0, spineGlow: 0,
    },
    // Storm palette: charcoal/navy hide, pale-silver underbelly, electric blue-white accents.
    fx: { auraColor: '120,200,255', auraIdle: 0.05, sparkle: false },
    body: 0x232838, belly: 0xb9c4d6, scales: 0x2c3346, horn: 0x9fc4ff,
    wingInner: 0x33405c, wingOuter: 0x161a26, wingEmissive: 0x8ec8ff,
    apexEye: 0xd6ecff, apexSeam: 0x8ec8ff, coreGlow: 0x7ab8ff, surgeHi: 0xeaf4ff,
    eye: 0xbfe2ff, trail: 0x8ec8ff, boostTrail: 0x5aa0ff,
  },

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
  verdant: {
    name: 'Verdant Prismwing',
    title: 'Cut from living crystal',
    rarity: 'SSR',
    maxRarity: 'SSR',
    cost: 0,                 // free while the pipeline is judged; price at sign-off
    assetBacked: true,
    meshUrl: './assets/models/verdant.glb',
    glb: {
      scale: 6.5, rotY: Math.PI, rotX: 0, rotZ: 0, riderAt: [0, 0.7, 0.1],
      rigMode: 'skinned',
      // VISION-MARKED joints (Claude on tools/rigshots.mjs renders
      // rigshot-verdant-{top,side}.png — the "Claude is the tagger" pipeline,
      // replacing both the manual glbtagger and the window heuristics).
      // Verified by the headless probe: partitions wing 5562 / chest 2969 /
      // neckHead 1938 / hipTail 2296; wingtip moves 2.69 on a 0.4 rad flap;
      // MAX MEMBRANE EDGE STRETCH 2.48 at a hard flap extreme (v1's window
      // weights measured 70.9 — the wing-smudge fix, quantified). The tail is
      // a marked POLYLINE because this mesh's tail curls sideways.
      rig: {
        tailN: 4, smoothIters: 24,
        joints: {
          shoulder: [0.75, -0.9, -3.25], elbow: [1.6, 0.6, -3.6], wrist: [2.5, 2.1, -3.9],
          tip: [4.75, 1.0, -1.1],
          fingers: [[4.65, 0.4, 1.4], [3.35, 0.1, 2.05], [2.2, -0.1, 2.3]],
          neck: [0, -1.4, -3.9], head: [0, -1.2, -5.0],
          hip: [0, -1.9, 1.8],
          tail: [[0, -1.5, 3.0], [0, -1.25, 4.0], [0, -1.05, 5.0], [0, -0.85, 6.05]],
          chest: [0, -2.1, -1.5], chestZ: [-3.0, 0.6], wingZ: [-4.2, 2.4],
        },
      },
      rim: { intensity: 0.45, fillIntensity: 0.22 },
    },
    stats: { speed: 1.04, handling: 1.12, drain: 0.96, regen: 1.05 },  // agile forest spirit
    model: {
      scale: 1.0, flapBias: 0.95, flapAmp: 1.0, spineGlow: 0,
      tailWhip: true,          // REQUIRED: bone-chain tail is rotation-driven
      flapProfile: { lagElbow: 0.24, lagWrist: 1.0, elbowAmp: 0.3, foldAmp: 0.3 },
    },
    // Canopy palette: teal-green hide, gold chest, crystal-mint accents.
    fx: { auraColor: '120,255,200', auraIdle: 0.05, sparkle: false },
    body: 0x1e7a5e, belly: 0xd9a83a, scales: 0x14543f, horn: 0xbfe8ff,
    wingInner: 0x1d4a3a, wingOuter: 0x0f2c22, wingEmissive: 0x66d9a8,
    apexEye: 0xe8c86a, apexSeam: 0x9fe8d8, coreGlow: 0x66ffc8, surgeHi: 0xeafff4,
    eye: 0xe8c86a, trail: 0x66d9a8, boostTrail: 0x2fb98a,
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
