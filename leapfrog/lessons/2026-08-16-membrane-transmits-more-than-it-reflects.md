# 2026-08-16 — The membrane transmits 3× more than it reflects, and its colour is an exp(), not a texture

**Did / learned.** Wing Lab stream A2 researched the wing membrane as an optical object and wrote
`reforged/wing-lab/art/A2-membrane-surface.md`. The load-bearing measurement inverts how every
membrane in this repo is currently shaded: on taut bat wing segments, **albedo is 0.026–0.069 and
transmittance is 0.077–0.194, and "transmittance exceeded albedo in all species studied"**
(Speakman & Hays 1992), with **68–92 % simply absorbed** (Thomson & Speakman 1999). The two papers
close each other's budget to within a percent. So a membrane is a **dark sheet with a light leak**:
its diffuse-reflection channel — the only channel a `MeshStandardMaterial` membrane models — is the
*smallest* of the three, at 3–7 %. Front-lit, the membrane should be the **darkest element on the
dragon** (≈63/255 against bone at ≈179/255); backlit it becomes ≈3× **brighter** than the bone. That
~10× polarity swing is the wing's entire drama, and it only happens if the shader term is
**light-direction dependent**. The repo's shipped `membraneSSSPatch` is `pow(1 − |dot(N,V)|, p)` —
no light vector at all — so it glows identically with the sun in front and behind. That is
AAA-PIPELINE cheap-tell #4 (chrome outline) wearing translucency's clothes.

**→ Systematize.** The reusable move is **"a thin sheet's colour is one exponential of one vertex
float, and it needs no texture."** Jensen's measured `skin1` diffuse mean free path is
(3.67, 1.37, 0.68) mm — red penetrates **5.4× deeper than blue** — so locking `sigma` to the ratio
(1.00, 2.68, 5.41) and evaluating `exp(-sigma * d)` produces, for free, the ladder
**`#D19554` (thin, taut) → `#AB5415` (nominal) → `#711600` (deep cup, hem) → `#2E0000` (root)**.
Hue rotates 19° *toward* red and saturation *rises* as the sheet thickens. That is AAA-PIPELINE §1's
core→bloom→dark law arriving as physics instead of as taste. Cost: ~20 ALU, one float attribute,
zero textures, zero passes — versus `MeshPhysicalMaterial.transmission`, which spends a whole extra
scene render + mip chain to look worse. The generalisable pattern for the patch library is
**Frostbite/DICE back-translucency at the existing `dragonSurfaceShader.js` seams**: three.js r160
declares `directionalLights[]` above `main()`, and its `.direction` is already the view-space L
vector — the same space as `normal` and `vViewPosition` at the `emissivemap_fragment` seam. No new
varyings, no new material, no new pass. (Caveat recorded: that seam writes `totalEmissiveRadiance`,
which is unshadowed.)

**→ Leapfrog.** Three things get cheap now. First, **one `aMemThick` vertex float unifies this
stream with F1's fire wing**: Kirchhoff makes `ε = 1 − T`, so the *same* `exp()` that transmits
sunlight also emits heat — thick regions emit and don't transmit, thin regions transmit and don't
emit. The fire read and the backlit read stop fighting and stop needing separate authoring, and
F1's "emission peaks edge-on" and A2's "transmission troughs edge-on" turn out to be two ends of
one exponential. Second, **surface detail becomes subtractive and free**: veins modulate *thickness*
(deoxygenated venous blood absorbs ~10× more red than arterial and owns 80 % of vascular volume, so
backlit veins are **dark lines inside the glow**, never emissive), and they get a real generative
law from Murray — taper **0.794** per fork, asymmetric **24° at 90 % width / 52° at 65 %**, 4–5
orders, drawn as artery+vein **doublets** at 1.45:1 width. Third, a new **size cue** joins the
ripple-wavelength one: lateral light-bleed around an occluder is capped by a *fixed* 0.68–3.67 mm
diffusion length, so on a 30 m dragon the bones' shadows inside the glow must be **razor sharp** —
a soft halo around the wing bones instantly reads bat-sized.
