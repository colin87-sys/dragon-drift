# Vesper I2 — the scallop crescent: rounded lobes ≠ sawtooth, and glideRake is a POSE

**What we did.** Built the hero of Nightglass Vesper — `scallopCrescentWings`: a broad
matte night-glass sail whose trailing edge is oversized rounded convex scallop lobes, a
scapular cowl hiding the wing-root join, a translucent knife-edge band, diffuse constellation
flecks, and zero hardware. Fable gate 4.4/5 (from a first-pass 2.5 FAIL). Verified: smoke ·
wingsymprobe Δ0.000 · tricount monotonic <6000 · flapstrip 5-phase corridor clear at every
phase incl apex/recovery.

**Lesson 1 — a scallop is a CONTINUOUS cambered sail, not per-lobe fans.** The first pass
built each lobe as its own tri-fan around a cupped centre (the Solar vault-bay pattern). In
a flat-shaded engine that reads as a **stack of offset rectangular slats** from the side (a
Vulcan-bomber shingle) — the exact "staircase" the sheet bans. Cure: build the membrane as
ONE continuous surface over three span-sampled rails (leading arm → 78%-chord shoulder →
scalloped trailing edge), quad-stripped between consecutive samples. The knap stays as
in-plane creases, never as physically layered strips. Rear/top read as a clean crescent;
only a faint side terrace survives (non-gating).

**Lesson 2 — rounded lobes need a SHALLOW-notch depth function + dense sampling.** A single
apex point per lobe + sharp finger notches = a **sawtooth of pointed teeth** ("the jagged
black wing", not "the scalloped black wing"). Cure: a smooth per-lobe convex depth
`amp*(0.34 + 0.66*sin(phase*π))*chord` sampled 4 facets/lobe — the `0.34` floor keeps the
inter-lobe cusps SHALLOW (~⅓ of the peak) so they read as pinches between bulges, not teeth.
Lobe width ≥ 2× notch width. This is the reusable recipe for any rounded-scallop trailing edge.

**Lesson 3 — glideRake is a runtime POSE the gate is blind to; do NOT bake it.** Baking
glideRake=1.0 as a big leading-arm lift turned the rest silhouette into a near-vertical
stacked staircase. The sheet is explicit: glideRake is a glide-hold pose the human judges on
the preview, NOT the static silhouette. Bake only a WHISPER (×0.10) so the apex fan sits a
touch taller up the ladder; the REST silhouette must be the neutral lateral spread so the
static gate reads the double-crescent. (The tip marker must duplicate the same arm-Y formula
or the wingtip FX detaches — the documented gotcha.)

**Lesson 4 — the scapular cowl must be KNAPPED FLAKES, not a box.** Two axis-aligned quad
plates over the root read as a "rectangular saddle-box strapped across the shoulders" — it
hides the weld by parking luggage on it. Cure: 2 overlapping TRIANGULAR flake-plates lapping
diagonally in the torso's knap language, static in the body frame (not parented to the
flapping pivot) so they cover the membrane root through the whole flap. Overlap > weld: no
seam to fail — the retired-drake body↔wing seam killer, resolved by construction.

**Lesson 5 — diffuse constellations still obey a value+scatter discipline.** Moon-grey
0xc9d4e2 at full value became the second-brightest surface after the eyes on a dark sky, and
a uniform triangular row reads as painted insignia/barring, not stars. The cruise-black law
is about EMISSIVE (diffuse speckle is firewall-safe by the sheet), but "reads like a glow" is
still a fail. Cure: dim the albedo a notch (~0x9aa6b6) + low envIntensity so it vanishes into
faint stars on the dark tile, and SCATTER with golden-ratio jitter across BOTH span and chord
with per-fleck rotation/size variance → a star-scatter, not a chevron row.

**Process.** Same high-effort Fable harsh-critic gate, RESUMED across passes (2.5 FAIL →
4.0 → 4.4) so it held the prior critique as context — the r→r comparison is sharper than a
fresh spawn, and it predicted the exact score each fix would earn.

**What it unlocks.** With the seam-failure dead (cowl overlap) and the corridor clear at all
flap phases, the wings are locked; I3 (head/tail) and I4 (the Starlit Seam on the already-
anchored dorsal ridge) build on a stable silhouette.
