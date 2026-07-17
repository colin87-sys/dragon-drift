# Arena schema drift is now a standing tax — batch-reconcile, and let the biome's own comments decide the value

**What we did.** Third arena schema-gate reconcile of the session. The Thunderhead Tempest
rain/atmosphere stream added SIX env fields to `computeEnv` in one PR — `cloudForce`, `deckBias`,
`stormSea`, `windX`, `windZ`, `rainMix`. The fast key-diff caught all six at once
(`MISSING: [...6...]`); reconciled them as a batch into `arenaSkin.js` — all six into `SCALAR_KEYS`
+ `0` in all four tables. Suite back to 60/60. (Prior two: `auroraMix`, then `godrayMul`/`godrayTint`
— see those lessons for the mechanical pattern and the value-decision framework.)

**What we learned — name the tax.** Across four master merges into the arena branch during the
graphics sprint, THREE carried env-field additions totalling NINE new fields. This is not
occasional; while the graphics/biome streams are hot, **assume every merge that touches
`biomes.js` adds env fields**, and run the key-diff reflexively before the browser test. The
recurrence is the norm now, not the exception.

**The efficiency that mattered — the biome's inline comments ARE the value oracle.** The
value-decision lesson said "grep how biomes.js drives the field + grep the arena table's colour
law." Faster in practice: the biome that introduced these fields **self-documents each one at its
declaration** (biomes.js ~L320-328: `stormSea` = "violent storm sea… makes the sea RAGE",
`rainMix` = "rain.js LineSegments streak layer", `deckBias` = "storm ceiling owns the sky",
`cloudForce` = "force the rolling swell geometry ON"). One read of those comments told me all six
are storm-weather effects → the Godhead Detonation is no storm (its sea is the authored haze-deck,
its sky is authored) → all six are unambiguously `0`. **When a batch of fields lands, read their
declaration comments in the source biome first; a well-commented stream hands you the arena value
for free.** Confirm the type from the scratch-init line (here L410: all six init to `0` = scalars,
so `SCALAR_KEYS` not `COLOR_KEYS`).

**The gotcha (unchanged but re-bitten-adjacent).** All four tables need the field or a *different*
assertion (mix-1/mix-2 exact-table) fails even when the key-list assertion passes. Batch edits make
it easy to update the key list + three tables and miss the fourth — after editing, re-run the
key-diff extended to check `k in TABLE` for all four tables (VOID/FLOOD/HEAVEN/GOLD_FLOOD), not just
`ARENA_ENV_KEYS`. Did that here; all four clean.

**What it unlocks.** A green arena suite that keeps surviving a fast-churning graphics master, and
a detonation whose sea/sky stay authored — no storm sea raging or rain streaking through the void.
