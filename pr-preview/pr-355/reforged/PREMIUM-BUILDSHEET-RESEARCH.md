# PREMIUM BUILD-SHEET RESEARCH — Pearl Seraph · Obsidian Shade · Solar Sovereign

> **Purpose.** This is the *data-gathering* pass that precedes authoring the three
> §5d build sheets called for by `PREMIUMREDESIGNCHARTER.md`. It does NOT author the
> sheets, pick art directions, or touch any builder. It establishes (a) the verified
> code ground-truth for each target, (b) the exact data a §5d sheet requires (adapted
> from 3-form starters to 4-form premiums), (c) what the aesthetic laws + the premium
> rarity ladder demand, (d) the reusable prior art, and (e) the decisions still open
> before a sheet can be written. Everything under "FACT" was read out of the code on
> the research branch; everything under "GAP" or "PROPOSAL" is a decision for the human.
>
> Source of truth is the code (§9 conflict rule). Where the charter's snapshot table
> disagrees with the code, the disagreement is flagged in §7.

---

## 1. The three targets at a glance (FACT — verified in `reforged/js/dragons.js`)

| key | display name | rarity → cap | cost | forms | maxTier | `parts` (torso / wings / head / tail / surface) |
|-----|--------------|--------------|------|-------|---------|--------------------------------------------------|
| `pearl` | **Pearl Seraph** | SSR → **SSSR** | 3400 | 4 | 3 | `seraphHull` / `seraphWing` / `seraphCrownHead` / `seraphTail` |
| `obsidian` | **Obsidian Shade** | SSR → **SSSR** | 2200 | 4 | 3 | `unifiedHullTorso` / `unifiedHull` / `draconic` / `sweptTail` · surface `['cellularScales','iridescence']` + `shingle` |
| `solar` | **Solar Sovereign** | **SSSR** → SSSR | 5000 | 4 | 3 | **defaults**: `arrow` / `membrane` / `horned` / `clean` · surface `['cellularScales','iridescence']` |

- `maxTierFor()` (`ascension.js:53`) returns **3** for all three (SSSR cap; `ASCENSION_TIERS.length === 3`). Every "per reachable form" instruction runs **0–3** (Hatchling / Kindled / Radiant / **Eternal**). A 5th tile in any montage is a PHANTOM FORM.
- `forms[]` is length 4 and **accretes cumulatively** (`ascension.js` merges `forms[0..tier]` onto `d.model` + `d`). Per-form dials inherit forward unless re-declared.
- **Contract fields that must NOT change** (saves + shop): `key`, `name`, `rarity`, `maxRarity`, `cost`, `stats`, `fx.auraColor`. `forms[]` stays accretive and length 4.

### Current tri budget per form (FACT — `node tools/tricount.mjs`, HIGH detail, 6000 ceiling)

| form | pearl | obsidian | solar |
|------|-------|----------|-------|
| 0 Hatchling | 3435 | 3378 | 2614 |
| 1 Kindled | 3742 | 3510 | 2989 |
| 2 Radiant | 4302 | 3550 | 3340 |
| 3 Eternal | **4506** | **3662** | **3499** |

All three sit **well under the 6000 ceiling at every form** — apex ≤ 4506. There is real triangle headroom (~1500–2500 tris at apex) to spend on premium richness. Per §1 canvas: the apex must read *visibly* richer than Radiant — spend the ceiling.

---

## 2. Per-dragon ground truth (FACT)

### 2a. Pearl Seraph (`pearl`) — the most bespoke; the "Radiant Paladin"
- **Stats** `speed 1.13 / handling 1.22 / drain 0.78 / regen 1.25`. **fx** `auraColor '180,210,255'`, `auraIdle 0.08`, **`sparkle: true`**. `lanceTint 0x7ec8ff` (seraphWing rune).
- **Body plan** (comment + builders): celestial SERAPH — a slim matte-pearl paladin HULL with a gilded gorget collar + shoulder pauldrons that receive the wings, a long noble neck, a crowned skull, and a **real-geometry crown-halo** (tilted gold ring + shards + gems, gated `model.halo` per form). Holy white, deliberately set apart from Phoenix's flame-gold.
- **Wings** `seraphWing`: 3-hinge cascade rig (`wingPivot→wingMid→wingTip`), overlapping gilded **feather-scale leaf/shield cards** (per-form `FEATHER_ROWS`), broad, strongly UP-RAISED ("angel spreading"). Not a bat membrane. `wingParts:3`, `wingDihedralDeg:14`, `wingChordScale:1.4`. Two-channel **YOKE flap solver** (`model.flap{…}`) — cathedral-arch apex.
- **Head** `seraphCrownHead`, **Tail** `seraphTail` (comet/banner bloom streaming +z — the chase-cam rear hero). Both self-register in `dragonSeraphBody.js` / `dragonSeraph.js`.
- **Per-form drama ladder** (`forms[]`):
  - 0 — `tailStyle:'simple'`, `spineGlow 0`, `crest 0`, no halo. Muted blue-grey pearls (`body 0xb8c0d0`).
  - 1 — `tailStyle:'finned'`, `spineGlow 0.3`, `bladeFins:true`, `crest 1`. Brighter (`body 0xdde6f5`), gold horn `0xffd86a`.
  - 2 — `tailStyle:'blade'`, `spineGlow 0.65`, **`glowSeams:true`, `halo:true`**, `crest 2`, `wingGild 0xd9b04c`. Ivory body `0xeae6dc`.
  - 3 — `tailStyle:'comet'`, `spineGlow 1.0`, **`wingVeins:true`, `glowSeams:true`, `halo:true`, `backCrest:true`**, `crest 2`. White-gold `body 0xf2f0ea`, `wingGild 0xe0b94f`.
- **Premium fx already used**: `sparkle`, `auraIdle 0.08`, `halo`, `glowSeams`, `wingVeins`, `spineGlow` up to 1.0 — the full premium kit is on.
- **Surface language constants** (in-builder, from L82): `SERAPH_PEARL 0xF2F0EA`, `SERAPH_GOLD 0xD6AF4A` (true metallic gild), `SERAPH_DAWN 0x88DFFF` (seam), `SERAPH_HOLY 0xFFF3C8`, `SERAPH_GEM 0x8FEAFF`. `def.wingGild ?? SERAPH_GOLD` etc. so per-form tint still overrides.

### 2b. Obsidian Shade (`obsidian`) — the unified-skin Night Fury
- **Stats** `speed 1.1 / handling 1.16 / drain 0.84 / regen 1.18`. **fx** `auraColor '50,110,140'`, `auraIdle 0.0`, `sparkle: false` (matte stealth — reads black in cruise). `lanceTint 0x9bff3a` (nightEye).
- **Body plan**: Night-Fury **UNIFIED SKINNED HULL** — body + wings are ONE continuous procedural skin (the L23/L24/L25 weld; `unifiedHullTorso` + `unifiedHull` share a 7-bone skeleton so the wing-root verts can never separate from the body flank). Soft-Stealth `draconic` head (large catlike acid-GREEN eyes, ear-fins), twin `sweptTail` fan-fins. Matte jet-black; plasma-cyan held for the **Night-Surge** moment only.
- **Surface**: `['cellularScales','iridescence']` + a **`shingle`** array (overlapping dark cupped flank plates arriving at Radiant/Eternal + a shoulder mantle at Eternal — "armors up"). `wingSSS:true` (backlit membrane subsurface). `shoulderWidthScale 1.2`, `wingRootScale 1.5`.
- **Wings** `wingForms[0..3]`: broad rounded bat-paddles, deeply-scalloped fanned trailing edge (`scallop 0.22→0.40`), finger-count grows 3→6 tips across forms; `wingSpan 0.85→1.10`, `wingChord 1.40→1.90`.
- **Per-form drama ladder**: authored from named constants; drama target Hatchling 25% · Kindled 45% · Radiant 70% · Eternal 100%. `bodyScale 0.65→1.12`, `bodyStretch 1.18` at apex, `glowIntensity 0.25→1.30`, `particleRate 0.30→1.80`, apex adds `tailRootCollar`, `wingParticleRate`, `surgeGlowMultiplier 1.3`.
- **NOTE**: `wingVeins/glowSeams/wingEdgeGlow` are explicitly **`false`** at Radiant + Eternal — Obsidian deliberately withholds idle glow-seams (its drama is the Night-Surge burst, not a lit cruise silhouette). This is a design signature to preserve or consciously invert.
- **Sibling creatures (read-only, do NOT touch)**: `obsidian2` ("Obsidian Shade II", clean-sheet `organismTorso`/`organismWings`, matte hide, no shingle) and `toothless` (`nightFuryTorso`/`nightFuryWings`, head/tail OFF) are separate roster entries that clone/iterate the same identity. Any Obsidian redesign must stay distinct from BOTH.

### 2c. Solar Sovereign (`solar`) — the least bespoke; rides DEFAULT geometry
- **Stats** `speed 1.16 / handling 1.28 / drain 0.7 / regen 1.35` (roster-top handling/regen). **fx** `auraColor '122,92,255'`, `auraIdle 0.0`, `sparkle: false`. `lanceTint 0xc27bff` (solarCrown / royal violet).
- **⚠ Body plan is NOT bespoke.** `parts` declares **only** `surface: { shader: ['cellularScales','iridescence'] }`. Via `resolveRecipe()` (`dragonRecipe.js:59`) this falls back to the engine **defaults**: `torso:'arrow'`, `wings:'membrane'`, `head:'horned'`, `tail:'clean'` (because `model.tailStyle` is set per form). So Solar is a **legacy arrow-loft body + generic membrane wings + horned head**, wrapped in the cellular/iridescent surface shader — the *most generic* of the three, despite being the highest-cost SSSR. This is the biggest elevation opportunity and directly contradicts the charter's "faceted / cellularScales+iridescence surface" snapshot (see §7).
- **Palette** (despite the "Solar" name): a **cool ECLIPSE dragon** — midnight-indigo body (`0x080b14`), antique-gold crown/spine (`0xd4a84f`), dark burnt-crimson wings (`wingInner 0x9c2233 → wingOuter 0x5a160e`), blue-violet/cyan eclipse core (`coreGlow/apexSeam 0xb784ff`). Explicitly "the dark, cool-toned counterpoint to the Phoenix's white-gold solar fire … NOT a bright flame-wyvern." Surge = "Eclipse Surge" (cool arcane, `feverWing 0x8a5cf0`).
- **Per-form ladder** (`forms[]`, no per-form `bodyScale` — size rides base `scale 1.22` + SIZE_RAMP): `wingForm 0→3`, `tailStyle simple→finned→blade→comet`, `spineGlow 0→0.34→0.7→1.0`, horns `1→2 pairs / hornLen 1.0→1.7`, apex adds `tusks`, `backCrest`, `auraHalo`, `wingVeins`, `glowSeams`.
- **Premium fx already used**: `glowSeams`, `wingVeins`, `auraHalo`, `spineGlow 1.0`, tusks, crest 3. (No `sparkle`/`auraIdle` — those are Pearl's.)

---

## 3. What a §5d BUILD SHEET requires (the data fields to fill)

A sheet is the builder's contract (DRAGON-DESIGN §5d). To author one for a premium key you must supply, per dragon, the following — **each numeric field needs a value + a one-line rationale**, and each is later asserted by `tests/starters.mjs` (§7) and judged by the Fable gate (§8). Adapted from the 3-form starter format to **4 forms (0–3)**:

1. **Torso** — the body-plan builder (name) + the silhouette primitive it must read as (△/□/○/serpent/etc.) + the body-value ramp across 4 forms (hue held, value/saturation ramp per law 9).
2. **Wings (the HERO)** — the architecture, the per-form element count, the **separation metric** (gaps / z-stagger / scallop / tip-notch depth — the wing-law column), spar:membrane or blade construction, **apex span : body-length** band, **apex single-wing area : body side-area** band, sweep/dihedral (glide), and the declared **motion path** (`wingPivotL/R` direct, `wingRigL/R` skinned, or a yoke `model.flap`) — §7 asserts the rig parts exist and that driving the fold contracts the span ≤0.7×.
3. **Head** — builder + archetype/dials (`headScale`, `snoutScale`/`Type`, `browIntensity`, eye character), and the round→almond eye-shape arc across forms.
4. **Tail** — builder + `tailStyle` per form + the apex read.
5. **Motif** — the ONE identity feature with a **fixed anchor + base hue that never move**, blooming across the 4 forms (≈**0.25 → 0.5 → 0.75 → 1.0** of final glory for 4 forms; the 3-form 0.3/0.6/1.0 ladder stretches to 4). Plus, if the anchor is invisible from the chase cam (§1), a **rear-visible lockstep carrier** that blooms in step (as jade's rear-lobe rim + Pearl's tail-veil do).
6. **Forms** — the per-form prose: what each of 0/1/2/3 reads as, which dials move, monotonic direction. Every proportion moves ONE direction across the 4 forms.
7. **Palette** — ONE anchor hue + ONE accent, held across forms; the law-9 **carrier** (where the accent is allowed to live — edges/rays/tips, the 10%); the machine-readable `def.accentHue` (so tests + gate share ground truth); which emissives are tinted to the accent (off-palette emissive is a silent killer — L-series).
8. **Tri targets** — per form (±20%, under 6000). Guideline allocation: apex must be visibly richer.
9. **Engine needs** — any new/extended builder, grammar dial (`forms:true` flag), motif socket, or assert-metadata handle the sheet requires that doesn't exist yet.

**Two companion artifacts ship with each sheet** (charter §2.3):
- a **registry §5 row** (anti-collision: no two dragons share >1 cell in any column pair; wing architecture is the headline differentiator; a roster-neighbor differentiator list).
- a **4-form `tests/starters.mjs` SPEC** (per-form band + monotonicity asserts, wing element count/separation, motif anchor invariance, taper, line-of-action inflection, palette accent-hue check).

---

## 4. Aesthetics · premium read · SSR/SSSR — what the laws demand (RESEARCH)

### 4a. The bar
"A dragon that is merely correct FAILS. Would a stranger screenshot it unprompted?" The Fable **aesthetics gate** (an independent `fable`-model agent, spawned fresh per round, that re-reads the docs and trusts nothing else) is the only visual judge; the human judges motion/feel on the PR preview. **PASS bar: no scored axis ≤ 2 AND average ≥ 4.0**, across 8 axes: *silhouette appeal · line of action · taper/shape contrast · wing majesty · wing-surface detail · hierarchy · color/rim beauty · life.*

### 4b. The 12 aesthetic laws (§2, condensed)
1. Silhouette-first — one connected black-fill component; wings don't fully overlap the body outline (negative space is design). 2. Line of action — spine is a C/S curve with ≥1 inflection; straight axis forbidden. 3. Mass hierarchy per view (side: body 55–65%; rear-chase: wings 50–65%); adjacent major masses target ~1.6, never 0.9–1.1. 4. Taper law — everything tapers monotonically, tip 10–20% of base. 5. Repetition with variation — ~×0.8/step or swell-then-taper. 6. Curve-vs-straight contrast in every region. 7. No tangents (clear overlap or clear gap). 8. Detail hierarchy (dense at head/joints, sparse on masses). 9. Palette discipline (1 anchor + 1 accent held across forms; accents on the 10% edges/rays/tips; identity hue may live in emissive, diffuse stays controlled). 10. Life over symmetry. 11. Painted + sculpted depth (2–3 value tiers + real relief). **12. Rarity ceiling.**

### 4c. The PREMIUM INVERSION of law 12 (the load-bearing difference — charter §2.2)
Starters are *forbidden* `glowSeams`, `wingVeins`, halos, `auraIdle>0`, `sparkle`, premium bloom, `spineGlow>0.32`, >1 bloom point — restraint is their read. **SSR/SSSR dragons EARN all of these — that is the rarity ladder.** So for these three:
- Judge **premium drama**, not starter restraint. Pearl's dawn halo, Obsidian's Night-Surge plasma, Solar's radiant/eclipse crown are **on-brief**.
- The §5d starter sheets are **tone references, not caps**. Multiple bloom points, lit seams, veined membranes, idle auras, sparkle are all permitted where they serve the identity.
- The rarity ladder should still **read in the geometry + fx escalation across the 4 forms** — Hatchling restrained → Eternal fully-decked, glowing, earned apex (the drama ramps already encoded: Obsidian 25→100%, spineGlow 0→1.0, particleRate up, etc.).
- Premium ≠ "add every effect." §7 still asserts palette discipline (accent within ±20° of `accentHue`; membrane diffuse stays controlled so glow reads AS glow, not toy-color). Overdraw is still the perf cliff (≤2 alpha layers/pixel; no enclosing fresnel shell) — L-series + §1.

### 4d. The WING LAW universal clauses (§3 — the hero feature, all architectures)
Swell-then-taper element progression (never sunburst from a point; ~0.8–0.85 scale/element; every element tapers to a point) · leading-edge visual weight vs thin trailing side · camber (every surface cupped, never a flat quad) · rim beauty (fresnel + backlit emissive, gradient to tips, ribs are geometry not decals) · two-tone dorsal/ventral · **the fold must change the silhouette** (bank/dive contracts span, §7 asserts ≤0.7×) · 2–3 painted value tiers. "Backpack wings" (undersized) and "MITTEN" (filled web, no gaps) both fail.

### 4e. The 4-form growth arc (§4, extended)
The **bloom rule (Bulbasaur law)**: one motif whose anchor + base hue NEVER move; only scale/detail/count grow. Hatchling must visibly hint at the apex. "Motif drift" and "same-dragon-bigger" (ladder that only scales) both fail. Monotonic dials across all 4 forms: head:body lengthens, eye:head shrinks (round low-set → almond high-set; past ~45% = GOOGLY), snout projects, neck defines an S, wingspan grows, spine straightens to a proud S, pointiness increases, palette value deepens / saturation rises / tips get luminous.

### 4f. Failure-class vocabulary the gate cites
MITTEN · BACKPACK WINGS · SAUSAGE · SUNBURST · SAWTOOTH · FLAT STICKER · TANGENT · GOOGLY · SAME-DRAGON-BIGGER · MOTIF DRIFT · TOY-COLOR · DEAD SYMMETRY · STRAIGHT SPINE · PHANTOM FORM.

---

## 5. Reusable prior art (FACT — extend, never rebuild)

### 5a. Registered builders that already exist (from `registerTorso/Wings/Head/Tail`)
- **Torsos**: arrow, avian, crystalSerpent, faceted, hullTorso, nightFuryTorso, organismTorso, **seraphHull**, serpent, svjEngineBay, svjHull, sweptLoft, sweptLoftSkinned, **unifiedHullTorso**.
- **Wings**: bladeFeatherWings, bladeWing, curvedMembrane, emberMembraneWings, feather, hexMembrane, hullWings, membrane, nightFuryWings, organismWings, **seraphWing**, sideFins, skinnedMembrane, skinnedMembraneBridge, svjBladeWing, svjFanWing, svjJetWing, **unifiedHull**.
- **Heads**: beaked, bullCrown, celestialMask, **draconic**, **horned**, none, **seraphCrownHead**, svjDragonHead, svjWedgeHead.
- **Tails**: bladeJet, clean, cometWake, legacy, none, plume, segmentedAeroTail, **seraphTail**, svjAeroTridentTail, svjArmorTail, svjRear, **sweptTail**.
- **⚠ `dragonKoiSerpent.js` does NOT exist** (charter §4 names it as jade's proven body). The nearest smooth-serpent bodies are `crystalSerpent` (Astral Wyrm, `dragonCrystalSerpent.js`) and `serpent`. Treat the charter's koi-serpent reference as stale.

### 5b. Surface-shader system (`dragonSurfaceShader.js`)
Composable MeshStandardMaterial patches through ONE `onBeforeCompile`: `fresnelRimPatch`, `cellularScales`, `iridescence`, `membraneSSS`, … opted-in by name via `parts.surface.shader = [...]`. **Gotcha (charter §4 / L175)**: a patch's uniforms are wrapped fresh per compile, so an externally-ticked (animated) uniform can't reach a composeSurface patch — either own the `onBeforeCompile` and share the uniform object (the `attachBodyDeform` pattern) **or animate on the CPU**. Prefer a motion mechanism testable headless — the gate is blind to motion (no WebGL in CI).

### 5c. Pearl Seraph lessons already banked (directly reusable — `LEAPFROG.md`)
- **L80** `seraphTail` comet/banner tail contract (`{group, segs, tailFins, accentMats}`).
- **L81** "sawtooth wings" fix — reshape the atomic feather PLATE to a 6-pt convex leaf/shield (never a single apex point) + a `tipSharpness` knob; fix the module vocabulary, don't restart.
- **L82** premium gilding needs a **real metallic gold** (`SERAPH_GOLD 0xD6AF4A`), not near-white `def.horn`; matte pearl `0xF2F0EA` not plastic white. Material language is foundational — fix it before judging shape.
- **L84** a gold rim must FRAME the plate (~1.12×) or dark gaps read as black outlines; add a faint emissive floor so flat-shaded undersides don't crush to black.
- **L85/L86** more modules ≠ better — when feedback says "busy," SUBTRACT (dropped to 3 clean rows / 15 plates); elegance = fewer, larger, well-shaped parts. Prototype an appendage in isolation before committing.
- **L88** greenfield torso/head land via the registry + attach contract (`wingRoot(side)`, `headBase`, `tailAnchor`, `keelTopAt`, `halfWidthAt`, `bodyMidY`); the crown-halo is REAL geometry gated by `model.halo`; suppress the generic body-level halo sprite for this head.
- **Torso sculpting pass** — *segment counts are the budget, not part count*: cut TorusGeometry radial/tubular segments where the chase cam never looks (head/neck/halo/gorget) to fund bigger rear-visible armor; Eternal dropped 5444→4458 tris while ADDING modules.
- **Wing high-V apex** (three linked lessons) — the yoke `model.flap` two-channel solver + a 5-phase envelope with an APEX HOLD is what makes a flap read as a power cycle; verify at the APEX phase, never a static frame (`tiershots` renders rest pose only). Pearl already carries `apexRoot/Mid/Tip`, `restLift`, `apexPitch` tuning.

### 5d. Obsidian / Night-Fury lessons banked
- **L23/L24/L25** the unified-hull weld (SHARED-bone weighting freezes the body↔wing relationship; coincident geometry alone can't).
- **L31** sleek matte Night-Fury = kill idle glows + non-black attachments + whole-creature shader scale (incl. separate tail/head materials) + a blue-black hue. Matte finish kit: `metalness 0`, high roughness, LOW `envMapIntensity` (a smooth dark body mirrors the bright sky and reads metallic).
- **L32** the "metallic rings" read was GEOMETRY (loft facets) + TOPOLOGY (seam), not material — fresh-take the hull.
- **L56** the FACETED part family is the tool for hard-edged creatures (the hull system is for smooth ones) — relevant if Solar pivots regal/crystalline.

### 5e. Toolchain (reuse — do not rebuild; §6/§7 charter)
Guardrails: `node tests/blueprint.mjs` · `node tools/tricount.mjs --ci` · `node tests/starters.mjs` · `node tests/flapcheck.mjs`. Capture/studio: `dragonstudio.mjs <key>` (deterministic contact sheets, clamped to `maxTierFor`), `silhouette.mjs <key> <rear|side|front|climb|top|threeq> [form] [--pose] [--no-wings]`, `headshot.mjs`, `tiershots.mjs`, `flapstrip.mjs`, `nfview.mjs`, `silhouette-overlay.mjs`. Headless three.js via `tools/three-resolver.mjs` + DOM shim (top of `tests/starters.mjs`).

---

## 6. Data GAPS — what must be decided before a sheet can be written

Per dragon, the following are **not yet determined** and are the human's calls (charter §8: propose one line per dragon and get a "go"):

**All three (shared):**
- The **one-line art direction** (silhouette read + palette anchor + accent + the ONE hero feature) — has the same authority as code; must be recorded in `DRAGON-DESIGN.md` so the gate judges against it.
- Whether "redesign" is a **directed elevation** (keep the current identity, push it to the premium bar) or an **art-direction pivot** (new read). Charter §2.4: these ship with real designs, not placeholders.
- The **4-form dial ladder** numbers (head:body, eye:head, wingspan, spineGlow, drama %) and their monotonic direction.
- The **registry §5 anti-collision row** + roster-neighbor differentiators (pearl vs phoenix/azure; obsidian vs toothless/obsidian2/ember; solar vs phoenix/astralWyrm).
- **`def.accentHue`** value + the law-9 carrier statement.
- Per-form **tri targets** and any **engine needs** (new dial flags, motif socket, assert handles).
- The **build order** (charter §0: do them in the order the human asks; if unspecified, suggest one and get a go — do NOT batch all three blind).

**Pearl-specific:** the crown-halo + comet-tail are strong; the open question is whether the feather-scale wing has cleared its historical "sawtooth/busy" reads (L81/L85/L86) at the premium bar, and whether the halo/gild palette holds against a warm-gold sky. Motif = crown-halo (head) + tail-veil lockstep carrier (already partially built).

**Obsidian-specific:** it deliberately withholds idle glow-seams (Radiant/Eternal `glowSeams:false`) — decide whether the premium redesign keeps the stealth-then-Surge signature or lights the cruise silhouette. Must stay distinct from `obsidian2` AND `toothless` (both live). Motif = the twin tail-fin assembly + Night-Surge chevrons.

**Solar-specific (biggest lift):** it currently has **no bespoke body plan** (defaults `arrow`/`membrane`/`horned`/`clean`). An SSSR apex on generic membrane wings is the weakest premium read of the three. Decide the target body plan (bespoke regal torso? faceted crystalline per L56? a seraph-adjacent hull?), and reconcile the "Solar" name vs the shipped **cool eclipse/indigo** palette — is this "Solar" (warm radiant crown) or "Eclipse Sovereign" (cool arcane)? The code and name disagree; the human must pick the intent.

---

## 6b. GPU-load census — tris · draw calls · overdraw (dragons + bosses)

A dedicated creature GPU census was built and run (`tools/creaturestress.mjs`, headless, additive). It measures **both families with one counting convention** (the visibility-aware counter from `tests/boss.mjs` — Points/Lines/InstancedMesh each = 1 draw; hidden subtrees excluded), because the redesign will add meshes + transparent layers to the premiums, and **the real GPU worst case in a boss fight is the dragon and boss rendered TOGETHER**.

### Findings (FACT — `node tools/creaturestress.mjs`)
- **Draw calls peak on a DRAGON, not a boss.** Pearl apex = **253 draws** — >3× the heaviest boss (knellgrave 68). Bosses are deliberately draw-frugal unified constructs; dragons are mesh-piles. Premium draws: pearl 253 · solar 112 · obsidian 51 (Obsidian low by one-skin-hull architecture).
- **Triangles peak on a BOSS.** onewing 16029, karnvow 12597, knellgrave 11723 — ~3× the heaviest dragon (5952). Bosses carry a per-tier band up to 30000 tris / 120 draws; dragons cap at 6000 tris with **no draw/overdraw gate at all** (tricount = tris only). Karnvow sits at 12597/14000 tris, 50/70 draws — comfortably inside its tier-3 band.
- **Worst-case co-resident frame:** peak draws **pearl(253)+knellgrave(68)=321** (on-device-proven-safe ≤415, L124); peak tris **~21,981** (heaviest dragon + onewing); peak **overdraw phoenix(56)+knellgrave(31)=87** transparent/additive drawables.
- **Overdraw is the cliff, not draws** — banked on-device (L124/L125 + `tests/boss.mjs` §2b): a real phone held ~58fps at 415 draws, instancing *janked*, and additive-shell overdraw hit the **32fps cliff**. So headless counts are a regression/design gate; **absolute fps comes from a human opening `tools/stress.html` on a phone via the PR preview** (headless rAF throttled ~8x, L105).

### Implication for the premium redesign
The law-12 premium fx the sheets will add — glow-seams, wing-veins, halos, idle auras, sparkle — are **transparent/additive layers**, i.e. they spend the exact axis (overdraw) that caused the on-device cliff. Phoenix already carries **56** transparent drawables (layered feather wings) — the roster's overdraw ceiling, and it's a dragon. So the premium sheets must budget **overdraw**, not just triangles: prefer surface-shader glow (opaque body, emissive in the fragment) over stacked additive shells (§1 / L124), and keep the co-resident sum (premium dragon + heaviest boss) inside the proven marks. `tools/creaturestress.mjs --ci` is now the standing gate for that (tris per dragon ≤6000; bosses per `TIER_BUDGETS`; co-resident draws ≤415).

**Open (needs the human + a phone):** wiring the REAL dragon+boss geometry into `tools/stress.html` for on-device fps (the L124 instrument is synthetic today). The headless census answers "how many tris/draws/overdraw"; only a real device answers "does it hold 60fps."

### 6c. On-device reality check — the FULL combat frame (not just two static meshes)
The §6b census + the synthetic `stress.html` cover dragon+boss **geometry** + the post-FX fill. The live combat frame adds more, all measured from code: boss **bullets** (cap 320, but ONE InstancedMesh = **+1 draw**, additive → overdraw), **particles/sparks** (`VISIBLE_CAP 150` additive sprites = up to +150 draws + fill, quality-scaled), wisp ribbons (+6 additive), lance hoops/shockwaves (+8/+8), and the **biome environment** (instanced terrain bands + 1 sky sphere — draw-frugal, mostly opaque). On `bossStart` the game clears the field (rings/embers/hazards) for a cleaner arena.

Owner ran the in-game `?debug=perf` overlay through actual Karnvow fights (full frame: biome + bullets + spell-card spectacle + dragon + boss + post-FX):
- **Steady-state ≈ 60fps** (matches the synthetic result — real average headroom is genuine).
- **Split-second dips to ~39–46fps** at the densest spell-card / bullet moments (hand-picked worst frames off a screen recording, which itself costs ~10–20% fps — so the true dips are shallower). `calls 379–440`, `tris 23–44k` (**the biome is ~half the triangles** — the isolated creature peak was only ~21k).
- **Fill/overdraw-bound, confirming L124:** the tier-2 frame gave the *lowest* fps despite *fewer* triangles than a 44k tier-1 frame — screen-space fill (post-FX + additive bullets/spectacle/glows) is the bottleneck, not triangle count. The adaptive quality system already drops tier to protect the average.

**Load-bearing implication for the sheets:** the combat frame's *average* is fine, but its **p95 dips are fill-bound and already the axis the premium law-12 fx spend** (glow-seams, veined membranes, halos, idle auras are all additive overdraw). So premium richness must **protect the p95 dip, not just fit the average**: prefer **opaque body + surface-shader emissive** (glow in the fragment) over stacked additive shells; keep halos/auras/sparkle few and cheap (Pearl already tops the roster at 56 transparent drawables); budget against the **tier-1 degraded frame**, since that's where a mid-fight phone lives. This *reframes* §4c: the premium inversion lifts the *aesthetic* ceiling, but the *overdraw* ceiling is real and now evidence-backed.

**Instrument added (this PR):** `js/main.js`'s `?debug=perf` overlay now tracks, per run, the **worst frame** (`min <fps> @<draws>c/<tris>k`) and **p95 frame time** — so a dip is a measured number ("the worst frame of that Karnvow run was 41fps @ 430 draws"), not a guess off a paused recording. Gated behind the flag; the game is byte-identical with it off. This is the gauge to re-read after each premium fx addition — if a new halo costs the worst-case frame, it shows here before it ships.

---

## 7. Charter-vs-code conflicts flagged (§9 conflict rule)

1. **Lesson numbering.** Charter §1/§6 cite "JADE rebuild lessons **L166–L176**" as the state of the art. In the actual ledger, L166–L176 are **biome/audio/lance** work; the real starter-rebuild lessons are **L160–L165** (azure gate L161, ember CP1/CP2 L164/L165) and the Pearl/Seraph lessons are **L80–L88 + several unnumbered "Lesson —" entries**. The ledger also has duplicate numbers (two L164s, two L165s, two L215s). Use the content, not the numbers.
2. **Solar body plan.** Charter §0 table lists solar as "faceted / `cellularScales`+`iridescence` surface, regal apex." Code: solar declares **only** the surface shader; `resolveRecipe()` gives it the **default `arrow`/`membrane`/`horned`/`clean`** — it is NOT on the `faceted` torso. (The charter itself says to verify this; done.)
3. **`dragonKoiSerpent.js`** (charter §4, named as jade's reference body) **does not exist** in `reforged/js/`. Nearest: `dragonCrystalSerpent.js` / `serpent` torso.
4. **Pearl parts already landed.** Charter §0 says Pearl's hull/head are "the current plan" — code shows `seraphHull` + `seraphCrownHead` are **already registered and shipped** (`dragonSeraphBody.js`), not pending. The charter comment "Hull/Head still inferred until seraphHull/Head land" in `dragons.js` is itself stale (L88 landed them).

None of these block the research; they refine what "current state" means before authoring.

---

## 8. Proposed next steps (for the human's "go")

1. **Pick the build order** — recommend **Solar first** (biggest elevation: it's an SSSR on default geometry, so the win is largest and least constrained by an existing bespoke read), then **Obsidian**, then **Pearl** (most-refined already). Or the charter-neutral order — your call.
2. **Give (or approve a proposed) one-line art direction per dragon**, especially resolving the Solar "Solar vs Eclipse" name/palette question.
3. On the chosen key: author the §5d build sheet + registry §5 row + 4-form `tests/starters.mjs` SPEC (this doc is the input), then run the calibration gate on the shipped version (expected FAIL) before building the apex.

This document is data-gathering only — no builder, sheet, registry row, or roster geometry has been authored or changed. The roster is byte-identical. Added alongside it: `tools/creaturestress.mjs` (the read-only dragon+boss GPU census of §6b), which touches no game code.
