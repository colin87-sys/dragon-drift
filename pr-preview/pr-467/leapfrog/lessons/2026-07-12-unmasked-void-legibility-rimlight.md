# THE UNMASKED — void legibility: rim-light a silhouette that has no background to fall on

**What we did.** The shipped S2 "THE HOLLOW" void rendered the seraph *invisible* (owner: "so dark
you can't see anything… unplayable"). Fixed it in three moves — a palette hotfix, a self-lit boss rim
(+ backglow), and a wing tuck — while keeping the void's austere "absence" identity (owner picked
*austere & legible* over enriching it: the emptiness is the inhale that makes S3's full court land).

**The load-bearing finding (why "turn the brightness up" fails).** The scene's directional sun sits
*down-lane* and rakes the seraph's **back**; its camera-facing wing cards get essentially zero key
light — only weak hemisphere fill. So over the near-black void the body renders at L≈0.02 on a L≈0.01
sky: mathematically invisible. `lightSunI` is a **dead lever** for this boss. The real levers are
(a) the void's **hemisphere** fill (esp. `hemiGround` — the FRONT fill) + a lifted **midtone** sky
floor, and (b) **authored material value on the boss itself** (a painted, *emissive* rim — a real
THREE rim light can't rim a flat card facing the camera).

**The pattern (reusable).**
1. **Never a pure-black bg for a dark subject** (danmaku law). Lift the void floor off `0x05..` to a
   deep-violet **midtone** (`skyHorizon 0x2a1a4a`, L≈0.13) so the silhouette AND its bright rim both
   pop. Keep it ≤ L 0.20 or the certified bullet band (`0xa84167`) loses its direct-contrast margin.
2. **Self-lit rim = `setArenaHeaven`'s sibling.** `setArenaVoid(k)` lerps the wing rim mats toward a
   violet-silver **+ an emissive term** (reads with zero scene light) and lifts the feather ladder one
   value step toward a violet body; a low **backglow mandorla** (the `shatterBacklight` additive-disc
   recipe, violet, behind the plane) makes it dark-on-glow (the Hollow-Knight-Radiance inversion).
   `k` driven off the stateless `bossArenaMix()` — rises through the void, **exhales through the gold
   flood** so S3 restores the pure dark-on-gold silhouette that already reads. `k 0 ⇒ byte-identical`
   (guarded restore, exactly the heaven-lift idiom).

**Two gotchas that bit.**
- **A latent fairness hole:** `ARENA_CONTRAST[0]` hardcoded the void bg as literals while the heaven
  row referenced `HEAVEN_HEX` — so any palette lift would pass `bulletcontrast` while certifying the
  OLD background. Point contrast rows at the palette table (one source of truth), always.
- **Headless is fill-rate bound (software GL).** The first backglow disc at `DISC_R × 2.3` (~11u,
  near screen-filling additive) dragged headless FPS enough that the 2.5s natural-kill **exhale** no
  longer completed inside `unmaskedarena`'s fixed 3.36s poll (dt-clamping → accumulated game-time <
  wall-clock). It passed on clean master, failed on the branch — a real regression *surfaced by a
  timing-marginal test*, not flake. Shrinking to `× 1.6` (a tighter, better-looking mandorla) + a
  precomputed `LADDER_KEYS` (no per-frame `Object.keys`) recovered the margin. Lesson: a big additive
  plane is a headless-throughput tax even when it's hidden most of the run; size it to the halo, not
  the screen.

**Wings-in-water:** authored fix only (owner-safe) — lower pair `rotZ −1.20→−1.05`, `off.y
−0.42→−0.30`, and clamp the S3 mantle down-throw `FLARE_SIGN.lower −1.0→−0.6`. The six `wingEye` lock
organs parent to `stage2` at fixed seeds, NOT the wing pivots, so wing-angle edits **cannot** move a
comfort-audited organ (`unmaskedorgans` stayed green). Do NOT raise `stationY` — `wingEye0` already
peaks at the aim ceiling; a lift eats the margin.

**Verify:** `unmaskedarena` 37 · `boss.mjs` 126 · `unmaskedorgans` · `unmaskedreckoning` ·
`bulletcontrast`. New debug seam `bossDebugModelVoid()` (→ `arenaState.voidLift`) proves rim engage
(`k1`, emissive `0x6a5ca8`, glow on) + byte-identical off-void restore (rim `0x5b6472`, emissive 0).

**What it unlocks.** The finale's S2 is playable. Next: the heaven "pazzazz" (owner: plain/boring) —
a gilded cloudscape (value-space) + a light-pillar colonnade + a rose-window landmark (gated
`arenaSet.js` geometry), all *reverent-sparse* so the seraph still owns the frame.
