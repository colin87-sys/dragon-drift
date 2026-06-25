# Dragon Drift — Model Creation Guide

> **What this is.** A complete, concrete reference for how creatures (dragons, mecha, anything)
> are built in Dragon Drift, written so you can hand it to an LLM (ChatGPT) and get back model
> specs that are **actually recreatable** in this engine — real module names, real dials, real
> ranges, the real coordinate system, and the exact spec format to output. Everything here is
> harvested from the live code in `reforged/js/`, not invented.
>
> **Golden rule for whoever reads this (human or AI):** a model in this engine is **DATA + MODULES**,
> not a sculpted mesh. You describe a creature as (1) which part-**modules** build it, (2) numeric
> **dials** for proportions/finish, (3) a **cross-section list** that defines the body silhouette,
> (4) **decoration layers**, and (5) a 4-step **form** progression. If you think in those terms, the
> model is buildable. If you think "import this 3D model," it is not (see §8).

---

## 0. The one-paragraph mental model

A creature is a **blueprint object** (`DRAGONS[key]` in `js/dragons.js`) fed to four swappable
**part builders** — torso, wings, head, tail — chosen from registries. The body is **procedural
geometry**: a smooth surface **lofted through a list of cross-sections** (you sculpt the silhouette by
editing that list). Mecha detail is **assembled from a kit of primitives** (panels, struts, thrusters,
legs). Proportions and finish are **numeric dials** with documented ranges. Surface decoration is a
**declarative layer list**. The creature **evolves across 4 forms** (Hatchling→Eternal). The whole
thing must read as a clean **silhouette from the rear chase camera** (and a rear-3/4 during banks),
and hold **60fps on weak mobile** (a hard triangle budget).

---

## 1. Coordinate system, camera & units — the cheat sheet

| Thing | Value |
|---|---|
| **Forward / head** | **−Z** |
| **Back / tail** | **+Z** |
| **Up** | **+Y** |
| **Right** | **+X** |
| **Body axis** | lofted along **Z** (head at −Z, tail at +Z) |
| **Torso baseline Y** | ~0.2 world units (bodies sit near the origin) |
| **Scale feel** | a mature dragon's body core ≈ 3 units long; full wingspan ≈ 7–11 units |
| **Primary camera** | **chase cam**: behind + slightly above, looking forward (`cameraController.js`: pos ≈ (0, 3.6, 12.3), lookAt ≈ (0, 1, −16)) |
| **Secondary cameras** | **rear-3/4** during a hard bank, a **3/4** in the shop, a near-rear when you crash |
| **Performance** | 60fps on weak mobile; per-model triangle budgets enforced by `tools/tricount.mjs`; geometry detail scales via `seg()` LOD |

**Design implication:** the player almost always sees the creature **from behind**. Design the
**rear silhouette** first. Spread wings **occlude the upper body/chest** from straight-behind — the
chest reads in the **3/4 / shop / bank** views, while the **waist, hips, tail, and legs** read even
from dead astern. Width (the `X` profile) is what the rear cam reads most.

---

## 2. The build pipeline (how the pieces connect)

```
js/dragons.js            DRAGONS[key] = the blueprint (parts + model + forms + colors)
        │
js/ascension.js          ascendedDef(def, tier) → resolves the blueprint for one of 4 forms
        │
js/dragonRecipe.js       part REGISTRIES (torso/wings/head/tail) + the ATTACH CONTRACT
        │
js/dragonModel.js        buildDragonModel(def) → composes torso + wings + head + tail + layers
        │
js/creatureGrammar.js    the CLOSED vocabulary (every legal dial, with ranges)
js/validateCreatureBlueprint.js   validates a blueprint against the grammar (typos, ranges, bad builders)
```

- **Registries**: each builder self-registers (`registerTorso('seraphHull', …)`), so the menu of parts
  is whatever's registered. The grammar resolves enums **live** from the registries, so it can never
  drift from what's actually buildable.
- **Validation gate**: `tests/blueprint.mjs` runs `validateCreatureBlueprint` over the whole roster —
  catches misspelled builders ("did you mean…"), out-of-range dials, wrong types.

---

## 3. The blueprint anatomy (annotated template)

A creature is one object in `DRAGONS`. Skeleton (real fields, trimmed):

```js
key: {
  name: 'Pearl Seraph', rarity: 'SSR', cost: 5000,
  stats: { speed: 1.0, handling: 1.1, drain: 1.0, regen: 1.0 },

  // 1) RECIPE — which module builds each part (names from the registries in §4).
  parts: {
    torso: 'seraphHull',  wings: 'seraphWing',  head: 'seraphCrownHead',  tail: 'seraphTail',
    surfaceLayers: [ 'spineGlow', 'gorget', … ],   // declarative decoration (see §6)
  },

  // 2) DIALS — proportions, wing shape, motion, material (every legal knob is in §5).
  model: {
    scale: 1.12, wingScale: 0.9, wingChordScale: 1.4,
    tailSegments: 9, neckSegments: 5, hornLen: 1.3, ridgeCount: 12,
    flapBias: 0.9, flapAmp: 0.88,
    bodyMetalness: 0.06, bodyRoughness: 0.58,
    flap: { downFrac: 0.56, downDepth: 1.9, … },   // (Mk II yoke wings) per-creature beat
    // …per-creature builder knobs live here too (e.g. seraph's wing config).
  },

  // 3) COLORS — palette fields read by the builders (common ones below; see existing
  //    dragons for the full set a given builder uses):
  body: 0xF2F0EA, eye: 0x8FEAFF, wingInner: 0xF2F0EA, wingGild: 0xD6AF4A, wingEmissive: 0x88DFFF, horn: 0xFFF3C8,

  // 4) FORMS — 4 cumulative snapshots (Hatchling, Kindled, Radiant, Eternal). Each may
  //    OVERRIDE model dials + decoration for that tier (the creature visibly matures).
  forms: [
    { wingForm: 0, tailStyle: 'simple',  ridgeCount: 10, spineGlow: 0,    crest: 0, scale: 0.46, colors: {…} },
    { wingForm: 1, tailStyle: 'finned',  ridgeCount: 12, spineGlow: 0.3,  crest: 1, scale: 0.68, … },
    { wingForm: 2, tailStyle: 'blade',   ridgeCount: 13, spineGlow: 0.65, crest: 2, scale: 0.85, … },
    { wingForm: 3, tailStyle: 'comet',   ridgeCount: 14, spineGlow: 1.0,           scale: 1.0,  … },
  ],

  // 5) WING SILHOUETTE per form (membrane/feather wings) — see §6.
  wingForms: [ { tips:[[x,y],…], lead:[x,y], scallop:0.22, arc:{ bow, hump, hook } }, … ],
}
```

---

## 4. The MODULE MENU (registered part builders)

Pick one builder per slot. `none` = omit that part. Build a new module only when nothing fits
(flag it explicitly — see §10). Current registry (from `js/`):

### Torso (body plan)
| Name | Style | Notes |
|---|---|---|
| `arrow` | organic | the default lofted drake body (wedge cross-section); data-profile driven |
| `parametricArrow` | organic | **the arrow body as DIAL-ABLE DATA — give the creature its OWN silhouette without a new builder** (see "Shape from data" below). Default = byte-identical to `arrow`. |
| `serpent` | organic | long continuous body, same loft engine as arrow |
| `avian` | organic | firebird body |
| `crystalSerpent` | organic | astral serpent |
| `nightFuryTorso` | organic | smooth Night-Fury loft |
| `hullTorso` | organic | data-driven hull kernel (starters) |
| `unifiedHullTorso` | organic | one continuous skin welded to the wings |
| `organismTorso` | organic | clean-sheet one-skin creature |
| `seraphHull` | organic | Pearl's pearl loft (`loftEllipse` cross-sections) |
| `faceted` / `svjHull` / `svjEngineBay` | **mecha** | hard-edge automotive/mecha fuselage (boxy wedge rings) |

### Wings
| Name | Style | Flaps? |
|---|---|---|
| `membrane`, `curvedMembrane`, `skinnedMembrane`, `skinnedMembraneBridge` | organic skin | yes (rig) |
| `feather` | organic feather cards | yes |
| `seraphWing` | gilded feather-scale rows on a yoke | yes |
| `nightFuryWings`, `hullWings`, `unifiedHull`, `organismWings` | organic variants | yes |
| `hexMembrane` | **mecha** hex delta membrane | yes (rigid-honoring) |
| `svjBladeWing`, `svjJetWing`, `bladeWing` | **mecha** rigid armored blade (1–3 segments) | yes (rig, but rigid panels) |
| `svjFanWing` | **mecha** FAN of 5 blade-quills + glowing membrane | yes (whole fan rides pivot) |
| `sideFins` | lateral vanes | — |
| `none` | no wings | — |

### Head
| Name | Style |
|---|---|
| `horned`, `beaked` | organic (whiskers/tusks/frills via flags) |
| `draconic` | modular house-style dragon head |
| `celestialMask` | regal faceplate |
| `seraphCrownHead` | crown-halo head |
| `bullCrown`, `svjWedgeHead`, `svjDragonHead` | **mecha** angular skulls |
| `none` | no head |

### Tail
| Name | Style |
|---|---|
| `clean` (+ `tailStyle`: simple/finned/blade/comet/plume), `sweptTail`, `plume`, `legacy` | organic |
| `cometWake`, `seraphTail` | glow-trail tails |
| `bladeJet`, `svjArmorTail`, `svjAeroTridentTail`, `svjRear`, `segmentedAeroTail` | **mecha** |
| `none` | no tail |

---

## 5. The DIAL VOCABULARY (the grammar — every legal knob + range)

These are the **only** numeric/flag knobs the validator accepts on `model.*` (and, where
`forms` is noted, per-form in `forms[].*`). **Don't invent knobs outside this list** — a builder
ignores unknown fields, and the validator warns on them. (Source: `js/creatureGrammar.js`.)

**Proportions (`hull`)**
| Knob | Range | Meaning |
|---|---|---|
| `scale` | 0.3–2.5 | overall body size |
| `wingScale` | 0.4–2.2 | wing **span** (independent of body) |
| `wingChordScale` | 0.5–2.2 | wing **front-to-back depth/fullness** (seraphWing) |
| `tailSegments` | 0–16 *(forms)* | segmented-tail count |
| `neckSegments` | 0–12 *(forms)* | neck chain count |
| `ridgeCount` | 0–28 *(forms)* | dorsal ridge count |
| `hornLen` | 0–2.5 *(forms)* | horn length |
| `hornPairs` | 0–4 *(forms)* | horn pair count |
| `shoulderWidthScale` | 0.4–2.2 | shoulder / wing-root breadth |
| `wingRootScale` | 0.4–2.5 | wing-root thickness |
| `headScale` | 0.4–2.2 | head proportion |
| `eyeScale` | 0.3–2.2 | eye proportion |

**Wing shape (`wing`)** — `wingOpacity` 0–1, `wingPanelGlow` 0–1.5, `wingBillow` 0–0.6 (chord cup),
`wingArmLeadChord` 0–1.5, `wingWristMedial` 0–2, `wingFingerCurve` 0–1, `wingFingerSplay` 0–1,
`wingFingerBulge` 0–0.5, `wingFingerRadius` 0–0.3.

**Motion / feel (`motion`)** — `flapBias` 0.4–1.6 (beat phase), `flapAmp` 0.2–1.6 (beat amplitude),
`flapProfile.{lagElbow 0–2, lagWrist 0–3, elbowAmp 0–1.5, foldAmp 0–1.5}`. (Mk II yoke wings also take
a `model.flap{}` block: `downFrac`, `downDepth`, `lag`, `yokeElevDeg`, `curlDeg`, …)

**Material finish (`material`)** — `bodyMetalness` 0–1, `bodyRoughness` 0–1, `bodyEnvIntensity` 0–3,
`rimBodyMul` 0–3 (fresnel rim; 0 kills glare on dark bodies), `scaleSize` 0.5–12 (cell size; lower =
bigger cells), `scaleRelief` 0–2 (scale depth).

**Decoration flags (`surfaceLayers`)** — `spineGlow` 0–1.5, `dorsalGlowCount` 0–28, and booleans
`backCrest`, `dorsal`, `backSpines`, `armorPlates`, `glowSeams`, `bladeFins` (all *forms*-aware).
These INFER into the declarative `parts.surfaceLayers` registry, or you can declare layers directly.

---

## 6. How SHAPES & SILHOUETTES are actually created

### 6a. The body = a loft through cross-sections (THE key idea)
A body is a smooth surface stretched through a **list of rings stacked along Z**. **Editing the ring
list IS sculpting the body.** Two flavors:

- **Elliptical** (`loftEllipse([{ z, rx, ry }])`, e.g. `seraphHull`): each ring is a position `z`
  with **half-width `rx`** (the `X` profile the rear cam sees) and **half-height `ry`**. Example —
  Pearl's hourglass: broaden the chest rings' `rx/ry`, pinch a waist ring's `rx`, add a hip ring:
  ```js
  loftEllipse([
    { z:-1.00, rx:0.06, ry:0.07 },  // nose cap
    { z:-0.45, rx:0.56, ry:0.66 },  // BARREL CHEST (round)
    { z:-0.06, rx:0.60, ry:0.66 },  // shoulder (wing root)
    { z: 0.50, rx:0.24, ry:0.38 },  // PINCHED WAIST
    { z: 0.74, rx:0.37, ry:0.37 },  // HIP flare
    { z: 1.08, rx:0.05, ry:0.06 },  // tail cap
  ])
  ```
- **Profile-station** (`buildTorsoGeometry(profile)`, e.g. `arrow`/`serpent`): each station is
  `[z, halfWidth, keelTop, belly]` — width plus separate top-keel and belly heights (an airfoil
  cross-section: sharp keel on top, rounded belly). `profile.stations` is the editable silhouette.

> **To get ANY body silhouette** (barrel chest, hourglass, hump, pot-belly, slim eel): add/space the
> rings and set their widths/heights. More rings = crisper transitions.

> **DATA-ONLY for the drake family (no new builder):** set `parts.torso:'parametricArrow'` and give the
> creature its **own `profileStations`** ring list (`[z, halfWidth, keelTop, belly]` rows, or `{z,
> halfWidth, keelTop, belly}` objects) right in `dragons.js` — or just nudge the shipped body with
> `model.bodyKnobs` (`shoulderWidth`/`chestScale`/`waistPinch`/`hipFlare`/`bodyLength`/`keelHeightCurve`
> /`sectionPoints`…). The **mounts re-derive off your stations** (wing root rides the shoulder peak;
> head/tail re-anchor), nudge-able via `bodyKnobs.attach`. Default knobs = byte-identical to `arrow`.
> Wings: `wingFormKnobs:[…4…]` (`span/fingerCount/fingerSplay/chordTaper/sweep/scallop/flame/arc`) +
> `wings:'skinnedMembrane'` (folds without self-collision). Tail: `model.tailKnobs`. Worked example:
> `tempest` in `dragons.js`. A brand-new *structure* (legs, bug, novel rig motion) still needs a NEW
> MODULE — flag it per §10.

### 6b. The attach contract (how parts mount)
The torso publishes mount points; wings/head/tail attach through them — they don't know which body
they're on (`js/dragonRecipe.js`, `js/dragonTorso.js`):
`wingRoot(side)→{x,y,z}`, `headBase→{x,y,z}`, `tailAnchor→{y,z}`, `keelTopAt(z)→y` (run a spine/ridges
down the back), `halfWidthAt(z)→x` (sit a surface layer on the flank), `bodyMidY`. **There is no
`legRoot` yet** — legs are currently ad-hoc surface layers (a limitation, see §8/§9).

### 6c. Wings
Span (`wingScale`) and depth (`wingChordScale`) are dials; the per-form **outline** (membrane/feather)
is `wingForms[]` (`tips`, leading edge `lead`, web `scallop`, lift `arc{bow,hump,hook}`). Wings ride a
**flap rig** (yoke→pivot→mid→tip cascade) — but **rigid, non-flapping** wings are fully supported
(mecha blade/fan wings are rigid panels on the rig; set a low `flapAmp` and they read static).

### 6d. The mecha KIT (assembly primitives — `js/mechaKit.js`)
Hard-surface detail is **assembled** from material-agnostic primitives (you inject materials):
`flatTriMesh(tris)` (flat-shaded panel atom), `wedgePanel(pts)` (flat sheet), `frameBar(a,b,th)`
(box strut/spar), `hexPrism` / `spineSegment` (vertebra units, return `{fore,aft,dorsal}` sockets),
`hexGrille`, `ventPlateRow`, `chevronLight`, `diffuserArray`, **`thrusterPod{rOuter,rCore,…}`**
(housing + frame + glowing core, Surge-taggable — your jet/booster), **`mechaLeg{side}`** (piston →
blade → 3-claw foot; currently a **folded tuck** pose), `socket(x,y,z)` (named mount).

### 6e. surfaceLayers (declarative decoration)
`parts.surfaceLayers: [ … ]` stacks dorsal/flank decoration (crests, chevrons, spines, armor plates,
nacelles, thrusters, scale armor) over the body. Order matters; each layer reads the attach contract
to place itself. The legacy boolean flags in §5 infer into this same registry.

### 6f. Forms (the 4-step maturation)
A creature ships **4 discrete snapshots** (not a smooth morph): `forms[0..3]` each override dials +
decoration so the silhouette visibly grows (Hatchling → Kindled → Radiant → Eternal). `wingForms[]`
gives a distinct wing outline per form.

---

## 7. The SILHOUETTE-FIRST workflow & verification tools

Because the camera is fixed behind the creature, we verify by **rendering the silhouette** and
**overlaying it on the concept image** — headless, no browser (`tools/silhouetteCore.mjs`):

- `node tools/silhouette.mjs <key> <view> [--no-wings] [--pose=<phase>]`
  - **views**: `rear` (the chase cam), `threeq` (rear-3/4 — the bank/crash/shop angle), `climb`
    (portrait ascending), `side`, `front`, `top`. `--no-wings` isolates the body; `--pose=downstroke`
    holds a flap phase.
- `node tools/silhouette-overlay.mjs <concept.png> <key> <view> [--debug]` — masks the concept's
  subject, scale-aligns the built silhouette onto it, superimposes a cyan ghost, prints an approximate
  overlap %. (`--debug` dumps the extracted target mask.)
- **Gates** (run before claiming done): `tests/blueprint.mjs` (valid vocabulary), `tools/tricount.mjs`
  (triangle budget), `tests/flapcheck.mjs` (flap-cycle continuity). The **human judges color/material/
  motion on the live PR preview** — the silhouette tool is shape-only (see §8).

**The loop:** spec → build → `silhouette.mjs` (rear + threeq) → `silhouette-overlay.mjs` vs concept →
read the gap (proportion? chord? pose? a module wall?) → tune dials / ring list → repeat.

### 7a. The TRACER — hand Claude the shape instead of describing it (`tools/tracer.html`)
The overlay loop above is **machine → human** (we render, you judge). The **tracer** is the inverse —
**human → machine**: open `tools/tracer.html` in a browser (it's deployed on every PR preview at
`…/reforged/tools/tracer.html`), drop in a concept image, and turn it into editable points/curves you can
verify by eye, then hand the resulting JSON to Claude as the silhouette spec. No more "move it left / up /
down" prompt ping-pong.

- **Auto-trace ("magic wand"):** click the subject → it flood-fills, isolates the largest blob, walks the
  outline (Moore tracing) and simplifies it (Douglas–Peucker) to a clean editable ring. Sources: click
  subject · background-corners→invert · transparency (cut-out PNG). Tune *tolerance* and *point count*.
- **Edit:** drag dots, click a line to insert a dot, `Del` to remove; straight or smooth (Catmull-Rom).
  Multiple **named paths** tagged by **view** (`side` / `top` / `front` / `free`) so body/wing/tail are
  separate shapes.
- **Part tags:** every path carries a **`part`** tag (`wing` / `body` / `tail` / `head` / `neck` / `leg` /
  `body+tail…`) — the semantic label that says which builder it feeds, independent of the view angle.
- **Wing-rig mode (`+ Wing rig`):** instead of a freeform outline, place named handles — **root** (on the
  body), **wrist**, **lead** (leading-edge control), and **finger struts** (outer→inner). The export
  includes a derived **`wingForm`** in the engine's exact `wingForms[]` planform (tips x descending
  outer→inner, `lead` +y; §6c) — no guesswork mapping a silhouette to finger tips. (scallop + `arc{}` are
  3-D finish dials a flat trace can't measure → emitted as defaults to tune on the preview.)
- **Connection points (⊕):** drop a **joint** marker on any path to mark *where it attaches to the body*.
  For a wing that's the **wing-root locus** the continuous-hull build needs (body-Z + radius), so wings are
  grown out of the body skin rather than bolted on (the gap-on-upbeat failure mode — see LEAPFROG L20–L32).
- **Body loft export:** tag an outline **body** + view **side** (→ `ry` half-height) and another **top**
  (→ `rx` half-width) and the tool derives a best-effort **`loftEllipse` ring list** (`{z, rx, ry}`, head
  −1 → tail +1, body-length units) — drop it into a torso builder (§6a) and tune on the overlay. Raw
  normalised points are always exported too. "Copy for Claude" yields a paste-ready message.
- The geometry core (`tools/tracerCore.mjs`: masks, contour, simplify, `deriveProfile`, `toLoftRings`,
  `deriveWingForm`) is pure/DOM-free and unit-tested headlessly (`tests/tracer.mjs`).

---

## 8. LIMITATIONS (be honest with the model)

1. **Procedural-only — NO mesh import.** Every shape is generated by code (no `.obj`/`.glb`). You
   cannot "drop in" a sculpt; you must describe it as modules + cross-sections. (Root constraint:
   tiny, no build step, 60fps mobile.) *Not addressable without abandoning the project's identity.*
2. **Bodies are sculptable but each is a bespoke builder.** You can get any silhouette by editing a
   builder's ring list, but there's **no shared "chest/waist/hip" dial** yet — reshaping means editing
   that builder's code. And **decorations sit at fixed radii/positions**, so a big reshape can clip the
   gorget/keel/fairings (judge on the preview).
3. **Part choice is discrete — you can't blend builders** (membrane *or* feather, not 70/30). If your
   concept is "between" two builders, you author a new one.
4. **4 discrete forms, no smooth morph** between tiers.
5. **The flap rig assumes a horizontal flyer.** Rigid/no-flap wings work, but anything needing a
   *different motion model* (walking, hovering upright) is new territory.
6. **No `legRoot` mount.** Legs exist (`mechaLeg`) but as static, **folded-tuck** add-ons placed ad-hoc
   — never weight-bearing or posed standing/trailing.
7. **Headless silhouette is SHAPE-ONLY.** It can't see color, materials, gold rims, or glow — those
   need the live WebGL preview. So "looks wrong" that's about *finish* won't show in the overlay.
8. **The chase cam occludes the upper body with spread wings.** Chest shaping reads in 3/4/shop/bank;
   waist/hip/tail read from dead astern.
9. **No humanoid/upright archetype.** Everything is a horizontal creature; an upright mech is a new
   body topology (buildable, but new — see §9/§11).

---

## 9. What could be PUSHED to take model creation to the limit

Concrete upgrades, roughly easiest→deepest (each is a real, bounded build):

1. **Reusable body-profile dials** — promote chest/waist/hip width to `chestScale`/`waistScale`/
   `hipScale` knobs (the way `wingChordScale` was added), so **any** dragon dials an hourglass from
   `dragons.js` with no builder edit. *The single biggest "give the body more shape" unlock.*
2. **A `legRoot(side)` mount** in the attach contract → legs become first-class (like wings), posable
   trailing/standing, with `thrusterPod` feet.
3. **A dense rigid wing-binder fan builder** — generalize `svjFanWing` to N thin rigid blades with no
   flap (the "wings of light"). 
4. **Spline/continuous body profile** — more cross-section stations or a smooth spline so silhouettes
   aren't limited by a handful of hand-placed rings.
5. **New archetypes authored in their own orientation** (e.g. an upright humanoid mech presented
   back-to-camera) — the flight model already moves the whole group; you just build the body upright.
6. **Headless material/lit preview** — a small offscreen render path so color/gold-rim/glow can be
   checked without the full game (today that's preview-only).
7. **Continuous form interpolation** — morph dials across `formT ∈ [0,4]` instead of 4 snapshots.
8. **Pose presets** (spread/downstroke) baked into the spec so the silhouette target is unambiguous.

---

## 10. THE OUTPUT FORMAT — how to spec a model so it's recreatable

> **Instruction to ChatGPT:** When you design a creature for Dragon Drift, **output a spec in exactly
> this shape.** Use real module names from §4 and real dials/ranges from §5. Define the body as a
> **cross-section ring list** (§6a). Think in the **rear/3-4 chase-cam silhouette** (§1). Give concrete
> numbers. **Never invent dials outside §5.** When nothing in the menu fits, write
> `NEW MODULE NEEDED: <name> — <one-line description>` instead of pretending a builder exists.

```
NAME / RARITY / ARCHETYPE: <e.g. "Aegis Knight" / SSSR / humanoid-mecha (NEW archetype)>
REFERENCE: <describe the rear + 3/4 silhouette in words; attach the image>

PARTS (pick from §4, or flag NEW MODULE NEEDED):
  torso:  <builder | NEW MODULE NEEDED: …>
  wings:  <builder | NEW MODULE NEEDED: …>   rigid? <yes/no>   blade/feather count: <n>
  head:   <builder | NEW MODULE NEEDED: …>
  tail/legs: <builder | NEW MODULE NEEDED: …>
  surfaceLayers: [ <layer>, … ]

BODY CROSS-SECTIONS (head −Z → tail +Z; this IS the silhouette):
  [ { z, rx (half-width), ry (half-height), note:"chest/waist/hip/…" }, … ]
  # For torso:'parametricArrow' emit `profileStations` instead, as
  #   [ { z, halfWidth, keelTop, belly, note:"chest/waist/hip/…" }, … ]  (mounts re-derive off these)

DIALS (model.* — only §5 knobs, values within range):
  scale, wingScale, wingChordScale, shoulderWidthScale, bodyMetalness, bodyRoughness, scaleSize, … 
  # parametricArrow shape: model.bodyKnobs { shoulderWidth, chestScale, waistPinch, hipFlare,
  #   bodyLength, neckTaper, tailTaper, keelHeightCurve, sectionPoints, sectionExponent, attach{…} }
  # wing planform: wingFormKnobs:[…4…] { span, fingerCount, fingerSplay, chordTaper, sweep, scallop, flame, arc }
  # tail tips: model.tailKnobs { forkSpread, forkLength, forkNotch, bladeHalfW, bladeLength, spadeHalfW, spadeLength }

MOTION: flapBias, flapAmp (or "rigid wings, flapAmp ~0.1"), flapProfile{…} if organic.

COLORS (hex per channel): body, eye, wingInner, wingGild, wingEmissive, horn, …

FORMS (4 tiers, cumulative): for each of Hatchling/Kindled/Radiant/Eternal give
  { scale, wing/tail style, ridge/spine/crest level, color shift }.

REUSE vs NEW: bullet what's reused from the kit vs what needs a NEW MODULE (and why).
TRI BUDGET NOTE: flag anything likely heavy (dense fans, many segments) for tricount.
```

**Why this format works:** it maps 1:1 onto what the engine consumes — `parts` → registries,
`model` → grammar dials, the ring list → the loft, `surfaceLayers` → decoration, `forms` → ascension.
A spec in this shape can be implemented directly; a prose description cannot.

---

## 11. Worked example — the "flying Gundam" (feasibility + spec sketch)

A humanoid mech flying back-to-camera (legs trailing with foot boosters, rigid fanned "wings of
light," V-fin head). **Feasibility ≈ 70–80%** with a dedicated build — it **flies like every creature**
(no new flight engine / no walk cycle): legs are static trailing geometry, thrusters are VFX, wings are
rigid.

- **REUSE (most of the *look*):** `thrusterPod` (leg boosters + jetpack, Surge-glow cores),
  `mechaLeg` (leg geometry, re-posed), the mecha kit (`wedgePanel`/`frameBar`/`flatTriMesh`/`hexGrille`/
  `spineSegment`), `svjWedgeHead` → extend horns into a **V-fin**, `svjFanWing` → seed of the wing fan.
- **NEW MODULE NEEDED:**
  - `humanoidTorso` — upright chest→waist→pelvis, authored back-to-camera (cross-section rings below).
  - `legRoot(side)` mount + legs posed **trailing/straight** with `thrusterPod` feet.
  - `lightWingFan` — N (~12–16) thin **rigid** blades per side, no flap.
- **BODY CROSS-SECTIONS (sketch, upright humanoid presented from behind):**
  ```
  [ {z:-0.2, rx:0.18, ry:0.22, note:"head/neck"},
    {z: 0.0, rx:0.55, ry:0.40, note:"broad shoulders / backpack mount"},
    {z: 0.3, rx:0.42, ry:0.34, note:"chest/back plate"},
    {z: 0.7, rx:0.26, ry:0.26, note:"waist"},
    {z: 0.95,rx:0.40, ry:0.30, note:"pelvis / hip armor"},
    {z: 1.2, rx:0.30, ry:0.24, note:"upper-leg split → two legs trailing"} ]
  ```
  (legs continue as two separate `mechaLeg`-style chains from the pelvis, thrusters at the feet.)
- **The last ~20–30%:** true Gundam **proportions** + the dense **wings-of-light** blade count are the
  iteration targets — converge them with `silhouette-overlay.mjs` against the reference, the same loop
  used to tune Pearl's wings/body.

---

*Keep this file current as the engine grows (new builders, new dials). It's the single source ChatGPT
should read before proposing a model, and the spec format in §10 is the contract for "recreatable."*
