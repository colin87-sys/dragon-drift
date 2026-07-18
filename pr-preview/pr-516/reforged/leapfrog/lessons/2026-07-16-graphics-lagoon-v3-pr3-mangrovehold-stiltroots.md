# Lost Lagoon v3 — PR-3 mangrovehold: the splayed-stilt-root technique ceiling

**What we did.** Built `mangrovehold`, a low-commons red-mangrove islet — a broad green canopy on prop-roots
over water, the airgap ("a tree on legs over its reflection") the biome's tropical scale cue. It took FIVE
studio rounds and a full re-architecture to pass Stage-1 (4.3), because the obvious topology is a trap.
Fable flagged this as a lesson that "will recur on every stilt-rooted prop in the biome" — so, the arc:

## THE HEADLINE LAW — discrete articulated legs at creature proportions are a DEAD END for splayed-root props

Gate history, and why each failed:
- **m2 (6 straight splayed struts): 3.9** — "kindling tripod." Straight = structure, not grown.
- **m3 (bowed with a hard knee): 3.6** — "crab." A nameable knee is a joint, and joints mean animal. Also
  feet staggered at 6 heights = "mid-stride."
- **m4 (shallow planted bow, coplanar feet): 3.9** — better, still "tree then crab on the second beat."
- **The diagnosis (Fable): a TECHNIQUE CEILING, not a tuning miss.** "Six chunky, individually-parseable
  limbs IS the visual grammar of a hexapod — the viewer counts legs before reading curvature. No arc
  dialing escapes it." Three rounds bracketed the space (too straight → too bent → correctly-bowed-still-
  creature); that's the signature of a topology dead end. **Stop tuning, change technique.**

## THE FIX — the two un-fakeable "grown, not walking" signals

1. **CROSSING.** Walking legs never cross each other; roots do. Route the roots so adjacent pairs visibly
   cross — the X un-parses any limb count. This single move killed the creature read dead across every
   tile (spider-avoidance 3.8 → 4.5) where three rounds of arc-tuning couldn't.
2. **A MERGED SKIRT.** Don't let roots spring from a central "body" (that's a torso + limbs = animal).
   Build a flared concave crinoline collar (a short lathe cone) that seats the canopy and is where all
   roots MERGE; the proud roots spring from its rim. The skirt carries the mass/scale read (and survives
   chase-distance LOD where thin roots vanish); the crossing roots carry the word "mangrove"; the gaps
   between them are the airgap.

## THE SECOND FIX — continuity welds (the re-architecture still failed once on execution)

The crossing topology (m5) was right but scored 3.9: the roots read as "snapped scattered driftwood"
because the frustum chains leaked at every joint. The mechanical weld pass (m6 → PASS 4.3):
- **Every root is ONE unbroken chain**; at each bend the two frusta OVERLAP with a fat shared radius (a
  root KNUCKLE that reads as wood grammar), never a butt-joint. **A 2px gap at studio scale reads as a
  snapped stick.** `frustumBetween` chains butt-joint at the shared point by default — you must fatten the
  joint radius (or extend the segments) so they interpenetrate.
- **Bury the root tops** 30%+ into the skirt collar volume (springs from wood, not from air).
- **Drive the feet THROUGH the waterline** (y<0), planted not placed — a foot resting exactly on y=0 reads
  as "placed"; one driven through reads as "gripping."
- **Widen the skirt flare** so its rim peeks below the canopy's dark underside at front/side yaws — that's
  what makes N roots read as ONE organism instead of N leaning props (fixes the yaw score in the same
  stroke).

## Reusable

- **`bake:'wood'` value range must be TIGHT for thin props.** The wide lit/dark bark range (fine on
  figgate's roots against pale stone) made mangrovehold's flared feet go ivory and its shafts near-black =
  "mixed lumber." Clamped the range to one warm-brown family — legs read as one grown root system. (A
  shared bake's value spread that works on a chunky prop can break on a thin one; tighten per use.)
- **The canopy VISUAL mass must dominate** — this held across all 5 rounds and is the constant that keeps
  even a bad root cage from fully reading as a bug (a spider is body-small/leg-long; a tree is the inverse).
- **This whole arc transfers to any stilt/prop-root form** (future biome props): skip the discrete-legs
  rounds entirely — go straight to merged-skirt + crossing proud-roots + continuity welds.

## What it unlocks

The Lagoon's near-water/midground commons now has its tree. Remaining roster: `lotusraft` (lotus pads +
blooms for the flat near-water void Fable flagged) + `nagawall` (the serpent backdrop), then the
composition-density finalize. Stage-2 watch items for mangrovehold: verify the 2 short center roots don't
shard edge-on over jade water (rotate their cross-sections ~25° if so), and confirm the world-radius floor
holds at chase distance with the mirror doubling the root cage.
