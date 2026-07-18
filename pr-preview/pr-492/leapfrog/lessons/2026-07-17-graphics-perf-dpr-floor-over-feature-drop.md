# FPS on a heavy biome: the frame is DPR/fill-bound — deepen the dynres floor, don't drop features

**Context:** Owner on device (3× Retina iPhone) in the **Tempest** biome fighting a boss (VOIDMAW): avg
51fps, the quality controller had auto-dropped to **tier 1** (features degraded) + dynres 0.79, and it still
couldn't hold 60. Tempest-during-a-boss is the heaviest thing in the game (5-layer rain + violent-sea shader
+ cloud FBM + god-ray mask pass + boss bullets). The on-device perf HUD was the profiler (iOS Safari has no
`EXT_disjoint_timer_query`, so per-pass GPU timing is impossible — reason structurally + A/B with flags).

## The read: `gpu 46` vs `sim 2 / draw 2` → GPU-bound, and it's PIXELS

The HUD splits the worst frame into `sim` (JS/GC) / `draw` (render-submit CPU) / `gpu` (= frameMs − sim −
draw, the fill remainder). It was `sim 2, draw 2, gpu 46` — the 50ms hitch was **46ms of pure GPU**. CPU was
idle. So the lever is per-pixel fill, not draws/JS.

## The A/B probe set (flags already in the repo — this is how you profile iOS)

Read `avg` at the boss with each of: `?norays` (god-ray mask+march off), `?oldsea` (cheap water), `?nobloom`,
`?pr=1` (cap pixelRatio to 1 — pure fill test). Results (baseline avg 51, tier 1, res 0.79):

| probe | avg | tier | res | verdict |
|---|---|---|---|---|
| nobloom | 50 | 1 | 0.86 | bloom irrelevant |
| norays  | 53 | 1 | **1.00** | rays real, but the governor spent the saving on resolution |
| oldsea  | 55 | 1 | 0.79 | violent-sea shader ≈ +4 |
| **pr=1**| **58** | **0** | 0.86 | **DPR dominates — and it kept TIER 0 (all features)** |

`?pr=1` won on every axis AND held tier 0. That's the whole finding: **on a high-DPR phone the frame is
pixel-ratio-bound, and cutting DPR is so much cheaper than cutting features that tier-0-at-low-DPR beats
tier-1-at-high-DPR — better fps AND a better-looking frame.**

## Why the controller made the WRONG trade, and the one-line fix

Tier-0 pixelRatio cap is `min(dpr, 2)` = 2.0 on a 3× phone. The dynres governor's floor was 0.72, so the
deepest it could trim tier-0 was `2.0 × 0.72 = 1.44` effective — still too heavy → the tier controller gave
up on resolution and dropped a whole FEATURE tier. The governor's own philosophy ("spend pixels before
features") was right; its floor was just too shallow to execute it on a Retina panel.

**Fix: deepen the floor `RES_STEPS = buildResSteps(0.72,5) → buildResSteps(0.45,5)`.** Now the governor can
trim tier-0 to `2.0 × 0.45 = 0.9` effective — the `?pr=1` sweet spot — and HOLD tier 0. Confirmed on device
via `?dynresmin=0.45` (the flag that overrides the same floor, so the probe is byte-identical to the bake):
**tier 0, avg 57, p95 20ms (50fps)**, every feature on, vs baseline tier 1 / avg 51 / p95 27ms (37fps).

## Reusable
- **iOS has no GPU timer queries — the repo's `?flag` kill-switches ARE your profiler.** One `avg` read per
  flag at the worst scene isolates the hog on the real device. Don't guess from headless (SwiftShader) or
  from a desktop GPU.
- **`gpu = frameMs − sim − draw` on the HUD tells you fill-bound vs CPU-bound in one glance.** High gpu +
  low sim/draw = spend pixels (dynres/DPR), not draws.
- **Prefer trimming DPR/resolution over dropping a feature tier.** On a stylized phone frame the bloom +
  grading dither hide a large pixel-density loss; a dropped feature tier is far more visible. Deepening the
  adaptive floor is near-invisible when idle (the governor only trims under sustained load) and keeps the
  signed-off look intact under load.
- **The floor is device-relative:** `floor × tierCap` must reach the device's effective-DPR sweet spot
  (~0.9 here). A shallower floor silently converts into a feature-tier drop on high-DPR panels.
