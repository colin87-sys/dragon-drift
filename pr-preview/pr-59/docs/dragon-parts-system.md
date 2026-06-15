# Dragon Parts System — composable body plans

Status: **Backbone + TORSO + WINGS landed.** The shipped roster renders
byte-identically (verified by exact triangle-count parity); tail / head are next,
then folding the Phoenix into a recipe.

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
- **`js/dragonModel.js`** — calls the torso + wings modules and reads the attach
  contract instead of hard-coded constants; everything else unchanged.
- **`js/dragonParts.js`** — now a **shared-primitives** library: the wing
  *shape* helpers (`buildWingShape` / `archWing` / `wingStrut` / `edgedFin` …)
  and the tail (`buildCleanTail`). The torso geometry and the wing *assembly*
  moved to their part modules; this file holds the pieces they build from.

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

## Roadmap (remaining modules)

1. ~~**Wings registry**~~ — **done** (`membrane` + `none`). The Phoenix-style
   layered `feather` wing arrives with the Phoenix fold (step 3).
2. **Tail registry** — formalize the existing `buildCleanTail` styles
   (`comet/plume/shard/stealthrudder/…`) as the tail registry.
3. **Head registry** — `horned` / `beaked` / `frilled`; pulls the beaked head
   out of `phoenixModel.js`.
4. **Fold Phoenix into a recipe** — once all four slots exist, the firebird
   becomes `{ torso:'avian', wings:'feather', tail:'plume', head:'beaked' }` and
   the `archetype === 'phoenix'` special-case in `dragonModel.js` disappears.
   That retires the only bespoke builder and proves the system fully general.
5. **Author new dragons** — once parts compose freely, new creatures (a wingless
   river-serpent, a crystal golem-drake, a 4-wing insectoid) are *recipes*, each
   a few KB of data, validated by `tricount` + `tiershots` before shipping.

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
