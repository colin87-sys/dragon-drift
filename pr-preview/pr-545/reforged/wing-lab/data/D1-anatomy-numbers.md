# D1 — Wing anatomy, hard numbers

Stream D1 of the Wing Lab. Subject: **one wing**. Scope: **exactly the numbers
`DRAGON-ANATOMY-REFERENCE.md` §4 declares `unknown` / OPEN.** Nothing here restates §4.
If §4 already closed it, it is not in this file.

---

## Provenance note — READ BEFORE TRUSTING A TAG

**`WebFetch` is globally blocked in this environment.** Confirmed this pass with
`EGRESS_BLOCKED` on `journals.biologists.com`, `pmc.ncbi.nlm.nih.gov`, `arxiv.org`,
`www.science.smith.edu`, `repository.library.northeastern.edu`. Every number below came
through **`WebSearch` result summaries of named URLs** — the same constraint stream A1 hit.

Calibration, so the Director can weigh a tag correctly:

- `[S]` + a URL — the number lives at that URL. The *wording* around it is the search
  index's paraphrase unless it is in "double quotes".
- `[D]` — computed here from `[S]` inputs. **The arithmetic is shown every time.**
- `unknown` — searched, not found. The search terms are logged under "Still unknown". This is a result.
- `[no-assert]` — sources conflict or the field refuses to settle it.
- ⚠ **single-pass** — retrieved once and *not* reproduced by a second, differently-worded
  search. Used exactly once below (P. vampyrus humerus/radius) and flagged in place.

No image is contributed by this stream, so there is no `refs/INDEX.md` row from D1.

---

## Headline

*The five findings that most change what the wing looks like.*

**1. The wrist sits at HALF the span, not at a quarter.** With a measured bat digit-III
chain and a measured humerus:radius, the shoulder→fingertip landmark positions fall out
as **elbow t≈0.29, wrist t≈0.56, first knuckle t≈0.74, second knuckle t≈0.86** (T1).
The hand is **~44–49% of the semi-span**. The repo's `wristT 0.20–0.30` (⇒ "hand ≈76% of
the wing", §4.4) is **not** the bat proportion — it is roughly double the real hand share.

**2. The knuckles crowd toward the tip; they are not evenly spaced.** Gaps between
consecutive leading-edge landmarks: 0.20 → 0.27 → 0.18 → 0.12 → 0.14 of the span. The
outboard **26%** of the wing carries **two** joints. Evenly spaced struts are a tell.

**3. The finger does not taper monotonically — the MIDDLE segment is the shortest.**
Measured digit III: metacarpal : phalanx-1 : phalanx-2 = **1.00 : 0.645 : 0.771**. A build
rule of "each segment shorter than the last" is contradicted by the only measured set
retrieved. And the palm barely fans at all: mc3 : mc4 : mc5 = **1.00 : 0.978 : 0.946**.
**The fan opens at the KNUCKLES, not in the palm.**

**4. A propatagium and a straight arm are mutually exclusive — 111.0° is the hard limit.**
Fossil taxa preserving elbow angles **> 111.0°** did not possess a propatagium; the
forward sheet mechanically restricts elbow extension (T4). So the §4.4 law "a straight
leading edge is unsupported in both membrane lineages" now has a **number**: the elbow must
read as bent by ≥ ~20° off straight, at full extension, or the forward sheet is a lie.

**5. The membrane is 39–267 µm thick and ~10× stiffer chordwise than spanwise, with
spanwise elastin bundles that WRINKLE the surface at rest.** Modulus ≈ **3 MPa spanwise
→ ≈30 MPa chordwise**; the plagiopatagium changes length by **>50% in both directions** in
flight; skin is **4–10× thinner** than predicted for a mammal that size (T3). The rest
state of a real membrane is not smooth — it is a spanwise-wrinkled sheet.

---

## Tables

### T1 — Bat wing bone proportions — CLOSES `LD3/FL`, `forearm : humerus`, metacarpal:phalanx

**Primary measured set.** Javid et al., *"Morphometrics of fulvous fruit bat (Rousettus
leschenaulti) from Lahore, Pakistan"*, **Pakistan J. Zool. 24(3)**, n = 15 (9♂ 6♀). `[S]`
https://www.thejaps.org.pk/docs/v-24-3/41.pdf ·
https://www.academia.edu/24346268/Morphometrics_of_fulvous_fruit_bat

| Element | Measured (mm ± SD) | Tag |
|---|---|---|
| Head + body | 99.55 ± 15.04 | `[S]` |
| **Forearm (FL)** | **77.64 ± 6.37** | `[S]` |
| Metacarpal III | 52.73 ± 4.83 | `[S]` |
| Metacarpal IV | 51.56 ± 5.00 | `[S]` |
| Metacarpal V | 49.86 ± 4.00 | `[S]` |
| Phalanx 1 of digit III | 34.00 ± 3.74 | `[S]` |
| Phalanx 2 of digit III | 40.63 ± 4.91 | `[S]` |
| Tibia | 37.24 ± 4.77 | `[S]` |
| Tail | 11.1 ± 3.07 | `[S]` |

**Ratios derived from that set** — `[D]`, arithmetic shown:

| Index | Value | Derivation |
|---|---|---|
| **LD3 / FL** ("wing length" index) | **1.640** | (52.73+34.00+40.63)/77.64 = 127.36/77.64 |
| mc3 / FL | **0.679** | 52.73/77.64 |
| mc4 / FL | **0.664** | 51.56/77.64 |
| mc5 / FL | **0.642** | 49.86/77.64 |
| **mc3 : mc4 : mc5** | **1.000 : 0.978 : 0.946** | palm spread is only **5.4%** across three digits |
| **Within digit III: mc : ph1 : ph2** | **1.000 : 0.645 : 0.771** | ph2 is **19.5% LONGER** than ph1 |
| Digit-III segment shares | mc **41.4%**, ph1 **26.7%**, ph2 **31.9%** | of 127.36 mm |
| Tibia / FL | **0.480** | leg is under half the forearm |
| FL / (head+body) | **0.780** | |
| LD3 / (head+body) | **1.279** | cf. *Miniopterus schreibersii* digit III = **1.54 ×** head+body `[S]` https://pmc.ncbi.nlm.nih.gov/articles/PMC3996600/ |
| **LD5 / FL** ("wing width" index) | **`unknown`** — mc5/FL = 0.642 is a **floor**; digit-V phalanx lengths were not reported by any source retrieved | — |

**Forearm : humerus.** *Pteropus vampyrus*, "Anatomical Structure of Large Flying-Fox Bat's
(*Pteropus vampyrus*) Forelimb Skeleton": **humerus ≈ 14.5 cm, radius ≈ 19.7 cm** `[S]`
https://ejournal.uin-suka.ac.id/saintek/icse/article/download/2680/2094
⚠ **single-pass** — a second, differently-worded search did not resurface these two values.
⇒ **forearm : humerus = 1.36 : 1**; humerus = **0.736 × forearm** `[D]`.
Direction agrees with the sourced qualitative law (§4.3: elongation increases distally).

> **CROSS-CHECK THAT PASSES `[D]`.** Build a *P. vampyrus* half-wing from the two
> independent sources: FL 200 mm (published range 180–220 `[S]`), humerus 0.736 × 200 =
> 147 mm, digit III 1.640 × 200 = 328 mm, plus a shoulder offset from the body midline of
> ~70 mm. Semi-span = 745 mm ⇒ **span ≈ 1.49 m**. Published *P. vampyrus* wingspan is
> ~1.5 m `[S]`. Two unrelated papers and a third species' ratio agree to **<1%**. The
> humerus:radius figure survives the check.

**Span landmarks — the table the modeller actually needs** `[D]`, from the chain above,
`t` measured from the body midline to the fingertip (semi-span = 3.726 forearm-lengths):

| Landmark | Cumulative (FL units) | **t along semi-span** | Gap to previous |
|---|---|---|---|
| Body midline | 0.000 | 0.000 | — |
| Shoulder / glenoid | 0.350 | **0.094** | 0.094 |
| **Elbow** | 1.086 | **0.291** | 0.198 |
| **Wrist (carpal apex)** | 2.086 | **0.560** | 0.269 |
| **MCP knuckle, digit III** | 2.765 | **0.742** | 0.182 |
| **PIP knuckle, digit III** | 3.203 | **0.860** | 0.118 |
| Fingertip | 3.726 | **1.000** | 0.140 |

Hand (wrist→tip) = **44.0%** of the semi-span from the midline; **48.6%** of the
shoulder→tip chain. Assumption stated: shoulder offset = 0.35 FL, taken from the
*P. vampyrus* cross-check above. Vary it 0.2–0.5 FL and the wrist moves only **0.541–0.577**
`[D]` — the landmark is robust to the one assumption in the chain.

### T2 — Pterosaur forelimb ratios — CLOSES wing-finger : forearm : humerus for a giant

*Quetzalcoatlus lawsoni*, Padian et al. 2021, *Functional Morphology of Quetzalcoatlus
Lawson 1975*, JVP 41(sp1). `[S]`
https://www.tandfonline.com/doi/full/10.1080/02724634.2020.1780247

| Element | Measured | Tag |
|---|---|---|
| Humerus | **23–25 cm** | `[S]` |
| Radius + ulna | **36–39 cm** ("and possibly longer") | `[S]` |
| Metacarpal IV | **46–47 cm** (single near-complete element, missing proximal surface) | `[S]` |
| Scapula, tip→glenoid centre | 15–18 cm | `[S]` |
| Coracoid, sternal articulation→glenoid | 13–16 cm | `[S]` |
| Wing phalanges | **`unknown`** — not reported in anything retrieved | — |

| Ratio | Value | Derivation |
|---|---|---|
| **humerus : radius : mcIV** | **1.00 : 1.56 : 1.94** | midpoints 24 / 37.5 / 46.5 cm |
| radius / humerus (pterosaur) | **1.56** | vs **1.36** in the bat above — **the pterosaur forearm is ~15% longer relative to its humerus** `[D]` |
| mcIV / radius | **1.24** | pterosaurs have a *hand bone* longer than the forearm; bats have mc3 = 0.68 × forearm. **A 1.8× difference in palm proportion between the two lineages** `[D]` |
| **Wing finger / humerus** | **≈ 4.5–5.5** | `[D]`, see box |
| **Wing finger / mcIV** | **≈ 2.3–2.8** | `[D]` |
| **(mcIV + wing finger) / shoulder→tip** | **≈ 0.71–0.74** | `[D]` — independently tightens §4's `[S, approximate]` ">2/3" |

> **Wing-finger derivation `[D]`.** Shoulder→tip = humerus + radius + mcIV + F = 24 + 37.5
> + 46.5 + F = 108 + F cm. *Q. lawsoni* span ≈ 4.5–5.0 m `[S, ANATOMY-REF §2.1]`; subtract ~10–15 cm
> of shoulder offset ⇒ shoulder→tip ≈ 215–240 cm ⇒ **F ≈ 107–132 cm**. Sensitive to the
> assumed span; stated as a band, not a point.

**Cross-lineage taper for the wing finger** (already `[S]` in §4.3, repeated only because
the ratios below are new): *Rhamphorhynchus* mcIV 148 mm, phalanges 138 / 112 / 79 / 67 mm.
⇒ **successive** element-to-element decay down the chain 148→138→112→79→67 is
**0.93, 0.81, 0.71, 0.85** `[D]` (mean **0.82**) — i.e. the pterosaur wing finger decays at
a near-constant **~0.8 per element**, *not* the 0.62–0.70 of a crest/tooth rank (§6.3), and
**not monotonically**: the last element decays *less* than the one before it, the same
"long–short–long" rhythm the bat finger shows in T1. Two lineages, same non-monotone tell.
⚠ Not the same specimen as the TMP 2008.41.001 wing (990 mm span) in
https://peerj.com/articles/1191/ — do not chain the two.

*Pteranodon*: Bramwell & Whitfield 1974 reconstruction, span **6.95 m**, mass **16.6 kg**
`[S]` https://royalsocietypublishing.org/doi/10.1098/rstb.1974.0007 (via
http://pterodata.blogspot.com/2011/03/whitfield-pteranodon.html). Element lengths
`unknown`. *Anhanguera* element lengths `unknown`.

### T3 — Membrane material — thickness, modulus, anisotropy, strength

| Property | Value | Tag / source |
|---|---|---|
| **Wing-membrane thickness, measured** | **0.039–0.267 mm (39–267 µm)** | `[S]` https://www.academia.edu/7656590/Mechanical_properties_of_bat_wing_membrane_skin (Swartz, Groves, Kim & Walsh 1996, *J. Zool.* 239:357–378) |
| Skin thinness vs body-size prediction | **4–10× thinner** than predicted | `[S]` same |
| **Elastic modulus, spanwise** | **≈ 3 MPa** | `[S]` https://www.researchgate.net/publication/262527689_Membrane_muscle_function_in_the_compliant_wings_of_bats (citing Swartz 1996) |
| **Elastic modulus, chordwise** | **≈ 30 MPa** | `[S]` same |
| **Anisotropy ratio** | **≈ 10 : 1 chordwise : spanwise** | `[D]` 30/3 |
| Modulus at low strain | **< 0.1 MPa**, rising **an order of magnitude** at biologically realistic strain — strongly nonlinear | `[S]` https://royalsocietypublishing.org/rsif/article/12/106/20141286/35567/A-wrinkle-in-flight-the-role-of-elastin-fibres-in |
| Direction of maximum stiffness & strength | **parallel to the wing skeleton**; greatest extensibility transverse to it | `[S]` https://zslpublications.onlinelibrary.wiley.com/doi/10.1111/j.1469-7998.1996.tb05455.x |
| Which way is stretchier, resolved | "wing membranes of all bats studied to date are **more extensible in the spanwise than the chordwise direction**" | `[S]` https://royalsocietypublishing.org/rsif/article/12/106/20141286/35567/A-wrinkle-in-flight-the-role-of-elastin-fibres-in |
| **In-flight strain, plagiopatagium** | **>50% length change, spanwise AND chordwise** | `[S]` https://sicb.org/abstracts/form-and-function-in-the-wing-membrane-of-bats/ |
| Weakest / most extensible region | **plagiopatagium** (the big inboard armwing sheet) | `[S]` same |
| Greatest load at failure | **uropatagium** | `[S]` same |
| **Elastin bundle orientation** | **predominantly proximodistal — i.e. SPANWISE — in all bats**; the bundles are what produce the membrane's characteristic **wrinkles** | `[S]` https://onlinelibrary.wiley.com/doi/10.1111/joa.12580 (Cheney, Allen & Swartz 2017, *J. Anat.* 230(5)) |
| Elastin's mechanical role | responsible for the **anisotropy**; contributes substantially to load-bearing **only at very low stress** | `[S]` https://royalsocietypublishing.org/rsif/article/12/106/20141286/35567/A-wrinkle-in-flight-the-role-of-elastin-fibres-in |
| **Intramembranous muscle arrays** | **5** anatomically distinct groups; **3 present in all** species; array length and muscle count vary **by >1 order of magnitude** across taxa | `[S]` Cheney et al. 2017, 130 species / 17 families |
| Regional survey coverage | plagiopatagium + dactylopatagium characterised across **130 species, 17 families** | `[S]` same |
| **Tensile strength (MPa)** | **`unknown`** — reported qualitatively as "strength" and "load at failure", never as a retrievable MPa figure | — |
| **Tear / puncture resistance** | **`unknown`** | — |
| Thickness split, plagiopatagium *vs* dactylopatagium | **`unknown`** — the 39–267 µm range is whole-wing; no source retrieved separated it by region | — |

### T4 — Propatagium geometry — the OPEN item, partially closed by derivation

| Figure | Value | Tag |
|---|---|---|
| Propatagium share of **lift** | **9%** | `[S]` https://www.cambridge.org/core/journals/journal-of-fluid-mechanics/article/computational-modelling-and-analysis-of-the-coupled-aerostructural-dynamics-in-batinspired-wings/47F02ED3D3D67C8B1D9D373CA923B65D |
| Armwing vs handwing lift | armwing generates **31% more** lift than handwing | `[S]` same |
| **Lift coefficient per unit area** | **propatagium 2.1**; other three segments **1.27–1.53** ⇒ propatagium ≈ **50% more effective per unit area** | `[S]` same |
| **⇒ Propatagium share of AREA** | **≈ 5.6–6.7%, call it ~6%** | **`[D]`** |
| ⇒ Armwing / handwing area | ≈ **53% / 41%** | `[D]` |
| **⇒ Forward depth at the elbow, as a fraction of local chord** | **≈ 0.15–0.25 c** | **`[D, wide]`** |
| **Elbow-extension ceiling imposed by a propatagium** | **111.0°** — taxa preserving elbow angles above this **did not** have one | `[S]` https://zoologicalletters.biomedcentral.com/articles/10.1186/s40851-023-00204-x (Uno & Hirasawa 2023, *Zoological Letters*) |
| Avian folded-hand angle, for contrast | ~**50°** in Ornithothoraces, ~**90°** in *Microraptor* | `[S]` same |
| Bird propatagium ablation | removing ~**50%** of its projected area and its cambered profile significantly reduced flight distance in House Sparrows | `[S]` https://onlinelibrary.wiley.com/doi/abs/10.1002/(SICI)1097-010X(19961001)276:2%3C112::AID-JEZ4%3E3.0.CO;2-R (Brown & Cogley 1996, *J. Exp. Zool.*) |
| Pterosaur propatagium depth | still **`[no-assert]`** — see box | — |

> **Area derivation `[D]`.** Area ∝ lift ÷ (lift coefficient per unit area). Lift shares
> 0.090 / 0.516 / 0.394 (propatagium / armwing / handwing, the last two from §4.2's `[D]`
> split of the same study). Divide by 2.1 / c / c with c = 1.27…1.53:
> a_prop = 0.0429; a_arm = 0.337…0.406; a_hand = 0.258…0.310. Normalise ⇒
> **propatagium 5.6–6.7%**, armwing 52–53%, handwing 40–41%.
>
> **Depth derivation `[D, wide]`.** Treat the propatagium as a triangle on
> shoulder–elbow–wrist. Shoulder→wrist = 1.736 FL (T1). One wing's area ≈ 4.27 FL²
> (semi-span 3.726 FL at flying-fox AR 6.5 `[S, §4.5]`). 6.2% of that = 0.265 FL².
> Depth d = 2 × 0.265 / 1.736 = **0.305 FL**. Local root chord ≈ 1.25–1.6 FL
> ⇒ **d / c ≈ 0.19–0.24**; against the *mean* chord (1.15 FL) it is 0.27. Reported as
> **0.15–0.25 c** to absorb the AR and chord assumptions.
>
> ⚠ **This does NOT settle §4.2's refusal.** §4.2's `[no-assert]` is about the *pterosaur*
> propatagium, whose depth depends on pteroid orientation and assumed elbow angle — that
> is still unsettled and no source retrieved this pass changed it. What the derivation
> gives is a **defensible non-zero starting depth from bat aerodynamics**, so the builder
> stops authoring the forward sheet as decorative piping.

### T5 — Actinofibrils — spacing still open, layer structure closed

| Figure | Value | Tag |
|---|---|---|
| **Spacing / density per mm** | **`unknown`.** Three differently-worded searches; every hit returned *diameter* (0.05–0.2 mm, already in §4) and the word "densely packed", never a spacing or a count | — |
| **Layer count** | **≥ 3**; *Rhamphorhynchus* described as an outer skin plus two thin inner layers of muscle and actinofibrils "arranged in **three crisscrossing layers**"; *Jeholopterus* actinopatagium shows "**at least three layers**" | `[S]` https://palaeo-electronica.org/content/2023/3750-pterosaur-soft-parts · https://archosaurmusings.wordpress.com/2008/06/16/pterosaur-wings-2-structure/ |
| **Within-layer orientation** | "parallel to subparallel **within each layer**, but **diverging in direction from layer to layer**" | `[S]` same |
| **Orientation angles in degrees** | **`unknown`** — the divergence is never quantified in anything retrieved | — |
| **Density gradient along the span** | **denser distally**, "rare or missing proximally" | `[S]` https://www.researchgate.net/publication/240241681_Pterosaur_flight_The_role_of_actinofibrils_in_wing_function |
| **Proximal orientation** | where present proximally they lie **perpendicular to the long axis of the wing** (vs subparallel to the spar distally) | `[S]` same |
| Zittel-wing preservation caveat | reinterpreted as **negative impressions of closely spaced broad flat actinofibrils**, calcite-replaced, partly prepared away — the count "cannot always be determined" | `[S]` https://bioone.org/journals/journal-of-paleontology/volume-89/issue-5/jpa.2015.68/New-interpretation-of-the-wings-of-the-pterosaur-Rhamphorhynchus-muensteri/10.1017/jpa.2015.68.short |

### T6 — Folded pose and joint range of motion — mostly still open, one hard number

| Figure | Value | Tag |
|---|---|---|
| **Elbow: maximum extension compatible with a propatagium** | **111.0°** | `[S]` Uno & Hirasawa 2023 (see T4) |
| **Glenohumeral joint** | mammalian ball-and-socket, **five degrees of freedom** — unlike the restricted avian joint | `[S]` https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.22650 (Panyutina et al. 2013, *Anat. Rec.*) |
| Where in that envelope the flap lives | wingbeats are performed predominantly by **humerus-relative-to-girdle** motion, occupying **the caudal-most sector** of available shoulder mobility; shoulder-girdle excursion contributes **relatively little** to amplitude | `[S]` same |
| Total kinematic freedom | **>20 degrees of freedom per wing** (jointed leg + shoulder + elbow + wrist + five multi-jointed fingers) | `[S]` https://www.sciencedirect.com/science/article/abs/pii/S002251930800324X (Riskin et al. 2008, *J. Theor. Biol.*) |
| Marker set used to capture it | **17 markers / 20 joint angles**, *Cynopterus brachyotis*, wind tunnel, nine speeds; **3 groups of joints move together**, describing 14 of the 20 angles | `[S]` same |
| Mechanism of the fold | handwing **supinates at the wrist**; the wing **retracts along the span by elbow flexion**; folding is implemented primarily by **wrist flexion/extension** | `[S]` https://journals.biologists.com/jeb/article/218/5/653/14631/Bat-flight-aerodynamics-kinematics-and-flight |
| Payoff of folding | wing folding may reduce the **inertial cost by as much as 35%** vs holding the wing outstretched | `[S]` https://www.researchgate.net/publication/223977454_Upstroke_wing_flexion_and_the_inertial_cost_of_bat_flight |
| Span ratio, defined | **SR = span at mid-upstroke ÷ span at mid-downstroke** | `[S]` https://pmc.ncbi.nlm.nih.gov/articles/PMC3522884/ |
| Span ratio, valued | **`unknown` as a number.** Sourced only as a trend: SR is **lower at low speed** (deeper fold when slow) | `[S]` trend / `unknown` value |
| **Roosting folded-pose joint angles (shoulder / elbow / wrist, in degrees)** | **`unknown`** — searched five ways; every source is qualitative ("folds like an umbrella", "wraps the body") | — |
| **Folded span ÷ extended span** | **`unknown`** for the roosting pose | — |
| **Shoulder / wrist / MCP ROM in degrees** | **`unknown`** — no source retrieved gave a degree-valued envelope for any bat joint | — |

⇒ §4.6 remains the weakest-sourced item in the pack. **One thing changed:** the elbow now
has a hard *extension* bound (111.0°) that applies to the EXTENDED pose, not the folded one.

### T7 — Published aspect ratio and wing loading — CLOSES three of the four §4.5 gaps

| Taxon | Aspect ratio | Wing loading | Tag / source |
|---|---|---|---|
| **Wandering albatross** (giant albatrosses) | **15.6** | `unknown` as a published N/m² | `[S]` Warham 1977, *Wing loadings, wing shapes and flight capabilities of Procellariiformes*, NZ J. Zool. 4(1) https://www.tandfonline.com/doi/abs/10.1080/03014223.1977.9517938 |
| Storm petrel (the small end of the same clade) | **≈ 6.5** | — | `[S]` same — **AR climbs 6.5 → 15.6 across one family purely with size** |
| Procellariiform wing-area allometry | — | log₁₀ area(cm²) = 20.42·log₁₀ mass(g) − 0.588 ⚠ leading coefficient looks like an OCR/transcription error (should plausibly be 0.42-ish); **do not use** | `[no-assert]` same |
| **Andean condor** | **7.9** | ⚠ "≈4.5 kg/m² (≈44 N/m²)" surfaced but **conflicts** with the PNAS California-condor figure of **70.6 N/m²** `[S, ANATOMY-REF §2.3]`; a 11 kg condor would need 2.4 m² of wing for 44 N/m² | AR `[S]` McGahan 1973, *Gliding flight of the Andean condor in nature*, JEB 58(1):225–237 https://journals.biologists.com/jeb/article/58/1/225/21821/ · WL `[no-assert]` |
| ***Pteranodon*** | 9:1 `[S, ANATOMY-REF §2.1]` | **`unknown` as published**; `[D]` **≈ 30 N/m²** from Bramwell & Whitfield's span 6.95 m + mass 16.6 kg at AR 9 (S = b²/AR = 5.37 m²; 16.6 × 9.81 / 5.37) | `[S]` https://royalsocietypublishing.org/doi/10.1098/rstb.1974.0007 |
| ***Quetzalcoatlus*** | `unknown` | **72 N/m² — PUBLISHED** | `[S]` Chatterjee & Templin, *Posture, Locomotion and Paleoecology of Pterosaurs* https://www.researchgate.net/publication/280299600_Posture_Locomotion_and_Paleoecology_of_Pterosaurs |
| **Pterosauria, full published range** | — | **7 N/m² (*Eudimorphodon*) → 72 N/m² (*Quetzalcoatlus*)**, 10 species | `[S]` same |
| Pterosaur glide angle, giant pterodactyloids | — | **1–2°** (comparable to albatross / sailplane) | `[S]` same |
| ***Pteropus livingstonii*** | **6.52** | **25.8 N/m²** | `[S]` (already §4.5) https://en.wikipedia.org/wiki/Livingstone's_fruit_bat |
| *P. samoensis* vs *P. tonganus* | ~8% lower AR | ~23% lower WL | `[S]` https://www.researchgate.net/publication/12677661 (Norberg et al. 2000) |
| **Largest flying foxes** (*P. neohibernicus*, to 1.45 kg / 1.7 m span) | **`unknown`** | **`unknown`** | — |

> **⚠ THE QUETZALCOATLUS SPREAD IS THE ANSWER, and it is 3×.** Published **72 N/m²**
> (Chatterjee & Templin, light-mass school) vs ANATOMY-REF §2.7's derived **≈220 N/m²** (from Witton's
> 250 kg). Same animal, same span. The wing-loading disagreement is downstream of the
> **mass** disagreement (200–250 kg vs 544 kg, ANATOMY-REF §2.7) and cannot be averaged away. For the
> game, §4.5's `[D]` sanity band of 30–80 N/m² is now bracketed on the low side by a real
> published giant-pterosaur figure at **72**.

### T8 — Where the wing attaches to the body — the silhouette lever §4 barely covers

| Finding | Value | Tag |
|---|---|---|
| **Dobsonia / Aproteles (bare-backed fruit bats): the plagiopatagium attaches at the MIDLINE OF THE BACK**, running over the dorsal fur — hence "naked-backed" | the two membranes nearly meet at the spine | `[S]` https://publication.plazi.org/GgServer/html/03AD87FAFFF6F6198CBB365BFA8BF660 · https://animaldiversity.org/accounts/Dobsonia_chapmani/ · https://australian.museum/learn/animals/bats/bare-backed-fruit-bat/ |
| Most other megabats | membranes **insert laterally**, on the flank | `[S]` same |
| Distal (hindlimb) anchor, general | wings "usually run from the shoulder region **to the ankle**, or in some cases, **to the digits themselves**" | `[S]` https://animaldiversity.org/collections/mammal_anatomy/bat_wings/ |
| Species-level variation is real and diagnostic | *Myotis lucifugus* — wing attaches at the **base of the toe**, not the ankle; this is the character separating it from *M. grisescens*. *M. davidii* — base of the **outer toe**. *M. muricola* — base of the toes | `[S]` https://animaldiversity.org/accounts/Myotis_lucifugus/ · https://en.wikipedia.org/wiki/David's_myotis |
| Development | the plagiopatagium arises as a **novel outgrowth from the body flank** that *then* merges with fore- and hindlimb; the merge is **highly conserved** | `[S]` https://link.springer.com/article/10.1186/s12915-023-01598-y |
| Functional consequence | with the membrane anchored on the hindlimb, **hip and knee motion modulate wing shape** — leg deflection is one of the four named camber controls | `[S]` https://pmc.ncbi.nlm.nih.gov/articles/PMC3522884/ |
| **Numeric planform effect (ΔAR, Δarea) of moving the anchor ankle→knee→flank** | **`unknown`** — no source quantified it | — |
| Pterosaur equivalent: the **wing-root fairing** | direct soft-tissue evidence of a fairing smoothing the wing–body junction, **made of muscle** rather than fur or feathers (unlike bats and birds), used for wing-root control and to contribute to wing elevation / anterior wing motion | `[S]` https://www.pnas.org/doi/10.1073/pnas.2107631118 (PNAS 2021) |

### T9 — Camber and twist along the span

| Figure | Value | Tag |
|---|---|---|
| **Which camber control acts where** | leg deflection → raises camber at the **INNER** wing; bending of **digit V**; raising/lowering **digit II** relative to the main surface (the leading-edge flap); **upward bending of the wing tip** | `[S]` https://pmc.ncbi.nlm.nih.gov/articles/PMC3522884/ (Leptonycteris kinematics) |
| ⇒ the spanwise division of labour | **inboard camber is LEG-driven; outboard camber is FINGER-driven** | `[D]` from the above |
| What decreases with speed | **wing area, angle of attack AND camber** all decrease as speed rises | `[S]` same |
| Twist, definition used in the literature | a **spanwise linear pitch** root→tip; twist ratio ξ = tip pitch amplitude ÷ root pitch amplitude | `[S]` https://link.springer.com/article/10.1007/s10483-014-1882-6 |
| Payoff of twist | raises mean lift by up to **25%** vs a rigid wing, and **produces thrust instead of drag** | `[S]` same |
| **Spanwise pitch actually measured** (*Hipposideros pratti*) | **upstroke: pitch increases root→tip, 100–130°. Downstroke: mid-outer wing reaches a minimum of ≈35°.** | `[S]` https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0218672 |
| **Washout in degrees, as a static geometric number** | **`unknown`** — the literature reports pitch as a time-varying kinematic, never as a fixed geometric washout | — |
| **Camber values at named span stations (root / mid / tip)** | **`unknown`** — §4.5's 0.04–0.14 c figures are whole-wing; no per-station breakdown retrieved | — |

---

## Build implications

Each row is a number from the Tables turned into an instruction. Numbers with no row here were cut.

1. **Move the wrist outboard to t ≈ 0.50–0.56.** `wristT 0.20–0.30` (§4.4) is not the bat
   proportion — the measured chain puts the wrist at **0.560** from the midline. Because
   the repo pins span at the tip vertex, raising `wristT` **shrinks the fan and grows the
   forearm**, which is exactly the correction: the current wing has a stub arm and a
   giant hand. Target hand share **44–49%**, not 76%.
2. **Place the leading-edge knuckles at t = 0.29 / 0.56 / 0.74 / 0.86, not evenly.**
   That is the whole gull-arch/ogee control polygon in four numbers. Spacing must
   **shrink** outboard (0.20 → 0.27 → 0.18 → 0.12 → 0.14). Two of the five joints live in
   the outboard 26% of the span — the tip is the busy end, not the quiet end.
3. **Make phalanx 2 longer than phalanx 1 inside every finger.** Segment ratios
   **1.00 : 0.645 : 0.771** off the metacarpal. The visual result is a *long–short–long*
   rhythm down the finger, which reads as an articulated hand; a monotone taper reads as a
   telescoping antenna. This is a real deviation from the house `0.62^i` decay law (§4.3),
   which is correct for **crest/tooth ranks** but wrong **inside a single finger**.
4. **Keep the metacarpals nearly equal (mc3:mc4:mc5 = 1.00:0.978:0.946) and open the fan
   at the knuckles.** The palm is a near-parallel block; splaying the metacarpals is the
   single fastest way to make the hand read as a rubber glove.
5. **Never straighten the elbow past ~111° while a propatagium is drawn.** At full
   extension the arm must still show ≥ ~20° of bend. This converts §4.4's qualitative "a
   straight LE is unsupported" into a rig constraint the animator can clamp.
6. **Author the propatagium at ~6% of wing area and ~0.15–0.25 of the local chord deep at
   the elbow.** It is a genuine triangular sail with a visible bulge, not piping. It also
   earns its pixels: it is the **most lift-efficient square metre of the wing** (CL/area
   2.1 vs 1.27–1.53), so an artist is entitled to make it the crisp, taut, hero-lit
   element while the plagiopatagium behind it is the soft, sagging one.
7. **Shade the inboard sheet as the soft one and the outboard bays as the tight ones.**
   The plagiopatagium is the **weakest and most extensible** region and changes length by
   **>50%** in both directions; the dactylopatagium bays are the ones held taut between
   spars. Value tiers (§4.4) should follow that, not follow distance from the body.
8. **Run the membrane's wrinkle/vein/fibre direction SPANWISE, not chordwise.** Elastin
   bundles are proximodistal in *all* bats and they are what makes the wrinkles. Combined
   with the **10:1 chordwise-stiff / spanwise-soft** anisotropy, the deformation the
   surface should show is **spanwise stretch with chordwise-running sag lines** — i.e.
   the sag ridges run along the chord, the *wrinkle* lines run along the span.
9. **Thickness cue: 39–267 µm.** At any silhouette-legible scale a real membrane has
   **no visible edge thickness** except where it wraps a bone. Give the trailing edge a
   knife-edge and put all the thickness into the spars — an extruded slab membrane is
   the single most common cheap tell this number kills.
10. **Give the wing root a fairing.** Both lineages have one; the pterosaur's is
    **muscular** and actively contributed to wing elevation. So the §4.4 "root gusset +
    scapular cowl" should read as **muscle continuous with the flank**, and it may
    legitimately **deform with the stroke** rather than staying rigid — the one part of
    the root that is allowed to move.
11. **Choose an attachment line deliberately, because it is a silhouette decision with
    real precedent at both extremes.** Flank (most megabats) → a conventional wing.
    **Spine/midline (*Dobsonia*)** → the two membranes nearly meet over the back, the
    dorsal ridge becomes the wing's origin, and the creature reads as *cloaked*.
    Distal end: ankle → widest planform; base-of-toe → the widest of all;
    knee/tibia → narrower, higher-AR. This is the cheapest large silhouette lever in the
    pack and §4 does not use it.
12. **Drive inboard camber from the LEG and outboard camber from digit V and the tip.**
    Four controls, and they are spatially separated. A single global `cup` parameter
    cannot express this; the inner bay's camber should be a function of the hindlimb pose,
    which also means the fold and the leg pose are coupled (and ANATOMY-REF §2.2's warning applies:
    that coupling is permanent).
13. **Twist the wing so tip pitch leads root pitch, and let camber COLLAPSE with speed.**
    Measured spanwise pitch spans **35° → 130°** across a stroke, increasing root→tip on
    the upstroke. At cruise the wing should be flatter, smaller in area and lower in AoA
    than at hover — §4.5 already gives the 3.5× camber change; T9 says area and AoA go
    with it, so cruise should shrink all three together, not just flatten the sag.
14. **Fold by wrist supination + elbow retraction, and expect ~35% of the inertial saving
    to be visible as the wing getting SHORTER, not thinner.** The fold shortens the span
    before it narrows the chord.
15. **Pterosaur-borrowed proportions, if a boss wants them:** humerus : radius : mcIV =
    **1.00 : 1.56 : 1.94**, wing finger ≈ **4.5–5.5 × humerus**, and mcIV + finger =
    **71–74%** of the shoulder→tip length. Note the palm bone alone is **longer than the
    forearm** — the reverse of the bat, where mc3 = 0.68 × forearm. That single inversion
    is the fastest way to make a wing read pterosaur rather than bat.
16. **Wing-loading target.** A published giant-pterosaur figure now exists: **72 N/m²**
    (and the clade runs **7 → 72**). §4.5's plausible band of 30–80 N/m² is confirmed at
    its top end by a real animal, so a stylised creature implying ~70 N/m² is the safest
    place to sit.
17. **AR: pick 7–9 and stay there.** Published anchors now: Andean condor **7.9**,
    *P. livingstonii* **6.52**, giant albatross **15.6**, storm petrel **6.5**. The
    flapper/soarer boundary at 8–9 (§4.5) sits exactly between the condor and the
    albatross — an AR of 7.9 is *measurably* the biggest bird that still flaps.

---

## What this rules out

**Kills the proportions**
- **A wrist at 20–30% of the span**, with the hand making up 70–80% of the wing. The
  measured chain says **0.56 / 44%**. A wing built that way reads as a hand on a stick.
- **Evenly spaced finger knuckles** along the leading edge. Real spacing shrinks outboard;
  two joints live in the last quarter of the span.
- **A finger whose segments shorten monotonically toward the tip.** Phalanx 2 is **19.5%
  longer** than phalanx 1.
- **A splayed, fan-shaped palm** with metacarpals of visibly different length. They differ
  by **5.4%** across three digits.
- **A pterosaur-styled wing whose palm bone is shorter than its forearm.** mcIV is
  **1.24 ×** the radius. Getting this backwards makes an azhdarchid read as a big bat.

**Kills the structure**
- **A leading edge that goes dead straight at full extension while a forward sheet is
  present.** Above **111.0°** of elbow extension the propatagium cannot exist.
- **A propatagium drawn as a 2-pixel piping strip along the arm.** Derived depth is
  **0.15–0.25 of the local chord** — a sail with a real forward bulge.
- **A wing that welds flush into the flank with no fairing.** Both lineages fair the
  junction; the pterosaur's is muscle.
- **A single-spar outer wing with a smooth, actinofibril-free membrane.** Even the spar
  wing packs **≥3 crisscrossing fibre layers**, and they are **densest at the tip** — the
  opposite of the usual instinct to detail the root and simplify the tip.

**Kills the surface**
- **A membrane with visible slab thickness at the trailing edge.** 39–267 µm. There is no
  edge.
- **A perfectly smooth membrane at rest.** Elastin bundles wrinkle it, spanwise, in every
  bat studied.
- **Wrinkle, vein or fibre lines running chordwise** (root-to-trailing-edge) as the
  dominant texture direction. They run **spanwise**.
- **A membrane that stretches chordwise more than spanwise.** It is **10× stiffer**
  chordwise. Chord-direction ballooning between the fingers is backwards; the sheet should
  stretch *along* the spars and sag *across* them.
- **A uniformly stiff-looking membrane.** The inboard armwing sheet is the **weakest and
  most extensible** part of the whole wing and moves **>50%**; the outboard finger bays are
  the taut ones. A wing whose inner sheet is drum-tight and whose outer bays flap is
  exactly inverted.

**Kills the motion**
- **A fold that thins the wing before it shortens it.** The fold retracts along the **span**
  (elbow) and supinates at the **wrist**.
- **A fixed spanwise pitch through the stroke.** Measured pitch sweeps **35° → 130°** and
  its spanwise gradient reverses between upstroke and downstroke.
- **Camber that stays constant while speed changes.** Area, AoA and camber all fall
  together as speed rises.
- **An inner-wing camber that ignores the hindlimb.** Leg deflection is a *named* camber
  control for the inner wing; if the membrane touches the leg, the leg pose is part of the
  wing shape, permanently.

---

## Still unknown

Every row was searched. The search terms are given so the next stream does not repeat them.

| Target | Status | What was searched |
|---|---|---|
| **LD5 / FL** (the "wing width" index) as a number | `unknown`. Floor established: mc5/FL = **0.642** | `LD5/FL bat wing width index`; `Ecological Morphology of Neotropical Bat Wing Structures values`; `bat digit V phalanx lengths mm`. Every hit names the index and its ecological meaning; none publishes digit-V phalanx lengths |
| Bat **digit II and IV** total lengths as ratios to FL | `unknown`. Only the metacarpals were published (mc4/FL 0.664) | as above |
| Bat forearm : humerus, **confirmed twice** | ⚠ single-pass `[S]` only (0.736), plus a passing independent span cross-check | `Pteropus vampyrus humerus radius mm`; `bat humerus forearm ratio half two-thirds`; `Swartz 1997 allometric patterning results`; `Norberg 1981 allometry humerus radius`. Swartz 1997 and Norberg 1981 are the right papers and are paywalled/unfetchable |
| ***Pteranodon* / *Anhanguera* element lengths** | `unknown` | `Bennett 2001 Pteranodon humerus wing metacarpal phalanx mm`; `Anhanguera wing finger humerus ratio`; `pterosaur wing finger percent of half span`. Only span (6.95 m) and mass (16.6 kg) surfaced |
| *Q. lawsoni* **wing phalanx** lengths | `unknown` — the paper reports humerus, r/u, mcIV, scapula, coracoid and stops | `Quetzalcoatlus lawsoni wing phalanx lengths cm Padian 2021` |
| **Membrane thickness split** plagiopatagium vs dactylopatagium | `unknown`; only the whole-wing 39–267 µm range | `bat wing membrane thickness micrometers plagiopatagium dactylopatagium regional variation` |
| **Tensile strength (MPa)** and **tear resistance** of membrane | `unknown` | `Cheney bat wing membrane tensile strength failure stress MPa`; `Swartz 1996 mechanical properties elastic modulus MPa`. Returns modulus and anisotropy, never a strength figure |
| **Actinofibril spacing / density per mm** | `unknown` — the flagship gap of §4.8 survives | `actinofibril spacing density per mm`; `Bennett Zittel actinofibrils spaced width mm apart`; `"actinofibrils" spacing "0.1 mm" OR "0.2 mm" apart per millimetre count`. All three return **diameter** (0.05–0.2 mm) and the word "densely packed" |
| **Actinofibril inter-layer angle in degrees** | `unknown` — described only as "diverging from layer to layer" | as above |
| **Roosting folded-pose joint angles** (shoulder / elbow / wrist) | `unknown` | `bat wing folded at rest length percentage extended roosting elbow wrist angle degrees`; `bat wing joint range of motion degrees`; `Riskin quantifying complexity joint angles`; `Hipposideros canonical kinematics elbow wrist angle degrees`; `bat glenohumeral mobility degrees`. Qualitative every time |
| **Folded span ÷ extended span** | `unknown` for the roost. For flight, the metric exists (**span ratio**) but no value was retrieved | `bat span ratio upstroke downstroke value`; `bat wingspan reduction upstroke percent` |
| **Shoulder / wrist / MCP ROM in degrees** | `unknown`. Only structural DOF counts (**5** at the glenohumeral, **>20** per wing) | as above |
| **Wandering albatross wing loading** as a published N/m² | `unknown`. AR **15.6** closed | `Pennycuick wing loading N m-2 Diomedea exulans`; `Warham 1977 albatross wing loading table`; `Wind Waves and Wing Loading nine species values` |
| **Andean condor wing loading** | `[no-assert]` — a "≈4.5 kg/m²" figure surfaced and is **~40% below** the PNAS California-condor 70.6 N/m²; do not use either as *the* Andean figure. AR **7.9** closed | `McGahan 1973 gliding flight Andean condor wing loading aspect ratio` |
| ***Pteranodon* wing loading** as a published number | `unknown`; `[D]` ≈30 N/m² from span+mass at AR 9 | `Pteranodon wing area aspect ratio wing loading Bramwell Whitfield 1974` |
| **Largest flying foxes** (*P. neohibernicus*, *P. vampyrus*) AR and WL | `unknown`. Closest published: *P. livingstonii* 6.52 / 25.8 N/m² | `Norberg Rayner 1987 Pteropus vampyrus wing loading aspect ratio`; `flying fox wing loading largest megabat N/m2` |
| **Static washout in degrees**, and **camber at named span stations** | `unknown` | `bat wing spanwise twist washout degrees root tip`; `bat wing camber varies along span proximal distal values` |
| **Planform effect of moving the hindlimb anchor** (ankle → knee → flank), numerically | `unknown` — the *qualitative* variation is well sourced (T8), the ΔAR is not | `bat plagiopatagium attaches ankle knee flank families`; `Myotis wing membrane attached base of toes ankle diagnostic` |
| **Absolute airspeed at which the trailing edge flutters** (§4.5's open item) | `unknown` — not re-attempted this pass; §4.5 already establishes it is governed by a dimensionless number, so an absolute speed may not exist as a published quantity | — |
