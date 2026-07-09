// unmasked — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const unmasked = {
    id: 'unmasked',
    name: 'THE UNMASKED',                 // 12 chars (title-card budget ≤12)
    title: 'the Second Sun',
    epithet: 'What Wore the Sky as a Mask',
    tier: 5,                              // APEX (§5b band 5) — TIER_BUDGETS[5] = 30,000 tris / 120 draws
    hpMax: 240,                           // §5b Apex — PER-FORM health (multi-form boss, formLifebars): each of the 3 forms is fought from a FULL bar to 0, so the effective total is ~3×240=720 (a ~3.5-min apex fight). TUNE for length.
    formLifebars: true,                   // MULTI-FORM boss: each phase is its OWN full health bar. A form is "defeated" at 0 hp → shield → Surge through → the bar REFILLS full + the next form's transition plays. Only the LAST form's defeat is death. (THE UNMASKED: eclipse → seraph → unveiling, three full fights.)
    archetype: 'unmasked',                // dispatch → bossUnmasked.js (bossModel.js)
    // The pupil (STAGE 1) / the veiled core (STAGE 3) is the aim anchor; the ~20 eyes
    // (STAGE 2) become per-eye lock parts at CP2. V1: the always-watching focal eye.
    virtualLockOrgan: 'focalEye',
    muzzle: 'focalEye',                   // stage-1 bullets originate at the eye that watches
    accent: 0xf0e0a0,                     // gold rails/relics (identity accent, emissive only)
    glow: 0xffffff,                       // white corona — the reserved glow-shape (from slot 1)
    bulletColor: 0xff2b6a,                // danger magenta (role colour, never per-boss)
    approachFrom: 'ahead',                // CP2 upgrades to the secondSun.handoff() landmark approach
    scale: 2.4,                           // sky-scale — the disc hangs huge above the lane (TUNE in studio)
    stages: 3,                            // the stage system (CP2 dissolve-swaps the sub-rigs)
    stagesBuilt: 3,                       // how many stage sub-rigs exist: 1 eclipse-eye · 2 seraph · 3 the unveiling (star-eye + starburst + halo, wings mantled). Drives the dev stage-jump selector.
    grazeForm: 'medley',                  // §5i.B APEX graze — quotes the roster's graze forms (CP2)
    // Decision-C gate overrides (§7b sanctioned): ~20 eyes are many small bright points
    // (G1 assumes ONE focal); the wheels frame-fill (G4). Cited to the registry sanction.
    gate: { eyeCluster: true, frameFill: true },
    // PHASES = the 3 stages. PLACEHOLDER medley (zero new attack ids); CP2 wires the
    // real per-stage roster quote. amberdiet: every phase carries an amber carrier.
    phases: [
      { atFrac: 1.00, cadence: [1.6, 2.4], attacks: ['aimed', 'fan'] },                        // STAGE 1 — the second sun watches
      { atFrac: 0.60, cadence: [1.2, 1.8], attacks: ['fan', 'crossfire', 'movingGap', 'iris'] }, // STAGE 2 — the Ophanim medley
      { atFrac: 0.30, cadence: [1.1, 1.6], attacks: ['crossfire', 'stream', 'fan', 'iris'] },     // STAGE 3 — the unveiling (dread)
    ],
    // Spell cards (1:1 with phases; dread LAST). Names are placeholders in the honest
    // re-struck STAGE grammar; CP2 restrikes them per §5f (+ the one-frame VOIDMAW glitch).
    cards: [
      { id: 'unmasked_secondsun', name: 'I — The Second Sun',                     atFrac: 1.00, timer: 26 },
      { id: 'unmasked_ophanim',   name: 'II — Wheels Within Wheels',              atFrac: 0.60, timer: 30 },
      { id: 'unmasked_verdict',   name: 'WHAT WORE THE SKY — Every Verdict at Once', atFrac: 0.30, timer: 34, dread: true },
    ],
    // §5i THE MEDLEY — the finale quotes a different rest-ENVELOPE per stage (a literal
    // rhythmic medley: a sparse watching sun → a mixed Ophanim cadence → a tightening
    // dread), so the aggregate gap distribution is a fingerprint no single-envelope boss
    // owns (rhythmprint KS ≥ 0.20). CP2 replaces the phrases with the real roster quote.
    rhythm: {
      signature: 'medley',
      phases: [
        { // STAGE 1 — the second sun: very sparse, SPACIOUS, unhurried (it just watches).
          // Wide intra-phrase gaps + long uniform breaths — the finale's grandeur is in
          // the STILLNESS; no other roster boss's gap mass sits this high (rhythmprint).
          phrase: [
            { kind: 'sustain', attack: 'aimed', beats: 2, gap: 1.4 },
            { kind: 'burst',   attack: 'fan',   count: 2, gap: 1.1 },
          ],
          restLo: 2.7, restHi: 4.3, restDist: 'uniform',
        },
        { // STAGE 2 — the Ophanim medley: a stately mixed cadence (spaced wheel-turns),
          // still spacious — the grand quote, not a machine-gun.
          phrase: [
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 1.0 },
            { kind: 'sustain', attack: 'fan',       beats: 2, gap: 1.2 },
            { kind: 'burst',   attack: 'movingGap', count: 2, gap: 0.95 },
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.95 },
          ],
          restLo: 1.5, restHi: 2.4, restDist: 'uniform',
        },
        { // STAGE 3 — the unveiling: the dread tightens toward the core (decaying crescendo);
          // gaps still wide but closing — the surge-chase pressure builds.
          phrase: [
            { kind: 'burst',   attack: 'crossfire', count: 2, gap: 0.95 },
            { kind: 'sustain', attack: 'stream',    beats: 2, gap: 1.05 },
            { kind: 'burst',   attack: 'fan',       count: 2, gap: 0.9 },
            { kind: 'burst',   attack: 'iris',      count: 2, gap: 0.9 },
          ],
          restLo: 1.2, restHi: 2.5, restDist: 'decaying',
        },
      ],
    },
};
