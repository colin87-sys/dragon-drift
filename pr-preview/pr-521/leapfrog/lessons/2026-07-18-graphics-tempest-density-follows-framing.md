# Tempest Reach — PR-B density follows framing (the massif earns its flank)

**What we did.** With the mid-ground MASS (`scarpwall`) built in PR-A, retuned the biome-7 density so props
POOL at the mass and thin to composed REST in the breaths — render-only, gold-determinism byte-identical.
Three moves: (1) `stackgrave` comp floor **0.20 → 0.05** and (2) `stormprowFar` **0.22 → 0.10** (kill the
even debris/back-rank sprinkle that was these floors leaking through `density = floor + (1−floor)·g` at
g≈0); (3) THE COUNTER-FLANK LAW — park the tall verticals (`stormstack`, `stormprowHero`) on the massif's
OWN flank so the punctuation congregates on the COUNTER-flank. In-context: the debris stops peppering the
open water and the picket stops standing in front of the wall — mass one side, punctuation + breach the
other = the authored Lorrain frame.

## The reusable techniques

**1. A comp FLOOR is a sprinkle knob, not just a rarity knob.** `density = floor + (1−floor)·g` means the
floor is the fraction of an archetype's slots kept in the BREATHS (where the congregation weight g≈0). A
"foil/debris" family with floor 0.20 therefore keeps 1-in-5 of its slots EVERYWHERE, which reads as an even
sprinkle pooled at nothing — the exact "clutter = props at one scale subordinate to nothing" failure. Drop
the floor toward ~0.05 and the family collapses to the congregations (pools at the mass) and clears the
breaths. This is the cheapest composition lever in the engine: two numbers, zero geometry, byte-identical.

**2. THE COUNTER-FLANK LAW reuses the massif's OWN peak-lock helper — no new hash, no new rnd.** Export
`massifSide(dist)` from the massif (PR-A): the pure flank the scarpwall stands on at this dist (or 0). Then
in the `bi===7` branch, `if (band.def.counterFlank && d.side === massifSide(d.dist)) active = false` parks
the flagged verticals on the massif's flank. Because `stormstack`/`stormprowHero` already have floor≈0,
this ONLY bites at the peaks where the massif actually is — everywhere else the verticals keep their normal
sway. `tafonihold`/`stackgrave` stay both-flanks (the debris pools at the massif's foot by simply not being
parked there). One flag + one pure line turns "picket in front of the wall" into "mass repoussoir one flank,
punctuation the other." The suppression window is `massifSide`'s ±step/2 (±85), wider than the massif's
±r≈48 dist-footprint, so it clears the wall's full length without a second widen.

**3. Keep the fairness layer OUT of the density retune.** `wrackline` (the surf ribbon, no comp block —
never parks) and `rainshaft` (floor 0.50, the far virga anchor) are UNTOUCHED: a breath still = violent sea
+ sun-lane + surf line + virga + breach = composed REST, not absence. The surf line reads as debris in a
capture but it's the death-line marker (fairness) and must stay — count MID-FIELD props for the breath
gate, not the near surf ribbon.

## What it unlocks / defers

The composition now reads as the Lorrain frame in the congregation windows and the debris pools instead of
sprinkling. **PR-C** runs the full 6-frame sweep + montage for the convergence gate and the owner-gasp
preview. The FOCAL GUARD-RAILS (§5.3) are GAMEPLAY-OWNED and deliberately NOT changed here — proposed to
the owner in the PR: (a) the flat yellow pickup quads sit in the breach's value band and rival the focal —
desaturate/warm-rim them toward the gold-ember language; (b) the black gate hazard beam can bar the focal
slot horizontally — the Forum "gate-in-the-play-aspect" treatment so the hazard frames the breach instead
of censoring it. Neither blocks the composition; the owner decides.
