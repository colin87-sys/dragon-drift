# The Lost Lagoon read as a "hoarder house" because its composition engine was authored-but-NEVER-WIRED (and the legacy migration was never run)

**What we did.** The owner looked at the Lost Lagoon in the real gameplay follow-cam and called it "epically crowded… a
hoarder house of props — how is this even art composition?" Fable graded it a **HARD FAIL, composition 2.0/5**. Two root
causes, both *omissions* from the "composition pass + legacy migration" step that was on the build order but never executed:

1. **The negative-space composition engine was wired for Frozen and Caldera but NOT for Lagoon.** `writeMatrix` applied the
   breath↔congregation rhythm + arrival beat only under `bi === 2` and `bi === 3`. There was **no `bi === 0` branch** — so
   every Lagoon prop spawned at FULL density with zero rhythm: an even picket field, no open water, no focal hierarchy. The
   roster props were *authored for* the engine (they carry `comp:{floor,sMin,sMax}` + `arrivalPark:true`, and the comments
   literally say "clusters → one colossus per archipelago, off the open-mirror seam") — the props were written to a contract
   the biome never fulfilled. **The `comp` block on an archetype does NOTHING until a `bi === N` branch calls a `<biome>Comp`
   for it.**

2. **The legacy migration was never run.** Frozen/Caldera route their old props through `frozenOld`/`calderaOld` (which are
   `[]` when the new kit is active, so the legacy props park). Lagoon had a `lagoonOld` constant defined *and sitting unused* —
   the old ruins (`tower`/`column`/`archruin`/`slab`/`dome`) still carried hard-coded `biomes:[0]` / `[0,1]`, so they spawned
   ON TOP of the new roster. Doubled vocabulary = half the crowding.

## The reusable law

**A biome overhaul is not done when the props exist — it is done when the biome's composition rhythm is WIRED and the legacy
kit is MIGRATED OUT. Both are separate, easily-forgotten steps, and their absence is invisible in a per-prop studio/close-up
(each prop looks fine) — it only shows in the real gameplay wide shot.** Checklist for the next biome overhaul:

- **Wire `<biome>Comp(dist)` + a `bi === N` branch in `writeMatrix`**, mirroring the Caldera block (arrival-park beat + the
  raised-cosine density/scale term). Without it, every authored `comp`/`arrivalPark` field is dead config.
- **Route every legacy archetype through `<biome>Old`** (`biomes: <biome>Old` for biome-exclusive ruins; `biomes: [...<biome>Old, k]`
  to keep membership in another biome `k` while dropping the migrated one). The `<biome>Old` constant already exists per biome.
- **Verify in the WIDE gameplay follow-cam, never the studio.** The hoarder read is a composition property; a fit-to-bbox
  studio and even the close-up tool both showed "fine" props while the scene was a junkyard.

## Tuning notes (what took Lagoon from 2.0 toward the paradise read, Fix 1 only — no art yet)

- **Sharpen the breath.** `lagoonComp` squares the raised cosine (`raised*raised`) over **3 periods/1500m (500m)** so the
  congregation weight collapses fast off the peak → genuinely EMPTY golden-water breaths between distinct island-groups,
  wider than Caldera's. Fewer, larger periods = more separation.
- **Drop the commons `comp.floor` hard** (0.55 → 0.12): floor is the density that survives a breath. High floors keep the
  whole biome half-full even in the "open" stretches (the picket that survives). Low floors clear the water.
- **Make the backdrop massif an EVENT, not wallpaper.** `arcade` → `floor:0` (fully parks in breaths) + a new `oneSide` flag:
  a per-congregation-peak `heroHash` picks ONE side, so a long drowned colonnade never walls BOTH horizons at once (Fable's
  single biggest crowding complaint).
- **Grow the hero at the peak** (rotunda `sMax` 1.10 → 1.16): the congregation scale term is the cheapest focal-hierarchy knob.
- **All of this is PURE (no `rnd`), applied AFTER the `rotY` init in `writeMatrix`** → gold-determinism call-order is untouched
  (5/5), other biomes byte-identical, envcount budgets green. Density/composition is a render-only park+scale; it never
  touches the fixture.

## What it unlocks / still open

Composition Fix 1 landed (re-gating with Fable). The remaining Lost Lagoon work is the two art axes Fable flagged, unchanged
by the spawner fix: **VALUE STRUCTURE** (warm sun-facing facets / darker cores / real waterline stain; recolor wrackstone off
near-black so it stops reading as floating garbage; split the three shared greens) and **SILHOUETTE surgery** (rootbastion's
roots must taper/branch/wrap and its canopy become a broken blob-cluster so it stops being the rotunda's twin at distance;
arcade needs arched/varied openings + collapsed bays so it stops reading as a concrete pier; fix lilyraft pads clipping
through mound slopes). The composition-engine + legacy-migration checklist above is now mandatory for the remaining biome
overhauls (Mire, Aurora, Astral, etc.) — check the `bi === N` branch exists before authoring a single `comp` field.
