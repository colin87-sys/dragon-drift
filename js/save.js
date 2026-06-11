// Persistent meta-progression save: one versioned localStorage JSON blob.
// Loaded once at boot, deep-merged onto defaults (a corrupt or partial blob
// can never block the game from starting), migrated from the legacy
// one-key-per-value format on first run.

const KEY = 'dragonDriftSave';

const DEFAULTS = {
  v: 1,
  best: { score: 0, dist: 0 },
  flags: { seenFirstSurge: false },
  audio: { musicMuted: false, sfxMuted: false, musicVol: 1, sfxVol: 1, track: 0 },
  settings: { qualityOverride: null },
  embers: 0,
  xp: 0,
  level: 1,
  revives: 1, // one free revive token to teach the mechanic
  skins: { owned: ['azure'], equipped: 'azure' },
  missions: { active: [], completedCount: 0 },
  daily: { date: '', played: false, bestScore: 0, streak: 0 },
  stats: { runs: 0, totalDist: 0, totalRings: 0, totalEmbers: 0 },
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

function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { /* private mode */ }
  if (raw === null) {
    return migrateLegacy(clone(DEFAULTS));
  }
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { /* corrupt blob */ }
  return deepMerge(clone(DEFAULTS), parsed);
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

// Grants xp, returns the number of level-ups (for the game-over celebration).
export function grantXp(amount) {
  saveData.xp += Math.max(0, Math.round(amount));
  let ups = 0;
  while (saveData.xp >= xpToNext(saveData.level)) {
    saveData.xp -= xpToNext(saveData.level);
    saveData.level++;
    ups++;
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

// Record a daily-challenge run; maintains the streak counter.
export function recordDailyRun(score) {
  const today = todayUTC();
  const d = saveData.daily;
  if (d.date !== today) {
    // Streak continues if the last played day was yesterday (UTC).
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    d.streak = d.date === y ? d.streak + 1 : 1;
    d.date = today;
    d.bestScore = 0;
  }
  d.played = true;
  d.bestScore = Math.max(d.bestScore, Math.floor(score));
  persist();
}
