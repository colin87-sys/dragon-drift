# Making screen-space god-rays read PREMIUM: dither, soft-knee, drifting bundles, radial confinement

**Context:** Owner, blunt, on the Tempest sky re-grade: *"those ray things look pretty basic and cheap and
not premium — this ain't AAA at all."* He was right, and Fable had flagged it too (hard-edged full-frame
sunburst wedges, "vaporwave"). The god-rays are a **shared** screen-space radial-scatter post-FX
(`godrays.js`), so the quality fix improves EVERY biome; only intensity/tint/break are per-biome.

## Why a radial light-scatter god-ray reads cheap — and the five cheap-tells' kills

The classic march (each pixel steps toward the sun through an occlusion mask, accumulating "light reached"
× a decaying weight) has five failure modes. All five fixes are per-pixel-trivial (mobile-safe):

1. **Banding → clean geometric wedges.** No per-pixel jitter on the march START means every pixel samples
   the same discrete steps → aliased radial bands that read as a hard sunburst. **Fix: dither the start
   with interleaved gradient noise, full one-step jitter** — `coord = vUv + delta * ign(gl_FragCoord.xy)`.
   The noise averages over the ~40 taps into smooth gradients. This is THE single biggest premium win, and
   it's a pure upgrade for every biome. (Bonus: dither hides undersampling, so you can drop tap count.)

2. **Neon bands.** A soft knee on the accumulated shaft caps any pixel from blowing out:
   `shaft = shaft / (1.0 + 1.5*shaft)`. Global, free.

3. **Edge-to-edge shafts = sunburst, not crepuscular light.** Real storm-light is confined near the break
   and dies mid-frame. Two moves: shorten the march (`uDensity 0.85→0.62`, `uDecay 0.96→0.94` so end-illum
   ~0.08 not 0.20) AND a radial confinement `shaft *= smoothstep(1.05, 0.18, length(dvec))`.

4. **Clean radial geometry.** Break the fan into drifting crepuscular BUNDLES: modulate by the angle around
   the sun with two incommensurate sines drifting GLACIALLY (0.11 / 0.05 rad/s — breathe like cloud, never
   strobe): `bundles = 0.55 + 0.45*sin(ang*9 + t*0.11)*sin(ang*17 - t*0.05); shaft *= mix(1, bundles,
   uBreak)`. `uBreak` is per-biome (0.35 default = subtle everywhere; a storm ramps to 0.55).

5. **Too bright + saccharine tint.** Intensity was the amplifier — dial `godrayMul` down (Tempest 0.50→
   0.30, "felt not shouting") and pale the tint off amber-gold (`0xffd28a → 0xffe6bd`); saturated gold
   against a blue scene is what pushed the wedges to read violet. The GOLD statement belongs to the emissive
   sockets, not the sky.

(Item 5 on the MASK side — a separate quarter-res 4-tap blur pass for softer shaft ROOTS — was left on the
shelf: the dither already carries the soft read, and a per-step 4-tap would be 160 samples/pixel. Add the
separate blur PASS only if device shows razor roots.)

## Wiring a new per-biome post-FX meter (the pattern)
`uBreak` follows the exact `godrayMul` path: default in the biomes.js env scratch (0.35) → seam-lerp in
computeEnv (`env.godrayBreak = lerp(a??0.35, b??0.35, ts)`) → `_godrayBreak` + `godrayBreak()` getter in
environment.js (set from `env.godrayBreak` in the per-frame env fan-out) → `setGodRayBreak()` in postfx.js
→ uniform set each frame in updatePostFX. **Gotcha:** the GETTER is exported from environment.js, the
SETTER from postfx.js — import each from the right module in main.js (a `godrayBreak is not defined` boot
error is the tell you imported the getter from postfx). `uTime` = `performance.now()*0.001` (visual only,
non-deterministic is fine — god-rays aren't in the gameplay-determinism path; gold-determinism stays green).

## Regression discipline for a SHARED shader
Changing `uDensity`/`uDecay`/confinement changes every biome. Verified Frozen — its sungate shafts came out
SOFTER and cleaner (net upgrade), not shortened-to-nothing. If a biome's long clean shafts had been
load-bearing, the escape hatch is to promote `uDensity`/`uDecay` to per-biome meters and keep the old values
there. `uBreak` is per-biome by design; the dither + soft-knee are unconditional upgrades.

## Result
Tempest rays went from hard violet sunburst wedges to soft, confined, drifting storm-light. Boots clean,
gold-determinism byte-identical. Gate on device (headless flatters shaft luminance by ~a stop). Backlog
(Fable, same gate): the water CONFETTI (uniform checkerboard sparkle — cut ~60%, cluster foam at collars)
is now the co-loudest cheap tell, and a distance value-ramp on tempestStone (onBeforeCompile, not
instanceColor) for the NatGeo near-dark foreground.
