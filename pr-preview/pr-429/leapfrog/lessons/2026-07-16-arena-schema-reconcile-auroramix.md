# The arena schema gate is a to-do list: reconcile new env fields, don't just red-flag them

**What we did.** The aurora stream (auroraSky / biomes PR-4) added a new scalar `auroraMix`
to `computeEnv`'s scratch. `tests/unmaskedarena.mjs` has a schema-completeness guard
(audit F3.4) that asserts `ARENA_ENV_KEYS` equals `computeEnv(0)`'s keys EXACTLY — so the
new field made the suite go red (`missing ["auroraMix"]`). We reconciled it: added
`auroraMix` to `SCALAR_KEYS` in `arenaSkin.js` and set `auroraMix: 0` in all four override
tables (VOID / FLOOD / HEAVEN / GOLD_FLOOD). Suite back to 60/60.

**What we learned.** That red check is not noise to caveat around in a PR body — it is the
gate doing its job. It exists *precisely* so a graphics-stream env addition fails LOUDLY in
the arena's face instead of silently leaking a biome value into the void/heaven. The correct
response to it is always the same two-line move: (1) list the field in `ARENA_ENV_KEYS`,
(2) author a deliberate value for it in every one of the four palette tables. Leaving it red
means the arena is *inheriting the biome's value* for that field — here, the aurora curtain's
`auroraMix` would ride into the final-boss arena, and the Godhead Detonation is no aurora night.

**The gotcha.** The value is almost always `0` for a new *effect* channel (the arena authors
a clean sky; biome effects don't belong behind the mask), but you still have to write it in
all four tables — the byte-identity and mix-1/mix-2 tests check every key against every table,
so a partial add (keys but not tables, or 3 of 4 tables) fails a *different* assertion.

**Reusable pattern.** When `unmaskedarena` reports `ARENA_ENV_KEYS is schema-complete …
(missing [X])`, grep the new field in `biomes.js` to see what it drives, then add it to
`arenaSkin.js` SCALAR_KEYS/COLOR_KEYS + all four `*_HEX` tables with the value that makes the
arena *own* it (0 for an effect the void/heaven suppresses). Don't ship the red check as
"pre-existing" — it's assigned to whoever next touches the arena, and reconciling it is cheap.

**What it unlocks.** A green suite on the composition branch, and the guarantee that the
aurora curtain can never dawn inside the Godhead Detonation.
