# The bruised-storm sky re-grade: violet in the darks, olive as the bruise, all warmth rationed

**Context:** The finale of the "stolen sun breaks the storm" beauty pass. The owner had said Tempest was
"grey and depressing — nothing gives it beauty or awe," and his own boss-surge screenshot (alive under an
indigo sky) proved the fix was a COLOR RELATIONSHIP, not more geometry. The sea half (teal-slate water) +
the sun-road shipped first; this is the sky half.

## The governing law (Fable), which fixed every hex

**Violet lives in the DARKS (deck, cloud shadow, near fog). The bible's olive-green stays in the mid belt
as the bruise's sickly complement. ALL warmth is rationed to the slot + breach + god-rays + gold.** That
one rule is what keeps it a menacing DAY storm (mids stay lit, the slot stays the brightest hole) instead
of a purple night — and keeps the full-purple boss *surge* a distinct state instead of the new normal.
"Bruise" is literal art direction: a violet deck over a sickly-olive belt IS a severe-storm green sky.

## The re-grade (the exact moves that mattered)

- **The strategic pixel:** `sky.top` 0x1f242c → **0x2a2540** — same L≈0.15 silhouette floor, but now it has
  HUE (bruised indigo-violet). A neutral-dark deck reads "depressing"; an indigo-dark deck reads "moody."
  The value didn't change; the *hue* did all the work.
- **Warm the SLOT, not the field:** `sky.horizon` 0xaab1ad (silver) → **0xc2b399** (paper-gold), `sky.sun`,
  `cloud.lit`, `fogFarColor` all nudged warm to agree. This is a conscious theology override — the slot is
  where the stolen sun leaks — but the LIGHT RIG stays cool (`light.sun` 0xb0b4c6, no warm field light), so
  the theology ("hidden cool sun") holds. Warm enters only as emissive + the sky itself.
- **Make sky and props agree:** `hemiSky` → indigo (0x5c5f78) carries the deck onto prop shadow planes;
  `hemiGround` stays teal; **`tempestStone` emissive hue → slot-warm 0x8a8578** so scour crests read
  *slot-lit*, not like a cool-grey compositing error pasted on a warm sky.
- **Two silent companions that would have broken the grade:** `tempestVirga`/rainshaft was pinned to the
  OLD cool far-fog 0xa7b2b0 → update to the new warm 0xb3ac9c or every rainshaft is a cool stripe on warm
  fog. And the stone emissive hue above. **When you re-grade a fog/sky color, grep the codebase for every
  material pinned to the old value** — they don't auto-follow.
- **Bought the shafts presence:** `godrayMul` 0.42 → 0.50 (the gold shafts are half the awe under a darker
  deck).

## The breach finish (what finally killed "the moon")

The lifted, hotter breach still read a touch moon-ish because a moon and a hole look alike until the deck
*overlaps* the hole. Two shader moves in the existing almond `_rr` space (uBreachMix-gated):
- **Torn rim:** a 2-octave angular tear `_rvN(_ang*k)` biased to the TOP arc (`_topArc`) → `_rrT = _rr +
  (_tear-.5)*0.24*_topArc`, fed into the window feather AND the dark ring (NOT the interior gradient, and
  NOT the gold lower lip — that stays a clean sunlit edge). A hole in a storm deck has a ragged rim.
- **Finger wisps:** where the tear runs deep in the upper window, mix in cloud-shadow violet across the hole
  — the deck visibly reaching over the breach. *Moons don't have cloud fingers across them.* This is the
  single move that converts "moon" → "breach."
- God-ray shafts: the `godrayMul` bump alone carried it (the existing fan anchors at the sun/breach
  azimuth); the explicit angular-comb shafts stayed on the shelf (add only if device says hole↔road don't
  connect).

## Result / determinism
All sky/light/fog/emissive changes are render-only → gold-determinism byte-identical; biomecycle, stormtick,
insts, propao, propfoam, propclearance --ci, envcount --ci all green. Headless flatters the slot-vs-deck
contrast and the breach fingers by ~a stop — device is the gate. The whole arc (sea + sun-road + props +
arch + sky) now reads as one thing: a bruised storm with a hole where the stolen sun burns through and drags
a gold road across the sea to the player.
