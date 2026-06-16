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
