# 🐸^🐸 Leapfrog Studios — `leapfrog^leapfrog`

This is the studio playbook and **append-only lessons ledger** for Dragon Drift.

## The ideology

> Every step we take, we extract the lesson and write it down here, so the **next
> session starts from everything the last one learned — and leapfrogs from there**.
> Compounding knowledge across sessions, not just within one. Leapfrog, to the
> power of leapfrog.

A fresh chat with zero memory of past work can read this file and immediately
operate at the level we've already reached — then push past it, and record *its*
lessons for the one after. That is the whole studio: we rapidly improve the game
**and ourselves**.

---

## 📂 LESSON INDEX (by topic) — read only what's relevant to your task

The ledger below is **append-only** (L1… plus older `## Lesson —` blocks). This map lets a fresh session jump
to the relevant lessons instead of reading 3000+ lines. **When you add a lesson, also add its number here.**

- **CELESTIAL STORM dragon — current arc (L90–L110)** — clean-sheet rear-cam (dorsal) creature traced from concept art:
  - *2D trace → definition:* **L90, L92** (silhouette + armour plates + struts), **L95** (auto-fit the wing to the colour reference: scale/sweep), **L108** (grow tagged fills out to the stencil stroke)
  - *Wing BONES (long, hard sub-arc):* **L100** (radial-framework attempt — wrong), **L101** (extract from the stencil, never invent), **L103–L104** (membrane COMPARTMENTS; "uncoloured = bone"), **L109** (ingest the human-tagged bone shapes; render as solid slabs), **L114** (over-correction → wiggly threads; smooth the spine, always re-compare before presenting), **L115** (keep the EXACT tagged 2D shape — 3D step is only thicken+taper, never re-derive), **L116** ("reads thick" has TWO knobs: z-thickness + in-plane stroke-halo; erode toward the crisp core)
  - *Accuracy + labeling TOOLS:* **L93** (`traceCheck` overlay-on-art), **L94** (`traceAlign` registration), **L95** (`traceSuper` scale-matched overlay), **L102** (`celestialWingPaint`), **L105–L107** (`celestialBoneEditor`: delete/add/bridge/fill-bone/fill-membrane/vein + sealed-green check + zoom)
  - *3D EXTRUSION / previewer (`tools/celestial3D.html`):* **L96** (loft body + extrude), **L97** (dorsoventral wingbeat), **L98** (trident branch + membrane billow), **L99** (surfacing v1: armour scales), **L112** (surfacing v2: fresnel rim-glow)
  - *TRACING ROBUSTNESS / gotchas:* **L110** (skeleton fragmentation + threshold fragility → the fix kit: `morphClose` close-before-thin, `weldChains`, region-based capture, numeric `skeletonStats` QA — all in `lineTrace.mjs`)
- **Earlier arcs (read the HANDOFF + roadmap below for these):**
  - *Creature hull / "organism" tech* — body+wings as one skinned hull, weld kernel, shader relief: **L23–L32** + `UNIFIED_HULL_PLAN.md`
  - *Wing FLAP / motion feel* — the `## Lesson — Wing flap…` blocks (search "Wing flap"); apex/yoke/5-phase envelope
  - *Silhouette feedback loop & sculpting* — the `## Lesson —` blocks around the tracer/silhouette mirror
  - *DOCTRINE* — "A PART IS A MULTI-MODULE ARTICULATED ASSEMBLY" (search that heading)

---

## ▶ HANDOFF — read this FIRST to pick up where the last session left off

You are a fresh session continuing **Dragon Drift** (the `reforged/` rewrite). Read this
file top-to-bottom: **this HANDOFF** (where we are) → the **Active roadmap** (the next big
build) → **THE RULE** + the **lessons ledger L1–L32** (how we work + everything learned so
far). Then continue — and **append a lesson after every meaningful change**.

> ## ⚠️ CURRENT FRONTIER (2026-06-18) — read L23–L32 + `UNIFIED_HULL_PLAN.md` + the plan handoff
> The live work is now the **creature-modeling HULL arc** (PR **#119**, branch
> `claude/kind-cannon-49650o`), NOT the shop work described in the (older) state-of-the-world below.
> We built a clean-sheet organism creature **`obsidian2`** — body+wings as ONE continuous skinned hull
> with the connection **solved by construction** (zero-gap shared-vertex weld). After many look passes
> the human **ABANDONED that body** (it still reads metallic — the cause is GEOMETRY: loft longitudinal
> facets = "rings", + a separate-mesh body↔membrane seam — NOT material; see **L32**). **NEXT: a FRESH
> body+wings on the SAME infrastructure** (keep the weld kernel / shader relief / matte-finish kit /
> gates; throw away the `DRAKE_PROFILE` body + loft banding + the separate-mesh seam) → smooth
> nose-to-tail (longitudinal spline resample) + ONE continuous surface (shared seam normals) + fingers
> to every scallop. THEN the roadmap: Phase C (tail/neck/head grown from the hull → bat-membrane tail
> fins → vertical body-whip), THEN the BLUEPRINT layer (grammar/validation/surfaceLayers/CREATURES.md/
> roster migration — the AI-promptability payoff). The full handoff is in `L32` below.

### Where we are (state of the world)
- **Live work:** PR **#107**, branch `claude/game-graphics-review-q22iuh`. Deployed preview:
  `https://colin87-sys.github.io/dragon-drift/pr-preview/pr-107/` (the root `index.html`
  redirects to the `reforged/` build, which is the real game now). **The human judges ALL
  visuals on that preview — there is no WebGL in CI** (the Chromium CDN is blocked by the
  network policy), so headless tools (`tricount`, `run-all`) are the only automated checks;
  everything visual is human-verified on the PR. Commit + push to the branch → the preview
  auto-rebuilds; respond to its `<github-webhook-activity>` events.
- **What just shipped — the SHOP/MENU is now a "real-world hero scene".** The shop renders
  the **real game environment** (the tuned sky + shader-water + god-rays + post-FX pipeline)
  behind a transparent HUD — *exactly what the start screen already does* — with the
  inspected dragon swapped in on browse, a **static** hero camera, and the loose gameplay FX
  (collectible rings + the dragon's flight trail) hidden for a clean shot. It is **fully
  decoupled from the run** (no player teleport, no obstacle culling, no render-gate hacks),
  so the long "walls vanish / embers leak / crash-pose freeze / no-UI" bug parade is dead at
  the root. **Read L9 and L10 below — they are the hard-won core of this.**
- **Key shop files (`reforged/js/`):** `ui.js` (shop opens the real env behind a transparent
  `.shop-screen`; `wireHeroSelect` browse → `handlers.onPreviewDragon` swaps only the
  dragon; the `atShop()` flag = `lastScreen==='shop' && screen visible`), `main.js` (the
  `hideShopFx = ui.atShop() && game.state !== 'playing'` FX hide — **the `!== 'playing'`
  guard is the seatbelt that makes it structurally impossible to hide a wall mid-run** — and
  the `atShop` static-camera flag), `cameraController.js` (`shopMode` static framing),
  `dragon.js` (`setDragonFxVisible`), `rings.js` (`setRingsVisible`). The old inspect-modal
  (`preview.js` DragonShowcase + `showcaseBackdrop.js`) still exists but is no longer the
  shop's main view; `menuStage.js` (a hand-rolled fake backdrop) was tried and **deleted**
  (see L10 — reuse the real engine, don't reinvent it).

### Open items / next steps (in priority order)
0. **▶ THE FRONTIER — UNIFY THE CREATURE INTO ONE GENERATED SKINNED HULL (do this next).** The shoulder
   bridge (L20) + body-skin (L21) + root-weld (L22) all FAILED on the preview — the broad wing still
   gaps off the body on the up-beat and collides on the down-beat, because the wing and body are two
   SEPARATE surfaces with no shared vertex. Human-confirmed fix: **generate Obsidian's body+wings as ONE
   continuous skinned hull** (the wing grows out of the loft, one weight field, no seam), then extend the
   same kernel to neck/tail/head → the L1/L14 "one hull, no bolted parts" end state. **Read
   `UNIFIED_HULL_PLAN.md` (repo root) + L23 below — the full design + the first concrete increment.** It
   MUST stay PROCEDURAL (generated from the blueprint, never hand-sculpted) so AI-prompted diversity
   survives — this is the original "declarative organism" thesis realized in geometry. Scaffolding it
   supersedes: PR **#115** (bridge) merged, PR **#116** (Pass-2 body-flex) open — both kept registered for
   rollback; retire from Obsidian only after the hull is preview-approved.
1. **Confirm the walls hold** on the latest build (pause→shop→swap→resume; crash→shop→
   restart) — that was the last thing the user was verifying.
2. **Astral biome for the shop (DEFERRED, do carefully):** the user likes the cosmos/astral
   biome for the menu. The naive "feed the env the astral distance" approach **displaces the
   biome props** (they recycle *forward* past the player and the recycler never pulls them
   back) — that was a real wall-class regression. The clean fix is a **colour-only biome
   override inside `environment.js`**: decouple the palette distance (`computeEnv` /
   `updateEnvironment` ~line 429) from the prop-recycling distance (`recycleBand`). Caveats:
   it gives an astral *sky* over the *real biome's* props, and the **paused** shop freezes
   the env (its render gate `if (game.state !== 'paused')` is skipped). Theme via COLOUR,
   never via world displacement.
3. **Pop / composition** tuning for the hero shot (rim separation per dragon, framing so the
   stats panel never covers the body).
4. **THE BIG ONE — the Creature Modeling roadmap below.** This is the next major frontier and
   was the original north-star before the shop detour. **LIVE NOW:** building the remaining
   pillars **on the hero (Obsidian) first, migration LAST** (user directive — see the roadmap's
   SEQUENCING note). **Shipped to master:** roadmap **#3 Model-detail LOD/ULTRA tier** (L11, PR
   #108 — HIGH = no regression `== 89460`, ULTRA ≈2×, AUTO by tier, `MODEL DETAIL` Settings row;
   ULTRA preview sign-off ✅). **Also shipped to master:** roadmap **#2 `shingle()` generator**
   (L13, PR #110 — merged) — Obsidian flank plates + Eternal shoulder mantle, one draw call/run,
   HIGH 5816 ≤6000. **Synthesis:** **L14** ties #3 + #2 into the layered-hull architecture (one
   skinned hull + declarative, detail-scaled, draw-call-merged layers over the surface contract).
   **In progress:** roadmap **#4a `sweepProfile` cross-section resample** (L15, NEW PR) — `sweptLoft`
   rounds Obsidian's body octagon→13-gon at ULTRA (5816→**12050 ≤13000**), **byte-identical at HIGH**.
   **Next:** #4b spline-centreline BENDING (necks/tails), then #1 migrate the roster.

### The one law that took ~20 rounds to learn (don't relearn it)
**A menu is the real game world, reframed + frozen — never a mutated or reinvented one.**
Reuse the rendering pipeline (it's tuned + on-brand + free); decouple **STATE** (never modify
the run / obstacles / player), not **RENDERING**; touch only the *subject* (the dragon). Any
"hide gameplay element for the menu" MUST be `.visible`-only and hard-gated by
`game.state !== 'playing'` so it can never affect a live run.

---

## 🗺 Active roadmap — Creature Modeling ("Organism" tech): current state + what remains

> **The wing-seam "organism" FOUNDATION is already built and proven on the hero.** What
> remains is rolling it across the roster + a detail/ULTRA tier + a couple of un-built
> pillars. (An older written plan proposed building `modelDetail`/`dragonSurface`/`skinDeform`/
> `creatureShader` from scratch — that plan is **STALE**: the seam fix actually shipped via
> curved/skinned membrane *recipes* + the surface-shader system instead. Trust the code +
> the L1–L8 lessons below, not that plan.)

### Already DONE (the foundation — see L1–L8)
- **The wing seam is fixed by construction.** `dragonParts.js#buildCurvedPatch` builds a smooth
  **double-curved** membrane (spanwise arc + chordwise billow). Wing recipes coexist via the
  registry (`dragonRecipe.js`): `'membrane'` (legacy flat, the fallback), `'curvedMembrane'`
  (curved patch), **`'skinnedMembrane'`** (ONE continuous `SkinnedMesh` on shoulder→elbow→wrist
  bones — the deep organism fix, no crease), `'feather'`, `'none'`.
- **Proven on the hero:** **Obsidian** already runs `parts: { wings: 'skinnedMembrane',
  surface: { shader: ['cellularScales','iridescence'] } }` (`dragons.js:208`) — seamless skinned
  wing + procedural surface detail, in budget, rig contract intact. Phase-0/1 of the old plan
  is effectively done.
- **Surface shader system** (`dragonSurfaceShader.js`, L4): composable `onBeforeCompile` patches
  (`fresnelRimPatch`/`cellularScales`/`iridescence`/`membraneSSS`) via `composeSurface`.
- **Flap-as-data** (`dragonWingFlap.js`, L5), **recipe/registry + attach contract**
  (`dragonRecipe.js`), per-form feel (L7). Rig contract frozen (below).

### What REMAINS (the actual next work)
> **SEQUENCING (user directive, 2026-06):** do EVERYTHING ELSE on the hero (Obsidian) first
> and get human sign-off on the preview; **the roster migration (#1) is the LAST step**, not
> the first — the L8 law restated. So the working order is now **#3 → #2 → #4 → then #1.**

3. **Model-detail LOD / ULTRA tier — ✅ BUILT + proven on the hero (pending human preview
   sign-off).** `modelDetail.js` is the `seg()` segment-multiplier system (LOW/HIGH/ULTRA;
   HIGH ×1.0 = byte-identical to before). Low-level geometry is detail-aware across
   `dragonParts` (`wingStrut`/`bone`/`featherGeo`/layered-fin seam), `dragonWings` (the skinned
   membrane grid + ribs + shoulder), `dragonModel`, `dragonTorso`, `dragonDraconicHead`,
   `dragonTail`. Threaded via `buildDragonModel(def,{detail})` + `createDragon`→`setActiveDetail`;
   AUTO-resolves from the render tier (`tier0→ULTRA, 1→HIGH, 2→LOW`, monotone — never raises
   under low FPS); `MODEL DETAIL` Settings seg-row (AUTO/HIGH/ULTRA); 4s-sustained,
   never-mid-flight rebuild gate; `modelDetail` save setting (deep-merge default, no migration).
   Verified: `tricount --detail=high` == **89460** (no regression), LOW 60414, ULTRA 155538,
   hero Eternal **5696→11316 (~2×)**, 0 over budget at every level; `tests/modeldetail.mjs`
   green. **STILL TODO here:** the torso-loft 8-pt cross-section is NOT detail-aware (needs a
   *spline resample* to round, not a linear subdivide — deferred); a posed/ULTRA `tiershots`
   to diff smoothness headlessly. The human must confirm ULTRA reads better on the preview.
2. **`shingle()` generator — ✅ SHIPPED to master (PR #110, L13).**
   `dragonShingle.js` lays overlapping cupped cards along a parametric run and merges them to ONE
   mesh (one draw call, the `mergeGeometries` + in-place-bake pattern). Opt-in via
   `def.parts.shingle` (a flank-style band: `count` per-form array, `zRange`, size, `cup`, `tilt`,
   `yLift`, `edge`), resolved by `buildShingleRun` in `dragonModel.js`; non-declaring dragons are
   byte-identical. Born detail-aware (card tess + `count` read `seg()`). Obsidian gets
   **flank plates (Radiant+) + an Eternal shoulder mantle** — dark cupped plates with a faint cyan
   edge that joins `spineMats` (rim + Night-Surge flare), placed OFF the dorsal crest so the smooth
   back + chevron line stays the read (apex-dramatic ramp 0/0/10/14 flank + 8 mantle). Needed a
   small additive `attach.halfWidthAt(z)` + `bodyMidY` on the ARROW torso for flank placement.
   Verified: HIGH Eternal 5696→**5816 ≤6000**, ULTRA →**11980 ≤13000**, roster +160 tris;
   `tests/shingle.mjs` green. See **L13**. The human judges the relief/material on the preview.
4. **`sweepProfile()` (spline-swept bodies/necks/tails/horns) — ✅ 4a (cross-section resample, L15) +
   4b (skinned swept TAIL reusing the rig coil, L16) BUILT on Obsidian; free-bending spline-centreline
   (serpentine bodies) remains.** Generalizes the torso loft so
   future creatures animate by *bending a curve*, not rotating segments — the path to many non-dragon
   creatures from one technique. **4a** (`dragonSweep.js#sweepProfile`) already makes the body loft
   detail-aware: it resamples the cross-section as a closed Catmull-Rom at `seg()` (octagon→13-gon at
   ULTRA, byte-identical at HIGH), discharging L11's deferred torso-resample debt. Coexists as the
   `sweptLoft` torso (additive `geoFn` default on `buildTorso` + opt-in `parts.torso`), so only the
   hero rounds; the roster is untouched until migration. **4b** swaps the straight z-axis centreline
   for a Catmull-Rom curve + `computeFrenetFrames` so the section sweeps along a bendable spine.
1. **Migrate the roster (LAST — the L8 "perfect-hero → mechanize" payoff).** Only Obsidian is on
   `skinnedMembrane` + surface shaders; the other membrane dragons (azure/ember/jade/pearl/solar)
   still default to the flat `'membrane'` (`dragonRecipe.js:64`). Roll each onto `curvedMembrane`/
   `skinnedMembrane` (keeping its `wingSpec` silhouette) + opt-in surface shaders, with
   `'membrane'` as the per-dragon fallback until proven. Write the "Obsidian → any dragon"
   migration checklist as a ledger artifact so the rollout is mechanical, not re-derived. (The
   detail tier from #3 rides along for free — HIGH unchanged, ULTRA a ~2× bump per dragon.)
   NOTE: `skinnedwing.mjs`/`smoke.mjs` currently use **azure** as the non-skinned proof — when
   azure migrates, repoint that to force `parts:{wings:'membrane'}` on a clone instead.

### Frozen rig contract (do NOT break — every wing builder obeys it)
Return `{ group, parts: { wingPivotL/R, wingTipL/R, wingPivot2L/R, tipMarkerL/R }, wingMat,
spineMats }` with `wingTip` a child of `wingPivot`. `dragon.js` writes `wingPivot*.rotation`
(flap) + `wingTip*.rotation` (wrist fold ±0.28 rad); `tipMarker*` is read for trail spawn. New
handles are additive + nullable (the `'none'` builder is the template). Never rename/restructure.

### Verification (all in `reforged/`)
`node tools/tricount.mjs` (per-form budget 6000; roster ≈ 89k tris, 0 over); `tests/run-all.mjs`
+ `tests/skinnedwing.mjs` + `tests/smoke.mjs` green (zero console errors + the rig still
animates). The **human** judges seam-gone folds, silhouette parity, cupping/iridescence on the
PR preview — headless tools can't see motion or folded-pose seams. **Detail tier (#3, built):**
`tricount --detail=high --max=6000 --ci` (== the shipped roster, the no-regression baseline),
`--detail=low --max=6000 --ci`, and `--detail=ultra --ci` (ULTRA is idle-GPU-only so it gets
its OWN higher ceiling, 13000 — it cannot fit the 6000 *mobile* budget once HIGH is near it) all
exit 0; `tests/modeldetail.mjs` green. AUTO maps `tier2→LOW` and is monotone (never *raises*
under sustained low FPS).

### Strategy + risks
Coexist → prove on a hero → migrate (done for the hero — now mechanize the roster). Risks:
rig-contract drift (keep `'membrane'` as the untouched fallback until each dragon is proven);
tri budget / draw calls (`tricount --ci`; `mergeGeometries` from `../lib/utils/
BufferGeometryUtils.js` for same-material detail); rebuild thrash (4s gate, menus/death only);
save compat for the detail setting (`modelDetail` deep-merge default, no migration).

---

## THE RULE (do this every time)

1. **Read this file first.** It is the accumulated state of the art for this repo.
2. **After every meaningful change, append a ledger entry — and don't stop at the
   lesson. Interrogate it.** A recorded lesson is dead weight; the leapfrog only
   happens when you *brainstorm what it means for the future*. Every entry MUST answer:
   what did we learn → **how do we systematize the problem and the solution** → **what
   does this unlock / what's the next innovation it points to.** No forward-looking
   reflection = no leapfrog. (See the entry template below.)
3. **Build systems, not one-offs.** If a fix can become a reusable, tested,
   documented system, make it one. The next creature/feature should be *cheaper and
   better* than the last. If it can't be expressed as a system, it isn't done.
4. **Coexist → prove on a hero → migrate.** Never break the shipped roster. New tech
   ships as a new registered builder, is proven on one creature, then rolled out.
5. **Verify before you claim.** Run the headless tests + `tricount`; render with
   `tiershots` (real-WebGL compile check); the *human* judges motion/feel on the PR
   preview — our headless tools can't see animation or folded-pose seams.

### Ledger entry template (copy this for every entry)

```
### L# — <short title>
**Did / learned:** what we changed and the concrete lesson/gotcha.
**→ Systematize:** how the PROBLEM generalises (where else does it lurk?) and how the
  SOLUTION becomes a reusable system/pattern/test — so this class of bug/feature is
  solved once, forever.
**→ Leapfrog (innovate):** what this unlocks. The next idea it points to, the bigger
  capability it makes cheap, the thing we should now attempt *because* of this lesson.
```

The `→ Leapfrog` line is the whole point: it is where one session hands the next a
*running start* instead of a transcript.

## How we work (durable principles)

- **Puppet → organism.** Don't build creatures as separate visible pieces rotating
  on pivots that independently guess where to go — they collide/overlap/poke through.
  Derive *everything* (surface, bones, veins, edge glow, motion) from **one rig**.
- **Procedural & asset-free.** 100% code, vanilla Three.js r160, no build step, no
  texture/model files. Must hold **60fps on weak mobile** (3-tier adaptive system).
- **The rig contract is sacred.** `dragon.js` destructures specific handles
  (`wingPivotL/R, wingTipL/R, tipMarkerL/R, head, tailSegs, …`) and writes only
  `.rotation` on them + reads `tipMarker` world position. New handles are **additive
  and nullable** (the `none`-wings module is the template). Never rename/restructure.
- **Data over code.** A creature's character should be a *blueprint* it declares
  (parts, surfaces, shaders, flap profile), resolved by shared builders — not bespoke
  code. Migrating/adding creatures then approaches zero new code.

## The creature framework (current architecture, all in `reforged/js/`)

The compounding seam is the **recipe/registry + attach contract**: declare data →
resolve via a registry → one generic builder consumes it.

- **Recipe/blueprint** — `dragonRecipe.js` (`registerTorso/Wings/Head/Tail`,
  `resolveRecipe` infers a legacy blueprint from old flags so the roster is
  byte-identical). `dragonModel.js` orchestrates + dispatches via the registry.
- **Surface shader system** — `dragonSurfaceShader.js`: composable, asset-free
  MeshStandard patches (`fresnelRimPatch`, `cellularScales`, `iridescence`,
  `membraneSSS`) stacked via `composeSurface` (ONE `onBeforeCompile`, ONE merged
  `customProgramCacheKey`). `surface.js`'s rim delegates to it. Opt in per dragon via
  `parts.surface.shader`.
- **Curved membrane primitive** — `dragonParts.js#buildCurvedPatch`: smooth (span×
  chord) grid resampled from a wing outline; spanwise arc + chordwise billow + smooth
  normals. Replaces flat bent sheets.
- **Skinned continuous wing** — `dragonWings.js` `skinnedMembrane` recipe: ONE
  continuous `SkinnedMesh` on a **shoulder→elbow→wrist** bone skeleton; the rig
  handles ARE the bones. Surface ribs (leading edge, finger veins, trailing glow) are
  *sampled from the membrane surface* and skinned to the same skeleton → they bend
  with it, no poke-through. `buildSkinnedRibs` + `skinnedTube` + `spanSkin` weights.
- **Flap animation system** — `dragonWingFlap.js#flapWing`: phase-lagged
  shoulder→elbow→wrist cascade (the whip) + anatomical angle limits, **data-driven**
  by `model.flapProfile`. Driven from both the live rig (`dragon.js`) and the shop
  preview (`dragonModel.js#makePreviewTick`).
- **Adaptive quality** — `main.js applyQuality` + a 3-tier system; `tricount` budgets.

## Verification playbook

- `node reforged/tests/run-all.mjs` — full headless suite (uses `tools/three-resolver`
  + a DOM shim to build geometry with no renderer).
- `node reforged/tools/tricount.mjs [--ci] [--max=N]` — per-form triangle budget
  (ceiling 6000). Surface tubes are pricey — downsample centrelines.
- `node reforged/tools/tiershots.mjs <dragon>` — renders to `/tmp/tier-<d>.png`; logs
  `PAGEERROR` → the real-WebGL compile/skinning check. Rest pose only.
- `node reforged/tests/smoke.mjs` — boots the game in a browser, asserts zero console
  errors + the rig animates (default dragon = azure, non-skinned).
- **The human verifies motion + folded-pose seams on the PR preview** — we cannot.

## Feel knobs (wing motion → personality)

- **Beat speed** (`flapBias`/`flapSpeed`): faster = light/nimble/small; slower =
  majestic/massive.
- **Beat amplitude** (`flapAmp`): bigger = powerful/effortful; smaller = effortless glide.
- **Whip / lag** (`flapProfile.lagElbow/lagWrist/elbowAmp`): MORE lag = alive, elastic,
  weighty (sells *mass*); LESS = stiff/mechanical. *The lag is what sells weight.*
- **Per-form strength** (`model.formLevel` 0..3): scale flap strength so a Hatchling
  feels weaker than an Eternal.

## Map (key files)

`reforged/js/`: `dragonRecipe.js` `dragonModel.js` `dragonWings.js` `dragonWingFlap.js`
`dragonParts.js` `dragonSurfaceShader.js` `surface.js` `dragon.js` (rig — frozen)
`dragons.js` (roster + blueprints) `ascension.js` (forms/tiers).
`reforged/tests/`: `skinnedwing.mjs` `curvedpatch.mjs` `surfaceshader.mjs` `smoke.mjs`.
`reforged/tools/`: `tricount.mjs` `tiershots.mjs` `three-resolver.mjs`.
Plan: `/root/.claude/plans/spicy-bouncing-pond.md` (the capability ladder).

---

# Lessons ledger (append newest at the bottom)

### L1 — Wings: derive everything from one rig, or it pokes through
**Did / learned:** Wings built as separate pieces (membrane panels + rigid bone rods +
edge ribs) rotating on pivots collide — straight rods poke through a folding membrane
("spokes"), panels overlap. Fix the technique, don't camouflage it (the Phoenix only
*hid* the same hinge under feathers). Make the wing ONE continuous surface and derive
the bones/veins/rim *from that surface* + skin them to the same skeleton.
**→ Systematize:** the general law is **"one source of truth per coordinated part."**
Anything that must stay registered to a deforming surface (scales, fins, frills, armour
plates, spikes, runes, attached FX) should be *generated from that surface and bound to
the same rig*, never authored in a parallel space. Make a reusable "decorate a surface"
helper (sample grid + offset normal + copy skin weights) — we already have `skinnedTube`;
generalise it to `skinnedDecal`/`shingleOnSurface`.
**→ Leapfrog:** if every add-on is surface-derived, a creature's *entire* look becomes
layers over one skinned hull → the Shingle system (scales=feathers=plates) and the
Phoenix's feathers-as-a-layer fall out for free, and "torn/wet/armoured" variants are
just different surface layers. This is the path to many creatures from one hull.

### L2 — SkinnedMesh in Three.js, the gotchas that bit us
**Did / learned:** (a) make the **rig handles the bones** so the existing `.rotation`
writes drive the skin on the GPU at ~0 CPU with no rig-contract change; (b) **bind in
local space** (assemble on a mount at origin → `updateMatrixWorld` → `bind` → *then* set
`mount.position`; baking the world offset in double-applies it); (c) multiple
`SkinnedMesh`es can **share one `Skeleton`**; (d) `frustumCulled = false`; (e) keep to a
few bones (mobile uniform/bone-texture limits).
**→ Systematize:** wrap this into a `buildSkinnedRig(bones, meshes)` helper so nobody
re-derives the bind dance — the gotchas become impossible to hit. A creature then says
"here are my bones + skinned parts" and binding/limits/culling are handled.
**→ Leapfrog:** with skinning trivial, the whole creature (body + neck + tail + limbs)
can be ONE skinned hull on a procedural skeleton — retiring the CPU pivot/segment loops
in `dragon.js` and unlocking high-poly bodies that animate free on the GPU (the Deform
rung). Also opens `AnimationMixer` clips and physics-driven bones later.

### L3 — Procedural grids: never clamp columns onto a seam
**Did / learned:** clamping out-of-panel grid columns onto one x made **zero-area
(degenerate) triangles** → NaN normals → shading spikes. Distribute columns across each
panel's real span (`spanStart/spanEnd`). Guarded by a no-degenerate-triangle test.
**→ Systematize:** "degenerate geometry = silent corruption" is a *class* of bug. Add a
reusable `assertCleanGeometry(geo)` (no zero-area tris, finite normals, weights sum to 1)
and run it in every geometry test — every future procedural mesh is validated by default.
**→ Leapfrog:** a trustworthy geometry validator lets us push *much* more aggressive
procedural generation (subdivision, marching-cubes blobs, parametric horns/frills)
without fear — the validator catches the corruption class for us, so we can be bold.

### L4 — Shader patches must compose, not overwrite
**Did / learned:** `onBeforeCompile` is a single slot; the original rim overwrote it +
hard-set the cache key, so nothing could stack. `composeSurface` chains all patches into
ONE `onBeforeCompile` + ONE merged `customProgramCacheKey`.
**→ Systematize:** the pattern is **"composable injectors over a shared extension
point."** Same shape applies to vertex deformers (`composeDeform`), post-fx, and any
GLSL we splice — build them all as `{key, pars, body, uniforms}` descriptors so they
compose by construction and cache-key correctly.
**→ Leapfrog:** a library of stackable patches → looks become *combinatorial* (P patches
= 2^P appearances) at ~zero authoring cost. Iridescent + scaled + subsurface + frost +
ember are mix-and-match per blueprint → huge visual variety from a tiny patch set.

### L5 — Motion is data: the whip = phase-lagged cascade + limits
**Did / learned:** a uniform sine on every joint looks mechanical; real wings cascade
(shoulder leads → elbow → wrist trails = the whip). Built `flapWing` as a reusable,
`flapProfile`-driven animator (lag/amp/limits per joint). Feel: **lag sells weight, speed
sells size, amplitude sells power.** Per-form `strength` scales the beat (Hatchling weak →
Eternal strong). Drive from BOTH the live rig and `makePreviewTick`.
**→ Systematize:** generalise "phase-lagged cascade along a bone chain" beyond wings —
it's the same engine for tails, necks, tongues, tentacles, antennae. One
`driveChain(bones, phase, profile)` animates any articulated appendage; named profiles
(`nimble`/`heavyDragon`/`glider`/`birdLike`) become a shared vocabulary.
**→ Leapfrog:** motion-as-data means a creature's *personality* is a blueprint field.
Per-dragon + per-form profiles give 16 dragons distinct "feels" for free, and the player
*feels* mass/agility from the rear camera — character differentiation at zero code cost.
Next: a `creatureMotionProfile` covering all appendages, then physics/wind response.

### L6 — Verification: tools see geometry, only the human sees motion
**Did / learned:** headless tests + `tricount` + `tiershots` (no `PAGEERROR` = compiles
in real WebGL) catch build/compile/budget regressions and *rest-pose* silhouette — but
**cannot** show animation or fold artifacts. Every "still see the spokes" round was a
folded-pose artifact invisible to our tools. Surface tubes are tri-heavy (we blew the
6000 ceiling — downsample + re-check).
**→ Systematize:** close the gap — add a `posedshot` tool that renders the dragon at a
few *forced* flap/fold phases (drive the rig to fixed poses, screenshot) so folded-pose
artifacts become catchable headlessly. Turn the manual human-in-the-loop into an
automated regression net for the class of bug that kept recurring.
**→ Leapfrog:** automated posed renders → a visual diff harness → we can refactor the
wing/motion systems fearlessly and catch regressions before the human ever sees them,
collapsing the slow "ship → human spots it → fix" loop that cost us several rounds.

### L7 — Per-form feel + the studio identity
**Did / learned:** scaled wing-beat `strength` by the stamped `model.formLevel` (0..3) so
a Hatchling flaps weaker than an Eternal — growth you *feel*, not just see. Studio named
**Leapfrog Studios** (`leapfrog^leapfrog`); this ledger is its core ritual. Critical
refinement to the ritual: **a lesson without a "systematize + innovate" reflection isn't
leapfrogging** — hence the `→ Systematize` / `→ Leapfrog` fields now mandatory above.
**→ Systematize:** "scale a trait by a normalized life-stage factor" generalises — body
mass, voice/SFX pitch, FX intensity, even AI aggression can all read `formLevel`. Make a
shared `formCurve(model, lo, hi)` so every per-form ramp is declared, not hand-coded.
**→ Leapfrog:** if form is a single normalized driver, an entire creature can *grow* on
one parameter — proportions, motion, colour, FX, sound all keyed to it. Ascension becomes
a felt arc (frail whelp → titan), and new creatures get the whole growth story for free.

### L8 — Differentiation must be WIDE and multi-cue; perfect the hero before migrating
**Did / learned:** the first per-form scale (strength 0.68→1.0) was too subtle — Hatchling
and Eternal "felt the same." A *felt* difference needs a **wide gap** AND **multiple
complementary cues**: widened strength to 0.42→1.0 *and* added speed 1.18→1.0, so a
Hatchling reads fast-but-feeble (frantic baby) and an Eternal slow-but-powerful (titan).
One subtle lever is invisible; two opposed cues over a wide range sell it. Process call
(user): **get ALL the graphical/modeling work perfect on the ONE hero (Obsidian) first,
THEN write the migration rules** — don't roll half-tuned tech across 16 dragons.
**→ Systematize:** (1) make a reusable `formCurve(model, lo, hi)` and prefer a *visible*
range — when a value is felt, default to a bold spread and let tuning pull it back, not
the reverse. (2) Codify "perfect-the-hero → extract a written migration checklist → roll
out" as the standard rollout: the hero IS the spec; migration becomes mechanical rule-
following, not re-derivation. The migration rules themselves become a ledger artifact.
**→ Leapfrog:** a written "Obsidian → any dragon" migration checklist (which recipe keys
to set, which model fields, how to pick a flap profile, what to verify) turns roster-wide
rollout into a near-zero-thought batch — and is the template for migrating *every* future
system (surface, shingle, deform) hero-first. Perfecting one creature fully then
mechanizing the spread is the fastest safe path to a whole polished roster.

### L9 — The shop preview is a SECOND render context; own its fidelity separately
**Did / learned:** the inspect showcase looked flat/ugly for three compounding reasons,
all about render *context*, not the model: (1) the preview cameras rendered **layer 0
only**, so every plasma sprite (core glow, aura, halos) — authored on **layer 1** to sit
out of the in-game water reflection — was **invisible in the shop**. A sprite's layer is
a *per-context* decision; adding a new camera (preview/minimap/reflection) means
auditing which layers it should see. (2) No post-processing → emissive eyes/edges never
*glowed*. (3) The always-on-top **aim-marker** crystal (a chase-cam HUD aid) rendered as
an ugly nub on the snout when the showcase faced the dragon. Then the *first* fix
over-corrected: strong bloom **stacked** with additive corona + floor + a bright stage
centre → the dragon became a **silhouette against a white sun**. Bloom is multiplicative
over additive sprites; keep the stage DARK + front-light the hero, bloom is a
high-threshold *accent*, never base brightness.
**→ Systematize:** treat **preview vs gameplay as a first-class fidelity seam**. The
`opts.preview` flag on `buildDragonModel` already gates preview-only choices (drop the
aim marker, tame the corona) — lean on it: the shop is an isolated scene/renderer, so
spend there (bloom, lit glow, a themed backdrop) with **zero gameplay-budget cost** and
**strip** anything that exists only for gameplay readability. The new
`showcaseBackdrop.js` (themed sky gradient + drifting motes + vignette, coloured by the
dragon's aura) is a reusable "hero on a stage" system — any unlock/celebration/victory
surface can reuse it. Rule of thumb: **bright additive + bloom = washout**; dark stage +
front key light + high-threshold bloom = the hero pops.
**→ Leapfrog:** with a context-aware fidelity seam + a themed-backdrop system, the shop
can chase AAA gacha quality (character-select stages per biome, particles, post,
dramatic lighting) while gameplay stays lean — the two contexts evolve independently.
Next: theme the backdrop by the dragon's **biome** (the world we fly through, not just
its aura), add foreground depth motes, and a **hero camera angle** (¾-front) so the face
greets the player — then this becomes the template for every "admire your unlock" moment.

### L10 — A menu is the real world, reframed — never a reinvented one
**Did / learned:** the shop/menu cost ~20 rounds because of two opposite mistakes. First
I reused the gameplay scene but **mutated the run** to make it menu-like — ~35 "menuMode"
hacks (teleport the player into a biome, toggle obstacle/ring/ember visibility, override
the render gate). That entanglement *was* the bug parade: walls vanished, embers leaked,
the dragon froze in its crash pose, the player desynced. Then I over-corrected by **hand-
rolling a separate "menu engine"** (a crude sky shader + box "pillars" + a bare Reflector)
— which looked amateur, because it was a worse reinvention of an engine that's already
beautiful. What finally worked: render the **REAL environment pipeline** (the tuned sky +
shader water + god-rays + fog + post-FX) for the shop — *exactly what the start screen
already does* — overlay the HUD, and swap **only the dragon mesh** (`rebuildDragon`). The
bugs were never from reusing the scene; they were from mutating the *run state*. The
ugliness was never from "a separate engine"; it was from reinventing the renderer.
**→ Systematize:** the law is **"menu = the real game world, reframed + frozen, never
mutated."** For any showcase, REUSE the actual render pipeline (it's tuned, on-brand,
free) and overlay UI; the only thing you touch is the *subject* (the dragon), never the
world/run state. The decoupling that matters is **STATE** (don't modify the run), not
**RENDERING** (do reuse the engine). And reserve "invent" for the differentiating layer
(look/feel/composition); never re-derive the plumbing you already have.
**→ Leapfrog:** with "menu = reframed real world" locked, EVERY admire-your-unlock surface
(shop, ascension/unlock celebration, victory, character-select) reuses the one tuned
environment + a static hero camera + a swappable subject — near-zero new render code,
guaranteed beauty. Next: a data-driven per-surface camera/biome theme (e.g. force the
astral biome for the shop) and a clean "freeze the world" helper for the paused-mid-run
case — both pure additions over a foundation that can no longer break gameplay.

### L11 — Model-detail LOD: one segment multiplier, gated by the no-regression contract
**Did / learned:** built the geometry **detail tier** (roadmap #3) and proved it on the
hero. The whole system is ONE idea: a `seg(base)` picker (`modelDetail.js`) that scales a
segment count by a process-wide active level — **HIGH ×1.0 returns the base UNCHANGED**, so
turning it on is a guaranteed no-op until LOW/ULTRA is chosen. Every geometry helper just
wraps its segment literal: `new ConeGeometry(r, h, seg(4))`. No per-mesh rewrite, no new
draw calls (tris only — the GPU is idle, JS is the bottleneck). Wired it through `buildDragon
Model(def,{detail})` (explicit) + `createDragon`→`setActiveDetail` (the live rig sets it for
dragon **and** rider), AUTO-resolves from the render tier (`tier0→ULTRA, 1→HIGH, 2→LOW`,
monotone so it **never raises under low FPS**), a `MODEL DETAIL` Settings seg-row (AUTO/HIGH/
ULTRA), and a **4s-sustained, never-mid-flight rebuild gate** (the L10 `state!=='playing'`
seatbelt again — a rebuild swaps the whole mesh, so only off the chase camera). Gotchas that
bit / were avoided: (1) two part files (`dragonTail`/`dragonDraconicHead`) already had a LOCAL
`seg` — import the picker **aliased** (`seg as lod`) or **rename the local** (`seg`→`segs`),
or you shadow/redeclare it; (2) a build with no `opts.detail` **inherits** the ambient active
level (correct, but a test that builds ULTRA then asserts a no-opts build == HIGH fails — pin
the level first); (3) ULTRA can't honour the 6000 *mobile* ceiling — it's an idle-GPU-only
level, so it gets its **own** higher budget (13000). Verified headless: HIGH == the historical
**89460** roster total (byte-identical), LOW 60414 (−32%), ULTRA 155538, hero Obsidian Eternal
**5696→11316 (~2×)**, 0 over its ceiling at every level; rig contract (skinned bones) holds at
LOW/HIGH/ULTRA. **The human judges the actual ULTRA smoothness on the preview** — tools see
tri-counts, not whether the rounder body/wing reads better.
**→ Systematize:** the reusable pattern is **"a scalar that defaults to identity, threaded by
one shared picker, gated by a no-regression contract."** It generalises past geometry: the
same `seg()`/active-level shape fits a `tessU()` for the torso-loft cross-section (the one big
piece NOT yet detail-aware — its 8-pt ring needs a *spline resample* to actually round, not a
linear subdivide, so it was deliberately deferred), particle-pool sizes, shadow map res, even
shingle/feather COUNTS. Rule that made it safe: **make the default a literal passthrough and
prove it with a byte-identical baseline number** (`tricount --detail=high == 89460`) before
trusting any of the scaled paths. And the **alias-or-rename** discipline for a shared helper
name (`seg`) is now a known gotcha for any future cross-cutting util.
**→ Leapfrog (innovate):** detail is now a FREE dimension the later creature systems are born
into — the shingle generator (#2) and `sweepProfile` (#4) read `seg()` from day one, so scale/
plate/feather density and spline-loft resolution scale per device with zero extra work, and
the eventual roster migration (#1) carries the detail tier for the whole roster automatically
(HIGH = each dragon unchanged, ULTRA = each gets the same ~2× idle-GPU bump the hero just got).
The next concrete win is the **torso-loft spline resample** (round the 8-sided body at ULTRA) +
a **posed/ULTRA `tiershots`** so we can finally diff "smoother on high-end" headlessly instead
of waiting on the human. This is the rung that makes "more creature on capable hardware" a
declarative knob, not a rebuild.

### L12 — Reskin only what's WIRED; a pivot leaves dead code that lies to you
**Did / learned:** Phase 3 was warming the leftover **cool-blue 2D UI chrome** (Pilot, shop
2D chrome, quests) to the shipped warm ember system (`--rf-*` tokens + the `.gx-card`
gilded-glass language + `.btn-*`/`.seg-btn` already on master). Settings turned out to be
**already 100% warm** (don't re-skin what's done — grep the tokens first). The trap: I
swept `style.css` for cool-blue selectors and warmed *all* of them — including the entire
`.inspect-*` / `.form-btn` / `.ins-*` / `.form-scrub` / `.stat-bar` blocks. But the
biome-pivot (L10) had **deleted the inspect showcase's entry point**: `openInspect()` is
still ~200 lines in `ui.js` but is **never called**, and `.inspect-btn` is no longer
rendered — so that CSS is **dead**. I'd spent a dozen edits styling code that never paints.
Caught only because the human asked "wasn't inspect removed?". Fix: `git checkout` the file
and re-apply **only the live edits** (the diff dropped from ~38 churned lines to a clean 19,
all live). **A grep of a stylesheet tells you what *exists*, not what's *reachable*.**
**→ Systematize:** before reskinning a class, confirm it's live — `grep -rn "class-name"
js/` and check the creator isn't itself dead (here: the classes existed only inside the
never-called `openInspect`). Verify against the *freshly-synced master* (this branch's old
shop-stage PR #103 was obsoleted by the pivot and hard-reset away first). Ship per-screen
commits, each with a headless screenshot over the **real biome backdrop** (warm chrome must
stay legible on the cool astral scene), re-stamping the SW each time. And **keep rarity/brand
accents** (`--haccent`/`--hrar`/`--accent`/`data-rarity`) — only neutralize *generic* cool
chrome; the rarity ladder (R green / SR blue / SSR purple / SSSR gold) is intentional.
**→ Leapfrog:** the warm system is now the single source for ALL chrome — new screens
inherit `--rf-*` + `.gx-card` + `.btn-*`/`.seg-btn` and are warm by default. **Open debt:**
the dead inspect showcase (`openInspect` + `.inspect-*`/`.form-btn`/`.ins-*`/`.form-scrub`/
`.stat-bar` CSS) should be deleted in a dedicated dead-code-removal pass — left in place this
session by choice, recorded here so a future session removes it deliberately.

### L13 — Shingle: a surface decorator is a parametric run baked + merged to one draw call
**Did / learned:** built roadmap #2, the `shingle()` generator (`dragonShingle.js`) — overlapping
cupped cards (scales/plates/feathers), proven on Obsidian as flank plates + an Eternal shoulder
mantle. The architecture that made it cheap + reusable: **(1) a placement-agnostic generator** that
takes a parametric run — `at(t,row)`/`normalAt(t,row)`/`tangentAt(t,row)` closures + size/cup/tilt
— and **bakes each card's transform IN PLACE** (`geo.rotateX` / `applyQuaternion(setFromRotation
Matrix(makeBasis(X,N,T)))` / `translate`) then `mergeGeometries` → **ONE mesh, ONE draw call**
(the env-prop pattern, not `applyMatrix4` per-card meshes). **(2) Policy lives in the orchestrator**
(`buildShingleRun` in `dragonModel.js` owns palette + per-form `count` + the body-following
closures); the module hard-codes no colours and is pure geometry — same policy/mechanism split as
`composeSurface`/`buildSurfacePatches`. Gotchas avoided: a tapering card must keep a **non-zero tip
width** or the apex quads go degenerate (L3 again); compute normals **once on the merged geometry**
(per-card recompute is wasted + seam-inconsistent); `mergeGeometries` returns **null on mismatched
attribute sets**, so a run must be homogeneous (assert non-null). Flank placement needed a body
**half-width** the attach contract didn't expose — added `attach.halfWidthAt(z)` + `bodyMidY` as a
**nullable, additive** extension (a torso without them just can't carry flank runs), exactly the
"new handles are additive + nullable" rig-contract discipline. Budget held by construction: cheap
1×1 cards (2 tris) × a `seg()`-scaled per-form count → Eternal +120 tris HIGH (5816 ≤6000), the
apex-dramatic ramp keeping Hatchling/Kindled at 0.
**→ Systematize:** the reusable law is **"surface decoration = (parametric run) × (a cheap card)
baked + merged."** ANY registered band — dorsal spines, belly scutes, frills, rune plates, the
Phoenix's feathers — is now the same call with different `at/normalAt` + a different card shape;
the only new code per creature is a declarative `parts.shingle` spec. Promote the run closures to a
small library of body paths (`dorsalPath`/`flankPath`/`limbPath`) over the torso's `keelTopAt`/
`halfWidthAt`, and the card to a shape menu (scale/feather/plate/fin) — then "scaly vs feathered vs
plated" is two enum picks, not new geometry code. Carry the **null-merge** + **non-zero-tip** +
**merge-once-normals** rules into a shared `mergeCards()` helper so the whole class is solved once.
**→ Leapfrog (innovate):** with decoration unified as runs-of-cards over the torso's surface
contract, a creature's *entire skin* becomes declarative layers (the L1 "everything derived from one
hull" vision realized for add-ons): torn/wet/armoured/mossy variants are just different card shapes
+ densities over the same paths, and the roster migration (#1) can hand each dragon a tasteful
`parts.shingle` for ~free. Next: skin the cards to the same bones as `skinnedMembrane` (so plates on
a wing/limb bend with it — `skinnedTube` already proves surface-sampled skinning), and add a
`shapeMenu` so #4's `sweepProfile` bodies get scaled by the same system the moment they exist.

### L14 — The convergence: a creature = one hull + declarative, detail-scaled, draw-call-merged layers over a surface contract
**Did / learned:** two pillars shipped back-to-back on the hero — the detail tier (L11) and the
shingle decorator (L13) — and stepping back they are not separate features but two layers of the
ONE architecture L1/L4 predicted. The synthesis: **a creature = one skinned hull (membrane/loft)
+ a growing `attach` SURFACE CONTRACT + declarative layers over it** (surface shaders
`composeSurface`, geometric `shingle` runs, soon `sweepProfile` bodies) — **every layer
detail-scaled by `seg()` and merged to one draw call.** Three cross-cutting *disciplines* emerged
that make adding such a layer fearless: (1) **identity-default + baseline-number gating** (L11) — a
new axis defaults to a provable no-op — byte-identical to the pre-feature `tricount` baseline (L11
pinned `--detail=high` at 89460; a shipped feature then moves it by exactly its delta, +160 for
shingle → 89620) — so it can touch the whole roster safely; (2) **additive + nullable contract extension** (L13's `halfWidthAt`/`bodyMidY`, the
frozen-rig-contract rule) — grow the surface API without breaking any body that doesn't read it;
(3) **merge-to-one-draw-call / spend-tris-not-draw-calls** — the GPU is idle, JS+draw calls are the
bottleneck. And the ORDER was itself the leapfrog: building detail (#3) *before* shingle (#2) meant
shingle was *born* detail-aware for free — each rung is inherited by the next.
**→ Systematize:** the studio's universal shape is now **dumb primitive ← smart resolver ←
declarative blueprint** (`shingle`←`buildShingleRun`←`parts.shingle`, mirroring
`composeSurface`←`buildSurfacePatches`←`parts.surface`, and the recipe registry). Everything
reusable lives at one of three layers: the **surface contract** (`attach`: `keelTopAt`/
`halfWidthAt`/`wingRoot`/`bodyMidY` — the universal adapter every layer queries), a **body-path
library** to promote next (`dorsalPath`/`flankPath`/`limbPath` over that contract), and a
**card/shape menu** (scale/feather/plate/fin). With those three, a new look is *data*: pick a path
+ a shape + a density and it is automatically detail-scaled and draw-call-merged. The safety
disciplines (identity-default baseline gate; additive-nullable extension; merge-once-normals /
null-merge guards from L13) are the standing rules that keep roster-wide change a no-op until
opted in — codify them in shared helpers (`seg()` exists; add `mergeCards()`).
**→ Leapfrog (innovate):** the three layers converge on the L1 dream — *a creature's entire look is
layers over one hull*. Two moves complete it: **(a) skin the decoration cards to the same bones as
`skinnedMembrane`** (the `skinnedTube` weight-copy already proves surface-sampled skinning) →
plates/scales that *ripple with motion*, unifying "decoration" and "deformation"; **(b)
`sweepProfile()` (#4)**, which simultaneously discharges L11's deferred torso-resample debt (round
the body by resampling the swept curve at `seg()` res, not subdividing the 8-gon) *and* opens
spline bodies → non-dragon creatures (manta/serpent/insect) become a different profile + different
paths + different cards. After those, the **roster migration (#1) is pure declarative payoff** —
each dragon gets wings + surface + shingle + sweep blueprints at ~zero new code, carrying the
detail tier for free. The process cadence that produced this is itself the reusable system:
**perfect the hero → pin taste-forks with the human up front → extract a written migration
checklist → mechanize the spread.**

### L15 — sweepProfile: round a section by resampling the CURVE, not subdividing the polygon
**Did / learned:** built roadmap **#4a** — the `sweepProfile()` primitive (`dragonSweep.js`) + a
coexisting **`sweptLoft`** torso, proven on Obsidian. The body loft was a hard OCTAGON (an 8-pt ring
connected by flat quads) that no number of extra stations could smooth, because the facets are
AROUND the section, not along it. `sweepProfile` treats each cross-section as a **closed centripetal
Catmull-Rom** and **resamples it at `seg()`** — a resample of the smooth curve, NOT a linear
subdivide of the polygon (the exact distinction L11 named when it deferred this). The
identity-default discipline held the no-regression line: `resampleRing` returns the control polygon
UNCHANGED when `m === controlCount` (HIGH), so HIGH is byte-identical (`tricount` total **89620**
unchanged, Obsidian Eternal **5816 == 5816**); ULTRA rounds octagon→**13-gon** (+70 tris, **12050 ≤
13000**); LOW coarsens to a pentagon. Coexist used the L13/L14 **additive + nullable** move: a
`geoFn = buildTorsoGeometry` default param on `buildTorso` (shipped path unchanged) + a new
registered `sweptLoft` builder; only Obsidian opts in via `parts.torso`, the rest of the roster is
byte-identical at every tier. Gotchas: **(1) byte-identical is a Float32 claim, not Float64** — a
test comparing stored positions (`Float32BufferAttribute`) to control points recomputed in JS
(Float64) at a 1e-12 tol FAILS on ~1e-7 representation noise; compare within float32 (or against the
legacy geometry), and lean on the **tri-count baseline** as the real contract (`tricount` +
full-model `sweptLoft == arrow` at HIGH). **(2)** a closed `CatmullRomCurve3` puts control point *i*
at `t = i/N`, so sample at `i/m` for `i ∈ [0, m)` to walk the loop once — `getPoints(m)` returns
`m+1` points incl. a duplicated seam. **(3)** the loft is cheap (~112 tris HIGH); rounding it is a
tiny spend — the payoff is silhouette smoothness on the idle GPU, not triangles.
**→ Systematize:** the reusable law is **"to add resolution to a curved form, resample the
underlying CURVE at `seg()` with an identity passthrough at the control count — never subdivide the
sampled polygon."** Same shape fits the keel/spine line, horn/tail profiles, any control-polygon
geometry; promote `resampleRing(polygon, m)` into the shared toolkit beside `seg()`. The coexist
recipe is now boilerplate worth naming: **additive nullable param (defaulting to the shipped
builder) + a new registered variant + a per-dragon opt-in key** → the roster is provably untouched
and the hero proves the new path; verify with the tri-count baseline, not vertex equality.
**→ Leapfrog (innovate):** the straight z-axis centreline is the degenerate case. Swap the
per-station z for a **`CatmullRomCurve3` centreline + `computeFrenetFrames`** (both already in
three) and the SAME primitive sweeps the section along a BENT, animatable spine — **#4b**:
necks/tails/horns that animate by *bending a curve*, and the road to non-dragon creatures (a manta /
serpent / insect = a different profile + a different centreline). Then longitudinal resampling (more
rings along the curve at ULTRA) rounds the body lengthwise too. And the roster migration (#1) can
flip every `arrow`/`serpent` dragon to `sweptLoft` for a free ULTRA round-up (HIGH unchanged) — the
hero→roster mechanization L8 prescribes. **Watch in 4b:** `computeFrenetFrames` picks an arbitrary
initial normal, so a straight centreline could rotate/swap the section's axes vs today — pin the
initial frame (binormal=+x, normal=+y) to keep the straight case byte-identical.

### L16 — Skinned swept tube: reuse the EXISTING rig transforms as bones, don't re-rig
**Did / learned:** built roadmap #4b — a continuous skinned tail tube (`dragonSweep.js#skinnedTube`)
replacing the 7 overlapping frustums, proven on Obsidian as a Night Fury tail. The key insight: the
tail's 7 segments were ALREADY a tuned travelling-wave coil driven by `dragon.js`; rather than author
a new bone rig + animator (as the wing did with `wingRig`/`flapWing`), I made the 7 EXISTING segment
transforms the skeleton's bones (`Group`→`Bone`, a drop-in `Object3D`) and skinned ONE tube to them by
z-proximity (2-bone blend). So `dragon.js` is UNCHANGED — its coil writes the same `.position`/
`.rotation`, now bending a seamless surface instead of rigid frustums; the tip-FX read (`segs[last]`)
still works. Coexist via an additive `swept` flag on `buildCleanTail` (default = the byte-identical
frustum path) + a new `'sweptTail'` recipe; only Obsidian opts in. Gotchas: (1) bind in LOCAL space
(build at origin → `updateMatrixWorld` → `bind` → the recipe positions the group after) — L2 again;
(2) a `SkinnedMesh` skeleton accepts any `Object3D` as a bone (`Bone` is a labelled `Object3D`), so
reusing rig handles is free; (3) headless skinning IS testable — `applyBoneTransform` + a
MAX-displacement scan over all verts proves a bone rotation deforms the mesh (don't sample ONE vertex
— it's only weighted to its 2 nearest bones, so you'll miss the bone you rotated); (4) a new skinned
part broke an over-broad wing test asserting "every skinned mesh is 3-bone" — scope such invariants to
the part (name the tube, exclude it): the L12 "verify against the real wired structure" rule.
**→ Systematize:** the reusable law — **to make a rigged segmented part continuous, skin ONE surface
to the part's existing transforms-as-bones; never re-author the motion.** The cheapest "puppet →
organism" upgrade (L1), applies to any segment chain (neck spheres, body plates, antennae).
`skinnedTube(centreline, radii, rings, skinAt, mat)` is now a shared primitive beside `sweepProfile`;
the weight fn (arc/z-proximity 2-bone blend) is the general pattern. The coexist recipe (additive flag
defaulting to the shipped path + a new registered variant + per-dragon opt-in) now serves torso
(`sweptLoft`) AND tail (`sweptTail`) — boilerplate.
**→ Leapfrog (innovate):** a skinned tube on a bone chain IS a serpentine body — so an eel/serpent/
wyrm is `skinnedTube` along a longer chain driven by `driveChain` (L5's phase-lagged cascade), no
per-segment puppet. The roster's tails migrate onto `sweptTail` for free (continuous coils). And the
bend reads in-motion from the chase cam — the 4a ROI lesson: **spend detail where the camera + motion
show it** (the tail, not the cross-section). Process lesson: a reference-driven hero redesign (Obsidian
→ Toothless Night Fury) runs best as SEQUENCED preview-judged passes (tail → colour → wings →
proportions) — headless tools verify the engineering; only the human judges the look, so ship each pass
coexisting + reversible.

### L17 — Matte-ifying a dragon: mute emissives + ZERO the glow-geometry counts (colour is data, glow is sometimes geometry)
**Did / learned:** pass 2 of Obsidian → Toothless — recoloured the cyan stealth-drake to a matte black
Night Fury (acid-green eyes, blue plasma reserved for the Night-Surge moment). Mostly a pure def-data
edit (per-form + base `colors`), BUT the "cyan look" was not only colour: the dorsal/tail chevron LINES
(`dorsalGlowCount`/`tailGlowSegs`) and `wingVeins`/`glowSeams`/`wingEdgeGlow` are GEOMETRY toggles —
zeroing them removed real meshes (Obsidian Eternal HIGH 4898→4258), so a "recolour" can move the tri
budget. Kept the procedural surface sheen (`cellularScales`/`iridescence`) so the black reads as scales,
not a flat silhouette — muting EMISSIVE accents ≠ darkening the base/sheen. Reserved the accent hue for
the transient state (`surgeHi`/`fever*` stay cool-blue plasma) so cruise reads pure black but Surge
still flares. Colour lives per-form AND in the base `colors` (forms override base) — edit both.
**→ Systematize:** a reusable "matte-ify / re-theme" recipe: (1) mute the emissive accent fields
(`*Emissive`, `apexSeam`, `eye`, `coreGlow`, `dorsalHi`, trails, aura) toward the new hue/near-black;
(2) ZERO the glow-GEOMETRY counts + flags (chevron counts, vein/seam/edge bools) and **re-check
`tricount`** — these are meshes, not just colours; (3) KEEP the procedural sheen shaders for form
definition; (4) reserve the old accent for the transient/surge state. This is the template for any
reference-driven recolour or a new colourway of an existing dragon.
**→ Leapfrog (innovate):** with re-theming reduced to a data recipe, ALT COLOURWAYS (skins/variants)
are near-free — a matte/plasma/frost Obsidian is a `colors` swap + a few flags. Combined with the
geometry passes (`sweptLoft`/`sweptTail`/wings), an entire creature identity is declarative data over
shared builders — the L14 "declarative layers over one hull" thesis now extends to PALETTE. Next on the
Night Fury: the wing reshape (broad rounded bat-wings) + compact cat proportions complete the read.

### L18 — Reshaping a creature is mostly DATA + dormant features; texture-pop is light, not hue
**Did / learned:** Night Fury pass 3 (wings + horizontal tail-fins + texture). Reusable findings: (1)
**the wing silhouette is pure DATA** — `wingForms[]` (`tips` = trailing finger-points, `scallop` = the
fanned webs between them, `arc.hump` = elbow peakiness, `lead` = leading-edge roundness) feeds
`buildWingShape`→`buildCurvedPatch`, so a broad fanned bat-wing is a per-form data edit, zero geometry
code. (2) **fin orientation is ONE rotation** — `buildLayeredFin` builds upright (face +Y, span +Y);
`rotation.x = π/2` lays it FLAT/horizontal (aircraft stabilizer) vs the vertical-V splay (`rotation.z`);
the existing `'twinfin'` already pre-rotated its geometry flat — check sibling code before deriving. (3)
**a dormant built-in was waiting** — `model.secondWingPair` (the "Obsidian/Toothless" mini-wings near
the tail base) already existed UNUSED; grepping the system found it, so "add the mini wings" was a flag
flip + pointing it at the dragon's own `wingForm` silhouette (not `DEFAULT_WING`). Search for an existing
feature before building. (4) **gotcha:** `wingSpan` in the def is **dead** (unused by geometry) —
proportions ride `wingScale`/`wingChord`; don't tune a no-op field. Coexist held via **additive +
nullable** model flags (`wingRootScale`, `wingSSS`) defaulting to the shipped value → roster
byte-identical (verified: only Obsidian's tris moved; 0 over budget).
**→ Systematize:** "reshape a creature" is now a recipe — silhouette = `wingForms` data; fin/limb
orientation = the one flat-vs-upright rotation; secondary parts = existing flags
(`secondWingPair`/`hipFins`/`wingtipFins`); size = `wingScale`/`wingChord` (never `wingSpan`); all
per-dragon + additive-nullable so the roster never moves. **Texture-pop WITHOUT colour = light
interaction:** `membraneSSSPatch` on `wingMat` (via `composeSurface`, gated by `model.wingSSS`) makes the
thin black membrane glow faintly at the silhouette when backlit (the Toothless-against-sky read),
layered with the body's `fresnelRim` (edge catch) + `cellularScales` (scale micro-relief) + `iridescence`
(raven oil-slick sheen). Hue stays black; FORM comes from rim/SSS/sheen/relief — bank this patch stack as
the reusable "matte-creature definition" kit.
**→ Leapfrog (innovate):** wings, tail, body, palette, and now LIGHT-RESPONSE are all declarative layers
over shared builders (L14's thesis, complete) — a new creature is data + flags, and "make the black pop"
is a fixed shader kit. The membrane-SSS + rim combo is the default finish for ANY dark/stealth creature.
Next: compact cat-like BODY proportions (the last Night-Fury pass); then this recipe (silhouette data +
flat-fin + secondary flags + SSS kit) is the template for the roster migration and non-dragon creatures.

### L19 — Anatomy tuning: diagnose the READ, fix with additive per-dragon knobs
**Did / learned:** Obsidian → Night Fury anatomy pass (wings/shoulders/mini-wings/tail/rider) driven off a
shop render. The diagnoses are the lesson: (1) **"ribbon wings" = shallow chord + translucency** — chord
is `scaleZ = model.wingChord` over the `buildWingShape` outline, and the membrane also washed PALE because
`wingOpacity` ~0.8 let the bright backdrop show through. Fix = deepen `wingChord` (1.1→1.7) AND raise
opacity (0.82→0.90): a translucent wing reads by its BACKDROP, so a hero against bright sky needs more
opacity to read solid/dark. (2) **"pale thin rod" tail = a lit grey cylinder** — a thin tube catches
specular and reads grey even when near-black; fix = a dedicated **dark MATTE** material (`roughness 0.85,
metalness ~0`) + a fuller taper. (3) **per-dragon shoulder widening without a new profile** = an additive
`model.shoulderWidthScale` that remaps ONLY the shoulder-zone station half-widths inside `buildTorso`
(flows through the loft + `attach.halfWidthAt`), default 1 = byte-identical. (4) **repurpose, don't
proliferate** — the "mini-wings" brief was best served by RETIRING the `secondWingPair` baby-wings and
re-aiming the existing `hipFins` as rear stabilizers (moved back, flattened, darkened): fewer parts,
clearer silhouette, and Obsidian got LIGHTER. (5) **mount points are per-dragon overrides** —
`wingRootOffset` + `riderSocket` as additive `model.*` reads (rider nestles lower/back between the
shoulders). All Obsidian-only + additive-nullable → roster byte-identical, 0 over budget.
**→ Systematize:** the "fix a creature's READ" loop — diagnose from the rendered silhouette (ribbon =
chord/opacity · pale = material/thinness · floppy = wrong part · perched = mount socket) → fix with
**additive per-dragon `model.*` knobs** that default to the shipped value (`shoulderWidthScale`,
`wingRootOffset`, `riderSocket`, per-form `wingChord`/`wingOpacity`). Rules of thumb to bank: a thin dark
form needs a **matte** material (kill specular) to read black; a translucent membrane needs **opacity** to
read solid against a bright scene; **repurpose an existing part** before adding geometry.
`model.shoulderWidthScale` (a station-zone remap in `buildTorso`) is the reusable "widen any region of any
body" lever. **GOTCHA (found the next pass):** widening a region's STATIONS alone *buries* the FIXED
junction geometry that rides the old surface — the wing fairing (`r:0.3, pos.x:0.46`) and the wing-root
mount (`wingRoot.x:0.5`) don't move, so the connection reads THINNER, not thicker. A region-widen MUST
also scale the mount-x + any fairing/mound on that surface by the same factor (fairing `r`/`pos.x` ×
shoulderW, `wingRoot.x` × shoulderW, wing-side shoulder flared by wingRootScale). Rule: **when you scale a
body region, scale everything mounted ON it too, or it sinks inside.**
**→ Leapfrog (innovate):** every silhouette lever is now an additive per-dragon knob over shared builders,
so dialing a creature's anatomy (girth, shoulder mass, mount points, membrane solidity, tail finish) is
pure data tuning — no new code, roster-safe. This completes the "creature = declarative layers + knobs over
one hull" thesis: the roster migration + non-dragon creatures can be SHAPED (not just coloured/decorated)
through data alone. Remaining Night-Fury work is preview-driven value tuning, not engineering.

### L20 — The wing-body JOINT was the last puppet seam; seal it with a skinned bridge sharing the limb's bone
**Did / learned:** Obsidian's wings are a continuous skinned organism, but they bolted onto a RIGID body
at a single pivot with a metallic `armMat` shoulder SPHERE (`dragonWings.js`) — so at rest it read as a
ball-joint over a matte body (material seam), and in motion everything outboard of the pivot swung while
the body + the static torso "fairing" stayed frozen (a hard rotational discontinuity = the "Lego" look the
user saw). The wing obeyed L1 internally but the wing-as-a-whole was still "a separate piece rotating on a
pivot" relative to the body — the LAST puppet joint. Pass 1 fix (`parts.wings:'skinnedMembraneBridge'`,
Obsidian-only): grow a continuous BODY-MATERIAL **shoulder bridge** (a deltoid tube) from the torso flank
to the membrane root, skinned across **[static anchor, shoulder bone]** — the inboard end weighted 100% to a
non-rotating `Bone` at the mount origin (planted on the body), the outboard end 100% to the SAME shoulder
bone the membrane root already uses (follows the wing exactly), smoothstep-blended between. It **subsumes
the metallic sphere**, so the seam is gone at rest, and the joint deforms as ONE surface in motion. Reused
the shared `skinnedTube` (`dragonSweep.js`) + the L2 local-space bind dance (bind before `mount.position.set`);
because the bridge shares the existing shoulder bone, there is **zero new animation and zero rig-contract
change**. Net **−104 tris/form** (removing the sphere over-pays for the tube), roster otherwise byte-identical
(0 over budget HIGH + ULTRA). Gotchas: (1) the over-broad "every skinned mesh is 3-bone" invariant in
`skinnedwing.mjs` broke the instant a 2-bone bridge appeared — **L16 again**; scoped it with a `wingPiece()`
name filter (`!name.startsWith('shoulderBridge')`), same fix shape as the `sweptTailTube` exclusion. (2) The
bridge's outboard ring must COINCIDE with the membrane root, so sample the membrane geometry's column-0 vert
(`i=0` of the `k=i*(SEG_V+1)+j` grid) rather than guessing a position. (3) The body material had to reach the
wings module: published `attach.bodyMatDouble` (the torso's DoubleSide clone, surface shaders included) as a
**nullable/additive** extension of the attach contract — the surface-MATERIAL counterpart to `halfWidthAt`/
`keelTopAt` — so the wings builder reads it off `attach` with no call-signature change.
**→ Systematize:** the reusable law is **"a joint = a short surface skinned across [staticAnchor, theMovingBone],
sampling the moving part's root ring."** ANY place a rigged part meets the body at a pivot (neck↔head,
tail↔hip, future limbs/fins/horns↔body) is the same call with a different root ring + bones — promote a
`buildJointBridge(rootRing, staticBone, movingBone, mat)` beside `skinnedTube`. The two safety disciplines
held: **share the existing animated bone** (no new rig handle, no contract drift), and **scope skinned-mesh
test invariants to the named part** (the 3rd time an over-broad "all skinned meshes are N-bone" assert has
bitten — bake the `wingPiece()`/name-scope into any future skinned-part test). The attach contract is now the
universal adapter for geometry (`wingRoot`/`keelTopAt`/`halfWidthAt`) AND material (`bodyMatDouble`) — any
body-continuous add-on can match the hull exactly by querying it.
**→ Leapfrog (innovate):** this is the on-ramp to Pass 2 (skin the torso's shoulder ZONE so the body itself
bulges — the cross-hierarchy bind) and, past that, to the L1/L14 endgame: once every joint is a skinned
bridge over shared bones, the creature trends toward **ONE continuous skinned hull with no bolted parts** —
"make this joint organic" becomes a declarative recipe flag, not bespoke rigging, and every future appendage
seals to the body for free. **Watch on the preview (headless can't):** the bridge is the FIRST skinned mesh to
wear a `composeSurface` (cellularScales+iridescence) material — confirm the GLSL compiles under the skinning
path (`tiershots obsidian` / the live preview, no `PAGEERROR`), and judge the deltoid's reach/bulge in motion
(the `inboard 0.30 / radii 0.18→0.10` constants are conservative starting points, tuned by eye).

### L21 — Pass 2: skin the BODY to the wing's bones across the scene graph (the cross-hierarchy bind), gated by rest-parity
**Did / learned:** completed the "go all the way" shoulder: made Obsidian's torso a `SkinnedMesh` whose
shoulder-zone verts are weighted to the WING's existing shoulder bones, so the BODY SURFACE ITSELF bulges
with the beat (not just the bridge). The bones live in the wing `mount` (a DIFFERENT subtree from the torso),
so unlike the membrane/bridge (bound in local space, bones in the same group), this is a **cross-hierarchy
WORLD-rest bind**: build the whole model to rest → `group.updateMatrixWorld(true)` → `torso.bind(skeleton,
torso.matrixWorld)` once both torso and wings exist (orchestrated in `dragonModel.js` AFTER `group.scale`).
**Three.js attached bind mode handles this for free** — its per-frame `bindMatrixInverse` recompute from the
mesh's live `matrixWorld` self-corrects for the later model placement/scale, so no `DetachedBindMode` was
needed. A **static root bone** (added to the torso group, never rotated) holds every non-shoulder vertex via
the `[1-wS, wS]` split (index 0 = root). Weights are authored in `buildTorso` (it owns the geometry + the
`wingRoot` incl. PR-113's `shoulderWidthScale`/`wingRootOffset`); the bind is in the orchestrator (only it has
the wing bones) — a clean **author-weights-here / bind-there** split. Pass 2 adds **ZERO triangles** (skin
attributes only; tri-count identical). Safety levers that made it land first try: **(1) cap the weight** (MAXW
0.34) + **smoothstep falloff** (R 0.95) → a bulge, never a tear; **(2) side-gate at the midline** (`_sstep(0.04,
0.22, |x|)`) so the belly/keel is never dragged sideways by one wing; **(3) a rest-parity test is the bind's
correctness oracle** — `applyBoneTransform(i, rest_i) ≈ rest_i` at rest (max Δ < 1e-4) catches a wrong
bind/double-offset INSTANTLY (headless), the thing the eye can't verify. Coexist: a new `sweptLoftSkinned`
torso variant + an additive `opts.skinShoulders` on `buildTorso` (default = the shipped static `Mesh`), so the
roster is byte-identical; only Obsidian opts in. Gotcha (L16 again): the new 3-bone `torsoShoulderSkin` mesh
falls into `skinnedwing.mjs`'s wing-piece scan unless excluded — extended the `wingPiece()` name filter.
**→ Systematize:** the reusable law — **to deform a SHARED mesh by a limb that lives elsewhere in the graph,
bind it in WORLD rest (build → updateMatrixWorld → bind with the live world matrix) to a skeleton of the
existing limb bones + a static root bone; cap + smoothstep + side-gate the weights; prove it with a
rest-parity assertion.** This is the general "make ANY body region follow ANY limb" tool (neck↔jaw, hip↔leg,
body↔tail) without re-rigging — the L20 joint-bridge's heavier sibling for when the body itself must move, not
just a patch over it. Bank the **author-weights-in-the-part / bind-in-the-orchestrator** split and the
**rest-parity oracle** as standing patterns for every cross-hierarchy skin. With L20 (bridge) + L21 (body
skin), the shoulder is now ONE continuous surface that deforms as a unit — the L1/L14 "no bolted parts" ideal
reached at the hardest joint.
**→ Leapfrog (innovate):** the cross-hierarchy bind retires the last reason a creature needed separate rigid
chunks — ANY part can now drive ANY surface, so the **segmented neck/head** (next) becomes a skinned tube the
body flows into, the whole creature trending to ONE hull on a shared skeleton driven by the existing rig (zero
new animation). The author-weights/orchestrator-bind split + rest-parity oracle make each such conversion a
mechanical, provably-safe step. **Judge on the preview (headless can't):** the body's bulge is deliberately
subtle (MAXW 0.34) — confirm it reads as breathing muscle in motion, and tune MAXW/R up if the shoulder should
heave more; confirm the skinned torso (now wearing the `composeSurface` body shader) compiles under skinning
with no `PAGEERROR`.

### L22 — A broad wing swings off the body unless its ROOT BAND is welded to a static anchor (not the flap pivot)
**Did / learned:** after the bridge (L20) + body-skin (L21), the human reported the wings STILL "aren't
connected to the body" — worse on the up-beat (gap) and down-beat (collision). Root cause: PR-113's wings are
now BROAD (deep chord + long `rootChord`), and the whole membrane was weighted at the root to the **shoulder
pivot** (`spanSkin` band 0 = the flap bone), so the entire broad root edge SWINGS with the flap — pivoting off
the body on the up-stroke, into it on the down-stroke. The bridge (a thin tube at one point) can't hold a broad
root edge, and the body-bulge (L21, capped 0.34) is far too subtle to chase a big wing. Fix: make the membrane
a **4-bone chain anchor(0)→shoulder(1)→elbow(2)→wrist(3)** and weld the INNER span band (`rootBand =
elbowXGeo*0.55`) to a **STATIC body anchor** (the bone the bridge already created, never rotated), easing into
the shoulder by the forearm. Now the inner wing stays welded to the body (grows FROM it) while the OUTER wing
keeps the full shoulder→elbow→wrist whip — the motion the human liked is preserved, the swing-gap is gone.
**Key insight:** the root POINT (x=0) is AT the pivot so it never moves regardless of weighting — it's the
membrane just OUTBOARD of the root that swings; anchoring the *band* (not the point) is what holds the broad
edge down. Rest pose is byte-identical (weights only — geometry + tri-count unchanged); the ribs ride the same
`spanSkin` so they weld too. Gotcha: the wing skeleton is now **4-bone** → `skinnedwing.mjs`'s "every wing
piece is 3-bone" + "skinIndex ≤ 2" invariants flip to 4 / ≤3 (the L16 over-broad-invariant tax, paid again).
**→ Systematize:** the law — **a limb's attachment band must be weighted to a STATIC body anchor, not to the
limb's moving root joint, or a wide attachment swings free.** This generalises to any broad-rooted appendage
(fins, frills, a manta's whole body-to-wing patagium): the inner attachment band welds to the body anchor,
easing into the limb's drive bones outboard. Banks alongside L20/L21 as the third shoulder primitive — bridge
(fill the gap) + body-skin (the body follows) + **root-weld (the wing stays rooted)** — and the static "body
anchor at the mount origin" is now the shared hinge all three hang off. The `rootBand` fraction is the one
tuning knob (bigger = more of the wing welded flat to the body).
**→ Leapfrog (innovate):** with the root-weld, "attach a wide membrane to a body" is a solved, declarative
move — the path to manta/ray/flying-squirrel bodies where the wing IS the body edge. Combined with the
cross-hierarchy bind (L21), an entire creature can be ONE skinned hull whose every appendage welds at the root
and drives from shared bones, no bolted parts anywhere. **Judge on the preview (headless can't):** confirm the
up-beat no longer gaps and the down-beat no longer collides; if a broad wing still peels at the very root,
raise `rootBand` (weld more of the inner span flat) — a one-number tune.

### L23 — You can't PATCH two surfaces into one organism; the body and wings must be ONE generated skin (the frontier)
**Did / learned:** L20 (shoulder bridge) + L21 (body-shoulder skin) + L22 (membrane root-weld) were three
attempts to make the broad Night-Fury wing read as CONNECTED to the body — and the human judged ALL THREE
insufficient on the preview: the wing still gaps off the body on the up-beat and collides into it on the
down-beat. The reason, confirmed in code: the wing (a flat translucent membrane mesh) and the body (a round
opaque loft mesh) are **two separate surfaces with no shared vertex**, so nothing FORCES them to stay
coincident — and the patches even fought (L21's body bulge capped 0.34 vs L22's membrane root 1.0 on the *same*
shoulder bone, moving at different rates → pulling the seam apart). **The lesson is a hard law: you cannot patch
two surfaces into one organism. They must BE one surface** — exactly how the wing's separate flapping PANELS
were earlier unified into one skinned membrane (L1). The wing↔body seam is that same problem one level up. The
human reached this independently ("can't we do the joined-skin thing with the wing and the body?"), and crucially
connected it back to the project's FIRST analysis: the "declarative organism blueprint" thesis was right about
the **load-bearing pillar — continuous GEOMETRY**, which the recipe/shader *authoring* layer (rightly built) does
not supply. We had to hit the seam to feel why the continuous-geometry half is the part that matters most.
**→ Systematize:** the fix is a reusable kernel **`growSkinnedExtension(loftBoundaryLoop, patchGrid, boneChain,
junctionSkin)`** — weld a sub-surface's edge to a loft boundary loop into ONE merged skinned geometry with ONE
continuous weight field, where `junctionSkin(t)` is applied to **BOTH sides of the seam** so paired verts get
IDENTICAL weights and can never separate (the regression test: rotate a shoulder, the paired body-edge & wing-root
verts must move to the *same* position — the gate the patches could never pass). Reuse `sweepProfile` (loft) +
`buildCurvedPatch` (wing grid) + `spanSkin` (the wing gradient) + `skinnedTube`; coexist via new recipe variants
(`unifiedHull` wings + a body-less `unifiedHullTorso`), Obsidian-only opt-in, roster byte-identical, fully
reversible by two strings in `dragons.js`. **The non-negotiable discipline: generate the hull PROCEDURALLY from
the blueprint (the `profile` + `wingSpec` data that already vary per dragon), NEVER hand-sculpt it** — hand-
sculpting one mesh per dragon would kill AI-prompted diversity; a generated hull is *more* promptable (describe the
organism's shape, the engine emits a fluid creature). The full design + the first concrete increment (re-seat the
wing root column onto the loft flank, tangential blend, 7-bone `[bodyRoot, shL,elL,wrL, shR,elR,wrR]` skin, vertex
material blend, verification gates, risks) is in **`UNIFIED_HULL_PLAN.md`** at repo root — read it next.
**→ Leapfrog (innovate):** this IS the declarative-organism vision realized in geometry, and it's THE next major
frontier (the roadmap's #1 now). The same `growSkinnedExtension` kernel then retires every remaining bolted/
segmented part: the **neck** (the sphere chain → a forward continuation of the loft skinned to a neck bone chain),
the **tail** (weld the hull's last ring to the `sweptTail` tube), the **head** — converging on the L1/L14 end
state: ONE skinned hull nose-to-tail, every appendage grown from shared seam verts, all driven by the existing rig
(zero new animation). And because it's blueprint-driven, the AI-promptable roster + non-dragon creatures (manta/
serpent where the wing IS the body edge) come along for free. Build it the studio way: prove the body+wing hull on
Obsidian, sign off on the preview, then mechanize the kernel across neck/tail/head and migrate. Retire the L20/L21/
L22 scaffolding from Obsidian only *after* the hull is preview-approved (keep it registered for rollback).
**→ The MISSING ingredient — a FLESHY ARM, not a wire (why the tail already reads continuous and the wing doesn't):**
the human asked the key question — the TAIL connects smoothly to the body, so why not the wing? The numbers answer
it: the tail is a fleshy round TUBE (`baseR 0.27`, `dragonTail.js`) emerging from a body whose rear half-width is
`~0.17–0.29` — **same form, matching radius** — and its base is *locked* (only the tip coils), so it flows out of the
body like a continuation of it. The wing has neither: its only "arm" is a **0.11→0.02-radius WIRE** rib
(`dragonWings.js#buildSkinnedRibs`, the leading edge) and the rest is a flat membrane, hung off a shoulder whose body
half-width is `~0.66–0.8` — so a thin wire + a flat sheet dangle off a fat round mass, with **no fleshy limb bridging
the two forms**. That is *why* welding a flat sheet to a round body never reads as one creature: there's no arm in
between. **So the unified hull must give the wing a FLESHY ARM** — a `skinnedTube` upper-arm/forearm at a radius that
MATCHES the shoulder mass (the exact trick the tail uses), emerging continuously from the body on the
shoulder→elbow→wrist bones, with the **membrane spanned FROM that arm** (and along the body flank), not a bare sheet
pinned at a point. The tail "cheats" (matching fat round form + a non-rotating base); the wing is the hard case
(form-mismatch + a rotating joint), and the fleshy arm is what closes the form gap so the continuous-skin shoulder has
something organic to blend. **Bake into the build: wing = fleshy arm tube (body-matching radius) + membrane spanned
from it, all one skin — a real wing (and like the tail), not a kite frame on a sheet.**

### L24 — Hull and blueprint are ONE bet: the generator's parameters ARE the vocabulary; the motion northstar is a vertical body whip
**Did / learned:** a planning session that re-opened the original "why are AI-prompted creatures still
hard" analysis and reconciled it with our own **L23**. The resolution is a hard reframe: the analyst's
"declarative organism blueprint" and our unified hull are **not competing** — **the hull is a PARAMETRIC
GENERATOR, and the data it consumes (`profile`/`wingSpec`/arm-radius/`junctionSkin`/section/centreline/
`motionProfile`) IS the blueprint.** So you build the generator FIRST and the authoring vocabulary is
just the formalized, validated, documented set of knobs it exposes — sequencing inverts the naive
"schema first": **geometry hull → generalize the generator (vocabulary crystallizes) → formalize the
blueprint layer (grammar/validation/`surfaceLayers`/migration).** Designing a schema ahead of the
geometry = formalizing a Lego system (the seam saga is the proof). The human supplied **reference
imagery** that pinned three things headless tools can't see: **(1)** the wing is a **FLESHY ARM**
continuous with the body (upper-arm+forearm tubes of body-matching radius, membrane spanned from the arm
*and along the flank*), **not** a wire+sheet — confirming the L23 missing ingredient by eye; **(2)** the
acceptance view is the **REAR/¾-rear chase cam IN MOTION**, never a side rest pose; **(3)** the **MOTION
NORTHSTAR** — the whole body **porpoises VERTICALLY as a whip**, tail in counter-phase, synced to and
*powering* the wingbeat ("the weight behind the wings"). The body is **not a rigid plank with hinged
wings**. (The refined 3-phase plan + the reference read are folded into `UNIFIED_HULL_PLAN.md`.)
**→ Systematize:** bank the reframe as a studio law — **"expose the generator's parameters and the
blueprint writes itself; never design a creature schema ahead of the geometry that realizes it."** Every
hull parameter becomes a named, validated, documented vocabulary word; the grammar is **DERIVED** from
the registries + generator params, never hand-maintained (no drift). Bank the verification law too: a
creature's true acceptance gate is the **rear/¾-rear chase cam through a full beat** — add a rear-cam
flapping capture to the preview kit; rest-pose tools (`tricount`/`tiershots`) gate *engineering*, motion
gates *feel*. And the L5 motion-as-data discipline **generalizes from the wing to the WHOLE SPINE**: one
`driveChain` phase-lagged cascade in the *vertical* plane = the body whip, reusing existing rig
transforms as bones (L16), **zero rig-contract change**.
**→ Leapfrog (innovate):** the convergence is now total — **ONE continuous skinned hull on ONE bendable
spine, decorated by declarative `surfaceLayers`, driven by ONE phase-lagged cascade that flaps the wings
AND whips the body, all authored as ONE validated blueprint.** Because that blueprint is literally the
generator's parameter surface, **non-dragon creatures (manta/serpent/insect) + AI-prompted diversity fall
out as different parameter sets**, and the motion "weight" the references demand is a per-dragon
`motionProfile`, not bespoke animation. The next session builds **Phase 1 (the hull on Obsidian)** knowing
the arm must be **fleshy** and that the eventual payoff is the **vertical whip the continuous hull uniquely
enables** — geometry and motion are the same bet.

### L25 — Unified hull Increment 1: weld the seam with SHARED-bone weighting, not coincident geometry — the relationship is what must freeze
**Did / learned:** built Increment 1 of the unified hull (`dragonUnifiedHull.js` + a body-less
`unifiedHullTorso`) — Obsidian's body+wings as ONE continuous procedural skinned organism: TWO skinned
meshes (an opaque body-loft+two-fleshy-arms hull, and the translucent membrane) on ONE shared **7-bone**
skeleton `[bodyRoot, shL,elL,wrL, shR,elR,wrR]`, with the membrane root column re-seated analytically onto
the loft flank + inner columns smoothstep-blended, the root band weighted 100% to a STATIC `bodyRoot`. The
load-bearing realization: **the seam gate is not "make the verts coincident", it is "freeze their
RELATIONSHIP under deformation".** Because BOTH the membrane root verts and the body-loft verts are weighted
to the same static `bodyRoot` bone, NEITHER moves under a shoulder/elbow/wrist rotation — so whatever gap
they have at rest is exactly the gap they have at full beat (gate: `|pairGap − restGap| < 1e-5`, PASSES —
the regression L20/L21/L22 could never pass). They don't need to be at distance 0; they need to be welded to
the same *non-moving* frame. The L23 "fleshy arm" is now real: each arm is a `skinnedTube` tapering from
~the body flank half-width (0.6) at the shoulder to ~0.12 at the wrist, MERGED into the opaque hull, so the
limb bridges the round-body↔flat-membrane form gap. Net tri WIN (one hull replaces torso + 2 bridges + 2
fairings + 2 separate membranes): Obsidian Eternal **3930→3662 HIGH** (≤6000), **8438 ULTRA** (≤13000); the
**rest of the roster is byte-identical** (non-obsidian total 70826 == baseline; `tricount --detail=high`
unchanged for azure/ember/jade/pearl/solar/phoenix/astralWyrm). Real-WebGL compiles clean (`tiershots
obsidian`, no PAGEERROR — the skinned hull + composeSurface body/membrane shaders work under the skinning
path). Gotchas paid: **(1)** rest-parity is the bind oracle AGAIN (L2/L21) — a test that calls `flapWing`
before the rest-parity check must restore ALL THREE driven rotations (shoulder/elbow/wrist x,y,z), not just
the one it asserted, or the un-restored bones displace arm verts by ~2.5 and the gate screams; **(2)**
`buildCurvedPatch` inherently collapses the chord to a POINT at the wingtip → ~6 zero-area tris/wing with two
COINCIDENT verts — benign + pre-existing (the shipped `skinnedMembrane` has them; `curvedpatch.mjs` already
only zero-checks NON-tip panels and finite-normal-checks the tip), so the degenerate scan must flag only
tris whose 3 verts are all DISTINCT yet zero-area (the real L3 fold), never the tip fan; **(3)**
`mergeGeometries` returns null on mismatched attribute SETS (L13) — an `ensureSkinAttrs` that adds
position+normal+skinIndex+skinWeight AND strips stray attrs (color/uv) before merge is the guard;
**(4)** migrating the hero off the old recipes BREAKS every test that built `DRAGONS.obsidian` directly and
asserted the old structure (`skinnedwing`/`torsoshoulder`/`shoulderbridge`/`modeldetail`/`sweptprofile`) —
the L173 discipline is the fix: repoint each to build an obsidian CLONE with `parts` FORCED back onto the old
recipe, keeping the rollback path proven without depending on the live recipe. (Found en route:
`sweptprofile.mjs` was ALREADY red on HEAD — it asserted `torso==='sweptLoft'` while Obsidian shipped
`sweptLoftSkinned`; fixed it the same clone way.) Reversible by two strings in `dragons.js` (old values left
in a rollback comment); L20/L21/L22 builders + tests all still registered + green.
**→ Systematize:** bank the reusable kernel **`growSkinnedExtension(loftGeo, [skinnedExtensions])`** = merge a
base loft with any number of pre-skinned grids/tubes into ONE skinned geometry with a continuous weight field
(each part carries its own skinIndex/skinWeight; `ensureSkinAttrs` makes the merge null-proof). The seam law
generalizes: **to attach a deforming sub-surface to a body so it can never separate, weight BOTH sides of the
junction to the SAME static body bone — coincidence is sufficient but not necessary; shared-static-frame is
the actual invariant, and it's testable headlessly (`|pairGap−restGap|<1e-5` under a bone beat).** The
body-less-torso pattern (`bodyMesh:false` → publish `attach.loft` = the loft recipe `{makeGeo, profile,
stretch, TORSO_Y, keelTopFor, halfWidthFor}` so the hull GROWS the body itself) is the additive-nullable
contract extension (L13/L20) one level deeper: the torso now hands over its *generator*, not just anchor
points. Loud-validate the pairing (`unifiedHull` wings throw an actionable error without a hull torso) so a
mis-wired recipe fails at build, not as an undefined read. And the migrate-the-hero → fix-the-hero-tests
move is now standard: **every "prove the old path" test must build a forced clone, never the live hero**, so
the hero is free to advance.
**→ Leapfrog (innovate):** the kernel is the on-ramp to the rest of the L23/L24 arc — the SAME
`growSkinnedExtension` + shared-static-bone weld now retires the neck (weld the loft's front ring to a neck
bone chain), the tail (weld the hull's last ring to the `sweptTail` first ring), the head → ONE skinned hull
nose-to-tail. And because the body now lives on a `bodyRoot` bone, **Phase 2's vertical body-whip (L24) is
unlocked**: split `bodyRoot` into a short phase-lagged spine chain and `driveChain` (L5) it in the vertical
plane, in counter-phase with the tail — the porpoising "weight behind the wings" the references demand, zero
rig-contract change. The seam-coincidence gate is now the standing regression net for every future weld. The
one thing headless CANNOT judge and the human MUST, on the **rear/¾-rear chase cam through a full beat**: does
the membrane FLOW out of the fleshy arm (not hinge off it), does the root stay welded with no up-beat gap /
down-beat collision, and is the rest-pose flank-weld tight enough (the analytic re-seat leaves a ~0.08–0.43
unit root gap vs the actual loft mesh verts — visually a slight float that may want tightening by snapping
seam verts to nearest loft verts, a preview-judged tune deferred from this increment).
**→ The explicit FORK banked for the next session (human directive):** this increment WELDS the new wing
onto Obsidian's *legacy* arrow-loft body, and the ~0.08–0.43 root gap is the symptom of exactly that — the
analytic flank ≠ the real `bladeRing` loft ring, because the body was designed as a separate part. The
human's standing call (echoing how the wing-segment clash was only ever fixed by a *redesign*, not a patch):
**if the rear-cam preview shows the membrane float/hinge, do NOT keep tuning the weld — pivot to a CLEAN-SHEET
hull.** A purpose-built parametric generator that emits body + fleshy arm + membrane as ONE surface from its
*own* profile (the membrane root verts ARE loft verts → zero gap by construction), Obsidian-opt-in +
reversible, the shipped parts kept registered. The kernel (`growSkinnedExtension`), the fleshy arm, the
seam-coincidence gate, and the re-seat logic ALL carry over; only the legacy-profile coupling is thrown away.
That is the truer L23/L24 endgame (one generated organism) and the cleaner base for non-dragon creatures.

### L26 — Clean-sheet organism hull: COPY the body's vertices, don't sample them — zero gap by construction
**Did / learned:** the L25 fork fired. The human judged v1 on the preview and called it: the weld onto Obsidian's
*legacy* arrow body could never connect (fat manta-arm + the ~0.43 analytic-flank gap + detach-on-bank), because the
body was designed as a separate part — "we're flogging a dead horse." Directive: build a NEW creature on the new
architecture so body/wings/arms (and later neck/head/tail) are generated TOGETHER and connect with no legacy coupling.
Built **Increment 2a** (`dragonOrganism.js` + new creature **`obsidian2`** "Obsidian Shade II", a clone of Obsidian's
identity on `organismTorso`/`organismWings`). The load-bearing realization that finally killed the gap: **don't SAMPLE
the body surface to place the membrane root — COPY the body's actual vertices.** `findSeam` identifies the exact
upper-flank loft verts across the shoulder stations (sweepProfile lays verts as `station*m + ringPos`, so a seam
vert's index is deterministic); `seamPointAt` copies them VERBATIM into the membrane's root column; both the copy and
the original are weighted 100% to the same static `bodyRoot`. Result: **zero gap (gate measures max 0.000 < 1e-6, vs
v1's 0.43) and it holds in motion** (rotate a shoulder → seam stays welded, outboard wing flies). The arm is now a
**slim frame** (0.14→0.05, not v1's 0.55 manta tube) + **3 finger struts** for the scalloped read. Existing roster
**byte-identical** (obsidian still 3378–3662; obsidian2 adds 3594–3878 HIGH, ≤6000); `obsidian` + `dragonUnifiedHull.js`
(v1) **byte-untouched** (rollback intact); `tiershots obsidian2` compiles, no PAGEERROR. Honest limits: body + membrane
are still SEPARATE meshes (opaque/translucent) so the seam is positionally welded but NOT normal-smoothed across the
material boundary (a possible shading edge, not a gap); the seam chain is only ~7 verts/side at HIGH (coarse root edge);
the rear/¾-rear banking-in-motion read is the human's call.
**→ Systematize:** the reusable law — **"to weld a sub-surface to a body so it can never separate, COPY the body's
boundary vertices as the sub-surface's seam ring (don't sample/approximate them) and weight both to the same static
frame."** Sampling = approximation = gap; copying = zero gap by construction. `findSeam`/`seamPointAt` is the reusable
primitive and it generalizes to EVERY appendage (neck/tail/head/fins): grab the hull's boundary-ring verts, copy them
as the appendage root ring, share the weight. And the meta-discipline: **design the body FOR the connection — a fresh
creature on the new architecture beats retrofitting a legacy one** (the L25 dead-horse, paid off).
**→ Leapfrog (innovate):** the zero-gap weld is proven on body↔wing — the SAME copy-the-boundary mechanism now grows
**2b** (neck + head: copy the hull's FRONT ring → neck-tube root, retiring the sphere chain) and **2c** (tail: copy the
hull's REAR ring → tail-tube root) → ONE skinned hull nose-to-tail on one skeleton. **Banked for 2c (human reference,
Toothless): the tail fins must be BAT-MEMBRANE PROJECTIONS — a thin frame + membrane + finger struts (the wing kernel
verbatim), NEVER the old flat "lilypad" spade.** A tail fin IS a small wing, so `growSkinnedExtension` + membrane +
fingers applies directly. Two refinements queued: (a) merge body+membrane into ONE mesh (or share seam normals) so the
junction is shading-continuous, not just position-continuous; (b) a denser body seam for a smoother root edge. The
body-on-a-`bodyRoot`-bone still unlocks the Phase-2 vertical body-whip (split it into a phase-lagged spine chain).

### L27 — Organic body = OWN smooth section (not a copied octagon) + clustered stations; the seam is ONE ring walked across stations, not two rings woven
**Did / learned:** the human flew obsidian2 on the preview and gave four precise reads: the body "reads almost robotic"
(organic wings on a faceted body), the arm is "too thick vertically," the finger struts "appear horizontal" instead of
"in line with the long axis… lined up with the pointy parts of the scallops," and "the middle isn't connected." All four
traced to the v1 organism still leaning on roster shapes. **A. ORGANIC BODY** — `DRAKE_PROFILE` was a near-copy of ARROW
using the shared 8-pt `bladeRing`, so the loft was a hard OCTAGON at HIGH (the L15 "facets are AROUND the section" trap,
this time un-rounded because HIGH `seg(8)===8` is identity). Gave the organism its OWN 16-point super-ellipse drake
section (exponent 2.3 → fuller belly/flanks; max edge-turn 29° vs the octagon's 45°) passed as the profile's `ring`, so
`sweepProfile` lays a 16-gon at HIGH (round) and resamples denser at ULTRA. Re-shaped the longitudinal form to 13
fleshy stations (tapered neck → fore-shoulder → chest/shoulder swell → thorax → belly → haunches → smooth tail taper),
OWN numbers, not ARROW's. **B. SLIM ARM** — killed the deltoid swell (0.14→0.10 socket, 0.05→0.035 wrist, bump 0.55→0.28)
and FLATTENED it vertically: after `skinnedTube` builds the spar, squash each ring's y about its centreline ×0.55 (the
arm is near-planar so the tube's `up`≈+y, making a y-squash a clean blade thin top-to-bottom, wide front-to-back).
**C. FINGERS RADIATE** — rebuilt `buildFingers` to fan struts from the WRIST datum to each `wingSpec.tips[i]` SCALLOP TIP
(mapped tip→group space with the membrane's exact transform: `wx=sx·scaleX`, `z=-sy·scaleZ`, `y=archLift`), lifted just
above the membrane — so each finger lies along the wing toward a scallop point (verified: leading finger tip lands at
x9.28/z-0.97 == the computed tip target). **D. MIDDLE SEAM** — replaced the two-ring weave (upper 7/1 + wide 6/2 across
3 stations, sorted by z → a y-fanning, over-wide-in-z root that lifted the middle) with ONE upper-flank ring index
(`round(N·13/16)`/`round(N·3/16)`) walked across the stations inside the wing-root z-window (`wingRoot.z ± ~rootChord`),
already front→back because stations are z-ordered → a contiguous arc, no zig-zag, the WHOLE chord (front, MIDDLE, back)
on real body verts. Clustered the shoulder stations on `wingRoot.z` so the chain has 6 verts/side (denser root edge).
Verified: HIGH obsidian2 3594/3726/3766/3878 → **3866/4078/4118/4230 (≤6000)**, ULTRA **8566/8980/9236/9696 (≤13000)**;
the existing roster is **byte-identical** (obsidian 3378/3510/3550/3662 unchanged, all others unchanged — only obsidian2
moved, +1328 HIGH total); `obsidian` + `dragonUnifiedHull.js` + `dragons.js` byte-untouched; `tiershots obsidian2`
compiles clean (no PAGEERROR). Strengthened gate "MIDDLE CONNECTED": every membrane root-column vert (not just front/back)
is exact-vert welded (Δ<1e-6), the chord is a real z-span (>0.2), and the root edge does not fan in y (Δy ≤ Δz). All 8
organism gates green; full headless suite green (the only red — badges/stamina/save-purchases — are pre-existing
browser-Playwright tests blocked by the CI Chromium policy, red on the clean tree too).
**→ Systematize:** bank two reusable laws. **(1) For an ORGANIC body, give the creature its OWN smooth section
function (≥~14 control points, super-ellipse-ish) passed as the profile's `ring` — never reuse a low-poly roster ring,
because at HIGH `seg()` is identity so a shared octagon stays an octagon.** The section is now a first-class blueprint
knob (exponent = belly fullness, point count = roundness floor), and longitudinal stations are OWNED per creature
(cluster them where a part attaches so the seam has dense real verts to copy). **(2) A boundary seam for the
copy-the-verts weld (L26) must be ONE ring index walked across the part's stations, NOT multiple rings woven + sorted**
— the single-ring walk is contiguous and monotone by construction (stations are ordered), so the whole attachment chord
maps to a connected body arc with no fan/zig-zag; if the native vert density is too coarse, ADD stations (never
re-introduce analytic sampling — that was the v1 gap). And the **vertical-flatten-a-skinnedTube** trick (squash each
ring's y about its centreline) turns the round-tube primitive into a blade spar for free — reusable for any flattened
limb/fin frame.
**→ Leapfrog (innovate):** the organism now has a genuinely OWN body — round section + fleshy stations + slim flattened
arm + scallop-radiating fingers — so it is the clean base the L26 roadmap wanted: **2b** (copy the loft's FRONT ring →
neck-tube root) and **2c** (copy the REAR ring → `sweptTail`, tail fins as bat-membrane projections = the wing kernel
verbatim) drop onto the SAME copy-the-boundary + single-ring-seam mechanism, converging on ONE skinned hull nose-to-tail.
The section function being a blueprint knob is the on-ramp to **non-dragon creatures** (manta = a flatter wider section
+ a near-zero-chord wing-IS-the-edge; serpent = a near-circular section on a long bent centreline). The remaining
preview-judged tunes (human, rear/¾-rear chase cam in motion): does the rounder body now read as fleshy muscle, is the
slim flattened arm right (or too thin), do the fingers visually align with the scallop notches, and is the wide root
chord (the membrane attaches ALONG ~1.8 units of back) welded with no float — plus the standing 2a debts (merge
body+membrane to one mesh or share seam normals for shading-continuity; the matte black is hard to judge head-on in
`tiershots` — the chase cam is the real oracle).

### L28 — v2 surface shader: real micro-relief via derivative-bump on `normal`, no UVs/tangents — the black hide finally catches light
**Did / learned:** built the long-deferred "v2" of the cellular-scales shader (`cellularScalesNormalPatch`) — the reviewer's "streamroll." v1 only modulated emissive + roughness, so the matte-black body absorbed light and collapsed to a silhouette (nothing caught a highlight). The new patch is a SUPERSET: same object-space Worley field PLUS a **Mikkelsen-style derivative bump** that perturbs the view-space `normal` from the screen-space gradient (`dFdx`/`dFdy`) of a procedural height (raised scale centres, recessed seams) — **no UVs, no tangents, no textures**. Three load-bearing realizations: **(1)** the perturbation rides the EXISTING `composeSurface` body seam (after `<emissivemap_fragment>`), because `normal` there is still the live lighting normal — the v1 patch already mutates `roughnessFactor` at that same seam and it feeds lighting, so no new splice slot was needed. **(2)** SUPERSEDE, don't stack: the v2 patch reuses v1's GLSL helper names (`vSurfPos`/`_scHash`/`_scCell`/`uScaleSize`), so stacking both would redeclare them and fail to compile — Obsidian2 SWAPS `'cellularScales'`→`'cellularScalesNormal'`. **(3)** amplitude is **tier-gated for free** by reading `getActiveDetail().mul` at build time (LOW 0.62× → ULTRA 1.6×) — the shader analogue of `seg()`'s identity-default discipline — and per-dragon via `def.scaleRelief` (default low so the stealth drake stays sleek). Verified: `surfaceshader.mjs` green (composes, distinct cache key `surf:scalesN`, asserts it assigns `normal`); roster **byte-identical** (a shader adds 0 tris — obsidian2 still 3866-4230, only its shader NAME changed; every other dragon untouched); **`tiershots obsidian2` compiles in real WebGL, no PAGEERROR** — the must-pass gate (the Worley loop + derivative bump compile under the skinned-hull program). Gotcha paid: a patch DESCRIPTOR's `uniforms` are RAW values (composeSurface wraps them in `{value}` later), so a test that read `.value` off the descriptor failed — assert the raw number.
**→ Systematize:** the reusable law — **"to add real micro-relief to a procedural-Worley surface, perturb `normal` via screen-space derivatives of a height field (`perturbNormalArb`) at the existing post-`emissivemap` seam; no tangents/UVs, composing through the one-`onBeforeCompile` pipeline."** This is the normal-detail half the surface system always deferred; now ANY scale/feather/plate field gets light-catching relief by name + amplitude. The **tier-gated-amplitude-via-`getActiveDetail()`** pattern generalizes to any shader knob that should scale with the device tier (the shader sibling of `seg()`). And **supersede-don't-stack** (shared GLSL helper names collide) is the standing rule for any v2 patch extending a v1.
**→ Leapfrog (innovate):** the body can now read as living hide, not a flat mechanical mass — which **UNBLOCKS the body reshape (Phase B)**: a sleek silhouette is only judgeable once it catches light (you can't see form in a black void). Roster-wide payoff: Ember/Jade/Pearl get a chunky armoured/feathered hide for ~free via a single `def.scaleRelief` bump. Next: confirm the relief reads on the **rear-cam preview** (headless can't — `tiershots` is flat-lit head-on), tune amplitude, THEN Phase B (sleek body + arm/membrane root-align + wingspan down + finger spars to the scallop tips).

### L29 — Relief needs a MATTE base: normal detail on a glossy/metallic surface reads as polished metal, not hide
**Did / learned:** Phase B step B1. The L28 relief made Obsidian2's black body CATCH light on the preview — but the human judged it reading as a **smooth polished METAL** surface, not living scaled hide. Cause: the shared `bodyMat` is semi-gloss (`roughness 0.38, metalness 0.12`), so the body shows ONE broad mirror highlight that the subtle relief (`scaleRelief 0.3`) couldn't break up — a normal-perturbed surface under a metallic/glossy material reads as wrinkled metal, not skin. Fix: an **additive + nullable per-def body-FINISH override** (`def.bodyRoughness`/`def.bodyMetalness`, applied right after the `bodyMat` construction in `dragonModel.js` — default unchanged, so the roster stays byte-identical) + a stronger `scaleRelief`. Obsidian2 → **matte** (`metalness 0.0, roughness 0.62`) + `scaleRelief 0.5`, so the highlight diffuses and the relief reads as hide. Material-only → **0 tris, roster byte-identical** (obsidian2 unchanged 3866-4230), gates green, `tiershots` compiles. Did NOT touch the shared `bodyMat` defaults (the guardrail) — only the opt-in override.
**→ Systematize:** the law — **"micro-relief needs a matte base to read as texture; pair normal detail with a matte finish or it reads as polished metal (one mirror highlight)."** The additive-nullable **per-def material-finish override** (`bodyRoughness`/`bodyMetalness`, default = shared value) is the reusable hook for any creature's skin finish (matte hide / waxy / wet) without forking the shared `bodyMat` — the material sibling of the per-def colour fields + the opt-in shader name.
**→ Leapfrog (innovate):** matte finish + `scaleRelief` + the v2 normal patch is now the roster-wide **"living hide" kit** — each dragon dials metalness/roughness/relief for its own skin (Ember molten-glossy, Jade matte-scaled, Pearl pearlescent). With the body finally reading organic under light, **B2 (the sleek body reshape) is now judgeable** — that's next, then B3 (wing read).

### L30 — Polished-metal read = ENV REFLECTION + sub-pixel relief, not just gloss; plus B2 sleek reshape
**Did / learned:** B1's matte (L29) STILL read as polished metal on the preview. Two deeper causes the human's shot exposed: **(1)** a dark SMOOTH body REFLECTS the bright sky through the scene environment → reads as wet/polished metal even at `metalness 0` (specular roughness alone doesn't kill it); **(2)** the derivative-bump relief WASHES OUT at chase-cam distance — when the scales shrink below a pixel, `dFdx`/`dFdy` average to flat, so the surface goes smooth again far away (exactly where the player views it). Fixes, all obsidian2-only + additive-nullable: a new **`bodyEnvIntensity`** per-def override → `0.18` (kills the sky reflection); `bodyRoughness 0.82`; **bigger scales** `scaleSize 3.0` (was 5.0, via a new per-def `scaleSize`) so the relief RESOLVES at the gameplay camera; stronger `scaleRelief 0.9`; **dropped `iridescence`** (its oily view-angle hue-sweep read pearlescent/metallic on the dark hide). Bundled **B2** (sleek reshape): slimmed `DRAKE_PROFILE` (shoulder peak 0.64→0.53, a clear WAIST pinch, slimmer girth), `SECTION_N 16→22` (rounder section at HIGH), `wingRoot.y 0.55→0.49` to track the slimmer shoulder. The **zero-gap + middle-connected weld gates SURVIVED the reshape by construction** (the seam copies whatever verts the new loft emits — the payoff of copy-don't-sample). Roster byte-identical (others unchanged; obsidian2 3866→**4010** HIGH from the denser section, ≤6000; **8782** ULTRA ≤13000); `tiershots` compiles.
**→ Systematize:** two reusable laws. **(a)** "a dark smooth body reads as polished metal from ENV REFLECTION, not just specular — drop `envMapIntensity` for a matte hide." **(b)** "screen-space derivative bumps vanish at distance — size a procedural surface feature BIG enough to resolve at the GAMEPLAY camera, or the relief disappears exactly where it's viewed." The per-def **matte-hide finish kit** is now `{bodyMetalness, bodyRoughness, bodyEnvIntensity, scaleSize, scaleRelief}` — additive-nullable, roster-safe, per-creature. And: **a geometry reshape is FREE under a copy-the-boundary weld** — the seam re-derives from the new loft, so silhouette iteration never re-breaks the connection (the gate proves it each time).
**→ Leapfrog (innovate):** env + feature-size + matte should finally land the organic hide read at the chase cam; the sleeker body + resolving relief together are the Toothless read. Next **B3**: drop the arm root onto the membrane-seam line, wingspan down (esp. Eternal), and finger spars fanning to the scallop tips — all judged on the rear-cam preview.

### L31 — Sleek matte Night-Fury = kill glows + non-black ATTACHMENTS + whole-creature shader scale (incl. the SEPARATE tail/head materials) + blue-black hue
**Did / learned:** B3 + the "sleek matte black/blue Toothless" pass on obsidian2, ONE push. Four moves, all obsidian2-only, every other dragon (incl. obsidian v1) byte-identical. **(1) Sleek all-black** — REMOVED obsidian2's `parts.shingle` entirely (the two cupped flank "plate" runs read as the metallic bolt-on attachments the human wanted gone — and removing them DROPS tris: Radiant 4262→4090, Eternal 4374→4122 HIGH); re-coloured `fingerMat` (`dragonOrganism.js`) from tan `def.horn` + cyan emissive + `metalness 0.35` to a near-black matte (`color/emissive = def.body`, `emissiveIntensity 0.04`, `metalness 0`, `roughness 0.85`) so the finger spars read as subtle dark structure, not a lit/metallic skeleton; killed every idle glow — `spineGlow: 0` for ALL forms (the dorsal glow-cone path is `spineGlow>0 && !dorsalGlowCount`, and obsidian2's `dorsalGlowCount:0` is falsy so the cones WOULD build — zeroing spineGlow kills them) and DROPPED `coreGlow` (top-level + per-form) so `dragonModel.js`'s `if (!coreGlow && def.coreGlow)` idle core sprite never builds (safe — `dragon.js` guards `if (coreGlow)`; Surge cyan still comes from `feverWing/feverEye`). **(2) Whole-creature shader scale via the SHADER, not cards** — the v2 `cellularScalesNormal` relief already covers everything wearing `bodyMat`/its `bodyMatDouble` clone: body hull + slim arms (hull), neck spheres (`bodyMat`), AND the head FACE (the draconic skull/snout/jaw all use `c.mats.bodyMat` — VERIFIED, so it's covered; horns/ears use hornMat/scalesMat). The ONE gap was the swept TAIL: `dragonTail.js`'s `stemMat` is a SEPARATE matte material with no shader. Added a gated opt-in (`model.scaleTail` AND `def.parts?.surface?.shader`) that `composeSurface`s the SAME relief (`fresnelRimPatch(apexSeam||eye)` + `buildSurfacePatches(shader, def)`) onto `stemMat` + applies the matte finish kit (`bodyRoughness/bodyMetalness/bodyEnvIntensity`); obsidian2 sets `scaleTail:true`, obsidian v1 does NOT → its tail stem is byte-identical. **(3) Re-hue** to a desaturated dark MIDNIGHT BLUE-BLACK: base + per-form `body/belly/scales/horn` moved into `0x0a0f1c`–`0x16223c` (horn darkened from `0x3a5a78` grey-blue to `0x141d30` so head horns + fingers go dark), eyes kept acid-GREEN (`eye 0x96d62a`/`apexEye 0xb6e85a`), wing-membrane colours untouched. **(4) B3 wing read** — ARM + MEMBRANE FROM ONE LINE: computed the seam BEFORE the bones and anchored each arm's shoulder bone y/z to the seam-chain CENTROID (`armRoot(side)` overrides `attach.wingRoot(side)`'s y/z), so the arm spar + the membrane grow from the same seam line; `wingScale 1.07→0.9` + the per-form `wingForms` outline tips tightened (Eternal leading span 5.50→4.55) so the wingspan reads ~2-2.5× body length, not a sail; re-formed `buildFingers` (THICKER wrist base `0.030→0.050`, FINER tip `0.008→0.0035` with a cubic falloff, LESS lift `0.04→0.018` so the spars hug the membrane toward each scallop tip). Verified: all 11 named gates green (`organism surfaceshader skinnedwing unifiedhull modeldetail curvedpatch sweptail shingle torsoshoulder shoulderbridge sweptprofile`) — crucially the organism ZERO-GAP + MIDDLE-CONNECTED weld SURVIVED the arm-root realign by construction (it copies the same loft verts); `sweptail.mjs` green (obsidian v1 tail untouched); `tricount` shows ONLY obsidian2 moved at HIGH/ULTRA/LOW (every other dragon incl. obsidian v1 byte-identical), obsidian2 HIGH 4010/4090/4090/4122 ≤6000, ULTRA ≤9050 ≤13000; `tiershots obsidian2` + `tiershots obsidian` BOTH compile with NO PAGEERROR (the new tail-relief shader compiles on the UV-less swept SkinnedMesh tube). The only red test is `badges.mjs` — a pre-existing CI-Chromium-blocked browser-Playwright test, red on the clean tree too (confirmed via stash).
**→ Systematize:** bank the reusable law — **a creature-wide "skin" is NOT one material: the body hull, the cloned `bodyMatDouble`, the neck, the head face, AND the tail each wear a (sometimes SEPARATE) material, so a whole-creature shader/finish must REACH EACH ONE — audit them by grepping which mesh uses which `mats.*`, and any not on the shared `bodyMat` (here: the swept tail's `stemMat`) needs the shader composed onto it explicitly.** The gating pattern is now standard: a per-part opt-in flag (`model.scaleTail`) + the `def.parts.surface.shader` presence check makes the reach additive-nullable so the roster (and the v1 sibling that shares the same `sweptTail` builder) stays byte-identical. And **"matte black creature" is a recipe**: kill idle glow GEOMETRY (spineGlow cones) + idle glow SPRITES (coreGlow) at the data layer, re-colour every ATTACHMENT material (fingers/horns) to the body tone so nothing reads as a bolted-on lighter/metallic piece, and let one shader carry the texture. The **arm-root-on-the-seam** move (compute the seam first, anchor the bone to its centroid) generalizes to any appendage that must visually GROW from a body boundary: root its frame on the same boundary verts the membrane/skin copies, so the limb and its web share one line — and the copy-the-boundary weld gate proves the connection still holds.
**→ Leapfrog (innovate):** with the tail now reachable by the surface system, the LAST separate-material island on the organism is closed — the relief/finish is genuinely nose-to-tail, so the "living hide" kit (L29/L30: `{bodyMetalness,bodyRoughness,bodyEnvIntensity,scaleSize,scaleRelief}` + `scaleTail`) is a complete per-creature skin contract ready to migrate to the roster (Ember molten-gloss, Jade matte-scaled). The matte-black-recipe (glow-geometry + glow-sprites + attachment-colour + one shader) is the template for any stealth/void creature. Next, human-judged on the rear/¾-rear chase cam: is the matte black/blue sleek (no metal/glow), does the subtle scale read across the WHOLE creature INCLUDING the tail at distance, is the wingspan now proportional, do the finger spars visually fan into the scallop notches, and does the arm+membrane read as growing from ONE line — plus the standing 2a debt (body+membrane are still separate meshes, so the seam is position-welded but not normal-smoothed across the material boundary). What I could NOT verify headlessly: `tiershots` is flat-lit head-on so it shows the hue + that nothing idles bright, but NOT whether the relief resolves at the gameplay distance or whether the motion reads — those are the chase-cam oracle's.

### L32 — Abandon the obsidian2 body: the "metallic rings" are GEOMETRY (loft facets) + TOPOLOGY (seam), not material; fresh-take the hull
**Did / learned:** after the clean-sheet organism `obsidian2` SOLVED the body↔wing CONNECTION (L26–L31: zero-gap
shared-vertex weld, v2 normal relief, matte-finish kit, sleek reshape, kill-glows, blue-black hue, whole-creature
scale, B3 wing), the human flew it and judged the BODY still reads metallic — "ugly metallic **RINGS** around the
body" — the tail scale ugly, inner finger spars missing their scallops — and called it: **ABANDON the obsidian2
body+wings look; generate a FRESH body+wings on the same infrastructure; the body CANNOT be reused.** The
load-bearing diagnosis is the lesson: we burned ~6 passes chasing "metallic" as a MATERIAL problem (metalness→0,
roughness↑, `envMapIntensity`↓, normal relief, drop iridescence) but it is mostly **GEOMETRY + TOPOLOGY**: **(1) the
"rings" are the loft's LONGITUDINAL FACETS** — `sweepProfile` resamples the cross-section (smooth AROUND) but joins
the 13 stations with flat quad bands (faceted ALONG z) → ring banding that catches light as metal; NO material
tweak removes it (fix: resample the loft LENGTHWISE — the `#4b` spline centreline, L15). **(2) the body↔membrane
shading seam** is the separate-mesh debt (opaque hull + translucent membrane welded by POSITION not NORMALS) — fix:
one continuous surface / shared seam normals. **(3) the ugly tail scale** = object-space Worley tiling oddly on a
thin BOLTED tube — fix: grow the tail as part of the hull. **(4) inner fingers miss the inner scallops** — a finger
to EVERY tip. (Full handoff: the plan file + the CURRENT-FRONTIER callout at the top of this file.)
**→ Systematize:** the standing law — **diagnose MATERIAL vs GEOMETRY/TOPOLOGY before iterating on material; a
lofted-station body inherently BANDS (smooth around, faceted along z) and reads metallic under light — round it
LONGITUDINALLY or it never reads organic.** And the recurring meta-law (L23/L25 a THIRD time): **when patching a
base keeps failing, REGENERATE the base, don't keep patching.** KEEP the infrastructure that works — the
`growSkinnedExtension` copy-the-boundary weld, the `cellularScalesNormalPatch` shader, the per-def matte-hide finish
kit, the translucent membrane, the gates, the coexist discipline — THROW AWAY the specific `DRAKE_PROFILE` body +
the loft banding + the separate-mesh seam.
**→ Leapfrog (innovate):** the FRESH take — a NEW creature on a body **smooth nose-to-tail (longitudinal spline
resample → no rings)** and **ONE continuous surface with the wing (shared seam normals → no shading break)**, fingers
to every scallop. THEN the roadmap holds: **Phase C** — continuous tail grown from the hull rear ring → **bat-membrane
tail FINS** (Toothless twin fins = the wing kernel; NOT the lilypad, banked L26) → **neck + head** grown from the hull
front (retire the sphere chain) → the **vertical body-WHIP** (L24 motion northstar: split the static `bodyRoot` into a
phase-lagged spine chain + `driveChain` in the vertical plane, tail counter-phase, zero rig change). **THEN THE
BLUEPRINT LAYER** (the original L24 thesis, "after the hull" — the AI-promptability payoff): registry-DERIVED
`creatureGrammar.js`; loud `validateCreatureBlueprint()` wired into `run-all`; the imperative decoration blocks
(`dragonModel.js:164–334`) promoted to a declarative **`surfaceLayers`** registry (the shingle run×card pattern,
inferred from legacy flags → roster byte-identical); `CREATURES.md` (the closed grammar + the one rule: author the
blueprint, never the builders); and MIGRATE the roster so the organism path is the default. That blueprint's
vocabulary IS the hull generator's parameters — which is exactly why the hull comes first.

### L33 — The fresh-take hull, Increment 1: a LONGITUDINAL-spline loft kills the "metallic rings" — geometry, not material (verbatim from the new creature `toothless`)
**Did / learned:** started the L32 fresh take with a brand-new creature **`toothless`** ("Night Fury") on a NEW
module `dragonNightFury.js` (FORKED from `dragonOrganism.js`, which stays byte-identical for obsidian2 rollback).
The headline fix is GEOMETRY: the organism body read metallic because `dragonSweep.js#sweepProfile` rounds the
cross-section (smooth AROUND) but joins the stations with **flat quad bands ALONG z** — longitudinal facets that
catch light as rings (L32 #1). Built **`sweepProfileSmooth`**: treat the station sequence as a Catmull-Rom
centreline and **resample to many smooth rings** (`seg(profile.longSamples)`, here 30 from 13 stations), so the
surface is smooth in BOTH directions. A headless gate proves it — the smooth loft's max longitudinal turn along
the top keel line is **3.2° vs the faceted loft's 6.5°** (and it resamples to >stations rings). The fork carried
the proven kernel UNCHANGED (copy-the-boundary zero-gap weld, the 7-bone skeleton, the fleshy flattened arm, the
translucent membrane, the matte-hide finish kit) and added two more L32 items: **(2) shared seam normals** —
after the (already zero-gap) position weld, average the normal at each paired hull/membrane seam vert and write
it into BOTH, so lighting is continuous across the opaque↔translucent boundary (gate: paired normals match
<1e-4); **(4) a finger to EVERY scallop tip** (drop the `<4` cap). The big realization for the seam-finder: the
smooth loft has `longCount` resampled rings, NOT one ring per station, so `findSeam` must walk
`geo.userData.loftRings` (the ring zs the generator stashes), not `profile.stations` — and the denser rings give
a smoother root edge for free. **Phasing the human chose (and a course-correction): NO legacy bolted parts are
ever shown.** The neck/head/tail GROW from the hull boundary rings (copy the front ring → neck, the rear ring →
tail), so the hull must exist first — until then `toothless` wires `head:'none'`/`tail:'none'` (new generic empty
builders) + a new `buildTorso` `opts.neck:false` guard, rendering body+wings ONLY (no draconic head / lilypad
tail). Verified: all 10 `nightfury.mjs` gates green (kernel weld + the 2 new gates) + the full geometry suite
green; `tricount` shows ONLY `toothless` added (2152–2232 HIGH ≤6000, ≤5448 ULTRA ≤13000) — **every other dragon
incl. obsidian/obsidian2 byte-identical**; `tiershots toothless/obsidian/obsidian2` all compile in real WebGL,
no PAGEERROR. The only red headless test is the pre-existing CI-Chromium-blocked browser suite (badges etc.), red
on the clean tree too.
**→ Systematize:** bank the law — **a lofted-station body BANDS along z (smooth around, faceted lengthwise) and
reads metallic; round it LONGITUDINALLY (resample the station centreline as a spline), not just per-section.**
`sweepProfileSmooth` is additive beside `sweepProfile` (the roster keeps the faceted one, byte-identical), and it
stashes `userData.loftRings` so any boundary-copy weld walks the resampled rings. The **"legacy parts OFF until
grown from the hull"** discipline is reusable: generic `none` head/tail builders + an additive-nullable
`opts.neck:false` torso guard let a hull-grown creature render cleanly with no bolted stand-ins, roster untouched.
And **fork-don't-refactor** when the shipped sibling must stay byte-identical: duplicating the ~400-line kernel
into `dragonNightFury.js` (vs. refactoring shared helpers out of `dragonOrganism.js`) keeps obsidian2's output
provably unchanged — the gates confirm it.
**→ Leapfrog (innovate):** the smooth hull is the base the whole L32/Phase-C arc needed — **I2** grows neck+head
from the front ring (copy-the-boundary, the same `findSeam`/`seamPointAt` primitive), **I3** grows the tail from
the rear ring + **twin bat-membrane tail fins** (the wing kernel verbatim — frame + `buildCurvedPatch` membrane +
fingers, NOT the lilypad), and the static `bodyRoot` still unlocks the Phase-2 vertical body-whip. Each lands
behind the same coexist gates and is human-judged on the rear/¾-rear chase cam (the headless `tiershots`/
`gameshots` are flat-lit, so they prove COMPILE + silhouette + that nothing idles bright, but the matte-relief
read at gameplay distance + the motion are the chase-cam oracle's). Anatomy (body profile + wing outline) is
authored to the Toothless reference imagery and verified on the preview, never guessed.

### L34 — ONE loft nose-to-tail + a CENTRELINE-BEND channel: extend the stations, don't weld tubes; bend the spine or it reads as a flat manta
**Did / learned:** the human directed a screenshot→compare→iterate loop against the Toothless reference, which
needs the WHOLE creature (head+tail define the silhouette) — so I built them, but the cleanest realization beat
the plan's "weld separate neck/tail tubes": **just extend the loft's own stations** forward (blunt snout → wide
cranium → slim neck) and backward (long taper → near-point tail tip), so head+body+tail are ONE continuous
`sweepProfileSmooth` surface — zero seams BY CONSTRUCTION (the L1/L32 ideal), no welding. The wing still welds at
the shoulder (its z-window is untouched); the only add-ons are the green eyes, back-swept ear-flaps, and twin
bat-membrane tail fins. Near-zero end stations close the nose/tail holes. The load-bearing fix the renders forced:
a straight-spine loft reads as a **flat horizontal manta** — the head can't lift, the tail can't curve. So I added
a **centreline-offset channel** to the generator: a station is now `[z, w, keelTop, belly, cy, cx]` where cy/cx
bend the spine (default 0 → byte-identical straight loft). Lifting the head (cy≈+0.36 on a curved neck) + drooping
the tail (cy≈-0.20) instantly made the side silhouette read as a posed dragon, and from the REAR the two acid-green
eyes over spread wings read unmistakably as a Night Fury. This is the deferred "spline centreline bending"
(`dragonSweep.js`'s own TODO), done as a simple per-station y/x offset (sections stay axis-aligned — fine for
gentle bends; full Frenet framing is a later upgrade). The copy-the-boundary weld + all gates SURVIVED every
reshape by construction (the seam copies whatever verts the loft emits — the L27/L30 property holds a 4th time).
Built an interactive **drag-to-rotate viewer** (`tools/nfview.html` + `nfview.mjs`): orbit + zoom + live-flap
toggle + tier buttons, building with `{preview:true}` to hide the gameplay aim-marker; it doubles as the clean
multi-angle render source for the loop.
**→ Systematize:** bank two laws. **(1) To make a lofted creature read as POSED (not a flat plank), BEND the
centreline** — a per-station `cy`/`cx` offset interpolated alongside w/top/bot is the minimal additive way (the
roster's straight loft is the cy=0 default). **(2) Prefer EXTENDING the loft's stations over WELDING separate
tubes** for neck/head/tail whenever the appendage shares the body's cross-section family — one surface beats a
welded seam; reserve the copy-the-boundary weld for parts that DON'T (the wing's flat membrane). The smoothness
gate had to change: once the profile has INTENTIONAL curvature, "near-flat" is the wrong metric — assert the smooth
loft turns strictly gentler than the station-only faceted loft (+ a loose absolute kink bound), so it still guards
facet banding without false-failing on the posed curve.
**→ Leapfrog (innovate):** the creature is now ONE continuous skinned surface nose-to-tail on a BENDABLE centreline
— exactly the substrate the Phase-2 vertical body-WHIP needs (split the static `bodyRoot` into a phase-lagged spine
chain + drive cy as a travelling wave, tail counter-phase; the cy channel is already the hook). Remaining,
human-judged on the lit preview + the drag viewer (flat-lit headless can't judge matte-vs-metal or motion): the
wing rest-droop (reads cape-like static — wants a more spread glide pose or membrane reshape), body depth,
tail-fin prominence, and the finish. The loop continues from the user's direction, not blind guessing.

### L35 — Reference-critique convergence: every note → ONE additive knob, and a CLAY render to actually see matte-black geometry
**Did / learned:** the human ran a clinical, marked-up-screenshot critique of `toothless` (5 reference images,
red/yellow/white annotations) and asked for it "clinically studied — don't assume." Banked the discipline of
translating each note into ONE named, additive, nullable knob rather than a bespoke rewrite: **wings** — 5
finger tips per `wingForms` tier (a finger fans to every tip; `tips[0]` rides the outer/leading edge) +
`wingArmLeadChord` (the arm bones + finger-convergence sweep FORWARD to the leading edge, shoulder stays on the
body seam — a real bat arm, not a mid-membrane spar) + `wingFingerCurve` (top spoke straight, lower spokes bow
more, scaled by fan index) + `wingFingerBulge`/`Radius` (struts read as raised ridges from the top). **Head** —
eyes recessed into the wide cheek station (the "eyes inside the head" read, not a floating ball), the small
ear-flaps grown into two LARGE back-swept ear-HORNS + a subtle row of dorsal nub-horns. **Mini-wings** — a NEW
non-flapping stabilizer sail pair just AFT of the main wing root (`buildCurvedPatch` membrane on the
already-declared-but-null `wingPivot2L/R` handles) that flare→taper to widen a long/thin body, driven in
`dragon.js` as stabilizers (hold their swept splay `userData.rz`, lean with the turn + a sail luff — NO flap)
behind a `model.miniWingStabilizer` flag. **Bat tail** — the two flat `ShapeGeometry` leaves became billowed
bat-membrane fins + finger spars (the wing kernel in miniature), exposed as `tailFins` and curved INTO a bank
(`userData.bankGain`, additive on `rotation.y`) as a rudder. The load-bearing TOOLING insight: the shipped
matte-black hide is **near-invisible on the dark stage** — useless for judging spoke/flare SHAPE — so I added a
**CLAY render mode** to `nfview` (`nfview.mjs toothless 3 clay`: neutral grey material + rebuild at REST pose),
which finally made the geometry legible without touching the shipped colour (the human even offered to recolour
to white — the clay mode is the non-destructive version of exactly that). All gates green, `tricount --ci`
0-over at high/low/ultra (toothless 3488→4054 HIGH), `tiershots` compiles, **roster byte-identical**.
**→ Systematize:** two reusable moves. (1) **A finish-independent CLAY/REST inspection render** belongs in
every creature's view tool — geometry convergence and material/finish convergence are SEPARATE oracles and must
not share a render (matte-on-dark hides shape; clay-on-stage hides finish). Bank it as the default "judge the
mesh" mode. (2) **Critique → knob table**: when a human gives N specific anatomical notes, resolve each to a
single additive+nullable model/spec field (default = old behaviour) so the change is roster-safe BY
CONSTRUCTION and the next creature inherits the vocabulary (wingArmLeadChord/wingFingerCurve/miniWingStabilizer/
tailFin bankGain are now creature-grammar, not toothless one-offs). The two ALREADY-declared-but-null rig
handles (`wingPivot2`, `tailFins`) absorbed the mini-wings + bat-tail with ZERO contract change — proof that
"additive + nullable" handles laid down early pay off later.
**→ Leapfrog (innovate):** the one thing that DIDN'T fit a non-skeletal knob is the cruise tail-WHIP: the
gates hard-code "7 bones / tailSegs===0" (the body+wings-only increment), so a real articulated tail needs the
skeleton to GROW + those asserts rewritten — i.e. the deferred Phase-2 vertical-whip substrate. So this pass
delivered all geometry + the fin-based banking rudder + mini-wing billow (non-skeletal, gates untouched) and
scoped the tail-bone whip as the next focused step. The pattern to bank: **sort a feature request by whether it
needs the skeleton** — non-skeletal motion (pivots, fin rotation, sail luff) ships behind existing nullable
handles immediately; skeletal motion (whip, body-bend) is a gated, gate-updating increment. Next: grow a short
tail-bone chain (reweight the rear loft verts off the static bodyRoot, expose as `tailSegs`, update the
nightfury gates to the new bone count), then cross-fade cruise-whip ↔ bank-rudder per the user's call.

### L36 — Tail-whip = the first SKELETON GROWTH on the hull: reweight rear loft → bone chain, ROTATION-only drive, gate the new bone count
**Did / learned:** the human flagged the tail/body as "stiff" and signed off the cross-fade design, so I grew
the FIRST articulated appendage on the night-fury hull: a 4-bone tail chain (`model.tailWhip`) appended at
skeleton indices 7–10 (the 7 body/wing bones keep their frozen indices/contract). The rear loft verts are
**reweighted** off the static `bodyRoot` onto the chain by a 2-bone z-proximity blend (everything fore of
`TAIL_Z0=1.45` — incl. the wing seam — stays 100% bodyRoot, so the weld gates are untouched). Three gotchas,
all banked: **(1) a skinned bone chain must be driven by ROTATION, never POSITION** — the shipped `tailSegs`
coil sets `.position` (fine for free overlapping cones) but that TEARS a chain, so dragon.js branches on
`model.tailWhip` to a rotation-only travelling-wave sway that cross-fades to a bank rudder, and the shop
preview tick detects `tailSegs[0].isBone` to do the same (no flag needed there). **(2) Static add-ons that sit
on a moving part must be PARENTED to its bone** — the twin tail fins now mount on the LAST tail bone (position
made local to it) so they ride the whip instead of detaching on a hard bank; their `bankGain` is halved since
the tail itself now curves. **(3) The frozen gates encode the OLD contract** — `nightfury.mjs` hard-pinned "7
bones / tailSegs===0 / skinIndex≤6", so growing the skeleton REQUIRES updating those asserts in the same
commit (now 11 bones, tailSegs===4 all-Bones, skinIndex≤bones-1). Verified beyond the gates with a functional
**motion probe** (rotate the chain → the TIP vert moves 1.36, a near-root vert ~0, a body vert frozen) — the
headless proof that the whip deforms the right verts and nothing else. Roster byte-identical, tri count
UNCHANGED (4149 — reweighting adds no geometry), tiershots compiles.
**→ Systematize:** the reusable recipe for "articulate part X of a one-piece hull": append bones at the end of
the skeleton (never renumber the frozen ones) → reweight only X's verts by proximity (a clamped control-z list
+ sstep blend) → drive by ROTATION → parent X's static decorations to X's last bone → update the contract gates
to the new counts → prove with a tip-moves / root-frozen / body-frozen motion probe. This is the template for
the next appendages (neck bob, the full body-spine whip = split `bodyRoot` into a chain the SAME way). The
`isBone`-detection trick lets shared drive code (preview tick) handle both free-segment and bone-chain tails
without a creature flag.
**→ Leapfrog (innovate):** with the tail proven, the deferred Phase-2 **vertical body-whip** is now a known
quantity — split `bodyRoot` into a short spine chain (shoulder→hip), reweight the mid-body, drive `cy`-style as
a travelling wave with the tail in counter-phase. The hull is now a genuine posable skeleton, not a static
loft + flapping wings; every "it feels stiff" note maps to "grow another short chain + reweight + rotation
drive + gate bump." Next loop targets (human-judged on the preview): tune the whip feel (amp/lag/speed), then
the body-spine flex if the tail-only motion still reads stiff, and continue silhouette convergence vs the refs.

### L37 — Body-spine whip = split `bodyRoot` into a spine chain (the deferred Phase-2), + the motion PLANE matters, + two weld gotchas
**Did / learned:** the human's flight reference (a thick dragon porpoising) exposed that the L36 tail-whip
drove `rotation.y` → the tail swung **side-to-side, which is WRONG**. Correct flight motion is a **VERTICAL
(dorsoventral) undulation coupled to the wingbeat**; lateral swing happens **only when banking** (the rudder).
Two fixes shipped together: **(A) plane swap** — the tail cruise wave now drives **`rotation.x` (pitch)**
locked to the flap `phase` (`ph = phase − 1.6 − i*0.6`, trailing aft), and the bank rudder stays on
`rotation.y`; the shop-preview `boneTail` branch got the same y→x swap. **(B) the whole-body whip** — split
the static `bodyRoot` into a **spine chain in the vertical plane** following the L36 recipe: keep `bodyRoot`
as the **CHEST anchor** (holds the wing-seam band rigid), grow a FORWARD `neck→head` chain + an AFT `hip`
node off it, re-parent the tail chain onto the hip so the whole rear rides one wave, and reweight the loft by
z-band. Each spine bone carries `userData.whip = {gain, phase}`; `dragon.js` drives `rotation.x` as a
travelling pitch wave (head bobs, rear heaves), exposed via a new nullable `spineSegs` handle (plumbed through
`dragonModel.js` like `tailSegs`). Skeleton grew 11 → **14 bones** (gate updated in the same commit, per L36).
**Two weld gotchas, both banked:** (1) **a rigid anchor band needs SINGLE-slot weights** — when both
bracketing reweight controls are the same bone (the chest band, both `BONE.BODY`), the naive 2-slot blend
writes `sw=[1−t, t]` with `si=[0,0]`; that's still 100% bone-0 mathematically, but the ZERO-GAP gate checks
**slot-X weight === 1**, so it fails. Collapse to `si=[a]; sw=[1]` when `a===b`. (2) **the anchor band MUST
fully contain the wing-root seam chord** — the seam spans z≈−1.10…0.28 (measured, not guessed), so a chest
band starting at −1.0 leaked the front seam verts onto the neck (0.18 gap). Push the band front to −1.35 with
margin. **Verify motion with a plane-aware probe**, not just "it moved": body-whip → head **Δy 1.26, Δx 0**
(vertical) with chest **0.0000** (anchored); tail pitch → tip **Δy 1.36** (vertical); rudder → tip **Δx 1.21**
(lateral). Geometry this round too: the wrist now **auto-derives from the innermost scallop tip**
(`tips.at(-1)[0]*1.34`) so it sits in line with the first scallop across all tiers; fingers gained an
**outward span bow** (`wingFingerSplay`) so they fan/curve (not straight); the tail fins are **FLAT bat-fans
at the tip** (yaw-only rotation, near-zero arc/billow, 3 scallops, light bank flare); the tail is **thicker +
muscular, tapering late**. All 10 gates green, roster byte-identical, tri 4134 (HIGH), high/ultra CI 0-over.
**→ Systematize:** the L36 "articulate part X" recipe now extends to the SPINE — the reusable rule is
**anchor the bone that owns a weld (the wing seam → chest), grow chains fore and aft of it, and the anchor
band's z-extent must be MEASURED to contain the weld chord**. Drive plane is a first-class design choice:
**pitch (rot.x) for swim/flight undulation, yaw (rot.y) for steering** — never default to yaw. `userData.whip`
metadata on each bone keeps the drive code creature-agnostic. Next: tune the whip feel (amp/lag/phase coupling
to the flap) and the wing-fan splay on the lit preview; the hull is now a full fore-aft posable spine.

### L38 — Material framing: route the leading spar + a wrist thumb-knob into the HULL so the wing reads as ONE animal
**Did / learned:** the human flagged that the translucent membrane made the wing look like "a different animal"
from the matte body. Fix = give the wing a **body-matte leading-edge FRAME**: the arm spar was already hullMat,
so I split `buildFingers` to return `{ frame, struts }` — the leading finger (`tips[0]`, the outer/leading
spar) is now built FATTER (`wingFrameRadius`) and lifted higher (`wingFrameLift`) so it rides ON TOP of the
membrane, and crucially it's **merged into the HULL geometry** (not the `fingerMat` struts mesh) so it renders
in the body material. Together arm→wrist→leading-finger trace the chase-cam "outline" the human drew. Added a
small **thumb-knob** (clawed nub) at the wrist, skinned 100% to the wrist bone so it rides the flap, also
merged into the hull. Gotcha banked: **which MESH a geometry merges into decides its MATERIAL** — the per-tube
`mat` arg to `skinnedTube` is irrelevant after merge; to recolor a part you move its geo between the hull merge
(`growSkinnedExtension`) and the struts merge. Also: `buildFingers`/`buildThumbKnob` are called BEFORE the hull
merge but defined after — fine because they're hoisted function declarations and all their closure deps
(`wristXGeo`, `spanSkin`, `wingSpec`…) are initialized by call time. 10 gates green, tri 4182 HIGH (+48 for
frame+thumbs), 0-over, roster byte-identical, tiershots compiles.
**→ Systematize:** "make part X read as the body" = build it skinned (to the right bone), lift it proud, and
merge it into the HULL mesh; "make it a separate translucent/colored thing" = merge into that mesh instead.
Material = merge target. The frame/thumb knobs are `model`-knobbed (`wingFrameRadius/Lift`) for preview tuning.

### L39 — Anatomical proportion pass: arm>forearm>finger taper, embed the frame, downbeat-SURGE whip, deeper tail scallops
**Did / learned:** five targeted refinements from a chase-cam critique, all geometry/drive-only (no bones, weld
untouched → 10 gates auto-green, roster byte-identical, tri 4182). **(1) Wrist even more medial** — added a
`wingWristMedial` (0.84) factor on top of the innermost-scallop auto-align so the wrist pulls inboard OF the
first scallop and the fingers fan harder outward. **(2) Frame taper** — the leading-edge spar was FATTER than
the arm (the `wingFrameRadius` multiplier made the finger ≈0.078 vs the arm's 0.035 wrist), which reads as an
anatomy error. Re-set the hierarchy with absolute radii: arm `r0` 0.115·rootScale (humerus, +shoulder bump) →
forearm/wrist 0.10 → leading frame spar 0.085 → inner struts 0.058 → tip. Rule: **a limb must taper
proximal→distal (arm > forearm > fingers); a fat decoration finger breaks the read.** **(3) Embed the frame**
— the "detached, only-visible-backlit, wrist-sticks-out" complaint was the frame floating ABOVE/forward of the
membrane (`wingFrameLift` 2.4 + `armLeadZ` -0.5). Set frame lift→0 (tube CENTRE on the membrane leading-edge
surface = half-sunk/embedded, no gap) and pulled the arm sweep back (`wingArmLeadChord` 0.5→0.38). **On-top vs
embedded is a lift choice: center-on-surface = bonded edge; center+radius = floating bar.** **(4) Deeper tail
scallops** — `finSpec.scallop` 0.12→0.26 + fuller tips/chords; the quadratic web control in `buildWingShape`
cusps the trailing edge far up between the 3 tips so the fan reads lobed, not triangular (this was for the
TAIL fins only — the main wings were signed off). **(5) Downbeat-SURGE whip** — "weak power" was the smooth
`sin` undulation; replaced with `flapSurge(x)` = a SHARPENED, asymmetric envelope (power/down lobe `pow(s,0.5)`
full, recovery lobe `-0.55·pow(-s,0.85)` gentler) driving the spine + tail `rotation.x`, still flap-phase-locked
+ head→tail lagged. Same plane (vertical) + handles; only the TIME envelope changed → reads as a thrust pump,
not a lazy wave. **Knob, don't hardcode:** every value here is a `model.*` knob so the human tunes feel on the
lit preview. Headless can't judge "power" or "matte vs translucent" — those are preview calls; clay only
confirms the silhouette/embed.
**→ Systematize:** proportion realism = proximal-thicker taper across a limb's whole chain incl. its frame
spar; "embedded vs proud" decals = set the tube centre relative to the host surface ± its radius; "more power"
in a cyclic motion = sharpen/bias the drive ENVELOPE (asymmetric power/recovery), not raise amplitude.

### L39b — Gap fix: a frame "on" a curved surface must FOLLOW that surface's curve, not a straight chord
**Did / learned:** after L39 embedded the frame (lift→0), the human still saw a GAP between the arm spar and
the membrane — worst near the root. Cause: the arm ran a STRAIGHT shoulder→wrist chord at a fixed forward
`armLeadZ`, while the membrane's leading edge is a CURVE (the `buildWingShape` lead bezier); the two diverged
by up to a chord-depth near the root. Fix: added a `leadEdgePt(wr, side, x)` sampler that returns the EXACT
membrane leading-edge world point at span x (mirrors `buildCurvedPatch`'s `yAtLead` interp on
`buildWingShape(spec).getPoints()`), and laid the arm spar's stations + the finger-convergence `wristP` + the
thumb-knob ON it. Now the matte frame and the translucent membrane share the same v=0 boundary → zero gap by
construction, and it deforms identically (same `spanSkin` bones). **Rule: to bond decoration to a procedural
surface, SAMPLE that surface's boundary for the decoration's path — never approximate it with a straight line
or a constant offset; they only coincide at the endpoints.** 10 gates green, tri 4210, 0-over.

### L39c — VERIFY geometry claims by MEASURING, not by eyeballing a thumbnail; a straight chord ≠ an arced edge
**Did / learned:** I claimed L39b closed the frame↔membrane gap from a tiny clay thumbnail — the human (rightly)
pushed back: the gap was still there. Wrote a **measurement probe** (bin spar verts by span-x, nearest-membrane
distance, subtract the expected tube radius) which proved a real 0.42 gap at the OUTER wing (x≈4–5) while the
arm region was just tube thickness. Root cause: L39b fixed the ARM onto the leading-edge curve but left the
leading FINGER as a straight `wristP→tip` lerp — and the membrane leading edge ARCS up (the `arc.hump` at
humpAt≈0.6), so a straight chord dives below it by the hump height. Fix: made `buildArmFrame` ONE continuous
tube sampled on `leadEdgePt` for the WHOLE span (root→wingtip), radii tapering humerus→forearm→thin finger
tip (matching the struts so it doesn't read thick at the tip, per the human), and deleted the separate frame
finger. Re-measured: outer-wing gap 0.42→~0.10 (= tube radius across the whole span, uniform). **Two rules
banked: (1) never claim a spatial fix from a thumbnail — write the probe and read the number (the headless
oracle for geometry, like the L36 motion probe). (2) To bond a part to a curved procedural boundary, sample
that boundary along the part's WHOLE length; matching only the endpoints (a straight lerp) gaps wherever the
boundary curves between them.** 10 gates green, tri 4410 HIGH (the longer seg(18) spar), 0-over.

### L40 — Layered procedural flight system: surge blend + role-driven spine + bank asymmetry, all additive over the existing rig
**Did / learned:** turned the wingbeat into a LAYERED body system per a detailed brief, reusing the rig we'd
already built (shoulder/elbow/wrist `flapWing` cascade, neck/head/hip spine bones, tail chain) rather than
rewriting. New axes: **(1) `surge01`** — a damped 0→1 Dragon-Surge blend (fever=1, boost=0.5) that MORPHS the
posture (not just glow): swept-back + sharper-downstroke wings, lowered spear head, streamlined less-bobbing
body, tighter faster tail rudder, deeper snappier bank. **(2) Role-tagged spine** — each spine bone carries
`userData.role` ('neck'|'head'|'hip') so `dragon.js` drives them as DISTINCT systems with timing offsets: the
hip lifts a beat AFTER the power downstroke (`flapSurge(phase-0.6)`), the neck absorbs the bob + breathes, the
head COUNTERS the neck (`-0.045·flapSurge`) so the gaze stays composed (no goofy bounce) and leads turns in
yaw. **(3) Bank asymmetry in `flapWing`** — the INSIDE wing of a turn tucks+dips, the OUTSIDE opens+braces
(`turnBias·side` sign test), so it banks like an aircraft instead of rotating rigidly. **Key discipline: every
new term VANISHES at surge=0 AND steer=0** (multiplied by `surge01` or `steerMag`), so cruise-straight flight
— and every non-surging/non-skinned dragon — is byte-identical in feel; the layer is purely additive over the
shipped wingbeat. All knobs live in `flapWing` DEFAULTS (per-creature via `model.flapProfile`) + named consts
in the drive, so feel is tuned without restructuring. Runtime-only (no bind/gate impact); 10 gates green, tri
4442, compiles. The HUMAN judges feel on the preview — headless can't.
**→ Systematize:** "make a rig feel alive" = drive each part as a tagged system with phase OFFSETS (root→tip,
downstroke→lift→hips→tail-tip, head counters), and gate every stylistic layer behind a blend (`surge01`) +
input magnitude so the base motion is never regressed. Add a mode by BLENDING params, not branching animation.

### L40b — Full flight-state matrix as overlapping BLENDS (boost · decel · dive · climb), not hard-switched clips
**Did / learned:** expanded L40's layered system to the full state set the human enumerated — distinct
`boost01` (held boost, separate from `surge01` fever), `decel01` (boost-RELEASE air-brake: spikes on the
falling edge `prevSpeedActive && !speedActive`, then eases), and `diveAmount`/`climbAmount` from vertical
velocity. Collapsed them into two POSTURE drivers — `aero01` = streamline/tuck/sweep (max of boost·0.7,
surge, dive·0.85) and `spread01` = open/air-brake (climb + decel) — so each animated part reads ONE pair of
opposing scalars instead of branching per mode: wings sweep+sharpen+fold under `aero`, open+lift+unfold under
`spread`; flap FREQ slows in a dive (glide) / eases on decel, AMPLITUDE shrinks in a dive and grows on
climb+decel (catch air); a `posturePitch` leans the whole body nose-down (dive/boost/surge) or nose-up
(climb); the spine drops the head into a spear or lifts it to soar and the hips drop as a climb counterweight;
the tail tightens (aero) / loosens (decel) / straightens (dive). **States OVERLAP for free because they're
additive scalar blends** (boost+bank, surge+dive, dive+bank all just sum) — no combinatorial animation clips,
no snapping, and everything still vanishes at 0 so cruise + non-skinned dragons are unchanged. **Rule banked:
model a mode MATRIX as a few orthogonal 0→1 blend scalars feeding shared part-drivers; adding a state = adding
a scalar + its contribution, never a new branch.** Body-pitch posture is on the group so ALL dragons get
dive/climb lean; the wing/spine/tail richness rides the skinned (toothless) rig. Browser test `badges.mjs`
times out (pre-existing Chromium-blocked), unrelated. 10 gates green, tri 4442, tiershots compiles.

### L41 — Variable frequency ⇒ INTEGRATE the phase; never `time × varying_freq` (the decel/dive wing spasm)
**Did / learned:** the human reported the wings "spasm — beat wildly fast" during deceleration (boost release /
letting go of accelerate) and when pressing DOWN to dive. Root cause: the beat clock was `phase = time *
flapSpeed`, and L40b made `flapSpeed` vary CONTINUOUSLY each frame (the `(1−0.55·diveAmount)(1−0.18·decel01)`
blends). With `time` = large accumulated seconds, any frame-to-frame Δfreq jumps the phase by `time·Δ` — a
headless sim showed **49.98 rad/frame** during a decel ramp (≈8 wingbeats in ONE frame → the spasm). It only
showed on decel/dive because that's when the frequency changes every frame; a one-off boost toggle was a single
pop, easy to miss. Fix = the standard variable-frequency oscillator: **accumulate** the phase
(`flapPhase = (flapPhase + dt·flapSpeed) % 2π`) so changing the frequency only changes the RATE, never the
absolute phase → Δphase stays `dt·flapSpeed` (≤0.19 rad/frame, proven). Base cruise is unchanged (∫const = the
old formula up to an invisible offset), and it also kills the latent one-frame pop on every boost/fever toggle.
Same defect + fix applied to the rider-scarf sway (`time·(1.6+speedNorm·1.9)`). **Rule banked: any oscillator
whose frequency can change MUST integrate `dt·freq`; `Math.sin(time × variableFreq)` is a latent phase-jump bug
— grep for `time *` with a non-constant multiplier whenever motion glitches on a speed/state change.** Verified
headlessly with a ramp sim (old jumps, new doesn't) — the runtime analogue of the L36 motion probe / L39c gap
probe: prove timing/spatial fixes with a NUMBER, not a thumbnail. Runtime-only; 10 gates green, tri 4442,
tiershots compiles.

### L42 — Drive cinematic posture layers off a DEADZONED signal, not a raw linear reading
**Did / learned:** the human found the dive posture too trigger-happy — normal play's constant subtle
down-dodges read as a permanent head-down dive. Cause: `diveAmount = clamp(-vy*0.05, 0, 1)` is LINEAR from
zero, so a gentle −5 m/s descent already gave 0.25 dive. Fix: a deadzone + smoothstep on the descent speed,
`diveAmount = smoothstep(9, 16, -vy)` (verticalSpeed≈18, so a committed dive ≈ −18 crosses it; the
`velocity.y` damping keeps brief taps under the deadzone) — subtle ≤−6 → 0, real dive ≤−16 → 1; matching
deadzone on climb. Proved with a headless curve sweep (old vs new per vy) — the same "verify with a number"
discipline as the L41 phase sim / L36 motion probe. **Two rules banked: (1) a CINEMATIC posture (dive spear,
soar, etc.) must engage off a thresholded/deadzoned input, never a raw linear one — gameplay micro-input
shouldn't cross into a film pose. (2) Also confirmed + documented that the body tilt is COSMETIC: collision is
a fixed `player.position` point + `CONFIG.playerRadius` (gate check `|p.y−gapY| < gapH−0.5`), with zero
reference to `group.rotation.x`, so visual pitch never changes the hitbox/clearance.** Runtime-only; 10 gates
green, tri 4442, tiershots compiles.

### L43 — Flight feel pass: firm the head, deadzone banking, add a direction-change spine pitch-whip
**Did / learned:** three feel notes, all runtime drive-only (dragon.js + dragonWingFlap.js). **(1) Floppy
head/neck → FIRM:** the wingbeat-coupled bob/counter/breathe was the floppiness — cut hard (neck bob
0.06→0.022, breathe 0.014→0.006, head counter 0.045→0.018); the deliberate dive-spear/soar `noseDown`/`noseUp`
poses stay (trimmed ~15%). Lesson: a stable "intelligent" head = kill the procedural NOISE (bob/counter), keep
the intentional POSE. **(2) Banking over-exaggerated on gentle steer → DEADZONE:** added
`bankHard = smoothstep(0.12, 0.26, |turnBias|)` and gated the DRAMATIC terms by it (wing inside/outside tuck,
tail rudder + counter-sweep, neck/head turn-lead, hip yaw) while leaving the BASE proportional bank (`bankZ`
roll + the gentle `flapWing` turnBias lean) linear. So gentle = a subtle lean, hard = the full carve (sim: 0.13
→0.01, 0.28→1.0). Same deadzone discipline as the dive layer (L42). **(3) Stiff vertical transitions → a
spine pitch-WHIP:** derived `vertJerk = vy − damp(vySmooth, vy, 5)` — a signal that SPIKES on a vertical
direction change and self-decays when steady (no raw per-frame accel noise, no sustained-state bleed). It
drives a subtle additive pitch transient on the hip + tail (`-vertJerk·gain`, tail scaled by `lock` so the tip
trails most), so the body ripples chest-leads/tail-follows through an up↔down reversal but is still in cruise.
**Rule banked: a transient "response to a CHANGE" = `signal − lagged(signal)` (a high-pass), which auto-resets;
don't drive it off the raw value (that bleeds into steady state) or raw per-frame Δ (noisy).** Verified with
headless curve/transient sims (bankHard ramp, vertJerk spike-then-decay) — numbers, not vibes. 10 gates green,
tri 4442, tiershots compiles; cruise-straight + other dragons unchanged (every new term gated by bankHard or
vertJerk, both 0 at rest).

### L43 — Toothless proportions: short THICK neck + muscular thorax, eyes on the SIDE, horns up+back
**Did / learned:** the human's red-outlined reference showed the model read "funny" because the neck was long +
thin and the thorax slim — Toothless is short-necked and barrel-chested. Reshaped `NIGHTFURY_PROFILE`: removed
the 0.115 neck pinch (now a short thick 0.34 neck) and fattened the ribcage ~25-30% (chest peak 0.51→0.665),
so the head sits on a muscular body. Two head-feature fixes: **eyes were on TOP** (`y=HEAD_Y+0.04`, `x=0.185`,
inboard/high) → moved to the SIDE of the head (`x=0.275` out to the cheek, `y=HEAD_Y−0.05` to mid-head,
`rotation.y` more sideways); **ear-horns pointed FORWARD** because `rotation.x=−1.30` sends a +y cone-apex to
(y=0.27, z=−0.96)=forward in this −z-nose frame → flipped to `rotation.x=+0.52` so the apex goes (+y,+z) = up +
back (toward the tail), the swept-back Night-Fury horns. **Gotcha banked: when orienting a built primitive,
WORK OUT which world axis its local axis maps to under the rotation — a cone apex at +y under `rot.x=θ` lands
at (cosθ, sinθ) in (y,z); the sign of θ decides forward vs back, and the model's nose-at−z frame flips the
intuition.** Loft reshape — weld/rest-parity/all 10 gates auto-survive (membrane copies whatever verts the
loft emits), tri 4442, 0-over, tiershots compiles.

### L44 — Feel/proportion tuning round: stocky neck, stubby back-horns (splay-sign bug), fever-firm head, bolder vertical whip
**Did / learned:** a batch of human-judged dials. **Geometry:** shifted the head block +0.40 toward the body +
compressed the neck → stocky/short-necked; horns shrunk to short stubby nubs (`hornLen` 0.82→0.44, wider base
→ rounded) and **the splay sign bug fixed** — once the apex pointed UP (`rot.x` +0.85) instead of forward,
`rot.z = side*+0.30` rotated a +y vector toward −x → the two horns crossed over the centreline; flipping to
`side*−0.28` splays them OUT (no crossing). Bat-tail fins: deeper `scallop` 0.26→0.38, 25% smaller
(`tailFinScale` 0.92→0.69), less outward yaw (−0.72→−0.52). **Animation (all `model`-free constants in
dragon.js):** fever was re-floppifying the head/neck because `calm = 1−0.5·aero01` only halved the bob — added
a stronger `calmHN = 1−0.85·aero01` for the neck/head so they go near-still under surge/boost/dive; eased the
hard-bank exaggeration (neck/head turn-lead 0.26/0.40→0.18/0.28, hip drift 0.5→0.35, body-roll `bankFactor`
−25%); and made the vertical direction-change whip BOLDER (`vWhip`/`tWhip` ≈2.5×, `vertJerk` clamp ±12→±16,
+ a little whip shared into the neck). **Rule reinforced (L43): when you re-orient a primitive, the splay/twist
that worked for the OLD apex direction can invert for the new one — re-derive the sign.** And: layered "calm"
factors want PER-PART strength (the head needs more damping than the body under streamline). 10 gates green,
tri 4442, 0-over, tiershots compiles; feel is human-judged on the preview.

### L45 — The "white glare" on the matte body was the global FRESNEL RIM, not a glow sprite; make it per-dragon
**Did / learned:** the human saw a white glare washing the front/dorsal half of the body and guessed the "aim
core glow" — but `toothless` has no `coreGlow` sprite. The culprit was the GLOBAL fresnel rim (`rimLight.js`,
applied to every hero's bodyMat at strength ≈0.5 in cruise): an additive warm-white at grazing angles that, on
a matte-BLACK Night Fury against a bright sky, lit the rounded shoulders/back into a glare (high contrast on
black). Fix: gave `applyRim` a per-material `mul` that `updateRim` folds into the strength, and a per-def
`rimBodyMul` (default 1 → roster byte-identical) set to **0.15** for toothless so its body rim is mostly off
while wings/spine keep theirs (the membrane still needs the edge to read against the sky). **Rule banked: a
"glow" on a hero can be a SPRITE, an EMISSIVE, an ENV reflection, OR an additive shader RIM — check which by
elimination (no coreGlow → look at the rim/SSS/env), and prefer a per-dragon multiplier over a global tweak so
one creature's matte read doesn't regress the colourful roster.** Material-only: 10 gates green, roster tri
byte-identical, tiershots compiles the rim shader. Lit result is human-judged; env-intensity is the fallback
lever if any sky-sheen remains.

### L46 — A COMPACT head fights the no-facet gate; flatten the CROWN (side-channel cheeks), don't just squeeze z
**Did:** the human wanted the head/neck "reduce by 30% — reads too long" plus a subtler boost/fever pitch,
banking body-roll reset to the original, and a bolder vertical spine pitch-whip. The geometry trap: simply
compressing the head stations in z (−4.65→−3.10 nose) steepened the dorsal (apex) line so the
NO-LONGITUDINAL-FACET gate failed (max turn 24.8° > 17°). **Learned — the apex top-line the gate walks is
`cy + widthTop` per station; a head that climbs from a thin nose to a tall cranium over a SHORT z is an
unavoidably sharp longitudinal turn.** Fix wasn't "spread z back out" (that fights "compact"); it was to
**carry the head's width in the SIDE channel (cheeks widen sideways) while keeping the TOP (dorsal) channel
low and flat** — a low broad Night-Fury skull. Lowering `widthTop` 0.345→0.245 + flattening the `cy` crown
(0.35→0.29) dropped the turn to **15.3°** (1.7° margin) at a head still ~24% shorter AND ~25% lower-profile,
so it reads clearly more compact than a pure-z squeeze would. Dropped `HEAD_Y` TY+0.36→+0.30 so eyes/horns
stay embedded in the lower crown. **Animation (dragon.js, model-free):** boost/fever ventral tilt made
*very* subtle (`posturePitch` boost 0.035, surge 0.045; `noseDown` boost 0.03, surge 0.04 — was reading too
much belly); banking body-roll `bankFactor` reset to the original `0.035 + speedNorm*0.015` (damp 9); vertical
pitch-whip nudged bolder (`vWhip` 0.026, `tWhip` 0.040). Glare: dropped `bodyEnvIntensity` 0.16→0.05 +
`rimBodyMul`→0 (the sky-env reflection on the smooth dorsal was the remaining sheen after L45's rim cut).
**Rule banked: a procedural creature has FOUR width channels (top/side/bottom/cy) — when a silhouette goal
collides with a smoothness gate, re-route the volume to the channel the gate doesn't sample (here: SIDE for
cheeks) instead of trading away the goal.** Verify spatial smoothness with a NUMBER: I iterated head candidates
through a throwaway probe that printed the resampled apex turn, not by eyeballing renders. 10 gates green,
tri 4442, 0-over, tiershots compiles; the compact read + subtle tilt + whip are human-judged on the preview.

### L47 — HANDOFF: the hull roadmap (Phases 1–2) is SHIPPED; the named next frontier is PHASE 3 — the BLUEPRINT LAYER (L24 thesis)
**State of the art (read this first if you're picking up `toothless`).** The original 3-increment hull plan
plus its deferred motion item are all merged (PR #120 → master):
- **Inc 1** smooth body + one-surface wings — `sweepProfileSmooth` longitudinal-spline loft (no metallic rings),
  shared seam normals, finger-to-every-scallop (L33).
- **Inc 2** continuous neck+head — landed BETTER than the plan: not "grow a tube from the front boundary ring"
  but **extend the loft STATIONS** so head/neck are part of the ONE surface (L34). `toothless` wires
  `head:'none'` (no legacy bolted head); eyes/ear-horns are added FEATURES, not a module.
- **Inc 3** continuous tail + twin bat fins — tail is loft stations; twin flat bat-tail fins w/ scallop spokes (L39).
- *(deferred)* vertical body-whip — `bodyRoot` split into a spine chain, rotation-only drive, gated bone count (L37).
Everything from L38→L46 is **anatomy/proportion/feel refinement**, not new hull structure. So the GEOMETRY
roadmap is complete; `toothless` is a full continuous-hull Night Fury (4442 tris, 10 gates green).

**Position in the 3-phase arc (`UNIFIED_HULL_PLAN.md` + L24 — the "hull BEFORE blueprint" thesis):**
Phase 1 **Hull** (one continuous procedural body+wing surface) ✅ · Phase 2 **Generalize the generator + the
motion whip** (kernel nose-to-tail on a bendable spine + the vertical body-whip — that's `toothless`'s continuous
loft + L37) ✅ · **Phase 3 = the BLUEPRINT LAYER ← the named next frontier.** The whole point of doing the hull
FIRST: the hull is a parametric GENERATOR and the data it consumes (`profile`/`wingSpec`/section/centreline/
`motionProfile`) IS the blueprint, so now the AI-authoring vocabulary is just the formalized, validated,
documented set of knobs it already exposes (L24: *never design a creature schema ahead of the geometry that
realizes it*).

**What's genuinely next (in priority order):**
1. **Close the Phase-1/2 sign-off first (confirmation, not building).** (a) Lit finish read at gameplay distance
   — the L45/L46 glare cut (`rimBodyMul`→0, `bodyEnvIntensity` 0.05) is human-judged on the merged preview;
   `bodyEnvIntensity`/diffuse lighting is the last lever if any sky-sheen remains. (b) **PER-TIER pass:** every
   proportion/feel round (compact head, firm neck, flight blends) was judged on **Eternal** only — verify
   Hatchling/Kindled/Radiant via `nfview.mjs toothless 0|1|2 clay` + `tiershots.mjs toothless`; form scaling
   lives in `dragonWingFlap.js formStrength/formSpeed` and the form-level station scale.
2. **PHASE 3 — the BLUEPRINT LAYER (the L24/L32 payoff — AI-promptability).** Four concrete pieces, in order:
   - **`creatureGrammar.js`** — a registry-DERIVED grammar: the closed vocabulary of the hull/wing/surface/motion
     knobs the generator already reads (don't invent a schema — harvest the params that already vary per dragon).
   - **`validateCreatureBlueprint()`** — loud, ACTIONABLE validation wired into `run-all` (a malformed creature
     fails at author time with a clear message, not as a silent bad render).
   - **`surfaceLayers`** — promote the imperative "Lego residue" decoration blocks (`dragonModel.js:164–334`) to a
     DECLARATIVE registry (the shingle run×card pattern, L-ledger), **inferred from the legacy flags so the roster
     stays byte-identical**; decorations then follow the hull surface instead of floating.
   - **`CREATURES.md` + ROSTER MIGRATION** — document the closed grammar with the one rule (*author the blueprint,
     never the builders*), then migrate the roster off the faceted `sweepProfile` onto `sweepProfileSmooth` so the
     **organism path is the DEFAULT, not opt-in** — behind the byte-identical coexistence guard, cloning
     `nightfury.mjs`'s MOTION-WELD + SEAM-NORMAL gates per migrated creature (the weld seam-index math under the
     longitudinal resample is the risk to watch).
   The migration is the TAIL of Phase 3, not the whole of it — the grammar + validation + `surfaceLayers` come
   first (they're what makes a migrated/new creature describable).

**Rule banked:** when a phased plan's increments collapse into a simpler mechanism than planned (here Inc 2/3's
"grow from the boundary ring" became "just extend the stations"), UPDATE the roadmap to the mechanism that won —
don't carry the superseded plan forward as if it's still pending. AND: don't let "done with the geometry" shrink
the handoff to just verification + migration — the *named* next phase is the **Blueprint Layer** (grammar →
validation → `surfaceLayers` → CREATURES.md → migrate), which is the entire reason the hull was built first.

### L48 — PHASE 3 part 1 shipped: the Blueprint Layer is grammar + validation + a declarative surfaceLayers registry — roster byte-identical, migration deferred
**Did / learned:** built the first, roster-safe half of Phase 3 (L47) — the recipe SYSTEM, not the migration. Four
pieces: **(1)** `creatureGrammar.js` — a HARVESTED (not invented) vocabulary of the ~40 highest-value generator
knobs the roster already varies (recipe builders, surface shaders, hull/wing/motion/material numbers, the legacy
decoration flags), grouped, with kinds + ranges; pure data, no Three import. Builder/shader/layer ENUMS are NOT
frozen in it — they're resolved LIVE at validation time against the registries (`hasTorso/Wings/Head/Tail` +
new `list*` accessors), `SURFACE_PATCH_NAMES` (new export), and `listSurfaceLayers()`, so the grammar can never
drift from what's buildable. **(2)** `validateCreatureBlueprint.js` + `tests/blueprint.mjs` — actionable
validation (a misspelled `'nightFuryWngs'` → "did you mean 'nightFuryWings'?" via edit-distance) wired into the
suite; a runtime dev-guard in `buildDragonModel` behind `globalThis.DRAGON_DEBUG_BLUEPRINT` (off by default →
zero shipped cost). **(3)** `dragonSurfaceLayers.js` — the nine imperative `if(model.flag){…}` decoration blocks
(`dragonModel.js:177–347`) promoted VERBATIM into a registry (`registerSurfaceLayer`, mirroring `dragonRecipe`),
dispatched by a single loop over `resolveSurfaceLayers(def, recipe, attach)` that infers the layer list from the
legacy flags in the EXACT order/conditions (or takes an explicit `parts.surfaceLayers`). **(4)** `CREATURES.md`
— the closed grammar + the one rule (*author the blueprint, never the builders*) + an annotated `toothless`.
**The load-bearing discipline that worked: prove byte-identical by MEASURING, not by trusting "verbatim".** Did a
`git stash --include-untracked` → `tricount` baseline → pop → `tricount` after → `diff` = IDENTICAL across all 37
models (119006 tris). All geometry tests green (`nightfury` 10 gates incl. coexistence, +14 others); the new
`blueprint.mjs` green (roster validates 0 errors/0 warnings + negative tests + layer-order parity); `tricount --ci`
0-over at high/low/ultra. **Two gotchas banked: (a)** registry-derived enums need the part modules IMPORTED before
validating (the registries populate at import) — the test imports `dragonModel.js` first; **(b)** the documented
numeric ranges are harvested from the roster and necessarily approximate, so out-of-RANGE is a WARNING (advisory),
only wrong-TYPE / bad-NAME / malformed-STRUCTURE is a blocking ERROR — else a valid shipped dragon (astralWyrm
`flapAmp 0.28`) false-fails the suite. The CI-Chromium browser tests (`badges` etc.) are red on a clean HEAD too
(no WebGL in this env) and `run-all` stops at the first — verify model tests DIRECTLY.
**→ Systematize:** the reusable pattern is **"promote a god-builder's `if(flag)` blocks to a registry + an
inference resolver, and PROVE the promotion byte-identical with a stash/tricount/diff"** — it generalises to the
next residue (the still-inline shingle is already declarative; future per-creature FX/aura blocks are the next
candidates). And **"a grammar HARVESTS knobs + resolves enums live; a validator splits TYPE/NAME/STRUCTURE errors
(block) from RANGE (warn); the docs are generated against the grammar"** is the template for every future schema —
never hand-maintain an enum that a registry already owns. The stash/diff byte-identical proof is now the standard
gate for any "refactor that must not change output" (the structural sibling of the L36 motion / L39c gap probes:
prove it with a number/diff, not a claim).
**→ Leapfrog (innovate):** with creatures now *describable + validated*, the AI-promptability thesis (L24/L32) is
one step from real — a prompt → a `creatureGrammar`-shaped JSON blueprint → `validateCreatureBlueprint` →
`buildDragonModel`, no new code. The next moves: (1) the deferred **roster migration** (flip the faceted
`sweepProfile` dragons onto `sweepProfileSmooth` so the organism path is the DEFAULT, cloning the `nightfury.mjs`
weld+seam gates per creature — the seam-index math under longitudinal resample is the watch item); (2) a
**blueprint→geometry round-trip generator** (emit a creature from grammar values alone, e.g. a `manta` = flatter
wider section + no horns, proving non-dragon creatures); (3) widen the grammar from the ~40 curated knobs to the
full ~130 the generator exposes, with per-knob defaults, so `CREATURES.md` and an authoring UI both render from it.

### L51 — Find out what the artifact IS before you tune the layer it's probably in: the "body glare" was a HUD aim pip drawn on top of the body, not a material
**Did / learned:** chased a reported "white glare on the front half of the body" across THREE sessions and two PRs through
the rim (L45/L46), then the sky-tint + matte hull (L50, #125) — each helped a *little* (the rim work genuinely cleaned up
the wings) but never killed it, because the glare **was not a material effect at all.** It is the **aim core**: a near-white
`MeshBasicMaterial` octahedron + a big **additive** glow-sprite halo, parented to the head and pushed forward, drawn with
`depthTest:false` + `renderOrder 999` so it renders ON TOP of the body — from the chase cam it smears a bright icy blob over
the dragon's front, identically on every dragon (`dragonModel.js:234`). Material knobs (env, roughness, rim mul) could never
touch it. The user, who could SEE it, named it in one sentence ("it's the aim core, to know the centre for the rings"). Fix:
drop the additive halo, shrink the core (`0.12→0.07`) and dim it (near-white `0xe2f6ff` → muted `0x8fc4dd` @ `opacity 0.55`),
keeping `depthTest:false` so it still reads as an aiming pip. Also shipped a paired audio fix: `main.js pauseForBackground()`
returns early unless `game.state==='playing'`, so backgrounding from the **menu** never suspended the audio — the
`setInterval` note scheduler then throttles under mobile Safari while the silent-media loop keeps the session alive →
garbled/slow music. Decoupled the audio suspend from game state (idempotent `pauseForBackground` + new `resumeFromBackground`,
wired to `visibilitychange`/`pagehide`/`blur`/`pageshow`/`focus`).
**→ Systematize:** bank the rule — **before tuning a shader/material to remove an on-screen artifact, IDENTIFY the object: is
it lit geometry, or an unlit always-on-top HUD/marker mesh (`depthTest:false`, additive, high `renderOrder`)?** A
`MeshBasicMaterial`/`Sprite` with `depthTest:false` ignores ALL lighting/rim/env/roughness — if a "glare" doesn't respond to
material changes, it's almost certainly one of these overlay meshes (or post/bloom), not the PBR surface. Cheapest disambiguator
is one question to the human who can see it, or a diagnostic toggle — both beat a third speculative material pass. Companion
audio rule: **a global concern (suspend audio on background) gated behind a feature-specific state (`game.state==='playing'`)
silently leaks in every other state** — gate cross-cutting handlers on the cross-cutting condition (`document.hidden`), not on
one mode.
**→ Leapfrog (innovate):** the aim pip is now a candidate for the same per-dragon/assist treatment as the reticle — it could
honour `saveData.settings.reticle` (fully off for assist-off runs) and/or tint to the dragon's accent so it never reads as a
foreign white dot. Bank a broader sweep: **audit every `depthTest:false` / bloom-layer / additive overlay mesh** (aim core,
rider glow `dragon.js:276`, halos) against the bright-sky chase cam — these always-on-top elements are the real source of
"washed out" reads, far more than the lit hull. And fold "what layer is this actually in?" into the triage checklist so the
next visual report starts by classifying the artifact, not guessing at shaders.

### L52 — Three new STARTER hull dragons by GENERALIZING the Night-Fury kernel into a data-driven `hullTorso`/`hullWings` (the L24 thesis, shipped on creatures)
**Did / learned:** added three brand-new starters — **Water "Tidewing"** (flat-wide MANTA: huge triangular fin-wings,
thin whip tail ending in a flat horizontal FLUKE, teal bio-glow), **Fire "Cinderwing"** (lean ARCHED raptor: clean swept
DELTA wings, long whip tail tipped with a glowing FLAME BULB — the Charizard read), **Earth "Cragmaw"** (heavy tank: tall
plated back via the shingle run, short broad leather wings, a stone CLUB tail grown from the loft). Each is **3 forms,
`maxRarity:'SSR'`** (caps at Radiant). The key move: the Night-Fury build (`dragonNightFury.js`) was already ~90% data-driven
(body from `NIGHTFURY_PROFILE`, wing silhouette from `def.wingForms` via `wingSpecFor`); only the PROFILE, `nfSection`, and
~12 feature literals were hard-wired. So I **forked the kernel verbatim into `dragonHull.js`** (generic `hullTorso`/`hullWings`)
that reads `def.hull = { profile, section, sectionN, knobs }` — `makeSuperEllipseSection({ex,flatTop,flatBot,n})` generalizes
`nfSection` (flat lens for manta `ex1.6/flatTop0.55`, oval for raptor `ex2.0`, boxy for cragback `ex2.6`), and every Toothless
feature literal (eyes/ear-horns/dorsal-nubs/tail-fins + seam half-window + chest band) became a nullable knob defaulting to the
old value. Three body PROFILES (`dragonHullProfiles.js`) on the SAME z-layout as Toothless (so the weld/feature defaults hold)
but with distinct widths/keel/cy → three silhouettes that share no read. The whole roster + Toothless stay byte-identical
(`nightfury.mjs` coexistence gate green); a new `hull.mjs` proves the zero-gap weld + motion-hold + seam-normal continuity for
all three. tricount: 3.7k–4.7k tris/form (under the 6000 ceiling).
**Gotcha:** `ascendedDef()` deep-clones the def via `JSON.parse(JSON.stringify())` → it **silently drops any FUNCTION on the
profile** (here `headBase`). The head is hull-grown (`parts.head:'none'`) so the value is irrelevant, but `buildTorso` still
calls `profile.headBase(neckSegs)` → `TypeError`. Fix: re-attach a no-op `headBase` in the `hullTorso` registration when it's
missing. **Rule: any data that flows through `ascendedDef` must be JSON-safe — keep functions OUT of `def`, or restore them
after the clone.** Second gotcha: decorations live in `def.hull.knobs` (constant across forms), so a back-spike would appear on
the HATCHLING too; gate each decorative feature by a per-form `model.*` flag first (`model.hullDorsalNubs ?? hk.dorsalNubs`,
`model.tailBulbGlow`) so the baby stays clean and the detail/glow RAMPS into Radiant — the grind payoff.
**→ Systematize:** the pattern for "a new creature class on proven tech" is now mechanical: (1) fork the kernel into a sibling
module that reads shape from `def.hull` (coexist — never edit the hero's module, its test imports its constants by name);
(2) author a PROFILE (stations `[z,halfWidth,keelTop,belly,cy]`) + a section-factory call + per-form `wingForms`; (3) gate
add-on features by per-form `model` flags so they accrete; (4) prove the weld with a `hull.mjs` clone of the hero's gate.
Silhouette uniqueness = **body MASS (section flat/oval/boxy + station widths) × wing PLANFORM (`tips`/`scallop`/`arc`/rootChord)
× TAIL (loft swell for a club, a whip for a fluke/bulb feature)** — three independent axes, so "not a reskin" is a data choice,
not new geometry code. Embellishment for the rear cam keys to three zones: (A) dorsal back-line, (B) wing trailing-edge/membrane,
(C) tail/hindquarters — give each creature a distinct treatment in each.
**→ Leapfrog (innovate):** `hullTorso`/`hullWings` is now THE reusable creature chassis — the next creature is a `dragons.js`
data entry + a profile, zero geometry code. Toothless itself can later migrate onto it (author `NIGHTFURY` as a `def.hull`
profile + section, delete the forked module) once the generic builder is the proven default — collapsing the duplication this
coexist step deliberately accepted. Open follow-ups (human-judged on the chase-cam preview): the flame-bulb/fluke/club want a
motion pass (they ride the last tail bone — verify they trail right on a hard bank), and the per-form decoration ramps want a
feel tune so the intermediate→Radiant JUMP reads bigger than hatchling→intermediate.

### L53 — Aesthetic wing = DEEP CHORD + fanned fingers, not a swept blade; and "cute" on the chase cam = PROPORTION, not eyes (ground every adjective in a real lever)
**Did / learned:** the human rejected the first hull starters as un-aesthetic ("ribbon wings", proportions off, not grind-worthy) and gave a precise thesis: *short arm → medial wrist → finger spokes fan OUTWARD as they spread* = a graceful wing; and *Toothless is the FLOOR, improve on him* (his wings are "a bit wide"). Research (bat/dragon anatomy: arm≈half the wing, fingers fan, trailing finger carries the back edge; Hogarth's line-of-beauty S-curve; Kindchenschema) + the code's knob-map confirmed it. Measured the failure: my Fire wing spanned +0.40→−0.96 in chord (~1.77 deep) vs Toothless +0.38→−1.36 (~2.87) — **I'd chased a "swept delta raptor" and built a thin BLADE**: high aspect ratio reads as a ribbon no matter the splay. Fix = keep SPAN moderate (narrower than Toothless, his real flaw) but **greatly increase CHORD depth + 5 fanned fingers + deep scallops + a real elbow (arc.hump 0.5)** → a full fanned membrane that's *fuller and more elegant, not wider*. Added per-form GRACE ramp (wristMedial 0.92→0.74, splay 0.10→0.24, curve 0.06→0.18: loose stubby baby → tight elegant adult, beating Toothless's static 0.84/0.18/0.14). Shipped FOUR new per-form morph variables in `dragonHull.js` (all additive/nullable → roster byte-identical): `forms[].hullSection {ex,flatTop,flatBot}` (round chubby baby → sleek adult), `model.spineArch` (cy× → posed S-curve ramp), `model.headBulge` (fattens FRONT stations → big cute baby head-DOME), and `model.eyeScale`/`eyeYOffset`/`eyePupil` (a dark **pupil** sphere).
**Gotcha / grounding:** the human's sharpest note — **"cute big eyes aren't cute in the engine, they're 2 circles."** From the chase cam the FACE does not read at all, so baby-cuteness MUST come from PROPORTION + motion (big round head-dome via headBulge, chubby round section via hullSection ex↑, stubby wings, tiny size, `formLevel`'s fast-feeble flap) — NOT eyes. Eyes/pupil only help the shop/¾ view. **Rule: translate every aesthetic ADJECTIVE into the actual renderer lever (vertices/section/emissive/scale) and verify the READ on a lit `nfview` shot — an art-word that maps to no lever is a lie.** The pupil sphere was the one real unlock that made the shop eye read "cute" instead of a blank glowing orb.
**→ Systematize:** wing aspect ratio = SPAN÷CHORD is the ribbon dial — bank "broad fanned wing = LOW aspect (deep chord), never just more span." The creature-tuning loop is: author → `nfview <key> <tier> [clay]` rear/¾ → measure against the hero → adjust the lever, not the adjective. Per-form morph (section/arch/headBulge/eye) makes ONE creature genuinely *grow up* (chubby cute → sleek elegant) on declared ramps, the cuteness/maturity arc as data.
**→ Leapfrog (innovate):** these morph knobs are reusable for EVERY future creature's life-stage arc. Next: the wing still reads thin in a mid-flap pose — add a true REST-pose render toggle to nfview (Flap:OFF) so the spread fan is judged un-folded; and the hull head is still an indistinct snout (the lost "charm") — a bolted expressive head on a hull body (hybrid, L-prev) is the open frontier. Apply the grace formula + morphs to Earth and the re-themed Water (Sea Drake) once the human signs off on Fire.

### L54 — The hull's real ugliness was PROPORTION (long neck, no belly depth, banana spine), not decoration; and the flame was a literal egg
**Did / learned:** the human supplied an ANNOTATED reference (`IMG_6770` side, red spine-line + yellow wing-lines + `IMG_6772` rear chase-cam) and said even Toothless reads as "a long thin weak drake with a long neck and oval head." Measuring confirmed it: `NIGHTFURY_PROFILE` put the cranium at z≈−3.5 with the wing-root at z≈−0.45 → a **3-unit neck**; the body section had `belly≈keelTop` (no vertical mass = a thin tube); and `cy` ran a monotonic +0.50→−0.52 = a **banana C-curve**, not the line-of-beauty S. Overhauled both Toothless (`dragonNightFury.js`, human-approved to break its byte-identical status — updated the eye/ear/dorsal feature z's + verified the no-facet gate still passes at 6.5°) and `FIRE_PROFILE`: **head pulled BACK to ~1.4 units of the wing-root (short neck), DEEP belly (belly > keelTop in the chest = muscular), low flat crown (L46 keeps the loft smooth), a real S-curve cy (head low → shoulder hump → tail sweeps down → tail-TIP kicks up), and a long thin tapering tail.** Also replaced the fire "flame" — which was literally `SphereGeometry().scale(0.9,1.25,0.9)` = an EGG — with a layered TEARDROP (nested cones tapering to a point, hotter inner lick, raked back) on the up-kicked tail tip. And pushed the wing grace harder per the human: `wingWristMedial` 0.74→**0.56** (a much SHORTER arm → wrist very medial → fingers + leading frame flare out in a convex curve).
**Gotcha / process:** I kept verifying on the ¾-REAR view, but **an S-curve and neck/belly proportions only read from the SIDE** — I never rendered it until the human forced it. AND `nfview` only renders MID-FLAP, so the wing is never shown SPREAD at rest, making the finger-flare impossible to judge in a static shot. **Rule: pick the camera that shows the feature (side for spine/proportion, top/rear-spread for wing fan); a render in the wrong pose/angle "verifies" nothing.** The decoration passes (S-curve adjectives, cute-eye knobs, flame) were lipstick on a mis-proportioned mesh — fix the skeleton proportions FIRST.
**→ Systematize:** the proportion checklist for any hull creature, measured on the SIDE clay: (1) neck length = head-to-wingroot z-gap (short!); (2) belly depth (belly channel > keelTop in the chest = mass); (3) cy is a real S (≥2 inflections, tail-tip kick); (4) tail ≈ half the length, thin; (5) wing-dominated. Author proportions to an annotated reference, not adjectives.
**→ Leapfrog (innovate):** add a Flap:OFF (spread-glide) pose to `nfview` so the resting wing fan can be judged; the hull head is still a smooth snout (no defined dragon face) — the lingering charm gap, candidate for a bolted expressive head on the hull body. Roll the proportion overhaul to Earth + the re-themed Water once the human signs off on Toothless + Fire in motion.

### L55 — Three motion/proportion fixes from a film-sculpt reference: rudder tail (not dolphin), symmetric mirror flap, panther-barrel body
**Did / learned:** the human reviewed the live preview against Night-Fury reference sculpts (rear/top/side). Three concrete fixes. (1) **Tail = lateral COIL, not a dolphin pump.** The hull tail drive was a vertical travelling wave on rotation.x (amp 0.19) phase-locked to the wingbeat — a dolphin up/down pump, wrong for a flyer. Reproduced the ORIGINAL dragons' (azure) lateral coil — a side-to-side travelling wave `sin(time*4.0 − i*0.6)` running aft — on the SKINNED chain's **rotation.y** (azure uses position; the skinned chain would tear on position), vertical cut to a subtle follow-through. (2) **Symmetric flap.** The human noticed the wings beat "at slightly different times." The MAIN flap was symmetric (`rotation.z = −side*rootFlap`, correct because the wings extend in ±x), but the FEATHER pitch used `side*feather` on rotation.x → anti-symmetric (one wing leading-edge up while the other down = a roll, read as out-of-sync). Bones are created with identity orientation (only translated), so rotation.x must be SAME-signed for both → dropped the `side`. Headless probe confirms shoulder.x L==R and z mirrored. (3) **Panther-barrel body.** The "thin weak drake" was too little girth: bumped the section `ex 2.15→2.6` (rounder barrel) and authored the torso as broad+deep chest (`halfWidth`/`belly` up ~0.68→0.80) → pinched cat WAIST → muscular HAUNCH bulge (girth back up at z≈1.0–1.3) → long thin tail. All girth lives in the SIDE/BOTTOM channels so the top-line no-facet gate is untouched (6.5°, still green).
**Gotcha:** a mirror-symmetry sign depends on the BONE's local frame. `rotation.z` needs `−side` (wings point opposite ±x, so opposite z spins both tips the same way); `rotation.x` (pitch) needs NO side (same world axis for both) — using `side` on BOTH was the bug. **Rule: derive each rotation channel's mirror sign from the bone axis + the limb's world direction, don't blanket-apply `side`.** And: a skinned bone chain is driven by ROTATION only (position tears the weld) — to port a position-based legacy motion (azure's coil) onto it, re-express the same wave on rotation.
**→ Systematize:** motion verification needs the right tool too — a headless flap-symmetry probe (build mirrored rigs, step `flapWing`, assert L/R channel equality/mirror) catches asymmetry that a static render can't; bank it alongside the weld/no-facet gates. Body girth = `halfWidth`(side) + `belly`(bottom) + section `ex`; the top-line gate only sees `cy+keelTop`, so girth is free of it.
**→ Leapfrog (innovate):** the proportion recipe is now a reusable cat/panther body macro (broad-deep chest → waist pinch → haunch bulge → thin tail); apply to Earth (heavier) + the Sea Drake (sinuous) once the human signs off on Toothless+Fire in motion. The hull head is still a smooth snout — the open charm frontier.

### L56 — A new FACETED part family: the modular system IS the tool for hard-edged creatures (the hull system is for smooth ones)
**Did / learned:** authored a brand-new "hard-edge / automotive" part family — `dragonFaceted.js` — and proved it on a
hero, **Aurum Toro** (a Lamborghini-Aventador-as-dragon). Four registered builders + three surface layers, all
flat-shaded + low-poly: **`faceted` torso** (the shipped `ARROW_PROFILE` lofted through a chiseled `wedgeRing` and
emitted `toNonIndexed()` so every triangle owns its verts → `computeVertexNormals()` gives per-FACE normals = crisp
panel creases — reusing `buildTorso` so the whole attach contract/neck/fairings come free); **`hexMembrane` wings**
(sharp swept flat panels, an inner panel on the pivot + a pointed chevron-notched outer panel on the wingTip, the
scissor-door UP dihedral BAKED INTO GEOMETRY so it survives the rig's flap writes — honors the frozen rig contract
verbatim); **`bullCrown` head** (chiseled wedge skull + forward-swept bull horns + xenon-blue octahedron eyes);
**`bladeJet` tail** (faceted taper ending in a QUAD-EXHAUST cluster whose glowing cores are pushed into `segs` so the
rig coils them with the tip). Plus reusable layers `scissorHinge`/`splitterJaw`/`aeroVents`. **The key realisation
(answering the player's "Lego vs hull?"): the new hull builders (`unifiedHull`/`organism`/`nightFury`) exist to MELT
parts into one seamless smooth loft — they are the WRONG tool for crease-heavy subjects. Hard edges are GEOMETRY, not
a shader: low segment counts + flat shading (non-indexed loft / `material.flatShading`), NOT a smoothing kernel.** The
whole creature was added as DATA + one new module: the live registry (L48) meant zero enum edits — `registerTorso/
Wings/Head/Tail` + `registerSurfaceLayer` + one import line in `dragonModel.js`, and blueprint/tricount/tiershots
auto-discovered it. Aurum Toro is also the first dragon to OPT BACK INTO mirror gloss (`bodyRoughness 0.18`/
`bodyMetalness 0.55`/`bodyEnvIntensity 0.8`) — the deliberate inverse of the matte-roster default (L45 finish work) —
proving gloss is a usable design AXIS, not just a bug to matte away. Verified: blueprint 0 warnings, `tricount --ci`
**1492 tris/form** (0 over budget, rest of roster byte-identical), `tiershots aurumToro` renders with no `PAGEERROR`
(real-WebGL). (`badges.mjs` red as always in this no-WebGL env — L48.) Gotcha banked: per-form **gloss** must ride a
form's `colors` block, because `ascendedDef` `Object.assign(d, colors)` writes TOP-LEVEL `d` and `dragonModel` reads
`def.bodyRoughness` at top level — model-key form fields land on `d.model` instead and never reach the material.
**→ Systematize:** the reusable method is a **"real-object → reusable parts" translation table** (car feature →
dragon expression → `def`/builder mechanism) + the **flat-shading-by-geometry recipe** (non-indexed loft, baked
dihedral so rig writes don't erase rest pose, glowing tips pushed into `segs` so they ride the coil). The codebase now
has TWO complementary part catalogs — SMOOTH (hull/organism) and FACETED (this) — and the choice is a documented axis:
pick by whether the subject's language is seamless skin or origami creases. Every faceted builder/layer here is
generic, so the cost of the NEXT hard-surface creature is near-zero.
**→ Leapfrog (innovate):** this opens a whole **"vehicular / mechanical / insectoid / crystalline" hard-surface
creature line** from one family (a jet = `faceted` + `hexMembrane` + no horns; a beetle = `faceted` + carapace
layers). Next moves: (1) a faceted COUNTERPART to each smooth builder so any dragon can be re-skinned sharp via a
two-string `parts` swap (the L8 hero→mechanize path); (2) promote the bull=wedge/jet=cluster geometry into grammar
knobs (`hull.section: 'wedge'|'blade'`, `tail.tip: 'jet'`) so a faceted creature is fully DESCRIBABLE (the L24/L48
promptability thesis); (3) wire the `bladeJet` exhaust cores to the live boost-trail emitter so the trail visibly
fires FROM the pipes — motion that reads the part, not just decorates it.

### L57 — "Long & skinny" is a PROFILE bug, not a decoration bug: fix the silhouette in the body stations + tail budget, not by bolting on parts
**Did / learned:** the first Aurum Toro read "long and skinny" because the faceted torso reused `ARROW_PROFILE` (a
deliberately long, slim courier body with a long thin after-body) and `bladeJet` built ~7 long tail segments. The fix
was NOT more decoration — it was a new compact body PROFILE + a shorter tail budget. Authored `BULL_PROFILE`
(dragonFaceted.js): ~27% shorter z-span, a hard-compressed after-body (tail root 1.70→1.10), much wider half-widths
(deep barrel chest 0.66→0.86), a tall muscular shoulder hump, a pinched-waist→haunch bulge (reusing the L55 panther
recipe), and a short neck — and the `faceted` torso now lofts from it (one-line swap; the attach contract is unchanged
because `buildTorso` reads the profile, so wings/head/tail still mount correctly). Also: SHORTENED the wings into a
sharp swept DELTA by pulling the span constants in hard (`WX 2.7→1.5`, `TX 2.0→1.0`) while keeping the chord — span,
not chord, was the "skinny"; and stubbed the tail (segLen 0.7→0.42, n 7→4, faster taper). Added two reusable SVJ aero
layers — `svjWing` (a fixed aerofoil blade on two uprights, raked, amber-edged) + `diffuser` (vertical carbon fins) —
swapped in for `backCrest`, and pulled the quad-exhaust tight + high-central (the SVJ stacked-pipe read). Verified:
blueprint 0 warnings (the two new layers register live), tricount 1516/form 0-over, tiershots no PAGEERROR; the rear
montage confirmed a compact broad mass replacing the thin sliver.
**Gotcha:** the wing read "skinny" because of SPAN (the `WX`/`TX` reach), not chord — shortening reach while keeping
chord turns a thin paddle into a broad delta. Diagnose silhouette complaints by which AXIS is wrong (length vs girth
vs span), not by reaching for more geometry.
**→ Systematize:** `BULL_PROFILE` is now a reusable **compact "muscular/vehicular" body macro** sitting next to the
L55 panther macro — a creature picks a profile the way it picks a builder. And the rule **"silhouette = proportion
(stations + segment budget), decoration = surface layers; fix the read at the right layer"** generalises every
"looks wrong-shaped" note. The SVJ `svjWing`+`diffuser` pair joins the automotive aero-layer kit (scissorHinge /
splitter / vents) any hard-surface creature can compose.
**→ Leapfrog (innovate):** a small **library of named body profiles** (courier/arrow, serpent, panther, bull) + the
faceted vs smooth builder axis means a new creature's whole stance is two data choices (profile + part family). Next:
promote the profile choice into a grammar knob (`hull.profile: 'bull'|'arrow'|…`) so stance is describable, and add a
mid-weight profile between arrow and bull to cover "athletic" creatures without a new constant each time.

### L58 — A tail needn't coil: a RIGID structural rear + control-surface flaps on the `tailFins` hook (the "car/mecha" tail); and the cross-section RING is the boxy-vs-organic knob
**Did / learned:** the player wanted Aurum Toro's rear to read like a Lamborghini SVJ (boxy, with a spoiler) and the
movement to come from spoiler flaps "like a plane's tail stabilizers." Three moves. **(1)** The cross-section RING is
the silhouette knob: swapped the faceted torso's pointed-diamond `wedgeRing` for a BOXY trapezoid (flat top deck,
near-vertical chamfered sides, flat wide bottom) → the whole body, especially the narrow rear, lofts as a box (the
mecha/car read) with zero other changes. **(2)** A tail builder needn't be a coiling chain: `svjRear` returns
`segs: []` (the verified `none`/`cometWake` rigid-tail path) — a static transom carrying the SVJ wraparound tail-light
bar (straight top frame + Y-chevron clusters + a thin middle runner; one emissive mat tagged `baseEmissive/
baseIntensity` → `accentMats` so it Surge-flares), central exhausts and a vertical-finned diffuser. **(3)** The MOTION
comes from two stabilizer flaps returned in **`tailFins`** — the EXISTING hook that already deploys on boost
(`tailDeploy` 0.82→1.08) and deflects into turns (`bankGain·turnBias`); I added ONE additive, GATED line in the
`tailFins` loop (dragon.js) + `makePreviewTick` (dragonModel.js) that adds an up/down pitch flutter ONLY when
`userData.flapFlutter` is set — so the flaps act like aircraft elevators while every other `tailFins` dragon (Obsidian,
Night Fury) stays byte-identical. Also framed the delta wings with carbon leading/trailing/tip BARS (a `frameBar(a,b,
th,mat)` helper) for the mecha-panel read. Verified: blueprint 0 warnings, tricount 1536/form 0-over, tiershots no
PAGEERROR; the rear montage now reads as a boxy car-tail with a horizontal light bar + diffuser, not a pointed blob.
**Gotcha:** `makePreviewTick` does NOT animate `tailFins` at all (only `tailSegs`/spine/head/body), so shop-preview
motion for a new fin needs its own gated line there — and gating on the same `flapFlutter` flag keeps every existing
dragon's preview untouched.
**→ Systematize:** the part-authoring vocabulary now has THREE orthogonal stance knobs — **profile** (arrow/serpent/
panther/bull), **cross-section ring** (organic wedge vs boxy/mecha), and **tail kind** (coiling chain / rigid structure
/ control-surface flaps) — each a small data/recipe choice. And the **gated-`userData`-flag** pattern (flutter only
fires where flagged) is the safe, byte-identical way to add NEW rig motion without a contract change — reusable for any
future driven appendage (thrusters, antennae, landing gear).
**→ Leapfrog (innovate):** with a rigid-structure tail + control-surface flaps proven, a whole **vehicle/mecha creature
class** is in reach (jets, walkers, drones) where "limbs" are aero/mechanical surfaces driven by flight state. Next:
expose ring-shape + tail-kind as grammar knobs (describable mecha), a panel-line surface shader for the boxy plating,
and drive the exhaust/flutter from the SAME flight-state signals the wings read so the whole creature animates as one
aircraft.

### L59 — A full creature can be a reusable hard-surface KIT (`mechaKit.js`): pure, material-injected, socket-bearing modules the registered parts merely COMPOSE; and a body part the pipeline lacks (legs, thrusters) lives as a surface layer reading `attach.*`
**Did / learned:** rebuilt Aurum Toro from scratch as an SVJ mecha-dragon, but the real win is the **factoring**.
Extracted `mechaKit.js` — a library of PURE, `seg()`-wrapped, **material-injected** (zero palette coupling) hard-surface
primitives with **named sockets**: `hexPrism`, `spineSegment`(core+armor+fore/aft/dorsal sockets), `wedgePanel`,
`ventPlateRow` (the 3-slash vent), `hexGrille`, `chevronLight` (taillight), `diffuserArray`, `thrusterPod` (housing+frame+
glowing core), `mechaLeg`, `frameBar`, `wedgeRing`. The four registered builders (`svjEngineBay` torso, `bladeWing`
wings, `svjDragonHead`, `segmentedAeroTail`) and five surface layers (`engineBay`/`ventSlashes`/`twinThrusters`/
`rearDiffuser`/`mechaLegs`) are now just **assembly graphs** over the kit — geometry in the kit, palette + Surge-flare
tagging in the builders. Because the registry + attach-contract + `tailFins`/`segs` hooks already ARE the assembly graph,
this needed **zero engine changes** (no `dragon.js`/`dragonModel.js`/registry edits) and the whole shipped roster stayed
byte-identical (tricount unchanged, blueprint 0 warnings, aurumToro 2658 tris/form). Two reusable patterns fell out:
**(1)** a limb the model pipeline has no slot for (legs, thrusters) is a **surface layer reading `attach.halfWidthAt(z)`/
`bodyMidY`/`tailAnchor`** — body-mounted hardware without a rig hook; **(2)** a part that should stay tucked in flight
bakes its **folded pose into the group transform** (static rotation, never rig-driven). Also confirmed the THREE dominant
chase-cam shapes (huge cropped blade wings → bulky twin-thruster engine block → long armored coiling tail w/ big
stabilizer blades) are what carry the read; the cheap greeble (vents/chevrons/grilles) is **medium**-priority precisely
because it's REAR-facing and fills the chase view. Built deliberately OVERSIZED to judge proportion first, then shrink
via `model.scale`.
**Gotcha:** the engine's forward axis is **−Z** (head at `−z`, tail at `+z`); a spec written `+Z`-forward must be
mapped, not pasted, or the creature builds backwards. And the non-skinned tail rig writes each seg's `position.x/y`
ABSOLUTELY from a damped wave (only `z` is the build-time chain) — so armor/fins/taillights must be **children of their
seg** to ride the coil, and a stabilizer mounted near the tip rides the coil AND deploys (compound motion) when it's both
a child of a rear seg and in `tailFins`.
**→ Systematize:** `mechaKit` joins profile / cross-section-ring / tail-kind as the reusable **hard-surface vocabulary**;
"material-injected pure module + named sockets" is the template for the next part family, and "body-mounted limb via a
surface layer reading `attach.*`" is the escape hatch for any part the four-slot pipeline lacks.
**→ Leapfrog (innovate):** the kit unlocks composable mecha/vehicle creatures from a parts bin — next, a socket-driven
**auto-greeble** pass (scatter vents/grilles/lights along a part's sockets by rule) and a panel-line surface shader so the
plating reads as paneled metal without extra tris.

### L60 — "Start fresh" means clean-room, not reskin: a torso can publish the attach contract WITHOUT `buildTorso`/a profile; and a lofted body always reads rounded in side-profile (boxiness is a harder problem than the cross-section ring)
**Did / learned:** the first SVJ rebuild was honestly a **reskin on the bull's bones** — `SVJ_ENGINE_PROFILE` was
`BULL_PROFILE` widened, the wings were the `hexMembrane` vertex layout scaled, the tail fins were `svjRear`'s values
copied. When the player asked "fresh or reusing the old design?", the honest answer was *reusing* — so they chose a
**clean-room rebuild**. Key realization: the **attach contract is just a return shape**, not something only `buildTorso`
can produce. A torso builder can hand-assemble a bespoke hull (a fresh angular loft + bolt-on plates + its own neck) and
publish `{group, attach}` with `wingRoot/headBase/tailAnchor/keelTopAt/halfWidthAt/bodyMidY` computed directly from its
own geometry — zero profile/loft inheritance, full control of the mecha silhouette, and wings/tail/head/layers mount to it
unchanged. So "reuse only the engine contracts" is literally achievable: registry + the contract SHAPE + the frozen rig +
`{segs,tailFins}` + Surge-flare, nothing of the donor's design data. Result: a far better-defined wedge **head** and a
coherent creature; the rear/¾ (the gameplay angles) read as a chiseled twin-thruster engine block.
**Gotcha:** a lofted body **reads rounded from a pure side view no matter how angular the cross-section ring is** — chines
help the rear/¾ read but the side stays teardrop, because the silhouette there is the station taper, not the ring. True
slab-sided boxiness needs a different construction (literal box-section fuselage / flat side plates), not just a sharper
ring. Also: that stray light-blue diamond on the snout in static renders is the engine's **aiming pip**
(`dragonModel.js`, `OctahedronGeometry` + `depthTest:false`, omitted only when `opts.preview`) — a gameplay HUD aid, not a
model bug. And `buildDragonModel(def, {})` (no `preview`) includes it, so isolated render harnesses will always show it.
**→ Systematize:** "hand-authored attach contract" joins `buildTorso`-via-profile as a torso construction option — pick
profile-loft for organic bodies, bespoke-assembly for hard-surface ones. **→ Leapfrog:** for genuinely boxy mecha bodies,
add a `boxFuselage` primitive (chained slab sections with hard side plates) so the side silhouette is as chiseled as the
rear.

### L61 — Matching a SIDE reference is mostly additive layers, not body reshaping; reuse the shingle/shader/spine systems and spend the tri budget on scales; flat blade-wings read as thin spikes edge-on
**Did / learned:** the player gave a true side-profile render (a grounded gold quadruped: carbon-hex underbody + gold
plates, dorsal spike crest, blade-fan wings with a glowing red-hex membrane, four legs, crested head). My lofted body was
~30–40% there. The fix was **almost entirely additive surface layers**, not torso geometry: (1) `cellularScalesNormal`
**surface shader** (`def.parts.surface.shader`, 0 tris) for the carbon-hex micro-relief — `bodyMat.clone()` in a
hand-authored torso inherits the patch; (2) a `svjScaleArmor` layer calling **`shingle()`** (`dragonShingle.js`) twice —
a black carbon scale run on the lower flanks + a gold plate-scute run on the back — reading `attach.halfWidthAt/keelTopAt/
bodyMidY`, which is also the cheapest way to **spend the tri budget** (each cupped card ~2 tris merged into one draw call;
this carried ~2,300 of the ~3,200 I added, 2128→5320); (3) a `svjDorsalSpine` layer running raked cones along
`attach.keelTopAt(z)`; (4) a head crest = a fan of cones on the existing head. Only a light **station reshape** (arched
topline via the `top` column, tucked mid-belly via the `bottom` column) was needed on the body itself. Net: a strong side
match with zero engine edits, HIGH 5320 / ULTRA 9698 (both in budget). Confirmed the surface-layer pipeline adds meshes in
**body-local model space** so layers reading `attach.*` just work.
**Gotcha:** **flat (single-/double-tri) blade geometry reads as a thin SPIKE when viewed edge-on** — a fan of up-swept
blades looks solid in ¾ but becomes thin radiating rays from the dead-rear chase cam (and a gold edge catching the cool
rim light desaturates to a stray **greenish** sliver, easily mistaken for unwanted cyan). Give silhouette-critical blades
real width/thickness, or accept the "spiky fan" rear read as the style. Also: `shingle()` `cardRows/cardCols` go through
`seg()`, so they **4× at ULTRA** — keep card counts modest or check `tricount --detail=ultra` (not just the HIGH `--ci`).
**→ Systematize:** the reference-match playbook = shader (free texture) + `shingle` (budgeted scale geometry) + dorsal
`attach.keelTopAt` cones + a station reshape — reusable for any "armor up this body to a reference" task.

### L62 — A scrapped design is one git-restore away when its builders stay registered; and `setPointerCapture` on `pointerdown` without a direction threshold silently eats page scroll
**Did / learned:** TWO small things. **(1) A/B comparison via a parallel roster entry.** The player wanted to compare the
scrapped "lambo bull" Aurum Toro against the SVJ rebuild *live in the shop*. Because the coexist-rollback rule kept the v1
bull builders (`faceted`/`hexMembrane`/`bullCrown`/`svjRear` + layers) REGISTERED even after `aurumToro` stopped using
them, restoring the whole design was just re-adding a `DRAGONS` entry (`aurumToroBull`, recipe lifted verbatim from
`git show 408abc9:…/dragons.js`) — zero builder work, and the shop auto-lists `Object.keys(DRAGONS)` so it appeared with
no shop/ascension wiring (blueprint.mjs is the integration gate; it passed). So "keep the old builders registered" pays off
not just as rollback but as **free side-by-side comparison of two whole designs**. **(2) The flaky shop-scroll bug.** The
DRAGONS-tab turntable (`.hero-canvas`) called `setPointerCapture()` in `pointerdown` and had `touch-action:none`, so a
VERTICAL swipe that happened to start on the turntable was captured for rotate and stolen from the `.shop-scroll`
container → "I have to try in different spots; sometimes it scrolls, sometimes not" (it worked only when the swipe started
off the canvas). Fix = **defer the capture/rotate until the gesture is confirmed HORIZONTAL** (`|dx|>12 && |dx|>|dy|`;
vertical intent drops the drag so the browser scrolls) + set the canvas `touch-action:pan-y` (mirroring the already-correct
`.skin-preview` shop cards) so the browser routes vertical natively. Also gave the small `.hero-thumb canvas` thumbnails
`pan-y`.
**Gotcha:** an interactive `<canvas>` inside a scroll container is a scroll TRAP by default — the global
`canvas{touch-action:none}` (right for in-game steering) plus any pointer-capture-on-down means every drag-rotate surface
silently blocks scrolling unless it (a) declares `touch-action:pan-y/pan-x` AND (b) only captures after a
direction-disambiguating move threshold. Verify touch behaviour on the live preview — headless can't drive it.
**→ Systematize:** any new drag/rotate canvas in a scrollable screen needs the **pan-axis + move-threshold** pair; bake it
into the shared `onTap`/drag helper so the trap can't recur.

### L63 — Never (re)start Web-Audio scheduling from a `visibilitychange`/non-gesture event; resume the context, but only schedule once it's genuinely `running`
**Did / learned:** the player reported that on mobile, switching apps and returning made the music play "at a slow rate"
(pitched-down / garbled) — "not professional, turn it off." The synth (`sfx.js`) already had a background path
(`pauseForBackground`/`resumeFromBackground`, wired to `visibilitychange`/`pagehide`/`blur`/`focus`), but it
**force-restarted the music from `resumeFromBackground`** — which fires on a NON-gesture event. On iOS,
`AudioContext.resume()` needs a user gesture, so the context is still effectively suspended and its `currentTime` has
**jumped forward** while hidden; rebuilding the scheduler (`loopOffset = currentTime + 0.05`) then emits notes against an
incoherent clock → the slow/garbled playback. A second bug: `pauseForBackground` suspended the context on an **80ms
`setTimeout`**, leaving a window where the throttled background audio thread rendered a slow burst on the way out. Fix
(all in `sfx.js`): (1) on background, zero both buses with `setValueAtTime(0)` and `ctx.suspend()` **immediately** (no
timer); (2) `resumeFromBackground` no longer calls `start()` — it sets `resumeMusicPending` and tries `ctx.resume()`; (3)
a new `tryResumeMusic()` restarts the music **only when `ctx.state === 'running'`**, invoked from the resume promise
(desktop/Android resume instantly) AND from the existing gesture handler `unlockAudio()` (iOS resumes on the next tap).
Net: background = instant silence; foreground = clean restart from a running clock, never garbled.
**Gotcha:** `AudioContext.resume()` is **async** and **gesture-gated on iOS** — calling it from `visibilitychange` returns
a promise that may never resolve until a tap, and reading `currentTime` right after resume gives a stale/jumped value.
Treat "context is running" as the only safe precondition for scheduling, and drive resume from real user gestures.
**→ Systematize:** route ALL "(re)start audio" through a single `tryResumeMusic()`-style guard that checks
`ctx.state === 'running'` and is fed by both the resume promise and the gesture unlock — never schedule speculatively from
a lifecycle event. **Caveat:** iOS background-audio timing can't be reproduced headlessly — this one needs on-device QA.

### L64 — A "different dragon" = different WING + TAIL builders on the SAME body, not a reshaped torso; and `svh` + an installed-PWA class beats `vh` for "fit in browser, roomy in app"
**Did / learned:** the player compared two SVJ dragons and said we'd "reused too many assets — the wings and tail look quite
similar, only the body shape changed." The fix that actually reads as a new dragon was to keep the recognizable SVJ body
verbatim (`svjHull` torso, `svjWedgeHead`, the `svjScaleArmor`/`svjDorsalSpine`/engine layers, the cellular-scale shader,
gold/carbon/red palette) and author **two brand-new part builders**: `svjJetWing` (a *layered* jet-blade wing — shoulder
hinge + upper boom + main swept yellow blade + black vent panel/hex grille + 3 red chevrons + 4 controlled trailing flaps +
endplate + secondary top blade, mapped onto the FROZEN rig: inner modules ride `wingPivot`, outer blade + endplate ride
`wingTip`) and `svjAeroTridentTail` (9 armored segments returned as `segs` so the rig coils them, ending in a 3-prong tip:
central dark spear + two swept side aero-stabilizer fins with red taillight slashes). New dragon `aurumToroMk2` registered;
the old "Mk I" reskin (`aurumToroV2`, "ugly — get rid of it") deleted from the roster, its builders left registered-but-dormant
for rollback. 5564 tris (≤6000). The silhouettes now genuinely differ (single broad blade + spear → stacked multi-blade
jet-wing + trident) instead of just a body reshape. **Separately**, the shop's DRAGONS turntable used `.hero-stage { width:
min(100%, 42vh) }` — `vh` *overshoots* in a mobile browser (the URL bar steals height that `vh` still counts), so the screen
overran the viewport and forced a page-scroll that fought the swipe-to-rotate gesture. Fix: switch to `svh` (small viewport
height, excludes the URL bar) at a smaller 34svh for browser, and toggle `html.standalone` from `main.js`
(`matchMedia('(display-mode: standalone)')` for Android + `navigator.standalone` for iOS) to restore the roomy `42svh` only
when installed as a PWA (no URL bar to fight).
**Gotcha:** mapping a richly-specced wing onto the frozen 2-bone rig means deciding *per module* whether it rides the
flapping root (`wingPivot`) or the lagged wrist (`wingTip`) — get that split right and the engine needs zero edits. Flat
upward-facing top faces (e.g. a secondary top blade) catch a cool rim light as a white/blue blowout in the render harness;
it's largely a harness-lighting artifact, so the player judges it under real game lighting on the live preview.
**→ Systematize:** "new selectable dragon" should default to *new wing + tail builders on the shared body kit*, not a torso
profile edit — it's cheaper, stays on-budget, and is what reads as a different creature. For any full-viewport mobile screen,
prefer `svh`/`dvh` over `vh` and gate the roomy layout behind an installed-PWA class. **Caveat:** shop-height fit and the
wing's white-flat blowout are visual/feel calls — verify on-device / on the live PR preview, not headlessly.

### L65 — Re-mass ONE sibling without touching the other: parametrize the SHARED builder with default-1 knobs, set values on the one recipe; the "reads thin/flat" fix is massing + shape hierarchy, not more greeble
**Did / learned:** the player's second pass on Aurum Toro Mk II said it still reads as a "flat gold glider / skinny stick
body," and the fix is **stronger massing + shape hierarchy + SVJ aero language**, not more detail. But Mk II shares its torso
(`svjHull`), head (`svjWedgeHead`) and thruster layer (`twinThrusters`) with the shipped `aurumToro`, which must stay
byte-identical (the A/B compare). The clean pattern: **add optional knobs to the shared builder that default to today's exact
values** — `svjHull` reads `model.{torsoWidthScale,torsoHeightScale,rearBulkScale}` and builds a scaled copy of its
`SVJ_STATIONS` (rear-only bulk via `z >= -0.15 ? rbs : 1`) before lofting, scaling `attach.wingRoot(side).x` so the wings ride
the new shoulder edge; `svjWedgeHead` reads `model.{headLenScale,headHeightScale}` to stretch the skull longer/lower;
`twinThrusters` reads `def.thruster.{rOuter,rCore,spread,z,intensity}` for a bigger/brighter pod. Each knob is `?? <current>`
so the default path is provably inert — `tricount` showed `aurumToro` **unchanged at 5516 tris** and its render pixel-identical,
while Mk II got a broader engine-bay torso, thicker proximal tail (first-half segs ×≈1.22→1.06), longer wedge head, and dominant
thrusters — all set on the **one recipe**. Wing/tail builders unique to Mk II (`svjJetWing`/`svjAeroTridentTail`) were edited
freely (bigger black vent inset, lower secondary blade, sharper trident). All re-massing was scaling existing geometry → tri
count held (5564, ≤6000), no new draw calls.
**Gotcha:** when a builder was restored from git for rollback (here a dormant duplicate head `svjDragonHead`), the SHARED
geometry lines are **identical** in two functions — an Edit on the live builder fails "2 matches"; anchor the edit on the unique
function-signature block, not the shared body. Also `svjHull` is a *custom* builder (not `buildTorso`), so the engine's
`model.shoulderWidthScale` (handled in `dragonTorso.js`) is a **no-op** for it — the torso must read its own width knobs.
**→ Systematize:** "make this one bulkier/longer but don't change its sibling" = parametrize the shared builder with
default-current knobs + set them on the single recipe; never fork the builder or edit shared geometry in place. **Caveat:**
final massing/aero read is a feel call — tune the knob values to the render and let the player judge the live preview.

### L66 — A hidden-scrollbar `overflow-x:auto` rail has NO desktop drag and a flaky iOS pan: fix with `touch-action: pan-x` on the rail AND its cards + a non-touch pointer drag-to-scroll
**Did / learned:** the player couldn't move through the shop's bottom dragon-select rail (`#hero-rail` /
`.dpick-rail`) — "drag to go Azure → Bull doesn't respond." Two distinct causes for one symptom: (1) the rail
scrolls only via native `overflow-x:auto` with the scrollbar hidden (`scrollbar-width:none`), and a native
overflow scroller with no visible scrollbar has **no click-drag** — desktop mouse users literally cannot drag
it (only shift-wheel/trackpad); (2) the rail and its `.hero-thumb` cards declared **no `touch-action`**, so
inside the vertical `.shop-scroll` parent iOS WebKit favored the vertical scroller and a horizontal swipe that
*started on a card* got eaten — only swipes landing in the gaps scrolled ("find the right place for the
finger"). Fix: add `touch-action: pan-x` to **both** the rail and the cards (declare horizontal intent so the
swipe pans the rail, not the parent), plus a JS pointer drag-to-scroll on the rail **gated to non-touch
pointers** (`e.pointerType !== 'touch'` → `setPointerCapture` + `scrollLeft = start - dx`); touch keeps its
native momentum so there's no double-scroll. The drag threshold (10px) is set to the **same** value as the
existing `onTap` tap/scroll guard, so a gesture is unambiguously either a tap (selects) or a drag (scrolls).
**Gotcha:** `touch-action` is resolved at the element the touch lands on — putting `pan-x` only on the scroll
*container* isn't enough when the touch starts on an interactive child (the card); the **child** needs it too.
And a tap-vs-drag system only stays consistent if every handler on the element shares one movement threshold.
**→ Systematize:** any custom-styled horizontal carousel = `touch-action: pan-x` on container **and** items +
a non-touch drag-to-scroll; never ship a hidden-scrollbar `overflow-x` rail as the only scroll path (desktop
can't drag it). **Caveat:** drag/touch-pan can't be driven headlessly — verify on the live PR preview.

### L67 — "Reads like a glider, not an SVJ mecha" = a few named hard-surface MODULES (as Mk II-only layers) + a wide-LOW torso + a bloom-lit emissive hierarchy, not micro-detail
**Did / learned:** Mk II was better but still read as a "gold low-poly glider wyvern." The player's fix was
explicit: *don't add random detail — add specific silhouette/hard-surface modules.* Implemented as a 5-module
identity pass, all scoped to Mk II so the shipped `aurumToro` stayed byte-identical (5516 tris, unchanged):
**(1)** a wide-but-LOW torso — the prior pass's uniform `torsoHeightScale: 1.10` had inflated the loft into a
round/pear abdomen; the fix was to drop it to 1.0 and add a `bellyFlatten` knob that squashes ONLY the central
station (`z∈(-0.45,0.30)`) while keeping shoulders + rear engine-bay broad — lateral width + a per-zone
vertical squash, never a global Y bump. **(2)** `svjShoulderNacelles` (NEW layer) — yellow pods + black
intakes at `attach.wingRoot(side)` so the wings plug into an engine bay. **(3)** `svjSpineArmorCaps` (NEW
layer, swapped in for the thin `svjDorsalSpine` spikes on Mk II) — yellow wedge caps + black base gaps along
`keelTopAt` for a "vertebrae" rhythm, continued per-segment down the tail. **(4)** wing depth — thicker
leading boom + enlarged wingtip endplate so the blade stops reading paper-flat. **(5)** sharper aero-trident
tail tip. Plus a **layered thruster** (black housing → yellow armor frame → saturated-red turbine ring
[2.6] → bright orange hot core [4.2] → warm-white hotspot): the emissive intensities form a deliberate
HIERARCHY (core 4.2 > ring 2.6 > wing chevron 1.8) so the twin cores are the brightest red-orange and read
first — and since the pipeline already runs `UnrealBloomPass` (`postfx.js`/`preview.js`), the high emissive
blooms for free, so **no fake additive halo disc is needed** (it would fight the real bloom). Landed at 5852
tris (≤6000). **Gotcha:** the player's "outerDiameter 0.50" etc. are DIAMETERS — the `thrusterPod` knobs are
RADII; passing the diameter (0.46) as `rOuter` doubles the pod. Always reconcile diameter-vs-radius. And the
angle-render harness has no bloom pass, so emissive brightness/glow can only be judged on the live preview.
**→ Systematize:** identity work = a small set of *named, on-budget hard-surface modules* added as recipe-only
layers (coexist, sibling byte-identical), not scattered greeble; and brightness reads come from an emissive
intensity hierarchy under the existing bloom pass, not new geometry. **Caveat:** silhouette/glow are feel
calls — judge on the live preview, iterate the knobs.

### L70 — A 3-segment articulated wing on the frozen 2-bone rig = a nested wingMid group + a null-gated animation branch; L/R stay synced (mirror by sign, never phase-offset)
**Did / learned:** the player wanted Mk II's wing to move like a mechanical 3-part aero blade (inner→mid→tip
follow-through) instead of one board on a single hinge — and crucially, the LEFT and RIGHT wings must flap
TOGETHER (any lag is WITHIN a wing, root→mid→tip, never BETWEEN wings). The engine's frozen wing rig already
drives L/R synchronized (opposite amplitude SIGN, same integrated `flapPhase` clock — not an offset phase), and
already supports extra joint slots (`wingPivot2`, skinned `wingRig`). Cleanest path without touching any other
dragon: in `buildSvjJetWing`, nest a **`wingMid` group** between `wingPivot` (inner) and `wingTip` (tip) —
`pivot → wingMid → wingTip` — split the geometry at 36%/73% of span with each segment built in its OWN local
frame (subtract the joint origin so a child rotation pivots at the joint, not the mesh centre), add a yellow
hinge-cover plate + a tiny anti-clip Y lift at each joint, and return `wingMidL/R`. Thread `wingMid` through
`dragonModel.js` (both return paths + the preview animator), and in `dragon.js` add a **`wingMidL`-gated branch**
in the frozen-rig path: inner = the existing pivot flap; mid/tip get `sin(phase−0.22)`/`sin(phase−0.38)` RELATIVE
lag at small amplitudes, **clamped** (≤14°/≤8°) and boost-stiffened, with L/R using the SAME phase (mirror by
sign only) — and I removed the old per-wing tip phase asymmetry (0.95 vs 1.18) for this dragon so any lag is
purely within each wing. Every other dragon hits the `else` (wingMid null) → byte-identical (`aurumToro` 5516,
unchanged). **Separately**, a Surge-only "jet afterburner" trail: tag invisible emitter `Object3D`s at the
thruster mouths in the `twinThrusters` layer (gated behind the Mk II `def.thruster.frame` flag), collect them
once at `createDragon` via `group.traverse`, and emit a short additive sprite stream from their world positions
when `model.formLevel ≥ 3` (Eternal) AND `player.feverActive` (Surge), tinted to `def.surgeHi` (the colour Surge
flares the wing). Reused the existing trail-sprite pool pattern; bloom lights it.
**Gotcha:** when re-splitting a wing into nested joint groups, geometry built in the PIVOT frame must be
re-expressed relative to each child's origin (a `sub(p, origin)` on every vertex) or the child rotates around the
wrong point. Watch the tri budget — extra hinge covers/booms pushed it 44 over 6000; trimming the cover to a
single plate + dropping a root block + the tip boom got it back under. And the render harness can't show flap
MOTION or bloom — silhouette/structure is verifiable headlessly, but timing/glow is a live-preview call.
**→ Systematize:** add an articulated segment to the frozen rig by returning a new nested joint group + a
presence-gated animation branch; keep multi-limb symmetry as same-phase/sign-mirror, never offset phases.

### L71 — A flap "wave" needs BIG phase lags + per-wing direct-set from ONE shared phase; per-wing damp() and same-sign turn terms are what make it stiff + desync L/R
**Did / learned:** the first 3-part wing (L70) still read as "three stiff rods rotating together" and the L/R
sides looked ~1 frame out of phase. Two root causes: (1) my segment lags were tiny — `sin(phase−0.22)` /
`sin(phase−0.38)` ≈ 0.035 / 0.06 of the 2π cycle — so the thirds moved almost in lockstep (no visible
root→mid→tip travel); (2) each segment was driven through `damp(current, target, …)` (a per-wing easing
FILTER) and the flap target added `turnBias` with the SAME sign to both wings — so any lateral velocity made
L and R asymmetric, and the per-wing filters were independent easing states that could drift. Fix: drive the
Mk II wing **directly from the one shared, continuously-integrated `flapPhase`** (no per-wing damp), with REAL
lags — `MID_LAG 0.62`, `TIP_LAG 1.25` rad (≈0.10 / 0.20 of the cycle) — and bigger relative amplitudes
(mid 0.26, tip 0.34) so the tip whips. L/R became a **pure sign-mirror**: compute each segment's pose scalar
once, assign `R = −pose`, `L = +pose`; the turn/bank term was removed from the flap entirely and re-expressed
as amplitude scale (`1 − 0.30·side·bank`) + a static z bias (inside wing tucked, outside spread) — pose only,
never phase. Added segment twist (`cos(phase−lag)`, pitch to catch air) and an upstroke fold
(`max(0,sin)·rotation.y`). Gated to `else if (wingMidL)` so every other dragon keeps its damped path
byte-identical (`aurumToro` 5516, unchanged).
**Gotcha:** the user's rule "no separate timers/accumulators/easing states per wing" specifically rules out
per-wing `damp()` — ONE shared phase is fine (and required), but the two wings must be a stateless sign-mirror
of it. And any additive turn/bias term on the oscillation must be a pure mirror (`±side`) or it desyncs L/R;
keep banking on amplitude + static bias, never on phase. Flap MOTION still isn't headless-verifiable — silhouette
builds + boot are, but timing/feel is a live-preview call.
**→ Systematize:** articulated flap = one integrated phase → per-segment `sin(phase − lag_i)` with lags that are
a real fraction of the cycle, direct-set, L/R sign-mirror; reserve damping for noisy INPUTS (shared), never as
the per-wing motion itself.

### L72 — Per-FORM evolution = per-form knobs in forms[] (accrete onto model) + builders branching on level knobs + a flap-shaping `glidePow`; gate the layered read on the opt-in flag, not the form level
**Did / learned:** made Aurum Toro Mk II's four ascension tiers read as one dragon's evolution (Hatchling baby →
Kindled teen → Radiant adult → Eternal overlord), working backwards from the current = Eternal. `ascendedDef`
already Object.assigns each `forms[t]`'s non-`colors` keys onto `model` (later forms win), so per-form GEOMETRY
is just per-form knobs in `aurumToroMk2.forms`: proportion scalars (`bodyScale`/`wingSpan` drive the size ramp;
`torsoWidthScale`/`bellyFlatten`/`headScale`/`eyeScale`) + FEATURE LEVELS (`wingParts` 1/2/3, `thrusterLevel`,
`nacelleLevel`, `spineCapLevel`, `tailTip`, `hornLevel`). The builders/layers read those and branch — the wing
builder returns 1 / 2 / 3 nested segment groups; the thruster/nacelle/spine layers self-gate (level 0 →
`return {meshes:[],flareMats:[]}`) and scale by level; the tail tip grows spear→fork→trident; the head scales +
drops horns. Per-FORM ANIMATION rode the same channel: `flapFreqScale`, `rootAmp/midAmp/tipAmp`, `midLag/tipLag`,
`bodyBobScale`/`headWobbleScale`/`tailLagScale`, and the key knob **`glidePow`** — the flap waveform is
`sign(sin)·|sin|^glidePow`, so high `glidePow` (Eternal 2.6) HOLDS the broad glide pose and pulses through
rarely ("commands the air"), low (Hatchling 0.8) flaps frantically. One unified `else if (model.wingParts)` drive
handles 1/2/3 segments via null-checks, keeping the L71 shared-phase sign-mirror. Tris dropped for younger forms
(Hatchling 4424 → Eternal 5948 ≤6000); `aurumToro` + roster byte-identical.
**Gotcha:** the layered thruster (frame/hot-core/emitter) had been gated on `if (t.frame)`; when I re-gated it on
`thrusterLevel>=3` I dropped the `t.frame` check and `aurumToro` (which sets `thrusterLevel` via the default `??3`
but has NO `def.thruster.frame`) suddenly grew the frame (+168 tris). Always keep the opt-in flag in the gate
(`layered = !!def.thruster?.frame`) so a shared layer's new per-form path can't leak into other dragons. And the
default `?? <eternal>` on every knob is what keeps non-Mk-II dragons untouched.
**→ Systematize:** an evolution line = data-driven per-form knobs + level-branching builders; "glide vs frantic"
is one `|sin|^p` shaping knob, not a state machine. **Caveat:** the render harness auto-frames each form (hiding
the absolute-scale ramp) and can't show MOTION — verify the size/feel progression on-device.

### L73 — Universal wing VFX (edge trails + hard-bank aero-shear) reuse the sprite pool from the wingtip markers; Surge emission inherits the equipped flightmark colour
**Did / learned:** added three Surge/aero VFX to Mk II by reusing the existing THREE.Sprite additive-pool pattern,
all emitting from the `tipMarkerL/R` wing-tip markers. (1) Wing-edge tip trails — thin streaks, WHITE at cruise/
boost, and the **player's custom trail colour during Surge** (`activeDef.hasStyle ? pickTrailHex(activeDef.trail)
: 0xff4fd8` magenta-pink fallback), intensity ramped per form (`[0.05,0.18,0.45,1.0][formLevel]`). (2) Hard-bank
aero-shear / wingtip vortex — WHITE vapor only when `speedNorm>0.58 && bankHard>0.5`, with the OUTSIDE wing
(opposite the turn: `side === -sign(turnBias)`) getting the stronger streak (×1.0 vs inside ×0.45). (3) The
thruster afterburner now also inherits the custom trail colour. All gated behind `isMk2 = !!model.wingParts` for
now (the rest of the roster byte-identical) — generalising to every dragon is a one-line gate change once
approved. Pools are small (36 / 28) and `quality`-scaled so weak mobile stays cheap.
**Gotcha:** "custom trail colour" ≠ "the dragon's default trail" — only use it when `activeDef.hasStyle` (a
flightmark is equipped), else the personalised fallback; otherwise every dragon would surge in its own boring
default. **→ Systematize:** new emitter-based VFX = one more pool fed by an existing marker + a per-form intensity
LUT; colour-personalised effects key off the equipped-cosmetic flag, not the base def. **Caveat:** trails/bank
vapor only show in motion — verify on the live preview.

### L74 — On a sign-mirrored wing: FLAP(.z)/SWEEP(.y) want mirror-opposite signs to move "together," but PITCH/TWIST(.x) must be the SAME on both wings
**Did / learned:** player reported the Mk II Eternal wings "not beating at the same time" and the "left wing looks
wrong/broken." Geometry was a clean mirror (every offset `side *`) and the flap shared ONE phase — so it *looked*
symmetric in code. The bug was axis-dependent symmetry: the wing rig sets three axes, and "together" means the
opposite thing per axis. `.z` (flap up/down) and `.y` (sweep back) are mirror-opposite (`+`/`−`) because the wings
point opposite directions — that's correct, they rise/sweep together. But `.x` (pitch/twist) rotates about the
SHARED world X axis, so mirror-opposite `.x` tilts the right wing's leading edge UP while the left tilts DOWN —
the two stiff jet-wings twist in opposite directions, reading as "out of sync / left wing broken." It was masked
until Phase B made Eternal glide-dominant (root flap 0.52→0.19): the alternating twist (`±featR`/`±twMid`/`±twTip`,
each ~0.16) then dominated the tiny flap. Fix: make every `.x` assignment SHARED (same value on L and R) in the
Mk II flap drive AND the preview animator; keep `.z`/`.y` mirror-opposite. The static AoA was already shared
(both `0.14`/`-0.05`) — only the dynamic twist alternated, so sharing it too is consistent. Rear render now shows
both wings at identical pitch/height.
**→ Systematize:** sign-mirror rule is per-AXIS — flap/sweep = mirror-opposite, pitch/twist about the shared body
axis = identical. **Caveat:** symmetric *code* (one phase, all `side*`) is not symmetric *motion* if a twist axis
is mirrored; verify with a straight rear render, and twist asymmetry is worst when the flap amplitude is small.

### L75 — Guarantee L/R wing identity with a scale.x=-1 MIRROR CLONE of the master wing; drive each rig with the SAME logical pose + per-wing banking bias (the wrapper flips the left)
**Did / learned:** player still found the independently-built left wing "weird" (even after the L74 twist fix) and
asked to literally mirror the right onto the left. Implemented in `buildSvjJetWing`: build the RIGHT wing as the
master, tag its `pivot`/`wingMid`/`wingTip`/`marker` with `userData.wingRole`, then `pivot.clone(true)` (userData
is deep-copied) into a `new THREE.Group()` with `scale.x = -1`, and re-extract the cloned rig nodes by role. The
left geometry is now provably identical to the right. **Animation:** do NOT blind-`copy()` the right's rotation to
the left — that kills banking. Instead apply the SAME logical pose formula to BOTH rigs, each with its own banking
amp/bias (`ampR=1-0.3·bank`, `ampL=1+0.3·bank`; right is inside on a right turn). The `scale.x=-1` wrapper flips
the left automatically → identical in straight flight (perfectly symmetric), correct inside-tuck / outside-open
while banking, all from ONE shared phase. **Gotcha:** a mirrored (negative-scale) child renders inside-out with
single-side materials — the wing mats must be `THREE.DoubleSide` (yellow/black already were; had to add it to the
grey hinge + red chevrons). getWorldPosition on the cloned tip markers still resolves correctly (the −1 scale is
in the world matrix), so the VFX emitters keep working.

### L76 — "Long thin straight" outer wing third reads as a rod; fix by SHORTENING + sweeping it back, not by scaling the whole wing
**Did / learned:** Eternal's wingspan felt too wide because the outer third was too long/thin/straight (rod-like).
Per the brief: keep inner+mid mass, only shorten the OUTER third ~15% (outer station `xsec(1.0)→xsec(0.96)`),
sweep its outer edge backward (+z), sharpen the taper, and widen the hinge cover for a clearer joint — never a
flat horizontal line. In motion the tip gets a stroke-driven backward sweep (~3° power → ~6° glide → ~12°
recovery, via `0.05 + 0.16·upTip` on the tip's `.y`) so it trails the mid and finishes the silhouette. Because the
tip is shorter, DROP its flap amplitude a touch (tipAmp 0.36→0.33) so the follow-through stays dense, not floppy.
**→ Systematize:** silhouette problems in a segmented wing are per-SEGMENT proportion edits (move one station,
add sweep), not a global scale; and when you shorten a segment, reduce its animation amplitude to match.

### L77 — Shorten a segmented wing's span by REDISTRIBUTING station fractions (a `stationT` remap), not by scaling L — keeps detail modules placed and lets you shorten one segment more than the others
**Did / learned:** Eternal's wingspan felt too wide / rod-like in the outer third. Needed ~20% shorter total but
NOT evenly — keep root+mid mass, shorten the outer most (per-segment scales root 0.90 · mid 0.82 · outer 0.68).
The wing is built from `xsec(t)`/`stationPoint(t)` where t is a fraction of the span; every detail (chevrons,
flaps, panels, the wingMid/wingTip joint origins) is placed by t. So a single piecewise-linear remap
`stationT(t)` wrapping `stationPoint` (old joints 0/0.36/0.73 → new 0.324/0.627/0.811) compresses each segment by
its own scale and AUTOMATICALLY drags every module + joint into place — no per-call-site edits. Gated on
`model.wingParts === 3` so it only touches the 3-segment Radiant/Eternal wing; the 2/1-part forms and the plain
aurumToro sibling (no wingParts) are untouched. Chords stay the same → the shorter wing reads broader/chunkier,
which is exactly the "powerful, not a rod" goal. Pair it with the existing stroke-driven outer-tip sweep-back.
**→ Systematize:** parametric-span geometry should expose ONE t→t remap seam; segment-proportion changes are a
remap, never a hunt-and-replace of hardcoded station numbers.

### L78 — A geometry/build "regression" report must be reproduced headlessly before fixing — render the suspect IN ISOLATION
**Did / learned:** player reported "every dragon in the shop rail shows the bull's body." Before touching code I
rendered `azure` and `ember` standalone via the harness — both built as themselves, and `dragonModel.js` has no
module-level cache/shared state, and the rail code builds each thumbnail's own `DRAGONS[k]`. So the build path is
correct and the bug is UI/runtime-level (shared preview renderer / selection state), NOT the per-form geometry
work — saving a pointless geometry "fix." Always isolate-render the suspect before assuming a builder regression.

---

## ★ DOCTRINE — A PART IS A MULTI-MODULE ARTICULATED ASSEMBLY, NOT A MESH
*(Extracted from the Aurum Toro Mk II "bull" — the studio's reference exemplar for premium dragons.)*

The difference between a flat dragon and a PREMIUM one is not material or polish — it is **decomposition**. A
membrane dragon builds a wing as ~1–2 meshes; the bull builds a wing as **~25 small modules across 3 nested
HINGED groups** (root `pivot` → `wingMid` → `wingTip`): hinge + boom + stacked blade panels + black vents + hex
grille + red chevron taillights + trailing flaps + a secondary top blade + the wingtip endplate. **A wing is not
a module — it is an assembly of modules joined by articulated joints and dressed with surface layers.**

### The build formula (apply to EVERY part — torso, wings, head, tail)
1. **DECOMPOSE** — many small modules, not one mesh. Reuse the `mechaKit.js` primitive bin (flatTriMesh,
   wedgePanel, frameBar, hexGrille, spineSegment, chevronLight, thrusterPod…) — generic, palette-agnostic; the
   builder injects materials.
2. **ARTICULATE** — express the part as nested HINGED sub-groups the shared animator drives. Wings return
   `parts:{ wingPivotL/R, wingMidL/R, wingTipL/R, tipMarkerL/R }`; the rig drives root→mid→tip as ONE shared-phase
   cascade with per-segment LAG (`dragon.js` `else if (model.wingParts)`). The hinges that read mechanical ARE the
   joints that animate — detail and motion are the same system.
3. **DRESS** — bolt on self-gating SURFACE LAYERS (`registerSurfaceLayer` → `{meshes, flareMats}`, ctx
   `{def,model,attach,…}`) that read the torso's ATTACH CONTRACT (`wingRoot(side)`, `headBase`, `tailAnchor`,
   `keelTopAt(z)`, `halfWidthAt(z)`, `bodyMidY`) and `return {meshes:[],flareMats:[]}` when their level is 0.
4. **SCALE PER FORM** — ascension forms add/grow modules via `forms[]` knob accretion + builder level-branching
   (`wingParts` 1/2/3, `thrusterLevel`/`hornLevel`/…). Hard-surface = bolt on new machines; organic = grow/multiply
   the same parts (maturation). Mature LOWER forms DOWN, don't under-build the top.
5. **BUDGET-GATE** — every segment count in `seg()`; ≤6 materials; **chase-cam FIRST** (spend tris on what reads
   from BEHIND — wing trailing edges, the trailing tail, rear body/spine; keep the face/belly lean); top form
   **~5800–6000 tris** (use the budget, ≤6000 ceiling; `tools/tricount.mjs`).
6. **SURGE-TAG** — accent/emissive mats carry `userData.baseEmissive/baseIntensity`, collected into
   `spineMats`/`flareMats` so the rig pulses them on Surge.

### Registry plumbing (zero-touch integration)
`registerTorso/Wings/Head/Tail(name, fn)` self-register at import; a dragon names them in `def.parts`. Adding
`def.parts` to ONE dragon (or a new `DRAGONS` key) touches no other dragon — the inferred membrane/arrow/horned/
clean builders keep the shipped roster byte-identical. Torso returns `{group, attach}`; wings `{group, parts,
wingMat, spineMats}`; head `{group, spineMats}`; tail `{group, segs, tailFins, accentMats}`.

### Organic vs hard-surface — the ARMATURE is universal, the VOCABULARY is the variable
Reuse the SAME skeleton (hinge rig + cascade animator + attach contract); swap only the module language:
- modules **OVERLAP/shingle** (feathers/scales) to HIDE the seam, vs hard-surface modules that CELEBRATE it
  (hinge covers) — overlap is also the fix for the wing↔body gap that killed `obsidian2`;
- detail = parametric **REPETITION** of one card along a gradient, vs a zoo of bespoke parts;
- articulation = a feather-by-feather **RIPPLE** (intra-segment phase offset) vs a mechanical snap;
- surface = matte + **gilded emissive edges** + glow-seams vs metal clearcoat (one hard accent allowed: gem nodes);
- L/R symmetry = build the RIGHT master + a `scale.x=-1` MIRROR CLONE for the left (drive each rig with the same
  logical pose + its own banking bias). See lessons L72–L78 for the tactical mechanics.

### L79 — Banking is POSE BIAS, never a L/R phase delay
Both wings share the ONE flap phase + identical internal root→mid→tip lag; banking asymmetry is pose only. Per
wing, an inside-ness `ins` (+1 inside the turn → brake/tuck, −1 outside → power/open) drives amplitude (inside
↓ arc, outside ↑), baseline (inside drops lower, outside opens higher), mid fold-in vs spread, and the tip
(smaller arc + feathered back + canted up). `|bank|` is the soft→hard continuum. The body roll, spine C-curve
cascade (chest→hips→tail with `bankHard`), and tail rudder-into-turn already existed — the missing piece was the
inside/outside WING articulation so the wings read as limbs (shoulder drives → forearm follows → tip trails), not
planks. Phase-delaying a whole wing against the other looks broken; resist it. (`dragon.js` Mk II wing branch.)

### L80 — `seraphTail` comet/banner tail: a 4th module on the shared armature
The Seraph now lands a dedicated TAIL (`registerTail('seraphTail', …)`) alongside its wing — hull/head still
inferred, roster byte-identical. Tail contract: `(def, model, {bodyMat, scalesMat}, anchor) → {group, segs,
tailFins, accentMats}` — `segs` are FLAT siblings of root along +z (the per-segment rudder/coil animator drives
them; do NOT nest them), `tailFins` carry `userData.{restRotX/Y/Z, restScale, bankGain, flapFlutter, phase}` for
deploy/flutter/bank, `accentMats` (glow mats with `userData.baseEmissive/baseIntensity`) flare on Surge. Organic
vocabulary: smooth tapered pearl vertebrae + a gilded dorsal ridge + dawn-blue glow seams, finishing in a COMET
BLOOM (glow core + gilded blade-fan streaming +z) — the chase-cam rear hero. Verify: `tricount` (budget) +
`tiershots` (front) + `gameshots` (live chase-cam boot/fly across tiers); the human judges feel on the preview.

### L81 — "Sawtooth wings" = a feather plate that narrows to ONE sharp apex; fix the PLATE shape, not the rig
Review feedback "wings read as sawtooth cards, not feather-scale armor" traced to the ATOMIC plate, not the rig or
the row layout: `featherScale` was a 4-pt KITE that tapered to a single apex point (widest at 42% len) → a fanned
row of those apexes IS a row of teeth. Fix = reshape the plate to a **6-pt convex LEAF/SHIELD** (base point, a WIDE
low pair, a shoulder pair, and a SHORT BLUNT tip edge `w·tipSharpness`, never a point) + a `tipSharpness` knob per
segment (low=rounded covert plume, high=long primary blade-scute), then HEAVIER overlap + a GENTLER fan in
`scaleRow` so rows scallop instead of comb. The rig/contract/animator never changed. Cost: ~4→10 tris/plate, still
far under budget (Eternal 3160 HIGH / 5228 ULTRA). Reshape the module vocabulary; never restart the creature.

### L82 — Premium "gilded" rims need a REAL metallic gold, not the near-white `def.horn`
"Reads as white geometry + dark separators, not pearl-rimmed-in-gold" was a MATERIAL miss: the wing/tail gild
sampled `def.horn`, which on the Seraph's top form is `0xfff0b0` (≈white) → rims vanished into the white pearl.
Fix = dedicated surface-language constants in the builder (`SERAPH_GOLD 0xD6AF4A` true metallic gild,
`SERAPH_PEARL 0xF2F0EA` matte off-white not plastic `0xffffff`, `SERAPH_DAWN 0x88DFFF` seam, `SERAPH_HOLY 0xFFF3C8`
comet core), plumbed as `def.wingGild ?? SERAPH_GOLD` etc. so per-form colours still tint but the DEFAULT is right.
Also: a created-but-never-used `shadowMat` was dead code (deleted), and tail vertebrae moved off `def.body` onto
`SERAPH_PEARL` + a faint emissive floor to lift the underside out of navy. Material language is foundational — fix
it before judging shape; a gild that matches the body isn't a gild.

### L83 — A multi-blit preview loop must CLEAR per item AND remove-in-`finally`, or dragons superimpose
The shop card previews render every dragon into ONE shared offscreen scene+canvas sequentially, blitting each
to its card (`preview.js` `loop`). Bug: "all dragons render superimposed on top of each other." Two ways it
happens and both must be closed: (a) the loop trusted `renderer.autoClear` (default true, but anything can flip
it) → set `renderer.autoClear = true` at init AND `renderer.clear()` before each `render`; (b) `scene.add(group)`
… `render` … `scene.remove(group)` with NO guard → if `item.tick()` throws, the group is never removed and
superimposes on every later card → wrap `tick`+`render` in `try { … } finally { scene.remove(group); }`. Rule:
any loop that reuses one scene/renderer across N blits must clear the framebuffer per item and guarantee teardown.

### L84 — A gold rim must be big enough to FRAME the plate, or the dark gaps read as "black outlines"
Review: feather plates "look like black-outlined paper cards." There was no black-outline mesh — the gild rim
behind each plate was only 1.05× (a hairline), so the dark flat-shaded GAPS/backfaces between overlapping plates
dominated the read. Fix = grow the rim to ~1.12× + drop it further behind so a clean gold edge frames every
plate, AND add a faint emissive FLOOR to the pearl (intensity ~0.05) so flat-shaded edges/undersides stop
crushing to black. "Reduce black outlines" on flat-shaded shingles = bigger rim + emissive floor + more overlap,
not an outline-opacity knob.

### L85 — Accent feathers parented to `wingTip` animate for FREE; index-hash jitter breaks the sawtooth
Two cheap wins to make a feather fan read premium without touching the animator: (1) long "streamer-primary"
blade-feathers parented UNDER `wingTip` inherit the tip's flap automatically → trailing streamer motion with
zero `dragon.js`/`dragonModel.js` change (the rig only drives pivot/mid/tip; children ride along). (2) A stable
per-plate jitter (deterministic `sin(i*k)` hash, NOT `Math.random` which would reshuffle every build) of ±8%
length / ±4° rotation makes the trailing edge scallop irregularly instead of forming a hard uniform sawtooth
staircase. Per-row ripple (a finer feather-by-feather wave) DOES need row-groups exposed + animator iteration in
both files — deferred until the free tip-driven motion proves too stiff.

### L86 — More modules ≠ better: when feedback says "busy/ugly", SUBTRACT, don't decorate
The L84/L85 pass (bigger rims, per-plate jitter, a 4th row + extra covert row, and streamer-primary
ribbons) was meant to add premium richness but the player read it as "tile-mosaic / black-outlined
stickers / 4 long weird nails / too busy." The corrective pass REVERSED all of it: deleted the streamers,
removed the jitter, dropped to EXACTLY 3 rows on the 3 hinges (15 plates/wing, fixed not seg()-scaled),
made each plate a larger rounder BASE-WIDEST leaf, shrank the gold rim back to a THIN clean edge (1.07×),
and added one clean monotonic outer taper instead of a jittered edge. Result read cleaner AND cost fewer
tris (Eternal 3220→3000). Lesson: an elegant silhouette comes from FEWER, larger, well-shaped parts; when
a detailing experiment makes a hero "busier," the fix is subtraction, not another layer. Prototype an
appendage (streamers) in isolation before committing it across a hero.

### L87 — Returning from background must ARM the music-resume intent even while paused (iOS)
iOS bug: backgrounding played one sound then killed music; returning never restored it. Two causes:
(1) `main.js onForeground()` only called `music.resumeFromBackground()` when `game.state !== 'paused'`, so
backgrounding DURING a run (which sits paused behind its overlay) never armed `resumeMusicPending` — then
the Resume-tap's `unlockAudio()`→`tryResumeMusic()` bailed (flag false) and music stayed dead. (2)
`resumeFromBackground()` never re-kicked the silent loop clip that `pauseForBackground()` paused, so iOS
dropped the audio session and `ctx.resume()` couldn't land. Fix: ALWAYS call `resumeFromBackground()` on
foreground (it only ARMS intent + resumes the ctx — it never rebuilds the scheduler unless the ctx is
truly `running`, so no iOS garble), and `ensureSilentMedia()` inside it to restore the playback session.
Web Audio lifecycle: separate "arm the intent" (safe anywhere) from "rebuild the graph" (gesture/running
only), and a paused HTMLAudioElement silent-unlock clip must be re-played on every foreground.

### L88 — Greenfield torso/head land via the registry + the attach contract; a real halo replaces the sprite
The Seraph got its OWN `seraphHull` torso + `seraphCrownHead` head (new `dragonSeraphBody.js`, self-registers
via `registerTorso`/`registerHead`, imported once from `dragonModel.js`, named in `pearl.parts`). The torso
PUBLISHES the same `attach` contract the proven wings/tail mount through (`wingRoot(side)`, `headBase`,
`tailAnchor`, `keelTopAt`, `halfWidthAt`, `bodyMidY`, `bodyMatDouble`) — so "the body defines new mounts" just
means returning new anchor values; the wings/tail integrate with ZERO wing/tail code change. Building a custom
torso (vs reusing `buildTorso`) avoids its sphere fairings/neck so the pauldrons + custom neck read clean.
Both `torsoResult.spineMats` and `headResult.spineMats` are collected by the model → tag glow mats there for
Surge flare. The crown-halo is REAL geometry (TorusGeometry + cone shards + octahedron gems) built INSIDE the
head (so it tracks head sway) and gated by `model.halo` per form; the generic body-level halo SPRITE in
`dragonModel.js` is suppressed for this head (`recipe.head !== 'seraphCrownHead'`) so they don't double up.
Octahedron = the faceted gem-eye/gem-node primitive; partial TorusGeometry = cheap gorget collar arcs.

---

## Lesson — Pearl Seraph torso SCULPTING pass: fund big armor by cutting where the chase cam can't see

**What we did.** Refined (not rebuilt) the Seraph torso so it reads as matte-pearl PALADIN armor, not a
white oval: slimmed the hull's shape hierarchy (shoulder ring ×1.04 carries width; abdomen/tail-root ×0.90–
0.94 stay elegant), enlarged the gorget collar arcs with a clearly-proud GOLD backing arc, grew + reseated
the shoulder pauldrons, swapped the cylinder sternum keel for a triangular-section gold ridge (`flatTriMesh`),
and added NEW `seraphHaunchFairing` low pearl domes + gold rim at the tail root so the long tail flows out of
a sculpted body. Also reoriented the CROWN-HALO to a horizontal floating saint's halo (ring `rotation.x=π/2`,
raised `y 0.34→0.62`, shards/gems ringed in the XZ plane via `cos a→x, sin a→z`).

**The reusable win — segment counts are the budget, not part count.** Eternal was 5444/6000 and we were ADDING
modules. Instead of trimming the design we cut TorusGeometry segment counts where the rear chase cam never
looks: the 8 gorget tori went `seg(6)/seg(18)`→`seg(5)/seg(12)` (−672 tris alone), plus skull loft seg(10)→
seg(8), neck cylinders/collars down, halo ring seg(8)/seg(28)→seg(6)/seg(20). Net result: bigger armor + new
haunch fairings AND the count DROPPED to 4458 (−986). Lesson: the torus tubular/radial segments dominate the
budget; spend triangles on what reads from BEHIND and shave the head/neck/halo freely — they're nearly
invisible in the gameplay camera.

**Gotchas.** (1) The earlier brief's `getObjectByName("pearlTorsoHull"/"abdomenCore"/...)` refine approach
doesn't apply here — this builder names nothing, so bake the per-zone scales straight into the loft ring
rx/ry instead. (2) A horizontal halo needs the SHARDS moved to the XZ plane too (`shard.rotation.z=-π/2;
rotation.y=-a`), not just the ring — otherwise the ring lies flat but the spikes still stand vertical. (3)
Haunch fairings must stay LOW + LONG (scale y small, z large) or they read as bulky hips, which the brief
explicitly forbids. (4) `tests/badges.mjs` needs a running dev server and times out on `.shop-grid` in the
headless sandbox — it fails on a clean tree too, so it's environmental, not a regression; rely on
blueprint + tricount + tiershots here and let the human judge motion on the PR preview.

---

## Lesson — Wing high-V APEX: an opt-in upstroke lift, not a keyframe-pose rewrite

**Problem.** Toro Mk II Eternal + Pearl Seraph wings read too FLAT at the top of the flap — no strong raised "V"
silhouette before the downstroke. The player's brief specified a 5-phase keyframe cycle (glide → upstroke →
high-V apex hold → power downstroke → settle) with per-segment elevation/sweep/fold/twist target angles.

**Why we did NOT port the keyframe spec literally.** The Mk II wing engine (`dragon.js` ~527-569) is a
CONTINUOUS sinusoid, not a keyframe poser: `shape(ph)=sign(sin)·|sin|^glidePow` drives each segment's flap on
`rotation.z`, scaled by per-form `rootAmp/midAmp/tipAmp` with internal `midLag/tipLag` (L/R already share ONE
phase — pure sign-mirror, no left/right delay, which is exactly what the brief wanted). Rewriting it into a
phase-ratio state machine would touch every Mk II dragon and risk the shipped feel. The flatness has ONE cause:
the sinusoid is SYMMETRIC about the rest dihedral, so the "up" extreme is modest and never reads as a held V.

**The fix (system, opt-in, roster-safe).** Added an APEX LIFT term gated to the UPSTROKE only:
`apexHold(ph)=max(0,sin ph)^0.7` (the 0.7 power WIDENS the dwell near the top → a brief held apex), times new
per-form knobs `apexRoot/apexMid/apexTip` (extra radians of raise, tip highest → forms the V, lagged
root→mid→tip via the existing `midLag/tipLag`) subtracted from each segment's flap `z` (same sign as the
existing up-swing, so it deepens the raise without touching the downstroke). `apexPitch` tilts the wing plane
up at apex for a cathedral-arch read. All knobs `?? 0`, so EVERY dragon without apex config is byte-identical —
proved by rendering: at the preview's phase-0 rest pose `apexHold(0)=0`, so the glide silhouette is unchanged.
Pearl gets a higher/softer angelic arch (`apexTip 0.54, apexPitch 0.22`); Toro a lower/tighter mechanical V
(`apexTip 0.42, apexPitch 0.14`) — same system, per-dragon character.

**Gotchas.** (1) Mk II flap amplitude is FIXED per-form (`rootA = m.rootAmp`), NOT modulated by the dive/climb
`flapAmp` — only the FREQUENCY varies with flight state — so the apex lift is constant-amplitude too, matching
shipped behavior (don't scale it by `flapAmp`). (2) `tiershots` renders a STATIC frame at the rest phase, so it
proves "no breakage / rest pose intact" but CANNOT show the apex — the high-V is a motion read, judged by the
human on the live PR preview. (3) Sign matters: more-negative `rotation.z` = more raised, so apex lift is
`- apexF*amp` (subtract), aligned with the existing `-(rootF*amp)` up-swing. (4) Body-lift/tail-drop at apex
(also in the brief) was deferred to keep this pass to the wings — the headline fix — pending the player's read.

---

## Lesson — Wing high-V apex: the rig was capable; the bug was a mis-phased, wrong-signed flap (verify at the APEX phase, never a static frame)

**Symptom.** Player: both Mk II dragons' wings read flat/lateral at the top of the flap — no raised V — and
suspected a structural root-hinge limit (asked whether a new proximal shoulder/yoke module was needed).

**Diagnosis (decision: NO new module).** Traced the rig: both wings (`buildSeraphWing` in dragonSeraph.js,
`buildSvjJetWing` in dragonFaceted.js) put a bare `pivot` Group at the `attach.wingRoot` socket (NO base
rotation); the visible wing extends along `spanDir` ≈ mostly **+X (lateral)**. The animator (`dragon.js`
`poseWing`) flaps on `pivot.rotation.z`. For a wing along +X, **rotation.z rotates the tip up/down in Y — it
IS the elevation/V axis.** (Two Explore subagents both concluded "z sweeps laterally" — WRONG; don't trust a
subagent's axis call without working the math.) So the structure can make a V; no carrier needed.

**The real bug — my own previous apex pass was backwards.** The flap is `rz = -(rootF*amp)+baseZ`, with
`rootF=sin(phase)*rootA` and `baseZ=-0.10`. The wing's UP extreme is at **phase=3π/2** (where sin<0). My first
"apex hold" used `max(0,sin(phase))^0.7` (peaks at phase=π/2, the DOWNstroke) and SUBTRACTED it — so it
deepened the downstroke and did nothing at the top. Fix: gate on the up half `apexUp=max(0,-sin(ph))^0.7`
(peaks at the apex, ^0.7 widens the dwell) and ADD it as positive elevation, cascading root→mid→tip via the
existing `midLag/tipLag`; plus a per-form `restLift` to raise the glide pose off flat. All knobs `?? 0` →
every other Mk II dragon is byte-identical (tricount roster total unchanged).

**The verification gotcha that hid it.** `tiershots`/`renderDragon` build the model and render the STATIC rest
pose — they NEVER run the gameplay `poseWing` tick — so they cannot show the apex and made the broken apex look
fine. To verify motion you MUST drive the wing groups to the actual apex phase. I wrote a throwaway
`tools/apexcheck.html` that builds the model, finds the wing groups by `userData.wingRole` ('pivot'/'mid'/
'tip'), and applies the real poseWing math at `phase=3π/2` (straight flight) before rendering the rear chase
cam — that screenshot is what proved the V forms (and that +rz lifts UP, not sideways). Deleted after. Rule:
for any flap/pose change, render at the POSE phase you're changing, not the rest frame.

**Tuning.** Cumulative across 3 nested segments, so per-segment apex values stay MODERATE (Pearl
apexRoot/Mid/Tip 0.18/0.24/0.22 + restLift 0.09; Toro Eternal 0.14/0.20/0.18 + restLift 0.06 — Pearl's arch
rides higher). Magnitudes are eyeball-tuned on the apex render + live preview; the engine can't predict the
world-space angle analytically (segment offsets, sweep, Euler coupling).

---

## Lesson — Wing flap ARCHITECTURE: a root YOKE + a 5-phase envelope with an APEX HOLD is what makes a flap read as a power cycle (shared solver for both posers)

**Why the earlier apex fixes weren't enough.** The high-V apex render LOOKED right, but in MOTION the flap still
read hinge-like: a plain sinusoid whips THROUGH the top so the V never dwells/reads, and a 3-stage
pivot→mid→tip chain makes the V look tip-driven (the root doesn't visibly lead). Tuning pose values can't fix
either — both are architectural.

**The refactor (now the base for future dragons).** (1) NEW `reforged/js/wingFlapSolver.js` — a PURE-MATH
shared solver: `flapEnv(phase,cfg)` is a 5-phase envelope (glide-hold → recovery → **APEX HOLD plateau** →
power-downstroke that dips below flat → settle) ranged [−downDepth..1]; `solveWing` returns per-STAGE
elev/sweep/twist/fold from the envelope with intra-wing lag yoke→inner→mid→tip. Because it's THREE-free, BOTH
posers call it and stay in sync — gameplay `dragon.js` AND shop-preview `dragonModel.js makePreviewTick`. (2) A
root **YOKE** group inserted in BOTH wing builders (`buildSeraphWing`, `buildSvjJetWing`): `yoke` at the
wing-root socket, the existing `pivot` (inner-wing geometry) becomes its child at local origin, mirror by cloning
the YOKE. The yoke is a transform-only shoulder carrier that does the big root elevation and LEADS the chain, so
the V is built from yoke+inner+mid (not just the tip). (3) Per-dragon `model.flap` config (degrees → solver):
Seraph = taller angelic cathedral V; Bull = lower/tighter heavy mechanical V, more aft sweep.

**Scope was tiny + safe:** only Pearl Seraph + Aurum Toro Mk II use the `wingParts`→`poseWing` path (`grep
wingParts`), so evolving it touched no other dragon. The yoke is an empty transform → tricount UNCHANGED
(203073). Gate the new path on `m.flap && wingYokeL` so the old sinusoid stays as fallback; lower Bull forms (no
`flap`) keep the old path with the yoke sitting at identity (a harmless passthrough).

**Gotchas.** (1) `dragonModel.makePreviewTick` is a SECOND poser (shop preview) that duplicates the flap math —
forgetting it makes the showcase diverge from gameplay; it was ALSO missing `wingMidL/R` in its destructure (a
latent gap) — added. (2) Bull/Seraph have NO spine rig (`spineSegs` is Night-Fury only), so the brief's "chest
lift / body rise" has no bone to drive — implemented the achievable **tail-drop-at-apex** (in the position-wave
`else` tail loop, gated by `flap.body`) and left full chest/body whip as a documented follow-up needing spine
bones. (3) Verify with a CYCLE render (drive the real `solveWing` across 5 phases), never a single frame — the
apex HOLD and the root-led V only read across the cycle. Pearl's first pass went near-vertical (clamshell);
dialed `elevDeg` down ~20% for a clean open cathedral V. elevation is cumulative across the 4 nested stages, so
per-stage degrees stay modest and are eyeball-tuned on the render, not predicted.

---

## Lesson — Wing solver gameplay INTEGRATION: per-form-only config silently falls back on lower tiers; brief apex + flat glide reads flat in motion

**Symptom.** The yoke/5-phase solver looked perfect in the standalone cycle harness, but in GAMEPLAY Bull read
DEAD-flat and Seraph's V was shallow/brief. The player suspected an overwrite / axis / hierarchy bug.

**Root causes (NOT a bad solver, NOT an overwrite — confirmed nothing rewrites yoke/pivot/mid/tip after poseY).**
- **BUG A — config never reached gameplay below the top tier.** Bull's `flap` config lived ONLY on the Eternal
  FORM override. `ascendedDef` (ascension.js) accretes each form's keys onto `model` up to the current tier, so
  any tier below Eternal merged to `model.flap = undefined` → the gameplay branch `else if (model.flap &&
  wingYokeL)` failed → Bull fell through to the OLD flat sinusoid. Pearl always worked because its `flap` is on
  the BASE model. FIX: put shared flap config on the BASE `model`, never only on the top form. Proved at every
  tier with a 6-line node script calling the real `ascendedDef` (flap=YES tiers 0-3).
- **BUG B — the math was right but the MOTION read flat.** The apex hold was ~12% of the cycle (~0.18s) and
  `glideLevel 0.16` left the dominant glide/settle phases nearly flat, so the rear camera mostly sampled flat
  frames. FIX: raise `glideLevel` (~0.32-0.34) so the wing rides a gentle V the WHOLE cycle (never dead-flat) +
  lengthen `apexHold` so the high-V is held long enough to read. The peak pose was always correct; it just
  wasn't reached/held visibly.

**Shipped a `?wingDebug=<glide|recovery|apex|downstroke|settle>` FREEZE mode** (dragon.js): holds the wings at
one cycle point with steering/boost/bank/climb NEUTRALISED (pure solver output), and logs the resolved config +
the wing-chain elevation measured in the DRAGON'S OWN frame (`group.matrixWorld.invert()` applied to yoke/tip
world positions → `atan2(dy,horiz)`) — body bank/pitch independent, so `tipElevDeg` is a true "does the wing
rise" readout. This is both the diagnostic the player asked for and a permanent debug tool.

**Verification gotchas.** (1) `tiershots`/`cyclecheck` render STATIC poses and `dragonModel.makePreviewTick` is a
SEPARATE preview poser — none is the gameplay tick, so to prove gameplay you must either freeze the real game
(`?wingDebug`) or assert the resolved `model.flap` via `ascendedDef` directly. (2) Importing `dragons.js` in a
bare node script throws `window is not defined` (save.js touches window) — stub `globalThis.window/document`
first. (3) The rear-chase-cam `cyclecheck` `_dir (0.06,0.20,0.95)` IS the gameplay camera, so it's a faithful
pose proof even though it sets rotations directly.

---

## Lesson — Preview works but gameplay doesn't? Check for a SECOND parts/return object in the model builder

**Symptom.** After the wing refactor, the SHOP PREVIEW showed the new yoke flap but IN-GAME showed the OLD
flap — the inverse of a config bug, and a dead giveaway that the two paths receive DIFFERENT data.

**Cause.** `dragonModel.js buildDragonModel` has TWO returns: an `opts.preview` return AND a main return, each
with its OWN hand-maintained `parts: { ... }` object. The architecture commit added `wingYokeL/R` to the
preview return + the destructures but MISSED the main `parts` object. So gameplay (`buildDragonModel(def)`, no
`opts.preview`) got `parts.wingYokeL === undefined` → `wingYokeL = null` in dragon.js → the
`activeDef.model.flap && wingYokeL` branch was false → fell back to the OLD sinusoid. The yoke groups existed in
the scene; they just weren't handed to the gameplay animator.

**Rule.** When a builder exposes hookpoints through MULTIPLE return/parts objects (preview vs gameplay is the
classic split in this repo), any new rig handle must be added to ALL of them — grep the file for every
`parts: {` / `return {` before assuming one edit is enough. A "works in preview, broken in game" (or vice
versa) report points straight at this duplication. Cheap guard: the two `parts` objects should list the same
wing keys — they drifted here by one key (`wingYokeL/R`).

---

## Lesson — Wing flap reads as a SHAPE PROGRESSION only when elevation and curl are SEPARATE channels

**Brief.** Reference flight footage shows the flap is not "flat→V→flat" — it's a shape cycle: extended → rounded
DOME / soft-M on the upstroke → rounded V at apex → STRAIGHTER load-bearing downstroke → settle. The single
elevation envelope (one `flapEnv` scaled per stage) couldn't express it: on the downstroke it curled every
segment DOWN together instead of straightening.

**The two-channel model (`wingFlapSolver.js`).** Split the solve:
1. **Yoke = whole-wing ELEVATION** via `flapEnv` (−downDepth..1): up at apex, deep DOWN/pressing on the power
   stroke. This is the "arm angle."
2. **inner/mid/tip = CURL** via a new `curlEnv` (0..1): ~0 at glide AND downstroke (segments STRAIGHT), 1 at
   apex (curled into the rounded V). Lagged inner→mid→tip.
The magic is in the combination: lag on the curl makes the upstroke a DOME (inner curled, tip still flat) and
the apex a rounded V (tip catches up); curl→0 while the yoke drives down makes a STRAIGHT load-bearing
downstroke (the old model couldn't — it curled down). Cumulative across the nested rig: apex tip ≈ yoke +
inner+mid+tip curl (~62-74°); downstroke ≈ straight at the yoke's down-angle.

**From the reference, two things a pure up/down model misses** (added as channels, NOT new geometry — the
yoke→inner→mid→tip rig already has the DOF): (a) **fore-aft ROWING sweep** — wings reach FORWARD on the power
stroke, back at apex (`rowFwdDeg`/`rowBackDeg`, driven off the elevation sign); (b) **tip trail/droop at
extension** (`tipTrailDeg`, gated to the un-curled phase) for membrane flex. No 4th segment needed (the
3-segment + yoke arc reads smooth); only add one if a render shows facets.

**Body coupling without a spine rig.** Bull/Seraph have no spine bones, so couple the body via the EXISTING
`posturePitch`→`group.rotation.x` damp: a module accumulator `bodyFlapLift = liftAmt * yoke.env` (set by the
yoke solver, applied next frame) lifts the chest at apex / compresses nose-down on the downstroke; the
`damp(…,9)` 1-frame lag IS the inertia (reads as "suspended under the wings"). Tail keeps the apex-gated drop.

**Verification gotcha.** `phaseCenter('downstroke')` at the power-phase CENTRE catches the wing near-level
(mid-transition gull), not the press — the deep straight press is ~70% through the power phase. Sample there so
both the cyclecheck render AND `?wingDebug=downstroke` show the real load-bearing pose. As always, the silhouette
(not the numbers) is the judge — render the 5 phases on the rear chase-cam and compare to the reference frames.

---

## Lesson — Tune the flap from the EXACT gameplay chase cam, not an elevated 3/4 — and "wings gone" was stale cache

**False alarm first.** A "wings don't show at all in game + shop" report was a STALE SERVICE-WORKER CACHE on the
device (refresh fixed it). I burned a lot of effort failing to reproduce it: tiershots (rest pose), the isolated
`makePreviewTick`, all detail tiers, and a live-game scene inspection (`__dd` + injected save) ALL showed the
wings present, visible, finite, and spread. When every faithful harness shows the feature working, suspect the
device/cache (sw.js precaches by content-hashed VERSION) before more code spelunking.

**The real tuning bug — camera angle changes everything.** The flap looked great in my cycle harness but the
player saw "never flaps below horizontal / no dome / freezes at horizontal." Cause: my harness camera was
slightly ELEVATED and looked AT the dragon, so it read the shape generously. The real gameplay chase cam
(`cameraController.js`: camera at dragon +(0, 3.6, 12.3), lookAt +(0, 1, −16)) is NEARLY LEVEL behind, ~5°
down. From that near-level rear view: (a) a steep up-V reads dramatically, but (b) a shallow downstroke (−18°)
reads as ~FLAT (you can't tell 0° from −18° from directly behind), and (c) the wing dwelling near horizontal
reads as a freeze. FIX: build the verification harness with the EXACT chase-cam transform, then retune —
- deepen the down-beat a LOT (`downDepth` ~1.6–1.9 → −30°..−40°) so it visibly drops below horizontal;
- shorten the glide + apex HOLDS and lengthen the power phase so the motion flows (a heavy continuous beat,
  not hold→snap→hold);
- make the DOME with `tipTrailDeg` (tips droop/trail while inner+mid arch up) + a big tip `lag`, not just lag
  alone (the chain raises the tip with the yoke, so you need the trail to counter it).

**Takeaway:** an animation reads ENTIRELY differently from a near-level rear cam vs an elevated 3/4 — always
tune from the shipping camera's exact position/lookAt. Up-motion over-reads and down-motion under-reads from
directly behind, so a power flap needs an asymmetrically DEEPER downstroke to look balanced in play.

---

## Lesson — A flap reads as continuous only if elevation crosses HORIZONTAL at max velocity (never hold mid-stroke)

**Symptom.** Player: "from the bottom, on the way UP, the wing weirdly pauses around horizontal then continues."

**Cause.** The 5-phase envelope had a GLIDE-HOLD plateau at `glideLevel` (≈horizontal) AND `smooth()`
(smoothstep) has ZERO derivative at every phase boundary. So between `settle` (ending at glideLevel) and
`recovery` (starting at glideLevel) the wing sat at horizontal with ~zero velocity twice over → a visible freeze
at the mid-stroke. The cycle was hold→snap→hold.

**Fix — a continuous up-down BEAT (`wingFlapSolver.js`).** Dropped the glide hold. `flapEnv` is now ONE
smoothstep UP from −downDepth (bottom) → +1 (apex), an APEX HOLD, ONE smoothstep DOWN to the bottom, a brief
bottom hold. The trick: a single smoothstep from bottom→apex crosses horizontal (env=0) near its MIDDLE where
velocity is ~max — so the wing sweeps THROUGH horizontal fast. Verified numerically: |d(env)/dt| at the
horizontal crossings is ~10–13 (high), and the only near-zero-velocity points are the apex (the held V, wanted)
and the bottom turnaround. Never put a hold — or a smoothstep boundary — at a mid-stroke value you want the wing
to pass through; reserve the zero-velocity dwell points for the true extremes (apex + bottom).

**Other knobs that finally landed it:** `downDepth` ≈ 1.9–2.2 so the BOTTOM presses ~45° below horizontal
(matching the reference deep-press pose), and a strong `tipTrailDeg` (16–18) + big tip `lag` so the tips trail
LOW while the inner/mid arch up through the now-full bottom→apex upstroke = a real domed canopy. As always:
tuned + verified from the EXACT gameplay chase-cam transform, not an elevated 3/4.

---

## Lesson — "Robotic / pauses around horizontal" = HOLDS. A natural flap is a continuous oscillation.

Even after removing the glide-hold, the flap still read robotic and "paused on the way up." Two causes, same
root: HOLDS. (1) The piecewise envelope still had a flat APEX hold + a flat BOTTOM hold (the bottom hold, right
before the upstroke, was the pause the player felt). (2) `smoothstep` has ZERO velocity at BOTH ends of every
segment, so the wing decelerated to a dead stop at each phase boundary → stop-hold-go = mechanical.

FIX: drop ALL holds and drive the beat with a SMOOTH CONTINUOUS oscillation — a time-warped COSINE. A cosine
has zero velocity ONLY at its two extremes (apex + bottom), where the wing naturally REVERSES like a pendulum,
and MAX velocity through the middle (horizontal) — so it never freezes mid-stroke and never holds. `downFrac`
time-warps the cosine so the DOWNstroke takes more of the cycle (heavier/slower power stroke) than the quicker
upstroke. Verified numerically: |d(env)/dt| at the horizontal crossings is ~8–11 (high), and near-zero-velocity
runs exist ONLY at the 2 turnarounds (~2% of the cycle each — a natural slow-down, NOT a plateau). Also smoothed
the rowing sweep to be LINEAR in elevation (no kink at horizontal — a kink there reads as a hitch).

Rule of thumb: holds and smoothstep-boundaries are for POSED/snappy UI motion; organic creature motion wants a
continuous oscillator (sine/cosine) with dwell only at the true extremes. Reach for a hold only when you
explicitly want a "pose-and-stick," never for a flowing cyclic action.

---

## Lesson — Perceived flap POWER is dominated by RATE, not per-beat shape; tune wing-to-body via `wingScale`.

Player: "Bull's wing animation feels slower and more powerful than Seraph — why? Do it for Seraph too. Also
Seraph flaps waaay too quickly, and its wingspan is way too big relative to its body." Two clean, isolated knobs
in `pearl.model` answered all of it — NO solver/builder rewrite (the smooth-cosine beat from #155 stayed intact).

(1) POWER = RATE. The flap rate is `flapSpeed = base·flapBias·formSpeed·flapFreqScale·…` (`dragon.js`). Bull
Eternal `flapBias 0.85 × flapFreqScale 0.82 = 0.697`; Seraph was `0.9 × 0.92 = 0.828` → Seraph beat ~19% FASTER.
The per-beat SHAPE was already near-identical (both `downFrac 0.56`, bottoms ≈ −45°), so the heavier/more-powerful
read is ALMOST ENTIRELY the slower rate. To make a dragon feel heavier, match the heavier sibling's
`flapBias × flapFreqScale` PRODUCT — don't reach for shape/amplitude changes first. (Seraph → `flapFreqScale 0.85`,
product 0.765: slower/heavier, a touch more loft than the Bull.)

(2) WINGSPAN-to-body = `wingScale`, NOT `model.scale`. `model.scale` scales the whole group uniformly, so it can
NEVER change the wing-to-body RATIO. The span knob is `wingScale` (feeds `L = 4.6 × wingScale` in `buildSeraphWing`)
— it scales only the wing geometry, so the ratio IS scale-invariant and tuned there. Seraph `1.2 → 0.9` (−25% span)
fixed "wings dwarf the body" with the body untouched. Note: a LITERAL golden ratio (wingspan = 1.618× torso core)
yielded implausibly tiny wings — treat such "0.618" asks as a direction/vibe, pick a measured trim, and let the
human judge the proportion on the preview. Tri count is unaffected (feather rows are fixed counts, not span-driven).

---

## Lesson — Motion bugs hide from static renders; gate the BEAT's velocity profile, and grep tools/ before building a "throwaway" harness.

Across Bull + Seraph the modeling was never the hard part — the architecture is already a reusable kit
(registry + attach contract + frozen wing rig + shared `wingFlapSolver` + `seg()`/tri gates). The cost was
VERIFICATION: (1) tuning motion from the wrong camera (an elevated 3/4) when gameplay is a near-level chase cam
that over-reads up-motion and under-reads down-motion — a flap that looked great from above read flat in-game;
(2) STATIC frames can't show a "pause at horizontal / robotic" bug — that failure lives in the VELOCITY profile
of the beat, not any single frame; (3) repeatedly rebuilding a throwaway chase-cam harness in `/tmp` — when
`tools/readability.mjs` ALREADY renders headlessly from the exact transform `cam.position(0,3.6,12.3)/
lookAt(0,1,−16)`, and `tools/gameshots.mjs` already shoots the live chase cam. Grep `tools/` first.

FIX (built this session): a committed **flap-cycle gate** `tests/flapcheck.mjs` — pure-math, auto-discovered by
`run-all`, runs for every dragon with `model.flap`. It samples the REAL solver across the beat and asserts the
continuity invariants numerically: apex reaches +1 / bottom −downDepth; exactly ONE up + ONE down stroke
(velocity sign-changes === 2); BOTH horizontal crossings happen at high velocity (no flat spot = the old pause);
near-zero velocity ONLY at the apex+bottom turnarounds (no interior hold); curl ≈1 at apex / ≈0 at bottom.
Verified it has TEETH: it passes the shipped smooth-cosine beats (peakVel ~10–11, matching the hand-derived
~8–11) AND fails a reconstructed old glide-hold beat (425 interior-hold offenders at horizontal, sign-changes 0).
Plus `tools/flapstrip.mjs` — montages the 5 `?wingDebug` freeze poses from the live chase cam so a human reads
the whole cycle on demand (the permanent version of the scratch harness; resolves the long-deferred L6
"posedshot"). Rule: when motion quality is the deliverable, encode the MOTION INVARIANT (velocity/continuity) as
a CI gate — a static screenshot can't regression-test feel.

**→ Systematize:** any cyclic/animated quality (flap, tail coil, scarf sway, body bob) should ship with a
numerical invariant gate next to it, not just a render. The reusable harness kernel is `readability.mjs`'s
headless block (three-resolver + DOM shim + the exact chase cam) — clone it, don't reinvent it.
**→ Leapfrog:** with a velocity-profile gate per motion channel, the solver can be refactored fearlessly; next
is a tiny per-dragon `flap{}` PRESET library (heavy-overlord / graceful-eternal) so a new dragon picks a beat +
tweaks 2-3 knobs, and a wiring guardrail in `blueprint.mjs` for the silent old-path fallbacks (flap not on the
base model / missing `wingYokeL/R` / the two `dragonModel.js` parts returns out of sync).

---

## Lesson — The real bottleneck is the STATIC-shape feedback loop, not motion. Build a headless silhouette mirror (no browser, no deps) by reusing the projection we already had.

The human named the actual pain: "concept image → in-game REAR silhouette" is the slow, lossy, iterative
step — and you can't tell whether a miss is *understanding* (wrong proportions, fixable by tuning knobs) or a
*module wall* (the shape literally can't be expressed). Mapping the pipeline confirmed WHY the loop is slow:
shape is specified as declarative knobs in `dragons.js` (`model` + `wingForms[4]` + `forms[4]` + `parts`),
WING silhouette is continuously parameterized (tips/lead/scallop/arc) — but the TORSO/body plan is bespoke
per-builder CODE (arrow/serpent/avian/seraphHull/…), not dial-able; and the ONLY way to SEE a shape was
Playwright booting Chromium for a full *textured* render (rider+lighting+HUD that HIDE the shape, ~10s, and
WebGL is unavailable in CI/sandbox). There was no pure-shape view and no reference comparison anywhere.

KEY REUSE: `tools/readability.mjs` already projects the mesh through the real chase camera (no browser) — it
just threw the pixels away and kept 2 scalars. So a clean SILHOUETTE is ~40 lines on top of that.

FIX (built): `tools/silhouette.mjs` — rasterizes the union of every mesh triangle projected through a camera
into a filled PNG, HEADLESS, ZERO deps (hand-rolled grayscale PNG via built-in `zlib` + a CRC32 table; a
barycentric triangle fill), ~100ms. `rear` = the exact chase cam (the gameplay-faithful view the human
iterates on); `side`/`front` auto-fit to the model bbox by the dims PERPENDICULAR to the view axis (fitting by
wingspan made the profile tiny — the gotcha). Verified by eye: Pearl's rear reads as a crisp dragon (wings,
crown-halo, tail); side shows the spine ridges + taper. Runs where Chromium/WebGL can't.

Rules: (1) when "does it match the vision" is the deliverable, render the ISOLATED quality (flat silhouette),
not a busy full render. (2) Pixels can be made headlessly from the projection we ALREADY compute — a browser
is not required to SEE shape. (3) PNG out of pure Node is cheap (zlib + CRC32 chunking); no native canvas/gl.

**→ Leapfrog (next):** turn the mirror into a CLOSED LOOP — accept a concept PNG, scale-align, overlay
(target vs built) + an IoU/coverage number, so iteration becomes *measure→fix* and the
understanding-vs-module-wall ambiguity becomes a curve (IoU climbs then plateaus = wall, time to add a knob).
Then the deferred body-shape unlock: give the torso builders continuous profile knobs (the one part that's
still bespoke code) so proportions are dial-able like the wings already are.

---

## Lesson — Closed the silhouette loop: mask the concept, overlay the build, MEASURE the gap. It surfaced a real contradiction between two human asks.

Extended the silhouette mirror into the loop promised last lesson. `tools/silhouetteCore.mjs` now holds the
shared render (shim + three-resolver + project/raster) plus a minimal PNG **encode AND decode** (built-in
zlib inflate + Paeth un-filter; no deps), so we can read a concept image too. `tools/silhouette-overlay.mjs`
takes a ChatGPT concept PNG, crude-masks the dragon (luminance floor in the lower frame — the pearl reads far
brighter than the sunset water/skyline, so it extracted a near-perfect target silhouette; `--debug` dumps the
mask to eyeball it), scale-aligns MY built silhouette's bbox onto the target, composites a cyan ghost, and
prints an APPROX bbox-aligned IoU. Added a portrait `climb` view (model pitched ~53° nose-up) to match the
"flying up" gameplay frame the human's concept was drawn from.

WHAT IT MEASURED (Pearl, climb): IoU ~27%. The mask/overlay made the gap unambiguous and SPLIT it into causes
we previously couldn't tell apart: (1) POSE — my render is the flat rest pose; the concept wings sweep steeply
DOWN into a deep V (much of the area gap is pose, not geometry → next: render a SPREAD/downstroke pose for a
fair shape compare); (2) SHAPE knobs — concept wings have far more CHORD/feather-fullness and a much LONGER
trailing tail than the build (continuous knobs: wing `arc`/`scallop`/tip coords, `tailSegments`); (3) a real
CONTRADICTION — the concept wants BIG, lush wings, but PR #155 just trimmed Pearl's span −25% on the human's
own earlier "wingspan too big" note. The overlay is what surfaced that two of the human's asks fight each
other (span vs. chord/area). That's the highest-value thing a measure-the-gap loop does: convert "Claude
didn't get it" into a specific, located, sometimes-self-contradictory delta.

Rules: (1) a textured concept can be masked cheaply when the subject out-glows its background — try a
luminance floor + region gate before reaching for anything heavier, and always dump the mask to verify. (2)
Compare like-for-like POSE or the IoU lies — pose before you measure shape. (3) When the gap encodes a
contradiction between two prior requests, STOP and surface it; don't silently pick one.
**→ Leapfrog:** add a posed (spread-wing) render option to the core, resolve span-vs-chord with the human,
then this same overlay regression-guards every future shape tweak against the concept.

---

## Lesson — Used the loop to act: added a wing-CHORD knob (shallow module wall) + a headless POSE; the metric then said the real gap is PROPORTION, not chord.

Drove the silhouette loop end-to-end on Pearl. (1) POSE: the core can now hold the Mk II yoke wing at any flap
phase headlessly — a neutralised copy of dragon.js's `poseY` (`renderSilhouette({pose:'downstroke'})`), so we
compare a posed concept against a posed build, not the flat rest pose. Sweeping all 5 phases barely moved the
bbox-aligned IoU (20→27%) → the gap is NOT pose. (2) The human's "concept wants lush wings but I trimmed the
span" was resolved as "add depth, keep span": Pearl's wing is the bespoke `buildSeraphWing` and chord lived in
a hardcoded `chordAt` — a SHALLOW module wall. Added `model.wingChordScale` (default 1 = byte-identical for
every other dragon; registered in `creatureGrammar.js`), multiplying chord only; it deepens the feather fan
AND the feathers (len = chord·lenScale) WITHOUT span, and is TRI-NEUTRAL (203073 unchanged — same feather
count, just deeper). Pearl set to 1.4 → visibly fuller wings. blueprint 3/3, flapcheck 16/16.

THE MEASUREMENT EARNED ITS KEEP by being humbling: a chordScale sweep 1.0→2.2 moved IoU only 27→29%, because
the IoU is bbox-NORMALISED — it measures fill-pattern/proportion, and the concept is TALLER-than-wide (0.89
aspect: long trailing tail + steep wing downsweep) while the build is WIDE-and-short (1.67). So the dominant
remaining gap is PROPORTION — tail length + vertical wing droop — not chord. Without the overlay I'd have kept
dialing the wrong knob and called it "close enough". Caveat noted for next time: a bbox-aligned IoU hides
overall-proportion error (it's normalised away) and is too crude to optimise a single shape knob — trust the
VISUAL overlay for fine work and use the number only for gross "are we even close" reads.

**→ Leapfrog (next levers, measured-as-needed):** lengthen the `seraphTail` trail + push the wing downsweep
(deeper flap `downDepth`/dihedral, or a steeper climb pose) to buy the concept's vertical drama; then the
overlay regression-guards the whole proportion, not just the wingspan number. Bigger structural unlock still
open: continuous TORSO profile knobs (the body plan remains the one bespoke-code part).

---

## Lesson — The body WAS always sculptable; "can't shape it" was a discoverability gap, not an engine limit. Proved + shipped an hourglass on Pearl.

The human's long-standing frustration ("I want a barrel chest, pinched waist, a bit of hip — an hourglass —
and I can't make it") turned out NOT to be an engine wall. `seraphHull` (and the generic `dragonTorso`) build
the body as a LOFT THROUGH ELLIPTICAL CROSS-SECTIONS — `loftEllipse([{z, rx, ry}])`, rx = half-WIDTH (what the
rear/3-4 cam sees), ry = half-HEIGHT. An hourglass is just those numbers: broaden the chest rings, pinch the
waist ring, add a hip ring. The reason it felt impossible: the widths are hardcoded constants with no dial, AND
the shipped profile was one shoulder bulge tapering both ways, never sculpted into chest/waist/hip.

To PROVE it I added two tool capabilities (committed): a top-down view and `--no-wings` / `renderSilhouette
({hideWings})`, because spread wings OCCLUDE the torso from rear/top (true in the chase cam too) — you can't
inspect a body silhouette without dropping the wings. With wings hidden, current Pearl read as a uniform
spindle; an edited loft read as a clear barrel-chest/waist/hip hourglass. KEY VIEWING FACT the human supplied:
the body is NOT only seen in the rear chase cam — a hard bank L/R, a wall crash, and the SHOP all show a 3/4
angle where the CHEST + flank are wide open (added a `threeq` view for it). So body shaping pays off; the
chest is just hidden specifically in straight rear flight, while waist/hip/tail read even there.

SHIPPED: a tasteful hourglass on Pearl's `seraphHull` loft (rounder barrel chest kept ≤ the gorget radius 0.53
so the gold collar still reads proud; pinched waist; hip flare). +192 tris (2 extra rings), 203265 total, 0
over budget; blueprint 3/3, flapcheck 16/16. Human judges the textured result on the preview (3/4 bank).

Rules: (1) before declaring a shape "impossible", find HOW the part is generated — a loft-through-sections body
is fully sculptable by its section list, even with zero new code. (2) To inspect a BODY, hide the wings (they
occlude every overhead/rear angle). (3) Ask WHICH cameras reveal a feature before deprioritising it — the 3/4
bank/crash/shop views made body shape matter more than the rear-cam-only assumption implied.
**→ Leapfrog:** promote this to reusable `chestScale`/`waistScale`/`hipScale` knobs (the wingChordScale
pattern) so every dragon dials an hourglass from dragons.js without editing a builder — the real systemic
unlock behind "give the body more shape".

---

## Lesson — Wrote the model-creation guide (the deferred "authoring guide" pillar), aimed at an LLM author.

`reforged/MODEL-CREATION.md`: a concrete, code-harvested guide to the whole creation system — axis/units
+ chase-cam cheat sheet, the build pipeline (dragons.js → ascension → recipe registries → buildDragonModel
→ grammar), the blueprint anatomy, the full MODULE menu (every registered torso/wings/head/tail builder),
the full DIAL vocabulary with ranges (straight from creatureGrammar.js), HOW shapes are made (body = loft
through cross-section rings — the key idea — plus the attach contract, wings, the mechaKit primitives,
surfaceLayers, forms), the silhouette-first verification loop (silhouette.mjs / overlay / gates), the honest
LIMITATIONS (procedural-only, bespoke bodies, discrete parts/forms, flap-rig assumes a flyer, no legRoot,
shape-only headless render, wing occlusion), what could be PUSHED (reusable chest/waist/hip dials, legRoot,
rigid wing-fan, spline profiles, humanoid archetype, headless lit preview), and crucially a §10 OUTPUT FORMAT
the LLM must emit (parts + dials + cross-section ring list + colors + forms + reuse-vs-NEW-MODULE) so its
specs map 1:1 onto what the engine consumes and are actually recreatable. §11 works the flying-Gundam example
end to end (≈70–80% feasible; reuse thrusterPod/mechaLeg/kit, NEW humanoidTorso + legRoot + dense rigid fan).

Reusable insight: the engine's grammar (creatureGrammar.js) + registries ARE the authoring vocabulary —
the guide HARVESTS them rather than inventing a schema, so it can't drift. The format that makes a model
"recreatable" by an LLM is the cross-section ring list + module names + grammar dials, NOT prose.
**→ Leapfrog:** keep MODEL-CREATION.md current as builders/dials are added; when the reusable body-profile
dials + legRoot land, update §5/§6 so the Gundam (and any humanoid) becomes a pure-data spec.

## Lesson — Built a "station reference pack" (WAV + MIDI + production briefs) from tracks.js as the single source of truth.

A request came in for, per Dragon Radio station: a doc (MIDI / WAV reference / name / description /
real-instrument style / BPM / loop length / layer notes) **plus** a rendered WAV and a MIDI per song.
All 35 stations in `reforged/js/tracks.js` were turned into deliverables under `station-reference/`
(`STATIONS.md`, `wav/<id>.wav`, `midi/<id>.mid`, and reproducer scripts in `tools/`).

What worked: **don't re-key the data by hand — harvest it.** `tracks.js` is dependency-free by design
(its own comment says so, for node unit-checking), so a 6-line `dump.mjs` `import { TRACKS }` → JSON gives
every resolved layer array. From that JSON, pure-stdlib Python rendered both formats: WAV via `wave`/`struct`
(naive oscillators matching each voice's `osc`, four-on-floor kick, octave/detune stacks, per-track swing),
MIDI via hand-written bytes (format-1, 480 TPQ, eighth=240 ticks, one MTrk per layer: melody/bass/high/arp/pad;
freq→note via `69+12·log2(f/440)`). Timing fact worth keeping: **every station is 8 bars × 8 eighths in 4/4,
so loop seconds = 1920 / BPM.** The "real-instrument style" field can't be harvested — it was authored per
genre (mapped off each track's `desc` + `MIX` preset family).

Gotchas: numpy isn't in this env (stdlib only); the pure-Python per-sample synth is slow (~1 min for all 35,
fine for a one-shot); 35 mono 22050 WAVs ≈ 23 MB committed — acceptable for a reference artifact but keep WAVs
out of any hot path. The reactive-layer semantics (arp on boost, high at combo ≥1.5×, percussion ≥2–3×, fever
lead during Dragon Surge) live in the tracks.js header comment — quote them in the doc, don't reinvent them.
**→ Leapfrog:** these stations are pure data; any "give me X per song" ask (stems, sheet music, a karaoke
view) is a new emitter over the same `dump.mjs` JSON — add emitters under `station-reference/tools/`, never
hand-transcribe note tables.

---

## Lesson — Built the TRACER: a human-in-the-loop "trace a concept → hand Claude the shape" tool.

The pain: the human uploads a reference image and asks Claude to trace it; Claude guesses pixel coords
badly, and it devolves into "move it left / up / down" prompt ping-pong. Fix = invert the loop. The
silhouette-overlay tool is **machine→human** (we render, human judges); the new tracer is **human→machine**
(human traces, we consume). `reforged/tools/tracer.html` (zero-dep, vanilla, no build — runs on every PR
preview at `…/reforged/tools/tracer.html`): drop an image → **auto-trace** by clicking the subject
(flood-fill → `largestComponent` → Moore boundary trace → Douglas–Peucker simplify → editable ring) →
drag/insert/delete dots, straight or Catmull-Rom smooth → multiple **named paths tagged by view**
(side/top/front/free) → export JSON. The payoff hook: a path tagged **side** gives `ry`, one tagged **top**
gives `rx`, and the tool derives a best-effort **`loftEllipse` ring list** (`{z, rx, ry}`, head −1→tail +1,
body-length units) — the EXACT format a torso builder consumes (MODEL-CREATION.md §6a). So the human's trace
becomes a near-ready cross-section spec, not prose.

What made it solid (the reusable patterns):
- **Pure core, DOM-free, headlessly tested.** All the math lives in `tools/tracerCore.mjs` (masks, contour,
  simplify, deriveProfile, toLoftRings) so `tests/tracer.mjs` runs in plain node (synthesize an RGBA ellipse,
  assert each stage). Same split the silhouette tools use — geometry separate from canvas/UI. **Build the
  testable kernel first; the HTML is just IO around it.** This is how you "verify before claiming" for a tool
  that's otherwise browser-only (no Chromium in CI — L-handoff: WebGL/Playwright tests can't run here).
- **The aspect-ratio trap (the test earned its keep).** Points exported normalised per-axis (`x/W, y/H`) are
  ANISOTROPIC — deriving radii from them distorts every cross-section by the image's W/H. The headless test
  caught a 0.389-vs-0.292 mismatch on the first run. Fix: `deriveProfile` takes `aspect = W/H` and pre-scales
  x into image-height units before sampling. **Lesson: per-axis 0..1 normalisation is fine for *storing*
  points but WRONG for any proportion/length math — restore isotropy first.**
- **Auto-trace = flood + largest-blob + boundary-trace + simplify**, with tolerance/point-count dials and
  three sources (click-subject / background-corners→invert / alpha cut-out). Always keep raw points in the
  export too, so the trace is usable even when the loft derivation is only approximate.

**→ Leapfrog:** next time the human wants a new creature from a reference, point them at the tracer first —
they hand back a `loftEllipse` ring list + tagged outlines, and the build starts from real numbers instead
of a guess. Extend later: trace the WING outline → emit `wingForms[]` (`tips/lead/scallop`) directly;
overlay the BUILT silhouette behind the trace so correction is one screen; let a path drive `profile.stations`
(`[z, halfWidth, keelTop, belly]`) for the airfoil torsos, not just `loftEllipse`.

---

## Lesson — Tracer v2: wing-RIG + connection points + part tags (human steers the build, not just the shape).

The human used the v1 tracer, traced a banking-pose dragon, and hit the wall the tool was built to expose:
a 3⁄4 flight silhouette is mostly WING, so the body-of-revolution `loftEllipse` derivation (which assumes a
clean side profile spun around its long axis) read the wingtip as "head" and produced a blob. Rendering the
trace back to a PNG (reusing `silhouetteCore.pngGray`, pure node — `scratchpad/render-trace.mjs`) made this
obvious at a glance and confirmed the round-trip is faithful. **Takeaway: always rasterize a received trace
and show it back before building — "verify before claiming" applies to INPUT too.**

The human then drove the tool forward with the right instincts (they've absorbed the unified-hull thesis):
(1) don't build on LEGACY bolted-on wings — they gap off the body (L20–L32); use the continuous hull.
(2) Let me trace the JOINING point so the build knows how a part connects. (3) Tag a trace as
wing/torso/tail/head. Plus two UX bugs: adding dots drew "weird lines to a far dot", and there was no full
reset. v2 (`tools/tracer.html` + `tools/tracerCore.mjs`):
- **Wing-rig mode** — place root→wrist→lead→finger-struts (outer→inner); `deriveWingForm()` (pure, tested)
  builds a wing-LOCAL frame at the root (x=span to the outer tip, y=chord toward the lead) and scales so the
  outer tip sits at the engine's `targetSpan` → emits the `wingForms[]` planform DIRECTLY (tips x-descending,
  lead +y, per `dragonParts.buildWingShape`). A flat trace can't measure the 3-D `scallop`/`arc{}` lift, so
  those ship as tunable defaults. **The trace now hands over engine data, not pixels to guess from.**
- **Connection points (⊕ joint)** — a per-path attach marker. For a wing it's the wing-root locus
  (body-Z + radius) the continuous hull needs, so wings grow from the body skin, not bolted on.
- **Part tags** (`part`: wing/body/tail/head/neck/leg/…) — the semantic label that says which BUILDER a
  trace feeds, orthogonal to the view angle. Loft derivation now prefers the `body`-tagged outline.
- **The add-dot bug** was the closed-loop closure line: new paths defaulted to `closed:true`+`smooth`, so
  every new dot drew a curve wrapping back to dot #1 ("a far dot"). Fix: manual outline paths default
  **open + straight** (dots connect in click order, literally); auto-trace still lands a fresh closed+smooth
  path (and the Add tool refuses to append into a closed loop — it spawns a new path). Plus a **Reset all**.

Reusable insight: **the right division of labour is human-tags-semantics, tool-does-math, engine-consumes-data.**
The tracer shouldn't guess what a blob IS (auto-wand gives a shape, not a meaning); the human tags it
(`part`, `joint`, wing rig) and the pure core converts geometry to the exact builder format. Sequencing
lesson: when the build needs data the tool can't yet supply, **upgrade the tool first** — building the
dragon from a guessed wing rig + connection would have been the very "back-and-forth" the human is killing.
**→ Leapfrog:** next, build the new SSSR creature on the UNIFIED/continuous hull (NOT legacy) from the
human's next trace (wing rig + joint + body outline); extend `deriveWingForm` to estimate `scallop` from the
mean finger-notch depth; add tail/head rig modes the same way; overlay the BUILT silhouette behind the trace
so correction is one screen.

### L89 — Clean-sheet creature path: a NAMED-ANCHOR rear-cam silhouette blueprint, solved as a 2D logo BEFORE any 3D
The human's frustration with the roster's creature generation is structural: **bolting parts from other
dragons cages every wing in an archetype** — certain bodies dictate how/where wings can attach, so "a new
kind of wing" keeps collapsing back into the shipped silhouettes. The fix is not another part builder; it is
a different *source of truth*. New coexisting system (zero roster touch), the **Celestial Storm / Prism
Wyvern**:
- **`js/celestialStormSpec.js`** — the creature is DEFINED by named anchor points in a normalized rear-cam
  frame (X horizontal, Y up, Z subtle; origin at the wing root; symmetric across X=0). Body stations +
  widths, wing `root→elbow→wrist→tip` leading bones + four trailing scallop anchors, dorsal-spine ramp,
  tail-spear, horns, vein runs, style, and **`silhouetteRules`** (the invariants the read must keep). The
  right wing is `mirrorWing(left)` — authored once, symmetric by construction.
- **`js/celestialStormSilhouette.js`** — PURE (no three, no DOM): spec → named 2D paths (body hull lofted via
  Catmull-Rom width profile, 3 membrane panels, finger-spoke bones, an **outward-bowed scalloped trailing
  edge**, seeded-jitter lightning veins, tapering diamond spine plates, spear+fins, horn V). Same blueprint
  feeds the renderer, the test, the 3D extrusion later.
- **`tools/celestialSilhouette.mjs`** — headless software rasterizer (scanline fill + disk-stamped strokes,
  src-over alpha) → a colour PNG with **no WebGL** (Chromium is blocked here). This is the Phase-1 verify
  loop: render, look, tune the *numbers*, repeat. First render already read as the concept: wide shallow-V
  wings dominate, narrow glowing central spine, scalloped membrane, spear tail, small horned head.
- **`tests/celestial.mjs`** — pins the `silhouetteRules` (wings dominate, body narrow, tips sharp+high+outer,
  trailing edge sags in ≥3 bays, spine centred+tapering, spear is the lowest centred point, mirror symmetry,
  vein determinism). 10 checks, so a future numeric tune can't silently break the read.
- **`tools/celestialTracer.html`** — Phase-4 QA overlay: load the concept image behind the live generated
  silhouette, **drag anchors** (left+body; right mirrors), number-only sliders (wingspan/tip-height/scallop/
  body/tail/spine), export the tuned spec. "Adjust coordinates until it matches; never redesign mid-tune."

Gotchas: (1) **don't import `silhouetteCore.mjs` for its PNG encoder** — it `await import`s three + the whole
roster at module load; inline a ~15-line `pngRGBA` and the Phase-1 tool stays dependency-free + instant.
(2) Vein jitter MUST be a **seeded** PRNG (`mulberry32`), not `Math.random`, or renders/tests aren't stable.
(3) Renderer framing: map y=0 to `H/2 + midY*scale` to vertically CENTRE, else an X-limited fit pins the
creature to the top. (4) `badges.mjs`/other Playwright tests fail in this sandbox (no browser) — that is
pre-existing/environmental, not a regression; the pure-node tests + tricount are the real gate here.

Reusable principle: **design the creature, don't assemble it — from named coordinates, mirrored rules, and a
rear-readable 2D logo first; depth, materials, glow, animation come AFTER the silhouette is beautiful.** This
is the same "blueprint not builders" thesis as the hull arc, but starting one level earlier (the *shape spec*
itself) so a wing is no longer hostage to a body's attach geometry. **→ Leapfrog:** Phase 2 = extrude this
exact blueprint to 3D (thin membranes, medium bones, raised spine, lofted body) keeping rear-readability;
Phase 3 = materials/outline/glow; Phase 4 = wire the tracer overlay against the human's concept and converge
the numbers; then register `celestialStorm` as a real creature via the grammar (coexist → hero → migrate).

### L90 — Creature shape comes from AUTO-TRACING registered concept-art LAYERS, not hand-placed anchors
Hard course-correction from the human: the L89 hand-authored anchor rig was **"trash"** — a procedural
guess at the silhouette will never match the art. The human's actual workflow (and his own tool) is the
**inverse auto-trace**: feed a cut-out image, get an accurate ~200-point outline back. The unlock he handed
over: the concept art **separated into registered layers** — `full`/`wings`/`torso`/`spine`, every PNG the
**same 941×1672 canvas**, so each layer's pixels are already in absolute position and their traces composite
with **zero manual alignment**.
- **`tools/traceLayers.mjs`** runs the tracer pipeline headlessly over the vendored layers
  (`tools/refs/celestial/*.png`): `subjectMask` (not-near-white; these exports are colortype-2 RGB on a
  flattened ~white bg, so **`alphaMask` is useless — there's no alpha channel**; flood/threshold off white
  instead) → `topComponents` (a multi-blob extension of `tracerCore.largestComponent` — **wings are TWO
  blobs**, take the two largest; torso/spine are one) → `traceContour` → `simplifyToBudget(eps, budget)`.
  Output: 236-pt torso, 111+104-pt wings, 223-pt spine = **674 real vertices**. `--art` fills each traced
  contour by sampling the source pixels (point-in-polygon) → a near-pixel-perfect reconstruction that PROVES
  the boundary hugs the art; default = a clean cel-shaded vector fill; `--emit` writes the data.
- **`js/celestialTrace.js`** (emitted) is the NEW source of truth — normalized 0..1 outlines on the shared
  canvas. **`tests/celestialtrace.mjs`** pins it (canvas, torso1/wings2/spine≥1, normalized, >400 pts,
  vertical body, centreline spine, wings mirror about x=0.5). 5 checks green.
- **`tools/pngDecode.mjs`** — standalone 8-bit PNG decoder (colortype 2/6, unfilter + zlib), so the trace
  tool doesn't drag in `silhouetteCore` (which `await import`s three + the whole roster at load).

Gotchas: (1) **registered layers are the whole trick** — same canvas size ⇒ traces drop on top of each other;
don't try to re-derive relative placement. (2) colortype-2 means **no alpha** — verify with the IHDR byte
before reaching for `alphaMask`. (3) wings need a **2-component** trace; `largestComponent` alone silently
drops the second wing. (4) `simplifyToBudget` only GROWS eps from your seed, so to get MORE scallop detail
pass a SMALLER seed eps (0.4), not a bigger budget. (5) the source art is reference, not a runtime asset —
it lives under `tools/refs/`, and only the derived **vector data** (`celestialTrace.js`) feeds the game, so
the "100% procedural, no asset files" rule holds (coordinates, not bitmaps).

This **supersedes L89's hand-anchor `celestialStormSpec`** as the silhouette source (the spec/tracer files
stay only as a possible point-editor UI later). Reusable principle: **trace the art, don't guess it** — when
the human has reference, the job is faithful extraction (registered layers → per-layer auto-trace → composite
→ vector data), and procedural creativity belongs in the 3D extrusion + animation, NOT in re-inventing a
silhouette the artwork already specifies. **→ Leapfrog:** Phase 2 = extrude `CELESTIAL_TRACE` to 3D — each
layer outline becomes a thin shelled membrane/body/spine at its own Z (wings back, body mid, spine raised +
emissive), keeping the rear read; then materials/glow/outline; then register `celestialStorm` via the grammar.

### L91 — Line-art STENCILS trace best via fill-from-border + de-staircase + arc-length RESAMPLE (200–400 even dots)
The colour-layer trace (L90) was "not accurate enough"; the human supplied clean line-art **stencils** (body /
wings / spine, same 941×1672 canvas) and asked for the *most accurate technique* with **200–400 dots**, wing
traced once + mirrored. Stencils are not filled cut-outs — they're thin outlines WITH internal facet lines —
so the technique differs (`tools/traceStencil.mjs`):
1. **`inkMask`** = luminance < 200 (these are colortype-2 RGB, dark lines on white; check the histogram —
   bulk <80, AA fringe to ~200).
2. **Close stroke gaps** — `dilate` the ink by R=2 (8-neighbour) so the outline is watertight, else the next
   step leaks.
3. **`fillInside`** — flood the OUTSIDE from every border pixel through background; invert. Whatever the
   outside can't reach (interior + ink) is the SOLID silhouette — **internal facet lines vanish** because
   they're now interior. (Sanity gate: solid coverage ~5–11%; a leak reads as >40%.)
4. **`erode` R** — undo the dilation fattening so the boundary sits back on the true outer stroke edge.
5. **`topComponents`** (wings = 2 blobs) → **`traceContour`**.
6. **Density the RIGHT way:** RDP/`simplifyToBudget` plateaus at ~175 pts because a staircased pixel ring has
   no more *real corners* — raising the budget does nothing. For dense, even 200–400-dot accuracy you must
   **de-staircase then arc-length RESAMPLE**: two moving-average passes recover the sub-pixel edge, then
   `resampleClosed(n)` lays exactly n evenly-spaced points along it. Body 360 / wing 320 / spine 320 = 1320
   verts, all hugging the art. **Even resampling, not corner-simplification, is what "a large amount of dots"
   means.**
7. **Wing = trace ONE, mirror across x=0.5** (`{x:1-x, y}`) → a perfectly symmetric pair from one trace, per
   the human's instruction.

`js/celestialTrace.js` is re-emitted from the stencils (now `source:'stencil'`); `tests/celestialtrace.mjs`
tightened to require each layer be a dense 200–400-dot outline + the wings an exact mirror pair. Reusable
principle: **match the extraction method to the input** — filled cut-out → alpha/colour threshold + direct
contour; line-art stencil → seal + fill-from-border + erode, THEN smooth + arc-length resample for uniform
density. Corner-thinning (RDP) and density-resampling are opposite tools; for "trace it accurately with many
dots", resample. **→ Leapfrog:** the trace is now accurate enough to EXTRUDE — Phase 2: each contour → a thin
shelled 3D surface at its own Z (wings back, body mid, spine raised + emissive), wing mirrored in 3D too.

### L92 — Internal structure needs TWO new tracers: skeleton→polylines (struts/veins) + interior-cell segmentation (armour plates)
The outer-silhouette trace (L91) wasn't the whole creature — the human wants the **definition**: wing finger-
STRUTS + lightning VEINS, and the body's individual ARMOUR SEGMENTS + trident. Outer-contour tracing can't
get these (struts/veins are OPEN strokes; plates are INTERIOR regions), so two capabilities were built in
`tools/lineTrace.mjs`:
- **`thin` (Zhang-Suen) → `skeletonToPolylines`** — thin any line mask to a 1px skeleton, then walk the
  skeleton graph (split at endpoints deg-1 + junctions deg-≥3; each degree-2 chain = one polyline; leftover
  pure loops handled after). Drives **wing struts** (skeleton of the stencil ink, minus the boundary band we
  already traced) and **lightning veins** (skeleton of a bright-cyan threshold of the COLOUR art).
- **interior-cell segmentation** — label the components of NON-ink that DON'T touch the border; each is an
  armour plate / spinal segment / trident prong. `dilate(ink,1)` first so hairline gaps don't merge cells;
  `dilate(cell,1)` before contouring so the outline spans the ink to the true plate edge.
`tools/traceDefinition.mjs` composes both → **`js/celestialDef.js`**: `body{ silhouette(360) + plates[59] }`,
`wing{ silhouette(320) + struts[26] + veins[3], side:'right', mirror:0.5 }`. `tests/celestialdef.mjs` pins it
(dense silhouettes, ≥20 interior plates, struts inside the membrane, single-sided wing). `celestialView.html`
now renders the full definition with per-element toggles + art overlay.

Gotchas/lessons: (1) **match tool to feature class** — silhouette=closed contour, strut/vein=skeleton
polyline, plate=interior cell; three different extractions, one input. (2) Lightning veins are drawn as
DASHED segments → thinning shatters them below any length filter; **dilate (≈3) to bridge the dashes, erode
back, THEN thin**. Even so they stay sparse — and that's fine: the veins largely run ALONG the struts, so in
3D they become an emissive glow on the strut bones (matches the original "veins follow the wing skeleton"
brief) rather than a separately-traced layer. (3) cross-reference layers: struts read cleanest from the
STENCIL, veins only exist in the COLOUR art — same registered canvas, so a right-wing region mask from the
stencil cleanly selects the colour veins too. (4) Skeleton walking must mark UNDIRECTED edges
(min·N+max key) or junctions double-emit. **→ Leapfrog:** `celestialDef.js` is now a complete 2D rig — Phase 2
extrudes it: body silhouette → lofted hull, each plate → a raised shingle/relief card at its centroid, wing
silhouette → thin shelled membrane, struts → tapered bone tubes, veins → emissive lines along the struts.

ASIDE (image resolution): the TRACE always runs at the refs' native 941×1672 — no downscaling, full
accuracy. Only the chat PREVIEW PNGs were shrunk (a render scale, now hi-res + cropped). Upscaling the source
(e.g. MCP `upscale_image` to 2K/4K) would smooth edges for marginally finer sub-pixel sampling but adds no new
detail; raise the render/export scale rather than the input when "it looks low-res".

### L93 — A trace needs an ACCURACY-CHECK overlay; and struts must come from the SAME skeleton as the outline
The human caught a real merge bug: the wing struts (perfect in isolation, L92 screenshot) didn't line up to
the membrane outline once merged, and the wrist/thumb branches were missing. Two fixes:
- **`tools/traceCheck.mjs`** — the QA tool the human asked for. Overlays the emitted `celestialDef.js` lines on
  the ORIGINAL stencil ink (dim grey) at high res, per layer (`node tools/traceCheck.mjs wing|body`): traced
  lines that leave the grey are wrong; red dots mark open-stroke ENDPOINTS (a strut end floating in the
  membrane = it didn't reach the outline). This made the defect obvious instantly and must be run after every
  trace change. **Always build the visual diff, don't eyeball the merged thumbnail (L39c restated).**
- **Root cause:** the outline was traced from the FILLED silhouette while struts were a SEPARATE skeleton with
  the boundary band SUBTRACTED — so struts were trimmed ~3px short and short branches were length-filtered out.
  Fix: take struts from the FULL right-wing skeleton (`thin` → `skeletonToPolylines`, minLen 10 to keep
  wrist/thumb), and instead of deleting band pixels, **classify whole polylines** — drop a polyline only if
  >60% of it lies in the boundary band (it IS the outline); keep every internal finger-spoke WHOLE, so its tip
  ends on the boundary junction and reaches the membrane edge by construction. Struts 26→47, and they hug the
  ink. Lesson: **outline and its internal struts must be derived from one shared skeleton** (shared junctions =
  aligned), never two independent passes.
- **Sharp tips:** the body silhouette double-smooth (win4+win3) rounded the HORN tips and trident prongs;
  one light pass (win2) + resample keeps them crisp while still de-staircasing. The head+horns are captured as
  part of the body silhouette (the "shaded part") — present, just not yet a separately-labelled part.

Reusable: when a feature is correct in isolation but wrong after a merge, the bug is in the MERGE
(independent passes that don't share vertices / over-aggressive cleanup), and the cure is a shared-source
extraction + an overlay diff to prove it. **→ Leapfrog:** Phase 2 can now extrude with confidence — outline +
struts are co-registered; optionally promote the head/horn top-region to its own labelled segment for shaping.

### L94 — The stencil layers are NOT in a shared frame; place the wing EXPLICITLY (root anchor + span), and overlay-on-reference to prove it
The human zoomed the QA overlay: "what are the weird horizontal lines?" (the cyan VEIN trace — stray
horizontal fragments, not real veins → **dropped**; veins will be emissive glow along the struts in 3D) and
"the wings are incorrectly lined up with the body — check the reference + overlay". Built
**`tools/traceAlign.mjs`** (overlay the def on the full COLOUR reference) and measured layer bboxes — the key
discovery: **the stencil set and the colour set are different artworks at different scales/positions.**
stencil-wings centre-Y = 0.325 / 34.9% tall vs the colour `wings` layer 0.442 / 24.5%; the colour `torso`
layer is 88% tall vs the `full` composite at 57%. So you CANNOT auto-register one layer onto another by
bbox-fitting — it distorts and the attach height drifts (first attempt put the wings at 41% down the body).
Fix (in `traceDefinition.mjs`): the body keeps its OWN frame; the wing is **placed explicitly** —
anchor the wing ROOT (its innermost point) to the body centreline at a tunable height, uniform-scale by span:
```
const WING_SPAN = 0.94;       // both-wings span as a fraction of canvas width
const WING_ATTACH_Y = 0.26;   // wing-root height as a fraction down the body (0 = top of head)
```
Two dials, matched to the reference, nudge for up/down + wider/narrower. Now the wings sweep up-and-out from
the shoulders like the concept. Gotchas: (1) **don't trust "same canvas size ⇒ registered"** (L90) for a
DIFFERENT art set — verify by bbox/centroid before compositing; same dimensions ≠ same frame. (2) When two
sources can't be auto-registered, **expose the placement as explicit tunable constants** instead of forcing a
fragile fit — controllable + reference-matchable beats clever-but-wrong. (3) anchor by a semantic POINT (the
root), not bbox corners, so uniform scale preserves the wing's aspect. **→ Leapfrog:** `celestialDef.js` now
assembles correctly (body frame + placed wings, veins dropped); Phase 2 extrusion can read WING_ATTACH_Y as
the 3D shoulder mount height.

### L95 — Compare at MATCHED SCALE (head-to-tail), then auto-fit the wing to the reference (span + sweep, not just position)
The human: "superimpose the original with this, scale so head-to-tail lengths match (correct scale), then you
can see where the wing is vs the long axis — and the wing ORIENTATION is off." Built **`tools/traceSuper.mjs`**:
overlays `celestialDef.js` on the colour reference, scaled so the BODY head-to-tail length matches (the only
honest scale), aligned on the long axis (head & tail found on the CENTRAL column so wing tips fanning off to
the sides don't fool head detection). It prints metrics, which is what made the gap measurable instead of
eyeballed:
```
DEF wing: tip -16% (above head) · 27% out · sweep 39°
REF wing: tip -27%              · 59% out          (=> ~53°)
```
So the wing was ~HALF as wide and swept too shallow — position AND orientation wrong, exactly as flagged.
Fix in `traceDefinition.mjs`: stop hand-tuning span; **auto-fit** the wing to the art. Measure the reference
wing tip (highest subject pixel in the outer-left column) + the central head/tail axis, then place the wing by
a pure **rotate + uniform-scale about the root** (no aspect distortion) so the root sits at WING_ATTACH_Y and
the TIP lands on the reference tip. Result: DEF now equals REF (tip -27% / 59% out / 53°). WING_SCALE and
WING_SWEEP_ADJ remain as manual nudges on top of the fit.
Gotchas: (1) **a similarity transform (rotate+scale) needs ISOTROPIC px space** — do the math in `*W,*H`
pixels, not normalized units (norm-x and norm-y have different px/unit since W≠H), or you shear the wing.
(2) the wings legitimately reach ABOVE the head and PAST the canvas sides (big wingspan) — the old test
assertion "all wing coords in 0..1" was wrong; bound wings to a sane envelope, keep the body strict.
Reusable: **to compare a trace to reference art, normalize scale by a length you can measure in BOTH
(head-to-tail on the central axis), print the residuals, and fit a transform to them** — overlay + numbers
beats eyeballing every time. **→ Leapfrog:** the wing is now art-accurate in span+sweep; 3D extrusion reads
WING_ATTACH_Y (shoulder mount) and the fitted wing directly.

### L96 — Phase 2: extrude the 2D definition to 3D (standalone previewer first), and label sub-parts BEFORE extruding
With the 2D `celestialDef.js` matched to the reference (L92–L95), Phase 2 extrudes it to 3D — built as a
STANDALONE previewer (`tools/celestial3D.html`), never touching the shipped roster (THE RULE #3). What worked:
- **Label sub-parts in the definition first** (additive): `body.head {neckY, topY, outline, horns[2]}` (head =
  body above the narrowest upper-third row; horns = highest silhouette point each side) and `wing.sparIndex`
  (the strut reaching closest to the wing tip = the leading-edge arm bone). The 3D build reads these directly
  (horns → cones at the tips; spar → a thicker emissive tube).
- **Extrusion strategy that survived contact:** the BODY is a LOFT — scanline the silhouette per Y-row for its
  outer span (`crossings()`), build an elliptical ring per row (depth ≈ 0.5×half-width), stitch into a tube +
  end caps. Plates + star-flecks are projected ONTO the hull via `bodySurfaceZ()` (the ring's front-z at an
  (x,y)), so they wrap the body instead of floating. WINGS use `THREE.ShapeUtils.triangulateShape` for the
  membrane panel (handles the concave scalloped trailing edge that a centroid-fan would wreck) + `TubeGeometry`
  struts, each wing on its own shoulder PIVOT group so it can flap.
- **Coords:** canvas (x right, y DOWN) → world `((x-.5)·ASPX·S, (.5-y)·S, z·ASPX·S)`, ASPX=W/H — flip Y, scale
  X by aspect so proportions hold; z in x-units so depth isn't stretched.
- **Headless verify (no browser):** `tools/celestial3Dshot.mjs` drives it via Playwright + `tests/serve.mjs`,
  exposing `window.__ready` + `window.__view(yaw,pitch,flap)` hooks; captures rear / high / ¾ / side and asserts
  no pageerror. Rear view reads unmistakably as the creature; ¾ shows real volume.
Gotchas / next: the LOFT bridges the TRIDENT tail prongs into a paddle (scanline outer-span ignores the gaps) —
the tail needs per-prong handling. Membrane is flat (slight back-sweep only) — add billow later. **→ Leapfrog:**
geometry pipeline proven on the hero in isolation; next refine tail/membrane, then migrate into the game's
dragon model behind a flag — never break the shipped roster.

### L97 — Rear-cam wingbeat is DORSOVENTRAL (about the forward axis), not in-plane; and decorations must SEAT on the hull
Human reviewed the 3D previewer (L96) and caught two things the headless shots didn't flag:
- **Flap was in the wrong plane.** I had rotated each wing about Z/X, which sweeps the wing WITHIN the flat
  rear-view plane (windshield-wiper). For a rear chase-cam the beat is DORSOVENTRAL — rotate each wing about
  the body's FORWARD axis (here Y, since head→tail runs up the screen) so the wings lift up off the back and
  press down, tips travelling through DEPTH (Z). Fix: `pivot.rotation.y = side * sin(t)·amp` (mirror per side
  so both rise together), zero the others. Reads as a real beat from a slightly-high rear cam; note it
  foreshortens from dead-rear (inherent — that's why chase-cams sit ABOVE and behind).
- **Star-flecks looked like they encoded thickness.** They're decorative (the celestial theme's armour stars),
  but I lifted them a uniform 0.06 off the hull, so in ¾ they floated and implied a dimensional meaning. Seat
  decorations nearly flush (+0.015) so they read as MARKINGS, not floats. Lesson: any offset a viewer can see
  will be read as encoding something — only offset when you mean it.
Reusable: headless screenshots catch crashes + gross layout, but **motion correctness (which plane a beat is
in) needs either an animated capture or the human** — add up/down POSE captures (`window.__flapPose(a)`) so the
beat direction is reviewable in static stills. **→ Leapfrog:** previewer now beats correctly; tail/membrane
refinement still pending before migrating into the game model.

### L98 — Blockout lock: multi-span loft branches the trident tail; membrane billow
Human chose "lock the blockout before surfacing" (right call — get bones exact, surface once). Two structural
fixes to `tools/celestial3D.html`:
- **Trident tail** was paddled because the loft took only the OUTER span per row (first/last crossing),
  bridging the 3 prongs. Fix: the loft now reads ALL spans per row (`crossings` → consecutive pairs), builds a
  ring per span, and matches rings between adjacent rows by centroid-x; an unmatched ring = a prong tip → cap
  it. So 1 span → 3 spans branches into a real trident. `stations` (for plate/star surface projection) keeps
  the WIDEST span per row = the main body. Reusable: **a scanline loft that takes only the outer span can't
  represent a branching silhouette — key on every span + match by centroid to support splits/merges.**
- **Membrane billow:** flat sheet → `zWing = -sweep·d - 0.06·sin(π·d/maxSpan)`, a backward cup peaking
  mid-span (0 at root + tip) so the wing reads as a curved membrane, struts riding on top.
Blockout now holds the anatomy (proportions, wing fit, dorsoventral beat, trident, billow). NEXT = the
surfacing/sculpt pass (solid raised plates, translucent membrane+veins, material star-flecks, real horns) —
then migrate into the game model behind a flag. Don't surface until the human signs off the bones.

### L99 — Surfacing pass v1: raised armour scales (centroid-fan domes) + glowing seams; drop placeholder star dots
Human signed off the blockout ("looks good"), said the dot star-flecks "look bad" (placeholders → removed), and
said proceed to surfacing. First surfacing increment on `tools/celestial3D.html`:
- **Raised armour scales:** each plate polygon becomes a low DOME — centroid lifted off the hull
  (`surfZ+0.011`), boundary seated (`surfZ+0.002`), fan-triangulated (centroid→edge). Plates are convex-ish
  cells so a centroid fan is safe (unlike the concave wing, which needs `triangulateShape`). All domes merged
  into ONE BufferGeometry (no mergeGeometries util in the repo — accumulate pos/idx by hand). Raise tuned to a
  FRACTION of the local hull depth, not a constant — a constant raise spiked through the thin neck (body front
  bulge is only ~0.14 world; an 0.05 raise = a 2× spike). Lesson: **offsets that read as relief must scale to
  local thickness, not be absolute.**
- **Glowing seams:** the old wireframe plate loops survive as emissive seam LINES at the raised edge
  (`surfZ+0.006`), in their own `seamGrp` (toggle), so the armour reads as segmented cosmic plating.
- **Curved horns:** cones → tapered rings along a curling centerline (up + dorsal + back), per-side mirrored.
- **Membrane** opacity 0.93→0.8 (more translucent); body/plate materials nudged metallic+emissive.
Reads as an armoured cosmic dragon from the rear now (not wireframe). NEXT polish candidates: more pronounced
OVERLAPPING plates (scale lip), membrane veins, iridescent body shader. Then migrate into the game model.

### L100 — Wing bones were mis-EXTRACTED (skeleton was fine); rebuild as a radial framework hub→every tip
Human (with an annotated reference) caught that the wing bones were wrong: finger struts didn't reach the
scallop POINTS, and the leading frame + thumb + long projection weren't traced as bones at all. Built
`tools/traceWingBones.mjs` (renders the raw right-wing ink SKELETON, each chain a distinct colour + endpoints)
and verified: **the skeleton contains every bone** — leading frame, fingers to each scallop tip, thumb, long
projection. So the defect was in the EXTRACTION, not the trace. The old code filtered skeleton polylines by
"fraction in the boundary band" and dropped anything mostly-boundary — which threw away the LEADING FRAME
(it runs along the top edge) and trimmed finger tips short of the scallops.
Fix (in `traceDefinition.mjs`): stop filtering the messy fragmented skeleton; rebuild bones as the ANATOMY —
(1) find the WRIST HUB = densest cluster of skeleton-chain endpoints; (2) find membrane TIPS = prominent local
maxima of distance-from-hub around the silhouette (these ARE the scallop points + wingtip + thumb + long
projection); (3) bones = arm(root→hub) + leading-frame(hub→wingtip) as one spar, plus hub→each remaining tip.
Result: 8 clean bones that terminate exactly on the pointy tips, by construction. Lesson: **when a feature is
present in the source skeleton but missing in the output, the bug is in the extraction filter — and "key on the
boundary band" conflates two different boundaries (the leading frame IS a bone; the trailing scallop edge is
not). Reconstruct from semantic anchors (hub + tips), don't filter the raw skeleton.**
Also this pass: body cross-section made a fuller egg (dorsal 0.95 / ventral 0.82, was 0.66 — read as a flat
half because the belly was shallow AND unlit) + a ventral fill light so the volume reads. Bone colour stays
bright cyan for IDENTIFICATION during structural review; switch to the reference's dark tone once bones are
signed off.

### L101 — Wing bones MUST be traced from the stencil ink, not invented; verify by overlaying on the stencil
Two wrong turns the human caught hard: (1) the band-filter dropped the leading frame; (2) my "radial hub→tip"
rebuild was INVENTED straight lines with the wrist in the wrong place (0.60,0.41) — "you're making it up."
Ground truth: `tools/traceWingBones.mjs` v2 — isolate one wing, skeletonize the ink, mark the graph (endpoints
red, junctions blue, dominant junction lime). It showed the real wrist at ~(0.73,0.28) and, crucially, that
the SCALLOP TIPS are junctions where fingers meet the outline (not free endpoints). The faithful extraction:
**skeleton of the drawn ink MINUS a thin (~4px) outline ring = the internal struts, which lie exactly on the
stencil's drawn lines** (medial axis). Verified by overlaying the extracted struts (orange) on the stencil ink
— they sit on the drawn finger lines. Ported into `traceDefinition.mjs` (33 struts). Lessons:
- **For art-derived geometry, the trace IS the source of truth — extract from it, never synthesize "clean"
  geometry that you then hope matches. Always overlay the result on the source art to verify (the orange-on-
  stencil check); if it doesn't follow the ink, it's wrong.**
- A debug-draw bug to remember: a blend that writes only integer pixel offsets draws NOTHING when given a
  fractional stroke radius (1.5) — use integer widths. (Cost a confusing "why is nothing orange" round.)
Open: the stencil skeleton fragments at every crossing, so the struts come through as SEGMENTS — next step is
welding collinear fragments across junctions into continuous bones (straightest-continuation walk).

### L102 — When auto-extraction keeps being wrong, build the human an INTERACTIVE labeler
After repeated wrong auto-traces of the wing struts, the human asked for a tool to do it by hand. Built
`tools/celestialWingPaint.html` (pure canvas, imports lineTrace). Three modes:
- **FILL** — flood-fill each membrane compartment (bounded by the drawn ink); the borders shared between two
  fills ARE the finger struts (extracted via "ink adjacent to ≥2 region labels" → thin → polylines). A fill
  that reaches the image border is the exterior background → auto-reverted.
- **TRACE** — click points that SNAP to the nearest drawn ink pixel → manual bone polylines on the lines.
- **BRIDGE** — click 2 points to burn a line into the ink mask, closing gaps in the drawing so fills don't
  leak and lines join (re-applied after threshold changes).
Exports `celestial-wing-struts-{R|L}.json` (traced bones preferred, else fill-derived struts, plus bridges).
Lesson: **art-derived geometry that the algorithm keeps mis-reading is a cue to hand the human a direct
labeling UI rather than iterating the heuristic — the human's clicks become the ground truth, and the tool
just snaps/cleans.** Next: ingest the exported JSON into celestialDef as the wing struts.

### L103 — Wing struts from membrane COMPARTMENTS (the human's insight), not from the skeleton
The human's idea cracked it: the drawn struts TILE the wing into membrane cells; the line BETWEEN two cells IS
a finger strut. `tools/traceWingCells.mjs` auto-fills every interior (enclosed, non-border) non-ink cell of the
right wing, then marks a strut pixel as ink with TWO different cell-labels within radius R, thins → polylines.
Overlaying on the stencil, the struts sit EXACTLY on the drawn lines, radiating wrist→scallop tips + leading
edge. Ported into `traceDefinition.mjs` (13 cells → 26 struts). This beats every skeleton approach because it
keys on the SPACES the artist enclosed, not the noisy medial axis.
Also: the interactive painter (L102) exported 0 struts on first use — the strut detector required an ink pixel
touching two fills within 1px, but the drawn lines are several px THICK so the cells never met through them.
Fix (both tools): check a RADIUS (~7px) so a thick line between two cells still registers. **Lesson: adjacency
tests across a drawn boundary must span the boundary's WIDTH — a 1px neighbour test silently returns nothing on
thick strokes.** And: the human's segmentation framing ("fill the cell, the outline is the bone") was the right
mental model — when an auto-trace keeps failing, adopt the human's framing literally.

### L104 — "Uncolored = bone": the bones are ALL the drawn lines, not just inter-cell dividers
The human painted the membrane cells and corrected the model: coloured = membrane, EVERY uncoloured line that
joins up = bone. My L103 "border between two cells" extraction only caught dividers BETWEEN two membrane cells,
so it missed every bone bordering a cell and the EXTERIOR — the leading frame, wingtip spikes, scallop edges.
Fix: bones = the FULL skeleton of the wing ink (within the kept-cells' padded bbox so spikes/frame are
included), not the inter-cell subset. `traceWingCells.mjs` overlays it: orange now covers every uncoloured line
exactly. 13 cells → 88 bone polylines. Lesson: **don't over-filter art the human calls "all bones" — the
membrane cells are only useful for LOCATING the wing; the bone set is the whole drawn line structure.** The
compartment fill is the verification (what's membrane), the skeleton complement is the answer (what's bone).

### L105 — Ship the human a BONE EDITOR (auto-extract + correct), and: trailing scallop edges are membrane
Human asked to weld + for an editor to fix/label it, and corrected the anatomy again: the back (trailing)
scalloped edges are the MEMBRANE's edge that meets the struts — NOT bones. So a pure "all uncoloured = bone"
(L104) over-includes the trailing edge. Resolution: stop heuristically guessing which lines are bone vs
membrane-edge — give the human direct control. Built `tools/celestialBoneEditor.html`: on load it auto-extracts
the welded bone skeleton (same pipeline as the node tool, in-browser), then the human edits:
- **delete bone** — click a line to remove it (use on the trailing scallop edges).
- **add bone** — click points snapping to the drawn ink.
- **bridge gap** — 2 clicks burn a line into the ink to seal leaks.
- **tag membrane** — flood a cell to mark what's NOT bone.
Exports `celestial-wing-bones-R.json` to ingest as the authoritative struts. Lesson: **after 4 rounds of the
algorithm mis-classifying art, the right move is a direct-manipulation editor seeded with the best auto result
— the human's edits are ground truth, and welding/snap/bridge just make editing cheap.** Also: weldChains
(greedy collinear-end join) turned 88 fragments → 31 continuous bones.

### L106 — Bone editor UX: snap bridges to existing line-ends, sealed-region feedback, vein tagging
Human-driven editor refinements (tools/celestialBoneEditor.html):
- **Bridges snap to existing geometry**, not freehand: a bridge endpoint snaps to the nearest BONE vertex
  (fallback nearest ink) so gaps close by joining real line-ends cleanly. Clicking an existing bridge deletes it.
- **Sealed feedback**: flood the EXTERIOR from the image border over non-ink; the enclosed right-wing interior
  (non-ink, not exterior) is tinted GREEN and recomputed on every ink change. The human watches the green grow
  as they bridge gaps — a notch reaching in = an unsealed gap. Direct "is it watertight?" signal.
- **Vein mode**: snap-trace lightning veins (stored + exported separately from bones).
- Delete works on bones AND veins by proximity.
Lesson: **an editor for art labeling needs (a) snapping to existing features (not freehand) for clean joins,
(b) a live validity signal (sealed/green) so the human knows the result is usable before exporting, and (c)
separate layers per semantic class (bone vs vein vs membrane).** Export: celestial-wing-bones-R.json {bones,
veins, bridges}.

### L107 — The struts are OUTLINED shapes → flood-tag bone regions (not just lines)
Key model correction from the human: the struts are drawn as OUTLINED shapes (two edges with space between), so
each bone has a floodable INTERIOR — every enclosed region is either a bone or a membrane cell. Added to
celestialBoneEditor.html: **fill bone** (flood → cyan) alongside **fill membrane** (flood → magenta); a region
can be tagged either class (mutually exclusive). Export adds `boneShapes` = the traced CONTOUR of each
bone-fill (struts WITH width, ready to extrude as solid bones) plus `veins`. This is more faithful than
medial-line bones because it preserves the drawn thickness. Workflow: bridge until green (sealed) → fill each
bone region + each membrane region → tag veins → export. Lesson: **before extracting "lines," check whether the
art draws structures as outlined AREAS — if so, the regions (and their contours) are the truth, and the
medial line is a lossy approximation.**

### L108 — GROW filled bone regions into their stroke (you can't flood a 1px line); detected≠tagged
Human tagged bone regions by flooding but couldn't "fill the lines around them" and thought lines weren't
identified. Two facts: (1) a flood fills the bone's INTERIOR and stops at the inner edge of the drawn stroke,
so the bone shape sits inside the line; (2) thin single-stroke struts have NO interior to flood. Fix
(`tools/traceWingMerge.mjs`): GROW each filled region into its surrounding ink — `fill ∪ (dilate(fill,4) ∩
ink)` — then contour → the bone hugs the OUTER edge of the stroke and seals, no manual line-filling needed.
Overlay (skeleton in orange vs grown bones in cyan) proved the "missing" lines are all either the membrane
outline / trailing scallop edges (membrane by the human's rule, correctly excluded) or thin single-line struts
(captured as line-bones, not fills). Lesson: **a line being DETECTED (in the skeleton) ≠ TAGGED — show both
layers so "why isn't this identified" is answerable; and outlined-shape labels need a grow-into-stroke step
because flood-fill can only reach interiors.**

### L109 — Ingest the human-tagged bone SHAPES; spear tips to sharp points; render as solid slabs
Closed the wing-bone loop: the human tagged bone REGIONS in the editor; pipeline now ingests them as the
authoritative wing bones (no auto-guess). Three fixes this round:
- **Spear tips:** the filled body stops short of the bone's sharp point (the tip is a thin spike beyond the
  fill). `traceWingMerge.mjs` now finds skeleton ENDPOINTS (degree-1) and spears each grown bone out to its
  endpoint along the ink (`lineInk` check) — bones are now longer + sharper, matching the stencil. (Human
  caught the short/rounded tips.)
- **Ingest:** `traceDefinition.mjs` prefers `refs/celestial/wing-bones-merged-R.json` → `wing.boneShapes`
  (closed contours WITH width), auto-skeleton only as fallback. Kept contours DENSE (no resample) so sharp
  tips survive. `place` transform applies to bones same as the silhouette.
- **3D:** `slab()` extrudes each bone contour into a solid raised bone (top+bottom+walls) — reads as a real
  boned wing with membrane between, vs the flat panels that were edge-on-invisible.
Lesson: **flat panels for thin elongated shapes read as nothing edge-on — extrude to a slab; and any
fill-based region capture needs a tip-spear step because fills never reach a tapering point.** The wing bones
are now human-authored ground truth end-to-end (editor → merge → def → 3D).

### L110 — DEBUG: why bone tracing "had gaps" — skeleton fragmentation + threshold fragility (not missing lines)
Human asked to root-cause why bone extraction kept producing gaps despite QA. Measured on stencil-wings:
242 raw skeleton polylines, **3023 junction pixels (deg≥3)**, only 26 real endpoints, and **23% of ink is
"fragile" (lum 170–230, near the 200 threshold)**. Conclusion: lines were NOT missed — they were SHATTERED.
- **Cause #1 — junction fragmentation:** `thin`+`skeletonToPolylines` cut every line at every crossing
  (~3000 junctions → 242 fragments). Continuity lost, not coverage. Fix: **weldChains** (collinear-end join).
- **Cause #2 — threshold fragility:** ~¼ of the ink is anti-aliased grey straddling the hard 200 cutoff →
  micro-gaps inside lines → extra breaks + spurs (and "lines not identified"). Fix: **morphological CLOSE
  (dilate→erode ~1–2px) BEFORE thinning** to bridge the micro-gaps; consider an adaptive threshold.
- **Cause #3:** over-aggressive cleanup (band removal) trimmed tips; fills never reach a TAPERING point (spear
  to skeleton endpoints).
- **Why QA didn't pre-empt it:** a coverage overlay (result-on-stencil) looks fine because the FRAGMENTS still
  lie on the lines — fragmentation only bites at render/fill time. **A coverage overlay can't see broken
  continuity; add a quantitative QA assert (fragment count, junctions, %fragile pixels) to flag it up front.**
Robust pipeline that won: region/compartment capture (keys on enclosed AREAS, not fragile medial lines) + human
editor with the sealed/green check + weld + tip-spear. **Reusable: for hand-drawn line-art, skeletons are
inherently shattered at junctions and fragile at the threshold — close-before-thin, weld-after, prefer regions,
and QA with NUMBERS not just overlays.**

### L111 — Prevention baked in + lesson index added
Acted on L110: moved morphology + `morphClose` (close-before-thin) + `weldChains` + `skeletonStats` into
`lineTrace.mjs` as shared, reusable tracing primitives; the bone extractors now CLOSE micro-gaps before
thinning and LOG a numeric fragmentation report (warn if fragments ≫ endpoints) — so the body/veins/next
dragon won't shatter the way the wing did. Also added a **📂 LESSON INDEX (by topic)** near the top of this
file so a fresh session reads only the relevant lessons (and must add its lesson number there). Reusable:
**when a debug yields a fix kit, promote it to the shared module + index it, don't leave it in one tool.**

### L112 — Surfacing v2: fresnel rim-glow for the cosmic look (no post-processing)
Surfacing pass on `tools/celestial3D.html` toward the painted reference: a `fresnelRim(mat,color,pow,str)`
helper injects an emissive term ∝ (1−n·v)^p into MeshStandardMaterial via `onBeforeCompile` (token
`#include <emissivemap_fragment>`, using `vNormal`/`vViewPosition`) — the cosmic EDGE glow that defines the
look, with zero post-processing (works in vanilla three, no build, mobile-cheap). Applied: deep-indigo body +
cyan rim, translucent violet membrane (opacity 0.74) + bright violet rim, pale iridescent bones + white rim,
violet horns. Lesson: **a fresnel rim via onBeforeCompile is the cheapest big win for an emissive/cosmic art
style — no bloom pass needed.** Index: add under CELESTIAL STORM › 3D EXTRUSION. Remaining look polish: membrane
lightning VEINS (await human tag), iridescent body gradient, star-fleck specks baked into the material.

### L113 — Bones as SPINES (centerline + radius), rendered as tapered round tubes — not extruded slabs
Human: the slab bones were "too thick, straight-edged, jagged tips" — bones should be cylindrical + pointed +
smooth. Fix: don't extrude the contour. In `traceWingMerge.mjs` compute a SPINE per bone — medial centerline
(thin→weld→longest chain) + a half-width RADIUS profile (ring-scan distance-to-background per centerline
point), arc-length resampled, radii smoothed and tapered to ~0 at the ends. Export `boneSpines:[{pts,radii}]`.
`traceDefinition` places the spine and scales radii by the same wing-fit factor. `celestial3D` builds a
`taperedTube` (CatmullRom centripetal + computeFrenetFrames, per-point radius) → smooth round bone, pointed
tips, no jagged contour. Radii come from the DRAWN width so finger spurs are thin and the arm (wider stroke,
last shape) reads bigger (×1.5 nudge + 0.85 global scale). Lesson: **for an organic bone/limb, represent it as
a centerline + radius profile and sweep a round tube — a slab from the silhouette contour is always too thick,
flat-edged, and jagged at speared tips. Medial-axis + distance-transform is the right shape descriptor.**

### L114 — Over-correction + failure to self-review: thin wiggly threads ≠ bones. SMOOTH the medial axis, keep substance
Bad miss: told the slabs were "too thick", I swung to the opposite extreme — built bones from the RAW medial
axis (wiggly) at 0.85× radius → thin glowing WORMS/threads; the wing lost its skeleton (dark membrane blob +
faint squiggles). Worse than before, and I PRESENTED it as "fixed" without comparing to the prior render or the
reference. The human (rightly) called it. Fix: (1) **heavily smooth the centerline** (Laplacian [1,2,1]/4 ×10,
keep ends) + fewer control points — the medial axis of a hand-tagged region is always wiggly; a clean bone
needs a smoothed spine. (2) **Keep substance** — gentle end taper (×0.5 not ×0.2) + global radius up (0.85→1.7);
"thin fingers" must still read as solid bones, not threads. Lessons: **(a) when correcting "too much X", don't
overshoot to "too little X" — aim for the middle and VERIFY against the reference. (b) ALWAYS critically
compare your output to the previous good state + the target BEFORE presenting; a coverage/feature change can
silently regress the overall read. (c) medial-axis spines are wiggly by nature — smooth them hard.**

### L115 — Keep the EXACT identified 2D shape; add thickness + taper ends (don't re-derive the geometry)
Human (after the wiggly-tube miss): "keep the exact bones we identified + location, define them on a 2D plane,
just add thickness and taper the ends." The centerline/spine re-derivation kept CHANGING the shape (wiggle).
Correct approach: `boneSolid()` triangulates the EXACT tagged contour (outline + location preserved verbatim)
on the membrane plane, extrudes it with thickness, and tapers the thickness to 0 toward the two ENDS along the
shape's PCA long-axis → pointed tips, full body. No medial axis. Lesson: **when the human has already
identified the exact 2D shape, the 3D step is ONLY thicken + taper along the existing outline — never
re-extract a centerline that drifts from what they approved. Preserve approved data; transform minimally.**

### L116 — "Reads a bit thick": thin via z-thickness AND trim the in-plane stroke HALO (erode, don't dilate-pad)
Human, comparing the thickened bones to the painted reference: "they read a bit thick." Confirmed honestly
against `full.png` — the reference's finger-struts are fine, bright, delicate glowing lines; mine were chunky
on both axes. Two independent fat sources, both cut: **(1) z-thickness** `BONE_THICK 0.03→0.012` (arm ×1.5) —
the extrusion was puffing crisp lines into tubes. **(2) in-plane halo** — the grown bone mask was
`fill ∪ (dilate(fill,4)∩ink)`, hugging the OUTER edge of the drawn stroke (incl. its anti-aliased halo), then
the contour was traced from `dilate(grown,1)` adding +1px more. Switched that to `erode(grown,1)` so the
contour hugs the CRISP core of the tagged line, not the fat outer edge → −2px width vs before. **Keeps the
exact path/location (L115) — only trims the edge fat, never moves the bone.** Result: fine glowing struts that
match the reference's delicate feel. Lesson: **"too thick" on an extruded 2D shape has TWO knobs — extrusion
depth and the in-plane contour's stroke-halo padding. Erode toward the crisp core to thin in-plane without
relocating; cut extrusion depth for the z-read. Always re-compare to the painted reference before presenting (L114).**

### L117 — Smooth the bone CONTOUR, not just the spine: raw pixel-traced outlines are staircased → wobbly struts
Human: "the strut lines read jaggy/irregular/wobbly, not clean smooth flowing lines." Root cause: `boneSolid()`
extrudes the bone's closed contour verbatim, and that contour came straight from `traceContour()` on a pixel
mask — a staircased 1px-step outline. Thinning (L116) made the jaggies MORE visible (less fat to hide them).
Fix in `traceWingMerge.mjs` before storing the shape: `resampleClosed(ring,80)` → `smoothRing(ring,2)×6` →
`resampleClosed(ring,64)`. Even-spacing resample first (so smoothing weights are uniform), smooth hard, then
resample to the final point count. Keeps the shape + location (L115); only removes pixel staircase. Lesson:
**ANY geometry traced from a pixel mask is staircased — smooth+resample the closed contour before extruding,
exactly as we already do for open spines (L114). Thinner shapes expose jaggies that thickness was hiding, so
smoothing becomes mandatory once you thin.**

### L118 — A uniform erode KILLS thin features: keep the in-plane mask, thin via z only
Regression caught by human: "you lost the bones closer to the leading edge." Cause: L116's `erode(grown,1)`
trim. A 1px erode barely dents a fat bone but COLLAPSES the thinnest finger-struts (the delicate leading-edge
ones) to slivers → they extruded into invisible threads in 3D, so the wing silently dropped bones even though
the data still listed 7. Fix: trace the FULL `grown` mask (no erode) → every bone keeps its tagged in-plane
width; thinness comes ONLY from z-thickness (`BONE_THICK`). Lesson: **never thin a shape-set by eroding the
mask — erosion is feature-size-dependent and annihilates the smallest members while sparing the largest. To
make extruded strokes read thinner, cut the EXTRUSION depth (uniform across all), not the in-plane footprint.
And when a count is preserved in data, still eyeball the render — degenerate-but-present shapes vanish silently.**

### L119 — Dorsal spine: stamp a diamond on each ARMOUR ROW (reuse existing cells), don't width-match a stencil
Wanted a glowing dorsal follow-line. First instinct was to trace the spine STENCIL and width-match it to the
body — but the overlay QA (`tools/spineOverlay.mjs`, scaled head→tail) proved it DOESN'T register: our traced
body is wider (shoulder/hip bulges) with a different plate rhythm than the slender stencil. Human's better idea:
"copy the diamond shape at each segment and line it up on our blue armour segments." So the spine is built FROM
our own data — group the central-axis plates (|cx−mirror|<0.05) into cy ROWS, and stamp one raised cyan faceted
rhombus per row, sized to that row's cell width (`rx≈0.4·w`, clamped). It lines up perfectly because it IS the
armour row, and the head→tail width taper falls out of the cell sizes for free. Crown raised 0.02+ (above the
0.011 plate domes) so it stands proud as a ridge; bright-cyan emissive `matSpine` + fresnel. New `spineGrp`
toggle, leaves the armour scales intact. Lesson: **when an external stencil won't register on your traced
geometry, don't force-fit it — DERIVE the feature from the geometry you already have. The repeated-motif-per-
existing-cell pattern (diamond per armour row) guarantees alignment and inherits the body's proportions.**

### L120 — Backface winding culled the spine to ONE diamond — and I mis-verified by reading the plate lattice
The dorsal spine built 19 diamonds (console confirmed) but only ONE showed near the neck. Cause: the diamond
fan triangles wound CLOCKWISE as seen from the rear camera (+z), so their normals pointed INTO the body and
`FrontSide` culled them; only where the neck curves did one face the camera. Fix: reverse the fan index order
(`base, (k+1)%4, k`) so faces are CCW-from-+z, plus `side: DoubleSide` as insurance. SECOND failure, worse:
I had earlier declared the spine "reads cleanly" off a rear-zoom screenshot — but what I saw was the existing
cyan PLATE-SEAM lattice, not my diamonds (which were culled). I pattern-matched "cyan down the centerline =
success" instead of ISOLATING the new feature. Fix: `tools/spineDebug.mjs` toggles plates/seams/struts OFF and
screenshots the spine ALONE. Lessons: **(a) any fan/strip built from an ordered rim has a winding that depends
on the VIEW axis — verify it faces the camera, or use DoubleSide for thin decorative gems. (b) To verify a NEW
overlay feature, ISOLATE it (hide everything else) — never eyeball it against a busy scene where pre-existing
elements of the same colour will fool you into a false positive. This is L114 again: compare the right thing.**

### L121 — Trace the stencil's diamond, don't draw your own: extract cells → pick clean leaf → symmetrize → stamp
Human: "yours are ugly, trace the shape of the individual diamonds on the stencil … don't draw ur own." My plain
4-point rhombi looked cheap. Built `tools/spineDiamonds.mjs`: flood the stencil exterior, label the enclosed
CELLS, trace+smooth each (resample→smoothRing→resample), keep only the CENTRAL column (|cx−axis|<0.02, drop
side segments per the human's "spiral column only") and drop the tiny scale-overlap slivers. Key realisations
from MAGNIFYING the stencil (always zoom the source before trusting an auto-trace): the dorsal pattern is an
interleaved BRAID of pointed curved scales, so most enclosed cells are rounded scale-tops, NOT diamonds — only
the mid-body interstitial cells are clean pointed leaves. So: filter candidates to the pointed-leaf band
(aspect 1.6–2.0, cy 0.33–0.50), take the cleanest, and CANONICALISE it — polar radius sampling + left/right
symmetric averaging (`(r(θ)+r(π−θ))/2`) + normalise to unit half-extents. That's CLEANING a traced edge, not
inventing a shape. Emit `js/celestialSpine.js`; the 3D spine stamps that one diamond per armour row, scaled to
the row's cell. Lessons: **(a) "trace it, don't draw it" → extract+clean the real contour; a symmetrised median
of the traced shape is faithful AND pretty. (b) auto-cell-extraction on overlapping-scale art yields mostly
junk cells — magnify the source, identify which cells are the real motif, filter HARD before trusting them.**

### L122 — Clean source beats clever extraction: a non-overlapping diamond column traced in 14 clean cells
Human supplied a SECOND spine stencil — a clean, non-overlapping single column of 14 crisp diamonds (vs the
first stencil's overlapping braid that yielded mostly junk cells). Ran the same `spineDiamonds.mjs` on it:
14 cells found = 14 diamonds traced, 0 slivers, 0 side segments — the extraction that fought the braided art
was trivial here. Emitted the full ordered `SPINE_DIAMONDS` column (each symmetrized + unit-normalized) plus a
canonical; the 3D spine now maps each armour ROW proportionally onto that head→tail column so the artist's
shape progression is preserved while still lining up on our segments. Lesson: **when an auto-trace is fighting
the source (overlaps, anti-alias, ambiguous cells), the highest-leverage fix is often to ask for a cleaner
SOURCE, not a cleverer algorithm. A clean input collapsed a multi-step heuristic (flood→label→filter slivers→
pick leaf→symmetrize) into a clean 1:1 trace. Keep the tool; feed it better data.**

### L123 — Iridescent cosmic body: object-space Y gradient + procedural star-flecks injected into the standard mat
Veins + the diamond-shape iteration were dropped by the human ("forget this step … proceed with the next").
Surfacing step: `cosmicBody()` injects, via onBeforeCompile, (1) a blue→violet→magenta vertical gradient driven
by object-space `vMPos.y` mapped over the loft's head/tail Y (yHi 3.8 → yLo −4.8), replacing diffuseColor;
(2) procedural star-flecks (per-cell hash → jittered point → smoothstep spark) added to emissive; (3) the
existing fresnel rim. Applied to body + plates (plates share the gradient, fainter stars). GOTCHA noted honestly
for next time: on a THIN near-vertical body the fresnel rim dominates at the grazing angles that cover most of
the silhouette, so the gradient washes toward the rim colour in tight views — readable in the wider rear shot.
If more saturation is wanted, drop rimStr or gate the rim by |n·up|. Lesson: **inject look (gradient/stars) in
object space off a known axis range; but a strong fresnel rim competes with a base gradient on slender forms —
balance rim vs diffuse, don't just stack them.**

### L124 — POINTY not round: reconstruct the diamond from its 4 corners + measured edge-bow; flip wing billow
Two human notes: wings "billowed the wrong way" and diamonds must be "pointy, not round." (1) Wing billow: the
membrane z had `−0.06·sin(...)` cupping AWAY from the camera; flipped the sign so it cups toward +z (dorsal/
camera). (2) Pointy diamonds: corner-PINNED smoothing STILL rounded the tips because the pixel-traced cell
(dilate+trace) is itself soft. Fix that actually works: find the 4 extreme corners, then REBUILD each edge as a
straight chord between sharp corners plus the edge's MEASURED max outward bow (`bow·sin(πt)`). Sharp tips
guaranteed (corner vertex emitted verbatim), edge convexity still traced from the source. Lesson: **to keep a
sharp feature through a trace→smooth pipeline, don't try to smooth-but-preserve — RECONSTRUCT from the feature
points (corners) and re-add only the measured deviation. Smoothing near a pinned vertex always rounds it; a
chord+bow rebuild doesn't. And sign-test billow/cup directions against the camera axis — easy to get backwards.**

### L125 — Tail spear: the silhouette was right, the LOFT was wrong — render the spearhead FLAT, not voluminous
Tail read as a blobby rounded bell + spike. Root cause: the traced silhouette tail IS a proper spearhead (shaft
→ flare with two barbs at ny≈0.82 → sharp point at 0.97), but `loftBody` gave it the body's egg cross-section,
so the flat blade became a fat bell. Fix: `clipPoly()` splits the silhouette at a horizontal line — the
voluminous loft stops above the flare (y≤0.73), and the spearhead (y≥0.70, small overlap seals the seam) is
rebuilt as a FLAT crystal blade via `boneSolid` (PCA taper → the bottom tip comes to a sharp point for free).
Tail-flare armour plates (cy>clip) dropped since the blade replaces them; added a glowing cyan core tube down
the blade centre. Lesson: **when a lofted region looks wrong, check whether the 2D source is actually fine and
it's the EXTRUSION choice that's off. Blades/fins/membranes want FLAT extrusion (boneSolid/panel), not the
volumetric body loft — match the extrusion method to the part's real cross-section, and clip the loft to hand
each region to the right builder.**

### L126 — "Struts are different colours now" = translucent membrane passing in front after the billow flip
All wing bones use ONE material (matSpar), so the colour variance wasn't material — it was the billow flip (L124)
moving the membrane to cup toward the camera (+z). In angled views the forward-billowed translucent VIOLET
membrane then passed in front of some struts and tinted them lavender, while struts it didn't cover stayed white
→ "different colours." Fix: seat the bones in front of the membrane's billow amplitude (`zBone = zWing + 0.08`,
billow peak is 0.06) so the sheet never overlaps a strut from the front. Lesson: **a transparent overlay tints
whatever opaque geometry sits BEHIND it; if a part must keep its own colour, push it clearly in front of every
transparent surface that could screen-overlap it — and remember a depth/cup-direction change silently alters
which things are in front of which. When colours look wrong but the material is shared, suspect transparency.**

### L127 — Horns: short/thick/rear-swept crystalline crown, seated on the head (not floating lavender antennae)
Horns read as two long thin lavender antennae floating in a wide upward V above a gap. Reference: a short,
thick-based, REAR-SWEPT crystalline crown (dark violet, cyan edge-glow) seated on the head. Fixes in
`curvedHorn`: len 1.25→0.9, base radius 0.14→0.22 (thicker) with sharper taper (pow 1.7), up-vector x 0.18→0.10
(tighter V), curl z −0.85→−1.15 + y −0.12 (sweep strongly back, slight backward hook). Seated the base into the
crown (`y+0.025`, `surfZ+0.05`) so it emerges from the head instead of floating. Recoloured `matHorn` from pale
lavender to dark crystalline violet (`0x2c2278`) with a strong cyan rim. Spear also saturated to vivid violet
(rim cyan→violet, lower strength, so it stops whitening). Lesson: **horns/spikes read as "antennae" when too
long+thin+upright+pale; the fix is shorter + thicker base + rear-sweep + seat-into-surface + a darker body with
edge-glow. A thin appendage's silhouette and its anchoring sell it more than its length.**

### L128 — Wing flap: reuse the shared solveWing biomechanics; mirror ALL Euler axes by side
Replaced the metronome `rotation.y = side*sin(t*1.6)*0.5` with the repo's existing pure-math flapping solver
`js/wingFlapSolver.js` (`solveWing(phase,cfg)`) — the SAME one the game animator + shop poser use, so the
preview matches real motion (build systems, not one-offs). Phase-1 single-pivot driver maps the yoke channel:
plunge→`rotation.y` (dominant dorsoventral, tips through depth), rowing sweep→`rotation.x`, feather→`rotation.z`,
+ env-based body bob/pitch. The solver gives asymmetric power/recovery (time-warped cosine, `downFrac`),
fore-aft rowing → figure-eight tip path, and feather for free. GOTCHA that cost a render: I first mirrored only
plunge+sweep by `side` and left twist shared — the apex came out lopsided (one wing flung higher). **For a clean
sagittal mirror, the left wing must be the FULL negation of the right: every Euler component ×`side`.** Mixing a
mirrored axis with a shared one yields an in-plane asymmetric rotation. Also: a frozen-pose flag (`posed`) so
`__flapPose`/`__flapPhase` screenshots aren't overwritten by the running animation loop; `ampScale` eases on
toggle. Lesson: **before authoring an oscillator, grep for an existing solver — this repo had a tuned one. And
bilateral appendage symmetry = negate ALL Euler axes per side, not just the obvious one.**

### L129 — CORRECTION to L128: sagittal mirror negates Y+Z only, NOT all three axes (sweep stays shared)
L128 claimed "negate ALL Euler axes by side" — WRONG, and the human caught the still-asymmetric wings on the
rear preview (I had to actually re-render + look to confirm, not assume). The real math: a sagittal mirror is
the rotation conjugated by reflection `M = diag(-1,1,1)`; for XYZ-Euler, `M·Rx(a)Ry(b)Rz(c)·M = Rx(a)Ry(-b)Rz(-c)`
→ **rotation.X is UNCHANGED, only Y and Z negate.** In our mapping (x=sweep, y=plunge, z=twist) that means the
fore-aft **sweep is SHARED by both wings** (both reach forward together — also physically correct), while plunge
+ twist flip by `side`. Both wrong versions (twist-shared, then all-flipped) looked plausible at the apex but
broke at mid-stroke. VERIFICATION GOTCHA: the numeric L/R-extent check was useless because at high amplitude the
wings **clip the capture frame** (top-edge), corrupting extents — had to zoom OUT (`__zoom(1.45)`) and judge the
mid-phase frames visually. Lesson: **mirroring a multi-axis Euler rotation is NOT "negate everything" — only the
two axes in the mirror plane negate; the axis perpendicular to it stays. And verify symmetry at MID-stroke with
the whole wing in frame, not just the extremes (extremes can look fine while intermediate phases skew).**

### L130 — Tail spear was a SLAB; loft it with a thin lens cross-section so it tapers to a 3D point
The spear used `boneSolid` = constant-thickness extrusion → flat front, flat back, vertical edge WALLS = a slab
(no z-axis shape, edges not sharp, tip only tapered in 2D). A real trident/spear blade has a LENS cross-section
(raised central ridge → sharp edges) and tapers to a true 3D point (width AND depth → 0). Fix: reuse `loftBody`
on the clipped spearhead with a THIN profile (`dDorsal=dVentral=0.20` vs the body's 0.95). The elliptical ring
gives the lens for free — depth = d·halfWidth, so z=0 at the left/right edges (sharp) and peaks at the centre
ridge; and because depth ∝ width, every prong + the tip taper to a 3D point as width→0. loftBody's existing
multi-span branching handles the trident barbs (each its own tapering prong). Parameterized `loftBody` to take
a `material`. Lesson: **a "slab" is a constant-thickness extrusion; to make a blade/fin/spear read 3D, give it a
cross-section whose depth varies across the width (lens) AND scales with the width so tips converge to points —
an elliptical loft does both. Match the cross-section to the part, like the wing membrane (flat) vs the spear (lens).**

### L131 — Extracted the dragon build into js/celestialModel.js (one build, shared previewer↔game)
The whole procedural dragon (coord helpers `pt`/`mir`, all materials + `fresnelRim`/`cosmicBody` factories, every
geometry helper `loftBody`/`boneSolid`/`slab`/`taperedTube`/`tube`/`panel`/`crossings`/`bodySurfaceZ`/`clipPoly`,
the assembly, and the FLAP driver) lived INLINE in `tools/celestial3D.html`. Moved it verbatim into a new ES
module `js/celestialModel.js` exporting `buildCelestialStorm()` → `{ group(=old `root`, NOT recentered),
wingPivots, groups, materials, FLAP, flapDrive, updateFlap(t,amp) }`. Module-private `pt/mir/materials/helpers`
stay at module scope; `D.canvas`/`D.mirror` still come from the imported `CELESTIAL_DEF`. The HTML now does
`const M = buildCelestialStorm(); const root = M.group; scene.add(root);` and destructures the locals its KEPT
runtime needs (`plateGrp/seamGrp/spineGrp/strutGrp/wingGrp`, `matBody/matMembrane`, `FLAP/flapDrive`,
`wingPivots`); `TAU` is re-declared in the HTML (the hooks use it). Previewer-only code (renderer/scene/lights/
**starfield**/camera-fit/interaction/headless hooks/frame loop) stays in the HTML by design.
VERIFICATION GOTCHA: the headless render is NOT byte-deterministic across the refactor — `before` vs `after`
diffed 0.45%. But that's a RED HERRING: the starfield uses unseeded `Math.random()`, so two runs of the
*unmodified* HTML also differ 0.37% (scattered, whole-frame, maxd low). Proof it's the stars not the geometry:
rendering the SAME png twice = 0.0000% (the renderer itself is deterministic; only page-load RNG varies). So to
verify a "pixel-identical" refactor when a procedural background uses RNG, compare the **noise floor** (two runs
of the baseline) against the change-diff — equal magnitude ⇒ no real change — and eyeball the subject region.
Lesson: **when you can't get a clean pixel diff, establish the noise floor first (re-render the unchanged baseline
twice) — an unseeded `Math.random()` decoration will mask a true-identical geometry change; equal diff magnitude
to the floor is the pass, not zero. And: coexist-then-share — the game can now import the SAME build the
previewer proves, instead of a fork.**

### L132 — Build the QA verifier FIRST, and VALIDATE the verifier (Step 0 before sculpting)
Before re-sculpting the Celestial body (which the human demanded be custom + reference-matched + data-verified
at every step), built `tools/celestialRefCompare.mjs`: renders our rear chase-cam view (full + bare-torso via a
new `__bodyOnly` hook + side) and emits a side-by-side OVERLAY vs `full.png` + numeric PASS/FAIL gates. Crucial
lesson from VALIDATING the tool on the current model (the whole point of Step 0): two metrics were bogus and
would have lied — (a) a dorsal "ridge = center brighter" check is INVERTED by fresnel rim-light (edges bright,
center dark → −89); (b) per-landmark proportion ratios via pixel-row→silhouette-ny alignment blew up (waist
970%) because render caps/antialiasing/framing misalign the rows. Kept only the ROBUST, alignment-free gates —
single-render hi-frequency SPIKE metrics for protrusion (catches plate shelves) + banding (catches loft rings)
+ a coarse shape-RMS — and made proportions/muscled-read a VISUAL judgement on the overlay (shown to the human),
not a fragile number. Refactored horns/spear into their own groups so the torso measures clean. Lesson:
**a verification tool is itself code that can lie — validate it against a known case before trusting it to gate;
prefer alignment-free aggregate metrics over fragile per-pixel correspondences; and don't pretend a number
proves an aesthetic match — gate the objective stuff (no shelves, no banding), eyeball the subjective stuff.**

### L133 — A centerline push that eases out FASTER than the surface depth rises carves a concavity; and a rear-cam anatomy checklist
The human caught a **concavity in the upper back** (withers) on the 3/4 view. Cause: `BODY_SCULPT.cz` lifted the
neck toward the camera (+z ≈ +0.13) and eased to 0 by the chest — but it dropped FASTER than dorsal depth `Dr`
rose, so the dorsal world-z went neck-forward (0.21) → shoulder-recede (0.166) → chest (0.175): a real dip at the
withers. A centerline offset moves the WHOLE ring, so easing it out across a region where the surface profile is
still climbing subtracts from the surface = a concavity, even though each spline alone is monotonic. Fix: `cz=>0`
(the lift was scaffolding for a head not yet built; the neck bend returns WITH the head, designed as one curve so
the arch and bend don't fight). Then, asked to "check we're on the right track," researched flying-dragon anatomy
and built a **rear-cam anatomy checklist** (now `tools/CELESTIAL_ANATOMY_REVIEW.md`): three masses (chest barrel >
pelvis, waist crease between → a "bean," front bigger than back), broad wing-bearing shoulders, central spine
ridge + paired dorsal muscle, long tapering tail, convex back. Our `BODY_SCULPT` passes all six judgeable rules
(chest belly-depth ~1.7× hip by construction); the one open note is the now-straight axis (`cz=0`) — deferred to
the head pass. Verifier note: a `0.12→0.18` protrusion-band narrow excludes the neck-cap tab the head will cover.
Lesson: **when a profile spline and a centerline-offset spline overlap, check their SUM, not each curve — an
offset that fades out while the surface is still rising digs a hole; and for a creature judged from one camera,
write the per-camera anatomy checklist (masses/shoulders/ridge/taper/convexity) as the review gate, eyeball it on
an all-angles montage, and defer axis-curve changes to the same pass that builds the part they belong to.**

### L134 — "Convex from the rear cam" ≠ "convex across the spine": paired-hump sections hide a centerline groove only the axial view exposes
Right after L133 shipped (`cz=0` + the rear-cam anatomy checklist, all six rules PASS), the human orbited to the
two **axial** views the review never captured — camera yaw 0, pitch at the clamp (±1.28): looking straight DOWN
the spine, and UP the belly. Down the spine showed a **dark recessed channel running the length of the back** —
a *different* concavity from L133's, and one structurally invisible to the rear cam. I had claimed "back convex,
fixed." Wrong. Root cause, measured (not eyeballed): the dorsal section
`dorsalZ(u)=Dr·cos(u·π/2)^1.4 + Mu·exp(−((|u|−0.5)/0.22)²)` places paired muscle humps at u=±0.5, and at the
withers the humps **out-rise** the central cos() ridge — `dorsalZ(0.5)−dorsalZ(0) ≈ +0.040` at ny≈0.26 — so the
spine sat in a valley *between* the humps. The rear cam sees the silhouette + the lit humps and reads "muscled
back"; it cannot see that the centerline between them is a trough. (The diamond spine ridge that would crown it
is parked, `spineGrp.visible=false`, so nothing filled it.) Fix: add a narrow central crest to `dorsalZ`,
`+ Cr·exp(−(u/0.18)²)`, with `Cr(ny)=0.065·gauss(ny,0.25,0.10)+0.022·gauss(ny,0.60,0.11)` — lift the centerline
ONLY at the two muscle bands (withers + hips), ~0 across the already-convex mid-back so it doesn't bloat. The
cheap algebraic gate that would have caught it from day one: **sweep `dorsalZ(0) ≥ dorsalZ(u)` for u∈[0,1] at
every station** (now apex@u=0 for ny 0.15→0.73). The belly hollow in the up-belly view is the intentional abdomen
tuck (`Be` gap) — left alone. Gates: protrusion 6.7% / banding 5.8% PASS, def 5/5. Lesson: **a single judging
camera defines a blind axis — for a back-facing chase cam that axis is "looking down the spine." Convexity has a
direction; "convex in silhouette" says nothing about "convex across." When a cross-section is a SUM of a central
ridge and off-center humps, the humps can beat the ridge and trough the middle — verify the apex stays on the
centerline with a per-station `f(0) ≥ max f(u)` sweep, and always render the down-the-spine + up-the-belly axial
views, not just the hero angle. And when the human says "I thought you weren't blind" — reproduce their EXACT
camera before answering; don't generalize from the angles you happened to capture.**

### L135 — Neck + head pass: clip the body, arch a world-space neck, loft a sleek wedge head (the deferred cz neck-bend, now anchored)
The body had ended in a flat "neck-cap tab" (the head region of the traced silhouette was just lofted as more
tube rings) with horns stuck on the crown. L133 deferred the real neck bend "to the head pass, designed as one
curve." This is that pass. Approach that worked: (1) **clip the body at BOTH ends** — `clipPoly(clipPoly(sil,
TAIL_BODY_CLIP,false), NECK_BASE=0.235, true)` keeps 0.235≤ny≤0.73, removing the head region so a real neck/head
replaces it (no seam-fighting with the old tube). (2) **Build the neck in WORLD space, not pt() canvas space** —
the neck leaves the canvas plane (arches toward the dorsal +z), so a `CatmullRomCurve3` through 3 world points
(seat-inside-body → bow up+forward → head base) lofted by a small variable-radius `worldTube` is the right tool;
the in-plane `taperedTube`/`tube` helpers can't arch out of plane. Match the neck base radius to the *clipped
shoulder width* (~0.40) or you get a step at the junction. (3) **Build the head in a LOCAL frame** (snout=+Z,
dorsal=+Y, right=+X): loft elliptical rings with an egg cross-section (taller top `ht`, flatter belly `hb`),
cheeks widest just ahead of the cranium (`+gauss(s,0.26,0.14)`), a drooping muzzle centerline (`cy=-0.22s²`), then
**orient** by a right-handed basis from the neck's end tangent — `z=headDir; x=(0,0,1)×z; y=z×x; makeBasis(x,y,z)`
— with the `(0,0,1)` up-hint so local +Y lands on world dorsal (+z), then seat at N2. Seat eyes/brows/horns/spikes
off saved local ring centers (`ringAt(s)`). Gotchas: (a) the cosmic gradient is by world-Y (`yHi=3.8`), so the
head at y>3.8 clamps to the bright head colour — good, free continuity. (b) first horn pass was stubby + too
vertical; horns are the dominant rear-cam silhouette, so make them LONG, sweep up+OUT then strongly back
(`curl≈(±0.42,−0.30,−1.55)`). (c) head looked like a vertical cone until I (i) blunted the snout tip
(`hw` tip 0.05→0.09), (ii) tilted the head forward by pushing N2 +z so `headDir` leans ~30° off vertical. Gates
after: protrusion 6.9% / banding 3.2% PASS, def 5/5 (clip didn't regress the torso). Lesson: **when a part bends
OUT of the traced 2D plane (a neck, a reaching limb), stop working in canvas coords — build a world-space spine
curve and orient sub-parts with an explicit basis from its tangent; clip the old stand-in geometry away rather
than layering over it; and tune the feature that owns the silhouette FIRST (for a rear-cam dragon that's the horn
crown, not the snout). Verify on the camera that ships (rear-high), not just the hero ¾.**

### L136 — Head FLEX to horizontal + a side-profile reference-overlay tool; and a flaky silhouette gate was render-AA noise, not the dragon
The human, judging the head/neck against side-view art, said the head "needs to flex DOWN so the side profile is
on a horizontal plane" and — crucially — asked whether I needed to build a tool to MAP the reference and check
the contour, rather than eyeballing. Yes. Two durable wins came out of it:

**(1) The flex.** The head had been oriented along the neck's end tangent, which bows toward the dorsal (+z) —
so in flight (where +z reads as UP) the head kicked ~30° skyward. Fix: DECOUPLE head orientation from the neck
tangent. The neck still arches up; the head flexes back to level at the atlas — `headDir=(0,1,−0.06)` (forward +
a touch ventral), independent of N2−N1. A slight kink at the head/neck joint is correct anatomy (atlanto-occipital
flex), not a defect. Lesson: **a head is not just "the end of the neck" — its orientation is its own DOF; drive it
explicitly, don't inherit the spine tangent.**

**(2) The tool** (`tools/celestialSideCompare.mjs`): renders our side profile (wings hidden, transparent bg via a
new `__transparent` previewer hook), tints it a flat cyan silhouette, and composites it over the painted side
reference (colour-masked off its opaque checker bg), centroid-anchored + nose→tail length-scaled, both oriented
HEAD-UP. Gotchas learned: alpha-bbox fails on a ref with a baked opaque bg (mask by colour: dark/saturated =
dragon); landmark auto-detect (nose=topmost row, shoulder=first wide row) is FRAGILE — it breaks when the head
pose changes (a horizontal head's topmost pixel is the crown, not the snout) and the ref's "widest row" is its
WINGSPAN, not its shoulder; **centroid anchor + total-length scale is the robust choice** when per-feature
landmarks won't hold still. Compare in the orientation you fully understand (our neutral vertical) and rotate the
REFERENCE to match, not vice-versa.

**(3) The flaky gate.** After the flex, `celestialRefCompare`'s protrusion gate swung 4–13% run-to-run (FAIL/PASS
at random) with zero code change. Root cause chain, each step ruled out by measurement: not the build (no
`Math.random`); WITHIN a session renders are bit-identical (so deterministic given identical state); the variance
is BETWEEN processes. It was the `bodyMask` rgba-sum threshold (`>60`) cutting through the faint ANTIALIASED edge
fringe, where cross-process AA dithering flips ±1px per row — and the now-shorter (clipped) body amplifies each
noisy row, and the far-from-centre head swings hard under any residual flap pitch. Three fixes, in order of
impact: (a) a `__rest` previewer hook that force-settles the exact rest pose (the QA shots were firing mid-flap,
since flap eases over ~1.4s but shots waited 150ms); (b) cut the mask at a STEEPER point of the edge gradient
(`>100`) so the silhouette edge is stable across processes; (c) the protrusion gate measures the full creature
(head/neck shown) which CAPS the body's clip seam — hiding the head exposed the seam and read worse. Lesson:
**a silhouette metric that reads a thresholded AA edge is only as stable as that threshold's position on the edge
gradient — cut steep, settle the pose, and when a gate goes flaky, diff the inputs across runs before touching the
subject. The dragon was never the problem.** PASS stable now: protrusion 1.7–5.8% / banding 1.2–2.4% / def 5/5.

### L137 — Slim the torso depth + SOCKET the neck (elliptical base into the flat clip-top); a round tube can't seat in a wide-shallow opening
Human side-by-side vs the side reference flagged: (1) torso too thick dorso-centrally — measured depth/length 0.40
at the chest, ref ≈0.26; (2) the neck was a 45° SPUR off the dorsal — its base sat at 94% up the flat-top opening
(the dorsal rim), not the centre; (3) the flat clip-top is the intended SOCKET the neck should insert into. Fixes:
- **Depth:** cut the dorsal sculpt ~35% (`Dr` main 0.110→0.070, `Cr` halved, `Mu` 0.095→0.070 so the trimmed humps
  still flank-not-trough the ridge — re-ran the L133 convexity check, centerline stays apex). depth/length → ~0.26.
  The complaint was DORSAL depth, so left `Be`/width/`wBoost` alone (broad shoulders still read on the rear cam).
- **Socket:** added a `neckTaper(ny)` that shrinks the cross-section's DEPTH (not width) to ~40% toward the top
  clip, so the opening becomes neck-sized (the body converges INTO the neck) instead of a wide flat shelf with a
  thin tube on it. Re-seated the neck at the opening's CENTRE (recompute it after every depth change — slimming
  moved it from z=0.33 to 0.07) and rise ≈ perpendicular before the forward S-curve.
- **The key geometry lesson:** a ROUND tube cannot seat flush into a wide-shallow socket — it bulges fore-aft and
  the flat cap shows as a dark seam (clearly visible on the ¾, invisible on dead-side/rear, which is why it slipped
  through last pass). Made `worldTube` build ELLIPTICAL rings ([halfWidth, halfDepth] per ring) with ANALYTIC
  sagittal framing (lateral axis always ±x, depth axis = ⟂tangent in the y–z plane) — no Frenet twist because the
  neck centerline is planar (all control pts x=0). Base = wide+shallow to fill the socket, rounding to a slender
  nape. Join now continuous from every angle. Lesson: **match the cross-section SHAPE to the opening, not just its
  size; and a junction that looks clean head-on/side can still be broken on the ¾ — always check the ¾.** Plus the
  recurring one: **any socket/seat geometry derived from the body must be RECOMPUTED after a sculpt change** — the
  z=0.33→0.07 socket-centre shift is exactly the kind of stale constant that reintroduces the bug. Gates stable
  PASS (protrusion 2.2–3.7 / banding 1.7–4.3), def 5/5.

### L138 — Continuous dorsal topline: fill the WHOLE socket + drop the depth-taper; "position was fine, the SLOPE was wrong"
Human refined the neck note: the original (forward) neck POSITION was right — the fault was the connection SLOPE.
The neck's dorsal (top) line must run CONTINUOUS with the torso's dorsal slope (the reference is one back→neck→head
curve), not plug in as a separate angled tube. What was wrong in the socket pass (L137): the depth-`neckTaper`
shrank the torso's dorsal depth toward the clip (0.75→0.30), curling the back inward right where the neck leaves —
a slope kink — and the shallow neck base (half-depth 0.27) didn't reach the torso's dorsal edge (0.75), so the back
stuck out past it = a dorsal shelf. Fix: (1) DROP the depth-taper (`neckTaper`→1) so the back stays full to the
clip and the dorsal edge holds ~0.75–0.82 — a continuous line to hand off to the neck; (2) make the neck BASE a
DEEP ellipse that fills the *whole* socket (half-depth 0.58 so dorsal edge meets 0.75 and ventral meets −0.42 —
flush, no shelf); (3) a 4-pt centerline that rises briefly continuous with the back then sweeps FORWARD to carry
the head ahead of the shoulders (the preferred position), narrowing to a slender nape. Lesson: **for a limb/neck
that grows out of a body, continuity is a property of the EDGE LINES (dorsal/ventral), not the centerline — match
the base cross-section to the FULL opening so both edges meet the body's edges, and never taper the body in the
direction you need continuous (tapering the dorsal to "shrink the socket" curls the very line you're trying to keep
smooth). Measure the body's dorsal/ventral edge z at the join and make the base ellipse hit both.** Gates PASS
(protrusion 3.7–5.5 / banding 0.6–1.3), def 5/5.

### L139 — Wing root belongs on the dorsolateral upper back, not the body's mid-depth
Human: "where do the wings connect dorsoventrally?" Research + reference: a flyer's wing anchors at the shoulder
girdle (scapula), high on the dorsolateral ribcage — upper third of the body depth, near the spine. The side ref
shows wings springing from the top of the back at the withers. Measured our model: the wing root's LONGITUDINAL
position (ny 0.273, the shoulder just behind the neck) was already right, but its DORSOVENTRAL attach was z=0 —
exactly the body's mid-depth (45% up; body dorsal there +0.81, ventral −0.67). So the wings grew out of the
body's equator/side, not the back. Fix: one constant — `WING_DORSAL=0.10` added into `zWing` (≈+0.56 world,
~83% up the depth). Because the membrane + struts are seeded relative to the pivot (`off()` subtracts the pivot
pos), lifting the root's base z translates the whole wing onto the back with its shape intact — a one-line lever.
Lesson: **wing attach has two independent axes — longitudinal (which body station) and dorsoventral (how high on
the cross-section); they're tuned separately, and the default "build it in the canvas plane → z=0" puts the root
at mid-depth, which reads as wings-from-the-ribs. Push it dorsal.** Gates/def unaffected (wings excluded from
torso gates): protrusion 5.0 / banding 3.6, def 5/5.

### L140 — Wing prominence is bright-AREA + HUE, not peak brightness; built a Q/A'd wingMetrics tool to prove it
Human: wing bones still too thick/prominent + wrong colour ("should be darker than the membrane"), and demanded a
DATA-grounded, self-Q/A'd tool — not eyeballing. Built `tools/wingMetrics.mjs`: measures, for the reference
(`refs/celestial/wings.png`) and our wings-only render (new `__wingsOnly` previewer hook), the membrane vs
bright-feature colour (hue/lum), the **bright-AREA fraction** (% of wing above a membrane-relative luminance
threshold), the bright/membrane lum RATIO, and bright-line WIDTH. Crucially it has a `--selftest` that plants a
SYNTHETIC wing (known membrane colour + N lines of known width/colour/area) and asserts the metrics recover them
within tolerance — so a measurement bug can't silently mislead the tuning (the user's explicit worry). Self-test
PASSes (hue ±8°, area ±2pts, width ±1px). Findings (validated): membrane already matched (hue 250 vs 254); the
bones were the fault — bright **HUE 200° cyan vs ref 239° blue**, bright-**AREA 24% vs ref 15%**, width ~2× — but
the bright/membrane lum RATIO matched (5.8 vs 5.9). So it was never "too bright per pixel," it was "too much of the
wing is bright, in the wrong hue." Cause: all 7 `boneSolid` bones used `matSpar` = near-white pale glow. Fix:
recoloured `matSpar`/`matStrut` to dark blue-violet (hue ~242, low emissive, faint rim) → bones read as structure.
KEY follow-on the tool exposed: that dropped bright-area to 1.6% — because the reference's 15% bright is LIGHTNING
ENERGY, a SEPARATE element from the (dark) bones; the old model faked lightning with bright bones. So "match the
ref" = dark bones **+** add lightning veins (deferred to a creative call with the human). Lesson: **don't reason
about "brightness" as one scalar — decompose it into per-pixel intensity (ratio), coverage (area), and hue; the
reference can match on one and miss on another. And a reference's glow may be a distinct element from its
structure — replicating it means TWO materials, not one bright one. Always Q/A a measurement tool on a synthetic
known-answer input before trusting it to steer art.**

### L141 — In-game preview of an un-migrated model: hide the real dragon + overlay, don't stub 12 parts
To let the human SEE the clean-sheet Celestial Storm in the actual game (lighting/scale/chase-cam/motion) before
migrating it, the safe pattern is NOT to swap `buildCelestialStorm()` into `buildDragonModel`'s part contract
(updateDragon writes to ~12 parts — head/tailSegs/wingPivots/tipMarkers/spineMats/auraSprite/rider — many
UNGUARDED → crashes). Instead: build the REAL equipped dragon normally (every part valid, nothing crashes), then
under a URL flag (`?celestial`) HIDE its visuals (`group.children.visible=false`) and OVERLAY the Celestial group
parented to the player `group` (inherits position/pitch/bank), auto-fit by bbox to the real dragon's size (×1.8 for
hero scale), oriented `rotation.x=-π/2` (model +y head→−z forward, +z dorsal→+y up), flapped by its own
`updateFlap(time,1)`. Flag OFF = shipped roster byte-for-byte unchanged. Gotchas: the hidden dragon still ANIMATES,
so its trail/mote sprite pools keep emitting — hide them each frame at the end of updateDragon; and some VFX
(an ember/aura ring) are bound to the player independent of the mesh, so a clean in-game look needs the real
migration, not a preview hack. FINDING the preview surfaced: against the bright sunset sky the now-dark (lightning-
less) wings read as flat silhouette — the cost of the "no lightning" call shows up in-context, not in the previewer.
Lesson: **to preview an un-migrated asset in a complex host, overlay-and-hide beats contract-stubbing; and viewing
in the real environment surfaces lighting/scale/VFX truths the sterile previewer hides — do it before polishing.**

### L142 — Wing struts: embed in the membrane plane (zBone=zWing), not floating in front; spear: kill the overlap into the body
Human (seeing it in-game): wing membrane shape is great, but the struts FLOAT above it, and the spear tail has an
"upper floating piece + lower one" + the tail reads weird. Direction: use the trace as a GUIDE but generate clean
geometry like the roster (struts embedded, continuous tail). Studied dragonWings/dragonTail (skinnedTube + surface-
sampled ribs) — but the Celestial flaps via simple pivot rotation (no skeleton), so the heavy skinned approach is
overkill. The actual fixes were small + targeted:
- WING STRUTS: the bones were seated at `zWing+0.08` (0.08 in FRONT of the membrane → floating plates). Seat them
  AT the membrane plane (`zBone=zWing`): `boneSolid` straddles ±thick about zBone, so the (DoubleSide, translucent)
  membrane cuts THROUGH each bone → it reads as a rib embedded in the wing, like a real finger-bone. One-line lever.
- SPEAR/TAIL: the body (round muscled tube, sculpt central-span) clipped at y≤0.73; the spear (flat thin-lens blade,
  no-sculpt so it branches the trident) lofted from y≥0.70 → the blade's flat shaft-portion (0.70–0.73) overlapped
  UP INSIDE the round body = the "upper floating piece" (a flat violet strip visible through the body from the
  side). Fix: raise the spear top to meet the body end (TAIL_SPEAR_TOP 0.70→0.725) so the flat spearhead grows OUT
  of the thin tail tip instead of overlapping the body. (Body stays round tapering tail; spearhead is the tip
  ornament — exactly the roster "tapered shaft + tip ornament" pattern, achieved by clip placement not a rewrite.)
Lesson: **before adopting a heavy system (skinned meshes) to "generate normally", check whether the glitch is just
a placement bug — floating = a z-offset; disjoint = an overlap/clip seam. A flat blade lofted to overlap a round
tube reads as a separate floating piece from the side even if it looks fine head-on; clip parts to MEET, not
overlap, when their cross-sections differ.** def 5/5, gates PASS, wingMetrics self-test PASS.

### L143 — Smooth organic body: kill the cross-section CREASE (smooth-tangent belly) + smooth the loft CENTERLINE, not just width; tail = 3D taper not a flat lens
Human: tail reads as a "weird slab not tapered to the end" (flat); body "not one continuously smooth shape — straight
edges in the middle dorso-ventrally." Three root causes + fixes:
- TAIL was a flat thin-lens loft (dDorsal/dVentral=0.20). Edge-on from the SIDE a flat blade is a thin SLAB that
  never tapers as a volume, and it dangled off the body as a separate piece. Replaced with a `taperedTube` ROUND
  spike off the body end (base ≈ body half-width → sharp point), in `matBody` so the cosmic gradient carries it to
  magenta at the low-y tip — one continuous form, tapers to a point from EVERY angle. (A flat blade only "tapers"
  in the view that sees its face.)
- BODY CREASE ("straight edge dorso-ventrally"): the cross-section joined the dorsal arc (`cos^1.4`, tangent→0 at
  the sides) to a SEMICIRCLE belly (`sqrt(1-u²)`, VERTICAL tangent at the sides) → a 90° tangent mismatch = a hard
  crease running down the lateral seam. Fix: belly `-Be·cos(u·π/2)^1.2` (exponent>1 ⇒ tangent→0 at u=±1, matching
  the dorsal) → the two arcs meet smoothly, no lateral edge.
- BODY BANDING: the loft smoothed the per-row half-WIDTH but not the CENTERLINE (cx). The traced silhouette's
  center wanders row-to-row, so the tube wobbled side-to-side → horizontal shading bands. Fix: smooth cx too (and
  widen the window ±5→±8). Banding gate 1.9%.
Lesson: **a surface is only as smooth as its WORST tangent — a C0-but-not-C1 join (two arcs meeting at different
slopes) is a visible crease even when each arc is smooth; match tangents at seams. And loft banding has two
sources, width AND centerline noise — smooth both. For a tapering appendage, build it as a round volume, never a
flat lens, or it reads as a slab from the orthogonal view.** def 5/5, gates PASS, wingMetrics self-test PASS.

### L144 — "It's a blob": the dragon had ALL surface detail (armour plates + spine ridge + seams) DISABLED — re-seat on the real hull and turn it ON
Human, bluntly: "it's a blob, do you have any artistic judgement?" They were right. I'd spent many turns smoothing
GEOMETRY (embed struts, smooth seams, taper tail) and missed the forest: the body was a BARE smooth tube because
`plateGrp/seamGrp/spineGrp` were all `visible=false` (a "Step 1 WIP, re-seat in Step 2" that never happened), so
there was zero surface detail — and then I'd smoothed away what little form remained. A dragon with no armour, no
spine ridge, no scales IS a blob. Fix: (1) re-seat the armour on the ACTUAL sculpted hull — `surfZ`/`bodySurfaceZ`
returned an old egg approximation (`0.92·hw·√`), so plates floated/sank; rewrote `surfZ` to return the real
`dorsalZ(u, Dr,Mu,Cr)` so plates sit ON the back; (2) raise the plate crowns (0.011→0.030) so they read as
overlapping armour, not flush decals; (3) enable plates + seams + the glowing dorsal spine-diamond ridge. The
spine ridge running the whole back into the spear tail is the single biggest definition win — it gives a crisp
focal line and turns the smooth tube into an armoured cosmic dragon. Gates still PASS (protrusion 4.7 / banding
4.3; the intentional ridge isn't a shelf), def 5/5. Lesson: **when something reads as a "blob," step back from
per-vertex geometry and ask what DETAIL is missing — and check what's toggled OFF. Surface detail (armour, ridge,
scales) is what separates a creature from a smoothed primitive; don't ship with it disabled, and don't over-smooth
the underlying form to nothing. Periodically judge the WHOLE silhouette, not just the bug you're chasing.**
