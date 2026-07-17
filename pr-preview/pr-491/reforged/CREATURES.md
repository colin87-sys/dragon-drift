# Creatures — the blueprint grammar

A creature in Dragon Drift is **declared as data, not built in code.** This file is
the closed vocabulary of that blueprint: the knobs the procedural hull generator
already exposes, named and grouped. It is generated against
[`js/creatureGrammar.js`](./js/creatureGrammar.js) — that module is the single
source of truth; this file is the human-readable companion.

## The one rule

> **Author the blueprint, never the builders.**

To add or change a creature, edit its declaration in [`js/dragons.js`](./js/dragons.js).
Do **not** add a new `if (model.someFlag)` branch in `dragonModel.js` or hand-sculpt
geometry — if a creature needs something the grammar can't express, add a *knob* (a
registered part builder, surface shader, or surface layer) so the next creature
inherits it. This is the whole Phase-3 payoff: a creature is describable, validatable,
and — eventually — AI-promptable.

Every creature is validated against this grammar by
[`js/validateCreatureBlueprint.js`](./js/validateCreatureBlueprint.js), enforced
headlessly in [`tests/blueprint.mjs`](./tests/blueprint.mjs). A misspelled builder or
shader fails at author time with an actionable message ("did you mean…?"), not as a
silent bad render. Numeric ranges are **advisory warnings** (the documented ranges are
harvested from the shipped roster and may be conservative); structural mistakes (bad
builder / shader / layer names, wrong types, malformed shingle/layer specs) are
**blocking errors**.

## The vocabulary (by group)

The enums below (builders, shaders, layers) are resolved **live** against the
registries, so they never drift from what's actually buildable. Run the validator to
see the current valid names for your tree.

### `recipe` — the body plan
Which part module builds each region. Optional: a creature that declares no `parts`
has its recipe inferred from legacy flags (`resolveRecipe`), so the old roster is
byte-identical.

| Knob | Kind | Notes |
|---|---|---|
| `parts.torso` | builder (torso) | e.g. `arrow`, `nightFuryTorso`, `avian`, `serpent` |
| `parts.wings` | builder (wings) | e.g. `membrane`, `nightFuryWings`, `feather`, `none` |
| `parts.head` | builder (head) | e.g. `horned`, `draconic`, `beaked`, `none` |
| `parts.tail` | builder (tail) | e.g. `clean`, `legacy`, `none` |

### `surface` — shaders + scale/plate relief
| Knob | Kind | Notes |
|---|---|---|
| `parts.surface.shader` | shader name list | `cellularScales`, `cellularScalesNormal`, `iridescence`, `subsurface`/`membraneSSS` — composed over the body material |
| `parts.shingle` | shingle-run list | overlapping cupped cards merged to one mesh; `{ count[], zRange, len, wid, cup, tilt, yLift, edge … }` |

### `surfaceLayers` — dorsal/flank decoration
Declarative decoration layers. A creature may declare `parts.surfaceLayers` as an
ordered list (`['backCrest', { type: 'glowSeams' }]`), **or** let them be inferred from
the legacy flags below (same order/conditions → byte-identical roster). Registered
layers: `spineGlowLine`, `dorsalChevrons`, `backCrest`, `scaleRidge`, `dorsalSail`,
`backSpines`, `armorPlates`, `glowSeams`, `bladeFins`.

| Legacy flag (model/forms) | Inferred layer |
|---|---|
| `spineGlow > 0` (and no `dorsalGlowCount`) | `spineGlowLine` |
| `dorsalGlowCount > 0` | `dorsalChevrons` (suppresses the spine line) |
| `backCrest` | `backCrest` |
| `ridgeCount > 0` | `scaleRidge` |
| `dorsal` | `dorsalSail` |
| `backSpines` | `backSpines` |
| `armorPlates` | `armorPlates` |
| `glowSeams` | `glowSeams` |
| `bladeFins` | `bladeFins` |

### `hull` — proportions (`model.*`)
`scale`, `wingScale`, `tailSegments`, `neckSegments`, `ridgeCount`, `hornLen`,
`hornPairs`, `shoulderWidthScale`, `wingRootScale`, `headScale`, `eyeScale`. Several
may also appear per-form in `forms[]`.

### `wing` — shape + membrane (`model.*`)
`wingOpacity`, `wingPanelGlow`, `wingBillow`, `wingArmLeadChord`, `wingWristMedial`,
`wingFingerCurve`, `wingFingerSplay`, `wingFingerBulge`, `wingFingerRadius`.

### `motion` — feel (`model.*`)
`flapBias`, `flapAmp`, and `flapProfile` (per-creature wingbeat character:
`lagElbow`, `lagWrist`, `elbowAmp`, `foldAmp`, plus surge/bank knobs — see
[`js/dragonWingFlap.js`](./js/dragonWingFlap.js)). Per-form strength/speed scale by
`formLevel` (Hatchling → Eternal).

### `material` — finish (`model.*`)
`bodyMetalness`, `bodyRoughness`, `bodyEnvIntensity`, `rimBodyMul`, `scaleSize`,
`scaleRelief`. (Defaults = the semi-gloss roster look; opt into matte organic hide.)

## Worked example — `toothless` (the Night Fury hero)

The full continuous-hull creature, annotated field-by-field:

```js
toothless: {
  name: 'Toothless', title: 'Night Fury',
  rarity: 'SSR', maxRarity: 'SSSR', cost: 2600,

  // material — matte organic hide (no metal sheen, low sky reflection, body rim off)
  bodyMetalness: 0.0, bodyRoughness: 0.88, bodyEnvIntensity: 0.05,
  scaleSize: 3.0, scaleRelief: 0.9, rimBodyMul: 0.0,

  // recipe — body + wings are ONE smooth hull; head/tail are part of the loft
  // (grown from the hull), so the bolted modules are OFF ('none').
  parts: {
    torso: 'nightFuryTorso', head: 'none', wings: 'nightFuryWings', tail: 'none',
    surface: { shader: ['cellularScalesNormal'] },   // living-hide micro-relief
  },

  stats: { speed: 1.12, handling: 1.18, drain: 0.82, regen: 1.2 },

  model: {
    // hull
    scale: 0.86, wingScale: 0.9, tailSegments: 9, neckSegments: 5, ridgeCount: 0,
    shoulderWidthScale: 1.2, wingRootScale: 1.4,
    // motion
    flapBias: 1.08, flapAmp: 0.82,
    // wing anatomy (the bat-arm fan)
    wingArmLeadChord: 0.38, wingWristMedial: 0.84,
    wingArmRadius: 0.115, wingForearmRadius: 0.09, …
  },

  forms: [ /* 4 cumulative life-stages: proportions, colours, per-form flags */ ],
}
```

`ridgeCount: 0` and `head/tail: 'none'` mean the inferred `surfaceLayers` list is
**empty** — Toothless's silhouette comes entirely from its hull profile and wings, with
no bolted decoration. A "spikier" creature would simply set `ridgeCount`/`backSpines`/
`dorsalGlowCount`, and the layers appear with zero new code.

## Migrating the roster (separate follow-up)

The roster still mixes the faceted `sweepProfile` (legacy dragons) with the smooth
`sweepProfileSmooth` (the night-fury hull). Flipping every creature onto the smooth path
so the organism is the **default** is a deliberate, per-creature follow-up — each
migration clones the `tests/nightfury.mjs` weld + seam-normal gates — and is **out of
scope** for the blueprint-layer work this file documents. Author the blueprint; migrate
behind the byte-identical coexistence guard, one creature at a time.
