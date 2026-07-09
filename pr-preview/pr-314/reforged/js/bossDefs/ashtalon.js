// ashtalon — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const ashtalon = {
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
};
