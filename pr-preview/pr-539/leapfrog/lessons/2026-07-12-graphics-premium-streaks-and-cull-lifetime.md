# 2026-07-12 — graphics: premium speed streaks in one draw call, and the cull-by-anchor trap

**Did / learned.** The speed-tunnel streaks read "basic and tacky" — 56 identical flat
cyan axis-parallel `LineSegments`. Made them premium **without leaving one draw call or
touching the overdraw budget** (LineSegments are cliff-exempt): each streak is now a
3-segment polyline (4 points, 6 verts) with a per-vertex **quadratic bright-head →
transparent-tail** taper baked into a `color` BufferAttribute (`vertexColors:true`; under
`AdditiveBlending`, vertex RGB *is* brightness — no alpha attribute needed). Per-streak
variation at respawn — length by radius (outer = longer = parallax), brightness incl.
>1 "hero" darts that bloom, temperature (85% cool blues + 15% warm ember accents) — plus
a **motion-aligned direction** (`normalize(−vx, −vy·0.7, speed)`) so darts lean into the
bank exactly when the tube sways, approximating tube-following with three lines of math
and no tube sampling. Opacity ignites quadratically (`0.75·mix²`). A 2-line postfx
`vignette += mix·0.05` squeezes the tube edges to focus down the barrel. Colors upload
only on respawn frames; positions are the only per-frame write; zero allocation.

Then the **checkpoint review caught the real bug** — one that no headless audit could
see because it lives in the runtime *entry lifecycle*, not generator output:

- `updateObstacles` culled an entry when `e.dist < playerDist − cullBehind` (anchor +
  80m behind). Fine when a ribcage's forward ribs only overhung ~16m (the old 96−80 cap,
  right at the dragon's tail). But feel-v4's A1 uncapped `halves`, so spine ribs now tile
  forward to `dist + ribBandFw` (~150m *past* the ring) — culling at the anchor popped up
  to ~69m of bone tube, **and the `spineWallPresenceAt` band with it**, out mid-screen
  while the dragon was still inside the tunnel: it re-opened the very "not continuous"
  hole A1 shipped to close, plus a ~0.4s FX flicker, at every filled gap.
- Fix: cull by the **trailing edge** — `e.dist + (e.ribBandFw || 0) < playerDist −
  cullBehind`. `ribBandFw` is undefined→0 for every non-ribcage entry, so nothing else
  changes and memory stays bounded (`wf ≤ ~150m`).

**→ Systematize.** (1) **Premium ≠ more draw calls.** A tapered, varied, motion-aligned
`LineSegments` with baked vertex-color gradients buys most of a "motion-blur streak" look
for one draw call — reach for it before particles. (2) **When you extend how far a piece
of geometry reaches, re-check its lifetime bounds.** Cull/spawn/broad-phase windows sized
for the *old* extent silently clip the new geometry; cull by the object's true
trailing/leading edge, never by a centre/anchor, the moment its span becomes variable.
(3) **Headless audits verify generator output; they are blind to the runtime entry
lifecycle** (cull, fade, LOD, pooling) — that's exactly the seam where a checkpoint review
earns its keep. This bug passed every headless test and would have shipped without it.

**→ Leapfrog.** The vertex-color-taper `LineSegments` pool is now a reusable premium
"motion" primitive (boss chase, finale burst, dash trails). And "cull by trailing edge,
not anchor" is a standing rule for any variable-span overlay geometry the other biomes add.
