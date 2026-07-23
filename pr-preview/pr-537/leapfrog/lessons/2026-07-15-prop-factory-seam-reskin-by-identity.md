# Prop-instance factory seam + re-skin-by-material-identity (rock-run Move 1)

**What we did.** Exposed the runtime prop-instance factory in `environment.js` for the
props-in-lane rock run (ROCKRUN-STRAIT-HANDOFF.md Move 1): `buildPropArchetype(id, matIndex?)`
→ the same `{geometry, materials}` an archetype's `build()` gives the decorative bands, and
`propArchetypeMeta(id)` (matIndex/step/biomes/comp/foam/paired). Additive only — the decorative
band path is untouched, proven byte-identical by diffing `tools/envcount.mjs` output before/after
(plus propao/propfoam/hazardskin/canyon suites green).

**The gotcha.** A RUN_KIT borrows archetypes across biomes (RUN_KIT.frozen wants aurora's
`berg`/`floe`/`skerry` in the Frozen lane), but each `build()` HARDCODES its home biome in
`mergeParts([...], biomeIdx)` — so `berg` comes back wearing aurora night-sea-ice (idx 6), not
Frozen glacial ice (idx 2). And `mergeParts` emits a *variable-length* materials array (primary
and/or accent, depending on which mats the parts use — `skerry` has no accent), so you cannot
re-skin by position.

**The reusable pattern.** Re-skin by **material identity**, not array position: the biome mats
are module-singletons in `propMats.primary/accent[]`, so map each returned material through
`propMats.primary.includes(m) → primary[matIndex]` (accent likewise). Order-proof, no-op-safe for
same-biome calls, and the in-lane instance shares the exact same material object as the horizon
band — tonally indistinguishable **by construction**, which is half the belonging gate.

**What it unlocks.** Move 2/3: `RUN_KIT.frozen` + `buildPropRun` in `obstacles.js` consume this
one seam, so lane props and horizon props can never drift apart in geometry or material. Any
future biome's rock run gets cross-biome prop borrowing for free via the `matIndex` override.
