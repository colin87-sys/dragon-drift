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

export const BOSSES = {
  voidmaw: {
    id: 'voidmaw',
    name: 'VOIDMAW',
    title: 'the Sky Tyrant',
    epithet: 'The Hollow Judgment',   // bossTitleCard's reveal-card subtitle
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
  },

  stormrend: {
    id: 'stormrend',
    name: 'STORMREND',
    title: 'the Tempest Herald',
    epithet: 'Eye of the Unending Gale',   // bossTitleCard's reveal-card subtitle
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
  },

  craghold: {
    id: 'craghold',
    name: 'CRAGHOLD',
    title: 'the Sundered Colossus',
    epithet: 'The Hands That Held the Sky',   // the lore gap: held — what made them let go?
    hpMax: 260,
    // Boss-archetype dispatch (bossModel.js buildBoss): routes to the Stone
    // Colossus builder (bossColossus.js) — the first Tier 2 COLOSSUS
    // (BOSS-DESIGN.md §5b registry slot 3): a helmed stone bust flanked by two
    // enormous detached gesture HANDS that wind up every telegraph.
    archetype: 'stoneColossus',
    accent: 0x69c94f,         // moss/lichen green — the only unclaimed hue family at 30m
    glow: 0xafd06a,           // deep lichen-gold (shield rim / shards / backlight) — the first, paler pick read as a yellow balloon at shield-raise
    bulletColor: 0xff2b6a,    // danger stays magenta (role colour, never per-boss)
    approachFrom: 'behind',   // the colossus overtakes and rises over you
    scale: 2.0,               // Tier 2 escalation invariant (~2 vs the Sentinels' 1.5)
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
  },
};

export const BOSS_ORDER = ['voidmaw', 'stormrend', 'craghold'];

// Which boss to use for the Nth encounter of a run (cycles once the list is
// exhausted — more bosses just extend the list).
export function bossDefForIndex(i) {
  const key = BOSS_ORDER[i % BOSS_ORDER.length];
  return BOSSES[key];
}
