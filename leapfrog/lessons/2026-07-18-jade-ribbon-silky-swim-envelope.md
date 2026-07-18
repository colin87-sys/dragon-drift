# Jade ribbon — killing "stiff": the SWIM is a 3D travelling wave, and the ENVELOPE is the whole game

**What we did.** Owner feedback on the shipped follow-the-leader ribbon: *"only a slight curve, the
whole thing feels STIFF — we want silky smooth S-shaped curves that follow as the player moves
left/right and up/down."* Rebuilt the `swim` layer in `reforged/js/ribbonSpine.js` from a tiny
lateral sine into a **bold 3D travelling wave** and, after two Fable rounds, learned the fix was the
amplitude ENVELOPE, not the wave itself.

## The swim, final form
- **3D:** lateral offset along the binormal **+** a phase-shifted (≈π/2) vertical offset along the
  normal → the tail flows in a soft helix, not a flat metronome wiggle.
- **Two summed harmonics** (`sin(ph)·0.78 + sin(ph·0.5+0.9)·0.32`) so it never reads as a mechanical
  tick (the "metronome" cheap-tell).
- **Input-driven swell:** the caller sets `driveX`/`driveY` each tick from smoothed `|velocity.x|` /
  `|velocity.y|`, which SWELL the wave in the axis you're steering — so the ribbon flows into
  left/right and up/down. A `gain` term energises it with cruise speed.

## The lesson that actually mattered: the amplitude envelope
Boosting amplitude alone did NOT kill "stiff." A fresh Fable critic nailed why: with the wave faded
out over the front (`headFade` 5 stations) and swelling only toward the tail, **all the life was in
the back 40%** — a rigid torso with a whippy tail reads as *"a car antenna on a fixed base,"* not silk.
And with the front half dead, only ~1 hump was ever on screen = a J, not an S = the owner's exact word.

The fix (one change, everything else left alone):
1. **Move the wave's onset forward** — `headFade` 5 → 3, so the wave ENTERS one–two stations behind
   the head and the neck/shoulder carries ~40–55% of the tail's amplitude (the whole torso
   participates). Station 0–1 stay protected so the body never detaches from the separately-placed
   head mesh (and the rider doesn't buck).
2. **Shorten the spatial wavelength** — `swimFreq` 0.72 → 0.9 so **≥1.5 wave periods (two humps)** live
   along the body. A single hump is a "slight bend"; two is a travelling S.

Verified by the tell the critic asked for: across a 560ms cruise filmstrip the S **reverses
handedness** (neck sweeps right→left→right), which only happens if the wave is *propagating from the
head* — a static bend with a swishy tip can't do that. Result: **4/5, "nobody sits behind this and
says stiff."**

## Camera gotcha for verifying undulation (cost a round of confusion)
A **side camera only sees the VERTICAL component** of the swim — the dominant *lateral* wave is along
the view axis and is invisible, so a side still of a big lateral S looks nearly straight. The
**chase/behind cam sees BOTH** lateral and vertical (both are perpendicular to forward), so it's the
right diagnostic *and* it's the player's actual seat. Judge ribbon undulation from behind (or top-down
for lateral only); don't conclude "stiff" from a side shot. To get a side/top view headless, monkey-
patch `__dd.cameraCtl.update` to track `__dd.player.position` from the chosen offset (freezes the
game's chase controller). Filmstrips (N frames 120–140ms apart) are essential — silkiness is a *motion*
quality a single still can't show.

## Open polish (non-blocking)
Give the neck's VERTICAL component the same forward onset the lateral got (~15–20% of tail-vertical at
the neck, phase-locked, NOT a rider bob) so the S reads from every camera angle, not just the chase cam
— chases 4.5–5. Left for a follow-up so the owner can feel the current build live first.

**Reusable takeaways.** For any procedural undulation: (1) the amplitude ENVELOPE (where the wave
enters, how the neck vs tail share amplitude) drives the "alive vs stiff" read more than raw amplitude;
guarantee the wave enters near the head and put ≥1.5 periods on the body. (2) Make it 3D + two-harmonic
+ input-swelled to avoid the flat-metronome tell. (3) Verify undulation from the camera that sees the
dominant component (behind, not side), with a temporal filmstrip.
