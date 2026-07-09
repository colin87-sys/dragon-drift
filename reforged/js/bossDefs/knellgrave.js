// knellgrave — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const knellgrave = {
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
    // §5e THE LAST TOLL setpiece (P4, dread+survival — the mid-fight clapper reveal,
    // the audit's named "awe fix"): the bell swings down + forward until it hangs
    // DIRECTLY OVERHEAD (rel≈3, the mouth above your head, the prisoner straining in
    // the gaping crack seen from beneath), rides there through the accelerating tolls,
    // then hauls back. moving: the survival tolls keep firing (a pure-dodge exam —
    // the card's seal deflects all damage; the unfillable bar is the tell).
    setpieces: [
      { id: 'lastToll', atPhase: 3, dur: 26, moving: true, dread: true },
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
    phases: [
      { atFrac: 1.00, cadence: [1.4, 1.7], attacks: ['iris', 'aimed'] },              // P1: The First Toll
      { atFrac: 0.70, cadence: [1.3, 1.6], attacks: ['iris', 'crossfire', 'aimed'] }, // P2: The Second Toll — RHYTHM PARRY card (amber chain on the beat)
      { atFrac: 0.45, cadence: [1.2, 1.5], attacks: ['iris', 'fan', 'aimed'] },       // P3: Pendulum Sweep (the perpendicular cross)
      { atFrac: 0.25, cadence: [1.1, 1.4], attacks: ['iris', 'fan', 'aimed'] },       // P4: The Last Toll (survival) — 'aimed' kept for amberdiet
    ],
    // Spell cards (§5f grammar; 4 cards 1:1 with phases — the card gate asserts
    // cards.length === phases.length and each card.atFrac === its phase's; dread
    // card LAST). Naming grammar "<EPITHET FRAGMENT> — <plain pattern>". The brief's
    // 4-card set is reconciled to 4 phases (the Sweep promoted to its own phase) so
    // the atFracs align. The dread card is ALSO the roster's survival card (×2 max,
    // §5f — slots 10 + 13): boss sealed, pure rhythm dodge; timeout snaps hp past atFrac.
    cards: [
      { id: 'knellgrave_first',  name: 'IT RINGS — The First Toll',   atFrac: 1.00, timer: 24 },
      { id: 'knellgrave_second', name: 'IT RINGS — The Second Toll',  atFrac: 0.70, timer: 26 },   // the RHYTHM PARRY card: a 4–6 amber chain on the toll
      { id: 'knellgrave_sweep',  name: 'IT RINGS — Pendulum Sweep',   atFrac: 0.45, timer: 26 },
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
        { // P1 — The First Toll: slow, regular tolls (the ring-wall on the beat) + aimed amber
          ratioBurst: 0.0,
          phrase: [
            { kind: 'sustain', attack: 'iris',  beats: 2, gap: [1.4, 1.6] },
            { kind: 'sustain', attack: 'aimed', beats: 1, gap: 1.5 },
          ],
          restLo: 1.5, restHi: 1.7, restDist: 'uniform',   // the metronomic toll — low variance, tighter than voidmaw
        },
        { // P2 — The Second Toll: the RHYTHM PARRY chain (crossfire amber) lands ON the toll
          ratioBurst: 0.3,
          phrase: [
            { kind: 'sustain', attack: 'iris',      beats: 2, gap: [1.25, 1.45] },
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.42 },   // the 4–6 amber chain on the beat
            { kind: 'sustain', attack: 'aimed',     beats: 1, gap: 1.35 },
          ],
          restLo: 1.35, restHi: 1.55, restDist: 'uniform',
        },
        { // P3 — Pendulum Sweep: the perpendicular cross; the tolls tighten
          ratioBurst: 0.2,
          phrase: [
            { kind: 'sustain', attack: 'iris',  beats: 2, gap: [1.15, 1.35] },
            { kind: 'sustain', attack: 'fan',   beats: 1, gap: 1.25 },
            { kind: 'sustain', attack: 'aimed', beats: 1, gap: 1.25 },
          ],
          restLo: 1.2, restHi: 1.4, restDist: 'uniform',
        },
        { // P4 — The Last Toll (dread/survival): nine ACCELERATING tolls (the rest
          // DECAYS toward each — the crescendo to silence). 'aimed' keeps the phase
          // amber-capable for amberdiet; the card SEALS it pure-dodge at runtime.
          ratioBurst: 0.35,
          phrase: [
            { kind: 'sustain', attack: 'iris',  beats: 3, gap: [0.95, 1.15] },
            { kind: 'sustain', attack: 'aimed', beats: 1, gap: 1.05 },
            { kind: 'sustain', attack: 'fan',   beats: 1, gap: 1.0 },
          ],
          restLo: 0.9, restHi: 1.5, restDist: 'decaying',   // the toll accelerates toward the last beat
        },
      ],
    },
};
