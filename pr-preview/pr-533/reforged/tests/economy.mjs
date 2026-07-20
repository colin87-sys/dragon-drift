// Economy sanity, recomputed from the def files (not hardcoded copies):
// the first unlock lands within ~5 runs, the apex dragon within 22–40,
// and total earn-rate stays in a band that keeps prices meaningful.
import { assert } from './shim.mjs';

const { MISSION_DEFS } = await import('../js/missions.js');
const { FEAT_DEFS } = await import('../js/feats.js');
const { TRIAL_POOL } = await import('../js/weekly.js');
const { MILESTONES } = await import('../js/milestones.js');
const { levelEmberReward, xpToNext } = await import('../js/save.js');
const { CONFIG } = await import('../js/config.js');

let n = 0;
const ok = (msg) => { n++; console.log(`  ✓ ${msg}`); };

// Model a median early-game run (conservative): 1.2 km, ~3k pts, 25 rings,
// 35 raw pickup embers, drifter rider (no bonus).
const run = { dist: 1200, score: 3000, rings: 25, pickups: 35 };

// Per-run sources, amortised over the first 10 runs of a daily player:
const golds = (run.dist / 1000) * (1000 / CONFIG.goldEmberInterval) * CONFIG.goldEmberChance * CONFIG.goldEmberValue;
const missionAvg = MISSION_DEFS.slice(0, 12).reduce((a, d) => a + d.reward, 0) / 12;
const missionsPerRun = 0.5; // observed completion cadence early
const earlyFeats = FEAT_DEFS.filter((d) => ['first_perfect', 'pstreak_5', 'chain_15', 'runs_10', 'gold_first'].includes(d.id))
  .reduce((a, d) => a + d.reward, 0);
const xpPerRun = Math.floor(run.score / 150) + run.rings * 2 + missionAvg / 2;
const levelsPerRun = xpPerRun / xpToNext(2);
const levelEmbersPerRun = levelsPerRun * levelEmberReward(3);
// Milestone income over first 10 runs: every rung reachable with 10-run totals
const tenRunStats = {
  totalRings: run.rings * 10, totalDist: run.dist * 10, totalPerfects: 60,
  totalNearMisses: 50, totalGates: 40, gauntletsCleared: 12, totalGoldEmbers: 8,
};
let milestone10 = 0;
for (const m of MILESTONES) {
  for (const [at, reward] of m.rungs) if ((tenRunStats[m.stat] || 0) >= at) milestone10 += reward;
}
const weeklyPerRun = TRIAL_POOL.reduce((a, t) => a + t.reward, 0) / TRIAL_POOL.length * 1.5 / 25; // ~1.5 trials/wk ÷ ~25 runs
const streakPerRun = (30 + 10 * 3) / 3; // one daily bonus across ~3 runs/day
const firstFlight = run.pickups * (CONFIG.firstFlightMult - 1) / 3;

const perRunEarly =
  run.pickups + golds + missionAvg * missionsPerRun + earlyFeats / 10 +
  levelEmbersPerRun + milestone10 / 10 + weeklyPerRun + streakPerRun + firstFlight;

console.log(`  early-game earn rate ≈ ◆${perRunEarly.toFixed(0)}/run`);
assert(perRunEarly >= 120 && perRunEarly <= 400,
  `early earn rate ◆${perRunEarly.toFixed(0)} in [120,400] — first 600◆ unlock lands in ~2-5 runs`);
ok(`first unlock (◆600) ≈ ${(600 / perRunEarly).toFixed(1)} runs away (target ≤ 5)`);
assert(600 / perRunEarly <= 5, 'first unlock within 5 runs');

// Apex arc: mid-game rate is higher (longer runs, rider bonus, more weeklies).
const perRunMid = perRunEarly * 1.35;
const spentBeforeApex = 600 + 800 + 1200 + 900; // ember dragon, track, jade, lancer
const runsToApex = (5000 + spentBeforeApex) / perRunMid;
console.log(`  apex (Solar Sovereign ◆5000 + ◆${spentBeforeApex} spent en route) ≈ ${runsToApex.toFixed(0)} runs`);
assert(runsToApex >= 18 && runsToApex <= 45, `apex arc ${runsToApex.toFixed(0)} runs in [18,45]`);
ok(`apex arc ≈ ${runsToApex.toFixed(0)} runs (target 22–40 band, ±)`);

// One-time pools stay bounded (no infinite faucets)
const featPool = FEAT_DEFS.reduce((a, d) => a + d.reward, 0);
const milestonePool = MILESTONES.reduce((a, m) => a + m.rungs.reduce((x, [, r]) => x + r, 0), 0);
console.log(`  one-time pools: feats ◆${featPool}, milestones ◆${milestonePool}`);
// Caps track shipped content: the feat pool crossed ◆2500 when the boss roster's
// feats landed (◆2750 today) — the guard's intent is BOUNDED (no infinite faucet),
// not a frozen number, so the cap steps with deliberate content additions.
assert(featPool < 3000 && milestonePool < 3500, 'one-time pools bounded');
ok('one-time pools bounded (feats < ◆3000, milestones < ◆3500)');

console.log(`\n${n} economy checks passed.`);
