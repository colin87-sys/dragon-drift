# 2026-07-16 — Stiletto I2: the gossamer veined blade-wing, and "concept wins on taste"

**Did / learned.** Built the hero — the FORE pair of `gossamerDoubletWings`. Two gate
rounds, two distinct lessons:

1. **The sheet's darker membrane spec lost to the owner's concept.** The build sheet
   specced dark smoke-violet membrane tiers (`0x2a1a38→0x6a5a88`). Built to it, the wings
   read as dark chunky opaque blades — the OPPOSITE of "gossamer." The concept images show
   PALE translucent pink-lavender glass. The task's authority chain (concept > lock > sheet
   on taste) is real: I lightened the tiers to pale lavender-pink and the wings instantly
   read as gossamer veined glass. **When a render contradicts the sheet's own colour spec,
   the owner's reference wins — re-aim to the picture, log the delta.**

2. **A Vesper-style fan-from-K makes a BROAD bat wing, not a narrow insect BLADE.** My
   first geometry copied Vesper's `buildOneScallopWing` bay-fan; it produced a wide
   fan-shaped wing. An insect blade is a LONG NARROW panel (leading costa + a parallel
   trailing edge tapering to a point, chord ≈0.26× span) with the venation as a raised
   OVERLAY (costa + fan veins + a longitudinal rail), not as the membrane's boundary.
   Rebuilt as a clean blade-strip + venation overlay → the correct high-aspect stiletto wing.

The harsh gate (3.6 FAIL → re-judge) then caught the CRAFT registry items the silhouette
hid: (a) the pterostigma was present in code but invisible — a single dark tri on a dark
membrane; fixed by making it a distinct opaque near-black CELL (~1 cell wide) proud of a
now-PALE membrane; (b) the membrane read gossamer from the top but opaque-saturated at the
cruise rear-chase angle (the DoubleSide + overlapping tiers stack at grazing angles →
lower opacity 0.56→0.42 so light reads through where the player actually looks); (c) the
knife-edge "feathered" — a lit hem doesn't snap; a DARK-plum opaque border against the
pale glass does.

**→ Systematize.** A translucent membrane's opacity must be tuned at the JUDGED grazing
angle, not the flattering flat-on view — DoubleSide + tier stacking compounds opacity where
the wing is edge-on (rear-chase), so an opacity that reads "airy" flat-on reads "solid"
at cruise. A dark detail (pterostigma, knife-edge) only reads against a LIGHT ground; a
dark detail on a dark membrane is invisible regardless of size. And the shape-family
matters before the material: a fan-from-a-node primitive is for broad membrane wings; a
narrow insect blade is a strip + overlay. Pick the primitive to the silhouette first.

**→ Leapfrog.** The veined-wing builder is parameterized by `(len, chord, cellN)` and
returns `{arm, hand, K}`, so I3's hind pair is a free `×0.62` call — the four-wing X is
already geometrically there; I3 only seats/rakes it and lands THE HUM motion. The
pterostigma is in `flareMats`, so it lights on f3/Surge with zero new code (I4). The
pale-membrane + dark-detail contrast rule carries to the stinger channel + drip bead (I4).
