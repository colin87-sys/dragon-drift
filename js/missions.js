import { on } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';

// Rotating mission system: 3 active slots, ember rewards, new missions slide
// in as old ones complete. Progress hooks onto the gameplay event bus.
//
// scope 'run'      — progress resets every run (e.g. "8 gates in one run")
// scope 'lifetime' — progress accumulates across runs

export const MISSION_DEFS = [
  { id: 'rings_20run',    label: 'Collect 20 rings in one run',         target: 20,  scope: 'run',      event: 'ring',     reward: 80 },
  { id: 'perfect_10',     label: 'Hit 10 perfect rings',                target: 10,  scope: 'lifetime', event: 'perfect',  reward: 120 },
  { id: 'nearmiss_10run', label: '10 near-misses in one run',           target: 10,  scope: 'run',      event: 'nearMiss', reward: 100 },
  { id: 'gates_6run',     label: 'Thread 6 windows in one run',         target: 6,   scope: 'run',      event: 'gate',     reward: 120 },
  { id: 'roll_5run',      label: 'Barrel roll 5 times in one run',      target: 5,   scope: 'run',      event: 'roll',     reward: 90 },
  { id: 'surge_2run',     label: 'Trigger Dragon Surge twice in a run', target: 2,   scope: 'run',      event: 'surge',    reward: 150 },
  { id: 'embers_150',     label: 'Gather 150 embers',                   target: 150, scope: 'lifetime', event: 'ember',    reward: 100 },
  { id: 'dist_1500run',   label: 'Fly 1500m in one run',                target: 1500, scope: 'run',     event: 'distance', reward: 110 },
  { id: 'nodmg_800',      label: 'Fly 800m without damage',             target: 800, scope: 'run',      event: 'cleanDist', reward: 140 },
  { id: 'orbs_3run',      label: 'Catch 3 speed orbs in one run',       target: 3,   scope: 'run',      event: 'orb',      reward: 90 },
  { id: 'rings_200',      label: 'Collect 200 rings',                   target: 200, scope: 'lifetime', event: 'ring',     reward: 200 },
  { id: 'perfect_5run',   label: '5 perfect rings in one run',          target: 5,   scope: 'run',      event: 'perfect',  reward: 130 },
];

const ACTIVE_SLOTS = 3;
let runProgress = {};       // id -> progress this run (run-scope missions)
let completedThisRun = [];  // [{ def, reward }] for the game-over screen
let lastDamageDist = 0;     // for the no-damage-streak mission

function defById(id) {
  return MISSION_DEFS.find((d) => d.id === id);
}

// Ensure the save has ACTIVE_SLOTS missions, drawing new ones in def order.
function refillSlots() {
  const active = saveData.missions.active;
  const used = new Set(active.map((m) => m.id));
  let next = saveData.missions.completedCount;
  while (active.length < ACTIVE_SLOTS) {
    const def = MISSION_DEFS[next % MISSION_DEFS.length];
    next++;
    if (used.has(def.id)) continue;
    used.add(def.id);
    active.push({ id: def.id, progress: 0 });
  }
  persist();
}

// Current progress for an active mission (combining lifetime + run scope).
export function missionProgress(m) {
  const def = defById(m.id);
  if (!def) return 0;
  const p = def.scope === 'run' ? Math.max(m.progress, runProgress[m.id] || 0) : m.progress;
  return Math.min(p, def.target);
}

export function activeMissions() {
  return saveData.missions.active.map((m) => ({
    def: defById(m.id),
    progress: missionProgress(m),
  })).filter((m) => m.def);
}

export function takeCompletedThisRun() {
  const out = completedThisRun;
  completedThisRun = [];
  return out;
}

function bump(event, amount, absolute = false) {
  for (const m of saveData.missions.active) {
    const def = defById(m.id);
    if (!def || def.event !== event) continue;
    if (def.scope === 'lifetime') {
      m.progress = absolute ? Math.max(m.progress, amount) : m.progress + amount;
    } else {
      const cur = runProgress[m.id] || 0;
      runProgress[m.id] = absolute ? Math.max(cur, amount) : cur + amount;
      // Track the best run progress in the save too so the start screen can
      // show "best so far" between sessions.
      m.progress = Math.max(m.progress, runProgress[m.id]);
    }
  }
}

export function initMissions() {
  refillSlots();

  on('ring', (p) => { bump('ring', 1); if (p && p.perfect) bump('perfect', 1); });
  on('gate', () => bump('gate', 1));
  on('nearMiss', () => bump('nearMiss', 1));
  on('roll', () => bump('roll', 1));
  on('surge', () => bump('surge', 1));
  on('orb', () => bump('orb', 1));
  on('ember', () => bump('ember', 1));
  on('distance', (p) => {
    bump('distance', p.m, true);
    bump('cleanDist', Math.max(0, p.m - lastDamageDist), true);
  });
  on('damage', (p) => { lastDamageDist = p.m; });
  on('runStart', () => {
    runProgress = {};
    completedThisRun = [];
    lastDamageDist = 0;
  });
}

// Called once at run end: settle completions, award embers, rotate slots.
// Returns the completion list (also kept for takeCompletedThisRun).
export function settleMissions() {
  const active = saveData.missions.active;
  for (let i = active.length - 1; i >= 0; i--) {
    const m = active[i];
    const def = defById(m.id);
    if (!def) { active.splice(i, 1); continue; }
    if (missionProgress(m) >= def.target) {
      completedThisRun.push({ def, reward: def.reward });
      saveData.embers += def.reward;
      saveData.missions.completedCount++;
      active.splice(i, 1);
    }
  }
  refillSlots();
  persist();
  return completedThisRun;
}
