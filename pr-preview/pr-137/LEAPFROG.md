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
