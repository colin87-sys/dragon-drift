# GODHEAD DETONATION — the "background goes black at shield-raise" bug: adaptive-tier hitch cascade

**What happened.** Owner: the S3 background sometimes disappears to black, around when the boss shield
comes on. Root cause (Fable-diagnosed, confirmed by a headless repro): **the adaptive quality system
over-reacting to a single frame hitch.** The chain: the shield raise fires a flash + camera shake + a
bullet flood AND compiles the shield mesh's shader for the first time (`bossKit`/`bossUnmasked`) — one
~200ms frame. `main.js updateQuality` had (a) an EMA whose blend weight GREW with the hitch
(`Math.min(dt*2, 1)` → weight 0.4 on a 0.2s frame, 60→38 in one step), and (b) NO degrade dwell (drop
fired the same frame). So one hitch cascaded tier 0→1→2 in two frames — and **tier 2 hid the ENTIRE
detonation set + sky clouds + the whole composer** (bloom/god-rays), so the authored-dark S3 vault lost
its only light source and read BLACK. A latent second bug: `restoreAt[1] = 63` is unreachable at 60Hz
vsync (fpsAvg asymptotes ≤ ~60), so after ANY dip the game was stuck at tier 1 forever.

**The fix (three parts).**
1. **Hitch rejection + EMA clamp + degrade hysteresis** (`main.js updateQuality`): drop frames with
   `dt > 0.25s` entirely (a hitch is not a framerate); clamp the EMA weight to `min(dt*2, 0.2)`; require
   `fpsAvg < degradeAt` to HOLD ~0.9s before dropping a tier (symmetric to the 3s restore dwell). A
   shield flash no longer collapses quality.
2. **Tier-2 GRACEFUL DEGRADE** (`arenaSet.js setArenaSetQuality`): the old `tierHidden` hid the whole
   set → hard black. Replaced with a `drawRange` subset — the detonation buffer is ordered
   core→corona→streaks→rings, so tier 2 draws only `[0, coreCoronaVerts)` (a lit blast heart) + `uOct 1`
   + 256 embers + debris off. **The background can now never hard-black on any tier.** Proven headless:
   `__dd.setQuality(2)` → set stays visible, frame-centre luma 0.29 (not black).
3. **`restoreAt[1]` 63→58** so tier 0 is recoverable on 60Hz displays (fixes the stuck-at-tier-1 bug).

**The lesson — an adaptive quality controller MUST reject hitches and dwell before degrading, and a
"low tier" must degrade GRACEFULLY, never delete the scene.** A single hitch (first-time shader compile,
GC, a heavy one-off event like a shield raise) is not a sustained framerate; without hysteresis + an
EMA-weight clamp it nukes quality for seconds. And any tier that HIDES the primary visual (vs. subsetting
it) turns a transient perf dip into a "the game broke" black screen — the deferred P6 was load-bearing.

**Also:** a `setQuality(tier)` `__dd` debug seam was added so the tier-2 look is headless-testable; the
`debugArenaSet().tier` field now reports the level (tierHidden = tier≥2, but it no longer hides).

**Deferred (still open):** F4 warm the shield materials at fight start (delete the first-raise compile
hitch at its source — belt-and-braces on top of the hysteresis); F5 a `webglcontextlost` breadcrumb.

**Verify.** `unmaskedarena` 57 green (new tier-2-graceful-degrade assert: set visible + centre lit at
forced tier 2; the tier-0 heaven asserts unchanged). No console errors. Real-GPU owner check: the perf
HUD prints the tier — a shield raise should no longer drop it, and even a forced tier 2 keeps a lit core.
