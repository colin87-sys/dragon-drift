// Persistent meta-progression save: one versioned localStorage JSON blob.
// Loaded once at boot, deep-merged onto defaults (a corrupt or partial blob
// can never block the game from starting), migrated from the legacy
// one-key-per-value format on first run.

import { emit } from './events.js';

const KEY = 'dragonDriftSave';

// NOTE for new fields: deepMerge() iterates DEFAULTS' keys, so dynamic-key
// objects under a {} default are dropped on load — collections MUST be
// arrays (e.g. mastery.flown is [[key, metres], ...], never a map).
const DEFAULTS = {
  v: 2,
  best: { score: 0, dist: 0 },
  flags: { seenFirstSurge: false, hintsSeen: 0, seenIOSHint: false },
  audio: { musicMuted: false, sfxMuted: false, musicVol: 1, sfxVol: 1, track: 0, ownedTracks: [] },
  settings: { qualityOverride: null, reticle: true, slowMo: true },
  embers: 0,
  xp: 0,
  level: 1,
  revives: 1, // one free revive token to teach the mechanic
  skins: { owned: ['azure'], equipped: 'azure' },   // dragons (legacy key name)
  riders: { owned: ['drifter'], equipped: 'drifter' },
  missions: { active: [], completedCount: 0, completedIds: [] },
  daily: { date: '', played: false, bestScore: 0, streak: 0, bonusDay: '' },
  stats: {
    runs: 0, totalDist: 0, totalRings: 0, totalEmbers: 0,
    totalPerfects: 0, totalGates: 0, totalNearMisses: 0, totalRolls: 0,
    totalSurges: 0, totalOrbs: 0, totalGoldEmbers: 0, gauntletsCleared: 0,
    dailiesCompleted: 0,
  },
  records: {
    bestChain: 0, bestPerfectStreak: 0, mostRingsRun: 0,
    mostPerfectsRun: 0, longestCleanDist: 0, bestCombo: 0, bestDailyScore: 0,
  },
  feats: { unlocked: [] },
  titles: { owned: [], equipped: '' },
  weekly: { key: '', trialIds: [], progress: [], done: [], feather: false },
  milestones: { claimed: [] },
  mastery: { flown: [], starsClaimed: [] }, // flown: [[dragonKey, metres], ...]
  ascension: { tiers: [], radiance: [] },   // tiers: [[dragonKey, n], ...]
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] }, // formPref: [[key, tierToDisplay]]
  lastSeen: '',         // YYYY-MM-DD UTC, set on every boot
  firstFlightDay: '',   // last UTC day the first-flight ember bonus was paid
  // Appointment-UI watermarks (honest badges): fixed numeric keys only.
  ui: { seenFeats: 0, seenTitles: 0, shopSeenEmbers: 0 },
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Recursively fill target with src values where shapes agree; unknown or
// mistyped keys in src are ignored, missing keys keep their defaults.
function deepMerge(target, src) {
  if (!src || typeof src !== 'object') return target;
  for (const k of Object.keys(target)) {
    const tv = target[k];
    const sv = src[k];
    if (sv === undefined) continue;
    if (tv && typeof tv === 'object' && !Array.isArray(tv)) {
      deepMerge(tv, sv);
    } else if (Array.isArray(tv)) {
      if (Array.isArray(sv)) target[k] = clone(sv);
    } else if (typeof sv === typeof tv || tv === null) {
      target[k] = sv;
    }
  }
  return target;
}

function readNum(key, fallbackKey) {
  try {
    const v = Number(localStorage.getItem(key));
    if (v) return v;
    if (fallbackKey) {
      const fb = Number(localStorage.getItem(fallbackKey));
      if (fb) return fb;
    }
  } catch { /* private mode */ }
  return 0;
}

function readFlag(key) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

function migrateLegacy(data) {
  data.best.score = readNum('dragonDriftHighScore', 'angryDragonsHighScore');
  data.best.dist = readNum('dragonDriftBestDist', 'angryDragonsBestDist');
  data.flags.seenFirstSurge = readFlag('dragonDriftSeenFirstSurge');
  data.audio.musicMuted = readFlag('dragonDriftMusicMuted');
  data.audio.sfxMuted = readFlag('dragonDriftSfxMuted');
  return data;
}

export let gambitSunsetRefund = 0;

function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { /* private mode */ }
  if (raw === null) {
    return migrateLegacy(clone(DEFAULTS));
  }
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { /* corrupt blob */ }
  const data = deepMerge(clone(DEFAULTS), parsed);
  // v1 → v2 needs no migration body (deep-merge fills the new fields), but
  // deepMerge keeps the OLD version marker — stamp the current one.
  data.v = DEFAULTS.v;
  if (parsed && parsed.gambitPending && parsed.gambitPending.stake > 0) {
    data.embers += Math.floor(parsed.gambitPending.stake);
    gambitSunsetRefund = Math.floor(parsed.gambitPending.stake);
  }
  return data;
}

export const saveData = load();

let saveTimer = 0;
export function persistNow() {
  saveTimer = 0;
  try { localStorage.setItem(KEY, JSON.stringify(saveData)); } catch { /* full/private */ }
}

// Debounced write — call freely after any mutation.
export function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(persistNow, 500);
}

window.addEventListener('pagehide', persistNow);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persistNow();
});

// --- XP / pilot level ---
export function xpToNext(level) {
  return 120 + level * 80;
}

// Pilot levels pay embers: small, growing, capped — leveling always means
// something tangible (the recap prints the amount).
export function levelEmberReward(level) {
  return Math.min(25 + level * 5, 100);
}

// Grants xp, returns the number of level-ups (for the game-over celebration).
// Each level-up pays its ember reward and emits 'levelUp' for feats/sfx.
export function grantXp(amount) {
  saveData.xp += Math.max(0, Math.round(amount));
  let ups = 0;
  while (saveData.xp >= xpToNext(saveData.level)) {
    saveData.xp -= xpToNext(saveData.level);
    saveData.level++;
    ups++;
    saveData.embers += levelEmberReward(saveData.level);
    emit('levelUp', { level: saveData.level });
  }
  persist();
  return ups;
}

// --- Daily challenge helpers ---
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

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function dailySeed() {
  return hashStr('dragon-drift-' + todayUTC()) & 0x7fffffff;
}

// Record a daily-challenge run; maintains the streak counter and pays the
// once-per-day streak bonus. A banked Phoenix Feather (earned from weekly
// trials) silently bridges a single missed day — warmth, not punishment.
// Returns { firstToday, streakBonus, featherUsed } for the recap.
export function recordDailyRun(score) {
  const today = todayUTC();
  const d = saveData.daily;
  let featherUsed = false;
  if (d.date !== today) {
    const y  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const y2 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    if (d.date === y) {
      d.streak = d.streak + 1;
    } else if (d.date === y2 && saveData.weekly.feather) {
      // One missed day, one feather: the streak carries across the gap.
      saveData.weekly.feather = false;
      featherUsed = true;
      d.streak = d.streak + 1;
    } else {
      d.streak = 1;
    }
    d.date = today;
    d.bestScore = 0;
  }
  d.played = true;
  d.bestScore = Math.max(d.bestScore, Math.floor(score));
  saveData.records.bestDailyScore = Math.max(saveData.records.bestDailyScore, Math.floor(score));
  // First completion each UTC day pays a streak-scaled ember bonus.
  let streakBonus = 0;
  const firstToday = d.bonusDay !== today;
  if (firstToday) {
    d.bonusDay = today;
    saveData.stats.dailiesCompleted++;
    streakBonus = 30 + 10 * Math.min(d.streak, 7);
    saveData.embers += streakBonus;
  }
  persist();
  return { firstToday, streakBonus, featherUsed };
}
