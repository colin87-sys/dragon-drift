# Mire will-o'-wisps — a wandering withheld light (placement, not brightness, makes it exist)

**What we did.** Built the last reserved Mire illumination hook: 3 render-only additive ghost-flame
sprites that WANDER the dark stretches between hero clearings, hug the water, and feed the reserved
water-pool slot (`_spillPools[3]`) as a mirror streak. The one lever that adds MOTION to the Mire's
light — everything else is anchored to gate/spire/chorus positions. Fable gate: round 1 **3.6 REVISE**,
one dial, round 2 **4.5 SHIP**. Also shipped the chorus glow-lift `0.30 → 0.36` (Fable SHIP, no revise).

## The reusable pattern: an analytic wandering additive sprite (no light, no assets, determinism-safe)
- **3 `THREE.Sprite`s, boot-created + parked**, one shared procedural 64² radial-gradient canvas
  texture (core `#ffeec4` → bloom `#ffc768` → skirt `#f79a2e`→0 — the value-structure law baked into
  the sprite). `AdditiveBlending`, `depthWrite:false`, `depthTest:true` (boles occlude → the
  pass-behind-a-trunk depth sell), `fog:true` (far ones melt into the aerial ladder).
- **No new light.** The wisp READS as light; it does not CAST it. The illusion of casting is sold by
  the mirror — the nearest visible wisp writes `_spillPools[3]` (a tight `invR 0.5` amber streak),
  so the orb stands over its own reflection. A real PointLight out over open water buys almost no
  lit geometry per lumen and would blow the fixed light-loop budget — rejected.
- **Motion is analytic** from `heroHash(k^salt) + wall-clock t + along-track dist`: per-120m-cell
  existence hash (~30% stay dark → no runway), ±55m gate-clear (never share a stretch with a hero
  glow), Lissajous wander on irrational-spread periods (the `mireBreath` anti-metronome recipe —
  slow = intent, never jitter), and an own **gutter clock** (faster + deeper than the organisms'
  breath: a flame, not a lung). Zero `rnd()`, zero placement reads, zero per-frame alloc → gold
  determinism byte-identical, render-only.
- **Byte-safe off:** the whole block lives inside `updateMireSpill`, gated by the existing Mire
  `seam`; outside biome 4 the sprites are `visible=false` + slot-3 strength 0 → byte-identical in
  the other 6 biomes and at seams. `?wisp=0` parks them (the A/B + determinism control, mirrors
  `?spill=0`).

## THE lesson (Fable's, verbatim in spirit): near-band PLACEMENT, not brightness, makes a small withheld light exist
Round 1 the wisps sat at **15–24m off-lane** ("over the open bog, outside the corridor" — the spec's
composition thesis). Fable scored **3.6**: the ghost *did not exist on screen*. Two failure modes,
both placement:
1. **Near wisps exited the frustum.** A wisp at 14m depth + 23m lateral is ~59° off-axis — off-screen.
   So the ONE range where a wisp is unmistakably bigger than a mote (near, rel<15) was never in frame.
2. **Far wisps landed in the pillar/shroom margins** — the busiest amber real estate in the biome —
   where a 3px hot core is one orange dot among forty, indistinguishable from the mote/bloom field.
The instinct is to reach for a brightness/size/hue dial. **All three are the wrong dial** (Fable
rejected each): a whiter core changes nothing at 3px and a hue split is the cheap-tell we refuse; a
4m sprite in the pillar margin is just a *confusing* mote and erodes withheld-glow; count was never
the problem. The fix was **one line — pull the off-lane band inward, 15–24m → 11–17m** (`x0 =
side*(11 + 6*hash)`). That put wisps just outside the bole line (pillars at ±10.5): in-frustum when
near (the hot core + core→bloom→dark finally shows), crossing the *dead* lower mirror field (the
reflection streak lands on visible water at a non-grazing angle), and picking up MORE trunk occlusion
for free. Round 2: **4.5**. **Rule: before touching any intensity/size/hue dial on a small withheld
light that "won't read," first check it is in the frustum's DEAD real estate when near — placement
is the usual culprit, and it's one line.**

## Verification gotchas banked (headless capture of a MOVING element)
- **`time = clock.getElapsedTime()` advances even at `timeScale 0`** — freezing the world does NOT
  freeze a wall-clock-driven sprite. So an on-vs-`?wisp=0` A/B captured across two boots is at
  different mote/water phases; the whole-frame luma diff is phase-noisy. Trust the *localized* wisp
  region, not a global amber-pixel count.
- **Probe→capture drift:** auto-picking a good dist from a fast position-probe then re-capturing
  after an 850ms settle FAILS — the wisp wanders out of the pose (±11m along-track). **Read the
  positions AT capture** (same frozen instant as the screenshot), sweep a fine dist grid, and pick
  the winner from the captured set. Don't pre-pick from a separate probe pass.
- **Projection ≠ visual center for a sprite+reflection.** Sampling an R2 patch at the projected
  sprite center under-reads the core (round-1 "orbCoreLuma 25" false miss); the bright blob is the
  orb core + its water pool, offset ~34px below the projected point. Box-scan a region for the peak
  instead: corrected read was **216/255** (over the ≥200 bar), region lift **+68/255** over off.
- **Watch for boss frames in a dist sweep:** one sample (d6500) caught the Ashtalon boss spawn — its
  skull + pink ring contaminate the frame. Discard boss frames from a cruise-ambience gate.
- **Don't confuse the drake's cyan trail reflection** (blue dots down the centre lane, present in
  BOTH on and off) with wisps (amber, off-lane).

## Deferred / taste notes (Fable B5 §5 — non-blocking)
- The slot-3 reflection reads as a soft warm pool rather than a strongly anisotropic vertical streak
  at cruise camera height. Within the read (the pair grammar works); if a future polish pass touches
  slot-3 anisotropy, a touch more vertical stretch would sharpen the "candle over black water" read
  at lower proximity. Do not act on it standalone.
- Wisps do NOT lure/path/mark pickups — folklore wisps mislead travelers; the moment anyone wants a
  wisp to MEAN something in gameplay, that's a new owner call, not a tuning pass (Fable B1 §5).
