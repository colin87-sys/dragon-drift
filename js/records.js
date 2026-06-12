import { on } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';
import { ui } from './ui.js';

// Personal records beyond score/distance: tracked live from the event bus,
// celebrated in-run the moment they break (once per record per run), and
// settled into the save at run end for the recap's NEW BEST chips.
//
// This module also owns the per-run counters that gameplay code doesn't
// track itself (gates, surges, clean distance) — single listener, zero
// changes to the systems that emit.

const RECORD_DEFS = [
  { key: 'bestChain',         label: 'CHAIN',             floor: 4 },
  { key: 'bestPerfectStreak', label: 'PERFECT STREAK',    floor: 2 },
  { key: 'mostRingsRun',      label: 'RINGS IN A RUN',    floor: 8 },
  { key: 'mostPerfectsRun',   label: 'PERFECTS IN A RUN', floor: 2 },
  { key: 'longestCleanDist',  label: 'CLEAN FLIGHT',      floor: 400 },
  { key: 'bestCombo',         label: 'COMBO',             floor: 2 },
];

let run = null;          // live per-run maxima
let celebrated = null;   // record keys already popped this run
let lastDamageDist = 0;

function freshRun() {
  run = { bestChain: 0, bestPerfectStreak: 0, longestCleanDist: 0 };
  celebrated = new Set();
  lastDamageDist = 0;
}
freshRun();

// In-run celebration: only for streak-flavoured records where the moment of
// breaking IS the thrill, only when the old record was worth breaking, and
// only once per record per run (popup2 stays gameplay-readable).
function celebrate(key, label, value) {
  if (celebrated.has(key)) return;
  if (saveData.records[key] < 5 || value <= saveData.records[key]) return;
  celebrated.add(key);
  ui.newBestPopup(label, value);
}

export function initRecords() {
  on('runStart', freshRun);

  on('ring', (p) => {
    run.bestChain = Math.max(run.bestChain, game.consecutiveRings);
    celebrate('bestChain', 'CHAIN', game.consecutiveRings);
    if (p && p.perfect) {
      run.bestPerfectStreak = Math.max(run.bestPerfectStreak, game.perfectStreak);
      celebrate('bestPerfectStreak', 'PERFECT STREAK', game.perfectStreak);
    }
  });
  on('gate', () => {
    game.gatesRun++;
    run.bestChain = Math.max(run.bestChain, game.consecutiveRings);
    celebrate('bestChain', 'CHAIN', game.consecutiveRings);
  });
  on('surge', () => { game.surgesRun++; });
  on('damage', (p) => { lastDamageDist = p.m; });
  on('distance', (p) => {
    run.longestCleanDist = Math.max(run.longestCleanDist, p.m - lastDamageDist);
  });
}

// Run-end diff vs the saved records. Returns [{key,label,value,prev}] of the
// records broken this run (excluding score/dist — those have their own flags).
export function settleRecords() {
  if (game.mode === 'gambit') return [];
  const values = {
    bestChain: run.bestChain,
    bestPerfectStreak: run.bestPerfectStreak,
    mostRingsRun: game.ringsCollected,
    mostPerfectsRun: game.perfectRings,
    longestCleanDist: Math.floor(run.longestCleanDist),
    bestCombo: Number(game.maxCombo.toFixed(2)),
  };
  const broken = [];
  for (const def of RECORD_DEFS) {
    const v = values[def.key];
    const prev = saveData.records[def.key];
    if (v > prev && v >= def.floor) { // floor: "best chain: 1" isn't a moment
      broken.push({ key: def.key, label: def.label, value: v, prev });
      saveData.records[def.key] = v;
    }
  }
  if (broken.length) persist();
  return broken;
}
