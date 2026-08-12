# wingread — measure the PLANFORM, and give every floor a ceiling

**What we did.** Built `reforged/tools/wingread.mjs`, an independent wing gate, from scratch,
after the audit found three of the existing four wing gates broken. It measures one thing —
the right wing's 2D planform outline, rasterised from triangles into the wing's own PCA plane —
and reports four bounded ratios, one per clause of DRAGON-DESIGN §2 failure #1:

| | meaning | tempest | vesper | revenant | **fornax** |
|---|---|---|---|---|---|
| BREADTH | widest chord ÷ span | 0.512 | 0.569 | 0.503 | **0.325 LOW** |
| SOLID | mean chord ÷ widest chord | 0.626 | 0.443 | 0.560 | **0.735 HIGH** |
| ARCH | LE bow ÷ its own chord line | 0.141 | 0.136 | 0.147 | 0.160 ok |
| CUT | TE concavity ÷ planform box | 0.130 | 0.129 | 0.160 | **0.083 LOW** |

Roster passes 4/4 in all five poses (glide/settle/apex/downstroke/fold); Fornax fails 3/4 in all
five. Stable to ±0.02 across poses and ±0.01 across raster resolutions 160/320/640.

## What we learned

**1. The Fornax wing is not a delta. It is a STRAP — and that is a different repair.**
Round 7's verdict was "chord profile tapers where Tempest's plateaus." Measured, the *normalised*
profile does not taper badly at all (fornax holds 0.98 at 60% span; vesper holds 0.60). The defect
is that the whole wing is narrow — 0.325 chord-to-span against a roster floor of 0.503 — and
nearly constant-width, SOLID 0.735 against a roster ceiling of 0.626. Normalising by the wing's
own widest chord *hid the entire defect*, because it divides out exactly the quantity that is
wrong. **A ratio can only find a defect it does not normalise away.**

**2. A floor no one can fail is not a floor.** First draft set CUT's floor at 0.04 because that
was safely under everything. It passed all four dragons and therefore tested nothing. Set at 0.10
— 20% under the roster's worst pose, 0.125 — it passes the roster with margin and fails the
subject. Pick the band from the roster's *worst* case, then step just outside it; do not pick a
band that cannot fire.

**3. Make the metrics pull against each other.** BREADTH and SOLID cannot both be satisfied by any
uniform edit. Widen the wing → SOLID rises through its ceiling (a wide strap is still a strap).
Cut it back → BREADTH falls. The only edit that lands both is chord added mid-span and released
toward the tip — which is what a carpal and a hand *are*. This is the structural answer to the
holecensus failure: that gate was one-sided, so its optimum was a solid sheet. **Every gate needs
an opposing gate, not just a ceiling.**

**4. The calibration law caught a bug in the gate within one run.** ARCH shipped its first run
reading exactly 0.000 for tempest, vesper AND revenant — a sign error, clamped by `Math.max(0,…)`.
Three reference dragons scoring a perfect zero is not three bad dragons. Running the roster
FIRST, before ever pointing the tool at the subject, is what surfaced it in sixty seconds.

**5. Verify the harness is doing what you think.** `setFlapDebugPose` produced byte-identical
numbers for glide and fold, which looks exactly like a silent no-op — the failure class this whole
audit is about. It was not one: dumping the joint rotations showed fold differs from glide only by
a rigid rotation about the shoulder, which a PCA-frame measurement is invariant to *by design*.
Confirm before you conclude, in both directions.

**6. Round 7 made the wing measurably flatter.** Replaying wingread over the last four commits:

| commit | BREADTH | SOLID | CUT |
|---|---|---|---|
| 3645414 / 38d06a2 / deeb9f1 | 0.319 | 0.600 ok | 0.221 ok |
| 6d1a1b1 "three subtractions" | 0.325 | **0.735 HIGH** | **0.083 LOW** |

The commit that correctly confessed to gaming a hole metric then made three edits that all *remove
daylight*: membrane run to the tip, separation notch deleted, cup depth 0.42 → 0.30. It took the
wing from failing 1 of 4 bands to failing 3 of 4. The diagnosis was right and the prescription was
the same wrong instruction one more time. **Confessing to a bad metric does not undo it; you have
to stop obeying it.**

## The reusable pattern

Measure the outline in the part's **own** PCA frame, harvested by **rig role**
(`userData.wingRole === 'pivot'`) rather than by a per-dragon `userData` tag. That is why this tool
runs on the whole roster on turn one, and why `planformprobe` — which keys off `fornaxPart` —
could not.

## What it unlocks

A wing gate that fires on the real defect and cannot be satisfied by deleting daylight. The next
Fornax round has a numeric target: BREADTH 0.325 → ≥0.45 and SOLID 0.735 → ≤0.68, achieved by
adding chord **at mid-span only**, plus CUT 0.083 → ≥0.10 from the bays between the fingers.
