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

**The I2 MEMBRANE probe** (added with increment I2) turns the same stage into numbers instead
of pixels — masked per-surface statistics, so "membrane luma" means the membrane and not
membrane-plus-sky-plus-bone:

```
node wing-lab/tools/wingtiers.mjs forgewing        # §5.5 tiers · §6.2 polarity · the blue sheen
node wing-lab/tools/wingtiers.mjs forgewing --no-control     # skip the kill-#67 control block
```

It reports the four §5.5 tiers **as authored** (read off a vertex-colour mask pass), the
membrane's transmission gain (backlit mean ÷ front-lit mean — an opaque sheet can only get
darker, so this one cannot be faked by being dark), the membrane:bone rank in both light
regimes, and the worst 16 px tile of (B − R) over membrane pixels. Every threshold is then
re-run against four KNOWN-BAD articles that must fail it; a green line in that block means the
probe is broken, not that the wing is good.

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
| `wing-forgewing-apex-detail.png` | 3×2: wing 2.2× pale · 4× pale · 2.2× dark · chase read on sky · **BACKLIT (sun behind)** · **BACKLIT planform · MIRROR PLANE** | same | Surface craft at shop distance; the two backlit tiles are the §11-mandated harness addition — I2's membrane gate cannot be judged without the sun behind the wing. **I3 re-shot the 6th tile per the R3(a) order:** camera exactly on the sagittal plane (`mirrortop`, framing box forced symmetric about x = 0) and the sun exactly anti-camera (`backmirror`, which also mirrors the stage's rim light onto the plane). |
| `wing-forgewing-apex-fire.png` | 4×2 — the §7 STATE LADDER. Row 1 is the CHASE read at cruise / power / ignition plus the bank; row 2 is the same ladder from the wing's own ventral normal (cold · cruise · power · ignition). The §7.2 clock is PINNED to a different value per tile | same | **The FIRE gate's centrepiece.** Row 1 is meant to look nearly identical three times — the radiator is ventral, so from behind and above the state ladder is WITHHELD (kill #44); row 2 is where the recruitment is legible, root-first and tip-last, with hard borders in every state. **I3.1 re-shot row 2's first tile:** cold is now ONE core-coal in a dark pane, not the closed rim that lost Round 4 (kill #68) |
| `wing-forgewing-apex-acting.png` | 5×2 — **I4.1.** Row 1 is the FOLD ARC from one frozen overhead camera at f = 0.00 / 0.25 / 0.45 / 0.65 / 1.00; row 2 is the four ACTING silhouettes (tuck · cape-drape · display spread · mantle) plus the mantle head-on | `node wing-lab/tools/wingshot.mjs forgewing` | **Kill #69's evidence, and §8.3 step 3's.** Row 1 is the only place the ORDER of the fold can be seen — the outline must shed ONE scallop at a time, trailing-first (bay V–VI, then IV–V, then III–IV), digit III over the stack last; a fold judged at its two endpoints cannot show it, which is how a door-fold shipped through Round 6. Row 2 is §8.3's acting set, all four reachable from the same furl array with zero new mechanics; the mantle tiles are where ground contact is judged (carpal cluster only — the membrane never touches the ground) |
| `slitprobe-forgewing-<angle>-<pose>.png` | The CHANNEL probe's debug view: one wing's silhouette with every enclosed background region ringed and sized | `node wing-lab/tools/wingslit.mjs forgewing --debug` | **The R6 SILHOUETTE re-open, made visible.** Written when the carpal weld gap read as a pale channel cutting the wing in two; the pre-I4.1 build is recoverable in the same run (`carpalOpen`) and these are the frames that show it |

**On the L/R split in the OLD backlit planform (R3's eyes-on question (a)).** The previous
capture used `wingtop`, which frames on the RIGHT wing's bounding box and therefore sits half
a span off the mirror plane. §6.2's transmission term is view-dependent by construction —
`d_eff = d_geo / max(|N·V|, 0.08)` — so **off the mirror plane the two wings MUST differ**;
that anti-phase flare is the authored feature §2.6.4 asks for in a bank, not a bug. The
falsifiable claim is the on-plane one, and it is now asserted: `wingfire.mjs` measures
membrane mean luma left-half vs right-half on `mirrortop` + `backmirror` and requires ≤10%
(**measured 0.0%**), with the same shot at `offaxistop` as its negative control (**11.9%**,
fires). If that assertion ever goes missing or fails, MEMBRANE re-opens.

| `wing-COMPARE-forgewing-tempest.png` | 2×3 sheet: forgewing vs the premium bar at PLANFORM / REAR CHASE / WING crop, identical camera logic | `node wing-lab/tools/wingshot.mjs --compare forgewing tempest` | **The blind A/B the I1 gate is scored on.** Same body, same stage, same angles — the only variable is the wing |

| `quadprobe-forgewing-*.png` (5) | The traced pure-black silhouette at each probe angle, with every detected right-angle corner ringed in red | `node wing-lab/tools/wingquadprobe.mjs forgewing --debug` | **The "zero quadrilaterals" assertion, made visible.** When the probe fails, these say WHICH piece of geometry is the rectangle |

The **pure-math** companion to these pixels (run it FIRST; geometry numbers beat critic
pixels):

```
node wing-lab/tools/wingdump.mjs forgewing     # §3 landmark table, elbow angle, §4 taper,
                                               # §5.1 area shares + AR, bay widths, tri/draw
                                               # split, span/body, root peel   (~4 s, no WebGL)
node tools/wingsymprobe.mjs forgewing          # mirror gate — RIG must be Δ0.000; the vertex-
                                               # cloud line also carries seeded L/R weathering
node wing-lab/tools/wingfire.mjs forgewing     # §7 bands · clipped white · hue law · L/R ·
                                               # kill #68 contours · §7.5 ember hue (+ controls)
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

### I3.1 — the FIRE re-gate (Round 4 lost on ONE tile)

| Ask | What landed | Measured |
|---|---|---|
| **Kill the cold ring (kill #68).** Cold = OFF, or ONE core-coal ≤0.3% of wing area at the pane's thickest point, hard-bordered, centroid-biased, asymmetric by seed; no pixel may trace the window border | The pane's tessellation, temperatures and cruise/power/ignition pixels are UNCHANGED. The only edit in zone A is which cell carries stage 0: the outer ring became one INTERIOR cell (`ia` ∈ {1,2}, `ib` = 2 by seed — indices that cannot touch a pane border), and `FIRE_GAIN[0]` fell 0.62 → 0.039 so the coal reads as the last coal in a banked furnace instead of a white-hot door | authored **0.14%** of wing area (≤0.30) · measured **0.22%** (≤0.50) · **0 closed emissive contours** in all four states · clipped white 0.00% |
| **Secondary-slot variety** — per-slot scale/aspect/rotation jitter, sizes decaying outboard, one dropped slot per side, L ≠ R by seed | FOUR authored slots per row with monotonically decaying radii, ±25% seeded scale/aspect jitter, a seeded axis skew per slot, and one slot dropped per row per side at an index that is *guaranteed* to differ L vs R. Four authored − one dropped = three drawn: net zero triangles | power 7.41% · ignition 10.72% authored (bands 6–12 / 9–15) · furthest emissive vertex t = 0.510 (< 0.60) |
| **Embers: warm or absent; white forbidden** | The shed composites (`a·src + (1−a)·dst`) instead of adding, with the alpha authored per fragment from the ember's own radiance, and a new across-rod coordinate (`aEmb2`) that lets the QUAD be wider than the optical rod so the spine pixels are not resolved as mostly sky. Emitter deepened to linear (1.25, 0.140, 0.005) — byte (255, 140, 45) instead of R4's pale (234, 200, 132) | over sky: core hue **9.6°**, sat **0.404**, washed-white **0.0%**, clipped **0.0%** — against the R4 additive control at hue 314°, sat 0.114, **74.9%** washed white |
| **Draw consolidation** (the I4 entry condition) | Seven opaque solids (char · ash · claw · covert · band · fairing · §7.4 temper) became ONE vertex-coloured `forge:crust` bucket carrying per-vertex roughness in a two-instruction patch. They only ever differed in colour and roughness; `envMapIntensity` differs too and is a no-op on this project (no `scene.environment`, no `envMap` anywhere) | pair **32 → 16 draws** (freeze ≤20) · whole form 101 → 83 · triangles **unchanged** at 3,156 / 5,477 · pixel effect: 1-px antialias seams only, measured by rendering the same sheet with and without the merge |

### Three harness additions landed with I3.1

- **`wlContourScan`** — kill #68 as a topological measurement: take the LIT fire pixels,
  morphologically CLOSE them at radius 2, and flood-fill the unlit set from the frame border.
  Anything unreachable is enclosed, and light that encloses darkness is an outline. The
  radius is not a free parameter: the R4 ring converges to the pane's tip cusp across a
  2–3 px pinch that the eye reads as closed and a strict flood-fill walks through, so at
  radius 1 the probe cleared the very frame that lost the gate.
- **`wlEmberScan`** — the ember shed is FX and is hidden from every masked pass by design, so
  it is isolated by DIFFERENCE (render the tile with and without the shed; every pixel that
  moved is an ember pixel). Reports hue/saturation over the full set and over the CORE
  stratum, restricted to embers standing against the SKY.
- **The R4 defect, kept as a firing pin.** `flushFire` parks the old ring's stage tags on the
  fire geometry as `wlKnownBadStage`, and `wlMutate({ coldRing: true })` swaps them back in.
  Kill #67 asks that a probe be shown firing on a known-bad; for this gate the known-bad is
  our own last delivery, so the lab now owns it instead of remembering it.
- **`wingsymprobe` now reports the RIG separately** from the vertex cloud. The cloud test
  cannot tell an off-beat poser from a seeded mesh, and §7.4 makes seeded L/R weathering
  mandatory — so the named joint nodes (which carry no decoration) are compared as well.
  Rig **0.000**; cloud **0.010** (threshold 0.03), the first geometric L/R difference this
  article has ever carried, and it is there because the director ordered one dropped slot
  per side.

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


---

## E. THE PROBES (an instrument with no INDEX entry is not usable by this lab, either)

Every probe here obeys the §11 probe law and kill #67: it prints its own negative control,
in the same run, at the same thresholds. A row without a firing control is not a result.

| Probe | Run | What it measures | Its negative control |
|---|---|---|---|
| `wingdump.mjs` | `node wing-lab/tools/wingdump.mjs forgewing` | §3 landmarks (Δ vs spec), §4 spar taper, §5.1 area shares + bay widths + skirt lap, §5.2 sail depth, §7.1 authored fire area per state and per zone, posed extents, root drift | The landmark table is compared against §3's own numbers; a rescale that broke it prints a non-zero Δ |
| `wingfold.mjs` | `node wing-lab/tools/wingfold.mjs forgewing` | **§8.3** the fold arc (span ratio, order of collapse, tip landing, weld opening per seam, fold symmetry + per-system attribution), **§8.3 step 3** the scallop-shedding ORDER (kill #69), **§8.3** the four acting silhouettes and carpal-only ground contact, **§5.1** the cloak over the skirt through the arc, **§8.1** the beat, **§8.2** the surface | Six, all in-run: the shipped roster reproducing its own non-folds (0.75 / 0.90 / 0.97); the wrist driven about +Y instead of its own weld (gap 3.1× worse); the hand welded to the forearm (no sign flip); the slack binding cut (1.00× at both extremes); the seed-locked rebuild that attributes the fold-pose cloud; and **the R6 door-fold** — the same three lobes on ONE shared window, whose scallops leave 0.05 of the arc apart against 0.25 shipped |
| `wingslit.mjs` | `node wing-lab/tools/wingslit.mjs forgewing [--debug]` | **The channel gate.** One side of the article in pure black at nine delivered reads; the silhouette must be ONE piece with no background region enclosed by WING. Reports the NECK — the narrowest isthmus holding the wing together — as the margin | Three: the **pre-I4.1 build restored from the geometry itself** (`carpalOpen` — the wing that lost Round 6, which must fire and does); a hole punched through the plagiopatagium (`slitTest`, fire-and-clear on ONE surface); and the shipped strut-comb wings as calibration, printed explicitly as context and NOT as a verdict, because a comb of separate blades is not a continuous skin |
| `wingtiers.mjs` | `node wing-lab/tools/wingtiers.mjs forgewing` | **§5.5 / §6.2.** Membrane vs bone percentiles front-lit and backlit, transmission GAIN, B−R blue, and the AUTHORED tier spread — read at glide for polarity/darkest-element and at the **face-presenting pose** (settle / downstroke) for the tier criterion, with a countability crop at 2.2× and 4× and a three-way pose ÷ build isolation | Four known-bads that must all fail: the shipped Revenant (one-value membrane), `uMemScale = 0`, the I1 materials, and the membrane forced PURE BLACK. The polarity pass runs with the §6.3 hem fringe OFF — the R6 ruling (a) — which is what stops the black control clearing it |
| `wingfire.mjs` | `node wing-lab/tools/wingfire.mjs forgewing` | §7 emissive area per state, thermal hue, the closed-contour test on the window border | The R4 cold rim, shipped inside the fire geometry as `wlKnownBadStage` and swapped back in by `mutate:{coldRing:1}` |
| `wingquadprobe.mjs` | `node wing-lab/tools/wingquadprobe.mjs forgewing --debug` | §12 kill #66 — right-angle corners between two long straight runs in the pure-black silhouette | aurumToro fires / tempest-revenant-vesper clear |
| `wingperf.mjs` | `node wing-lab/tools/wingperf.mjs` | The comparative whole-frame delta between wings. **VOID in this container**, and reported as void: its control's sign inverts (a 993-tri wing measures SLOWER at 2.9 fps CPU raster). Retained because the design is sound on real hardware | The control IS the finding — `vesperLean` must measure faster and does not |
| `wingfill.mjs` | `node wing-lab/tools/wingfill.mjs` | The isolated fragment A/B — the patched membrane shader against a plain material at a measured coverage — which is what COST binds on in this lab | The plain-material pass at the same coverage; the ratio resolves to 1.74× with the control clearing |
