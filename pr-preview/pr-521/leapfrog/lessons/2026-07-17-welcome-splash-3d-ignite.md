# Welcome+Hub build, increment B: the 3D ignite — one gated envelope drives every layer

**What we did.** Built the plan's committed signature IGNITE (§0.5 a/b/c + §1.2a) — the moment the
splash dragon *reacts*: a one-shot wing DOWNSTROKE + a rim/key LIFT + a subtle camera PUSH toward the
subject, fired ~1.2s after the splash shows (co-timed with the wordmark resolve), reading as ONE
dragonfire event. Touches `dragon.js` (the two 3D layers), `cameraController.js` (the push),
`splash.js` (the timeline), `main.js` (wiring + force-clear).

**The load-bearing pattern — ONE envelope, TWO consumers, in the same function scope.** The wow needed
both a wing move and a rim lift co-timed. Rather than two subsystems, a single module timer
`igniteBeatT` (set by `igniteDragonBeat()`, decayed in `updateDragon`) yields one `igniteBeat01` =
`sin((1−t/DUR)·π)` (0→1→0 over 0.7s) computed early in the frame and read by BOTH the wing pose
(`rootFlap += igniteBeat01*0.5`, line ~1144) AND the rim (`rimStrength *= 1+igniteBeat01*0.10`, ~1789).
Because `updateDragon` is one big function, a `let` computed before the flap block is still in scope at
the rim block 600 lines later — no plumbing. Co-timing is free: both layers ride the same envelope.

**The rig fact that made layer A cheap.** `rootFlap` (dragon.js:1123-ish) is the MASTER elevation that
every *classic* wing path reads — `wingParts` (the STARTER, the new-player first impression), the
JADE lobe fan, and the direct-pivot fallback all derive from it; positive `rootFlap` = wings DOWN
(apex convention). So a single additive one-shot on `rootFlap` gives a real downstroke on the starter
with zero per-path work. (The `yoke`/`skinned` paths read `solveWing(phase,…)`/`flapWing` instead, so
their wing layer no-ops for now — rim + camera + the CSS god-ray still fire; a phase-side driver is the
follow-up if a yoke dragon must ignite its wings too.)

**Byte-identical-off, the L245 endpoint law, held three ways.** `igniteBeat01`/`pushZ` are 0 until the
splash sets the timer, so `rootFlap + 0*0.5`, `rimStrength * (1 + 0*0.10)`, `z − 0` are the shipped
values exactly — the roster is untouched in play. Verified by construction + the guards.

**Gotchas / audit corrections baked in.**
- **Audit blocker #3 — the splash camera push is NOT a `punchKick()` reuse.** `punchKick`'s envelope is
  consumed only in the chase branch *after* the splash `return`, so calling it under splash no-ops. The
  push had to be a net-new decaying term folded into the splash branch's own `position.set` (a
  sin-enveloped ~0.85u dolly returning to the locked pose). Confirmed against the code, not assumed.
- **Audit blocker #4 — the beat can never bleed into a run.** `dragon.js` has no `game` import, so the
  gate is discipline, not a state check: `igniteBeatT` is set ONLY by the splash and force-zeroed by
  `clearIgniteBeat()` in `startGame()`. `splash.js` also cancels the pending timer on `hideSplash()`, so
  a takeoff before 1.2s never fires the beat into gameplay.
- The beat's *feel* (does it read as a dragonfire event?) is explicitly a class-C **owner-preview**
  check — the ~0.7s transient is hard to catch in a settle-time screenshot; trust the geometry + gate
  the look on the live preview, per the plan's escalation ladder (head-turn → deepen → god-ray swap).

**What it unlocks.** The splash now has the committed subject-driven wow the Fable gate fought three
rounds for, on a clean warm splash. Next: §1.3 full reveal cadence + early affordance, then §2 the
returning-player pop-in.
