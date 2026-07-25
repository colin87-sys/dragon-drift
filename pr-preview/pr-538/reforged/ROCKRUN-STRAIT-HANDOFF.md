# HANDOFF — Frozen rock-run overhaul (“rock run = the biome’s own props in the lane”)

**Read this, then read the repo rules** (`LEAPFROG.md` + `leapfrog/lessons/` + `reforged/BIOME-DESIGN.md`).
This is a mid-flight overhaul. A first prototype exists (flag-gated, dormant); the owner then
pivoted to a better direction that has a full Fable plan but is **not built yet**. Your job is to
build that plan.

---

## THE GOAL (owner’s own words, this is the committed direction)

> “Go back to the side props from Frozen and bring THEM into the flight lane. They look good and
> are varied enough that they don’t look like tall pillars of ice. And I can rhythmically bring
> them in and out to create periods of TIGHTNESS then OPEN EXPANSIVENESS. Then future biomes can
> do the same concept for their rock runs.”

So: **the rock run stops being a bespoke set-piece and becomes the biome itself, pulled into the
lane** — the same prop archetypes that decorate the horizon, brought to the lane edges, given fair
colliders, pulsed in a breath rhythm. It can’t clash with the biome because it *is* the biome. And
it’s a **reusable system** — every future biome’s rock run is just “bring in *its* own props.”

**North star:** the owner flew the current prototype and sent a low-run frame they called
**“WIDE EXPANSIVE BEAUTIFUL”** — low pack ice flanking a lead of gold water, sun on the horizon,
dragon skimming the mirror, huge sky. That composition is the bar. The failure frames were
**“tall narrow basic ugly claustrophobic.”** Wide+low+varied = win. Tall+narrow+uniform = fail.

---

## THE PLAN (Fable art director — committed, build this)

**Core:** one shared generator `buildPropRun(channelPlan, runKit, rnd)` pulls the biome’s real prop
archetypes to the lane edges, gives each a fair collider, and pulses them by a single **tightness
scalar `T(s) ∈ [0,1]`** along run distance. `T` is a smooth low-frequency wave (period ≈ 120–160 m
≈ one “breath”), **phase-locked to the reward rings**: rings sit in the **OPEN troughs (`T≈0`)**,
tight squeezes fall **BETWEEN** rings (`T≈1`). Two dials read `T`: channel half-width
(`li/ri` weave pulls in as `T→1`) and edge prop density (crowd both edges as `T→1`, thin/vanish as
`T→0`). That is the owner’s “tightness then open expansiveness,” landing openness on the reward.

**Frozen in-lane roster:** `bergwall`, `serac`, `terrace`, `berg`, `floe`, `skerry` (four unrelated
silhouette families, all broken crowns, none uniform). **Excluded, always:** `icetower`,
`glacierwall`, `iceFang` — tall uniform verticals = the “pillars of ice” the owner rejects.

**THE HARD RULE (this is the fix for the whole saga):** every in-lane instance is scaled so its
**bounding-box top sits at/below the deck-skim sightline** — an ABSOLUTE world-Y cap
(`runKit.heightCapY`), **decoupled from ring altitude**. (The old failure was mass height tracking
the ring up → tall/narrow on high-ring runs. Absolute cap kills it.) If an archetype can’t be short
without looking crushed, it self-excludes (that’s the mechanical reason icetower/iceFang are out).
Anti-picket: no two adjacent edge instances share a silhouette family.

**Fairness:** each archetype declares a collider **footprint as data**
(`{type:'box'|'boxes'|'sphere', halfExtents (rel to scale), yOffset}`) that **under-fits** the
visual mesh (sits just inside the silhouette → what looks passable is passable, what looks solid is
solid). Props on lane EDGES only (`li`/`ri`); center gold lead clear by construction; run
`ringClearance()` unchanged on the assembled colliders. Per-archetype: bergwall→one broad low box,
serac→two offset boxes, terrace→one box at the stepped bound, berg/floe→one low wide box,
skerry→small box/sphere.

**REUSABLE ARCHITECTURE (the owner’s “future biomes for free”):**
- **Shared, biome-agnostic:** `buildPropRun(channelPlan, runKit, rnd)` in `obstacles.js`. Walks the
  existing `rockSlicePlan` `li/ri` slices (untouched), computes `T(s)`, picks archetypes by weight
  with anti-picket, scales each under `heightCapY`, places at the edge, emits the visual instance +
  collider (from footprint) + registers fade. All rhythm/fairness/cap logic lives here, once.
- **Per-biome data block** `RUN_KIT[biome]` — the ONLY thing a new biome authors:
  ```
  RUN_KIT.frozen = {
    archetypes: ['bergwall','serac','terrace','berg','floe','skerry'],
    weights, scaleRange, heightCapY,
    colliderFootprints: { bergwall:{...}, serac:{...}, terrace:{...}, berg:{...}, floe:{...}, skerry:{...} },
    matIndex: 2, foamConfig,
    tightness: { openW, tightW, sparse, dense, period, jitter },
  }
  ```
  References the biome’s EXISTING archetypes — **zero new geometry**.

**Enabling refactor:** the prop builder in `environment.js` currently only emits decorative
InstancedMesh bands. Expose `makePropInstance(archetypeId, transform, matIndex)` (or minimally,
export access to `ARCHETYPES[id].build()` which already returns `{geometry, materials}`) so the
decorative band AND `buildPropRun` share ONE geometry source. **Prove the decorative bands render
byte-identical first** (no biome regression) before wiring the lane consumer.

---

## BUILD MOVES (in order) + THE GATE

**Move 1 — Expose the prop-instance factory in `environment.js`.** `ARCHETYPES` (const at ~line
118) holds each archetype’s `build: () => mergeParts([...], biomeIdx)` returning `{geometry,
materials}` (materials = shared `propMats.primary/accent[biomeIdx]`, self-lit via `addPropDetail`).
`ARCHETYPES` is NOT exported today. Export a thin accessor (e.g. `buildPropArchetype(id)` →
`ARCHETYPES[id]?.build()`, plus `propArchetypeMeta(id)` for matIndex/comp). Additive only — decorative
bands unchanged. ⚠ NOTE: during the last session Read vs grep gave inconsistent line numbers for this
file — re-read it carefully and confirm structure before editing; do not rush this shared file.

**Move 2 — Author `RUN_KIT.frozen`** (data block above): roster, weights, `scaleRange`,
`heightCapY` (tie to the deck-skim sightline — see the level.js STRAIT clamp), per-archetype
under-fitting collider footprints, tightness params.

**Move 3 — Write `buildPropRun` + wire behind a NEW flag `?strait2=1`** (coexist with the current
`?strait=1` prototype). Keep the `level.js` STRAIT low ring clamp. Render one **tight beat** and one
**open beat**. Add fade + `ringClearance()`.

**GATE (non-negotiable — this is what let 4 “good” elements sum to ugly before):** Fable **belonging**
montage — chase-cam frame vs the clean biome (`/tmp/frozen-new-1500.png`, regenerate via
`node tools/frozenshot.mjs`) — on a **tight-beat slice AND an open-beat slice**. Both must clear
**≥4.2** and be indistinguishable from the biome (critic must not be able to pick the set-piece).
Plus headless CI asserts: (a) every mass-top world-Y ≤ sightline on every slice; (b) collider ⊆
visual bbox + center lane clear; (c) `tricount` within mobile budget; (d) determinism on the
`canyonRnd` stream. Owner flies the PR preview = final gate.

**Write a lesson** per THE RULE when done: `leapfrog/lessons/<date>-rockrun-is-biome-props-in-lane.md`
(shared `buildPropRun` + per-biome `RUN_KIT`; the absolute-height-cap-below-sightline rule that kills
the pillar failure; tightness-phase-locked-to-rings).

---

## KEY FILES / SYMBOLS

- `reforged/js/obstacles.js` — the rock run. `buildRockGap` / `seaStack` / `stackRunV2`; the current
  strait prototype (`frozenStraitParts`, the `strait` flag, floe/prow forms — this is the kit being
  REPLACED by props-in-lane, but the channel/collider/fade contract stays). `glacierWallMat`,
  `bakeIceLadder`, `_WALL_LADDER`, `ringClearance()` (exported, tested), `overunderMassParts`.
- `reforged/js/environment.js` — the biome props. `ARCHETYPES` (~118), `mergeParts` returns
  `{geometry, materials}`, `addPropDetail` (self-lit weathering mat, supports non-instanced via
  `#else` branch), `propMats` (set in `createEnvironment`), `FOAM_CFG`, `crevasseCore`. Frozen props:
  bergwall/serac/terrace/icetower/glacierwall + berg/floe/skerry/iceFang.
- `reforged/js/level.js` — canyon scheduling. `STRAIT` flag (~line 24), `overlayCanyons` (~634)
  clamps Frozen rock-run `ring.y` to y5.0–7.0 when strait (**keep this — low is right**),
  `makeRockGap`, `rockSlicePlan` lives in `js/canyonMath.js` (the `li/ri` weave — untouched contract).
- `reforged/js/config.js` — `canyonStrait` (add if not present), `canyonCeilingY:21`,
  `canyonRockLaneHalfWidth:16`, `laneHalfWidth:13`, `ringRadius:3.6`, rings clamp y5.5–19.
- `reforged/tools/archshot.mjs` — capture tool: `node tools/archshot.mjs "split&strait2=1" tag`
  → `/tmp/claude-0/.../scratchpad/tag-d<dist>.png`. Health-pinned teleport; deviceScaleFactor 1.
- `reforged/tools/frozenshot.mjs` — clean biome cruise (the belonging bar): `/tmp/frozen-new-*.png`.
- `reforged/tests/hazardskin.mjs` — fairness/budget gate (imports `ringClearance` etc.). Run it.
- Studios: `tools/wallstudio.{html,mjs}`, `tools/obstaclestudio.*` (contact-sheet pattern to
  Fable-gate forms before wiring).

---

## PROCESS RULES (non-negotiable, from the owner)

- **Fable art director gates everything.** Pre-assess (plan) BEFORE building each move, harsh-critic
  checkpoint AFTER. **Hard floor 4.2/5** — nothing wires in below it. Do NOT cheat/trick the gate.
  Spawn via the Agent tool: `subagent_type:"claude"`, `model:"fable"`. There is a long-running Fable
  agent from the prior session with full context of this saga — a fresh chat starts a new one; give
  it the north-star frames + this plan.
- Premium bar: “premium looking, not cheap looking, or it’s a fail.”
- Build **systems, not one-offs**; coexist → prove on Frozen → migrate. Never break the shipped
  roster (all this is flag-gated OFF by default).
- **Verify before claiming** (headless tests + captures); the owner judges motion/feel on the PR
  preview. Re-stamp the SW (`node tools/stamp-sw.mjs`) as the LAST step before asking the owner to
  fly-test, or changes never reach the browser.
- After every meaningful change, add a NEW lesson file `leapfrog/lessons/<YYYY-MM-DD>-<slug>.md`
  (graphics work → `graphics-` slug). One file per lesson.

---

## CURRENT GIT / PR STATE

- **Branch:** `claude/wall-props-redesign-t7gsdu` (the designated dev branch — keep using it).
- **Merged already (live, but strait is flag-gated OFF):** PR #425 (calved canyon + 5 fixes +
  glacier material), #445, #448 (strait v1). The Frozen rock run in *normal* play is currently the
  **calved-canyon** (from #425) — the strait/props work is all behind `?strait=1`.
- **Open PR #449** — strait v1→v4 (low deck-skim). Current tip commit ~`6abcf48`. This is the
  bespoke floe/prow kit the owner is replacing. **Decide with the owner:** either repurpose #449 for
  the props-in-lane build, or close it and open fresh. The `frozenStraitParts` kit can be deleted once
  `buildPropRun` proves out; the `level.js` STRAIT low-ring clamp should be KEPT.
- ⚠ If a PR for this branch is already MERGED when you start, restart the branch from master
  (`git fetch origin master && git checkout -B claude/wall-props-redesign-t7gsdu origin/master`) and
  treat follow-up as a fresh change (repo rule for merged PRs).
- **Fly-test URLs:** live `.../reforged/?biome=2&rockrun`; PR preview
  `.../pr-preview/pr-<N>/?biome=2&rockrun&strait=1` (current prototype). New flag will be `&strait2=1`.
  `?biome=2` pins Frozen; hard-refresh to beat the SW cache.

---

## WHAT NOT TO REDO

- Don’t rebuild the bespoke floe/prow strait kit — the owner rejected it. Props-in-lane replaces it.
- Don’t reuse `icetower`/`glacierwall`/`iceFang` in the lane (tall pillars — the core complaint).
- Don’t couple mass height to ring altitude — absolute height cap below the sightline, always.
- Don’t reuse the calved-canyon WALL form as the tall “pinch” — the owner spotted that as “the old
  canyon with fewer walls.” There are no tall pinches now; the pinch is LATERAL (gap-narrowing).
- The low deck-skim altitude (level.js STRAIT clamp) is CORRECT — keep it.
