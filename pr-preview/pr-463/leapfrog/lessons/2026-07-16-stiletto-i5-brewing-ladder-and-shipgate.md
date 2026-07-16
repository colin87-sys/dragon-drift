# 2026-07-16 — Stiletto I5: the BREWING ladder + the ship-gate test battery

**Did / learned.** Shipped the tier ladder + the `tests/starters.mjs` `stiletto` block (the
§9 contract), closing the build. The 4-form BREWING ladder reads cruise-visibly: f0 Glass
Larva (2 fore wings, a single dim dreg-glimmer sac at `sacFill` 0.05, a plump wide waist)
→ f3 Belladonna (4 wings, three BRIMMING sacs, a pinched waist, a longer span, staged
drip). The block asserts the growth VERB as monotonics — `sacFill` {.05,.30,.60,1.00}
exact, `waistPinch` tightening (its own unique monotonic ↓, ≥0.22 floor), gaster segs /
sac windows / drip stage / hind pair / antennae / cells all laddering — plus the
anti-SPINDLE chord floor every form, ≥1 spine inflection, the four-wing `auxWingPivots`
withheld at f0 then carrying the 0.35-cycle offset, the fold contraction, the venom accent
in the 292°±20 lane (never warm/green/gold), the full fever firewall (`feverWing` black,
every fever emissive orchid, `coreGlow` unset), and the import firewall.

Two lessons:

1. **A top rung can be LIGHT-driven, so the tris-monotonic assert must allow it.** The
   shipped premium blocks (phoenixMolten/Reforged) assert `tris strictly monotonic` because
   each rung bolts on hardware. Stiletto's apex adds NO geometry — it BRIMS the fill, lights
   the channel, ignites the pterostigma (all emissive, zero tris). So f2≈f3 tris (898 vs
   901, a fragile +3 from the sac-fill clip vertex count). The honest assert is
   `f0<f1<f2 && f3≥f2` with the growth verb proven by the `sacFill`/`dripStage` monotonics,
   not tris. Forcing a geometry bump at the apex just to satisfy a strict-tris assert would
   be building for the test, not the creature.

2. **The sheet's absolute tri targets were an over-estimate; the shipped premium blocks
   don't assert them.** The sheet penciled {1.6,2.4,3.4,4.6}k; the real creature is
   ~0.65→0.90k apex — genuinely the slimmest of the Fresh Five (Vesper-class), and every
   craft gate passed at that budget. The premium blocks assert `<6000` + monotonic +
   per-dial ladders, NOT absolute tri targets — so the slim-but-premium reality ships
   cleanly. (Recorded delta, flagged on the PR.)

Gotcha: a per-side wing loop that pushes BOTH fore + hind `wingElements` unconditionally
publishes 4 elements even at f0 where the hind pair is withheld (`hindwingScale` 0) — the
element must be gated on the same condition as the geometry, or the "2 at f0 / 4 at f1+"
census assert (and any trail/FX that reads `wingElements`) sees phantom hind tips.

**→ Systematize.** Assert the growth VERB, not a proxy: if a creature's apex escalation is
light/fill (not geometry), the tri-monotonic must be `strict-then-≥` and the real ladder
proof lives in the identity dials. Gate every published attach/FX element on the same
condition as the geometry it tracks. And write the identity-law block as the ladder is
authored (the dials were designed at I0), so I5 is transcription + a green run, not a
redesign.

**→ Leapfrog.** Belladonna Stiletto ships: I0 rig hook → I1 venom still → I2 gossamer wing
→ I3 four-spoke X → I4 head/needle/firewall → I5 ladder + battery, each craft-gated ≥4.2 by
a fresh harsh Fable spawn, roster byte-identical throughout. The reusable spoils: the
`auxWingPivots` four-wing hook (any future multi-wing creature), the core→bloom→dark
organ-glow recipe, the orchid-under-ACES emissive recipe, and the recessed-socket eye — all
now proven and lessoned.
