// embertide — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const embertide = {
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
      { atFrac: 0.80, cadence: [1.25, 1.65], attacks: ['curtain', 'movingGap', 'crossfire'] },          // P2: the sets stack (a second crest, cut harder)
      { atFrac: 0.58, cadence: [1.15, 1.5],  attacks: ['crestfall', 'iris', 'stream'] },                // P3: the crest crosses the whole frame — CRESTFALL debuts (CP2-B full-frame emitter); `stream` is the amber crest-lock carrier
      { atFrac: 0.36, cadence: [1.1, 1.4],   attacks: ['curtain', 'iris', 'crestfall', 'crossfire'] },  // P4: full flood (every set at once) — the crest breaks alongside the walls; `crossfire` amber
      { atFrac: 0.16, cadence: [1.05, 1.35], attacks: ['curtain', 'movingGap', 'crossfire'] },          // P5: SKY SET LOOSE — Horizon Break (dread/survival) — pure-dodge at runtime; `crossfire` kept for the amberdiet floor (§5i.C survival exemption)
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
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.55 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.55 },
            { kind: 'sustain', attack: 'crossfire', beats: 1, gap: 0.8 },
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
        { // P5 — Horizon Break (dread/survival): the whole frame crests; the ebb is the escape hatch
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'curtain',   count: 3, gap: 0.45 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.45 },
            { kind: 'sustain', attack: 'crossfire', beats: 1, gap: 0.65 },
          ],
          restLo: 0.5, restHi: 2.7, restDist: 'bimodal',
        },
      ],
    },
};
