// craghold — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const craghold = {
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
};
