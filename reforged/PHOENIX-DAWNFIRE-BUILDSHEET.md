# PHOENIX — "The Dawnfire Empress" · Premium Build Sheet (Firebird of Rebirth)

The builder's contract for rebuilding `phoenix` (SSSR) into a bespoke premium apex firebird — the
deliberate **opposite of Solar** on every axis, majestic in her own fiery way. Authored FRESH: no
existing `feather`/`plume`/`avian`/`beaked` builder geometry is reused, and NOTHING of Solar's look
(no M, no eclipse ring, no membrane, no violet, no horizontal wyrm-king). Reuses only invisible
plumbing: the recipe registry, the attach contract, `flatTriMesh`, the stage-aware material-factory
*structure*, the `igniteStage` dial pattern, and the failure-class test harness.

**Read first:** [`PREMIUM-DRAGON-METHOD.md`](./PREMIUM-DRAGON-METHOD.md) (the playbook — esp. §0.5
distinctiveness gate, §2 rear-chase primacy, §3 spectacle triad, §3b the anti-tacky lighting
doctrine). Worked reference implementation: [`SOLAR-ECLIPSE-BUILDSHEET.md`](./SOLAR-ECLIPSE-BUILDSHEET.md)
+ `js/dragonSovereign.js`. Numbers here are the authority; the Fable gate (§QA) judges against this sheet.

Sourced from: the owner's 4 phoenix reference images (the spread-display + streaming flame-plume +
molten-gold-on-black + fire-feathers) + the Fable design synthesis + the method's fixed constraints.
**Owner-confirmed direction: TRAIN-HERO** (the hero mass is the streaming lower-rear quill-train; the
wings are supporting slender scythes — the clean inversion of Solar's top-heavy crown).

**COEXISTENCE — build as a NEW character block, do NOT replace the shipped `phoenix` (owner directive).**
The premium rebuild is authored as a **new roster def key** so both dragons exist side-by-side and can be
COMPARED in-game before the owner decides to replace or retire the original. This is the method's
"coexist → prove on a hero → migrate" principle applied at the roster level.
- **New key: `phoenixEmpress`** (working name — owner may rename). It is a fresh entry in `DRAGONS`
  (`js/dragons.js`), NOT an edit to the existing `phoenix` def. The shipped `phoenix` (avian/feather/
  plume/beaked firebird) stays **byte-identical and fully playable** throughout.
- **Mirror the shipped phoenix so the comparison is fair:** `name:'Phoenix Ascendant'` → display name
  the owner's call (e.g. keep, or "Phoenix — Dawnfire"), `rarity/maxRarity SSSR`, `cost:6000`,
  `stats {speed 1.14, handling 1.27, drain 0.70, regen 1.35}`, `archetype:'phoenix'` (the RIG flag for
  warm ember-motes / Rebirth Surge in `dragon.js`, not a model path), `maxTierFor===3`, `hasStyle:true`.
- **`title: 'The Dawnfire Empress'`** (owner-confirmed — adopt the identity name as the shipped title).
- `parts` points to the four NEW builders (§3); `forms[]` uses the §4 palette. The shipped ivory apex
  body `0xeee2c6` is NOT carried over — this block never uses it (it is the toy-bright trap).
- **Migration (later, owner-gated):** once compared and blessed, either repoint `key:'phoenix'` at the
  new builders/palette and delete `phoenixEmpress`, or retire the old `phoenix` and promote this key.
  Until then, NOTHING about the shipped dragon changes. New builders stay default-off; only
  `phoenixEmpress.parts` opts in, so the rest of the roster is byte-identical.
- Coexistence surfaces the new dragon in the shop/roster as its own entry (that IS the comparison
  surface). If the owner prefers a hidden dev-only compare instead, gate it behind a flag — owner call.

---

## 1. IDENTITY

**She is the fire that rises where the king's darkness reigns.** Solar is a horizontal eclipse
dragon-KING — cold violet light withheld inside armored black, a cathedral of membrane vaults crowned
ABOVE his head. Phoenix is the Dawnfire EMPRESS — a compact, burning-hearted firebird whose glory
streams BEHIND and BELOW her: a fanned train of ember-eyed quills trailing toward the chase camera
like a comet made of feathers. Solar wears his spectacle as a **crown above** (spires, ring); Phoenix
wears hers as a **train behind** (an empress's robe, not a king's crown). His arc is dark-then-ignited;
hers is **ash-then-reborn** — a charcoal ash-chick that re-kindles rung by rung until the apex burns
with three colours of fire on a body that stays dark as a coal.

One word: **REBIRTH** — worn as a train, not a crown. She is a SHE; the bearing is regal, not martial.

## 2. THE SIGNATURE SILHOUETTE — "THE PYRE-TRAIN" (comet-of-quills)

**The one geometric idea:** Phoenix's silhouette mass lives in the LOWER-REAR of the frame. Long,
slender, continuously up-raked scythe wings sit thin on top; beneath and behind them, a wide fanned
**TRAIN** of flame-quills spreads from the tail root in a downward-and-outward sector (≤ 150°, hard-capped
< 180°), each quill tipped with a faceted **coal-eye** gem. In pure rear black-fill she reads as a
**shuttlecock-comet / a lyrebird's display**: two thin high crescents (the wings) over a broad radiating
spray (the train). Instantly nameable: *"the one with the burning peacock train."*

**Why it is unmistakably Phoenix and not Solar (or anyone):**
- **Compositional inversion.** Solar's rear frame is TOP-heavy (spires + ring above the head, tail an
  afterthought); Phoenix's is BOTTOM-heavy (train below, wings thin above). Two silhouettes whose mass
  lives in opposite halves of the frame cannot be confused.
- **Not an M / not an arch.** The wings are single continuous raked crescents whose high points are the
  far OUTBOARD tips — no interior carpal peaks, no valley-enthroned head, no vertical spires. The
  skyline is a shallow rising V of thin blades, deliberately quiet, because the train is the hero. (The
  wing's vertical profile is the mathematically OPPOSITE curve family to Solar's two-segment arch: his
  peaks are interior, hers are terminal.)
- **Not a ring.** The train is a **sector fan of DISCRETE quills with mandatory negative space** (gap ≥
  1 quill-width between quills; sector < 180°; both asserted in tests). It anchors at the TAIL, not
  behind the head — so it also cannot be mistaken for Pearl's head-anchored halo sprite.
- **Rear-chase native.** The tail trails TOWARD the lens — the cam's biggest untapped surface. Every
  quill vane is canted to FACE the camera (pitched ~20–30° up off horizontal, alternating small ±8° L/R
  cant for balance — the Solar CP2 tail lesson applied from round 1, never edge-on).

**Owning the dark sky — the ≥3 coloured light structures** (three warm hues, spatially separated so she
never smears into one orange blob; this is the IMG_6529 target — molten body + lit edges + ember motes
on black):
1. **The EMBER ARC (amber-gold `~0xd98a12`):** the coal-eye gems at the quill tips form a glowing arc of
   discrete points across the lower frame — a constellation of coals, the rear-view signature. The CENTER
   quill's coal is the apex's single tiny near-white element (the **Dawn Coal**, `0xffe9c4`).
2. **PINION FIRE (crimson-rose `~0xe0173a`):** each wing's large primaries carry a vertex-baked
   dark-root → crimson-tip emissive gradient on the trailing edge — two thin curved lines of red fire
   tracing the wing crescents, brightest in the outer 20%.
3. **THE COMET CREST (rose `~0xe83a6a`):** back-swept crest quills streaming off the crown, each with a
   small coal tip — a rear-readable upper echo of the train (Phoenix's own answer to the "the face is
   away from the cam" problem Solar solved with a napeStar — she solves it with her own motif).
4. (side/inspect only, forms 2+) **the HEART-FIRE GORGET** — a saturated gold breast-keel seam; not
   counted on for the rear read.

No dead-black center void: a thin molten **keel-seam** (ember-orange, dim, stage-gated) runs the dorsal
line between crest and train so the body stays anchored between light structures 1 and 3.

## 3. THE FOUR APEX BUILDERS

New file `js/dragonPhoenixEmpress.js`, self-registering, DEFAULT-OFF; only `phoenix.parts` opts in (the
roster stays byte-identical until then). New material factory `empressMats(def, glow, stage)` copies only
the `sovereignMats` *structure* (per-stage emissive ladders, `userData.baseEmissive/baseIntensity`) — its
materials, hues, counts and slots are authored fresh.

### 3a. TORSO — `pyreHeartTorso`
The anti-wyrm: a **compact avian fuselage**, not a long draconic keel. Deep bird-breast keel (mass
forward and LOW, a falcon's chest), short proud swan-curve neck (2–3 segments, head carried slightly
high — the empress bearing). Body long axis stays LEVEL in flight (verticality comes from wing rake +
train lift, NEVER a reared body — the §0.5 horizontal-readability rule). Torso ≈ 35% of the silhouette
so the train can be ~40%. Regalia: the **heart-fire gorget** — a 3-facet gold emissive seam-chevron
molded into the breast keel (the dark-opaque-body + thin-saturated-rim TECHNIQUE spent on a GORGET, not
a ring), withheld until form 2. Dorsal molten keel-seam (thin ember emissive groove, stage-gated). Flank
= few large ash-charcoal facets; belly one tier warmer (deep umber, NOT cream). Publishes the full
attach contract (`wingRootL/R`, `headBase`, `tailAnchor`, `halfWidthAt`, `bodyMidY`, `riderSocket`),
`parts.spinePoints`, the gorget `motifAnchor`, and **`coreGlow` as a mesh or `null` — never a colour
number** (the known crash class). ~350–450 tris at apex.

### 3b. WINGS — `scythePinionWings` (feathered, NEW construction)
**The falcata crescent:** high-aspect wings — long span, narrow chord (the opposite of Solar's broad
vault-bays). Per wing:
- **One dark covert sheet** (inner third): a single `flatTriMesh` fan of 6–8 large facets, ash-maroon
  diffuse, ZERO emissive — the dark root that makes the fire read.
- **5–7 large blade PRIMARIES** (outer two-thirds at apex): each a discrete 4–6-tri quad-blade,
  z-staggered/shingled, separating toward the tip with true negative-space **pinion slots** (gap ≥
  0.15× span between the outer three). Each carries the vertex-baked dark-root → crimson-tip gradient
  (emissive only in the outer 40% of each blade, zero at the root — the fire lives on the tips).
- **Vertical profile = a single continuous RISING RAKE** (`sweepRake` + `tipRise` dials, vertex-baked so
  it survives the flap animator): sweep back 40–45°, tips ending HIGH and AFT, a slight inward curl at
  the last primary (flame-lick tips). No gull arch, no carpal peak, no spires — max height at the far
  tip, monotonic from root.
- Apex span : body ≈ 3.2× (majesty from SPAN, since chord is slender).
- **Rig contract:** publishes `wingPivotL/R`, `wingMidL/R`, `wingTipL/R`, tip `marker`,
  `parts.wingElements` — and the FX marker + tip **duplicate the rake profile formula** (documented
  gotcha: change the profile in both places or the wingtip trails detach).
- Motion: "the ember rises" — quicker, lighter bird wingbeat than Solar's slow cathedral bow, with long
  soaring holds where the pinion slots read. ~500–600 tris/pair at apex.

### 3c. HEAD — `cometCrestHead`
Small sleek falcon-swan head (the face is 0% of play — spend nothing beyond a clean beak wedge + almond
eye). Short raptor beak in burnished copper; NO horns, NO brow gem (a forward gem is wasted — Solar
proved it). Regalia = the **COMET CREST**: 1→3→5 back-swept streaming crest quills (per form), each a
2–3-tri blade with a small coal-eye tip — reads from the REAR as a streaming pennant above the body,
unifying with the train motif. Eyes amber-gold, laddering 34% round (chick) → 16% almond (empress).
Publishes the crest `motifAnchor`, `headLength`. ~150–200 tris at apex.

### 3d. TAIL — `pyreTrainTail` (registers a `pyreTrain` tail style) — **THE HERO**
- Short structural tail root (2–3 segments) → the **TRAIN**: 2/4/6/**9** quills per form, fanned in a
  downward-aft sector (apex spread ~140–150°, hard < 180°). Each quill = a thin copper shaft (~4 tris) +
  a teardrop vane (`flatTriMesh`, 4–6 tris, dark ash-maroon diffuse with a crimson→amber emissive edge
  gradient) + a faceted octahedral **coal-eye** at the tip (~8 tris, amber-gold emissive on a dark bezel
  — the dark-body-bright-rim technique spent on a GEM-CLUSTER ARC, not a ring).
- Quill lengths swell-then-taper across the fan (center longest ≈ 1.1× body, ×0.85/step outward) so the
  fan has a shaped outline, not a flat broom.
- **Camera-facing law:** vanes pitch 20–30° up toward the chase lens, alternating ±8° L/R cant down the
  fan (balanced, per the Solar CP2 fix — must still PASS `wingsymprobe` as a mirrored pair).
- **`trainLift` dial:** the whole fan's rest pitch rises per form (drooping ember-tail at f0 → proud
  lifted display at f3) — the "banner rise" that gives the ASCENDING read without tilting the body.
- Center quill carries the near-white **Dawn Coal** at f3 only. Coal-eye mats + the Dawn Coal stay OUT
  of `spineMats`/`accentMats` (surge-tick discipline — they hold their hue); the vane edge-gradient mats
  go IN (they flare on Rebirth Surge). ~110 tris (f0 stub) → ~450 tris (apex fan).

**Tri targets (±20%, monotonic, hard 6000 ceiling):** f0 ~1.0k · f1 ~1.4k · f2 ~1.8k · f3 ~2.3k.

## 4. THE PREMIUM-FIRE LIGHTING SOLUTION (the anti-orange-blob doctrine — "a coal, not a torch")

The trap for a fire dragon is "everything orange, everything bright." The solve: the body is the dark
COAL; the fire lives only on edges, tips and gems — and it is THREE separated warm hues, not one.

- **Base diffuse (large surfaces, always dark, L ≤ 0.22):** warm ash-charcoal → deep GARNET ramp per
  form: `0x1a0f0d → 0x241012 → 0x2c1014 → 0x331016` (the ramp goes charcoal → garnet, REDDER never
  lighter — the DORSAL masses stay dark so the emissive carries the fire). Belly one tier warmer umber
  `0x3a2114`. This separates her from Ember Wyrm's bold-orange body and from the retired ivory apex.
- **Apex-body owner call — RESOLVED (owner yes):** the dorsal masses stay dark-garnet at every form
  (doctrine, anti-washout), BUT the APEX (f3) belly gets a small **pale-gold nod** to the retired
  "white-gold divine" firebird — belly-only, downward-facing, `~0xe8c58a`, so it warms the underside a
  believer catches on a bank without ever lightening the dorsal read the chase cam sees. Lower forms keep
  the umber belly; only f3 gains the pale-gold underlight.
- **Accent diffuse (forged tier, never emissive):** burnished copper / rose-gold `0x8a4a22` — beak,
  talons, quill shafts, crest shafts, gorget bezel; catches sun edge-highlights.
- **Emissive (opaque, vertex-baked, sat ≥ 0.75, value ≤ 0.9 — blooms in-colour under ACES + UnrealBloom):**
  three hue stations ~25–35° apart so the structures stay distinct — crimson-rose `0xe0173a` (pinion
  fire), ember-orange `0xd9541a` (keel-seam + vane mid), amber-gold `0xd98a12` (coal-eyes, gorget), rose
  `0xe83a6a` (crest + feather-edge kiss at f2+). All dark-root → bright-tip GRADIENTS — no flat emissive
  sheets anywhere.
- **Exactly ONE near-white:** the Dawn Coal `0xffe9c4`, tiny, f3 only, out of all surge arrays.
- **No additive shells / no gem sprites.** Surge (`Rebirth`) flares the vane-edge + pinion mats toward
  `feverWing 0xffe6a8` (kept warm-gold, sat/value-safe) — never white-hot, never magenta.
- Per-form `glowLevel` 0.25/0.5/0.75/1.0 multiplies all emissive (adaptive-tier friendly). She must read
  as an empress UNLIT — the silhouette (train fan + scythe wings) does that job.

## 5. THE CORONATION LADDER — the REBIRTH ARC (each rung confers a withheld MESH category)

| dial | f0 **Ash Hatchling** | f1 **Kindled Fledgling** | f2 **Pyre Dancer** | f3 **Dawnfire Empress** |
|---|---|---|---|---|
| read | charcoal ash-chick: round, dim, a promise | first quills catch — the fire takes | the display ignites — she performs | the full pyre-train empress, reborn |
| `igniteStage` | 0 | 1 | 2 | 3 |
| `trainQuills` / `trainFan` / `trainLift` | 2 nubs, unlit, drooped | 4, ~90°, low | 6, ~120°, mid | 9, ~150°, proud |
| `coalBloom` (coal-eyes) | none (mesh withheld) | first coals, dim amber | brighter, all tips | blazing arc + Dawn Coal (f3-only mesh) |
| `pinionSlots` / primaries | 4 rounded, NO slots, low rake | 5, first 2 slots, rake grows | 6, 3 slots | 7, full slots, full rake + tip curl |
| pinion fire | none | crimson tips only (outer 15%) | outer 40% gradient | full gradient + rose edge kiss |
| `crestQuills` | 0 (bare crown) | 1 | 3 | 5, coal-tipped |
| `gorget` (heart-fire) | — | — | conferred (mesh appears, gold) | blazing |
| `keelSeam` | faint ember stitch | lit low | lit | molten |
| body diffuse / `glowLevel` | `0x1a0f0d` / 0.25 | `0x241012` / 0.5 | `0x2c1014` / 0.75 | `0x331016` / 1.0 |
| `eyeShape` | 34% round | 26% | 20% | 16% almond |
| tri target | ~1.0k | ~1.4k | ~1.8k | ~2.3k |

Every rung adds a CATEGORY, never just scale: f1 = hardware (quills, slots, crest) + first light; f2 = a
new regalia MESH (gorget) + a new HUE (rose); f3 = the full fan + the one near-white + max rake/lift. The
hatchling is a genuine ash-chick (no train, no coals, no crest, no gorget), so Eternal actually CONFERS
the empress's train. All dials monotonic.

## 6. OPPOSITE-OF-SOLAR + ROSTER DISTINCTIVENESS (the §0.5 gate)

| Axis | SOLAR (off-limits) | PHOENIX (this sheet) | vs warm roster |
|---|---|---|---|
| Silhouette family | M / cathedral arch, TOP-heavy crown-above | Shuttlecock-comet: thin rising crescents over a LOWER-rear quill fan (train-behind) | Ember: generic wyvern V; Cinderwing: solid flame-cone tail; Pearl: halo-knight — none own the lower frame |
| Wing architecture | Broad membrane vault-bays + carpal lances | Slender high-aspect feathered scythe blades, terminal-peak rake, pinion slots | Ember/Cinderwing: membrane/hull; Pearl: smooth white angel wings (hers are dark, slotted, raked) |
| Regalia motif | Eclipse ring + brow star-gem (violet) | Coal-eye gem ARC on the train + comet crest + heart-fire gorget — a constellation, never an annulus | Pearl's halo is a head-anchored soft disk; the coal arc is tail-anchored discrete gems |
| Palette + glow | Eclipse-black + cold violet emissive | Ash-garnet DARK body + three warm emissives (crimson / ember / amber-gold), one tiny near-white | Ember Wyrm is bright-orange-BODIED; Phoenix is dark-bodied, fire on edges only |
| Growth beat | Withheld dark king → ignited crown | Rebirth: ash-chick → the train is conferred quill-by-quill, coals kindle | Unique verb: "re-kindling," not forging (ember) or burning (fire) |
| Body posture / sex | Long horizontal wyrm-KING, whip tail; HE | Compact avian breast-keel, short swan neck, level body; ascent from rake + lift; SHE | Cinderwing a hull raptor; aurumToro a mecha bull — no overlap |

## 7. RISKS / OPEN OWNER-CALLS

1. **Slender wings vs the "wings ~70% of frame" doctrine.** The train deliberately steals frame-share
   from the wings. If chase-cam majesty feels thin, the fallback is +30% chord on the covert sheet
   (keeping the rake family) — decide AFTER the first rear-chase capture, not before.
2. **`trainSpread` animated fan — APPROVED (owner yes), a planned feature.** The train FOLDS in
   (quills draw together, sector narrows) on a dive/boost and FANS OUT (full sector, lift up) in a
   glide and on Rebirth Surge — a living display, her signature motion beat. Implement as a rig
   behaviour driving the per-quill rest angles from a `trainSpread` 0→1 value (like the wing flap
   drives pinion fold); vertex-baked rest fan stays the floor, the animation opens/closes above it.
   Constraint: cap total train length ≈ 1.1× body and lift ≤ 35° (fanned) so it never clips the near
   plane or occludes rings/obstacles at chase distance. The idle/bank sway + the fold/fan feel are
   MOTION the Fable gate is blind to — human judges on the live preview.
3. **Apex-body brightness — RESOLVED (owner yes):** dark-garnet dorsal at every form + a small pale-gold
   f3 BELLY nod only (§4). Not an open question anymore; recorded here for provenance.
4. **Coal-eyes reading as eyes/targets.** Nine glowing gems could momentarily read as creature eyes or
   pickups at distance; verify at 250px in dragonstudio; mitigation = smaller gems + stronger vane
   gradients.
5. **Pearl anti-collision watch.** Pearl is also feathered with a banner tail; the standing Fable
   distinctiveness veto must get a PEARL tile alongside the Solar tile (and Ember + Cinderwing
   black-fills) every round.
6. **Title — RESOLVED (owner yes):** `title: 'The Dawnfire Empress'`.
7. **Coexistence key name.** `phoenixEmpress` is a working key — owner may rename before/at build. It
   ships as its own roster/shop entry (the comparison surface) until the migration call.

## QA — the gate (per PREMIUM-DRAGON-METHOD §4–5)

1. **Side-by-side baseline:** because the new `phoenixEmpress` COEXISTS with the shipped `phoenix`, the
   comparison is direct — render both through `dragonstudio` (and view both in-game). Run the Fable gate
   on the shipped `phoenix` first as the baseline (expected FAIL — the lightly-composed firebird), then
   grade `phoenixEmpress` against the same rubric. The delta IS the owner's compare-before-migrate evidence.
2. **Verify by failure-class:** `tools/tricount.mjs phoenix` (monotonic, < 6000) · `tests/blueprint.mjs`
   · `tests/smoke.mjs` (the coreGlow-mesh-or-null + wing-pivot crash classes) · `tools/wingsymprobe.mjs
   phoenix` (the ±8° alternating quill cant + mirrored wings must PASS as a pair) · `tools/dragonstudio.mjs
   phoenix r1` (sil-rear + glide-dark + rear-chase + 4-tile ladder).
3. **`tests/starters.mjs` phoenix-own block** (premiums reach Eternal — can't ride the form-2-capped
   loop): tris monotonic; `trainQuills`/`coalBloom`/`crestQuills`/`igniteStage` monotonic; **fan sector <
   180°** and **quill gap ≥ 1 quill-width** (the not-a-ring asserts); vane diffuse L ≤ 0.22; accent hue
   in the warm band; Dawn Coal absent below f3; gorget absent below f2.
4. **ONE combined Fable brief** (sculpt + spectacle + rear-chase) with the standing DISTINCTIVENESS veto
   — hand the grader Solar + Pearl + Ember + Cinderwing tiles: *"does any part read like a shipped
   dragon? → FAIL."* Weight the rubric to the rear-chase tile; PASS = avg ≥ 4.0, no axis ≤ 2, vetoes
   clear (washout; any part reading like another dragon). Iterate round by round.
5. **Human judges MOTION/feel on the live PR preview** (train sway, wingbeat, Rebirth Surge, ember-mote
   wake) and any net-new element — the gate is blind to it.

## Engine plumbing (invisible, named fresh)

New file `js/dragonPhoenixEmpress.js` registering `pyreHeartTorso` · `scythePinionWings` ·
`cometCrestHead` · `pyreTrainTail` (all default-off). New `empressMats(def, glow, stage)` copying only
the `sovereignMats` STRUCTURE. New dials via `forms[]` accretion only: `trainQuills`, `trainFan`,
`trainLift`, `coalBloom`, `dawnCoal`, `crestQuills`, `gorget`, `pinionSlots`, `sweepRake`, `tipRise`,
`keelSeam`, `eyeShape`, `glowLevel`, `igniteStage`. **Do NOT touch the `archetype:'phoenix'` legacy
inference in `js/dragonRecipe.js` (~line 67)** — the shipped `phoenix` still relies on it during
coexistence. The new `phoenixEmpress` block sets explicit `parts` (which win over any inference) AND
keeps `archetype:'phoenix'` only as the RIG flag (ember-motes / Rebirth Surge); verify the explicit
parts are not shadowed by the inference for the new key. Roster stays byte-identical until
`phoenixEmpress.parts` opts in; the shipped `phoenix` is never edited until the migration call.

---

## CHANGELOG

- **2026-07-09 — sheet authored.** Fable-synthesized from the owner's 4 reference images + the premium
  method. Owner-confirmed TRAIN-HERO direction.
- **2026-07-09 — owner decisions folded in:** (1) build as a NEW coexisting roster block
  `phoenixEmpress` — do NOT replace the shipped `phoenix`; compare in-game, migrate/retire later
  (owner directive); (2) `title: 'The Dawnfire Empress'`; (3) apex-body = dark-garnet dorsal + a small
  pale-gold f3 belly nod; (4) the animated `trainSpread` fold/fan motion beat = APPROVED. Not yet
  implemented — this is the build contract for the Phoenix session.
- **2026-07-09 — IMPLEMENTED (this session).** New `js/dragonPhoenixEmpress.js` registers the four
  default-off builders (`pyreHeartTorso` · `scythePinionWings` · `cometCrestHead` · `pyreTrainTail`)
  + `empressMats` (copies only the `sovereignMats` STRUCTURE; warm hues authored fresh). New roster
  key `phoenixEmpress` in `js/dragons.js` (shipped `phoenix` byte-identical — pure insertion). Apex
  built first, then subtracted down the REBIRTH ladder (igniteStage 0→3; train 2/4/6/9 quills; coals /
  crest / gorget / Dawn Coal / pinion-slots gated per rung). Lighting = "a coal, not a torch":
  dark-garnet body, fire on wing pinion trailing edges (crimson) + train-tip coal-eye constellation
  (amber-gold) + comet crest (rose), one near-white Dawn Coal (center train gem, f3). Failure-class
  gauntlet GREEN: `tricount` monotonic 558/691/914/1075 <6000; `blueprint`; `smoke`; `wingsymprobe`
  PASS (0.000); headless preview+flight ticks clean; new `phoenixEmpress` block in `tests/starters.mjs`
  (cant-balance Σ=0, fan sector <180°, quill gap ≥1 quill-width, all ladder dials monotonic).
  Round-0 self-audit reseated the gorget (breast chevron, was an oversized neck lozenge) + broadened
  the train into a full "empress robe" fan. TODO (owner-gated, motion): wire the approved `trainSpread`
  fold/fan animation beat; owner motion/feel review on the live preview.
- **2026-07-10 — RICHNESS PASS (owner: "too simple").** Added organized detail RANKS (all dark facet
  relief, coal-doctrine safe): shingled wing coverts + creased/barbed primaries + alula + scapulars;
  train inner under-rank (doubled coal constellation) + peacock vane-eyes + root skirt; neck ruff,
  flank/breast shingles, dorsal plumes, copper talons; radiant crest + nape mantle + inset eye. Apex
  ~2.4k tris. Fable 4.00→4.17.
- **2026-07-10 — THE GLOW-UP (owner: "too basic for an Eternal grind reward"; distill Solar's
  epicness).** A high-effort Fable pass distilled Solar's majesty principles and applied them
  Phoenix-natively. See the FIVE new DOCTRINE laws below; apex ~2.3k tris. Fable 3.92 → 4.00 →
  **4.67 PASS (Eternal-worthy)** across three gate rounds — the decisive fix was rebuilding the
  Dawn Fan in the FRONTAL plane so the rays radiate a wide ~162° sunrise-burst (they were rolled
  around the aft axis, collapsing into a narrow rearward tassel). "A coal-dark empress dragging a
  golden sunrise behind her."

## ⚠ SUPERSEDED 2026-07-10 — the frontal-plane fan was a DRAG-PLATE (re-architected to a raked cone)

The "bottom-heavy perpendicular fan" (quills radiating in the FRONTAL plane, ⊥ to flight) passed the
still gate but **failed in motion**: a wide flat disk normal to the airflow reads as an air-brake /
spoiler / "90° flap" on a creature flying forward — aerodynamic nonsense. The stills lied because the
still camera looks straight down the flight axis (where the disk projects at max width); side/top
reads exposed its zero fore-aft depth (a hanging skirt; invisible from above).

**THE GATHERED COURT-TRAIN (current — refines the Trailing Dawn).** The raked cone, built as many thin
quills, read as a **feather-duster** head-on (a symmetric radial spray of near-equal wires with bead
tips — the gold shafts *were* the silhouette) and only cohered into a train when a bank foreshortened
them into overlap. Fix: **5 broad PANELS (not 15 wires)** webbed by a **PLEATED MEMBRANE** (each half-gore
rigid to one panel's rake group → slides pleat-over-pleat, never tears) into one shaped drape; the α
ladder INVERTED (deep center comet-point α≈38° → wide short hem α≈58°) for a baked-in gathered, down-
swept **comet hierarchy** (not a symmetric pom-pom); sector 150°→132° but FILLED; and ONE burning hem
stroke + valley coals replace 36 per-panel rim slivers. Negative space relocated from between-spokes to
between-fingertips (the hem). Gold re-massed off the silhouette (thin copper interior rachises; gold only
on the center + hem panels + collets). Asserts: `nQuills≤5`, `fanDeg≤135`, `fillRatio≥0.95` (cohesion,
replacing the old "mandatory negative space" assert that *enforced* the duster), comet Δ≥0.30·max, α≤60.

**THE TRAILING DAWN (rake foundation).** Each quill RAKES AFT into a half-cone: `rotation.z=φ`
rolls it around the flight axis, an inner rake group pitches it aft by `(90°−α)`. **THE LAW: α ≤ 60°
for every quill** (rake measured from the aft/flight axis; the failed disk was α≈90°) — asserted in
`tests/starters.mjs`. Key trick: a quill's rear-cam projection = `length·sin α`, so lengths are sized
from the PROJECTION budget backwards (`L = projWidth(φ)/sin α`) — the rear-chase burst stays exactly
as wide as the flat fan, while the mass streams aft with real depth (she *tows the dawn behind her*).
Motion: speed FURLS α tighter (comet-spear at speed, blossom on glide); an aft-travelling wave runs
root→outer down the cone (banner in the airflow, not a skirt swish). The gold streamer-shafts, the
coal constellation (now an arc-in-depth of trailing sparks), and the Heart of Rebirth (the comet's
head the wake pours from) all re-homed unchanged. The §2 frontal-fan geometry below is HISTORY.

## GLOW-UP DOCTRINE (added 2026-07-10 — the Solar-principles → Phoenix application)

Distilled from what makes Solar read as a majestic king, translated to the empress without copying
his ring/arch/violet:

1. **Frame-share law for the hero.** At chase distance the TRAIN must span ≥1.5× the torso's rear-view
   width and ~⅓ of the frame height — it is her dominant set-piece (Solar's corona-ring equivalent, but
   NOT a ring). The fan outline must be SHAPED (a lyre / ray-burst: center-peak + a secondary shoulder
   swell + outer horn-curl), never a flat broom. Assert quill-length is non-monotonic across the sector.
2. **Jewelry-not-armor gold.** A two-tier rose-gold → bright-gold METALLIC DIFFUSE with a deep-amber
   emissive floor (anti-olive; Solar's plate trick). Gold appears ONLY as jewelry forms — the
   train-clasp brooch, gem collets/bezels, the pectoral collar, the tiara, the wing spar, the keel
   rails — never plate armor (that is Solar's register). It is precious-metal MASS that catches the sun,
   NOT new emissive. The +30% chord (Risk #1 fallback) is EXERCISED and now canon.
3. **Scale-hierarchy law (import from Solar CP2).** Every repeated rank (wing primaries, train quills,
   crest, shingles) carries ONE dominant element + geometric decay — the wing's terminal "empress
   pinion" (~1.7×), the fan's center ray — never a picket fence of equals. Light follows the same
   hierarchy: consolidate the wing fire into two long burning crescent strokes, not per-feather dashes.
4. **Jewel-setting law.** Every gem reads ≥8px at chase distance and is SET in a gold bezel/collet at
   ~0.9× its carrier's length (Solar's welded-gem law). Floating/sub-pixel gems ("confetti") are a fail.
5. **Crown-echoes-train motif.** The radiant tiara is a miniature ray-burst of the Dawn Fan — one
   grammar, two anchors (crown above, train below), both read by the rear cam.
