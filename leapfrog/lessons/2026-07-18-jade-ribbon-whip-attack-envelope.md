# Impulse layers need an ATTACK envelope — a full-amplitude birth is a single-frame teleport

**The bug.** After adding the movement-response whip pulse (Lever 2), the owner hit: *"soft gentle
movement follows well, but if I SNAP it left/right the whole body jumps and skips like stop-motion."*
Soft = smooth; aggressive = jumpy. Classic signature of a discontinuity gated on input speed.

**Root cause (found by measurement, not by eye).** The whip pulse's amplitude term was
`(1 − t/pulseLife)`, which is ≈1.0 at birth, and the spatial Gaussian crest starts at the neck
(arc≈0). So the frame a whip spawned, neck stations went 0 → ~`pulseAmp` (2.2u) in ONE frame — the
pulse was **born at full amplitude**. Soft moves never cross the steer-edge threshold (no whip →
smooth); every aggressive snap spawns a whip, and a rapid wiggle spawns one each 0.13s cooldown → a
run of ~2u single-frame pops = the stop-motion skip. A **second** hidden pop: the pulse pool
`shift()` on overflow (cap 4) evicted a still-live pulse mid-flight, dropping ~0.9u in one frame on
the 5th+ rapid spawn.

**The metric that made it objective (do this).** Per-frame max **body-relative** station displacement
(subtract the head's own translation so forward progress doesn't count). Then the anti-pop criterion
is the **spike ratio** = a frame's jump ÷ its neighbours' — ≈1 is smooth, large is a teleport among
quiet neighbours. Numbers: smooth weave 0.22/frame; hard snap **2.01 in one frame** among 0.08
neighbours (spike ratio ~25); isolated whip **2.16u** single-frame pop. This is `tests/ribbonsmooth.mjs`.

**The fix (Fable-directed, exact).**
1. **Smoothstep ATTACK on the whip envelope**: `a = min(1, t/pulseAttack); env = a·a·(3−2a)·(1 −
   t/pulseLife)` with `pulseAttack = 0.15s`. Grows from 0 → no birth pop. The envelope's peak
   *velocity* lands at ~τ/2 = 75ms, right on the "flick → wave runs down the body" beat, so
   readability is untouched (peak offset stays 2.48u). Don't go below 0.12 (pop returns) or above 0.18
   (beat softens). Hoist the per-pulse `env` out of the per-station loop (perf + clarity).
2. **Raise the pulse pool cap 4 → 8**: cooldown 0.13s × life 0.9s → ≤7 ever concurrent, so life-cull
   always wins and the mid-flight `shift()` eviction never fires in play. (Keep the shift as a pure
   safety net.)
3. **Rejected: a slew-rate clamp.** With 1+2 the worst case is 0.45/frame, under target; a clamp is
   order-dependent, distorts the wave, and would mask future regressions from the probe. The probe is
   the backstop, not a clamp.
4. **Rejected: relocating the birth aft of the neck / head-masking the pulse** — with the attack, the
   crest has travelled ~2 arc-u before the envelope saturates, so the pinned head only ever sees
   partial amplitude; a head mask changes the metric by exactly 0. (One-liner available if a neck
   hinge ever shows: `× min(1, i/headFade)`, as the swim uses.)

**Result.** Spike ratio smooth 1.00 · snap 1.03 · wiggle 1.13 (was ~25). Bare-whip spawn pop 0.30
(was 2.16), peak offset 2.48u (readability kept). Smooth weave unchanged (0.219). Stop-motion gone.

**Reusable takeaways.** (1) ANY impulse/event layer added on top of a continuous animation — a whip, a
hit-react, a spawned bump — must be **born at zero and ramped in** over an attack; a full-amplitude
birth is a one-frame teleport that only shows on fast/edge-triggered input (so it hides from gentle
testing). (2) Pool eviction of a *live* element is a second, sneakier single-frame pop — size the pool
so lifetime-culling always wins, or fade the evicted element out. (3) Measure smoothness as a
**spike ratio** (frame ÷ neighbours), not just a max — a large *smooth* motion (a genuine fast whip) is
fine; a large *isolated* frame is the bug. Encode it as a gating test so the whole response system
can't silently regress into stutter.
