# graphics: Tempest Reach — the Stage-1 bible (Fable-directed) + PR-0 atmosphere substrate

**What we did.** Kicked off the AAA storm biome **Tempest Reach** (`BIOMES[7]`, STORMREND's
home) via the full Playbook Part 0.4 workflow, then shipped its **PR-0 atmosphere substrate**.

**The art-direction arc (Part 0.4, verbatim).** Fable (the `fable` model) was the active art
director: it set the vision seeds + scoped a 6-thread research brief; Opus agents gathered the
research (game-storm composition, supercell/green-sky color science, lightning morphology,
storm-ocean/eye structure, stolen-light golden-hour physics, storm-native prop-mass geology);
Fable synthesized `reforged/TEMPEST-REACH-BIBLE.md` — theology, color script (hexes), ten
composition laws, a 6-family storm-carved prop roster, material direction, the lightning hazard
+ obstacle-skin trio, a pre-run Part-B checklist, and a 6-PR build order. The bible is the
durable artifact every Tempest PR derives from.

**The generating theology:** *"The sun is not gone — it is ABOVE the storm; every light in this
world is the storm FAILING to contain it: the leak, the breach, and the blow."* Mass is dark,
wet, wind-torn; **nothing is self-luminous.** That one clause bans biolume-DNA (Mire),
aurora-DNA, and glowing-ice-DNA by construction.

**The distinctness solution (Part B, the ship-blocking bar).** Tempest had to clear FOUR
cool/dark neighbors. The decisive moves, all Fable overrides of the old design-sheet:
1. **Ban saturated storm-teal `0x2fd8e8` from the ambient palette** — the green here is a
   *desaturated grey-olive transmitted through cloud* (the real green-storm-sky science,
   ~`0x4d5346`), NOT Mire's emissive bottom-up teal. Teal survives only in momentary in-eye
   glints + STORMREND's kit, so the boss detonates on arrival by having its hue starved.
2. **Pale-silver far fog** (`fogFarColor 0xa7b2b0`) — the ONLY biome whose far field is
   *lighter* than its near; free depth + cycle-unique.
3. **Hidden 0–5° sun** — which made STORMREND's gold `0xffd870` the *physically correct* rim-gold
   (the 0–3° stolen-light research literally lands on that hex). Boss palette ⇄ nature converged.
4. **Waterspouts dropped entirely** — the storm-ocean research flagged them as Tidal Reef's
   reserved identity; distant weather-drama uses rain-curtains/virga instead.
Owner-requested addendum: verified vs the **live Lumen Mire** (there is no Mire "redo" in repo/
branches/PRs — the `BIOMES[4]` entry is unchanged since PR #388); recorded it as a named guarded
pair in the bible's Part-B row.

**PR-0 (this commit) — the atmosphere substrate + the new-biome scaffolding.**
- `BIOMES[7]` entry: full color script (storm-deck sky, green-grey belt, pale-silver value-hole
  horizon, gold-leaning N9 cloud over black undersides, `stars:0` DAY, `fogFarColor` pale,
  `atmos.heightK` low-pooling, `waveAmp 0.95` = the roughest sea in the game, driving-rain motes).
- **Material-index scaffolding so `?biome=7` boots** — the lesson: appending a biome is NOT just
  the `BIOMES[]` entry. Every **biome-indexed material array** needs an index-7 row or the debug
  pin crashes: `mats.body[7]` + `PHASE_SKINS[7]` (obstacles.js), `primary[7]` + `accent[7]`
  (environment.js makeMats). `level.js` is safe by construction (set-pieces route through `CYCLE`,
  which excludes 7, and hazard lookups use `?.`). Verified with a headless boot check:
  `biomeAt(50000) → {ia:7}`, dominant biome `TEMPEST REACH`, **zero console errors**.

**The bulletcontrast gotcha (reusable).** A storm biome's two signature palette moves each
break the readability gate in opposite directions, and the FIX is to respect the engine's own
**layered-read window**, not to reach for a `bullets` override:
- The **pale value-hole horizon** must stay **≤ L 0.75** (the layered-read ceiling, bulletcontrast
  line ~106) or bright *reflected* bullets (fixed amber/cyan role colors, no per-biome lever)
  vanish against it. Authored the horizon at L≈0.72; the god-ray/bloom lift renders it ≈0.87 —
  brilliant on screen, readable in authoring space. (Amber Wastes can't do this — it's the
  noon-blaze breather that must stay brightest, so it lives on a KNOWN_EXCEPTION instead; a storm
  slot has no such excuse.)
- The **near-fog** must stay **≥ L≈0.286** (`OUTLINE_L + 0.25`) or the magenta danger + dark
  bullet band fall out of the layered window against it; held the wet grey-slate fog at L≈0.31.
- Net: **zero new KNOWN_EXCEPTIONS** — all six role colors clear on the default band.

**Verification (PR-0 gate).** `biomecycle` 12/0 (updated the `BIOMES.length===7`→`8` assertion the
append invalidated + added a coexistence guard that 7 is appended-but-NOT-cycled), `bulletcontrast`
clean (0 new exceptions), `gold-determinism` byte-identical, `envcount --ci` all-green,
`atmosphere`/`aurora`/`defs`/`markers`/`wisps`/`embertideseal` green. (`perfhud` has one failure —
a pre-existing UI-toggle check that fails identically on the clean tree.) Headless WebGL run-capture
was unreliable in this env (the boot-then-`#btn-start` frame landed on the hub, not in-run) — the
in-run atmosphere read goes to the owner preview per the "no WebGL in CI" rule.

**What it unlocks.** The Tempest palette substrate is live and flyable at `?biome=7&debug` behind
the CYCLE coexistence seam (not yet cycled — the flip is a later no-op PR coordinated with the
Lost Lagoon arc). Next PRs off the bible: PR-1 materials + first rock props (the wind-scour value
ladder), PR-2 hero + massifs + composition, PR-3 obstacle skins, PR-4 the lightning hazard, PR-5
the eye-breach + cohesion + the awe bar.

**Reusable takeaways.**
- Appending a biome = the `BIOMES[]` entry PLUS an index-N row in every biome-indexed material
  array (`mats.body`, `PHASE_SKINS`, `primary`/`accent`); prove it with a headless `?biome=N` boot
  that asserts zero console errors, not just the data tests.
- Keep a bright "value-hole" horizon **authored ≤ L 0.75** and a near-fog **≥ L≈0.29** so both ends
  of the danmaku palette clear the layered outline/white-core read with zero new exceptions —
  bloom lifts the rendered value, so dark authoring reads bright on screen anyway.
- The Part 0.4 research→Fable-synthesizes loop produces a distinctness *argument*, not just a
  palette: every beauty beat named its biome-native source (eye = hurricane stadium + STORMREND's
  own iris mechanic), so "make it beautiful" never became "retint a reference."
