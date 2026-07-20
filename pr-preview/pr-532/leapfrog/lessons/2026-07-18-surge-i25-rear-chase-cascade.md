# 2026-07-18 — SUNBREAK I2.5: design the cascade in the PLAY camera, not the turnaround

**Did / learned.** The whole anatomical ignition cascade was built "eyes ignite first, eyes hold
last" — and the OWNER caught the fatal flaw in play: it's a **rear-chase camera**. The eyes are on
the FRONT of the head, facing away; the player never sees them. So the entire spine of the design
(eyes-first tell, eyes-last decay ember, eyes→spine→wings→rim order) was **invisible in the actual
view**, and there was **no tail station at all** despite the tail being the nearest, most prominent
element on screen. The machine asserts were green and two Fable critics passed it — because I
verified on **pinned studio-ish captures**, not the play camera's geometry. A greyscale "name the
beat" test still passes on an invisible beat if the capture angle can see it. Fable replanned it
around the dorsal silhouette; rebuilt to 5 stations travelling TOWARD the viewer (crown corona →
spine RUSH nape→tail → wing SPREAD → **tail CRACK** → rim SEAL), decay rewinding to a crown-ember.

**The reusable insight — the DEPTH AXIS is a free timeline.** In a chase cam the anatomy is laid
out along the camera ray (crown farthest, tail nearest). An ignition wave that travels toward the
camera **grows in screen-space as it advances** — small far spark → rushing front getting bigger →
climax on the biggest, nearest element (the tail whipcrack, inches from the lens). Travelling away
is the same energy played as a diminuendo (it shrinks and recedes = anticlimax). So: **spend the
climax on the nearest element, the first tell on a screen-space carrier** (a crown corona, not a
subpixel eye — the I2 lesson again: screen-space carriers are distance-proof, geometry emissives
aren't), and **the last-held ember on the most camera-legible anchor** (the crown, a far small
"going back to sleep" ember — a big near element held last just reads as "still on").

**Gotchas.**
1. **Verify FX in the play camera, not a turnaround/pinned pose.** The single biggest process miss
   here: every gate judged frames where the beat happened to be visible. Add the play-camera view
   (rear-chase, gameplay distance) to the capture set for any on-body FX, and ask "would the player
   SEE this beat from where they actually sit?" before building to it.
2. **Uneven onset gaps get distorted by varying ramp widths at any nonzero measurement threshold.**
   Fix: keep the STATION-level envelopes uniform-fast (~120ms attack) so the crossing-time gaps
   equal the design onset gaps, and put the intra-station TRAVEL (nape→tail) in the per-mat loop,
   not the station envelope. Decoupling the "station fired" signal from the "front travelling
   through the station" detail keeps both the asserts clean and the motion rich.
3. **No clean per-material tail hook** — dragon materials span the whole body with no position data.
   Used the mat INDEX as a nape→tail proxy (build-order) for the travel, and let the REAR mats
   (frac>0.55) carry the tail-crack station. Fragile if a dragon's build order isn't nape→tail;
   flagged as the per-dragon residual to watch when migrating the roster (I5).

**→ Systematize.** "Design the FX in the play camera" becomes a capture-harness rule: the montage
tool must include the rear-chase gameplay view, and the greyscale name-the-beat test must run on
THAT frame, not a chosen angle. The depth-axis-as-timeline + screen-space-first-tell +
climax-on-nearest is the reusable chase-cam VFX grammar (reuse for the I3 beam and I4 payoff — the
beam fires forward/away, so its climax/impact should read as approaching or landing on a near
anchor, never receding into the far point).

**→ Leapfrog.** With the cascade now correct for the camera, I3 (the beam) and I4 (the slow-mo/
camera payoff) can build on a read that's actually visible. The tail-crack is the new signature
beat — I3's beam must not fire from a position that swallows it, and I4's camera punch should hit
ON the crack (the nearest, brightest instant) for maximum felt impact.
