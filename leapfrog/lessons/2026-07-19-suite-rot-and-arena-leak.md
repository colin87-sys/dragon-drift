# The suite was dead at HEAD — 24 drifted tests + a real arena-skin leak (2026-07-19)

**What we did.** Landing D2 (the grading fold) required "run-all green." The first
end-to-end `tests/run-all.mjs` in a while revealed the suite had **not actually been
running**: `_diag-rock-caps.mjs` (a self-labelled "DIAGNOSTIC, not a CI gate") exits 1
vacuously because shipped config disables rock runs, and run-all aborts on the FIRST
non-zero — so it died at script #1 and every "green" claim since was hollow. Fixed
run-all to skip `_`-prefixed diagnostics, then swept all ~113 scripts and repaired
**24 failures**, none caused by D2.

**What we learned.**
- **A suite that aborts on first failure hides everything behind the first failure.**
  Sweep with a keep-going runner (log PASS/FAIL per script, don't stop) to see the whole
  failure set at once, THEN fix. One `_`-prefixed vacuous diagnostic had been masking 23
  other broken tests for who-knows-how-long.
- **SwiftShader contention manufactures fake failures.** Running probe browsers alongside
  the sweep caused ~8 timeout "failures" (exit 124, `waitForSelector` 30s) that all passed
  clean in isolation. Rule: **re-verify every failure solo, zero concurrency, before
  believing it.** A frame-starved headless tab reads identical to a hung one.
- **Two failure classes, two fixes.** (1) *Stale assertions* from shipped drift — the shop
  hero-select redesign (`.shop-grid`→`#hero-select`/`.hero-thumb`+`#hero-cta`), the roster
  prune removing `obsidian` (every `ascendedDef(DRAGONS.obsidian…)` proof → skip-guard with
  a re-arm note), `gfxToggle`→`swRow` UI rename, the §2 reward-card replacing `.start-notice`,
  a feat-pool cap bump. (2) *Headless-timing fragility* — mechanics that work but whose tests
  used fixed wall-clock waits against per-frame/rAF/game-time animation: **poll for the state,
  don't sleep for it.** stamina (track the drain trough over a hold, not a fixed magnitude —
  auto-fly reaches a ring-refill equilibrium), knellburn (poll for the 0.3s-game-time burn
  tick — a 1.4s wall window can be < one tick under slow GL), weftorgans (poll for the
  cutEase-driven flung seal to engage), recap (poll the score count-up + generous ledger
  timeout).
- **`dim-invariant` assertions beat exact ones.** `graphicssettings` checked
  `renderer.toneMappingExposure === 1.0` after picking a grade — but settings is a menu
  "dim screen," so the mood-dim multiplies exposure every frame. Assert the tonemap MODE
  constant (`=== THREE.CustomToneMapping`), which the dim never touches, not the exact value.

**The gotcha (the one real bug, not a stale test).** `unmaskedarena`'s schema tripwire was
correctly catching a **live arena-skin leak**: 26 graphics-stream env gates added by later
biome/storm/reflection work (`auroraMix`, `rainMix`, `stormSea`, `shoalMix`, `moteDepthFade`,
`propAerial`, `reflStretch/Glint/GreenPull`, `canopyRoof`, `horizonShaft`, `heroRim`,
`cloudForce`, `deckBias`, `windX/Z`, `breachMix`…) were never classified by `arenaSkin.js`,
so a boss-rush of THE UNMASKED from a storm/aurora biome leaked that biome's effects OVER
"the hollow behind the sky." **Do not silence a tripwire by editing its expectation to match
— that hides the bug it exists to catch.** The fix extends the author's own `empy/nacre/mote`
silence pattern to ALL biome-effect gates (`ARENA_SILENCED_KEYS`, zeroed as the arena floods)
and documents the god-ray params + now-moot effect colours as conscious pass-throughs
(`ARENA_PASSTHROUGH_KEYS`). The schema test now asserts every `computeEnv` key is *classified*
(lerped / silenced / passthrough) and the sets are disjoint — the tripwire still fires for a
genuinely new unclassified gate — plus a positive assertion that forces every gate on and
proves it's driven to 0 in the void.

**The reusable pattern.** When a new env/biome field lands, it must be **classified against
every consumer that snapshots the full env schema** (the arena skin is one; there may be
others). The schema-completeness test is the forcing function — keep it, make it assert
*classification* not *identity*, and never satisfy it by hiding a real gap.

**What it unlocks.** A genuinely green suite (the honest gate D2 needs), a run-all that
actually runs, and an arena that's provably biome-leak-free for the whole roster — not just
the Empyrean anchor it happened to be tested in.
