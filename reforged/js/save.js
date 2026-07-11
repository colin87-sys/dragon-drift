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
  v: 4,
  best: { score: 0, dist: 0 },
  flags: {
    seenFirstSurge: false, hintsSeen: 0, seenIOSHint: false, phaseTaught: false, seenIntro: false,
    // FTUE onboarding one-shots (deepMerge fills these for existing saves).
    seenFirstRoll: false, celebratedFirstSurge: false,
    seenShopIntro: false, seenQuestsIntro: false, seenDailyIntro: false, seenPilotIntro: false,
    // THE LANCE (lock) layer teach bits (combat-verbs SOP §II.4). aimTaught = V1 (its
    // own bit — the V1 hint fires independent of V2's unlock); lockTaught/lockCapSeen =
    // V2 (PR2); snapTaught = V4 (PR4, the perfect-parry brand); focusTaught = V5
    // (PR5, dead-wires the detector until the drill fires).
    aimTaught: false, lockTaught: false, lockCapSeen: false, snapTaught: false, focusTaught: false,
    // V2 access: set permanently on first ENTERING a fight whose def carries lockParts
    // (slot 4 is the first) — a player stuck on that boss keeps the tool (SOP §I.e).
    lockUnlocked: false,
  },
  audio: { musicMuted: false, sfxMuted: false, musicVol: 1, sfxVol: 1, track: 0, ownedTracks: [] },
  settings: { qualityOverride: null, modelDetail: null, reticle: true, slowMo: true, glideAssist: false, mouseSteer: true, bulletClarity: true, dev: false,
    // Graphics effects (defaults = the shipped look): dither ON, ACES colour grade, fast-particles OFF, sky-IBL OFF.
    dither: true, toneMap: 'aces', particleBatch: false, skyIbl: false },
  embers: 0,
  xp: 0,
  level: 1,
  revives: 1, // one free revive token to teach the mechanic
  skins: { owned: ['azure'], equipped: 'azure' },   // dragons (legacy key name)
  riders: { owned: ['drifter'], equipped: 'drifter' },
  missions: { active: [], completedCount: 0, completedIds: [] },
  daily: { date: '', played: false, bestScore: 0, streak: 0, bonusDay: '' },
  // Boss Rush: which bosses the player has defeated (unlocks them in the rush
  // roster) + a lifetime clear counter + best clear time (ms). A boss enters the
  // gauntlet only once beaten; the mode itself unlocks after the first kill.
  bossRush: { beaten: [], cleared: 0, bestClearMs: 0 },
  // Spell-card mastery + per-boss combat ledger (BOSS-DESIGN.md §5f/§5h). Both
  // are ARRAY-form collections (dynamic keys under a {} default are dropped by
  // deepMerge — see the note above): bossCards = [[cardId, captures, survivals]],
  // bossLedger = [[bossId, kills, deathsTo]]. Written from the existing
  // bossDefeated / card / death event seams; slot 9's taunt cards read the
  // ledger, so the accrual lands now (§5h build-order note).
  bossCards: [],
  bossLedger: [],
  stats: {
    runs: 0, totalDist: 0, totalRings: 0, totalEmbers: 0,
    totalPerfects: 0, totalGates: 0, totalNearMisses: 0, totalRolls: 0,
    totalSurges: 0, totalOrbs: 0, totalGoldEmbers: 0, gauntletsCleared: 0,
    dailiesCompleted: 0, totalBossKills: 0,
  },
  records: {
    bestChain: 0, bestPerfectStreak: 0, mostRingsRun: 0,
    mostPerfectsRun: 0, longestCleanDist: 0, bestCombo: 0, bestDailyScore: 0,
  },
  feats: { unlocked: [], claimed: [] }, // claimed: feats whose reward was paid out
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
  // v2 → v3: feats moved from auto-pay-on-unlock to click-to-claim. Every feat
  // already unlocked under v2 was paid out historically, so mark them all
  // claimed — never re-pay them; only feats unlocked from here on are claimable.
  if (parsed && (parsed.v || 0) < 3) {
    data.feats.claimed = [...new Set(data.feats.unlocked)];
  }
  data.v = DEFAULTS.v;
  // FTUE onboarding one-shots are new flags: a returning pilot who predates them
  // has already met these systems, so backfill "seen" by their run count. A
  // brand-new player (no save → migrateLegacy path) skips this and gets the full
  // first-time experience. Only backfill keys the old blob never had.
  if (parsed && parsed.flags) {
    const had = (k) => parsed.flags[k] !== undefined;
    const f = data.flags;
    const r = data.stats.runs;
    if (!had('seenShopIntro')   && r >= 1) f.seenShopIntro = true;
    if (!had('seenQuestsIntro') && r >= 2) f.seenQuestsIntro = true;
    if (!had('seenDailyIntro')  && r >= 3) f.seenDailyIntro = true;
    if (!had('seenPilotIntro')  && r >= 3) f.seenPilotIntro = true;
    if (!had('seenFirstRoll')   && r >= 2) f.seenFirstRoll = true;
  }
  if (parsed && parsed.gambitPending && parsed.gambitPending.stake > 0) {
    data.embers += Math.floor(parsed.gambitPending.stake);
    gambitSunsetRefund = Math.floor(parsed.gambitPending.stake);
  }
  // Ascension collapsed 5 tiers → 3 (4 visual forms). Clamp any legacy tier /
  // form-preference values so old saves resolve to a valid form.
  for (const e of data.ascension.tiers) if (e[1] > 3) e[1] = 3;
  for (const e of data.cosmetics.formPref) if (e[1] > 3) e[1] = 3;
  return data;
}

export const saveData = load();

let saveTimer = 0;
// Dev mode (?dev) freezes writes so a temporary "everything unlocked" override
// never overwrites the player's real progress.
let writesFrozen = false;
export function freezeSaves() { writesFrozen = true; }
export function unfreezeSaves() { writesFrozen = false; }
export function persistNow() {
  saveTimer = 0;
  if (writesFrozen) return;
  try { localStorage.setItem(KEY, JSON.stringify(saveData)); } catch { /* full/private */ }
}

// Debounced write — call freely after any mutation.
export function persist() {
  if (writesFrozen || saveTimer) return;
  saveTimer = setTimeout(persistNow, 500);
}

window.addEventListener('pagehide', persistNow);
window.addEventListener('beforeunload', persistNow);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persistNow();
});
// Safety net: flush on a steady cadence so progress / purchases can never be
// stranded by a debounced write that didn't fire before a mobile tab was killed
// (pagehide/visibilitychange aren't 100% reliable on iOS). persistNow no-ops in
// dev mode and when nothing has changed it just rewrites the same blob (cheap).
// .unref() so this timer never keeps Node's event loop alive in the test runner
// (no-op in the browser, where setInterval returns a number, not a Timeout).
const _periodicSave = setInterval(persistNow, 15000);
if (_periodicSave && typeof _periodicSave.unref === 'function') _periodicSave.unref();

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

// --- Spell-card + boss-ledger accrual (BOSS-DESIGN.md §5f/§5h) ---
// A card is CAPTURED when survived hitless, else SURVIVED (took hits / timed
// out). Local-only (owner decision §5h). Both collections are array-of-tuples
// so deepMerge preserves them across loads.
export function recordBossCard(cardId, captured) {
  if (!cardId) return;
  let e = saveData.bossCards.find((x) => x[0] === cardId);
  if (!e) { e = [cardId, 0, 0]; saveData.bossCards.push(e); }
  if (captured) e[1]++; else e[2]++;
  persist();
}
export function bossCardStats(cardId) {
  const e = saveData.bossCards.find((x) => x[0] === cardId);
  return e ? { captures: e[1], survivals: e[2] } : { captures: 0, survivals: 0 };
}
// Per-boss kills / deaths-to. slot 9's taunt cards quote this (§5f rule-break).
export function recordBossLedger(bossId, { kill = false, death = false } = {}) {
  if (!bossId) return;
  let e = saveData.bossLedger.find((x) => x[0] === bossId);
  if (!e) { e = [bossId, 0, 0]; saveData.bossLedger.push(e); }
  if (kill) e[1]++;
  if (death) e[2]++;
  persist();
}
export function bossLedgerStats(bossId) {
  const e = saveData.bossLedger.find((x) => x[0] === bossId);
  return e ? { kills: e[1], deathsTo: e[2] } : { kills: 0, deathsTo: 0 };
}
