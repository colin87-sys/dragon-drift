# God-rays, final: judge softness at DEVICE exposure, erode to close leak-lines, flatten the bundle

**Context:** Third god-ray round. The owner, on device, kept calling the shafts "too solid / hard lines"
even after the mask-blur + curved-bundle pass — and I'd twice told him it was a stale deploy. It wasn't: I
pulled the deployed `godrays.js` straight off the gh-pages preview store and confirmed the soften WAS live.
The real gap: **headless captures render ~1 stop brighter than the owner's phone, so a soft-looking headless
shaft still reads as a hard countable band on a darker panel** (higher effective shaft/gap contrast).

## The three device-calibrated fixes (Fable)

1. **Gate softness on a 0.5×-darkened copy of the capture.** `PIL.ImageEnhance.Brightness(im).enhance(0.5)`
   ≈ the owner's panel. At THAT exposure, the pass = zero countable edges. This is now the god-ray gate —
   never judge ray softness on the raw bright headless frame again.

2. **A blur SPREADS a bright gap; only an ERODE closes it.** The thin bright *lines* (distinct from the broad
   bands) were shafts leaking through sub-texel gaps — arch crowns, stack tips — that the quarter-res mask
   couldn't resolve. Prepend a **5-tap MIN erode** (dilate the dark occluder) BEFORE the tent blurs. Then two
   Kawase tent iterations (offsets 1.5, 3.25) ping-ponging two half-mask-res RTs → ~16 full-res texels of
   penumbra. Erode-then-blur, in that order: closing leaks is a different operation from softening edges.

3. **On a dark screen, countability comes from the GAPS, not the lobes — so flatten the bundle.** floor
   0.70→**0.86**, amp 0.30→**0.14**, and **drop the high-frequency (12.7) term entirely** (it made discrete
   stripes) — one slow low-freq sine carries an uncountable drift. Drop uBreak 0.55→0.32. Then crush peak
   luminance (the "solid" read IS peak): knee `/(1+1.5·shaft)`→`/(1+2.4·shaft)`, uWeight 1.05→0.80,
   uDecay 0.94→0.90, uDensity 0.62→0.55, and godrayMul 0.26→0.19 (the owner ruled the rays ATMOSPHERE, not a
   statement — the breach disc carries the eye-catch, so the old 0.24 "statement floor" didn't apply).

Result at device exposure: a faint warm-violet radial glow with slow uncountable drift — light as weather.

## Meta
- **When device feedback contradicts your headless capture, believe the device and re-calibrate your gate —
  don't blame the cache.** Verify the deployed artifact (read the file off the store) before claiming stale.
- The CI build stamp ≠ your local stamp: CI rebuilds `head merged with live master`, so the content hash
  differs from your local `head + the-master-you-merged`. Don't send the owner chasing a hash you computed
  locally; confirm via the deployed file or just tell them "I'll say when it's live."
