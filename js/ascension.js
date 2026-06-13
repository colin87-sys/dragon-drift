import { saveData, persist } from './save.js';

// Dragon Ascension: a 5-tier per-dragon ladder gated by mastery metres + ember
// cost. Each tier is visible as a Pokémon-style growth stage (hatchling →
// adolescent → apex). Radiance is the uncapped post-T5 prestige sink.
//
// Collections are arrays of [key, n] pairs — deepMerge drops dynamic-key maps.

export const ASCENSION_TIERS = [
  { name: 'Kindled', cost: 600,  metres: 10000  }, // gate = mastery star 1
  { name: 'Blazing', cost: 1000, metres: 30000  }, // star 2
  { name: 'Radiant', cost: 1600, metres: 75000  }, // star 3
  { name: 'Mythic',  cost: 2400, metres: 150000 }, // new star 4
  { name: 'Eternal', cost: 3500, metres: 250000 }, // new star 5
];

// Per-dragon cost multiplier: 1 + dragonCost/5000, rounded to nearest 0.5.
export function tierCostMult(dragonCost) {
  return Math.round((1 + dragonCost / 5000) * 2) / 2;
}

export function tierCost(dragonCost, tierIndex) {
  return Math.round(ASCENSION_TIERS[tierIndex].cost * tierCostMult(dragonCost) / 50) * 50;
}

export function ascensionTier(key) {
  const entry = (saveData.ascension.tiers || []).find(e => e[0] === key);
  return entry ? entry[1] : 0;
}

export function radianceRank(key) {
  const entry = (saveData.ascension.radiance || []).find(e => e[0] === key);
  return entry ? entry[1] : 0;
}

export function flownMetres(key) {
  const entry = (saveData.mastery.flown || []).find(e => e[0] === key);
  return entry ? entry[1] : 0;
}

export function canAscend(key, dragonCost) {
  const tier = ascensionTier(key);
  if (tier >= ASCENSION_TIERS.length) return { ok: false };
  const next = ASCENSION_TIERS[tier];
  const cost = tierCost(dragonCost, tier);
  const flown = flownMetres(key);
  return {
    ok: saveData.embers >= cost && flown >= next.metres,
    cost,
    gateMetres: next.metres,
    flown,
  };
}

export function ascend(key, dragonCost) {
  const check = canAscend(key, dragonCost);
  if (!check.ok) return false;
  saveData.embers -= check.cost;
  const entry = saveData.ascension.tiers.find(e => e[0] === key);
  if (entry) entry[1]++;
  else saveData.ascension.tiers.push([key, 1]);
  persist();
  return true;
}

export function radianceCost(key) {
  return 3000 + 1500 * radianceRank(key);
}

export function buyRadiance(key) {
  const cost = radianceCost(key);
  if (saveData.embers < cost) return false;
  saveData.embers -= cost;
  const entry = saveData.ascension.radiance.find(e => e[0] === key);
  if (entry) entry[1]++;
  else saveData.ascension.radiance.push([key, 1]);
  persist();
  return true;
}

// 1% ember bonus per equipped dragon's ascension tier, max 5%.
export function ascendEmberBonus() {
  const key = saveData.skins.equipped;
  const tier = ascensionTier(key);
  return Math.min(tier * 0.01, 0.05);
}

// Pokémon-style evolution stage: 0 = hatchling, 1-2 = adolescent, 3+ = apex.
export function evoStage(tier) {
  return tier >= 3 ? 2 : tier >= 1 ? 1 : 0;
}

// Derived dragon def incorporating ascension tier + radiance amplification.
export function ascendedDef(def, tier, radiance) {
  radiance = radiance || 0;
  const d = JSON.parse(JSON.stringify(def));
  const stage = evoStage(tier);
  if (def.stages && def.stages[stage]) {
    Object.assign(d.model, def.stages[stage]);
  }
  d.fx = { ...d.fx };
  d.fx.auraIdle = Math.min(0.5, (def.fx.auraIdle || 0) + 0.06 * tier + 0.01 * radiance);
  d.fx.sparkle = def.fx.sparkle || tier >= 3;
  d.fx.wingGlow = 1 + 0.15 * tier;
  if (tier >= 5) d.fx.bodyGlow = 1.6;
  return d;
}

// Grandfather migration: on first boot after this feature lands, grant free
// tiers (up to 3) for mastery metres players have already flown — they earned
// the stage; the ember sink applies to tiers 4-5, Radiance, and future work.
export function grandfatherAscension(dragonKeys) {
  if (!saveData.ascension || saveData.ascension.tiers.length > 0) return;
  let granted = false;
  for (const key of dragonKeys) {
    if (!saveData.skins.owned.includes(key)) continue;
    const metres = flownMetres(key);
    let freeTiers = 0;
    for (let i = 0; i < Math.min(ASCENSION_TIERS.length, 3); i++) {
      if (metres >= ASCENSION_TIERS[i].metres) freeTiers = i + 1;
    }
    if (freeTiers > 0) {
      saveData.ascension.tiers.push([key, freeTiers]);
      granted = true;
    }
  }
  if (granted) persist();
}
