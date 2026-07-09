// weftwitch — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const weftwitch = {
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
    // LANCE V1 aim anchor (the karnvow lesson, PR #258: lockCandidates() returns only
    // lockParts + virtualLockOrgan — a def naming neither loses the whole aim/lock verb).
    // The organ IS the anchor (ashtalon muzzle-as-anchor precedent): the loom-heart is
    // always emitting, always under fire, never a free rest-beat paint. V2 lockParts
    // (per-spinneret brands?) are a CP2+ decision.
    virtualLockOrgan: 'loomHeart',
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
};
