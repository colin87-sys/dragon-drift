# GRAPHICS-PERF-PLAN — reduce the NEED for adaptive resolution

**Assessment date:** 2026-07-15 · **Scope:** architectural draw-call / fill-cost reduction across
side props, spawns, hazards, particles, dragon, boss — everything that comes up in cruise.
**Goal (owner's ask):** make the shipped frame cheap enough that `resGovernor` (adaptive
resolution) becomes a rare backstop instead of a working lever. Assessment only — no game code
changed; every number below is from the headless census tools (`tricount`, `envcount`), code
reading with file:line cites, and the July on-device lessons.

---

## 0. The uncomfortable truth this plan is built around

The ledger already contains the decisive experiment
(`leapfrog/lessons/2026-07-13-perf-fill-vs-cpu-ondevice-ab.md`): **halving draw calls
(~550 → ~252 in the arena) did not move fps on the owner's device.** The frame is
**GPU fill-bound**, confirmed by `?pr=1` hitting 60 with every effect intact
(`…-perf-adaptive-resolution-global-governor.md`). That verdict shapes the ranking:

- **Draw-call merging/instancing is still worth doing** — it buys CPU headroom on weak Android
  (draw submission is CPU), shrinks the two *scene-doubling* passes (water mirror + god-ray
  mask, which re-pay every scene draw), and reduces hitch attribution `draw` time — but it will
  NOT, by itself, lift the owner's iPhone off 50fps.
- **The real "reduce the need for resolution" levers are fill levers:** transparent /
  `depthWrite:false` / additive overdraw, the scene-doubling passes, and full-res post passes.
- So the plan interleaves both, ranks by **(cost saved × confidence ÷ risk)**, and *every phase
  ends with the on-device single-axis A/B protocol* (`?pr=`, `?norays`, `?msaa0`…) so we never
  again optimize a metric the frame doesn't care about.

**Success metric:** with ADAPTIVE RESOLUTION on, the HUD's `res`/`sv` indicators should stop
engaging in ordinary cruise on the owner's device. That — not a draw-call count — is "reduced
the need for adaptive resolution."

---

## 1. Where the frame actually goes (measured / code-derived budget)

A full scene render is **~169 draw calls** (the water-mirror pass re-renders it; water.js:307-313).
Worst-case cruise composition:

| Subsystem | Draws (worst case) | Instanced/merged today? | Overdraw? | Notes |
|---|---|---|---|---|
| Env prop bands | ~10 (2 biomes × ≤6 archetypes) | **Yes** — 1 InstancedMesh/archetype, parts merged (environment.js:984, 170) | No (opaque) | Already excellent. Owner's #1 worry is actually the *solved* part. |
| propFoam siblings | ~9 | Yes (instanced) | Yes — thin waterline, depthWrite:false (propFoam.js:31-33) | Tier-gated off at tier2 already |
| Player dragon | **~45–60** (Azure ~36 wing meshes alone; dragonWings.js:855-1011) | **No** — `collapseStatic` merge exists (dragonCollapse.js) but only `sunhawk` opts in (dragons.js:946) | +3–8 additive glow sprites | Paid **2–3×**: redrawn in mirror + god-ray mask |
| Obstacles: phase gate | ~26 meshes **per gate** ×0–2 (obstacles.js:413-532) | No | **Yes** — additive core plane, 60m beacon pillar, 7 mote quads, all depthWrite:false | 3 per-instance additive materials per gate |
| Obstacles: rock run / spine | ~20–40 per active run (obstacles.js:1434+, 1619) | Walls merged per-mass, but **per-mass cloned transparent materials, depthWrite:false** (obstacles.js:1553-1554, 1224, 1669-1671) | **Yes — the worst pattern in the codebase** | Rock runs currently DISABLED; pattern must die before re-enable |
| In-lane hazards | 1–4 each ×~4 (shared geo/mats, obstacles.js:855-903) | Shared, not instanced | No (opaque emissive) | Cheap already |
| Geysers (hazards.js) | 2 per vent ×4–8 | No | Yes — per-vent additive flare sprite (hazards.js:59-64) | |
| Rings / orbs | ~6–10 + ~3–6, 1 draw each | No (shared geo; orbs share ONE material) | No (Skyforged = opaque) | Easiest instancing win |
| Particles (sparks) | **up to 150 additive sprite draws** (particles.js:13-17, 155-158) | **Batch built, parity-verified, OFF by default** (`?pfx=batch`, particles.js:40-45) | Yes — additive | The single biggest flag-flip in the repo |
| goldEmbers | 2 per gold, unpooled (goldEmbers.js:33-42) | No | Additive glow sprite | Small counts |
| embers / speedStreaks / bossBullets | 1 / 1 / 4 fixed | **Yes** — exemplary | minimal | Leave alone |
| Boss + chrome | ~15–55 + 9 (bossKit.js) | Per-limb merged; spikes/shards share mat but not instanced (bossModel.js:157-226) | shield/halo/maw additive stack | Episodic, already part-merged |
| Water mirror | **+~169 draws, full extra scene render** (½-rate cruise, ¼ tier1/saver) | duty-cycled hard already | — | Biggest single line item |
| God-ray occlusion mask | +~169 draws at ⅓ frames, trivial material (godrays.js:56-65) | duty-cycled, staggered vs mirror | — | |
| Post chain | 4 fullscreen passes + bloom mip chain + MSAA-4 HalfFloat RT (postfx.js:253-276) | tiered | fill | MSAA already 0 in arena |
| Sky dome + water surface | 2 draws, but ~60% + biggest-plane fill with heavy FBM/wave ALU | uniform-branched | ALU, not overdraw | Fill, not draws |

Band-geometry budgets are green and guarded (`envcount`: worst adjacent pair Lumen Mire +
Aurora Shallows = 79,844 band tris, cap 90k; all archetypes opaque, caps OK).

**Reading:** the frame's *draw-call* hot spots are (1) unmerged dragon, (2) un-batched sparks,
(3) gates/rock-runs, all amplified by the two scene-doubling passes. The frame's *fill* hot
spots are the mirror pass, additive FX overdraw (gates, flares, sparks), the post chain, and
sky/water ALU — and fill is what the device actually chokes on.

---

## 2. Ranked initiatives (score = savings × confidence ÷ risk)

### P0 — flip what's already built (days, near-zero risk, highest ROI)

**P0.1 Ship ParticleBatch as the default backend.**
`particles.js:40-45` — the instanced batch (≤150 additive sprite draws → **1** instanced draw)
is written, pixel-parity-verified (`2026-07-11-graphics-particlebatch-n4.md`), and reachable via
`?pfx=batch`. Flip the default; keep `?pfx=sprite` as the escape hatch. Also cuts the additive
*state-change* churn, and sparks are excluded from mirror/mask so risk is pure-visual only.
Shockwaves (≤8) can stay per-sprite. **~150 draws saved in celebration bursts; confidence: proven.**

**P0.2 Roster-wide `collapseStatic` (dragon static-sibling merge).**
`dragonCollapse.js:collapseStaticSiblings()` is proven pixel-diff-0 on sunhawk (~390 → ~40
draws) and correctly skips bones, anim boundaries, additive/layer-1, skinned. Enable per-dragon,
hero-first (**Azure Drake**, ~45–60 → est. ~15–20), verify with `tiershots` + `flapcheck`, then
migrate the roster one dragon per PR. Payoff is **2–3×** the headline number because the dragon
is re-drawn in the mirror and god-ray mask. Prerequisite cleanup: the merge-defeating material
clones — `dragon.js:380` (per-shard `shardMat.clone()` in a loop) and the ten
`bodyMat.clone()`/`hornMat.clone()` in `dragonFaceted.js` — consolidate to shared instances so
the buckets actually merge. **~30–45 draws ×2.5 passes; confidence: high (machinery shipped).**

**P0.3 Layer-diet the scene-doubling passes.**
The mirror and god-ray mask re-pay every draw. Audit what renders into them: exclude small/no
-reflection-value content (in-lane hazard details, gate motes/beacons, ring gems, ember
instancing already excluded?) via the existing layer-1 convention (propFoam already does this,
propFoam.js:75). Each exclusion is a draw saved *twice or three times a second-pass frame*.
**~20–40 pass draws; confidence: high; risk: reflections lose minor content (invisible at 768²).**

### P1 — kill the overdraw and per-instance-material patterns (the real fill work)

**P1.1 Gate FX diet + merge (obstacles.js:413-532).**
Per gate: merge the 8 corner-bracket bars + 4 rim bars + aperture frame into **1 merged opaque
mesh** (same pattern as `buildGateFrame`); batch the 7 mote quads into one instanced quad draw;
replace the 3 per-instance additive materials (core/beacon/mote) with shared materials + per
-instance attributes. ~26 → **~7 draws/gate**, and — the fill part — shrink the always-on
additive core plane + 60m beacon pillar coverage (distance-fade the beacon, clip the core to
the aperture). **Confidence: high; risk: low (gate look is geometric, headless-shootable).**

**P1.2 Replace the fade-clone pattern with a per-instance fade that keeps depthWrite.**
The rock-run/strait kits fade masses in by cloning a material per mass with
`transparent=true; depthWrite=false` (obstacles.js:1553-1554, 1224, 1601, 1669-1671). That is
N unique materials, N unsorted transparent draws, and full-surface overdraw for what is 95% of
its life an *opaque* wall. Replacement (one shared material, one `onBeforeCompile`):
**screen-door/dither fade via `discard`** (alpha-hash style), driven by a per-mesh uniform or —
if the masses become one InstancedMesh/BatchedMesh — a per-instance fade attribute. Opaque
pipeline, depth-writes intact, zero sorting, bloom/fog behave. Rock runs are disabled today, so
this is **a precondition for re-enabling them**, not an urgent frame win — but the same pattern
in `buildPropRun` (strait2) is live-adjacent. **Confidence: high; risk: fade looks different
(dither vs alpha) — judged on PR preview.**

**P1.3 Instance rings, orbs, geyser flares.**
- Orbs already share ONE geometry + ONE material (powerups.js:60-74) → mechanical InstancedMesh.
- Rings share geometry with per-instance uniform materials (rings.js:83-88) → move the per-ring
  params into instance attributes under the existing `customProgramCacheKey` program.
- Geyser flares (hazards.js:59-64): one instanced additive quad layer for all vents instead of
  per-vent SpriteMaterials; also pool goldEmbers.
**~15–25 draws; confidence: high; risk: low. Ranked below P1.1 because these are opaque/small
— it's CPU-side tidiness, not fill.**

**P1.4 Post-chain fill (the biggest "need for resolution" reducer, but needs on-device proof).**
Candidates, each behind a seam, A/B'd with the `?pr`/`?msaa0` protocol:
- **MSAA 4 → 0 outside the arena on tier1/mobile** — the arena lesson says MSAA-resolve
  bandwidth on the HalfFloat RT is the confirmed wall; cruise has hard edges, so test 2× or a
  cheap post-AA before committing (`2026-07-13-arena-msaa-off-the-real-60fps-lever.md`).
- **Fold GradingShader into OutputPass** (postfx.js:274) — one less fullscreen pass.
- **Depth-derived god-ray mask** (already noted deferred in godrays.js) — deletes a ~169-draw
  scene pass entirely.
**Confidence: medium (device-dependent); reward: this is the axis the device actually feels.**

### P2 — assessed and deliberately deferred / rejected

- **THREE.BatchedMesh for obstacle masses:** r160's BatchedMesh is first-generation (no
  per-instance color/uv support that instanceColor gives us, immature culling/sorting, API
  churn in later releases). Everything we need is achievable with InstancedMesh + merged
  geometry + instance attributes, which the codebase already does idiomatically. **Rejected
  for now; revisit only if a kit needs many *distinct* geometries in one draw.**
- **Env band work:** already 1 draw/archetype, merged parts, instanceColor tinting, biome
  visibility gating, envcount-guarded. Any further work here is **premature optimization**.
- **bossBullets / embers / speedStreaks:** exemplary; leave alone.
- **Ember matrix-write micro-opts, boss chrome plane batching:** low yield; skip.
- **Cheap follow-ups flagged elsewhere:** the strait **mist discs** (obstacles.js:1682) are
  transparent overdraw — fold into P1.2's pass when rock runs return. Near-camera pickup glow
  and sky-dome edge are cosmetic, not perf — out of scope.

---

## 3. Phased rollout (THE RULE + Fable Gate protocol)

All phases: coexist behind a flag → prove on the hero → migrate → never break the shipped
roster; each PR passes Gate 1 (pre-build) and Gate 2 (pre-merge, `SHIP` + score ≥8); lessons as
new `leapfrog/lessons/graphics-perf-…` files; land on the graphics integration branch.

**Phase A — flag flips (P0).**
A1 ParticleBatch default-on (identity: `?pfx=sprite` restores shipped byte-identically).
A2 `collapseStatic` on Azure Drake (hero proof: tiershots + flapcheck + pixel-diff, then
roster migration one-dragon-per-PR). A3 mirror/mask layer diet behind `?mirrorlite=0` opt-out.
**Exit:** on-device A/B session; record calls + fps before/after in the Gate Log.

**Phase B — spawn-object architecture (P1.1–P1.3), hero biome = Frozen Reach** (gates + the
richest kit density). New code in new files where possible (`gateBatch.js`, `fadeDither.js`)
per the branching rules; flags `?gates=v2`, `?fade=dither`, `?pickups=inst`. Prove on Frozen,
migrate biomes, keep `?skyforged=0`-style fallbacks one release.

**Phase C — post-chain fill (P1.4).** One seam per PR, each with a pre-stated expected
on-device delta and a refutation control, per the fill-vs-CPU lesson. Only the confirmed
lever gets made default.

**Phase D — measure the goal.** With phases A–C in, the owner flies with ADAPTIVE RESOLUTION
on: if `res`/`sv` no longer engage in cruise, the ask is met; the governor stays as the
weak-device backstop.

---

## 4. Headless regression guards (so it can't creep back)

1. **`tools/framecalls.mjs` + `tests/framecalls.mjs` — a live-frame draw-call census** (the
   envcount of the running game). Boot headless per biome via `tests/browser.mjs`, fly 3s, read
   `perfStats.worstCalls`/`worstTris` (already accumulated across ALL composer passes —
   main.js:507, 1903) rather than sampling `renderer.info` post-reset (a raw rAF sample races
   the reset at main.js:1920 and reads garbage — verified while attempting a live census for
   this assessment). Assert per-biome ceilings (set from Phase-A actuals, e.g. cruise worst
   ≤ N calls) exactly like envcount's band-tri caps.
2. **Per-subsystem unit assertions:** dragon post-`collapseStatic` mesh-count caps per roster
   entry (extend `tricount` with a draw-count column); gate build ≤7 meshes; particles backend
   === batch in default boot; "no `depthWrite:false` + `transparent` clones in obstacles.js"
   source guard (the same grep-guard style envcount uses for the veil alpha clamp).
3. **Identity-off guards** for every new flag (the resgovernor.mjs pattern: source-level
   `flag ? cheap : shipped` checks), so each optimization ships dark and byte-identical off.

---

## 5. Executive summary

The environment bands the owner worried about are the *best*-engineered part of the pipeline
(1 instanced draw per archetype, merged, opaque, budget-guarded). The actual draw-call fat is:
un-batched celebration sparks (≤150 additive draws — fix is built, just off), the un-merged
player dragon (~45–60 draws, paid 2–3× via mirror + god-ray mask — fix is built, enabled on one
dragon), and the gate/rock-run kits (dozens of un-instanced meshes with per-instance
transparent fade materials). But the ledger's on-device evidence says the device is
**fill-bound**: to genuinely reduce reliance on adaptive resolution, the overdraw kills
(gate FX diet, dither-fade replacing depthWrite:false clones) and post-chain fill work
(MSAA/pass-folding/depth-derived mask) matter more than the call count, and every phase must
re-verify on-device with single-axis toggles. Phase A alone (~2 flag-flips + a layer diet) is
days of work for the largest, lowest-risk chunk of the win.
