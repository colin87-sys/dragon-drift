# Five green bands on a wing that came off the body — and the metric that finally sees the owner's ask

**What we did.** Round 9 gate on the fire wyvern Fornax's wing. Verified the builder's claimed
numbers on `reforged/tools/wingread.mjs`, verified their *causal* claim with an ablation, then
judged the render — and found a regression that every band scored as an improvement. Extended
wingread with `SCALLOP` (`LOBES` / `GROW`).

## The gotcha: a metric can score an amputation as a refinement

The builder closed a real defect — the arm sheet's trailing edge was anchored at the last
fingertip, leaving a topological notch — by re-anchoring it to the **wrist**. Numbers moved a lot
and all in the right direction: `CUT 0.096→0.157`, `RAG 2.644→1.906`, `SOLID 0.670→0.584`. Five of
five bands green for the first time in nine rounds.

The notch closed because **the material on one side of it was deleted**. The inboard sheet that
filled the armpit is gone. Chord at 20% span fell `0.75 → 0.16`. The rendered silhouette lost
**8.8% of its rear-chase area and 8.7% of its top planform**, all of it in one triangular wedge at
each wing root. The wing now meets the body at a stick, and the owner's verbatim standing complaint
is "all tattered and has see-through gaps."

`SOLID` is mean chord ÷ widest chord. It had been HIGH (0.670, a plank). Deleting inboard area
lowers mean chord, so **SOLID fell toward the middle of its band as a direct consequence of the
regression**. The band did not merely miss the defect; it paid out for it.

### The reusable pattern

> A ratio whose numerator is area will reward deleting area whenever it was reading HIGH.
> Before accepting a metric move, ask which side of the ratio moved — and check the rendered
> silhouette's absolute pixel count, which has no denominator to hide in.

`silhouette diff, red = lost` is three lines of PIL over the two `sil-*.png` captures and it
localised the defect instantly when four scalar bands could not. Do this on every gate.

wingread's own header says it deliberately measures no holes, armpits, or anything wing-vs-body,
because a hole floor is an instruction to punch holes. That exclusion is still right. The
consequence, now written into the tool: **WINGREAD ALONE CANNOT CLEAR A WING.** The planform is
necessary, not sufficient. That caveat is now in the file so the next reader cannot take five green
bands as a pass.

## The causal claim was true, and worth checking properly

The builder claimed the topology fix — not the `CUPK` cup dial — was what moved `CUT`, since three
rounds of dial tuning could not shift it off 0.09. A 2×2 ablation over
`{CUPK 0.52 | 0.30} × {Tlast fingertip | wrist}` confirms it: `CUT` moves only on the `Tlast` axis
(`0.086 → 0.157` at CUPK 0.30); the dial is worth `−0.010 CUT` and `−0.24 RAG`. **Verify causal
claims with a 2×2, not by re-reading the diff** — it took one shell loop and it also showed that
`RAG` needed *both* edits to clear its ceiling, which the commit message overstated.

## SCALLOP: the ask was unmeasured for nine rounds, and the floor already ships it

The owner has asked, repeatedly and in these words, for a trailing edge "scalloped nicely and
increasing in proportional scallops". Nothing measured it. `RAG` catches tattered-vs-scalloped as a
**total** but is blind to **arrangement** — fifty equal nicks and five lobes that grow outboard can
share a RAG. `CUT` is an area; `DEEPEST` is one extremum.

`SCALLOP` decomposes the trailing edge into lobes between its hull-touch points:
`LOBES` = countable bays, `GROW` = Kendall concordance of lobe depth against span position, −1…+1.

| key        | LOBES | GROW  | depths root→tip | at %span |
|------------|-------|-------|-----------------|----------|
| tempest    | 4     | +1.00 | 0.196 0.224 0.307 0.308 | 26 59 80 96 |
| vesper     | 4     | +0.33 | 0.031 0.538 0.150 0.214 | 9 39 70 90 |
| revenant   | 3     | −0.33 | 0.434 0.231 0.377 | 25 64 89 |
| fornax g12 | 7     | −0.33 | **0.772** 0.122 0.046 0.335 0.064 0.099 0.067 | **17** 36 57 63 84 88 98 |

**Tempest is the ask, already shipped** — four bays, each deeper than the last, +1.00. Nine rounds
were spent chasing a request that the premium bar had satisfied all along; nobody could see it
because nobody had a number for it. *When an owner ask survives many rounds undelivered, suspect
that it is unmeasured rather than hard, and check whether the reference already passes it.*

Fornax is one 0.772 canyon at 17% span followed by six random nicks that get **shallower** outboard.
This also re-reads `DEEPEST 0.772`, which had been dismissed for two rounds as "marginally over the
roster": it is not a scalar curiosity, **it is the root wedge** — the same defect the silhouette
diff found, arriving independently from triangles. Two instruments agreeing on a location is worth
more than either agreeing on a threshold.

`SCALLOP` is informational and **never banded** — the roster was not built to this ask and the
calibration law forbids a band the reference dragons fail. Pose-stable on tempest
(+1.00 / +1.00 / +0.67 across glide / settle / bank).

## What it unlocks

- A gate can now state the owner's scallop ask as a target with a shipped reference value
  (`LOBES 4–5, GROW ≥ +0.6`) instead of an adjective.
- `DEEPEST` gains a companion that says *where*, which turns it from a number into a diagnosis.
- The silhouette-pixel-delta check is cheap enough to run on every wing round and should be
  standing procedure alongside `tricount` and `tiershots`.
