# Prop RHYTHM is an engine, not a `step` — the fence that had no congregation branch

**Context:** The owner flew the completed Tempest roster on device and it still didn't "wow." Fable's device
critique (grounded in the actual placement numbers) scored it Vision 2.5 / Rhythm-&-placement **2/5** — "the
frame is a fence, not a coastline." The individual prop families were fine (4.2-gated); the *generation* was
the problem.

## The root cause: a missing engine, not bad numbers
`writeMatrix` dispatches congregation per biome — `if (bi===2) frozenComp … else if (bi===3) calderaComp …
else if (bi===4) mireComp …`. **There was no `bi===7` branch.** So every Tempest prop with a `comp:{}` block
had that block silently *ignored* — every allocated slot rendered, on both banks, for the entire visible
depth. That is a picket fence by construction, and no amount of tuning `step`/`floor` fixes it because the
tuning was never being read. Lesson: if a biome declares `comp` but has no dispatch branch, the rhythm is DOA
— grep the `writeMatrix` chain for the biome index before tuning congregation.

## The laws (Fable device critique)

**1. Rarity is budgeted IN-FRAME, not per-meter.** `stormstack` at `step 43` sounds rare, but the camera
sees 300–400m of corridor → 6–8 caps in frame. To read as "the one tall punctuation," a hero needs step
~**95–110** AND `floor 0` (present only on congregation peaks) AND a **landmark height tier** (≈1-in-3 draws
tower well above the rest — a family whose max height equals the mid props' has no dominant). Verify the count
in a *frame*, not per-meter — and on the PORTRAIT device, which compresses both banks into a narrower frustum
and shows MORE props per frame than a headless landscape shot.

**2. A breath must survive ~2 seconds at flight speed.** Congregation floors of 0.12–0.40 keep both banks
continuously occupied — the troughs exist in the math but are too shallow/short to read. Drop the workhorse
floors toward **0.04**, the glow carrier to **0**, and keep ONE low family (stumps) as the only floor — "low
rest is what silence looks like, not empty ocean." Sharpen the raised-cosine (`raised*raised`, the Lagoon
trick) so the weight collapses fast off the peak → genuinely empty water, ~150m of breath.

**3. The banks must SWAY, not beat together.** The classic congregation weight is a function of `dist` only,
so peaks hit both banks at the same z = a symmetric flume ride. Make the weight a function of `(dist, side)`
with a **per-side phase offset (~0.42 of a period)**: left-heavy headland, then right-heavy. The corridor
sways, forcing the eye across the lane — the Tsushima trick. This lifted rhythm 2 → **4/5** in one move.

**4. Zone by x, rake by height → a rising amphitheatre.** Four families interleaved in the same x-band sum
to noise. Give each family its own distance band and put TALL = FAR: low rests + wall near, tall stacks
pushed OUT so they form a skyline BEHIND the near rank instead of looming at even height over the lane.

**5. …but a gameplay-fairness constraint can override the art zoning.** Fable wanted the wall zoned to inner
18–28; the wall (`stormprow`) MUST hug the `|x|=13` death line (an owner-reported fairness fix — props frame
the side-death boundary or players die in open water with no wall). Resolution: keep the near wall + low
stumps at inner ~15, push only the TALL families out. The amphitheatre still forms; fairness is preserved.
When art direction and a gameplay constraint collide, the constraint wins and you find the composition that
honors both.

## What it unlocks / what's next
Rhythm/placement 2 → 4/5 (fence broken, breaths + sway confirmed). Vision 2.5 → 3/5 — composition is no
longer the ceiling; SURFACE/VALUE now is:
- **Aerial-perspective value ramp is FOG, not instanceColor.** Distance-to-camera changes every frame; a
  tint baked at spawn is stale the moment you approach, and per-frame instanceColor uploads cost CPU on weak
  mobile. Near-dark → mid-hazed → far-ghost is per-pixel, view-dependent — which is what fog already is.
  Darken tempestStone albedo (~25%) to widen the albedo→fogColor span, and bring the biome-7 fog haze in
  earlier over the mid-band. Reserve instanceColor for STATIC per-instance albedo jitter (±8–10% so no two
  prows share a grey), never for depth.
- Sockets still read flat at close range (recess + crank emissive/spill for pools at 15m); clamp the scour
  ladder's top tier off near-white; keep the mushroom cap in the stone value family (a warm-sunlit cap reads
  as a golf-tee hue break); cluster water foam near prop collars on the same congregation signal.
- A stray mid-lane stump cluster congregated toward nothing — bias `stackgrave` clusters to spawn within
  ~15m of a taller family member so rests attach to headlands.

## Determinism
`tempestComp` + the `bi===7` branch are PURE (no `rnd`), evaluated after the rotY init → `gold-determinism`
byte-identical. All families still clear `propclearance --ci`; band total dropped to 43k (bigger steps) so
`envcount --ci` stays green.
