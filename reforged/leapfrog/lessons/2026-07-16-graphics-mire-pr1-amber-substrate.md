# Lumen Mire PR-1: the Amber-Mire atmosphere substrate (biolume night, off-teal by construction)

**What we did.** Opened the full premium overhaul of **THE LUMEN MIRE** (biome 4) per
`BIOME-OVERHAUL-PLAYBOOK.md`, Fable-art-directed (research → verdict → build sheet
`reforged/LUMEN-MIRE-BIBLE.md`). PR-1 is the **atmosphere + materials substrate**: a `biomes.js`
biome-4 data retune (sky/fog/water/light/particles/fauna + `fogFarColor` + `heightK`), the biome-4
material retune in `makeMats` (dead/wet matter primary + living-amber accent), and a new per-biome
**`godrayMul`** lever. No props yet. Determinism byte-identical, biomecycle 11/11, bulletcontrast
clean, envcount all-green.

## Reusable lessons

1. **The anti-teal escape is a WAVELENGTH fact, not a taste call.** Real bioluminescence has a
   FORBIDDEN cyan/teal band ~490–510nm — every real glow sits to one side. Lumen Mire risked
   colliding with the Aurora night (teal-green, cool, still, sky-as-hero), so it commits HARD to the
   warm side: **firefly-amber `0xffc23a` dominant.** The old Mire hexes (`0x3fd8b0` horizon,
   `0x4dffd0` accent) sat IN the forbidden band; the retune moves the WHOLE biome off it. Blind test
   vs Aurora is now decisive (warm-amber-hazy vs cool-green-clean). Rule for any night biome adjacent
   to another: pick a side of the teal band and commit; don't split the difference.

2. **"Nothing shines from the sky" is a checkable theology that drove a code lever.** A night swamp
   has no sun-shafts, but the shared god-ray fan (`godrays.js`, driven by `sunFacing * 0.6` in
   `main.js`) blew a bright beige fan across the whole frame the moment Mire's amber horizon sat
   dead-ahead of the sun — the exact "over-poured god-ray fan greys out the scene" failure the Caldera
   lesson flagged. Fix: a per-biome **`godrayMul`** (default 1 = byte-identical everywhere; the
   three-touch env-lerp so it crossfades at seams; exposed from `environment.js` as `godrayMul()`,
   folded into the `setGodRaySun` intensity in `main.js`). Mire ships `0.15` — a dim residue that
   reads as glow-haze around the fungi, not a sun fan. This is the reusable "meter the fan" lever the
   Caldera composition gate asked for; future night/overcast biomes get it for free.

3. **The atmosphere substrate transforms 100% of pixels — prove the DARKNESS is beautiful before a
   single prop** (the Lost Lagoon PR-1 lesson, re-confirmed). PR-1 touched only data + material
   colors and the biome flipped from a flat teal night to an unmistakable warm bioluminescent swamp:
   black-mirror water (`waveAmp 0.2`) doubling the amber glow, amber motes as the identity air,
   amber-stained distance fog (`fogFarColor 0x2b2314` — distance desaturates TOWARD gold, the cheapest
   identity move), a dark warm-neutral sky roof. The legacy placeholder mushrooms now read as amber
   swamp caps for free. The blind-test-vs-siblings gate must pass on the substrate ALONE.

4. **"Life glows; matter drinks" maps onto the engine's hard 2-material cap for free.** Mire's value
   ladder is a per-part LIVING/DEAD material split, not a normal-keyed vertex bake — which is exactly
   what `mergeParts`' ≤2 groups already gives you: `primary[4]` = near-black wet matter (a low
   emissive floor only, never a light source), `accent[4]` = the sole emitter (living amber). No new
   ladder machinery needed at the substrate stage (that arrives with the hero's recessed under-brim
   gills). The dark primary is the FOIL that makes the glow legible; resist lifting it.

## The gotcha

`godrayMul` needed all THREE touches or it silently does nothing: the field in `BIOMES[4]`, the lerp
in `computeEnv` (+ the scratch-env default `godrayMul: 1`), and the consumer in `main.js`. And it had
to be **exposed through `environment.js`** (mirroring `auroraMix()`), because the god-ray intensity is
set in `main.js`'s render loop which never sees the `env` scratch object directly — the getter is the
seam. A per-biome render lever that lives outside `updateEnvironment` needs an explicit getter, not a
field read.

## What it unlocks

The Amber-Mire identity is proven at the substrate level (theology "the drowned forest makes its own
light"; firefly-gold off the teal band; the black mirror; the god-ray meter). PR-2 builds the depth +
canopy substrate (the fog-veiled canopy wall + the overhead drape layer that enforces the Canopy Law —
the sky is never composed — via geometry, since there is no per-instance altitude), then PR-3 the hero
Glow-Cap Colossus proves the whole under-brim glow theology on one object. Full plan + roster +
hazards + anti-replication audit in `reforged/LUMEN-MIRE-BIBLE.md`.
