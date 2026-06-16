// Pure-node tests for the Dragon Ascension system.
import './shim.mjs';
import { assert, assertEq } from './shim.mjs';

const { saveData } = await import('../js/save.js');
const {
  ASCENSION_TIERS, tierCostMult, tierCost,
  ascensionTier, radianceRank, flownMetres, canAscend,
  ascend, ascendEmberBonus, grandfatherAscension,
} = await import('../js/ascension.js');

let n = 0;
const ok = (msg) => { n++; console.log(`  ✓ ${msg}`); };

// Helper: reset the relevant save fields between tests
function reset(embers = 5000, flown = [], tiers = []) {
  saveData.embers = embers;
  saveData.mastery.flown = flown;
  saveData.ascension.tiers = tiers;
  saveData.ascension.radiance = [];
  saveData.skins.equipped = 'azure';
  saveData.skins.owned = ['azure'];
}

// --- tierCostMult ---
// base dragon (cost 0): mult = 1
assertEq(tierCostMult(0), 1, 'free dragon: mult = 1');
// dragon cost 5000: mult = 1 + 1 = 2, rounded to 0.5 → 2
assertEq(tierCostMult(5000), 2, 'cost-5000 dragon: mult = 2');
// dragon cost 2500: 1 + 0.5 = 1.5 → 1.5
assertEq(tierCostMult(2500), 1.5, 'cost-2500 dragon: mult = 1.5');
ok('tierCostMult rounds to nearest 0.5 correctly');

// --- tierCost ---
// Tier 0 (Kindled) base cost 700, mult 1 → 700 → rounded to 50 → 700
const azureCost = 0; // azure is free
assertEq(tierCost(azureCost, 0), 700, 'azure tier-0 cost = 700');
// Ember dragon cost 1200 (example): mult = Math.round((1 + 1200/5000)*2)/2 = Math.round(2.48)/2 = 2.5/2 = 1.5? no...
// (1 + 1200/5000) = 1.24, * 2 = 2.48, round = 2, /2 = 1.0? No: Math.round(2.48) = 2, 2/2 = 1.0? Wait
// Actually: Math.round((1 + dragonCost/5000) * 2) / 2
// dragonCost=1200: (1 + 0.24) * 2 = 2.48, round = 2, /2 = 1.0
// So mult = 1.0
// Hmm that doesn't seem right. Let me re-read: Math.round((1 + dragonCost/5000) * 2) / 2
// For dragonCost=2500: (1+0.5)*2=3.0, round=3, /2=1.5 ✓
// For dragonCost=5000: (1+1)*2=4, round=4, /2=2 ✓
// For dragonCost=0: (1+0)*2=2, round=2, /2=1 ✓
// For dragonCost=1200: (1+0.24)*2=2.48, round=2, /2=1.0
// So ember-like dragon at cost 1200 → mult = 1.0 → same as free dragon for costs < 1250
// That seems intentional
const cost1200mult = tierCostMult(1200);
assert(cost1200mult === 1.0, `cost-1200 dragon: mult = ${cost1200mult}`);
ok('tierCost computes correctly for standard costs');

// --- ascensionTier / flownMetres ---
reset();
assertEq(ascensionTier('azure'), 0, 'no tiers: returns 0');
assertEq(flownMetres('azure'), 0, 'no flown: returns 0');
saveData.ascension.tiers = [['azure', 2]];
assertEq(ascensionTier('azure'), 2, 'reads stored tier');
saveData.mastery.flown = [['azure', 15000]];
assertEq(flownMetres('azure'), 15000, 'reads stored metres');
ok('ascensionTier and flownMetres read saveData correctly');

// --- canAscend ---
reset(5000, [['azure', 15000]]);
// Tier 0: needs 10000m (met), cost=600 ≤ 5000 embers → ok
const r0 = canAscend('azure', 0);
assert(r0.ok, 'can ascend: gate met, embers met');
assertEq(r0.gateMetres, ASCENSION_TIERS[0].metres, 'gateMetres is tier-0 threshold');

// No metres → not ok
reset(5000, [['azure', 0]]);
const r1 = canAscend('azure', 0);
assert(!r1.ok, 'cannot ascend: gate not met');
assert(r1.flown === 0, 'flown reported correctly');

// Metres met but not enough embers
reset(100, [['azure', 15000]]);
const r2 = canAscend('azure', 0);
assert(!r2.ok, 'cannot ascend: not enough embers');
assert(r2.cost > 100, 'cost reported correctly');

// Tier already at max (3 = final form)
reset(99999, [['azure', 999999]], [['azure', 3]]);
const rMax = canAscend('azure', 0);
assert(!rMax.ok, 'cannot ascend beyond the final form (tier 3)');
assertEq(Object.keys(rMax).length, 1, 'max tier returns bare { ok: false }');
ok('canAscend correctly gates on metres, embers, and tier limit');

// --- ascend ---
reset(5000, [['azure', 15000]]);
const result = ascend('azure', 0);
assert(result, 'ascend returns true on success');
assertEq(ascensionTier('azure'), 1, 'tier incremented to 1');
assert(saveData.embers < 5000, 'embers deducted');
const costPaid = 5000 - saveData.embers;
assertEq(costPaid, tierCost(0, 0), 'correct cost deducted');
ok('ascend increments tier and deducts embers');

// Ascend again with insufficient metres
const tier1metres = ASCENSION_TIERS[1].metres; // 30000
reset(9999, [['azure', tier1metres - 1]], [['azure', 1]]);
const fail = ascend('azure', 0);
assert(!fail, 'ascend fails when gate not met');
assertEq(ascensionTier('azure'), 1, 'tier unchanged on failure');
ok('ascend fails gracefully when gate not met');

// --- ascendEmberBonus ---
// Equip a PREMIUM dragon (SSSR) so tier 3 is actually reachable — starters cap
// at SSR/tier 2, where the bonus clamps to 2% (see maxTierFor).
reset();
saveData.skins.equipped = 'solar';
saveData.ascension.tiers = [];
assertEq(ascendEmberBonus(), 0, 'tier 0: no bonus');
saveData.ascension.tiers = [['solar', 3]];
assert(Math.abs(ascendEmberBonus() - 0.03) < 0.001, 'tier 3 (final): 3% bonus');
ok('ascendEmberBonus is 1% per tier (final form = 3%)');

// --- radianceRank (legacy) ---
// The "Brighter Aura" radiance ember-sink was removed (apex now reads EVOLVED ✦
// MAX). radianceRank survives only to keep pre-removal aura ranks glowing.
reset();
assertEq(radianceRank('azure'), 0, 'radianceRank defaults to 0');
ok('radianceRank reads legacy radiance data');

// --- grandfatherAscension ---
// Fresh save: no tiers yet, but azure has 70000m flown
reset(0, [['azure', 70000]]);
saveData.ascension.tiers = [];
saveData.skins.owned = ['azure'];
grandfatherAscension(['azure']);
// 70000m ≥ 60000 (tier 2 gate) but < 150000 (tier 3 gate) → should grant tier 2
assertEq(ascensionTier('azure'), 2, 'grandfather grants tier 2 for 70000m flown');

// Already has tiers: don't overwrite
reset(0, [['azure', 250000]]);
saveData.ascension.tiers = [['azure', 1]];
grandfatherAscension(['azure']);
assertEq(ascensionTier('azure'), 1, 'grandfather is no-op when tiers already exist');

// Not owned: skip
reset(0, [['ember', 250000]]);
saveData.ascension.tiers = [];
saveData.skins.owned = []; // doesn't own ember
grandfatherAscension(['ember']);
assertEq(ascensionTier('ember'), 0, 'grandfather skips unowned dragons');
ok('grandfatherAscension grants correct free tiers and is idempotent');

console.log(`\n${n} ascension checks passed.`);
