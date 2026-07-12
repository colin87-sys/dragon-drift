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
