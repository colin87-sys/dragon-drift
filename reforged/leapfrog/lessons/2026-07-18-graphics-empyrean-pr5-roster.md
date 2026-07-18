# THE EMPYREAN PR-5 — the ROSTER: choirstones (court) + pearlshoal (rest note); the three registers close

**What we did.** Completed the Empyrean prop kit to the Fable-audited `EMPYREAN-PROP-REFERENCE.md`,
adding the two remaining size registers beside the PR-4 `sentinel` (the tall lone elder):

- **`choirstones`** — the MID-MASS court. ONE archetype paints a whole congregation: a greater elder
  stele + 3 lesser stelae, pre-composed into a tight irregular cluster (each a different height/lean/
  broad-face azimuth) so it reads as a stone-circle unit, not the loose empyComp clustering the sentinel
  already does. Same sentinel BLADE grammar (`_bladeInto`: station-lathe → canted planar top-cut → rose
  only on the cut lip), at court scale. `comp.floor 0.1` (present in more breaths than the rare sentinel).
  **Fable-model gate: 3.4 REVISE (apex-spike) → 4.3 PASS.** 147 tris.
- **`pearlshoal`** — the LOW HORIZONTAL rest note. A pod of 3 white-MOP "surfacing backs" — a heightfield
  LOAF (`_humpInto`): arch-along-length × cosine cross-section, off-centre crown, rounded ends, rim
  dipping below the waterline so it seats. Rose only on the crest ridge; an even emissive lift, no
  specular. `comp.floor 0.35` (the most common prop — the connective breather). **Fable-model gate: 3.7 →
  3.9 → 4.2 PASS** (two revises — the fog-flip below was the unlock). 132 tris.
- Retired the interim `monolith`/`arcshard` to `?props=v1` (empyOld); the default kit is now the full
  reference roster covering all THREE registers (tall / mid court / low), so density-follows-framing has
  its skeleton. The `inkShoal` flock (system-sized ambient) → PR-5b; the "haloarc" is DROPPED (no
  Fable-audited reference spec exists for it — building an unspecced arch was the slop risk to avoid).

**The "Fable gate" is the Fable MODEL, not an Opus critic wearing the name.** The first pass ran the
harsh-critic subagent on Opus and both props "passed" (4.3/4.3). Re-run on the actual `claude-fable-5`
model, both came back REVISE (choirstones 3.4 with a MUST-PASS apex-spike; pearlshoal 3.7→3.9) — Fable
caught real defects Opus waved through (pink-tipped-lance crowns; a low prop dissolving into the fog).
**Always spawn the gate on `model: fable`.** The whole convention exists because Fable's eye is harsher;
substituting Opus silently lowers the bar.

**The big system this forced — a VALUE LADDER on the pale props (the shared fix behind both REVISEs).**
Both critiques reduced to the same root: a flat pale body has no value structure, so it dissolves into
the pale field (no mid-field CARRY). The fix is the repo's `ladderEmissive` pattern (the mire/caldera
ladders): set the shared empyStone/empyRim mats `vertexColors: true` + `addPropDetail(mat, true)`, and
bake a per-vertex grayscale ramp (`_bakeRamp`, keyed to normalized local height + an erosion mottle) that
folds into DIFFUSE **and** EMISSIVE — so the ramp survives the shadowless emissive-floored rig where a
diffuse-only ramp washes out. Gotchas:
- **vertexColors on a shared mat makes any colourless geometry render BLACK** (the missing-attribute
  default). Every biome-5 prop must carry a colour attr — bake it on ALL of them (sentinel included), and
  add a flat-white fallback in `mergeParts` for the legacy box-geo props (`?props=v1`) or they go black.
- **A tall prop and a low prop want OPPOSITE ladders.** Tall stones CARRY via a dark base-DIP (solid mass
  vs the bright fog) — crown-light → base-dip. A LOW prop fogs fast and a dark base just prints a "dark
  chip" while the pale crown dissolves; it needs the INVERSE — a fog-resistant pale-pearl crown LIFT
  (emissive hi>1, reads LIGHTER than the local water) + a shallow seat. Same mechanism, flipped `lo/hi`.
- **A low pale prop cannot win on the fog HORIZON** (fog value ≥ any pale crown there). Park it in the
  MID-FIELD/foreground where the nearer water is darker than the crown — placement, not shading, was
  half the pearlshoal fix.

**Killing the apex-spike (choirstones + sentinel must-pass).** A canted top-cut with a STEEP slope
(0.42–0.46) on a narrow blade towers the high corner into a rose-tipped triangle — Fable's "pink-tipped
lance." Flatten the slant to ~13° (slope 0.24): it still reads as a truncation (never level) but the high
corner stops spiking. Also de-jitter the top ring (amp ~0.02) so the fan-to-centroid cap doesn't fan into
a twin-prong swallow-tail, and broaden the face into a barely-tapering SLAB (0.92× not a needle) with a
thin edge (zLens 0.24) so side ≈ ⅓ front. The shipped sentinel had the SAME latent spike (Opus passed it,
Fable wouldn't) — fixed there too. **Confining rose to a crest CENTERLINE ridge** needs a `|localZ|` gate
in the hump/blade builder, not just a height threshold, or it spills onto a flank facet as a "sticker."

**Gotchas / lessons.**

1. **A blade-court's stele profile must carry the sentinel's FIXES, not just its shape.** First choirstones
   used a 3-station profile → the crown split (`i>=N-2`) painted the whole TOP HALF rose (candy-dipped
   knives) and the bases tapered to a stabbed-in point. The blade GRAMMAR alone isn't enough — you must
   port the sentinel's hard-won cues: a **buried skirt station** (widest ring, below the waterline → bedded
   flare, "grows out" not "stabbed in") and a **crown-start station pulled to ~y0.90** so rose is a thin
   cut-LIP, not a fat band. That single revision moved 3.9→4.3.
2. **Height variety via per-instance `sy` in the 0.6–0.95 band, NEVER an amplifying stretch.** The first
   court used `sy 2.05` to make the elder tall → a knife (world aspect ~13:1) that ALSO rivalled the
   sentinel's height. A pre-composed court's world height comes from `place().h`; per-stele `sy<1` gives
   variety while keeping the whole court a clear mid-mass. (And a wide pre-composed court reaches toward
   the lane — push `place.x` out to 25–34 so the footprint spread still clears the ±16 gate veil;
   `propclearance` audits it.)
3. **A heightfield shell's winding decides whether it EXISTS at cruise.** The pearlshoal top-plan render
   was BLANK — the top faces had downward normals (backface-culled from above). The cruise camera looks
   DOWN at the water, so an up-facing hump with inverted winding would VANISH / see-through in-game. Flip
   the triangle order (`a,b,c / a,c,d`), verify the top-plan tile actually renders. The studio's top-plan
   view is the free winding check for any up-facing prop.
4. **Round the loaf or it's a fin.** `nW=3` (2 cells across) + a sharp `sin(πs)` arch = a tent-ridge sail,
   not a back. `nW=4` + a broadened crest (`sin^0.6`) + rounded ends (width keeps ~36% at head/tail, not a
   point) + a flatter-topped cross-section (`cos^0.72`) = a rounded surfacing back. The reference's
   "NOT a dome" does not mean "a knife."
5. **Gate props in ISOLATION under a bright neutral studio rig — don't fight the 60s in-game boot.** The
   in-game capture (`_empyshot`) is ~90s/boot and the composition engine places props by seed+distance, so
   framing a specific new prop is slow and unreliable. `buildArchetypeMesh` + `propstudio.html` renders any
   key deterministically in <2s (see `_choirstudio.mjs`). Judge FORM/silhouette there (per the sentinel
   law "silhouette first"); judge COLOR/light/legibility on ONE in-biome frame. That split turned each gate
   round from minutes into seconds.

**Pre-existing note (NOT this PR).** The `?biome=5` debug capture, when the camera pitches toward the
dormant anchor boss, reveals THE UNMASKED's `godhead`/HOLLOWGATE structure as a **warm-brown arch** — a
theology clash (warmth forbidden) that is **boss-side and pre-existing** (independent of any prop/atmosphere
work; absent at cruise pitch). It's the boss↔biome colour coupling already flagged for a future boss PR, not
a roster item — logged here so the next session doesn't mistake it for a prop regression.

**The reusable pattern.** A pre-composed COURT/POD prop = pack N sub-units (stelae / loaves) into one merged
2-mat geometry via a per-sub-unit transform helper (`_bladeInto` / `_humpInto`: scale, yaw, translate),
vary each by height/facing/size, keep the whole under ~150 tris, and push `place.x` out to clear the lane
for the spread. It reads as a tight congregation the loose empyComp clustering can't guarantee. Verify
winding on the top-plan tile; gate the silhouette in the neutral studio before the in-biome colour read.

**Verify.** choirstones 4.3/5 PASS + pearlshoal 4.2/5 PASS on the **Fable model** (all must-pass Y); gold-determinism
byte-identical, envcount all-budgets-green (choirstones 147 / pearlshoal 120 tris), biomecycle 12/0,
bulletcontrast pass, propclearance pass, appshell no-console-errors (GLSL + geometry clean). The `?biome=5`
cruise reads as tall sentinels + mid choirstone courts + low pearlshoal backs converging on the Mote over
the nacre water.

**What it unlocks.** The three registers are in; density-follows-framing can now be tuned (PR-6 territory).
Next: PR-5b `inkShoal` flock (the ambient dark-fish shoal), then PR-6 (gravity-wells + in-lane skins), then
the boss↔biome coupling (recolour THE UNMASKED's structure to the pearl palette — the brown-arch note above).
