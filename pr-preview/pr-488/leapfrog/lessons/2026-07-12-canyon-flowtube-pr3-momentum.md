# 2026-07-12 — Flow-tube PR-3: momentum (chain-driven slipstream)

**Why.** Owner flew PR-2 (the carve): *"fun, bones are there… could be a bit subtle."* The
carve is at the fairness ceiling (97% of the steering budget at `CANYON_V`), so it can't get
sharper without becoming unfair — the intensity has to come from a different axis. PR-3 adds
the STAKES that make the carve matter and turn up the felt intensity: a **chain-driven
slipstream**. Hold the carved line and the world rushes faster (slip 1.0→1.40); break it and
the world decelerates under you. The subtlety is answered by SPEED, not by a bigger weave.

**Did.**
- **`game.flowChain`** (int, `flowChainBest` for the recap). Builds: +1 per flow ribbon orb
  (`powerups.js` collect, gated `o.flow && canyonRun==='flow'`), +2 per ring / +3 perfect
  (`rings.js` collect — the gates are the slalom nodes). Drops: a MISSED ribbon orb halves it
  (new miss branch in `updatePowerups` — none existed; uncollected orbs just culled), a MISSED
  ring zeroes it (`rings.js` miss — the hard reset). Score-only, never health.
- **The slipstream** at the ONE seam `player.js` slipTarget: flow → `1 + slipPerChain·min(chain,
  cap)` (0.02×20 = 1.40, above spine's 1.325; the 400m exit buffer was already sized for it).
  **Co-scale is automatic** — `canyonSlip` already multiplies `targetSpeed` AND `steer`, and
  `assistAxes` divides by it, so every reachability ratio stays exactly valid. No new fairness
  math; the mode is fair by construction (the same guarantee spine's slip rides).
- **Felt FX for free:** slipstream wind keyed for flow (`main.js`); the speed-streak envelope
  (`fxEnv`) normalized by the ACTIVE run's slip ceiling (flow ramps to a different max than
  spine) and flowgate entries set `ribBandBk/Fw` so `spineWallPresenceAt` reports presence →
  the streaks fire as you accelerate. Score: orb bonus × `chainMult (1..×3)`, NOT × fever (the
  no-double-dip rule). Light HUD: a low-noise `FLOW ×N.N` milestone pop (the SPEED is the real
  feedback; a persistent meter is PR-4).
- **Resets:** the chain lives only within a flow run — zeroed on the run-end crossing, the
  `bossStart` flush, and `game.reset()` (`flowChainBest` kept for the recap).

**Determinism.** All of it is consumption-side gameplay state — `level.js` generation is
untouched, so `gold-determinism` is byte-identical and `canyonframe` holds. The orb `flow`
flag rides the non-fixtured `out.orbs` and is now plumbed through `addOrb` (it was dropped
before — the feasibility pass flagged this; the flag was inert in PR-1/PR-2 and turns
load-bearing here).

**Gotcha — you can't measure a DAMPED value in a headless behavioral test.** Headless
Chromium throttles `requestAnimationFrame` hard (the backgrounded tab runs the game loop at
~1–2 FPS), so `canyonSlip` (damped toward 1.40 at τ≈0.5s) only crept to ~1.10 in 1.2s of
wall-time — the sim barely stepped (dist moved 300→328). Two sub-lessons: (1) the input-less
dragon MISSES off-centre rings, which zeroes the chain — a real confound, so the test
re-injects `flowChain` each frame to simulate a player HOLDING the line; (2) assert the
coupling is ACTIVE (slip clearly ramps above the 1.0 no-chain baseline), not that it reaches
its ceiling — the ceiling is the formula + the human's preview. Don't gate CI on a
wall-clock-dependent damped value.

**Leapfrog.** The carve (PR-2) + the momentum (PR-3) together are the mode: *free carve at
max amplitude, priced in speed you feel build and drain.* This is where the owner judges
whether the subtlety is answered. Next: PR-4 (apex graze pylons + the visual identity + a
persistent chain meter), then the Aurora Shallows biome. The chain-slipstream coupling is the
reusable template for "hold a skill line → felt momentum reward, fair by co-scale."
