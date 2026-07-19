# 2026-07-18 — SUNBREAK I2.5: "I don't notice it" — the trigger is the event, and adaptation kills the state

**Did / learned.** After I1 (world dim) + I2 (dragon ignition cascade) both passed machine + Fable
gates, the OWNER kept saying "barely notice the Surge" / "still don't see it on Vesper." Chasing it
uncovered two systemic misses that a passing static gate hid, both now fixed (final Fable harsh
critic **PASS 4.4/5**):

**Miss 1 — the trigger fired almost nothing.** All the I1/I2 work was *gradual* (world eases down over
0.9s, dragon emissive ramps over 0.9s). The actual trigger instant did only a tiny bloom bump +
a leftover magenta particle puff — **no slow-mo, no flash, no camera punch.** On a dragon whose body
barely lights (Vesper is a silhouette by design; the Sovereign's gold is static; the Tempest's surge
is its own storm circuit) there was nothing bold to catch the eye. Fix: **the trigger must be an
EVENT, and the event must be UNIVERSAL** — screen-space + time, dragon-agnostic: a brief slow-mo
HITCH (0.72× for 0.26s — you *feel* the world stutter), a 1-frame flash+bloom+lift punch, a camera
kick. These carry the moment on any dragon because they don't depend on the dragon lighting up. The
slow-mo hitch is the single strongest "you will notice this" lever, and it's colorblind-proof
(it's *timing*, not hue).

**Miss 2 — adaptation eats a static state.** The critic's sharpest note: a static −0.4 EV world dim
is legible in a side-by-side still, but in play human vision **adapts within seconds** — 10s into an
8s+ surge, "darker world" becomes the new normal and stops carrying information. **A static drop is
an onset cue, not a state cue.** Transients beat states for perception. Fix: the SNAP (115% overshoot
in 400ms) is the right *onset*, and a slow ~0.22Hz **breathe** on the sustained grade is the *state*
tell — a RELATIVE signal the eye can't adapt to. This is why the owner "stopped seeing it" mid-surge
even though the machine measured a strong drop.

**Miss 3 (earlier this increment) — the cascade was designed in the wrong camera.** The eyes-first /
eyes-last cascade was invisible in the REAR-CHASE play view (eyes face away). Rebuilt around the
dorsal silhouette, travelling toward the camera, climaxing on the tail. (Its own lesson:
`2026-07-18-surge-i25-rear-chase-cascade.md`.)

**→ Systematize.** Three rules for any "power state" FX:
1. **The trigger is an EVENT; make the event UNIVERSAL.** A gradual state-change is not felt — pair it
   with a transient screen-space + time punch (slow-mo/flash/kick) that reads regardless of the
   subject's own brightness. Verify on the WORST subject (a silhouette), not the best.
2. **A static state adapts away — give sustained states a RELATIVE (breathing/pulsing) tell**, not
   just a fixed offset. Onset = transient (snap); sustain = slow oscillation. ~0.2Hz, small amplitude,
   photosafe.
3. **The OWNER's "I don't notice it" outranks a passing critic gate.** Two Fable gates passed static
   captures while the *played* feature under-registered. Static-frame verification and even a
   greyscale name-the-beat test can pass a feature that motion + adaptation + subject-variance make
   invisible in play. Add the play-camera + a "would a distracted player mid-flight notice this
   START and still feel this STATE 10s later?" check to the gate.

**→ Leapfrog.** The ambient layer now announces itself (event) and sustains (breathe) on every dragon.
This is the correct foundation for the I4 combat ultimate — which is a *bigger* version of the same
grammar (a louder trigger event → a held state → a release). The universal-trigger-juice pattern
(slow-mo hitch + flash + kick, gated by frequency/owner-dial) scales directly into I4's CALL beat;
the adaptation lesson means I4's held-breath APEX is a *transient* by nature (good) but its longer
sustains need the same relative-tell discipline.
