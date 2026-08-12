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
r8: 2.5 — planform alone "3.5, legitimately good".
r9: 2.5 (one deltoid fairing, fwd fillet, sail aft along tail base → r14)
r10: 2.5 (full-height root skirt, chordwise bay camber, fed club → r15; chase
     shot switched to the REAL gameplay tiershots T3 tile — honest money read)
r11: 2.5 (forward mass overshoot named: neck torso-thick; ribcage lengthened,
     skull back to 1.35x, monotonic tail→club → r16)
r12: 2.0 (lengthened aft-body read as MORE tail — widened hips/thigh shelf,
     deeper chest keel → r17). Plateau 2.0-2.5 vs photoreal bar's 4.5-5.
r13: 2.0 — META-LAW pivot: measured the critics' three asks against the BUILT
geometry: root chord 45% of torso (ask 40-50%), thigh:shank 2.5:1 (ask 2.5-3x),
tail base 107% of hip half-width (ask 60-70%). All MET. The residual reads are
a VISIBILITY problem (small dark captures, char-on-dark) → belongs to the
hide/value + chase-cam pieces. Silhouette loop parks at geometry-verified;
resume blind rounds after surface value laddering lands.
FIRE piece first target: surge tile seams clip toward cream (no-white-core law);
underside leak weak on Surge. Calibrate emissive toward STOKE_DEEP/EMBER, boost
underMat surge weight, then R>=G>=B pixel probe per sheet §12.
FIRE cal 2 VERIFIED (r21 surge probe): cream pixels 0.00% (was clipping),
brightest (229,211,178) warm-ordered. Residual "violations" (14.9%) are all
dark blue-grey cool-ambient buckets on char hide — lighting, not fire pixels;
law 4 holds on the fire lane. Next fire work: ember particles + STOKE cascade.

## HEAD piece (fresh critic each round, face-front + face-profile tiles)
h-r1: 1.5 vs bar 4.5 — X wins decisively. Gaps: (1) NO JAW (single closed
wedge), (2) neck beads fatter than skull ("wedge pinned on a bead necklace",
front view reads wattle), (3) one-horn crown, browless decal eye (startled owl).
Fixes shipped (commit 9616f2e): lower-jaw loft hinged under the brow dip
(~12 deg resting drop, 70% upper depth, bone-pale tooth strip + tip fangs,
overbite hook station), neck retuned rBase 0.42/rStep 0.03/zStep -0.26 +
neckBlend 1.35 (GOTCHA: blend MULTIPLIES radii — first try at rBase 0.55
ballooned past the skull), trapezoid nape plate over the occiput rear, ranked
horn pairs 60%/35% on the sweep arc + nape scutes, brow plates over eye top
third, eyes inboard. h-r2 critic running on r21 tiles.

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
