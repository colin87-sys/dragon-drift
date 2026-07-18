# 2026-07-13 — The biome CYCLE refactor (Aurora PR-0): append + order-layer, and grep ALL consumers

**Why.** Prerequisite for slotting a new biome (Aurora Shallows) into the course between two
existing ones WITHOUT renumbering the world. Every `biomes:[index]` whitelist, `matIndex`,
`PHASE_SKINS[i]`, `mats.body[i]`, gate-frame mat, and set-piece `PALETTES[i]` is keyed by ARRAY
INDEX — so reordering `BIOMES[]` would renumber everything. BIOME-DESIGN §5.6 anticipated this.

**Did.** Added `export const CYCLE = [0,1,2,3,4,5]` in `biomes.js`; `biomeAt` now indexes
`CYCLE[block % CYCLE.length]` instead of `block % BIOMES.length`. With the identity order it is a
byte-identical no-op; adding a biome later is `append BIOMES[6]` + one `CYCLE` edit.

**Reusable patterns banked.**
- **Append + an order-layer, never reorder.** Make array indices STABLE IDs (append-only) and
  decouple the play-ORDER into a separate `CYCLE[]`. Now a new biome slots anywhere by editing one
  array, and no `biomes:[i]` whitelist / `matIndex` / skin / palette ever renumbers. The general
  move whenever "the position in a list" has become an ID that other data references.
- **When you add an indirection layer, grep for EVERY consumer of the thing it replaces — not just
  the obvious one.** `biomeAt` was the obvious `% BIOMES.length` cycler, but `level.js`
  `setPiecesBetween` computed the gateway/mega-arch `biomeIndex` as `k % BIOMES.length` DIRECTLY,
  bypassing `biomeAt`. Left unrouted, the set-piece gateway palettes would have silently diverged
  from the world biome the moment `CYCLE` reordered — the classic "silently does nothing / silently
  wrong" seam the three-touch rule exists to catch. `grep '% BIOMES.length'` found it; everything
  else takes an INDEX from `biomeIndexAt` (downstream of `biomeAt`) so it's correct by construction.
- **Prove a "no-op refactor" byte-for-byte, don't assert it.** `tests/biomecycle.mjs` checks the new
  path reproduces the OLD formula exactly across two full cycles (`biomeAt(dist).ia === block % N`,
  `.ib === (ia+1) % N`) + the fixture gate (`gold-determinism` byte-identical). "Provably identical
  output" is a real gate; "should be identical" is a bug waiting.
- **Scope the determinism claim precisely.** Course generation is biome-BLIND (rings/obstacles/golds
  never read biome data) → `gold-determinism` stays byte-identical through this refactor AND through
  the eventual `CYCLE` flip. What changes when `CYCLE` reorders is only VISUALS + the *unfixtured*
  set-piece palettes and (where a biome declares one) `out.hazards` — stated in the PR, not hidden.

**Leapfrog.** The `CYCLE` layer is live with the shipped identity order — a proven no-op. Adding
**Aurora Shallows** is now `append BIOMES[6]` + `CYCLE = [0,1,2,3,4,6,5]` (between Mire and Astral),
each behind that one edit. Next: **Aurora PR-1**, the procedural aurora sky (js/auroraSky.js spliced
into the dome like N9 clouds), provable on `?flowrun&aurora=1` before the biome exists. Full plan:
`reforged/AURORA-SHALLOWS-PLAN.md`.
