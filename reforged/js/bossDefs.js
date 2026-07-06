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
//     survival? (invincible seal — timeout snaps hp past atFrac) }.
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
    phases: [
      { atFrac: 1.00, cadence: [1.8, 2.4], attacks: ['fan', 'curtain'] },              // P1: learn the wall
      { atFrac: 0.66, cadence: [1.6, 2.1], attacks: ['movingGap', 'stream', 'aimed'] },// P2: anti-flee
      { atFrac: 0.33, cadence: [1.4, 1.9], attacks: ['iris', 'secondWave', 'crossfire'] }, // P3: the storm
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
      phases: [
        { phrase: [{ kind: 'sustain', attack: 'fan', beats: 1, gap: 0.7 }, { kind: 'sustain', attack: 'curtain', beats: 1, gap: 0.7 }],
          restLo: 1.3, restHi: 2.6, restDist: 'decaying' },
        { phrase: [{ kind: 'sustain', attack: 'aimed', beats: 1, gap: 0.6 }, { kind: 'sustain', attack: 'stream', beats: 1, gap: 0.6 }, { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.6 }],
          restLo: 1.1, restHi: 2.3, restDist: 'decaying' },
        { phrase: [{ kind: 'sustain', attack: 'crossfire', beats: 1, gap: 0.55 }, { kind: 'sustain', attack: 'secondWave', beats: 1, gap: 0.55 }, { kind: 'sustain', attack: 'iris', beats: 1, gap: 0.55 }],
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
    // §5e moving-station setpieces (fire while they travel, per-phase). P2 = the
    // wide CIRCLING orbit; P3 = the EMBER HUNT stooping dive from above (dread).
    setpieces: [
      { id: 'circlingPass',   atPhase: 1, dur: 7.0, moving: true },
      { id: 'stoopingStrike', atPhase: 2, dur: 5.5, moving: true, dread: true },
    ],
    phases: [
      { atFrac: 1.00, cadence: [1.5, 2.0], attacks: ['aimed', 'stream'] },                 // P1: the hunter's tracking hose debuts
      { atFrac: 0.66, cadence: [1.4, 1.8], attacks: ['fan', 'stream', 'crossfire'] },       // P2: circling passes converge
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['stream', 'spiralStream', 'secondWave'] }, // P3: the stoop (dread)
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
        { phrase: [{ kind: 'burst', attack: 'spiralStream', count: 2, gap: 0.4 }, { kind: 'sustain', attack: 'stream', beats: 3, gap: 0.35 }, { kind: 'burst', attack: 'secondWave', count: 2, gap: 0.4 }],
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
      { atFrac: 1.00, cadence: [1.5, 2.0], attacks: ['aimed', 'fan'] },                    // P1: read the bone rings
      { atFrac: 0.66, cadence: [1.4, 1.8], attacks: ['iris', 'stream', 'crossfire'] },     // P2: the coil rings expand (fly-through)
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
            { kind: 'burst',   attack: 'fan',   count: 2, gap: 0.18 },
          ],
          restLo: 1.4, restHi: 2.0, restDist: 'uniform',
        },
        { // P2 — the coil rings expand (fly-through): even trade
          ratioBurst: 0.5,
          phrase: [
            { kind: 'sustain', attack: 'stream',    beats: 5, gap: [0.42, 0.50] },
            { kind: 'burst',   attack: 'crossfire', count: 3, gap: 0.16 },
            { kind: 'sustain', attack: 'iris',      beats: 2, gap: 0.60 },
          ],
          restLo: 1.1, restHi: 1.7, restDist: 'bimodal',   // quick inter-burst gaps + one long breath
        },
        { // P3 — the closing ribs (dread): burst-led, walls dominate. The trailing
          // `stream` sustain is the AMBER carrier (§5i C.1 amberdiet data-tune: the
          // closing coil keeps its amber-tipped tracking hose, so this dread phase
          // still serves a parry volley — mirrors the `stream` added to `attacks`).
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'movingGap',    count: 3, gap: 0.14 },
            { kind: 'burst',   attack: 'spiralStream', count: 2, gap: 0.16 },
            { kind: 'sustain', attack: 'stream',       beats: 3, gap: 0.42 },
            { kind: 'sustain', attack: 'iris',         beats: 2, gap: 0.55 },
          ],
          restLo: 0.9, restHi: 1.5, restDist: 'decaying',  // the rest itself tightens toward each slam
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
    setpieces: [
      { id: 'figureEight', atPhase: 1, dur: 8.0, moving: true },                // P2: the pair leaves station, laces the eight
      { id: 'figureEight', atPhase: 2, dur: 7.0, moving: true, dread: true },   // P3: desperation keeps moving (Both Halves at Once)
    ],
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
    eyeWeakPoint: true,       // §5f law 5 (the turn-taking tell): CHIP DAMAGE ONLY LANDS WHILE THE EYE IS UP —
                              // the surfacing/submerging is the weak-point window (controller gates it CP2;
                              // the model owns eyeIsUp()/setEyeUp() and the unmistakable lid/glow animation)
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
    // Tier 3 difficulty: the geyser walls (tunnel/curtain/iris) are the tide's
    // signature; the slow tracking `stream` is the drone's sustained hose (the
    // amber carrier). Escalation by pattern unlock + cadence (floor 1.2), never
    // raw bullet count. BRINEHOLM idles SLOWER than any boss (the drone).
    phases: [
      { atFrac: 1.00, cadence: [1.6, 2.2], attacks: ['stream', 'aimed'] },                    // P1: the drone wakes (one long tide)
      { atFrac: 0.72, cadence: [1.5, 2.0], attacks: ['stream', 'tunnel', 'aimed'] },           // P2: the tide grows walls (rising geyser rings)
      { atFrac: 0.45, cadence: [1.4, 1.9], attacks: ['stream', 'iris', 'fan'] },               // P3: the bound strains (shackle amber; mercy softens)
      { atFrac: 0.20, cadence: [1.3, 1.7], attacks: ['curtain', 'iris', 'spiralStream', 'stream'] },  // P4: Sounding (dread — the floor erupts)
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
            { kind: 'burst',   attack: 'iris',   count: 2, gap: 0.5 },
            { kind: 'sustain', attack: 'fan',    beats: 1, gap: 1.6 },
          ],
          restLo: 3.2, restHi: 4.8, restDist: 'decaying',
        },
        { // P4 — Sounding (dread): the floor erupts; the tide reduced to a last swell
          // (the `stream` sustain doubles as the AMBER carrier under the geysers)
          ratioBurst: 0.4,
          phrase: [
            { kind: 'burst',   attack: 'curtain',      count: 2, gap: 0.45 },
            { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.45 },
            { kind: 'sustain', attack: 'stream',       beats: 2, gap: 1.4 },
            { kind: 'burst',   attack: 'spiralStream', count: 2, gap: 0.4 },
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
      { atFrac: 0.70, cadence: [1.15, 1.5], attacks: ['spiral', 'stream', 'aimed'] },           // P2: the ring condenses — radial fire
      { atFrac: 0.42, cadence: [1.1, 1.45], attacks: ['curtain', 'movingGap', 'fan'] },         // P3: the wall condenses — lane denial
      { atFrac: 0.18, cadence: [1.05, 1.4], attacks: ['spiralStream', 'crossfire', 'stream', 'iris'] }, // P4: Your Own Wings (dread)
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
};

// Registry slot 3 is ASHTALON (Colossi opener), slot 4 is MARROWCOIL, slot 5 is
// EITHERWING (the Colossi peak, the roster's only twin body), slot 6 is HOLLOWGATE
// (the Calamities opener), slot 7 is THRUMSWARM (the swarm); slot 8 is BRINEHOLM
// (a Calamity — the bound deep-sea leviathan head). CRAGHOLD is RETIRED (§5b L130)
// — its def + builder stay for the geometry-lesson lineage + its telegraph test,
// but it is OUT of the encounter rotation.
export const BOSS_ORDER = ['voidmaw', 'stormrend', 'ashtalon', 'marrowcoil', 'eitherwing', 'hollowgate', 'thrumswarm', 'brineholm'];

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
