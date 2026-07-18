# Mire: break the lamp-runway with per-instance size octaves (and make the clearance gate octave-aware)

**What we did.** Fable's doc-73 lever 6: the flank glowcaps read as *"a runway of lamps — near-identical
size, spacing, brightness, metronome timing,"* and the two flanks roughly MIRRORED each other. Fixed with a
per-instance size-octave multiply on the Mire glow carriers (Fable-spec 88). Render-scale-only, determinism
byte-identical.

**Root cause.** The Mire comp scale is `k = sMin + (sMax − sMin) * g` where `g = mireComp(dist)` — the
congregation weight is the SAME for every survivor at a given distance and BOTH flanks, so every cap is the
same size. There was no per-INSTANCE term.

**The fix (reused the lagoon `sizeClass` mechanism, data-driven):**
- A `sizeOctave: [[thr, mult], …]` array on the carrier def; in the `bi===4` comp block, after the
  congregation `k`, multiply by a pure per-instance class: `hc = compHash(_salt ^ 0x5bd1e995, side, slot)`,
  first `hc < thr` wins. **`side` is in the hash → left/right flanks decorrelate automatically, killing the
  mirror-pair tell for free.** No `rnd`, no new geometry → gold-determinism + tricount byte-identical.
- glowshroom (the loud offender, placed far out): 4 classes 0.58/1.00/1.45/**1.90** @ 44/34/15/7% — a rare
  "mother" cap towers (peak k = 1.25×1.90 ≈ 2.4), which is what actually kills the runway read.
- glowbloom got a gentler spread.

**The gotcha that mattered — the clearance gate was BLIND to the octave.** `propClearanceData()` computed the
lane inner-edge from `comp.sMax` only. The per-instance octave multiplies the render scale ON TOP of `sMax`,
so a "mother" (1.9×) draws far bigger than the gate tested — a silent lane-intrusion hole. Fix: fold the
octave's max multiplier into the effective sMax the model audits:
`sMaxEff = comp.sMax * max(sizeOctave mults)`. **Whenever a per-instance render-scale term is added, the
clearance model that reads a static `sMax` must learn about it — or it audits a smaller prop than the game
draws.**

**What the octave-aware gate immediately caught (and why glowbloom differs from glowshroom).** With the fix,
glowbloom's 1.40× "big" class FAILED — inner 12.8 < the ±13 fatal lane. glowbloom is dense NEAR-lane scatter
(place `x = 20 + rnd·10`, base inner ≈ 14.9, right at the ±14.5 floor), so it can't take ANY upsize without
intruding (max clearance-safe multiplier ≈ 1.07). **A near-lane filler's size variance must skew DOWNWARD**
(0.70/0.90/1.00, max 1.0 → sMax byte-unchanged → clearance preserved); the dramatic UPWARD variance belongs
on carriers placed further out (glowshroom, inner 18.0 even at 1.9×). Same lever, opposite direction, decided
by how close the archetype sits to the lane.

**Verify.** appshell (no console errors), gold-determinism (course untouched), biomecycle 12/12, envcount
(tris unchanged, Mire 49992), propclearance (now octave-aware: glowshroom 18.0 ok, glowbloom 14.9 warn =
pre-existing near-scatter, not a regression). In-Mire tier-0 capture shows flank lanterns at visibly
different sizes — the uniform runway is broken.

**What it unlocks.** A reusable `sizeOctave` on any comp archetype (data-driven classes), with the clearance
model correctly accounting for it — so future biomes can add per-instance size hierarchy without a silent
lane-intrusion risk.
