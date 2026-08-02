# Jade ribbon — making it RESPOND to input (idle-duck + whip pulse), and the forward-runner ceiling

**The complaint.** Owner loved the silky idle motion but: *"If I move left/right/up/down it doesn't
respond — it just coils idly. Moving right should make the body trail like a gymnast's ribbon
reacting to her hand."* Had Fable (high-effort, code-grounded) assess feasibility + plan, then built
the recommended first increment.

## The feasibility verdict (important framing)
A **literal** world-space gymnast ribbon — the body sweeping across the stage in big arcs — is
**not attainable** in this game, for two structural reasons, and it's worth stating so we don't chase it:
1. The chase cam **must** keep a 35–65 u/s forward-runner near screen-center to be playable, so the
   *world-translation* component of trailing (the "hand moving across the stage") is cancelled on screen.
2. At game speed the head crosses a **whole body-length in 0.2–0.37s**, so the body can only ever hold
   the last fraction of a second of steering history — physically a shallow ~34° diagonal viewed
   nearly end-on from behind. The ribbon's memory is too short and too straight at speed.

What **is** attainable is the *perceptual signature* of that ribbon — **contrast, edge-event, lag,
overshoot, settle** — the cues the eye uses to infer "I caused that." That's how kite tails / Panzer
Dragoon / Ori fake it: don't simulate the stage, exaggerate the four cues. The build had **zero** of them.

## Root cause (found by reading the code, not the screenshots)
The input response (`driveX/driveY`) **added to the same idle swim wave's amplitude** — steering just
made the coil *bigger*, rendered in the identical visual vocabulary as the idle. Cause and effect were
**indistinguishable by construction.** Plus the follow-the-leader is an exact geometric sampler: no
overshoot, and overshoot-and-settle is the single strongest "I did that" cue.

## What we built (Levers 1+2, the recommended first pair)
- **Lever 1 — idle-DUCK for contrast.** A smoothed `|steer|` (`steerMag`, fast attack ~0.12s / slow
  release) fades the always-on idle swim to ~35% while steering: `latAmp = swimAmp*(1−0.65·steerMag) +
  driveX`. The idle look is **untouched at rest**; input now owns a motion budget idle never touches.
  This is the enabler — every other response cue is illegible against a full-volume idle.
- **Lever 2 — input-edge WHIP pulse.** A sharp steer **edge** (onset OR reversal, detected as a
  per-frame Δ in normalized steer, with a 0.13s cooldown) spawns a travelling Gaussian bump born at
  the neck, propagating tail-ward (`pulseSpeed` ~14 arc-u/s, `pulseAmp` ~2.2, fading over `pulseLife`
  ~0.9s). A small pool (≤4) so a mashed stick can't stack pulses. This is the "flick it and a wave
  runs down the body" beat a passive trail physically can't make at these speeds. Signed by the edge
  direction; lateral along binormal + a weaker vertical along normal so it works L/R **and** U/D.

Both live inside `updateRibbonSim`'s post-frame block (`ribbonSpine.js`); the drive/edge detection is
in the `dragon.js` ribbon tick. `ribbonWhip(rib, bAmp, nAmp)` is the spawn API.

## The metric that made it objective (do this for feel work)
Fable's "complaint as a number": **rear-body peak deviation while steering ÷ at idle.** It was ~**1.0**
(the complaint), target ≥2.5. After Levers 1+2 (with the existing steer-curl) it measures **4.26×**
(idle 1.09 → steer 4.65) — locked in `tests/ribbonmotion.mjs`. Turning a vague "feels stiff/unresponsive"
into a scalar let us prove the fix headlessly before rendering a single frame.

**Fable feel-gate: 4.3/5 PASS** — *"the core complaint is dead… a directional, neck-born,
tail-travelling reaction with correct mirroring on reversal."* Judged on step-edge filmstrips from a
fixed-lateral tracking cam (`tools/_ribbonresp.mjs`) — the chase cam re-centers the dragon and hides
world trailing, so a tracking-cam capture is the right diagnostic for movement response.

## Remaining plan (levers 3–6, not yet built)
Ranked by impact-for-effort, for when the owner wants more: **3** lateral-history exaggeration
(amplify the perpendicular component, tail-weighted, ~1.7–2×, with a length-constraint pass); **4**
camera complicity (let the head drift off-center ≤10% briefly on a steer edge, playability-gated);
**5** spring-overshoot chain (per-station under-damped springs → whip-past-and-settle, the biggest
feel but fights length conservation — do last); **6** head-leads pose (bank/yaw the head harder into
turns). Fable's noted next bottleneck: the edge beat is weaker in the *chase cam* (small,
foreshortened, and occasionally bloomed out by the pickup ring-flare) — a small immediate head/neck
counter-snap at the edge would make frame-zero read at play scale.

**Reusable takeaways.** (1) For "responds to my input" feel, the response must be in a DIFFERENT visual
vocabulary than the idle — ducking the idle for contrast is the cheap enabler, and an EDGE event
(spawned on d(input)/dt, travelling) reads as causation where a slowly-growing offset never will.
(2) In a forward-runner with a locked chase cam, literal world-trailing is impossible; sell the
*cues* (contrast/edge/overshoot), not the simulation. (3) Encode the feel complaint as a headless
ratio so you can iterate against a number, and capture movement-response from a tracking cam, not the
re-centering chase cam.
