# The seam-axis law: how to fold a welded membrane to 0.50× span without tearing it

**What we did.** Wing Lab I4 (MOTION + COST) on `forgewing`. The headline job was the fold:
no shipped hero in this roster folds — measured span contraction Vesper 0.838, Revenant
0.932, Tempest 0.986, forgewing 0.977 — "SPREAD and FOLDED are the same photograph". I4
lands **0.497** (exact-vertex), inside the spec's ≤0.55, with the weld measured open by
0.035 u more than the flight pose already opens it.

## The gotcha, and the law that dissolves it

Everyone assumes premium wings don't fold because nobody bothered. They don't fold because
of **topology**: a welded membrane cannot pleat and cannot stretch, so any joint driven hard
enough to matter rips its own skin, and every hero quietly stops at the angle where the tear
would show. `FLAP-DESIGN.md` §2 states the symptom ("do NOT add per-strut crackle pivots to
a welded membrane — they tear it") without naming the cause.

**THE LAW: a joint may rotate about the line its own weld lies on, and about no other.**
Put the hinge axis *inside* the seam and the shared edge is a fixed set of the rotation —
the sheet cannot open, at **any** angle. That is the whole trick. It turns "how far dare I
fold?" into "where exactly is my weld?", which is a question geometry can answer.

Practically, per joint:

1. Collect the actual weld vertices (the duplicated row where two rigid frames meet).
2. Fit a LINE to them — PCA by power iteration on the 3×3 scatter, 20 lines of code, no
   matrix library. The **residual** (worst weld vertex ↔ the fitted line) is the exact
   half-width of the widest slit that hinge can ever open: `gap = 2·residual·sin(θ/2)`.
3. Anchor the joint's `−anchor` group at the fit's **centroid**, not at the anatomical
   landmark. A rotation is about a LINE, not a point; the centroid minimises the residual
   and the landmark generally is not on the line.
4. Drive the joint with `quaternion.multiply(setFromAxisAngle(seamDir, θ))`, and **move the
   existing flap angle onto the same axis** (read `rotation.z`, zero it, fold it into θ).
   One axis carries flight and fold, so a wing that cannot tear in the fold cannot tear in
   the beat either — which is what let us switch `midAmp` on at last (the elbow had been
   parked at amplitude 0 since I1 precisely because driving it tore the sheet).

Residuals we measured: elbow 0.113 · wrist 0.077 · fan 0.095 on a 5.95 semi-span.

## The reusable pattern: pick the frames from the seams, not from the anatomy

The rig fell out of the law, not the other way round. Five rigid frames, one per seam:
`arm`(shoulder) · `fore`(elbow) · `hand`(wrist) · `fan`(furl) · `frame`(body, never rotates).
Two structural consequences worth stealing:

- **A membrane may never span a joint.** The armwing sheet, its trailing-hem strip, the
  propatagium and the covert rank all had to be cut at the elbow row and split across the
  two frames. Splitting a mesh is visually **free** here: `flushMem`/`flushCrust` build
  NON-INDEXED geometry, so `computeVertexNormals()` already gives flat face normals and a
  split cannot introduce a shading crease. Check that before fearing a seam line.
- **Bays ride the finger they hinge on.** Bay 0 welds to digit III's spar, so digit III's
  spar IS the furl axis and the trailing fan (digits IV–VI + all three bays) closes about
  it. Roll the fan about the leading digit and the planform loses its scallops while the
  skin gathers spanwise along the bones — a closing fan, never a pleating curtain.

**The draw-count bill, and how it was paid.** Frames cost draws (one mesh per material per
group). Splitting at the elbow and adding the furl joint is +3 draws/wing; merging the root
fairing into `arm` (identical transform) gave 1 back, and keeping the whole radiator on
`arm` gave another — legitimate because the fold is authored in the COLD fire state, where
every lit pixel is inboard of the elbow, so the dark stranded overlay is invisible. Net
16 → 18 draws/pair against a ≤20 ceiling, at **net-zero triangles** (3,156 pair / 5,477 form,
byte-identical): re-parenting moves triangles, it does not make them.

## The other half: one scalar for the whole surface

§8.2's `slack(phase) = 0.5 − 0.5·sin(phase − 1.6)` — the membrane's own state, lagging the
rig ~90° — drives wrinkle amplitude, ripple amplitude (`4·slack·(1−slack)`, peaking at
mid-stroke and dying at BOTH extremes) and specular tightness from ONE uniform. Wrinkle
amplitude now measures 0.299 at the top of the upstroke against 0.131 at the bottom (2.29×)
where it was frozen before. Drive it from the poser (not from a wall clock) and every freeze
capture stays bit-reproducible.

## What this unlocks

- Any welded-membrane creature in this repo can now fold, tuck, cape-drape or mantle: the
  fold is one scalar with staged ramps per joint, so acting silhouettes are free.
- `wing-lab/tools/wingfold.mjs` is the reusable harness: fold ratio over the whole ARC (not
  two stills), collapse ORDER, the weld gap split into perpendicular (a real slit) vs
  along-seam (harmless shear), fold-state L/R symmetry — which `wingsymprobe` has never
  covered, because it only walks the five cycle states — and four negative controls.

## The optimisation that broke a won gate — and why it looked safe

The R3 ALU cut order's item 1 was "spherical-Gaussian `exp2` swap for the `pow`", a
documented free downgrade. It is not free here, and the reasoning error is general enough to
be worth stating: since `ln d ≤ −(1−d)` on (0,1), `exp(−n(1−d)) ≥ d^n` **everywhere** — the
Gaussian is not "tighter in the tail", it is uniformly BRIGHTER, and by 8× at d = 0.2 for
n = 3. On a wing whose whole case is that it is the darkest element, front-lit `dot(V,L)` is
small over the entire sheet, so the swap put a transmission FLOOR under every membrane pixel
and lifted the dark tiers most: authored tier spread 3.68× → 2.3×, front-lit membrane
0.053 → 0.064. Built, measured, reverted. **A lobe approximation's error is only "small"
where the lobe is bright; if you use the lobe as a value floor, the tail IS the product.**
The exact swaps beside it — `x⁵ = (x²)²·x`, `x⁶ = (x²)³` — are algebra, not fits, and they
carry most of the saving (6.7% of the material, measured by an A/B arm that recompiles the
same program with the three sites put back).

## Two probe traps this round, both kill #67 in new clothes

1. **An index-paired L/R comparison is invalid on seeded geometry.** It reported 1.062 u of
   "fold asymmetry" on a rig whose joint nodes mirror to 0.0000, because §7.4 makes L≠R
   weathering mandatory and vertex *i* on the left is not the mirror of vertex *i* on the
   right. Compare mirrored centroid + AABB per mesh instead.
2. **A probe wired to a constant measures the constant.** The tier probe classifies pixels
   by byte thresholds hardcoded from `MEM_TIERS`. Deepening T2/T3 to widen the measured
   spread moved 180 pixels between buckets and changed the answer by 0.08× — the instrument
   tracked the edit, not the wing. Any probe with a magic number copied out of the code it
   judges needs that number imported, or a comment on BOTH sides.
3. **`Box3.expandByObject` defaults to `precise = false`** — it bounds each mesh by its own
   AABB and transforms that box's eight corners, over-reporting a part rotated ~100° by up
   to √3. Harmless through I1–I3 when nothing rotated far; at I4 it reported the fold as
   0.742 where an exact vertex walk says 0.497. **A measurement that was fine for four
   rounds can go wrong the moment the thing you are measuring starts moving.** Print both
   columns rather than silently switching instruments.
