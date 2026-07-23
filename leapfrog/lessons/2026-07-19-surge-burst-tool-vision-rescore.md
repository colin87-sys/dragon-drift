# Surge burst tool + the vision re-score: capture pollution nearly sent us fixing the wrong thing

**What we did.** Built `tools/surgeburst.mjs` (8-beat lifecycle montage on a clean field:
armed → the five cascade stations → two sustain holds, cascade clock pinned per beat, labelled
contact sheet + per-beat greyscale metrics), had an independent critic score the shipped ambient
Surge against the §C vision /10, fixed what was real, and re-scored with a second fresh critic.

## The lessons

1. **Clear EVERYTHING that isn't the subject before a critic sees a frame.** The first critic
   confidently identified a "static gold dot chain" (cheap-tell LED strip) and an "identical cyan
   collar on both dragons" as dragon defects. They were the **ember pickup line** and the
   **stamina-arc HUD element**. Three of six ranked deviations were capture pollution. A
   clean-field capture must despawn obstacles + hazards + rings + **collectibles** (new
   `__dd.clearCollectibles` seam) and hide the HUD DOM. Corollary: when a critic names a defect
   you don't recognize, open the full-res frame and identify the actual object before fixing.

2. **The "switches on instead of travelling" audit: grep for `feverActive ?` in the visuals.**
   Every fever visual keyed directly on the flag ignites on frame 1 and flattens the cascade.
   The fix pattern that keeps off-Surge byte-identity: map each channel to its ANATOMICAL
   station — hero light/water pool × `casOverall`, speed-trail/contrail fever-ness waits for
   the wing station (`casOverall > 0.45`), tail exhaust waits for the tail crack
   (`casLevel[3] > 0.5`). Bonus: station-gated channels also pin correctly in captures (the
   cascade pin sets `surgeCascadeT`), while wall-clock-damped fever channels saturate during
   headless waits and fake "front-loaded" evidence.

3. **Pose is the cross-roster lever for station visibility.** There is no generic "wing bone
   material" across yoke/wingParts/lobe/direct-pivot dragons, so the wing station's
   depth-projection problem is fixed with the BEAT CLOCK: steer `flapPhase` to the spread
   high-V during the wing→tail window (bell weight, same shortest-path steer as the I4 apex
   pin). Works for every dragon that reads `flapPhase` — all of them.

4. **Fresh critics with clean evidence give different (better) diagnostics than the same critic
   with dirty evidence.** Re-score after the pass: WORLD 8/8, DRAGON 6/6.5, overall 6.5/10 —
   the suppression half of the vision is confirmed shipped ("the magenta wash is dead"), the
   sustain measurably breathes (±12% after deepening), and the remaining deviations are now
   *per-dragon anatomical* and machine-checkable (Vesper wing region p95 must step ≥2× at its
   beat; Solar needs armed-dim on its always-on gold fixtures so a first-tell exists; Vesper
   needs a discrete tail-tip flash; the crown light must beat the shoulder glow so travel
   direction reads; and the spared horizon band still out-masses the dragon's brights —
   the one real WORLD residual).

## The reusable pattern

For any "is X following the vision" question: burst tool on a clean field → independent critic
with explicit rubric + capture caveats → fix only what survives object-identification → fresh
second critic on regenerated evidence. Never resume the first critic for the re-score — its
priors include the polluted frames.

## What it unlocks

The five re-score deviations are the ready-made worklist for the I5 per-dragon accent pass —
each is per-dragon, station-local, and comes with a numeric acceptance test.
