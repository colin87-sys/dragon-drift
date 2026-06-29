// Central tuning constants for Dragon Drift.
export const CONFIG = {
  // Flight lane bounds
  laneHalfWidth: 13,
  laneMinY: 2.5,
  laneMaxY: 22,
  playerRadius: 1.2,

  // Speed system
  baseSpeed: 35,
  boostSpeed: 65,
  orbSpeed: 80,
  orbDuration: 2,
  speedEase: 3,
  lateralSpeed: 24,
  verticalSpeed: 18,
  moveAccel: 6,

  // Time-based speed ramp (separate from distance difficulty)
  speedRampStart: 20,     // seconds before ramp begins
  speedRampEnd: 90,       // seconds to reach max ramp
  speedRampMax: 1.35,     // max multiplier on base/boost speed
  lineDesignSpeed: 80 * 1.35,
  minRewardHopTime: 0.72,
  idealRewardHopTime: 0.85,
  lateGameReachSafety: 0.68,
  gateReachSafety: 0.62,
  boostSteeringBonus: 1.15,

  // Stamina system — boost is a STRATEGIC resource, not a permanent hold. It
  // depletes if you just hold it; normal rings only PARTLY pay for it; perfect
  // rings pay more; speed orbs are the real boost-extender; and Dragon Surge
  // eases the burn but never makes it free. (Per-dragon drain/regen stats still
  // scale these, so the stamina stat actually matters.) Tune by feel.
  staminaMax: 110,
  staminaDrain: 20,
  staminaRegen: 16,
  staminaRegenDelay: 0.8,
  ringStamina: 11,
  perfectRingStaminaBonus: 6,   // perfect rings refund this much ON TOP of ringStamina
  gateStamina: 13,
  orbStamina: 35,
  feverStaminaDrainMult: 0.65,  // Dragon Surge eases the boost burn (× drain, not free)

  // Health / collision
  healthMax: 100,
  obstacleDamage: 25,
  groundDamage: 15,
  invulnTime: 1.0,

  // Scoring
  ringScore: 100,
  ringCenterBonus: 50,
  ringCenterRadius: 1.4,
  gateScore: 150,
  comboStep: 0.25,
  comboMax: 5,
  distanceScore: 1,
  milestoneStep: 500,     // distance popup every N metres

  // Near-miss system
  nearMissBonus: 25,
  nearMissCooldown: 1.8,  // seconds before same obstacle can award near-miss again

  // Assist-off score bonuses (settings): flying without the target reticle
  // and/or without last-chance slow-mo pays a permanent score multiplier.
  reticleOffBonus: 0.10,
  slowMoOffBonus: 0.15,
  // Glide Assist (beginner auto-fly): trades a slice of the score multiplier for
  // accessibility — the inverse of the assist-off bonuses above.
  glideAssistScoreMult: 0.7,

  // Barrel roll (dodge move: brief i-frames, near-misses still award)
  rollDuration: 0.45,
  rollCooldown: 1.2,
  rollImpulse: 30,        // lateral velocity kick
  rollInvuln: 0.5,        // i-frame window from roll start
  rollBonus: 50,          // style points × combo

  // Surge phase-through: during Dragon Surge, a well-timed barrel roll shatters
  // through a crystal wall (gate) that would normally crash you. Spends stamina
  // (which is why the stamina budget above is generous) and pays style points.
  phaseStaminaCost: 40,
  phaseBonus: 150,        // style points × combo on a successful (minor) phase
  // Tiered phase feel (modeled on perfect rings): a cleanly-timed roll just before
  // the wall keeps lots of i-frame window left at the crossing → PERFECT; a desperate
  // last-instant roll scrapes through → minor. Forgiving window, like a perfect dodge.
  phasePerfectWindow: 0.18,       // rollInvuln (s) remaining at the wall to count as perfect
  phasePerfectBonus: 200,         // extra style points × combo on a perfect phase
  phasePerfectStaminaRefund: 22,  // refund of the cost on a perfect (net ~18 spent)
  phaseShatterDur: 0.35,          // wall scatter animation length (s)

  // Fever / Dragon Surge
  feverThreshold: 8,      // legacy display fallback
  firstFeverThreshold: 5,
  normalFeverThreshold: 8,
  feverDuration: 8,       // seconds of surge state
  feverMultiplier: 2.0,   // score multiplier during surge

  // Rings
  ringRadius: 3.6,
  ringCatchRadius: 3.9,

  // Gates: the window never shrinks — difficulty moves it off the natural
  // path instead (see level.js).
  gateGapW: 3.8,
  gateGapH: 3.4,

  // Sky Canyon — a twisty rock-run set-piece that OVERLAYS the existing flight
  // path (rock gates framed around already-generated reward rings). Driven by an
  // independent RNG stream + separate output arrays so the base course
  // (rings/obstacles) for any seed stays byte-identical — old challenge links and
  // the gold-determinism fixture are untouched. Rocks are NON-fatal (health
  // damage, roll-clearable) so a canyon is a pressure beat, not a run-ender.
  canyonGapW: 4.4,            // half-width of the safe opening (≥ gateGapW)
  canyonGapH: 3.9,            // half-height of the safe opening (≥ gateGapH)
  canyonThick: 2.2,           // z half-depth of a rock gate (collision + mesh)
  canyonSegments: [4, 6],     // min/max rock gates per canyon run
  canyonIntervalBase: 1500,   // metres between canyons (rarer than gauntlets)
  canyonIntervalJitter: 1100,
  canyonFirstAt: 900,         // earliest a canyon can begin (past the tutorial)
  canyonFadeNear: 1,          // dz where a rock has fully dissolved (at camera)
  canyonFadeFar: 16,          // dz where a rock is fully solid again

  // Endless generation
  spawnAhead: 500,
  spawnAheadTime: 7,    // minimum reaction seconds; lead = max(spawnAhead, speed×this)
  cullBehind: 80,
  difficultyRamp: 1800,
  pathClearance: 5,
  seed: 1337,

  // Biomes (see biomes.js)
  biomeLength: 1500,      // metres per biome before cycling
  biomeTransition: 150,   // crossfade band at each seam

  // Death freeze-frame
  deathFreezeDuration: 0.45, // seconds of freeze before game-over screen

  // Golden embers: rare seeded comet pickups (variable-ratio spice; uses an
  // RNG stream independent of the course layout so old seeds stay identical)
  goldEmberValue: 25,
  goldEmberInterval: 500,  // metres between spawn opportunities
  goldEmberChance: 0.35,   // roll per opportunity

  // Return triggers
  firstFlightMult: 1.5,    // ember multiplier on the first run each UTC day
  welcomeBackGift: 100,    // embers gifted after a long absence
  welcomeBackGapDays: 5,
  pbMarkerBonus: 10,       // embers for passing your best-distance beacon

  // Juice budget — single source of truth for "how much spectacle per event".
  // hitstopMs: real-time near-freeze (timeScale ~0.05, instant in/out).
  // kick: postfx impulse preset name (postfx.js owns magnitudes; tier1 ×0.5,
  // tier2 no-op). Enforcement (cooldown + max-merge) lives in juice.js so the
  // habituation budget stays a deliberate, auditable decision.
  JUICE: {
    hitstopScale: 0.05,
    hitstopCooldownMs: 180,   // min gap between freezes — habituation guard
    earnPopThreshold: 100,    // score jump in one frame that pops the HUD score
    events: {
      perfect:          { hitstop: 35, kick: null },
      perfectMilestone: { hitstop: 70, kick: 'perfectMilestone' }, // streak 5,10,15…
      goldenEmber:      { hitstop: 80, kick: 'goldenEmber' },
      nearMiss:         { hitstop: 50, kick: null },
      gateThread:       { hitstop: 0,  kick: null },   // camera gateKick instead
      surgeStart:       { hitstop: 0,  kick: 'surgeStart' },
      phase:            { hitstop: 45, kick: null },          // minor phase: light beat
      phasePerfect:     { hitstop: 95, kick: 'surgeStart' },  // perfect phase: big magenta kick
      comboBreak:       { hitstop: 0,  kick: 'comboBreak' },
      death:            { hitstop: 0,  kick: 'death' }, // sustained grade over the freeze
    },
  },
};
