# 2026-08-12 — FORNAX via gauntlet loop: blind critics find real bugs, then the meta-law caps them

**Did / learned.** Built FORNAX (`dragonFornax.js`, key `fornax`) from the sheet through 13
blind builder/critic rounds against real MHW Rathalos screenshots (`reforged/reference/rathalos/`,
fetched through the egress-proxy bypass documented there). Fresh-context critics with labels
stripped found genuine bugs no green suite caught: a skull authored muzzle−Z then rotated π
(pointing backward), a def missing `scales`/`horn` (materials silently fall back to warm
accentHue — the "orange caterpillar"), and `rimCruise` being a COLOR not a strength (the studio
bakes the `apexSeam` Fresnel rim undimmed — saturated accents halo every sphere). Three rounds
of identical wing complaints proved the convergence law: dial tweaks can't fix an approach —
the wing only cohered when rebuilt as ONE boundary-walked triangulated sheet, with the root
geometry in the TORSO frame (a rotated-pose fix can't live in the wing frame).

**→ Systematize.** (1) Blind image A/B with a fresh critic per round is a working repo
pattern: crop the studio tiles, strip labels, force a binary verdict + ranked geometric gaps —
it catches material/palette fallbacks and frame-of-reference bugs that geometry asserts miss.
(2) The FLAP-DESIGN meta-law generalises: when critic scores plateau while complaints repeat,
MEASURE the complaint against built geometry (root-chord %, thigh:shank, tail-base ratio); if
the numbers meet the ask, the gap is capture visibility, not shape — move the loop to the
value/hide piece instead of more surgery. (3) New-dragon def checklist: `scales`, `horn`,
`rimCruise` (color) + `rimCruiseBase`, half-bright `apexSeam`, `feverWing 0x000000`,
`wingMembraneEmissive 0x000000` — omissions render as accent-orange, not as errors.

**→ Leapfrog.** The bar-vs-critic protocol + committed reference set makes any future hero
buildable the same way (the log at `reforged/FORNAX-GAUNTLET-LOG.md` is the reusable loop
template). Remaining FORNAX pieces (fire calibration probe, head rounds, flap dogleg, ladder
asserts) inherit a verified silhouette instead of fighting one.
