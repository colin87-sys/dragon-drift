# 2026-08-17 — Additive light cannot hold a hue over a bright sky (wing-lab I3.1)

**Did / learned.** The Forgewing's ember shed washed toward white over the sky tile, and every
instinct said "tune the emitter". It cannot be tuned, and the reason is arithmetic: **blending
happens after the tone-map**, so an additive spark over a sky at byte (143, 184, 221) is a sum
in *display* space — and the first channel to reach 255 is BLUE, the one channel the fire canon
requires to stay lowest. Every amber bright enough to be seen there is white by construction.
No gain, hue or exposure changes which channel saturates first.

The fix is the blend, not the emitter: composite (`a·src + (1−a)·dst`) instead of adding. Then
every ember pixel is a *convex combination* of the rod's colour and the backdrop, so white is
not merely avoided, it is unreachable — it would require the rod or the sky to be white, and
neither is. The price is the additive bloom on dark backdrops, paid knowingly.

Two things that fought back, and both generalise:

- **A sub-pixel quad arrives pre-diluted.** The rods were ~0.5 px wide, so the antialiaser
  resolved them as ~35% ember and ~65% sky *before* any blend maths, and a 35% mix of amber
  and sky is grey. The fix is to separate the **geometric** width from the **optical** width:
  build the quad 2.4× wider (same four corners, same two triangles, zero cost) and add an
  across-rod coordinate so the shader paints a solid core down the spine with the glow falling
  off to the edges. The spine pixels are then fully covered and the colour survives.
- **ACES desaturates on the way up, so an emitter authored to be ADDED is the wrong colour to
  PAINT.** The old rod, measured at its ignition peak, tone-mapped to byte (234, 200, 132) — a
  pale straw whose green sits 16 bytes from the sky's own. Painted rather than added, that is a
  grey speck. Re-solving the linear triple for a *target post-ACES byte* gave (1.25, 0.140,
  0.005) → (255, 140, 45), saturation 0.82 instead of 0.44. Measured over sky: core hue 9.6°,
  0.0% washed white, against the old shed's 74.9%.

**→ Systematize.**

1. **Author emitters in output space, then invert.** Decide the byte triple you want on screen,
   run the tone-map + transfer function *in the tool*, and solve for the linear value. Guessing
   linear values and looking at the render is how (1.00, 0.46, 0.12) became straw. A 30-line
   ACES-forward helper makes this a five-second job for any emissive in the repo.
2. **"Is it white?" is only answerable against what the pixel replaced.** The honest ember
   measurement isolates the shed by DIFFERENCE (render with and without it — FX cannot be
   mask-classified, because the vertex shader moves it), keeps only the pixels standing against
   the backdrop under test, and calls a pixel washed only if the effect *brightened* it AND
   desaturated it. Without that last clause the probe scores untouched sky as a defect; without
   the difference pass there is no ember set at all.
3. **Geometric width ≠ optical width** is a free lever anywhere a thin bright thing must hold
   its colour: sparks, tracers, rain, cords, hairlines, UI rules. Widen the quad, shape it in
   the shader.

**→ Leapfrog.** Both halves are reusable immediately. The ACES-inversion helper retires
"tune the emissive until it looks right" across the roster; the wide-quad/optical-core pattern
is the cheap route to sparks and tracers that stay warm on bright biomes (desert noon, snow,
the pale sky tiles) where every additive particle system in this repo currently blows out.
