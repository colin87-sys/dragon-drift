// Boss definitions — data, not code. A boss is hp + a procedural model recipe +
// an ordered list of phases, each with its own attack set and fire cadence. The
// controller (boss.js) resolves attack ids to bullet patterns, so adding a boss
// is (mostly) authoring a new entry here. Tuning numbers default from CONFIG.BOSS.
//
// Phase `atFrac` is the hp fraction at which that phase BEGINS (1.0 = full hp).
// `attacks` are pattern ids understood by boss.js:
//   aimed  — three bullets near your position (precision sidestep, REFLECTABLE)
//   fan    — a wide spread across the lane (find the gap, REFLECTABLE)
//   spiral — an instant radial burst that flies outward
//   tunnel — a succession of bullet-rings rushing at you; weave the moving centre
//   spiralStream — a rotating emitter, arms sweeping around (read the spin)
//   curtain — a full 2D wall minus one safe lane placed away from you (commit early)
//   movingGap — timed wall rows whose gap slides sideways (track it in time)
//   iris — contracting rings; the safe zone shrinks to the centre (the showpiece)
//   stream — a tracking hose re-aiming at your live position (peel away in an arc)
//   secondWave — a spread, then a half-gap-offset spread where you dodged to
//   crossfire — two flanking emitters converge aimed spreads (REFLECTABLE)
// Pattern JOBS (danmaku design): fills deny the plane (camp-proof), anti-flee
// punishes a single relocation, garnish layers aimed shots on a structure.
// Difficulty escalates by unlocking streamed patterns + tightening cadence —
// never by raw bullet count (mobile visibleCap; density reads as unfair).
// `accent`/`glow` colour the boss BODY; `bulletColor` is the magenta danger colour.
// `constrictPhase`: phase index at which the arena walls slam in (showpiece).
//
// `tier` (1–5, REQUIRED): the band this boss sits in (BOSS-DESIGN.md §5b/§5g) —
// tests/boss.mjs keys the tri/draw ceilings off it (TIER_BUDGETS). Sentinels=1,
// Colossi=2, Calamities=3, World-Enders=4, the Apex=5.
//
// SPELL CARDS (§5f/§5h): `cards[]` names each phase as a title-carded set-piece,
// aligned 1:1 with `phases` (card[i] ↔ phase[i]). A card =
//   { id (stable, never the display name), name, atFrac (= its phase's),
//     timer (~20–30s capture window), dread? (exactly ONE, always last),
//     survival? (invincible seal — outlast the timer to resolve; no hp snap) }.
// Naming grammar (§5f): "<FRAGMENT OF THE EPITHET> — <plain pattern name>".
// Capture = survive the card hitless; ledgered per-card (local-only, save.js).
// A def WITHOUT `cards` keeps the un-carded phase behaviour (coexist rule).
//
// RHYTHM SIGNATURES (§5i): `rhythm = { signature, ticket?, phases:[…] }` gives a
// boss a DISTINCT temporal fingerprint (the ping-pong fix). The bossRhythm.js
// phrase machine reads it at the cadence seam — replacing the flat uniform roll.
// A def WITHOUT `rhythm` keeps the legacy uniform `cadence` roll (coexist).
// Schema (staged canonical, #211): each `phases[i]` (indexed to `phases` above)
// authors a `phrase` — an ordered list of MEASURES the machine walks and repeats:
//   { kind: 'sustain', attack, beats, gap }   a stream: `beats` shots, `gap` between
//   { kind: 'burst',   attack, count, gap }   a wall slam: `count` shots, tight `gap`
// `gap` is a scalar or a [lo,hi] range (uniform). Between phrase repeats the machine
// rests `restLo..restHi` by `restDist` ('uniform' | 'bimodal' lo-or-hi | 'decaying'
// hi→lo ramp = a crescendo/tightening). `ticket:{bpm,quantize}` snaps to the beat
// grid via getBeatClock() when music is live. `signature` (the §5i taxonomy name:
// 'metronome' | 'crescendo' | 'ambush-rest' | 'burst-sustain' | 'call-response')
// tags the fingerprint for review; `ratioBurst` documents the wall-burst share.
// The machine owns the AMBER FLOOR: if a phrase runs a rolling 12s window with no
// amber-carrier volley, the next shot is swapped to an amber-carrier drawn from the
// phase `attacks` (the parry-diet fairness subsidy). The `rhythmprint` CI gate
// (tests/boss.mjs) asserts any two bosses' gap distributions differ by a KS floor;
// `amberdiet` asserts the amber floor holds.

export const BOSSES = {
  voidmaw: {
    id: 'voidmaw',
    name: 'VOIDMAW',
    title: 'the Sky Tyrant',
    epithet: 'The Hollow Judgment',   // bossTitleCard's reveal-card subtitle
    tier: 1,                          // SENTINEL (§5b band 1)
    hpMax: 180,
    // THE LANCE layer (combat-verbs SOP §II.9). Per-def lock data — all optional and
    // neutral-at-rung-0 (a def with none behaves byte-identically to before):
    //   virtualLockOrgan: '<partName>'  V1 aim-line target when there are no/limited
    //                                   lockParts (must resolve via model.partWorldPos).
    //   lockParts: [{ part, phases?, hot? }]   V2 paintable organs (PR2).
    //   lockMuted: true                 reticle ashen, V1 rate bonus off (slot 13).
    virtualLockOrgan: 'faceCore',     // V1 slot-1 TUTORIAL: aim at the whole FACE (a big,
                                      // stable central anchor), not the tiny fast-swaying eye —
                                      // so the first teach is easy to lock (bossIdol.js faceCore)
    holdSway: { amp: 3.2, freq: 0.6 },// slot-1 TEACH sway, re-livened (L177). The TUTORIAL
                                      // inequality: amp < LOCK.retentionConeXY (4.0) means a
                                      // centred player NEVER drops a held lock — the whole swing
                                      // fits inside the retention cone — while the mask still
                                      // visibly strafes. (The prior ±1.8m calm was compensating
                                      // for the old binary dwell; retention+drain+anchor
                                      // smoothing carry the motion now. Default sway is ±5m@0.7.)
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the
    // Hollow Idol-Mask hero builder (bossIdol.js) instead of the legacy
    // crystal-core construct. A def WITHOUT `archetype` still falls through
    // to the legacy path unchanged — that's the coexist rule this system is
    // built on (both bosses have now migrated; the fallback stays live for
    // any future def that doesn't set one yet).
    archetype: 'idolMask',
    accent: 0xa040ff,         // body reads violet so the magenta bullets pop as danger
    glow: 0xc89aff,
    bulletColor: 0xff2b6a,    // magenta = "this will hurt" (danger role colour, never per-boss)
    approachFrom: 'behind',   // 'behind' (overtakes you) | 'side' (sweeps in)
    tutorial: true,           // first boss: teaches the verbs one at a time, gently
    // VOIDMAW is the TUTORIAL boss — it introduces the mechanics one per phase with
    // slow, readable patterns. Later bosses layer in spiral / spiralStream / new
    // patterns and tighter cadences.
    phases: [
      { atFrac: 1.00, cadence: [1.9, 2.5], attacks: ['aimed'] },          // P1: dodge + PARRY (amber)
      { atFrac: 0.66, cadence: [1.6, 2.1], attacks: ['aimed', 'fan'] },   // P2: + spread to weave
      { atFrac: 0.33, cadence: [1.4, 1.9], attacks: ['aimed', 'fan', 'tunnel'] }, // P3: + rings to read
    ],
    // Spell cards (§5f grammar; last is the dread card — the §5f worked example).
    cards: [
      { id: 'voidmaw_verdict',  name: 'HOLLOW — Opening Verdict',            atFrac: 1.00, timer: 22 },
      { id: 'voidmaw_cloven',   name: 'HOLLOW — Cloven Sky',                 atFrac: 0.66, timer: 24 },
      { id: 'voidmaw_splitter', name: 'HOLLOW JUDGMENT — Sky-Splitting Verdict', atFrac: 0.33, timer: 26, dread: true },
    ],
    // §5i METRONOME — fixed-pulse turn-taking, the teacher; tension IS the
    // consistency. Every gap equals the pulse (sustain gap == phrase rest, uniform
    // = degenerate), so it reads as a clock; the pulse only TIGHTENS per phase.
    rhythm: {
      signature: 'metronome',
      ticket: { bpm: 114, quantize: '1/4' },
      phases: [
        { phrase: [{ kind: 'sustain', attack: 'aimed', beats: 1, gap: 2.1 }], restLo: 2.1, restHi: 2.1, restDist: 'uniform' },
        { phrase: [{ kind: 'sustain', attack: 'aimed', beats: 1, gap: 1.85 }, { kind: 'sustain', attack: 'fan', beats: 1, gap: 1.85 }], restLo: 1.85, restHi: 1.85, restDist: 'uniform' },
        { phrase: [{ kind: 'sustain', attack: 'aimed', beats: 1, gap: 1.6 }, { kind: 'sustain', attack: 'fan', beats: 1, gap: 1.6 }, { kind: 'sustain', attack: 'tunnel', beats: 1, gap: 1.6 }], restLo: 1.6, restHi: 1.6, restDist: 'uniform' },
      ],
    },
  },

  stormrend: {
    id: 'stormrend',
    name: 'STORMREND',
    title: 'the Tempest Herald',
    epithet: 'Eye of the Unending Gale',   // bossTitleCard's reveal-card subtitle
    tier: 1,                               // SENTINEL (§5b band 1)
    hpMax: 220,
    virtualLockOrgan: 'focalEye',          // LANCE V1: the storm-eye core (bossMandala.js)
    // §ENG-B hero: the storm's gaps are the EYE's — iris rings centre on focalEye and
    // movingGap's safe lane LOCKS to the eye axis ("fly into the eye of the storm" is
    // literally true; the ±5 station sway makes the eye a legible moving read).
    // §BOSS-FEEL-AUDIT: dropped the `card:` gate — the eye-read was the boss's whole
    // identity but only armed in the FINAL card (2/3 of the fight was generic wall-dodge).
    // Un-gated, it runs from P2 (where iris/movingGap debut) → the whole fight is "chase the
    // eye", the P2 slow rings TEACH the read the P3 dread then weaponises. (Ungated form is
    // the shipped eitherwing precedent: gapAnchor: { iris: { part: 'threadMid' } }.)
    gapAnchor: {
      iris:      { part: 'focalEye' },
      movingGap: { part: 'focalEye' },
    },
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the
    // Eye-of-the-Storm Mandala hero builder (bossMandala.js) instead of the
    // legacy crystal-core construct — see voidmaw's `archetype` comment above.
    archetype: 'stormMandala',
    accent: 0x2fd8e8,         // storm teal — reads apart from Voidmaw's violet at 30m
    glow: 0xffd870,           // gold storm-light
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'side',     // sweeps in like a squall, not an overtake
    // The first REAL boss (Voidmaw is the tutorial): walls and anti-flee patterns
    // instead of raw aimed shots — gentle dials, the lesson is READING, not speed.
    // Phase 3 is the showpiece: the arena constricts + contracting iris rings.
    constrictPhase: 2,
    body: {                   // storm silhouette (see bossModel.js `body` recipe)
      silhouette: 'shard',    // elongated prow vs Voidmaw's round orb
      spikeCount: 7, spikeLen: 2.4, spikeSweep: 0.9,   // swept-back storm vanes
      orbiterStyle: 'ringBlade', orbiterCount: 3,
      eyeCount: 1, coreDetail: 1,
    },
    // §5f law 1 (3–5 move core) + law 3 (develop = same reads, faster, +1 move):
    // a Sentinel DEVELOPS one core, it does not swap the whole vocabulary each
    // phase. STORMREND's identity is storm = wall + anti-flee + constrict, so the
    // core is fan → +movingGap → +iris. (The 2026-07 rebalance trimmed the shipped
    // 8-attack spread — curtain/stream/aimed/secondWave/crossfire — down to this
    // 3-move core; the card ids + CRESCENDO signature are UNCHANGED so 13 EMBERTIDE
    // and 14 THE UNMASKED keep quoting a live boss.)
    // `fan` recurs in every phase: it is BOTH the wall read AND the amber carrier
    // (AMBER_CARRIERS in bossRhythm.js — dropping it from a phase fails amberdiet).
    phases: [
      { atFrac: 1.00, cadence: [1.8, 2.4], attacks: ['fan'] },                       // P1: learn the wall / find the gap
      { atFrac: 0.66, cadence: [1.6, 2.1], attacks: ['fan', 'movingGap', 'iris', 'secondWave'] }, // P2: the wall now MOVES (anti-flee) — `iris` debuts HERE as a slow teach form (§C.1a teach-before-test: it must not first appear in the P3 dread) + `secondWave` (returning gust) keeps P2 distinct from P3. Interim: P3's dread stays the shipped iris until C.1b (ENG-B) upgrades it to the eye-corridor chain
      { atFrac: 0.33, cadence: [1.4, 1.9], attacks: ['fan', 'movingGap', 'iris'] },  // P3: the storm CLOSES IN (constrict — the dread card)
    ],
    cards: [
      { id: 'stormrend_wall',    name: 'UNENDING — Gale Wall',            atFrac: 1.00, timer: 22 },
      { id: 'stormrend_squall',  name: 'UNENDING GALE — Shifting Squall', atFrac: 0.66, timer: 24 },
      { id: 'stormrend_eye',     name: 'EYE OF THE GALE — Heart of the Storm', atFrac: 0.33, timer: 26, dread: true },
    ],
    // §5i CRESCENDO — one ramp per card: sparse → dense → a HARD CUT at capture
    // (the gale gathering). Short phrases + a DECAYING phrase rest (restHi→restLo)
    // make the dominant gap tighten each repeat — the sparse-to-dense ramp — then
    // reset on the next card. The wall/anti-flee attacks flow inside the phrase.
    rhythm: {
      signature: 'crescendo',
      ticket: { bpm: 100, quantize: '1/4' },
      // Phrases DEVELOP the 3-move core (the attacks track phases[].attacks); the
      // restLo/restHi/restDist ramp values are UNCHANGED from the shipped version,
      // so the CRESCENDO rest fingerprint (rhythmprint) is preserved.
      phases: [
        { phrase: [{ kind: 'sustain', attack: 'fan', beats: 1, gap: 0.7 }],
          restLo: 1.3, restHi: 2.6, restDist: 'decaying' },
        { phrase: [{ kind: 'sustain', attack: 'fan', beats: 1, gap: 0.65 }, { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.65 }, { kind: 'sustain', attack: 'iris', beats: 1, gap: 0.65 }, { kind: 'sustain', attack: 'secondWave', beats: 1, gap: 0.65 }],  // §C.1a: iris (slow teach) + secondWave added; gap 0.65 keeps P2 looser than P3's 0.55 (the crescendo still tightens P2→P3)
          restLo: 1.1, restHi: 2.3, restDist: 'decaying' },
        { phrase: [{ kind: 'sustain', attack: 'fan', beats: 1, gap: 0.55 }, { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.55 }, { kind: 'sustain', attack: 'iris', beats: 1, gap: 0.55 }],
          restLo: 0.9, restHi: 2.1, restDist: 'decaying' },
      ],
    },
  },

  craghold: {
    id: 'craghold',
    name: 'CRAGHOLD',
    title: 'the Sundered Colossus',
    epithet: 'The Hands That Held the Sky',   // the lore gap: held — what made them let go?
    tier: 2,                                  // COLOSSUS (§5b band 2)
    hpMax: 260,
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the Stone
    // Colossus builder (bossColossus.js) — the first Tier 2 COLOSSUS
    // (BOSS-DESIGN.md §5b registry slot 3), rebuilt after design review to
    // resolve a concept collision with Voidmaw (boss 1): CRAGHOLD is now TWO
    // COLOSSAL BASALT HANDS WITH AN EYE IN EACH PALM and NO HEAD — a shattered
    // stone crown floats alone in the sky where a head would be. Boss 1 is a
    // face with no body; boss 3 is a body with no face.
    archetype: 'stoneColossus',
    accent: 0x69c94f,         // moss/lichen green — the only unclaimed hue family at 30m
    glow: 0xafd06a,           // deep lichen-gold (shield rim / shards / backlight) — the first, paler pick read as a yellow balloon at shield-raise
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'behind',   // the colossus overtakes and rises over you
    scale: 2.4,               // Tier 2 escalation invariant — COLOSSAL (Sentinels sit at 1.5)
    constrictPhase: 2,        // phase 3: the walls close on the constricted-arena showpiece
    // The crossing-pass setpiece (Tier 2 "the fight moves"): at phase-2 entry
    // the colossus leaves station and drifts across the lane directly over the
    // player, hands spread — the fly-under scale-contrast frame. Read by the
    // controller's def-gated setpiece seam; inert for defs without it.
    setpiece: { id: 'crossingPass', atPhase: 1, dur: 5.0 },
    // Tier 2 difficulty: spiral + spiralStream DEBUT here (first boss to use
    // them), cadences one notch tighter than Stormrend per band — escalation
    // by pattern unlocks + cadence, never raw bullet count.
    phases: [
      { atFrac: 1.00, cadence: [1.7, 2.2], attacks: ['fan', 'spiral', 'aimed'] },              // P1: the radial fill debuts
      { atFrac: 0.66, cadence: [1.5, 2.0], attacks: ['spiralStream', 'crossfire', 'stream'] }, // P2: the hands converge (after the crossing pass)
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['curtain', 'spiralStream', 'crossfire'] },// P3: walls in the constricted arena
    ],
    cards: [
      { id: 'craghold_reach',   name: 'HELD THE SKY — Sundered Reach',        atFrac: 1.00, timer: 24 },
      { id: 'craghold_grasp',   name: 'THE HANDS — Converging Grasp',         atFrac: 0.66, timer: 26 },
      { id: 'craghold_clasp',   name: 'HANDS THAT HELD THE SKY — Colossal Clasp', atFrac: 0.33, timer: 28, dread: true },
    ],
  },

  ashtalon: {
    id: 'ashtalon',
    name: 'ASHTALON',
    title: 'the Ember Hunter',
    epithet: 'What the Ash Still Hunts',   // the lore gap: what is it hunting FOR?
    tier: 2,                               // COLOSSUS (§5b band 2), slot-3 opener
    // LANCE V1: the visor slit. NO lockParts by design (LAW §II.9) — ASHTALON is the
    // mover stress test; its dwell windows are the mantle-hold rest beats, no painting.
    virtualLockOrgan: 'visorSlit',
    // Boss-archetype dispatch (bossModel.js buildBoss): the Ember-Hunter builder
    // (bossAshtalon.js) — BOSS-DESIGN.md §5b registry slot 3, replacing the
    // retired CRAGHOLD. A charcoal raptor of two vast scythe-wings with ONE
    // molten visor slit; it OVERTAKES from behind and hunts (no socket-pair like
    // slot 1, no orb like slot 2 — a single horizontal ember slit in a dark cowl).
    archetype: 'emberHunter',
    accent: 0xff6a30,         // ember orange — the smoulder on charcoal (identity in emissive)
    glow: 0xff9a4a,           // warmer ember (shield rim / shards / backlight)
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'behind',   // it overtakes from behind and rises over you (the hunter)
    scale: 1.7,               // COLOSSUS — the scythe-wings span wide (~14 pre-scale)
    hpMax: 290,               // Tier 2 band (260–330); slot-3 opener sits low in it
    // Mechanical star (SOP): closing + cadence — FAST but SPARSE. Its cards are
    // pursuit curves (stream debuts here), tightening toward the dread dive.
    // §5f rule-break: the scripted cinematic OVERTAKE entrance — rises from behind,
    // a bullet-time close pass with the visor tracking you, pulls ahead (back to
    // camera), then wheels 180° to face you. Announced, no fire, tap to skip.
    cinematicEntrance: true,
    // §5i.B COLOSSI graze (C.2b) — SLIPSTREAM: ride the stoop's wake pocket for graze
    // ticks, then "surge INTO the dive gap" for the exposure window. Inert until the
    // stoopingStrike setpiece is live; the pocket derives its centre/timing from the
    // live dive pose at runtime (boss.js grazeForm cluster).
    grazeForm: 'slipstream',
    // §5e moving-station setpieces (fire while they travel, per-phase). P2 = the
    // wide CIRCLING orbit; P3 = the EMBER HUNT stooping dive from above (dread).
    setpieces: [
      { id: 'circlingPass',   atPhase: 1, dur: 7.0, moving: true },
      { id: 'stoopingStrike', atPhase: 2, dur: 5.5, moving: true, dread: true, recur: 9 },   // §BOSS-FEEL §1 C.1: ~9s quiet re-arms the stoop — 2–3 stoops per dread card, each re-offering the slip pocket
    ],
    phases: [
      { atFrac: 1.00, cadence: [1.5, 2.0], attacks: ['aimed', 'stream'] },                 // P1: the hunter's tracking hose debuts
      { atFrac: 0.66, cadence: [1.4, 1.8], attacks: ['fan', 'stream', 'crossfire'] },       // P2: circling passes converge
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['stream', 'fan', 'secondWave'] },      // P3: the stoop (dread) — `fan` replaces the off-brand `spiralStream` turret fill (§C.2a: the hunter's kit stays "fast but sparse", pursuit-shaped, never a station-keeping spinner); `fan` is also a second amber carrier alongside `stream`
    ],
    cards: [
      { id: 'ashtalon_stoop',   name: 'EMBER — First Stoop',        atFrac: 1.00, timer: 22 },
      { id: 'ashtalon_circle',  name: 'EMBER HUNT — Circling Pass',  atFrac: 0.66, timer: 24 },
      { id: 'ashtalon_strike',  name: 'EMBER HUNT — Stooping Strike', atFrac: 0.33, timer: 26, dread: true },
    ],
    // §5i AMBUSH–REST — long circling silences (2.4–3.2s), then a sforzando burst
    // cluster of quick shots (the stoop); the REST is the dread (the hunter sizing
    // you up). Strongly bimodal, short-heavy. P3's `stream` sustain carries the
    // amber tips so the stoop still serves parry fuel (the diet, §5i C.1).
    rhythm: {
      signature: 'ambush-rest',
      ticket: { bpm: 92, quantize: '1/8' },
      phases: [
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.5 }],
          restLo: 2.6, restHi: 3.2, restDist: 'uniform' },
        { phrase: [{ kind: 'burst', attack: 'crossfire', count: 2, gap: 0.45 }, { kind: 'burst', attack: 'fan', count: 2, gap: 0.35 }],
          restLo: 2.4, restHi: 3.0, restDist: 'uniform' },
        { phrase: [{ kind: 'burst', attack: 'fan', count: 2, gap: 0.4 }, { kind: 'sustain', attack: 'stream', beats: 3, gap: 0.35 }, { kind: 'burst', attack: 'secondWave', count: 2, gap: 0.4 }],  // §C.2a: `fan` replaces `spiralStream` (count/gap unchanged → rhythmprint byte-identical)
          restLo: 2.2, restHi: 2.8, restDist: 'uniform' },
      ],
    },
  },

  marrowcoil: {
    id: 'marrowcoil',
    name: 'MARROWCOIL',
    title: 'the Sky-Swallowed',
    epithet: 'What the Sky Could Not Digest',   // the lore gap: whose skeleton is this?
    tier: 2,                                     // COLOSSUS (§5b band 2), slot 4
    // Boss-archetype dispatch (bossModel.js buildBoss): the Bone-Coil builder
    // (bossMarrowcoil.js) — BOSS-DESIGN.md §5b registry slot 4. A colossal bone
    // dragon: a horned skull (cold pinlight eyes + a lure hung between the horns)
    // leading SIXTEEN coiling vertebrae, with a mid-body RIBCAGE the rail flies
    // through. Distinct from slot 1's mask, slot 2's ring-eye, slot 3's raptor.
    archetype: 'boneCoil',
    muzzle: 'skullGroup',     // head-origin patterns (aimed/fan/stream) emit from the skull, not lane centre (L148)
    virtualLockOrgan: 'skullGroup',   // V1 aim anchor (big, central) — live even before V2
                                      // unlocks. On a V2 boss the anchor is ALSO brandable
                                      // (paintableParts adds it): the head is the easy first
                                      // mark, then UNPAINTED-FIRST drives the sweep to the ribs.
    // V2 LANCE-PAINT anatomy (PR2, the teach fight): the four rib emitters — the SAME
    // pivots that vent the parryable rib ambers, so the C3 exemption is felt here first
    // (a venting rib can't be dwell-painted; parry-paint is PR4's answer). All phases.
    // (+ the skull head via virtualLockOrgan → 5 brand targets, cap 3.)
    lockParts: [
      { part: 'ribPivotL1' }, { part: 'ribPivotR1' },
      { part: 'ribPivotL3' }, { part: 'ribPivotR3' },
    ],
    // §ENG-E ORGAN BREAK (§5b slot 4, the Colossi parry DEBUT): PERFECT-parry a rib's
    // amber (from ribThread, or the closingRibs strain volley) 3× → that rib CRACKS and
    // its amber volley + constrict arc are deleted for the fight (parry as sculptor). The
    // reachable ribs are exactly the four that fire tagged amber (L1/R1/L3/R3); no list
    // needed. Parry-fed only (never gunfire) — the diff from HOLLOWGATE's panes.
    destructibleRibs: true,
    // §ENG-A-R: swatted/reflected bullets snap to one of these organs (roll-directed),
    // so a parry always lands on a rib or the skull instead of the hollow gap the rail
    // flies through. Two rib anchors per flank + the skull as the centre-line/fallback
    // anchor (the same bones the player already reads as lance/amber anatomy, §5i.C).
    reflectTargets: ['ribPivotL1', 'ribPivotR1', 'ribPivotL3', 'ribPivotR3', 'skullGroup'],
    // §5i.B THREAD-THE-GAP (ENG-G) — flying cleanly through a wall's safe gap (its P3 movingGap,
    // and the rib-aperture to come) scores by clearance+lateness and CHAINS. A discrete per-row
    // scorer (no tick ramp); a visible THREADED flourish. Inert for every boss without this label.
    grazeForm: 'threadTheGap',
    accent: 0x8fd0ff,         // ice-blue — the cold lights on dead bone (identity in emissive)
    glow: 0xbfe6ff,           // paler ice (shield rim / shards / backlight)
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'below',    // rises through the fog line (§5e 'below' branch; the sky's leavings surfacing)
    scale: 1.25,              // COLOSSUS — the ×1.6 bone rework grew the local body (chain ~19 pre-scale); 1.25 keeps the same world presence with bigger bones
    hpMax: 300,               // Tier 2 band (260–330); slot-4 sits mid-band, above ASHTALON
    // VALUE-INVERSION sanction (§5b slot 4 / §7b): the pale bone body is the
    // registry's claimed identity axis, so the gate's dark-body law (G2) is
    // inverted for this def — assert a BRIGHT body (median luma ≥150) with dark
    // carved recesses instead of a dark body. Sanctioned by the §5b registry row.
    gate: { pale: true },
    // §5e moving-station setpieces (fire while they travel, per-phase). P2 = the
    // RIB THREAD fly-through (the boss looms close so the rail passes through the
    // ribcage — the SotC scale-contrast frame); P3 = THE CLOSING RIBS dread (the
    // cage constricts one pair at a time while the coil sweeps — graze goldmine).
    setpieces: [
      { id: 'ribThread',   atPhase: 1, dur: 8.5, moving: true },   // L155: the flyby (thread → off-screen → flank emerge + head-turn → centre)
      { id: 'closingRibs', atPhase: 2, dur: 6.0, moving: true, dread: true },
    ],
    // Tier 2 difficulty: iris DEBUTS as expanding bone-white rings off the coil
    // circles (emitter = organ, §5f law 7); cadences one notch tighter toward the
    // Closing Ribs. Escalation by pattern unlock + cadence, never raw count.
    phases: [
      { atFrac: 1.00, cadence: [1.5, 2.0], attacks: ['aimed', 'iris'] },                   // P1: read the bone rings — `iris` (contracting rings) replaces `fan` so the opener IS rings and is no longer byte-identical to HOLLOWGATE/THRUMSWARM P1 (§B-2 triple-opener collision)
      { atFrac: 0.66, cadence: [1.4, 1.8], attacks: ['iris', 'stream', 'crossfire', 'fan'] }, // P2: the coil rings expand (fly-through) — `fan` relocated here from P1 (§B-2), keeping it in the kit
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['iris', 'movingGap', 'spiralStream', 'stream'] },// P3: the closing ribs (dread) — `stream` added as the AMBER carrier (§5i C.1 data-tune: the closing coil keeps tracking, so its amber-tipped hose meets the AMBER FLOOR)
    ],
    cards: [
      { id: 'marrowcoil_surface', name: 'SKY COULD NOT — Surfacing',        atFrac: 1.00, timer: 22 },
      { id: 'marrowcoil_rings',   name: 'NOT DIGEST — Ring of Ribs',        atFrac: 0.66, timer: 24 },
      { id: 'marrowcoil_closing', name: 'MARROW — The Closing Ribs',        atFrac: 0.33, timer: 28, dread: true },
    ],
    // §5i.A RHYTHM SIGNATURE — BURST-vs-SUSTAIN (slot 4). The coil sweeps lay a
    // continuous SUSTAIN stream (low, even gaps); the rib slams punch discrete
    // BURST walls (a tight doublet/triplet, then a hard rest). The burst:sustain
    // ratio CLIMBS each phase — P1 mostly sustain, P3 mostly slam. The staged
    // schema (#211) is now LIVE — bossRhythm.js reads it at the cadence seam.
    // `phases` is indexed to `phases` above; `ratioBurst` is the wall-burst share
    // of each phrase (the per-phase ratio shift that IS the signature).
    rhythm: {
      signature: 'burst-sustain',
      ticket: { bpm: 84, quantize: '1/8' },   // the coil's pulse; bursts land on eighth-notes
      phases: [
        { // P1 — read the bone rings: sustain-led
          ratioBurst: 0.2,
          phrase: [
            { kind: 'sustain', attack: 'aimed', beats: 4, gap: [0.50, 0.62] },
            { kind: 'burst',   attack: 'iris',  count: 2, gap: 0.18 },   // §B-2: iris (rings) replaces fan — the opener finally reads as bone rings
          ],
          restLo: 1.4, restHi: 2.0, restDist: 'uniform',
        },
        { // P2 — the coil rings expand (fly-through): even trade
          ratioBurst: 0.5,
          phrase: [
            { kind: 'sustain', attack: 'stream',    beats: 5, gap: [0.42, 0.50] },
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.22 },   // §BOSS-FEEL-AUDIT: 3→2 count, 0.16→0.22 gap — a readable pair, not a triple (out-of-band aggression for slot 4)
            { kind: 'burst',   attack: 'fan',       count: 2, gap: 0.18 },   // §B-2: fan relocated from P1 (kept in the kit)
            { kind: 'sustain', attack: 'iris',      beats: 2, gap: 0.60 },
          ],
          restLo: 1.5, restHi: 2.1, restDist: 'bimodal',   // §BOSS-FEEL-AUDIT: rest floor 1.1→1.5 (was hotter than the slot-5 peak); quick inter-burst gaps + one long breath
        },
        { // P3 — the closing ribs (dread): burst-led, walls dominate. The trailing
          // `stream` sustain is the AMBER carrier (§5i C.1 amberdiet data-tune: the
          // closing coil keeps its amber-tipped tracking hose, so this dread phase
          // still serves a parry volley — mirrors the `stream` added to `attacks`).
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'movingGap',    count: 2, gap: 0.22 },   // §BOSS-FEEL-AUDIT: 3→2 walls, 0.14→0.22 gap — the tightest burst in the roster relaxed to a threadable pair
            { kind: 'burst',   attack: 'spiralStream', count: 2, gap: 0.22 },   // §BOSS-FEEL-AUDIT: 0.16→0.22 gap
            { kind: 'sustain', attack: 'stream',       beats: 3, gap: 0.42 },
            { kind: 'sustain', attack: 'iris',         beats: 2, gap: 0.55 },
          ],
          restLo: 1.3, restHi: 1.9, restDist: 'decaying',  // §BOSS-FEEL-AUDIT: rest floor 0.9→1.3 (marrowcoil out-fired the slot-5 peak by ~1.6×); the rest still tightens toward each slam
        },
      ],
    },
  },

  eitherwing: {
    id: 'eitherwing',
    name: 'EITHERWING',
    title: 'the Broken Whole',
    epithet: 'Two Halves of the Broken Whole',   // the lore gap: whole of WHAT? (feeds slot 12, ONEWING)
    // §5h DEFEAT BANNER (optional, per-boss): EITHERWING is never fully SLAIN — one half FLEES with
    // the shared body (the ONEWING seed, slot 12). So its kill caption reads the escape, not a felling:
    // the note title acknowledges the flight; the kill card's name line carries the ONEWING rider hook.
    defeat: { slain: '⟵  ONE HALF FLEES  ⟵', felled: 'IT KEPT THE BODY' },
    tier: 2,                                       // COLOSSUS (§5b band 2), slot-5 PEAK
    // Boss-archetype dispatch (bossModel.js buildBoss): the Twin-Wraith builder
    // (bossEitherwing.js) — BOSS-DESIGN.md §5b registry slot 5, the roster's ONLY
    // multi-body silhouette: TWO mirrored dart-wraiths orbiting a SHARED EMBER —
    // one eye passed between them (the charge tell). Distinct from every prior
    // slot: not a mask (1), a ring-eye (2), a raptor (3), or a bone dragon (4).
    archetype: 'eitherwing',
    // LANCE anatomy (PR3 + PR4a): the shared EYE plus TWO organs on the SEEKER twin
    // — the slot-4 teach (MARROWCOIL's ribs) makes multi-organ the floor from here on
    // (owner ruling; a single-organ slot 5 read as regression). The twins' dart
    // BODIES are never lockable (LAW §II.9 — these are organs/wounds, not hulls):
    //   eyeRig     — the handed-off eye (slow thread midpoint; the EASY primary —
    //                the smoothed anchor L177 carries the brand across the handoff)
    //   seekerFin  — the scarred twin's crescent fin (empty marker; rides the orbit)
    //   seekerScar — its snapped-tail scar chain (empty marker on the mid pivot)
    // The seeker organs ride the twin's lemniscate (~3–6 u/s with turnarounds) —
    // DELIBERATELY harder targets than the teach ribs, caught at the reversals
    // (the T1.10a-proven shape); cones stay untouched (principle-5). Cap 3 at
    // tier 2 ⇒ eye + fin + scar = the full set. All markers are byte-neutral
    // metadata (empty Object3Ds / names) — model + tricount unchanged.
    lockParts: [{ part: 'eyeRig' }, { part: 'seekerFin' }, { part: 'seekerScar' }],
    accent: 0x86200f,         // OXBLOOD — a WARM dark red (identity in the emissive rims); pushed WARM off
                              // pure blood-red (rendered hue ~9°) so NO lit pixel enters danger-magenta's
                              // reserved band (0xff2b6a≈342°, ±15° = 327–357°) on any state — the §5d/gate
                              // OXBLOOD-MAGENTA collision law (CP1 gate directive 6: 0x7a1c18 drifted to ~355°).
    glow: 0xc9c1b4,           // AGED SILVER — the rims/shield/shards read cool desaturated metal, the
                              // second palette swatch (oxblood + aged-silver, §5d), apart from the eye's white.
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'sides',    // BOTH SIDES at once (§5e new branch): the twins arrive from both flanks
    entrance: 'batonCross',   // §5j THE BATON CROSS: twins bracket the dragon, the eye crosses right→left, then scissor into the fight (falls back to the 'sides' approach if the script is absent)
    scale: 1.55,              // COLOSSUS — REACH PASS (r8): 1.35→1.55, crossing span ≈ 23u (ASHTALON-class reach)
    grazeBaitR: 4.0,          // WIDER shield graze-ring (default 3.6) — the r9 body reads big, so the
                              // fixed ring felt tight to thread; 4.0 stays ≤ grazeR (≈4.15) so it still fully skims
    hpMax: 330,               // Tier 2 band (260–330); slot-5 PEAK sits at the top (the sawtooth crest)
    // §5f DUO LAW (one per roster): complementary axes — one twin flies lane-denial
    // WALLS (movingGap/secondWave), the other aimed TEMPO (aimed/crossfire); volley
    // origins alternate sides (crossfire's ±10 flank emitters ARE the twins). ONE
    // shared hp pool + one bar (zero hit-model work — the craghold precedent). The
    // dread card fires the mirrored SIMULTANEOUS crossfire ("Both Halves at Once").
    // §5i CALL-AND-RESPONSE: the twins alternate A-B phrases; the eye handoff is the
    // baton between them (the rhythm block below authors the alternation).
    // §5i.B COLOSSI graze (C.4) — ORBIT ANNULUS: co-rotate with the figure-eight inside a
    // drawn band about the group centre; a full unbroken lap = +1 adrenaline rung + an
    // i-frame pulse. Inert until the figureEight setpiece runs; the band derives its
    // centre from the live group pose at runtime (boss.js grazeForm cluster).
    grazeForm: 'orbitAnnulus',
    setpieces: [
      { id: 'figureEight', atPhase: 1, dur: 8.0, moving: true },                // P2: the pair leaves station, laces the eight
      { id: 'figureEight', atPhase: 2, dur: 7.0, moving: true, dread: true },   // P3: desperation keeps moving (Both Halves at Once)
    ],
    // §ENG-A: crossfire fires from the two twins' LIVE lemniscate positions (not the
    // hardcoded ±10 lane posts) — the twins ARE the ±10 flank emitters (§5b slot brief),
    // so "simultaneous mirrored crossfire" finally converges from the moving bodies.
    // Resolved per-volley via partWorldPos('eitherTwinA'|'eitherTwinB'); a volley whose
    // twins are both behind the player plane (near lobe of the eight) goes silent.
    emitOrigins: { crossfire: ['eitherTwinA', 'eitherTwinB'], aimed: ['eitherMuzzle'], stream: ['eitherMuzzle'] },
    // §5b slot 5 ORGAN-BREAK reuse (ENG-EW): perfect-parry the HOLDER's amber 3× mid-
    // possession → the handoff STAGGERS and the eye DROPS to the thread midpoint (a 2.5s
    // strike window). Reuses the shared partParries ledger + staggerT window; inert otherwise.
    holderStagger: true,
    // §C.4 dread (ENG-EW): the P3 iris contracts on the twins' THREAD MIDPOINT (the named
    // threadMid empty), not the player — resolved once per volley through the ENG-B seam.
    gapAnchor: { iris: { part: 'threadMid' } },
    // Tier 2 difficulty: crossfire is the twins' signature (both flanks at once);
    // movingGap/secondWave = the lane-denial half; iris debuts in the dread phase.
    // Escalation by pattern unlock + cadence, never raw bullet count.
    phases: [
      { atFrac: 1.00, cadence: [1.5, 2.0], attacks: ['aimed', 'movingGap'] },              // P1: introduce the two axes (tempo vs wall)
      { atFrac: 0.66, cadence: [1.4, 1.8], attacks: ['crossfire', 'secondWave', 'stream'] },// P2: the eye hands off (crossfire = both sides)
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['crossfire', 'movingGap', 'iris'] },   // P3: Both Halves at Once (dread — mirrored crossfire)
    ],
    // Spell cards (§5f grammar; dread card LAST, verbatim from the §5f/§5d sheet).
    cards: [
      { id: 'eitherwing_divide', name: 'TWO HALVES — The Divide',        atFrac: 1.00, timer: 24 },
      { id: 'eitherwing_baton',  name: 'BROKEN WHOLE — Passing the Eye',  atFrac: 0.66, timer: 26 },
      { id: 'eitherwing_both',   name: 'EITHER/OR — Both Halves at Once', atFrac: 0.33, timer: 28, dread: true },
    ],
    // §5i CALL-AND-RESPONSE — the twins alternate A-B phrases; the eye handoff is
    // the baton between them (a longer phrase REST = the baton crossing). Tight
    // bimodal: quick in-phrase responses + the handoff beat. Phrases overlap ONLY
    // during the dread card, where crossfire's two-flank simultaneity delivers it.
    rhythm: {
      signature: 'call-response',
      ticket: { bpm: 108, quantize: '1/8' },   // the shared ember's pulse; the handoff lands on the beat
      phases: [
        { // P1 — the two axes trade: tempo (aimed) ↔ wall (movingGap), a long baton between.
          // Tight-clustered responses (short gap) + a distinctly LONG handoff = a crisp
          // BIMODAL fingerprint, well apart from Stormrend's crescendo ramp (rhythmprint).
          ratioBurst: 0.3,
          phrase: [
            { kind: 'sustain', attack: 'aimed',     beats: 2, gap: 0.34 },   // twin B (tempo) calls — a quick doublet
            { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.34 },   // twin A (wall) responds
          ],
          restLo: 1.75, restHi: 1.95, restDist: 'uniform',                   // the handoff (baton crossing) — the long mode
        },
        { // P2 — the eye passes faster; crossfire = both flanks; the response tightens
          ratioBurst: 0.4,
          phrase: [
            { kind: 'sustain', attack: 'crossfire',  beats: 2, gap: 0.3 },
            { kind: 'sustain', attack: 'secondWave', beats: 1, gap: 0.3 },
            { kind: 'sustain', attack: 'stream',     beats: 1, gap: 0.3 },   // the amber-tipped tracking half
          ],
          restLo: 1.6, restHi: 1.8, restDist: 'uniform',
        },
        { // P3 — Both Halves at Once: the response phrases nearly touch (the overlap read)
          ratioBurst: 0.5,
          phrase: [
            { kind: 'sustain', attack: 'crossfire', beats: 2, gap: 0.26 },
            { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.26 },
            { kind: 'sustain', attack: 'iris',      beats: 1, gap: 0.26 },
          ],
          restLo: 1.45, restHi: 1.65, restDist: 'uniform',
        },
      ],
    },
  },
  hollowgate: {
    id: 'hollowgate',
    name: 'HOLLOWGATE',
    title: 'the Sky Threshold',
    epithet: 'The Door That Prays',   // the lore gap: a door to WHERE? its bells answer slot 10
    tier: 3,                          // CALAMITY (§5b band 3), slot-6 opener — spectacle-forward
    hpMax: 360,                       // Tier 3 band (360–450); the opener sits at the floor (sawtooth)
    // Boss-archetype dispatch (bossModel.js buildBoss): the Ruined-Arch builder
    // (bossHollowgate.js) — BOSS-DESIGN.md §5b registry slot 6, the roster's only
    // RECTILINEAR silhouette: architecture with a void. A floating ruined archway
    // holding station dead AHEAD (you fly THROUGH it); the rose window in its
    // lintel is the face — which panes glow is the mood. Distinct from every
    // prior slot: not a mask (1), a ring-eye (2), a raptor (3), a skeleton (4),
    // or twin darts (5).
    archetype: 'hollowgate',
    muzzle: 'roseHub',        // aimed/head-origin patterns emit from the window hub (emitter = organ, L148)
    // LANCE tier-3 anatomy (PR6 — cap 5, stacking unlocks): the rose window IS
    // the lock anatomy. The hub is the V1 anchor (L183-promotes into paintables)
    // and five LOWER/SIDE panes are brands — the top wedge sits at world y≈24,
    // past the flight ceiling (22), so the ceiling-adjacent picks keep every
    // acquire reachable. The LANCE play here: rise OUT of the fly-through gap
    // to the top of the frame. Destroyed panes leave the paintable set (the
    // PR6 liveness filter) and any brand on them is dropped — no corpse marks.
    virtualLockOrgan: 'roseHub',
    lockParts: [
      { part: 'rosePane1' }, { part: 'rosePane2' }, { part: 'rosePane3' },
      { part: 'rosePane5' }, { part: 'rosePane7' },
    ],
    accent: 0xe09a3e,         // warm STAINED-GOLD — the window's dominant hue (multi-hue is legal
                              // ONLY inside the rose window, §5d; the warm family owns the thumbnail
                              // and sits ~35°, far clear of danger-magenta's 327–357° reserved band)
    glow: 0xf2e6c8,           // candle-ivory (shield rim / shards / backlight)
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'ahead',    // the only boss that NEVER comes to you (§5j Vigil Lights): it holds
                              // the horizon dead ahead and the RAIL closes the distance
    horizonSeed: true,        // §5e first horizon-presence boss: a fog-exempt dead-black silhouette
                              // parks at the encounter's fixed spot a full biome early (Majora's-moon
                              // pattern); the real boss takes over the same spot at warn
    entrance: 'vigilLights',  // §5j VIGIL LIGHTS (0s camera hijack — BANKED): the dead arch eases to
                              // station while the panes ignite one per beat, pooling toward your steer
                              // in DISCRETE wedge-steps (continuous tracking is slot 14's claim)
    scale: 1.9,               // CALAMITY presence: arch ~21 world units wide, gap ~9.9 (fly-through law)
    // VALUE-INVERSION sanction (§5b slot 6 / §7b): near-white ivory stone is the
    // registry's claimed identity axis (ivory·stained-glass, VALUE-INVERTED), so
    // the gate's dark-body law (G2) inverts for this def — assert a BRIGHT body
    // (median luma ≥150) with a dark edge-cage sample. Sanctioned by the §5b row.
    gate: { pale: true },
    // §5f DESTRUCTIBLE SUB-PARTS (the CAVE-law hero): the 8 rose panes are
    // individually breakable — parry a pane's amber radial 3× (PANE BREAK, the
    // registry parry job) or land shots on the glass, and that pane cracks: its
    // radial arm is deleted from the composite (visual + pattern). boss.js
    // routes the bossDamage part/x-y payload; the model owns crackPane().
    destructiblePanes: true,
    // §5i.B Calamities graze debut: RIDE-THE-BEAM-EDGE — per-frame graze ticks
    // that RAMP with unbroken contact along the pane radials (the beam IS a
    // pane's radial; anatomy, not an abstract zone). Def-gated: shipped bosses
    // never tick (the continuous detector lands with this slot).
    grazeForm: 'beamEdge',
    // §5e moving-station setpieces. P2 = the ARCH PASS (the SIGNATURE fly-through,
    // L141: rel sweeps 30 → −8 → back with the gap surrounding the rail — the
    // door forced open, panes welcoming). P4 = ROSE JUDGMENT (dread): the arch
    // holds close, the portcullis closes, all 8 panes blaze + fire radially.
    setpieces: [
      { id: 'archPass',     atPhase: 1, dur: 7.0, moving: true },
      { id: 'roseJudgment', atPhase: 3, dur: 6.5, moving: true, dread: true },
    ],
    // Tier 3 difficulty: the portcullis walls (curtain/movingGap) are the door's
    // signature; spiral/iris re-read as radial pane-fire off the rose window.
    // Escalation by pattern unlock + cadence (floor 1.2), never raw bullet count.
    phases: [
      { atFrac: 1.00, cadence: [1.4, 1.9], attacks: ['aimed', 'fan'] },                       // P1: the door murmurs (verse)
      { atFrac: 0.72, cadence: [1.3, 1.8], attacks: ['curtain', 'movingGap', 'aimed'] },       // P2: the portcullis choir (chorus walls)
      { atFrac: 0.45, cadence: [1.25, 1.7], attacks: ['spiral', 'stream', 'fan'] },            // P3: radial pane-fire procession
      { atFrac: 0.20, cadence: [1.2, 1.6], attacks: ['spiralStream', 'curtain', 'iris', 'stream'] },  // P4: Rose Judgment (dread)
    ],
    // Spell cards (§5f grammar; 4 cards — the Calamities band's move-set floor
    // (§5g); dread card LAST, name fixed by the §5f signature-move assignment).
    cards: [
      { id: 'hollowgate_litany',     name: 'THE DOOR — First Litany',          atFrac: 1.00, timer: 24 },
      { id: 'hollowgate_choir',      name: 'IT PRAYS — Descending Choir',      atFrac: 0.72, timer: 24 },
      { id: 'hollowgate_procession', name: 'THAT PRAYS — Stained Procession',  atFrac: 0.45, timer: 26 },
      { id: 'hollowgate_judgment',   name: 'THE DOOR PRAYS — Rose Judgment',   atFrac: 0.20, timer: 28, dread: true },
    ],
    // §5i VERSE–CHORUS (slot 6) — the Touhou nonspell/spell macro: long murmured
    // VERSES (a slow aimed litany at ~1s gaps — a pace no other boss idles at)
    // alternating with CHORUS set-pieces (tight burst walls off the portcullis),
    // separated by a BIMODAL held breath (the door inhales before it sings).
    // The verse's ~1.0s murmur gap is the fingerprint: every other roster gap
    // mass sits ≤0.7 or ≥1.3 (rhythmprint KS floor).
    rhythm: {
      signature: 'verse-chorus',
      ticket: { bpm: 66, quantize: '1/4' },   // the choir's slow beat; ignition beats share it
      phases: [
        { // P1 — verse-led: the murmured litany, one short answering chorus
          ratioBurst: 0.2,
          phrase: [
            { kind: 'sustain', attack: 'aimed', beats: 4, gap: [0.95, 1.1] },
            { kind: 'burst',   attack: 'fan',   count: 2, gap: 0.28 },
          ],
          restLo: 2.6, restHi: 3.6, restDist: 'bimodal',
        },
        { // P2 — the chorus grows walls: verse, then the portcullis slams
          ratioBurst: 0.45,
          phrase: [
            { kind: 'sustain', attack: 'aimed',     beats: 3, gap: [0.9, 1.05] },
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.3 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.3 },
          ],
          restLo: 2.4, restHi: 3.3, restDist: 'bimodal',
        },
        { // P3 — the stained procession: radial bursts inside the verse
          ratioBurst: 0.5,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [0.85, 1.0] },
            { kind: 'burst',   attack: 'spiral', count: 3, gap: 0.24 },
            { kind: 'sustain', attack: 'fan',    beats: 1, gap: 0.95 },
          ],
          restLo: 2.2, restHi: 3.1, restDist: 'bimodal',
        },
        { // P4 — Rose Judgment (dread): chorus-led, the verse reduced to a last
          // murmured line (the `stream` sustain doubles as the AMBER carrier)
          ratioBurst: 0.65,
          phrase: [
            { kind: 'burst',   attack: 'spiralStream', count: 3, gap: 0.22 },
            { kind: 'burst',   attack: 'curtain',      count: 2, gap: 0.26 },
            { kind: 'sustain', attack: 'stream',       beats: 3, gap: 0.85 },
            { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.26 },
          ],
          restLo: 2.0, restHi: 2.9, restDist: 'bimodal',
        },
      ],
    },
  },
  brineholm: {
    id: 'brineholm',
    name: 'BRINEHOLM',
    title: 'the Bound Leviathan',
    epithet: 'The Island That Breathes',   // lore gap: bound by the SAME chain-maker as the hunter (ASHTALON) — point, never answer
    tier: 3,                          // CALAMITY (§5b band 3), slot 8 — the band's RELIEF texture (a breather after THRUMSWARM)
    hpMax: 410,                       // Tier 3 band (360–450); sits mid-band (opener HOLLOWGATE 360; the sawtooth)
    // Boss-archetype dispatch (bossModel.js buildBoss): the Bound-Leviathan
    // builder (bossBrineholm.js) — BOSS-DESIGN.md §5b registry slot 8: a
    // bottom-anchored ridge that NEVER fully fits the frame (the SotC
    // first-colossus scale read). Only a whale-back ridge, four fin-sails, and one
    // surfacing arena-sized EYE break the frame. Distinct from every prior slot:
    // not a mask (1), ring-eye (2), raptor (3), skeleton (4), twin darts (5),
    // arch (6), or swarm (7) — a horizon-anchored leviathan.
    archetype: 'brineholm',
    muzzle: 'brineMaw',       // the beast EXHALES its volleys/geysers from the MAW (emitter = organ, L148)
    accent: 0x3ad0b0,         // ABALONE sea-green — the iridescent banding's dominant tone (the identity hue).
                              // Sits ~168° — clear of danger-magenta's 327–357° reserved band AND of pure
                              // reflected-cyan (~185°+); the near-black hull + white eye complete the read
    glow: 0xbfe6dd,           // pale abalone-white (shield rim / shards / eye backlight)
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'below',    // §5e below-horizon rise: the hull INHALES up through the fog floor
    startDepth: -14,          // §5d: the rise starts deepened at y≈−14 (the engine reads this per-def; lands CP2)
    entrance: 'reefWasBreathing',  // §5j THE REEF WAS BREATHING (hijack ≤3s): the crest teases at WARN behind a
                              // scoped sub-rig exemption, then the 24-unit hull inhales up with the canon
                              // HESITATION hold; the eye stays submerged (a pale glow) until the iris LOCKS at settle
    scale: 1.5,               // CALAMITY "never fits the frame": hull ~36 world units — EXCEEDS the ~34-wide
                              // portrait envelope at rel 30 (its scale IS being partly off-screen, L140/L141)
    // LANCE tier-3 anatomy (PR6): the eye + the three shackle posts — the clean
    // cap-5 spread (eye ×2 stack + 3 shackles = 5). The eye only paints while
    // UP (eyeWeakPoint already feeds lockDeflected — sealed honesty for free);
    // shackles gate OUT of P4 (the sounding — the head submerges and freed
    // posts should not re-offer). A freed shackle leaves the paintable set via
    // the PR6 liveness filter and its brand is dropped. Outer posts sit LATERAL
    // (world x ±~6.75) — a real side reach, but pulled in from the ±13 lane wall
    // so branding them is a commit, not a crash-and-die.
    lockParts: [
      { part: 'eyeRig' },
      { part: 'shacklePost0', phases: [0, 1, 2] },
      { part: 'shacklePost1', phases: [0, 1, 2] },
      { part: 'shacklePost2', phases: [0, 1, 2] },
    ],
    // §BOSS-FEEL-AUDIT: a bottom-anchored ISLAND shouldn't strafe ±5. The default station sway
    // swung the outer shackle (world ±6.75) out to ±11.75 — 1.25m from the instant-kill wall
    // (±13) — forcing the player INTO the wall to reach the FLY-based lock cone (a prior fix
    // pulled the posts in but computed margin at sway-zero). Calm the hull: worst outer swing
    // ±8.35 → ≥4.65m true wall margin. Idle motion still reads from the model's own breathing.
    holdSway: { amp: 1.6, freq: 0.5 },
    // §BOSS-FEEL-AUDIT: give the registry's SHACKLE-BREAK parry job remote reach (ENG-A-R) —
    // roll-directed parries snap to the post you lean toward, so freeing a shackle works from
    // lane-safe centre instead of only by flying in to paint it (which sat against the wall).
    reflectTargets: ['shacklePost0', 'shacklePost1', 'shacklePost2', 'eyeRig'],
    eyeWeakPoint: true,       // §5f law 5 (the turn-taking tell): CHIP DAMAGE ONLY LANDS WHILE THE EYE IS UP —
                              // the surfacing/submerging is the weak-point window (controller gates it CP2;
                              // the model owns eyeIsUp()/setEyeUp() and the unmistakable lid/glow animation)
    eyeOrgan: 'eyeRig',       // the paintable lockPart the eye-weak-point seals: while the eye is DOWN it
                              // leaves the paintable set (the shackles stay brandable), rejoining when it surfaces
                              // (owner playtest — "while the eye's down I can't tag the shackles either")
    // §5f DESTRUCTIBLE SUB-PARTS (the CAVE-law mercy mechanic): the 3 shackle
    // posts are individually breakable — parry a post's amber strain-volley 3×
    // (SHACKLE BREAK, the registry parry job) or land shots on it, and it SNAPS:
    // it vents a 2× pink SPRAY-SOAK graze beat and each post freed EARLY softens
    // phase 3 (mercy as a mechanic). Reuses slot 6's per-part hit test; boss.js
    // routes the bossDamage part/x-y payload; the model owns crackShackle().
    destructibleShackles: true,
    // §5i.B Calamities graze debut: SHADOW-RIDE + SPRAY-SOAK — ride the whale's
    // lee (its shadow) vs the geysers; a freed shackle vents a 2×-value pink spray
    // for one beat before hardening lethal (anatomy: the lee is the body's shadow,
    // the spray is the shackle venting). Def-gated (the continuous detector, slot 6).
    grazeForm: 'shadowRide',
    // §5e below-frame setpiece — SOUNDING (dread, P4): the head DIVES below the
    // frame and the arena floor erupts in geyser curtains from below (the P4
    // patterns keep firing — a MOVING setpiece). The below-frame counterpart to
    // ASHTALON's stoop-from-above; the model dread-submerges on top (setSetpiece
    // k,{dread}). Landed CP2: the `sounding` SETPIECE_PATHS dive drives the pose.
    setpieces: [
      { id: 'sounding', atPhase: 3, dur: 7.5, moving: true, dread: true },   // P4 THE ISLAND BREATHES — Sounding
    ],
    // Tier 3 difficulty: the erupting `geyser` walls (the floor's bottom-up spouts) are
    // the tide's signature; the slow tracking `stream` is the drone's sustained hose (the
    // amber carrier). Escalation by pattern unlock + cadence (floor 1.2), never
    // raw bullet count. BRINEHOLM idles SLOWER than any boss (the drone).
    phases: [
      { atFrac: 1.00, cadence: [1.6, 2.2], attacks: ['stream', 'aimed'] },                    // P1: the drone wakes (one long tide)
      { atFrac: 0.72, cadence: [1.5, 2.0], attacks: ['stream', 'tunnel', 'aimed'] },           // P2: the tide grows walls (rising geyser rings)
      { atFrac: 0.45, cadence: [1.4, 1.9], attacks: ['stream', 'geyser', 'fan'] },             // P3: first spouts — GEYSER debuts (teach-before-test at the slow tidal pulse); `fan` is the shackle amber
      { atFrac: 0.20, cadence: [1.3, 1.7], attacks: ['geyser', 'iris', 'stream'] },            // P4: Sounding (dread — the floor FINALLY erupts) — `geyser` leads; `curtain`/`spiralStream` leave the def (kills the 6≡8 dread-multiset collision); `stream` carries the amber
    ],
    // Spell cards (§5f grammar; 4 cards — the Calamities band's move-set floor
    // (§5g); dread card LAST, name fixed by the §5f signature-move assignment).
    cards: [
      { id: 'brineholm_swell',    name: 'THE ISLAND — First Swell',       atFrac: 1.00, timer: 24 },
      { id: 'brineholm_drone',    name: 'IT BREATHES — Tidal Drone',      atFrac: 0.72, timer: 24 },
      { id: 'brineholm_bound',    name: 'THE BOUND — Straining Chains',   atFrac: 0.45, timer: 26 },
      { id: 'brineholm_sounding', name: 'THE ISLAND BREATHES — Sounding', atFrac: 0.20, timer: 28, dread: true },
    ],
    // §5i TIDAL DRONE (slot 8) — sustain-only, the SLOWEST pulse in the roster:
    // long sustained tides (the drone's hose) whose gaps NEVER drop below ~1.4s
    // (every other roster boss idles with sub-1s gaps — the rhythmprint KS
    // fingerprint), separated by a long BREATH (the authored rest, §5i rest-beat
    // law — DECAYING: the swell peaks then eases, an exhale). The band's RELIEF
    // texture — a breather after THRUMSWARM's pressure ostinato.
    rhythm: {
      signature: 'tidal-drone',
      ticket: { bpm: 44, quantize: '1/2' },   // the slowest pulse — a half-note tide
      phases: [
        { // P1 — the drone wakes: one long sustained tide, then a long breath
          ratioBurst: 0.0,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [1.7, 2.2] },
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: 1.8 },
          ],
          restLo: 3.6, restHi: 5.4, restDist: 'decaying',   // the exhale (the slowest rest in the roster)
        },
        { // P2 — the tide grows walls: the drone + a rising geyser ring
          ratioBurst: 0.15,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [1.6, 2.0] },
            { kind: 'burst',   attack: 'tunnel', count: 2, gap: 0.5 },
          ],
          restLo: 3.4, restHi: 5.0, restDist: 'decaying',
        },
        { // P3 — the bound strains: the tide + contracting rings; `fan` = the shackle amber
          ratioBurst: 0.2,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [1.5, 1.9] },
            { kind: 'burst',   attack: 'geyser', count: 2, gap: 0.5 },   // GEYSER teach: plume-read at swell pace (was iris; count/gap unchanged → rhythmprint byte-identical)
            { kind: 'sustain', attack: 'fan',    beats: 1, gap: 1.6 },
          ],
          restLo: 3.2, restHi: 4.8, restDist: 'decaying',
        },
        { // P4 — Sounding (dread): the floor erupts; the tide reduced to a last swell
          // (the `stream` sustain doubles as the AMBER carrier under the geysers)
          ratioBurst: 0.4,
          phrase: [
            { kind: 'burst',   attack: 'geyser',       count: 2, gap: 0.45 },   // the floor erupts (was curtain; timing unchanged → rhythmprint byte-identical)
            { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.45 },
            { kind: 'sustain', attack: 'stream',       beats: 2, gap: 1.4 },
            { kind: 'burst',   attack: 'geyser',       count: 2, gap: 0.4 },     // a second spout wave (was spiralStream; timing unchanged)
          ],
          restLo: 2.8, restHi: 4.4, restDist: 'decaying',
        },
      ],
    },
  },
  thrumswarm: {
    id: 'thrumswarm',
    name: 'THRUMSWARM',
    title: 'the Murmuring Choir',
    epithet: 'A Thousand That Remember Being One',   // the lore gap: one WHAT? a faint violet dust ties it to Voidmaw's remains
    tier: 3,                          // CALAMITY (§5b band 3), slot-7 — the pale-swarm after slot 6's pale arch
    hpMax: 380,                       // Tier 3 band (360–450); opens gentler than the slot-9 peak, grander in spectacle
    // Boss-archetype dispatch (bossModel.js buildBoss): the Swarm builder
    // (bossThrumswarm.js) — BOSS-DESIGN.md §5b registry slot 7, the roster's only
    // SWARM: a stippled field of dark motes around a bright QUEEN that CONDENSES
    // into authored shapes — including a giant copy of the player's OWN dragon
    // (the meme frame). Distinct from every prior slot: not a mask (1), ring-eye
    // (2), raptor (3), skeleton (4), twin darts (5), or an arch (6).
    archetype: 'thrumswarm',
    muzzle: 'queenGroup',     // aimed/amber patterns emit from the queen (emitter = organ, L148); the amber eye is the carrier
    // LANCE tier-3 anatomy (PR6): deliberately a ONE-ORGAN lock fight — the
    // queen is the only solid body in a cloud of shared-name motes, so cap 5
    // never fills here (queen ×2 stack ≈ 2 pips); THRUMSWARM's verb is the
    // scatter-stagger PARRY, and painting stays a side-dish. The scatter state
    // already pauses painting via lockDeflected (condenseInvuln). During the
    // SPEAR formation the queen parks off-arena (x≈15.6 > lane 13) — the lock
    // drops and re-acquires on settle; transient by design, cones untouched.
    lockParts: [{ part: 'queenGroup' }],
    accent: 0xffa838,         // AMBER — the queen's ONE eye (the focal AND the amber-carrier organ, §5i.C). The
                              // registry palette claim is value (void-black·star-white); amber is the small focal
                              // accent (≈37°, far clear of danger-magenta's 327–357° reserved band). Row updated.
    glow: 0xdfe4ff,           // STAR-WHITE cool (shield rim / shards / lantern backlight) — the value identity
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'condense',  // §5j new branch: the unlit motes converge from AHEAD and click into the copy
    entrance: 'shapeItRemembers', // §5j THE SHAPE IT REMEMBERS (hijack 2.8s @0.24×): the swarm condenses into
                              // YOU and the copy's head performs a glance-back (falls back to the plain approach if absent)
    scale: 1.2,               // CALAMITY presence: the YOUR-DRAGON copy spans ~32 world units (GIANT, fills the frame; L140/L141)
    // §5f dread card is the swarm becoming your dragon on your recorded path
    // ("A THOUSAND — Your Own Wings"). Chip damage ONLY lands while the swarm is
    // CONDENSED (scattered = invulnerable — the turn-taking tell, §5f law 5); the
    // condense/scatter cycle is the puzzle read. (CP2 wires the invuln gate + the
    // input/pose ring buffer that replays the player's own flight path.)
    condenseInvuln: true,
    // §5i.B Calamities graze debut: ABSORB-A-COLOR — the swarm sheds surge-pink
    // motes braided into the magenta stream; the player weaves in and SOAKS them
    // (feeds the Surge meter). ANATOMY: the pink motes are shed by the swarm body.
    // Def-gated (uses slot 6's continuous-graze detector); shipped bosses inert.
    grazeForm: 'absorbColor',
    // §5e moving-station setpieces: CONDENSE PASS (P2 — the swarm sweeps the lane
    // condensing to fire) and YOUR OWN WINGS (P4 dread — the copy flies the player's
    // RECORDED flight path back at them via the §5e input/pose ring buffer; the §5f
    // rule-break, boss-side mirroring that never touches input). Both moving (fire
    // while they travel).
    setpieces: [
      { id: 'condensePass', atPhase: 1, dur: 7.0, moving: true },
      { id: 'yourWings',    atPhase: 3, dur: 8.0, moving: true, dread: true },
    ],
    // Tier 3 difficulty: the swarm's condensations ARE the patterns — ring/wall
    // formations fire radial/curtain volleys; the queen's amber eye aims the amber
    // carrier. Escalation by pattern unlock + cadence (floor 1.2), never raw count.
    phases: [
      { atFrac: 1.00, cadence: [1.2, 1.6], attacks: ['aimed', 'fan'] },                         // P1: the murmur (loose swarm, aimed amber from the eye)
      { atFrac: 0.70, cadence: [1.2, 1.5], attacks: ['spiral', 'stream', 'aimed'] },            // P2: the ring condenses — radial fire (§B-3: lower bound lifted to the 1.2 Calamities floor)
      { atFrac: 0.42, cadence: [1.2, 1.45], attacks: ['curtain', 'movingGap', 'fan'] },         // P3: the wall condenses — lane denial (§B-3: lower bound → 1.2 floor)
      { atFrac: 0.18, cadence: [1.2, 1.4], attacks: ['spiralStream', 'crossfire', 'stream', 'iris'] }, // P4: Your Own Wings (dread) — (§B-3: lower bound → 1.2 floor; cadence is FALLBACK only — the PRESSURE-OSTINATO phrase drives live pacing, so this is a def-consistency fix, not a difficulty change)
    ],
    // Spell cards (§5f grammar; 4 cards — the Calamities band floor (§5g); dread
    // card LAST, name fixed by the §5f signature-move assignment). Naming grammar:
    // "<EPITHET FRAGMENT> — <plain pattern>".
    cards: [
      { id: 'thrumswarm_murmur', name: 'REMEMBER — First Murmur',       atFrac: 1.00, timer: 24 },
      { id: 'thrumswarm_ring',   name: 'THAT REMEMBER — Ring of Motes', atFrac: 0.70, timer: 24 },
      { id: 'thrumswarm_wall',   name: 'BEING ONE — Condensing Wall',   atFrac: 0.42, timer: 26 },
      { id: 'thrumswarm_wings',  name: 'A THOUSAND — Your Own Wings',   atFrac: 0.18, timer: 28, dread: true },
    ],
    // §5i PRESSURE OSTINATO (slot 7) — NO true rests; the micro-pauses live INSIDE
    // the swarm's condensation cycle (a tight, relentless dense pulse). Every gap
    // sits low (≤0.6) and the "rest" is barely longer than a gap (0.5–0.85) — a
    // low tight cluster no other boss's distribution makes (every shipped boss's
    // gap mass has a long tail or a bimodal breath; rhythmprint KS floor ≥0.34).
    rhythm: {
      signature: 'pressure-ostinato',
      ticket: { bpm: 132, quantize: '1/8' },   // the swarm's fast thrum; condensations land on the beat
      phases: [
        { // P1 — the murmur: a steady dense pulse, the eye's aimed amber woven in
          ratioBurst: 0.5,
          phrase: [
            { kind: 'sustain', attack: 'aimed', beats: 3, gap: 0.42 },
            { kind: 'burst',   attack: 'fan',   count: 2, gap: 0.3 },
          ],
          restLo: 0.6, restHi: 0.85, restDist: 'uniform',   // no breath — the pressure never lifts
        },
        { // P2 — the ring: radial streams inside the ostinato
          ratioBurst: 0.55,
          phrase: [
            { kind: 'burst',   attack: 'spiral', count: 3, gap: 0.26 },
            { kind: 'sustain', attack: 'stream', beats: 2, gap: 0.4 },
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: 0.4 },
          ],
          restLo: 0.55, restHi: 0.8, restDist: 'uniform',
        },
        { // P3 — the wall: tight curtain bursts, the pauses still inside the cycle
          ratioBurst: 0.6,
          phrase: [
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.28 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.28 },
            { kind: 'burst',   attack: 'fan',       count: 2, gap: 0.28 },
          ],
          restLo: 0.5, restHi: 0.75, restDist: 'uniform',
        },
        { // P4 — Your Own Wings (dread): densest, crossfire from the wing motes
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'spiralStream', count: 3, gap: 0.24 },
            { kind: 'burst',   attack: 'crossfire',    count: 2, gap: 0.24 },
            { kind: 'sustain', attack: 'stream',       beats: 2, gap: 0.36 },
            { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.24 },
          ],
          restLo: 0.5, restHi: 0.72, restDist: 'uniform',
        },
      ],
    },
  },
  weftwitch: {
    id: 'weftwitch',
    name: 'WEFTWITCH',
    title: 'the Mender',
    epithet: 'She Mends What You Break',   // §5f; lore gap: the one tear she can't mend → slot 14's entry wound
    tier: 4,                          // WORLD-ENDER band (§5b band 4), slot 11 — the arena-weaver
    hpMax: 520,                       // WE band (480–560); mid-band (not the opener/peak — the §5b sawtooth)
    // Boss-archetype dispatch (bossModel.js buildBoss): the Weaver builder
    // (bossWeftwitch.js) — BOSS-DESIGN.md §5b registry slot 11: a hooded, legless
    // weaver-bust at the hub of an arena-spanning web (the FIELD is the body, L141).
    // Distinct from every prior slot AND from the also-hooded KARNVOW (slot 9): a
    // legless bust CROWNED by an upward fan of 6 spinneret-arms + a spoke-web — no
    // single dominant diagonal (KARNVOW is a lance). The pre-build Fable gate moved
    // the arms ABOVE the shoulder line (no limb below horizontal) to kill the spider
    // read; that rule is inviolable (§3b sheet in BOSS-DESIGN.md §5d).
    archetype: 'weftwitch',
    muzzle: 'loomHeart',      // she emits from the loom-heart at the hub (emitter = organ, §5f law 7 / L148)
    // LANCE (§5i rung 11 — the arena-weaver joins the endgame ladder; docs/lance-
    // progression-redesign.md §3). V1 aim anchor = the loom-heart (the karnvow lesson,
    // PR #258: lockCandidates() returns only lockParts + virtualLockOrgan; the organ IS
    // the anchor, ashtalon muzzle-as-anchor precedent — always emitting, always under
    // fire, never a free rest-beat paint). V2 paint targets = her two weaving HANDS
    // (`palmL`/`palmR` — her §4b face AND her weapons, emitter=organ). The web-arm scar
    // is NOT a lock organ: the anti-spider "no limb below horizontal" law puts the whole
    // crown above laneMaxY 22 (weftScar world y ~24) — unaimable (§CP1 pre-audit; the
    // PR2a reachability LAW). loomHeart(virtual) + 2 palms = 3 targets × stackMax 2 = 6 =
    // tier cap (the KNELLGRAVE shape). The 'volley tears / she mends' rule + V4 parry-snap
    // ride a follow-up increment (each behind its own critic gate).
    virtualLockOrgan: 'loomHeart',
    lockParts: [{ part: 'palmL' }, { part: 'palmR' }],
    accent: 0xe8c466,         // WARM PALE-GOLD woven-thread (Decision C — pushed OFF the WE rose-triple). Hue ≈43°,
                              // far clear of danger-magenta's 327–357° reserved band; saturated enough to HOLD its
                              // hue under bloom (bossgate G3 attribution — a paler gold washed to white). Resolves
                              // the 11/12/13 rose collision (11 = gold/white LINES on grey · 12 = near-black rose
                              // trace · 13 = bright rose field). The HDR laserLance flash uses the same family (G3-safe).
    glow: 0xf2e2b0,          // moon-white-gold (shield rim / shards / loom-heart backlight)
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'above',    // SHIPPED branch (audit #35 — do NOT re-implement): she descends on a single thread
    startDepth: 26,           // §5d: the descent starts high (y≈+26) — she lowers to station on one thread
    entrance: 'mendedBanner', // §5j scripted arrival (CP2): the thread-descent + the banner lash (entranceScripts.js)
    // §5b GRANTED RULE-BREAK (registry row 11: "re-weaves the arena — even the HUD
    // chrome"): golden threads stitch across the HUD ONCE at her entrance and the
    // warn banner is cross-stitched + PINNED half-deployed until enterFight tears
    // it free. RENDER-ORDER LAW: fired only in the bullet-free warn window,
    // cleared before the first bullet can exist (boss.js owns both edges).
    hudSew: true,
    scale: 1.3,               // medium bust — presence is the WEB, not the body mass (L141); TUNE in studio
    // §COMFORT (owner playtest: "the hand locks are WAY too close to the border"): she has no
    // holdSway override, so she rode the roster-DEFAULT ±5.0 station strafe (boss.js:2522) — a
    // dominant term throwing her ±HAND_X palms toward the ±13 kill wall. A LOOM is anchored to its
    // web (off-screen arena anchors); it shouldn't strafe (the BRINEHOLM "an island shouldn't
    // strafe" precedent). Calm the strafe AND the idle yaw-wobble (idleWobble) — the wobble projects
    // her far-forward hands (HAND_Z 4.6) ~±0.7 world toward the wall. Together these keep the palms
    // inside the 10.4 comfort band at the chase-equilibrium worst case. Idle life stays on bustPivot bob.
    holdSway: { amp: 0.5, freq: 0.5 },
    idleWobble: 0.3,          // calm the ±0.12 placeGroup yaw wobble to ±0.036 (anchored loom, not a flying dragon)
    // §5i CANCEL-CONVERT MOTE HARVEST: a cut thread blooms into falling surge-motes;
    // steer the bloom to harvest (offered once per phase). Def-gated (reuses slot 6's
    // continuous-graze detector); shipped bosses inert.
    grazeForm: 'moteHarvest',
    // §5i.C THREAD-CUT (registry row 11 parry cell, CP2): her 'aimed' volleys ride the
    // taut hand-thread (needle-pull wind-up + laserLance HDR beam at release + an
    // in-key stitch-pluck); parry the ambers 3× → the thread is CUT — the woven
    // volley UNRAVELS (in-flight ambers delete, queued sub-volleys drop) and the
    // loom is STILLED for a 2.5s strike window. Inert for every other def.
    threadCut: true,
    // Tier-4 difficulty: precision + lattice patterns re-expressed as thread-visualised
    // gaps (curtain/movingGap/aimed/crossfire = the loom's warp/weft). The `aimed`
    // carrier is the taut pre-fire thread (the amber organ) — the laserLance is a beam
    // VISUAL of an existing pattern (owner-confirmed at CP2), NOT a new attack id (the
    // WE band's ≤1-new-id budget is left for a sibling slot). Escalation by pattern
    // unlock + cadence, never raw count.
    phases: [
      { atFrac: 1.00, cadence: [1.3, 1.7], attacks: ['aimed', 'curtain'] },                          // P1: the loom wakes (a measured weave)
      { atFrac: 0.78, cadence: [1.2, 1.6], attacks: ['curtain', 'aimed', 'movingGap'] },             // P2: warp rising (lanes stitch)
      { atFrac: 0.56, cadence: [1.15, 1.5], attacks: ['movingGap', 'crossfire', 'aimed'] },          // P3: cross-stitch (the weft crosses)
      { atFrac: 0.34, cadence: [1.1, 1.45], attacks: ['crossfire', 'iris', 'stream', 'movingGap'] }, // P4: the lattice tightens
      { atFrac: 0.16, cadence: [1.05, 1.4], attacks: ['curtain', 'movingGap', 'crossfire', 'aimed'] }, // P5: SHE MENDS — Warp and Weft (dread)
    ],
    // Spell cards (§5f/§5g grammar; 5 cards — the WE band move-set; "<EPITHET
    // FRAGMENT> — <plain pattern>"; dread card LAST). The dread re-weaves the whole
    // arena in one pass: every lane stitches shut EXCEPT the one her hands never
    // touched (the anti-flee dread; its counter is reading which lane the hands AVOID
    // — a lattice read AND a graze goldmine).
    cards: [
      { id: 'weftwitch_firstthread', name: 'SHE MENDS — First Thread',        atFrac: 1.00, timer: 26 },
      { id: 'weftwitch_warprising',  name: 'WHAT YOU — Warp Rising',          atFrac: 0.78, timer: 26 },
      { id: 'weftwitch_crossstitch', name: 'YOU BREAK — Cross-Stitch',        atFrac: 0.56, timer: 28 },
      { id: 'weftwitch_lattice',     name: 'SHE MENDS — The Lattice Tightens', atFrac: 0.34, timer: 28 },
      { id: 'weftwitch_warpweft',    name: 'SHE MENDS — Warp and Weft',       atFrac: 0.16, timer: 32, dread: true },
    ],
    // §5i SYNCOPATED LOOM (slot 11) — a quantized grid whose accents land BETWEEN the
    // beats (off-beat): each measure alternates a long ON-beat sustain with tight
    // OFF-beat burst pairs, and the rest is BIMODAL (a short re-thread OR a long
    // measured breath — no other roster boss's gap mass is this two-spiked). vs slot
    // 10's MUSIC-LOCKED grid (both quantized): the OFF-BEAT ACCENTS + the bimodal
    // breath are the differentiator (rhythmprint KS ≥ 0.20). REST look (§5i rest-beat
    // law): her hands keep time SILENTLY — a visible measured weave that fires nothing,
    // never a dead pause.
    rhythm: {
      signature: 'syncopated-loom',
      ticket: { bpm: 96, quantize: '1/8' },   // the loom's eighth-note grid; accents fall off the beat
      phases: [
        { // P1 — the loom wakes: a measured on-beat weave, off-beat curtain accents
          ratioBurst: 0.3,
          phrase: [
            { kind: 'sustain', attack: 'aimed',   beats: 2, gap: 0.9 },
            { kind: 'burst',   attack: 'curtain', count: 2, gap: 0.55 },
          ],
          restLo: 1.5, restHi: 2.7, restDist: 'bimodal',   // a short re-thread OR a long measured breath
        },
        { // P2 — warp rising: the weave + stitching lanes, still syncopated
          ratioBurst: 0.4,
          phrase: [
            { kind: 'sustain', attack: 'aimed',     beats: 2, gap: 0.85 },
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.5 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.5 },
          ],
          restLo: 1.4, restHi: 2.5, restDist: 'bimodal',
        },
        { // P3 — cross-stitch: the weft crosses the warp; off-beat crossfire accents
          ratioBurst: 0.5,
          phrase: [
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.5 },
            { kind: 'sustain', attack: 'aimed',     beats: 2, gap: 0.8 },
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.55 },
          ],
          restLo: 1.3, restHi: 2.4, restDist: 'bimodal',
        },
        { // P4 — the lattice tightens: denser off-beat bursts, the stream is the amber carrier
          ratioBurst: 0.6,
          phrase: [
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.5 },
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.5 },
            { kind: 'sustain', attack: 'stream',    beats: 2, gap: 0.75 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.5 },
          ],
          restLo: 1.2, restHi: 2.3, restDist: 'bimodal',
        },
        { // P5 — Warp and Weft (dread): the whole arena re-woven; tightest off-beat pass
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.45 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.45 },
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.45 },
            { kind: 'sustain', attack: 'aimed',     beats: 2, gap: 0.7 },
          ],
          restLo: 1.1, restHi: 2.2, restDist: 'bimodal',
        },
      ],
    },
  },

  knellgrave: {
    id: 'knellgrave',
    name: 'KNELLGRAVE',
    title: 'the Bound Toll',
    epithet: 'It Rings for What It Buried',   // §5f lore gap: who is bound as the clapper? (living captive — 10 vs 12's carried dead)
    tier: 4,                          // WORLD-ENDER band OPENER → sits at the band FLOOR (§5b/§5g)
    hpMax: 480,                       // WE band 480–560; the sawtooth opener sits LOW
    // Boss-archetype dispatch (bossModel.js buildBoss): the Bound Bell builder
    // (bossKnellgrave.js) — §5b registry slot 10, the roster's rhythm boss + the
    // only PENDULUM silhouette: a colossal cracked bell hanging from nothing with a
    // living BOUND FIGURE as its clapper. Distinct from every prior slot.
    archetype: 'boundBell',
    // Overhead approach ('above' → the §5j 'top' warning-banner dir): the bell fades
    // in ABOVE the frame already mid-swing (§5d/§5j It Lifts Its Head). boss.js has
    // no 'top' branch — 'above' is the overhead arrival (start.y = fightHeight+22).
    approachFrom: 'above',
    // THE OVERHEAD LOOM (§5c "the lane breaks" — the #1 grandeur lever): the bell holds
    // a RAISED station. At stationY 20 the flared lip sits at y≈22 (the frame top), the
    // bound clapper dangles into view at y≈18, and the bell BODY + chain vanish above
    // the frame — you fight looking UP into its mouth; it is never fully in frame.
    stationY: 20,
    entrance: 'itLiftsItsHead',   // §5j (falls back to the plain approach until the ENTRANCE_SCRIPTS entry lands, CP2)
    muzzle: 'bellMouth',          // the toll origin (emitter = organ, §5f law 7); aim solves against its world rel
    // LANCE (§5i rung 10 — the endgame's FIRST paintable World-Ender; docs/lance-
    // progression-redesign.md §3). V1 focal aim = the mouth WOUND (`knellWound`, the
    // one HDR focal — the lit candle-mouth the toll escapes from; placed on the
    // front-left LIP-BITE RIM, clear of the bound clapper's head, and low enough that
    // its world y stays inside the flight lane — unlike the slit centroid at ~y32 which
    // is above laneMaxY 22 and unaimable, §CP2). V2 paint targets = the two chain-BIND
    // restraints on the clapper's wrist cuffs (`knellBind{L,R}`) — you brand the
    // BINDINGS, never the honorably-unpaintable prisoner FIGURE. wound(virtual) + 2
    // binds = 3 paint targets → reaches the tier-4 cap of 6 (REACHABILITY LAW), all
    // within the flight lane. The resonant on-toll release + SCAR-BURN ride in later
    // PRs; this PR only makes the organs live (inert→capable).
    virtualLockOrgan: 'knellWound',
    lockParts: [{ part: 'knellBindL' }, { part: 'knellBindR' }],
    // PALETTE (§5b glow-shape claim = vertical candle-slit; Part 2.4 clearance):
    // candle 0xffd890 (≈39°, sat 0.44 — PALE/low-sat warm) sits clear of the parry
    // amber ROLE colour 0xffc23c (≈37°, sat 0.76) by a VALUE/SATURATION tier, not
    // hue — the amber bullets stay far more saturated (verified: bulletcontrast.mjs).
    // Body is patina-copper near-black; the candle lives in the emissive slit/rings.
    accent: 0xffd890,             // candle (the vertical-slit + toll-ring hue — the accent tier G3 reads)
    glow: 0xffe0a8,              // candle-pale (shield rim / shards) — a touch paler than the accent
    bulletColor: 0xff2b6a,        // danger magenta — the role colour (never per-boss)
    bpm: 60,                      // the toll's base pulse (§5h optional def.bpm for rhythm slots; accelerates live)
    // §5f THE MUSIC-DEATH RULE-BREAK (slot 10's granted break — spent ONCE in the
    // roster): the run's music DIES on the warn-end toll and stays dead for the whole
    // fight (skip does NOT restore it); it breathes back under the defeat fanfare /
    // resetBoss. Every volley release IS a toll: the bellToll strike + the model's
    // ring-wall fairness twin + the world-event flinch (camera tick + postfx pulse)
    // land on one beat, growing heavier as the fight ruins. Coexist: no other def
    // carries this flag; the music path is byte-identical for them.
    musicDies: true,
    scale: 1.75,                 // COLOSSAL (owner pazzazz pass): lip ≈21 world units across, ~42u chain→clapper —
                                  // bigger than BRINEHOLM's head (the Tier-3 peak, ~37.5u). Baked overhead: the body
                                  // sits above y≈22 at station, only the flared lip + chains dip into the y∈[2,22]
                                  // envelope (§5d L140/L141) — a bell the dragon could fly INTO.
    // §5i.B World-Enders graze debut: SHRINKING SAFE DISC — the toll ring-walls ARE
    // the graze anatomy; ride the shrinking safe disc through escalating ticks, bail
    // on the last beat (offered once per phase). Def-gated (slot-6 continuous detector).
    grazeForm: 'shrinkDisc',
    // §ENG-LT THE LAST TOLL REWORK (owner playtest: the survival exam under-delivered as
    // passive). REVERSES the shipped "the survival ride stays pure dodge" gate, knellgrave-only:
    // (1) ride-mode toll-wall pockets driven off the TOLL CADENCE (srel/slow is degenerate
    // overhead); (2) SURVIVAL RESOLVE — riding the rims, parrying the seal-era aimed ambers, and
    // striking the clapper fill a meter that breaks the seal EARLY + staggers the bell (a second,
    // FASTER resolution; outlasting the timer still succeeds untouched); (3) the bound clapper is
    // the seal's one weak point (rider chip, up close — no hp, feeds the meter). `setpiece` = the
    // SETPIECE_PATHS id the ride-mode graze binds to; `weakPart` = the partWorldPos node the
    // seal-era carve-out tests.
    survivalResolve: { setpiece: 'lastToll', weakPart: 'clapperHead' },
    // §ENG-C3 RHYTHM-PARRY CHAIN (§5b row 10 / §5i.C World-Ender parry DEBUT, finally real):
    // during The Second Toll the 4-amber aimed chain must be parried ON the knell's beat —
    // each on-beat parry banks; a full chain pays a chunk + a 2.5s bell stagger (the shared
    // staggerT window). On-beat = within RHYTHM_PARRY_WINDOW of the nearest MULTIPLE of the
    // live toll period (the GHOST BEAT — the 4th amber lands one stroke after the burst's last
    // toll, so the metronome extrapolates one beat; a naive nearest-toll window is unhittable).
    rhythmParry: { card: 'knellgrave_second', chain: 4 },
    // §ENG-H C.7-proper — the toll RADIATES: the spiral toll's origin (and the sweep's
    // stream hose) ride the swinging bellMouth (emitter = organ, §5f law 7). The toll-wall
    // graze arms from the bell, not the lane centre.
    emitOrigins: { spiral: ['bellMouth'], stream: ['bellMouth'] },
    // §ENG-B/§ENG-H BOB-LOCK: during the Pendulum Sweep the movingGap safe lane sits
    // OPPOSITE the bell (mirror, not tracker — read the bell, not the wall). scale −0.36
    // maps the mouth's full worst-case envelope (±~24) inside movingGap's ±9 clamp so the
    // mirror stays honest across the whole arc (the clamp never silently bites). Card-gated
    // to the sweep phase; card down → the shipped player-seeded slide returns.
    gapAnchor: { movingGap: { card: 'knellgrave_sweep', part: 'bellMouth', scale: -0.36 } },
    // §5e THE LAST TOLL setpiece (P4, dread+survival — the mid-fight clapper reveal,
    // the audit's named "awe fix"): the bell swings down + forward until it hangs
    // DIRECTLY OVERHEAD (rel≈3, the mouth above your head, the prisoner straining in
    // the gaping crack seen from beneath), rides there through the accelerating tolls,
    // then hauls back. moving: the survival tolls keep firing. §ENG-LT made the exam
    // ACTIVE: the seal deflects chip, but riding the ride-mode toll walls + parrying the
    // seal-era ambers + striking the bound clapper fill a RESOLVE meter that breaks the
    // seal early + staggers the bell (outlasting the timer still succeeds untouched).
    setpieces: [
      { id: 'pendulumSweep', atPhase: 3, dur: 14, moving: true },              // §ENG-H P4: the bell SWINGS across the lane (no dread flag — the swing-widen is the model's sweepK hook, not skyOpen)
      { id: 'lastToll',      atPhase: 4, dur: 26, moving: true, dread: true },  // atPhase 3 → 4 (the Last Toll ride follows its phase into P5)
    ],
    // §7b PRESENCE override (sanctioned): KNELLGRAVE "owns the space ABOVE" (§5b/§5c
    // WORLD-ENDERS) — a colossal overhead hanging bell. A bell's mass IS its wide
    // flared MOUTH, so the silhouette is legitimately bottom-heavy; and in-game the
    // body sits above y≈22 (only the lip + shackle-chains dip into frame). The default
    // G4 comY box assumes a centred boss — this override relaxes the ceiling for the
    // overhead read (coverage/comX gates still hold). The true overhead dominance is
    // judged IN-GAME (the CP2 Fable integration gate), not the auto-framed studio.
    gate: { presence: { comYMax: 0.82 } },
    // Phases — MUSIC-LOCKED, an ACCELERATING toll (cadence tightens 1.5→~1.0). The
    // iris ring-walls ARE the toll (the readable beat); aimed/crossfire/fan are the
    // amber carriers. ⚠ amberdiet reads THESE phase attacks (not the card seal), so
    // 'aimed' stays in EVERY phase — incl. the P4 survival card (the runtime seal is
    // pure-dodge, but the phase must still be ABLE to serve amber; §5i.C exemption).
    // §ENG-H C.7-proper: 5 phases. The TOLL is now the `spiral` ring-wall (radiating from
    // the bell); iris is gone. P3 The Cracked Peal doubles the toll (hemiola); P4 Pendulum
    // Sweep is the setpiece phase (the swung stream hose + the bob-mirrored movingGap lanes).
    phases: [
      { atFrac: 1.00, cadence: [1.4, 1.7],  attacks: ['spiral', 'aimed'] },              // P1 The First Toll — teach: the toll RADIATES; ride its rim
      { atFrac: 0.70, cadence: [1.3, 1.6],  attacks: ['spiral', 'aimed'] },              // P2 The Second Toll — RHYTHM PARRY: the aimed chain on the beat
      { atFrac: 0.55, cadence: [1.25, 1.5], attacks: ['spiral', 'aimed'] },              // P3 The Cracked Peal — double tolls (hemiola), the squeeze
      { atFrac: 0.40, cadence: [1.2, 1.45], attacks: ['spiral', 'stream', 'movingGap', 'aimed'] }, // P4 Pendulum Sweep — the setpiece phase (swung hose + mirrored lanes). §BOSS-FEEL-AUDIT: `spiral` restored so the toll-wall loop doesn't go dark for a whole phase (the bell keeps tolling as it swings)
      { atFrac: 0.25, cadence: [1.1, 1.4],  attacks: ['spiral', 'fan', 'aimed'] },       // P5 The Last Toll (survival) — 'aimed' kept for amberdiet (§5i.C)
    ],
    // Spell cards (§5f grammar; 4 cards 1:1 with phases — the card gate asserts
    // cards.length === phases.length and each card.atFrac === its phase's; dread
    // card LAST). Naming grammar "<EPITHET FRAGMENT> — <plain pattern>". The brief's
    // 4-card set is reconciled to 4 phases (the Sweep promoted to its own phase) so
    // the atFracs align. The dread card is ALSO the roster's survival card (×2 max,
    // §5f — slots 10 + 13): boss sealed, rhythm dodge; outlasting the timer resolves it
    // (no hp snap — breakShield already parked hp at this phase's atFrac floor on entry),
    // OR §ENG-LT SURVIVAL RESOLVE breaks the seal early via active play.
    cards: [
      { id: 'knellgrave_first',  name: 'IT RINGS — The First Toll',   atFrac: 1.00, timer: 24 },
      { id: 'knellgrave_second', name: 'IT RINGS — The Second Toll',  atFrac: 0.70, timer: 26 },   // the RHYTHM PARRY card: the aimed chain on the toll
      { id: 'knellgrave_peal',   name: 'IT RINGS — The Cracked Peal', atFrac: 0.55, timer: 24 },   // §ENG-H NEW — the double toll (hemiola); the second wall squeezes the rider
      { id: 'knellgrave_sweep',  name: 'IT RINGS — Pendulum Sweep',   atFrac: 0.40, timer: 26 },   // atFrac 0.45 → 0.40 (aligns to its phase); the setpiece phase
      { id: 'knellgrave_last',   name: 'IT RINGS — The Last Toll',    atFrac: 0.25, timer: 30, dread: true, survival: true },  // nine accelerating tolls; pure dodge; the clapper's FULL mid-fight reveal
    ],
    // §5i MUSIC-LOCKED (slot 10) — the toll is the ONLY clock (music is DEAD); the
    // ACCELERATING toll is the fingerprint. The iris ring-wall is the metronomic
    // pulse; the gap TIGHTENS phase to phase (1.5→~1.0) and the P4 rest decays toward
    // each of the nine tolls (the crescendo to silence). Must clear rhythmprint KS
    // ≥0.20 vs all others — the acceleration is the differentiator (vs slot 11's
    // future syncopated grid). ticket quantizes the fire to getBeatClock when live.
    rhythm: {
      signature: 'music-locked',
      ticket: { bpm: 60, quantize: '1/4' },   // the toll's beat; attacks snap to it (the silence's clock)
      phases: [
        { // P1 — The First Toll: slow, regular SPIRAL tolls (the ring-wall on the beat) + aimed amber
          ratioBurst: 0.0,
          phrase: [
            { kind: 'sustain', attack: 'spiral', beats: 2, gap: [1.4, 1.6] },
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: 1.5 },
          ],
          restLo: 1.5, restHi: 1.7, restDist: 'uniform',   // the metronomic toll — low variance, tighter than voidmaw
        },
        { // P2 — The Second Toll: the RHYTHM PARRY chain — a 4-amber AIMED burst lands ON the toll's beat
          ratioBurst: 0.4,
          phrase: [
            { kind: 'sustain', attack: 'spiral', beats: 2, gap: [1.25, 1.45] },
            { kind: 'burst',   attack: 'aimed',  count: 4, gap: [0.5, 0.62] },   // the 4–6 amber chain on the beat (§5d slot-10)
          ],
          restLo: 1.35, restHi: 1.55, restDist: 'uniform',
        },
        { // P3 — The Cracked Peal: two SPIRAL tolls a half-beat apart (the hemiola double
          // toll — the second wall squeezes the rider) + an aimed answer.
          ratioBurst: 0.5,
          phrase: [
            { kind: 'burst',   attack: 'spiral', count: 2, gap: [0.1, 0.16] },   // the double toll (§ENG-H §3d — discCd keeps the 2nd from double-arming)
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: [1.3, 1.5] },
          ],
          restLo: 1.25, restHi: 1.5, restDist: 'uniform',
        },
        { // P4 — Pendulum Sweep: the sweep bed — the swung stream hose + the bob-mirrored
          // movingGap lanes + aimed; the pattern rains from wherever the crossing carries it.
          ratioBurst: 0.2,
          phrase: [
            { kind: 'sustain', attack: 'spiral',    beats: 1, gap: [1.2, 1.45] },   // §BOSS-FEEL-AUDIT: the bell still TOLLS as it swings — the toll-wall loop no longer dies for P4
            { kind: 'sustain', attack: 'stream',    beats: 1, gap: [1.2, 1.45] },
            { kind: 'sustain', attack: 'movingGap', beats: 1, gap: [1.2, 1.45] },
            { kind: 'sustain', attack: 'aimed',     beats: 1, gap: [1.2, 1.45] },
          ],
          restLo: 1.2, restHi: 1.45, restDist: 'uniform',
        },
        { // P5 — The Last Toll (dread/survival): nine ACCELERATING spiral tolls (the rest
          // DECAYS toward each — the crescendo to silence). 'aimed' keeps the phase
          // amber-capable for amberdiet; the card SEALS it pure-dodge at runtime.
          ratioBurst: 0.35,
          phrase: [
            { kind: 'sustain', attack: 'spiral', beats: 2, gap: [0.95, 1.15] },
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: 1.05 },
          ],
          restLo: 0.9, restHi: 1.5, restDist: 'decaying',   // the toll accelerates toward the last beat
        },
      ],
    },
  },

  karnvow: {
    id: 'karnvow',
    name: 'KARNVOW',
    title: 'the Trophy-Hunter',
    epithet: 'Whatever Sent It',   // §5f lore gap: something SENT it — the epithet points, never answers
    tier: 3,                       // CALAMITY band; slot-9 is the band PEAK → hpMax/dials sit HIGH
    // Boss-archetype dispatch (bossModel.js buildBoss): the Trophy-Duelist builder
    // (bossKarnvow.js) — BOSS-DESIGN.md §5b/§5d registry slot 9, the Tier-3 band
    // PEAK. A lean HOODED DUELIST riding at your shoulder, one long lance couched
    // low, a swinging trophy chain of what it has killed; faceless but for one cold
    // guttering glint deep in the cowl void. It does NOT tower (the roster's
    // deliberate scale-DOWN) — its presence is PROXIMITY (the closest flank station)
    // + the lance+chain assembly, never bulk (§3b.6, L140/L141). Distinct from slot 1's
    // cracked-stone socket PAIR (one aperture, one glint) and slot 3's raptor cowl.
    archetype: 'trophyDuelist',
    accent: 0x5aa0d8,   // cold cowl-glint steel-blue (~207°, 40° clear of reflected-cyan) — identity + focal
    glow: 0x74b4e4,     // lighter cold steel (shield rim / shards / backlight) — the shielded state stays cold
    bulletColor: 0xff2b6a,   // danger stays magenta (role colour, never per-boss)
    approachFrom: 'side',    // rides in on the flank (the moving-station riding beat is a CP2 setpiece)
    muzzle: 'lanceTip',      // fire originates from the lance tip — the amber-emitting organ (§5f law 7)
    // LANCE V1 aim anchor (Codex review, PR #258 — verified: lockCandidates() returns
    // only lockParts + virtualLockOrgan, and karnvow had neither → the late-game
    // aim/lock verb would vanish on slot 9). The organ IS the anchor (the ashtalon
    // muzzle-as-anchor precedent — always emitting, always under fire, never a free
    // rest-beat paint).
    virtualLockOrgan: 'lanceTip',
    // V2 LANCE-PAINT anatomy (CP2): BRAND THE TROPHIES — the five taken charms on
    // the hip chain are the paint targets (claiming his collection back, one mark
    // at a time; they swing on the pendulum chain of a DARTING boss = the Tier-3
    // peak paint hunt). The EMPTY hook is deliberately NOT paintable — that thread
    // stays open (§3 law 6; it awaits YOU). The lanceTip anchor is the easy first
    // mark (L183 promotion: on a V2 boss the anchor is paintable too).
    lockParts: [
      { part: 'trophyCharm0' }, { part: 'trophyCharm1' }, { part: 'trophyCharm2' },
      { part: 'trophyCharm3' }, { part: 'trophyCharm4' },
    ],
    // §5j the scripted entrance (entranceScripts.js): fades in riding at your
    // shoulder, rel rock-steady, while the stat-taunt lands. Zero shots (Mantis).
    entrance: 'itKeptCount',
    // §5j the diegetic Psycho Mantis: boss.js quotes the player's REAL ledger
    // (deaths per boss) in the announce and flares the TOP KILLER's charm mid-hold
    // (the MANDATORY escalation hinge; fresh-save fallback wired).
    statTaunt: true,
    // §5f the roster's ONE hold-breaker: a single slow, survivable, PARRYABLE amber
    // fired INTO the reveal hold — the trophy-hunter has no honor.
    holdBreaker: true,
    // §5i.C Decision C1: the reflect-once RIPOSTE — from P2 (the WEARS THE HORN —
    // Riposte card) on, once per phase, it PARRIES your reflected bullet (cross-swat
    // + amber flash) and returns it slow + amber (re-reflect it). The full TENNIS
    // RALLY + REFLECT-ONLY SEAL stays deferred C2 scope (its own PR).
    reflectRiposte: { fromPhase: 1 },
    // §5i.B the Calamities graze debut for slot 9 — HOLD-UNTIL-FLINCH: a discrete
    // stare-down in the lance's threat-line (escalating tiers → the amber flinch),
    // once per phase. NOT slot 6's continuous beam-ride (the graze-ladder law).
    grazeForm: 'holdFlinch',
    // §5e moving-station setpiece (P2 entry): the FLANK CUT-IN — draws level on the
    // flank and cuts ACROSS your lane at rel ~8 (the L140 proximity near-pass),
    // firing the whole way.
    setpieces: [
      { id: 'flankCutIn', atPhase: 1, dur: 6.0, moving: true },
      // §5f the DREAD beat, AUTHORED (the grandeur redo's #1 lift — the audit's
      // "a lore-quote with zero authored visual"): at P3 entry the duelist RISES
      // over your lane and the lance WRITES the verdict at screen scale in
      // Voidmaw's violet (the model keys on `dread` via setSetpiece) while the
      // card fires boss-1's dread set beneath it. Moving: it fires the whole way.
      { id: 'voidmawVerdict', atPhase: 2, dur: 7.5, moving: true, dread: true },
    ],
    // bossgate capture: the r3 dart footwork moves the body ~15u/s mid-hop, hitting
    // the tool's documented two-frame mask/screenshot race (the marrowcoil pale-slide
    // twin) — freeze the sim for the grab pair. NOT a G-law override; no thresholds change.
    gate: { freeze: true },
    scale: 2.0,              // a lean dragon-PEER, NOT a colossus — tuned up from 1.5 so the studio
                             // fight-frame reads at band presence (G4) without bulking the mesh (L140)
    hpMax: 440,              // Tier-3 band 360–450; the slot-9 PEAK sits high (the sawtooth crest)
    // Precision jobs (§5f), tightening toward the dread: aimed/crossfire/stream — the
    // duelist's exchange, almost no fills. Every phase carries an amber carrier so the
    // lance-tip organ always serves parry fuel (amberdiet, §5i C.1).
    phases: [
      { atFrac: 1.00, cadence: [1.4, 1.8], attacks: ['aimed', 'crossfire'] },            // P1: the duel opens
      { atFrac: 0.55, cadence: [1.3, 1.6], attacks: ['aimed', 'crossfire', 'stream'] },  // P2: it presses
      // P3 QUOTES boss-1's dread set VERBATIM (aimed/fan/tunnel — Voidmaw's P3;
      // §5f "it fires boss 1's dread card back at you, violet-scarred") at
      // Calamity cadence. 'aimed' keeps the amber carrier (amberdiet §5i.C.1).
      { atFrac: 0.25, cadence: [1.2, 1.5], attacks: ['aimed', 'fan', 'tunnel'] },        // P3: Voidmaw's Verdict (dread)
    ],
    cards: [
      { id: 'karnvow_gambit',  name: 'IT KEPT COUNT — Opening Gambit',     atFrac: 1.00, timer: 24 },
      { id: 'karnvow_riposte', name: 'WEARS THE HORN — Riposte',           atFrac: 0.55, timer: 26 }, // the parry beat
      { id: 'karnvow_verdict', name: 'WEARS THE HORN — Voidmaw’s Verdict',  atFrac: 0.25, timer: 28, dread: true },
    ],
    // §5i AGGRESSION EXCHANGE — tight, initiative-driven, SHORT rests: a BIMODAL trade
    // of quick jabs (the short mode) and a measured riposte-beat (the long mode),
    // tightening each phase. Distinct from ashtalon's long uniform ambush-rest and
    // thrumswarm's relentless narrow thrum (rhythmprint KS-floor). All phases carry an
    // amber carrier (aimed/crossfire/stream) → the lance organ always serves parry fuel.
    // The "your parries steal its tempo" reactive layer is a CP2 enhancement (Decision C).
    rhythm: {
      signature: 'aggression-exchange',
      ticket: { bpm: 100, quantize: '1/8' },
      phases: [
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.4 }, { kind: 'burst', attack: 'crossfire', count: 2, gap: 0.45 }],
          restLo: 0.55, restHi: 1.4, restDist: 'bimodal' },
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.35 }, { kind: 'burst', attack: 'crossfire', count: 2, gap: 0.4 }, { kind: 'sustain', attack: 'stream', beats: 2, gap: 0.4 }],
          restLo: 0.5, restHi: 1.25, restDist: 'bimodal' },
        // P3 phrase carries the QUOTE (aimed/fan/tunnel — boss-1's dread verbs) at the
        // exchange's own bimodal tempo: still KARNVOW's rhythm, wearing Voidmaw's horn.
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.35 }, { kind: 'burst', attack: 'fan', count: 2, gap: 0.4 }, { kind: 'sustain', attack: 'tunnel', beats: 2, gap: 0.35 }],
          restLo: 0.45, restHi: 1.15, restDist: 'bimodal' },
      ],
    },
  },

  embertide: {
    id: 'embertide',
    name: 'EMBERTIDE',
    title: 'the Sky Set Loose',
    epithet: 'What Even the Sky Obeyed',   // §5f lore gap → the Apex: EMBERTIDE was ITSELF leashed (the leash
                                           // chain Stormrend ← EMBERTIDE ← THE UNMASKED); it quotes Stormrend
                                           // ("the gale was its leash") — a DESIGNED echo, not a stale reference.
    tier: 4,                          // WORLD-ENDER band (§5b band 4), slot 13 — the SPATIAL PEAK (2nd-last boss)
    hpMax: 552,                       // WE band 480–560; the band PEAK sits HIGH (§5b sawtooth: 10 opener 480 → 13 peak 552)
    // Boss-archetype dispatch (bossModel.js buildBoss): the Embertide builder
    // (bossEmbertide.js) — §5b registry slot 13: the horizon standing up, a frame-wide wall of living
    // light (vermilion→coral-rose) with a colossal FRONTAL FACE deforming through it as dark NEGATIVE relief.
    // The only full-frame gradient-field identity; the World-Enders SPATIAL peak (13 = the sky in maximum
    // MOTION; 14 THE UNMASKED = the sky perfectly STILL — protect both extremes).
    archetype: 'embertide',
    muzzle: 'crestPivot',             // the tide crest / full-frame band rows are the emitter (§5f law 7 — emitter = organ)
    // ⚠ Decision C (owner-signed) — the sanctioned VALUE-INVERSION gate override (§7b), NEW beyond gate.pale
    // (MARROWCOIL's): the "body" is the BRIGHT field, the focal/identity is the DARKNESS (the dark face +
    // eye-hollows — the recorded §3-law-2 exception, §4b). `inverted` flips G1 to a DARK-focal check (the
    // darkest cluster is the focal, not the brightest); `frameFill` exempts G2 (dark-body) + G4 (presence) —
    // it legitimately fills AND overflows the frame (the spatial peak, never fits). Cited to the registry
    // VALUE-INVERSION sanction (§5b row 13 / the §7b sanctioned list).
    gate: { inverted: true, frameFill: true },
    // ⚠ EMBERTIDE *IS* THE SKY (§5d "fog-exempt, camera-relative, REPLACE the sky dome — one
    // sky, never two"). boss.js camera-POSITION-locks the model's visual `rig` (the dome + face)
    // to the camera like environment.js's real sky dome, and crossfades the real dome OUT — so
    // it fills the frame at any aspect with no edges and no second sky. Inert for every other
    // boss (they leave `skyReplace` unset → normal world-station placement).
    skyReplace: true,
    accent: 0xff3a1e,                 // VERMILION (Decision C) — hue ≈7.5°, clears danger-magenta's 327–357°
                                      // reserved band by ~25°. The field runs vermilion→WARM coral-rose (glow
                                      // #ff7a5e, ~10°, G≥B): the rose end is a WARM coral, NOT a cool pink-rose
                                      // (a pink-rose ~350° would fall INSIDE danger-magenta → G3/bulletcontrast
                                      // fail). The VIVID fire tide is distinct from the WE rose-triple (11
                                      // pale-gold, 12 ashen-rose). Verified vs DANGER_HUE in bulletcontrast.mjs.
    glow: 0xff7a5e,                   // warm coral-rose — the LIGHT end of the tide / the face edge-light / shield rim
    bulletColor: 0xff2b6a,            // danger magenta — role colour (never per-boss); the INVERSE contrast
                                      // problem: it must read against the BRIGHT field (its white core carries it)
    approachFrom: 'horizon',          // WIRED (CP2-A): the gameplay STATION walks in from far up the lane
                                      // (the HOLLOWGATE far-ahead close) + a 'top' warn banner; the VISUAL
                                      // arrival is the camera-locked dome via the §5j entrance below.
    // §5j THE SKY COMES LOOSE (CP2-A): the dome LIFTS from an ember seed, the face
    // RISES through the horizon line, the eye-hollows TEAR OPEN one at a time and
    // settle on the dragon (entranceScripts.js `skyComesLoose`; the model's
    // setEntrance owns the sky-side choreography — boss.js stages 0 at spawn).
    entrance: 'skyComesLoose',
    // CP2-A THE TIDE CRUSH — the brief's "vertical squeeze + letterbox at the FIRST
    // crescendo set (a re-entrance beat)": ~6s into P1 the sky's ceiling of light
    // descends (player.js Y-clamps at hy, damage-free), the model's crush strips
    // pinch the frame, and a letterbox pulses in and back out. Def-gated; every
    // other boss is inert (no skyCrush → the Y engine never arms).
    skyCrush: { delay: 6, hy: 14 },
    // The X counterpart lands LATER (P3, "the crest crosses the whole frame"): the
    // shipped storm-wall constrict, re-read as the tide pressing in from the flanks
    // (the walls take def.accent → vermilion light, not storm-teal).
    constrictPhase: 2,
    scale: 1.0,                       // NOT a unit scale — the field is tuned frame-wide IN the builder; it IS the backdrop
    // §5i TIDE-EDGE + FACE-SHADOW POCKET graze (reuses slot-6's continuous-graze detector): skim the crest
    // edge, ride the moving face-shadow pocket; offered once per phase. Def-gated; shipped bosses inert.
    grazeForm: 'tideEdge',
    beamDuel: true,                  // §5i.C the Surge≥50% mechanic (fire INTO the crest; hold lane-center against the drift). Def-gated; shipped bosses inert.
    // CRESCENDO SETS (Stormrend's 'crescendo' ramp QUOTED in repeating wave-SETS, each cut harder — the
    // designed echo). Fill apex: curtain/iris/movingGap at the fairness-floored cadence. BEAM DUEL is 13's
    // SURGE mechanic (fire INTO the crest at Surge ≥50%) — NOT a parry read (audit ED-8: it sits in the Surge
    // ladder, and the WE band already debuts ONE parry at slot 10). The amber floor is served instead by a
    // separate PARRYABLE CREST-LOCK volley — the `crossfire`/`stream` carrier held in EVERY phase's attacks
    // (incl. the survival phase, per the §5i.C exemption — see Horizon Break below).
    phases: [
      { atFrac: 1.00, cadence: [1.35, 1.8],  attacks: ['curtain', 'crossfire'] },                       // P1: the tide rises (first crescendo set) — the vertical squeeze + letterbox fires HERE as a NORMAL re-entrance beat (CP2), not a survival card
      { atFrac: 0.80, cadence: [1.25, 1.65], attacks: ['curtain', 'secondWave', 'crossfire'] },         // P2: the sets stack (a second crest, cut harder) — `secondWave` (returning gust) replaces `movingGap` so P2 is no longer a subset of WEFTWITCH's P5 dread set (§B-4 collision)
      { atFrac: 0.58, cadence: [1.15, 1.5],  attacks: ['crestfall', 'iris', 'stream'] },                // P3: the crest crosses the whole frame — CRESTFALL debuts (CP2-B full-frame emitter); `stream` is the amber crest-lock carrier
      { atFrac: 0.36, cadence: [1.1, 1.4],   attacks: ['curtain', 'iris', 'crestfall', 'crossfire'] },  // P4: full flood (every set at once) — the crest breaks alongside the walls; `crossfire` amber
      { atFrac: 0.16, cadence: [1.05, 1.35], attacks: ['crestfall', 'crossfire'] },                     // P5: SKY SET LOOSE — Horizon Break (dread/survival). boss.js force-selects `crestfall` for the whole card (the `embertide_horizonbreak` gate: its gap LOCKS to the moving face-shadow pocket `horizonPocketX`), so the array now honestly reflects what fires; `crossfire` kept for the amberdiet floor (§5i.C survival exemption)
    ],
    // Spell cards (5 for WE; "<EPITHET FRAGMENT> — <plain pattern>"; the dread/survival card LAST). 13's ONE
    // survival card is the final Horizon Break crest; the FIRST-set vertical squeeze is a NORMAL beat (P1), not
    // a second survival card. Horizon Break: the tide crests the WHOLE frame — the only safe pocket is the
    // FACE's cast shadow (hide in its shadow); the timer is the escape hatch. The roster's SECOND survival card
    // (with slot 10).
    cards: [
      { id: 'embertide_tiderises',    name: 'SKY SET LOOSE — The Tide Rises',   atFrac: 1.00, timer: 28 },
      { id: 'embertide_setsstack',    name: 'WHAT EVEN — The Sets Stack',       atFrac: 0.80, timer: 28 },
      { id: 'embertide_crestcross',   name: 'THE SKY — The Crest Crosses',      atFrac: 0.58, timer: 30 },
      { id: 'embertide_fullflood',    name: 'SET LOOSE — Full Flood',           atFrac: 0.36, timer: 30 },
      { id: 'embertide_horizonbreak', name: 'SKY SET LOOSE — Horizon Break',    atFrac: 0.16, timer: 30, dread: true, survival: true },
    ],
    // §5i CRESCENDO SETS (slot 13) — echoes Stormrend's 'crescendo' DELIBERATELY (the gale was its leash) but
    // the REPEATING WAVE-SETS + the deep EBB between them are the differentiator: tight, TIGHTENING crest gaps
    // (each set cut harder) punctuated by a WIDE bimodal drawback — a short re-crest OR a long tide-ebb (the
    // "breath before the next crest") — a gap fingerprint no other roster boss occupies (rhythmprint KS ≥ 0.20
    // vs all, incl. Stormrend's narrower decaying ramp). REST look (§5i rest-beat law): between sets the tide
    // visibly DRAWS BACK — a low ebb, never a dead pause.
    rhythm: {
      signature: 'crescendo-sets',
      phases: [
        { // P1 — the tide rises: one measured crest, then a deep drawback
          ratioBurst: 0.4,
          phrase: [
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.6 },
            { kind: 'sustain', attack: 'crossfire', beats: 1, gap: 0.85 },
          ],
          restLo: 0.7, restHi: 3.2, restDist: 'bimodal',
        },
        { // P2 — the sets stack: two crests, cut harder
          ratioBurst: 0.5,
          phrase: [
            { kind: 'burst',   attack: 'curtain',    count: 2, gap: 0.55 },
            { kind: 'burst',   attack: 'secondWave', count: 2, gap: 0.55 },  // returning gust (was movingGap — §B-4 collision fix; count/gap unchanged so rhythmprint is byte-identical)
            { kind: 'sustain', attack: 'crossfire',  beats: 1, gap: 0.8 },
          ],
          restLo: 0.65, restHi: 3.0, restDist: 'bimodal',
        },
        { // P3 — the crest crosses: the crest-lock volley (stream) is the amber carrier
          ratioBurst: 0.55,
          phrase: [
            { kind: 'burst',   attack: 'crestfall', count: 1, gap: 0.5 },   // CRESTFALL debuts here (the crest crosses the whole frame)
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.5 },
            { kind: 'sustain', attack: 'stream',    beats: 2, gap: 0.75 },
          ],
          restLo: 0.6, restHi: 2.9, restDist: 'bimodal',
        },
        { // P4 — full flood: every set at once, the tightest crests
          ratioBurst: 0.65,
          phrase: [
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.5 },
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.5 },
            { kind: 'burst',   attack: 'crestfall', count: 1, gap: 0.5 },   // the crest breaks alongside the walls (full flood)
            { kind: 'sustain', attack: 'crossfire', beats: 1, gap: 0.7 },
          ],
          restLo: 0.55, restHi: 2.8, restDist: 'bimodal',
        },
        { // P5 — Horizon Break (dread/survival): the whole frame crests; the ebb is the escape hatch.
          // Emission is force-set to `crestfall` at runtime (boss.js embertide_horizonbreak gate), so the
          // burst ids are renamed to crestfall to match — rename-only (count/gap/rest untouched → rhythmprint
          // byte-identical); `crossfire` sustain kept so the amber-floor accounting still registers a carrier.
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'crestfall',  count: 3, gap: 0.45 },
            { kind: 'burst',   attack: 'crestfall',  count: 2, gap: 0.45 },
            { kind: 'sustain', attack: 'crossfire',  beats: 1, gap: 0.65 },
          ],
          restLo: 0.5, restHi: 2.7, restDist: 'bimodal',
        },
      ],
    },
  },

  // ── BOSS 12 — ONEWING, "the Half That Would Not Die" (registry slot 12) ────────
  // EITHERWING's grief-stricken survivor, returned colossal and LOPSIDED, carrying
  // its dead twin's kite-frame fused to its chest (§5b/§5d slot 12, the WORLD-ENDERS
  // rival-return payoff). One vast 8-blade wing vs one atrophied 2-blade stub, a
  // permanent ~12° list. Its band-break is the ARRIVAL GRAMMAR (no warning until it
  // erupts, `noWarn`) plus the roster's ONE lying FELLED card (the health-bar lie —
  // wired in CP2, def-gated so no other boss may ever opt in).
  onewing: {
    id: 'onewing',
    name: 'ONEWING',
    title: 'the Half That Would Not Die',
    epithet: 'What Grief Would Not Bury',   // §5f lore gap: the grief points at the Apex (registered thread; slot 5 → 12 rival-return)
    archetype: 'onewing',                    // new string; dispatched in bossModel.js → bossOnewing.js
    tier: 4,                                 // WORLD-ENDER band — a strong mid/late slot on the §5b sawtooth (NOT the 13 peak)
    hpMax: 540,                              // WE band 480–560; sits high but below the band peak (13)
    // ⚠ THE ARRIVAL-GRAMMAR BAND-BREAK (§5c "the lane breaks"): the DANGER banner
    // fires WITH the eruption, never before — the no-warn jump-scare. The late-banner
    // path is BUILT in CP2 (Part 2.6); until then this flag is inert (a def without a
    // consumer keeps the plain warn — coexist-safe, every other boss byte-identical).
    noWarn: true,
    // §5j erupts from BELOW (the fog floor) — a straight vertical eruption into station,
    // NOT the default behind-arc that drifts up and over the player (the "flies through
    // us" the owner flagged). Paired with the no-warn banner + the eruption danger beat
    // (boss.js enterFight), the arrival is an abrupt threat, not a flythrough.
    approachFrom: 'below',
    // §5j THE FULL ARRIVAL CINEMATIC (entranceScripts.js 'theGraveItCarries'): it surfaces
    // SILENTLY at your flank, holds a two-shot mutual gaze (~2s, wordless — noWarn keeps the
    // banner deferred), then wheels square and SURGES to station, where enterFight fires the
    // eruption (slam + shockwave + banner + ambush). The script owns the gaze + silence; the
    // eruption stays the payoff. A def without this keeps the plain below-rise (coexist).
    entrance: 'theGraveItCarries',
    // §5f THE LYING FELLED CARD (the roster's ONLY health-bar lie — def-gated; no other
    // def may ever set this). On the killing blow ONEWING fakes death (the FELLED card
    // fires, it cracks), then within ≤2s felledReturn of the bar RETURNS and it fights
    // on CRIPPLED + exposed until a REAL second kill. Its name IS the mechanic.
    felledLie: true,
    felledReturn: 0.35,          // ≤35% of the bar comes back (the crippled final stand)
    defeat: { slain: '✦  WOULD NOT DIE  ✦', felled: 'ONEWING — The Half That Would Not Die' },
    muzzle: 'livingWing',        // the LIVING volley origin (the wing); the GHOST volley (the fused frame) is a second model node — CP2
    // §5i.B World-Enders graze: SPRAY-SOAK — the fused frame IS the anatomy; hitting/
    // breaking it vents a 2×-value spray for a beat (offered once per phase). Def-gated;
    // 'spraySoak' has no consumer yet (CP2), so it is inert for every boss now.
    grazeForm: 'spraySoak',
    scale: 1.9,                  // TUNE in studio: size the vast wing to ≥26 on-screen units (×2.2 of the r9 6.2 body is the FLOOR, not the target — §2.1/L141)
    // §7b MOVING boss (L194): ONEWING wanders its lane (the fluidity primitive), so it
    // slides off its own capture mask between bossgate's two round-trips (the G1 focal
    // flake). `freeze` samples the geometry mask + the screenshot at ONE pose — additive,
    // thresholds unchanged, shipped defs byte-identical.
    gate: { freeze: true },
    // PALETTE (Decision C — the ashen grey-rose, the MOST DESATURATED of the 11/12/13
    // rose-triple; near-black grey-rose TRACE). Identity lives in the EMISSIVE rims
    // (diffuse near-black, §3 law 3). The fused ghost-frame stays PURE BLACK (no glow).
    // Builder proposes hexes + verifies G3/bulletcontrast clear of danger-magenta.
    // Ashen grey-rose pushed to the COOL edge (~305°, a mourning mauve-rose) so its
    // bloom halo clears the danger-magenta band (327–357°) with a ~17° margin — the
    // §5d OXBLOOD/MAGENTA collision law, but on the cool side (EITHERWING cleared it
    // warm; ONEWING clears it cool → the two survivors read distinct). Desaturated =
    // the MOST ashen of the 11/12/13 triple. Verified: bossgate G3 + bulletcontrast.
    accent: 0x6c4c78,            // dim ashen mauve-rose (the living-wing lit edges; grief-dim ei)
    glow: 0x8a6b7e,              // a touch paler (shield rim / shards / backlight)
    bulletColor: 0xff2b6a,       // danger magenta — the role colour (living volley; never per-boss)
    // §5f/§5i.C THE GHOST HALF (def.ghostHalf): the dead twin's parryable volley fires
    // from the fused frame (the model's 'ghostMuzzle') as amber-ringed bullets with a
    // GHOST core colour, aimed by the dodge-MIRROR (poseRing). NOT a new attack id — a
    // per-bullet colour+origin variant of the shipped emitter (the World-Enders ≤1-id
    // budget is untouched). ghostColor is the CORE only; the ring stays amber (parryable).
    ghostHalf: true,
    ghostColor: 0xcfe6ff,        // a pale spectral white-blue (the dead half) — the ring is amber (role), this is the core read

    // Phases — RUBATO / FEINT: held wind-ups + denied downbeats. Re-expresses
    // EITHERWING's kit (crossfire/secondWave/movingGap) + the ghost-half volley.
    // `attacks` per phase always carries an amber carrier (aimed) for the amberdiet
    // floor; the ghost half is parryable (CP2). cadence = the legacy fallback roll.
    phases: [
      { atFrac: 1.00, cadence: [1.3, 1.9], attacks: ['crossfire', 'aimed'] },              // P1: The Listing Volley
      { atFrac: 0.86, cadence: [1.2, 1.8], attacks: ['movingGap', 'crossfire', 'aimed'] }, // P2: The Ghost Half (the dead twin's volley begins, as ghost-bullets — CP2). §ENG-12 C.2: 0.78→0.86 trims the plain P1 intro (ghost gate is phase-INDEXED, so it still starts exactly at P2)
      { atFrac: 0.56, cadence: [1.1, 1.7], attacks: ['secondWave', 'fan', 'aimed'] },       // P3: The Mantling Wing
      { atFrac: 0.34, cadence: [1.0, 1.6], attacks: ['crossfire', 'fan', 'aimed'] },        // P4: The Denied Downbeat (the feint)
      { atFrac: 0.16, cadence: [0.9, 1.5], attacks: ['secondWave', 'crossfire', 'aimed'] }, // P5: The Missing Wing (dread — the old DUAL attack ALONE)
    ],
    // Spell cards (§5f; 5 for WE, 1:1 with phases — atFracs align; ONE dread, LAST).
    // The dread card "WOULD NOT DIE — The Missing Wing" performs EITHERWING's old DUAL
    // attack ALONE: the dead half's volley arriving as ghost-bullets (the finally-
    // answerable attack; parry the ghost half — CP2). Its name IS the lying-FELLED beat.
    cards: [
      { id: 'onewing_listing',   name: 'WOULD NOT DIE — The Listing Volley', atFrac: 1.00, timer: 24 },
      { id: 'onewing_ghosthalf', name: 'WOULD NOT DIE — The Ghost Half',     atFrac: 0.86, timer: 26 },
      { id: 'onewing_mantle',    name: 'WOULD NOT DIE — The Mantling Wing',   atFrac: 0.56, timer: 26 },
      { id: 'onewing_denied',    name: 'WOULD NOT DIE — The Denied Downbeat', atFrac: 0.34, timer: 28 },
      { id: 'onewing_missingwing', name: 'WOULD NOT DIE — The Missing Wing',  atFrac: 0.16, timer: 30, dread: true },
    ],
    // §5i RUBATO / FEINT — the roster's ONE broken-meter boss. Delays are FIXED per
    // attack, animation-held, NEVER randomized: within-phrase gaps are scalars and the
    // rest uses 'decaying' (a deterministic long→short ramp — the held-then-tightening
    // meter), so the broken meter is LEARNABLE, not luck. Long rubato rests give a
    // distinct rhythmprint fingerprint (KS ≥ 0.20 vs every boss); the amber floor keeps
    // a parry volley inside every 12s window (amberdiet).
    rhythm: {
      signature: 'rubato-feint',
      phases: [
        { phrase: [{ kind: 'burst', attack: 'crossfire', count: 1, gap: 0.0 }, { kind: 'burst', attack: 'aimed', count: 2, gap: 0.45 }],
          restLo: 0.7, restHi: 3.4, restDist: 'decaying' },
        { phrase: [{ kind: 'burst', attack: 'movingGap', count: 1, gap: 0.0 }, { kind: 'burst', attack: 'crossfire', count: 2, gap: 0.4 }, { kind: 'burst', attack: 'aimed', count: 1, gap: 0.0 }],
          restLo: 0.65, restHi: 3.1, restDist: 'decaying' },
        { phrase: [{ kind: 'sustain', attack: 'secondWave', beats: 1, gap: 0.0 }, { kind: 'burst', attack: 'fan', count: 2, gap: 0.4 }, { kind: 'burst', attack: 'aimed', count: 1, gap: 0.0 }],
          restLo: 0.6, restHi: 2.9, restDist: 'decaying' },
        { phrase: [{ kind: 'burst', attack: 'crossfire', count: 2, gap: 0.4 }, { kind: 'burst', attack: 'fan', count: 1, gap: 0.0 }, { kind: 'burst', attack: 'aimed', count: 1, gap: 0.0 }],
          restLo: 0.55, restHi: 2.7, restDist: 'decaying' },
        { phrase: [{ kind: 'burst', attack: 'secondWave', count: 1, gap: 0.0 }, { kind: 'burst', attack: 'crossfire', count: 2, gap: 0.38 }, { kind: 'burst', attack: 'aimed', count: 2, gap: 0.35 }],
          restLo: 0.5, restHi: 2.5, restDist: 'decaying' },
      ],
    },
  },

  // ── slot 14 — THE UNMASKED — the APEX / FINALE (BOSS-DESIGN.md §5b row 14, §5c
  // APEX contract). The second sun that cracks into a biblically-accurate angel:
  // 3 STAGES that dissolve-swap between sub-rigs (STAGE 1 second-sun/eclipse-eye →
  // STAGE 2 Ophanim wheels-of-eyes → STAGE 3 the unveiling). Builder: bossUnmasked.js
  // (archetype 'unmasked'). STAGED BUILD: the builder renders STAGE 1 first; stages
  // 2/3, THE MEDLEY (real card-quoting by stable id), STAR PIPS, the destructible
  // relics, the verb-shift surge-chase, and the second-sun landmark + handoff() are
  // CP2 integration (after every stage is owner-signed-off). This def is valid + inert
  // now: phases/cards/rhythm below are a schema-valid PLACEHOLDER medley (existing
  // attack ids only, zero new) that CP2 replaces with the real roster quote.
  unmasked: {
    id: 'unmasked',
    name: 'THE UNMASKED',                 // 12 chars (title-card budget ≤12)
    title: 'the Second Sun',
    epithet: 'What Wore the Sky as a Mask',
    tier: 5,                              // APEX (§5b band 5) — TIER_BUDGETS[5] = 30,000 tris / 120 draws
    hpMax: 240,                           // §5b Apex — PER-FORM health (multi-form boss, formLifebars): each of the 3 forms is fought from a FULL bar to 0, so the effective total is ~3×240=720 (a ~3.5-min apex fight). TUNE for length.
    formLifebars: true,                   // MULTI-FORM boss: each phase is its OWN full health bar. A form is "defeated" at 0 hp → shield → Surge through → the bar REFILLS full + the next form's transition plays. Only the LAST form's defeat is death. (THE UNMASKED: eclipse → seraph → unveiling, three full fights.)
    archetype: 'unmasked',                // dispatch → bossUnmasked.js (bossModel.js)
    // The pupil (STAGE 1) / the veiled core (STAGE 3) is the aim anchor; the ~20 eyes
    // (STAGE 2) become per-eye lock parts at CP2. V1: the always-watching focal eye.
    virtualLockOrgan: 'focalEye',
    muzzle: 'focalEye',                   // stage-1 bullets originate at the eye that watches
    accent: 0xf0e0a0,                     // gold rails/relics (identity accent, emissive only)
    glow: 0xffffff,                       // white corona — the reserved glow-shape (from slot 1)
    bulletColor: 0xff2b6a,                // danger magenta (role colour, never per-boss)
    approachFrom: 'ahead',                // CP2 upgrades to the secondSun.handoff() landmark approach
    scale: 2.4,                           // sky-scale — the disc hangs huge above the lane (TUNE in studio)
    stages: 3,                            // the stage system (CP2 dissolve-swaps the sub-rigs)
    stagesBuilt: 3,                       // how many stage sub-rigs exist: 1 eclipse-eye · 2 seraph · 3 the unveiling (star-eye + starburst + halo, wings mantled). Drives the dev stage-jump selector.
    grazeForm: 'medley',                  // §5i.B APEX graze — quotes the roster's graze forms (CP2)
    // Decision-C gate overrides (§7b sanctioned): ~20 eyes are many small bright points
    // (G1 assumes ONE focal); the wheels frame-fill (G4). Cited to the registry sanction.
    gate: { eyeCluster: true, frameFill: true },
    // PHASES = the 3 stages. PLACEHOLDER medley (zero new attack ids); CP2 wires the
    // real per-stage roster quote. amberdiet: every phase carries an amber carrier.
    phases: [
      { atFrac: 1.00, cadence: [1.6, 2.4], attacks: ['aimed', 'fan'] },                        // STAGE 1 — the second sun watches
      { atFrac: 0.60, cadence: [1.2, 1.8], attacks: ['fan', 'crossfire', 'movingGap', 'iris'] }, // STAGE 2 — the Ophanim medley
      { atFrac: 0.30, cadence: [1.1, 1.6], attacks: ['crossfire', 'stream', 'fan', 'iris'] },     // STAGE 3 — the unveiling (dread)
    ],
    // Spell cards (1:1 with phases; dread LAST). Names are placeholders in the honest
    // re-struck STAGE grammar; CP2 restrikes them per §5f (+ the one-frame VOIDMAW glitch).
    cards: [
      { id: 'unmasked_secondsun', name: 'I — The Second Sun',                     atFrac: 1.00, timer: 26 },
      { id: 'unmasked_ophanim',   name: 'II — Wheels Within Wheels',              atFrac: 0.60, timer: 30 },
      { id: 'unmasked_verdict',   name: 'WHAT WORE THE SKY — Every Verdict at Once', atFrac: 0.30, timer: 34, dread: true },
    ],
    // §5i THE MEDLEY — the finale quotes a different rest-ENVELOPE per stage (a literal
    // rhythmic medley: a sparse watching sun → a mixed Ophanim cadence → a tightening
    // dread), so the aggregate gap distribution is a fingerprint no single-envelope boss
    // owns (rhythmprint KS ≥ 0.20). CP2 replaces the phrases with the real roster quote.
    rhythm: {
      signature: 'medley',
      phases: [
        { // STAGE 1 — the second sun: very sparse, SPACIOUS, unhurried (it just watches).
          // Wide intra-phrase gaps + long uniform breaths — the finale's grandeur is in
          // the STILLNESS; no other roster boss's gap mass sits this high (rhythmprint).
          phrase: [
            { kind: 'sustain', attack: 'aimed', beats: 2, gap: 1.4 },
            { kind: 'burst',   attack: 'fan',   count: 2, gap: 1.1 },
          ],
          restLo: 2.7, restHi: 4.3, restDist: 'uniform',
        },
        { // STAGE 2 — the Ophanim medley: a stately mixed cadence (spaced wheel-turns),
          // still spacious — the grand quote, not a machine-gun.
          phrase: [
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 1.0 },
            { kind: 'sustain', attack: 'fan',       beats: 2, gap: 1.2 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.95 },
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.95 },
          ],
          restLo: 1.5, restHi: 2.4, restDist: 'uniform',
        },
        { // STAGE 3 — the unveiling: the dread tightens toward the core (decaying crescendo);
          // gaps still wide but closing — the surge-chase pressure builds.
          phrase: [
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.95 },
            { kind: 'sustain', attack: 'stream',    beats: 2, gap: 1.05 },
            { kind: 'burst',   attack: 'fan',       count: 2, gap: 0.9 },
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.9 },
          ],
          restLo: 1.2, restHi: 2.5, restDist: 'decaying',
        },
      ],
    },
  },
};

// Registry slot 3 is ASHTALON (Colossi opener), slot 4 is MARROWCOIL, slot 5 is
// EITHERWING (the Colossi peak, the roster's only twin body), slot 6 is HOLLOWGATE
// (the Calamities opener), slot 7 is THRUMSWARM (the swarm); slot 8 is BRINEHOLM
// (a Calamity — the bound deep-sea leviathan head). CRAGHOLD is RETIRED (§5b L130)
// — its def + builder stay for the geometry-lesson lineage + its telegraph test,
// but it is OUT of the encounter rotation.
export const BOSS_ORDER = ['voidmaw', 'stormrend', 'ashtalon', 'marrowcoil', 'eitherwing', 'hollowgate', 'thrumswarm', 'brineholm', 'karnvow', 'knellgrave', 'weftwitch', 'onewing', 'embertide', 'unmasked'];

// Which boss to use for the Nth encounter of a run (cycles once the list is
// exhausted — more bosses just extend the list). LEGACY path: kept for the
// ?bossIdx debug override, forceBoss, and the test seams; live encounter
// selection now goes through the LIFETIME LADDER below (§5h, lands with slot 6).
export function bossDefForIndex(i) {
  const key = BOSS_ORDER[i % BOSS_ORDER.length];
  return BOSSES[key];
}

// ---- THE LIFETIME LADDER (§5h owner decision 1 — the band-aware progression
// controller that replaces the modulo; the hard blocker for Tier-3
// foreshadowing). Pure function of (what's been felled this run, lifetime
// kills per boss) so tests can drive it headlessly:
//   · a run's FIRST boss = the LOWEST lifetime-unbeaten slot,
//   · the ladder then walks UP the roster in slot order,
//   · wrapping past the top brings BEATEN slots back (they recur — the caller
//     tightens their dials via ladderTighten),
//   · a slot felled THIS RUN never repeats within the run; if every slot has
//     been felled this run (a full lap), the exclusion resets and the ladder
//     laps again from the bottom.
// `kills(id)` → lifetime kill count (save.js bossLedger). Returns the def.
export function ladderPickDef(felledThisRun, kills, fromSlot = null) {
  const n = BOSS_ORDER.length;
  const excluded = (id) => felledThisRun.has(id);
  // Full lap → reset the exclusion (the run out-lived the roster).
  const allFelled = BOSS_ORDER.every(excluded);
  const isOut = allFelled ? () => false : excluded;
  // The run's entry rung: the lowest lifetime-unbeaten slot (or 0 if all beaten).
  let start = fromSlot;
  if (start == null) {
    start = BOSS_ORDER.findIndex((id) => (kills(id) || 0) === 0);
    if (start < 0) start = 0;
  }
  for (let k = 0; k < n; k++) {
    const id = BOSS_ORDER[(start + k) % n];
    if (!isOut(id)) return BOSSES[id];
  }
  return BOSSES[BOSS_ORDER[0]];   // unreachable (isOut is never all-true)
}

// Tightened dials for a RECURRING (lifetime-beaten) slot: a cadence/rest
// multiplier that shrinks with kills and floors at 0.78 — recurrence bites a
// little harder each time without ever breaking the §5b band cadence floors.
export function ladderTighten(killCount) {
  if (!killCount) return 1;
  return Math.max(0.78, Math.pow(0.93, Math.min(killCount, 4)));
}
