# THE EMPYREAN — PROP BUILD REFERENCE (real-grounded, Fable-audited)

Build target for the Empyrean's real-style props (PR-4/5), grounded in real references (Opus research)
and **revised per a harsh Fable audit (verdict REVISE-FIRST → all 10 fixes applied below)**. The abstract
prop (`haloarc`, a broken ring-arc) is NOT here — it has no real referent and is judged on its output.

**The laws every prop obeys (why the audit killed things):** shadowless omni-skylight — **NO directional
highlight / specular / warm drift may imply a source**; the value ramp is INVERTED (bright field, dark =
threat only) — **decorative darks never cross the wave-trough floor (~L41); the ≤1-true-dark-accent rule is
enforced at COURT/FRAME level, not per stone**; bodies are pale bone-nacre `empyStone` **≈L74, one step
below sky, never full-white (never competes with the zenith)**; **rose `empyRim` on CROWNS/EDGES only**,
never a body flush; **no gold/amber**, any temperature shift goes COOL toward the violet key; S≤0.30;
≤150 tris **per prop instance**, ≤2 material groups, flat-shaded, **no textures / no normal-bake** (all
surface detail is coarse vertex-color, zone-directional — never an isotropic sprinkle).

---

## SENTINEL (hero) + CHOIRSTONES (court) — pale weathered standing stones

Real refs: Stones of Stenness (thin truncated slabs), Callanish/Calanais (tall slender "quills"), Ring of
Brodgar (thin blades, irregular ring, broken stumps), Avebury ("a shattered ring of giants from the turf"),
Carnac (diffuse spacing), weathered white marble (surface).

**SILHOUETTE — the strong part, keep it (this is where the tris go):**
- A leaning **BLADE**, not an obelisk/needle/dome. Broad flat face, thin edge.
- **The canted flat TOP-CUT** (Stenness truncation, 25–55° off horizontal) — the single make-or-break cue;
  never a point, never a level top, never a dome. Optional shallow 2-facet broken roofline.
- **Asymmetric offset taper:** one long edge near-vertical, the other rakes in 8–20° → it sweeps/leans.
- **Lens/almond cross-section** (width:depth 4.5–6:1) with **soft-rounded vertical edges** — FREE from an
  8–12-sided lens, no extra tris, no hard 90° corners (a hard corner = fresh-cut = fake).
- **Bedded into the ground:** base flare 1.1–1.3× over the bottom 15–25%, an irregular diagonal ground
  contour, buried deeper on one side — it grows OUT of the surface, never placed on a slab.
- Whole stone 2–6° off-plumb + a slight axial twist.

**SURFACE under shadowless skylight (all vertex-color, coarse):**
- Neutral **bone-nacre `empyStone` (~L74)** — **NO warm.** Any temperature shift goes COOL (toward violet);
  bodies never drift amber.
- **Vertical value ramp only:** crown lightest → base a **shallow near-neutral value DIP bottoming ≥~L44–46**
  (reads as zenith-ambient-occlusion, theology-legal). **NOT a dark "waterline" band; never below the trough
  floor (~L41); never a true dark.**
- **Erosion asymmetry is GEOMETRY roughness only, carrying ZERO value/brightness asymmetry** (a lighter
  smooth side + darker busy side would imply a side-key — forbidden). Windward smoother / lee busier is fine
  as *facet* variation, not as a light/dark split.
- Runnels: **2–3 SOFT runnel shadows** (or bump the lens to ~12 sides and fake them in vertex color — then
  re-verify the tri count). No fine pitting (no normal-bake); mottle **follows the erosion zones**, never an
  isotropic sprinkle (that's the "grey-putty" tell by another route).
- Rose (`empyRim`) on the **crown / one windward edge only** — the biome's rim law, never a body tint.

**TRI BUDGET — resolved:** **each stele is an independently-budgeted ≤150-tri prop instance** (~8–12-sided
lens × 4–5 rings ≈ 80–120 tris shaft + flared base + canted cap; jitter each ring rot ±3–8° / radius
±8–15% to kill the lathe look). **The "court" is a COMPOSITION of instances via `empyComp` placement, NOT
one 150-tri prop.**

**COURT (choirstones):** one elder (tallest) + 5–7 lesser stele in an **irregular ELLIPSE** — mean gap
2–3.5× stone-width, ±25–40% jitter + radial wobble, 1–2 wide gaps (a missing stone / avenue mouth). **Every
stele a DIFFERENT broad-face azimuth + its own lean dir/amount; heights scattered ±20–30% with a couple
broken stumps** (never a graduated staircase, never identical clones). **Jitter the bedding color/height
per stone** (same turf-transition everywhere = cloned tell). **Court-level dark budget:** the aggregate of
all base value-dips must stay shallow + near-neutral so the black threat disc still owns the darkest pixel.

---

## PEARLSHOAL — low nacre humps ("surfacing backs"), the horizontal rest

Real refs: white **mother-of-pearl** (NOT saturated paua), cetacean backs cresting, wave-polished boulders.

**SILHOUETTE:**
- A **long low LOAF** (length:width:height ≈ 3.5:1.8:1), NOT a dome/half-ball. Only the top **~25–35%** shows
  above water; gentle head-to-tail taper + **off-center crown** (asymmetric arc = a *back*, not a ball).
- Cluster 2–5: one lead + rest **stepped 0.65–0.8** (no two the same size), staggered position / submergence
  / yaw (fanned ±20–40°, never parallel) / roll; **overlapping silhouettes** (layered depth); **wide + low**
  footprint (the calm horizontal note under the tall stones). No fin, no pointed/segmented top.

**SURFACE — white MOP, cool, sourceless:**
- **NO specular streak** (a wet glint = a directional source = auto-fail). Instead: a **broad, soft,
  NON-directional baked value-lift on the crest** (it faces the bright zenith), **capped below sky value**.
- Body base = **`empyStone`-capped (~L74), never full pearl-white** (must not compete with the zenith).
- Hue: **violet-family flushes only + rose on the CREST RIDGE / grazing RIM only** (never a body flush,
  never off-palette green — mint-green is cut). All S≤0.30.
- **Along-crest hue BANDING** (2–3 soft zones running along the ridge — reads as FORM, not paint), small
  per-facet steps between adjacent violet↔lilac↔rose-rim hues (never a jump, never a radial oil-slick ring).
  This defeats the "static baked iridescence = painted easter-egg" tell at the ~fixed cruise camera.
- Gradient direction: **neutral-facing → cool-violet at the grazing rim** (the physical nacre blue-shift),
  cool not warm. Iridescence fires at the ridge/rim, **fades to a shallow near-neutral value dip at the
  waterline (≥~L44)** so the hump seats in the surface — **not a wet-dark band.**

**TRI BUDGET:** ~20–30 tris/hump × up to 5 ≈ 100–150 — **declare per-hump or per-cluster instancing** and
verify it closes. **Legibility check:** pale-on-pale humps risk vanishing at cruise — the crest value-lift +
the waterline dip must give enough silhouette/value separation to read at 40–120m before they ship.

---

## THE GATE (both props)

Build to the above, then a **Fable-critic checkpoint on the rendered prop at 40/80/120m in shipping fog,
BEFORE the roster** (floor 4.2/5), scored against the per-prop Y/N checklists (sentinel MUST-pass: leaning
blade / canted top-cut / soft lens edges / bedded-in-ground; pearlshoal MUST-pass: long-low-loaf / no
specular / body ≤ sky / rose-on-rim-only / seats-at-waterline). **Audit at COURT/FRAME level, not per prop:
the moment two decorative darks or a warm drift or a directional glint appear, it fails.**
