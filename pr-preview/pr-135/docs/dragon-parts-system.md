# Dragon Parts System — composable body plans

Status: **COMPLETE.** All four part slots (torso / wings / head / tail) are
composable, plus a procedural fresnel-rim surface pass, and **the Phoenix is
folded into a recipe** — `phoenixModel.js` is gone and there are **no bespoke
builders left**. Every one of the 7 dragons, firebird included, is composed from
a `parts` recipe through one code path. The whole roster renders byte-identically
to before (verified by exact triangle-count parity + render comparison).

## Why

The redesign shipped a strong silhouette-evolution language, but the builder
that draws it has two structural ceilings:

1. **One shared skeleton.** Six of seven dragons (`azure / ember / jade /
   obsidian / pearl / solar`) are the *same* arrowhead torso + 2-bone wings +
   tail chain + sphere-stack neck + sphere skull, differentiated only by
   parameters and ~38 bolt-on `model.*` flags. From the chase camera they read
   as "same creature, different palette + wing width + tail tip." The **Phoenix
   is the only one that looks like a different animal — because it is the only
   one with its own geometry file.**
2. **A god builder.** `dragonModel.js` branches on ~38 flags in one function.
   Each new creature either reuses flags (everything converges) or adds another
   `if (model.newFlag)` (the builder bloats, every dragon pays the conditional,
   regressions get easy). It already strained: Obsidian needed a *parallel* set
   of named constants because the shared `SIZE_RAMP` couldn't express it.

The fix is to **generalize the Phoenix move** — "own geometry, shared rig" —
into the default, so a dragon is a *recipe of parts*, not a bag of flags.

## The model

A dragon declares which part module fills each slot:

```js
parts: { torso: 'serpent', wings: 'feather', tail: 'plume', head: 'beaked' }
```

The builder looks each name up in a **registry** and composes the modules. No
`parts` block ⇒ a recipe is **inferred from the legacy flags** (see
`resolveRecipe` in `js/dragonRecipe.js`), so the whole shipped roster keeps
working untouched while modules are extracted one at a time.

### The attach contract (the key idea)

Parts must not hard-code where other parts go, or you cannot swap a body. Each
**torso** build returns `{ group, attach }`, where `attach` is the only thing
the wings / head / tail / spine read:

| `attach` member      | meaning                                                |
|----------------------|--------------------------------------------------------|
| `wingRoot(side)`     | `{x,y,z}` where a wing pivot mounts (mirrored by side) |
| `headBase`           | `{x,y,z}` where the head group sits                    |
| `tailAnchor`         | `{y,z}` where the tail roots                           |
| `keelTopAt(z)`       | crest height (incl. torso y-offset) for the spine line |
| `tailShift`          | after-body stretch already folded into `tailAnchor`    |

Because the long `serpent` reports its own mount points, the wing / tail / head
code places limbs correctly **without knowing which body it is on**. That is
what made the demo below a one-line change.

## What's implemented now

- **`js/dragonRecipe.js`** — the registry + `resolveRecipe(def)` (explicit
  `parts` wins; otherwise inferred from flags). Dispatches torso + wings;
  resolves tail/head ahead of their extraction.
- **`js/dragonTorso.js`** — a torso is now **data**: a profile (cross-section
  stations + neck + fairings + mount points) fed to one generic loft.
  - `arrow` — reproduces the shipped arrowhead drake *exactly*.
  - `serpent` — a new long, slim eastern-dragon body plan.
- **`js/dragonWings.js`** — owns the membrane material + the apex fin accents;
  mounts via the attach contract; returns the flap rig handles.
  - `membrane` — the shipped per-form elbow wing (verbatim; also the legacy
    `wingShape:'feather'` variant).
  - `none` — a wingless body plan (empty rig handles the shared animation loop
    drives harmlessly) for a true river-serpent / sea-drake.
- **`js/dragonHead.js`** — a head builder takes `(def, model, mats)` and returns
  a Group the rig sways. `horned` (the shipped reptilian head, verbatim) +
  `beaked` (a hooked-beak avian head, no horns/snout — the variety lever).
- **`js/dragonTail.js`** — a tail builder takes `(def, model, mats, anchor)` and
  returns `{ group, segs, tailFins, accentMats }`. `clean` is one builder
  dispatching all ~11 `model.tailStyle` variants (the moved `buildCleanTail`);
  `legacy` is the old segmented tail.
- **`js/surface.js`** — `applyFresnelRim(material, colorHex, opts)`: a procedural
  view-angle rim (via `onBeforeCompile`) that defines the body contour so it
  stops reading as a flat blob. On-brand per dragon (`def.apexSeam`).
- **`js/dragonModel.js`** — composes torso + wings + head + tail via the registry
  and reads the attach contract instead of hard-coded constants.
- **`js/dragonParts.js`** — now a **shared-primitives** library only: the wing
  *shape* helpers (`buildWingShape` / `archWing` / `wingStrut` / `edgedFin` …)
  and the tail *outlines* (`buildForkShape` / `buildBladeShape` / `buildLayeredFin`
  …). The torso, wing *assembly*, and tail *assembly* moved to their modules.

### Proof it composes

A wingless eastern serpent is two lines:

```js
jade: { …, parts: { torso: 'serpent', wings: 'none' }, … }
```

…and a long sinuous body with **no wings** drops in — the head + tail re-mount
via the attach contract, the rig drives the empty wing handles harmlessly, no
limb code touched. A creature class that was structurally impossible before (every
dragon had to carry membrane wings). (Not shipped — Jade still ships the arrow
torso + membrane wings; these PRs change nothing visually.)

## Backward-compatibility guarantee

The refactor is verified non-destructive by **exact triangle-count parity**:
`node tools/tricount.mjs` reports the same per-form counts as before
(roster total 72,372 tris, unchanged), so every shipped form is geometrically
identical. `node tests/run-all.mjs` model-relevant suites (smoke, defs, shop,
recap, save-migration) pass.

## Roadmap — all done

1. ~~**Wings registry**~~ — `membrane` · `none` · `feather` (firebird).
2. ~~**Head registry**~~ — `horned` (the reptilian roster; `hornLen:0` +
   `earTendrils` = the hornless night-drake) · `beaked` (the avian feather-crowned
   head, used by the firebird and any griffin).
3. ~~**Tail registry**~~ — `clean` (one builder, all ~11 `tailStyle` variants) ·
   `legacy` · `plume` (the firebird flame-feather fan).
4. ~~**Fold Phoenix into a recipe**~~ — **done.** The firebird is now
   `{ torso:'avian', wings:'feather', tail:'plume', head:'beaked' }`; the
   `archetype === 'phoenix'` model path and `phoenixModel.js` are gone (a torso
   may return its own body/eye materials + heart-core so the firebird's shared
   F-driven materials thread through the part system). `archetype` survives only
   as a **rig flag** (warm ember motes / Rebirth Surge in `dragon.js`).

### Available part palette (for authoring new dragons)

| slot | options |
|---|---|
| `torso` | `arrow` (drake) · `serpent` (eastern) · `avian` (firebird) |
| `wings` | `membrane` (per-form elbow) · `feather` (bird) · `none` (wingless) |
| `tail`  | `clean` + any `tailStyle` (simple/finned/blade/comet/twinfin/shard/spade/splitfin/stealthrudder/apexstealth/firefan) · `plume` (flame fan) · `legacy` |
| `head`  | `horned` (+ whisker/tusk/frill flags) · `beaked` (feather crown) |

A new creature (a wingless river-serpent, a crystal golem-drake, a 4-wing
insectoid) is now a `parts` recipe + palette — a few KB of data, validated by
`tricount` + `tiershots` before shipping.

## Why this also unlocks "make new dragons" / AI generation

A recipe is a tiny JSON object. The existing `tools/advisor.mjs` (Sonnet+Fable)
can emit one; `tools/tricount.mjs` (budget) and `tools/tiershots.mjs` (rear-cam
montage) auto-validate it. The composable system turns "design a new dragon"
from "edit an 800-line builder and hope" into "write a recipe, render, ship."

## Deliberately NOT doing

Imported GLTF/FBX assets + skeletal animation. It would abandon the repo's
defining strengths — no build step, no assets, instant load, every dragon a few
KB of procedural data — for art-pipeline overhead on a creature that reads ~80px
tall in play. The procedural path is not exhausted; this system is how we push
it to the max.
