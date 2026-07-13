# Pearl Seraph — the Aureole Plate-Fan wing (bespoke atom → SSSR-tier, per-component gate)

**What we did.** After the owner rejected two feathered wings (a raked-quill wing, then a
shingled-plumage wing that passed a *weighted* gate at 4.30 but still "looked like the
original"), we did the thing that was actually missing: reverse-engineered *why* Vesper /
Solar / Phoenix read as top-tier (two Fable analyst passes), then built the Seraph's wing
from a **bespoke construction grammar** instead of patching a generic one. New builder
`dragonSeraphAureole.js` → `aureoleWing`, owner-gated **per-component at >4.2 each** (not a
weighted average). Result after 3 rounds: **FULL PASS** — Silhouette 4.5, Wing-craft 4.4,
Value 4.5, Surge 4.4, Coherence 4.3.

**The core relearn — SSSR = a bespoke ATOM + a profile-as-function SILHOUETTE, not a good
generic wing.** The prior wing used the shared `shingle()` card (flat, one material, no
relief) and a restyled gull arch — competent but *generic*, which is exactly why it kept
clearing numeric gates and failing the owner's eye. Every top-tier dragon instead has (a) a
**bespoke two-value THICK atom** (Vesper's knapped tent, Phoenix's creased flame-kite,
Solar's vault bay) and (b) a **profile-as-function that bakes an OWNED silhouette** (Solar's
M, Phoenix's rake, Vesper's crescent). The fix was to mint both:
- **`seraphPlate` atom** — a chased armor feather: a **material-split two-value bevel** (lit
  facet vs a steel-pearl SHADOW facet — the value event is what makes flat-shaded low-poly
  read as *craft*), real wedge thickness, a raised **true-gold HEM as geometry** (not a
  painted stripe), and a carved **DAWN CHANNEL fuller** down the ridge. One atom builds the
  whole wing, bucketed by material (lit/shadow/hem/channel) and merged per rank → few draws.
- **`seraphCrownY/Z` profile** — a round convex crown-DOME + a ruler-straight descending
  blade edge: the only round-topped/straight-edged wing on the roster (owns the frame region
  the others don't). The pair's gold hems radiate = a broken aureole around the rider.

**Gotchas banked:**
- **"The atom is only half-built" is a single root cause that tanks multiple components.**
  Round-1 had wing-craft 3.5 / surge 3.0 / coherence 4.0 all failing — because the plate had
  hems + thickness but no bevel and no reading channel. Building the *full* atom (bevel split
  + channel groove) lifted craft +0.9, surge +1.1, coherence +0.3 and retired the staircase
  veto, all at once. Diagnose for a shared root cause before chasing each low score.
- **On a WHITE-value creature the withheld glow must be a SATURATED-HUE circuit, and the
  Surge peak must sit BELOW the ACES white-clip.** First surge attempt was bright but
  clipped to white (changed-pixel B−R +15 → "plates got whiter"). Fix: saturate the emissive
  (dawn 0x3AC4FF, surgeHi 0x2CC0FF) AND *lower* the multiplier (42→28) so the hottest pixels
  don't desaturate. Result B−R +34.6, 59.6% strongly-blue, zero core clip. Raising the
  multiplier re-clips; dimming breaks "blazes on Surge" — +34.6 (vs a +40 target) is the
  **ACES ceiling**, i.e. diminishing returns, not an unfinished fix. Verify Surge with a
  pixel diff (changed-px %, brightness lift, **B−R**), never an eyeball.
- **The raked-quill STAIRCASE returns for any raked overlapping element (feather OR plate)
  viewed edge-on.** Killed the mid-wing version with flat low-ridge scale-mail (short plates,
  ~62% overlap, tips buried) + root-tucked, widened primaries; the residual side-profile
  stepping is the *inherent* edge-on read of an overlapping plated fan — diminishing returns,
  ruled acceptable (rear-chase, the 95% view, is clean).

**Reusable process.** When a build passes numeric gates but the owner still rejects it: don't
patch — spawn a Fable *analyst* to extract the top-tier construction grammar, then rebuild on
a bespoke atom + owned silhouette, and gate **per-component** (a weighted average hides a
half-built atom behind strong silhouette/value scores).

**What it unlocks.** The wing (95% of play) is SSSR-tier and owner-greenlit as a concept. The
plate atom is the anchor for the larger "plumage IS the armor" body rebuild (the hull's
torus/sphere jewelry and the recolor-wrapper tail are still the old parts — next). Head/tail
remain the next checkpoint.
