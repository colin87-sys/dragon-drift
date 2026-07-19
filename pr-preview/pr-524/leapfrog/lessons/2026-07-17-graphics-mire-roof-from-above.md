# Mire roof-from-above — the inverted-canopy money shot (altitude illumination)

**What we did.** Killed the "dark amber void at the top of the flight band" that the owner
flagged in a live screenshot (`illum-6360.png`). Above cruise there was 0% occlusion, no
corridor, no mirror — just motes in a warm void. Fix (Fable ruling 94 Q1, spec A1): a
**camera-following shader shelf** that paints the canopy *seen from above* — dark crown cells
drinking the light with amber welling up through the gaps, plus a corridor aperture that keeps
the lane column open so the under-canopy reads through it. Canopy Law INVERTED: "the mire glows
beneath you, and you are above the world's light." Fable gate **4.4/5 SHIP**.

## The reusable pattern: altitude-gated camera-following shader shelf
One horizontal `PlaneGeometry(900,900)` at world **y10** (`ROOF_Y`), `rotation.x=-π/2`, x/z copied
from the camera each frame (like `sky.position`) so it never runs out; 900×900 ⇒ edges past
`fogFar` so the rim always dies in fog. `ShaderMaterial({transparent,depthWrite:false,fog:true})`
with `THREE.UniformsLib.fog` merged → scene fog melts the shelf into the horizon for free.
`renderOrder=-1` (first transparent, after opaque water writes depth → z sorts shelf-over-mirror;
motes at renderOrder 0 composite on top). **`visible=false` at gate 0 ⇒ zero draws, zero pixels**
— the cleanest possible byte-identical-off (beats a `mix(1,·,0)` identity because it's literally
no geometry submitted).

- **Value-structure law on the floor itself:** crown-dark `mix(#120d06,#241b10, vnoise)` (mottled,
  never flat-black poverty, never lit — dead matter drinks); gap bloom `#f79a2e`; gap core
  `#ffd070` (hottest value in the lower frame, always ringed bloom→crown-dark); decay rim toward
  `#7a4210` so no gap has a hard lit edge (kills the onion-ring/flush-LED tell). Per-cell
  `breath = 0.88 + 0.12*sin(t*0.86 + ph)` with a second irrational-ratio octave → never metronomes.
- **Corridor aperture does three jobs in one term:** `corridor = smoothstep(10,26,|vWPos.x|)` —
  gameplay (rings/bosses in the lane column never occluded), the money shot (under-canopy visible
  straight down: mirror + lanterns + arch = "same organisms, other side"), and no player clipping
  (shelf at y10 but the open corridor covers all reachable |x|, and the gate is 0 below camY 23.6).
- **Altitude gate:** `smoothstep(ROOF_ALT_LO 23.5, ROOF_ALT_HI 26.0, camera.y) * (env.canopyRoof ?? 0)`.
  New default-0 lever channel (`canopyRoof: 1` on Mire only) → every other biome byte-identical,
  same pattern as surgeWarm. Also `&& !arenaPropsGate` — the boss-arena heaven never grows a swamp floor.

## The gotcha that shaped the whole spec: the y22 clamp means NO literal look-down
`laneMaxY` is **22** (config.js) and the chase cam rides `player.y + 4.6` → **max camera altitude
≈ 26.6, BELOW the drape crowns (minWorldY 28)**. So "above the roof" is never a literal top-down
onto a canopy floor — at the top of the band the camera pitches down ~17° and the drape simply
exits frame (that WAS the void bug). Consequence: **the shelf reads as crown mass owning the
top + flanks with the corridor showing the understory**, NOT a crown floor filling the frame.
Build to the honest band; don't chase a look-down the physics forbids. (Raising `laneMaxY` above
28 is a separate player-physics / gold-determinism PR — flagged to owner, not this lever.)

### The numeric-bar corollary (re-litigation guard — Fable A3 §3, binding)
The spec's first-draft §5 bars were written for a literal look-down and **mis-fire on the honest
band** — do not re-derive them:
- **Void-kill bottom-half ceiling ≤0.11 → RESCOPED to ≤0.18.** The already-merged glow-spill lever
  legally lights the near water in the bottom half (mean luma 0.13–0.14). The lit water IS the
  proof-of-light; darkening it would fight glow-spill, kill the reflections, murder the corridor.
  The lit bottom half is *correct*, not a miss.
- **Value-structure "≥40% at L<0.05 in the bottom half" → RESCOPED to the roof's actual home:**
  `topQtrLuma ≤ 0.08` with only amber-family clusters exceeding L 0.25 (frames: 0.019 / 0.025 —
  a near-total crown-dark night roof survives above). Crown-dark lives top+flanks, not the floor.
- Amber-gap band 6–16% stands (money shot 11.2% ✓). If `laneMaxY` ever rises >28, the ORIGINAL
  bottom-half bars come back unmodified — they're correct for that camera.
- **Theology on a hot pixel above frame-center:** `topQtrMaxL 0.884` (the gap-glow welling up
  top-center) PASSES. The rule is "no L>0.75 above the **horizon LINE**," not above the top quarter
  of frame. The 0.884 well is canopy *foreground* (below the fringe silhouette), metabolic
  (under-canopy glowcaps through the gap), amber R≥G≥B — inverted Canopy Law doing its job, not sun.

## High-altitude mote treatment (ambient.js) — same one-uniform, identity-at-0 recipe
Both shader-side on one new `uMoteAlt` (= same altitude gate), both exact `mix(1,·,0)` at cruise:
- **Size octaves:** bake `aMoteSize` once from a pure index hash `fract(sin(i*127.1)*43758.5453)`
  → 0.62 spore / 1.00 firefly / 1.55 lantern / 2.40 rare moth; vertex `gl_PointSize = size *
  mix(1.0, aMoteSize, uMoteAlt)`. Breaks the confetti-uniform tell.
- **Canopy-floor stratum:** `_band = mix(0.18,1,smoothstep(8,13,vWY)) * mix(1,0.35,smoothstep(camY+4,camY+14,vWY))`;
  `alpha *= mix(1.0,_band,uMoteAlt)`. **Note (Fable A3):** the stratification is *subtler* than
  spec'd — at this pitch most of the frame is below the drake so the geometry hides the band. The
  size octaves clearly read; the compression is faint. Not worth a revise; noted here so it isn't
  re-flagged as a bug next session.

## What it unlocks / backlog
- Reusable **altitude-gated shader-shelf** kit for any biome that needs an overhead/underfoot layer
  the prop budget can't afford (one draw, fog-melted, gate-0-invisible).
- The **rescope ruling** is the template for "a numeric bar written for one camera regime is wrong
  for another" — rescope to where the feature actually lives, keep the old bar for the old regime.
- Backlog (Fable A3, NOT this lever): pre-existing faint **cyan sky-dome fleck top-right corner**
  (identical in both frames, above the fringe) → graphics sky-dome debris, not the roof.
- Deferred hooks still open: will-o'-wisp light-carriers (glow-spill pool slot 3 reserved);
  optional chorus lift 0.30→0.36; optional Surge ember-band breathe. The Mire illumination pass
  (surge re-tint + glow-spill + roof) is now complete.
