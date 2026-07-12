# 2026-07-09 — Unleash legibility polish: read the FX from the rear chase cam, and a swoop is a voice

**Did / learned.** Owner playtest of the merged inhale/lunge pass (#317) surfaced five
feel bugs, all one class of problem — *the FX was correct in world-space but didn't READ
from where the camera actually is*:

1. **"Can't see much noticeable jade sparks gather."** The gather was small jade sparks
   converging on the launch shoulder — but the visible inhale ALSO swells a jade wing glow
   right there, so jade-on-jade camouflaged the whole effect from the rear chase cam. Fix
   (particles.js `gatherPulse`): spawn on a WIDER shell + `stretch 2.2→3.0` so each spark
   is a long inward STREAK (motion reads where a static dot vanishes into the glow); every
   3rd spark is white-hot `0xeafff6` (the luminance that cuts through a same-colour bloom —
   L195's white anchor, but promoted from one pip to a third of the volley); and the anchor
   became a **swelling white-hot convergence core** whose spawn size scales with the fuse
   (`0.34 + 0.6*k01`) — a small ember early, a bright bloom at cap, so the charge visibly
   INTENSIFIES. Config: `gatherCountBase 2→4`, `gatherRateHz 8→10` (a stream, not a stutter).
2. **"Bland white looking comets, needs pazzazz."** The wisp head/core white-wash
   (`flare = 0.2 + …`) desaturated the jade body toward white — the towed jade ribbon was
   there but dim. Fix: cut the constant white-wash `0.2→0.08` (bossBullets lance branch) so
   the jade body reads, and bump `ribbonHot 1.6→2.0` so the JADE tail carries the colour
   identity. The white core + hot head still anchor luminance (L195); jade is now the
   silhouette's colour, white is just its hottest pixel.
3. **"Yeah maybe try the acquire flash."** Added an ACQUIRE FLASH: the frame homing engages
   (`age` crosses `homeDelay`) the head flares bright + pops in size (`0.7*acq² ` on flare,
   `0.55*acq` on breathe, decaying ~0.3s) — the wisp's "eyes catch the prey."
4. **"Increase weave."** `wobbleAmp 0.55→0.85`, `wobbleHz 2.6→3.0` — a wider, tighter snake
   onto the brand. LAW held: `wobbleAmp < bossHitRadius/4 (1.05)` and it still decays to 0
   before arrival, so T-W2/T-W8 stay green.
5. **"Sounds like some monkey breathing… annoying."** `dwellHum` (the paint-acquire hum)
   was a `200→620Hz` gain-swelling glissando — a big swoop through the VOCAL range, and a
   swoop is a voice. Every reticle re-acquire re-triggered it, so moving the reticle made it
   "breathe." Fix (sfx.js): shrink to a quiet `300→430Hz` nudge at ~40% volume — a faint
   "closing-in" presence, not a swoop; the reticle fill + lockOn chime carry the real feedback.

**→ Systematize.** (1) **Legibility is camera-relative, not world-relative.** Before adding
any charge/telegraph FX, ask *what colour is already at that screen location from the
gameplay camera?* — the chase cam looks down the dragon's jade-glowing back, so a jade
gather there is invisible by construction. The fixes that worked were all luminance
(white-hot) + MOTION (long streaks) contrast, not more of the same hue. (2) **A frequency
SWOOP through 200–800Hz reads as a voice/creature**, no matter the timbre; a subtle
feedback hum should be a small nudge in a narrower band, and anything re-triggered by common
input (reticle move) must be cheap enough to hear 20× without annoyance. (3) **Promote the
white anchor when the colour layer fights a same-colour background** — L195 says tint the
colour layer and keep a white anchor; when the background IS the tint, widen the anchor
(1 pip → every 3rd spark) rather than abandon the hue.

**→ Leapfrog.** All five were pure presentation tuning behind the shipped laws — zero test
churn beyond re-running the battery (wisps 15/15 incl. T-W2/T-W8 with the sharper
`lungeProfile [0.4,1.6]`, wing-pose suites, boss 106/106, loudshots + tricount unchanged).
The "check the FX against the gameplay camera's local colour/luminance" habit is the reusable
win — it's why the gather now reads and why the next telegraph won't need a re-do.
