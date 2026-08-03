import { todayUTC } from './save.js';

// Daily Challenge modifiers. Each UTC day pins ONE modifier (rotates
// deterministically, so everyone gets the same twist on the same shared course),
// applied as run-level multipliers on game.mods. One clear, single-axis twist
// each — announced on the daily card + a takeoff banner, so the daily reads as a
// real event, not a normal run.

// Deterministic per-UTC-day hash (FNV-1a), salted so the modifier pick is
// decoupled from the course seed.
function dayHash(salt) {
  const str = salt + todayUTC();
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const DAILY_MODS = [
  { id: 'gold',   name: 'Gold Rush',    glyph: '◆',  brief: 'Golden embers pay double.',                 mods: { gold: 2 } },
  { id: 'winds',  name: 'High Winds',   glyph: '»',  brief: 'A fierce tailwind — fly faster, score harder.', mods: { speed: 1.12 } },
  { id: 'sharp',  name: 'Sharpshooter', glyph: '◎',  brief: 'Perfect rings score big — thread every needle.', mods: { perfect: 2.2 } },
  { id: 'streak', name: 'Hot Streak',   glyph: '▲',  brief: 'Every point burns brighter today.',          mods: { score: 1.4 } },
  { id: 'twin',   name: 'Twin Suns',    glyph: '✦',  brief: 'A taste of everything — gold and glory.',    mods: { gold: 1.5, score: 1.15 } },
];

const DEFAULT_MODS = { gold: 1, speed: 1, perfect: 1, score: 1 };

// Today's modifier (deterministic per UTC day).
export function todaysDailyMod() {
  return DAILY_MODS[dayHash('dd-mod-') % DAILY_MODS.length];
}

// Run-level multipliers for a modifier (or the neutral 1× defaults for null).
export function dailyMods(mod) {
  return { ...DEFAULT_MODS, ...(mod ? mod.mods : null) };
}
