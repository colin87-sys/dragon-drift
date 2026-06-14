import { on, emit } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';
import { grantTitle, titleById } from './titles.js';
import { TRIAL_POOL } from './weekly.js';

// Feats: one-time achievements. 'live' feats unlock the moment they happen
// (toast + chime + instant ember credit); 'settle' feats are checked at run
// end and appear in the recap ledger. Every feat pays embers; some grant a
// title. Idempotent: the unlocked list in the save is the single guard.
//
// No ui/sfx imports here — unlocks travel over the event bus ('featUnlocked'
// with live flag) so this module stays node-testable and cycle-free.

export const FEAT_DEFS = [
  // --- Skill ---
  { id: 'first_perfect',  cat: 'skill', name: 'Bullseye',              desc: 'Hit your first perfect ring',            reward: 20 },
  { id: 'pstreak_5',      cat: 'skill', name: 'Threading the Needle',  desc: '5 perfect rings in a row',               reward: 40 },
  { id: 'pstreak_10',     cat: 'skill', name: 'Golden Thread',         desc: '10 perfect rings in a row',              reward: 100, title: 'goldwing' },
  { id: 'chain_15',       cat: 'skill', name: 'Unbroken',              desc: 'Chain 15 rings & windows without a miss', reward: 40 },
  { id: 'chain_30',       cat: 'skill', name: 'Flow State',            desc: 'Chain 30 without a miss',                reward: 120, title: 'slipstream' },
  { id: 'combo_max',      cat: 'skill', name: 'Red Line',              desc: 'Max out the ×5 combo',                   reward: 50 },
  { id: 'surge_3run',     cat: 'skill', name: 'Surge Rider',           desc: 'Trigger Dragon Surge 3 times in one run', reward: 60 },
  { id: 'nearmiss_15run', cat: 'skill', name: "Death's Whisker",       desc: '15 near misses in one run',              reward: 60 },
  { id: 'gauntlet_3run',  cat: 'skill', name: 'Corridor King',         desc: 'Clear 3 gauntlets in one run',           reward: 60 },
  { id: 'clean_2k',       cat: 'skill', name: 'Untouchable',           desc: 'Fly 2,000 m without a scratch',          reward: 100, title: 'ghost' },
  { id: 'raw_5k',         cat: 'skill', name: 'Raw Sky',               desc: 'Score 5,000 with every assist off',      reward: 80,  settle: () => game.score >= 5000 && game.scoreMult > 1.24 },
  // --- Journey ---
  { id: 'dist_5k_run',    cat: 'journey', name: 'Marathon Wing',       desc: 'Fly 5,000 m in one run',                 reward: 80,  settle: () => game.distance >= 5000 },
  { id: 'runs_10',        cat: 'journey', name: 'Regular',             desc: 'Finish 10 flights',                      reward: 30,  settle: () => saveData.stats.runs >= 10 },
  { id: 'runs_50',        cat: 'journey', name: 'Veteran of the Drift', desc: 'Finish 50 flights',                     reward: 100, title: 'driftveteran', settle: () => saveData.stats.runs >= 50 },
  { id: 'dist_100k',      cat: 'journey', name: 'Around the World',    desc: 'Fly 100 km lifetime',                    reward: 150, settle: () => saveData.stats.totalDist >= 100000 },
  { id: 'daily_7',        cat: 'journey', name: 'Dawn Patrol',         desc: 'Hold a 7-day daily streak',              reward: 100, title: 'dawnchaser', settle: () => saveData.daily.streak >= 7 },
  { id: 'biome_6',        cat: 'journey', name: 'World Tour',          desc: 'Reach the Astral Shallows in one run',   reward: 120, settle: () => game.distance >= 7500 },
  { id: 'level_10',       cat: 'journey', name: 'Ace Pilot',           desc: 'Reach pilot level 10',                   reward: 80,  settle: () => saveData.level >= 10 },
  { id: 'weekly_first',   cat: 'journey', name: 'Trialblazer',         desc: 'Complete a weekly trial',                reward: 60,  settle: () => TRIAL_POOL.some((t) => saveData.titles.owned.includes(t.title)) },
  { id: 'ascend_first',   cat: 'skill',      name: 'First Flame',  desc: 'Ascend any dragon to tier 1', reward: 60,  settle: () => (saveData.ascension.tiers || []).some(e => e[1] >= 1) },
  { id: 'ascend_eternal', cat: 'collection', name: 'Eternal Bond', desc: 'Ascend any dragon to tier 5', reward: 150, title: 'eternal', settle: () => (saveData.ascension.tiers || []).some(e => e[1] >= 5) },
  // --- Collection ---
  { id: 'gold_first',     cat: 'collection', name: 'Gilded',           desc: 'Catch a golden ember',                   reward: 25 },
  { id: 'gold_25',        cat: 'collection', name: 'Midas Wing',       desc: 'Catch 25 golden embers lifetime',        reward: 120, title: 'midas', settle: () => saveData.stats.totalGoldEmbers >= 25 },
  { id: 'embers_5k',      cat: 'collection', name: 'Hoard',            desc: 'Bank 5,000 embers lifetime',             reward: 100, settle: () => saveData.stats.totalEmbers >= 5000 },
  { id: 'dragons_3',      cat: 'collection', name: 'Stablemaster',     desc: 'Own 3 dragons',                          reward: 80,  settle: () => saveData.skins.owned.length >= 3 },
];

const defById = (id) => FEAT_DEFS.find((d) => d.id === id);
let featsThisRun = [];

export function featUnlockedAlready(id) {
  return saveData.feats.unlocked.includes(id);
}

// One-time unlock: grant any title and record for the recap. The ember reward
// is NO LONGER paid here — it becomes claimable in the Pilot screen (claimFeat).
// Live unlocks (mid-run) also toast + chime. Safe to call repeatedly.
export function unlockFeat(id, { live = false } = {}) {
  const def = defById(id);
  if (!def || featUnlockedAlready(id)) return false;
  saveData.feats.unlocked.push(id);
  let titleName = '';
  if (def.title && grantTitle(def.title)) {
    const t = titleById(def.title);
    titleName = t ? t.name : '';
  }
  persist();
  featsThisRun.push({ def, titleName });
  emit('featUnlocked', { def, live });
  return true;
}

export function takeFeatsThisRun() {
  const out = featsThisRun;
  featsThisRun = [];
  return out;
}

// --- Reward claiming (Pilot screen) ---
// A feat is claimable once unlocked and not yet claimed; claiming pays its
// embers exactly once. The claimed set is the single guard against double-pay.
export function featClaimable(id) {
  return saveData.feats.unlocked.includes(id) && !saveData.feats.claimed.includes(id);
}
export function unclaimedFeatCount() {
  let n = 0;
  for (const id of saveData.feats.unlocked) if (!saveData.feats.claimed.includes(id)) n++;
  return n;
}
export function claimFeat(id) {
  if (!featClaimable(id)) return 0;
  const def = defById(id);
  if (!def) return 0;
  saveData.feats.claimed.push(id);
  saveData.embers += def.reward;
  persist();
  emit('featClaimed', { def });
  return def.reward;
}

// Live triggers, wired explicitly (heterogeneous conditions don't want a
// generic engine). Listener order note: records.js increments the per-run
// counters these read, so initRecords() must run before initFeats().
let lastDamageDist = 0;

export function initFeats() {
  saveData.feats.unlocked = saveData.feats.unlocked.filter(id => FEAT_DEFS.some(d => d.id === id));
  on('runStart', () => { featsThisRun = []; lastDamageDist = 0; });
  on('damage', (p) => { lastDamageDist = p.m; });

  on('ring', (p) => {
    if (p && p.perfect) {
      unlockFeat('first_perfect', { live: true });
      if (game.perfectStreak >= 5)  unlockFeat('pstreak_5',  { live: true });
      if (game.perfectStreak >= 10) unlockFeat('pstreak_10', { live: true });
    }
    checkChain();
  });
  on('gate', checkChain);
  on('surge', () => { if (game.surgesRun >= 3) unlockFeat('surge_3run', { live: true }); });
  on('nearMiss', () => { if (game.nearMisses >= 15) unlockFeat('nearmiss_15run', { live: true }); });
  on('gauntletCleared', () => { if (game.gauntletsClearedRun >= 3) unlockFeat('gauntlet_3run', { live: true }); });
  on('goldEmber', () => unlockFeat('gold_first', { live: true }));
  on('distance', (p) => {
    if (p.m - lastDamageDist >= 2000) unlockFeat('clean_2k', { live: true });
  });
}

function checkChain() {
  if (game.consecutiveRings >= 15) unlockFeat('chain_15', { live: true });
  if (game.consecutiveRings >= 30) unlockFeat('chain_30', { live: true });
  if (game.combo >= 5) unlockFeat('combo_max', { live: true });
}

// Run-end sweep of the settle-condition feats.
export function settleFeats() {
  for (const def of FEAT_DEFS) {
    if (def.settle && !featUnlockedAlready(def.id) && def.settle()) {
      unlockFeat(def.id);
    }
  }
  return takeFeatsThisRun();
}
