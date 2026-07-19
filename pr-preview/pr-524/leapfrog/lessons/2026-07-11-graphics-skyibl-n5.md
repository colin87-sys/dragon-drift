# 2026-07-11 — N5 sky-IBL rung 1: the sky as ambient light, and two SH gotchas

**Did / learned.** Built the roadmap centerpiece's first rung (`skyProbe.js`): every frame, project the analytic
sky-dome gradient (a JS port of `environment.js` `skyMat`) into a 9-coefficient `THREE.LightProbe`, so the world's
ambient light comes from the biome sky and re-lights as biomes cross-fade. Wired into the new Settings "SKY
LIGHTING" toggle, OFF by default (hemi carries the ambient); ON, the probe carries it and the hemi drops to a low
fill. The hue transport works — props go from cold blue-grey silhouettes to warmly lit by the sunset. **Owner
insight from the A/B montage: good lighting exposes bad assets** — the placeholder pillars now read as obviously
low-effort, so the environment art needs a proper pass later (logged in GRAPHICS-OVERHAUL.md).

**Two gotchas the Gate-2 review caught (bank both).**
1. **`LightProbe.sh` wants RADIANCE, not irradiance.** r160's `shGetIrradianceAt` bakes Ramamoorthi's combined
   constants (`0.886227 = π·Y00`, `2·0.511664 = (2π/3)·Y1`, `2·0.429043 / 0.743125 / 0.247708` for band 2) — i.e.
   the shader applies the cosine-lobe irradiance convolution itself. So you store the raw sky **radiance** SH
   (project with solid-angle weight `4π/N`, no per-band A_l factor), exactly like `LightProbeGenerator.fromCubeTexture`.
   Numerically verified: a constant sky of radiance 1 → DC `4π·Y00 = 3.5449` → shader irradiance `π` exactly. Get
   this convention backwards and the ambient is subtly mis-shaped (too flat or too directional).
2. **A Fibonacci sphere must NOT land a sample on the poles.** The naive `y = 1 − 2i/(n−1)` puts a sample exactly
   on each pole AND double-weights them (i=0 and i=n−1 both at |y|=1), leaking a spurious band-2 coefficient
   (~1.6% of DC) into a *constant* sky — a false zenith/horizon tilt every frame. The offset lattice
   `y = 1 − 2(i+0.5)/n` cuts it ~13×. This is precisely the bug the spec's own "SH of a constant sky == that
   constant" test exists to catch — and the test had been skipped, so the bug shipped in the first commit.

**Also learned — intensity is an energy-parity problem, not a taste guess.** First cut `PROBE_INTENSITY=1.15`
made the ambient ~3× the shipped red channel → the montage read as an *exposure shift*, not "better lit." The
probe's diffuse ≈ `0.886·DC·intensity`; matching the shipped hemi (0.8) energy at a dusk DC≈1.6 means ~0.6. Set
0.62; the world stays in the same exposure regime, just warmer and sky-coloured.

**→ Systematize.** (a) **Any `LightProbe.sh` you author by hand = radiance SH, weight `4π/N`, project with
`SphericalHarmonics3.getBasisAt`** — never pre-convolve. (b) **Low-discrepancy sphere samplers get a half-cell
offset (`i+0.5`) to avoid pole singularities**; validate every spherical quadrature with the constant-function
test (integral of a constant must give the constant × solid angle, all higher bands zero). (c) **When you PORT a
shader to JS (or vice-versa), the port needs a parity test AND a drift-guard comment on the source** — both now
exist (`tests/skyprobe.mjs`, the `skyMat` warning). Same discipline the OutputPass/BATCH_FRAG lessons landed:
overriding/porting is necessary-not-sufficient; prove it with the initiative's *own named* test before shipping.

**Deviation (documented).** Rung 1 omits the Surge (`feverMix` magenta/violet sky shift) and EMBERTIDE
(`skyDim`) sky states from the probe — both transient; per-frame reprojection makes adding them ~free later, so
it's a noted follow-up, not a bake-cost tradeoff.

**→ Leapfrog.** Rung 1 is the foundation for rung 2 (specular PMREM from the same dome) and unblocks the whole
Phase-1 hero-look chain. And the "props now look bad under real light" finding reprioritizes environment art:
N15's cheap baked AO helps, but the pillars want actual geometry/material work — a new backlog item.
