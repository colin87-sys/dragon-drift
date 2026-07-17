# Motes: the "confetti" tell is DEPTH-FLAT ALPHA, not halo size (Mire mote-field, Fable's 4.3→4.6 lever)

**Context:** Fable's full-ensemble gate (68) called the Lumen Mire mote field the #1 remaining
biome-level cheap-tell and the single biggest lever from 4.3→4.6+. This lesson records the fix + the
diagnosis, because it's counter-intuitive and reusable across biomes.

## The diagnosis (Fable 70) — stated precisely
The confetti read is NOT "too many motes" and NOT "the halos are too big" (the big soft near-halos are
the firefly identity the `size 0.82` surge lesson bought — they're gorgeous). The tell:
`THREE.PointsMaterial` attenuates SIZE with distance (`sizeAttenuation`) but the per-frame
`opacity = env.ambOpacity` is **one flat scalar for all 1200 motes** — so a mote 140m down the lane
shrinks to a 2-px dot that is *exactly as bright* as the 40-px halo by the lens. Uniform brightness at
every depth IS the literal definition of a 2-D screen overlay: it flattens the lane, peppers the dark
sky band at the top of frame, and eats the black mirror. **Fireflies die with distance; confetti
doesn't.** The fix is depth-scaled ALPHA, not fewer/smaller motes.

## The fix (both tiers, shipped together)
**TIER A — per-biome config (safe, other biomes untouched):** Mire `ambient` →
`{ color: 0xffb75c, fall: 0.05, sway: 1.1, size: 0.72, opacity: 0.70 }`.
- `sway 2.5→1.1`: 2.5 was ~2-3× other biomes on ONE synchronized `sin` frequency — the whole field
  wiggled at one metronome rate = screen noise, not air. (Motion sameness is a confetti contributor.)
- `color →0xffb75c`: one flat pale-amber at full brightness = "confetti paper"; deepening one step
  toward ember lets the glow texture's WHITE CORE read as the highlight → hot-cored fireflies, not
  1200 identical yellow dots. `size 0.82→0.72` keeps the big-halo identity (never below 0.65).

**TIER B — `moteDepthFade` per-biome shader lever (the actual ≥4.6 fix):** a uniform `0..1`, default 0.
Plumbed EXACTLY like `godrayMul` (biomes.js per-biome value + defaults `0` + computeEnv seam-lerp;
consumed in ambient.js). In the PointsMaterial (chained onto `bindAtmosphere` via `chainBeforeCompile`
so the fog chunk is preserved — never stomp a prior onBeforeCompile): pass view depth `-mvPosition.z`
to the fragment as a varying, then
`float df = clamp((vMoteDepth-20.0)/90.0, 0.0, 1.0); diffuseColor.a *= mix(1.0, 1.0 - df*df, moteDepthFade);`
Mire = 0.85, quadratic ease, window 20→110m: motes inside 20m untouched (hero halos), ~65m keeps ~75%
alpha (the swarm still leads the eye), 110m+ retains 15% (faint ember dust). This also solves the
UNTOUCHABLE global `COUNT 1200` — it trims perceived density ~35-40% *by depth*, the only correct axis.

## The safety guarantee (why it's byte-identical for the other 6 biomes)
`moteDepthFade = 0` ⇒ `mix(1.0, x, 0.0) ≡ 1.0` exactly → mote alpha unchanged → bit-identical rendered
output everywhere else. Same guarantee `godrayMul`/`godrayTint` ship on. One shared uniform object
(`moteFadeUniform`) assigned into `shader.uniforms` so the per-frame `.value = env.moteDepthFade` write
reaches the program. Motes are render-only ⇒ determinism untouched. Zero extra draw calls, one float
write/frame — mobile-safe.

## Verify
determinism byte-identical · graphicsfoundation 23/23 · atmosphere 25/25 · biomecycle 11/11 ·
0 console errors in Mire AND Aurora (a mote-heavy other biome, confirming no shader breakage). In-game:
the Mire trough now reads as near hot-cored halos over BLACK mirror, the far field recedes, the dark
sky band is near-clear.

## Reusable
- **A depth-flat particle alpha reads as a 2-D overlay no matter how good the near sprites are.** If a
  particle field "flattens depth / eats the dark", check whether alpha falls off with distance — size
  attenuation alone doesn't fix it.
- The `godrayMul`/`moteDepthFade` **per-biome uniform lever** (default = identity) is the pattern for
  ANY shared-renderer change that only one biome should feel — it keeps every other biome bit-identical.
- `chainBeforeCompile` to add shader surgery on top of `bindAtmosphere`, never a bare `onBeforeCompile=`.
