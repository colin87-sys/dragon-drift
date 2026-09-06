# Vertical lunge/spasm — a velocity-driven POSE must be gated on a slow-attack/fast-release copy

**The report.** After the ribbon movement-response work, the owner: *"lateral is much improved, but
UP/DOWN makes the dragon LUNGE or SPASM."* Soft vertical = fine; aggressive up↔down mashing = the
whole dragon jerks.

**Root cause (Fable-assessed, code-grounded — NOT the ribbon).** The shared flight controller in
`dragon.js updateDragon` pitches the whole group from vertical velocity AND drives cinematic
dive/climb POSES off a plain smoothstep deadzone:
`diveAmount = ss(9,16,-vy)`, `climbAmount = ss(8,16,vy)`, and `group.rotation.x ← vy*0.022 +
posturePitch`. The code comment says the poses should fire only on a *sustained* drop/rise — but a
deadzone has **no notion of "sustained"**, so a fast up↔down mash keeps crossing it and FLIPS the
poses every ~0.35s. Crucially the flip is bigger than the nose: `diveAmount`/`climbAmount` also feed
`aero01` (wing **tuck**), `spread01` (wing **spread**), the **flap-rate gate**, and a tail term — so a
reversal flips the whole wing silhouette and stutters the wingbeat. That compound flip is why it reads
as a *spasm*, not a rock. (The ribbon body is exonerated: it holds the head's world path via the
inverse-group-quaternion fold and does not rigidly pitch with the group.)

Proportion: ~55% the pose flip (nose + wings + flap), ~40% the raw `vy*0.022` pitch coupling, ~5%
ribbon anchor/whip residue.

**The fix (Increment 1 = A + B, ~6 lines, roster-wide).**
- **A — gate the poses on a slow-engage/fast-release smoothed vy:** a NEW `vyPose` state (do NOT reuse
  `vySmooth`, which defines `vertJerk` for the spine whip):
  `vyPose = damp(vyPose, vy, Math.abs(vy) > Math.abs(vyPose) ? 3 : 7, dt)` then
  `diveAmount = ss(9,16,-vyPose)`, `climbAmount = ss(8,16,vyPose)`. Slow engage (τ≈0.33s) means a mash
  attenuates `vyPose` below the deadzone → **poses never engage while mashing**; a committed dive/climb
  still fully commits ~0.4–0.6s in; fast release (τ≈0.14s) relaxes promptly on pull-out. This also
  calms the wing tuck/spread + flap gate for free.
- **B — feed the pitch coupling from `vySmooth` (already computed) not raw `vy`:** halves the nose-rock
  on a mash while leaving soft/slow vertical untouched (gain≈1 there). Keep `head.rotation.x` + rider on
  raw `vy` so the head still noses into the input instantly (input still *reads*).

**Roster-wide, not jade-gated** — it's a shared-controller defect (jade's long body just exposed it
first), it implements the comment's already-stated intent, and steady state is byte-identical.

**Proof (`tests/pitchslew.mjs`, replicates the controller math, OLD vs NEW).** Rapid mash: peak pitch
rate **3.32 → 1.04 rad/s**, swing **0.99 → 0.29 rad**, pose engagement **1.00 → 0.001** (never flips).
Committed dive: still commits (diveAmount 1.00 by t=1.2s), steady pitch **0.0%** change (drama
preserved). Soft input: poses never engage, pitch max Δ **0.038 rad** (essentially unchanged). All
ribbon suites + starters still green.

**Residual (correctly-scoped follow-up, jade-only).** With the pitch calmed, the remaining vertical
body motion is the ribbon tracing an aggressive up/down PATH + the vertical whip pulses — now fluid,
not a rigid pose flip. If the owner still finds it busy, tune the jade-gated `rib.sim.pulseAmp` /
whip cooldown (the vertical whip is `pulseAmp*0.7`), NOT the shared controller.

**Reusable takeaways.** (1) ANY smoothstep/threshold POSE driven by a velocity must be driven by a
**slow-attack/fast-release smoothed copy** of that velocity, or fast reversals flip it — a deadzone
alone can't express "sustained." (2) Trace ALL downstream consumers of a pose signal before fixing —
here the same dive/climb value drove nose + wings + flap, so clamping only the nose rotation would have
left the spasm. Fix the signal at the source. (3) When a shared-controller change is roster-wide, prove
roster-safety numerically: steady-state (sustained pose) unchanged + soft input unchanged, alongside
the bug metric dropping.
