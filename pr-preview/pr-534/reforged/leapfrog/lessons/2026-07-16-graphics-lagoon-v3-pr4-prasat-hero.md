# Lost Lagoon v3 — PR-4 prasat (the HERO temple-mountain), double-gated 4.4 → 4.4

**What we did.** Built `prasat`, the biome's HERO landmark and the prop Fable's live-biome review said the
Lagoon most needed ("prasat + a giant karst tier to break the horizon = 60% of the remaining distance to
awe"). A drowned Angkor temple-mountain: two redented stepped tiers → an ogival tower → a lotus-bud finial,
one corner collapsed, a withheld gilt doorway. r16–26, h26–40 → it BREAKS THE HORIZON. Gate history:
**Stage-1 p2 4.0 FAIL → p3 4.4 PASS (one revise) → Stage-2 in-context 4.4 PASS.** One-round convergence.
146 tris. Fable: *"the biome's postcard — colossal drowned temple against golden hour, the dragon
minuscule. The dwarfing is total. The shot the 3.1/5 review was asking for, delivered."*

## The headline law — a hero's SILHOUETTE must speak ONE language top-to-bottom

p2 failed at 4.0 with the roster's BEST redenting on the base and a plain box-stack on the crown. The eye
rides a spire to its tip, so the crown is where the read is won or lost — and that's exactly where the
redenting had stopped. **A landmark can't be excellent in its base and generic in its crown; the signature
motif (here: the redented Khmer star edge) must run the full height or the silhouette switches vocabulary
(Angkor base → "Staunton chess set" crown).** The single prescribed fix — carry the redent up the tower on
an ogee taper + seat the finial — lifted silhouette 4.0→4.5 in one round.

## Reusable techniques

- **Redent = 2 interpenetrating 45°-offset boxes per tier** → an 8-point star plan (the Khmer footprint).
  Cheap (2 boxes = 24 tris) and yaw-proof (4-fold symmetry → every yaw reads temple; prasat scored 4.6 yaw
  both gates). For the smaller TOWER tiers where budget is tight, a cheaper approximation carries the same
  serrated edge: **give the widest tower tier the real 2-box star, then ALTERNATE the single-box yaw (0° /
  45° / 0°) up the neck** — stacked boxes whose corners poke past the flats below make a serrated rising
  edge for free, no extra boxes.
- **The lotus-bud finial must be SEATED, not stacked.** p2's finial was a cone floating above a bulb with a
  gap + an overhanging skirt = a "gem in a hat" / rocket-nose-cone tell. Fix: a bulb + a cap whose base is
  NARROWER than the bulb and SUNK into it → one continuous convex close to a soft point. The seam where cap
  meets bulb reads as the lotus's outer petal (works FOR you). Law: **a finial is one closing curve; any
  visible gap or overhang between its parts turns "bud" into "hat."**
- **A hero's height mandate (h26–40) is justified by the two-contrast-regime read.** When the crown clears
  the horizon band entirely, it reads LIGHT-on-dark (crown vs upper sky) while the shoulders read DARK-on-
  honey (base vs sun band) — two contrast regimes on one silhouette is what makes a landmark feel COLOSSAL
  rather than merely tall. This only pays off in-context (Stage-2); the studio-flat value scored 4.2 and
  the real low sun carried it to 4.3 (warm-amber sun side rolling to cool-olive shadow on the bud).

## The FACES call — silhouette economics on a hero

The four Bayon faces (§7.3.2's yaw-proof identity) were DELIBERATELY NOT BUILT for the silhouette gates.
By silhouette economics they're sub-pixel at cruise/arrivalPark distance, and faces=toys is a real low-poly
risk (shallow eroded planes that read as stickers would COST points). Fable confirmed: the silhouette
carries "prasat" without them. **The blind gilt-niche doorway is the standing fallback; faces earn exactly
ONE dedicated close-up round after Stage-2, and revert permanently to niches if the first attempt reads as
stickers.** Bundle three close-range items into that one round (not three): the faces, collapse-scar DEPTH
(add tumbled rubble blocks beneath the scar so it reads as event not decal), and doorway RECESS depth (so
"door" reads from oblique yaws, not "gold seam").

## Gotchas / carry-forward (non-gating)

- **Amber temple sandstone can impersonate gilt in fog** at glancing angles. Confirmed it's `bake:'temple'`
  stone (desaturated next to the true door gold in clear light), but cooling the redent-recess tint one
  step would make it impossible to mistake for the withheld-gold door. One-line palette nudge, later.
- **The pre-flagged straight-neck drum** under the bud does NOT gate (the bud's overhang breaks the run
  before it reads box-stack at landmark distance). A top-edge chamfer (drum→frustum, ~0 cost) is optional
  polish to ride along with the faces round.
- **Out-of-scope for props:** both Stage-2 frames show faint VERTICAL BANDING in the sky gradient right
  where the crown sits — a sky-shader quantization artifact (this is the "white beam" the owner + the
  live-review both flagged). Belongs to the graphics/sky stream; worth a look before the biome montage.

## What it unlocks

The horizon-breaking hero + the giant karst class together answer the "nothing is big" gap that capped the
live biome at 3.1. The biome now has its landmark. Remaining roster: `lotusraft` (lotus flowers for the
near-water void) + `nagawall` (the serpent backdrop), then the composition-density finalize + the prasat
faces close-up round.
