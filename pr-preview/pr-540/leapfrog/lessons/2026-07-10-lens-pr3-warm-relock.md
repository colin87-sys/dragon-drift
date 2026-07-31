# LENS PR3 — warm re-lock: dodging stops taxing the lock (relockWarmFrac 0→0.4)

## What we did
The final piece of the bullet-visibility work is NOT a pixel fix — it's attention economics.
The deepest reason a player "gets hit a lot" in a boss fight isn't only that bullets are hard
to see (PR1/PR2 addressed that); it's that the design *charged* them for prioritising the
dodge: weaving the aim-line off an organ to dodge and back cost the FULL `dwellTime` (0.35s)
to re-acquire, so defending was priced against offence.

`CONFIG.LOCK.relockWarmFrac: 0 → 0.4` (owner sign-off granted) activates a pre-existing,
previously-inert, owner-gated path (`lockLayer.js:218-220`): a WARM re-acquire — re-grabbing
an organ a held line recently let go of, within `relockMemoryS` (4.0s) — seeds
`dwellTime * 0.4 ≈ 0.14s` of dwell instead of starting from ~0. First acquisition still pays
full dwell; the discount is only on the weave-back. Also folded the #348 review's cleanup:
removed the unused `--lock-energy` CSS var.

## What we learned / how we verified
- **A gameplay change earns a direct behavioural proof, not just "gates green".** The lock
  layer is node-importable (`updateLockLayer(dt, player, ctx)`), so we drove the exact scenario
  headless with a minimal ctx (single candidate + a `model.partWorldPos` stub) and compared
  the two config values:
  - `frac=0.0`: hold→release→weave-back → re-grab dwell **0.048** (one frame, from zero)
  - `frac=0.4`: same → re-grab dwell **0.40**, `relock:true`; first acquire still hits **1.0**.
  That's the honest verification: the discount fires ONLY on the warm re-grab, and only partway.
- **The warm latch is per-organ, decided once on the acquisition frame** (`S.aimWarm =
  S.reLock[hit] > 0`, armed each held frame at `lockLayer.js:134`). So only organs you *recently
  held* are warm — a fresh organ still costs full dwell. `Math.max(dt, dwellTime*0.4)` with
  0.4 < 1 can never seed an instant lock.
- **Dwell gates WHEN a volley launches, never the projectile arrival frame** — the wisp
  arrival/kill-time laws rest on vrel/positions, so seeding dwell can't drift them (boss.mjs
  118 / wisps.mjs 15 stay green). Per-volley damage stays bounded by `volleyRoiFrac` regardless
  of how fast pips bank, so faster re-locks can't blow past the per-phase DPS ceiling.
- **No test pinned the 0-default** (`grep relockWarmFrac` → only `config.js` + `lockLayer.js`),
  so the flip needed no test edits. A boss.mjs run flaked once on an unrelated EMBERTIDE
  entrance assertion (`setEntrance(null)` scale.y) — reproduced NEITHER on re-run (3× clean 118)
  NOR on clean master; it's a known shared-geometry flake, not this change.

## The reusable pattern
- **Ship the wiring inert, flip the value later.** `relockWarmFrac` was built, guarded
  (`if (frac > 0 && aimWarm)`), and documented as `GAMEPLAY (owner sign-off to raise)` a whole
  epic before it was turned on. When the design finally called for it, the change was a
  one-line value flip with a pre-proven code path — the safest possible gameplay change.
- **For balance knobs, verify the CLAMP holds, not just the knob moves** — the ROI clamp is
  what lets a "faster re-lock" not become a "more damage" exploit.

## What it unlocks
- Completes the three-front bullet-visibility plan (legibility PR1, colour PR2, attention PR3).
- If 0.4 feels too sticky or not generous enough on preview, the same knob tunes to anywhere in
  `0–0.6` with zero code change; `linger 0.6→0.8` is the adjacent lever if a held line should
  also survive a slightly longer dodge.

## Verify
`boss.mjs` (118) · `wisps.mjs` (15) · `lab.mjs` (2) · `bulletcontrast.mjs` green. Direct
lockLayer driver confirms the warm re-grab seeds 0.4 dwell (vs 0.048 at the shipped 0) and the
first acquire is unaffected. Pre-existing unrelated failures: `lockdps.mjs`
(KARNVOW/ASHTALON lance-inert) and the EMBERTIDE boss.mjs flake — both reproduce on clean
master. Human judges on the PR preview whether the discounted re-lock makes dodging-while-
aiming feel fair rather than sticky.
