import { saveData, persist, persistNow } from './save.js';
import { DRAGONS } from './dragons.js';

// Dragon Ascension: a 5-tier per-dragon ladder gated by mastery metres + ember
// cost. Each tier is visible as a Pokémon-style growth stage (hatchling →
// adolescent → apex). Radiance is the uncapped post-T5 prestige sink.
//
// Collections are arrays of [key, n] pairs — deepMerge drops dynamic-key maps.

// 3 paid upgrades → 4 visual forms (base + 3). Each upgrade is a dramatic,
// unmistakable evolution (Charmander → Charmeleon → Charizard), the last one
// the earned, majestic apex.
export const ASCENSION_TIERS = [
  { name: 'Kindled', cost: 700,  metres: 15000  }, // form 1
  { name: 'Radiant', cost: 1600, metres: 60000  }, // form 2
  { name: 'Eternal', cost: 3200, metres: 150000 }, // form 3 — the apex
];

// Body scale per form (index = tier 0..3): the whelp is a genuinely small baby,
// the final form lands at the dragon's reference size.
// Trimmed ~12% across the board (apex 1.0 → 0.88) so the bigger redesigned
// dragon stops crowding the view of the path ahead — paired with a slightly
// higher/further chase cam (cameraController).
export const SIZE_RAMP = [0.62, 0.72, 0.82, 0.88];

// Wing growth is decoupled from body growth so the SILHOUETTE evolves, not just
// the size: the whelp is stubby-winged, the apex broad-winged. Absolute wingspan
// ≈ SIZE_RAMP × WING_RAMP, deliberately small at T0 for a dramatic T0→T1 jump.
export const WING_RAMP = [0.86, 0.92, 0.97, 1.0];

// Subtle per-form stat multipliers (index = tier 0..3) on the dragon's stats.
// Deltas are small (~1-3% between adjacent forms) so the apex feels smoother and
// a touch faster without breaking balance. drain<1 = better stamina efficiency.
export const STAT_RAMP = [
  { speed: 0.99,  handling: 0.96, drain: 1.04, regen: 0.95 }, // F1 baseline
  { speed: 0.995, handling: 0.98, drain: 1.01, regen: 0.99 }, // F2 +stamina/boost
  { speed: 1.0,   handling: 1.00, drain: 0.99, regen: 1.02 }, // F3 +stamina/handling
  { speed: 1.01,  handling: 1.02, drain: 0.97, regen: 1.04 }, // F4 +handling/boost/stamina
];

// Per-dragon cost multiplier: 1 + dragonCost/5000, rounded to nearest 0.5.
export function tierCostMult(dragonCost) {
  return Math.round((1 + dragonCost / 5000) * 2) / 2;
}

export function tierCost(dragonCost, tierIndex) {
  return Math.round(ASCENSION_TIERS[tierIndex].cost * tierCostMult(dragonCost) / 50) * 50;
}

// Apex form index per dragon: starters (SSR) cap at Radiant (tier 2 = SSR);
// premiums (SSSR) go to Eternal (tier 3 = SSSR). Keeps starters from reaching
// the eternal/legendary form at all.
export function maxTierFor(key) {
  return DRAGONS[key]?.maxRarity === 'SSR' ? 2 : ASCENSION_TIERS.length;
}

export function ascensionTier(key) {
  const entry = (saveData.ascension.tiers || []).find(e => e[0] === key);
  return Math.min(entry ? entry[1] : 0, maxTierFor(key)); // clamp legacy over-ascends
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
  if (tier >= maxTierFor(key)) return { ok: false };
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
  persistNow(); // discrete purchase — write immediately, never debounced
  return true;
}

// NOTE: the old "Brighter Aura" radiance prestige was removed — at the apex
// (Eternal) a dragon now simply reads EVOLVED ✦ MAX, no endless ember sink.
// `radianceRank` is kept so any aura ranks bought before the change still glow.

// 1% ember bonus per equipped dragon's ascension tier, max 5%.
export function ascendEmberBonus() {
  const key = saveData.skins.equipped;
  const tier = ascensionTier(key);
  return Math.min(tier * 0.01, 0.05);
}

// Derived dragon def for a given form (ascension tier 0..3) + radiance.
// def.forms[t] lists the parts that arrive at form t; they apply cumulatively
// so every upgrade visibly bolts more on (booleans stay set, numerics take the
// latest form's value). Size comes from SIZE_RAMP; the final form lights up.
export function ascendedDef(def, tier, radiance) {
  radiance = radiance || 0;
  tier = Math.max(0, Math.min(tier, ASCENSION_TIERS.length));
  const d = JSON.parse(JSON.stringify(def));

  if (def.forms) {
    for (let t = 0; t <= tier; t++) {
      const f = def.forms[t];
      if (!f) continue;
      // `colors` overrides top-level palette (e.g. the dull whelp → vivid jump);
      // everything else accretes onto the model proportions.
      const { colors, ...modelKeys } = f;
      Object.assign(d.model, modelKeys);
      if (colors) Object.assign(d, colors);
    }
  }

  // Stamp the resolved form index (0..3) so archetype models (e.g. the Phoenix)
  // can switch geometry per form without re-deriving it from glow ramps.
  d.model.formLevel = Math.min(tier, (def.forms?.length ?? 1) - 1);

  // Size ramp: noticeably smaller at base, reference size at the final form.
  // Body and wings ramp on separate curves so the wing-to-body proportion grows
  // each tier — the core of the "different silhouette per form" goal.
  //
  // A dragon's forms may instead author an EXPLICIT per-form silhouette curve via
  // named constants (bodyScale / wingSpan, with the Radiant form = 1.0) for a
  // dramatic, hand-tuned progression — used by Obsidian so its Eternal form is
  // unmistakably bigger-winged than Radiant, not just brighter. When present these
  // win over the shared SIZE_RAMP / WING_RAMP curves.
  d.model.scale = (def.model.scale || 1) *
    (d.model.bodyScale != null ? d.model.bodyScale : (SIZE_RAMP[tier] || 1));
  d.model.wingScale = (d.model.wingScale || 1) *
    (d.model.wingSpan != null ? d.model.wingSpan : (WING_RAMP[tier] || 1));

  // Subtle per-form stat progression: later forms fly a touch smoother and
  // faster (more handling/stamina/boost-efficiency, a sliver of top speed) so
  // ascending feels rewarding without trivialising the run. drain<1 = better
  // stamina/boost efficiency, regen>1 = faster stamina recovery.
  const sr = STAT_RAMP[Math.min(tier, STAT_RAMP.length - 1)];
  d.stats = {
    speed: (def.stats?.speed ?? 1) * sr.speed,
    handling: (def.stats?.handling ?? 1) * sr.handling,
    drain: (def.stats?.drain ?? 1) * sr.drain,
    regen: (def.stats?.regen ?? 1) * sr.regen,
  };

  const isFinal = tier >= ASCENSION_TIERS.length;
  d.fx = { ...d.fx };
  d.fx.auraIdle = Math.min(0.6, (def.fx.auraIdle || 0) + 0.09 * tier + 0.012 * radiance);
  d.fx.sparkle = def.fx.sparkle || isFinal;
  d.fx.wingGlow = 1 + 0.18 * tier;
  if (isFinal) d.fx.bodyGlow = 1.7;

  // Premium palette: the awe-inducing eyes/seams switch in from form 2 onward.
  if (tier >= 2 && def.apexEye) d.eye = def.apexEye;

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
