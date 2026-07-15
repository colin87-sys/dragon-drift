# EMBERFALL CALDERA — Biome Art Bible (Fable art director, Stage 1)

Biome index 3. Precedent: `SUNSET-GLACIER-BIBLE.md`. Governing docs: `BIOME-DESIGN.md`
(identity locked), `BIOME-OVERHAUL-PLAYBOOK.md` (pipeline + Part B mandate + engine
facts). This bible SUPERSEDES the older Caldera spec in `WALL-PROPS-REDESIGN.md` §4.3
(names reused, roles redefined — the playbook already flags this). The builder follows
THIS document.

---

## 0. WHAT THE RENDERS ACTUALLY SHOW (measured, 2026-07-15)

Sources: `/tmp/caldera-new-5300.png`, `/tmp/caldera-new-5600.png` (distant static),
`/tmp/cclose-a-3.png`, `/tmp/cclose-a-6.png` (close, moving, in-lane — the truth).

- **The atmosphere is already premium.** Lava-red water with a hot specular lane, ember
  sky with a glowing horizon band, god-ray streaks, rising embers, prop reflections.
  The air and the water are carrying 100% of the biome. Do not rebuild them; refine.
- **The skyline is a picket fence.** In `5600` the entire prop silhouette is a small
  clump of thin dark verticals — ONE outline family, dock-piling aspect ratios
  (measured on-screen ≈ 8–14:1 tall:wide). It reads as a burnt pier, not geology.
  This is the exact inverse of massive-first: ~90%+ of visible instances are TALLER
  than wide, against the law's ≥80% wider-than-tall.
- **The close shots confirm the machined read.** The `basalt` props are smooth tapered
  pentagon posts — no fracture, no stratification, no crown character (near-centered
  taper) — with a flat orange collar ring stuck on the foot: the LED-strip tell,
  literally a glowing band lying flush on a face (`mat:1` disc at y 0.14 in
  `environment.js`). The `vent` props are traffic cones with a lit cap. Nothing
  interpenetrates, nothing tells a geologic story.
- **There is no value ladder.** Verticals and undersides crush to a single near-black;
  the only value events on any prop are the collar ring and rim light. In a biome whose
  entire premise is light-from-below, the props' bellies are their DARKEST part —
  the theology is currently inverted on every prop in the biome.
- **The in-lane obstacles** (`cclose-a-6` foreground) are generic dark primitives —
  spiky tinted masses with zero volcanic vocabulary.

Conclusion: replace the entire prop + obstacle-skin layer. The sky, water, fog, embers
stay and get a refinement pass only (playbook C6).

---

## 1. THEOLOGY + EMOTION

**THE THEOLOGY SENTENCE (candidate CONFIRMED — it survives every derivation test):**

> **"The world is a black crust over a living fire — every light is the fire showing
> through a wound, and everything the fire touches RISES."**

Corollaries the builder designs by (each element must answer to one):

- **Mass is dark.** The crust is the fire's silence, not its absence. No luminous
  bodies. The primary material smolders at most; it never shines.
- **Light is a wound.** Every accent is fire escaping through a break — a crack, a
  torn joint, a sunken throat. If a light could be unscrewed and taken away, it is a
  lamp, and it is wrong.
- **Light lives LOW.** The closer to the lava floor, the more fire shows. **The glow
  altitude rule: the taller a form, the darker it is** — height means cooled, old,
  dead crust; the floor is where the world is still alive. (This single rule makes
  Caldera un-confusable with Mire, whose light HANGS overhead, and with Frozen,
  whose light fills the mass.)
- **Everything rises.** Embers, geysers, updrafts, ASHTALON. Static props express
  "rising" as geology: columns that grew upward, flows that pushed forward, cones
  that built themselves. Nothing droops, nothing hangs.

**Frozen's sentence, side by side** (the mandated comparison): *"cool light lives IN
the ice; warm light only ever comes FROM the sun."* Different subject (crust-over-fire
vs luminous ice), different light source (below/within-through-wounds vs the sun),
different verb (rises vs lives-in). No paraphrase. PASS.

**THE EMOTION TARGET: AWE** — the same target Frozen hit, by the same grammar and NO
shared forms: a FEW colossal, intact forms with negative space between them. Caldera's
awe flavor is *standing inside something alive and indifferent* — cathedral-scale dark
geology over a floor of fire. Restraint is the awe multiplier: the roster below ships
~250 instances (near Frozen's shipped ~208–300 discipline, far from the ossuary's
~500), and 4 of 6 archetypes carry NO glow at all so the two that do feel earned.

---

## 2. THE OPPOSITION (one line per axis — if any line stops being true, RETHINK)

**vs FROZEN REACH (the total inverse):**
- Light source: Frozen is lit from BEHIND by a low sun; Caldera is lit from BELOW by
  the floor itself.
- Mass: Frozen's mass IS the light (luminous ice); Caldera's mass is dark crust — its
  light exists only where the mass is broken.
- Value story: Frozen's crowns catch frost-light and its depths go teal; Caldera's
  crowns are its DARKEST stop and its bellies GLOW.
- Motion: Frozen is stillness (mirror water, near-suspended dust); Caldera RISES
  (embers up, geysers up, chop on the lava).
- Glow address: Frozen = mid-body crevasse-cleft slivers; Caldera = LOW basal cracks
  and sunken throats.
- Temperature/palette: gold-rose-cyan cold sunset vs ember-orange over ash-grey and
  near-black — zero shared hues, zero shared silhouettes.

**vs LUMEN MIRE (the Law-4 twin):**
- Caldera is VERTICAL / HOT / RISING where Mire is lateral / cool / hanging.
- Caldera's light comes from the FLOOR through wounds; Mire's light hangs ABOVE the
  lane under brims and canopies.
- Caldera's air climbs (embers, fall −2.2); Mire's air drifts sideways and dangles.

**Blind-screenshot test:** dark ribbed geology over glowing red water under an ember
sky vs Frozen's luminous monuments over a golden mirror vs Aurora's night sky-hero —
three different games. Enforced again at Gate 2 on real captures.

---

## 3. THE PROP ROSTER — six archetypes, six unrelated outline families

All derive from real volcanic landforms (Giant's Causeway / Svartifoss colonnades,
pahoehoe lobes, breadcrust surfaces, cinder/spatter cones, caldera rim walls) — which
are BROAD-FIRST by nature, so massive-first costs nothing. Constraints honored by
every entry: ≤150 tris; ≤2 materials (primary mass + optional accent); parts
interpenetrate ≥25%; zero transparent/additive surfaces; broken asymmetric crowns
(never a centered point); silhouette character via offset-stacking spread radially in
x AND z (recycle re-randomizes yaw — every archetype must survive any rotY); `place()`
always returns explicit `tilt`; steps prime and mutually coprime; every entry gets a
FOAM_CFG row (lava foam collars read as glowing shorelines) or explicit `false`;
`props` mirror in `biomes.js` entry 3 updated alongside. Lane floors derive from each
archetype's OWN measured ρ via `tools/propclearance.mjs` (widen its `SCOPE_BIOME` to
biome 3 in the kit PR) — the numbers below are design targets, the tool is authority.

Tri arithmetic used throughout: Cone(r,h,n)=3n, Cylinder=4n, Icosahedron(r,0)=20,
Box=12.

### 3.1 `colonnata` — THE HERO (colossal columnar-basalt palisade) — BUILD FIRST
- **Real landform:** columnar-jointed basalt colonnade (Giant's Causeway, Svartifoss)
  — packed hexagonal columns at stepped heights with collapsed sections.
- **Outline family:** vertically-RIBBED broad palisade with a descending stepped crest
  — reads as ranked organ pipes broken mid-song. (No other archetype is ribbed.)
- **Mass class:** 1.8–3:1 wide. World targets: width ~32–52u, height ~14–22u —
  colossal, always wider than tall.
- **Role:** HERO — the biome's signature silhouette, the dark cathedral mass the ember
  sky and lava mirror play against.
- **Accent policy: NONE.** The hero is pure dark mass — its "fire" is the value
  ladder's ember-lit belly stop plus its doubled reflection in the lava. This is the
  biome's thesis statement (dark-mass-over-glow) and the strongest possible
  anti-Frozen move (Frozen's hero carried the cyan core; Caldera's hero carries
  nothing). One material.
- **Step:** 37 (~48 instances/band — present but not wallpaper).
- Full build direction in §8.

### 3.2 `flowlobe` — THE LOW HORIZONTAL REST (pahoehoe tongue) — glow carrier 1 of 2
- **Real landform:** pahoehoe lava-flow lobe — a low, wide, ropey-crusted tongue of
  stacked plates with rounded lobed fronts, seams still glowing.
- **Outline family:** flat lobed tongue — rounded overlapping fronts, front-heavy,
  hugging the waterline. (Nothing else in the roster is horizontal-lobed.)
- **Mass class:** 4–8:1 wide. Width ~18–38u, height ~2.5–5u.
- **Role:** LOW horizontal REST — the flat dark stretch that makes the hero read
  colossal (the role terrace played for Frozen, wearing entirely different clothes:
  lobed and ropey, not stepped and shelf-like).
- **Accent policy:** the biome's floor-fire — a recessed ember-crack NETWORK glowing
  in the seams BETWEEN crust plates (accent geometry sits ≥ its own width below the
  plate tops, walled by primary mass on both sides — §5). Primary read is top-down
  (the flying game's main view): a dark tongue veined with fire. Honors the glow
  altitude rule: this is the lowest form, so it carries the most fire.
- **Step:** 23 (~78 instances — the common floor texture of the biome).
- Build sketch: 6–8 squashed offset-stacked plate masses (low n cylinders/boxes,
  ~90–120 tris) + one thin accent seam lattice recessed in the two largest plate
  joints; lobed front from 2–3 half-sunk rounded noses; interpenetration ≥30%
  everywhere; crown is n/a (it IS the floor) — the front edge is the broken profile:
  staggered lobe advances, never a straight line.

### 3.3 `fumarole` — MID MASS (fused cinder-cone cluster) — glow carrier 2 of 2
- **Real landform:** cinder/spatter cones — broad, squat, breached crater rims, fused
  in clusters.
- **Outline family:** fused conic mounds with breached rims — 2–3 overlapping squat
  cones, one rim torn open. (The only conic family in the roster.)
- **Mass class:** ~2–2.5:1 wide. Width ~14–26u, height ~6–11u.
- **Role:** MID mass, and the world's explanation of the geyser hazard — hazard vent
  sites and this family must read as kin (the biome explains its own danger).
- **Accent policy:** ONE sunken glowing throat per cluster — an ember pool recessed
  INSIDE the largest crater, below its rim: invisible in side view, a hot pool from
  above and on approach. The purest expression of the glow address.
- **Step:** 47 (~38 instances — punctuating, not carpeting).
- Build sketch: 3 cones (n=6, 18 tris each) fused at ≥30% overlap at differing
  heights + rim-breach wedge boxes + a recessed accent disc sunk ~35% of cone height
  below the main rim (~110 tris). Crowns are breached rims — asymmetric by
  construction, never a closed point (kill the traffic-cone read the old `vent` had).

### 3.4 `clinker` — THE BARE FOIL (aa rubble / breadcrust mound)
- **Real landform:** aa clinker field / breadcrust boulders — chaotic angular rubble,
  crusted plates, zero order.
- **Outline family:** chaotic angular jumble — no dominant direction, no ribs, no
  cones, no lobes. (The roster's only "noise" silhouette, used sparingly.)
- **Mass class:** ~1.5–2:1 wide. Width ~8–18u, height ~4–9u.
- **Role:** THE FOIL — carries NO glow, desaturated warm-dark, pure crust. It is the
  silence that makes flowlobe's veins and fumarole's throat feel earned, and the dark
  punctuation scattered across the lava-lit water.
- **Accent policy:** NONE. One material. Non-negotiable — if a build round adds glow
  here, the ration collapses.
- **Step:** 29 (~62 instances).
- Build sketch: 5–7 interpenetrating Icosahedron(r,0) chunks (20 tris each, ≤140) at
  varied non-uniform scales and yaws, ≥30% mutual burial, one oversized chunk
  overhanging as the off-center high point.

### 3.5 `riftwall` — THE DISTANT MASSIF (caldera rim escarpment)
- **Real landform:** caldera rim wall — a long, dark, flat-topped escarpment with
  colonnade banding partway up its face.
- **Outline family:** long horizontal-banded flat-topped wall sinking into the far
  fog. (Distinguished from colonnata by axis: riftwall's banding is HORIZONTAL strata
  read at distance; colonnata is vertically ribbed and near.)
- **Mass class:** 5–7:1 wide. Width ~110–170u, height ~18–28u. Backdrop class:
  x coupled to its own measured ρ (the glacierwall lesson: measure ρ, couple
  `x = floor + ρ·r`, verify with propclearance — derive Caldera's own floor, do not
  copy Frozen's 26 + 1.01·r).
- **Role:** distant MASSIF — the wall that makes the caldera a PLACE (you are inside
  something). Rides the height-fog; dual-fog melts it to scorched dark.
- **Accent policy:** NONE. The playbook's earlier "glowing fissure high on its face"
  is OVERRULED by this bible — a high fissure violates both the glow address (LOW)
  and the glow altitude rule. The rim is the oldest, coldest crust in the biome; it
  is dark. If a horizon light event is ever wanted, it belongs to the SKY (deferred
  eruption-pulse xMix, playbook C6), not to a prop face.
- **Step:** 89 (~20 instances). `foam:false` (fog-line massif — a bright collar 30+
  off-lane is an artifact).
- Build sketch: 4–6 long low offset-stacked slabs (boxes + 5-sided cylinders,
  ~80–110 tris), stepped skyline with one notch and one proud shoulder, no repeating
  module (vary every slab length so no coursing).

### 3.6 `riftfang` — THE RARE TALL PUNCTUATION (volcanic neck)
- **Real landform:** volcanic neck / spatter spire — the eroded throat of a dead
  vent, standing alone.
- **Outline family:** single leaning tapered monolith rising from a broad skirt.
  (The roster's ONLY tall form — this is what makes it a landmark.)
- **Mass class:** the sanctioned exception: height ~26–40u with a broad basal skirt
  spanning ≥55% of total height (Matterhorn law — it grows from mass, it is not a
  picket). At step 149 (~12 instances) it is ≤5% of the biome's instances, keeping
  the ≥80% wider-than-tall statistic intact (roster projection: ~95%).
- **Role:** rare tall PUNCTUATION. NOT a paired gate — a paired lane-framing form is
  Frozen's sun-gate vocabulary and is banned here by Part B. The fang stands alone,
  off-lane, a thing ASHTALON might perch on.
- **Accent policy:** NONE. Tallest form = darkest form (glow altitude rule). Its
  drama is silhouette against the lit horizon band — exactly ASHTALON's own read.
- **Step:** 149.
- Build sketch: broad skirt pan + 3–4 offset-stacked tapering prisms (lean built by
  progressive x/z offsets per segment, never internal tilt — the (r,h,r) shear rule)
  + a two-jag broken crown at opposing offsets (~100–130 tris).

**Roster statistics:** steps {37, 23, 47, 29, 89, 149} — all prime, mutually coprime.
Projected instances/band ≈ 48+78+38+62+20+12 ≈ 258 (restraint discipline; envcount
caps 550/50k with the Frozen+Caldera adjacent-pair ≤90k re-checked every PR).
Glow carriers: 2 of 6 (flowlobe, fumarole) — both floor-hugging. Bare: 4 of 6.
Legacy `basalt` + `vent` PARK at `biomes:[]` behind the `?props=v1` whitelist flip
(never both rosters live — density doubles and envcount reds).

---

## 4. THE VALUE-LADDER SPEC (the inverted ladder — Caldera's signature move)

Technique: `bakeIceLadder(geo, opts)` per-face 3-stop bake — with Caldera's OWN axis
and stops passed EXPLICITLY at every call (`stops:` omitted silently defaults to
Frozen's blue ice — the named Part B leak; the mechanical grep in §7 catches it).

**Axis: world-DOWN.** Frozen keys its light stop off +Y (sun logic). Caldera passes
the inverted axis (`{ax:0, ay:-1, az:0}`) so the ladder keys off −Y: the floor is the
light source.

**The three stops (hue directions — builder tunes exact values in the studio against
the shipping ember sky, floor 4.2/5):**

1. **HOT stop — DOWN-faces (the belly):** deep ember orange-red, ~`0xd4501c` family —
   catch-light from the lava floor. Folded into emissive (the `withLadderEmissive`
   one-liner on a NEW Caldera `vertexColors:true` material — never clone `frostIce`)
   at the warm end (~0.40–0.5 relative) so the belly still glows when the prop
   silhouettes against the bright horizon band. THE BELLY GLOWS.
2. **COLD stop — UP-faces (the crust):** ash-grey cooled crust, ~`0x837a80` family —
   desaturated, hue nudged toward cool grey-MAUVE, deliberately OFF the ember sky's
   orange-peach so crowns separate from the sky in silhouette. Emissive near zero
   (crust is matte and dead by theology). THE CROWN IS DARK relative to the sky and
   COLD relative to the belly.
3. **MID stop — verticals:** near-black basalt with a warm cast, ~`0x2a1e1c` family —
   the biome's dark mass. Low smolder emissive (~0.15–0.25) so verticals never crush
   to void against the water (the current renders' exact failure).

The inversion — hot-below / grey-above / black-between — is the single cheapest thing
that makes every prop in the biome preach the theology, and it is the exact opposite
of Frozen's frost-over-teal sun ladder. It only SELLS if `hemiGround` stays a hot
lava bounce (shipped `0x301010` — warm it slightly in the materials PR, playbook C6).

**Tumbling bodies (the shard skin, §6.3):** world-down flickers as the body spins —
key instead off a FIXED per-chunk WEATHERING AXIS (orientation-invariant material
history): **crust RIND** (ash-grey, the old outside) / **fresh BLACK fracture** (the
new break) / **glowing EMBER SEAM** (the wound). Same machinery, per-chunk axis,
proudly volcanic story.

---

## 5. THE GLOW ADDRESS (fixed — one address per biome, Law-4 twins oppose on it)

**Caldera's address: LOW, in WOUNDS — recessed basal cracks and sunken crater
throats.** Never mid-body slivers (Frozen's address), never under high brims (Mire's),
never flush on a face (the LED-strip tell — kill on sight; the old `basalt` collar is
the museum specimen).

Geometric de-lamping rules (how "fire through a wound" is BUILT, not painted):

- **A crack accent sits BETWEEN two primary-material walls**, recessed below their
  surface by at least its own width — the glow is occluded at grazing angles and
  blooms as you pass over/beside it: light escaping, not light mounted.
- **A throat accent sits BELOW a rim**, sunk ~30–40% of the cone's height — invisible
  in side elevation, a molten pool from above and on oblique approach. (Free motion
  reward: the glow reveals as the player climbs or banks.)
- **Grading:** accent hue is magma orange-red (`accent[3]` family), graded toward
  white-hot ONLY at the deepest point inside fumarole throats — heat reads as depth.
- **The altitude rule (restated):** glow may only appear on the roster's two
  floor-hugging archetypes. Anything tall is dark. Counter-intuition banked from
  Frozen: raising the primary's emissive floor (the mid-stop smolder) LOWERS the
  LED risk on accents — it is a contrast-ratio failure, so never fix a "too hot"
  accent by blackening the body.

---

## 6. THE THREE IN-LANE HAZARD SKINS (`SKIN_BUILDERS[3]` — colliders byte-identical)

Each answers "what, in a VOLCANIC world, is this collider?" with zero Frozen
vocabulary (Frozen answered with calved ice). All obey A4: silhouette contains the
collider everywhere (numeric coverage exports + `tests/hazardskin.mjs` entries —
Caldera authors its own, Frozen's are Frozen-specific), unit-space authoring, magenta
telegraph wins, wider-than-tall wherever the collider allows. ⚠ Engine seam: the
skinned-shard branch of `hazardMesh` hardcodes `mats.frostIce`/`mats.moverIce` —
extend it to per-biome materials in the skins PR or the bomb ships in ice.

1. **BEAM (full-lane horizontal) — THE COLLAPSED COLONNADE SPAN.** A fallen rank of
   hexagonal basalt columns lying across the lane — the hero archetype's dead
   sibling, so the world explains it. Column ends fractured at staggered lengths
   (broken profile, no machined line); glow recessed in the sheared JOINT-CRACKS
   between column faces (the Caldera address, horizontal edition). Wider than tall by
   nature. NO spin — a fallen colonnade cannot roll (kill any animation the fiction
   can't justify). Coverage: data-authored hex sections, continuity across ±16
   asserted numerically after every transform.
2. **COLUMN (vertical) — THE SPATTER CHIMNEY.** A squat welded-spatter neck: stacked
   blob strata, girth held ~78% of height (broad-based, never a picket), broken
   asymmetric crown, ONE sunken throat pool recessed inside the crown — below the
   rim, invisible from the side (the address again; not a stripe, not a band).
   Kinship with `fumarole`/`riftfang` silhouette language, distinct outline (blobby
   strata vs clean cones vs tapered monolith). Unit-space; ring-sampled coverage.
3. **TUMBLING MASS — THE BREADCRUST BOMB.** A lava bomb: dark crust plates over a
   glowing fracture network, value-laddered on the fixed per-chunk weathering axis
   (rind / fresh black fracture / ember seam — §4). Oblate ~1.2–1.25:1 wider than
   tall — lateral mass telegraphs the sideways dodge while staying inside the
   ≤1.25:1 equidimensional bound so the spin never reads as a hitbox glitch.
   **Dynamic variant: split the MATERIAL, never the body** — identical geometry, the
   seam network pulses toward white-hot ("same bomb, it's live").

The shipped GEYSER hazard (identity-locked) keeps its mechanics; its presentation
joins the fumarole family in PR-4 so vents, cones, and bursts are one lineage.

---

## 7. THE FROZEN-RECOLORED CHECKLIST (run at Stage 1: PASS required on every box)

- [x] **Silhouette confusion:** No. Ribbed palisade / lobed tongue / breached-cone
      cluster / angular jumble / banded escarpment / lone broad-skirted neck — none
      maps onto tabular berg wall, stepped shelf-terrace, serac block-pile, broken
      ice-horn, glacier backdrop-wall, or sun-gate pylons; the pylon PAIR concept is
      explicitly banned from `riftfang` (§3.6).
- [x] **Outline-family provenance:** every family is named after and derived from a
      real volcanic landform (Causeway colonnade, pahoehoe lobe, cinder cone, aa
      clinker, caldera rim, volcanic neck) — §3, not one derived from Frozen's set.
- [x] **Glow address:** LOW basal cracks + sunken crater throats, geometrically
      de-lamped (§5) — not Frozen's mid-body crevasse-cleft slivers, and never flat
      panels (the old collar ring is the named anti-pattern).
- [x] **Value-ladder axis/story:** world-DOWN axis, hot-belly / ash-crust /
      black-vertical stops with emissive folded warm-side (§4) — an inversion of
      frost-over-teal sun logic, not a renaming; tumbling bodies use a weathering
      axis Frozen never needed.
- [x] **Hazard vocabulary:** collapsed colonnade span / spatter chimney / breadcrust
      bomb (§6) — basalt answers; zero calved-ice words, and the frostIce/moverIce
      hardcode seam is named for extension so no Frozen material leaks.
- [x] **Twin + blind test:** vertical/hot/rising vs Mire's lateral/cool/hanging on
      the named axis, plus the glow-altitude opposition (floor-fire vs hanging
      light); blind screenshots read as a different game vs Frozen (dark geology
      over glowing water vs luminous monuments over golden mirror) and Aurora
      (prop-hero ember day-for-night vs sky-hero night) — §2.
- [x] **Theology sentences side by side:** crust-over-living-fire / light-from-below-
      through-wounds / RISES vs light-lives-IN-ice / warmth-FROM-the-sun / stillness
      — different subjects, sources, verbs (§1).
- [x] **MECHANICAL GREP (builder runs per PR, Gate-2 re-runs):** every
      `bakeIceLadder(` call in the kit diff passes explicit `stops:`; zero
      references to `_FROST`, `_MIDICE`, `_BELLY`, `_WALL_LADDER`, `mats.frostIce`,
      `mats.moverIce`, `glacierWallMat`, `crevasseCore`, `0xbfdce6`, `0x3fc8e8`,
      `0x357088`, `0xcfe4f0`, `0xd8f6ff`.

No unchecked boxes. Any regression at Gate 2 = RETHINK, not REVISE.

---

## 8. THE FIRST PROP TARGET: **`colonnata`** — build this one first

**Why this one:** it is the biome's signature silhouette (nothing else in the game is
a ribbed basalt palisade); it proves the three riskiest systems in one build — the
INVERTED value ladder (a broad belly for the hot stop, a wide crown for the ash stop),
MASSIVE-FIRST at hero scale in a biome that is currently 100% pickets, and the
dark-mass thesis (an accent-free hero — if a bare colossal form can score 4.2+ in the
ember light, the whole restraint strategy is validated; Frozen never tested this).
It also seeds the beam hazard for free (the collapsed span is this prop lying down).

**Build direction (authoritative):**

- **Part breakdown — 7 parts, ~140 tris, ONE material (the geologic story: a colonnade
  grew from a terrace; one flank collapsed; the crest steps down toward the fall):**
  1. **Plinth pan** — Cylinder n=5, squashed low, sx≈1.6 sz≈1.1, slight ry (20 tris).
     The cooled terrace the colonnade grew from; it is what makes the prop WIDE.
  2. **Rank A (tall, left-of-center)** — hex Cylinder n=6, sx≈1.5 sz≈0.85 (24 tris).
     A fused rank of columns — the hex facets under flatShading give the vertical rib
     read for free.
  3. **Rank B (mid, offset right AND back)** — hex Cylinder n=6, sx≈1.8 sz≈0.9,
     height ≈72% of A, DIFFERENT ry (24 tris). Facet corners must never align across
     ranks — that shuffles the sparse basalt glints and kills coursing.
  4. **Rank C (low shoulder, far right, offset forward)** — hex Cylinder n=6, sx≈1.3,
     height ≈45% of A (24 tris). The crest completes its descent.
  5. **Broken stump (front-left)** — short hex Cylinder n=6 (24 tris), top face proud
     and tilted-by-offset: the column that snapped. Its lean is built by offsetting
     the segment's top position, NEVER by internal rz — the instance `(r,h,r)` scale
     SHEARS internal tilts flat (the rigging law).
  6. **Toppled column** — Box, long axis horizontal, ry≈0.5, half-buried in the
     plinth at the front edge (12 tris). The collapse, lying where it fell. (A box,
     not a rotated cylinder — a baked 90° cylinder ovalizes under non-uniform
     instance scale.)
  7. **Capstone wedge** — Box, skewed, oversized, overhanging rank A's top on the
     side OPPOSITE the crest's descent (12 tris). The one overhang that breaks any
     residual machined line.
- **Crown profile:** ranks at 100% / ~72% / ~45% descending left→right, capstone
  overhanging against the descent, stump jag breaking the front — an asymmetric
  multi-jag staircase, no centered point, no two crown heights equal.
- **Breadth mechanism:** the plinth's sx plus ranks spread radially in x AND z (B
  back, C forward) so the prop is broad from EVERY yaw (rotY-robust); breadth is in
  the geometry AND in `place()` r — target world width ~32–52u vs height ~14–22u.
- **Interpenetration:** every rank sinks ≥30% into the plinth; the stump and toppled
  column bury ≥40%; the capstone sinks ≥25% into rank A. Nothing floats, nothing
  perches.
- **The ONE recessed glow joint: NONE — deliberately.** The hero is bare (§3.1); its
  fire is the ladder's hot belly (the plinth's underside and every rank's under-facet
  catch the lava) plus its reflection. **Sanctioned fallback** if studio rounds show
  the bare hero reading unfinished: drop part 6 (−12 tris) and add ONE thin accent
  seam box recessed in the plinth-to-rank-A joint (+12 tris, second material), sunk
  below both surfaces per §5 — that is the only glow this archetype is ever allowed.
- **Ladder application:** bake with the world-DOWN axis + Caldera stops (§4) — the
  broad plinth belly and rank under-facets go hot, the stepped crest goes ash-mauve,
  the ribbed flanks go near-black smolder. This prop is the ladder's showcase.
- **`place()` discipline:** draw r FIRST; couple x to r via the archetype's measured
  ρ (propclearance lattice, biome-3 scope widened); targets r≈20–32, h≈14–22 (h <
  world width always), tilt near-plumb and EXPLICIT (`tilt: 0` minimum — a missing
  tilt is a NaN quaternion that corrupts the whole band and no headless tool sees
  it); inner edge ≥14.5 worst-case.
- **Gate:** studio contact sheet (propstudio cloned for biome 3, ember key light +
  neutral rig, ¾ + silhouette + PLAN view + head-on), Fable floor 4.2/5, then
  re-scored in-context in the shipping backlight (`frozenclose` pattern pinned to
  `?biome=3`) — the studio lies by up to a full point; only the in-lane moving
  capture counts.

**Build order after the hero:** flowlobe (the rest + first glow carrier — proves the
address) → clinker (the foil — proves the ration) → fumarole (second carrier + hazard
kinship) → riftwall (the massif) → riftfang (punctuation). Obstacle skins follow the
prop kit (playbook C8 PR sequence).

---

*Constraint attestation: every archetype and skin in this bible respects ≤150 tris,
≤2 materials, ≥25% interpenetration, zero transparent/additive surfaces, broken
asymmetric crowns, offset-stacked silhouette character spread in x and z, explicit
tilt, prime coprime steps, FOAM_CFG completeness, and the envcount/propclearance/
gold-determinism/bulletcontrast/hazardskin verification stack. The owner's preview
outranks every gate; budget one redirect.*
