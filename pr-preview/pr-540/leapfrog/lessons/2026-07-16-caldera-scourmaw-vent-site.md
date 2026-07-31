# The Scourmaw: a geyser vent-site by NEGATIVE LIGHT (Fable-directed, 4-round gate)

**What we did.** Gave the Emberfall Caldera geyser (a Caldera-exclusive hazard) a vent-SITE
presentation — the basalt maw the magenta column erupts from — without touching one byte of the
mechanics (magenta column, base flare, telegraph timing, collision cylinder all identical;
gold-determinism + boot stay green). Fable art-directed it end to end: it designed the concept,
pre-assessed, and harshly checkpointed each build. It shipped at **4.3/5** after r1 3.4 → r2 3.7 →
r3 4.05 → r4 4.3. Render-only, gated behind `?props=v1` (default-on), 114 tris, ≤1.6 tall (below
`laneMinY` 2.5 so it is never a flight obstacle, and it carries no collider).

## The design idea (why the first naive attempt was doomed)

The caldera field speaks only two visual words — **dark basalt mass** and **warm orange fire**. A
vent presentation built from either is invisible: a dark mound hides among the clinker/flowlobe
props, and a warm ember throat both drowns in the lava mirror AND poisons the role-locked magenta
DANGER channel. The premium answer speaks a **third word the field never uses: NEGATIVE LIGHT.**
A void-black basin punches a dark HOLE in the brightest surface in the game (the lava mirror), and
the untouched magenta flare/column seats inside it as the "pupil." The presentation doesn't compete
with the danger cue — **it is a dark stage built to make the magenta louder.** Concentric/annular is
also a silhouette nothing else in the kit owns, so it reads as "vent here" at a glance.

## The reusable lessons (Fable's four, hard-won on the pixels)

1. **Negative light needs AREA.** A dark feature only punches a hole if it out-scales the field's
   value noise. At r3.45 basin the maw vanished at 40m; the fix was to grow the *safe rock collar*
   (blast-scour shield to Ø~12, ejecta star to r~9.6) while the lethal void basin stayed ≈ kill
   radius (3.2 + margin). **Grow the shield, never the kill zone** — the telegraph must stay honest.
2. **A vertex-gradient belly on a 1-segment flank is always a painted-glow (LED) bug.** Linear
   interpolation smears hot ember across half a tall wall = the exact poverty pattern the biome
   kills. The fix is the colonnata plinth trick: a separate **undercut collar** ring (rTop>rBottom)
   whose hot face is an OVERHANG facing DOWN — fire escaping from under a lip, its own geometry,
   pinned at the waterline. Fire lives on undercuts, never on flanks.
3. **A grazing-angle "void" is killed by SPECULAR before diffuse.** The basin read dark-RED, and
   the instinct ("lower the emissive") was wrong — the emissive fold multiplies by vColor≈0.02 and
   contributes nothing. The real culprit was GGX **roughness 0.6 → a red sun-sheen across the bowl
   at grazing angles.** Matte first (`roughness 0.82, metalness 0`), darken the stops second. Basalt
   scour is matte; gloss is what leaks the scene's warm light into a hole that should be black.
4. **Verify the capture SUBJECT before judging.** Fable graded a canyon rib as "our vent" for a
   round (a flat ground ring can't arch over the lane — the arch was course architecture). The fix
   is a capture protocol: print camera position + target-vent distance on every shot, and pick a
   stretch with no confusing architecture in frame. Also: the geyser cycle runs on the **render
   clock** (`clock.getElapsedTime()`), NOT `game.time` — freezing `timeScale` does nothing to it,
   so a phase-controlled capture must READ the live vent state (`__dd.ventStates()`) and wait for
   the wanted idle/eruption phase before shooting, or the labels lie.

## Second legibility channel (the dark-on-dark case)

Negative light fails wherever a dark island sits behind the maw. Fable's answer: a thin **ash-grey
iris** — the dish rim ring tinted cool desaturated grey (`_CAL_CRUST`), a colour that exists nowhere
else on the ground plane. Broken by the rim wedges so it reads as a dashed arc, never a lathed
circle. Result: black hole wins on bright mirror, grey iris wins on dark basalt — two channels, both
non-orange and non-magenta, so neither ever touches the danger cue.

## Process note

Fable-per-checkpoint works when the critic scores PIXELS, not the changelist: it grid-sampled the
r4 basin (interior luminance ~14–25 vs field ~60–80; green=0 inside the ring proving zero warm
contamination) rather than trusting "it looks matte now." One SendMessage-resumed agent per design
so each checkpoint remembered its own prior critique and judged the *delta*. Left as post-ship
polish (non-blocking): a mild AO/darkening on upward-facing skirt facets to hold the black-maw
identity through the low-angle eruption approach.

## What it unlocks

The geyser field now reads as a volcanic feature, not a bare magenta disc, at zero mechanical or
determinism cost. The negative-light method (grow the safe shield, matte the void, add a
non-competing second legibility channel) is the pattern for any future "dark feature in a bright
field," and the vent-state capture seam (`__dd.spawnVent/clearVents/ventStates`) is reusable for
any hazard-presentation work.
