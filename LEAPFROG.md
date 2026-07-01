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

---

## Lesson — Asset-backed dragon (GLB) can COEXIST with the procedural roster behind one `def.meshUrl` branch

**What we did (experiment branch `claude/dragon-drift-mcp-higgsfield-jo93e2`).** Proved that an AI-generated
**GLB mesh** can fly as a real dragon WITHOUT touching the 100%-procedural roster. New dragon `aether`
(`dragons.js`, additive, appended last) carries `assetBacked:true` + `meshUrl:'./assets/models/aether.glb'`.
`buildDragonModel` (dragonModel.js) gets ONE early branch — `if (def.meshUrl) return buildGlbDragon(def, opts)`
— so every procedural dragon is byte-identical (tricount roster total unchanged, `0 over budget`). New module
`dragonGlb.js` returns the EXACT `{ group, parts, materials, auraSprite }` contract the engine already consumes.

**The key reuse — gameplay-reactive flap for FREE.** dragon.js already drives a `{shoulder,elbow,wrist}` rig via
`flapWing()` in the `if (wingRigL)` branch (the skinned-wing path). So `dragonGlb.js` builds an EMPTY
shoulder→elbow→wrist scaffold, exposes it as `parts.wingRigL/R`, and re-parents the GLB's wing nodes under it.
Result: the shipped, fully-reactive wingbeat (speed/boost/steer/climb) animates the AI mesh with **zero new
animation code**. A SKINNED GLB instead plays its baked `AnimationClip` via `THREE.AnimationMixer`
(`parts.glbAnim.mixer`, ticked once near the top of `updateDragon`) as the fallback. The whole-body transform
(position/bank/pitch) is shared and untouched either way.

**Contract gotchas that bite (must-return-real, not null).** `auraSprite` is dereferenced UNCONDITIONALLY in
`updateDragon` (`auraSprite.material.opacity`), so the GLB path MUST return a real `THREE.Sprite`. `head` and
`wingRigL/R.shoulder` must be real Object3Ds (head rotation is set every frame). Everything else
(`tailSegs:[]`, `spineSegs:[]`, `bodySegs:null`, `wingPivot2*`, `tipMarker*`) is `if`-guarded or loop-over-empty,
so null/undefined is safe — keep `spineGlow:0` so the wing-contrail block (gated `spineGlow>=0.5`) stays off.

**Vendoring with NO build step.** `lib/loaders/GLTFLoader.js` + `lib/utils/{BufferGeometryUtils,SkeletonUtils}.js`
copied from the `three@0.160.0` npm tarball (the CDN is egress-blocked; `registry.npmjs.org` is allowed). They
`import {...} from 'three'`, which the existing importmap resolves — no bundler. GLTFLoader is imported
**dynamically** and only in a real browser (`/^https?:$/.test(location.protocol)`), so Node tools never touch the
DOM. Request an **uncompressed** GLB so no DRACO/meshopt wasm is needed.

**Tooling kept green (all headless, no WebGL).** `tricount.mjs` SKIPS `def.meshUrl` dragons (a GLB can't be built
headlessly and has no per-form budget) — their cost is reported by the new `tests/glb.mjs`, which validates the
glTF2 binary header + JSON chunk and sums accessor triangles with NO renderer. `defs.mjs` and
`validateCreatureBlueprint.js` short-circuit on `assetBacked` (no procedural forms/grammar). `maxTierFor` returns
0 for asset dragons (a static mesh can't morph across ascension → single form). `stamp-sw.mjs` now walks
`assets/models/*.glb` so the mesh precaches + serves same-origin offline. A hand-authored placeholder GLB
(`tools/make-placeholder-glb.mjs`, pure-Node glTF encoder) proves the entire pipeline end-to-end before spending
any Higgsfield credits; the real AI mesh later overwrites `assets/models/aether.glb` (then re-run stamp-sw).

**Known limits (scope, not bugs).** One static form (no ascension geometry morph); reduced Surge/fever tinting
on the PBR GLB (the dummy `bodyMat` rim/emissive hooks fire but don't reach the loaded material); AI meshes run
far over the ~6000-tri procedural budget — the explicit subject of the experiment, judged on the PR preview.
**→ Leapfrog:** the real Higgsfield asset is a credit-gated step (image → 3D → rig+animate → download → commit);
when it lands, decide skinned (drive its bones / mixer) vs non-skinned (re-parent wing nodes) from what the
export actually contains, then retune `def.glb.{scale,rotY,shoulder}` on the preview — no code change needed.

---

## Lesson — The asset dragon is HYBRID (AI body + authored rigged wings), and the GLB drop-in is egress-gated

**What we did (branch `claude/thundercoil-dragon-continue-7hb2zq`).** Continued the Thundercoil experiment toward the
real Higgsfield asset and turned the asset path from "load a whole creature" into a HYBRID: the GLB supplies only
the **wingless body+head**; `dragonGlb.js` mounts authored storm-membrane **wings** permanently under the flap rig.
This is a deliberate design choice, not a fallback — two reasons, both load-bearing:
1. **Motion.** Meshy's image-to-3D returns ONE static mesh with no named `wing_L/wing_R` nodes, and its auto-rig
   "rigs non-bipeds poorly" (a legless serpent rigs to garbage). A one-shot winged mesh would fly with RIGID wings
   — fatal for a flapping-dragon game. Authored wings under the existing `flapWing()` rig stay gameplay-reactive
   (speed/boost/steer/climb) for free.
2. **Reconstruction.** Thin wing membranes are exactly what image-to-3D reconstructs worst; the BODY is the part
   that comes back clean. So generate only the body.

**dragonGlb.js restructure (back-compatible).** The placeholder silhouette is now split: `placeholder` is the
**body+head** stand-in only; `authoredWingL/R` are separate meshes parented under `wingRigL/R.shoulder`. On GLB load
the swap-in: (a) if the GLB carries named wing nodes → reparent them under the rig AND hide the authored wings (a
fully-modelled winged export still works); (b) else → keep the authored wings (the hybrid AI-body case); (c) always
hide BOTH the placeholder body and the `headBox`. **Bug fixed in passing:** the old code hid only the body box, so a
loaded GLB rendered the placeholder head + wings ON TOP of it (double geometry) — now the whole silhouette retires.
The committed placeholder is regenerated **wingless** (`make-placeholder-glb.mjs`, 175 tris, 3 meshes) so the shipped
asset exercises the authored-wing path, matching the real asset's shape.

**New headless test `tests/glbcontract.mjs`.** Builds the asset-backed dragon through `buildDragonModel` under the
three-resolver + DOM shim (mirrors tricount). In Node `inBrowser()` is false → the async swap-in is skipped and the
SYNCHRONOUS placeholder+rig is returned, so the `{group,parts,materials,auraSprite}` contract is checkable with no
WebGL: asserts `auraSprite.isSprite` (dereferenced every frame), `parts.head` is an Object3D, each `wingRig*.shoulder`
carries an `authoredWing` mesh (the hybrid invariant), and `bodyMat` is real. Locks the must-return-real gotchas +
the wing invariant against regression. defs/blueprint/flapcheck/ascension/glb/tricount stay green; roster total
byte-identical (203265).

**The gotcha that stopped the credit spend — egress policy blocks the asset CDN.** Generated the wingless body
concept image on Higgsfield (`nano_banana_2`, 2 credits, job `c15b5f0c…`), but the result + any GLB live on
`d8j0ntlcm91z4.cloudfront.net`, which this remote environment's egress policy **denies (403 on CONNECT)**. The proxy
README says report blocked hosts, don't route around them. So the GLB **cannot be downloaded and committed from this
session** — the credit-gated 3D step would produce a file we can't retrieve. We did NOT spend the 3D credits.
**→ Leapfrog:** the body-mesh drop-in must happen where the Higgsfield CDN is reachable (a session with that host
allowlisted, or the human downloads the GLB and commits it). The repo is now fully READY for it: overwrite
`assets/models/thundercoil.glb` with the AI body, re-run `stamp-sw`, retune `def.glb.{scale,rotY,shoulder}` on the
preview — no code change. Everything downstream (rig, wings, contract test, SW precache) already works against the
placeholder, so the swap is one file + one stamp.

---

## Lesson — The egress unblocked, so the real AI body LANDED: the swap was exactly the "one file + one stamp" the prior lesson predicted

**What we did (branch `claude/thundercoil-dragon-continue-7hb2zq`, continued).** The previous lesson left the asset
pipeline fully built but blocked on egress — the Higgsfield CDN that serves generated meshes was 403-denied, so the
3D step was held and credits unspent. This session the egress was OPEN (confirmed by curl'ing the prior concept PNG
on `d8j0ntlcm91z4.cloudfront.net` → HTTP 200), which is the whole reason the sibling `higgsfield-download-perms`
branch existed. So we finished the credit-gated step end to end:
1. Reused the EXISTING wingless body concept image (job `c15b5f0c`, "ABSOLUTELY NO WINGS" storm-serpent turnaround) —
   no new image credits. `show_generations(type:'image')` surfaced it by id.
2. `generate_3d` with `model:'image_to_3d'`, `should_texture:true`, rigging OFF (job `c608693e`, **30 credits**;
   preflighted free with `get_cost:true` — untextured was 20, textured 30). Rigging stays off on purpose: the prior
   lesson's reason holds (auto-rig mangles a legless serpent; motion comes from the authored wings).
3. Downloaded the result GLB and overwrote `assets/models/thundercoil.glb`, re-ran `tools/stamp-sw.mjs`, done.

**The swap was byte-for-byte the predicted "one file + one stamp."** Only two files changed: the GLB and `sw.js`
(version bump + precache list). Zero code edits to make it WORK — the hybrid path, contract test, and SW walker all
just consumed the new asset. The only code touch was refreshing a now-stale "placeholder body" comment in
`dragons.js`. Roster total stayed byte-identical (203265); `defs/blueprint/flapcheck/ascension/glb/glbcontract`
all green; `tricount` still `0 over budget` (it skips `meshUrl` dragons).

**Gotchas worth keeping:**
- **The result GLB lives on a DIFFERENT CDN host than the concept image** — `d3u0tzju9qaucj.cloudfront.net` (3D
  output), not `d8j0ntlcm91z4` (image output). Both happened to be reachable this session, but when checking egress,
  verify the host that actually serves the *3D* result, not just the image CDN.
- **What `image_to_3d` returns for a stylized creature:** ONE merged mesh named `Mesh_0`, 1 PBR material, 2 texture
  images, **no skin, no animation, no named wing/head nodes**, glTF2, `extensionsRequired:[]` (uncompressed — no
  DRACO/meshopt wasm, exactly what the no-build importmap needs). 31,153 tris, 6.7 MB (the BIN is almost all
  texture). So the hybrid branch's "non-skinned, no wing nodes → keep the authored membrane wings" path is the one
  that fires, as designed. Verify a fresh asset's shape with the JSON-chunk inspector (parse the GLB header, read
  `meshes/skins/animations/node.names` + sum accessor tris) BEFORE wiring expectations — don't assume named nodes.
- **6.7 MB is heavy for an offline-precached asset on weak mobile.** Accepted as the explicit subject of the
  experiment (judged on the PR preview), but it's the real cost of an AI mesh vs the ~6k-tri procedural budget. If
  this graduates from experiment to shipped, decimate + downscale the textures (or split the GLB out of the SW
  precache and lazy-load it) before it rides in the offline bundle.

**→ Leapfrog:** the asset path is now PROVEN with a real AI mesh, not a placeholder. Next is purely tuning + judgment
on the preview: retune `def.glb.{scale,rotY,shoulder}` so the body sits right and the authored wings mount at the
real shoulders; decide whether 31k tris / 6.7 MB earns its place or needs a decimation pass; and if the storm-serpent
reads well, this is the template for any future AI-bodied dragon (concept image → `image_to_3d` textured/no-rig →
overwrite a `meshUrl` GLB → stamp). The body-vs-wings division of labour (AI body, authored reactive wings) is the
reusable pattern, not a one-off.

---

## Lesson — Placing an AI mesh in the chase cam: VERIFY WITH `gameshots`, don't reason about Euler angles by eye

**What we did.** First in-game look at the real Thundercoil GLB: it was tiny and facing the wrong way. Fixed both,
but the win was the METHOD — `tools/gameshots.mjs` (Playwright + the live chase cam) renders the asset-backed dragon
in the REAL renderer, which is the only way to judge a GLB (no headless WebGL — silhouette tools are procedural-only).
Chromium IS available in this environment, so the loop is: edit `def.glb` → `node tools/_oneshot.mjs` (a 1-tier clone
of gameshots) → screenshot → crop the dragon → look → repeat. Four iterations took minutes and removed ALL guessing.

**The orientation facts (storm-serpent mesh, head at +Z / tail −Z / curl in +Y):**
- The game writes `group.rotation.{x,y,z}` EVERY FRAME (dragon.js ~L493–499 for bank/pitch/yaw), so you CANNOT bake
  facing into the figure group. Facing must live on the GLB *content* via `cfg.rotY/rotX/rotZ` (applied in
  `applyGlbTransform`) — which is exactly why that hook exists. Added `rotX`/`rotZ` alongside the existing `rotY`.
- Procedural dragons face **head −Z** (`headBase.z` is negative; chase cam looks toward `player.z − 16`). The GLB
  came head **+Z** → `rotY = Math.PI`. That alone read as a vertical PILLAR, because this mesh's bbox is Y≈1.33 vs
  Z≈1.91 — it's posed as a *floating vertical curl*, not a flat flight pose. A forward pitch lays the curl into a
  flight line. **Sign matters and is NOT obvious from the numbers:** `rotX = −1.0` nosed the head DOWN toward the
  camera (tail up/far — looked backwards); `rotX = +1.0` put the wedge head far/up-into-screen and the forked tail
  trailing toward the camera — the correct chase read. The crop is what told them apart; don't trust intuition on
  composed Euler rotations — render it.

**Sizing without ballooning the rider.** The rider is parented UNDER the dragon group (`group.add(rider)`) and scales
with `model.scale`, so DON'T size an asset dragon via `model.scale` (it inflates the rider too — same reason
procedural dragons grow via `bodyScale`/`wingSpan`, not the group). Instead: body via `cfg.scale` (1.0→3.6 → ~7-unit
body, matching Pearl/Aurum apex body length ~8 measured headlessly), and a NEW `cfg.wingScale` that multiplies the
authored membrane-wing coords (the wings are fixed-size geometry, immune to `cfg.scale` which only touches the GLB
content). Shoulders moved to `z = −1.6` so the wing roots sit on the chest, which is the −Z/front end after `rotY`.

**Reusable knobs now on `def.glb`:** `{ scale, rotY, rotX, rotZ, shoulder:[x,y,z], wingScale, riderAt:[_,y,z] }` —
the full placement vocabulary for any future AI-bodied dragon, all tunable from `dragons.js` with no code change.
glbcontract/glb/defs/blueprint/flapcheck/ascension stay green.
**→ Leapfrog:** open polish (preview judgment): the authored wings read SMALL beside the long serpent and sit high
near the head — enlarge `wingScale` / re-place `shoulder`, or rethink the wing planform for an amphithere. And the
body is still RIGID — it rides the shared whole-body transform + the wing flap, but does not slither/coil on its own;
giving the serpent signature motion means a procedural vertex-undulation deformer (traveling sine along the spine),
which is a real, separate piece of work + a per-channel velocity gate (see the flapcheck lesson), not free from the GLB.

---

## Lesson — Lay the AI mesh into the flight plane (pitch), then give the static body a GPU SLITHER via onBeforeCompile

**Orientation, finished.** The prior pass left Thundercoil flying but reading as a vertical reared pillar — the mesh
is posed as a floating vertical curl (bbox Y≈1.33 ≈ Z≈1.91). The human's fix was precise: "rotate it 90° so head and
tail are in the SAME plane — tail toward us, head toward the sun." That's a forward PITCH past the rear-up pose:
`rotX` swept 1.0 → **1.8** lays the spine along the world depth axis (head −Z into the screen toward the horizon sun,
forked tail +Z toward the camera) — the canonical chase-cam flight line. Lesson: an AI mesh's authored pose is rarely
the gameplay pose; budget a pitch/roll to re-seat it into the camera's plane, and find the value by screenshot, not
arithmetic (sign + amount of a composed Euler are not eyeball-predictable — `gameshots`/a 1-tier clone is the oracle).

**The body was static; now it SLITHERS — without touching the mesh or losing its PBR texture.** A GLB body is one
rigid mesh (no bones), so signature motion has to be a vertex deform. Did it as a shader injection via
`material.onBeforeCompile`: prepend uniforms, then splice after `#include <begin_vertex>` a traveling lateral wave in
MESH-LOCAL space — `spineT = clamp((spineMax - z)/(spineMax - spineMin),0,1)` (0 head → 1 tail), `transformed.x +=
amp * spineT * sin(freq*z + waveSpeed*t)` (+ a faint `transformed.y` roll). Key wins:
- **Local-space displacement is orientation-independent.** The wave runs along the mesh's own +Z spine and is applied
  BEFORE the model matrix, so it's immune to the rotY/rotX/scale placement — the serpent slithers correctly no matter
  how it's re-seated in the camera plane. Spine bounds come from the geometry's local-Z bbox at load.
- **Amplitude ramps head→tail** (spineT) so the head leads and the tail whips — the read of a swimming serpent, not a
  uniform wobble. Reactive: `dragon.js` ticks `uTime += dt` next to the existing `glbAnim.mixer` tick and scales
  `uAmp`/`uWaveSpeed` with `player.speed` (the same speed-norm the flap uses).
- **Keeps the GLB's own PBR material/texture** — onBeforeCompile augments the standard shader instead of replacing the
  material (normals deliberately NOT recomputed: a subtle shear, cheaper, holds 60fps on 27k verts — a documented
  tradeoff). All data-driven via `def.glb.slither {amp,freq,speed}`; absent → byte-identical for any other GLB dragon.
- **Verified motion two ways.** Visually: two frames at different `uTime` show a DIFFERENT body curve (it animates, not
  a frozen bend — a single screenshot can't prove this, same lesson as flapcheck). Numerically: a new pure-math gate
  `tests/slither.mjs` mirrors the GLSL and asserts head-anchored / amp-bounded / tail-reaches-amp / oscillates-in-time
  / **crest-travels-head→tail** (a standing wiggle would pass the first four and fail the fifth). The GLSL + JS are one
  spec in two languages — change one, change the other.

glbcontract/glb/defs/blueprint/flapcheck/ascension/slither all green; roster byte-identical (203265).
**→ Leapfrog:** the per-channel "encode the motion invariant as a gate" rule now covers a SECOND channel (slither)
besides the wing flap — the reusable move for any new cyclic body motion. Open polish (preview): the wings still read
small/high beside the long body; tune `wingScale`/`shoulder`, and judge slither `amp`/`freq` + the `rotX` pitch on feel.

---

## Lesson — Data beats instructions for orientation; and a SEPARATE AI wing mesh hangs on the existing flap rig for free

**Orientation, corrected by MEASUREMENT (not by following the ask literally).** The human said "rotate it 90°" and I'd
been screenshot-tuning the pitch to a big value (+1.8) that still looked reared. The fix was to stop guessing and read
the geometry: parse the GLB, find the head vs tail ends (the FORK = tail, by larger cross-section x-gap; the wedge =
head), and compute the spine vector — `tail→head = (0, +0.506, +1.656)` native, i.e. only **~17° above horizontal,
mostly along Z**. Then measure where PROCEDURAL dragons put head/tail: head at −Z (toward the horizon), tail at +Z
(toward camera), both at near-equal low Y (pearl head −1.75/tail +4.02). So the correct leveling pitch after `rotY=π`
is `atan(-sy/sz) = atan(-0.506/1.656) = −0.30 rad` — a GENTLE pitch, the opposite end of the range from my +1.8 guess.
Rule: when the target is "match the rest of the roster," the roster's own data IS the spec — measure both the asset and
a reference, compute the transform, THEN screenshot to confirm. Don't tune a composed-Euler pitch by eye from zero.

**Wings, Option B: a separate AI wing GLB on the EXISTING rig — the cleanest "all-AI" wing.** The human asked why we
can't generate AI wings and animate them after, since we'd just proved the body can be procedurally animated (slither).
Right instinct. The reason the body-only hybrid existed is a QUALITY tradeoff, not an animation limit: image-to-3D
reconstructs thin membranes worst, and a fused winged mesh has no wing bones to flap. The resolution that keeps the AI
look AND a real flap: generate ONE wing in ISOLATION (a clear, face-on single wing with THICK finger-bone struts so the
reconstructor has solid volume to grab — `nano_banana_flash`, then `image_to_3d` textured/no-rig), then parent that GLB
under the existing `wingRigL/R.shoulder` (`def.glb.wingMesh {url,scale,rot,offset}`). `flapWing()` already rotates
whatever rides the shoulder, so the AI wing flaps with ZERO new animation code — verified by two frames showing the
wings in different positions. The off side is a TRUE MIRROR via a `scale.x = -1` holder group (mirror the parent, not
the child, so a single authored orientation reflects cleanly; set `material.side = DoubleSide` for the flipped normals).
Isolated-wing reconstruction came back clean (31k tris, clear membrane + bones + electric veins) — MUCH better than a
wing buried in a full-body shot, confirming the lesson: generate the hard thin part ALONE and big in frame.

**Orientation knob for the wing mesh:** its native bbox is a flat slab (X 1.91 × Y 1.78 × Z **0.86** thin), so the
membrane faces ±Z; `rot:[−π/2,0,0]` turns that to face up as the starting mount, then offset/scale tuned on the preview.
Headless stays safe: the AI-wing load is browser-only, so glbcontract still returns the authored membrane fallback and
passes; `glb.mjs` now reports BOTH GLBs. Cost noted: two 31k-tri / ~7–8 MB GLBs (body + wing-cloned-twice ≈ 93k tris,
~15 MB precached) — far over the procedural budget, the explicit price of an all-AI creature, judged on the preview.
**→ Leapfrog:** if this graduates from experiment, decimate + texture-downscale both GLBs (or lazy-load them out of the
SW precache); and the wing mount `rot/offset/scale` + a possible shader membrane-cup are the remaining preview tuning.

---

## Lesson — The all-AI wing landed: a SINGLE fused winged mesh + a shader wing-flap (no bones)

**What we did.** The human rejected the separate photoreal wing GLB as off-style and asked to
regenerate the WHOLE dragon WITH wings, in the game's cel-shaded art direction. So: generated a
cel-shaded winged hero concept (`generate_image nano_banana_flash`, job `ef3b73e4` — the prompt
spells out the art direction: "stylized cel-shaded game-asset look, smooth lofted forms, flat toon
bands, soft emissive accents, NOT photorealistic"), then `image_to_3d` (textured, no rig) on THAT
single image (job `d01ab50b`). The winged mesh reconstructed cleanly this time — **30,925 tris, one
mesh, wings present and readable as bat-membranes** — overwrote `assets/models/thundercoil.glb`,
re-ran `stamp-sw`, retired the whole separate-wing path (`thundercoil_wing.glb` + `def.glb.wingMesh`
+ the wingMesh load branch). Coexistence held: glb/glbcontract/defs/blueprint/flapcheck/ascension
stayed green; the authored membrane wings stay as the headless fallback (glbcontract needs them) and
are hidden in-browser once the fused mesh loads (new `def.glb.fusedWings` flag).

**A fused winged mesh has wings but NO wing bones — so flap them with a shader vertex deform, same
move as the slither.** `dragonGlb.js attachBodyDeform` now injects TWO local-space displacements
into the body material's vertex stage (one `onBeforeCompile`, keeps the PBR texture): the existing
slither wave + a new wing-flap. The flap: verts past `|localX| > uHingeX` are the wings; they rotate
about a fore-aft hinge (local Y, at `localX = ±uHingeX`) by `fth = −sign(x)·amp·sin(phase)` so BOTH
wings beat together (the `−sign(x)` makes the symmetric up/down; an antisymmetric sign would be a
roll). Body verts (mask 0) are identity. `dragon.js` advances `uFlapPhase` reactively (quicker on
held boost), right beside the slither tick. Wings swing through local Z, which the −90°-ish flight
pitch maps to world up/down — so the flap is **placement-robust** (all pre-model-matrix, like the
slither). Locked with a pure-math gate `tests/wingflap.mjs` (body-anchored / wing-swings /
SYMMETRIC / oscillates / flat-at-phase-0,π), the wing-channel twin of `slither.mjs`. The
per-channel "encode the motion invariant as a numeric gate" rule now covers THREE channels:
rigged-wing flap, body slither, fused-wing flap.

**Orientation came from the geometry, not a guess.** Each AI mesh is reconstructed in its own native
pose: this winged one stands VERTICAL — `glbinspect` (a new headless tool that reads the GLB's
POSITION accessor min/max, no renderer) showed widest axis X 1.91 (wingspan), spine Y 1.52 (head +Y
→ tail −Y), depth Z 1.21. So the spine is local **Y** this time (the wingless turnaround body was
local Z) — meaning the slither axis is now data-driven (`attachBodyDeform({axis})`, spine bbox read
on the matching axis at load). A −90°-ish `rotX` lays Y into the chase depth axis; screenshot-tuned
to `scale 3.9, rotX −1.2` (the coiled source pose drapes a little vertically — final pitch is the
human's preview call). **Screenshot loop in this env:** playwright's pinned browser build (1228)
mismatches the pre-installed Chromium (1194); `npm i -g playwright` + a temporary
`executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome` in `tests/browser.mjs` (reverted
before commit) gets a real in-engine GLB screenshot — the only way to judge a GLB (no headless WebGL).

**→ Leapfrog:** the all-AI creature is real — generate the concept IN the game's art-direction
words, convert the WHOLE thing once it reads (a stylized full-body shot reconstructs wings far better
than a photoreal one), and animate the boneless mesh with stacked local-space shader deforms, each
guarded by a math gate. Cost: one ~8 MB / 31k-tri GLB (down from two; the separate-wing era was ~15
MB / 93k). If this graduates from experiment, decimate + texture-downscale and lazy-load it out of
the SW precache.

---

## Lesson — Orient a GLB by MEASURING the roster, not eyeballing; and rim-light a backlit PBR mesh

**The fused winged mesh shipped reared + dark on the real device.** Two fixes, both data-driven:

**Orientation — measure both the asset AND a reference, don't guess the pitch.** I'd set `rotX −1.2`
from bbox reasoning + a charitable screenshot; on the phone it read as a reared, side-on pillar. The
fix was to MEASURE. A temporary in-browser seam (`window.__dragon = {group, head, tailSegs}`, reverted
after) logged a procedural reference's real world-space head/tail relative to the dragon group: azure
**head [0, +0.31, −1.91], tail [0, +0.2, +2.11]** — i.e. the roster convention is head −Z, tail +Z, at
**near-equal Y (level)**. Then the same probe transformed thundercoil's native bbox extremes through its
live world matrix: at `rotX −1.2` the native +Y/−Y ends landed at y +1.07 / −1.08 — a **21° nose-up
rear**. Only `rotX = −π/2` puts both ends at equal height (level), matching azure. Confirmed in the real
renderer (head into −Z toward the sun, forked tail +Z to camera, dorsal up). Also added `tools/glbaxes.mjs`
(decodes the POSITION buffer and slices along an axis to read wingspan/spine/fork from cross-section
spread, headless). Rule: when the target is "match the roster," the roster's own measured numbers ARE
the spec — instrument the game, read head/tail world coords for a known-good dragon and for the new one,
compute the transform, THEN screenshot to confirm. The bbox extreme ≠ the head, either: the widest |X|
sat at high Y because the **wingtips** are raised in the authored hero pose, not because the head is there.

**Brightness — a PBR GLB is a black silhouette when backlit; rim-light it like the procedural dragons.**
The sun sits ahead on the flight line, so the camera sees the mesh's shadowed side. Procedural dragons
already solve this with a fresnel rim. The GLB's own materials weren't getting it (the rim system targets
the dummy `bodyMat`, not the loaded mesh's materials). Folded a fresnel rim + a flat fill into the SAME
`attachBodyDeform` `onBeforeCompile` as the slither/flap — it had to be one injection, because
`composeSurface`/`applyFresnelRim` create FRESH uniform objects and would (a) clobber a second
`onBeforeCompile` and (b) break the externally-ticked deform uniforms. The rim adds
`uRimColor*(fres*int + bias) + uFill*fillInt` to `totalEmissiveRadiance` (view-dependent edge, light-
independent — survives the bake), injected at `#include <emissivemap_fragment>` exactly like the existing
`fresnelRimPatch`. Tuning mattered: first pass (intensity 0.7 + a flat electric `bias` 0.05) washed the
whole body into a glowing blue blob; `bias → 0` (edge-only) + a NEUTRAL steel fill (not the electric
accent) kept the storm-grey form with just an on-brand electric edge. All data-driven via `def.glb.rim`.

**→ Leapfrog:** for any asset-backed dragon, (1) orientation is a measurement, not a vibe — log a
reference dragon's head/tail world coords and match them; (2) budget a rim+fill lift for the PBR mesh up
front (backlit is the default framing), and keep it edge-weighted so it accents rather than floods.

**Addendum — the roll (dorsal-up) is a separate axis from the pitch, and only the human eye catches it.**
After leveling with `rotX = −π/2`, the human reported the dragon flew BELLY-UP: native +Z is the belly,
not the dorsal (my guess was wrong, and a rim-lit silhouette doesn't reveal up/down). Fix: `rotY = π` —
a 180° roll about the spine, applied BEFORE the pitch (Euler 'XYZ' applies the Y rotation to the vector
first), so the dorsal comes up; the wings then read as a raised V, matching the concept. Bonus check that
confirms it: the wing dihedral flips from drooping-down to sweeping-up. Lesson: head/tail (pitch) and
dorsal/belly (roll) are independent — measure/verify BOTH; a backlit mesh hides the roll, so confirm it
on a lit frame (or just ask which way is up). For a vertical-standing source pose, the recipe that lands
it is `rotX −π/2` (level) + `rotY π` (dorsal up).

**Addendum 2 — a |x|-only wing mask flaps the COILED TAIL too.** The human saw the tail "warp weirdly
when it moves." Cause: the fused-wing flap selected wing verts by `|localX| > hingeX` alone, but the
serpent's coiled tail also swings wide in X (±0.4 vs hingeX 0.28), so the shader grabbed tail verts and
beat them with the wings. Fix: AND a spine-band gate — `step(uHingeX,|x|) * step(uWingMinS, spineCoord)`
— so only verts in the FRONT/shoulder band (high native Y) flap; the tail (low Y) is excluded. Added a
gate check (`tests/wingflap.mjs`: a wide-X vert below the band must have zero displacement) so this can't
regress. Lesson: a procedural-animation mask defined on ONE axis will catch unintended geometry on a
folded/coiled body — gate it on the body REGION (here the spine coord), and assert the excluded region
stays put.

**Addendum 3 — never multiply a varying rate by an unbounded clock; ACCUMULATE phase.** The human:
"anytime there is acceleration the dragon spasms — hold-boost, a speed powerup, or a barrel-roll burst."
One root cause: the slither phase was `phase = uFreq·spine + uWaveSpeed·uTime`, with `uTime += dt` growing
unbounded and `uWaveSpeed` derived from speed. So d(phase)/dt = uWaveSpeed + uTime·d(uWaveSpeed)/dt — the
second term scales with ELAPSED RUN TIME, so any speed change (acceleration) lurched the phase by a spike
that got worse the longer you'd flown (≈600 rad/s 60s into a run for a 0.3s boost ramp). Fix: accumulate
the phase directly — `uTime += dt·waveSpeed`, shader reads `uFreq·spine + uTime` — so a rate change only
changes how fast phase advances, never jumps it (d(phase)/dt = waveSpeed, bounded, elapsed-time-independent).
This is the SAME phase-accumulator rule the rigged wing flap already used (and our fused-wing flap uses);
the slither was the one channel still multiplying. Also DAMPED the speed factor (`glbAnim.sp`) and the flap
rate so the beat eases up to boost speed instead of snapping, and gentled the boost ramp. Barrel roll was a
red herring for a separate bug — it only adds a rigid `group.rotation.z` spin; it spasmed solely because it
bursts speed, hitting the same clock bug. **→ Leapfrog:** any GPU/CPU cyclic motion whose rate is reactive
MUST integrate phase per-frame; `rate · globalClock` is a latent spasm that hides until the rate changes
mid-run, and gets worse the longer the session.

---

## Lesson — Sky Canyon: add a course-feature as a DETERMINISM-SAFE OVERLAY on the existing line, not a re-route

**What we did.** Added a new gameplay beat — *How to Train Your Dragon*-style twisty rock canyons
(threading gaps that move left/right AND up/down) — that breaks up the rings + Phase-Gate loop. Four
archetypes (`split` two flanking slabs / `rib` Dragon-Spine arch / `spiral` big offset rock with the gap
hugging open sky / `overunder` alternating ceiling↔floor shelf), one forgiving `rockGap` collider type.

**The gotcha that shaped the whole design.** `tests/gold-determinism.mjs` asserts the base course
(`rings` + `obstacles` arrays) for seed 1337 over 3 km is **byte-identical to a frozen fixture** — that's
how old challenge links stay valid. So a course feature CANNOT touch the main `rnd` stream or those
arrays, and **any feature that re-routes the waypoint line (moves `prev`, adds `rnd()` calls) breaks it.**

**The reusable pattern — overlay, don't re-route.** Mirror the golden-ember isolation exactly:
1. **Independent RNG stream** (`canyonRnd = mulberry32(seed ^ const)`), never the main `rnd`.
2. **Separate output arrays** (`out.canyonSegments/canyonStarts/canyonEnds`), never `rings`/`obstacles`.
3. A **post-pass** (`overlayCanyons(out)`) that runs AFTER the normal `ensure` loop and **frames the rings
   already generated** — each rock gate's aperture is centered on an existing reward ring's `(x,y)`.
This bought two hard problems for free: **reachability** (gaps sit on the already-reach-audited line →
catchable by construction, no new reach math) and **visibility** (the safe opening is literally on the
line the player is already flying toward the next ring). The determinism fixture stays green untouched.

**Visibility kit (the owner's #1 fear: claustrophobia).** Open-TOP by design (masses flank/arch/shelf the
gap, never seal the sky). Ported the Phase-Gate cues: emissive aperture rim + additive core-glow locator.
The key NEW trick is **camera-proximity dissolve** — canyon rock uses a PER-INSTANCE clone of the biome
body material (`transparent`, `userData.perInstance` so `removeAt` disposes it) whose opacity fades 1→0
over the last ~15 m before the camera (`updateObstacles` reads `dz = e.dist - playerDist`). A cleared rock
never blocks the view of the next gate. Collision is **box-AABB, non-fatal (25 dmg, roll-clearable via the
existing `hit()` i-frame check)** — a pressure beat, not a run-ender; rocks deal damage like pillars, never
crash like gates.

**Build-your-own test harness (the owner asked for it).** `?canyon=split|rib|spiral|overunder|all` forces
runs to begin right after takeoff and repeat with normal rings before/after each, so every archetype can be
flown immediately — no need to play up to one. Launcher page: `reforged/canyontest.html`. The param is null
in normal play and in the headless tests (no query string) → **zero behaviour change off the harness.**
Reuses the same `new URLSearchParams(window.location.search)` seam `?debug=reach` already used.

**Verification.** `tests/canyon.mjs` (overlay spawns, deterministic per seed, all 4 archetypes, gaps
in-lane), `tests/canyonboot.mjs` (rocks BUILD in real WebGL + collision/camera/dissolve frames run with
zero console errors — drives the input-less dragon forward via a new debug `obstacleCount` seam; don't
assert an un-steered dragon SURVIVES, only that the code path doesn't throw), plus `gold-determinism`
(base course untouched), `smoke`, `tricount`. **Pre-existing env flakes:** `badges.mjs` + `celebrate.mjs`
time out on shop/skin-card UI visibility **on the clean tree too** — not regressions; confirm with
`git stash` before blaming your diff.

**→ Leapfrog:** the cleanest way to add a course beat to an endless generator with a frozen-fixture
determinism guard is an **independent-stream, separate-array OVERLAY that frames the existing reachable
line** — it sidesteps re-route determinism breakage AND inherits reachability/visibility for free. And for
any large near-camera geometry in a fast chase-cam game, a **per-instance proximity dissolve** is the move
that lets you add visually-blocking masses without blinding the player.


**Addendum — iteration 2 (owner feedback): two run TYPES, a Dragon-Spine skeleton, and a height limit.**
The owner reshaped the first cut: (1) removed the `spiral` archetype (no added purpose); (2) **mixed
`split` + `overunder` into one "Rock Run"** mini-course (alternating, split made TALL for vertical scale);
(3) added a **vertical height limit** — you could previously climb to `laneMaxY` and skip a canyon
entirely. Fix: a `game.inCanyon` flag (set on the canyon start/end boundary in `main.js`, reset in
`game.reset()`) gates a **canyon ceiling** in `collision.js` that bounces + chips like the floor, and
i-frames are ignored for both lane boundaries (`cause !== 'ground' && cause !== 'ceiling'`) so you can't
roll-cheese a limit; gaps are clamped to `[canyonGapYLo, canyonGapYHi]` so the opening always sits clearly
below it. (4) Reinterpreted **Dragon Spine** as a multi-beat **leviathan-skeleton set piece**, not a single
arch: a run is now a *typed sequence* — `startCanyon` picks `rock|spine`, `pickKind` maps each segment to a
beat by its index (`skull → throat → rib/vertebra ribcage → exitflare`), and `buildRockGap` dispatches on
`o.kind` to build a procedural skull (cranium + horns + jaws + teeth border + cheek hinges), asymmetric
sweeping ribs (heavy side alternates per segment to **fake the curl of a long body while the path stays
straight**), vertebra rhythm chunks, and a flared open-sky exit — all on a dedicated warm **bone material**
(`mats.bone`). The fake-curvature illusion came for FREE from the determinism-overlay design: the openings
are centered on the existing serpentine ring line, so the ring path already snakes L/R through the ribcage.
**→ Leapfrog:** a "run" in an overlay generator wants to be a **typed beat-sequence** (run type → per-index
kind → geometry dispatch), not a bag of identical segments — that's what turns "some rocks" into "I flew
through the mouth and ribcage of a dragon." And any lane limit a barrel-roll could cheese must bypass the
roll i-frame check, the same way the ground always has.

**Addendum — iteration 3 (outside reviewer): authoring the spine into "Ancient Remains v2".**
An outsider proposed turning the leviathan skeleton into a full "journey through the corpse" (skull
approach → throat choke → rib slalom with varied rhythm/broken ribs → **heart chamber** → vertebrae ring
tunnel → tail-burst exit), plus mechanics riffs (gem trails, surge-break bone walls, phase-through
membranes, barrel-roll crystal growths). The useful filter was the **overlay architecture itself**: three
of its invariants quietly veto whole categories of "good ideas," so they got dropped, not debated —
(1) the canyon writes ONLY to `canyonSegments/Starts/Ends` on `canyonRnd`, so it **cannot add/move any
collectible** (every gem-trail / orbiting-gem / safe-line-gem idea is out — `gold-determinism.mjs` stays
the proof); (2) each segment is **1:1 bound to a centred reward ring**, so **nothing solid can sit on the
line** (a heart "core you fly around / pick a side" is out — the core became *decorative, offset, no
collider*); (3) canyon rock is **non-fatal + always-passable**, so a *mandatory* surge-wall/phase-membrane
is out (an optional route with no reward — collectibles forbidden — is pointless). What survived was pure
**geometry + juice**, which is exactly where an overlay is free: `pickKind` became an explicit positional
template with a `heart` beat at the midpoint (`open→tight→OPEN→tight→release`); `ribcage()` grew
`{broken, tilt, squeeze}` so the front ribs *tighten toward the heart* and throw the occasional snapped rib
(kills the repeating-mesh read — the #1 complaint) while the **corridor colliders stay identical** (variety
above the hitbox, never in it); a new `heartChamber()` is a wide-open cavity (sparse huge flared arches +
a translucent magenta `mats.heart` crystal offset to the sway side) that *reinforces* the see-through value
instead of fighting it; skull got bigger + pulsing soul-fire eyes (shared `mats.soul`, one emissive write/
frame like `mats.mover`); and entry/exit beats are a shake + mist puff / bone-dust `burst` on the existing
canyon boundary (no new plumbing). `spineSegments [7,9]→[10,12]` to fit the act without a 30s slog.
**→ Leapfrog:** when a reviewer hands you a wish-list, **let the architecture's invariants do the triage** —
a determinism-overlay's "can't touch base arrays / 1:1 ring binding / always-passable" rules pre-sort every
idea into *free* (geometry, emissive, particles, camera) vs *expensive* (collectibles, hard blocks, new
reward systems). Spend only in the free lane and you ship the spectacle (an authored multi-act set piece)

**Addendum — iteration 7 (owner): "what happened to the surge VFX?" — a feature GATE, not a regression.**
The owner felt the dragons' Dragon-Surge effects had disappeared. An evidence pass (read + `git log`) found
nothing deleted: the universal surge VFX (material flare, trail colour-shift to magenta, aura bloom, Phoenix
ember-motes) are all live. The missing piece was the **wingtip edge-trails + hard-bank aero-shear**, which
were **deliberately gated to Aurum Toro Mk II** (`const isMk2 = !!activeDef.model.wingParts`, commit `4074762`,
with the note "gated to Mk II for now; generalising is a one-line gate change once approved"). The wingtip
*markers* (`tipMarkerL/R`) and the sprite *pools* already exist for the whole roster, so the gate was the only
restriction — flipping it to a marker test (`hasWingFx = !!(tipMarkerL || tipMarkerR)`) gives every dragon the
effect, with the per-form intensity defaulting to a moderate level for form-less dragons. Also found: barrel
roll emitted **zero particles** (only camera + SFX), so added a `rollWake()` vapor emitter (lateral + behind,
stretched along velocity) fired per-frame through the roll. **→ Leapfrog:** before "fixing a regression,"
prove it IS one — `git log -p` the suspect files. A feeling of "this used to be here" often resolves to a
deliberate feature gate (`isX`) with the infrastructure already roster-wide; the fix is flipping the gate, not
rebuilding the feature. And the gate's own commit message usually tells you it was waiting for exactly this.

**Addendum — iteration 8 (owner: "in Surge but no tail trail"): a pooled-sprite allocator starved by a
force-show.** The owner saw the new wingtip trails but NO tail trail in Surge. I almost said "wrong build";
the honest move was to MEASURE — added a debug seam (`__trailDebug()` on `window.__dd` under `?debug`)
returning the live visible-count per emitter. It showed `boost=0, trail=0, ember=0` even while *boosting*,
but `wingtip=2`. The tell: those three zeros are exactly the pools listed in `setDragonFxVisible()`, and the
one non-zero pool is the one NOT in that list. Root cause: `main.js` ran `setDragonFxVisible(!hideShopFx)`
**every frame before `updateDragon`**, and during play `!hideShopFx` is `true` → it set EVERY pooled trail
sprite `visible = true`. The emitters allocate via `find(s => !s.visible)`; with every sprite force-shown
there was never a free one, so **nothing emitted** — the boost/speed/ember trails had been silently dead for
the whole roster, not just in Surge. Fix: only HIDE at the shop (`if (hideShopFx) setDragonFxVisible(false)`);
never force-show during play — the emitters re-show their own sprites on emit. Guarded by `tests/surgefx.mjs`.
**→ Leapfrog:** when one effect works and a sibling set doesn't, diff what's DIFFERENT about them (here:
membership in a visibility-toggle list) — the partition IS the clue. Never `visible = true` a whole pool
that's allocated by `find(!visible)`: a force-show is a force-starve. And when a user says "X isn't showing,"
instrument the actual emitter count before theorising about builds or caches — measurement beats assumption,
especially right after you've already been wrong once.

**Addendum — iteration 9 (owner): trail gating + a stamina bar stuck at "2 notches".** Trail feel: wingtip
edge-trails were emitting constantly while boosting; the owner wanted them only **when turning** (air shed off
the tips), with the **Phoenix** the sole exception (constant in Surge). Fix: gate the wingtip emit on
`bankHard > 0.25` (the lateral-bank signal already computed for the aero-shear) OR `(isPhx && surging)`. And
the boost-time *tail* trail was too heavy — lightened its rate (`0.018→0.035`, `speed-trail 0.012→0.03`) while
leaving the Surge rates the owner already liked. The stamina bar bug was the sharper lesson: it had shown "2
notches not 3" across EVERY build, and the cause was a **trailing zero in cell 3's `stroke-dasharray`**
(`"0 72 28 0"` / the JS `…28 0` at full). A zero-length FINAL dash/gap is a known SVG pitfall — several
engines (notably mobile WebKit) drop that segment, so the 3rd cell never drew. Fix: never emit a trailing 0
(drop the 4th value when the remainder rounds to zero → `"0 72 28"`). **→ Leapfrog:** a bug that survives
many "fixes" and reproduces only on the owner's device is a hint it's **renderer-specific**, not logic — and
SVG `stroke-dasharray` with a trailing `0` is exactly that class of trap (renders in Chromium, vanishes in
mobile WebKit). When a visual won't reproduce in headless, suspect the platform's renderer, not your math.

**Addendum — iteration 11 (owner): the rock run is "blind" at boost speed — fix it with TRANSPARENCY, proven
by a reaction-time calc.** The owner felt the sea-stack Rock Run was brutal at top speed (clipping spire
crests while reaching a ring, towers occluding the ring) and proposed making the rock see-through. Instead of
arguing feel, we did the math: top speed ≈ orb(80)×ramp(1.35) = **108 u/s**; a spire every ~12 units → one
every **0.11 s**; a clean lateral thread needs ~0.25 s reaction + ~0.35 s move ≈ **0.6 s ≈ 65 units ≈ 5
spires of foresight**. The spires were **opaque** (`noDissolve`), so you literally couldn't see 5 deep — that's
the "blind," and it's *occlusion*, not a skill gap (the open ribs read fine at the same speed, which is the
tell). Fix: give the spires the same **per-instance proximity fade** the overhead arches already had —
SOLID far (read the channel) → TRANSLUCENT near (floor 0.35, see the path through the spire you're passing).
Plus: a wider ring pocket that clears the ring's **approach** corridor (not just the ring plane), and the
spire **crest collider dropped near a ring** so lunging up for a high ring can't clip a thin tip (the canyon
ceiling still caps the climb). **→ Leapfrog:** when an owner says a section is "too hard / blind," reach for
the **reaction-time arithmetic** (speed → obstacle cadence → required foresight) before tuning by vibes — it
tells you whether the problem is difficulty (legit) or *readability* (a fairness bug). Here the cure was
visibility, not slowing the player down: deceleration should stay an optional skill lever, never a tax the
geometry forces because you couldn't see in time.
without paying the determinism/fairness tax — and **vary the mesh, never the hitbox**, so "less repetitive"
never means "less fair."

**Addendum — iteration 4 (owner playtest): density, a barrel-chest, and a roll-through tail finale.**
On the preview the v3 spine felt **thinner, not richer** — "less ribs, doesn't feel continuous, breaks up
with crystal windows." Three causes, all from the v3 changes: (1) a **longer run** straddles more of the
ring *rhythm*, which swings hard (`nextWaypoint`: ≈55 units in "burst" up to ≈130 in "breath") — and a
ribcage with a FIXED `depthHalf` (80-unit coverage) leaves real gaps on the long-spacing beats; (2) the
heart was a **sparse 4-arch void** dead-centre; (3) **22% broken ribs** thinned the read. Fixes: tie each
ribcage's `depthHalf`/`nRibs` to the **local ring spacing** (new overlay-only `seg.span = ring.dist -
prevRing.dist`) so a rib lands **~every 6 units on every rhythm** — continuity becomes spacing-invariant
instead of hoping the run lands on flow cadence. The heart became a **proper full-size ribcage** (a `grow`
multiplier swelling width + height into a barrel chest) you still fly *through*, with the crystal as a
decorative landmark beside the path; ribs swell 1.0→1.25 into the chest and taper back out (a body
silhouette). Broken ribs → a subtle chip (rate 0.10, near-complete arc). **→ Leapfrog A:** when an overlay
hangs geometry off a host line whose *spacing varies*, size the geometry to the **local spacing**, never a
constant — "looks continuous" must not depend on which rhythm the host happened to be in.

Then the owner asked for a **tail finale**: speed boosts you fly straight through, then a barrel-roll-through
curtain into open air. The collectible veto from iteration 3 turned out to be **narrower than assumed** —
`gold-determinism.mjs` freezes only `rings`/`obstacles`/`goldEmbers`, **NOT `orbs`** — so the overlay CAN
string **speed orbs** (`out.orbs`, via a fixed deterministic line off the exit ring) without touching the
fixture or the main `rnd`. The roll-through is a new `tailgate` beat: a brittle bone **portcullis across the
WHOLE exit (no gap)** flagged `e.rollwall`; in collision, an active barrel-roll (`player.rollInvuln > 0`)
**shatters it for style**, no roll is a light **non-fatal chip** — either way you pass into open air, it
never blocks. Pure reuse: roll i-frames, the gate's shatter transform, `phaseBurst`, the orb pipeline.
**→ Leapfrog B:** re-derive a constraint before letting it veto a feature — "the overlay can't add
collectibles" was really "can't touch the *frozen* arrays," and orbs were never frozen. And a "barrel-roll
through it" beat doesn't need a fail state: make the wall **non-fatal + always-passable**, and let the roll
turn a chip into a *reward* — the mechanic teaches itself without ever ending a run.

**Addendum — iteration 5 (owner playtest): cut the clever, keep the spine.** On the preview the
multi-act spine read as **messy** — the owner's call was to strip it back: "our old rib run was good, just
do MORE of it," lead in with a redesigned skull, and end on a **straight rib tunnel with a few speed boosts**
you boost flat-out through into open air. So the heart chamber, broken ribs, chest-grow, vertebra variety
AND the roll-through curtain all came **out** — `pickKind` is now just `skull → throat → rib (the swaying
run, the bulk) → straightrib (finale)`. The finale reuses the same `ribcage` with a one-line `straight`
flag (zero the sway) and strings `out.orbs` boosts through its first few segments; `spineSegments [9,11] →
[13,16]` for "more of it." The **skull redesign** is the transferable bit: the old one was `lump()`s —
icosahedra with *random full-axis rotation* + heavy jitter — which reads as a rubble pile, not a head. The
fix was a local `boneMass` that (a) uses a **once-subdivided** icosa with **low jitter** (smooth, not
craggy), (b) places with **NO random spin** so elongated masses (snout/brow/jaw) keep their intended
orientation, and (c) adds **dark recessed eye sockets** (`mats.socket`) with the glowing eye set inside —
contrast is what makes an eye read as an eye. Colliders frame the mouth but are tuned so none dips into the
gap. **→ Leapfrog:** procedural "creature" geometry lives or dies on **controlled orientation + smoothness
+ local contrast**, not part count — random-rotation jittered blobs never read as anatomy. And when an
authored set piece feels "messy," the fix is usually **subtract beats, not add polish**: one strong idea
(a long rib run) done well beats five clever ones competing for the same 20 seconds.

**Addendum — iteration 6 (owner): a finale that LOCKS straight.** "Straight tunnel" wasn't enough — the
finale ribs had only dropped the sway but still centred each beat on its own reward ring, which snakes, so
it read as a *wandering* tube, not a straight one. The owner's vision: a **dead-straight line of speed
boosts down the inside of the ribs** that builds speed until you shoot out. Fix: at the first finale
segment, capture a fixed `finaleX/finaleY` on the run-state object and stamp it onto every finale segment;
`ribcage` gained `centerX/centerY` so the hoops + corridor colliders lock to that line instead of `gapX/
gapY`, and a boost is placed ON the line in each finale beat → a continuous straight orb-line inside a
straight tube. **→ Leapfrog:** "make it straight" in an overlay that hangs off a *wandering* host line means
**stop following the host** for that stretch — zeroing the decorative wobble (sway) isn't enough if the
underlying anchor still moves; capture one anchor and lock to it. The cost is the host's own collectibles
(reward rings) drift off-centre there, which is the right call ONLY when that beat isn't about collecting
them (here it's a pure speed rush) — so lock to the line where the beat's *purpose* lives, not the host's.

---

### L89 — Boss fight = an ON-RAILS OVERLAY on the flight, not a new arena; bullets are a player-relative InstancedMesh pool

**Did / learned.** Built the first increment of a bullet-hell boss fight for the live `reforged/` game
(the user's vision: a boss flies in, settles in front, "flies backward" while spraying bullets you dodge by
steering; the rider auto-chips it down; ~3 phases → disintegration). The whole thing ships as a **coexisting
overlay** gated by `game.inBoss`, modelled exactly on the Sky Canyon `game.inCanyon` pattern: forward motion
continues, hazards are suppressed for the duration, and it tears down cleanly back into the endless run.
New modules are self-contained and additively wired — `bossModel.js` (a procedural NON-dragon creature,
756 tris, with a `setDissolve(k)` death), `bossBullets.js` (the bullet pool), `bossDefs.js` (data schema),
`boss.js` (the state machine: warn → approach → fight → dying → teardown). The only edits to shipped files
are small, boss-gated guards (`player.js` suspends boost + locks cruise speed; `collision.js` skips the
hazard loop + exports `hitPlayer`; `main.js` inits/updates/resets + suppresses hazard spawning while
`inBoss`; `ui.js` gains `bossBanner`). The godfall arena game was explicitly **off-limits** (a known failure)
— this is native to the flyer.

**The key modelling insight — work in the PLAYER-RELATIVE frame.** A boss that "flies backward at matched
speed" is *stationary ahead of the player* in the player-relative frame. So every bullet carries `rel` = how
many metres ahead of the player it is (boss holds at `rel = settleGap`), and world `z = -(player.dist + rel)`
is recomputed each frame. A boss bullet closes `rel → 0` and the **hit is the frame `rel` crosses 0** while
x/y are near the player; a rider/reflected bullet closes `rel → settleGap` and emits `bossDamage` on arrival.
This is frame-correct regardless of how fast forward flight is — no chasing a moving target, no world-velocity
bookkeeping. Damage routes through the existing `hit()` (via the new `hitPlayer` export) so a barrel roll's
`rollInvuln` i-frames negate a bullet **for free** — dodging fell out of the system we already had.

**→ Systematize.** Two reusable patterns. (1) **The `inX` overlay contract**: a heavy gameplay mode is a flag
that mirrors `inCanyon` — suppress generation at the *source* (skip laying meshes in `spawnAhead` but still
advance the deterministic generator, so the course stays byte-identical for the seed), guard the systems that
must change with `if (!game.inX)`, and reset on `restart()`/`settleRun()`. Nothing about a normal run changes
when the flag is off. (2) **The embers InstancedMesh pool generalises to any swarm**: one draw call, `slots[]`
+ rotating cursor, HIDDEN scale matrix, sphere collision `dx²+dy²+dz² < r²`, quality-scaled visible cap. Bullets
are just embers with velocity + an owner + a collision verdict. The boss itself is **data** (`bossDefs.js`:
hp + 3 phases + attack ids), so a second boss is mostly authoring, not code.

**→ Leapfrog (innovate).** The damage economy is now a tunable triangle — rider chip (steady), reflects
(skill burst), surge unleash (the 2nd-finger tap) — balanced so ~3 surges + chip = a 3-phase kill. The next
increments slot straight into the seams already built: the `reflectable` flag + `reflectBossBullets()` are
already in the pool (increment 3 just flips flags + wires the roll listener), the surge meter already fills
(increment 2 gates its auto-activate during boss and binds the 2nd-finger tap), and "bullet-hell rings" are
just rings spawned by `boss.js` during the fight. Bigger picture: the player-relative overlay frame is a
**general stage for scripted set-piece encounters** on the endless track (escorts, gauntlet bosses, chase
sequences) — anything that wants to hold a fixed relative position and choreograph against the player without
leaving the rails. **Verification reality (unchanged):** headless logic tests (`tests/boss.mjs` drives the
full lifecycle to a kill) + a real-WebGL boot smoke (`tests/bossboot.mjs`, zero console errors through a live
fight) + `tricount` (boss is additive, roster baseline untouched); the human judges approach choreography,
bullet readability and the disintegration on the PR preview — our tools can't see motion. (`tests/badges.mjs`
still times out on `.shop-grid` headless — environmental, fails on a clean tree too, as L88 notes.)

---

### L90 — Boss feel pass: telegraph the wind-up, colour danger red, keep boost pace, and build patterns as readable "safe-lane" shapes

**Did / learned.** First playtest of the boss (L89) surfaced four feel problems, all fixed as data/small-system
changes on the increment-1 scaffold. (1) The aimed "3-at-you" was unfair — 0.65s window, a 0.25s predictive
LEAD that read as homing, and 1.2m spacing that overlapped the trio into one gapless wall. Fix = more reaction
time (settleGap 26→30, bulletSpeed 40→34 → 0.88s), kill the lead (0.25→0.08 so moving actually dodges), widen
spacing, shrink the hitbox. (2) Flying with boost SUSPENDED felt sluggish → lock the on-rails cruise to BOOST
speed (`cruiseSpeed 35→65`); because bullets live in the player-relative frame, forward speed doesn't change
dodge difficulty at all — it's pure motion *feel* (camera FOV widens, world rushes). (3) No wind-up read →
added a **telegraph**: each attack now charges for 0.5s (instant) / 0.7s (streamed) while the model's maw flares
toward red (`bossModel.setCharge(k)`), then releases with a flash + muzzle burst. (4) Bullets recoloured to
**fiery red** danger (`def.bulletColor`), and the boss BODY moved to violet so red reads as "this hurts" against
it. Plus variety: two **sustained** patterns — `tunnel` (a succession of bullet-rings with a weaving centre — the
rib-run tube the player asked for) and `spiralStream` (a rotating emitter) — driven by a `pending[]` timed
sub-volley queue, serialized so a new attack never starts mid-stream.

**→ Systematize.** (a) **Telegraph + sub-volley queue = the general attack spine.** An attack is now {charge →
execute}, and execute either fires one volley or pushes `{t, fire}` entries onto a `pending` queue processed each
frame; gating "no new attack while `pending.length || chargeT`" serializes everything for free. Any future
pattern (waves, walls, homing-with-counterplay) slots in as either an instant volley or a scheduled stream — no
new control flow. (b) **Player-relative frame means feel and fairness are ORTHOGONAL knobs**: forward speed is
free to tune for *motion feel* without touching dodge difficulty (which is `settleGap / bulletSpeed` + lead +
hitbox). Tune them independently. (c) **Readable danmaku = a clear safe lane + a wind-up**, not low density —
the tunnel works because the safe centre is obvious and *drifts smoothly*; the aimed shot failed because it had
no gap and chased you. Bake the "safe shape" into the pattern, telegraph it, then escalate.

**→ Leapfrog (innovate).** The charge state is exactly the hook the **reflect** increment needs: a `reflectable`
attack can telegraph in a distinct colour, and the barrel-roll window (`reflectBossBullets()`, already stubbed)
swats those back during the bullet's approach. The `pending` queue also unlocks **boss-authored bullet-hell
rings** (rings + bullets co-scheduled so threading a ring during a tunnel pays combo) and **multi-emitter** bosses
(several muzzles pushing independent streams). And because patterns are now declarative ids resolved by the
controller, a second boss is *just* a `bossDefs` entry with a different attack mix + colours — the migration
payoff. Verification unchanged: `tests/boss.mjs` (lifecycle to a kill, now through the telegraphed phases) +
`tests/bossboot.mjs` (real WebGL, zero console errors with tunnel/stream live) + `tricount` (boss additive,
roster 203265 untouched); the human judges the wind-up read, the red, the boost pace and the tunnel weave on the
preview.

---

### L91 — Graze→Surge (boss Increment 1): reconnect danmaku to the signature meter; verify the design spec against HEAD before building it

**Did / learned.** A design spec (`dragon-drift-boss-retune.md`) proposed wiring bullet **grazing** to Dragon
Surge. Before implementing, I verified its claims against the live source — and two had **drifted from the spec's
snapshot**: (1) §B claimed "no rings spawn during a boss, so surge is dormant/impossible," but the feel pass
(L90) had since made `spawnAhead` keep rings + embers flowing while `game.inBoss` — so `consecutiveRings` can
climb and Surge can already fire mid-fight; and worse, `rings.miss()` zeros `consecutiveRings`, so flying *past* a
ring while dodging would **sabotage** any graze meter built on it. (2) `hit()` only resets the streak
`if (combo > 1)`, but in a boss combo sits at 1, so a bullet hit would **not** cancel a graze-charged surge.
Also confirmed the two things the spec couldn't: the surge gem-row HUD is **not** gated by `inBoss` (it's a
sub-state of `playing`, so it's already visible), and there is **no** manual surge "tap" — surge is
auto-trigger-only (the config/player comment about "freeing the 2nd finger" is aspirational). Built Increment 1
against *those* facts: a graze band `(hitR, grazeR]` in the bullet crossing test calls `collision.bulletGraze()`,
which charges a fractional `grazeCharge` accumulator that spills into whole `consecutiveRings` steps → the
**existing** meter + auto-trigger, no new UI; a bullet hit now cancels the streak **unconditionally**; and rings
go **decorative during a boss** (skip collect/miss) so grazing is the clean, sole surge driver.

**→ Systematize.** (a) **Verify a design doc against HEAD, not against its own snapshot.** A spec written by
reading the repo is still a *snapshot*; the branch moves. The cheap, decisive check is: for each load-bearing
claim, grep/read the exact file+line it rests on. Here it flipped the entire premise (surge is NOT dormant) and
surfaced two interaction bugs (ring-miss sabotage, combo-gated hit-cancel) the spec couldn't have known. Make
"reconcile the plan with the code" the first step of every increment, and write the drift down. (b) **Reuse the
meter, don't fork it.** Graze feeds `consecutiveRings` through a fractional accumulator, so the gem HUD, the
threshold, the auto-trigger, and the "damage breaks it" risk/reward all compose for free — the new mechanic
inherits the whole surge economy instead of reimplementing it. The pattern generalizes: to add a new *source* for
an existing resource, drive the resource's existing integer/threshold, don't add a parallel meter. (c) **When two
systems fight over one counter, neutralize the weaker one in the mode where the other owns it** — rings become
decorative in a boss so danmaku owns the streak; one `!game.inBoss` guard, no new state.

**→ Leapfrog (innovate).** Grazing is now the *earn* half of the surge loop the boss was missing — the "drift"
identity transplanted from rings onto bullets, and it works on **every** pattern for free because the hook lives
in the bullet update, not per-attack (so L90's tunnel/spiralStream and any future `rose`/`curtain`/`laserLance`
reward tight threading the moment they ship). That sets up the *spend* half: Increment 2 wires the already-built,
still-dead `reflectBossBullets()` to the barrel roll, and Increment 3 makes Surge the hyper (bullet-time + double
rider fire + all-bullets-reflectable) — graze to charge, pop Surge, roll through the storm reflecting bullets
into the boss. The ~3-surges-to-kill economy the test enforces finally becomes *earned* instead of waiting on the
rider chip. Verification: `tests/boss.mjs` extended (graze charges, hit/miss excluded, hit cancels, sustained
grazing auto-fires Surge) + `tests/bossboot.mjs` real-WebGL zero-error + `tricount` unchanged (203265) +
`tiershots` compiles; the human judges on the preview whether the graze band *feels* right (the tuning numbers —
`grazeScale 2.2`, `grazeGain 0.34` — are first guesses).

---

### L92 — Boss bullet readability + "stops short" feel: core+halo, fly PAST the plane, player-anchored area patterns

**Did / learned.** Playtest notes on the danmaku: bullets read too transparent; they seemed to "stop just short of
me"; too fast; and an edge-parked player skipped the circular patterns. Four fixes: (1) **core + halo** — a lone
additive octahedron washes out over the bright biomes, so bullets are now a bright near-opaque core (`0xfff2e6`,
a second `InstancedMesh` drawn on top) inside the additive coloured halo (radius ×2.0). Two draw calls total,
still trivial. (2) **The "stops short" was real, not perceptual** — the crossing test `deactivate()`d EVERY boss
bullet the frame it reached `rel=0` (hit/graze/miss alike), so bullets vanished exactly at the player. Now only a
HIT consumes the bullet; graze/miss keep flying to `rel < -12` and whoosh past the camera. The hit/graze
detection is unchanged (still dead-on the player plane) — the bug was purely the visual despawn. (3) `bulletSpeed
34→28` (reaction ≈ `settleGap/speed` ≈ 1.07 s). (4) **Area patterns now anchor to the player** —
`anchorX = clamp(player.x·0.7, ±8)` centres the tunnel weave and the spiral/spiralStream origin on the player's
side of the lane, so you can't park at the edge and ignore them; aimed/fan already tracked you.

**→ Systematize.** (a) **Readability is a render concern, not a collision one.** The visual scale (×2.0 halo,
×0.85 core) is fully decoupled from the hitbox (`bulletRadius`-derived `hitR/grazeR`), so we can make bullets
*look* bigger/brighter for legibility without making them *harder* to dodge — tune the two independently, always.
(b) **"Vanishes at the player" is a despawn-timing smell.** Any projectile that resolves on a plane crossing
should keep rendering a few frames PAST the crossing (only the CONSUMING outcome despawns immediately) or it reads
as stopping short — a reusable rule for the reflect/rider bullets too. (c) **Center-emitted patterns exempt an
edge player by construction;** anchoring the emission origin to a player-biased point is the general fix (bias
< 1.0 so the safe gap/weave still forces a dodge rather than sitting trivially on them).

**→ Leapfrog (innovate).** Core+halo gives a per-role *shape/brightness* vocabulary to layer on top of colour:
reflectable bullets (Increment 2) can pulse the core, surge-time (Increment 3) can desaturate the halo, telegraphs
can pre-flash the core — all without new geometry. And the "anchor area patterns to the player" knob is the seed
of *difficulty by safe-lane placement* (Doremy's principle from the research): later phases can push the anchor
bias toward 1.0 (tighter follow) or offset the gap AWAY from the player, escalating without adding a single
bullet. Verified headless (`tests/boss.mjs` 6 checks) + real-WebGL (`bossboot`, zero console errors with two-layer
bullets live) + `tricount` unchanged (203265); the human judges the new brightness, the whoosh-past, and whether
the anchored patterns feel fair on the preview.

---

### L93 — Boss Increment 2: reflect-on-roll brings the dead parry alive (colour-coded, all-flag ready for the Surge hyper) + ring density reads the shape

**Did / learned.** Wired the already-built-but-never-called `reflectBossBullets()` to the barrel roll: while
`player.rollInvuln > 0` in a fight, nearby **reflectable** bullets flip owner `boss → player`, retarget the boss
and deal `×reflectDamageMult` (2×) on arrival — defence becomes offence, the spend half of the graze→surge loop.
Reflectable = the precision **aimed/fan** shots, and they now spawn a distinct **amber** (`0xffc23c`) so the
player learns by colour which bullets are swat-able (danger red → amber parry-able → cyan reflected: an Ikaruga-
style role palette, layered on the L92 core+halo). Reused the existing roll i-frame window (no new input) and the
existing `emitBoss(reflectable)` flag; added an `all` param to `reflectBossBullets` so Increment 3's Surge hyper
can make EVERY bullet reflectable by passing one boolean. Also acted on playtest feel: bumped tunnel ring density
(`m` 16→26) and depth spacing (0.32→0.38 s) so each ring reads as a solid CIRCLE instead of a loose staggered
cluster — sparse outlines don't read as rings, especially stacked in depth.

**→ Systematize.** (a) **Build the mechanic dead, wire it live later.** `reflectBossBullets` shipped in
Increment 1's scaffold with a unit test but no caller (L89) — so Increment 2 was *just* an import + a 6-line
roll-window call + marking two attacks reflectable. Scaffolding a capability behind a flag (even unused) makes the
increment that activates it tiny and low-risk. (b) **Colour is the teaching channel for counterplay.** When a
mechanic asks the player to treat some bullets differently (parry these, not those), give the class its own colour
*at spawn*, not just an effect on success — the read has to precede the action. (c) **Add the escalation seam as
a parameter, not a fork.** `reflectBossBullets(..., all=false)` means the normal reflect and the Surge-hyper
reflect are the same code path with one boolean — no duplicated logic to drift.

**→ Leapfrog (innovate).** The loop is now whole on both halves: **graze** (skim to charge, L91) → **reflect**
(roll to parry, here). Increment 3 closes it into the hyper: pop Surge → `reflectBossBullets(..., true)` +
bullet-time + double rider fire, so "roll through the storm reflecting everything into the boss" becomes the
earned ~3-surges-to-kill climax the test enforces. And the amber/red/cyan palette + the `all` flag are exactly the
knobs a second boss (or a phase-3 escalation) will re-mix — e.g. a boss whose *tunnel* is reflectable, or a phase
where nothing is parry-able. Verified: `tests/boss.mjs` (7 checks incl. reflect flips owner, deals 2×, plain
bullets immune, `all=true` swats anything) + `bossboot` real-WebGL zero-error with amber bullets live + `tricount`
unchanged (203265); the human judges the parry timing window (`reflectWindow 4.5`) and whether amber reads clearly
on the preview.

---

### L94 — Boss juice pass: clean arena, death embers, perfect/normal parry with an escalating chime, graze dopamine, +HP

**Did / learned.** A batch of playtest-driven feel work on the encounter. (1) **Clean arena** — during a boss,
`spawnAhead` now lays NOTHING (rings/embers/orbs/hazards) and a `bossStart` listener wipes existing collectibles,
so the fight is the whole show. Generation still advances every frame (ensure runs, then we return), so there's
no post-boss backlog spike and the seed stays byte-identical. (2) **Death reward** = the big score bonus PLUS a
haul of embers (`game.embersRun += defeatEmbers`, banked normally) + a gold ember-burst. (3) **Perfect vs normal
parry** — `reflectBossBullets` classifies each swat by the bullet's `rel` at reflect time (≤ `perfectParryRel` =
perfect), applies a bigger damage mult, and returns `{total, perfect}`; the controller announces once per roll
(`rollParried` flag), climbs a **perfect-parry streak**, and rings a pentatonic chime that ladders with the streak
(the perfect-phase chime pattern reused). (4) **Graze feedback** — a soft, very short, quiet shimmer whose pitch
climbs with a decaying `grazeStreak`; deliberately tiny (`vol 0.03`, `dur 0.045`) so a dense stream of grazes
*blends into a sparkle* rather than a machine-gun rattle. (5) **+HP** 130→240 because reflect damage was killing
the boss too fast; the rider-chip-only path still wins in ~40s (headless kill went 31s→50s, well under the 100s
test cap). Streaks (graze/parry/perfect-parry) all reset on a bullet hit — the risk/reward line.

**→ Systematize.** (a) **"Clean arena" is the same overlay contract as suppression, taken to its limit:** don't
special-case *what* to keep — keep nothing, and clear the field once on entry. Advancing generation without
spawning (ensure-then-return) is the trick that avoids a backlog when the mode ends; reuse it for any
"pause the world" mode. (b) **Timing tiers belong in the detector, not the caller.** Perfect-vs-normal is decided
inside `reflectBossBullets` (it owns each bullet's `rel`) and surfaced as counts; the controller just reacts. Same
shape as perfect-ring/perfect-phase — the resolver classifies, the caller celebrates. (c) **Frequency dictates
sound budget:** a per-event SFX that can fire many times per second must be short + quiet + streak-pitched so it
*accumulates* pleasantly; a rare event (perfect parry) can be loud and melodic. Design the envelope to the event's
rate. (d) **Announce-once-per-gesture:** a continuous effect (reflect fires every roll frame) needs a latch
(`rollParried`) so the popup/streak/chime fire once per gesture while the mechanical effect stays per-frame.

**→ Leapfrog (innovate).** Graze→charge, roll→**perfect** parry (now with its own streak + rising melody), death
→ embers: the encounter now has its *own* progression economy distinct from the run, which is exactly what a
**Boss Rush mode** (Increment 5) rewards — chain bosses, bank the ember hauls, carry the parry streak. The
graze/parry streak counters are also the raw material for **feats** ("10-perfect-parry chain", "no-hit boss",
"surge-kill"). Next is Increment 3 (the Surge hyper: bullet-time + double rider fire + `reflectBossBullets(all)`),
after which the graze→surge→reflect-everything climax is complete. Verified: `tests/boss.mjs` (7 checks incl.
perfect-parry classification + 2× normal damage) + `bossboot` real-WebGL zero-error (clean arena + death embers +
graze sfx live) + `tricount` unchanged (203265); the human judges the parry chime, graze sparkle, arena
cleanliness and the new pacing on the preview.

---

### L95 — Grazeability is geometry (small rings + wider band), a live graze counter, and the post-arena "blank world" cursor fix

**Did / learned.** Three playtest fixes. (1) **Rings were ungrazeable** — a radius-7 ring has a big dead-safe
interior, so flying the centre never came near a bullet. Fix is geometric: shrank the tunnel ring radius to
**3.7** (now *smaller than* the graze radius) and widened the graze band (`grazeScale 2.2→3.0` → grazeR ≈ 4.15,
band ≈ [1.29, 4.15]). Now flying the centre of a ring skims the WHOLE ring (every bullet ~3.7 away, inside the
band), and drifting off-centre brings the near edge into the hit radius — the ring became a graze corridor
instead of a hoop with a hole. (2) **Live GRAZE counter** — a boss-only HUD chip (reuses the `.chain` layout,
graze-green) that ticks `game.grazesRun` up in real time and pops on each skim, so the reward is visible and
constant grazing is encouraged. (3) **The "blank world for a few hundred m" after a boss** was a generator-cursor
bug: `spawnAhead` kept calling `ensure()` during the fight (advancing the cursor ~2600 m) but spawned nothing, so
when the fight ended the cursor was far ahead and `ensure` had nothing new to lay until the player caught up. Fix:
a `levelGen.resume(dist)` that reseats the cursor (`prev`, `generatedUntil`) to the player and drops transient
corridor state, fired from a new `bossEnd` event → the course simply continues fresh ahead. No backfill spike, no
empty stretch (probed: after `resume(3000)` the next rings start at ~3098, not 1000).

**→ Systematize.** (a) **A mechanic's viability is often a geometry constraint, not a tuning nudge.** "Graze the
ring" is only possible when `ringRadius < grazeR`; state the relationship and set the numbers to satisfy it,
rather than nudging one value and hoping. The reusable rule: for a shape to be *grazeable from inside*, its inner
clearance must be under the graze band; for it to *threaten*, its wall must be able to reach the hit radius. (b)
**A stateful stream cursor that gets advanced-without-consuming needs an explicit resume/reseat**, or the mode
that suppressed output leaves a hole. Any "pause the spawns but keep time moving" mode (boss, cutscene, safe zone)
should pair suppression with a `resume(here)` on exit — don't let the producer silently run ahead of the
consumer. (c) **Reuse a HUD atom by class, not by fork:** the graze chip is `.chain` + a colour override + a
distinct data source — new readout, zero new layout/animation code.

**→ Leapfrog (innovate).** The graze counter is the first piece of a **boss-local scoreboard** (grazes, parries,
perfect-parries, no-hit) that a results/【feats】pass can total into medals — the encounter now generates its own
stats stream. And `resume(dist)` generalises the overlay contract (L91/L94) into a clean **enter-suppress /
exit-resume** lifecycle that any future scripted set-piece (escort, chase, bonus room) can reuse verbatim.
Verified: `tests/boss.mjs` (7 checks) + `bossboot` real-WebGL zero-error (graze HUD builds, live) + a level-gen
probe (resume generates ahead, no backfill) + `tricount` unchanged (203265); the human judges on the preview
whether small rings graze well, the counter feels good, and the post-boss transition is seamless.

---

### L96 — Boss readability: telegraph (warning + directional danger), a world-space notched health bar, and DEPTH cues (loom + parry-pulse + hitbox reticle)

**Did / learned.** Four legibility additions so the fight isn't abrupt or ambiguous. (1) **Telegraph** — a
dramatic `ui.bossWarning(name, dir, duration)` overlay (flashing "⚠ WARNING ⚠" + boss name + "INCOMING — BEHIND/
LEFT/RIGHT") plus a **directional red danger glow** on that screen edge (a vignette for 'behind', an edge gradient
for a side), held across the warn + approach beats so the player can clear the space before the boss arrives.
Direction is derived from the boss's `approachFrom`/spawn offset. (2) **Health bar** built INTO the boss model
(`bossModel.setHealth(frac)`): a dark bg + a left-anchored fill (scaled via a wrapper group so `scale.x = frac`
grows from the left) floating above the boss on its front face — so it faces the player for free (the group
already faces the player) with **no per-frame billboard** — plus **phase-threshold notches** placed from
`def.phases` (`x = -W/2 + atFrac·W`). Depth-test-off + high render order keeps it legible over the body. (3)
**Depth cues** (the "how far is that bullet / when do I parry" gap): a boss bullet **LOOMS** — its render scale
ramps up over the last ~7 m of approach (`prox = 1 + (7-rel)/7·0.8`), decoupled from its hitbox; and a reflectable
bullet **PULSES** (`sin(clock·20)`) once it's inside the parry window, signalling "swat now". (4) A **graze/hit
reticle** — faint additive rings around the dragon at the graze radius (green) and hit radius (red), shown only
during a fight, giving a constant spatial reference for "close enough to graze" vs "about to be hit".

**→ Systematize.** (a) **Attach status UI to the entity in its own local space when the entity already faces the
camera** — the health bar needs no billboard because it rides the boss group's front face; parent to the thing
that already has the orientation you want instead of recomputing it. (b) **Visual scale is a free readability
channel because it's decoupled from collision** (reaffirming L92): looming/pulsing communicate depth + timing
without touching `hitR`, so you can crank the *read* without changing the *difficulty*. (c) **Draw the invisible
rule.** When players can't feel a threshold (graze band, parry window, hitbox), render it — a faint reticle turns
an abstract radius into a spatial affordance; the same trick applies to any tuned-but-hidden gameplay constant.
(d) **Telegraph = name + direction + a spatial cue**, not just text; the directional danger glow tells the player
*where*, which plain banner text can't.

**→ Leapfrog (innovate).** The health bar + notches make **phase transitions legible**, which sets up
phase-specific spectacle (a palette/attack shift the player can now anticipate as the fill nears a notch). The
reticle + loom + pulse are a reusable **danmaku readability kit** any future boss/pattern inherits — and the
parry-pulse is the exact hook to make the Surge hyper (Increment 3) unmistakable (pulse ALL bullets when
`feverActive`, since they all become reflectable). Verified: `tests/boss.mjs` (7 checks; model 756→764 tris with
the bar, dissolve still fades it) + `bossboot` real-WebGL zero-error (bar/reticle/warning live) + `tricount`
unchanged (203265); the human judges whether the warning reads in time, the bar/notches are clear, and the loom/
reticle resolve the depth confusion on the preview.

---

### L97 — Depth via ground shadows + time-to-impact flare (not looming); bar reveal-on-settle; DANGER-from-below telegraph; post-boss grace band

**Did / learned.** Player-directed refinements (some sourced from a parallel design chat). (1) **The loom read as
confusing depth — replaced it with two better cues.** *Ground shadows:* a third bullet `InstancedMesh` drops a
soft dark disc on the floor (`y≈0.4`, `renderOrder −1`, depthTest-off) under every bullet — two rings that overlap
in view sit at different floor distances, so their shadow-circles separate and the floor grid becomes an absolute
depth reference (a shadow sliding under the dragon = that bullet is at your plane). *Time-to-impact flare:* the
halo colour warms toward white over the last ~0.3 s (`tti = rel/|vrel|`), so the bullet that reaches you FIRST
flares first — "which hits me" is a colour read; reflectable bullets flare bright in the parry window (the parry
cue). Both are pure render (decoupled from the hitbox). (2) **Health bar reveal-on-settle** — it looked janky
flying past during the approach, so it's now hidden until the boss settles in front, then **fills 0→full** over
0.8 s right before the rider opens fire (`setHealthBarVisible` + a `hpRevealT` lerp; `damageBoss` yields to the
flourish). (3) **Telegraph moved the read to the bottom** — dropped the hard-to-see "INCOMING — dir" line;
warning stays top, and a big foreboding **DANGER** now rises from the bottom edge (where the boss emerges from
behind), reinforced by the directional edge-glow. (4) **Post-boss grace band** — for `postGrace` (450 m) after a
kill, `spawnAhead` lays rings + orbs/embers only, **no hazards or set-pieces**, so the run eases back instead of
slamming into a wall of obstacles the instant the boss dies.

**→ Systematize.** (a) **Depth is communicated by a reference the eye already trusts, not by size.** Looming asks
the player to infer distance from scale (ambiguous with many bullets); a *ground shadow* projects onto the floor
grid — an absolute, shared ruler — and *colour-warming* converts "distance" into an ordinal "who's first" read.
When a spatial cue confuses, anchor it to an existing frame (the floor) or recode it into a different perceptual
channel (colour), rather than amplifying the ambiguous one. (b) **Reveal status UI on state-entry, not on
spawn** — a bar/label attached to a moving entity should materialise when the entity reaches its *stable* pose,
or it reads as jank during transit; gate the reveal on the phase transition. (c) **Telegraph where the threat
appears** — put the danger cue at the screen location the thing emerges from (bottom = from behind), so the
overlay doubles as a spatial instruction. (d) **Ease-in bands after a spike:** any hard mode→normal transition
wants a short reward-only grace so the difficulty curve doesn't step-discontinuity.

**→ Leapfrog (innovate).** The shadow mesh is a reusable **floor-projection layer** — it could also anchor the
reflected bullets' return path or a boss's ground-slam AoE. The flare's colour-warming is a general
"priority/ordering" channel (nearest-first) that a dense phase-3 pattern will lean on hard. And the grace band +
`resume()` complete a clean **enter(suppress) → exit(resume + ease-in)** overlay lifecycle that Boss Rush and any
scripted set-piece inherit. Verified: `tests/boss.mjs` (7 checks, model 764 tris) + `bossboot` real-WebGL
zero-error (shadows/flare/bar-reveal/DANGER live) + `tricount` unchanged (203265); the human judges whether the
shadows resolve overlapping-ring depth, the flare reads as time-to-impact, and the bar reveal + DANGER feel right
on the preview.

---

### L98 — Directional DANGER (stripes at the entry corner), reflect rebalanced (a parry ≠ a phase), and a real defeat fanfare

**Did / learned.** Three tuning/feel fixes. (1) **The DANGER telegraph was centred → moved it to WHERE the boss
enters.** The controller derives a `dir` from `approachFrom` + the spawn X (`side`→left/right edge; `behind`→
bottomLeft/bottomRight corner) and the overlay + a bed of **animated diagonal hazard stripes** (a masked
`repeating-linear-gradient` scrolling inward) anchor there, with a matching corner/edge glow — so the danger reads
as "clear THIS space", not just "something's coming". (2) **Reflect was wildly overtuned** — a roll swats *several*
amber bullets at once, so at 2×/2.7× per bullet one parry cleared an 80-hp phase. Cut to **0.55× / 0.8×**
(perfect still "slightly more"): reflecting ~3 bullets now chips ~30, a meaningful bonus on top of the rider
chip, not a phase-delete. Key realization: **per-bullet damage must be sized to the MAX bullets a single gesture
can affect**, not to one bullet. (3) **Defeat sound was a generic sting** — added `sfx.bossDefeat()`, a real
fanfare (low victory boom + rising two-octave major arpeggio blooming into a shimmering chord) for the dopamine
payoff.

**→ Systematize.** (a) **A telegraph is a spatial instruction — place it at the threat's origin.** Position +
inward-scrolling stripes turn "danger" from a label into a "move out of here" arrow; derive the anchor from the
same spawn data that drives the entity's motion so they can't disagree. (b) **Balance AoE/multi-target abilities
by their fan-out, not a single hit.** When one input (a roll) can hit N targets (N amber bullets), the per-target
number must assume the worst-case N or it trivializes; the reflect bug was a per-bullet mult tuned as if only one
bullet reflected. (c) **Reward-event audio should scale its production to the achievement's rarity** (L94): a
per-frame graze is a tiny tick, a once-per-fight defeat earns a full multi-second fanfare.

**→ Leapfrog (innovate).** The directional-stripe overlay is a reusable **"threat from here" primitive** — the
same anchor+stripes could flag an incoming ground-slam edge, a laser-lance column, or an off-screen add. And with
reflect now a *supplement* rather than a *delete*, the damage economy has clean headroom for the Surge hyper
(Increment 3): pop Surge → all bullets reflectable + bullet-time, so a burst of parries becomes the burst-DPS
window, without the baseline parry already doing that job. Verified: `tests/boss.mjs` (7 checks; reflect-damage
assertion reads the config, still green at 0.55×) + `bossboot` real-WebGL zero-error (stripes + defeat fanfare
live) + `tricount` unchanged (203265); the human judges the directional read, the new reflect pacing, and the
fanfare on the preview.

---

### L99 — Increment 3: the Surge hyper closes the loop (graze→charge→pop→reflect-everything); the whole boss fight is a self-contained economy

**Did / learned.** Wired Dragon Surge into the boss as the **hyper/overdrive** — the *spend* climax the graze→
charge loop was building toward. While `feverActive` in a boss: (1) **bullet-time** — `updateBossBullets` gets a
`dt × surgeBulletTime (0.5)` so bullets slow to half speed while the player still steers full-speed (classic
witch-time; a window to weave and parry); (2) **double rider fire** — the rider interval × `surgeRiderMult (0.5)`;
(3) **all-bullets-reflectable** — the reflect-during-roll call passes `all = feverActive`, so `reflectBossBullets`
swats ANY bullet, not just the amber ones (the `all` flag scaffolded in L93 — activating it was one argument);
plus every bullet now flares in the parry window (`game.feverActive` in the flare test) so the read matches the
rule, and a "⚡ DRAGON SURGE ⚡ — REFLECT ANYTHING" callout fires on trigger. Surge is **graze-charged** (L91) and,
in a boss, the meter **empties when it ends** (`game.inBoss` guard on the fever-timeout) so each hyper is
re-earned — no permanent overdrive. Net: the full arc is now live — *graze the storm to charge → pop Surge → roll
through slowed bullets reflecting everything into the boss* — and the headless lifecycle even shows it (immortal
test player's grazing auto-fires Surge, double-rider drops the kill 50s→42s).

**→ Systematize.** (a) **Scaffold the escalation as a parameter, activate it with an argument.** Increments 1–2
built `reflectBossBullets(..., all=false)` and a `feverActive` charge source; Increment 3 was mostly
`all = game.feverActive` + two `× multiplier`s — because the seams were pre-cut, the climax was ~15 lines, not a
system. Design earlier increments to leave the *next* one a one-liner. (b) **A hyper is a set of orthogonal
multipliers on existing systems** (time-scale on bullet update, interval-scale on the emitter, a boolean on the
parry filter), not a new mode — so it composes with everything and can't desync. (c) **Earn-and-spend meters need
a reset on spend-end**, gated to the context that owns them (`inBoss`), or the resource leaks into permanence.

**→ Leapfrog (innovate).** The boss fight is now a **complete self-contained economy** — charge (graze),
supplement (parry), climax (surge hyper), payoff (embers + fanfare), ease-out (grace band) — decoupled from the
run's own systems yet reusing them (the surge meter, the roll, the rider). That's exactly the substrate a **Boss
Rush mode** (Increment 5) monetises: chain encounters, carry the streaks, bank the hauls. And the increment
pattern (scaffold-then-activate) is the template for **more bosses** (Increment 4): a new `bossDefs` entry +
`bossModel` recipe re-mixes the *same* verbs (graze/parry/surge) with different attack data + palette — near-zero
new systems. Verified: `tests/boss.mjs` (8 checks; kill 50s→42s shows Surge live in-sim) + `bossboot` real-WebGL
zero-error with Surge forced (bullet-time + double-rider + all-reflect + flare) + `tricount` unchanged (203265);
the human judges the bullet-time feel, the reflect-everything power fantasy, and the re-earn pacing on the preview.

---

### L100 — The armour gate: manual Surge + per-phase shield fused with a graze-bait flood (survival-by-grazing IS the break); + telegraph/tuning fixes

**Did / learned.** A player-directed redesign (backed by a design note) that turns the boss into a proper
armour-gate loop, plus a raft of feel fixes. **The gate:** each phase floor (`atFrac` 1.0/0.66/0.33) now raises a
SHIELD — chip/reflect do **nothing** while shielded (they *ping* off: quiet clang + spark), and the ONLY way
through is a **Dragon Surge unleash**. Surge is now **manual in a boss** (Space / a 2nd-finger tap; auto-fire
removed from `bulletGraze`, gated so the normal run is unchanged), charged by grazing — so the vision's "3 surges
to kill" is *literally* true: three shields, three surge-breaks. **The fusion (the key insight):** while
shielded the boss **floods graze-bait** — small rings centred on the player and weaving (radius 3.6 < grazeR 4.15
→ the whole ring grazes) with a threadable lane — so *surviving by grazing tight IS what charges the surge that
breaks the armour*. Fleeing earns zero graze → zero surge → no progress, but you're never killed for it: the
pressure is progress-denial, not death. **Feel fixes bundled:** warning now flashes ALONE first (boss hidden
behind during `warn`, 2.0s) then clears as it flies in; DANGER moved to where it actually emerges (`behind` →
bottom-centre, not a wrong corner); grace band 450→220 m; chip (rider 3→1.4) + reflect (2×/2.7× → 0.35/0.55×)
cut hard so you can't brute-force; **bullet-time removed** (the sudden slow read as jarring); and a **dramatic
Surge aura** (pulsing pink energy shell + crackling lightning bolts on the dragon) so an active Surge is
unmistakable. Shield bubble + "⛨ SHIELDED — UNLEASH DRAGON SURGE" banner + "SURGE READY" prompt telegraph the
mechanic hard.

**→ Systematize.** (a) **Decouple survival from progress to teach aggression by economy, not tutorial.** Camping
survives but can't win because the only progress currency (surge) is minted only by the risky act (grazing), and
the boss *hands you* the bullets to graze during the gate. The reusable pattern: gate progress behind a resource
that's earned only by engaging, and spawn the engagement material at the gate. (b) **A "hard gate" needs its own
supply of the gate currency** — a shield that only Surge breaks is a soft-lock unless the shielded state also
floods grazeable bullets; always pair a resource-gate with an in-context source of that resource. (c)
**Auto→manual is a one-line policy flip at the charge site**, but the whole downstream design (save it for the
shield) depends on it — decide agency early. (d) **Telegraph a rule change with a rule-change *sound*** (chip
pinging off) as much as a visual; the clang says "stop doing that" faster than a banner.

**→ Leapfrog (innovate).** The design note's **soft-gate** variant (chip trickles + a ramping nastier attack
while shielded) is now a one-flag alternative on the same machinery — a per-boss difficulty knob. And the
armour+graze-bait beat is a self-contained "survive-to-advance" module that a **second boss** re-skins with a
different bait pattern (a laser corridor, a rose bloom) — the verbs (graze/charge/surge-break) stay, the bullets
change. Verified: `tests/boss.mjs` (8 checks; lifecycle now drives manual surge to burst 3 shields → kill,
asserting `surges >= 3` + `sawShield`) + `bossboot` real-WebGL zero-error (aura/shield/manual-surge live) +
`tricount` unchanged (203265, boss model 764→844 with shield+aura additions counted only in-model); the human
judges the armour telegraph, the graze-bait weave, the surge aura and the new pacing on the preview.

---

### L101 — Danmaku readability: per-ring colour banding + solid (occluding) bullets over additive bloom; and boss 1 as a gentle tutorial

**Did / learned.** Two fixes for "I can't read successive rings" (they merged into a white blowout). (1) **Solid
bullets, not additive blobs.** The bullet is now a SOLID, depth-writing core (per-bullet `instanceColor`,
opaque, occludes its neighbours → a dense ring reads as *countable diamonds*), with the additive halo demoted to a
subtle glow (opacity 0.4, r×2.0→1.5) so overlaps no longer sum to pure white. Additive blending *adds* light where
bullets pile up — that's the washout; solid cores with depth-write keep their edges. (2) **Per-ring colour
banding.** Successive rings cycle a warm-danger palette (red→magenta→orange, clear of the amber-parry / cyan-
reflected role colours) via `instanceColor` — so three concentric waves read as "red, then magenta, then orange"
instead of one mesh. Threaded through `emitBoss(...,color)`/`fireRing(...,color)`; tunnel bands per ring index,
graze-bait per volley. Zero new draw calls (bullets are already one `InstancedMesh`). (3) **Boss 1 = tutorial.**
VOIDMAW now introduces one verb per phase with slow, readable patterns (P1 `aimed` only → dodge+parry; P2 `+fan`;
P3 `+tunnel`), drops the complex `spiral`/`spiralStream` to future bosses, slows the cadence, thins the graze-bait,
and shows teaching banners ("ROLL INTO AMBER SHOTS TO PARRY", "GRAZE THE RINGS → UNLEASH SURGE"). A `tutorial`
flag on the def gates the coaching.

**→ Systematize.** (a) **Additive is for sparse highlights, not dense fields.** Any system where identical
emitters can stack (bullets, particles, embers) should default to solid + depth-write for the readable body and
reserve additive for a thin accent — or dense states blow out. (b) **Encode set-membership as hue when instances
overlap.** When the player must distinguish members of an overlapping group (which wave, which lane, which team),
band them by colour on the existing per-instance channel — it's free on an InstancedMesh and it's the canonical
danmaku answer to wave-merging. Keep the band palette disjoint from any *role* colours already in use. (c)
**Difficulty is a per-entity data dial, not a global.** The `tutorial` flag + a simpler `phases`/`cadence` make
boss 1 gentle without touching the engine; boss N re-mixes the same verbs with harder data. Teach the vocabulary
on the first instance, assume it on the rest.

**→ Leapfrog (innovate).** Banding is now a reusable **wave-identity channel** — a future boss could band by
THREAT TYPE (parryable vs not) or by TIMING (which ring hits first), turning colour into a second information
axis. And the tutorial/complexity split is the seam for a **boss roster with a difficulty curve**: VOIDMAW teaches,
boss 2 assumes parry + adds spiral, boss 3 adds a new pattern — each a `bossDefs` entry, near-zero new code (the
Increment-4/5 payoff). Verified: `tests/boss.mjs` (8 checks; core+halo instanceColor set, tutorial phases valid)
+ `bossboot` real-WebGL zero-error (banded solid bullets live) + `tricount` unchanged (203265); the human judges
whether the bands separate the waves and the tutorial pacing teaches cleanly on the preview.

### L102 — Colour-blind-safe danmaku: round white-centre discs + brightness/size banding (hue is not a channel you own)

**Did / learned.** The human is red-green colour-blind, and the L101 hue-banding (red→magenta→orange) was
useless to them — three "reds". Also the solid diamonds still read as hard shards over the fiery boss. Two moves
fixed both. (1) **Round bullets = a soft radial disc**, not geometry: one procedural `CanvasTexture` (white core →
soft edge → transparent) on a camera-facing `PlaneGeometry` quad, drawn in TWO layers off the same slot — a NORMAL-
blend COLOUR body (`instanceColor` tint, `s.r*2.7`) and a smaller universal-WHITE CORE on top (`s.r*1.35`, its own
InstancedMesh, no instanceColor). Every bullet now has a white centre everyone sees regardless of hue — the danmaku
"white-heart" read. Normal blend (not additive) means dense fields don't blow to white. (2) **Band by BRIGHTNESS +
SIZE, not hue.** `BAND = [{c,s}]`: light-big / deep-small / mid-mid. Luminance and size survive any colour vision;
hue is a bonus for those who have it. Threaded a `sizeMult` through `emitBoss`/`fireRing` so the collision radius
tracks the visual size (`hitRi = s.r + R×bulletHitScale` per-bullet) — banding stays FAIR, a big bullet isn't a
free hit. Also dropped `bulletDamage` 18→13 (human was dying): a clean hit stings, a graze-heavy run survives.

**→ Systematize.** (a) **Never encode required information in HUE ALONE** — ~8% of male players can't decode it.
Any set-membership/threat/timing cue must ALSO ride a channel everyone shares: LUMINANCE, SIZE, SHAPE, or MOTION.
Hue is the redundant top layer, not the load-bearing one. The white-core-on-coloured-body pattern gives a universal
read (the core) plus an enhanced read (the hue) for free. (b) **When visual size varies per instance, the hitbox
must vary with it** — derive collision radius from the same `r`/`sizeMult` that drives the matrix scale, or the game
lies about its hitboxes. (c) **Round soft sprites > hard geometry for dense readable fields**: a radial-gradient
quad is one 64² canvas texture, one draw call per layer, and reads as a countable dot at any density; occlusion is
handled by the opaque-ish core, not by depth-writing geometry.

**→ Leapfrog (innovate).** The two-layer disc is now a reusable **accessible-projectile primitive** — body carries
identity (hue/brightness/size), core carries the universal "there is a bullet here" read, and either layer can host
a NEW channel (pulse the core for parryable, square the body for unblockable) without touching collision. This is
the seam for a full **accessibility pass**: the same body/core split extends to obstacles and pickups, and a
colour-blind-mode toggle could swap the BAND palette for a luminance-only ramp with zero engine change. Verified:
`tests/boss.mjs` (8 checks) + `bossboot` real-WebGL zero-error (round banded bullets live) + `smoke` +
`tricount` unchanged (203265, 0 over budget); the human judges on the preview whether the white cores stay
countable and the brightness/size bands separate the waves without hue.

### L103 — Graze-bait rhythm: clusters + breaks, not a non-stop stream (a missed entry needs a way back in)

**Did / learned.** The shielded graze-bait fired one weaving ring every 0.42s forever. If the player got shut out of
a lane (out of position when a ring arrived), re-entering meant crossing live bullets — you had to take a hit to get
back to grazing. Fixed by giving the flood a RHYTHM: a **cluster** of 3–4 rings to thread, then a **break** (~1.4s,
no new rings) that's a clear reposition window, then the next cluster. State is a tiny 2-var machine (`baitLeft`
counts down the cluster; `baitResting` gates the break); primed on shield-raise (`resting=true, left=0` so the next
tick opens a FULL first cluster) and reset on init. Verified: `tests/boss.mjs` (8) + `bossboot` zero-error.

**→ Systematize.** **A survival/attrition mechanic must include a recovery beat.** Any "stay in the danger to make
progress" loop (graze-to-charge, hold-the-zone, sustained-DPS) needs a periodic clear window or a single mistake
compounds into a death spiral — the player can't recover without taking more damage. Encode the rhythm as
cluster-then-break, and prime the state so the first cycle is full-length (a common off-by-one: an unprimed
countdown fires one item then immediately "completes").

**→ Leapfrog (innovate).** The cluster/break cadence is now a tunable difficulty axis independent of bullet count:
boss 1 rests long (forgiving), a later boss shortens the break or overlaps clusters. It's also the seam for a
telegraph — flash the maw on the break→cluster edge so the next wave is readable, turning the recovery window into
an anticipation beat.

### L104 — The Surge unleash as a cinematic: charge → mouth-beam → shield shatter, with looping "state" audio

**Did / learned.** The Surge unleash was a one-frame `feverActive = true` + a generic particle burst — it read as a cheap
placeholder next to the game's richer effects. Rebuilt it as a short cinematic driven by a tiny state machine in the
controller (`surgeSeq = {phase:'charge'|'beam', t}`): (1) a **charge** wind-up (~0.5s) where a bright orb swells + flickers
at the dragon's mouth and the camera shake ramps; (2) at the strike, a **beam** lances mouth→boss — two additive cylinders
(white core + wide coloured glow) inside a `shaft` sub-group oriented each frame via `quaternion.setFromUnitVectors(UP, dir)`
and stretched with `scale.y = length`, a muzzle flare at the origin and an impact bloom at the boss; (3) the shield **shatters**
into real flying shards (pre-built tetrahedra on the bubble surface, flung along their own radial + spin, fading over 0.7s in
`bossModel.tick`), not just a puff. The beam ORIGIN is a forward+up offset of the player position (the snout ≈1.3m ahead) —
no need to plumb the private dragon head node across modules; from the chase cam it reads as "from the mouth".

Crucially the shield-break now fires at the **moment of impact** (end of charge), not when the button is pressed — the button
starts the sequence, the beam lands the hit. This is the general lesson: **a big action should be a short sequence, and its
gameplay effect should resolve at the visual climax, not at the input.**

Audio got the same "make it feel real" pass: procedural Web-Audio is one-shots by default, but *states* want **loops**. Added
start/stop loop handles modeled on the music engine's `windSource` (a long-lived source + LFO, torn down on stop): a soft
enticing **ready hum** (tremolo'd fifth) that pulls the player to unleash while the meter is full, and an electric **crackle**
that sizzles for the whole Surge. Loops are driven by **edge-detecting** the ready/active booleans in the controller
(`wasReady`/`wasSurge`) — start on the rising edge, stop on the falling edge, and also stop them in every teardown path
(`!active`, `resetBoss`) so a loop can never leak past a fight. One-shots (`surgeBeam`, `shieldShatter`) fire at the climax.

**→ Systematize.** (a) **Effects are sequences, not toggles.** Any headline verb (surge, phase, death) deserves a small
`{phase, t}` state machine so it can wind up → climax → settle; resolve the mechanical effect at the climax frame.
(b) **Loop vs one-shot is the core audio decision.** A momentary event is a one-shot; a *state* (ready, active, charging)
is a loop with start/stop handles — and every loop needs guaranteed teardown on every exit path (edge-detect + stop in the
cleanup branches), or it leaks. (c) **Don't plumb private nodes across modules for FX origins** — a world-space offset of a
public transform (player position → snout) reads correctly from the fixed chase cam and keeps modules decoupled.
(d) **Orient-a-shaft:** `setFromUnitVectors(localAxis, worldDir)` + midpoint position + `scale.(axis)=length` points/stretches
any cylinder/box between two moving points — reuse for beams, tethers, links.

**→ Leapfrog (innovate).** The charge→beam→impact rig is a reusable **"channel a big attack" primitive**: a rider ultimate, a
boss's own beam, or a chargeable player shot all reduce to the same three-phase sequence with different origin/target/colour.
The loop-audio handles generalize to any sustained state (boost hum, low-health heartbeat, tractor beam). Balance rode along:
graze-bait now rests **1.8s** between clusters and the tutorial tunnel is **3–4** gently-weaving rings (not 5–6) so the tail of
boss 1 stays readable. Verified: `tests/boss.mjs` (8; lifecycle now drives the real charge→strike→shatter path headless) +
`bossboot` real-WebGL zero-error + `smoke` + `tricount` 203265 (boss model 844→900 tris for the shards, still far under budget).
The human judges the charge/beam/shatter motion and the hum/crackle mix on the preview.

### L105 — Boss graphical polish: it read "cheap" because it was DARK, SMALL and lost against a bloom-heavy world (+ a headless-clock gotcha)

**Did / learned.** Screenshotting the real engine (boot → spawnBoss → capture) against the world/dragon made the gap
obvious: the world is ACES + UnrealBloom + god-rays + fresnel-rim dragon, and the boss was a near-black icosahedron
(`emissive 0.9`) with a flat additive shell — at its ~30m hold it shrank to a dark speck and vanished into the horizon
city silhouette. Three fixes, all matching the house idiom: (1) **Fresnel energy shell** — packaged the `rimLight.js`
onBeforeCompile trick as a standalone `makeEnergyShell()` ShaderMaterial (glows at grazing angles, clear face-on) and
wrapped the body in a bright shell + soft halo, so the silhouette always reads against any background and the bloom
catches it. (2) **Brighter + layered** — core `emissiveIntensity` 0.9→1.5, a molten additive inner core pulsing inside
the faceted shell (contained-energy read). (3) **Bigger + framed** — `BASE_SCALE 1.5` (dissolve now multiplies from
this base, not 1) and `fightHeight 11→13` so it floats above the horizon city on open sky; `bossHitRadius 3.2→4.2` to
match the larger body. The Surge aura got the same treatment: the flat pink additive disc → a fresnel orb + molten core.
Verified by capture: the boss now renders as a bright, spiky, glowing construct with a readable maw (was invisible).

**The gotcha that ate an hour:** in the headless Playwright browser the boss looked "stuck in warn" — `warnT` counted
down at ~0.125/0.4s, ~8× slower than real time, because a headless (no-display) browser THROTTLES requestAnimationFrame,
so the game clock crawls and a 2s warn + 2.6s approach never elapse within a normal wait. It is NOT a bug — real
hardware runs at 60fps (the user's own gameplay feedback proves the fight works). Lesson: **a headless capture harness
is for VISUALS (does the frame look right), not for TIMED STATE TRANSITIONS** (did the state machine advance) — the
wall-clock↔game-clock ratio is unreliable there. To reach a late state, either wait many× longer, drive the state
directly, or trust the headless *logic* test (`boss.mjs`, which uses a fixed-dt loop and DOES reach fight→death).

**→ Systematize.** (a) **Anything that must read in a bloom/ACES world needs emissive + a fresnel rim, not just a dark
PBR body** — bloom rewards bright silhouettes and buries dark small ones. Package the rim as a reusable material so every
new entity (boss, hazard, pickup) inherits the house look for free. (b) **Judge look by capturing the real pipeline** —
a `scene.traverse` for a `userData.__isBoss` marker + `position.project(camera)` tells you exactly where a thing lands
on screen and how big; guessing from code does not. (c) **Bake a base transform and have derived animations compose
from it** (`group.scale = BASE * dissolveSpread`), or the scale-up silently fights the death scatter. (d) ShaderMaterial
opacity lives in a **uniform**, so a material-`.opacity` dissolve loop must special-case `uniforms.uOpacity` or shells
won't fade on death.

**→ Leapfrog (innovate).** `makeEnergyShell` is now the game's **energy-surface primitive** — boss shell/halo, Surge
aura, and (next) the beam glow, shield bubble, and reflected-bullet trails can all share one fresnel material with
per-instance colour/power/strength, giving the whole boss layer a coherent "contained energy" language for near-zero
cost. The capture-and-project debug seam (`__isBoss` + `bossState()`) is the reusable rig for any future "does the new
thing actually look right on screen" pass. Verified: `boss.mjs` (8), `bossboot` zero-error, `smoke`, `tricount` 203265
(boss model 844→1260 tris for the shells/core, far under the 6000 budget); the human judges the final look/scale live.

### L106 — The Surge aura must FRAME the dragon, not envelop it (a player-owned effect can't occlude the player)

**Did / learned.** The Surge aura was an enveloping fresnel ORB (+ an additive inner core) centred on the dragon. With
the bloom pass filling the interior it rendered as a solid pink ball that COMPLETELY hid the dragon and buried the
danmaku — during Surge (when every bullet is parryable and reading them matters MOST) the player literally couldn't see
their dragon or the shots. A real player photo made it unmistakable. Redid it as a HALO: two thin camera-facing glow
HOOPS (torus rings) around the dragon with a hollow centre, plus lightning arcs that live in the ring band (~2.3 out)
and point radially OUTWARD — so the centre where the dragon + incoming bullets are stays completely clear. The
"empowered" signal now comes from things that DON'T occlude: the postfx fever screen-wash, the dragon's own emissive
flare, and the framing halo + crackle. Verified by capture: the dragon is fully visible inside the hoops.

**→ Systematize.** **An effect attached to a gameplay-critical object must not occlude that object or its threats.**
Anything centred on the player (aura, buff, shield, status) has to be built as a NON-occluding frame — a halo/ring, a
ground marker, an outline/rim, upward wisps, or a screen-space vignette — never a filled volume over the thing you're
steering. Rule of thumb: reserve filled/opaque volumes for ENEMIES and pickups (you WANT them to grab the eye);
give the PLAYER edge-only, hollow, or off-body treatments. And remember additive + bloom turns a "faint transparent
shell" into a solid glowing mass — test player-centred FX with bloom ON, at the density they'll actually hit.

**→ Leapfrog (innovate).** The halo-frame is the reusable pattern for every player-centred state (boost, low-health,
shield, power-up): swap colour/spin/'# of hoops' per state and it reads instantly without ever hiding the hero. It also
freed the enveloping-orb idea for its correct owner — the BOSS shield bubble, where occluding the enemy is fine (even
desirable). Verified: `boss.mjs` (8), `bossboot` zero-error, `tricount` 203265 (aura swapped orb→rings, tris flat).
The human confirms the live read (dragon + bullets visible through Surge) on the preview.

### L107 — Boss HUD legibility pass: one notification slot, platform-correct prompts, and letting player-owned UI get out of the way

**Did / learned.** A batch of player-driven readability fixes for the boss overlay: (1) **One callout slot, queued.**
Surge fired TWO overlapping banners ("DRAGON SURGE" from feverStart + "DRAGON SURGE / REFLECT ANYTHING" from an
on('surge') handler) — illegible. Collapsed all boss callouts (WARNING aside) into a single bottom-centre `#boss-note`
driven by a QUEUE: one message at a time, each held longer (~3s), the next only shown after the previous fades. Kept
the useful instruction ("REFLECT ANYTHING") and dropped the redundant title. (2) **Same slot doubles as the persistent
SURGE-READY prompt** — when the queue is idle it shows the prompt; a timed callout interrupts it and it returns after.
This is the "one thing at a time" guarantee: a shared slot can't overlap itself. (3) **Platform-correct input labels** —
the prompt reads "TAP" on a coarse-pointer/touch device and "SPACE" on a keyboard one (detected once via
`maxTouchPoints`/`pointer: coarse`); shipping "SPACE / TAP" to everyone is lazy and wrong on both. (4) **Player-owned UI
gets out of the way in the mode where it's meaningless** — the stamina bar (speed is locked / unlimited during a boss)
FADES out on boss start (same 0.6s transition it fades back in on boss end), and a **focus circle draws ON in its place**
(a RingGeometry whose `thetaLength` sweeps 0→2π — the same "fills from nothing" language as the HP bar), then draws OFF
at the end. (5) Grace tuned: `postGrace 220→50`, Surge is GRANTED on the kill so the hyper carries into the grace band,
and guaranteed speed-boost pickups spawn there so that momentum doesn't fizzle. (6) Removed the aura's redundant outer
"depth" ring — one clean hoop.

**→ Systematize.** (a) **A HUD needs ONE owner per screen region; route every transient callout through a single queued
slot** so two events can never render on top of each other — overlap, not content, is what kills legibility. (b) **Input
prompts must name the ACTUAL control for the device** — detect touch vs keyboard once and template the verb; never
hardcode a platform's key. (c) **Mode-specific UI should animate in/out with the mode**, not blink — a bar that's
meaningless this mode fades away (and reverses on exit with the identical transition), and if something replaces it, give
the replacement a "draws on from nothing" reveal (thetaLength sweep / fill) so the swap reads as intentional. (d) **After
a climactic beat, hand the player momentum, don't strip it** — carry the earned buff across the transition and seed
pickups so the high continues instead of snapping back to baseline.

**→ Leapfrog (innovate).** The queued single-slot notifier + the fade/draw-on swap are reusable for every mode
transition (canyon, gauntlet, rush): one `note()` API with a priority/duration, one "vitals swap" helper that fades the
normal HUD and draws on the mode's own indicator. The thetaLength-sweep ring is a general "radial progress/reveal"
primitive (charge meters, cooldowns, capture rings). Verified: `boss.mjs` (8), `bossboot` real-WebGL zero-error, `smoke`,
`tricount` 203265; a capture confirms the stamina bar gone + focus circle drawn + single hoop + dragon visible. The human
judges the callout timing/readability and the fade/draw-on feel live.
