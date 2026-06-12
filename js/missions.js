import { on } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';

// Rotating mission system: 3 active slots, ember rewards, new missions slide
// in as old ones complete. Progress hooks onto the gameplay event bus.
//
// scope 'run'      — progress resets every run (e.g. "8 gates in one run")
// scope 'lifetime' — progress accumulates across runs
//
// Quest chains: six families run in tiers I→III. Tiered quests are one-shot;
// completing one slides its next tier straight into the freed slot ("NEW
// QUEST UNLOCKED" on the recap). `requires` gates a def out of rotation
// until its previous tier is in missions.completedIds. The six untiered
// quests rotate forever.

export const MISSION_DEFS = [
  { id: 'rings_20run',    label: 'Collect 20 rings in one run',         target: 20,  scope: 'run',      event: 'ring',     reward: 80,  next: 'rings_35run' },
  { id: 'perfect_10',     label: 'Hit 10 perfect rings',                target: 10,  scope: 'lifetime', event: 'perfect',  reward: 120 },
  { id: 'nearmiss_10run', label: '10 near-misses in one run',           target: 10,  scope: 'run',      event: 'nearMiss', reward: 100, next: 'nearmiss_18run' },
  { id: 'gates_6run',     label: 'Thread 6 windows in one run',         target: 6,   scope: 'run',      event: 'gate',     reward: 120, next: 'gates_10run' },
  { id: 'roll_5run',      label: 'Barrel roll 5 times in one run',      target: 5,   scope: 'run',      event: 'roll',     reward: 90 },
  { id: 'surge_2run',     label: 'Trigger Dragon Surge twice in a run', target: 2,   scope: 'run',      event: 'surge',    reward: 150 },
  { id: 'embers_150',     label: 'Gather 150 embers',                   target: 150, scope: 'lifetime', event: 'ember',    reward: 100, next: 'embers_400' },
  { id: 'dist_1500run',   label: 'Fly 1500m in one run',                target: 1500, scope: 'run',     event: 'distance', reward: 110, next: 'dist_2500run' },
  { id: 'nodmg_800',      label: 'Fly 800m without damage',             target: 800, scope: 'run',      event: 'cleanDist', reward: 140 },
  { id: 'orbs_3run',      label: 'Catch 3 speed orbs in one run',       target: 3,   scope: 'run',      event: 'orb',      reward: 90 },
  { id: 'rings_200',      label: 'Collect 200 rings',                   target: 200, scope: 'lifetime', event: 'ring',     reward: 200 },
  { id: 'perfect_5run',   label: '5 perfect rings in one run',          target: 5,   scope: 'run',      event: 'perfect',  reward: 130, next: 'perfect_8run' },
  // --- Tier II ---
  { id: 'rings_35run',    label: 'Collect 35 rings in one run',         target: 35,  scope: 'run',      event: 'ring',     reward: 140, requires: 'rings_20run',    next: 'rings_50run' },
  { id: 'perfect_8run',   label: '8 perfect rings in one run',          target: 8,   scope: 'run',      event: 'perfect',  reward: 200, requires: 'perfect_5run',   next: 'perfect_12run' },
  { id: 'gates_10run',    label: 'Thread 10 windows in one run',        target: 10,  scope: 'run',      event: 'gate',     reward: 190, requires: 'gates_6run',     next: 'gates_15run' },
  { id: 'nearmiss_18run', label: '18 near-misses in one run',           target: 18,  scope: 'run',      event: 'nearMiss', reward: 170, requires: 'nearmiss_10run', next: 'nearmiss_28run' },
  { id: 'dist_2500run',   label: 'Fly 2500m in one run',                target: 2500, scope: 'run',     event: 'distance', reward: 180, requires: 'dist_1500run',   next: 'dist_4000run' },
  { id: 'embers_400',     label: 'Gather 400 embers',                   target: 400, scope: 'lifetime', event: 'ember',    reward: 180, requires: 'embers_150',     next: 'embers_900' },
  // --- Tier III ---
  { id: 'rings_50run',    label: 'Collect 50 rings in one run',         target: 50,  scope: 'run',      event: 'ring',     reward: 220, requires: 'rings_35run' },
  { id: 'perfect_12run',  label: '12 perfect rings in one run',         target: 12,  scope: 'run',      event: 'perfect',  reward: 300, requires: 'perfect_8run' },
  { id: 'gates_15run',    label: 'Thread 15 windows in one run',        target: 15,  scope: 'run',      event: 'gate',     reward: 280, requires: 'gates_10run' },
  { id: 'nearmiss_28run', label: '28 near-misses in one run',           target: 28,  scope: 'run',      event: 'nearMiss', reward: 260, requires: 'nearmiss_18run' },
  { id: 'dist_4000run',   label: 'Fly 4000m in one run',                target: 4000, scope: 'run',     event: 'distance', reward: 280, requires: 'dist_2500run' },
  { id: 'embers_900',     label: 'Gather 900 embers',                   target: 900, scope: 'lifetime', event: 'ember',    reward: 300, requires: 'embers_400' },
];

const ACTIVE_SLOTS = 3;
let runProgress = {};       // id -> progress this run (run-scope missions)
let completedThisRun = [];  // [{ def, reward }] for the game-over screen
let lastDamageDist = 0;     // for the no-damage-streak mission

function defById(id) {
  return MISSION_DEFS.find((d) => d.id === id);
}

// A def is drawable when it's not already active, its prerequisite tier (if
// any) is complete, and — for tiered quests — it hasn't been done already.
function drawable(def, used) {
  if (used.has(def.id)) return false;
  const done = saveData.missions.completedIds;
  if (def.requires && !done.includes(def.requires)) return false;
  if ((def.next || def.requires) && done.includes(def.id)) return false; // tiered = one-shot
  return true;
}

// Ensure the save has ACTIVE_SLOTS missions, drawing new ones in def order.
function refillSlots() {
  const active = saveData.missions.active;
  const used = new Set(active.map((m) => m.id));
  let next = saveData.missions.completedCount;
  let attempts = 0;
  while (active.length < ACTIVE_SLOTS && attempts < MISSION_DEFS.length * 2) {
    const def = MISSION_DEFS[next % MISSION_DEFS.length];
    next++;
    attempts++;
    if (!drawable(def, used)) continue;
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
  on('ember', (p) => bump('ember', (p && p.n) || 1)); // golden embers carry n
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
// A completed tiered quest slides its next tier straight into the freed
// slot. Returns { completed: [{def, reward}], unlocked: [def] }.
export function settleMissions() {
  const active = saveData.missions.active;
  const unlocked = [];
  for (let i = active.length - 1; i >= 0; i--) {
    const m = active[i];
    const def = defById(m.id);
    if (!def) { active.splice(i, 1); continue; }
    if (missionProgress(m) >= def.target) {
      completedThisRun.push({ def, reward: def.reward });
      saveData.embers += def.reward;
      saveData.missions.completedCount++;
      if (!saveData.missions.completedIds.includes(def.id)) {
        saveData.missions.completedIds.push(def.id);
      }
      active.splice(i, 1);
      if (def.next) {
        const nd = defById(def.next);
        if (nd && !active.some((a) => a.id === nd.id)) {
          active.push({ id: nd.id, progress: 0 }); // appended: never revisited by this loop
          unlocked.push(nd);
        }
      }
    }
  }
  refillSlots();
  persist();
  return { completed: completedThisRun, unlocked };
}
