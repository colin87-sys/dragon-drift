// Central run state: the state machine plus everything a single fight tracks
// (timer, damage taken, style counters → rank math at the end).

import { CFG } from './config.js';

export const game = {
  state: 'boot', // boot | home | fight | cinematic | paused | dead | results
  prevState: '',
  bossId: 'leviathan',

  // --- per-fight ---
  time: 0,            // fight clock (sim seconds, excludes cinematics)
  hitsTaken: 0,
  damageTaken: 0,
  perfectDodges: 0,
  weakHits: 0,
  warpStrikes: 0,
  maxCombo: 0,
  staggersCaused: 0,
  phaseReached: 1,
  lastHitBy: '',      // attack id that last damaged the hero (death tips)
  victory: false,

  resetFight(bossId) {
    if (bossId) this.bossId = bossId;
    this.time = 0;
    this.hitsTaken = 0;
    this.damageTaken = 0;
    this.perfectDodges = 0;
    this.weakHits = 0;
    this.warpStrikes = 0;
    this.maxCombo = 0;
    this.staggersCaused = 0;
    this.phaseReached = 1;
    this.lastHitBy = '';
    this.victory = false;
  },

  set(next) {
    this.prevState = this.state;
    this.state = next;
  },
};

// --- Rank scoring -----------------------------------------------------------

export function scoreFight() {
  const t = game.time;
  const timeScore = 100 * (1 - Math.min(Math.max(
    (t - CFG.rankTimeBest) / (CFG.rankTimeWorst - CFG.rankTimeBest), 0), 1));
  const dmgScore = Math.max(0, 100 - game.hitsTaken * CFG.rankHitCost);
  const styleScore = Math.min(100,
    game.perfectDodges * CFG.rankStylePerfect +
    game.weakHits * CFG.rankStyleWeak +
    game.maxCombo);
  const total = 0.4 * timeScore + 0.35 * dmgScore + 0.25 * styleScore;
  const rank = total >= CFG.sRank ? 'S' : total >= CFG.aRank ? 'A' : total >= CFG.bRank ? 'B' : 'C';
  return {
    total: Math.round(total),
    rank,
    time: t,
    timeScore: Math.round(timeScore),
    dmgScore: Math.round(dmgScore),
    styleScore: Math.round(styleScore),
  };
}
