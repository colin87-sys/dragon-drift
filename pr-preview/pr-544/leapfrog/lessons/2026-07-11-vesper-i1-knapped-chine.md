# Vesper I1 — the chined loft kills the ring artifact BY CONSTRUCTION

**What we did.** Started Nightglass Vesper (VESPER-NIGHTGLASS-BUILDSHEET.md) — a fresh
premium matte-black night drake — with I1: the `knappedTorso` in a NEW module
`reforged/js/dragonVesper.js` (self-registering, default-off builders; a new `vesper`
roster key; nothing shipped changes). Wings/head/tail are dark placeholders until I2/I3.
Explicitly NOT the retired organism/one-skin family (no import of dragonOrganism/
dragonNightFury/dragonUnifiedHull).

**The core lesson (reusable).** The retired night-drakes read as "stacked metallic rings"
because a smooth elliptical loft samples a fresh smooth ring per z-station — the flat
shader then lights each ring band separately → beads. The fix is a **fixed-polygon loft**:
one `CHINE_PROFILE` (a 7-point chined heptagon with the lateral apexes pushed fully
outboard) reused at every station, connected by SHARED profile indices. Because index `k`
connects to index `k` on the next station, every column of facets becomes a **longitudinal
strake** and the lateral apex becomes a hard **chine knife-line** running nose-to-tail. The
ring artifact is dead by construction — the dominant grain runs along z, not around. This
`knapLoft(stations, profile, matOrFn)` helper is the counter-pattern to `loftRings` for any
creature that must read as knapped/faceted rather than smooth-organic.

**The gotcha (Fable gate, r1→r2).** "No rings" is NOT the same as "reads as design."
r1 passed the ring test at 3.5 but the side profile crushed to a flat black cutout — the
grain was *absent-failure*, not *present-design*. Cure: paint the loft in **longitudinal
value bands** via a per-column `colMat(k)` (dorsal-ridge tier lighter, flank/chine tier
darkest, belly tier a step lighter slate) — all still deep blue-black (L≤0.10), so it never
breaks the matte identity but the strakes state themselves from the money angle. That single
change took the gate 3.5→4.2. A belly-tier one-step-lighter nudge (so the LOWER chine also
gets a value break in pure profile) took it 4.2→4.5. `knapLoft` groups tris per material →
one draw call per band (weak-mobile safe).

**Second gotcha.** A dorsal "glass-streak" sheen strip flirts with GLOW on a dark sky if
it's a wide low-roughness panel — it became the brightest surface after the eyes (violates
cruise-black). Cure: a THIN ridge-line the full spine length, rougher (0.6) + low
envMapIntensity (0.15) → an intermittent specular glint, not an emissive strip. "Glints,
never glows" is a roughness+width problem, not a colour problem.

**Process lesson.** The checkpoint gate is a HIGH-EFFORT FABLE HARSH-CRITIC (model fable),
not self-judgment — spawn it at each increment with the sheet's anti-pattern baked into the
rubric so it will catch a regression to the retired look. Resume the SAME agent for the
re-gate so it holds the prior critique as context (r1→r2 comparison is sharper than a fresh
spawn). Judge on BOTH a pale tile (silhouette/strakes/ring-test) and a dark tile
(cruise-black law) — the dark tile is where a "glint" turns out to be a "glow."

**What it unlocks.** The chine + longitudinal-band hull is the proven foundation for the
seam-failure fix (I2: the scapular-cowl overlap join) and the Starlit Seam motif (I4: the
dorsal ridge is already the seam anchor). Verified: smoke green · wingsymprobe Δ0.000 ·
tricount OK (<6000) · Fable gate 4.5/5 (retired-Toothless check: NO).
