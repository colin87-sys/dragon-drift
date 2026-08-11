# 2026-07-12 — Sky Canyon feel-v5: FX as a speedometer, and one envelope kills the 1/0

**Did / learned.** The speed-tunnel FX read as a binary switch — on when the slip mix was
up, off the instant it wasn't — because two separate things were wrong:

1. **Intensity was gated on the buff, not the motion.** `updateSpeedStreaks` read
   `player.speed` only for streak *direction*; opacity was `0.75·mix²` where mix was the
   slip mix. So a tunnel glide and a full orb-boost looked identical. Fix: derive a
   `sn = clamp((speed − SN_LO)/(SN_HI − SN_LO), 0, 1)` normalized over the tunnel's REAL
   dynamic range (`base×ramp` → `orbSpeed×ramp×slip`, so it auto-rescales when the slip
   dial moves), then drive streak **length** (`0.5 + 0.8·sn`, the strongest "I'm
   accelerating" cue) and **opacity** (`env·(0.35 + 0.65·sn)`) off it. `player.speed`
   already damps toward its target at `speedEase 5`, so the field inherits a smooth
   build/ease from real acceleration with zero extra plumbing.
2. **The FADE was gated on a spatial hard-edge.** Leaving the tunnel, `spineWallPresenceAt`
   tapers over 25m — at ~130 m/s that's 0.19s, so *presence*, not the slip decay
   (τ=0.5s), killed the FX → an abrupt off. Same 1/0 seam in the CSS lines, which
   *branched* between two opacity formulas at `fx > 0.01`.

The fix for BOTH fades is **one smoothed envelope** computed once in main.js:
`fxEnv += (fxMix − fxEnv)·(1 − exp(−(fxMix>fxEnv ? 6 : 1.8)·dt))` — fast attack (~0.3s),
slow release (~0.9s) — and EVERY consumer (streaks, CSS lines, aberration, vignette,
flutter) reads `fxEnv`. Two load-bearing details: (a) keep sampling presence while
`fxEnv > 0.01` (not just while slip is up) or the envelope can't decay after slip hits
zero; (b) the CSS-line seam dies by replacing the branch with `max(outsideFormula,
tunnelFormula)` where the tunnel term scales by `fxEnv` — continuous by construction,
degrades exactly to the plain formula at `fxEnv=0`.

**→ Systematize.** Two laws. (1) **A "speed" FX must read the speed, not the flag that
turned it on.** Gate intensity on a normalized `player.speed`, and normalize over the
*local* dynamic range (the HUD's `(speed−base)/(orb−base)` saturates at 80 m/s — useless
inside a 150 m/s tunnel; compute a range that spans what actually happens there). (2)
**One damped envelope beats N per-effect gates** — attack/release asymmetry (fast in,
slow out) is what turns a switch into a swell, and driving every effect from the single
scalar means they ignite and fade *together* with no per-effect seam. The trap is a
downstream gate (spatial taper, formula branch, visibility cutoff) that fires faster than
the envelope — route those through the envelope too, or soften them to ride it down.

**→ Leapfrog.** `fxEnv` is the reusable "how hot is this moment" scalar for any future
intensity-ramped set-piece (boss phase, fever, dive). And the `SN_LO/SN_HI` local-range
normalize is the pattern for any speedometer FX in a sub-arena whose speeds exceed the
global HUD range.
