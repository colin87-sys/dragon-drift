# Mire: re-tint the Surge sky ember (a color reserved for one meaning can't also be a spectacle)

**What we did.** The owner noticed the Surge (fever) sky washes the whole dome MAGENTA — including during the
Ashtalon boss fight. Fable ruled (94 Q2) it detracts for a concrete, non-taste reason: **the Mire's color
grammar reserves magenta for DANGER telegraphs** (`0xff3dae`, "appears nowhere decoratively"), so a full-sky
magenta Surge wash makes the danger color decorative — worst of all *during* the boss fight, exactly when
magenta legibility matters most. Fix: re-tint the Mire's Surge sky EMBER (not suppress — Surge should still
feel like a power beat), which frees magenta to mean danger again. "The mire's organisms surge WITH you."

**The mechanism was already 90% there.** The sky fragment already had a magenta→ember `feverWarm` branch
(`horF = mix(magenta, ember, feverWarm)`) used by fire dragons (`setFeverWarm`, per-DRAGON). Fable's ruling =
hoist that choice to per-BIOME so it's skin-agnostic. Implementation:
- New per-biome `uSurgeWarm` sky uniform (default 0). In the shader, `_fw = max(feverWarm, uSurgeWarm)` drives
  the gradient ember-mix — so ember fires when the dragon is warm (unchanged) OR the biome forces it (Mire).
  **`max(feverWarm, 0) = feverWarm` → every other biome is byte-identical.**
- The magenta Surge sky-CURTAIN is `× (1 - uSurgeWarm)` — the Mire ZEROES it (a curtain is a sky-spectacle
  object, forbidden by the Mire's Canopy Law; the ember gradient carries the Surge read alone). `(1-0)=1`
  elsewhere → byte-identical.
- Driven per-frame `su.uSurgeWarm.value = env.surgeWarm ?? 0`; biomes.js Mire `surgeWarm: 1`, seam-lerped,
  0 default. Reused the existing shipped ember colors (`1.0,0.52,0.20` / `0.92,0.40,0.14`) — known-good.

**Why re-tint beats suppress (the Aurora contrast).** Aurora suppresses the same magenta wash via
`(1-uAuroraMix)` — but ONLY because its own curtain IS the sky spectacle and magenta would fight it. The Mire
has no replacement spectacle, so full suppression would make Surge feel like nothing in the one biome.
Re-tint keeps the beat AND deepens identity. **Suppress when you have a replacement; re-tint when you don't.**

**Gotchas.**
- The Surge on/off flag is **`game.feverActive`, not `player.feverActive`** — and the game loop RESETS it each
  frame from the fever meter, so setting the flag in a headless capture doesn't stick. The built-in seam is
  **`?debug=fever`** (main.js: forces `feverActive` + refills `feverTimer` every frame) — use that to capture
  a real Surge sky, not flag-poking.
- Fable's first pass scoped the fix to the sky GRADIENT + CURTAIN; the gate (97) then flagged the residual
  fever MOTE pink (`feverColor 0xff9aee`) as a cheap fast-follow — routed through the SAME `env.surgeWarm`
  (`_feverTint = lerp(feverColor, feverWarmColor 0xffcf6a, surgeWarm)`) so the Mire's Surge motes flare
  amber-hot, not pink. Now "magenta appears nowhere decoratively" is 100% delivered (sky + motes). The boss
  danger vignette is left ALONE on purpose — it IS the magenta danger channel we re-tinted the sky to protect.

**What it unlocks.** A reusable per-biome `surgeWarm` lever — any biome that reserves magenta for another
meaning (or just wants a warm power beat) can flip its Surge sky ember without touching the game-wide default.
