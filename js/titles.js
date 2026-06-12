import { saveData, persist } from './save.js';

// Equippable pilot titles — pure identity, earned never bought. Granted by
// feats, weekly trials and pilot levels; equipped on the PILOT screen and
// shown on the start screen + share text.

export const TITLES = [
  // Pilot level milestones (every 5 levels)
  { id: 'skylark',      name: 'Skylark',        source: 'Pilot level 5' },
  { id: 'cloudcarver',  name: 'Cloud Carver',   source: 'Pilot level 10' },
  { id: 'stormrider',   name: 'Storm Rider',    source: 'Pilot level 15' },
  { id: 'emberlord',    name: 'Ember Lord',     source: 'Pilot level 20' },
  { id: 'skysovereign', name: 'Sky Sovereign',  source: 'Pilot level 25' },
  { id: 'mythwing',     name: 'Mythwing',       source: 'Pilot level 30' },
  // Feats
  { id: 'goldwing',     name: 'Goldwing',       source: 'Feat: Golden Thread' },
  { id: 'slipstream',   name: 'Slipstream',     source: 'Feat: Flow State' },
  { id: 'ghost',        name: 'Ghost',          source: 'Feat: Untouchable' },
  { id: 'dawnchaser',   name: 'Dawnchaser',     source: 'Feat: Dawn Patrol' },
  { id: 'driftveteran', name: 'Drift Veteran',  source: 'Feat: Veteran of the Drift' },
  { id: 'midas',        name: 'Midas',          source: 'Feat: Midas Wing' },
  // Weekly trials
  { id: 'longhauler',   name: 'Long Hauler',     source: 'Weekly trial' },
  { id: 'deadeye',      name: 'Deadeye',         source: 'Weekly trial' },
  { id: 'daybreaker',   name: 'Daybreaker',      source: 'Weekly trial' },
  { id: 'corridorrunner', name: 'Corridor Runner', source: 'Weekly trial' },
  { id: 'needleworker', name: 'Needleworker',    source: 'Weekly trial' },
  { id: 'hairsbreadth', name: 'Hairsbreadth',    source: 'Weekly trial' },
  { id: 'goldhunter',   name: 'Goldhunter',      source: 'Weekly trial' },
  { id: 'surgeheart',   name: 'Surgeheart',      source: 'Weekly trial' },
  { id: 'highflyer',    name: 'Highflyer',       source: 'Weekly trial' },
];

// Title for hitting a level milestone (every 5 levels), or null.
const LEVEL_TITLES = [[5, 'skylark'], [10, 'cloudcarver'], [15, 'stormrider'],
  [20, 'emberlord'], [25, 'skysovereign'], [30, 'mythwing']];
export function levelTitleId(level) {
  const hit = LEVEL_TITLES.find(([lv]) => lv === level);
  return hit ? hit[1] : null;
}

export function titleById(id) {
  return TITLES.find((t) => t.id === id) || null;
}

// Grant a title; auto-equips the first one earned. Returns true if new.
export function grantTitle(id) {
  if (!titleById(id) || saveData.titles.owned.includes(id)) return false;
  saveData.titles.owned.push(id);
  if (!saveData.titles.equipped) saveData.titles.equipped = id;
  persist();
  return true;
}

export function equippedTitleName() {
  const t = titleById(saveData.titles.equipped);
  return t ? t.name : '';
}
