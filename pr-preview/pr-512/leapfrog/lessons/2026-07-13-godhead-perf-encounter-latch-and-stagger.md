# GODHEAD perf IV — stop the tier bounce (encounter latch + capable floor) and un-stack the aux passes

**What we did.** After perf II/III the owner's 17 Pro Max no longer trapped at tier 2, but a full-run
recording showed the tier still **oscillating 0→1→2→1→2**, and THAT is the "background randomly changes"
(tier 2 draws the detonation cut to core+corona; each flip repaints). A no-recording control run
confirmed the ~50fps is **real throughput** (heaven holds ~48-52 at tier 1, max 111 = 120Hz-capable),
not a recording artifact. A Fable pass (headless `renderer.info`) found the real shape and corrected two
earlier guesses.

**The two corrected facts:**
1. **The frame cost ALTERNATES ~2× every other frame** — the water mirror AND the god-ray occlusion mask
   are each a full extra scene render, and both were landing on the **same** parity, so every other frame
   carried both (~550 calls) and the alternate carried neither (~290). The HUD samples one arbitrary
   frame per 0.5s → the erratic readouts. **The median/p95 live on the heavy frames.**
2. **The shield does NOT double the draw calls** (I had inferred that from two screenshots — wrong).
   Measured, the shield is 2 draws; the owner's 306→606 pair was just a light-parity frame vs a
   both-passes frame. Lesson restated: **measure the thing; don't infer a cause from two HUD samples.**
   And the `min 20fps @…` annotation was a HUD artifact — it freezes on the run's FIRST ≥50ms frame
   (fed the 0.05-clamped dt, so it floors at 20 and `worstCalls` only updates on strict `<`).

**PR 1 fixes (this lesson) — stop the bounce + flatten the tail, no art change:**
- **Encounter latch (`main.js`):** `bossEncounter` true from `bossStart`→`bossEnd`/`bossDefeated`;
  while set, **forbid tier RESTORES**. A restore mid-fight is what flips the tier and repaints the fire.
  Worst case per fight is now ONE downward change, then stable — the background stops changing.
- **Capable floor:** `maxTier = capFps>70 ? 1 : 2`. A device that has proven >70fps never falls to the
  **palette-breaking** tier 2 (composer off, clouds off, detonation → core+corona). It oscillates at most
  0↔1 (near-identical: pixelRatio 2↔1.5, uOct 3↔2), never the jarring tier-2 cut. Tier 2 stays for
  genuinely weak devices; the `setQuality` debug seam keeps the tier-2 graceful-degrade test valid.
- **restoreAt `[∞,58,50]→[∞,58,57]`:** the 2→1 restore must predict tier 1 is *sustainable* (near-60
  median at tier 2) — the old 50 restored into a tier 1 that couldn't hold it → the 1↔2 bounce. Also
  moved the anti-ping-pong "forgiveness" off a 30s timer (which re-armed the hunt) onto `runStart`.
- **Un-stack the aux passes:** the god-ray mask now renders on **ODD** parity, the water mirror on
  **EVEN** — so the two full-scene passes never coincide (the ~2× worst frame flattens to ~1× + ~1×).
- **Tier-0 mirror diet everywhere (`water.js`):** the mirror was full-rate off-heaven at tier 0 — a whole
  second scene render every frame for a reflection the wave-distortion hides at 30Hz. Now half-rate at
  tier 0 everywhere (quarter-rate tier 1 in the heaven), so **normal play** (which the owner showed is
  also ~50fps) gets the cut too.

**The headline lesson — a quality controller that CHANGES THE LOOK must not be free to flip during the
moment the player is watching.** Tier flips are both a hitch and a repaint; the fix for "the background
changes" isn't (only) to stop the oscillation numerically, it's to **latch the tier for the encounter**
so any change happens at most once and outside the tense window, and to **cap capable devices above the
palette-breaking tier** so the one change that does happen is invisible. Throughput work (PR 2) then
lifts the floor so even that one change stops happening.

**Corollary — stagger, don't just duty-cycle, full-scene aux passes.** Halving each of two scene-doubling
passes saves nothing on the WORST frame if both still land together; the worst frame is what the median
and the player feel. Put them on opposite parities and the peak halves.

**Verify.** `unmaskedarena` 57/57 (tier-2 graceful degrade intact via the debug seam), `passbudget` 19/0
(mirror rate changed, truth table didn't), `smoke` + `bossboot` clean. Deterministic + NaN-safe (control
flow / render scheduling only). The real proof is the owner's on-device HUD: expect a STABLE tier (1 on
this device) with a STABLE background, and a lower worst-frame call count. **PR 2 is the throughput win**
(merge the seraph's ~104 wing-feather draws → ~24, behind an edit-mode flag so the design stays tweakable)
— that's what lifts tier 1 toward a locked 60.

**Reusable.** (1) Latch adaptive quality for a set-piece so it can't repaint mid-moment; defer changes to
the seams. (2) Floor capable devices above any tier that changes the ART, not just the resolution. (3)
Two scene-doubling passes must run on OPPOSITE parities or the duty-cycle doesn't touch the worst frame.
(4) A perf HUD's frozen min/`worstCalls` (clamped dt + strict `<`) misleads a diagnosis — feed it the
true delta and track the latest worst.
