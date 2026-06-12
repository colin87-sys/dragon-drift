import { CONFIG } from './config.js';
import { saveData, persist } from './save.js';

export const game = {
  state: 'ready', // ready | playing | paused | gameover
  pauseReason: '',
  score: 0,
  combo: 1,
  maxCombo: 1,
  health: CONFIG.healthMax,
  stamina: CONFIG.staminaMax,
  ringsCollected: 0,
  perfectRings: 0,
  perfectStreak: 0,    // consecutive perfect-center rings (drives the chime ladder)
  nearMisses: 0,
  speedOrbsCollected: 0,
  rolls: 0,
  maxSpeed: CONFIG.baseSpeed,
  consecutiveRings: 0,
  feverActive: false,
  feverTimer: 0,
  distance: 0,
  time: 0,
  deathFreezeTimer: 0,
  milestone: 0,        // last distance-milestone announced
  recordBeaten: false, // live "NEW RECORD" shown this run
  deathCause: '',      // wall | gate | shard | pillar | bar | ground
  highScore: saveData.best.score,
  bestDistance: saveData.best.dist,
  isNewHighScore: false,
  isNewBestDistance: false,
  challengeScore: 0,
  challengeBeaten: false, // crossed the challenge target mid-run (race bar)
  mode: 'normal',      // normal | daily | gambit
  runSeed: CONFIG.seed,
  embersRun: 0,        // embers collected this run (banked at run end)
  emberBonusEarned: 0, // extra embers from the equipped rider's bonus
  firstFlightBonus: 0, // extra embers from the first-flight-of-the-day ×1.5
  gatesRun: 0,         // windows threaded this run
  surgesRun: 0,        // Dragon Surges triggered this run
  goldEmbersRun: 0,    // golden embers caught this run
  gauntletsClearedRun: 0,
  runSummary: null,    // built once at settle for the recap screen
  timeScale: 1,        // near-death slow-mo (main.js scales sim dt by this)
  slowMoTimer: 0,      // remaining slow-mo, in REAL seconds
  hitstopTimer: 0,     // impact-frame near-freeze, REAL seconds (juice.js)
  reviveUsed: false,   // one revive per run
  pendingDeath: null,  // { cause, lethal } while the revive offer is up
  seenFirstSurge: saveData.flags.seenFirstSurge,
  runFeverThreshold: saveData.flags.seenFirstSurge ? CONFIG.normalFeverThreshold : CONFIG.firstFeverThreshold,

  get feverThreshold() {
    return this.runFeverThreshold;
  },

  // Hardcore bonus: every point scales up while assists are switched off.
  get scoreMult() {
    let m = 1;
    if (!saveData.settings.reticle) m += CONFIG.reticleOffBonus;
    if (!saveData.settings.slowMo) m += CONFIG.slowMoOffBonus;
    return m;
  },

  markSurgeSeen() {
    if (this.seenFirstSurge) return;
    this.seenFirstSurge = true;
    saveData.flags.seenFirstSurge = true;
    persist();
  },

  reset() {
    this.pauseReason = '';
    this.runFeverThreshold = this.seenFirstSurge ? CONFIG.normalFeverThreshold : CONFIG.firstFeverThreshold;
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.health = CONFIG.healthMax;
    this.stamina = CONFIG.staminaMax;
    this.ringsCollected = 0;
    this.perfectRings = 0;
    this.perfectStreak = 0;
    this.nearMisses = 0;
    this.speedOrbsCollected = 0;
    this.rolls = 0;
    this.maxSpeed = CONFIG.baseSpeed;
    this.consecutiveRings = 0;
    this.feverActive = false;
    this.feverTimer = 0;
    this.distance = 0;
    this.time = 0;
    this.deathFreezeTimer = 0;
    this.milestone = 0;
    this.recordBeaten = false;
    this.deathCause = '';
    this.isNewHighScore = false;
    this.isNewBestDistance = false;
    this.embersRun = 0;
    this.emberBonusEarned = 0;
    this.firstFlightBonus = 0;
    this.gatesRun = 0;
    this.surgesRun = 0;
    this.goldEmbersRun = 0;
    this.gauntletsClearedRun = 0;
    this.challengeBeaten = false;
    this.runSummary = null;
    this.timeScale = 1;
    this.slowMoTimer = 0;
    this.hitstopTimer = 0;
    this.reviveUsed = false;
    this.pendingDeath = null;
  },

  recordBests() {
    this.isNewHighScore = this.score > this.highScore && this.score > 0;
    if (this.isNewHighScore) {
      this.highScore = Math.floor(this.score);
      saveData.best.score = this.highScore;
    }
    this.isNewBestDistance = this.distance > this.bestDistance;
    if (this.isNewBestDistance) {
      this.bestDistance = Math.floor(this.distance);
      saveData.best.dist = this.bestDistance;
    }
    const s = saveData.stats;
    s.runs++;
    s.totalDist += Math.floor(this.distance);
    s.totalRings += this.ringsCollected;
    s.totalPerfects += this.perfectRings;
    s.totalGates += this.gatesRun;
    s.totalNearMisses += this.nearMisses;
    s.totalRolls += this.rolls;
    s.totalSurges += this.surgesRun;
    s.totalOrbs += this.speedOrbsCollected;
    s.totalGoldEmbers += this.goldEmbersRun;
    s.gauntletsCleared += this.gauntletsClearedRun;
    // Dragon mastery: metres flown per dragon (array of [key, metres] pairs —
    // deepMerge drops dynamic-key maps, see save.js).
    const key = saveData.skins.equipped;
    const flown = saveData.mastery.flown;
    const entry = flown.find((e) => e[0] === key);
    if (entry) entry[1] += Math.floor(this.distance);
    else flown.push([key, Math.floor(this.distance)]);
    persist();
  },
};
