# Fresh-Five sheets — Fable gate round 2 (re-judging the critic)

**What we did.** Ran the mandated FABLE round-2 pass over the five premium sheets AFTER the Opus §R
pass — not to re-approve the §R fixes but to pressure-test them. Verdicts: Revenant PASS (4.9) ·
Tempest PASS-after-§F (4.6) · Tocsin PASS (4.4) · Stiletto PASS (4.4) · Sylph REVISE-sharpened (4.0).
Added a `§F — FABLE GATE (round-2)` block to all five sheets + a §2c round-2 section to
`FRESH-DRAGONS-SYNTHESIS.md`. Zero lane swaps; every change is a numbers correction. Four §R rulings
were overruled or tightened — the round-1 critic was directionally right and numerically soft.

**What the Fable eye caught that the Opus pass didn't (the reusable laws):**

1. **Assert the axis the CAMERA sees.** Tempest's anti-louvre fix mandated ×0.8 *chord* decay +
   *set-back* — both fore-aft moves, both invisible from dead astern. Three equal-SPAN decks with
   perfect chord decay still read as venetian blinds in the rear fill. The rear anvil taper had to be
   re-asserted as **rear-projected SPAN decay**. Rule: for a rear-chase game, every silhouette assert
   must be stated in the REAR PROJECTION (or explicitly named as planform/side-only); an assert on a
   depth axis is theater.
2. **Test every assert by asking "can the mandated geometry FAIL it?"** Sylph's hood-width assert
   (≥1.1× body girth) was non-binding: at the mandated ±35° cant the pleat geometry already projects
   ~3× girth, so the assert passes even at a near-line ±15° cant — it guards nothing. Replaced with
   ≥2.4× girth AND ≥0.35× streamer span. A gate number that the sheet's own construction trivially
   exceeds is a placebo; derive the worst legal geometry and check the assert rejects it.
3. **A translucent dorsal sheet self-overlaps in screen DEPTH from the chase camera.** "One connected
   sheet can never stack against itself" is true in the sheet's own plane and FALSE along its run —
   from dead astern you look nearly along the spine, so every pleat station stacks in depth (>2 alpha
   layers in the 95% view), and three.js does not sort triangles inside one transparent mesh
   (intra-mesh z-popping). The fix is the shipped Jade forward-lobe law: OPAQUE body with
   emissive-in-fragment gradient (an emissive surface against sky loses almost nothing by dropping
   translucency), translucency only in a thin hem band. Rule: count alpha layers along the CHASE ray,
   not the surface normal.
4. **A ratio lock without an absolute floor lets both terms collapse together.** Stiletto's
   anti-mosquito lock (thorax ≥0.5× forewing chord) leaked because chord had only a ceiling — chord
   0.18 + thorax 0.09 passes the ratio and ships the mosquito. Paired-bound rule: every ratio assert
   needs at least one absolute anchor (added chord ∈ [0.24, 0.30]× length + the §2.3 rear-fill mass
   split 25–40% core / 50–65% blades).
5. **Separator-carrying thin elements need PIXEL floors.** Tocsin's rigid rod fringe is one of the
   three Tempest↔Tocsin separators, but "thin taut cylinders" alias to 1–2px and vanish at the 250px
   chase read — the separator evaporates exactly where the set-judgment happens. Same for Revenant's
   through-holes (sub-8px holes read as MITTEN-noise/damage). Added rod diameter ≥0.02× wing span and
   per-hole ≥0.05 planform floors. Rule: any element that carries a DISTINCTNESS claim must be sized
   in pixels at gate distance, or the claim is fiction.

**What HELD (why, recorded so round 3 doesn't re-litigate):** Revenant's negative-space read passed
both critics untouched — holes-in-the-fill is silhouette-level identity, visible at any size, in any
backlight, with the cheapest overdraw story in the set. The strongest concepts are the ones whose
identity lives in the black fill itself, not in material, translucency, or timed light.

**What it unlocks.** The five sheets now carry double-gated numbers; residuals are genuinely
gate-blind (motion feel + on-device px checks, listed per sheet). Meta-lesson for the standing
protocol: a second critic pass with fresh eyes found four soft numbers in a pass that itself found
four real defects — the gate ladder (design → §R harsh pass → §F Fable re-judge) earns its cost, and
"the fix cites a number" is not enough: the number must bind, in the projection that ships.
