# F1 — The FIRE-dragon WING

Stream F1 of the Wing Lab. Subject: **one wing of a western fire dragon** — specifically,
**where heat LIVES in that wing**. Scope: what `DRAGON-ANATOMY-REFERENCE.md` §7
(hot-material appearance physics) does **not** cover, applied to a membrane wing.
§7 is assumed read; it is cited as `§7.x` where it consumes a finding here. Nothing in
§7 is restated.

**Status: complete.** Written incrementally so a container restart could not wipe it.

## §0 Provenance note

`WebFetch` is **blocked by the network egress proxy** in this environment
(`EGRESS_BLOCKED` confirmed on `pmc.ncbi.nlm.nih.gov`, `arxiv.org`). Every `[S]` below was
retrieved through **`WebSearch` result summaries of named URLs**, same convention as
`art/A1-visual-language.md` §0: `[S]` + URL means a real retrievable source; text in
"double quotes" is verbatim as the search index returned it; unquoted text is the index's
paraphrase of that page — the claim is sourced, the wording is not the author's.

---

## Headline — the five findings that most change what the wing looks like

**1. A real wing is a RADIATOR, and a radiator is mostly COLD.** Infrared thermography of
*Rousettus aegyptiacus* in level flight: **34 °C at the forearm muscle mass, under 24 °C at
the trailing edge, and "the majority of the wing was 1–2 °C above ambient"** (ambient 23 °C)
`[S]` https://www.sciencedirect.com/science/article/abs/pii/S0306456596000393. The heat is
**not spread over the membrane. It is concentrated at the root armature and it falls off
along the span.** ⇒ **The fire wing's emissive budget is a proximal wedge, not a wash.**
The trailing edge — where every cheap fire dragon puts its brightest line — is in life
**the coldest tissue on the animal.**

**2. Heat lives in DISCRETE WINDOWS WITH HARD EDGES, not in a gradient.** On the closest
real analogue to a wing membrane — the elephant pinna — infrared thermography finds
"distinct and sharply delimited hot sections", and on the ear specifically **"the thermal
window is delimited by an abrupt skip of temperature"**, unlike windows elsewhere on the
body which "are surrounded by thermal transition zones whose temperatures decline towards
their borders" `[S]`
https://www.sciencedirect.com/science/article/abs/pii/S0306456510000276. Bats have the
same thing: a **hairless, highly vascularised "radiator" on the proximal ventral wing and
flank**, flushed with warm blood when hot and **shunted dry when cold** `[S]`
https://academic.oup.com/icb/article/50/3/358/616154. ⇒ **The glow is a set of
crisp-bordered patches that switch, not a soft gradient that fades.**

**3. The recruitment order is ROOT FIRST, TIP LAST — and it is a switchable state, not a
constant.** Toco toucan bill, thermal imaging: **below 16 °C the radiator is OFF**; between
16–25 °C **the part nearest the body starts dumping heat and runs ~6 °C above ambient**; only
**at ≥25 °C does the distal end join in, at up to 4 °C above ambient** `[S]`
https://www.science.org/doi/10.1126/science.1175553. ⇒ **The fire wing has a documented
ignition sequence: root patches light first and brightest, the outer wing lights only under
load, and the tip is the first thing to go dark.**

**4. A hot translucent membrane is BRIGHTEST EDGE-ON — the exact inverse of a hot seam.**
Emissivity of a **semi-transparent** slab, unlike an opaque one, "is strongly affected by a
change in the thickness" `[S]`
https://www.sciencedirect.com/topics/physics-and-astronomy/emissivity. Kirchhoff +
Beer–Lambert give **ε(θ,d) = 1 − exp(−α·d / cos θ)** `[D]`: the same membrane emits weakly
face-on and approaches a blackbody at grazing angles and wherever it thickens (spar roots,
folds, the doubled propatagium). §7.4 dials seam emissive by `dot(N,V)^k` — **the membrane
must be dialled by the OPPOSITE function.** Seams flare when they face you; the membrane
flares when it turns edge-on. **That single opposition animates the whole wing through a flap
cycle for free.**

**5. Embers get HOTTER when they detach.** Firebrand surface temperature rises with airflow:
**750 °C at 1 m/s to 950 °C at 4 m/s, maximum ~1100 °C** `[S]`
https://doi.org/10.1071/WF25021, and a firebrand's **windward face runs ~1200 °C while its
lee face runs ~700 °C** `[S]` (same review). Real firebrands are **cylinders ~3–4 mm across
and 40–53 mm long** `[S]`
https://www.sciencedirect.com/science/article/abs/pii/S0379711223000681 — **aspect ratio
≈ 10–13 : 1** `[D]`. ⇒ **Embers off this wing are short bright RODS aligned to airflow, with
a hot windward end and a dark lee end, that BRIGHTEN for the first fraction of their life
before they decay.** Not round dots that fade monotonically.

---

## Tables

### T1 — Where heat lives in a wing (thermal biology of membrane radiators)

| Quantity | Value | Tag | Source |
|---|---|---|---|
| Fraction of flight energy that becomes waste heat | **> 80 %** | `[S]` | bat thermoregulation literature, via https://www.pnas.org/doi/10.1073/pnas.2103745119 |
| Wing surface temp, flying *Rousettus aegyptiacus*, IR thermography | **34 °C at forearm muscle mass → < 24 °C at trailing edge**; ambient 23 °C; "the majority of the wing was 1–2 °C above ambient" | `[S]` | Lancaster/Speakman, *J. Thermal Biology*, https://www.sciencedirect.com/science/article/abs/pii/S0306456596000393 |
| ⇒ Span fraction that is measurably hot | **root armature only**; the membrane sheet is within **2 °C of air** | `[D]` from the row above | — |
| Root-to-edge ΔT across one wing | **≥ 10 °C** (34 → <24) | `[D]` | same |
| Forearm muscle vs. core temp, at rest | **4–6 °C cooler** | `[S]` | Rummel et al. 2019 *Biol. Lett.* https://royalsocietypublishing.org/doi/10.1098/rsbl.2019.0530 |
| Forearm muscle vs. core temp, **in flight** at Ta 22 °C | **~12 °C cooler** | `[S]` | same |
| Direction of the gradient | **steep proximal → distal**; "the largest temperature gradient from core to locomotor muscle for active endotherms reported to date" (27 species) | `[S]` | *iScience* 2025, https://www.cell.com/iscience/fulltext/S2589-0042(25)01912-1 |
| Location of the bat "radiator" / thermal window | **proximal VENTRAL wing surface + flank**, hairless, highly vascularised; present only in Molossidae | `[S]` | Reichard et al. 2010 *ICB* https://academic.oup.com/icb/article/50/3/358/616154 ; micro-CT https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.22423 |
| Window control law | flushed with warm blood when hot; **blood shunted away and heat conserved when cold** | `[S]` | same |
| Window **border sharpness**, elephant pinna | **"abrupt skip of temperature"** at the edge — no transition zone (unlike windows on the trunk/body, which have declining transition zones) | `[S]` | Weissenböck et al. 2010 *J. Therm. Biol.* https://www.sciencedirect.com/science/article/abs/pii/S0306456510000276 |
| Window **location bias** on a membrane appendage | most frequent in the **distal, then medial, regions of the ear** | `[S]` | same |
| Window **count vs. load** | frequency of thermal windows **increases with ambient temperature** (and body weight) | `[S]` | same |
| Heat dumped through the ear membranes | **> 30 % of excess heat** (African elephant) | `[S]` | https://asknature.org/strategy/skin-fine-tunes-internal-temperature/ |
| Radiator recruitment order (toucan bill) | **< 16 °C: OFF. 16–25 °C: proximal only, ~+6 °C over ambient. ≥ 25 °C: distal end joins, up to +4 °C** | `[S]` | Tattersall et al. 2009 *Science* https://www.science.org/doi/10.1126/science.1175553 |
| Dynamic range of a vascular radiator | heat loss = **25 % → 400 % of resting heat production** — "the largest range so far observed in nature" | `[S]` | same |
| Core temp swing across a flight | rectal **36.8 °C at emergence → 34.4 °C on return** | `[S]` | https://pubmed.ncbi.nlm.nih.gov/21034204/ |
| Dominant heat-loss mode from wings in flight | **radiative to the sky, not convective** — free-ranging *T. brasiliensis* "do not dissipate heat from their wings by convection but instead dissipate radiative heat to the cloudless night sky" | `[S]` | same |

### T2 — What the heat map actually looks like (vascular morphology)

| Quantity | Value | Tag | Source |
|---|---|---|---|
| Vessel pairing | **every vein is closely accompanied by an artery**; mean **vein : artery diameter ≈ 3 : 2** | `[S]` | Wharton Jones 1852, *Phil. Trans. R. Soc.* https://royalsocietypublishing.org/doi/10.1098/rstl.1852.0011 |
| ⇒ Vessel lines are **doubled**, not single | a wide line and a narrow line running together at ~0.67 width ratio | `[D]` | — |
| Named large vessel on the leading edge | the **cephalic vein runs along the leading edge of the antebrachial membrane (propatagium)** | `[S]` | same |
| Vessel calibre hierarchy visible in wing tracings | thickest traced vessels are **~2× the thickness** of the next rank | `[S]` | vessel tracing, *P. pipistrellus*, https://www.researchgate.net/figure/Bat-wing-anatomy-Top-Blood-vessel-tracing-for-common-pipistrelle-P-pipistrellus_fig2_333981232 |
| Wing veins have **valves** and are **autorhythmically contractile** | spontaneous "vasomotion" was **first described in the vein of the bat wing** | `[S]` | https://royalsocietypublishing.org/doi/10.1098/rstl.1852.0011 ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8924506/ |
| **Vasomotion rate**, isolated bat wing venules, no flow, 10 cmH₂O | **20–40 cycles / min** = **0.33–0.67 Hz** `[D]` | `[S]` | https://journals.physiology.org/doi/abs/10.1152/ajpheart.1993.264.4.H1174 |
| Vasomotion vs. pressure | pressure 3 → 10 cmH₂O: **frequency rises, amplitude falls**; pressure drop: frequency falls, amplitude rises | `[S]` | https://pubmed.ncbi.nlm.nih.gov/2733605/ |
| Vasomotion vs. flow | starting flow causes a **delayed, gradual reduction of amplitude and/or frequency, "sometimes to zero"** | `[S]` | https://journals.physiology.org/doi/abs/10.1152/ajpheart.1993.264.4.H1174 |
| ⇒ Pulse behaviour under load | **at rest the vessels pulse at ~0.3–0.7 Hz; under flow (exertion) the pulsing damps out and the line goes steady** | `[D]` | — |

### T3 — Repeated heating: temper film, char, ash

| Quantity | Value | Tag | Source |
|---|---|---|---|
| Steel temper series (coarse, incl. the endpoint §7.1b stops short of) | golden **200–240 °C**, red **240–270 °C**, violet **280 °C**, blue **290 °C**, **grey above 360 °C** | `[S]` | https://www.machinemfg.com/temperature-and-color-chart/ ; https://www.eng-atoms.msm.cam.ac.uk/VideoFolder/Tempering%20Steel |
| Mechanism | genuine **thin-film interference** in an iron-oxide film; two reflections (film top / metal beneath) interfere; **film thickens with temperature *and with time*** | `[S]` | http://www.phase-trans.msm.cam.ac.uk/2008/Oxide/Oxide.html |
| ⇒ **Time-dependence is the new lever** | at equal peak temperature, **the surface that has been hot LONGEST is further along the series.** Temper colour therefore encodes *heat history*, not just current temperature | `[D]` | — |
| ⇒ Spatial ordering outward from any hot line on a metallic spar/claw | **grey-black (>360) → blue (290) → violet (280) → red-brown (240–270) → golden (200–240) → unaffected** | `[D]` | — |
| Char layer thickness on a torched wood surface | **≈ 3 mm** | `[S]` | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6266808/ |
| Char layer character | "hydrophobic, cross-linked and aromatic but also **porous and brittle**" | `[S]` | same |
| Deep-char surface morphology | torch until the surface layer **cracks into "alligator skin"** | `[S]` | https://engineerfix.com/why-do-you-burn-wood-when-building/ |
| Scorch vs. char | **scorch = shallow, regulated, flame passed quickly**; **char = the flame held until the layer cracks to depth.** Same fuel, different dwell | `[S]` | same |
| Soot vs. char vs. ash placement | flame travelling up a surface "**scorches it and spreads soot and char around the burn site**"; the region the flame never touched is "**covered in a thin layer of soot and ash**" | `[S]` | same |
| ⇒ The three-zone burn map on any surface | **contact zone = cracked char · flame-lick zone = scorch · beyond the flame = thin soot/ash dusting.** Three materials, three roughnesses, one continuous story | `[D]` | — |

### T4 — Ember / firebrand behaviour

| Quantity | Value | Tag | Source |
|---|---|---|---|
| Firebrand geometry (Douglas-fir, 2.6 m / 5.2 m trees) | **3 mm dia × 40 mm long / 4 mm dia × 53 mm long**; "for all experiments performed, the firebrands were **cylindrical in shape**" | `[S]` | https://www.sciencedirect.com/science/article/abs/pii/S0379711223000681 |
| ⇒ Ember aspect ratio | **≈ 10–13 : 1 rods**, not points | `[D]` | — |
| Firebrand mass | mostly sub-gram; up to **3.5–3.7 g** for the largest | `[S]` | same |
| Size class that dominates the shower | "**Millimeter scale firebrands make up a significant fraction** of firebrands generated" (ponderosa pine, Douglas fir, grasses) | `[S]` | https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=907530 |
| **Glowing surface temperature vs. airflow** | **750 °C at 1 m/s → 950 °C at 4 m/s; maximum up to 1100 °C** | `[S]` | *Review of thermal behaviour of firebrands*, https://doi.org/10.1071/WF25021 |
| **Temperature across ONE ember** | simulated **wind-facing ~1200 °C, middle ~1000 °C, lee face ~700 °C** | `[S]` | same |
| ⚠ Contradiction in the literature | one wind-tunnel study reports "**no significant trends for firebrand average size and glowing surface temperature** … with wind velocity", and no variation in mass/size distribution across wind speeds — while the review above reports a clear temperature/airflow trend | `[no-assert]` on the *magnitude*; the directional claim is `[S]` in the review | https://doi.org/10.1071/WF23151 |
| Flame → glow transition | with **0.5 m/s** airflow "the air flow blew off the flame gradually, producing a **glowing ember at approximately 70 s** after ignition"; at zero airflow the ember **stayed flaming** | `[S]` | https://www.researchgate.net/publication/314207295_Effects_of_Fuel_Composition_and_Size_on_Ember_Generation_Characteristics_for_Wildland_Fire_Applications |
| Ember particle speeds observed | **0.1 – 10.5 m/s** | `[S]` | https://www.sciencedirect.com/science/article/abs/pii/S0168192323005294 |
| Burnout time | "**mean values of a few seconds to minutes** are typical in light to moderate fuels"; 30 km spotting implies ~30 min burnout for the extreme tail | `[S]` | same |
| Generation rate vs. size | **small-diameter fuel produces embers ~5× faster** than large-diameter | `[S]` | https://www.researchgate.net/publication/314207295_Effects_of_Fuel_Composition_and_Size_on_Ember_Generation_Characteristics_for_Wildland_Fire_Applications |
| ⇒ Ember colour ramp, via §7.1a | 700 °C ≈ dull/cherry red · 950 °C ≈ clear cherry→orange · 1100–1200 °C ≈ deep orange clipping toward white | `[D]` from §7.1a `[S]` bands | — |

### T5 — Heat shimmer: the real magnitude

| Quantity | Value | Tag | Source |
|---|---|---|---|
| Refractive index of air | **n ≈ 1.0003**, and "changes to **1.0002** when the temperature is increased by 100 °C" | `[S]` | https://sciencedemonstrations.fas.harvard.edu/presentations/schlieren-optics |
| Gladstone–Dale coefficient for air | **≈ 2.3 × 10⁻⁴ m³/kg**; refractive index is **linear in gas density** | `[S]` | same |
| ⇒ (n−1) scales as **1/T** at constant pressure | at 15 °C, n−1 = 2.77 × 10⁻⁴; at **1000 °C (1273 K)**, n−1 = 2.77e-4 × 288/1273 = **0.63 × 10⁻⁴** | `[D]` | — |
| ⇒ **Δn across the boundary layer of a 1000 °C surface** | **≈ 2.1 × 10⁻⁴** | `[D]` | — |
| ⇒ Ray deflection ε ≈ (Δn/δ)·L, δ = shear-layer thickness, L = path through the plume | δ = 5 mm, L = 0.3 m ⇒ **ε ≈ 0.013 rad ≈ 0.7°** as a *coherent-gradient upper bound*; turbulent sign-cancellation over N eddies reduces RMS by ≈ √N, giving a realistic **0.05–0.3°** | `[D]` | — |
| ⇒ **On-screen displacement** at 60° horizontal FOV, 1920 px (1° = 32 px) | **≈ 1.6 – 10 px**; the coherent bound is ~22 px | `[D]` | — |
| Plume structure | **laminar and "sharply bounded" directly above the hot object**, becoming turbulent downstream — "turbulent thermal layers causing the observed twinkling" | `[S]` | https://opg.optica.org/ao/upcoming_pdf.cfm?id=283508 ; https://sciencedemonstrations.fas.harvard.edu/presentations/schlieren-optics |
| Bend direction | light is "continuously refracted **towards the denser region**", i.e. **toward the cooler air** — a large gradient over a short distance "will deflect a wavefront towards the cooler air" | `[S]` | same |
| **Flicker rate** of a buoyant hot plume: Strouhal–Froude scaling | **St = 0.56 · Fr^−0.5** for puffing pool fires, with St = fD/V and Fr = V²/gD | `[S]` | https://link.springer.com/chapter/10.1007/978-1-4020-8682-3_11 ; https://www.sciencedirect.com/science/article/abs/pii/001021809390090P |
| ⇒ **Puffing frequency in closed form** | fD/V = 0.56·√(gD)/V ⇒ **f = 0.56·√(g/D) = 1.75 / √D  Hz** (D in metres) | `[D]` from the row above | — |
| ⇒ Flicker band for wing-scale hot patches | D = 0.3 m → **3.2 Hz** · D = 0.6 m → **2.3 Hz** · D = 1.0 m → **1.75 Hz** · D = 2.0 m → **1.2 Hz** | `[D]` | — |
| Measured puffing range (small/lab scale) | **3 – 22 Hz** | `[S]` | https://www.mdpi.com/2073-8994/16/3/292 |
| ⚠ Applicability caveat | the correlation is for **buoyancy-dominated plumes in still air.** A wing in cruise sits in a strong crossflow, which sweeps and stretches the plume; treat 1.75/√D as the **hover/idle rate and a lower bound on cruise**, `[no-assert]` for the crossflow case | `[no-assert]` | — |

### T6 — Backlit membrane × internal heat (the interaction nobody has costed)

| Quantity | Value | Tag | Source |
|---|---|---|---|
| Emissivity of an **opaque** body vs. thickness | unchanged | `[S]` | https://www.sciencedirect.com/topics/physics-and-astronomy/emissivity |
| Emissivity of a **semi-transparent** body vs. thickness | "**strongly affected by a change in the thickness**"; very thin films transmit, reducing effective emissivity; as thickness grows absorption dominates and emissivity rises | `[S]` | same, and https://www.researchgate.net/publication/229926557_The_Emissivity_of_Transparent_Materials |
| ⇒ **The membrane emission law** | Kirchhoff (ε = α) + Beer–Lambert ⇒ **ε(θ, d) = 1 − exp(−κ·d / cos θ)** — emission grows with **thickness** and with **obliquity of view** | `[D]` | — |
| ⚠ Honest note | one search paraphrase claimed "as incidence becomes grazing, the effective optical path **shortens**". For a plane-parallel slab that is wrong (path = d/cos θ, which *lengthens*). I am asserting the derivation, not that paraphrase | `[D]`, flagged | — |
| **Transmission colour of blood-perfused tissue** | the **"optical window" is ~650–950 nm**: its lower bound "is set by **hemoglobin absorption**", its upper bound by water. Below 600 nm hemoglobin and melanin "absorb light energy aggressively"; blue "is absorbed almost immediately **within the first millimetre of skin**" | `[S]` | https://fnirs.org/courses/introduction-to-fnirs/lessons/the-optical-window/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC5118607/ |
| ⇒ **The coincidence that makes this design work** | a backlit vascular membrane transmits **deep red** for purely biological reasons, and a cooling emitter *emits* deep red for purely thermal reasons. **Transmission and emission land in the same hue family** — so the same wing can be lit by the sun *and* by its own heat without the two reads fighting | `[D]` | — |

### T7 — The non-emissive value structure: ash against char

| Quantity | Value | Tag | Source |
|---|---|---|---|
| **Wood-ash hemispherical albedo** | **4.89 – 35.36 %** | `[S]` | measured albedos of dust analogues, *A&A* 2024, https://www.aanda.org/articles/aa/full_html/2024/06/aa49573-24/aa49573-24.html |
| **Charcoal hemispherical albedo** | **0.35 – 4.08 %** | `[S]` | same |
| Ratio | ash is "**approximately 8 times more reflective than charcoal**" on the sample means; on the extremes the ratio is **~100 : 1** | `[S]` / `[D]` for the extremes | same |
| ⚠ Sharpens §7.6 | §7.6 floors char at linear 0.020–0.045. The measured charcoal range **runs an order of magnitude lower at the bottom (0.0035)** — deep char is darker than the PBR "never below 4 %" habit allows, and that lower bound is measured, not stylised | `[S]` | same |
| ⇒ **The finding** | **A wing can carry a 10–100× value ratio with ZERO emissive pixels**, purely by putting ash where ash goes and char where char goes. Ash is the cheapest light in the whole design | `[D]` | — |

### T8 — The western fire-dragon canon, read at the WING

| Dragon | What the source actually says about the wing / fire | Tag | Source |
|---|---|---|---|
| **Smaug** (Weta) | Fire development "**start[ed] with the internal glow inside his chest and neck**"; the fire "**telegraphs a buildup process and not something that erupts instantaneously**"; the direction was, "**when he's angry you can play up the flaring — that sense of a furnace**." **The wing is not a light source; it is one of nine secondary simulation elements, listed as "wing membrane wrinkles."** | `[S]` | https://www.awn.com/vfxworld/weta-breathes-fire-menacing-dragon-hobbit ; https://www.fxguide.com/fxfeatured/meet-smaug/ |
| **Drogon** | "**black and red colored scales, and red-black wings**" — the fire read is pigment, not emission | `[S]` | https://en.wikipedia.org/wiki/Drogon |
| **Balerion the Black Dread** | "**Balerion's scales and wings were black**"; his flame "could melt steel and stone, and fuse sand into glass." **The hottest dragon in that canon has the least luminous wing.** | `[S]` | https://awoiaf.westeros.org/index.php/Balerion |
| **Ancalagon the Black** | "the mightiest **winged fire-dragon** that ever existed", wingspan "capable of blotting out the sun." **Named for blackness; the wing's job is to be an eclipse.** | `[S]` | https://tolkiengateway.net/wiki/Ancalagon ; https://en.wikipedia.org/wiki/Ancalagon_the_Black |
| **Rathalos** ("the Fire Wyvern") | "outer plating features **bright and vibrant red colors** while the **underside of their wing membranes are adorned with intricate, ornate BLACK patterns**"; "**flame patterns on the membranes**"; the MH3 redesign made the wings **larger, more fan-shaped, and the patterns bigger** | `[S]` | https://monsterhunter.fandom.com/wiki/Rathalos ; https://monsterhunterwiki.org/wiki/Rathalos |
| **Fáfnir** | Norse dragons (*ormr / dreki / linnormr*) are "**typically wingless and serpentine**"; Fáfnir is "heavily scaled and more of a serpent-like creature" | `[S]` | https://en.wikipedia.org/wiki/F%C3%A1fnir ; https://www.thevikingherald.com/article/who-was-fafnir-the-dragon-in-norse-mythology/1064 |
| ⇒ | **Fáfnir contributes NO wing precedent.** The fire dragon's wing is a **western/heraldic** import; there is no Norse wing tradition to honour or violate | `[D]` | — |
| **Heraldic dragon** | "The wings of the dragon are **always represented as the wings of a bat, with the long ribs or bones carried to the base**"; "great **leathern** bat-like wings **armed with sharp hook's points**"; the wings are "**always 'endorsed,' that is, elevated and back to back**." Earliest heraldic dragons had **feathered** wings; modern depictions favour bat-like | `[S]` | Fox-Davies, *A Complete Guide to Heraldry* ch.13, https://en.wikisource.org/wiki/A_Complete_Guide_to_Heraldry/Chapter_13 |
| ⇒ **What the fire-associated canon SHARES at the wing** | (1) **the wing is the dark mass, not the light source** — five of six are explicitly black or black-and-red; (2) **the warm colour lives on the PLATING and the membrane's ornament is dark** (Rathalos inverts the naive scheme exactly); (3) **glow is INTERNAL and INTERMITTENT, a rage state that builds** (Smaug); (4) **spar ribs are carried all the way to the base and terminate in hooks** (heraldry); (5) the silhouette job is **eclipse / shadow**, not lantern | `[D]` from the rows above | — |

### T9 — The restraint budget: how much of the wing may glow

| Anchor | Value | Tag | Source / step |
|---|---|---|---|
| **Biological anchor** | in a flying bat, only the **proximal armature** exceeds ambient by >10 °C; "**the majority of the wing was 1–2 °C above ambient**" | `[S]` | T1 |
| ⇒ biological "hot fraction" of wing area | the **root wedge plus the vessel lines** — everything else is within 2 °C of the air it is flying through | `[D]` | T1 |
| **Design-tradition anchor** | the **60-30-10 rule**: the accent — "a bolder, more vibrant hue that adds a pop" — is capped at **10 % of the composition** | `[S]` | https://www.freecodecamp.org/news/the-60-30-10-rule-in-design/ |
| **Canon anchor** | the shipped fire dragons carry **0 % emissive wing area**; Smaug's is internal and event-driven | `[S]` | T8 |
| **Inherited ceiling** | §7.6 L1 caps clipped-white at **≤3 % of the creature's screen area** | `[S]`/`[D]` in §7.6 | — |
| ⇒ **THE F1 WING BUDGET** — fraction of ONE WING's projected area | **cruise: 3–6 % emissive above the char field. Exertion / power stroke: up to 12 %. Ignition burst: 15 % hard ceiling, for ≤0.8 s. Clipped-white: ≤1 % of wing area at ALL times** | `[D]`, defended below | — |
| Why **1 %** and not §7.6's 3 % | §7.6's 3 % is a budget for **one creature in one frame**. This wing is **on screen 100 % of the time, on both sides of the player, for the whole session** (00-BRIEF). Two wings at 3 % each is 6 % of the frame permanently clipped — a **lamp the player stops seeing.** Halving the per-wing clip keeps the ignition burst legible as an *event* | `[D]` | — |
| The withholding mechanism | the bat radiator is on the **proximal VENTRAL** surface `[S]` (T1). In a rear-chase camera the **dorsal** face is what the player sees at cruise. **Putting the glow on the ventral face means the wing's emissive area is mostly hidden until the dragon banks or the wing rolls over at the top of the upstroke** — an anatomically sourced version of `DRAGON-DESIGN.md`'s withheld-component glow | `[D]` from `[S]` | — |

---

## Build implications

### B1 — The heat map has exactly three zones. Name them, budget them, and never blend them.

| Zone | Where, in wing terms | Shape | §7.1a band | Post-tonemap value | Share of wing area |
|---|---|---|---|---|---|
| **A — the forge window** | **proximal VENTRAL plagiopatagium + the flank it tucks against** — the anatomical radiator `[S]` T1 | **ONE crisp-bordered patch** (elephant "abrupt skip of temperature" `[S]`), roughly the triangle bounded by humerus, body wall and the first spar | **1,200–1,300 °C** — deep orange clipping to white | core clipped, rim 0.55–0.75 | **2–4 %** |
| **B — the vasculature** | **doubled lines** (vein + artery, widths **3 : 2** `[S]` T2) running root→outward, hugging the leading edge (cephalic vein `[S]`) and the spar roots, **terminating before 60 % span** | **branching lines that TERMINATE, never close loops** (§7.3's G3 law) | **900–1,100 °C** proximal → **650–800 °C** at their ends | 0.20–0.30, saturation peaking here | **1–3 %** |
| **C — the cold sheet** | **everything else**: the interdigital membranes, the whole distal third, the entire trailing edge | no emission at all | — | char, linear **0.0035–0.041** | **93–97 %** |

**The appearance statement:** *this wing is a dark leaf with a glowing root and a few glowing
veins, and the glowing part is on the side the player mostly cannot see.*

### B2 — Put the glow on the UNDERSIDE, and let the flap reveal it.

The anatomical radiator is **proximal and ventral** `[S]` (T1). A rear-chase camera looks at the
**dorsal** face during cruise. ⇒ **Author zone A and most of zone B on the ventral surface only.**
At cruise the wing is a black silhouette; at the top of the upstroke and through every bank the
ventral face rolls into view and the furnace flashes. This is `DRAGON-DESIGN.md`'s withheld
component glow with an anatomical citation behind it, and it costs one extra material slot.

### B3 — The membrane and the seams must be dialled by OPPOSITE view-angle functions.

§7.4 dials seam emissive by `saturate(dot(N_seam, V))^k`, k ≈ 2–3 — seams flare when they face
you. A semi-transparent hot slab does the reverse: **ε(θ,d) = 1 − exp(−κ·d / cos θ)** `[D]` (T6).
⇒ **Membrane emissive multiplier = `1 − exp(−κ·d / max(dot(N,V), 0.08))`**, with `d` driven by an
authored thickness map (thick at spar roots, at the folded propatagium, at the wrist gusset; thin
in mid-panel). Practical clamp: κ·d tuned so the membrane sits at **0.15 of full emission face-on
and 0.9 at 8° grazing.** Result: **each wing brightens as it sweeps through the edge-on part of
the stroke and dims at the extremes** — free per-frame animation, physically correct, and it makes
the two wings anti-phase with each other during a bank.

### B4 — Backlighting and self-emission agree on hue. Exploit the coincidence.

A blood-perfused membrane transmits in the **650–950 nm optical window** — its short-wavelength
bound is set by haemoglobin, and blue "is absorbed almost immediately within the first millimetre"
`[S]` (T6). ⇒ **transmitted sunlight through this membrane is deep red-orange**, the *same hue
family* as the cool end of the §7.2 ramp. Build consequence: **one warm transmission colour serves
both the sun-behind case and the self-heat case**, so the wing never shows two fighting reds.
Author transmission at hue ~12–20°, and let the emissive ramp start where transmission ends —
they are a continuous ladder, not two systems. **This is the single richest cheap win in the wing:
a sun behind the dragon lights the membrane for free, in the fire palette, with no emissive
budget spent at all.**

### B5 — Three incommensurate rhythms. This is how the wing escapes the metronome tell.

| Rhythm | Rate | Source |
|---|---|---|
| **Vessel pulse** (zone B brightness) | **0.33–0.67 Hz** | bat wing venule vasomotion, 20–40 cycles/min `[S]` T2 |
| **Flap** | ~1.0–1.6 Hz | `FLAP-DESIGN.md` |
| **Plume flicker** over zone A | **f = 1.75/√D** ⇒ **~2.3 Hz** for a 0.6 m window | `[D]` from St = 0.56·Fr^−0.5 `[S]` T5 |

They share no common period, so the composite never visibly repeats. **And the vessel pulse
INVERTS with effort:** flow suppresses vasomotion "sometimes to zero" `[S]` (T2). ⇒ **at idle the
veins throb slowly; under hard flapping the throb flattens out and the lines go steady and
brighter.** A sourced, counter-intuitive tell that no competitor will have.

### B6 — Recruitment, not fading. The glow switches on outward in stages.

Toucan law `[S]` (T1): OFF → proximal only → distal joins. ⇒ three authored states, not a slider:

| State | Zone A | Zone B | Emissive share of wing |
|---|---|---|---|
| **Cold / glide** | dim rim only, core dark | dark | **~1 %** |
| **Cruise** | on, crisp border | proximal half of the lines lit | **3–6 %** |
| **Power stroke / anger** | full, plus 2–4 *secondary* windows opening in the mid-panel (window count rises with thermal load `[S]`) | full length lit | **up to 12 %** |
| **Ignition burst** (≤ 0.8 s) | + the outer membrane briefly recruits | + capillary generation flashes | **15 % hard ceiling** |

Borders stay **hard in every state** — windows *appear and disappear*, they do not fade in.
Clipped-white never exceeds **1 % of wing area** (T9).

### B7 — Embers come off the THIN parts, as rods, and they brighten before they die.

- **Spawn location, sourced:** "small diameter samples produc[e] embers approximately 5× faster
  than large diameter" `[S]` (T4). ⇒ **spawn from the thinnest structures — trailing-edge
  scallops, finger tips, the membrane fringe — not from the hot root.** The root is where heat
  lives; the *edge* is where material leaves. This resolves the apparent contradiction with B1:
  **the trailing edge glows nothing and sheds everything.**
- **Shape:** rods at **10–13 : 1** `[D]` (T4), aligned to the relative-wind vector, not billboarded
  round dots. At 2–5 px that is a 1 × 4 px streak — cheaper than a round sprite, and instantly
  more "wildfire" than "sparkler".
- **Two-tone along the rod:** windward end ~**1,200 °C**, lee end ~**700 °C** `[S]` (T4) — a
  one-texel gradient from amber to deep red along the streak.
- **Non-monotonic life ramp — the finding that breaks the standard ember:** temperature rises
  with airflow, 750 °C at 1 m/s → 950 °C at 4 m/s, max ~1,100 °C `[S]`. ⇒ **spawn at cherry red,
  BRIGHTEN through the first ~15 % of life as the slipstream fans the ember, then decay
  amber → orange → deep red → out.** Every shipped ember system fades monotonically; this one
  flares first. ⚠ One wind-tunnel study reports **no significant temperature trend with wind
  speed** `[no-assert]` (T4) — so keep the flare modest (≈ +25 % peak) rather than dramatic.
- **Budget:** unchanged from §7.8 (24–40 cruise, hard cap 160) — this is *shape and ramp*, not more
  particles.

### B8 — Ash is the cheapest light in the design. Use it instead of glow.

Measured `[S]` (T7): ash albedo **0.049–0.354**, charcoal **0.0035–0.041**.
Converted to 8-bit sRGB basecolor `[D]`: **char ≈ 12–57**, **ash ≈ 63–160**.
⇒ **A 10–100× value ratio with zero emissive pixels.** Put ash where ash physically settles —
**up-facing dorsal surfaces, the windward side of every spar, the concave pockets between
fingers, and the wrist gusset** — and the wing reads as three-dimensional and burnt in flat
daylight, when no glow is visible at all. **This is what keeps the wing from being a black hole
in the daytime half of the game**, and it is the direct answer to `DRAGON-DESIGN.md`'s
flat-black-poverty failure.

### B9 — The three-zone burn map gives the membrane its surface story.

`[S]`/`[D]` (T3): **contact zone = cracked char** ("alligator skin", layer ≈ 3 mm, "porous and
brittle") · **flame-lick zone = scorch** (shallow, no cracking) · **beyond the flame = a thin soot
and ash dusting**. ⇒ On the wing: **deep alligatored char in the ventral root window and along the
spars; smooth scorch across the mid-panel; a pale soot/ash veil over the distal third and the
trailing edge.** Three roughnesses (char ~0.85–0.95, vitrified fracture faces ~0.30–0.45 per §7.6,
ash matte) mean the wing changes character across its own span under a single light.

### B10 — Temper colours ring the hot zones, and they encode HISTORY, not temperature.

The oxide film "thickens with temperature **and with time**" `[S]` (T3). ⇒ two build moves:
1. **Spatial ring:** outward from any hot line on a bone spar or claw — **grey-black (>360 °C) →
   blue (290) → violet (280) → red-brown (240–270) → golden (200–240) → bare** `[D]`. A sourced,
   *cool*, zero-luminance complement sitting directly against the ember hue, exactly as §7.6 L3
   demands.
2. **Historical read:** the spars nearest the body have been hot longest, so they sit **further
   along the series** than equally-hot outer spars. **Asymmetric weathering for free**, and a
   reason the two wings need not be mirror-identical.

### B11 — Shimmer: a real amplitude number for the vertex-wobble idiom.

§7.8 disqualifies grab-pass refraction and prescribes vertex-wobble on already-drawn background
geometry. It gives no amplitude. From T5 `[D]`: **Δn ≈ 2.1 × 10⁻⁴** across the boundary layer of a
1,000 °C surface; coherent-gradient deflection ≈ **0.7°**, realistic turbulent RMS **0.05–0.3°**
⇒ **1.6–10 px at 1920 px / 60° FOV** (~0.1–0.5 % of screen width).
⇒ **Wobble amplitude: cap at 8 px, typical 3 px**, applied only to background vertices whose
screen position falls within ~1.5 wing-chords **downwind** of a zone-A window (not above it — the
wing is in a crossflow, the plume trails aft), modulated at the **2–3 Hz** flicker band of B5, and
falling off as 1/r. **Anything larger than ~10 px is not heat, it is a bad underwater shader.**

### B12 — The one-line spec (what the director asked for)

> **Where the glow lives:** a single hard-edged window on the proximal **ventral** membrane, plus
> doubled vein-and-artery lines running out from it and dying before 60 % span, plus one warm line
> along the **leading** edge where the cephalic vein runs.
> **What shape it takes:** one patch and a few terminating branched lines — **never** a rim, never
> an outline, never the trailing edge.
> **What colour at what value:** window core clipping white from an authored **1,200–1,300 °C**
> deep-orange emitter; vein lines **900–1,100 °C** falling to **650–800 °C** at their tips;
> saturation peaking one step down from the brightest point (§7.6 L2).
> **What stays dark:** **93–97 % of the wing.** The whole dorsal face at cruise. The entire distal
> third. The trailing edge — which is the coldest tissue in a real wing, and which on this wing
> does exactly one job: **shed embers.**

---

## What this rules out

**Layout / where the light goes**
- **A glowing trailing edge, a glowing rim, or a hot outline around the membrane.** In a real
  flying wing the trailing edge is the *coldest* tissue on the animal (34 °C root → <24 °C edge)
  `[S]`. An edge-lit wing is thermally backwards and it is the single most common cheap fire-dragon
  tell. Kill on sight.
- **A membrane that glows evenly from root to tip** — "the majority of the wing was 1–2 °C above
  ambient" `[S]`. A uniform wash is a lampshade, not a radiator.
- **Soft-edged glow blobs that fade into the membrane.** The measured window boundary on the
  closest real analogue is "an **abrupt skip of temperature**" `[S]`. Feathered edges read as a
  painted texture; hard edges read as controlled blood flow.
- **Glow that lights the tip before the root.** Documented recruitment order is proximal-first,
  distal-last `[S]`.
- **Symmetric dorsal + ventral glow.** The anatomical radiator is **ventral** `[S]`; making both
  faces glow spends the whole budget on the face the player stares at all session and leaves
  nothing for the bank/upstroke reveal.
- **Glow following the spar bones as bright bars.** The vessels are *adjacent to and between* the
  spars and come in **pairs at 3 : 2 width** `[S]`; a single uniform bar on a bone is the
  flat-tape-bones cheap tell from `AAA-PIPELINE.md` in a new costume.
- **Closed loops of capillary glow.** Terminating branches only (§7.3) — a closed net is a texture
  tile.

**Amount**
- **More than ~6 % of one wing's projected area emissive at cruise, or more than 15 % ever, or
  more than 1 % clipped white at any time** (T9). Past that the wing stops being a hot creature
  and becomes a neon sign — and the canon backs the low number: **Balerion's "scales and wings
  were black"**, Ancalagon is *the Black*, Drogon's wings are red-black pigment, and **Rathalos —
  the literal Fire Wyvern — puts BLACK ornament on the membrane and the red on the plating** `[S]`.
- **A permanently-on glow.** Smaug's fire "**telegraphs a buildup process and not something that
  erupts instantaneously**" `[S]`. A wing that is always at full heat has nowhere to go when the
  dragon gets angry.

**Colour / material**
- **A cool or white-cored membrane glow.** Ruled out already by §7.2; ruled out *again* here
  because the membrane's *transmission* is pinned red by haemoglobin `[S]` — a blue-white membrane
  would contradict both the thermal ramp and the biology.
- **Neutral black char at a single value.** Measured char runs **0.0035–0.041** and ash
  **0.049–0.354** `[S]` — a wing painted at one dark value throws away a free 10–100× value
  structure.
- **Ash as a grey wash over everything.** Ash accumulates where it settles: up-facing, windward,
  concave. Ash in the sheltered pockets *only* is what makes the form read.

**Motion / FX**
- **Embers as round dots fading monotonically to black.** Real firebrands are **10–13 : 1 rods**
  `[D]` that get **hotter** when the wind hits them `[S]`.
- **Embers spawning from the hot root.** Ember production scales inversely with fuel diameter
  `[S]` — the thin edges shed, the thick hot root does not.
- **A glow that pulses in time with the flap.** Vasomotion (0.33–0.67 Hz) and buoyant flicker
  (~2.3 Hz) are both incommensurate with flap rate — locking them is the metronome tell, and flow
  actually *suppresses* the pulse `[S]`.
- **Heat shimmer larger than ~10 px** (≈0.5 % of screen width) — the physics caps the deflection
  near 0.7° even in the fully coherent limit `[D]`.
- **Shimmer directly above the wing.** The wing is in a strong crossflow; the plume trails **aft**.

---

## Still unknown

| Question | What I searched | Status |
|---|---|---|
| **Thermal-imaging of a wing membrane at vessel resolution** — do individual vessels show as discrete hot *lines* in an IR image of a live wing, and how wide? | "bat wing thermal imaging blood vessels visible hot lines", "infrared thermography superficial vein visualisation"; found whole-wing gradients (34→24 °C) and window-level patches, but **no published per-vessel thermal line profile** | `unknown` — the vessel-line glow in B1 zone B is justified by *anatomy* (vessels are there, they carry the heat) but **not by a thermal image showing the lines** |
| **Area fraction of a membrane occupied by thermal windows** | Weissenböck et al. abstract + AskNature + follow-ups; "small, independent thermal windows were abundant" is qualitative — **no % of pinna area** was retrievable without the paywalled full text | `unknown` — T9's 3–6 % is derived from the bat gradient + the 60-30-10 accent convention, **not** from a measured window-area fraction |
| **Firebrand *burnout time* as a distribution** | four searches; got "**mean values of a few seconds to minutes**" and a 30-min extreme inferred from 30 km spotting, plus a 70 s flame→glow transition at 0.5 m/s. **No size-resolved lifetime curve** was retrievable | `unknown` for the exact ramp; §7.8's 1.2–2.0 s ember life is inside the sourced band and stands |
| **Does firebrand glowing temperature actually rise with wind speed?** | The IJWF review reports 750 °C @1 m/s → 950 °C @4 m/s; a separate wind-tunnel study reports "no significant trends … with wind velocity" | `[no-assert]` — the literature disagrees. B7 keeps the flare small because of this |
| **Emissivity/absorption coefficient κ of an actual bat patagium** | "patagium optical properties", "bat wing membrane absorption coefficient", "skin membrane emissivity thin" — found only generic biological-tissue emissivity (~0.98 in the thermal IR) which is **not** the visible-band κ the shader needs | `unknown` — κ·d in B3 must be tuned by eye against the 0.15/0.9 targets |
| **Actinofibril / vessel *spacing* on the membrane** | (§4 already flags actinofibril spacing as open; the vascular equivalent is equally open) searched "bat wing vessel spacing mm density per cm²" — nothing quantitative | `unknown` |
| **Whether the ventral radiator exists outside Molossidae** | Reichard et al.: "radiators appeared present only in species in the family Molossidae" | `[S]`, and it means the ventral window is a **derived specialisation in one bat family**, not a universal — it is legitimate anatomy to borrow, but it is not "how all wings work" |
| **Heat-shimmer amplitude measured in a crossflow** | schlieren/BOS literature gives still-air plumes; found no measured deflection for a hot surface in a 30+ m/s crossflow | `unknown` — B11's numbers are the still-air upper bound |
