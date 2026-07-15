# Tempest Arc Crown — a colored glow over a bright sky must be ALPHA-COMPOSITED, not additive

**What we did.** The Surge "Arc Crown" (forked lightning leaping wingtip↔wingtip over the back +
wingtip→sternum, `js/stormArcs.js`) failed its first harsh Fable checkpoint at **3.8/5**: the money
arc's *path* was 4.5-grade (irregular midpoint-displacement, real kinks, rooted + occluded), but the
*cross-section* was a cheap-tell — "white core → sky pink in 2 px, no colored corona." We took it back
to **≥4.2** by fixing the five ranked tells; the biggest one is a reusable graphics law.

**THE LAW — additive light can only BRIGHTEN, so it can never grow a colored fringe over a bright
background.** The halo was an ADDITIVE ribbon of pale blue (`0xd9deff`). Additive *adds* to the
framebuffer, and the Tempest Surge sky is bright warm pink (~`247,202,237`, R already near max). Adding
*any* blue there just pushes every channel toward 255 → the fringe washes to **white**, never blue. No
amount of "raise the halo intensity" can make a fringe read `B>R` when the background's R is already
247 and you can only go *up*. The critic's own target pixel — `~(200,215,255)`, with R **below** the
sky — was itself the tell: R pulled *down* is physically impossible with addition. **To grow a real
colored corona over a bright/warm background you must ALPHA-COMPOSITE (NormalBlending) a saturated
tint** so it pulls the opposing channel *down* toward the tint. Switched the halo mesh to
`NormalBlending` with a deep storm-blue (`0x5182ff`): rgb carries the constant tint (0..1), the
per-vertex alpha is the soft-edge coverage (peak `HALO_A`), width `8.5×` the core. The white-hot core
stays **additive** and draws ON TOP (halo added to the group first → under the core), so you get
white-hot core → blue corona → sky. Verified numerically: cross-sections now read `(203,215,250)` /
`(208,217,248)` — essentially the target periwinkle, `B>R` with G in the middle (true blue, not the
magenta sky where G is the *lowest* channel). That G-ordering is also the discriminator a corona
checker must use: magenta sky is `B>R` too, but its G is lowest; a real periwinkle corona has
`B>G>~R`.

**The other four tells, briefly.** (2) *Dashed forks* — thin branches tapering to `w→0` went
sub-pixel and stippled into 1px dots. Fix: forks render the SAME camera-facing tapered ribbon as the
main bolt, width **holds thick over 70% then pinches only in the last stretch** (never sub-pixel mid-
shaft), plus their own slim corona → they glow, not stipple. (3) *One hero + two ghosts* — the cage
needs ≥2 legible bolts, so a wingtip→sternum bolt is now **guaranteed every beat** (+ a seeded third
from the other wingtip) instead of all-seeded. (4) *Constant core width* — bake a per-point width
multiplier (`wj = 0.62 + rng*0.76`) into the channel so the bolt visibly swells & pinches. (5) *Tail
smear* — the dynamo→tail arc overlapped her silhouette from the chase cam and bloomed on-body; **drop
it** — an "arc" that doesn't cross open air isn't an arc, it's a glowing crack.

**Verification gotcha — a flashing spectacle needs a capture PIN, and swiftshader makes it worse.**
Arcs live ~0.2 s per 1.15 s beat, and the headless render here is ~30 s/frame (swiftshader software
GL), so the game clock advances ~30 s between screenshots → nearly every frame lands on a *rest* phase
with no bolt. Added a debug-only `globalThis.__ddArcForce` seam that pins the arc crack to full;
`_arcshot` sets it so every frame catches a live bolt. It's `undefined` in normal play → the roster
stays byte-identical (storm-tick + starters + pulsetimer green). Also: the second gesture hint ("Hold
SPACE to BOOST") fires MID-flight and *pauses the game*, freezing the dragon behind a modal — set
`flags.hintsSeen = 195` (all bits `steer|boost|phase|roll`), not a partial value, or your capture is
full of a paused dragon.

**Reusable takeaways.**
- Colored glow over a bright bg → **NormalBlending tint** (pulls the opposing channel down); reserve
  AdditiveBlending for the white-hot core that sits on top. This applies to any corona/rim/haze over
  sky, fire, or bloom — not just lightning.
- A corona checker must gate on **channel ORDERING** (`B>G>R` periwinkle) not just `B>R`, or it will
  pass the magenta sky.
- Taper a ribbon to a point by **holding width then pinching late**, never linear-to-zero (sub-pixel
  mid-shaft stipples).
- A "leap" FX must cross **open air** off the silhouette; on-body it reads as a crack, not an arc.
- Any flashing/timed spectacle needs a **force/pin seam** for capture, gated on a normally-undefined
  global so the roster stays byte-identical.
