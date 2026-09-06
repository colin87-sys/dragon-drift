# 2026-07-13 — Aurora PR-2: appending BIOMES[6] (the night biome) — the crash-map + the ?biome warp

**Why.** The aurora sky was live but only behind the `?aurora=1` forced preview. To make it REAL it needs
its biome — a dark, still, moonlit night canvas the curtain sits against. This appends `BIOMES[6]`
"Aurora Shallows" and makes it flyable via `?biome=6`, WITHOUT entering the shipped rotation yet (the
`CYCLE` flip is PR-4), so the world stays byte-identical.

**Did.** Appended `BIOMES[6]` (Fable-spec'd palette: near-black indigo sky so ALL saturation comes from the
curtain, `aurora: 1.0`, stillest water in the game `waveAmp 0.2` = the mirror, a dim green-cyan `hemiSky`
so props pick up a free aurora wash, `fogFarColor` sinking the far field to near-black). Added the three
INDEX-KEYED arrays that crash if missing: `mats.body[6]` + `PHASE_SKINS[6]` (obstacles.js), `PALETTES[6]`
(setpieces.js). Added a `setForcedBiome(i)` debug seam (`?biome=6`) that pins `biomeAt` to one biome.

**Reusable patterns banked.**
- **Before appending an array element that is used as an ID, MAP every consumer — an Explore subagent is
  the right tool.** A parallel mapper swept the codebase and returned a ranked table: the HARD (crash)
  requirements were exactly three — `mats.body[bi]`, `PHASE_SKINS[bi]`→(veil/edge/rim/gateFrameMats), and
  `PALETTES[bi % len]` — each indexed by `biomeIndexAt` with NO null-guard (`arr[6]` = `undefined` = crash
  on the first obstacle/phase-gate, or `% len` = silently the WRONG palette). Everything else was either
  null-safe (`BIOMES[bi]?.anchor ?? null`, `?.bullets`, `?.hazard` — the optional-channel pattern pays off)
  or conditional (prop `primary[]`/`accent[]` only matter once the biome gets its OWN `matIndex` archetype,
  which is a later PR). Knowing the THREE hard ones up front turned a spelunk into three edits.
- **Append-not-cycle keeps determinism free.** `BIOMES.length` goes 6→7 but `CYCLE` stays `[0..5]`, so the
  play order — and every fixtured course — is byte-identical; the new biome is reachable ONLY via the
  `?biome=6` debug pin until the flip. `gold-determinism` stays green because course gen is biome-blind
  AND the cycle is unchanged. The debug pin (`forcedBiome`, null in real play) makes `biomeAt` identity
  when off, so it doesn't perturb anything either.
- **The contrast gate catches a palette-vs-fixed-color clash the author can't see.** `bulletcontrast.mjs`
  flagged the FIXED magenta DANGER bullet (L≈0.36, never per-biome overridable) failing against the new
  horizon (L≈0.24) — too close, no layered read. The per-biome `bullets` lever only covers the BAND, not
  the role colors, so the fix was to DARKEN the horizon shelf below the layered-read window (L 0.24→0.20)
  — which also makes the aurora pop more. Run the standing gate after any new-biome palette; it turns a
  "looks fine to me" into a proven read.
- **A boot montage is the real test that the index arrays resolve.** The unit tests check data SHAPE; only
  booting `?biome=6` under WebGL and spawning obstacles/phase-gates in it exercises `mats.body[6]` etc. for
  real. Point the existing capture tool at the real biome, not the forced preview.

**Leapfrog.** Aurora Shallows is a real, flyable biome (`?biome=6`) with its own night palette and the
curtain lit by `env.auroraMix`. Next: **PR-3** the flat floe/iceFang props + mirror-water tuning + a hemi
ground-glow pulse (its own `matIndex:6` archetype → then the conditional `primary[]`/`accent[]`/`BIOME_TINTS[]`
7th entries the mapper flagged come due), then **PR-4** THE FLIP (`CYCLE=[0,1,2,3,4,6,5]`, between Mire and
Astral) so it enters the rotation. Plan: `reforged/AURORA-SHALLOWS-PLAN.md`.
