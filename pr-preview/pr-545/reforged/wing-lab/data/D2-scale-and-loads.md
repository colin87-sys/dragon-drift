# D2 — Scale, loads, and the physics of a huge wing

Stream D2 of the Wing Lab. Subject: **what changes about the LOOK of one wing** when the animal
under it masses like a horse-to-elephant instead of a fox. Every physical fact below is landed as
a visual instruction. A fact that does not move a vertex is not in this file.

**Leapfrogs, does not restate:** `DRAGON-ANATOMY-REFERENCE.md` §2.7 (mass/span/sanctioned
exaggeration), §4.5 (camber, AR, wing-loading band), §5.1 (frequency scaling). Those are assumed
read. D2's job is the **structural and material consequence** of the mass they sanction — the
spar, the membrane, the failure order — and the loads at 600–900 kg specifically.

---

## §0 Provenance note — READ BEFORE TRUSTING A TAG

**`WebFetch` is blocked by network egress policy here** (confirmed this pass: `EGRESS_BLOCKED` on
`en.wikipedia.org`; stream A1 confirmed the same on eight other domains). Every `[S]` below
therefore comes from a **`WebSearch` index summary of a named URL**, not from the page body.

- `[S]` + URL — a real, retrievable, named source; the number came back attached to that URL.
- `[D]` — I computed it. **The arithmetic is shown inline every time**, so it can be checked,
  re-run with different inputs, or overridden.
- `unknown` — searched, not found. Search terms given in §5.
- `[no-assert]` — the literature actively disagrees. Both numbers given; neither picked.
- `[assumed]` — an input I needed and could not source. Flagged at every point of use, so the
  director can see exactly which conclusions rest on it.

**No number in this file was invented.** Where a derivation needed an unsourceable input it says
`[assumed]` and states the value, so the whole chain can be re-run.

### The creature this file is loaded against `[D from §2.7 + §4.5]`

| Parameter | Value | Where from |
|---|---|---|
| Span `b` | **12 m** | §2.7 sanctioned |
| Mass `m` | **600–900 kg, nominal 750 kg** | §2.7 sanctioned |
| Aspect ratio | **7–9, nominal 8** | §4.5 "AR 7–9 legitimises BOTH" |
| Wing area `S = b²/AR` | 144/8 = **18 m²** | `[D]` |
| Mean chord `c̄ = S/b` | 18/12 = **1.5 m** | `[D]` |
| Root chord (elliptical) `4S/(πb)` | 4×18/(π×12) = **1.91 m** | `[D]` |
| Semispan `s` | **6 m** | `[D]` |
| Weight `W = mg` | 750×9.81 = **7358 N** | `[D]` |
| **Wing loading `W/S`** | 7358/18 = **409 N/m² = 41.7 kg/m²** | `[D]` |

---

## §1 Headline — the five findings that most change what the wing looks like

**1. THE BONES ARE NOT WHAT BREAKS FIRST. The membrane's *stiffness* and *tear resistance* fail
an order of magnitude faster than the spar's strength does — and artists reliably get this
backwards.** Scale a bat by a linear factor L and hold shape: spar bending stress rises ∝ L and
membrane tensile stress rises ∝ L (both ×10 at ×10 size — both easily fixed by getting a bit
thicker). But the **stiffness shortfall** rises ∝ L² and the **tear driving force** rises ∝ L²
(both ×100 at ×10 size). Derivations in §2.1. ⇒ **Beefing up the bones and leaving the membrane a
smooth thin film is the exact opposite of what the physics demands.** The membrane is the part
that must visibly change.

**2. The membrane cannot be a thicker sheet. It must be a visible fibre composite — ~1.3–2.3 mm
cords at 10–30 mm spacing — and three independent routes agree on that geometry.** To hold the
camber band of §4.5 at our dynamic pressure the membrane needs **77× a flying fox's `E·h`**
(§2.3). Getting that from thicker skin costs **230 kg of membrane** — more than the entire flight
musculature of a bird masses (~20% of body mass `[S]`) — and is dead on arrival. Getting it from
discrete GPa-class fibres costs **~13 kg**. Fibre geometry falls out at **d ≈ 1.3–2.3 mm, spacing
10–30 mm**; scaling published actinofibril diameters (0.05–0.2 mm on a ≤2 m pterosaur `[S]`) by
our linear factor gives 0.3–1.2 mm; and the pterosaur literature's own fibre-to-spacing hint
("a little less than one-tenth" `[S]`, partial) matches the derived d/s ≈ 0.09. ⇒ **~75 individually
visible cords per chord line, running the chord, catching a rim light, occluding the fire glow.**

**3. The spar's taper is nearly flat over the inner half and violent over the outer half.**
Diameter ∝ (remaining bending moment)^⅓; for elliptical loading that is 1.00 → **0.86 at the
elbow** → **0.62 at the wrist** → 0.33 at ¾ span → 0.15 at 90% span (§2.2). In absolutes: **245 mm
at the shoulder, 211 mm at the elbow, 152 mm at the wrist, 37 mm near the tip.** ⇒ **The humerus
is a short fat tapered MAST — 1.04 m long by 0.245 m thick, a slenderness of 4.25 : 1, about as
thick through as the rider's chest is deep.** Bone slenderness scales as L^(−⅓) `[D]`, so a
creature 10× a bat's size has bones **2.15× stubbier in proportion**. A linear taper from a fat
root to a needle tip is wrong: the inner half barely tapers at all.

**4. The wing sits between the heaviest bird that can exist and a light aircraft — and must be
posed for SPEED, not for lift.** At 409 N/m² the creature is **1.7× the ~25 kg/m² critical limit
for bird flight `[S]`** and **0.58× a Cessna 172 `[S+D]`**. Consequences, all derived in §2.5–2.6:
stall ≈ **20 m/s (74 km/h)**, cruise ≈ **26 m/s (93 km/h)**, Reynolds number **2.6×10⁶ — one to two
orders of magnitude above ANY living flyer (birds sit at 10⁴–10⁵ `[S]`)**, and gust response **9×
lower than a flying fox's**. ⇒ **The body must track like an airliner — no bobbing, no wobble, no
being knocked about. Everything that moves in a gust moves in the membrane and the shoulder, not
the torso.** And there must never be a shot of this animal hovering or drifting slowly.

**5. The membrane's tautness swings by a factor of ~4 across ONE beat, and the ripple pattern must
change with it.** Membrane wave speed `c_w = √(T/ρ_A)`; tension is ∝ the load factor, which runs
from ~0.2 g at the top of the upstroke to ~3 g at the bottom of the downstroke. ⇒ `c_w` runs
**12 → 48 m/s** against a flight speed of 26 m/s (§2.4). **Bottom of downstroke: `c_w`/V ≈ 1.9 —
drum-taut, ripples suppressed, one clean arch. Top of upstroke: `c_w`/V ≈ 0.5 — waves cannot climb
upstream, the sheet goes slack and washes aft into billow and flutter.** Plus: a disturbance takes
**0.22 s to cross from shoulder to tip** = **~26% of a beat = ~93° of phase lag** — a hard number
for `FLAP-DESIGN.md`'s lag dial, contributed by the membrane on top of the skeletal lag.

---

## §2 Tables and derivations

### §2.1 Square-cube: what actually breaks first when you scale a bat up

Scale a flyer by linear factor **L**, holding shape (isometry). Then `W ∝ L³`, `S ∝ L²`,
`b ∝ L`, `c ∝ L`, membrane thickness `h ∝ L`, spar radius `R ∝ L`.

| Quantity | Derivation | Scaling | At ×10 size | Tag |
|---|---|---|---|---|
| Wing loading `W/S` | L³/L² | **∝ L** | ×10 | `[D]` |
| Flight speed `V = √(2(W/S)/ρC_L)` | √(L) | **∝ L^½** | ×3.16 | `[D]` |
| Reynolds `Re = Vc/ν` | L^½·L | **∝ L^1.5** | ×31.6 | `[D]` |
| **Spar bending stress** `σ_b = M/Z`; `M ∝ W·b ∝ L⁴`, `Z ∝ R³ ∝ L³` | L⁴/L³ | **∝ L** | **×10** | `[D]` |
| **Membrane tensile stress** `σ_m = T/h`; `T = Δp·R_c ∝ L·L = L²`, `h ∝ L` | L²/L | **∝ L** | **×10** | `[D]` |
| **Aeroelastic stiffness shortfall** — required `E·h ∝ q·c ∝ L·L = L²`; available `E·h ∝ L` | L²/L¹ | **∝ L²** | **×100** | `[D]` from the `Ae` definition `[S]` |
| **Tear driving force** `G ≈ σ²a/E` with flaw size `a` FIXED (a claw, a branch, a spear does not scale with the victim) | (L)²·1 | **∝ L²** | **×100** | `[D]` |
| Power margin | max attainable beat frequency falls **faster** than the minimum required frequency; they meet, and that meeting defines the maximum mass | — | ceiling **41 kg / 5.1 m span** for soaring | `[S]` https://journals.biologists.com/jeb/article/215/5/711/11225/ |

**THE ORDER OF FAILURE `[D]`:**

1. **Power** — breaks first and by an enormous margin (our creature is ~18× the sourced 41 kg
   ceiling). **But power is invisible.** It changes nothing about the wing's geometry. This is why
   it is the wrong thing for an artist to worry about, and the right thing for §2.7's "sanctioned
   exaggeration" to simply spend.
2. **Aeroelastic stiffness (×L²)** — the first thing that breaks *visibly*. Untreated, the
   membrane billows into a parachute.
3. **Tear resistance (×L²)** — second visible failure.
4. **Spar strength and membrane strength (×L both)** — the *easiest* problems, and the ones art
   over-serves.

### §2.2 Spar bending — beam theory on a wing finger

**Root bending moment.** Elliptical spanwise lift distribution; centroid of the half-wing load at
`ȳ = 4/(3π)·s` = 0.4244 × 6 m = **2.546 m** from the root `[D]`.

> `M_root = n · (W/2) · ȳ = n × 3679 N × 2.546 m = n × 9366 N·m` `[D]`

**Load factor `n` — derived from a sourced pair, not guessed.** Kirkpatrick 1994 gives bird
humerus safety factors of **6.63 in gliding** and **2.22 in hovering** `[S]`
https://journals.biologists.com/jeb/article/190/1/195/6720/. Safety factor = breaking stress ÷
actual stress, same bone, same breaking stress ⇒ **hovering stress = 6.63/2.22 = 2.99× gliding
stress** ⇒ **peak flapping load factor `n ≈ 3` `[D]`**.

**Working stress.** Bird humerus breaking stress **125 MPa**; bat humerus **75 MPa** `[S]`
https://journals.biologists.com/jeb/article/190/1/195/6720/ (eagle cortical bone reaches 180 MPa,
wolf 156 MPa `[S]` same result set). Take bird-grade 125 MPa ÷ the sourced hovering safety factor
2.22 ⇒ **σ_peak = 56.3 MPa at n = 3** `[D]`.

**Hollowness `K = r/R`.**

| Animal group | K (internal ÷ external diameter) | Tag |
|---|---|---|
| Land mammals | **≈ 0.50** (wall = 25% of the diameter) | `[S]` Currey & Alexander 1985, https://zslpublications.onlinelibrary.wiley.com/doi/10.1111/j.1469-7998.1985.tb03551.x |
| Flying birds (interspecific range) | **0.55 – 0.87** | `[S]` same |
| *Pteranodon* | R/t **8.9 – 10.35** ⇒ t/R 0.097–0.112 ⇒ **K = 0.888 – 0.903** | `[S]` https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10709016/ + `[D]` for the K conversion |
| Pterosaur specimen UJA VF1 | R/t **9.9** ⇒ K = 0.899 | `[S]` same |
| **Optimum K depends on the load case** — yield/fatigue vs ultimate vs impact vs stiffness, and on marrow vs gas fill | — | `[S]` Currey & Alexander 1985 |
| Pterosaur bone Relative Failure Force | **1.9× that expected of a similarly sized bird** | `[S]` https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10709016/ |

**Sizing.** Section modulus of a tube: `Z = (π/4)R³(1−K⁴)`, so

> `R = [ 4M / (π σ (1−K⁴)) ]^(1/3)` `[D]`

At `M = 3 × 9366 = 28 098 N·m`, `σ = 56.3 MPa`:

| K | 1−K⁴ | R | **Outer diameter** | Wall t | Section mass/length (ρ_bone 2000 `[assumed]`) |
|---|---|---|---|---|---|
| **0.90** (pterosaur-grade) | 0.3439 | 122.7 mm | **245 mm** | **12.3 mm** | 17.97 kg/m |
| 0.80 (bird-grade) | 0.5904 | 102.5 mm | **205 mm** | 20.5 mm | 23.77 kg/m |

⇒ `[D]` **The pterosaur solution is 20% fatter, its wall 40% thinner, and it is 24% lighter for
identical strength.** Take K = 0.90. **81% of the bone's cross-section is cavity.**

**THE TAPER LAW `[D]`.** Diameter ∝ (remaining bending moment)^⅓. For elliptical loading
`M(η) ∝ g(η) = ∫_η^1 √(1−u²)(u−η)du`, integrated exactly:

| η (fraction of semispan) | 0.00 | 0.173 (elbow) | 0.45 (wrist) | 0.50 | 0.75 | 0.90 |
|---|---|---|---|---|---|---|
| `g(η)/g(0)` | 1.000 | 0.637 | 0.238 | 0.189 | 0.0344 | 0.00354 |
| **Diameter ÷ root** | **1.000** | **0.860** | **0.620** | 0.574 | **0.325** | **0.152** |
| **Outer diameter** | **245 mm** | **211 mm** | **152 mm** | 141 mm | **80 mm** | **37 mm** |
| Local chord (elliptical) | 1.910 m | 1.881 m | 1.706 m | 1.654 m | 1.263 m | 0.833 m |
| **Diameter ÷ local chord** | **12.8%** | **11.2%** | **8.9%** | 8.5% | **6.3%** | **4.4%** |

**How thick is that, relative to a bat? `[D]`** `D/c ∝ W^⅓ b^(4/3) / S`; under isometry that is
**∝ L^⅓**. A 12 m creature is ×10 a 1.2 m flying fox ⇒ **D/c must be 2.15× larger**, plus a
further 1.24× for the non-isometric mass ⇒ **≈2.7× a bat's**. Running the same beam sizing on a
1 kg megabat (b = 1.23 m, W/S = 45.4 N/m² from the sourced Megachiroptera laws in §4.5;
σ = 75/1.41 = 53.2 MPa from the sourced bat hovering safety factor 1.41 `[S]`; K = 0.8) gives
D = 10.8 mm on a 224 mm root chord = **4.8% of chord**, against our **12.8%**. Ratio **2.67**.
Independent route, same answer.

**Humerus proportion `[D]`.** *Q. northropi* humerus **0.91 m** at a 10–11 m span `[S]`
https://www.britannica.com/animal/Quetzalcoatlus ⇒ **8.7% of span** ⇒ at 12 m, **1.04 m long**.
Against our derived 0.245 m diameter: **slenderness 4.25 : 1**. Cross-check: slenderness ∝ L^(−⅓),
so a bat at ~10:1 lands a ×10 creature at 4.7:1 `[D]`. Two routes, same answer.

### §2.3 Membrane stress, stiffness, and why it must be fibre-reinforced

**Membrane tension.** A cambered sheet is a pressure vessel: `T = Δp · R_c` (N per metre of width).
For a circular arc of chord `c` and camber ratio `ε = h/c`, `R_c = c(1/(8ε) + ε/2)` `[D]`. At the
§4.5 optimum `ε = 0.15`: `R_c = 1.5 × 0.908 = 1.362 m`.

| Condition | Δp (N/m²) | **T (N/m)** | Tag |
|---|---|---|---|
| Cruise (n=1) | 409 | **557** | `[D]` |
| Downstroke peak (n=3) | 1227 | **1671** | `[D]` |
| Top of upstroke (n≈0.2 `[assumed]`) | 82 | **111** | `[D]` |

**Strength is NOT the constraint.** At the n=3 peak with a ×3 safety factor the membrane must
carry 5013 N/m. A 0.5 mm sheet does that at 10.0 MPa; a 1 mm sheet at 5.0 MPa `[D]`. Ultimate
tensile strength of bat wing membrane skin in MPa is **`unknown`** this pass (Swartz *et al.* 1996
measured it; the values were not in any retrievable summary) — but the *thickness* required is
sub-millimetre either way, and that is the point.

**Stiffness IS the constraint.** The aeroelastic number
> `Ae = E·h / (½ρU∞²·c)` `[S]` https://arxiv.org/pdf/2212.12112 and https://iopscience.iop.org/article/10.1088/1748-3190/ac8632

and **"at optimal aeroelastic numbers, the membrane has a moderate camber between 15% and 20%"**
`[S]` (same). `Ae` is dimensionless, so **the optimal value is the same number for a bat and for a
dragon.** Therefore:

> `(E·h)_dragon / (E·h)_bat = (q·c)_dragon / (q·c)_bat` `[D]`
> `= (409 × 1.5) / (45.4 × 0.1757) = 613.5 / 7.98 = **76.9×**`

(`q = (W/S)/C_L` at C_L = 1; bat `W/S = 45.4 N/m²` and `c = 0.176 m` from the sourced
Megachiroptera laws in §4.5.)

Bat baseline: `E = 3 MPa spanwise to 30 MPa chordwise` `[S]` Swartz *et al.* 1996,
https://zslpublications.onlinelibrary.wiley.com/doi/10.1111/j.1469-7998.1996.tb05455.x;
`h = 0.039 – 0.267 mm` `[S]` (same paper's measurement range). Take `E·h = 30 MPa × 0.15 mm =
4500 N/m`. **Required: 77 × 4500 = 346 500 N/m.**

| Route | What it costs | Verdict |
|---|---|---|
| **A — thicker skin, same material.** `h = 346 500/30e6 =` **11.6 mm** | 11.6 mm × 1100 kg/m³ `[assumed]` = 12.7 kg/m² × 18 m² = **230 kg** = **31% of body mass**. Birds' *entire* flight musculature is ~20% of body mass `[S]` https://www.cell.com/current-biology/fulltext/S0960-9822(22)01084-3 | **DEAD** `[D]` |
| **B — GPa-class fibres in a thin compliant skin.** Skin 0.5 mm + cords carrying 331 500 N/m | Cords: `E_f(πd²/4)/s = 331 500` with `E_f = 2.5 GPa` `[assumed]` (keratin class) ⇒ `d²/s = 1.69×10⁻⁴ m`. Skin 10 kg + cords 3.1 kg = **13 kg** | **THIS ONE** `[D]` |

**Derived fibre geometry `[D]`:**

| Spacing s | Cord diameter d | d/s |
|---|---|---|
| 10 mm | **1.30 mm** | 0.130 |
| 20 mm | **1.84 mm** | 0.092 |
| 30 mm | **2.25 mm** | 0.075 |

**Three independent confirmations that this is the right geometry:**
- **Isometric scale of the fossil.** Actinofibrils **0.05–0.2 mm** diameter `[S]`
  https://www.tandfonline.com/doi/abs/10.1080/10292380009380572, on pterosaurs of **≤2 m span**
  `[S]` https://pubmed.ncbi.nlm.nih.gov/19656798/. ×6 to 12 m span ⇒ **0.3–1.2 mm** `[D]` — same
  order as the derived 1.3–2.3 mm, and our creature is heavier than isometric, which is exactly
  the direction of the difference.
- **The fossil's own ratio.** "the wing fibers typically measured a little less than one-tenth of
  the spacing" `[S]` https://pterosaurnet.blogspot.com/2016/12/evolution-of-feathers.html —
  ⚠ **partial**: the search summary's sentence is truncated and it flags itself as incomplete, so
  treat 1:10 as *indicative*, not established. It matches the derived d/s = 0.092 at s = 20 mm.
- **The tear constraint** (below) independently demands spacing ≤ ~30 mm.

**Fibre ORIENTATION is sourced and it rotates across the wing `[S]`:** there are **no actinofibrils
in the proximal wing close to the body**; they get **more densely packed the further out you go**;
they lie **parallel to the finger distally and perpendicular to the long axis proximally**
https://archosaurmusings.wordpress.com/2008/06/16/pterosaur-wings-2-structure/. Function: "resisting
longitudinal compression to spread the patagium chordwise, redirect spanwise tension as chordwise
tension, and permit compact folding" `[S]`
https://www.tandfonline.com/doi/abs/10.1080/10292380009380572.

**Bat fibre architecture, for the surface `[S]`:** a **net-like fibre system of collagen and
elastin** that "reinforces the wings and increases their resistance to puncture"; the **isotropic
matrix bears load at high stress while the elastin fibres provide the anisotropy and only carry
load at very low stress**, giving "extreme extensibility and self-folding"
https://www.researchgate.net/publication/274402325_A_wrinkle_in_flight. And the **anisotropy is
extreme and directional**: "maximum stiffness and strength parallel to the wing skeleton, greatest
extensibility parallel to the trailing edge" `[S]` Swartz 1996. Regionally, the **plagiopatagium
(inboard sheet) is the weakest and most extensible**, the uropatagium the strongest `[S]` (same).

**Tear `[D]` from `[S]`.** Griffith-type energy release rate `G ≈ σ²a/E`. Membrane stress
`σ ∝ L`; **flaw size `a` does not scale with the animal** — a claw, a branch, a spear, an arrow is
the same size whatever it hits. ⇒ **`G ∝ L²`: a 10× bigger flyer has 100× the driving force on the
same 5 cm gash.** Real membranes answer this with a fibre net (sourced above) and with vasculature
for healing — "an extensive vasculature system across the wing promotes healing" `[S]`
https://academic.oup.com/jmammal/article-abstract/99/4/974/4996870 — and wing tears are common
enough in the wild to have their own morphometrics literature (`Characterizing wing tears in common
pipistrelles`, `[S]` https://academic.oup.com/jmammal/article/100/4/1282/5510503, which finds
**position within the plagiopatagium governs the number, location and orientation of tears**).

### §2.4 Gust response, flutter, and ripple wavelength

| Finding | Value | Tag |
|---|---|---|
| **Gust response is inversely proportional to wing loading — doubling wing loading halves the response** | ⇒ our creature at 409 N/m² vs a flying fox at 45 N/m² ⇒ **9.0× less gust response** `[D]` | `[S]` https://en.wikipedia.org/wiki/Wing_loading (via search summary) |
| Bird wings act as a **suspension system**: rapid elevation about the shoulder rejects the gust impulse **inertially**, cutting the impulse to torso and head by **32% over the first 80 ms**, before aerodynamics take effect | 80 ms = **4.8 frames at 60 fps** `[D]` | `[S]` https://royalsocietypublishing.org/rspb/article/287/1937/20201748/ |
| Dominant chordwise membrane mode has a **nodal line at ~0.5c** (i.e. the *second* chordwise mode), and **"at higher angles of attack the second chordwise mode becomes dominant as vortex shedding takes place"** | ⇒ **half-wavelength = c/2 ⇒ λ_ripple = 1.00 × chord**; fundamental billow (no interior node) **λ = 2c** | `[S]` https://www.researchgate.net/publication/269049385_Shape_lift_and_vibrations_of_highly_compliant_membrane_wings |
| Oscillations appear as **standing waves along the span and travelling waves, particularly with free side edges** | ⇒ the free trailing edge is where the travelling wave lives | `[S]` same |

**RIPPLE WAVELENGTH AS A FRACTION OF CHORD — the requested number `[S]→[D]`:**

> **billow λ = 2.00 c (3.00 m) · dominant ripple λ = 1.00 c (1.50 m) · harmonics 0.67 c (1.00 m)
> and 0.50 c (0.75 m).**

**Membrane wave speed `c_w = √(T/ρ_A)` `[D]`.** Areal density with Route-B construction: skin
0.5 mm × 1100 kg/m³ = 0.55 + cords 0.17 = **ρ_A = 0.72 kg/m²** `[D, using the assumed densities]`.

| Point in the beat | T (N/m) | **c_w** | c_w / V (V = 25.8 m/s) | Shoulder→tip lag (6 m ÷ c_w) | Ripple freq `f₁ = c_w/2c` |
|---|---|---|---|---|---|
| Downstroke peak (n=3) | 1671 | **48.1 m/s** | **1.86** — waves outrun the flow ⇒ **drum-taut, ripples suppressed** | 0.125 s | 16.0 Hz |
| Cruise (n=1) | 557 | **27.8 m/s** | **1.08** — *marginal*; the membrane sits exactly on the divergence boundary | **0.216 s** | 9.3 Hz |
| Top of upstroke (n≈0.2) | 111 | **12.4 m/s** | **0.48** — waves cannot climb upstream ⇒ **slack, everything washes aft into billow and flutter** | 0.484 s | 4.1 Hz |

⇒ `[D]` **Tautness swings ×4 in wave speed across one beat, and crosses the c_w = V threshold
twice per cycle.** And at cruise: shoulder→tip lag **0.216 s** against a 0.83 s beat period =
**26% of a cycle = 93° of phase**; chordwise crossing **1.5/27.8 = 0.054 s ≈ 3.2 frames at 60 fps**.

**Flutter onset** (from §4.5, restated only because it is the boundary these numbers straddle):
dimensionless stiffness ≈ 0.05 `[S]`; the **absolute airspeed** at which the trailing edge flutters
remains **`unknown`** — but `c_w/V` above gives the director a *phase-resolved* substitute that §4.5
did not have.

### §2.5 The largest documented flyers — and the size of the disagreement

| Animal | Span | Mass — **every published value found** | Wing area | Wing loading | Tag |
|---|---|---|---|---|---|
| ***Quetzalcoatlus northropi*** | **10–11 m** | **70 kg** (Chatterjee & Templin 2004 — and *"if more than 70 kg it would not have been able to take off"*) · **125 kg** (Witton & Habib, reported) · **200–250 kg** (Witton & Habib 2010, *"the most reliable upper estimates of known pterosaur size"*) · **259 kg** (Witton 2008) · **544 kg** (Henderson 2010, *"could never become airborne"*) · **~240 kg** (Henderson's figure recomputed with a corrected body length) | `unknown` as a published number | ≈220 N/m² `[D]` in §2.7 | `[S]` https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0013982 · https://gimpasaura.wordpress.com/2012/11/13/the-70-kg-quetzalcoatlus-debate/ · https://www.science.org/content/article/large-size-didnt-keep-pterosaurs-grounded — **`[no-assert]` on which is right** |
| ***Pelagornis sandersi*** | **6.06–7.38 m** (conservative ~6.4 m, which "exceeds theoretical maximums based on extant soaring birds") | **21.9–40.1 kg** | `unknown` published; AR **13.0–15.0** `[S]` ⇒ S = 2.45–4.19 m² `[D]` | **51–161 N/m²** `[D]` — a **3.1× spread from published inputs alone** | `[S]` https://www.pnas.org/doi/10.1073/pnas.1320297111 |
| ***Argentavis magnificens*** | **~7.0 m** (6.8–7.4) | **70–72 kg** | **8.11 m²** | **84.6 N/m²** | `[S]` Chatterjee, Templin & Campbell 2007, https://www.pnas.org/doi/10.1073/pnas.0702040104 — the only one of the three with a **published wing area AND wing loading** |
| Largest *soaring* flyer the frequency-scaling ceiling permits | **5.1 m** | **41 kg** | — | — | `[S]` (restated from §2.7) |

**THE SPREAD IS THE LICENCE, quantified `[D]`:** *Q. northropi* mass is published anywhere from
**70 to 544 kg — a factor of 7.8** — at an essentially agreed span. At fixed span that means the
published literature disagrees by:

- **7.8× in wing loading**,
- **√7.8 = 2.8× in flight speed**,
- **7.8^⅓ = 1.98× in required spar diameter.**

⇒ **The field cannot agree, within a factor of two, on how thick the wing bone of the largest known
flyer should look.** Any dragon drawn inside that factor of two is inside the science.

**Launch mechanics — the debate and the number `[S]`.** Quadrupedal vault: "a quadrupedally
launching, 200–250 kg, 10 m span azhdarchid could easily launch from a standing start without use
of downward slopes or headwinds"; kinematic model for a **5 m span** animal gives launch velocity
**12.68 m/s at 30°**, with **~5 kN over the 0.63 s vault-and-launch phases**
https://www.academia.edu/1800608/How_Giant_Reptiles_Flew · https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0013982.
⚠ `[no-assert]`: the mass those two figures apply to was not given in any retrievable summary and
they do not reconcile with each other under any mass I can derive — **do not scale the 5 kN.**
Our own launch load, derived independently: momentum `750 × 20.4 m/s = 15 300 kg·m/s`, over 0.63 s
⇒ mean 24.3 kN of thrust + 7.36 kN of weight = **31.6 kN ≈ 4.3 body weights** `[D]`. Note this is a
*compressive* load down the forelimb, a different path from the bending case that sized the spar —
the two land in the same size class, which is the useful part.

### §2.6 Wing loading bands — and what each band demands of the LOOK

All values converted to N/m² by me where the source gave kg/m² or lb/ft² (`1 kg/m² = 9.81 N/m²`;
`1 lb/ft² = 4.8824 kg/m² = 47.90 N/m²`) `[D]`.

| Flyer | Wing loading | Reads as | Tag |
|---|---|---|---|
| Monarch butterfly | 0.168 kg/m² = **1.65 N/m²** | drifting paper | `[S]` https://en.wikipedia.org/wiki/Wing_loading + `[D]` conversion |
| Paraglider (Ozone Buzz Z3 MS) | 2.9–3.7 kg/m² = **28–36 N/m²** | fabric, always billowing | `[S]` same |
| Flying foxes (*P. samoensis*, *P. livingstonii*) | **26–33 N/m²** | soft, slow, deep-cambered | `[S]` (via §4.5) |
| **Birds generally** | 1–20 kg/m² = **10–196 N/m²** | the whole living envelope | `[S]` https://en.wikipedia.org/wiki/Wing_loading |
| Hang glider (Wills Wing Sport 2 155) | 6.6–9.7 kg/m² = **65–95 N/m²** | taut sailcloth over battens | `[S]` same |
| *Argentavis* | **84.6 N/m²** | the heaviest real bird | `[S]` |
| Wandering albatross | **≈127 N/m²** `[D]` (10 kg, 3.4 m, AR 15 `[S]` ⇒ S = 0.77 m²) — published value **`unknown`** | narrow, taut, plank-like | `[D]`; AR 15:1 `[S]` https://www.speedoscience.com/2026/03/wandering-albatross-35m-wingspan.html |
| *Pelagornis sandersi* | **51–161 N/m²** `[D]` | — | `[D]` |
| ***Q. northropi*** | ≈**220 N/m²** `[D]` | — | `[D]` §2.7 |
| **⚠ CRITICAL LIMIT FOR BIRD FLIGHT** | ~25 kg/m² = **245 N/m²** | the ceiling of the living | `[S]` https://en.wikipedia.org/wiki/Wing_loading |
| **★ OUR DRAGON at 750 kg / 18 m²** | **409 N/m² = 41.7 kg/m²** | **1.67× the bird ceiling** | `[D]` |
| Cessna 172 | 14.7 lb/ft² = **704 N/m²** `[D]` | a machine | `[S]` value https://www.highskyflying.com/what-is-wing-loading-how-wing-loading-affects-airplane-performance/ — ⚠ **the source's own SI conversion, "21.87 kg/m²", is arithmetically wrong**; 14.7 lb/ft² is 71.8 kg/m². Conversion corrected here `[D]` |

**There is no aspect ratio that rescues this `[D]`.** At 12 m span and 750 kg:

| AR | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|
| S (m²) | 28.8 | 24.0 | 20.6 | 18.0 | 16.0 |
| **W/S (N/m²)** | **255** | **307** | **357** | **409** | **460** |

Even at AR 5 — a broad, bat-like, low-AR planform that §4.5 says reads as a *forest manoeuvrer* —
the creature is **still above the 245 N/m² bird ceiling**. Reaching §4.5's "plausible" 30–80 N/m²
band would need **S ≈ 92–245 m² at 12 m span, i.e. AR 0.6–1.6** — a manta, not a dragon. ⇒ **§4.5's
30–80 N/m² band and §2.7's 600–900 kg exaggeration are mutually incompatible. §2.7 wins, and the
wing must therefore be drawn as a high-wing-loading wing.**

**Independent validation of §2.7's mass, from a completely different direction `[D]`.** The sourced
Megachiroptera scaling law **`b = 1.23 M^0.35` m** (M in kg) `[S]` (via §4.5), inverted at b = 12 m:
`M^0.35 = 9.756 → M = e^(ln 9.756 / 0.35) = e^6.508 =` **671 kg** — inside §2.7's sanctioned
600–900 kg band, which was derived from a *pterosaur* mass–span cube and a torso-inflation argument.
Two unrelated routes to the same mass. **The exaggeration is the bat allometric line run off the end
of its own graph, not a fudge.**
⚠ But the megabat family of laws is **internally inconsistent when extrapolated this far** `[D]`:
`W/S = 45.4 M^0.33` gives **403 N/m²** at 750 kg, while `AR = 8.63 M^0.11` combined with
`b = 1.23 M^0.35` implies `W/S = 55.96 M^0.41` = **845 N/m²**. The two disagree by 20% at M = 1 kg
and by **2.1× at M = 750 kg**. Our 409 N/m² sits at the *kindest* end. `[no-assert]` on which law
extrapolates better.

### §2.7 Flap frequency and stroke amplitude at this mass

**The correct equation, and a correction to §5.1.** §5.1 offers `f ∝ √(wing loading)` as "THE ONE
EQUATION TO CODE AGAINST". **It is dimensionally incomplete and it fails badly off-isometry** `[D]`:
`√(N/m²)` is not s⁻¹; the missing factor is `1/b`. The physically closed form is the Strouhal
identity §5.1 already gives:

> `f = St · V / A`, with `V = √(2(W/S)/(ρ C_L))` and `A = 2 s sin θ` `[D]`
>
> ⇒ `f ∝ √(W/S) / b` — **the span term is what §5.1 dropped, and it is exactly what changes when
> you scale up.**

Applied naively without the `1/b`, anchoring on *P. livingstonii* (2.2 Hz at 25.8 N/m² `[S]`), the
§5.1 form gives `2.2 × √(409/25.8) = 8.8 Hz` — **an 8× error, and visibly absurd for a 750 kg
animal.** Use the closed form.

**Speeds `[D]`** (ρ = 1.225 kg/m³):

| | 600 kg | **750 kg** | 900 kg |
|---|---|---|---|
| W/S (N/m²) | 327 | **409** | 490 |
| V cruise (C_L = 1.0) | 23.1 m/s / 83 km/h | **25.8 m/s / 93 km/h** | 28.3 m/s / 102 km/h |
| V stall (C_L = 1.6) | 18.3 m/s / 66 km/h | **20.4 m/s / 74 km/h** | 22.4 m/s / 81 km/h |
| **Re = V·c̄/ν** (ν = 1.5×10⁻⁵) | 2.3×10⁶ | **2.6×10⁶** | 2.8×10⁶ |

**THE FREQUENCY `[D]`.** `A = 2 × 6 × sin θ`: θ = ±35° ⇒ A = 6.88 m; θ = ±45° ⇒ A = 8.49 m.
§5.1's sourced band: efficient locomotion 0.25 < St < 0.35, bats fly **50–150% above** it, and
§5.1's own game recommendation is **St ≈ 0.3–0.5** `[S]`.

| | St 0.30 | St 0.40 | St 0.50 |
|---|---|---|---|
| θ = ±35° (A = 6.88 m) | 1.13 Hz | 1.50 Hz | 1.88 Hz |
| **θ = ±45° (A = 8.49 m)** | **0.91 Hz** | **1.22 Hz** | **1.52 Hz** |

> ### ⇒ **f ≈ 0.9 – 1.5 Hz, nominal 1.2 Hz — one beat every 0.83 s, at ±45° stroke.** `[D]`

**Why the "big = slow" intuition is wrong here `[D]`.** The sourced bat mass law `f ∝ M^(−0.26)`
`[S]` https://journals.biologists.com/jeb/article/215/5/711/11225/, anchored on the sourced
"4–13 Hz at 2–870 g" band `[S]` (§5.1) at its heavy end (4 Hz max at 0.87 kg), predicts
`4 × (750/0.87)^(−0.26) = 4 × 0.172 =` **0.69 Hz max** — so cruise would be well under 0.5 Hz.
**That is 2–3× slower than the Strouhal answer.** The mass law assumes isometric wing growth; our
creature deliberately carries ~1.7× the isometric mass on its span, so it must fly faster, and
faster flight at fixed amplitude demands a faster beat to hold Strouhal. ⇒ **The exaggeration that
makes the dragon heavy also makes its beat FASTER, not slower.**

**Muscle-mass sanity check `[S]`:** birds' pectoralis averages **17% of body mass**, supracoracoideus
**2–4%**, total **~20%**; bats' ventral thoracic flight muscles average **9.1%**
https://www.cell.com/current-biology/fulltext/S0960-9822(22)01084-3. ⇒ 750 kg × 20% = **150 kg of
flight muscle** must be visibly housed. At 9.1% (bat-grade) only 68 kg — **so the chest must read
bird-grade, not bat-grade**, which is consistent with §2.7's short deep anvil.

---

## §3 Build implications — every number above, turned into geometry

### The spar

1. **Humerus: 245 mm outer diameter × 1.04 m long. Slenderness 4.25 : 1 — a stump, not a strut.**
   At the shoulder the wing's upper-arm bone is roughly **as thick through as the rider's chest is
   deep**, and it is **shorter than the rider is tall from hip to shoulder**. If the humerus reads
   as a "bone", it is wrong; it must read as a **short tapered mast socketed into the anvil**.
2. **Taper by the cube-root-of-moment law, NOT linearly.** Diameter × root-fraction:
   **1.00 shoulder · 0.86 elbow · 0.62 wrist · 0.33 at ¾ span · 0.15 at 90%.** The inner half is
   almost parallel-sided; the outer half is a whip. Build it as two visually distinct regimes with
   the **break at the wrist**, which is exactly where §4's finger decay begins and where A1's
   "wrist is a punctuation mark" lands. The physics and the art agree on the same joint.
3. **Diameter as a fraction of local chord: 12.8% → 11.2% → 8.9% → 6.3% → 4.4%.** About **one
   eighth of the chord at the shoulder, one twentieth at the tip.** ~2.7× thicker relative to chord
   than a bat's. Silhouette test: at the shoulder, the spar should occupy a visible slab of the
   wing's depth, not a line on it.
4. **The bone is a PIPE: 81% cavity, wall 12.3 mm on a 245 mm diameter.** Wherever the wing is
   backlit, cracked, scarred, or fire-lit from within, **the spar must read as a tube — a bright
   rim and a dark or glowing core**, never a solid rod. This is free richness (`DRAGON-DESIGN.md`'s
   "withheld component glow" has a physically correct home here).
5. **Thin walls need bracing, and the bracing should be visible.** Giant pterosaurs answered R/t ≈ 10
   with **"numerous internal bony struts to counter buckling"** `[S]`. Put **knuckle-like
   thickenings and raised longitudinal ridges at the high-moment stations** (shoulder, elbow, wrist)
   and, where the spar is translucent, a **visible internal lattice**.
6. **A dragon that lands hard and fights should have thicker walls than a pterosaur that only
   flies.** Currey & Alexander: the optimum K depends on whether the bone is selected for ultimate
   strength (thin) or **impact** strength (thick) `[S]`. Art-direction fork: **K = 0.90 → 245 mm
   elegant hollow mast (flyer); K = 0.80 → 205 mm thicker-walled, 24% heavier (brawler).** Pick one
   and be consistent — mixing them reads as sloppy.

### The membrane

7. **Build the fibre net as GEOMETRY OR NORMAL DETAIL, not as a texture pattern.** ~1.8 mm cords at
   ~20 mm spacing = **~75 cords per chord line across a 1.5 m chord**. They are individually
   resolvable at rider distance. They must **catch a rim light** and **occlude the fire glow from
   behind** (a striped shadow across the backlit sheet — one of the cheapest premium tells
   available on this creature).
8. **The fibre pattern ROTATES across the wing, and this is sourced, not stylistic.** *No fibres
   inboard near the body*; **perpendicular to the long axis proximally**; **parallel to the finger
   distally**; **density increasing outboard** `[S]`. ⇒ the inboard plagiopatagium is a smooth,
   soft, low-fibre sheet; the outboard handwing is a dense combed fan aligned with the fingers.
   **Two different-looking surfaces on one wing**, with the transition around the wrist.
9. **The membrane is not a card. Give it edge thickness and self-shadow.** 0.5 mm skin over a
   1.5 m chord is thin, but the **fibres stand proud** — the reading edge of the wing is a **corded
   lip**, and the trailing edge must show the cord-ends as a fine scallop (§4.5's "scalloped" TE
   `[S]` now has a mechanism).
10. **Scars belong on this surface.** Tears are ordinary in real membranes and healing is
    vascular `[S]`. Draw them as **blunt-ended slits running in from the trailing edge that stop
    dead at a cord**, with a healed ridge and a local disturbance in the fibre run. Never a tear
    that crosses a bay, never a tear that reaches a spar. **A tear that stops is evidence the fibre
    net exists** — this one detail does more to sell the physics than any amount of bone.
11. **Value structure follows the anisotropy `[S]`:** stiffest and strongest *parallel to the
    skeleton*, most extensible *parallel to the trailing edge*; the inboard plagiopatagium is the
    weakest and most extensible sheet. ⇒ **the inboard sheet sags and stretches; the outboard sheet
    stays crisp.** Deepest sag inboard, tautest surface outboard — the opposite of the intuitive
    "tip flops" reading.

### The motion

12. **Beat at ~1.2 Hz (0.83 s/cycle) at ±45°.** Not 0.3 Hz. A 750 kg creature that beats once every
    three seconds looks like it is falling, and the Strouhal number says it would be.
13. **Membrane phase lag: +26% of a cycle ≈ 93° from shoulder to tip**, contributed by the
    membrane's own wave speed **on top of** the skeletal lag in `FLAP-DESIGN.md`. A disturbance
    crosses one chord in **0.054 s ≈ 3 frames at 60 fps**; root to tip in **0.216 s ≈ 13 frames**.
14. **THE CYCLE LAW — the membrane's surface character must change within each beat.**
    **Bottom of downstroke:** c_w/V = 1.9 → drum-taut, one clean arch, ripples suppressed, camber
    at its shallowest, specular highlight tight and unbroken.
    **Cruise/mid-stroke:** c_w/V ≈ 1.1 → marginal; long ripples that neither die nor run away.
    **Top of upstroke:** c_w/V = 0.5 → **slack**; waves cannot propagate upstream, the sheet
    billows and flutters, the highlight breaks into fragments.
    This is the single most non-obvious motion finding in the file and it costs one scalar
    (instantaneous load factor) driving a ripple-amplitude and ripple-frequency parameter.
15. **Ripple wavelengths: billow 2c (3.0 m), dominant ripple 1c (1.5 m), harmonics 0.67c and
    0.50c. Ripple frequency 4–16 Hz** (4–13× the beat). At 9 Hz a ripple is **6.5 frames per
    cycle** — **do this in the shader/normal map, not the vertex rig**, or it will alias.
16. **Ripples arc BAY BY BAY.** Spanwise the membrane is divided by the fingers, so the spanwise
    fundamental is 2 × bay width — **one arch per bay, anchored at the spars.** A continuous wave
    running the whole span is a ruled-out failure mode (§4).
17. **Gust response lives in the shoulder and lasts 80 ms.** Sourced mechanism: the wing **elevates
    rapidly about the shoulder**, rejecting **32% of the gust impulse inertially in the first 80 ms
    (≈5 frames)** before aerodynamics take over `[S]`. So: **body dead steady, shoulder flicks up
    over ~5 frames, membrane rings for ~0.2 s after.** The torso must not move — at 9× lower gust
    response than a flying fox, this animal does not get pushed around.
18. **Never show it slow.** Stall is **20 m/s (74 km/h)**. There is no honest hover, no slow drift,
    no gentle landing flare at walking pace. Landing is a **flare-and-stall from ~20 m/s** or a
    quadrupedal arrival — and take-off is a **vault at ≈4.3 g**, not a run-up.

### The regime

19. **Re = 2.6×10⁶ — one to two orders above any living flyer** (birds sit at 10⁴–10⁵ `[S]`). The
    boundary layer is thin, turbulent and attached. ⇒ **the wing does not need low-Re tricks**:
    no extreme camber for its own sake, no fuzz, no thick blunt sections. It can and should run
    **thinner, cleaner sections at higher angles without visible separation** — which is exactly
    the *sailplane* look, and reinforces #4's "engineered, not organic" read.
20. **Chest must be bird-grade, not bat-grade: ~150 kg of flight muscle at 20% of body mass `[S]`.**
    That volume has to be visible in the anvil §2.7 already specifies.

---

## §4 What this rules out — the kill list

- ❌ **A thick-boned dragon with a thin, smooth, featureless membrane.** This is the standard
  failure and it is backwards: the membrane's stiffness and tear resistance fail 10× faster than
  the bones' strength (§2.1). Any render where the bones got the attention and the membrane is a
  clean stretched film is an automatic LOSS.
- ❌ **A membrane with no visible fibre.** At this scale a plain sheet with the required stiffness
  would mass 230 kg — 31% of the animal, more than its entire musculature. **A smooth membrane at
  12 m span is a physical impossibility, not a stylistic choice.**
- ❌ **Fibres drawn as a uniform grid or a woven fabric weave.** Sourced: **no fibres inboard**,
  **increasing density outboard**, **perpendicular proximally, parallel-to-finger distally**. A
  uniform crosshatch is wrong in three ways at once.
- ❌ **Fibres too fine to count.** At 1.8 mm on a 1.5 m chord they are individually visible. A
  micro-noise pattern reads as fabric texture; discrete cords read as anatomy.
- ❌ **A linearly tapered spar.** The correct taper is nearly flat to the elbow (0.86), still 0.62
  at the wrist, then collapses to 0.15 by 90% span. A straight cone from fat root to needle tip is
  the most common dragon-wing error and it is quantitatively wrong.
- ❌ **A long slender humerus.** 4.25 : 1. Anything above ~6 : 1 at the humerus reads as a bat
  scaled up, and §2.7 already ruled out bats as a proportion reference.
- ❌ **A solid-looking bone.** 81% of the cross-section is cavity. Where light passes, it must read
  as a tube.
- ❌ **A spar thinner than ~1/12 of the local chord at the shoulder.** Below that it reads as a
  bat's arm — 2.7× too thin for this mass.
- ❌ **A wing at 30–80 N/m² proportions on a 600–900 kg body.** The deep, broad, soft, heavily
  cambered flying-fox planform is off by 5–13× in wing loading. **Broad-and-deep is ruled out;
  this wing is comparatively narrow and taut.**
- ❌ **A hovering shot, a slow drift, a gentle walking-pace landing, or a standing-start run-up
  take-off.** Stall is 74 km/h.
- ❌ **A torso that bobs or wobbles in turbulence.** Gust response is 9× below a flying fox's. The
  gust lives in the shoulder (80 ms) and the membrane (0.2 s), never the body.
- ❌ **A ripple that runs continuously across the whole span**, and ❌ **a ripple pattern that is
  constant through the beat.** Both are ruled out by §2.4: waves arc bay-by-bay, and c_w/V crosses
  1.0 twice per cycle.
- ❌ **Ripple wavelength much shorter than half a chord.** The dominant mode is λ = 1.0 c with a
  node at mid-chord; harmonics stop being visible below ~0.5 c. Fine high-frequency shimmer over
  the whole sheet is a shader tell, not a membrane.
- ❌ **A tear that crosses a bay or reaches a spar**, and ❌ **a pristine membrane with no healed
  damage at all.** Tears are ordinary; tears that *stop* are the evidence of the fibre net.
- ❌ **A beat at 0.3–0.5 Hz** ("big animal = slow"). Wrong by 2–3× and it will read as falling.
- ❌ **A beat at 8–9 Hz** — what §5.1's incomplete `f ∝ √(W/S)` gives if you use it without the
  `1/b`. Wrong by 8×.

---

## §5 Still unknown

| Item | What I searched | Status |
|---|---|---|
| **Ultimate tensile strength of bat wing membrane skin, in MPa** | "Swartz 1996 bat wing membrane skin failure stress MPa breaking strength chordwise spanwise elastin fibres"; "bat wing membrane skin tensile strength MPa anisotropic". Swartz *et al.* 1996 measured strength and load-at-failure; only the **elastic moduli (3 MPa spanwise / 30 MPa chordwise)** came back in any summary | `unknown` — the stiffness chain (§2.3) does not depend on it; the strength check is therefore stated as a *requirement* (5013 N/m), not a verdict |
| **Published wing area and wing loading for *Q. northropi* and *Pelagornis*** | "Quetzalcoatlus wing area square metres wing loading Witton Habib 2010"; "Pelagornis sandersi wing area aspect ratio glide ratio Ksepka PNAS" | `unknown` as published numbers — derived from span+AR instead, shown inline. §4.5 flagged the same gap; **it is still open** |
| **Published wing loading in N/m² for wandering albatross and Andean condor** | "wandering albatross wing loading N/m2 aspect ratio 15 Andean condor wing loading published values" | `unknown` — §4.5's flag stands. AR 15:1 for the albatross is now sourced; the loading is `[D]` |
| **Actinofibril SPACING as a measured number** | "actinofibril spacing mm density per centimetre pterosaur wing membrane Rhamphorhynchus Sordes measurements" | Still effectively `unknown`. The only hit — "the wing fibers typically measured a little less than one-tenth of the spacing" — is **truncated in the summary and self-flagged as incomplete**. §4's open item is *narrowed, not closed*: my `[D]` route gives d/s ≈ 0.075–0.13, which is consistent with it |
| **Pennycuick 1996 wingbeat-frequency exponents** | "Pennycuick 1996 wingbeat frequency formula m^(3/8) b^(-23/24) S^(-1/3) birds cruising" | Still `unknown` — §5.1's flag stands. **I did not use them.** The Strouhal route in §2.7 replaces them and needs no unverified exponents |
| **Rayner/Greenewalt bird wing-area and wing-loading allometric exponents** (S ∝ M^0.72 etc.) | "Rayner 1988 bird wing area scales body mass exponent 0.72 wingspan 0.39 wing loading 0.28 allometry" | Partially closed: **wingspan b ∝ M^0.35–0.39** and **total arm (humerus+ulna+manus) ∝ M^0.37–0.39** are sourced (https://research.manchester.ac.uk/en/publications/wing-bone-length-allometry-in-birds/). **Wing area and wing loading exponents for birds remain `unknown`** — the Megachiroptera laws in §4.5 were used instead |
| **Young's modulus of bone; density of bone, skin and keratin fibre; keratin E** | not separately searched — used as `[assumed]` (20 GPa, 2000, 1100, 1300 kg/m³, 2.5 GPa) | `[assumed]`, flagged at every point of use. **Only the fibre-diameter numbers in §2.3 move if E_keratin is wrong, and they move as E^(−½): halving E_f fattens the cords by only 1.41×** |
| **Absolute airspeed of trailing-edge flutter onset** | inherited open item from §4.5; approached instead via `c_w/V` | Still `unknown` as an absolute speed. §2.4 supplies a *phase-resolved substitute* (c_w/V through the beat) that did not exist before |
| **Whether the megabat AR law or the megabat W/S law extrapolates correctly to 750 kg** | derived both; they disagree by 2.1× | `[no-assert]` — the design sits at the kinder end and says so |
