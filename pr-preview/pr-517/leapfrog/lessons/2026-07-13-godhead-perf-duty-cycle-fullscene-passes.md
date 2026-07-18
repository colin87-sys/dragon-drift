# GODHEAD perf III — duty-cycle the full-scene passes (god-ray mask + transition mirror)

**What we did.** After the tier-signal fix (perf II), the owner's 17 Pro Max correctly held **tier 0**
(full quality) through the whole S3 fight — no more trap, surge reads gold. But the on-device HUD showed
the scene is now genuinely **throughput-bound at tier 0**: `min 20fps @725c/181k`, identical across every
frame of the run → the worst frame is **725 draw calls / 181k tris**, hit during the **void→heaven
transition** (biome + arena crossfade + full mirror + boss all at once); mid-fight ~50–56, transition
~25. This is a draw-call/CPU cap, not a hitch — so the cure is fewer calls at tier 0, without cutting art.

**The two biggest remaining full-scene passes were running every frame, and both are visually slow-moving
→ duty-cycle them.**
- **God-ray occlusion mask (`godrays.js renderGodRayMask`)** is a FULL extra `renderer.render(scene,
  camera)` with a black override — ~200–300 calls (every layer-0 mesh) — every frame the shafts are
  active (the heaven's bright core keeps them on). The occluder silhouette (boss/dragon) + camera move
  slowly, so a 1-frame-stale mask is imperceptible; the shaft shader still runs every frame against the
  kept occRT. **Render every OTHER frame** (`_maskParity++ & 1`, render on the first call so there's
  never a black-mask frame). Halves the pass's per-frame cost (~−125 calls avg).
- **Water mirror during the TRANSITION.** The perf-I heaven mirror diet gated on `arenaDropK > 0.5`
  (settled deck) — so the heavy *transition* frames (sea not yet dropped) still paid the full mirror
  (~268 calls). Store `arenaMix` and trigger the diet the moment the heaven UNVEILING starts
  (`_arenaMix > 1.0`), so the transition spike gets the half/quarter-rate skip too.

**The lesson — a full-screen/full-scene pass whose CONTENT changes slowly is a duty-cycle candidate;
its RATE is independent of the frame rate.** God-rays, planar reflections, and similar "render the whole
scene again for one derived buffer" passes don't need to update at 60Hz — the derived signal (shaft
silhouette, reflection) moves at a fraction of that. Rendering the mask/mirror at 30Hz while the
consuming shader samples the kept buffer at 60Hz is invisible and halves the pass's draw-call cost. The
same stale-buffer idiom (keep the target, skip the render) works for any such pass, and the biggest wins
are exactly the passes that DOUBLE the scene (mirror, occlusion mask, shadow map).

**Corollary — gate a cost-saver on the phase where the cost actually PEAKS, not just where it's steady.**
The mirror diet's first cut gated on the settled state and missed the transition, which is where the
draw-call spike (and the owner's 25fps) actually lived. Cheap saver, wrong window → the worst frame was
untouched. Re-gate on the peak-cost phase (heaven engaged, `mix>1`), not the comfortable one.

**Verify.** `unmaskedarena` 57/57, `passbudget` 19/0 (the mask duty-cycle doesn't change the pass
STRUCTURE, only its render frequency), `smoke` clean (god-rays exercised in flight, no errors). The
draw-call delta is a real-GPU measurement — the owner's next on-device HUD `calls`/`min fps` is the
proof; expect the transition spike and the steady `calls` to drop. If tier 0 still isn't a locked 60,
the next lever is the deferred **seraph wing instancing** (104 calls → ~8–16 — a boss-model refactor).
NaN law + determinism untouched (render-scheduling only).

**Reusable.** Any "re-render the whole scene into an aux buffer" pass (planar mirror, god-ray/occlusion
mask, cheap shadow map, SSR proxy) can be duty-cycled to 30Hz with a stale-buffer skip at ~0 visual cost
— and gate the skip on the phase where its cost PEAKS. Rank these by "calls the pass adds × frames it's
active"; the scene-doubling passes are always near the top.
