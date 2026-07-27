# DRAGON-ANATOMY-REFERENCE.md — the creature-agnostic canonical reference

**Scope: every rideable creature, boss, and mount this repo will ever build** — a serpent, a
leviathan, a raptor-drake, a hexapod, a wyvern. This file carries the RANGES; the buildsheets
carry the choices. Companion docs own the method: [`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md)
(the creature playbook — §2 failure modes, §4 the wing kit, §5 the motion kit),
[`AAA-PIPELINE.md`](./AAA-PIPELINE.md) (§1 value-structure law, §2 cheap-tell registry),
[`FLAP-DESIGN.md`](./FLAP-DESIGN.md) (the flap dial vocabulary),
[`BOSS-DESIGN.md`](./BOSS-DESIGN.md), [`BIOME-DESIGN.md`](./BIOME-DESIGN.md).

---

## §0 How to use this file

> **How to use this file.** These tables are RANGES from real animals, real materials, and real craft — they are where your dials START, not where they end. The method: (1) pick the clade/material row closest to your creature's fantasy; (2) take the ratio as your neutral pose; (3) exaggerate ALONG the row's own axis (a deep-chested flyer gets a deeper chest, not a longer neck) by a deliberate, named factor — our stylization law says push taper and mass contrast well past nature, but push FROM a real number so the anatomy stays honest; (4) record the decision in your buildsheet as `value (ref §N range, ×K exaggeration)` so the next session can audit the taste, not re-derive the biology. Never copy a sibling creature's dial block — motion and proportion are identity (`DRAGON-DESIGN.md` §2.13). Never cite a Field Note as authority. If a build discovers this file is WRONG — a range that produces a bad read every time — the file is the bug: fix the table, tag the fix `[D]` with your evidence, and write the lesson file. `leapfrog^leapfrog`.

### §0.1 The tagging law (enforced in every table)

| Tag | Meaning |
|---|---|
| `[S]` | Sourced. The figure appeared in a retrieved source. Named in §11. |
| `[D]` | Derived. My arithmetic on a sourced figure, or reasoned craft judgement. One line of reasoning in §11. |
| `unknown` | Searched and not found. **A visible gap. Do not fill it in.** |
| `[no-assert]` | Cannot round-trip into a test. Nobody may claim it is verified. |
| `⚠` | A number that was discarded, disputed, or is actively poisonous. Read the note. |

**Admissibility.** A table row earns its place by carrying a NUMBER (ratio, range, count, angle)
plus a tag. Adjectives without numbers are inadmissible in tables — they survive only as a
one-line "reads as" verdict attached to a numeric row. A suspiciously precise single figure
without a source is a DEFECT: widen it to an honest range or cut it. Where two sources disagree,
BOTH numbers appear with the spread stated; nothing is silently averaged.

**Field Notes.** Interesting-but-unmeasurable material lives in an explicitly **non-normative**
Field Notes subsection at the end of its section. **No build decision may cite a Field Note
alone.**

---

## §1 The canon taxonomies

### §1.1 The limb-count ladder — the only hard taxonomic rule

Limb count is the sole distinction with real armorial authority, and it is only ~400 years old
and only British `[S]`. Everything else in the drake/wyrm/wyvern taxonomy is a modern,
largely D&D-driven retrofit — "these terms were never intended to be used that way" `[S, LOW]`.

| Taxon | Legs | Wings | Total limbs | Tail form | The read REQUIRES | The read FORBIDS |
|---|---|---|---|---|---|---|
| **Dragon** (English heraldic) | 4 | 2 | **6** | free, any | Four distinct leg roots + two wing roots, all visible | Nothing structurally; it may take *any* land or air beast attitude `[S]` |
| **Wyvern** | 2 | 2 (= the arms) | **4** | serpent hindquarters, load-bearing | Wings that ARE the arms; a clawed free thumb at the wrist; bird-type legs ("a Fowle in the Wings and Legs", Guillim 1610 `[S]`); tail ≥35–45% of body length `[D]`, thick-rooted | Any forelimb separate from the wing; wings hinged off the dorsal spine; rampant/segreant; a four-point landing |
| **Cockatrice** | 2 | 2 | 4 | serpent | A **rooster head** on an otherwise wyvern body — comb, wattle, beak, rooster legs, contrast-tinctured head furniture ("armed, combed and wattled") `[S]` | — |
| **Basilisk** | 2 | 2 | 4 | second dragon-like head at the tail tip, usually nowed `[S]` | A cockatrice PLUS a tail-terminal head | — |
| **Lindworm** | 2 | 0 | **2** | serpent | Wingless biped. Blazoned "a wyvern sans wings" `[S]` | Load-bearing wings |
| **Amphiptere / amphistere** | 0 | 2 | **2** | serpent, sometimes ending in a second serpent | Winged legless serpent. ⚠ Fox-Davies-lineage text says "a winged serpent **with dragons' feet**", which **conflicts** with the modern legless gloss — period usage is unstable `[S]`, do not present either as settled | — |
| **Wyrm** | 0 | 0 | **0** | whole body | Pure serpent `[S, LOW]` | — |
| **Drake** (modern fantasy only, not heraldic) | 4 | 0 | 4 | free | Four legs, no wings `[S, LOW]` | — |
| **Serpent** (heraldic) | 0 | 0 | 0 | whole body | Coil-as-silhouette; the attitude vocabulary is coil-based, not limb-based `[D]` | — |
| ⚠ **WoW "wyvern"** | 4 | 2 | 6 | scorpion-like `[D]` | Nothing draconic — a **winged lion**. A pure name collision `[S]` | Fur, leonine head, feathered ruff on any creature we call a wyvern |

**Derived design law `[D]`.** Limb count is a **primary** silhouette feature in the Riot sense
(§8.3) — it may never be changed to fix a collision, only chosen up front. One visible elbow that
is not a wing elbow converts a wyvern into a dragon at any resolution.

### §1.2 Heraldic attitudes — the pose vocabulary

> ⚠ **BLANKET REFUSAL, PRESERVED.** Heraldic blazon is a **verbal** system. It specifies wing
> *state* (addorsed / elevated / displayed), **never degrees**. Brief 1 searched for and could not
> source **any degree-value for any heraldic wing angle**. **Every angle in this table is `[D]`** —
> a drawing target read off how emblazoners actually draw those states, not period authority.
> `[no-assert]` as history; assertable only as a rig pose target.

Wing elevation = leading-edge / humerus axis above horizontal, side-on profile.

| Attitude (blazon) | Status | Wing carriage | Wing elevation `[D]` | Wing spread, plan `[D]` | Leg pose `[D]` | Tail carriage |
|---|---|---|---|---|---|---|
| **Statant, wings addorsed** *(the documented DEFAULT `[S]`)* | `[S]` as default | folded back-to-back over the spine, tips up-and-rearward, membrane hidden | **45–70°** | 0–15° separation | both feet planted, hock flex ~30°, body near-horizontal | long serpentine loop trailing aft, one full curl, tip raised; frequently **load-bearing** |
| **Statant, wings elevated and addorsed** ("indorsed/elevated") | `[S]` as phrase | back-to-back, lifted clear above the head | **60–85°** | 10–25° | as above, chest raised | as above, tip carried higher |
| **Statant, wings displayed** | `[S]` | opened outward, membrane presented, symmetric about the spine | **10–40°** | **140–180°** | both feet planted, weight forward | extended, often nowed once; a counterweight silhouette |
| **Erect / sejant erect** (the 2-legged substitute for *rampant*) | `[S]` — "erect" documented | elevated, addorsed or half-open | **70–95°** | 0–40° | body vertical, weight on **tail + feet as a tripod**; talons lifted and clawing | heavy S-curve, actively bracing; structural |
| **Sejant** | `[S]` — equivalent to statant for 2-legged forms | addorsed | 45–70° | 0–15° | haunches down, tarsi flat | coiled forward alongside |
| **Volant** (in flight) | term exists generally; rare for 2-legged forms | displayed, mid-stroke | **−20° to +60°** by stroke phase | 160–180° | legs tucked aft under the body, ~90° hock flex | streamed straight behind, slight S |
| **Passant** | `[D]` — reads as statant on a biped | addorsed | 45–70° | 0–15° | one foot advanced | trailing |
| **Rampant** | **UNAVAILABLE to a biped** `[S]` | — | — | — | requires four legs | — |
| **Segreant** | **UNAVAILABLE to a biped** `[S]` — reserved to winged QUADRUPEDS (griffin, dragon) | — | — | — | — | — |

**The one structural idea worth stealing `[S]`.** In *statant* and *erect* alike, a two-legged
heraldic beast **rests on its tail** — the tail is the third leg; the animal is a tripod. `[D]`
For a rear-chase flier this is the most transferable idea in the whole canon: the tail must carry
*structural* mass and read as load-rated — thick at the root, **35–45% of body length**,
articulated enough to brace — not a whip glued to a pelvis.

### §1.3 The tail-terminus timeline — and why the spade is not canon

| Period | Terminus convention | Tag |
|---|---|---|
| c. 750–1100 | Bayeux Tapestry dragon standard shown **without rear legs** — proto-wyvern | `[S]` |
| c. 1300–1500 | Word and concept = "viper" (ME `wyver` ← AF `wivre` ← L. `vipera`); hindquarters a plain serpentine coil | `[S]` etymology / `[D]` drawing |
| **1485–1603 (Tudor)** | **Smooth tail, blunt point. NO barb.** | `[S]` |
| 1562 / **1610** | Legh, then **Guillim** codify the two-legged type; the tail is *serpent*, unornamented. **1610 is the anchor date** (OED's earliest evidence for "wyvern") | `[S]` |
| 17th–18th c. | "Nowed" (knotted) documented in blazon; barbs begin appearing in emblazon | `[S]` nowed / `[D]` barb onset |
| **19th c.** | Barbed tail becomes near-universal in emblazon | `[S]` |
| 1909 | Fox-Davies records the barb as standard **and "a comparatively recent addition"** | `[S]` |
| 1970s–80s | D&D re-motivates the terminus as a **venomous stinger** | `[S]` text / `[D]` date |
| 1980s–present | Broad flat **"spade"** becomes default fantasy-illustration shorthand | `[D]` |

Sourced blazon tail vocabulary: **nowed** (knotted) `[S]`, **barbed** `[S]` (flagged recent),
**pointed** `[S]`, **smooth ending in a blunt point** `[S]`, **serpent's tail** `[S]`.
**spade / arrowhead / paddle — NOT FOUND in any blazon source. `unknown` → non-canonical.**

> ⚠ **REFUSAL PRESERVED.** Brief 1 could not source a documented art-historical trace of when the
> broad spade entered the visual record. It has a firm *negative* (Fox-Davies: barbs are recent,
> Tudor tails were smooth) and a plausible *hypothesis* (devil iconography → generic evil-beast
> shorthand → Victorian emblazon → 20th-c. illustration) `[S, LOW]`. **The hypothesis is not a
> fact.** The negative claim — "the spade is not in period blazon" — is solid.

**De-kitsch laws for any tail terminus `[D]`, each anchored on a named build:**

| # | Law | Anchor |
|---|---|---|
| 1 | **Motivate it.** Venom delivery, rudder, club, display organ. A shape with a stated job stops reading as ornament | D&D stinger `[S]`; ARK ballast fin `[S]` |
| 2 | **Hook count > 1**, radially arranged, **not coplanar**. 1 flat blade = clipart; 2–4 barbs = anatomy | Rathalos bulbous spiked club; Rathian venomous needle cluster `[S]` |
| 3 | **Break the plane.** A terminus coplanar with the tail is a decal — rotate, twist, or stagger it out of the silhouette plane | `[D]` |
| 4 | **Break symmetry.** Asymmetric hooks, wear, a broken barb, an old scar | Toothless' lost left fin + visible prosthetic manufacture `[S]` |
| 5 | **Or delete it** — let the dorsal ridge + tail motion arc carry the silhouette | Drogon, Skyrim `[D]` visual reading |
| 6 | **Scale discipline: terminus width ≤ ~1.5× local tail diameter.** Wider reads as costume | `[D]` |
| 7 | **Make it the tell.** A variant-coded fin/knob is the cheapest identity win available | ARK elemental variants `[S]` |

### §1.4 The fictional-benchmark table

Normalized to **body length = 1.0** (nose→tail tip) where a number exists.

> ⚠ **REFUSAL PRESERVED — DO NOT BUILD PROPORTIONS OFF THIS TABLE.** Brief 1 found **no reliable
> published dimensions for Smaug, Drogon, or Rathalos**. The Drogon (≈60 ft / ≈100 ft) and
> Rathalos (22.4 m / 20 m) figures come from **fan aggregation**, not from Weta, HBO, or Capcom.
> The only production-side scale statement sourced is a director calling the S7 dragons "the size
> of 747s". **Finger counts are `unknown` for every build** except the plural word "phalanges"
> for Rathalos. These cells stay `unknown` on purpose. `[no-assert]`

| Build | Limb config | Wing-arm anatomy | Fingers in membrane | Span : body | Tail terminus | Tag |
|---|---|---|---|---|---|---|
| **Smaug** (2013) | **4** — wing-arms + hind legs. **Was 6-limbed in film 1 and retro-fixed on home video** | Bat-type; hands must **gesture and emote** — this drove the entire redesign | unknown | unknown | long taper, narrow blade-like tip | `[S]` for the limb change; terminus `[D, LOW]` |
| **Drogon** (GoT) | **4** | Bat-type; **thumb claw at the wrist takes ground weight**; gorilla-referenced knuckle-walk | ~3–4 `[D]` visual | ⚠ **≈1.7** `[S, LOW — fan figure, indicative only]` | **none** — pure tapering whip + dorsal spine row `[D]` | Pixomondo refs `[S]` |
| **Skyrim / Alduin** | **4** — "wing/arm hybrid forelimbs like bats"; walks on fingered wings ("pseudowyvern") | bat-type, wing-walking | unknown | ≈1.2–1.4 `[D, LOW]` | **none** — taper + dorsal scutes; the tail is a bludgeon `[D]` | `[S, LOW]` |
| **Rathalos** (MH) | **4** — "the common body type of flying wyverns" | "membrane stretched over **bone phalanges**" — explicitly fingered | **≥3** implied `[S]` (plural); exact count unknown | ⚠ ≈0.9 `[S, VERY LOW — a fan post, not Capcom]` | **bulbous spiked club**; ♂ one large spike, ♀ (Rathian) venomous needle cluster | `[S]` |
| **ARK Fire Wyvern** | **4** — "bipedal… powerful hind legs… **no forelimbs**" | "same design mechanisms as **bats** but the grace and strength of the Condor" | unknown | unknown | **fin or knob, variant-dependent**; tail acts as **ballast** | `[S]` |
| **D&D Wyvern** | **4** — "two scaly legs, leathery wings" | leathery/bat | unknown | unknown | **poison stinger** (own attack, DC 15 CON, 7d6) | `[S]` |
| **Century: Age of Ashes** mounts | **4** (wyvern config), officially branded "dragons" | bat-type | unknown | unknown | unknown | `[S]` |
| **Fire Emblem "wyverns"** | ⚠ **MOSTLY 6** — most mounts are "generic 6-limbed dragons which disqualifies them from being wyverns"; only the GBA **Wyvern Knight** rides a true 4-limbed wyvern | varies | unknown | unknown | unknown | `[S]` |
| **Toothless** — *counterexample* | **6** — four legs + separate wings. **Not a wyvern** | separate wings | n/a | "largest wing-to-body ratio in-franchise" `[S]` — lore, **not a measurement** | **paired horizontal fins**, one lost and prosthetic | `[S]` |

**§1.5 The single most important datum in the benchmark set `[S]`.** Peter Jackson changed Smaug
from four legs to two **so the dragon could act with its hands**: "the character had to be able to
**emote through his hands** — which necessitated a return to a two-legged dragon with wings on his
arms," which also "made him feel more animal-like and a lot more powerful." Film 1 was
retro-corrected on home video. `[D]` **Merging the arm and the wing concentrates all expressive
mass into one structure**, which reads better at speed and at silhouette scale — the argument for
the four-limb build as a *superior* design, not a budget one, and directly load-bearing for a
rear-chase camera that mostly sees wings, spine, and tail.

### §1.6 Wing-arm anatomy: the two real templates

| Template | Structure | Character | Silhouette lines |
|---|---|---|---|
| **Bat** | Digits **II–V** elongated, all supporting the `dactylopatagium`; **thumb (I) free and clawed**; `plagiopatagium` runs digit V → hindlimb. "Bat wings are truly specialized hands"; flight "relies on the fingers **bending**" `[S]` | **Flexible, grasping, expressive.** Free thumb claw = a ground-contact point AND a gesture point | Many (one per digit) |
| **Pterosaur** | **Only digit IV** elongated into the wing finger; `brachiopatagium` from arm + digit IV to the leg; other digits stay short and clawed. Wing geometry determined by **rigidity** `[S]` | **Rigid, clean, fast-reading.** Cannot gesture | Few (one long spar) |

`[D]` Every major modern wyvern-shaped build chose **bat**, and the Pixomondo rationale explains
why: "bats seem to **crawl into the air with their fingers**" `[S]` — bat wings can *act*.

### §1.7 What §1 rules out

- **Any forelimb separate from the wing on a 4-limb creature.** Six limbs is the definition of the
  dragon `[S]`. One non-wing elbow and the read is gone.
- **Wings hinged from the shoulder blades / dorsal spine** on a 4-limb creature — exactly what Weta
  had to undo between the two Hobbit films `[S]`.
- **Rampant / segreant poses on a biped** — structurally unavailable `[S]`.
- **Mammalian front paws used for grabbing** on a wyvern-type. It grabs with feet (raptor grip) or
  the wing-wrist claw `[S]`.
- **A four-point landing** on a biped. Two feet, or two feet + wing knuckles, or two feet + tail.
- **Comb, wattle, beak, or rooster feet** on a wyvern-type → cockatrice `[S]`. A crest that reads as
  a comb is the easiest accidental misread available.
- **Contrast-tinctured head furniture** (red crest on a gold head) → the "armed, combed and
  wattled" formula `[S]`. Keep head ornament in-family with body colour.
- **A second head or head-like tail terminus** → basilisk `[S]`.
- **Vestigial / non-load-bearing wings** on a biped → lindworm `[S]`. Wings must look structural at
  all times.
- **A body so long and low the legs vanish under it** → wyrm.
- **A broad flat coplanar spade tail.** Not period, not blazon, and the exact tell every modern
  build listed above deliberately avoids or re-motivates (§1.3).
- **A single symmetric barb.** Use ≥2 hooks, a functional stinger, a fin/knob, or a spiked club.
- **A weightless whip tail with no structural role** — throws away the one anatomical idea the
  canon actually contributes (§1.2).
- **A single-spar pterosaur wing if the wing must emote** — cheap, but it cannot gesture (§1.6).
- **Fur, a leonine head, or a feathered ruff** on anything called a wyvern → WoW name collision `[S]`.
- **Paired horizontal tail fins** → reads instantly as Toothless `[S]`.

### §1.8 Field Notes (NON-NORMATIVE — never cite alone)

- The wyvern is a **British** taxonomic invention; Fox-Davies himself notes other countries fold
  wyvern, basilisk, and cockatrice all under "dragon". Quoting the wyvern deliberately means
  quoting British heraldic drawing, not "generic European dragon."
- The wyvern is the one heraldic beast whose *bestiary* meaning (plague, Satan, war, "especially
  said to spread the plague") **contradicts** its *armorial* meaning (guardian, valour, power).
  A mount that is also a walking disaster sits squarely inside that contradiction.
- ⚠ Brief 1 **could not source any tincture-frequency survey** for wyverns and found **no named
  `vert` example**. Documented instances only: 43rd (Wessex) Division badge = **or/gold on azure**
  (1935); Leicester = **argent** "strewed with wounds gules"; Venables of Kinderton = **gules**.
  The "Wessex wyvern" association was itself **popularised in the 19th century** (E. A. Freeman) —
  partly a Victorian reconstruction. A **Mercian wyvern standard is `unknown`**; do not assert it.
- Audiences accept "dragon" as the *word* for a wyvern *shape* (Century: Age of Ashes ships
  4-limbed mounts and calls them dragons). Nomenclature is not the bet; silhouette is.
- The medieval dragon's "strength lies **not in its teeth but in its tail**… it kills anything
  around which it wraps its tail" — the period tail is a **constrictor and a club**, not a blade.
- ⚠ Unresolved conflict: a secondary claim dates "wyver" to the 1312 Great Roll; **OED gives
  c.1374 (Chaucer)**. Treat 1312 as unverified.

---

## §2 Body-plan proportion tables

> **NORMALIZATION — read before using any number here.** The art-director brief asked for tables
> normalized to *body length = 1.0*. The sourced literature does not measure that. Museum and
> popular figures quote **total length** (snout→tail tip) or **SVL**; the only ratio a 3D builder
> can actually chain from published element lengths is **torso = glenoid→acetabulum**. **So
> `1.0` in every table below is the TORSO (shoulder→hip).** Convert with the per-clade
> `total length : torso` row where one exists. Cells marked `~` are chained from sourced element
> lengths; `unknown` cells are honest gaps, not omissions.

### §2.1 Pterosaurs — the PROPORTION reference

| Taxon | Span | Chest depth | Skull | Neck | Hindlimb | Tail | Pectoral mass frac | Borrowable trait |
|---|---|---|---|---|---|---|---|---|
| ***Q. lawsoni*** | **~14–17** `[D]` | unknown | **~3.1** `[D from S]` | **~4.7** `[D from S]` | **~2.9** `[D from S]` | ~0.4–0.5 `[D]` | 20–25% `[S]` | The whole animal is a wing with a dog-sized hub hanging off it |
| ***Q. northropi*** | **~13–15** `[D from S]`; ⚠ **6.2** if Henderson's reconstruction `[D from S]` | unknown | ~3 `[D]` | ~4–5 `[D]` | ~2.9 `[D]` | ~0.4–0.5 `[D]` | 20–25% `[S]` | The **discarded** heavier reconstruction (6.2) is the game-usable one — see §2.7 |
| ***Pteranodon longiceps*** | ~10–15 `[D]` | unknown | ~2–2.5 `[D]` | ~1.0–1.3 `[D]` | unknown | **~0.5** `[D from S]` (tail = 3.5% of span, ≤25 cm) | — | AR **9:1** `[S]` vs albatross 8:1 — high AR without albatross extremes |
| ***Anhanguera*** | ~10–15 `[D]` | unknown | ~2 `[D]` | ~1.2 `[D]` | unknown | ~0.4 `[D]` | — | Flight muscle "more **distributed** than in birds" `[S]` — no keel blade needed |
| ***Tapejara wellnhoferi*** | ~10–14 `[D]` | unknown | ~1.5 `[D]` | ~1.0 `[D]` | unknown | ~0.4 `[D]` | — | Broad low-AR azhdarchoid wing — the "manoeuvrer" end of the clade |

**The rule that generates the whole clade `[S]`.** *"…their torsos were probably only a third or so
longer than their humeri, suggesting a shoulder–hip length of about 65–75 cm for an animal with a
10 m wingspan."* ⇒ **torso ≈ 1.33 × humerus**, **wingspan : torso ≈ 13–15 : 1** `[D from S]`.
Cross-check that passes `[D]`: the rule applied to *Q. lawsoni*'s sourced humerus (23–25 cm) gives
torso ≈ 31–33 cm, and 4.5 m ÷ 0.32 m = **14.1** — the same band stated independently for
*northropi*, across a 2× size range.

***Q. lawsoni* elements, torso = 1.0** `[D from S element lengths]`: humerus **0.75**, radius/ulna
**1.17**, metacarpal IV **1.45**, femur **1.11**, tibia **1.80**. ⚠ The **wing finger is not in this
list** — it is the longest element by far and drives the span.
**Standing pose `[S]`:** quadrupedal shoulder height ~2–2.5 m, head raised >4 m, "an erect stance
and a parasagittal gait… terrestrial locomotion powered almost entirely by the hind limbs."

### §2.2 Megabats — the MEMBRANE and LEG-AS-SPAR reference (⚠ NOT the proportion reference)

Column 1 is span : head+body; column 2 converts to torso (torso ≈ 0.55–0.62 × head+body `[D]`).

| Taxon | Span : head+body | Span : torso | Forearm : head+body | Leg | Free tail | Mass | Borrowable trait |
|---|---|---|---|---|---|---|---|
| ***Pteropus vampyrus*** | **~4.3–5.0** `[D]` | ~7–8 `[D]` | 0.55–0.65 `[S]` | wing ≈ **4×** leg `[S]` ⇒ leg : torso ≈ 0.7–0.9 `[D]` | **~0** `[S]` | 0.65–1.1 kg `[S]` | The four-spar fan and its per-bay camber control |
| ***P. poliocephalus*** | ~4.0 `[D]` | ~6.5–7 `[D]` | 0.64 `[D]` | same `[D]` | ~0 | 0.6–1.0 kg `[S]` | Forearm mean 161 mm on a 253 mm body — distal elongation |
| ***P. hypomelanus*** | ~5.0–6.6 `[D]` | ~8–10 `[D]` | 0.63 `[D]` | same `[D]` | ~0 | 0.3–0.65 kg `[S]` | The high-span end of the genus |
| ***Desmodus rotundus*** | ~4.5 `[D]` | ~7–8 `[D]` | 0.65 `[D]` | shorter, no uropatagium `[D]` | **0** `[S]` | 25–38 g `[S]` | ⚠ **Highest wing loading of the species studied** `[S]` — and it is 30 grams (see the trap below) |

**Flight-muscle fraction for bats: `unknown`.** Not obtainable this pass. Broadly comparable to
birds at ~15–20% `[D, LOW]` — flagged, not asserted. `[no-assert]`

**Bat hindlimb architecture — copy or deliberately reject, but decide `[S]`:**
hindlimbs **rotated 180°** (knees point up when walking); tibia **shorter and more slender** than
in non-volant mammals of the same mass; fibula vestigial and fused. Critically, forelimb and
hindlimb proportions are **evolutionarily locked together by the wing membrane**, which "inhibits
ecological adaptation." ⇒ **attach a membrane to the ankle and you have welded the leg pose to the
wing shape forever.** That is a strong stylistic commitment, not a free detail.

> ⚠ **THE WING-LOADING TRAP.** *Desmodus* is the highest-wing-loading bat measured `[S]` and it
> masses 30 g. **High wing loading at small scale reads *agile*; the same number at 10 m reads
> *unflyable*.** Never port a wing-loading figure across two orders of magnitude of mass.

### §2.3 Large soaring birds — the AR and WING-LOADING reference

| Taxon | Span : torso | Total L : torso | Chest depth | Neck | Tail | Aspect ratio | Wing loading | Mass | Borrowable trait |
|---|---|---|---|---|---|---|---|---|---|
| Wandering albatross | ~9–11 `[D]` | ~3.5–4.0 `[D]` | ~0.55–0.7 `[D]` | ~1.0–1.3 `[D]` | ~0.5–0.7 `[D]` | **15:1** `[S]` | ~140–190 N/m² `[D]` | 5.9–12.7 kg `[S]` | ⚠ The AR ceiling — above this the wing stops reading as an arm |
| Andean condor | ~9–10 `[D]` | ~3.5 `[D]` | ~0.6–0.75 `[D]` | ~0.8–1.0 `[D]` | ~0.7–0.9 `[D]` | ~7–8 `[D]` | **California condor 70.6 N/m²** `[S]` | mean 11.3 kg, ♂ to 15 kg `[S]` | Broad slotted wing at AR 7 — the "big soarer that can still beat" zone |
| Bearded vulture | ~8–9 `[D]` | ~3.5–4.0 `[D]` | ~0.6 `[D]` | ~0.7–0.9 `[D]` | ~1.0–1.3 `[D]` | ~7–8 `[D]` | unknown | 4.5–7.8 kg `[S]` | A long wedge tail as a genuine aft silhouette mass |
| Marabou stork | ~7–9 `[D]` | ~3.7 `[D]` | ~0.5 `[D]` | **~1.5–2.0** `[D]` | ~0.6 `[D]` | ~7 `[D]` | unknown | 4.5–8 kg `[S]` | Long-necked flyer proportions |
| ***Argentavis magnificens*** (†) | ~11–13 `[D]` | unknown | unknown | unknown | unknown | ~7–8 `[D]` | **84.6 N/m²** `[S]`, area **8.11 m²** `[S]` | **70–72 kg** `[S]` | The largest flying bird known — and *probably too large for continuous flapping or standing takeoff under its own muscle power* `[S]` |

> ⚠ **POISONED NUMBER — DISCARDED, PRESERVED HERE SO IT NEVER RETURNS.** A search result asserted
> an Andean condor wing loading of **"0.64 N/m²"** from "4.5 kg over ~7 m² of wing." That is
> **wrong by roughly two orders of magnitude (~100×)** — a real Andean condor carries ~1.2–1.5 m²
> of wing and masses ~11 kg. **Discarded.** The credible anchors are the PNAS figures: California
> condor **70.6 N/m²**, *Argentavis* **84.6 N/m²**.

**⚠ The sternal keel relationship is INVERTED from intuition `[S]`.** *"Sternum morphology was
related to body size, with **larger birds having a shallow keel** and a wide metasternum… as bird
size decreased, the depth of the keel increased."* Large soaring Accipitriformes "had relatively
shallow keels." Also: *"Deeper sternal keels are correlated with slower but stronger flight."*
⇒ **a giant soaring creature must NOT get a comically deep bird keel.** Depth comes from muscle
bulk wrapping the ribcage, not a blade sticking out of the front.
**Numeric keel-depth : sternum-length ratio: `unknown` from any source.** `[D, LOW]` working
values only: ~0.35–0.5 for a strong flapper, ~0.2–0.3 for a large soarer. `[no-assert]`

### §2.4 Theropods — the BALANCE reference

| Taxon | Femur | Tibia | Metatarsus | tibia : femur | Skull | Tail | Notes |
|---|---|---|---|---|---|---|---|
| Large theropod, generic | **0.55** `[D]` | **0.48** `[D]` | **0.28** `[D]` | ~0.87 `[D]` | ~1.12 × femur `[D from S]` | **2.4–2.6** `[D from S]` | Standing hindlimb ≈ **1.3 × torso** `[D]` |
| *T. rex* (Sue) | ~1.32 m `[D]` | ~1.17 m `[D]` | ~0.68 m `[D]` | ~0.89 `[D]` | **1.53 m** `[S]` | ">50% of total length" `[S]` | Tyrannosaurids have "significantly longer distal hindlimb components relative to femur length than most other theropods" `[S]` |
| *Allosaurus fragilis* | **103.0 cm** `[S]` | **74.7 cm** `[S]` | unknown | ⚠ ~0.73 `[D]` — **different individuals, approximate** | 845 mm at 7.9 m TL `[S]`; 0.8–1.1 m in large adults `[S]` | unknown | "A massive skull on a **short neck**" `[S]` |
| *Deinonychus antirrhopus* | ⚠ contested — Ostrom's estimate "proved to have been an overestimate" `[S]` | — | short | — | — | unknown as a fraction | **foot : tibia = 0.48** `[S]`, "due partly to an unusually short metatarsus" |

**Contrast that generates identity `[D]`.** *Q. lawsoni* femur ≈ **1.11 × torso**; a large
theropod femur ≈ **0.55 × torso**. **A pterosaur's leg is roughly 2.2× longer relative to its
torso than a theropod's.** Leg length relative to torso is the fastest single discriminator
between "pterosaur-descended flyer" and "winged theropod."

**⚠ The tail-length refusal, preserved `[S]`.** *"A new dataset confirms that there is **little or
no consistent relationship between tail length and snout–sacrum length**. Consequently, attempts
to estimate one from the other are likely to be very error-prone."* **You may NOT derive a
creature's tail length from its torso by rule.** Tail length is a **free design variable** that
the real animals also treated as free.

**The caudal-shape rule that IS consistent `[S]`:** an early short series of decreasing centra,
then a short series that **increase** (typically including the longest centra in the tail),
then a long progressive decrease — the longer anterior centra coincide with the major femoral
muscle attachments. ⇒ **the fattest segments of a tail chain are NOT at the hip; they sit a short
distance aft of it.** On a ~25-segment chain, put the bulge at roughly **segments 3–8** `[D]`.

**Standing joint angles.** Precise degree values were **not sourced**. What IS sourced is the
trend and its driver `[S]`: birds hold an unusually **crouched** posture powered by **knee
flexion**; non-avian theropods held a **more upright** posture powered by **femur retraction**;
hip extension, adduction–abduction, long-axis rotation, knee flexion, COM position, and degree of
crouch all change **gradually** along *Daspletosaurus* → *"Troodon"* → chicken. `[D, MEDIUM]`
working ranges — flagged, not asserted:

| Stance | Femur | Knee | Ankle |
|---|---|---|---|
| Non-avian theropod, standing | 15–35° below horizontal (sub-vertical) | ~120–145° (fairly open) | ~110–140° |
| Bird, standing | ~55–75° from vertical (near horizontal) | ~70–100° (deeply flexed) | ~90–120° |

### §2.5 Monitors — the SURFACE reference

| Measure | Value | Tag |
|---|---|---|
| *V. komodoensis* reference individual (7 yr ♀) | SVL 93 cm, head 18 cm, tail 107.8 cm, 30 kg | `[S]` |
| **Tail : SVL** | **1.16** | `[D from S]` |
| **Tail : trunk** | **~2.0–2.1** | `[D]` |
| Head : SVL | **0.19** | `[D from S]` |
| Skull : SVL | **~0.15** | `[S]` |
| Adult size | 2.5–2.8 m total, 60–90 kg (wild ♂) | `[S]` |
| Limb posture | "**upper limbs (humerus and femur) held roughly horizontal**, while the lower limbs angle downward" | `[S]` |
| Posture varies with ecology | climbing species sprawl; **terrestrial species are more upright** | `[S]` |
| Numeric abduction angles | **unknown** — searched, not found | — |

**The scale-field trap — the single most expensive detail mistake available `[S]`.** Dorsally the
trunk **lacks osteoderms** in *Varanus* (ventrally, small nonarticulate ones in some species);
*V. komodoensis* is the exception with an extensive **cephalic** shield. Head scales are relatively
large, dorsal scales smaller and **keeled**, ventral slightly larger than dorsal; surfaces run
flat-and-smooth, domed-and-smooth, or **domed with conical ornamentation**.
**Repeating-unit size: no source gave a numeric scale diameter.** `[D, LOW–MEDIUM, photographic
scale on a 2.5 m animal]`: dorsal trunk scale ≈ 3–6 mm ≈ **0.12–0.24% of total length** ≈
**0.6–1.2% of torso length**; head/nuchal 2–3× that. `[no-assert]`

⇒ **On an 8–12 m creature the honest scale unit is 1.0–2.9 cm — sub-pixel noise at cruise
distance.** A varanid-accurate scale field is invisible and costs the whole budget. **The only
units that survive the cruise camera are the OVERSIZED three: the head shield, the nuchal/dorsal
ridge row, and the ventral belly bands** — which is exactly where varanids concentrate their
genuinely large differentiated scales. **The honest exaggeration and the readable exaggeration are
the same move.**

### §2.6 The pectoral hub — flight-muscle fraction

| Group | Flight muscle as % of body mass | Keel / sternal depth |
|---|---|---|
| **Birds** | pectoralis **8–17%**, supracoracoideus **2–4%**, total **up to 25%** `[S]`; commonly quoted 15–25% `[S, secondary]` | Deep keel; **deeper in small/strong fliers, shallower in large soarers** `[S]`. Numeric ratio `unknown` |
| Supracoracoideus vs pectoralis | supracoracoideus ≈ **1/5** the mass of pectoralis `[S]` | — |
| **Pterosaurs** | **20–25%** — ~50 kg of pectoral muscle in a 200–250 kg azhdarchid `[S]`. ⚠ An outlier claim of **30–40%** exists `[S, secondary]` — the upper fringe, **not** the norm. Both numbers given; not averaged | **Shallow.** "Pterosaurs did not require a deeply keeled sternum, unlike modern birds" `[S]`; the sternum is "a thin sternal plate with a sternal crest projecting ventrally… subrectangular, longer than wide" `[S]` |
| **Bats** | **unknown** (see §2.2) | No keel — the upstroke is powered by dorsal muscles `[D]` |

**THE STRONGEST ASYMMETRY AVAILABLE — Habib's load path `[S]`.** *"Birds have proportionally
robust and strong hindlimb skeletons but relatively slender wing bones… **Pterosaurs show the
opposite condition: their forelimbs are larger and stronger than their legs, with this
relationship increasingly pronounced in larger species.**"*
⇒ **A flyer whose wings ARE its arms must have humerus cross-section visibly THICKER than femur
cross-section, and the gap must widen with size.** A creature whose thighs out-mass its humerus
reads as a winged theropod. This is free, cheap, and almost never done in dragon art.

**Anvil-chest justification `[S]`.** *"This quadrupedal launch strategy is economical because the
same muscles that power flight can also initiate launch, allowing quad launchers to have **smaller
torsos** and thus lower masses than bipedal launchers."* The anvil is real but **SHORT**: mass
concentrated in a compact, deep, wide hub — never a long barrel.

### §2.7 Mass, span, and the honest exaggeration

| Statement | Value | Tag |
|---|---|---|
| Upper limit for soaring flight (flapping-frequency scaling) | **41 kg body mass, 5.1 m wingspan** | `[S]` |
| Flapping-frequency scaling exponents | takeoff ∝ mass^−0.30; cruise ∝ mass^−0.18 (models predict −1/3, −1/6) | `[S]` |
| Realized limit in extant birds | wandering albatross ~12 kg | `[S]` |
| ⚠ Giant-pterosaur mass — **the live dispute, both numbers given** | Witton 2008 / Witton & Habib 2010: **200–250 kg**. Henderson 2010 (3D slicing): **544 kg**. Challenged on bone-robustness grounds; unresolved | `[S]` both |
| Pterosaur mass range overall | **35 g – 259 kg** | `[S]` |
| ⚠ *Pteranodon* mass | published spread **20–93 kg** for large ♂ — **the field does not agree; the spread IS the answer** | `[S]` |
| *Q. northropi* wing loading | ≈ **220 N/m² ≈ 22 kg/m²** | `[D]` (250 kg, 10 m, AR≈9) |
| Pterosaur mass–span exponent | **mass ∝ span^2.97 ≈ span³** | `[D — regression on two sourced points]` |

**Spindliness index (mass ÷ span³) `[D]`:** Andean condor 0.345 · *P. vampyrus* 0.31 · wandering
albatross 0.305 · *Argentavis* 0.207 · *Q. northropi* (Witton) 0.216 · *Q. northropi* (Henderson)
0.47 kg/m³. **The giants sit ~35% below the metre-scale flyers. Bigger flyers must look spindlier
per unit span.**

**Mass of an 8–12 m creature `[D from sourced anchors + the cube exponent]`:**

| Wingspan | At pterosaur build | At bat/condor build |
|---|---|---|
| 8 m | ~110 kg | ~160 kg |
| 10 m | ~215 kg | ~310 kg |
| 12 m | ~370 kg | ~535 kg |
| 15 m | ~720 kg | ~1,040 kg |

**THE RIDEABILITY PROBLEM, stated numerically.** The torso rule gives a 10 m-span animal a
**65–75 cm** torso `[S]` and ~25–32 cm torso width `[D]`. A seated adult needs ~50–60 cm of saddle
length and ~40–45 cm of straddle width. **A biologically honest 10 m flyer is physically too small
to sit on**, and at ~215 kg it would carry a rider equal to ~35–40% of its own mass — versus the
20–25% that its *entire* flight musculature masses `[S]`.

**Therefore the sanctioned exaggeration `[D]`:**
1. **Span : torso ≈ 5.0–6.5**, not the real 10–15 (at 12 m span, a **1.85–2.4 m torso**). This
   lands almost exactly on Henderson's 11.2 m / 1.8 m = **6.2** `[S]` — the heavier, now-disfavoured
   *scientific* reconstruction. **The game's cheat is the field's discarded hypothesis, which is the
   best possible place for a cheat to live**: proposed by a professional, drawn to scale, rejected
   only on flight-power grounds we do not have to honour.
2. Implied mass **600–900 kg at 12 m span** `[D]` — tune every secondary motion (landing impact,
   banking inertia, tail follow-through) to that number, and say so in the buildsheet.
3. **Do NOT also inflate the span.** Inflating both gets a plane. Inflate the torso, keep the span
   honest, and the creature reads as a *heavy* flyer.

**Clade role assignment `[D]` — the whole of §2 in one line: pterosaurs are the PROPORTION
reference; theropods the BALANCE reference; bats the MEMBRANE and LEG-AS-SPAR reference (never
proportion); varanids the SURFACE reference.** Scale a flying fox to 10 m and you get a plush toy
massing ~310 kg with a 2.5 m torso — the proportions do not survive the scaling.

### §2.8 What §2 rules out

- **Span : torso > 9 combined with a short/absent free tail** → bird. (The ratio alone is not the
  tell — albatross 9–11, azhdarchid 13–15 `[D from S]`; it is the ratio *plus* the missing tail.)
- **A deep protruding keel blade.** Large soarers have *shallow* keels `[S]`; pterosaurs "did not
  require a deeply keeled sternum" `[S]`. A blade out of the sternum is a chicken cue.
- **More than ~10 visible neck joints**, or a resting neck chord:arc below ~0.7 → bird (§3.4).
- **A fanned tail used as an aerodynamic surface.** A rectrices fan is feather logic.
- **Legs trailing straight aft in cruise** → the actual raptor/stork/crane pose `[S]`, unavoidably
  bird-coded from a chase camera (§3.3).
- **Femur shorter than 0.6 × torso** on a flyer → theropod/bird territory `[D]`.
- **Span : torso ≈ 4–5 with a rounded plush torso** → flying-fox proportions, which do not scale.
- **Membrane running unbroken to the ankle with no free tail** → the bat identity signature `[S]`,
  and it permanently welds leg pose to wing shape.
- **Knees pointing up/backward** (the 180° rotated bat hip) `[S]` → instantly mammalian.
- **Hindlimbs shorter than the torso, slender and stick-like** `[S]` → bat.
- **Big pinnae** → the fastest bat tell of all.
- **Aspect ratio > 12, or a wing of near-constant chord** → plane. Real referents: *Pteranodon*
  9:1 `[S]`, albatross 15:1 `[S]`, *Argentavis* ~7–8 `[D]`. **Pick 7–9.**
- **No spanwise thickness change** — a wing with the same thickness at root and tip is a wing box.
- **A constant-cross-section fuselage torso.** The real torso is a hub, not a tube.
- **A dihedral held rigidly through cruise.** Vultures vary bank angle constantly `[S]`; condors
  flap ~1% of the time `[S]` but the wing is never geometrically static.
- **Sprawled limbs with a horizontal femur** → varanid `[S]`; a flyer that walks sprawled could
  not have launched. (Even within varanids the *terrestrial* species are the upright ones `[S]`.)
- **A uniform field of small keeled scales as the primary surface read** → invisible at cruise
  (§2.5), and most varanids lack dorsal trunk osteoderms entirely `[S]`.
- **A monotonically tapering tail at maximum width at the hip** → contradicted by the caudal
  pattern `[S]` (§2.4).
- **A neck carried straight and horizontal at spine height** → lizard default; a flyer carries the
  neck raised and shallowly sinuous `[S]`.
- **Equal-thickness fore and hind limbs** → throws away Habib's asymmetry `[S]` (§2.6).

### §2.9 Field Notes (NON-NORMATIVE)

- **Ontogeny is a free variant generator `[S]`:** COM moves *caudally* with age in *T. rex* —
  juveniles are front-light, adults tail-heavy. A "juvenile" roster variant = shorten the tail,
  move the COM forward, crouch the leg.
- *Deinonychus*' distal ~60% of tail was a **stiff rudder** enclosed in interwoven bony rods,
  hinging only at the base — a different tail *idea* from a whip, with no absolute ratio published.
- The pterosaur keel is shallow and it still works because "neither pterosaurs nor basal paraves
  used their m. supracoracoideus as a pulley" and the muscle base is "more distributed than that of
  birds" — they recruited the whole shoulder/back rather than one keel blade.

---

## §3 Balance and carriage

### §3.1 Centre of mass — the two conditions one skeleton must satisfy

| Condition | Rule | Tag |
|---|---|---|
| **Ground balance** | COM sits **0.30–0.45 × femur length forward of the acetabulum**; the Sue model reaches **0.44–0.61**; the juvenile "Jane" sits at the low bound, **0.30–0.35** | `[S]` |
| Converted for a builder (*T. rex*) | COM ≈ **0.17–0.26 torso lengths forward of the acetabulum**; ~0.34 using Sue's higher figure | `[D from S]` |
| **Flight balance** | With the wings as the arms, the entire aerodynamic load enters at one point (the glenoid). COM must lie within **~0.10–0.20 torso lengths aft of the glenoid** | `[D]` |
| Reconciliation | Solving both simultaneously demands **femur ≈ 1.8–3.0 × torso** for a *centred* COM — which is why the real solution is not a centred COM. Real pterosaurs push the glenoid far forward and run a long femur (**1.11 × torso** `[D from S]`) vs a large theropod's **0.55** `[D]` | `[D]` |

**The practical layout that satisfies both `[D]`:**

| Landmark | Placement (fraction of torso length from the front of the trunk) |
|---|---|
| **Glenoid** | **0.10–0.15** — the pectoral hub is the very front of the animal; the neck emerges from above and ahead of the wing root, never off a long pre-shoulder chest run |
| **Acetabulum** | **0.90–1.00** — almost no lumbar region; the ribcage runs nearly to the hip. This is "the anvil": a short, deep, wide box |
| **COM** | **0.22–0.32 aft of the glenoid** — still in the front third of a very short torso, where the 20–25% flight-muscle mass `[S]` naturally sits |
| **Femur** | **0.9–1.2 × torso length.** The two balance conditions only reconcile when the leg is long. **Short-legged flyers are unbalanced flyers** |

**The anvil-to-whip transition, stated geometrically `[D]`:** cross-sectional maximum at the
glenoid → hold ~85% of that depth to the acetabulum → let the caudofemoralis bulge peak at
**15–25% of tail length** → then a long accelerating taper. Every element is anchored on a sourced
anatomical fact (§2.4, §2.6).

### §3.2 Tail as counterweight

| Rule | Value | Tag |
|---|---|---|
| Target tail : torso for a heavy walker-flyer | **2.0–3.0** (varanid ~2.0, *T. rex* ~2.4–2.6) | `[D from S]` |
| Heraldic structural minimum (tail as third leg) | **35–45% of body length**, thick-rooted | `[D]`, §1.2 |
| Fattest chain segments | **aft of the hip, not at it** — segments ~3–8 of ~25 | `[S]` pattern / `[D]` mapping |
| ⚠ Tail length from torso by rule | **FORBIDDEN** — "little or no consistent relationship" `[S]`, §2.4 | `[S]` |

**THE COUPLED DIAL — tail mass and femur angle are ONE dial, not two `[S]`.** *"Chickens raised
wearing artificial tails, and consequently with more posteriorly located centre of mass, showed a
**more vertical orientation of the femur** during standing and increased femoral displacement
during locomotion."*
⇒ Give a creature a heavy counterbalancing tail and you have **earned** a near-vertical femur and a
tall upright archosaur stance. Give it a short bird-like tail and the femur MUST go sub-horizontal
and the knee MUST take over — **or the pose reads as a lie.** A ridden creature with a heavy tail
sits at the **theropod** end of §2.4's table.

`[D]` In flight, with the COM that far forward (§3.1), the tail is **not** load-bearing — it is a
trim/yaw surface and a ground-stance counterweight. Its flight job is silhouette and secondary
motion; its ground job is balance.

### §3.3 Cruise limb pose — the tuck vs trail vs abduct decision matrix

> ⚠ **THE FINDING THAT CORRECTS THE COMMON ASSUMPTION `[S]`.** "Raptors tuck their feet" is
> **wrong**. *"Perching birds utilize a **flexed** posture with their folded legs tucked beneath
> the body, whereas shorebirds and raptors use an **extended** posture with straightened legs
> trailing behind the body… Groups such as **shorebirds, ducks and geese, raptors, owls, parrots,
> pigeons, cranes, and storks use the extended posture.** The data suggest that limb posture is
> **taxonomically distinct** and that variation within taxonomic groups may not occur."*
> Corroborating physiology: shorebirds carry **fatigue-resistant slow muscle fibres** in the leg;
> tucking species have a lower proportion `[S]`. The extended posture is an actively held,
> metabolically paid-for pose. **⇒ This is the strongest argument for giving a creature ONE
> signature cruise leg pose and never blending it away.**
>
> The tuck claim is right for a *different* reason: *"the most significant reason birds tuck their
> legs during flight is to **minimize drag**… when extended during landing, legs act as air
> brakes"* `[S]`. **The law is: tuck = cruise-efficient; extend = braking / landing / attack.**

| Pose family | Hip | Knee | Ankle | Silhouette effect from BEHIND AND ABOVE | Tag |
|---|---|---|---|---|---|
| **FLEXED (perching birds)** | flexed, femur tucked forward against the flank ~30–45° from horizontal | deeply flexed ~40–60° | flexed, foot against the belly | **NONE.** The whole limb disappears under the body. **Zero silhouette value — rules itself out for a chase camera** | pose `[S]`, angles `[D]` |
| **EXTENDED (raptors/owls/shorebirds/ducks/cranes/storks)** | extended, femur near-horizontal, aligned with the body axis | near-straight **150–175°** | near-straight, toes trailing | **WEAK–MODERATE.** The limb lies inside the tail's own outline; it reads as extra tail-root thickness plus two thin trailing lines — and it makes the aft of the creature read as *more* bird | pose `[S]`, angles `[D]` |
| **HERON/EGRET (extended past the tail)** | as above, legs project **beyond** the tail | straight | straight | **STRONG but LINEAR** — two long thin lines, not a shape. Pairs with a retracted S-neck: legs act as "a **counterweight to their long necks**" | `[S]` |
| **ABDUCTED (bats)** | femur **abducted laterally, rotated 180°**; knee points dorsally/outward | moderate flex; the ankle drives membrane tension | ankle moves **ventrally on downstroke, dorsally on upstroke** — it oscillates with the wingbeat | **STRONGEST.** The leg is a live spar in the outboard membrane, so hip and knee sit *outside* the body outline, framing a visible triangular gap between wing trailing edge, leg, and tail — **and it moves in time with the wing** | `[S]` |
| **PTEROSAUR** | ⚠ **DEBATED.** "Exactly where the main wing membrane attached on the hindlimb remains controversial as very few fossils unequivocally preserve the full outline of the wing." Early pterosaurs had expansive uropatagia; pterodactyloids **decoupled** the hindlimbs from the uropatagium, creating the potential for run-up takeoffs. Claims the membrane 'shackled' the hindlimbs have been **rejected** | — | — | Depends entirely on the reconstruction chosen: coupled → bat-like strong break; decoupled → bird-like weak break | `[S]`, conflict preserved |

**Recommended cruise leg dials for a rear-chase camera `[D]`** — the only pose that puts hard
geometry into the empty wedge between the wing's trailing edge and the tail:

| Joint | Value | What it buys |
|---|---|---|
| Hip | femur **abducted 35–55°** from the sagittal plane, retracted **20–35°** aft of vertical | two lateral hip/knee bumps that break the body's straight top line |
| Knee | flexed to **70–95°**, knee apex riding **high and outboard** — visible above the body's top line from the chase cam | a triangular negative-space window per side |
| Ankle | **100–130°**, foot drawn toward the tail base, toes furled | — |
| Ankle animation | **±5–10° oscillation, phase-lagged 90–120° behind the wingbeat** | a secondary motion channel for near-zero cost — a direct steal from sourced bat kinematics |
| Braking / landing / strike | switch to **fully extended, near-straight** | real, and reads instantly as "the creature is about to do something" |

### §3.4 Neck curve families

| Group | Cervical count | Resting carriage | Chord : arc | Tag |
|---|---|---|---|---|
| Pterodactyloid pterosaurs | "generally **eight or nine**"; *Zhejiangopterus* possibly 7 | "**slightly sinuous** when in rest position" | ~0.90–0.95 `[D]` | count `[S]`, carriage `[S]` |
| Azhdarchids | **9** elongate dorsoventrally compressed cervicals; neck "usually **longer than the torso**" | Stiff — cervicals reinforced by **helically arranged cross struts**. ⚠ *Hatzegopteryx* re-interpreted as a **short-necked robust arch predator** — the clade is not one shape | ~0.95–1.0 `[D]` | `[S]` |
| Birds (general) | **11–25**, most 13–25, **14–15 typical** | "Bird necks rest in the shape of an **S** curve which may be straightened to increase overall length and reach" | ~0.55–0.70 at rest; →0.95 extended `[D]` | count `[S]`, carriage `[S]` |
| Herons/egrets in flight | ~16–17 `[D]` | Neck **retracted** into a tight Z, kink at C6 | ~0.35–0.45 `[D]` | `[S]` for the retraction |
| Cranes/swans/storks in flight | 17–25 | Neck **extended forward**, balancing extended legs aft | ~0.9 `[D]` | `[S]` |
| Bats | **7** (mammalian invariant) | short, near-straight, head in line | ~0.95 `[D]` | `[D]` |
| Varanids | 8–9 `[D]` | long for a lizard, carried low and near-horizontal, raised to a shallow S when alert | ~0.85–0.95 `[D]` | `[D]` |
| Theropods | 10 `[D]` | S-curve, moderately strong; "a massive skull on a **short neck**" for *Allosaurus* | ~0.75–0.85 `[D]` | descriptor `[S]`, rest `[D]` |

**Total sweep angle was not published for any group.** `[D]` working values, flagged:
pterosaur resting neck **15–30°** total sweep; bird resting S **110–160°** of accumulated turn;
theropod resting S **50–80°**. `[no-assert]`

**The design law `[D]`. The number of visible JOINTS is the tell, not the length.** A neck that
bends at 14+ points reads bird/swan regardless of silhouette. A neck that bends at 8–9 points with
a shallow single sinusoid reads pterosaur. **8–10 cervical segments with one gentle S** is the
flyer-correct choice — and it is also the cheap one.

### §3.5 What §3 rules out

- **A tucked (flexed) cruise leg on a rear-chase creature** — 100% occluded by the body, zero
  silhouette value `[D]`.
- **A trailing (extended) cruise leg as the signature pose** — it is the *real* raptor/stork pose
  `[S]` and it is unavoidably bird-coded from behind.
- **Blending between leg poses moment to moment.** Limb posture is a **species-level identity
  trait** in the source data `[S]`, not a per-frame choice. One signature pose; switch only on a
  named event (brake / land / strike).
- **Deriving tail length from torso length by rule** `[S]` (§2.4).
- **A monotonically tapering tail from a maximum at the hip** `[S]` (§2.4, §3.2).
- **A heavy tail paired with a sub-horizontal bird femur, or a short tail paired with a vertical
  archosaur femur.** Tail mass and femur angle are **one dial** `[S]` — mismatching them reads as a
  lie.
- **A short femur (<0.6 × torso) on a creature that must both fly and stand** — the two COM
  conditions do not reconcile `[D]`.
- **A neck bending at 14+ points** on anything that should not read as a bird `[S]`.

### §3.6 Field Notes (NON-NORMATIVE)

- Herons and egrets fly with legs extended behind "acting as a **counterweight to their long
  necks**" — the two ends of a creature can be designed as one balance system, not two features.
- Osprey: "tucks its wings and drops toward the water… plunging feet-first with legs and talons
  fully extended." The *transition* between pose families is itself a readable dramatic beat.

---

## §4 Wing construction

### §4.1 Spar topology — the three architectures

| Element | **Bat** | **Pterosaur** | **Bird** |
|---|---|---|---|
| Primary spanwise spar | **Four elongated digits (II–V)** fan from the wrist; no single dominant spar `[S]` | **One hyper-elongated digit IV** (mcIV + 4 wing phalanges) carries the whole outer wing `[S]` | Humerus + ulna/radius + carpometacarpus; **feathers**, not membrane, form the outer wing `[S]` |
| Wing-digit share of wing length | unknown (digit III longest; ratio to forearm not sourced) | **mcIV + phalanges = >2/3 of total wing length** `[S, approximate]` | Hand skeleton is the *shortest* of the three segments `[D]` |
| Bone gradient | Proximal bones have larger section, higher mineral density and higher elastic modulus than distal — a clear proximodistal gradient `[S]` | Hollow, thin-walled `[S]` | Hollow, pneumatised; ulna heavier than radius `[S]` |
| Leading-edge stiffening | **Norberg mechanism** (mechanical locking of the membrane forward of digit III) + **occipitopollicalis** (head → 2nd metacarpal) tensioning the propatagium `[S]` | **Pteroid bone** projecting from the wrist, tensioning the propatagium `[S]` | Alula + propatagial ligament `[D]` |
| Membrane reinforcement | Elastin/collagen arrays + **plagiopatagiales proprii** — muscles *embedded in the membrane* actively modulating tension and camber `[S]` | **Actinofibrils**, **0.05–0.2 mm** diameter, densely packed, up to **3 layers at different fibre orientations** (a reticular tear-resisting weave) `[S]` | n/a — feather shafts do this |
| Fold behaviour | Folds "like an umbrella"; digit III folds over the others; the wing wraps the body at roost `[S]` | The wing finger folds back against the forearm **as one rigid unit** `[D]` | Wrist flexion + supination; hand tucks under the forearm `[S]` |
| Damage redundancy | **High** — 4 spars; losing one bay does not collapse the wing `[D]` | **Low** — single point of failure, compensated by the 3-layer fibre net `[S]` | High — feathers individually replaceable |
| **Feature count in silhouette** | **4 spars → 3 interior bays + 3 knuckles** | **1 spar → 1 bay, 0 interior knuckles** | n/a (feather logic) |

**THE VERDICT — ⚠ SUPERSEDED 2026-07-27. The original verdict ("build the fan; a single spar
degenerates into the paper-dart read") attributed the paper-dart failure to SPAR COUNT. That is a
misdiagnosis, and it cost the Fornax wing a full rebuild.** The paper dart is caused by three
properties, none of which is spar count:

1. a **straight or taut trailing edge** (a spread membrane's trailing line is never straight —
   §4.9), 2. a **planar, zero-camber membrane**, and 3. **no joint break in the leading edge**.

A fan with those three defects is still a dart — it is a dart with extra spokes. A single spar
that kills all three (kinked leading edge, concave trailing edge, cambered sail) does not read as
a dart in any published reference or any named film wyvern. **The failure that actually produces
the dart is the MISSING ARM** (§4.9): a membrane fanning from a hub with no humerus and no forearm
is a flat radial sheet *by construction*, whatever is drawn on it.

⚠ **AND THE CORRECTION TO THE CORRECTION (same day, after the owner rejected the spar build).**
The paragraph above is right about anatomy and **wrong about this repo**. `DRAGON-DESIGN.md` §2
lists **"the plane / delta-kite wing" as failure #1, KILL ON SIGHT**, and defines it to include
*"convex scallop lobes whose valleys never cut inward"* — which a single spar with a
chord-function trailing edge is, by definition. **`DRAGON-DESIGN.md` §4's fingered kit outranks
this file** for any wing built in this repo: radiating finger-bones off the carpal knuckle,
membrane cupping INWARD between fingertips, dominant + decay. Read §4.9 for the arm, the gull,
the attachment line and the propatagium; read `DRAGON-DESIGN.md` §4 for the HAND.

**The corrected law:** in general anatomy spar count is a creature-level identity choice (fan =
dexterous, hand-like; spar = heavy, structural, siege-like) — **but in THIS repo the fingered kit
is mandatory**, because the shipped roster and its failure registry are built on it. What IS a correctness gate is §4.9 —
the arm chain, the leading-edge kink, and the concave trailing edge — and it binds **both**
topologies equally. Silhouette legibility still favours the fan *at turntable scale*; at gameplay
distance (a ~180 px creature, rear-chase, span foreshortened) the difference between three scallop
cusps and one long concave edge is **sub-2 px and does not read** — so it cannot carry a roster
split. What carries the split at that distance: **wrist station** (0.24 vs 0.47 of wing length is a
large, visible shift in where the leading edge breaks), **fold behaviour in motion** (one dramatic
hinge vs a multi-joint curl), and **leading-edge structural mass**, which is on the wing TOP where
a behind-and-above camera looks.

**Historical note (kept deliberately):** the fan verdict below was written before the planform
research, when §4 settled topology and area shares but never wing *geometry*. Do not re-derive the
superseded reasoning from it.

**What the spar gives that the fan does not `[S]`:** enormous span from one element (>2/3 of wing
length), and a deep uninterrupted sail. **Better for a stationary heraldic pose than for motion.**
If a boss needs a 30 m static silhouette, borrow the spar; for a rideable that beats in the
player's face, take the fan.

**The sanctioned hybrid `[D]`:** bat fan for digits II–V, weighted pterosaur-ward — **one dominant
leading digit ~1.5–1.8× the others**, the remaining three fanning behind it. Keeps the knuckled
leading edge and the scalloped bays; gains the "one long dramatic spar" hero line.
**Both real membrane lineages independently evolved a dedicated leading-edge tensioner `[S]` — so
a creature whose leading edge is just the membrane edge is wrong in BOTH lineages.**

### §4.2 Membrane regions and attachment lines

| Region | Bounded by | Share of wing | Function |
|---|---|---|---|
| **Propatagium** | shoulder → wrist, *anterior* to the forearm | **~9%** of lift/area `[S]` | leading edge; fine lift/AoA control `[S]` |
| **Plagiopatagium** (armwing) | forearm / body / hindleg / digit V | **~52%** `[D]` | contains the aerodynamic centre of pressure; does the **majority of lift** `[S]` |
| **Dactylopatagium** (handwing) | between digits II–V (the finger bays) | **~39%** `[D]` | the power/gross-motion portion `[S]` |
| **Uropatagium** | between the hindlimbs, often enclosing the tail | unknown as % | stability, directional control, thrust in slow flight; fanned through **up to 135° of arc** in takeoff `[S]` |

> ⚠ **REFUSAL PRESERVED.** Direct **area** percentages were **not published** in anything
> retrieved. The 52/39 figures are `[D]` from a computational study reporting *lift* contributions
> that it states are "directly consistent with the total areas of each segment." Use them as a
> distribution shape, not as measured areas.

**Build implication `[D]`: the inboard arm-wing bay is the largest single area (~half the wing).
If your bays are all equal-width, you have already drifted toward a plane wing.**

**Propatagium depth as a fraction of chord: `unknown`, and explicitly OPEN.** The literature says
*"the local width of the propatagium depends upon the assumed elbow angle and the orientation and
location of the pteroid"* `[S]` — a genuinely unsettled reconstruction parameter. **Do not
fabricate one.** Author the forward membrane as a visible triangular shoulder-to-wrist sheet and
tune by eye. `[no-assert]`

### §4.3 Finger count and length-decay ratios

| Figure | Value | Tag |
|---|---|---|
| Bat digit II–V lengths as ratios to forearm | **unknown as numbers.** The standard indices exist and are named — **LD3/FL** ("wing length") and **LD5/FL** ("wing width"); D5 is high in slow, manoeuvrable, low-wing-loading bats `[S]` — but values were not retrieved | `unknown` |
| Bat forearm : humerus | **unknown.** Qualitatively: "the bones of a bat's forelimb all elongate, with the degree of elongation **increasing as the bones move away from the body**" `[S]` ⇒ forearm > humerus | `unknown` |
| Bat hand-shape stability | Bat digit proportions **essentially unchanged for ~50 My** `[S]` — there is ONE canonical bat hand, so a stylised version is safe | `[S]` |
| **Pterosaur wing-phalanx taper** (measured *Rhamphorhynchus*) | mcIV **148 mm**; phalanges **138, 112, 79, 67 mm** `[S]` ⇒ ratios **1.00 : 0.81 : 0.57 : 0.49** `[D]`; wing finger total 396 mm, mcIV+finger 544 mm `[D]` | `[S]`/`[D]` |
| Pterosaur wing finger : humerus, : forearm | **unknown as numbers** | `unknown` |
| **House decay law** (repo, §4.4) | Vesper `lenFrac [1, .82, .66, .50, .36]`; Solar's carpal lance ~2.6× its rank pikes, decay `0.62^i` | repo `[S]` |

**The convergence worth noting `[D]`:** the only *measured* natural taper available
(**1.00 : 0.81 : 0.57 : 0.49**) sits inside the repo's shipped `lenFrac [1, .82, .66, .50, .36]`
band. **The house dominant-plus-decay law is anatomically confirmed, not merely stylistic.**
A crest/tooth/finger rank decaying at **~0.62–0.70 per element** (§6.3) is the same law.

### §4.4 Topology → repo wing-kit dial map (`DRAGON-DESIGN.md` §4)

| Repo dial / kit item | Anatomical source | Range from this file | Reference-anchored note |
|---|---|---|---|
| **Knuckled leading edge** (gull ARCH in Y, `wingArchY`; OGEE in Z, `vesperArmZ`) — never a straight bar | Bat MCP knuckles + both lineages' dedicated LE tensioner `[S]` | carpal apex at **t ≈ 0.35–0.45** (repo); knuckle count = finger count − 1 | A straight LE is unsupported in **both** membrane lineages (§4.1) |
| **Radiating finger-BONES**, dominant + decay | Bat digits II–V `[S]`; pterosaur phalanx taper `[S]` | **3–4 struts** (fan) or **1 dominant + 3** (hybrid, dominant **1.5–1.8×**); decay **0.62–0.82 per element** | 4 spars = 3 interior bays + 3 knuckles (§4.1). 3 struts is the cheap-but-legible floor |
| **`wristT`** (medial wrist: short arm, long-fingered hand) | The bat proportion `[S]` | **0.20–0.30** (repo); Tempest 0.24 ⇒ **hand ≈ 76% of the wing** | The mass split is what makes the fold read (`FLAP-DESIGN.md` §2). Span is pinned by the tip vertex, so pulling the wrist inboard GROWS the fan |
| **Membrane cup (concave bézier, `cup ≈ 0.35`, ≥4 segments)** | Membrane camber `[S]`; scalloped trailing edge is a named studied phenomenon `[S]` | camber **0.06–0.10 c** cruise, **0.14–0.20 c** hover/launch/climb; **deepest sag at ~40% chord** | ≥4 segments is the single highest-value fix in the repo's wing rework; 2 segments = sawtooth |
| **Bay widths** | Armwing ~52% / handwing ~39% / propatagium ~9% `[D from S]` | inboard bay ≈ **2× any outboard bay** | Equal-width bays = plane wing (§4.2) |
| **Propatagium / forward sheet** | Pteroid + occipitopollicalis `[S]` | depth **unknown** — art-direct by eye | A wing with **no** forward sheet is a paper dart (§4.6) |
| **Thumb claw at the knuckle** | Bat digit I free and clawed `[S]`; Drogon's wrist thumb claw takes ground weight `[S]` | 1 per wing | Gives the wrist a punctuation mark and a ground-contact story |
| **Connected knife-edge** (ONE strip along the whole scalloped trailing polyline) | Real trailing edges are free, **scalloped**, and flutter/diverge `[S]` | ripple the **trailing** edge only | **Rippling the LEADING edge is a fabrication tell** — real LEs are actively stiffened (§4.1) |
| **Root gusset + scapular cowl** (the real shoulder) | The whole aerodynamic load enters at the glenoid `[D]`, §3.1 | gusset sweeps aft to the hip | Overlap > weld; cowl stays STATIC in the body frame through the flap |
| **Value tiers across the membrane** (3–4, graduating) | `AAA-PIPELINE.md` §1 value-structure law | ≥3–4 tiers that READ; check endpoints | Taut root = lit tier, deep cup = shadow tier (AAA §2 #12) |
| **Aspect ratio** (span²/area) | §4.5 | **7–9** | Below 6 reads flappy; above 12 reads sailplane |

### §4.5 Camber, aspect ratio, and the planform bands

| Property | Value | Tag |
|---|---|---|
| Camber under load, hovering | **0.14 c** | `[S]` |
| Camber under load, 7 m/s | **0.04 c** — camber *decreases* monotonically with speed (**3.5× change hover → 7 m/s**) | `[S]` |
| Optimal aeroelastic camber (engineering) | **0.15–0.20 c** | `[S]` |
| Camber at high load / low relative stiffness | up to **0.26 c**, and up to **~0.30 c** | `[S]` |
| Chordwise position of deepest sag | **~40% of chord from the leading edge** | `[S]` |
| Camber control mechanisms in bats (four, independent) | **leg deflection relative to body**, **bending of digit V**, **leading-edge flap deflection**, **upward bending of the wing tip** | `[S]` |
| Trailing-edge behaviour | **scalloped**; with LE fixed and TE free the membrane shows **divergence and/or flutter**, periodic and aperiodic | `[S]` |
| Flutter onset | dimensionless stiffness **~0.05** — below it efficiency drops and vortex shedding rises | `[S]` |
| Airspeed at which the TE flutters | **unknown as an absolute speed** — governed by the aeroelastic number; bats regulate it by changing wing flexibility OR flight speed | `[S]` |
| Fibre reinforcement effect | Anisotropic membranes are what let bats flap fast without losing shape; peak efficiency for bat-like motion requires flapping **66% faster** than for symmetric motion | `[S]` |

**Aspect-ratio → the read:**

| AR | Reads as | Tag |
|---|---|---|
| **4.5–6** | Elliptical/agile — forest bird, manoeuvrer, **flapper** | `[S]` |
| **6–8.5** | Broad-winged thermal soarer (vultures, condors, flying foxes: "soaring species 6.27–8.46"; *Pteropus* 6.5–6.6) | `[S]` |
| **~7** | "Even broader-winged species often have moderately high AR ~7" | `[S]` |
| **12–16** | Oceanic dynamic soarer — albatross (~15), sailplane, **plane** | `[S]` |
| **>16** | Reads as a machine | `[D]` |

**The threshold to build against `[S]+[D]`: the flapper/soarer boundary sits at AR ≈ 8–9.** Below
it the audience expects beats; above it they expect a hold. **AR 7–9 legitimises BOTH** — which is
exactly what a rideable needs.

**Measured planform anchors:** *Pteropus samoensis* AR **6.59 ± 0.12**, WL **33.08 ± 3.67 N/m²**
`[S]`; *P. livingstonii* AR **6.52**, WL **25.8 N/m²** `[S]`; Megachiroptera scaling laws
**AR = 8.63 M^0.11**, **Mg/S = 45.4 M^0.33 N/m²**, **b = 1.23 M^0.35 m** (M in kg) `[S]`;
hang glider (flexwing) AR **5.5–5.7** typical, practical ceiling **~7.0**, WL **22–76 N/m²** `[S]`.
⚠ AR and wing loading as *published numbers* are **unknown** for wandering albatross, Andean
condor, *Pteranodon*, and *Quetzalcoatlus* — the values in §2.3 are derivations.

**Wing-loading sanity band `[D]`:** flying foxes 26–33 N/m² and a hang glider 22–76 N/m² bracket
the same order. A stylised creature implying **~30–80 N/m²** is plausible; **below ~20 reads as a
kite, above ~150 as a jet.**

### §4.6 Folded pose (the weakest-sourced item in §4)

**Numeric joint angles for the folded pose were not published in anything retrieved.** What IS
sourced: bats fold the wing **"down like an umbrella"** because the wrist is extremely flexible;
**some fingers, especially the third, fold over**; the wing may be tightly folded or partly enfold
the animal's undersurface; folding is implemented primarily by **wrist flexion/extension**, with
**elbow flexion** retracting the wing along the span and **supination of the handwing** rotating
it `[S]`.

`[D]` **starting pose to be art-directed, not fact — `[no-assert]`:**

| Joint | Value |
|---|---|
| Shoulder | humerus swept **30–45° behind the frontal plane**, elbow tucked near the ribs |
| Elbow | strongly flexed, **~30–50° included** |
| Wrist | flexed and supinated, **~40–70° included** — the hand folds forward and down (the umbrella closing) |
| Digits | curl progressively; digit III folds over the others |
| **Wingtip endpoint** | **at or slightly behind the hip, low, near the knee/ankle line** — the membrane draws down around the flank |
| Folded span | **25–35% of extended span** for the whole limb chain |

⇒ **The folded membrane wing should drape past the hip like a cloak, not sit tidily over the
shoulders like a bird's.** More dramatic *and* more correct.

### §4.7 What §4 rules out

**Reads as a KITE**
- **Flat membrane, zero camber.** Real membranes carry **4–14% chord camber in flight, up to
  26–30% under load** `[S]`. A flat sheet has no sourced analogue anywhere.
- **Deepest sag at the trailing edge or at mid-chord** — real deepest sag is at **~40% chord** `[S]`.
- **Membrane tensioned only at the perimeter with no internal reinforcement.** Even the pterosaur —
  the most spar-poor real design — packed the membrane with dense actinofibrils in up to three
  cross-oriented layers `[S]`.
- **Fixed membrane shape across all speeds.** Camber changes **3.5×** from hover to 7 m/s `[S]`.
- **AR below ~4 with a taut membrane** — a diamond kite planform.

**Reads as a PLANE**
- **Straight leading edge + straight trailing edge** (already `DRAGON-DESIGN.md` §2.1).
- **Equal-width membrane bays** — real area distribution is heavily inboard-weighted (§4.2).
- **AR above ~12** — albatross-to-sailplane territory `[S]`. Even hang gliders, machines built to
  imitate a wing, sit at 5.5–7 `[S]`.
- **A rigid, non-deforming wingtip** — upward tip bending is one of the four named real camber
  controls `[S]`.

**Reads as a PAPER DART**
- **A single straight spar with a triangular membrane and NO propatagium** — both lineages evolved
  a forward-membrane tensioner `[S]`. No forward sheet = dart.
- **Zero interior knuckles** — a single-spar outer wing degenerates at distance to two smooth curves.
- **A taut, perfectly straight trailing edge** — real TEs are **scalloped** and flutter `[S]`.

**Reads as a BIRD**
- **A feathered outer wing / discrete separated slotted primaries** on a membrane creature.
- **AR 4.5–6 with a high beat frequency** — the elliptical flapper profile `[S]`; reads small.
- **Folding the wing tidily above the back with the tip over the tail base** — that is the avian
  fold; the membrane fold drapes down and around the flank (§4.6).

### §4.8 Field Notes (NON-NORMATIVE)

- **The actinofibril fan is the canonical reference for a non-tape-like membrane surface**:
  radiating **posterodistal** striations, subparallel to the spar distally, densest at the tip and
  fading medially. Interpreted as damping unwanted flapping, cambering the patagium, and spreading
  it chordwise. Fibre **spacing is `unknown`** — only diameter (0.05–0.2 mm) is sourced, so this
  cannot become a numeric dial.
- **A strongly *anteriorly* projecting pteroid would impose extreme membrane strain**; the
  **medially oriented** reconstruction is more stable structurally and aerodynamically. If a
  creature carries a visible forward wrist spar, point it *medially*.
- Wind-tunnel work found pterosaurs **less efficient and slower** than previously assumed, adapted
  to **low-speed** flight; glide angle for large pterodactyloids **1–2°**, best-glide cruise
  ~4–16 m/s across the clade — modelled, not measured.

---

### §4.9 PLANFORM — the wing's actual SHAPE (added 2026-07-27)

⚠ **Why this section exists.** §4.1–§4.8 settled topology, area shares, digit decay and fold
behaviour — and never once said what a wing *looks* like. Every winged creature built from this
file inherited that hole. The Fornax wing shipped as a membrane fanning from a single hub with **no
upper arm and no forearm**, was rejected on sight, and the root cause was that neither this file nor
the creature's buildsheet contained an arm chain, a chord distribution, a body attachment line, or a
leading-edge sweep. This section is that missing geometry. **It is normative for every winged
creature in the repo and it binds both topologies.**

#### §4.9.1 THE ONE-LINE LAW

> A membrane wing is **~50% arm / ~50% hand** in a bat and **~25% arm / ~75% hand** in a pterosaur.
> **In neither case is the arm a stub.** A membrane radiating from one point is a pterosaur with the
> arm deleted, and it reads as a spoke, an umbrella, or a kite — never as a limb. `[D, forced by the sourced segment tables]`

#### §4.9.2 SEGMENT CHAIN — the arm is five bones, none of them tiny

Fractions of **L = shoulder joint → wingtip** straight-line distance.

| Segment | **Bat** | **Pterosaur** | Tag |
|---|---|---|---|
| humerus | 0.19 | 0.095 | `[D]` bat checked against a closing span reconstruction |
| radius / forearm | 0.28 | 0.144 | `[S]` bat (*Pteropus vampyrus*, 180–220 mm) |
| carpus (wrist block) | 0.01 | 0.019 | `[D]` |
| metacarpal | 0.19 (mcIII) | 0.129 (mcIV) | `[S]` bat; `[D]` pterosaur |
| phalanx 1 | 0.14 | 0.227 | `[S]` bat; `[D]` pterosaur |
| phalanx 2 | 0.19 | 0.178 | `[S]` bat; `[D]` pterosaur |
| phalanx 3 / 4 | — | 0.125 / 0.083 | `[D]` |
| **WRIST STATION** | **0.47–0.50** | **0.22–0.28** | `[S]` bat; `[S]` pterosaur across a 6× size range |

**Bat modelling ratio — memorise this one:** humerus : forearm : metacarpal : ph1 : ph2 =
**1.0 : 1.5 : 1.0 : 0.7 : 1.0** `[D from sourced mm]`. Five segments, none dominant, none vestigial.

**Thickness ladder** (diameter, humerus = 1.00): `1.00 → 0.75–0.85 → 0.45–0.55 → 0.35–0.45 →
0.25–0.30`, tapering to a point. The taper is **smooth and continuous**, including *within* each
bone (every element is thicker at its proximal end) `[S, direction]` `[D, ratios]`. The upper arm
visibly outmasses the forearm; the forearm very visibly outmasses the fingers.

#### §4.9.3 THE ELBOW — the single most important silhouette note in this file

**A bat's elbow is bent 15–40° off straight even at FULL cruise spread** `[D, self-consistent with
the sourced segment lengths]`. **A straight elbow is the umbrella-spoke failure mode.** The dog-leg
is what makes the eye read *limb* instead of *spoke*.

Pterosaurs are the opposite and the numbers are sourced: shoulder **5°**, wrist **5°**, elbow **10°**
of available flexion `[S]` — a deployed spar that snaps open and stays open, with almost all folding
at **one** joint, the knuckle at the base of the wing finger `[S]`. **So: animate a bat as a soft
multi-joint curl, a pterosaur as one dramatic fold point.** Do not mix the two.

**Camera note:** in-plane kinks (elbow, wrist) are the articulation that reads **best** from a
behind-and-above camera, because that camera sees the planform. It is *vertical* articulation
(dihedral, droop) that foreshortens away. The instinct to skip the elbow because "the span
foreshortens" is backwards.

#### §4.9.4 LEADING-EDGE SWEEP AND THE FORWARD WRIST OFFSET

**THE KEY NUMBER:** the wrist sits **FORWARD of the straight shoulder→tip chord by 0.085–0.125 × L**
`[D, bounded by sourced sweep anchors]`. Below ~0.06 the eye reads the leading edge as *straight* and
the wing dies as a flat delta.

Reusable formula — `offset/L = k(1−k)(tan Λ_outer − tan Λ_inner)`, where **k = the wrist station**.
Because k differs by topology, **the peak of the bow sits at the wrist**, not at mid-span:
bat k≈0.49 → peak at ~0.49 L; pterosaur k≈0.24 → peak at ~0.24 L. A verification band calibrated for
one topology is wrong for the other — state which you built to.

| Run | Sweep aft of the lateral axis | Tag |
|---|---|---|
| shoulder → elbow | **−6° to +5°** (may rake *forward*) | `[D]` |
| elbow → wrist | **+6° to +12°** | `[D]` |
| wrist → tip | **+28° to +32°** | `[D]` |
| outermost 0.12 L | **+15–25° extra** (the tip hook) | `[S, direction]` |

**Sourced bounds:** swift handwing Λ = **50°** is the upper limit before a wing reads as a jet `[S]`.
**Sign matters:** sweep must **increase** outboard. Sweep *decreasing* outboard is the aeronautical
crescent wing — real, but it reads as a manta or an aircraft, not a limbed animal.

**Included angle at the wrist in plan: 155–168°. Reject > 170°** (reads straight). Put the whole
break at **one** vertex — a carpus segment that splits it into two half-steps softens the chevron
into an arc, and an arc reads *feather* where an angle reads *structure under load*. Pile visible
mass on the break (knuckle boss, armour, thickening); that is what makes a forward wrist read
**heavy** rather than graceful.

**Leading-edge radius must taper** — `1.00 / 0.62 / 0.38 / 0.22 / 0.10` at shoulder / elbow / wrist /
mid-hand / tip `[D]`. A constant-radius spar **reads as a bar however elegantly it is curved.**

#### §4.9.4b THE VERTICAL PROFILE — the gull curve (the half of the wing a planform cannot hold)

⚠ **This subsection was added after §4.9 shipped without it and a wing built to the rest of §4.9
still failed.** A planform is an x/z table. Authored with no Y column, the Fornax wing rendered from
the rear as a **razor line — 31% wide, 9% tall** — because a flat horizontal membrane is *edge-on*
to a behind-and-above camera. The planform is the view the player never gets on its own; the gull
curve is what turns it into a shape. **A wing spec without a Y column is half a spec.**

Glide-pose rise **above the shoulder**, as a fraction of L:

| Station | rise | Tag |
|---|---|---|
| shoulder | 0 | — |
| elbow | **+0.035 L** | `[D]` |
| **wrist** ⟵ apex | **+0.085 L** | `[D]` |
| tip | **+0.065 L** | `[D]` |

- The result is a **shallow M / gull**, *not* a straight V — the tip sits **below** the wrist.
- **Inboard dihedral 8–15°** (sourced gull analysis caps dihedral at **20°** `[S]`);
  **outboard 0 to −5°**. Gulls combine positive dihedral *with* slight forward shoulder sweep —
  it is a package, not two independent dials.
- **The M is GLIDE-ONLY.** The downstroke is a **monotonic C** to about **−0.42 L** at the tip,
  with no M at all `[D]`. A wing that keeps its gull through the downstroke reads as a fixed airframe.
- **Span ratio 0.70** (mid-upstroke span ÷ mid-downstroke span) `[S]` — see §4.9.11.

**Camber rides ON TOP of this curve, it does not replace it.** Camber is a chordwise bulge of
6.5–9% `[S]` (repo cruise band 0.06–0.10 c); the gull is a spanwise rise of 8.5% of L. They are
different axes and a build needs both — camber alone leaves the rear silhouette flat.

#### §4.9.5 CHORD DISTRIBUTION — chord ÷ full span `b`, by station

η = fraction of **semi**-span from the body midline. Scale every chord by `(7.0 / AR_target)` for the
bat column and `(9.0 / AR_target)` for the pterosaur column.

| Station | Bat η | Bat c/b | Pterosaur η | Pterosaur c/b |
|---|---|---|---|---|
| flank / wing root | 0.04–0.05 | **0.19–0.22** | 0.055 | **0.19–0.21** |
| **elbow** ⟵ *widest* | 0.20–0.24 | **0.20–0.22** | 0.14 | 0.17–0.19 |
| wrist | 0.46–0.50 | 0.15–0.18 | **0.28** | 0.14–0.17 |
| knuckle | ~0.52 | — | 0.45 | 0.11–0.13 |
| mid-hand / wp1 end | 0.70–0.75 | 0.09–0.11 | 0.66 | 0.07–0.09 |
| near tip | 0.88–0.92 | 0.04–0.05 | 0.85 | 0.035–0.045 |
| tip | 1.00 | → 0 | 1.00 | → 0 |
| *(check)* mean | — | 0.140 ⇒ **AR 7.1** ✔ | — | 0.111 ⇒ **AR 9.0** ✔ |

`[D, from sourced bone lengths and a sourced AR ≈ 7.0 planform; both columns close to within 2%]`

**Maximum chord sits AT OR JUST INBOARD OF THE ELBOW**, and falls **monotonically** to the tip.
**Root chord ≈ elbow chord — never a pinch at the root.** A root narrower than the elbow is the
"spoon wing / armpit hole" failure.

⚠ **These chords are streamwise and are calibrated for a lightly swept leading edge. Applied
naively to a hard-swept planform they will push the trailing edge CONVEX near the tip** (the hook
drags the leading edge aft faster than the chord shrinks). Author the trailing edge as a concave
curve first (§4.9.6), let chord fall out, and use this table as the **check**, not the input.

#### §4.9.6 THE TRAILING EDGE — concave everywhere, no exceptions

> **"The trailing edge is concave, causing spreading of the digits to result in an antero-posterior
> tensioning of the membrane."** `[S]`

**This concavity is the entire reason a wing looks taut instead of like a hanging sheet.** It runs
as one long cupped sweep from the body anchor to the tip, bowing **inward toward the bones**.

- **There is no convex trailing edge anywhere on a membrane wing** `[S]`. A convex (aft-bulging)
  trailing edge is a **bird** signature — a fan of overlapping secondaries. Drawing one on a
  membrane wing is a lineage error, not a style choice.
- **Depth:** bow forward by **15–25% of local chord** at mid-span `[S, for inter-fingertip scallops]`;
  never less than ~12%.
- **A straight trailing edge is not an identity, it is a cheap tell.** Tensioned skin physically
  cannot be straight between two anchors, and the eye knows this even when the viewer cannot say why.
  "Taut" as a design direction must be expressed as *shallow concavity*, never as *straight*.
- **Scallops between digits** (fan topology only): shallow **arcs**, not notches — depth ~5–15% of
  bay width at cruise spread `[D; the measured ratio is unknown]`. Deep symmetric semicircular
  notches between every finger are a **logo, not an animal**, and they fight the very tension that
  makes a spread wing read taut. **A single-spar wing has ZERO bays** — scallops on one mean you have
  drawn a bat.

#### §4.9.7 THE BODY ANCHOR IS A LINE, NOT A POINT

The membrane is an outgrowth of the **flank**; it joins the body **along the sides** and runs to the
side of the body and leg **as far as the ankle or foot** `[S]`. **No bat stops at the hip or knee**
`[S]`. In pterosaurs, every completely preserved membrane shows **ankle** attachment `[S]`.

- **Anchor length ≈ 80–95% of head-body length ≈ 1.6–1.9 × trunk length** `[D]`.
  **If your root seam is shorter than the torso, it is wrong.**
- **Sanctioned repo choice:** shoulder→**hip** (safe; keeps abducted legs free) or shoulder→**ankle**
  (maximum "one animal" read, but couples leg pose to wing shape) `[D]`. Anchoring at the armpit is
  the **"glued at one point" / bat-sticker** failure — and it is *more* visible from a
  behind-and-above camera than in profile, because the viewer looks straight down into the junction.
- The bonded seam may stop at the hip while the trailing edge continues **aft** of it as a free
  corner — that is how the root chord exceeds the seam length without pinning the membrane to the leg.
- **The junction needs a fairing**: bats hide it under neck fur; pterosaurs evolved a **muscular
  wing-root fairing** `[S]`. In-engine: carry the body's surfacing grammar across the join, fading
  out over the shoulder, with no hard silhouette seam. **If the wing can be deleted and leave a clean
  torso, it is a sticker.**

#### §4.9.8 THE PROPATAGIUM — half the leading edge has no bone in it

| Span segment | What the leading edge IS | Bat | Pterosaur |
|---|---|---|---|
| shoulder → wrist | **free membrane** bowed forward *ahead of* the bones | **~48%** | ~25% |
| wrist → tip | **bone** | ~52% | ~75% |

`[S, structure]` `[D, fractions]`

**The arm must sit INSIDE a membrane curve, not BE the edge.** A wing whose humerus and forearm
*are* the leading edge looks like scaffolding. A propatagial sheet filling the shoulder–elbow–wrist
triangle and bowing ahead of it looks like an animal — and it **hides the elbow kink** under skin,
which is exactly what real wings do `[S]`. Its forward bulge is modest: **8–10.5% of hand-wing
chord** (max 18%) `[S]` — a subtle scallop of skin, **not a big triangular sail**.

Both real membrane lineages independently evolved a dedicated leading-edge tensioner `[S]`, so this
is the cheapest single fix available to any wing that reads as scaffolding.

#### §4.9.9 CONSTRUCTION ORDER — the method, and the way we ran it backwards

Every instructional source agrees on one spine `[S, multiple independent]`:

1. **Gesture line** for the leading edge — a zig-zag or shallow M, **never a straight line**.
2. **The arm chain on it** — humerus, then forearm, two clearly different segments with a visible bend.
3. **Joint volumes** — ovals at shoulder, elbow, wrist. *The step beginners skip; the step that makes
   the wing a solid rather than an outline.*
4. **The hand** — digit(s) from the wrist, **knuckles marked as joints**, never straight sticks.
5. **Membrane LAST**, panel by panel, strung **knuckle to knuckle** — not one silhouette outline.
6. **Occlusion + tension pass.**

> **THE LOAD-BEARING INVERSION: the membrane is an OUTPUT of the arm-and-hand skeleton, never an
> input. Any pipeline that authors a membrane silhouette and then decorates it with bones is running
> the method backwards.** `[D, from unanimous sourced ordering]`

A spec written as *"a set of ratios that produce a membrane silhouette"* is precisely the
anti-pattern every instructor warns against. **Write the skeleton; let the membrane fall out.**

#### §4.9.10 THE BEHIND-AND-ABOVE VIEW (the repo's shipped camera)

Mostly `[D]`, and decisive:

1. **Side profile is exactly the view the player never gets.** A wing designed by drawing a side
   elevation is designed for the wrong camera. **Chord depth and the dorsal surface carry the read;
   span foreshortens away.**
2. **The dorsal surface must carry structure** — finger ridges tenting the skin, the arm ridge along
   the leading edge, the propatagium sweep from neck to wrist. **A wing that is a smooth quad from the
   top has no information at all in this camera.**
3. **Membrane camber must be visible as a curved surface from above.** A top-viewed flat plane shades
   uniformly and dies; curvature is what produces a light-to-dark gradient across the wing.
4. **Depth ordering, not outline, sells attachment** — near wing over the body, far wing occluded.
5. **Dihedral and sweep read strongly from behind; span barely at all.**
6. Interacts with the known **depth-projection trap** (`FLAP-DESIGN.md`): a correct wrist fold goes
   invisible near the top of the upstroke from this camera; the fix is in-plane apex-sweep.

#### §4.9.11 MEMBRANE BEHAVIOUR

- **Spandex, not cloth** `[S]`: taut when the digits splay, and it **retracts into itself** when
  relaxed. **The edges do not fold up like fabric — there is no pleated folding.** `[S]`
- **Splay = taut; fold = slack.** That is the whole vocabulary `[S]`.
- **Wrinkles are rare, subdued, interior, and belong to the flank panel only** — never along the edge.
- **Camber is dynamic, not a fixed shape** `[S]`: slow/climbing = deeper sag and more area; fast
  cruise = flatter, tauter, smaller. Muscle-induced camber gives **+36% lift** over a rigid airfoil `[S]`.
- **Span ratio 0.70** — mid-upstroke span ÷ mid-downstroke span `[S]`. **Constant span reads as a
  rigid airframe.**

#### §4.9.12 §4.9 VERIFICATION GATE (headless, cheap — run it on every winged build)

| # | Assertion | Pass band |
|---|---|---|
| P1 | Wrist station along L | bat **0.47–0.50** · pterosaur **0.22–0.28** |
| P2 | Max forward deviation of the leading edge from the shoulder→tip chord, ÷ L | **0.085–0.125** |
| P3 | Spanwise station of that maximum | **within ±0.06 of the wrist station** |
| P4 | Included angle at the wrist, in plan | **155–168°** |
| P5 | Trailing-edge deviation from the root-TE→tip line, at every interior station | **forward (concave) everywhere**; ≥12% of local chord |
| P6 | Chord distribution | **monotonically decreasing** from the elbow to the tip |
| P7 | Max chord station | **at or just inboard of the elbow**; root chord ≥ 0.9 × elbow chord |
| P8 | Aspect ratio `b²/S`, body panel included | **7–9** |
| P9 | Root seam length ÷ trunk length | **≥ 1.0** |
| P10 | Arm segments present before the first membrane vertex | **≥ 2** (humerus + forearm) |
| P11 | **Rear-view vertical extent** of the wing ÷ L (the gull, §4.9.4b) | **≥ 0.06** — a flat wing is edge-on to the shipped camera |

**P2 alone would have caught the Fornax failure on turn one.** It is the single highest-value
assertion in this file, and no wing should ship without it.

#### §4.9.13 What §4.9 rules out

1. Fanning a membrane from a single hub adjacent to the body — **the umbrella / kite / spoke**.
2. Authoring the membrane **outline first** and hanging bones on it afterwards.
3. A **straight** leading edge, or a forward bow under 0.06 L (too small to be a statement).
4. A **smooth sine arc** where the break belongs — arcs read feather, angles read structure.
5. A **straight or convex** trailing edge, at any spread state, under any "taut" identity.
6. Deep symmetric semicircular notches between every finger (a logo, not an animal).
7. Scallops on a **single-spar** wing (that is a bat wearing a pterosaur's skeleton).
8. **Omitting the propatagium** — cited as the single most common dragon-wing mistake `[S]`.
9. A **stub** upper arm, or any wing where the arm is not at least ~25% of L.
10. A **straight elbow** at cruise spread.
11. A root chord **pinched** narrower than the elbow chord (the spoon wing).
12. A root seam **shorter than the torso**, or anchored at the armpit as a point.
13. A **constant-radius** leading-edge spar (reads as a bar however curved).
14. **Constant span** through the flap cycle.
15. Reviewing or gating a wing **in side elevation** when the shipped camera is behind-and-above.
15b. Authoring a wing as an **x/z planform with no Y column** — flat wings vanish from the rear (§4.9.4b).
16. Adding **spikier fingers** in place of more membrane.
17. Treating **spar count** as a correctness gate rather than an identity choice (§4.1, superseded).

---

## §5 Flap mechanics and cadence

### §5.1 Frequency scaling — pick wing loading, get frequency free

| Relationship | Value | Tag |
|---|---|---|
| **Universal beat-frequency law** | **f ∝ √(m/S)** — i.e. ∝ **√(wing loading)** — with an approximately **species-independent constant** across birds, bats, insects and robotic flyers | `[S]` |
| Birds, geometric similarity | cruising wingbeat frequency ∝ **M^(−1/6)** | `[S]` |
| Bats | ∝ **M^(−0.26)** — bats drop faster with mass than birds | `[S]` |
| Bats, predictive equation | **f = 5.54 − 3.068·log₁₀m − 2.857·log₁₀V** (f Hz, m kg, V m/s); holds across both suborders and all 6 families studied | `[S]` |
| Bat max beat frequency by species | **4–13 Hz** (2–870 g) | `[S]` |
| Measured megabat cruise | *P. livingstonii* **2.2 Hz**; *P. seychellensis* **3.2 Hz** | `[S]` |
| Streaked shearwater | **7.5 Hz takeoff → 4.2 Hz cruise** (sporadic) | `[S]` |
| ⚠ Pennycuick 1996 exponent set | commonly quoted as **f ∝ m^(3/8)·g^(1/2)·b^(−23/24)·S^(−1/3)·ρ^(−3/8)** — **the exponents were NOT visible in retrieved text.** Unverified this pass; do not cite as sourced | `[D]` |
| Wingbeat frequency in Hz for albatross and condor | **unknown** | — |

> **THE ONE EQUATION TO CODE AGAINST `[S]`: f ∝ √(wing loading).** Pick the creature's wing
> loading from §4.5's plausible band (**30–80 N/m²**) and the beat frequency follows **without
> needing a mass model.**

**Strouhal cross-check `[S]`.** Efficient animal locomotion sits at **0.25 < St < 0.35**. Bats fly
**50–150% above** that band — they beat *faster than "optimal"* because the membrane needs speed to
tension. *Glossophaga* at 4–6 m/s: **St 0.17–0.22**; below 3 m/s: **St 0.5–0.68** with unfavourable
force production. **Game use:** St = f·A/V (A = peak-to-peak tip amplitude, V = forward speed).
Solve for f at cruise speed and amplitude targeting **St ≈ 0.3–0.5** — that lands "big animal,
slightly bat-like, not a hummingbird."

### §5.2 Flap : glide duty cycle by mass class

| Animal | % of flight time flapping | Inter-burst interval | Tag |
|---|---|---|---|
| **Andean condor** | **1%** — and **>75% of all flapping is take-off** | **up to 5 h / 172 km with zero flaps**; in weak winter thermals **~2 s of flapping per km** | `[S]` — 216 h, 8 birds, wingbeat-resolved. **The strongest number in this section** |
| Wandering albatross | **1.2–14.5%** | — | `[S]` |
| White stork | **~17%** — explicitly "more than other large soarers" | thermal bouts ≥**30 s**; "losing a thermal" defined as **10–60 s** between bouts | `[S]` |
| Northern Bald Ibis (migration) | intermittent flap-glide | **glide phases recur every 5.9–10.5 s on average, at IRREGULAR intervals**, longer and more frequent while circling | `[S]` — the cleanest published inter-burst cadence for a large flap-glider |
| Common swift | **36%** flapping / 64% gliding → up to **15%** energy saving | — | `[S]` |
| European starling | ~80% flapping / **~20%** gliding measured (25/75 predicted optimum); **11%** transport-cost saving either way | glide phase **~0.5 s** | `[S]` |
| Griffon vulture | not quantified; HR **>300 bpm** during take-off flapping vs **80–100 bpm** baseline, returning to baseline within **10 min** of soaring | — | `[S]` |
| Brown pelican | "glide easily and flap infrequently"; wave-slope soaring carries them hundreds of metres with limited flapping | unknown | `[S]` |
| Hang glider (the failure mode) | **0%** | ∞ | — |

**Mass-class law `[D from the above]`: heavy = rare beats.** The rhythm unit for a big soarer is
**tens of seconds**, not seconds. Condor arithmetic cross-check `[D]`: ~2 s of flapping per km at
~15 m/s ≈ 2 s per ~67 s of flight ≈ **3%**, consistent with the 1% headline.

### §5.3 The glide-hold envelope — a PERCEPTION question, stated as such

> ⚠ **REFUSAL PRESERVED. No published number exists for "the longest glide-hold that still reads
> ALIVE."** It is a perception question, not a biology one. Everything in this sub-table is `[D]`,
> reasoned from the sourced cadences above. `[no-assert]` as biology; assertable only as a dial.

Nature's answer is **brutally long** — 5.9–10.5 s for an ibis, *hours* for a condor. Copied
literally, the creature reads as a stalled prop. **The reason a real soaring bird still reads as
alive across a 10 s hold is that NOTHING about it is static**: wing tips flex under gust load, the
head counter-rotates and stays level, the tail fans and twists to trim, the body rolls into and out
of the thermal, the trailing edge ripples. **Stillness kills the read, not the absence of a beat.**

| Dial | Value | Tag |
|---|---|---|
| **Cruise cadence** | **2–4 beats, then a 3.0–4.5 s hold** — under the ibis range, because a game camera tolerates less dead time than a field observer | `[D]` |
| **Absolute hold ceiling** | **~6 s**, and only if secondary motion is running. Past ~6 s without a beat the silhouette must be *visibly working the air* (bank, tip flex, tail trim) or it dies | `[D]` |
| **Hold floor** | **never below ~1.5 s** at cruise, or the creature reads as a pigeon/bat — small, light, panicky | `[D]` |
| **Jitter** | **±25% on the hold**, burst length varied 2/3/4 beats. Real intervals are explicitly described as "**irregular**" `[S]` | `[S]` justification, `[D]` value |
| **Event loading** | Burst hard on launch, climb, turn entry, dive recovery; go near-silent on straight cruise. **>75% of all condor flapping is at take-off** `[S]` | `[S]` justification |

### §5.4 Stroke amplitude, stroke ratio, and fold timing

| Figure | Value | Tag |
|---|---|---|
| **Bat stroke amplitude** | **90–150°** | `[S]` |
| Pigeon shoulder excursion (for stroke geometry) | sweeps **65.25° → −17.33°** on the downstroke ≈ **82° total**; forward-sweep amplitude ~**50°** | `[S]` |
| **Down : up duration ratio (τ = Td/T)** | ⚠ **unknown as a number** for both bats and large birds. The variable is standard and is reported as **speed-invariant in bats** `[S]`. `[D]` for large flapping birds the downstroke typically occupies **~50–60%**; **if the rig needs one, use 0.55 and label it a choice, not a fact** | `[S]` invariance / `[D]` value |
| **Peak fold phase** | ⚠ **unknown as a number.** `[D]` from the mechanics: the span-ratio metric is explicitly defined at *mid-upstroke* ÷ *mid-downstroke* `[S]`, which places peak wrist flexion at roughly **60–70% of cycle** if the downstroke occupies the first ~half. **Use mid-upstroke.** | `[D]` |
| Wrist behaviour | The handwing **supinates** at the wrist during the stroke; the wing **retracts along the span by elbow flexion**; wrist flexion rotates the handwing about a chordwise axis. **Magnitude in degrees: unknown** | `[S]` qualitative |
| Fold vs speed | **More fold at LOW speed** (span ratio lower); at high speed the fold is deep enough that **handwings can clap** above the body | `[S]` |
| Fold stations | **3 major** (shoulder, elbow, wrist) plus per-finger curl — bat articulation is shoulder (3 DoF) → elbow (1) → wrist/carpometacarpal (3) → each MCP and IP (1 each) | `[S]` |

**⇒ The 3-station bat articulation IS the repo's 3-segment rig `pivot → mid → tip`
(`FLAP-DESIGN.md` §2).** That is anatomical confirmation of an existing house choice, not a
coincidence.

### §5.5 Ranges → repo flap dials (`FLAP-DESIGN.md` §3)

| Repo dial | Anatomical quantity | Range from this file | Conversion note |
|---|---|---|---|
| **`glidePow`** | flap : glide duty cycle (§5.2) | **≥1.9** = condor/albatross class (1–15% flapping) · **~1.1–1.15** = stork/swift class (17–36%) · **~0.9** = starling/whelp class (~80%) | High glidePow with **no apex lift is THE PLANK** (`FLAP-DESIGN.md` LAW 3). A heavy creature earns a high glidePow; a light one must not have it |
| **`rootAmp`** | stroke amplitude, shoulder (§5.4) | bats **90–150°** total excursion; pigeon shoulder **~82°**. Repo shipped: 0.62–0.80 rad | Sets downstroke depth. Push the arc from the SHOULDER |
| **`apexRoot`** | recovery height toward 12 o'clock | repo 0.17–0.30 | Tune arc-top with this, **not** `rootAmp` (which also deepens the downstroke) |
| **`midAmp` / `tipAmp`** | elbow/wrist fold magnitude | Visibility FLOOR: a ~2° fold over a 100 px hand is ~4 px — a plank on screen. Taste CEILING: 10× a glide-wing's distal amp reads as rubber hose. Repo window: `tipAmp` **0.09** (glide) → **0.80** (articulated) | Always render the MID-stroke pose, not only the extremes |
| **`midLag` / `tipLag`** | fold timing (§5.4) | Peak fold at **mid-upstroke ≈ 60–70% of cycle** `[D]`. Repo: `tipLag` 1.0 → **2.1 rad ≈ 33% of cycle** | Deep enough that the hand **sign flips** relative to the forearm between top and bottom |
| **`tipApexSweep`** | in-plane hand sweep at recovery | repo 0.26 ⇒ ~42° projected dogleg; gate test **≥12°** projected from the chase camera | Fixes the DEPTH-PROJECTION TRAP — has no direct biological analogue; it is a **camera** fix (`FLAP-DESIGN.md` LAW 3) |
| **`restLift`** | cruise dihedral | repo 0.03–0.05 | Vultures vary bank angle constantly `[S]` — never a frozen dihedral (§2.8) |
| **Cadence jitter / burst length** | §5.3 | hold **3.0–4.5 s**, ceiling ~6 s, floor ~1.5 s, **±25% jitter**, bursts of 2/3/4 | Kills AAA §2 #8 (metronome). Seeded/deterministic, never `Math.random` |
| **Camber-by-airspeed** | §4.5 | **0.06–0.10 c** cruise → **0.14–0.20 c** hover/launch/climb | This is a **sourced animation**, not taste: real camber changes 3.5× hover→7 m/s `[S]` |
| **Banking** | — | pose bias only | Both wings share ONE phase; an L/R phase offset reads broken (`FLAP-DESIGN.md` LAW 5) |

### §5.6 What §5 rules out

- **Beat frequency above ~2 Hz at cruise for a large creature.** Frequency falls with mass as
  **M^−0.26** (bats) / **M^−1/6** (birds) `[S]`; a big animal beating at 4 Hz reads as a scaled-up
  pigeon.
- **Flapping continuously in cruise.** Condors flap **1%** of flight time, storks ~17% `[S]`.
  Continuous cruise flapping is a small-bird signature.
- **Metronome-constant beat interval.** Real intervals are explicitly **irregular** `[S]`
  (already AAA §2 #8).
- **A glide-hold with the wing frozen.** Sourced biology backs the house ban: a soaring bird holds
  for seconds but never stops deforming (§5.3).
- **Symmetric down/upstroke with equal span.** Real membrane flyers **retract span on the
  upstroke**, more so at low speed, to the point of clapping the handwings `[S]`.
- **An L/R phase offset used to express banking** (`FLAP-DESIGN.md` LAW 5).
- **A fold amplitude "fix" for an invisible fold.** Cranking amplitude never solves a
  depth-projection failure — change the articulation AXIS (`FLAP-DESIGN.md` LAW 3).
- **Quoting τ = 0.55 as a fact.** It is `unknown`; it may be used only as a labelled choice (§5.4).

### §5.7 Field Notes (NON-NORMATIVE)

- Griffon vulture heart rate exceeds **300 bpm** during take-off flapping against an **80–100 bpm**
  baseline, returning within **10 min** of soaring. If a creature ever needs an exhaustion or
  breath-recovery system, take-off — not cruise — is where the real cost lives.
- Bats fly **50–150% above** the "efficient" Strouhal band because a membrane needs speed to
  tension. A membrane creature that beats *slightly too fast for its size* is anatomically honest,
  not a mistake.
- The uropatagium is fanned through **up to 135° of arc** to make thrust in takeoff and slow
  flight — a tail membrane, if a creature has one, is a *thrust* surface at low speed, not decor.

---

## §6 Head, horn, and crest families

### §6.1 Skull profile function families

The "profile function" is the **dorsal midline curve** from premaxilla tip to occiput: height above
the tooth-row axis vs distance along the skull, skull length normalized to 1.0.

| Family | Curve (authorable) | Inflections | Exemplars | Reads as |
|---|---|---|---|---|
| **A. Concave / dished** | Monotonic-concave rake; sags between a raised brow mass and a raised muzzle tip. One interior **minimum**, no interior maximum. Dish depth a few % of skull length | **1** (negative) | Arabian horse `[S]`; veiled & Jackson's chameleons `[S]`; brachycephalic felids `[D]` | Refinement, neoteny, "bred not evolved". **Poor for a heavy predator — the dish shrinks apparent bone mass** |
| **B. Convex / roman-nosed** | One interior **maximum** — a keel peaking over the nares at **x ≈ 0.20–0.35** from the snout tip, descending toward the brow | **1** (positive) | Draft/Iberian horse breeds `[S]`; hornbill, where the **casque IS the interior peak** `[S]`; ram, moose `[D]` | Mass, coarseness, power. **The strongest single "heavy predator" signal in the profile vocabulary** — it throws a hard shadow break |
| **C. Straight wedge** | Monotonic rake, no inflection; near-linear occiput→snout; plan outline triangular, tapering anteriorly | **0** | Komodo dragon — "skull approximates a blunt pyramidal shape, contour in all four aspects approximately triangular" `[S]`; gharial and other longirostrines `[S]`; canids `[D]` | Efficiency, speed, "animal". **Cheapest to author and the default a modeller falls into — reads generic** |
| **D. Recurved / hooked** | Monotonic descent to x ≈ 0.7, then a terminal **recurve**: curvature flips and the tip hooks below the tooth-row axis. In falcons preceded by a notch (the **tomial tooth**) | **1** (terminal) | Eagles/hawks/owls — "all raptors possess a sharply hooked bill with sharp cutting edges (tomia)"; accipiters carry a lateral *festoon*, falcons a *tomial tooth* `[S]` | Instant "bird of prey" — extremely legible and **extremely owned by birds** |
| **E. Boxy blunt** | Near-flat plateau over most of the length (low slope, low curvature), then an abrupt near-vertical drop at the front. High width, low height | **0** | Nile croc / alligator: **W/L 0.47–0.54, H/L 0.25–0.35** `[S]`; brevirostrine crocodilians `[S]`; hippo `[D]` | Crushing power **and** low-slung ambusher. **From a rear-high camera this reads as NO HEAD AT ALL** — a flat plate seen from above has almost no vertical signature |

**The composite the reference supports `[D, forced by the sourced morphologies]`: the S-PROFILE
(B → A → rising occiput).** Convex muzzle keel, concave brow dip, rising occipital mass. **It is
the only family with TWO inflections, so it survives being read as a shadow: three events instead
of one.** Real analogues: the hornbill (casque peak + dip + skull mass) `[S]` and the horned
chameleon (rostral horns + dip + casque) `[S]`.

**The projective argument `[D]`.** From a 3/4 rear-high camera at 40–50° down-and-behind, a
horizontal snout foreshortens by roughly cos(θ) toward the vertical axis while the **height** of
every dorsal-profile feature is preserved almost fully. **Every design dollar spent on lateral
snout curve is refunded at ~30 cents; every dollar on dorsal height is refunded at ~95 cents.**
A concave dish is a *negative* area anomaly (removed area is indistinguishable from nothing at low
resolution); a straight wedge has zero curvature and therefore zero event; **the convex interior
peak ADDS area exactly where the black shape is thinnest, so it survives downsampling.**

### §6.2 Skull proportion table (skull length = 1.0 unless stated)

| Group | Skull : body reference | Snout / skull L | Skull W : H | Orbit Ø / skull L | Jaw hinge (× skull L from snout tip) |
|---|---|---|---|---|---|
| **Crocodilians** | Head ≈ **1/7.4 of total length** `[S]`; largest *C. thorbjarnarsoni* skull 85 cm ↔ 6.2–6.5 m TL ⇒ **skull ≈ 13% TL** `[S]`. Field rule: eye-to-nostril in **inches** = total length in **feet** `[S]` ⇒ eye–nostril ≈ TL/12 `[D]` | longirostrine **≥0.67** `[S]`; mesorostrine **≈0.55–0.65** `[D]`; brevirostrine **<0.50** `[D]` | **1.55–2.11** (mean ≈ **1.7**) `[S]` dims, `[D]` ratio | unknown numerically; small and **dorsally placed on the skull roof** `[S]` | unknown; quadrate at the extreme posterior ⇒ **0.90–1.0** `[D]` |
| **Varanids (Komodo)** | Skull ≈ **15% of SVL** `[S]`; measured specimen head/SVL **0.19** `[S]` | unknown numerically; triangular, tapering anteriorly `[S]` | 16.72 × 8.3 × 6.46 cm ⇒ W/L 0.50, H/L 0.39, **W:H = 1.28** `[S]` dims, `[D]` ratio | unknown | unknown |
| **Large theropods** | Sue's skull **1.53 m** `[S]`, femur ≈ 1.36 m, TL 12–13 m ⇒ **skull ≈ 0.12 × TL**, **≈ 1.12 × femur** `[D]`. Skull : torso **unknown** | unknown numerically | unknown (Sue's W/H not retrievable) | **≈ 0.20**, archosaur-wide `[S]` | unknown; **0.85–0.95** `[D]` |
| **Raptorial birds** | Golden eagle skull ≈ **13 × 8 cm** vs body 75–90 cm ⇒ **skull ≈ 0.15 × body length** `[S]` dims, `[D]` ratio. Cranium-only: golden eagle 113.5 mm ♂ / 119.0 ♀; bald eagle 119.4 ♂ / 126.3 ♀ `[S]` | unknown numerically | W/L **0.62** `[D]`; W:H unknown | Very large. Owls: two eyes = **≥50–70% of skull volume** `[S]` | unknown |
| **Hornbills** | Skull + casque + bill ≈ **10% of body weight** (helmeted hornbill) `[S]` | Casque runs from bill base **halfway to the tip** ⇒ ≈ **0.5 × bill length** `[S]` | unknown | unknown | unknown |

**The three anchors that actually constrain a model:**

| # | Anchor | Tag |
|---|---|---|
| 1 | **Orbit Ø ≈ 0.20 × skull length** across archosaurs, and it is **negatively allometric** — a *bigger* head gets a *proportionally smaller* eye. Carnivores had smaller eyes both absolutely and relative to skull | `[S]` |
| 2 | Crocodilian **W:H ≈ 1.7** (flat) vs varanid **≈ 1.28** (blockier) ⇒ a heavy creature wanting mass should sit at **W:H ≈ 1.0–1.2 — taller than a crocodile** | `[S]` dims, `[D]` target |
| 3 | **Skull ≈ 0.12–0.15 × total body length** is the predator norm across crocodilians, varanids, theropods and eagles | `[D from the four sourced rows]` |

### §6.3 Crest and horn systems — the rank law

Height = maximum crest projection perpendicular to the skull's long axis ÷ skull length. Sweep =
angle of the crest's long axis measured **backwards from the skull's long axis** (0° = straight
forward, 90° = straight up, >90° = swept back over the neck).

| System | Height fraction | Sweep | Rank structure |
|---|---|---|---|
| ***Nyctosaurus*** | Crest **≈ 3× skull length** — "nearly three times the length of the skull proper"; spars **42 cm** up / **32 cm** back `[S]` | Y-shaped: upward spar ≈ **80–90°**, backward spar ≈ **150–170°** `[D from the described geometry]` | **DOMINANT, single bifurcated blade. No rank.** Largest crest relative to skull of any pterosaur `[S]` |
| ***Pteranodon*** | ⚠ **unknown numerically** — Bennett 1992's metric table was not retrievable. Bimodal: small size-class small crests, large size-class large crests `[S]` | *P. sternbergi* tall and upright with a broad forward projection; *P. longiceps* a backswept blade `[S]`. **Numeric sweep unknown** | **DOMINANT single blade**, counterweighted against the long rostrum |
| ***Tupandactylus navigans*** | Soft-tissue crest extends **>5× the height of the skull** `[S]`; bony crest extended much further by a **keratin sheath** `[S]` | Near-vertical, ≈ **80–100°** `[D]` | **DOMINANT single sail.** ⚠ *Tapejara wellnhoferi* proper has **no** evidence of a keratinous crest `[S]` — the famous sail is Tupandactylus |
| **Ceratopsid frill (*Torosaurus*)** | Frill ≈ **50% of total skull length** (skull to 2.77 m) `[S]`; *Triceratops* skull 2.5 m ≈ **1/3 of body length** `[S]` | Frill plane sweeps back and up ≈ **120–150°** `[D]` | **DOMINANT plate**, margin carrying epiossifications |
| **Epiossifications (*Styracosaurus*)** | individual spikes unknown as a fraction | radial, splayed | ⚠ **THE CRITICAL FINDING: nature does NOT build equal pickets.** *S. albertensis* carries **seven** epiossifications on the right parietal bar but **eight** on the left; p3–p6 are **asymmetrical in size, orientation and position** `[S]` |
| **Bovid horns** | varies wildly; ontogenetic allometry shifts systematically with body mass `[S]` | forward over the head **or** back toward the tail `[S]` | **ONE dominant pair. No rank at all** |
| **Rhinoceros** | White rhino anterior horn to **~150–166 cm** vs skull ≈ **76 cm** ⇒ horn can exceed **2× skull length** `[S]` dims, `[D]` ratio. Woolly rhino record **164.7 cm**, ~9 kg `[S]` | Rises near-vertically then recurves back, ≈ **70–110°** `[D]` | **DOMINANT + DECAY** — big anterior horn, distinctly smaller posterior. The textbook 2-element decay |
| **Chameleon casque (veiled)** | Casque to **5 cm** in the largest adults `[S]`; **skull length unknown ⇒ fraction unknown** | Rises and sweeps back over the occiput ≈ **100–130°** `[D]` | **DOMINANT single blade**, growing with maturity, larger in males `[S]` |
| **Chameleon rostral horns (Jackson's)** | unknown | forward, ≈ **0–20°** `[D]` | **DOMINANT + PAIR**: a median plus a pair, plus a *small* posterior crest `[S]`. Again: never equal pitch |
| **Hornbill casque** | ≈ **0.5 × bill length** `[S]`; skull+casque+bill ≈ **10% of body weight** `[S]` | An interior **peak** on the dorsal bill line `[S]` | **DOMINANT single mass.** Keratin veneer ~**8× thicker** than beak keratin over a bony core of exceptionally thick rod-like trabeculae `[S]` |
| **Cassowary casque** | **unknown** (bird 160–170 cm tall `[S]`; casque height not sourced) | Near-vertical from the frontals, ≈ **80–100°** `[D]` | **DOMINANT single blade.** Keratinized over a trabecular core; acts as a **thermal window** — offloading heat at 36 °C, restricting loss at 5 °C, heating **posterior-first** at intermediate temperatures `[S]` |
| **Theropod ornament (*Carnotaurus*)** | Brow horns **15 cm** bony core, "probably formed the cores of much longer keratinous sheaths" `[S]`; skull ≈ 60 cm ⇒ **≈0.25 × skull L in bone**, more in keratin `[D]` | Lateral-dorsal, splayed ≈ **45–70°** `[D]` | **ONE dominant pair** |
| ***Ceratosaurus*** | nasal horn height **unknown** | vertical | **DOMINANT + DECAY**: a prominent nasal horn plus **two smaller horny bumps over the eyes** `[S]`. Textbook 1 → 2 decay |

> **THE RANK LAW `[D, but forced by the sourced data]`. Any crest rank must be DOMINANT +
> MONOTONIC DECAY, and must carry deliberate irregularity — unequal spacing, ±1 element left vs
> right, or unequal sizes — because that is what real cranial ornament does. Equal heights at equal
> pitch is "the comb", and it has NO natural precedent.** Practical ratio: successive elements at
> **~0.62–0.70** of the previous element's height (so each is unambiguously smaller at silhouette
> resolution), with **spacing that also contracts** `[D]`.
>
> Tally across the sourced systems: single dominant element — Nyctosaurus, Pteranodon,
> Tupandactylus, cassowary, hornbill, chameleon casque. Dominant + explicit decay — rhino,
> Ceratosaurus, Jackson's chameleon. One dominant pair, no rank — bovids, Carnotaurus. The **one**
> system that superficially looks like a comb is **documented as unequal AND bilaterally
> asymmetric** `[S]`.

**Placement `[D]`.** From a rear-high camera the **occiput is the closest, highest, least-occluded
region of the head and the only part projecting into clean sky** — so the dominant crest roots
there, at a sweep of roughly **120–150°**, with a fast-decaying rank of two or three secondaries
behind it. Nature demonstrates the occiput can carry absurd projection without wrecking the animal
(Nyctosaurus **3× skull length**, Tupandactylus **>5× skull height**, both `[S]`). Forward-pointing
bovid horns and nasal horns are drawn *inside* the skull's own silhouette from this angle and
vanish.

**Scale invariance `[D]`.** At 32 px a rank of equal spines is one grey bar; a dominant blade with
decaying followers is still a blade with followers. **Every sourced natural system meant to be seen
at distance is dominant-single.**

### §6.4 Eye placement and the predator/prey read

Two measures get confused; keep them apart. **Orbit convergence angle** is a *bone* measure
(orbital plane vs midsagittal plane) — ⚠ **the standard numeric table (Heesy 2004) was NOT
retrievable; treated as `unknown` rather than guessed.** **Binocular field overlap** is a
behavioural/optical measure in degrees — retrievable, and the better authoring proxy anyway.

| Animal | Binocular field | Orbit position | Orbit Ø | Signal |
|---|---|---|---|---|
| Tawny owl | max retinal binocular width **48°** `[S]` | forward, frontal plane; eyes tubular and fixed by a sclerotic ring, so the **head rotates ~270°** instead (14 cervicals) `[S]` | **50–70% of skull volume** `[S]` | Maximum "face". The most anthropomorphic head in nature — reads as a **character**, not a predator |
| Eagle (short-toed) | functional binocular **max width 20°** `[S]` | laterally set, deep supraorbital shelf | very large absolutely | ⚠ The famous "eagle glare" is **NOT** from convergence — it is from the **brow shelf** |
| Red-tailed hawk | **≈33°** `[S]` | — | — | ambush/soar |
| Cooper's hawk | **≈36°** `[S]` | — | — | pursuit through clutter → wider binocular |
| Pigeon | max width **27°**; vertical extent **130°** (90° above the bill, 40° below) `[S]` | lateral | — | panoramic surveillance |
| Crocodilian | **<25°**; relies on monocular vision `[S]` | **DORSAL** — orbits raised onto the skull roof so the eyes clear the waterline `[S]` | small | Ambush-from-below. **Dorsal orbits + flat skull is the single most recognizable "crocodile" tell** |
| Big cat / domestic cat | frontal binocular **≈140°** `[S]`; convergence value unknown | forward, mid-height | large | stalking predator |
| Dog | **30–60°** `[S]` | forward-lateral | — | coursing predator |
| Horse (prey) | **55–65°**, some authors 70–80° `[S]` | fully lateral, high on a long skull | — | **Prey. Never do this to a predator design** |
| Human (frame of reference) | temporal orbital margin at **107.1°**; lateral orbital margin across primates **85°–115°** to the sagittal plane `[S]` | forward | — | reference for "how frontal is frontal" |
| ***T. rex*** | **binocular field 45–60°**, comparable to modern raptorial birds `[S]` | orbits **anteriorly directed**, keyhole-shaped, set high and far back `[S]` | **≈0.20 × skull L** `[S]` | **The target.** A skull that got binocularity by **sculpting the snout narrower behind the orbits**, not by rotating the eyes |

**Derived authoring targets `[D]` — flagged as mine, not sourced:**

| Target | Value |
|---|---|
| Orbit **centre, longitudinal** | **x ≈ 0.62–0.72 of skull length** from the snout tip (posterior third, not at the occiput) |
| Orbit **centre, height** | **y ≈ 0.70–0.85 of skull height** — the eye sits in the **upper quarter** of the lateral face, brow mass above, cheek/jaw mass below |
| Convergence for a hero/turntable shot | pupil axes converging **2–4 head-lengths in front of the snout** ⇒ total convergence **~40–60°**, i.e. deliberately inside the sourced **T. rex / raptorial-bird 45–60° band** `[S]` band, `[D]` construction |

> **THE FIX FOR "GIANT EYES READ AS LIT NOSTRILS" `[D]`** (the exact failure named in
> `DRAGON-DESIGN.md` §1): an eye placed at **mid-height** with a long snout in front of it is
> **geometrically indistinguishable from a nostril**. An eye at **0.75–0.85 height with a shadowed
> shelf directly over it** is not.

**What the brow ridge does.** In ornithischians the **palpebral** forms a prong projecting from the
antero-dorsal corner of the orbit; elongate palpebrals "would have given their owners fierce-looking
**eagle eyes**" `[S]`. `[D]` **The brow shelf is what converts an eye from a *feature* into an
*expression*:** it supplies (a) a hard horizontal shadow capping the eye, (b) an implied downward
vector — the eye reads as *looking down at you*, and (c) a silhouette event on the dorsal profile
that survives when the eye itself is one dark polygon. **A creature with a strong brow and a small
eye reads more predatory than one with a big eye and no brow** — sourced support: raptors get their
"glare" with only **20–36%** binocular overlap `[S]`, so the glare is demonstrably the **bone**,
not the eye direction.

### §6.5 Gape

| Animal | Max gape | Note |
|---|---|---|
| Modern conical-toothed cats | **65–80°**; lion ≈ **65°** | `[S]` |
| ***Smilodon fatalis*** | **≈120°** max; machairodonts **100–130°**; some models use ≈90° | `[S]` |
| Nile crocodile (basking) | **26 ± 1°**, range **18–32°** | `[S]` — ⚠ this is **thermoregulatory** gaping; **maximum feeding gape is `unknown`** |
| Snakes | some species approach **180°**; many max ~**130°**; Burmese python **>100°**, mouth stretching to **~4× skull diameter** | `[S]` — ⚠ the **180° figure is loosely sourced; treat as a ceiling, not a measurement** |
| Birds | numeric maxima **unknown**. Mechanism is cranial kinesis: **prokinesis** rotates the whole upper jaw as a rigid unit about the **nasofrontal hinge**; rhynchokinesis bends within the bill | `[S]` mechanism |

**Authoring band `[D]`: a heavy predator should sit in the saber-tooth band, ~90–110°, not the
crocodile band.** Rationale: (a) it visually separates the creature from crocodilians, whose
shipped silhouette tell is a long low skull with a small gape; (b) **a >90° gape puts the mandible
below the neck line in silhouette, creating a second read — the head splits into two shapes** at
exactly the moment of a breath/bite attack; (c) machairodonts really did **100–130°** `[S]`.

### §6.6 Neck junction

- **Where it is `[S]`.** The **occipital condyle** sits on the **caudoventral** surface of the
  occipital bone, flanking the foramen magnum, articulating with the atlas — flexion/extension plus
  limited lateral tilt. Shape, orientation and separation **vary between species and reflect posture
  and head-mobility adaptations**. ⚠ Comparative archosaur angles were **not retrievable —
  `unknown`.**
- **Craft consequence `[D]`.** Because the condyle is **ventral and caudal**, the neck enters the
  skull **below and behind** the braincase — never at the back of the skull's mid-height. Getting
  this wrong produces the "head glued on a tube" read. **The occipital mass therefore OVERHANGS the
  neck junction, and in silhouette from rear-high you should see a distinct STEP: skull roof high,
  then a drop, then the neck's dorsal line lower.** That step is free silhouette information from
  the money camera — and it is where the dominant crest roots (§6.3).

| Precedent | Mechanism | Lesson |
|---|---|---|
| **Heron/egret/bittern** | The S is created by a modified/elongated **sixth cervical**, whose muscular connections to C7 form an **elastic hinge**; the neck is drawn into an S then the head thrust forward at very high speed `[S]`. ⚠ **Numeric fold/unfold angles: unknown.** `[D]` estimate, flagged: the C6 kink closes from ~150–170° extended to ~30–50° folded — a **~110–130° swing at ONE joint** `[no-assert]` | Concentrate the articulation budget in **one deep hinge**, not distributed flex |
| **Owl** | Head rotation **≈270°** via **14 cervical vertebrae** and vertebral foramina ~**10× the artery diameter** `[S]` — compensating for eyes fixed by a sclerotic ring | The high-mobility solution, and it is a **light-headed** animal's solution |
| **Hornbill** | First and second cervicals are **FUSED**, with distinctive skull–neck joining features, probably to support the huge bill `[S]` | **A heavy-headed animal STIFFENS the head–neck junction rather than making it more mobile** |

`[D]` **A big-keeled, big-crested head is a hornbill problem, not an owl problem.** Author the
junction as **stiff and stepped** (short, thick, high-set) and put the articulation budget one or
two vertebrae further down the neck — a heron-style single deep hinge at "C6" rather than
owl-style distributed flexibility. This also protects the flap/tail motion budget.

### §6.7 Teeth and beak edges at low poly

**Sourced principles (not counts):** a clearly legible **silhouette is the foundation of low-poly
art** `[S]`; **too much detail becomes noise**, and small details should **add visual interest to
major silhouette reads, not distort them**; a good silhouette has **one defining primary
characteristic** `[S]`. Nature's own "readable tooth" is **one dominant notch** — the falcon's
tomial tooth, a single sharp triangular ridge `[S]`. Film solves tooth legibility with **material
and curvature, not quantity** (Smaug: serrated recurved teeth with gold fused into the enamel) `[S]`.

`[D]` **authoring defaults, not facts:**

| Dial | Value | Reason |
|---|---|---|
| **Count** | **5–9 exposed teeth per upper jaw side**, not a full dentition | Above ~12 the row aliases into a white bar at any realistic on-screen head size |
| **Rank** | Same **dominant + decay** law as the crest: 1–2 dominants per side at 100%, followers at ~**0.6, ~0.45, ~0.35** | Uniform teeth are the dental version of the comb (§6.3) |
| **Exposure height** | **≥6–8% of skull length** for the dominants | Below ~3 px on screen a tooth stops being a shape and becomes noise on the lip line |
| **Spacing** | inter-tooth gap **≥0.8× the tooth's base width** | Below ~0.5× the row merges into sawtooth mush at distance |
| **Value** | Gum/lip line **dark**, tooth **light**, inter-tooth gap **as dark as the mouth interior** | **Value, not geometry, sells teeth** — the value-structure law (`AAA-PIPELINE.md` §1) applied to dentition |
| **Coverage** | Only **x ≈ 0.0–0.35** of skull length needs teeth | From every camera the game uses, the posterior row is occluded by the cheek/jugal mass |
| **Asymmetry** | Break or offset **one** tooth | Sourced precedent: the *Styracosaurus* 7-vs-8 finding `[S]` (§6.3) |

### §6.8 What §6 rules out

- **The flat boxy crocodile skull (family E) as a base profile.** W:H ≈ 1.7, H/L 0.25–0.35 `[S]` is
  the flattest predator skull family measured and therefore the one with the least vertical
  signature from a rear-high camera. Target **W:H ≈ 1.0–1.2**.
- **Crocodile profile + bolted-on horns.** A *composition* failure, not a horn failure: a monotonic
  wedge with vertical spikes has one curvature event and a second unrelated event above it.
  Hornbills, chameleons and cassowaries all **integrate** the ornament into the dorsal profile as an
  interior peak or a rising occiput `[S]`.
- **The full recurved beak (family D).** Recurving the whole rostrum tip is owned by raptors `[S]`.
  (A *small* terminal hook on the premaxilla only — **under ~8% of skull length** — is safe.)
- **Equal-pitched picket crests ("the comb").** No sourced natural system does it; the closest
  analogue is documented as unequal **and** bilaterally asymmetric `[S]` (already
  `DRAGON-DESIGN.md` §2.4 / AAA §2 #2 — this is the anatomical proof behind those bans).
- **Forward-pointing bovid/rhino horns as the primary read** — occluded by the skull's own mass from
  rear-high, so they cost geometry and return nothing in the money shot. Fine as a *tertiary* decay
  element.
- **Owl-style giant frontal eyes.** Owls put **50–70% of skull volume** into eyes `[S]` and get a
  *face*, not a predator. Archosaur norm is **orbit ≈ 0.20 × skull length** and **negatively
  allometric** `[S]` — a big head carries a *relatively small* eye.
- **Eyes at mid-face height, laterally placed, with no brow.** That is the *prey* configuration
  (horse: fully lateral, 55–65° `[S]`) and it is geometrically ambiguous with a nostril (§6.4).
- **Convergence pushed to primate/owl extremes** — full frontality reads humanoid. Sit in the
  **45–60%** band `[S]`.
- **A crocodile-band gape (18–32°)** for a bite/breath attack — that is a *basking* crocodile `[S]`
  and it is where a default rigged jaw lands. Use ~90–110°.
- **A dished/concave (Arabian) profile on a heavy creature** — it *removes* silhouette area from the
  thinnest part of the shape and signals refinement/neoteny `[S]`.
- **A full dentition of uniform teeth** — aliases to a white bar and violates the "details reinforce,
  never distort, the primary read" principle `[S]`.
- **A flexible owl-like head–neck junction on a heavy head** — heavy-billed birds **fuse** C1–C2 to
  support the mass `[S]` (§6.6).

### §6.9 Field Notes (NON-NORMATIVE)

- **Witmer's rostral-nostril rule `[S]`:** the fleshy nostril sits **rostrally or rostroventrally
  within the bony nostril in ALL extant diapsids**. So a convex nasal keel is anatomically *the roof
  of the nasal apparatus*, and enlarging it is the one ornament a breath-weapon creature can justify
  functionally. Cassowary and hornbill casques cover exactly this real estate and are **vascular /
  pneumatic inside** `[S]` — the anatomical licence for a glowing heat-organ read under a keel.
  (The cassowary casque even heats **posterior-first** — real thermal organs have a *direction*.)
- **The gular sheet is a real structured organ and the correct home for a withheld charge glow.**
  The **pelican** pouch distends because **the lower mandible bows outward laterally**, not because
  the skin stretches alone, and the tissue is thin enough to see vasculature through `[S]`; the
  **frigatebird** inflates over **~20 minutes** as a display `[S]`. `[D]` Author it as a separate
  low-poly membrane spanning the rami: rest state with **4–7 transverse folds**, distended state
  with the folds flat and the rami bowed, emissive transmission ramping with distension — obeying
  the withheld-glow rule (`DRAGON-DESIGN.md` §6).

---

## §7 Hot-material appearance physics

**Creature-agnostic.** Any ember, lava, forge, magma, coal, or heat-organ creature builds from
here — an ember serpent, a forge golem, a magma leviathan, a heat-vent drake.

### §7.0 THE FINDING THAT REFRAMES EVERYTHING

> **Nothing solid on Earth is ever white by *chromaticity*. "White hot" is a luminance/clipping
> phenomenon, not a hue phenomenon.**
>
> Blacksmith "white heat" = 1,300 °C = **1,573 K** `[S]`. The blackbody chromaticity at 1,573 K is
> roughly **`#ff7000` — a deep orange** `[D, interpolated in a sourced table]`. **A white-hot billet
> is an orange light source so intense that the eye and the sensor both clip.**
>
> **BUILD CONSEQUENCE: do not author a white core and hope for an orange bloom. Author an
> orange–amber emitter at high intensity and let exposure/tonemapping clip the centre to white.**
> That single move produces the correct core→bloom→dark structure for free — and it is exactly what
> filmic/ACES tonemapping is designed to do ("colors desaturate as they become brighter… push
> colors toward white the brighter they are") `[S]`.

This is the physical proof of `AAA-PIPELINE.md` §1 (value-structure law) and §2 #6 (white smear:
"the core carries brightness, the HALO carries hue").

### §7.1 Temperature → colour

**7.1a Perceptual band + blackbody chromaticity, merged.** Named appearances and the smith's-scale
temperatures are `[S]`; hexes at 1000 / 2000 / 3000 K are `[S]`, the rest interpolated `[D]`.

| °C | K | Named appearance `[S]` | sRGB hex | R, G, B (0–1) | B:R |
|---|---|---|---|---|---|
| 525 | 798 | "red just visible" (darkened shop only) | — | — | — |
| 699 | 972 | "dull red" | — | — | — |
| 727 | 1000 | (bottom of the chromaticity table) | `#ff3800` `[S]` | 1.00, 0.22, 0.00 | 0.00 |
| 800–870 | 1073–1143 | "dull cherry red" → "cherry red" | ~`#ff5300` `[D]` | 1.00, 0.33, 0.00 | 0.00 |
| 900–1000 | 1173–1273 | "full cherry red" → "clear cherry red"; colour begins shifting to orange at 925 | ~`#ff6400` `[D]` | 1.00, 0.39, 0.00 | 0.00 |
| 1093–1200 | 1366–1473 | "yellow" / "deep orange" / "clear orange" | ~`#ff7300` `[D]` | 1.00, 0.45, 0.00 | 0.00 |
| 1259–1314 | 1532–1587 | "yellow white" | ~`#ff7e00` `[D]` | 1.00, 0.49, 0.00 | 0.00 |
| **1300** | **1573** | **"white heat"**; steel begins to melt | ~`#ff7000` `[D]` | 1.00, 0.44, 0.00 | 0.00 |
| 1400–1500 | 1673–1773 | "white bright" → "white dazzling" | — | — | — |
| 1727 | 2000 | — | `#ff8912` `[S]` | 1.00, 0.54, 0.07 | 0.07 |
| 2727 | 3000 | — | `#ffb46b` `[S]` | 1.00, 0.71, 0.42 | 0.42 |
| 6227 | 6500 | ~white `[S]` | ≈#ffffff | ≈1, 1, 1 | ≈1.0 |
| — | 8000–10,000+ | pale blue → blue; the peak leaves the visible into UV `[S]` | — | B > R | >1 |

⚠ **The smiths' own caveat, preserved `[S]`:** these are **darkened-shop** readings; **in daylight
every band reads two to three hundred degrees hot.** A cruise-daylight creature loses the dull-red
end of its ramp outdoors unless it is deliberately cheated up.
Runtime curve if needed: **Tanner Helland's K→RGB approximation** (valid 1000–40000 K, R pinned at
255 below 6600 K) `[S]`.

**7.1b Which band each real material occupies — all `[S]` unless noted:**

| Material | Temperature | Band |
|---|---|---|
| **Fresh Kīlauea lava at vent** | ~1,170 °C | top of yellow-orange; reads near-white at the source |
| Lava: yellow-glowing / orange-glowing / red-glowing crust | 1,000–1,200 / 800–1,000 / 600–800 °C | yellow / orange / dull→cherry red |
| Lava flow "solidified" threshold | below ~1,000 °C | crust opaque black; **interior still ~1,480 K after 30 months** in a 30 m core |
| **Forge-welding steel** / general forging | ~1,200–1,350 / 760–1,100 °C | clear orange → white heat / dark cherry → deep orange |
| **Banked coals / glowing charcoal bed** | ~600–800 °C | dull → cherry red; **the dimmest legible band** `[D]` |
| ⚠ Steel **tempering oxide** colours — **NOT incandescence, thin-film** | 220–300 °C | straw 230, brown 254, purple 277, dark blue 288, bright blue 297 |

**Two-band authoring default `[D]`:** core seams at **1,100–1,300 °C** (deep orange → white
clipping), cooling capillaries at **650–800 °C** (dull red) — the forge-heat vocabulary a viewer has
already internalised from every blacksmith clip they have seen.

### §7.2 The fire channel-ordering rule and the blue-flip threshold

**Where blue legitimately appears `[S]`:** blue is **chemiluminescence, never incandescence** —
emission from excited **CH and C₂ radicals** during complete combustion, i.e. light emitted by
molecular fragments, not blackbody glow. Yellow/orange flame is **incandescent soot**. A gas flame
is an **inner blue premixed cone** (soot absent) inside an **outer yellow envelope** (soot
radiation). **A hot solid is never blue** — blue-white blackbody requires **≥8,000–10,000 K** `[S]`,
and rock vaporises around 2,500–3,000 K. **There is no physical path to a blue-cored hot rock.**

Blue may legally appear in exactly two places on a thermal creature:
1. a **thin premixed base ring** at the very root of a gas-jet breath weapon (the only place a
   burning gas, not a glowing solid, is being simulated), and
2. a **dark, desaturated thin-film oxide tint** on the coolest metallic plates (straw/brown/purple/
   blue at 230–300 °C `[S]`) — a *surface* colour at low value, not an emitter.

> ### THE CHANNEL-ORDERING RULE
>
> Across the entire incandescent range 1,000–2,500 K — everything a solid can physically do —
> **R = 1.0 always, G rises 0.22 → 0.62, B rises 0.00 → 0.29** `[S]`. Blue never approaches green
> until ~6,500 K.
>
> | Zone | Radius (w = crack/emitter width) | Target | Constraint |
> |---|---|---|---|
> | **Core** | 0 – 0.5 w | R = G = B = 1.0 (clipped white) | **Do NOT author this colour.** Author the *bloom* hue at **6–20× exposure** and let the tonemapper clip it |
> | **Bloom** | 0.5 – 3 w | R 1.00, G 0.45–0.62, B 0.05–0.25 | **B ≤ 0.5·G** and **B ≤ 0.25·R** |
> | **Fringe** | 3 – 12 w | R 1.00, G 0.15–0.30, B 0.00–0.08 | **B ≤ 0.15·G**, ideally B = 0 |
> | **Field** | > 12 w | char, R≈G≈B ≈ 0.03–0.06 | see §7.6 |
>
> **INVARIANT ACROSS ALL ZONES: R ≥ G ≥ B, strictly, no exceptions.**
>
> **Hue must be MONOTONIC outward:** ~55° (amber) at the bloom → ~20° (orange) → ~8° (red) at the
> fringe. It must never increase toward green/cyan and must never wrap.
>
> **THE BLUE-FLIP THRESHOLD.** The read flips from *furnace* to *plasma / sci-fi energy* at
> **B > G anywhere in the ramp.** That is not an aesthetic call — **no blackbody between 1,000 K
> and 6,500 K has B > G**, so the moment the pixel data crosses that line the audience's
> calibration says "not thermal". Safety margin: **B ≤ 0.5·G in the bloom, B ≤ 0.15·G at the
> fringe.** A secondary, softer flip happens at **B > 0.4·R with G < 0.6·R** (blue without the
> yellow bridge) → the magenta-violet "arcane" read.
>
> **Corollary: G is the temperature dial.** With R pinned at 1.0, raising G walks up the blackbody
> locus (red→orange→amber→yellow). Raising B walks *off* it. **G is free; B is expensive.**

**Two tonemapping traps that will bite this rule `[S]`:**
1. **ACES pushes bright saturated reds toward yellow as exposure rises** — the "notorious six" hue
   skew, from per-channel tone curves collapsing hues into six attractors. An authored deep-red core
   will *render* orange-yellow. **Exploit it: author one band cooler than you want and let the skew
   heat it up.**
2. **Additive blending desaturates toward white as particles accumulate.** Mitigate with strongly
   saturated source colours, or by **pairing one additive particle with one alpha particle**. HDR +
   tonemapping lessens the clipping.

This rule is assertable: **a pixel probe over the emitter cross-section can test R ≥ G ≥ B and
monotonic hue directly** — cf. the repo's `seamprobe` and AAA §2 #7 (channel-ordering verification).

### §7.3 Crack morphology

**The junction-angle physics — the load-bearing insight `[S]`.** **T-junctions (~90°) mean
SEQUENTIAL cracking**: the first crack releases nearby normal stress, so a later crack propagates
perpendicular to the local maximum tensile stress and **meets the earlier crack orthogonally**.
**Y-junctions (~120°) mean MATURED / simultaneous / repeatedly cycled cracking** — "the evolution
of T junctions into Y junctions, and the equalisation of column cross-sectional areas" happens **as
the pattern matures**, and under repeated wet/dry cycling vertices migrate and angles drift
**90° → 120°**. (Material state biases it too: compacted clays favour 120° Y, dispersed clays 90° T.)

> **DESIGN TRANSLATION `[D]`. 120° hexagons = old, settled, thermally mature, DEAD. 90° T-junctions
> = recently, sequentially, violently cracked.** A creature that keeps re-heating and re-cracking is
> **T-junction dominant** — re-fractured faster than it can equilibrate. **The single strongest
> "alive" signal available in crack layout, and physically justified rather than arbitrary.**

**Scale laws `[S]`:** crack spacing ≈ **10 × film thickness** above the critical cracking thickness ·
**thinner layer ⇒ more cracks** · **two critical thicknesses** — above the first, isolated
**three-pronged stars**; above the second, a **closed network** (a free LOD/growth story: thin
plates get a connected net, thick plates get isolated Y-stars) · columnar width **∝ 1 / cooling
rate** · **hierarchy is universal** — "older cracks widen as new narrower cracks appear," producing
successive generations by **successive division of 2-D domains**.

**THE CRACK-MORPHOLOGY TABLE:**

| Pattern family | Cell / plate size | Crack width | **Cell : crack** | Junction angle | Hierarchical? | Reads as |
|---|---|---|---|---|---|---|
| **Columnar basalt** | few cm – 3 m; Giant's Causeway **38–51 cm**; Devils Postpile to **1.1 m** `[S]` | mm-scale aperture `[D]` | **~100:1 – 400:1** `[D]` | **120° Y**, tightly clustered `[S]` | **No** — mature patterns *equalise* cell areas `[S]` | **Dead rock / architecture.** Also reads as sci-fi honeycomb. **Avoid as primary** |
| **Cooling pahoehoe / lava-lake plates** | plates "a few feet to several tens of feet across but only a few inches thick" `[S]` | incandescent boundary band ~**5–15% of plate span** `[D]` | **~20:1 – 50:1** `[D]` | curving, irregular, **T-dominant**; boundaries spatter where plates converge `[S]` | **Yes** — foundering removes **5–10%** of adjacent crust per overturn, resetting local generations `[S]` | **LIVING ARMOR.** Few, long, curving, *incandescent* seams bounding large smooth plates. **The winner** |
| **Aa clinker** | clinkers **1–10 cm**, angular, jagged `[S]` | no coherent network — rubble | n/a | n/a | No | **Dead rubble / gravel.** Detail scatter only |
| **Charred wood "alligatoring"** | scales; "**smallest scales and deepest cracks where the fire burned longest / hottest**" `[S]` | deep, wide checks | **~5:1 – 10:1** `[D]` | rectangular / orthogonal **90° T** `[S]` | Yes (implicitly — scale size varies with dose) | **Burnt, and heat-dosed.** Chunky enough to read as plate armour at silhouette distance. **Second-best** |
| **Drying mud / desiccation** | spacing **≈ 10 × layer thickness** `[S]` | few % of cell `[D]` | **~20:1 – 50:1** `[D]` | **90° T initially → 120° Y on cycling** `[S]` | **Yes** — first-order wide, second-order narrow `[S]` | Dry, dead, uniform. **Good hierarchy donor, bad primary layout** |
| **Ceramic glaze crackle / craquelure** | mm–cm cells `[D]` | **20–300 µm** measured `[S]` | **~30:1 – 100:1** `[D]` | **T-junctions typical**; cracks curved and sometimes wavy `[S]` | Yes — identifiable crack generations `[S]` | Fine surface age. **Tertiary / capillary layer only** |

**Mechanism note for authenticity `[S]`:** glaze crackle is driven by a **thermal-expansion
mismatch between body and glaze**; a difference above **~0.5 × 10⁻⁶/°C** is enough to crack it on
cooling. That is literally the fiction of a cool plate skin over a hot expanding core — it
justifies the seam network without hand-waving.

**Recommended three-generation seam recipe `[D]`, following the hierarchy law and the ~10:1
spacing/thickness law `[S]`:**

| Gen | Count on the whole creature | Width (w = gen-3) | Cell/plate span | Junctions | Glow band |
|---|---|---|---|---|---|
| **G1 — spine/flank master seams** | **4–8** | **6–10 w** | **25–40%** of body span | curving, T where they abut | hottest: 1,200–1,300 °C, clipping white |
| **G2 — plate boundaries** | **20–40** | **2–3 w** | **8–15%** of body span | mostly 90° T off G1 | 900–1,100 °C, deep orange |
| **G3 — capillaries** | **120–300** | **1 w** | **2–4%** of body span | T off G2, **terminating** (not closing loops) | 650–800 °C, dull red, **mostly dark, lit only on ignition** |

> **KILL RULE `[D]`: no more than ~15% of junctions at 120°, or the surface starts reading as
> settled hexagonal basalt = dead rock. Keep at least 60% T-junctions.**

### §7.4 The crack cross-section value profile

**What is sourced.** Basalt crust is **charcoal-dark** — charcoal albedo **0.04 (3–5%)** `[S]`. The
crack interior stays hot because **crust is an excellent insulator** (flow core ~1,480 K after 30
months) `[S]`. Lava photographers call the lava-vs-basalt range "pushing the limits of a camera's
dynamic range" and universally advise **exposing for the lava and letting the crust underexpose**
(typical no-moon: **f/2.8, ISO 3200, 8 s**) `[S]`. `[D]` That practice IS the measurement: the lava
is **many stops** above the crust — a scene contrast well beyond 12 stops against a 4%-albedo
surface.

**THE PROFILE `[D, anchored on the above]`.** `w` = crack width; values are **post-tonemap display
luminance, 0–1**:

| Zone | Distance from centreline | Luminance | Saturation | Hue |
|---|---|---|---|---|
| **Core (slot interior)** | 0 – 0.5 w | **1.00** (clipped) | ~0.05 (near-white) | n/a |
| **Lip / rim** | 0.5 – 1.0 w | **0.55 – 0.75** | 0.60 | amber, ~50° |
| **Near field** | 1 – 2 w | **0.20 – 0.30** | **0.85 ← saturation PEAKS HERE, not at the core** | orange, ~28° |
| **Mid field** | 2 – 6 w | 0.06 – 0.10 | 0.75 | red-orange, ~15° |
| **Tail** | 6 – 12 w | 0.04 – 0.05 | 0.5 | red, ~8° |
| **Dark char field** | > 12 w | **0.02 – 0.04** (the floor) | ~0 | neutral / faint cool |

> **HEADLINE RATIOS — core : rim : field = 1 : 0.6 : 0.03 ≈ 30 : 20 : 1.**
> **Falloff: ~90% of the drop occurs within 3 crack-widths; the residual tail runs to ~10–15 w.**

Rationale `[D]`: a crack of width `w` behaves as a **slot/line emitter**, so irradiance on the
adjacent surface falls approximately as **1 / (1 + (x/w)²)** — half-value near 1 w, tenth-value near
3 w. The floor is set by char albedo (0.04) under ambient.

**Is it symmetric? NO — and that is a big free win `[D]`:**

| Asymmetry | Mechanism |
|---|---|
| **Depth occlusion** | A crack of width `w` and depth `d` exposes its incandescent floor only within a view cone of half-angle **atan(w/2d)**. For a plausible **d = 3w** that is **±9°** — the hot floor is visible only **near-normal**, and at any oblique angle **the near lip occludes the interior entirely**. The two lips are therefore **never equally bright** |
| **Thermal gradient** | Interior hotter than lip because the crust insulates `[S]` ⇒ **the core hue is one to two bands hotter than the lip**: core amber-white, lip orange, near field red-orange. **Never a uniform hue in the slot** |
| **Convection** | Rising hot gas biases the halo **upward** along the seam |

**Build dial `[D]`: modulate seam emissive by `saturate(dot(N_seam, V))^k` with `k ≈ 2–3`.** Seams
presented edge-on read as thin dark lines with only a rim; seams facing the camera flare. **This
gives free animated brightness as the creature banks — motion for zero cost, and it is the single
cheapest way to make a seam network feel like it has depth rather than being a decal.**

### §7.5 Bloom / halo ratios

**Sourced physics `[S]`.** **Veiling glare** is stray light multiply-scattered inside the lens,
degrading contrast **everywhere in the field**, quantified by the **Glare Spread Function**;
measured magnitude for a *good* lens is **0.187%** (cheap or dirty glass is many times worse).
**Bloom and halation are different effects with different colours:** bloom is "a **white, neutral**
glow caused by light diffusion"; halation is a **red-orange halo near contrasting boundaries of
over-exposed areas**. Tonemapping **pushes bright colours toward white**. Modern bloom is a
**progressive downsample/upsample pyramid**, so **the radius is not fixed by the kernel — a tiny
source can bleed across the whole screen.**

**THE HALO SPEC `[D, anchored on the above]`.** Three superposed layers; radii as multiples of the
emitter's apparent width `W`:

| Layer | Radius | Peak intensity | Hue | Why |
|---|---|---|---|---|
| **L1 — tight bloom** | **1 – 2 × W** | **25–40%** of core | near-neutral, slightly warm | The "white neutral glow" of diffusion `[S]` |
| **L2 — warm halation ring** | **4 – 8 × W** | **5–12%** | **fully saturated amber/orange — THIS is where the hue lives** | Film halation is a red-orange halo at over-exposed boundaries `[S]` |
| **L3 — veiling fog floor** | **15 – 30 × W**, effectively frame-wide | **0.2 – 1.0%** | warm grey | Anchored on measured VGI ≈ **0.187%** `[S]`; games can afford 2–5× that for drama |

> **HEADLINE: halo width : emitter width ≈ 6:1 for the visible warm halo, plus a frame-wide
> sub-1% fog floor.**
>
> **AND YES — the halo carries the hue while the core clips white.** Not stylisation: it is what
> both the sensor and the tonemapper do `[S]`. **Author the emissive colour for where L2 lands,
> then push intensity until the core clips.** Authoring the core at your target hue causes two bad
> things at once: the core goes white anyway, *and* the ACES notorious-six skew rotates the halo's
> hue off-target `[S]`.

**Perf note `[D]`:** the L3 fog floor is nearly free (one very-low-mip add) and does more for the
"furnace in the frame" feel than L1. **If forced to cut one, cut L1; keep L2 and L3.**

### §7.6 Char albedo and the value structure

| Property | Value | Tag |
|---|---|---|
| Charcoal albedo | **0.04 (4%)**; very dark materials generally **3–5%** | `[S]` |
| 0.04 linear in 8-bit sRGB | **≈ 50, 50, 50**; PBR validators expect basecolor floored at **sRGB 30–50** | `[S]` |
| ⚠ Correction found in the same sources | the oft-quoted "never below 4%" rule refers to the **specular** component; **diffuse basecolor legitimately can go lower** — 0.02–0.03 is defensible for deep char, **0.00 is not** | `[S]` |
| **Char basecolor spec** | **linear 0.020–0.045 ≈ sRGB 8-bit 38–58, tinted COOL (B ≥ R by 4–8 units)** so it complements the embers. **Never `#000000`** | `[D from the above]` |
| Roughness — soot deposit | **0.85–0.95** | `[D]` — no measured source found |
| Roughness — vitrified/glassy deep-char fracture faces (*shou sugi ban*) | **0.30–0.45** | `[D]` — grounded in sourced descriptions, `[no-assert]` |

`[D]` **That roughness CONTRAST is the strongest "burnt, not painted-black" cue available, because
it survives at low resolution.**

**THE PAINTER'S VALUE STRUCTURE.** Sourced method `[S]`: Joseph Wright of Derby's forge "night
pieces" (1771–73) used **exactly two light sources — the moon and the white-hot bar**, the
narrative device existing **solely to license a single concealed hot light source**. Turner:
"**vermilion and cadmium yellows clash with leaden blues and pewter greys**"; the fiery plume's
reflection is "**a molten corridor that cleaves the composition vertically**". Frazetta placed
"the **starkest light-against-dark contrast at the intended focal point**… then lessened the
contrast **gradually throughout the rest**, right out to the edges, where there was almost none."

| Quantity | Value | Tag |
|---|---|---|
| **Brightest (near-clipped) area as a fraction of the whole image** | **1–3%** | `[D from Wright's single small billet / Turner's plume core]` |
| Brightest area as a fraction of the *lit* region | **5–10%** | `[D]` |
| **Lit region as a fraction of the whole image** | **20–35%**; the rest falls to near-black | `[D]` |
| Value drop rate | **3 full value steps within ~1 focal-object diameter** of the source | `[D]` |
| **Where saturation peaks** | **NOT at the brightest point.** Brightest = desaturated/white; **saturation peaks one to two value steps down** — the amber/orange mantle around the white | `[D]`, exactly consistent with the sourced path-to-white (§7.5) |
| What the dark field is made of | **Not neutral black — a cool complement.** Turner's "leaden blues and pewter greys" against vermilion/cadmium `[S]`; Wright adds a **second, cold light source (the moon)** to keep shadows chromatic `[S]` | `[S]` |
| Contrast gradient | Max local contrast at the focal point, decaying **monotonically to near-zero at the silhouette edges** | `[S]` — Frazetta |

> **The three laws in build terms:**
> **L1 — THE 3% RULE.** Clipped-white pixels ≤ **3% of the creature's screen area**. More than that
> and it stops being a furnace and becomes a lamp. *(Assertable: count clipped pixels in the
> creature's mask.)*
> **L2 — SATURATION IS ONE STEP DOWN FROM BRIGHTEST.** Never put the most saturated colour at the
> brightest point.
> **L3 — THE DARK FIELD MUST BE CHROMATIC AND COOL.** A char field at neutral R=G=B is Wright's and
> Turner's cardinal sin — and it is the "**flat-black poverty**" failure mode already named in
> `DRAGON-DESIGN.md` §2.8. Push the char toward a cool blue-grey so the ember hue has a complement
> to fight.

### §7.7 Making "burnt" read against ordinary black

| Technique | Detail | Tag |
|---|---|---|
| **Ash dusting** | Grey ash accumulating on up-facing surfaces and in cavities; a whole landscape "covered with a thick layer of ashes" is how a red field avoids becoming mud. **Ash raises local value, which is what makes the black readable at all** | `[S]` |
| **Grey-scale edge wear** | Charcoal-black and grey tones with individual scales and cracks distinctly visible. Real technique: **wire-brushing removes the charred softwood between darker grain bands** to exaggerate contrast. Our equivalent: expose lighter substrate along plate edges and high-wear ridges | `[S]` |
| **Thin-film / temper iridescence** | On metal-ish plates: straw **230 °C**, golden yellow 243, brown 254, brown-purple 266, purple 277, dark blue **288**, bright blue **297** — an iron-oxide film thickening with temperature; genuine **thin-film interference** | `[S]` |
| **Scale-size gradient encodes heat dose** | "**Scales smallest and cracks deepest where the fire burned longest or hottest**" — free storytelling: shrink the plate scale toward the furnace, grow it toward the extremities | `[S]` |
| **Separate paint systems for field vs seam** | The Weta Balrog collectible uses **dark heavy acrylics on skin/horns/teeth and high-end automotive paint in the molten cracks** — **two materials, not one material with a mask** | `[S]` |

> **The temper-colour finding is the answer to "how do we get cool hues into this palette without
> going sci-fi" `[D]`.** A desaturated purple-blue oxide sheen at **low value** on the *coolest*
> plates is physically correct for 230–300 °C metal, sits nowhere near the emissive ramp, and gives
> the char field the chromatic complement Turner and Wright both insisted on. **It is blue that
> cannot possibly be mistaken for plasma, because it has no luminance.**

### §7.8 Heat shimmer, embers, and the mobile budget

**Screen-space distortion is DISQUALIFIED, not merely discouraged `[S]`.** A refract shader works by
"first **rendering the view without the refracting surface**" — a screen grab. GrabPass "can
**significantly increase both CPU and GPU frame times**; you should generally avoid using it other
than for quick prototyping." On mobile it is worse: **tile-based GPUs make switching render target
expensive because it requires resolving colour and pulling data back from slow RAM.** ⇒ **A sourced
disqualification, not a preference** — and it matches `DRAGON-DESIGN.md` §1 ("overdraw is the cliff").

| Technique | Cost | Verdict |
|---|---|---|
| **Vertex-wobble on already-drawn background geometry** | **Zero draw calls, zero fill, zero overdraw** — a few ALU ops in an existing vertex shader | **The only genuinely zero-overdraw shimmer idiom.** Displace background vertices along screen-X by `A·sin(f·y + t)`, amplitude falling off with distance from the hot element `[D]` |
| **Animated emissive on existing surfaces** | Free (already shading those pixels) | Highest value-per-cycle effect available `[D]` |
| **Sprite embers** | Low, if disciplined | Mobile ceiling **150–300 particles** for ALL systems; desktop 500–800 `[S]` |
| **Scrolling refraction mesh** | Grab pass | **Disqualified on mobile** `[S]` |
| **Additive "hot air" cards / volumetric heat-smoke** | Pure overdraw, scales with screen coverage | Cards only at small screen size; volumetrics **out** `[S]` |

**Sourced art direction:** "**fewer particles with strong silhouettes beat thousands of tiny
particles**"; emitter cost = **material expense × spawn count × screen proximity**; fire is
authored as **separate layers** (base flame + smoke + embers + distortion) `[S]`.

**Recommended ember budget `[D from the 150–300 ceiling]`:** cruise/idle **24–40 quads**, 2–5 px,
life 1.2–2.0 s (≈640 px/frame — negligible) · ignition burst **90–140** for ~0.8 s, then decay ·
**hard cap 160** · colour-ramped over lifetime **white-amber → orange → deep red → out**, matching
§7.2 exactly so they read as detached pieces of the same furnace.

**⇒ The whole heat vocabulary with zero post-FX: animated emissive (free) + vertex-wobble on
background geometry (free) + sparse chunky ember sprites (cheap).**

### §7.9 What §7 rules out

**Hue / colour**
- **Any point in the ramp where B > G.** No blackbody between 1,000 K and 6,500 K does it `[S]`.
- **A blue-white authored core.** Requires ≥8,000–10,000 K `[S]`; rock vaporises long before. A blue
  core says "arc reactor", not "furnace".
- **B > 0.4·R with G < 0.6·R** (blue without the yellow bridge) → magenta-violet arcane read.
- **Authoring the core at your target hue.** The tonemapper will whiten it *and* skew the halo `[S]`.
- **Non-monotonic hue outward** — any rotation toward green/cyan as you move away from the core.
  **Fire only cools; it never goes green.**
- **Pure neutral black char (`#000000`)** — below the physical floor `[S]` and it kills the
  chromatic complement (§7.6). Floor at sRGB ~38–58, tinted cool.
- **More than ~3% of the creature's screen area at clipped white** (§7.6 L1).
- **Peak saturation at the brightest pixel** (§7.6 L2).

**Crack layout**
- **Regular hexagonal / 120°-Y-dominant tiling as the primary seam network** — the mature
  equilibrated pattern `[S]`; reads as dead columnar rock or sci-fi honeycomb. Cap 120° at ~15%.
- **A single-generation, uniform-width seam net.** Real networks are hierarchical `[S]`. Uniform
  width = decal, not fracture.
- **Aa-clinker rubble as a primary surface** — 1–10 cm angular fragments with no coherent network
  `[S]` read as gravel: no armour, no silhouette.
- **Closed loops everywhere at the finest generation.** Below the second critical thickness cracks
  are isolated three-pronged stars `[S]`; terminating capillaries look right, fully closed
  micro-cells look like a texture tile.
- **Symmetric, view-independent seam glow** — a slot of depth `d` self-occludes; the two lips are
  never equally lit (§7.4). Uniform glow reads as a painted-on stripe.
- **Uniform plate scale across the body** — char scale size encodes heat dose `[S]` (§7.7).

**Shimmer / FX**
- **Screen-space heat distortion, refraction meshes, any grab-pass** — a sourced perf hazard on
  tiled mobile GPUs `[S]`.
- **Volumetric smoke/heat** — overdraw is "one of the biggest performance killers for particle
  effects" `[S]`.
- **Thousands of tiny embers** — explicitly the wrong call `[S]`, and 150–300 is the mobile ceiling
  for **all** particles.
- **Large full-screen additive "hot air" cards** — fill cost scaling with screen coverage; the
  ignition would tank exactly when it matters most.
- **Relying on tight neutral bloom (L1) as the whole halo** — the warm halation ring at 4–8×W and
  the sub-1% fog floor do far more work `[S]`.

### §7.10 Field Notes (NON-NORMATIVE)

- **The universal production pattern across five landmark hot-thing productions `[S]`: the hot thing
  is NEVER authored as a hot thing in isolation — it is authored as *a dark object with a hot
  interior leaking out*.** Smaug's fire development **started with the internal glow inside chest
  and neck**; the Balrog's molten cracks are a **separate paint pass** from the skin (and Weta
  dismissed fully rendered fire early — "CG fire usually has a soft look that is easily
  recognisable"); Mustafar refused pure CG (a physical model, a methylcellulose lava analogue, real
  Etna footage); Muspelheim is **ash over lava**; DOOM (2016) carries hell's emissive detail with
  **many small analytic lights** in a clustered forward renderer rather than volumetrics —
  *put the cost in shading maths, not in fill.*
- ⚠ **A refusal:** no public technical breakdown was found for Breath of the Wild's Death Mountain
  heat shimmer. Nintendo's GDC 2017 talk covers design, not FX internals. **`unknown`.**

---

## §8 Stylization craft laws

### §8.1 Form-budget ratios

| Rule | Number | Tag |
|---|---|---|
| Break a primary form into secondaries at an **uneven** split, never in half | **70 / 30** | `[S]` — Blevins |
| Tertiary detail sized relative to its parent secondary | tertiaries ≈ **30%** of the secondary they sit on | `[S]` — Blevins |
| Within *each* layer, balance forms on a ratio; never bisect; never repeat spacing | **2 : 1** per layer; "try not to divide anything up directly in half"; "avoid repeating the same spacing on details/forms" | `[S]` — Warframe TennoGen (official studio guide) |
| Build order is mandatory | silhouette → medium chunks with a flow → tiny detail **only** at attention points ("the front or back of a helmet, or areas where pieces join") | `[S]` — Warframe TennoGen |
| Surface/micro detail authored **last** | qualitative: "or you might end up with lumpy surfaces" | `[S]` — Warframe TennoGen |
| Hybrid-creature composition budget | **70% primary base** (locomotion identity) / **20% secondary influence** (one feature twist) / **10% hook** (one iconic detail) | `[S, LOW AUTHORITY]` — a tutorial site; a useful formalisation, not doctrine |

> ⚠ **REFUSAL PRESERVED — the "70/25/5" form budget.** Brief 6 found **NO named studio stating
> 70/25/5 for form area.** The nearest sourced numbers are Blevins' 70/30 split, Warframe's 2:1 per
> layer, and the 60-30-10 colour rule. **`[D]` Treat 70/25/5 as a HOUSE CONVENTION, defensible as
> Blevins' 70/30 applied twice (70 / 0.3×70 ≈ 21 / remainder) — never as an industry citation.**

**Straights against curves.** The rule is sourced: "American animation studios taught straights
against curves as *Appealing Design*… defining the primary edge of shapes as either straight or
curved, implying either linear or circular movement"; straight edges read as danger/intent, curves
as comfort/harmony `[S]`.
> ⚠ **REFUSAL PRESERVED — the attribution.** Brief 6 **could not pin the coining of "straights
> against curves" to Preston Blair or any single author.** Blair's *Advanced Animation* (1947) /
> *Cartoon Animation* teach line-of-action and appeal, but **no source credits him with the phrase.
> `unknown` — do not cite Blair for it.**

**Exaggeration ceiling `[S]`:** "When Walt asked for realism, he wanted a **caricature** of
realism." And the stated ceiling is **functional, not aesthetic**: "The anatomy doesn't have to be
100 percent perfect, but it does still have to be **believable**"; "the difference between random
monster and believable creature is not realism — it's **functional logic**. Viewers may not know
anatomy terms, but they can feel when joints don't bend or weight doesn't make sense."

### §8.2 Measured exaggeration calibration

| Case | What was actually pushed | Tag |
|---|---|---|
| **Toothless** | A reference **blend**, not a distortion: black panther (from a panther screensaver — "striking and electrifying, with those eyes staring out from the darkest black face"), cat/dog behaviour, **bat** wing structure, **salamander/gecko/axolotl** eyes | `[S]` |
| **Light Fury** | The **same skeleton** with the real-animal governor swapped to **snow leopard**, tuned "powerful and graceful so that she didn't fall too much into reptilian category"; legs set closer, more elegant walk | `[S]` |
| ⚠ Degree of HTTYD exaggeration **as a number** | **No published percentage.** `[D]` from side-by-side reading: Toothless' head is roughly panther-proportioned but eye diameter is pushed to **≈2–2.5×** a real felid's relative eye size, and the neck is shortened relative to a panther. **State as derived, never as sourced.** `[no-assert]` | `[D]` |
| **Drogon** | Anatomy **rationalised, then exaggerated**: wyvern morphology because "four-legged dragons exist only in heraldry. No animal that has ever lived on Earth has six limbs." VFX researched bat + eagle, then **widened the wings** to make them large enough to soar and **enlarged the breastbone**, deliberately altering wing-to-body proportion | `[S]` |
| **Ohmu** | Grounded on a single humble real animal — **pillbugs** — then scaled to catastrophic size and multiplied into a swarm. **Exaggeration lives in scale and count, not in shape distortion** | `[S]` |
| **Totoro** | Explicit multi-animal blend: **tanuki + cat** (ears, expression) **+ owl** (chest chevrons, the night call); appearance based on the great horned owl | `[S]` |
| **Haku** | The reference is applied to **MOTION**, not form: Miyazaki directed the injured dragon to cling to the wall **like a gecko**, then fall **like a snake** | `[S]` |
| **WoW house style** | Saturated colour, exaggerated forms, thick lines, **oversized proportions and gear**, broad shoulders, massive hands; hand-painted texture instead of computed detail | `[S, secondary]` |

### §8.3 Silhouette discipline as numbers

| Rule | Number / statement | Tag |
|---|---|---|
| **The blackout test** | Fill the design solid black, delete all interior line; if it stays recognisable and appealing it works | `[S]` — Walt Disney Family Museum |
| Silhouette outranks theme | "Silhouettes are the **single most important thing** for champion recognition" | `[S]` — Riot |
| Silhouette decomposes into ranked parts | primary / secondary / tertiary; **the primary feature may NEVER be removed or significantly altered**, even by skins | `[S]` — Riot |
| One unmistakable primary read per creature | "A good silhouette is one with a **defining primary characteristic** that's unique to that champion" | `[S]` — Riot |
| **Roster-level collision check is a shipping gate** | "making sure the characters were immediately identifiable in the middle of battle. Was their silhouette too similar to an existing character?" Worked example: **Mei's original two-handed weapon collided with Zarya's silhouette → redesigned to a one-handed gun purely to separate the silhouettes** | `[S]` — GDC 2017 |
| Pure-silhouette identifiability as a requirement | "Even when viewed only in silhouette with no internal shading at all, the characters are readily identifiable to players" | `[S]` — Valve NPAR 2007 |
| Negative space counts as much as outline | gaps/holes inside the silhouette define form; "strong, open spaces in a silhouette make action completely readable" | `[S, medium authority]` |
| Smallest size at which a figure silhouette resolves | **32 px** described as the smallest that comfortably renders a clear humanoid silhouette; **64 px** the "balanced default" | `[S, LOW authority]` — the only explicit pixel target found |
| ⚠ "Readable at 32 px" as a **stated studio target for 3D creatures** | **No named studio target found. `unknown`** | — |
| ⚠ Silhouette **occupancy of frame** as a stated % | **No source found. `unknown`** | — |
| Two front-end workflows exist and are not interchangeable | In *The Skillful Huntsman*, only one of the three designers works from **silhouettes**; another works from **thumbnails** | `[S]` |

**MEASURED SILHOUETTE-MASS COUNTS.** ⚠ **All counts are `[D]`** — each design blacked out from its
canonical profile and the separately-pointable lobes counted at ~64 px tall. **No studio publishes
these counts.** `[no-assert]`

| Creature | Masses | What they are |
|---|---|---|
| **Toothless** | **4** | head+neck bulb · barrel torso · paired wing arc (reads as ONE arc) · tail with twin fins. Ear-flaps and the asymmetric prosthetic fin are **tertiary** — the identity tell, not a mass |
| **Ohmu** | **3** | segmented shell dome · eye band · leg/tentacle fringe skirt. **The low-count extreme, and why it reads at any size** |
| **A SotC colossus (Valus)** | **3–4** | block head-and-shoulder mass · columnar torso · leg pillars (one pillar pair in profile, two in 3/4). **Architectural — masses are columns and lintels, deliberately fewer than an animal so scale reads** |
| **Malzeno** | **5** | elongated head/neck · torso · caped wing mass · knife/candlestick tail · long hind-leg pair. **The highest count — a flagship earns a fifth mass because it gets hero framing** |
| **Drogon** | **4** | head+neck S · **chest/breastbone mass (deliberately enlarged)** · wing arcs · whip tail. The enlarged breastbone was added *as a mass*, which is why Drogon reads heavier than a generic wyvern |
| **The Knight** (Hollow Knight) | **3** | horned head · cloak bell · the nail (an asymmetric break of the outline). **The minimum viable count: two masses + one asymmetric protrusion** |

> **DERIVED LAW `[D]`: acclaimed creature silhouettes resolve to 3–5 masses, with 4 as the mode, and
> ONE clearly dominant. A design needing six or more named masses to describe has almost certainly
> become a kit-bash.**

### §8.4 Value-zone counts

| Rule | Number / statement | Tag |
|---|---|---|
| Plan the image in a tiny number of value groups before anything else | squint and assign every shape to **2, 3 or 4** values; **notan is the 2-value extreme**; the common working plan is **3** (light / medium / dark) | `[S]` — Gurney |
| Why so few | limiting values forces grouping into a clearer read; "if the arrangement of the big shapes is strong and coherent… you are **90 percent** of the way there" | `[S]` |
| Focal area gets the widest value range | "the focal point usually having lighter values and **more contrast** to draw the viewer's eye to it" | `[S]` — 80.lv |
| **Diagnosis when colours "clash"** | It is almost always a **value** problem: "check that their values aren't too close together" | `[S]` — 80.lv |
| Value must not be spent evenly | alternate **areas of visual detail** with **areas of visual rest**; contrast-of-detail is a compositional tool on equal footing with contrast of value | `[S]` — Blevins |
| Stylized rendering separates zones with **rim light**, not outlines | TF2 emphasises internal shape "with patterns of value while emphasizing silhouettes with **rim highlights rather than dark outlines**" | `[S]` — Valve NPAR 2007 |
| In premium stylized work, value/light is **painted in**, not computed | Fortiche painted light and shadow directly into textures and **rejected procedural shading / automated lighting** for *Arcane* | `[S]` |
| Hard vs soft terminator is a **form-language** choice | on prismatic forms the terminator follows plane breaks and is crisp; on spheres/cylinders it is soft. Sculptural abstraction = "**making the hard forms harder, and the soft forms softer**" | `[S]` |
| Near-black shadow used deliberately to **carve** silhouette | in SotC "shadows appear in very dark tones, almost black, **defining the silhouette**" | `[S]` |
| ⚠ Stated value-zone **count** on a hero creature by a named studio | **Not found. Nobody publishes "our heroes hold N value zones." `unknown`** | — |

> **The house four-tier law is `[D]`** — consistent with Gurney's 3–4 group ceiling **plus one
> reserved emissive/accent tier**. It matches `DRAGON-DESIGN.md` §3.2 (≥3–4 tiers that READ, check
> the endpoints) and `AAA-PIPELINE.md` §1 (core → bloom → dark + a diffuse ladder). **The reference
> supplies the ceiling, not the count: never more than 4 groups + 1 accent tier.**

### §8.5 Colour and accent-area fractions

| Rule | Number | Tag |
|---|---|---|
| **Dominant / secondary / accent area split** | **60 / 30 / 10** — the accent's power is *entirely* in its scarcity | `[S]` for the rule; ⚠ `[D]` for any attribution to a specific studio |
| Accent is a **focal** device, not decoration | accent marks the element needing emphasis; **scattering it is the failure mode** | `[S]` |
| Saturation is a **rank**, not a paint | "Secondary elements should use color values and **saturation to enhance primary elements**" | `[S]` — Riot VFX Style Guide |
| Saturation/noise is **earned** by gameplay weight | "Spells with big gameplay effects can and should be noisy, **to a degree**" — the explicit exception implies the default is *no noise* | `[S]` — Riot |
| Decay direction for any secondary/trailing element | outros/dissipation = **lower value, lower saturation, lower opacity** than the core | `[S]` — Riot VFX Style Guide |
| Big flat colour beats gradient soup | readable characters have "**huge splashes of color with a single gradient**"; characters lacking that "don't read well" | `[S]` |
| Roughness must differ between adjacent tint zones | "Surface detail and roughness should be **different in each tint area** to the next to help give them further contrast when light moves across them" | `[S]` — Warframe TennoGen |
| ⚠ Stated palette-**size** cap (max N hues per character) by a named studio | **Not found. `unknown`** | — |

**⇒ Accent-area target `[S]`+`[D]`: ~10% of the creature's surface, in ONE or TWO contiguous
places, on the element you want read first.** Six scattered specks at 5% each = delete four. This
is the numeric backing for `DRAGON-DESIGN.md` §6 (glow as components, withheld in cruise) and
AAA §2 #3 (LED strip).

### §8.6 One-design coherence principles

| # | Principle | Anchor |
|---|---|---|
| 1 | **Motif rhyming across ranks.** One shape vocabulary must recur on head, wings and tail | Malzeno's **tail shaped to resemble knives and candlesticks** because the design image was a vampire-noble at a long table with a row of candlesticks — the tail rhymes with the *theme*, not just the body `[S]` |
| 2 | **A single governing real animal, then one twist, then one hook** (70/20/10) | Toothless is panther first, bat second, salamander-eye hook. Light Fury is the same skeleton with the governor swapped `[S]`; ratio `[S, LOW]` |
| 3 | **Detail placement follows function, and function follows habitat** | Capcom: whether a monster needs fur is decided by ecology — brush-like fur exists to make bubbles; a carapace exists to survive the animal's own explosions `[S]` |
| 4 | **Ecology before enemy** | Monsters "weren't treated as mere enemies, but as **part of an ecosystem**"; area concept first, then what would live there and how it would use the air currents `[S]`. (Ties directly to `BIOME-DESIGN.md`'s boss↔biome coupling) |
| 5 | **Material-language consistency, enforced per zone** | Adjacent tint zones differ in roughness — but the *set* of materials must be **small and repeated** `[S]` |
| 6 | **Anatomy is the cornerstone, even for the impossible** | "How anatomy applies practically to the natural history and story is the **prime cornerstone** on which successful creature design hangs, whether the creature is real or imaginary" `[S]` — Whitlatch |
| 7 | **Reference the MOTION, not only the shape** | Haku: cling like a gecko, fall like a snake `[S]`. **A creature reads as one organism when its motion comes from one animal even if its parts don't** — the biological form of `DRAGON-DESIGN.md` §2.13 (motion IS identity) |
| 8 | **Ranked parts with a protected primary** | The primary silhouette feature is **frozen across all variants**; secondaries and tertiaries may change `[S]` — Riot. That is what lets a roster carry skins/tiers without dissolving (cf. `DRAGON-DESIGN.md` §7 tier ladder) |
| 9 | **Reduce until it breaks, then step back one** | Journey's traveller "went from humanoid to very detailed, and back to as minimal as possible" `[S]`. **Coherence is often achieved by deletion** |
| 10 | **The whole-organism naming test** | If you still describe the creature as "a lion-goat-snake", it is stitched; if you can name it as a species, it is whole `[S]` framing `[D]` |

### §8.7 What §8 rules out

- **Uniform scale/plate tiling over the whole body.** Violates form hierarchy `[S]`. **Scale
  frequency must vary ≥2× between muzzle, shoulder and haunch.**
- **Mirrored surface noise.** Any detail below secondary rank appearing identically on both sides
  must be perturbed or removed. (Note the sanctioned exception in `DRAGON-DESIGN.md` §5.5: the only
  legal L/R asymmetry is a **deliberate, named marking** — accidental per-side material differences
  are a bug, not character.)
- **Any spike without a five-word function.** Cap silhouette-breaking spike clusters at **three**,
  all belonging to one motif `[S]`.
- **A smooth fillet where a wing meets the shoulder** — the strongest machine-made tell in 3D `[S]`.
  Every limb root needs an authored transition (crease/plate/insertion). Already
  `DRAGON-DESIGN.md` §2.5.
- **Full-perimeter rim glow or chrome outline as the primary read** `[S]`; already AAA §2 #4.
- **Accent colour over more than ~10% of surface, or in more than two contiguous places** `[S]`.
- **Purely soft shading.** Each hero element needs **at least one hard terminator on a struck
  facet** `[S]`.
- **A midtone-only palette.** The render must hold **3 clearly separated value groups** and a
  genuine dark tier in the bottom ~15% of range `[S]`.
- **A six-mass silhouette** — violates the 3–5-mass law (§8.3). Absorb one mass into another.
- **A part that could be swapped without changing anything else** — the literal definition of a
  background-creature generator `[S]`. At least one shape motif must appear on head, wing and tail.
- **A silhouette that collides with a shipped roster member at 64 px** — fix by changing a
  **PRIMARY** feature (neck length, wing arc, limb count), **never** by adding tertiary decoration
  `[S]`.
- **Detail authored before the primary form is signed off** — the blockout must read *better*
  without detail than with it, before detail begins `[S]`.
- **Exaggeration that breaks joint logic.** Believability, not realism, is the ceiling: push
  proportion as hard as you like — Drogon's breastbone was enlarged and wings widened on purpose —
  but **every joint must still bend the way the governing real animal's joint bends** `[S]`.
- **"One accent, one gradient, done" colour thinking with no value plan underneath.** Value is
  diagnosed before colour `[S]`.

### §8.8 Field Notes (NON-NORMATIVE)

- **The studio canon worth analysing shot-by-shot, and who actually published doctrine `[S]`:**
  **Yes, strongest** — Riot (Clarity in League + the public VFX Style Guide PDF), Valve (the NPAR
  2007 paper — the only peer-reviewed paper on stylized character readability), Blizzard/Overwatch
  (GDC 2017), Warframe TennoGen (**the only official studio guide found that states form-hierarchy
  ratios numerically to outside contributors**), thatgamecompany/Journey (GDC 2013), Capcom/Monster
  Hunter (IR features + Malzeno making-of), Fortiche/Arcane (interviews), Whitlatch (books),
  Blevins (free art_lessons — **the most-cited free source of numeric form-hierarchy rules in 3D**).
  **Partial** — DreamWorks/HTTYD (3 art books, text not online), Blizzard/WoW, Ghibli, Team Ico,
  Pixomondo/GoT, Supergiant, Team Cherry.
  ⚠ *Art of HTTYD*, *Art of Overwatch*, *Art of Journey*, *Science of Creature Design* are **canon
  available but NOT READ** — their claims here come from interviews and reviews that quote them.
- **Deliberately demoted `[S]`:** generic "shape language" content-farm articles. They restate
  circle/square/triangle psychology with no source and no numbers. Do not cite them.
- DreamWorks generated *background* dragons from a mix-and-match kit of crowns/spikes/claws/wings —
  **the hero dragons were not.** "Heroes must fail the kit test" is the operative phrasing.

---

## §9 The generic-tell registry

**MERGE, DO NOT DUPLICATE.** `AAA-PIPELINE.md` §2 is the owner-calibrated cheap-tell registry and
remains the authority for everything it covers. `DRAGON-DESIGN.md` §2 owns the shape failure modes.
**This section adds only the tells those two do not carry, and gives a one-line pointer for the
ones they do.** Run all three as one checklist.

### §9.1 Already covered — pointer only, do not re-litigate

| Tell | Owner |
|---|---|
| Flat tape (constant-width bright caps) · LED strip / neon sign · Onion rings / hard diamond · White smear · Washed fringe · Metronome FX · On-body "arcs" · Sparkle-as-line · Thin thread from the chase cam · Flat single-value sails | `AAA-PIPELINE.md` §2 #1, #3, #5, #6, #7, #8, #9, #10, #11, #12 |
| Chrome outline / full-perimeter rim replacing form | `AAA-PIPELINE.md` §2 #4 |
| Picket fence (equal spikes at equal pitch) | `AAA-PIPELINE.md` §2 #2 + `DRAGON-DESIGN.md` §2.4 — **anatomical proof in §6.3 of this file** (nature builds dominant + decay, and the one comb-like system is documented unequal *and* bilaterally asymmetric) |
| Midtone mush / no value plan / flat even ambient light | `AAA-PIPELINE.md` §1 — **numeric backing in §8.4 (3–4 groups max) and §7.6 (the painters' fractions)** |
| Melted / blobby joints; a wing growing out of a shoulder as a smooth fillet | `DRAGON-DESIGN.md` §2.5 (bolted-on wing) + §2.2 (stick limb) |
| Plane / delta-kite wing · paper-thin flat blade · severed appendage · landing-gear leg · stacked-rings loft · sawtooth membrane · photocopied motion · 1-bone plank | `DRAGON-DESIGN.md` §2.1–2.13 |

### §9.2 New generic tells — TELL → 30-SECOND KILL CHECK

| # | TELL (spottable in a still) | 30-SECOND KILL CHECK | Provenance |
|---|---|---|---|
| G1 | **Flat detail histogram** — every panel, scale, spike and plate is roughly the same size, so nothing ranks | Measure the three largest detail elements. The biggest must be **≥2×** the next tier, and tertiaries **≈30%** of their parent secondary. Flat histogram → delete a whole tier | `[S]` §8.1 |
| G2 | **No focal point / no areas of rest** — detail and contrast spread uniformly | Point at the single highest-contrast square inch. If you can't, or if there are five, there is no focus. Then: is **≥~1/3 of the surface deliberately quiet**? | `[S]` §8.4 |
| G3 | **Symmetrical noise** — left and right carry identical detail, including the "random" bits | Mirror-flip the render and overlay. If the noise layers register, break one side with an **authored** asymmetry (scar, damaged horn, differently-folded wing) — never sprinkled | `[S]` §8.7 |
| G4 | **Spikes-everywhere greebling** — decoration substituting for design | For every spike, name its **function in five words** (defence line, thermoregulation, display, wing strut). Unjustified spikes get deleted. Silhouette-breaking clusters **≤3**, all on one motif | `[S]` §8.6.3 |
| G5 | **Every curve the same radius** — the animal drawn with one arc, reads as extruded tube | Overlay three circles: tightest and widest body curve must differ by **≥3×** in radius. Every long curve needs an opposing straight on the other edge of the same limb | rule `[S]`, 3× `[D]` §8.1 |
| G6 | **Chimera stitching** — head, wings and tail from three animals with no shared skeleton | Trace the **spine** through the whole animal in one stroke; check every joint bends the way it does on the primary reference animal. **If one part could be swapped without changing anything else, it isn't part of the design** | `[S]` §8.6.6 |
| G7 | **Airbrushed shading with no planes** — light dies into a haze instead of turning a corner | Find **one hard terminator on a struck facet**. If every transition is a soft ramp, the form has no planes. Hard forms harder, soft forms softer — never uniformly soft | `[S]` §8.4 |
| G8 | **Accent scattered instead of focal** — the hot hue appears in six places at 5% each | Mask the accent hue: it must cover **≈10%** and sit in **one or two contiguous places**, on the element read first | `[S]` §8.5 |
| G9 | **Silhouette is an oval with fringe** — blackout gives a blob whose only interest is edge noise | Blackout at ~64 px tall and **count masses. Target 3–5, one dominant.** If the answer is "one oval plus fringe", rebuild the primary form — **do not add more fringe** | count `[D]` §8.3 |
| G10 | **Tangent blending** — separate elements *kiss* without crossing (horn merges into wing edge, tail into leg) | Look for any two silhouette edges that touch without crossing. Move one a few degrees so they clearly overlap **or** clearly separate. Never tangent | `[S]` §8.7 |
| G11 | **One-frequency texture motif** — the same scale/plate pattern tiles the whole body at one size | Compare scale size at **three** body zones; they must vary **≥2×** (fine at the muzzle, coarse over the shoulder, near-plate on the haunch). Uniform frequency = machine output — **and on a thermal creature it also throws away the free heat-dose story** (§7.7) | `[S]` §8.7, §7.7 |
| G12 | **Roster silhouette collision** — the new creature reads as an existing one at distance | Blackout the new design next to **every** shipped one at the same height. If any pair is confusable in 1 second, change a **primary** feature (limb count, wing arc, neck length) — never a tertiary one | `[S]` §8.3 |
| G13 | **Detail authored before form** — surface noise over a blockout that never resolved | Hide all tertiary detail and look at the sculpt. **If it doesn't read *better* without the detail, the detail was hiding a bad primary** | `[S]` §8.1 |
| G14 | **Modular kit smell** — the creature reads as parts snapped onto a rig | Does *any* shape motif appear on **≥3 ranks** (head, wing, tail)? If the parts share no repeated shape, you have a background-creature generator. **Heroes must fail the kit test** | `[S]` §8.6.1, §8.8 |
| G15 | **Equal-width bays / equal-pitch struts inside a membrane** | Measure the inboard bay against any outboard bay: inboard should be **~2×** (armwing ≈52% vs handwing ≈39% vs propatagium ≈9%). Equal bays = plane wing | `[D from S]` §4.2 |
| G16 | **Symmetric, view-independent seam or vent glow** — the emissive reads the same from every angle | Bank the creature 40° and re-shoot. A slot of depth `d` self-occludes (visible floor only within **±atan(w/2d)**), so **the two lips are never equally lit**. If nothing changes, it is a painted stripe | `[D from S]` §7.4 |
| G17 | **Uniform-width, single-generation crack/seam network** | Count generations. Real networks are hierarchical: **G1 6–10w / G2 2–3w / G3 1w**, counts rising 4–8 → 20–40 → 120–300. One width = decal | `[S]` §7.3 |
| G18 | **Settled hexagonal seam tiling** — 120° Y-junctions dominating | Sample junction angles: **≥60% must be ~90° T; ≤15% at 120°.** 120°-dominant reads as dead columnar basalt or sci-fi honeycomb | `[S]` §7.3 |
| G19 | **Neutral-black dark field** — char/shadow at R=G=B=0 | Sample the darkest pixel. Floor is **linear 0.020–0.045 (sRGB ~38–58)**, tinted **cool** (B ≥ R by 4–8 units). `#000000` is below the physical floor and kills the ember's complement | `[S]` §7.6 |
| G20 | **Blue creeping into a thermal ramp** | Probe the emitter cross-section: **R ≥ G ≥ B at every sample**, hue monotonically decreasing outward. **B > G anywhere flips the read from furnace to plasma** | `[S]` §7.2 |
| G21 | **Lit-face repetition** — a repeated element lit across its whole face | The bright part must be the **RIM or TIP over a dark face** (`DRAGON-DESIGN.md` §6.4, coal-not-torch). This file's §7.4 gives the numbers: core:rim:field ≈ **30:20:1**, saturation peaking **one to two steps below** the brightest | `[D from S]` §7.4, §7.6 |
| G22 | **Head glued on a tube** — the neck meets the skull at the back of its mid-height | Check the profile for a **STEP**: skull roof high → drop → neck dorsal line lower. The occipital condyle is **ventral and caudal**, so the occipital mass must **overhang** the junction | `[S]` mechanism, `[D]` craft, §6.6 |
| G23 | **Eye-as-nostril** — a mid-height lateral eye on a long snout | Move the eye to **y ≈ 0.70–0.85 of skull height** and cap it with a brow shelf. At mid-height it is geometrically indistinguishable from a nostril | `[D]` §6.4 |
| G24 | **Cruise pose with no silhouette contribution from the limbs** | Look at the rear-chase frame only. A tucked leg is 100% occluded; a trailing leg hides inside the tail's outline. Only an **abducted** leg puts geometry in the wedge between wing trailing edge and tail | `[D from S]` §3.3 |

---

## §10 What the research rules out

Merged and deduplicated across all sections. Each entry cites the section carrying its evidence.

| Failure class | The ruled-out list | § |
|---|---|---|
| **Reads as the WRONG TAXON** | Any forelimb separate from the wing, or wings hinged off the dorsal spine, on a 4-limb creature · rampant/segreant poses, mammalian grabbing forepaws, or a four-point landing on a biped · comb, wattle, beak, rooster feet, or contrast-tinctured head furniture (→ cockatrice) · a second head or head-like tail terminus (→ basilisk) · vestigial wings (→ lindworm) · lost legs (→ amphiptere) · a body so long the legs vanish (→ wyrm) · fur, a leonine head, or a feathered ruff (→ WoW collision) · paired horizontal tail fins (→ Toothless) | §1.7 |
| **Reads as a BIRD** | Span:torso > 9 with a short/absent free tail · a deep protruding keel blade · >~10 visible neck joints or resting chord:arc < ~0.7 · a fanned aerodynamic tail · legs trailing straight aft in cruise · femur < 0.6 × torso on a flyer · feathered/slotted outer wing on a membrane creature · AR 4.5–6 with a high beat rate · beat frequency > ~2 Hz at cruise for a large creature · continuous cruise flapping · folding the wing tidily above the back | §2.8, §3.5, §4.7, §5.6 |
| **Reads as a BAT TOY** | Span:torso ≈ 4–5 with a rounded plush torso · membrane unbroken to the ankle with no free tail · knees pointing up/backward · hindlimbs shorter than the torso and stick-like · big pinnae | §2.8 |
| **Reads as a PLANE / KITE / PAPER DART** | AR > 12, near-constant chord, or no spanwise thickness change · a constant-cross-section fuselage torso · a rigidly held cruise dihedral · flat zero-camber membrane · deepest sag at mid-chord or the TE · fixed membrane shape across all speeds · perimeter-only tensioning with no internal reinforcement · equal-width bays · straight LE + straight TE · zero interior knuckles · a single spar with no propatagium · a taut straight TE · a rigid non-deforming wingtip · rippling the **leading** edge · AR < ~4 with a taut membrane | §2.8, §4.4, §4.7, §9.2 G15 |
| **Reads as a GENERIC LIZARD** | Sprawled limbs with a horizontal femur on a creature that must launch · a uniform field of small keeled scales as the primary surface read · a monotonically tapering tail at max width at the hip · a neck carried straight and horizontal at spine height · equal-thickness fore and hind limbs | §2.5, §2.8, §3.5 |
| **Balance and motion LIES** | Deriving tail length from torso by rule · a heavy tail with a sub-horizontal bird femur (or the inverse) · a short femur on a creature that must both fly and stand · blending cruise leg poses moment-to-moment · a tucked cruise leg on a rear-chase creature · metronome beat intervals · a frozen glide-hold · symmetric down/upstroke with equal span · an L/R phase offset for banking · "fixing" an invisible fold with amplitude instead of axis · quoting τ = 0.55 as a fact | §2.4, §3.5, §5.4, §5.6, §9.2 G24 |
| **HEAD failures** | The flat boxy crocodile skull as a base profile · crocodile profile + bolted-on horns (a *composition* failure) · the full recurved beak · forward-pointing horns as the primary read · equal-pitched picket crests · owl-style giant frontal eyes · eyes at mid-face height with no brow · convergence at primate/owl extremes · a crocodile-band gape (18–32°) for an attack · a dished/concave profile on a heavy creature · a full dentition of uniform teeth · a flexible owl-like junction on a heavy head | §6.3, §6.6–6.8, §9.2 G22–G23 |
| **HOT-MATERIAL failures** | Any point where B > G · a blue-white authored core · B > 0.4·R with G < 0.6·R · authoring the core at your target hue · non-monotonic hue outward · pure neutral black char · >~3% of screen area clipped white · peak saturation at the brightest pixel · 120°-Y-dominant seam tiling · a single-generation uniform-width seam net · aa-clinker rubble as a primary surface · closed loops at the finest generation · symmetric view-independent seam glow · uniform plate scale across the body · screen-space distortion / refraction / grab-pass · volumetric smoke or heat · thousands of tiny embers · full-screen additive hot-air cards · relying on tight neutral bloom as the whole halo | §7.9 |
| **CRAFT failures** | Uniform scale/plate tiling · mirrored surface noise · any spike without a five-word function · a smooth fillet at the wing/shoulder · full-perimeter rim glow as the primary read · accent over ~10% or in >2 contiguous places · purely soft shading with no hard terminator · a midtone-only palette · a six-mass silhouette · a part swappable without changing anything else · a silhouette colliding with a shipped roster member at 64 px · detail authored before the primary form is signed off · exaggeration that breaks joint logic · colour thinking with no value plan underneath | §8.7, §9.2 G12 |

---

## §11 Source ledger

The audit trail. Body tables stay clean; provenance lives here.

### §11.1 `[S]` — sourced figures, by section

| § | Figures | Source |
|---|---|---|
| §1.1–1.3 | Two-legs rule; the dragon/wyvern limb split; the "wings addorsed" default; Tudor smooth blunt tail; "the barb is a comparatively recent addition"; attitudes available/unavailable | Fox-Davies, *A Complete Guide to Heraldry* (1909) ch. 13 & pp. 257–259 (Wikisource/Gutenberg); heraldicart.org; SCA West Kingdom heralds; Parker's Glossary; britishcrests.com; Mistholme |
| §1.1, §1.3 | "Partake of a Fowle in the Wings and Legs… resemble a Serpent in the Taile"; 1610 as the anchor date; `wyver` c.1374 (Chaucer); `wivre`←`vipera`; the unetymological `-n` | Guillim, *A Display of Heraldrie* (1610) via OED; OED *wyvern, n.* / *wyver, n.*; Etymonline |
| §1.1 | Cockatrice = wyvern + rooster head/legs; basilisk = + tail head; lindworm; amphiptere (with the internal conflict); drake/wyrm; the WoW name collision; "never intended to be used that way" | Fox-Davies p.259; Wikipedia *Cockatrice/Lindworm/Amphiptere*; heraldic glossaries; Warcraft Wiki |
| §1.3 | Nowed/barbed/pointed vocabulary; the Aberdeen-Bestiary tail-as-club logic; Bayeux legless standard; D&D stinger text | Parker's Glossary; medievalbestiary.ca / Aberdeen Bestiary; Bodmin Keep; British County Flags; D&D 5e MM / D&D Beyond |
| §1.3, §1.4 | Rathalos/Rathian tail morphology and function; ARK ballast fin + variant coding + "no forelimbs" + bat/condor comparison; Toothless prosthetic mechanics and the panther origin; Drogon's Pixomondo research (chicken wings, bats "crawl into the air with their fingers", gorillas, 747s); Smaug's 4→2 limb change | Monster Hunter Wiki; CBR; ARK Official Wiki; HTTYD Wiki; IndieWire; Thrillist/Animation Mentor/Forbes on Pixomondo; GamesRadar; fxguide |
| §1.4 | Fire Emblem's mostly-6-limbed "wyverns"; Century: Age of Ashes mounts | Fire Emblem Wiki; Wikipedia; Pro Game Guides |
| §1.6 | Bat digits II–V + free clawed thumb; pterosaur digit IV only; "bat wings are truly specialized hands"; rigidity-determined pterosaur geometry | Tokita 2015 *Biological Reviews*; Ichthyoconodon; MUN Biology |
| §1.8 | 43rd (Wessex) Division gold-on-azure badge (1935); Leicester argent crest (1619); Venables gules crest; the 19th-c. popularisation by E. A. Freeman; plague/Satan bestiary associations | IWM; Bodmin Keep; Heraldry of the World; leicester.news; Parker's Glossary; Monstropedia |
| §2.1 | torso ≈ 1.33 × humerus and 65–75 cm at 10 m span; *Q. lawsoni* element lengths (humerus 23–25, r/u 36–39, mcIV 46–47, femur 33–38, tibia 55–60 cm); C3–C7 ≈ 149.5 cm; metre-long skull; 2–2.5 m shoulder height, parasagittal gait; *Pteranodon* tail = 3.5% of span, AR 9:1; *Arambourgiania* C3–IX 3071 mm | Witton blog (2013) citing Witton & Habib 2010; Andres & Langston et al. 2021, *JVP* Memoir 19; Bennett 2001 via secondary; Steel et al. 1997 |
| §2.2 | *Pteropus* spans, head+body, forearm, mass; forearm 50–65% of head-body; wing ≈ 4× leg; 180° hip rotation; shorter/slenderer tibia; fused vestigial fibula; forelimb–hindlimb integration "inhibits ecological adaptation"; *Desmodus* highest wing loading | Animal Diversity Web accounts; earthlife *Bat Anatomy 101*; Stanchak & Santana 2018; Nat. Ecol. Evol. 2024; Chilean bat biomechanics review (ref. Norberg & Rayner 1987) |
| §2.3, §2.7 | California condor 70.6 N/m²; *Argentavis* 84.6 N/m², 8.11 m², 70–72 kg, glide ~3°, cruise 67 km/h, "too large for continuous flapping or standing takeoff"; 41 kg / 5.1 m soaring limit + exponents; albatross ~12 kg realized; species spans/masses | Chatterjee, Templin & Campbell 2007 *PNAS*; Sato et al. 2009 *PLoS ONE* 4:e5400; ADW; Britannica |
| §2.3, §2.6 | Larger birds have **shallow** keels; deeper keels ↔ slower stronger flight; pectoralis 8–17% + supracoracoideus 2–4%, total ≤25%; supracoracoideus ≈ 1/5 pectoralis | Deeming 2025 *J. Anat.*; Deeming 2023 *J. Zool.* |
| §2.6 | Pterosaur pectoral 20–25% (~50 kg in 200–250 kg); the 30–40% outlier; shallow sternum + "thin sternal plate with a sternal crest"; no supracoracoideus pulley; distributed muscle base; quadrupedal-launch smaller torsos | Witton 2018 blog; ResearchGate abstract (outlier); pterosaurnet; Palaeo-Electronica 2023; PMC5548695; Witton & Habib 2010 |
| §2.6 | **Habib's asymmetry** — pterosaur humeri stronger than femora, increasingly so with size; birds the reverse | Habib 2008, *Zitteliana* B28:159–166 |
| §2.4, §3.1 | COM 30–45% of femur length (Sue 44–61%, "Jane" 30–35%); caudal COM shift with age | Hutchinson, Bates, Molnar, Allen & Makovicky 2011, *PLoS ONE* 6:e26037 |
| §2.4, §3.2 | "Little or no consistent relationship between tail length and snout–sacrum length"; the caudal centra-length pattern at the caudofemoralis attachment | Hone, Persons & Le Comber 2021, *PeerJ* 9:e10721 |
| §2.4 | *Allosaurus* femur 103.0 cm / tibia 74.7 cm; skull 845 mm at 7.9 m; *Deinonychus* foot:tibia 0.48 and the overestimated femur; tyrannosaurid distal-limb proportions | Madsen 1976 via psdinosaurs; G. S. Paul via secondary; Ostrom 1976 via DinoGoss |
| §2.4, §3.2 | Crouched bird vs upright theropod posture; the *Daspletosaurus*→*Troodon*→chicken gradient; **artificial-tail chickens → more vertical femur** | Grossi et al. 2014, *PLoS ONE* 9:e88458 |
| §2.5 | Komodo specimen SVL 93 / head 18 / tail 107.8 cm / 30 kg; skull ≈15% SVL; adult and hatchling sizes; horizontal humerus+femur sprawl; climbing vs terrestrial posture; absent dorsal trunk osteoderms; cephalic osteoderm shield; keeled dorsal scales and scale-surface types | PMC11311070; *V. komodoensis* digital dissection; komodoguide/locomotion review; Cieri et al. 2020 *J. Anat.*; ScienceDirect *Varanus*; Maisano et al. 2019 *Anat. Rec.*; *V. salvator* accounts |
| §2.7 | Witton 2008 mass regression (35 g–259 kg; *Anhanguera* 15–23 kg); Henderson 2010's 544 kg; the *Pteranodon* 20–93 kg spread | Witton 2008; Henderson 2010; Witton & Habib 2010 |
| §3.3 | The extended/flexed hindlimb dichotomy and its taxonomic distinctness; slow-fibre physiology; tuck = drag reduction, extend = air brakes; osprey strike; bat ankle oscillation with the wingbeat; bat tail-membrane flight control; the pterosaur uropatagium debate | Walker & Meyers, *J. Morphol.* 269 (2008) & *J. Anat.* 234 (2019) + SICB abstract; IERE; Hawk Mountain; Cheney et al. 2014 *PLoS ONE* 9:e98093; Gardiner et al. 2011 *PLoS ONE* 6:e18214; Witton 2015; Hone 2025; SciELO uropatagium review |
| §3.4 | Pterodactyloid cervical count 8–9; "slightly sinuous" resting neck; azhdarchid 9 cervicals + helical cross struts; *Hatzegopteryx* short-necked reinterpretation; bird 11–25 (14–15 typical) + the resting S; heron in-flight retraction; crane/stork extension | Witton 2013 blog; Marinho et al. 2024 *PeerJ* 12:e16884; Naish & Witton 2017 *PeerJ* 5:e2908; PMC8101050; Britannica *Bird: Skeleton*; Cornell Lab; IERE |
| §4.1 | Bat 4-digit fan vs pterosaur single digit IV; proximodistal bone gradient; Norberg mechanism + occipitopollicalis; pteroid + propatagium (and the medial-orientation finding); actinofibrils 0.05–0.2 mm in up to 3 cross-oriented layers; >2/3 wing-length share; umbrella fold with digit III folding over | Bell & Chiappe / wing-structure comparisons; Ma et al. *Anat. Rec.*; Norberg 1969 (JSTOR); JEB bat-flight review; Palmer & Dyke 2010 *Proc. R. Soc. B*; Historical Biology; Palaeo-Electronica 2023; Britannica |
| §4.2 | Region names and bounds; propatagium ~9% of lift/area; armwing generates ~31% more than handwing; region functional roles; uropatagium fanned through up to 135°; the open propatagium-depth parameter | Animal Diversity Web (Univ. Michigan); arXiv 2501.02034; PLOS One (tail-membrane thrust); Palmer, pterosaur wing aerodynamics |
| §4.3 | LD3/FL and LD5/FL indices; D5 high in slow manoeuvrable bats; distal-increasing elongation; 50-My-stable digit proportions; *Rhamphorhynchus* mcIV 148 mm and phalanges 138/112/79/67 mm | bat morphometrics refs; ADW; Sears et al. 2006 *PNAS*; PMC4548500 |
| §4.5 | Camber 0.14 c hovering → 0.04 c at 7 m/s; 15–20% engineering optimum; 0.26–0.30 c under high load; deepest sag ~40% chord; the four bat camber controls; plagiopatagiales proprii; TE scalloping/divergence/flutter; flutter onset at stiffness ~0.05; the 66%-faster fibre-reinforcement result; AR/WL for *P. samoensis* and *P. livingstonii*; Megachiroptera scaling laws; hang-glider AR and WL; the AR→read bands | von Busse et al.; Biology Open (*Leptonycteris*); JEB 2022; membrane-aeroelasticity reviews; *J. R. Soc. Interface* 2023; ADW/Norberg et al. 2000; Norberg & Rayner 1987 via secondary; Wikipedia glider specs; Science Learning Hub |
| §4.6, §5.4 | Umbrella fold; wrist-driven folding + elbow retraction + handwing supination; span ratio lower at low speed; upstroke wing-clapping; 3 fold stations + per-finger DoF | Britannica; bat/bird folding refs; JEB / Biology Open; *J. R. Soc. Interface* 2025; bat-wing robotics modelling |
| §5.1 | f ∝ √(m/S) universal scaling; birds M^(−1/6); bats M^(−0.26); Bullen & McKenzie predictive equation; 4–13 Hz species maxima; *P. livingstonii* 2.2 Hz, *P. seychellensis* 3.2 Hz; shearwater 7.5→4.2 Hz; Strouhal 0.25–0.35 and the bat excursion above it; *Glossophaga* St values | PLOS One 2024 universal scaling; JEB (both scaling papers); Bullen & McKenzie 2002 *JEB*; Hedenström et al. 2006 *JEB*; *J. R. Soc. Interface* 2023 |
| §5.2 | Condor 1% / >75% at take-off / 5 h / 172 km / ~2 s per km; albatross 1.2–14.5%; stork ~17% + 30 s bouts + 10–60 s gaps; ibis 5.9–10.5 s irregular glide recurrence; swift 36/64 + 15%; starling ~20% gliding + 11% saving + 0.5 s glides; griffon vulture HR; pelican wave-slope soaring | Williams et al. 2020 *PNAS* + Vulture Conservation Foundation; *J. Ornithology* 2022 + Frontiers 2022; PLOS One 2014; PNAS wave-slope soaring; Audubon |
| §5.4 | Bat stroke amplitude 90–150°; pigeon shoulder 65.25°→−17.33° and ~50° forward sweep; τ speed-invariant in bats; span-ratio definition | Bullen & McKenzie 2002; Biomimetics 2024; Hedenström (*Glossophaga*); JEB/Biology Open |
| §6.1–6.2 | Arabian dished profile; roman-nosed breeds; chameleon casques; Komodo blunt pyramid; longirostrine ≥2× definition; Nile croc W/L 0.47–0.54 and H/L 0.25–0.35; head ≈1/7.4 TL; the eye-nostril field rule; *C. thorbjarnarsoni* 85 cm ↔ 6.2–6.5 m; Komodo skull dims; Sue's 1.53 m skull; eagle skull dims and cranium lengths; hornbill casque = half the bill, 10% of body weight | Equine Helper / Horse&Rider / PubMed morphometrics; Wikipedia (veiled & Jackson's chameleon); *V. komodoensis* digital dissection; *Zool. J. Linn. Soc.*; Skulls Unlimited / Bone Clones; Sciencing / Carolina Sportsman / FWC; Paleonerd01; Field Museum / Britannica; Nature-Watch / Dimensions.com / RBCM; Encyclopedia.com *Bucerotidae* |
| §6.2, §6.4 | Orbit Ø ≈ 0.20 × skull length, negatively allometric, carnivores smaller-eyed; T. rex keyhole anteriorly-directed orbits; T. rex binocular field 45–60°; tawny owl 48°; short-toed eagle 20°; red-tailed hawk 33°; Cooper's hawk 36°; pigeon 27°/130°; crocodilian <25° + dorsal orbits; cat ~140°; dog 30–60°; horse 55–65° (some 70–80°); human 107.1° / primates 85–115°; owl eyes 50–70% of skull volume; owl 270° via 14 cervicals; the palpebral "eagle eyes" prong | JVP 2024 orbit study + Birmingham release; Stevens 2006 *JVP*; Martin (tawny owl, pigeon); PLOS ONE *Hawk Eyes I*; Dallas Zoo walkSTEM / ScienceDirect parietal eye; dvm360; Veterian Key; *Sci Rep* orbital morphology; BTO / IntechOpen; BirdNote / Live Science / Smithsonian; Wikipedia *Palpebral (bone)* / *Cariocecus* |
| §6.3 | Nyctosaurus crest ≈3× skull, spars 42/32 cm; Pteranodon bimodality and the two crest forms; *Tupandactylus navigans* >5× skull height + keratin sheath (and *Tapejara wellnhoferi*'s absence of one); Torosaurus frill ≈50% of skull, Triceratops skull ≈1/3 body; **Styracosaurus 7-vs-8 epiossifications, p3–p6 asymmetric**; bovid horn allometry and forms; white rhino horn 150–166 cm vs 76 cm skull, woolly rhino 164.7 cm/9 kg; veiled chameleon 5 cm casque; Jackson's three rostral projections + small posterior crest; hornbill casque trabeculae + 8× keratin; cassowary casque thermal-window behaviour; Carnotaurus 15 cm brow cores; Ceratosaurus nasal horn + two brow bumps | Bennett 2003 *PalZ*; Bennett 1992 *JVP* (abstract only); Everything Dinosaur (2021 specimen); Britannica / DinoPit; ScienceDirect *Styracosaurus* asymmetry paper; PMC bovid allometry / ScienceDirect *Horn*; Save the Rhino / A-Z Animals / *J. Zool.* 2025; Wikipedia; PMC *J. Anat.* hornbill; *Sci Rep* 2019 cassowary; Dinopedia; NHMU Utah |
| §6.5–6.7 | Cat 65–80° / lion 65°; *Smilodon* ≈120°, machairodonts 100–130°; Nile croc basking 26±1° (18–32°); snake gape ceilings; avian prokinesis/rhynchokinesis; occipital condyle position and species variation; heron C6 elastic hinge; owl 14 cervicals + 10× foramina; hornbill C1–C2 fusion; pelican mandibular-rami bowing + translucent pouch tissue; frigatebird ~20 min inflation; raptor tomia + falcon tomial tooth; low-poly silhouette-first doctrine; Smaug's serrated recurved teeth with gold in the enamel | *Anat. Rec.* 2025 + PLOS ONE saber-tooth biomechanics; Nile-crocodile gaping study; Jayne 2022/2023 scaling papers via secondary; *Biol. Lett.* 2023 + kinesis review; IMAIOS / Kenhub; Audubon / *Integr. Organismal Biol.*; BirdNote / Live Science / Smithsonian / BTO; Encyclopedia.com; *Acta Biomater.* pelican gular; Wikipedia *Gular skin*; LafeberVet / Peregrine Fund / Infinite Spider; Pixune / RetroStyleGames; Riot clarity + 80.lv; Wētā Workshop |
| §6.9 | The rostral/rostroventral fleshy-nostril rule in all extant diapsids | Witmer 2001, *Science* |
| §7.1 | The full red-heat/white-heat scale; the daylight caveat; blackbody hexes at 1000/2000/3000 K and the 6500/8000–10000 K behaviour; Helland's K→RGB approximation; Kīlauea vent ~1,170 °C; USGS incandescence bands; ~1,480 K core after 30 months; forging 760–1,100 °C; temper colours 220–300 °C | Wikipedia *Red heat* (Stirling 1905, Chapman); anvilfire.com; vendian.org (M. Charity); tannerhelland.com; Firgelli; Wien's-law refs; USGS HVO; knifemaking.com; MachineMFG / BSSA |
| §7.2 | Blue = CH/C₂ chemiluminescence, yellow = incandescent soot, the cone/envelope anatomy; R/G/B behaviour across 1000–2500 K; ACES notorious-six hue skew and path-to-white; additive desaturation and the additive+alpha fix; filmic tonemapper behaviour | ScienceABC / BiologyInsights; vendian.org; Bram Stout / ACESCentral / Chris Brejon; RealTimeVFX / GameDev.net; Unreal Filmic Tonemapper docs |
| §7.3 | T-junction sequential vs Y-junction matured cracking; 90°→120° drift under cycling; clay-state bias; spacing ≈ 10 × thickness; two critical thicknesses; column width ∝ 1/cooling rate; hierarchical generations; Giant's Causeway 38–51 cm, Devils Postpile 1.1 m; lava-lake plate dimensions and 5–10% foundering; aa clinker 1–10 cm; alligatoring scale/dose relationship; craquelure 20–300 µm; the 0.5×10⁻⁶/°C glaze mismatch threshold | arXiv 1211.6762; Goehring & Morris 2008 *JGR* + EPL 2005; ResearchGate wetting-drying study; Soft Matter 2011 + arXiv 1412.2842 + arXiv 2606.03473; Volcano World / NPS / Britannica; USGS HVO 2016 lava-lake report; geologybase.com; Blazestack + Springer *Fire Science Reviews*; ScienceDirect (Chinese glazed ceramics) |
| §7.4–7.6 | Charcoal albedo 0.04 (3–5%) and the sRGB 30–50 floor + the specular-vs-diffuse correction; lava-photography exposure practice (f/2.8, ISO 3200, 8 s); veiling glare + GSF + measured 0.187% VGI; bloom neutral vs halation red-orange; dual-Kawase pyramid radius independence; Wright's two light sources and the night-piece construction; Turner's palette clash and molten corridor; Frazetta's focal-contrast decay | racoon-artworks / Adobe Substance docs; VisualWilderness / Astralis / pictureline / LoadedLandscapes; Talvala et al. 2007 + Imatest + Koren EI2018; VSCO / Dehancer; Intel blog / LearnOpenGL; Tate *An Iron Forge* + *The Blacksmith's Shop*; Tate/Cleveland/Philadelphia Turner material + eclecticlight.co; sirspamdalot / Lines and Colors |
| §7.7–7.8 | Ash as a value-lifter; wire-brushed charred wood; temper-colour table; scale-size-encodes-dose; the Balrog's two paint systems; refract/GrabPass cost and tile-based render-target resolve; mobile 150–300 and desktop 500–800 particle budgets; "fewer particles with strong silhouettes"; emitter complexity drivers; layered fire composition | God of War Wiki; Extreme How-To; MachineMFG / BSSA / ASM; Blazestack; Weta / Monster Legacy; Valve Developer Community *Refract*; Unity ShaderLab GrabPass; Samsung Developer tiling article; Animatics GPU-particles guide; Unreal VFX Optimization Guide; Gamine |
| §7.10 | Mustafar's physical model + methylcellulose + Etna footage; Weta dismissing CG fire; Smaug's fire starting from the internal chest/neck glow; DOOM's 3072 clusters / 256 lights per cluster; Muspelheim's ash-over-lava | AWN (*Revenge of the Sith*, *Weta Breathes Fire*); Monster Legacy / CGW; Adrian Courrèges DOOM graphics study; 80.lv *idTech 666*; God of War Wiki |
| §8.1–8.6 | Blevins 70/30 and the 30% tertiary; Warframe 2:1 per layer, build order, detail-last; the hybrid 70/20/10 (low authority); "straights against curves" as an animation tradition; "a caricature of realism"; the believability/functional-logic ceiling; the blackout test; Riot's silhouette primacy + ranked parts + protected primary; the Overwatch collision gate and the Mei/Zarya redesign; Valve's silhouette-identifiability requirement; the 32 px / 64 px pixel targets (low authority); Gurney's 2/3/4 value groups; focal contrast; value-diagnosis of clashing colour; areas of detail vs rest; TF2 rim-over-outline; Fortiche's painted light; terminator/plane-break doctrine; SotC near-black shadows; 60-30-10; Riot's saturation-as-rank + decay direction; big-flat-colour readability; per-zone roughness variation; Toothless/Light Fury/Drogon/Ohmu/Totoro/Haku exaggeration cases; Malzeno's candlestick tail; Capcom's ecology-first doctrine; Whitlatch's anatomy cornerstone; Journey's reduction; the AI/kit-bash tells (melted blobs, tangents, identical repeated patterns, flat even light) | Neil Blevins art_lessons; Warframe TennoGen Basic Art Guide; PixelSanctuary (low authority); Animated Spirit; *The Illusion of Life* via secondary; Creative Bloq; Walt Disney Family Museum; Riot *Clarity in League* + *LoL VFX Style Guide* (2017 PDF) + Art Edu; GDC 2017 *The Art of Overwatch* + Blizzard commentary; Mitchell, Francke & Eng, *Illustrative Rendering in Team Fortress 2*, NPAR 2007; pixel-art production guides; Gurney Journey; 80.lv; Valve NPAR07; AWN / SyncSketch / 80.lv on Arcane; Briggs *The Dimensions of Colour*; Game Developer *The Art of Shadow of the Colossus* + *How devs can spot AI-generated 3D models*; 60-30-10 literature; Coelho-Kostolny; HTTYD Wiki / AWN / DiscussingFilm; Nerdist / Gizmodo / Forbes; Nausicaa.net GhibliWiki; Capcom *The Making of Malzeno* + Capcom IR; Design Studio Press (Whitlatch, *The Skillful Huntsman*); GDC 2013 Nava |

### §11.2 `[D]` — derived figures, with the reasoning

| § | Figure | Reasoning |
|---|---|---|
| §1.2 | All heraldic wing/leg/tail angles | Read off how emblazoners draw the named states. **Blazon has no degrees.** Drawing targets only |
| §1.2 | Tail 35–45% of body length, thick-rooted, load-rated | Geometric requirement to make the sourced "rests on its tail" tripod physically plausible |
| §1.3 | De-kitsch laws 3, 6 (break the plane; terminus ≤1.5× local tail diameter) | Silhouette-plane reasoning + the point at which an appendage stops reading as anatomy and starts reading as costume |
| §1.5, §1.6 | Merging arm and wing concentrates expressive mass; bat topology with reduced strut count | Restates the sourced Weta/Pixomondo rationale as a design consequence for a rear-chase camera |
| §2.1 | All span:torso ratios; the 13–15 cross-validation | 1.33×humerus rule applied to sourced element lengths, then checked at two body sizes |
| §2.1, §2.4 | Torso-normalized element sets for both clades; the 2.2× leg-length contrast | Division of sourced absolute lengths by the derived torso length |
| §2.2 | Span:torso for bats (torso ≈ 0.55–0.62 × head+body) | Standard mammalian trunk proportion applied to sourced head+body lengths |
| §2.3 | All bird torso-normalized ratios, chest depth, AR and WL for albatross/condor/vulture/stork | Bird torso length is nowhere published cleanly. **Flag before use** |
| §2.5 | Varanid scale unit 0.12–0.24% of total length | Photographic scale on a 2.5 m animal. `[no-assert]` |
| §2.6 | Keel-depth ratios 0.35–0.5 / 0.2–0.3 | Direction sourced, magnitude not. LOW confidence, `[no-assert]` |
| §2.7 | Mass ∝ span^2.97; the spindliness index; the 8–15 m mass table; span:torso 5.0–6.5 and 600–900 kg | Two-point regression on Witton's own sourced anchors, then the rider-ergonomics constraint solved against it |
| §3.1 | Glenoid 0.10–0.15, acetabulum 0.90–1.00, COM 0.22–0.32 aft of glenoid, femur 0.9–1.2 × torso | The only layout that satisfies the sourced ground-COM and the derived flight-COM conditions simultaneously |
| §3.1 | The anvil-to-whip section profile (max at glenoid → 85% to acetabulum → bulge at 15–25% of tail) | Geometric statement of the sourced caudal-centra pattern plus the pectoral mass concentration |
| §3.3 | All cruise-pose joint angles; the abducted-leg recommendation | Pose families are sourced; degrees are not. The recommendation follows from what a rear-chase camera can actually see |
| §3.4 | Chord:arc values and total sweep angles | No source published sweep for any group. `[no-assert]` |
| §4.1 | "Build the fan" verdict; the 1.5–1.8× dominant-digit hybrid | Forced by the sourced feature counts (4 spars → 3 bays + 3 knuckles vs 1 spar → 1 bay, 0 knuckles) and the fold kinematics |
| §4.2 | Armwing ~52% / handwing ~39% areas | Solved from the sourced lift shares (0.91 × 1.31 / 2.31), which the study states track area |
| §4.3 | Phalanx ratios 1.00:0.81:0.57:0.49; the convergence with the house `lenFrac` | Division of the sourced *Rhamphorhynchus* measurements |
| §4.6 | Every folded-pose joint angle; the 25–35% folded span; the cloak-not-cape read | No numeric folded-pose angles published anywhere. **Art-direct, do not assert** |
| §5.3 | The whole glide-hold envelope (2–4 beats, 3.0–4.5 s hold, ~6 s ceiling, ~1.5 s floor, ±25% jitter) | A perception question with no published answer, reasoned down from the sourced ibis/condor/stork cadences for a game camera |
| §5.4 | τ = 0.55; peak fold at 60–70% of cycle | τ is `unknown`; the fold phase follows from the sourced mid-upstroke definition of span ratio |
| §6.1 | The S-profile verdict; the cos(θ) foreshortening argument; the two-inflections-beat-one claim | Projective geometry plus the sourced hornbill/chameleon morphologies that already do it |
| §6.2 | W:H ≈ 1.0–1.2 target; skull ≈ 0.12–0.15 × total length | Positioned against the sourced croc (1.7) and varanid (1.28) values; the skull fraction averaged across four sourced rows |
| §6.3 | All sweep angles; the 0.62–0.70 decay ratio; the occiput placement | Sweeps read off described geometries. The decay ratio is the largest step that still reads as *smaller* at silhouette resolution |
| §6.4 | Orbit at x 0.62–0.72 / y 0.70–0.85; the 2–4 head-length convergence construction | The convergence *band* is sourced; the construction and placement are craft targets that fix the eye/nostril ambiguity |
| §6.5, §6.7 | The 90–110° gape band; every tooth number | The gape band is positioned inside the sourced machairodont 100–130°; tooth numbers are screen-legibility thresholds |
| §6.6 | The stiff-and-stepped junction; the ~110–130° C6 swing | Condyle position is sourced; the craft consequence and the heron angle estimate are mine. `[no-assert]` |
| §7.1–7.2 | Interpolated blackbody hexes; the two-band 1,100–1,300 / 650–800 °C default; the zone radii and the B≤0.5·G / B≤0.15·G margins | Interpolation inside Charity's sourced table, plus safety margins set inside the sourced R≥G≥B envelope |
| §7.3 | All cell:crack ratios; the 3-generation recipe; the ≥60% T / ≤15% Y kill rule | Ratios estimated from sourced cell sizes and crack apertures; the recipe follows the sourced hierarchy and 10:1 spacing laws; the kill rule sets the point at which "mature" overtakes "alive" |
| §7.4 | The whole cross-section profile; 30:20:1; the 1/(1+(x/w)²) falloff; the ±9° visibility cone; the dot(N,V)^k dial | Slot-emitter geometry with the floor pinned to the sourced 0.04 char albedo |
| §7.5 | The three halo layers and their radii/intensities | Layer *identities* and the 0.187% VGI are sourced; the radii and intensities are the arrangement that reproduces the sourced behaviour |
| §7.6 | Char basecolor 0.020–0.045 tinted cool; roughness 0.85–0.95 / 0.30–0.45; every painter's fraction (1–3%, 5–10%, 20–35%) | Albedo sourced, the cool tint follows from the sourced Turner/Wright complement requirement; roughness has **no measured source** `[no-assert]`; fractions measured off the described compositions |
| §7.8 | The vertex-wobble idiom; the 24–40 / 90–140 / cap-160 ember budget | The idiom is the direct consequence of the sourced grab-pass disqualification; the budget is a fraction of the sourced 150–300 mobile ceiling |
| §8.1 | 70/25/5 as a house convention | Blevins' sourced 70/30 applied twice. **Explicitly NOT an industry citation** |
| §8.2 | Toothless' ≈2–2.5× eye exaggeration | Side-by-side reading against a real felid. `[no-assert]` |
| §8.3 | Every silhouette-mass count and the 3–5 law | Blackout counts at ~64 px from canonical profiles. **No studio publishes these.** `[no-assert]` |
| §8.4 | The 4 groups + 1 accent tier ceiling | Gurney's sourced 3–4 ceiling plus one reserved emissive tier to match the house value-structure law |
| §9.2 | The 3× curve-radius ratio, the ≥2× texture-frequency ratio | Thresholds at which the difference is unambiguous at silhouette resolution |

### §11.3 The visible gaps — searched and NOT found

**Do not fill these in.** Any future session that sources one should replace the row and tag it `[D]`→`[S]` with a lesson file.

| § | Gap |
|---|---|
| §1 | Any degree-value for any heraldic wing angle (blazon has no angles) · a tincture-frequency survey for wyverns, any named `vert` example, a Mercian *wyvern* standard · a documented art-historical trace of the spade tail entering the visual record · reliable published dimensions for Smaug, Drogon, or Rathalos · finger counts for every fictional build |
| §2 | Numeric keel depth : sternum length for any group · bat flight-muscle mass fraction · numeric varanid limb abduction angles · varanid scale diameter as a published figure · numeric standing knee/ankle angle ranges for any theropod · *Deinonychus* absolute limb lengths · *Pteranodon* torso length |
| §3 | Total neck sweep angles for any group |
| §4 | Bat digit II–V lengths as ratios to forearm; bat forearm:humerus · membrane region areas as directly-measured percentages (only lift-share proxies exist) · **propatagium depth as a fraction of chord — explicitly an open reconstruction parameter** · actinofibril spacing · folded-vs-extended span ratio and every folded-pose joint angle · published AR and wing loading for wandering albatross, Andean condor, *Pteranodon*, *Quetzalcoatlus* |
| §5 | Downstroke:upstroke duration ratio (τ) for any species · wrist rotation magnitude in degrees and the exact cycle phase of peak wrist fold · wingbeat frequency in Hz for albatross and condor · Pennycuick 1996 exponents as confirmed text · **a published number for "the longest glide-hold that still reads alive" — a perception question, not a biology one** |
| §6 | Heesy 2004's orbit-convergence table · Bennett 1992's *Pteranodon* crest metrics · maximum *feeding* gape for a crocodilian (only basking gaping is sourced) · comparative archosaur occipital-condyle angles · numeric heron neck fold/unfold angles |
| §7 | A technical breakdown of Breath of the Wild's heat shimmer · measured roughness values for char and vitrified char |
| §8 | A named studio stating **70/25/5** as a form-area budget · an attribution for the coining of "straights against curves" (**do not cite Blair**) · a stated studio target for "readable at 32 px" for 3D creatures · a stated silhouette frame-occupancy % · a stated value-zone **count** on a hero creature · a stated palette-**size** cap |

### §11.4 Poisoned and disputed numbers — kept visible

| Number | Status |
|---|---|
| Andean condor wing loading **"0.64 N/m²"** | **WRONG by ~100×.** Discarded. Use 70.6 / 84.6 N/m² — §2.3 |
| Giant pterosaur mass: **200–250 kg** (Witton & Habib) vs **544 kg** (Henderson) | **Live dispute. Both given, never averaged** — §2.7 |
| *Q. northropi* torso: **0.65–0.75 m** (Witton) vs **1.8 m** (Henderson) | Both given. The disfavoured one is the game-usable one — §2.1, §2.7 |
| *Pteranodon* mass **20–93 kg** | **The spread IS the answer** — §2.7 |
| Pterosaur pectoral mass **20–25%** vs the **30–40%** outlier | Both given; the outlier is the upper fringe — §2.6 |
| Drogon span:body **≈1.7**; Rathalos **≈0.9** | Fan aggregation, not production. **Do not build proportions off them** — §1.4 |
| Snake gape **180°** | Loosely sourced. A ceiling, not a measurement — §6.5 |
| *Allosaurus* tibia:femur **~0.73** | Different individuals. Approximate — §2.4 |
| "wyver" attested **1312** vs OED's **c.1374** | Conflict unresolved; treat 1312 as unverified — §1.8 |
| Amphiptere: "legless winged serpent" vs "winged serpent **with dragons' feet**" | Period usage unstable; neither is settled — §1.1 |
| Pennycuick 1996 exponent set | Not visible in retrieved text. Unverified — §5.1 |
| The pterosaur hindlimb/uropatagium attachment | **Genuinely debated**; the "shackled hindlimbs" claim has been rejected — §3.3 |

---

## North star

Every number in this file is a **starting position with a receipt**. The receipts are in §11 so the
tables can stay clean; the gaps in §11.3 are as load-bearing as the figures, because a visible
`unknown` is what stops the next session from inventing a fact. Pick the clade row, take the ratio
as neutral, exaggerate **along that row's own axis** by a named factor, and write the decision into
the buildsheet as `value (ref §N range, ×K exaggeration)`. Then go build to
`DRAGON-DESIGN.md` and `AAA-PIPELINE.md` — this file tells you where anatomy starts; those tell you
what premium looks like when you get there. `leapfrog^leapfrog`.
