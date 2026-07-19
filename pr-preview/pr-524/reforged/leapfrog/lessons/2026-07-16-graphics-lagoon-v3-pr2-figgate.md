# Lost Lagoon v3 — PR-2 figgate (strangler-fig gate), double-gated 4.4 → 4.6

**What we did.** Built `figgate`, the Ta Prohm money-shot: a thick temple GATEWAY chunk (two jambs + a
lintel, doorway open through to sky) with a strangler FIG seated on the lintel — dark roots cascade down
both jambs to the water, a billowing green canopy crowns it, a recessed gilt soffit glint teases inside
the door. Fable gate record: **Stage-1 f2 3.8 FAIL → f3 4.4 PASS (one revise) → Stage-2 in-context 4.6
PASS.** 150 tris, on `lagoonV3` (now the default). Firewalled vs the bare Sinking-Gates hazard arch
(4.9 distinctness): thick + rectangular + crowned + root-draped + ruined.

## The headline lesson — "nature eating civilization" needs CONNECTIVE TISSUE, not adjacency

f2 had all the right PARTS (gate, canopy, roots) and still failed at 3.8, because the roots read as
**thin, straight, green strips leaned against the jambs that started BELOW the lintel** — the tree and the
strips were two unrelated decorations. Nothing was *strangling* anything. The fix (Fable's exact
prescription, and the reusable law):

1. **Give the invader its OWN value slot.** The roots were green — same hue+value as the moss waterline
   stain — so they dissolved into "generic moss." Added a new `bake:'wood'` ladder (dark BARK-BROWN, lit-
   bark on up-curves / dark on flanks), clearly darker than both cream stone and moss green. That single
   move took VALUE STRUCTURE 3.8→4.6: the strangle now reads at thumbnail size because it owns a zone.
2. **The invader must ORIGINATE from a shared point and physically CONNECT the two halves.** A squat wood
   COLLAR straddles the lintel top; the canopy welds INTO it (killed the lollipop/pinch) and every root
   SPRINGS FROM the collar, **crests OVER the lintel's front edge**, knees at ~60% height, and splays at
   the foot in the water. Origin-above-the-lintel is the entire Ta Prohm read — the fig now visibly owns
   the gate from crown to waterline. This converted three decorations into one story in a single pass.

**Reusable:** for ANY "nature reclaiming a ruin" prop (figgate, mangrovehold, the future overgrown props),
the vegetation must (a) carry its own hue/value slot distinct from the stone AND the waterline stain, and
(b) originate from one collar/seat and physically drape over/through the stone it claims — never sit
beside it.

## Reconfirmed / supporting

- **Canopy = rounded blobs, never flat pads** (the karstfang lesson, re-proven twice here): f1's flat
  ConeGeometry parasol read as a dark UFO/mushroom-hat; squashed `IcosahedronGeometry` blobs read as a
  billowing leafy crown. And **one convex blob reads as "boulder on a table"** — a crown needs ≥2
  OVERLAPPING lobes (a notch/asymmetric massing) to read as foliage, not a rock.
- **Withheld gilt = a recessed GLINT, not a bar.** A flat saturated gilt panel at the doorway read as a
  "shrine lamp" (the one warm note spent on an accident). Shrinking it + setting it BEHIND the doorway
  front plane turned it into "treasure in the shadow" — a discovery cue that teases at exactly the
  distance a distant sibling's door catches the sun. Gold belongs deep in the aperture reveal.
- **A gate seen edge-on legitimately falls back to "ruined pillar"** — the doorway signal only reads from
  the front hemisphere, and that's fine for a MID feature: the through-hole reads in context via the
  DISTANT siblings (a gameplay ring literally threaded a mid-distance doorway in the Stage-2 frame). Don't
  chase a from-all-yaws doorway; let the canopy+roots+thick-masonry carry the off-axis yaws.
- **Real golden light closes cosmetic studio tells.** Both Stage-1 carry-forwards (a pale canopy z-slit
  facet; root-bow gaps looking like stilts) evaporated in-context — the slit read as a lit leaf edge, the
  bowed root as an authentic aerial-root drape against the fog. Judge cosmetics in Stage-2, not Stage-1.

## Gotchas

- **150-tri cap is tight for a composite prop.** Gateway (48) + gilt (12) + collar (10) + 2 canopy blobs
  (40) + 4 roots (40) = 150 exactly. Budget levers: thin outer roots to 2-seg `frustumBetween` (8 vs 12),
  drop canopy pad seg counts. `IcosahedronGeometry(r,0)` is a flat 20 tris — price it as 20, not "a sphere."
- Non-gating polish carried forward (Fable, optional): the large blank outer jamb face has one "cardboard"
  beat at close flyby — a shallow horizontal course-seam inset or a second shadow-casting rubble stub would
  kill it, but we're at the tri cap, so it waits for a family polish pass.

## What it unlocks

`bake:'wood'` (bark brown) is now a 4th non-stone bake alongside temple/foliage/root/bloom — the substrate
for every woody prop to come (`mangrovehold`'s stilt roots + trunk, any driftwood). The strangle law +
collar-origin pattern transfers directly to `mangrovehold` (a trunk on arcing stilt roots) next.
