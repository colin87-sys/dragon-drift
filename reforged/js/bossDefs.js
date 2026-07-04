// Boss definitions — data, not code. A boss is hp + a procedural model recipe +
// an ordered list of phases, each with its own attack set and fire cadence. The
// controller (boss.js) resolves attack ids to bullet patterns, so adding a boss
// is (mostly) authoring a new entry here. Tuning numbers default from CONFIG.BOSS.
//
// Phase `atFrac` is the hp fraction at which that phase BEGINS (1.0 = full hp).
// `attacks` are pattern ids understood by boss.js:
//   aimed  — three bullets near your position (precision sidestep, REFLECTABLE)
//   fan    — a wide spread across the lane (find the gap, REFLECTABLE)
//   spiral — an instant radial burst that flies outward
//   tunnel — a succession of bullet-rings rushing at you; weave the moving centre
//   spiralStream — a rotating emitter, arms sweeping around (read the spin)
//   curtain — a full 2D wall minus one safe lane placed away from you (commit early)
//   movingGap — timed wall rows whose gap slides sideways (track it in time)
//   iris — contracting rings; the safe zone shrinks to the centre (the showpiece)
//   stream — a tracking hose re-aiming at your live position (peel away in an arc)
//   secondWave — a spread, then a half-gap-offset spread where you dodged to
//   crossfire — two flanking emitters converge aimed spreads (REFLECTABLE)
// Pattern JOBS (danmaku design): fills deny the plane (camp-proof), anti-flee
// punishes a single relocation, garnish layers aimed shots on a structure.
// Difficulty escalates by unlocking streamed patterns + tightening cadence —
// never by raw bullet count (mobile visibleCap; density reads as unfair).
// `accent`/`glow` colour the boss BODY; `bulletColor` is the magenta danger colour.
// `constrictPhase`: phase index at which the arena walls slam in (showpiece).
//
// `tier` (1–5, REQUIRED): the band this boss sits in (BOSS-DESIGN.md §5b/§5g) —
// tests/boss.mjs keys the tri/draw ceilings off it (TIER_BUDGETS). Sentinels=1,
// Colossi=2, Calamities=3, World-Enders=4, the Apex=5.
//
// SPELL CARDS (§5f/§5h): `cards[]` names each phase as a title-carded set-piece,
// aligned 1:1 with `phases` (card[i] ↔ phase[i]). A card =
//   { id (stable, never the display name), name, atFrac (= its phase's),
//     timer (~20–30s capture window), dread? (exactly ONE, always last),
//     survival? (invincible seal — timeout snaps hp past atFrac) }.
// Naming grammar (§5f): "<FRAGMENT OF THE EPITHET> — <plain pattern name>".
// Capture = survive the card hitless; ledgered per-card (local-only, save.js).
// A def WITHOUT `cards` keeps the un-carded phase behaviour (coexist rule).

export const BOSSES = {
  voidmaw: {
    id: 'voidmaw',
    name: 'VOIDMAW',
    title: 'the Sky Tyrant',
    epithet: 'The Hollow Judgment',   // bossTitleCard's reveal-card subtitle
    tier: 1,                          // SENTINEL (§5b band 1)
    hpMax: 180,
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the
    // Hollow Idol-Mask hero builder (bossIdol.js) instead of the legacy
    // crystal-core construct. A def WITHOUT `archetype` still falls through
    // to the legacy path unchanged — that's the coexist rule this system is
    // built on (both bosses have now migrated; the fallback stays live for
    // any future def that doesn't set one yet).
    archetype: 'idolMask',
    accent: 0xa040ff,         // body reads violet so the magenta bullets pop as danger
    glow: 0xc89aff,
    bulletColor: 0xff2b6a,    // magenta = "this will hurt" (danger role colour, never per-boss)
    approachFrom: 'behind',   // 'behind' (overtakes you) | 'side' (sweeps in)
    tutorial: true,           // first boss: teaches the verbs one at a time, gently
    // VOIDMAW is the TUTORIAL boss — it introduces the mechanics one per phase with
    // slow, readable patterns. Later bosses layer in spiral / spiralStream / new
    // patterns and tighter cadences.
    phases: [
      { atFrac: 1.00, cadence: [1.9, 2.5], attacks: ['aimed'] },          // P1: dodge + PARRY (amber)
      { atFrac: 0.66, cadence: [1.6, 2.1], attacks: ['aimed', 'fan'] },   // P2: + spread to weave
      { atFrac: 0.33, cadence: [1.4, 1.9], attacks: ['aimed', 'fan', 'tunnel'] }, // P3: + rings to read
    ],
    // Spell cards (§5f grammar; last is the dread card — the §5f worked example).
    cards: [
      { id: 'voidmaw_verdict',  name: 'HOLLOW — Opening Verdict',            atFrac: 1.00, timer: 22 },
      { id: 'voidmaw_cloven',   name: 'HOLLOW — Cloven Sky',                 atFrac: 0.66, timer: 24 },
      { id: 'voidmaw_splitter', name: 'HOLLOW JUDGMENT — Sky-Splitting Verdict', atFrac: 0.33, timer: 26, dread: true },
    ],
  },

  stormrend: {
    id: 'stormrend',
    name: 'STORMREND',
    title: 'the Tempest Herald',
    epithet: 'Eye of the Unending Gale',   // bossTitleCard's reveal-card subtitle
    tier: 1,                               // SENTINEL (§5b band 1)
    hpMax: 220,
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the
    // Eye-of-the-Storm Mandala hero builder (bossMandala.js) instead of the
    // legacy crystal-core construct — see voidmaw's `archetype` comment above.
    archetype: 'stormMandala',
    accent: 0x2fd8e8,         // storm teal — reads apart from Voidmaw's violet at 30m
    glow: 0xffd870,           // gold storm-light
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'side',     // sweeps in like a squall, not an overtake
    // The first REAL boss (Voidmaw is the tutorial): walls and anti-flee patterns
    // instead of raw aimed shots — gentle dials, the lesson is READING, not speed.
    // Phase 3 is the showpiece: the arena constricts + contracting iris rings.
    constrictPhase: 2,
    body: {                   // storm silhouette (see bossModel.js `body` recipe)
      silhouette: 'shard',    // elongated prow vs Voidmaw's round orb
      spikeCount: 7, spikeLen: 2.4, spikeSweep: 0.9,   // swept-back storm vanes
      orbiterStyle: 'ringBlade', orbiterCount: 3,
      eyeCount: 1, coreDetail: 1,
    },
    phases: [
      { atFrac: 1.00, cadence: [1.8, 2.4], attacks: ['fan', 'curtain'] },              // P1: learn the wall
      { atFrac: 0.66, cadence: [1.6, 2.1], attacks: ['movingGap', 'stream', 'aimed'] },// P2: anti-flee
      { atFrac: 0.33, cadence: [1.4, 1.9], attacks: ['iris', 'secondWave', 'crossfire'] }, // P3: the storm
    ],
    cards: [
      { id: 'stormrend_wall',    name: 'UNENDING — Gale Wall',            atFrac: 1.00, timer: 22 },
      { id: 'stormrend_squall',  name: 'UNENDING GALE — Shifting Squall', atFrac: 0.66, timer: 24 },
      { id: 'stormrend_eye',     name: 'EYE OF THE GALE — Heart of the Storm', atFrac: 0.33, timer: 26, dread: true },
    ],
  },

  craghold: {
    id: 'craghold',
    name: 'CRAGHOLD',
    title: 'the Sundered Colossus',
    epithet: 'The Hands That Held the Sky',   // the lore gap: held — what made them let go?
    tier: 2,                                  // COLOSSUS (§5b band 2)
    hpMax: 260,
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the Stone
    // Colossus builder (bossColossus.js) — the first Tier 2 COLOSSUS
    // (BOSS-DESIGN.md §5b registry slot 3), rebuilt after design review to
    // resolve a concept collision with Voidmaw (boss 1): CRAGHOLD is now TWO
    // COLOSSAL BASALT HANDS WITH AN EYE IN EACH PALM and NO HEAD — a shattered
    // stone crown floats alone in the sky where a head would be. Boss 1 is a
    // face with no body; boss 3 is a body with no face.
    archetype: 'stoneColossus',
    accent: 0x69c94f,         // moss/lichen green — the only unclaimed hue family at 30m
    glow: 0xafd06a,           // deep lichen-gold (shield rim / shards / backlight) — the first, paler pick read as a yellow balloon at shield-raise
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'behind',   // the colossus overtakes and rises over you
    scale: 2.4,               // Tier 2 escalation invariant — COLOSSAL (Sentinels sit at 1.5)
    constrictPhase: 2,        // phase 3: the walls close on the constricted-arena showpiece
    // The crossing-pass setpiece (Tier 2 "the fight moves"): at phase-2 entry
    // the colossus leaves station and drifts across the lane directly over the
    // player, hands spread — the fly-under scale-contrast frame. Read by the
    // controller's def-gated setpiece seam; inert for defs without it.
    setpiece: { id: 'crossingPass', atPhase: 1, dur: 5.0 },
    // Tier 2 difficulty: spiral + spiralStream DEBUT here (first boss to use
    // them), cadences one notch tighter than Stormrend per band — escalation
    // by pattern unlocks + cadence, never raw bullet count.
    phases: [
      { atFrac: 1.00, cadence: [1.7, 2.2], attacks: ['fan', 'spiral', 'aimed'] },              // P1: the radial fill debuts
      { atFrac: 0.66, cadence: [1.5, 2.0], attacks: ['spiralStream', 'crossfire', 'stream'] }, // P2: the hands converge (after the crossing pass)
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['curtain', 'spiralStream', 'crossfire'] },// P3: walls in the constricted arena
    ],
    cards: [
      { id: 'craghold_reach',   name: 'HELD THE SKY — Sundered Reach',        atFrac: 1.00, timer: 24 },
      { id: 'craghold_grasp',   name: 'THE HANDS — Converging Grasp',         atFrac: 0.66, timer: 26 },
      { id: 'craghold_clasp',   name: 'HANDS THAT HELD THE SKY — Colossal Clasp', atFrac: 0.33, timer: 28, dread: true },
    ],
  },

  ashtalon: {
    id: 'ashtalon',
    name: 'ASHTALON',
    title: 'the Ember Hunter',
    epithet: 'What the Ash Still Hunts',   // the lore gap: what is it hunting FOR?
    tier: 2,                               // COLOSSUS (§5b band 2), slot-3 opener
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
  },

  marrowcoil: {
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
      { id: 'ribThread',   atPhase: 1, dur: 6.5, moving: true },
      { id: 'closingRibs', atPhase: 2, dur: 6.0, moving: true, dread: true },
    ],
    // Tier 2 difficulty: iris DEBUTS as expanding bone-white rings off the coil
    // circles (emitter = organ, §5f law 7); cadences one notch tighter toward the
    // Closing Ribs. Escalation by pattern unlock + cadence, never raw count.
    phases: [
      { atFrac: 1.00, cadence: [1.5, 2.0], attacks: ['aimed', 'fan'] },                    // P1: read the bone rings
      { atFrac: 0.66, cadence: [1.4, 1.8], attacks: ['iris', 'stream', 'crossfire'] },     // P2: the coil rings expand (fly-through)
      { atFrac: 0.33, cadence: [1.3, 1.7], attacks: ['iris', 'movingGap', 'spiralStream'] },// P3: the closing ribs (dread)
    ],
    cards: [
      { id: 'marrowcoil_surface', name: 'SKY COULD NOT — Surfacing',        atFrac: 1.00, timer: 22 },
      { id: 'marrowcoil_rings',   name: 'NOT DIGEST — Ring of Ribs',        atFrac: 0.66, timer: 24 },
      { id: 'marrowcoil_closing', name: 'MARROW — The Closing Ribs',        atFrac: 0.33, timer: 28, dread: true },
    ],
  },
};

// Registry slot 3 is ASHTALON (Colossi opener), slot 4 is MARROWCOIL; CRAGHOLD
// is RETIRED (§5b L130) — its def + builder stay for the geometry-lesson lineage
// and its own telegraph test, but it is OUT of the encounter rotation.
export const BOSS_ORDER = ['voidmaw', 'stormrend', 'ashtalon', 'marrowcoil'];

// Which boss to use for the Nth encounter of a run (cycles once the list is
// exhausted — more bosses just extend the list).
export function bossDefForIndex(i) {
  const key = BOSS_ORDER[i % BOSS_ORDER.length];
  return BOSSES[key];
}
