# 2026-07-14 — graphics: envcount.mjs, the env-geometry/overdraw guard (WALL-PROPS A0)

**Why.** First increment of the wall-props redesign (`reforged/WALL-PROPS-REDESIGN.md` §6 A0):
the plan mandates building `tools/envcount.mjs` BEFORE any prop PR, so every later biome rebuild
(Frozen first) has a headless guard for the one budget axis that matters — overdraw — plus tri/instance
caps and the indexed/non-indexed boot-crash catch. Tool-first is the right call: it baselines the shipped
numbers and turns "don't blow the budget" into a red/green check the human doesn't have to eyeball.

**What shipped.** `tools/envcount.mjs` (mirrors `tricount.mjs`'s harness: `three-resolver.mjs` register +
the DOM/canvas shim) + one behavior-inert export `propDiag()` in `environment.js`. Runs `--ci` (exit 1 on
overage). Asserts, per WALL-PROPS §8.2: tris/archetype ≤150, instances/archetype ≤170 (=2×ceil(900/step)),
per-biome ≤550 inst / ≤50k band-tris, worst adjacent-CYCLE pair ≤90k, **side-prop transparent/additive
surfaces = exactly 0** (the number that matters), FOAM_CFG completeness, and a fixture-built Phase Gate
census (exactly 1 blended veil layer, ≤9 additive planes, ≤600 lattice segments, the 0.30 alpha clamp
present in source).

**The load-bearing gotcha — `ARCHETYPES` + `propMats` are module-private, and `createEnvironment` is too
heavy to run headless.** `build()` closes over the module-global `propMats`, which ONLY `createEnvironment`
sets — and that function also builds the sky ShaderMaterial, arena, ambient and IBL probe (the plan's own
note: `stress.html` deliberately avoids importing `environment.js`). So neither "export ARCHETYPES + call
build()" (propMats null → throws) nor "call createEnvironment(stubScene)" (heavy dep surface) is clean.
The fix: a NARROW behavior-inert diagnostic export, `propDiag()`, that lazily inits the same `propMats`
via `makeMats()` (no canvas/renderer needed — just `MeshStandardMaterial` + `onBeforeCompile` patching) and
returns per-archetype `{name, biomes, step, instances, tris, materials:[{transparent,depthWriteFalse,
additive}], hasFoam}`. **This IS the boot-crash catch** — the loop calls every `def.build()`, so an
indexed/non-indexed `mergeGeometries` mix or a `mat>=2` throw surfaces headless instead of only in the
browser (where it kills EVERY biome's boot). Reusable rule: when a tool needs module-private geometry and
the public entry point is heavyweight, add a small **inert diagnostic export** rather than exporting the
internals or booting the heavy path — it's the least fragile and changes zero runtime behavior (proven:
gold-determinism byte-identical with the export in place).

**The baseline surprised us — 4 legacy archetypes already exceed the 150-tri target** (`tower` 167,
`archruin` 180, `glowcap` 158, `glowcapSmall` 224 — all segment-heavy sphere/torus builds, and all
scheduled for A8 deletion). Raising the cap to fit them would defeat it (new kits target 40–130). Fix: a
`GRANDFATHER` map pinning each legacy over-cap prop at its measured value — it passes but can never GROW,
while every new/active archetype is held to the real 150. Entries are deleted alongside their archetype in
A8; **no new entries allowed** (a new prop over 150 is a bug). Reusable: when a fresh budget guard fails on
pre-existing debt scheduled for removal, grandfather-at-measured-value beats loosening the global cap.

**Verification.** `envcount --ci` green (exit 0); `gold-determinism` byte-identical (proves the export is
inert); `tricount --ci` 0 over; `biomecycle` 11/11; `bulletcontrast` pass (A0 touches no palette). `run-all`
halts on `badges.mjs`, a Playwright `.shop-grid` timeout that **reproduces identically with my changes
stashed** — a pre-existing browser-test flake in this container, not an A0 regression (confirmed via
`git stash` + re-run). Baseline numbers now captured in-tool: worst adjacent live pair today is
Mire+Aurora ≈ 79.8k band-tris (< 90k), and the shipped gate is 4 veil panels sharing 1 blended material +
9 additive planes + 0 lattice — the exact shape B1's veil enrichment must not exceed.

**Deviation from the plan (documented).** §6 tagged A0 "tool-only; zero game code." It required ONE
behavior-inert export in `environment.js` (never imported by the game) because of the propMats privacy
above. The guarantee that matters — byte-identical runtime — holds; "zero game code" is refined to "zero
runtime behavior change."

**What it unlocks.** A1 (Frozen Reach — the proving hero) and every subsequent prop PR now runs
`node tools/envcount.mjs --ci` as gate **E**; the gate census is the substrate for the B1 veil PR's
overdraw guard. Next: A1 — rebuild Frozen's single-cone `crystal`/`crystalSmall` into the
ribspire/vertebrae/penitentes/serac/glacierfront ossuary + the bone retint.
