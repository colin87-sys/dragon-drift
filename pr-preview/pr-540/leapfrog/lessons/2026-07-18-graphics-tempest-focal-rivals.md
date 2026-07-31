# Tempest Reach — focal-rival cleanup (the breach reclaims the value extreme), gated 4.3

**What we did.** After the composition fix, three elements sat in the storm-BREACH's value band and rivalled
the biome's focal (the one place the eye should rest). A Fable pre-assessment MEASURED all three, prioritised
by "composition-gain per unit risk", and I fixed them in that order with a Fable checkpoint after each. Result:
the breach is the clean value extreme again (Fable final **4.3/5**, "ship it"). Only two of the three needed
touching; the third was correctly LEFT.

Ordered outcome:
1. **Tafonihold gold sockets** (prop art, Tempest-only, ZERO gameplay stake) — the one rival actually
   *exceeding* the breach (measured L≈0.878 > breach 0.87). `accent[7]` emissive 1.5→0.9, `bakeSocketSpill`
   bloom 0.55→0.33 (×0.6). Checkpoint **4.3**.
2. **Phase-gate core** (fairness gameplay) — the pure-white additive locator #ffffff, dead-center under the
   breach. Cooled+dimmed to storm-white **#bfc6dd**, Tempest-only. Passed inside the final **4.3**.
3. **Pickups / speed orb** (global gameplay) — LEFT. Fable: hue-separated, transient, "signals grab-me not
   rest-here; dimming trades fairness for a hierarchy it doesn't break."

## The reusable techniques

**1. DROP VALUE, NEVER CHROMA, to un-rival a focal.** The tafonihold gold IS the biome's one warm accent
(the Tsushima "stolen gold" grammar) — desaturating it would kill the design. The fix was purely a VALUE cut
(emissive down, bloom down), hue held. Fable: the gold now "reads as embers in shadow — *more* Tsushima, not
less; it burns rather than washes to beige." A focal rival is almost always a VALUE problem, not a hue problem;
cut luminance and keep the color.

**2. A FAIRNESS element's peak brightness is LEGIBILITY — tint it, don't dim the safety layer.** The phase
gate's bright "window" is three things stacked: the pure-white core locator, the translucent fairness VEIL
(the player flies through it — dimming it trades safety for composition), and the breach seen through the arch
(that's the FOCAL itself, correctly framed like a Lorrain arch). Only the core was safe. The safe cut folded
BOTH the cool tint AND the ~0.82 intensity into the ADDITIVE core COLOR (#ffffff→#bfc6dd) so the per-frame
approach-ramp (the fairness "brighten as you near it" logic) is byte-for-byte untouched — legibility rides the
veil/edge/frame + the ramp, not the core's peak white. When a rival is fairness-locked, isolate the ONE
decorative sub-layer and hand the rest (veil/bar dimming) to the owner's playtest.

**3. MEASURE the rivals before touching them — the eyeball lies about which one wins.** The lumprobe pre-pass
ranked them: sockets 0.878 (above breach) > pickups 0.867 ≈ breach > gate core 0.79–0.82 (under). That order
set the priority AND caught that the sockets — the smallest element — were the actual offender, while the big
bright pickups were only a tie and the huge central gate was already under. Rank by measured peak, not by
apparent size. (Caveat: bright water sun-lane glints leak into any prop rect near the waterline — read the
rect MEAN for the prop and treat stray ~0.9 maxes as the sun-lane, not the prop.)

**4. NOT-CHANGING is a valid, defensible outcome.** The third rival (pickups) was global (every biome) and
gameplay-sacred (treasure-read). Fable rated it lowest-gain/highest-risk and, after steps 1–2, confirmed it
doesn't break the hierarchy — so it stayed shipped. The pre-assessment's "CHANGE or LEAVE, and why" framing
made the leave a deliberate design call, not an omission.

## What it unlocks

The Tempest focal hierarchy is clean: breach > everything. The pattern — Fable pre-assess (measure + prioritise
+ CHANGE/LEAVE) → value-only cuts → checkpoint each → hand fairness dimming to the owner — is the reusable
recipe for any "prop/UI element rivals the biome focal" note. The gate-core additive-color fold (tint+intensity
in one constant, ramp untouched) is the safe way to tone a fairness locator per-biome.
