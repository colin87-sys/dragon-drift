# GRAPHICS-PERF-PLAN — FPS FIRST (finalized)

**Assessment date:** 2026-07-15 · **Finalized (independent audit):** 2026-07-15 · **Status: FINAL**
**Scope:** everything that costs frame time in cruise — fill (overdraw, post chain, full-res
passes) first, draw-call/CPU architecture second.
**Goal (owner's directive, supersedes the original ranking):** *"Priority is improving FPS —
whatever that takes — and work our way down."* So this plan is ordered by **expected on-device
fps delta ÷ risk**, not by implementation convenience. The original draft led with flag-flips
("Phase A") while itself admitting they would not lift the iPhone off ~50fps; that tension is
resolved here in the owner's favor: **fill levers lead, draw-call merges follow.**

---

## Independent audit (finalized)

Audited 2026-07-15 by an independent graphics engineer (Fable). Method: re-ran the census tools,
re-read every cited file:line, and re-checked the plan against the July on-device lessons —
including three 07-14/07-15 developments the draft predates.

**Verdict: the plan's ANALYSIS survives audit almost intact; its ORDERING did not.** The census
numbers, code cites, and the fill-bound diagnosis all check out. But the draft sequenced
low-risk draw-call work ahead of the fill work its own Section 0 says the device actually needs.
Under the owner's FPS-first directive that ordering is inverted below.

### Verified (independently re-checked)
- `tricount` (53 models, 0 over budget) and `envcount` (all budgets green; worst adjacent pair
  Lumen Mire + Aurora Shallows = 79,844 / 90k cap) — both green, as claimed.
- Env bands: 1 InstancedMesh/archetype, merged, opaque (environment.js) — claim holds; further
  band work is correctly rejected as premature.
- ParticleBatch: built, parity-verified, **default = sprite**, opt-in `?pfx=batch`
  (particles.js:33-48) — claim holds.
- `collapseStatic`: exists (dragonCollapse.js), enabled **only** on sunhawk
  (dragons.js:946, `collapseStatic: true` with the ~390→~40 note) — claim holds.
- Fade-clone pattern: `mats.body[bi].clone()` / `frostGlow.clone()` with
  `transparent=true, depthWrite=false` at obstacles.js:1454, 1553, 1601, 1669 — present as cited.
- Mirror: full extra scene render, duty-cycled (½-rate cruise, ¼ heaven, 1/8 settled;
  water.js:300-318). God-ray mask: full scene re-render at ⅓ frames, staggered. Both confirmed.
- God-ray shaft march: **40-tap loop per pixel at FULL resolution** (godrays.js:108-136,
  `MAX_SAMPLES 48`, `uSamples 40`), composited as a full-res ShaderPass (postfx.js:268).
- Rock runs: confirmed disabled in normal play (`canyonTypeWeights: { rock: 0, … }`,
  config.js:179) — the kit is preserved behind the weight.
- `perfStats.worstCalls/worstTris` snapshotted at the min-fps frame (perfStats.js:41) — the
  proposed framecalls guard's data source is sound.

### The central claim, pressure-tested: still FILL-BOUND — and now doubly proven
The draft leans on the 07-13 A/B (halving draws ~550→~252 moved fps 0; `?pr=1` hit 60). Is that
still valid post-adaptive-resolution? **Yes, and more strongly than the draft states.** The
07-14 hitch-attribution instrument read, on-device, at the worst frame:
**`hitch 50ms — sim 1, draw 3, gpu 46`** (`2026-07-14-perf-instrument-redirected-the-cut-…`).
Even the *hitches* are GPU fill, not CPU/draw. And with dynRes ON, the device held tier 0 in a
heavy Aurora Shallows section only by trimming to **res 0.60 + saver** — i.e. the cruise fill
deficit is on the order of **~40–45% of pixel cost**. That is the number this plan has to close.
Corollary confirmed: draw-call merging will not move the owner's fps; it earns its (lower) place
for CPU headroom on weak Android, hitch `draw`-time, and shrinking the scene-doubling passes.

### Corrections to the draft
1. **Stale: adaptive resolution is now DEFAULT-ON** (07-14, `save.js` `dynRes: true` + versioned
   migration). The success metric below is restated accordingly — it's what every player runs.
2. **Stale: the perf-saver stage already shipped** part of the draft's P0.3/P1.4 territory —
   under load the governor already drops the cruise mirror ½→¼ rate and god-rays 40→24 taps
   (`2026-07-14-perf-saver-stage-…`, water.js:316-318, postfx.js:131). The *layer diet* of the
   scene-doubling passes remains valid and distinct; the duty-cycle part is done.
3. **Partially stale: the fade-clone fill claim.** On 07-15 the canyon fade loop gained
   `depthWrite = opacity >= 0.999` (`2026-07-15-graphics-rockrun-integration-fixes.md`), so a
   settled mass depth-writes again — the *steady-state* transparent-overdraw cost the draft
   attributed to this pattern is largely gone. The dither-fade rework survives as (a) material
   dedupe and (b) the precondition for re-enabling rock runs (`rock: 0` today), demoted
   accordingly.
4. **Missed fill lever, added: render the god-ray shaft march at HALF resolution.** The draft
   only proposes fixing the mask's *draws* (depth-derived mask). The bigger fill win is the
   march itself: a 40-tap/pixel full-res pass over blurred, low-frequency columns — the textbook
   half-res candidate. Added as F2.
5. **Minor, noted not actioned:** dragonSurfaceShader.js:116-170 runs two 27-tap 3D Worley loops
   per fragment — heavy ALU but small screen coverage in cruise; worth remembering if a dragon
   ever fills the frame (photo mode, cutscenes).
6. **Bloom is confirmed innocent** (the 07-13 refutation control read ~0) — correctly absent
   from the lever list; keep it that way.
7. **Overstated: the sky/water "heavy FBM ALU" line.** Verified: water is 3 directional sine
   octaves + one swell (water.js:9, 90-91) — cheap; the aurora sky is a bounded 2-layer loop
   with tier-gated noise (auroraSky.js:80); only skyClouds.js:35 runs a real 4-octave loop.
   Sky/water ALU is a last-resort candidate at best, and it scales with resolution anyway —
   demoted hard (see the F-track note).
8. **Minor factual fixes:** goldEmbers is one Mesh + one additive Sprite per gold (2 draws, not
   "two sprites"; goldEmbers.js:33-40). The mirror is a three.js `Reflector`-driven full-scene
   render, not a literal `scene.render(mirrorCamera)` — cost as described. The shipped MSAA-0
   applies specifically to the heaven/boss arena (`bossArenaMix() > 1.05`, main.js:1375, 1892).
9. **P2 rejections upheld** (BatchedMesh in r160, env bands, embers/streaks/bossBullets) — all
   verified reasonable; no change.

### Final ordering rationale
Owner directive: FPS first. The device's frame is GPU fill; therefore the sequence is
**fill levers ranked by expected on-device delta ÷ risk (F1–F5), then the draw-call/CPU track
(D1–D4)** whose benefits are real but secondary. Every fill lever ships behind a single-axis
seam and is confirmed by the on-device A/B protocol before becoming default — the repo's
hardest-won law (localize, pre-state the expected delta, include a refutation control, bracket
for thermal drift).

**Success metric (restated):** with the (now default-on) adaptive resolution running, the HUD's
`res`/`sv` indicators stop engaging in ordinary cruise on the owner's device — the governor
returns to being a rare backstop. That, plus `min`-fps (hitch) no longer dipping below ~40,
is "FPS improved"; a draw-call count is not.

— *Signed off FINAL, independent audit, 2026-07-15.*

---

## 0. The uncomfortable truth this plan is built around

The ledger contains the decisive experiments
(`leapfrog/lessons/2026-07-13-perf-fill-vs-cpu-ondevice-ab.md`,
`…-2026-07-14-perf-instrument-redirected-the-cut-dynres-default-on.md`): **halving draw calls
(~550 → ~252 in the arena) did not move fps on the owner's device**, `?pr=1` hit 60 with every
effect intact, and the hitch instrument attributes the worst frame to **GPU (`gpu 46` of a 50ms
frame)**. The frame is **GPU fill-bound**, in cruise and in the arena, before and after adaptive
resolution. That verdict shapes the ranking:

- **The real FPS levers are fill levers:** the MSAA-resolve bandwidth on the HalfFloat composer
  RT, full-res post passes (the 40-tap god-ray march), additive / `depthWrite:false` overdraw
  (gates, flares, sparks), and the scene-doubling passes' pixel cost.
- **Draw-call merging/instancing is still worth doing** — it buys CPU headroom on weak Android,
  shrinks the two scene-doubling passes (water mirror + god-ray mask), and reduces hitch `draw`
  time — but it will NOT, by itself, lift the owner's iPhone off ~50fps, and it therefore runs
  BENEATH the fill track, not ahead of it.
- Every phase ends with the on-device single-axis A/B protocol (`?pr=`, `?norays`, `?msaa0`…)
  so we never again optimize a metric the frame doesn't care about.

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
| Obstacles: rock run / spine | ~20–40 per active run (obstacles.js:1434+, 1619) | Walls merged per-mass, but **per-mass cloned transparent materials** (obstacles.js:1553-1554, 1224, 1669-1671) | Reduced 07-15: `depthWrite=true` while opacity ≥0.999 — overdraw now only during fade windows | Rock runs DISABLED (config.js:179 `rock:0`); dither-fade is the re-enable precondition |
| In-lane hazards | 1–4 each ×~4 (shared geo/mats, obstacles.js:855-903) | Shared, not instanced | No (opaque emissive) | Cheap already |
| Geysers (hazards.js) | 2 per vent ×4–8 | No | Yes — per-vent additive flare sprite (hazards.js:59-64) | |
| Rings / orbs | ~6-10 + ~3-6, 1 draw each | No (shared geo; orbs share ONE material) | No (Skyforged = opaque) | Easiest instancing win |
| Particles (sparks) | **up to 150 additive sprite draws** (particles.js:13-17, 155-158) | **Batch built, parity-verified, OFF by default** (`?pfx=batch`, particles.js:40-45) | Yes — additive | The single biggest flag-flip in the repo |
| goldEmbers | 2 draws per gold (1 mesh + 1 additive sprite), unpooled (goldEmbers.js:33-40) | No | Additive glow sprite | Small counts |
| embers / speedStreaks / bossBullets | 1 / 1 / 4 fixed | **Yes** — exemplary | minimal | Leave alone |
| Boss + chrome | ~15–55 + 9 (bossKit.js) | Per-limb merged; spikes/shards share mat but not instanced (bossModel.js:157-226) | shield/halo/maw additive stack | Episodic, already part-merged |
| Water mirror | **+~169 draws, full extra scene render** (½-rate cruise, ¼ under saver / tier1) | duty-cycled hard already (incl. shipped saver rung) | — | Biggest single line item |
| God-ray occlusion mask | +~169 draws at ⅓ frames, trivial material (godrays.js:56-65) | duty-cycled, staggered vs mirror | — | |
| God-ray shaft march | 1 fullscreen pass | — | **40 taps/pixel at FULL res** (godrays.js:108-136; postfx.js:268) | Half-res candidate — F2 |
| Post chain | 4 fullscreen passes + bloom mip chain + MSAA-4 HalfFloat RT (postfx.js:253-276) | tiered | fill | MSAA already 0 in arena; cruise untested — F1 |
| Sky dome + water surface | 2 draws, big screen coverage; ALU is MODEST (audit correction): water = 3 sine octaves (water.js:9), aurora = bounded 2-layer tier-gated loop (auroraSky.js:80); only skyClouds.js:35 is a true 4-octave loop | uniform-branched | ALU, not overdraw | Scales with resolution — governor covers it; last-resort lever only |

Band-geometry budgets are green and guarded (`envcount`: worst adjacent pair Lumen Mire +
Aurora Shallows = 79,844 band tris, cap 90k; all archetypes opaque, caps OK).

**Reading:** the frame's *fill* hot spots — what the device actually chokes on — are the MSAA
resolve, the full-res god-ray march, additive FX overdraw (gates, flares, sparks), the mirror
pass, and sky/water ALU. The frame's *draw-call* hot spots are (1) unmerged dragon, (2)
un-batched sparks, (3) gates, amplified by the two scene-doubling passes — real, but not what
sets the owner's fps.

---

## 2. Ranked initiatives — FPS-first

Score = expected on-device fps delta × confidence ÷ risk. Fill track first (owner directive),
draw-call/CPU track second.

### FILL TRACK (the fps) — F1 highest

**F1 — Cruise MSAA experiment: composer MSAA 4 → 2/0 outside the arena (tier-scoped).**
The arena's proven biggest lever: `?msaa0` alone = 60fps at FULL 1.5× resolution
(`2026-07-13-arena-msaa-off-the-real-60fps-lever.md`) — MSAA-resolve bandwidth on the HalfFloat
RT is the confirmed wall on mobile TBDR. Cruise differs: it HAS hard edges (props, rings,
dragon), so MSAA-off is not free there. Protocol: on-device A/B with the existing `?msaa0` seam
to size the prize first; if the fps delta is large (expected — same RT, same resolve), evaluate
**MSAA 2×** and/or a cheap post-AA against it, judged on the PR preview. Ship the best
fps-per-visible-quality point tier-scoped (weak devices first), via the shipped `setPostMSAA`
mechanism (samples + dispose both composer RTs, `skipQualityFrames` guard).
**Expected: the largest single cruise delta available (~arena-class, up to ~+10fps); risk:
edge quality — mitigated by 2×/post-AA and per-tier scoping; effort: small (mechanism shipped).**

**F2 — God-ray shaft march at HALF resolution (+ baseline tap audit).** *(missed by the draft)*
godrays.js:108-136 marches **40 taps per pixel at full res every frame** (postfx.js:268). The
shafts are broad radial-blurred columns — zero high-frequency content — so render the march
into a ½-res (even ⅓-res) RT and composite upsampled: **~75% of that pass's fill for free**.
Also audit the 40-tap baseline: the saver already proves 24 taps is indistinguishable under
load; if 24–32 is indistinguishable at rest too, lower the default.
**Expected: a solid cruise fill cut on a permanent full-screen pass; risk: low (blurred
content upsamples cleanly); effort: small-medium. Seam: `?grhalf=0` identity-off.**

**F3 — Gate FX overdraw diet (the fill half of the gate work).**
obstacles.js:413-532 — shrink the always-on additive coverage: clip the core plane to the
aperture, distance-fade the 60m beacon pillar, cap mote quad size. This is per-pixel additive
overdraw in the player's forward view, exactly the fill class the device pays for.
(The gate *merge* — 26→7 draws, shared materials + instance attributes — moves to D3 below:
same PR family, but the draws are the secondary half.)
**Expected: moderate, spiky (gates are episodic); risk: low, headless-shootable; effort: small.**

**F4 — Post-chain consolidation.**
- **Fold GradingShader into OutputPass** (postfx.js:274) — one less fullscreen read/write.
- **Depth-derived god-ray mask** (deferred note in godrays.js) — deletes the ~169-draw ⅓-rate
  mask scene pass entirely (mostly draw/CPU relief, some fill; also simplifies F2).
**Expected: modest each, additive; risk: low-medium; confidence: medium — A/B'd per seam.**

**F5 — Dither-fade replacing the fade-clone pattern.** *(demoted from the draft's P1.2)*
The 07-15 `depthWrite = opacity >= 0.999` fix already removed the steady-state overdraw this
initiative was originally credited with; what remains is fade-window overdraw, N cloned
materials, and unsorted transparent draws. Replacement stands as designed: one shared material,
screen-door/dither `discard` fade via `onBeforeCompile`, per-mesh uniform or per-instance
attribute — opaque pipeline, depth intact, zero sorting. Rock runs are disabled today
(config.js:179), so this is **the precondition for re-enabling them**, not a current-frame win;
`buildPropRun` (strait2) shares the pattern and benefits when it returns.
**Expected: small today, structural for rock-run re-enable; risk: fade looks different (dither
vs alpha) — judged on PR preview.**

*If F1–F4 land and cruise still engages the governor:* next fill candidates, in order — sky
cloud FBM octave tiering (skyClouds.js:35, 4 octaves over ~60% of the frame), spark/flare
additive coverage caps. Not scheduled until the A/Bs say they're needed.

### DRAW-CALL / CPU TRACK (headroom, hitches, weak-Android) — real but secondary

**D1 — Ship ParticleBatch as the default backend.**
particles.js:33-48 — the instanced batch (≤150 additive sprite draws → **1**) is written,
pixel-parity-verified (`2026-07-11-graphics-particlebatch-n4.md`), reachable via `?pfx=batch`.
Flip the default; keep `?pfx=sprite` as the escape hatch. Also cuts additive state-change churn;
sparks are excluded from mirror/mask so risk is pure-visual. Shockwaves (≤8) stay per-sprite.
**~150 draws in celebration bursts; confidence: proven. Will not move the owner's fps —
justified by burst-frame CPU and weak-Android headroom.**

**D2 — Roster-wide `collapseStatic` (dragon static-sibling merge).**
`dragonCollapse.js:collapseStaticSiblings()` is pixel-diff-0 proven on sunhawk (~390 → ~40
draws; dragons.js:946) and correctly skips bones, anim boundaries, additive/layer-1, skinned.
Enable per-dragon, hero-first (**Azure Drake**, ~45-60 → est. ~15-20), verify with `tiershots` +
`flapcheck`, migrate one dragon per PR. Payoff is 2-3× the headline (mirror + mask redraws).
Prerequisite: consolidate the merge-defeating clones — dragon.js:380 per-shard
`shardMat.clone()`; the ten `bodyMat.clone()`/`hornMat.clone()` in dragonFaceted.js.
**~30-45 draws ×2.5 passes; confidence: high (machinery shipped).**

**D3 — Gate merge + instancing sweep (the draws half of F3, plus P1.3).**
Merge the gate's 8 corner brackets + 4 rim bars + frame into 1 opaque mesh; batch the 7 motes
into one instanced quad; shared materials + per-instance attributes (~26 → ~7 draws/gate).
Plus: orbs → InstancedMesh (one geo+mat already, powerups.js:60-74); rings → instance
attributes under the existing `customProgramCacheKey` program (rings.js:83-88); geyser flares →
one instanced additive layer (hazards.js:59-64); pool goldEmbers.
**~35-50 draws total; confidence: high; risk: low. CPU tidiness, not fps.**

**D4 — Layer-diet the scene-doubling passes.**
The mirror and mask re-pay every draw. Exclude no-reflection-value content (in-lane hazard
details, gate motes/beacons, ring gems) via the layer-1 convention (propFoam.js:75 precedent).
Each exclusion saves a draw 2-3× per second-pass frame. Note: the *duty-cycle* half of the
draft's version already shipped in the perf-saver (water.js:316-318) — this is only the
per-object diet. **~20-40 pass draws; risk: reflections lose minor content (invisible at 768²).**

### P2 — assessed and deliberately deferred / rejected (upheld by audit)

- **THREE.BatchedMesh for obstacle masses:** r160's BatchedMesh is first-generation (no
  per-instance color/uv support that instanceColor gives us, immature culling/sorting, API
  churn in later releases). InstancedMesh + merged geometry + instance attributes covers every
  need idiomatically. **Rejected for now; revisit only if a kit needs many *distinct*
  geometries in one draw.**
- **Env band work:** already 1 draw/archetype, merged, instanceColor-tinted, gated,
  envcount-guarded. Any further work here is **premature optimization**.
- **bossBullets / embers / speedStreaks:** exemplary; leave alone.
- **Ember matrix-write micro-opts, boss chrome plane batching:** low yield; skip.
- **Sky/water octave cuts:** parked behind the F-track A/Bs (see F5 note) — resolution scaling
  already discounts their ALU; don't spend look on an unproven lever.
- **Strait mist discs** (obstacles.js:1682): transparent overdraw — fold into F5 when rock runs
  return. Near-camera pickup glow and sky-dome edge are cosmetic, not perf — out of scope.

---

## 3. Phased rollout (THE RULE + Fable Gate protocol)

All phases: coexist behind a flag → prove on the hero → migrate → never break the shipped
roster; each PR passes Gate 1 (pre-build) and Gate 2 (pre-merge, `SHIP` + score ≥8); lessons as
new `leapfrog/lessons/graphics-perf-…` files; land on the graphics integration branch.
**Every fill PR pre-states its expected on-device delta and carries a refutation control**
(the fill-vs-CPU law); sessions bracket with a repeated baseline for thermal drift.

**Phase A — the fps (F1 + F2).**
A1 Cruise MSAA A/B on-device (`?msaa0`, then 2×/post-AA candidates), ship the winner
tier-scoped via `setPostMSAA`. A2 half-res god-ray march behind `?grhalf` + baseline tap audit.
**Exit: owner flies cruise with the HUD on; `res`/`sv` engagement and min-fps recorded in the
Gate Log before/after. This phase is the directive; nothing else lands ahead of it.**

**Phase B — overdraw + post chain (F3, F4).** Gate FX diet behind `?gatefx=0` opt-out;
grading fold + depth-derived mask one seam per PR, each A/B'd. Hero biome = Frozen Reach
(richest gate/kit density).

**Phase C — draw-call/CPU track (D1-D4).** C1 ParticleBatch default-on (identity: `?pfx=sprite`
restores shipped byte-identically). C2 `collapseStatic` on Azure Drake (tiershots + flapcheck +
pixel-diff), then roster one-dragon-per-PR. C3 gate merge + instancing sweep (`?gates=v2`,
`?pickups=inst`), new code in new files (`gateBatch.js`). C4 mirror/mask layer diet behind
`?mirrorlite=0` opt-out. Justified as CPU/hitch/weak-Android headroom — expected owner-device
fps delta ~0, and that expectation is stated up front so a flat reading is a pass, not a surprise.

**Phase D — rock-run precondition (F5).** Dither fade (`?fade=dither`, `fadeDither.js`) lands
with the rock-run re-enable decision, not before.

**Phase E — measure the goal.** With A-C in, the owner flies with the (default-on) ADAPTIVE
RESOLUTION HUD visible: if `res`/`sv` no longer engage in ordinary cruise and min-fps holds
≥~40, the directive is met; the governor stays as the weak-device backstop.

---

## 4. Headless regression guards (so it can't creep back)

1. **`tools/framecalls.mjs` + `tests/framecalls.mjs` — a live-frame draw-call census** (the
   envcount of the running game). Boot headless per biome via `tests/browser.mjs`, fly 3s, read
   `perfStats.worstCalls`/`worstTris` (already accumulated across ALL composer passes —
   main.js:507, 1913; snapshotted at the min-fps frame, perfStats.js:41) rather than sampling
   `renderer.info` post-reset (a raw rAF sample races the reset and reads garbage — verified
   while attempting a live census for this assessment). Assert per-biome ceilings (set from
   Phase-C actuals) exactly like envcount's band-tri caps.
2. **Per-subsystem unit assertions:** dragon post-`collapseStatic` mesh-count caps per roster
   entry (extend `tricount` with a draw-count column); gate build ≤7 meshes; particles backend
   === batch in default boot; "no `depthWrite:false` + `transparent` clones in obstacles.js"
   source guard (the same grep-guard style envcount uses for the veil alpha clamp).
3. **Identity-off guards** for every new flag (the resgovernor.mjs pattern: source-level
   `flag ? cheap : shipped` checks), so each optimization ships dark and byte-identical off —
   including `?grhalf`, the MSAA tier scoping, and `?gatefx`.
4. **Fill guards are on-device by definition** — headless (SwiftShader) cannot measure GPU fill.
   The guard is procedural: every fill PR's Gate Log entry must contain the pre-stated expected
   delta, the measured on-device delta, and the refutation-control reading.

---

## 5. Executive summary

The device is **GPU fill-bound** — proven twice on-device (draw-halving moved fps 0; the hitch
instrument reads `gpu 46 / sim 1 / draw 3` at the worst frame) — and in heavy cruise it holds
tier 0 only by burning ~40% of its pixels through the (now default-on) resolution governor.
So, per the owner's directive, this plan leads with the fill levers: **(F1) the cruise MSAA
experiment** (the arena's proven ~+10fps-class lever, re-run for cruise's hard edges),
**(F2) half-res the 40-tap god-ray march**, **(F3) the gate additive-overdraw diet**, then
post-chain consolidation. The draw-call work the original draft led with — ParticleBatch
default, roster-wide `collapseStatic`, gate/pickup instancing, mirror layer diet — is all real
and all retained, but demoted to the second track: it buys CPU headroom, hitch time, and
weak-Android margin, not the owner's fps. The environment bands the owner worried about remain
the best-engineered part of the pipeline; leave them alone. Every lever ships flag-gated and
identity-off, every fill claim is settled by the single-axis on-device A/B protocol with a
pre-stated delta, and the finish line is the HUD: `res`/`sv` silent in ordinary cruise.
