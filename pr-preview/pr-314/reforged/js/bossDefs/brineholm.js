// brineholm — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const brineholm = {
    id: 'brineholm',
    name: 'BRINEHOLM',
    title: 'the Bound Leviathan',
    epithet: 'The Island That Breathes',   // lore gap: bound by the SAME chain-maker as the hunter (ASHTALON) — point, never answer
    tier: 3,                          // CALAMITY (§5b band 3), slot 8 — the band's RELIEF texture (a breather after THRUMSWARM)
    hpMax: 410,                       // Tier 3 band (360–450); sits mid-band (opener HOLLOWGATE 360; the sawtooth)
    // Boss-archetype dispatch (bossModel.js buildBoss): the Bound-Leviathan
    // builder (bossBrineholm.js) — BOSS-DESIGN.md §5b registry slot 8: a
    // bottom-anchored ridge that NEVER fully fits the frame (the SotC
    // first-colossus scale read). Only a whale-back ridge, four fin-sails, and one
    // surfacing arena-sized EYE break the frame. Distinct from every prior slot:
    // not a mask (1), ring-eye (2), raptor (3), skeleton (4), twin darts (5),
    // arch (6), or swarm (7) — a horizon-anchored leviathan.
    archetype: 'brineholm',
    muzzle: 'brineMaw',       // the beast EXHALES its volleys/geysers from the MAW (emitter = organ, L148)
    accent: 0x3ad0b0,         // ABALONE sea-green — the iridescent banding's dominant tone (the identity hue).
                              // Sits ~168° — clear of danger-magenta's 327–357° reserved band AND of pure
                              // reflected-cyan (~185°+); the near-black hull + white eye complete the read
    glow: 0xbfe6dd,           // pale abalone-white (shield rim / shards / eye backlight)
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'below',    // §5e below-horizon rise: the hull INHALES up through the fog floor
    startDepth: -14,          // §5d: the rise starts deepened at y≈−14 (the engine reads this per-def; lands CP2)
    entrance: 'reefWasBreathing',  // §5j THE REEF WAS BREATHING (hijack ≤3s): the crest teases at WARN behind a
                              // scoped sub-rig exemption, then the 24-unit hull inhales up with the canon
                              // HESITATION hold; the eye stays submerged (a pale glow) until the iris LOCKS at settle
    scale: 1.5,               // CALAMITY "never fits the frame": hull ~36 world units — EXCEEDS the ~34-wide
                              // portrait envelope at rel 30 (its scale IS being partly off-screen, L140/L141)
    // LANCE tier-3 anatomy (PR6): the eye + the three shackle posts — the clean
    // cap-5 spread (eye ×2 stack + 3 shackles = 5). The eye only paints while
    // UP (eyeWeakPoint already feeds lockDeflected — sealed honesty for free);
    // shackles gate OUT of P4 (the sounding — the head submerges and freed
    // posts should not re-offer). A freed shackle leaves the paintable set via
    // the PR6 liveness filter and its brand is dropped. Outer posts sit LATERAL
    // (world x ±~6.75) — a real side reach, but pulled in from the ±13 lane wall
    // so branding them is a commit, not a crash-and-die.
    lockParts: [
      { part: 'eyeRig' },
      { part: 'shacklePost0', phases: [0, 1, 2] },
      { part: 'shacklePost1', phases: [0, 1, 2] },
      { part: 'shacklePost2', phases: [0, 1, 2] },
    ],
    eyeWeakPoint: true,       // §5f law 5 (the turn-taking tell): CHIP DAMAGE ONLY LANDS WHILE THE EYE IS UP —
                              // the surfacing/submerging is the weak-point window (controller gates it CP2;
                              // the model owns eyeIsUp()/setEyeUp() and the unmistakable lid/glow animation)
    eyeOrgan: 'eyeRig',       // the paintable lockPart the eye-weak-point seals: while the eye is DOWN it
                              // leaves the paintable set (the shackles stay brandable), rejoining when it surfaces
                              // (owner playtest — "while the eye's down I can't tag the shackles either")
    // §5f DESTRUCTIBLE SUB-PARTS (the CAVE-law mercy mechanic): the 3 shackle
    // posts are individually breakable — parry a post's amber strain-volley 3×
    // (SHACKLE BREAK, the registry parry job) or land shots on it, and it SNAPS:
    // it vents a 2× pink SPRAY-SOAK graze beat and each post freed EARLY softens
    // phase 3 (mercy as a mechanic). Reuses slot 6's per-part hit test; boss.js
    // routes the bossDamage part/x-y payload; the model owns crackShackle().
    destructibleShackles: true,
    // §5i.B Calamities graze debut: SHADOW-RIDE + SPRAY-SOAK — ride the whale's
    // lee (its shadow) vs the geysers; a freed shackle vents a 2×-value pink spray
    // for one beat before hardening lethal (anatomy: the lee is the body's shadow,
    // the spray is the shackle venting). Def-gated (the continuous detector, slot 6).
    grazeForm: 'shadowRide',
    // §5e below-frame setpiece — SOUNDING (dread, P4): the head DIVES below the
    // frame and the arena floor erupts in geyser curtains from below (the P4
    // patterns keep firing — a MOVING setpiece). The below-frame counterpart to
    // ASHTALON's stoop-from-above; the model dread-submerges on top (setSetpiece
    // k,{dread}). Landed CP2: the `sounding` SETPIECE_PATHS dive drives the pose.
    setpieces: [
      { id: 'sounding', atPhase: 3, dur: 7.5, moving: true, dread: true },   // P4 THE ISLAND BREATHES — Sounding
    ],
    // Tier 3 difficulty: the geyser walls (tunnel/curtain/iris) are the tide's
    // signature; the slow tracking `stream` is the drone's sustained hose (the
    // amber carrier). Escalation by pattern unlock + cadence (floor 1.2), never
    // raw bullet count. BRINEHOLM idles SLOWER than any boss (the drone).
    phases: [
      { atFrac: 1.00, cadence: [1.6, 2.2], attacks: ['stream', 'aimed'] },                    // P1: the drone wakes (one long tide)
      { atFrac: 0.72, cadence: [1.5, 2.0], attacks: ['stream', 'tunnel', 'aimed'] },           // P2: the tide grows walls (rising geyser rings)
      { atFrac: 0.45, cadence: [1.4, 1.9], attacks: ['stream', 'iris', 'fan'] },               // P3: the bound strains (shackle amber; mercy softens)
      { atFrac: 0.20, cadence: [1.3, 1.7], attacks: ['curtain', 'iris', 'spiralStream', 'stream'] },  // P4: Sounding (dread — the floor erupts)
    ],
    // Spell cards (§5f grammar; 4 cards — the Calamities band's move-set floor
    // (§5g); dread card LAST, name fixed by the §5f signature-move assignment).
    cards: [
      { id: 'brineholm_swell',    name: 'THE ISLAND — First Swell',       atFrac: 1.00, timer: 24 },
      { id: 'brineholm_drone',    name: 'IT BREATHES — Tidal Drone',      atFrac: 0.72, timer: 24 },
      { id: 'brineholm_bound',    name: 'THE BOUND — Straining Chains',   atFrac: 0.45, timer: 26 },
      { id: 'brineholm_sounding', name: 'THE ISLAND BREATHES — Sounding', atFrac: 0.20, timer: 28, dread: true },
    ],
    // §5i TIDAL DRONE (slot 8) — sustain-only, the SLOWEST pulse in the roster:
    // long sustained tides (the drone's hose) whose gaps NEVER drop below ~1.4s
    // (every other roster boss idles with sub-1s gaps — the rhythmprint KS
    // fingerprint), separated by a long BREATH (the authored rest, §5i rest-beat
    // law — DECAYING: the swell peaks then eases, an exhale). The band's RELIEF
    // texture — a breather after THRUMSWARM's pressure ostinato.
    rhythm: {
      signature: 'tidal-drone',
      ticket: { bpm: 44, quantize: '1/2' },   // the slowest pulse — a half-note tide
      phases: [
        { // P1 — the drone wakes: one long sustained tide, then a long breath
          ratioBurst: 0.0,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [1.7, 2.2] },
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: 1.8 },
          ],
          restLo: 3.6, restHi: 5.4, restDist: 'decaying',   // the exhale (the slowest rest in the roster)
        },
        { // P2 — the tide grows walls: the drone + a rising geyser ring
          ratioBurst: 0.15,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [1.6, 2.0] },
            { kind: 'burst',   attack: 'tunnel', count: 2, gap: 0.5 },
          ],
          restLo: 3.4, restHi: 5.0, restDist: 'decaying',
        },
        { // P3 — the bound strains: the tide + contracting rings; `fan` = the shackle amber
          ratioBurst: 0.2,
          phrase: [
            { kind: 'sustain', attack: 'stream', beats: 3, gap: [1.5, 1.9] },
            { kind: 'burst',   attack: 'iris',   count: 2, gap: 0.5 },
            { kind: 'sustain', attack: 'fan',    beats: 1, gap: 1.6 },
          ],
          restLo: 3.2, restHi: 4.8, restDist: 'decaying',
        },
        { // P4 — Sounding (dread): the floor erupts; the tide reduced to a last swell
          // (the `stream` sustain doubles as the AMBER carrier under the geysers)
          ratioBurst: 0.4,
          phrase: [
            { kind: 'burst',   attack: 'curtain',      count: 2, gap: 0.45 },
            { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.45 },
            { kind: 'sustain', attack: 'stream',       beats: 2, gap: 1.4 },
            { kind: 'burst',   attack: 'spiralStream', count: 2, gap: 0.4 },
          ],
          restLo: 2.8, restHi: 4.4, restDist: 'decaying',
        },
      ],
    },
};
