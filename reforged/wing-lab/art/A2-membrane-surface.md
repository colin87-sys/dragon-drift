# A2 — The Membrane Surface: Light, Translucency, and Detail

Stream A2 of the Wing Lab. Subject: **the skin of the wing and how light behaves in it.**
A1 owns silhouette, proportion, acting, damage and the art-side cheap-tell registry.
**A2 owns the SURFACE**: what the sheet is made of, what light does when it passes through it,
what is drawn on it, what its edge looks like, and the value structure across it.

> **STATUS: IN PROGRESS.** Written incrementally so a container restart cannot wipe it.

---

## §0 Provenance note

`WebSearch` is available in this environment and returns index summaries of named URLs.
`WebFetch` is attempted per-source; where it is blocked the tag says so.

Convention (matching A1 so the director can read both with one calibration):
- `[S]` + URL — real retrievable source. **Text in "double quotes" is verbatim as returned.**
  Unquoted text is the index's paraphrase — the claim is sourced, the wording is not the author's.
- `[D]` — derived, with the step shown.
- `unknown` — searched, not found. What was searched is stated.
- `[no-assert]` — the literature disagrees.

---

## §1 Headline — the five findings that most change what the wing looks like

**1. A real membrane TRANSMITS 2–4× more light than it REFLECTS — and absorbs almost all the
rest.** Measured on taut wing segments of five bat species: **albedo 0.026–0.069** (2.6–6.9 %),
**transmittance 0.077–0.194** (7.7–19.4 %), and "**transmittance exceeded albedo in all species
studied**" `[S]` Speakman & Hays 1992, *J. Thermal Biology* 17:317–321,
https://www.sciencedirect.com/science/article/abs/pii/030645659290040M. Independently, live
pteropodids **absorb a mean 0.68** of visible radiation, with prior measurements of **0.7–0.92**
`[S]` Thomson & Speakman 1999, *J. Comp. Physiol. B* 169:187–194,
https://pubmed.ncbi.nlm.nih.gov/10335616/ and https://link.springer.com/article/10.1007/s003600050210.

> `[D]` **The budget closes.** Reflect + transmit from Speakman & Hays gives absorbed =
> 1 − 0.069 − 0.194 = **0.737** at one extreme and 1 − 0.026 − 0.077 = **0.897** at the other.
> That 0.74–0.90 band sits inside the independently measured 0.7–0.92. Two papers, one number.

⇒ **The membrane is a DARK SHEET WITH A LIGHT LEAK, not a lit surface.** Its diffuse-reflection
channel — the channel almost every shipped membrane spends its entire budget on — is the
*smallest of the three*, at 3–7 %. A membrane whose look is carried by `MeshStandardMaterial`
diffuse + roughness is modelling 5 % of the physics and skipping the 15 % that reads.

**2. The transmitted colour is not an art choice — it is an exponential of thickness, and it is
computable.** Red light penetrates skin **5.4× deeper than blue**: Jensen's measured diffuse mean
free path for `skin1` is **(3.67, 1.37, 0.68) mm** RGB `[S]`
https://renderman.jp/subsurface.html (Pixar RenderMan 20 built-ins, "data values from Jensen01"),
originally Jensen, Marschner, Levoy & Hanrahan, *A Practical Model for Subsurface Light Transport*,
SIGGRAPH 2001, https://graphics.stanford.edu/papers/bssrdf/bssrdf.pdf. The physical cause is
haemoglobin: oxyhaemoglobin absorbs strongly across 400–600 nm and above 600 nm its absorption
"**decreases by more than 100-fold**", which is why 600–1300 nm is called skin's **optical window**
`[S]` (index summary over https://pmc.ncbi.nlm.nih.gov/articles/PMC11337058/ and
https://omlc.org/news/jan98/skinoptics.html — the specific page for each clause was not separable;
see §0).

> `[D]` **The derived thickness ramp** (Beer–Lambert on the `skin1` DMFP ratio 1 : 0.373 : 0.185,
> normalised so the luminance-weighted transmittance hits the measured ~0.15):
> **thin `#D59553` → nominal `#AB5416` → thick `#711600` → opaque black.**
> Hue rotates ~17° *toward red* and saturation *rises* as the sheet thickens. Full working in §2.2.

⇒ **One `exp(-thickness * sigmaRGB)` replaces every texture map anyone would author for this.**

**3. Backlit, the vein network reads as DARK branching lines inside the glow — not as glowing
veins.** Two sourced facts collide into this. (a) The visible network is predominantly **venous**:
the greatest total cross-sectional area in the whole bat-wing bed is **in the venules**, and the
venous system holds "**as much as 80 % of the total vascular volume**" `[S]` Wiedeman 1963,
*Circulation Research* 12:375, https://www.ahajournals.org/doi/10.1161/01.RES.12.4.375. (b)
**Deoxyhaemoglobin absorbs ~10× more light than oxyhaemoglobin in the 600–700 nm red band** `[S]`
(index summary, ibid.). Venous blood therefore *eats* exactly the wavelengths the membrane is
transmitting.

⇒ **`[D]` Glowing veins are backwards.** Veins subtract from the glow. And they come in **pairs** —
"muscular venules **accompanying most arterioles**" `[S]`
https://www.sciencedirect.com/science/article/abs/pii/0026286285900275 — so each vessel line is a
close *doublet*: a thicker dark venule beside a thinner, warmer arteriole.

**4. The wrinkles run SPANWISE, because elastin does.** "Wing membrane wrinkles **run parallel to
elastin fibres**"; the elastin fibres are "**approximately spanwise-oriented**" while the armwing's
embedded **muscles are chordwise**; removing the elastin "leads to a decrease in wrinkle frequency
**by an order of magnitude**" `[S]` Cheney, Konow et al., *A wrinkle in flight: the role of elastin
fibres in the mechanical behaviour of bat wing membranes*, **J. R. Soc. Interface 12(106):20141286
(2015)**, https://royalsocietypublishing.org/rsif/article/12/106/20141286/35567/. Mechanically the
sheet is anisotropic to match: "maximum stiffness and strength **parallel to the wing skeleton**,
greatest extensibility **parallel to the trailing edge**" `[S]`
https://zslpublications.onlinelibrary.wiley.com/doi/10.1111/j.1469-7998.1996.tb05455.x (Swartz
et al. 1996).

⇒ **A membrane creased chordwise (ribs running front-to-back between the fingers) is wrong in the
one direction the animal is stiffest.** The creases run root→tip, *along* the span, and they are
FINE and MANY — an order of magnitude denser than the naïve guess.

**5. The edge is a HEM, not a knife — and the bright rim on a real wing is HAIR, not membrane.**
The trailing-edge elastin bundle **widens from 35 µm to 265 µm** as it runs distally and "could act
as a '**hem**' that prevents tearing" `[S]` SICB abstract, *Life on the Trailing Edge: Muscle and
Elastin Structure in Bat Wings*, https://sicb.org/abstracts/life-on-the-trailing-edge-muscle-and-elastin-structure-in-bat-wings/.
Outside that hem sits "a '**fringe**' at the very edge of the membrane **in all species**" of
hairs `[S]` Rummel et al. 2023, *Anat. Rec.*,
https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.25176.

⇒ **`[D]` The real edge is a three-band micro-structure**: a **dark thickened cord** (7.6× thicker
than at the root, so 7.6× less transmissive), and *outside it* a **bright broken hair fringe**. A
pure-Fresnel edge glow reproduces neither and produces AAA-PIPELINE cheap-tell #4 (**chrome
outline**) exactly.

---

## §2 Tables

### §2.1 The energy budget of a membrane — the numbers that set the whole shader

| Quantity | Value | Tag |
|---|---|---|
| **Albedo** (reflectance), taut wing segment, 4 insectivorous spp + 1 pteropodid | **0.026** (*Rhinolophus hipposideros*) – **0.069** (*Plecotus auritus*) | `[S]` Speakman & Hays 1992, *J Thermal Biol* 17:317–321 |
| **Transmittance**, same animals | **0.077** (*Pipistrellus pipistrellus*) – **0.194** (*P. auritus*) | `[S]` ibid. |
| Ordering law | "**Transmittance exceeded albedo in all species studied**" | `[S]` ibid. |
| **Absorbed fraction**, live pteropodids | mean **0.68**; previously measured **0.70–0.92** | `[S]` Thomson & Speakman 1999, *J Comp Physiol B* 169:187–194 |
| Cross-check | A+T ⇒ absorbed **0.737 … 0.897** — inside the independently measured 0.70–0.92 | `[D]` |
| **Transmit : reflect ratio** | *P. auritus*: 0.194 / 0.069 = **2.8×**. Across the extremes of the sample, **1.1×–7.5×** | `[D]` |
| **Membrane thickness** | **130–300 µm** | `[S]` (index summary over https://www.biorxiv.org/content/10.1101/2023.09.11.557136v1.full.pdf and https://www.science.org/doi/10.1126/sciadv.ade7511 — the exact source page for the range was not separable) |
| Histology | **two layers of stratified squamous epithelium** separated by a thin scaffold of collagen, **linearly arranged elastin**, **skeletal muscle**, **capillaries and lymphatics** | `[S]` ibid. |
| Fibre net (plagiopatagium, *Glossophaga soricina*) | **two nearly orthogonal fibre families**, diameter **50–100 µm**, spacing **500–1500 µm** | `[S]` ibid. |
| Why it matters visually | Human skin is ~1.5–3 mm; a wing membrane is **~10× thinner**, which is why the whole dipole/thick-SSS toolkit is the wrong tool (§2.3) | `[D]` |

**The law this table forces `[D]`:** author the membrane as **≈5 % reflect / ≈15 % transmit /
≈80 % absorb**. In practice that means a **very low diffuse albedo** (the membrane is the
*darkest* element on the dragon in front light) plus a **transmission term ~3× the strength of
the diffuse term**. Any tuning session that ends with the membrane brighter than the bone in
front light has inverted the physics.

### §2.2 The spectral shift — why it goes red, with the numbers

| Quantity | Value | Tag |
|---|---|---|
| `skin1` diffuse mean free path (RGB, mm) | **3.67, 1.37, 0.68** | `[S]` RenderMan 20 built-ins "data values from Jensen01", https://renderman.jp/subsurface.html |
| `skin2` DMFP (RGB, mm) | **4.82, 1.69, 1.09** | `[S]` ibid. |
| `skin1` diffuse albedo (RGB) | **0.436, 0.227, 0.131** | `[S]` ibid. |
| `skin2` diffuse albedo (RGB) | **0.623, 0.433, 0.343** | `[S]` ibid. |
| index of refraction, both | **1.3** | `[S]` ibid. |
| `skin1` reduced scattering σs′ / absorption σa (mm⁻¹) | σs′ **0.74, 0.88, 1.01**; σa **0.032, 0.17, 0.48** | `[S]` Jensen01 Table 1, https://graphics.stanford.edu/papers/bssrdf/bssrdf.pdf (values via index summary; PDF egress-blocked) |
| `skin2` σs′ / σa (mm⁻¹) | σs′ **1.09, 1.59, 1.79**; σa **0.013, 0.070, 0.145** | `[S]` ibid. |
| **Red-vs-blue penetration** | DMFP ratio R:G:B = **1.00 : 0.373 : 0.185** ⇒ red travels **5.4× deeper than blue**, **2.7× deeper than green** | `[D]` from `skin1` DMFP |
| **Red-vs-blue absorption** | σa ratio B/R = 0.48 / 0.032 = **15×** | `[D]` from `skin1` σa |
| Physical cause (haemoglobin) | oxyHb absorbs strongly 400–600 nm; above 600 nm absorption "**decreases by more than 100-fold**". 600–1300 nm is skin's **optical window** where melanin, haemoglobin and water absorption are all minimal | `[S]` index summary, https://pmc.ncbi.nlm.nih.gov/articles/PMC11337058/ |
| Physical cause (deoxy) | deoxyHb absorbs **~10×** more than oxyHb across **600–700 nm** | `[S]` ibid. |
| Physical cause (melanin) | melanosome absorption falls monotonically with wavelength as a **power law** — so pigment darkens the sheet **and reddens it at the same time** | `[S]` qualitative, https://omlc.org/spectra/melanin/mua.html ; the **numeric exponent is `unknown` here** — omlc.org is egress-blocked and the coefficient/exponent did not come back in any index summary |

**THE DERIVED THICKNESS RAMP `[D]` — the single most useful output of this stream.**

Take Beer–Lambert through the sheet, `T(λ) = exp(−d / ℓ(λ))`, with ℓ in the measured `skin1`
ratio **1 : 0.373 : 0.185**. Scale the one free parameter `x = d/ℓ_red` until the
luminance-weighted transmittance matches the **measured** bat-wing value of ≈0.15:

| `x = d/ℓ_red` | linear RGB transmittance | luminance Y | sRGB hex | reads as |
|---|---|---|---|---|
| 0.45 (half nominal) | 0.638, 0.299, 0.087 | 0.44 | **`#D59553`** | pale amber — the taut, stretched, thinnest sheet |
| **0.90 (nominal — matches measured 0.15)** | 0.407, 0.090, 0.008 | **0.151** | **`#AB5416`** | ember orange — the main glow field |
| 1.80 (double) | 0.165, 0.008, ~0.000 | 0.041 | **`#711600`** | blood red — the deep cup and the hem |
| 3.60 (quadruple) | 0.027, ~0.000, 0 | 0.006 | **near black, faint red** | the root gusset and anywhere bone is behind |

Hue rotates **28° → 22° → 11°** as the sheet thickens; **saturation rises while value falls**.
This is exactly AAA-PIPELINE §1's core→bloom→dark ladder, except it is not an art decision —
it falls out of one exponential of a vertex attribute.

### §2.3 Thin-sheet translucency vs thick-object SSS, and the real-time menu with costs

**Why the standard SSS toolkit is the wrong tool.** Every offline skin model in wide use descends
from Jensen's **dipole**, which "assumed **smooth semi-infinite homogeneous materials**" — and that
"approximation **breaks down in the case of thin translucent slabs**" `[S]` Donner & Jensen,
*Light Diffusion in Multi-Layered Translucent Materials*, SIGGRAPH 2005,
https://dl.acm.org/doi/10.1145/1186822.1073308 and https://www.cs.jhu.edu/~misha/Fall11/Donner.Thesis.pdf.
The fix in the literature is the **multipole** — an infinite series of mirrored dipoles that
satisfies boundary conditions at **both** faces of the slab. At 130–300 µm (§2.1) a wing membrane
is the archetypal thin slab: **the physics is dominated by what leaves the far side, not by what
diffuses laterally and comes back out the near side.**

⇒ `[D]` **For a membrane, front-face lateral diffusion is negligible and back-face transmission is
everything.** That is a huge simplification and it is *why* the cheap real-time trick works well
here and works badly on a face.

| Technique | What it gets RIGHT | What it gets WRONG | Cost | Verdict for this wing |
|---|---|---|---|---|
| **Two-sided normal flip** (`gl_FrontFacing`) | back faces get lit instead of going black on a `DoubleSide` sheet | nothing — it is mandatory | **free**; three.js does it already under `#ifdef DOUBLE_SIDED` (`normal *= faceDirection`) `[S]` repo `lib/three.module.js` r160 | **mandatory, already have it** |
| **Wrap / half-Lambert** (`NdotL*0.5+0.5`) | softens the terminator; no hard black back half | **not view-dependent and not thickness-dependent** — the sheet looks like a matte balloon and reads identically with the sun in front or behind | ~2 ALU | base layer only, never the translucency |
| **Fresnel rim** `pow(1−N·V, k)` | grazing-angle brightening; extremely cheap | **view-only.** It fires the same whether the sun is behind the wing or in the camera's face. This is *exactly* AAA-PIPELINE cheap-tell **#4 chrome outline** | ~4 ALU | keep it, but **demote it**: it is the *hair-fringe + specular* term (§2.6), not the translucency term |
| **Back-translucency, Frostbite/DICE** — `L' = L + N·distort; f = pow(saturate(dot(V, −L')), p) · scale; out += albedo · lightColor · atten · (f + ambient) · thickness` | **light-direction dependent** — the wing lights up only when the sun is genuinely behind it; **thickness-modulated**; per-light | single-scatter look; no lateral bleed (which §2.3's opening paragraph says we don't need) | author's own figure: **≈13 ALU**, and "**precompute powers to eliminate the `pow()`**". Thickness "from a texture, **per-vertex**, or generated" `[S]` Barré-Brisebois & Bouchard, GDC 2011, https://colinbarrebrisebois.com/2011/03/07/gdc-2011-approximating-translucency-for-a-fast-cheap-and-convincing-subsurface-scattering-look/ ; code via http://www.klayge.org/material/4_4/SSS/Colin_BarreBrisebois_Programming_ApproximatingTranslucency.pdf | **THE RECOMMENDATION.** Zero textures, zero passes, one seam |
| Spherical-Gaussian variant of the same | replaces `pow` with `exp2`, cheaper on some hardware | same limits | fewer ALU | `[S]` https://colinbarrebrisebois.com/2012/04/09/approximating-translucency-revisited-with-simplified-spherical-gaussian/ — free upgrade if profiling asks |
| **Pre-integrated skin** (Penner) | correct *curvature*-dependent terminator softening | it pre-integrates **lateral** diffusion over a curved **thick** surface — the exact term that is negligible in a thin slab | 1 texture fetch + a LUT (a 64×64 `DataTexture` ≈ 16 KB, no file) | **wrong tool for a sheet.** Skip |
| **Screen-space SSS blur** | true lateral diffusion | needs the whole scene | **+1 full-screen depth-aware blur pass** | forbidden on the mobile profile |
| **`MeshPhysicalMaterial.transmission`** | physically refracts/absorbs the actual background | it renders **the scene into a transmission render target** every frame and builds a mip chain for roughness blur; the mesh also leaves the opaque pass | **+1 scene render + mip chain per frame** | **forbidden.** This is the single most expensive way to get a worse membrane |
| **Vertex-baked thickness** | a free per-vertex scalar that drives §2.2's exponential and the translucency `thickness` term | must be authored at build time (it is a function of the procedural wing's own parameters, so this is trivial here) | **4 bytes/vertex** (or a spare channel) | **mandatory partner** to the row above |
| Offline dipole / multipole | correct | not real time | — | ruled out; used here only as the *source of the numbers* |

**Where it splices in this repo `[D]`.** `js/dragonSurfaceShader.js` already has the right
architecture: composable patches injected after `#include <common>` (pars) and after
`#include <emissivemap_fragment>` (body). Two facts make the Frostbite term implementable there
with **no new pass and no new material**:
- `lights_pars_begin` declares `struct DirectionalLight { vec3 direction; vec3 color; }` and
  `uniform DirectionalLight directionalLights[NUM_DIR_LIGHTS]` **above `main()`**, so a *body*
  patch can read them `[S]` repo `lib/three.module.js` r160.
- `uniforms.direction` is built as `lightWorldPos − targetWorldPos` then `.transformDirection(viewMatrix)`
  `[S]` ibid. — i.e. it is the classic **L vector, in VIEW space**, the same space as `normal` and
  `vViewPosition` at that seam. All three vectors are already consistent. No new varyings.

**The one honest cost `[D]`:** a body patch at the `emissivemap_fragment` seam adds to
`totalEmissiveRadiance`, which is **not shadowed**. The wing will keep transmitting when the
dragon's own body shadows it. Either accept it (the membrane is a large thin sheet that rarely
sits fully in body shadow) or add a **third seam after `<lights_fragment_begin>`**, where
`directLight.color` already has the shadow term folded in.

**The existing `membraneSSSPatch` is a Fresnel, not a translucency `[D]`.** Its body is
`pow(1 − |dot(normal, viewDir)|, p)` — no light vector anywhere. It therefore glows identically
with the sun in front and behind, which is the chrome-outline tell, and it cannot produce §2.2's
thickness ramp. **Upgrading that one patch is the highest-yield shading change available on this
wing.**

### §2.4 The vein network — the branching LAW that turns a squiggle into a structure

| Quantity | Value | Tag |
|---|---|---|
| **Murray's law** | `r_parent³ = Σ r_daughter³` — the branching that minimises the sum of flow power and blood-metabolic cost | `[S]` https://en.wikipedia.org/wiki/Murray%27s_law ; https://ncbi.nlm.nih.gov/pmc/articles/PMC4905520 |
| **Symmetric daughter : parent radius** | `2^(−1/3)` = **0.7937** | `[S]`/`[D]` ibid. |
| **Symmetric bifurcation half-angle** | **37.5°** per daughter ⇒ **~75° total**, from `cos θ = 0.794` | `[S]` https://www.researchgate.net/publication/225387758_Murray's_law_and_the_bifurcation_angle_in_the_arterial_micro-circulation_system_and_their_application_to_the_design_of_microfluidics |
| Near-minimum band | surface area, volume, pumping power and drag are all near their minima for a total bifurcation angle of **75–100°** | `[S]` https://link.springer.com/article/10.1186/s12915-021-01130-0 (Lepidoptera / Murray's law) |
| **Where the law stops holding** | in Lepidoptera **wing veins**, vessels **above ~50 µm** conform to Murray's law; below 50 µm they conform less and less | `[S]` ibid. |
| **Asymmetric-branch angle formula** | `cos θ₁ = (r₀⁴ + r₁⁴ − r₂⁴) / (2 r₀² r₁²)`, and symmetrically for θ₂ | `[D]` — validated: substituting the symmetric case r₁=r₂=0.794 r₀ returns **37.5°**, matching the sourced value exactly |
| **The buildable asymmetric pair** | dominant daughter at **r₁ = 0.90 r₀** deviates **23.9°**; the minor daughter is then forced to **r₂ = 0.647 r₀** and deviates **51.7°**; total **75.6°** | `[D]` from the two rows above |
| **Bat-wing vessel calibre** | veins **76.2 µm**, arteries **52.6 µm**, capillaries **3.7 µm** | `[S]` Wiedeman 1963, *Circ Res* 12:375, https://www.ahajournals.org/doi/10.1161/01.RES.12.4.375 (values via index summary; ahajournals egress-blocked) |
| **Vein : artery width ratio** | 76.2 / 52.6 = **1.45×** | `[D]` |
| **Generations from small artery to capillary** | `0.7937ⁿ = 52.6/3.7` ⇒ **n ≈ 11.5** bifurcations | `[D]` |
| **Pairing** | "muscular venules **accompanying most arterioles**" — vessels travel as artery+vein **doublets** | `[S]` https://www.sciencedirect.com/science/article/abs/pii/0026286285900275 |
| **Where the volume is** | greatest total cross-sectional area of the whole bed is **in the VENULES**; the venous system is "**as much as 80 % of total vascular volume**" | `[S]` Wiedeman 1963 |
| Downstream fan-out | **345 venules** counted in the bed supplied by a **single** arterial branch | `[S]` ibid. |
| Density gradient root→tip | **`unknown` as a vascular measurement.** The only sourced proximal→distal gradient on a bat wing is for **sensory hairs** — "density was **higher proximally than distally**" (§2.5). Searched: bat wing vascular density gradient, patagium capillary density proximal distal — nothing retrieved | `unknown` |
| Vessel path relative to bones | qualitative only: the patagium is "**filled with blood vessels and lines of muscle tissue**", vessels run "throughout the membrane along with small muscles and nerves". **No sourced statement that vessels track the digits** | `[S]` https://koryos.tumblr.com/post/143906829796/bats-an-anatomy-guide-for-artists-animators ; the spar-tracking question is `unknown` |

**THE VEIN SPEC `[D]` — everything above, collapsed into buildable rules:**

1. **Taper by 0.794 per bifurcation.** Four visible orders ⇒ tip width **0.794⁴ = 0.397×** the
   root, and **16** tips. Five orders ⇒ 0.315× and 32 tips. Do not draw more than 5 orders: the
   real tree runs ~11.5 generations (row above) but the last 7 are sub-visible.
2. **Never split symmetrically.** Use the asymmetric pair: **main continues at ~24° and keeps 90 %
   of its width; the side branch leaves at ~52° and takes 65 %.** A tree of 37.5°/37.5° symmetric
   Y-forks reads as a *diagram*; the 24°/52° asymmetric fork reads as an *organism*. Total angle
   stays in the sourced 75–100° band either way.
3. **Draw doublets, not lines.** Each visible vessel is an artery+vein pair: the **venous** member
   **1.45× wider** and **darker**, the arterial member thinner and warmer, offset by roughly one
   vessel width.
4. **Backlit, veins SUBTRACT.** Venous blood is deoxygenated and absorbs ~10× more red than
   arterial (§2.2), and the venous side owns 80 % of the volume ⇒ **the network reads as dark
   branching lines drawn inside the ember glow**, with the arterial member a slightly warmer,
   lighter hairline beside it. Front-lit, the whole network nearly vanishes (the membrane only
   reflects 3–7 %, §2.1, so there is almost no reflected light for the veins to modulate).
5. **Width floor = the Murray cut-off.** Only vessels above ~50 µm obey the law; below that the
   tree becomes a diffuse haze. Translate to the render: below ~1.5 screen pixels, **stop drawing
   lines and switch to a faint tint** — a vein rendered as a 1-pixel line is the "sparkle-as-line"
   failure (AAA #10) in reverse.

### §2.5 Membrane micro-surface — hairs, wrinkles, tension lines

| Feature | Finding | Tag |
|---|---|---|
| **Sensory hair density** | "a **sparse grid** of domed, microscopic hairs… at a density of about **one hair per square millimetre**" (*Eptesicus fuscus*) | `[S]` Sterbing-D'Angelo et al., *J Neurophysiol*, https://journals.physiology.org/doi/full/10.1152/jn.00261.2016 ; https://ncbi.nlm.nih.gov/pmc/articles/PMC3131348 |
| Hair morphology | hairs "protrude from **domes**", "sometimes **several hairs per dome**", and are "**strongly tapered**"; on **both dorsal and ventral** surfaces | `[S]` ibid. ; Rummel et al. 2023, https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.25176 |
| Hair placement rule | hairs sit "in membrane regions **away from elastin bands**, **over bone structures**, as well as a **'fringe' at the very edge** of the membrane in **all species**" | `[S]` Rummel et al. 2023 |
| **Hair density gradient** | "sensory hair density was **higher proximally than distally**" in the plagiopatagium and other wing regions | `[S]` ibid. |
| The membrane is not bare | wing membranes "**appear naked** in most bats, but on close examination… are covered with **minute hairs**, and in some species with **distinctive tufts and fringes**" | `[S]` https://animaldiversity.org/collections/mammal_anatomy/bat_wings/ |
| **Wrinkle direction** | "wing membrane wrinkles **run parallel to elastin fibres**"; elastin is "**approximately spanwise-oriented**" | `[S]` Cheney et al. 2015, *J R Soc Interface* 12:20141286 |
| **Wrinkle density** | removing the elastin "leads to a decrease in wrinkle frequency **by an order of magnitude**" — i.e. the natural wrinkle frequency is **~10× denser** than the matrix alone would produce | `[S]` ibid. |
| Which fibres do what | the matrix is **isotropic in-plane** and bears load **at high stress**; elastin causes the **anisotropy** and only bears load **at very low stress** | `[S]` ibid. |
| **The stiffness axes** | "maximum stiffness and strength **parallel to the wing skeleton**; greatest extensibility **parallel to the trailing edge**" | `[S]` Swartz et al. 1996, *J Zool*, https://zslpublications.onlinelibrary.wiley.com/doi/10.1111/j.1469-7998.1996.tb05455.x |
| **The orthogonal net** | plagiopatagium fibre architecture = **two nearly orthogonal families**, Ø **50–100 µm**, spacing **500–1500 µm**; spanwise **elastin** (high recoil, volumetrically dominant) crossed by much stiffer, rarer **collagen** | `[S]` §2.1 sources |
| Chordwise muscles | the armwing contains **chordwise-oriented muscles** (plagiopatagiales) embedded in the sheet | `[S]` Cheney et al. 2015 |
| Wrinkle **wavelength** in mm | **`unknown`.** Searched Cheney 2015 for a wavelength/spacing figure; the paper is paywalled and no index summary returned a number. The only spacing number retrievable is the **fibre** spacing, 500–1500 µm | `unknown` |

**THE MICRO-SURFACE SPEC `[D]`:**

- **Creases run SPANWISE (root→tip), fine and many.** Relaxed, the elastin recoils and gathers the
  matrix into that dense wrinkle field. Taut, the elastin extends first (it bears load "at very low
  stress") and the wrinkles **pull out before the sheet ever starts to stretch** — so the wrinkle
  field is a *tension read-out*: **wrinkle amplitude → 0 as the wing loads up on the downstroke,
  and blooms back at the top of the upstroke.** This is an animated dial, not a static detail.
- **The two fibre families are 90° apart and unequal.** Dense spanwise elastin (visible, wrinkling,
  compliant) crossed by sparse chordwise structure (invisible, stiff). A membrane detailed with an
  even diamond grid has averaged away the entire anisotropy.
- **Hairs live in three places and are absent from a fourth**: over the bones, in the mid-bay
  fields, and as a **fringe on the free edge** — and *not* on the elastin bands. Proximal >> distal.
  At 1 hair/mm² on a dragon-scale wing they are far below pixel size **as geometry**; they are
  visible only as a **silhouette fuzz on the free edge** and as a **grazing-angle sheen** where they
  are dense. That is the entire budget for them: an edge treatment and a rim multiplier, no strands.

### §2.6 The edge — the single most-looked-at 3 pixels on the wing

| Finding | Value | Tag |
|---|---|---|
| **The trailing-edge hem** | the large elastin fibre at the trailing edge **widens 35 µm → 265 µm** rostrocaudally as it runs distally; "could act as a '**hem**' that prevents tearing while providing stability and durability" | `[S]` SICB, https://sicb.org/abstracts/life-on-the-trailing-edge-muscle-and-elastin-structure-in-bat-wings/ |
| Hem thickness ratio | 265 / 35 = **7.6×** thicker at the distal end than at the proximal end | `[D]` |
| Hem vs sheet | the hem at its thickest (**265 µm**) is comparable to the **whole membrane thickness** (130–300 µm, §2.1) — i.e. the free edge is roughly a **doubling** of local optical path | `[D]` |
| Trailing-edge composition | the caudalmost spanwise edge of the armwing is **two layers of collagen around a core**; **muscle cells originate at the tibia and run spanwise along the trailing edge**, inserting into the membrane | `[S]` ibid. |
| **The hair fringe** | a "**fringe**" of hairs at the very edge of the membrane, present in **all species** examined | `[S]` Rummel et al. 2023 |
| Leading edge | stiffened by a **dedicated tensioner** in both membrane lineages (Norberg mechanism + occipitopollicalis in bats; pteroid in pterosaurs) | `[S]` prior art `DRAGON-ANATOMY-REFERENCE.md` §4.1 |
| Extensibility axis | greatest extensibility is **parallel to the trailing edge** | `[S]` Swartz et al. 1996 |

**THE EDGE SPEC `[D]` — a three-band structure, not a line:**

| Band | Width (screen) | Value | Why |
|---|---|---|---|
| **inner sheet** | — | the §2.2 ramp | nominal thickness |
| **the hem** | ~2–4 px, **widening toward the tip** (7.6× taper is sourced) | **DARKEST band on the whole wing when backlit** | double optical path ⇒ `T` drops from 0.15 to ~0.02 (the `#711600`→black end of §2.2's ramp) |
| **the fringe** | ~1–2 px, **broken and irregular** | **BRIGHTEST**, and it is *hair*, catching a specular/rim highlight | present in all species; it is the only structure outboard of the hem |

⇒ **The trailing edge is DARK with a BRIGHT BROKEN FUZZ outside it.** That is core→bloom→dark
compressed into three pixels — and it is the opposite of the continuous bright outline everyone
draws. **The leading edge is the reverse**: no free hem (it is clamped to a tensioned spar), so it
reads as an unbroken *structural* line — bone value, not membrane value.

⇒ **`[D]` The two edges must not be drawn with the same treatment.** Trailing = free, hemmed,
scalloped, dark-cord-plus-fuzz, and it is where damage belongs (A1 §2.5). Leading = clamped,
knuckled, bone-valued, continuous.

### §2.7 Scale → membrane transition — the real anatomical analogue

The right reference is not a dragon. It is the **mucocutaneous junction** — the body's own
solution to "keratinised armour meets thin translucent skin", and it is the **vermilion border of
the lip**, which is *the* place in mammalian anatomy where a keratinised sheet thins until blood
shows through it.

| Finding | Value | Tag |
|---|---|---|
| What the MCJ is | the transitional zone where **keratinised** stratified squamous epithelium meets **non-keratinised / parakeratinised** epithelium | `[S]` https://en.wikipedia.org/wiki/Mucocutaneous_junction |
| **It is graded, not a seam** | "the epithelium **gradually changes** from one type to the other, often becoming a thinner, **parakeratinised** (partially keratinised) transition zone"; "keratinization **gradually ceases**; for a short distance **dead and partially keratinised cells** may be seen" | `[S]` https://peir.path.uab.edu/index.php?title=Histologic%3AChapter_11 |
| **Thickness across the junction** | skin ≈ **80 µm** → vermilion **135 µm** → mucosa **200 µm** | `[S]` https://biennialsandeducation.org/vermilion-border-lip-anatomy-guide |
| **Why the lip is red** | "its **thin stratum corneum allows the underlying capillary red to show through**" | `[S]` ibid. |
| Adnexa | the transition zone has an **absence of adnexal structures** — no hair follicles, no glands | `[S]` ibid. |
| Bird-leg analogue (the *scale-size* gradient) | **scutate/scutellate** — large, flat, overlapping polygonal plates on the exposed dorsal metatarsus → **reticulate** — small, radially symmetric, **dome-shaped, non-overlapping** on the soles → bare skin | `[S]` https://www.nature.com/articles/s41598-024-77650-w ; https://www.birdfact.com/anatomy-and-physiology/integumentary-system/skin-scales-and-other-integuments |
| Studio precedent | Smaug carried "upwards of **a million hand-drawn scales**" and **nine** secondary simulation elements, **wing-membrane wrinkles explicitly among them** | `[S]` https://www.digitaltrends.com/movies/building-better-dragon-hobbit-desolation-smaug/ |
| Whether any studio published its scale→membrane transition method | **`unknown`.** Searched Weta/Pixomondo/Image Engine coverage for the leading-edge scale-to-membrane treatment; nothing describes it | `unknown` |

**THE TRANSITION SPEC `[D]` — three graded zones, never a hard edge:**

| Zone | What changes | Reads as |
|---|---|---|
| **armour** | large, flat, **overlapping** plates, full opacity, keratin specular | the arm/spar |
| **transition (the "vermilion")** | plates shrink and stop overlapping → become small **domes**; keratin thins; **transmission rises and the colour warms** because blood is now showing through; **no hairs, no glands** in this band | a warm, blushed, scaleless band — the exact zone that makes the join believable |
| **membrane** | no plates; the §2.2 thickness ramp; hairs return as the fringe and the sparse dome grid | the sheet |

The three sourced levers are **plate SIZE (large → small)**, **OVERLAP (overlapping → isolated
domes → none)** and **TRANSMISSION (0 → partial → full)**, all changing together over one band.
The lip's numbers say the band is *narrow but real*: thickness changes by **~2.5×** over the
vermilion. `[D]` **Never terminate a scale field with a straight line and start the membrane on the
other side of it** — that is the seam every cheap dragon has, and both real analogues explicitly
grade it.

### §2.8 Value and colour structure across the sheet — the deliverable

**The governing measurement (§2.1):** the membrane reflects **3–7 %** and transmits **8–19 %**.

`[D]` **Front-lit** (sun behind the camera). Membrane albedo ~0.05 vs bone/keratin ~0.45 ⇒ in
sRGB the membrane sits at ≈ **63/255** while the bone sits at ≈ **180/255**. The membrane is the
**darkest element on the entire dragon**.

`[D]` **Backlit** (sun behind the wing). Membrane transmits 0.15 × direct sun; the bone is now
facing away and receives only ambient (~0.1 × sun) at albedo 0.45 ⇒ 0.045. Ratio
**0.15 / 0.045 ≈ 3.3×**: the membrane is now **3× brighter than the bone**.

⇒ **The membrane : bone value ratio swings from ≈0.35 to ≈3.3 — a ~10× inversion — and that
inversion IS the wing's drama.** It must fall out of the shader every time the dragon banks. It
cannot be baked, tinted in, or approximated with a constant emissive.

**THE VALUE TIERS ACROSS THE SHEET.** `k` = local optical path relative to nominal; colours from
§2.2's derived ramp.

| Tier | Where | `k` | Front-lit value | Backlit value & hue | Note |
|---|---|---|---|---|---|
| **V0 root gusset** | body↔wing junction, furred, thickest | ~4 | darkest (fur, no specular) | **near black**, faint red | never glows; it is the anchor the eye reads the glow against |
| **V1 deep cup** | plagiopatagium's deepest sag (~40 % chord, prior art §4.4) | ~2 | dark, slightly warmer (bounce) | **`#711600`** blood red | the deepest sag = the LONGEST path = the DARKEST transmitted, not the brightest |
| **V2 main field** | handwing bays, mid-membrane | 1 | mid-dark | **`#AB5416`** ember | the reference tier the other four are read against |
| **V3 taut stretch** | inter-digital sheet near the MCP knuckles; the propatagium's leading sheet | ~0.5 | slightly lighter | **`#D59553`** pale amber — **the brightest membrane on the wing** | thinnest + most stretched; this is where the "hero" light punches through |
| **V4 hem** | trailing free edge, widening 7.6× toward the tip | ~2 | a dark line | **`#711600`** → black at the tip | a DARK cord, 2–4 px |
| **V5 fringe** | hairs outboard of the hem | n/a | faint sheen | **brightest pixels on the wing**, broken and irregular | this is the *only* legitimate bright outline; it is HAIR, not membrane |
| **V6 spar shadow** | membrane immediately over/behind a bone | ∞ | bone value (bright) | **pure black silhouette** | the contrast spine, both regimes |

**Darkest where:** front-lit → the deep cup (V1). Backlit → the bones (V6), the hem (V4), the root
gusset (V0). **Brightest where:** front-lit → the bones and the fringe. Backlit → the taut
inter-digital stretch (V3) and the fringe (V5).

**Highest contrast where — the same place in both regimes:** the **bone ↔ membrane boundary**
(V6/V2). Front-lit it is bright-bone-on-dark-sheet; backlit it is black-bone-on-glowing-sheet. The
boundary never moves; only its polarity flips. `[D]` **⇒ Spend the wing's contrast budget on that
boundary and nowhere else.** A membrane tinted up until it approaches bone value has spent the
wing's only reliable read.

**`[D]` THE SCALE COROLLARY — how sharp the bone's shadow is inside the glow is a SIZE cue.**
Lateral light-bleed around an occluder in skin is bounded by the diffuse mean free path,
**0.68–3.67 mm** (§2.2) — a **fixed physical length that does not scale with the animal**. On a
0.25 m bat wing filling 400 px, that bleed is **1–6 px: visibly soft**. On a 6 m dragon wing
filling the same 400 px it is **0.07–0.27 px: razor sharp**. ⇒ **A soft, glowing halo around the
wing bones makes a 30 m dragon read as a bat.** This is A1's ripple-wavelength scale cue (A1 §1.5,
cheap-tell #13) restated in light instead of geometry, and it points the same way: *fine and sharp
= enormous.*

