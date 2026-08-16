# refs/ — the shared image set

Every agent in this lab may `Read` any file here. If you add one, add a row.
An image with no row is invisible to the rest of the lab.

⚠ **External image download is blocked in this environment** (egress policy returns 403
on CONNECT). Do not spend turns on curl/wget. Images here come from three places only:
**in-engine renders**, **procedural plates we draw from sourced numbers**, and
**generated moodboards** (clearly labelled as mood, never as anatomical evidence).

---

## A. Procedural anatomy plates

| File | What it is | Regenerate with | Evidence OF |
|---|---|---|---|
| `plate-camber.png` | Four chord sections at the sourced camber values, NACA mean line so the max sits exactly at the stated 40% chord | `node tools/wingplate.mjs camber` — values `[S]` from `DRAGON-ANATOMY-REFERENCE.md` §4.5 | How deep the membrane sag must be, and where along the chord it belongs |

### Regenerating the plates

```
node tools/wingplate.mjs            # all plates
node tools/wingplate.mjs camber     # one
```

Plates are driven entirely by `refs/wing-spec.json`. To add a number to a plate, add it
to the spec — the spec carries only values the research actually closed, and sections
awaiting research are **absent rather than guessed**.

> ⚠ **`tools/wingplate.mjs` is NOT in the repo** (checked 2026-08-16: no `reforged/tools/wingplate.mjs`,
> no `wing-lab/tools/wingplate.mjs`). `plate-camber.png` is therefore currently **un-regenerable** —
> the image is real, the command above is not. Whoever produced the plate owes the tool a commit.
> — flagged by R1.

---

## B. IN-ENGINE renders of the shipped wings (stream R1)

**These are ground truth about the CURRENT BAR, not about anatomy.** They show what this
engine actually builds today, on the neutral studio stage (the lighting rig is copied
verbatim from `tools/dragonstudio.html`: ACES tonemap, sRGB, one hemisphere + three
directionals), so a wing-lab frame is directly comparable to a shipped gate frame.

All thirteen come from ONE driver. Run everything from `/home/user/dragon-drift/reforged`:

```
node wing-lab/tools/wingshot.mjs                                # all three heroes, 12 sheets
node wing-lab/tools/wingshot.mjs vesper                         # one dragon, 4 sheets  (~2 min)
node wing-lab/tools/wingshot.mjs vesper revenant tempest --compare   # the 1 COMPARE sheet
node wing-lab/tools/wingshot.mjs vesper --tier=1                # a lower rung → wing-vesper-f1-*.png
```

Every dragon is rendered at its **apex** (`maxTierFor(key)` — tag `apex`) unless `--tier=N`
(tag `fN`). The driver also prints a **world-space measurement table per pose** (span / rise /
chord / body length / wing-tris / tip position / fold ratio) — the numbers belong beside the
pixels, and they are reproduced in `data/R1-repo-capability.md` §T7.

Dial sets shown are the apex `model` blocks in `js/dragons.js`
(vesper `:581-680`, revenant `:694-777`, tempest `:778-853`) — tabulated in
`data/R1-repo-capability.md` §T4/§T5.

| File | What it is | Dragon · dial set | Regenerate | Evidence OF |
|---|---|---|---|---|
| `wing-COMPARE-vesper-revenant-tempest.png` | 3×3 sheet: each hero at PLANFORM (top) / REAR CHASE / WING crop, same three reads, same camera logic | all three, apex f3 | `node wing-lab/tools/wingshot.mjs vesper revenant tempest --compare` | **The roster's three premium wings judged against each other.** Open this first. |
| `wing-vesper-apex-planform.png` | 3 tiles: PLANFORM (top) · HEAD-ON (dihedral/camber) · EDGE-ON (thickness) | vesper `scallopCrescentWings`, f3 (`scallopLobes 5, wristT 0.21, wingCup 0.35, wingNSEG 8, covertRow 12`) | `node wing-lab/tools/wingshot.mjs vesper` | Planform shape, dihedral, and **the plank test** (edge-on thickness) |
| `wing-vesper-apex-poses.png` | 3 tiles: SPREAD (glide) · MID-FLAP (downstroke) · FOLDED (fold), one wing broadside, one shared camera | vesper f3 | same | Whether the fold is a real furl; how the wing changes shape across the stroke |
| `wing-vesper-apex-cycle.png` | 5-tile strip: glide → recovery → apex → downstroke → settle, from the **rear-chase** cam, ONE frozen camera | vesper f3 flap set (`rootAmp .62, midAmp .34, tipAmp .55, midLag .45, tipLag 1.0, glidePow 2.2`) | same | **The money angle.** What the player actually sees of the wing across a beat |
| `wing-vesper-apex-detail.png` | 4 tiles: wing 2.2× pale · 4× pale · 2.2× dark · chase read on sky | vesper f3 | same | Surface craft at shop distance, and whether it survives a dark and a sky backdrop |
| `wing-revenant-apex-planform.png` | as above | revenant `phalanxShroudWings`, f3 (`fingers 4, wristT 0.24→builder 0.40, halfSpan 4.1, crescentDepth 1.0, shroudPanels 2`) | `node wing-lab/tools/wingshot.mjs revenant` | same |
| `wing-revenant-apex-poses.png` | as above | revenant f3 | same | same |
| `wing-revenant-apex-cycle.png` | as above | revenant f3 flap set (`rootAmp .72, apexRoot .17, midAmp .14, tipAmp .09, midLag .7, tipLag 1.1, glidePow 1.15`) | same | same |
| `wing-revenant-apex-detail.png` | as above | revenant f3 | same | same |
| `wing-tempest-apex-planform.png` | as above | tempest `stormforkWings`, f3 (`rays 5, kinkKnuckles 3, forkN 2, spur on, halfSpan 4.1, coverts 9, sparks 6`) | `node wing-lab/tools/wingshot.mjs tempest` | same |
| `wing-tempest-apex-poses.png` | as above | tempest f3 | same | same |
| `wing-tempest-apex-cycle.png` | as above | tempest f3 flap set (`rootAmp .80, apexRoot .30, midAmp .32, tipAmp .80, midLag 1.05, tipLag 2.1, glidePow 1.1, tipApexSweep .26`) | same | same — **and the only wing on the roster with `tipApexSweep`** |
| `wing-tempest-apex-detail.png` | as above | tempest f3 | same | same |

### Reading the sheets — the driver's own conventions

- **Angles** (`wing-lab/tools/wingshot.html:48-60`): `wingtop` = planform · `wingfront` =
  head-on (dihedral + camber) · `wingside` = edge-on (the plank test) · `wing` = rear-above
  from the OFF side (the right wing sweeps across frame) · `wingrear` = the chase read of ONE
  wing · plus whole-model `rear / rear3q / side / top / front`.
- **Backdrops**: `pale 0xcfd6e4` · `dark 0x14121a` · `sky 0x8fb8dd` · `gold 0xd9a24a`.
- **The cycle strip shares ONE camera** (`framePose`), so tile-to-tile size differences are
  REAL amplitude, not reframing. Do not "fix" it by refitting per tile.
- Poses come from the shared, clock-free `setFlapDebugPose` pin — **two runs are pixel
  identical**. If a re-render differs, something in the build changed.

---

## C. What each render actually shows — in-engine ground truth (R1, honest read)

One line per wing per sheet. This is what is on screen today, not what the buildsheets claim.

**Vesper — `scallopCrescentWings`** (450 wing tris, span 6.35, span/body 0.61 — the roster's *smallest* premium wing)

- `planform` — The fingered anatomy is real (arched leading edge, five rays, trailing edge cutting
  INWARD between tips), but from above the whole wing is **one near-black value**: the four
  `memTiers` do not separate at this angle, so the craft that exists is invisible and the read is
  pure outline. Edge-on it is a genuinely thin sheet with relief on the **dorsal face only** — the
  ventral side is a flat plane.
- `poses` — SPREAD and FOLDED are nearly the same silhouette (**fold contracts span only 16%**);
  the only frame with a different shape is MID-FLAP, where the underside lights up warm tan and
  suddenly shows more surface than any other pose.
- `cycle` — At `glide` and `recovery` the wing is **two black spikes** with essentially zero
  membrane read; only `apex` opens the planform. The beat has range, but 2 of 5 poses show no wing.
- `detail` — At 4× on pale, three membrane values finally read and the covert flakes and
  constellations appear. At 2.2× they are gone. On the dark backdrop the wing vanishes except for a
  few steel-blue rim facets; on sky it is a black spike. **This wing is a silhouette, by design and
  in fact.**

**Revenant — `phalanxShroudWings`** (252 wing tris — the *cheapest* wing on the roster, span 8.50)

- `planform` — The most legible bat wing in the game: four pale ivory phalanges fanning over a
  black shroud, deep concave scallops, an unmistakable dominant leading finger. But the bones are
  **flat pale TAPE** — near-constant width, one value, no core→bloom→dark — and the membrane is
  **exactly one flat value** with zero internal banding. Two values total.
- `poses` — SPREAD and FOLDED are all but identical (**fold contracts span 7%** — the fold is a
  non-event). MID-FLAP is where the bone fan reads best.
- `cycle` — The best chase-cam read of the three: at `apex`, `downstroke` and `settle` the full
  planform faces the camera and the bone/shroud contrast carries it. At `glide` and `recovery` it
  still collapses to two dark blades — the pale bones are the only thing that survives.
- `detail` — At 4× the phalanx joints are a genuine rank and the wing holds up on **pale, dark AND
  sky** backdrops. This is the roster's proof that VALUE CONTRAST beats value COUNT for legibility —
  and simultaneously the roster's clearest example of flat-tape bones and flat-black poverty.

**Tempest — `stormforkWings`** (744 wing tris, span 9.70, span/body **1.18** — the roster's widest premium wing)

- `planform` — The richest membrane: 4–5 charcoal value steps per bay (the P2 de-plane work is
  clearly visible), a white bolt filament running each strut with real forks, and the widest, most
  ambitious shape. Two defects are equally visible: the white covert flakes read as **scattered
  confetti** rather than an organized rank, and the bays overlap as **stacked shard plates**
  instead of one taut skin.
- `poses` — SPREAD and FOLDED are indistinguishable (**fold contracts span 1.4%**). MID-FLAP shows
  the shard-plate layering most clearly.
- `cycle` — The most articulated beat on the roster: at `recovery` the wing is near-vertical with a
  visible two-segment dogleg (the `tipApexSweep 0.26` fix earning its keep), `downstroke` reaches a
  deep swept Λ. Range is excellent; area presented to the camera at `glide`/`recovery` is still small.
- `detail` — The only wing whose membrane still has structure at 2.2× and on a dark backdrop. The
  frame reads slightly as a decal **on top of** the skin rather than under it, and the inboard
  shoulder region is a tangle of small dark shards rather than a resolved mass.

**Across all three, the same two facts:**

1. **The wing is edge-on for ~40% of the beat.** Craft on the membrane FACE is invisible at
   `glide` and `recovery`; craft on the LEADING EDGE and the trailing polyline is visible always.
2. **No hero has a working fold.** `DRAGON-DESIGN §7` asks a fold to contract span past 0.7×.
   Measured: vesper 0.838, revenant 0.932, tempest 0.986. (azure 0.475 and ember 0.429 do pass —
   both via the bespoke `poseBladePivots` / furl branches no premium hero publishes.)
