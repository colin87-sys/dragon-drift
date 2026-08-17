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

> ✅ **Resolved.** R1 flagged the plate as un-regenerable after finding no
> `reforged/tools/wingplate.mjs` and no `wing-lab/tools/wingplate.mjs`. Both those paths are
> genuinely empty — the tool lives at the **repo root**, `tools/wingplate.mjs` (+ `.html`),
> committed in `7cf0d6e`. Re-verified running on 2026-08-16.
>
> **Path convention, since this bit one stream already:** `wingplate` is run from the
> **repo root** (`node tools/wingplate.mjs camber`), while `wingshot` is run from
> **`reforged/`** (`cd reforged && node wing-lab/tools/wingshot.mjs vesper`). Check your cwd
> before concluding a tool is missing.

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

---

## B2. IN-ENGINE renders of the WING-LAB test article (increment I1)

**These are the I1 deliverable, not the bar.** `forgewing` ("Basalt Forgewing") is the
`90-SYNTHESIS.md` wing built on the **Thunderhead Tempest's shipped torso/head/tail recipe,
unchanged** — every body, palette and motion dial is the Tempest's, and the ONLY difference
is `parts.wings: 'basaltForgeWings'`. So anything that differs from a `wing-tempest-*` sheet
at a matched angle IS the wing. Builder: `reforged/js/dragonForgewing.js`.

I1 scope is geometry only — skeleton, landmarks, planform, flat-tiered bays, hem, claw
cluster, propatagium, cowl. **No membrane shading, no fire, no new flap dials** (I2/I3/I4).

Run everything from `/home/user/dragon-drift/reforged`:

| File | What it is | Regenerate | Evidence OF |
|---|---|---|---|
| `wing-forgewing-apex-planform.png` | 5 tiles: PLANFORM (top) · HEAD-ON (dihedral/camber) · EDGE-ON (thickness) · **SILHOUETTE planform (whole)** · **SILHOUETTE wing ONLY**, the last two in PURE BLACK | `node wing-lab/tools/wingshot.mjs forgewing` | **The I1 SILHOUETTE gate.** The "‹" leading edge, the 4-digit fan opening at the knuckles, the scalloped trailing edge, the swept-pointed tip — with nothing but shape to argue about. The two black tiles are deliberately different: one shows the wing ON the dragon, one shows only the geometry this builder owns |
| `wing-forgewing-apex-poses.png` | 3 tiles: SPREAD (glide) · MID-FLAP (downstroke) · FOLDED (fold), one wing broadside, one shared camera | same | **The I1 STRUCTURE gate.** Arm vs hand articulation; that no membrane tears at the wrist or the root across the stroke |
| `wing-forgewing-apex-cycle.png` | 5-tile strip glide → recovery → apex → downstroke → settle from the rear-chase cam, ONE frozen camera | same | The money angle. Also where the measured 0.77-unit ROOT PEEL of the inboard-aft membrane corner would show if it read as a detaching shard |
| `wing-forgewing-apex-detail.png` | 3×2: wing 2.2× pale · 4× pale · 2.2× dark · chase read on sky · **BACKLIT (sun behind)** · **BACKLIT planform** | same | Surface craft at shop distance; the two backlit tiles are the §11-mandated harness addition — I2's membrane gate cannot be judged without the sun behind the wing |
| `wing-COMPARE-forgewing-tempest.png` | 2×3 sheet: forgewing vs the premium bar at PLANFORM / REAR CHASE / WING crop, identical camera logic | `node wing-lab/tools/wingshot.mjs --compare forgewing tempest` | **The blind A/B the I1 gate is scored on.** Same body, same stage, same angles — the only variable is the wing |

| `quadprobe-forgewing-*.png` (5) | The traced pure-black silhouette at each probe angle, with every detected right-angle corner ringed in red | `node wing-lab/tools/wingquadprobe.mjs forgewing --debug` | **The "zero quadrilaterals" assertion, made visible.** When the probe fails, these say WHICH piece of geometry is the rectangle |

The **pure-math** companion to these pixels (run it FIRST; geometry numbers beat critic
pixels):

```
node wing-lab/tools/wingdump.mjs forgewing     # §3 landmark table, elbow angle, §4 taper,
                                               # §5.1 area shares + AR, bay widths, tri/draw
                                               # split, span/body, root peel   (~4 s, no WebGL)
node tools/wingsymprobe.mjs forgewing          # mirror gate — must be Δ0.000
node tools/tricount.mjs --ci                   # budget gate
node tools/tiershots.mjs forgewing             # the 4-rung ladder → /tmp/tier-forgewing.png
node wing-lab/tools/wingquadprobe.mjs forgewing   # silhouette gate: 0 right-angle corners
```

### I1.1 — what the director's second round changed

| Ask | What landed | Measured |
|---|---|---|
| Kill the rectangle / blue card / root peel (ONE bug, three symptoms) | The wing sheet's inboard-aft corner moved ONTO the pivot — the single point a rotation about the pivot cannot move — and its trailing edge became a bezier that bows aft out of that cusp. Flank coverage back to the hip became a **body-frame skirt** built as a *continuation* of the wing's own trailing line, so the two outlines merge instead of crossing | root drift **0.000 u** (≤0.05 required) · skirt overlap **0.193 chord** (≥0.15 required) · **0 right-angle corners** across 5 angles |
| Land span/body in 1.10–1.20 | uniform rescale, `hs = spanScale · 6.2` | **1.172** at glide (bar 1.18) |
| Move `mid` to t = 0.28 | a second −anchor: `mid.position = +E`, `fore.position = −E`, driven at `midAmp: 0` | landmark table still Δ0.0000 |
| The orphan covert chip | rebuilt as a real shingled rank of 9, charcoal bodies with one lit lapped edge, terminating at the carpal cluster | — |

### Two harness changes landed with I1

- **BACKLIT light mode** (`wlRender({ light: 'back' })`) — the sun is placed on the far side
  of the subject from the camera and ambient is pulled to 0.14. Required by §11; without it
  the I2 membrane gate has nothing to judge, because transmission only fires with the sun
  behind and the backlit↔front-lit polarity flip is itself a pass criterion.
- **Pure-black SILHOUETTE mode** (`wlRender({ silhouette: true })`) — a `MeshBasicMaterial`
  scene override, so the shape cannot be flattered or rescued by the stage. I1 is gated on
  silhouette in pure black.
- **`wingOnly` mode** (I1.1) — hides everything not under a wing root BEFORE the camera fit,
  so a silhouette probe measures the wing and frames it consistently.
- **`wing-lab/tools/wingquadprobe.mjs`** (I1.1) — the "no quadrilaterals" assertion as a
  measurement: it traces the black silhouette, simplifies it at 1 px, and flags any vertex
  where two runs that are straight over ≥30 px meet at 75–105°. Scallop cusps at the
  fingertips also close at ~88°, so straightness — not the angle — is the discriminator.
  Control-checked: it clears `forgewing`, `tempest`, `revenant` and `vesper`, and still
  fires on `aurumToro`'s faceted blade wing.

Both default OFF, so every pre-existing tile renders exactly as before. The shipped-wing
sheets in §B were **not** re-run and still show the older 3-tile / 4-tile layouts.

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
