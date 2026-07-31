# COMFORT ≠ REACHABILITY — and the idle yaw-wobble projects forward organs sideways

**What we did.** Owner playtest on the WEFTWITCH preview: "the hand locks are WAAAY too close to
the border — so easy to die acquiring them. Bring them medially. Same with the old brineholm."
Fixed her palm lock-organs to sit COMFORTABLY inside the lane instead of at the kill wall, and
upgraded the reach test from an "aimable-at-all" law to a "comfortable" law.

**The reframe that mattered (CP1).** The old `weftorgans.mjs` guarded `X_REACH = laneHalfWidth 13
+ coneXY 2.6 = 15.6` — the widest an organ can sit and still be *hittable*. But an organ at 15.6
is hittable ONLY by a player touching the ±13 instant-kill wall. **"Reachable" is not "fun."** The
real law is a COMFORT band: `X_COMFORT = laneHalfWidth − coneXY − 2.0 slack = 10.4` (playerRadius
1.2 + 0.8 twitch), so the acquire point sits ≥5 m off the wall. This formula was ALREADY shipped —
it's the BRINEHOLM fence from the same-day boss-feel batch (`worst ≤ laneHalfWidth − coneXY − 2`);
we just generalized it. **When two fences measure the same thing, share the formula, don't invent a
second standard.** (BRINEHOLM was in fact already compliant — its holdSway fix merged hours earlier;
"the *old* brineholm" was a pre-fix build. We verified provenance and did NOT re-touch a same-day,
owner-validated tuning — the "if it contradicts how it was described, surface it" rule.)

**The bug was a lock organ that FLEES the player.** Her gaze term (`bossWeftwitch.js` hand X) added
`gazeEX*3.0` with **no `sx`**, so BOTH hands shifted toward the player's side — the near (chased)
palm ran OUTWARD toward the wall as you moved to acquire it. Fix: cap the near hand's OUTWARD drift
(`Math.sign(gz)===sx ? sx*Math.min(|gz|,0.3) : gz`) while the FAR hand keeps its full inward sweep
(the "she watches you" read survives; the hood + loom still track). **A lock organ must never move
AWAY from the acquiring player faster than they can close — that's an un-winnable chase.**

**The gotcha the CP1 arithmetic missed — verify, don't trust the model.** The audit priced the palm
as `pose.x + scale·HAND_X`, predicting worst-case ~10.3. Measured: **11.0**. The missing 0.7 was the
global **idle yaw-wobble**: `placeGroup` spins EVERY boss `rotation.y = sin(t·0.5)·0.12`, and that
±0.12 rad projects the palms' **forward** offset (`HAND_Z 4.6`) into ±0.72 **lateral** world-X
(`scale·HAND_Z·sin(0.12)`). The measured localX spread (6.70→7.80) was exactly `7.3·cos(yaw) ±
4.6·sin(yaw)`. **A far-FORWARD organ is thrown SIDEWAYS by any facing wobble — a boss's yaw couples
Z-offset into X.** No static position audit catches it; only driving the live fight does.

**The reusable pattern — def-scale the shared idle motion (the holdSway sibling).** Just as "an island
shouldn't strafe" gave BRINEHOLM a `holdSway` override, "an anchored LOOM shouldn't yaw-wobble like a
flying dragon" gave WEFTWITCH `idleWobble: 0.3` (a scalar on the placeGroup wobble amps, `?? 1` =
byte-identical for every other boss). This attacked the exact term that broke budget WITHOUT moving
the hands (HAND_X stayed at the silhouette-safe 7.0 — below ~6.8 the palms merge into the mantle).
Final worst-case **10.2** (was ~12.6+ at the wall); acquire point ~7.6, a comfortable 5.4 m clear.
Note the alignment trap: her sway `sin(t·0.5)` and the wobble `sin(t·0.5)` share a phase — they PEAK
TOGETHER, so the worst case is their simultaneous sum; calming both compounds.

**The test-honesty law (why the old test was green on a broken fight).** The old ruling deferred the
chase to "a playtest judges the FEEL" and measured a NATURAL fight with **no player** — so the gaze
coupling that CAUSED the bug never fired in CI (the ENG-EW `debugHold` lesson: a gate that never
exercises the load-bearing variable manufactures a green). The rewrite DRIVES the real player against
each wall (`window.__dd.player.position.x`, the honest coupling input — gaze reads it) and samples
**≥1 full sway period** (freq 0.5 → 12.57 s; sample >14 s or you miss the peak). **If a comfort/feel
law depends on a player-coupled term, the test must move the player — never pin the coupling.**

**Owner still judges FEEL.** 10.2 sits 0.2 inside the 10.4 law; the number is deterministic (no RNG
in sway/yaw/gaze) so the gate is stable, but whether it FEELS comfortable is the owner's call on the
next preview. If it wants more room, the dials are idleWobble 0.3→0.2, holdSway 0.5→0.4, or the gaze
cap 0.3→0.15 — never widen the 10.4 law to pass. (Owner playtested it: GOOD.)

**What the CP2 diff critic caught (all folded before merge):**
- **The rewritten test was still half-theater.** The near-palm checks fired the coupling, but the
  FAR-palm "stays comfortable" checks PASS with gaze dead (base 9.1 < 10.4) — they distinguished
  nothing, the exact false-green the rewrite existed to escape. Fix: assert the far palm is dragged
  INWARD (min|x| ≤ 7, live ~5.1 vs dead ~8.4) and read back `player.position.x` to prove the pin
  held. **A coupling test must assert the coupling MOVED something, not just that a bound held.**
- **A big dramatic recoil and an acquirable organ are mutually exclusive near a wall.** The
  thread-cut "hands thrown APART" (`cutEase`) flings a palm to ~13 (the wall) during the strike
  window — and there's a dedicated boss.mjs test guarding that the throw is BIG. You can't bound the
  position (kills the drama + fails that test) AND keep it acquirable. Resolution = the eye-seal /
  mend-anchor precedent: **let it fly, but DROP it from the paint set while flung** (`model.handsFlung`
  → `paintableParts` recoilOrgans), so the central anchor (loomHeart) is the only target and a palm
  lured to the wall is never acquirable. Gate on the model's LIVE recoil state (cutEase>0.5), not a
  boss.js timer — it auto-clears as the recoil settles, no reset bookkeeping, and the test asserts
  both the mid-recoil seal (paintables == [anchor]) AND the transient REJOIN.
- **The P5 dread-card GO gate is now MORE load-bearing, not less.** Comfort removes the hidden
  real-play slop of wall-hugging palms, so live throughput moves toward the headless model's
  optimum (which reads no geometry, so its ~1.08 margin didn't budge). Re-judge P5 on the preview.
