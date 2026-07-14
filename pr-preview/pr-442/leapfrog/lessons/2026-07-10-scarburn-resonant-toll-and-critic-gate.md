# KNELLGRAVE resonant on-toll release + SCAR-BURN (PR2b/PR3) — and the Fable critic gate that saved it

**What we did.** Added the endgame lance's earned escalation: a PERFECT on-tell manual
release (the volley's `perfect` flag) of ≥ `burnFloor` pips on a tier ≥ `minTier` boss
leaves a SCAR-BURN — an extra `frac × volleyTotal` paid over `dur` as scheduled DOT ticks
(`CONFIG.LOCK.scarBurn`, `fracBySlot.knellgrave 0.25`). Wired the resonant beat seam so a
manual loose lands on KNELLGRAVE's TOLL. Also FIXED two shipped PR2a blockers a retro
Fable critic found.

**The gate that made this PR good: two adversarial Fable critics.**
- **CP1 (pre-build)** demolished the design's FALSE PREMISE before a line was written:
  we (and the feasibility doc) believed `def.musicDies` → `getBeatClock()` null → `beatOn`
  always false → burn unreachable. **WRONG.** `musicKill()` (sfx.js) only zeroes the music
  BUS gain; `getBeatClock()` guards on `musicActive`, which it never touches — the beat
  scheduler stays live, so on KNELLGRAVE the generic `beatOn` was a ~40-70% coin-flip
  against a SILENT grid (a latent PR2a bug — a "perfect" proc rewarding luck). The honest
  beat is the boss's own TOLL. Verified in-engine: `beatOn` now toggles at ~7% duty (an
  earned window), not the coin-flip.
- **CP2 (retro, on merged PR2a)** found two real BLOCKERs the automated review missed:
  (1) a held bind/wound lock during the P5 survival card retargeted rider chips into the
  clapper-resolve seam, breaking the 30s survival exam in ~8s SEMI-PASSIVELY — because
  PR2a falsified a documented scoping invariant (`boss.js` "knellgrave has no lockParts")
  it never read; (2) the merge-fixup that lowered the wound put it ON the bound prisoner's
  head + in the dead-black mouth interior — branding the captive's face, the one thing the
  design forbids.

**The gotchas, written down (reusable):**
1. **`musicDies` ≠ beat-dead.** The scheduler runs under a muted bus. Any "on the beat"
   mechanic on a music-dead boss must key to a DIEGETIC pulse (the toll edge), not
   `getBeatClock()`. The toll edge: leading `chargeT ≤ beatWindow` (the toll fires at
   `chargeT→0`) + trailing `time − lastRealTollAt ≤ beatWindow`. Also suppress the
   grid-aligned cap fuse there. (The session clock is monotonic, so a stale
   `lastRealTollAt` can't falsely open the window at fight start.)
2. **DOT damage belongs in boss.js, not lockLayer** (which owns no game state). Route burn
   ticks through `damageBoss(amt, 'lockburn')` with **no `e`** so `routePartDamage` never
   runs — a 3s DOT must accrue ZERO part-crack hits (else free pane/shackle cracking on
   later bosses). GATE every tick on `!lockDeflected()` (pause on shield/survival — else
   the seal eats each tick with `shieldPing` spam and the damage is LOST, not paused).
   CANCEL burns on phase-transition/teardown (never leak a phase's ticks into the next
   pool).
3. **Adding lockParts to a boss can silently falsify a fairness invariant elsewhere.** A
   held lock retargets rider chip (`fireRiderShot` tags `part: aim.part`, forwarded to
   `e.part`). Any seam that assumed "no lockParts → chips are pose-centre" breaks. Fix:
   gate on `e.part == null`. **Grep the codebase's comments for the assumption you're
   invalidating** — the stale comment IS how the next PR ships the next leak.
4. **The static economy model has no camera and no fight state.** `lockdpsCore` will call
   an unreachable/overhead organ "capable" and a sealed survival phase "6/6". Verify
   aim-reachability + sealing in the real engine, per boss.

**What unlocks / guards it.** `tests/knellburn.mjs` (perfect release burns; non-tell
doesn't; the window is a bounded ~7% duty not a coin-flip). Strengthened
`tests/knellorgans.mjs` (full swing period + driven dread + the wound clears the prisoner's
head ≥ 2.5). `lockdpsCore` gained the SCAR-BURN model + invariants: burn ≤ frac×volley,
total ≤ (1+frac)×roiCeil, frac laws, and NOT-A-PHASE-DELETER (exploit-optimal on-tell spam
TTK ≥ card timer; KNELLGRAVE margins ~1.25). **The standing rule now in the plan (§6): every
rung PR gets a CP1 design critic + a CP2 diff critic; the human owner is the final gate on
any damage LAW.** Owner signed off the burn law + the resonant-beat behavior change.
