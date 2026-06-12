import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { saveData, persistNow } from './save.js';
import { unlockFeat } from './feats.js';

// The Ember Gambit: after a normal run banks its haul, the player may wager
// that haul on one short, brutal corridor (the Phoenix Gauntlet). Survive to
// the finish arch = the haul doubles; one touch = the haul burns.
//
// Exactness guarantee — credit-first, debit-on-accept, escrow, refund-on-boot:
//   - The haul (with all quest/XP/streak payouts) banks fully BEFORE the
//     offer renders, so those can never be wagered.
//   - ACCEPT atomically debits the stake and records it in
//     saveData.gambitPending (synchronous persist).
//   - WIN credits 2× stake and clears the escrow; LOSS just clears it.
//   - A page refresh / tab eviction mid-corridor refunds the stake at boot.
//     Never convert this to lose-on-boot: mobile tab eviction would eat
//     stakes through no fault of the player.

let state = { seed: 0, stake: 0, offered: false };

function hashStr(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

// Eligibility, decided once per recap: a worthwhile banked haul, a normal
// run (dailies and challenge links race fixed courses), one offer per run.
export function gambitEligible(haul) {
  return haul >= CONFIG.gambitMinHaul &&
    game.mode === 'normal' &&
    !game.challengeScore &&
    !state.offered;
}

export function markGambitOffered() {
  state.offered = true;
}

export function resetGambitOffer() {
  state.offered = false;
}

// Debit the stake and arm the corridor. Caller restarts into mode 'gambit'.
export function acceptGambit(stake) {
  saveData.embers -= stake;
  saveData.gambitPending = { stake };
  persistNow(); // synchronous: the escrow must hit disk before the corridor
  state.stake = stake;
  state.seed = hashStr('gambit-' + game.runSeed) & 0x7fffffff;
  game.mode = 'gambit';
}

export function gambitSeed() { return state.seed; }
export function gambitStake() { return state.stake; }

// Win (crossed the finish arch) or loss (any damage). Returns the result
// for the gambit recap screen.
export function settleGambit(won) {
  const stake = (saveData.gambitPending && saveData.gambitPending.stake) || state.stake;
  if (won) {
    saveData.embers += 2 * stake;
    saveData.stats.gambitsWon++;
    unlockFeat('gambit_win');
  } else {
    saveData.stats.gambitsLost++;
  }
  saveData.gambitPending = null;
  state.stake = 0;
  game.mode = 'normal';
  persistNow();
  return { won, stake };
}

// Boot-time escape hatch: a corridor that never resolved refunds its stake.
// Returns the refunded amount (0 if none) for a start-screen notice.
export function refundPendingGambit() {
  const pending = saveData.gambitPending;
  if (!pending || !pending.stake) return 0;
  saveData.embers += pending.stake;
  saveData.gambitPending = null;
  persistNow();
  return pending.stake;
}
