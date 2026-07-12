# 2026-07-12 — Sky Canyon: the spine as a need-for-speed moment (slipstream + arcade FX)

**Did / learned.** Turned the rib "speed tunnel" into an actual speed rush. Four
layers, all determinism-free (player kinematics, camera, audio, HUD, and non-fixtured
`out.orbs` — none are in the gold fixture):

- **E4 boosts** — the finale orbs PLUS a boost on every 2nd bulk rib (`runIdx%2`, no
  RNG), so the tunnel stays fast the whole way, not just the finale.
- **E5 slipstream** — inside the SPINE only (not rock: `game.canyonRun` from a typed
  `canyonStarts {dist,run}`), the world rushes ~12% faster (`canyonSpineSlip`, damped
  in/out at the seams). **The load-bearing trick: steering co-scales by the SAME
  factor.** Every fairness ratio in `canyonMath` is steering/velocity (`BUDGET =
  0.85·steering/V`), so scaling both leaves the whole `canyonflow` audit *exactly*
  valid with zero geometry change — the world genuinely moves faster while the inputs
  feel identical relative to it.
- **E7 arcade visuals** — FOV punches wide with the slip, CSS speed-lines ignite far
  earlier in the tunnel, a postfx radial chromatic streak rides the slip mix, and a
  world-space **`THREE.LineSegments` streak pool** (one draw call — LineSegments are
  overdraw-cliff-exempt) rushes light lines past the dragon. All driven by
  `player.canyonSlip`, so they're spine-only and fall to zero (mesh hidden, opacity 0)
  everywhere else.
- **E6 sound** — a slipstream wind loop + a low "boom" pressure layer + a rib-flutter
  tremolo whose LFO rate tracks `speed / rib-pitch` (the acoustic strobe of bones
  whipping past). Null-safe: no ctx / muted / headless → no-op; sits under the radio.

**→ Systematize.** The reusable law: **a canyon/biome speed buff is fairness-free iff
speed AND steering scale together** — because the whole reachability audit is a ratio,
not an absolute. Any future "go faster here" verb (updraft, current, boost pad) should
co-scale both and needs no new audit. Second: **drive every speed FX from ONE damped
scalar** (`player.canyonSlip`) rather than per-effect gates — the FX ignite/decay
together, spine-only falls out for free, and a first-frame NaN is the only trap (init
the scalar on the object literal, not just `reset()`, or a boot path that skips reset
feeds `damp(undefined,…)` → NaN → NaN dist → `BIOMES[NaN]`). Third: FX that can't be
verified headlessly (audio null in CI, feel judged on preview) must still boot green —
null-safe audio and `visible=false`/opacity-0 idle states make the CI gate meaningful
(zero console errors) even when the effect itself is invisible to it.

**→ Leapfrog.** The slip scalar + co-scale pattern is the substrate for the deferred
kinematic verbs (the whole §10 backlog): they can now ramp speed/forces through a
biome and stay provably fair by construction. And the `LineSegments` streak pool is a
cheap, reusable "motion" primitive for any future high-speed moment (boss chase,
finale burst) without touching the overdraw budget.
