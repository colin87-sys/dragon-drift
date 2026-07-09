// hollowgate — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const hollowgate = {
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
};
