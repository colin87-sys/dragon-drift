# Flyby rocks — rebase phases on the ENGAGE rising edge (no giant rock at the encounter start)

**What we did.** The deep-birth fix (07-14 overhead lesson) made the rocks *recycle* from far specks, but the
owner still saw "a giant rock at the start." A Fable pass found the remaining hole and it's a general one.

**The bug — a perpetual conveyor has no "start."** Overhead (and side) flyby rocks ride a time-driven loop:
`arg = time·spd + phase`, `p = frac(arg)`, size `= size·k·env` where `k` is the arena ENGAGE ramp (0→1) and
`env` only fades the `p≈0/1` endpoints. The recycle-birth was moved into distance, but the ENGAGE moment
wasn't: when `k` rises, whichever rock happens to be at `p≈0.7` is already at the near end of its approach —
metres from the camera, huge — and the engage ramp just scales it in *in place*. A boulder fades in
already-giant. The earlier lesson's law ("a fade/scale-in only reads as an approach if it happens where the
object isn't yet visible") was applied to the recycle but not to the encounter opening.

**The lesson — an ever-running animation loop still needs an explicit START pose when its container becomes
visible.** A perpetual conveyor is seamless *while running*, but the frame it first appears is arbitrary in the
cycle — and "arbitrary" includes "right in your face." Anything that fades/scales a looping system into view
(an engage ramp, an unhide, a level transition) must **rebase the loop's phase to a chosen start pose on the
rising edge**, or the first impression is a coin-flip over the whole cycle.

**The fix — one-shot phase rebase on the engage rising edge, no new plumbing.**
- Detect the edge locally from the existing engage level: `const rising = lastK === 0;` captured *before*
  `lastK = k` (the `k<=0` branch already zeroes `lastK`, so teardown/restart re-arms it — stateless-source
  compatible, self-healing, no `engageTime` global needed).
- On `rising`, set each flyby's phase so `p` starts at a chosen far pose `P0`:
  `d.phase = mod1(P0 − time·d.spd)` (then `arg = time·spd + phase ≡ P0`). Overhead → `P0 ∈ {0, 0.045, 0.09}`
  (all far specks; the incommensurate speeds stagger the first dives ~13/18/27s). Side → `0.10 + 0.55·(i/5)`
  (far→mid band, first whoosh ~5–6s, none born near-camera).
- The phase jump changes `cyc = floor(arg)` so the per-pass re-roll fires and deals a fresh track — free.

**Invariant-inert by construction.** `phase` never enters the y-placement (size-independent bottom), the
lane/drift math, or the baked `debrisFlybyMarginY` / distinctness-ledger floors — so marginY 2.0, the ledger
(Δlane 7 / Δdrift 0.06 / Δspeed 0.017), the split, and `debrisMinX ≥ 25` are all untouched. It's a one-time
offset, not a gate (gating size to the far cycle would *freeze* a rock mid-path and break the seamless loop —
rejected). `?oldstart` A/B seam; also skipped under `?oldovh` (which must reproduce the pre-fix build).

**Verify.** smoke + bossboot zero-error; `unmaskedarena` invariants green (phase isn't asserted). **Owner
judges on the real GPU:** no rock above speck-size in the opening ~10s, and the engage→first-whoosh→first-dive
choreography (if the ~13s first dive feels slow, `OVH_START_PHASE` is the one-number dial). A bonus fell out:
the opening now *choreographs* — blast blooms, first side whoosh ~6s, first overhead dive ~13s = escalation,
not clutter.
