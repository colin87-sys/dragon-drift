# I5 vision pass — author amplitude in CAPTURED-PIXEL space, not emissive space (6.5 → PASS 7.5/10)

**What we did.** Drove the ambient Surge from the burst-critic's 6.5/10 ("front half ignites,
climax missing") to a PASS 7.5/10 across three gated rounds: head-first corona, level
wing-spread + rim pulse, screen-space tail-crack flash, horizon-band compression, station-gated
FX, and finally an amplitude pass tuned against measured pixels.

## The lessons

1. **The tonemap knee eats authored amplitude — verify in captured pixels, always.** Three
   "fixed" effects (tail crack ×2.6 emissive, Solar settle ×0.78, breathe ±12%) were correct in
   emissive space and *invisible on screen*: above the knee, 1.0 and 0.78 clip to the same
   pixels, and a ±12% swing compresses to ~3%. The gate-critic's law, now ours: set targets as
   pixel counts on real captures (`tail-zone px>L200 ≥300 at the beat, <50 by full`,
   `lit-delta ≥8% between counter-phase holds`) and tune until the CAPTURE hits them.
   `tools/surgeburst.mjs` prints these acceptance numbers every run.

2. **A tinted glow map caps your luminance ceiling.** The crack sprite reused the dragon's
   blue aura texture — a blue core can *never* reach L200 whatever you multiply it by
   (luminance = 0.3R+0.6G+0.1B). Discrete flash elements that must hit the CORE band need a
   neutral WHITE map; take hue from a ≤30% lerp, and push through the knee with HDR color
   (>1 on an additive sprite is legal and effective: ×2.2 → true white post-ACES).

3. **`min(x, 1)` clamps silently kill modulation on your brightest carriers.** The breathe
   rode casLevel, but corona/aura/pool all consume `Math.min(casLevel, 1)` — at sustain the
   levels sit above 1, so the swing vanished exactly where it mattered. Route modulation
   through its own channel (`breatheK`) applied to the *opacity* of the bright carriers.

4. **Hero dragons own their materials — generic levers miss them.** Vesper's wing kit ignores
   `wingMat`; its tail tines carry no flare mats. Two levers reach every dragon regardless:
   the RIM registry (every mat's silhouette edge) and SCREEN-SPACE sprites anchored to
   guaranteed bones (`tailSegs` tip, head offset). Both need `depthTest:false` + `layers.set(1)`
   (the body eats depth-tested sprites in rear-chase; layer-0 sprites miss the FX pass).

5. **Counter-phase your sustain captures.** sus holds at 3.2s and 8.1s sampled ~the same phase
   of the 0.22Hz breathe (1.08 periods apart) — the pair could never show the envelope, and a
   critic "failed" the breathe on it. Pin the second hold half a period away (5.5s).

6. **Measure the breathe as mid-band area, not frame mean.** The final critic resolved
   "alive vs strobing" with one stat: mid-band (L100–180) lit AREA swings +34–50% while the
   frame MEAN moves ~1% — a creature breathing light, photosafe by construction.

## The verdict trail

6.5 (front-loaded, climax missing) → 7.0 (travels, but amplitudes sub-visible) → **7.5 PASS**
(complete greyscale-first cascade on both heroes; world half ship-grade throughout at 8/10).
Remaining items are ranked one-knob owner dials, led by: crack sprite shape (balloon → whip-crack:
smaller radius at the TIP + a ≥L235 core), Solar breathe depth, crystal sustain dominance,
gold-band mass, wing-pulse pose timing.

## What it unlocks

The pixel-space acceptance pattern (author → capture → count → tune) is the verification
spine for any future glow/flash work; the rim-registry + anchored-sprite pair is the roster-safe
lever set for per-dragon accents.
