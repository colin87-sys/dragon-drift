# Dragon Design System — the beauty pipeline

This is the canonical reference for **how new player dragons are designed, built, and
approved**. Its sibling `dragon-design-guide.md` owns *playability* (readability from the
chase camera, silhouette-vs-obstacle language); this doc owns *desirability* — making
dragons players want to own, screenshot, and pay for.

**Scope:** the design-overhaul arc builds 3 new hero dragons under this system without
touching the shipped roster. Every rule here exists because a previous session violated
it and the ledger recorded the cost (`LEAPFROG.md` L-numbers cited throughout).

---

## §1 The honesty protocol (read first — these are hard laws)

Two failure modes burned entire past sessions: *the AI claiming something is aesthetic
when it isn't*, and *the AI claiming a silhouette matches a reference when it clearly
doesn't* (the overlay-IoU loop topped out at ~40% against a 95% expectation and still
got described as "matching"). The rules that make both structurally impossible:

1. **The AI never self-certifies beauty.** Words like *beautiful / aesthetic / looks
   good / improved* are banned from AI-side claims. The AI reports **numbers from
   tools** (gate values, tri counts) and **ships images**; beauty verdicts come from
   exactly two places — the human at a gate, or nowhere.
2. **There is no "matches the reference" metric — by decision, not omission.**
   Concept art is **direction, not a match target**. Procedural geometry proved unable
   to reproduce drawn art (~40% ceiling), so this pipeline never promises it will. The
   built model is judged **as itself**, on committed renders and the PR preview. Any
   sentence of the form "the model now matches the concept" is invalid on its face.
3. **Every automated check emits its evidence.** `designcheck.mjs` prints the measured
   value next to its threshold (`A1 tail-taper 5.2 ≥ 4.0 OK`) — never a bare OK/FAIL.
   A claim without its number is treated as false.
4. **The human sees pixels, not prose.** Every gate's deliverable is committed images
   (concept sheets, blackout silhouettes, the PR preview) — never a verbal description
   of a render.
5. **Rejection means shape work, not argument.** A rejected form gets its stations and
   outlines changed and re-gated. Never re-litigate the rejection; never decorate
   around a rejected shape.

## §2 Pipeline overview

```
BRIEF (proportions + shape recipe, written FIRST)
  → CONCEPT ART (direction/mood; generated, iterated with the human)
    → HUMAN GATE: approved concept recorded in the BRIEF
      → PROCEDURAL BUILD (hull station profiles authored to the brief's numbers)
        → MACHINE GATES: designcheck --ci · tricount --ci · readability · run-all
          → COMMITTED RENDERS (blackout silhouettes, all forms/views)
            → HUMAN GATE: PR preview (shop card / showcase / flight / ascension)
```

The machine gates prove the **measurable** laws (proportion, taper, mass hierarchy,
negative space, palette structure). The human gates own everything the machine can't
measure — which includes *whether it's beautiful*. Neither substitutes for the other.

Concept images live in `docs/concepts/` — outside `reforged/`, so the game and service
worker can never ship them. Runtime stays 100% procedural.

## §3 Roster design language

**Gate 1 verdict (human, 2026-07-03, from the boards in `docs/concepts/style/`):**
the language is **mapped by tier**, not one-size-fits-all:

| Tier | Language | Board lineage |
|------|----------|---------------|
| Free starter (cute & collectible) | **Rounded apex curves** — smooth continuous loft, big eyes, soft rounded outlines | board 1 |
| Mid (SSR, majestic/sleek) | **Western/celestial** — regal western build with celestial luminous accents | boards 2+3 |
| Premium (SSSR, exotic) | **Sleek mythic** — the carved-idol value-tier language on a sleeker, less bulky curve language | board 4, slimmed |

Curve quality is carried by these languages (Gate-0 note: outlines/curves are the
historically weak axis) — every hero concept and build is judged against its tier's
board lineage by the human, never by the machine.

## §4 The design laws

> **Gate 0: thresholds approved by the human, 2026-07-03** (PR #201). Noted at
> approval: proportions are only part of the problem — outline/curve *quality* is the
> historically weak axis, and it is exactly what the machine can't gate. Curve
> character is therefore owned by the Gate-1 style language and the human render
> gates (S4/D4 stay HUMAN).

Each law names its **renderer lever** — the actual knob that controls it. A law with no
lever is an adjective, and adjectives are how past sessions wasted rounds (anti-pattern
§8.1). Thresholds are Gate-0-approved and adjustable **only here**; `designcheckCore.mjs`
reads them from its `THRESHOLDS` table, which must mirror this section.

Checks apply to dragons that declare a `design:` block in their def. The 17 shipped
dragons are **grandfathered**: reported informationally, never failed.

| Law | Statement | Threshold | Checked by | Renderer lever |
|-----|-----------|-----------|-----------|----------------|
| **S1** silhouette uniqueness | Rear-view apex silhouette differs from every other roster dragon | bbox-normalized XOR ≥ 0.15 | `checkS1` | station profile + wing outline (`wingForms` tips/lead) |
| **S2** negative space | Silhouette does not fill its own convex hull (holes/notches read at range) | fill ≤ 0.80 of hull area | `checkS2` | wing scallops, neck/tail gaps, `cy` arch |
| **S3** mass hierarchy | Three distinct masses (head/chest/hip), adjacent ratio ≥ 1.3 | ratio ≥ 1.3 | `checkS3` | station `halfWidth × (keelTop+belly)` area by z-bin |
| **S4** tangent avoidance | No outline curves kiss without crossing | — | HUMAN (renders) | station spacing, wing root placement |
| **A1** taper | Members taper toward extremities; tail base:tip ≥ 4:1 | ≥ 4.0 | `checkA1` | station `halfWidth` series |
| **A2** head scale is bimodal | Big-head (cute) OR small-head (majestic) — never the mushy middle | head:body ≥ 1/4 **or** ≤ 1/8 | `checkA2` | head-station lengths vs body length |
| **A3** hero feature | Exactly one signature feature, unique across the roster | declared + unique | `checkA3` | `design.heroFeature` string + its geometry |
| **D1** chest dominance | Chest is the largest mass; chest:hip ≥ 1.5 | ≥ 1.5 | `checkD1` | chest vs hip station areas |
| **D2** wing credibility | Span 1.8–2.2× body; chord ≥ 20% half-span; ≥ 3 membrane fingers; concave trailing edge | as stated | `checkD2` | `wingForms` (tips count, lead, tips polyline turning) |
| **D3** line of action | One continuous S-curve through the spine (no kink > 20°); ≥ 1 inflection; total bend 30–60° | as stated | `checkD3` | station `cy` channel (static — never a runtime pose) |
| **D4** head structure | Brow overhang, jaw notch, horn flow-through | — | HUMAN (renders) | head stations + horn/crest layers |
| **C1** palette structure | 60/30/10 dominant/secondary/accent by surface area | 60±12 / 30±10 / 10±6 | `checkC1` | material tri areas, tagged `userData.paletteTier` |
| **C2** value hierarchy | Adjacent palette tiers separated in lightness; max contrast at head/hero feature | ΔL\* ≥ 15 | `checkC2` | def palette hexes |
| **P1** preview asymmetry | Shop pose breaks symmetry (head turn 10–20°) without hiding the wings | mirror-XOR 0.05–0.10 | `checkP1` | `model.previewPose` (preview/shop only) |

Carried-over boss-arc laws that also bind here (L125/L126): painted value hierarchy
across 2–3 material tiers (the sun can't sculpt front faces in this camera rig); HDR
focal glows overdriven ~2.4× with `toneMapped=false`; **no enclosing fresnel shell**
around the body; satellites/orbiters stay dark; authored mirrored detail, never
random scatter ("randomness reads as noise, symmetry reads as intent").

## §5 Shape-language recipes

Vocabulary: **triangle** (aggression, speed), **square** (power, weight), **circle**
(friendliness, cuteness). Rules:

- **70/30**: one primary shape family ≈70% of the read, one secondary ≈30%. A third
  reads as noise.
- **One motif per dragon**: a single repeated geometric motif (a sweep angle, a curve
  radius, a notch shape) recurring at 3+ scales (silhouette → limb → detail).
- **The uniqueness ledger** — silhouette signatures are *authored here first*, so S1/A3
  uniqueness is designed, not discovered at gate time. Every new dragon adds a row
  before its brief is written:

| Dragon | Primary/secondary shape | Claimed silhouette signature | Hero feature |
|--------|------------------------|------------------------------|--------------|
| *(new heroes add rows at brief time; shipped roster rows optional/backfill)* | | | |

## §6 Proportion tables (station-profile terms)

Authored on the proven hull z-layout (nose ≈ −4 … tail tip ≈ +4.35; see
`dragonHullProfiles.js`). These are the numbers the briefs commit to and
`designcheck` verifies:

| Property | Cute (starter) | Sleek/majestic (mid) | Exotic (premium) |
|----------|---------------|----------------------|------------------|
| head : body length | ≥ 1/4 (big head) | ≤ 1/8 (small head) | ≤ 1/8, or ≥1/4 if the exotic read demands it |
| wingspan : body length | 1.8–2.0× | 2.0–2.2× | 1.8–2.2× |
| chest : hip section area | ≥ 1.5 | ≥ 1.5 | ≥ 1.5 |
| tail base : tip halfWidth | ≥ 4:1 | ≥ 4:1 | ≥ 4:1 |
| spine bend (D3 total) | 30–45° (soft) | 40–60° (dramatic) | 30–60° |
| wing chord : half-span | ≥ 0.20 | ≥ 0.20 | ≥ 0.20 |

## §7 Palette rules

- **60/30/10 by area** (C1), measured on built tri areas per material tier.
- **ΔL\* ≥ 15** between adjacent tiers (C2), Lab lightness; max contrast lands at the
  head / hero feature.
- Accent color appears at: eyes, hero feature, and one FX echo (trail/glow) — nowhere
  else.
- Builders tag every material `userData.paletteTier = 'dominant'|'secondary'|'accent'`
  so C1/C2 are measurable.
- Boss-arc carryovers (§4) apply to any glow/emissive work.

## §8 Anti-pattern appendix (the ledger's greatest failures)

1. **Adjectives with no renderer lever** — "make it more majestic" iterated blind.
   Every law above names its knob. (the pre-L108 procedural arc)
2. **Bolted-on parts** — separate meshes gap/collide at the seams; bodies are ONE
   continuous hull (L20–L23, L32).
3. **Claiming a match that isn't there** — the overlay-IoU era. Dead; see §1.2.
4. **Decorating around a bad shape** — glow/layers on a rejected silhouette. Shape
   first (§1.5); decoration is Phase-last.
5. **Random scatter as detail** — reads as debris; author mirrored, named placements
   (L126).
6. **Enclosing fresnel shells** — erase the silhouette they mean to sell (L125).
7. **Metallic-looking hide from geometry, not material** — loft banding rings; fix
   geometry (smooth resample), not roughness (L32).

## §9 Per-dragon design brief template

One `docs/concepts/<key>/BRIEF.md` per dragon, written **before** any art:

```markdown
# <Name> — <epithet>
key: <key> · rarity: <R/SR/SSR/SSSR> · cost: <n> · forms: <3|4>
fantasy: <one sentence — what owning this dragon feels like>

## Shape recipe (write FIRST — proportion before decoration)
primary/secondary shape: <triangle/square/circle 70/30>
motif: <the one repeated element, at 3 scales>
silhouette signature: <one sentence, added to the §5 ledger>
hero feature: <the single A3 feature>

## Proportion targets (§6 numbers this dragon commits to)
head:body <n> · wingspan <n>× · chest:hip <n> · tail taper <n>:1 · spine bend <n>°

## Palette
dominant #<hex> (60) · secondary #<hex> (30) · accent #<hex> (10)
value ramp: <L* numbers, ΔL ≥ 15>

## Evolution story (per form: what accretes, silhouette ramp lever)
F0 hatchling: … F1: … F2: … [F3 apex: …]

## Playability envelope
<confirm readability.mjs constraints: chase-cam legibility, no obstacle-language clash>

## Concept art (direction only — see §1.2)
concept: <files, committed>
approved: <date> by <human>   ← written ONLY by the human's explicit sign-off
```

## §10 Command loop (build → verify)

```bash
# author stations/outlines in dragonHeroProfiles.js + the def, then:
node reforged/tools/silhouette.mjs <key> side 2      # blackout renders, commit them
node reforged/tools/silhouette.mjs <key> rear 0      # …per form, per view
node reforged/tools/designcheck.mjs <key>            # all measurable laws, with numbers
node reforged/tools/tricount.mjs --ci                # ≤6000/form (13000 ultra)
node reforged/tools/readability.mjs <key>            # playability envelope
node reforged/tests/run-all.mjs                      # nothing shipped regressed
# then: commit → PR preview → the human judges with Settings → Dev Mode on
```

The human judges motion/feel/beauty **only** on the PR preview (no WebGL in CI —
Chromium CDN is blocked; L-ledger standing rule).
