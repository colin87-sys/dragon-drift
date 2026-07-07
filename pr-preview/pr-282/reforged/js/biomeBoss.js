// Boss↔biome coupling (BIOME-DESIGN.md §6) — pure lookups, no state, no RNG.
// BIOMES[] and biomeIndexAt are render-side functions of distance, fully
// decoupled from level.js's RNG stream, so the anchor-boss pairing needs no
// controller: just a lookup at the spawn site with a null-safe fallback.
import { BIOMES } from './biomes.js';
import { BOSS_ORDER } from './bossDefs.js';

// The biome's anchor boss key (the §4/§5h Home-biome column), or null.
// null/absent anchor = no preference = the shipped experience — that fallback
// is the coexistence guarantee for the whole biome arc.
export function bossForBiome(bi) { return BIOMES[bi]?.anchor ?? null; }

// The spawn-site pick, pinned by §6 as a pure function so any moduloKey source
// can call it unchanged. `moduloKey` was BOSS_ORDER[i % n] when §6 was written;
// today's source is the §5h lifetime ladder's proposal — same contract: the
// non-biome pick this encounter would otherwise use.
//   1. Prefer the biome's anchor iff it is coded (in BOSS_ORDER) and not an
//      immediate repeat of the previous encounter.
//   2. Else the fallback — stepped ONE slot iff it would repeat the previous
//      boss (§6's modulo-repeat ruling: a biome pick earlier can make the
//      fallback land on the same boss twice in a row).
export function pickBossKey(moduloKey, biomeIndex, lastBossKey) {
  const preferred = bossForBiome(biomeIndex);
  if (preferred && preferred !== lastBossKey && BOSS_ORDER.includes(preferred)) return preferred;
  if (moduloKey === lastBossKey) {
    return BOSS_ORDER[(BOSS_ORDER.indexOf(moduloKey) + 1) % BOSS_ORDER.length];
  }
  return moduloKey;
}

// nextBiomeBoss(dist) — the foreshadow peek — lands with increment 4
// (BIOME-DESIGN.md §7), NOT here. Do not build it early.
