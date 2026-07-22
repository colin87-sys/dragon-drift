# 2026-07-13 — Aurora Gate-8: making a multi-color ramp actually READ (additive vs mix, area vs amplitude)

**Why.** The eruption was supposed to be a vertical rainbow (violet-blue N2+ base → green body → PINK
overlap → crimson crown) but flew as **just red + green** — the owner: "make sure this happens and it's
not just red and green."

**The diagnosis (Fable), all reusable graphics laws:**
- **Additive terms win the eye; mix terms lose it.** The red crown was `aCol += uAurRed * … ` (additive →
  adds LUMINANCE), while violet/pink were `mix(aCol, …)` (shift hue, no energy). The eye ranks colors by
  brightness, so red + the always-bright green dominated, and each later `mix` up the ramp *overwrote* a
  fraction of the earlier tints. **Fix: give every band a HYBRID term — a `mix` for hue authority + a
  small `additive` for luminance parity — so no single hue monopolizes.** Split the dial: `em =
  min(erupt,1)` drives the mix (saturates so hues never overshoot past 1), `ea = erupt` drives the
  additive (keeps scaling brightness on the strength dial).
- **A color needs AREA in the lit region, not just a nonzero gain.** The violet was gated `(1-body)` —
  and `body` is 1 across the entire lit column, so violet's weight was *literally 0* everywhere the
  curtain was bright; it existed only in the invisible sub-border skirt. Windowing colors by
  height-above-border (`v`) with **overlapping** smoothstep ranges (each pair overlaps ~0.1 so they
  BLEND, with a deliberate gap where the base green shows through) is what puts each hue where it can be
  seen. Also watch hidden attenuations: a `crown*(1-crown)` "bell" peaks at **0.25**, so a gain of "1.1"
  was really a max weight of 0.27 — use a `smoothstep×(1-smoothstep)` PLATEAU that actually reaches 1.
- **Restraint = AREA + RARITY, not amplitude.** The prior "too much" panic cut the hue *gains*, which
  killed the structure while the real restraint (color rides the bands/rays, majority-dark between, ~30s
  every few minutes) was already handled by the band/ray gating. Turning DOWN the hues was the wrong
  knob. Keep the hues full; restrain by *where* (they multiply into `I`, so they only recolor lit
  ribbon/ray pixels — zero added coverage) and *how often* (the envelope). Peak additive actually FELL
  (0.45→0.20, three additives in disjoint `v`-windows never stack) so the mirror-sea seam is safer.
- **Desaturated hues gray out when mixed over a saturated field.** A pale pink (`0xff9bc2`) or light
  lavender (`0x8f7bff`) mixed 50–85% into saturated teal-green just reads as "paler green." Pushed them
  to a hotter magenta-pink (`0xff7fae`) and a bluer/more-saturated violet (`0x7a6bff`) so the hue
  survives the green underneath — a mixed color must be more saturated than its target if it's to read.

**Also:** the biggest confound this whole arc was that the "explosion" the owner kept seeing was the
DRAGON-SURGE magenta (a separate `feverMix` sky effect), not the aurora eruption — see the surge-blindspot
lesson. Only after that was gated could the aurora's OWN color even be judged; then the eruption peak was
raised 0.45→1.2 so a natural eruption shows the full structure (restraint now from area+rarity). A
`?aurerupt=<v>` / `__dd.setAuroraErupt` debug seam lets the owner fly any strength.

**Leapfrog.** PR #413. The eruption now reads as the full altitude rainbow, restrained + on-the-bands,
over the irregular curtain, with the surge no longer exploding the sky. Remaining: **PR-4 THE FLIP** into
the live cycle (owner decision). Plan: `reforged/AURORA-SHALLOWS-PLAN.md`.
