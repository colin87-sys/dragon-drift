# Tempest owner reworks — reading the owner's words RIGHT, and the leading edge I inverted

**What happened.** After the geometry gated PASS, the owner sent a run of specific, reference-driven
craft notes (body too long/thin/weak; wing inboard trailing edge a "straight bar then wrist scallop";
tail tuft "thin cheap/tacky spikes"; and the wing "leading frame curves forward then back at the
wrist"). I reworked all of them and cleared a scored Fable checkpoint (wing 4.4 / whole 4.3, bar 4.2).
One of the four I got exactly backwards first, and that mistake is the load-bearing lesson.

**THE LOAD-BEARING LESSON — a critique that DESCRIBES the reference is not a complaint about your
build; read which one the owner means before "fixing" it.** The owner wrote: *"The leading frame is
curving forward and then once it hits the wrist it curves back."* I (and a Fable agent I briefed)
read it as *"my build does this and it's wrong"* and STRAIGHTENED the leading edge — deleting a curve.
The owner meant the opposite: *"the REFERENCE has this curve and mine doesn't — ADD it."* An entire
assess→build→checkpoint cycle went the wrong direction because I assumed a description of the desired
feature was a description of a defect. When an owner note points at the reference, resolve the polarity
FIRST: is this "the reference has X, add it" or "mine has X, remove it"? If ambiguous, the safe default
is that a specific shape the owner bothered to describe is a shape they WANT — ask or check the
reference before subtracting. I compounded it by briefing the Fable agent with my own (wrong) framing,
so it confidently confirmed the wrong direction — **a subagent inherits your misread; a confident
second opinion built on a bad premise is not an independent check.**

**The graceful-ogee build (reusable, once the polarity was right).** The reference leading edge is a
swan-neck: the inner arm BOWS FORWARD to a forward-most apex AT the wrist, then the dominant strut
recurves AFT to the tip. The trick to make it read as a smooth curve and not a hard kink: **put the
single unavoidable reversal vertex ONLY at the anatomical wrist, and split the forward bow into
shallow (~5-7°) sub-bends with an extra mid-waypoint** so no interior vertex turns sharply. A restored
forward knuckle-bow on the leading strut *shaves the wrist corner* (it leaves the apex at a shallow
angle, so the hard aft sweep happens one joint out at the knuckle, where the storm-kink aesthetic
already lives). Forward = −Z, aft = +Z in this rig; "bow forward" = negative Z across the arm, "sweep
back" = raise the strut azimuth. The propatagium leading web must be split to hug the bow or it chords
across the corner.

**The three other reworks, banked:**
- **"Long/thin/weak" body is a LENGTH problem as much as a girth problem.** My first pass just thickened
  the radii; Fable still failed it as lean/tubular. The fix that landed: SHORTEN the neck ~20% (compress
  the z-stations) + bulk the mid-torso + pull the head base in to match, so the wing roots sit on a
  compact shoulder BLOCK. Bulking radii without shortening the run still reads as a thick tube.
- **A membrane that scallops in PLAN can still read as a flat SLAB in side profile.** The top-planform
  bay scallop vanished edge-on. The fix: widen the DROOP spread across the struts (0.06→0.38) so the
  tips sit at very different heights → the trailing edge steps/scallops in the side silhouette too.
- **"Cheap tacky spikes" vs "flame": WIDTH + a rounded tip, not length.** The tuft needles became flames
  by widening the base into a belly (narrow root → wide belly → tip) and, on the checkpoint pass,
  ROUNDING the tip (a needle point reads cheap even when broad-based); fewer + clustered + curled.
- **Continuous scalloped trailing edge inboard:** replace the straight brachial triangle with a concave
  bézier trailing edge fanned from the wrist down to the body anchor, and APPEND its points to the
  knife-edge polyline so the one lit rim runs unbroken wingtip→body.

**Process banked — the owner's "assess with a Fable agent then checkpoint" is a two-ended loop with a
NUMERIC bar.** The owner set an explicit ≥4.2/5 bar. The cycle that worked: Fable pixel-studies the
reference for the exact feature and hands a numbered buildable spec (waypoint z-values, azimuths,
bow magnitudes) → I build → the SAME agent scores a checkpoint against the bar and lists what's left.
Give the assessor the reference + the current render + the code so its spec is buildable and its score
is grounded, and — the correction above — brief it in NEUTRAL terms, not pre-loaded with your own
diagnosis, so it can catch a misread instead of ratifying it.

**What it unlocks.** The whole dragon now clears the owner's 4.2 bar on craft (wing 4.4 / whole 4.3):
compact powerful body, a big lightning bat-wing with the reference's forward-then-back swan-neck
leading edge and a continuous scalloped trailing edge, broad flame tuft, glowing crown + bright eye.
Roster byte-identical throughout, apex ~2100 tris, all built from the one shared stormSpike. Remaining:
I4 (the storm strike/Surge tick) + I5 (the ladder asserts + tests/starters.mjs) — systems, not geometry.
