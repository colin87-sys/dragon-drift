# 2026-07-16 — Stiletto I4: rendering UV-orchid under ACES, and the socket eye

**Did / learned.** Built the head (draconic skull-mask + horn-gauge antennae + eye-shells),
the barbed needle stinger + venom channel, and the deterministic swell-and-cull DRIP TICK
(a guarded ≤10-line dragon.js block keyed on nullable `parts.dripBead`, `?dripPin` for
captures). The whole-creature Fable gate failed the first cut (3.8) on two registry tells
and passed the revise (4.3). Two durable lessons:

1. **A bright emissive rendered under ACES desaturates toward WHITE — an "orchid" hex
   renders hot-PINK, and it CLIPS.** My venom fills used the lock's orchid hex as both
   diffuse AND emissive at high intensity (1.7). The gate measured the glow at G≈131, R≈B
   (washed hot-pink) with **551 near-white pixels** (a white-smear). Three coordinated
   fixes landed it on true violet-orchid with **zero** white pixels and **B−R = +46**:
   (a) **dark diffuse + blue-dominant emissive** — the warm studio key light was lighting
   the fill's *diffuse* and pinkening it; a near-black diffuse (`0x140424`) with the orchid
   on the *emissive* channel removes that, so hue is carried purely by emission; (b)
   **moderate intensity** (1.7→~1.0) so the emissive stays below the ACES desaturation knee;
   (c) **a THIN meniscus** — the near-white surface line must be a small-AREA highlight, not
   a broad bright band, or Surge blooms it to a white field. General rule: **to render a
   saturated hue, put it on the emissive of a DARK-diffuse material at moderate intensity,
   and keep bright near-white to tiny areas.** ACES caps how blue a bright glow can render
   (~300° magenta, not 288° violet) — accept the ceiling; going bluer reads indigo.

2. **"Volume, not intensity" is also the anti-desaturation lever on Surge.** Cranking the
   fill emissive by `surgeGlowMultiplier` on Surge re-introduced the white clip (bright →
   desaturated). Setting the fills' `userData.flareIntensityWeight` LOW (0.3) makes them
   barely brighten on Surge — they hold their saturated cruise orchid — and the Venom
   Overdrive escalation is carried by the small-area components that CAN go bright (bead +
   channel igniting), the eyes, the motes, and the screen wash. This is exactly the lock's
   "the fill LEVEL is the read, not intensity," now understood as a *rendering* constraint,
   not just a design preference.

3. **A glowing gem reads as a floating diamond until it sits in a RECESSED socket.** A flat
   camera-facing quad (or a very flat octahedron) is the floating-diamond tell. A ring of
   dark-chitin bevel facets with the **outer rim proud + the inner rim SUNK** (so the wall
   self-shadows) framing a less-flat octahedron in the recess reads as a crafted eye-socket.

**→ Systematize.** Any saturated emissive judged under an ACES/filmic tonemap: dark diffuse
+ hue-on-emissive + moderate intensity + small near-white core. Any "it glows brighter on
the super" element: brighten only SMALL-area components; hold large-area fills at cruise
intensity (low `flareIntensityWeight`) so they don't desaturate. Any glowing gem: seat it in
a self-shadowing recessed socket, never a proud flat facet. Measure hue as **B−R and G**,
and count near-white pixels — those numbers catch the pink/white drift a "looks magenta"
eyeball misses. The studio's warm key deliberately stresses this; verify the true cool look
in-game (`surgeshot`/pilot screen), where the tan is absent.

**→ Leapfrog.** All five parts now pass their craft gates. I5 is the ladder + the test
battery: the BREWING growth (sacFill 0.05→1.00, waist tightening, hind pair budding, drip
staging) is already dial-driven per form, so I5 asserts the monotonics + the anti-SPINDLE +
posture + firewall, adds the full capture set, and ships. The orchid-under-ACES recipe is
now the template for every future emissive-accent dragon.
