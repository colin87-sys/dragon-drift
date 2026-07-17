# ENG-E — ORGAN BREAK: parry a rib N× → it cracks off (`destructibleRibs`, the parry-per-part ledger)

**What we did.** The Colossi parry DEBUT (§5b slot 4), finally shipped: PERFECT-parry a MARROWCOIL
rib's amber 3× → that rib **cracks off**, and its amber volley + its constrict arc in the closing-ribs
dread are deleted for the rest of the fight. "Parry as sculptor." Retroactively makes the parry ladder
honest (HOLLOWGATE's shipped PANE BREAK was documented as a *reuse* of this debut that never existed).

**How (5 seams, all def-gated on `destructibleRibs`).**
- **Parry-per-part ledger** (`partParries` Map in boss.js, keyed by the amber's source-part tag string):
  the missing counter. Fed from `reflectBossBullets`' `snapParts` (perfect-only, deduped per roll) in
  the roll-parry consumer, ABOVE the V4 snap-paint loop (so a crack lands before `paintFromParry`'s
  liveness guard). +1 per rib per roll (never insta-crack). Distinct from `partHits` (shot damage) and
  Onewing's global `ghostFrameHits`.
- **`PART_SYS` third row `RIB_SYS`** with `counter:'parry'` + no `hit` hook — the **single-ledger law**:
  the reflected rib amber ARRIVES carrying its string tag, so without a guard it would double-book
  (parry ledger + shot ledger). `routePartDamage` gets one `if (sys.counter === 'parry') continue;`.
  Extracted the crack ceremony into `applyPartBreak(sys, idx)` so the shot path and the new `breakRib`
  path fire an identical break (pure extraction — pane/shackle behavior byte-preserved, proven by their
  existing tests staying green).
- **Model rib API** (bossMarrowcoil.js): the 10 pivots were named but had no crack API. Added
  `crackRib/ribAlive/liveRibs/ribCount/crackedRibCount` (mirroring the pane API) + a canonical index
  `ci` on each `ribPivots` record + a one-line constrict-skip (`crackedRibs.has(rb.ci) → continue`) so a
  cracked rib is hidden AND frozen — a permanent hole in the closing cage. No debris.
- **Deletion = emit-suppression + arc-freeze.** `emitRibBullets` skips dead ribs; the constrict loop
  skips them. NOT the `movingGap` gap-set — there's no rib→gap coupling in live code; that mapping is
  ENG-B/C.3b's job and MUST read `liveRibs()`. ENG-E ships the seam C.3b consumes, doesn't fake it.
- **The reachability fix (owner-approved feel change).** The plan's "rib-slam ambers" DON'T EXIST at
  station — rib-tagged ambers only fire in ribThread's ~2.9s window. So ORGAN BREAK was unreachable in
  the dread where it pays. Added `emitRibStrain(player)`: during the `closingRibs` hold (k∈[0.22,0.8],
  0.55s cadence) each live rib strains ONE slow amber. Crucially it uses `aimVelFrom(...)` to close
  toward the player NORMALLY — `emitRibBullets`' spine-convergence gives `vrel≈0` when the boss holds at
  rel 13 (bullets would hover). Owner also chose **perfect-only** (matches the same bullets' V4 snap).

**Gotchas.** (1) The plan was wrong about the code again (no rib-slam ambers) — a build-time drift, surfaced by the PRE-BUILD checkpoint; the owner made the feel call (add the strain volley). (2) A live-fight test block (`forceBoss`) must go at the END of the test file (needs a scene) — the model-tier crack asserts use a FRESH `buildBoss` handle so cracking can't perturb the clearance asserts below. (3) Perfect-parry classification is frame-sensitive → the CI parry loop uses `setDebugPerfectParryRel(reflectWindow)` (never frame-tight timing).

**Verify.** `tests/boss.mjs` **110** on clean runs — model API (crack/idempotent/hidden/liveRibs/
constrict-freeze), live loop (2 parries bank, the 3rd cracks → `bossRibBreak {rib:2,left:9}`, 4th is a
no-op over-crack guard). `bossboot` green. Every other boss byte-identical; pane/shackle suites green
(the `applyPartBreak` extraction is behavior-preserving). Two PRE-EXISTING flakes (karnvow footwork
~line 1626, embertide entrance ~1074) occasionally halt the first-failure suite — unrelated to ENG-E
(model-motion sims), confirmed on clean master; they want their own de-flake pass.

**Composes with ENG-A-R (just shipped):** the reflect now aims at the rib you rolled toward, and the
arrival routes damage by landing point — so **roll to aim your reflect at rib L1, parry to crack it.**

**Deferred:** C.3b/ENG-B authored rib-aperture `movingGap` (reads `liveRibs()`); ENG-G thread-scoring;
the C.4 holder-stagger / C.6 gem-shatter reuses of the `partParries` ledger (their own tags/thresholds).
If the strain volley plays too dense in the dread, the dial is `emitRibStrain`'s cadence (0.55s) or cut
§4a and accept ribThread-only reachability (the owner chose to ship it).
