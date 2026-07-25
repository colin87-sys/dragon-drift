# 2026-07-13 — Aurora Gate-7: the "we keep fixing it and it's the same" bug + irregular bands

Two lessons from a frustrated-owner round. Both are about **verifying the right thing**.

## The surge blind-spot — I was tuning the wrong effect for THREE gates
The owner kept seeing a full-sky purple "color explosion" and I kept cutting the aurora ERUPTION
(`uAurErupt`) — and it kept coming back. The owner's meta-question ("how come we keep having to fix it and
it's the same shit? am I describing it wrong?") was the tell. It was **a completely different system**: the
**SPEED SURGE** sky effect (`feverMix`) — two magenta sources in `environment.js`'s sky shader: (1) a
gradient shift toward purple (`midF = 0.55,0.25,0.9`, `mix(midColor, midF, feverMix*0.7)`) and (2) magenta
surge "aurora" bands (`col += aurora * curtain * feverMix * 0.35`). NEITHER was gated for the aurora biome,
so every speed boost repainted the sky purple over the curtain. Fixed with `* (1.0 - uAuroraMix)` on both
(a sibling night-surge veil was *already* gated that way — the two loud ones were just missed).

**Why I never saw it:** my verification montage **freezes the game (`timeScale=0`) and never triggers a
surge**, so `feverMix` stayed 0 in every capture — the exact effect the owner saw on every flight was
invisible in my tool. Lessons:
- **When a fix "doesn't take" repeatedly, STOP tuning and suspect you're editing the wrong code path.**
  Grep for *every* source of the symptom (here: every `feverMix`/magenta term in the sky shader), don't
  keep turning down the one you first blamed. "Same result after a real change" ⇒ wrong target.
- **A frozen/synthetic verification harness has systematic blind spots — the states it can't enter.** My
  montage couldn't surge, couldn't show recycled-prop judder, etc. FIX THE HARNESS to drive the missing
  state (I added `game.feverActive=true` + `feverTimer` to force a surge cell in the montage) so the blind
  spot can never hide the same class of bug again. A capture tool that can't reproduce the player's
  conditions will keep "passing" a broken build.
- **A new biome must audit EVERY global sky/FX effect for "should this fire here?"** The surge magenta was
  designed for day biomes; an aurora night biome needs it suppressed. Same pattern as the god-ray gate and
  the moon-halo gate earlier — global effects need per-biome opt-outs, and the `uAuroraMix` uniform is the
  free gate.

## Irregular bands — a "too parallel" pattern is a FIELD-GRADIENT problem, not a value problem
The Gate-6 thick bands were `fract(bt*5 - k*sAcross - drape)` — evenly-spaced parallel ribbons. The owner:
"too regular, too parallel, make it irregular." The insight (Fable): **bands are level-sets of a scalar
field; parallelism comes from the field's gradient being CONSTANT.** Every Gate-6 term was height-linear
with a fixed azimuth slope, so `fract` sliced identical parallel copies. The fix is to **warp the field**,
not to jitter the output:
- **Non-uniform spacing** ← modulate the vertical period by low-freq noise (`bt * (3.4 + 1.6*(fold0-.5))`)
  so ribbons fan apart / crowd like a wedge.
- **Curved, non-parallel** ← make the azimuth tilt vary along the band (`(0.25+0.65*foldOct)*sAcross`) →
  S-curves; different layers get different tilts.
- **Forks / merges** ← a **height-varying** warp (`_aNoise(sAcross, hy)`) added to the coordinate: a pure-
  *azimuth* warp shifts every ribbon identically (still parallel!) — only a warp that varies with ELEVATION
  bends ribbons differently, and where its slope exceeds the base slope the field folds and one `fract`
  period appears twice = a fork. This one noise eval (the height axis is the whole point) is what breaks
  parallelism; reused azimuth noises can't (they're all sampled on `az`).
- **Along-band knots / fade-out** ← re-coordinate the per-band noise onto the ALONG-band axis (was constant
  along each band by construction), and `bn²` lets a ribbon sink to the floor mid-sky so it visibly ends —
  which also destroys any residual period the eye could lock onto.
General rule banked: **to de-regularize a procedural pattern, warp the DOMAIN of the field whose level-sets
you draw (and make the warp vary along the axis that's currently uniform), rather than adding noise to the
final value.** Value noise changes brightness; domain warp changes SHAPE.

**Leapfrog.** On PR #413 (post-#411-merge). Aurora Shallows now: surge no longer explodes the sky, the thick
bands are irregular/forking/curved, the eruption is restrained, rays are calm children of the bands, props
are rich + low. Remaining: **PR-4 THE FLIP** into the live cycle (owner decision). Plan:
`reforged/AURORA-SHALLOWS-PLAN.md`.
