// marrowcoil — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const marrowcoil = {
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
    virtualLockOrgan: 'skullGroup',   // V1 aim anchor (big, central) — live even before V2
                                      // unlocks. On a V2 boss the anchor is ALSO brandable
                                      // (paintableParts adds it): the head is the easy first
                                      // mark, then UNPAINTED-FIRST drives the sweep to the ribs.
    // V2 LANCE-PAINT anatomy (PR2, the teach fight): the four rib emitters — the SAME
    // pivots that vent the parryable rib ambers, so the C3 exemption is felt here first
    // (a venting rib can't be dwell-painted; parry-paint is PR4's answer). All phases.
    // (+ the skull head via virtualLockOrgan → 5 brand targets, cap 3.)
    lockParts: [
      { part: 'ribPivotL1' }, { part: 'ribPivotR1' },
      { part: 'ribPivotL3' }, { part: 'ribPivotR3' },
    ],
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
};
