// stormrend — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const stormrend = {
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
      { atFrac: 0.66, cadence: [1.6, 2.1], attacks: ['fan', 'movingGap'] },          // P2: the wall now MOVES (anti-flee)
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
        { phrase: [{ kind: 'sustain', attack: 'fan', beats: 1, gap: 0.65 }, { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.65 }],
          restLo: 1.1, restHi: 2.3, restDist: 'decaying' },
        { phrase: [{ kind: 'sustain', attack: 'fan', beats: 1, gap: 0.55 }, { kind: 'sustain', attack: 'movingGap', beats: 1, gap: 0.55 }, { kind: 'sustain', attack: 'iris', beats: 1, gap: 0.55 }],
          restLo: 0.9, restHi: 2.1, restDist: 'decaying' },
      ],
    },
};
