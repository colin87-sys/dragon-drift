# God-rays reading "solid lines" has TWO causes — the mask edge AND the bundle geometry

**Context:** After the first god-ray premium pass (dither + soft-knee + bundles + confinement + dimming),
the owner on device: *"heaps better, but those rays from the centre still read a bit cheap — the lines are
still too solid."* The dither had fixed the *march* banding but the shafts still resolved into ~4–5 countable
bands. Fable's diagnosis: this is **two independent problems**, and fixing only one leaves the tell.

## Cause 1 — hard shaft EDGES (the binary mask)
The occlusion-mask radial march blurs light *along* each ray, never *across* an occluder silhouette — so
every shaft-to-gap boundary is a razor step no amount of radial sampling softens. **Fix: blur the mask once
before the march.** A per-step 4-tap kernel would be ~160 samples/pixel (mobile-fatal); instead run ONE
fullscreen 4-tap tent pass at *half the mask resolution* into a `blurRT`, inside the existing 1/3-frame mask
duty-cycle, and point `godRayTexture()` at the blurred RT (the march still samples once/step). The half→
quarter-res downsample + a ±1.25-texel diagonal tent + bilinear ≈ **~10 full-res px of penumbra** on every
shaft edge for ~one quarter-res draw every third frame. Knobs if device still shows roots: widen the tap
offset 1.25→1.75, then a second Kawase iteration (never more than 2, never blur at mask-res — thin occluders
like wingtips start leaking).

## Cause 2 — the countable band STRUCTURE (the bundle function)
This is the one you'd miss. `0.55 + 0.45·sin(ang·9)·sin(ang·17)` over the ~90° visible fan produces almost
exactly 4–5 beat lobes, and **every lobe edge is a straight line through the sun point** — that geometric
straightness is what reads "vector graphic," independent of edge softness. Two fixes in one edit:
- **Radial shear:** add a phase term that drifts with distance from the source — `ph = dist·2.6`, folded
  into both sines — so lobe edges CURVE instead of raying out as straight spokes. Curved bands are very hard
  to count and read volumetric.
- **Raise the floor, drop the amplitude:** `0.70 + 0.30·…` (was `0.55 + 0.45`) so gaps bottom out at ~0.67×,
  not ~0.50× — modulation, never on/off wedges. And use **non-integer frequencies** (5.3 / 12.7) to break
  the even beat count.
- Bonus: the "violet rays" complaint was largely *simultaneous contrast* — warm-lifted wedges made the
  untouched gaps read violet. Lowering wedge/gap contrast fades the violet read too.

## Cause 3 is NOT dimming
Dimming alone just gives fainter countable bands — softness is the fix. Only AFTER 1+2 land, trim intensity
a hair (Tempest godrayMul 0.30→0.26; floor ~0.24, below which the eye-breach statement dies).

## Reusable
- **"Countable bands / solid rays" = attack the MASK edge and the MODULATION geometry separately.** A soft
  edge on a straight-line lobe still reads as a line; a curved lobe with a hard edge still reads countable.
  You need both curved AND soft.
- **A mask-space blur belongs in the mask's duty-cycle branch,** not the per-pixel march — amortize it.
- Shared-shader safe: other biomes get only the softer mask (pure upgrade) + a gentler bundle at their low
  uBreak 0.35. Boots clean, gold-determinism byte-identical (post-FX is visual-only). Gate on device —
  headless runs ~1 stop bright and flatters shaft contrast.
