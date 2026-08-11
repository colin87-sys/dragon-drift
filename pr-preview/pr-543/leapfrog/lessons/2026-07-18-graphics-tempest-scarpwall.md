# Tempest Reach — PR-A `scarpwall`, the storm-headland MASS (double-gated 4.3 → 4.4)

**What we did.** Built `scarpwall`, the missing MID-GROUND MASS register for biome 7 (Tempest Reach) — the
"basilica" of the storm sea. A wave-cut HEADLAND: a rising dark seaward cliff broken once by a collapse
saddle, ending in a tall terminal scarp. It's the skeleton the density retune (PR-B) will pool props at.
Both Fable gates cleared — **Stage-1 studio form 4.3/5**, **Stage-2 in-context 4.4/5** ("it walls the right
flank as a single mid-ground mass with the crest rim catching storm light") — after a 5-round technique
climb (2.1 → 2.7 → 3.4 → 3.7 → 4.3/4.4). 134 tris, gold-determinism byte-identical, all §8 gates green.
Measured value ladder in the storm key: face L=0.056 → scarp-crest rim L=0.53 → breach L=0.71 (the frame
max). The missing register is filled: the biome's best frame is starting to become its average.

## The reusable techniques

**1. THE WAVE-CUT HEADLAND is a HOGBACK CROSS-SECTION extruded along a rising skyline — NOT boxes, NOT a
sheet.** This is the whole prop. The technique climb is the lesson: a flat quad WALL read as cardboard/
painted-strata (2.1); INTERPENETRATING BOXES gave depth but read as a "freight yard" of crates with flat
pale lids (2.7→3.4); the HOGBACK finally sold it (3.7→4.4). The hogback = an asymmetric wedge: a STEEP dark
seaward CLIFF (`+zF`, the dark repoussoir face the lane sees) → a thin PALE crest → a long TILTED landward
DIP-SLOPE falling to `zBb`. Non-parallel faces + a genuinely tilted strata TOP (not a flat horizontal lid)
+ real depth (`zF−zBb ≈ 0.25·r ≈ 12 world`). Extrude that section along ONE continuous rising polyline to a
tall terminal scarp, break it once with a shallow saddle. A box has parallel faces + a flat lid = masonry/
crate DNA at massif scale; the hogback's converging faces + sharp crest = rock.

**2. Each cheap-tell demanded a TECHNIQUE change, not a tune — the sheet's "third round → change
technique" law, lived.** Painted-line strata → real proud geometry. Crate lids → tilted dip-slope + thin
crest. Machined even cap-row (a "colonnade metronome") → jitter block widths + make the crest ONE
continuous breathing ribbon. Stair-step right angles → a continuous DIAGONAL bedding step (a proud band
+ soffit that the down-wind `skewX` shears into a diagonal shadow line = "rises as strata, not masonry
courses"). Split-at-the-notch → a shallow SADDLE (drop the notch floor so the two peaks stay fused). None
of these were value tweaks; each was a new build move Fable named exactly.

**3. DARK REPOUSSOIR needs a bake variant, not just a dark color: darken the body AND raise the scour
cutoff.** `mergeTempestParts(parts, {scarp:true, wetBand})` swaps in `bakeTempestScarp`: (a) drop the DAMP
body albedo to ~half (`_TMP_SCARP_DAMP`, lum ~0.13); (b) RAISE the scour dot-cutoff 0.32→0.50 so only
genuinely up-facing SKYLINE faces catch the pale wind-scour rim while every tilted seaward face stays
damp-dark. The `_TMP_AXIS` x-component is 0.72, so ANY face tilted toward +x crosses a low cutoff and goes
pale — a low cutoff turns the whole cliff into pale "sails/fins." The high cutoff keeps a clean dark body
with a thin lit crest = the Lorrain dark-mass-with-lit-rim the dusk sea needs. `wetBand` re-keys the wet
waterline per-archetype (the small-prop 0.24 default = ~7 world on a 30-tall wall — the Y-keyed-bake
coordinate-space trap; pass 0.15).

**4. The STUDIO over-shows the landward dip-slope; judge the seaward face on the LOW tiles / in-context.**
`_cwstudio`'s high front-¾ + top-plan tiles look down at the massif and show the big dark dip-slope (the
BACK). In game the follow-cam flies at the massif's mid-height and sees the seaward CLIFF. Weigh the
worm's-eye / down-the-length tiles, and gate the real read in-context. The studio scored the SAME geometry
a stop lower than the game did, purely from camera elevation.

**5. LANE-PINNED clearance: a lane-parallel wall's reach toward the lane is its object-space DEPTH
(`zMax`), not its random-rotY radial `ρ`.** A ±1-object-x wall reports `ρ≈1` → inner = |x|−ρ·r ≈ negative,
and biome 7 is CI-enforced (`propclearance.mjs` SCOPE_BIOME, hard exit 1). The amendment (ships with the
prop): `lanePinned:true` on the def, track `zMax` in `propClearanceData`, and add `a.lanePinned ? a.zMax`
to the facing chain (mirrors the paired/overhead amendments). Then facing ≈ 0.23 → inner ≈ 21 ✓. First
lane-pinned wall the tool actually enforces (basilica is biome 0, not in SCOPE — not a precedent).

**6. THE PER-SIDE PEAK LOCK — never a "heavier-bank" comparison.** `tempestComp` sways the two banks 0.42
of a period apart, so they NEVER share a peak (left at `seg·(n+0.18)`, right at `seg·(n+0.60)`). A naive
"heavier bank at peakIdx·seg" test always picks left (~0.51 vs ~0.009) → every massif ships on one flank.
Instead each instance locks to its OWN bank's nearest peak (`kS = round(dist/seg − 0.18 − shift)`, keep iff
`|dist−Pd| < step/2`). Alternation is then FREE — kept massifs interleave L,R,L,R (verified: 495L, 665R,
835L, 1005R…). NO `comp` block (a massif that only exists at peaks has nothing to swell against, and a comp
park would drop ~⅔ of them) + a CONSTANT `slotJit` (0.5) so every peak window has a candidate (else the
guarantee leaks by seed). This is the Frozen-hero precedent: the landmark uses its lock INSTEAD of comp.

**7. THE HEADLESS CAPTURE TRAP (Tempest edition): the dragon doesn't fly, and a warp-loop stalls — but a
SINGLE `player.dist` set is stall-safe.** Playwright throttles the RAF loop, so `player.dist += speed·dt`
barely advances (dist≈18 after 11s of "cruise") — every natural-cruise frame sits in the arrival window,
where the massif is PARKED, so you never see it near. The `_tempestclose` pattern (repeated dist warps +
`cameraCtl.update` override + a 16ms `setInterval` pin) HANGS the software-WebGL readback for minutes. The
fix: clone the MINIMAL `tempestshot` (one boot, one screenshot, no override, no interval) and set
`player.dist = D` ONCE before the shot (`_tempsweep.mjs [out] [cruise] [seed] [dist]`). One assignment
jumps the world to any window and reads back cleanly. This is how the money-shots (the massif on each
flank, near) got captured at all.

**8. GOTCHA: a per-point jitter array must have one entry per skyline point (or NaN).** Adding a 10th `SKY`
vertex while `J` still had 9 entries → `J[9]` undefined → `zFa[9]=NaN` → `propClearanceData` reports facing
`NaN`, inner `Infinity`, and the gate silently passes on garbage. Index jitter arrays with `% J.length` and
keep them sized to the point list.

## What it unlocks

The MID-GROUND MASS register exists and alternates banks on the per-side lock — so **PR-B** can now retune
density to POOL props at the massif (stackgrave 0.20→0.05, stormprowFar 0.22→0.10, a counter-flank park via
the `massifSide(dist)` pure helper already exported here) and thin the picket + debris that still rhyme
with the massif's lower blocks (Fable's noted debris-cube rhyme is a density problem, not a geometry one).
The one remaining polish (the bright saddle edge reading crisp) is a later-PR bevel, not a gate blocker.
The hogback cross-section is now a reusable primitive for any wave-cut coastal wall.
