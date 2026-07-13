> ⚠ **SUPERSEDED by `2026-07-13-arena-msaa-off-the-real-60fps-lever.md`.** The *fill-bound* diagnosis
> below is correct, but the LEVER was wrong: a later on-device `?msaa0` A/B held 60fps at **full
> resolution**, so the shipped fix is now **MSAA-off in the arena (full resolution kept)**, not the
> resolution cap. The resolution cap survives only as an optional `?arenapr` fallback. Read this for the
> fill-vs-draw localization; read the superseding lesson for the actual fix and why MSAA (not resolution)
> was the right cut. Kept for the reasoning trail.

# Perf — arena dynamic resolution: the confirmed 60fps lever (the fire was fill-bound, not draw-bound)

**What we did.** The whole perf arc chased DRAW CALLS (wings 104→24, Phoenix 814→279, aux-pass thinning:
S3 heaven ~550→~252) — and the owner's 17 Pro Max **stayed at ~50fps**. That flat fps despite halving
the draws was the tell: the scene was never draw-bound. Two on-device A/Bs (from the `?pr=`/tier seams
we shipped for exactly this) proved it: **Low quality = 60fps easy** (tier 2 kills the composer +
resolution + fire overdraw), and — the clincher — **`?pr=1` on HIGH = 60fps** (halving ONLY the
resolution, keeping the full fire/bloom/god-rays). Verdict: **GPU FILL-RATE, and RESOLUTION is the
lever.** The final-boss detonation is a full-frame additive fire; the cost is the pixels it paints, not
the draws that submit it.

**The fix — arena-scoped dynamic resolution.** While `bossArenaMix() > 1.05` (the heaven), cap
pixelRatio to **~1.2** (`ARENA_PR_CAP`, `?arenapr=<n>` to tune), restored on exit. On the owner's dpr-3
device that's tier-1 1.5 → 1.2 = **×0.64 fill** on the composer + fire. Implementation:
- `effectivePR(tier) = arenaResActive ? min(PIXEL_RATIOS[tier], 1.2) : PIXEL_RATIOS[tier]`, used by
  `applyQuality`'s pixel-ratio writes.
- `setArenaRes(active)` flips it on heaven enter/exit — reallocs the composer/bloom/god-ray RTs ONCE per
  transition (masked by the unveil flash on entry / teardown on exit), guarded so it's a no-op when the
  cap doesn't bite the tier (dpr-1 devices, tier 2), and sets `skipQualityFrames` so the realloc doesn't
  feed the tier signal.
- Plus god-rays **24→16 samples at tier 1** (the march reads a quarter-res mask over broad columns — 16
  taps is indistinguishable) for a little more headroom.

**Why it's near-invisible.** This is the MOST resolution-forgiving frame in the game: soft, low-frequency
additive glow with no text, no fine edges, and bloom + the grading dither already mask resolution loss.
Everywhere else the game keeps full resolution; only the fire scene — where fill is the wall — trades a
notch of pixel density the eye can't catch on glowing fire.

**The headline lesson — when the optimization lands on its own metric but the TARGET metric doesn't move,
you're optimizing the wrong axis; re-localize before doing more of the same.** Halving draw calls with
zero fps gain proved draw calls weren't the wall — continuing (the depth-mask) would have been pure
waste. The re-localization for a GPU question MUST be an on-device single-axis A/B (`?pr` changes ONLY
pixel count) with a pre-stated expected delta, because SwiftShader can't measure fill. "Low = 60" plus
"`?pr=1` = 60" together isolate the answer to *resolution* in two readings. And the fix follows the
diagnosis exactly: the cost is per-pixel → scale pixels, in the one scene where it's forgiving.

**Corollary — dynamic resolution is the cleanest fill lever because it scales EVERY fill center at once**
(composer passes, bloom, god-ray march, the additive fire) with a single dial, and — unlike cutting the
art (dimmer bloom, fewer shafts, smaller corona) — it preserves the *composition* the owner signed off
on. Scope it to the phase that needs it; keep full resolution everywhere the frame is cheap.

**Verify.** A dpr-2 boot confirms pixelRatio **2 → 1.2 on heaven entry, 0 errors**; `smoke` + `bossboot`
+ `passbudget` (19/0) green. The `unmaskedarena` `auroraMix` schema-drift failure is **pre-existing on
master** (a prior aurora merge added `auroraMix` to `computeEnv` without adding it to `ARENA_ENV_KEYS` —
files this change never touches) and is flagged for its own follow-up. The 60 is the owner's on-device
confirmation: `?pr=1` already hit it, and the arena cap applies the same lever automatically. If 1.2
lands at ~55 rather than 60, `?arenapr=1.0` finds the max resolution that holds 60.

**Reusable.** For a fill-bound scene: confirm it with an on-device pixelRatio A/B, then apply **dynamic
resolution scoped to that scene** (a `min(tierRatio, cap)` gated on the scene's engage window, reallocating
once per transition under a masking flash) — it's the highest fps-per-visible-quality lever and keeps the
art intact, unlike trimming the effect itself.
