# LOST LAGOON — GROUND-UP REDESIGN HANDOFF ("Jungle Drowned Temple")

> **Read this whole file first, then the docs it points to.** This is the authoritative brief for redesigning
> Biome 0's prop vocabulary. The composition/lighting FRAMEWORK is built and shippable; the PROP FORMS failed
> a legibility test and are being replaced. Your job: build a NEW, premium, unmistakably-tropical prop roster
> on top of the existing framework, gated by Fable at a hard 4.2/5.

---

## 0. Before you write any code
Read, in order: `CLAUDE.md` + `LEAPFROG.md` (THE RULE — one lesson file per change), then
`reforged/BIOME-DESIGN.md`, `reforged/AAA-PIPELINE.md` (the premium light+polish+convergence playbook),
`reforged/DRAGON-DESIGN.md` (the shape-agnostic "make it read RICH not a stick" method — it applies to props),
and the recent lessons `leapfrog/lessons/2026-07-16-graphics-*.md` (composite bake, world-aspect-under-scale,
composition-engine-unwired, in-context-closeup-camera-seam, prop-hazard-silhouette-firewall).
Branch: **`claude/caldera-biome-overhaul-1hybmf`** (PR #466).

## 1. Why this redesign exists (the failure to not repeat)
The old Lost Lagoon lineup — a drowned Greco-Roman **rotunda**, a colonnade **arcade**, tumbled **wrackstone**,
a fig-on-masonry **rootbastion**, **lilyraft** pads — was gated by Fable through composition (2.0→**4.3**) and
value (→3.9). Then the owner looked at the props and said: *"how are these lost-lagoon props? I don't see how
it makes sense… they look janky and generic."* **Root cause: the forms were too ABSTRACT to read as any place
(a pale mound reads as a rock, not a temple), and there was almost no living tropical nature — it was "five
kinds of gray ruin."** The theme lived in the design docs, never on the geometry. Do not repeat this: **every
prop must READ AS ITS CONCEPT at cruise distance, and the biome must show its living nature, not just ruins.**

## 2. The locked identity: JUNGLE DROWNED TEMPLE
SE-Asian tropical lagoon at **golden hour**: **Ha Long Bay / El Nido limestone karst** + **Angkor Wat / Ta
Prohm jungle-swallowed temple ruins**. Reference DNA: **NatGeo × Ghost of Tsushima × BotW**. It is a LOST
HIDDEN WATERY PARADISE — a drowned temple-civilization being reclaimed by a living jungle-lagoon: serene, warm,
alive. **Both halves must be legible: LIVING NATURE (karst, mangrove, water plants) AND a DROWNED CIVILIZATION
(a legible temple culture, not abstract rubble).**

### Non-negotiable requirements
- **AAA / premium or it's a fail.** Legible silhouettes at distance + up close; real value structure; no lumps.
- **UNIQUE vs every other biome.** Others own: Emberfall Caldera (black basalt + magma), Sunset Glacier
  (luminous blue/bleached ICE), Aurora Shallows / Lumen Mire (bioluminescent night, biolume caps, starlit
  crystal, aurora), a desert Wastes (obelisks/columns). **The Lagoon's turf is WARM GOLDEN-HOUR TROPICAL:
  green jungle + honey limestone + jade tidewater + gilt sunset.** Never drift toward another biome's palette.
- **Do fresh research** on the identity (karst, mangrove root systems, Angkor/Ta Prohm silhouettes, tropical
  golden-hour water) before building — Fable's synthesized plan (§7) is the start, not the ceiling.

## 3. What is DONE and must be KEPT (the framework — do not rip out)
These are committed and green; the new props plug into them:
- **The composition engine is now wired for the Lagoon** (`writeMatrix`, `bi === 0` branch, ~env.js:1944) with
  `lagoonComp()` (~env.js:1823): a raised-cosine breath↔congregation rhythm (squared for WIDE open-water
  breaths, 3 island-groups/biome) + arrival-park beat + `oneSide` backdrop gate + `sizeClass` island hierarchy.
  **This was the single biggest fix — it turned a "hoarder field" into composed archipelagos with open water.**
- **Legacy migration done:** old generic ruins (tower/column/archruin/slab/dome) retired from biome 0 via the
  `lagoonOld` constant (env.js:437-438). New props go on `lagoonNew` (`[0]`).
- **Value pass:** the tide-ladder bake (`bakeTideLadder`, ~env.js:312) gained a vertical value gradient
  (bright sunlit crown → dark wet base); `bakeLilyFoliage` (~env.js:334) keys foliage off face normal.
- **Capture tools** (all headless, `reforged-captures/`): `tools/_lagoon.mjs` (distance sweep, health-pinned so
  a clip can't game-over the frame), `tools/_lagoonclose.mjs` (UP-CLOSE in the real biome via the
  **cameraCtl.update seam** — NOT a renderer.render override, which renders black; see the lesson),
  `tools/_lagooncomp.mjs` (natural real-time flythrough, the dragon flying by — the view that ultimately
  matters). Run capture sweeps SEQUENTIALLY (4 parallel Chromium boots time out on the weak runner).

## 4. What is being REPLACED
The 5 lagoon archetype **build() geometries** (rotunda/lilyraft/wrackstone/rootbastion/arcade, env.js ~1077-1360)
and their identities. Keep the SPAWN SCAFFOLD pattern (each archetype's `step`/`comp`/`arrivalPark`/`oneSide`/
`sizeClass`/`place`/FOAM_CFG), just point it at the new forms. `biomes.js` BIOMES[0].props is a vestigial doc
mirror — update it. Coexist → prove a hero → migrate; never break the shipped roster mid-flight.

## 5. Technical constraints (hard)
- 100% procedural, vanilla Three.js r160, no assets, 60fps on weak mobile.
- **≤150 triangles per archetype** (enforced by `tools/envcount.mjs`; grandfathering is legacy-only — a new prop
  over 150 is a bug). ConeGeometry costs 3×segments tris. Price every primitive.
- Props place off-lane both sides with an **anisotropic (r,h,r)** instance scale + random Y rotation. **A
  feature's UNIT aspect is NOT its world aspect** — design proportion-critical openings at world aspect and
  divide back (see the world-aspect lesson). Must read from any yaw. Stand PLUMB (`tilt:0`) if tide-laddered
  (the jade waterline is a level water stain — an instance tilt makes it physically impossible).
- **Coloring = per-face VERTEX-COLOR bakes on merged flat-shaded geometry** (no textures). 2 material slots per
  prop: `matIndex 0` stone (takes the bakes) + `mat 1` **gilt** (warm emissive gold — withheld interior glow
  only, sparingly). The composite per-part bake TAG system holds two bakes in one draw group (`bake:'lily'|'root'`
  merge-then-bake). You may add bake stops/hues but stay inside this system.
- **Determinism (RNG-order discipline):** placement consumes a shared `rnd` stream per-archetype in key order —
  **append new archetypes at the END** of `ARCHETYPES`; a mid-table insert shifts every later archetype and
  breaks `tests/gold-determinism.mjs`. The composition park/scale is PURE (no rnd) and applied AFTER the rotY
  init, so it's determinism-safe. Run `tests/gold-determinism.mjs` (5 checks), `tests/biomecycle.mjs` (11),
  `tools/envcount.mjs`, `tools/propclearance.mjs` after changes.
- `?hero=<a,b,c>` debug seam pins a comma-list of archetypes in biome 0 (default-off, determinism-unsafe) for
  isolating a prop or a hero+mid+commons trio in the capture tools.

## 6. The gate process (how "done" is decided)
- **Fable (art director) at a hard 4.2/5 floor.** Spawn via the Agent tool with `model: "fable"`. Pre-assess
  each prop BEFORE building (silhouette + firewall check), then checkpoint HARSHLY after each build round; a
  prop ships only at ≥4.2. Give Fable the up-close AND the natural-flythrough frames (the shipping view).
- **Silhouette firewall:** scenery must never rhyme with a HAZARD skin. The Lagoon hazard is the Sinking Gates
  (arches/pillars rising+sinking) — no free-standing lone arch or clean vertical pillar in the scenery.
- **Three judges:** machine numbers (envcount/determinism/clearance) · harsh Fable ≥4.2 · owner feel on the PR
  preview (motion/legibility). The owner's "does it read as the concept" is the final gate — that is what failed
  last time.

---

## 7. FABLE'S SYNTHESIZED PLAN (creative direction + roster + build order)

<!-- FABLE_PLAN -->
_(pending — inserted from Fable's synthesis)_

---

## 8. Suggested first moves for the new session
1. Read §0 docs + skim the failed props' `build()` to learn the primitive/bake vocabulary.
2. Confirm/extend Fable's plan (§7) with your own reference research; lock the palette + roster.
3. Build the vertical NATURAL landmark first (the karst spire, per plan) — it's the highest-leverage change and
   proves the horizon-breaking silhouette + the new palette. Fable-gate it.
4. Then the drowned-temple HERO, then mid/commons/backdrop — coexisting with the current roster, migrating each
   in as it passes 4.2, so the biome never breaks.
5. Add a lesson file per meaningful change (THE RULE). Keep determinism/envcount green every commit.
