# Perf — the real arena 60fps lever was MSAA-resolve bandwidth, NOT resolution (keep every pixel)

**Supersedes** `2026-07-13-arena-dynamic-resolution-the-60fps-lever.md`. That lesson correctly localized
the wall to **GPU fill**, but landed on the wrong *lever*. One more on-device single-axis A/B — the one
we should have run before shipping — corrected it.

**What happened.** The arena (final-boss heaven detonation) held ~50fps on the owner's 17 Pro Max at
High. We proved it fill-bound (halving draws didn't move fps; `?pr=1` on High = 60). We shipped a
resolution cap (pixelRatio 1.5→1.2 in the arena). The owner pushed back — *"kinda shit that the flagship
can't run High at 60"* — which was the right instinct: dropping resolution on a flagship is treating the
symptom. So before defending the fix, we pulled the **other** fill lever we already had a seam for:
`?msaa0` (composer MSAA 4→0). On-device: **`?msaa0` = 60fps at FULL 1.5× resolution, fire intact.**

**The correction.** Two levers each independently hit 60 (`?pr=1` AND `?msaa0`) because the frame sat
right at the edge — either one tips it over. But they are NOT equal in cost-to-look:
- `?pr=1` pays in **every pixel of sharpness** across the whole arena.
- `?msaa0` pays in **anti-aliasing of hard edges** — and the heaven arena is a soft, full-frame ADDITIVE
  fire with *no hard geometry edges*; bloom already blurs everything. MSAA there resolves a multisample
  buffer every frame (heavy bandwidth on mobile TBDR) to smooth edges that don't exist.

So MSAA-off is nearly free *on that specific scene* and keeps **full resolution**. It's strictly the
better lever. The shipped fix flips to: **drop composer MSAA to 0 while `bossArenaMix() > 1.05`, restore
4× on exit; full resolution kept.** The resolution cap stays as an OPTIONAL fallback (`?arenapr=<n>`,
default off/Infinity) for a heavier instant, not the default.

**How to toggle MSAA at runtime (the gotcha).** Changing `WebGLRenderTarget.samples` alone does NOT
rebuild the multisample framebuffer — the renderer only re-runs `setupRenderTarget` after a **dispose**.
So `setPostMSAA(n)` sets `.samples = n` then `.dispose()` on BOTH composer buffers
(`composer.renderTarget1` + `renderTarget2`); the renderer rebuilds at the new sample count on the next
render. One realloc per arena enter/exit, masked by the unveil flash, `skipQualityFrames = 2` keeps it
out of the tier signal — same transition discipline as any RT realloc here. Verified 4→0→4 with zero
console errors (`tests/arenamsaa.mjs`, via the `__dd.postfx.setPostMSAA` seam).

**The headline lesson — when you find ONE lever that hits the target, don't ship it; find the SECOND and
pick the one that costs the least visible quality.** We had `?pr` and stopped. `?msaa0` was one 30-second
reading away and was strictly better (full res vs. reduced res, both at 60). A fill-bound frame usually
has *several* fill centers (resolution, MSAA-resolve, overdraw, post-chain passes) — enumerate them and
A/B each in isolation, because the cheapest-looking win is rarely the first one you try. The owner's
"that's not good enough" was the forcing function; treat that pushback as a prompt to widen the search,
not to defend the first fix.

**Corollary — match the lever to the SCENE's blind spot.** The reason MSAA-off is invisible here is
specific: this scene has no hard edges, so the thing MSAA buys is worthless *on this frame*. The general
move: for a fill-bound scene, list what each fill center actually buys, then cut the one whose product the
scene doesn't use. Soft additive glow → MSAA buys nothing (cut it, keep resolution). A sharp geometry
scene → the opposite (keep MSAA, cut elsewhere). Don't reach for the blunt global dial (resolution) when a
scene-specific one is free.

**Reusable.** Arena/scene-scoped MSAA: `setPostMSAA(samples)` in `postfx.js` (set `.samples` + `.dispose()`
both composer RTs), flipped on the scene's engage window in `main.js` (`setArenaPerf`), restored on exit.
Highest fps-per-visible-quality lever for a soft/bloomed fill-bound scene — beats dynamic resolution
because it keeps full pixel density and only sheds AA the scene never needed.
