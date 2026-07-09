// thrumswarm — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const thrumswarm = {
    id: 'thrumswarm',
    name: 'THRUMSWARM',
    title: 'the Murmuring Choir',
    epithet: 'A Thousand That Remember Being One',   // the lore gap: one WHAT? a faint violet dust ties it to Voidmaw's remains
    tier: 3,                          // CALAMITY (§5b band 3), slot-7 — the pale-swarm after slot 6's pale arch
    hpMax: 380,                       // Tier 3 band (360–450); opens gentler than the slot-9 peak, grander in spectacle
    // Boss-archetype dispatch (bossModel.js buildBoss): the Swarm builder
    // (bossThrumswarm.js) — BOSS-DESIGN.md §5b registry slot 7, the roster's only
    // SWARM: a stippled field of dark motes around a bright QUEEN that CONDENSES
    // into authored shapes — including a giant copy of the player's OWN dragon
    // (the meme frame). Distinct from every prior slot: not a mask (1), ring-eye
    // (2), raptor (3), skeleton (4), twin darts (5), or an arch (6).
    archetype: 'thrumswarm',
    muzzle: 'queenGroup',     // aimed/amber patterns emit from the queen (emitter = organ, L148); the amber eye is the carrier
    // LANCE tier-3 anatomy (PR6): deliberately a ONE-ORGAN lock fight — the
    // queen is the only solid body in a cloud of shared-name motes, so cap 5
    // never fills here (queen ×2 stack ≈ 2 pips); THRUMSWARM's verb is the
    // scatter-stagger PARRY, and painting stays a side-dish. The scatter state
    // already pauses painting via lockDeflected (condenseInvuln). During the
    // SPEAR formation the queen parks off-arena (x≈15.6 > lane 13) — the lock
    // drops and re-acquires on settle; transient by design, cones untouched.
    lockParts: [{ part: 'queenGroup' }],
    accent: 0xffa838,         // AMBER — the queen's ONE eye (the focal AND the amber-carrier organ, §5i.C). The
                              // registry palette claim is value (void-black·star-white); amber is the small focal
                              // accent (≈37°, far clear of danger-magenta's 327–357° reserved band). Row updated.
    glow: 0xdfe4ff,           // STAR-WHITE cool (shield rim / shards / lantern backlight) — the value identity
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'condense',  // §5j new branch: the unlit motes converge from AHEAD and click into the copy
    entrance: 'shapeItRemembers', // §5j THE SHAPE IT REMEMBERS (hijack 2.8s @0.24×): the swarm condenses into
                              // YOU and the copy's head performs a glance-back (falls back to the plain approach if absent)
    scale: 1.2,               // CALAMITY presence: the YOUR-DRAGON copy spans ~32 world units (GIANT, fills the frame; L140/L141)
    // §5f dread card is the swarm becoming your dragon on your recorded path
    // ("A THOUSAND — Your Own Wings"). Chip damage ONLY lands while the swarm is
    // CONDENSED (scattered = invulnerable — the turn-taking tell, §5f law 5); the
    // condense/scatter cycle is the puzzle read. (CP2 wires the invuln gate + the
    // input/pose ring buffer that replays the player's own flight path.)
    condenseInvuln: true,
    // §5i.B Calamities graze debut: ABSORB-A-COLOR — the swarm sheds surge-pink
    // motes braided into the magenta stream; the player weaves in and SOAKS them
    // (feeds the Surge meter). ANATOMY: the pink motes are shed by the swarm body.
    // Def-gated (uses slot 6's continuous-graze detector); shipped bosses inert.
    grazeForm: 'absorbColor',
    // §5e moving-station setpieces: CONDENSE PASS (P2 — the swarm sweeps the lane
    // condensing to fire) and YOUR OWN WINGS (P4 dread — the copy flies the player's
    // RECORDED flight path back at them via the §5e input/pose ring buffer; the §5f
    // rule-break, boss-side mirroring that never touches input). Both moving (fire
    // while they travel).
    setpieces: [
      { id: 'condensePass', atPhase: 1, dur: 7.0, moving: true },
      { id: 'yourWings',    atPhase: 3, dur: 8.0, moving: true, dread: true },
    ],
    // Tier 3 difficulty: the swarm's condensations ARE the patterns — ring/wall
    // formations fire radial/curtain volleys; the queen's amber eye aims the amber
    // carrier. Escalation by pattern unlock + cadence (floor 1.2), never raw count.
    phases: [
      { atFrac: 1.00, cadence: [1.2, 1.6], attacks: ['aimed', 'fan'] },                         // P1: the murmur (loose swarm, aimed amber from the eye)
      { atFrac: 0.70, cadence: [1.15, 1.5], attacks: ['spiral', 'stream', 'aimed'] },           // P2: the ring condenses — radial fire
      { atFrac: 0.42, cadence: [1.1, 1.45], attacks: ['curtain', 'movingGap', 'fan'] },         // P3: the wall condenses — lane denial
      { atFrac: 0.18, cadence: [1.05, 1.4], attacks: ['spiralStream', 'crossfire', 'stream', 'iris'] }, // P4: Your Own Wings (dread)
    ],
    // Spell cards (§5f grammar; 4 cards — the Calamities band floor (§5g); dread
    // card LAST, name fixed by the §5f signature-move assignment). Naming grammar:
    // "<EPITHET FRAGMENT> — <plain pattern>".
    cards: [
      { id: 'thrumswarm_murmur', name: 'REMEMBER — First Murmur',       atFrac: 1.00, timer: 24 },
      { id: 'thrumswarm_ring',   name: 'THAT REMEMBER — Ring of Motes', atFrac: 0.70, timer: 24 },
      { id: 'thrumswarm_wall',   name: 'BEING ONE — Condensing Wall',   atFrac: 0.42, timer: 26 },
      { id: 'thrumswarm_wings',  name: 'A THOUSAND — Your Own Wings',   atFrac: 0.18, timer: 28, dread: true },
    ],
    // §5i PRESSURE OSTINATO (slot 7) — NO true rests; the micro-pauses live INSIDE
    // the swarm's condensation cycle (a tight, relentless dense pulse). Every gap
    // sits low (≤0.6) and the "rest" is barely longer than a gap (0.5–0.85) — a
    // low tight cluster no other boss's distribution makes (every shipped boss's
    // gap mass has a long tail or a bimodal breath; rhythmprint KS floor ≥0.34).
    rhythm: {
      signature: 'pressure-ostinato',
      ticket: { bpm: 132, quantize: '1/8' },   // the swarm's fast thrum; condensations land on the beat
      phases: [
        { // P1 — the murmur: a steady dense pulse, the eye's aimed amber woven in
          ratioBurst: 0.5,
          phrase: [
            { kind: 'sustain', attack: 'aimed', beats: 3, gap: 0.42 },
            { kind: 'burst',   attack: 'fan',   count: 2, gap: 0.3 },
          ],
          restLo: 0.6, restHi: 0.85, restDist: 'uniform',   // no breath — the pressure never lifts
        },
        { // P2 — the ring: radial streams inside the ostinato
          ratioBurst: 0.55,
          phrase: [
            { kind: 'burst',   attack: 'spiral', count: 3, gap: 0.26 },
            { kind: 'sustain', attack: 'stream', beats: 2, gap: 0.4 },
            { kind: 'sustain', attack: 'aimed',  beats: 1, gap: 0.4 },
          ],
          restLo: 0.55, restHi: 0.8, restDist: 'uniform',
        },
        { // P3 — the wall: tight curtain bursts, the pauses still inside the cycle
          ratioBurst: 0.6,
          phrase: [
            { kind: 'burst',   attack: 'curtain',   count: 2, gap: 0.28 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.28 },
            { kind: 'burst',   attack: 'fan',       count: 2, gap: 0.28 },
          ],
          restLo: 0.5, restHi: 0.75, restDist: 'uniform',
        },
        { // P4 — Your Own Wings (dread): densest, crossfire from the wing motes
          ratioBurst: 0.7,
          phrase: [
            { kind: 'burst',   attack: 'spiralStream', count: 3, gap: 0.24 },
            { kind: 'burst',   attack: 'crossfire',    count: 2, gap: 0.24 },
            { kind: 'sustain', attack: 'stream',       beats: 2, gap: 0.36 },
            { kind: 'burst',   attack: 'iris',         count: 2, gap: 0.24 },
          ],
          restLo: 0.5, restHi: 0.72, restDist: 'uniform',
        },
      ],
    },
};
