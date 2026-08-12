# FORNAX Rathalos-gauntlet build log (live state)

Gauntlet: build FORNAX (`FIRE-WYVERN-BUILDSHEET.md`, key `fornax`, module
`js/dragonFornax.js`) judged blind vs real MHW Rathalos screenshots at
`reforged/reference/rathalos/` (committed, viewable by every agent). Loop:
builder fixes → suites (`tricount --ci`, blueprint, starters, wingsymprobe,
flapcheck, smoke) → `node tools/dragonstudio.mjs fornax rN` → crop the
rear-chase (top-left) + top-planform (bottom-right) tiles of
`reforged-captures/dragon-fornax-f3-glide-pale-rN.png` → fresh-context blind
critic (shots 1/3 = rathalos-13 + rathalos-01, shots 2/4 = ours) on the
SILHOUETTE & PROPORTION axis → apply the ranked geometric gaps. Exit only when
the critic picks ours. PR #544; progress artifact
https://claude.ai/code/artifact/cdec3c5e-9202-4151-8cb9-78c864696a97.

## Score history (silhouette piece, fresh critic each round)
r1 blind: 1.0 (backward skull double-flip bug, point-mounted sails, wire limbs)
r2: 2.0 (mainsail bay, no neck, massless limbs)
r3: 1.5 (approach change ordered → ONE-SHEET sail rewrite)
r4: 2.0 (root fix must live in TORSO frame; Z-fold misread as forelimbs)
r5: 2.0 (body-frame scapular saddle + root wall; horn/wing confusion)
r6: 1.5 (bead-neck = throat seam peeking; found scales/horn palette fallback →
      accent orange; found rimCruise is a COLOR — apexSeam rim was baking amber)
r7: 2.0 (root chord 15-20% → needs 50-60%; tail stick+bead; slat ridges)
r8: 2.5 — planform alone "3.5, legitimately good". Captures: r12.

## NEXT (round 9 directives, from the r8 verdict)
1. Wing root: extend inner membrane fillet aft along flank shoulder→hip
   (30-40% body length root chord) + weld ridge proximal ends INTO the sail
   surface (mid-flap slat separation is a geometry offset — drop ridge bases to
   the sail plane).
2. Legs (chase view): fold tighter under the pelvis (less 45° frog splay),
   thigh 2× ankle taper, 3 splayed toe wedges + claw tips (kill the mitten).
3. Tail: taper FLOOR ~35-40% of root thickness at the tip, club merged with
   the shaft (faceted, slightly flattened, 1.5-2× local shaft) — still the
   sheet's blunt firebrand, never a spade.
4. Torso: 1.3× width swell through the ribcage between the wing roots.

## Key learned constants (do not regress)
- def MUST set scales/horn hexes (else accent-orange fallback) and
  rimCruise (COLOR 0x140a04) + rimCruiseBase 0.12; apexSeam 0x7a3e0c feeds the
  baked body rim — keep half-bright.
- Studio glide pose shows a raised V; judge on rear-chase + top-planform tiles.
- Neck loft: zStep -0.36 / rStep 0.048 / wobble 0.07 (beads return above that).
- Sail: single boundary radial-fanned from K; flank edge crosses inboard
  (HIP=[-0.30,...,1.66]); underlit copy = same sheet dropped 0.05, FrontSide.
- All work committed/pushed per round on claude/gauntlet-loop-skill-install-g0s55t.

After the silhouette piece wins: head, wings(detail), hide, fire (cruise budget:
underMat/seams currently brighter than law 6 allows — calibrate), flap
(FLAP-DESIGN recipe + ≥12° dogleg), chase-cam read, then I5 ladder asserts in
tests/starters.mjs SPECS, lesson file per THE RULE, tiershots roster line 25.
