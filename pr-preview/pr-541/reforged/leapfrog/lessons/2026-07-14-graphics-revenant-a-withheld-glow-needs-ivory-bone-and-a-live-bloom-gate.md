# A withheld glow needs ivory bone + a live-bloom gate (Revenant "The Haunting")

**What we did.** Built + gated the Gravelight Revenant's Dragon-Surge effects layer ("The
Haunting" — a grave-green ghost-fire that lives inside the skeleton and leaks out through the
bone gaps). First harsh-critic Fable gate FAILED at 3.50/5 (lantern-law 3, composition 3, hue
3.5, dead skull/tail); a focused iteration cleared it to a PASS. These are the transferable
gotchas.

## The core lesson: a "withheld → ignite" motif dies if the cruise base is already saturated
The inner rib faces were an albedo washed 45% toward green + a **static** 0.75 emissive. Two
failures in one material:
- It read as **flat green PAINT on the bone** (no falloff) — not light escaping a caged interior.
- It was **already maxed at cruise**, so Surge had nowhere to ignite *up* to. The withheld→ignite
  delta was dead — and the bloom-less studio confirmed it: the cruise and surge quads differed by
  only ~2.4k px ("identical").

**Fix — keep the albedo IVORY, move the colour entirely into a withheld EMISSIVE:** bone albedo
identical to the outer bone, emissive = grave-green, `baseIntensity` DIM at cruise (0.22), and
publish the mat in **flareMats** so the shared flare/reset loop ignites it on Surge. Now the same
faces read as bone-lit-from-within at cruise and blaze on Surge — and the studio delta jumped to
~16.5k px (6.8×). **A lit surface is emissive-on-ivory, never green-on-albedo.**

## Judge ignition on the LIVE frame; judge hue/lantern/composition on the studio
The studio stage has the game's ACES tonemap but **no UnrealBloom**, so a saturated cruise green
already clips and a 10× Surge intensity clips to the *same* pixels — the studio structurally
CANNOT show a bloom-carried ignition. `tools/fullshot.mjs <key> 3 fever` boots the real game
(bloom on) at the rear-chase cam and shows the withheld→ignite delta plainly (dim green wake →
green flood). Split the gate: **live pair for ignition + gameplay composition; studio for hue
purity, lantern-law, geometry.** Hand the critic both, and say which is which.

## Backface culling silently eats emissive accents (FrontSide is the default)
The socket-vent disc and the tail ember spikes rendered as **nothing** from the top/front camera:
`MeshStandardMaterial` defaults to `THREE.FrontSide`, and a small accent whose winding faces away
from the money camera is culled. Set `side: THREE.DoubleSide` on any small grave accent that must
read flat-on from an arbitrary angle. (This is the same class of bug as an XY-plane octagon being
edge-on to a top-down camera — orientation AND cull-side both have to be right.)

## Dorsal accents must clear the neural-spine tips
Tail "ember" nubs seated at `cy + 0.10·sc` were occluded by the vertebra neural spine (tip at
`cy + 0.255·sc`) — invisible from the top planform, the exact view being judged. Lift dorsal
accents ABOVE the spine tip and seat them in the GAP between vertebrae (no spine there). Verify
by censusing green pixels *by y-band* down the planform, not one lump sum — "600 px present" hid
the fact they were all clustered at the root behind the heart, none down the whip.

## Halve the Surge ground-wash so the flood never exceeds the silhouette
Fable: the Surge green water-pool was "larger and brighter than the dragon itself" and collided
with the collectible-ring green (a gameplay signal). `feverAuraScale: 0.5` on the def halves the
aura-disc opacity — the ignite budget belongs in the heart/gaps/sockets (the lantern), not a lamp
on the water. A signature effect that out-shouts the character, or shares a hue with a gameplay
signal, is a composition bug even when each part is individually pretty.

## graveprobe: prove the invariants headless, don't eyeball a bloom-washed tile
`tools/graveprobe.mjs` (sibling of seamprobe) builds each form, finds the grave family in
flareMats, and replays dragon.js's flare/reset loop to assert: **firewall** (no grave-hued mat in
spineMats — those carry the warm cruise rim), **hue-lock** (every lit grave mat ∈ 118°±20°; the
black-emissive wisp is the spectral-by-transparency exception), and **withheld→ignite** (cruise
dim ≤1.3, surge ≥1.6× cruise). A two-state probe catches a hue drift or a paint-not-ignite
regression that no single screenshot will.

## Process that worked
Pre-assess → build → gate with a fresh harsh Fable critic → iterate the *specific* directives →
re-gate the SAME critic (so it verifies its own asks) → verify each fix with a targeted numeric
census before trusting the eye. When a directive "doesn't read," suspect (in order) cull-side,
occlusion, orientation, then brightness — not brightness first.
