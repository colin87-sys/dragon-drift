import { saveData, persist } from './save.js';

// Flight Milestones: a ladder of lifetime-stat rungs that auto-pay embers at
// run end. Rungs are tuned so the next one is usually 1–3 runs away — there
// is always a reward just over the horizon. Claim keys 'stat:at' live in
// saveData.milestones.claimed (array — see deepMerge note in save.js).

export const MILESTONES = [
  { stat: 'totalRings',      label: 'lifetime rings',   unit: '',  rungs: [[150, 30], [400, 40], [900, 60], [2000, 80], [4000, 100], [8000, 150]] },
  { stat: 'totalDist',       label: 'lifetime metres',  unit: 'm', rungs: [[10000, 30], [25000, 40], [50000, 60], [100000, 80], [200000, 100], [400000, 150]] },
  { stat: 'totalPerfects',   label: 'perfect rings',    unit: '',  rungs: [[50, 30], [150, 50], [400, 70], [1000, 100], [2500, 150]] },
  { stat: 'totalNearMisses', label: 'near misses',      unit: '',  rungs: [[100, 30], [300, 50], [800, 80], [2000, 120]] },
  { stat: 'totalGates',      label: 'windows threaded', unit: '',  rungs: [[50, 30], [150, 50], [400, 80], [1000, 120]] },
  { stat: 'gauntletsCleared', label: 'gauntlets cleared', unit: '', rungs: [[10, 30], [30, 50], [80, 80], [200, 120]] },
  { stat: 'totalGoldEmbers', label: 'golden embers',    unit: '',  rungs: [[5, 30], [15, 50], [40, 80], [100, 120]] },
];

const claimKey = (stat, at) => `${stat}:${at}`;

// Run-end sweep: pay every newly crossed rung. Returns
// [{stat,label,at,unit,reward}] for the recap ledger.
export function settleMilestones() {
  const claimed = saveData.milestones.claimed;
  const out = [];
  for (const m of MILESTONES) {
    const have = saveData.stats[m.stat] || 0;
    for (const [at, reward] of m.rungs) {
      if (have < at) break;
      const key = claimKey(m.stat, at);
      if (claimed.includes(key)) continue;
      claimed.push(key);
      saveData.embers += reward;
      out.push({ stat: m.stat, label: m.label, at, unit: m.unit, reward });
    }
  }
  if (out.length) persist();
  return out;
}

// Dragon mastery stars: metres flown per dragon (gameState.recordBests
// accumulates into mastery.flown) cross star thresholds that pay embers —
// a quiet nudge to rotate the roster. Claim keys 'dragonKey:starIndex'.
export const MASTERY_STARS = [[10000, 40], [30000, 80], [75000, 150]];

export function masteryStarsFor(metres) {
  return MASTERY_STARS.filter(([at]) => metres >= at).length;
}

export function settleMasteryStars(dragonName) {
  const claimed = saveData.mastery.starsClaimed;
  const out = [];
  for (const [key, metres] of saveData.mastery.flown) {
    MASTERY_STARS.forEach(([at, reward], i) => {
      const ck = `${key}:${i}`;
      if (metres >= at && !claimed.includes(ck)) {
        claimed.push(ck);
        saveData.embers += reward;
        out.push({ dragonKey: key, dragonName: dragonName(key), star: i + 1, reward });
      }
    });
  }
  if (out.length) persist();
  return out;
}

// The globally nearest unclaimed rung, by estimated runs-to-reach. Feeds the
// NEXT UP selector and the start screen milestone line. Returns
// { label, at, unit, have, reward, frac, runsAway } or null when ladder done.
export function nextMilestone() {
  const claimed = saveData.milestones.claimed;
  const runs = Math.max(saveData.stats.runs, 1);
  let best = null;
  for (const m of MILESTONES) {
    const have = saveData.stats[m.stat] || 0;
    for (const [at, reward] of m.rungs) {
      if (claimed.includes(claimKey(m.stat, at))) continue;
      if (have >= at) continue; // pays at next settle; not a "goal"
      const perRun = Math.max((saveData.stats[m.stat] || 0) / runs, 0.001);
      const runsAway = (at - have) / perRun;
      if (!best || runsAway < best.runsAway) {
        best = {
          label: m.label, at, unit: m.unit, have, reward,
          frac: have / at, runsAway,
        };
      }
      break; // only the first unclaimed rung per stat is "next"
    }
  }
  return best;
}
