# GODHEAD DETONATION — premium P3: the ember/spark layer (shader-driven, zero CPU/frame)

**What we did.** Added the fine-particulate tier the reference's vastness depends on: ~160 tiny
billboarded sparks streaming outward, ONE additive draw, `arenaSet.js buildEmbers`. FULLY shader-driven
— each ember's radius is `mix(30, 360, fract(uTime*speed + phase))` computed in the VERTEX, so there is
zero per-frame CPU (no matrix churn, unlike the debris InstancedMesh). Per-quad attributes
`aQuad`(billboard corner) + `aSeed`(dir, speed, phase, size); the vertex bakes the fairness (eclipse
gate `smoothstep(150,210,r)` + down-suppression `smoothstep(-0.3,0.2,sin dir)`) into `vGlow`, tip-fades
on recycle, and lerps hot-gold→violet over life. ~640 tris, tiny screen fill (each spark a few px) — NOT
a "large additive volume", so the §2 overdraw cap is respected. Rides the same `uGain`/`uTime` engage as
the detonation; ember visibility tracks `STAR_MODE === 'detonation'` (off in the supernova/spiral A/B seams).

**The pattern — vertex-computed motion is the cheapest recycled particle system.** The P4 debris lesson
warned that per-frame `instanceMatrix` uploads jank real phones past ~64 animated instances. Embers
sidestep that entirely: the geometry is STATIC (positions are all origin; the real position is derived
in the vertex from `uTime`), so 160 sparks cost one static draw and zero uploads. **For a recycled
outward-streaming particle field where each particle's path is a pure function of time, put the motion in
the vertex shader, not in CPU matrix writes — it scales far past the instance-upload ceiling.**

**Fairness by construction (baked in the vertex, like the streaks).** The eclipse gate keeps sparks dark
inside the seraph; down-suppression keeps them out of the corridor column; they're thin + dim, so the
probe deltas are ~0: sky p95 0.822→0.826, p50 0.453→0.443, corridor p90 0.345 — all under gate. NaN-safe
(`max(0.0, 1.0 - dot(vQ,vQ))` for the soft dot; no `pow`/`sqrt`/`log`).

**Verify.** `unmaskedarena` 55 green (ember coexistence added: `emberVis`/`emberN 160` true in heaven,
false at mix 0 / void / after teardown — same set-gating as debris). `tricount` 0-over. No console errors
(the ember shader compiled). `boss`/`unmaskedorgans` untouched (arenaSet.js + test only).

**What it unlocks.** The premium trio ships — P1 turbulence + P2 rim-lit molten rocks + P3 embers — the
three highest-impact richness upgrades, all fairness-safe and NaN-clamped. Motion (churning fire +
tumbling lit rocks + streaming sparks) is the real payoff → owner real-GPU **motion** preview. Remaining
(deferred): P4 per-streak depth classes, P6 tier-2 graceful degrade, and Fable's P2b shard-silhouette family.
