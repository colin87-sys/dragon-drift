# THE EMPYREAN — Reference Grounding (anti-AI-slop research)

Companion to EMPYREAN-BIBLE.md. Six Opus reference-research passes (2026-07-17) grounding each
hero element in real optics/materials + AAA art practice, each naming the specific slop tell to avoid.


---

# R1 — NACRE (mother-of-pearl) as a water-surface material

Grounding reference for **The Empyrean** biome: a bright high-key luminous void with
mother-of-pearl water. Goal: real nacre **luster**, not oil-slick AI slop, and a palette
locked **off green / off gold** (rose · lilac · periwinkle only — green & gold are owned by
other biomes / the boss).

---

## 0. The one-sentence physics (what we're actually simulating)

Nacre is a brick-and-mortar stack: **aragonite platelets ~400–500 nm thick** (≈0.4–0.5 µm,
10–20 µm across) glued by **conchiolin organic sheets ~20–30 nm** (25 nm in optical models).
Aragonite n ≈ **1.53–1.69** (birefringent: 1.681 / 1.686 / 1.530 along its axes at 589 nm),
conchiolin lower (~1.43–1.55). Light thin-film-interferes at every platelet boundary; the
constructively reflected wavelength for order m is

```
λ_m = 2 (n1·d1 + n2·d2) / m          (normal incidence)
λ(θ) ∝ cos θ                          (θ = angle from normal → BLUE-SHIFT at grazing)
```

Two consequences that are the whole art direction:
- It is a **stack of many layers**, so it's high-value, milky and diffuse-backed (LUSTER),
  not a single hard mirror (GLOSS). The color floats *over* a soft white body.
- The tablet thickness **varies with the shell's growth cycles**, so color rides the growth
  **contours** as ordered, roughly parallel **bands** — not a swirl, not uniform sparkle.

---

## 1. Interference-band hue ORDER + angular falloff (from real nacre)

Real abalone/paua/pearl nacre, viewed as you tilt from **face-on → grazing**:

| view angle (θ from normal) | dominant hue | why |
|---|---|---|
| ~0° (facing, normal incidence) | **milky rose / warm silver-white** | longest reflected λ, weakest colored reflection — mostly the diffuse body shows |
| ~30–45° | **lilac / mauve → periwinkle** | λ blue-shifts as cos θ drops |
| ~60–80° (grazing crest) | **blue-silver / cool violet**, brightest luster | max blue-shift **and** Fresnel reflectance peaks at grazing |

So the read is a **directed sweep: rose → lilac → periwinkle → blue-silver**, and because
tablet thickness changes along growth lines it **repeats as ordered bands** (Newton-series
orders m=1,2,3…) that follow the contours. Measurable anchors:
- Color is **angular** (structural), not pigmentary — the defining test. Move the camera and
  the hue *must* travel; if it doesn't, it's car-paint slop.
- Blue-shift with angle follows **λ ∝ cos θ** (L/4 = n·d·cos θ). Grazing = bluer & shorter λ.
- Repeat/banding spacing is set by local tablet thickness (~0.4–0.5 µm) drifting across growth
  zones — hence irregular, contour-hugging band widths, not a clean concentric rainbow.

**Luster, not gloss:** the reflection is *broad and satiny* (spread over many sub-surface
layers), never a tight sun-glint dot. Highlight is a wide soft lobe.

---

## 2. Which ~3 hues carry the read; failure hues to EXCLUDE

**Carry the read (the only three that matter):**
1. **Rose / warm pink-white** — the facing, near-normal band (`#EEC9D2`–`#F3D9DD`)
2. **Lilac / mauve-periwinkle** — the mid-angle band (`#CFC2E4`–`#BFC4E8`)
3. **Blue-silver / cool violet** — the grazing-crest band, brightest (`#C2D4E8`–`#DCE7F2`)

**EXCLUDE (owned elsewhere / reads as slop):**
- **Green / teal / emerald** — real abalone has tons of it, but it's forbidden here. Pin the
  **green channel as the lowest channel everywhere** and it can never appear.
- **Gold / yellow / amber / copper** — needs high R+G with low B; keep **blue high everywhere**
  and gold is impossible.
- **Saturated full-spectrum rainbow** — the oil-slick tell. Keep amplitude low (pastel).

The gamut we want is the **magenta → violet → blue arc only** (one ~90° slice of hue), never
crossing into green or yellow.

---

## 3. Cheap in-shader recipe (cosine palette, gamut-locked off green+gold)

Use Inigo Quilez's cosine palette `color = a + b·cos(2π(c·t + d))`. The trick that **locks the
gamut**: choose `a` and low `b` so that across the whole cycle **blue stays high** (kills gold)
and **green stays the lowest channel** (kills green). Then you can crank frequency `c` for
repeating contour bands and it *cannot* leave the rose→blue arc.

```glsl
// t in [0,1] driven by view angle + wave (see below). Pastel LUSTER, off-green/off-gold.
vec3 nacrePalette(float t){
    // a=DC bias (all high → pastel/milky), b=amplitude (small → luster not neon)
    const vec3 a = vec3(0.85, 0.74, 0.86);   // note G is the low one
    const vec3 b = vec3(0.07, 0.04, 0.06);   // small = soft; keep <0.12
    const vec3 c = vec3(0.50, 0.50, 0.50);   // 0.5 = single sweep; 2.5–3.5 = contour BANDS
    const vec3 d = vec3(0.00, 0.50, 0.50);   // phase: R peaks facing, B peaks grazing
    return a + b*cos(6.2831853*(c*t + d));
}
```

Sampled output (single-sweep, c=0.5):
- t=0.0 → rgb(0.92, 0.70, 0.80) = **rose** (R>B>G)
- t=0.5 → rgb(0.85, 0.74, 0.86) = **lilac/periwinkle** (B≈R>G)
- t=1.0 → rgb(0.78, 0.78, 0.92) = **blue-silver** (B highest, G never wins)

**For repeating growth-contour bands**, set `c = vec3(3.0)` (or 2.5–3.5). The cosine wraps, so
the hue oscillates rose↔lilac↔blue↔lilac↔rose in ordered parallel bands — and because `a`,`b`
never let a channel invert, it *stays* in the rose→blue arc no matter how many bands. This is
what defeats the "concentric oil-slick" and "uniform car-paint sparkle" tells at once.

**Equivalent explicit ramp** (if you prefer a texture/gradient LUT over cosine), stops in order:
`#F3D9DD → #DFC8DE → #CBC2E6 → #BFC9EA → #CFDCEE → #E6EEF5` (rose→lilac→periwinkle→blue-silver→
cool white). Every stop sits in the magenta-violet-blue slice; none is green or gold.

**Driver** (`t = f(fresnel + waveHeight·k)`):
```glsl
float F = pow(1.0 - max(dot(N, V), 0.0), fresnelPow);   // fresnelPow ≈ 3.5–5, grazing→1
float phase = F                                          // view angle drives the sweep
            + waveHeight * k                             // k ≈ 0.15–0.35: crest→bluer
            + contour;                                   // low-freq curved noise = growth lines
vec3 iri = nacrePalette(fract(phase));                   // fract → ordered repeat if c>1

// LUSTER weighting: iridescence dies at normal incidence, lives at grazing crests
float iriWeight = smoothstep(0.15, 0.85, F) * lusterMask;
vec3 col = mix(milkyBase, iri, iriWeight * 0.55);        // 0.55 = keep it a tint, not a coat
```
Guardrails: keep `b<0.12` (pastel), `iriWeight` capped ~0.55 (color floats over white), and
add `contour` as **low-frequency, flow-aligned curved noise** so bands hug wave contours rather
than making camera-locked concentric rings (the AI tell). No glitter/flake sparkle layer.

---

## 4. WHERE on a wave the bands fire vs die + the milky base

**Fire (strong colored bands):**
- **Grazing crest faces** — the far/back side of a crest where the surface tilts toward the
  horizon relative to the eye → high Fresnel `F→1` → max blue-silver, brightest luster.
- Wave shoulders angled ~50–80° from view: the lilac→periwinkle mid-band.
- Bands run **along** the crest lines / growth contours, not radially.

**Die (collapse to milky white):**
- **Troughs** and any facet **facing the camera (normal incidence, F→0)** → `iriWeight→0`,
  only the diffuse body shows: soft rose-white.
- Flat calm water between swells → mostly milky base with a faint rose bias.

**Milky diffuse base (the body under the luster):** a **high-value, near-white, very low
saturation** surface — albedo ≈ `#E9E6EE` (rgb ~0.91,0.90,0.93), saturation <0.08. Treat it
like a soft subsurface/satin white: gentle wrap lighting, slightly **cool in shadow, faintly
warm (rose) in light**, no hard specular. The iridescence is **added on top as a broad
fresnel-weighted satin sheen** (wide highlight lobe = LUSTER), never a mirror-sharp sun glint.
This white body is what keeps the whole thing reading as *pearl*, not *soap bubble*.

**Anti-slop checklist:** (1) hue MUST travel when the camera moves — bake nothing. (2) low
amplitude, pastel — no neon rainbow. (3) bands ordered & contour-aligned — no swirl. (4) green
& gold literally unreachable by the palette math. (5) broad soft sheen — no glitter flakes, no
tight glossy dot.

---

## 5. Reference images / sources for the artist

1. **Atmospheric Optics — Abalone Shell Iridescence** (angle-dependence, band behavior):
   https://atoptics.co.uk/blog/abalone-shell-iridescence/  and  https://atoptics.co.uk/fz506.htm
2. **Nature, Scientific Reports — "Structural colors of pearls"** (measured spectra, thickness):
   https://www.nature.com/articles/s41598-021-94737-w
3. **Investigation of nacre nanostructure by structural color pattern** (banding vs thickness):
   https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8490444/
4. **GIA — Iridescent Abalone Shell** (high-res paua macro photography for hue/band reference):
   https://www.gia.edu/gems-gemology/summer-2021-iridescent-abalone-shell
5. **Inigo Quilez — Cosine palettes** (the `a+b·cos(2π(c·t+d))` recipe used above):
   https://iquilezles.org/articles/palettes/
6. **Hyperspectral interference tomography of nacre** (arXiv, per-layer optical measurements):
   https://arxiv.org/pdf/2010.08170

Artist note when pulling photos: seek **paua/abalone macro shots lit at grazing angle** and
**white/pink pearl overtone** shots — then mentally **delete every green and gold pixel**; what
remains (rose · lilac · periwinkle · blue-silver over a milky body) is exactly our target.
```


---

# R2–R7 — Nebula Structure & Stars for "The Empyrean" (bright high-key pearl-violet void)

Grounding research for a BRIGHT, luminous, pastel nebula sky. Goal: read as a real
reflection-nebula / high-cirrus field, NOT (a) the symmetric airbrushed purple blob, and
NOT (b) the dark saturated Hubble poster (reserved for the boss arena). Everything below is
shader-oriented and buildable in GLSL on a full-screen sky quad / skydome.

---

## ELEMENT A — NEBULA STRUCTURE, HIGH-KEY

### What real reflection nebulae actually look like (the reference facts)

Reflection nebulae (starlight scattered off dust, no self-emission) are the correct
reference because they are **pastel and blue/violet-biased** — Rayleigh-type scattering off
sub-micron dust makes them the same "blue because scattered" family as a daytime sky, which
is exactly the high-key look we want. Two canonical targets:

- **NGC 7023 (Iris Nebula):** described in the literature as a *"complex structure of clouds
  and filamentary structures … highly inhomogeneous, containing several dense irradiated
  structures,"* threaded by **dark lanes of dense dust** that "weave through the illuminated
  regions, adding contrast and depth." Key take: brightness is **inhomogeneous at every
  scale** — bright irradiated knots near the illuminating star, softening to feathered wisps
  outward, cut by dark dust occlusion. There is no clean radial gradient anywhere in it.
- **M45 (Pleiades) / Merope IC 349 / Barnard's Merope:** the reflection nebulosity is
  explicitly **linear, filamentary, striated** — "remarkable *parallel* wisps," "nearly
  straight filaments," "wispy tendrils of a dark cloud being destroyed" by a passing star.
  Key take: the wisps are **directional / combed**, not isotropic fluff. They align with
  flow (the cluster ploughing through the dust) and with radiation pressure streaming away
  from the bright stars.

**Statistics that matter for the shader (from the morphology, quantified for building):**

- Structure is **multi-fractal**: there is meaningful detail from the ~degree scale
  (the overall glow blob) down to arcsecond filaments. In shader terms that's roughly
  **3–4 octaves of visible structure** before you hit the noise floor / dust. Don't render
  more octaves than that or the field turns to TV static (the "dust" slop tell).
- **Filaments are anisotropic**, aspect ratios easily 5:1–10:1 (long thin wisps), and they
  are *combed roughly radially away from / tangentially around* the bright core. This is the
  single most important non-slop cue: the airbrushed-blob failure is isotropic; real nebulae
  are **sheared**.
- **Dark lanes are not "darker paint" — they are foreground occlusion.** They read as
  **coherent curvilinear channels** (a few, wide, meandering) that *cut across* the bright
  filaments, and crucially they have **sharper high-contrast edges on one side** (the lit
  rim) and a soft edge on the other. They are low-frequency shapes carved into a
  high-frequency field, not high-frequency noise themselves.
- **Shock-front / rim brightening:** the brightest pixels are thin bright *edges* where the
  radiation front hits a denser clump — i.e. **embedded brightness knots and lit rims**, not
  a bright center. Brightness peaks are localized and small.

### Translating to noise: the concrete build

Base field is **domain-warped fBm value noise on a gentle radial falloff** — the radial
falloff only sets *where the light generally is*; the warp+octaves supply ALL the structure
so it never reads as a gradient.

**1. Noise primitive.** Use **value noise** (smooth, cheap, no gradient-noise directional
grid artifacts) or Perlin; NOT Worley/cellular (that gives bubbles/cells, wrong for wisps).
Value noise + Hermite interpolation is the mobile-friendly choice.

**2. fBm.** Standard fractal Brownian motion, **4 octaves**, `lacunarity = 2.0`,
`gain = 0.5`. (Book of Shaders reference fBm.) 4 octaves is the sweet spot: enough scales to
feel fractal, few enough to stay pastel and cheap. 6+ octaves = dusty noise slop.

**3. Domain warp — this is what makes it filamentary instead of a blob.** Use Iñigo
Quílez's nested warp (`iquilezles.org/articles/warp`), the `fbm(p + fbm(p + fbm(p)))`
pattern:

```glsl
// p already scaled so ~3–5 fBm "cells" span the visible nebula
vec2 q = vec2( fbm(p + vec2(0.0,0.0)),
               fbm(p + vec2(5.2,1.3)) );          // first-order warp field
vec2 r = vec2( fbm(p + WARP*q + vec2(1.7,9.2)),
               fbm(p + WARP*q + vec2(8.3,2.8)) );  // second-order (the wisps)
float base = fbm(p + WARP*r);                       // final density
```

- **WARP ≈ 4.0** is iq's canonical strength and is a good *upper* bound. For a **calm,
  high-key** field use **WARP ≈ 1.5–2.5** — heavy warp (4.0) gives dramatic turbulent
  Hubble curls (that's the boss arena); moderate warp gives gentle combed cirrus wisps,
  which is what we want. Tune WARP as the single "how stormy" dial.
- **Anisotropy (the Pleiades "combing"):** before warping, **scale p anisotropically** in a
  frame oriented radially from the core, e.g. squash the radial axis vs the tangential axis
  ~1:2 to ~1:3 (`p.x *= 0.4` in a rotated frame). This shears the round noise cells into
  the long directional wisps that separate real reflection nebulae from AI fluff. Optionally
  add a slow rotation of that frame with radius so the combing curves.

**4. Radial falloff (kept subordinate).** `falloff = smoothstep(R_out, R_in, dist)` but then
**multiply the warped noise INTO it and also perturb the radius with low-octave noise** so
the "edge" of the nebula is itself feathered:

```glsl
float rr = dist + 0.15 * fbm(p*0.5);     // wobble the falloff radius -> no clean ring
float glow = smoothstep(R_out, R_in, rr);
float density = glow * (0.45 + 0.55*base); // never let glow show through as a pure gradient
```

The `0.45 + 0.55*base` keeps some floor brightness (high-key: the field is luminous
everywhere) while guaranteeing the warped structure always modulates it.

**5. Dark lanes — the shape answer (not "multiply darker").** Build lanes as a **separate
low-frequency signed field** and use them to CARVE, so they read as coherent occluding
dust rather than noise:

```glsl
// one or two big meandering channels: an isoline of a warped low-freq noise
float lane = fbm(p*0.6 + warpLane);            // low frequency, heavily warped
float duct = smoothstep(0.02, 0.0, abs(lane - 0.5));   // thin band where lane≈0.5 -> a channel
// lit rim: brighten one side, occlude the band
density *= (1.0 - 0.7*duct);                    // occlude
density += 0.25*duct*smoothstep(0.0,0.03, lane-0.5); // one-sided lit rim (shock front)
```

Because in a **bright field** you can't go very dark without breaking high-key, the lane
must read by **shape + a bright lit rim on one edge**, not by depth of darkness. The
one-sided rim (`shock front`) is the cue that sells "dust in front of light." Keep lane
occlusion to ~0.5–0.7 max multiply so the darkest dust is still a mid-tone lavender-grey,
never black.

**6. Saturation ceiling — keeping it pastel & legible.** Work in HSV/HSL and **hard-clamp
S ≤ 0.30**, and make saturation *track density inversely*: brightest knots are the LEAST
saturated (near white), and saturation rises slightly only in the mid-density wisps. This
mimics real high-key optics (bright = desaturated toward white) and is the antidote to the
saturated-Hubble tell.

```glsl
float sat = clamp(0.30 * (1.0 - 0.6*density), 0.10, 0.30); // bright knots ~0.12, wisps ~0.30
vec3 hueRange = mix(ROSE, ORCHID, base);   // rose #f4c9dd-ish -> orchid #cbb4e6-ish, no green/gold
```

- Hue: keep **H in the rose→orchid→periwinkle arc only (~300°→255°)**. Never let the hue
  wander toward green (120°) or gold (45°) — clamp the hue band, don't let a full-spectrum
  palette lerp reach them.
- Value stays **high**: map density to V in ~**0.72–1.0**, so even the "dark" nebula is a
  luminous pearl. Contrast lives in hue/structure, not in a dark-to-light value swing.

**Net anti-slop checklist for A:** anisotropic (combed) warp ✔, 4 octaves not 6+ ✔, dark
lanes as carved channels with one-sided lit rims ✔, S≤0.30 with bright=desaturated ✔,
feathered noisy falloff edge (no clean ring, no clean center) ✔, V floor high ✔.

---

## ELEMENT B — STARS IN A BRIGHT SKY

### The reference fact that governs everything: density collapses in twilight

In a *dark* sky the naked eye sees ~9,000 stars to mag ~6.5 and star counts grow by roughly
**×3–4 per magnitude** (a factor ≈3.98/mag). But our sky is BRIGHT, so the sky-luminance
floor clips almost all of them. During **civil twilight** only stars/planets of about
**magnitude ≤ 1** remain visible — that's **~15 stars over the entire sky** (Sirius,
Canopus, Arcturus, Rigel, Capella, Vega, plus Venus at −4). Push to mag ≤ 2 and you get
~50 total. **This is the number that must govern the shader: dozens, not thousands.**

So the design rule is literal: **sparse to the point of feeling almost empty.** Over a
1080p sky you want on the order of **20–60 visible star points total**, each tiny and only
just brighter than the local sky. A night-density starfield on a bright gradient is *the*
fastest AI-slop tell precisely because it violates this twilight physics.

### Density / size / contrast thresholds (points-read-as-stars vs noise/dust)

- **Density:** target **~1 star per 30,000–100,000 px** (≈20–60 stars at 1080p). Generate
  candidates on a hash grid (one cell ≈ 150–200 px) and keep only cells whose hash passes a
  strict threshold (~2–4% acceptance). Sparse acceptance is what separates "stars" from
  "noise" — a dense accept rate reads as dust/grain instantly.
- **Size:** a star is a **point**, not a disk. Core **≤ 1 px** of full intensity with a soft
  falloff out to ~**1.5–2.5 px** radius. Anything with a resolved disk > ~3 px reads as a
  bokeh ball / snow, not a star. Brightness is carried by *intensity + a little bloom*, not
  by radius.
- **Contrast threshold (the high-key crux):** a point only reads as a *star* when it sits a
  small but clean step above local sky luminance. In a bright field, make the brightest
  stars only **~15–30% above local sky value** (e.g. sky V≈0.85 → star core V≈1.0), and the
  faint majority only **~5–10%** above. Below ~5% they dissolve into sky (good — that's the
  "sparkle suspended in light" feel); a hard white dot at 100% over a pale sky reads as a
  dead pixel / slop. So: **low contrast, soft edge, tiny — "barely there."**

### Anti-aliasing / stability (tiny bright points are the flicker trap)

Sub-pixel stars alias and flicker viciously. Do it right:

- **Analytic soft profile, not a hard threshold.** Render each star as a smooth radial
  falloff evaluated in pixel space so it's inherently anti-aliased:
  `i = smoothstep(radiusPx, 0.0, distToStarPx)` or a gaussian
  `i = exp(-d2 / (2*sigma*sigma))` with **sigma ≈ 0.6–0.9 px**. Never `step()`.
- **Sub-pixel placement** (jitter each star's center within its cell by its hash) so points
  don't snap to the pixel grid — grid-snapped stars shimmer as you move.
- Keep the star layer **cheap and static-friendly**; if the sky drifts, a tiny per-star
  brightness twinkle via `0.85 + 0.15*sin(t*rate + phase)` is fine, but keep amplitude
  small — heavy twinkle reads as fairy-lights/kitsch, not twilight.

### PSF: soft-gauss vs cross-spike at ~1080p

- **Soft gaussian core + faint round bloom halo = YES.** A small central gauss (sigma
  ~0.7 px) plus a very faint wide halo (a second gauss, sigma ~3–5 px, ~8–15% amplitude)
  mimics the real atmospheric/optical PSF and, importantly, makes the brightest 3–4 stars
  feel *luminous* against the bright sky without enlarging the core. This is how you get
  "sparkle suspended in light."
- **Diffraction cross / 4- or 6-point spikes = MOSTLY NO here.** Spikes are a *telescope*
  artifact and a Hubble/glam cue; on a soft naked-eye twilight sky they read as cheap lens-
  flare slop. Reserve a subtle cross **only for the single brightest 1–2 "Venus" anchors**,
  and keep the spike length short (≤ ~6–8 px) and very faint (≤ ~20% of core). A field of
  crossed stars is the kitsch tell.
- At 1080p the whole star budget is basically the gauss core + optional faint halo on the
  top few. Everything else is a ≤1 px soft dot near the sky floor.

### Brightness gradient across the sky (dissolve vs zenith)

The Empyrean has a bright dissolve region (where sky luminance is highest) and a relatively
"deeper" zenith. Scale star visibility to local sky luminance so they obey the twilight
rule everywhere:

- **Near the bright dissolve:** local sky is brightest → stars must be **suppressed / nearly
  invisible.** Multiply star intensity by `(1 - skyLuma)` or fade the whole layer out where
  the dissolve glow is strong. Only the 1–2 brightest anchors survive there, and barely.
- **Toward the zenith / darker regions:** sky floor drops slightly → allow a few more,
  slightly brighter stars. This *gradient of star density that tracks sky brightness* is the
  authentic cue (it's why real twilight has stars "come out" first in the darkest part of
  the sky) and it doubles as the anti-slop signal, because slop pastes uniform-density stars
  regardless of the background.

**Net anti-slop checklist for B:** ~20–60 stars total not thousands ✔, ≤1 px soft cores ✔,
only 15–30% above sky (faint majority 5–10%) ✔, gaussian PSF + faint halo, spikes only on
1–2 anchors ✔, density fades into the bright dissolve, tracks sky luma ✔, sub-pixel jitter +
smoothstep/gauss (no hard step) ✔.

---

## Reference sources

1. **NGC 7023 Iris Nebula — filamentary structure & dark lanes** (astrophotography +
   morphology): https://en.wikipedia.org/wiki/Iris_Nebula and
   https://noirlab.edu/public/images/noao-ngc7023/
2. **M45 Pleiades reflection nebulosity — linear/striated wisps, Merope IC 349 straight
   filaments** (NASA Hubble): https://science.nasa.gov/asset/hubble/ghostly-reflections-in-the-pleiades/
   and the SEDS Messier M45 page http://www.messier.seds.org/m/m045.html
3. **Iñigo Quílez — Domain Warping** (the `fbm(p+fbm(p+fbm(p)))` recipe, WARP≈4.0):
   https://iquilezles.org/articles/warp/
4. **The Book of Shaders — Fractal Brownian Motion** (octaves / lacunarity 2.0 / gain 0.5):
   https://thebookofshaders.com/13/
5. **Twilight star visibility & limiting magnitude** (only mag ≤1 in civil twilight;
   star-count vs magnitude): https://en.wikipedia.org/wiki/Twilight and
   https://www.hnsky.org/sqm_twilight.htm
6. **Procedural star rendering — anti-alias / flicker suppression / sub-pixel** :
   https://tiffnix.com/star-rendering and http://casual-effects.blogspot.com/2013/08/starfield-shader.html


---

# R3 — Luminous Fog / Depth Without Darkness

Grounding for **The Empyrean** — a bright, high-key luminous void where the horizon
dissolves into light. The problem: read depth from CONTRAST-DECAY and OVERLAP, never
from value-darkening. Nothing goes dark except threat.

---

## 1. The real phenomenon — contrast vs. distance in bright media

**Depth in fog is a contrast signal, not a value signal.** Koschmieder's law governs it:

```
C(x) = C0 · e^(−β·x)
```

- `C0` = the object's intrinsic (near) contrast against its background.
- `β` = extinction coefficient (scattering per metre). Bright fog = high β.
- Contrast decays **exponentially**, so it collapses fast then asymptotes — the first
  40–60m eat most of the contrast, and everything past ~2× visibility is mush.
- Meteorological visibility `V = 3.912 / β` (the range where contrast hits the ~2%
  human threshold). So if you want props to still resolve at 120m, tune β so your
  2%-threshold visibility sits well beyond 120m (β ≈ 3.912/400 ≈ 0.0098 /m for a
  400m visibility feel — props at 120m keep ~e^(−1.17) ≈ 31% of their near contrast).

**Where the value goes — the key insight for a BRIGHT biome.** Koschmieder is
airlight-additive: apparent luminance `L(x) = L_obj·e^(−β·x) + L_air·(1 − e^(−β·x))`.
Every pixel is dragged toward `L_air` (the airlight / veiling luminance of the medium).

- In a DARK scene `L_air` is bright sky, so **distant darks get LIGHTER** (the familiar
  "mountains go pale blue"). 
- In a BRIGHT scene `L_air` is already near-white and high, so distant objects
  **converge UP toward that near-white** — pale bodies get PALER, not darker. This is
  exactly the Empyrean's theology: the convergence target is light, so distance =
  brightening + contrast loss, never darkening. A far silhouette is a *slightly-less-bright*
  smudge on a bright field, separated by a few value points, not a dark cutout.
- Real references: **sea fog at noon**, **polar whiteout** ("milk-bowl" effect — sky and
  ground merge into one seamless bright expanse, total loss of contrast/depth cues),
  and a **diver's upward view near the surface** (Snell's-window brightness with silhouettes
  reading pale-on-bright). All three lose the horizon and flatten value while staying bright.

**Hue shift.** Scattering is wavelength-selective, so the veil drifts the far field
subtly COOL (pale blue/cyan/grey) even in warm light — colors desaturate toward the
airlight's neutral, and saturation collapses faster than value. In a very bright/white
medium the drift is *slight* cool-neutral (do not over-blue it or you re-introduce a dark
cool anchor). Near field keeps warm/iridescent chroma; far field is a desaturated pale opal.

**The whiteout trap (the slop tell), stated precisely.** A *uniform* white alpha wash
(constant α everywhere) makes `L(x)` converge at the same rate for every pixel → contrast
dies uniformly → the milk-bowl, zero depth. Depth survives ONLY if the contrast-decay is
**depth-graded** (β·x scales with distance) AND you preserve residual near-field
micro-contrast + overlap ordering. Uniform veil = flat. Graded veil = deep.

---

## 2. Three-layer high-key depth recipe (everything is light)

Separate the three bands by **which channel carries the depth cue**, because value can't:

| Band | Distance | What separates it | Levers |
|------|----------|-------------------|--------|
| **NEAR** | 0–35m | **Detail + iridescence + micro-contrast.** Full-chroma opal/pearl highlights, crisp edges, specular/fresnel shimmer, texture grain. This is the only band allowed real local contrast. | fog factor ≈ 0; full material chroma & spec; sharp normals; iridescence/thin-film on rim |
| **MID** | 35–90m | **Pale silhouettes at descending contrast + OVERLAP.** Edges soften, chroma drops ~50%, value lifts toward airlight but bodies still sit a few points below it. Depth read from *which pale shape occludes which*. | β·x → ~0.4–1.0; desaturate 40–60%; edge-soften/bloom; keep overlap ordering intact; slight cool drift |
| **FAR** | 90m+ | **Opal dissolve.** Silhouettes become pale ghosts ~1 value-band above the mid bodies but only ~8–15% Weber contrast off the sky; near-total chroma loss; forms defined by faint contrast edges, not fill. Horizon vanishes (sky = fog = water same value). | β·x → 1.2–2.5; chroma ≈ 0.1×; edge = soft gradient; converge value to airlight; add gentle up-bloom |

**Global levers an artist/shader tunes** (name them for the build):
- **β / fog density** (exponential extinction) — the master depth dial.
- **Airlight color & luminance** (the convergence target) — set this HIGH and near-white,
  faintly cool. This replaces "fog color = grey" with "fog color = luminous opal."
- **Height/altitude falloff** — thicker veil low (near water), thinner up-high, so the
  vertical also reads.
- **Saturation-vs-distance curve** — desaturate *faster* than you lift value (chroma
  dies before value converges → keeps it feeling bright not muddy).
- **Residual micro-contrast floor** — a small preserved local-contrast term so the far
  field isn't perfectly flat (kills the milk-bowl).
- **Bloom / additive up-glow** — pushes highs together at the top of the range and sells
  "dissolving into light" without any dark to anchor against.

---

## 3. Value targets — where convergence sits vs. a pale prop body

Work in a **high-key window**: use only the top ~40% of the value scale. On a 0–100
lightness scale (0–255 in parens):

- **Airlight / sky = fog = water convergence value:** ~**88–90%** (≈ 225–230/255).
  Near-white but NOT pure 100% — leave headroom so specular highlights and the sun-core
  can still punch above it. Pure white = you lose the top and everything below reads dim.
- **Pale prop body at ~120m:** should resolve at ~**73–78%** (≈ 185–200/255) — i.e.
  **sit 12–17 lightness points (≈ 30–45 in 8-bit) BELOW the convergence value.**
  That yields Weber contrast `(225−192)/225 ≈ 15%` — comfortably above the ~2% detection
  threshold (so it *reads*) yet far below a dark silhouette (so it stays PALE, on-theme).
- **Target value-separation to bank on: keep ≥ ~10% lightness (≥ ~25/255) between the
  far body and the fog it sits against at your farthest "must-read" range (~120m).**
  Below ~8% it dissolves (intended only past the read-distance); above ~20% it starts to
  look like a dark cutout — the ceiling that protects the theology.
- **Near band** can open the window down to ~55–60% in shadow cores (iridescent
  half-tones) — but that's the *darkest value permitted*, and only up close where chroma
  sells it as color, not shadow. Nothing in the mid/far bands goes below the prop-body
  floor. Threat objects are the ONLY things allowed to break downward past ~50%.

Rule of thumb: **contrast budget shrinks with distance, value floor rises with distance.**
Near = wide value range (55–100). Mid = compressed (70–92). Far = razor-thin (80–90).

---

## 4. How masters do "vast + bright + deep" with no dark anchor

- **J.M.W. Turner** (*Norham Castle, Sunrise*; *The Fighting Temeraire*; late sea/sun
  studies) — the canonical proof. Depth from **glazing** (thin translucent layers building
  luminosity) and **narrow-value / high-key** transitions, not chiaroscuro. Warm core
  (yellow/orange sun) bleeding to cool pale greys at distance; forms dissolve into the
  light; horizon barely exists. He separated tiny dots of pure color so they'd mix
  *additively brighter* — brilliance without darkening.
- **Caspar David Friedrich** fog pieces (*The Wanderer*; *Morning Mist in the Mountains*) —
  overlapping **pale silhouette planes** (ridges/trees) at descending contrast; depth
  entirely from stacked overlap + contrast-decay, layers going paler and cooler with each
  step back, never darker.
- **Journey** (thatgamecompany, AD Matthew Nava) — Impressionist high-key desert; distance
  handled with **light haze + heat shimmer** and pale layered dunes; silhouette + soft
  atmospheric falloff carry depth instead of shadow. Direct game-art precedent for
  bright-scattering depth.
- **Diver / underwater upward shots & Turner's sea-fog** — silhouettes read **dark-pale
  on bright** near the surface; but in high-key grading the same forms are lifted to
  pale-on-brighter — the compositional structure (overlap + contrast gradient) does the
  depth work, value convergence does the mood.
- **Whiteout / polar photography** — the *negative* example to design against: when the
  veil is uniform you get the milk-bowl (no depth). Studying it tells you exactly what to
  avoid: never let β·x be constant across the frame.

---

## 5. Sources

- Aerial perspective — Wikipedia (contrast decay, hue shift, dark-lightens/bright-darkens):
  https://en.wikipedia.org/wiki/Aerial_perspective
- Koschmieder model & visibility (contrast `C=C0·e^(−βx)`, V=3.912/β, fog limitations):
  https://cpb-us-w2.wpmucdn.com/blogs.umb.edu/dist/d/1690/files/2014/12/Lee_2016_Visibility-1quaaje.pdf
- Whiteout weather — Grokipedia (milk-bowl effect, total loss of contrast/depth):
  https://grokipedia.com/page/Whiteout_(weather)
- High-Key Painting — Art Studio Life (narrow high-value range, subtle-value depth):
  https://artstudiolife.com/high-key-painting/
- Turner's technique — CyPaint (glazing, layering for luminous atmospheric depth):
  https://cypaint.com/article/how-did-j-m-w-turner-paint
- Impressionism in Gaming: Journey's visual style (light haze, high-key depth):
  https://www.geekpaintings.com/impressionism-in-gaming-the-visual-style-of-journey/


---

# R4 — Pale Megalith / Standing-Stone Language (for "The Empyrean")

Grounding for the **sentinel** monolith (thin, tall, bone-nacre), **broken ring-arcs**, and
**stele courts**. Numbers below come from real megalith surveys (Callanish/Calanais, Ring of
Brodgar, Avebury, Stenness) plus weathered-marble/SSS optics and game-sculpting practice.
Everything is expressed as **parameter ranges a ≤150-tri low-poly procedural builder can consume**.

---

## 1. Proportion, taper & lean — surveyed ranges

Real standing stones are **slab-like, not columnar**: they are wide across one axis, thin on the
other, and taper unevenly. Surveyed anchors:

| Stone | Height | Width | Depth | h:w | w:d |
|---|---|---|---|---|---|
| Callanish central monolith | 4.8 m | 1.5 m | 0.3 m | **3.2 : 1** | **5 : 1** |
| Callanish ring stones (avg) | ~3.0 m | ~1.0–1.5 m | 0.2–0.4 m | 2.5–3.5 : 1 | 4–6 : 1 |
| Ring of Brodgar (range) | **2.1 – 4.7 m** | ~1–1.8 m | 0.25–0.5 m | 2.5–3.5 : 1 | 4–6 : 1 |
| Avebury "pillar" type | 3–5 m | 1.5–2.5 m | 0.5–1 m | 2–3 : 1 | 2.5–4 : 1 |
| Avebury "lozenge" type | 2.5–4 m | 2.5–3.5 m | 0.6–1.2 m | 1–1.5 : 1 | 2.5–4 : 1 |

**Sentinel (thin, tall, bone-nacre) generator params:**
- **height : width ≈ 3.0–3.8 : 1** (tall/slender end; go 3.5:1 for the hero).
- **width : depth ≈ 4.5–6 : 1** — the stone is a **thin blade**, one broad face and one narrow
  edge. This flat-slab silhouette is the single most important read; a square/round cross-section
  is the "extruded capsule" slop tell.
- **Cross-section is a lens/ellipse, NOT a rectangle**: broad face bulges slightly (convex),
  narrow edges round off. Rectangular slab = slop.
- **Taper is asymmetric**: top width = **0.55–0.80 × base width**, and the taper is *offset* — the
  two long edges converge at different rates (one edge near-vertical, the other raked in
  8–20°). Never mirror the two edges (symmetric taper = slop tell).
- **Base thickening**: bottom 15–25% of height flares to **1.1–1.3 × mid-shaft width/depth**
  (buried socket + wind-protected foot survives; the stone "grows" out of the ground rather than
  being planted on it).
- **Lean**: **2–6° off vertical** (surveyed Gardom's Edge monolith ≈ 4 ± 4°). Tilt in a random
  compass direction; add a tiny **0.5–2° twist** about the vertical axis so the broad face isn't
  square to the ring. Zero lean reads as a fabricated post.

---

## 2. Erosion distribution on a single stone (low-poly rules)

Weathering is **directional and zoned**, not uniform noise. Distribute it so a low-poly generator
gets it "for free" in the vertex displacement + normal bake:

- **Crown (top 20%)** — most exposed. **Rounded, softened, edges killed.** Karst "solution pits"
  and shallow bowls form on any near-flat top surface where rain pools. Rule: **round the top
  corners hard (large fillet), knock 1–2 shallow concavities into the crown.** No sharp apex.
- **Windward broad face** — scoured smooth by wind-driven rain; develops **planar wind-facets**
  (2–4 large flat-ish planes meeting at soft ridges) and vertical **decantation flutings /
  runnels** (shallow grooves running top→bottom where water sheets down). Rule: **1–3 broad
  planar facets on the exposed face + faint vertical grooving.**
- **Lee (sheltered) face** — retains more original relief, rougher, more surviving edges and
  small ledges. Rule: **keep this face busier / more angular than the windward face** (asymmetry
  between the two broad faces is a strong authenticity cue).
- **Mid-shaft** — least changed; carries the primary planes.
- **Base (bottom 15–25%)** — **thickened, rougher, more angular**, often with a soil/lichen line;
  wind can't scour the foot. Rule: **least eroding = keep sharper edges + the flare here.**
- **Edge-rounding gradient**: edge sharpness should **increase from crown (roundest) → base
  (sharpest)**. A single "edge-round" parameter driven by normalized height (0 at top → 1 at base)
  reproduces the whole weathering story cheaply.
- **Sculpt order (game practice):** big planes → mid fractures/cleavage → micro-pitting (bake to
  normal, don't spend tris). **Never symmetric.** Large flat planes + a few chips read as stone;
  uniform bumpy noise reads as "gray rock primitive."

**Triangle budget (≤150 tris):** ~8-sided lens cross-section × 4–5 height rings ≈ 80–110 tris for
the shaft, leaving ~30–40 for the flared base ring and crown cap. Break vertical edge loops by
jittering each ring's rotation ±3–8° and each vertex radius ±8–15% so no two rings align (kills the
"lathe-turned" look).

---

## 3. Stone-circle / stele-court clustering — a congregation, not a picket fence

Surveyed circles are **irregular in spacing, height, and lean**. Use these scatter ranges:

- **Spacing (center-to-center):** Brodgar ≈ 104 m ⌀, ~60 stones → ~5.4 m mean gap; Callanish ring
  11.4 m ⌀, 13 stones → ~2.75 m mean gap. **Rule: mean gap ≈ 2–3.5 × stone width, with per-gap
  jitter of ±25–40%** (some stones nearly touch, some leave a wide breach). Never constant arc-step.
- **Ring is NOT a true circle**: flatten one side. Callanish ring is 13.4 m N–S × 12 m E–W
  (~**10–12% ellipticity**). Rule: radius varies **±8–15%** around the ring; also jitter each
  stone **radially ±0.1–0.3 × width** (in/out of the nominal ring line) so they don't sit on a
  perfect circle.
- **Height variation within one ring:** Brodgar spans **2.1–4.7 m (tallest ≈ 2.2 × shortest)**.
  Rule: **per-stone height = base × [0.6 … 1.6] random**, ideally graded (taller stones toward one
  arc / the "focal" side, e.g. a tall central sentinel + shorter attendants).
- **Lean scatter:** each stone gets its **own** 2–6° lean in a **random azimuth** (not all leaning
  the same way unless simulating one-directional subsidence). Add ~10–20% **fallen/leaning-hard
  (15–40°) or stump** members for a *ruined* court.
- **Rotation:** randomize each stone's broad-face azimuth **±90°** — some present the blade, some
  the edge. Identical clones at identical yaw = the #1 picket-fence tell.
- **Type mix (Avebury):** alternate/scatter **2–3 archetypes** — slender "pillar," broad "lozenge,"
  and squat "stump" — rather than one cloned mesh. 3 base meshes × the per-instance jitter above
  reads as dozens of unique stones.
- **Completeness:** a real ruin has **gaps** — leave 20–40% of ring positions empty or as
  buried/broken stumps (partial arcs). This alone sells "ancient" over "installed yesterday."

---

## 4. Pale stone in contre-jour / backlight (rim-light-on-edges rule)

Bone-nacre / weathered marble is **mildly translucent**: subsurface scattering makes **thin
geometry glow** because light has less material to cross before it exits. This drives a
**rim-light-on-edges-ONLY** rule — never a uniform outline (uniform outline = cheap Fresnel-shell
slop tell).

- **Where rims live:** only on **thin, back-facing silhouette edges** — the crown, the tapered
  top, the narrow blade-edges, and the thinned ends of broken arcs. These are where the stone is
  physically thinnest, so SSS + rim is strongest. Thick mid-shaft = little/no rim.
- **Rim intensity ∝ thinness × backlight alignment**: modulate rim by (a) `dot(viewDir, -lightDir)`
  (contre-jour only) and (b) local thickness proxy (edge/curvature or normalized height — thinner
  top glows more than thick base). A rim that is equally bright all the way around = fake.
- **Rims BREAK, not wrap:** where an edge thickens (base flare, a surviving ledge) the rim should
  **fade to nothing**; the glow lives in **arcs and dashes along the crown and one lit edge**, not
  a continuous halo. Interruptions where facets turn away sell it.
- **Color:** warm-tinted at the thinnest points (light picks up the stone's internal warm cream/
  amber before exiting) → cooler/dimmer as thickness grows. Bone-nacre: pale warm ivory core, cool
  bluish body shadow, thin warm SSS rim — a **core→bloom→dark** value structure on every stone.
- **Face:** the broad face in shadow stays **soft and matte** (marble is not glossy); keep specular
  low and let the *edge* do the drama. Cheap tell to avoid: chrome/hard specular outline.

---

## 5. Broken ring-arc form (ruined arches / snapped rings)

How real arches and ring-monuments actually fail — so the broken arc isn't a clean-cut donut slice:

- **They snap at the crown/apex.** The top of an arch is the thinnest, most freeze-thaw-weathered,
  least-supported span → it fails there first, dropping the keystone and leaving **two opposing
  stubs that rise and thin toward the break.** Rule: model a full arc, then **delete the top
  15–40%**; the surviving ends should be the *rising* legs.
- **Ends taper to a ragged, thinned tip**, they do not end in a flat clean face. The break follows
  cleavage/jointing → an **angular, faceted fracture** roughly perpendicular-ish to the arc but
  jagged (±20–30° off). Give the broken end **1.5–2.5 × the edge-roundness** of the rest (weather
  has since worked the fresh break) and shave its cross-section to **60–80%** of the arc's mid
  thickness (arches thin toward the apex).
- **Differential survival:** the **base/legs are thickest and best-preserved**; thickness should
  **decrease monotonically from foot → break.** A snapped arc = a heavy rooted leg tapering up to a
  light broken tip.
- **Debris + lean:** the fallen keystone/upper span lies as **1–2 tumbled blocks** near the base;
  surviving legs often **lean inward or splay** a few degrees from losing their keystone
  (add 2–8° extra lean to arc legs vs. free stones).
- **Ring-arcs as a set:** a "broken ring" = several standing stones + toppled stumps forming a
  **partial arc (40–75% of the circle present)**, not a complete circle with one gap. Combine with
  §3 completeness (20–40% missing) for the ruined-court read.

---

## 6. Reference sources

1. Callanish Stones — dimensions of the central monolith & ring, avg heights, ellipticity:
   https://en.wikipedia.org/wiki/Callanish_Stones
2. Ring of Brodgar — height range (2.1–4.7 m), diameter, stone count/spacing:
   https://en.wikipedia.org/wiki/Ring_of_Brodgar
3. Gardom's Edge monolith — measured lean (~4 ± 4°) & karst weathering (solution pits, runnels,
   decantation flutings): https://arxiv.org/pdf/1203.0947
4. Avebury — undressed natural sarsens, "pillar" vs "lozenge" shape archetypes (English Heritage):
   https://www.english-heritage.org.uk/visit/places/avebury/history/description/
5. Backlit / translucent stone optics — SSS makes thin edges glow, veining depth in backlight:
   https://omnisurfaces.com/backlit-translucent-stone-design-technical-guide/  and
   NVIDIA GPU Gems Ch.16 real-time SSS: https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-16-real-time-approximations-subsurface-scattering
6. Game rock-sculpting practice — big planes → mid fractures → micro-pitting, kill symmetry,
   directional erosion passes: https://shawnspetch.artstation.com/blog/lPlL/damage-and-rocks-quick-tips
7. Arch/stack erosion — arches thin & fail at the crown, legs survive as tapering stumps (NPS):
   https://www.nps.gov/articles/arch-fallen-arches.htm


---

# R5 — INK-SHOAL / KOI SCHOOL MOTION

Reference grounding for **The Empyrean**: dark ink-violet koi drifting through the AIR
low over water, schooling gently UPWARD through frame (a "surfacing" read). Goal: a
believable LOOSE breathing shoal built as a **vertex-shader flock with per-instance
phase** — not a boids sim, not a screensaver lattice.

The whole thing is fake (no per-frame neighbor queries). We fake the *statistics* of a
real shoal: right nearest-neighbor spacing, right body-wave, right size spread, an
occasional turn-wave that SWEEPS the group, and a slow upward bias. Numbers below are the
knobs.

---

## 0. THE PHENOMENON (what makes it read real vs. slop)

Real shoals/schools are **loose breathing clouds**, not crystals. Key facts we exploit:

- **Nearest-neighbour distance (NND):** peak frequency at **~1–2 body-lengths (BL)**,
  most commonly **1.5–2 BL** to the nearest fish, with the closest neighbour preferentially
  **alongside** (lateral, roughly ±60° of heading), not nose-to-tail.
  ([Herbert-Read 2011 PNAS](https://www.pnas.org/doi/10.1073/pnas.1109355108),
  [Katz 2011 PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC3219116/))
- **Zonal rules:** short-range **repulsion** (don't collide, ≲1 BL), mid-range
  **alignment** (copy neighbour heading, ~1–4 BL), long-range weak **attraction** (drift
  back toward the group). The shoal is the emergent equilibrium of these — a soft cloud
  with a fuzzy boundary, NOT constant spacing.
- **Turn-waves / escape cascades:** a directional change initiated by a few fish
  **propagates** across the group as a wave. Information travels **~10–20× faster than an
  individual fish swims** (measured startle-wave speeds ~**6–7 m/s** in herring; wave
  distance grows *linearly* with time). The turn is **non-reciprocal / visually driven**:
  it sweeps front-to-back / edge-to-center, it does not appear everywhere at once.
  ([Rosenthal 2015 PNAS](https://www.pnas.org/doi/10.1073/pnas.1420068112),
  [Poel 2022 Sci Adv "subcritical escape waves"](https://www.science.org/doi/10.1126/sciadv.abm6385),
  [Sosna 2019 / collective U-turns](https://royalsocietypublishing.org/doi/10.1098/rspb.2018.0251))
- **Density breathes:** groups compress and expand — polarization and NND fluctuate over
  seconds. A shoal is never at one fixed density.

**The SLOP TELL to kill:** identical fish, constant spacing, every fish beating its tail
in the same phase, the whole group turning in lockstep, hard rectangular/disc boundary.
That's "boids on rails" / aquarium-screensaver. Every fix below attacks one of those.

---

## 1. SHOAL AS A VERTEX-SHADER FLOCK (per-instance phase)

We do NOT run boids. We place N instances on a **procedural, breathing point cloud** and
animate each with a per-instance seed. This reproduces the *look* of the interaction rules
without O(N²) neighbor queries.

### 1a. Base placement — loose cloud, not a lattice
Per instance `i` (constant, from a hash of instance ID → `seed ∈ [0,1)^3`):
- Home position = school-center + **jittered** offset. Do NOT use a grid. Use a
  low-discrepancy scatter (e.g. blue-noise / Halton) inside an **ellipsoid** elongated
  along travel direction (schools are longer than wide). Ellipsoid semi-axes ≈
  `(6, 3, 4) × meanBL` for ~30–60 fish — this yields mean NND landing in the **1.3–2 BL**
  band. Tune N/volume so NND stays in that band; if you add fish, grow the volume.
- **Per-instance NND jitter:** offset each home by ±0.5 BL of noise so spacing is *never*
  constant. Constant spacing is the #1 tell.

### 1b. "Breathing" the cloud (fakes attraction/repulsion equilibrium)
Modulate each instance's home offset by a slow scalar:
```
breathe = 1.0 + 0.15 * sin(t*0.35 + seed.x*TAU);   // ±15% radius, ~18s period
pos.xyz = center + homeOffset * breathe;
```
Give each fish a **small independent orbital wander** (Perlin/curl noise in position,
amplitude ~0.3–0.6 BL, timescale 3–6 s) so individuals slide within the cloud — this is
what sells "alive" over "rigid formation."

### 1c. Turn-wave that SWEEPS the school (the money shot)
The single most important non-slop feature. Occasionally the whole shoal banks/turns, but
the turn **propagates** rather than snapping. Implement as a phase gradient along a sweep
axis:
```
// wavePhase advances a plane through the cloud along dir 'w' (e.g. travel axis)
float d = dot(homeOffset, w);                       // fish's position along sweep axis
float lead = d / waveSpeed;                          // fish farther along react later/earlier
float turnAmt = turnEnvelope(t - lead) ;             // 0..1 pulse, ~0.6-1.2s rise
// apply as heading rotation + lateral shove
heading = slerp(baseHeading, turnedHeading, turnAmt);
pos += lateralShove * turnAmt;
```
- **waveSpeed:** set so the wave crosses the whole cloud in **~150–350 ms** (≈10–20×
  slower than the per-fish nominal drift, matching the real 10–20× information-speed ratio
  — i.e. the wave is fast relative to swimming, but still visibly a *sweep*, not
  instantaneous). For a 6-BL-long cloud this is roughly `waveSpeed ≈ cloudLength / 0.25s`.
- Fire turns **stochastically**, every ~4–10 s, alternating direction, with a randomized
  amplitude (small course-corrections most of the time, a bigger banked whip occasionally).
- Fish should **align tighter (NND shrinks, polarization ↑) during a turn** then relax —
  drive `breathe`'s amplitude down for ~1 s after a turn-wave.

### 1d. Per-fish heading & lean
Each fish's heading = school heading + small persistent per-instance yaw offset
(`±8°`, from seed) + turn-wave contribution. **Bank (roll) into turns** proportional to
`turnAmt` (~15–30° roll) — banking is a huge realism cue and nearly free.

---

## 2. KOI BODY-WAVE SWIM (cheap per-vertex sine)

Koi/carp are **subcarangiform** swimmers: **head stays nearly stable**, undulation
amplitude grows toward the tail, most of the visible motion is in the **posterior
third**. Wavelength ≈ body length (`λ/L ≈ 1`), i.e. roughly **one full wave visible along
the body at any instant**. Amplitude rises **nonlinearly** head→tail (small, then ramps
in the back third). ([Di Santo 2021 PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC8670443/),
[Wu 2007 JEB koi burst-and-coast](https://journals.biologists.com/jeb/article/210/12/2181/16867/))

### 2a. The core lateral-wave vertex displacement
Let `u ∈ [0,1]` = normalized position head(0)→tail(1) along body (from vertex x or a baked
attribute). Displace laterally (local z, the side-to-side axis):
```glsl
float amp   = maxAmp * pow(u, 1.8);          // ~0 at head, ramps in posterior third
                                             //  (nonlinear rostro-caudal growth)
float phase = TWO_PI * (u / lambdaL) - w*t;  // backward-travelling wave; lambdaL ≈ 1.0
lateral    += amp * sin(phase + instPhase);  // instPhase = per-instance offset (below)
```
- **maxAmp (tail-beat half-amplitude):** ~**0.08–0.12 × bodyLength**. Koi are stiff-ish
  swimmers — keep it modest; over-amplitude reads as an eel, not a koi.
- **w (angular tail-beat freq):** tail-beat **frequency ~1.5–3 Hz** at a lazy cruise
  (`w = 2π·f`). Slow drifters sit at the low end; a fish accelerating out of a turn briefly
  bumps `f`. **Tie amplitude & frequency together** — faster ⇒ slightly higher f and amp.
- **lambdaL ≈ 0.9–1.1** (one wave per body length) → subcarangiform look. Lower it toward
  0.6 and it turns anguilliform/eel-like; keep near 1.
- Head stability: because `amp ∝ pow(u,1.8)`, the head barely moves — correct for koi. Add
  a *tiny* counter-yaw at the head (`~0.15×` the tail's lateral, opposite sign) for the
  natural recoil, optional.

### 2b. Per-instance phase = the anti-slop dial
The single line that breaks the lockstep tell:
```
float instPhase = hash(instanceID) * TWO_PI;   // every fish beats its tail out of phase
float instFreq  = wBase * (0.85 + 0.30*hash2(instanceID)); // ±15% freq spread
```
Never share phase across instances. Add ±15% frequency spread so tails slowly drift in and
out of sync — real shoals are never metronomic.

### 2c. Fins (cheap, high payoff)
- **Caudal (tail) fin:** it's just the u→1 end of the same wave; let the fin verts use
  `pow(u,1.8)` continuing past 1.0 so the tail fin sweeps **widest and lags** the body
  (a few degrees of phase lag → the fin "whips" a beat behind the peduncle). This lag is
  the difference between a living tail and a rigid paddle.
- **Pectoral fins:** low-amplitude independent flutter, `sin(t*3 + instPhase)` at ~2–4 Hz,
  amplitude tiny — they mostly read as a shimmer at distance. Don't over-animate; at tiny
  apparent size they collapse to a flicker anyway.
- **Dorsal/pelvic:** ripple = a scaled copy of the local body-wave phase at that u. Free.

At the intended tiny on-screen size, only the **caudal sweep + overall body S-curve**
actually register — spend your vertex budget there.

---

## 3. SILHOUETTE VARIATION & THE TINY-SIZE / LOOSENESS RULE

At **0.3–0.5° apparent size** (a koi ~15–25 px, often fewer), you resolve almost no
detail: color blob + orientation + the S-flex. So variation must live in **silhouette
scale, orientation, and spacing**, not surface detail.

### 3a. Body-size spread (2–3 classes)
Give the shoal a size distribution, not one size:
- **~60% "medium"** (baseline BL), **~25% "small"** (0.7× BL), **~15% "large"** (1.4× BL).
  Real koi shoals are size-mixed; a monoculture of identical fish is an instant AI-art tell.
- Scale is per-instance from seed; also vary body **aspect** slightly (±10% length:width) so
  silhouettes aren't stamped clones.
- Larger fish should drift slightly slower (lower tail-beat f) — size↔frequency coupling
  adds free realism and de-syncs the group further.

### 3b. THE LOOSENESS / SIZE RULE — never a solid disc/mass
The failure state at tiny size is the shoal **merging into one dark blob** (a "disc" or
smear). Enforce **negative space**: keep the **projected inter-fish gap ≥ ~1 fish-width**
on screen at all times. Concretely:
```
minScreenGap ≈ 1.0-1.5 × meanFishWidthPx   // keep sky visible BETWEEN fish
targetDensity: silhouettes should cover < ~35-40% of the shoal's bounding footprint
```
- Because apparent size shrinks with distance but the cloud also foreshortens, **scale the
  cloud's world-space radius with distance** (or cap fish count) so the *projected* NND
  never drops below the gap threshold. A shoal must always read as **punctuation** — a
  scatter of dark marks with sky between them — never a filled shape.
- Tint/opacity variation: give each fish tiny per-instance value/hue jitter (±8% lightness
  around the ink-violet) and a hair of translucency so overlaps don't stack into a black
  hole. This keeps the mass from reading as a single silhouette.
- **Orientation variance is your friend at distance:** the ±8° per-fish yaw + turn-wave
  means the group of tiny marks flickers between broadside (visible) and head-on
  (near-invisible) — that twinkle is exactly the "shoal of little dark commas" read and it
  automatically breaks any solid-disc appearance.

---

## 4. UPWARD-DRIFT / SURFACING BIAS

The Empyrean read is fish **rising** gently through frame. Make the upward bias structural
but organic, not a uniform escalator.

- **Global drift:** whole school-center travels along a mostly-horizontal path with a
  **gentle positive vertical component** — pitch the travel vector up ~**5–15°**, slow
  speed (a lazy cruise, ~0.5–1 BL/s of net rise). Keep it slow: "drift," not "launch."
- **Sinusoidal climb, not a ramp:** superimpose a slow vertical bob on the school-center
  (`+A·sin(t·0.2)`, A ≈ 1–2 BL, ~30 s period) so the rise **undulates** — real surfacing
  is porpoising, a series of gentle rises, not a straight-line elevator.
- **Per-fish rise stagger:** phase the vertical component by per-instance seed so fish rise
  at slightly different times — the school "peels upward," leaders cresting while others
  lag. `vOffset += riseAmp * smoothstep pulse(t - seed.z*period)`. This is a slow vertical
  cousin of the turn-wave in §1c and it's what makes the surfacing look like a *shoal*
  choosing to rise, not a rigid group teleporting up.
- **Nose-up pitch while climbing:** tilt each fish's pitch up proportional to its current
  vertical velocity (~+10–20° when rising fastest). Fish point where they go — a flat
  horizontal fish sliding upward looks wrong.
- **Buoyant ease:** rises should **ease-out** (decelerate near the top of each bob) like
  something surfacing against buoyancy, then a slow sink before the next rise. Asymmetric
  in/out timing (slower up, quicker settle, or vice versa) kills the metronome feel.
- Optional coupling: bias the **turn-waves** (§1c) to fire near the *top* of each climb, so
  the group crests, banks, and the wave sweeps as they hang at apex — reads as a deliberate
  "surface and scatter" beat.

---

## 5. QUICK-BUILD PARAMETER CARD

| Knob | Value | Why |
|---|---|---|
| N fish | 30–60 | reads as a shoal, not a swarm |
| Cloud shape | ellipsoid, semi-axes ~(6,3,4)×BL | longer than wide (travel-elongated) |
| Mean NND | 1.3–2 BL, jittered ±0.5 BL | real shoal band; never constant |
| Neighbor bias | closest fish lateral (±60°) | matches real interaction geometry |
| Breathe | ±15% radius, ~18 s | density fluctuates, not fixed |
| Turn-wave crossing time | 150–350 ms | ~10–20× swim speed; a SWEEP not a snap |
| Turn interval | every 4–10 s, alt. dir | stochastic course changes |
| Bank/roll in turn | 15–30° | huge realism cue, free |
| Tail-beat freq f | 1.5–3 Hz, ±15% per fish | lazy cruise, de-synced |
| Tail amp | 0.08–0.12×BL | koi = stiff subcarangiform, not eel |
| Wavelength λ/L | ~1.0 | subcarangiform look |
| Amp gradient | pow(u, ~1.8) | head-stable, tail-driven |
| Per-instance phase | hash(id)×2π | KILLS lockstep tell |
| Size classes | 0.7× / 1.0× / 1.4× BL (25/60/15%) | mixed shoal, no clones |
| Screen looseness | gap ≥ ~1 fish-width; footprint fill <40% | never a solid disc |
| Upward pitch of travel | +5–15° | gentle surfacing rise |
| Climb bob | A≈1–2 BL, ~30 s, ease-out | porpoising, not an elevator |
| Nose-up pitch | +10–20° ∝ vertical velocity | fish point where they go |

**Three lines that do 80% of the anti-slop work:** (1) `instPhase = hash(id)*2π` on the
body-wave, (2) the front-to-back `turn-wave` phase gradient, (3) mixed size classes + NND
jitter so nothing is a clone on a grid.

---

## 6. SOURCES

- Herbert-Read et al. 2011, *Inferring the rules of interaction of shoaling fish*, PNAS —
  zones, NND, lateral-neighbour preference.
  https://www.pnas.org/doi/10.1073/pnas.1109355108 /
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3219133/
- Katz et al. 2011, *Inferring the structure and dynamics of interactions in schooling
  fish*, PNAS — alignment/attraction structure, NND.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3219116/
- Rosenthal et al. 2015, *Revealing the hidden networks of interaction… behavioral
  contagion*, PNAS — turn-wave / startle cascade propagation, visual non-reciprocal
  transmission. https://www.pnas.org/doi/10.1073/pnas.1420068112
- Poel et al. 2022, *Subcritical escape waves in schooling fish*, Science Advances —
  wave speed, front-to-back sweep, information ~10–20× swim speed.
  https://www.science.org/doi/10.1126/sciadv.abm6385
- Di Santo et al. 2021, *Convergence of undulatory swimming kinematics across a diversity
  of fishes*, PNAS — subcarangiform amplitude gradient (nonlinear head→tail), λ/L≈1.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8670443/
- Wu, Yang, Zeng 2007, *Kinematics… burst-and-coast swimming of koi carps (Cyprinus carpio
  koi)*, J. Exp. Biol. — koi-specific tail kinematics, tail-beat behavior.
  https://journals.biologists.com/jeb/article/210/12/2181/16867/
- Craig Reynolds 1987, *Flocks, Herds, and Schools* (boids) — zonal rules & the
  limited-perception failure mode (why perfect-info boids look fake).
  https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87/


---

# R6 — The Mote (black disc) + Contre-jour rim on pale stone

Reference grounding for **The Empyrean**: a bright luminous void whose ONE dark
element is a perfectly black disc ("the Mote"), plus pale edge-lit stones. Goal is
legit eclipse/contre-jour optics, not AI-slop "dark grey disc + soft gradient + gold
flare corona." **Gold corona is FORBIDDEN** (owned by another biome/boss).

The single unifying physical fact behind both halves: **when a bright field
back-illuminates a mass, the surface facing you receives no light, so all information
collapses to the EDGE.** The interior is dead; the drama is a boundary event. Both the
Mote and the stones are the same optics at two scales.

---

## HALF A — THE BLACK DISC (eclipse optics)

### 1. How black-against-bright actually reads

- **The edge is HARD, not soft.** In totality the lunar limb is the sharpest thing in
  the frame — photographers literally autofocus on it. A soft/feathered disc edge is the
  #1 slop tell. The transition from black to bright sky happens across **≈1 pixel** (a
  hard step), not a gradient ramp. Any anti-aliasing should be ≤1px of coverage blend,
  never a glow ramp.
- **The interior is FEATURELESS — the no-interior-detail law.** A silhouette against a
  bright field is defined by having *zero* internal tone or texture. The eye searches the
  black for detail, finds none, and that emptiness is the unsettling payload. Do NOT add
  interior noise, a center-darker vignette, a subtle sphere shade, or a rim of inner
  glow. The disc is a single flat value.
- **Value: go actually black, or near-black-cool.** True 0,0,0 reads as an intentional
  void. If the engine's bloom/tonemap lifts pure black, sink the disc to a value BELOW
  the darkest sky value by a clear margin (e.g. sky floor ~L18–22 → disc L2–5), and
  cool/neutral, never warm-grey. **Dark grey (L~30) + soft edge = the slop tell.** The
  Mote must be the darkest thing on screen by a wide gap; contrast against the bright
  field is the entire effect.
- **Minimum apparent size to read as a deliberate object.** Below roughly **8–10px
  diameter** a black dot reads as a dead pixel / sensor dust / compression artifact, not a
  designed object. To read as an ominous *placed mass*, target **≥ ~1.5–2° of view / a
  comfortable fraction of screen height** at hero framing — think how the eclipsed sun,
  though physically 0.5°, dominates because it's the only dark thing. Rule of thumb: the
  Mote should be at least the size a coin covers at arm's length on screen, and larger when
  it's the focal threat. Small = bug; large-and-still = dread.

### 2. Non-gold limb treatment, thinner than radius/8

Real totality gives you the vocabulary for a NON-corona edge accent:

- **The chromosphere / limb** is a *whisper-thin* bright arc hugging the black — in a
  real total eclipse the chromosphere ring is on the order of **1–2% of the disc radius**
  (arc-seconds against a half-degree disc). So "thinner than radius/8" is generous; aim
  **radius/20 to radius/40** — 1–3px on a disc a few hundred px wide.
- **Color / value — pale pearl, +≤1 step, NOT a corona.** The forbidden thing is a warm
  gold sunburst that *radiates outward*. Instead: a **cool pale limb-brightening that sits
  ON the edge and does not radiate** — light appears to *bend around* the mass. Pick the
  local sky color and push it **+1 value step only** and very slightly toward
  pearl/silver-cool (a hair of blue-white), e.g. sky L60 → limb L68 max. It is a
  *lightening of the edge*, not a colored light source. No hue that isn't already in the
  sky except a whisper of cool silver. Never exceed +1 value step or it becomes a glow.
- **It should be PARTIAL, not a full ring.** Bias the brightening to one arc (the side the
  ambient field is strongest), fading to nothing on the opposite limb. A complete even ring
  starts reading as annular/"ring of fire" or a lens artifact. A broken, one-sided
  hair-line of pearl reads as light grazing a solid body.
- **Hard inner boundary, soft outer falloff.** The limb touches the black with a hard
  edge (it's still the disc's silhouette); its OUTER side fades into sky over that same
  1–3px. It must never bloom into a soft halo more than ~radius/20. If you can see it as a
  "ring," it's too thick.
- **Optional micro-punctuation (use sparingly):** Baily's-beads logic — 1–2 tiny
  point-bright pips where the "limb" has a notch — can add life at one moment, but as a
  static tell it risks the diamond-ring cliché. Default OFF; reserve for a scripted beat.

### 4. Keeping the disc from reading as a "hole/bug" vs an intentional ominous object

A black circle can read three ways: (a) rendering bug / missing texture, (b) hole
punched in the sky, (c) a deliberate massive dark body. To force (c):

- **Give it the whisper limb (§2).** A pure hole has no edge event; the thin pearl
  brightening says "light is interacting with a *surface/mass* here," which a hole/bug
  never does. This single cue is the biggest hole→object shift.
- **Occlusion + parallax.** It must pass IN FRONT of things (stones, clouds, other
  geometry) and move on its own slow parallax track. A hole in the skybox can't occlude
  foreground; an object can. Even subtle: it should eclipse a star/mote or clip a
  stone's silhouette.
- **Perfect circularity + stillness.** Hold it a *mathematically perfect, stable* circle.
  Bugs flicker, z-fight, or have jaggy edges; holes reveal the layer behind. A flawless,
  serene, slowly-drifting disc reads as intent. Motion should be slow and deliberate,
  never jittery.
- **Scale it up past "dot."** See §1 min-size — a dead pixel is a bug; a moon-sized void
  is a presence.
- **Let the world react to it** (subtle): a faint cool shadow-side / value dip on stones
  facing it, or the field dimming a hair near it. Consequence = agency = object.
- **Do NOT** give it a gradient edge, a grey fill, or a corona — those read as "unfinished
  sphere" or "lens flare," i.e. back to bug/slop.

---

## HALF B — CONTRE-JOUR RIM ON PALE STONE

### 3. Rim-light placement rules for pale stone in contre-jour

Core physics: **the rim exists only where the surface normal turns perpendicular to the
line of sight AND faces the light — the tangent/grazing zone.** It is a terminator event,
not a decoration. This is why a uniform outline is wrong: a real edge only lights where
geometry grazes the source.

**Where the rim SITS (buildable as a 2-material chamfer-edge-strip low-poly rig):**

- **Rim = the chamfer strip on CROWNS and WINDWARD/light-facing VERTICAL edges only.**
  The little bevel facet at a top edge or the light-side corner turns tangent to the sky
  and catches the rim material. Put the bright rim material on those chamfer facets.
- **The big flat FACES stay dark** — they face the viewer, away from the source, so they
  get the dark silhouette material (near the stone's shadow value, not black — pale stone
  in shade is a low-mid cool grey, L25–40). Faces are where the "no light reaches the
  camera-facing surface" law lives.
- **Bottom edges, lee-side edges, and edges pointing away from the light get NO rim.**
  This is what makes it break.

**How thickness VARIES (never uniform):**

- **Thin where the edge is sharp / grazing angle is tight; fatter where the chamfer is
  wide or the edge rolls slowly through tangent.** A crisp top ridge = 1px hairline; a
  softly rounded shoulder = a few px band. Vary chamfer width around the mesh so the strip
  is naturally unequal — that variance alone kills the chrome-outline tell.
- **Brightest right at the tangent line, falling off fast to either side.** On the strip,
  ramp value with |N·L| grazing so it peaks and dies, not a flat fill.

**Where and how it BREAKS (the anti-chrome-outline rules):**

- **It breaks at every corner where the edge turns away from the light.** As a top ridge
  wraps around to the shadow side, the rim *stops* — often mid-edge. Discontinuity is
  correct and required.
- **It breaks where one form OCCLUDES another** (a near stone crossing a far one): the
  rim doesn't wrap the occluded overlap.
- **It breaks / fades on down-facing and viewer-facing edges** even if they're "outer"
  silhouette — outline ≠ rim. A silhouette edge that faces down or away carries no rim.
- **Net rule for the artist:** rim should cover maybe **30–60% of the total silhouette
  perimeter**, in arcs, with gaps. If it traces 100% of the outline evenly, it's chrome —
  the #1 slop tell. Thickness should visibly change along its length and it should have at
  least a few hard STOPS.
- **Value of the rim:** pale + cool, and it obeys the same +value-step discipline — it can
  be brighter than the Mote's limb (stones are closer/lit harder) but keep it a
  *lightening toward sky/pearl*, not a saturated glowing outline. Think chalk-white-cool
  edge catching sky, ~+2 to +3 steps over the shaded face, still below full sky white so
  it doesn't bloom into a neon piping. If it looks like an LED strip, desaturate and
  break it.

**2-material build summary:** Material A = shaded body (cool pale-grey, flat, on all
faces + lee/down edges). Material B = rim (cool pearl-white, on chamfer facets of crowns
and windward verticals only), its brightness driven by grazing angle so it peaks at the
tangent and fades — and physically *absent* from any chamfer that faces away/down. The
break comes for free from only assigning B to light-facing chamfers.

---

## 5. Reference sources

- Baily's beads / diamond ring / thin chromosphere limb (how thin the edge brightening is
  vs the disc) — https://en.wikipedia.org/wiki/Baily%27s_beads
- Eclipse phenomena, limb detail, prominences as a thin red arc at the edge —
  https://eclipse.aas.org/eclipse-basics/eclipse-phenomena
- Limb darkening / limb brightening optics (why the edge behaves differently from center)
  — https://en.wikipedia.org/wiki/Limb_darkening
- Silhouette optics: featureless interior + light-background law (the no-interior-detail
  law) — https://en.wikipedia.org/wiki/Silhouette
- Contre-jour / shooting into the light (backlight = silhouette + edge separation) —
  https://www.institute-of-photography.com/contre-jour-photographing-into-the-light/
- Rim-light craft: rim depends on edge geometry/thickness, works on thin grazing edges,
  needs background contrast (why it breaks & varies) —
  https://thelenslounge.com/rim-light-photography/ and
  https://www.ephotozine.com/article/tips-on-using-rim-lighting-4855

