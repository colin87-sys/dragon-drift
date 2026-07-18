# GODHEAD perf II — the tier signal was the bug (EMA→median), and warm-compile the fight shaders

**What we did.** The prior perf round (mirror diet + a "120Hz-aware" tier controller) REGRESSED: the
owner's 17 Pro Max got **trapped at tier 2** (worst quality) yet still stuttered — `avg 52, min 20fps,
max 143fps, TIER 2`. A second Fable pass found the earlier model was half-wrong, and the real fix is a
**signal swap + a warm-compile**, not a threshold tweak.

**The reframing facts (both verified in the r160 bundle):**
1. **The tier DECISION signal was a hitch integrator.** `updateQuality` averaged `1/clamp(dt,0.05)` —
   every ≥50ms stall injects a `20fps` sample, and a cluster drags the EMA into the 40s. So transient
   **compile/GC/flip** stalls (which dropping quality cannot fix) cascaded the tier 0→1→2.
2. **iOS ProMotion is VARIABLE-refresh.** It steps the panel 120→80→60Hz on 10–16ms frames, so measured
   fps reads ~57–60 *regardless of GPU headroom*. My "high-refresh" restore bump to 72/60 was therefore
   **unreachable exactly when a tier had been degraded** → the tier-2 trap. The bump "fixed" the earlier
   0↔1 oscillation only by making restore impossible.
3. **The flip cascade is self-exciting.** Each `applyQuality` reallocated the full-screen MSAA RT +
   bloom mips + god-ray RTs **twice** (`setPostTier` and `setPostPixelRatio` each called `applySize`),
   rebuilt the water Reflector, and — on the 1→2 flip — recompiled a new tone-mapping program variant
   for every material (three keys programs on the bound render target; tier 2 renders to the null
   target). Each flip's own stall fed the signal, which confirmed the degrade, which flipped again.

**The fixes (all in `main.js`/`postfx.js`, no art change):**
- **Signal swap → windowed median of TRUE frame time.** The tier decision now reads `medFps` = p50 of
  the last 120 unclamped deltas (re-sorted a few ×/s into a preallocated scratch, zero alloc). A 1–2
  frame stall can't move a median → only GENUINE sustained slowness degrades. `fpsAvg` stays, HUD-only.
- **Capability latch.** `capFps` = a decaying peak (~18s memory, NaN-clamped, deterministic). `capable =
  capFps > 70` means "proven 60-capable ⇒ hitch-bound, not throughput-bound". A capable device uses a
  **2.5s** degrade dwell (vs 0.9s) so a stall cluster can't uglify it; a weak device (never sees a fast
  frame) keeps the fast response. **`restoreAt` reverted to `[∞,58,50]`** — a median of ~59–60 clears it
  even on a VRR-throttled panel, so the trap un-latches and it climbs back to tier 0.
- **Flip guard.** `applyQuality` sets `skipQualityFrames = 2`; the signal skips those frames so the flip
  never eats its own realloc/recompile stall (breaks the self-exciting loop).
- **De-dupe the double resize.** `setPostPixelRatio` no longer calls `applySize`; `applyQuality` sets the
  ratio first, then `setPostTier`'s single `applySize` reallocs the RT ONCE.
- **WARM-COMPILE the fight shaders (the deferred F4).** On `bossStart` — under the entrance cinematic
  where a one-frame stall is invisible — `renderer.setRenderTarget(composer.renderTarget1);
  renderer.compile(scene, camera); renderer.setRenderTarget(null)`. `renderer.compile` traverses HIDDEN
  materials, so the shield rim/cage/shards, surge beam/aura/bands/tether, and the arena detonation set
  all compile NOW instead of at their first mid-combat show (the ~200ms shield-raise / surge-fire
  hitches — exactly where the owner's screenshots were taken). Compiling against the LIVE composer RT
  matches the program variant three will actually use (else it recompiles anyway).

**The headline lesson — a quality controller must decide on a SUSTAINED-RATE statistic, never an EMA of
instantaneous fps.** An EMA integrates hitches, so it degrades on stalls that quality can't fix, then a
VRR panel's demand-shaped fps makes the restore threshold unreachable and it gets stuck at the bottom.
A **median (or p95) of true frame time** separates "spiky" from "slow"; a **decaying peak** proves
headroom independent of load. Together: sit at full quality on a capable device, drop only on genuine
sustained overload, and never trap. Corollary: **the fix for a hitch is to remove the hitch (warm the
compile), not to lower quality** — quality tiers address throughput, not stalls.

**Verify.** `unmaskedarena` 57/57 (tier-2 graceful-degrade still proven via the `setQuality` debug seam,
which bypasses `updateQuality`), `passbudget` 19/0, `smoke` + `bossboot` clean (the `bossStart`
warm-compile runs error-free through a real boss fight). The controller behaviour is a device-fps
judgment — the owner's next on-device HUD should read **TIER 0, avg ~57–60, no 20fps floor**. Determinism
(no RNG/Date in the signal) + NaN law (all clamps) intact.

**Deferred (weak-device flip polish, lower value now that capable devices don't flip):** hitchless
mirror-resize (`water.getRenderTarget().setSize` instead of `rebuildWater`), tier-2 whole-scene
recompile softening (compileAsync before flipping the composer off), and a hot-loop micro-GC sweep
(`emit('distance')` object, `Object.keys(_kick)`, `gatherPulse` clones, `perfStats` sort).

**Reusable.** (1) Tier/LOD controllers: decide on **median/p95 frame time + a decaying peak**, not an
EMA of fps — the EMA is a hitch integrator and VRR makes fps demand-shaped. (2) A `capable` latch (peak
> target) should make the controller REFUSE to degrade on hitches (quality is the wrong lever). (3)
Compile-on-first-render is a mid-gameplay stall generator — `renderer.compile(scene,cam)` (traverses
hidden) against the LIVE render target, at encounter start under a cinematic, warms it away. (4) Exclude
a controller's own tier-flip frames from its input signal, or the cascade self-excites.
