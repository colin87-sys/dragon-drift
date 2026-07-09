// eitherwing — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const eitherwing = {
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
};
