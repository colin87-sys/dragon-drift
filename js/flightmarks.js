import { saveData, persist } from './save.js';

// Flightmarks: purchasable trail cosmetics for the dragon. The STYLE tab in
// the shop. Equipped '' = dragon's own colors.
// deepMerge rule: marksOwned is an array (no keyed map).

export const FLIGHTMARKS = [
  { id: 'ember_red',    name: 'Ember Red',    cost: 800,  trail: 0xff4020, boostTrail: 0xff8040, trailPalette: null },
  { id: 'ocean_blue',   name: 'Ocean Blue',   cost: 800,  trail: 0x40a0ff, boostTrail: 0x80d0ff, trailPalette: null },
  { id: 'forest_green', name: 'Forest',       cost: 800,  trail: 0x40e060, boostTrail: 0x80ff90, trailPalette: null },
  { id: 'gold_rush',    name: 'Gold Rush',    cost: 1200, trail: 0xffd060, boostTrail: 0xffe090, trailPalette: null },
  { id: 'void_purple',  name: 'Void',         cost: 1200, trail: 0x9040e0, boostTrail: 0xc080ff, trailPalette: null },
  { id: 'aurora',       name: 'Aurora',       cost: 2400, trail: 0x80ffe0, boostTrail: 0xa0fff0, trailPalette: [0x80ffe0, 0x40a0ff, 0xff80e0, 0xffffa0] },
  { id: 'goldleaf',     name: 'Goldleaf',     cost: 3200, trail: 0xffd060, boostTrail: 0xffe090, trailPalette: [0xffd060, 0xffaa20, 0xff8040, 0xffe090] },
];

export function flightmarkOwned(id) {
  return (saveData.cosmetics.marksOwned || []).includes(id);
}

export function equippedFlightmark() {
  return saveData.cosmetics.markEquipped || '';
}

export function buyFlightmark(id) {
  const def = FLIGHTMARKS.find(m => m.id === id);
  if (!def || flightmarkOwned(id)) return false;
  if (saveData.embers < def.cost) return false;
  saveData.embers -= def.cost;
  saveData.cosmetics.marksOwned.push(id);
  persist();
  return true;
}

export function equipFlightmark(id) {
  if (id !== '' && !flightmarkOwned(id)) return false;
  saveData.cosmetics.markEquipped = id;
  persist();
  return true;
}

// Overlay trail/boost trail from the equipped flightmark onto a dragon def copy.
export function applyFlightmark(def) {
  const id = equippedFlightmark();
  if (!id) return def;
  const mark = FLIGHTMARKS.find(m => m.id === id);
  if (!mark) return def;
  const d = { ...def };
  d.trail = mark.trail;
  d.boostTrail = mark.boostTrail;
  d.hasStyle = true; // an equipped style dominates trail color, even in Surge
  if (mark.trailPalette) d.trailPalette = mark.trailPalette;
  return d;
}
