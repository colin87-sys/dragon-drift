# LENS PR4 — focus-aware warm seed: fix the "a bit fast" without weakening dodge-and-reengage

## What we did
Owner played the PR3 warm re-lock (`relockWarmFrac 0.4`), liked the dodge-and-reengage, but
combat read "a bit fast." Rather than guess a lever, a Fable agent ran a DPS simulation
(`tools/lockdpsCore.mjs` + a warm-aware cadence extension) across the 6 lance-capable bosses.

**The finding reframed the problem.** The "too fast" was almost entirely a FOCUS interaction,
a units mismatch — not warm being "too strong":
- warm seed was `dwellTime × frac` = 0.14s (40% of the COLD need)
- but under focus the completion threshold is `dwellTime × focusDwellMult(0.5)` = 0.175s
- so the seed was 40% of the *cold* need applied against the *focus* need = an **80% discount**,
  collapsing a focused re-grab to ~4 frames (a near-instant teleport).
- warm WITHOUT focus was only a −13% TTK edge — a clean, feelable reward the player liked.

**The fix (one line, `lockLayer.js`):** scale the seed by the same focus multiplier the
threshold uses — `need = dwellTime × (ctx.focusHeld ? focusDwellMult : 1); aimDwell =
max(aimDwell, need × relockWarmFrac)`. Now it's always exactly `frac` of what you'd OWE:
- no-focus: seed 0.14, **14 frames — byte-identical** (dodge-and-reengage preserved)
- focus: seed 0.07 (was 0.14), **8 frames** (was ~4) — a true 40% discount, no teleport
- roster warm+focus TTK: −16% → −8%; the frac≥0.5 same-frame-lock **cliff is eliminated**
  (seed < need for any frac < 1, so the whole TUNE range is genuinely safe).

Also fixed the stale `tests/lockdps.mjs` balance gate (KARNVOW gained 5 trophy-charm lockParts
in CP2 → `lanceCapable=true, peakCap=5`, verified; the test still asserted it lance-inert).

## What we learned / the gotchas
- **Simulate before you pick a balance lever.** The three "obvious" levers all failed on data:
  `lanceDmg` is *cadence-blind* (doesn't touch the warm ratio at all, nerfs cold play, inflates
  score, pushes THRUMSWARM to 129/130 volleys); `dwellTime` is LAW, barely moves the ratio, and
  at 0.45 the cold rotation exceeds `relockMemoryS` and silently breaks warm continuity; global
  HP is cadence-blind AND does nothing on ROI-clamped phases (clamped volley scales WITH HP).
  The right fix was a 4th option the sim surfaced: a surgical units correction, zero global cost.
- **When two multipliers gate the same quantity, a discount must be expressed against the SAME
  base as the threshold** — else the discount silently compounds with the other multiplier. The
  bug wasn't the discount size; it was measuring it against the wrong need.
- **A stale test that's RED isn't "just noise" — it's a disabled guard.** The lockdps gate that
  was supposed to protect the ROI/cap invariants this whole epic leans on was red on an unrelated
  roster drift, so it wasn't actually running. Verify the fix empirically (KARNVOW `peakCap=5`
  from `allEconomies`) before rewriting the assertion, and make the new assertion guard BOTH
  directions (ashtalon inert AND karnvow capable) so it can't silently rot the other way.

## The reusable pattern
- **Delegate a balance decision to a measured DPS study, not intuition** — the sim's ratio-level
  conclusions were stable across three cadence models (±3 points), which is what made the
  surgical recommendation trustworthy.
- **Express a partial-credit seed as a fraction of the live threshold**, not a fixed constant, so
  it stays correct under every state multiplier and can never cross an instant-complete cliff.

## What it unlocks
- If the preview still reads a hair fast, the config-only second notch is `relockWarmFrac
  0.4 → 0.3` (no-focus −10%, focus proportionally) — the sim's fallback, no code change.
- The whole `relockWarmFrac` TUNE range is now cliff-free, so future tuning needs no re-derivation.

## Verify
Headless `updateLockLayer` driver: no-focus warm re-lock **14 frames / seed 0.14 (unchanged)**,
focus **8 frames / seed 0.07 (was ~4)**, seed = 40% of need in both. `tests/lockdps.mjs` now
**green** (5 checks) + `node tools/lockdps.mjs --ci` OK (14 bosses, KARNVOW now among the 6
lance-capable, ROI/beat/cap invariants hold). `wisps.mjs` (15), `lab.mjs` (2),
`bulletcontrast.mjs` green; `boss.mjs` 119 (the EMBERTIDE `setEntrance` entrance failure is the
known shared-geometry flake — passes on re-run, reproduces on clean master). Human judges the
final feel on preview: focused re-grab should read as a fast REWARD, not a teleport.
