// voidmaw — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const voidmaw = {
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
};
