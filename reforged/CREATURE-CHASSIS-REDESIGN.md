# Creature creation, fresh eyes (v2): vary the body, not the trim

> Written as a model/creature-pipeline specialist, deliberately **ignoring** the
> `LEAPFROG.md` reuse doctrine and **not** re-proposing the PR #160 genome /
> auto-fit-optimizer route.
>
> **v2 correction.** The real complaint isn't "dragons don't resemble each
> other" — it's the opposite: **they resemble each other too much.** They came
> out as *reskins* — one body, swapped horns / spines / colour. So the whole
> design inverts: variation must live in the **silhouette of the body itself**,
> and decoration must be **demoted**. v1 of this doc did the wrong thing (a fixed
> shared chassis to *guarantee* resemblance) — that machine *manufactures*
> reskins. This version tears that out.
>
> No engine code is changed by this document. §7 is the first hero to build.

---

## 0. TL;DR

The reskin problem has one cause: **the variation budget was spent on the parts
the silhouette barely notices** (horns, spines, scales, colour) while the part
that owns the silhouette — the **body plan: skeleton + proportions + posture** —
stayed constant. Fix = a hard **priority inversion**:

- **Hero variation = the body plan.** A *library of silhouette skeletons*
  (western drake, wyvern, eastern serpent, leviathan, wingless drake, …) plus
  **wide** proportion ranges (a fat stocky drake vs a whip-thin one). Topology
  itself is allowed to vary (leg count, wing count, even wingless). This is the
  biggest silhouette lever and it's where almost all the budget goes.
- **"Dragon-ness" = a tiny feature checklist, not a fixed body.** A wedge
  reptilian head, leathery membrane (if winged), a scaled spine line, clawed
  digits. These read "dragon" across *any* body plan — the way a chihuahua and a
  wolfhound are unmistakably both dogs while sharing almost no proportions.
- **Decoration is the last, least layer.** Horns/spines/scale-relief are
  incidental trim, explicitly forbidden from being the thing that distinguishes
  two creatures.
- **The anti-reskin lock:** the variety CI gate measures the **decoration-
  stripped, single-colour, naked-body silhouette** from the chase cam. Two
  creatures must differ *there* — so swapping horns or recolouring can never make
  the gate pass. If two bodies are the same shape, it fails, full stop.

Kept from v1 because they were right: **chase-cam-first**, **bold separate
primitives + a toon-outline skin pass for charm**, and a **deterministic
prompt → genes pipeline** (classify + slot-fill, no optimizer).

---

## 1. Root cause of the reskins

The original Dragon Drift (repo-root `js/`) and the current `reforged/` roster
both vary creatures primarily through **flag-driven decoration on a shared
body**: `hornLen`, `ridgeCount`, `crest`, `spineGlow`, a swapped tail tip, a new
palette. Look at any dragon def — the bulk of the per-creature data is *trim and
colour*. The torso is one of two or three shared lofts, lightly scaled.

That is a **reskin generator by construction.** Decoration sits in the
low-silhouette-impact band; from the chase cam at speed you cannot tell two
dragons apart by their horns. The body — which you *can* tell apart — barely
moves between creatures. So everything looks like the same animal in a different
costume.

PR #160 tried to fix this by making the body a continuous optimized surface; that
collapses to a blob and ignores the prompt (different failure, same family of
mistake — letting a numeric process own the shape). We instead make the body
**discrete, bold, authored, and the primary axis of variation**, and we *measure*
that the bodies actually differ.

---

## 2. Still true: design for the rear chase cam

Unchanged from v1, because it's the governing constraint. From a rear / ¾ chase
cam the body is mostly **occluded**; the read is dominated by a few bold shapes:

| Rank | What the chase cam reads | Silhouette weight |
|------|--------------------------|-------------------|
| 1 | **Body plan & posture** — bulk, spine curve, how it sits in the air | ~35% |
| 2 | **Wing planform** — span, sweep, count (or absence) | ~30% |
| 3 | **Tail** — length, taper, how far it trails toward the lens | ~15% |
| 4 | **Head + neck** riding above the back line | ~12% |
| 5 | decoration (spines/horns/scales) | **~8%** |

Decoration is *last*. v1's mistake was making decoration enums the "hero genes."
The hero is the **body plan** — ranks 1–4.

---

## 3. The architecture: Body-plan → Proportions → Dragon-cues → Skin

```
BODY PLAN   ──►  pick a silhouette skeleton from the library   (the hero choice)
   │             ├─ topology: #legs, #wings (0/2/4), tail type, neck type
   │             └─ a posed spine curve + limb skeleton, authored to read boldly
   │
PROPORTIONS ──►  WIDE genes warp that skeleton                 (the second lever)
   │             ├─ overall mass, neck len, tail len/taper, limb bulk, wing aspect
   │             └─ volume profile: where mass sits (barrel chest? snake tube?)
   │
DRAGON CUES ──►  apply the "is-a-dragon" checklist             (cheap resemblance)
   │             reptilian wedge head · membrane/leather · scaled spine · claws
   │
DECORATION  ──►  incidental trim (horns/spines/scale relief)   (least; capped)
   │
SKIN        ──►  toon ramp + rim · contact AO · outline · 5 palette roles  (charm)
```

### 3.1 The body-plan library = real silhouette variety

Instead of one chassis everyone inherits, there's a **library of named silhouette
skeletons**, each a genuinely different animal-shape, all still legibly dragons:

| Body plan | Silhouette signature (from behind) |
|-----------|-------------------------------------|
| **Western drake** | bulky, 4 legs, big bat wings high on the shoulder, heavy tail |
| **Wyvern** | 2 legs, the wings *are* the arms — tall, kite-like, narrow body |
| **Eastern / lung** | long serpentine tube, tiny limbs, small or no wings, mane |
| **Leviathan** | low, broad, heavy-bellied, short wings, slow-massive read |
| **Wingless drake** | no wings at all — pure body+tail; runner/swimmer silhouette |
| **Amphithere** | winged serpent — long body + one big wing pair, no legs |

These differ in **topology**, not just scale — which is the only way to escape
reskins. The library is small, hand-authored, and bold (each is *designed* to
read at 40 m). Adding a body plan is a deliberate art act, not an optimizer knob.

> **Whether topology is allowed to vary is your call** (see §9). Allowing it
> (wyvern, wingless, serpent) is *by far* the biggest anti-reskin lever. If you'd
> rather keep every dragon a classic 4-leg/2-wing western, the same system still
> works — the variety then comes entirely from §3.2's wide proportions — but the
> ceiling on how different two dragons can look is much lower.

### 3.2 Proportions = wide, bold genes (not the timid ranges of v1)

On top of a body plan, a small gene sheet **warps the skeleton hard**. The
ranges are deliberately wide — sameness comes from timid ranges.

```js
DRAGON_PROPORTIONS = {
  mass:        { range: [0.55, 1.8] },   // skeletal hatchling ↔ tank   (was 0.7–1.3)
  neckLen:     { range: [0.5, 2.4] },    // stub ↔ swan                  (was 0.8–1.4)
  neckArch:    { range: [-0.3, 1.1] },   // lowered/stalking ↔ rearing high
  tailLen:     { range: [0.6, 2.6] },    // docked ↔ kite-tail
  tailTaper:   { range: [0.1, 0.8] },    // whip ↔ heavy club
  limbBulk:    { range: [0.4, 1.6] },
  wingAspect:  { range: [1.2, 3.6] },    // broad galleon ↔ long falcon
  wingSpan:    { range: [0.7, 1.7] },
  bellyDepth:  { range: [0.3, 1.4] },    // sleek ↔ pot-bellied
  posturePitch:{ range: [-0.3, 0.5] },   // hunched ↔ soaring
};
```

The "volume profile" (`mass`, `bellyDepth`, where girth sits along the spine) is
what makes one western drake a barrel-chested bruiser and another a sleek racer —
**same plan, unmistakably different animals.** That's the variety the reskin
system never had.

### 3.3 Dragon-cues = cheap, portable resemblance

Resemblance is the *easy* problem and gets a *small* budget: a short checklist of
features applied regardless of body plan — a reptilian wedge head, leathery
membrane on whatever wings exist, a scaled dorsal line following the spine,
clawed digits. These say "dragon" without dictating a body, so a wyvern, a
serpent and a drake all read as dragons while looking nothing alike. (This is the
inverse of v1, where a shared *body* carried resemblance and killed variety.)

### 3.4 Decoration = capped trim

Horns / spines / scale relief / crest are the **last** layer and are **capped**:
no creature may rely on decoration as its distinguishing feature (the §5 gate
enforces this by stripping decoration before measuring). Trim is for flavour and
charm, never for identity.

### 3.5 Skin = charm (kept from v1)

Bold separate primitives look like a modelling exercise until a unifying skin
pass goes over the whole assembly: **toon/gradient ramp + fresnel rim** (the
codebase already has `fresnelRimPatch`), **contact AO at joints** so parts read
as one creature, an **outline** (inverted-hull backface shell on mobile, post
pass on Ultra — the single biggest charm lever for a chase-cam game), and exactly
**five palette roles** (`base`, `accent`, `membrane`, `glow`, `eye`).

---

## 4. The prompt → creature pipeline (deterministic, no optimizer)

```
prompt ─►  ① CLASSIFY BODY PLAN  → wyvern | western | serpent | leviathan | …
       │     (the single most important decision; LLMs are strong at this)
       ├─►  ② FILL PROPORTIONS    (wide bounded slot-fill; unmentioned = default)
       ├─►  ③ DRAGON-CUES + DECOR (checklist on; pick capped trim enums)
       ├─►  ④ PALETTE             (prompt adjectives / reference image → 5 roles)
       └─►  ⑤ BUILD               buildFromBodyPlan(plan, props, cues, palette)  — deterministic
```

"A long serpentine green river-dragon with tiny wings" →
`plan: eastern, neckLen: 2.1, tailLen: 2.4, wingSpan: 0.7, mass: 0.7` →
a genuinely serpent-shaped body, not the western drake with a green reskin. The
prompt now moves the **silhouette**, because the silhouette is what the genes
control. Reference *images* map the same way: vision estimates the body plan +
proportions and samples the 5 palette roles — capturing the readable shape, which
is what "faithful" means for a stylised game.

---

## 5. The anti-reskin lock (the centrepiece of v2)

Variety is enforced by CI, and the gate is specifically built so **decoration and
colour cannot satisfy it**:

1. Render each creature from the chase cam **stripped to a single flat colour
   with all decoration removed** — the naked body silhouette.
2. Assert pairwise silhouette IoU is **below a ceiling**. Two creatures whose
   *bodies* are the same shape **fail**, even if their horns and palettes differ.
3. A second, looser pass on the *dressed* creature ensures decoration didn't
   accidentally erase a real body difference.

`tests/silhouette-spacing.mjs` (new). Today's silhouette tool measures overlap
*with a target*; this is the inverse — it fails when two of our own creatures
look too alike, with decoration taken off the table so it can't cheat. This gate
is what makes "no more reskins" a guarantee instead of a hope.

---

## 6. Ultra mode = same body, richer (iPhone 17 Pro Max / desktop NVIDIA ceiling)

Unchanged in spirit from v1. Ultra is the same body plan + proportions with the
detail dial up: higher `seg()` counts, rounder joints, the outline as a post
pass, plus opt-in shells mounted on the same skeleton — feather/fur shells
(phoenix plumage, dragon mane), instanced per-scale relief, membrane SSS +
iridescence. Mobile authoring stays the floor; Ultra only *adds*.

---

## 7. First hero: prove the inversion on three dragons

Coexist with the shipped roster; don't touch it.

1. **`creatureBodyPlans.js`** — register **3 body plans** that are obviously
   different silhouettes: e.g. `western` (bulky 4-leg drake), `wyvern` (2-leg,
   wing-arms), `eastern` (serpentine, tiny limbs). Each = a posed spine + limb
   skeleton + topology.
2. **`buildFromBodyPlan(plan, props, cues, palette, opts)`** — peer to
   `buildDragonModel()`. Build skeleton from the plan → warp by proportions →
   hang cheap body volume + cues → cap decoration → skin pass.
3. **`skinPass.js`** — toon + contact AO + outline + 5-role palette.
4. **Author one creature per plan, by genes only**, then run:
   - `tools/silhouette.mjs` chase-cam shots — eyeball that they read as three
     *different animals* that are still clearly dragons.
   - new `tests/silhouette-spacing.mjs` — assert the three pass the
     **decoration-stripped** distinctness gate.
   - `tools/tricount.mjs` — ≤6000 HIGH / ≤13000 ULTRA.
5. **Human judges** on the chase-cam preview: do these look like three distinct
   dragons or three reskins? If distinct, the inversion works — migrate the
   roster onto body plans, retiring the shared-loft + decoration-flag pattern.

---

## 8. v1 → v2: what changed and why

| | v1 (wrong) | **v2 (this)** |
|---|---|---|
| Diagnosed problem | dragons don't resemble each other | **dragons are reskins of one body** |
| Resemblance | guaranteed by a **fixed shared chassis** | a small portable **cue checklist** |
| Hero variation | decoration enums (horns/dorsal/tail) | **body plan + topology + wide proportions** |
| Gene ranges | tight ("keep it a dragon") | **wide** ("sameness comes from timid ranges") |
| Variety gate | hero-gene spacing | **decoration-stripped naked-silhouette spacing** |
| Decoration | promoted to hero | **demoted, capped, gate-excluded** |

Kept: chase-cam-first, bold primitives + toon-outline skin, deterministic
classify-then-fill prompt pipeline, Ultra-as-detail-dial.

---

## 9. The one open decision for you

**How far may a dragon's silhouette vary?**

- **A — Allow topology variety** (wyverns, serpents, wingless drakes share the
  roster): biggest escape from reskins; recommended. Risk: a casual player might
  not call a wingless serpent a "dragon."
- **B — Keep all dragons the classic 4-leg/2-wing western**, and get variety
  purely from §3.2's wide proportions: safer "reads as a dragon," lower variety
  ceiling, still far better than today.

The system is the same either way — B just disables the topology axis. Pick one
and the first-hero set in §7 adjusts (three western proportions vs three plans).
