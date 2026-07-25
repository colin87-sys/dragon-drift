# 2026-07-12 — the perf HUD: promote the dev overlay, and "instrument before you experiment"

**Did / learned.** The owner wants to watch framerate on-device while A/B-ing the experimental graphics toggles.
Most of it already existed behind `?debug=perf` (fps / calls / tris / tier / per-run min-fps + p95). N-work here
was **promotion, not invention**: a Settings toggle (PERFORMANCE HUD, default OFF), a **max-fps** + true
**run-average**, and — the highest-value add — a **live line of the active toggles + tone-map + tier**, so one
screenshot captures the framerate AND the exact config that produced it. Shipped as its own tight PR ahead of
N12, because the roadmap literally says "on-device perf HUD is the real gate" — the instrument must precede the
experiment it gauges, and bundling a gauge into the change it measures pollutes that change's visual-diff review.

**Extract the accounting into a pure module so the math is CI-testable.** The frame stats were inlined in the
render loop (untestable without WebGL). Pulling them into a dependency-free `js/perfStats.js`
(`makePerfStats/resetPerfStats/perfFrame/perfSummary`) made the whole min/max/avg/p95/ring-wrap suite a plain
`node` test (`tests/perfhud.mjs`, 14/14) — no shim, no browser. **→ Bank: any per-frame accounting that a HUD
displays should live in a pure module the loop merely feeds; the loop keeps the `renderer.info` reads, the module
keeps the arithmetic.** Two honesty guards worth copying: a **4ms floor** on the max (an rAF double-fire reports a
sub-ms frame → a fake 500fps; the floor caps the honest max at 250), and the min already rides the shipped
`rawDt` clamp (0.05 = a 20fps floor) so a stall can't poison it.

**A runtime toggle for an overlay must reverse EVERY global it flips — including `renderer.info.autoReset`.** The
overlay needs `renderer.info.autoReset = false` to accumulate draw counts across the composer's multiple passes.
The old code set that once at boot under the URL flag. A *runtime* toggle has to restore it: `setPerfHud(false)`
does `renderer.info.reset()` (flush) **then** `autoReset = true` (the three.js default) so no other reader —
`__dd.pfx.drawCalls()`, any perf probe — inherits a frozen, never-reset counter. Identity-off proof: default
`perfHud:false` + no `?debug=perf` → `perfEl` stays null → the whole per-frame block is skipped and `autoReset`
stays default, byte-identical with zero added cost. The toggle rides the existing generic `[data-gfx]` →
`onGraphicsChange` dispatch, so the only new UI is one `gfxToggle('perfHud')` group.

**Read each toggle's state from its RUNTIME authority, not `saveData`.** The active-effects line uses the module
getters (`skyCloudsEnabled()`, `waterFoamOn()`, `aoUniform.value>0`, `getWaterDepthOn()`, …), not
`saveData.settings` — so it stays correct even when a toggle was forced via a `?flag` URL param (which never
touches the save). One `getWaterDepthOn()` getter was the only gap; every other toggle already exposed one.

**Headless can't populate frame stats — and that's not a regression, it's the environment.** In headless Chromium
the page is `document.hidden === true`, so the game's own `visibilitychange`→`onBackground()` pauses the run and
Chromium throttles rAF; `rawDt` starves and the fps metering can't advance. Crucially, the **pre-existing**
`fpsAvg` reads its init value (60) in headless too — so "avg 0 / min —" in a headless capture is the environment,
identical for old and new code, and populates fine on a visible device at 60fps. **→ Bank: before calling a
headless "stat stays empty" a bug, check whether the SHIPPED metering shows the same — a hidden page starves
every wall-clock-driven readout equally.** The static half of the HUD (layout, placement, the gfx/tone/tier line,
live calls/tris) verifies fine headless; the wall-clock half is a device-only judge, like motion.

**Placement for a phone screenshot:** top-left, `top: calc(env(safe-area-inset-top) + 112px)` — below the
hearts/pause stack, clear of the top-centre distance and top-right score, `pointer-events:none` so it never eats
touch. The dark pill (`rgba(0,0,0,0.55)`) keeps the `#8aff9a` legible over both bright sky and dark water.

**→ Leapfrog.** `perfStats.js` is the reusable frame-accounting seam, and the "promote a `?debug` overlay to a
default-OFF Settings toggle with an identity-off proof" pattern applies to any future dev instrument. With the
gauge in hand, Phase 3 (N12 grade v2 / AA / shop DOF) can be measured on-device toggle-by-toggle as it lands.
