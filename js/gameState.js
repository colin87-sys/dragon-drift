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
  mode: 'normal',      // normal | daily
  runSeed: CONFIG.seed,
  embersRun: 0,        // embers collected this run (banked at run end)
  timeScale: 1,        // near-death slow-mo (main.js scales sim dt by this)
  slowMoTimer: 0,      // remaining slow-mo, in REAL seconds
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
    this.timeScale = 1;
    this.slowMoTimer = 0;
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
    saveData.stats.runs++;
    saveData.stats.totalDist += Math.floor(this.distance);
    saveData.stats.totalRings += this.ringsCollected;
    persist();
  },
};
