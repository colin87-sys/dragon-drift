// onewing — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const onewing = {
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
      { atFrac: 0.78, cadence: [1.2, 1.8], attacks: ['movingGap', 'crossfire', 'aimed'] }, // P2: The Ghost Half (the dead twin's volley begins, as ghost-bullets — CP2)
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
      { id: 'onewing_ghosthalf', name: 'WOULD NOT DIE — The Ghost Half',     atFrac: 0.78, timer: 26 },
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
};
