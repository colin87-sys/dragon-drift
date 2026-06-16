// GODFALL RUSH — every tuning number lives here.
// Combat math, movement, gauges, ranks, economy, juice timings.

export const CFG = {
  // --- Orbital shell movement ---
  moveSpeed: 23,          // linear orbit speed (units/s) — ω = moveSpeed / r
  vertSpeed: 15,          // ascend/descend speed (units/s)
  moveDamp: 9,            // input easing lambda
  radiusBreathe: 1.1,     // idle radial bob amplitude
  radiusBreatheFreq: 0.6,
  knockbackDamp: 4.2,     // knockback spring-back lambda
  bandSoftness: 1.6,      // soft clamp zone at hMin/hMax

  // --- Hero combat ---
  heroRadius: 0.95,       // hit sphere
  baseHp: 100,
  hpPerLevel: 12,
  dmgPerLevel: 0.06,      // +6% weapon damage per level
  attackGlide: 3.0,       // magnet pull-in (units) during a swing
  attackGlideSpeed: 16,
  comboDecay: 3.0,        // seconds without a hit before combo resets
  comboCap: 40,
  comboMultPer: 0.005,    // comboMult = 1 + min(combo,cap)*per  (max 1.2)

  // --- Dodge ---
  dodgeDuration: 0.34,
  dodgeIFrames: 0.32,
  dodgeCooldown: 0.55,
  dodgeImpulse: 34,       // tangential speed during dodge
  perfectWindow: 0.18,    // dodge started within this of an incoming hit = perfect
  witchTime: 0.85,        // seconds of witch-time after a perfect dodge
  witchScale: 0.3,

  // --- Warp strike ---
  warpSegments: 3,
  warpRegen: 4.6,         // seconds per segment
  warpOutTime: 0.2,       // real-time seconds, hero -> target
  warpBackTime: 0.26,
  warpDmgMult: 3.0,       // damage = weapon.power * warpDmgMult * weakMult
  warpPerfectRefund: 1,   // perfect dodge refunds a segment

  // --- Armiger limit ---
  armigerMax: 100,
  armigerPerfectDodge: 12,
  armigerWeakHit: 8,
  armigerPerCombo10: 5,
  armigerDuration: 12,
  armigerDmg: 1.5,
  armigerSpeed: 1.3,

  // --- Stagger ---
  staggerDmgMult: 1.6,
  staggerDecayDelay: 4,   // seconds untouched before bar decays
  staggerDecayRate: 6,    // per second

  // --- Juice ---
  hitStopLight: 0.045,
  hitStopHeavy: 0.085,
  hitStopWarp: 0.1,
  hitStopScale: 0.05,
  shakeLight: 0.22,
  shakeHeavy: 0.5,
  shakeSpectacle: 0.9,
  killSlowmo: 0.25,       // finisher timescale

  // --- Camera ---
  camBack: 8.2,
  camUp: 2.7,
  camLookBlend: 0.36,     // 0 = hero, 1 = boss aim point
  camThetaDamp: 6.5,
  camHeightDamp: 5.5,
  fovBase: 70,
  fovWarp: 84,
  fovArmiger: 76,

  // --- Rank scoring ---
  rankTimeBest: 240,      // ≤ 4:00 → full time score
  rankTimeWorst: 480,     // ≥ 8:00 → zero
  rankHitCost: 8,         // damage-score lost per hit taken
  rankStylePerfect: 6,
  rankStyleWeak: 4,
  sRank: 85, aRank: 70, bRank: 50,
  rankMult: { S: 2.0, A: 1.5, B: 1.2, C: 1.0 },

  // --- Economy (Relics) ---
  victoryBase: [150, 220, 300, 400],  // per boss index
  firstClearBonus: 300,
  medalBonus: 100,
  defeatPerPhase: 15,
  xpVictoryBase: 90,
  xpVictoryPerBoss: 40,
  xpDefeatBase: 25,
  xpDefeatPerPhase: 10,

  // --- Quality tiers ---
  qualityScalars: [1, 0.6, 0.35],
  degradeAt: [55, 42, 0],
  restoreAt: [Infinity, 63, 50],
};

export function xpToNext(level) {
  return 140 + level * 90;
}

export function heroMaxHp(level, setBonusHp = 0) {
  return Math.round((CFG.baseHp + CFG.hpPerLevel * (level - 1)) * (1 + setBonusHp));
}

export function levelDmgMult(level) {
  return 1 + CFG.dmgPerLevel * (level - 1);
}
