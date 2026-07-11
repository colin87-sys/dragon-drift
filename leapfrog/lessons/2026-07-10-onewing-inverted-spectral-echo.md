# ONEWING rung 12 — the INVERTED spectral echo, and the free-ghost the model must SEE

**What we did.** Gave ONEWING (slot 12, tier 4) its lance rung: the player dwell-paints the dead
twin's fused FRAME (two organs — `frameGroup` + a new low `frameRoot`), and the FIRST mark on each
grants a half-strength GHOST pip on the living eye — "mark the dead half, the living half answers,"
two ghosts so pips arrive in pairs (cap fills to 6). The ghost strikes at `echoDmgMult` (0.5), earns
no burn, and dies with the frame. Owner picks: two ghosts; honest sacrifice (breaking the frame
kills the lance too). Verified: `onewingorgans` (comfort/geometry), `onewingecho` (grant + half),
`lockdps` (economy + no phase-deleter), `boss.mjs` 123.

**The design had to INVERT — the eye can't be a paint organ.** The plan's original rule ("brand the
living eye, echo onto the frame") is unbuildable: on a scale-1.9 wing above a station of 13, the eye
sits at world-Y **26–32, permanently above the aim ceiling (22)** — a static economy model would
happily call it reachable (the PR2a Y-law trap the ledger warns of). The CP1 pre-audit caught it and
inverted: **paint the frame (low, comfortable), the eye is the GRANTED echo target** — a `fireLanceAt`
homed pip needs no aim cone, so an unaimable node is a fine echo *target*, never a dwell *source*.
Lesson: an above/below boss's focal organ is usually out of the lane — put the DWELL organs low and
let the grant reach the high one.

**The pure-ghost simplification (why a boolean was safe where a count was warned).** The CP1 warned
`grantedStacks` must be a COUNT, not a boolean, because a granted pip on a part the player can ALSO
dwell-paint mixes real+ghost stacks and corrupts the one-entry-per-part ledger. But we put the
echoes on the EYE, which is never a dwell organ — so the eye entry is ALWAYS pure-ghost, no mixing,
and a boolean `lk.ghost` is provably safe. **Choosing the echo TARGET to be a non-paintable node
dissolved the whole grantedStacks-count problem.** `grantEchoPip` refuses to stack onto a non-ghost
entry as a belt-and-braces guard.

**The ROI clamp on EFFECTIVE pips.** A ghost fills the pip cap (echoes reach full faster) but strikes
at half. If the clamp priced raw pips, a clamped volley would DROP when echoes were added (6 in the
denominator, 5 pips of damage). Fix: `releaseVolley` clamps on `effPips = real + echoMult·ghost`, so
the clamped volley is exactly `roiCeil` and the echo adds damage only up to the ceiling — never a
breach, never a dilution. Non-echo bosses have no ghost stacks ⇒ `effPips === pips` ⇒ byte-identical.

**The term the deleter model MUST see: a free ghost RAISES DPS beyond its pip count.** Ghosts cost NO
dwell time (a frame paint grants them), so the not-a-phase-deleter DPS charges time for REAL pips
only while the effective volley includes the half-ghosts. Without an echo term, `lockdpsCore` counts
painted pips only and the deleter gate passes VACUOUSLY (the exact SCAR-BURN dead-invariant trap —
`def.echoPips` existed nowhere). Added the term; it immediately bit: at `burnFrac 0.35` the P5
full-release landed at **exactly 1.00** (TTK == timer, the deleter boundary). Dialed the burn to
**0.30** → P5 1.04 (the CP1's predicted margin; weftwitch-like profile 1.13/1.94/1.42/1.11/1.04).
**The echo is ONEWING's escalation, not the burn** — so the burn is the dial, never the ROI law. Also
found the plan's span table stale (P2 atFrac moved 0.78→0.86 → P1 is a thin 76-HP phase); recomputed
against the live def. P5/P4/P1 remain thin — a HARD owner playtest GO gate, like weftwitch's.

**The honest-sacrifice coupling wired three ways.** Breaking the ghost-frame (4 parries) must (a)
drop both frame organs' banked pips AND the eye's echo anchor (`dropLockPart` ×3 at the break —
lance → near-zero), (b) delist them from painting afterward (`lockPartDead` frame branch — the nodes
still resolve with `visible=false`, so without it the reticle leads to a frame that fell off), and
(c) `frameRoot` is a `frameGroup` CHILD so it falls with the frame for free. And `felledLie` needed a
`lockDeflected` line (`felledLieT > 0 → true`) or you lance a boss playing dead and every pip is
voided with a shieldPing (the one-deflect-rule violation the burn ticks already avoided).

**Gotcha, again: guard `def?.x` in every event listener.** The `lockPaint` echo trigger read
`def.echoOrgans` unguarded → the lock UNIT test (fabricated ctx, no boss) threw `Cannot read
echoOrgans of null`. Same trap the Codex reviewer caught on the mend hook. Any `on(...)` listener
that can fire with no active boss must optional-chain `def`.

**What the CP2 diff critic caught (all folded before ship):**
- **A new damage rule must be taught to ALL release paths, not just the one you edited.** The echo
  halving lived in `releaseVolley`, but the lance has THREE release paths — and the **Surge fork**
  (`surgeForkLances`, via `consumeAllLocks`) priced every pip flat, so banked ghosts fired at FULL
  strength there (+26% vs the honest path; a strict "Surge your ghosts" incentive nobody designed).
  `consumeAllLocks` even stripped `lk.ghost` from its return. Fix: carry `ghost` through, mirror the
  effPips/ghostDmg math in the fork. **When you add a per-pip property, grep every consumer of the
  pip list** (`releaseVolley`, `surgeForkLances`, `consumeAllLocks`, the burn seam).
- **Free + free = too free: exclude parry-snap from the echo.** A perfect-parry snap paints the
  frame for ZERO dwell; letting it ALSO grant a ghost double-frees the razor P5 margin (the deleter
  model prices echoes against *dwell* marks). Gate the echo on `!p.snap`. The snap still paints a
  real pip — it just doesn't echo.
- **A terminal state must be gated against the sealed windows AND telegraphed.** The 4-parry
  frame-break ran during the `felledLie` fake death (enrage bullets from a "dead" boss, sealed pips
  deleted, forfeit path bypassed) — gate the bank on `felledLieT <= 0`. And a defensive player
  parrying ghost ambers (which also HEALS) was silently forfeiting the whole lance rung — the
  "GHOST STAGGER n/4" note now names the stake ("BREAK IT AND YOUR LANCE ENDS").
- **Filter dead organs in BOTH the aim list and the paint list.** `lockPartDead` was wired into
  `paintableParts` but not `lockCandidates` — and ONEWING is the first boss whose ENTIRE candidate
  set can die (frame-break, no virtual organ), so the reticle stayed live on the fallen frame
  (resolving with `visible=false`), could green, and held the rider chip-rate bonus on a corpse.
- **Reasoned ≠ verified — the couplings that shipped untested were exactly where the bugs were.**
  D3/D4 lived in the frame-break + felledLie paths the first pass only *reasoned* about. Extracting
  the break into one `breakGhostFrame` body + three debug seams (`bossBreakFrame`/`bossFelledLie`/
  `bossLanceState`) made the honest-sacrifice and the seal testable end-to-end (`onewingbreak.mjs`).
- **Hand-synced model/runtime constants need a cross-assert.** `echoPips` (model) and `echoMax`
  (runtime) are the same number in two files; a drift makes the deleter gate under-model the
  exploit. One assert in `lockdps.mjs` binds them.
