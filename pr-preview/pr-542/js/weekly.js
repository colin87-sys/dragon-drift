import { saveData, persist } from './save.js';
import { grantTitle, titleById } from './titles.js';

// Weekly Trials: three big objectives drawn per ISO week (UTC) from a fixed
// pool, paying serious embers + an exclusive title each. Progress
// accumulates at run end (settle-time — no live listeners to double-count).
// Completing ANY trial banks the Phoenix Feather that bridges one missed
// daily-streak day (save.js recordDailyRun).
//
// Self-contained hash/PRNG (no util.js import) so node tests can run this
// module without dragging three.js in.

function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function prng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// mode 'sum' accumulates across the week's runs; 'max' takes the best run.
// contrib(game, extra) returns this run's contribution.
export const TRIAL_POOL = [
  { id: 'wk_dist15k',    label: 'Fly 15,000 m this week',        target: 15000, mode: 'sum', reward: 350, title: 'longhauler',     contrib: (g) => Math.floor(g.distance) },
  { id: 'wk_perfect40',  label: 'Hit 40 perfect rings',          target: 40,    mode: 'sum', reward: 400, title: 'deadeye',        contrib: (g) => g.perfectRings },
  { id: 'wk_daily3',     label: 'Fly the daily on 3 days',       target: 3,     mode: 'sum', reward: 500, title: 'daybreaker',     contrib: (g, x) => (x.dailyFirstToday ? 1 : 0) },
  { id: 'wk_gauntlet12', label: 'Clear 12 gauntlets',            target: 12,    mode: 'sum', reward: 400, title: 'corridorrunner', contrib: (g) => g.gauntletsClearedRun },
  { id: 'wk_gates40',    label: 'Thread 40 crystal windows',     target: 40,    mode: 'sum', reward: 350, title: 'needleworker',   contrib: (g) => g.gatesRun },
  { id: 'wk_nearmiss80', label: 'Shave 80 near misses',          target: 80,    mode: 'sum', reward: 350, title: 'hairsbreadth',   contrib: (g) => g.nearMisses },
  { id: 'wk_gold8',      label: 'Catch 8 golden embers',         target: 8,     mode: 'sum', reward: 450, title: 'goldhunter',     contrib: (g) => g.goldEmbersRun },
  { id: 'wk_surge15',    label: 'Trigger Dragon Surge 15 times', target: 15,    mode: 'sum', reward: 400, title: 'surgeheart',     contrib: (g) => g.surgesRun },
  { id: 'wk_score12k',   label: 'Score 12,000 in one run',       target: 12000, mode: 'max', reward: 500, title: 'highflyer',      contrib: (g) => Math.floor(g.score) },
];

// ISO 8601 week key (UTC), e.g. '2026-W24'. Exported for tests.
export function isoWeekKeyUTC(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to this week's Thursday
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// Deterministic 3-of-pool draw for a week key. Exported for tests.
export function drawWeekly(key) {
  const rnd = prng(hash('dd-weekly-' + key));
  const ids = TRIAL_POOL.map((t) => t.id);
  const picked = [];
  while (picked.length < 3 && ids.length) {
    picked.push(ids.splice(Math.floor(rnd() * ids.length), 1)[0]);
  }
  return picked;
}

function trialById(id) {
  return TRIAL_POOL.find((t) => t.id === id) || null;
}

// Redraw on week rollover. Called at boot, every settle and every start-
// screen render — a Sunday-night session must not straddle two weeks with
// stale trials. The Phoenix Feather persists across weeks.
export function ensureWeek() {
  const key = isoWeekKeyUTC();
  const w = saveData.weekly;
  if (w.key === key && w.trialIds.length === 3) return;
  w.key = key;
  w.trialIds = drawWeekly(key);
  w.progress = [0, 0, 0];
  w.done = [false, false, false];
  persist();
}

// For the start screen strip / pause tab: [{def, progress, done}].
export function weeklyTrials() {
  ensureWeek();
  const w = saveData.weekly;
  return w.trialIds.map((id, i) => ({
    def: trialById(id),
    progress: w.progress[i],
    done: w.done[i],
  })).filter((t) => t.def);
}

// Run-end accumulation + payout. Returns [{def, reward, titleName}].
export function settleWeekly(game, extra = {}) {
  ensureWeek();
  const w = saveData.weekly;
  const out = [];
  w.trialIds.forEach((id, i) => {
    const def = trialById(id);
    if (!def || w.done[i]) return;
    const c = def.contrib(game, extra);
    w.progress[i] = def.mode === 'max' ? Math.max(w.progress[i], c) : w.progress[i] + c;
    if (w.progress[i] >= def.target) {
      w.progress[i] = def.target;
      w.done[i] = true;
      saveData.embers += def.reward;
      grantTitle(def.title);
      w.feather = true; // any trial completion banks the streak feather
      const t = titleById(def.title);
      out.push({ def, reward: def.reward, titleName: t ? t.name : '' });
    }
  });
  persist();
  return out;
}
