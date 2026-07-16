# 2026-07-16 — Stiletto I3: the hind pair + THE HUM (the four-spoke X)

**Did / learned.** Landed the HIND pair and confirmed the four-wing read. Because the
I0 rig hook (`parts.auxWingPivots`) and the I2 veined-wing builder were both parameterized,
I3 was almost entirely integration: the hind pair is the same `buildVeinedWing` at
`×0.62` scale on a builder-internal `hindPivot`, seated 0.28 body aft + one plate below +
raked 12° flatter, published as one `auxWingPivots` entry `{phase: 0.35·2π ≈ 2.20,
ampScale: 0.9}`. The four-spoke X (fore high/wide, hind lower/flatter) fell out clean from
the black-fill top silhouette — four distinct spokes from a solid dart core, overlap well
under 20%, no merged-bat read.

The load-bearing verification insight: **`wingsymprobe` Δ0.000 already proves the aux loop
runs AND poses the hind wings symmetrically**, because the probe poses via
`setFlapDebugPose` (which now contains the ported aux loop) and compares the full L/R
world-vertex cloud — the hind vertices are in that cloud. So a single Δ0.000 covers both
pairs; I added hind tip markers + `wingElements` entries so trail/FX ride the moving hind
tip too. The HUM's phase-offset *feel* (shimmer vs stutter) is structurally invisible to
the gate — it's an owner-preview residual with a one-line dial (phase 0.30–0.40 band).

Gotcha: a standalone `node tools/foo.mjs` that imports `js/` needs BOTH
`register('./three-resolver.mjs', …)` (the bare-`three` map) AND the tricount DOM shim
(`save.js` touches `localStorage` at import) — otherwise it throws at module load. The
existing harnesses (`starters.mjs`, `tricount.mjs`) set both up; a throwaway probe should
just run inside one of them or be added to the starters block rather than reinvented.

**→ Systematize.** When a new DOF is a nullable builder-published array ported into BOTH
posers (live + debug), the existing symmetry probe covers it for free — no separate
"does the aux motion run" test is needed; Δ0.000 with the hook present IS the proof.
Parameterize the hero builder by `(len, chord, cellN)` and the second pair is a scale
factor, not a second implementation — the four-spoke X is then a seating problem
(aft/below/rake), not a geometry problem.

**→ Leapfrog.** The whole silhouette + all four wings + the venom still now read premium
together, so I4 can gate the WHOLE creature at once (head skull-mask + antennae + the
needle + the fever firewall) rather than a wings-only pass — one harsh whole-creature gate
covers the remaining craft. The four-wing shimmer + the drip cadence go to the owner on
the preview as the two named motion residuals.
