import { saveData, persist, persistNow } from './save.js';
import { DRAGONS } from './dragons.js';

// Flightmarks: trail cosmetics for the dragon (the shop STYLE tab). Equipped
// '' = the dragon's OWN colours. Every dragon's signature trail is offered as a
// style, so any dragon can fly any dragon's wake — a red dragon can wear the
// azure-blue trail, etc. — plus 3 unique multi-hue specials no dragon has.
// deepMerge rule: marksOwned is an array (no keyed map).

// One style per dragon, mirroring that dragon's signature trail colours (kept in
// sync with DRAGONS automatically). Cost escalates gently across the roster.
const DRAGON_TRAILS = Object.entries(DRAGONS).map(([key, d], i) => ({
  id: `trail_${key}`,
  name: `${d.name.split(' ')[0]} Wake`,
  cost: 800 + i * 150,
  trail: d.trail,
  boostTrail: d.boostTrail,
  trailPalette: null,
}));

// Three unique multi-hue specials — looks no single dragon wears.
const SPECIAL_TRAILS = [
  { id: 'aurora',   name: 'Aurora',    cost: 2400, trail: 0x80ffe0, boostTrail: 0xa0fff0, trailPalette: [0x80ffe0, 0x40a0ff, 0xff80e0, 0xffffa0] },
  { id: 'goldleaf', name: 'Goldleaf',  cost: 3200, trail: 0xffd060, boostTrail: 0xffe090, trailPalette: [0xffd060, 0xffaa20, 0xff8040, 0xffe090] },
  { id: 'voidrift', name: 'Void Rift', cost: 3600, trail: 0xb33cff, boostTrail: 0xff5ad6, trailPalette: [0xb33cff, 0xff2db5, 0x6a2ad0, 0xe8b0ff] },
];

export const FLIGHTMARKS = [...DRAGON_TRAILS, ...SPECIAL_TRAILS];

// The old generic single-colour marks → their nearest replacement, so existing
// purchases survive the roster change. Run once at boot (migrateFlightmarks).
const LEGACY_MAP = {
  ember_red: 'trail_ember', ocean_blue: 'trail_azure', forest_green: 'trail_jade',
  gold_rush: 'goldleaf', void_purple: 'voidrift', // aurora / goldleaf keep their ids
};
export function migrateFlightmarks() {
  const c = saveData.cosmetics;
  let changed = false;
  if (Array.isArray(c.marksOwned) && c.marksOwned.some(id => LEGACY_MAP[id])) {
    c.marksOwned = [...new Set(c.marksOwned.map(id => LEGACY_MAP[id] || id))];
    changed = true;
  }
  if (c.markEquipped && LEGACY_MAP[c.markEquipped]) {
    c.markEquipped = LEGACY_MAP[c.markEquipped];
    changed = true;
  }
  if (changed) persist();
}

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
  persistNow(); // discrete purchase — write immediately, never debounced
  return true;
}

export function equipFlightmark(id) {
  if (id !== '' && !flightmarkOwned(id)) return false;
  saveData.cosmetics.markEquipped = id;
  persistNow();
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
  else d.trailPalette = null; // a single-colour style overrides a dragon's own palette
  return d;
}
