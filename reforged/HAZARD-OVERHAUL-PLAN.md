# HAZARD OVERHAUL PLAN — premium hazards, de-scoped to the three biomes that are actually empty

*Child of [`FLOW-OVERHAUL-PLAN.md`](./FLOW-OVERHAUL-PLAN.md) P1.4 ("fill the 6 empty
biomes") and sibling of [`DRIFT-BUILD-PLAN.md`](./DRIFT-BUILD-PLAN.md). This is the
**reconciled** output of the third follow-on Fable design thread after its adversary audit —
critic verdict **GO-WITH-CHANGES; de-scope 8 PRs → 5**. The audit's headline: "6 empty
biomes" is really **3**, the shipped telegraphs have an aliasing bug and a fairness-tell
bolt offset, and the hazard RNG stream has a determinism landmine that the gold fixture
can't see. Read [`BIOME-DESIGN.md`](./BIOME-DESIGN.md) §5.3 for the hazard laws this
builds on and [`AAA-PIPELINE.md`](./AAA-PIPELINE.md) for the value-structure vocabulary.*

---

## 0. TL;DR

- **Autopsy:** both shipped hazards = premium groundwork (the Scourmaw vent-site) wearing
  cheap "magenta `makeGlowTexture` Sprite" telegraphs. Two real bugs: an **aliased pulse**
  (lightning) and a **bolt/hitbox offset** (a fairness tell).
- **Every hazard ships all 5 anatomy parts** (§2): SITE · FOOTPRINT · TELEGRAPH · STRIKE ·
  AFTERMATH.
- **Laws:** dodge in SPACE not TIME with a ≤3 m last-second displacement bound (§3.1);
  ≤2 large additive surfaces on screen (§3.2); per-block hazard RNG streams + a fixture
  that actually covers `out.hazards` (§3.3).
- **Lineup (de-scoped):** hero reforge (Caldera) + substrate + **three** new hazards
  (Astral, Wastes, Frozen). CUT Solar Veils (Aurora); DEFER Drowning Veils (Lagoon) +
  Sporelung Pods (Mire); the Tempest fix ships as the substrate proof but reaches players
  only after a CYCLE flip. **5 PRs**, not 10.

---

## 1. AUTOPSY (verified against the shipped code)

Exactly two `hazard:` blocks ship: Caldera geyser (`biomes.js:176`) and Tempest lightning
(`biomes.js:403`). Both route placement through the dedicated `hazardRnd` stream
(`level.js:593-628`) and runtime through `hazards.js` — that substrate is sound. The
presentation is where premium dies:

- **Geyser column** = one open `CylinderGeometry(0.55, 0.9, H, 7, 1, true)` with uniform
  emissive (`hazards.js:137-142`) — the LED-strip + flat-tape tells from the
  AAA-PIPELINE registry, verbatim. Eruption = a linear Y-scale snap (`hazards.js:246-253`);
  a jet with no structure, no core→bloom→dark.
- **The flare Sprite can't depict a ground footprint** — it's billboarded
  (`hazards.js:192-198`): at grazing camera angles a "disc lying flat on the water" turns
  to face you and the lethal circle it claims to mark stops being where it says.
- **No world light on the lava** — the strike doesn't answer in the environment at all.
- **Lightning telegraph** = two magenta glow Sprites (`hazards.js:163-166`) + a pulse
  that's **aliased garbage**: `sin(time × pulseHz × 6.283)` with `pulseHz` itself ramping
  (`hazards.js:220-221`). Evaluating a chirp by multiplying *absolute time* by a changing
  frequency produces an effective rate of hundreds of Hz once `time` is large — past the
  first minute the "2→5 Hz accelerando" is shimmer noise. **MUST be a phase accumulator**
  (`phase += pulseHz·dt`, then `sin(phase·2π)`).
- **KEEP the bolt** — `stormLightning.js` is genuine core→bloom→dark (three-pass
  polyline + glare + sea-ring) and stays.
- **BOLT/HITBOX BUG:** the bolt's sea-contact drifts **6–16 m downwind** of the site
  (`stormLightning.js:80-81`, `botX = x + _wind.x * (6 + rand·10)`) while the collision
  cylinder is 3.2 m at the site (`hazards.js:233-235`, `biomes.js:403`). The visible
  strike and the thing that kills you are different places — a fairness tell. **FIX:** pin
  the *hazard* bolt's contact to the footprint (render-only, zero determinism risk);
  ambient hero bolts keep their wind drift.

---

## 2. PREMIUM ANATOMY — every hazard ships all five

1. **SITE** — persistent, withheld-glow, value-structured, biome-identifying. The Scourmaw
   (`hazards.js:96-131`, doc block :75-94) is the proven template: void-black basin, ash
   iris, belly-seam fire only at the waterline.
2. **FOOTPRINT** — an on-surface decal **MESH** with shader alpha-falloff,
   `radius == collision radius`, **NEVER a billboarded Sprite or an onion-ring texture**
   (registry tells #onion-glow + the §1 grazing-angle failure).
3. **TELEGRAPH** — an *event*: anticipation → erratic **phase-accumulator** flicker →
   commit spike. It grows STRUCTURE, not opacity; readable ≥90 m in that biome's fog.
4. **STRIKE** — core→bloom→dark, plus a shared `hazardFlash(kind, x, z, peak)`
   world-response via UNIFORM fan-out the way `stormLightning` does its sky/rain flash —
   **NO per-vent PointLight** (each one taxes every `MeshStandardMaterial` in the frame).
5. **AFTERMATH** — 0.5–1.5 s decay (steam, char, settling light). A strike that vanishes
   on its last lethal frame reads as a video-game toggle, not weather.

---

## 3. THE LAWS

### 3.1 Geyser-timing law, with a numeric bound

Dodge in **SPACE not TIME**: a fixed footprint — or, if the footprint moves, motion
bounded so **gap-displacement over the final ~1 s of approach ≤ ~3 m**. NOT the draft's
"≤0.4× lateral authority" ratio — that ignores approach time (at 0.4× = 9.6 m/s a gap
drifts ~22 m over a 2.3 s approach; "slower than the player" still un-dodges a committed
line). The bound goes in config comments next to any motion dial.

### 3.2 60 fps — the additive budget

The cliff is stacked additive/fresnel coverage: 2 large stacked shells ≈ the cliff
(`BIOME-DESIGN.md:152-155`); `tools/envcount.mjs` calls the additive census "THE NUMBER
THAT MATTERS" and it is. Rules: opaque or `LineSegments` cores; **≤1 large additive
surface per hazard instance**, AND a distance-gated demotion rule so **≤2 large additive
surfaces on screen including the boss kit**; pooled spectacle (POOL = 3, the
`stormLightning` pattern); fly-THROUGH translucent sheets/curtains are overdraw bombs —
banned.

### 3.3 The determinism landmine (fix in the substrate PR)

Two compounding facts:

1. `out.hazards` is **non-fixtured** — the filter comment says so outright
   (`level.js:619-622`), so `tests/gold-determinism.mjs` stays green *no matter what
   hazard placement does*. The gate that's supposed to catch a hazard regression can't
   see hazards.
2. The cursor only consumes `hazardRnd` where a biome HAS a hazard block
   (`level.js:602-617`; the no-hazard branch deliberately steps without drawing). So
   **adding a hazard to any earlier-cycle biome silently reshuffles all downstream hazard
   placement for the same seed** — every Caldera/Tempest vent moves, invisibly.

**FIX:** per-block hazard streams — `mulberry32(seed ^ CONST ^ blockIndex)` so each biome
block owns its draws and new hazards can't shift a neighbour — plus extend the fixture to
cover `out.hazards`, with **one blessed re-baseline** of `tests/fixtures/course-1337.json`.

---

## 4. THE DE-SCOPED LINEUP — "6 empty biomes" is really 3

The audit, biome by biome (indices per `biomes.js`; CYCLE at `biomes.js:475`):

| Biome | Draft plan | RECONCILED verdict | Why |
|---|---|---|---|
| Aurora Shallows (6) | Solar Veils | **CUT** | ~70–80% hazard-suppressed already: the guaranteed flow run (`config.js:132-144`) + the canyon-window hazard filter (`level.js:619-628`) delete most placements. A hazard for the sliver that survives is content nobody meets. |
| Lumen Mire (4) | Sporelung Pods | **DEFER / demote** | Mire is the RATIFIED breather (`BIOME-DESIGN.md:264-269` — "deliberately the breather biome; hazard is mild"). Keep the doc's mild spore-vignette slot; no full hazard. |
| Lost Lagoon (0) | Drowning Veils | **DEFER** | The starter biome has **no `hazardFirstAt` floor** (contrast `canyonFirstAt: 900`, `config.js:206`) — a hazard here greets minute one. Defer until the floor exists AND the "water climbs → crest over" timing-dodge is frozen to a static full-height gap (§3.1). |
| Tempest Reach (7) | Stepped Leader | **BUILD as substrate proof** | Tempest is `BIOMES[7]`, **NOT in CYCLE** (`biomes.js:328`, `CYCLE = [0,1,2,3,4,6,5]` at `:475`). The telegraph fix ships as the substrate migration proof but reaches players only after a CYCLE flip — **schedule the flip, don't assume it**. |
| Astral Shallows (5) | Eventide Wells | **BUILD** | Legit empty. |
| Amber Wastes (1) | Glassgrind Shears | **BUILD** | Legit empty. |
| Frozen Reach (2) | Marrow Falls | **BUILD** | Legit empty. |
| Emberfall Caldera (3) | Pyre Geyser reforge | **BUILD (hero)** | Presentation-only; gameplay FROZEN. |

**The three new builds:**

- **EVENTIDE WELLS (Astral, new-class prover).** A ZERO-timing hazard: a void-core +
  accretion ring that is simply *always* lethal at its fixed footprint — the law-cleanest
  design in the lineup (nothing to sync to, pure space-dodge). One story to solve:
  persistent SITES get wiped by `resetHazards` on `bossStart` (`hazards.js:295-299`, the
  clean-arena call) — a landmark that blinks out at the boss seam needs a fade/exempt
  story, not a pop.
- **GLASSGRIND SHEARS (Wastes).** STATIC diagonal thin-ribbon barriers **first** — drift
  is a deferred, owner-gated dial with the §3.1 ≤3 m bound written in the config comment.
  Thin-ribbon + `NormalBlending` seam, not additive sheets (§3.2, and the washed-fringe
  rule below).
- **MARROW FALLS (Frozen, the ONE compliant new-tech design).** 1 `InstancedMesh`, static
  matrices, per-instance-phase **vertex shader** animation (never per-frame
  `instanceMatrix` writes — the L124/L126 jank lineage, `BIOME-DESIGN.md:156-157`).
  Geyser-contract cyclic; fog-band readability gated by `tests/bulletcontrast.mjs`.

**Plus:**

- **PYRE GEYSER reforge (Caldera, the HERO).** Presentation-only, gameplay FROZEN
  byte-for-byte, behind `?haz=v1` exactly like the shipped `?props=v1` flip
  (`hazards.js:26-28`). The Scourmaw keeps its site; the column, footprint, telegraph,
  strike and aftermath are rebuilt to §2.
- **STEPPED LEADER (Tempest telegraph).** The phase-accumulator chirp + structural
  build-up (a descending leader, not a brighter sprite) + the §1 bolt-contact pin.
- **Near-miss/DRIFT hook:** threading a charged/lethal hazard within `radius + 2.5` feeds
  DRIFT; idle vents pay nothing. Reuse the `nearMissCooldowns` machinery
  (`collision.js:74-78`). This is a **GAMEPLAY change → owner-gated, and it belongs in
  the substrate PR**, not hidden inside a presentation PR.
- **Washed-fringe rule (Wastes/Aurora bright skies):** footprint decals and seams must
  alpha-composite (`NormalBlending`), never additive (AAA-PIPELINE registry #7 —
  additive-over-bright = invisible fringe), verified by `bulletcontrast` channel ordering.

---

## 5. ROLLOUT — 5 PRs (+ deferrals), coexist → hero → migrate

1. **PR1 — HERO: Pyre Geyser reforge** (Caldera, `?haz=v1` rollback). Ships the capture
   tooling with it: extend `tools/hazshot.mjs` to per-hazard idle/charge/strike/aftermath
   stills, and extend the `tools/envcount.mjs` additive census to the hazard kit + the
   on-screen demotion rule.
2. **PR2 — SUBSTRATE: `hazardFX.js`** — per-block hazard streams + the `out.hazards`
   fixture (one blessed re-baseline, §3.3) + shared `hazardFlash` uniform fan-out + the
   owner-gated near-miss/DRIFT hook + migrate the lightning telegraph to the
   stepped-leader (the substrate's migration proof, §4).
3. **PR3 — EVENTIDE WELLS** (Astral) — the new-class prover; solves the
   `resetHazards`-vs-persistent-site story.
4. **PR4 — GLASSGRIND SHEARS** (Wastes) — static geometry, drift dial frozen.
5. **PR5 — MARROW FALLS** (Frozen) — the instanced vertex-shader build.

**CUT:** Solar Veils. **DEFER:** Drowning Veils (needs the hazardFirstAt floor + the
frozen-gap redesign), Sporelung Pods (breather ruling stands). **SCHEDULE:** the Tempest
CYCLE flip as its own decision — this plan does not assume it.

---

## 6. VERIFY — every PR gates on all of it

- `tests/gold-determinism.mjs` **+ the new hazard fixture** (post-PR2 the fixture actually
  covers `out.hazards` — §3.3).
- `tests/bulletcontrast.mjs` — the magenta seam wins in that biome's fog band (and the
  washed-fringe channel ordering on bright biomes).
- `tools/tricount.mjs` + the `tools/envcount.mjs` additive census: ≤2 large additive
  surfaces on screen **including the boss kit**, demotion rule proven.
- `tools/hazshot.mjs` captures: idle / charge / strike / aftermath, judged in-context
  against the biome's premium props (the harness's whole point).
- **Three judges (AAA-PIPELINE):** the machine numbers above → harsh Fable ≥4.2 per
  checkpoint → owner feel on the PR preview.
