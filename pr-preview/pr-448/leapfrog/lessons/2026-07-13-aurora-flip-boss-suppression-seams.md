# 2026-07-13 — Aurora Shallows PR-4 THE FLIP: into the cycle, boss-free dream, smooth seams

**Why.** The Aurora Shallows biome shipped `?biome=6`-only (byte-identical world). The owner said "drop it
in," + two conditions: **no boss may interrupt the aurora run** (and "determine a good length" for it), and
**the transitions into/out of it must be smooth**. A Fable design pass produced the grounded plan; this is
the build. The one-line `CYCLE` edit was trivial; the two conditions were the actual work.

## The flip is one line — the conditions are the design
`CYCLE = [0,1,2,3,4,6,5]` slots Aurora between Lumen Mire (4) and Astral Shallows (5): biolume → AURORA →
cosmos. Mire→Aurora is the softest seam in the roster (both night; Mire's teal horizon `0x3fd8b0` is the
aurora's own hue family), and Aurora→Astral hands the **dying curtain off to the sky-whale** (`auroraMix`
1→0 as `whaleMix` 0→1). The cycle is now 7 long; audited every consumer — only `biomeAt` (`% CYCLE.length`)
and `level.js` set-pieces (already CYCLE-routed) care, and `keyShift` is absolute (not accumulated), so a
7th biome is safe. Blocks 0-4 reproduce the shipped order → gold-determinism untouched (course gen is
biome-blind; the fixtures never depended on biome).

## Boss suppression — the non-obvious part: FIGHTS TRAVEL
The naive fix ("no boss snaps into the aurora block") is **wrong**, and the reason is the reusable lesson:
a boss encounter is not a point, it's an **interval that scrolls forward**. During a fight the player is
speed-locked (`cruiseSpeed`) but `dist` keeps accruing, and card timers floor a fight at ~30s+ → a typical
fight covers **2-5 biome blocks**. So a boss that *starts* one block before the aurora is **guaranteed** to
still be raging when the curtain rises. **When you gate a travelling event out of a region, gate the region
AND its lead-in** — here a lookahead-2 in `snapBossDist`: `while (isAuroraBlock(d) || isAuroraBlock(d+L)) d
+= L`. Three pieces total:
1. **`snapBossDist` lookahead-2** — covers both scheduling paths (reset + `endEncounter` both route through
   it). Keyed on the **`aurora` FIELD** (`!!BIOMES[biomeIndexAt(d)]?.aurora`), never index 6, so it survives
   CYCLE edits and a double-aurora block.
2. **The trigger guard** (`... && !isAuroraBlock(player.dist)`) — a canyon can DEFER a due encounter and
   fire it at an arbitrary *unsnapped* distance the moment the canyon ends, bypassing the snap. Belt +
   suspenders: the start condition itself refuses the dream.
3. **Mute the audio foreshadow tolls in the dream** (mark the threshold consumed, skip `bellToll`) — a
   funeral bell mid-aurora breaks the spell (audio is the dream's medium), but **keep the silent horizon
   seed** (a still black arch on the dark horizon = "something waits beyond the lights"). The eta-750 toll
   naturally lands in Astral, so the dread compresses to the approach — the correct shape.
- **Rush mode is deliberately exempt** (unsnapped `RUSH_LEAD`/`RUSH_BREATHER`) — a rush run is wall-to-wall
  bosses by contract.
- **Honest residual, flagged to owner**: a *marathon* fight begun ≥2 blocks upstream can still be airborne
  as the aurora scrolls under it. Bounding that needs freezing the biome clock during fights (systemic) —
  parked. Lookahead-2 removes every *guaranteed* trample + every warn/banner/fly-in inside the dream.

## Run length — keep the 1500m block; the extension is a one-line DATA dial
1500m ≈ 30-45s of dream at cruise/flow pace; with boss-suppression the boss-free window is ~3300m ≈
50-70s. Against the game's beat vocabulary (flow runs 11-14s, fights 60s+) that's a full musical rest, right
size. **Rejected per-biome length** — `floor(dist/L)` with uniform L is load-bearing in `biomeAt`, the
hazard-local math, `setPiecesBetween`, and `snapBossDist`; variable length forces a prefix-sum into all four
and re-fixtures hazards (determinism risk for marginal gain). **The escape hatch if 1500m feels short:**
`CYCLE = [0,1,2,3,4,6,6,5]` — a DOUBLE aurora block, pure data. The internal 6→6 seam lerps every channel
between identical values (constant env), `biomeIndexAt` never changes (no duplicate popup/keyShift), and the
while-loop guard skips consecutive aurora blocks automatically. 3000m ≈ 50-64s, zero new machinery.

## Smooth seams — give ONE channel its own wider window; make the god-ray gate CONTINUOUS
The generic seam is a 150m color crossfade (`computeEnv` lerps every channel). For most channels the
Mire/Astral deltas are small. Two things needed care:
- **`auroraMix` is the brightest element in the game** — igniting it over 150m (~2-3s) reads as a light
  switch. **Fix: give the aurora channel its OWN window** (450m in / 300m out) inside `computeEnv`, branch-
  gated `if ((a.aurora || b.aurora) && ia !== ib)` so `lerp(0,0)=0` at every other seam → byte-identical
  elsewhere, and `?biome=6` (ia===ib) skips it → still pins 1.0. Do **not** widen `CONFIG.biomeTransition`
  (it's baked into hazard Law 5 and tunes every other seam). **Lesson: to soften ONE element's transition,
  give that element a private ramp — never widen the global seam.**
- **The god-ray gate was a hard threshold** (`auroraMix() > 0.5 ? 0 : dot`) → a visible pop mid-seam (Mire
  has dim live shafts). **Fix: make it continuous** — `dot(SUN_DIR) * (1 - min(1, auroraMix()*2))`: identity
  at mix 0 (byte-identical), fully off by 0.5 (same endpoint), smooth between, and it now follows the wide
  ramp. **A boolean gate that flips during a crossfade is a pop; multiply by a continuous factor instead.**
- props/`matIndex` switch discretely at the dominant-biome midpoint, but that's SPATIAL not temporal
  (instances 800m ahead are already correct when you reach them, under half-blended far fog) — verified on
  the filmstrip, left alone as every existing seam ships it.

## Verify (drive the states, don't just assert)
- `tests/auroraflip.mjs` (new) — replicates the private `snapBossDist` math against public
  `biomeIndexAt`/`BIOMES` and SWEEPS 3 cycles: no encounter lands in the aurora block or the block before,
  push is forward-only ≤2 blocks; + source regexes for the trigger guard + toll mute (the two guards no unit
  test can reach). `biomecycle.mjs` + `aurora.mjs §6` rewritten (the "no cycled biome lights the aurora"
  assert **flips** to "the aurora block lights it, with a ramp + no upstream leak"). gold-determinism green.
- `tools/auroseam.mjs` (new) — drives the REAL cycle (no `?biome` force), steps `player.dist` across both
  seams, reads live `auroraMix` per frame. Proved: entry `mix 0.00→0.26→0.75→1.00` over 7050→7500m (a dawn),
  exit `1.00→0.49→0.00` over 8700→9000m with Astral's violet + the sky-whale fading in. A pre-existing
  `badges.mjs` software-render timeout is unrelated (fails identically on clean master).

**Leapfrog.** Aurora Shallows is now LIVE in the rotation — a boss-free, smoothly-crossfaded dream run
between the biolume mire and the cosmos. Owner taste-calls left for the preview: the 3-night stretch
(Mire/Aurora/Astral back-to-back), the 1500m vs double-block length, and the foreshadow choices (seed kept,
tolls muted). Deferred: PR-5 flow-bias, PR-6 the SKYWEFT anchor boss (biome 6 declares no `anchor` yet).
