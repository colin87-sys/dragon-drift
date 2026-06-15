// Persistent progression — one versioned localStorage blob under its own key
// (never touches any other game's storage). Corrupt or partial blobs deep-merge
// onto defaults so a bad save can never block boot.

import { xpToNext } from './config.js';

const KEY = 'godfallSave';

function bossSlot() {
  return {
    clears: 0,
    bestTime: 0,          // seconds; 0 = never cleared
    bestRank: '',         // '', 'C', 'B', 'A', 'S'
    bestScore: 0,
    medals: { clear: false, swift: false, sRank: false },
  };
}

const DEFAULTS = {
  v: 1,
  relics: 0,
  xp: 0,
  level: 1,
  gear: {
    // tier owned per weapon class: 0 = locked, 1-3 owned tier
    weapons: { sword: 1, spear: 0, greatsword: 0, daggers: 0 },
    equippedWeapon: 'sword',
    // owned armor pieces as 'set:slot' ids; the starter set is always owned
    armorOwned: ['drifter:helm', 'drifter:chest', 'drifter:gauntlets', 'drifter:greaves'],
    armorEquipped: { helm: 'drifter', chest: 'drifter', gauntlets: 'drifter', greaves: 'drifter' },
  },
  bosses: {
    leviathan: bossSlot(),
    titan: bossSlot(),
    ramuh: bossSlot(),
    bahamut: bossSlot(),
  },
  audio: { musicVol: 1, sfxVol: 1, musicMuted: false, sfxMuted: false },
  settings: { qualityOverride: null, haptics: true, screenShake: true },
  flags: {
    seenCine: {},          // 'leviathan:intro' → true (enables skip)
    tutMove: false, tutDodge: false, tutWarp: false, tutArmiger: false,
  },
  stats: { fights: 0, victories: 0, deaths: 0, perfectDodges: 0, weakHits: 0 },
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }

// Fill target from src where the shapes agree; unknown/mistyped keys in src
// are dropped, missing keys keep defaults. `open` subtrees (free-form dicts
// like flags.seenCine) accept any keys.
const OPEN_PATHS = new Set(['flags.seenCine']);

function deepMerge(target, src, path = '') {
  if (!src || typeof src !== 'object') return target;
  if (OPEN_PATHS.has(path)) {
    for (const k of Object.keys(src)) target[k] = src[k];
    return target;
  }
  for (const k of Object.keys(target)) {
    const tv = target[k];
    const sv = src[k];
    if (sv === undefined) continue;
    if (tv && typeof tv === 'object' && !Array.isArray(tv)) {
      deepMerge(tv, sv, path ? `${path}.${k}` : k);
    } else if (Array.isArray(tv)) {
      if (Array.isArray(sv)) target[k] = clone(sv);
    } else if (typeof sv === typeof tv || tv === null) {
      target[k] = sv;
    }
  }
  return target;
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { /* private mode */ }
  if (raw === null) return clone(DEFAULTS);
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { /* corrupt */ }
  return deepMerge(clone(DEFAULTS), parsed);
}

export const save = load();

let timer = 0;
export function persistNow() {
  timer = 0;
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* full/private */ }
}

// Debounced — call freely after any mutation.
export function persist() {
  if (timer) return;
  timer = setTimeout(persistNow, 400);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persistNow);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persistNow();
  });
}

// Grants xp; returns number of level-ups for the results celebration.
export function grantXp(amount) {
  save.xp += Math.max(0, Math.round(amount));
  let ups = 0;
  while (save.xp >= xpToNext(save.level)) {
    save.xp -= xpToNext(save.level);
    save.level++;
    ups++;
  }
  persist();
  return ups;
}

export function addRelics(n) {
  save.relics = Math.max(0, save.relics + Math.round(n));
  persist();
}

// Boss roster order drives sequential unlocks.
export const BOSS_ORDER = ['leviathan', 'titan', 'ramuh', 'bahamut'];

export function bossUnlocked(id) {
  const i = BOSS_ORDER.indexOf(id);
  if (i <= 0) return true;
  return save.bosses[BOSS_ORDER[i - 1]].clears > 0;
}
