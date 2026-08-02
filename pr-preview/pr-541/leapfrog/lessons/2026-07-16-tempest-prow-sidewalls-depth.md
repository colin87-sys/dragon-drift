# Side props must FRAME the death wall — and a pulled-in wall needs a free back-rank to keep its depth

**Context:** The owner hit a fairness bug on Tempest Reach: *"the props don't frame the side deaths so
I'll move laterally and die which defeats the purpose of the sidewalls."* The stormprow wall props sat
at inner edge ~26 (mid-field distant sea-stacks — the placement Fable had gated as "epic"), but the base
course kills laterally at `|x| > laneHalfWidth` (13, `config.js` → `collision.js` `crash(player,'wall')`).
So the props floated ~2× beyond the death line: the player drifted sideways over open water and died with
NO visible wall to warn them. Pretty scenery, useless as a sidewall.

## The laws

**1. A "sidewall" prop must hug the fatal wall, not the mid-field.** If props are meant to READ as the
lane boundary, their inner edge must sit just outside the death line — at the fairness floor (14.5 =
`laneHalfWidth 13 + 1.5`), not 2× past it. `propclearance --ci` reports the inner edge; drive it down to
~15, not up to 26. The clearance model is `inner = |x| − ρ·r·sMax − lean`; pull the `place()` base
constant down until inner lands ~15.

**2. Pulling a wall in collapses the vista to ONE depth plane — restore it with a collision-FREE
back-rank.** The single biggest premium unlock. Because the player dies at `|x|=13`, ANY prop at
`|x| ≥ 14.5` can never touch them → a second archetype placed far off-lane (`|x| ~32–48`) is *free
decoration*, no collision, no clearance risk. The storm fog fades it to pale ghost sea-stacks and you get
the NatGeo/monumental read back WITHOUT moving the fairness wall. Fable: 3.4 → 4.1 the moment the second
plane returned. Two depth planes beat one every time — "premium = layers."

**3. Determinism-safe archetype append.** All bands draw from ONE shared `rnd` (`mulberry32(seed+99)`),
built in `Object.keys(ARCHETYPES)` order. Changing a `place()`'s rnd-draw count, or appending a NEW
archetype, only shifts bands built *after* it. So: put Tempest kit LAST (stormprow was already the final
key) and append the far-rank right after it → zero shift to any gold-biome layout → `gold-determinism`
stays byte-identical. Verify with the test, but the ordering makes it safe by construction.

**4. Roofline rhythm kills the breakwater read.** A wall of uniform-height instanced wedges reads as a
harbor breakwater / parked barges — nothing in Tsushima/BotW gives a ruler-flat horizontal. A constant-draw
hero selector (`sel = rnd(); h = sel > 0.76 ? tall : low`) makes ~1-in-4 a HERO prow towering 2–3× the
body → low-low-HIGH silhouette. Height is independent of `x`, so clearance is untouched.

**5. Waterline anchoring = a wet-contact GRADIENT, not a hard soaked cutoff.** A flat soaked plateau below
a threshold reads as a toy on glass. Bake a *gradient* into the value ladder instead: near-black drowned
rock (`#12181c`) right at the sea contact, easing UP into the damp body over the bottom ~0.24 of unit-Y.
The value DROP at contact is what makes stone read as rising OUT of the sea. The foam collar seals it —
**but foam is `?foam` / `gfxPref.waterFoam`-gated**, so a headless capture without it shows "no foam
contact" (Fable flagged this twice before I realized the collar was there all along, just disabled in the
shot). Add `&foam` to the gate capture so the critic judges the real premium look.

**6. Yaw twists are the SAFE de-ziggurat.** Evenly-stepped strata read as milled crates. Per-stratum yaw
(`ry`) breaks every parallel shelf → fractured wind-torn rock. Crucially, under the `(r,h,r)` instance
scale the xz axes scale *uniformly*, so a Y-rotation is NOT sheared flat — only `rx`/`rz` tilts (into the
squashed Y) shear. So `ry` twists survive instancing AND don't violate the "lean carried by offset, never
internal rotation" law (that law is about rx/rz). Pair with varied stratum heights so the twists never
open a gap.

## The result
R1 3.4 → R2 4.1 (hero roofline + fog-faded back-rank) → R3 **4.4/5, SHIP** (wet-contact gradient +
yaw-twisted de-ziggurat) — one revise-round per gate, exactly the AAA-PIPELINE convergence cadence. The
fairness wall held at `|x|=13` throughout. Depth stack now: dark anchored foreground → grey mid wall with
hero rhythm → fog-bleached ghost rank → sun-break vanishing point.

## Reusable
- **Sidewall-framing checklist:** if a prop family is the lane boundary, `place()` base → inner edge ~15
  (`propclearance --ci`), NOT mid-field. Then add a collision-free far-rank for depth.
- **The two-rank kit** (near wall hugs death line + fog-faded back-rank behind) is now a pattern any
  boundary-defining biome can reuse: `stormprow` + `stormprowFar` share ONE builder (`build: () =>
  ARCHETYPES.stormprow.build()`), differing only in `place()` scale/offset + `foam:false` on the far rank.
- **Gate-capture with `&foam`** whenever the anchoring/waterline is under judgment.

## What it unlocks
The Tempest prow walls now do double duty: a fair, legible death boundary AND a premium storm-strait vista.
Backlog polish notes from Fable (non-blocking): per-prow foam-collar width variance + spray puffs; one
collapsed half-submerged wedge per ~500m (ruins = history); faint mineral tint on 1-in-5 heroes; a couple
of back-rank stacks tall enough for a lightning flash to rim them.
