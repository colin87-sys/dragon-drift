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

  // Stamina system — tuned so a player who chains rings/windows/orbs can
  // stay boosted indefinitely (drain 16/s vs ~1 reward per second at boost).
  staminaMax: 100,
  staminaDrain: 16,
  staminaRegen: 18,
  staminaRegenDelay: 1,
  ringStamina: 28,
  orbStamina: 35,
  gateStamina: 22,

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

  // Barrel roll (dodge move: brief i-frames, near-misses still award)
  rollDuration: 0.45,
  rollCooldown: 1.2,
  rollImpulse: 30,        // lateral velocity kick
  rollInvuln: 0.5,        // i-frame window from roll start
  rollBonus: 50,          // style points × combo

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

  // Endless generation
  spawnAhead: 500,
  cullBehind: 80,
  difficultyRamp: 1800,
  pathClearance: 5,
  seed: 1337,

  // Biomes (see biomes.js)
  biomeLength: 1500,      // metres per biome before cycling
  biomeTransition: 150,   // crossfade band at each seam

  // Death freeze-frame
  deathFreezeDuration: 0.45, // seconds of freeze before game-over screen
};
