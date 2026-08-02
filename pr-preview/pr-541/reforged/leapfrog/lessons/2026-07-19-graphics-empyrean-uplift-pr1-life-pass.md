# EMPYREAN uplift PR-1 — THE LIFE PASS: the world answers the player

**What we did** (per `EMPYREAN-UPLIFT-PLAN.md`, the audited 4-PR plan): killed the independent critic's
worst axis (life/motion 4.0/10, "embalmed — nothing the biome owns moves") with five gated additions:

1. **Player-coupled WAKE** (`wakeMix` optional channel → `uWakeMix` in water.js): dark ripple rings
   radiate from the dragon on the nacre — `sin(r·1.9 − t·4.2)·exp(−r·0.10)`, darkening toward
   `deepColor` (value-DARK motion; a bright glint would be theology-illegal and ACES-invisible).
   Anchored on `uHeroPos`, which dragon.js already feeds every frame for the hero light-pool — zero new
   plumbing. The audit's #1 add: the one element that converts "drifting diorama" into "world that
   notices you."
2. **Mote star-drift**: sparse `_aHash` speckles that stream + twinkle INSIDE the disc, drawn `× _core`
   so they can never touch the sky. (`_aHash` comes from the auroraSky GLSL splice — usable anywhere in
   the sky shader's main.) The plan's "breathing halo" was cut at audit (brightness pulse = invisible
   or illegal); star-drift alone is the landmark's heartbeat.
3. **Second FAR/HIGH koi school** (`inkShoal2`): shares the koi geometry + material, other flank,
   smaller (×2.9), higher (y≈78), distinct period (0.041 vs 0.05) so the two traversals never sync.
4. **Ink-drop lumen-motes** (`inkMotes`, 54 point sprites): the shipped 1200-mote pool is pale and
   INVISIBLE on the bright field (the bright field eats particle life) — this layer is larger and
   ink-violet (`makeGlowTexture('70,58,99')` — dark-on-bright, the ink recipe), rises with per-mote bob,
   and PARTS around the dragon (radial push inside 7u of the chase point). Its own Points object — the
   shared pool is untouched, so byte-identity holds by construction.
5. **Rose-gold pickups** (`setGoldEmberTint(env.empyMix)` from environment.js's per-frame fan-out): the
   canary comet was the loudest warmth violation on the pearl field; lerps the shared material to
   rose-gold (hue ≥315°) in biome 5 only — lerp at 0 = exact shipped gold. Burst/spark colours switch on
   `_tint > 0.5`.

**The NUMERIC dark budget is now a tool, not a vibe.** `_empyburst.mjs` gained `darkBudget()`: reload
each captured PNG in-page (dataURL → 2D canvas — independent of `preserveDrawingBuffer`), sample every
2px for L<30, take the median dark pixel as the Mote centre (±70px box), and require non-Mote dark mass
≤40% of the Mote's. Measured max this PR: **0.055** — three new dark-mover systems coexist at ~1/7th of
the ceiling. Run it on every frame of every future gate.

**Gotchas.**
- **A capture run can CRASH the player.** The burst tool's fly-to-distance settle (1.6s at timeScale 1)
  let a respawned flow-gate kill the auto-flying player — the phone-late "frame" was the CRASHED! score
  screen, and the dark-budget metric read its dark UI as 10k stray dark pixels with no Mote. Sweep
  obstacles every 400ms DURING the settle, not just at the freeze. (Also: a median-of-sorted-axes
  centroid can land off-blob when the dark set is two disjoint masses — a crash screen, not a game
  frame, is what produced that degenerate case.)
- **Editing a call-site you haven't read splices garbage.** Appending `}); …` after the last property of
  `setWaterTint({...})` without reading the closer produced a stray no-op arrow expression. Read the
  region first; JS validity ≠ intended structure.
- **`uHeroPos` was already there.** Before adding plumbing for player position, grep the uniforms — the
  hero light-pool (Fable 75) pipes the dragon's world position into the water every frame regardless of
  pool strength.

**Verify.** appshell (GLSL + boot clean), gold-determinism ✓ (pickup POSITIONS untouched; only the
shared material colour lerps), biomecycle 14/0, skyprobe 5/0, bulletcontrast pass, dark-budget ≤0.055
on all 9 frames (desktop + portrait + live burst). Fable-model checkpoint gate on the burst frames per
the plan (floor 4.2) — verdict recorded in the PR.

**What it unlocks.** Motion-class vocabulary for the remaining PRs (traversal / bob / player-coupled),
the scripted dark budget for PR-4's mirror-smudge, and the burst rig as the standing gate harness.
Next: PR-2 RING COURT + STONES OF LIGHT.

**Gate record.** R1 3.8 REVISE — the retint missed TWO warm render paths (the goldEmber glow SPRITE is
the visible "treasure ball", and the ordinary amber embers are a separate system in embers.js); one gold
bloom sat INSIDE the Mote on portrait; the wake read as a vignette smudge; ink motes read pale. Fixes:
tint every path + far-glow fade (determinism-safe — positions untouched), pow³-sharpened discrete wake
rings, deeper ink ('44,34,64', size 1.6). **R2 4.4 PASS** — critic swept every frame for warm pixels:
none; wake = countable rings; Mote clean + dominant on both aspects. LESSON: a "colour change" is a
RENDER-PATH AUDIT — mesh, sprite, emissive, burst, and sibling systems each carry the hue independently.
