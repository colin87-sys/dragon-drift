# Drowned Forum PR-5 — the `pantheon` drowned-dome mid-hero (Fable 3.6 → 4.3 PASS), the RETINT-an-existing-hero pattern, and the documented HERO_BUDGET

**What we did.** Built the Forum's MID-HERO — a drowned DOME temple — by EVOLVING the shipped v2 `rotunda`
(proven 4.5/5): retinted jade→travertine, swapped the lancet window to a round arch, and ADDED the temple
grammar (a welded broken-hexastyle portico + snapped pediment, a fallen column in drums, a gilt oculus, a red
apse). Appended `pantheon` at the END of `ARCHETYPES` behind `biomes: forumV1` — the rotunda stays parked +
byte-identical for the lagoon (coexist, never break the shipped roster). 227 tris. Owner approved the over-cap
build; Fable pre-assessed; 2 gate rounds (3.6 → 4.3).

**THE RETINT PATTERN — copy the proven build body, re-tag the bakes, don't rebuild.** A hero that "evolves" a
shipped hero: DUPLICATE its `build()` into the new archetype (don't refactor a shared helper — duplication keeps
the shipped original safe), tag every mat-0 part `bake:'forum'` (was untagged→`lagoonStone` jade), and merge
with `{forum:true, forumWaterY}`. Put the paint waterline AT an existing geometric edge loop (the rotunda's drum
already has a ring at y0.22 → `forumWaterY:0.22` gives the hard algae line for free; a value between edge loops
smears the band). The retint is ~5 lines of tags; the 4.5 that the original earned carries over.

**THE HERO_BUDGET ruling — a documented, perf-verified exemption, NOT a grandfather entry.** The rotunda is
already 148 tris (at the 150 cap); the spec's mandatory portico/pediment/drums/apse add ~90. A token porch at
≤150 reads as a second triumphal arch and fails the gate. So: build to the honest ~220, add a NEW
`HERO_BUDGET = { pantheon: 228 }` table to `envcount` (separate from the `GRANDFATHER` legacy-shame list),
cited to the Fable pre-assess, and verify PERF is the real gate — step 59 → ~32 instances → ~7.3k band tris vs
the 50k/biome ceiling. **The owner must approve raising a project-wide hard cap; it's not a unilateral call.**

**THE GILT-THROUGH-A-COLLAPSE TRAP — a recessed jewel pokes back out through the WOUND from low angles.** The
oculus gilt must read ONLY as trapped sunset through the collapse/oculus, never an exterior block. But a dome
with a collapsed quarter has a SKY GAP, and a gilt cylinder near the apex — even recessed below the crown —
pokes through that gap and reads as a floating yellow BLOCK from low-oblique lane angles (it came back twice).
The fix is aggressive: **shrink it AND bury it deep** (r0.075, apex only domeY+0.05 — well inside the dome
shell, not near the apex), so no sightline through the collapse ever catches it as a mass. A withheld jewel that
"over-corrects to invisible" is still a PASS; a jewel that pokes out is a FAIL. Bury, don't balance.

**THE PORTICO must read as a COLONNADE, not a wall — and must WELD, not park.** Two distinct fails:
- *Reads as a second arch / solid wall:* 3 fat columns close together fuse into a plate with a rectangular
  cutout = the triumphgate's shape family. Fix: THINNER + more-SPREAD columns (r0.016–0.021, wider gaps) so the
  sky reads through 2+ gaps → colonnade rhythm. Post-and-beam with ROUND entasis columns (vs the hero's square
  piers) is the load-bearing distinction; the 2-full/1-broken rhythm is anti-symmetry insurance.
- *Reads as a separate temple parked beside the dome:* if the podium/pediment sit too far out, a water gap opens
  and it's two props. WELD it — embed the pediment's inner end ~0.03 INTO the drum face, tuck the podium under
  the drum skirt (zero sky/water in the junction). My first pass had the pediment back at x−0.755 vs the drum
  face at −0.63 (a gap); shifting the whole portico +0.16 inward welded it.
- *The pediment RAKE must actually exist:* a shallow apex reads as a flat lintel line (beam-on-posts = arch). Make
  the apex clearly proud of the beam (~0.17 object above it here) so a raking triangle notches against the dome's
  curve — the one silhouette cue ("a low raking triangle against the roster's only curved crown") that name-tests
  "pantheon." And wind the front gable normal to FACE the lane (a −x-facing gable built with +x winding is culled
  by the FrontSide stone material → the triangle vanishes).

**Capture caveat.** The auto-framing tools (`_forumfar`/`_forumclose`) are tuned for ~15–20-wide props; a
~40-wide hero needs a pulled-back camera (bumped the elevation distance to `p.r*2.6`) and the height-pick often
returns h≈1 (grabs a foam/ring mesh) → a bad low camera. Trust the pulled-back ¾ + elevation frames, not the
close low-oblique the tool sometimes grabs.

**What it unlocks.** The retint-a-hero pattern + HERO_BUDGET precedent + the gilt-through-collapse and
colonnade-not-wall laws. **PR-5 remaining: `forumfield` (drowned grid + mosaic foam-decal) + `roofline` (sunken
villa terracotta gable)** — both target ≤150. Polish deferred (non-gating, Fable): split the wide left pier into
2 columns; shave the crown facet visible from elevation.

**Verify:** `HERO=pantheon node tools/_forumfar.mjs <tag>`; envcount 227 tris (HERO_BUDGET 228),
gold-determinism / biomecycle / bulletcontrast green.
