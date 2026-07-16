# Perf — a GLOBAL adaptive-resolution governor: spend pixels before features, everywhere

**Why.** The graphics overhaul kept landing quality, and the owner's fps started sagging
across whole SECTIONS — "fifties, forties, thirties depending on the section," worst on
mobile. The diagnosis was already settled and on-device-proven (see
`2026-07-13-perf-fill-vs-cpu-ondevice-ab.md` + `…-arena-dynamic-resolution-…`): the frame
is **GPU FILL-bound**, not draw/CPU-bound, and **resolution is the confirmed lever** (`?pr=1`
hit 60 with every effect intact). But that lever was wired into the **boss arena ONLY**. In
normal cruise the perf controller had exactly one response to a heavy section: **drop a whole
quality TIER**, which turns *features* off (composer, clouds, atmosphere, the detonation) —
i.e. it paid for fps with the exact look the owner had just invested in.

**What we did — insert a finer step BELOW the tier ladder, globally.** A new
`js/resGovernor.js` (pure, unit-testable, promoted out of `main.js` like `perfStats.js`)
drives a `resScale` multiplier on each tier's base pixelRatio. Under sustained median-slow it
**trims pixel-scale down a small ladder** (`[1.0, .93, .86, .79, .72]`, fill ≈ scale²) to hold
the frame budget, and only once resolution is **fully spent (at the floor)** does it hand off
to the existing tier controller, which drops a tier as the **backstop**. So a device that used
to shed features to recover now shaves a near-invisible sliver of sharpness and **keeps the
full look at 60**.

**The design rules that make two controllers coexist without fighting:**
- **Priority = features > pixels.** Degrade order: trim resolution first, cut features last.
  Restore order (reverse): restore features first (tier↑), give pixels back last. Implemented
  as two gates: the governor **OWNS the frame** (tier logic skipped) while it still has
  resolution to give; pixel-restore is gated on `tier === 0` so features come back first.
- **Share the tier's VRR-safe `degradeAt` line (55), respond faster.** The governor reuses the
  tier controller's own "genuinely slow" median-fps threshold — so a ProMotion panel reading
  ~57–60 with real headroom never trips it — but acts on a **0.7s** dwell with a **cheap,
  reversible** action, so it always fires before a 2.5s feature-cutting tier flip.
- **Step discretely, realloc rarely.** Every resolution change reallocs the composer/bloom/
  god-ray RTs; doing that per-frame is the self-exciting stall the tier controller already
  learned to avoid. Ladder + hysteresis (55 degrade / 59 restore, a 4fps deadband) + dwell keep
  reallocs rare. `setResScale` reallocs **once** and sets `skipQualityFrames` so the realloc
  frames never feed the tier signal — the exact `setArenaPerf` idiom.
- **Reset on every tier flip** (`resGovReset` in `applyQuality`): each tier is re-evaluated at
  full res and the governor re-trims within it → no double-dip with the tier's own pixelRatio drop.

**Identity when off (the coexistence law).** Default OFF. `effectivePR` multiplies by
`dynResEnabled ? resScale : 1`, so with the flag off it returns the shipped value **byte for
byte**. Enabled via an **ADAPTIVE RESOLUTION** Settings toggle (default off) or `?dynres`;
`?dynresmin=<n>` tunes the floor from device data. The perf HUD gained a `res 0.86` readout so
the owner can *see* the governor working.

**The headline lesson — when quality regresses fps, the first lever should cost PIXELS, not
FEATURES.** A tier/LOD ladder that only knows how to switch effects off is too coarse for a
fill-bound frame: the cheapest thing to spend is pixel density (bloom + grading dither already
mask it on soft stylized content), and the most expensive is the composition the owner signed
off on. Put a continuous-ish resolution dial **below** the feature ladder and let it absorb the
common case; reserve feature-cutting for the genuinely weak device that's slow even at the
resolution floor. And a fill lever generalizes: it scales *every* fill center at once (composer,
bloom, god-ray march, additive fire) with one dial — the arena already proved this; this just
makes it the whole game's first responder.

**Corollary — don't scope a proven lever narrower than the problem.** Dynamic resolution was
built for the arena because that's where the fps complaint first landed; the *mechanism* was
never arena-specific. The generalization was mostly a `resScale` factor in `effectivePR` +
letting the same median signal drive it — reuse, not new architecture.

**Verify.** `tests/resgovernor.mjs` (23/23) unit-tests the pure escalation: ladder shape,
dwell (one slow frame doesn't step), ratchet to the floor then release to the tier controller,
the 55/59 deadband, restore-only-at-tier0-with-headroom, the `canRestore` (no mid-boss/mid-carve)
gate, and the identity-off source guards. `graphicssettings`/`perfhud`/`composer` (36)/
`passbudget` (19)/`graphicsfoundation` (23)/`smoke` green; a headless `?dynres=1` boot **+ live
flight** ran with zero console errors (the ON path reallocs cleanly). The 60 is the owner's
on-device call on the PR preview — flip **ADAPTIVE RESOLUTION** on and watch the HUD `res` line
trim in heavy sections while the fps holds; `?dynresmin=0.6` pushes harder if a section still
dips. (`save-purchases`'s `.shop-grid` timeout is a pre-existing Chromium-in-container flake —
identical on the stashed clean tree.)

**Reusable.** (1) For a fill-bound game, make **adaptive resolution the FIRST perf responder**
and feature-cutting the backstop — a `min`/`×` factor on pixelRatio, driven by the same
median-frame-time signal the tier controller already trusts. (2) Two controllers on one signal
coexist if you rank what they sacrifice and gate each on the other's state (governor owns the
frame while it has pixels to give; pixel-restore waits for `tier===0`). (3) Step resolution on a
ladder with hysteresis + dwell + a single guarded realloc (`skipQualityFrames`), never
continuously. (4) Keep it byte-identical off (`×1` when the flag is down) so it ships dark and
the owner promotes it from the preview.
