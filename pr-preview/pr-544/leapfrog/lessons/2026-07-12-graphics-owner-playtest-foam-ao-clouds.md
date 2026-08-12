# 2026-07-12 — graphics: owner playtest fixes (wispy foam, un-crushed AO, gentle clouds)

**Did / learned.** The owner played the PR-392 preview and flagged three look bugs on live mobile that the
headless gates had passed. All three were **tuning**, not correctness — the exact class the N10c lesson warned
about ("the code gate can't score intensity — the montage does"). Fixed all three surgically; every fix stays
behind its existing toggle with byte-identical-off untouched.

**1 — Foam collars read as a solid snow-cap, not foam (`propFoam.js`).** The prior pass had a
`brk = 0.5 + 0.5*…` **constant floor** — every foam cell was at least half-opaque, so the broken/pulsing top
half never actually tore the ring open; it welded into a continuous white band. Fix: **drop the floor** so
coverage falls to *zero* between clumps (real holes → the sea reads through → foam, not a cap), finer two-scale
world-cell hashing (4.5 / 11 vs 3 / 7, less blocky at close range), and a lower peak alpha (×0.72) so the clumps
are translucent. **→ Bank: an "always-on floor" is the enemy of anything that should read as broken/wispy
(foam, sparks, torn cloth). If you want gaps, coverage MUST reach 0 — a floor is a filled shape wearing a
noise texture.**

**2 — "Black blobs" on Frozen Reach crystal bases were over-cranked prop-AO, not water/shadow (`propAO.js`).**
Spent the forensics budget *isolating* before touching code — A/B toggles proved AO darkens crystals to dark
*navy* (never pure black), and confirmed Frozen's deep-water color is `0x122a4a` (dark blue, can't be the black
either). The real mechanism: the crystals are `ConeGeometry` whose big **base-cap faces point straight down**,
so they already get ~no sun and only Frozen's very dark hemi-ground light — the darkest face on the prop
*before* any AO. The AO `under` (down-facing) term at weight 0.55 then stacked on that unlit face and crushed it
to near-black at the low grazing waterline vantage. Fix: `under` 0.55→**0.30**, base 0.7→**0.55**, overall
`PROP_AO_AMT` 0.6→**0.42** — every vertex now floors at ≥0.58×, so AO still grounds bases but can never read as
a black patch. **→ Bank: baked AO must respect the lighting it rides on top of. A face that is already unlit
(downward-facing under a dark ground term) needs the LEAST extra AO, not the most — a naive `-normal.y` term
does the opposite and crushes exactly those faces to black.**

**3 — Sky clouds raced past (`skyClouds.js`).** Two motion terms: a gentle `time*0.006` drift and a
`playerDist*0.02` world-parallax. At cruise (~50 m/s) the parallax term dominates ~100:1 — a whole cloud swept
by every second. Real distant clouds barely parallax with forward speed. Fix: pull the parallax 10× down into a
shared **`CLOUD_PARALLAX = 0.002`** constant used by BOTH the shader-drift write and the `sunCloudCover` JS
parity port (same shared-constant-two-domains discipline as `SWELL`), so they can't drift apart; the `time`
drift is now the dominant motion (~one cloud-width / ~2 min). Test pins the magnitude + the shared constant.
**→ Bank: on a camera-locked far dome, world-parallax is a garnish, not the motor — keep it an order of
magnitude below the ambient time drift or the "sky" reads as a fast-scrolling texture.**

**The meta-lesson (again): live-mobile playtest is a gate the headless montage can't fully replace.** All three
survived the code gates because they're look/feel calls at a *vantage and exposure* the default hero montage
didn't frame (low grazing waterline; a phone's brighter tone-map crushing the navy to black). The reusable move
was to reproduce the owner's exact vantage — warp deep into the biome, let the recycling bands populate, freeze
on a frame where a *tall* prop looms in the chase view — then crop the base. Two harness gotchas re-confirmed:
(a) `?cleanshot` + the SW-block stub makes Playwright's `page.screenshot()` hang on `document.fonts.ready` →
capture via a **raw CDP `Page.captureScreenshot`** instead; (b) freeze too early after a warp and you shoot the
*previous* biome's leftover props — gate the freeze on `dist > biomeStart` AND a near tall instance.
`tools/foamfix.mjs` banks the working recipe.

**→ Leapfrog.** N10c's foam is now genuinely foam; N15's AO grounds without crushing; N9's clouds drift like
clouds. The "coverage must reach 0 for gaps," "AO must respect the underlying lighting," and "far-dome parallax
is a garnish" rules generalize to every future particle/decal/sky pass. Next graphics work continues the N10d /
N11 reflection-cost line.

---

## Round 2 (same day) — the playtest's second pass: elliptical collars + the real "spotty" culprit

The owner re-played and reported the Frozen foam now reads great, but two things remained: (A) foam coverage
looked **inconsistent** in Sunken Sanctuary — some props had a collar, some didn't; (B) the crystal black was
**reduced but not gone**, now reading as *spotty*. A tightly-scoped, empirical Fable agent (given the working
`foamfix.mjs` recipe up front, told to timebox reproductions) nailed both in one pass — the contrast with the
first round's rabbit-holing was the harness recipe + "be decisive" framing.

**A — a per-instance decal that opts out of thin footprints wants an ELLIPSE, not an on/off.** `archruin`/`slab`
had `foam: false` because a *round* collar (radius wide enough to reach an arch's two legs) floats meters off
the geometry on the perpendicular axis. But the sibling ring already rotates with the prop (`writeFoamMatrix`
builds its quat from `d.rotY`), and `compose` applies **scale in ring-local axes BEFORE rotation** — so a
**per-axis radius `{rx,rz}`** hugs a non-circular footprint for free, no shader change (`vRadius` is unscaled
local geometry; the coverage hash is world-space). `archruin:{rx:0.52,rz:0.18}`, `slab:{rx:0.48,rz:0.16}`;
circular archetypes keep `{r}` via `rx ?? r`. **→ Bank: "this decal doesn't fit some instances" is usually a
shape-parameterization gap, not a reason to disable it — an anisotropic scale on an already-oriented decal is
nearly free. Rejected per-leg foam: the sibling contract is same-count/same-index, so 2 rings/arch means a 2×
mesh + index remap through the whole recycle path — not worth it when one ellipse threads both legs.**

**B — when two multiplicative darkeners stack, floor the PRODUCT, not either factor.** The residual spots were
NOT more AO and NOT the water/atmosphere — they were the **ungated diffuse weathering-noise** (`*= 0.86+0.26*_pn`,
shipped baseline on master, ~2 m world cells) compounding with the softened AO on the crystals' hemi-only-lit
faces: dark cell `0.86` × AO floor `0.58` = **0.50×** → near-black, while bright cells stay navy → high-contrast
*spots*. (Geometric tell the agent used: a 5-sided cone's per-vertex AO interpolates across huge triangles and
*cannot* make small round spots — only the noise can. And its A/B — neutralize only the diffuse noise term →
faces go smooth, median lum 28→54 — isolated it precisely; the emissive-noise term was exonerated, too weak on
Frozen.) Fix is one line: `*= max((0.86+0.26*_pn) * mix(1.0,vAO,uAO), 0.62)`. **Identity-off is exact because
the floor is chosen below the off-path minimum**: at `uAO=0` the AO term is 1.0 and `0.86+0.26*_pn ≥ 0.86 > 0.62`,
so the floor never engages → shipped frame byte-identical (critical, since the noise is shipped baseline I must
not touch globally). **→ Bank: two independent `*=` darkeners can multiply into a hole even when each is
individually mild; if only their COMBINATION is the bug, floor the combined product — and pick the floor below
the shipped-path minimum so the fix is provably inert when the new term is off. Don't fix it by weakening a
shipped constant (changes the whole game) or by piling on more AO reduction (loses the grounding elsewhere).**

**Harness note banked into `foamfix.mjs`:** parameterized `startDist`/`minDist` so the one recipe shoots any
biome (Sanctuary ~300, Frozen ~3500); same seed + same warp → the two A/B runs froze at the *identical* dist
(305.25), which is what makes stash-based before/after crops line up. Brightening a crop 1.8–2.1× is the cheap
way to expose near-black mottle the default exposure hides.
