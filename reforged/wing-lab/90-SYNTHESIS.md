# 90 — SYNTHESIS: the wing of the western fire dragon

**Written by the Director. This is the buildable spec.** A fresh builder implements from this
file alone — every load-bearing number from the six research streams is restated here, already
decided. Where streams conflicted, the conflict is named and resolved in §2; the resolution is
binding. Where the research honestly said `unknown`, §13 lists my art direction for the gap,
marked **DIRECTED** — those values are mine to change, nobody else's.

Provenance calibration, inherited from `00-BRIEF.md` and binding on how hard any number here may
be leaned on: all external sourcing in this lab is **WebSearch-summary grade** (WebFetch is
egress-blocked). Numbers below that came from a single unquoted paraphrase were treated as
`[D]`-grade during synthesis and are either corroborated by a second route or explicitly
DIRECTED. Repo numbers (`R1`) are file:line-checkable and are the only `[S]`-hard facts here.

---

## §1 Identity

> **A bellows, not a lantern: a coal-dark, hand-built storm sail on a basalt-pipe arm — the
> furnace lives in one hard-edged window under its arm, and you only see it when the wing rolls.**

The three moves that most change what it looks like, relative to everything shipped:

1. **The arm is real.** Wrist at half the span (t = 0.50), elbow visible at 0.28, a genuine
   propatagium sail filling the shoulder→wrist front, and a clawed carpal hand-cluster as the
   silhouette's punctuation mark. Every shipped hero is a stub arm with a giant fan; this wing
   is an **arm with a hand that also flies**.
2. **One exponential owns the surface.** A single per-vertex optical thickness drives sunlight
   transmission (`exp(−σd)`) and fire emission (`1−exp(−κd)`) as two ends of the same term.
   Backlit, the membrane goes ember-amber with **dark** veins and cord striations subtracted from
   the glow; front-lit it is the darkest element on the dragon; the fire itself is a ventral
   root window plus artery lines, **93–97% of the wing permanently dark**.
3. **The fold works.** Per-finger furl to **≤ 0.55× span**, bays closing like a fan, tip landing
   behind the hip — the first premium hero wing in this roster whose fold is an event, not a
   1.4% shrug.

---

## §2 The six conflicts, resolved

### 2.1 Where the wrist goes — **t = 0.50, hand = 50% of the semi-span**

The poles: D1's measured bat chain puts the wrist at **0.54–0.58** (hand 44–49%); the shipped
`wristT 0.20–0.30` is, per the §4.4 annotation, the **pterosaur** proportion wearing a bat label
(a true pterosaur wrist sits at ~0.27 of shoulder→tip; its palm bone alone outruns its forearm).
Both are real lineages. I pick **0.50** — the bat chain pulled exactly one notch pterosaur-ward —
for four reasons that all cash out on screen:

- **The chase camera sees the leading edge 100% of the time** (R1: the wing is edge-on for ~2 of
  5 cycle poses). A wrist at 0.50 distributes five knuckle landmarks across the whole span;
  a wrist at 0.22 gives a root-clutter stub and one long blade.
- **The propatagium** — the recognised amateur omission, and this design's biggest unshipped
  feature — needs shoulder→wrist run to exist. At wristT 0.22 it is a sliver behind the torso.
- **D2's beam-theory taper** breaks regimes at the wrist and computed its table with the wrist
  at 45% of the root→tip run — which converts to exactly **t = 0.50** from the body midline.
  The physics table needs no recomputation.
- **The fold** must recruit the elbow anyway (real folds retract span by elbow flexion, then
  wrist fold + supination). A 76% hand jackknifing on one joint is a door closing; a 50% hand
  closing after the elbow is a fan closing — the read A1 demands.

What this overrules: the repo habit of `wristT 0.21–0.24`. What it keeps: the shipped span, rig
contract, and the dominant-digit hero line. The one fallback lever, if the blind silhouette gate
rejects it, is wristT alone — the fan spec below does not change.

### 2.2 Corded membrane vs dark membrane vs subtractive detail — **separate the channels, separate the territories**

D2's physics demands visible fibre cords (~1.8 mm at ~20 mm spacing — ~75 per chord line);
A1 says the sheet is soft and translucent, not leathery; A2 says all drawn detail must darken,
never lighten; F1 keeps 93–97% of the wing dark. All four hold at once because:

- **Cords are thickness, never paint and never light.** A cord is a local doubling of optical
  path: backlit it is a **dark striation inside the amber glow** (subtractive — A2's law);
  front-lit it is near-invisible micro-relief on a 3–7%-albedo sheet; at grazing angles the
  combed field carries a broken anisotropic **sebum sheen** along the cord direction.
- **Territories, sourced:** NO cords on the inboard plagiopatagium near the body (the fossil law:
  fibres absent proximally) — which is exactly where F1's forge window lives, so the window
  stays a clean, hard-edged pane of light. Cord density rises outboard, running **parallel to
  the fingers** through the handwing bays — which is exactly the territory F1 keeps **cold**.
  The glow lives where the cords are not; the cords live where the glow is not. They only
  overlap in the 0.30–0.60 span band, where the **vein doublets** cross the sparse start of the
  cord field.
- **Distance behaviour:** at chase distance (4 px cord pitch) the field reads as directional
  grain + sheen; at shop 4× the cords resolve individually. Below ~1.5 screen px, lines become
  tint (A2's Murray cut-off law). Carriers in §6.4.

The striped-shadow money shot D2 wanted — glow gated by cords — is the **backlit-sun** state
through the outboard bays. The dragon's own fire is gated instead by the window border. Both are
detail subtracted from light; nothing on this membrane ever draws with light.

### 2.3 One shading model — **one thickness, one slanted path, two complementary outputs**

F1: a hot translucent slab is brightest **edge-on**, ε(θ,d) = 1 − exp(−α·d/cosθ). A2: sunlight
transmission must be **light-direction dependent** and dims with thickness, T = exp(−σd); the
shipped `membraneSSSPatch` is a view-only Fresnel and is the chrome-outline tell. These are the
same surface and the same equation (Kirchhoff: ε = 1 − T for a non-reflecting thin sheet).
**The one term** (full shader spec §6):

```
d_eff = d_geo / max(|dot(N, V)|, 0.08)                    // view-slanted optical path
T_rgb = exp(−σ_rgb · d_eff)                               // σ_rgb ratio LOCKED (1.00, 2.68, 5.41)·σ0
transmit += sunColor · T_rgb · backLobe(V, L) (+ wrap·amb)  // fires ONLY with the sun behind
emit     += emberColor(state) · (1 − exp(−κ · d_eff)) · heatMask
```

Consequences, all free: the backlit glow **dims** toward edge-on while the fire windows
**flare** toward edge-on — opposite by construction, which animates the wing through every beat
and puts the furnace flash at the top of the upstroke, exactly the pose that is currently dead.
The `membraneSSSPatch` Fresnel is **replaced**, and demoted to one job: the broken hair-fringe
sparkle on the trailing hem, masked and hashed, never a continuous rim.

### 2.4 Where the fire lives — **one ventral window + artery lines; the trailing edge never**

Adopted from F1 wholesale, with the doublet resolution: each vessel line is an artery+vein pair
(widths ~2:3). **The artery is the emissive member** (outbound furnace blood, 900–1100 °C
proximal → 650–800 °C at the tips, dying before 60% span); **the vein is the dark member** —
wider, cooler, and it *subtracts* from any transmitted glow. One geometry, both channels; cold
and backlit the pair reads as A2's dark doublet, lit it reads as F1's glowing vasculature with
its own built-in dark shadow line. Budget (fraction of one wing's projected area): **cruise
3–6% · power stroke ≤12% · ignition burst ≤15% for ≤0.8 s · clipped white ≤1% always.**
Recruitment is root-first, tip-last, in authored states — windows switch with hard borders, they
do not fade. The window is **ventral-only**: at cruise the chase camera sees a black wing; banks
and upstrokes flash the furnace. What stays dark, permanently: the whole dorsal face at cruise,
the entire distal third, and the trailing edge — the coldest tissue on a real wing, whose only
job here is to **shed embers**.

### 2.5 The fold — **per-finger furl, ≤ 0.55× span, bays closing as overlapping lobes**

No shipped hero folds (0.838 / 0.932 / 0.986 span contraction against the house 0.7× law); the
only passing folds (azure 0.475, ember 0.429) ride bespoke furl arrays. A membrane cannot pleat
(A1: it shrinks/retracts) and per-strut pivots on a **welded** skin tear it (FLAP-DESIGN §2).
Resolution: the membrane is built as **per-bay lobes with a hidden ~8–10% overlap** riding each
finger's dark side — welded-looking when spread, and a fan that genuinely closes finger-over-
finger in the fold via a published per-finger furl array (`wingBladePivots`-pattern, the proven
azure/jade branch). In flight the fingers hold the fan (no per-strut flutter); the furl array
fires only for fold/ground/acting states. Fold choreography in §8.3. This is the one deliberate
engineering risk in the spec, accepted because the fold is the roster's largest unclaimed
opportunity; the shard-stacking failure it risks is Tempest's existing defect, and §5.4 carries
the three mitigations.

### 2.6 Edge-on 40% of the time — **the wing must be designed as a polyline first**

What carries the read when the wing is a line, in order of screen time:

1. **The leading-edge polyline** — five knuckle landmarks with shrinking outboard gaps, the
   "‹" flare (forward at the wrist, hooked back to the tip), the carpal claw-cluster bump at
   mid-span, bone-weight and continuous. This is the always-on craft.
2. **Spar depth** — the humerus at ~1/8 of local chord is a visible tapered mast in pure
   profile; two taper regimes (near-parallel inboard, whip outboard) read edge-on.
3. **The trailing polyline** — scalloped bays + the dark hem widening tipward + the broken
   bright fringe outside it: three bands in 3 px, legible at every angle, ember spawn at the
   scallop tips.
4. **The grazing flare** — the ε(θ) law brightens the ventral window exactly when the wing
   approaches edge-on; the beat's accent lands at recovery, anti-phase L/R in a bank.
5. **The wrist dogleg** — `tipApexSweep ≥ 0.26` in-plane sweep at the apex (the depth-projection
   fix), plus deep `tipLag` so the hand visibly trails.

A1's "desynchronise the two wings" is **overruled** where it means phase: FLAP LAW 5 (banking is
pose bias, never an L/R phase delay) and `wingsymprobe Δ0.000` stand. Asymmetry is delivered in
geometry seed (±4% bay widths, jitter) and weathering history (§7.4), never in the rig.

---

## §3 Landmarks — the decided table

`t` = fraction of the semi-span measured from the **body midline**. Semi-span `hs` is NOT a
prescribed dial number: **the contract is the measured outcome** — glide `spanX / bodyZ` ∈
**1.10–1.20** at the apex form, asserted in the landmark dump (the Tempest, the bar, measures
1.18; the 56%-size lesson is law; kill #63's hard floor stays at 1.0). `hs` is the builder's
lever, scaled **uniformly** (span and chord together, so AR holds ≈ 8–9). On a Tempest-class
body this lands near `spanScale · 5.9–6.1`. *(Amended Round 1: the original `4.2` was a dial
number masquerading as a measurement — the shipped heroes' `halfSpan` dial is not their true
world semi-span — and it measured span/body 0.79 on the test body, failing this spec's own
kill #63. Builder-caught, Director-owned.)*

| t | Landmark | Notes |
|---|---|---|
| 0.000 | body midline | |
| **0.090** | shoulder / glenoid | inside the muscular root fairing, §9 |
| **0.280** | **elbow** | included angle ≈ 150° at full spread — the arm NEVER reads straight while the propatagium exists; gull-arch peak region |
| **0.500** | **wrist / carpal apex** | forward-most point of the "‹"; carpal claw-cluster here; spar taper regime break; fan origin |
| **0.680** | MCP knuckle, digit III | dominant finger's first joint |
| **0.830** | PIP knuckle, digit III | note ph2 (0.83→1.00, 0.17) **longer** than ph1 (0.68→0.83, 0.15) — the long–short–long rhythm; a monotonic taper inside the finger is ruled out |
| **1.000** | fingertip, digit III | span is pinned here; one small back-curved tip hook (≤0.06·hs), heraldic |

Gap rhythm root→tip: **0.09 · 0.19 · 0.22 · 0.18 · 0.15 · 0.17** — the forearm is the longest
gap; two joints live outboard of ⅔ span; never evenly spaced.

**The fan** (origins clustered at the wrist; metacarpals near-equal — the fan opens at the
knuckles, not in the palm):

| Digit | Length (× digit III spar run) | Fan angle off the LE direction | Droop (rad) |
|---|---|---|---|
| III (dominant, leading) | 1.00 | 0° (it IS the LE outboard of the wrist) | 0.05 |
| IV | 0.84 | 24° | 0.13 |
| V | 0.68 | 43° | 0.22 |
| VI (trailing) | 0.50 | 61° | 0.32 |
| carpal cluster (thumb + 2 stubs) | 0.18–0.22 | forward-and-DOWN, opposed to the swept fingers | — |

±3° deterministic per-side azimuth jitter on IV–VI. Claws: the carpal thumb only, plus the one
digit-III tip hook. **Zero claws on trailing fingers, zero bare bone past the hem.**

**Leading-edge shape:** gull ARCH in Y peaking near the wrist; swan-neck OGEE in Z
(root → elbow forward → wrist apex forward-most at ≈ −0.11·hs, then digit III sweeps back to the
tip). In plan it is a "‹", never a monotone backsweep.

---

## §4 Skeleton / spar spec

**Two taper regimes, break at the wrist. The bone is a pipe.** (K = 0.90 flyer build — this is a
racing rideable, not a brawler; keep it consistent everywhere.)

| Station (t) | 0.09 shoulder | 0.28 elbow | 0.50 wrist | 0.77 mid-finger | 0.92 near tip |
|---|---|---|---|---|---|
| Diameter ÷ root diameter | **1.00** | **0.86** | **0.62** | **0.33** | **0.15** |
| Diameter ÷ local chord | **12.8%** | 11.2% | 8.9% | 6.3% | 4.4% |

- **Humerus = a mast, not a bone**: length ≈ 0.19·hs, slenderness ≈ **4.25 : 1**. If it reads
  slender (>6:1), it is a scaled-up bat and fails. Root diameter anchor: **0.14 × root chord**.
- **Inner half barely tapers; outer half is a whip.** A straight cone root→tip is ruled out.
- **Where cracked or backlit, the spar reads as a TUBE** — bright rim, glowing or dark core —
  never a solid rod (81% of the section is cavity). Crack windows: **2 master seams only**
  (dorsal humerus channel + elbow knuckle), T-junction dominant, ≤15% Y-junctions, hot core
  clipping per §7 physics; 6–10 short G2 plate boundaries; G3 capillaries appear only at
  ignition. This is the withheld component glow, socketed where the physics puts the heat.
- **Knuckle thickenings + short raised ridges at shoulder/elbow/wrist** (the high-moment
  stations) — the visible answer to thin-wall bracing.
- Joints as **bumps in the outline** at elbow, wrist, every MCP: the hosepipe arm is ruled out.
- Bone surface: charcoal-basalt base with **ash-grey dusting on up-facing faces** (§7.3) and
  temper-colour rings around the hot roots (§7.4). Not ivory — Revenant owns ivory.

---

## §5 Planform and membrane bays

### 5.1 Planform

- **AR ≈ 8** for the full wing pair (flapper/soarer boundary — legitimises both beats and
  holds). D2's loads verdict is binding: this is a **high-wing-loading wing — comparatively
  narrow, taut, engineered**; the broad soft flying-fox planform is ruled out at this mass.
- Widest chord **inboard**; the plagiopatagium is the largest single surface.
- Area shares (one wing): **propatagium ~7% · armwing ~50% · handwing ~43%.** The inboard bay is
  ≈ 2× the width of any finger bay. Equal bays = plane wing = automatic loss.
  *(Amended Round 2: the shares are **VISUAL** shares of the presented wing. Ownership splits the
  armwing into **wing-side ≥ ~38%** plus a **body-frame flank skirt ≤ ~14%** — the kill-#65
  anchoring — overlapped by ≥ 0.15 c with no shared silhouette edge. The skirt is silhouette,
  never flap. I4's fold obligations, explicit: the folded wing drapes OVER the skirt, the
  ≥ 0.15 c overlap holds in the folded pose, zero interpenetration, and no bald flank at any
  point of the fold arc — the skirt is the flank's permanent cover, the folded wing is the cloak
  on top of it. Consequence: the moving wing is majority handwing (~53% of wing-side area),
  which is what makes the ≤ 0.55× fold reachable through elbow + wrist + furl.)*
- Tip: **swept and pointed** (the fast read — this is a racing dragon). Committed; no blunt
  lozenge averaging.

### 5.2 The propatagium (the sail nobody ships)

Shoulder → wrist, **forward of the arm**, depth **0.20 × local chord at the elbow** (DIRECTED
inside D1's derived 0.15–0.25 band). A real cambered triangular sail with its own taut/slack
states — crisp and hero-lit (it is the most lift-efficient surface on the wing), against the
softer plagiopatagium behind it. The cephalic artery+vein doublet runs inside it along (not on)
the leading edge, terminating at the carpal cluster. The elbow's ~150° spread angle keeps its
bulge visible; at the fold it slackens and its wrinkle field blooms.

### 5.3 Camber and sag

- Cruise sag: **0.08c inboard bay, 0.045c outer bays**; flare/climb states up to **0.14c**.
- Sag nadir at **40% chord from the LE** — never mid-chord, never the trailing edge.
- Cup is **VENTRAL** (cup-down), pulled toward the knuckle; every trailing arc sampled at
  ≥ 5 segments (NSEG ≥ 10 per bay) — 2-segment arcs sawtooth.
- **Inboard soft, outboard tight** (the anisotropy law): the plagiopatagium is the sagging,
  stretching sheet; the finger bays are drum-taut. A drum-tight inner sheet with flapping outer
  bays is exactly inverted and ruled out.

### 5.4 Bay construction (the fold-bearing decision)

Bays are **per-finger lobes** welded to their own finger's spar samples (never to fingertips),
overlapping the neighbouring bay by **8–10%** under the spar's dark side. Mitigations against
the Tempest shard-plate read, all three mandatory: (1) overlap hidden in the spar shadow line
with the seam edge running along the finger, (2) value tiers continue **across** the seam so no
value step marks it, (3) in every flight pose the furl array is identically zero — probe-
assertable — so the spread wing is one continuous skin to the eye. Membrane trailing edge
scallop depth 0.22–0.30 of bay width.

### 5.5 Value tiers (front-lit)

Per bay, **4 tiers banded by billow depth** (taut-near-spar lightest → deep cup darkest) with
index-hash jitter; palette aimed so the tiers span ≥ 3× luminance under the GAME light
(verified on the sky backdrop — the Revenant 52%-pale lesson applies: author albedo,
roughness ≈ 0.38, envMapIntensity ≤ 0.06 **together**, then measure at the money cam).
*(Amended Round 3: the original absolute window "0.05 → 0.15 luma" is withdrawn — it was the
Vesper `MEMBLUE` calibration carried into a warmer, darker wing as if it were a law, and it
conflicts with the darkest-element criterion on this article. Binding criteria: tier spread
≥ 3× lightest→darkest at the money cam on sky; the lightest tier below the lit bone-top mean;
≥ 3 bands countable at 2.2×, all four at 4× (a spar-hugging taut seam counts as a tier if it
reads as a BAND at 4×); membrane:bone < 1 front-lit. Measured R3: 3.65× authored / 4.73×
quartile, 0.435 front-lit — passes. Builder-caught, Director-owned.)*
Front-lit the membrane is **the darkest element on the dragon** (albedo 3–7%: warm near-black
`#241a16`-class); the bones + ash read lighter. The bone↔membrane boundary carries the wing's
whole contrast budget, in both light regimes; the membrane is never tinted up toward bone value.

---

## §6 Surface & shading spec (the formulas)

### 6.1 The thickness attribute — the load-bearing float

`aMemThick` per membrane vertex, mapped to `d_geo ∈ [0.30, 3.60]` (nominal 0.90), authored
procedurally as `max` of: root-gusset falloff (→3.6) · spar proximity (→3.0 within one spar
radius) · cup depth (deep sag = long path →1.8) · the hem band (1.0→2.5 ramping tipward) —
then **multiplied** by the cord/vein modulation (§6.4). The (span, chord) UV comes free from the
procedural build and is required.

### 6.2 The one term (from §2.3)

Implemented as `composeSurface` patches on `wingMat` at the existing seams in
`dragonSurfaceShader.js` (pars after `<common>`, body after `<emissivemap_fragment>`; all three
vectors — `normal`, `vViewPosition`, `directionalLights[0].direction` — are already view-space
there). σ_rgb ratio locked at **(1.00, 2.68, 5.41)·σ0**, σ0 tuned once so nominal thickness
transmits ≈ 0.15 luminance. `uMemTint` stays near white — the exponential IS the colour ramp:

| d (× nominal) | backlit reads | hex |
|---|---|---|
| 0.5 (taut inter-digital stretch, propatagium) | pale amber — the brightest membrane | `#D19554` |
| 1.0 (main field) | ember orange | `#AB5415` |
| 2.0 (deep cup, hem) | blood red | `#711600` |
| 4.0 (root gusset, over-bone) | near-black | `#2E0000` |

Hue rotates toward red and saturation RISES with thickness. The deepest cup is the **darkest**
transmitted tier, not the brightest. Over-bone the sheet is a **hard-edged black silhouette**
inside the glow (diffusion length is millimetres — sub-pixel at dragon scale; any soft halo
around a bone shrinks the dragon to bat size).

Emission side: `κ` tuned so an active window sits at **0.15 of full emission face-on, 0.9 at
8° grazing**; `heatMask` = the F1 zone map (window + artery lines, ventral), zero in zone C —
a cold wing never edge-glows anywhere.

Backlit ↔ front-lit, the membrane : bone displayed ratio swings ≈ 0.35 → ≈ 3.3 — **that
polarity flip is the wing's drama and it must fall out of the shader on every bank.** Cost
budget ≈ 20 ALU, zero textures beyond §6.4's one DataTexture, zero extra passes. The machine
judge measures it on the mobile profile.

### 6.3 What the Fresnel is still for

The old `pow(1−|N·V|, k)` survives only as the **fringe term**: masked to the trailing hem band,
broken by a deterministic span hash (duty ≤ 60%), so it reads as hair-sparkle outside the dark
hem — never a continuous rim anywhere. Chrome outline = automatic loss.

### 6.4 Cords, veins, wrinkles — carriers

- **Cord field**: rasterised at build into one **256×256 R8 DataTexture** (generated, DOM-free —
  never CanvasTexture) multiplying `d_geo`. Spacing at full density = 1/75 of local chord;
  density 0 inboard of t≈0.30, ramping to full by t≈0.65; direction perpendicular-to-arm
  proximally rotating to parallel-to-finger distally. The **8–10 largest "master cords" per
  outer bay** are real relief geometry so they catch the grazing sheen and scallop the TE with
  fine cord-end teeth.
- **Vein doublets**: generated Murray tree — taper **0.794** per bifurcation, 4 visible orders,
  asymmetric forks (**main continues ~24° at 90% width; branch leaves ~52° at 65%**), drawn as
  pairs (vein ~1.5× artery width, offset one width). Trunk orders baked into `aMemThick`;
  orders 3–4 into the DataTexture; artery centreline additionally into the `heatMask`.
  Symmetric Y-forks and single unpaired lines are ruled out.
- **Wrinkle field**: spanwise striations, **8–14 per bay** (DIRECTED — fine and many; wavelength
  is a size cue and coarse waves shrink the dragon), as a `d` modulation
  `d *= 1 + uWrinkleAmp · slack · sin(spanUV · freq)`, faded by `fwidth()`. Amplitude is a
  **tension read-out**: → 0 at the loaded bottom of the downstroke, blooms at the slack top.
  Chordwise accordion creases are ruled out everywhere, including the fold.

### 6.5 The edge (3 px of law)

| Band | Treatment |
|---|---|
| Leading edge | continuous, bone-valued, knuckled; NEVER rippled, NEVER emissive-rimmed |
| Trailing hem | a **dark cord**, one edge loop, width ramping ×2.5 tipward; backlit it is the darkest line on the wing |
| Fringe | outboard of the hem: broken bright hair-sparkle (§6.3), the only legitimate bright edge pixels |

Membrane shows **zero slab thickness** at the edge — all thickness lives in the spars and the hem.

---

## §7 Fire spec

### 7.1 Zones (F1's map, decided)

| Zone | Where | Shape | Temp band | Share of one wing |
|---|---|---|---|---|
| **A — forge window** | proximal **VENTRAL** plagiopatagium triangle (humerus–body wall–first spar) | ONE crisp pane, border = an abrupt skip, never feathered | authored 1200–1300 °C, core clips to white | 2–4% |
| **B — arteries** | doublets radiating from A: cephalic line inside the propatagium; spar-adjacent lines (beside, never ON, the bones); all **terminating before t = 0.60** | branching lines that terminate; never loops; never a rim | 900–1100 °C → 650–800 °C at tips | 1–3% |
| **C — everything else** | whole dorsal face at cruise · entire distal third · trailing edge | no emission ever | — | **93–97%** |

States (borders stay hard in all of them): **cold/glide ≤0.5% · cruise 3–6% · power ≤12%
(2–4 secondary mid-panel windows open) · ignition ≤15% for ≤0.8 s (outer membrane briefly
recruits).** Recruitment order root-first, tip-last; the tip goes dark first.
*(Amended R4 — the cold state: the window is **OFF, or a single residual core-coal** — one
hard-bordered patch ≤0.3% of wing area at the pane's thickest point, centroid-biased,
asymmetric by seed, reading as the last coal in a banked furnace; at most 1–2 faint artery
stubs ≤0.1% directly adjacent. **Never a rim, never a ring, never a line tracing the window
border** — a border is an edge between two lit-and-dark fields; with the interior dark there
is no border to draw, and drawing one is an outline (kill #68). F1 B6's "dim rim only, core
dark" is overruled by this clause; the toucan law's OFF-below-threshold backs it. Builder
flagged, Director ruled.)* Clipped white
≤1% of wing area at all times. Map states onto the shipped contract: window + artery mats go in
**`flareMats`** (Surge flare, no warm cruise rim); bones in `spineMats`; `wingMat` is the
membrane. Emissive hues obey §7-canon: **R ≥ G ≥ B strictly, hue monotonic outward, saturation
peaks one step down from the brightest pixel; author the emitter deep-orange at 6–20× exposure
and let ACES clip the core — never author white.**

### 7.2 Rhythms (three, incommensurate — the anti-metronome)

| Rhythm | Rate | Behaviour |
|---|---|---|
| artery throb | 0.4–0.6 Hz | idle only; **damps to steady-and-brighter under load** (flow suppresses vasomotion — the counter-intuitive sourced tell) |
| flap | ~1.2 Hz | the beat |
| window flicker | 2–3 Hz | plume puffing over zone A |

Never lock any of them to another. A glow pulsing in flap time is ruled out.

### 7.3 Ash — the cheapest light in the design

Char runs linear **0.0035–0.041**, ash **0.049–0.354** — a 10–100× value structure with zero
emissive pixels. Ash goes where ash settles: **up-facing dorsal faces, windward spar sides,
concave pockets between fingers, the wrist gusset**. This is what keeps the wing readable in
flat daylight and is the direct answer to flat-black poverty. Never a uniform grey wash.
*(Amended R4 — ash TERRITORY: the **skeleton and body-frame pieces only** — bone/keratin
up-faces, windward spar sides, the knuckle-root pockets between finger ORIGINS, the wrist
gusset, the skirt's upper hem. **Never on the membrane bays.** F1's "concave pockets between
fingers", written for a generic wing, collides on this article with the §5.5 darkest-element
law — and the value hierarchy wins, because the membrane's dark IS the wing's legibility
spine (the bone↔membrane boundary carries the whole contrast budget, and the dark tiers buy
the 11.5× backlit inversion). Ash is a means; the value structure is the end. Builder-caught,
Director-ratified.)* The
cool chromatic complement (Turner's leaden blues) lives in the ash + blued temper steel on the
SKELETON; the membrane's dark stays warm — the complement pair exists between systems.

### 7.4 Temper rings + history

Outward from every hot crack on bone: **grey-black → blue → violet → red-brown → golden →
bare** (low-value tints, never emitters — the only legal blue on this creature). Inner spars sit
further along the series than outer ones (they have been hot longest); L and R differ by seed.
Weathering asymmetry is free and mandatory; rig symmetry stays Δ0.000.

### 7.5 Embers

Spawn at the **thin** structures — trailing scallop tips and fingertips, never the hot root.
Rods ~1×4 px at 10–13:1, aligned to airflow; two-tone along the rod (windward amber → lee deep
red); **brighten ~+25% through the first 15% of life** (the slipstream fans them), then decay
amber → orange → deep red → out. Budget inside the global cap: cruise 24–40, burst 90–140,
hard cap 160. Round dots that fade monotonically are ruled out.

---

## §8 Motion spec

### 8.1 Flap (the shared 3-segment rig, `wingParts: 3`)

Reference dial set (distinct from all three heroes — photocopied motion is a defect):

```
rootAmp 0.78 · apexRoot 0.26 · midAmp 0.30 · tipAmp 0.72
midLag 0.90 · tipLag 1.90 · glidePow 1.25 · restLift 0.04
apexMid 0.08 · apexTip 0.14 · tipApexSweep 0.28 · apexPitch 0.06
```

- Shoulder owns 75–85% of the swept arc; each distal segment strictly less. Distal ≥ proximal is
  the broken-linkage tell.
- `tipLag 1.9` deep enough that the hand's sign FLIPS vs the forearm between top and bottom —
  verified with the pure-math per-segment dump before any render.
- `tipApexSweep 0.28`: the in-plane apex dogleg (the depth-projection law — craft that projects
  into depth is craft the player never sees).
- `apexPitch 0.06`: the dial no dragon uses — a slight nose-down hand pitch at the apex, the
  upstroke-supination hint. Our free motion signature; keep it subtle.
- Banking = pose bias only. Cruise beat ≈ 1.2 Hz (0.9–1.5 band). A 750 kg-class creature
  beating at 0.3 Hz reads as falling; at 8 Hz as a sparrow. Both ruled out.
- −anchor wrist (`tip.position=+K`, `hand.position=−K`) and the outer `scale.x=−1` LEFT wrapper,
  copied verbatim. `wingsymprobe Δ0.000` is a gate. *(Amended R5: the Δ0.000 gate binds the
  **RIG channel** — named joint nodes, decoration-free — with no exemptions ever. The
  **vertex-cloud channel** carries the §7.4-mandated seeded L/R weathering and is exempt from
  Δ0.000: bounded ≤ 0.03 worst, every unit attributable to an enumerated seeded system
  (slots, temper series, saw teeth, hem hash), both numbers reported separately, permanently.
  Cloud > 0.03 or rig > 0.000 is a real failure; a cloud number under the bound is the spec
  working, not a regression. Ruling in the R5 log.)*

### 8.2 The surface through the beat (one scalar drives everything)

`slack(t) = 0.5 − 0.5·sin(phase − 1.6)` — the membrane's own state, lagging the rig ≈ 90°:

| Beat point | Surface |
|---|---|
| bottom of downstroke (slack≈0) | drum-taut: one clean arch per bay, wrinkles pulled flat, ripples suppressed, specular tight |
| mid-stroke | long marginal ripples, λ ≈ 1 chord, node mid-chord |
| top of upstroke (slack≈1) | slack: wrinkle field blooms, billow washes AFT, highlight fragments; the ventral window rolls into view and grazing-flares |

Ripple is **shader-domain** (normal/`d` modulation, one arch per bay anchored at the spars, 4–16
Hz), never vertex-rig; a continuous wave across the whole span and a beat-constant ripple are
both ruled out.

### 8.3 The fold (the event)

Target: **folded span ≤ 0.55× glide span**, probe-asserted. Choreography over the transition:

1. Elbow flexes toward ~55° included — the wrist pulls inboard to t ≈ 0.38 (span visibly
   SHORTENS first; a fold that thins before it shortens is ruled out).
2. Wrist folds the hand back ~130° in-plane and supinates ~35°.
3. Fingers furl in sequence trailing-first, **digit III folding over the stack last**; bays
   slide into overlap, the outline losing one scallop at a time (a fan closing, never a curtain
   pleating).
4. Tip lands at/behind the hip, low near the knee line; the membrane drapes down around the
   flank like a cloak. The tidy over-the-back bird fold is ruled out.
5. The propatagium slackens; its wrinkle field blooms; the window dims to its cold state
   (the banked-coal state of §7.1 R4 — never a ring).

Engineering: per-finger furl array published; fold clause added to **both** `wingDebugPose.js`
and `dragon.js` (the ~20-line azure/jade pattern). Acting silhouettes reachable from the same
array with zero new mechanics: **tuck, cape-drape, display spread, mantle** — plus ground
contact through the carpal cluster (the membrane never touches the ground).

---

## §9 Root and body junction

- **Overlap, never weld**: a scapular cowl plate riding the body frame over the humeral head
  (static through the flap), over a **muscular root fairing** continuous with the flank — the
  one root element that may deform with the stroke (it is muscle, sourced in both lineages).
- The plagiopatagium anchors on a **raised flank line running to the hip/upper-thigh**, far down
  the body (the praised Night-Fury trait) — NOT the ankle (rideable legs stay free), NOT the
  spine (the rider sits there). Membrane vertices near the body live on the wing group with the
  inboard edge near the pivot (short lever) — the shipped anti-shard law.
- Flight muscle reads in the TORSO (bird-grade chest), never as biceps on the wing arm.
- The scale→membrane transition is a **graded vermilion band** (~0.06·hs wide): plates shrink →
  stop overlapping → become isolated domes while transmission ramps in and the band warms
  (blood blush). No hard scale/skin line anywhere. The band is hairless and sheenless.
- One organized **covert row** (8–10, decaying sizes) along the dorsal arm, terminating at the
  wrist cluster — a rank with a terminus, not confetti.

---

## §10 Damage (history, priced)

- **2 healed trailing-edge notches** per wing at seed-asymmetric positions + **1 healed mid-bay
  puncture** (framed by intact membrane, away from spars): scar tissue reads **stiffer and
  lighter**, with a local wrinkle-field discontinuity.
- Every tear is **blunt-ended and stops at a cord line** — the single detail that proves the
  fibre net exists. No tear crosses a bay or reaches a spar.
- Zero fresh/open decorative shredding; the leading edge carries no damage (LE damage = a
  crippled animal — boss-tier storytelling, not this wing).

---

## §11 Budget and engineering

| Item | Number |
|---|---|
| Triangles, wing PAIR | **target ≤ 3,000; hard ceiling 4,000** (whole-dragon 6,000/form via `tricount --ci`) |
| Allocation guide | bays + ventral window overlay 1,100 · spars/knuckles/claws 800 · propatagium 180 · hem+fringe 250 · cowl/fairing 300 · coverts+transition 250 · slack 120 |
| Draw calls | ≤ 8 materials/wing via per-material accumulators into `flatTriMesh` (the Tempest batching pattern) |
| Spend triangles on | EDGES, articulation, the ventral overlay, NSEG ≥ 10 arcs — **never on a finer smooth grid** (tris buy smoothness; facets, tiers and light buy richness) |
| Shader | the §6 patches — ≈ 20 ALU estimated for the transmission term; **≈ 45 ALU as delivered** *(Amended R3: accepted provisionally — the third compose seam's specular remap killed a gate-blocking defect; the binding number is the measured frame on the mobile profile at the I4 COST gate, cut order in the R3 log: exp2 spherical-Gaussian swap → wrinkle-into-DataTexture → vein-order LOD)* — 1 R8 DataTexture (64 KB), no new passes, no `MeshPhysicalMaterial.transmission`, no grab-pass, no screen-space anything |
| Textures | procedural DataTexture only; a CanvasTexture in the build path breaks node tests |
| *(Amended R4)* The I4 freeze | Measured after I3: form **5,477** (91% of ceiling) · pair **3,156** (past the 3,000 target) · draws **32/pair** (26→32, wrong direction). Ruling: **I4 adds NET-ZERO triangles and consolidates draws before adding anything.** Hard lines at the I4 COST gate: form ≤ **5,600** · pair ≤ **3,200** · draws ≤ **20/pair** (the R1 ≤~10-per-wing discipline). Fire states are **uniform/mask switches on ≤2 emissive buckets per wing + 1 ember system — never per-state meshes.** Tri-cut order if the freeze breaks, in this sequence: (1) ignition capillary stubs → the DataTexture heatMask, (2) secondary-slot consolidation inside the R4 variety fix, (3) temper rings → vertex-colour bands on existing bone geometry. ALU cut order unchanged from R3. |

**Build order and gates** (each gate is a blind A/B vs the bar at matched wingshot angles;
re-openable):

| Increment | Contents | Gate |
|---|---|---|
| **I1** | skeleton, landmarks, planform, flat-tiered bays, hem, claw cluster, propatagium, cowl | SILHOUETTE (pure black), STRUCTURE |
| **I2** | thickness attr, tiers, cords, veins, transmission patch, wrinkle statics | MEMBRANE |
| **I3** | window, arteries, states, embers, ash + temper | FIRE |
| **I4** | flap dials, furl fold, slack-scalar binding, acting poses | MOTION, COST |

**Verify chain, in failure-class order:** `tricount` → `wingsymprobe <key>` (RIG Δ0.000 hard;
seeded-decoration cloud ≤ 0.03, reported separately — §8.1 R5 amendment) →
pure-math segment dump (hand sign flips; furl-zero in flight poses; fold ratio ≤ 0.55) →
`wingshot.mjs <key>` 4 sheets → `tiershots.mjs <key>` (always with a key — bare invocation
crashes). **Required harness addition:** a BACKLIT tile (sun behind the wing) in the detail
sheet — the membrane gate cannot be judged without it, and the polarity flip is a pass
criterion. Geometry numbers beat critic pixels; when they disagree, re-shoot on a clean stage.

**Probe law (added R2):** no probe verdict counts until the probe has demonstrably **FIRED on a
known-bad** article and **CLEARED a known-good** (the quad probe's aurumToro-fires /
tempest-revenant-vesper-clears control pair is the pattern). A probe that passes for the wrong
reason is worse than no probe — it launders a defect into a green number.

---

## §12 THE KILL-LIST

Consolidated, deduplicated, from all six `## What this rules out` sections + §4/§7 canon.
**Any one of these visible in a render is an automatic LOSS at its gate, regardless of
everything else.** Phrased so a critic can point at pixels.

**Proportion & skeleton**
1. Wrist inboard of t ≈ 0.4 with a hand ≥ 70% of the span — a hand on a stick (unless the
   silhouette gate itself forces the wristT fallback, §2.1).
2. Evenly spaced leading-edge knuckles; a quiet outboard span (the tip is the busy end).
3. Finger segments shortening monotonically — ph2 must out-run ph1.
4. A splayed fan-palm — metacarpals visibly unequal; the fan must open at the knuckles.
5. A humerus slenderer than ~6:1, or a spar thinner than ~1/12 of local chord at the shoulder.
6. A linearly tapered spar (fat cone → needle); the real law is flat-then-whip with the break
   at the wrist.
7. A solid-looking bone where light passes — the spar is a tube: rim + core.
8. A hosepipe arm — no elbow/wrist/MCP bumps in the outline.
9. Muscle bulging on the wing arm while the chest stays slim.
10. A straight shoulder–elbow–wrist line while the propatagium exists.

**Silhouette & planform**
11. The plane wing: straight LE + straight TE + equal flat bays.
12. A monotonic aft-swept LE — the "‹" flare-forward-then-hook is mandatory.
13. Equal-width membrane bays; inboard must be ≈ 2× any outboard bay.
14. A missing propatagium — a bare bone with nothing forward of it (the amateur signature).
15. A propatagium drawn as 2-px piping — it is a sail at ~0.20 chord depth.
16. Claws on every spar tip; bare finger bone past the hem anywhere but thumb + the one tip hook.
17. A human hand at the wrist (long thumb at the palm).
18. A wing welded flush into the flank — hard socket seam, no fairing, no cowl overlap.
19. A spike forest as the primary decoration; membrane area and pattern scale win, spikes lose.
20. A blunt unresolved tip — commit to swept-pointed.

**Membrane surface**
21. A membrane brighter than its own bones in front light (albedo is 3–7%; the sheet is the
    darkest thing on the dragon).
22. Leather-tarp: uniform opaque matte brown-black, roughness ≈ 0.9, no transmission state.
23. A perfectly smooth membrane — no wrinkle field, no cords, no fibre anisotropy at 12 m scale.
24. Cords/wrinkles/veins running CHORDWISE as the dominant direction — everything runs spanwise.
25. A uniform grid or diamond crosshatch — fibre families are unequal and territory-dependent
    (none inboard, dense outboard, rotating orientation).
26. Chordwise ballooning between fingers — the sheet is 10× stiffer chordwise; it stretches
    along the span and sags across the chord.
27. A drum-tight inner sheet with floppy outer bays — exactly inverted.
28. Visible slab thickness at the trailing edge.
29. Static surface detail — wrinkles identical at both stroke extremes are a printed decal.
30. An even scatter of white flecks/coverts — confetti; ranks have order and a terminus.
31. A hard straight line where scales stop and membrane starts.

**Shading & translucency**
32. A membrane that glows the same with the sun in front and behind — the view-only Fresnel
    (what the repo ships today).
33. A continuous bright outline anywhere — chrome. The trailing edge is a DARK hem with broken
    fringe sparkle outside it; the LE is bone-valued structure.
34. Glowing veins under backlight — veins subtract; the artery member may emit only in fire
    states.
35. A single unpaired vessel line, or symmetric Y-fork vein trees with no taper.
36. A soft glowing halo bleeding around wing bones inside the glow — bone shadows are
    razor-edged at this scale; softness shrinks the dragon to a bat.
37. The deepest cup rendered as the brightest backlit tier — deepest = darkest.
38. A pale desaturated pink backlit read — thickness saturates toward red; pale amber only on
    the thinnest stretch.
39. `MeshPhysicalMaterial.transmission`, screen-space SSS, grab-pass shimmer — all
    disqualified on the mobile profile.
40. Texture-map authoring — everything is per-vertex + one generated DataTexture.

**Fire**
41. A glowing trailing edge, rim, or outline — the TE is the coldest tissue on the animal; an
    edge-lit wing is thermally backwards and the #1 cheap fire-dragon tell.
42. A membrane glowing evenly root→tip — a lampshade, not a radiator.
43. Soft-edged glow blobs fading into the sheet — window borders are an abrupt skip.
44. Tip lighting before root; symmetric dorsal+ventral glow (the radiator is ventral; the
    dorsal face at cruise is black).
45. Bright bars ON the bones — vessels run beside and between spars, in pairs.
46. Closed capillary loops — branches terminate.
47. More than 6% of a wing emissive at cruise / 15% ever / 1% clipped white ever; a
    permanently-on glow with nowhere to go when angry.
48. Any pixel with B > G in the thermal ramp; a blue- or white-authored core; hue rotating
    toward green anywhere; peak saturation at the brightest pixel.
49. Neutral single-value black char; ash as a uniform grey wash (ash sits up-facing, windward,
    concave).
50. Embers as round dots fading monotonically, or spawning from the hot root, or a glow pulsing
    in flap time.

**Motion**
51. A rigid plank flap (shoulder-only), or a glide-hold plank (`glidePow ≥ 1.9` with no apex
    lift); distal amplitude ≥ proximal.
52. A fold that contracts span < 30% — the non-event fold all three heroes ship. Ours must
    reach ≤ 0.55×.
53. Accordion pleats across the chord in the fold; a curtain instead of a closing fan.
54. The avian fold — tidy above the back, tip over the tail base.
55. An L/R phase offset for banking.
56. A membrane ripple running continuously across the whole span; ripple constant through the
    beat; wavelength much shorter than half a chord (shader shimmer) or 2–3 lazy waves
    (bird-sized read).
57. A fixed camber/area across speed states — flare and cruise must differ.
58. A hovering, slow-drifting, or walking-pace-landing shot — this wing's physics has a 74 km/h
    stall; it never floats.

**Damage & history**
59. Decorative shredding that costs nothing — symmetric ragged tears, flight unaffected; damage
    is healed (scarred, stiffer, lighter) or absent.
60. A tear crossing a bay or reaching a spar, or with a tapered wispy end — tears stop dead at
    cords, blunt.
61. A pristine membrane with zero history; mirror-identical L/R weathering.

**Process**
62. Judging the wing on a still — the frontal-fan and plank precedents both passed stills and
    failed motion; every gate includes the cycle strip.
63. A wing sized under the shipped premium bar (span/body < 1.0 at apex).
64. Craft that lives only on the membrane face — invisible 40% of the beat; every feature must
    state its edge-on read or accept it has none.

**Added in rounds** — the kill-list is live; each addition names the round that earned it.

65. *(R1)* A membrane vertex that must stay on the body, living in a group that rotates with
    the limb — the inboard-aft corner peels off the flank into a floating card during the beat
    (the shipped Revenant trap, reproduced in this lab at 0.77 u). Inboard membrane edges
    terminate near the pivot (short lever); flank coverage below that line is a **body-frame
    skirt** the wing membrane overlaps by ≥ 0.15 chord — overlap, never weld, never a shared
    silhouette edge.
66. *(R1)* Any free membrane edge that is machine-straight with square corners — **a rectangle
    in a silhouette**. Every free hem is a designed curve and carries the hem cord.
67. *(R2)* **A probe verdict with no negative control.** The quad probe's first run "passed"
    everything for four separate wrong reasons (Douglas–Peucker collapsing closed contours,
    antialiasing-speck seeding, angles measured against the frame, a node-walk one level too
    far blaming a tail fin). Until a checker has fired on a known-bad and cleared a known-good,
    its pass proves nothing — and the defect it launders becomes invisible to every later round.

68. *(R4)* **A closed emissive ring** — any state whose light traces a pane's border as a
    drawn line: a bright loop with a dark interior, at any scale. Windows are **filled panes
    or they are dark**; a border is an edge between a lit field and a dark field, and when the
    interior goes dark the border ceases to exist — drawing it anyway is an outline (the #33
    chrome tell in fire clothing, and #46's closed loop at window scale). The cold state is
    OFF or a core-coal, never an "O".

---

## §13 Directed gaps (honest register)

Where the research said `unknown` / `[no-assert]`, the value below is **DIRECTED** — my art
direction, changeable by me only, never silently:

| Gap | Directed value |
|---|---|
| Actinofibril/cord spacing | 20 mm-equivalent (1/75 chord), d/s ≈ 0.09 — inside D2's three-route derivation |
| Propatagium depth | 0.20 c at the elbow (from D1's `[D, wide]` 0.15–0.25) |
| Folded joint angles | §8.3's set (elbow ~55°, wrist ~130°+35° sup.) — from §4.6's `[no-assert]` starting pose |
| Elbow-extension ceiling | spread pose held at ~150° included; the 111.0° figure is single-source and convention-ambiguous — I take the visible law ("never straight, sail always bulged") not the number |
| Wrinkle wavelength | 8–14 striations per bay (only "10× denser than naive" is sourced) |
| κ (membrane emission coefficient) | tuned to 0.15 face-on / 0.9 at 8° grazing |
| Damage coverage | 2 healed notches + 1 scar per wing (no published fraction exists) |
| Membrane gloss | roughness 0.38 (sebum film is sourced; the gloss number is not) |
| Fold span ratio | ≤ 0.55× (house 0.7× law + azure/ember precedent band) |

The wristT decision (§2.1) rests on D1's search-grade chain; it is a **strong [D], not an [S]**,
which is exactly why the I1 silhouette gate is blind and the fallback lever is named.
