# Creature creation, fresh eyes: the Archetype-Chassis + Hero-Silhouette system

> Written as a model/creature-pipeline specialist, deliberately **ignoring** the
> `LEAPFROG.md` reuse doctrine and **not** re-proposing the PR #160 genome /
> auto-fit-optimizer route (which collapses to a blob and doesn't follow the
> prompt). This is a different design with a different root cause in mind.
>
> No engine code is changed by this document. It's the plan; §7 is the first
> hero to build.

---

## 0. TL;DR

Stop authoring a *surface*. Author a **chassis + a handful of bold silhouette
landmarks**, designed for the one camera that matters (rear chase), and let the
AI prompt fill a small, **named, bounded gene sheet** — deterministically, with
no optimizer loop.

- **Family resemblance** ("dragons should look like dragons") comes from a
  shared **archetype chassis**: fixed topology + a fixed proportion template
  every member inherits. It is *not* emergent — it's structural and guaranteed.
- **Variety** ("each design has its own silhouette") comes from perturbing
  ~12 named genes within tight ranges, with 4 of them flagged as **hero genes**
  that dominate the rear silhouette. Two creatures are *required* to differ on a
  hero gene, so they can't look the same.
- **Charm** comes from bold, separate, exaggerated primitives unified by a
  **toon outline + contact AO** pass — not from blending everything into one
  organic hull.
- **The prompt maps top-down**: classify → archetype, then fill genes, then
  palette. Classification and bounded slot-filling are things an LLM is reliable
  at. Numeric silhouette optimization is not.

---

## 1. Why both previous routes failed (same root cause)

The current `reforged/` roster has been chasing **one continuous body+wings
hull** (`dragonUnifiedHull.js`, `dragonOrganism.js`, `dragonHull.js`), and
PR #160 proposed going further — a **topology-free genome** fitted to a
reference by a silhouette optimizer.

Both share one fatal property for a *stylised, prompt-driven, varied* roster:

> **They make the silhouette an _emergent_ property of a high-dimensional
> surface.** When the only quality signal is "match this outline," every
> generator — hand-tuned or optimized — slides toward the average blob that
> minimizes error. That is *exactly* why your dragons stopped resembling each
> other while also not resembling the prompt: a smooth hull has no bold,
> nameable landmarks to vary, and an optimizer has no reason to keep a feature
> the prompt named if smoothing it lowers the pixel gap.

The original Dragon Drift (repo root `js/`) didn't have this problem. It built
creatures from **separate, legible primitives** (skull-sphere + cone-snout +
box-jaw; a *chain* of cones for the tail; flat membrane sheets for wings) and
varied creatures by **proportion data**, not surface smoothing. The Jade Serpent
read as a river-dragon because its neck had more segments and its wings were
smaller — a *structural* difference you could name. That legibility is the thing
the hull route threw away. We take it back, and fix the two things the original
*didn't* have: (a) an enforced family resemblance, and (b) a charm/stylization
layer so "separate primitives" stop looking like a modelling exercise.

---

## 2. The core reframe: design for the rear chase cam

This is the #1 constraint and it changes everything. From a rear/￫ 3-4 chase
camera, **you barely see the body**. The belly, the snout, the chest — occluded
or tiny. What fills the frame and what the player actually reads is:

| Rank | What the chase cam sees | Silhouette weight |
|------|-------------------------|-------------------|
| 1 | **Wing planform** (span, sweep, how they beat) | ~40% |
| 2 | **Dorsal line** — spine ridge / sail / crest along the back | ~20% |
| 3 | **Tail** — trailing straight at the lens, its shape & motion | ~15% |
| 4 | **Head + neck** bobbing *above* the back line | ~15% |
| 5 | **Overall mass / posture** (hunched, serpentine, soaring) | ~10% |

So we spend the **entire variation budget on those five landmarks** and keep the
body a simple, cheap, mostly-hidden volume. This single decision is why the
seam-gap problem that justified the unified hull is a **non-problem here**: the
chase cam never sees the wing-root underside seam. We hide seams with a shoulder
fairing/pauldron and move on.

---

## 3. The architecture: Chassis → Genes → Charms → Skin

A creature is built in four passes. Each pass is a separate, swappable concern.

```
ARCHETYPE  ──►  CHASSIS        (fixed topology + proportion template; the "is-a-dragon")
   │            ├─ landmark rig: shoulders, hips, neck-base, tail-base, head socket
   │            └─ body volume  (one cheap tapered tube; mostly occluded)
   │
GENES      ──►  apply to chassis (bounded per-archetype; 4 are "hero genes")
   │            ├─ neckLen, bodyMass, tailLen/taper, stance angle …
   │            └─ HERO: wingPlan, dorsalStyle, tailTip, hornStyle
   │
CHARMS     ──►  silhouette furniture hung on landmarks
   │            (spines / sail / horns / frills / tail-fin — enum-selected, not free-form)
   │
SKIN       ──►  one stylization pass over the whole assembly
                (toon ramp + rim, contact AO at joints, outline, palette roles)
```

### 3.1 The chassis = family resemblance, by construction

An **archetype** is a hard-coded chassis module. It owns:

1. **Topology** — how many of each limb and where they attach. A `dragon` has
   4 legs + 2 bat wings + 1 long tail + horned head on an arching neck. A
   `phoenix` has 0 forelegs + 2 feathered wings + plume tail + beaked head,
   upright. Topology is **fixed per archetype** — this is what makes every
   dragon unmistakably a dragon and impossible to confuse with a phoenix.
2. **A proportion template** — the default landmark positions and sizes (neck
   rises at this angle, wings root at the shoulder this wide, tail is this long).
   Defaults alone produce a complete, on-model "type specimen" of the family.
3. **A landmark rig** — named anchors (`shoulderL/R`, `hipL/R`, `neckBase`,
   `tailBase`, `headSocket`, `dorsalCurve(t)`) that charms and the head/wings/
   tail builders mount to. This is the *attach contract* the original already
   had — we keep it; it's the good idea in there.

> **Why this isn't the LEAPFROG "reuse" trap.** The doctrine that's failing you
> reuses *one builder across unrelated creatures to save triangles*, which drags
> everything toward the roster mean. Here, reuse is **scoped to a family on
> purpose** (all dragons share the dragon chassis) and is the *source of*
> resemblance, while genes guarantee divergence. Different families share
> **nothing** but the rig contract.

### 3.2 Genes = variety, bounded and deterministic

Each archetype declares a **gene sheet**: a fixed list of named knobs, each with
a type, a range or enum, and a default. Partial prompts are fine — unmentioned
genes keep defaults, so output is always complete and on-archetype.

Example — the **Dragon** gene sheet:

```js
DRAGON_GENES = {
  // ── proportion genes (continuous, tight ranges keep it a dragon) ──
  neckLen:        { range: [0.8, 1.4],  def: 1.0 },   // multiples of template
  neckArch:       { range: [0.2, 0.9],  def: 0.55 },  // how high the head rides
  bodyMass:       { range: [0.7, 1.3],  def: 1.0 },   // girth (rear cam: shoulders)
  tailLen:        { range: [0.8, 1.6],  def: 1.1 },
  tailTaper:      { range: [0.15, 0.6], def: 0.35 },  // whippy ↔ heavy
  stance:         { range: [-0.2, 0.4], def: 0.1 },   // hunch ↔ soar pitch
  legBulk:        { range: [0.6, 1.2],  def: 0.9 },   // mostly hidden; cheap

  // ── HERO genes (dominate the rear silhouette; novelty enforced here) ──
  wingPlan:   { enum: ['bat','falcon','galleon','tattered','webbed'], def: 'bat' },
  wingAspect: { range: [1.4, 3.2], def: 2.1 },        // span ÷ chord — the ribbon dial
  dorsalStyle:{ enum: ['none','spines','sail','plates','crystals'], def: 'spines' },
  tailTip:    { enum: ['arrow','fork','spade','fin','clubbed','frond'], def: 'arrow' },
  hornStyle:  { enum: ['swept','ram','crown','antler','none'], def: 'swept' },
};
```

~12 numbers + enums. A person can read a creature's whole shape from its gene
row. **No optimizer, no fitting loop.** Same genes → same creature, every build.
Iteration becomes "bump `wingAspect` to 2.6," not "re-run the fit and hope."

### 3.3 Charms = the silhouette furniture

Charms are the enum-selected decorations hung on the rig (`dorsalStyle: 'sail'`
builds a membrane sail along `dorsalCurve(t)`; `hornStyle: 'crown'` mounts a
horn cluster at `headSocket`). They are **bold and separate** — exactly the
original's approach — because boldness is what reads from 40 m behind at speed.
Each charm is a tiny builder keyed by enum value, merged to one draw call.

### 3.4 Skin = the charm unlock (this is the part the original lacked)

Separate primitives look like a modelling exercise **until** you put a unifying
skin over them. Three cheap passes turn "spheres and cones" into one designed,
charming character:

1. **Toon/gradient ramp + fresnel rim** — 2–3 lighting bands instead of smooth
   PBR. Instantly stylised, hides primitive seams, mobile-cheap. (The codebase
   already has `fresnelRimPatch` / shader-patch composition to build on.)
2. **Contact AO at joints** — darken vertices near where two parts meet (cheap
   baked vertex term, or a contact shadow decal). This is what makes a neck-
   sphere-chain read as *one neck* instead of beads.
3. **Outline** — a dark silhouette edge. Mobile: inverted-hull backface shell on
   the merged body (one extra draw). Ultra: a proper post-process edge pass.
   **This is the single biggest charm lever for a chase-cam game** — it gives
   every creature a clean, confident, cartoon contour regardless of how blocky
   the underlying primitives are.
4. **Palette roles** — every creature resolves exactly five named colors:
   `base`, `accent`, `membrane`, `glow`, `eye`. The prompt (or a reference
   image's sampled palette) fills these five roles and nothing else, so color
   is as controllable and legible as shape.

---

## 4. The prompt → creature pipeline (reliable, no optimizer)

```
prompt ─►  ① CLASSIFY ─►  archetype ∈ {dragon, phoenix, serpent, wyvern, …}
       │
       ├─►  ② FILL GENES  (bounded slot-filling against the archetype's sheet;
       │                    unmentioned genes keep defaults)
       │
       ├─►  ③ PALETTE      (map prompt adjectives → 5 color roles;
       │                    or sample a reference image into the same 5 roles)
       │
       └─►  ④ BUILD        buildFromArchetype(archetype, genes, palette)  — deterministic
```

Why this follows the prompt when the optimizer didn't: an LLM is **reliable at
(1) classification and (2) filling a small named schema with enums and bounded
numbers**. It is *unreliable* at producing a continuous surface that survives a
numeric silhouette fit. We only ever ask it to do the former. "Spiky black
dragon, long neck, cyan wings" deterministically becomes:

```
archetype = dragon
genes = { neckLen: 1.3, dorsalStyle: 'spines', wingPlan: 'bat', wingAspect: 2.4 }
palette = { base:#0a0d12, accent:#16202c, membrane:#0c1118, glow:#42c8ff, eye:#42c8ff }
```

— and looks like that, every time. Reference *images* are supported the same
way: a vision pass estimates the gene sheet (proportions → numbers, wing/tail
shape → enums) and samples the 5 palette roles. We capture the **readable**
features a person would name, which is what "faithful to the reference" means
for a stylised game — not pixel-exact contours.

---

## 5. Variety guarantee (the anti-sameness mechanism)

Because all variation lives in a named, bounded gene vector, novelty is
**measurable and enforceable** — the thing neither the hull nor the optimizer
could give you:

- Define a distance over the **4 hero genes** (the ones that own the rear
  silhouette). When authoring/generating a new family member, **reject** a gene
  vector that lands within ε of an existing roster member on hero genes, and
  re-roll the nearest hero gene. Two dragons are *guaranteed* to differ where
  the camera looks.
- A headless test (`tests/silhouette-spacing.mjs`) renders each family from the
  chase cam and asserts pairwise silhouette IoU **below** a ceiling — a CI gate
  that *fails when two creatures look too alike*. (Today's silhouette tool
  measures the opposite — overlap *with a target*; we add the inverse check.)

So you get both: a CI gate for "every dragon still reads as a dragon" (topology
is fixed, so this is free) **and** a CI gate for "no two dragons look the same."

---

## 6. Ultra mode = same chassis, richer (iPhone 17 Pro Max / desktop NVIDIA ceiling)

Ultra is **not a different model** and not a separate code path — it's the same
chassis + genes with the detail dial turned up. Budget at the ceiling is huge
(~150–300k tris, multiple full-screen passes), so:

- **Geometry**: higher segment counts on the same primitives (the existing
  `seg()` LOD scalar already does this); rounder joints; the outline becomes a
  post-process instead of a backface shell.
- **Ultra-only charm shells** (opt-in, mounted on the same rig):
  - **Feather/fur shells** — a few stacked alpha-card layers along wings/back/
    tail for phoenix plumage and dragon mane fuzz.
  - **Per-scale instanced relief** on the body (instanced cards, one draw).
  - **Membrane SSS / iridescence** + a second rim pass on wings (patches the
    codebase already has).
- **Mobile authoring stays the floor**: the chassis is authored at the 60-fps
  mobile budget; Ultra only *adds* layers. No creature is designed Ultra-first,
  so weak mobile is never an afterthought.

---

## 7. First hero: prove it on one dragon, coexisting

Don't touch the shipped roster. Stand the system up beside it and prove it on one
hero, mirroring the existing "coexist → prove → migrate" safety without adopting
the reuse doctrine.

1. **`creatureArchetypes.js`** — register the `dragon` chassis: topology, the
   proportion template, the landmark rig, and the `DRAGON_GENES` sheet (§3.2).
2. **`buildFromArchetype(archetype, genes, palette, opts)`** — a peer to
   `buildDragonModel()`. Internally: build cheap body tube → place landmarks from
   genes → mount head/wings/tail builders (reuse the *good* part-builders, e.g.
   the membrane wing, parameterized by `wingPlan`/`wingAspect`) → hang charms →
   apply the skin pass.
3. **`skinPass.js`** — toon ramp + contact AO + outline + 5-role palette, applied
   to the merged assembly.
4. **Author 3 dragons by genes only** (e.g. a heavy galleon-winged drake, a
   whip-thin spined serpent-dragon, a crowned soaring royal) and run:
   - `tools/tricount.mjs` — stay ≤6000 tris HIGH / ≤13000 ULTRA.
   - `tools/silhouette.mjs` chase-cam shots — eyeball charm + read.
   - new `tests/silhouette-spacing.mjs` — assert the three are pairwise distinct.
5. **Human judges motion/feel** on the PR preview from the chase cam. If the
   three dragons clearly read as a family *and* clearly differ, the system works
   — then migrate the roster onto archetypes one family at a time.

---

## 8. What's different from PR #160 and the hull route — at a glance

| | Hull route (current) | PR #160 (genome + optimizer) | **This (archetype chassis)** |
|---|---|---|---|
| Silhouette is… | emergent from a surface | emergent, then numerically fitted | **authored as bold landmarks** |
| Family resemblance | hoped-for | not addressed | **structural & guaranteed** (fixed topology) |
| Variety | collapses to mean | optimizer smooths features away | **bounded genes + enforced hero-gene spacing** |
| Prompt mapping | pick prefab + scale | continuous fit (LLM-unreliable) | **classify + fill named schema (LLM-reliable)** |
| Iteration | re-tune dials | re-run the fit | **edit one named gene; deterministic** |
| Charm source | organic blend | — | **bold primitives + toon outline + contact AO** |
| Built for | side/3-4 reference match | reference IoU | **the rear chase cam, explicitly** |
```

