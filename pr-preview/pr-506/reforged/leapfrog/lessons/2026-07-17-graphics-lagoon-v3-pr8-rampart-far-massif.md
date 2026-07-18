# Lost Lagoon v3 — PR-8 rampart: the continuous far massif, + the reusable "wall" toolkit (h/r flatten, side-rotY, void/reveal bays)

**What we did.** After `causeway` gave the Lagoon its NEAR-rail, the owner's note still had a second half:
"reference Frozen — it has a lot of volume and geometry." Frozen frames the corridor with TWO continuous
rails (the research in the causeway lesson): a near shelf AND a far comp-less/high-floor massif on both
horizons (`glacierwall`/`riftwall`). Built `rampart` — a colossal drowned Angkor GALLERY WALL that underlines
the far horizon so the mid-ground is expansive stone VOLUME, not empty sky between the tall props. `step 70`,
`comp.floor 0.45` (mostly-continuous enclosure), `arrivalPark`. Lagoon coverage **354 → 380 instances** (with
causeway, **264 → 380**). This prop took MANY Fable rounds (ship → barge → beige-boxes → bunker → gallery),
and the reusable laws that came out of it are the point of this lesson.

## LAW 1 — the (r,h,r) instance scale FLATTENS: an object pier must be ~2× as tall as you want it to read

The world scale is `(r, h, r)` — XZ by `r`, Y by `h`. For a FAR massif `h/r ≈ 0.5–0.7`, so **object-space
vertical proportions are roughly HALVED in world.** rampart's first "tall" piers were object 2:1 and rendered
as world <1:1 — Fable: *"everything is wider than tall, a barge."* An object pier must be **~4:1 tall to read
~2.5:1 tall in world.** (This is why a SHORT prop wanting a tall feature, or a far prop, must exaggerate
object height hard. Check the target world aspect against `h/r`, not the object geometry.)

## LAW 2 — the SHIP/HULL and TRAY tells: a backdrop wall dies at the worm's-eye (the cruise angle)

Two rounds were lost to the worm's-eye read (the cruise angle for a far prop):
- **Outward-skirting stacked courses** (a colonnata-style layer-cake) + **a proud wider jade under-plate** →
  a tapered **ship's hull** from below. Kill both: **near-vertical sections that DON'T skirt outward**, and a
  **footprint-FLUSH** jade plinth (never wider than the wall — a wider tide slab is a "serving tray" that
  reads as a hull deck). **Always judge a far/backdrop prop at the WORM'S-EYE first** — it's where the player
  meets it and where flat/splayed massing betrays itself.

## LAW 3 — SIDE-BASED rotY: a decorated face must be TURNED to the lane, or half your instances show their back

A long lane-parallel wall (`causeway`, `rampart`) must pin `rotY` so its long face runs down-lane — but a
`(rnd()<0.5?0:π)` flip shows the DECORATED face to the lane only half the time; the other half the player sees
the blank back (this was a hidden cause of causeway's Stage-2 "plain slab" — half the galleries faced away).
**Use `rotY = (side > 0 ? Math.PI : 0) + jitter`** (the sungate side-mirror): object `+x` (where you put the
colonnade / bays / drooping jungle) always turns toward the flight lane. Clearance for such a pinned prop:
propclearance uses the symmetric `ρ` (it can't know rotY is pinned), so couple `x` to `ρ` for a clean "ok"
(the real pinned X-footprint is smaller → the prop just sits a touch farther out, correct for a backdrop).

## LAW 4 — the VALUE-STRUCTURE fix that turns "beige slab" into "temple gallery": dark bay openings

Fable's repeated kill on both walls: *a featureless tan plane violates core→bloom→dark (the flat-tape cheap
tell) and reads as a plain slab / flood-control bunker.* A stone wall's identity + value structure comes from
**a repeating rhythm of DARK doorway BAYS** cut into the lane face:
- **`bake:'void'`** — a near-black warm solid (~value 0.12, `#211812`), NOT mid-brown (`bake:'wood'` read as
  paint chips two stops too light). This is the dark accent the amber face lacks.
- **UNIFORM size + pitch + MORE of them** (5–7, not 3 different sizes) → a gallery METER, not punctuation.
- **`bake:'reveal'`** (the upgrade) — a vertical gradient per opening: a dim warm-lit sill at the base fading
  UP to the near-black interior, so each bay carries its OWN core→bloom→dark instead of flat #000 tape.
- **CHEAP via single-sided PLANES (2 tris each).** A `PlaneGeometry` bay is 1/6th the tris of a box — the only
  way to fit 6 bays under the 150 cap. **GOTCHA: the shared material is `FrontSide`, so a plane's winding
  matters.** Build the plane facing object `+x` (`xform ry: +Math.PI/2`) so that AFTER the side-based rotY it
  faces the lane camera; the wrong sign culls it on BOTH sides (invisible in game). Verify single-sided bays
  IN-CONTEXT (the studio can't show a face turned away), not just in the studio sheet.

## LAW 5 — jungle DRAPE, not party-hats

An icosahedron ball perched ON a crown with air under it = a "party hat / green boulder." Draping = the canopy
**centroid AT/below the crown line**, **2–3 overlapping icos** per tree, spilling DOWN the lane face so the
green EATS the crown edge (the Ta Prohm read). (Still open for rampart per Fable: TRUNK the canopies — a
strangler stem down the face — so they read as growing-from, not hovering-over.)

## Where rampart stands / carry-forward

In-context it reads as a drowned gallery wall (dark bay rhythm + drooping jungle + jade waterline on the
sunset). Fable's last in-context score was 3.7 judged at a too-CLOSE camera (the `_kfclose` rig frames a
backdrop too near); the same frame's DISTANT instances read warm+resolved, confirming the near olive cast is a
proximity/jade-fog artifact that clears at true backdrop distance. Remaining polish Fable wants (sub-pixel at
real distance, and each costs against the 150 cap): corbel/step-headed bay tops + a lintel/molding course
(Angkor grammar), recessed bay geometry with a sun-struck jamb, trunked canopies. **The owner outranks the
gate** — the framing brief (the near+far rails that stop the corridor reading empty) is delivered; these are
AAA-temple refinements to weigh against budget on a far backdrop.

## What it unlocks

The Lagoon now has BOTH framing rails Frozen has — `causeway` (near) + `rampart` (far) — so the flight
corridor reads as a walled avenue with a stone-volume horizon, and the tall heroes read colossal against it.
The `void`/`reveal` bay bake + the side-rotY face-to-lane pattern are reusable for any future temple-wall prop
in any biome.
