# 2026-07-14 — "The aurora has no lights then pops in" was the PERF GOVERNOR, not the aurora

**Why.** Owner on mobile (`?flowrun&biome=6`, so `auroraMix=1` the whole run — no biome seam): "sometimes
there's no lights and then that suddenly pops in." Two screenshots: a dim near-empty sky during a
SPEED-SURGE flow carve, and a full curtain during a calmer stretch. A Fable diagnosis pass (with captures)
found the culprit nobody was looking at: **the runtime adaptive-quality governor.**

**The chain (all three had to line up):**
1. **`setAuroraQuality` hard-CUT the curtain on every tier flip.** My own Gate-9 code set `qualFade = 0` on
   a tier change — intended as "dip through a breath," but `= 0` is a ONE-FRAME cut; only the *recovery* was
   damped. So each flip = curtain to black in a frame, then a ~1s fade-in = literally "no lights, then it
   pops in." **A one-line "dip" that assigns the floor instead of damping toward it is a cut, not a dip.**
2. **Tier2's curtain is structurally "off":** `uAurBands=1, uAurRay=0` (single smooth arc) AND `postfx`
   bloom is disabled at tier≥2. The curtain's glow is designed to live in the bloom (split-gain: "the glow
   lives only in the concentrated cores"), so tier2 loses structure *and* glow → a faint horizon arc under a
   dark sky = "no lights" while parked there.
3. **The governor flips tiers exactly during a flow run.** The flow carve (orb ribbons + speed streaks +
   surge post-FX) is the game's peak load, so `updateQuality` degrades mid-carve and restores when it calms
   — precisely the owner's two screenshots.

**Reusable law: when a visual "randomly" appears/vanishes, suspect the adaptive-quality GOVERNOR before the
effect's own logic.** We'd already learned this on the boss detonation ("background randomly changes" =
mid-fight tier restores); the aurora was the same bug with a different symptom. A forced-repro
(`?flowrun&biome=6` + a scripted tier flip) is what made it visible — the montage tools freeze at one tier
and never flip, so they can't see it (same blind-spot family as the surge-freeze lesson).

**The fix (three parts, all render-only / governor-timing — world gen byte-identical):**
- **Kill the hard cut — a fade LATCH.** On a visible flip, latch `qualTarget = 0` + defer the tier
  restructure; in `applyAurora`, `qualFade = damp(qualFade, qualTarget, 6, dt)`, and once `qualFade < 0.05`
  apply the deferred `uAurBands/uAurRay/uAurLayers/uAurGain` and set `qualTarget = 1`. The curtain breathes
  DOWN (~0.4s) → restructures while invisible → breathes UP. `damp(1,1)=1` keeps it byte-identical when no
  flip occurs. **Defer the structural change to the invisible trough — never restructure a visible effect.**
- **Make tier2 read as lights — a `uAurGain` uniform** (`tier≥2 → 1.35`, else 1.0) folded into the curtain
  `col +=` and the airglow, compensating for the disabled bloom. Verified on `tools/aurotier.mjs`: tier2
  now shows a bright green curtain, not a dim arc. (1.0 elsewhere → byte-identical.)
- **Don't pop the restore mid-carve** — extend the existing `!bossEncounter` no-restore guard in
  `updateQuality` with `!(player.tunnelFxMix > 0.3)` (the flow-carve envelope). Degrades stay instant (the
  60fps floor holds); the restore's breath lands in the calm exit air, reading as the sky answering the run.

**Verify.** `aurora.mjs` 109 (the tier truth table gains `uAurGain`; a functional no-hard-cut check — one
frame after a visible flip keeps >0.4 of the curtain, not 0; the fade-latch + tier2-gain + restore-guard
source asserts). `gold-determinism`/`biomecycle`/`auroraflow`/`surfaceshader` green; the shader compiles
with `uAurGain` at every tier.

**Leapfrog.** Fresh branch off master. The aurora no longer blinks out during flow runs on mobile — tier
flips breathe, tier2 stays lit, restores wait for calm air. The `damp` λ (6) and tier2 gain (1.35) are dials.
