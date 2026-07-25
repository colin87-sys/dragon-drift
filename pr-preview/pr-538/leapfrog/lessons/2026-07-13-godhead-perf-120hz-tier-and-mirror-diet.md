# GODHEAD arena perf — the 120Hz tier oscillator, the heaven mirror diet, and the ember-fill reclaim

**What we did.** The owner played the S3 heaven on an **iPhone 17 Pro Max** and reported TWO linked
problems: (1) the background "changes randomly", and (2) the frame rate drops (HUD: `avg 52, min 20,
max 91, calls 573, tris 67k, tier 1`) on a device that should never dip. A Fable perf pass found the
two are ONE story, and the fix is mostly draw-call + controller work (no art change).

**The reframing fact: `max 91fps` proves the panel is 120Hz (ProMotion), not 60.** Every adaptive-tier
threshold in `main.js updateQuality` was tuned for 60Hz vsync (fpsAvg asymptotes ≤ ~60, so restore was
set to 58). On a 120Hz panel fpsAvg genuinely swings ~50–91 and clears 58 constantly → **tier 0↔1
oscillation**. And every tier flip does two bad things at once: it **repaints the background** (`uOct`
FBM octaves 3↔2, embers 1536↔768, pixelRatio 2↔1.5, bloom scale/strength) — that IS the "random"
change — AND it **hitches** (`setPixelRatio` + `composer.setSize` realloc the full-screen RT, and the
water mirror rebuilds + recompiles), which is the `min 20fps` floor (exactly the `rawDt` clamp — a
≥50ms stall, at 314 calls i.e. *below* the median, so a hitch not throughput).

**Fixes shipped (all invisible; the look the owner just approved is untouched):**

1. **Heaven mirror diet (`water.js`) — the single biggest line item.** The reflective water re-draws
   the whole layer-0 scene into an RT every frame (~268 of the 573 calls). In the settled heaven that is
   near-pure waste: the detonation/embers/debris are **layer-1-excluded** from the mirror, props are
   hidden, the sea is a dim haze-deck dropped 30u, and the "sea answers the blast" gold column is the
   **analytic `sunColor` specular, not the mirror**. So gate the refresh on `arenaDropK > 0.5`: tier0
   half-rate, tier1 quarter-rate (`_parity & mask`), reusing the proven **stale-texture + stale-matrix**
   skip idiom (freezing both together = no swim). Reclaims ~135–270 calls/frame in the arena at ~0
   visible cost. Weak mobile inherits the same saving.

2. **Tier controller robustness (`main.js updateQuality`):**
   - **The hitch-rejection was DEAD CODE.** `updateQuality(rawDt)` received the already-`min(dt,0.05)`
     clamped delta, so `if (dt > 0.25)` could never fire. Now the caller passes the **unclamped** delta
     as a second arg `hitchDt`; the guard finally rejects real stalls (incl. the tier-flip's own realloc).
   - **High-refresh latch:** a sub-13ms frame can only occur above 60Hz → latch `highRefresh` and raise
     restore 58→**72** (demand real headroom before daring a costlier tier). A 60Hz device never trips it
     (preserves the earlier stuck-at-tier-1 fix).
   - **Anti-ping-pong:** if we degrade <8s after a restore, that tier isn't sustainable → double the
     required restore dwell (capped 24s); a 30s stable stretch forgives it. Stops the hunt.

3. **Ember-fill reclaim (`arenaSet.js`).** The I1 curved-comet rework (1 quad → 3-seg ribbon + slower
   blowout) cost ~2.5× ember fill. `EMBER_N 1536→1152` (+ tier-1 drawRange 768→576) — a curved comet
   reads DENSER than a straight dash, so fewer trails hold the mass; visually identical, fairness-positive.

**The trap we avoided — never default-on a path whose own parity test is red.** Fable recommended
defaulting the N4 particle **batch** backend ON ("150 draws → 1"). But `tests/particlebatch.mjs` is
**failing**: the batch path builds its instanced mesh yet still submits the per-sprite draws → calls go
`233→234` (it ADDS a draw, saves nothing). Defaulting it on would have hurt. **Left OFF**, bug recorded
for a separate fix. Lesson: when an assessment says "X is parity-tested, turn it on," RUN the test first
— the map is not the territory.

**Verify.** `unmaskedarena` 57/57 (ember 1152, fairness under gate: corridor p90 0.38/p50 0.15, sky
p95 0.85/p50 0.46, tier-2 graceful degrade). `passbudget` 19/0. Heaven boots clean with the diet live
(`dropK 1`, 0 console errors). Draw-call deltas can't be sampled from outside the render loop
(`renderer.info` resets per frame) — the mirror-skip is the shipped N11 idiom extended, sound by
inspection + Fable's headless `renderer.info` decomposition. The real proof is the owner's **on-device**
FPS HUD on the preview (should settle at a locked 60/120 and stop tier-hunting → the background stops
changing). NaN law untouched (no shader math changed).

**Deferred (offered/pending owner):** the Surge-in-heaven palette (the OTHER half of "background
changes" — Surge washes the gold sky magenta for 8s; awaiting the owner's warm-vs-magenta call);
palette-invariant tiers (fractional `uOct` cross-fade + constant bloom scale) so any *residual* flip is
invisible; hitchless mirror-resize (RT `setSize` instead of rebuild); MSAA 4→2 at tier 1; the particle
batch bug; instancing the seraph's 104-call wing fan.

**Reusable.** (1) `max fps` in a perf HUD is a refresh-rate tell — tier thresholds tuned for 60Hz
oscillate on 120Hz; gate restores on real headroom + a high-refresh latch. (2) A reflective mirror is a
whole extra scene render — duty-cycle it wherever the reflection is dim/static/excluded (freeze texture
AND matrix together). (3) Feed the tier controller the UNCLAMPED delta or its hitch guard is a no-op.
(4) Run the parity test before trusting "it's parity-tested."
