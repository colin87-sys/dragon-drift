# Creature Creation, Reimagined — a reference-faithful system

> **Fresh-eyes brief.** This document deliberately ignores the `LEAPFROG.md` reuse
> doctrine. It is written by a model/creature pipeline specialist asked one question:
> *if the goal is "the creature that comes out looks like the reference image I gave the
> AI," how should creature creation actually work in this engine?* The answer is a
> different philosophy from the shipped one, but it is **buildable on the geometry the
> engine already has** — and it can coexist with the current roster instead of breaking it.

---

## 0. TL;DR

The current system asks an AI to **pick prefab parts from a menu and turn ~40 scalar
dials.** That structurally cannot match an arbitrary reference, because the one thing that
actually controls a creature's silhouette — the cross-section ring list — **is not in the
authoring vocabulary at all.** It lives inside hand-written, per-creature builder code.

The fix is to flip the model:

1. **A creature is a continuous, topology-free *genome*, not a recipe of modules.** The AI
   authors a skeleton (joints in 3D), a volume profile along each bone, and a *list* of
   appendages of any count — all continuous numbers. No "pick torso #7."
2. **One universal generator builds any creature from that genome.** The engine already has
   its two core primitives (`skinnedTube`, `sweepProfileSmooth`); today they're trapped
   inside bespoke builders. Promote them to *the* build path.
3. **The reference image drives the genome directly** — vision-estimated proportions,
   pixel-sampled palette, and a **silhouette auto-fit optimizer** that closes the gap
   numerically. The human judges feel; the machine matches shape.
4. **Verification becomes multi-view + feature-aware + perceptual**, not a single rear
   silhouette-overlap %.
5. **"Ultra mode" is a resolution dial on the same genome**, not a separate model — so the
   iPhone 17 Pro Max / desktop-NVIDIA ceiling is "turn detail up," never "re-author."

Everything below is grounded in files I read in `reforged/js/`. Where I cite a primitive
that already exists, I name it.

---

## 1. Why the current system can't hit a reference (diagnosis)

I traced the pipeline end to end: `dragons.js` (196 blueprints) → `dragonRecipe.js`
(registries) → `dragonModel.js` (composition) → `creatureGrammar.js` /
`validateCreatureBlueprint.js` (the closed vocabulary) → `tools/silhouette*.mjs` (the
verification loop). Five structural reasons it drifts from references:

**1.1 The silhouette controls aren't in the vocabulary.**
`MODEL-CREATION.md` §6a is explicit: *"editing the ring list IS sculpting the body."* Yet
`creatureGrammar.js` exposes `scale`, `wingScale`, `ridgeCount`, `shoulderWidthScale`… and
**not the cross-sections.** The rings are hard-coded inside each torso builder (e.g.
`dragonOrganism.js`'s `drakeSection` + 13 stations). So an AeI can pick a *prebuilt body*
and scale it, but it **cannot author a new body shape** — the exact lever you need to match
a reference. The doc even admits this is "the single biggest unlock" (§9.1) and hasn't been
done.

**1.2 Discrete module choice collapses variety toward the roster mean.**
The AI selects `torso ∈ {arrow, serpent, avian, …}` — ~10 options. A stocky bulldog-wyvern
and a sleek eel-dragon both snap to the nearest prefab and differ only by dials. The
*topology is frozen*: exactly one torso, two wings, one head, one tail, mounted through a
fixed attach contract (`wingRoot`, `headBase`, `tailAnchor`). A reference with four legs, a
second wing pair, a fan of seven horns, or no wings-but-a-frill has **nowhere to go** in the
schema.

**1.3 The grammar is an allowlist that rejects novelty.**
`validateCreatureBlueprint.js` warns/errors on any knob outside the frozen
`CREATURE_GRAMMAR`. That is great for roster consistency and **actively hostile to chasing a
new shape** — the system is designed to converge, not diverge.

**1.4 Reuse is enforced twice — culturally *and* mechanically.**
`LEAPFROG.md` pushes "reuse parts"; the registry+validator make reuse the path of least
resistance. Net effect: every new creature is a remix of shipped silhouettes. That's *why*
"output doesn't follow the reference at all" — the system's gravity well is the existing
roster.

**1.5 The verification metric is lossy.**
`tools/silhouette-overlay.mjs` scores **rear-view fill overlap %**. You can hit 85% overlap
and look nothing like the reference: rear view hides proportions (those live in *side*
view), and fill-% is blind to limb count, head shape, wing structure, color, and material —
the features a human actually uses to say "yes, that's the creature." Optimizing this number
optimizes the wrong thing.

> **Root cause, one sentence:** the engine's real expressive power (continuous lofts along
> bendable bone chains) exists in code but is **not exposed to the author**, so authoring
> degrades to prefab-selection + dial-tuning, which can only ever approximate the roster it
> was built from.

---

## 2. The fresh philosophy: a creature is a *genome*, not a recipe

Stop describing a creature as *"which modules + which dials."* Describe it as **a
parametric organism** the AI can fully specify and the optimizer can fully adjust:

```
GENOME
├─ skeleton      a graph of named joints in 3D (spine chain + limb/appendage chains)
├─ volume        a cross-section profile along every bone (this IS the silhouette)
├─ appendages    a LIST (any count) of wings / fins / horns / legs / frills / tails,
│                each attached to a joint, each with its own profile or membrane
├─ surface       material + procedural relief fields (scales / plates / feathers / fur)
└─ palette       colors, sampled from the reference, not named by the model
```

Three properties make this matchable to references where the recipe system isn't:

- **Continuous, not discrete.** Every shape parameter is a number an optimizer can nudge.
  There is no "snap to nearest prefab."
- **Topology is data.** "Two wings" vs "four legs + frill + no wings" is just a different
  appendage list — not a different code path, not a schema violation.
- **Resolution-independent.** The genome describes *shape*, not *tessellation*. Detail tier
  (mobile → ultra) is a separate axis applied at build time.

This is the standard architecture of every creature creator that *does* track references
(Spore, MetaHuman, character-rig pipelines): an editable rig + parametric flesh, not a parts
bin. We can have it here without asset files, because the flesh is procedural.

---

## 3. The universal generator (and why it's already half-built)

The good news from reading the code: **the hard part exists.** Two functions in
`dragonSweep.js` are exactly the primitives a genome needs — they're just called from inside
bespoke builders instead of from a generic one.

### 3.1 Primitive A — `limbTube` = generalize `skinnedTube` (already in `dragonSweep.js`)

```js
// ALREADY EXISTS, dragonSweep.js:146
skinnedTube(centreline, radii, rings, skinAt, mat) // a tapered tube swept along ANY
                                                    // 3D polyline of bones, skinned
```

This single function builds **spine, neck, tail, legs, arms, horns, fingers, antennae** —
anything elongated — because it sweeps a cross-section along an arbitrary bone chain. The
genome's job is just to supply `(centreline, radii)` per limb. Generalize the cross-section
from a circle to a **super-ellipse** `(width, height, squareness)` per station and one
primitive now spans round bellies → flat blades → boxy mecha limbs.

### 3.2 Primitive B — `bodyLoft` = `sweepProfileSmooth` (already in `dragonSweep.js`)

```js
// ALREADY EXISTS, dragonSweep.js:101 — lofts a profile through stations with a
// BENDING centreline (channels cy, cx offset the spine), smooth in both directions.
sweepProfileSmooth(profile, stretch)
```

The body is this, with **the station list promoted out of builder code and into the
genome.** That one move directly fixes §1.1: the silhouette becomes authorable data.

### 3.3 Primitive C — `membrane(spars, web)` = generalize the wing skin

The wing builders already stretch a skin between spar curves. Generalized, primitive C
fills **any** surface between two edge curves: wings, fins, sails, frills, webbed feet,
ears, capes. The genome supplies spar endpoints + a web/scallop profile.

### 3.4 Primitive D — `shell(field)` = generalize scales/shingles

`dragonShingle.js` + `dragonSurfaceShader.js` already place cupped cards and procedural
scales. Generalized to a **placement field** over the parametric surface (density, size,
orientation, type ∈ {scale, plate, feather, spike, fur-shell}), one primitive covers all
surface relief, instanced for performance.

> **The whole module registry (10 torsos, 12 wings, …) collapses to 4 primitives + data.**
> A "Night Fury" and a "crystal serpent" stop being different *builders* and become
> different *genomes* fed to the same generator. New creatures need **zero new code** —
> which is the property the current system was reaching for but couldn't get, because its
> unit of reuse was a whole prefab part instead of a primitive.

```
GENERATOR (one function, replaces buildDragonModel's part dispatch)
  buildFromGenome(genome, tier) →
     bodyLoft(genome.skeleton.spine, genome.volume)              // Primitive B
   + for each appendage: limbTube | membrane                     // Primitives A / C
   + shell(genome.surface.fields)                                // Primitive D
   + materials(genome.palette, genome.surface.material)
   → one welded, skinned mesh + animation hookpoints
```

---

## 4. The genome schema (concrete, AI-authorable)

This is what the AI emits and the optimizer edits. Numbers are illustrative; all continuous.

```jsonc
{
  "name": "Ref-Wyvern",
  "axis": { "forward": "-Z", "up": "+Y" },          // engine convention, unchanged

  // 4.1 SKELETON — joints in body space. The spine is the root chain; everything
  //     else attaches to a named joint. THIS replaces the fixed attach contract.
  "skeleton": {
    "spine":  [ {"id":"snout","p":[0,0.2,-1.6]}, {"id":"head","p":[0,0.45,-1.2]},
                {"id":"chest","p":[0,0.3,-0.4]},  {"id":"hip","p":[0,0.25,0.6]},
                {"id":"tailTip","p":[0,0.1,1.8]} ],
    "limbs":  [
      {"id":"wingL","from":"chest","chain":[[0.4,0.5,-0.3],[1.6,1.1,0.1],[2.6,0.9,0.5]]},
      {"id":"wingR","mirror":"wingL"},
      {"id":"legL","from":"hip","chain":[[0.3,0.0,0.6],[0.4,-0.5,0.7],[0.5,-0.9,0.6]]},
      {"id":"legR","mirror":"legL"}
    ]
  },

  // 4.2 VOLUME — the silhouette. Per spine station: super-ellipse cross-section.
  //     (width = the X profile the rear cam reads; height = Y; squareness 0=round..1=box)
  "volume": {
    "spine": [
      {"at":"snout","w":0.06,"h":0.07,"sq":0.2},
      {"at":"head", "w":0.28,"h":0.30,"sq":0.3},
      {"at":"chest","w":0.62,"h":0.58,"sq":0.25, "note":"barrel chest"},
      {"at":"hip",  "w":0.40,"h":0.42,"sq":0.3},
      {"at":"tailTip","w":0.04,"h":0.05,"sq":0.2}
    ]
  },

  // 4.3 APPENDAGES — ANY count, ANY type. This is the topology-as-data unlock.
  "appendages": [
    {"on":"wingL","kind":"membrane","spars":4,"span":1.0,"chord":1.2,"scallop":0.2,
     "rigid":false,"flap":{"amp":0.82,"bias":1.08}},
    {"on":"wingR","mirror":"wingL"},
    {"on":"legL","kind":"limb","profile":[[0.12,0.3],[0.09,0.6],[0.05,0.3]],
     "foot":"claw3","pose":"trail"},
    {"on":"legR","mirror":"legL"},
    {"on":"head","kind":"horns","pairs":2,"len":1.1,"curve":0.4,"splay":0.5},
    {"on":"spine","kind":"ridge","range":["chest","hip"],"count":12,"height":0.18}
  ],

  // 4.4 SURFACE — relief fields placed over the parametric surface (Primitive D).
  "surface": {
    "material": {"metalness":0.0,"roughness":0.85,"iridescence":0.0,"subsurface":0.0},
    "fields": [
      {"type":"scale","region":"body","size":3.0,"relief":0.9},
      {"type":"plate","region":"chest","size":1.4,"relief":0.5}
    ]
  },

  // 4.5 PALETTE — sampled from the reference image (k-means on the subject mask),
  //     not invented by the model. Roles map to material slots.
  "palette": {"body":"#2A2D33","belly":"#3A3F47","membrane":"#1C1E22",
              "eye":"#8FEAFF","accent":"#5BC8FF"},

  // 4.6 FORMS — unchanged concept (4 maturation snapshots), expressed as genome
  //     DELTAS (scale + which appendages/fields are active per tier).
  "forms": [ /* hatchling … eternal, as overrides on the above */ ]
}
```

Why this is *AI-authorable accurately*: the model isn't asked to recall an opaque dial
range. It's asked to do what vision models are good at — **place joints to match a picture
and describe proportions** — and everything is a number the optimizer can correct.

---

## 5. The reference → genome bridge (where "accurate" actually comes from)

Accuracy is not "write a better prompt." It's **closing the loop against the image
numerically.** Four mechanisms, in order of impact:

### 5.1 Author from the *image*, not a text prompt
Feed the reference **image** to a multimodal model and ask for the genome (skeleton +
volume + appendage list). Models estimate proportion, limb count, and silhouette from
pixels far better than they free-hand numbers from prose. If front **and** side views
exist, triangulate joint depth; with one view, assume bilateral symmetry and a default
depth profile. *This alone* moves output from "generic dragon" to "this dragon's
proportions."

### 5.2 Pixel-sample the palette (colors become exact by construction)
Mask the subject, run k-means on its pixels, assign clusters to roles (dorsal / belly /
membrane / accent / eye by luminance + position). The creature's colors are then **the
reference's colors**, not the model's guess at a hex code. Cheap, deterministic, a large
share of "it looks right."

### 5.3 Silhouette auto-fit — the machine closes the gap
This is the centerpiece and the thing the current loop is missing. After the AI seeds a
genome:

```
loop (bounded, headless):
  render candidate silhouette  (tools/silhouetteCore.mjs — ALREADY HEADLESS)
  diff vs masked reference, PER REGION (head / torso / wings / tail), not one global %
  adjust the continuous genome params toward lower distance
        (coordinate descent / CMA-ES-lite over volume widths, bone positions, span/chord)
  stop on convergence or budget
```

Because the genome is continuous, an optimizer can drive the silhouette onto the reference
**without a human hand-tuning a single dial.** The human's job shrinks to "judge the feel
and the call." This is the qualitative change from the current "spec → eyeball overlay % →
hand-edit → repeat" grind the user is frustrated with.

### 5.4 The human gate stays where humans are irreplaceable
Motion, "does it feel alive," final color/material taste — judged on the live PR preview,
exactly as today. The machine owns *shape match*; the human owns *feel*.

---

## 6. Verification, redesigned (replace the single rear %)

A reference-faithful system needs a **scorecard**, not one number:

| Check | Tool | Catches |
|---|---|---|
| Multi-view silhouette IoU (rear **+ side + 3/4**) | extend `silhouetteCore.mjs` | proportion errors invisible in rear view |
| Feature audit (limb/wing/horn count, head present, tail-length ratio, landmark positions) | new, reads the genome | "it dropped the second leg pair / wrong head" |
| Perceptual similarity (lit turntable render vs reference, CLIP-style embedding distance) | new, optional | color/material/texture the silhouette is blind to |
| Tri budget / flap continuity / 60fps | `tricount.mjs`, `flapcheck.mjs` (unchanged) | performance regressions |

**Side view is non-negotiable** — it's where chest depth, leg length, neck arc, and tail
taper live, and the current rear-only loop is blind to all of them. The perceptual check is
what finally scores the things `MODEL-CREATION.md` §8.7 admits the silhouette tool can't
see (color, gold rims, glow, material).

---

## 7. "Ultra mode" — a detail ceiling on the *same* genome

Because the genome is resolution-independent, the iPhone 17 Pro Max / desktop-NVIDIA ceiling
is a **build-time tier**, not a re-authored model. Add an `ULTRA` step above the existing
`seg()` LOD ladder (`modelDetail.js`):

| Axis | Mobile (HIGH) | **ULTRA** |
|---|---|---|
| Cross-section / longitudinal segments | shipped | 3–5× (`seg()` already the lever) |
| Surface relief | normal-map scales | **real per-scale geometry** (instanced Primitive D) |
| Appendage instances | a few cards | individual feathers / individual horns / dense fans |
| Material | standard PBR | **clearcoat + anisotropy + thin-film iridescence + subsurface** on membranes |
| Shadow / contact | baked blob | higher-res contact shadow, AO |
| Wing membrane | opaque card | translucent SSS with veining |

Same genome in, dramatically richer mesh out — and the optimizer's silhouette fit transfers
unchanged because shape is decoupled from tessellation. This is the right place to spend an
iPhone-17-class budget: **more real geometry and better materials, not a different model.**

---

## 8. Migration — coexist, prove on a hero, never break the roster

This does **not** require a rewrite or touching the 196 shipped creatures. Run the new path
beside the old one:

1. **Add `buildFromGenome()` as a peer to `buildDragonModel()`** — gated by a creature
   declaring a `genome` field. Creatures without one render through the existing path,
   byte-identical. Zero roster risk.
2. **Promote the two primitives** (`skinnedTube`, `sweepProfileSmooth`) to exported,
   genome-callable generators. They already produce shippable geometry; this is plumbing,
   not new graphics.
3. **Prove on ONE hero** authored *only* as a genome from a real reference image, run
   through the §5 bridge + §6 scorecard. Put it on the PR preview next to its reference.
4. **Build the image→genome + auto-fit tooling** (§5) as headless `tools/` scripts, reusing
   `silhouetteCore.mjs`. This is where the "accuracy" actually gets delivered.
5. **Migrate opportunistically.** New creatures author as genomes; old ones convert only if
   they need a reshape the recipe can't express. The roster never has to move at once.

---

## 9. Honest limits (what this does *not* magically solve)

- **One reference image is underconstrained in depth.** Symmetry + a default depth profile
  get you most of the way; a side view (or a quick human depth hint) closes it. Don't
  promise a perfect 3D reconstruction from one 2D drawing.
- **Stylized references with impossible anatomy** (paint-over splashes, non-physical
  proportions) will be approximated, not reproduced. The optimizer matches silhouette, not
  artistic license.
- **The flap rig still assumes a horizontal flyer.** Genome topology is free, but a creature
  that needs a *different motion model* (walk cycle, upright hover) is new animation work,
  not just new geometry. (Same limit `MODEL-CREATION.md` §8.5 notes.)
- **Perceptual/CLIP scoring needs a model in the loop** — fine for an authoring tool, not
  something that ships in the 60fps game. Keep it in `tools/`, offline.
- **This is a bigger build than adding one dial.** It's a new authoring path. The payoff is
  that it's the *last* such build — after it, new creatures are data, not code.

---

## 10. The one-paragraph pitch

Today an AI builds a creature by shopping a parts bin and tuning dials the reference can't
reach, then a human grinds a rear-silhouette % by hand — so the output looks like the roster,
not the reference. Instead: let the AI **author a continuous genome straight from the
reference image**, build it with **one universal generator the engine already has the
primitives for**, and let a **silhouette auto-fit optimizer close the shape gap numerically**
against **multi-view + perceptual** checks — with **ultra detail as a resolution dial on the
same genome.** The human stops tuning dials and goes back to judging whether it feels alive.
That is how the creature that comes out starts looking like the creature that went in.

---

*Companion to `MODEL-CREATION.md` (the current system) — this is a proposed successor
architecture, written fresh. The next concrete step is §8.1–8.3: stand up `buildFromGenome()`
beside the existing builder and prove it on one hero from a real reference image.*
